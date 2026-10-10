import { NextRequest, NextResponse } from 'next/server'
import {
  checkRateLimit,
  setTableOccupied,
  recordAnalyticsEvent,
  saveIdempotentOrder,
  acquireIdempotencyLock,
  completeIdempotencyLock,
  releaseIdempotencyLock,
  getServerProducts,
  resolveCanonicalProductId,
  getProductAvailabilityOverrides,
} from '@/lib/server-state'
import {
  getRestaurantBySlug,
  validateSessionToken,
  createOrder,
  getRestaurantOrders,
  transitionOrderStatus,
  getTargetRestaurantId,
  createOrGetActiveSession,
} from '@/lib/supabase/repository'
import { MOCK_TABLES } from '@/lib/supabase/mock-fallback'
import { OrderStatus } from '@/types/database.types'
import {
  validateAndPriceOrderItems,
  OrderValidationError,
  cleanStr,
} from '@/lib/orders/order-validator'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const slug = searchParams.get('slug') || 'burger-gourmet'
    const restaurant = await getRestaurantBySlug(slug)
    const restaurantId = getTargetRestaurantId(restaurant?.id, slug)
    const orders = await getRestaurantOrders(restaurantId, slug)
    const catalogProducts = getServerProducts(slug)
    const overrides = getProductAvailabilityOverrides(slug)

    const pausedIdsSet = new Set<string>()
    const productAvailability: Record<string, boolean> = {}

    // 1. Mapeo a partir de todos los productos del catálogo
    catalogProducts.forEach(p => {
      const isAvail = p.is_available !== false
      productAvailability[p.id] = isAvail
      const canon = resolveCanonicalProductId(p.id)
      if (canon) productAvailability[canon] = isAvail
      const cName = cleanStr(p.name)
      if (cName) productAvailability[cName] = isAvail

      if (!isAvail) {
        pausedIdsSet.add(p.id)
        if (canon) pausedIdsSet.add(canon)
        if (cName) pausedIdsSet.add(cName)
      }
    })

    // 2. Mapeo de overrides directos del almacén de staff
    Object.entries(overrides).forEach(([key, isAvail]) => {
      productAvailability[key] = isAvail
      const canon = resolveCanonicalProductId(key)
      if (canon) productAvailability[canon] = isAvail
      if (!isAvail) {
        pausedIdsSet.add(key)
        if (canon) pausedIdsSet.add(canon)
      }
    })

    const pausedProductIds = Array.from(pausedIdsSet)

    return NextResponse.json(
      {
        orders,
        paused_product_ids: pausedProductIds,
        product_availability: productAvailability,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        },
      }
    )
  } catch (err: any) {
    return NextResponse.json({ error: err.message, orders: [] }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  let idempotencyKeyStr: string | null = null
  let idempotencyLocked = false

  try {
    const body = await req.json()
    const {
      slug = 'burger-gourmet',
      restaurant_id,
      table_id,
      table_number,
      items,
      session_id,
      session_token,
      idempotency_key,
      status: requestedStatus,
      created_by = 'diner',
    } = body

    // 0. Control de Idempotencia Atómica y Cero TOCTOU
    if (idempotency_key && typeof idempotency_key === 'string' && idempotency_key.trim()) {
      idempotencyKeyStr = idempotency_key.trim()
      const lock = await acquireIdempotencyLock(idempotencyKeyStr)
      if (!lock.isOwner) {
        if (lock.order) {
          return NextResponse.json({
            success: true,
            order: lock.order,
            idempotent: true,
            message: 'Comanda ya procesada previamente (Idempotency Key)',
          })
        } else {
          return NextResponse.json(
            { error: lock.error || 'Error procesando comanda concurrente' },
            { status: 500 }
          )
        }
      }
      idempotencyLocked = true
    }

    const tokenToValidate = session_token || session_id

    // 1. Rate Limiting de seguridad
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local-client'
    const rateLimitKey = `order_${slug}_${clientIp}_${table_number}`
    if (!checkRateLimit(rateLimitKey, 60, 60000)) {
      if (idempotencyKeyStr && idempotencyLocked) releaseIdempotencyLock(idempotencyKeyStr, 'Rate limited')
      return NextResponse.json(
        { error: 'Demasiadas solicitudes. Por favor espera unos momentos.' },
        { status: 429 }
      )
    }

    if (!Array.isArray(items) || items.length === 0) {
      if (idempotencyKeyStr && idempotencyLocked) releaseIdempotencyLock(idempotencyKeyStr, 'Items inválidos')
      return NextResponse.json(
        { error: 'La comanda debe contener al menos 1 producto válido' },
        { status: 400 }
      )
    }

    const parsedTableNum = Math.max(1, parseInt(String(table_number || '1'), 10) || 1)
    const restaurant = await getRestaurantBySlug(slug)
    const restaurantId = getTargetRestaurantId(restaurant?.id || restaurant_id, slug)

    // 2. Validación de Sesión de Mesa con UUID (Protección Anti-Solapamiento)
    let finalSessionToken = tokenToValidate
    let tableSessionPk: string | undefined = undefined

    if (tokenToValidate) {
      const sessionCheck = await validateSessionToken(restaurantId, slug, parsedTableNum, tokenToValidate)
      if (!sessionCheck.valid) {
        if (idempotencyKeyStr && idempotencyLocked) releaseIdempotencyLock(idempotencyKeyStr, 'SESSION_EXPIRED')
        return NextResponse.json(
          {
            error: 'SESSION_EXPIRED',
            message: 'La sesión de esta mesa ha finalizado. Por favor escanea el código QR de nuevo.',
            reason: sessionCheck.reason,
          },
          { status: sessionCheck.status || 403 }
        )
      }
      tableSessionPk = sessionCheck.session?.id
    } else {
      // Si no se proporcionó token (por ejemplo creación directa por personal en comandero), inicializar sesión activa
      const newSession = await createOrGetActiveSession(restaurantId, slug, parsedTableNum)
      finalSessionToken = newSession.session_token
      tableSessionPk = newSession.id
    }

    // Asegurar que la mesa pase a estado ocupado con su sesión activa
    setTableOccupied(slug, parsedTableNum, finalSessionToken)

    const tables = MOCK_TABLES[slug] || []
    const matchedTable = tables.find(t => t.id === table_id || t.table_number === parsedTableNum)
    const assignedTableNum = matchedTable ? matchedTable.table_number : parsedTableNum

    // 3. Validación de Precios Server-Side y disponibilidad mediante servicio desacoplado
    let validated
    try {
      validated = await validateAndPriceOrderItems({
        items,
        slug,
        restaurantId,
        req,
      })
    } catch (err: any) {
      if (idempotencyKeyStr && idempotencyLocked) {
        releaseIdempotencyLock(idempotencyKeyStr, err.message)
      }
      if (err instanceof OrderValidationError) {
        return NextResponse.json({ error: err.message }, { status: err.status })
      }
      throw err
    }

    const { validItems, computedTotal } = validated
    const initialStatus = requestedStatus || (created_by === 'waiter' ? 'pending' : 'pending_validation')

    const saved = await createOrder(restaurantId, slug, {
      table_number: assignedTableNum,
      session_token: finalSessionToken,
      table_session_id: tableSessionPk,
      idempotency_key,
      status: initialStatus,
      total_amount: computedTotal,
      items: validItems,
    })

    if (idempotencyKeyStr && idempotencyLocked) {
      completeIdempotencyLock(idempotencyKeyStr, saved)
    } else if (idempotency_key && typeof idempotency_key === 'string') {
      saveIdempotentOrder(idempotency_key, saved)
    }

    recordAnalyticsEvent(slug, { slug, type: 'order_placed', table_number: assignedTableNum })
    const response = NextResponse.json({ success: true, order: saved, session_token: finalSessionToken })
    response.cookies.set(`gastro_session_${slug}_${assignedTableNum}`, finalSessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60,
    })
    return response
  } catch (err: any) {
    if (idempotencyKeyStr && idempotencyLocked) {
      releaseIdempotencyLock(idempotencyKeyStr, err.message)
    }
    return NextResponse.json(
      {
        success: false,
        error: 'DATABASE_ERROR',
        message: err.message || 'No se pudo guardar la comanda en la base de datos. Por favor reintenta.',
      },
      { status: 500 }
    )
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      slug = 'burger-gourmet',
      orderId,
      status,
      table_number,
      tableNumber,
      expected_version,
      expectedVersion,
      version,
      actor_type,
      actorType,
      actor_id,
      actorId,
    } = body

    if (!orderId || !status) {
      return NextResponse.json({ error: 'Faltan parámetros orderId o status' }, { status: 400 })
    }

    const validStatuses: OrderStatus[] = [
      'pending_validation',
      'pending',
      'confirmed',
      'preparing',
      'ready',
      'delivered',
      'paid',
      'cancelled',
    ]
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: `Estado inválido: ${status}` }, { status: 400 })
    }

    const restaurant = await getRestaurantBySlug(slug)
    const restaurantId = getTargetRestaurantId(restaurant?.id, slug)

    const parsedExpectedVersion = (expected_version !== undefined && expected_version !== null)
      ? Number(expected_version)
      : ((expectedVersion !== undefined && expectedVersion !== null)
        ? Number(expectedVersion)
        : ((version !== undefined && version !== null) ? Number(version) : undefined))

    const effectiveTableNum = table_number ?? tableNumber

    const result = await transitionOrderStatus({
      orderId,
      restaurantId,
      slug,
      nextStatus: status,
      expectedVersion: parsedExpectedVersion,
      actorType: actor_type ?? actorType ?? 'waiter',
      actorId: actor_id ?? actorId,
      tableNumber: effectiveTableNum,
    })

    // Caso 1: Comanda no encontrada
    if (result.code === 'ORDER_NOT_FOUND' || result.error === 'ORDER_NOT_FOUND') {
      return NextResponse.json(
        { error: 'ORDER_NOT_FOUND', code: 'ORDER_NOT_FOUND', message: result.message || `Comanda con ID ${orderId} no encontrada` },
        { status: 404 }
      )
    }

    // Caso 2: Conflicto de Concurrencia Optimista (OCC 409)
    if (result.code === 'VERSION_CONFLICT') {
      return NextResponse.json(
        {
          error: 'VERSION_CONFLICT',
          code: 'VERSION_CONFLICT',
          message: result.message || 'Conflicto de concurrencia: la orden ya fue modificada por otro usuario',
          current_version: result.current_version,
          current_status: result.current_status,
        },
        { status: 409 }
      )
    }

    // Caso 3: Transición ilegal
    if (!result.success) {
      const errorMsg = result.message || result.error || `Transición inválida a ${status}`
      return NextResponse.json(
        {
          error: errorMsg,
          code: result.code || 'TRANSITION_INVALID',
          message: errorMsg,
          current_status: result.current_status,
        },
        { status: 400 }
      )
    }

    // Caso 4: Transición exitosa o idempotente
    return NextResponse.json({
      success: true,
      message: result.message || `Orden ${orderId} actualizada a ${status}`,
      order: result.order,
      version: result.version ?? result.order?.version,
      code: result.code,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const slug = searchParams.get('slug') || 'burger-gourmet'
    const { clearServerOrders } = await import('@/lib/server-state')
    clearServerOrders(slug)
    return NextResponse.json({ success: true, message: `Comandas eliminadas para ${slug}` })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
