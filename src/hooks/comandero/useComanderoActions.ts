'use client'

import { useState } from 'react'
import { Table, Order, Restaurant, CartItem, OrderStatus, Product } from '@/types/database.types'
import { TableStatusType } from '@/components/comandero/TableSelector'
import { PendingServiceCall } from '@/types/comandero.types'
import {
  isDessertItem,
  isDessertReady,
  isStarterItem,
  isMainItem,
  TAG_STARTER_READY,
  TAG_STARTER_SERVED,
  TAG_MAIN_FIRED,
  TAG_MAIN_READY,
  TAG_MAIN_SERVED,
  TAG_DESSERT_FIRED,
  TAG_DESSERT_READY,
  TAG_DESSERT_SERVED,
  mergeItemNotes,
  hydrateOrderItemsWithCatalog,
  areAllOrderCoursesDelivered,
} from '@/lib/course-utils'

interface UseComanderoActionsParams {
  slug: string
  restaurant: Restaurant
  products?: Product[]
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
  recentMutationsRef: React.MutableRefObject<Map<string, { status?: OrderStatus; order?: Order; until: number }>>
  mutationLockUntilRef?: React.MutableRefObject<Map<string, number>>
  freedTableNumbersRef?: React.MutableRefObject<Map<string | number, number>>
  prevOrdersMapRef?: React.MutableRefObject<Map<string, Order>>
}

const MUTATION_LOCK_MS = 4500

export const getStaffHeaders = (slug?: string): Record<string, string> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-staff-pin': '1234',
  }
  if (typeof window !== 'undefined') {
    const sessionToken =
      localStorage.getItem('fluxo_staff_session') ||
      sessionStorage.getItem('fluxo_staff_session') ||
      (slug ? sessionStorage.getItem(`fluxo_staff_session_${slug}`) : null)
    if (sessionToken) {
      headers['Authorization'] = `Bearer ${sessionToken}`
    }
  }
  return headers
}


