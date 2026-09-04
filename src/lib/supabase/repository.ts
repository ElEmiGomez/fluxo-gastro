// ==============================================================================
// FLUXO - CAPA DE REPOSITORIO B2B SUPABASE (POSTGRESQL)
// ==============================================================================

import { createServerClient } from './server'
import { isSupabaseConfigured } from './client'
import {
  MOCK_RESTAURANTS,
  MOCK_PRODUCTS,
} from './mock-fallback'
import {
  Order,
  OrderItem,
  OrderStatus,
  ServiceCall,
  TableSession,
  Restaurant,
} from '@/types/database.types'
import {
  broadcastEvent,
  getServerOrders,
  addServerOrder,
  updateServerOrderStatus,
  getServerServiceCalls,
  addServerServiceCall,
  attendServerServiceCall,
  getTableSessions,
  setTableOccupied,
  freeTableSession as memoryFreeTableSession,
  getOrCreateTableSession as memoryGetOrCreateSession,
  validateTableSession as memoryValidateSession,
  isValidOrderTransition,
} from '@/lib/server-state'

/**
 * Obtiene los datos del restaurante a partir del slug
 */
export async function getRestaurantBySlug(slug: string): Promise<Restaurant | null> {
  const supabase = createServerClient()
  if (supabase && isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('slug', slug)
        .single()
      if (!error && data) return data as Restaurant
    } catch (e) {
      console.warn('Error fetching restaurant from Supabase, using mock:', e)
    }
  }
  return MOCK_RESTAURANTS[slug] || MOCK_RESTAURANTS['burger-gourmet'] || null
}

export function getTargetRestaurantId(restaurantId?: string, slug?: string): string {
  if (!restaurantId || restaurantId === 'a1111111-1111-1111-1111-111111111111') {
    if (!slug || slug === 'burger-gourmet') {
      return 'a0000000-0000-0000-0000-000000000001'
    }
  }
  return restaurantId || 'a0000000-0000-0000-0000-000000000001'
}

/**
 * 1. SEGURIDAD DE SESIÓN: Iniciar u obtener sesión activa con UUID por visita
 */
export async function createOrGetActiveSession(
  restaurantId: string,
  slug: string,
  tableNumber: number
): Promise<TableSession> {
  const targetRestaurantId = getTargetRestaurantId(restaurantId, slug)
  const supabase = createServerClient()
  if (supabase && isSupabaseConfigured()) {
    try {
      // Buscar sesión activa existente
      const { data: existing, error: searchErr } = await supabase
        .from('table_sessions')
        .select('*')
        .eq('restaurant_id', targetRestaurantId)
        .eq('table_number', tableNumber)
        .eq('status', 'active')
        .maybeSingle()

      if (!searchErr && existing) {
        setTableOccupied(slug, tableNumber, existing.session_token)
        return existing as TableSession
      }

      // Si no existe, crear nueva sesión con UUID
      const { data: newSession, error: createErr } = await supabase
        .from('table_sessions')
        .insert({
          restaurant_id: targetRestaurantId,
          table_number: tableNumber,
          status: 'active',
        })
        .select('*')
        .single()

      if (!createErr && newSession) {
        setTableOccupied(slug, tableNumber, newSession.session_token)
        broadcastEvent({
          type: 'table_session_updated',
          slug,
          tableNumber,
          session: newSession,
        })
        return newSession as TableSession
      }
    } catch (e) {
      console.warn('Error with Supabase table_sessions, falling back to memory:', e)
    }
  }

  // Fallback en memoria resiliente con UUID v4
  const session = memoryGetOrCreateSession(slug, tableNumber)
  return {
    ...session,
    session_token: session.session_id,
    restaurant_id: restaurantId,
    status: 'active',
  }
}

/**
 * 2. SEGURIDAD DE SESIÓN: Validar token UUID de comensal
 */
