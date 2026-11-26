import fs from 'node:fs'
import path from 'node:path'
import { createServerClient } from '../server'
import { isSupabaseConfigured } from '../client'
import { CRMLead, CRMMetrics, CRMPlan, CRMStatus, CARTA_QR_PRICE_EUR, PLAN_PRICING, normalizeLeadCity } from '@/types/crm.types'
import { NOIA_INITIAL_LEADS } from '@/lib/crm/noia-seed-data'
import crmLeadsSnapshot from '@/lib/crm/crm-leads-snapshot.json'
import { normalizeSlug } from '@/lib/slugify'
import crypto from 'crypto'

export { PLAN_PRICING }

const OPTIONAL_REVIEW_STAND_COLUMNS = [
  'logo_url',
  'enable_review_gatekeeper',
  'review_stand_mode',
  'review_stand_fee_eur',
] as const

function stripOptionalReviewColumns<T extends Record<string, unknown>>(payload: T): Partial<T> {
  const copy: Record<string, unknown> = { ...payload }
  for (const col of OPTIONAL_REVIEW_STAND_COLUMNS) {
    delete copy[col]
  }
  return copy as Partial<T>
}

function isMissingColumnError(error: { message?: string; code?: string } | null | undefined): boolean {
  if (!error) return false
  const msg = (error.message || '').toLowerCase()
  return (
    error.code === '42703' ||
    error.code === 'PGRST204' ||
    msg.includes('column') ||
    msg.includes('schema cache')
  )
}

function mergeLocalOptionalFields(remoteLead: CRMLead, localLead?: CRMLead): CRMLead {
  if (!localLead) return remoteLead
  const merged: CRMLead = { ...remoteLead }
  if (merged.custom_slug === undefined && localLead.custom_slug !== undefined) {
    merged.custom_slug = localLead.custom_slug
  }
  for (const col of OPTIONAL_REVIEW_STAND_COLUMNS) {
    if ((merged as any)[col] === undefined && (localLead as any)[col] !== undefined) {
      ;(merged as any)[col] = (localLead as any)[col]
    }
  }
  return merged
}

const DATA_DIR = path.join(process.cwd(), '.fluxo-data')
const BACKUP_FILE = path.join(DATA_DIR, 'crm_leads.json')
let lastDiskMtimeMs = 0

function normalizeLeadRecord(item: CRMLead): CRMLead {
  const city = item.city || normalizeLeadCity(item)
  return {
    ...item,
    city,
    online_menu_status: item.online_menu_status ?? 'unknown',
  }
}

function loadInitialLeads(): CRMLead[] {
  try {
    if (fs.existsSync(BACKUP_FILE)) {
      const stat = fs.statSync(BACKUP_FILE)
      lastDiskMtimeMs = stat.mtimeMs
      const raw = fs.readFileSync(BACKUP_FILE, 'utf8')
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(normalizeLeadRecord)
      }
    }
  } catch (e) {
    console.warn('[CRM Repository] Error leyendo persistencia en disco:', e)
  }

  if (Array.isArray(crmLeadsSnapshot) && crmLeadsSnapshot.length > 0) {
    return (crmLeadsSnapshot as CRMLead[]).map(normalizeLeadRecord)
  }

  return NOIA_INITIAL_LEADS.map((item, index) => {
    const now = new Date(Date.now() - (index * 3600000)).toISOString()
    return normalizeLeadRecord({
      ...item,
      id: `crm-lead-${index + 1}`.padEnd(36, '-0000-000000000000'),
      city: 'Noia',
      attachments: [],
      created_at: now,
      updated_at: now,
    })
  })
}

function syncFromDiskIfNewer() {
  try {
    if (fs.existsSync(BACKUP_FILE)) {
      const stat = fs.statSync(BACKUP_FILE)
      if (stat.mtimeMs > lastDiskMtimeMs) {
        const raw = fs.readFileSync(BACKUP_FILE, 'utf8')
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed) && parsed.length > 0) {
          inMemoryLeads = parsed.map(normalizeLeadRecord)
          lastDiskMtimeMs = stat.mtimeMs
        }
      }
    }
  } catch (e) {
    console.warn('[CRM Repository] Error refrescando desde disco:', e)
  }
}

