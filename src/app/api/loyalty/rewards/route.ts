import { NextRequest, NextResponse } from 'next/server'
import { getLoyaltyRewards } from '@/lib/supabase/repositories/loyalty.repository'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const slug = searchParams.get('slug') || 'burger-gourmet'

    const rewards = await getLoyaltyRewards(slug)
    return NextResponse.json({
      success: true,
      rewards,
    })
  } catch (error: any) {
    console.error('[GET /api/loyalty/rewards] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Error al obtener catálogo de recompensas' },
      { status: 500 }
    )
  }
}
