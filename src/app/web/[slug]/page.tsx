import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getGastronomicTenant } from '@/lib/web-tenants'
import { buildRestaurantJsonLd } from '@/lib/seo/gastronomic-jsonld'
import GastronomicWebClientView from '@/components/web/GastronomicWebClientView'

interface PageProps {
  params: { slug: string }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const tenant = await getGastronomicTenant(params.slug)
  if (!tenant) {
    return {
      title: 'Local no encontrado | Fluxo Web',
      description: 'El establecimiento no existe o no está registrado en el ecosistema gastronómico Fluxo.',
    }
  }

  return {
    title: `${tenant.name} · ${tenant.tagline}`,
    description: `Web oficial de ${tenant.name} en ${tenant.city}. Especialidad en ${tenant.cuisineType.join(', ')}. Horarios de servicio, carta y reserva directa sin comisiones.`,
    openGraph: {
      title: `${tenant.name} · ${tenant.tagline}`,
      description: `Consulta la carta y reserva tu mesa en ${tenant.name} (${tenant.city}).`,
      images: [
        {
          url: tenant.heroImagePoster,
          width: 1200,
          height: 630,
          alt: tenant.name,
        },
      ],
    },
    alternates: {
      canonical: `/web/${tenant.slug}`,
    },
  }
}

export default async function GastronomicWebPage({ params }: PageProps) {
  const tenant = await getGastronomicTenant(params.slug)
  if (!tenant) {
    notFound()
  }

  const jsonLd = buildRestaurantJsonLd(tenant)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <GastronomicWebClientView tenant={tenant} />
    </>
  )
}
