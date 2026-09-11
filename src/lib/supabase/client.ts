import { createClient, SupabaseClient } from '@supabase/supabase-js'

const getSupabaseUrl = () => process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ''
const getSupabaseAnonKey = () => process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || ''

export const isSupabaseConfigured = () => {
  const url = getSupabaseUrl()
  const key = getSupabaseAnonKey()
  return Boolean(
    url &&
    key &&
    url.startsWith('https://') &&
    key !== 'tu-anon-key-aqui'
  )
}

let cachedBrowserClient: SupabaseClient | null = null

// Crea una única instancia de cliente para browser con soporte de realtime (Singleton)
export const createBrowserClient = (): SupabaseClient | null => {
  if (!isSupabaseConfigured()) {
    return null
  }
  if (!cachedBrowserClient) {
    cachedBrowserClient = createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
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
const MOCK_RESTAURANT_IDS = new Set([
  'a1111111-1111-1111-1111-111111111111',
  'b2222222-2222-2222-2222-222222222222',
  'c3333333-3333-3333-3333-333333333333',
  'd4444444-4444-4444-4444-444444444444',
])

export function getClientTargetRestaurantId(restaurantId?: string, slug?: string): string {
  if (!restaurantId || MOCK_RESTAURANT_IDS.has(restaurantId)) {
    return 'a0000000-0000-0000-0000-000000000001'
  }
  return restaurantId
}
