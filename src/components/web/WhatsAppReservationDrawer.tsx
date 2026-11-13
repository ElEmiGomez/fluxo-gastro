'use client'

import React, { useState, useEffect, useMemo, useRef } from 'react'
import { X, MessageCircle, Copy, Check, Users, Calendar, Clock, MapPin, FileText } from 'lucide-react'
import type { RestaurantArchetype, SpaceAmbienceItem, WebLanguage } from '@/types/gastronomic-web.types'

type SpaceChoiceKey = 'terraza' | 'salon' | 'barra' | 'indiferente'
type ReasonChoiceKey = 'reserva' | 'grupo' | 'consulta'
type GuestChoiceKey = '2' | '3-4' | '5-6' | '6+'
type ShiftChoiceKey = 'mediodia' | 'noche'

export interface WhatsAppLiveConfiguratorProps {
  restaurantName: string
  whatsappNumber: string
  ambiences?: SpaceAmbienceItem[]
  initialZone?: string
  initialReason?: string
  variant?: 'cauce' | 'default'
  lang?: WebLanguage
  onWhatsAppClick?: () => void
}

const CONFIG_COPY: Record<
  WebLanguage,
  {
    spaceLabel: string
    reasonLabel: string
    guestsAndShiftLabel: string
    detailsLabel: string
    detailsPlaceholder: string
    spaces: Record<SpaceChoiceKey, string>
    reasons: Record<ReasonChoiceKey, string>
    guests: Record<GuestChoiceKey, string>
    shifts: Record<ShiftChoiceKey, string>
    previewHeading: string
    readyPill: string
    copyBtn: string
    copiedBtn: string
    shareBtn: string
    msgIntro: string
    msgReason: string
    msgSpace: string
    msgGuestsShift: string
    msgDetails: string
  }
> = {
  es: {
    spaceLabel: 'Espacio preferido',
    reasonLabel: 'Motivo',
    guestsAndShiftLabel: 'Personas y Turno',
    detailsLabel: 'Detalles opcionales',
    detailsPlaceholder: 'Hora aproximada, alergias, carrito o notas para la mesa...',
    spaces: {
      terraza: 'Terraza Exterior',
      salon: 'Salón Interior',
      barra: 'Barra',
      indiferente: 'Indiferente',
    },
    reasons: {
      reserva: 'Reserva de mesa',
      grupo: 'Grupo o picoteo',
      consulta: 'Consulta rápida',
    },
    guests: {
      '2': '2 personas',
      '3-4': '3-4 personas',
      '5-6': '5-6 personas',
      '6+': 'Grupo +6',
    },
    shifts: {
      mediodia: 'Mediodía · 13:30h',
      noche: 'Noche · 21:30h',
    },
    previewHeading: 'Mensaje preparado',
    readyPill: 'LISTO PARA COPIAR',
    copyBtn: 'Copiar mensaje',
    copiedBtn: '¡Mensaje copiado!',
    shareBtn: 'Compartir por WhatsApp',
    msgIntro: 'quiero enviaros una consulta:',
    msgReason: 'Motivo',
    msgSpace: 'Espacio preferido',
    msgGuestsShift: 'Personas y turno',
    msgDetails: 'Detalles',
  },
  gl: {
    spaceLabel: 'Espazo preferido',
    reasonLabel: 'Motivo',
    guestsAndShiftLabel: 'Persoas e Quenda',
    detailsLabel: 'Detalles opcionais',
    detailsPlaceholder: 'Hora aproximada, alerxias, carriño ou notas para a mesa...',
    spaces: {
      terraza: 'Terraza Exterior',
      salon: 'Salón Interior',
      barra: 'Barra',
      indiferente: 'Indiferente',
    },
    reasons: {
      reserva: 'Reserva de mesa',
      grupo: 'Grupo ou picoteo',
      consulta: 'Consulta rápida',
    },
    guests: {
      '2': '2 persoas',
      '3-4': '3-4 persoas',
      '5-6': '5-6 persoas',
      '6+': 'Grupo +6',
    },
    shifts: {
      mediodia: 'Mediodía · 13:30h',
      noche: 'Noite · 21:30h',
    },
    previewHeading: 'Mensaxe preparada',
    readyPill: 'LISTO PARA COPIAR',
    copyBtn: 'Copiar mensaxe',
    copiedBtn: 'Mensaxe copiada!',
    shareBtn: 'Compartir por WhatsApp',
    msgIntro: 'quero enviarvos unha consulta:',
    msgReason: 'Motivo',
    msgSpace: 'Espazo preferido',
    msgGuestsShift: 'Persoas e quenda',
    msgDetails: 'Detalles',
  },
  en: {
    spaceLabel: 'Preferred space',
    reasonLabel: 'Purpose',
    guestsAndShiftLabel: 'Party size & Shift',
    detailsLabel: 'Optional details',
    detailsPlaceholder: 'Approx. arrival time, allergies, stroller or table notes...',
    spaces: {
      terraza: 'Outdoor Terrace',
      salon: 'Indoor Dining Room',
      barra: 'Barra',
      indiferente: 'No preference',
    },
    reasons: {
      reserva: 'Table reservation',
      grupo: 'Group or sharing plates',
      consulta: 'Quick inquiry',
    },
    guests: {
      '2': '2 guests',
      '3-4': '3-4 guests',
      '5-6': '5-6 guests',
      '6+': 'Group 6+',
    },
    shifts: {
      mediodia: 'Midday · 13:30h',
      noche: 'Night · 21:30h',
    },
    previewHeading: 'Prepared message',
    readyPill: 'READY TO COPY',
    copyBtn: 'Copy message',
    copiedBtn: 'Message copied!',
    shareBtn: 'Share via WhatsApp',
    msgIntro: 'I would like to send an inquiry:',
    msgReason: 'Purpose',
    msgSpace: 'Preferred space',
    msgGuestsShift: 'Party & shift',
    msgDetails: 'Details',
  },
}

