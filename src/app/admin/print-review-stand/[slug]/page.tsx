import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { resolveReviewStandTarget } from '@/lib/reviews/review-stand-resolver'
import { PrintableReviewStand } from '@/components/reviews/PrintableReviewStand'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: { slug: string }
  searchParams?: {
    name?: string
    city?: string
    logoUrl?: string
    reviewUrl?: string
  }
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const target = await resolveReviewStandTarget(params.slug, {
    allowDefault: true,
    overrides: searchParams,
  })
  if (!target) return { title: 'Soporte NFC Reseñas | Fluxo' }
  return {
    title: `Expositor NFC + QR Google Reviews — ${target.restaurantName}`,
    robots: { index: false, follow: false },
  }
}

export default async function PrintReviewStandPage({ params, searchParams }: PageProps) {
  const target = await resolveReviewStandTarget(params.slug, {
    allowDefault: true,
    overrides: searchParams,
  })
  if (!target) {
    notFound()
  }

  return (
    <PrintableReviewStand
      slug={target.slug}
      restaurantName={target.restaurantName}
      city={target.city}
      logoUrl={target.logoUrl}
      googleReviewUrl={target.googleReviewUrl}
      enableGatekeeper={target.enableGatekeeper}
      isDefaultTemplate={target.isDefaultTemplate}
    />
  )
}
