import { NextRequest, NextResponse } from 'next/server'
import { redeemStampReward } from '@/lib/supabase/repositories/loyalty.repository'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { slug = 'burger-gourmet', email, productId } = body

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email requerido para canjear premio' },
        { status: 400 }
      )
    }

    const result = await redeemStampReward(slug, email, productId)
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'No fue posible canjear el premio' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Premio canjeado con éxito',
      remaining_rewards: result.remaining_rewards,
      profile: result.profile,
    })
  } catch (error: any) {
    console.error('[POST /api/loyalty/redeem-stamp] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Error en el servidor al canjear premio' },
      { status: 500 }
    )
  }
}
