// ==============================================================================
// FLUXO - ESTADO COMPARTIDO EN SERVIDOR (MULTI-DEVICE SYNC)
// Permite que múltiples dispositivos físicos (celulares de clientes, tablets de
// mozos y pantallas de cocina) se sincronicen en tiempo real localmente.
// ==============================================================================

import { Order, OrderStatus, Category, Product } from '@/types/database.types'
import { MOCK_CATEGORIES, MOCK_PRODUCTS } from '@/lib/supabase/mock-fallback'

export interface ServiceCall {
  id: string
  restaurant_slug: string
  table_number: number | string
  call_type: string
  status: 'pending' | 'attended'
  created_at: string
}

export interface TableSession {
  table_number: number | string
  status: 'free' | 'busy' | 'calling' | 'ready'
  session_id: string
  last_updated_at: string
}

interface IdempotencyLockEntry {
  status: 'pending' | 'completed' | 'failed'
  order?: Order
  error?: string
  waiters: Array<(result: { order?: Order; error?: string }) => void>
  createdAt: number
  expiresAt: number
}

// Estado global en memoria de Node.js (persiste durante la ejecución del servidor)
interface GlobalStoreState {
  __GASTRO_ORDERS__: Record<string, Order[]>
  __GASTRO_STATUS_OVERRIDES__: Record<string, OrderStatus>
  __GASTRO_SERVICE_CALLS__: Record<string, ServiceCall[]>
  __GASTRO_TABLE_SESSIONS__: Record<string, Record<string | number, TableSession>>
  __GASTRO_ANALYTICS__: Record<string, AnalyticsEvent[]>
  __GASTRO_CATEGORIES__: Record<string, Category[]>
  __GASTRO_PRODUCTS__: Record<string, Product[]>
  __GASTRO_SSE_CLIENTS__: Array<(data: string) => void>
  __GASTRO_IDEMPOTENCY_LOCKS__: Map<string, IdempotencyLockEntry>
}

const g = (globalThis as unknown as Partial<GlobalStoreState>)

if (!g.__GASTRO_CATEGORIES__) {
  g.__GASTRO_CATEGORIES__ = {
    'burger-gourmet': [...(MOCK_CATEGORIES['burger-gourmet'] || [])],
    'taperia-casco-antigo': [...(MOCK_CATEGORIES['taperia-casco-antigo'] || [])],
    'terraza-malecon': [...(MOCK_CATEGORIES['terraza-malecon'] || [])],
    'bella-napoli': [...(MOCK_CATEGORIES['bella-napoli'] || [])],
  }
}

if (!g.__GASTRO_PRODUCTS__) {
  g.__GASTRO_PRODUCTS__ = {
    'burger-gourmet': [...(MOCK_PRODUCTS['burger-gourmet'] || [])],
    'taperia-casco-antigo': [...(MOCK_PRODUCTS['taperia-casco-antigo'] || [])],
    'terraza-malecon': [...(MOCK_PRODUCTS['terraza-malecon'] || [])],
    'bella-napoli': [...(MOCK_PRODUCTS['bella-napoli'] || [])],
  }
}

if (!g.__GASTRO_ORDERS__) {
  g.__GASTRO_ORDERS__ = {
    'burger-gourmet': [],
    'taperia-casco-antigo': [],
    'terraza-malecon': [],
    'bella-napoli': [],
  }
}

if (!g.__GASTRO_SERVICE_CALLS__) {
  g.__GASTRO_SERVICE_CALLS__ = {
    'burger-gourmet': [],
    'taperia-casco-antigo': [],
    'terraza-malecon': [],
    'bella-napoli': [],
  }
}

if (!g.__GASTRO_TABLE_SESSIONS__) {
  g.__GASTRO_TABLE_SESSIONS__ = {
    'burger-gourmet': {},
    'taperia-casco-antigo': {},
    'terraza-malecon': {},
    'bella-napoli': {},
  }
}

