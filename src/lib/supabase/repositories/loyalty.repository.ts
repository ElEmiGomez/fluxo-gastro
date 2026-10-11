import { createServerClient } from '../server'
import { isSupabaseConfigured } from '../client'
import {
  LoyaltyProfile,
  LoyaltyReward,
  LoyaltyEscrowHold,
  LoyaltySettlementResult,
  LoyaltyTableMember,
  LoyaltyDinerSettlement,
} from '@/types/loyalty.types'
import { Product } from '@/types/database.types'
import { MOCK_PRODUCTS } from '../mock-fallback'
import { getTargetRestaurantId } from './restaurants.repository'

// Almacén en memoria global para resiliencia y pruebas offline
const globalStore = globalThis as unknown as {
  __GASTRO_LOYALTY_PROFILES__?: Record<string, LoyaltyProfile>
  __GASTRO_LOYALTY_REWARDS__?: Record<string, LoyaltyReward[]>
  __GASTRO_LOYALTY_ESCROW__?: Record<string, LoyaltyEscrowHold>
  __GASTRO_TABLE_LOYALTY_MEMBERS__?: Record<string, Record<string, LoyaltyTableMember>>
}

if (!globalStore.__GASTRO_TABLE_LOYALTY_MEMBERS__) {
  globalStore.__GASTRO_TABLE_LOYALTY_MEMBERS__ = {}
}


if (!globalStore.__GASTRO_LOYALTY_PROFILES__) {
  globalStore.__GASTRO_LOYALTY_PROFILES__ = {
    'burger-gourmet:carlos@ejemplo.com': {
      id: 'lprof-carlos-001',
      restaurant_slug: 'burger-gourmet',
      name: 'Carlos Gómez',
      email: 'carlos@ejemplo.com',
      phone: '+34 600 123 456',
      total_points: 60,
      held_points: 0,
      available_points: 60,
      google_review_bonus_awarded: false,
      created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
    },
    'burger-gourmet:laura@ejemplo.com': {
      id: 'lprof-laura-002',
      restaurant_slug: 'burger-gourmet',
      name: 'Laura Pérez',
      email: 'laura@ejemplo.com',
      phone: '+34 611 987 654',
      total_points: 120,
      held_points: 0,
      available_points: 120,
      google_review_bonus_awarded: true,
      created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
    },
  }
}

// Catálogo base de recompensas por puntos
const DEFAULT_REWARDS: Record<string, Array<{ product_id: string; points_cost: number }>> = {
  'burger-gourmet': [
    { product_id: 'p-caf-1', points_cost: 20 }, // Café de Especialidad: 20 pts
    { product_id: 'p-bsa-1', points_cost: 15 }, // Limonada Casera: 15 pts
    { product_id: 'p-bca-1', points_cost: 25 }, // Cerveza Artesanal IPA: 25 pts
    { product_id: 'p-ent-1', points_cost: 30 }, // Bastones de Mozzarella: 30 pts
    { product_id: 'p-pos-1', points_cost: 35 }, // Volcán de Chocolate: 35 pts
    { product_id: 'p-pos-2', points_cost: 35 }, // Tarta de Queso Artesana: 35 pts
    { product_id: 'p-bur-2', points_cost: 75 }, // Oklahoma Smash Burger: 75 pts
  ],
}

if (!globalStore.__GASTRO_LOYALTY_REWARDS__) {
  globalStore.__GASTRO_LOYALTY_REWARDS__ = {}
  Object.entries(DEFAULT_REWARDS).forEach(([slug, rewardsList]) => {
    globalStore.__GASTRO_LOYALTY_REWARDS__![slug] = rewardsList.map((r, idx) => ({
      id: `lrew-${slug}-${idx + 1}`,
      restaurant_slug: slug,
      product_id: r.product_id,
      points_cost: r.points_cost,
      is_active: true,
    }))
  })
}

if (!globalStore.__GASTRO_LOYALTY_ESCROW__) {
  globalStore.__GASTRO_LOYALTY_ESCROW__ = {}
}

function normalizeEmail(email: string): string {
  return (email || '').trim().toLowerCase()
}

function getMemoryKey(slug: string, email: string): string {
  return `${slug}:${normalizeEmail(email)}`
}