export function useComanderoActions({
  slug,
  restaurant,
  products = [],
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
  recentMutationsRef,
  mutationLockUntilRef,
  freedTableNumbersRef,
  prevOrdersMapRef,
}: UseComanderoActionsParams) {
  const [validatingOrderIds, setValidatingOrderIds] = useState<Set<string>>(new Set())
  const [deliveringOrderIds, setDeliveringOrderIds] = useState<Set<string>>(new Set())
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [orderSentToast, setOrderSentToast] = useState(false)

  const lockOrderMutation = (orderId: string, payload: { status?: OrderStatus; order?: Order }) => {
    const until = Date.now() + MUTATION_LOCK_MS
    mutationLockUntilRef?.current.set(orderId, until)
    recentMutationsRef.current.set(orderId, { ...payload, until })
  }

  const releaseOrderMutation = (orderId: string) => {
    mutationLockUntilRef?.current.delete(orderId)
    recentMutationsRef.current.delete(orderId)
  }

  // Marcar llamada como atendida (Servidor + Local con State Lock)
  const handleAttendCall = async (callId: string) => {
    const callToAttend = pendingCalls.find(c => c.id === callId)
    attendedCallIdsRef.current.add(callId)
    seenCallIdsRef.current.add(callId)
    setPendingCalls(prev => prev.filter(c => c.id !== callId))

    try {
      await fetch('/api/service-calls', {
        method: 'PATCH',
        credentials: 'include',
        headers: getStaffHeaders(slug),
        body: JSON.stringify({ slug, callId }),
      })

      if (callToAttend && (callToAttend.call_type?.startsWith('bill_') || callToAttend.text?.toLowerCase().includes('cuenta'))) {
        window.dispatchEvent(new CustomEvent('fluxo_table_bill_paid', { detail: { tableNumber: callToAttend.table_number } }))
        if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
          const bc = new BroadcastChannel('fluxo_menu_channel')
          bc.postMessage({ type: 'table_bill_paid', slug, tableNumber: callToAttend.table_number })
          bc.close()
        }
      }
    } catch (e) {
      console.error('Error attending call:', e)
    }
  }

  // Entregar un ticket o comanda individual específica (con lock de mutación en vuelo)
  const handleDeliverSingleOrder = async (orderId: string, tableNum?: number | string) => {
    if (deliveringOrderIds.has(orderId)) return

    setDeliveringOrderIds(prev => new Set(prev).add(orderId))
    attendedValidationOrderIdsRef.current.add(orderId)
    const targetOrder = serverOrders.find(o => o.id === orderId)
    const deliveredOrder: Order | undefined = targetOrder
      ? { ...targetOrder, status: 'delivered' }
      : undefined

    lockOrderMutation(orderId, { order: deliveredOrder, status: 'delivered' })

    setServerOrders(prev =>
      prev.map(o => (o.id === orderId ? { ...o, status: 'delivered' } : o))
    )
    if (tableNum && readyOrderAlert?.toString() === tableNum.toString()) {
      setReadyOrderAlert(null)
    }

    try {
      const res = await fetch('/api/orders', {
        method: 'PATCH',
        credentials: 'include',
        headers: getStaffHeaders(slug),
        body: JSON.stringify({
          slug,
          orderId,
          status: 'delivered',
          table_number: tableNum,
          actor_type: 'waiter',
        }),
      })

      if (res.ok) {
        const data = await res.json()
        const finalOrder = data.order
          ? { ...data.order, table_number: tableNum || data.order.table_number }
          : null
        if (finalOrder) {
          lockOrderMutation(orderId, { order: finalOrder, status: 'delivered' })
        }
        setServerOrders(prev =>
          prev.map(o => {
            if (o.id === orderId) {
              return finalOrder
                ? finalOrder
                : { ...o, status: 'delivered', version: data.version ?? (o.version ? o.version + 1 : 1) }
            }
            return o
          })
        )
      } else {
        releaseOrderMutation(orderId)
        await syncServerData()
      }
    } catch (e) {
      console.error('Error de red al entregar orden:', e)
      releaseOrderMutation(orderId)
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

  // Validar comanda de comensal y enviarla a cocina
  const handleValidateOrder = async (orderId: string, tableNum?: number | string) => {
    if (validatingOrderIds.has(orderId)) return

    setValidatingOrderIds(prev => new Set(prev).add(orderId))
    attendedValidationOrderIdsRef.current.add(orderId)
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem(
          `fluxo_attended_validations_${slug}`,
          JSON.stringify(Array.from(attendedValidationOrderIdsRef.current))
        )
      } catch (_) {}
    }

    const targetOrder = serverOrders.find(o => o.id === orderId)
    const pendingOrder: Order | undefined = targetOrder
      ? { ...targetOrder, status: 'pending' }
      : undefined

    lockOrderMutation(orderId, { order: pendingOrder, status: 'pending' })

    setServerOrders(prev =>
      prev.map(o => (o.id === orderId ? { ...o, status: 'pending' } : o))
    )

    try {
      const res = await fetch('/api/orders', {
        method: 'PATCH',
        credentials: 'include',
        headers: getStaffHeaders(slug),
        body: JSON.stringify({
          slug,
          orderId,
          status: 'pending',
          table_number: tableNum,
          tableNumber: tableNum,
          actor_type: 'waiter',
        }),
      })

      if (res.ok) {
        const data = await res.json()
        if (data.order) {
          lockOrderMutation(orderId, { order: data.order, status: 'pending' })
        }
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
      } else {
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

    try {
      const res = await fetch('/api/orders', {
        method: 'PATCH',
        credentials: 'include',
        headers: getStaffHeaders(slug),
        body: JSON.stringify({
          slug,
          orderId,
          status: 'cancelled',
          table_number: tableNum,
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
    attendedValidationOrderIdsRef.current.add(orderId)
    try {
      await fetch('/api/orders', {
          method: 'PATCH',
          credentials: 'include',
          headers: getStaffHeaders(slug),
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
    const fireableOrders = tableOrders.filter(
      o => o.status === 'pending' || o.status === 'ready' || o.status === 'preparing' || o.status === 'delivered'
    )
    const fireableOrderIds = new Set(fireableOrders.map(o => o.id))
    fireableOrders.forEach(o => {
      attendedValidationOrderIdsRef.current.add(o.id)
    })

    setServerOrders(prev =>
      prev.map(o => {
        if (!fireableOrderIds.has(o.id)) return o
        const updatedItems = hydrateOrderItemsWithCatalog(
          (o.order_items || []).map(it => {
            if (isMainItem(it)) {
              return { ...it, notes: mergeItemNotes(it.notes, TAG_MAIN_FIRED) }
            }
            return it
          }),
          products,
          o.order_items
        )
        const updatedOrderNotes = mergeItemNotes((o as any).notes, TAG_MAIN_FIRED)
        const updated: Order = { ...o, status: 'preparing' as OrderStatus, notes: updatedOrderNotes, order_items: updatedItems }
        lockOrderMutation(o.id, { order: updated, status: 'preparing' })
        return updated
      })
    )

    for (const ord of fireableOrders) {
      try {
        const res = await fetch('/api/orders', {
        method: 'PATCH',
        credentials: 'include',
        headers: getStaffHeaders(slug),
          body: JSON.stringify({ slug, orderId: ord.id, action: 'fire_mains' }),
        })
        if (res.ok) {
          const data = await res.json().catch(() => null)
          if (data?.order) {
            lockOrderMutation(ord.id, { order: data.order, status: 'preparing' })
            setServerOrders(prev => prev.map(o => (o.id === ord.id ? data.order : o)))
          }
        }
      } catch (e) {
        console.error('Error firing second courses for order:', ord.id, e)
      }
    }
    setOrderSentToast(true)
    setTimeout(() => setOrderSentToast(false), 2500)
  }

  // Marchar postres retenidos de una orden específica a la cocina (Pase 3 dulce)
  const handleFireOrderDesserts = async (orderId: string) => {
    attendedValidationOrderIdsRef.current.add(orderId)
    let updatedOrderForRef: Order | null = null
    setServerOrders(prev =>
      prev.map(o => {
        if (o.id !== orderId) return o
        const updatedItems = hydrateOrderItemsWithCatalog(
          (o.order_items || []).map(it => {
            if (isDessertItem(it)) {
              return { ...it, notes: mergeItemNotes(it.notes, TAG_DESSERT_FIRED) }
            }
            return it
          }),
          products,
          o.order_items
        )
        const updatedOrderNotes = mergeItemNotes((o as any).notes, TAG_DESSERT_FIRED)
        const updated: Order = { ...o, status: 'preparing' as OrderStatus, notes: updatedOrderNotes, order_items: updatedItems }
        updatedOrderForRef = updated
        return updated
      })
    )
    if (updatedOrderForRef) {
      lockOrderMutation(orderId, { order: updatedOrderForRef, status: 'preparing' })
    }
    try {
      const res = await fetch('/api/orders', {
        method: 'PATCH',
        credentials: 'include',
        headers: getStaffHeaders(slug),
        body: JSON.stringify({ slug, orderId, action: 'fire_desserts' }),
      })
      if (res.ok) {
        const data = await res.json().catch(() => null)
        if (data?.order) {
          lockOrderMutation(orderId, { order: data.order, status: 'preparing' })
          setServerOrders(prev => prev.map(o => (o.id === orderId ? data.order : o)))
        }
      } else {
        await syncServerData()
      }
      setOrderSentToast(true)
      setTimeout(() => setOrderSentToast(false), 2500)
    } catch (e) {
      console.error('Error firing order desserts:', e)
      await syncServerData()
    }
  }

  // Entregar postres retenidos de una orden directamente por el mozo
  const handleDeliverOrderDessertsDirect = async (orderId: string) => {
    attendedValidationOrderIdsRef.current.add(orderId)
    let updatedOrderForRef: Order | null = null
    setServerOrders(prev =>
      prev.map(o => {
        if (o.id !== orderId) return o
        const updatedItems = hydrateOrderItemsWithCatalog(
          (o.order_items || []).map(it => {
            let currentNotes = it.notes || ''
            if (isStarterItem(it)) {
              currentNotes = mergeItemNotes(currentNotes, `${TAG_STARTER_READY} ${TAG_STARTER_SERVED}`)
            }
            if (isMainItem(it)) {
              currentNotes = mergeItemNotes(currentNotes, `${TAG_MAIN_FIRED} ${TAG_MAIN_READY} ${TAG_MAIN_SERVED}`)
            }
            if (isDessertItem(it)) {
              currentNotes = mergeItemNotes(currentNotes, `${TAG_DESSERT_FIRED} ${TAG_DESSERT_READY} ${TAG_DESSERT_SERVED}`)
            }
            return { ...it, notes: currentNotes }
          }),
          products,
          o.order_items
        )
        const updatedOrderNotes = mergeItemNotes(
          (o as any).notes,
          `${TAG_DESSERT_FIRED} ${TAG_DESSERT_READY} ${TAG_DESSERT_SERVED}`
        )
        const candidate: Order = { ...o, notes: updatedOrderNotes, order_items: updatedItems }
        const nextStatus: OrderStatus = areAllOrderCoursesDelivered(candidate) ? 'delivered' : o.status
        const updated: Order = { ...candidate, status: nextStatus }
        updatedOrderForRef = updated
        return updated
      })
    )
    if (updatedOrderForRef) {
      lockOrderMutation(orderId, { order: updatedOrderForRef, status: (updatedOrderForRef as Order).status })
    }
    try {
      const res = await fetch('/api/orders', {
        method: 'PATCH',
        credentials: 'include',
        headers: getStaffHeaders(slug),
        body: JSON.stringify({ slug, orderId, action: 'deliver_desserts_direct' }),
      })
      if (res.ok) {
        const data = await res.json().catch(() => null)
        if (data?.order) {
          lockOrderMutation(orderId, { order: data.order, status: data.order.status })
          setServerOrders(prev => prev.map(o => (o.id === orderId ? data.order : o)))
        }
      } else {
        await syncServerData()
      }
    } catch (e) {
      console.error('Error delivering order desserts directly:', e)
      await syncServerData()
    }
  }

  // Marchar postres retenidos de toda la mesa a la cocina
  const handleFireDesserts = async (tableNum: string | number) => {
    const tableOrders = serverOrders.filter(
      o => (o.table_number?.toString() === tableNum.toString() || o.table?.table_number?.toString() === tableNum.toString())
    )
    const dessertOrders = tableOrders.filter(o => {
      const desserts = (o.order_items || []).filter(isDessertItem)
      return desserts.length > 0 && desserts.some(d => !isDessertReady(d))
    })
    const dessertOrderIds = new Set(dessertOrders.map(o => o.id))
    dessertOrders.forEach(o => {
      attendedValidationOrderIdsRef.current.add(o.id)
    })

    setServerOrders(prev =>
      prev.map(o => {
        if (!dessertOrderIds.has(o.id)) return o
        const updatedItems = hydrateOrderItemsWithCatalog(
          (o.order_items || []).map(it => {
            if (isDessertItem(it)) {
              return { ...it, notes: mergeItemNotes(it.notes, TAG_DESSERT_FIRED) }
            }
            return it
          }),
          products,
          o.order_items
        )
        const updatedOrderNotes = mergeItemNotes((o as any).notes, TAG_DESSERT_FIRED)
        const updated: Order = { ...o, status: 'preparing' as OrderStatus, notes: updatedOrderNotes, order_items: updatedItems }
        lockOrderMutation(o.id, { order: updated, status: 'preparing' })
        return updated
      })
    )

    for (const ord of dessertOrders) {
      try {
        const res = await fetch('/api/orders', {
        method: 'PATCH',
        credentials: 'include',
        headers: getStaffHeaders(slug),
          body: JSON.stringify({ slug, orderId: ord.id, action: 'fire_desserts' }),
        })
        if (res.ok) {
          const data = await res.json().catch(() => null)
          if (data?.order) {
            lockOrderMutation(ord.id, { order: data.order, status: 'preparing' })
            setServerOrders(prev => prev.map(o => (o.id === ord.id ? data.order : o)))
          }
        }
      } catch (e) {
        console.error('Error firing desserts for order:', ord.id, e)
      }
    }
    setOrderSentToast(true)
    setTimeout(() => setOrderSentToast(false), 2500)
  }

  // Entregar postres retenidos de toda la mesa directamente por el mozo
  const handleDeliverTableDessertsDirect = async (tableNum: string | number) => {
    const tableOrders = serverOrders.filter(
      o => (o.table_number?.toString() === tableNum.toString() || o.table?.table_number?.toString() === tableNum.toString())
    )
    const dessertOrders = tableOrders.filter(o => {
      const desserts = (o.order_items || []).filter(isDessertItem)
      return desserts.length > 0 && desserts.some(d => !isDessertReady(d))
    })
    const dessertOrderIds = new Set(dessertOrders.map(o => o.id))
    dessertOrders.forEach(o => {
      attendedValidationOrderIdsRef.current.add(o.id)
    })

    setServerOrders(prev =>
      prev.map(o => {
        if (!dessertOrderIds.has(o.id)) return o
        const updatedItems = hydrateOrderItemsWithCatalog(
          (o.order_items || []).map(it => {
            let currentNotes = it.notes || ''
            if (isStarterItem(it)) {
              currentNotes = mergeItemNotes(currentNotes, `${TAG_STARTER_READY} ${TAG_STARTER_SERVED}`)
            }
            if (isMainItem(it)) {
              currentNotes = mergeItemNotes(currentNotes, `${TAG_MAIN_FIRED} ${TAG_MAIN_READY} ${TAG_MAIN_SERVED}`)
            }
            if (isDessertItem(it)) {
              currentNotes = mergeItemNotes(currentNotes, `${TAG_DESSERT_FIRED} ${TAG_DESSERT_READY} ${TAG_DESSERT_SERVED}`)
            }
            return { ...it, notes: currentNotes }
          }),
          products,
          o.order_items
        )
        const updatedOrderNotes = mergeItemNotes(
          (o as any).notes,
          `${TAG_DESSERT_FIRED} ${TAG_DESSERT_READY} ${TAG_DESSERT_SERVED}`
        )
        const candidate: Order = { ...o, notes: updatedOrderNotes, order_items: updatedItems }
        const nextStatus: OrderStatus = areAllOrderCoursesDelivered(candidate) ? 'delivered' : o.status
        const updated: Order = { ...candidate, status: nextStatus }
        lockOrderMutation(o.id, { order: updated, status: nextStatus })
        return updated
      })
    )

    for (const ord of dessertOrders) {
      try {
        const res = await fetch('/api/orders', {
        method: 'PATCH',
        credentials: 'include',
        headers: getStaffHeaders(slug),
          body: JSON.stringify({ slug, orderId: ord.id, action: 'deliver_desserts_direct' }),
        })
        if (res.ok) {
          const data = await res.json().catch(() => null)
          if (data?.order) {
            lockOrderMutation(ord.id, { order: data.order, status: data.order.status })
            setServerOrders(prev => prev.map(o => (o.id === ord.id ? data.order : o)))
          }
        }
      } catch (e) {
        console.error('Error delivering desserts direct for order:', ord.id, e)
      }
    }
  }

  // Cobrar cuenta de la mesa (Paso 1: Cobro y paso a Sobremesa / Encuesta / Fidelización)
  const handleChargeTable = async (
    tableNum: number | string,
    paymentMethod: 'card' | 'cash' | 'mixed' = 'card',
    finalAmount?: number
  ) => {
    try {
      // 1. Obtener órdenes activas de la mesa
      const tableOrdersToPay = serverOrders.filter(
        o =>
          (o.table_number?.toString() === tableNum.toString() ||
            o.table?.table_number?.toString() === tableNum.toString()) &&
          !['cancelled', 'paid'].includes(o.status)
      )

      // 2. Transición de estado a 'paid' en backend y barrido anti-zombis de todas las rondas de la mesa
      if (tableOrdersToPay.length > 0) {
        for (const ord of tableOrdersToPay) {
          lockOrderMutation(ord.id, { status: 'paid' })
          try {
            await fetch('/api/orders', {
              method: 'PATCH',
              credentials: 'include',
              headers: getStaffHeaders(slug),
              body: JSON.stringify({ slug, orderId: ord.id, table_number: tableNum, status: 'paid', sweep_table: true }),
            })
          } catch (err) {
            console.error('[handleChargeTable] Error transitioning order to paid:', ord.id, err)
          }
        }
      } else {
        try {
          await fetch('/api/orders', {
            method: 'PATCH',
            credentials: 'include',
            headers: getStaffHeaders(slug),
            body: JSON.stringify({ slug, table_number: tableNum, action: 'pay_table', status: 'paid' }),
          })
        } catch (err) {
          console.error('[handleChargeTable] Error sweeping table to paid:', tableNum, err)
        }
      }

      // 3. Actualizar estado local reactivo preservando las órdenes como paid en serverOrders
      setServerOrders(prev =>
        prev.map(o => {
          const isThisTable =
            o.table_number?.toString() === tableNum.toString() ||
            o.table?.table_number?.toString() === tableNum.toString()
          if (isThisTable && !['cancelled', 'paid'].includes(o.status)) {
            const updated: Order = { ...o, status: 'paid' }
            lockOrderMutation(o.id, { order: updated, status: 'paid' })
            return updated
          }
          return o
        })
      )

      // 4. Limpiar llamadas de cuenta de esta mesa
      const tableCalls = pendingCalls.filter(
        c => c.table_number.toString() === tableNum.toString()
      )
      for (const c of tableCalls) {
        await handleAttendCall(c.id)
      }

      // 5. Emitir eventos de cobro para comensal y sala
      window.dispatchEvent(
        new CustomEvent('table_bill_paid', {
          detail: { tableNumber: tableNum, total: finalAmount, paymentMethod },
        })
      )
      window.dispatchEvent(
        new CustomEvent('fluxo_table_bill_paid', {
          detail: { tableNumber: tableNum, total: finalAmount, paymentMethod },
        })
      )
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const bc = new BroadcastChannel('fluxo_menu_channel')
        bc.postMessage({
          type: 'table_bill_paid',
          slug,
          tableNumber: tableNum,
          total: finalAmount,
          paymentMethod,
        })
        bc.postMessage({
          type: 'order_updated',
          slug,
          tableNumber: tableNum,
          status: 'paid',
        })
        bc.close()
      }

      // Cobro completado sin falsas alarmas de envío a cocina
    } catch (e) {
      console.error('Error charging table:', e)
    }
  }

  // Marcar mesa como cobrada y liberarla
  const executeCloseAndFreeTable = async (
    tableNum: number | string,
    paymentMethod: 'card' | 'cash' | 'mixed' = 'card',
    finalAmount?: number,
    ordersCount?: number
  ) => {
    // Actualización optimista inmediata en 1 toque
    const sTableNum = tableNum.toString()
    const nTableNum = Number(tableNum)
    const nowTs = Date.now()
    freedTableNumbersRef?.current?.set(sTableNum, nowTs)
    freedTableNumbersRef?.current?.set(nTableNum, nowTs)
    if (mutationLockUntilRef?.current) {
      mutationLockUntilRef.current.set(`table_free_${sTableNum}`, nowTs + 10000)
    }

    if (prevOrdersMapRef?.current) {
      prevOrdersMapRef.current.forEach((ord, id) => {
        const oTbl = ord.table_number?.toString() || ord.table?.table_number?.toString()
        if (oTbl === sTableNum) {
          prevOrdersMapRef.current.delete(id)
        }
      })
    }

    setSelectedTable(null)
    setTableStatuses(prev => ({
      ...prev,
      [tableNum]: 'free' as TableStatusType,
      [sTableNum]: 'free' as TableStatusType,
      [nTableNum]: 'free' as TableStatusType,
    }))
    setServerOrders(prev => prev.filter(o => {
      const oTbl = o.table_number?.toString() || o.table?.table_number?.toString()
      return oTbl !== sTableNum
    }))
    setTableCarts(prev => {
      const next = { ...prev }
      delete next[tableNum]
      delete next[sTableNum]
      delete next[nTableNum]
      return next
    })

    const tableOrdersList = (serverOrders || []).filter(o => {
      const oTbl = o.table_number?.toString() || o.table?.table_number?.toString()
      return oTbl === sTableNum && o.status !== 'cancelled'
    })
    const effectiveAmount = (typeof finalAmount === 'number' && finalAmount > 0)
      ? finalAmount
      : tableOrdersList.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0)
    const effectiveCount = (typeof ordersCount === 'number' && ordersCount > 0)
      ? ordersCount
      : tableOrdersList.length

    // Emitir inmediatamente evento local y BroadcastChannel para liberar el menú en pantalla de comensales concurrentes
    if (typeof window !== 'undefined') {
      try {
        window.dispatchEvent(new CustomEvent('fluxo_table_freed', { detail: { tableNumber: tableNum, slug } }))
        const bc = new BroadcastChannel('fluxo_menu_channel')
        bc.postMessage({ type: 'table_freed', tableNumber: tableNum, slug })
        setTimeout(() => {
          try { bc.close() } catch (_) {}
        }, 1000)
      } catch (_) {}
    }

    try {
      await fetch('/api/tables', {
        method: 'POST',
        credentials: 'include',
        headers: getStaffHeaders(slug),
        body: JSON.stringify({
          slug,
          table_number: tableNum,
          action: 'free',
          payment_method: paymentMethod,
          final_amount: effectiveAmount,
          orders_count: effectiveCount,
        }),
      })

      const tableCalls = pendingCalls.filter(c => c.table_number.toString() === tableNum.toString())
      for (const c of tableCalls) {
        await handleAttendCall(c.id)
      }
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
        credentials: 'include',
        headers: getStaffHeaders(slug),
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
          name: item.product.name,
          price: item.product.price,
          quantity: item.quantity,
          notes: formattedNotes || null,
          product: item.product,
          course: item.course || 'first',
          is_complimentary: item.is_complimentary || false,
          weight_grams: item.weight_grams,
          is_pack_header: item.is_pack_header,
          is_pack_component: item.is_pack_component,
          pack_id: item.pack_id,
        }
      })

      const res = await fetch('/api/orders', {
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

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.message || errData.error || 'No se pudo registrar la comanda en cocina')
      }

      setOrderSentToast(true)
      setTableCarts(prev => ({ ...prev, [selectedTable.table_number]: [] }))
      setTimeout(() => setOrderSentToast(false), 3500)
    } catch (err: any) {
      console.error('Error al enviar comanda:', err)
      alert(`⚠️ No se pudo enviar la comanda a cocina: ${err?.message || 'Error de conexión'}.\nLos platos se mantienen en la mesa para reintentar.`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeliverStarters = async (orderId: string) => {
    attendedValidationOrderIdsRef.current.add(orderId)
    setDeliveringOrderIds(prev => new Set(prev).add(orderId))
    let updatedOrderForRef: Order | null = null
    setServerOrders(prev =>
      prev.map(o => {
        if (o.id !== orderId) return o
        const updatedItems = hydrateOrderItemsWithCatalog(
          (o.order_items || []).map(it => {
            if (isStarterItem(it)) {
              return { ...it, notes: mergeItemNotes(it.notes, `${TAG_STARTER_READY} ${TAG_STARTER_SERVED}`) }
            }
            return it
          }),
          products,
          o.order_items
        )
        const updatedOrderNotes = mergeItemNotes((o as any).notes, `${TAG_STARTER_READY} ${TAG_STARTER_SERVED}`)
        const candidate: Order = { ...o, notes: updatedOrderNotes, order_items: updatedItems }
        const nextStatus: OrderStatus = areAllOrderCoursesDelivered(candidate) ? 'delivered' : 'preparing'
        const updated: Order = { ...candidate, status: nextStatus }
        updatedOrderForRef = updated
        return updated
      })
    )
    if (updatedOrderForRef) {
      const effStatus = (updatedOrderForRef as Order).status
      lockOrderMutation(orderId, { order: updatedOrderForRef, status: effStatus })
    }
    try {
      const res = await fetch('/api/orders', {
        method: 'PATCH',
        credentials: 'include',
        headers: getStaffHeaders(slug),
        body: JSON.stringify({
          slug,
          orderId,
          action: 'deliver_starters',
        }),
      })
      if (res.ok) {
        const data = await res.json().catch(() => null)
        if (data?.order) {
          lockOrderMutation(orderId, { order: data.order, status: data.order.status })
          setServerOrders(prev => prev.map(o => (o.id === orderId ? data.order : o)))
        }
      } else {
        await syncServerData()
      }
    } catch (e) {
      console.error('Error al entregar entradas:', e)
      await syncServerData()
    } finally {
      setDeliveringOrderIds(prev => {
        const next = new Set(prev)
        next.delete(orderId)
        return next
      })
    }
  }

  const handleDeliverMains = async (orderId: string) => {
    attendedValidationOrderIdsRef.current.add(orderId)
    setDeliveringOrderIds(prev => new Set(prev).add(orderId))
    let updatedOrderForRef: Order | null = null
    setServerOrders(prev =>
      prev.map(o => {
        if (o.id !== orderId) return o
        const updatedItems = hydrateOrderItemsWithCatalog(
          (o.order_items || []).map(it => {
            if (isMainItem(it)) {
              return { ...it, notes: mergeItemNotes(it.notes, `${TAG_MAIN_FIRED} ${TAG_MAIN_READY} ${TAG_MAIN_SERVED}`) }
            }
            return it
          }),
          products,
          o.order_items
        )
        const updatedOrderNotes = mergeItemNotes((o as any).notes, `${TAG_MAIN_FIRED} ${TAG_MAIN_READY} ${TAG_MAIN_SERVED}`)
        const candidate: Order = { ...o, notes: updatedOrderNotes, order_items: updatedItems }
        const nextStatus: OrderStatus = areAllOrderCoursesDelivered(candidate) ? 'delivered' : 'preparing'
        const updated: Order = { ...candidate, status: nextStatus }
        updatedOrderForRef = updated
        return updated
      })
    )
    if (updatedOrderForRef) {
      const effStatus = (updatedOrderForRef as Order).status
      lockOrderMutation(orderId, { order: updatedOrderForRef, status: effStatus })
    }
    try {
      const res = await fetch('/api/orders', {
        method: 'PATCH',
        credentials: 'include',
        headers: getStaffHeaders(slug),
        body: JSON.stringify({
          slug,
          orderId,
          action: 'deliver_mains',
        }),
      })
      if (res.ok) {
        const data = await res.json().catch(() => null)
        if (data?.order) {
          lockOrderMutation(orderId, { order: data.order, status: data.order.status || 'delivered' })
          setServerOrders(prev => prev.map(o => (o.id === orderId ? data.order : o)))
        }
      } else {
        await syncServerData()
      }
    } catch (e) {
      console.error('Error al entregar principales:', e)
      await syncServerData()
    } finally {
      setDeliveringOrderIds(prev => {
        const next = new Set(prev)
        next.delete(orderId)
        return next
      })
    }
  }

  const handleFireMains = async (orderId: string) => {
    attendedValidationOrderIdsRef.current.add(orderId)
    let updatedOrderForRef: Order | null = null
    setServerOrders(prev =>
      prev.map(o => {
        if (o.id !== orderId) return o
        const updatedItems = hydrateOrderItemsWithCatalog(
          (o.order_items || []).map(it => {
            if (isMainItem(it)) {
              return { ...it, notes: mergeItemNotes(it.notes, TAG_MAIN_FIRED) }
            }
            return it
          }),
          products,
          o.order_items
        )
        const updatedOrderNotes = mergeItemNotes((o as any).notes, TAG_MAIN_FIRED)
        const updated: Order = { ...o, status: 'preparing', notes: updatedOrderNotes, order_items: updatedItems }
        updatedOrderForRef = updated
        return updated
      })
    )
    if (updatedOrderForRef) {
      lockOrderMutation(orderId, { order: updatedOrderForRef, status: 'preparing' })
    }
    try {
      const res = await fetch('/api/orders', {
        method: 'PATCH',
        credentials: 'include',
        headers: getStaffHeaders(slug),
        body: JSON.stringify({
          slug,
          orderId,
          action: 'fire_mains',
        }),
      })
      if (res.ok) {
        const data = await res.json().catch(() => null)
        if (data?.order) {
          lockOrderMutation(orderId, { order: data.order, status: 'preparing' })
          setServerOrders(prev => prev.map(o => (o.id === orderId ? data.order : o)))
        }
      } else {
        await syncServerData()
      }
      setOrderSentToast(true)
      setTimeout(() => setOrderSentToast(false), 2500)
    } catch (e) {
      console.error('Error al marchar principales:', e)
      await syncServerData()
    }
  }

  const handleDeliverDesserts = async (orderId: string) => {
    attendedValidationOrderIdsRef.current.add(orderId)
    setDeliveringOrderIds(prev => new Set(prev).add(orderId))
    let updatedOrderForRef: Order | null = null
    setServerOrders(prev =>
      prev.map(o => {
        if (o.id !== orderId) return o
        const updatedItems = hydrateOrderItemsWithCatalog(
          (o.order_items || []).map(it => {
            let currentNotes = it.notes || ''
            if (isStarterItem(it)) {
              currentNotes = mergeItemNotes(currentNotes, `${TAG_STARTER_READY} ${TAG_STARTER_SERVED}`)
            }
            if (isMainItem(it)) {
              currentNotes = mergeItemNotes(currentNotes, `${TAG_MAIN_FIRED} ${TAG_MAIN_READY} ${TAG_MAIN_SERVED}`)
            }
            if (isDessertItem(it)) {
              currentNotes = mergeItemNotes(currentNotes, `${TAG_DESSERT_FIRED} ${TAG_DESSERT_READY} ${TAG_DESSERT_SERVED}`)
            }
            return { ...it, notes: currentNotes }
          }),
          products,
          o.order_items
        )
        const updatedOrderNotes = mergeItemNotes(
          (o as any).notes,
          `${TAG_DESSERT_FIRED} ${TAG_DESSERT_READY} ${TAG_DESSERT_SERVED}`
        )
        const candidate: Order = { ...o, notes: updatedOrderNotes, order_items: updatedItems }
        const nextStatus: OrderStatus = areAllOrderCoursesDelivered(candidate) ? 'delivered' : 'preparing'
        const updated: Order = { ...candidate, status: nextStatus }
        updatedOrderForRef = updated
        return updated
      })
    )
    if (updatedOrderForRef) {
      const effStatus = (updatedOrderForRef as Order).status
      lockOrderMutation(orderId, { order: updatedOrderForRef, status: effStatus })
    }
    try {
      const res = await fetch('/api/orders', {
        method: 'PATCH',
        credentials: 'include',
        headers: getStaffHeaders(slug),
        body: JSON.stringify({
          slug,
          orderId,
          action: 'deliver_desserts',
        }),
      })
      if (res.ok) {
        const data = await res.json().catch(() => null)
        if (data?.order) {
          lockOrderMutation(orderId, { order: data.order, status: data.order.status || 'delivered' })
          setServerOrders(prev => prev.map(o => (o.id === orderId ? data.order : o)))
        }
      } else {
        await syncServerData()
      }
    } catch (e) {
      console.error('Error al entregar postres:', e)
      await syncServerData()
    } finally {
      setDeliveringOrderIds(prev => {
        const next = new Set(prev)
        next.delete(orderId)
        return next
      })
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
    handleDeliverStarters,
    handleFireMains,
    handleDeliverMains,
    handleDeliverDesserts,
    handleMarkDelivered,
    handleValidateOrder,
    handleCancelValidationOrder,
    handleCancelSingleOrder,
    handleFireSecondCourses,
    handleFireOrderDesserts,
    handleDeliverOrderDessertsDirect,
    handleFireDesserts,
    handleDeliverTableDessertsDirect,
    handleChargeTable,
    executeCloseAndFreeTable,
    handleTransferTable,
    handleSendOrderToKitchen,
  }
}
