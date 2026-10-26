export type CRMStatus =
  | 'lead_por_visitar'
  | 'contactado'
  | 'piloto_14_dias'
  | 'en_negociacion'
  | 'ganado'
  | 'perdido'

export type CRMPlan = 'carta_39' | 'sala_69' | 'full_99' | 'suite_139'

export type CRMICP = 'CARLOS' | 'MARTIN' | 'LUCIA'

export type CRMPosSystem =
  | 'papel_libreta'             // Libreta de papel / comanda manual
  | 'tpv_tradicional'           // TPV tradicional (Ágora, ICG, Hosteltáctil, BDP)
  | 'caja_registradora'        // Caja registradora simple
  | 'qr_pdf_estatico'           // QR que abre un PDF estático
  | 'carta_fisica_plastificada' // Solo carta física en mesa
  | 'otro'                      // Otro sistema

export const POS_SYSTEM_CONFIG: Record<
  CRMPosSystem,
  { label: string; icon: string; pitchHint: string }
> = {
  papel_libreta: {
    label: 'Libreta de papel',
    icon: '📝',
    pitchHint: 'Ahorra hasta 8 paseos por mesa en terraza y elimina comandas ilegibles en cocina.',
  },
  tpv_tradicional: {
    label: 'TPV tradicional (Ágora / ICG)',
    icon: '🖥️',
    pitchHint: 'Complementa su TPV con carta digital y aviso al camarero sin cambiar su software contable.',
  },
  caja_registradora: {
    label: 'Caja registradora simple',
    icon: '📠',
    pitchHint: 'Digitaliza el local sin comprar hardware costoso ni pagar licencias abusivas.',
  },
  qr_pdf_estatico: {
    label: 'QR con PDF estático',
    icon: '📄',
    pitchHint: 'Un PDF tarda en cargar, cuesta leerlo en móvil y no permite alérgenos ni fotos dinámicas.',
  },
  carta_fisica_plastificada: {
    label: 'Carta física plastificada',
    icon: '📋',
    pitchHint: 'Elimina los costes de reimprimir cartas cada vez que cambian precios o productos de temporada.',
  },
  otro: {
    label: 'Otro sistema',
    icon: '⚙️',
    pitchHint: 'Carta interactiva de carga ultrarrápida y motor de reseñas en Google Maps.',
  },
}

export interface DecisionMaker {
  role: string        // ej: 'Dueño / Gerente', 'Jefe de Cocina', 'Socio / Hermano', 'Gestor'
  name: string
  schedule?: string   // ej: 'Mañanas de 11:00 a 13:00', 'Tardes a partir de las 17:30'
  is_primary: boolean
}

export type BeverageDistributor =
  | 'estrella_galicia'
  | 'mahou'
  | 'heineken'
  | 'coca_cola'
  | 'sin_patrocinio'
  | 'otro'

export const DISTRIBUTOR_CONFIG: Record<
  BeverageDistributor,
  { label: string; icon: string; counterPitch: string }
> = {
  estrella_galicia: {
    label: 'Hijos de Rivera (Estrella Galicia)',
    icon: '🍺',
    counterPitch: 'La cervecera imprime cartas estáticas 1 vez al año con su logo. Con Fluxo actualizas precios cuando quieras y mantienes tu identidad propia.',
  },
  mahou: {
    label: 'Mahou San Miguel',
    icon: '🍻',
    counterPitch: 'Una carta patrocinada no permite fotos atractivas de marisco ni alérgenos dinámicos. Fluxo es tuyo y proyecta calidad gastronómica.',
  },
  heineken: {
    label: 'Heineken / Cruzcampo',
    icon: '🍾',
    counterPitch: 'Evita depender de los plazos de la distribuidora para modificar tus platos de temporada o sugerencias del día.',
  },
  coca_cola: {
    label: 'Coca-Cola / Refrescos',
    icon: '🥤',
    counterPitch: 'Las cartas patrocinadas limitan el espacio para tus raciones estrella. Con Fluxo el protagonismo es 100% de tu cocina.',
  },
  sin_patrocinio: {
    label: 'Sin patrocinio (Independiente)',
    icon: '⭐',
    counterPitch: 'Perfil óptimo: Valoran su autonomía e imagen propia, encajan directamente con la propuesta de valor de Fluxo.',
  },
  otro: {
    label: 'Otra distribuidora o bodega',
    icon: '🍷',
    counterPitch: 'Control total de tus márgenes y precios sin ataduras comerciales ni publicidad impuesta.',
  },
}

export interface NoiaEvent {
  id: string
  name: string
  period: string
  approxMonth: number
  description: string
  commercialAdvice: string
}

export const NOIA_COMMERCIAL_EVENTS: NoiaEvent[] = [
  {
    id: 'festa_berberecho',
    name: 'Campaña Gastronómica del Berberecho y Marisco',
    period: 'Octubre - Noviembre (Campaña Activa)',
    approxMonth: 10,
    description: 'Apertura de la campaña de marisqueo en la Ría de Noia. Máxima afluencia en taperías.',
    commercialAdvice: 'Momento de oro: Los locales cambian precios de marisco según lonja. La carta digital les permite actualizar el precio del día en 5 segundos.',
  },
  {
    id: 'san_marcos',
    name: 'Festas de San Marcos',
    period: 'Finales de Abril',
    approxMonth: 4,
    description: 'Feria tradicional y masiva afluencia en terrazas de Noia.',
    commercialAdvice: 'Activar pruebas 2 semanas antes para evitar colapsos de comanda en terraza.',
  },
  {
    id: 'feira_medieval',
    name: 'Feira Medieval de Noia',
    period: 'Mediados de Julio',
    approxMonth: 7,
    description: 'El evento de mayor saturación hostelera del año en el casco histórico.',
    commercialAdvice: 'Cierre prioritario en Rúa do Cantón y Alameda para agilizar comandas y rotación.',
  },
  {
    id: 'verano_turismo',
    name: 'Campaña Estival / Ría de Muros-Noia',
    period: 'Julio - Agosto',
    approxMonth: 8,
    description: 'Pico de turismo náutico, veraneantes y visitantes de la ría.',
    commercialAdvice: 'Carta multilingüe obligatoria para captar turismo nacional y extranjero sin barreras.',
  },
]

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
  current_pos_system?: CRMPosSystem | null
  beverage_distributor?: BeverageDistributor | null
  decision_makers?: DecisionMaker[] | null
  google_complaint_tags?: string[] | null
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
