import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildRestaurantJsonLd } from '../../src/lib/seo/gastronomic-jsonld.ts'
import type { GastronomicTenantConfig } from '../../src/types/gastronomic-web.types.ts'

test('buildRestaurantJsonLd generates valid Schema.org for Bar / Cervecería', () => {
  const mockTavern: GastronomicTenantConfig = {
    slug: 'bar-jaratusas',
    name: 'Bar Jara-Tusas',
    archetype: 'tavern',
    tagline: 'Cervecería de Barrio & Raciones',
    phone: '+34981000000',
    whatsappNumber: '34711573870',
    address: 'Rúa do Curro 12',
    city: 'Noia',
    postalCode: '15200',
    cuisineType: ['Tapas', 'Cervecería'],
    priceRange: '€',
    heroImagePoster: '/images/jaratusas-poster.jpg',
    dishes: [],
    ambiences: [],
    openingHours: [
      { dayOfWeek: 1, open: '10:00', close: '23:30' }
    ]
  }

  const jsonLd = buildRestaurantJsonLd(mockTavern)

  assert.equal(jsonLd['@context'], 'https://schema.org')
  assert.equal(jsonLd['@type'], 'BarOrPub')
  assert.equal(jsonLd.name, 'Bar Jara-Tusas')
  assert.equal(jsonLd.address['@type'], 'PostalAddress')
  assert.equal(jsonLd.address.addressLocality, 'Noia')
  assert.equal(jsonLd.address.postalCode, '15200')
  assert.equal(jsonLd.acceptsReservations, false)
  // Regla anti-penalización: NO AggregateRating
  assert.equal(jsonLd.aggregateRating, undefined)
  assert.equal(jsonLd.review, undefined)
})

test('buildRestaurantJsonLd generates Restaurant schema with acceptsReservations for Marisquería', () => {
  const mockRestaurant: GastronomicTenantConfig = {
    slug: 'casa-mar-da-vila',
    name: 'Casa Mar da Vila',
    archetype: 'restaurant',
    tagline: 'Marisquería de Lonja & Brasas',
    phone: '+34981820000',
    whatsappNumber: '34711573870',
    address: 'Paseo Marítimo 4',
    city: 'Noia',
    postalCode: '15200',
    cuisineType: ['Marisquería', 'Pescados'],
    priceRange: '€€€',
    heroImagePoster: '/images/casamar-poster.jpg',
    dishes: [],
    ambiences: [],
    openingHours: []
  }

  const jsonLd = buildRestaurantJsonLd(mockRestaurant)

  assert.equal(jsonLd['@type'], 'Restaurant')
  assert.equal(jsonLd.acceptsReservations, true)
  assert.equal(jsonLd.hasMenu, 'https://fluxogastro.com/p/casa-mar-da-vila')
})
