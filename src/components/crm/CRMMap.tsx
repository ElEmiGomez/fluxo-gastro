'use client'

import React, { useEffect, useRef, useState, useMemo } from 'react'
import {
  MapPin,
  ExternalLink,
  MessageCircle,
  Clock,
  DollarSign,
  Star,
  X,
  Compass,
  Layers,
  Sparkles,
  ChevronRight,
  TrendingUp,
  Tag,
  Eye,
  Route,
  Navigation,
  ArrowUp,
  ArrowDown,
  Trash2,
  Wand2,
  Plus,
  Check
} from 'lucide-react'
import { CRMLead, CRMPlan, CRMStatus, POS_SYSTEM_CONFIG } from '@/types/crm.types'
import { PLAN_PRICING } from '@/types/crm.types'
import {
  getLeadCoordinates,
  NOIA_CENTER_COORDINATES,
  optimizeVisitRoute,
  calculateRouteStats,
  buildGoogleMapsWalkingRouteUrl,
} from '@/lib/crm/geo-utils'

interface CRMMapProps {
  leads: CRMLead[]
  availableCities?: string[]
  selectedCity?: string
  cityCounts?: Record<string, number>
  onSelectCity?: (city: string) => void
  onOpenDetail: (lead: CRMLead) => void
}

type MapTheme = 'dark' | 'streets' | 'satellite'

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

