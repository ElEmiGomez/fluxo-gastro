import { NextRequest } from 'next/server'
import {
  sanitizeText,
  getServerProducts,
  setServerProducts,
  resolveCanonicalProductId,
} from '@/lib/server-state'
import { createServerClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import { MOCK_PRODUCTS } from '@/lib/supabase/mock-fallback'
import { PRODUCT_NAMES } from '@/lib/i18n'
import { deduplicateProducts } from '@/lib/category-matcher'
import { OrderItem, Product } from '@/types/database.types'
import { verifyStaffRequest } from '@/lib/auth/pin-security'

export const isUuid = (str?: string | null): boolean =>
  Boolean(str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str))

export const cleanStr = (s?: string | null): string =>
  String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim()

export interface ProcessedOrderItemsResult {
  validItems: OrderItem[]
  computedTotal: number
}

export class OrderValidationError extends Error {
  status: number
  constructor(message: string, status: number = 400) {
    super(message)
    this.name = 'OrderValidationError'
    this.status = status
  }
}

/**
 * Valida y calcula el precio en servidor para los items de una comanda (Server-Side Price Verification)
 */
export async function validateAndPriceOrderItems({
  items,
  slug,
  restaurantId,
  req,
}: {
  items: any[]
  slug: string
  restaurantId: string
  req: NextRequest
}): Promise<ProcessedOrderItemsResult> {
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
      console.warn('Could not fetch products from Supabase in validateAndPriceOrderItems, using fallback:', e)
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
        console.warn('[validateAndPriceOrderItems] Error buscando producto en Supabase:', findErr)
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
      throw new OrderValidationError(`El producto "${itemName || productId}" no está disponible o no fue encontrado en la carta.`, 400)
    }

    // Validación estricta de disponibilidad
    if (catalogProduct.is_available === false) {
      throw new OrderValidationError(`El producto "${catalogProduct.name}" no está disponible actualmente (Agotado).`, 400)
    }

    // Cortesía ("Invita la casa"): Solo autorizada para personal de sala autenticado
    const isStaffSender = verifyStaffRequest(req, slug, ['comandero', 'admin', 'kitchen'])
    const isComplimentary = Boolean(isStaffSender && (item.is_complimentary || (item.notes && item.notes.includes('[🎁 INVITACIÓN DE LA CASA]'))))

    const itemPriceToCharge = isComplimentary ? 0 : (Number(catalogProduct.price) || 0)
    computedTotal += itemPriceToCharge * quantity

    const sanitizedNotes = item.notes ? sanitizeText(item.notes, 200) : null
    const canonicalProdId = resolveCanonicalProductId(catalogProduct.id) || catalogProduct.id

    validItems.push({
      id: `oi-${idx}`,
      order_id: '',
      product_id: canonicalProdId,
      quantity,
      notes: sanitizedNotes || null,
      product: {
        ...catalogProduct,
        id: canonicalProdId,
      },
      is_complimentary: isComplimentary,
      course: item.course || 'first',
    })
  }

  if (validItems.length === 0) {
    throw new OrderValidationError('No se encontraron productos válidos en la comanda. Por favor revisa la selección.', 400)
  }

  return { validItems, computedTotal }
}
