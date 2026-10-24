import { NextRequest, NextResponse } from 'next/server'
import { getTableSessions, setTableOccupied, freeTableSession } from '@/lib/server-state'
import { verifyStaffRequest } from '@/lib/auth/pin-security'
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

        const activeTableNumbers = new Set<string>()
        if (dbSessions) {
          for (const s of dbSessions) {
            activeTableNumbers.add(s.table_number.toString())
            sessions[s.table_number] = {
              table_number: s.table_number,
              status: 'busy',
              session_id: s.session_token,
              last_updated_at: s.created_at || new Date().toISOString(),
            }
            setTableOccupied(slug, s.table_number, s.session_token, true)
          }
        }

        // Si la mesa no tiene sesión activa en Supabase (SSOT), marcarla explícitamente como 'free'
        Object.keys(sessions).forEach(tblKey => {
          if (!activeTableNumbers.has(tblKey.toString())) {
            sessions[tblKey] = {
              table_number: tblKey,
              status: 'free',
              session_id: '',
              last_updated_at: new Date().toISOString(),
            }
          }
        })

        const tableQuery = searchParams.get('table') || searchParams.get('table_number')
        if (tableQuery && !activeTableNumbers.has(tableQuery.toString())) {
          sessions[tableQuery] = {
            table_number: tableQuery,
            status: 'free',
            session_id: '',
            last_updated_at: new Date().toISOString(),
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

    // Blindaje de Seguridad RBAC: Acciones de gestión de mesas requieren sesión de staff
    if (['occupy', 'free', 'close_session', 'transfer'].includes(action)) {
      if (!verifyStaffRequest(req, slug, ['comandero', 'admin'])) {
        return NextResponse.json(
          { error: 'No autorizado. Se requiere sesión de personal para gestionar mesas.' },
          { status: 401 }
        )
      }
    }

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
    } else if (action === 'free' || action === 'close_session') {
      const { payment_method, final_amount, orders_count } = body
      await closeTableSession(
        restaurantId,
        slug,
        parsedTableNum,
        payment_method || 'card',
        typeof final_amount === 'number' ? final_amount : undefined,
        typeof orders_count === 'number' ? orders_count : undefined
      )
      // Liberar en memoria y emitir evento SSE en tiempo real a todos los comensales
      freeTableSession(slug, parsedTableNum)

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

    if (!verifyStaffRequest(req, slug, ['admin'])) {
      return NextResponse.json(
        { error: 'No autorizado. Se requiere sesión de administrador para reiniciar mesas.' },
        { status: 401 }
      )
    }
    const { clearServerOrders } = await import('@/lib/server-state')
    clearServerOrders(slug)
    return NextResponse.json({ success: true, message: `Mesas reiniciadas para ${slug}` })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
