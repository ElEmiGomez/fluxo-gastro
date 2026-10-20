'use client'

import { useState, useEffect, useRef } from 'react'
import { Order, OrderStatus, Product, CartItem } from '@/types/database.types'
import { createBrowserClient } from '@/lib/supabase/client'
import { resolveCanonicalProductId } from '@/lib/category-matcher'
import { mergeOrderItemsCourseTags, hasItemProgressionTag } from '@/lib/course-utils'

const STORAGE_CART_PREFIX = 'gastro_cart_'

interface UseMenuOrderSyncParams {
  slug: string
  tableNumber: string
  sessionId: string | null
  setSessionId: (id: string | null) => void
  isFixedMenu: boolean
  isTablePaid: boolean
  setIsTablePaid: (paid: boolean) => void
  setIsPaidBannerDismissed: (dismissed: boolean) => void
  setIsReviewBoosterDismissed: (dismissed: boolean) => void
  setHasRequestedBill: (req: boolean) => void
  hasRequestedBillRef: React.MutableRefObject<boolean>
  userRequestedBillTimeRef: React.MutableRefObject<number | null>
  setPendingServiceCalls: React.Dispatch<React.SetStateAction<Set<string>>>
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>
  loadData: () => Promise<void>
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>
  handleTableMarkedPaid: () => void
}

