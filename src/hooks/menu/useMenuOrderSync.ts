'use client'

import { useState, useEffect, useRef } from 'react'
import { Order, OrderStatus, Product, CartItem } from '@/types/database.types'
import { createBrowserClient } from '@/lib/supabase/client'
import { resolveCanonicalProductId } from '@/lib/category-matcher'

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

  useEffect(() => {
    let sseEventSource: EventSource | null = null
    let pollInterval: any = null
    let isChecking = false
    let debounceTimer: any = null

    const triggerDebouncedCheck = () => {
      if (debounceTimer) clearTimeout(debounceTimer)
      debounceTimer = setTimeout(() => {
        checkOrderStatus()
      }, 300)
    }

    const checkOrderStatus = async () => {
      if (isChecking || isFixedMenu) return
      isChecking = true
      try {
        const [ordersRes, callsRes, tablesRes] = await Promise.all([
          fetch(`/api/orders?slug=${slug}`).then(r => r.json()).catch(() => ({ orders: [] })),
          fetch(`/api/service-calls?slug=${slug}`).then(r => r.json()).catch(() => ({ calls: [] })),
          fetch(`/api/tables?slug=${slug}`).then(r => r.json()).catch(() => ({ sessions: {} })),
        ])

        if (ordersRes?.product_availability) {
          setProducts(prev => {
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
          setSessionId(thisTableSession.session_id)
        }

        const currentSessionId = thisTableSession?.session_id || sessionId
        const rawOrders: any[] = ordersRes.orders || []
        const serverOrdersList: any[] = rawOrders.map((ord: any) => {
          if (!ord.order_items || ord.order_items.length === 0) {
            const prevOrd = prevTableOrdersMapRef.current.get(ord.id)
            if (prevOrd?.order_items && prevOrd.order_items.length > 0) {
              return { ...ord, order_items: prevOrd.order_items }
            }
          }
          return ord
        })

        const allTableOrders = serverOrdersList.filter(o => {
          const matchesTable = (
            o.table_number?.toString() === tableNumber?.toString() ||
            o.table?.table_number?.toString() === tableNumber?.toString() ||
            o.table_id === `table-${tableNumber}`
          )
          if (!matchesTable) return false

          const isActive = ['pending_validation', 'pending', 'confirmed', 'preparing', 'ready', 'delivered'].includes(o.status)
          if (isActive) return true

          if (!currentSessionId || !o.session_token) return false
          const isCurrentSessionOrder = 
            o.session_token === currentSessionId || 
            (sessionId && o.session_token === sessionId) || 
            (thisTableSession?.session_id && o.session_token === thisTableSession.session_id)
          return Boolean(isCurrentSessionOrder)
        })

        allTableOrders.forEach(ord => {
          prevTableOrdersMapRef.current.set(ord.id, ord)
        })

        const activeTableOrders = allTableOrders.filter(
          o => ['pending_validation', 'pending', 'confirmed', 'preparing', 'ready', 'delivered'].includes(o.status)
        )

        if (isTablePaid) {
          return
        }

        if (thisTableSession && thisTableSession.status === 'free' && activeTableOrders.length === 0) {
          prevTableOrdersMapRef.current.clear()
          setTableOrderStatus(null)
          if (hasRequestedBillRef.current || userRequestedBillTimeRef.current) {
            handleTableMarkedPaid()
            return
          }
          setIsTablePaid(false)
          setHasRequestedBill(false)
          hasRequestedBillRef.current = false
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
        setPendingServiceCalls(activeMicroServices)

        const hasPaidOrder = serverOrdersList.some(o => {
          const matchesTable = (
            o.table_number?.toString() === tableNumber?.toString() ||
            o.table?.table_number?.toString() === tableNumber?.toString() ||
            o.table_id === `table-${tableNumber}`
          )
          return matchesTable && o.status === 'paid'
        })

        if ((hasRequestedBillRef.current || userRequestedBillTimeRef.current) && activeTableOrders.length === 0 && hasPaidOrder) {
          handleTableMarkedPaid()
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
          handleTableMarkedPaid()
          return
        }

        const sortedOrders = [...activeTableOrders].sort(
          (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
        )

        if (sortedOrders.length > 0) {
          setTableOrders(sortedOrders)
          const total = sortedOrders.reduce((sum, ord) => sum + (Number(ord.total_amount) || 0), 0)
          setTableTotalAmount(total)

          const activeOrders = sortedOrders.filter(o =>
            ['pending_validation', 'pending', 'confirmed', 'preparing', 'ready'].includes(o.status)
          )

          if (activeOrders.some(o => o.status === 'ready')) {
            setTableOrderStatus('ready')
          } else if (activeOrders.some(o => o.status === 'preparing')) {
            setTableOrderStatus('preparing')
          } else if (activeOrders.some(o => o.status === 'confirmed' || o.status === 'pending')) {
            setTableOrderStatus('pending')
          } else if (activeOrders.length > 0) {
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
            handleTableMarkedPaid()
            return
          }
          checkOrderStatus()
        })
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'order_events' }, (payload: any) => {
          const newEvt = payload?.new
          if (newEvt && (newEvt.event_type === 'order_paid' || newEvt.new_status === 'paid')) {
            handleTableMarkedPaid()
            return
          }
          checkOrderStatus()
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'service_calls' }, (payload: any) => {
          const newCall = payload?.new
          const matchesTable = newCall && newCall.table_number?.toString() === tableNumber?.toString()
          if (matchesTable && newCall.status === 'attended' && newCall.call_type?.startsWith('bill_')) {
            handleTableMarkedPaid()
            return
          }
          checkOrderStatus()
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'table_sessions' }, (payload: any) => {
          const newSession = payload?.new
          const matchesTable = newSession && newSession.table_number?.toString() === tableNumber?.toString()
          if (matchesTable && (newSession.status === 'closed' || newSession.status === 'free')) {
            if (hasRequestedBillRef.current || userRequestedBillTimeRef.current) {
              handleTableMarkedPaid()
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
              if (hasRequestedBillRef.current || userRequestedBillTimeRef.current) {
                handleTableMarkedPaid()
                return
              }
              setCart([])
              setTableOrderStatus(null)
              setIsTablePaid(false)
              setIsPaidBannerDismissed(false)
              setIsReviewBoosterDismissed(false)
              setHasRequestedBill(false)
              hasRequestedBillRef.current = false
              userRequestedBillTimeRef.current = null
              if (typeof window !== 'undefined') {
                localStorage.removeItem(`${STORAGE_CART_PREFIX}${slug}_${tableNumber}`)
                localStorage.removeItem(`gastro_session_${slug}_${tableNumber}`)
                sessionStorage.removeItem(`fluxo_table_paid_${slug}_${tableNumber}`)
                sessionStorage.removeItem(`fluxo_bill_requested_${slug}_${tableNumber}`)
                sessionStorage.removeItem(`fluxo_paid_banner_dismissed_${slug}_${tableNumber}`)
                sessionStorage.removeItem(`fluxo_review_dismissed_${slug}`)
              }
              if (data.new_session_id) {
                setSessionId(data.new_session_id)
              }
              return
            }

            if (
              ((data.type === 'table_bill_paid') || (data.type === 'service_call_attended' && data.is_bill)) &&
              (data.table_number?.toString() === tableNumber?.toString() || data.tableNumber?.toString() === tableNumber?.toString())
            ) {
              handleTableMarkedPaid()
              return
            }

            if (data.type === 'menu_updated' && (!data.slug || data.slug === slug)) {
              if (data.productId && data.isAvailable !== undefined) {
                const canonical = resolveCanonicalProductId(data.productId) || data.productId
                setProducts(prev => prev.map(p => {
                  const pCanon = resolveCanonicalProductId(p.id) || p.id
                  if (p.id === data.productId || p.id === canonical || pCanon === canonical) {
                    return { ...p, is_available: data.isAvailable }
                  }
                  return p
                }))
                return
              }
              loadData()
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
        if (hasRequestedBillRef.current || userRequestedBillTimeRef.current) {
          handleTableMarkedPaid()
          return
        }
        setCart([])
        setTableOrderStatus(null)
        setIsTablePaid(false)
        setIsPaidBannerDismissed(false)
        setIsReviewBoosterDismissed(false)
        setHasRequestedBill(false)
        hasRequestedBillRef.current = false
        userRequestedBillTimeRef.current = null
        if (typeof window !== 'undefined') {
          localStorage.removeItem(`${STORAGE_CART_PREFIX}${slug}_${tableNumber}`)
          localStorage.removeItem(`gastro_session_${slug}_${tableNumber}`)
          sessionStorage.removeItem(`fluxo_table_paid_${slug}_${tableNumber}`)
          sessionStorage.removeItem(`fluxo_bill_requested_${slug}_${tableNumber}`)
          sessionStorage.removeItem(`fluxo_paid_banner_dismissed_${slug}_${tableNumber}`)
          sessionStorage.removeItem(`fluxo_review_dismissed_${slug}`)
        }
      }
    }

    const handleLocalTableBillPaid = (e: any) => {
      if (e.detail?.tableNumber?.toString() === tableNumber?.toString()) {
        handleTableMarkedPaid()
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
      window.removeEventListener('fluxo_table_freed', handleLocalTableFreed)
      window.removeEventListener('fluxo_table_bill_paid', handleLocalTableBillPaid)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleVisibilityChange)
    }
  }, [slug, tableNumber, isFixedMenu, isTablePaid, handleTableMarkedPaid, setSessionId, setProducts, loadData, setCart, setIsTablePaid, setIsPaidBannerDismissed, setIsReviewBoosterDismissed, setHasRequestedBill, hasRequestedBillRef, userRequestedBillTimeRef, setPendingServiceCalls, sessionId])

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
