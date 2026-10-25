'use client'

import { useState, useEffect, useRef } from 'react'
import { Order, OrderStatus, Product, CartItem } from '@/types/database.types'
import { createBrowserClient } from '@/lib/supabase/client'
import { resolveCanonicalProductId } from '@/lib/category-matcher'
import { MOCK_PRODUCTS } from '@/lib/supabase/mock-fallback'
import {
  mergeOrderItemsCourseTags,
  mergeItemNotes,
  hasItemProgressionTag,
  orderHasActiveDesserts,
  areOrderStartersServed,
  areOrderMainsFired,
  hydrateOrderItemsWithCatalog,
  areAllOrderCoursesDelivered,
  TAG_DESSERT_FIRED,
} from '@/lib/course-utils'

interface UseMenuOrderSyncParams {
  slug: string
  tableNumber: string
  sessionId: string | null
  setSessionId: (id: string | null) => void
  isFixedMenu: boolean
  isTablePaid: boolean
  setIsTablePaid: (paid: boolean) => void
  setIsOrderPaid?: (paid: boolean) => void
  resetPaidOrderSession?: () => void
  setIsPaidBannerDismissed: (dismissed: boolean) => void
  setIsReviewBoosterDismissed: (dismissed: boolean) => void
  setHasRequestedBill: (req: boolean) => void
  hasRequestedBillRef: React.MutableRefObject<boolean>
  userRequestedBillTimeRef: React.MutableRefObject<number | null>
  setPendingServiceCalls: React.Dispatch<React.SetStateAction<Set<string>>>
  products?: Product[]
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>
  loadData: () => Promise<void>
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>
  handleTableMarkedPaid: (paidSnapshot?: { total?: number; points?: number }) => void
}