export function useMenuOrderSync({
  slug,
  tableNumber,
  sessionId,
  setSessionId,
  isFixedMenu,
  isTablePaid,
  setIsTablePaid,
  setIsPaidBannerDismissed,
  setIsReviewBoosterDismissed,
  setHasRequestedBill,
  hasRequestedBillRef,
  userRequestedBillTimeRef,
  setPendingServiceCalls,
  setProducts,
  loadData,
  setCart,
  handleTableMarkedPaid,
}: UseMenuOrderSyncParams) {
  const [tableOrderStatus, setTableOrderStatus] = useState<OrderStatus | null>(null)
  const [tableOrders, setTableOrders] = useState<Order[]>([])
  const [tableTotalAmount, setTableTotalAmount] = useState<number>(0)
  const prevTableOrdersMapRef = useRef<Map<string, any>>(new Map())
  const hasHadActiveOrderInThisSessionRef = useRef<boolean>(false)

  // Estabilización de referencias para evitar desmontaje y re-suscripción innecesaria del canal Realtime
  const handleTableMarkedPaidRef = useRef(handleTableMarkedPaid)
  handleTableMarkedPaidRef.current = handleTableMarkedPaid

  const loadDataRef = useRef(loadData)
  loadDataRef.current = loadData

  const setProductsRef = useRef(setProducts)
  setProductsRef.current = setProducts

  const setCartRef = useRef(setCart)
  setCartRef.current = setCart

  const sessionIdRef = useRef(sessionId)
  sessionIdRef.current = sessionId

  const setSessionIdRef = useRef(setSessionId)
  setSessionIdRef.current = setSessionId

  const isTablePaidRef = useRef(isTablePaid)
  isTablePaidRef.current = isTablePaid

  const setIsTablePaidRef = useRef(setIsTablePaid)
  setIsTablePaidRef.current = setIsTablePaid

  const setIsPaidBannerDismissedRef = useRef(setIsPaidBannerDismissed)
  setIsPaidBannerDismissedRef.current = setIsPaidBannerDismissed

  const setIsReviewBoosterDismissedRef = useRef(setIsReviewBoosterDismissed)
  setIsReviewBoosterDismissedRef.current = setIsReviewBoosterDismissed

  const setHasRequestedBillRef = useRef(setHasRequestedBill)
  setHasRequestedBillRef.current = setHasRequestedBill

  const setPendingServiceCallsRef = useRef(setPendingServiceCalls)
  setPendingServiceCallsRef.current = setPendingServiceCalls

  useEffect(() => {
    let sseEventSource: EventSource | null = null
    let pollInterval: any = null
    let isChecking = false
    let hasQueuedCheck = false
    let debounceTimer: any = null

    const triggerDebouncedCheck = () => {
      if (debounceTimer) clearTimeout(debounceTimer)
      debounceTimer = setTimeout(() => {
        checkOrderStatus()
      }, 300)
    }

    const checkOrderStatus = async () => {
      if (isChecking || isFixedMenu) {
        if (!isFixedMenu) hasQueuedCheck = true
        return
      }
      isChecking = true
      try {
        const [ordersRes, callsRes, tablesRes] = await Promise.all([
          fetch(`/api/orders?slug=${slug}&table=${tableNumber}&_t=${Date.now()}`, { cache: 'no-store' }).then(r => r.json()).catch(() => ({ orders: [] })),
          fetch(`/api/service-calls?slug=${slug}&_t=${Date.now()}`, { cache: 'no-store' }).then(r => r.json()).catch(() => ({ calls: [] })),
          fetch(`/api/tables?slug=${slug}&_t=${Date.now()}`, { cache: 'no-store' }).then(r => r.json()).catch(() => ({ sessions: {} })),
        ])

        if (ordersRes?.product_availability) {
          setProductsRef.current(prev => {
            let hasDiff = false
            const next = prev.map(p => {
              const canonical = resolveCanonicalProductId(p.id) || p.id
              const normName = (p.name || '').toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '')
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

        const sessions = tablesRes.sessions || {}
        const thisTableSession = sessions[tableNumber]
        if (thisTableSession?.session_id) {
          setSessionIdRef.current(thisTableSession.session_id)
        }

        // Si la mesa fue liberada por el personal (status === 'free'), limpiar inmediatamente la comanda anterior
        if (thisTableSession?.status === 'free') {
          hasHadActiveOrderInThisSessionRef.current = false
          prevTableOrdersMapRef.current.clear()
          setTableOrderStatus(null)
          setTableOrders([])
          setTableTotalAmount(0)
          setCartRef.current([])
          setIsTablePaidRef.current(false)
          setIsTablePaid(false)
          setHasRequestedBill(false)
          hasRequestedBillRef.current = false
          userRequestedBillTimeRef.current = null
          if (thisTableSession.session_id) {
            setSessionIdRef.current(thisTableSession.session_id)
            setSessionId(thisTableSession.session_id)
          }
          if (typeof window !== 'undefined') {
            try {
              sessionStorage.removeItem(`fluxo_bill_requested_${slug}_${tableNumber}`)
              sessionStorage.removeItem(`fluxo_table_paid_${slug}_${tableNumber}`)
              sessionStorage.removeItem(`fluxo_paid_banner_dismissed_${slug}_${tableNumber}`)
              sessionStorage.removeItem(`fluxo_last_paid_total_${slug}_${tableNumber}`)
              localStorage.removeItem(`fluxo_cart_${slug}_${tableNumber}`)
              if (thisTableSession.session_id) {
                localStorage.setItem(`gastro_session_${slug}_${tableNumber}`, thisTableSession.session_id)
              }
            } catch (_) {}
          }
          return
        }

        const currentSessionId = thisTableSession?.session_id || sessionIdRef.current
        const rawOrders: any[] = ordersRes.orders || []
        const serverOrdersList: any[] = rawOrders.map((ord: any) => {
          const prevOrd = prevTableOrdersMapRef.current.get(ord.id)
          let items = ord.order_items
          if (!items || items.length === 0) {
            if (prevOrd?.order_items && prevOrd.order_items.length > 0) {
              items = prevOrd.order_items
            } else if (typeof window !== 'undefined') {
              try {
                const stored = localStorage.getItem(`fluxo_order_items_${ord.id}`)
                if (stored) {
                  const parsed = JSON.parse(stored)
                  if (Array.isArray(parsed) && parsed.length > 0) items = parsed
                }
              } catch (_) {}
            }
          } else if (typeof window !== 'undefined') {
            try {
              localStorage.setItem(`fluxo_order_items_${ord.id}`, JSON.stringify(items))
            } catch (_) {}
          }
          if (prevOrd?.order_items && prevOrd.order_items.length > 0 && items && items.length > 0) {
            items = mergeOrderItemsCourseTags(items, prevOrd.order_items)
          }

          let effectiveStatus = ord.status
          const hasProgression = (items || []).some((it: any) => hasItemProgressionTag(it.notes))
          if (hasProgression && ord.status === 'pending_validation') {
            effectiveStatus = (prevOrd?.status && prevOrd.status !== 'pending_validation') ? prevOrd.status : 'pending'
          } else if (prevOrd?.status === 'delivered' && ord.status !== 'delivered' && ord.status !== 'paid') {
            effectiveStatus = 'delivered'
          } else if (prevOrd?.status === 'paid' && ord.status !== 'paid') {
            effectiveStatus = 'paid'
          } else if (prevOrd?.status === 'ready' && (ord.status === 'pending_validation' || ord.status === 'pending' || ord.status === 'preparing')) {
            effectiveStatus = 'ready'
          } else if (prevOrd?.status === 'preparing' && (ord.status === 'pending' || ord.status === 'pending_validation')) {
            effectiveStatus = 'preparing'
          } else if (prevOrd?.status === 'pending' && ord.status === 'pending_validation') {
            effectiveStatus = 'pending'
          }

          return { ...ord, status: effectiveStatus, order_items: items }
        })

        const isTableFreeOrClosed = !thisTableSession || thisTableSession.status === 'free' || thisTableSession.status === 'closed'

        const allTableOrders = serverOrdersList.filter(o => {
          const matchesTable = (
            o.table_number?.toString() === tableNumber?.toString() ||
            o.table?.table_number?.toString() === tableNumber?.toString() ||
            o.table_id === `table-${tableNumber}`
          )
          if (!matchesTable) return false
          if (o.status === 'cancelled') return false

          // Si la mesa no tiene sesión activa (fue liberada), ignorar comandas residuales de sesiones previas
          if (isTableFreeOrClosed && !isTablePaidRef.current && !hasRequestedBillRef.current && !userRequestedBillTimeRef.current) {
            return false
          }

          // Si la orden tiene session_token y es distinta de la sesión activa de la mesa, omitirla
          if (currentSessionId && o.session_token && o.session_token !== currentSessionId) {
            return false
          }

          return true
        })

        allTableOrders.forEach(ord => {
          prevTableOrdersMapRef.current.set(ord.id, ord)
        })

        const activeKitchenOrders = allTableOrders.filter(
          o => ['pending_validation', 'pending', 'confirmed', 'preparing', 'ready'].includes(o.status)
        )
        const activeTableOrders = allTableOrders.filter(
          o => ['pending_validation', 'pending', 'confirmed', 'preparing', 'ready', 'delivered'].includes(o.status)
        )

        if (activeTableOrders.length > 0 || hasRequestedBillRef.current) {
          hasHadActiveOrderInThisSessionRef.current = true
        }

        const paidOrdersForTable = allTableOrders.filter(o => o.status === 'paid')
        const hasPaidOrder = paidOrdersForTable.length > 0

        // Si la mesa ya fue cobrada y no quedan platos pendientes en cocina
        if (
          activeKitchenOrders.length === 0 &&
          hasPaidOrder &&
          (hasHadActiveOrderInThisSessionRef.current || hasRequestedBillRef.current || userRequestedBillTimeRef.current || isTablePaidRef.current)
        ) {
          setTableOrderStatus(null)
          setTableOrders(paidOrdersForTable)
          const total = paidOrdersForTable.reduce((sum, ord) => sum + (Number(ord.total_amount) || 0), 0)
          setTableTotalAmount(total)
          if (!isTablePaidRef.current) {
            setIsTablePaidRef.current(true)
            handleTableMarkedPaidRef.current()
          }
          return
        }

        // Si hay órdenes activas en preparación o pendientes de cocina
        if (activeTableOrders.some(o => ['pending_validation', 'pending', 'confirmed', 'preparing', 'ready'].includes(o.status))) {
          if (isTablePaidRef.current) {
            setIsTablePaidRef.current(false)
            setIsTablePaid(false)
            if (typeof window !== 'undefined') {
              try {
                sessionStorage.removeItem(`fluxo_table_paid_${slug}_${tableNumber}`)
                localStorage.removeItem(`fluxo_table_paid_${slug}_${tableNumber}`)
              } catch (_) {}
            }
          }
        } else if (isTablePaidRef.current) {
          return
        }

        if (isTableFreeOrClosed && activeTableOrders.length === 0) {
          const hadOrdersInSession = hasHadActiveOrderInThisSessionRef.current || prevTableOrdersMapRef.current.size > 0
          const prevSessionTotal = Array.from(prevTableOrdersMapRef.current.values()).reduce(
            (sum, o) => sum + (Number(o.total_amount) || 0),
            0
          )
          if ((hasRequestedBillRef.current || userRequestedBillTimeRef.current) && (hadOrdersInSession || hasPaidOrder || isTablePaidRef.current)) {
            hasHadActiveOrderInThisSessionRef.current = false
            prevTableOrdersMapRef.current.clear()
            setTableOrderStatus(null)
            if (prevSessionTotal > 0 && typeof window !== 'undefined') {
              try {
                sessionStorage.setItem(`fluxo_last_paid_total_${slug}_${tableNumber}`, String(prevSessionTotal))
              } catch (_) {}
            }
            setIsTablePaidRef.current(true)
            handleTableMarkedPaidRef.current()
            return
          }
          hasHadActiveOrderInThisSessionRef.current = false
          prevTableOrdersMapRef.current.clear()
          setTableOrderStatus(null)
          return
        }

        const calls: any[] = callsRes.calls || []
        const activeMicroServices = new Set<string>()
        calls.forEach((c: any) => {
          if (
            c.table_number?.toString() === tableNumber?.toString() &&
            c.status === 'pending' &&
            c.call_type?.startsWith('service_')
          ) {
            const servName = c.call_type.replace('service_', '')
            if (servName) activeMicroServices.add(servName)
          }
        })
        setPendingServiceCallsRef.current(activeMicroServices)

        if (hasPaidOrder && activeTableOrders.length === 0 && typeof window !== 'undefined') {
          const paidTotal = paidOrdersForTable.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0)
          if (paidTotal > 0) {
            try {
              sessionStorage.setItem(`fluxo_last_paid_total_${slug}_${tableNumber}`, String(paidTotal))
            } catch (_) {}
          }
        }

        if (
          activeTableOrders.length === 0 &&
          hasPaidOrder &&
          (hasRequestedBillRef.current || userRequestedBillTimeRef.current)
        ) {
          prevTableOrdersMapRef.current.clear()
          hasHadActiveOrderInThisSessionRef.current = false
          handleTableMarkedPaidRef.current()
          return
        }

        const isBillPaidCall = Boolean(
          userRequestedBillTimeRef.current &&
          calls.some(
            (c: any) =>
              c.table_number?.toString() === tableNumber?.toString() &&
              c.status === 'attended' &&
              c.call_type?.startsWith('bill_') &&
              c.created_at &&
              new Date(c.created_at).getTime() >= (userRequestedBillTimeRef.current || 0) - 10000
          )
        )

        if (isBillPaidCall) {
          handleTableMarkedPaidRef.current()
          return
        }

        const sortedOrders = [...activeTableOrders].sort(
          (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
        )

        if (sortedOrders.length > 0) {
          setTableOrders(sortedOrders)
          const total = sortedOrders.reduce((sum, ord) => sum + (Number(ord.total_amount) || 0), 0)
          setTableTotalAmount(total)
          if (typeof window !== 'undefined') {
            try {
              sessionStorage.removeItem(`fluxo_last_paid_total_${slug}_${tableNumber}`)
              localStorage.removeItem(`fluxo_last_paid_total_${slug}_${tableNumber}`)
            } catch (_) {}
          }

          const activeOrders = sortedOrders.filter(o =>
            ['pending_validation', 'pending', 'confirmed', 'preparing', 'ready'].includes(o.status)
          )

          if (activeOrders.some(o => o.status === 'ready')) {
            setTableOrderStatus('ready')
          } else if (activeOrders.some(o => o.status === 'preparing')) {
            setTableOrderStatus('preparing')
          } else if (activeOrders.some(o => o.status === 'confirmed' || o.status === 'pending')) {
            setTableOrderStatus('pending')
          } else if (activeOrders.some(o => o.status === 'pending_validation')) {
            setTableOrderStatus('pending_validation')
          } else if (sortedOrders.some(o => o.status === 'delivered')) {
            setTableOrderStatus('delivered')
          } else {
            if (prevTableOrdersMapRef.current.size === 0) {
              setTableOrderStatus(null)
              setTableOrders([])
            }
          }
        } else {
          if (prevTableOrdersMapRef.current.size === 0) {
            setTableOrderStatus(null)
            setTableOrders([])
          }
        }
      } catch (e) {
        console.log('Error checking order status for diner:', e)
      } finally {
        isChecking = false
        if (hasQueuedCheck) {
          hasQueuedCheck = false
          triggerDebouncedCheck()
        }
      }
    }

    checkOrderStatus()

    const supabase = createBrowserClient()
    let realtimeChannel: any = null

    if (supabase) {
      const channelId = `diner-orders-${slug}-${tableNumber}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
      realtimeChannel = supabase
        .channel(channelId)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload: any) => {
          const newOrder = payload?.new
          const matchesTable = newOrder && (
            newOrder.table_number?.toString() === tableNumber?.toString() ||
            newOrder.table_id === `table-${tableNumber}`
          )
          if (matchesTable && newOrder.status === 'paid') {
            const hadOrdersInSession = hasHadActiveOrderInThisSessionRef.current || prevTableOrdersMapRef.current.size > 0
            if (hasRequestedBillRef.current || userRequestedBillTimeRef.current || hadOrdersInSession) {
              if (newOrder.total_amount && typeof window !== 'undefined') {
                try {
                  sessionStorage.setItem(`fluxo_last_paid_total_${slug}_${tableNumber}`, String(newOrder.total_amount))
                } catch (_) {}
              }
              handleTableMarkedPaidRef.current()
              return
            }
          }
          checkOrderStatus()
        })
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'order_events' }, (payload: any) => {
          const newEvt = payload?.new
          const matchesTable = newEvt && (
            newEvt.table_number?.toString() === tableNumber?.toString() ||
            newEvt.metadata?.table_number?.toString() === tableNumber?.toString()
          )
          if (matchesTable && (newEvt.event_type === 'order_paid' || newEvt.new_status === 'paid')) {
            const hadOrdersInSession = hasHadActiveOrderInThisSessionRef.current || prevTableOrdersMapRef.current.size > 0
            if (hasRequestedBillRef.current || userRequestedBillTimeRef.current) {
              handleTableMarkedPaidRef.current()
              return
            }
          }
          checkOrderStatus()
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'service_calls' }, (payload: any) => {
          const newCall = payload?.new
          const matchesTable = newCall && newCall.table_number?.toString() === tableNumber?.toString()
          if (matchesTable && newCall.status === 'attended' && newCall.call_type?.startsWith('bill_')) {
            handleTableMarkedPaidRef.current()
            return
          }
          checkOrderStatus()
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'table_sessions' }, (payload: any) => {
          const newSession = payload?.new
          const matchesTable = newSession && newSession.table_number?.toString() === tableNumber?.toString()
          if (matchesTable && (newSession.status === 'closed' || newSession.status === 'free')) {
            if (hasRequestedBillRef.current || userRequestedBillTimeRef.current) {
              handleTableMarkedPaidRef.current()
              return
            } else {
              handleLocalTableFreed({ detail: { tableNumber } })
              return
            }
          }
          checkOrderStatus()
        })
        .subscribe()
    }

    // SSE (Solo en desarrollo local offline para evitar consumo continuo en Vercel)
    if (process.env.NODE_ENV === 'development') {
      try {
        sseEventSource = new EventSource('/api/events')
        sseEventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)

            if (
              data.type === 'table_freed' &&
              (data.tableNumber?.toString() === tableNumber?.toString() || data.table_number?.toString() === tableNumber?.toString())
            ) {
              const hadOrdersInSession = hasHadActiveOrderInThisSessionRef.current || prevTableOrdersMapRef.current.size > 0
              const prevSessionTotal = Array.from(prevTableOrdersMapRef.current.values()).reduce(
                (sum, o) => sum + (Number(o.total_amount) || 0),
                0
              )
              if (hasRequestedBillRef.current || userRequestedBillTimeRef.current) {
                hasHadActiveOrderInThisSessionRef.current = false
                prevTableOrdersMapRef.current.clear()
                if (prevSessionTotal > 0 && typeof window !== 'undefined') {
                  try {
                    sessionStorage.setItem(`fluxo_last_paid_total_${slug}_${tableNumber}`, String(prevSessionTotal))
                  } catch (_) {}
                }
                setIsTablePaidRef.current(true)
                handleTableMarkedPaidRef.current()
                return
              }
              hasHadActiveOrderInThisSessionRef.current = false
              prevTableOrdersMapRef.current.clear()
              setCartRef.current([])
              setTableOrderStatus(null)
              if (data.new_session_id) {
                setSessionIdRef.current(data.new_session_id)
              }
              return
            }

            if (
              ((data.type === 'table_bill_paid') || (data.type === 'service_call_attended' && data.is_bill)) &&
              (data.table_number?.toString() === tableNumber?.toString() || data.tableNumber?.toString() === tableNumber?.toString())
            ) {
              const hadOrdersInSession = hasHadActiveOrderInThisSessionRef.current || prevTableOrdersMapRef.current.size > 0
              if (hasRequestedBillRef.current || userRequestedBillTimeRef.current || hadOrdersInSession) {
                handleTableMarkedPaidRef.current()
                return
              }
            }

            if (data.type === 'menu_updated' && (!data.slug || data.slug === slug)) {
              if (data.productId && data.isAvailable !== undefined) {
                const canonical = resolveCanonicalProductId(data.productId) || data.productId
                setProductsRef.current(prev => prev.map(p => {
                  const pCanon = resolveCanonicalProductId(p.id) || p.id
                  if (p.id === data.productId || p.id === canonical || pCanon === canonical) {
                    return { ...p, is_available: data.isAvailable }
                  }
                  return p
                }))
                return
              }
              loadDataRef.current()
              return
            }

            if (data.type === 'connected') return

            if (
              data.tableNumber?.toString() === tableNumber?.toString() ||
              data.table_number?.toString() === tableNumber?.toString() ||
              data.type?.startsWith('order_') ||
              data.type?.startsWith('service_')
            ) {
              triggerDebouncedCheck()
            }
          } catch {}
        }
        sseEventSource.onerror = () => {
          if (sseEventSource) {
            sseEventSource.close()
            sseEventSource = null
          }
        }
      } catch {}
    }

    pollInterval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
        return
      }
      checkOrderStatus()
    }, 4500)

    const handleLocalTableFreed = (e: any) => {
      if (e.detail?.tableNumber?.toString() === tableNumber?.toString()) {
        hasHadActiveOrderInThisSessionRef.current = false
        prevTableOrdersMapRef.current.clear()
        setCartRef.current([])
        setTableOrderStatus(null)
        setTableOrders([])
        setTableTotalAmount(0)
        setIsTablePaidRef.current(false)
        setIsTablePaid(false)
        setHasRequestedBill(false)
        hasRequestedBillRef.current = false
        userRequestedBillTimeRef.current = null
        if (typeof window !== 'undefined') {
          try {
            sessionStorage.removeItem(`fluxo_bill_requested_${slug}_${tableNumber}`)
            sessionStorage.removeItem(`fluxo_table_paid_${slug}_${tableNumber}`)
            sessionStorage.removeItem(`fluxo_paid_banner_dismissed_${slug}_${tableNumber}`)
            sessionStorage.removeItem(`fluxo_last_paid_total_${slug}_${tableNumber}`)
            localStorage.removeItem(`fluxo_cart_${slug}_${tableNumber}`)
          } catch (_) {}
        }
      }
    }

    const handleLocalTableBillPaid = (e: any) => {
      if (e.detail?.tableNumber?.toString() === tableNumber?.toString()) {
        setTableOrderStatus(null)
        setIsTablePaidRef.current(true)
        handleTableMarkedPaidRef.current()
      }
    }

    // BroadcastChannel cross-tab synchronization
    let menuBc: BroadcastChannel | null = null
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      menuBc = new BroadcastChannel('fluxo_menu_channel')
      menuBc.onmessage = (event) => {
        const data = event.data
        if (!data) return
        if (
          data.type === 'table_freed' &&
          (data.tableNumber?.toString() === tableNumber?.toString() || data.table_number?.toString() === tableNumber?.toString())
        ) {
          handleLocalTableFreed({ detail: { tableNumber } })
        } else if (
          data.type === 'table_bill_paid' &&
          (data.tableNumber?.toString() === tableNumber?.toString() || data.table_number?.toString() === tableNumber?.toString())
        ) {
          handleLocalTableBillPaid({ detail: { tableNumber } })
        }
      }
    }

    window.addEventListener('fluxo_table_freed', handleLocalTableFreed)
    window.addEventListener('fluxo_table_bill_paid', handleLocalTableBillPaid)

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkOrderStatus()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleVisibilityChange)

    return () => {
      if (realtimeChannel && supabase) {
        supabase.removeChannel(realtimeChannel)
      }
      if (sseEventSource) sseEventSource.close()
      if (pollInterval) clearInterval(pollInterval)
      if (menuBc) {
        menuBc.close()
      }
      window.removeEventListener('fluxo_table_freed', handleLocalTableFreed)
      window.removeEventListener('fluxo_table_bill_paid', handleLocalTableBillPaid)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleVisibilityChange)
    }
  }, [slug, tableNumber, isFixedMenu])

  return {
    tableOrderStatus,
    setTableOrderStatus,
    tableOrders,
    setTableOrders,
    tableTotalAmount,
    setTableTotalAmount,
    prevTableOrdersMapRef,
  }
}
