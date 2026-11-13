import type { GastronomicTenantConfig, OpeningSchedule } from '../../types/gastronomic-web.types.ts'

const DAYS_MAP: Record<number, string> = {
  0: 'Sunday',
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
}

/**
 * Generador de Datos Estructurados JSON-LD (Schema.org) para los 5 Arquetipos Gastronómicos.
 * Cumple estrictamente con las políticas de Google Search Central y evita penalizaciones por self-serving reviews.
 */
export function buildRestaurantJsonLd(
  tenant: GastronomicTenantConfig,
  baseUrl: string = 'https://fluxogastro.com'
): Record<string, any> {
  // Mapeo canónico de los 5 arquetipos gastronómicos a subtipos Schema.org
  const schemaTypeMap: Record<string, string> = {
    urban_street: 'BarOrPub',
    alta_mesa: 'Restaurant',
    gastro_bistro: 'Restaurant',
    daylight_cafe: 'CafeOrCoffeeShop',
    taberna_rustica: 'BarOrPub',
    // Compatibilidad hacia atrás:
    tavern: 'BarOrPub',
    restaurant: 'Restaurant',
    cafe: 'CafeOrCoffeeShop',
  }

  const schemaType = schemaTypeMap[tenant.archetype] || 'Restaurant'
  const canonicalUrl = `${baseUrl}/web/${tenant.slug}`
  const rawMenuPath = tenant.qrMenuUrl || `/p/${tenant.slug}`
  const menuUrl = rawMenuPath.startsWith('http')
    ? rawMenuPath
    : `${baseUrl}${rawMenuPath.startsWith('/') ? rawMenuPath : `/${rawMenuPath}`}`

  const openingHoursSpecs = (tenant.openingHours || []).map((schedule: OpeningSchedule) => ({
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: DAYS_MAP[schedule.dayOfWeek] || 'Monday',
    opens: schedule.open,
    closes: schedule.close,
  }))

  const allowsReservations =
    tenant.archetype === 'urban_street' ||
    tenant.archetype === 'alta_mesa' ||
    tenant.archetype === 'gastro_bistro' ||
    tenant.archetype === 'restaurant'

  const jsonLd: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': schemaType,
    '@id': `${canonicalUrl}#restaurant`,
    name: tenant.name,
    description: tenant.tagline,
    url: canonicalUrl,
    telephone: tenant.phone,
    image: tenant.heroImagePoster.startsWith('http')
      ? tenant.heroImagePoster
      : `${baseUrl}${tenant.heroImagePoster}`,
    priceRange: tenant.priceRange,
    servesCuisine: tenant.cuisineType,
    address: {
      '@type': 'PostalAddress',
      streetAddress: tenant.address,
      addressLocality: tenant.city,
      postalCode: tenant.postalCode,
      addressCountry: 'ES',
    },
    openingHoursSpecification: openingHoursSpecs,
    hasMenu: menuUrl,
    acceptsReservations: allowsReservations,
  }

  if (tenant.googleMapsUrl) {
    jsonLd.hasMap = tenant.googleMapsUrl
  }

  // REGLA CRÍTICA DE INTEGRIDAD: No inyectar AggregateRating autogenerado
  // Google penaliza o ignora estrellas marcadas por el propio negocio (política de Septiembre 2019)

  return jsonLd
}
