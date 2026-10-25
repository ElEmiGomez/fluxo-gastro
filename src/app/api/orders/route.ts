import { NextRequest, NextResponse } from 'next/server'
import {
  checkRateLimit,
  sanitizeText,
  setTableOccupied,
  recordAnalyticsEvent,
  saveIdempotentOrder,
  acquireIdempotencyLock,
  completeIdempotencyLock,
  releaseIdempotencyLock,
  getServerProducts,
  setServerProducts,
  resolveCanonicalProductId,
  getProductAvailabilityOverrides,
  getServerOrders,
  findServerOrderById,
  getCachedOrderItems,
  saveCachedOrderItems,
  addServerOrder,
} from '@/lib/server-state'
import {
  getRestaurantBySlug,
  validateSessionToken,
  createOrder,
  getRestaurantOrders,
  transitionOrderStatus,
  getTargetRestaurantId,
} from '@/lib/supabase/repository'
import { createServerClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import { MOCK_PRODUCTS, MOCK_TABLES } from '@/lib/supabase/mock-fallback'
import { inferCourseType, deduplicateProducts } from '@/lib/category-matcher'
import { updateOrderCourseTags, resolvePendingDessertInOrder, sweepTableOrdersToPaid } from '@/lib/supabase/repositories/orders.repository'
import {
  TAG_DRINK_SERVED,
  TAG_FOOD_READY,
  TAG_STARTER_READY,
  TAG_STARTER_SERVED,
  TAG_MAIN_FIRED,
  TAG_MAIN_COOKING,
  TAG_MAIN_READY,
  TAG_MAIN_SERVED,
  TAG_DESSERT_READY,
  TAG_DESSERT_SERVED,
  TAG_DESSERT_FIRED,
  TAG_DESSERT_COOKING,
  isDrinkItem,
  isFoodItem,
  isStarterItem,
  isMainItem,
  isDessertItem,
  orderHasDesserts,
  orderHasMains,
  isStarterServed,
  isMainServed,
  isDessertServed,
  areOrderStartersServed,
  areOrderMainsServed,
  areOrderDessertsServed,
  areAllOrderCoursesDelivered,
  areAllKitchenCoursesCompleted,
  orderHasPendingDesserts,
  isDrinkOnlyOrder,
  hydrateOrderItemsWithCatalog,
} from '@/lib/course-utils'
import { PRODUCT_NAMES } from '@/lib/i18n'
import { Order, OrderItem, OrderStatus, Product } from '@/types/database.types'
import { verifyStaffRequest } from '@/lib/auth/pin-security'
import { getDailyMenu, isDailyMenuActive } from '@/lib/supabase/repositories/daily-menu.repository'

const isUuid = (str?: string | null): boolean =>
  Boolean(str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str))

const cleanStr = (s?: string | null): string =>
  String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim()

