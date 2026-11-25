import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { resolveReviewStandTarget } from '@/lib/reviews/review-stand-resolver'
import { ReviewRedirectClient } from '@/components/reviews/ReviewRedirectClient'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: { slug: string }
  searchParams?: { mode?: string }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const target = await resolveReviewStandTarget(params.slug)
  if (!target) {
    return { title: 'Reseñas Google | Fluxo' }
  }
  return {
    title: `Valorar ${target.restaurantName} en Google Reviews`,
    description: `Deja tu opinión sobre ${target.restaurantName}${target.city ? ` (${target.city})` : ''} en Google Maps en un solo toque.`,
    robots: { index: false, follow: false },
  }
}

export default async function ReviewShortlinkPage({ params, searchParams }: PageProps) {
  const target = await resolveReviewStandTarget(params.slug)
  if (!target) {
    notFound()
  }

  // Por defecto usa la configuración del local (false = enlace directo a Google Maps Reviews).
  // Permite activar el filtro inteligente bajo demanda con ?mode=gatekeeper o desactivarlo con ?mode=direct.
  const modeOverride = searchParams?.mode?.toLowerCase()
  const enableGatekeeper =
    modeOverride === 'gatekeeper'
      ? true
      : modeOverride === 'direct'
        ? false
        : target.enableGatekeeper

  return (
    <ReviewRedirectClient
      slug={target.slug}
      restaurantName={target.restaurantName}
      city={target.city}
      logoUrl={target.logoUrl}
      whatsappNumber={target.whatsappNumber}
      googleReviewUrl={target.googleReviewUrl}
      enableGatekeeper={enableGatekeeper}
    />
  )
}
