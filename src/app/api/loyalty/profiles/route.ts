import { NextRequest, NextResponse } from 'next/server'
import { verifyStaffRequest } from '@/lib/auth/pin-security'
import { getAllLoyaltyProfiles } from '@/lib/supabase/repositories/loyalty.repository'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const slug = searchParams.get('slug') || 'burger-gourmet'
    const search = searchParams.get('search') || searchParams.get('q') || ''

    // Verificación estricta de autenticación de personal administrativo
    if (!verifyStaffRequest(req, slug, ['admin'])) {
      return NextResponse.json(
        { success: false, error: 'Acceso no autorizado al panel de clientes fidelizados' },
        { status: 401 }
      )
    }

    const profiles = await getAllLoyaltyProfiles(slug, search)

    const totalPoints = profiles.reduce((sum, p) => sum + (Number(p.total_points) || 0), 0)
    const withRewards = profiles.filter(p => (Number(p.available_points) || 0) >= 15).length
    const googleReviews = profiles.filter(p => Boolean(p.google_review_bonus_awarded)).length

    return NextResponse.json({
      success: true,
      profiles,
      total: profiles.length,
      stats: {
        total_customers: profiles.length,
        total_points_issued: totalPoints,
        active_members_with_rewards: withRewards,
        google_reviews_awarded: googleReviews,
      },
    })
  } catch (error: any) {
    console.error('[GET /api/loyalty/profiles] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Error interno al consultar perfiles' },
      { status: 500 }
    )
  }
}
