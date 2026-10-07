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
            categories = dbCats
            setServerCategories(slug, dbCats)
          }

          const { data: dbProds } = await supabase
            .from('products')
            .select('*')
            .eq('restaurant_id', rest.id)
          if (dbProds && dbProds.length > 0) {
            products = dbProds
            setServerProducts(slug, dbProds)
          }
        }
      } catch (dbErr) {
        console.warn('Could not fetch menu from Supabase, falling back to server state:', dbErr)
      }
    }

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

      const product: Product = {
        id: productId,
        category_id: data.category_id || existingProduct?.category_id || 'cat-1',
        restaurant_id: data.restaurant_id || existingProduct?.restaurant_id || 'a1111111-1111-1111-1111-111111111111',
        name: sanitizeText(data.name || existingProduct?.name || 'Nuevo Plato', 100).trim() || 'Nuevo Plato',
        description: data.description !== undefined ? sanitizeText(data.description, 300) : (existingProduct?.description || ''),
        price: sanitizedPrice,
        price_type: data.price_type === 'weight' ? 'weight' : 'unit',
        price_unit: data.price_type === 'weight' ? unitVal : undefined,
        image_url: data.image_url !== undefined ? data.image_url : (existingProduct?.image_url || ''),
        model_3d_url: data.model_3d_url !== undefined ? data.model_3d_url : (existingProduct?.model_3d_url || null),
        is_available: data.is_available !== undefined ? (data.is_available !== false) : (existingProduct?.is_available !== false),
        is_highlighted_promo: data.is_highlighted_promo !== undefined ? data.is_highlighted_promo : existingProduct?.is_highlighted_promo,
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

          // Solo sincronizar con Supabase si el ID del producto es un UUID válido para PostgreSQL
          if (isUuid(saved.id)) {
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

            if (isUuid(targetCategoryId)) {
              await supabase.from('products').upsert({
                id: saved.id,
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
            }
          }
        } catch (dbErr) {
          console.warn('Could not sync product to Supabase, local state updated:', dbErr)
        }
      }

      return NextResponse.json({ success: true, product: saved })
    }

    return NextResponse.json({ success: false, error: 'Tipo de entidad no reconocido' }, { status: 400 })
  } catch (err: any) {
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

    const currentProducts = getServerProducts(slug)
    const product = currentProducts.find(p => p.id === product_id)
    if (!product) {
      return NextResponse.json({ success: false, error: 'Producto no encontrado' }, { status: 404 })
    }

    const newState = typeof is_available === 'boolean' ? is_available : !product.is_available
    const updated = currentProducts.map(p => (p.id === product_id ? { ...p, is_available: newState } : p))
    setServerProducts(slug, updated)

    const supabase = createServerClient()
    if (supabase && isSupabaseConfigured()) {
      try {
        if (isUuid(product_id)) {
          await supabase.from('products').update({ is_available: newState }).eq('id', product_id)
        }
      } catch (dbErr) {
        console.warn('Could not sync availability to Supabase, local state updated:', dbErr)
      }
    }

    return NextResponse.json({ success: true, product_id, is_available: newState })
  } catch (err: any) {
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
