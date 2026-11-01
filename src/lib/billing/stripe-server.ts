import Stripe from 'stripe'

let cachedStripe: Stripe | null = null

export function getStripeServer(): Stripe | null {
  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) {
    return null
  }
  if (!cachedStripe) {
    cachedStripe = new Stripe(secretKey, {
      apiVersion: '2025-02-24.acacia' as any,
      appInfo: {
        name: 'Fluxo Gastronomic System',
        version: '1.2.0',
      },
    })
  }
  return cachedStripe
}