export async function validateSessionToken(
  restaurantId: string,
  slug: string,
  tableNumber: number,
  sessionToken?: string
): Promise<{ valid: boolean; session?: TableSession; reason?: string; status?: number }> {
  if (!sessionToken) {
    return { valid: true, session: { table_number: tableNumber, session_token: `sess-${tableNumber}-${Date.now()}`, status: 'active' } }
  }

  const targetRestaurantId = getTargetRestaurantId(restaurantId, slug)
  const supabase = createServerClient()
  if (supabase && isSupabaseConfigured()) {
    try {
      const { data: session, error } = await supabase
        .from('table_sessions')
        .select('*')
        .eq('restaurant_id', targetRestaurantId)
        .eq('table_number', tableNumber)
        .eq('session_token', sessionToken)
        .maybeSingle()

      if (session) {
        if (session.status !== 'active') {
          return { valid: false, reason: 'SESSION_EXPIRED', status: 403 }
        }
        setTableOccupied(slug, tableNumber, session.session_token)
        return { valid: true, session: session as TableSession }
      }

      // Si no se encontró en Supabase pero existe en memoria activa
      const memCheck = memoryValidateSession(slug, tableNumber, sessionToken)
      if (memCheck.valid) {
        return {
          valid: true,
          session: {
            table_number: tableNumber,
            session_token: memCheck.currentSessionId,
            status: 'active',
          },
        }
      }

      return { valid: false, reason: 'SESSION_EXPIRED', status: 403 }
    } catch (e) {
      console.warn('Error validating session in Supabase:', e)
    }
  }

  // Validación en memoria
  const memCheck = memoryValidateSession(slug, tableNumber, sessionToken)
  if (!memCheck.valid) {
    return { valid: false, reason: memCheck.reason || 'SESSION_EXPIRED', status: memCheck.status || 403 }
  }
  return {
    valid: true,
    session: {
      table_number: tableNumber,
      session_token: memCheck.currentSessionId,
      status: 'active',
    },
  }
}

/**
 * 3. SEGURIDAD DE SESIÓN: Cerrar e invalidar sesión de mesa (Liberar Mesa)
 */
export async function closeTableSession(
  restaurantId: string,
  slug: string,
  tableNumber: number
): Promise<void> {
  const targetRestaurantId = getTargetRestaurantId(restaurantId, slug)
  const supabase = createServerClient()
  if (supabase && isSupabaseConfigured()) {
    try {
      // Invocación a función SQL atómica o update directo
      await supabase
        .from('table_sessions')
        .update({ status: 'closed', closed_at: new Date().toISOString() })
        .eq('restaurant_id', targetRestaurantId)
        .eq('table_number', tableNumber)
        .eq('status', 'active')

      // Marcar órdenes no canceladas de esta mesa como paid en Supabase para preservar el historial
      await supabase
        .from('orders')
        .update({ status: 'paid' })
        .eq('restaurant_id', targetRestaurantId)
        .eq('table_number', tableNumber)
        .neq('status', 'cancelled')

      // Marcar llamadas pendientes como atendidas
      await supabase
        .from('service_calls')
        .update({ status: 'attended' })
        .eq('restaurant_id', targetRestaurantId)
        .eq('table_number', tableNumber)
        .eq('status', 'pending')
    } catch (e) {
      console.warn('Error closing session in Supabase:', e)
    }
  }

  // Sincronizar en memoria y emitir evento SSE
  memoryFreeTableSession(slug, tableNumber)
}

/**
 * 4. COMANDAS: Crear pedido asociado a la sesión de mesa
 */
