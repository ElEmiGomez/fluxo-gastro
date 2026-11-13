'use client'

import React, { useState, useEffect } from 'react'
import { X, MessageCircle, Copy, Check, Users, Calendar, Clock, MapPin, AlertCircle } from 'lucide-react'
import type { RestaurantArchetype, SpaceAmbienceItem, WebLanguage } from '@/types/gastronomic-web.types'

interface WhatsAppReservationDrawerProps {
  restaurantName: string
  whatsappNumber: string
  ambiences: SpaceAmbienceItem[]
  isOpen: boolean
  onClose: () => void
  initialZone?: string
  archetype?: RestaurantArchetype
  lang?: WebLanguage
}

const DRAWER_COPY: Record<
  WebLanguage,
  {
    eyebrow: string
    titleUrban: string
    titleDefault: string
    closeAria: string
    contactLabel: string
    contactPlaceholder: string
    guestsLabel: string
    dateLabel: string
    shiftTimeLabel: string
    lunchShift: string
    dinnerShift: string
    zoneLabel: string
    groupsOption: string
    notesLabel: string
    notesPlaceholder: string
    sendBtn: string
    copyBtn: string
    copiedBtn: string
    msgGreeting: string
    msgName: string
    msgPendingName: string
    msgDateShift: string
    msgGuests: string
    msgZone: string
    msgNotes: string
    peopleUnit: string
  }
> = {
  es: {
    eyebrow: 'WhatsApp Directo · Sin Comisiones',
    titleUrban: 'Reserva en Terraza o Salón / Consulta para Grupos',
    titleDefault: 'Solicitar Mesa en',
    closeAria: 'Cerrar modal de reserva',
    contactLabel: 'Nombre de contacto',
    contactPlaceholder: 'Tu nombre y apellido',
    guestsLabel: 'Número de personas',
    dateLabel: 'Fecha',
    shiftTimeLabel: 'Turno y Hora',
    lunchShift: 'Mediodía · 13:30h',
    dinnerShift: 'Noche · 20:30h',
    zoneLabel: 'Zona del Local o Grupos',
    groupsOption: 'Grupos',
    notesLabel: 'Notas de alérgenos o peticiones especiales (opcional)',
    notesPlaceholder: 'Ej. 1 persona celíaca, mesa amplia para grupo, carrito de bebé...',
    sendBtn: 'Enviar Solicitud por WhatsApp',
    copyBtn: 'Copiar mensaje al portapapeles (Respaldo)',
    copiedBtn: 'Mensaje copiado al portapapeles',
    msgGreeting: 'quisiera consultar disponibilidad / solicitar mesa:',
    msgName: 'Nombre',
    msgPendingName: 'A confirmar',
    msgDateShift: 'Fecha y Hora',
    msgGuests: 'Personas',
    msgZone: 'Zona / Espacio',
    msgNotes: 'Notas / Alérgenos',
    peopleUnit: 'personas',
  },
  gl: {
    eyebrow: 'WhatsApp Directo · Sen Comisións',
    titleUrban: 'Reserva en Terraza ou Salón / Consulta para Grupos',
    titleDefault: 'Solicitar Mesa en',
    closeAria: 'Pechar modal de reserva',
    contactLabel: 'Nome de contacto',
    contactPlaceholder: 'O teu nome e apelidos',
    guestsLabel: 'Número de persoas',
    dateLabel: 'Data',
    shiftTimeLabel: 'Quenda e Hora',
    lunchShift: 'Mediodía · 13:30h',
    dinnerShift: 'Noite · 20:30h',
    zoneLabel: 'Zona do Local ou Grupos',
    groupsOption: 'Grupos',
    notesLabel: 'Notas de alérxenos ou peticións especiais (opcional)',
    notesPlaceholder: 'Ex. 1 persoa celíaca, mesa ampla para grupo, carriño de bebé...',
    sendBtn: 'Enviar Solicitude por WhatsApp',
    copyBtn: 'Copiar mensaxe ao portapapeis (Respaldo)',
    copiedBtn: 'Mensaxe copiada ao portapapeis',
    msgGreeting: 'gustaríame consultar dispoñibilidade / solicitar mesa:',
    msgName: 'Nome',
    msgPendingName: 'Por confirmar',
    msgDateShift: 'Data e Hora',
    msgGuests: 'Persoas',
    msgZone: 'Zona / Espazo',
    msgNotes: 'Notas / Alérxenos',
    peopleUnit: 'persoas',
  },
  en: {
    eyebrow: 'Direct WhatsApp · Zero Fees',
    titleUrban: 'Book Terrace or Dining Room / Group Inquiries',
    titleDefault: 'Request a Table at',
    closeAria: 'Close reservation dialog',
    contactLabel: 'Contact name',
    contactPlaceholder: 'Your full name',
    guestsLabel: 'Party size',
    dateLabel: 'Date',
    shiftTimeLabel: 'Shift & Time',
    lunchShift: 'Midday · 13:30h',
    dinnerShift: 'Evening · 20:30h',
    zoneLabel: 'Area or Group Inquiry',
    groupsOption: 'Groups',
    notesLabel: 'Allergy notes or special requests (optional)',
    notesPlaceholder: 'E.g. 1 gluten-free guest, large table for group, stroller...',
    sendBtn: 'Send Request via WhatsApp',
    copyBtn: 'Copy message to clipboard (Backup)',
    copiedBtn: 'Message copied to clipboard',
    msgGreeting: 'I would like to check availability / request a table:',
    msgName: 'Name',
    msgPendingName: 'To be confirmed',
    msgDateShift: 'Date & Time',
    msgGuests: 'Guests',
    msgZone: 'Preferred Area',
    msgNotes: 'Notes / Allergens',
    peopleUnit: 'guests',
  },
}

