import { createServerClient } from '../server'
import { isSupabaseConfigured } from '../client'
import {
  Order,
  OrderItem,
  OrderStatus,
  CourseType,
} from '@/types/database.types'
import {
  broadcastEvent,
  getServerOrders,
  findServerOrderById,
  addServerOrder,
  updateServerOrderStatus,
  isValidOrderTransition,
  saveCachedOrderItems,
  getCachedOrderItems,
  getServerProducts,
  sweepServerTableOrdersToPaid,
} from '@/lib/server-state'

export { getCachedOrderItems }
import { getTargetRestaurantId } from './restaurants.repository'
import { resolveCanonicalProductId } from '@/lib/category-matcher'
import {
  getItemCourse,
  mergeItemNotes,
  mergeOrderItemsCourseTags,
  hydrateOrderItemsWithCatalog,
  enforceMonotonicItemNotes,
  isPackHeaderItem,
  orderHasActiveDesserts,
} from '@/lib/course-utils'

const isUuid = (val?: string | null): boolean =>
  Boolean(val && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val))

export interface TransitionOrderParams {
  orderId: string
  restaurantId?: string
  slug: string
  nextStatus: OrderStatus
  expectedVersion?: number
  actorType?: string
  actorId?: string
  tableNumber?: number | string
  forceAllowReactivation?: boolean
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
      course?: CourseType
      is_complimentary?: boolean
      weight_grams?: number
      is_pack_header?: boolean
      is_pack_component?: boolean
      pack_id?: string
    }>
  }
): Promise<Order> {
  const targetRestaurantId = getTargetRestaurantId(restaurantId, slug)
  const initialStatus: OrderStatus = orderData.status || 'pending_validation'
  const supabase = createServerClient()
  const effectiveSessionToken = orderData.session_token || orderData.table_session_id || null
  const catalogProducts = getServerProducts(slug)

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
      let safeItemsForDb: typeof orderData.items = []
      try {
        const { data: dbProductRows } = await supabase
          .from('products')
          .select('id, name')
          .eq('restaurant_id', targetRestaurantId)
        const validDbProductIds = new Set((dbProductRows || []).map((p: any) => p.id))
        const dbProductsList = dbProductRows || []

        safeItemsForDb = (orderData.items || [])
          .filter(it => !it.is_pack_header && !(it.notes && it.notes.includes('[PACK_HEADER]')))
          .map(it => {
            let pid = resolveCanonicalProductId(it.product_id) || it.product_id
            if (uuidRegex.test(pid) && validDbProductIds.has(pid)) {
              return { ...it, product_id: pid }
            }
            const itName = it.product?.name || (it as any).name || ''
            if (itName && dbProductsList.length > 0) {
              const cleanTarget = itName.toLowerCase().trim()
              const matchedProd = dbProductsList.find((dp: any) => {
                const dpClean = (dp.name || '').toLowerCase().trim()
                return dpClean === cleanTarget || (cleanTarget.length >= 5 && (dpClean.includes(cleanTarget) || cleanTarget.includes(dpClean)))
              })
              if (matchedProd) {
                return { ...it, product_id: matchedProd.id }
              }
            }
            if (!validDbProductIds.has(pid) && dbProductsList.length > 0) {
              return { ...it, product_id: dbProductsList[0].id }
            }
            return { ...it, product_id: pid }
          })
          .filter(it => uuidRegex.test(it.product_id) && validDbProductIds.has(it.product_id))
      } catch {
        safeItemsForDb = (orderData.items || []).filter(it => uuidRegex.test(it.product_id))
      }

      const initialHydratedItems = hydrateOrderItemsWithCatalog(
        (orderData.items || []).map((it: any) => ({
          ...it,
          product: it.product || it.products,
          course: (it.course && ['first', 'second', 'dessert', 'drink'].includes(it.course))
            ? it.course
            : getItemCourse(it),
        })),
        catalogProducts
      )

      if (orderData.idempotency_key) {
        const { data: atomicResult, error: rpcErr } = await supabase.rpc('create_order_atomic', {
          p_restaurant_id: targetRestaurantId,
          p_table_session_id: resolvedTableSessionId,
          p_table_number: orderData.table_number,
          p_total_amount: orderData.total_amount,
          p_idempotency_key: orderData.idempotency_key,
          p_items: safeItemsForDb,
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
            order_items: initialHydratedItems,
            table_number: orderData.table_number,
          }
          saveCachedOrderItems(atomicResult.order.id, fullOrder.order_items)
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
            { onConflict: 'idempotency_key' }
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
        const fullOrder: Order = {
          ...newOrder,
          session_token: effectiveSessionToken || (newOrder as any).session_token,
          order_items: initialHydratedItems,
          table_number: orderData.table_number,
        }

        // Anti-race condition: Hidratar inmediatamente cache y memoria antes de que Realtime
        // emita postgres_changes hacia los clientes
        saveCachedOrderItems(newOrder.id, fullOrder.order_items)
        addServerOrder(slug, fullOrder, true)

        // Insertar items solo si existen como productos válidos en base de datos
        const itemsToInsert = safeItemsForDb.map(it => ({
          order_id: newOrder.id,
          product_id: it.product_id,
          quantity: it.quantity,
          notes: it.notes || null,
        }))

        if (itemsToInsert.length > 0) {
          try {
            const { data: insertedRows, error: itemsInsertErr } = await supabase
              .from('order_items')
              .insert(itemsToInsert)
              .select('id, product_id, quantity, notes')
            if (itemsInsertErr) {
              console.error('[createOrder] Explicit error inserting order_items in Supabase:', itemsInsertErr)
            } else if (insertedRows && insertedRows.length > 0) {
              let dbRowIdx = 0
              fullOrder.order_items = (fullOrder.order_items || []).map(it => {
                if (isPackHeaderItem(it)) return it
                const dbRow = insertedRows[dbRowIdx]
                if (dbRow?.id) {
                  dbRowIdx++
                  return { ...it, id: dbRow.id, order_id: newOrder.id }
                }
                return it
              })
              saveCachedOrderItems(newOrder.id, fullOrder.order_items)
            }
          } catch (itemsInsertErr) {
            console.error('[createOrder] Exception inserting order_items in Supabase:', itemsInsertErr)
          }
        }

        // Ahora que los items están en Supabase, emitir el broadcast con la orden completa
        addServerOrder(slug, fullOrder)
        return fullOrder
      }
      if (orderErr) {
        throw new Error(orderErr.message || 'Error al registrar la comanda en Supabase')
      }
    } catch (e: any) {
      console.error('Error creating order in Supabase:', e)
      throw e
    }
  }

  throw new Error('Base de datos no configurada o error de conexión al registrar la comanda')
}