/**
 * Calcula los puntos retenidos activos para un perfil
 */
function computeHeldPointsForProfile(profileId: string, slug: string): number {
  const allHolds = Object.values(globalStore.__GASTRO_LOYALTY_ESCROW__ || {})
  return allHolds
    .filter(h => h.profile_id === profileId && h.restaurant_slug === slug && h.status === 'held')
    .reduce((sum, h) => sum + (Number(h.points) || 0), 0)
}

/**
 * 1. OBTENER PERFIL DE FIDELIZACIÓN (CON SALDO RETENIDO CALCULADO)
 */
export async function getLoyaltyProfile(slug: string, email: string): Promise<LoyaltyProfile | null> {
  const normEmail = normalizeEmail(email)
  if (!normEmail) return null

  const memKey = getMemoryKey(slug, normEmail)
  let profile = globalStore.__GASTRO_LOYALTY_PROFILES__?.[memKey] || null

  const supabase = createServerClient()
  if (supabase && isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('loyalty_profiles')
        .select('*')
        .eq('restaurant_slug', slug)
        .eq('email', normEmail)
        .maybeSingle()

      if (!error && data) {
        profile = {
          id: data.id,
          restaurant_slug: data.restaurant_slug,
          name: data.name,
          email: data.email,
          phone: data.phone,
          total_points: Number(data.total_points) || 0,
          held_points: 0,
          available_points: Number(data.total_points) || 0,
          google_review_bonus_awarded: Boolean(data.google_review_bonus_awarded),
          created_at: data.created_at,
          updated_at: data.updated_at,
        }
        if (globalStore.__GASTRO_LOYALTY_PROFILES__) {
          globalStore.__GASTRO_LOYALTY_PROFILES__[memKey] = profile
        }
      }
    } catch (e) {
      console.warn('[getLoyaltyProfile] Fallback a memoria local:', e)
    }
  }

  if (!profile) return null

  // Calcular saldo retenido en tiempo real
  const held = computeHeldPointsForProfile(profile.id, slug)
  const available = Math.max(0, profile.total_points - held)

  return {
    ...profile,
    held_points: held,
    available_points: available,
  }
}

/**
 * GESTIÓN MULTI-COMENSAL: VINCULAR PERFIL A UNA MESA ACTIVA
 */
export async function linkLoyaltyProfileToTable(
  slug: string,
  tableNumber: number | string,
  email: string
): Promise<LoyaltyTableMember | null> {
  const normEmail = normalizeEmail(email)
  if (!normEmail) return null
  const profile = await getLoyaltyProfile(slug, normEmail)
  if (!profile) return null

  const tableKey = `${slug}:${tableNumber}`
  if (!globalStore.__GASTRO_TABLE_LOYALTY_MEMBERS__) {
    globalStore.__GASTRO_TABLE_LOYALTY_MEMBERS__ = {}
  }
  if (!globalStore.__GASTRO_TABLE_LOYALTY_MEMBERS__[tableKey]) {
    globalStore.__GASTRO_TABLE_LOYALTY_MEMBERS__[tableKey] = {}
  }

  const member: LoyaltyTableMember = {
    profile_id: profile.id,
    name: profile.name,
    email: normEmail,
    joined_at: new Date().toISOString(),
  }
  globalStore.__GASTRO_TABLE_LOYALTY_MEMBERS__[tableKey][normEmail] = member
  return member
}

export async function getTableLoyaltyMembers(
  slug: string,
  tableNumber: number | string
): Promise<LoyaltyTableMember[]> {
  const tableKey = `${slug}:${tableNumber}`
  const membersMap = globalStore.__GASTRO_TABLE_LOYALTY_MEMBERS__?.[tableKey] || {}
  return Object.values(membersMap)
}

export async function clearTableLoyaltyMembers(
  slug: string,
  tableNumber: number | string
): Promise<void> {
  const tableKey = `${slug}:${tableNumber}`
  if (globalStore.__GASTRO_TABLE_LOYALTY_MEMBERS__?.[tableKey]) {
    delete globalStore.__GASTRO_TABLE_LOYALTY_MEMBERS__[tableKey]
  }
}

