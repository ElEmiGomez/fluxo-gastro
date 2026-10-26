export type CRMStatus =
  | 'lead_por_visitar'
  | 'contactado'
  | 'piloto_14_dias'
  | 'en_negociacion'
  | 'ganado'
  | 'perdido'

export type CRMPlan = 'carta_39' | 'sala_69' | 'full_99' | 'suite_139'

export type CRMICP = 'CARLOS' | 'MARTIN' | 'LUCIA'

export const PLAN_PRICING: Record<CRMPlan, number> = {
  carta_39: 39,
  sala_69: 69,
  full_99: 99,
  suite_139: 139,
}

export interface PilotChecklist {
  qr_placed: boolean          // 1. Pegatinas QR colocadas en mesas y barra
  menu_uploaded: boolean      // 2. Carta inicial y precios verificados
  staff_trained: boolean      // 3. Explicación rápida al personal de sala (3 min)
  review_date_set: boolean    // 4. Fecha de balance de cierre agendada
}

export interface PilotAgreement {
  signed_at: string           // Timestamp ISO de firma
  signee_name: string         // Nombre del titular o responsable que firma
  signee_phone?: string       // Teléfono de contacto
  signature_data?: string     // Trazo o imagen base64 de la firma táctil
  agreed_plan: CRMPlan        // Plan que evalúa
  trial_duration_days: number // 14 días
}

export interface CRMLead {
  id: string
  name: string
  address: string
  zone: string
  icp_segment: CRMICP
  contact_name: string | null
  contact_phone: string | null
  contact_whatsapp: string | null
  instagram: string | null
  google_rating: number | null
  google_reviews_count: number | null
  score: number
  status: CRMStatus
  target_plan: CRMPlan
  mrr_projected: number
  pilot_start_date: string | null
  pilot_end_date: string | null
  last_visit_date: string | null
  next_contact_date: string | null
  notes: string | null
  lost_reason: string | null
  lat?: number | null
  lng?: number | null
  pilot_checklist?: PilotChecklist | null
  pilot_agreement?: PilotAgreement | null
  created_at: string
  updated_at: string
}

export interface CRMMetrics {
  totalLeads: number
  wonCount: number
  wonMRR: number
  activePilotsCount: number
  pipelineMRR: number
  conversionRate: number
  pipelineCounts: Record<CRMStatus, number>
}

export interface CRMFilterOptions {
  searchQuery: string
  statusFilter: CRMStatus | 'all'
  zoneFilter: string | 'all'
  planFilter: CRMPlan | 'all'
  icpFilter: CRMICP | 'all'
}