// Almacén en memoria de respaldo con persistencia en disco local
let inMemoryLeads: CRMLead[] = loadInitialLeads()

function persistLeadsLocally(leads: CRMLead[]) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true })
    }
    const tmpFile = `${BACKUP_FILE}.${process.pid}.${Date.now()}.tmp`
    fs.writeFileSync(tmpFile, JSON.stringify(leads, null, 2), 'utf8')
    fs.renameSync(tmpFile, BACKUP_FILE)
    lastDiskMtimeMs = fs.statSync(BACKUP_FILE).mtimeMs
  } catch (e) {
    console.warn('[CRM Repository] No se pudo guardar copia local en disco:', e)
  }
}

// Asegurar que exista el archivo inicial sin sobreescribir concurrentemente durante builds
if (!fs.existsSync(BACKUP_FILE)) {
  persistLeadsLocally(inMemoryLeads)
}

/**
 * Calcula las métricas ejecutivas en base al conjunto de leads
 */
export function calculateCRMMetrics(leads: CRMLead[]): CRMMetrics {
  const pipelineCounts: Record<CRMStatus, number> = {
    lead_por_visitar: 0,
    contactado: 0,
    piloto_14_dias: 0,
    en_negociacion: 0,
    ganado: 0,
    perdido: 0,
  }

  let wonCount = 0
  let wonMRR = 0
  let activePilotsCount = 0
  let pipelineMRR = 0

  leads.forEach((lead) => {
    if (pipelineCounts[lead.status] !== undefined) {
      pipelineCounts[lead.status] += 1
    }

    if (lead.status === 'ganado') {
      wonCount += 1
      wonMRR += Number(lead.mrr_projected || PLAN_PRICING[lead.target_plan] || CARTA_QR_PRICE_EUR)
    } else if (lead.status === 'piloto_14_dias') {
      activePilotsCount += 1
      pipelineMRR += Number(lead.mrr_projected || PLAN_PRICING[lead.target_plan] || CARTA_QR_PRICE_EUR)
    } else if (lead.status === 'contactado' || lead.status === 'en_negociacion') {
      pipelineMRR += Number(lead.mrr_projected || PLAN_PRICING[lead.target_plan] || CARTA_QR_PRICE_EUR)
    }
  })

  const totalLeads = leads.length
  const conversionRate = totalLeads > 0 ? Number(((wonCount / totalLeads) * 100).toFixed(1)) : 0

  return {
    totalLeads,
    wonCount,
    wonMRR,
    activePilotsCount,
    pipelineMRR,
    conversionRate,
    pipelineCounts,
  }
}

/**
 * Obtiene todos los leads del CRM con respaldo local
 */
export async function getCRMLeads(): Promise<CRMLead[]> {
  syncFromDiskIfNewer()
  const supabase = createServerClient()
  if (supabase && isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('crm_leads')
        .select('*')
        .order('score', { ascending: false })

      if (!error && data && data.length > 0) {
        const localById = new Map(inMemoryLeads.map((l) => [l.id, l]))
        inMemoryLeads = (data as CRMLead[]).map((item) =>
          normalizeLeadRecord(mergeLocalOptionalFields(item, localById.get(item.id)))
        )
        persistLeadsLocally(inMemoryLeads)
        return inMemoryLeads
      }

      if (!error && data && data.length === 0) {
        const seeded = await seedInitialNoiaLeads()
        if (seeded && seeded.length > 0) return seeded
      }
    } catch (e) {
      console.warn('[CRM Repository] Error al consultar Supabase, utilizando respaldo en memoria:', e)
    }
  }

  return inMemoryLeads
}

/**
 * Siembra inicial de los 35 locales investigados de Noia en Supabase
 */
export async function seedInitialNoiaLeads(): Promise<CRMLead[]> {
  const supabase = createServerClient()
  if (supabase && isSupabaseConfigured()) {
    try {
      const toInsert = NOIA_INITIAL_LEADS.map((item) => ({
        ...item,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }))

      const { data, error } = await supabase
        .from('crm_leads')
        .insert(toInsert)
        .select('*')

      if (!error && data && data.length > 0) {
        inMemoryLeads = data as CRMLead[]
        persistLeadsLocally(inMemoryLeads)
        return inMemoryLeads
      }
    } catch (e) {
      console.warn('[CRM Repository] Error en seed de Supabase:', e)
    }
  }

  persistLeadsLocally(inMemoryLeads)
  return inMemoryLeads
}

