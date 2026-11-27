'use client'

import React, { useEffect, useRef, useState } from 'react'
import {
  X,
  Store,
  MapPin,
  User,
  Phone,
  MessageCircle,
  ExternalLink,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  AlertTriangle,
  Trash2,
  DollarSign,
  TrendingUp,
  Tag,
  CheckSquare,
  FileCheck2,
  ChevronRight,
  ChevronDown,
  ShieldCheck,
  Camera,
  Cpu,
  Flame,
  Lightbulb,
  Plus,
  Users,
  Sliders,
  QrCode,
  FileText,
  Image as ImageIcon,
  Paperclip,
  Upload,
  FileUp,
  Eye,
  Download,
  UtensilsCrossed,
  Edit3,
  Globe,
  Star,
  Copy,
  Check,
  Building2,
  Printer,
  ImageOff,
  Wrench
} from 'lucide-react'
import {
  CRMICP,
  CRMLead,
  CRMPlan,
  CRMPosSystem,
  CRMStatus,
  PilotAgreement,
  PilotChecklist,
  PLAN_PRICING,
  CARTA_QR_PRICE_EUR,
  REVIEW_STAND_PRICE_EUR,
  ReviewStandMode,
  POS_SYSTEM_CONFIG,
  DecisionMaker,
  BeverageDistributor,
  DISTRIBUTOR_CONFIG,
  normalizeICP,
  normalizeLeadCity,
  ICP_CONFIG,
  ONLINE_MENU_STATUS_CONFIG,
  RECOMMENDED_PITCH_CONFIG,
  LocalAttachment
} from '@/types/crm.types'
import { normalizeSlug } from '@/lib/slugify'
import { CRMPilotAgreementModal } from './CRMPilotAgreementModal'
import { CRMBeforeAfterModal } from './CRMBeforeAfterModal'
import { CRMDossierModal } from './CRMDossierModal'
import { CRMContactCardModal } from './CRMContactCardModal'
import { CRMMenuScannerModal } from './CRMMenuScannerModal'

