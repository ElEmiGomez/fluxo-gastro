import { NextRequest, NextResponse } from 'next/server'
import { holdLoyaltyPoints, releaseLoyaltyPoints } from '@/lib/supabase/repositories/loyalty.repository'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      slug = 'burger-gourmet',
      action,
      email,
      points,
      tableNumber,
      sessionToken,
      productId,
      holdId,
    } = body

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email requerido para gestionar saldo en retención' },
        { status: 400 }
      )
    }

    if (action === 'hold') {
      if (!points || points <= 0) {
        return NextResponse.json(
          { success: false, error: 'Cantidad de puntos a retener inválida' },
          { status: 400 }
        )
      }

      const result = await holdLoyaltyPoints(slug, {
        email,
        points: Number(points),
        tableNumber: tableNumber ?? 1,
        sessionToken: sessionToken || `sess_${Date.now()}`,
        productId,
      })

      return NextResponse.json({
        action: 'hold',
        ...result,
      })
    } else if (action === 'release') {
      const result = await releaseLoyaltyPoints(slug, {
        email,
        points: points ? Number(points) : undefined,
        tableNumber,
        holdId,
      })

      return NextResponse.json({
        action: 'release',
        ...result,
      })
    } else {
      return NextResponse.json(
        { success: false, error: 'Acción de escrow no válida (use "hold" o "release")' },
        { status: 400 }
      )
    }
  } catch (error: any) {
    console.error('[POST /api/loyalty/escrow] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Error en operación de escrow' },
      { status: 400 }
    )
  }
}
