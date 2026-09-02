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

// Estado global en memoria de Node.js (persiste durante la ejecución del servidor)
interface GlobalStoreState {
  __GASTRO_ORDERS__: Record<string, Order[]>
  __GASTRO_SERVICE_CALLS__: Record<string, ServiceCall[]>
  __GASTRO_TABLE_SESSIONS__: Record<string, Record<string | number, TableSession>>
  __GASTRO_ANALYTICS__: Record<string, AnalyticsEvent[]>
  __GASTRO_CATEGORIES__: Record<string, Category[]>
  __GASTRO_PRODUCTS__: Record<string, Product[]>
  __GASTRO_SSE_CLIENTS__: Array<(data: string) => void>
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

const globalStore = g as GlobalStoreState

// ==============================================================================
// GESTOR DE IDEMPOTENCIA (Anti-Duplicación de Comandas por Doble Clic o Mala Conexión)
// ==============================================================================
const idempotencyStore = new Map<string, { order: Order; expiresAt: number }>()

export function getIdempotentOrder(key: string): Order | null {
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
  delivered: ['cancelled'],
  cancelled: [],
}

export function isValidOrderTransition(currentStatus: string, nextStatus: string): boolean {
  if (currentStatus === nextStatus) return true
  const allowed = VALID_ORDER_TRANSITIONS[currentStatus] || []
  return allowed.includes(nextStatus)
}

// Helpers de Órdenes
export function getServerOrders(slug: string): Order[] {
  return globalStore.__GASTRO_ORDERS__?.[slug] || []
}

export function addServerOrder(slug: string, order: Order): Order {
  if (!globalStore.__GASTRO_ORDERS__) {
    globalStore.__GASTRO_ORDERS__ = {}
  }
  if (!globalStore.__GASTRO_ORDERS__[slug]) {
    globalStore.__GASTRO_ORDERS__[slug] = []
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
  status: OrderStatus
): { orders: Order[]; error?: string } {
  if (!globalStore.__GASTRO_ORDERS__) {
    globalStore.__GASTRO_ORDERS__ = {}
  }
  if (!globalStore.__GASTRO_ORDERS__[slug]) {
    globalStore.__GASTRO_ORDERS__[slug] = []
  }

  let found = false
  for (const s of Object.keys(globalStore.__GASTRO_ORDERS__)) {
    const list = globalStore.__GASTRO_ORDERS__[s] || []
    const idx = list.findIndex(o => o.id === orderId)
    if (idx >= 0) {
      list[idx] = { ...list[idx], status }
      found = true
    }
  }

  broadcastEvent({ type: 'order_updated', slug, orderId, status })
  return { orders: globalStore.__GASTRO_ORDERS__[slug] || [] }
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
  if (!session) {
    session = {
      table_number: tableNumber,
      status: 'free',
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
): { valid: boolean; currentSessionId: string; reason?: string } {
  if (!globalStore.__GASTRO_TABLE_SESSIONS__) {
    globalStore.__GASTRO_TABLE_SESSIONS__ = {}
  }
  if (!globalStore.__GASTRO_TABLE_SESSIONS__[slug]) {
    globalStore.__GASTRO_TABLE_SESSIONS__[slug] = {}
  }

  let currentSession = globalStore.__GASTRO_TABLE_SESSIONS__[slug][tableNumber]

  // Si no hay sesión o la mesa estaba libre, adoptamos la sesión del comensal
  if (!currentSession || currentSession.status === 'free') {
    currentSession = {
      table_number: tableNumber,
      status: 'busy',
      session_id: clientSessionId || `sess-${tableNumber}-${Date.now()}`,
      last_updated_at: new Date().toISOString(),
    }
    globalStore.__GASTRO_TABLE_SESSIONS__[slug][tableNumber] = currentSession
    return {
      valid: true,
      currentSessionId: currentSession.session_id,
    }
  }

  // Si la mesa ya tiene una sesión activa con comensales, permitimos agregar platos a la misma mesa
  return {
    valid: true,
    currentSessionId: currentSession.session_id,
  }
}

export function setTableOccupied(slug: string, tableNumber: string | number): TableSession {
  if (!globalStore.__GASTRO_TABLE_SESSIONS__[slug]) {
    globalStore.__GASTRO_TABLE_SESSIONS__[slug] = {}
  }
  const current = globalStore.__GASTRO_TABLE_SESSIONS__[slug][tableNumber]
  const session: TableSession = {
    table_number: tableNumber,
    status: 'busy',
    session_id: current?.session_id || `sess-${tableNumber}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    last_updated_at: new Date().toISOString(),
  }
  globalStore.__GASTRO_TABLE_SESSIONS__[slug][tableNumber] = session
  broadcastEvent({ type: 'table_session_updated', slug, tableNumber, session })
  return session
}

export function freeTableSession(slug: string, tableNumber: string | number): void {
  // 1. Eliminar órdenes de esta mesa específica
  const orders = globalStore.__GASTRO_ORDERS__?.[slug] || []
  globalStore.__GASTRO_ORDERS__[slug] = orders.filter(
    o => o.table_number?.toString() !== tableNumber.toString() && o.table?.table_number?.toString() !== tableNumber.toString()
  )

  // 2. Eliminar llamadas de esta mesa específica
  const calls = globalStore.__GASTRO_SERVICE_CALLS__?.[slug] || []
  globalStore.__GASTRO_SERVICE_CALLS__[slug] = calls.filter(
    c => c.table_number?.toString() !== tableNumber.toString()
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