function resolveSpaceKey(zone?: string): SpaceChoiceKey | null {
  if (!zone) return null
  const low = zone.toLowerCase()
  if (low.includes('terraza') || low.includes('terrace')) return 'terraza'
  if (low.includes('salón') || low.includes('salon') || low.includes('dining') || low.includes('piedra')) {
    return 'salon'
  }
  if (low.includes('barra') || low.includes('bar')) return 'barra'
  if (low.includes('indiferente') || low.includes('grupo') || low.includes('group') || low.includes('preference')) {
    return 'indiferente'
  }
  return null
}

function resolveReasonKey(reason?: string, zone?: string): ReasonChoiceKey | null {
  const combined = `${reason || ''} ${zone || ''}`.toLowerCase()
  if (combined.includes('grupo') || combined.includes('group') || combined.includes('picoteo')) {
    return 'grupo'
  }
  if (combined.includes('consulta') || combined.includes('inquiry')) {
    return 'consulta'
  }
  if (combined.includes('reserva') || combined.includes('reservation')) {
    return 'reserva'
  }
  return null
}

export function WhatsAppLiveConfigurator({
  restaurantName,
  whatsappNumber,
  ambiences = [],
  initialZone,
  initialReason,
  variant = 'cauce',
  lang = 'es',
  onWhatsAppClick,
}: WhatsAppLiveConfiguratorProps) {
  const copy = CONFIG_COPY[lang] || CONFIG_COPY.es
  const isCauce = variant === 'cauce'

  const [spaceKey, setSpaceKey] = useState<SpaceChoiceKey>(() => resolveSpaceKey(initialZone) || 'terraza')
  const [customSpaceLabel, setCustomSpaceLabel] = useState<string>(() =>
    resolveSpaceKey(initialZone) ? '' : initialZone || ''
  )
  const [reasonKey, setReasonKey] = useState<ReasonChoiceKey>(
    () => resolveReasonKey(initialReason, initialZone) || 'reserva'
  )
  const [guestKey, setGuestKey] = useState<GuestChoiceKey>(() =>
    resolveReasonKey(initialReason, initialZone) === 'grupo' ? '6+' : '3-4'
  )
  const [shiftKey, setShiftKey] = useState<ShiftChoiceKey>('noche')
  const [details, setDetails] = useState<string>('')
  const [copied, setCopied] = useState<boolean>(false)
  const previewRef = useRef<HTMLDivElement | null>(null)

  // Sincroniza espacio y motivo cuando el usuario selecciona una tarjeta de espacio en la página
  useEffect(() => {
    if (!initialZone && !initialReason) return
    const matchedSpace = resolveSpaceKey(initialZone)
    if (matchedSpace) {
      setSpaceKey(matchedSpace)
      setCustomSpaceLabel('')
    } else if (initialZone) {
      setCustomSpaceLabel(initialZone)
    }

    const matchedReason = resolveReasonKey(initialReason, initialZone)
    if (matchedReason) {
      setReasonKey(matchedReason)
      if (matchedReason === 'grupo') {
        setGuestKey('6+')
      }
    }
  }, [initialZone, initialReason])

  const selectedSpaceDisplay = customSpaceLabel || copy.spaces[spaceKey]
  const selectedReasonDisplay = copy.reasons[reasonKey]
  const selectedGuestsDisplay = copy.guests[guestKey]
  const selectedShiftDisplay = copy.shifts[shiftKey]

  const preparedMessage = useMemo(() => {
    const lines = [
      `Hola ${restaurantName}, ${copy.msgIntro}`,
      `• ${copy.msgReason}: ${selectedReasonDisplay}`,
      `• ${copy.msgSpace}: ${selectedSpaceDisplay}`,
      `• ${copy.msgGuestsShift}: ${selectedGuestsDisplay} · ${selectedShiftDisplay}`,
    ]
    if (details.trim()) {
      lines.push(`• ${copy.msgDetails}: ${details.trim()}`)
    }
    return lines.join('\n')
  }, [
    restaurantName,
    copy.msgIntro,
    copy.msgReason,
    copy.msgSpace,
    copy.msgGuestsShift,
    copy.msgDetails,
    selectedReasonDisplay,
    selectedSpaceDisplay,
    selectedGuestsDisplay,
    selectedShiftDisplay,
    details,
  ])

  const cleanNumber = whatsappNumber.replace(/\D/g, '')
  const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(preparedMessage)}`

  const handleCopy = async () => {
    let didCopy = false
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(preparedMessage)
        didCopy = true
      }
    } catch {
      didCopy = false
    }

    if (!didCopy && typeof document !== 'undefined') {
      try {
        const tempArea = document.createElement('textarea')
        tempArea.value = preparedMessage
        tempArea.setAttribute('readonly', '')
        tempArea.style.position = 'fixed'
        tempArea.style.opacity = '0'
        document.body.appendChild(tempArea)
        tempArea.select()
        didCopy = document.execCommand('copy')
        document.body.removeChild(tempArea)
      } catch {
        didCopy = false
      }
    }

    if (!didCopy && previewRef.current && typeof window !== 'undefined') {
      const range = document.createRange()
      range.selectNodeContents(previewRef.current)
      const selection = window.getSelection()
      selection?.removeAllRanges()
      selection?.addRange(range)
    }

    setCopied(true)
    setTimeout(() => setCopied(false), 2600)
  }

  const spaceKeys: SpaceChoiceKey[] = ['terraza', 'salon', 'barra', 'indiferente']
  const reasonKeys: ReasonChoiceKey[] = ['reserva', 'grupo', 'consulta']
  const guestKeys: GuestChoiceKey[] = ['2', '3-4', '5-6', '6+']
  const shiftKeys: ShiftChoiceKey[] = ['mediodia', 'noche']

  const nonCauceZones =
    !isCauce && ambiences.length > 0
      ? ambiences.map((a) => (lang === 'gl' ? a.name_gl || a.name : lang === 'en' ? a.name_en || a.name : a.name))
      : null

  return (
    <div
      className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch"
      style={{ fontFamily: "'DM Sans', 'Inter', sans-serif" }}
    >
      {/* Columna Izquierda: 4 campos reactivos */}
      <div
        className={`lg:col-span-7 rounded-[22px] p-6 sm:p-8 flex flex-col gap-6 ${
          isCauce
            ? 'bg-white border border-slate-200/80 shadow-sm text-[#0F172A]'
            : 'bg-white/[0.04] border border-white/10 text-[#F5F5F3]'
        }`}
      >
        {/* 1. Espacio preferido */}
        <div className="space-y-2.5">
          <label
            className={`text-xs font-semibold uppercase tracking-wider flex items-center gap-2 ${
              isCauce ? 'text-[#475569]' : 'text-white/75'
            }`}
          >
            <MapPin className={`w-3.5 h-3.5 ${isCauce ? 'text-[#1D4ED8]' : 'text-[#C85A32]'}`} />
            <span>{copy.spaceLabel}</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {nonCauceZones
              ? nonCauceZones.map((zoneLabel) => {
                  const active = selectedSpaceDisplay === zoneLabel
                  return (
                    <button
                      key={zoneLabel}
                      type="button"
                      onClick={() => setCustomSpaceLabel(zoneLabel)}
                      className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                        active
                          ? 'bg-[#C85A32] text-white shadow-sm'
                          : 'bg-white/5 text-white/75 hover:bg-white/10 border border-white/10'
                      }`}
                    >
                      {zoneLabel}
                    </button>
                  )
                })
              : spaceKeys.map((key) => {
                  const active = !customSpaceLabel && spaceKey === key
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        setSpaceKey(key)
                        setCustomSpaceLabel('')
                      }}
                      className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8] focus-visible:ring-offset-2 ${
                        active
                          ? 'bg-[#1D4ED8] text-white shadow-sm'
                          : 'bg-[#F6F6F3] text-[#0F172A] border border-slate-200 hover:border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {copy.spaces[key]}
                    </button>
                  )
                })}
          </div>
        </div>

        {/* 2. Motivo */}
        <div className="space-y-2.5">
          <label
            className={`text-xs font-semibold uppercase tracking-wider flex items-center gap-2 ${
              isCauce ? 'text-[#475569]' : 'text-white/75'
            }`}
          >
            <Calendar className={`w-3.5 h-3.5 ${isCauce ? 'text-[#1D4ED8]' : 'text-[#C85A32]'}`} />
            <span>{copy.reasonLabel}</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {reasonKeys.map((key) => {
              const active = reasonKey === key
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setReasonKey(key)}
                  className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8] focus-visible:ring-offset-2 ${
                    active
                      ? isCauce
                        ? 'bg-[#1D4ED8] text-white shadow-sm'
                        : 'bg-[#C85A32] text-white shadow-sm'
                      : isCauce
                      ? 'bg-[#F6F6F3] text-[#0F172A] border border-slate-200 hover:border-slate-300 hover:bg-slate-100'
                      : 'bg-white/5 text-white/75 hover:bg-white/10 border border-white/10'
                  }`}
                >
                  {copy.reasons[key]}
                </button>
              )
            })}
          </div>
        </div>

        {/* 3. Personas y Turno */}
        <div className="space-y-2.5">
          <label
            className={`text-xs font-semibold uppercase tracking-wider flex items-center gap-2 ${
              isCauce ? 'text-[#475569]' : 'text-white/75'
            }`}
          >
            <Users className={`w-3.5 h-3.5 ${isCauce ? 'text-[#1D4ED8]' : 'text-[#C85A32]'}`} />
            <span>{copy.guestsAndShiftLabel}</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {guestKeys.map((key) => {
              const active = guestKey === key
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setGuestKey(key)}
                  className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-medium tabular-nums transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8] focus-visible:ring-offset-2 ${
                    active
                      ? isCauce
                        ? 'bg-[#1D4ED8] text-white shadow-sm'
                        : 'bg-[#C85A32] text-white shadow-sm'
                      : isCauce
                      ? 'bg-[#F6F6F3] text-[#0F172A] border border-slate-200 hover:border-slate-300 hover:bg-slate-100'
                      : 'bg-white/5 text-white/75 hover:bg-white/10 border border-white/10'
                  }`}
                >
                  {copy.guests[key]}
                </button>
              )
            })}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            {shiftKeys.map((key) => {
              const active = shiftKey === key
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setShiftKey(key)}
                  className={`px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium tabular-nums flex items-center justify-center gap-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8] focus-visible:ring-offset-2 ${
                    active
                      ? isCauce
                        ? 'bg-[#0F172A] text-white shadow-sm'
                        : 'bg-white/20 text-white border border-white/30'
                      : isCauce
                      ? 'bg-[#F6F6F3] text-[#0F172A] border border-slate-200 hover:border-slate-300 hover:bg-slate-100'
                      : 'bg-white/5 text-white/75 hover:bg-white/10 border border-white/10'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{copy.shifts[key]}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* 4. Detalles opcionales */}
        <div className="space-y-2">
          <label
            htmlFor="whatsapp-optional-details"
            className={`text-xs font-semibold uppercase tracking-wider flex items-center gap-2 ${
              isCauce ? 'text-[#475569]' : 'text-white/75'
            }`}
          >
            <FileText className={`w-3.5 h-3.5 ${isCauce ? 'text-[#1D4ED8]' : 'text-[#C85A32]'}`} />
            <span>{copy.detailsLabel}</span>
          </label>
          <textarea
            id="whatsapp-optional-details"
            rows={2}
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder={copy.detailsPlaceholder}
            className={`w-full px-4 py-3 rounded-xl text-sm outline-none resize-none transition-colors ${
              isCauce
                ? 'bg-[#F6F6F3] border border-slate-200 text-[#0F172A] placeholder:text-slate-400 focus:border-[#1D4ED8] focus:bg-white focus-visible:ring-2 focus-visible:ring-[#1D4ED8]'
                : 'bg-white/5 border border-white/10 text-white placeholder-white/35 focus:border-[#C85A32]'
            }`}
          />
        </div>
      </div>

      {/* Columna Derecha: Mensaje preparado en tiempo real */}
      <div
        className={`lg:col-span-5 rounded-[22px] p-6 sm:p-8 flex flex-col justify-between gap-5 ${
          isCauce
            ? 'bg-white border border-slate-200/80 shadow-sm text-[#0F172A]'
            : 'bg-white/[0.04] border border-white/10 text-[#F5F5F3]'
        }`}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h3
              className={`text-xl sm:text-2xl leading-tight ${
                isCauce ? 'text-[#0F172A]' : 'text-white font-serif'
              }`}
              style={isCauce ? { fontFamily: "'Instrument Serif', Georgia, serif" } : undefined}
            >
              {copy.previewHeading}
            </h3>
            <span
              className={`text-[10px] sm:text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                isCauce
                  ? 'bg-blue-50 text-[#1E3A8A] border border-blue-200'
                  : 'bg-white/10 text-white/90 border border-white/20'
              }`}
            >
              {copy.readyPill}
            </span>
          </div>

          <div
            ref={previewRef}
            data-testid="whatsapp-prepared-message"
            className={`select-all rounded-2xl p-4 sm:p-5 text-sm leading-relaxed whitespace-pre-line tabular-nums ${
              isCauce
                ? 'bg-[#F6F6F3] border border-slate-200 text-[#0F172A]'
                : 'bg-black/30 border border-white/10 text-white/90'
            }`}
          >
            {preparedMessage}
          </div>
        </div>

        <div className="flex flex-col gap-2.5 pt-2">
          <button
            type="button"
            onClick={handleCopy}
            className={`w-full min-h-[48px] py-3 px-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8] focus-visible:ring-offset-2 ${
              isCauce
                ? 'border border-slate-300 bg-white hover:bg-slate-50 text-[#0F172A]'
                : 'bg-white/10 hover:bg-white/15 border border-white/15 text-white'
            }`}
          >
            {copied ? (
              <>
                <Check className={`w-4 h-4 ${isCauce ? 'text-[#1D4ED8]' : 'text-emerald-400'}`} />
                <span className={isCauce ? 'text-[#1D4ED8]' : 'text-emerald-400'}>
                  {copy.copiedBtn}
                </span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 opacity-70" />
                <span>{copy.copyBtn}</span>
              </>
            )}
          </button>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => onWhatsAppClick?.()}
            className={`w-full min-h-[48px] py-3.5 px-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8] focus-visible:ring-offset-2 ${
              isCauce
                ? 'bg-[#1D4ED8] hover:bg-[#1E3A8A] text-white'
                : 'bg-[#25D366] hover:bg-[#20ba59] text-[#0A2612]'
            }`}
          >
            <MessageCircle className="w-4 h-4 flex-shrink-0" />
            <span>{copy.shareBtn}</span>
          </a>
        </div>
      </div>
    </div>
  )
}

interface WhatsAppReservationDrawerProps {
  restaurantName: string
  whatsappNumber: string
  ambiences: SpaceAmbienceItem[]
  isOpen: boolean
  onClose: () => void
  initialZone?: string
  initialReason?: string
  archetype?: RestaurantArchetype
  variant?: 'cauce' | 'default'
  lang?: WebLanguage
}

const MODAL_TITLES: Record<WebLanguage, { eyebrow: string; title: string; closeAria: string }> = {
  es: {
    eyebrow: 'WhatsApp Directo · Sin Comisiones',
    title: 'Prepara tu consulta para',
    closeAria: 'Cerrar configurador de WhatsApp',
  },
  gl: {
    eyebrow: 'WhatsApp Directo · Sen Comisións',
    title: 'Prepara a túa consulta para',
    closeAria: 'Pechar configurador de WhatsApp',
  },
  en: {
    eyebrow: 'Direct WhatsApp · Zero Fees',
    title: 'Prepare your message for',
    closeAria: 'Close WhatsApp configurator',
  },
}

export function WhatsAppReservationDrawer({
  restaurantName,
  whatsappNumber,
  ambiences,
  isOpen,
  onClose,
  initialZone,
  initialReason,
  variant = 'cauce',
  lang = 'es',
}: WhatsAppReservationDrawerProps) {
  useEffect(() => {
    if (!isOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const isCauce = variant === 'cauce'
  const labels = MODAL_TITLES[lang] || MODAL_TITLES.es

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="reservation-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200"
      style={{ fontFamily: "'DM Sans', 'Inter', sans-serif" }}
    >
      <div
        className={`w-full max-w-4xl rounded-t-3xl sm:rounded-[24px] max-h-[92vh] overflow-y-auto p-5 sm:p-8 shadow-2xl flex flex-col gap-5 ${
          isCauce
            ? 'bg-[#F6F6F3] text-[#0F172A] border border-slate-200'
            : 'bg-[#0E1013] text-[#F5F5F3] border border-white/10'
        }`}
      >
        <div
          className={`flex items-start justify-between gap-3 pb-4 border-b ${
            isCauce ? 'border-slate-200' : 'border-white/10'
          }`}
        >
          <div>
            <span
              className={`text-[11px] uppercase tracking-wider font-bold ${
                isCauce ? 'text-[#1D4ED8]' : 'text-[#C85A32]'
              }`}
            >
              {labels.eyebrow}
            </span>
            <h3
              id="reservation-title"
              className={`mt-1 text-2xl sm:text-3xl leading-tight ${
                isCauce ? 'text-[#0F172A]' : 'text-white'
              }`}
              style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
            >
              {labels.title} {restaurantName}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={labels.closeAria}
            className={`p-2 rounded-full transition-all flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8] ${
              isCauce
                ? 'hover:bg-slate-200/70 text-[#475569] hover:text-[#0F172A]'
                : 'hover:bg-white/10 text-white/60 hover:text-white'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <WhatsAppLiveConfigurator
          restaurantName={restaurantName}
          whatsappNumber={whatsappNumber}
          ambiences={ambiences}
          initialZone={initialZone}
          initialReason={initialReason}
          variant={variant}
          lang={lang}
        />
      </div>
    </div>
  )
}
