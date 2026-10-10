'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Product, Category, Table, Restaurant, Order } from '@/types/database.types'
import { TableStatusType } from '@/components/comandero/TableSelector'
import { createBrowserClient } from '@/lib/supabase/client'
import { MOCK_RESTAURANTS, MOCK_CATEGORIES, MOCK_PRODUCTS, MOCK_TABLES } from '@/lib/supabase/mock-fallback'
import { playKitchenChime } from '@/components/kitchen/AudioNotification'
import { resolveCanonicalProductId } from '@/lib/category-matcher'
import { PendingServiceCall } from '@/types/comandero.types'

export function useComanderoData(slug: string) {
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

  const [tableStatuses, setTableStatuses] = useState<Record<string | number, TableStatusType>>({})
  const [tableDwellMinutes, setTableDwellMinutes] = useState<Record<string | number, number>>({})
  const [readyOrderAlert, setReadyOrderAlert] = useState<string | number | null>(null)
  const [dismissedReadyBannerOrderIds, setDismissedReadyBannerOrderIds] = useState<Set<string>>(new Set())
  const [serverOrders, setServerOrders] = useState<Order[]>([])
  const [pendingCalls, setPendingCalls] = useState<PendingServiceCall[]>([])

  // State locks y referencias anti-flicker
  const attendedCallIdsRef = useRef<Set<string>>(new Set())
  const seenCallIdsRef = useRef<Set<string>>(new Set())
  const seenReadyOrderIdsRef = useRef<Set<string>>(new Set())
  const ordersFingerRef = useRef<string>('')
  const callsFingerRef = useRef<string>('')
  const tableStatusesFingerRef = useRef<string>('')
  const prevOrdersMapRef = useRef<Map<string, Order>>(new Map())
  const attendedValidationOrderIdsRef = useRef<Set<string>>(new Set())
  const pendingOrdersWithoutItemsRef = useRef<Map<string, Order>>(new Map())
  const recentTogglesRef = useRef<Map<string, { status: boolean; until: number }>>(new Map())

  // 1. WakeLock nativo para mantener pantalla activa en comandero
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

  // 2. Sincronización reactiva desde el servidor (SSOT)
  const syncServerData = useCallback(async () => {
    try {
      const [ordersRes, callsRes, tablesRes] = await Promise.all([
        fetch(`/api/orders?slug=${slug}`).then(r => r.json()).catch(() => ({ orders: [] })),
        fetch(`/api/service-calls?slug=${slug}`).then(r => r.json()).catch(() => ({ calls: [] })),
        fetch(`/api/tables?slug=${slug}`).then(r => r.json()).catch(() => ({ sessions: {} })),
      ])

      const rawOrders: Order[] = ordersRes.orders || []

      // Sincronización de disponibilidad de productos protegiendo toggles recientes
      if (ordersRes?.product_availability) {
        setProducts(prev => {
          let hasDiff = false
          const next = prev.map(p => {
            const canonical = resolveCanonicalProductId(p.id) || p.id
            const normName = (p.name || '').toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '')

            const recentToggle = recentTogglesRef.current.get(p.id) || recentTogglesRef.current.get(canonical)
            if (recentToggle && Date.now() < recentToggle.until) {
              if (p.is_available !== recentToggle.status) {
                hasDiff = true
                return { ...p, is_available: recentToggle.status }
              }
              return p
            }

            const serverAvail = ordersRes.product_availability[canonical] ?? ordersRes.product_availability[p.id] ?? ordersRes.product_availability[normName]
            if (serverAvail !== undefined && p.is_available !== serverAvail) {
              hasDiff = true
              return { ...p, is_available: serverAvail }
            }
            return p
          })
          return hasDiff ? next : prev
        })
      }

      // Backfill de items si llegaron vacíos por race condition
      const incomingOrders: Order[] = rawOrders.map((ord: Order) => {
        if (!ord.order_items || ord.order_items.length === 0) {
          const prevOrd = prevOrdersMapRef.current.get(ord.id)
          if (prevOrd?.order_items && prevOrd.order_items.length > 0) {
            return { ...ord, order_items: prevOrd.order_items }
          }
          const transitOrd = pendingOrdersWithoutItemsRef.current.get(ord.id)
          if (transitOrd?.order_items && transitOrd.order_items.length > 0) {
            return { ...ord, order_items: transitOrd.order_items }
          }
        }
        return ord
      })
      const incomingCalls: any[] = callsRes.calls || []

      // Reconciliación de Órdenes (SSOT)
      setServerOrders(prev => {
        const prevMap = new Map(prev.map(o => [o.id, o]))
        const map = new Map<string, Order>()
        const nextPendingWithoutItems = new Map<string, Order>()

        incomingOrders.forEach(ord => {
          if (ord.status === 'cancelled') return
          const existing = prevMap.get(ord.id)
          const effectiveItems = (ord.order_items && ord.order_items.length > 0)
            ? ord.order_items
            : (existing?.order_items && existing.order_items.length > 0 ? existing.order_items : [])
          const finalOrd = { ...ord, order_items: effectiveItems }
          map.set(ord.id, finalOrd)
          if (!effectiveItems || effectiveItems.length === 0) {
            nextPendingWithoutItems.set(ord.id, finalOrd)
          }
        })

        pendingOrdersWithoutItemsRef.current = nextPendingWithoutItems

        // Preservar órdenes no terminales pendientes
        prev.forEach(prevOrd => {
          if (!map.has(prevOrd.id)) {
            const isTerminal = prevOrd.status === 'cancelled' || prevOrd.status === 'paid' || prevOrd.status === 'delivered'
            const isHandledLocally = attendedValidationOrderIdsRef.current.has(prevOrd.id)
            if (!isTerminal && !isHandledLocally) {
              map.set(prevOrd.id, prevOrd)
            }
          }
        })

        const newOrders = Array.from(map.values()).filter(o => o.status !== 'cancelled')
        prevOrdersMapRef.current = new Map(newOrders.map(o => [o.id, o]))

        const finger = newOrders.map(o => `${o.id}:${o.status}:${o.version || 1}:${o.order_items?.length || 0}`).join('|')
        if (finger === ordersFingerRef.current) {
          return prev
        }
        ordersFingerRef.current = finger
        return newOrders
      })

      // Reconciliación de Avisos de Servicio
      const serverPendingCalls = incomingCalls.filter((c: any) => c.status === 'pending')
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

      const callsFinger = formattedPendingCalls.map(c => `${c.id}:${c.table_number}:${c.call_type}`).join('|')
      if (callsFinger !== callsFingerRef.current) {
        callsFingerRef.current = callsFinger
        setPendingCalls(formattedPendingCalls)
      }

      // Semáforo de Mesas y tiempos de ocupación
      const statusMap: Record<string | number, TableStatusType> = {}
      const dwellMap: Record<string | number, number> = {}

      incomingOrders.forEach(ord => {
        if (ord.status === 'cancelled' || ord.status === 'paid') return
        const tblNum = ord.table?.table_number || ord.table_number
        if (tblNum) {
          const isDelivered = ord.status === 'delivered'
          const numKey = Number(tblNum)
          const strKey = String(tblNum)
          if (ord.status === 'ready' && !isDelivered) {
            statusMap[tblNum] = 'ready'
            statusMap[numKey] = 'ready'
            statusMap[strKey] = 'ready'
            if (!seenReadyOrderIdsRef.current.has(ord.id)) {
              seenReadyOrderIdsRef.current.add(ord.id)
              setReadyOrderAlert(tblNum)
              playKitchenChime()
            }
          } else if (!isDelivered && ['pending_validation', 'pending', 'preparing'].includes(ord.status) && !statusMap[tblNum] && !statusMap[numKey]) {
            statusMap[tblNum] = 'busy'
            statusMap[numKey] = 'busy'
            statusMap[strKey] = 'busy'
          } else if (!statusMap[tblNum] && !statusMap[numKey]) {
            statusMap[tblNum] = 'busy'
            statusMap[numKey] = 'busy'
            statusMap[strKey] = 'busy'
          }

          const createdMs = new Date(ord.created_at).getTime()
          if (!dwellMap[tblNum] || createdMs < dwellMap[tblNum]) {
            dwellMap[tblNum] = createdMs
            dwellMap[numKey] = createdMs
            dwellMap[strKey] = createdMs
          }
        }
      })

      incomingCalls.forEach((call: any) => {
        if (call.status === 'pending' && !attendedCallIdsRef.current.has(call.id)) {
          const tblNum = call.table_number
          if (tblNum) {
            statusMap[tblNum] = 'calling'
            statusMap[Number(tblNum)] = 'calling'
            statusMap[String(tblNum)] = 'calling'
          }
        }
      })

      const sessions = tablesRes.sessions || {}
      Object.entries(sessions).forEach(([tblNum, sessionData]: [string, any]) => {
        if (sessionData && sessionData.status === 'active') {
          if (!statusMap[tblNum] && !statusMap[Number(tblNum)]) {
            statusMap[tblNum] = 'busy'
            statusMap[Number(tblNum)] = 'busy'
            statusMap[String(tblNum)] = 'busy'
          }
          if (sessionData.started_at) {
            const sessionMs = new Date(sessionData.started_at).getTime()
            if (!dwellMap[tblNum] || sessionMs < dwellMap[tblNum]) {
              dwellMap[tblNum] = sessionMs
              dwellMap[Number(tblNum)] = sessionMs
              dwellMap[String(tblNum)] = sessionMs
            }
          }
        }
      })

      const statusFinger = JSON.stringify(statusMap)
      if (statusFinger !== tableStatusesFingerRef.current) {
        tableStatusesFingerRef.current = statusFinger
        setTableStatuses(statusMap)
      }

      const finalDwellMins: Record<string | number, number> = {}
      const now = Date.now()
      Object.entries(dwellMap).forEach(([tNum, ms]) => {
        finalDwellMins[tNum] = Math.max(0, Math.floor((now - ms) / 60000))
      })
      setTableDwellMinutes(prev => {
        const prevKeys = Object.keys(prev)
        const newKeys = Object.keys(finalDwellMins)
        if (prevKeys.length === newKeys.length && prevKeys.every(k => prev[k] === finalDwellMins[k])) {
          return prev
        }
        return finalDwellMins
      })

    } catch (err) {
      console.log('Error syncing server orders/calls:', err)
    }
  }, [slug])

  // 3. Realtime, SSE y ciclo de vida de conexión
  useEffect(() => {
    let sseEventSource: EventSource | null = null
    let pollInterval: any = null
    const supabase = createBrowserClient()
    let realtimeChannel: any = null

    async function loadInitialData() {
      if (typeof window !== 'undefined') {
        const rest = MOCK_RESTAURANTS[slug] || MOCK_RESTAURANTS['burger-gourmet']
        setRestaurant(rest)
        const cats = MOCK_CATEGORIES[slug] || MOCK_CATEGORIES['burger-gourmet'] || []
        setCategories(cats)
        setProducts(MOCK_PRODUCTS[slug] || MOCK_PRODUCTS['burger-gourmet'] || [])
        const currentTables = MOCK_TABLES[slug] || MOCK_TABLES['burger-gourmet'] || fallbackTables
        setTables(currentTables)
        if (currentTables.length > 0) {
          setSelectedTable(prev => prev || currentTables[0])
        }

        try {
          fetch(`/api/admin/menu?slug=${slug}&_t=${Date.now()}`, { cache: 'no-store' })
            .then(r => r.json())
            .then(data => {
              if (data?.products && data.products.length > 0) setProducts(data.products)
              if (data?.categories && data.categories.length > 0) setCategories(data.categories)
            })
            .catch(() => {})
        } catch {}
      }

      await syncServerData()

      // Realtime Supabase Channel
      if (supabase) {
        let realtimeDebounceTimer: any = null
        const triggerDebouncedRealtimeSync = () => {
          if (realtimeDebounceTimer) clearTimeout(realtimeDebounceTimer)
          realtimeDebounceTimer = setTimeout(() => {
            syncServerData()
          }, 400)
        }

        realtimeChannel = supabase
          .channel(`comandero-orders-${slug}`)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, triggerDebouncedRealtimeSync)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'order_events' }, triggerDebouncedRealtimeSync)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'service_calls' }, triggerDebouncedRealtimeSync)
          .subscribe()
      }

      // SSE
      try {
        let sseDebounceTimer: any = null
        const triggerDebouncedSync = () => {
          if (sseDebounceTimer) clearTimeout(sseDebounceTimer)
          sseDebounceTimer = setTimeout(() => {
            syncServerData()
          }, 300)
        }

        sseEventSource = new EventSource('/api/events')
        sseEventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            if (data.type === 'connected') return

            if (data.type === 'menu_updated' && (!data.slug || data.slug === slug)) {
              if (data.productId && data.isAvailable !== undefined) {
                const canonical = resolveCanonicalProductId(data.productId) || data.productId
                recentTogglesRef.current.set(data.productId, { status: data.isAvailable, until: Date.now() + 3500 })
                if (canonical) recentTogglesRef.current.set(canonical, { status: data.isAvailable, until: Date.now() + 3500 })
                setProducts(prev => prev.map(p => {
                  const pCanon = resolveCanonicalProductId(p.id) || p.id
                  if (p.id === data.productId || p.id === canonical || pCanon === canonical) {
                    return { ...p, is_available: data.isAvailable }
                  }
                  return p
                }))
                return
              }
              fetch(`/api/admin/menu?slug=${slug}&_t=${Date.now()}`, { cache: 'no-store' })
                .then(r => r.json())
                .then(d => {
                  if (d?.products && d.products.length > 0) setProducts(d.products)
                  if (d?.categories && d.categories.length > 0) setCategories(d.categories)
                })
                .catch(() => {})
              return
            }

            if (!data.slug || data.slug === slug) {
              triggerDebouncedSync()
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
        console.log('SSE connection error:', err)
      }

      pollInterval = setInterval(syncServerData, 4500)
    }

    loadInitialData()

    let menuBc: BroadcastChannel | null = null
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        menuBc = new BroadcastChannel('fluxo_menu_channel')
        menuBc.onmessage = (event) => {
          const { type, slug: evtSlug, productId, isAvailable } = event.data || {}
          if (type === 'menu_updated' && (!evtSlug || evtSlug === slug)) {
            if (productId && isAvailable !== undefined) {
              const canonical = resolveCanonicalProductId(productId) || productId
              recentTogglesRef.current.set(productId, { status: isAvailable, until: Date.now() + 3500 })
              if (canonical) recentTogglesRef.current.set(canonical, { status: isAvailable, until: Date.now() + 3500 })
              setProducts(prev => prev.map(p => {
                const pCanon = resolveCanonicalProductId(p.id) || p.id
                if (p.id === productId || p.id === canonical || pCanon === canonical) {
                  return { ...p, is_available: isAvailable }
                }
                return p
              }))
              return
            }
            fetch(`/api/admin/menu?slug=${slug}&_t=${Date.now()}`, { cache: 'no-store' })
              .then(r => r.json())
              .then(d => {
                if (d?.products && d.products.length > 0) setProducts(d.products)
              })
              .catch(() => {})
          }
        }
      }
    } catch {}

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        syncServerData()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleVisibilityChange)

    const handleMenuUpdated = (e: any) => {
      const { slug: evtSlug, productId, isAvailable } = e?.detail || {}
      if (!evtSlug || evtSlug === slug) {
        if (productId && isAvailable !== undefined) {
          const canonical = resolveCanonicalProductId(productId) || productId
          recentTogglesRef.current.set(productId, { status: isAvailable, until: Date.now() + 3500 })
          if (canonical) recentTogglesRef.current.set(canonical, { status: isAvailable, until: Date.now() + 3500 })
          setProducts(prev => prev.map(p => {
            const pCanon = resolveCanonicalProductId(p.id) || p.id
            if (p.id === productId || p.id === canonical || pCanon === canonical) {
              return { ...p, is_available: isAvailable }
            }
            return p
          }))
          return
        }
        fetch(`/api/admin/menu?slug=${slug}&_t=${Date.now()}`, { cache: 'no-store' })
          .then(r => r.json())
          .then(data => {
            if (data?.products && data.products.length > 0) setProducts(data.products)
            if (data?.categories && data.categories.length > 0) setCategories(data.categories)
          })
          .catch(() => {})
      }
    }
    window.addEventListener('fluxo_menu_updated', handleMenuUpdated)

    return () => {
      if (realtimeChannel && supabase) {
        supabase.removeChannel(realtimeChannel)
      }
      if (sseEventSource) sseEventSource.close()
      if (menuBc) {
        try { menuBc.close() } catch {}
      }
      if (pollInterval) clearInterval(pollInterval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleVisibilityChange)
      window.removeEventListener('fluxo_menu_updated', handleMenuUpdated)
    }
  }, [slug, syncServerData])

  return {
    restaurant,
    categories,
    products,
    setProducts,
    tables,
    selectedTable,
    setSelectedTable,
    serverOrders,
    setServerOrders,
    tableStatuses,
    setTableStatuses,
    tableDwellMinutes,
    pendingCalls,
    setPendingCalls,
    readyOrderAlert,
    setReadyOrderAlert,
    dismissedReadyBannerOrderIds,
    setDismissedReadyBannerOrderIds,
    syncServerData,
    attendedCallIdsRef,
    seenCallIdsRef,
    attendedValidationOrderIdsRef,
    recentTogglesRef,
  }
}
