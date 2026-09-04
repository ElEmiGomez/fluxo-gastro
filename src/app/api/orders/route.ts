import { NextRequest, NextResponse } from 'next/server'
import {
  checkRateLimit,
  sanitizeText,
  setTableOccupied,
  recordAnalyticsEvent,
  getIdempotentOrder,
  saveIdempotentOrder,
  acquireIdempotencyLock,
  completeIdempotencyLock,
  releaseIdempotencyLock,
  isValidOrderTransition,
} from '@/lib/server-state'
import {
  getRestaurantBySlug,
  validateSessionToken,
  createOrder,
  getRestaurantOrders,
  updateOrderStatus,
} from '@/lib/supabase/repository'
import { MOCK_PRODUCTS, MOCK_TABLES } from '@/lib/supabase/mock-fallback'
import { Order, OrderItem, OrderStatus } from '@/types/database.types'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const slug = searchParams.get('slug') || 'burger-gourmet'
    const restaurant = await getRestaurantBySlug(slug)
    const restaurantId = restaurant?.id || 'a1111111-1111-1111-1111-111111111111'
    const orders = await getRestaurantOrders(restaurantId, slug)
    return NextResponse.json({ orders })
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
    if (!checkRateLimit(rateLimitKey, 20, 60000)) {
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
    const restaurantId = restaurant_id || restaurant?.id || 'a1111111-1111-1111-1111-111111111111'

    // 2. Validación de Sesión de Mesa con UUID (Fase 1: Protección Anti-Solapamiento)
    let finalSessionToken = tokenToValidate
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
    } else {
      // Si no se proporcionó token (por ejemplo creación directa por personal en comandero), inicializar sesión activa
      const { createOrGetActiveSession } = await import('@/lib/supabase/repository')
      const newSession = await createOrGetActiveSession(restaurantId, slug, parsedTableNum)
      finalSessionToken = newSession.session_token
    }

    // Asegurar que la mesa pase a estado ocupado con su sesión activa
    setTableOccupied(slug, parsedTableNum)

    const orderId = `ord-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
    const now = new Date().toISOString()
    const tables = MOCK_TABLES[slug] || []
    const matchedTable = tables.find(t => t.id === table_id || t.table_number === parsedTableNum)
    const assignedTableNum = matchedTable ? matchedTable.table_number : parsedTableNum

    let computedTotal = 0

    const validItems: OrderItem[] = []
    const products = MOCK_PRODUCTS[slug] || []

    items.forEach((item: any, idx: number) => {
      const quantity = Math.max(1, parseInt(String(item.quantity || '1'), 10) || 1)
      const productId = String(item.product_id || '').trim()
      if (!productId) return

      const product = item.product || products.find(p => p.id === productId || p.id.replace('promo', 'prom') === productId)
      const itemPrice = product ? Number(product.price) || 0 : Number(item.price) || 0
      computedTotal += itemPrice * quantity

      const sanitizedNotes = item.notes ? sanitizeText(item.notes, 200) : null

      validItems.push({
        id: `oi-${Date.now()}-${idx}`,
        order_id: orderId,
        product_id: productId,
        quantity,
        notes: sanitizedNotes || null,
        product: product || {
          id: productId,
          restaurant_id: restaurant_id || 'a1111111-1111-1111-1111-111111111111',
          category_id: 'cat-1',
          name: sanitizeText(String(item.name || 'Plato Gourmet'), 100),
          description: '',
          price: itemPrice,
          image_url: item.image_url || null,
          model_3d_url: null,
          is_available: true,
        },
      })
    })

    if (validItems.length === 0) {
      if (idempotencyKeyStr && idempotencyLocked) releaseIdempotencyLock(idempotencyKeyStr, 'No valid items')
      return NextResponse.json(
        { error: 'No se encontraron productos válidos en la comanda' },
        { status: 400 }
      )
    }

    const initialStatus = requestedStatus || (created_by === 'waiter' ? 'pending' : 'pending_validation')

    const saved = await createOrder(restaurantId, slug, {
      table_number: assignedTableNum,
      session_token: finalSessionToken,
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
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { slug = 'burger-gourmet', orderId, status, table_number, tableNumber } = body
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

    // Buscar comanda existente estrictamente por UUID orderId
    const restaurant = await getRestaurantBySlug(slug)
    const restaurantId = restaurant?.id || 'a1111111-1111-1111-1111-111111111111'
    const orders = await getRestaurantOrders(restaurantId, slug)
    const existingOrder = orders.find(o => o.id === orderId)

    if (!existingOrder) {
      return NextResponse.json(
        { error: 'ORDER_NOT_FOUND', message: `Comanda con ID ${orderId} no encontrada` },
        { status: 404 }
      )
    }

    const currentStatus = existingOrder.status

    // Idempotencia: Si el estado solicitado es idéntico al actual, retornar HTTP 200
    if (currentStatus === status) {
      return NextResponse.json({
        success: true,
        message: `Orden ${orderId} ya se encuentra en estado ${status}`,
        order: existingOrder,
      })
    }

    // Validar transición legal en la máquina de estados formal
    if (!isValidOrderTransition(currentStatus, status)) {
      const errorMsg = `Transición inválida de ${currentStatus} a ${status}`
      return NextResponse.json(
        {
          error: errorMsg,
          code: 'TRANSITION_INVALID',
          message: errorMsg,
        },
        { status: 400 }
      )
    }

    const effectiveTableNum = table_number ?? tableNumber
    const result = await updateOrderStatus(slug, orderId, status, effectiveTableNum)
    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error || 'Error al actualizar orden',
          code: 'TRANSITION_INVALID',
          message: result.error || 'Error al actualizar orden',
        },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true, message: `Orden ${orderId} actualizada a ${status}` })
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
