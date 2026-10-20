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


export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    let body: any = {}
    try {
      body = await req.json()
    } catch (_) {}

    const slug = searchParams.get('slug') || body.slug || 'burger-gourmet'
    const action = searchParams.get('action') || body.action || 'reset_points' // 'reset_points' | 'delete_profile' | 'clear_all'
    const email = searchParams.get('email') || body.email
    const id = searchParams.get('id') || body.id
    const all = searchParams.get('all') === 'true' || body.all === true

    // Verificación estricta de autenticación de personal administrativo
    if (!verifyStaffRequest(req, slug, ['admin'])) {
      return NextResponse.json(
        { success: false, error: 'Acceso no autorizado al panel de administración' },
        { status: 401 }
      )
    }

    if (all || action === 'clear_all') {
      const { clearAllLoyaltyProfiles } = await import('@/lib/supabase/repositories/loyalty.repository')
      await clearAllLoyaltyProfiles(slug)
      return NextResponse.json({
        success: true,
        message: `Todos los perfiles de fidelización han sido eliminados para ${slug}`,
      })
    }

    if (!email && !id) {
      return NextResponse.json(
        { success: false, error: 'Se requiere el email o ID del comensal' },
        { status: 400 }
      )
    }

    if (action === 'delete_profile' || action === 'delete') {
      const { deleteLoyaltyProfile } = await import('@/lib/supabase/repositories/loyalty.repository')
      await deleteLoyaltyProfile(slug, { email, id })
      return NextResponse.json({
        success: true,
        message: 'Perfil de comensal eliminado permanentemente',
      })
    }

    // Por defecto: resetear puntos y sellos a 0
    const { resetOrDeleteLoyaltyProfile } = await import('@/lib/supabase/repositories/loyalty.repository')
    const updated = await resetOrDeleteLoyaltyProfile(slug, email)
    return NextResponse.json({
      success: true,
      message: `Puntos y sellos reseteados a 0 para ${email}`,
      profile: updated,
    })
  } catch (error: any) {
    console.error('[DELETE /api/loyalty/profiles] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Error interno al procesar la solicitud' },
      { status: 500 }
    )
  }
}