export async function createOrder(
  restaurantId: string,
  slug: string,
  orderData: {
    table_number: number
    session_token?: string
    table_session_id?: string
    idempotency_key?: string
    status?: OrderStatus
    total_amount: number
    items: Array<{
      product_id: string
      quantity: number
      notes?: string | null
      product?: any
    }>
  }
): Promise<Order> {
  const targetRestaurantId = getTargetRestaurantId(restaurantId, slug)
  const initialStatus: OrderStatus = orderData.status || 'pending_validation'
  const supabase = createServerClient()
  const effectiveSessionToken = orderData.session_token || orderData.table_session_id || null

  if (supabase && isSupabaseConfigured()) {
    try {
      // Resolver id primario de table_sessions para no violar orders_table_session_id_fkey
      let resolvedTableSessionId: string | null = null
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

      if (orderData.table_session_id && uuidRegex.test(orderData.table_session_id)) {
        const { data: directCheck } = await supabase
          .from('table_sessions')
          .select('id')
          .eq('id', orderData.table_session_id)
          .maybeSingle()
        if (directCheck) resolvedTableSessionId = directCheck.id
      }

      if (!resolvedTableSessionId && effectiveSessionToken && uuidRegex.test(effectiveSessionToken)) {
        const { data: sessRow } = await supabase
          .from('table_sessions')
          .select('id')
          .eq('session_token', effectiveSessionToken)
          .maybeSingle()
        if (sessRow) resolvedTableSessionId = sessRow.id
      }

      // 1. Invocación atómica en PostgreSQL (Arbitraje a nivel de cerrojo de fila, cero TOCTOU)
      if (orderData.idempotency_key) {
        const { data: atomicResult, error: rpcErr } = await supabase.rpc('create_order_atomic', {
          p_restaurant_id: targetRestaurantId,
          p_table_session_id: resolvedTableSessionId,
          p_table_number: orderData.table_number,
          p_total_amount: orderData.total_amount,
          p_idempotency_key: orderData.idempotency_key,
          p_items: orderData.items,
        })

        if (!rpcErr && atomicResult && atomicResult.order) {
          if (initialStatus && atomicResult.order.status !== initialStatus) {
            await supabase.from('orders').update({ status: initialStatus }).eq('id', atomicResult.order.id)
            atomicResult.order.status = initialStatus
          }
          const fullOrder: Order = {
            ...atomicResult.order,
            status: initialStatus || atomicResult.order.status,
            session_token: effectiveSessionToken || (atomicResult.order as any).session_token,
            order_items: (orderData.items || []).map((it: any) => ({
              ...it,
              product: it.product || it.products,
              course: it.course || 'first',
            })) as any,
            table_number: orderData.table_number,
          }
          addServerOrder(slug, fullOrder)
          return fullOrder
        }
      }

      // 2. Inserción con o sin Idempotencia en Supabase
      const insertQuery = orderData.idempotency_key
        ? supabase.from('orders').upsert(
            {
              restaurant_id: targetRestaurantId,
              table_session_id: resolvedTableSessionId,
              session_token: effectiveSessionToken,
              table_number: orderData.table_number,
              total_amount: orderData.total_amount,
              status: initialStatus,
              idempotency_key: orderData.idempotency_key,
            },
            { onConflict: 'idempotency_key', ignoreDuplicates: true }
          )
        : supabase.from('orders').insert({
            restaurant_id: targetRestaurantId,
            table_session_id: resolvedTableSessionId,
            session_token: effectiveSessionToken,
            table_number: orderData.table_number,
            total_amount: orderData.total_amount,
            status: initialStatus,
          })

      const { data: newOrder, error: orderErr } = await insertQuery.select('*').single()

      if (!orderErr && newOrder) {
        // Insertar items solo si es una orden nueva y product_id es UUID válido
        const itemsToInsert = orderData.items
          .filter(it => uuidRegex.test(it.product_id))
          .map(it => ({
            order_id: newOrder.id,
            product_id: it.product_id,
            quantity: it.quantity,
            notes: it.notes || null,
          }))

        if (itemsToInsert.length > 0) {
          await supabase.from('order_items').insert(itemsToInsert)
        }

        const fullOrder: Order = {
          ...newOrder,
          session_token: effectiveSessionToken || (newOrder as any).session_token,
          order_items: (orderData.items || []).map((it: any) => ({
            ...it,
            product: it.product || it.products,
            course: it.course || 'first',
          })) as any,
          table_number: orderData.table_number,
        }

        addServerOrder(slug, fullOrder)
        return fullOrder
      }
    } catch (e) {
      console.warn('Error creating order in Supabase:', e)
    }
  }

  // Fallback en memoria
  const orderId = `ord-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
  const fallbackOrder: Order = {
    id: orderId,
    restaurant_id: restaurantId,
    table_id: `table-${orderData.table_number}`,
    table_number: orderData.table_number,
    session_token: orderData.session_token,
    status: initialStatus,
    total_amount: orderData.total_amount,
    created_at: new Date().toISOString(),
    order_items: orderData.items.map((it, idx) => ({
      id: `oi-${Date.now()}-${idx}`,
      order_id: orderId,
      product_id: it.product_id,
      quantity: it.quantity,
      notes: it.notes || null,
      product: it.product,
    })),
  }

  addServerOrder(slug, fallbackOrder)
  return fallbackOrder
}

/**
 * 5. COMANDAS: Obtener órdenes del restaurante (SSOT PostgreSQL)
 */
export async function getRestaurantOrders(restaurantId: string, slug: string): Promise<Order[]> {
  const supabase = createServerClient()
  if (supabase && isSupabaseConfigured()) {
    try {
      const targetRestaurantId = getTargetRestaurantId(restaurantId, slug)

      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            product_id,
            quantity,
            notes,
            products (*)
          )
        `)
        .eq('restaurant_id', targetRestaurantId)
        .order('created_at', { ascending: false })

      if (!error && data) {
        const memOrders = getServerOrders(slug)
        return (data as unknown as any[]).map(o => {
          const tableNum = o.table_number || (o.table ? o.table.table_number : 1)
          const token = o.session_token || o.table_session_id
          const normalizedItems = (o.order_items || []).map((it: any) => ({
            ...it,
            product: it.product || it.products,
            course: it.course || 'first',
          }))
          const mem = memOrders.find(m => m.id === o.id)
          const resolvedVersion = (o.version !== undefined && o.version !== null)
            ? o.version
            : (mem?.version ?? 1)

          return {
            ...o,
            version: resolvedVersion,
            order_items: normalizedItems,
            status: o.status,
            table_number: tableNum,
            session_token: token,
          } as Order
        })
      }
    } catch (e) {
      console.warn('Error fetching orders from Supabase:', e)
    }
  }

  return getServerOrders(slug)
}