if (!g.__GASTRO_ANALYTICS__) {
  g.__GASTRO_ANALYTICS__ = {
    'burger-gourmet': [],
    'taperia-casco-antigo': [],
    'terraza-malecon': [],
    'bella-napoli': [],
  }
}

if (!g.__GASTRO_SSE_CLIENTS__) {
  g.__GASTRO_SSE_CLIENTS__ = []
}

if (!g.__GASTRO_IDEMPOTENCY_LOCKS__) {
  g.__GASTRO_IDEMPOTENCY_LOCKS__ = new Map<string, IdempotencyLockEntry>()
}

const globalStore = g as GlobalStoreState

// ==============================================================================
// GESTOR DE IDEMPOTENCIA ATÓMICA Y CERO TOCTOU (Anti-Duplicación en Concurrencia)
// ==============================================================================
const idempotencyStore = new Map<string, { order: Order; expiresAt: number }>()

export interface IdempotencyLockResult {
  isOwner: boolean
  order?: Order
  error?: string
}

export async function acquireIdempotencyLock(
  key: string,
  timeoutMs: number = 10000
): Promise<IdempotencyLockResult> {
  const map = globalStore.__GASTRO_IDEMPOTENCY_LOCKS__
  const now = Date.now()
  const existing = map.get(key)

  if (existing) {
    if (now > existing.expiresAt) {
      map.delete(key)
    } else if (existing.status === 'completed' && existing.order) {
      return { isOwner: false, order: existing.order }
    } else if (existing.status === 'failed') {
      return { isOwner: false, error: existing.error }
    } else if (existing.status === 'pending') {
      // In-flight reservation: esperar a que la petición principal que adquirió el bloqueo finalice
      return new Promise<IdempotencyLockResult>(resolve => {
        let timer: NodeJS.Timeout | null = null
        const waiter = (res: { order?: Order; error?: string }) => {
          if (timer) clearTimeout(timer)
          if (res.order) {
            resolve({ isOwner: false, order: res.order })
          } else {
            resolve({ isOwner: false, error: res.error || 'Error en comanda concurrente' })
          }
        }
        timer = setTimeout(() => {
          const idx = existing.waiters.indexOf(waiter)
          if (idx >= 0) existing.waiters.splice(idx, 1)
          resolve({ isOwner: false, error: 'TIMEOUT_WAITING_IDEMPOTENCY_LOCK' })
        }, timeoutMs)
        existing.waiters.push(waiter)
      })
    }
  }

  // Nueva reserva exclusiva atómica
  const newEntry: IdempotencyLockEntry = {
    status: 'pending',
    waiters: [],
    createdAt: now,
    expiresAt: now + 300000, // 5 minutos de TTL
  }
  map.set(key, newEntry)
  return { isOwner: true }
}

export function completeIdempotencyLock(key: string, order: Order, ttlMs: number = 300000): void {
  const map = globalStore.__GASTRO_IDEMPOTENCY_LOCKS__
  const entry = map.get(key)
  const now = Date.now()

  saveIdempotentOrder(key, order, ttlMs)

  if (entry) {
    entry.status = 'completed'
    entry.order = order
    entry.expiresAt = now + ttlMs
    const waiters = [...entry.waiters]
    entry.waiters = []
    waiters.forEach(w => {
      try {
        w({ order })
      } catch (err) {
        console.warn('Error notificando waiter de idempotencia:', err)
      }
    })
  } else {
    map.set(key, {
      status: 'completed',
      order,
      waiters: [],
      createdAt: now,
      expiresAt: now + ttlMs,
    })
  }
}

export function releaseIdempotencyLock(key: string, error?: string): void {
  const map = globalStore.__GASTRO_IDEMPOTENCY_LOCKS__
  const entry = map.get(key)
  if (entry) {
    entry.status = 'failed'
    entry.error = error || 'Operación cancelada'
    const waiters = [...entry.waiters]
    entry.waiters = []
    waiters.forEach(w => {
      try {
        w({ error: entry.error })
      } catch (err) {
        console.warn('Error notificando fallo de idempotencia:', err)
      }
    })
    map.delete(key)
  }
}