/**
 * 2. REGISTRAR O RECUPERAR PERFIL ZERO-FRICCIÓN (NOMBRE + EMAIL + MESA)
 */
export async function registerOrGetLoyaltyProfile(
  slug: string,
  params: { name: string; email: string; phone?: string | null; tableNumber?: number | string }
): Promise<LoyaltyProfile> {
  const normEmail = normalizeEmail(params.email)
  const normName = (params.name || '').trim() || 'Comensal'

  let profile = await getLoyaltyProfile(slug, normEmail)
  if (profile) {
    if (params.name && params.name.trim() !== '' && profile.name !== normName) {
      profile.name = normName
      profile.updated_at = new Date().toISOString()
    }
    if (params.tableNumber) {
      await linkLoyaltyProfileToTable(slug, params.tableNumber, normEmail)
    }
    return profile
  }

  const newId = `lprof-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
  const newProfile: LoyaltyProfile = {
    id: newId,
    restaurant_slug: slug,
    name: normName,
    email: normEmail,
    phone: params.phone || null,
    total_points: 0,
    held_points: 0,
    available_points: 0,
    google_review_bonus_awarded: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }


  const memKey = getMemoryKey(slug, normEmail)
  if (globalStore.__GASTRO_LOYALTY_PROFILES__) {
    globalStore.__GASTRO_LOYALTY_PROFILES__[memKey] = newProfile
  }

  const supabase = createServerClient()
  if (supabase && isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('loyalty_profiles')
        .insert({
          id: newId,
          restaurant_slug: slug,
          name: normName,
          email: normEmail,
          phone: params.phone || null,
          total_points: 0,
          google_review_bonus_awarded: false,
        })
        .select('*')
        .maybeSingle()

      if (!error && data) {
        newProfile.id = data.id
      }
    } catch (e) {
      console.warn('[registerOrGetLoyaltyProfile] Fallback de inserción a memoria:', e)
    }
  }

  if (params.tableNumber) {
    await linkLoyaltyProfileToTable(slug, params.tableNumber, normEmail)
  }

  return newProfile
}

/**
 * 3. OBTENER CATÁLOGO DE RECOMPENSAS CANJEABLES
 */
export async function getLoyaltyRewards(slug: string): Promise<LoyaltyReward[]> {
  let rewards = globalStore.__GASTRO_LOYALTY_REWARDS__?.[slug] || globalStore.__GASTRO_LOYALTY_REWARDS__?.['burger-gourmet'] || []

  const supabase = createServerClient()
  if (supabase && isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('loyalty_rewards')
        .select('*')
        .eq('restaurant_slug', slug)
        .eq('is_active', true)

      if (!error && data && data.length > 0) {
        rewards = data as LoyaltyReward[]
      }
    } catch (e) {
      console.warn('[getLoyaltyRewards] Fallback a catálogo en memoria:', e)
    }
  }

  // Hidratar con datos de productos del restaurante
  const productsList = MOCK_PRODUCTS[slug] || MOCK_PRODUCTS['burger-gourmet'] || []
  return rewards.map(r => {
    const prod = productsList.find(p => p.id === r.product_id)
    return {
      ...r,
      product: prod,
    }
  })
}

/**
 * 4. PATRÓN ESCROW: RETENER PUNTOS AL AÑADIR/PEDIR UN PLATO DE CANJE
 */
export async function holdLoyaltyPoints(
  slug: string,
  params: {
    email: string
    points: number
    tableNumber: number | string
    sessionToken: string
    productId?: string
  }
): Promise<{ success: boolean; profile: LoyaltyProfile; hold: LoyaltyEscrowHold }> {
  const profile = await getLoyaltyProfile(slug, params.email)
  if (!profile) {
    throw new Error('Perfil de fidelización no encontrado.')
  }

  if (profile.available_points < params.points) {
    throw new Error(
      `Puntos insuficientes: Tienes ${profile.available_points} pts disponibles, pero este canje requiere ${params.points} pts.`
    )
  }

  // Asegurar que el comensal está vinculado a la mesa
  if (params.tableNumber) {
    await linkLoyaltyProfileToTable(slug, params.tableNumber, params.email)
  }

  const holdId = `lhold-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
  const hold: LoyaltyEscrowHold = {
    id: holdId,
    profile_id: profile.id,
    restaurant_slug: slug,
    table_number: params.tableNumber,
    session_token: params.sessionToken,
    points: params.points,
    product_id: params.productId,
    status: 'held',
    created_at: new Date().toISOString(),
  }


  if (globalStore.__GASTRO_LOYALTY_ESCROW__) {
    globalStore.__GASTRO_LOYALTY_ESCROW__[holdId] = hold
  }

  const supabase = createServerClient()
  if (supabase && isSupabaseConfigured()) {
    try {
      await supabase.from('loyalty_escrow_holds').insert({
        id: holdId,
        profile_id: profile.id,
        restaurant_slug: slug,
        table_number: Number(params.tableNumber) || 1,
        session_token: params.sessionToken,
        points: params.points,
        product_id: params.productId,
        status: 'held',
      })
    } catch (e) {
      console.warn('[holdLoyaltyPoints] Guardado en memoria local:', e)
    }
  }

  const updatedProfile = await getLoyaltyProfile(slug, params.email)
  return {
    success: true,
    profile: updatedProfile!,
    hold,
  }
}

