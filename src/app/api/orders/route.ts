import { NextRequest, NextResponse } from 'next/server'
import {
  checkRateLimit,
  sanitizeText,
  setTableOccupied,
  recordAnalyticsEvent,
  getIdempotentOrder,
  saveIdempotentOrder,
} from '@/lib/server-state'
import {
  getRestaurantBySlug,
  validateSessionToken,
  createOrder,
  getRestaurantOrders,
  updateOrderStatus,
} from '@/lib/supabase/repository'
import { MOCK_PRODUCTS, MOCK_TABLES } from '@/lib/supabase/mock-fallback'
import { Order, OrderItem } from '@/types/database.types'

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

    // 0. Control de Idempotencia (Previene comandas duplicadas por mala conexión o doble clic)
    if (idempotency_key && typeof idempotency_key === 'string') {
      const cached = getIdempotentOrder(idempotency_key)
      if (cached) {
        return NextResponse.json({
          success: true,
          order: cached,
          idempotent: true,
          message: 'Comanda ya procesada previamente (Idempotency Key)',
        })
      }
    }

    const tokenToValidate = session_token || session_id

    // 1. Rate Limiting de seguridad
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local-client'
    const rateLimitKey = `order_${slug}_${clientIp}_${table_number}`
    if (!checkRateLimit(rateLimitKey, 20, 60000)) {
      return NextResponse.json(
        { error: 'Demasiadas solicitudes. Por favor espera unos momentos.' },
        { status: 429 }
      )
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'La comanda debe contener al menos 1 producto válido' },
        { status: 400 }
      )
    }

    const parsedTableNum = Math.max(1, parseInt(String(table_number || '1'), 10) || 1)
    const restaurant = await getRestaurantBySlug(slug)
    const restaurantId = restaurant_id || restaurant?.id || 'a1111111-1111-1111-1111-111111111111'

    // 2. Validación de Sesión de Mesa con UUID (Fase 1: Protección Anti-Solapamiento)
    if (tokenToValidate) {
      const sessionCheck = await validateSessionToken(restaurantId, slug, parsedTableNum, tokenToValidate)
      if (!sessionCheck.valid) {
        return NextResponse.json(
          {
            error: 'SESSION_EXPIRED',
            message: 'La sesión de esta mesa ha finalizado. Por favor escanea el código QR de nuevo.',
            reason: sessionCheck.reason,
          },
          { status: 403 }
        )
      }
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
      return NextResponse.json(
        { error: 'No se encontraron productos válidos en la comanda' },
        { status: 400 }
      )
    }

    const initialStatus = requestedStatus || (created_by === 'waiter' ? 'pending' : 'pending_validation')

    const saved = await createOrder(restaurantId, slug, {
      table_number: assignedTableNum,
      session_token: tokenToValidate,
      idempotency_key,
      status: initialStatus,
      total_amount: computedTotal,
      items: validItems,
    })

    if (idempotency_key && typeof idempotency_key === 'string') {
      saveIdempotentOrder(idempotency_key, saved)
    }

    recordAnalyticsEvent(slug, { slug, type: 'order_placed', table_number: assignedTableNum })
    return NextResponse.json({ success: true, order: saved })
  } catch (err: any) {
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

    const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: `Estado inválido: ${status}` }, { status: 400 })
    }

    const effectiveTableNum = table_number ?? tableNumber
    const result = await updateOrderStatus(slug, orderId, status, effectiveTableNum)
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
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