export function getIdempotentOrder(key: string): Order | null {
  const lockEntry = globalStore.__GASTRO_IDEMPOTENCY_LOCKS__?.get(key)
  if (lockEntry && lockEntry.status === 'completed' && lockEntry.order) {
    if (Date.now() <= lockEntry.expiresAt) {
      return lockEntry.order
    }
  }
  const entry = idempotencyStore.get(key)
  if (!entry) return null
  if (Date.now() > entry.expiresAt) {
    idempotencyStore.delete(key)
    return null
  }
  return entry.order
}

export function saveIdempotentOrder(key: string, order: Order, ttlMs: number = 300000): void {
  if (idempotencyStore.size > 2000) {
    const now = Date.now()
    Array.from(idempotencyStore.entries()).forEach(([k, val]) => {
      if (now > val.expiresAt) idempotencyStore.delete(k)
    })
  }
  idempotencyStore.set(key, { order, expiresAt: Date.now() + ttlMs })
}

// ==============================================================================
// MÁQUINA DE ESTADOS FORMAL DE COMANDAS
// ==============================================================================
export const VALID_ORDER_TRANSITIONS: Record<string, string[]> = {
  pending_validation: ['pending', 'confirmed', 'preparing', 'cancelled'], // Mozo valida y envía a cocina
  pending: ['confirmed', 'preparing', 'ready', 'delivered', 'cancelled'],
  confirmed: ['preparing', 'ready', 'delivered', 'cancelled'],
  preparing: ['ready', 'delivered', 'cancelled'],
  ready: ['delivered', 'cancelled'],
  delivered: ['paid', 'cancelled'],
  paid: [],
  cancelled: [],
}

export function isValidOrderTransition(currentStatus: string, nextStatus: string): boolean {
  if (currentStatus === nextStatus) return true
  const allowed = VALID_ORDER_TRANSITIONS[currentStatus] || []
  return allowed.includes(nextStatus)
}

// Helpers de Órdenes
export function getServerOrders(slug: string): Order[] {
  const list = globalStore.__GASTRO_ORDERS__?.[slug] || []
  const overrides = globalStore.__GASTRO_STATUS_OVERRIDES__ || {}
  return list
    .filter(o => o.order_items && o.order_items.length > 0)
    .map(o => (overrides[o.id] ? { ...o, status: overrides[o.id] } : o))
}

export function addServerOrder(slug: string, order: Order): Order {
  if (!globalStore.__GASTRO_ORDERS__) {
    globalStore.__GASTRO_ORDERS__ = {}
  }
  if (!globalStore.__GASTRO_ORDERS__[slug]) {
    globalStore.__GASTRO_ORDERS__[slug] = []
  }
  if (!globalStore.__GASTRO_STATUS_OVERRIDES__) {
    globalStore.__GASTRO_STATUS_OVERRIDES__ = {}
  }

  // Limpiar cualquier override previo de esta orden para que la nueva comanda nazca limpia con su estado real
  delete globalStore.__GASTRO_STATUS_OVERRIDES__[order.id]
  const tableNum = order.table_number || (order.table ? order.table.table_number : null)
  if (tableNum) {
    delete globalStore.__GASTRO_STATUS_OVERRIDES__[`${slug}_table_${tableNum}`]
  }

  const existingIdx = globalStore.__GASTRO_ORDERS__[slug].findIndex(o => o.id === order.id)
  if (existingIdx >= 0) {
    globalStore.__GASTRO_ORDERS__[slug][existingIdx] = {
      ...globalStore.__GASTRO_ORDERS__[slug][existingIdx],
      ...order,
    }
  } else {
    globalStore.__GASTRO_ORDERS__[slug].unshift(order)
    broadcastEvent({ type: 'order_created', slug, order })
  }
  return order
}

