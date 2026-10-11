import { createServerClient } from '../server'
import { isSupabaseConfigured } from '../client'
import { MOCK_RESTAURANTS } from '../mock-fallback'
import { Restaurant } from '@/types/database.types'

export const MOCK_RESTAURANT_IDS = new Set([
  'a1111111-1111-1111-1111-111111111111',
  'b2222222-2222-2222-2222-222222222222',
  'c3333333-3333-3333-3333-333333333333',
  'd4444444-4444-4444-4444-444444444444',
])

/**
 * Obtiene el ID canónico de restaurante o fallback seguro
 */
export function getTargetRestaurantId(restaurantId?: string, slug?: string): string {
  if (!restaurantId || MOCK_RESTAURANT_IDS.has(restaurantId)) {
    return 'a0000000-0000-0000-0000-000000000001'
  }
  return restaurantId
}

/**
 * Obtiene los datos del restaurante a partir del slug
 */
export async function getRestaurantBySlug(slug: string): Promise<Restaurant | null> {
  const supabase = createServerClient()
  if (supabase && isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('slug', slug)
        .single()
      if (!error && data) return data as Restaurant
    } catch (e) {
      console.warn('Error fetching restaurant from Supabase, using mock:', e)
    }
  }
  return MOCK_RESTAURANTS[slug] || MOCK_RESTAURANTS['burger-gourmet'] || null
}