/**
 * Crea un nuevo lead en el CRM
 */
export async function createCRMLead(
  leadData: Omit<CRMLead, 'id' | 'created_at' | 'updated_at'>
): Promise<CRMLead> {
  const now = new Date().toISOString()
  const mrr = leadData.mrr_projected || PLAN_PRICING[leadData.target_plan] || CARTA_QR_PRICE_EUR

  const newLead: CRMLead = normalizeLeadRecord({
    ...leadData,
    id: crypto.randomUUID ? crypto.randomUUID() : `crm-lead-${Date.now()}`,
    mrr_projected: mrr,
    attachments: leadData.attachments || [],
    created_at: now,
    updated_at: now,
  })

  const insertPayload = {
    name: newLead.name,
    address: newLead.address,
    city: newLead.city,
    zone: newLead.zone,
    icp_segment: newLead.icp_segment,
    contact_name: newLead.contact_name,
    contact_phone: newLead.contact_phone,
    contact_whatsapp: newLead.contact_whatsapp,
    instagram: newLead.instagram,
    instagram_url: newLead.instagram_url,
    facebook_url: newLead.facebook_url,
    google_place_id: newLead.google_place_id,
    google_profile_url: newLead.google_profile_url,
    google_review_url: newLead.google_review_url,
    website_url: newLead.website_url,
    online_menu_status: newLead.online_menu_status,
    online_menu_url: newLead.online_menu_url,
    saturday_hours: newLead.saturday_hours,
    saturday_closed: newLead.saturday_closed,
    lead_score: newLead.lead_score,
    recommended_pitch: newLead.recommended_pitch,
    primary_type: newLead.primary_type,
    route_block: newLead.route_block,
    route_order: newLead.route_order,
    lat: newLead.lat,
    lng: newLead.lng,
    google_rating: newLead.google_rating,
    google_reviews_count: newLead.google_reviews_count,
    score: newLead.score,
    status: newLead.status,
    target_plan: newLead.target_plan,
    mrr_projected: newLead.mrr_projected,
    pilot_start_date: newLead.pilot_start_date,
    pilot_end_date: newLead.pilot_end_date,
    last_visit_date: newLead.last_visit_date,
    next_contact_date: newLead.next_contact_date,
    notes: newLead.notes,
    lost_reason: newLead.lost_reason,
    current_pos_system: newLead.current_pos_system,
    beverage_distributor: newLead.beverage_distributor,
    decision_makers: newLead.decision_makers,
    google_complaint_tags: newLead.google_complaint_tags,
    pilot_checklist: newLead.pilot_checklist,
    pilot_agreement: newLead.pilot_agreement,
    attachments: newLead.attachments,
    custom_slug: newLead.custom_slug ?? null,
    logo_url: newLead.logo_url ?? null,
    enable_review_gatekeeper: newLead.enable_review_gatekeeper ?? false,
    review_stand_mode: newLead.review_stand_mode ?? null,
    review_stand_fee_eur: newLead.review_stand_fee_eur ?? null,
    created_at: newLead.created_at,
    updated_at: newLead.updated_at,
  }

  const supabase = createServerClient()
  if (supabase && isSupabaseConfigured()) {
    try {
      let { data, error } = await supabase
        .from('crm_leads')
        .insert(insertPayload)
        .select('*')
        .single()

      if (error && isMissingColumnError(error)) {
        const retry = await supabase
          .from('crm_leads')
          .insert(stripOptionalReviewColumns(insertPayload))
          .select('*')
          .single()
        data = retry.data
        error = retry.error
      }

      if (!error && data) {
        const persisted = normalizeLeadRecord(mergeLocalOptionalFields(data as CRMLead, newLead))
        inMemoryLeads.unshift(persisted)
        persistLeadsLocally(inMemoryLeads)
        return persisted
      }
    } catch (e) {
      console.warn('[CRM Repository] Error al guardar en Supabase, guardando localmente:', e)
    }
  }

  inMemoryLeads.unshift(newLead)
  persistLeadsLocally(inMemoryLeads)
  return newLead
}