export function updateServerOrderStatus(
  slug: string,
  orderId: string,
  status: OrderStatus,
  tableNumber?: number | string
): { orders: Order[]; error?: string } {
  if (!globalStore.__GASTRO_ORDERS__) {
    globalStore.__GASTRO_ORDERS__ = {}
  }
  if (!globalStore.__GASTRO_ORDERS__[slug]) {
    globalStore.__GASTRO_ORDERS__[slug] = []
  }
  if (!globalStore.__GASTRO_STATUS_OVERRIDES__) {
    globalStore.__GASTRO_STATUS_OVERRIDES__ = {}
  }

  // 1. Buscar la orden exclusivamente por su UUID orderId
  let existingOrder: Order | undefined
  for (const s of Object.keys(globalStore.__GASTRO_ORDERS__)) {
    const list = globalStore.__GASTRO_ORDERS__[s] || []
    const match = list.find(o => o.id === orderId)
    if (match) {
      existingOrder = match
      break
    }
  }

  if (!existingOrder) {
    return { orders: getServerOrders(slug), error: 'ORDER_NOT_FOUND' }
  }

  // 2. Validar transición de estado legal
  const currentStatus = globalStore.__GASTRO_STATUS_OVERRIDES__[orderId] || existingOrder.status
  if (!isValidOrderTransition(currentStatus, status)) {
    return {
      orders: getServerOrders(slug),
      error: `Transición inválida de ${currentStatus} a ${status}`,
    }
  }

  // 3. Guardar override persistente del estado de esta orden específica por su UUID
  globalStore.__GASTRO_STATUS_OVERRIDES__[orderId] = status

  // 4. Actualizar en todas las listas de memoria activas exclusivamente por UUID orderId
  let updatedTableNumber: number | string | undefined = tableNumber
  for (const s of Object.keys(globalStore.__GASTRO_ORDERS__)) {
    const list = globalStore.__GASTRO_ORDERS__[s] || []
    const idx = list.findIndex(o => o.id === orderId)
    if (idx >= 0) {
      const existing = list[idx]
      const parsedTbl = tableNumber ? parseInt(String(tableNumber), 10) : existing.table_number
      updatedTableNumber = parsedTbl
      list[idx] = {
        ...existing,
        status,
        table_number: parsedTbl,
      }
    }
  }

  // 5. Emitir evento SSE para sincronización instantánea en Mozo y Cliente
  broadcastEvent({ type: 'order_updated', slug, orderId, status, tableNumber: updatedTableNumber })
  return { orders: getServerOrders(slug) }
}

export function clearServerOrders(slug: string): void {
  if (!globalStore.__GASTRO_ORDERS__) {
    globalStore.__GASTRO_ORDERS__ = {}
  }
  globalStore.__GASTRO_ORDERS__[slug] = []

  if (!globalStore.__GASTRO_TABLE_SESSIONS__) {
    globalStore.__GASTRO_TABLE_SESSIONS__ = {}
  }
  globalStore.__GASTRO_TABLE_SESSIONS__[slug] = {}

  if (!globalStore.__GASTRO_SERVICE_CALLS__) {
    globalStore.__GASTRO_SERVICE_CALLS__ = {}
  }
  globalStore.__GASTRO_SERVICE_CALLS__[slug] = []

  broadcastEvent({ type: 'orders_cleared', slug })
}

// Helpers de Llamadas de Servicio (Mozo, Cuenta, Hielo, etc.)
export function getServerServiceCalls(slug: string): ServiceCall[] {
  return globalStore.__GASTRO_SERVICE_CALLS__?.[slug] || []
}

