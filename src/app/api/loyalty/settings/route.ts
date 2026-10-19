import { NextRequest, NextResponse } from 'next/server'
import {
  getLoyaltySettings,
  updateLoyaltySettings,
} from '@/lib/supabase/repositories/loyalty.repository'
import { verifyStaffRequest } from '@/lib/auth/pin-security'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const slug = searchParams.get('slug') || 'burger-gourmet'

    const settings = await getLoyaltySettings(slug)

    return NextResponse.json({
      success: true,
      settings,
    })
  } catch (error: any) {
    console.error('[GET /api/loyalty/settings] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Error al obtener configuración de fidelización' },
      { status: 500 }
    )
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { slug = 'burger-gourmet', settings } = body

    if (!verifyStaffRequest(req, slug, ['admin'])) {
      return NextResponse.json(
        { success: false, error: 'No autorizado. Se requieren permisos de administrador.' },
        { status: 401 }
      )
    }

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Configuración inválida' },
        { status: 400 }
      )
    }

    const updated = await updateLoyaltySettings(slug, settings)

    return NextResponse.json({
      success: true,
      settings: updated,
    })
  } catch (error: any) {
    console.error('[PATCH /api/loyalty/settings] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Error al actualizar configuración de fidelización' },
      { status: 500 }
    )
  }
}
