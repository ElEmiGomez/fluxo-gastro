// ============================================================================
// Fluxo POS - Offline Sync Queue & Storage Architecture (IndexedDB Nativo)
// ============================================================================

export type MutationType =
  | 'ADD_ITEMS'
  | 'MOVE_TABLE'
  | 'MERGE_TABLES'
  | 'PARTIAL_PAY'
  | 'FREE_TABLE'
  | 'SERVICE_CALL_ATTEND'

export interface QueuedMutation {
  client_mutation_id: string
  type: MutationType
  slug: string
  table_number: string | number
  payload: any
  timestamp: number
  retries: number
  status: 'pending' | 'syncing' | 'failed'
  error?: string
}

export interface CachedTableState {
  table_number: string | number
  status: 'free' | 'busy' | 'calling' | 'ready'
  pax?: number
  discount?: number
  items?: any[]
  paid_amount_cents?: number
  total_amount_cents?: number
  last_updated: number
}

const DB_NAME = 'fluxo_pos_offline'
const DB_VERSION = 1
const STORE_TABLES = 'tables_state'
const STORE_QUEUE = 'sync_queue'

let dbInstance: IDBDatabase | null = null

function openDatabase(): Promise<IDBDatabase> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('IndexedDB not supported in SSR environment'))
  }

  if (dbInstance) {
    return Promise.resolve(dbInstance)
  }

  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('IndexedDB no está soportado en este navegador'))
      return
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = event => {
      const db = (event.target as IDBOpenDBRequest).result

      if (!db.objectStoreNames.contains(STORE_TABLES)) {
        db.createObjectStore(STORE_TABLES, { keyPath: 'table_number' })
      }

      if (!db.objectStoreNames.contains(STORE_QUEUE)) {
        const queueStore = db.createObjectStore(STORE_QUEUE, { keyPath: 'client_mutation_id' })
        queueStore.createIndex('by_timestamp', 'timestamp', { unique: false })
        queueStore.createIndex('by_status', 'status', { unique: false })
      }
    }

    request.onsuccess = event => {
      dbInstance = (event.target as IDBOpenDBRequest).result
      resolve(dbInstance)
    }

    request.onerror = event => {
      reject((event.target as IDBOpenDBRequest).error)
    }
  })
}

// ----------------------------------------------------------------------------
// Local Table State Cache
// ----------------------------------------------------------------------------

export async function saveLocalTableState(state: CachedTableState): Promise<void> {
  try {
    const db = await openDatabase()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_TABLES, 'readwrite')
      const store = tx.objectStore(STORE_TABLES)
      const req = store.put({
        ...state,
        table_number: state.table_number.toString(),
        last_updated: Date.now(),
      })
      req.onsuccess = () => resolve()
      req.onerror = () => reject(req.error)
    })
  } catch (err) {
    console.warn('[OfflineDB] Error saving table state:', err)
  }
}

export async function getLocalTableState(tableNumber: string | number): Promise<CachedTableState | null> {
  try {
    const db = await openDatabase()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_TABLES, 'readonly')
      const store = tx.objectStore(STORE_TABLES)
      const req = store.get(tableNumber.toString())
      req.onsuccess = () => resolve(req.result || null)
      req.onerror = () => reject(req.error)
    })
  } catch (err) {
    console.warn('[OfflineDB] Error getting table state:', err)
    return null
  }
}

export async function getAllLocalTableStates(): Promise<CachedTableState[]> {
  try {
    const db = await openDatabase()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_TABLES, 'readonly')
      const store = tx.objectStore(STORE_TABLES)
      const req = store.getAll()
      req.onsuccess = () => resolve(req.result || [])
      req.onerror = () => reject(req.error)
    })
  } catch (err) {
    console.warn('[OfflineDB] Error getting all table states:', err)
    return []
  }
}

// ----------------------------------------------------------------------------
// Mutation Queue Operations
// ----------------------------------------------------------------------------

