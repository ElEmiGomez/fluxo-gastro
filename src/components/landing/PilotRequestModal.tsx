'use client'

import React, { useState } from 'react'
import {
  X,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  Phone,
  Store,
  User,
  Briefcase,
  MapPin,
  LocateFixed,
  Layers,
  Send,
  Loader2,
  ArrowRight,
  MessageSquare,
  Globe
} from 'lucide-react'
import { FluxoLogo } from '@/components/common/FluxoLogo'

const POPULAR_LOCATIONS = {
  espana: [
    'Noia / Barbanza (A Coruña)',
    'Santiago de Compostela (A Coruña)',
    'A Coruña Capital',
    'Vigo (Pontevedra)',
    'Pontevedra Capital',
    'Ourense Capital',
    'Lugo Capital',
    'Ferrol (A Coruña)',
    'Ribeira (A Coruña)',
    'Vilagarcía de Arousa (Pontevedra)',
    'Madrid (Comunidad de Madrid)',
    'Barcelona (Cataluña)',
    'Valencia (Comunidad Valenciana)',
    'Sevilla (Andalucía)',
    'Málaga / Costa del Sol (Andalucía)',
    'Bilbao / Vizcaya (País Vasco)',
    'San Sebastián / Donostia (País Vasco)',
    'Palma de Mallorca (Baleares)',
    'Ibiza (Baleares)',
    'Las Palmas de Gran Canaria (Canarias)',
    'Santa Cruz de Tenerife (Canarias)',
    'Zaragoza (Aragón)',
    'Alicante (Comunidad Valenciana)',
    'Murcia Capital',
    'Granada (Andalucía)',
    'Córdoba Capital (Andalucía)',
    'Cádiz / Jerez (Andalucía)',
    'Gijón / Oviedo (Asturias)',
    'Santander (Cantabria)',
    'Valladolid (Castilla y León)',
    'Salamanca (Castilla y León)',
    'Toledo (Castilla-La Mancha)',
    'Pamplona (Navarra)',
    'Logroño (La Rioja)',
    'Badajoz / Mérida (Extremadura)'
  ],
  argentina: [
    'Buenos Aires - CABA',
    'Buenos Aires - Gran Buenos Aires (GBA)',
    'Buenos Aires - Mar del Plata',
    'Buenos Aires - La Plata',
    'Buenos Aires - Bahía Blanca / Tandil',
    'Córdoba - Córdoba Capital',
    'Córdoba - Río Cuarto',
    'Córdoba - Villa Carlos Paz',
    'Córdoba - Villa María',
    'Santa Fe - Rosario',
    'Santa Fe - Santa Fe Capital',
    'Santa Fe - Rafaela',
    'Mendoza - Gran Mendoza',
    'Mendoza - San Rafael',
    'Tucumán - San Miguel de Tucumán',
    'Salta - Salta Capital',
    'Neuquén - Neuquén Capital',
    'Río Negro - Bariloche',
    'San Juan - San Juan Capital',
    'Entre Ríos - Paraná / Concordia',
    'Corrientes - Corrientes Capital',
    'Misiones - Posadas / Iguazú',
    'Chaco - Resistencia',
    'Santiago del Estero Capital',
    'Chubut - Puerto Madryn / Comodoro Rivadavia',
    'Tierra del Fuego - Ushuaia'
  ]
}

interface PilotRequestModalProps {
  isOpen: boolean
  onClose: () => void
  initialPlan?: string
  whatsAppPhone?: string
}

