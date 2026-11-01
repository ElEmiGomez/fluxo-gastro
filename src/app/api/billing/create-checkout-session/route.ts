import { NextRequest, NextResponse } from 'next/server'
import { getStripeServer } from '@/lib/billing/stripe-server'
import {
  PLAN_CONFIG,
  PlanType,
} from '@/lib/billing/billing-calculations'
import { createServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      slug,
      plan_type,
      billing_day,
      founder_commitment_accepted,
    } = body

    if (!slug) {
      return NextResponse.json({ error: 'El slug es obligatorio.' }, { status: 400 })
    }

    if (!billing_day || billing_day < 1 || billing_day > 5) {
      return NextResponse.json(
        { error: 'El día de cobro debe ser un número entre el 1 y el 5.' },
        { status: 400 }
      )
    }

    const validPlans: PlanType[] = ['carta', 'sala', 'full_fundador', 'full', 'hibernacion']
    if (!validPlans.includes(plan_type)) {
      return NextResponse.json({ error: 'Plan seleccionado no válido.' }, { status: 400 })
    }

    if (plan_type === 'full_fundador' && !founder_commitment_accepted) {
      return NextResponse.json(
        { error: 'Debes aceptar el Pacto Fundador para continuar.' },
        { status: 400 }
      )
    }

    const planConfig = PLAN_CONFIG[plan_type as PlanType]
    const amountBase = planConfig.basePriceEur
    const ivaAmount = Math.round(amountBase * 0.21 * 100) / 100
    const totalAmount = Math.round((amountBase + ivaAmount) * 100) / 100

    const origin = req.nextUrl.origin || 'http://localhost:3000'
    const stripe = getStripeServer()

    if (stripe) {
      const session = await (stripe.checkout.sessions as any).create({
        // Stripe v23: Checkout calcula los métodos de pago dinámicamente (card,
        // sepa_debit y wallets automáticamente). El cast puntual a `any` aísla
        // los tipos heredados del SDK v18/22 mientras se migra a v23.
        payment_method_types: ['card', 'sepa_debit'],
        line_items: [
          {
            price_data: {
              currency: 'eur',
              product_data: {
                name: `Fluxo · ${planConfig.label}`,
                description: `Suscripción mensual para ${slug} (Día de cobro: ${billing_day}). ${planConfig.note}`,
              },
              unit_amount: Math.round(amountBase * 100),
            },
            quantity: 1,
          },
          {
            price_data: {
              currency: 'eur',
              product_data: {
                name: 'IVA (21%)',
                description: 'Impuesto sobre el Valor Añadido (España)',
              },
              unit_amount: Math.round(ivaAmount * 100),
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${origin}/activar/${slug}?session_id={CHECKOUT_SESSION_ID}&success=true`,
        cancel_url: `${origin}/activar/${slug}?canceled=true`,
        metadata: {
          restaurant_slug: slug,
          plan_type,
          billing_day: String(billing_day),
          is_founder_slot: String(plan_type === 'full_fundador'),
          founder_commitment_accepted: String(Boolean(founder_commitment_accepted)),
          amount_base: String(amountBase),
          iva_amount: String(ivaAmount),
          total_amount: String(totalAmount),
        },
      })

      return NextResponse.json({
        url: session.url,
        sessionId: session.id,
      })
    }

    // Modo simulación local si Stripe no tiene clave configurada en el entorno
    const simulatedSessionId = `sim_session_${Date.now()}`
    const simulatedSuccessUrl = `${origin}/activar/${slug}?session_id=${simulatedSessionId}&success=true&mock=1&plan=${plan_type}&day=${billing_day}`

    return NextResponse.json({
      url: simulatedSuccessUrl,
      sessionId: simulatedSessionId,
      simulated: true,
      message: 'Stripe en modo desarrollo/simulación (sin STRIPE_SECRET_KEY configurada)',
    })
  } catch (error: any) {
    console.error('Error en /api/billing/create-checkout-session:', error)
    return NextResponse.json(
      { error: error?.message || 'Error al crear la sesión de pago con Stripe.' },
      { status: 500 }
    )
  }
}
