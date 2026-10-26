'use client'

import React, { useState } from 'react'
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
  ShieldCheck
} from 'lucide-react'
import {
  CRMICP,
  CRMLead,
  CRMPlan,
  CRMStatus,
  PilotAgreement,
  PilotChecklist,
  PLAN_PRICING
} from '@/types/crm.types'
import { CRMPilotAgreementModal } from './CRMPilotAgreementModal'

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
  'Carta en papel desactualizada',
  'Mucho retraso en horas pico',
  'Terrazas ciegas / alejadas',
  'Receptivo a Carta Digital (39€)',
  'Quiere fotos profesionales',
  'Le interesa el Comandero',
  'Pide pasar en horario de tarde',
  'Dueño no estaba disponible',
]

export function CRMLeadDetailModal({
  lead,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
}: CRMLeadDetailModalProps) {
  if (!isOpen || !lead) return null

  const [status, setStatus] = useState<CRMStatus>(lead.status)
  const [targetPlan, setTargetPlan] = useState<CRMPlan>(lead.target_plan)
  const [contactName, setContactName] = useState(lead.contact_name || '')
  const [contactPhone, setContactPhone] = useState(lead.contact_phone || '')
  const [contactWhatsapp, setContactWhatsapp] = useState(lead.contact_whatsapp || lead.contact_phone || '')
  const [notes, setNotes] = useState(lead.notes || '')
  const [lostReason, setLostReason] = useState(lead.lost_reason || '')
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
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

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

  // Control de etapas del periodo de prueba (Hitos del Piloto)
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

  // Enlace a WhatsApp con mensaje del hito actual
  const getMilestoneWhatsAppLink = (message: string) => {
    const rawNumber = (contactWhatsapp || contactPhone || '').replace(/\D/g, '')
    if (!rawNumber) return null
    const formattedNumber = rawNumber.startsWith('34') ? rawNumber : `34${rawNumber}`
    return `https://wa.me/${formattedNumber}?text=${encodeURIComponent(message)}`
  }

  // Generar enlace directo a WhatsApp con mensaje personalizado inicial
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

  // Toggle de elementos del checklist
  const handleToggleChecklist = (key: keyof PilotChecklist) => {
    setChecklist((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  // Cálculo del progreso del checklist
  const checklistCount = Object.values(checklist).filter(Boolean).length
  const checklistPercent = Math.round((checklistCount / 4) * 100)

  // Manejo de firma de acuerdo de prueba
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
      contact_name: signedAgreement.signee_name || contactName,
      contact_phone: signedAgreement.signee_phone || contactPhone,
      contact_whatsapp: signedAgreement.signee_phone || contactWhatsapp,
    }

    await onUpdate(leadId, updates)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const updates: Partial<CRMLead> = {
        status,
        target_plan: targetPlan,
        mrr_projected: PLAN_PRICING[targetPlan],
        contact_name: contactName.trim() || null,
        contact_phone: contactPhone.trim() || null,
        contact_whatsapp: contactWhatsapp.trim() || null,
        notes: notes.trim() || null,
        lost_reason: status === 'perdido' ? lostReason.trim() || 'Sin especificar' : null,
        last_visit_date: new Date().toISOString(),
        pilot_checklist: checklist,
        pilot_agreement: agreement,
      }

      if (status === 'piloto_14_dias' && !lead.pilot_start_date) {
        updates.pilot_start_date = new Date().toISOString().split('T')[0]
        updates.pilot_end_date = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]
      }

      await onUpdate(lead.id, updates)
      onClose()
    } finally {
      setSaving(false)
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

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${lead.name} ${lead.address} Noia`
  )}`

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in select-none">
        <div className="w-full max-w-2xl rounded-3xl bg-slate-900 border border-slate-800 text-white shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
          {/* Cabecera del Local */}
          <div className="p-5 border-b border-slate-800 bg-slate-900/60 relative">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    {lead.zone}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    ICP: {lead.icp_segment}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                    ★ Score {lead.score}/10
                  </span>
                </div>
                <h2 className="text-xl font-bold text-white truncate">{lead.name}</h2>
                <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                  <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                  <span className="truncate">{lead.address}</span>
                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline flex items-center gap-1 ml-1"
                  >
                    <ExternalLink className="w-3 h-3" /> Ver en Maps
                  </a>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Barra de Contacto Inmediato */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {getWhatsAppLink() ? (
                <a
                  href={getWhatsAppLink()!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-2 transition"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-400" />
                  <span>WhatsApp Directo</span>
                </a>
              ) : null}

              {contactPhone ? (
                <a
                  href={`tel:${contactPhone}`}
                  className="px-3.5 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-semibold flex items-center gap-2 transition"
                >
                  <Phone className="w-4 h-4 text-blue-400" />
                  <span>Llamar: {contactPhone}</span>
                </a>
              ) : null}

              {/* Botón de Firma de Acuerdo de Prueba */}
              <button
                type="button"
                onClick={() => setIsAgreementModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1.5 transition active:scale-95 touch-manipulation"
              >
                <FileCheck2 className="w-4 h-4 text-amber-400" />
                <span>{agreement ? 'Ver Acuerdo Firmado' : 'Firmar Prueba (14D)'}</span>
              </button>

              <div className="ml-auto flex items-center gap-1.5 text-xs font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
                <DollarSign className="w-3.5 h-3.5" />
                <span>MRR: {PLAN_PRICING[targetPlan]} €/mes</span>
              </div>
            </div>
          </div>

          {/* Contenido Desplazable */}
          <div className="p-5 overflow-y-auto space-y-5 flex-1">
            {/* 1. CONTROL DE ETAPAS DEL PERIODO DE PRUEBA (14 DÍAS) [Idea 7] */}
            {status === 'piloto_14_dias' && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold text-amber-300">
                  <span className="flex items-center gap-1.5 font-bold">
                    <Clock className="w-4 h-4 text-amber-400" />
                    Periodo de Prueba: Día {pilotInfo.day} de {pilotInfo.total}
                  </span>
                  <span>{pilotInfo.remaining} días restantes</span>
                </div>

                {/* Barra de progreso */}
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${pilotInfo.percent}%` }}
                  />
                </div>

                {/* Tarjeta del Hito Actual */}
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

                  {currentMilestone.whatsappMsg && (
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

                {/* Acciones Rápidas si se acerca el cierre (Días 10-14) */}
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

            {/* 2. LISTA DE PUESTA EN MARCHA (CHECKLIST) [Idea 8] */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <CheckSquare className="w-4 h-4 text-emerald-400" />
                  Lista de Puesta en Marcha (Checklist)
                </span>
                <span className="text-[11px] font-mono font-semibold text-emerald-400">
                  {checklistCount}/4 ({checklistPercent}%)
                </span>
              </div>

              {/* Barra de progreso del checklist */}
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${checklistPercent}%` }}
                />
              </div>

              <div className="space-y-2 pt-1 text-xs">
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

            {/* Selector de Estado en Pipeline */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Estado en Pipeline de Ventas
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {(Object.keys(STATUS_CONFIG) as CRMStatus[]).map((st) => {
                  const conf = STATUS_CONFIG[st]
                  const isSelected = status === st
                  return (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setStatus(st)}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold border transition text-left flex items-center justify-between ${
                        isSelected
                          ? `${conf.bg} ${conf.text} ${conf.border} ring-2 ring-blue-500/40 shadow-sm`
                          : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:bg-slate-800'
                      }`}
                    >
                      <span>{conf.label}</span>
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Motivo de Pérdida (Si es Perdido) */}
            {status === 'perdido' && (
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                <label className="block text-xs font-semibold text-rose-300 mb-1">
                  Motivo de Rechazo / Pérdida
                </label>
                <input
                  type="text"
                  value={lostReason}
                  onChange={(e) => setLostReason(e.target.value)}
                  placeholder="Ej: Prefiere carta física tradicional / No ve necesidad tecnológica / Tiene permanencia..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-rose-500/30 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-400"
                />
              </div>
            )}

            {/* Selector de Plan y Precio */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Plan Objetivo Comercial
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'carta_39', name: 'Carta Digital', price: '39 €/mes' },
                  { id: 'sala_69', name: 'Sala / Mozo', price: '69 €/mes' },
                  { id: 'full_99', name: 'Full KDS', price: '99 €/mes' },
                  { id: 'suite_139', name: 'Suite Integral', price: '139 €/mes' },
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

            {/* Datos de Contacto */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Persona de Contacto / Cargo
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                  <input
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="Ej: Roberto (Dueño / Encargado)"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Teléfono / WhatsApp
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                  <input
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => {
                      setContactPhone(e.target.value)
                      if (!contactWhatsapp) setContactWhatsapp(e.target.value)
                    }}
                    placeholder="654 000 000"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Notas de la Prospección y Etiquetas Rápidas */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Notas de Visita & Historial</span>
                <span className="text-[11px] text-slate-500 font-normal">Toca para añadir etiqueta</span>
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {QUICK_PAIN_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleAddQuickTag(tag)}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 border border-slate-700/60 transition flex items-center gap-1"
                  >
                    <Tag className="w-3 h-3 text-blue-400" />
                    <span>{tag}</span>
                  </button>
                ))}
              </div>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Anotaciones de la conversación, objeciones, horarios recomendados para hablar con el dueño..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
              />
            </div>
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
    </>
  )
}