export function WhatsAppReservationDrawer({
  restaurantName,
  whatsappNumber,
  ambiences,
  isOpen,
  onClose,
  initialZone,
  archetype = 'urban_street',
  lang = 'es',
}: WhatsAppReservationDrawerProps) {
  const isUrbanBrewery = archetype === 'urban_street' || archetype === 'tavern'
  const copy = DRAWER_COPY[lang] || DRAWER_COPY.es

  const getAmbName = (amb: SpaceAmbienceItem) =>
    lang === 'gl' ? amb.name_gl || amb.name : lang === 'en' ? amb.name_en || amb.name : amb.name

  const [comensales, setComensales] = useState<number>(4)
  const [fecha, setFecha] = useState<string>(() => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toISOString().split('T')[0]
  })
  const [turno, setTurno] = useState<'almuerzo' | 'cena'>('cena')
  const [hora, setHora] = useState<string>('20:30')
  const [zona, setZona] = useState<string>(
    initialZone || (ambiences[0] ? getAmbName(ambiences[0]) : copy.groupsOption)
  )
  const [notas, setNotas] = useState<string>('')
  const [nombre, setNombre] = useState<string>('')
  const [copied, setCopied] = useState<boolean>(false)

  // Sincroniza zona cuando el usuario elige otro espacio en la página
  useEffect(() => {
    if (initialZone) {
      setZona(initialZone)
    } else if (ambiences.length > 0) {
      setZona(getAmbName(ambiences[0]))
    }
  }, [initialZone, ambiences, lang])

  // Cierre con Escape cuando el drawer está abierto
  useEffect(() => {
    if (!isOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const zoneChoices = [
    ...ambiences.map((amb) => ({ id: amb.id, label: getAmbName(amb) })),
    { id: 'grupos', label: copy.groupsOption },
  ]

  const buildMessage = () => {
    const shiftLabel = turno === 'almuerzo' ? copy.lunchShift.split('·')[0].trim() : copy.dinnerShift.split('·')[0].trim()
    let msg = `Hola ${restaurantName}, ${copy.msgGreeting}\n`
    msg += `• ${copy.msgName}: ${nombre.trim() || copy.msgPendingName}\n`
    msg += `• ${copy.msgDateShift}: ${fecha} (${shiftLabel} · ${hora}h)\n`
    msg += `• ${copy.msgGuests}: ${comensales === 10 ? '+8' : comensales} ${copy.peopleUnit}\n`
    msg += `• ${copy.msgZone}: ${zona}\n`
    if (notas.trim()) {
      msg += `• ${copy.msgNotes}: ${notas.trim()}\n`
    }
    return msg
  }

  const handleWhatsAppRedirect = () => {
    const text = buildMessage()
    const cleanNumber = whatsappNumber.replace(/\D/g, '')
    const url = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(text)}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(buildMessage())
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      setCopied(false)
    }
  }

  const accentBorderFocus = isUrbanBrewery ? 'focus:border-[#F59E0B]' : 'focus:border-[#C85A32]'

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="reservation-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      style={{ fontFamily: "'DM Sans', 'Inter', sans-serif" }}
    >
      <div
        className={`w-full max-w-lg text-[#F5F5F3] border-t sm:border rounded-t-3xl sm:rounded-2xl max-h-[92vh] overflow-y-auto p-6 shadow-2xl flex flex-col gap-5 ${
          isUrbanBrewery
            ? 'bg-[#0A0B0E] border-white/15 ring-1 ring-[#F59E0B]/20'
            : 'bg-[#0E1013] border-white/10'
        }`}
      >
        {/* Encabezado del modal */}
        <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-4">
          <div>
            <span
              className={`text-[11px] uppercase tracking-wider font-bold ${
                isUrbanBrewery ? 'text-[#F59E0B]' : 'text-[#C85A32]'
              }`}
            >
              {copy.eyebrow}
            </span>
            <h3
              id="reservation-title"
              className={`mt-1 text-white leading-tight ${
                isUrbanBrewery ? 'text-xl sm:text-2xl uppercase tracking-tight' : 'text-xl font-serif'
              }`}
              style={isUrbanBrewery ? { fontFamily: "'Anton', 'Sora', sans-serif" } : undefined}
            >
              {isUrbanBrewery ? copy.titleUrban : `${copy.titleDefault} ${restaurantName}`}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={copy.closeAria}
            className="p-2 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-all flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. Nombre */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-white/75 font-medium">{copy.contactLabel}</label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder={copy.contactPlaceholder}
            className={`w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-white/30 focus:outline-none transition-colors ${accentBorderFocus}`}
          />
        </div>

        {/* 2. Selector rápido de Comensales */}
        <div className="flex flex-col gap-2">
          <label className="text-xs text-white/75 font-medium flex items-center gap-1.5">
            <Users className={`w-3.5 h-3.5 ${isUrbanBrewery ? 'text-[#F59E0B]' : 'text-[#C85A32]'}`} />
            <span>{copy.guestsLabel}</span>
          </label>
          <div className="grid grid-cols-5 gap-2">
            {[2, 4, 6, 8, 10].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => setComensales(num)}
                className={`py-2 px-1 rounded-xl text-sm font-bold tabular-nums transition-all ${
                  comensales === num
                    ? isUrbanBrewery
                      ? 'bg-[#F59E0B] text-[#0A0B0E] shadow-md shadow-[#F59E0B]/30'
                      : 'bg-[#C85A32] text-white shadow-md shadow-[#C85A32]/30'
                    : 'bg-white/5 text-white/70 hover:bg-white/10 border border-white/5'
                }`}
              >
                {num === 10 ? '+8' : `${num}`}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Fecha y Turno / Hora */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-white/75 font-medium flex items-center gap-1.5">
              <Calendar className={`w-3.5 h-3.5 ${isUrbanBrewery ? 'text-[#F59E0B]' : 'text-[#C85A32]'}`} />
              <span>{copy.dateLabel}</span>
            </label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className={`w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white tabular-nums focus:outline-none transition-colors ${accentBorderFocus}`}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-white/75 font-medium flex items-center gap-1.5">
              <Clock className={`w-3.5 h-3.5 ${isUrbanBrewery ? 'text-[#F59E0B]' : 'text-[#C85A32]'}`} />
              <span>{copy.shiftTimeLabel}</span>
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {(['13:30', '20:30', '22:00'] as const).map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => {
                    setHora(slot)
                    setTurno(slot === '13:30' ? 'almuerzo' : 'cena')
                  }}
                  className={`py-2 rounded-xl text-xs font-bold tabular-nums transition-all ${
                    hora === slot
                      ? isUrbanBrewery
                        ? 'bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]'
                        : 'bg-white/20 text-white border border-white/30'
                      : 'bg-white/5 text-white/65 hover:bg-white/10 border border-white/5'
                  }`}
                >
                  {slot}h
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 4. Selector de Ubicación / Zona */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-white/75 font-medium flex items-center gap-1.5">
            <MapPin className={`w-3.5 h-3.5 ${isUrbanBrewery ? 'text-[#F59E0B]' : 'text-[#C85A32]'}`} />
            <span>{copy.zoneLabel}</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {zoneChoices.map((choice) => (
              <button
                key={choice.id}
                type="button"
                onClick={() => setZona(choice.label)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  zona === choice.label
                    ? isUrbanBrewery
                      ? 'bg-[#F59E0B]/20 border border-[#F59E0B] text-white font-semibold'
                      : 'bg-[#C85A32]/20 border border-[#C85A32] text-white font-semibold'
                    : 'bg-white/5 border border-white/10 text-white/65 hover:bg-white/10'
                }`}
              >
                {choice.label}
              </button>
            ))}
          </div>
        </div>

        {/* 5. Notas de Alérgenos */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-white/75 font-medium flex items-center gap-1.5">
            <AlertCircle className={`w-3.5 h-3.5 ${isUrbanBrewery ? 'text-[#F59E0B]' : 'text-[#C85A32]'}`} />
            <span>{copy.notesLabel}</span>
          </label>
          <input
            type="text"
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            placeholder={copy.notesPlaceholder}
            className={`w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-white/30 focus:outline-none transition-colors ${accentBorderFocus}`}
          />
        </div>

        {/* Botones de Acción */}
        <div className="flex flex-col gap-2 pt-2 border-t border-white/10">
          <button
            type="button"
            onClick={handleWhatsAppRedirect}
            className={`w-full py-3.5 px-4 rounded-xl active:scale-[0.99] font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg transition-all ${
              isUrbanBrewery
                ? 'bg-[#F59E0B] hover:bg-[#D97706] text-[#0A0B0E] shadow-[#F59E0B]/20'
                : 'bg-[#25D366] hover:bg-[#20ba59] text-[#0A2612] shadow-[#25D366]/20'
            }`}
          >
            <MessageCircle className="w-5 h-5" />
            <span>{copy.sendBtn}</span>
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className="w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 active:scale-[0.99] border border-white/10 text-white/80 font-medium text-xs flex items-center justify-center gap-2 transition-all"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-[#25D366]" />
                <span className="text-[#25D366]">{copy.copiedBtn}</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-white/60" />
                <span>{copy.copyBtn}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
