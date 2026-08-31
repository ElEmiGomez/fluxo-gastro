import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import { getRestaurantBySlug, getActiveOrdersByTable } from '@/lib/supabase/repository'
import { validateTableSession } from '@/lib/server-state'

export const dynamic = 'force-dynamic'

/**
 * ==============================================================================
 * RESILIENCIA DE SESIÓN PARA APPLE SAFARI / WEBKIT (iOS ITP)
 * ==============================================================================
 * Safari purga localStorage e IndexedDB en PWAs no instaladas tras 7 días o cierre de pestaña.
 * Este endpoint utiliza la Cookie HTTP-Only persistente (inmune al ITP de Safari)
 * para resincronizar el session_token del comensal y reconstruir su estado de comanda en curso.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const slug = searchParams.get('slug') || 'burger-gourmet'
    const tableParam = searchParams.get('table')

    if (!tableParam) {
      return NextResponse.json({ error: 'Falta table' }, { status: 400 })
    }

    const tableNumber = parseInt(tableParam, 10)
    const cookieName = `gastro_session_${slug}_${tableNumber}`
    const cookieSessionToken = req.cookies.get(cookieName)?.value

    if (!cookieSessionToken) {
      return NextResponse.json({ restored: false, reason: 'NO_HTTP_COOKIE' })
    }

    const restaurant = await getRestaurantBySlug(slug)
    const restaurantId = restaurant?.id || 'a1111111-1111-1111-1111-111111111111'

    // 1. Validar si el token de la cookie sigue activo en Supabase
    const supabase = createServerClient()
    let isValid = false
    let sessionRecord: any = null

    if (supabase && isSupabaseConfigured()) {
      try {
        const { data: session } = await supabase
          .from('table_sessions')
          .select('*')
          .eq('restaurant_id', restaurantId)
          .eq('table_number', tableNumber)
          .eq('session_token', cookieSessionToken)
          .eq('status', 'active')
          .maybeSingle()

        if (session) {
          isValid = true
          sessionRecord = session
        }
      } catch (e) {
        console.warn('Error verificando sesión en Supabase:', e)
      }
    }

    // Fallback en memoria si Supabase no está configurado
    if (!isValid) {
      const check = validateTableSession(slug, tableNumber, cookieSessionToken)
      if (check.valid) {
        isValid = true
        sessionRecord = { session_token: cookieSessionToken, status: 'active' }
      }
    }

    if (!isValid) {
      return NextResponse.json({ restored: false, reason: 'SESSION_EXPIRED_OR_REVOKED' })
    }

    // 2. Recuperar órdenes activas de la mesa para reconstruir el estado comensal
    const orders = await getActiveOrdersByTable(restaurantId, slug, tableNumber)

    return NextResponse.json({
      restored: true,
      session_token: cookieSessionToken,
      orders,
      table_number: tableNumber,
      slug,
    })
  } catch (err: any) {
    console.error('Error restaurando sesión Safari ITP:', err)
    return NextResponse.json({ error: err.message, restored: false }, { status: 500 })
  }
}
