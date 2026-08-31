import { createServerClient as createSupabaseServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

/**
 * Cliente de Supabase para Next.js Server Components y Route Handlers.
 * NUNCA utiliza la clave 'service_role'. Utiliza la clave anon pública
 * y propaga las cookies de sesión con auth.uid() para garantizar que las
 * políticas de Row Level Security (RLS) se apliquen estrictamente en PostgreSQL.
 */
export const createServerClient = () => {
  if (!supabaseUrl || !supabaseAnonKey || !supabaseUrl.startsWith('https://') || supabaseAnonKey === 'tu-anon-key-aqui') {
    return null
  }

  let cookieStore: any
  try {
    cookieStore = cookies()
  } catch {
    // Si se invoca fuera de un request context
    return null
  }

  return createSupabaseServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options })
        } catch {
          // En Server Components de solo lectura no se pueden escribir cookies
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: '', ...options })
        } catch {
          // Ignore
        }
      },
    },
  })
}