/**
 * 5. PATRÓN ESCROW: LIBERAR PUNTOS SI SE CANCELA EL PLATO O LA COMANDA
 */
export async function releaseLoyaltyPoints(
  slug: string,
  params: {
    email: string
    points?: number
    tableNumber?: number | string
    holdId?: string
  }
): Promise<{ success: boolean; profile: LoyaltyProfile }> {
  const profile = await getLoyaltyProfile(slug, params.email)
  if (!profile) {
    throw new Error('Perfil de fidelización no encontrado.')
  }

  const allHolds = globalStore.__GASTRO_LOYALTY_ESCROW__ || {}
  for (const [hId, h] of Object.entries(allHolds)) {
    if (h.profile_id === profile.id && h.status === 'held') {
      if (params.holdId && (hId === params.holdId || h.id === params.holdId)) {
        h.status = 'released'
        break
      } else if (params.tableNumber && String(h.table_number) === String(params.tableNumber)) {
        h.status = 'released'
        if (params.points && h.points === params.points) break
      } else if (!params.holdId && !params.tableNumber) {
        h.status = 'released'
        if (params.points && h.points === params.points) break
      }
    }
  }

  const supabase = createServerClient()
  if (supabase && isSupabaseConfigured()) {
    try {
      let query = supabase
        .from('loyalty_escrow_holds')
        .update({ status: 'released' })
        .eq('profile_id', profile.id)
        .eq('status', 'held')

      if (params.holdId) {
        query = query.eq('id', params.holdId)
      } else if (params.tableNumber) {
        query = query.eq('table_number', Number(params.tableNumber) || 1)
      }

      await query
    } catch (e) {
      console.warn('[releaseLoyaltyPoints] Fallback a memoria:', e)
    }
  }

  const updatedProfile = await getLoyaltyProfile(slug, params.email)
  return {
    success: true,
    profile: updatedProfile!,
  }
}

/**
 * 6. CIERRE DE MESA: LIQUIDAR SALDO RETENIDO Y ACREDITAR PUNTOS GANADOS (MULTI-COMENSAL)
 */