/**
 * Actualiza un lead existente
 */
export async function updateCRMLead(
  id: string,
  updates: Partial<CRMLead>
): Promise<CRMLead | null> {
  syncFromDiskIfNewer()
  const now = new Date().toISOString()
  const normalizedUpdates: Partial<CRMLead> = { ...updates }

  if (normalizedUpdates.target_plan && normalizedUpdates.mrr_projected === undefined) {
    normalizedUpdates.mrr_projected = PLAN_PRICING[normalizedUpdates.target_plan]
  }

  if (normalizedUpdates.status === 'piloto_14_dias' && !normalizedUpdates.pilot_start_date) {
    const start = new Date()
    const end = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
    normalizedUpdates.pilot_start_date = start.toISOString().split('T')[0]
    normalizedUpdates.pilot_end_date = end.toISOString().split('T')[0]
  }

  const existingLocal = inMemoryLeads.find((item) => item.id === id)
  let remoteResult: CRMLead | null = null

  const supabase = createServerClient()
  if (supabase && isSupabaseConfigured()) {
    try {
      const fullPayload = {
        ...normalizedUpdates,
        updated_at: now,
      }
      let { data, error } = await supabase
        .from('crm_leads')
        .update(fullPayload)
        .eq('id', id)
        .select('*')
        .single()

      if (error && isMissingColumnError(error)) {
        const reducedPayload = stripOptionalReviewColumns(fullPayload)
        const retry = await supabase
          .from('crm_leads')
          .update(reducedPayload)
          .eq('id', id)
          .select('*')
          .single()
        data = retry.data
        error = retry.error
      }

      if (!error && data) {
        remoteResult = data as CRMLead
      }
    } catch (e) {
      console.warn('[CRM Repository] Error al actualizar en Supabase, aplicando localmente:', e)
    }
  }

  let updatedLead: CRMLead | null = null
  const mergedBase: Partial<CRMLead> = remoteResult
    ? mergeLocalOptionalFields(remoteResult, {
        ...(existingLocal || remoteResult),
        ...normalizedUpdates,
      })
    : normalizedUpdates

  inMemoryLeads = inMemoryLeads.map((item) => {
    if (item.id === id) {
      updatedLead = normalizeLeadRecord({
        ...item,
        ...mergedBase,
        ...normalizedUpdates,
        updated_at: now,
      })
      return updatedLead
    }
    return item
  })

  if (!updatedLead && remoteResult) {
    updatedLead = normalizeLeadRecord({
      ...remoteResult,
      ...normalizedUpdates,
      updated_at: now,
    })
    inMemoryLeads.unshift(updatedLead)
  }

  persistLeadsLocally(inMemoryLeads)
  return updatedLead
}

/**
 * Busca un lead del CRM por custom_slug, id o nombre normalizado
 */
export async function getCRMLeadBySlug(slug: string): Promise<CRMLead | null> {
  const raw = (slug || '').trim()
  const normalized = normalizeSlug(raw)
  if (!raw && !normalized) return null

  const leads = await getCRMLeads()

  const byCustomSlug = leads.find(
    (lead) => lead.custom_slug && normalizeSlug(lead.custom_slug) === normalized
  )
  if (byCustomSlug) return byCustomSlug

  const byId = leads.find((lead) => lead.id === raw)
  if (byId) return byId

  const byName = leads.find((lead) => normalizeSlug(lead.name) === normalized)
  return byName || null
}

/**
 * Elimina un lead
 */
export async function deleteCRMLead(id: string): Promise<boolean> {
  const supabase = createServerClient()
  if (supabase && isSupabaseConfigured()) {
    try {
      const { error } = await supabase.from('crm_leads').delete().eq('id', id)
      if (!error) {
        inMemoryLeads = inMemoryLeads.filter((item) => item.id !== id)
        persistLeadsLocally(inMemoryLeads)
        return true
      }
    } catch (e) {
      console.warn('[CRM Repository] Error al eliminar en Supabase:', e)
    }
  }

  inMemoryLeads = inMemoryLeads.filter((item) => item.id !== id)
  persistLeadsLocally(inMemoryLeads)
  return true
}
