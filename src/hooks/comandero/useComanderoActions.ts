'use client'

import { useState } from 'react'
import { Table, Order, Restaurant, CartItem } from '@/types/database.types'
import { TableStatusType } from '@/components/comandero/TableSelector'
import { PendingServiceCall } from '@/types/comandero.types'

interface UseComanderoActionsParams {
  slug: string
  restaurant: Restaurant
  serverOrders: Order[]
  setServerOrders: React.Dispatch<React.SetStateAction<Order[]>>
  pendingCalls: PendingServiceCall[]
  setPendingCalls: React.Dispatch<React.SetStateAction<PendingServiceCall[]>>
  setTableCarts: React.Dispatch<React.SetStateAction<Record<string | number, CartItem[]>>>
  setTablePax: React.Dispatch<React.SetStateAction<Record<string | number, number>>>
  setTableStatuses: React.Dispatch<React.SetStateAction<Record<string | number, TableStatusType>>>
  setSelectedTable: (table: Table | null) => void
  tables: Table[]
  syncServerData: () => Promise<void>
  attendedCallIdsRef: React.MutableRefObject<Set<string>>
  seenCallIdsRef: React.MutableRefObject<Set<string>>
  attendedValidationOrderIdsRef: React.MutableRefObject<Set<string>>
  readyOrderAlert: string | number | null
  setReadyOrderAlert: (val: string | number | null) => void
}

