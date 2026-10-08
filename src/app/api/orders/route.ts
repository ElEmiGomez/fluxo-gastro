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
  getServerProducts,
  setServerProducts,
} from '@/lib/server-state'
import {
  getRestaurantBySlug,
  validateSessionToken,
  createOrder,
  getRestaurantOrders,
  updateOrderStatus,
  transitionOrderStatus,
  getTargetRestaurantId,
} from '@/lib/supabase/repository'
import { createServerClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import { MOCK_PRODUCTS, MOCK_TABLES } from '@/lib/supabase/mock-fallback'
import { PRODUCT_NAMES } from '@/lib/i18n'
import { deduplicateProducts } from '@/lib/category-matcher'
import { Order, OrderItem, OrderStatus, Product } from '@/types/database.types'
import { verifyStaffRequest } from '@/lib/auth/pin-security'

const isUuid = (str?: string | null): boolean =>
  Boolean(str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str))

const cleanStr = (s?: string | null): string =>
  String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim()

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const slug = searchParams.get('slug') || 'burger-gourmet'
    const restaurant = await getRestaurantBySlug(slug)
    const restaurantId = getTargetRestaurantId(restaurant?.id, slug)
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

    // 2. Validación de Sesión de Mesa con UUID (Fase 1: Protección Anti-Solapamiento)
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
      const { createOrGetActiveSession } = await import('@/lib/supabase/repository')
      const newSession = await createOrGetActiveSession(restaurantId, slug, parsedTableNum)
      finalSessionToken = newSession.session_token
      tableSessionPk = newSession.id
    }

    // Asegurar que la mesa pase a estado ocupado con su sesión activa
    setTableOccupied(slug, parsedTableNum, finalSessionToken)

    const tables = MOCK_TABLES[slug] || []
    const matchedTable = tables.find(t => t.id === table_id || t.table_number === parsedTableNum)
    const assignedTableNum = matchedTable ? matchedTable.table_number : parsedTableNum

    let computedTotal = 0

    const validItems: OrderItem[] = []
    let catalogProducts: Product[] = deduplicateProducts([...(getServerProducts(slug) || []), ...(MOCK_PRODUCTS[slug] || [])])

    // Consultar catálogo en Supabase para sincronización total con productos en base de datos
    const supabase = createServerClient()
    if (supabase && isSupabaseConfigured()) {
      try {
        const { data: dbProds } = await supabase
          .from('products')
          .select('*')
          .eq('restaurant_id', restaurantId)
        if (dbProds && dbProds.length > 0) {
          catalogProducts = deduplicateProducts([...catalogProducts, ...dbProds])
          setServerProducts(slug, catalogProducts)
        }
      } catch (e) {
        console.warn('Could not fetch products from Supabase in /api/orders, using fallback:', e)
      }
    }

    for (let idx = 0; idx < items.length; idx++) {
      const item = items[idx]
      const quantity = Math.max(1, parseInt(String(item.quantity || '1'), 10) || 1)
      const productId = String(
        item.product_id ||
        item.id ||
        item.productId ||
        (item.product && item.product.id) ||
        ''
      ).trim()
      const itemName = String(
        item.name ||
        (item.product && item.product.name) ||
        ''
      ).trim()
      const itemPrice = Number(item.price ?? (item.product && item.product.price) ?? 0)

      // Si no hay ni ID ni nombre, omitir
      if (!productId && !itemName) continue

      const targetClean = cleanStr(itemName)

      // 1. Coincidencia por ID exacto, alias de promoción o mapeo de ID legado
      let catalogProduct = catalogProducts.find(p =>
        (productId && p.id === productId) ||
        (productId && p.id.toLowerCase() === productId.toLowerCase()) ||
        (productId === 'p-promo-1' && (p.id === 'b0000000-0000-0000-0000-000000000001' || p.name.includes('Combo Pareja'))) ||
        (productId === 'p-bur-1' && (p.id === 'b0000000-0000-0000-0000-000000000002' || p.name.includes('Bacon Cheese'))) ||
        (productId && p.id.replace('promo', 'prom') === productId) ||
        (productId && p.id.replace('prom', 'promo') === productId) ||
        (productId && p.id.replace('prom', 'promo') === productId.replace('prom', 'promo'))
      )

      // 2. Coincidencia por nombre exacto o normalizado
      if (!catalogProduct && targetClean) {
        catalogProduct = catalogProducts.find(p => {
          const pClean = cleanStr(p.name)
          return pClean === targetClean ||
            (targetClean.length >= 5 && (pClean.includes(targetClean) || targetClean.includes(pClean)))
        })
      }

      // 3. Fallback en Supabase (por UUID o por búsqueda aproximada de nombre)
      if (!catalogProduct && supabase && isSupabaseConfigured()) {
        try {
          if (isUuid(productId)) {
            const { data: dbProd } = await supabase
              .from('products')
              .select('*')
              .eq('id', productId)
              .maybeSingle()
            if (dbProd) {
              catalogProduct = dbProd
              catalogProducts.push(dbProd)
            }
          }
          if (!catalogProduct && itemName) {
            const { data: dbNameProds } = await supabase
              .from('products')
              .select('*')
              .eq('restaurant_id', restaurantId)
              .limit(50)
            if (dbNameProds && dbNameProds.length > 0) {
              const matched = dbNameProds.find((dp: any) => {
                const dpClean = cleanStr(dp.name)
                return dpClean === targetClean ||
                  (targetClean.length >= 5 && (dpClean.includes(targetClean) || targetClean.includes(dpClean)))
              })
              if (matched) {
                catalogProduct = matched
                catalogProducts.push(matched)
              }
            }
          }
        } catch (findErr) {
          console.warn('[Orders POST] Error buscando producto en Supabase:', findErr)
        }
      }

      // 4. Fallback en memoria del servidor
      if (!catalogProduct) {
        const memProds = getServerProducts(slug)
        catalogProduct = memProds.find(p =>
          (productId && p.id === productId) ||
          (targetClean && cleanStr(p.name) === targetClean)
        )
      }

      // 5. Fallback en todos los restaurantes de MOCK_PRODUCTS
      if (!catalogProduct) {
        for (const otherSlug of Object.keys(MOCK_PRODUCTS)) {
          const list = MOCK_PRODUCTS[otherSlug] || []
          const found = list.find(p =>
            (productId && p.id === productId) ||
            (targetClean && cleanStr(p.name) === targetClean) ||
            (targetClean && targetClean.length >= 5 && (cleanStr(p.name).includes(targetClean) || targetClean.includes(cleanStr(p.name))))
          )
          if (found) {
            catalogProduct = found
            break
          }
        }
      }

      // 6. Fallback en diccionario de traducciones multilingüe i18n
      if (!catalogProduct && (targetClean || productId)) {
        for (const [tId, tObj] of Object.entries(PRODUCT_NAMES)) {
          const isIdMatch = Boolean(productId && (tId === productId || tId.toLowerCase() === productId.toLowerCase()))
          const isNameMatch = Boolean(targetClean && Object.values(tObj).some(tName => {
            const cName = cleanStr(tName)
            return cName === targetClean || (targetClean.length >= 5 && (cName.includes(targetClean) || targetClean.includes(cName)))
          }))
          if (isIdMatch || isNameMatch) {
            const found = catalogProducts.find(p => p.id === tId) ||
              Object.values(MOCK_PRODUCTS).flat().find(p => p.id === tId)
            if (found) {
              catalogProduct = found
              break
            }
          }
        }
      }

      // 7. Fallback dinámico resiliente: plato in-situ / plato personalizado / plato de carta activa
      if (!catalogProduct && (itemName || productId)) {
        const resolvedPrice = itemPrice > 0 ? itemPrice : 0
        catalogProduct = {
          id: (productId && productId !== 'unknown' && productId !== 'p-unknown') ? productId : `p-dyn-${Date.now()}-${idx}`,
          restaurant_id: restaurantId,
          category_id: (item.product && item.product.category_id) || 'cat-1',
          name: sanitizeText(itemName || 'Plato Especial', 100),
          description: sanitizeText((item.product && item.product.description) || '', 200),
          price: resolvedPrice,
          image_url: (item.product && item.product.image_url) || null,
          model_3d_url: null,
          is_available: true,
        }
        catalogProducts.push(catalogProduct)
        setServerProducts(slug, catalogProducts)
      }

      if (!catalogProduct) {
        if (idempotencyKeyStr && idempotencyLocked) releaseIdempotencyLock(idempotencyKeyStr, 'Producto no encontrado')
        return NextResponse.json(
          { error: `El producto "${itemName || productId}" no está disponible o no fue encontrado en la carta.` },
          { status: 400 }
        )
      }

      // Validación estricta de disponibilidad
      if (catalogProduct.is_available === false) {
        if (idempotencyKeyStr && idempotencyLocked) releaseIdempotencyLock(idempotencyKeyStr, 'Producto agotado')
        return NextResponse.json(
          { error: `El producto "${catalogProduct.name}" no está disponible actualmente (Agotado).` },
          { status: 400 }
        )
      }

      // Cortesía ("Invita la casa"): Solo autorizada para personal de sala autenticado
      const isStaffSender = verifyStaffRequest(req, slug, ['comandero', 'admin', 'kitchen'])
      const isComplimentary = Boolean(isStaffSender && (item.is_complimentary || (item.notes && item.notes.includes('[🎁 INVITACIÓN DE LA CASA]'))))

      const itemPriceToCharge = isComplimentary ? 0 : (Number(catalogProduct.price) || 0)
      computedTotal += itemPriceToCharge * quantity

      const sanitizedNotes = item.notes ? sanitizeText(item.notes, 200) : null

      validItems.push({
        id: `oi-${idx}`,
        order_id: '',
        product_id: catalogProduct.id,
        quantity,
        notes: sanitizedNotes || null,
        product: catalogProduct,
        is_complimentary: isComplimentary,
        course: item.course || 'first',
      })
    }

    if (validItems.length === 0) {
      if (idempotencyKeyStr && idempotencyLocked) releaseIdempotencyLock(idempotencyKeyStr, 'No valid items')
      return NextResponse.json(
        { error: 'No se encontraron productos válidos en la comanda. Por favor revisa la selección.' },
        { status: 400 }
      )
    }

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