/**
 * 5. COMANDAS: Obtener órdenes del restaurante (SSOT PostgreSQL)
 */
export async function getRestaurantOrders(
  restaurantId: string,
  slug: string,
  tableNumber?: number | string
): Promise<Order[]> {
  const catalogProducts = getServerProducts(slug)
  const supabase = createServerClient()
  if (supabase && isSupabaseConfigured()) {
    try {
      const targetRestaurantId = getTargetRestaurantId(restaurantId, slug)

      let query = supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            product_id,
            quantity,
            notes,
            products (id, name, price, category_id, image_url, is_available)
          )
        `)
        .eq('restaurant_id', targetRestaurantId)

      const parsedTableNum = tableNumber !== undefined && tableNumber !== null && tableNumber !== ''
        ? parseInt(String(tableNumber), 10)
        : null

      if (parsedTableNum !== null && !isNaN(parsedTableNum)) {
        query = query.eq('table_number', parsedTableNum).order('created_at', { ascending: false }).limit(20)
      } else {
        query = query.order('created_at', { ascending: false }).limit(60)
      }

      const { data, error } = await query

      if (!error && data) {
        const memOrders = getServerOrders(slug, true)
        const mappedOrders = (data as unknown as any[]).map(o => {
          const tableNum = o.table_number || (o.table ? o.table.table_number : (parsedTableNum ?? 1))
          const token = o.session_token || o.table_session_id
          const normalizedItems = (o.order_items || []).map((it: any) => ({
            ...it,
            product: it.product || it.products,
            course: (it.course && ['first', 'second', 'dessert', 'drink'].includes(it.course))
              ? it.course
              : getItemCourse(it),
          }))
          const mem = memOrders.find(m => m.id === o.id)
          const resolvedVersion = (o.version !== undefined && o.version !== null)
            ? o.version
            : (mem?.version ?? 1)

          // PostgreSQL SSOT: preferir el estado de Supabase (SSOT) evitando regresiones por memoria obsoleta
          let resolvedStatus = o.status
          if (o.status === 'paid' || o.status === 'cancelled') {
            resolvedStatus = o.status
          } else if (mem?.status === 'paid' || mem?.status === 'cancelled') {
            resolvedStatus = mem.status
          } else if (mem) {
            const memVersion = Number(mem.version || 0)
            const supaVersion = Number(o.version || 0)
            const memTime = mem.updated_at ? new Date(mem.updated_at).getTime() : 0
            const supaTime = o.updated_at ? new Date(o.updated_at).getTime() : 0

            if (supaVersion > memVersion) {
              resolvedStatus = o.status
            } else if (memVersion > supaVersion) {
              if (mem.status === 'delivered' && (o.status === 'preparing' || o.status === 'ready') && orderHasActiveDesserts(o)) {
                resolvedStatus = o.status
              } else {
                resolvedStatus = mem.status
              }
            } else if (memTime > supaTime && mem.status) {
              if (mem.status === 'delivered' && (o.status === 'preparing' || o.status === 'ready') && orderHasActiveDesserts(o)) {
                resolvedStatus = o.status
              } else {
                resolvedStatus = mem.status
              }
            } else if (!o.status && mem.status) {
              resolvedStatus = mem.status
            } else {
              resolvedStatus = o.status
            }
          }

          const mergedOrderNotes = mergeItemNotes(o.notes, (mem as any)?.notes)
          const cachedItems = getCachedOrderItems(o.id)
          const referenceItems = (mem?.order_items && mem.order_items.length > 0)
            ? mem.order_items
            : (cachedItems && cachedItems.length > 0 ? cachedItems : [])

          // Anti-Loss Invariant: Si memoria o cache contiene más items que la respuesta parcial de DB,
          // preservar la comanda íntegra en lugar de truncarla.
          const rawCandidateItems = (mem?.order_items && mem.order_items.length > normalizedItems.length)
            ? mem.order_items
            : (cachedItems && cachedItems.length > normalizedItems.length)
                ? cachedItems
                : (normalizedItems.length > 0
                    ? normalizedItems
                    : ((mem?.order_items && mem.order_items.length > 0)
                        ? mem.order_items
                        : (cachedItems && cachedItems.length > 0 ? cachedItems : [])))

          // ANTI-REVERSION & HYDRATION INVARIANT: Hidratar siempre `item.product.name` y preservar
          // todas las etiquetas irreversibles ([BARRA_SERVIDA], [ENTRADA_SERVIDA], [PRINCIPAL_SERVIDO], etc.)
          const resolvedOrderItems = hydrateOrderItemsWithCatalog(
            rawCandidateItems,
            catalogProducts,
            referenceItems,
            mergedOrderNotes
          )

          if (resolvedOrderItems.length > 0) {
            saveCachedOrderItems(o.id, resolvedOrderItems)
          }

          return {
            ...o,
            notes: mergedOrderNotes || o.notes,
            version: resolvedVersion,
            order_items: resolvedOrderItems,
            status: resolvedStatus,
            table_number: tableNum,
            session_token: token,
          } as Order
        })
        const seenIds = new Set(mappedOrders.map(o => o.id))
        const unindexedMemOrders = memOrders
          .filter(
            m => !seenIds.has(m.id) && m.status !== 'cancelled' &&
              (parsedTableNum !== null && !isNaN(parsedTableNum)
                ? (Number(m.table_number) === parsedTableNum || Number(m.table?.table_number) === parsedTableNum)
                : true)
          )
          .map(m => ({
            ...m,
            order_items: hydrateOrderItemsWithCatalog(
              m.order_items || [],
              catalogProducts,
              getCachedOrderItems(m.id),
              (m as any).notes
            ),
          }))
        return [...mappedOrders, ...unindexedMemOrders]
      }
    } catch (e) {
      console.warn('Error fetching orders from Supabase:', e)
    }
  }

  const allMem = getServerOrders(slug, true).map(m => ({
    ...m,
    order_items: hydrateOrderItemsWithCatalog(
      m.order_items || [],
      catalogProducts,
      getCachedOrderItems(m.id),
      (m as any).notes
    ),
  }))
  if (tableNumber !== undefined && tableNumber !== null && tableNumber !== '') {
    const num = parseInt(String(tableNumber), 10)
    if (!isNaN(num)) {
      return allMem.filter(o => Number(o.table_number) === num || Number(o.table?.table_number) === num)
    }
  }
  return allMem
}

/**
 * 5.1 COMANDAS: Obtener órdenes activas de una mesa específica (Safari ITP Restore)
 */
export async function getActiveOrdersByTable(
  restaurantId: string,
  slug: string,
  tableNumber: number
): Promise<Order[]> {
  const catalogProducts = getServerProducts(slug)
  const memOrders = getServerOrders(slug)
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
        .eq('table_number', tableNumber)
        .in('status', ['pending_validation', 'pending', 'confirmed', 'preparing', 'ready', 'delivered'])
        .order('created_at', { ascending: false })
        .limit(20)

      if (!error && data && data.length > 0) {
        return (data as unknown as any[]).map(o => {
          const tableNum = o.table_number || (o.table ? o.table.table_number : tableNumber)
          const token = o.session_token || o.table_session_id
          const mem = memOrders.find(m => m.id === o.id)
          const mergedOrderNotes = mergeItemNotes(o.notes, (mem as any)?.notes)
          const refItems = mem?.order_items || getCachedOrderItems(o.id)
          const hydratedItems = hydrateOrderItemsWithCatalog(
            o.order_items || [],
            catalogProducts,
            refItems,
            mergedOrderNotes
          )
          return {
            ...o,
            notes: mergedOrderNotes || o.notes,
            table_number: tableNum,
            session_token: token,
            order_items: hydratedItems,
          } as Order
        })
      }
    } catch (e) {
      console.warn('Error fetching active table orders from Supabase:', e)
    }
  }

  // Fallback a memoria
  return memOrders
    .filter(
      o => o.table_number?.toString() === tableNumber.toString() &&
           ['pending_validation', 'pending', 'confirmed', 'preparing', 'ready', 'delivered'].includes(o.status)
    )
    .map(o => ({
      ...o,
      order_items: hydrateOrderItemsWithCatalog(
        o.order_items || [],
        catalogProducts,
        getCachedOrderItems(o.id),
        (o as any).notes
      ),
    }))
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
    forceAllowReactivation = false,
  } = params

  const catalogProducts = getServerProducts(slug)
  const supabase = createServerClient()
  const hasSupabase = supabase && isSupabaseConfigured()

  // 1. Obtener la comanda previa (memoria o Supabase) para validar idempotencia y transiciones
  const memOrders = getServerOrders(slug, true)
  let currentOrder = findServerOrderById(orderId) || memOrders.find(o => o.id === orderId)
  if (!currentOrder && hasSupabase) {
    try {
      const { data: supaOrder } = await supabase
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
      if (supaOrder) {
        const hydratedItems = hydrateOrderItemsWithCatalog(
          supaOrder.order_items || [],
          catalogProducts,
          getCachedOrderItems(orderId),
          supaOrder.notes
        )
        currentOrder = {
          ...supaOrder,
          version: supaOrder.version || 1,
          order_items: hydratedItems,
        } as Order
        saveCachedOrderItems(orderId, hydratedItems)
        addServerOrder(slug, currentOrder, true)
      }
    } catch {
      // ignore
    }
  }

  // Blindaje estricto de estado 'paid': Es terminal e irreversible. Nunca puede transicionar a otro estado.
  if (currentOrder && currentOrder.status === 'paid' && nextStatus !== 'paid') {
    return {
      success: false,
      code: 'TRANSITION_INVALID',
      message: `La orden ${orderId} ya se encuentra PAGADA ('paid'). Estado terminal irreversible; no se permite cambiar a ${nextStatus}`,
      error: `La orden ${orderId} ya se encuentra PAGADA ('paid'). Estado terminal irreversible; no se permite cambiar a ${nextStatus}`,
      current_version: currentOrder.version,
      current_status: 'paid',
    }
  }

  // Idempotencia inmediata si ya está en el estado solicitado (pero emitiendo orden 100% hidratada)
  if (currentOrder && currentOrder.status === nextStatus) {
    const hydratedItems = hydrateOrderItemsWithCatalog(
      currentOrder.order_items || [],
      catalogProducts,
      getCachedOrderItems(orderId),
      (currentOrder as any).notes
    )
    const hydratedOrder: Order = {
      ...currentOrder,
      order_items: hydratedItems,
    }
    saveCachedOrderItems(orderId, hydratedItems)
    addServerOrder(slug, hydratedOrder, true)
    broadcastEvent({
      type: 'order_updated',
      slug,
      orderId,
      status: nextStatus,
      tableNumber: hydratedOrder.table_number || tableNumber,
      order: hydratedOrder,
    })
    return {
      success: true,
      code: 'ALREADY_IN_STATE',
      message: `Orden ${orderId} ya se encuentra en estado ${nextStatus}`,
      order: hydratedOrder,
      version: hydratedOrder.version || 1,
      current_status: hydratedOrder.status,
    }
  }

  // Validación estricta de máquina de estados formal
  if (currentOrder && !isValidOrderTransition(currentOrder.status, nextStatus, forceAllowReactivation)) {
    return {
      success: false,
      code: 'TRANSITION_INVALID',
      message: `Transición inválida de ${currentOrder.status} a ${nextStatus}`,
      error: `Transición inválida de ${currentOrder.status} a ${nextStatus}`,
      current_version: currentOrder.version,
      current_status: currentOrder.status,
    }
  }

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
          // Doble verificación: si la transición no era válida según la máquina de estados, rechazar
          const priorStatus = (data.previous_status || currentOrder?.status) as string | undefined
          if (priorStatus && !isValidOrderTransition(priorStatus, nextStatus, forceAllowReactivation)) {
            return {
              success: false,
              code: 'TRANSITION_INVALID',
              message: `Transición inválida de ${priorStatus} a ${nextStatus}`,
              error: `Transición inválida de ${priorStatus} a ${nextStatus}`,
              current_version: data.current_version ?? currentOrder?.version,
              current_status: priorStatus as OrderStatus,
            }
          }

          const rpcItems = (data.order?.order_items || []).map((it: any) => ({
            ...it,
            product: it.product || it.products,
            course: (it.course && ['first', 'second', 'dessert', 'drink'].includes(it.course))
              ? it.course
              : getItemCourse(it),
          }))

          // Backfill y reconciliación monotónica + hidratación de productos desde memoria/caché/catálogo
          const memOrder = getServerOrders(slug).find(o => o.id === orderId)
          const cachedItems = getCachedOrderItems(orderId)
          const referenceItems = (memOrder?.order_items && memOrder.order_items.length > 0)
            ? memOrder.order_items
            : (cachedItems && cachedItems.length > 0 ? cachedItems : [])

          const mergedOrderNotes = mergeItemNotes(data.order?.notes, (memOrder as any)?.notes)
          const resolvedItems = hydrateOrderItemsWithCatalog(
            rpcItems.length > 0 ? rpcItems : referenceItems,
            catalogProducts,
            referenceItems,
            mergedOrderNotes
          )

          if (resolvedItems.length > 0) {
            saveCachedOrderItems(orderId, resolvedItems)
          }

          const parsedOrder: Order | undefined = data.order ? {
            ...(memOrder || {}),
            ...data.order,
            notes: mergedOrderNotes || data.order?.notes,
            order_items: resolvedItems,
          } : undefined

          // Sincronizar en memoria local con items hidratados antes del broadcast
          if (parsedOrder) {
            saveCachedOrderItems(orderId, resolvedItems)
            addServerOrder(slug, parsedOrder, true)
            updateServerOrderStatus(slug, orderId, nextStatus, tableNumber, undefined, forceAllowReactivation)
          }

          if (nextStatus === 'paid') {
            const resolvedTbl = parsedOrder?.table_number || tableNumber || currentOrder?.table_number
            if (resolvedTbl !== undefined && resolvedTbl !== null) {
              await sweepTableOrdersToPaid(restaurantId || '', slug, resolvedTbl)
            }
          }

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
        } else if (
          data.code !== 'VERSION_CONFLICT' &&
          data.code !== 'ORDER_NOT_FOUND' &&
          data.current_status &&
          isValidOrderTransition(data.current_status, nextStatus, forceAllowReactivation)
        ) {
          // La transición es válida en la máquina de estados (ej. Pase 2 postres: delivered -> preparing),
          // continuar hacia el fallback de servidor y persistencia directa en Supabase.
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
  let memResult = updateServerOrderStatus(slug, orderId, nextStatus, tableNumber, expectedVersion, forceAllowReactivation)

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
        const cached = getCachedOrderItems(orderId)
        const effectiveItems = hydrateOrderItemsWithCatalog(
          supaOrder.order_items || [],
          catalogProducts,
          cached,
          supaOrder.notes
        )

        const orderToHydrate: Order = {
          ...supaOrder,
          version: supaOrder.version || 1,
          order_items: effectiveItems,
        }
        saveCachedOrderItems(orderId, effectiveItems)
        addServerOrder(slug, orderToHydrate)
        memResult = updateServerOrderStatus(slug, orderId, nextStatus, tableNumber, expectedVersion, forceAllowReactivation)
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

  if (memResult.order) {
    const hydratedFallbackItems = hydrateOrderItemsWithCatalog(
      memResult.order.order_items || [],
      catalogProducts,
      getCachedOrderItems(orderId),
      (memResult.order as any).notes
    )
    memResult.order = {
      ...memResult.order,
      order_items: hydratedFallbackItems,
    }
    saveCachedOrderItems(orderId, hydratedFallbackItems)
    addServerOrder(slug, memResult.order, true)
  }

  // Si la transición fue válida y Supabase está configurado, persistir en PostgreSQL
  if (hasSupabase) {
    try {
      const { error: updErr } = await supabase
        .from('orders')
        .update({ status: nextStatus })
        .eq('id', orderId)

      if (updErr) {
        console.warn('[transitionOrderStatus] Warning updating status in Supabase:', updErr)
      }
    } catch (syncErr) {
      console.warn('[transitionOrderStatus] Error persisting fallback transition to Supabase:', syncErr)
    }
  }

  if (nextStatus === 'paid') {
    const resolvedTbl = memResult.order?.table_number || tableNumber || currentOrder?.table_number
    if (resolvedTbl !== undefined && resolvedTbl !== null) {
      await sweepTableOrdersToPaid(restaurantId || '', slug, resolvedTbl)
    }
  }

  // EMITIR BROADCAST SSE para que el comensal y todo el personal reciban el evento en tiempo real
  broadcastEvent({
    type: 'order_updated',
    slug,
    orderId,
    status: nextStatus,
    tableNumber: memResult.order?.table_number || tableNumber,
    order: memResult.order,
  })

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
 * 6.2 Actualiza tags de curso/pase gastronómico en las notas de los ítems de una orden
 * (ej. [BARRA_SERVIDA], [ENTRADA_LISTA], [ENTRADA_SERVIDA], [MARCHAR_PRINCIPAL], [PRINCIPAL_SERVIDO], [POSTRE_SERVIDO])
 * garantizando persistencia monotónica en PostgreSQL (Supabase) y sincronización Realtime SSE con productos hidratados.
 */
export async function updateOrderCourseTags(
  slug: string,
  orderId: string,
  tag: string,
  itemFilter: (item: OrderItem) => boolean,
  options?: { skipBroadcast?: boolean }
): Promise<{ success: boolean; order?: Order; error?: string }> {
  const catalogProducts = getServerProducts(slug)
  const supabase = createServerClient()
  const hasSupabase = supabase && isSupabaseConfigured()

  const memOrders = getServerOrders(slug)
  let order = memOrders.find(o => o.id === orderId)

  if (!order && hasSupabase) {
    try {
      const orders = await getRestaurantOrders('', slug)
      order = orders.find(o => o.id === orderId)
    } catch (e) {
      console.warn('[updateOrderCourseTags] Error fetching order from Supabase:', e)
    }
  }

  if (!order) {
    return { success: false, error: 'ORDER_NOT_FOUND' }
  }

  const tagsToApply = tag.split(/\s+/).filter(Boolean)
  let updatedOrderNotes = (order as any).notes || ''
  for (const singleTag of tagsToApply) {
    if (!updatedOrderNotes.includes(singleTag)) {
      updatedOrderNotes = updatedOrderNotes ? `${updatedOrderNotes} ${singleTag}` : singleTag
    }
  }
  updatedOrderNotes = enforceMonotonicItemNotes(updatedOrderNotes)

  const baseHydratedItems = hydrateOrderItemsWithCatalog(
    order.order_items || [],
    catalogProducts,
    getCachedOrderItems(orderId),
    (order as any).notes
  )

  const rawUpdatedItems: OrderItem[] = baseHydratedItems.map(it => {
    if (itemFilter(it)) {
      let currentNotes = it.notes || ''
      for (const singleTag of tagsToApply) {
        if (!currentNotes.includes(singleTag)) {
          currentNotes = currentNotes ? `${currentNotes} ${singleTag}` : singleTag
        }
      }
      return {
        ...it,
        notes: enforceMonotonicItemNotes(currentNotes),
      }
    }
    return {
      ...it,
      notes: enforceMonotonicItemNotes(it.notes),
    }
  })

  const updatedItems = hydrateOrderItemsWithCatalog(
    rawUpdatedItems,
    catalogProducts,
    baseHydratedItems,
    updatedOrderNotes
  )

  // Persistir en Supabase (order_items y orders.notes)
  if (hasSupabase) {
    try {
      const itemsToUpdate = updatedItems.filter(it => itemFilter(it))
      if (itemsToUpdate.length > 0) {
        let dbItems: any[] = []
        if (isUuid(orderId)) {
          const { data } = await supabase
            .from('order_items')
            .select('id, product_id, notes')
            .eq('order_id', orderId)
          if (data && data.length > 0) {
            dbItems = data
          }
        }

        const usedDbItemIds = new Set<string>()

        await Promise.all(
          itemsToUpdate.map(async it => {
            if (isUuid(it.id)) {
              usedDbItemIds.add(it.id!)
              const existingDb = dbItems.find(d => d.id === it.id)
              const mergedDbNotes = mergeItemNotes(it.notes, existingDb?.notes)
              it.notes = mergedDbNotes
              const { error } = await supabase
                .from('order_items')
                .update({ notes: mergedDbNotes })
                .eq('id', it.id)
              if (error) {
                console.warn('[updateOrderCourseTags] Error updating by id:', error)
              }
              return
            }
            const itPid = it.product_id || it.product?.id
            const itCanon = resolveCanonicalProductId(itPid) || itPid

            const matchedDbItem = dbItems.find(
              dbi => {
                if (usedDbItemIds.has(dbi.id)) return false
                const dbiPid = dbi.product_id || (dbi as any).product?.id
                const dbiCanon = resolveCanonicalProductId(dbiPid) || dbiPid
                return (
                  dbiPid === itPid ||
                  (dbiCanon && itCanon && dbiCanon === itCanon)
                )
              }
            )
            if (matchedDbItem?.id && isUuid(matchedDbItem.id)) {
              usedDbItemIds.add(matchedDbItem.id)
              it.id = matchedDbItem.id
              const mergedDbNotes = mergeItemNotes(it.notes, matchedDbItem.notes)
              it.notes = mergedDbNotes
              const { error } = await supabase
                .from('order_items')
                .update({ notes: mergedDbNotes })
                .eq('id', matchedDbItem.id)
              if (error) {
                console.warn('[updateOrderCourseTags] Error updating by matchedDbItem.id:', error)
              }
              return
            }
            if (isUuid(orderId)) {
              const pid = (itPid && isUuid(itPid))
                ? itPid
                : (itCanon && isUuid(itCanon))
                  ? itCanon
                  : null
              if (pid) {
                const { error } = await supabase
                  .from('order_items')
                  .update({ notes: it.notes })
                  .eq('order_id', orderId)
                  .eq('product_id', pid)
                if (error) {
                  console.warn('[updateOrderCourseTags] Error updating by order_id/product_id:', error)
                }
              }
            }
          })
        )
      }

      // Nota: La tabla orders en PostgreSQL no tiene columna notes (las etiquetas viven en order_items.notes)
    } catch (dbErr) {
      console.warn('[updateOrderCourseTags] DB update error:', dbErr)
    }
  }

  const updatedOrder: Order = {
    ...order,
    notes: updatedOrderNotes,
    order_items: updatedItems,
  }
  saveCachedOrderItems(orderId, updatedItems)
  addServerOrder(slug, updatedOrder, true)

  if (!options?.skipBroadcast) {
    broadcastEvent({
      type: 'order_updated',
      slug,
      orderId,
      status: updatedOrder.status,
      tableNumber: updatedOrder.table_number,
      order: updatedOrder,
    })
  }

  return { success: true, order: updatedOrder }
}

/**
 * Resuelve el comodín de postre/café pendiente [POSTRE_PENDIENTE_ELECCION]
 * asignando el plato elegido por el comensal y marchándolo a cocina.
 */
export async function resolvePendingDessertInOrder(
  slug: string,
  orderId: string,
  dessertProduct: { id: string; name: string; description?: string; image_url?: string | null },
  note?: string
): Promise<{ success: boolean; order?: Order; error?: string }> {
  const catalogProducts = getServerProducts(slug)
  const supabase = createServerClient()
  const hasSupabase = supabase && isSupabaseConfigured()

  const memOrders = getServerOrders(slug)
  let order = memOrders.find(o => o.id === orderId)

  if (!order && hasSupabase) {
    try {
      const orders = await getRestaurantOrders('', slug)
      order = orders.find(o => o.id === orderId)
    } catch (e) {
      console.warn('[resolvePendingDessertInOrder] Error fetching order from Supabase:', e)
    }
  }

  if (!order) {
    return { success: false, error: 'ORDER_NOT_FOUND' }
  }

  let resolved = false
  const rawUpdatedItems: OrderItem[] = (order.order_items || []).map(it => {
    const isPending = Boolean(
      (it.notes && it.notes.includes('[POSTRE_PENDIENTE_ELECCION]')) ||
      it.product_id === 'p-dessert-pending' ||
      it.product_id === 'p-dessert-pending-later' ||
      it.product?.name?.includes('por definir')
    )
    if (isPending && !resolved) {
      resolved = true
      const strippedNotes = (it.notes || '')
        .replace(/\[POSTRE_PENDIENTE_ELECCION\]/g, '')
        .trim()
      const newNotes = [
        strippedNotes,
        note ? `(${note})` : '',
        '[MARCHAR_POSTRE]',
      ].filter(Boolean).join(' ')

      return {
        ...it,
        product_id: dessertProduct.id,
        notes: newNotes,
        product: {
          ...(it.product || {}),
          id: dessertProduct.id,
          name: dessertProduct.name,
          description: dessertProduct.description || (it.product?.description ?? ''),
          image_url: dessertProduct.image_url || it.product?.image_url || null,
          price: 0,
          category_id: 'cat-postres',
          restaurant_id: it.product?.restaurant_id || '',
          model_3d_url: null,
          is_available: true,
        },
      }
    }
    return it
  })

  const updatedOrderNotes = mergeItemNotes((order as any).notes, '[MARCHAR_POSTRE]')
  const updatedItems = hydrateOrderItemsWithCatalog(
    rawUpdatedItems,
    catalogProducts,
    order.order_items,
    updatedOrderNotes
  )

  const nextStatus: OrderStatus = order.status === 'ready' || order.status === 'delivered' ? 'preparing' : order.status

  // Persistir en Supabase
  if (hasSupabase) {
    try {
      let dbItems: any[] = []
      if (isUuid(orderId)) {
        const { data } = await supabase
          .from('order_items')
          .select('id, product_id, notes')
          .eq('order_id', orderId)
        if (data && data.length > 0) {
          dbItems = data
        }
      }

      for (const it of updatedItems) {
        if (isUuid(it.id)) {
          await supabase
            .from('order_items')
            .update({ notes: it.notes, product_id: it.product_id })
            .eq('id', it.id)
        } else {
          const matchedDbItem = dbItems.find(dbi => dbi.product_id === it.product_id)
          if (matchedDbItem?.id && isUuid(matchedDbItem.id)) {
            it.id = matchedDbItem.id
            await supabase
              .from('order_items')
              .update({ notes: it.notes, product_id: it.product_id })
              .eq('id', matchedDbItem.id)
          } else if (isUuid(orderId)) {
            await supabase
              .from('order_items')
              .update({ notes: it.notes, product_id: it.product_id })
              .eq('order_id', orderId)
          }
        }
      }
      if (isUuid(orderId)) {
        await supabase
          .from('orders')
          .update({ status: nextStatus })
          .eq('id', orderId)
      }
    } catch (dbErr) {
      console.warn('[resolvePendingDessertInOrder] DB update error:', dbErr)
    }
  }

  const updatedOrder: Order = {
    ...order,
    status: nextStatus,
    notes: updatedOrderNotes,
    order_items: updatedItems,
  }

  saveCachedOrderItems(orderId, updatedItems)
  addServerOrder(slug, updatedOrder, true)

  broadcastEvent({
    type: 'order_updated',
    slug,
    orderId,
    status: updatedOrder.status,
    tableNumber: updatedOrder.table_number,
    order: updatedOrder,
  })

  return { success: true, order: updatedOrder }
}

/**
 * 6.4 Barrido Total Anti-Zombis al Cobrar la Mesa (Batch Update a 'paid')
 * Actualiza todas las órdenes de un restaurant_id y table_number cuyo estado sea
 * 'pending_validation', 'pending', 'confirmed', 'preparing', 'ready' o 'delivered'
 * a status = 'paid' y marca todos sus ítems internos como entregados/servidos.
 */
export async function sweepTableOrdersToPaid(
  restaurantId: string,
  slug: string,
  tableNumber: number | string
): Promise<Order[]> {
  const parsedTableNum = parseInt(String(tableNumber), 10)
  if (isNaN(parsedTableNum)) return []

  const targetRestaurantId = getTargetRestaurantId(restaurantId, slug)
  const catalogProducts = getServerProducts(slug)
  const sweptMemOrders = sweepServerTableOrdersToPaid(slug, parsedTableNum)
  const sweptMap = new Map<string, Order>()
  sweptMemOrders.forEach(o => sweptMap.set(o.id, o))

  const allServedTagsStr =
    '[BARRA_SERVIDA] [ENTRADA_LISTA] [ENTRADA_SERVIDA] [MARCHAR_PRINCIPAL] [PRINCIPAL_LISTO] [PRINCIPAL_SERVIDO] [MARCHAR_POSTRE] [POSTRE_LISTO] [POSTRE_SERVIDO]'

  const supabase = createServerClient()
  if (supabase && isSupabaseConfigured()) {
    try {
      const { data: tableOrdersInDb } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            product_id,
            quantity,
            notes,
            products (id, name, price, category_id, image_url, is_available)
          )
        `)
        .eq('restaurant_id', targetRestaurantId)
        .eq('table_number', parsedTableNum)
        .neq('status', 'cancelled')
        .order('created_at', { ascending: false })
        .limit(15)

      // Batch update de todas las órdenes abiertas/zombis de esta mesa a 'paid'
      await supabase
        .from('orders')
        .update({ status: 'paid' })
        .eq('restaurant_id', targetRestaurantId)
        .eq('table_number', parsedTableNum)
        .in('status', ['pending_validation', 'pending', 'confirmed', 'preparing', 'ready', 'delivered'])

      if (tableOrdersInDb && tableOrdersInDb.length > 0) {
        const nowIso = new Date().toISOString()
        await Promise.all(
          tableOrdersInDb.map(async (ord: any) => {
            const wasOpenInDb = ord.status !== 'paid'
            const items = ord.order_items || []
            for (const it of items) {
              if (it.id && isUuid(it.id)) {
                const mergedItNotes = mergeItemNotes(it.notes, allServedTagsStr)
                if (mergedItNotes !== (it.notes || '').trim()) {
                  it.notes = mergedItNotes
                  try {
                    await supabase
                      .from('order_items')
                      .update({ notes: mergedItNotes })
                      .eq('id', it.id)
                  } catch {
                    // ignore
                  }
                }
              }
            }

            if (!sweptMap.has(ord.id)) {
              const normalizedItems = items.map((it: any) => ({
                ...it,
                status: 'delivered',
                product: it.product || it.products,
                notes: mergeItemNotes(it.notes, allServedTagsStr),
                course: (it.course && ['first', 'second', 'dessert', 'drink'].includes(it.course))
                  ? it.course
                  : getItemCourse(it),
              }))
              const hydratedItems = hydrateOrderItemsWithCatalog(
                normalizedItems,
                catalogProducts,
                getCachedOrderItems(ord.id),
                allServedTagsStr
              )
              if (hydratedItems.length > 0) {
                saveCachedOrderItems(ord.id, hydratedItems)
              }
              const hydratedOrd: Order = {
                ...ord,
                status: 'paid',
                updated_at: wasOpenInDb ? nowIso : (ord.updated_at || ord.created_at || nowIso),
                notes: allServedTagsStr,
                table_number: parsedTableNum,
                session_token: ord.session_token || ord.table_session_id,
                order_items: hydratedItems,
              }
              addServerOrder(slug, hydratedOrd, true)
              sweptMap.set(ord.id, hydratedOrd)
            }
          })
        )
      }
    } catch (err) {
      console.warn('[sweepTableOrdersToPaid] Error sweeping table orders in Supabase:', err)
    }
  }

  broadcastEvent({
    type: 'table_bill_paid',
    slug,
    table_number: parsedTableNum,
    tableNumber: parsedTableNum,
  })

  return Array.from(sweptMap.values())
}