/**
 * 5.1 COMANDAS: Obtener órdenes activas de una mesa específica (Safari ITP Restore)
 */
export async function getActiveOrdersByTable(
  restaurantId: string,
  slug: string,
  tableNumber: number
): Promise<Order[]> {
  const allOrders = await getRestaurantOrders(restaurantId, slug)
  return allOrders.filter(
    o => o.table_number?.toString() === tableNumber.toString() &&
         ['pending_validation', 'pending', 'confirmed', 'preparing', 'ready', 'delivered'].includes(o.status)
  )
}

export interface TransitionOrderParams {
  orderId: string
  restaurantId?: string
  slug: string
  nextStatus: OrderStatus
  expectedVersion?: number
  actorType?: string
  actorId?: string
  tableNumber?: number | string
}

export interface TransitionOrderResult {
  success: boolean
  code: string
  message?: string
  order?: Order
  version?: number
  current_version?: number
  current_status?: OrderStatus
  previous_status?: OrderStatus
  new_status?: OrderStatus
  error?: string
}

/**
 * 6. COMANDAS: Transición atómica de estado con OCC vía transition_order RPC (Milestone 1)
 */
export async function transitionOrderStatus(
  params: TransitionOrderParams
): Promise<TransitionOrderResult> {
  const {
    orderId,
    restaurantId,
    slug,
    nextStatus,
    expectedVersion,
    actorType = 'waiter',
    actorId,
    tableNumber,
  } = params

  const supabase = createServerClient()
  const hasSupabase = supabase && isSupabaseConfigured()

  if (hasSupabase) {
    try {
      const targetRestaurantId = getTargetRestaurantId(restaurantId, slug)

      const { data, error } = await supabase.rpc('transition_order', {
        p_order_id: orderId,
        p_restaurant_id: targetRestaurantId,
        p_next_status: nextStatus,
        p_expected_version: expectedVersion ?? null,
        p_actor_type: actorType,
        p_actor_id: actorId ?? null,
      })

      if (!error && data) {
        if (data.success) {
          const parsedOrder: Order | undefined = data.order ? {
            ...data.order,
            order_items: (data.order.order_items || []).map((it: any) => ({
              ...it,
              product: it.product || it.products,
              course: it.course || 'first',
            })),
          } : undefined

          broadcastEvent({
            type: 'order_updated',
            slug,
            orderId,
            status: nextStatus,
            tableNumber: parsedOrder?.table_number || tableNumber,
            order: parsedOrder,
          })

          return {
            success: true,
            code: data.code || 'TRANSITION_APPLIED',
            message: data.message || `Orden ${orderId} actualizada a ${nextStatus}`,
            order: parsedOrder,
            version: data.version,
            previous_status: data.previous_status,
            new_status: data.new_status,
          }
        } else {
          return {
            success: false,
            code: data.code || 'TRANSITION_INVALID',
            message: data.message,
            error: data.message,
            current_version: data.current_version,
            current_status: data.current_status,
          }
        }
      }

      if (error && error.code === 'PGRST202') {
        console.warn('[transitionOrderStatus] transition_order RPC not found in schema cache. Falling back to offline/memory state machine with Supabase sync.')
      } else if (error) {
        console.warn('[transitionOrderStatus] Supabase RPC error:', error)
      }
    } catch (e: any) {
      console.warn('[transitionOrderStatus] Exception calling transition_order RPC:', e?.message || e)
    }
  }

  // 2. Fallback de máquina de estados en servidor (memoria + persistencia directa en Supabase)
  let memResult = updateServerOrderStatus(slug, orderId, nextStatus, tableNumber, expectedVersion)

  // Si no se encontró en memoria pero Supabase está configurado, intentar buscar en Supabase
  if (memResult.error === 'ORDER_NOT_FOUND' && hasSupabase) {
    try {
      const { data: supaOrder, error: supaErr } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            product_id,
            quantity,
            notes,
            products (*)
          )
        `)
        .eq('id', orderId)
        .maybeSingle()

      if (!supaErr && supaOrder) {
        const orderToHydrate: Order = {
          ...supaOrder,
          version: supaOrder.version || 1,
          order_items: (supaOrder.order_items || []).map((it: any) => ({
            ...it,
            product: it.product || it.products,
            course: it.course || 'first',
          })),
        }
        addServerOrder(slug, orderToHydrate)
        memResult = updateServerOrderStatus(slug, orderId, nextStatus, tableNumber, expectedVersion)
      }
    } catch (fetchErr) {
      console.warn('[transitionOrderStatus] Error recovering order from Supabase:', fetchErr)
    }
  }

  if (memResult.error) {
    return {
      success: false,
      code: memResult.code || (memResult.error === 'ORDER_NOT_FOUND' ? 'ORDER_NOT_FOUND' : 'TRANSITION_INVALID'),
      message: memResult.error,
      error: memResult.error,
      current_version: memResult.current_version,
      current_status: memResult.current_status,
    }
  }

  // Si la transición fue válida y Supabase está configurado, persistir en PostgreSQL
  if (hasSupabase) {
    try {
      const { error: updErr } = await supabase
        .from('orders')
        .update({
          status: nextStatus,
          version: memResult.version,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId)

      if (updErr && updErr.code === 'PGRST204') {
        // En caso de que version y/o updated_at aún no existan en Supabase remoto
        await supabase
          .from('orders')
          .update({ status: nextStatus })
          .eq('id', orderId)
      }
    } catch (syncErr) {
      console.warn('[transitionOrderStatus] Error persisting fallback transition to Supabase:', syncErr)
    }
  }

  return {
    success: true,
    code: memResult.code || 'TRANSITION_APPLIED',
    message: `Orden ${orderId} actualizada a ${nextStatus}`,
    order: memResult.order,
    version: memResult.version || memResult.order?.version || 1,
    current_status: memResult.order?.status,
  }
}

/**
 * 6.1 Wrapper de compatibilidad hacia atrás para updateOrderStatus
 */
export async function updateOrderStatus(
  slug: string,
  orderId: string,
  status: OrderStatus,
  tableNumber?: number | string
): Promise<{ success: boolean; error?: string; order?: Order; code?: string; version?: number }> {
  const res = await transitionOrderStatus({
    slug,
    orderId,
    nextStatus: status,
    tableNumber,
  })
  return {
    success: res.success,
    error: res.error || res.message,
    order: res.order,
    code: res.code,
    version: res.version,
  }
}

/**
 * 7. LLAMADAS DE SERVICIO: Crear llamada (mozo, cuenta, etc.)
 */
export async function createServiceCall(
  restaurantId: string,
  slug: string,
  callData: {
    table_number: number
    call_type: string
    table_session_id?: string
  }
): Promise<ServiceCall> {
  const supabase = createServerClient()
  if (supabase && isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('service_calls')
        .insert({
          restaurant_id: restaurantId,
          table_session_id: callData.table_session_id || null,
          table_number: callData.table_number,
          call_type: callData.call_type,
          status: 'pending',
        })
        .select('*')
        .single()

      if (!error && data) {
        addServerServiceCall(slug, data)
        return data as ServiceCall
      }
    } catch (e) {
      console.warn('Error creating service call in Supabase:', e)
    }
  }

  return addServerServiceCall(slug, {
    restaurant_slug: slug,
    table_number: callData.table_number,
    call_type: callData.call_type,
  })
}

/**
 * 7.1 LLAMADAS DE SERVICIO: Obtener llamadas activas del restaurante (Supabase + Memoria Reconciliada)
 */
export async function getRestaurantServiceCalls(restaurantId: string, slug: string): Promise<ServiceCall[]> {
  const memCalls = getServerServiceCalls(slug).filter(c => c.status === 'pending')
  const supabase = createServerClient()
  if (supabase && isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('service_calls')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (!error && data) {
        // Reconciliar con memoria para no perder llamadas recientes entre lambdas de Vercel
        const map = new Map<string, ServiceCall>()
        memCalls.forEach(c => map.set(c.id, c))
        ;(data as ServiceCall[]).forEach(c => map.set(c.id, c))
        return Array.from(map.values())
      }
    } catch (e) {
      console.warn('Error fetching service calls from Supabase:', e)
    }
  }

  return memCalls
}

/**
 * 8. LLAMADAS DE SERVICIO: Atender llamada
 */
export async function attendServiceCall(
  slug: string,
  callId: string
): Promise<void> {
  const supabase = createServerClient()
  if (supabase && isSupabaseConfigured()) {
    try {
      await supabase
        .from('service_calls')
        .update({ status: 'attended' })
        .eq('id', callId)
    } catch (e) {
      console.warn('Error attending service call in Supabase:', e)
    }
  }

  attendServerServiceCall(slug, callId)
}
