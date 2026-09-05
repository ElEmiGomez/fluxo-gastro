import { NextRequest, NextResponse } from 'next/server'
import {
  getServerServiceCalls,
  checkRateLimit,
  sanitizeText,
} from '@/lib/server-state'
import {
  getRestaurantBySlug,
  getRestaurantServiceCalls,
  createServiceCall,
  attendServiceCall,
} from '@/lib/supabase/repository'
import { verifyStaffRequest } from '@/lib/auth/pin-security'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const slug = searchParams.get('slug') || 'burger-gourmet'
    const restaurant = await getRestaurantBySlug(slug)
    const restaurantId = restaurant?.id || 'a1111111-1111-1111-1111-111111111111'
    const calls = await getRestaurantServiceCalls(restaurantId, slug)
    return NextResponse.json({ calls })
  } catch (err: any) {
    return NextResponse.json({ error: err.message, calls: [] }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { slug = 'burger-gourmet', table_number, call_type, table_session_id } = body

    // Rate Limiting para evitar spam de avisos al comandero
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local-client'
    const rateLimitKey = `service_call_${slug}_${clientIp}_${table_number}`
    if (!checkRateLimit(rateLimitKey, 25, 60000)) {
      return NextResponse.json(
        { error: 'Demasiadas solicitudes. Por favor espera unos momentos.' },
        { status: 429 }
      )
    }

    const parsedTableNum = Math.min(25, Math.max(1, parseInt(String(table_number || '1'), 10) || 1))
    const sanitizedCallType = sanitizeText(String(call_type || 'call_waiter'), 50)
    const restaurant = await getRestaurantBySlug(slug)
    const restaurantId = restaurant?.id || 'a1111111-1111-1111-1111-111111111111'

    const saved = await createServiceCall(restaurantId, slug, {
      table_number: parsedTableNum,
      call_type: sanitizedCallType,
      table_session_id,
    })

    return NextResponse.json({ success: true, call: saved })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { slug = 'burger-gourmet', callId } = body

    if (!verifyStaffRequest(req, slug, ['comandero', 'admin', 'kitchen'])) {
      return NextResponse.json(
        { error: 'No autorizado. Se requiere sesión de personal para atender avisos.' },
        { status: 401 }
      )
    }

    if (!callId) {
      return NextResponse.json({ error: 'callId es obligatorio' }, { status: 400 })
    }

    await attendServiceCall(slug, String(callId))
    return NextResponse.json({ success: true, message: `Llamada ${callId} atendida` })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const slug = searchParams.get('slug') || 'burger-gourmet'

    if (!verifyStaffRequest(req, slug, ['admin', 'comandero'])) {
      return NextResponse.json(
        { error: 'No autorizado. Se requiere sesión de administración o mozo.' },
        { status: 401 }
      )
    }

    const { clearServerServiceCalls } = await import('@/lib/server-state')
    clearServerServiceCalls(slug)
    return NextResponse.json({ success: true, message: `Avisos eliminados para ${slug}` })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