export async function enqueueMutation(
  type: MutationType,
  slug: string,
  tableNumber: string | number,
  payload: any
): Promise<QueuedMutation> {
  const mutation: QueuedMutation = {
    client_mutation_id: `mut_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    type,
    slug,
    table_number: tableNumber.toString(),
    payload,
    timestamp: Date.now(),
    retries: 0,
    status: 'pending',
  }

  try {
    const db = await openDatabase()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_QUEUE, 'readwrite')
      const store = tx.objectStore(STORE_QUEUE)
      const req = store.add(mutation)
      req.onsuccess = () => resolve()
      req.onerror = () => reject(req.error)
    })
    notifyQueueChange()
  } catch (err) {
    console.warn('[OfflineDB] Error enqueuing mutation:', err)
  }

  return mutation
}

export async function getPendingMutations(): Promise<QueuedMutation[]> {
  try {
    const db = await openDatabase()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_QUEUE, 'readonly')
      const store = tx.objectStore(STORE_QUEUE)
      const req = store.getAll()
      req.onsuccess = () => {
        const all: QueuedMutation[] = req.result || []
        // Orden FIFO estricto por timestamp
        all.sort((a, b) => a.timestamp - b.timestamp)
        resolve(all)
      }
      req.onerror = () => reject(req.error)
    })
  } catch (err) {
    console.warn('[OfflineDB] Error getting mutations:', err)
    return []
  }
}

export async function removeMutation(clientMutationId: string): Promise<void> {
  try {
    const db = await openDatabase()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_QUEUE, 'readwrite')
      const store = tx.objectStore(STORE_QUEUE)
      const req = store.delete(clientMutationId)
      req.onsuccess = () => resolve()
      req.onerror = () => reject(req.error)
    })
    notifyQueueChange()
  } catch (err) {
    console.warn('[OfflineDB] Error removing mutation:', err)
  }
}

export async function updateMutationStatus(
  clientMutationId: string,
  status: 'pending' | 'syncing' | 'failed',
  error?: string
): Promise<void> {
  try {
    const db = await openDatabase()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_QUEUE, 'readwrite')
      const store = tx.objectStore(STORE_QUEUE)
      const getReq = store.get(clientMutationId)
      getReq.onsuccess = () => {
        const item = getReq.result
        if (item) {
          item.status = status
          if (error) item.error = error
          if (status === 'failed') item.retries = (item.retries || 0) + 1
          const putReq = store.put(item)
          putReq.onsuccess = () => resolve()
          putReq.onerror = () => reject(putReq.error)
        } else {
          resolve()
        }
      }
      getReq.onerror = () => reject(getReq.error)
    })
    notifyQueueChange()
  } catch (err) {
    console.warn('[OfflineDB] Error updating mutation status:', err)
  }
}

// ----------------------------------------------------------------------------
// Sync Dispatcher (FIFO & Idempotent Conflict Resolution)
// ----------------------------------------------------------------------------

export interface SyncResult {
  processed: number
  succeeded: number
  failed: number
  errors: string[]
}

let isSyncing = false
const queueChangeListeners = new Set<() => void>()

export function subscribeToQueueChanges(callback: () => void): () => void {
  queueChangeListeners.add(callback)
  return () => {
    queueChangeListeners.delete(callback)
  }
}

function notifyQueueChange() {
  queueChangeListeners.forEach(cb => {
    try {
      cb()
    } catch (e) {
      console.error(e)
    }
  })
}

/**
 * Procesa la cola de sincronización en orden FIFO:
 * - ADD_ITEMS: Unión aditiva al servidor (POST /api/orders)
 * - MOVE_TABLE / MERGE_TABLES: Last-Write-Wins (POST /api/tables action: 'transfer')
 * - PARTIAL_PAY / FREE_TABLE: Cierre y cobro en centavos (POST /api/tables action: 'free')
 */
export async function processSyncQueue(
  isSimulatedOffline = false,
  customHeaders?: Record<string, string>
): Promise<SyncResult> {
  const result: SyncResult = { processed: 0, succeeded: 0, failed: 0, errors: [] }

  if (typeof window === 'undefined') return result
  if (isSimulatedOffline || !navigator.onLine) {
    return result
  }

  if (isSyncing) return result
  isSyncing = true
  notifyQueueChange()

  try {
    const queue = await getPendingMutations()
    if (queue.length === 0) {
      isSyncing = false
      return result
    }

    for (const mutation of queue) {
      result.processed++
      await updateMutationStatus(mutation.client_mutation_id, 'syncing')

      try {
        let ok = false

        if (mutation.type === 'ADD_ITEMS') {
          // Unión aditiva de comanda
          const res = await fetch('/api/orders', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Client-Mutation-ID': mutation.client_mutation_id,
              ...customHeaders,
            },
            body: JSON.stringify(mutation.payload),
          })
          ok = res.ok
        } else if (mutation.type === 'MOVE_TABLE' || mutation.type === 'MERGE_TABLES') {
          // Last-Write-Wins en traslado o fusión
          const res = await fetch('/api/tables', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Client-Mutation-ID': mutation.client_mutation_id,
              ...customHeaders,
            },
            body: JSON.stringify({
              slug: mutation.slug,
              table_number: mutation.table_number,
              action: 'transfer',
              to_table: mutation.payload.to_table,
            }),
          })
          ok = res.ok
        } else if (mutation.type === 'PARTIAL_PAY' || mutation.type === 'FREE_TABLE') {
          const res = await fetch('/api/tables', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Client-Mutation-ID': mutation.client_mutation_id,
              ...customHeaders,
            },
            body: JSON.stringify({
              slug: mutation.slug,
              table_number: mutation.table_number,
              action: 'free',
              payment_method: mutation.payload.payment_method || 'card',
              final_amount: mutation.payload.final_amount,
              orders_count: mutation.payload.orders_count,
            }),
          })
          ok = res.ok
        } else if (mutation.type === 'SERVICE_CALL_ATTEND') {
          const res = await fetch('/api/service-calls', {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              ...customHeaders,
            },
            body: JSON.stringify({
              slug: mutation.slug,
              id: mutation.payload.call_id,
              status: 'attended',
            }),
          })
          ok = res.ok
        }

        if (ok) {
          result.succeeded++
          await removeMutation(mutation.client_mutation_id)
        } else {
          result.failed++
          const errMsg = `HTTP error sincronizando ${mutation.type}`
          result.errors.push(errMsg)
          await updateMutationStatus(mutation.client_mutation_id, 'failed', errMsg)
        }
      } catch (err: any) {
        result.failed++
        const errMsg = err?.message || 'Error de red'
        result.errors.push(errMsg)
        await updateMutationStatus(mutation.client_mutation_id, 'failed', errMsg)
      }
    }
  } finally {
    isSyncing = false
    notifyQueueChange()
  }

  return result
}

export function isQueueSyncing(): boolean {
  return isSyncing
}