export function addServerServiceCall(slug: string, call: Omit<ServiceCall, 'id' | 'created_at' | 'status'>): ServiceCall {
  if (!globalStore.__GASTRO_SERVICE_CALLS__[slug]) {
    globalStore.__GASTRO_SERVICE_CALLS__[slug] = []
  }
  const newCall: ServiceCall = {
    ...call,
    id: `call-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    status: 'pending',
    created_at: new Date().toISOString(),
  }
  globalStore.__GASTRO_SERVICE_CALLS__[slug].unshift(newCall)
  broadcastEvent({ type: 'service_call', slug, call: newCall })
  return newCall
}

export function attendServerServiceCall(slug: string, callId: string): ServiceCall[] {
  const calls = globalStore.__GASTRO_SERVICE_CALLS__[slug] || []
  let attendedCall: ServiceCall | undefined
  const updated = calls.map(c => {
    if (c.id === callId) {
      attendedCall = { ...c, status: 'attended' as const }
      return attendedCall
    }
    return c
  })
  globalStore.__GASTRO_SERVICE_CALLS__[slug] = updated
  broadcastEvent({
    type: 'service_call_attended',
    slug,
    callId,
    call: attendedCall,
    table_number: attendedCall?.table_number,
    is_bill: attendedCall?.call_type.startsWith('bill_') || false,
  })

  if (attendedCall && attendedCall.call_type.startsWith('bill_')) {
    broadcastEvent({
      type: 'table_bill_paid',
      slug,
      table_number: attendedCall.table_number,
      callId,
    })
  }

  return updated
}

export function clearServerServiceCalls(slug: string): void {
  if (!globalStore.__GASTRO_SERVICE_CALLS__) {
    globalStore.__GASTRO_SERVICE_CALLS__ = {}
  }
  globalStore.__GASTRO_SERVICE_CALLS__[slug] = []
  broadcastEvent({ type: 'service_calls_cleared', slug })
}

// Rate Limiting en memoria para protección de endpoints
const rateLimitStore = new Map<string, { count: number; expiresAt: number }>()

export function checkRateLimit(key: string, maxRequests = 30, windowMs = 60000): boolean {
  const now = Date.now()
  const entry = rateLimitStore.get(key)

  if (!entry || entry.expiresAt < now) {
    rateLimitStore.set(key, { count: 1, expiresAt: now + windowMs })
    return true
  }

  if (entry.count >= maxRequests) {
    return false
  }

  entry.count++
  return true
}

// Sanitización anti-XSS y limpieza de caracteres peligrosos
export function sanitizeText(input: any, maxLength = 255): string {
  if (!input || typeof input !== 'string') return ''
  return input
    .replace(/<[^>]*>?/gm, '')
    .replace(/javascript:/gi, '')
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, maxLength)
}

// Helpers de Sesión de Mesas (Ocupada vs Libre)
export function getTableSessions(slug: string): Record<string | number, TableSession> {
  return globalStore.__GASTRO_TABLE_SESSIONS__?.[slug] || {}
}

export function getOrCreateTableSession(slug: string, tableNumber: string | number): TableSession {
  if (!globalStore.__GASTRO_TABLE_SESSIONS__) {
    globalStore.__GASTRO_TABLE_SESSIONS__ = {}
  }
  if (!globalStore.__GASTRO_TABLE_SESSIONS__[slug]) {
    globalStore.__GASTRO_TABLE_SESSIONS__[slug] = {}
  }

  let session = globalStore.__GASTRO_TABLE_SESSIONS__[slug][tableNumber]
  if (!session || session.status === 'free') {
    session = {
      table_number: tableNumber,
      status: 'busy',
      session_id: `sess-${tableNumber}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      last_updated_at: new Date().toISOString(),
    }
    globalStore.__GASTRO_TABLE_SESSIONS__[slug][tableNumber] = session
  }
  return session
}