export async function settleLoyaltySession(
  slug: string,
  params: {
    tableNumber: number | string
    sessionToken?: string
    finalAmount: number
    email?: string
  }
): Promise<LoyaltySettlementResult | null> {
  const allHolds = Object.values(globalStore.__GASTRO_LOYALTY_ESCROW__ || {})
  const sessionHolds = allHolds.filter(h =>
    h.restaurant_slug === slug &&
    String(h.table_number) === String(params.tableNumber) &&
    h.status === 'held'
  )

  // 1. Recopilar todos los perfiles asociados a esta mesa (holds + miembros registrados + param)
  const profilesMap = new Map<string, LoyaltyProfile>()

  // A) Perfiles con canjes retenidos
  for (const hold of sessionHolds) {
    const p = Object.values(globalStore.__GASTRO_LOYALTY_PROFILES__ || {}).find(prof => prof.id === hold.profile_id)
    if (p) profilesMap.set(p.id, p)
  }

  // B) Perfiles registrados como comensales en la mesa
  const tableMembers = await getTableLoyaltyMembers(slug, params.tableNumber)
  for (const member of tableMembers) {
    if (!profilesMap.has(member.profile_id)) {
      const p = await getLoyaltyProfile(slug, member.email)
      if (p) profilesMap.set(p.id, p)
    }
  }

  // C) Si se pasó un email explícito por parámetro
  if (params.email) {
    const p = await getLoyaltyProfile(slug, params.email)
    if (p && !profilesMap.has(p.id)) profilesMap.set(p.id, p)
  }

  const identifiedProfiles = Array.from(profilesMap.values())
  if (identifiedProfiles.length === 0) {
    // Sesión anónima: sin comensal identificado de fidelización
    return null
  }

  // 2. Reparto multi-comensal proporcional
  const totalBillPoints = Math.max(0, Math.floor(Number(params.finalAmount) || 0))
  const numDiners = identifiedProfiles.length
  const basePointsPerDiner = Math.floor(totalBillPoints / numDiners)
  const remainderPoints = totalBillPoints % numDiners

  const breakdown: LoyaltyDinerSettlement[] = []
  let totalRedeemed = 0
  let totalEarned = 0

  const supabase = createServerClient()

  for (let i = 0; i < identifiedProfiles.length; i++) {
    const profile = identifiedProfiles[i]
    // Canjes de este comensal específico en esta mesa
    const dinerHolds = sessionHolds.filter(h => h.profile_id === profile.id)
    const dinerRedeemed = dinerHolds.reduce((acc, h) => acc + (Number(h.points) || 0), 0)

    // Reparto equitativo (el primer comensal recibe el remanente si no es divisible)
    const dinerEarned = basePointsPerDiner + (i === 0 ? remainderPoints : 0)

    const prevPoints = profile.total_points
    const newTotal = Math.max(0, prevPoints - dinerRedeemed) + dinerEarned

    // Actualizar en memoria global
    const memKey = getMemoryKey(slug, profile.email)
    const storeProfile = globalStore.__GASTRO_LOYALTY_PROFILES__?.[memKey]
    if (storeProfile) {
      storeProfile.total_points = newTotal
      storeProfile.updated_at = new Date().toISOString()
    } else if (globalStore.__GASTRO_LOYALTY_PROFILES__) {
      globalStore.__GASTRO_LOYALTY_PROFILES__[memKey] = {
        ...profile,
        total_points: newTotal,
        updated_at: new Date().toISOString(),
      }
    }

    // Actualizar en Supabase si está disponible
    if (supabase && isSupabaseConfigured()) {
      try {
        await supabase
          .from('loyalty_profiles')
          .update({
            total_points: newTotal,
            updated_at: new Date().toISOString(),
          })
          .eq('id', profile.id)
      } catch (e) {
        console.warn(`[settleLoyaltySession] Error en Supabase para perfil ${profile.id}:`, e)
      }
    }

    breakdown.push({
      profile_id: profile.id,
      customer_name: profile.name,
      customer_email: profile.email,
      redeemed_points: dinerRedeemed,
      earned_points: dinerEarned,
      previous_points: prevPoints,
      new_total_points: newTotal,
    })

    totalRedeemed += dinerRedeemed
    totalEarned += dinerEarned
  }

  // 3. Marcar todos los holds de la mesa como settled
  sessionHolds.forEach(h => {
    h.status = 'settled'
  })

  if (supabase && isSupabaseConfigured() && sessionHolds.length > 0) {
    try {
      await supabase
        .from('loyalty_escrow_holds')
        .update({ status: 'settled' })
        .eq('restaurant_slug', slug)
        .eq('table_number', Number(params.tableNumber) || 1)
        .eq('status', 'held')
    } catch (e) {
      console.warn('[settleLoyaltySession] Error actualizando holds en Supabase:', e)
    }
  }

  // Limpiar lista de comensales en la mesa cerrada
  await clearTableLoyaltyMembers(slug, params.tableNumber)

  // Comensal principal para compatibilidad con llamadas individuales
  const primary = breakdown[0]

  return {
    redeemed_points: totalRedeemed,
    earned_points: totalEarned,
    previous_points: primary.previous_points,
    new_total_points: primary.new_total_points,
    profile_id: primary.profile_id,
    customer_name: primary.customer_name,
    customer_email: primary.customer_email,
    diners_count: numDiners,
    breakdown,
  }
}