function ensureHydratedOrder(order: Order | undefined, slug: string): Order | undefined {
  if (!order) return undefined
  const catalogProducts = deduplicateProducts([
    ...(getServerProducts(slug) || []),
    ...(MOCK_PRODUCTS[slug] || []),
  ])
  const memOrder = findServerOrderById(order.id) || getServerOrders(slug, true).find(o => o.id === order.id)
  const cachedItems = getCachedOrderItems(order.id)
  const referenceItems =
    memOrder?.order_items && memOrder.order_items.length > 0
      ? memOrder.order_items
      : cachedItems && cachedItems.length > 0
        ? cachedItems
        : []
  const hydratedItems = hydrateOrderItemsWithCatalog(
    order.order_items || [],
    catalogProducts,
    referenceItems,
    (order as any).notes || (memOrder as any)?.notes
  )
  const hydrated: Order = {
    ...order,
    order_items: hydratedItems,
  }
  if (hydratedItems.length > 0) {
    saveCachedOrderItems(order.id, hydratedItems)
    addServerOrder(slug, hydrated, true)
  }
  return hydrated
}

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const slug = searchParams.get('slug') || 'burger-gourmet'
    const restaurant = await getRestaurantBySlug(slug)
    const restaurantId = getTargetRestaurantId(restaurant?.id, slug)
    const tableParam = searchParams.get('table') || searchParams.get('table_number')
    const parsedT = tableParam ? parseInt(tableParam, 10) : NaN
    const orders = await getRestaurantOrders(restaurantId, slug, !isNaN(parsedT) ? parsedT : undefined)
    let returnedOrders = orders
    if (!isNaN(parsedT)) {
      returnedOrders = orders.filter(o => Number(o.table_number) === parsedT || Number(o.table?.table_number) === parsedT)
    }
    const catalogProducts = deduplicateProducts([
      ...(getServerProducts(slug) || []),
      ...(MOCK_PRODUCTS[slug] || []),
    ])
    returnedOrders = returnedOrders.map(ord => ({
      ...ord,
      order_items: hydrateOrderItemsWithCatalog(
        ord.order_items || [],
        catalogProducts,
        getCachedOrderItems(ord.id),
        (ord as any).notes
      ),
    }))

    // Protección Anti-Zombis Post-Pago en GET /api/orders:
    // Si una mesa tiene órdenes recién pagadas ('paid') en la sesión actual y NO existe un nuevo pedido
    // creado posteriormente, ninguna orden previa de esa mesa puede quedar colgada en 'ready'/'preparing'/'pending'/'delivered'.
    const allServedNotes = `${TAG_DRINK_SERVED} ${TAG_STARTER_READY} ${TAG_STARTER_SERVED} ${TAG_MAIN_FIRED} ${TAG_MAIN_READY} ${TAG_MAIN_SERVED} ${TAG_DESSERT_FIRED} ${TAG_DESSERT_READY} ${TAG_DESSERT_SERVED}`
    const tablesWithRecentPaid = new Map<number, number>()
    returnedOrders.forEach(o => {
      const tNum = Number(o.table_number || o.table?.table_number)
      if (!isNaN(tNum) && o.status === 'paid') {
        const paidTs = new Date(o.updated_at || o.created_at || 0).getTime() || Date.now()
        const prevMax = tablesWithRecentPaid.get(tNum) || 0
        if (paidTs > prevMax) tablesWithRecentPaid.set(tNum, paidTs)
      }
    })

    const tablesToSweep = new Set<number>()
    returnedOrders = returnedOrders.map(o => {
      const tNum = Number(o.table_number || o.table?.table_number)
      const latestPaidTs = tablesWithRecentPaid.get(tNum)
      if (
        latestPaidTs &&
        o.status !== 'paid' &&
        o.status !== 'cancelled' &&
        o.status !== 'pending_validation'
      ) {
        const ordCreatedTs = new Date(o.created_at || 0).getTime()
        const hasNewerOrderAfterPaid = returnedOrders.some(other => {
          const otherT = Number(other.table_number || other.table?.table_number)
          const otherCreated = new Date(other.created_at || 0).getTime()
          return otherT === tNum && other.status !== 'paid' && other.status !== 'cancelled' && otherCreated > latestPaidTs
        })
        if (!hasNewerOrderAfterPaid && (isNaN(ordCreatedTs) || ordCreatedTs <= latestPaidTs)) {
          tablesToSweep.add(tNum)
          return {
            ...o,
            status: 'paid' as OrderStatus,
            notes: `${(o as any).notes || ''} ${allServedNotes}`.trim(),
            order_items: hydrateOrderItemsWithCatalog(
              o.order_items || [],
              catalogProducts,
              getCachedOrderItems(o.id),
              `${(o as any).notes || ''} ${allServedNotes}`.trim()
            ),
          }
        }
      }
      return o
    })

    if (tablesToSweep.size > 0) {
      tablesToSweep.forEach(tNum => {
        sweepTableOrdersToPaid(restaurantId, slug, tNum).catch(() => {})
      })
    }

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

    const terminalOrderIds = returnedOrders
      .filter(
        o =>
          ['cancelled', 'paid', 'delivered'].includes(o.status) ||
          areAllKitchenCoursesCompleted(o) ||
          isDrinkOnlyOrder(o)
      )
      .map(o => o.id)

    const isKitchenRole = searchParams.get('role') === 'kitchen' || searchParams.get('source') === 'kitchen'
    if (isKitchenRole) {
      returnedOrders = returnedOrders.filter(o => {
        if (['cancelled', 'paid', 'delivered'].includes(o.status)) return false
        if (areAllKitchenCoursesCompleted(o)) return false
        if (isDrinkOnlyOrder(o)) return false
        const tNum = Number(o.table_number || o.table?.table_number)
        if (!isNaN(tNum) && tablesWithRecentPaid.has(tNum)) return false
        return true
      })
    }

    return NextResponse.json(
      {
        orders: returnedOrders,
        terminal_order_ids: terminalOrderIds,
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
            order: ensureHydratedOrder(lock.order, slug),
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
      const rawProductId = String(
        item.product_id ||
        item.id ||
        item.productId ||
        (item.product && item.product.id) ||
        ''
      ).trim()
      const canonicalUuid = resolveCanonicalProductId(rawProductId)
      const productId = canonicalUuid || rawProductId
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
        (productId && (p.id === productId || p.id.toLowerCase() === productId.toLowerCase())) ||
        (rawProductId && (p.id === rawProductId || p.id.toLowerCase() === rawProductId.toLowerCase())) ||
        (canonicalUuid && p.id === canonicalUuid) ||
        (resolveCanonicalProductId(p.id) === canonicalUuid) ||
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

      // 6.5. Validación de Menú del Día Dinámico con precio cerrado oficial
      if (!catalogProduct && (productId?.startsWith('daily-menu-') || rawProductId?.startsWith('daily-menu-') || targetClean.includes('menu del dia') || targetClean.includes('menú del día'))) {
        try {
          const dailyMenuData = await getDailyMenu(restaurantId, slug)
          if (dailyMenuData && isDailyMenuActive(dailyMenuData)) {
            catalogProduct = {
              id: productId || `daily-menu-${dailyMenuData.id}`,
              restaurant_id: restaurantId,
              category_id: 'cat-menu-del-dia',
              name: dailyMenuData.title,
              description: 'Menú del Día (4 pasos incluidos)',
              price: Number(dailyMenuData.fixed_price) || 14.5,
              image_url: null,
              model_3d_url: null,
              is_available: true,
            }
          }
        } catch (dmErr) {
          console.warn('[Orders POST] Error resolving daily menu:', dmErr)
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

      // Cortesía ("Invita la casa", Canje de Puntos de Fidelización o Componente de Pack/Menú)
      const isStaffSender = verifyStaffRequest(req, slug, ['comandero', 'admin', 'kitchen'])
      const isLoyaltyRedeemed = Boolean(
        (Number(item.loyalty_points_redeemed) > 0) ||
        (item.notes && item.notes.includes('[🎁 Canje Fidelización'))
      )
      const isPackHeader = Boolean(
        item.is_pack_header ||
        (item.notes && item.notes.includes('[PACK_HEADER]')) ||
        (String(item.product_id || '').startsWith('daily-menu-') && !item.is_pack_component)
      )
      const isPackComponent = Boolean(
        !isPackHeader &&
        (item.is_pack_component ||
        (item.notes && !item.notes.includes('[PACK_HEADER]') && (
          item.notes.includes('[Incluido en Menú') ||
          item.notes.includes('[Incluido en Promo') ||
          item.notes.includes('[Menú del Día #') ||
          item.notes.includes('[Promo Pareja') ||
          item.notes.includes('[PACK_SUBITEM]')
        )))
      )
      const isComplimentary = Boolean(
        !isPackHeader &&
        ((isStaffSender && (item.is_complimentary || (item.notes && item.notes.includes('[🎁 INVITACIÓN DE LA CASA]')))) ||
        isLoyaltyRedeemed ||
        isPackComponent)
      )

      let itemPriceToCharge = isComplimentary ? 0 : (Number(catalogProduct.price) || 0)
      if (!isComplimentary && catalogProduct.price_type === 'weight') {
        const weight = Number(item.weight_grams) || (item.notes?.match(/(\d+)\s*g/i)?.[1] ? Number(item.notes.match(/(\d+)\s*g/i)[1]) : (item.weightGrams ? Number(item.weightGrams) : 1000))
        const divisor = catalogProduct.price_unit === 'kg' ? 1000 : 100
        const computedWeightPrice = Number(((Number(catalogProduct.price) * weight) / divisor).toFixed(2))
        if (typeof item.price === 'number' && item.price > 0 && Math.abs(item.price - computedWeightPrice) < 0.1) {
          itemPriceToCharge = item.price
        } else {
          itemPriceToCharge = computedWeightPrice
        }
      }
      computedTotal += itemPriceToCharge * quantity

      const sanitizedNotes = item.notes ? sanitizeText(item.notes, 200) : null

      const canonicalProdId = resolveCanonicalProductId(catalogProduct.id) || catalogProduct.id

      validItems.push({
        id: `oi-${idx}`,
        order_id: '',
        product_id: canonicalProdId,
        quantity,
        price: itemPriceToCharge,
        notes: sanitizedNotes || null,
        product: {
          ...catalogProduct,
          price: itemPriceToCharge,
          id: canonicalProdId,
        },
        is_complimentary: isComplimentary,
        weight_grams: item.weight_grams || (catalogProduct.price_type === 'weight' ? (Number(item.notes?.match(/(\d+)\s*g/i)?.[1]) || 300) : undefined),
        loyalty_points_redeemed: item.loyalty_points_redeemed ? Number(item.loyalty_points_redeemed) : undefined,
        course: (item.course && ['first', 'second', 'dessert', 'drink'].includes(item.course))
          ? item.course
          : inferCourseType(catalogProduct),
        is_pack_header: Boolean(item.is_pack_header || (item.notes && item.notes.includes('[PACK_HEADER]'))),
        is_pack_component: isPackComponent,
        pack_id: item.pack_id,
      })
    }

    if (validItems.length === 0) {
      if (idempotencyKeyStr && idempotencyLocked) releaseIdempotencyLock(idempotencyKeyStr, 'No valid items')
      return NextResponse.json(
        { error: 'No se encontraron productos válidos en la comanda. Por favor revisa la selección.' },
        { status: 400 }
      )
    }

    const initialStatus = requestedStatus || (created_by === 'waiter' ? (isDrinkOnlyOrder(validItems as any) ? 'ready' : 'pending') : 'pending_validation')

    const saved = await createOrder(restaurantId, slug, {
      table_number: assignedTableNum,
      session_token: finalSessionToken,
      table_session_id: tableSessionPk,
      idempotency_key,
      status: initialStatus,
      total_amount: computedTotal,
      items: validItems,
    })

    // Si la comanda incluye canjes de puntos y se indicó loyalty_email, asegurar el escrow sin duplicar
    if (body.loyalty_email && validItems.some(i => (i.loyalty_points_redeemed || 0) > 0)) {
      try {
        const totalPointsToHold = validItems.reduce((acc, i) => acc + (Number(i.loyalty_points_redeemed) || 0) * (i.quantity || 1), 0)
        if (totalPointsToHold > 0) {
          const { holdLoyaltyPoints, getLoyaltyProfile } = await import('@/lib/supabase/repositories/loyalty.repository')
          const profile = await getLoyaltyProfile(slug, body.loyalty_email)
          const currentlyHeld = profile?.held_points || 0
          if (currentlyHeld < totalPointsToHold) {
            const deltaPoints = totalPointsToHold - currentlyHeld
            await holdLoyaltyPoints(slug, {
              email: body.loyalty_email,
              points: deltaPoints,
              tableNumber: assignedTableNum,
              sessionToken: finalSessionToken,
            })
          }
        }
      } catch (escrowErr) {
        console.warn('[Orders POST] Error registrando retención de puntos:', escrowErr)
      }
    }

    const hydratedSaved = ensureHydratedOrder(saved, slug) || saved

    if (idempotencyKeyStr && idempotencyLocked) {
      completeIdempotencyLock(idempotencyKeyStr, hydratedSaved)
    } else if (idempotency_key && typeof idempotency_key === 'string') {
      saveIdempotentOrder(idempotency_key, hydratedSaved)
    }

    recordAnalyticsEvent(slug, { slug, type: 'order_placed', table_number: assignedTableNum })
    const response = NextResponse.json({ success: true, order: hydratedSaved, session_token: finalSessionToken })
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

    const targetOrderId = orderId || body.id || body.order_id

    // Blindaje de Seguridad RBAC (AGENTS.md):
    // Mutaciones de personal y cocina requieren sesión válida de staff.
    // Únicamente la elección de postre comodín (resolve_pending_dessert) está permitida al comensal.
    const isDinerAction = body.action === 'resolve_pending_dessert'
    if (!isDinerAction && !verifyStaffRequest(req, slug, ['comandero', 'kitchen', 'admin'])) {
      return NextResponse.json(
        { error: 'No autorizado. Se requiere sesión de personal para mutar comandas.' },
        { status: 401 }
      )
    }

    // GESTIÓN DE ACCIONES DE TIEMPOS GASTRONÓMICOS (ESTACIONES DE SALA Y COCINA)
    if (body.action === 'serve_drinks') {
      if (!targetOrderId) {
        return NextResponse.json({ error: 'Falta orderId' }, { status: 400 })
      }
      const tagRes = await updateOrderCourseTags(slug, targetOrderId, TAG_DRINK_SERVED, isDrinkItem)
      if (!tagRes.success) {
        return NextResponse.json({ error: tagRes.error || 'Error al marcar bebidas como servidas' }, { status: 404 })
      }

      const currentOrder = ensureHydratedOrder(tagRes.order, slug)
      if (currentOrder && currentOrder.status !== 'paid' && currentOrder.status !== 'cancelled') {
        const isDrinkOnly = isDrinkOnlyOrder(currentOrder)
        const allCoursesDone = areAllOrderCoursesDelivered(currentOrder)

        if (isDrinkOnly || allCoursesDone) {
          const restaurant = await getRestaurantBySlug(slug)
          const restaurantId = getTargetRestaurantId(restaurant?.id, slug)
          const transRes = await transitionOrderStatus({
            orderId: targetOrderId,
            restaurantId,
            slug,
            nextStatus: 'delivered',
            actorType: 'waiter',
          })
          return NextResponse.json({
            success: true,
            order: ensureHydratedOrder(transRes.order || currentOrder, slug),
            message: 'Bebidas entregadas y comanda completada en mesa',
          })
        }
      }

      return NextResponse.json({
        success: true,
        order: currentOrder,
        message: 'Bebidas marcadas como servidas',
      })
    }

    if (body.action === 'ready_starters') {
      if (!targetOrderId) {
        return NextResponse.json({ error: 'Falta orderId' }, { status: 400 })
      }
      const tagRes = await updateOrderCourseTags(slug, targetOrderId, TAG_STARTER_READY, isStarterItem, { skipBroadcast: true })
      if (!tagRes.success) {
        return NextResponse.json({ error: tagRes.error || 'Error al marcar entradas listas' }, { status: 404 })
      }
      const transRes = await transitionOrderStatus({
        orderId: targetOrderId,
        slug,
        nextStatus: 'ready',
        actorType: 'kitchen',
      })
      const finalOrder = ensureHydratedOrder(
        transRes.order || (tagRes.order ? { ...tagRes.order, status: 'ready' } : tagRes.order),
        slug
      )
      return NextResponse.json({ success: true, order: finalOrder, message: 'Entradas listas para retirar en cocina' })
    }

    if (body.action === 'fire_mains') {
      if (!targetOrderId) {
        return NextResponse.json({ error: 'Falta orderId' }, { status: 400 })
      }
      const tagRes = await updateOrderCourseTags(slug, targetOrderId, TAG_MAIN_FIRED, isMainItem, { skipBroadcast: true })
      if (!tagRes.success) {
        return NextResponse.json({ error: tagRes.error || 'Error al marchar principales' }, { status: 404 })
      }
      const transRes = await transitionOrderStatus({
        orderId: targetOrderId,
        slug,
        nextStatus: 'preparing',
        actorType: 'waiter',
        forceAllowReactivation: true,
      })
      const finalOrder = ensureHydratedOrder(
        transRes.order || (tagRes.order ? { ...tagRes.order, status: 'preparing' } : tagRes.order),
        slug
      )
      return NextResponse.json({ success: true, order: finalOrder, message: 'Platos principales marchados a cocina' })
    }

    if (body.action === 'start_mains') {
      if (!targetOrderId) {
        return NextResponse.json({ error: 'Falta orderId' }, { status: 400 })
      }
      const tagRes = await updateOrderCourseTags(slug, targetOrderId, TAG_MAIN_COOKING, isMainItem, { skipBroadcast: true })
      if (!tagRes.success) {
        return NextResponse.json({ error: tagRes.error || 'Error al iniciar principales' }, { status: 404 })
      }
      const transRes = await transitionOrderStatus({
        orderId: targetOrderId,
        slug,
        nextStatus: 'preparing',
        actorType: 'kitchen',
        forceAllowReactivation: true,
      })
      const finalOrder = ensureHydratedOrder(
        transRes.order || (tagRes.order ? { ...tagRes.order, status: 'preparing' } : tagRes.order),
        slug
      )
      return NextResponse.json({ success: true, order: finalOrder, message: 'Preparación de platos principales iniciada' })
    }

    if (body.action === 'ready_mains') {
      if (!targetOrderId) {
        return NextResponse.json({ error: 'Falta orderId' }, { status: 400 })
      }
      const tagRes = await updateOrderCourseTags(slug, targetOrderId, TAG_MAIN_READY, isMainItem, { skipBroadcast: true })
      if (!tagRes.success) {
        return NextResponse.json({ error: tagRes.error || 'Error al marcar principales listos' }, { status: 404 })
      }
      const transRes = await transitionOrderStatus({
        orderId: targetOrderId,
        slug,
        nextStatus: 'ready',
        actorType: 'kitchen',
      })
      const finalOrder = ensureHydratedOrder(
        transRes.order || (tagRes.order ? { ...tagRes.order, status: 'ready' } : tagRes.order),
        slug
      )
      return NextResponse.json({ success: true, order: finalOrder, message: 'Platos principales listos para retirar en cocina' })
    }

    if (body.action === 'start_desserts') {
      if (!targetOrderId) {
        return NextResponse.json({ error: 'Falta orderId' }, { status: 400 })
      }
      const tagRes = await updateOrderCourseTags(slug, targetOrderId, TAG_DESSERT_COOKING, isDessertItem, { skipBroadcast: true })
      if (!tagRes.success) {
        return NextResponse.json({ error: tagRes.error || 'Error al iniciar postres' }, { status: 404 })
      }
      const transRes = await transitionOrderStatus({
        orderId: targetOrderId,
        slug,
        nextStatus: 'preparing',
        actorType: 'kitchen',
        forceAllowReactivation: true,
      })
      const finalOrder = ensureHydratedOrder(
        transRes.order || (tagRes.order ? { ...tagRes.order, status: 'preparing' } : tagRes.order),
        slug
      )
      return NextResponse.json({ success: true, order: finalOrder, message: 'Preparación de postres iniciada' })
    }

    if (body.action === 'deliver_starters') {
      if (!targetOrderId) {
        return NextResponse.json({ error: 'Falta orderId' }, { status: 400 })
      }
      const tagRes = await updateOrderCourseTags(
        slug,
        targetOrderId,
        `${TAG_STARTER_READY} ${TAG_STARTER_SERVED}`,
        isStarterItem,
        { skipBroadcast: false }
      )
      if (!tagRes.success) {
        return NextResponse.json({ error: tagRes.error || 'Error al marcar entradas entregadas' }, { status: 404 })
      }

      const currentOrder = ensureHydratedOrder(tagRes.order, slug)
      let finalOrder = currentOrder
      if (currentOrder && currentOrder.status !== 'paid' && currentOrder.status !== 'cancelled') {
        const hasMains = orderHasMains(currentOrder)
        const mainsDone = (currentOrder.order_items || []).filter(isMainItem).every(m => isMainServed(m, currentOrder))
        const hasDesserts = orderHasDesserts(currentOrder)
        const dessertsDone = (currentOrder.order_items || []).filter(isDessertItem).every(d => isDessertServed(d, currentOrder))

        if ((hasMains && !mainsDone) || (hasDesserts && !dessertsDone) || !areAllOrderCoursesDelivered(currentOrder)) {
          const transRes = await transitionOrderStatus({
            orderId: targetOrderId,
            slug,
            nextStatus: (hasMains && !mainsDone) || (hasDesserts && !dessertsDone) ? 'preparing' : 'delivered',
            actorType: 'waiter',
            forceAllowReactivation: true,
          })
          finalOrder = ensureHydratedOrder(
            transRes.order || (currentOrder ? { ...currentOrder, status: 'preparing' } : currentOrder),
            slug
          )
        } else {
          const transRes = await transitionOrderStatus({
            orderId: targetOrderId,
            slug,
            nextStatus: 'delivered',
            actorType: 'waiter',
          })
          finalOrder = ensureHydratedOrder(
            transRes.order || (currentOrder ? { ...currentOrder, status: 'delivered' } : currentOrder),
            slug
          )
        }
      }

      return NextResponse.json({ success: true, order: finalOrder, message: 'Entradas entregadas en mesa' })
    }

    if (body.action === 'deliver_mains') {
      if (!targetOrderId) {
        return NextResponse.json({ error: 'Falta orderId' }, { status: 400 })
      }
      await updateOrderCourseTags(
        slug,
        targetOrderId,
        `${TAG_STARTER_READY} ${TAG_STARTER_SERVED}`,
        isStarterItem,
        { skipBroadcast: false }
      )
      const tagRes = await updateOrderCourseTags(
        slug,
        targetOrderId,
        `${TAG_MAIN_FIRED} ${TAG_MAIN_READY} ${TAG_MAIN_SERVED}`,
        isMainItem,
        { skipBroadcast: false }
      )
      if (!tagRes.success) {
        return NextResponse.json({ error: tagRes.error || 'Error al marcar principales entregados' }, { status: 404 })
      }
      const currentOrder = ensureHydratedOrder(tagRes.order, slug)
      let finalOrder = currentOrder
      if (currentOrder && currentOrder.status !== 'paid' && currentOrder.status !== 'cancelled') {
        const hasDesserts = orderHasDesserts(currentOrder)
        const dessertsDone = areOrderDessertsServed(currentOrder)
        const allCoursesDone = areAllOrderCoursesDelivered(currentOrder)

        if (allCoursesDone || (!hasDesserts || dessertsDone)) {
          const transRes = await transitionOrderStatus({
            orderId: targetOrderId,
            slug,
            nextStatus: 'delivered',
            actorType: 'waiter',
          })
          finalOrder = ensureHydratedOrder(
            transRes.order || { ...currentOrder, status: 'delivered' },
            slug
          )
        } else {
          const transRes = await transitionOrderStatus({
            orderId: targetOrderId,
            slug,
            nextStatus: 'preparing',
            actorType: 'waiter',
            forceAllowReactivation: true,
          })
          finalOrder = ensureHydratedOrder(
            transRes.order || { ...currentOrder, status: 'preparing' },
            slug
          )
        }
      }
      return NextResponse.json({ success: true, order: finalOrder, message: 'Principales entregados en mesa' })
    }

    if (body.action === 'ready_food') {
      if (!targetOrderId) {
        return NextResponse.json({ error: 'Falta orderId' }, { status: 400 })
      }
      const tagRes = await updateOrderCourseTags(slug, targetOrderId, TAG_FOOD_READY, isFoodItem, { skipBroadcast: true })
      if (!tagRes.success) {
        return NextResponse.json({ error: tagRes.error || 'Error al marcar comida lista' }, { status: 404 })
      }
      const transRes = await transitionOrderStatus({
        orderId: targetOrderId,
        slug,
        nextStatus: 'ready',
        actorType: 'kitchen',
      })
      const finalOrder = ensureHydratedOrder(
        transRes.order || (tagRes.order ? { ...tagRes.order, status: 'ready' } : tagRes.order),
        slug
      )
      return NextResponse.json({ success: true, order: finalOrder, message: 'Comida salada marcada como lista' })
    }

    if (body.action === 'ready_desserts') {
      if (!targetOrderId) {
        return NextResponse.json({ error: 'Falta orderId' }, { status: 400 })
      }
      const tagRes = await updateOrderCourseTags(slug, targetOrderId, TAG_DESSERT_READY, isDessertItem, { skipBroadcast: true })
      if (!tagRes.success) {
        return NextResponse.json({ error: tagRes.error || 'Error al marcar postres listos' }, { status: 404 })
      }
      const transRes = await transitionOrderStatus({
        orderId: targetOrderId,
        slug,
        nextStatus: 'ready',
        actorType: 'kitchen',
      })
      return NextResponse.json({
        success: true,
        order: ensureHydratedOrder(transRes.order || tagRes.order, slug),
        message: 'Postres listos para servir',
      })
    }

    if (body.action === 'fire_desserts') {
      if (!targetOrderId) {
        return NextResponse.json({ error: 'Falta orderId' }, { status: 400 })
      }
      // Asegurar que entradas y principales queden permanentemente sellados como servidos en base de datos al marchar postres
      await updateOrderCourseTags(slug, targetOrderId, `${TAG_STARTER_READY} ${TAG_STARTER_SERVED}`, isStarterItem, { skipBroadcast: true })
      await updateOrderCourseTags(slug, targetOrderId, `${TAG_MAIN_FIRED} ${TAG_MAIN_READY} ${TAG_MAIN_SERVED}`, isMainItem, { skipBroadcast: true })
      const tagRes = await updateOrderCourseTags(slug, targetOrderId, TAG_DESSERT_FIRED, isDessertItem, { skipBroadcast: true })
      if (!tagRes.success) {
        return NextResponse.json({ error: tagRes.error || 'Error al marchar postres' }, { status: 404 })
      }
      const restaurant = await getRestaurantBySlug(slug)
      const restaurantId = getTargetRestaurantId(restaurant?.id, slug)
      const transRes = await transitionOrderStatus({
        orderId: targetOrderId,
        restaurantId,
        slug,
        nextStatus: 'preparing',
        actorType: 'waiter',
        forceAllowReactivation: true,
      })
      const finalOrd = ensureHydratedOrder(
        transRes.order || (tagRes.order ? { ...tagRes.order, status: 'preparing' } : tagRes.order),
        slug
      )
      return NextResponse.json({
        success: true,
        order: finalOrd,
        message: 'Postres marchados a cocina',
      })
    }

    if (body.action === 'deliver_desserts' || body.action === 'deliver_desserts_direct') {
      if (!targetOrderId) {
        return NextResponse.json({ error: 'Falta orderId' }, { status: 400 })
      }
      // 1. Asegurar primero que entradas y principales queden permanentemente sellados como servidos en base de datos
      await updateOrderCourseTags(slug, targetOrderId, `${TAG_STARTER_READY} ${TAG_STARTER_SERVED}`, isStarterItem, { skipBroadcast: true })
      await updateOrderCourseTags(slug, targetOrderId, `${TAG_MAIN_FIRED} ${TAG_MAIN_READY} ${TAG_MAIN_SERVED}`, isMainItem, { skipBroadcast: true })
      // 2. Ahora actualizar postres a listos y servidos
      const tagRes = await updateOrderCourseTags(
        slug,
        targetOrderId,
        `${TAG_DESSERT_FIRED} ${TAG_DESSERT_READY} ${TAG_DESSERT_SERVED}`,
        isDessertItem,
        { skipBroadcast: false }
      )
      if (!tagRes.success) {
        return NextResponse.json({ error: tagRes.error || 'Error al entregar postres directamente' }, { status: 404 })
      }
      const currentOrder = ensureHydratedOrder(tagRes.order, slug)
      let finalOrd = currentOrder
      if (currentOrder && currentOrder.status !== 'paid' && currentOrder.status !== 'cancelled') {
        const restaurant = await getRestaurantBySlug(slug)
        const restaurantId = getTargetRestaurantId(restaurant?.id, slug)
        const transRes = await transitionOrderStatus({
          orderId: targetOrderId,
          restaurantId,
          slug,
          nextStatus: 'delivered',
          actorType: 'waiter',
        })
        finalOrd = ensureHydratedOrder(
          transRes.order || (tagRes.order ? { ...tagRes.order, status: 'delivered' } : tagRes.order),
          slug
        )
      }
      return NextResponse.json({
        success: true,
        order: finalOrd,
        message: 'Postres entregados en mesa por el mozo',
      })
    }

    if (body.action === 'resolve_pending_dessert') {
      if (!targetOrderId || !body.dessertProduct) {
        return NextResponse.json({ error: 'Faltan parámetros orderId o dessertProduct' }, { status: 400 })
      }
      const resolveRes = await resolvePendingDessertInOrder(slug, targetOrderId, body.dessertProduct, body.note)
      if (!resolveRes.success) {
        return NextResponse.json({ error: resolveRes.error || 'Error al resolver postre' }, { status: 404 })
      }
      const restaurant = await getRestaurantBySlug(slug)
      const restaurantId = getTargetRestaurantId(restaurant?.id, slug)
      const transRes = await transitionOrderStatus({
        orderId: targetOrderId,
        restaurantId,
        slug,
        nextStatus: 'preparing',
        actorType: body.actor_type || 'waiter',
        forceAllowReactivation: true,
      })
      return NextResponse.json({
        success: true,
        order: ensureHydratedOrder(transRes.order || resolveRes.order, slug),
        message: 'Postre elegido y marchado a cocina',
      })
    }

    if (body.action === 'pay_table' || body.action === 'close_table') {
      const restaurant = await getRestaurantBySlug(slug)
      const restaurantId = getTargetRestaurantId(restaurant?.id, slug)
      let existingOrd: any = targetOrderId ? (findServerOrderById(targetOrderId) || getServerOrders(slug, true).find(o => o.id === targetOrderId)) : undefined
      if (!existingOrd && targetOrderId && isUuid(targetOrderId) && isSupabaseConfigured()) {
        const sb = createServerClient()
        if (sb) {
          const { data: dbOrd } = await sb
            .from('orders')
            .select('id, table_number, status, total_amount')
            .eq('id', targetOrderId)
            .maybeSingle()
          if (dbOrd) existingOrd = dbOrd
        }
      }
      const resolvedTbl = table_number ?? tableNumber ?? existingOrd?.table_number
      if (resolvedTbl === undefined || resolvedTbl === null) {
        return NextResponse.json({ error: 'Falta table_number o orderId para cobrar la mesa' }, { status: 400 })
      }
      const swept = await sweepTableOrdersToPaid(restaurantId, slug, resolvedTbl)
      const primaryOrd = (targetOrderId ? swept.find(o => o.id === targetOrderId) : undefined) || swept[0] || existingOrd
      return NextResponse.json({
        success: true,
        status: 'paid',
        order: ensureHydratedOrder(primaryOrd ? { ...primaryOrd, status: 'paid' } : undefined, slug),
        orders: swept,
        message: `Todas las comandas de la Mesa #${resolvedTbl} fueron marcadas como pagadas`,
      })
    }

    if (!targetOrderId || !status) {
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

    let targetStatus: OrderStatus = status

    const sbClient = isSupabaseConfigured() ? createServerClient() : null

    // Blindaje estricto: Si la orden ya está pagada ('paid'), es terminal e irreversible
    let existingTargetOrd: any = findServerOrderById(targetOrderId) || getServerOrders(slug, true).find(o => o.id === targetOrderId)
    if (!existingTargetOrd && isUuid(targetOrderId) && sbClient) {
      const { data: dbTargetOrd } = await sbClient
        .from('orders')
        .select('*, order_items(id, product_id, quantity, notes, products(id, name, price, category_id, image_url, is_available))')
        .eq('id', targetOrderId)
        .maybeSingle()
      if (dbTargetOrd) {
        existingTargetOrd = dbTargetOrd
      }
    }
    if (existingTargetOrd?.status === 'paid' && targetStatus !== 'paid') {
      return NextResponse.json(
        {
          error: 'TRANSITION_INVALID',
          code: 'TRANSITION_INVALID',
          message: `La comanda ${targetOrderId} ya está PAGADA ('paid'). Estado terminal irreversible; no se permite cambiar a ${targetStatus}`,
          current_status: 'paid',
        },
        { status: 400 }
      )
    }

    // Si se solicita pagar una orden en mesa multi-ronda (o con sweep_table explícito desde Comandero)
    // donde otra ronda ya está entregada/pagada o todos sus pases están servidos, barrer toda la mesa a 'paid'
    if (targetStatus === 'paid' && (!existingTargetOrd || existingTargetOrd.status !== 'pending_validation')) {
      const tblToCheck = existingTargetOrd?.table_number ?? effectiveTableNum
      let hasDeliveredOrPaidSibling = tblToCheck !== undefined && tblToCheck !== null &&
        getServerOrders(slug, true).some(
          o => o.id !== targetOrderId &&
            String(o.table_number) === String(tblToCheck) &&
            (o.status === 'delivered' || o.status === 'paid')
        )
      if (
        !hasDeliveredOrPaidSibling &&
        body.sweep_table !== true &&
        tblToCheck !== undefined &&
        tblToCheck !== null &&
        sbClient
      ) {
        const { data: siblingRows } = await sbClient
          .from('orders')
          .select('id, status')
          .eq('restaurant_id', restaurantId)
          .eq('table_number', Number(tblToCheck))
          .in('status', ['delivered', 'paid'])
          .neq('id', targetOrderId)
          .limit(1)
        if (siblingRows && siblingRows.length > 0) {
          hasDeliveredOrPaidSibling = true
        }
      }
      if (
        body.sweep_table === true ||
        hasDeliveredOrPaidSibling ||
        (existingTargetOrd && existingTargetOrd.status !== 'delivered' && areAllOrderCoursesDelivered(existingTargetOrd))
      ) {
        if (tblToCheck !== undefined && tblToCheck !== null) {
          const swept = await sweepTableOrdersToPaid(restaurantId, slug, tblToCheck)
          const matchedSwept = swept.find(o => o.id === targetOrderId) || (existingTargetOrd ? { ...existingTargetOrd, status: 'paid' as OrderStatus } : { id: targetOrderId, table_number: Number(tblToCheck), status: 'paid' as OrderStatus })
          const hydratedSwept = ensureHydratedOrder(matchedSwept, slug)
          return NextResponse.json({
            success: true,
            message: `Mesa #${tblToCheck} cobrada y todas sus rondas marcadas como pagadas`,
            order: hydratedSwept,
            version: hydratedSwept?.version,
            code: 'TRANSITION_APPLIED',
          })
        }
      }
    }

    // Enrutamiento automático de órdenes 100% bebidas al validar: van directo a ready en Comandero
    if (status === 'pending') {
      const memOrders = getServerOrders(slug)
      let currentOrd = memOrders.find(o => o.id === targetOrderId)
      if (!currentOrd) {
        const cachedItems = getCachedOrderItems(targetOrderId)
        if (cachedItems && cachedItems.length > 0) {
          currentOrd = { order_items: cachedItems } as any
        }
      }
      if (!currentOrd && isUuid(targetOrderId)) {
        const supabase = createServerClient()
        if (supabase && isSupabaseConfigured()) {
          const { data: dbItems } = await supabase
            .from('order_items')
            .select('id, product_id, notes, products(id, name, category_id)')
            .eq('order_id', targetOrderId)
          if (dbItems && dbItems.length > 0) {
            currentOrd = { order_items: dbItems } as any
          }
        }
      }
      // Mantener status pending validado para que sala/barra gestione el pase sin adelantar listo al cliente
      if (currentOrd?.order_items && currentOrd.order_items.length > 0 && isDrinkOnlyOrder(currentOrd.order_items)) {
        targetStatus = 'pending'
      }
    }

    const result = await transitionOrderStatus({
      orderId: targetOrderId,
      restaurantId,
      slug,
      nextStatus: targetStatus,
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

    // Si la comanda se entregó en sala, asegurar que las bebidas queden marcadas como servidas
    if (targetStatus === 'delivered' && result.success && result.order) {
      const hasUnservedDrinks = (result.order.order_items || []).some(it => isDrinkItem(it) && !it.notes?.includes(TAG_DRINK_SERVED))
      if (hasUnservedDrinks) {
        const drinkTagRes = await updateOrderCourseTags(slug, targetOrderId, TAG_DRINK_SERVED, isDrinkItem)
        if (drinkTagRes.order) {
          result.order = drinkTagRes.order
        }
      }
    }

    // Barrido Total Anti-Zombis cuando una orden pasa a 'paid': asegurar que todas las rondas de la mesa pasen a 'paid'
    if (targetStatus === 'paid') {
      const tblForSweep = result.order?.table_number ?? existingTargetOrd?.table_number ?? effectiveTableNum
      if (tblForSweep !== undefined && tblForSweep !== null) {
        await sweepTableOrdersToPaid(restaurantId, slug, tblForSweep)
      }
    }

    // Caso 4: Transición exitosa o idempotente
    const hydratedFinal = ensureHydratedOrder(result.order, slug)
    return NextResponse.json({
      success: true,
      message: result.message || `Orden ${orderId} actualizada a ${status}`,
      order: hydratedFinal,
      version: result.version ?? hydratedFinal?.version,
      code: result.code,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const slug = searchParams.get('slug')
    const all = searchParams.get('all') === 'true'
    const { clearServerOrders } = await import('@/lib/server-state')
    
    if (all || !slug) {
      const slugs = ['burger-gourmet', 'taperia-casco-antigo', 'terraza-malecon', 'bella-napoli']
      slugs.forEach(s => clearServerOrders(s))
      return NextResponse.json({ success: true, message: 'Comandas y sesiones eliminadas para todos los restaurantes' })
    }

    clearServerOrders(slug)
    return NextResponse.json({ success: true, message: `Comandas eliminadas para ${slug}` })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
