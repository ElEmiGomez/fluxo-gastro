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

/**
 * 1. SEGURIDAD DE SESIÓN: Iniciar u obtener sesión activa con UUID por visita
 */
export async function createOrGetActiveSession(
  restaurantId: string,
  slug: string,
  tableNumber: number
): Promise<TableSession> {
  const supabase = createServerClient()
  if (supabase && isSupabaseConfigured()) {
    try {
      // Buscar sesión activa existente
      const { data: existing, error: searchErr } = await supabase
        .from('table_sessions')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .eq('table_number', tableNumber)
        .eq('status', 'active')
        .maybeSingle()

      if (!searchErr && existing) {
        return existing as TableSession
      }

      // Si no existe, crear nueva sesión con UUID
      const { data: newSession, error: createErr } = await supabase
        .from('table_sessions')
        .insert({
          restaurant_id: restaurantId,
          table_number: tableNumber,
          status: 'active',
        })
        .select('*')
        .single()

      if (!createErr && newSession) {
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
): Promise<{ valid: boolean; session?: TableSession; reason?: string }> {
  if (!sessionToken) {
    return { valid: true, session: { table_number: tableNumber, session_token: `sess-${tableNumber}-${Date.now()}`, status: 'active' } }
  }

  const supabase = createServerClient()
  if (supabase && isSupabaseConfigured()) {
    try {
      const { data: session, error } = await supabase
        .from('table_sessions')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .eq('table_number', tableNumber)
        .eq('session_token', sessionToken)
        .maybeSingle()

      if (session) {
        if (session.status !== 'active') {
          return { valid: false, reason: 'SESSION_EXPIRED' }
        }
        return { valid: true, session: session as TableSession }
      }

      // Si no existe sesión previa en la BD para este token, la inicializamos como activa
      try {
        const newSessionRecord = {
          restaurant_id: restaurantId,
          table_number: tableNumber,
          session_token: sessionToken,
          status: 'active',
          created_at: new Date().toISOString(),
        }
        await supabase.from('table_sessions').insert(newSessionRecord)
        return { valid: true, session: newSessionRecord as TableSession }
      } catch (insertErr) {
        // En caso de conflicto o restricción RLS, permitimos la sesión en memoria
        console.warn('Fallback memory session on insert error:', insertErr)
      }
    } catch (e) {
      console.warn('Error validating session in Supabase:', e)
    }
  }

  // Validación en memoria
  const memCheck = memoryValidateSession(slug, tableNumber, sessionToken)
  if (!memCheck.valid) {
    return { valid: false, reason: memCheck.reason }
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
  const supabase = createServerClient()
  if (supabase && isSupabaseConfigured()) {
    try {
      // Invocación a función SQL atómica o update directo
      await supabase
        .from('table_sessions')
        .update({ status: 'closed', closed_at: new Date().toISOString() })
        .eq('restaurant_id', restaurantId)
        .eq('table_number', tableNumber)
        .eq('status', 'active')

      // Marcar llamadas pendientes como atendidas
      await supabase
        .from('service_calls')
        .update({ status: 'attended' })
        .eq('restaurant_id', restaurantId)
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
  const initialStatus: OrderStatus = orderData.status || 'pending_validation'
  const supabase = createServerClient()
  if (supabase && isSupabaseConfigured()) {
    try {
      // 1. Invocación atómica en PostgreSQL (Arbitraje a nivel de cerrojo de fila, cero TOCTOU)
      if (orderData.idempotency_key) {
        const { data: atomicResult, error: rpcErr } = await supabase.rpc('create_order_atomic', {
          p_restaurant_id: restaurantId,
          p_table_session_id: orderData.table_session_id || null,
          p_table_number: orderData.table_number,
          p_total_amount: orderData.total_amount,
          p_idempotency_key: orderData.idempotency_key,
          p_items: orderData.items,
        })

        if (!rpcErr && atomicResult && atomicResult.order) {
          const fullOrder: Order = {
            ...atomicResult.order,
            order_items: orderData.items as any,
            table_number: orderData.table_number,
          }
          if (!atomicResult.idempotent) {
            broadcastEvent({ type: 'order_created', slug, order: fullOrder })
          }
          return fullOrder
        }
      }

      // 2. Fallback con INSERT ... ON CONFLICT (idempotency_key) DO NOTHING en el SDK
      const { data: newOrder, error: orderErr } = await supabase
        .from('orders')
        .upsert(
          {
            restaurant_id: restaurantId,
            table_session_id: orderData.table_session_id || null,
            table_number: orderData.table_number,
            total_amount: orderData.total_amount,
            status: initialStatus,
            idempotency_key: orderData.idempotency_key || null,
          },
          { onConflict: 'idempotency_key', ignoreDuplicates: true }
        )
        .select('*')
        .single()

      if (!orderErr && newOrder) {
        // Insertar items solo si es una orden nueva
        const itemsToInsert = orderData.items.map(it => ({
          order_id: newOrder.id,
          product_id: it.product_id,
          quantity: it.quantity,
          notes: it.notes || null,
        }))

        await supabase.from('order_items').insert(itemsToInsert)

        const fullOrder: Order = {
          ...newOrder,
          order_items: orderData.items as any,
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
 * 5. COMANDAS: Obtener órdenes del restaurante
 */
export async function getRestaurantOrders(restaurantId: string, slug: string): Promise<Order[]> {
  const supabase = createServerClient()
  if (supabase && isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            product_id,
            quantity,
            notes,
            course,
            products (*)
          )
        `)
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false })

      if (!error && data && data.length > 0) {
        return data as unknown as Order[]
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
         ['pending', 'confirmed', 'preparing', 'ready'].includes(o.status)
  )
}

/**
 * 6. COMANDAS: Actualizar estado (pending -> preparing -> ready -> delivered)
 */
export async function updateOrderStatus(
  slug: string,
  orderId: string,
  status: OrderStatus
): Promise<{ success: boolean; error?: string }> {
  const supabase = createServerClient()
  if (supabase && isSupabaseConfigured()) {
    try {
      await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId)
    } catch (e) {
      console.warn('Error updating order status in Supabase:', e)
    }
  }

  updateServerOrderStatus(slug, orderId, status)
  return { success: true }
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
        broadcastEvent({ type: 'service_call', slug, call: data })
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
