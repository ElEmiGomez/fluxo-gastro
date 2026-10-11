import { NextRequest, NextResponse } from 'next/server'
import { claimGoogleReviewBonus } from '@/lib/supabase/repositories/loyalty.repository'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { slug = 'burger-gourmet', email } = body

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email requerido para solicitar el bonus de Google Maps' },
        { status: 400 }
      )
    }

    const result = await claimGoogleReviewBonus(slug, email)

    return NextResponse.json({
      ...result,
    })
  } catch (error: any) {
    console.error('[POST /api/loyalty/google-review-bonus] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Error al canjear bonus de Google Maps' },
      { status: 400 }
    )
  }
}