export function validateTableSession(
  slug: string,
  tableNumber: string | number,
  clientSessionId?: string
): { valid: boolean; currentSessionId: string; reason?: string; status?: number } {
  if (!globalStore.__GASTRO_TABLE_SESSIONS__) {
    globalStore.__GASTRO_TABLE_SESSIONS__ = {}
  }
  if (!globalStore.__GASTRO_TABLE_SESSIONS__[slug]) {
    globalStore.__GASTRO_TABLE_SESSIONS__[slug] = {}
  }

  const currentSession = globalStore.__GASTRO_TABLE_SESSIONS__[slug][tableNumber]

  // Si no se proporcionó token (por ejemplo creación directa por personal)
  if (!clientSessionId) {
    return {
      valid: true,
      currentSessionId: currentSession?.session_id || '',
    }
  }

  // Si no hay sesión o la mesa está libre, rechazar token forjado/expirado
  if (!currentSession || currentSession.status === 'free') {
    return {
      valid: false,
      currentSessionId: '',
      reason: 'SESSION_EXPIRED',
      status: 403,
    }
  }

  // Si el token del cliente no coincide con la sesión activa de la mesa, rechazar
  if (currentSession.session_id !== clientSessionId) {
    return {
      valid: false,
      currentSessionId: currentSession.session_id,
      reason: 'SESSION_EXPIRED',
      status: 403,
    }
  }

  // Token válido y coincide con la sesión activa
  return {
    valid: true,
    currentSessionId: currentSession.session_id,
  }
}

export function setTableOccupied(
  slug: string,
  tableNumber: string | number,
  sessionId?: string
): TableSession {
  if (!globalStore.__GASTRO_TABLE_SESSIONS__) {
    globalStore.__GASTRO_TABLE_SESSIONS__ = {}
  }
  if (!globalStore.__GASTRO_TABLE_SESSIONS__[slug]) {
    globalStore.__GASTRO_TABLE_SESSIONS__[slug] = {}
  }
  const current = globalStore.__GASTRO_TABLE_SESSIONS__[slug][tableNumber]
  const finalSessionId =
    sessionId ||
    (current?.status === 'busy' && current?.session_id ? current.session_id : '') ||
    `sess-${tableNumber}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`

  const session: TableSession = {
    table_number: tableNumber,
    status: 'busy',
    session_id: finalSessionId,
    last_updated_at: new Date().toISOString(),
  }
  globalStore.__GASTRO_TABLE_SESSIONS__[slug][tableNumber] = session
  broadcastEvent({ type: 'table_session_updated', slug, tableNumber, session })
  return session
}

