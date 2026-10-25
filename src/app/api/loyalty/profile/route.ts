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
    const phone = searchParams.get('phone')
    const tableNumber = searchParams.get('table') || searchParams.get('tableNumber')
    const lastPaidSessionTotal = searchParams.get('lastPaidSessionTotal') || searchParams.get('lastPaid')
    const name = searchParams.get('name')
    const cachedStamps = searchParams.get('cachedStamps')
    const cachedUnlocked = searchParams.get('cachedUnlocked')
    const cachedGoogleBonus = searchParams.get('cachedGoogleBonus') === 'true'
    const targetIdentifier = (email || phone || '').trim()

    if (!targetIdentifier) {
      return NextResponse.json(
        { success: false, error: 'Email o teléfono requerido para consultar fidelización' },
        { status: 400 }
      )
    }

    let profile = await getLoyaltyProfile(slug, targetIdentifier)
    if (!profile && email) {
      profile = await registerOrGetLoyaltyProfile(slug, {
        name: name || 'Comensal',
        email,
        phone,
        tableNumber: tableNumber || undefined,
        claimGoogleReviewBonus: false,
        lastPaidSessionTotal: lastPaidSessionTotal ? Number(lastPaidSessionTotal) : undefined,
        cachedStampsCount: cachedStamps !== null ? Number(cachedStamps) : undefined,
        cachedUnlockedRewardsCount: cachedUnlocked !== null ? Number(cachedUnlocked) : undefined,
      })
    } else if (tableNumber && profile) {
      profile = await registerOrGetLoyaltyProfile(slug, {
        name: profile.name || name || 'Comensal',
        email: profile.email,
        phone: profile.phone,
        tableNumber,
        lastPaidSessionTotal: lastPaidSessionTotal ? Number(lastPaidSessionTotal) : undefined,
        cachedStampsCount: cachedStamps !== null ? Number(cachedStamps) : undefined,
        cachedUnlockedRewardsCount: cachedUnlocked !== null ? Number(cachedUnlocked) : undefined,
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
    let body: any = {}
    try {
      body = await req.json()
    } catch (_) {}

    const slug = searchParams.get('slug') || body.slug || 'burger-gourmet'
    const email = searchParams.get('email') || body.email
    const id = searchParams.get('id') || body.id
    const all = searchParams.get('all') === 'true' || body.all === true
    const action = searchParams.get('action') || body.action || 'reset_points'

    if (all) {
      const { clearAllLoyaltyProfiles } = await import('@/lib/supabase/repositories/loyalty.repository')
      await clearAllLoyaltyProfiles(slug)
      return NextResponse.json({
        success: true,
        message: `Todas las cuentas de fidelización y sellos han sido reseteadas para ${slug}`,
      })
    }

    const tableNumber = searchParams.get('table') || searchParams.get('tableNumber') || body.tableNumber || body.table
    if (tableNumber && (action === 'leave_table' || action === 'logout')) {
      const { clearTableLoyaltyMembers } = await import('@/lib/supabase/repositories/loyalty.repository')
      await clearTableLoyaltyMembers(slug, tableNumber)
      return NextResponse.json({
        success: true,
        message: `Comensal desconectado de la mesa ${tableNumber}`,
      })
    }

    if (!email && !id) {
      return NextResponse.json(
        { success: false, error: 'Email o ID requerido para resetear fidelización o ?all=true para reset general' },
        { status: 400 }
      )
    }

    if (action === 'delete' || action === 'delete_profile') {
      const { deleteLoyaltyProfile } = await import('@/lib/supabase/repositories/loyalty.repository')
      await deleteLoyaltyProfile(slug, { email: email || undefined, id: id || undefined })
      return NextResponse.json({
        success: true,
        message: `Perfil eliminado permanentemente para ${email || id}`,
      })
    }

    const { resetOrDeleteLoyaltyProfile } = await import('@/lib/supabase/repositories/loyalty.repository')
    const profile = await resetOrDeleteLoyaltyProfile(slug, email!)

    return NextResponse.json({
      success: true,
      message: `Puntos y sellos reseteados a 0 para ${email}`,
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

