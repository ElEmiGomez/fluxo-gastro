import { createServerClient } from '../server'
import { isSupabaseConfigured } from '../client'
import { CRMLead, CRMMetrics, CRMPlan, CRMStatus, PLAN_PRICING } from '@/types/crm.types'
import { NOIA_INITIAL_LEADS } from '@/lib/crm/noia-seed-data'
import crypto from 'crypto'

export { PLAN_PRICING }

// Almacén en memoria de respaldo para funcionamiento 100% resiliente en calle (sin caídas de red)
let inMemoryLeads: CRMLead[] = NOIA_INITIAL_LEADS.map((item, index) => {
  const now = new Date(Date.now() - (index * 3600000)).toISOString()
  return {
    ...item,
    id: `crm-lead-${index + 1}`.padEnd(36, '-0000-000000000000'),
    created_at: now,
    updated_at: now,
  }
})

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
      wonMRR += Number(lead.mrr_projected || PLAN_PRICING[lead.target_plan] || 39)
    } else if (lead.status === 'piloto_14_dias') {
      activePilotsCount += 1
      pipelineMRR += Number(lead.mrr_projected || PLAN_PRICING[lead.target_plan] || 39)
    } else if (lead.status === 'contactado' || lead.status === 'en_negociacion') {
      pipelineMRR += Number(lead.mrr_projected || PLAN_PRICING[lead.target_plan] || 39)
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
  const supabase = createServerClient()
  if (supabase && isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('crm_leads')
        .select('*')
        .order('score', { ascending: false })

      if (!error && data && data.length > 0) {
        // Sincronizar en memoria y retornar datos de Supabase SSOT
        inMemoryLeads = data as CRMLead[]
        return inMemoryLeads
      }

      // Si la tabla existe pero está vacía, auto-sembrar los 35 de Noia
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
        return inMemoryLeads
      }
    } catch (e) {
      console.warn('[CRM Repository] Error en seed de Supabase:', e)
    }
  }

  return inMemoryLeads
}

/**
 * Crea un nuevo lead en el CRM
 */
export async function createCRMLead(
  leadData: Omit<CRMLead, 'id' | 'created_at' | 'updated_at'>
): Promise<CRMLead> {
  const now = new Date().toISOString()
  const mrr = leadData.mrr_projected || PLAN_PRICING[leadData.target_plan] || 39

  const newLead: CRMLead = {
    ...leadData,
    id: crypto.randomUUID ? crypto.randomUUID() : `crm-lead-${Date.now()}`,
    mrr_projected: mrr,
    created_at: now,
    updated_at: now,
  }

  const supabase = createServerClient()
  if (supabase && isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('crm_leads')
        .insert({
          name: newLead.name,
          address: newLead.address,
          zone: newLead.zone,
          icp_segment: newLead.icp_segment,
          contact_name: newLead.contact_name,
          contact_phone: newLead.contact_phone,
          contact_whatsapp: newLead.contact_whatsapp,
          instagram: newLead.instagram,
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
          created_at: newLead.created_at,
          updated_at: newLead.updated_at,
        })
        .select('*')
        .single()

      if (!error && data) {
        inMemoryLeads.unshift(data as CRMLead)
        return data as CRMLead
      }
    } catch (e) {
      console.warn('[CRM Repository] Error al guardar en Supabase, guardando en memoria:', e)
    }
  }

  inMemoryLeads.unshift(newLead)
  return newLead
}

/**
 * Actualiza un lead existente
 */
export async function updateCRMLead(
  id: string,
  updates: Partial<CRMLead>
): Promise<CRMLead | null> {
  const now = new Date().toISOString()

  // Si se cambia el plan y no se especifica mrr, sincronizar precio canónico
  if (updates.target_plan && updates.mrr_projected === undefined) {
    updates.mrr_projected = PLAN_PRICING[updates.target_plan]
  }

  // Si pasa a piloto_14_dias y no tenía fechas, establecer ventana de 14 días
  if (updates.status === 'piloto_14_dias' && !updates.pilot_start_date) {
    const start = new Date()
    const end = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
    updates.pilot_start_date = start.toISOString().split('T')[0]
    updates.pilot_end_date = end.toISOString().split('T')[0]
  }

  const supabase = createServerClient()
  if (supabase && isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('crm_leads')
        .update({
          ...updates,
          updated_at: now,
        })
        .eq('id', id)
        .select('*')
        .single()

      if (!error && data) {
        inMemoryLeads = inMemoryLeads.map((item) => (item.id === id ? (data as CRMLead) : item))
        return data as CRMLead
      }
    } catch (e) {
      console.warn('[CRM Repository] Error al actualizar en Supabase, aplicando en memoria:', e)
    }
  }

  let updatedLead: CRMLead | null = null
  inMemoryLeads = inMemoryLeads.map((item) => {
    if (item.id === id) {
      updatedLead = {
        ...item,
        ...updates,
        updated_at: now,
      }
      return updatedLead
    }
    return item
  })

  return updatedLead
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
        return true
      }
    } catch (e) {
      console.warn('[CRM Repository] Error al eliminar en Supabase:', e)
    }
  }

  inMemoryLeads = inMemoryLeads.filter((item) => item.id !== id)
  return true
}
