'use client'

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { ChefHat, Volume2, VolumeX, Sparkles, Flame, Maximize2, Minimize2, Check } from 'lucide-react'
import { TenantProvider } from '@/components/tenant/TenantProvider'
import { TenantHeader } from '@/components/tenant/TenantHeader'
import { KitchenTicket } from '@/components/kitchen/KitchenTicket'
import { Order, OrderStatus, Restaurant, Product } from '@/types/database.types'
import { playKitchenChime } from '@/components/kitchen/AudioNotification'
import { StaffPinAuth } from '@/components/auth/StaffPinAuth'
import { createBrowserClient } from '@/lib/supabase/client'
import { MOCK_RESTAURANTS, MOCK_PRODUCTS } from '@/lib/supabase/mock-fallback'
import {
  orderHasFood,
  orderHasDesserts,

  isOrderDessertsReady,
  orderHasActiveDesserts,
  areOrderStartersServed,
  getItemCourse,
  mergeOrderItemsCourseTags,
  mergeItemNotes,
  isDrinkItem,
  isPackHeaderItem,
  isStarterItem,
  isMainItem,
  isDessertItem,
  isStarterReady,
  isStarterServed,
  isMainReady,
  isMainServed,
  isDessertReady,
  isDessertServed,
  orderHasStarters,
  orderHasMains,
  areOrderStartersReady,
  areOrderMainsFired,
  areOrderMainsReady,
  areOrderMainsServed,
  areOrderDessertsServed,
  hydrateOrderItemsWithCatalog,
  areAllKitchenCoursesCompleted,
  resolveCatalogProductForItem,
  isGenericProductName,
} from '@/lib/course-utils'
import { subscribeFluxoSync } from '@/lib/sync-channel'

