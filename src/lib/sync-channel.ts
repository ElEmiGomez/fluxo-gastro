import { Order, OrderStatus } from '@/types/database.types'

export type FluxoSyncEventType =
  | 'order_created'
  | 'order_validated'
  | 'course_fired'
  | 'course_delivered'
  | 'order_delivered'
  | 'table_billed'
  | 'table_paid'
  | 'table_freed'
  | 'order_updated'
  | 'sync_request'

export interface FluxoSyncEvent {
  type: FluxoSyncEventType
  slug?: string
  tableNumber?: string | number
  orderId?: string
  status?: OrderStatus | string
  action?: string
  updatedOrder?: Order
  timestamp: number
}

const CHANNELS = ['fluxo_realtime_sync', 'fluxo_kds_sync']
const STORAGE_KEY = 'fluxo_sync_event'

/**
 * Emite un evento de sincronización reactiva en tiempo real (0ms)
 * utilizando BroadcastChannel con fallback a localStorage (evento 'storage' multi-pestaña)
 * y CustomEvent (intra-pestaña).
 */
export function broadcastFluxoSync(event: Omit<FluxoSyncEvent, 'timestamp'>): void {
  if (typeof window === 'undefined') return

  const payload: FluxoSyncEvent = {
    ...event,
    timestamp: Date.now(),
  }
  const payloadStr = JSON.stringify(payload)

  // 1. Canales BroadcastChannel (actualización instantánea <5ms entre pestañas activas)
  CHANNELS.forEach(chName => {
    try {
      if ('BroadcastChannel' in window) {
        const bc = new BroadcastChannel(chName)
        bc.postMessage(payload)
        setTimeout(() => {
          try {
            bc.close()
          } catch {}
        }, 500)
      }
    } catch {}
  })

  // 2. CustomEvent intra-pestaña
  try {
    window.dispatchEvent(new CustomEvent('fluxo_sync_event', { detail: payload }))
  } catch {}

  // 3. Fallback de localStorage (garantizado en todos los navegadores modernos al cambiar entre pestañas)
  try {
    localStorage.setItem(STORAGE_KEY, payloadStr)
  } catch {}
}

/**
 * Suscribe un callback a todos los canales de sincronización en tiempo real.
 * Retorna una función para cancelar la suscripción.
 */
export function subscribeFluxoSync(
  handler: (event: FluxoSyncEvent) => void
): () => void {
  if (typeof window === 'undefined') return () => {}

  const onMessage = (e: MessageEvent) => {
    if (e.data && typeof e.data === 'object' && e.data.type) {
      handler(e.data as FluxoSyncEvent)
    }
  }

  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue)
        if (parsed && parsed.type) {
          handler(parsed as FluxoSyncEvent)
        }
      } catch {}
    }
  }

  const onCustom = (e: Event) => {
    const ce = e as CustomEvent<FluxoSyncEvent>
    if (ce.detail && ce.detail.type) {
      handler(ce.detail)
    }
  }

  const openChannels: BroadcastChannel[] = []
  CHANNELS.forEach(chName => {
    try {
      if ('BroadcastChannel' in window) {
        const bc = new BroadcastChannel(chName)
        bc.addEventListener('message', onMessage)
        openChannels.push(bc)
      }
    } catch {}
  })

  window.addEventListener('storage', onStorage)
  window.addEventListener('fluxo_sync_event', onCustom)

  return () => {
    openChannels.forEach(bc => {
      try {
        bc.removeEventListener('message', onMessage)
        bc.close()
      } catch {}
    })
    window.removeEventListener('storage', onStorage)
    window.removeEventListener('fluxo_sync_event', onCustom)
  }
}
