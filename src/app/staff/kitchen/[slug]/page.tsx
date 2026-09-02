'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { ChefHat, Volume2, VolumeX, RefreshCw, Layers, Sparkles, Utensils, Wine, Flame, Maximize2, Minimize2, Undo2, Check, X } from 'lucide-react'
import { TenantProvider } from '@/components/tenant/TenantProvider'
import { TenantHeader } from '@/components/tenant/TenantHeader'
import { KitchenTicket } from '@/components/kitchen/KitchenTicket'
import { Order, OrderStatus, Restaurant } from '@/types/database.types'
import { playKitchenChime } from '@/components/kitchen/AudioNotification'
import { StaffPinAuth } from '@/components/auth/StaffPinAuth'
import { createBrowserClient } from '@/lib/supabase/client'
import { MOCK_RESTAURANTS, getMockOrders, saveMockOrders, updateMockOrderStatus } from '@/lib/supabase/mock-fallback'

type StationFilterType = 'all' | 'kitchen' | 'bar'

export default function KitchenKDSPage() {
  const params = useParams()
  const slug = (params?.slug as string) || 'burger-gourmet'

  const [restaurant, setRestaurant] = useState<Restaurant>(() => MOCK_RESTAURANTS[slug] || MOCK_RESTAURANTS['burger-gourmet'])
  const [orders, setOrders] = useState<Order[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(`fluxo_kds_orders_${slug}`)
        if (stored) {
          const parsed = JSON.parse(stored)
          if (Array.isArray(parsed)) {
            const now = Date.now()
            return parsed.filter(
              (o: Order) =>
                o.status !== 'delivered' &&
                o.status !== 'cancelled' &&
                o.order_items &&
                o.order_items.length > 0 &&
                now - new Date(o.created_at).getTime() < 12 * 60 * 60 * 1000
            )
          }
        }
      } catch {}
    }
    return []
  })
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [newOrderAlert, setNewOrderAlert] = useState(false)
  const [filterStatus, setFilterStatus] = useState<'active' | 'all' | 'ready'>('all')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [recentDispatchedOrders, setRecentDispatchedOrders] = useState<Order[]>([])
  
  // Filtro de Estación: Cocina vs. Barra
  const [stationFilter, setStationFilter] = useState<StationFilterType>('all')

  const previousOrdersCountRef = useRef<number>(0)
  const seenOrderIdsRef = useRef<Set<string>>(new Set())
  const dispatchedOrderIdsRef = useRef<Set<string>>(new Set())
  const localStatusOverridesRef = useRef<Map<string, { status: OrderStatus; timestamp: number }>>(new Map())

  // Persistir comandas activas en localStorage para blindaje total contra bloqueo de pantalla o suspensión en móvil
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const active = orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled')
        localStorage.setItem(`fluxo_kds_orders_${slug}`, JSON.stringify(active))
      } catch {}
    }
  }, [orders, slug])

  // Toggle de Pantalla Completa con 1 Toque
  const toggleFullscreen = () => {
    if (typeof document === 'undefined') return
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {})
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {})
    }
  }

  // Deshacer el último ticket despachado
  const handleUndoLastDispatch = () => {
    if (recentDispatchedOrders.length === 0) return
    const last = recentDispatchedOrders[0]
    dispatchedOrderIdsRef.current.delete(last.id)
    handleUpdateStatus(last.id, 'preparing')
    setRecentDispatchedOrders(prev => prev.slice(1))
  }

  // Recordatorio sonoro cada 2 minutos si hay pedidos demorados (> 20 min)
  useEffect(() => {
    const checkDelayedOrders = () => {
      const hasDelayed = orders.some(o => {
        if (o.status !== 'pending' && o.status !== 'preparing') return false
        const mins = Math.floor((Date.now() - new Date(o.created_at).getTime()) / 60000)
        return mins >= 20
      })
      if (hasDelayed && soundEnabled) {
        playKitchenChime()
      }
    }
    const timer = setInterval(checkDelayedOrders, 120000)
    return () => clearInterval(timer)
  }, [orders, soundEnabled])

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

  // 2. Carga inicial, sincronización en tiempo real con la API del servidor y SSE
  useEffect(() => {
    let sseEventSource: EventSource | null = null
    let pollInterval: any = null

    const fetchServerOrders = async () => {
      try {
        const res = await fetch(`/api/orders?slug=${slug}`)
        if (res.ok) {
          const data = await res.json()
          if (data.orders) {
            // La cocina solo recibe comandas ya validadas por el mozo y con platos reales (Cero pedidos falsos)
            const incomingOrders: Order[] = data.orders.filter(
              (o: Order) => o.status !== 'pending_validation' && o.order_items && o.order_items.length > 0
            )

            // Detectar nueva orden entrante real para sonar campana
            let hasNewUnseenOrder = false
            incomingOrders.forEach(ord => {
              if (!seenOrderIdsRef.current.has(ord.id) && ord.status !== 'delivered' && ord.status !== 'cancelled') {
                seenOrderIdsRef.current.add(ord.id)
                hasNewUnseenOrder = true
              }
            })

            if (hasNewUnseenOrder && previousOrdersCountRef.current > 0) {
              if (soundEnabled) playKitchenChime()
              setNewOrderAlert(true)
            }
            previousOrdersCountRef.current = incomingOrders.length

            // Reconciliación con Jerarquía de Estados (Monótona Creciente - Cero Parpadeos)
            setOrders(prev => {
              const map = new Map<string, Order>()
              prev.forEach(ord => {
                if (!dispatchedOrderIdsRef.current.has(ord.id) && ord.status !== 'delivered' && ord.status !== 'cancelled') {
                  map.set(ord.id, ord)
                }
              })
              const STATUS_RANK: Record<string, number> = {
                pending_validation: 0,
                pending: 1,
                preparing: 2,
                ready: 3,
                delivered: 4,
                cancelled: 5,
              }
              incomingOrders.forEach(ord => {
                const override = localStatusOverridesRef.current.get(ord.id)
                const overrideRank = override ? (STATUS_RANK[override.status] ?? 0) : 0
                const incomingRank = STATUS_RANK[ord.status] ?? 0
                const effectiveStatus = overrideRank > incomingRank ? override!.status : ord.status

                if (effectiveStatus === 'delivered' || effectiveStatus === 'cancelled' || dispatchedOrderIdsRef.current.has(ord.id)) {
                  map.delete(ord.id)
                } else {
                  map.set(ord.id, { ...ord, status: effectiveStatus })
                }
              })
              return Array.from(map.values())
            })
          }
        }
      } catch (err) {
        console.log('Error fetching server orders in KDS:', err)
      }
    }

    async function initKDS() {
      if (MOCK_RESTAURANTS[slug]) {
        setRestaurant(MOCK_RESTAURANTS[slug])
      }

      await fetchServerOrders()

      // SSE en tiempo real
      try {
        sseEventSource = new EventSource('/api/events')
        sseEventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            if (data.slug === slug || data.type === 'order_created' || data.type === 'order_updated' || data.type === 'connected') {
              fetchServerOrders()
            }
          } catch {
            // ignore
          }
        }
      } catch (err) {
        console.log('SSE not supported, using fast polling:', err)
      }

      // Polling de respaldo cada 1.5s
      pollInterval = setInterval(fetchServerOrders, 1500)
    }

    initKDS()

    // Manejar desbloqueo de móvil / cambio de pestaña de vuelta a la app
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchServerOrders()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleVisibilityChange)

    return () => {
      if (sseEventSource) sseEventSource.close()
      if (pollInterval) clearInterval(pollInterval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleVisibilityChange)
    }
  }, [slug, soundEnabled])

  // Actualizar estado de comanda
  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    // 0. Registrar override optimista para blindar contra rebotes en polling
    localStatusOverridesRef.current.set(orderId, { status: newStatus, timestamp: Date.now() })

    // 1. Tracking para deshacer último despacho
    const targetOrd = orders.find(o => o.id === orderId)
    const tableNum = targetOrd?.table?.table_number ?? targetOrd?.table_number ?? 1

    if (targetOrd && (newStatus === 'ready' || newStatus === 'delivered')) {
      setRecentDispatchedOrders(prev => [targetOrd, ...prev.slice(0, 4)])
    }

    if (newStatus === 'delivered' || newStatus === 'cancelled') {
      dispatchedOrderIdsRef.current.add(orderId)
    }

    // 2. Actualizar estado local inmediatamente
    if (newStatus === 'delivered' || newStatus === 'cancelled') {
      setOrders(prev => prev.filter(o => o.id !== orderId))
    } else {
      setOrders(prev =>
        prev.map(o => (o.id === orderId ? { ...o, status: newStatus } : o))
      )
    }
    updateMockOrderStatus(slug, orderId, newStatus)

    // 3. Notificar a la API del servidor con la mesa exacta (await para sincronización garantizada)
    try {
      await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          orderId,
          status: newStatus,
          table_number: tableNum,
        }),
      })
    } catch (err) {
      console.error('Error updating order status from kitchen:', err)
    }
  }

  // Filtrado de comandas por estado
  const activeOrders = orders.filter(o => o.status === 'pending' || o.status === 'preparing')
  const readyOrders = orders.filter(o => o.status === 'ready')

  // Resumen acumulado de platos en línea (para saber cuánta carne tirar a la plancha de golpe)
  const pendingDishesSummary = useMemo(() => {
    const counts: Record<string, number> = {}
    activeOrders.forEach(ord => {
      (ord.order_items || []).forEach(item => {
        const name = item.product?.name || 'Plato'
        counts[name] = (counts[name] || 0) + (item.quantity || 1)
      })
    })
    return Object.entries(counts).sort((a, b) => b[1] - a[1])
  }, [activeOrders])

  let displayedOrders = filterStatus === 'active'
    ? activeOrders
    : filterStatus === 'ready'
    ? readyOrders
    : orders.filter(o => o.status !== 'delivered' && o.status !== 'pending_validation')

  // Filtrado por Estación (Cocina vs Barra)
  if (stationFilter !== 'all') {
    displayedOrders = displayedOrders.filter(order => {
      if (!order.order_items || order.order_items.length === 0) return true
      const hasBarItems = order.order_items.some(item => {
        const catId = (item.product?.category_id || '').toLowerCase()
        const name = (item.product?.name || '').toLowerCase()
        return (
          catId.includes('bebida') || catId.includes('trago') || catId.includes('gin') ||
          catId === 'cat-12' || catId === 'cat-13' || catId === 'cat-14' || catId === 'cat-15' ||
          name.includes('cerveza') || name.includes('vino') || name.includes('gin') ||
          name.includes('fernet') || name.includes('gaseosa') || name.includes('agua') ||
          name.includes('pinta') || name.includes('trago')
        )
      })

      if (stationFilter === 'bar') return hasBarItems
      if (stationFilter === 'kitchen') return !hasBarItems || order.order_items.length > 1
      return true
    })
  }

  return (
    <StaffPinAuth role="kitchen" restaurantSlug={slug}>
      <TenantProvider restaurant={restaurant}>
        <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col select-none" style={{ touchAction: 'manipulation' }}>
        
        <TenantHeader viewType="kitchen" />

        {/* Notificación de Nueva Comanda con Confirmación Manual */}
        {newOrderAlert && (
          <div className="bg-blue-900 text-white px-4 py-3 shadow-lg border-b border-blue-700 flex items-center justify-between gap-3 animate-in slide-in-from-top duration-300">
            <div className="flex items-center gap-2.5 min-w-0">
              <Sparkles className="w-5 h-5 text-amber-400 animate-pulse flex-shrink-0" />
              <span className="font-black text-xs sm:text-sm uppercase tracking-wide">¡NUEVA COMANDA ENVIADA A COCINA!</span>
            </div>
            <button
              type="button"
              onClick={() => setNewOrderAlert(false)}
              className="px-3 py-1.5 rounded-xl bg-blue-800 hover:bg-blue-700 text-white font-black text-xs border border-blue-600 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 flex-shrink-0 shadow-xs"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Entendido</span>
            </button>
          </div>
        )}

        {/* Barra de Control KDS con Filtro de Estación y Pantalla Completa */}
        <div className="bg-white border-b border-slate-200 px-4 py-3 shadow-sm">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
            
            {/* Métricas y Filtro de Estaciones (Cocina / Barra) */}
            <div className="flex items-center gap-3 flex-wrap">
              {/* Selector de Estación */}
              <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs font-bold">
                <button
                  onClick={() => setStationFilter('all')}
                  className={`px-3 py-1.5 rounded-xl transition-all ${
                    stationFilter === 'all'
                      ? 'bg-white text-blue-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Todas las Estaciones
                </button>
                <button
                  onClick={() => setStationFilter('kitchen')}
                  className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all ${
                    stationFilter === 'kitchen'
                      ? 'bg-white text-amber-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Flame className="w-3.5 h-3.5 text-amber-600" />
                  <span>Solo Cocina</span>
                </button>
                <button
                  onClick={() => setStationFilter('bar')}
                  className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all ${
                    stationFilter === 'bar'
                      ? 'bg-white text-purple-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Wine className="w-3.5 h-3.5 text-purple-600" />
                  <span>Solo Barra / Bebidas</span>
                </button>
              </div>

              <div className="hidden lg:flex items-center gap-2">
                <div className="px-3 py-1 rounded-xl bg-amber-50 border border-amber-200 text-xs font-bold text-amber-900 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                  <span>Pendientes: <strong>{activeOrders.length}</strong></span>
                </div>
                <div className="px-3 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Listas: <strong>{readyOrders.length}</strong></span>
                </div>
              </div>
            </div>

            {/* Filtros de Estado, Deshacer, Pantalla Completa y Audio Toggle */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Botón Deshacer Último Despacho */}
              {recentDispatchedOrders.length > 0 && (
                <button
                  onClick={handleUndoLastDispatch}
                  className="px-3 py-1.5 rounded-2xl bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300 text-xs font-black transition-all flex items-center gap-1.5 shadow-xs active:scale-95"
                  title="Recuperar la última comanda despachada"
                >
                  <Undo2 size={13} className="text-amber-800" />
                  <span>Deshacer Despacho</span>
                </button>
              )}

              <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs font-bold">
                <button
                  onClick={() => setFilterStatus('all')}
                  className={`px-3 py-1.5 rounded-xl transition-all ${
                    filterStatus === 'all'
                      ? 'bg-white text-slate-950 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Todas ({orders.length})
                </button>
                <button
                  onClick={() => setFilterStatus('active')}
                  className={`px-3 py-1.5 rounded-xl transition-all ${
                    filterStatus === 'active'
                      ? 'bg-white text-blue-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  En Marcha ({activeOrders.length})
                </button>
                <button
                  onClick={() => setFilterStatus('ready')}
                  className={`px-3 py-1.5 rounded-xl transition-all ${
                    filterStatus === 'ready'
                      ? 'bg-white text-emerald-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Listas ({readyOrders.length})
                </button>
              </div>

              {/* Botón Pantalla Completa */}
              <button
                onClick={toggleFullscreen}
                className="p-2.5 rounded-2xl border bg-white text-slate-700 hover:bg-slate-50 border-slate-200 text-xs font-bold transition-all shadow-xs"
                title={isFullscreen ? 'Salir de pantalla completa' : 'Ver en pantalla completa (TV / Tablet)'}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>

              {/* Toggle de Alerta Sonora */}
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`p-2.5 rounded-2xl border flex items-center gap-1.5 text-xs font-bold transition-all shadow-sm ${
                  soundEnabled
                    ? 'bg-white text-blue-900 border-slate-300'
                    : 'bg-slate-100 text-slate-400 border-slate-200'
                }`}
                title={soundEnabled ? 'Silenciar alertas' : 'Activar timbre sonoro'}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4 text-blue-700" /> : <VolumeX className="w-4 h-4" />}
                <span className="hidden sm:inline">{soundEnabled ? 'Audio: ON' : 'Audio: OFF'}</span>
              </button>
            </div>

          </div>
        </div>

        {/* BARRA DE RESUMEN DE PRODUCCIÓN EN LOTE (BATCH BAR) */}
        {pendingDishesSummary.length > 0 && filterStatus === 'active' && (
          <div className="bg-slate-900 text-white px-4 py-2 text-xs font-bold border-b border-slate-800 overflow-x-auto shadow-inner">
            <div className="max-w-7xl mx-auto flex items-center gap-2 no-scrollbar">
              <span className="text-amber-400 flex items-center gap-1 font-black whitespace-nowrap">
                <Flame size={14} />
                <span>En Línea:</span>
              </span>
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                {pendingDishesSummary.map(([dishName, totalQty], idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-0.5 rounded-xl bg-white/10 text-white font-extrabold text-[11px] whitespace-nowrap flex items-center gap-1.5 border border-white/15"
                  >
                    <strong className="text-amber-300 font-black">{totalQty}x</strong>
                    <span>{dishName}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* PARRILLA DE COMANDAS ACTIVAS EN COCINA */}
        <main className="max-w-7xl mx-auto p-4 w-full flex-1">
          {displayedOrders.length === 0 ? (
            <div className="h-96 flex flex-col items-center justify-center text-center p-8 space-y-3 bg-white rounded-3xl border border-slate-200 shadow-sm my-6">
              <ChefHat className="w-14 h-14 text-slate-300 stroke-[1.2]" />
              <h3 className="font-extrabold text-slate-900 text-lg">
                ¡Estación al día! No hay comandas pendientes
              </h3>
              <p className="text-xs text-slate-500 max-w-sm">
                Cuando los comensales o mozos carguen un pedido, aparecerá inmediatamente aquí con alerta sonora y la foto del plato.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {displayedOrders.map((order) => (
                <KitchenTicket
                  key={order.id}
                  order={order}
                  onUpdateStatus={handleUpdateStatus}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </TenantProvider>
  </StaffPinAuth>
  )
}
