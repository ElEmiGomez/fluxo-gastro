// ==============================================================================
// FLUXO — SEED DE DEMO + STORE LOCAL DE FACTURACIÓN
// Fallback automático cuando Supabase no devuelve registros (entorno local sin
// conexión). Persistencia en localStorage `fluxo_crm_billing_v1`, editable en
// vivo desde el CRM Fundador.
// ==============================================================================

import {
  LocalBilling,
  PauseLevel,
  PaymentStatus,
  PaymentMethod,
  PlanType,
} from './billing-calculations'

export const BILLING_STORE_KEY = 'fluxo_crm_billing_v1'

/** Alta fundador de Casa Mar Da Vila: ~10 meses de antigüedad (transición a mes 13 a punto). */
const CASAMAR_FOUNDER_STARTED_AT = '2026-01-20T10:00:00.000Z'

export const DEMO_LOCALES: LocalBilling[] = [
  {
    id: 'demo-loc-casamar',
    slug: 'casa-mar-da-vila',
    nombre: 'Casa Mar Da Vila',
    plan_type: 'full_fundador',
    monthly_price_eur: 50,
    is_founder_slot: true,
    founder_started_at: CASAMAR_FOUNDER_STARTED_AT,
    founder_commitment_accepted: true,
    billing_day: 2,
    payment_status: 'paid',
    payment_method: 'bizum',
    has_payment_proof: true,
    pause_level: 0,
    owner_email: 'dueno@casamardavila.es',
    owner_phone: '34600111001',
  },
  {
    id: 'demo-loc-opazo',
    slug: 'taperia-o-pazo',
    nombre: 'Tapería O Pazo',
    plan_type: 'sala',
    monthly_price_eur: 69,
    is_founder_slot: false,
    founder_started_at: null,
    founder_commitment_accepted: false,
    billing_day: 1,
    payment_status: 'pending',
    payment_method: 'transfer',
    has_payment_proof: false,
    pause_level: 1,
    owner_email: 'dueno@taperiaopazo.es',
    owner_phone: '34600111002',
  },
  {
    id: 'demo-loc-brasa',
    slug: 'brasa-smash-noia',
    nombre: 'Brasa & Smash Noia',
    plan_type: 'carta',
    monthly_price_eur: 39,
    is_founder_slot: false,
    founder_started_at: null,
    founder_commitment_accepted: false,
    billing_day: 3,
    payment_status: 'overdue',
    payment_method: 'cash',
    has_payment_proof: false,
    pause_level: 2,
    owner_email: 'dueno@brasasmash.es',
    owner_phone: '34600111003',
  },
]

function isLocalBilling(value: unknown): value is LocalBilling {
  if (!value || typeof value !== 'object') return false
  const v = value as Partial<LocalBilling>
  return (
    typeof v.id === 'string' &&
    typeof v.slug === 'string' &&
    typeof v.nombre === 'string' &&
    typeof v.plan_type === 'string'
  )
}

/** Carga el store de facturación; si no existe o está corrupto, siembra la demo. */
export function loadBillingLocales(): LocalBilling[] {
  if (typeof window === 'undefined') return DEMO_LOCALES
  try {
    const raw = localStorage.getItem(BILLING_STORE_KEY)
    if (!raw) return [...DEMO_LOCALES]
    const parsed: unknown = JSON.parse(raw)
    if (Array.isArray(parsed) && parsed.length > 0 && parsed.every(isLocalBilling)) {
      return parsed as LocalBilling[]
    }
  } catch {
    // store corrupto → fallback al seed
  }
  return [...DEMO_LOCALES]
}

/** Persistencia completa del array de locales. */
export function saveBillingLocales(locales: LocalBilling[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(BILLING_STORE_KEY, JSON.stringify(locales))
  } catch {
    // cuota llena o modo privado → solo estado en memoria
  }
}

/** Edición en vivo de un local (pago, plan, pause_level…) + persistencia. */
export function updateBillingLocal(
  locales: LocalBilling[],
  id: string,
  patch: Partial<
    Pick<
      LocalBilling,
      'plan_type' | 'payment_status' | 'pause_level' | 'payment_method' | 'monthly_price_eur' | 'billing_day' | 'has_payment_proof'
    >
  > & { plan_type?: PlanType; payment_status?: PaymentStatus; pause_level?: PauseLevel; payment_method?: PaymentMethod }
): LocalBilling[] {
  const next = locales.map((local) =>
    local.id === id ? { ...local, ...patch } : local
  )
  saveBillingLocales(next)
  return next
}

/** Restablece el seed de demostración (borra overrides del usuario). */
export function resetDemoLocales(): LocalBilling[] {
  saveBillingLocales([...DEMO_LOCALES])
  return [...DEMO_LOCALES]
}

/** Lectura ligera del pause_level por slug (para la carta pública /p/[slug]). */
export function getPauseLevelBySlug(slug: string): PauseLevel {
  const local = loadBillingLocales().find((l) => l.slug === slug)
  return local ? local.pause_level : 0
}
