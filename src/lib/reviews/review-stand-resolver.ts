import { createServerClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import { getGastronomicTenant, resolveGoogleReviewUrl } from '@/lib/web-tenants'
import { getCRMLeadBySlug } from '@/lib/supabase/repositories/crm.repository'
import { normalizeSlug } from '@/lib/slugify'
import { CRMLead, normalizeLeadCity } from '@/types/crm.types'

export interface ResolvedReviewTarget {
  slug: string
  restaurantName: string
  city: string
  logoUrl?: string
  whatsappNumber?: string
  googleReviewUrl: string
  enableGatekeeper: boolean
  isDefaultTemplate?: boolean
  source: 'tenant' | 'crm_lead' | 'restaurant' | 'default'
}

export interface ReviewTargetOverrides {
  name?: string
  city?: string
  logoUrl?: string
  reviewUrl?: string
}

const DEFAULT_TEMPLATE_SLUGS = new Set(['predeterminada', 'default', 'generico'])

/**
 * Resuelve la URL directa de reseñas de Google Maps para un lead del CRM.
 * Prioridad:
 * 1. google_review_url explícita
 * 2. google_place_id -> enlace nativo writereview
 * 3. google_profile_url
 * 4. Búsqueda en Google Maps por nombre + dirección + ciudad
 */
export function resolveLeadGoogleReviewUrl(
  lead: Pick<
    CRMLead,
    'name' | 'address' | 'city' | 'google_review_url' | 'google_place_id' | 'google_profile_url'
  >
): string {
  const direct = lead.google_review_url?.trim()
  if (direct) return direct

  const placeId = lead.google_place_id?.trim()
  if (placeId) {
    return `https://search.google.com/local/writereview?placeid=${encodeURIComponent(placeId)}`
  }

  const profile = lead.google_profile_url?.trim()
  if (profile) return profile

  const city = normalizeLeadCity(lead)
  const query = [lead.name, lead.address, city].filter(Boolean).join(' ').trim()
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query || lead.name)}`
}

/**
 * Resuelve de forma unificada el destino de impresión (/admin/print-review-stand/[slug])
 * y de redirección pública (/r/[slug]):
 * 1. Plantilla predeterminada limpia (solo si allowDefault = true)
 * 2. Tenants curados de web-tenants.ts
 * 3. Leads dinámicos del CRM (Supabase crm_leads + .fluxo-data/crm_leads.json)
 * 4. Coincidencia exacta por slug en tabla restaurants (nunca usa fallback burger-gourmet)
 */
export async function resolveReviewStandTarget(
  slug: string,
  options?: {
    allowDefault?: boolean
    overrides?: ReviewTargetOverrides
  }
): Promise<ResolvedReviewTarget | null> {
  const rawSlug = (slug || '').trim()
  const normalized = normalizeSlug(rawSlug)
  const overrides = options?.overrides

  // 1. Plantilla predeterminada / genérica (sin logo por defecto)
  if (options?.allowDefault && DEFAULT_TEMPLATE_SLUGS.has(normalized)) {
    return {
      slug: normalized || 'predeterminada',
      restaurantName: overrides?.name?.trim() || 'Tu Local',
      city: overrides?.city?.trim() || '',
      logoUrl: overrides?.logoUrl?.trim() || undefined,
      googleReviewUrl:
        overrides?.reviewUrl?.trim() || 'https://search.google.com/local/writereview',
      enableGatekeeper: false,
      isDefaultTemplate: true,
      source: 'default',
    }
  }

  // 2. Tenants curados de web-tenants.ts
  const tenant = await getGastronomicTenant(rawSlug)
  if (tenant) {
    return {
      slug: tenant.slug,
      restaurantName: overrides?.name?.trim() || tenant.name,
      city: overrides?.city?.trim() || tenant.city,
      logoUrl: overrides?.logoUrl?.trim() || tenant.logoUrl,
      whatsappNumber: tenant.whatsappNumber,
      googleReviewUrl: overrides?.reviewUrl?.trim() || resolveGoogleReviewUrl(tenant),
      enableGatekeeper: Boolean(tenant.enableReviewGatekeeper),
      isDefaultTemplate: false,
      source: 'tenant',
    }
  }

  // 3. Lead dinámico del CRM (por custom_slug, id o nombre normalizado)
  const crmLead = await getCRMLeadBySlug(rawSlug)
  if (crmLead) {
    const leadSlug = crmLead.custom_slug
      ? normalizeSlug(crmLead.custom_slug)
      : normalizeSlug(crmLead.name) || crmLead.id

    return {
      slug: leadSlug,
      restaurantName: overrides?.name?.trim() || crmLead.name,
      city: overrides?.city?.trim() || normalizeLeadCity(crmLead),
      logoUrl: overrides?.logoUrl?.trim() || crmLead.logo_url || undefined,
      whatsappNumber: crmLead.contact_whatsapp || crmLead.contact_phone || undefined,
      googleReviewUrl: overrides?.reviewUrl?.trim() || resolveLeadGoogleReviewUrl(crmLead),
      enableGatekeeper: Boolean(crmLead.enable_review_gatekeeper),
      isDefaultTemplate: false,
      source: 'crm_lead',
    }
  }

  // 4. Coincidencia exacta en tabla restaurants (sin fallback burger-gourmet)
  if (normalized) {
    const supabase = createServerClient()
    if (supabase && isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('restaurants')
          .select('slug, name, address, phone, logo_url, google_review_url')
          .eq('slug', normalized)
          .maybeSingle()

        if (!error && data && data.slug === normalized) {
          const restName = data.name || normalized
          const reviewUrl =
            data.google_review_url?.trim() ||
            `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
              [restName, data.address].filter(Boolean).join(' ')
            )}`

          return {
            slug: data.slug,
            restaurantName: overrides?.name?.trim() || restName,
            city: overrides?.city?.trim() || data.address || '',
            logoUrl: overrides?.logoUrl?.trim() || data.logo_url || undefined,
            whatsappNumber: data.phone || undefined,
            googleReviewUrl: overrides?.reviewUrl?.trim() || reviewUrl,
            enableGatekeeper: false,
            isDefaultTemplate: false,
            source: 'restaurant',
          }
        }
      } catch (e) {
        console.warn('[ReviewStandResolver] Error consultando tabla restaurants:', e)
      }
    }
  }

  return null
}
