'use client'

import React, { useEffect, useRef, useState, useMemo } from 'react'
import {
  MapPin,
  ExternalLink,
  MessageCircle,
  Phone,
  Clock,
  DollarSign,
  Star,
  X,
  Compass,
  Layers,
  Sparkles,
  ChevronRight,
  TrendingUp,
  Tag
} from 'lucide-react'
import { CRMLead, CRMPlan, CRMStatus } from '@/types/crm.types'
import { PLAN_PRICING } from '@/types/crm.types'
import { getLeadCoordinates, NOIA_CENTER_COORDINATES } from '@/lib/crm/geo-utils'

interface CRMMapProps {
  leads: CRMLead[]
  onOpenDetail: (lead: CRMLead) => void
}

const STATUS_COLOR_CONFIG: Record<
  CRMStatus,
  { label: string; pinBg: string; border: string; text: string; ringColor: string }
> = {
  lead_por_visitar: {
    label: 'Por Visitar',
    pinBg: '#334155', // Slate-700
    border: '#64748b',
    text: '#f1f5f9',
    ringColor: 'rgba(100, 116, 139, 0.4)',
  },
  contactado: {
    label: 'Contactado',
    pinBg: '#1d4ed8', // Blue-700
    border: '#60a5fa',
    text: '#ffffff',
    ringColor: 'rgba(59, 130, 246, 0.4)',
  },
  piloto_14_dias: {
    label: 'Piloto (14 Días)',
    pinBg: '#f59e0b', // Amber-500
    border: '#fef3c7',
    text: '#0f172a',
    ringColor: 'rgba(245, 158, 11, 0.6)',
  },
  en_negociacion: {
    label: 'En Negociación',
    pinBg: '#7e22ce', // Purple-700
    border: '#c084fc',
    text: '#ffffff',
    ringColor: 'rgba(168, 85, 247, 0.4)',
  },
  ganado: {
    label: 'Ganado (Cliente)',
    pinBg: '#10b981', // Emerald-500
    border: '#a7f3d0',
    text: '#064e3b',
    ringColor: 'rgba(16, 185, 129, 0.6)',
  },
  perdido: {
    label: 'Perdido',
    pinBg: '#9f1239', // Rose-800
    border: '#fb7185',
    text: '#ffffff',
    ringColor: 'rgba(244, 63, 94, 0.4)',
  },
}

