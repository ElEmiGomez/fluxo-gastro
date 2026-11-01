// ============================================================================
// Fluxo Multi-Domain - Resolutor de Dominios con Caché en Memoria (Edge-Safe)
// ============================================================================

export interface DomainCacheEntry {
  slug: string
  expiresAt: number
}

// Mapa semilla instantáneo en memoria para locales de demostración
export const SEED_DOMAINS: Record<string, string> = {
  'casamardavila.es': 'casa-mar-da-vila',
  'casamardavila.com': 'casa-mar-da-vila',
  'taperiaopazo.es': 'taperia-o-pazo',
  'taperiaopazo.com': 'taperia-o-pazo',
  'brasaysmashnoia.es': 'brasa-y-smash-noia',
  'brasaysmashnoia.com': 'brasa-y-smash-noia',
}

const domainCache = new Map<string, DomainCacheEntry>()
const TTL_MS = 5 * 60 * 1000 // 5 minutos de TTL

/**
 * Normaliza un hostname quitando prefijos 'www.' y puertos ':3000'
 */
export function normalizeHostname(host: string): string {
  let clean = host.toLowerCase().trim()
  if (clean.includes(':')) {
    clean = clean.split(':')[0]
  }
  if (clean.startsWith('www.')) {
    clean = clean.substring(4)
  }
  return clean
}

/**
 * Comprueba si un hostname pertenece a la infraestructura nativa de Fluxo
 */
export function isPlatformHost(host: string): boolean {
  const clean = normalizeHostname(host)
  return (
    clean === 'localhost' ||
    clean === '127.0.0.1' ||
    clean === '0.0.0.0' ||
    clean.endsWith('.vercel.app') ||
    clean === 'fluxo.es' ||
    clean === 'fluxo-gastro.vercel.app'
  )
}

/**
 * Resuelve el slug correspondiente a un dominio personalizado:
 * 1. Comprueba el mapa semilla instantáneo.
 * 2. Comprueba la caché en memoria de 5 min.
 * 3. Si no existe y hay credenciales de Supabase, consulta la base de datos vía REST (Edge-safe).
 */
export async function resolveSlugByDomain(hostname: string): Promise<string | null> {
  const cleanHost = normalizeHostname(hostname)

  // 1. Mapa Semilla
  if (SEED_DOMAINS[cleanHost]) {
    return SEED_DOMAINS[cleanHost]
  }

  // 2. Caché en Memoria
  const cached = domainCache.get(cleanHost)
  if (cached && Date.now() < cached.expiresAt) {
    return cached.slug
  }

  // 3. Consulta a Supabase vía Fetch (100% compatible con Edge Runtime)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (supabaseUrl && supabaseAnonKey) {
    try {
      const endpoint = `${supabaseUrl}/rest/v1/restaurants?custom_domain=eq.${encodeURIComponent(
        cleanHost
      )}&select=slug&limit=1`

      const res = await fetch(endpoint, {
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
        },
        cache: 'no-store',
      })

      if (res.ok) {
        const rows = await res.json()
        if (Array.isArray(rows) && rows.length > 0 && rows[0].slug) {
          const resolvedSlug = rows[0].slug
          domainCache.set(cleanHost, {
            slug: resolvedSlug,
            expiresAt: Date.now() + TTL_MS,
          })
          return resolvedSlug
        }
      }
    } catch (err) {
      console.warn('[DomainResolver] Error resolviendo dominio en Supabase:', err)
    }
  }

  return null
}
