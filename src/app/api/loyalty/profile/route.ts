import { NextRequest, NextResponse } from 'next/server'
import {
  getLoyaltyProfile,
  registerOrGetLoyaltyProfile,
  resetOrDeleteLoyaltyProfile,
  getLoyaltySettings,
} from '@/lib/supabase/repositories/loyalty.repository'

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

    let profile = await getLoyaltyProfile(slug, email)
    if (tableNumber && profile) {
      profile = await registerOrGetLoyaltyProfile(slug, {
        name: profile.name || 'Comensal',
        email,
        phone: profile.phone,
        tableNumber,
      })
    }

    const settings = await getLoyaltySettings(slug)

    return NextResponse.json({
      success: true,
      profile,
      settings,
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
    const { slug = 'burger-gourmet', name, email, phone, tableNumber, claimGoogleReviewBonus, lastPaidSessionTotal } = body

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
      claimGoogleReviewBonus: Boolean(claimGoogleReviewBonus),
      lastPaidSessionTotal: lastPaidSessionTotal ? Number(lastPaidSessionTotal) : undefined,
    })


    const settings = await getLoyaltySettings(slug)

    return NextResponse.json({
      success: true,
      profile,
      settings,
    })
  } catch (error: any) {
    console.error('[POST /api/loyalty/profile] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Error al registrar perfil de fidelización' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const slug = searchParams.get('slug') || 'burger-gourmet'
    const email = searchParams.get('email')
    const all = searchParams.get('all') === 'true'

    if (all) {
      const { clearAllLoyaltyProfiles } = await import('@/lib/supabase/repositories/loyalty.repository')
      await clearAllLoyaltyProfiles(slug)
      return NextResponse.json({
        success: true,
        message: `Todas las cuentas de fidelización y sellos han sido reseteadas para ${slug}`,
      })
    }

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email requerido para resetear fidelización o ?all=true para reset general' },
        { status: 400 }
      )
    }

    const profile = await resetOrDeleteLoyaltyProfile(slug, email)

    return NextResponse.json({
      success: true,
      message: `Puntos reseteados a 0 para ${email}`,
      profile,
    })
  } catch (error: any) {
    console.error('[DELETE /api/loyalty/profile] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Error al resetear perfil de fidelización' },
      { status: 500 }
    )
  }
}

