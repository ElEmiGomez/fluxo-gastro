import { createServerClient } from '../server'
import { isSupabaseConfigured } from '../client'
import { Category, Product } from '@/types/database.types'

const isUuid = (str?: string | null): boolean =>
  Boolean(str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str))

/**
 * Obtiene las categorías de un restaurante desde Supabase
 */
export async function getSupabaseCategories(restaurantId: string): Promise<Category[]> {
  const supabase = createServerClient()
  if (supabase && isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('order_index')
      if (!error && data) return data as Category[]
    } catch (e) {
      console.warn('[getSupabaseCategories] Error:', e)
    }
  }
  return []
}

/**
 * Obtiene los productos de un restaurante desde Supabase
 */
export async function getSupabaseProducts(restaurantId: string): Promise<Product[]> {
  const supabase = createServerClient()
  if (supabase && isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('restaurant_id', restaurantId)
      if (!error && data) return data as Product[]
    } catch (e) {
      console.warn('[getSupabaseProducts] Error:', e)
    }
  }
  return []
}

/**
 * Actualiza la disponibilidad de un producto en Supabase
 */
export async function updateSupabaseProductAvailability(
  productId: string,
  isAvailable: boolean
): Promise<boolean> {
  if (!isUuid(productId)) return false
  const supabase = createServerClient()
  if (supabase && isSupabaseConfigured()) {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_available: isAvailable })
        .eq('id', productId)
      return !error
    } catch (e) {
      console.warn('[updateSupabaseProductAvailability] Error:', e)
    }
  }
  return false
}

/**
 * Elimina un producto en Supabase por ID
 */
export async function deleteSupabaseProduct(productId: string): Promise<boolean> {
  if (!isUuid(productId)) return false
  const supabase = createServerClient()
  if (supabase && isSupabaseConfigured()) {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId)
      return !error
    } catch (e) {
      console.warn('[deleteSupabaseProduct] Error:', e)
    }
  }
  return false
}

/**
 * Elimina una categoría en Supabase por ID
 */
export async function deleteSupabaseCategory(categoryId: string): Promise<boolean> {
  if (!isUuid(categoryId)) return false
  const supabase = createServerClient()
  if (supabase && isSupabaseConfigured()) {
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId)
      return !error
    } catch (e) {
      console.warn('[deleteSupabaseCategory] Error:', e)
    }
  }
  return false
}