export function freeTableSession(slug: string, tableNumber: string | number): void {
  const tableNumStr = tableNumber.toString()

  // 1. Marcar órdenes activas/entregadas como 'paid' en lugar de eliminarlas para preservar historial
  const orders = globalStore.__GASTRO_ORDERS__?.[slug] || []
  orders.forEach(o => {
    const isThisTable =
      o.table_number?.toString() === tableNumStr ||
      o.table?.table_number?.toString() === tableNumStr
    if (isThisTable) {
      if (o.status !== 'cancelled') {
        o.status = 'paid'
      }
      if (globalStore.__GASTRO_STATUS_OVERRIDES__) {
        delete globalStore.__GASTRO_STATUS_OVERRIDES__[o.id]
      }
    }
  })

  // Limpiar cualquier residuo de overrides de mesa
  if (globalStore.__GASTRO_STATUS_OVERRIDES__) {
    delete globalStore.__GASTRO_STATUS_OVERRIDES__[`${slug}_table_${tableNumStr}`]
    delete globalStore.__GASTRO_STATUS_OVERRIDES__[`table_${tableNumStr}`]
    for (const k of Object.keys(globalStore.__GASTRO_STATUS_OVERRIDES__)) {
      if (k.endsWith(`_table_${tableNumStr}`) || k === `table_${tableNumStr}`) {
        delete globalStore.__GASTRO_STATUS_OVERRIDES__[k]
      }
    }
  }

  // 2. Eliminar llamadas de esta mesa específica
  const calls = globalStore.__GASTRO_SERVICE_CALLS__?.[slug] || []
  globalStore.__GASTRO_SERVICE_CALLS__[slug] = calls.filter(
    c => c.table_number?.toString() !== tableNumStr
  )

  // 3. Generar nueva sesión limpia para el siguiente cliente
  if (!globalStore.__GASTRO_TABLE_SESSIONS__) {
    globalStore.__GASTRO_TABLE_SESSIONS__ = {}
  }
  if (!globalStore.__GASTRO_TABLE_SESSIONS__[slug]) {
    globalStore.__GASTRO_TABLE_SESSIONS__[slug] = {}
  }

  const newSession: TableSession = {
    table_number: tableNumber,
    status: 'free',
    session_id: `sess-${tableNumber}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    last_updated_at: new Date().toISOString(),
  }
  globalStore.__GASTRO_TABLE_SESSIONS__[slug][tableNumber] = newSession

  // 4. Notificar a todos los dispositivos en tiempo real
  broadcastEvent({ type: 'table_freed', slug, tableNumber, new_session_id: newSession.session_id })
}

export function transferTableSession(slug: string, fromTable: string | number, toTable: string | number): void {
  // 1. Transferir órdenes
  const orders = globalStore.__GASTRO_ORDERS__?.[slug] || []
  orders.forEach(o => {
    if (o.table_number?.toString() === fromTable.toString()) {
      o.table_number = toTable
      if (o.table) o.table.table_number = parseInt(toTable.toString(), 10) || 1
    }
  })

  // 2. Transferir llamadas
  const calls = globalStore.__GASTRO_SERVICE_CALLS__?.[slug] || []
  calls.forEach(c => {
    if (c.table_number?.toString() === fromTable.toString()) {
      c.table_number = toTable
    }
  })

  // 3. Mover sesión
  if (globalStore.__GASTRO_TABLE_SESSIONS__?.[slug]) {
    const session = globalStore.__GASTRO_TABLE_SESSIONS__[slug][fromTable]
    if (session) {
      session.table_number = toTable
      session.last_updated_at = new Date().toISOString()
      globalStore.__GASTRO_TABLE_SESSIONS__[slug][toTable] = session
      delete globalStore.__GASTRO_TABLE_SESSIONS__[slug][fromTable]
    }
  }

  // 4. Notificar a todos los dispositivos en tiempo real
  broadcastEvent({ type: 'table_transferred', slug, fromTable, toTable })
}

// SSE Broadcast
export function broadcastEvent(eventData: any) {
  const payload = `data: ${JSON.stringify(eventData)}\n\n`
  globalStore.__GASTRO_SSE_CLIENTS__?.forEach(listener => {
    try {
      listener(payload)
    } catch {
      // ignore
    }
  })
}

export function registerSSEClient(listener: (data: string) => void) {
  globalStore.__GASTRO_SSE_CLIENTS__?.push(listener)
  return () => {
    if (globalStore.__GASTRO_SSE_CLIENTS__) {
      globalStore.__GASTRO_SSE_CLIENTS__ = globalStore.__GASTRO_SSE_CLIENTS__.filter(l => l !== listener)
    }
  }
}

// ==============================================================================
// ANALÍTICAS COOKIELESS (100% RGPD COMPLIANT)
// Registra métricas agregadas y anónimas de visualizaciones y pedidos en mesa
// ==============================================================================

export interface AnalyticsEvent {
  id: string
  slug: string
  type: 'page_view' | 'product_view' | 'service_call' | 'order_placed'
  table_number?: number | string
  product_id?: string
  timestamp: string
}

export function recordAnalyticsEvent(
  slug: string,
  event: Omit<AnalyticsEvent, 'id' | 'timestamp'>
): AnalyticsEvent {
  if (!globalStore.__GASTRO_ANALYTICS__) {
    globalStore.__GASTRO_ANALYTICS__ = {}
  }
  if (!globalStore.__GASTRO_ANALYTICS__[slug]) {
    globalStore.__GASTRO_ANALYTICS__[slug] = []
  }
  const fullEvent: AnalyticsEvent = {
    ...event,
    id: `ev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
  }
  globalStore.__GASTRO_ANALYTICS__[slug].unshift(fullEvent)
  if (globalStore.__GASTRO_ANALYTICS__[slug].length > 1000) {
    globalStore.__GASTRO_ANALYTICS__[slug].pop()
  }
  return fullEvent
}

