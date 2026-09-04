'use client'

import { useEffect, useRef, useCallback } from 'react'
import { createBrowserClient, getClientTargetRestaurantId } from '@/lib/supabase/client'

export interface DualRealtimeOptions {
  slug: string
  restaurantId?: string
  tableNumber?: string | number
  onSync: () => Promise<void> | void
  pollingIntervalMs?: number // Default: 4500 (4.5s)
  enabled?: boolean
  onOrderChange?: (payload: any) => void
  onOrderEvent?: (payload: any) => void
  onServiceCall?: (payload: any) => void
  onTableSession?: (payload: any) => void
}

export function useDualRealtime({
  slug,
  restaurantId,
  tableNumber,
  onSync,
  pollingIntervalMs = 4500,
  enabled = true,
  onOrderChange,
  onOrderEvent,
  onServiceCall,
  onTableSession,
}: DualRealtimeOptions) {
  const onSyncRef = useRef(onSync)
  onSyncRef.current = onSync

  const onOrderChangeRef = useRef(onOrderChange)
  onOrderChangeRef.current = onOrderChange

  const onOrderEventRef = useRef(onOrderEvent)
  onOrderEventRef.current = onOrderEvent

  const onServiceCallRef = useRef(onServiceCall)
  onServiceCallRef.current = onServiceCall

  const onTableSessionRef = useRef(onTableSession)
  onTableSessionRef.current = onTableSession

  const isSyncingRef = useRef(false)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  const triggerSync = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
    debounceTimerRef.current = setTimeout(async () => {
      if (isSyncingRef.current) return
      isSyncingRef.current = true
      try {
        await onSyncRef.current()
      } catch (err) {
        console.warn('[DualRealtime] Sync error:', err)
      } finally {
        isSyncingRef.current = false
      }
    }, 80)
  }, [])

  useEffect(() => {
    if (!enabled) return

    let sseEventSource: EventSource | null = null
    let pollInterval: NodeJS.Timeout | null = null
    let supabaseChannel: any = null

    const targetRestaurantId = getClientTargetRestaurantId(restaurantId, slug)
    const supabase = createBrowserClient()

    // 1. PRIMARY: Supabase Realtime Push via WebSocket
    if (supabase) {
      const channelId = `dual-realtime-${slug}-${targetRestaurantId}`
      const ordersFilter = targetRestaurantId ? `restaurant_id=eq.${targetRestaurantId}` : undefined
      
      const ordersConfig: any = {
        event: '*',
        schema: 'public',
        table: 'orders',
      }
      if (ordersFilter) ordersConfig.filter = ordersFilter

      const orderEventsConfig: any = {
        event: 'INSERT',
        schema: 'public',
        table: 'order_events',
      }
      if (ordersFilter) orderEventsConfig.filter = ordersFilter

      const serviceCallsConfig: any = {
        event: '*',
        schema: 'public',
        table: 'service_calls',
      }
      if (ordersFilter) serviceCallsConfig.filter = ordersFilter

      const tableSessionsConfig: any = {
        event: '*',
        schema: 'public',
        table: 'table_sessions',
      }
      if (ordersFilter) tableSessionsConfig.filter = ordersFilter

      supabaseChannel = supabase
        .channel(channelId)
        .on('postgres_changes', ordersConfig, (payload: any) => {
          onOrderChangeRef.current?.(payload)
          triggerSync()
        })
        .on('postgres_changes', orderEventsConfig, (payload: any) => {
          onOrderEventRef.current?.(payload)
          triggerSync()
        })
        .on('postgres_changes', serviceCallsConfig, (payload: any) => {
          onServiceCallRef.current?.(payload)
          triggerSync()
        })
        .on('postgres_changes', tableSessionsConfig, (payload: any) => {
          onTableSessionRef.current?.(payload)
          triggerSync()
        })
        .subscribe((status: string) => {
          if (status === 'SUBSCRIBED') {
            triggerSync()
          }
        })
    } else {
      // 2. OFFLINE / LOCAL DEV FALLBACK: Server-Sent Events (SSE)
      try {
        sseEventSource = new EventSource('/api/events')
        sseEventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            if (
              !data.slug ||
              data.slug === slug ||
              data.type === 'connected' ||
              data.type?.startsWith('order_') ||
              data.type?.startsWith('table_') ||
              data.type?.startsWith('service_')
            ) {
              triggerSync()
            }
          } catch {}
        }
      } catch {}
    }

    // 3. RESILIENT SOFT POLLING FALLBACK (4.5s)
    pollInterval = setInterval(() => {
      triggerSync()
    }, pollingIntervalMs)

    // 4. INSTANT RECONCILIATION ON VISIBILITY CHANGE OR TAB FOCUS
    const handleWakeup = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        triggerSync()
      }
    }
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleWakeup)
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', handleWakeup)
    }

    // 5. TEARDOWN
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
      if (pollInterval) clearInterval(pollInterval)
      if (sseEventSource) sseEventSource.close()
      if (supabase && supabaseChannel) {
        supabase.removeChannel(supabaseChannel)
      }
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleWakeup)
      }
      if (typeof window !== 'undefined') {
        window.removeEventListener('focus', handleWakeup)
      }
    }
  }, [slug, restaurantId, tableNumber, pollingIntervalMs, enabled, triggerSync])

  return { triggerSync }
}