export function useComanderoActions({
  slug,
  restaurant,
  serverOrders,
  setServerOrders,
  pendingCalls,
  setPendingCalls,
  setTableCarts,
  setTablePax,
  setTableStatuses,
  setSelectedTable,
  tables,
  syncServerData,
  attendedCallIdsRef,
  seenCallIdsRef,
  attendedValidationOrderIdsRef,
  readyOrderAlert,
  setReadyOrderAlert,
}: UseComanderoActionsParams) {
  const [validatingOrderIds, setValidatingOrderIds] = useState<Set<string>>(new Set())
  const [deliveringOrderIds, setDeliveringOrderIds] = useState<Set<string>>(new Set())
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [orderSentToast, setOrderSentToast] = useState(false)

  // Marcar llamada como atendida (Servidor + Local con State Lock)
  const handleAttendCall = async (callId: string) => {
    attendedCallIdsRef.current.add(callId)
    seenCallIdsRef.current.add(callId)
    setPendingCalls(prev => prev.filter(c => c.id !== callId))

    try {
      await fetch('/api/service-calls', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, callId }),
      })
    } catch (e) {
      console.error('Error attending call:', e)
    }
  }

  // Entregar un ticket o comanda individual específica (No-optimista con OCC)
  const handleDeliverSingleOrder = async (orderId: string, tableNum?: number | string) => {
    if (deliveringOrderIds.has(orderId)) return

    setDeliveringOrderIds(prev => new Set(prev).add(orderId))
    const targetOrder = serverOrders.find(o => o.id === orderId)
    const expectedVersion = targetOrder?.version

    try {
      const res = await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          orderId,
          status: 'delivered',
          table_number: tableNum,
          expected_version: expectedVersion,
          actor_type: 'waiter',
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setServerOrders(prev =>
          prev.map(o => {
            if (o.id === orderId) {
              return data.order
                ? { ...data.order, table_number: tableNum || data.order.table_number }
                : { ...o, status: 'delivered', version: data.version ?? (o.version ? o.version + 1 : 1) }
            }
            return o
          })
        )
        if (tableNum && readyOrderAlert?.toString() === tableNum.toString()) {
          setReadyOrderAlert(null)
        }
      } else if (res.status === 409) {
        console.warn(`[handleDeliverSingleOrder] Conflicto OCC 409 en orden ${orderId}. Reconciliando...`)
        await syncServerData()
      } else {
        console.error(`[handleDeliverSingleOrder] Error entregando orden ${orderId}:`, res.status)
        await syncServerData()
      }
    } catch (e) {
      console.error('Error de red al entregar orden:', e)
      await syncServerData()
    } finally {
      setDeliveringOrderIds(prev => {
        const next = new Set(prev)
        next.delete(orderId)
        return next
      })
    }
  }

  // Marcar todos los platos listos de la mesa como entregados
  const handleMarkDelivered = async (tableNum: string | number) => {
    if (readyOrderAlert?.toString() === tableNum.toString()) {
      setReadyOrderAlert(null)
    }

    try {
      const activeOrders = serverOrders.filter(
        o => (o.table_number?.toString() === tableNum.toString() || o.table?.table_number?.toString() === tableNum.toString()) &&
             (o.status === 'ready' || o.status === 'preparing' || o.status === 'pending')
      )

      for (const ord of activeOrders) {
        await handleDeliverSingleOrder(ord.id, tableNum)
      }
    } catch (e) {
      console.error('Error marking all delivered:', e)
    }
  }

  // Validar comanda de comensal y enviarla a cocina (No-optimista con OCC)
  const handleValidateOrder = async (orderId: string, tableNum?: number | string) => {
    if (validatingOrderIds.has(orderId)) return

    setValidatingOrderIds(prev => new Set(prev).add(orderId))
    attendedValidationOrderIdsRef.current.add(orderId)

    const targetOrder = serverOrders.find(o => o.id === orderId)
    const expectedVersion = targetOrder?.version

    try {
      const res = await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          orderId,
          status: 'pending',
          table_number: tableNum,
          tableNumber: tableNum,
          expected_version: expectedVersion,
          actor_type: 'waiter',
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setServerOrders(prev =>
          prev.map(o => {
            if (o.id === orderId) {
              const effectiveItems = (data.order?.order_items && data.order.order_items.length > 0)
                ? data.order.order_items
                : (o.order_items || [])
              return data.order
                ? { ...data.order, table_number: tableNum || data.order.table_number, order_items: effectiveItems }
                : { ...o, status: 'pending', version: data.version ?? (o.version ? o.version + 1 : 1) }
            }
            return o
          })
        )
      } else if (res.status === 409) {
        console.warn(`[handleValidateOrder] Conflicto OCC 409 en orden ${orderId}. Reconciliando...`)
        await syncServerData()
      } else {
        console.error(`[handleValidateOrder] Error en validación de orden ${orderId}:`, res.status)
        await syncServerData()
      }
    } catch (e) {
      console.error('Error de red al validar comanda hacia cocina:', e)
      await syncServerData()
    } finally {
      setValidatingOrderIds(prev => {
        const next = new Set(prev)
        next.delete(orderId)
        return next
      })
    }
  }

  // Descartar/cancelar comanda de validación
  const handleCancelValidationOrder = async (orderId: string, tableNum?: number | string) => {
    attendedValidationOrderIdsRef.current.add(orderId)
    const targetOrder = serverOrders.find(o => o.id === orderId)
    const expectedVersion = targetOrder?.version

    try {
      const res = await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          orderId,
          status: 'cancelled',
          table_number: tableNum,
          expected_version: expectedVersion,
          actor_type: 'waiter',
        }),
      })
      if (res.ok) {
        setServerOrders(prev => prev.filter(o => o.id !== orderId))
      } else {
        await syncServerData()
      }
    } catch (e) {
      console.error('Error al cancelar comanda:', e)
      await syncServerData()
    }
  }

  // Anular plato marchado
  const handleCancelSingleOrder = async (orderId: string, reason: string) => {
    try {
      await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, orderId, status: 'delivered', notes: `[ANULADO: ${reason}]` }),
      })
      setServerOrders(prev => prev.filter(o => o.id !== orderId))
    } catch (err) {
      console.error('Error cancelling order:', err)
    }
  }

  // Marchar segundos platos retenidos a la cocina
  const handleFireSecondCourses = async (tableNum: string | number) => {
    const tableOrders = serverOrders.filter(
      o => (o.table_number?.toString() === tableNum.toString() || o.table?.table_number?.toString() === tableNum.toString())
    )
    const fireableOrders = tableOrders.filter(o => o.status === 'pending' || o.status === 'ready')
    for (const ord of fireableOrders) {
      await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, orderId: ord.id, status: 'preparing' }),
      })
    }
    setOrderSentToast(true)
    setTimeout(() => setOrderSentToast(false), 2500)
  }

  // Marcar mesa como cobrada y liberarla
  const executeCloseAndFreeTable = async (tableNum: number | string) => {
    try {
      await fetch('/api/tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, table_number: tableNum, action: 'free' }),
      })

      setTableCarts(prev => {
        const next = { ...prev }
        delete next[tableNum]
        return next
      })

      setSelectedTable(null)

      window.dispatchEvent(new CustomEvent('fluxo_table_freed', { detail: { tableNumber: tableNum } }))

      const tableCalls = pendingCalls.filter(c => c.table_number.toString() === tableNum.toString())
      for (const c of tableCalls) {
        await handleAttendCall(c.id)
      }

      setServerOrders(prev => prev.filter(o => o.table_number?.toString() !== tableNum.toString()))
      setTableCarts(prev => ({ ...prev, [tableNum]: [] }))
      setTableStatuses(prev => ({ ...prev, [tableNum]: 'free' as TableStatusType }))
    } catch (e) {
      console.error('Error freeing table:', e)
    }
  }

  // Transferir comanda y pedidos a otra mesa
  const handleTransferTable = async (fromNum: string | number, toTableNum: string | number) => {
    if (!fromNum || !toTableNum || toTableNum === fromNum) return
    try {
      await fetch('/api/tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          table_number: fromNum,
          action: 'transfer',
          to_table: toTableNum,
        }),
      })

      setTableCarts(prev => {
        const copy = { ...prev }
        copy[toTableNum] = copy[fromNum] || []
        delete copy[fromNum]
        return copy
      })

      setTablePax(prev => {
        const copy = { ...prev }
        copy[toTableNum] = copy[fromNum] || 2
        delete copy[fromNum]
        return copy
      })

      const target = tables.find(t => t.table_number.toString() === toTableNum.toString())
      if (target) setSelectedTable(target)
      setOrderSentToast(true)
      setTimeout(() => setOrderSentToast(false), 2500)
    } catch (err) {
      console.error('Error transferring table:', err)
    }
  }

  // Envío de comanda de sala a cocina
  const handleSendOrderToKitchen = async (
    selectedTable: Table | null,
    cart: CartItem[],
    discountPct: number
  ) => {
    if (!selectedTable) {
      alert('Por favor selecciona una mesa antes de enviar la comanda.')
      return
    }

    if (cart.length === 0) {
      alert('La comanda está vacía.')
      return
    }

    setIsSubmitting(true)
    const rawTotal = cart.reduce((sum, item) => {
      if (item.is_complimentary) return sum
      const price = item.product.price_type === 'weight'
        ? item.product.price * ((item.weight_grams || 300) / (item.product.price_unit === 'kg' ? 1000 : 100))
        : item.product.price
      return sum + price * item.quantity
    }, 0)

    const totalAmount = discountPct > 0 ? rawTotal * (1 - discountPct / 100) : rawTotal

    try {
      const formattedItems = cart.map(item => {
        const formattedNotes = [
          item.is_complimentary ? '[🎁 INVITACIÓN DE LA CASA]' : '',
          item.weight_grams ? `[⚖️ ${item.weight_grams}g]` : '',
          item.selectedPills && item.selectedPills.length > 0 ? `[${item.selectedPills.join(', ')}]` : '',
          item.notes ? item.notes : '',
        ].filter(Boolean).join(' ')

        return {
          product_id: item.product.id,
          quantity: item.quantity,
          notes: formattedNotes || null,
          product: item.product,
          course: item.course || 'first',
          is_complimentary: item.is_complimentary || false,
          weight_grams: item.weight_grams,
        }
      })

      await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: restaurant?.slug || slug,
          restaurant_id: restaurant?.id || '',
          table_id: selectedTable.id,
          table_number: selectedTable.table_number,
          total_amount: totalAmount,
          items: formattedItems,
          discount_percentage: discountPct,
          created_by: 'waiter',
          status: 'pending',
        }),
      })

      setOrderSentToast(true)
      setTableCarts(prev => ({ ...prev, [selectedTable.table_number]: [] }))
      setTimeout(() => setOrderSentToast(false), 3500)
    } catch (err) {
      console.error('Error al enviar comanda:', err)
      setOrderSentToast(true)
      setTableCarts(prev => ({ ...prev, [selectedTable.table_number]: [] }))
      setTimeout(() => setOrderSentToast(false), 3000)
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    validatingOrderIds,
    deliveringOrderIds,
    isSubmitting,
    orderSentToast,
    setOrderSentToast,
    handleAttendCall,
    handleDeliverSingleOrder,
    handleMarkDelivered,
    handleValidateOrder,
    handleCancelValidationOrder,
    handleCancelSingleOrder,
    handleFireSecondCourses,
    executeCloseAndFreeTable,
    handleTransferTable,
    handleSendOrderToKitchen,
  }
}