export function getAnalyticsSummary(slug: string) {
  const events = globalStore.__GASTRO_ANALYTICS__?.[slug] || []
  const totalPageViews = events.filter(e => e.type === 'page_view').length
  const totalOrders = events.filter(e => e.type === 'order_placed').length
  const totalServiceCalls = events.filter(e => e.type === 'service_call').length

  const productCounts: Record<string, number> = {}
  events
    .filter(e => e.type === 'product_view' && e.product_id)
    .forEach(e => {
      if (e.product_id) {
        productCounts[e.product_id] = (productCounts[e.product_id] || 0) + 1
      }
    })

  return {
    slug,
    totalPageViews,
    totalOrders,
    totalServiceCalls,
    popularProducts: productCounts,
    recentEventsCount: events.length,
  }
}

// ==============================================================================
// GESTIÓN DINÁMICA DE CARTA (CATEGORÍAS Y PRODUCTOS EN MEMORIA & SYNC)
// ==============================================================================

export function getServerCategories(slug: string): Category[] {
  if (!globalStore.__GASTRO_CATEGORIES__?.[slug]) {
    if (!globalStore.__GASTRO_CATEGORIES__) globalStore.__GASTRO_CATEGORIES__ = {}
    globalStore.__GASTRO_CATEGORIES__[slug] = [...(MOCK_CATEGORIES[slug] || MOCK_CATEGORIES['burger-gourmet'] || [])]
  }
  return globalStore.__GASTRO_CATEGORIES__[slug]
}

export function setServerCategories(slug: string, categories: Category[]): void {
  if (!globalStore.__GASTRO_CATEGORIES__) globalStore.__GASTRO_CATEGORIES__ = {}
  globalStore.__GASTRO_CATEGORIES__[slug] = categories
  broadcastEvent({ type: 'menu_updated', slug })
}

export function upsertServerCategory(slug: string, category: Category): Category {
  const current = getServerCategories(slug)
  const idx = current.findIndex(c => c.id === category.id)
  let updated: Category[]
  if (idx >= 0) {
    updated = current.map(c => (c.id === category.id ? { ...c, ...category } : c))
  } else {
    updated = [...current, category]
  }
  setServerCategories(slug, updated)
  return category
}

export function deleteServerCategory(slug: string, categoryId: string): void {
  const current = getServerCategories(slug)
  setServerCategories(slug, current.filter(c => c.id !== categoryId))
}

export function getServerProducts(slug: string): Product[] {
  if (!globalStore.__GASTRO_PRODUCTS__?.[slug]) {
    if (!globalStore.__GASTRO_PRODUCTS__) globalStore.__GASTRO_PRODUCTS__ = {}
    globalStore.__GASTRO_PRODUCTS__[slug] = [...(MOCK_PRODUCTS[slug] || MOCK_PRODUCTS['burger-gourmet'] || [])]
  }
  return globalStore.__GASTRO_PRODUCTS__[slug]
}

export function setServerProducts(slug: string, products: Product[]): void {
  if (!globalStore.__GASTRO_PRODUCTS__) globalStore.__GASTRO_PRODUCTS__ = {}
  globalStore.__GASTRO_PRODUCTS__[slug] = products
  broadcastEvent({ type: 'menu_updated', slug })
}

export function upsertServerProduct(slug: string, product: Product): Product {
  const current = getServerProducts(slug)
  const idx = current.findIndex(p => p.id === product.id)
  let updated: Product[]
  if (idx >= 0) {
    updated = current.map(p => (p.id === product.id ? { ...p, ...product } : p))
  } else {
    updated = [product, ...current]
  }
  setServerProducts(slug, updated)
  return product
}

export function toggleProductAvailability(slug: string, productId: string): boolean {
  const current = getServerProducts(slug)
  let nextState = true
  const updated = current.map(p => {
    if (p.id === productId) {
      const isAvailable = p.is_available !== false
      nextState = !isAvailable
      return { ...p, is_available: nextState }
    }
    return p
  })
  setServerProducts(slug, updated)
  return nextState
}

export function deleteServerProduct(slug: string, productId: string): void {
  const current = getServerProducts(slug)
  setServerProducts(slug, current.filter(p => p.id !== productId))
}


