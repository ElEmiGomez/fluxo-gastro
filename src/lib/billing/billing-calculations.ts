// ==============================================================================
// FLUXO — MOTOR DE CÁLCULO FINANCIERO (CRM Fundador)
// Funciones puras sin dependencias externas. Fuente de verdad de la suite
// comercial: planes, MRR, ARR proyectado y Semáforo de Vencimientos.
// ==============================================================================

export type PlanType = 'carta' | 'sala' | 'full_fundador' | 'full' | 'hibernacion'

export type PaymentStatus = 'paid' | 'proof_pending' | 'pending' | 'overdue'

export type PaymentMethod =
  | 'stripe_card'
  | 'stripe_sepa'
  | 'apple_pay'
  | 'bizum'
  | 'transfer'
  | 'cash'

export type PauseLevel = 0 | 1 | 2

/** Plazas fundador activas máximas en todo el sistema. */
export const FOUNDER_SLOTS_MAX = 5

/** Precio fundador (primeros 12 meses). */
export const FOUNDER_PRICE_EUR = 50

/** Precio fundador a partir del mes 13. */
export const FOUNDER_GRADUATED_PRICE_EUR = 99

export interface LocalBilling {
  id: string
  slug: string
  nombre: string
  plan_type: PlanType
  monthly_price_eur: number
  is_founder_slot: boolean
  /** ISO date de alta en el programa fundador (solo full_fundador). */
  founder_started_at: string | null
  founder_commitment_accepted: boolean
  /** Día del mes de cobro: 1 al 5. */
  billing_day: number
  payment_status: PaymentStatus
  payment_method: PaymentMethod
  /** Comprobante subido en el ciclo actual (métodos manuales). */
  has_payment_proof: boolean
  pause_level: PauseLevel
  owner_email: string
  /** Teléfono WhatsApp del dueño (formato internacional, sin +). */
  owner_phone: string
}

export interface PlanConfig {
  label: string
  basePriceEur: number
  note: string
}

export const PLAN_CONFIG: Record<PlanType, PlanConfig> = {
  carta: { label: 'Carta QR', basePriceEur: 39, note: '+ IVA' },
  sala: { label: 'Sala (sin KDS)', basePriceEur: 69, note: '+ IVA' },
  full_fundador: {
    label: 'Full Fundador · 50 €/mes (12 meses)',
    basePriceEur: FOUNDER_PRICE_EUR,
    note: '+ IVA · luego 99 €/mes + IVA',
  },
  full: { label: 'Full', basePriceEur: 99, note: '+ IVA' },
  hibernacion: { label: 'Hibernación', basePriceEur: 9, note: '+ IVA · estancia mínima 1 mes' },
}

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  stripe_card: 'Stripe · Tarjeta',
  stripe_sepa: 'Stripe · SEPA',
  apple_pay: 'Apple Pay',
  bizum: 'Bizum',
  transfer: 'Transferencia',
  cash: 'Efectivo',
}

/** Métodos manuales: exigen comprobante obligatorio en el bucket payment-proofs. */
export const MANUAL_PAYMENT_METHODS: PaymentMethod[] = ['bizum', 'transfer', 'cash']

export interface TrafficLightState {
  state: 'green' | 'yellow' | 'red'
  label: string
  daysOverdue: number
}

/**
 * Semáforo de vencimientos en vivo.
 * - green: pago confirmado en el ciclo actual.
 * - yellow: dentro de la ventana de cobro (días 1-5) o comprobante pendiente de validar.
 * - red: vencido tras pasar su billing_day (indica días de retraso).
 */
