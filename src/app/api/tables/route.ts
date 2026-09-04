import { NextRequest, NextResponse } from 'next/server'
import { getTableSessions, setTableOccupied } from '@/lib/server-state'
import {
  createOrGetActiveSession,
  closeTableSession,
  getRestaurantBySlug,
  getTargetRestaurantId,
} from '@/lib/supabase/repository'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const slug = searchParams.get('slug') || 'burger-gourmet'
    const sessions = { ...getTableSessions(slug) }

    const { createServerClient } = await import('@/lib/supabase/server')
    const { isSupabaseConfigured } = await import('@/lib/supabase/client')
    const supabase = createServerClient()
    if (supabase && isSupabaseConfigured()) {
      try {
        const restaurant = await getRestaurantBySlug(slug)
        const restaurantId = getTargetRestaurantId(restaurant?.id, slug)
        const { data: dbSessions } = await supabase
          .from('table_sessions')
          .select('*')
          .eq('restaurant_id', restaurantId)
          .eq('status', 'active')

        if (dbSessions) {
          for (const s of dbSessions) {
            sessions[s.table_number] = {
              table_number: s.table_number,
              status: 'busy',
              session_id: s.session_token,
              last_updated_at: s.created_at || new Date().toISOString(),
            }
            setTableOccupied(slug, s.table_number, s.session_token)
          }
        }
      } catch {
        // Fallback a memoria pura
      }
    }

    return NextResponse.json({ sessions })
  } catch (err: any) {
    return NextResponse.json({ error: err.message, sessions: {} }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { slug = 'burger-gourmet', table_number, action } = body

    if (!table_number) {
      return NextResponse.json({ error: 'Falta table_number' }, { status: 400 })
    }

    const restaurant = await getRestaurantBySlug(slug)
    const restaurantId = getTargetRestaurantId(restaurant?.id, slug)
    const parsedTableNum = parseInt(String(table_number), 10)

    if (action === 'start_session') {
      const session = await createOrGetActiveSession(restaurantId, slug, parsedTableNum)
      const res = NextResponse.json({
        success: true,
        session_token: session.session_token,
        session,
      })
      // Cookie HTTP-Only resistente a Apple WebKit / Safari ITP (7-day purge)
      res.cookies.set(`gastro_session_${slug}_${parsedTableNum}`, session.session_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 24 * 60 * 60, // 24 horas
      })
      return res
    } else if (action === 'free') {
      await closeTableSession(restaurantId, slug, parsedTableNum)
      const res = NextResponse.json({
        success: true,
        message: `Mesa #${table_number} liberada y token UUID revocado`,
      })
      res.cookies.set(`gastro_session_${slug}_${parsedTableNum}`, '', {
        httpOnly: true,
        path: '/',
        maxAge: 0,
      })
      return res
    } else if (action === 'occupy') {
      const session = setTableOccupied(slug, table_number)
      return NextResponse.json({ success: true, session })
    } else if (action === 'transfer') {
      const { to_table } = body
      if (!to_table) {
        return NextResponse.json({ error: 'Falta to_table para transferir' }, { status: 400 })
      }
      const { transferTableSession } = await import('@/lib/server-state')
      transferTableSession(slug, table_number, to_table)
      return NextResponse.json({ success: true, message: `Mesa #${table_number} transferida a Mesa #${to_table}` })
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const slug = searchParams.get('slug') || 'burger-gourmet'
    const { clearServerOrders } = await import('@/lib/server-state')
    clearServerOrders(slug)
    return NextResponse.json({ success: true, message: `Mesas reiniciadas para ${slug}` })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