interface CRMLeadDetailModalProps {
  lead: CRMLead | null
  isOpen: boolean
  onClose: () => void
  onUpdate: (id: string, updates: Partial<CRMLead>) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

const STATUS_CONFIG: Record<
  CRMStatus,
  { label: string; bg: string; text: string; border: string }
> = {
  lead_por_visitar: {
    label: 'Por Visitar',
    bg: 'bg-slate-800',
    text: 'text-slate-300',
    border: 'border-slate-700',
  },
  contactado: {
    label: 'Contactado',
    bg: 'bg-blue-950/60',
    text: 'text-blue-400',
    border: 'border-blue-700/60',
  },
  piloto_14_dias: {
    label: 'Piloto (14 Días)',
    bg: 'bg-amber-950/60',
    text: 'text-amber-400',
    border: 'border-amber-700/60',
  },
  en_negociacion: {
    label: 'En Negociación',
    bg: 'bg-purple-950/60',
    text: 'text-purple-400',
    border: 'border-purple-700/60',
  },
  ganado: {
    label: 'Ganado (Cliente)',
    bg: 'bg-emerald-950/60',
    text: 'text-emerald-400',
    border: 'border-emerald-700/60',
  },
  perdido: {
    label: 'Perdido',
    bg: 'bg-rose-950/60',
    text: 'text-rose-400',
    border: 'border-rose-700/60',
  },
}

const QUICK_PAIN_TAGS = [
  'Interesa Carta QR (15€)',
  'Interesa Expositor Reseñas (20€)',
  'No estaba el dueño · Volver',
  'Pasar en horario de tarde',
  'Carta en papel desactualizada',
  'QR actual abre PDF incómodo',
  'Retraso en terraza / horas pico',
  'Le interesa Comandero',
]

type SectionKey = 'before_enter' | 'visit_followup' | 'pitch' | 'commercial' | 'files' | 'pilot'

interface CollapsibleBlockProps {
  title: string
  icon: React.ReactNode
  summary: React.ReactNode
  isOpen: boolean
  onToggle: () => void
  borderClass?: string
  testId?: string
  children: React.ReactNode
}

function CollapsibleBlock({
  title,
  icon,
  summary,
  isOpen,
  onToggle,
  borderClass = 'border-slate-800',
  testId,
  children,
}: CollapsibleBlockProps) {
  return (
    <section
      data-testid={testId}
      className={`rounded-2xl bg-slate-950/70 border ${borderClass} overflow-hidden`}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="w-full px-4 py-3 flex items-center justify-between gap-2 text-left hover:bg-slate-900/60 transition touch-manipulation"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="shrink-0">{icon}</span>
          <span className="text-xs font-bold text-white truncate">{title}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0 max-w-[56%]">
          <div className="text-[11px] text-slate-400 truncate flex items-center gap-1.5">
            {summary}
          </div>
          <ChevronDown
            className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-white' : ''
            }`}
          />
        </div>
      </button>
      {isOpen && (
        <div className="px-4 pb-4 pt-2 border-t border-slate-800/80 space-y-3.5">
          {children}
        </div>
      )}
    </section>
  )
}

const DEFAULT_REVIEW_COMPLAINT_SUGGESTIONS = [
  '⏱️ Tardanza en pedir la cuenta en terraza',
  '📜 Carta física deteriorada o sin precios claros',
  '👀 Dificultad para llamar al camarero',
  '❌ Platos agotados no avisados a tiempo',
  '🇬🇧 Falta de carta en inglés para turistas de Ría',
  '📱 QR actual abre un PDF lento e incómodo',
]

export function CRMLeadDetailModal(props: CRMLeadDetailModalProps) {
  if (!props.isOpen || !props.lead) return null
  return <CRMLeadDetailModalContent key={props.lead.id} {...props} lead={props.lead} />
}

function CRMLeadDetailModalContent({
  lead,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
}: Omit<CRMLeadDetailModalProps, 'lead'> & { lead: CRMLead }) {
  const [localName, setLocalName] = useState(lead.name || '')
  const [isEditingName, setIsEditingName] = useState(false)
  const [status, setStatus] = useState<CRMStatus>(lead.status)
  const [targetPlan, setTargetPlan] = useState<CRMPlan>(lead.target_plan)
  const [contactName, setContactName] = useState(lead.contact_name || '')
  const [contactPhone, setContactPhone] = useState(lead.contact_phone || '')
  const [contactWhatsapp, setContactWhatsapp] = useState(lead.contact_whatsapp || lead.contact_phone || '')
  const [notes, setNotes] = useState(lead.notes || '')
  const [lostReason, setLostReason] = useState(lead.lost_reason || '')
  const [currentPosSystem, setCurrentPosSystem] = useState<CRMPosSystem>(
    lead.current_pos_system || 'carta_fisica_plastificada'
  )
  const [complaintTags, setComplaintTags] = useState<string[]>(
    lead.google_complaint_tags || (lead.notes?.toLowerCase().includes('demora') ? ['⏱️ Tardanza en pedir la cuenta en terraza'] : [])
  )
  const [newComplaintInput, setNewComplaintInput] = useState('')
  const [checklist, setChecklist] = useState<PilotChecklist>(
    lead.pilot_checklist || {
      qr_placed: false,
      menu_uploaded: false,
      staff_trained: false,
      review_date_set: false,
    }
  )
  const [agreement, setAgreement] = useState<PilotAgreement | null>(lead.pilot_agreement || null)
  const [isAgreementModalOpen, setIsAgreementModalOpen] = useState(false)
  const [isScannerOpen, setIsScannerOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [copiedReviewLink, setCopiedReviewLink] = useState(false)
  const [decisionMakers, setDecisionMakers] = useState<DecisionMaker[]>(
    lead.decision_makers && lead.decision_makers.length > 0
      ? lead.decision_makers
      : lead.contact_name
      ? [{ role: 'Dueño / Gerente', name: lead.contact_name, schedule: 'Horario habitual', is_primary: true }]
      : []
  )
  const [newMakerName, setNewMakerName] = useState('')
  const [newMakerRole, setNewMakerRole] = useState('Dueño / Gerente')
  const [newMakerSchedule, setNewMakerSchedule] = useState('Mañanas de 11:30 a 13:00')
  const [beverageDistributor, setBeverageDistributor] = useState<BeverageDistributor>(
    lead.beverage_distributor || 'estrella_galicia'
  )
  const [isBeforeAfterOpen, setIsBeforeAfterOpen] = useState(false)
  const [isDossierOpen, setIsDossierOpen] = useState(false)
  const [isContactCardOpen, setIsContactCardOpen] = useState(false)
  const [showStaffPitch, setShowStaffPitch] = useState(false)
  const [attachments, setAttachments] = useState<LocalAttachment[]>(lead.attachments || [])
  const [uploadingAttachment, setUploadingAttachment] = useState(false)
  const [newNoteText, setNewNoteText] = useState('')
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [googleReviewUrl, setGoogleReviewUrl] = useState(lead.google_review_url || '')
  const [customSlug, setCustomSlug] = useState(lead.custom_slug || normalizeSlug(lead.name || ''))
  const [logoUrl, setLogoUrl] = useState(lead.logo_url || '')
  const [reviewStandMode, setReviewStandMode] = useState<ReviewStandMode>(
    lead.review_stand_mode || 'none'
  )
  const [compressingLogo, setCompressingLogo] = useState(false)
  const [openingStand, setOpeningStand] = useState(false)
  const [lastVisitDate, setLastVisitDate] = useState<string | null>(lead.last_visit_date || null)
  const [nextContactDate, setNextContactDate] = useState<string>(
    lead.next_contact_date ? lead.next_contact_date.slice(0, 10) : ''
  )
  const [toolsMenuOpen, setToolsMenuOpen] = useState(false)
  const toolsMenuRef = useRef<HTMLDivElement>(null)
  const [showDecisionMakers, setShowDecisionMakers] = useState<boolean>(
    Boolean(lead.decision_makers && lead.decision_makers.length > 0)
  )
  const [openSections, setOpenSections] = useState<Record<SectionKey, boolean>>({
    before_enter: true,
    visit_followup: true,
    pitch: false,
    commercial: false,
    files: false,
    pilot: lead.status === 'piloto_14_dias',
  })

  useEffect(() => {
    if (!toolsMenuOpen) return
    const handleOutsideClick = (event: MouseEvent) => {
      if (toolsMenuRef.current && !toolsMenuRef.current.contains(event.target as Node)) {
        setToolsMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [toolsMenuOpen])

  const toggleSection = (key: SectionKey) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const handleSelectStatus = (nextStatus: CRMStatus) => {
    setStatus(nextStatus)
    if (nextStatus === 'piloto_14_dias') {
      setOpenSections((prev) => ({ ...prev, pilot: true }))
    }
  }

  const handleMarkVisitedToday = () => {
    setLastVisitDate(new Date().toISOString())
    if (status === 'lead_por_visitar') {
      setStatus('contactado')
    }
  }

  const formatLocalYmd = (d: Date) => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }

  const setQuickFollowUp = (target: number | 'saturday' | 'clear') => {
    if (target === 'clear') {
      setNextContactDate('')
      return
    }
    const base = new Date()
    if (target === 'saturday') {
      const dayOfWeek = base.getDay()
      const delta = dayOfWeek === 6 ? 7 : (6 - dayOfWeek + 7) % 7 || 7
      base.setDate(base.getDate() + delta)
    } else {
      base.setDate(base.getDate() + target)
    }
    setNextContactDate(formatLocalYmd(base))
  }

  const formatShortDate = (isoOrYmd?: string | null) => {
    if (!isoOrYmd) return ''
    const d = new Date(isoOrYmd)
    if (Number.isNaN(d.getTime())) return isoOrYmd.slice(0, 10)
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })
  }

  const handleAddDecisionMaker = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMakerName.trim()) return
    const newMaker: DecisionMaker = {
      name: newMakerName.trim(),
      role: newMakerRole.trim() || 'Responsable',
      schedule: newMakerSchedule.trim() || undefined,
      is_primary: decisionMakers.length === 0,
    }
    setDecisionMakers((prev) => [...prev, newMaker])
    setNewMakerName('')
  }

  const handleRemoveDecisionMaker = (index: number) => {
    setDecisionMakers((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSetPrimaryMaker = (index: number) => {
    setDecisionMakers((prev) =>
      prev.map((m, i) => ({
        ...m,
        is_primary: i === index,
      }))
    )
    const primary = decisionMakers[index]
    if (primary) {
      setContactName(primary.name)
    }
  }

  // Resolución de la URL de la carta prototipo del local
  const getMenuUrl = () => {
    const rawSlug = customSlug || lead.custom_slug || normalizeSlug(localName || lead.name)
    const isCasaMar = rawSlug.includes('casamar') || rawSlug.includes('casa-mar')
    const isJaratusas = rawSlug.includes('jaratusa') || rawSlug.includes('jara-tusa')
    return isJaratusas ? '/p/bar-jaratusas' : isCasaMar ? '/carta-casamar' : `/p/${rawSlug}`
  }

  const effectiveSlug = normalizeSlug(customSlug || localName || lead.name) || lead.id
  const reviewStandFeeEur =
    reviewStandMode === 'standalone_20' ? REVIEW_STAND_PRICE_EUR : 0

  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setCompressingLogo(true)
    const reader = new FileReader()
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string
      if (!dataUrl) {
        setCompressingLogo(false)
        return
      }
      const img = new window.Image()
      img.onload = () => {
        try {
          const maxDim = 320
          const scale = Math.min(1, maxDim / Math.max(img.width || 1, img.height || 1))
          const w = Math.max(1, Math.round((img.width || maxDim) * scale))
          const h = Math.max(1, Math.round((img.height || maxDim) * scale))
          const canvas = document.createElement('canvas')
          canvas.width = w
          canvas.height = h
          const ctx = canvas.getContext('2d')
          if (ctx) {
            ctx.drawImage(img, 0, 0, w, h)
            const keepAlpha = file.type === 'image/png' || file.type === 'image/webp' || file.type === 'image/svg+xml'
            const compressed = keepAlpha
              ? canvas.toDataURL('image/png')
              : canvas.toDataURL('image/jpeg', 0.85)
            setLogoUrl(compressed)
          } else {
            setLogoUrl(dataUrl)
          }
        } catch {
          setLogoUrl(dataUrl)
        } finally {
          setCompressingLogo(false)
        }
      }
      img.onerror = () => {
        setLogoUrl(dataUrl)
        setCompressingLogo(false)
      }
      img.src = dataUrl
    }
    reader.onerror = () => setCompressingLogo(false)
    reader.readAsDataURL(file)
  }

  // Cálculo de días de piloto
  const calculatePilotDays = () => {
    if (status !== 'piloto_14_dias' || !lead.pilot_start_date) {
      return { day: 1, total: 14, percent: 7, remaining: 13 }
    }
    const start = new Date(lead.pilot_start_date).getTime()
    const now = Date.now()
    const diffDays = Math.max(1, Math.floor((now - start) / (1000 * 60 * 60 * 24)) + 1)
    const day = Math.min(diffDays, 14)
    const percent = Math.min(100, Math.round((day / 14) * 100))
    const remaining = Math.max(0, 14 - day)
    return { day, total: 14, percent, remaining }
  }

  const pilotInfo = calculatePilotDays()

  // Control de etapas del periodo de prueba (Hitos del Piloto) [Idea 7]
  const getPilotMilestone = (day: number) => {
    if (day <= 2) {
      return {
        step: 1,
        title: 'Hito 1: Puesta en Marcha (Días 1-2)',
        desc: 'Verificar colocación de adhesivos QR y primeros escaneos de comensales.',
        badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        whatsappMsg: null,
      }
    }
    if (day <= 6) {
      return {
        step: 2,
        title: 'Hito 2: Primer Contacto de Uso (Día 3)',
        desc: 'Preguntar al dueño qué tal la acogida de los clientes y si el personal tiene dudas.',
        badgeColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
        whatsappMsg: `Hola ${contactName || 'amigo'}, te escribo para saber qué tal estos primeros días con la carta QR en ${lead.name}. ¿Los clientes la están leyendo bien? Si quieres ajustar cualquier plato o precio avísame y lo cambiamos al momento.`,
      }
    }
    if (day <= 11) {
      return {
        step: 3,
        title: 'Hito 3: Balance de Mitad de Prueba (Día 7)',
        desc: 'Compartir resumen de lecturas y concertar visita corta de balance.',
        badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        whatsappMsg: `Hola ${contactName || 'amigo'}, ya llevamos una semana con la carta digital en ${lead.name}. He preparado las métricas de consultas y los platos más vistos por tus clientes. ¿Tienes 5 minutos mañana para echarle un ojo rápido?`,
      }
    }
    return {
      step: 4,
      title: 'Hito 4: Cierre Comercial (Días 12-14)',
      desc: 'Alerta de finalización: Agendar visita presencial para formalizar la suscripción definitiva.',
      badgeColor: 'bg-rose-500/10 text-rose-400 border-rose-500/20 animate-pulse',
      whatsappMsg: `Hola ${contactName || 'amigo'}, estamos en la recta final de los 14 días de prueba gratuita de Fluxo en ${lead.name}. Paso a verte el jueves para formalizar el alta definitiva de tu plan y asegurar que tu servicio continúe sin interrupciones. ¿Te viene bien por la mañana o por la tarde?`,
    }
  }

  const currentMilestone = getPilotMilestone(pilotInfo.day)

  const getMilestoneWhatsAppLink = (message: string) => {
    const rawNumber = (contactWhatsapp || contactPhone || '').replace(/\D/g, '')
    if (!rawNumber) return null
    const formattedNumber = rawNumber.startsWith('34') ? rawNumber : `34${rawNumber}`
    return `https://wa.me/${formattedNumber}?text=${encodeURIComponent(message)}`
  }