export function CRMMap({ leads, onOpenDetail }: CRMMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersLayerRef = useRef<any>(null)
  const [selectedLead, setSelectedLead] = useState<CRMLead | null>(null)
  const [mapLoaded, setMapLoaded] = useState<boolean>(false)
  const [mapStyle, setMapStyle] = useState<'dark' | 'voyager'>('dark')

  // Calcular días de piloto si aplica
  const pilotDays = useMemo(() => {
    if (!selectedLead || selectedLead.status !== 'piloto_14_dias' || !selectedLead.pilot_start_date) {
      return null
    }
    const start = new Date(selectedLead.pilot_start_date).getTime()
    const diff = Math.max(1, Math.floor((Date.now() - start) / 86400000) + 1)
    return {
      day: Math.min(diff, 14),
      remaining: Math.max(0, 14 - Math.min(diff, 14)),
      percent: Math.min(100, Math.round((diff / 14) * 100)),
    }
  }, [selectedLead])

  // 1. Inicialización de Leaflet de forma segura en navegador (Next.js client-only)
  useEffect(() => {
    let isMounted = true

    if (typeof window === 'undefined') return

    Promise.all([
      import('leaflet'),
      // @ts-ignore
      import('leaflet/dist/leaflet.css')
    ]).then(([leafletModule]) => {
      if (!isMounted || !mapContainerRef.current) return

      const L = leafletModule.default || leafletModule

      // Evitar doble inicialización
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
      }

      const map = L.map(mapContainerRef.current, {
        center: [NOIA_CENTER_COORDINATES.lat, NOIA_CENTER_COORDINATES.lng],
        zoom: NOIA_CENTER_COORDINATES.zoom,
        zoomControl: false,
        attributionControl: false,
      })

      // Controles de zoom abajo a la derecha
      L.control.zoom({ position: 'bottomright' }).addTo(map)

      // Capa de teselas (CartoDB Dark Matter para modo oscuro ejecutivo)
      const tileUrl = mapStyle === 'dark'
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'

      L.tileLayer(tileUrl, {
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map)

      const markersGroup = L.layerGroup().addTo(map)
      markersLayerRef.current = markersGroup
      mapInstanceRef.current = map

      setMapLoaded(true)
    })

    return () => {
      isMounted = false
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [mapStyle])

  // 2. Renderizado reactivo de marcadores cuando cambian los leads o el lead seleccionado
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current || !markersLayerRef.current) return

    import('leaflet').then((leafletModule) => {
      const L = leafletModule.default || leafletModule
      const markersGroup = markersLayerRef.current
      markersGroup.clearLayers()

      leads.forEach((lead) => {
        const coords = getLeadCoordinates(lead)
        const isSelected = selectedLead?.id === lead.id
        const conf = STATUS_COLOR_CONFIG[lead.status] || STATUS_COLOR_CONFIG.lead_por_visitar

        // Crear icono HTML personalizado de alto contraste
        const markerHtml = `
          <div style="
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            width: ${isSelected ? '38px' : '30px'};
            height: ${isSelected ? '38px' : '30px'};
            border-radius: 50%;
            background-color: ${conf.pinBg};
            border: ${isSelected ? '3px solid #38bdf8' : `2px solid ${conf.border}`};
            box-shadow: 0 4px 12px ${conf.ringColor};
            color: ${conf.text};
            font-size: ${isSelected ? '12px' : '10px'};
            font-weight: 800;
            cursor: pointer;
            transition: all 0.2s ease;
            transform: ${isSelected ? 'scale(1.15)' : 'scale(1)'};
            z-index: ${isSelected ? '9999' : '100'};
          ">
            <span>${lead.score}</span>
            ${
              lead.status === 'piloto_14_dias'
                ? '<div style="position: absolute; top: -2px; right: -2px; width: 8px; height: 8px; border-radius: 50%; background-color: #f59e0b; border: 1.5px solid #ffffff;"></div>'
                : ''
            }
          </div>
        `

        const customIcon = L.divIcon({
          html: markerHtml,
          className: 'custom-crm-pin',
          iconSize: [isSelected ? 38 : 30, isSelected ? 38 : 30],
          iconAnchor: [isSelected ? 19 : 15, isSelected ? 19 : 15],
        })

        const marker = L.marker([coords.lat, coords.lng], { icon: customIcon })

        marker.on('click', () => {
          setSelectedLead(lead)
          if (mapInstanceRef.current) {
            mapInstanceRef.current.panTo([coords.lat, coords.lng], { animate: true, duration: 0.5 })
          }
        })

        marker.addTo(markersGroup)
      })
    })
  }, [leads, selectedLead, mapLoaded])

  const handleResetCenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView(
        [NOIA_CENTER_COORDINATES.lat, NOIA_CENTER_COORDINATES.lng],
        NOIA_CENTER_COORDINATES.zoom,
        { animate: true }
      )
    }
  }

  // Generar URL directa de navegación GPS
  const getGoogleNavigationUrl = (lead: CRMLead) => {
    const coords = getLeadCoordinates(lead)
    return `https://www.google.com/maps/dir/?api=1&destination=${coords.lat},${coords.lng}&query=${encodeURIComponent(
      lead.name + ' Noia'
    )}`
  }

  // Generar URL directa de WhatsApp
  const getWhatsAppUrl = (lead: CRMLead) => {
    const phone = (lead.contact_whatsapp || lead.contact_phone || '').replace(/\D/g, '')
    if (!phone) return null
    const cleanNumber = phone.startsWith('34') ? phone : `34${phone}`
    const text = encodeURIComponent(
      `Hola ${lead.contact_name || ''}, te contacto desde Fluxo en Noia para compartirte la carta digital interactiva que hemos preparado para ${lead.name}. ¿Tienes 2 minutos para verla?`
    )
    return `https://wa.me/${cleanNumber}?text=${text}`
  }

  return (
    <div className="relative w-full h-[72vh] min-h-[500px] rounded-3xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl flex flex-col select-none">
      {/* Contenedor del Mapa Leaflet */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* 1. Barra Superior de Control del Mapa */}
      <div className="absolute top-3 left-3 right-3 sm:right-auto z-20 flex items-center gap-2 flex-wrap pointer-events-auto">
        <div className="px-3.5 py-1.5 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-800 text-xs font-semibold text-white flex items-center gap-2 shadow-lg">
          <MapPin className="w-4 h-4 text-blue-400 shrink-0" />
          <span>{leads.length} locales geolocalizados en Noia</span>
        </div>

        <button
          onClick={handleResetCenter}
          title="Centrar mapa en Noia"
          className="px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 backdrop-blur-md border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5 shadow-lg transition active:scale-95 touch-manipulation"
        >
          <Compass className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline">Centrar Noia</span>
        </button>

        <button
          onClick={() => setMapStyle(mapStyle === 'dark' ? 'voyager' : 'dark')}
          title="Cambiar estilo de mapa"
          className="px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 backdrop-blur-md border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5 shadow-lg transition active:scale-95 touch-manipulation"
        >
          <Layers className="w-3.5 h-3.5 text-purple-400" />
          <span className="hidden sm:inline">{mapStyle === 'dark' ? 'Modo Contraste' : 'Modo Oscuro'}</span>
        </button>
      </div>

      {/* 2. Leyenda Rápida de Estados (Esquina Inferior Izquierda) */}
      <div className="hidden md:flex absolute bottom-3 left-3 z-20 px-3 py-2 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-800 text-[10px] text-slate-300 items-center gap-3 shadow-lg pointer-events-auto">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
          <span>Por Visitar</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
          <span>Contactado</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
          <span>Piloto (14D)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span>Ganado</span>
        </div>
      </div>

      {/* 3. FICHA DETALLADA DEL LOCAL SELECCIONADO (Popover Flotante / Drawer Móvil) */}
      {selectedLead && (
        <div className="absolute z-30 bottom-3 left-3 right-3 sm:right-auto sm:top-14 sm:bottom-auto sm:w-96 rounded-2xl bg-slate-900/95 border border-slate-700/80 backdrop-blur-xl shadow-2xl p-4 sm:p-5 text-white animate-in slide-in-from-bottom-4 duration-200 pointer-events-auto max-h-[75vh] overflow-y-auto">
          {/* Cabecera de la Ficha */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap mb-1">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  {selectedLead.icp_segment}
                </span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-0.5">
                  ★ Score {selectedLead.score}/10
                </span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                  {selectedLead.zone}
                </span>
              </div>
              <h3 className="font-bold text-base text-white truncate">{selectedLead.name}</h3>
              <p className="text-xs text-slate-400 truncate">{selectedLead.address}</p>
            </div>

            <button
              onClick={() => setSelectedLead(null)}
              className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition shrink-0"
              title="Cerrar ficha"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Estado Comercial y MRR */}
          <div className="mt-3 p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{
                  backgroundColor:
                    STATUS_COLOR_CONFIG[selectedLead.status]?.pinBg || '#334155',
                }}
              />
              <span className="font-semibold text-slate-200">
                {STATUS_COLOR_CONFIG[selectedLead.status]?.label || selectedLead.status}
              </span>
            </div>

            <div className="font-mono text-emerald-400 font-bold">
              {selectedLead.mrr_projected || PLAN_PRICING[selectedLead.target_plan] || 39} €/mes
            </div>
          </div>

          {/* Progreso de Piloto (Si está en piloto) */}
          {pilotDays && (
            <div className="mt-2.5 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs">
              <div className="flex items-center justify-between text-amber-300 text-[11px] font-bold mb-1">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  Día {pilotDays.day} de 14
                </span>
                <span>{pilotDays.remaining} días restantes</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-amber-400 h-full rounded-full transition-all duration-300"
                  style={{ width: `${pilotDays.percent}%` }}
                />
              </div>
            </div>
          )}

          {/* Notas de Visita / Puntos de Dolor */}
          {selectedLead.notes && (
            <div className="mt-2.5 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-300 leading-relaxed max-h-24 overflow-y-auto">
              <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-0.5">
                Puntos de Dolor / Historial
              </div>
              {selectedLead.notes}
            </div>
          )}

          {/* Acciones Inmediatas (GPS, WhatsApp, Llamar, Abrir Ficha) */}
          <div className="mt-3.5 pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2">
            <a
              href={getGoogleNavigationUrl(selectedLead)}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition active:scale-95 touch-manipulation"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Cómo llegar</span>
            </a>

            {getWhatsAppUrl(selectedLead) ? (
              <a
                href={getWhatsAppUrl(selectedLead)!}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition active:scale-95 touch-manipulation"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </a>
            ) : selectedLead.contact_phone ? (
              <a
                href={`tel:${selectedLead.contact_phone}`}
                className="px-3 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition active:scale-95 touch-manipulation"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Llamar</span>
              </a>
            ) : null}

            <button
              onClick={() => onOpenDetail(selectedLead)}
              className="col-span-2 px-3 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold transition shadow-md shadow-blue-600/25 flex items-center justify-center gap-1.5 active:scale-95 touch-manipulation"
            >
              <span>Gestionar Ficha Completa</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