export function useMenuOrderSync({
  slug,
  tableNumber,
  sessionId,
  setSessionId,
  isFixedMenu,
  isTablePaid,
  setIsTablePaid,
  setIsOrderPaid,
  resetPaidOrderSession,
  setIsPaidBannerDismissed,
  setIsReviewBoosterDismissed,
  setHasRequestedBill,
  hasRequestedBillRef,
  userRequestedBillTimeRef,
  setPendingServiceCalls,
  products,
  setProducts,
  loadData,
  setCart,
  handleTableMarkedPaid,
}: UseMenuOrderSyncParams) {
  const [tableOrderStatus, setTableOrderStatus] = useState<OrderStatus | null>(null)
  const [tableOrders, setTableOrders] = useState<Order[]>([])
  const [tableTotalAmount, setTableTotalAmount] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      try {
        const lastTotal = sessionStorage.getItem(`fluxo_last_paid_total_${slug}_${tableNumber}`)
        if (lastTotal && Number(lastTotal) > 0) return Number(lastTotal)
        const storedPaid = sessionStorage.getItem(`fluxo_paid_order_${slug}_${tableNumber}`)
        if (storedPaid) {
          const parsed = JSON.parse(storedPaid)
          if (parsed?.total > 0) return Number(parsed.total)
        }
      } catch (_) {}
    }
    return 0
  })
  const prevTableOrdersMapRef = useRef<Map<string, any>>(new Map())
  const hasHadActiveOrderInThisSessionRef = useRef<boolean>(false)

  const productsListRef = useRef<Product[]>(
    products && products.length > 0 ? products : (MOCK_PRODUCTS[slug] || MOCK_PRODUCTS['burger-gourmet'] || [])
  )
  useEffect(() => {
    if (products && products.length > 0) {
      productsListRef.current = products
    }
  }, [products])

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

  const setIsOrderPaidRef = useRef(setIsOrderPaid)
  setIsOrderPaidRef.current = setIsOrderPaid

  const resetPaidOrderSessionRef = useRef(resetPaidOrderSession)
  resetPaidOrderSessionRef.current = resetPaidOrderSession

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

    const getActiveSessionOrderIds = (): Set<string> => {
      const set = new Set<string>(Array.from(prevTableOrdersMapRef.current.keys()))
      if (typeof window !== 'undefined') {
        try {
          const raw = sessionStorage.getItem(`fluxo_active_order_ids_${slug}_${tableNumber}`)
          if (raw) {
            const parsed = JSON.parse(raw)
            if (Array.isArray(parsed)) parsed.forEach((id: string) => set.add(id))
          }
        } catch (_) {}
      }
      return set
    }

    const saveActiveSessionOrderIds = (ids: string[]) => {
      if (typeof window !== 'undefined' && ids.length > 0) {
        try {
          const existing = getActiveSessionOrderIds()
          ids.forEach(id => existing.add(id))
          sessionStorage.setItem(
            `fluxo_active_order_ids_${slug}_${tableNumber}`,
            JSON.stringify(Array.from(existing))
          )
        } catch (_) {}
      }
    }

    const removeActiveSessionOrderId = (orderId: string) => {
      prevTableOrdersMapRef.current.delete(orderId)
      if (typeof window !== 'undefined') {
        try {
          const raw = sessionStorage.getItem(`fluxo_active_order_ids_${slug}_${tableNumber}`)
          if (raw) {
            const parsed = JSON.parse(raw)
            if (Array.isArray(parsed)) {
              const filtered = parsed.filter((id: string) => id !== orderId)
              if (filtered.length > 0) {
                sessionStorage.setItem(`fluxo_active_order_ids_${slug}_${tableNumber}`, JSON.stringify(filtered))
              } else {
                sessionStorage.removeItem(`fluxo_active_order_ids_${slug}_${tableNumber}`)
              }
            }
          }
        } catch (_) {}
      }
      if (prevTableOrdersMapRef.current.size === 0 && getActiveSessionOrderIds().size === 0) {
        hasHadActiveOrderInThisSessionRef.current = false
      }
    }

    const hasActiveSessionHistory = (): boolean => {
      return (
        hasHadActiveOrderInThisSessionRef.current ||
        prevTableOrdersMapRef.current.size > 0 ||
        getActiveSessionOrderIds().size > 0
      )
    }

    const getSessionKnownTotal = (): number => {
      const fromMap = Array.from(prevTableOrdersMapRef.current.values()).reduce(
        (sum, o) => sum + (Number(o.total_amount) || 0),
        0
      )
      if (fromMap > 0) return fromMap
      if (typeof window !== 'undefined') {
        try {
          const lastTotal = Number(sessionStorage.getItem(`fluxo_last_paid_total_${slug}_${tableNumber}`) || 0)
          if (lastTotal > 0) return lastTotal
        } catch (_) {}
      }
      return 0
    }

    const isPaidLockActive = () => {
      if (isTablePaidRef.current) return true
      if (typeof window !== 'undefined') {
        try {
          if (
            sessionStorage.getItem(`fluxo_paid_lock_${slug}_${tableNumber}`) === 'true' ||
            sessionStorage.getItem(`fluxo_table_paid_lock_${slug}_${tableNumber}`) === 'true' ||
            Boolean(sessionStorage.getItem(`fluxo_paid_order_${slug}_${tableNumber}`))
          ) {
            return true
          }
        } catch (_) {}
      }
      return false
    }

    const stopPollingAndLockPaid = (paidSnapshot?: { total?: number; points?: number }) => {
      if (debounceTimer) {
        clearTimeout(debounceTimer)
        debounceTimer = null
      }
      hasQueuedCheck = false
      const resolvedTotal = Math.max(getSessionKnownTotal(), Number(paidSnapshot?.total) || 0)
      if (resolvedTotal > 0) {
        setTableTotalAmount(resolvedTotal)
        if (typeof window !== 'undefined') {
          try {
            sessionStorage.setItem(`fluxo_last_paid_total_${slug}_${tableNumber}`, String(resolvedTotal))
          } catch (_) {}
        }
      }
      if (typeof window !== 'undefined') {
        try {
          sessionStorage.removeItem(`fluxo_active_order_ids_${slug}_${tableNumber}`)
        } catch (_) {}
      }
      prevTableOrdersMapRef.current.clear()
      hasHadActiveOrderInThisSessionRef.current = false
      setTableOrderStatus(null)
      setTableOrders([])
      setIsTablePaidRef.current(true)
      setIsTablePaid(true)
      handleTableMarkedPaidRef.current(
        resolvedTotal > 0
          ? { total: resolvedTotal, points: paidSnapshot?.points ?? Math.round(resolvedTotal * 10) }
          : paidSnapshot
      )
    }

    const triggerDebouncedCheck = () => {
      if (isPaidLockActive()) {
        if (pollInterval) {
          clearInterval(pollInterval)
          pollInterval = null
        }
        if (debounceTimer) {
          clearTimeout(debounceTimer)
          debounceTimer = null
        }
        return
      }
      if (debounceTimer) clearTimeout(debounceTimer)
      debounceTimer = setTimeout(() => {
        checkOrderStatus()
      }, 300)
    }

    const checkOrderStatus = async () => {
      if (isPaidLockActive()) {
        if (pollInterval) {
          clearInterval(pollInterval)
          pollInterval = null
        }
        setTableOrderStatus(null)
        setTableOrders([])
        if (!isTablePaidRef.current) {
          setIsTablePaidRef.current(true)
          setIsTablePaid(true)
        }
        return
      }
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

        const currentSessionId = thisTableSession?.session_id || sessionIdRef.current
        const rawOrders: any[] = ordersRes.orders || []
        const serverOrdersList: any[] = rawOrders.map((ord: any) => {
          const prevOrd = prevTableOrdersMapRef.current.get(ord.id)
          const mergedOrderNotes = mergeItemNotes((ord as any).notes, (prevOrd as any)?.notes)

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
          }

          if (prevOrd?.order_items && prevOrd.order_items.length > 0 && items && items.length > 0) {
            items = mergeOrderItemsCourseTags(items, prevOrd.order_items)
          }

          // Hidratación obligatoria con nombres reales de productos y propagación monotónica de fases
          items = hydrateOrderItemsWithCatalog(
            items || [],
            productsListRef.current,
            prevOrd?.order_items,
            mergedOrderNotes
          )

          if (items.length > 0 && typeof window !== 'undefined') {
            try {
              localStorage.setItem(`fluxo_order_items_${ord.id}`, JSON.stringify(items))
            } catch (_) {}
          }

          const hydratedOrd: Order = { ...ord, notes: mergedOrderNotes, order_items: items }
          let effectiveStatus: OrderStatus = ord.status
          const hasProgression = (items || []).some((it: any) => hasItemProgressionTag(it.notes))

          if (hasProgression && ord.status === 'pending_validation') {
            effectiveStatus = (prevOrd?.status && prevOrd.status !== 'pending_validation') ? prevOrd.status : 'pending'
          } else if (prevOrd?.status === 'delivered' && ord.status !== 'delivered' && ord.status !== 'paid') {
            if ((ord.status === 'preparing' || ord.status === 'ready') && (orderHasActiveDesserts(hydratedOrd) || mergedOrderNotes.includes(TAG_DESSERT_FIRED))) {
              effectiveStatus = ord.status
            } else {
              effectiveStatus = 'delivered'
            }
          } else if (prevOrd?.status === 'paid' && ord.status !== 'paid') {
            effectiveStatus = 'paid'
          } else if (prevOrd?.status === 'ready' && ord.id === prevOrd?.id && hasProgression && (ord.status === 'pending_validation' || (ord.status === 'preparing' && !areOrderStartersServed(hydratedOrd) && !areOrderMainsFired(hydratedOrd) && !orderHasActiveDesserts(hydratedOrd)))) {
            effectiveStatus = 'ready'
          } else if (prevOrd?.status === 'preparing' && (ord.status === 'pending' || ord.status === 'pending_validation')) {
            effectiveStatus = 'preparing'
          } else if (prevOrd?.status === 'pending' && ord.status === 'pending_validation') {
            effectiveStatus = 'pending'
          }

          const finalOrd: Order = { ...hydratedOrd, status: effectiveStatus }
          if (
            finalOrd.status !== 'paid' &&
            finalOrd.status !== 'cancelled' &&
            finalOrd.status !== 'pending_validation' &&
            areAllOrderCoursesDelivered(finalOrd)
          ) {
            finalOrd.status = 'delivered'
          }
          return finalOrd
        })

        const isTableExplicitlyFreed = Boolean(
          !thisTableSession || thisTableSession.status === 'free' || thisTableSession.status === 'closed'
        )

        serverOrdersList.forEach(o => {
          const matchesTable = (
            o.table_number?.toString() === tableNumber?.toString() ||
            o.table?.table_number?.toString() === tableNumber?.toString() ||
            o.table_id === `table-${tableNumber}`
          )
          if (matchesTable && o.status === 'cancelled') {
            removeActiveSessionOrderId(o.id)
          }
        })

        const allTableOrders = serverOrdersList.filter(o => {
          const matchesTable = (
            o.table_number?.toString() === tableNumber?.toString() ||
            o.table?.table_number?.toString() === tableNumber?.toString() ||
            o.table_id === `table-${tableNumber}`
          )
          if (!matchesTable) return false
          if (o.status === 'cancelled' || o.status === 'paid') return false
          if (isTableExplicitlyFreed) return false

          const isActiveKitchenOrder = ['pending_validation', 'pending', 'confirmed', 'preparing', 'ready'].includes(o.status)
          if (isActiveKitchenOrder) return true

          if (o.status === 'delivered') {
            if (isTableExplicitlyFreed || !thisTableSession || thisTableSession.status === 'free' || thisTableSession.status === 'closed') return false
            return true
          }

          if (!currentSessionId || !o.session_token) return false
          const isCurrentSessionOrder =
            o.session_token === currentSessionId ||
            (sessionIdRef.current && o.session_token === sessionIdRef.current) ||
            (thisTableSession?.session_id && o.session_token === thisTableSession.session_id)
          return Boolean(isCurrentSessionOrder)
        })

        allTableOrders.forEach(ord => {
          prevTableOrdersMapRef.current.set(ord.id, ord)
        })

        const activeTableOrders = allTableOrders.filter(
          o => ['pending_validation', 'pending', 'confirmed', 'preparing', 'ready', 'delivered'].includes(o.status)
        )

        if (activeTableOrders.length > 0) {
          saveActiveSessionOrderIds(activeTableOrders.map(o => o.id))
        }

        if (activeTableOrders.length > 0 || hasRequestedBillRef.current) {
          hasHadActiveOrderInThisSessionRef.current = true
        }

        const dismissedAt = typeof window !== 'undefined'
          ? Number(sessionStorage.getItem(`fluxo_paid_dismissed_${slug}_${tableNumber}`) || 0)
          : 0

        const trackedOrderIds = getActiveSessionOrderIds()

        const paidOrdersForTable = isTableExplicitlyFreed
          ? []
          : serverOrdersList.filter(o => {
              const matchesTable = (
                o.table_number?.toString() === tableNumber?.toString() ||
                o.table?.table_number?.toString() === tableNumber?.toString() ||
                o.table_id === `table-${tableNumber}`
              )
              if (!matchesTable || o.status !== 'paid') return false
              if (trackedOrderIds.has(o.id)) {
                return true
              }
              const paidAt = new Date(o.updated_at || o.created_at || 0).getTime()
              if (dismissedAt > 0 && paidAt > 0 && paidAt <= dismissedAt) {
                return false
              }
              if (currentSessionId && o.session_token && o.session_token !== currentSessionId && (!thisTableSession?.session_id || o.session_token !== thisTableSession.session_id)) {
                return false
              }
              const isRecentPaid = isNaN(paidAt) || paidAt === 0 || Date.now() - paidAt < 15 * 60 * 1000
              if (currentSessionId && o.session_token) {
                return o.session_token === currentSessionId || (Boolean(thisTableSession?.session_id) && o.session_token === thisTableSession?.session_id)
              }
              return isRecentPaid && hasActiveSessionHistory()
            })
        const hasPaidOrder = paidOrdersForTable.length > 0
        const hasSavedPaidFlag = isPaidLockActive()

        if (hasPaidOrder) {
          const paidTotal = paidOrdersForTable.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0)
          if (paidTotal > 0 && typeof window !== 'undefined') {
            try {
              sessionStorage.setItem(`fluxo_last_paid_total_${slug}_${tableNumber}`, String(paidTotal))
            } catch (_) {}
          }
          if (paidTotal > 0) {
            setTableTotalAmount(paidTotal)
          }
          stopPollingAndLockPaid({ total: paidTotal, points: Math.round(paidTotal * 10) })
          return
        }

        if (hasSavedPaidFlag) {
          if (isTableExplicitlyFreed) {
            handleLocalTableFreed({ detail: { tableNumber, new_session_id: thisTableSession?.session_id } })
            return
          } else {
            return
          }
        }

        if (isTableExplicitlyFreed && activeTableOrders.length === 0) {
          // La mesa fue liberada por el personal para el siguiente cliente: limpiar carteles post-pago
          resetPaidOrderSessionRef.current?.()
          setIsTablePaidRef.current(false)
          setIsTablePaid(false)
          setIsOrderPaidRef.current?.(false)
          setIsPaidBannerDismissedRef.current(false)
          setIsPaidBannerDismissed(false)
          setIsReviewBoosterDismissedRef.current(false)
          setIsReviewBoosterDismissed(false)

          hasHadActiveOrderInThisSessionRef.current = false
          prevTableOrdersMapRef.current.clear()
          setTableOrderStatus(null)
          setTableOrders([])
          setTableTotalAmount(0)
          setHasRequestedBill(false)
          hasRequestedBillRef.current = false
          userRequestedBillTimeRef.current = null
          if (thisTableSession?.session_id) {
            setSessionIdRef.current(thisTableSession.session_id)
            setSessionId(thisTableSession.session_id)
          }
          if (typeof window !== 'undefined') {
            try {
              sessionStorage.setItem(`fluxo_paid_dismissed_${slug}_${tableNumber}`, String(Date.now()))
              sessionStorage.removeItem(`fluxo_active_order_ids_${slug}_${tableNumber}`)
              sessionStorage.removeItem(`fluxo_bill_requested_${slug}_${tableNumber}`)
              sessionStorage.removeItem(`fluxo_table_paid_${slug}_${tableNumber}`)
              sessionStorage.removeItem(`fluxo_paid_banner_dismissed_${slug}_${tableNumber}`)
              sessionStorage.removeItem(`fluxo_last_paid_total_${slug}_${tableNumber}`)
              sessionStorage.removeItem(`fluxo_paid_lock_${slug}_${tableNumber}`)
              sessionStorage.removeItem(`fluxo_table_paid_lock_${slug}_${tableNumber}`)
              sessionStorage.removeItem(`fluxo_paid_order_${slug}_${tableNumber}`)
            } catch (_) {}
          }
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
          stopPollingAndLockPaid()
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
            prevTableOrdersMapRef.current.clear()
            setTableTotalAmount(0)
            setTableOrderStatus(null)
            setTableOrders([])
          }
        } else {
          prevTableOrdersMapRef.current.clear()
          setTableTotalAmount(0)
          setTableOrderStatus(null)
          setTableOrders([])
        }
      } catch (e) {
        console.log('Error checking order status for diner:', e)
      } finally {
        isChecking = false
        if (hasQueuedCheck && !isPaidLockActive()) {
          hasQueuedCheck = false
          triggerDebouncedCheck()
        }
      }
    }

    if (isPaidLockActive()) {
      setTableOrderStatus(null)
      setTableOrders([])
      return
    }

    checkOrderStatus()

    const supabase = createBrowserClient()
    let realtimeChannel: any = null

    if (supabase) {
      const channelId = `diner-orders-${slug}-${tableNumber}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
      realtimeChannel = supabase
        .channel(channelId)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload: any) => {
          if (isPaidLockActive()) return
          const newOrder = payload?.new
          const matchesTable = newOrder && (
            newOrder.table_number?.toString() === tableNumber?.toString() ||
            newOrder.table_id === `table-${tableNumber}`
          )
          if (matchesTable && newOrder.status === 'cancelled' && newOrder.id) {
            removeActiveSessionOrderId(newOrder.id)
          }
          if (matchesTable && newOrder.status === 'paid') {
            if (hasRequestedBillRef.current || userRequestedBillTimeRef.current || hasActiveSessionHistory()) {
              const combinedTotal = Math.max(getSessionKnownTotal(), Number(newOrder.total_amount) || 0)
              stopPollingAndLockPaid({
                total: combinedTotal,
                points: combinedTotal > 0 ? Math.round(combinedTotal * 10) : undefined,
              })
              return
            }
          }
          triggerDebouncedCheck()
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'order_items' }, () => {
          if (isPaidLockActive()) return
          triggerDebouncedCheck()
        })
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'order_events' }, (payload: any) => {
          if (isPaidLockActive()) return
          const newEvt = payload?.new
          const matchesTable = newEvt && (
            newEvt.table_number?.toString() === tableNumber?.toString() ||
            newEvt.metadata?.table_number?.toString() === tableNumber?.toString()
          )
          if (matchesTable && (newEvt.event_type === 'order_paid' || newEvt.new_status === 'paid')) {
            if (hasRequestedBillRef.current || userRequestedBillTimeRef.current || hasActiveSessionHistory()) {
              stopPollingAndLockPaid()
              return
            }
          }
          triggerDebouncedCheck()
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'service_calls' }, (payload: any) => {
          if (isPaidLockActive()) return
          const newCall = payload?.new
          const matchesTable = newCall && newCall.table_number?.toString() === tableNumber?.toString()
          if (matchesTable && newCall.status === 'attended' && newCall.call_type?.startsWith('bill_')) {
            stopPollingAndLockPaid()
            return
          }
          triggerDebouncedCheck()
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'table_sessions' }, (payload: any) => {
          const newSession = payload?.new
          const matchesTable = newSession && newSession.table_number?.toString() === tableNumber?.toString()
          if (matchesTable && (newSession.status === 'closed' || newSession.status === 'free')) {
            handleLocalTableFreed({ detail: { tableNumber, new_session_id: newSession.session_token || newSession.session_id } })
            return
          }
          if (isPaidLockActive()) return
          triggerDebouncedCheck()
        })
        .subscribe()
    }

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
              handleLocalTableFreed({ detail: { tableNumber, new_session_id: data.new_session_id } })
              return
            }

            if (
              ((data.type === 'table_bill_paid') || (data.type === 'service_call_attended' && data.is_bill)) &&
              (data.table_number?.toString() === tableNumber?.toString() || data.tableNumber?.toString() === tableNumber?.toString())
            ) {
              if (hasRequestedBillRef.current || userRequestedBillTimeRef.current || hasActiveSessionHistory() || isPaidLockActive()) {
                const totalAmount = Math.max(getSessionKnownTotal(), Number(data.total ?? data.total_amount) || 0)
                stopPollingAndLockPaid({ total: totalAmount > 0 ? totalAmount : undefined, points: totalAmount > 0 ? Math.round(totalAmount * 10) : undefined })
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
            if (isPaidLockActive()) return

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
      const freedTbl = e.detail?.tableNumber ?? e.detail?.table_number
      if (freedTbl?.toString() === tableNumber?.toString()) {
        resetPaidOrderSessionRef.current?.()
        setIsTablePaidRef.current(false)
        setIsTablePaid(false)
        setIsOrderPaidRef.current?.(false)
        setIsPaidBannerDismissedRef.current(false)
        setIsPaidBannerDismissed(false)
        setIsReviewBoosterDismissedRef.current(false)
        setIsReviewBoosterDismissed(false)

        hasHadActiveOrderInThisSessionRef.current = false
        prevTableOrdersMapRef.current.clear()
        setTableOrderStatus(null)
        setTableOrders([])
        setTableTotalAmount(0)
        setHasRequestedBill(false)
        hasRequestedBillRef.current = false
        userRequestedBillTimeRef.current = null

        if (e.detail?.new_session_id) {
          setSessionIdRef.current(e.detail.new_session_id)
          setSessionId(e.detail.new_session_id)
          try {
            localStorage.setItem(`gastro_session_${slug}_${tableNumber}`, e.detail.new_session_id)
          } catch (_) {}
        }

        if (typeof window !== 'undefined') {
          try {
            const lastPaidVal = sessionStorage.getItem(`fluxo_last_paid_total_${slug}_${tableNumber}`)
            if (lastPaidVal) {
              sessionStorage.setItem(`fluxo_last_client_paid_amount_${slug}`, lastPaidVal)
            }
            sessionStorage.setItem(`fluxo_paid_dismissed_${slug}_${tableNumber}`, String(Date.now()))
            sessionStorage.removeItem(`fluxo_active_order_ids_${slug}_${tableNumber}`)
            sessionStorage.removeItem(`fluxo_bill_requested_${slug}_${tableNumber}`)
            sessionStorage.removeItem(`fluxo_table_paid_${slug}_${tableNumber}`)
            sessionStorage.removeItem(`fluxo_paid_banner_dismissed_${slug}_${tableNumber}`)
            sessionStorage.removeItem(`fluxo_last_paid_total_${slug}_${tableNumber}`)
            sessionStorage.removeItem(`fluxo_paid_lock_${slug}_${tableNumber}`)
            sessionStorage.removeItem(`fluxo_table_paid_lock_${slug}_${tableNumber}`)
            sessionStorage.removeItem(`fluxo_paid_order_${slug}_${tableNumber}`)
            localStorage.removeItem(`fluxo_cart_${slug}_${tableNumber}`)
          } catch (_) {}
        }

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('fluxo_loyalty_refresh', { detail: { tableNumber } }))
        }
        loadDataRef.current?.()
      }
    }

    const handleLocalTableBillPaid = (e: any) => {
      const targetTable = e.detail?.tableNumber ?? e.detail?.table_number
      if (targetTable?.toString() === tableNumber?.toString()) {
        const totalAmount = Number(e.detail?.total ?? e.detail?.total_amount) || 0
        if (totalAmount > 0) {
          setTableTotalAmount(totalAmount)
        }
        stopPollingAndLockPaid({
          total: totalAmount > 0 ? totalAmount : undefined,
          points: totalAmount > 0 ? Math.round(totalAmount * 10) : undefined,
        })
      }
    }

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
          handleLocalTableFreed({ detail: { tableNumber, new_session_id: data.new_session_id } })
        } else if (
          data.type === 'table_bill_paid' &&
          (data.tableNumber?.toString() === tableNumber?.toString() || data.table_number?.toString() === tableNumber?.toString())
        ) {
          handleLocalTableBillPaid({ detail: { tableNumber, total: data.total ?? data.total_amount } })
        }
      }
    }

    window.addEventListener('fluxo_table_freed', handleLocalTableFreed)
    window.addEventListener('fluxo_table_bill_paid', handleLocalTableBillPaid)
    window.addEventListener('table_bill_paid', handleLocalTableBillPaid)

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
      if (debounceTimer) clearTimeout(debounceTimer)
      if (menuBc) {
        menuBc.close()
      }
      window.removeEventListener('fluxo_table_freed', handleLocalTableFreed)
      window.removeEventListener('fluxo_table_bill_paid', handleLocalTableBillPaid)
      window.removeEventListener('table_bill_paid', handleLocalTableBillPaid)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleVisibilityChange)
    }
  }, [slug, tableNumber, isFixedMenu, isTablePaid])

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