  const getWhatsAppLink = () => {
    const rawNumber = (contactWhatsapp || contactPhone || '').replace(/\D/g, '')
    if (!rawNumber) return null

    const formattedNumber = rawNumber.startsWith('34') ? rawNumber : `34${rawNumber}`
    const greeting = contactName ? `Hola ${contactName}` : `Hola`
    const text = encodeURIComponent(
      `${greeting}, te contacto desde Fluxo en Noia. He preparado una demo rápida para ${lead.name} donde puedes ver tu carta digital con fotos, código QR para mesas y motor de reseñas en Google Maps. ¿Te vendría bien que te la comparta en 2 minutos?`
    )
    return `https://wa.me/${formattedNumber}?text=${text}`
  }

  const handleAddQuickTag = (tag: string) => {
    if (!notes.includes(tag)) {
      setNotes((prev) => (prev ? `${prev} • ${tag}` : tag))
    }
  }

  const handleToggleChecklist = (key: keyof PilotChecklist) => {
    setChecklist((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const handleToggleComplaintTag = (tag: string) => {
    setComplaintTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  const handleAddCustomComplaint = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComplaintInput.trim()) return
    const tag = `💬 ${newComplaintInput.trim()}`
    if (!complaintTags.includes(tag)) {
      setComplaintTags((prev) => [...prev, tag])
    }
    setNewComplaintInput('')
  }

  const checklistCount = Object.values(checklist).filter(Boolean).length
  const checklistPercent = Math.round((checklistCount / 4) * 100)

  const handleAgreementSigned = async (leadId: string, signedAgreement: PilotAgreement) => {
    setAgreement(signedAgreement)
    setStatus('piloto_14_dias')
    setTargetPlan(signedAgreement.agreed_plan)
    if (signedAgreement.signee_name && !contactName) {
      setContactName(signedAgreement.signee_name)
    }
    if (signedAgreement.signee_phone && !contactPhone) {
      setContactPhone(signedAgreement.signee_phone)
      setContactWhatsapp(signedAgreement.signee_phone)
    }

    const updates: Partial<CRMLead> = {
      status: 'piloto_14_dias',
      target_plan: signedAgreement.agreed_plan,
      mrr_projected: PLAN_PRICING[signedAgreement.agreed_plan],
      pilot_start_date: new Date().toISOString().split('T')[0],
      pilot_end_date: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      pilot_agreement: signedAgreement,
      pilot_checklist: checklist,
      current_pos_system: currentPosSystem,
      decision_makers: decisionMakers,
      beverage_distributor: beverageDistributor,
      google_complaint_tags: complaintTags,
      contact_name: signedAgreement.signee_name || contactName,
      contact_phone: signedAgreement.signee_phone || contactPhone,
      contact_whatsapp: signedAgreement.signee_phone || contactWhatsapp,
    }

    await onUpdate(leadId, updates)
  }

  const handleAppendScannedMenu = (scannedText: string) => {
    setNotes((prev) => (prev ? `${prev}\n\n${scannedText}` : scannedText))
  }

  // Manejo de carga de imágenes / documentos (Base64)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploadingAttachment(true)
    Array.from(files).forEach((file) => {
      const isImg = file.type.startsWith('image/')
      const reader = new FileReader()

      reader.onload = (event) => {
        const result = event.target?.result as string
        const newAtt: LocalAttachment = {
          id: 'att_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
          name: file.name,
          url: result,
          type: isImg ? 'image' : 'document',
          size: file.size,
          created_at: new Date().toISOString(),
        }

        setAttachments((prev) => [newAtt, ...prev])
        setUploadingAttachment(false)
      }

      reader.onerror = () => {
        console.error('Error leyendo archivo')
        setUploadingAttachment(false)
      }

      reader.readAsDataURL(file)
    })
  }

  const handleRemoveAttachment = (attId: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== attId))
  }

  const handleAddQuickNote = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newNoteText.trim()) return
    const timestamp = new Date().toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
    const formatted = `[${timestamp}] ${newNoteText.trim()}`
    setNotes((prev) => (prev ? `${formatted}\n\n${prev}` : formatted))
    setNewNoteText('')
  }

  const buildUpdatesPayload = (): Partial<CRMLead> => {
    const resolvedLastVisit =
      lastVisitDate || (status !== 'lead_por_visitar' ? new Date().toISOString() : null)
    const cleanNextContact = nextContactDate.trim() ? nextContactDate.trim().slice(0, 10) : null

    const updates: Partial<CRMLead> = {
      name: localName.trim() || lead.name,
      status,
      target_plan: targetPlan,
      mrr_projected: PLAN_PRICING[targetPlan],
      contact_name: contactName.trim() || null,
      contact_phone: contactPhone.trim() || null,
      contact_whatsapp: contactWhatsapp.trim() || null,
      notes: notes.trim() || null,
      lost_reason: status === 'perdido' ? lostReason.trim() || 'Sin especificar' : null,
      last_visit_date: resolvedLastVisit,
      next_contact_date: cleanNextContact,
      pilot_checklist: checklist,
      pilot_agreement: agreement,
      current_pos_system: currentPosSystem,
      google_complaint_tags: complaintTags,
      decision_makers: decisionMakers,
      beverage_distributor: beverageDistributor,
      attachments,
      google_review_url: googleReviewUrl.trim() || null,
      custom_slug: effectiveSlug || null,
      logo_url: logoUrl.trim() || null,
      review_stand_mode: reviewStandMode,
      review_stand_fee_eur: reviewStandFeeEur,
      enable_review_gatekeeper: Boolean(lead.enable_review_gatekeeper),
    }

    if (status === 'piloto_14_dias' && !lead.pilot_start_date) {
      updates.pilot_start_date = new Date().toISOString().split('T')[0]
      updates.pilot_end_date = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]
    }
    return updates
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await onUpdate(lead.id, buildUpdatesPayload())
      onClose()
    } finally {
      setSaving(false)
    }
  }

  const handleSaveAndOpenReviewStand = async () => {
    setOpeningStand(true)
    try {
      await onUpdate(lead.id, buildUpdatesPayload())
      if (typeof window !== 'undefined') {
        window.open(`/admin/print-review-stand/${effectiveSlug}`, '_blank', 'noopener,noreferrer')
      }
    } finally {
      setOpeningStand(false)
    }
  }

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }
    setSaving(true)
    try {
      await onDelete(lead.id)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  const leadCity = normalizeLeadCity(lead)
  const googleMapsUrl =
    lead.google_profile_url ||
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      `${lead.name} ${lead.address} ${leadCity}`
    )}`
  const resolvedInstagramUrl =
    lead.instagram_url ||
    (lead.instagram
      ? lead.instagram.startsWith('http')
        ? lead.instagram
        : `https://instagram.com/${lead.instagram.replace(/^@/, '')}`
      : null)

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in select-none">
        <div className="w-full max-w-2xl rounded-3xl bg-slate-900 border border-slate-800 text-white shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
          {/* Cabecera del Local (Compacta + Herramientas desplegables) */}
          <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-900/90 relative z-20 shrink-0">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap mb-1">
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-sky-500/15 text-sky-300 border border-sky-500/30 flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-sky-400" />
                    {leadCity}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    {lead.zone}
                  </span>
                  {(() => {
                    const icpKey = normalizeICP(lead.icp_segment)
                    const icpData = ICP_CONFIG[icpKey]
                    return (
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${icpData.badge}`} title={icpData.description}>
                        {icpData.label}
                      </span>
                    )
                  })()}
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-0.5">
                    ★ {lead.score}/10
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {isEditingName ? (
                    <input
                      type="text"
                      value={localName}
                      onChange={(e) => setLocalName(e.target.value)}
                      onBlur={() => setIsEditingName(false)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') setIsEditingName(false)
                      }}
                      autoFocus
                      className="text-lg sm:text-xl font-bold text-white bg-slate-800 border border-blue-500 rounded-lg px-2 py-0.5 focus:outline-none w-full max-w-md"
                    />
                  ) : (
                    <div className="flex items-center gap-2 group/title min-w-0">
                      <h2 className="text-lg sm:text-xl font-bold text-white truncate">{localName || lead.name}</h2>
                      <button
                        type="button"
                        onClick={() => setIsEditingName(true)}
                        className="opacity-60 hover:opacity-100 text-slate-400 hover:text-blue-400 p-1 rounded transition shrink-0"
                        title="Editar nombre comercial del local"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400 mt-1 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 min-w-0 truncate max-w-full">
                    <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                    <span className="truncate">{lead.address}</span>
                  </span>
                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline inline-flex items-center gap-1 shrink-0"
                  >
                    <ExternalLink className="w-3 h-3" /> Ver en Maps
                  </a>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar ficha"
                className="w-9 h-9 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Barra compacta de acciones rápidas de calle + Herramientas ▾ */}
            <div className="mt-3 flex flex-wrap items-center gap-1.5 sm:gap-2">
              {getWhatsAppLink() && (
                <a
                  href={getWhatsAppLink()!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold inline-flex items-center gap-1.5 transition"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>WhatsApp</span>
                </a>
              )}

              {contactPhone.trim() && (
                <a
                  href={`tel:${contactPhone.replace(/\s+/g, '')}`}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold inline-flex items-center gap-1.5 transition"
                >
                  <Phone className="w-3.5 h-3.5 text-sky-400" />
                  <span>Llamar</span>
                </a>
              )}

              <a
                href={getMenuUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-md shadow-blue-500/20 transition active:scale-95 touch-manipulation"
                title="Abrir la carta interactiva del local"
              >
                <UtensilsCrossed className="w-3.5 h-3.5 text-white" />
                <span>Abrir Carta</span>
                <ExternalLink className="w-3 h-3 opacity-70" />
              </a>

              <button
                type="button"
                onClick={() => setIsScannerOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold inline-flex items-center gap-1.5 transition active:scale-95 touch-manipulation"
                title="Escanear menú físico con la cámara del móvil"
              >
                <Camera className="w-3.5 h-3.5 text-cyan-400" />
                <span>Escanear Carta</span>
              </button>

              {/* Menú desplegable Herramientas ▾ */}
              <div className="relative" ref={toolsMenuRef}>
                <button
                  type="button"
                  onClick={() => setToolsMenuOpen((prev) => !prev)}
                  aria-expanded={toolsMenuOpen}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold inline-flex items-center gap-1.5 transition active:scale-95 touch-manipulation"
                >
                  <Wrench className="w-3.5 h-3.5 text-amber-400" />
                  <span>Herramientas</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-150 ${
                      toolsMenuOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {toolsMenuOpen && (
                  <div className="absolute right-0 sm:left-0 mt-1.5 z-30 w-56 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-1.5 space-y-0.5">
                    <button
                      type="button"
                      disabled={openingStand}
                      onClick={() => {
                        setToolsMenuOpen(false)
                        handleSaveAndOpenReviewStand()
                      }}
                      className="w-full px-3 py-2 rounded-xl hover:bg-amber-500/15 text-left text-xs font-semibold text-amber-200 flex items-center gap-2 transition disabled:opacity-50"
                    >
                      <Printer className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>{openingStand ? 'Abriendo expositor...' : 'Expositor Reseñas'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setToolsMenuOpen(false)
                        setIsAgreementModalOpen(true)
                      }}
                      className="w-full px-3 py-2 rounded-xl hover:bg-amber-500/15 text-left text-xs font-semibold text-amber-300 flex items-center gap-2 transition"
                    >
                      <FileCheck2 className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>{agreement ? 'Acuerdo Firmado ✓' : 'Firmar Prueba (14D)'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setToolsMenuOpen(false)
                        setIsBeforeAfterOpen(true)
                      }}
                      className="w-full px-3 py-2 rounded-xl hover:bg-purple-500/15 text-left text-xs font-semibold text-purple-300 flex items-center gap-2 transition"
                    >
                      <Sliders className="w-4 h-4 text-purple-400 shrink-0" />
                      <span>Antes vs Después</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setToolsMenuOpen(false)
                        setIsDossierOpen(true)
                      }}
                      className="w-full px-3 py-2 rounded-xl hover:bg-blue-500/15 text-left text-xs font-semibold text-blue-300 flex items-center gap-2 transition"
                    >
                      <FileText className="w-4 h-4 text-blue-400 shrink-0" />
                      <span>Dossier Gestor (A4)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setToolsMenuOpen(false)
                        setIsContactCardOpen(true)
                      }}
                      className="w-full px-3 py-2 rounded-xl hover:bg-slate-800 text-left text-xs font-semibold text-slate-200 flex items-center gap-2 transition"
                    >
                      <QrCode className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>Mi QR de Contacto</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="ml-auto flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-500/20">
                <DollarSign className="w-3.5 h-3.5 shrink-0" />
                <span>
                  {PLAN_PRICING[targetPlan]} €/mes
                  {reviewStandMode === 'standalone_20' ? ` + ${REVIEW_STAND_PRICE_EUR}€ único` : ''}
                </span>
              </div>
            </div>
          </div>

          {/* Contenido Desplazable en 6 Bloques Prioritarios (sin scroll horizontal) */}
          <div className="p-4 sm:p-5 overflow-y-auto overflow-x-hidden space-y-3 flex-1">
            {/* [ABIERTO 1] ANTES DE ENTRAR · VISTAZO RÁPIDO */}
            <CollapsibleBlock
              testId="crm-block-before-enter"
              title="Antes de entrar · Vistazo Rápido"
              icon={<Globe className="w-4 h-4 text-blue-400" />}
              isOpen={openSections.before_enter}
              onToggle={() => toggleSection('before_enter')}
              borderClass="border-slate-800"
              summary={
                <>
                  {lead.google_rating != null && (
                    <span className="font-mono text-amber-400 font-bold inline-flex items-center gap-0.5">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      {lead.google_rating} ({lead.google_reviews_count ?? 0})
                    </span>
                  )}
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                      ONLINE_MENU_STATUS_CONFIG[lead.online_menu_status || 'unknown'].badge
                    }`}
                  >
                    {ONLINE_MENU_STATUS_CONFIG[lead.online_menu_status || 'unknown'].label}
                  </span>
                </>
              }
            >
              {/* Badges clave + rating */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {lead.lead_score != null && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                      Lead Score: {lead.lead_score}/100
                    </span>
                  )}
                  {lead.recommended_pitch && RECOMMENDED_PITCH_CONFIG[lead.recommended_pitch] && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${RECOMMENDED_PITCH_CONFIG[lead.recommended_pitch].badge}`}>
                      Propuesta: {RECOMMENDED_PITCH_CONFIG[lead.recommended_pitch].label}
                    </span>
                  )}
                </div>
                {lead.google_rating != null && (
                  <span className="text-xs font-mono text-amber-400 font-bold flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    {lead.google_rating} ({lead.google_reviews_count ?? 0} reseñas)
                  </span>
                )}
              </div>

              {/* Horario sábado + ruta + decisor principal si existe */}
              {(lead.saturday_hours || lead.route_block || decisionMakers.length > 0) && (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-slate-300 bg-slate-900/80 px-3 py-2 rounded-xl border border-slate-800">
                  {lead.saturday_hours && (
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <strong>Sábado:</strong> {lead.saturday_hours}
                    </span>
                  )}
                  {lead.route_block && (
                    <span className="flex items-center gap-1.5 text-violet-300">
                      <MapPin className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                      <strong>Ruta:</strong> {lead.route_block}{lead.route_order ? ` (#${lead.route_order})` : ''}
                    </span>
                  )}
                  {(() => {
                    const primary = decisionMakers.find((d) => d.is_primary) || decisionMakers[0]
                    if (!primary) return null
                    return (
                      <span className="flex items-center gap-1.5 text-blue-300">
                        <User className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        <strong>Preguntar por:</strong> {primary.name}
                        {primary.schedule ? ` (${primary.schedule})` : ''}
                      </span>
                    )
                  })()}
                </div>
              )}

              {/* Píldoras de quejas detectadas (gancho rápido de entrada) */}
              {complaintTags.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 mr-1">
                    Fricción detectada:
                  </span>
                  {complaintTags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-rose-500/15 border border-rose-500/30 text-rose-200"
                    >
                      {tag}
                    </span>
                  ))}
                  {complaintTags.length > 3 && (
                    <span className="text-[10px] text-slate-400">+{complaintTags.length - 3} más</span>
                  )}
                </div>
              )}

              {/* Enlaces externos en 1 toque */}
              <div className="flex flex-wrap items-center gap-2">
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <MapPin className="w-3.5 h-3.5 text-blue-400" />
                  <span>Perfil de Google</span>
                  <ExternalLink className="w-3 h-3 opacity-70" />
                </a>

                {googleReviewUrl.trim() && (
                  <div className="inline-flex items-center rounded-xl bg-amber-500/15 border border-amber-500/30 overflow-hidden">
                    <a
                      href={googleReviewUrl.trim()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 hover:bg-amber-500/20 text-amber-300 text-xs font-bold flex items-center gap-1.5 transition"
                    >
                      <Star className="w-3.5 h-3.5 text-amber-400" />
                      <span>Link Reseñas</span>
                      <ExternalLink className="w-3 h-3 opacity-70" />
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        if (typeof navigator !== 'undefined' && navigator.clipboard && googleReviewUrl.trim()) {
                          navigator.clipboard.writeText(googleReviewUrl.trim())
                          setCopiedReviewLink(true)
                          setTimeout(() => setCopiedReviewLink(false), 2000)
                        }
                      }}
                      className="px-2 py-1.5 border-l border-amber-500/30 hover:bg-amber-500/25 text-amber-300 transition"
                      title="Copiar enlace directo de reseñas"
                    >
                      {copiedReviewLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                )}

                {lead.online_menu_url ? (
                  <a
                    href={lead.online_menu_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <UtensilsCrossed className="w-3.5 h-3.5" />
                    <span>Menú Online ({lead.online_menu_status === 'pdf' ? 'PDF' : 'Web'})</span>
                    <ExternalLink className="w-3 h-3 opacity-70" />
                  </a>
                ) : (
                  <span
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border ${
                      ONLINE_MENU_STATUS_CONFIG[lead.online_menu_status || 'unknown'].badge
                    }`}
                  >
                    {ONLINE_MENU_STATUS_CONFIG[lead.online_menu_status || 'unknown'].label}
                  </span>
                )}

                {lead.website_url && lead.website_url !== lead.online_menu_url && (
                  <a
                    href={lead.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <Globe className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Web Oficial</span>
                    <ExternalLink className="w-3 h-3 opacity-70" />
                  </a>
                )}

                {resolvedInstagramUrl && (
                  <a
                    href={resolvedInstagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-pink-500/15 hover:bg-pink-500/25 text-pink-300 border border-pink-500/30 text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <span>Instagram</span>
                    <ExternalLink className="w-3 h-3 opacity-70" />
                  </a>
                )}

                {lead.facebook_url && (
                  <a
                    href={lead.facebook_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/30 text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <span>Facebook</span>
                    <ExternalLink className="w-3 h-3 opacity-70" />
                  </a>
                )}
              </div>
            </CollapsibleBlock>

            {/* [ABIERTO 2] VISITA, CONTACTO Y SEGUIMIENTO (Lo que anotas al salir) */}
            <CollapsibleBlock
              testId="crm-block-visit-followup"
              title="Visita, Contacto y Seguimiento"
              icon={<CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              isOpen={openSections.visit_followup}
              onToggle={() => toggleSection('visit_followup')}
              borderClass="border-blue-500/30"
              summary={
                <>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${STATUS_CONFIG[status].bg} ${STATUS_CONFIG[status].text} ${STATUS_CONFIG[status].border}`}
                  >
                    {STATUS_CONFIG[status].label}
                  </span>
                  {nextContactDate && (
                    <span className="font-mono text-sky-300 text-[10px]">
                      Próx: {formatShortDate(nextContactDate)}
                    </span>
                  )}
                </>
              }
            >
              {/* Fila rápida: Marcar Visitado Hoy + Estado del Pipeline */}
              <div className="space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-300">
                    Estado en Pipeline
                    {lastVisitDate && (
                      <span className="ml-2 text-[11px] font-mono text-emerald-400">
                        · Visitado el {formatShortDate(lastVisitDate)}
                      </span>
                    )}
                  </span>
                  <button
                    type="button"
                    onClick={handleMarkVisitedToday}
                    className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-200 text-xs font-bold inline-flex items-center gap-1.5 transition active:scale-95 touch-manipulation"
                  >
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{lastVisitDate ? 'Visitado Hoy ✓' : 'Marcar Visitado Hoy'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(Object.keys(STATUS_CONFIG) as CRMStatus[]).map((st) => {
                    const conf = STATUS_CONFIG[st]
                    const isSelected = status === st
                    return (
                      <button
                        key={st}
                        type="button"
                        onClick={() => handleSelectStatus(st)}
                        className={`py-2 px-3 rounded-xl text-xs font-semibold border transition text-left flex items-center justify-between ${
                          isSelected
                            ? `${conf.bg} ${conf.text} ${conf.border} ring-2 ring-blue-500/40 shadow-sm`
                            : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:bg-slate-800'
                        }`}
                      >
                        <span className="truncate">{conf.label}</span>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 shrink-0 ml-1" />}
                      </button>
                    )
                  })}
                </div>

                {status === 'perdido' && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25">
                    <label className="block text-[11px] font-semibold text-rose-300 mb-1">
                      Motivo de Rechazo / Pérdida
                    </label>
                    <input
                      type="text"
                      value={lostReason}
                      onChange={(e) => setLostReason(e.target.value)}
                      placeholder="Ej: Prefiere carta física / Tiene permanencia..."
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-rose-500/30 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-400"
                    />
                  </div>
                )}
              </div>

              {/* Contacto Directo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Persona de Contacto / Cargo
                  </label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
                    <input
                      type="text"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="Ej: Roberto (Dueño / Encargado)"
                      className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Teléfono / WhatsApp
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
                    <input
                      type="tel"
                      value={contactPhone}
                      onChange={(e) => {
                        setContactPhone(e.target.value)
                        if (!contactWhatsapp) setContactWhatsapp(e.target.value)
                      }}
                      placeholder="654 000 000"
                      className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Sub-desplegable compacto: Quién decide y horarios en el local */}
              <div className="rounded-xl bg-slate-900/70 border border-slate-800 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowDecisionMakers((prev) => !prev)}
                  className="w-full px-3 py-2 flex items-center justify-between text-xs text-slate-300 hover:text-white transition"
                >
                  <span className="flex items-center gap-1.5 font-semibold">
                    <Users className="w-3.5 h-3.5 text-blue-400" />
                    <span>Quién decide y horarios en el local ({decisionMakers.length})</span>
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                      showDecisionMakers ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {showDecisionMakers && (
                  <div className="px-3 pb-3 pt-2 border-t border-slate-800/80 space-y-2.5">
                    {decisionMakers.length > 0 ? (
                      <div className="space-y-1.5">
                        {decisionMakers.map((dm, idx) => (
                          <div
                            key={idx}
                            className={`p-2 rounded-xl border flex items-center justify-between gap-2 text-xs transition ${
                              dm.is_primary
                                ? 'bg-blue-950/40 border-blue-500/40 text-blue-200'
                                : 'bg-slate-950/70 border-slate-800 text-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <button
                                type="button"
                                onClick={() => handleSetPrimaryMaker(idx)}
                                title={dm.is_primary ? 'Decisor principal' : 'Marcar como decisor principal'}
                                className={`p-1 rounded-lg text-xs transition ${
                                  dm.is_primary
                                    ? 'bg-amber-500/20 text-amber-400 font-bold'
                                    : 'text-slate-500 hover:text-amber-400'
                                }`}
                              >
                                ★
                              </button>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-bold text-white truncate">{dm.name}</span>
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                                    {dm.role}
                                  </span>
                                  {dm.is_primary && (
                                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-500/20 text-blue-300">
                                      Principal
                                    </span>
                                  )}
                                </div>
                                {dm.schedule && (
                                  <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                                    <Clock className="w-3 h-3 text-slate-500 shrink-0" />
                                    <span className="truncate">{dm.schedule}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveDecisionMaker(idx)}
                              className="p-1 text-slate-500 hover:text-rose-400 transition shrink-0"
                              title="Eliminar"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-500 italic">
                        Sin decisores registrados. Añade a quién buscar y a qué hora suele estar.
                      </p>
                    )}

                    <form onSubmit={handleAddDecisionMaker} className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <input
                        type="text"
                        value={newMakerName}
                        onChange={(e) => setNewMakerName(e.target.value)}
                        placeholder="Nombre (ej. Carmen)"
                        className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                      />
                      <select
                        value={newMakerRole}
                        onChange={(e) => setNewMakerRole(e.target.value)}
                        className="px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
                      >
                        <option value="Dueño / Gerente">Dueño / Gerente</option>
                        <option value="Jefe de Cocina">Jefe de Cocina</option>
                        <option value="Encargado de Sala">Encargado de Sala</option>
                        <option value="Socio / Hermano">Socio / Hermano</option>
                        <option value="Gestor / Asesor">Gestor / Asesor</option>
                        <option value="Camarero de Barra">Camarero de Barra</option>
                      </select>
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          value={newMakerSchedule}
                          onChange={(e) => setNewMakerSchedule(e.target.value)}
                          placeholder="Horario (ej. 11:30-13h)"
                          className="flex-1 min-w-0 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                        />
                        <button
                          type="submit"
                          className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs text-white font-bold shrink-0"
                        >
                          + Añadir
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>

              {/* Próximo contacto / Cuándo volver */}
              <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-sky-400" />
                    <span>Próximo contacto / Cuándo volver</span>
                  </span>
                  <div className="flex items-center gap-1 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setQuickFollowUp(1)}
                      className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-sky-500/20 border border-slate-700 text-[10px] font-semibold text-slate-200 transition"
                    >
                      Mañana
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuickFollowUp(3)}
                      className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-sky-500/20 border border-slate-700 text-[10px] font-semibold text-slate-200 transition"
                    >
                      +3 días
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuickFollowUp('saturday')}
                      className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-sky-500/20 border border-slate-700 text-[10px] font-semibold text-sky-300 transition"
                    >
                      Próx. Sábado
                    </button>
                    {nextContactDate && (
                      <button
                        type="button"
                        onClick={() => setQuickFollowUp('clear')}
                        className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-rose-500/20 border border-slate-700 text-[10px] font-semibold text-rose-300 transition"
                      >
                        Limpiar
                      </button>
                    )}
                  </div>
                </div>
                <input
                  type="date"
                  value={nextContactDate}
                  onChange={(e) => setNextContactDate(e.target.value)}
                  className="w-full sm:w-auto px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs font-mono text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              {/* Etiquetas rápidas + Nota con fecha/hora automática + Historial completo */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300">Notas de Visita &amp; Bitácora</span>
                  <span className="text-[11px] text-slate-500">Toca para etiquetar rápido</span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {QUICK_PAIN_TAGS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleAddQuickTag(tag)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 border border-slate-700/60 transition flex items-center gap-1"
                    >
                      <Tag className="w-3 h-3 text-blue-400 shrink-0" />
                      <span>{tag}</span>
                    </button>
                  ))}
                </div>

                <form onSubmit={handleAddQuickNote} className="flex gap-2">
                  <input
                    type="text"
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    placeholder="Nota rápida con hora automática (ej. Hablé con encargada, volver 17:30)..."
                    className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shrink-0 transition"
                  >
                    + Anotar
                  </button>
                </form>

                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Historial completo de la visita, objeciones, horarios recomendados..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-y"
                />
              </div>
            </CollapsibleBlock>

            {/* [PLEGADO 3] PREPARAR PITCH, QUEJAS Y OBJECIONES */}
            <CollapsibleBlock
              testId="crm-block-pitch"
              title="Preparar Pitch, Quejas y Objeciones"
              icon={<Flame className="w-4 h-4 text-rose-400" />}
              isOpen={openSections.pitch}
              onToggle={() => toggleSection('pitch')}
              summary={
                <span className="truncate">
                  {POS_SYSTEM_CONFIG[currentPosSystem].label} · {DISTRIBUTOR_CONFIG[beverageDistributor].label}
                  {complaintTags.length > 0 ? ` · ${complaintTags.length} quejas` : ''}
                </span>
              }
            >
              {/* Fricciones y Quejas Frecuentes */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-rose-400" />
                    <span>Fricciones y Quejas Frecuentes en Reseñas</span>
                  </span>
                  <span className="text-[10px] text-rose-400 font-mono">Puntos débiles</span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {DEFAULT_REVIEW_COMPLAINT_SUGGESTIONS.map((tag) => {
                    const isTagged = complaintTags.includes(tag)
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleToggleComplaintTag(tag)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition ${
                          isTagged
                            ? 'bg-rose-500/20 border-rose-500 text-rose-300 font-semibold shadow-sm'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {tag}
                      </button>
                    )
                  })}
                  {complaintTags
                    .filter((t) => !DEFAULT_REVIEW_COMPLAINT_SUGGESTIONS.includes(t))
                    .map((t) => (
                      <span
                        key={t}
                        onClick={() => handleToggleComplaintTag(t)}
                        className="px-2.5 py-1 rounded-lg text-[11px] bg-rose-500/25 border border-rose-500/40 text-rose-200 cursor-pointer"
                      >
                        {t} ✕
                      </span>
                    ))}
                </div>

                <form onSubmit={handleAddCustomComplaint} className="flex gap-2">
                  <input
                    type="text"
                    value={newComplaintInput}
                    onChange={(e) => setNewComplaintInput(e.target.value)}
                    placeholder="Añadir queja observada: ej. cola en barra, mesas sucias..."
                    className="flex-1 min-w-0 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-semibold shrink-0"
                  >
                    Añadir
                  </button>
                </form>

                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-start gap-2 text-xs text-slate-300">
                  <span className="text-emerald-400 font-bold shrink-0">🎯 Apertura:</span>
                  <span className="leading-relaxed">
                    {complaintTags.length > 0
                      ? `Menciona cómo Fluxo soluciona directamente "${complaintTags[0].replace(/[^\w\s]/gi, '').trim()}" sin contratar más personal.`
                      : 'Pregúntale al dueño si en fines de semana se le forman colas en terraza para pedir o pagar la cuenta.'}
                  </span>
                </div>
              </div>

              {/* Sistema o TPV Actual */}
              <div className="pt-2 border-t border-slate-800/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Sistema o TPV Actual del Restaurante</span>
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(Object.keys(POS_SYSTEM_CONFIG) as CRMPosSystem[]).map((posKey) => {
                    const conf = POS_SYSTEM_CONFIG[posKey]
                    const isSelected = currentPosSystem === posKey
                    return (
                      <button
                        key={posKey}
                        type="button"
                        onClick={() => setCurrentPosSystem(posKey)}
                        className={`p-2 rounded-xl text-left border text-xs transition flex items-center gap-2 ${
                          isSelected
                            ? 'bg-indigo-600/20 border-indigo-500 text-indigo-200 ring-1 ring-indigo-500 font-bold'
                            : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800'
                        }`}
                      >
                        <span className="text-sm">{conf.icon}</span>
                        <span className="truncate">{conf.label}</span>
                      </button>
                    )
                  })}
                </div>

                <div className="p-2.5 rounded-xl bg-indigo-950/40 border border-indigo-800/40 flex items-start gap-2 text-xs">
                  <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-indigo-300">Argumento Clave: </span>
                    <span className="text-slate-300 leading-relaxed">
                      {POS_SYSTEM_CONFIG[currentPosSystem].pitchHint}
                    </span>
                  </div>
                </div>
              </div>

              {/* Distribuidora de Bebida */}
              <div className="pt-2 border-t border-slate-800/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span className="text-sm">🍺</span>
                    <span>Distribuidora de Bebida o Patrocinio</span>
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(Object.keys(DISTRIBUTOR_CONFIG) as BeverageDistributor[]).map((distKey) => {
                    const conf = DISTRIBUTOR_CONFIG[distKey]
                    const isSelected = beverageDistributor === distKey
                    return (
                      <button
                        key={distKey}
                        type="button"
                        onClick={() => setBeverageDistributor(distKey)}
                        className={`p-2 rounded-xl text-left border text-xs transition flex items-center gap-2 ${
                          isSelected
                            ? 'bg-amber-600/20 border-amber-500 text-amber-200 ring-1 ring-amber-500 font-bold'
                            : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800'
                        }`}
                      >
                        <span className="text-sm">{conf.icon}</span>
                        <span className="truncate">{conf.label}</span>
                      </button>
                    )
                  })}
                </div>

                <div className="p-2.5 rounded-xl bg-amber-950/30 border border-amber-800/40 flex items-start gap-2 text-xs">
                  <span className="text-amber-400 font-bold shrink-0 mt-0.5">💡 Objeción resuelta:</span>
                  <span className="text-slate-300 leading-relaxed">
                    {DISTRIBUTOR_CONFIG[beverageDistributor].counterPitch}
                  </span>
                </div>
              </div>

              {/* Argumentario Personal de Sala */}
              <div className="pt-2 border-t border-slate-800/80 space-y-2">
                <div
                  onClick={() => setShowStaffPitch(!showStaffPitch)}
                  className="flex items-center justify-between cursor-pointer select-none"
                >
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>👥</span>
                    <span>Argumentario de Alivio para Camareros / Sala</span>
                  </span>
                  <button
                    type="button"
                    className="text-[11px] text-slate-300 hover:text-white px-2 py-1 rounded bg-slate-800"
                  >
                    {showStaffPitch ? 'Ocultar ▲' : 'Ver Guía ▼'}
                  </button>
                </div>

                {showStaffPitch && (
                  <div className="space-y-2 pt-1 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-start gap-2">
                      <span className="shrink-0">🏃</span>
                      <div>
                        <span className="font-bold text-emerald-300">1. Cero paseos a terraza: </span>
                        <span className="text-slate-300">
                          &quot;Con la carta en QR llegas a la mesa directamente a tomar la comanda sin ir a llevar y recoger cartas de papel.&quot;
                        </span>
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-start gap-2">
                      <span className="shrink-0">🛡️</span>
                      <div>
                        <span className="font-bold text-blue-300">2. Cero dudas con alérgenos: </span>
                        <span className="text-slate-300">
                          &quot;El cliente consulta los 14 alérgenos oficiales en su móvil sin tener que preguntar a cocina en pleno servicio.&quot;
                        </span>
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-start gap-2">
                      <span className="shrink-0">💶</span>
                      <div>
                        <span className="font-bold text-amber-300">3. Cobro más rápido: </span>
                        <span className="text-slate-300">
                          &quot;Cuando piden la cuenta por el móvil ya sabes la mesa exacta y llevas el datáfono listo.&quot;
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CollapsibleBlock>

            {/* [PLEGADO 4] PLAN COMERCIAL Y EXPOSITOR RESEÑAS 15€ / 20€ */}
            <CollapsibleBlock
              testId="crm-block-commercial"
              title="Plan Comercial y Expositor Reseñas 15€ / 20€"
              icon={<Star className="w-4 h-4 text-amber-400 fill-amber-400" />}
              isOpen={openSections.commercial}
              onToggle={() => toggleSection('commercial')}
              borderClass="border-amber-500/25"
              summary={
                <span>
                  {PLAN_PRICING[targetPlan]} €/mes ·{' '}
                  {reviewStandMode === 'standalone_20'
                    ? `Expositor ${REVIEW_STAND_PRICE_EUR} €`
                    : reviewStandMode === 'included_carta'
                      ? 'Expositor Incluido'
                      : 'Sin expositor'}
                </span>
              }
            >
              {/* Plan Objetivo Comercial */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Plan Objetivo Comercial
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'carta_15', name: 'Carta QR', price: `${CARTA_QR_PRICE_EUR} €/mes` },
                    { id: 'mozo_47', name: 'Plan Mozo', price: '47 €/mes' },
                    { id: 'fundador_50', name: 'Full Fundador', price: '50 €/mes' },
                    { id: 'full_97', name: 'Plan Full', price: '97 €/mes' },
                  ].map((pl) => (
                    <button
                      key={pl.id}
                      type="button"
                      onClick={() => setTargetPlan(pl.id as CRMPlan)}
                      className={`p-2.5 rounded-xl text-xs font-medium border text-left transition ${
                        targetPlan === pl.id
                          ? 'bg-blue-600/20 border-blue-500 text-blue-300 shadow-sm'
                          : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      <div className="font-bold text-white">{pl.name}</div>
                      <div className="text-[11px] text-emerald-400 font-mono mt-0.5">{pl.price}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Configuración de Expositor NFC + QR */}
              <div className="pt-2 border-t border-slate-800/80 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Printer className="w-3.5 h-3.5 text-amber-400" />
                    <span>Expositor NFC + QR &amp; Reseñas Google</span>
                  </span>
                  <span className="text-[10px] font-mono text-amber-300 bg-amber-500/10 border border-amber-500/25 px-2 py-0.5 rounded-full">
                    Enlace corto: /r/{effectiveSlug}
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    URL directa de Google Maps Reviews
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      type="url"
                      value={googleReviewUrl}
                      onChange={(e) => setGoogleReviewUrl(e.target.value)}
                      placeholder="https://search.google.com/local/writereview?placeid=..."
                      className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    />
                    {googleReviewUrl.trim() && (
                      <>
                        <a
                          href={googleReviewUrl.trim()}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-amber-300 inline-flex items-center gap-1 shrink-0"
                          title="Probar enlace de Google Reviews"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Probar</span>
                        </a>
                        <button
                          type="button"
                          onClick={() => {
                            if (typeof navigator !== 'undefined' && navigator.clipboard) {
                              navigator.clipboard.writeText(googleReviewUrl.trim())
                              setCopiedReviewLink(true)
                              setTimeout(() => setCopiedReviewLink(false), 2000)
                            }
                          }}
                          className="px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 inline-flex items-center gap-1 shrink-0"
                          title="Copiar URL de Google Reviews"
                        >
                          {copiedReviewLink ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                          <span>Copiar</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Slug único (/r/{effectiveSlug})
                    </label>
                    <input
                      type="text"
                      value={customSlug}
                      onChange={(e) => setCustomSlug(e.target.value)}
                      onBlur={() => setCustomSlug(normalizeSlug(customSlug || localName || lead.name))}
                      placeholder="ej. bar-ejemplo-santiago"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Logo opcional del local (URL o imagen)
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-full overflow-hidden border border-slate-700 bg-white flex items-center justify-center shrink-0">
                        {logoUrl.trim() ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={logoUrl.trim()}
                            alt={localName || lead.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ImageOff className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                      <input
                        type="text"
                        value={logoUrl}
                        onChange={(e) => setLogoUrl(e.target.value)}
                        placeholder="/images/... o https://... (vacío = sin logo)"
                        className="flex-1 min-w-0 px-2.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                      />
                      <label
                        className="px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-cyan-300 cursor-pointer shrink-0 inline-flex items-center gap-1"
                        title="Subir imagen de logo (se comprime automáticamente en circular)"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>{compressingLogo ? '...' : 'Subir'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoFileUpload}
                          className="hidden"
                        />
                      </label>
                      {logoUrl.trim() && (
                        <button
                          type="button"
                          onClick={() => setLogoUrl('')}
                          className="px-2 py-2 rounded-xl bg-slate-800 hover:bg-rose-900/50 border border-slate-700 text-[11px] font-semibold text-rose-300 shrink-0"
                          title="Quitar logo (predeterminado)"
                        >
                          Quitar
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">
                    Modalidad de Tarjeta / Expositor NFC + QR
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {[
                      { id: 'none' as ReviewStandMode, title: 'Sin expositor', sub: 'Solo prospección' },
                      { id: 'standalone_20' as ReviewStandMode, title: `Suelto · ${REVIEW_STAND_PRICE_EUR} €`, sub: 'Pago único' },
                      { id: 'included_carta' as ReviewStandMode, title: 'Incluido · 0 €', sub: `Con Carta QR ${CARTA_QR_PRICE_EUR} €/mes` },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setReviewStandMode(opt.id)}
                        className={`p-2 rounded-xl text-left border text-xs transition ${
                          reviewStandMode === opt.id
                            ? 'bg-amber-500/20 border-amber-400 text-amber-200 font-bold'
                            : 'bg-slate-900/70 border-slate-800 text-slate-400 hover:bg-slate-800'
                        }`}
                      >
                        <div className="text-white font-bold">{opt.title}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{opt.sub}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    disabled={openingStand}
                    onClick={handleSaveAndOpenReviewStand}
                    className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black inline-flex items-center gap-1.5 transition active:scale-95 disabled:opacity-50"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>{openingStand ? 'Guardando...' : 'Guardar y abrir expositor'}</span>
                  </button>

                  <a
                    href="/admin/print-review-stand/predeterminada"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold inline-flex items-center gap-1.5 transition"
                  >
                    <ImageOff className="w-3.5 h-3.5 text-slate-400" />
                    <span>Versión predeterminada</span>
                    <ExternalLink className="w-3 h-3 opacity-70" />
                  </a>

                  <a
                    href={`/r/${effectiveSlug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-auto px-3 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 text-xs font-semibold inline-flex items-center gap-1.5 transition"
                  >
                    <span>Probar /r/{effectiveSlug}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </CollapsibleBlock>

            {/* [PLEGADO 5] FOTOS DE CARTA Y ARCHIVOS */}
            <CollapsibleBlock
              testId="crm-block-files"
              title="Fotos de Carta y Documentos"
              icon={<ImageIcon className="w-4 h-4 text-cyan-400" />}
              isOpen={openSections.files}
              onToggle={() => toggleSection('files')}
              summary={
                <span className="font-mono text-cyan-300">
                  {attachments.length} {attachments.length === 1 ? 'archivo' : 'archivos'}
                </span>
              }
            >
              <div className="flex items-center gap-3 flex-wrap">
                <label className="px-3.5 py-2 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition active:scale-95">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{uploadingAttachment ? 'Cargando...' : 'Subir Foto / Archivo'}</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*,application/pdf,.doc,.docx"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
                <span className="text-[11px] text-slate-500">
                  Fotos de carta física, fachada, tickets o presupuestos
                </span>
              </div>

              {attachments.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                  {attachments.map((att) => (
                    <div
                      key={att.id}
                      className="group relative rounded-xl overflow-hidden border border-slate-800 bg-slate-900 flex flex-col justify-between"
                    >
                      {att.type === 'image' ? (
                        <div
                          className="h-24 w-full bg-slate-950 cursor-pointer overflow-hidden relative"
                          onClick={() => setPreviewImage(att.url)}
                        >
                          <img
                            src={att.url}
                            alt={att.name}
                            className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                            <Eye className="w-5 h-5 text-white" />
                          </div>
                        </div>
                      ) : (
                        <div className="h-24 w-full bg-slate-950 flex flex-col items-center justify-center p-2 text-center">
                          <Paperclip className="w-6 h-6 text-slate-400 mb-1" />
                          <span className="text-[10px] text-slate-300 truncate w-full px-1">
                            {att.name}
                          </span>
                        </div>
                      )}

                      <div className="p-1.5 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
                        <span className="text-[10px] text-slate-400 truncate flex-1 pr-1 font-mono">
                          {att.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveAttachment(att.id)}
                          className="text-slate-500 hover:text-rose-400 p-0.5"
                          title="Eliminar"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">
                  No hay fotos ni documentos adjuntos para este local.
                </p>
              )}

              {previewImage && (
                <div
                  className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 cursor-pointer"
                  onClick={() => setPreviewImage(null)}
                >
                  <div className="relative max-w-3xl max-h-[90vh]">
                    <img
                      src={previewImage}
                      alt="Previsualización"
                      className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl"
                    />
                    <button
                      type="button"
                      onClick={() => setPreviewImage(null)}
                      className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </CollapsibleBlock>

            {/* [PLEGADO 6 / Auto-abierto en piloto] PILOTO 14 DÍAS Y CHECKLIST */}
            <CollapsibleBlock
              testId="crm-block-pilot"
              title="Piloto 14 Días y Checklist"
              icon={<CheckSquare className="w-4 h-4 text-emerald-400" />}
              isOpen={openSections.pilot}
              onToggle={() => toggleSection('pilot')}
              borderClass={status === 'piloto_14_dias' ? 'border-amber-500/35' : 'border-slate-800'}
              summary={
                <span className="font-mono text-emerald-400">
                  Checklist {checklistCount}/4
                  {status === 'piloto_14_dias' ? ` · Día ${pilotInfo.day}/14` : ''}
                </span>
              }
            >
              {status === 'piloto_14_dias' && (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-semibold text-amber-300">
                    <span className="flex items-center gap-1.5 font-bold">
                      <Clock className="w-4 h-4 text-amber-400" />
                      Periodo de Prueba: Día {pilotInfo.day} de {pilotInfo.total}
                    </span>
                    <span>{pilotInfo.remaining} días restantes</span>
                  </div>

                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-400 h-full rounded-full transition-all duration-500"
                      style={{ width: `${pilotInfo.percent}%` }}
                    />
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/90 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${currentMilestone.badgeColor}`}>
                          Paso {currentMilestone.step} de 4
                        </span>
                        <h4 className="font-bold text-xs text-white">{currentMilestone.title}</h4>
                      </div>
                      <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                        {currentMilestone.desc}
                      </p>
                    </div>

                    {currentMilestone.whatsappMsg && getMilestoneWhatsAppLink(currentMilestone.whatsappMsg) && (
                      <a
                        href={getMilestoneWhatsAppLink(currentMilestone.whatsappMsg)!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>WhatsApp Hito</span>
                      </a>
                    )}
                  </div>

                  {pilotInfo.day >= 10 && (
                    <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-2">
                      <span className="text-[11px] text-amber-300 font-semibold">¿Resultado del piloto?</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setStatus('ganado')
                            alert('¡Local convertido a cliente de pago! Se activará la facturación recurrente.')
                          }}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[11px] font-bold hover:bg-emerald-500 transition"
                        >
                          ✓ Ganado (Pase a Pago)
                        </button>
                        <button
                          type="button"
                          onClick={() => setStatus('perdido')}
                          className="px-2.5 py-1 rounded-lg bg-rose-600/30 text-rose-300 border border-rose-500/40 text-[11px] font-semibold hover:bg-rose-600/50 transition"
                        >
                          ✕ Perdido
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${checklistPercent}%` }}
                  />
                </div>

                <div className="space-y-1.5 pt-1 text-xs">
                  {[
                    { key: 'qr_placed', label: '1. Pegatinas QR colocadas en mesas y barra' },
                    { key: 'menu_uploaded', label: '2. Carta inicial y precios verificados' },
                    { key: 'staff_trained', label: '3. Explicación rápida al personal de sala (3 min)' },
                    { key: 'review_date_set', label: '4. Fecha de balance de cierre agendada' },
                  ].map((item) => {
                    const isChecked = !!checklist[item.key as keyof PilotChecklist]
                    return (
                      <label
                        key={item.key}
                        className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 cursor-pointer transition select-none"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleChecklist(item.key as keyof PilotChecklist)}
                          className="w-4 h-4 rounded border-slate-700 text-blue-600 focus:ring-0 bg-slate-800 cursor-pointer"
                        />
                        <span
                          className={`text-xs ${
                            isChecked
                              ? 'text-slate-300 line-through opacity-70'
                              : 'text-slate-200 font-medium'
                          }`}
                        >
                          {item.label}
                        </span>
                      </label>
                    )
                  })}
                </div>
              </div>
            </CollapsibleBlock>
          </div>

          {/* Pie de Acciones */}
          <div className="p-4 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleDelete}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                confirmDelete
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                  : 'text-rose-400 hover:bg-rose-500/10'
              }`}
            >
              <Trash2 className="w-4 h-4" />
              <span>{confirmDelete ? '¿Confirmar Borrado?' : 'Eliminar'}</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleSave}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/25 transition disabled:opacity-50"
              >
                {saving ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Firma de Acuerdo de Prueba [Idea 9] */}
      <CRMPilotAgreementModal
        lead={lead}
        isOpen={isAgreementModalOpen}
        onClose={() => setIsAgreementModalOpen(false)}
        onAgreementSigned={handleAgreementSigned}
      />

      {/* Modal de Escáner de Carta de Papel [Idea 1] */}
      <CRMMenuScannerModal
        lead={lead}
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onAppendToNotes={handleAppendScannedMenu}
      />

      {/* Modal Comparador Antes vs Después [Idea 2] */}
      <CRMBeforeAfterModal
        restaurantName={lead.name}
        isOpen={isBeforeAfterOpen}
        onClose={() => setIsBeforeAfterOpen(false)}
      />

      {/* Modal Dossier Asesor A4 [Idea 5] */}
      <CRMDossierModal
        lead={lead}
        isOpen={isDossierOpen}
        onClose={() => setIsDossierOpen(false)}
      />

      {/* Modal Tarjeta de Contacto Digital QR [Idea 3] */}
      <CRMContactCardModal
        isOpen={isContactCardOpen}
        onClose={() => setIsContactCardOpen(false)}
      />
    </>
  )
}
