'use client'

import React, { useState } from 'react'
import { X, MessageCircle, Copy, Check, Users, Calendar, Clock, MapPin, AlertCircle } from 'lucide-react'
import type { SpaceAmbienceItem } from '@/types/gastronomic-web.types'

interface WhatsAppReservationDrawerProps {
  restaurantName: string
  whatsappNumber: string
  ambiences: SpaceAmbienceItem[]
  isOpen: boolean
  onClose: () => void
  initialZone?: string
}

export function WhatsAppReservationDrawer({
  restaurantName,
  whatsappNumber,
  ambiences,
  isOpen,
  onClose,
  initialZone,
}: WhatsAppReservationDrawerProps) {
  const [comensales, setComensales] = useState<number>(2)
  const [fecha, setFecha] = useState<string>(() => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toISOString().split('T')[0]
  })
  const [turno, setTurno] = useState<'almuerzo' | 'cena'>('cena')
  const [hora, setHora] = useState<string>('21:00')
  const [zona, setZona] = useState<string>(initialZone || ambiences[0]?.name || 'Salón Principal')
  const [notas, setNotas] = useState<string>('')
  const [nombre, setNombre] = useState<string>('')
  const [copied, setCopied] = useState<boolean>(false)

  if (!isOpen) return null

  // Construcción del mensaje estructurado según estándar Rodrigo Olivares
  const buildMessage = () => {
    let msg = `Hola ${restaurantName}, quisiera solicitar una reserva:\n`
    msg += `• Nombre: ${nombre.trim() || 'Reserva a confirmar'}\n`
    msg += `• Fecha y Turno: ${fecha} (${turno === 'almuerzo' ? 'Almuerzo' : 'Cena'} a las ${hora} hs)\n`
    msg += `• Comensales: ${comensales} personas\n`
    msg += `• Ubicación / Zona: ${zona}\n`
    if (notas.trim()) {
      msg += `• Notas / Alérgenos: ${notas.trim()}\n`
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
      // Fallback si clipboard API no está autorizada
      setCopied(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="reservation-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        className="w-full max-w-lg bg-[#0E1013] text-[#F5F5F3] border-t sm:border border-white/10 rounded-t-3xl sm:rounded-2xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl flex flex-col gap-5"
      >
        {/* Encabezado del modal */}
        <div className="flex items-start justify-between border-b border-white/10 pb-4">
          <div>
            <span className="text-[11px] uppercase tracking-wider text-[#C85A32] font-semibold">
              Reserva Directa sin Comisiones
            </span>
            <h3 id="reservation-title" className="text-xl font-serif text-white mt-0.5">
              Solicitar Mesa en {restaurantName}
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar modal de reserva"
            className="p-2 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. Nombre */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-white/70 font-medium">Nombre de contacto</label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Tu nombre y apellido"
            className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#C85A32] transition-colors"
          />
        </div>

        {/* 2. Selector rápido de Comensales */}
        <div className="flex flex-col gap-2">
          <label className="text-xs text-white/70 font-medium flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-[#C85A32]" />
            <span>Número de personas</span>
          </label>
          <div className="grid grid-cols-5 gap-2">
            {[2, 4, 6, 8, 10].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => setComensales(num)}
                className={`py-2 px-1 rounded-xl text-sm font-semibold transition-all ${
                  comensales === num
                    ? 'bg-[#C85A32] text-white shadow-md shadow-[#C85A32]/30'
                    : 'bg-white/5 text-white/70 hover:bg-white/10 border border-white/5'
                }`}
              >
                {num === 10 ? '+8' : `${num}`}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Fecha y Turno */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-white/70 font-medium flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#C85A32]" />
              <span>Fecha</span>
            </label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-[#C85A32] transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-white/70 font-medium flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#C85A32]" />
              <span>Turno y Hora</span>
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setTurno('almuerzo')
                  setHora('14:00')
                }}
                className={`py-2 rounded-xl text-xs font-semibold transition-all ${
                  turno === 'almuerzo'
                    ? 'bg-white/20 text-white border border-white/30'
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                Almuerzo
              </button>
              <button
                type="button"
                onClick={() => {
                  setTurno('cena')
                  setHora('21:00')
                }}
                className={`py-2 rounded-xl text-xs font-semibold transition-all ${
                  turno === 'cena'
                    ? 'bg-white/20 text-white border border-white/30'
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                Cena
              </button>
            </div>
          </div>
        </div>

        {/* 4. Selector de Ubicación / Zona */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-white/70 font-medium flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-[#C85A32]" />
            <span>Zona o Experiencia</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {ambiences.map((amb) => (
              <button
                key={amb.id}
                type="button"
                onClick={() => setZona(amb.name)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  zona === amb.name
                    ? 'bg-[#C85A32]/20 border border-[#C85A32] text-white font-semibold'
                    : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10'
                }`}
              >
                {amb.name}
              </button>
            ))}
          </div>
        </div>

        {/* 5. Notas de Alérgenos */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-white/70 font-medium flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-[#C85A32]" />
            <span>Notas de alérgenos o peticiones especiales (opcional)</span>
          </label>
          <input
            type="text"
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            placeholder="Ej. 1 persona celíaca, mesa con carrito de bebé..."
            className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#C85A32] transition-colors"
          />
        </div>

        {/* Botones de Acción */}
        <div className="flex flex-col gap-2 pt-2 border-t border-white/10">
          <button
            onClick={handleWhatsAppRedirect}
            className="w-full py-3.5 px-4 rounded-xl bg-[#25D366] hover:bg-[#20ba59] active:scale-[0.99] text-[#0A2612] font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#25D366]/20 transition-all"
          >
            <MessageCircle className="w-5 h-5 fill-current" />
            <span>Enviar Reserva por WhatsApp</span>
          </button>

          <button
            onClick={handleCopy}
            className="w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 active:scale-[0.99] border border-white/10 text-white/80 font-medium text-xs flex items-center justify-center gap-2 transition-all"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-[#25D366]" />
                <span className="text-[#25D366]">Mensaje copiado al portapapeles</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-white/60" />
                <span>Copiar mensaje al portapapeles (Respaldo)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