export function PilotRequestModal({
  isOpen,
  onClose,
  initialPlan = 'Plan Full (Recomendado)',
  whatsAppPhone = '5493585187430'
}: PilotRequestModalProps) {
  const [restaurantName, setRestaurantName] = useState('')
  const [contactName, setContactName] = useState('')
  const [contactRole, setContactRole] = useState('')
  const [phone, setPhone] = useState('')
  const [location, setLocation] = useState('Noia / Barbanza (A Coruña)')
  const [selectedPlan, setSelectedPlan] = useState(initialPlan)
  const [notes, setNotes] = useState('')
  const [isDetectingLocation, setIsDetectingLocation] = useState(false)
  const [locationStatus, setLocationStatus] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!restaurantName.trim() || !contactName.trim() || !phone.trim()) {
      setErrorMessage('Por favor completa el nombre de tu restaurante, tu nombre y teléfono.')
      return
    }

    setIsSubmitting(true)

    try {
      const res = await fetch('/api/pilots/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantName,
          contactName,
          contactRole,
          phone,
          location,
          selectedPlan,
          notes
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Ocurrió un error al enviar la solicitud.')
      }

      setIsSuccess(true)
    } catch (err: any) {
      setErrorMessage(err.message || 'Error de conexión. Puedes escribirnos directamente por WhatsApp.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Acepta única y exclusivamente números
    const numericValue = e.target.value.replace(/\D/g, '')
    setPhone(numericValue)
  }

  const handlePhoneKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Bloquear cualquier carácter no numérico en teclado físico de PC
    const allowedKeys = [
      'Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter', 'Home', 'End'
    ]
    if (!allowedKeys.includes(e.key) && !/^\d$/.test(e.key) && !e.ctrlKey && !e.metaKey) {
      e.preventDefault()
    }
  }

  const handleDetectLocation = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setLocationStatus('Geolocalización no soportada en este navegador.')
      return
    }

    setIsDetectingLocation(true)
    setLocationStatus('Detectando tu ubicación por GPS...')

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`,
            { headers: { 'Accept-Language': 'es' } }
          )
          const data = await res.json()
          const city = data.address?.city || data.address?.town || data.address?.village || data.address?.municipality || data.address?.county
          const state = data.address?.state || data.address?.province
          const country = data.address?.country

          const parts = [city, state, country].filter(Boolean)
          const detected = parts.join(', ')

          if (detected) {
            setLocation(detected)
            setLocationStatus(`Ubicación detectada: ${detected}`)
          } else {
            setLocationStatus('Ubicación detectada (coordenadas aproximadas).')
          }
        } catch {
          setLocationStatus('No se pudo obtener el nombre exacto de la localidad.')
        } finally {
          setIsDetectingLocation(false)
        }
      },
      () => {
        setIsDetectingLocation(false)
        setLocationStatus('Permiso de GPS no concedido. Selecciona tu zona del menú.')
      },
      { timeout: 8000, enableHighAccuracy: false }
    )
  }

  const handleOpenWhatsAppDirect = () => {
    const roleText = contactRole ? ` (${contactRole})` : ''
    const text = encodeURIComponent(
      '¡Hola! Solicité el Piloto Gratuito de 14 Días para ' + (restaurantName || 'mi restaurante') + ' (' + selectedPlan + '). Mi nombre es ' + (contactName || '') + roleText + ' (' + (phone || '') + ').'
    )
    window.open('https://wa.me/' + whatsAppPhone + '?text=' + text, '_blank')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-250 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera del Modal */}
        <div className="relative p-6 sm:p-8 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border-b border-slate-800 flex items-start justify-between">
          <div className="space-y-1.5 pr-8">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-black uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>14 DÍAS DE PRUEBA A 0€</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Solicitar Piloto para tu Restaurante
            </h3>
            <p className="text-xs sm:text-sm text-slate-300">
              Digitalizamos tu carta y te dejamos el sistema listo para operar en menos de 24h.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido del Modal */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6">
          {isSuccess ? (
            /* Pantalla de Éxito */
            <div className="text-center py-6 space-y-5 animate-in fade-in zoom-in-95">
              <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h4 className="text-2xl font-black text-white">¡Solicitud Registrada con Éxito!</h4>
                <p className="text-sm text-slate-300 max-w-md mx-auto">
                  Gracias <strong className="text-white">{contactName}</strong>. Hemos recibido los datos de <strong className="text-white">{restaurantName}</strong> para el <strong className="text-cyan-400">{selectedPlan}</strong>.
                </p>
              </div>

              <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-4 text-left space-y-2.5 max-w-md mx-auto text-xs text-slate-300">
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>¿Qué sucederá a continuación?</span>
                </div>
                <ul className="space-y-1.5 list-disc list-inside text-slate-300 pl-1">
                  <li>Un asesor técnico de Fluxo te contactará al teléfono <strong>{phone}</strong> en menos de 2 horas.</li>
                  <li>Nos envías una foto o PDF de tu carta actual y la cargamos completa.</li>
                  <li>Iniciamos los 14 días de prueba a 0€ sin tocar tu TPV ni pedir tarjeta.</li>
                </ul>
              </div>

              <div className="pt-3 flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs sm:text-sm font-bold transition-colors cursor-pointer"
                >
                  Entendido, cerrar
                </button>
                <button
                  type="button"
                  onClick={handleOpenWhatsAppDirect}
                  className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-colors shadow-lg shadow-emerald-600/30 cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>¿Tienes prisa? Abrir WhatsApp</span>
                </button>
              </div>
            </div>
          ) : (
            /* Formulario */
            <form onSubmit={handleSubmit} className="space-y-5">
              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-semibold">
                  {errorMessage}
                </div>
              )}

              {/* 1. Nombre del Restaurante */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Nombre del Restaurante / Bar / Local *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Store className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Tapería Casco Antigo, Burger Gourmet..."
                    value={restaurantName}
                    onChange={(e) => setRestaurantName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 2. Persona de Contacto */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Tu Nombre *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Manuel, Lucía..."
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                    />
                  </div>
                </div>

                {/* 3. Cargo / Puesto */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Cargo / Puesto
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <Briefcase className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      placeholder="Ej: Dueño, Encargado, Maitre..."
                      value={contactRole}
                      onChange={(e) => setContactRole(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* 4. Teléfono & Población */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Teléfono / WhatsApp de Contacto *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <Phone className="w-4 h-4" />
                    </div>
                    <input
                      type="tel"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      required
                      placeholder="Ej: 612345678 o 3585187430"
                      value={phone}
                      onChange={handlePhoneChange}
                      onKeyDown={handlePhoneKeyDown}
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400">Solo números, sin guiones ni espacios.</p>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Población / Zona
                    </label>
                    <button
                      type="button"
                      onClick={handleDetectLocation}
                      disabled={isDetectingLocation}
                      className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                      title="Detectar ubicación actual mediante GPS"
                    >
                      <LocateFixed className={`w-3.5 h-3.5 ${isDetectingLocation ? 'animate-spin text-cyan-300' : ''}`} />
                      <span>{isDetectingLocation ? 'Detectando...' : 'Detectar GPS'}</span>
                    </button>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      list="locations-autocomplete"
                      placeholder="Escribe o selecciona tu zona..."
                      value={location}
                      onChange={(e) => {
                        setLocation(e.target.value)
                        setLocationStatus(null)
                      }}
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                    />
                    <datalist id="locations-autocomplete">
                      {[...POPULAR_LOCATIONS.espana, ...POPULAR_LOCATIONS.argentina].map((loc) => (
                        <option key={loc} value={loc} />
                      ))}
                    </datalist>
                  </div>

                  {/* Menú selector rápido de ubicaciones de España y Argentina */}
                  <select
                    value={POPULAR_LOCATIONS.espana.includes(location) || POPULAR_LOCATIONS.argentina.includes(location) ? location : 'custom'}
                    onChange={(e) => {
                      if (e.target.value !== 'custom') {
                        setLocation(e.target.value)
                        setLocationStatus(null)
                      }
                    }}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-800/90 border border-slate-700/80 text-[11px] text-slate-300 focus:outline-none focus:border-cyan-500 transition-colors cursor-pointer"
                  >
                    <option value="custom">📍 Menú de Ciudades (España / Argentina)</option>
                    <optgroup label="🇪🇸 España">
                      {POPULAR_LOCATIONS.espana.map((loc) => (
                        <option key={loc} value={loc}>
                          {loc}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="🇦🇷 Argentina">
                      {POPULAR_LOCATIONS.argentina.map((loc) => (
                        <option key={loc} value={loc}>
                          {loc}
                        </option>
                      ))}
                    </optgroup>
                  </select>

                  {locationStatus && (
                    <p className="text-[11px] text-cyan-400 font-medium flex items-center gap-1 animate-in fade-in">
                      <span>{locationStatus}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* 5. Selector de Plan */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Plan Deseado para el Piloto
                </label>
                <select
                  value={selectedPlan}
                  onChange={(e) => setSelectedPlan(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                >
                  <option value="Plan Carta (39€)">Plan Carta (39€/mes) — Carta QR</option>
                  <option value="Plan Sala (69€)">Plan Sala (69€/mes) — Comandero Mozo</option>
                  <option value="Plan Full (Recomendado)">Plan Full (99€/mes) — Circuito Completo</option>
                </select>
              </div>

              {/* 6. Comentarios o enlace a carta */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Enlace a tu carta actual o comentarios (Opcional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Instagram, web o detalles de tu local (número de mesas, terraza...)"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors resize-none"
                />
              </div>

              {/* Garantías de Confianza */}
              <div className="p-3.5 rounded-2xl bg-slate-800/40 border border-slate-700/60 flex items-center justify-between text-xs text-slate-300">
                <span className="flex items-center gap-1.5 font-semibold text-emerald-400">
                  <ShieldCheck className="w-4 h-4" /> 0€ durante 14 días
                </span>
                <span className="text-slate-400">&bull;</span>
                <span>Sin permanencia</span>
                <span className="text-slate-400">&bull;</span>
                <span>Setup incluido</span>
              </div>

              {/* Botón de Envío Principal */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 px-6 rounded-xl font-black text-sm text-slate-950 bg-cyan-400 hover:bg-cyan-300 shadow-xl shadow-cyan-500/25 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Registrando solicitud...</span>
                  </>
                ) : (
                  <>
                    <span>SOLICITAR PILOTO DE 14 DÍAS (0€)</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
