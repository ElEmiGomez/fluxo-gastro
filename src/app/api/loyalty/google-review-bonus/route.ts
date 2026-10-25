import { NextRequest, NextResponse } from 'next/server'
import { claimGoogleReviewBonus } from '@/lib/supabase/repositories/loyalty.repository'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { slug = 'burger-gourmet', email, phone, identifier, tableNumber, table, lastPaidSessionTotal } = body
    const targetIdentifier = (email || phone || identifier || '').trim()
    const targetTable = tableNumber || table

    if (!targetIdentifier) {
      return NextResponse.json(
        { success: false, error: 'Email o teléfono requerido para solicitar el bonus de Google Maps' },
        { status: 400 }
      )
    }

    // Blindaje anti-manipulación: forzar el importe oficial de bonus configurado en servidor (50 pts / 1 sello)
    const officialBonusPoints = 50
    const result = await claimGoogleReviewBonus(slug, targetIdentifier, officialBonusPoints, {
      tableNumber: targetTable,
      lastPaidSessionTotal: lastPaidSessionTotal ? Number(lastPaidSessionTotal) : undefined,
    })

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