export default function KitchenKDSPage() {
  const params = useParams()
  const slug = (params?.slug as string) || 'burger-gourmet'

  const [restaurant, setRestaurant] = useState<Restaurant>(() => MOCK_RESTAURANTS[slug] || MOCK_RESTAURANTS['burger-gourmet'])
  const productsRef = useRef<Product[]>(MOCK_PRODUCTS[slug] || MOCK_PRODUCTS['burger-gourmet'] || [])
  const [orders, setOrders] = useState<Order[]>([])
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [newOrderAlert, setNewOrderAlert] = useState(false)
  const [filterStatus, setFilterStatus] = useState<'active' | 'all' | 'ready'>('active')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [updatingOrderIds, setUpdatingOrderIds] = useState<Set<string>>(new Set())

  const previousOrdersCountRef = useRef<number>(0)
  const seenOrderIdsRef = useRef<Set<string>>(new Set())
  const seenFiredMainOrderIdsRef = useRef<Set<string>>(new Set())
  const seenFiredDessertOrderIdsRef = useRef<Set<string>>(new Set())
  const ordersFingerRef = useRef<string>('')
  const prevOrdersMapRef = useRef<Map<string, Order>>(new Map())
  const recentMutationsRef = useRef<Map<string, { status?: OrderStatus; order?: Order; until: number }>>(new Map())
  const mutationLockUntilRef = useRef<Map<string, number>>(new Map())
  const fetchRequestIdRef = useRef<number>(0)

  // Toggle de Pantalla Completa con 1 Toque
  const toggleFullscreen = () => {
    if (typeof document === 'undefined') return
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {})
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {})
    }
  }

  // Recordatorio sonoro cada 2 minutos si hay pedidos demorados (> 20 min)
  useEffect(() => {
    const checkDelayedOrders = () => {
      const hasDelayed = orders.some(o => {
        if (o.status !== 'pending' && o.status !== 'confirmed' && o.status !== 'preparing') return false
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
        if ('wakeLock' in navigator && (!wakeLock || wakeLock.released)) {
          wakeLock = await (navigator as any).wakeLock.request('screen')
        }
      } catch (err) {
        console.log('WakeLock not active:', err)
      }
    }
    requestWakeLock()

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        requestWakeLock()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      if (wakeLock) {
        try {
          wakeLock.release()
        } catch {}
      }
    }
  }, [])

  // 2. Sincronización con el servidor (Single Source of Truth - PostgreSQL)
  const fetchServerOrders = useCallback(async () => {
    const reqId = ++fetchRequestIdRef.current
    try {
      const res = await fetch(`/api/orders?slug=${slug}&role=kitchen&_t=${Date.now()}`, { cache: 'no-store' })
      if (reqId !== fetchRequestIdRef.current) {
        return // Descartar respuesta desactualizada si ya se disparó una petición más reciente
      }
      if (res.ok) {
        const data = await res.json()
        if (reqId !== fetchRequestIdRef.current) return

        if (Array.isArray(data.terminal_order_ids)) {
          data.terminal_order_ids.forEach((id: string) => {
            prevOrdersMapRef.current.delete(id)
            recentMutationsRef.current.delete(id)
            mutationLockUntilRef.current.delete(id)
          })
        }

        if (Array.isArray(data.orders)) {
          const rawOrders: Order[] = data.orders || []
          const hydratedOrders: Order[] = rawOrders.map((o: Order) => {
            const cached = prevOrdersMapRef.current.get(o.id)
            const mut = recentMutationsRef.current.get(o.id)
            const lockUntil = mutationLockUntilRef.current.get(o.id) || 0
            const isMutActive = Boolean((mut && Date.now() < mut.until) || Date.now() < lockUntil)

            let effectiveOrdStatus = o.status
            if (isMutActive && mut?.status) {
              effectiveOrdStatus = mut.status
            } else if (o.status === 'pending_validation' && cached?.status && cached.status !== 'pending_validation') {
              effectiveOrdStatus = cached.status
            }

            const mergedOrderNotes = mergeItemNotes((o as any).notes, (cached as any)?.notes)
            const rawItems = (o.order_items && o.order_items.length > 0)
              ? o.order_items
              : (cached?.order_items || [])
            const hydratedItems = hydrateOrderItemsWithCatalog(
              rawItems,
              productsRef.current,
              cached?.order_items,
              mergedOrderNotes
            )
            return {
              ...o,
              status: effectiveOrdStatus,
              notes: mergedOrderNotes,
              order_items: hydratedItems,
            }
          })

          const incomingOrders: Order[] = hydratedOrders.filter((o: Order) => {
            if (o.status === 'cancelled' || o.status === 'paid' || o.status === 'delivered' || o.status === 'pending_validation') {
              return false
            }

            // Bloque 3.2: Solo si tiene items conocidos y ya se completaron todas las fases de cocina, se descarta.
            const hasKnownItems = Boolean(o.order_items && o.order_items.length > 0)
            if (hasKnownItems && areAllKitchenCoursesCompleted(o)) {
              return false
            }

            const isDrinksOnly = hasKnownItems && Boolean(o.order_items && o.order_items.every(isDrinkItem))
            if (isDrinksOnly) return false

            const hasFoodOrDessert =
              orderHasFood(o) ||
              orderHasDesserts(o)

            return !hasKnownItems || hasFoodOrDessert
          })

          // Detectar nueva orden entrante o marcha de principales/postres para sonar campana
          let hasNewUnseenOrder = false
          let hasNewFiredMain = false
          let hasNewFiredDessert = false
          incomingOrders.forEach(ord => {
            if (!seenOrderIdsRef.current.has(ord.id)) {
              seenOrderIdsRef.current.add(ord.id)
              hasNewUnseenOrder = true
            }
            if (orderHasStarters(ord) && areOrderMainsFired(ord) && !seenFiredMainOrderIdsRef.current.has(ord.id)) {
              seenFiredMainOrderIdsRef.current.add(ord.id)
              hasNewFiredMain = true
            }
            if (orderHasActiveDesserts(ord) && !seenFiredDessertOrderIdsRef.current.has(ord.id)) {
              seenFiredDessertOrderIdsRef.current.add(ord.id)
              hasNewFiredDessert = true
            }
          })

          if ((hasNewUnseenOrder && previousOrdersCountRef.current > 0) || hasNewFiredMain || hasNewFiredDessert) {
            if (soundEnabled) playKitchenChime()
            setNewOrderAlert(true)
          }
          previousOrdersCountRef.current = incomingOrders.length

          // Ordenación FIFO (más antiguo primero)
          const sorted = [...incomingOrders].sort(
            (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          )

          // Fingerprint completo incluyendo notes de la orden y notes/estados de todos los order_items
          const computeKdsFinger = (list: Order[]) =>
            list
              .map(
                o =>
                  `${o.id}:${o.status}:${o.version || 1}:${(o as any).notes || ''}:${o.order_items?.length || 0}:${(o.order_items || [])
                    .map(i => `${i.product_id}:${i.quantity}:${i.course || ''}:${i.notes || ''}:${i.product?.name || ''}`)
                    .join(',')}`
              )
              .join('|')

          setOrders(prev => {
            const prevMap = new Map(prev.map(o => [o.id, o]))
            const map = new Map<string, Order>()

            sorted.forEach(ord => {
              const existing = prevMap.get(ord.id) || prevOrdersMapRef.current.get(ord.id)
              const mut = recentMutationsRef.current.get(ord.id)
              const lockUntil = mutationLockUntilRef.current.get(ord.id) || 0
              const isMutActive = Boolean((mut && Date.now() < mut.until) || Date.now() < lockUntil)

              const mergedOrderNotes = mergeItemNotes(
                mergeItemNotes((ord as any).notes, (existing as any)?.notes),
                (mut?.order as any)?.notes
              )

              let effectiveItems = (ord.order_items && ord.order_items.length > 0)
                ? ord.order_items
                : (existing?.order_items || [])
              if (existing?.order_items && existing.order_items.length > 0 && effectiveItems.length > 0) {
                effectiveItems = mergeOrderItemsCourseTags(effectiveItems, existing.order_items)
              }
              if (isMutActive && mut?.order?.order_items) {
                effectiveItems = mergeOrderItemsCourseTags(effectiveItems, mut.order.order_items)
              }

              effectiveItems = hydrateOrderItemsWithCatalog(
                effectiveItems,
                productsRef.current,
                existing?.order_items,
                mergedOrderNotes
              )

              let effectiveStatus = ord.status
              if (isMutActive && mut?.status) {
                effectiveStatus = mut.status
              } else {
                if (existing?.status === 'delivered' && ord.status !== 'delivered' && ord.status !== 'paid') {
                  if (orderHasActiveDesserts({ ...ord, notes: mergedOrderNotes, order_items: effectiveItems }) && (ord.status === 'preparing' || ord.status === 'ready')) {
                    effectiveStatus = ord.status
                  } else {
                    effectiveStatus = 'delivered'
                  }
                } else if (existing?.status === 'ready' && (ord.status === 'pending' || (ord.status === 'preparing' && !areOrderStartersServed({ ...ord, notes: mergedOrderNotes, order_items: effectiveItems }) && !areOrderMainsFired({ ...ord, notes: mergedOrderNotes, order_items: effectiveItems }) && !orderHasActiveDesserts({ ...ord, notes: mergedOrderNotes, order_items: effectiveItems })))) {
                  effectiveStatus = 'ready'
                } else if (existing?.status === 'preparing' && ord.status === 'pending') {
                  effectiveStatus = 'preparing'
                }
              }

              const candidate = {
                ...ord,
                status: effectiveStatus,
                notes: mergedOrderNotes,
                order_items: effectiveItems,
              } as Order

              const hasItems = Boolean(candidate.order_items && candidate.order_items.length > 0)
              const isCompletedCandidate = (hasItems && areAllKitchenCoursesCompleted(candidate)) || candidate.status === 'delivered' || candidate.status === 'paid' || candidate.status === 'cancelled'
              if (!isCompletedCandidate) {
                map.set(candidate.id, candidate)
              }
            })

            // Preservar comandas activas previas que la red o un GET omitió temporalmente (Zero-Flicker Invariant)
            prev.forEach(prevOrd => {
              if (!map.has(prevOrd.id)) {
                // Si el servidor reporta la orden como terminal, descartarla de inmediato
                if (Array.isArray(data.terminal_order_ids) && data.terminal_order_ids.includes(prevOrd.id)) {
                  prevOrdersMapRef.current.delete(prevOrd.id)
                  recentMutationsRef.current.delete(prevOrd.id)
                  mutationLockUntilRef.current.delete(prevOrd.id)
                  return
                }

                // 1. Verificar si el servidor ya conoce esta orden y la marcó finalizada/entregada
                const serverMatch = rawOrders.find(r => r.id === prevOrd.id)
                if (serverMatch) {
                  const isServerTerminal =
                    serverMatch.status === 'cancelled' ||
                    serverMatch.status === 'paid' ||
                    serverMatch.status === 'delivered' ||
                    areAllKitchenCoursesCompleted(serverMatch)
                  if (isServerTerminal) {
                    prevOrdersMapRef.current.delete(prevOrd.id)
                    recentMutationsRef.current.delete(prevOrd.id)
                    mutationLockUntilRef.current.delete(prevOrd.id)
                    return // Descartar permanentemente de pantalla KDS
                  }
                }

                const mut = recentMutationsRef.current.get(prevOrd.id)
                const lockUntil = mutationLockUntilRef.current.get(prevOrd.id) || 0
                const isMutActive = Boolean((mut && Date.now() < mut.until) || Date.now() < lockUntil)
                const hasItems = Boolean(prevOrd.order_items && prevOrd.order_items.length > 0)
                const isCompleted = hasItems && areAllKitchenCoursesCompleted(prevOrd)
                const isTerminal = prevOrd.status === 'cancelled' || prevOrd.status === 'paid' || prevOrd.status === 'delivered' || isCompleted

                if (isTerminal) {
                  prevOrdersMapRef.current.delete(prevOrd.id)
                  recentMutationsRef.current.delete(prevOrd.id)
                  mutationLockUntilRef.current.delete(prevOrd.id)
                  return
                }

                const timeSinceCreated = Date.now() - new Date(prevOrd.created_at || 0).getTime()
                const isVeryRecent = !isNaN(timeSinceCreated) && timeSinceCreated < 15000

                // Preservar por zero-flicker únicamente si hay mutación local activa o fue creada muy recientemente (<15s)
                if (isMutActive || (isVeryRecent && !isTerminal)) {
                  map.set(prevOrd.id, prevOrd)
                }
              }
            })

            const reconciled = Array.from(map.values()).sort(
              (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            )

            const nextFinger = computeKdsFinger(reconciled)
            if (nextFinger === ordersFingerRef.current) {
              return prev
            }
            ordersFingerRef.current = nextFinger
            return reconciled
          })

          sorted.forEach(ord => {
            if (ord.order_items && ord.order_items.length > 0) {
              prevOrdersMapRef.current.set(ord.id, ord)
            }
          })

          rawOrders.forEach(ord => {
            if (
              ord.status === 'delivered' ||
              ord.status === 'paid' ||
              ord.status === 'cancelled' ||
              areAllKitchenCoursesCompleted(ord)
            ) {
              prevOrdersMapRef.current.delete(ord.id)
              recentMutationsRef.current.delete(ord.id)
              mutationLockUntilRef.current.delete(ord.id)
            }
          })
        }
      }
    } catch (err) {
      console.log('Error fetching server orders in KDS:', err)
    }
  }, [slug, soundEnabled])

  // 3. Estrategia Dual Realtime (Supabase Realtime con debounce 350ms + Soft Polling 4.5s + SSE Fallback)
  useEffect(() => {
    let sseEventSource: EventSource | null = null
    let pollInterval: any = null
    const supabase = createBrowserClient()
    let realtimeChannel: any = null

    if (MOCK_RESTAURANTS[slug]) {
      setRestaurant(MOCK_RESTAURANTS[slug])
    }

    fetch(`/api/admin/menu?slug=${slug}&_t=${Date.now()}`, { cache: 'no-store' })
      .then(r => r.json())
      .then(d => {
        if (d?.products && d.products.length > 0) {
          productsRef.current = d.products
        }
      })
      .catch(() => {})

    fetchServerOrders()

    if (supabase) {
      let realtimeDebounceTimer: any = null
      const triggerDebouncedRealtimeFetch = () => {
        if (realtimeDebounceTimer) clearTimeout(realtimeDebounceTimer)
        realtimeDebounceTimer = setTimeout(() => {
          fetchServerOrders()
        }, 350)
      }

      const channelId = `kds-orders-${slug}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
      realtimeChannel = supabase
        .channel(channelId)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, triggerDebouncedRealtimeFetch)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'order_items' }, triggerDebouncedRealtimeFetch)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'order_events' }, triggerDebouncedRealtimeFetch)
        .subscribe()
    }

    if (process.env.NODE_ENV === 'development') {
      try {
        let sseDebounceTimer: any = null
        const triggerDebouncedFetch = () => {
          if (sseDebounceTimer) clearTimeout(sseDebounceTimer)
          sseDebounceTimer = setTimeout(() => {
            fetchServerOrders()
          }, 300)
        }

        sseEventSource = new EventSource('/api/events')
        sseEventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            if (data.type === 'connected') return
            if (!data.slug || data.slug === slug) {
              triggerDebouncedFetch()
            }
          } catch {}
        }
        sseEventSource.onerror = () => {
          if (sseEventSource) {
            sseEventSource.close()
            sseEventSource = null
          }
        }
      } catch (err) {
        console.log('SSE fallback not active:', err)
      }
    }

    pollInterval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
        return
      }
      fetchServerOrders()
    }, 4500)

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchServerOrders()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleVisibilityChange)

    // 4. Puente Reactivo Instantáneo (0ms) Comandero <-> Cocina KDS
    const unsubscribeSync = subscribeFluxoSync(event => {
      if (event.slug && event.slug !== slug) return

      // Caso 1: Mesa liberada o cobrada -> Purgar inmediatamente en 0ms todas las órdenes de la mesa
      if (
        event.type === 'table_freed' ||
        event.type === 'table_paid' ||
        event.status === 'free' ||
        event.status === 'paid'
      ) {
        const tNumStr = event.tableNumber ? String(event.tableNumber) : ''
        if (tNumStr) {
          prevOrdersMapRef.current.forEach((ord, id) => {
            const oTbl = String(ord.table_number || ord.table?.table_number)
            if (oTbl === tNumStr) {
              prevOrdersMapRef.current.delete(id)
              recentMutationsRef.current.delete(id)
              mutationLockUntilRef.current.delete(id)
            }
          })
          setOrders(prev =>
            prev.filter(o => {
              const oTbl = String(o.table_number || o.table?.table_number)
              return oTbl !== tNumStr
            })
          )
        }
        fetchServerOrders()
        return
      }

      // Caso 2: Comanda o platos entregados -> Si se completaron las fases de cocina, purgar ticket en 0ms
      if (
        event.type === 'order_delivered' ||
        event.type === 'course_delivered' ||
        event.status === 'delivered' ||
        event.action === 'deliver_desserts_direct' ||
        event.action === 'deliver_desserts'
      ) {
        if (event.orderId) {
          const isDone =
            event.status === 'delivered' ||
            (event.updatedOrder && areAllKitchenCoursesCompleted(event.updatedOrder))
          if (isDone) {
            prevOrdersMapRef.current.delete(event.orderId)
            recentMutationsRef.current.delete(event.orderId)
            mutationLockUntilRef.current.delete(event.orderId)
            setOrders(prev => prev.filter(o => o.id !== event.orderId))
          } else if (event.updatedOrder) {
            setOrders(prev =>
              prev.map(o => (o.id === event.orderId ? event.updatedOrder! : o))
            )
          }
        }
        fetchServerOrders()
        return
      }

      // Caso 3: Marcha de platos, validación o nuevo pedido -> Refrescar servidor de inmediato
      fetchServerOrders()
    })

    const handleTableFreedEvent = (e: any) => {
      const tNum = e?.detail?.tableNumber
      if (tNum) {
        const tNumStr = String(tNum)
        prevOrdersMapRef.current.forEach((ord, id) => {
          const oTbl = String(ord.table_number || ord.table?.table_number)
          if (oTbl === tNumStr) {
            prevOrdersMapRef.current.delete(id)
            recentMutationsRef.current.delete(id)
            mutationLockUntilRef.current.delete(id)
          }
        })
        setOrders(prev =>
          prev.filter(o => {
            const oTbl = String(o.table_number || o.table?.table_number)
            return oTbl !== tNumStr
          })
        )
        fetchServerOrders()
      }
    }
    window.addEventListener('fluxo_table_freed', handleTableFreedEvent)

    return () => {
      if (realtimeChannel && supabase) {
        supabase.removeChannel(realtimeChannel)
      }
      if (sseEventSource) sseEventSource.close()
      if (pollInterval) clearInterval(pollInterval)
      unsubscribeSync()
      window.removeEventListener('fluxo_table_freed', handleTableFreedEvent)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleVisibilityChange)
    }
  }, [slug, fetchServerOrders])

  // Actualizar estado de comanda
  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    const targetOrd = orders.find(o => o.id === orderId)
    if (!targetOrd || updatingOrderIds.has(orderId)) return

    const tableNum = targetOrd?.table?.table_number ?? targetOrd?.table_number ?? 1
    const lockUntil = Date.now() + 4500

    setUpdatingOrderIds(prev => new Set(prev).add(orderId))
    mutationLockUntilRef.current.set(orderId, lockUntil)
    recentMutationsRef.current.set(orderId, { status: newStatus, until: lockUntil })

    try {
      const res = await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          orderId,
          status: newStatus,
          expected_version: targetOrd.version,
          actor_type: 'kitchen',
          table_number: tableNum,
        }),
      })

      const data = await res.json().catch(() => ({}))
      if (res.ok && data.success) {
        setOrders(prev =>
          prev
            .map(o => (o.id === orderId ? { ...o, status: newStatus, version: data.version ?? (o.version ? o.version + 1 : 1) } : o))
            .filter(o => !areAllKitchenCoursesCompleted(o))
        )
      } else {
        mutationLockUntilRef.current.delete(orderId)
        recentMutationsRef.current.delete(orderId)
        await fetchServerOrders()
      }
    } catch (err) {
      console.error('Error updating order status from kitchen:', err)
      mutationLockUntilRef.current.delete(orderId)
      recentMutationsRef.current.delete(orderId)
      await fetchServerOrders()
    } finally {
      setUpdatingOrderIds(prev => {
        const next = new Set(prev)
        next.delete(orderId)
        return next
      })
    }
  }

  // Ejecutar acciones de pase gastronómico
  const handleKitchenAction = async (
    orderId: string,
    action: 'ready_food' | 'ready_desserts' | 'fire_desserts' | 'ready_starters' | 'start_mains' | 'ready_mains' | 'start_desserts'
  ) => {
    if (updatingOrderIds.has(orderId)) return
    setUpdatingOrderIds(prev => new Set(prev).add(orderId))
    const expectedNextStatus: OrderStatus = (action === 'start_mains' || action === 'start_desserts' || action === 'fire_desserts') ? 'preparing' : 'ready'
    const lockUntil = Date.now() + 4500
    mutationLockUntilRef.current.set(orderId, lockUntil)
    recentMutationsRef.current.set(orderId, { status: expectedNextStatus, until: lockUntil })

    try {
      const res = await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          orderId,
          action,
        }),
      })

      const data = await res.json().catch(() => null)
      if (res.ok) {
        if (data?.order) {
          setOrders(prev =>
            prev
              .map(o => {
                if (o.id !== orderId) return o
                const mergedNotes = mergeItemNotes((data.order as any)?.notes, (o as any)?.notes)
                const effectiveItems = (data.order?.order_items && data.order.order_items.length > 0)
                  ? data.order.order_items
                  : (o.order_items || [])
                const hydrated = hydrateOrderItemsWithCatalog(
                  effectiveItems,
                  productsRef.current,
                  o.order_items || [],
                  mergedNotes
                )
                const updated: Order = {
                  ...data.order,
                  status: data.order.status || expectedNextStatus,
                  notes: mergedNotes,
                  order_items: hydrated,
                }
                const until = Date.now() + 4500
                mutationLockUntilRef.current.set(orderId, until)
                recentMutationsRef.current.set(orderId, { order: updated, status: updated.status, until })
                prevOrdersMapRef.current.set(orderId, updated)
                return updated
              })
              .filter(o => !areAllKitchenCoursesCompleted(o))
          )
        }
      } else {
        console.error('[KDS] Error en acción de cocina:', action, data?.error)
        mutationLockUntilRef.current.delete(orderId)
        recentMutationsRef.current.delete(orderId)
        await fetchServerOrders()
      }
    } catch (err) {
      console.error('Error executing kitchen action:', err)
      mutationLockUntilRef.current.delete(orderId)
      recentMutationsRef.current.delete(orderId)
      await fetchServerOrders()
    } finally {
      setUpdatingOrderIds(prev => {
        const next = new Set(prev)
        next.delete(orderId)
        return next
      })
    }
  }

  // Filtrado de comandas por estado (Bloque 3.2: excluye automáticamente tickets cuyas fases de cocina ya terminaron)
  const activeOrders = useMemo(
    () =>
      orders.filter(
        o =>
          !areAllKitchenCoursesCompleted(o) &&
          (o.status === 'pending' ||
            o.status === 'confirmed' ||
            o.status === 'preparing' ||
            o.status === 'ready' ||
            (o.status === 'delivered' && orderHasDesserts(o) && !areOrderDessertsServed(o)))
      ),
    [orders]
  )

  const readyOrders = useMemo(
    () =>
      orders.filter(o => {
        if (['cancelled', 'paid', 'pending', 'confirmed', 'delivered'].includes(o.status)) return false
        if (areAllKitchenCoursesCompleted(o)) return false
        const hasReadyStarters = orderHasStarters(o) && areOrderStartersReady(o) && !areOrderStartersServed(o)
        const hasReadyMains = orderHasMains(o) && areOrderMainsReady(o) && !areOrderMainsServed(o)
        const hasReadyDesserts = orderHasDesserts(o) && isOrderDessertsReady(o) && !areOrderDessertsServed(o)
        const isOrderLevelReady = o.status === 'ready' && !areAllKitchenCoursesCompleted(o)
        return hasReadyStarters || hasReadyMains || hasReadyDesserts || isOrderLevelReady
      }),
    [orders]
  )

  // Bloque 2.1: Barra superior "En Línea:" filtrada estrictamente para trabajo activo de cocina
  // (0% bebidas, 0% cabeceras de pack, 0% fases listas/entregadas, 0% principales/postres bloqueados esperando al mozo)
  const pendingDishesSummary = useMemo(() => {
    const counts: Record<string, number> = {}
    activeOrders.forEach(ord => {
      const hasStarters = orderHasStarters(ord)
      const mainsUnlocked = !hasStarters || areOrderMainsFired(ord)
      const dessertsUnlocked =
        orderHasActiveDesserts(ord) ||
        (!hasStarters && !(ord.order_items || []).some(isMainItem))

      ;(ord.order_items || []).forEach(item => {
        if (isDrinkItem(item) || getItemCourse(item) === 'drink' || isPackHeaderItem(item)) {
          return
        }

        if (isStarterItem(item)) {
          if (isStarterReady(item, ord) || isStarterServed(item, ord)) return
        } else if (isMainItem(item)) {
          if (!mainsUnlocked || isMainReady(item, ord) || isMainServed(item, ord)) return
        } else if (isDessertItem(item)) {
          if (!dessertsUnlocked || isDessertReady(item, ord) || isDessertServed(item, ord)) return
        }

        const rawName = item.product?.name || (item as any).name
        const resolvedName =
          (rawName && !isGenericProductName(rawName) ? rawName : resolveCatalogProductForItem(item)?.name) ||
          rawName ||
          'Plato'
        counts[resolvedName] = (counts[resolvedName] || 0) + (item.quantity || 1)
      })
    })
    return Object.entries(counts).sort((a, b) => b[1] - a[1])
  }, [activeOrders])

  const displayedOrders = useMemo(() => {
    if (filterStatus === 'active') return activeOrders
    if (filterStatus === 'ready') return readyOrders
    return activeOrders
  }, [filterStatus, activeOrders, readyOrders])

  // Agrupación unificada por mesa (una única tarjeta por mesa con división cronológica por rondas)
  const tableGroupedOrders = useMemo(() => {
    const groupsMap = new Map<string, { tableNumber: string | number; orders: Order[] }>()

    displayedOrders.forEach(ord => {
      const tableKey = String(ord.table?.table_number ?? ord.table_number ?? '1')
      if (!groupsMap.has(tableKey)) {
        groupsMap.set(tableKey, {
          tableNumber: ord.table?.table_number ?? ord.table_number ?? '1',
          orders: [],
        })
      }
      groupsMap.get(tableKey)!.orders.push(ord)
    })

    const groups = Array.from(groupsMap.values()).map(g => {
      const sortedRounds = [...g.orders].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )
      const earliestTime = Math.min(...sortedRounds.map(o => new Date(o.created_at).getTime()))
      return {
        tableNumber: g.tableNumber,
        orders: sortedRounds,
        earliestTime,
      }
    })

    return groups.sort((a, b) => a.earliestTime - b.earliestTime)
  }, [displayedOrders])

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
              <span className="font-black text-xs sm:text-sm uppercase tracking-wide">¡NUEVA COMANDA O PASE ENVIADO A COCINA!</span>
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

        {/* Barra de Control KDS */}
        <div className="bg-white border-b border-slate-200 px-4 py-3 shadow-sm">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
            
            {/* Métricas de Estación Cocina */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="px-3.5 py-1.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs font-black text-amber-950 flex items-center gap-2 shadow-2xs">
                <Flame className="w-4 h-4 text-amber-600" />
                <span>Estación de Cocina (Fuegos y Emplatado)</span>
              </div>

              <div className="hidden lg:flex items-center gap-2">
                <div className="px-3 py-1 rounded-xl bg-amber-50 border border-amber-200 text-xs font-bold text-amber-900 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                  <span>En Marcha: <strong>{activeOrders.length}</strong></span>
                </div>
                <div className="px-3 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Pases Listos: <strong>{readyOrders.length}</strong></span>
                </div>
              </div>
            </div>

            {/* Filtros de Estado, Pantalla Completa y Audio Toggle */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs font-bold">
                <button
                  onClick={() => setFilterStatus('all')}
                  className={`px-3 py-1.5 rounded-xl transition-all ${
                    filterStatus === 'all'
                      ? 'bg-white text-slate-950 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Todas ({activeOrders.length})
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

        {/* BARRA DE RESUMEN DE PRODUCCIÓN EN LOTE (BATCH BAR - 0% BEBIDAS, SOLO PLATOS ACTIVOS) */}
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
              {tableGroupedOrders.map((group) => (
                <KitchenTicket
                  key={`table-group-${group.tableNumber}`}
                  orders={group.orders}
                  updatingOrderIds={updatingOrderIds}
                  onUpdateStatus={handleUpdateStatus}
                  onKitchenAction={handleKitchenAction}
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