export function CRMMap({
  leads,
  availableCities = [],
  selectedCity = 'all',
  cityCounts = {},
  onSelectCity,
  onOpenDetail,
}: CRMMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersLayerRef = useRef<any>(null)
  const routeLayerRef = useRef<any>(null)
  const tileLayerRef = useRef<any>(null)
  const activeTileUrlRef = useRef<string>('')

  const [selectedLead, setSelectedLead] = useState<CRMLead | null>(null)
  const [mapLoaded, setMapLoaded] = useState<boolean>(false)
  const [mapTheme, setMapTheme] = useState<MapTheme>('dark')

  // Estado de Ruta de Visitas (persistido en localStorage)
  const ROUTE_STORAGE_KEY = 'fluxo_crm_visit_route_v1'
  const [routeMode, setRouteMode] = useState<boolean>(false)
  const [routeIds, setRouteIds] = useState<string[]>(() => {
    if (typeof window === 'undefined') return []
    try {
      const saved = JSON.parse(localStorage.getItem(ROUTE_STORAGE_KEY) || '[]')
      return Array.isArray(saved) ? saved.filter((id) => typeof id === 'string') : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem(ROUTE_STORAGE_KEY, JSON.stringify(routeIds))
    } catch {
      // ignore
    }
  }, [routeIds])

  const routeLeads = useMemo(() => {
    const byId = new Map(leads.map((l) => [l.id, l]))
    return routeIds.map((id) => byId.get(id)).filter((l): l is CRMLead => Boolean(l))
  }, [leads, routeIds])

  const routeIndexById = useMemo(() => {
    const map = new Map<string, number>()
    routeLeads.forEach((l, idx) => map.set(l.id, idx + 1))
    return map
  }, [routeLeads])

  const routeStats = useMemo(() => calculateRouteStats(routeLeads), [routeLeads])
  const routeMapsUrl = useMemo(() => buildGoogleMapsWalkingRouteUrl(routeLeads), [routeLeads])

  const toggleLeadInRoute = (leadId: string) => {
    setRouteIds((prev) =>
      prev.includes(leadId) ? prev.filter((id) => id !== leadId) : [...prev, leadId]
    )
  }

  const moveRouteStop = (index: number, direction: -1 | 1) => {
    const targetIdx = index + direction
    if (targetIdx < 0 || targetIdx >= routeLeads.length) return
    const nextOrder = routeLeads.map((l) => l.id)
    const [moved] = nextOrder.splice(index, 1)
    nextOrder.splice(targetIdx, 0, moved)
    // Conservar otros IDs de otras ciudades al final si existen
    const visibleSet = new Set(nextOrder)
    const hiddenIds = routeIds.filter((id) => !visibleSet.has(id))
    setRouteIds([...nextOrder, ...hiddenIds])
  }

  const handleOptimizeRoute = () => {
    if (routeLeads.length <= 2) return
    const optimized = optimizeVisitRoute(routeLeads).map((l) => l.id)
    const visibleSet = new Set(optimized)
    const hiddenIds = routeIds.filter((id) => !visibleSet.has(id))
    setRouteIds([...optimized, ...hiddenIds])
  }

  const handleClearVisibleRoute = () => {
    const visibleSet = new Set(routeLeads.map((l) => l.id))
    setRouteIds((prev) => prev.filter((id) => !visibleSet.has(id)))
  }

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

  // Función auxiliar para auto-encuadrar los leads en el mapa
  const fitMapToLeads = (map: any, leadList: CRMLead[], animate = false) => {
    if (!map || leadList.length === 0) return

    import('leaflet').then((leafletModule) => {
      const L = leafletModule.default || leafletModule
      const coords = leadList.map((l) => getLeadCoordinates(l))
      const bounds = L.latLngBounds(coords.map((c) => [c.lat, c.lng]))
      map.fitBounds(bounds, {
        padding: [45, 45],
        maxZoom: 18,
        animate,
      })
    })
  }

  // 1. Inicialización de Leaflet una única vez (evita recreación innecesaria del mapa)
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

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
      }

      const map = L.map(mapContainerRef.current, {
        center: [NOIA_CENTER_COORDINATES.lat, NOIA_CENTER_COORDINATES.lng],
        zoom: NOIA_CENTER_COORDINATES.zoom,
        zoomControl: false,
        attributionControl: true,
      })

      // Zoom en la esquina inferior derecha
      L.control.zoom({ position: 'bottomright' }).addTo(map)

      // Capa base de teselas OpenStreetMap oficial (100% libre, sin API key, sin marcas de agua)
      const initialTileUrl = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
      const initialTileLayer = L.tileLayer(initialTileUrl, {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
      }).addTo(map)

      tileLayerRef.current = initialTileLayer
      activeTileUrlRef.current = initialTileUrl

      // Capa de ruta y capa de marcadores
      const routeGroup = L.layerGroup().addTo(map)
      routeLayerRef.current = routeGroup
      const markersGroup = L.layerGroup().addTo(map)
      markersLayerRef.current = markersGroup
      mapInstanceRef.current = map

      // Auto-fit inicial si hay leads
      if (leads.length > 0) {
        fitMapToLeads(map, leads, false)
      }

      // Forzar recálculo del tamaño del contenedor (previene cortes en modales y flexbox)
      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize()
        }
      }, 150)

      setMapLoaded(true)
    })

    return () => {
      isMounted = false
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  // 2. Gestión dinámica del cambio de tema (Noche / Callejero / Satélite) sin desmontar el mapa
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current) return

    import('leaflet').then((leafletModule) => {
      const L = leafletModule.default || leafletModule
      const map = mapInstanceRef.current

      const targetTileUrl =
        mapTheme === 'satellite'
          ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
          : 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'

      const targetAttribution =
        mapTheme === 'satellite'
          ? '&copy; Esri & Maxar'
          : '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>'

      // Solo recreamos la capa de teselas si cambia la URL subyacente
      if (activeTileUrlRef.current !== targetTileUrl) {
        if (tileLayerRef.current) {
          map.removeLayer(tileLayerRef.current)
        }

        const newLayer = L.tileLayer(targetTileUrl, {
          maxZoom: 19,
          attribution: targetAttribution,
        }).addTo(map)

        tileLayerRef.current = newLayer
        activeTileUrlRef.current = targetTileUrl
      }
    })
  }, [mapTheme, mapLoaded])

  // 3. Renderizado reactivo de marcadores al cambiar los leads o el seleccionado
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current || !markersLayerRef.current) return

    import('leaflet').then((leafletModule) => {
      const L = leafletModule.default || leafletModule
      const markersGroup = markersLayerRef.current
      markersGroup.clearLayers()

      leads.forEach((lead) => {
        const coords = getLeadCoordinates(lead)
        const isSelected = selectedLead?.id === lead.id
        const routeOrder = routeIndexById.get(lead.id)
        const isInRoute = typeof routeOrder === 'number'
        const conf = STATUS_COLOR_CONFIG[lead.status] || STATUS_COLOR_CONFIG.lead_por_visitar

        const size = isSelected || isInRoute ? 36 : 30
        const bgColor = isInRoute ? '#0284c7' : conf.pinBg
        const borderStyle = isSelected
          ? '3px solid #38bdf8'
          : isInRoute
            ? '3px solid #ffffff'
            : `2px solid ${conf.border}`
        const shadowStyle = isInRoute
          ? '0 0 0 3px rgba(56, 189, 248, 0.45), 0 6px 16px rgba(2, 132, 199, 0.7)'
          : `0 4px 14px ${isSelected ? '#38bdf8' : conf.ringColor}`

        const markerHtml = `
          <div style="
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            width: ${size}px;
            height: ${size}px;
            border-radius: 50%;
            background-color: ${bgColor};
            border: ${borderStyle};
            box-shadow: ${shadowStyle};
            color: ${isInRoute ? '#ffffff' : conf.text};
            font-size: ${isInRoute ? '13px' : isSelected ? '12px' : '10px'};
            font-weight: 900;
            cursor: pointer;
            transition: transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.18s ease;
            transform: ${isSelected ? 'scale(1.18)' : isInRoute ? 'scale(1.08)' : 'scale(1)'};
            z-index: ${isSelected ? '9999' : isInRoute ? '5000' : '100'};
          ">
            <span>${isInRoute ? routeOrder : lead.score}</span>
            ${
              !isInRoute && lead.status === 'piloto_14_dias'
                ? '<div style="position: absolute; top: -2px; right: -2px; width: 8px; height: 8px; border-radius: 50%; background-color: #f59e0b; border: 1.5px solid #ffffff;"></div>'
                : ''
            }
          </div>
        `

        const customIcon = L.divIcon({
          html: markerHtml,
          className: 'custom-crm-pin',
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
        })

        const marker = L.marker([coords.lat, coords.lng], { icon: customIcon })

        marker.on('click', () => {
          if (routeMode) {
            toggleLeadInRoute(lead.id)
          } else {
            setSelectedLead(lead)
          }
          if (mapInstanceRef.current) {
            mapInstanceRef.current.panTo([coords.lat, coords.lng], { animate: true, duration: 0.35 })
          }
        })

        marker.addTo(markersGroup)
      })
    })
  }, [leads, selectedLead, mapLoaded, routeIndexById, routeMode])

  // 3c. Dibujar la línea de ruta conectando las paradas marcadas en orden
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current || !routeLayerRef.current) return

    import('leaflet').then((leafletModule) => {
      const L = leafletModule.default || leafletModule
      const routeGroup = routeLayerRef.current
      routeGroup.clearLayers()

      if (routeLeads.length < 2) return

      const latLngs = routeLeads.map((l) => {
        const c = getLeadCoordinates(l)
        return [c.lat, c.lng] as [number, number]
      })

      // Halo exterior para contraste en cualquier tema (Noche / Callejero / Satélite)
      L.polyline(latLngs, {
        color: '#0f172a',
        weight: 7,
        opacity: 0.55,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(routeGroup)

      // Línea principal cian de recorrido
      L.polyline(latLngs, {
        color: '#38bdf8',
        weight: 4,
        opacity: 0.95,
        dashArray: '10, 8',
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(routeGroup)
    })
  }, [routeLeads, mapLoaded])

  // 3b. Re-encuadrar el mapa automáticamente al filtrar por ciudad o zona y limpiar selección fuera de filtro
  useEffect(() => {
    if (selectedLead && !leads.some((l) => l.id === selectedLead.id)) {
      setSelectedLead(null)
    }
    if (!mapLoaded || !mapInstanceRef.current || leads.length === 0) return
    fitMapToLeads(mapInstanceRef.current, leads, true)
  }, [leads, mapLoaded, selectedLead])

  // InvalidateSize en redimensionamiento de pantalla
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current) return

    const handleResize = () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize()
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [mapLoaded])

  const handleResetCenter = () => {
    if (mapInstanceRef.current) {
      if (leads.length > 0) {
        fitMapToLeads(mapInstanceRef.current, leads, true)
      } else {
        mapInstanceRef.current.setView(
          [NOIA_CENTER_COORDINATES.lat, NOIA_CENTER_COORDINATES.lng],
          NOIA_CENTER_COORDINATES.zoom,
          { animate: true }
        )
      }
    }
  }

  // Generar URL directa de navegación GPS
  const getGoogleNavigationUrl = (lead: CRMLead) => {
    const coords = getLeadCoordinates(lead)
    return `https://www.google.com/maps/dir/?api=1&destination=${coords.lat},${coords.lng}&query=${encodeURIComponent(
      `${lead.name} ${lead.city || ''}`.trim()
    )}`
  }

  // Generar URL directa de WhatsApp
  const getWhatsAppUrl = (lead: CRMLead) => {
    const phone = (lead.contact_whatsapp || lead.contact_phone || '').replace(/\D/g, '')
    if (!phone) return null
    const cleanNumber = phone.startsWith('34') ? phone : `34${phone}`
    const text = encodeURIComponent(
      `Hola ${lead.contact_name || ''}, te contacto desde Fluxo${lead.city ? ` en ${lead.city}` : ''} para compartirte la carta digital interactiva que hemos preparado para ${lead.name}. ¿Tienes 2 minutos para verla?`
    )
    return `https://wa.me/${cleanNumber}?text=${text}`
  }

  return (
    <div
      className={`relative w-full h-[72vh] min-h-[500px] rounded-3xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl flex flex-col select-none crm-map-container ${
        mapTheme === 'dark' ? 'crm-map-dark' : 'crm-map-streets'
      }`}
    >
      {/* Contenedor del Mapa Leaflet */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* 1. Barra Superior de Control del Mapa */}
      <div className="absolute top-3 left-3 right-3 sm:right-auto z-20 flex items-center gap-2 flex-wrap pointer-events-auto">
        {onSelectCity && availableCities.length > 0 && (
          <div className="flex items-center bg-slate-900/95 backdrop-blur-md p-1 rounded-xl border border-slate-700/80 shadow-lg text-xs font-semibold flex-wrap gap-1">
            <button
              type="button"
              onClick={() => onSelectCity('all')}
              className={`px-2.5 py-1 rounded-lg transition ${
                selectedCity === 'all'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              Todas ({cityCounts.all ?? leads.length})
            </button>
            {availableCities.map((city) => (
              <button
                key={city}
                type="button"
                onClick={() => onSelectCity(city)}
                className={`px-2.5 py-1 rounded-lg transition ${
                  selectedCity === city
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                {city} ({cityCounts[city] ?? 0})
              </button>
            ))}
          </div>
        )}

        <div className="px-3.5 py-1.5 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-800 text-xs font-semibold text-white flex items-center gap-2 shadow-lg">
          <MapPin className="w-4 h-4 text-blue-400 shrink-0" />
          <span>{leads.length} locales geolocalizados</span>
        </div>

        <button
          onClick={handleResetCenter}
          title="Auto-encuadrar todos los locales mostrados"
          className="px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 backdrop-blur-md border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5 shadow-lg transition active:scale-95 touch-manipulation"
        >
          <Compass className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline">Encuadrar Locales</span>
        </button>

        {/* Botón Modo Ruta de Visitas */}
        <button
          type="button"
          onClick={() => {
            setRouteMode((prev) => !prev)
            setSelectedLead(null)
          }}
          title="Activa para marcar/quitar locales haciendo clic en el mapa"
          className={`px-3 py-1.5 rounded-xl backdrop-blur-md border text-xs font-bold flex items-center gap-1.5 shadow-lg transition active:scale-95 touch-manipulation ${
            routeMode
              ? 'bg-sky-500 text-slate-950 border-sky-300 shadow-sky-500/30'
              : routeLeads.length > 0
                ? 'bg-sky-950/90 text-sky-300 border-sky-500/50 hover:bg-sky-900'
                : 'bg-slate-900/90 text-slate-200 border-slate-800 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <Route className="w-3.5 h-3.5" />
          <span>
            {routeMode
              ? `Marcando Ruta (${routeLeads.length})`
              : routeLeads.length > 0
                ? `Ruta (${routeLeads.length})`
                : 'Marcar Ruta'}
          </span>
        </button>

        {/* Selector de Tema de Mapa (Noche / Callejero / Satélite) */}
        <div className="flex items-center bg-slate-900/90 backdrop-blur-md p-1 rounded-xl border border-slate-800 shadow-lg text-xs font-semibold">
          <button
            onClick={() => setMapTheme('dark')}
            className={`px-2.5 py-1 rounded-lg transition ${
              mapTheme === 'dark'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Modo Oscuro Ejecutivo"
          >
            Noche
          </button>
          <button
            onClick={() => setMapTheme('streets')}
            className={`px-2.5 py-1 rounded-lg transition ${
              mapTheme === 'streets'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Modo Callejero de Alto Contraste"
          >
            Callejero
          </button>
          <button
            onClick={() => setMapTheme('satellite')}
            className={`px-2.5 py-1 rounded-lg transition ${
              mapTheme === 'satellite'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Modo Satélite Aéreo"
          >
            Satélite
          </button>
        </div>
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
              {selectedLead.mrr_projected || PLAN_PRICING[selectedLead.target_plan] || 15} €/mes
            </div>
          </div>

          {/* Progreso de Piloto (Si está en piloto) */}
          {pilotDays && (
            <div className="mt-2.5 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs">
              <div className="flex items-center justify-between text-amber-300 text-[11px] font-bold mb-1">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  Día {pilotDays.day} de 14
                  {pilotDays.day >= 12 ? ' (⚠️ Cierre urgente)' : pilotDays.day >= 7 ? ' (Balance)' : ''}
                </span>
                <span>{pilotDays.remaining} días restantes</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-amber-400 h-full rounded-full transition-all duration-300"
                  style={{ width: `${pilotDays.percent}%` }}
                />
              </div>

              {selectedLead.pilot_checklist && (
                <div className="mt-2 flex items-center justify-between text-[10px] text-slate-300 pt-1 border-t border-amber-500/20">
                  <span>Puesta en marcha:</span>
                  <span className="font-mono text-emerald-400 font-bold">
                    {Object.values(selectedLead.pilot_checklist).filter(Boolean).length}/4 tareas
                  </span>
                </div>
              )}

              {selectedLead.pilot_agreement && (
                <div className="mt-1 text-[10px] text-amber-300 font-semibold truncate">
                  ✓ Firmado por {selectedLead.pilot_agreement.signee_name}
                </div>
              )}
            </div>
          )}

          {/* Sistema Actual y Fricción en Reseñas [Ideas 4 y 5] */}
          {selectedLead.current_pos_system && (
            <div className="mt-2 p-2 rounded-xl bg-indigo-950/40 border border-indigo-800/40 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Sistema actual:</span>
              <span className="font-semibold text-indigo-300 flex items-center gap-1">
                <span>{POS_SYSTEM_CONFIG[selectedLead.current_pos_system]?.icon}</span>
                <span>{POS_SYSTEM_CONFIG[selectedLead.current_pos_system]?.label}</span>
              </span>
            </div>
          )}

          {selectedLead.google_complaint_tags && selectedLead.google_complaint_tags.length > 0 && (
            <div className="mt-1.5 p-2 rounded-xl bg-rose-950/30 border border-rose-800/30 text-[11px] text-rose-300">
              <span className="font-bold text-rose-400 block text-[10px] mb-0.5">Fricción en Reseñas:</span>
              <span className="truncate block">{selectedLead.google_complaint_tags[0]}</span>
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
            ) : null}

            <button
              type="button"
              onClick={() => toggleLeadInRoute(selectedLead.id)}
              className={`col-span-2 px-3 py-2 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1.5 active:scale-95 touch-manipulation ${
                routeIndexById.has(selectedLead.id)
                  ? 'bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border-sky-400/50'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-100 border-slate-700'
              }`}
            >
              {routeIndexById.has(selectedLead.id) ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>En tu ruta (Parada #{routeIndexById.get(selectedLead.id)}) · Quitar</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>Añadir a mi ruta de visitas</span>
                </>
              )}
            </button>

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

      {/* 4. PANEL DE RUTA DE VISITAS (Visible al activar Modo Ruta o al tener paradas) */}
      {(routeMode || routeLeads.length > 0) && (
        <aside className="absolute z-25 bottom-3 right-3 left-3 sm:left-auto sm:top-16 sm:bottom-auto sm:w-80 rounded-2xl bg-slate-900/95 border border-sky-500/40 backdrop-blur-xl shadow-2xl p-3.5 text-white pointer-events-auto flex flex-col max-h-[60vh]">
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-sky-500/20 border border-sky-400/40 flex items-center justify-center shrink-0">
                <Route className="w-4 h-4 text-sky-400" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-black text-white truncate">
                  Ruta de Visitas ({routeLeads.length})
                </h4>
                <p className="text-[10px] text-slate-400 truncate">
                  {routeLeads.length >= 2
                    ? `${routeStats.distanceKm < 1 ? `${Math.round(routeStats.distanceKm * 1000)} m` : `${routeStats.distanceKm.toFixed(1)} km`} · ~${routeStats.walkingMinutes} min a pie`
                    : routeMode
                      ? 'Haz clic en los pines del mapa'
                      : 'Añade más paradas para trazar'}
                </p>
              </div>
            </div>

            {routeLeads.length > 0 && (
              <button
                type="button"
                onClick={handleClearVisibleRoute}
                title="Vaciar ruta"
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/80 text-slate-400 hover:text-rose-300 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {routeLeads.length === 0 ? (
            <div className="py-5 px-2 text-center space-y-1.5">
              <p className="text-xs font-semibold text-sky-300">Modo marcar ruta activo</p>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Toca los círculos del mapa en el orden que quieras visitarlos para dibujar el recorrido.
              </p>
            </div>
          ) : (
            <>
              <div className="my-2 space-y-1.5 overflow-y-auto pr-1 flex-1">
                {routeLeads.map((lead, idx) => (
                  <div
                    key={lead.id}
                    className="flex items-center gap-2 p-2 rounded-xl bg-slate-800/70 hover:bg-slate-800 border border-slate-700/60 transition"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        const c = getLeadCoordinates(lead)
                        if (mapInstanceRef.current) {
                          mapInstanceRef.current.panTo([c.lat, c.lng], { animate: true })
                        }
                        if (!routeMode) setSelectedLead(lead)
                      }}
                      className="w-6 h-6 rounded-full bg-sky-600 text-white text-[11px] font-black flex items-center justify-center shrink-0"
                      title="Centrar en mapa"
                    >
                      {idx + 1}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const c = getLeadCoordinates(lead)
                        if (mapInstanceRef.current) {
                          mapInstanceRef.current.panTo([c.lat, c.lng], { animate: true })
                        }
                        if (!routeMode) setSelectedLead(lead)
                      }}
                      className="flex-1 min-w-0 text-left"
                    >
                      <p className="text-xs font-bold text-white truncate">{lead.name}</p>
                      <p className="text-[10px] text-slate-400 truncate">{lead.zone || lead.address}</p>
                    </button>

                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => moveRouteStop(idx, -1)}
                        className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-white disabled:opacity-30"
                        title="Subir parada"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === routeLeads.length - 1}
                        onClick={() => moveRouteStop(idx, 1)}
                        className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-white disabled:opacity-30"
                        title="Bajar parada"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleLeadInRoute(lead.id)}
                        className="p-1 rounded hover:bg-rose-950/80 text-slate-400 hover:text-rose-300"
                        title="Quitar de la ruta"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-800 space-y-1.5">
                {routeLeads.length >= 3 && (
                  <button
                    type="button"
                    onClick={handleOptimizeRoute}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sky-300 text-xs font-bold flex items-center justify-center gap-1.5 transition"
                  >
                    <Wand2 className="w-3.5 h-3.5" />
                    <span>Optimizar camino más corto</span>
                  </button>
                )}

                {routeMapsUrl && (
                  <a
                    href={routeMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full px-3 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-md shadow-sky-600/25 transition"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>
                      Abrir ruta en Google Maps (A pie)
                      {routeLeads.length > 11 ? ' · Primeras 11' : ''}
                    </span>
                  </a>
                )}
              </div>
            </>
          )}
        </aside>
      )}
    </div>
  )
}
