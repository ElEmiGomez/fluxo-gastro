import React from 'react'
import { Restaurant, Category, Product } from '@/types/database.types'

interface RestaurantJsonLdProps {
  restaurant: Restaurant
  categories: Category[]
  products: Product[]
}

export function RestaurantJsonLd({
  restaurant,
  categories,
  products,
}: RestaurantJsonLdProps) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://gastropwa.com'
  const menuUrl = `${baseUrl}/menu/${restaurant.slug}`

  // 1. Mapeo jerárquico de Categorías -> Productos para Schema.org/Menu
  const menuSections = categories.map((cat) => {
    const categoryProducts = products.filter((p) => p.category_id === cat.id && p.is_available)
    return {
      '@type': 'MenuSection',
      name: cat.name,
      hasMenuItem: categoryProducts.map((p) => ({
        '@type': 'MenuItem',
        name: p.name,
        description: p.description || undefined,
        image: p.image_url ? (p.image_url.startsWith('http') ? p.image_url : `${baseUrl}${p.image_url}`) : undefined,
        offers: {
          '@type': 'Offer',
          price: p.price.toFixed(2),
          priceCurrency: 'EUR',
          availability: 'https://schema.org/InStock',
        },
      })),
    }
  })

  // 2. Estructura canónica Schema.org/Restaurant
  const restaurantSchema: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    name: restaurant.name,
    image: restaurant.logo_url
      ? (restaurant.logo_url.startsWith('http') ? restaurant.logo_url : `${baseUrl}${restaurant.logo_url}`)
      : `${baseUrl}/icon.svg`,
    url: menuUrl,
    telephone: restaurant.phone || undefined,
    priceRange: restaurant.price_range || '€€',
    servesCuisine: restaurant.cuisine_type || ['Gastronomía Gallega', 'Tapas', 'Comida Casera'],
    address: restaurant.address
      ? {
          '@type': 'PostalAddress',
          streetAddress: restaurant.address,
          addressLocality: restaurant.city || 'Noia',
          postalCode: restaurant.postal_code || '15200',
          addressRegion: 'A Coruña',
          addressCountry: 'ES',
        }
      : undefined,
    hasMenu: {
      '@type': 'Menu',
      name: `Carta Digital Oficial - ${restaurant.name}`,
      url: menuUrl,
      hasMenuSection: menuSections,
    },
    potentialAction: {
      '@type': 'OrderAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: menuUrl,
        inLanguage: ['es', 'gl', 'en'],
        actionPlatform: [
          'http://schema.org/DesktopWebPlatform',
          'http://schema.org/MobileWebPlatform',
          'http://schema.org/IOSPlatform',
          'http://schema.org/AndroidPlatform',
        ],
      },
      deliveryMethod: 'http://purl.org/goodrelations/v1#DeliveryModePickUp',
    },
  }

  // Si cuenta con Google Place ID, inyectar el identificador directo
  if (restaurant.google_place_id) {
    restaurantSchema.identifier = restaurant.google_place_id
    restaurantSchema.sameAs = [
      `https://maps.google.com/?cid=${restaurant.google_place_id}`,
      restaurant.google_review_url || undefined,
    ].filter(Boolean)
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(restaurantSchema) }}
    />
  )
}
