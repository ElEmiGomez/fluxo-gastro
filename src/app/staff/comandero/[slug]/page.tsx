'use client'

import React, { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { useParams } from 'next/navigation'
import { Search, Plus, CheckCircle2, Utensils, BellRing, Sparkles, Bell, ArrowRight, Check, Users, RefreshCw, Receipt, Volume2, UserCheck, Trash2, X, Clock, Flame, CreditCard } from 'lucide-react'
import { TenantProvider } from '@/components/tenant/TenantProvider'
import { TenantHeader } from '@/components/tenant/TenantHeader'
import { TableSelector, TableStatusType } from '@/components/comandero/TableSelector'
import { ProductModifierModal } from '@/components/comandero/ProductModifierModal'
import { PreBillModal } from '@/components/comandero/PreBillModal'
import { OrderSummaryBar } from '@/components/comandero/OrderSummaryBar'
import { CartDrawer } from '@/components/menu/CartDrawer'
import { Product, Category, Table, CartItem, Restaurant, Order, CourseType } from '@/types/database.types'
import { formatCurrency } from '@/lib/utils'
import { StaffPinAuth } from '@/components/auth/StaffPinAuth'
import { MOCK_RESTAURANTS, MOCK_CATEGORIES, MOCK_PRODUCTS, MOCK_TABLES } from '@/lib/supabase/mock-fallback'
import { ConfirmModal } from '@/components/common/ConfirmModal'
import { playKitchenChime } from '@/components/kitchen/AudioNotification'

interface PendingServiceCall {
  id: string
  table_number: string | number
  call_type: string
  text: string
}

export default function WaiterComanderoPage() {
  const params = useParams()
  const slug = (params?.slug as string) || 'burger-gourmet'

  const fallbackTables = MOCK_TABLES[slug] || MOCK_TABLES['burger-gourmet'] || Array.from({ length: 25 }, (_, i) => ({
    id: `t1111111-1111-1111-1111-${String(i + 1).padStart(12, '0')}`,
    restaurant_id: 'a1111111-1111-1111-1111-111111111111',
    table_number: i + 1,
  }))

  const [restaurant, setRestaurant] = useState<Restaurant>(() => MOCK_RESTAURANTS[slug] || MOCK_RESTAURANTS['burger-gourmet'])
  const [categories, setCategories] = useState<Category[]>(() => MOCK_CATEGORIES[slug] || MOCK_CATEGORIES['burger-gourmet'] || [])
  const [products, setProducts] = useState<Product[]>(() => MOCK_PRODUCTS[slug] || MOCK_PRODUCTS['burger-gourmet'] || [])
  const [tables, setTables] = useState<Table[]>(() => fallbackTables)
  
  const [selectedTable, setSelectedTable] = useState<Table | null>(() => fallbackTables[0] || null)
  const [selectedCategory, setSelectedCategory] = useState<string>(() => MOCK_CATEGORIES[slug]?.[0]?.id || 'cat-1')
  const [searchQuery, setSearchQuery] = useState('')
  
  // Carritos aislados por mesa para que cambiar de mesa nunca mezcle pedidos
  const [tableCarts, setTableCarts] = useState<Record<string | number, CartItem[]>>({})
  const [tablePax, setTablePax] = useState<Record<string | number, number>>({})
  const [tableDiscounts, setTableDiscounts] = useState<Record<string | number, number>>({})
  const [showPreBill, setShowPreBill] = useState(false)
  const [showTransferModal, setShowTransferModal] = useState(false)
  const [transferTargetTable, setTransferTargetTable] = useState<string>('')
  const currentTableNum = selectedTable?.table_number || 1
  const cart = tableCarts[currentTableNum] || []

  const [customizingProduct, setCustomizingProduct] = useState<Product | null>(null)
  const [isCartDetailsOpen, setIsCartDetailsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [orderSentToast, setOrderSentToast] = useState(false)

  // Estado del Semáforo de Mesas (Libre / Ocupada / Llamando / Listo)
  const [tableStatuses, setTableStatuses] = useState<Record<string | number, TableStatusType>>({})
  const [tableDwellMinutes, setTableDwellMinutes] = useState<Record<string | number, number>>({})
  const [readyOrderAlert, setReadyOrderAlert] = useState<string | number | null>(null)
  const [serverOrders, setServerOrders] = useState<Order[]>([])

  // Sistema de Avisos: Popup inicial (1 sola vez) + Notificación chiquita persistente
  const [popupAlert, setPopupAlert] = useState<PendingServiceCall | null>(null)
  const [pendingCalls, setPendingCalls] = useState<PendingServiceCall[]>([])
  
  // Set de IDs ya vistos para que el popup grande salte SOLO 1 VEZ por llamada
  const seenCallIdsRef = useRef<Set<string>>(new Set())
  const popupTimerRef = useRef<any>(null)

  // Helper para modificar el carrito de la mesa activa
  const updateCartForCurrentTable = (updater: (prev: CartItem[]) => CartItem[]) => {
    setTableCarts(prev => ({
      ...prev,
      [currentTableNum]: updater(prev[currentTableNum] || []),
    }))
  }

  // 1. Mantener pantalla siempre encendida (WakeLock API Nativa)
  useEffect(() => {
    let wakeLock: any = null
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await (navigator as any).wakeLock.request('screen')
        }
      } catch (err) {
        console.log('WakeLock not active:', err)
      }
    }
    requestWakeLock()

    return () => {
      if (wakeLock) wakeLock.release()
    }
  }, [])

  // Marcar llamada como atendida (Servidor + Local)
  const handleAttendCall = async (callId: string) => {
    seenCallIdsRef.current.add(callId)
    setPendingCalls(prev => prev.filter(c => c.id !== callId))
    if (popupAlert?.id === callId) {
      setPopupAlert(null)
      if (popupTimerRef.current) clearTimeout(popupTimerRef.current)
    }

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

  // Al seleccionar una mesa, cambiar la selección
  const handleSelectTableAndClearAlerts = (table: Table) => {
    setSelectedTable(table)
  }

  const [showFreeConfirmTable, setShowFreeConfirmTable] = useState<number | string | null>(null)

  // Entregar un ticket o comanda individual específica
  const handleDeliverSingleOrder = async (orderId: string) => {
    try {
      await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, orderId, status: 'delivered' }),
      })
      setServerOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'delivered' } : o))
    } catch (e) {
      console.error('Error delivering single order:', e)
    }
  }

  // Marcar todos los platos listos de la mesa como entregados
  const handleMarkDelivered = async (tableNum: string | number) => {
    try {
      const readyOrders = serverOrders.filter(
        o => (o.table_number?.toString() === tableNum.toString() || o.table?.table_number?.toString() === tableNum.toString()) && o.status === 'ready'
      )

      for (const ord of readyOrders) {
        await handleDeliverSingleOrder(ord.id)
      }
    } catch (e) {
      console.error('Error marking all delivered:', e)
    }
  }

  // Marcar mesa como cobrada y liberarla para el próximo cliente
  const executeCloseAndFreeTable = async (tableNum: number | string) => {
    try {
      // 1. Notificar al backend para liberar la sesión y limpiar órdenes
      await fetch('/api/tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, table_number: tableNum, action: 'free' }),
      })

      // 2. Limpiar llamadas
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

  // Transferir toda la comanda, pedidos y cuenta de una mesa a otra
  const handleTransferTable = async (toTableNum: string | number) => {
    if (!selectedTable || !toTableNum || toTableNum === selectedTable.table_number) return
    const fromNum = selectedTable.table_number
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

      // Transferir carritos locales
      setTableCarts(prev => {
        const copy = { ...prev }
        copy[toTableNum] = copy[fromNum] || []
        delete copy[fromNum]
        return copy
      })

      // Transferir pax
      setTablePax(prev => {
        const copy = { ...prev }
        copy[toTableNum] = copy[fromNum] || 2
        delete copy[fromNum]
        return copy
      })

      const target = tables.find(t => t.table_number.toString() === toTableNum.toString())
      if (target) setSelectedTable(target)
      setShowTransferModal(false)
      setOrderSentToast(true)
      setTimeout(() => setOrderSentToast(false), 2500)
    } catch (err) {
      console.error('Error transferring table:', err)
    }
  }

  // 2. Carga y sincronización de órdenes y avisos entre dispositivos (Celular <-> PC)
  useEffect(() => {
    let sseEventSource: EventSource | null = null
    let pollInterval: any = null

    const syncServerData = async () => {
      try {
        const [ordersRes, callsRes, tablesRes] = await Promise.all([
          fetch(`/api/orders?slug=${slug}`).then(r => r.json()).catch(() => ({ orders: [] })),
          fetch(`/api/service-calls?slug=${slug}`).then(r => r.json()).catch(() => ({ calls: [] })),
          fetch(`/api/tables?slug=${slug}`).then(r => r.json()).catch(() => ({ sessions: {} })),
        ])

        const orders: Order[] = ordersRes.orders || []
        const calls: any[] = callsRes.calls || []
        const sessions = tablesRes.sessions || {}

        setServerOrders(orders)

        const statusMap: Record<string | number, TableStatusType> = {}
        const dwellMap: Record<string | number, number> = {}

        // 1. Mesas con órdenes creadas (permanecen ocupadas 'busy' o 'ready' hasta que el mozo presione 'Liberar Mesa')
        orders.forEach(ord => {
          const tblNum = ord.table?.table_number || ord.table_number
          if (tblNum) {
            if (ord.status === 'ready') {
              statusMap[tblNum] = 'ready'
            } else if (!statusMap[tblNum]) {
              statusMap[tblNum] = 'busy'
            }

            if (ord.created_at) {
              const mins = Math.max(1, Math.floor((Date.now() - new Date(ord.created_at).getTime()) / 60000))
              if (!dwellMap[tblNum] || mins > dwellMap[tblNum]) {
                dwellMap[tblNum] = mins
              }
            }
          }
        })

        setTableDwellMinutes(dwellMap)

        // 2. Mesas con carritos locales con platos cargados
        Object.entries(tableCarts).forEach(([tblNum, items]) => {
          if (items && items.length > 0 && !statusMap[tblNum]) {
            statusMap[tblNum] = 'busy'
          }
        })

        // 3. Avisos de servicio pendientes
        const serverPendingCalls = calls.filter((c: any) => c.status === 'pending')

        const formattedPendingCalls: PendingServiceCall[] = serverPendingCalls.map((c: any) => {
          let desc = 'Solicita atención del mozo'
          if (c.call_type === 'order_dictate') desc = 'Comanda lista para dictar al mozo'
          else if (c.call_type.startsWith('bill_')) desc = `Pide la cuenta (${c.call_type.replace('bill_', '')})`
          else if (c.call_type.startsWith('service_')) desc = `Solicita: ${c.call_type.replace('service_', '')}`

          return {
            id: c.id,
            table_number: c.table_number,
            call_type: c.call_type,
            text: desc,
          }
        })

        // Actualizar lista persistente de llamadas activas
        setPendingCalls(formattedPendingCalls)

        // Semáforo amarillo para mesas con llamada pendiente (prioridad sobre busy)
        formattedPendingCalls.forEach(call => {
          const tblNum = call.table_number
          if (tblNum && statusMap[tblNum] !== 'ready') {
            statusMap[tblNum] = 'calling'
          }
        })

        setTableStatuses(statusMap)

        // 3. Popup grande: Mostrar por llamada nueva y persistir hasta que el mozo la atienda
        formattedPendingCalls.forEach(call => {
          if (!seenCallIdsRef.current.has(call.id)) {
            seenCallIdsRef.current.add(call.id)
            setPopupAlert(call)
          }
        })
      } catch (e) {
        console.log('Error syncing server data in comandero:', e)
      }
    }

    async function loadInitialData() {
      const rest = MOCK_RESTAURANTS[slug] || MOCK_RESTAURANTS['burger-gourmet']
      if (rest) {
        setRestaurant(rest)
        const cats = MOCK_CATEGORIES[slug] || MOCK_CATEGORIES['burger-gourmet'] || []
        setCategories(cats)
        if (cats.length > 0) setSelectedCategory(cats[0].id)
        setProducts(MOCK_PRODUCTS[slug] || MOCK_PRODUCTS['burger-gourmet'] || [])
        const currentTables = MOCK_TABLES[slug] || MOCK_TABLES['burger-gourmet'] || fallbackTables
        setTables(currentTables)
        if (currentTables.length > 0) {
          setSelectedTable(prev => prev || currentTables[0])
        }
      }

      await syncServerData()

      // SSE (Server-Sent Events)
      try {
        sseEventSource = new EventSource('/api/events')
        sseEventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            if (data.slug === slug || data.type === 'connected') {
              syncServerData()
            }
          } catch {
            // ignore
          }
        }
      } catch (err) {
        console.log('SSE fallback to polling:', err)
      }

      // Polling cada 1.5s
      pollInterval = setInterval(syncServerData, 1500)
    }

    loadInitialData()

    return () => {
      if (sseEventSource) sseEventSource.close()
      if (pollInterval) clearInterval(pollInterval)
      if (popupTimerRef.current) clearTimeout(popupTimerRef.current)
    }
  }, [slug])

  const filteredProducts = products.filter(prod => {
    const matchesCat = prod.category_id === selectedCategory
    const matchesSearch = searchQuery === '' || prod.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCat && matchesSearch
  })

  // Añadir ítem configurado con Píldoras + Notas libres + Pase + Cortesía + Peso
  const handleAddItemToComanda = (
    product: Product,
    quantity: number,
    selectedPills: string[],
    notes: string,
    course?: CourseType,
    isComplimentary?: boolean,
    weightGrams?: number
  ) => {
    updateCartForCurrentTable(prev => [
      ...prev,
      { product, quantity, selectedPills, notes, course, isComplimentary, weightGrams }
    ])
  }

  // Marchar segundos platos retenidos a la cocina
  const handleFireSecondCourses = async (tableNum: string | number) => {
    const tableOrders = serverOrders.filter(
      o => (o.table_number?.toString() === tableNum.toString() || o.table?.table_number?.toString() === tableNum.toString())
    )
    for (const ord of tableOrders) {
      await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, orderId: ord.id, status: 'preparing' }),
      })
    }
    setOrderSentToast(true)
    setTimeout(() => setOrderSentToast(false), 2500)
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

  // Envío de comanda a Cocina
  const handleSendOrderToKitchen = async () => {
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

    const discountPct = tableDiscounts[selectedTable.table_number] || 0
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
          slug: restaurant.slug,
          restaurant_id: restaurant.id,
          table_id: selectedTable.id,
          table_number: selectedTable.table_number,
          total_amount: totalAmount,
          items: formattedItems,
          discount_percentage: discountPct,
        }),
      })

      setOrderSentToast(true)
      // Limpiar únicamente el carrito de esta mesa
      setTableCarts(prev => ({ ...prev, [selectedTable.table_number]: [] }))
      
      setTimeout(() => {
        setOrderSentToast(false)
      }, 3500)
    } catch (err) {
      console.error('Error al enviar comanda:', err)
      setOrderSentToast(true)
      setTableCarts(prev => ({ ...prev, [selectedTable.table_number]: [] }))
      setTimeout(() => setOrderSentToast(false), 3000)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Identificar bebidas previamente ordenadas en la sesión actual de la mesa seleccionada
  const previousDrinksInTable = React.useMemo(() => {
    if (!selectedTable) return []
    const tableOrders = serverOrders.filter(
      o => (o.table_number?.toString() === selectedTable.table_number.toString() || o.table?.table_number?.toString() === selectedTable.table_number.toString())
    )
    const drinksMap: Record<string, { product: Product; quantity: number }> = {}
    tableOrders.forEach(ord => {
      (ord.order_items || []).forEach(item => {
        const p = item.product || products.find(prod => prod.id === item.product_id)
        if (p) {
          const catId = (p.category_id || '').toLowerCase()
          const name = (p.name || '').toLowerCase()
          const isDrink = catId.includes('bebida') || catId.includes('trago') || catId === 'cat-12' || catId === 'cat-13' || catId === 'cat-14' || catId === 'cat-15' || name.includes('cerveza') || name.includes('vino') || name.includes('gaseosa') || name.includes('agua') || name.includes('limonada') || name.includes('ipa') || name.includes('pinta')
          if (isDrink) {
            if (drinksMap[p.id]) {
              drinksMap[p.id].quantity += item.quantity || 1
            } else {
              drinksMap[p.id] = { product: p, quantity: item.quantity || 1 }
            }
          }
        }
      })
    })
    return Object.values(drinksMap)
  }, [selectedTable, serverOrders, products])

  return (
    <StaffPinAuth role="comandero" restaurantSlug={slug}>
<TenantProvider restaurant={restaurant} initialTable={selectedTable?.table_number.toString() || null}>
        <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col pb-28 select-none" style={{ touchAction: 'manipulation' }}>
        
        <TenantHeader viewType="comandero" tableNumber={selectedTable?.table_number.toString()} />

        {/* 1. CENTRO DE AVISOS Y LLAMADAS ACTIVAS (PERMANENTE HASTA ACCIÓN DEL MOZO) */}
        {pendingCalls.length > 0 && (
          <div className="bg-amber-500/15 border-b-2 border-amber-400 p-3 sm:p-4 shadow-md animate-in slide-in-from-top duration-200">
            <div className="max-w-6xl mx-auto space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-amber-500 animate-ping flex-shrink-0" />
                  <h3 className="text-xs sm:text-sm font-black text-amber-950 uppercase tracking-wide flex items-center gap-1.5">
                    <Bell className="w-4 h-4 text-amber-800 stroke-[2.5]" />
                    <span>Avisos de Salón Pendientes ({pendingCalls.length})</span>
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => pendingCalls.forEach(c => handleAttendCall(c.id))}
                  className="text-xs font-black text-amber-900 hover:text-amber-950 underline cursor-pointer"
                >
                  Atender Todos
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {pendingCalls.map(call => {
                  const isBill = call.text.toLowerCase().includes('cuenta')
                  return (
                    <div
                      key={call.id}
                      className={`p-3.5 rounded-2xl border-2 shadow-md flex items-center justify-between gap-3 transition-all ${
                        isBill
                          ? 'bg-emerald-950 border-emerald-400 text-white'
                          : 'bg-slate-900 border-amber-400 text-white'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          const tbl = tables.find(t => t.table_number.toString() === call.table_number.toString())
                          if (tbl) setSelectedTable(tbl)
                        }}
                        className="flex items-center gap-2.5 min-w-0 flex-1 text-left cursor-pointer"
                      >
                        <span className={`px-2.5 py-1 rounded-xl text-xs font-black flex-shrink-0 ${
                          isBill ? 'bg-emerald-400 text-slate-950' : 'bg-amber-400 text-slate-950'
                        }`}>
                          Mesa #{call.table_number}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-black truncate">{call.text}</p>
                          <span className="text-[10px] text-slate-400 block mt-0.5 font-semibold">Toca para abrir mesa</span>
                        </div>
                      </button>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => handleAttendCall(call.id)}
                          className={`px-3 py-2 rounded-xl text-xs font-black shadow-md transition-all active:scale-95 flex items-center gap-1 cursor-pointer ${
                            isBill
                              ? 'bg-emerald-400 hover:bg-emerald-300 text-slate-950'
                              : 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                          }`}
                          title={isBill ? 'Confirmar cobro' : 'Marcar como atendido'}
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          <span>{isBill ? 'Cobrado' : 'Atendido'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAttendCall(call.id)}
                          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Cerrar aviso"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* 3. COMANDAS PENDIENTES DE VALIDACIÓN EN MESA (GATEKEEPER ANTIFRAUDE) */}
        {serverOrders.filter(o => o.status === 'pending_validation').length > 0 && (
          <div className="bg-gradient-to-r from-amber-500/20 via-orange-500/15 to-amber-500/20 border-b-2 border-amber-400 p-3.5 sm:p-4 shadow-sm animate-in fade-in">
            <div className="max-w-6xl mx-auto space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-amber-500 animate-ping flex-shrink-0" />
                  <h3 className="text-xs sm:text-sm font-black text-amber-950 uppercase tracking-wide flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-amber-800 stroke-[2.5]" />
                    <span>Validación Requerida en Mesa ({serverOrders.filter(o => o.status === 'pending_validation').length})</span>
                  </h3>
                </div>
                <span className="text-[11px] text-amber-900 font-bold hidden sm:inline">
                  Confirma verbalmente antes de enviar a cocina
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {serverOrders
                  .filter(o => o.status === 'pending_validation')
                  .map(valOrder => (
                    <div
                      key={valOrder.id}
                      className="bg-white rounded-2xl p-3.5 border-2 border-amber-300 shadow-md flex flex-col justify-between space-y-3"
                    >
                      <div>
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                          <span className="px-2.5 py-0.5 rounded-lg bg-amber-100 text-amber-950 font-black text-xs">
                            Mesa #{valOrder.table_number || valOrder.table?.table_number}
                          </span>
                          <span className="font-black text-xs text-slate-900 tabular-nums">
                            {formatCurrency(valOrder.total_amount)}
                          </span>
                        </div>

                        <div className="mt-2 space-y-1.5 max-h-36 overflow-y-auto pr-1">
                          {(valOrder.order_items || []).map((it, idx) => (
                            <div key={idx} className="text-xs text-slate-700 leading-tight">
                              <span className="font-black text-slate-900">{it.quantity}x </span>
                              <span className="font-semibold">{it.product?.name || `Plato #${idx + 1}`}</span>
                              {it.notes && (
                                <span className="block text-[10px] text-amber-800 font-bold pl-3">
                                  &bull; {it.notes}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                        <button
                          onClick={async () => {
                            try {
                              await fetch('/api/orders', {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  slug,
                                  orderId: valOrder.id,
                                  status: 'pending',
                                }),
                              })
                              setServerOrders(prev =>
                                prev.map(o => o.id === valOrder.id ? { ...o, status: 'pending' } : o)
                              )
                            } catch (e) {
                              console.error('Error al validar comanda:', e)
                            }
                          }}
                          className="flex-1 py-3 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all uppercase tracking-wide"
                          title="Enviar a cocina tras verificar verbalmente en mesa"
                        >
                          <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                          <span>Confirmar a Cocina</span>
                        </button>
                        <button
                          onClick={async () => {
                            if (confirm(`¿Descartar comanda de Mesa #${valOrder.table_number}?`)) {
                              try {
                                await fetch('/api/orders', {
                                  method: 'PATCH',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    slug,
                                    orderId: valOrder.id,
                                    status: 'cancelled',
                                  }),
                                })
                                setServerOrders(prev => prev.filter(o => o.id !== valOrder.id))
                              } catch (e) {
                                console.error('Error al cancelar comanda:', e)
                              }
                            }
                          }}
                          className="p-3 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 font-black text-xs border border-red-200 transition-colors"
                          title="Descartar comanda falsa o errónea"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* Alerta de Plato Listo para Servir en Salón */}
        {readyOrderAlert && (
          <div className="fixed top-16 inset-x-4 z-50 max-w-md mx-auto p-4 rounded-2xl bg-emerald-600 text-white font-black shadow-2xl flex items-center justify-between animate-bounce border border-emerald-500">
            <div className="flex items-center gap-3">
              <BellRing className="w-7 h-7 text-white stroke-[2.5]" />
              <div>
                <div className="text-sm font-black uppercase">¡Comanda Lista en Cocina!</div>
                <div className="text-xs text-emerald-100">Retirar pedido caliente para Mesa #{readyOrderAlert}</div>
              </div>
            </div>
          </div>
        )}

        {orderSentToast && (
          <div className="fixed top-16 inset-x-4 z-50 max-w-md mx-auto p-4 rounded-2xl bg-blue-900 text-white font-black shadow-2xl flex items-center justify-between animate-in slide-in-from-top duration-300 border border-blue-800">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-7 h-7 text-blue-300 stroke-[2.5]" />
              <div>
                <div className="text-sm font-black uppercase">¡Comanda Enviada a Cocina!</div>
                <div className="text-xs text-blue-200">Mesa #{selectedTable?.table_number} en preparación</div>
              </div>
            </div>
          </div>
        )}

        {/* Selector Rápido de Mesas con Semáforo */}
        <TableSelector
          tables={tables}
          selectedTable={selectedTable?.table_number || null}
          tableStatuses={tableStatuses}
          tableDwellMinutes={tableDwellMinutes}
          onSelectTable={handleSelectTableAndClearAlerts}
        />

        {/* PANEL DETALLADO DE ESTADO PARA LA MESA SELECCIONADA */}
        {selectedTable && (
          <div className="max-w-7xl mx-auto w-full px-3 pt-3 space-y-2.5">
            
            {/* A. Avisos Pendientes Específicos de esta Mesa */}
            {pendingCalls.filter(c => c.table_number.toString() === selectedTable.table_number.toString()).length > 0 && (
              <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-3.5 space-y-2 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                    <h4 className="font-black text-xs sm:text-sm text-amber-950 uppercase tracking-wider">
                      Solicitudes de Mesa #{selectedTable.table_number}
                    </h4>
                  </div>
                  <span className="text-[11px] font-bold text-amber-800">
                    {pendingCalls.filter(c => c.table_number.toString() === selectedTable.table_number.toString()).length} pendientes
                  </span>
                </div>

                <div className="space-y-1.5">
                  {pendingCalls
                    .filter(c => c.table_number.toString() === selectedTable.table_number.toString())
                    .map(call => (
                      <div
                        key={call.id}
                        className="bg-white p-2.5 rounded-xl border border-amber-200 flex items-center justify-between gap-2 shadow-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Bell className="w-4 h-4 text-amber-600 flex-shrink-0" />
                          <span className="text-xs font-extrabold text-slate-900 truncate">
                            {call.text}
                          </span>
                        </div>
                        <button
                          onClick={() => handleAttendCall(call.id)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center gap-1 shadow-xs transition-transform active:scale-95 flex-shrink-0"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          <span>Atendido</span>
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* B. Platos Listos en Cocina para Servir (Individuales por Ticket) */}
            {serverOrders.filter(
              o => (o.table_number?.toString() === selectedTable.table_number.toString() || o.table?.table_number?.toString() === selectedTable.table_number.toString()) && o.status === 'ready'
            ).length > 0 && (
              <div className="bg-emerald-50 border-2 border-emerald-400 rounded-2xl p-3.5 space-y-2.5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-emerald-700 animate-pulse" />
                    <h4 className="font-black text-xs sm:text-sm text-emerald-950 uppercase tracking-wider">
                      Platos Listos para Servir (Mesa #{selectedTable.table_number})
                    </h4>
                  </div>
                  <button
                    onClick={() => handleMarkDelivered(selectedTable.table_number)}
                    className="px-3 py-1 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black transition-all shadow-xs"
                  >
                    Servir Todos ({serverOrders.filter(
                      o => (o.table_number?.toString() === selectedTable.table_number.toString() || o.table?.table_number?.toString() === selectedTable.table_number.toString()) && o.status === 'ready'
                    ).length})
                  </button>
                </div>

                <div className="space-y-2">
                  {serverOrders
                    .filter(
                      o => (o.table_number?.toString() === selectedTable.table_number.toString() || o.table?.table_number?.toString() === selectedTable.table_number.toString()) && o.status === 'ready'
                    )
                    .map((ord, idx) => (
                      <div
                        key={ord.id}
                        className="bg-white p-3 rounded-xl border border-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shadow-xs"
                      >
                        <div className="space-y-0.5 min-w-0">
                          <span className="text-[10px] font-black uppercase text-emerald-700 block">
                            Ticket #{idx + 1}
                          </span>
                          <div className="text-xs font-bold text-slate-900">
                            {ord.order_items?.map(it => `${it.quantity}x ${it.product?.name || 'Plato'}`).join(' + ')}
                          </div>
                          {ord.order_items?.some(it => it.notes) && (
                            <p className="text-[11px] text-red-700 font-semibold">
                              Nota: {ord.order_items.map(it => it.notes).filter(Boolean).join(' | ')}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <button
                            onClick={() => handleDeliverSingleOrder(ord.id)}
                            className="flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-xs transition-transform active:scale-95 flex-shrink-0"
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            <span>Entregado</span>
                          </button>

                          <button
                            onClick={() => {
                              const reason = prompt('Motivo de anulación (ej: Error comanda / Plato frío):', 'Error de comanda')
                              if (reason) handleCancelSingleOrder(ord.id, reason)
                            }}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-red-50 text-slate-400 hover:text-red-700 border border-slate-200 transition-colors"
                            title="Anular plato marchado"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* C. Panel de Control de Mesa (Ordenado, Ergonómico y Limpio) */}
            <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              
              {/* Fila 1: Datos de Mesa, Comensales y Descuentos */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-100">
                <div className="flex items-center justify-between sm:justify-start gap-2.5">
                  <span className="text-slate-900 font-extrabold text-sm">
                    Mesa #{selectedTable.table_number}
                  </span>
                  
                  {/* Selector de Comensales (Pax) */}
                  <div className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-xl border border-slate-200">
                    <Users size={14} className="text-slate-600" />
                    <span className="text-xs font-black text-slate-800">
                      {tablePax[selectedTable.table_number] || 2} pax
                    </span>
                    <div className="flex items-center gap-0.5 ml-1">
                      <button
                        type="button"
                        onClick={() => setTablePax(prev => ({
                          ...prev,
                          [selectedTable.table_number]: Math.max(1, (prev[selectedTable.table_number] || 2) - 1)
                        }))}
                        className="w-5 h-5 rounded-lg bg-white hover:bg-slate-200 text-slate-800 font-black flex items-center justify-center text-xs shadow-2xs cursor-pointer active:scale-95"
                        title="Menos comensales"
                      >
                        -
                      </button>
                      <button
                        type="button"
                        onClick={() => setTablePax(prev => ({
                          ...prev,
                          [selectedTable.table_number]: (prev[selectedTable.table_number] || 2) + 1
                        }))}
                        className="w-5 h-5 rounded-lg bg-white hover:bg-slate-200 text-slate-800 font-black flex items-center justify-center text-xs shadow-2xs cursor-pointer active:scale-95"
                        title="Más comensales"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Selector de Descuento de Mesa */}
                <div className="flex items-center justify-between sm:justify-end gap-1.5">
                  <span className="text-xs font-bold text-slate-500">Dto:</span>
                  <div className="flex items-center gap-1 bg-slate-50 p-0.5 rounded-xl border border-slate-200">
                    {[0, 5, 10, 15, 20].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => setTableDiscounts(prev => ({ ...prev, [selectedTable.table_number]: pct }))}
                        className={`px-2 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                          (tableDiscounts[selectedTable.table_number] || 0) === pct
                            ? 'bg-blue-900 text-white shadow-xs'
                            : 'text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {pct === 0 ? '0%' : `-${pct}%`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Fila 2: Grid de Acciones Operativas Ordenadas en 2 Columnas (Móvil) / 4 (Desktop) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {/* 1. Marchar Segundos */}
                <button
                  type="button"
                  onClick={() => handleFireSecondCourses(selectedTable.table_number)}
                  className="h-11 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs transition-all shadow-xs flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                  title="Avisar a cocina que marchen los segundos platos"
                >
                  <Flame className="w-4 h-4 text-slate-950 flex-shrink-0" />
                  <span className="truncate">Marchar Segundos</span>
                </button>

                {/* 2. Pre-Cuenta */}
                <button
                  type="button"
                  onClick={() => setShowPreBill(true)}
                  className="h-11 px-3 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-800 hover:text-blue-900 border border-slate-200 hover:border-blue-300 font-extrabold transition-all text-xs flex items-center justify-center gap-1.5 active:scale-95 shadow-xs cursor-pointer"
                  title="Ver pre-cuenta digital desglosada"
                >
                  <Receipt className="w-4 h-4 text-blue-700 flex-shrink-0" />
                  <span className="truncate">Pre-Cuenta</span>
                </button>

                {/* 3. Transferir Mesa */}
                <button
                  type="button"
                  onClick={() => setShowTransferModal(true)}
                  className="h-11 px-3 rounded-xl bg-slate-100 hover:bg-amber-50 text-slate-800 hover:text-amber-900 border border-slate-200 hover:border-amber-300 font-extrabold transition-all text-xs flex items-center justify-center gap-1.5 active:scale-95 shadow-xs cursor-pointer"
                  title="Cambiar comanda a otra mesa"
                >
                  <RefreshCw className="w-4 h-4 text-amber-700 flex-shrink-0" />
                  <span className="truncate">Transferir</span>
                </button>

                {/* 4. Liberar / Cobrar Mesa */}
                <button
                  type="button"
                  onClick={() => setShowFreeConfirmTable(selectedTable.table_number)}
                  className="h-11 px-3 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-800 hover:text-emerald-800 border border-slate-200 hover:border-emerald-300 font-extrabold transition-all text-xs flex items-center justify-center gap-1.5 active:scale-95 shadow-xs cursor-pointer"
                  title="Cobrar y liberar mesa"
                >
                  <CreditCard className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                  <span className="truncate">Liberar Mesa</span>
                </button>
              </div>

              {/* Botón extra si hay bebidas previas para repetir ronda */}
              {previousDrinksInTable.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    previousDrinksInTable.forEach(d => {
                      handleAddItemToComanda(d.product, d.quantity, [], 'Repetición de ronda')
                    })
                    setOrderSentToast(true)
                    setTimeout(() => setOrderSentToast(false), 2500)
                  }}
                  className="w-full h-10 px-3 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-950 font-black transition-all text-xs flex items-center justify-center gap-1.5 border border-amber-300 shadow-xs active:scale-95 cursor-pointer"
                  title="Añadir a la comanda las mismas bebidas que ya pidieron"
                >
                  <span>🍺 Repetir Ronda de Bebidas ({previousDrinksInTable.reduce((s, d) => s + d.quantity, 0)} uds)</span>
                </button>
              )}
            </div>

          </div>
        )}

        {/* Buscador & Selector de Categorías en Píldoras Blancas */}
        <div className="p-3 bg-white border-b border-slate-200 space-y-2.5 shadow-sm">
          <div className="max-w-7xl mx-auto relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar plato rápido..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-800/20 focus:border-blue-800 shadow-inner"
              autoComplete="off"
            />
          </div>

          {/* Carrusel de Píldoras */}
          <div className="max-w-7xl mx-auto flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.id
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat.id)
                    setSearchQuery('')
                  }}
                  className={`flex-shrink-0 px-3.5 py-1.5 rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all ${
                    isSelected
                      ? 'bg-blue-900 text-white shadow-md'
                      : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 shadow-sm'
                  }`}
                >
                  {cat.name}
                </button>
              )
            })}
          </div>
        </div>

        {/* Parrilla de Platos */}
        <main className="p-3 max-w-7xl mx-auto w-full flex-1">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-16 text-slate-400 space-y-2 bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
              <Utensils className="w-12 h-12 mx-auto stroke-[1.2] text-slate-300" />
              <p className="text-sm font-semibold text-slate-600">No hay platos registrados en esta categoría</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {filteredProducts.map((prod) => (
                <button
                  key={prod.id}
                  onClick={() => setCustomizingProduct(prod)}
                  className="group bg-white border border-slate-200 hover:border-blue-700/50 active:scale-97 rounded-2xl overflow-hidden text-left flex flex-col justify-between shadow-sm hover:shadow-md transition-all touch-press h-48"
                >
                  <div
                    style={{ position: 'relative', width: '100%', height: '112px', maxHeight: '120px', overflow: 'hidden' }}
                    className="bg-slate-100 flex-shrink-0"
                  >
                    {prod.image_url ? (
                      <Image
                        src={prod.image_url}
                        alt={prod.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 768px) 50vw, 250px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-100">
                        <Utensils className="w-6 h-6 stroke-[1.2]" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    
                    <span className="absolute bottom-1.5 left-2 px-2 py-0.5 rounded-lg bg-white/95 text-[11px] font-black text-blue-900 shadow-sm">
                      {formatCurrency(prod.price)}
                    </span>
                  </div>

                  <div className="p-2.5 flex items-center justify-between gap-1.5 flex-1">
                    <h4 className="font-bold text-slate-900 text-xs leading-snug line-clamp-2">
                      {prod.name}
                    </h4>
                    <span className="w-7 h-7 rounded-xl bg-blue-900 text-white flex items-center justify-center shadow-sm flex-shrink-0 group-hover:bg-blue-800 transition-colors">
                      <Plus className="w-4 h-4 stroke-[3]" />
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </main>

        <ProductModifierModal
          product={customizingProduct}
          onClose={() => setCustomizingProduct(null)}
          onConfirm={handleAddItemToComanda}
        />

        <OrderSummaryBar
          cart={cart}
          tableNumber={selectedTable?.table_number.toString() || null}
          isSubmitting={isSubmitting}
          onSendOrder={handleSendOrderToKitchen}
          onOpenCartDetails={() => setIsCartDetailsOpen(true)}
        />

        <CartDrawer
          isOpen={isCartDetailsOpen}
          onClose={() => setIsCartDetailsOpen(false)}
          cart={cart}
          onUpdateQuantity={(idx, q) => {
            updateCartForCurrentTable(prev => {
              if (q <= 0) return prev.filter((_, i) => i !== idx)
              const copy = [...prev]
              copy[idx].quantity = q
              return copy
            })
          }}
          onRemoveItem={(idx) => {
            updateCartForCurrentTable(prev => prev.filter((_, i) => i !== idx))
          }}
          onClearCart={() => {
            setTableCarts(prev => ({ ...prev, [currentTableNum]: [] }))
          }}
          tableNumber={selectedTable?.table_number.toString() || null}
          onAddSuggestedDrink={(drinkId) => {
            const drink = products.find(p => p.id === drinkId)
            if (drink) {
              handleAddItemToComanda(drink, 1, [], '')
            }
          }}
          onAddSuggestedDessert={(dessertId) => {
            const dessert = products.find(p => p.id === dessertId)
            if (dessert) {
              handleAddItemToComanda(dessert, 1, [], '')
            }
          }}
        />

        {/* MODAL DE CONFIRMACIÓN ELEGANTE DENTRO DE LA APP PARA LIBERAR MESA */}
        <ConfirmModal
          isOpen={Boolean(showFreeConfirmTable)}
          title={`¿Liberar Mesa #${showFreeConfirmTable}?`}
          message="Se marcará la mesa como libre, se cerrarán los pedidos y se limpiará la sesión para los próximos comensales."
          confirmText="Sí, liberar mesa"
          cancelText="Cancelar"
          variant="success"
          onConfirm={() => {
            if (showFreeConfirmTable) {
              executeCloseAndFreeTable(showFreeConfirmTable)
            }
            setShowFreeConfirmTable(null)
          }}
          onCancel={() => setShowFreeConfirmTable(null)}
        />

        {/* MODAL DE PRE-CUENTA DIGITAL */}
        {selectedTable && (
          <PreBillModal
            isOpen={showPreBill}
            onClose={() => setShowPreBill(false)}
            restaurant={restaurant}
            tableNumber={selectedTable.table_number}
            paxCount={tablePax[selectedTable.table_number] || 2}
            discountPercentage={tableDiscounts[selectedTable.table_number] || 0}
            orders={serverOrders.filter(
              o => (o.table_number?.toString() === selectedTable.table_number.toString() || o.table?.table_number?.toString() === selectedTable.table_number.toString()) && o.status !== 'delivered'
            )}
            onProceedToCharge={() => {
              setShowFreeConfirmTable(selectedTable.table_number)
            }}
          />
        )}

        {/* MODAL DE TRANSFERIR MESA */}
        {showTransferModal && selectedTable && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in select-none">
            <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-200">
              <div className="flex items-center gap-2 text-amber-600">
                <RefreshCw className="w-6 h-6 animate-spin" />
                <h3 className="text-base font-black text-slate-900">
                  Transferir Mesa #{selectedTable.table_number}
                </h3>
              </div>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                Selecciona la nueva mesa a la que se mudan los comensales. Sus pedidos, carrito y cuenta se transferirán automáticamente.
              </p>
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Mesa de Destino:</label>
                <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1">
                  {tables
                    .filter(t => t.table_number.toString() !== selectedTable.table_number.toString())
                    .map(t => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setTransferTargetTable(t.table_number.toString())}
                        className={`p-2.5 rounded-xl text-xs font-black transition-all border ${
                          transferTargetTable === t.table_number.toString()
                            ? 'bg-amber-500 text-slate-950 border-amber-600 ring-2 ring-amber-400'
                            : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                        }`}
                      >
                        #{t.table_number}
                      </button>
                    ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowTransferModal(false)
                    setTransferTargetTable('')
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={!transferTargetTable}
                  onClick={() => {
                    if (transferTargetTable) {
                      handleTransferTable(transferTargetTable)
                      setTransferTargetTable('')
                    }
                  }}
                  className="px-5 py-2 rounded-xl text-xs font-black bg-amber-500 hover:bg-amber-400 text-slate-950 disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
                >
                  Confirmar Mudanza
                </button>
              </div>
            </div>
          </div>
        )}

        </div>
      </TenantProvider>
    </StaffPinAuth>
  )
}
