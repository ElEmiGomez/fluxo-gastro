import { CRMLead } from '@/types/crm.types'

const CACHE_KEY = 'fluxo_crm_leads_cache_v1'
const PENDING_MUTATIONS_KEY = 'fluxo_crm_pending_mutations_v1'

export interface PendingMutation {
  id: string
  leadId: string
  type: 'update' | 'create' | 'delete'
  payload?: any
  timestamp: string
}

/**
 * Guarda el catálogo de leads en localStorage para consulta sin cobertura
 */
export function saveLeadsToOfflineCache(leads: CRMLead[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(leads))
  } catch (e) {
    console.warn('[Offline Cache] No se pudo guardar en localStorage:', e)
  }
}

/**
 * Recupera el catálogo de leads del almacenamiento local
 */
export function getLeadsFromOfflineCache(): CRMLead[] | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as CRMLead[]
  } catch (e) {
    console.warn('[Offline Cache] Error al leer leads de localStorage:', e)
    return null
  }
}

/**
 * Encola una mutación realizada fuera de línea
 */
export function enqueueOfflineMutation(mutation: Omit<PendingMutation, 'id' | 'timestamp'>): void {
  if (typeof window === 'undefined') return
  try {
    const raw = localStorage.getItem(PENDING_MUTATIONS_KEY)
    const queue: PendingMutation[] = raw ? JSON.parse(raw) : []
    queue.push({
      ...mutation,
      id: `mut_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
    })
    localStorage.setItem(PENDING_MUTATIONS_KEY, JSON.stringify(queue))
  } catch (e) {
    console.warn('[Offline Cache] Error al encolar mutación:', e)
  }
}

/**
 * Obtiene las mutaciones pendientes de sincronizar
 */
export function getPendingOfflineMutations(): PendingMutation[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(PENDING_MUTATIONS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch (e) {
    return []
  }
}

/**
 * Limpia la cola de mutaciones tras una sincronización exitosa
 */
export function clearPendingOfflineMutations(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(PENDING_MUTATIONS_KEY)
  } catch (e) {
    console.warn('[Offline Cache] Error al limpiar cola:', e)
  }
}

/**
 * Sincroniza todas las mutaciones pendientes con el servidor
 */
export async function syncPendingOfflineMutations(): Promise<{ synced: number; failed: number }> {
  const pending = getPendingOfflineMutations()
  if (pending.length === 0) return { synced: 0, failed: 0 }

  let synced = 0
  let failed = 0
  const remaining: PendingMutation[] = []

  for (const item of pending) {
    try {
      if (item.type === 'update') {
        const res = await fetch('/api/crm', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: item.leadId, ...item.payload }),
        })
        if (res.ok) synced++
        else {
          failed++
          remaining.push(item)
        }
      } else if (item.type === 'create') {
        const res = await fetch('/api/crm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item.payload),
        })
        if (res.ok) synced++
        else {
          failed++
          remaining.push(item)
        }
      } else if (item.type === 'delete') {
        const res = await fetch(`/api/crm?id=${item.leadId}`, {
          method: 'DELETE',
        })
        if (res.ok) synced++
        else {
          failed++
          remaining.push(item)
        }
      }
    } catch (err) {
      failed++
      remaining.push(item)
    }
  }

  try {
    if (remaining.length > 0) {
      localStorage.setItem(PENDING_MUTATIONS_KEY, JSON.stringify(remaining))
    } else {
      localStorage.removeItem(PENDING_MUTATIONS_KEY)
    }
  } catch (e) {
    // Ignore
  }

  return { synced, failed }
}
