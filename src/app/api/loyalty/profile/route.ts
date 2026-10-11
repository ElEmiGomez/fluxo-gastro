import { NextRequest, NextResponse } from 'next/server'
import { getLoyaltyProfile, registerOrGetLoyaltyProfile } from '@/lib/supabase/repositories/loyalty.repository'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const slug = searchParams.get('slug') || 'burger-gourmet'
    const email = searchParams.get('email')
    const tableNumber = searchParams.get('table') || searchParams.get('tableNumber')

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email requerido para consultar fidelización' },
        { status: 400 }
      )
    }

    const profile = await getLoyaltyProfile(slug, email)
    if (profile && tableNumber) {
      await registerOrGetLoyaltyProfile(slug, {
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        tableNumber,
      })
    }

    return NextResponse.json({
      success: true,
      profile,
    })
  } catch (error: any) {
    console.error('[GET /api/loyalty/profile] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Error al obtener perfil de fidelización' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { slug = 'burger-gourmet', name, email, phone, tableNumber } = body

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email requerido para registro de fidelización' },
        { status: 400 }
      )
    }

    const profile = await registerOrGetLoyaltyProfile(slug, {
      name: name || 'Comensal',
      email,
      phone,
      tableNumber,
    })


    return NextResponse.json({
      success: true,
      profile,
    })
  } catch (error: any) {
    console.error('[POST /api/loyalty/profile] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Error al registrar perfil de fidelización' },
      { status: 500 }
    )
  }
}