export function calculateTrafficLight(
  billingDay: number,
  paymentStatus: PaymentStatus,
  currentDate: Date
): TrafficLightState {
  const dayOfMonth = currentDate.getDate()

  if (paymentStatus === 'paid') {
    return { state: 'green', label: 'Al día', daysOverdue: 0 }
  }

  if (paymentStatus === 'proof_pending') {
    return { state: 'yellow', label: 'Comprobante por validar', daysOverdue: 0 }
  }

  if (dayOfMonth <= 5 && dayOfMonth <= billingDay) {
    return { state: 'yellow', label: `Ventana de cobro (día ${billingDay})`, daysOverdue: 0 }
  }

  if (dayOfMonth > billingDay) {
    const daysOverdue = dayOfMonth - billingDay
    return { state: 'red', label: `Vencido · ${daysOverdue} d`, daysOverdue }
  }

  return { state: 'yellow', label: 'Pendiente de cobro', daysOverdue: 0 }
}

/** Meses completos transcurridos desde una fecha ISO hasta la fecha dada. */
export function monthsElapsed(sinceIso: string, at: Date): number {
  const since = new Date(sinceIso)
  if (Number.isNaN(since.getTime())) return 0
  let months = (at.getFullYear() - since.getFullYear()) * 12 + (at.getMonth() - since.getMonth())
  if (at.getDate() < since.getDate()) months -= 1
  return Math.max(0, months)
}

/**
 * Cuota mensual base (sin IVA) que corresponde hoy al local.
 * full_fundador: 50 € los primeros 12 meses, 99 € a partir del mes 13.
 */
export function getMonthlyBase(local: LocalBilling, at: Date = new Date()): number {
  if (local.plan_type === 'full_fundador') {
    const months = local.founder_started_at
      ? monthsElapsed(local.founder_started_at, at)
      : 0
    return months >= 12 ? FOUNDER_GRADUATED_PRICE_EUR : FOUNDER_PRICE_EUR
  }
  return local.monthly_price_eur
}

/** MRR Cobrado: suma de cuotas base de locales con pago confirmado en el ciclo. */
export function calculateConfirmedMRR(
  locales: LocalBilling[],
  at: Date = new Date()
): number {
  return locales
    .filter((l) => l.payment_status === 'paid')
    .reduce((sum, l) => sum + getMonthlyBase(l, at), 0)
}

/** MRR Pendiente: pending, overdue o a la espera de validación de comprobante. */
export function calculatePendingMRR(
  locales: LocalBilling[],
  at: Date = new Date()
): number {
  return locales
    .filter(
      (l) =>
        l.payment_status === 'pending' ||
        l.payment_status === 'overdue' ||
        l.payment_status === 'proof_pending'
    )
    .reduce((sum, l) => sum + getMonthlyBase(l, at), 0)
}

/**
 * ARR Proyectado a 12 meses vista.
 * full_fundador: M = max(0, 12 - mesesTranscurridos); suma (M * 50) + ((12 - M) * 99).
 * Resto de planes: cuota base actual * 12.
 */
export function calculateProjectedARR(
  locales: LocalBilling[],
  at: Date = new Date()
): number {
  let total = 0
  for (const local of locales) {
    if (local.plan_type === 'full_fundador' && local.founder_started_at) {
      const m = Math.max(0, 12 - monthsElapsed(local.founder_started_at, at))
      const rest = 12 - m
      total += m * FOUNDER_PRICE_EUR + rest * FOUNDER_GRADUATED_PRICE_EUR
    } else {
      total += getMonthlyBase(local, at) * 12
    }
  }
  return total
}

/** Plazas fundador ocupadas (plan full_fundador activo) X / 5. */
export function countFounderSlots(locales: LocalBilling[]): number {
  return locales.filter(
    (l) => l.is_founder_slot && l.plan_type === 'full_fundador'
  ).length
}

/** ¿Quedan plazas fundador disponibles? (check de alta de nuevos fundadores). */
export function hasFounderSlotAvailable(locales: LocalBilling[]): boolean {
  return countFounderSlots(locales) < FOUNDER_SLOTS_MAX
}

export const STATUS_LABEL: Record<PaymentStatus, string> = {
  paid: 'Pagado',
  proof_pending: 'Comprobante en revisión',
  pending: 'Pendiente',
  overdue: 'Vencido',
}

export const PAUSE_LEVEL_LABEL: Record<PauseLevel, string> = {
  0: 'Normal',
  1: 'Aviso suave',
  2: 'Mantenimiento protegido',
}
