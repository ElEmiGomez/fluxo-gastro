import { NextRequest, NextResponse } from 'next/server'
import { getStripeServer } from '@/lib/billing/stripe-server'
import { createServerClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()
    const signature = req.headers.get('stripe-signature')
    const stripe = getStripeServer()
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

    let event: Stripe.Event

    if (stripe && webhookSecret && signature) {
      try {
        event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
      } catch (err: any) {
        console.error('Error de firma de webhook Stripe:', err.message)
        return NextResponse.json({ error: `Webhook signature verification failed: ${err.message}` }, { status: 400 })
      }
    } else {
      // Parse directo para testing / desarrollo si no hay webhook secret
      try {
        event = JSON.parse(rawBody) as Stripe.Event
      } catch {
        return NextResponse.json({ error: 'Payload JSON inválido' }, { status: 400 })
      }
    }

    const supabase = createServerClient()

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      const metadata = session.metadata || {}
      const slug = metadata.restaurant_slug
      const planType = metadata.plan_type || 'carta'
      const billingDay = parseInt(metadata.billing_day || '1', 10)
      const isFounderSlot = metadata.is_founder_slot === 'true'
      const founderCommitmentAccepted = metadata.founder_commitment_accepted === 'true'
      const amountBase = parseFloat(metadata.amount_base || '0')
      const ivaAmount = parseFloat(metadata.iva_amount || '0')
      const totalAmount = parseFloat(metadata.total_amount || '0')

      if (slug && supabase) {
        // Idempotencia: Verificar si ya existe este session_id registrado
        const { data: existingPayment } = await supabase
          .from('subscription_payments')
          .select('id, payment_status')
          .eq('stripe_session_id', session.id)
          .maybeSingle()

        if (existingPayment && existingPayment.payment_status === 'paid') {
          // Ya procesado, responder 200 inmediatamente
          return NextResponse.json({ received: true, already_processed: true })
        }

        // Obtener restaurante
        const { data: rest } = await supabase
          .from('restaurants')
          .select('id')
          .eq('slug', slug)
          .maybeSingle()

        const restaurantId = rest?.id || null

        // 1. Actualizar tabla restaurants
        if (restaurantId) {
          await supabase
            .from('restaurants')
            .update({
              plan_type: planType,
              monthly_price_eur: amountBase || 39,
              billing_day: billingDay >= 1 && billingDay <= 5 ? billingDay : 1,
              payment_status: 'paid',
              payment_method: session.payment_method_types?.[0] === 'sepa_debit' ? 'stripe_sepa' : 'stripe_card',
              is_founder_slot: isFounderSlot,
              founder_commitment_accepted: founderCommitmentAccepted,
              founder_started_at: isFounderSlot ? new Date().toISOString() : null,
              has_payment_proof: true,
              pause_level: 0,
            })
            .eq('id', restaurantId)
        }

        // 2. Registrar o actualizar en subscription_payments (idempotente)
        if (existingPayment) {
          await supabase
            .from('subscription_payments')
            .update({
              payment_status: 'paid',
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingPayment.id)
        } else {
          await supabase
            .from('subscription_payments')
            .insert({
              restaurant_id: restaurantId,
              restaurant_slug: slug,
              amount_base: amountBase,
              iva_amount: ivaAmount,
              total_amount: totalAmount,
              plan_type: planType,
              billing_day: billingDay,
              payment_method: session.payment_method_types?.[0] === 'sepa_debit' ? 'stripe_sepa' : 'stripe_card',
              payment_status: 'paid',
              stripe_session_id: session.id,
              stripe_subscription_id: typeof session.subscription === 'string' ? session.subscription : null,
              founder_commitment_accepted: founderCommitmentAccepted,
              notes: 'Pago completado con éxito a través de Stripe Checkout',
            })
        }
      }
    }

    return NextResponse.json({ received: true })
  } catch (err: any) {
    console.error('Error procesando webhook de Stripe:', err)
    return NextResponse.json({ error: err?.message || 'Error interno' }, { status: 500 })
  }
}
