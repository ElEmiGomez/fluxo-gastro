import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import {
  getServerCategories,
  getServerProducts,
  upsertServerCategory,
  deleteServerCategory,
  upsertServerProduct,
  toggleProductAvailability,
  deleteServerProduct,
  setServerCategories,
  setServerProducts,
  sanitizeText,
} from '@/lib/server-state'
import { MOCK_RESTAURANTS } from '@/lib/supabase/mock-fallback'
import { Category, Product } from '@/types/database.types'
import { verifyStaffRequest } from '@/lib/auth/pin-security'
import { createServerClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import { getRestaurantBySlug, getTargetRestaurantId } from '@/lib/supabase/repository'
import { isProductInCategory, deduplicateProducts, resolveCanonicalProductId } from '@/lib/category-matcher'


const isUuid = (str?: string | null): boolean =>
  Boolean(str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str))

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const slug = searchParams.get('slug') || 'burger-gourmet'
    let restaurant = MOCK_RESTAURANTS[slug] || MOCK_RESTAURANTS['burger-gourmet']
    let categories = getServerCategories(slug)
    let products = getServerProducts(slug)

    const supabase = createServerClient()
    if (supabase && isSupabaseConfigured()) {
      try {
        const rest = await getRestaurantBySlug(slug)
        if (rest) {
          restaurant = rest
          const { data: dbCats } = await supabase
            .from('categories')
            .select('*')
            .eq('restaurant_id', rest.id)
            .order('order_index')
          if (dbCats && dbCats.length > 0) {
            const normalizedCats = dbCats.map((c: any) => ({
              ...c,
              name: c.name?.toUpperCase().trim() === 'GIN & BEBIDAS' ? 'Bebidas' : c.name,
            }))
            const hasDesserts = normalizedCats.some((c: any) => {
              const u = (c.name || '').toUpperCase()
              return u.includes('POSTRE') || u.includes('CAFÉ') || c.id === 'c0000000-0000-0000-0000-000000000006'
            })
            if (!hasDesserts) {
              normalizedCats.push({
                id: 'c0000000-0000-0000-0000-000000000006',
                restaurant_id: rest.id,
                name: 'POSTRES & CAFÉ',
                order_index: normalizedCats.length + 1,
              })
            }
            categories = normalizedCats
            setServerCategories(slug, normalizedCats)
          }

          const { data: dbProds } = await supabase
            .from('products')
            .select('*')
            .eq('restaurant_id', rest.id)
          if (dbProds && dbProds.length > 0) {
            products = deduplicateProducts([...products, ...dbProds])
            setServerProducts(slug, products)
          }
        }
      } catch (dbErr) {
        console.warn('Could not fetch menu from Supabase, falling back to server state:', dbErr)
      }
    }

    // Normalizar category_id de los productos para que coincida exactamente con las categorías activas
    if (categories && categories.length > 0) {
      products = products.map(prod => {
        const matchingCat = categories.find(cat => isProductInCategory(prod, cat.id, categories))
        if (matchingCat && prod.category_id !== matchingCat.id) {
          return { ...prod, category_id: matchingCat.id }
        }
        return prod
      })
    }

    products = deduplicateProducts(products)

    return NextResponse.json({
      success: true,
      restaurant,
      categories,
      products,
    })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { slug = 'burger-gourmet', type, data } = body

    // Blindaje de Seguridad: Requiere sesión de administración autorizada
    if (!verifyStaffRequest(req, slug, ['admin'])) {
      return NextResponse.json(
        { success: false, error: 'No autorizado. Se requiere sesión o PIN de administración.' },
        { status: 401 }
      )
    }

    if (!data) {
      return NextResponse.json({ success: false, error: 'Datos no proporcionados' }, { status: 400 })
    }

    if (type === 'category') {
      const category: Category = {
        id: data.id || `cat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        restaurant_id: data.restaurant_id || 'a1111111-1111-1111-1111-111111111111',
        name: sanitizeText(data.name || 'Nueva Categoría', 60),
        order_index: typeof data.order_index === 'number' ? data.order_index : 99,
      }
      const saved = upsertServerCategory(slug, category)
      return NextResponse.json({ success: true, category: saved })
    }

    if (type === 'categories_reorder') {
      if (Array.isArray(data)) {
        setServerCategories(slug, data)
        return NextResponse.json({ success: true, categories: data })
      }
    }

    if (type === 'product') {
      const unitVal = data.price_unit === 'kg' ? 'kg' : data.price_unit === 'piece' ? 'piece' : '100g'
      const rawPrice = typeof data.price === 'number' ? Number(data.price.toFixed(2)) : parseFloat(String(data.price || '').replace(',', '.')) || 0.0
      const sanitizedPrice = Math.max(0, Number(rawPrice.toFixed(2)))
      const productId = data.id || crypto.randomUUID()
      const existingProduct = getServerProducts(slug).find(p => p.id === productId)

      const rawOriginalPrice = data.original_price !== undefined
        ? (typeof data.original_price === 'number' ? Number(data.original_price.toFixed(2)) : (parseFloat(String(data.original_price || '').replace(',', '.')) || null))
        : (existingProduct?.original_price ?? null)

      const product: Product = {
        id: productId,
        category_id: data.category_id || existingProduct?.category_id || 'cat-1',
        restaurant_id: data.restaurant_id || existingProduct?.restaurant_id || 'a1111111-1111-1111-1111-111111111111',
        name: sanitizeText(data.name || existingProduct?.name || 'Nuevo Plato', 100).trim() || 'Nuevo Plato',
        description: data.description !== undefined ? sanitizeText(data.description, 300) : (existingProduct?.description || ''),
        price: sanitizedPrice,
        original_price: rawOriginalPrice && rawOriginalPrice > sanitizedPrice ? rawOriginalPrice : null,
        price_type: data.price_type === 'weight' ? 'weight' : 'unit',
        price_unit: data.price_type === 'weight' ? unitVal : undefined,
        image_url: data.image_url !== undefined ? data.image_url : (existingProduct?.image_url || ''),
        model_3d_url: data.model_3d_url !== undefined ? data.model_3d_url : (existingProduct?.model_3d_url || null),
        is_available: data.is_available !== undefined ? (data.is_available !== false) : (existingProduct?.is_available !== false),
        is_highlighted_promo: data.is_highlighted_promo !== undefined ? data.is_highlighted_promo : existingProduct?.is_highlighted_promo,
        allergens: Array.isArray(data.allergens) ? data.allergens : (existingProduct?.allergens || []),
      }
      const saved = upsertServerProduct(slug, product)

      const supabase = createServerClient()
      if (supabase && isSupabaseConfigured()) {
        try {
          const rest = await getRestaurantBySlug(slug)
          const targetRestId = getTargetRestaurantId(rest?.id, slug)
          if (targetRestId && isUuid(targetRestId)) {
            saved.restaurant_id = targetRestId
          }

          let targetProductId = saved.id
          if (!isUuid(targetProductId)) {
            // Si el producto existente en Supabase ya tiene un UUID emparejado por nombre
            const { data: matchedDbProds } = await supabase
              .from('products')
              .select('id')
              .eq('restaurant_id', targetRestId)
              .ilike('name', saved.name)
              .limit(1)
            if (matchedDbProds && matchedDbProds.length > 0) {
              targetProductId = matchedDbProds[0].id
            } else {
              targetProductId = crypto.randomUUID()
            }
            if (saved.id !== targetProductId) {
              deleteServerProduct(slug, saved.id)
            }
            saved.id = targetProductId
            upsertServerProduct(slug, saved)
          }

          let targetCategoryId = saved.category_id
          if (!isUuid(targetCategoryId)) {
            // Intentar emparejar categoría por nombre en Supabase
            const currentCat = getServerCategories(slug).find(c => c.id === saved.category_id)
            if (currentCat) {
              const { data: matchedCats } = await supabase
                .from('categories')
                .select('id')
                .eq('restaurant_id', targetRestId)
                .ilike('name', currentCat.name)
                .limit(1)
              if (matchedCats && matchedCats.length > 0) {
                targetCategoryId = matchedCats[0].id
              }
            }
            if (!isUuid(targetCategoryId)) {
              const { data: dbCats } = await supabase
                .from('categories')
                .select('id')
                .eq('restaurant_id', targetRestId)
                .limit(1)
              if (dbCats && dbCats.length > 0) {
                targetCategoryId = dbCats[0].id
              }
            }
          }

          if (isUuid(targetCategoryId) && isUuid(targetProductId)) {
            const { data: upsertData, error: upsertErr } = await supabase
              .from('products')
              .upsert({
                id: targetProductId,
                restaurant_id: targetRestId,
                category_id: targetCategoryId,
                name: saved.name,
                description: saved.description,
                price: saved.price,
                price_type: saved.price_type,
                price_unit: saved.price_unit || null,
                image_url: saved.image_url,
                model_3d_url: saved.model_3d_url || null,
                is_available: saved.is_available,
              })
              .select()

            if (upsertErr) {
              console.error('[Menu API POST] Error upserting product in Supabase:', {
                code: upsertErr.code,
                message: upsertErr.message,
                details: upsertErr.details,
                hint: upsertErr.hint,
                product: saved,
              })
            } else {
              console.log('[Menu API POST] Product synced successfully in Supabase:', targetProductId)
            }
          }
        } catch (dbErr) {
          console.error('[Menu API POST] Exception while syncing product to Supabase:', dbErr)
        }
      }

      return NextResponse.json({ success: true, product: saved })
    }

    return NextResponse.json({ success: false, error: 'Tipo de entidad no reconocido' }, { status: 400 })
  } catch (err: any) {
    console.error('[Menu API POST] Exception in POST handler:', err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { slug = 'burger-gourmet', product_id, is_available } = body

    // Blindaje de Seguridad: Requiere sesión de staff autorizada (admin, cocina o mozo)
    if (!verifyStaffRequest(req, slug, ['admin', 'kitchen', 'comandero'])) {
      return NextResponse.json(
        { success: false, error: 'No autorizado. Se requiere sesión de personal autorizada.' },
        { status: 401 }
      )
    }

    if (!product_id) {
      return NextResponse.json({ success: false, error: 'product_id requerido' }, { status: 400 })
    }

    const canonicalId = resolveCanonicalProductId(product_id) || product_id
    let currentProducts = getServerProducts(slug)
    let product = currentProducts.find(p =>
      p.id === product_id ||
      p.id === canonicalId ||
      resolveCanonicalProductId(p.id) === canonicalId
    )

    const supabase = createServerClient()

    // Si no se encuentra en memoria local, buscar en la base de datos de Supabase
    if (!product && supabase && isSupabaseConfigured()) {
      try {
        const queryId = isUuid(canonicalId) ? canonicalId : (isUuid(product_id) ? product_id : null)
        if (queryId) {
          const { data: dbProd, error: fetchErr } = await supabase
            .from('products')
            .select('*')
            .eq('id', queryId)
            .maybeSingle()
          if (fetchErr) {
            console.error('[Menu API PATCH] Error al consultar plato en Supabase por ID:', fetchErr)
          } else if (dbProd) {
            product = dbProd
            currentProducts = [...currentProducts, dbProd]
          }
        }
      } catch (findErr) {
        console.error('[Menu API PATCH] Excepción al buscar plato en Supabase:', findErr)
      }
    }

    if (!product) {
      return NextResponse.json({ success: false, error: 'Producto no encontrado' }, { status: 404 })
    }

    const newState = typeof is_available === 'boolean' ? is_available : !product.is_available
    const updated = currentProducts.map(p =>
      (p.id === product.id || p.id === product_id || p.id === canonicalId || resolveCanonicalProductId(p.id) === canonicalId)
        ? { ...p, is_available: newState }
        : p
    )
    setServerProducts(slug, updated)

    // Sincronización robusta con Supabase (PostgreSQL)
    if (supabase && isSupabaseConfigured()) {
      try {
        const rest = await getRestaurantBySlug(slug)
        const targetRestId = getTargetRestaurantId(rest?.id, slug)

        let targetId = isUuid(canonicalId) ? canonicalId : (isUuid(product.id) ? product.id : null)
        if (!targetId) {
          const { data: matched, error: matchErr } = await supabase
            .from('products')
            .select('id')
            .eq('restaurant_id', targetRestId)
            .ilike('name', product.name)
            .limit(1)

          if (matchErr) {
            console.error('[Menu API PATCH] Error emparejando producto por nombre en Supabase:', matchErr)
          } else if (matched && matched.length > 0) {
            targetId = matched[0].id
          }
        }

        if (targetId && isUuid(targetId)) {
          const { data: updateData, error: updateErr } = await supabase
            .from('products')
            .update({ is_available: newState })
            .eq('id', targetId)
            .select()

          if (updateErr) {
            console.error('[Menu API PATCH] Error actualizando stock (is_available) en Supabase:', {
              code: updateErr.code,
              message: updateErr.message,
              details: updateErr.details,
              hint: updateErr.hint,
              productId: targetId,
              is_available: newState,
            })
          } else {
            console.log('[Menu API PATCH] Stock actualizado con éxito en Supabase:', {
              id: targetId,
              is_available: newState,
              rowsUpdated: updateData?.length || 0,
            })
          }
        } else {
          console.warn('[Menu API PATCH] El producto no posee UUID válido para PostgreSQL:', product_id)
        }
      } catch (dbErr) {
        console.error('[Menu API PATCH] Excepción no controlada al actualizar stock en Supabase:', dbErr)
      }
    }

    return NextResponse.json({ success: true, product_id, is_available: newState })

  } catch (err: any) {
    console.error('[Menu API PATCH] Error general en endpoint PATCH:', err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const slug = searchParams.get('slug') || 'burger-gourmet'
    const type = searchParams.get('type') || 'product'
    const id = searchParams.get('id')

    // Blindaje de Seguridad: Requiere sesión de administración
    if (!verifyStaffRequest(req, slug, ['admin'])) {
      return NextResponse.json(
        { success: false, error: 'No autorizado. Se requiere sesión o PIN de administración.' },
        { status: 401 }
      )
    }

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID requerido' }, { status: 400 })
    }

    if (type === 'category') {
      deleteServerCategory(slug, id)
      return NextResponse.json({ success: true, deleted_category_id: id })
    }

    if (type === 'product') {
      deleteServerProduct(slug, id)
      const supabase = createServerClient()
      if (supabase && isSupabaseConfigured()) {
        try {
          if (isUuid(id)) {
            await supabase.from('products').delete().eq('id', id)
          }
        } catch (dbErr) {
          console.warn('Could not delete product in Supabase, local state updated:', dbErr)
        }
      }
      return NextResponse.json({ success: true, deleted_product_id: id })
    }

    return NextResponse.json({ success: false, error: 'Tipo inválido' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