/**
 * 7. BONIFICACIÓN GOOGLE MAPS BOOSTER (+50 PUNTOS DE UN SOLO USO)
 */
export async function claimGoogleReviewBonus(
  slug: string,
  email: string
): Promise<{ success: boolean; bonus_points: number; new_total_points: number }> {
  const profile = await getLoyaltyProfile(slug, email)
  if (!profile) {
    throw new Error('Perfil de comensal no encontrado.')
  }

  if (profile.google_review_bonus_awarded) {
    throw new Error('El bonus de +50 puntos por reseña de Google Maps ya fue otorgado a este cliente anteriormente.')
  }

  const bonusPoints = 50
  const newTotal = profile.total_points + bonusPoints

  // Actualizar en memoria global
  const memKey = getMemoryKey(slug, email)
  const storeProfile = globalStore.__GASTRO_LOYALTY_PROFILES__?.[memKey]
  if (storeProfile) {
    storeProfile.total_points = newTotal
    storeProfile.google_review_bonus_awarded = true
    storeProfile.updated_at = new Date().toISOString()
  } else if (globalStore.__GASTRO_LOYALTY_PROFILES__) {
    globalStore.__GASTRO_LOYALTY_PROFILES__[memKey] = {
      ...profile,
      total_points: newTotal,
      google_review_bonus_awarded: true,
      updated_at: new Date().toISOString(),
    }
  }

  const supabase = createServerClient()
  if (supabase && isSupabaseConfigured()) {
    try {
      await supabase
        .from('loyalty_profiles')
        .update({
          total_points: newTotal,
          google_review_bonus_awarded: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id)
    } catch (e) {
      console.warn('[claimGoogleReviewBonus] Guardado en memoria:', e)
    }
  }

  return {
    success: true,
    bonus_points: bonusPoints,
    new_total_points: newTotal,
  }
}

/**
 * 8. PANEL DE ADMINISTRACIÓN: LISTAR TODOS LOS CLIENTES FIDELIZADOS
 */
export async function getAllLoyaltyProfiles(
  slug: string,
  query?: string
): Promise<LoyaltyProfile[]> {
  const normQuery = (query || '').trim().toLowerCase()
  let profiles: LoyaltyProfile[] = []

  const supabase = createServerClient()
  if (supabase && isSupabaseConfigured()) {
    try {
      let q = supabase
        .from('loyalty_profiles')
        .select('*')
        .eq('restaurant_slug', slug)
        .order('total_points', { ascending: false })

      if (normQuery) {
        q = q.or(`name.ilike.%${normQuery}%,email.ilike.%${normQuery}%`)
      }

      const { data, error } = await q
      if (!error && Array.isArray(data)) {
        profiles = data as LoyaltyProfile[]
      }
    } catch (e) {
      console.warn('[getAllLoyaltyProfiles] Fallback a memoria:', e)
    }
  }

  // Si no se obtuvieron de Supabase o estamos en fallback / tests
  if (profiles.length === 0 && globalStore.__GASTRO_LOYALTY_PROFILES__) {
    const all = Object.values(globalStore.__GASTRO_LOYALTY_PROFILES__).filter(
      p => p.restaurant_slug === slug
    )
    profiles = all
  }

  // Filtrar si hay query y estamos usando memoria
  if (normQuery) {
    profiles = profiles.filter(
      p =>
        (p.name && p.name.toLowerCase().includes(normQuery)) ||
        (p.email && p.email.toLowerCase().includes(normQuery))
    )
  }

  // Calcular saldo disponible descontando holds activos
  const computed = profiles.map(p => {
    const held = computeHeldPointsForProfile(p.id, slug)
    return {
      ...p,
      held_points: held,
      available_points: Math.max(0, p.total_points - held),
    }
  })

  // Ordenar por puntos totales descendente
  return computed.sort((a, b) => b.total_points - a.total_points)
}

