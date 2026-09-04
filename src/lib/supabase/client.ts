import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const isSupabaseConfigured = () => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith('https://') &&
    supabaseAnonKey !== 'tu-anon-key-aqui'
  )
}

let cachedBrowserClient: SupabaseClient | null = null

// Crea una única instancia de cliente para browser con soporte de realtime (Singleton)
export const createBrowserClient = (): SupabaseClient | null => {
  if (!isSupabaseConfigured()) {
    return null
  }
  if (!cachedBrowserClient) {
    cachedBrowserClient = createClient(supabaseUrl, supabaseAnonKey, {
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
  }
  return cachedBrowserClient
}

/**
 * Client-safe resolution of canonical restaurant UUID
 */
export function getClientTargetRestaurantId(restaurantId?: string, slug?: string): string {
  if (!restaurantId || restaurantId === 'a1111111-1111-1111-1111-111111111111') {
    if (!slug || slug === 'burger-gourmet') {
      return 'a0000000-0000-0000-0000-000000000001'
    }
  }
  return restaurantId || 'a0000000-0000-0000-0000-000000000001'
}
