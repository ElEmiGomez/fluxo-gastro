import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import {
  PLAN_CONFIG,
  PlanType,
  PaymentMethod,
} from '@/lib/billing/billing-calculations'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      slug,
      plan_type,
      billing_day,
      payment_method,
      proof_storage_path,
      founder_commitment_accepted,
      notes,
    } = body

    if (!slug) {
      return NextResponse.json({ error: 'El slug del restaurante es obligatorio.' }, { status: 400 })
    }

    if (!proof_storage_path || typeof proof_storage_path !== 'string') {
      return NextResponse.json(
        { error: 'REGLA ESTRICTA: El comprobante de pago es obligatorio para continuar.' },
        { status: 400 }
      )
    }

    if (!billing_day || billing_day < 1 || billing_day > 5) {
      return NextResponse.json(
        { error: 'El día de cobro debe ser un número entre el 1 y el 5 de cada mes.' },
        { status: 400 }
      )
    }

    const validPlans: PlanType[] = ['carta', 'sala', 'full_fundador', 'full', 'hibernacion']
    if (!validPlans.includes(plan_type)) {
      return NextResponse.json({ error: 'Plan seleccionado no válido.' }, { status: 400 })
    }

    if (plan_type === 'full_fundador' && !founder_commitment_accepted) {
      return NextResponse.json(
        { error: 'Debes aceptar el Pacto Fundador para activar la tarifa bonificada.' },
        { status: 400 }
      )
    }

    const planConfig = PLAN_CONFIG[plan_type as PlanType]
    const amountBase = planConfig.basePriceEur
    const ivaAmount = Math.round(amountBase * 0.21 * 100) / 100
    const totalAmount = Math.round((amountBase + ivaAmount) * 100) / 100

    const supabase = createServerClient()
    let restaurantId: string | null = null

    if (supabase) {
      // 1. Obtener restaurante por slug
      const { data: rest } = await supabase
        .from('restaurants')
        .select('id, name')
        .eq('slug', slug)
        .maybeSingle()

      if (rest) {
        restaurantId = rest.id

        // 2. Actualizar estado del restaurante a 'proof_pending' (amarillo en el semáforo)
        await supabase
          .from('restaurants')
          .update({
            plan_type,
            monthly_price_eur: amountBase,
            billing_day,
            payment_status: 'proof_pending',
            payment_method: payment_method || 'transfer',
            has_payment_proof: true,
            is_founder_slot: plan_type === 'full_fundador',
            founder_commitment_accepted: Boolean(founder_commitment_accepted),
            founder_started_at: plan_type === 'full_fundador' ? new Date().toISOString() : null,
          })
          .eq('id', rest.id)
      }

      // 3. Insertar registro en subscription_payments
      const { data: paymentRecord, error: paymentError } = await supabase
        .from('subscription_payments')
        .insert({
          restaurant_id: restaurantId,
          restaurant_slug: slug,
          amount_base: amountBase,
          iva_amount: ivaAmount,
          total_amount: totalAmount,
          plan_type,
          billing_day,
          payment_method: payment_method || 'transfer',
          payment_status: 'proof_pending',
          proof_storage_path,
          proof_uploaded_at: new Date().toISOString(),
          founder_commitment_accepted: Boolean(founder_commitment_accepted),
          notes: notes || 'Pago manual registrado por el cliente',
        })
        .select('id')
        .maybeSingle()

      if (paymentError) {
        console.warn('Advertencia insertando subscription_payments:', paymentError)
      }

      return NextResponse.json({
        success: true,
        payment_id: paymentRecord?.id || `manual-${Date.now()}`,
        status: 'proof_pending',
        amount_base: amountBase,
        iva_amount: ivaAmount,
        total_amount: totalAmount,
        billing_day,
      })
    }

    return NextResponse.json({
      success: true,
      payment_id: `offline-${Date.now()}`,
      status: 'proof_pending',
      amount_base: amountBase,
      iva_amount: ivaAmount,
      total_amount: totalAmount,
      billing_day,
    })
  } catch (error: any) {
    console.error('Error en /api/billing/manual-payment:', error)
    return NextResponse.json(
      { error: error?.message || 'Error al procesar el pago manual.' },
      { status: 500 }
    )
  }
}
