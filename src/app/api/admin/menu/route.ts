import { NextRequest, NextResponse } from 'next/server'
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

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const slug = searchParams.get('slug') || 'burger-gourmet'
    const restaurant = MOCK_RESTAURANTS[slug] || MOCK_RESTAURANTS['burger-gourmet']
    const categories = getServerCategories(slug)
    const products = getServerProducts(slug)

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
      const product: Product = {
        id: data.id || `p-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        category_id: data.category_id || 'cat-1',
        restaurant_id: data.restaurant_id || 'a1111111-1111-1111-1111-111111111111',
        name: sanitizeText(data.name || 'Nuevo Plato', 100),
        description: data.description ? sanitizeText(data.description, 300) : '',
        price: typeof data.price === 'number' ? Number(data.price.toFixed(2)) : parseFloat(data.price) || 0.0,
        price_type: data.price_type === 'weight' ? 'weight' : 'unit',
        price_unit: data.price_type === 'weight' ? unitVal : undefined,
        image_url: data.image_url || '',
        model_3d_url: null,
        is_available: data.is_available !== false,
      }
      const saved = upsertServerProduct(slug, product)
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

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID requerido' }, { status: 400 })
    }

    if (type === 'category') {
      deleteServerCategory(slug, id)
      return NextResponse.json({ success: true, deleted_category_id: id })
    }

    if (type === 'product') {
      deleteServerProduct(slug, id)
      return NextResponse.json({ success: true, deleted_product_id: id })
    }

    return NextResponse.json({ success: false, error: 'Tipo inválido' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
