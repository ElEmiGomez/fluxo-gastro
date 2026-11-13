/**
 * Tipos de Dominio para las Webs Oficiales Cinemáticas de Restaurantes B2C (/web/[slug])
 * Fluxo Gastronomic System - Arquitectura Multi-Arquetipo (5 Arquetipos Base)
 */

export type RestaurantArchetype =
  | 'urban_street'      // Hamburgueserías, pizzerías, cervecerías craft (alto contraste, bold)
  | 'alta_mesa'         // Marisquerías, asadores de carne madurada (editorial serif, máxima elegancia)
  | 'gastro_bistro'     // Taperías modernas, vinotecas (Apple Glass cálido, equilibrado)
  | 'daylight_cafe'     // Cafeterías de especialidad, brunch, panaderías (luminoso, tonos crema)
  | 'taberna_rustica'   // Pulperías, furanchos, casas de comidas (madera, piedra, tradición gallega)
  // Compatibilidad hacia atrás:
  | 'tavern'
  | 'restaurant'
  | 'cafe'

export type WebLanguage = 'es' | 'gl' | 'en'

export interface OpeningSchedule {
  dayOfWeek: number // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
  open: string // Formato "HH:MM" (ej. "12:30")
  close: string // Formato "HH:MM" (ej. "16:00" o "02:30" al día siguiente)
  label?: string // ej. "Almuerzo", "Cena", "Servicio Continuo"
  kitchenClose?: string // Formato "HH:MM" (ej. "15:30" o "23:00")
}

export interface DishVariantItem {
  name: string
  price: number
  name_gl?: string
  name_en?: string
}

export interface DishShowcaseItem {
  id: string
  name: string
  name_gl?: string
  name_en?: string
  category: string
  category_gl?: string
  category_en?: string
  price: number
  description: string
  description_gl?: string
  description_en?: string
  image: string
  allergens?: string[]
  variants?: DishVariantItem[]
  isSignature?: boolean // Plato insignia
  isDailyMarket?: boolean // Sugerencia de lonja / mercado del día
  isMarketPrice?: boolean // true si es "🌊 Precio según lonja"
}

export interface SpaceAmbienceItem {
  id: string
  name: string
  name_gl?: string
  name_en?: string
  subtitle: string
  subtitle_gl?: string
  subtitle_en?: string
  desc: string
  desc_gl?: string
  desc_en?: string
  badge: string
  badge_gl?: string
  badge_en?: string
  imageDay: string
  imageNight: string
  lightingNoteDay: string
  lightingNoteDay_gl?: string
  lightingNoteDay_en?: string
  lightingNoteNight: string
  lightingNoteNight_gl?: string
  lightingNoteNight_en?: string
}

export interface SocialReviewItem {
  author: string
  rating: number
  text: string
  text_gl?: string
  text_en?: string
  date: string
  source: 'google'
}

export interface GastronomicTenantConfig {
  slug: string
  name: string
  archetype: RestaurantArchetype
  tagline: string
  tagline_gl?: string
  tagline_en?: string
  logoUrl?: string
  phone: string
  whatsappNumber: string // Formato internacional sin símbolos (ej. "34711573870")
  address: string
  city: string
  postalCode: string
  cuisineType: string[]
  priceRange: '€' | '€€' | '€€€' | '€€€€'
  googleMapsUrl?: string
  googlePlaceId?: string
  googleMapsRating?: number // ej. 4.8
  googleMapsReviewCount?: number // ej. 312
  primaryColor?: string
  accentColor?: string
  heroImagePoster: string
  heroVideoWebm?: string
  heroVideoMp4?: string
  flankLeftImage?: string
  flankRightImage?: string
  dishes: DishShowcaseItem[]
  ambiences: SpaceAmbienceItem[]
  openingHours: OpeningSchedule[]
  reviews?: SocialReviewItem[]
  historyTitle?: string
  historyTitle_gl?: string
  historyTitle_en?: string
  historyText?: string[]
  historyText_gl?: string[]
  historyText_en?: string[]
  wifiSsid?: string
  wifiPassword?: string
  qrMenuUrl?: string
  externalBookingUrl?: string
  vacationNotice?: string // Aviso temporal de vacaciones o festivos
}
