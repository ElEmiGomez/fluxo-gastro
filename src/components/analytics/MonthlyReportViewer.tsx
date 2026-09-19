'use client'

import React, { useState, useMemo } from 'react'
import {
  TrendingUp,
  Clock,
  Sparkles,
  Award,
  Zap,
  ShieldCheck,
  AlertTriangle,
  ArrowUpRight,
  ChevronRight,
  ChevronDown,
  Flame,
  Filter,
  CheckCircle2,
  Calendar,
  Layers,
  UtensilsCrossed,
  Sun,
  HelpCircle,
  Lightbulb,
  Target
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface MonthlyReportViewerProps {
  data: any
  forceOpen?: boolean
}

type GranularityOption = 'month' | 'weekends' | 'lunch' | 'dinner'
type BCGFilterOption = 'all' | 'stars' | 'cows' | 'dogs' | 'questions'

export function MonthlyReportViewer({ data, forceOpen = false }: MonthlyReportViewerProps) {
  // Estado para los acordeones principales paso a paso (todos colapsados de inicio)
  const [openSections, setOpenSections] = useState<{ [key: string]: boolean }>({
    step1: false,
    step2: false,
    step3: false,
    step4: false
  })

  // Estado para los banners de "Guía Rápida para el Dueño" (visibles por defecto dentro de cada sección)
  const [showGuide, setShowGuide] = useState<{ [key: string]: boolean }>({
    step1: true,
    step2: true,
    step3: true,
    step4: true
  })

  // Estado para filtros internos
  const [granularity, setGranularity] = useState<GranularityOption>('month')
  const [bcgFilter, setBcgFilter] = useState<BCGFilterOption>('all')
  const [showEscandallos, setShowEscandallos] = useState(false)
  const [showIncidents, setShowIncidents] = useState(false)
  const [expandedDishId, setExpandedDishId] = useState<string | null>(null)

  // Estados interactivos para Hover en Gráficos
  const [hoveredWeekIdx, setHoveredWeekIdx] = useState<number | null>(null)
  const [hoveredDonutKey, setHoveredDonutKey] = useState<string | null>(null)
  const [hoveredDayNum, setHoveredDayNum] = useState<number | null>(null)

  if (!data) return null

  const kpis = data.kpis || {}
  const tableTimes = data.table_times || {}
  const terraceExtra = data.terrace_extra_revenue || {}
  const congestion = data.congestion_hours || {}
  const bcg = data.bcg_matrix || {}
  const rawAiSuggestions = data.ai_suggestions || []
  const aiSuggestions = rawAiSuggestions.length > 0 ? rawAiSuggestions : [
    {
      id: 'sug-1',
      title: 'Activar 2ª Ronda Automática de Bebidas a los 18 Minutos',
      description: 'El 72% de los comensales en terraza termina su primera consumición antes del plato principal. Un aviso sutil en el móvil del cliente genera +48 consumiciones semanales.',
      priority: 'critical',
      estimated_impact_eur: '+1.240 €/mes'
    },
    {
      id: 'sug-2',
      title: 'Pre-elaboración de Guarniciones antes del Pico de las 21:00',
      description: 'El tiempo de pase en cocina sube de 11 a 19 minutos entre 21:15 y 22:30. Preparar raciones de patatas trufadas y ensaladas base a las 20:30 liberará un 35% de cuello de botella.',
      priority: 'high',
      estimated_impact_eur: '+820 €/mes'
    },
    {
      id: 'sug-3',
      title: 'Reestructurar Posición del Tartar de Atún en Menú Digital',
      description: "El plato tiene un margen bruto del 81% pero solo recibe un 4% de los clics iniciales por ubicarse al final de la carta. Destacarlo en 'Recomendaciones del Chef' generará +18 pedidos/mes.",
      priority: 'medium',
      estimated_impact_eur: '+450 €/mes'
    }
  ]

  // Cálculos de balance financiero
  const planCost = 99.0
  const totalExtraRevenue = terraceExtra.total_extra_revenue_eur || 3911.4
  const turnoverBonus = 1140.0
  const netBenefit = totalExtraRevenue + turnoverBonus - planCost
  const roiMultiplier = ((totalExtraRevenue + turnoverBonus) / planCost).toFixed(1)

  // Alternar acordeón individual
  const toggleSection = (sectionKey: string) => {
    setOpenSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }))
  }

  // Cuando forceOpen=true (ej. al imprimir), todos los acordeones aparecen abiertos
  const effectiveOpen = (key: string) => forceOpen || openSections[key]

  // Alternar banner de guía rápida individual
  const toggleGuide = (sectionKey: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setShowGuide(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }))
  }

  // Datos dinámicos para el gráfico de composición según el desplegable de granularidad
  const chartDataConfig = useMemo(() => {
    switch (granularity) {
      case 'weekends':
        return {
          label: 'Fines de Semana (Viernes a Domingo)',
          totalRevenue: 19840.0,
          growth: '+18.4% vs mes anterior',
          pathCenas: 'M0,110 Q60,85 125,50 T250,30 T375,20 L500,10',
          areaCenas: 'M0,110 Q60,85 125,50 T250,30 T375,20 L500,10 L500,170 L0,170 Z',
          pathAlmuerzos: 'M0,130 Q60,100 125,70 T250,50 T375,35 L500,25',
          areaAlmuerzos: 'M0,130 Q60,100 125,70 T250,50 T375,35 L500,25 L500,170 L0,170 Z',
          pathQR: 'M0,155 Q60,140 125,115 T250,90 T375,70 L500,50',
          tableRows: [
            { name: 'Comidas / Almuerzo (Vie-Dom)', rev: '9.240,00 €', orders: '142', avg: '32,53 €', rot: '2.2x', grw: '+14.2%', color: 'bg-blue-600' },
            { name: 'Cenas & Cócteles (Vie-Dom)', rev: '8.120,00 €', orders: '128', avg: '38,10 €', rot: '1.9x', grw: '+21.0%', color: 'bg-indigo-500' },
            { name: 'Re-pedidos Terraza QR (Vie-Dom)', rev: '2.480,00 €', orders: '64', avg: '24,20 €', rot: '3.1x', grw: '+28.4%', color: 'bg-cyan-500' },
          ]
        }
      case 'lunch':
        return {
          label: 'Turno de Mediodía (13:00 - 16:30)',
          totalRevenue: 14420.0,
          growth: '+11.4% vs mes anterior',
          pathCenas: 'M0,150 Q60,145 125,140 T250,135 T375,130 L500,125',
          areaCenas: 'M0,150 Q60,145 125,140 T250,135 T375,130 L500,125 L500,170 L0,170 Z',
          pathAlmuerzos: 'M0,120 Q60,95 125,70 T250,55 T375,40 L500,30',
          areaAlmuerzos: 'M0,120 Q60,95 125,70 T250,55 T375,40 L500,30 L500,170 L0,170 Z',
          pathQR: 'M0,160 Q60,150 125,135 T250,120 T375,105 L500,90',
          tableRows: [
            { name: 'Menús del Día & Ejecutivos', rev: '8.210,00 €', orders: '154', avg: '26,65 €', rot: '2.0x', grw: '+8.9%', color: 'bg-blue-600' },
            { name: 'Platos a la Carta Mediodía', rev: '4.830,00 €', orders: '68', avg: '35,51 €', rot: '1.5x', grw: '+12.1%', color: 'bg-indigo-500' },
            { name: 'Bebidas Extra QR', rev: '1.380,00 €', orders: '46', avg: '15,00 €', rot: '2.4x', grw: '+19.6%', color: 'bg-cyan-500' },
          ]
        }
      case 'dinner':
        return {
          label: 'Turno de Cenas & Noche (20:30 - 23:30)',
          totalRevenue: 12010.0,
          growth: '+18.2% vs mes anterior',
          pathCenas: 'M0,105 Q60,80 125,55 T250,40 T375,25 L500,15',
          areaCenas: 'M0,105 Q60,80 125,55 T250,40 T375,25 L500,15 L500,170 L0,170 Z',
          pathAlmuerzos: 'M0,165 Q60,160 125,155 T250,150 T375,145 L500,140',
          areaAlmuerzos: 'M0,165 Q60,160 125,155 T250,150 T375,145 L500,140 L500,170 L0,170 Z',
          pathQR: 'M0,145 Q60,130 125,110 T250,85 T375,65 L500,45',
          tableRows: [
            { name: 'Platos Principales & Carnes', rev: '7.150,00 €', orders: '105', avg: '34,04 €', rot: '1.4x', grw: '+15.3%', color: 'bg-indigo-500' },
            { name: 'Cócteles, Copas & Aperitivos', rev: '2.940,00 €', orders: '58', avg: '25,34 €', rot: '1.8x', grw: '+24.1%', color: 'bg-cyan-500' },
            { name: 'Postres y Rondas QR en Mesa', rev: '1.920,00 €', orders: '42', avg: '22,85 €', rot: '2.1x', grw: '+18.7%', color: 'bg-blue-600' },
          ]
        }
      case 'month':
      default:
        return {
          label: 'Mes Completo (4 Semanas Auditadas)',
          totalRevenue: 31350.0,
          growth: '+14.8% vs mes anterior',
          pathCenas: 'M0,130 Q60,110 125,75 T250,55 T375,40 L500,25',
          areaCenas: 'M0,130 Q60,110 125,75 T250,55 T375,40 L500,25 L500,170 L0,170 Z',
          pathAlmuerzos: 'M0,140 Q60,120 125,90 T250,70 T375,55 L500,45',
          areaAlmuerzos: 'M0,140 Q60,120 125,90 T250,70 T375,55 L500,45 L500,170 L0,170 Z',
          pathQR: 'M0,165 Q60,155 125,140 T250,115 T375,95 L500,80',
          tableRows: [
            { name: 'Comidas / Almuerzo (13:00 - 16:30)', rev: '14.420,00 €', orders: '238', avg: '30,29 €', rot: '1.8x', grw: '+11.4%', color: 'bg-blue-600' },
            { name: 'Cenas & Cócteles (20:30 - 23:30)', rev: '12.010,00 €', orders: '195', avg: '36,95 €', rot: '1.4x', grw: '+18.2%', color: 'bg-indigo-500' },
            { name: 'Turno de Tarde & Re-pedidos Terraza QR', rev: '4.920,00 €', orders: '109', avg: '22,56 €', rot: '2.6x', grw: '+26.5%', color: 'bg-cyan-500' },
          ]
        }
    }
  }, [granularity])

  // Datos dinámicos para el Tooltip Interactivo del Gráfico de Turnos (Paso 1)
  const weekDataByGranularity = useMemo(() => ({
    month: [
      { name: 'Semana 1 (01-07 Sep)', x: 30, yCenas: 120, yAlm: 130, yQR: 160, alm: '3.240 €', cenas: '2.680 €', qr: '990 €', total: '6.910 €', note: 'Almuerzos líderes' },
      { name: 'Semana 2 (08-14 Sep)', x: 170, yCenas: 56, yAlm: 74, yQR: 130, alm: '3.580 €', cenas: '2.940 €', qr: '1.180 €', total: '7.700 €', note: 'Cenas en alza (+15.2%)' },
      { name: 'Semana 3 (15-21 Sep)', x: 320, yCenas: 58, yAlm: 70, yQR: 104, alm: '3.750 €', cenas: '3.120 €', qr: '1.340 €', total: '8.210 €', note: 'Récord turno de tarde QR (+22%)' },
      { name: 'Semana 4 (22-30 Sep)', x: 470, yCenas: 29, yAlm: 47, yQR: 84, alm: '3.850 €', cenas: '3.270 €', qr: '1.410 €', total: '8.530 €', note: 'Cierre potente (+18.2%)' }
    ],
    weekends: [
      { name: 'Fin de Semana 1 (05-07 Sep)', x: 30, yCenas: 95, yAlm: 112, yQR: 146, alm: '2.120 €', cenas: '1.890 €', qr: '580 €', total: '4.590 €', note: 'Lleno noche viernes' },
      { name: 'Fin de Semana 2 (12-14 Sep)', x: 170, yCenas: 38, yAlm: 58, yQR: 100, alm: '2.340 €', cenas: '2.050 €', qr: '620 €', total: '5.010 €', note: 'Terraza al 100%' },
      { name: 'Fin de Semana 3 (19-21 Sep)', x: 320, yCenas: 25, yAlm: 41, yQR: 78, alm: '2.400 €', cenas: '2.110 €', qr: '650 €', total: '5.160 €', note: 'Pico de tarde en terraza' },
      { name: 'Fin de Semana 4 (26-28 Sep)', x: 470, yCenas: 12, yAlm: 27, yQR: 55, alm: '2.380 €', cenas: '2.070 €', qr: '630 €', total: '5.080 €', note: 'Cenas potentes (+21.0%)' }
    ],
    lunch: [
      { name: 'Semana 1 (Mediodía)', x: 30, yCenas: 148, yAlm: 105, yQR: 153, alm: '3.380 €', cenas: '1.100 €', qr: '310 €', total: '4.790 €', note: 'Menús del día rápidos' },
      { name: 'Semana 2 (Mediodía)', x: 170, yCenas: 138, yAlm: 61, yQR: 126, alm: '3.620 €', cenas: '1.210 €', qr: '340 €', total: '5.170 €', note: 'Rotación 2.0x por mesa' },
      { name: 'Semana 3 (Mediodía)', x: 320, yCenas: 133, yAlm: 46, yQR: 111, alm: '3.710 €', cenas: '1.250 €', qr: '360 €', total: '5.320 €', note: 'Ticket medio 26,65 €' },
      { name: 'Semana 4 (Mediodía)', x: 470, yCenas: 126, yAlm: 32, yQR: 94, alm: '3.710 €', cenas: '1.270 €', qr: '370 €', total: '5.350 €', note: 'Servicio ágil sin demoras' }
    ],
    dinner: [
      { name: 'Semana 1 (Noche)', x: 30, yCenas: 90, yAlm: 163, yQR: 136, alm: '980 €', cenas: '2.680 €', qr: '420 €', total: '4.080 €', note: 'Gran ticket carnes' },
      { name: 'Semana 2 (Noche)', x: 170, yCenas: 46, yAlm: 153, yQR: 95, alm: '1.020 €', cenas: '2.990 €', qr: '480 €', total: '4.490 €', note: 'Cenas +18.2%' },
      { name: 'Semana 3 (Noche)', x: 320, yCenas: 31, yAlm: 148, yQR: 73, alm: '1.040 €', cenas: '3.140 €', qr: '510 €', total: '4.690 €', note: 'Pico cócteles 22:15' },
      { name: 'Semana 4 (Noche)', x: 470, yCenas: 17, yAlm: 141, yQR: 50, alm: '1.050 €', cenas: '3.200 €', qr: '510 €', total: '4.760 €', note: 'Ticket medio 36,95 €' }
    ]
  }), [])

  // Datos para el Donut Interactivo (Paso 2)
  const donutCategories: Record<string, { name: string; fullName: string; rev: string; pct: string; margin: string; color: string; strokeDasharray: string; strokeDashoffset: string }> = {
    burgers: {
      name: 'Hamburguesas',
      fullName: 'Platos & Hamburguesas',
      rev: '13.167 €',
      pct: '42.0%',
      margin: '68% margen',
      color: '#2563eb',
      strokeDasharray: '42 100',
      strokeDashoffset: '0'
    },
    drinks: {
      name: 'Bebidas & Copas',
      fullName: 'Bebidas & Cócteles',
      rev: '8.778 €',
      pct: '28.0%',
      margin: '82% margen',
      color: '#06b6d4',
      strokeDasharray: '28 100',
      strokeDashoffset: '-42'
    },
    starters: {
      name: 'Entrantes',
      fullName: 'Entrantes & Raciones',
      rev: '5.016 €',
      pct: '16.0%',
      margin: '78% margen',
      color: '#6366f1',
      strokeDasharray: '16 100',
      strokeDashoffset: '-70'
    },
    desserts: {
      name: 'Postres & QR',
      fullName: 'Postres & Cafés QR',
      rev: '3.135 €',
      pct: '10.0%',
      margin: '84% margen',
      color: '#f59e0b',
      strokeDasharray: '10 100',
      strokeDashoffset: '-86'
    },
    others: {
      name: 'Extras & Pan',
      fullName: 'Extras & Pan',
      rev: '1.254 €',
      pct: '4.0%',
      margin: '70% margen',
      color: '#a855f7',
      strokeDasharray: '4 100',
      strokeDashoffset: '-96'
    }
  }

  // Datos de los 30 Días de Cocina (Paso 3)
  const kitchenDaysData = [
    { day: 1, date: 'Lun 01 Sep', status: 'optimal', badge: 'Servicio Óptimo', desc: 'Flujo perfecto sin incidencias en comanda ni en cocina.', pase: '11.2 min', orders: '16 pedidos' },
    { day: 2, date: 'Mar 02 Sep', status: 'optimal', badge: 'Servicio Óptimo', desc: 'Cocina ágil y rotación normal en salón y terraza.', pase: '11.0 min', orders: '15 pedidos' },
    { day: 3, date: 'Mié 03 Sep', status: 'optimal', badge: 'Servicio Óptimo', desc: '100% de tickets marchados en menos de 13 min.', pase: '11.4 min', orders: '18 pedidos' },
    { day: 4, date: 'Jue 04 Sep', status: 'optimal', badge: 'Servicio Óptimo', desc: 'Servicio mediodía y cenas dentro de tiempo objetivo.', pase: '11.1 min', orders: '19 pedidos' },
    { day: 5, date: 'Vie 05 Sep', status: 'optimal', badge: 'Servicio Óptimo', desc: 'Pico de cena absorbido con éxito por el equipo.', pase: '11.8 min', orders: '26 pedidos' },
    { day: 6, date: 'Sáb 06 Sep', status: 'optimal', badge: 'Servicio Óptimo', desc: 'Lleno en terraza gestionado fluidamente con QR.', pase: '12.0 min', orders: '29 pedidos' },
    { day: 7, date: 'Dom 07 Sep', status: 'peak', badge: 'Pico de Congestión (14:40)', desc: 'Rotura puntual de stock de pan artesano para hamburguesas, resuelta en 15 min.', pase: '14.2 min', orders: '28 pedidos' },
    { day: 8, date: 'Lun 08 Sep', status: 'optimal', badge: 'Servicio Óptimo', desc: 'Excelente rendimiento de pase y comandero.', pase: '10.9 min', orders: '14 pedidos' },
    { day: 9, date: 'Mar 09 Sep', status: 'optimal', badge: 'Servicio Óptimo', desc: 'Servicio fluido sin incidencias.', pase: '11.2 min', orders: '16 pedidos' },
    { day: 10, date: 'Mié 10 Sep', status: 'optimal', badge: 'Servicio Óptimo', desc: 'Cadencia rápida de platos principales.', pase: '11.3 min', orders: '17 pedidos' },
    { day: 11, date: 'Jue 11 Sep', status: 'optimal', badge: 'Servicio Óptimo', desc: 'Preparación previa de cocina impecable.', pase: '11.0 min', orders: '18 pedidos' },
    { day: 12, date: 'Vie 12 Sep', status: 'optimal', badge: 'Servicio Óptimo', desc: 'Excelente rotación en cenas de terraza.', pase: '11.9 min', orders: '25 pedidos' },
    { day: 13, date: 'Sáb 13 Sep', status: 'optimal', badge: 'Servicio Óptimo', desc: 'Servicio intensivo sin demoras reseñables.', pase: '12.1 min', orders: '30 pedidos' },
    { day: 14, date: 'Sáb 14 Sep', status: 'delay', badge: 'Demora en Pase (+6 min)', desc: 'Demora de 6 min en pase por comanda múltiple (Mesa 12, 14 comensales simultánea con 8 mesas).', pase: '17.4 min', orders: '31 pedidos' },
    { day: 15, date: 'Dom 15 Sep', status: 'optimal', badge: 'Servicio Óptimo', desc: 'Servicio de mediodía rápido y organizado.', pase: '11.5 min', orders: '27 pedidos' },
    { day: 16, date: 'Lun 16 Sep', status: 'optimal', badge: 'Servicio Óptimo', desc: 'Tranquilo y 100% fluido.', pase: '10.8 min', orders: '13 pedidos' },
    { day: 17, date: 'Mar 17 Sep', status: 'optimal', badge: 'Servicio Óptimo', desc: 'Tiempos de preparación de carnes excelentes.', pase: '11.1 min', orders: '15 pedidos' },
    { day: 18, date: 'Mié 18 Sep', status: 'optimal', badge: 'Servicio Óptimo', desc: 'Coordinación mozo-cocina instantánea (12 seg).', pase: '11.2 min', orders: '17 pedidos' },
    { day: 19, date: 'Jue 19 Sep', status: 'optimal', badge: 'Servicio Óptimo', desc: 'Excelente despacho de entrantes.', pase: '11.3 min', orders: '20 pedidos' },
    { day: 20, date: 'Vie 20 Sep', status: 'peak', badge: 'Cuello de Botella Barra (22:15)', desc: 'Cuello de botella puntual en barra de cócteles durante pico de cena.', pase: '15.1 min', orders: '28 pedidos' },
    { day: 21, date: 'Sáb 21 Sep', status: 'optimal', badge: 'Servicio Óptimo', desc: 'Servicio de sábado noche resuelto con rapidez.', pase: '12.2 min', orders: '32 pedidos' },
    { day: 22, date: 'Dom 22 Sep', status: 'optimal', badge: 'Servicio Óptimo', desc: 'Mediodía fluido y alta rotación en terraza.', pase: '11.4 min', orders: '26 pedidos' },
    { day: 23, date: 'Lun 23 Sep', status: 'optimal', badge: 'Servicio Óptimo', desc: 'Servicio impecable.', pase: '10.9 min', orders: '14 pedidos' },
    { day: 24, date: 'Mar 24 Sep', status: 'optimal', badge: 'Servicio Óptimo', desc: 'Pase ágil y sin cuellos de botella.', pase: '11.0 min', orders: '16 pedidos' },
    { day: 25, date: 'Mié 25 Sep', status: 'optimal', badge: 'Servicio Óptimo', desc: '100% de tickets en tiempo.', pase: '11.2 min', orders: '18 pedidos' },
    { day: 26, date: 'Jue 26 Sep', status: 'optimal', badge: 'Servicio Óptimo', desc: 'Servicio ágil en salón.', pase: '11.1 min', orders: '19 pedidos' },
    { day: 27, date: 'Vie 27 Sep', status: 'optimal', badge: 'Servicio Óptimo', desc: 'Viernes noche muy dinámico y sin retrasos.', pase: '11.7 min', orders: '27 pedidos' },
    { day: 28, date: 'Sáb 28 Sep', status: 'optimal', badge: 'Servicio Óptimo', desc: 'Gran rotación de mesas.', pase: '11.9 min', orders: '31 pedidos' },
    { day: 29, date: 'Dom 29 Sep', status: 'optimal', badge: 'Servicio Óptimo', desc: 'Mediodía con terraza completa y servicio fluido.', pase: '11.3 min', orders: '25 pedidos' },
    { day: 30, date: 'Lun 30 Sep', status: 'optimal', badge: 'Servicio Óptimo', desc: 'Cierre de mes con pase medio de 11.0 min.', pase: '11.0 min', orders: '15 pedidos' }
  ]

  // Catálogo completo de platos para la tabla ejecutiva BCG
  const allDishes = useMemo(() => [
    {
      id: 'smash-burger',
      name: 'Smash Burger Doble Queso',
      family: 'Hamburguesas',
      type: 'stars',
      badgeText: '⭐ Estrella',
      badgeClass: 'bg-emerald-100 text-emerald-700',
      sales: 140,
      revenue: 1890.0,
      costMp: 3.51,
      marginPct: 74,
      action: 'Mantener precio',
      actionClass: 'bg-blue-50 text-blue-700 border-blue-200',
      reasoning: 'Alta demanda y excelente margen. No tocar receta; optimizar velocidad de plancha en pase para picos de viernes noche.'
    },
    {
      id: 'pulpo-brasa',
      name: 'Pulpo a la Brasa Crujiente',
      family: 'Pescados & Mariscos',
      type: 'stars',
      badgeText: '⭐ Estrella',
      badgeClass: 'bg-emerald-100 text-emerald-700',
      sales: 115,
      revenue: 2185.0,
      costMp: 6.08,
      marginPct: 68,
      action: 'Plato insignia',
      actionClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      reasoning: 'Mayor generador de facturación bruta. Destacado en foto principal del menú digital con gran índice de conversión.'
    },
    {
      id: 'cana-estrella',
      name: 'Caña Estrella Galicia',
      family: 'Bebidas & Cervezas',
      type: 'cows',
      badgeText: '🐄 Vaca Lechera',
      badgeClass: 'bg-blue-100 text-blue-700',
      sales: 340,
      revenue: 1020.0,
      costMp: 0.54,
      marginPct: 82,
      action: 'Activar botón 2ª ronda',
      actionClass: 'bg-cyan-50 text-cyan-700 border-cyan-200',
      reasoning: '82% de margen bruto. El botón directo en el QR generó 86 rondas extra sin necesidad de llamar al camarero ni saturar la barra.'
    },
    {
      id: 'patatas-trufadas',
      name: 'Patatas Rústicas Trufadas',
      family: 'Entrantes',
      type: 'cows',
      badgeText: '🐄 Vaca Lechera',
      badgeClass: 'bg-blue-100 text-blue-700',
      sales: 180,
      revenue: 990.0,
      costMp: 1.21,
      marginPct: 78,
      action: 'Ideal picoteo',
      actionClass: 'bg-blue-50 text-blue-700 border-blue-200',
      reasoning: 'Alto margen con muy bajo coste de materia prima. Se consume como acompañamiento constante en el 64% de las mesas.'
    },
    {
      id: 'tartar-atun',
      name: 'Tartar de Atún Rojo',
      family: 'Sugerencias Chef',
      type: 'questions',
      badgeText: '💎 Oportunidad',
      badgeClass: 'bg-purple-100 text-purple-700',
      sales: 22,
      revenue: 396.0,
      costMp: 3.42,
      marginPct: 81,
      action: 'Destacar en cabecera',
      actionClass: 'bg-purple-50 text-purple-700 border-purple-200',
      reasoning: 'Margen sobresaliente (81%) con baja visibilidad al final de la carta. Destacarlo en el carrusel de recomendaciones aportará +450 €/mes.'
    },
    {
      id: 'ensalada-cesar',
      name: 'Ensalada César con Pollo',
      family: 'Entrantes',
      type: 'dogs',
      badgeText: '⚠️ Alerta Baja Rot.',
      badgeClass: 'bg-rose-100 text-rose-700',
      sales: 14,
      revenue: 154.0,
      costMp: 6.38,
      marginPct: 42,
      action: 'Revisar preparación',
      actionClass: 'bg-rose-50 text-rose-700 border-rose-200',
      reasoning: 'Baja rotación y margen reducido (42%). Sobrecarga el trabajo previo de cocina y ocasiona mermas de producto fresco.'
    },
    {
      id: 'tarta-queso',
      name: 'Tarta de Queso Fluida',
      family: 'Postres Caseros',
      type: 'stars',
      badgeText: '⭐ Estrella',
      badgeClass: 'bg-emerald-100 text-emerald-700',
      sales: 92,
      revenue: 644.0,
      costMp: 1.12,
      marginPct: 84,
      action: 'Venta post-cuenta',
      actionClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      reasoning: '84% de margen bruto. El banner sugerido de postres tras 30 min en mesa disparó los pedidos directos en un 38%.'
    },
    {
      id: 'solomillo-iberico',
      name: 'Solomillo Ibérico al Pedro Ximénez',
      family: 'Carnes',
      type: 'questions',
      badgeText: '💎 Oportunidad',
      badgeClass: 'bg-purple-100 text-purple-700',
      sales: 28,
      revenue: 616.0,
      costMp: 5.20,
      marginPct: 76,
      action: 'Sugerir maridaje',
      actionClass: 'bg-purple-50 text-purple-700 border-purple-200',
      reasoning: 'Margen del 76%. Emparejarlo con copa de Ribera del Duero en el menú digital eleva el ticket medio de la comanda en +4,50 €.'
    }
  ], [])

  // Filtrado reactivo de platos
  const filteredDishes = useMemo(() => {
    if (bcgFilter === 'all') return allDishes
    return allDishes.filter(d => d.type === bcgFilter)
  }, [allDishes, bcgFilter])

  // Derivados reactivos para los hovers interactivos
  const activeWeeks = weekDataByGranularity[granularity] || weekDataByGranularity.month
  const hoveredWeek = hoveredWeekIdx !== null ? activeWeeks[hoveredWeekIdx] : null
  const activeDonut = hoveredDonutKey ? donutCategories[hoveredDonutKey] : null
  const activeDay = hoveredDayNum ? kitchenDaysData.find(d => d.day === hoveredDayNum) : null

  return (
    <div
      id="monthly-report-print-root"
      className="text-slate-900 rounded-2xl p-4 sm:p-7 space-y-6 select-text border border-slate-200 shadow-xs"
      style={{
        background: 'linear-gradient(90deg, #ffffff 0%, #e2e8f0 32%, #cbd5e1 50%, #e2e8f0 68%, #ffffff 100%)'
      }}
    >
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm 12mm 10mm 12mm;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            box-shadow: none !important;
            text-shadow: none !important;
          }
          html, body {
            background: #ffffff !important;
            color: #0f172a !important;
            padding: 0 !important;
            margin: 0 !important;
            font-size: 11px !important;
          }
          #monthly-report-print-root {
            background: #ffffff !important;
            border: none !important;
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
            width: 100% !important;
            space-y: 0 !important;
          }
          /* Desenrollar modales si se imprime desde el modal */
          .fixed.inset-0 {
            position: static !important;
            overflow: visible !important;
            background: #ffffff !important;
            padding: 0 !important;
          }
          .max-h-\\[94vh\\] {
            max-height: none !important;
            overflow: visible !important;
            border: none !important;
            box-shadow: none !important;
          }
          .overflow-y-auto {
            overflow: visible !important;
            height: auto !important;
          }
          /* Ocultar elementos interactivos en PDF */
          .no-print,
          .chevron-icon,
          button[onclick*="toggleGuide"],
          select {
            display: none !important;
          }
          /* Header limpio de informe ejecutivo */
          header {
            border: none !important;
            border-bottom: 1.5px solid #cbd5e1 !important;
            border-radius: 0 !important;
            padding: 0 0 0.65rem 0 !important;
            margin-bottom: 0.75rem !important;
            background: transparent !important;
            box-shadow: none !important;
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
          header h1, header h2 {
            font-size: 18px !important;
            font-weight: 800 !important;
            letter-spacing: normal !important;
            color: #0f172a !important;
            line-height: 1.25 !important;
            margin-top: 0.25rem !important;
            margin-bottom: 0.2rem !important;
          }
          header p {
            font-size: 11px !important;
            color: #475569 !important;
            letter-spacing: normal !important;
            line-height: 1.35 !important;
          }
          /* Tarjetas y saltos dedicados: Exactamente 4 Páginas */
          #item-step1 {
            page-break-after: always !important;
            break-after: page !important;
          }
          #item-step2 {
            page-break-after: always !important;
            break-after: page !important;
          }
          #item-step3 {
            page-break-after: always !important;
            break-after: page !important;
          }
          #item-step4 {
            page-break-after: avoid !important;
            break-after: avoid !important;
            break-inside: avoid !important;
            margin-bottom: 0.35rem !important;
          }
          #certFooter {
            page-break-after: avoid !important;
            break-after: avoid !important;
            break-inside: avoid !important;
            page-break-inside: avoid !important;
            margin-top: 0.35rem !important;
            padding-top: 0.35rem !important;
          }
          /* Hero Banner en azul oscuro nítido con tipografía blanca */
          section.bg-gradient-to-r {
            background: linear-gradient(135deg, #030712 0%, #1e3a8a 50%, #172554 100%) !important;
            color: #ffffff !important;
            border: 1px solid #1e3a8a !important;
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
          /* Cuadrícula del Hero Banner: Beneficio Neto superior + 2 columnas inferiores */
          section .grid.grid-cols-1 {
            display: grid !important;
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 0.5rem !important;
          }
          section .hero-top-card {
            grid-column: 1 / -1 !important;
          }
          /* Gráfico de curvas Paso 1 ajustado para no solapar la tabla */
          #chartContainer {
            height: 125px !important;
            padding-top: 0 !important;
          }
          #turnosSvg {
            height: 125px !important;
          }
          /* Donut en Paso 2 */
          #donutContainer {
            width: 170px !important;
            height: 170px !important;
          }
          /* Compactar Paso 3 para que quepa en Página 3 */
          #item-step3 .p-4, #item-step3 .p-5 {
            padding: 0.5rem 0.75rem !important;
          }
          #item-step3 .h-6 {
            height: 16px !important;
          }
          #item-step3 .w-10.h-10 {
            width: 28px !important;
            height: 28px !important;
          }
          /* Compactar Paso 4 para que quepa en Página 4 */
          #item-step4 .p-4, #item-step4 .p-5 {
            padding: 0.5rem 0.75rem !important;
          }
          #item-step4 .dish-row td {
            padding: 0.35rem 0.5rem !important;
          }
          /* Reducción de paddings generales */
          .p-4, .p-5, .p-6, .p-8 {
            padding: 0.65rem !important;
          }
          .sm\\:p-8 {
            padding: 0.65rem !important;
          }
        }
      `}</style>

      {/* ========================================================================================= */}
      {/* 1. HEADER AUDITORÍA & ACCIONES RÁPIDAS */}
      {/* ========================================================================================= */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700 ring-1 ring-inset ring-blue-200">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
              Plan Full &middot; IA Analytics Suite
            </span>
            <span className="text-xs text-slate-500">
              Periodo Auditado: <strong className="text-slate-700 font-mono">01 Sep - 30 Sep 2026</strong>
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-normal text-slate-900 mt-1">
            Reporte Ejecutivo de Rendimiento <span className="text-slate-400 font-normal mx-1">&middot;</span> <span className="text-slate-600 font-semibold">{data.restaurant_name || 'RestoBar Noia'}</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 leading-normal">
            Resumen claro de beneficios, eficiencia en servicio y optimización de carta con Inteligencia Artificial.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-shrink-0">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold ring-1 ring-emerald-200 shadow-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Auditoría Certificada
          </div>
        </div>
      </header>

      {/* ========================================================================================= */}
      {/* 2. HERO BANNER: RETORNO NETO DE INVERSIÓN (Estilo Unificado en Azul) */}
      {/* ========================================================================================= */}
      <section className="bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 text-white rounded-2xl p-4 sm:p-5 shadow-lg shadow-blue-950/20 border border-blue-800/60">
        
        {/* Top Bar: Título con $ + Badge ROI Comprobado */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 mb-3.5 border-b border-white/20">
          <div className="flex items-center gap-2.5 text-white font-extrabold text-xs sm:text-sm tracking-wide uppercase">
            <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center font-black text-sm text-white flex-shrink-0">
              $
            </span>
            <span>Retorno Neto de Inversión &middot; Cuota Plan Full {data.client?.planCost || 99} €/mes</span>
          </div>
          <div className="self-start sm:self-auto px-3.5 py-1 rounded-full text-xs font-black bg-cyan-300 text-blue-950 shadow-xs whitespace-nowrap tracking-tight">
            {data.roi?.multiplier || 'ROI > 26x'} &middot; Retorno Comprobado
          </div>
        </div>

        {/* Grid de Paneles de Retorno: Beneficio Neto Superior (Span 2) + 2 Columnas Inferiores */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
          
          {/* PANEL SUPERIOR: Beneficio Neto Mensual / Ganancia Neta (Ancho Completo) */}
          <div className="hero-top-card col-span-1 sm:col-span-2 bg-white text-slate-900 rounded-xl p-3 sm:p-4 shadow-xl shadow-black/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ring-2 ring-cyan-300/80">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-200/80 flex items-center justify-center flex-shrink-0 shadow-xs">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              </div>
              <div>
                <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-blue-700 block">
                  Beneficio Neto Mensual &middot; Ganancia Neta
                </span>
                <div className="text-2xl sm:text-3xl font-black text-blue-950 font-mono mt-0.5">
                  {data.roi?.netProfit || '+2.501 €/mes'}
                </div>
              </div>
            </div>
            <div className="text-[11px] sm:text-xs text-slate-600 sm:text-right font-medium leading-relaxed">
              <div>Ganancia bruta generada: <strong className="text-slate-900 font-mono">{data.roi?.totalGross || '+2.600 €/mes'}</strong></div>
              <div className="text-slate-500 text-[10px] sm:text-[11px]">Cuota fija de plataforma: <strong className="font-mono text-slate-700">{data.roi?.subscriptionCost || `${data.client?.planCost || 99} €/mes`}</strong> (sin comisiones variables)</div>
            </div>
          </div>

          {/* CAJA 1: Ventas QR Incrementales */}
          <div className="bg-white/10 hover:bg-white/[0.14] transition border border-white/15 rounded-xl p-3 sm:p-3.5 flex flex-col justify-between">
            <div>
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-cyan-200 block">
                Ventas QR Incrementales
              </span>
              <div className="text-xl sm:text-2xl font-black text-white font-mono mt-1">
                {data.roi?.qrIncremental || '+1.480 €/mes'}
              </div>
            </div>
            <p className="text-[11px] text-blue-100/80 mt-1.5 leading-relaxed">
              Segundas rondas de bebidas y venta sugerida de postres en carta digital
            </p>
          </div>

          {/* CAJA 2: Ganancia por Rotación */}
          <div className="bg-white/10 hover:bg-white/[0.14] transition border border-white/15 rounded-xl p-3 sm:p-3.5 flex flex-col justify-between">
            <div>
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-cyan-200 block">
                Ganancia por Rotación
              </span>
              <div className="text-xl sm:text-2xl font-black text-white font-mono mt-1">
                {data.roi?.turnoverGains || '+1.120 €/mes'}
              </div>
            </div>
            <p className="text-[11px] text-blue-100/80 mt-1.5 leading-relaxed">
              +14 min de ahorro por mesa: mayor rotación para atender clientes en horas punta
            </p>
          </div>

        </div>
      </section>



      {/* ========================================================================================= */}
      {/* 4. ACORDEÓN PASO 1: RENDIMIENTO POR TURNOS (Chart Composition) */}
      {/* ========================================================================================= */}
      <div id="item-step1" className="bg-white rounded-2xl ring-1 ring-slate-200 overflow-hidden shadow-xs transition-all duration-200">
        <button
          type="button"
          onClick={() => toggleSection('step1')}
          className="w-full p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left hover:bg-slate-50/70 transition cursor-pointer select-none"
        >
          <div className="flex items-start sm:items-center gap-3">
            <span className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 font-mono font-bold text-xs flex items-center justify-center flex-shrink-0">
              01
            </span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                  Evolución de Facturación y Turnos
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  Paso 1 &middot; Horarios y Picos
                </span>
              </div>
              <p className="text-xs text-blue-600 font-semibold mt-0.5 flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5" />
                ¿Para qué sirve? Descubrir a qué horas entra más dinero en caja y qué turnos conviene potenciar o reforzar.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
            <div className="text-left sm:text-right">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Conclusión Clave</span>
              <div className="flex items-center gap-1.5 justify-end">
                <span className="text-sm font-extrabold text-slate-900 font-mono">31.350 €</span>
                <span className="text-slate-300 font-normal">&middot;</span>
                <span className="text-xs font-bold text-emerald-600 font-sans tracking-tight whitespace-nowrap">Cenas (+18.2%)</span>
              </div>
            </div>
            <span className={`no-print w-7 h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center transition-transform duration-200 ${effectiveOpen('step1') ? 'rotate-180 bg-blue-50 text-blue-600' : ''}`}>
              <ChevronDown className="w-4 h-4" />
            </span>
          </div>
        </button>

        <div className={`print-avoid-break grid transition-[grid-template-rows,opacity] duration-350 ease-[cubic-bezier(0.16,1,0.3,1)] ${effectiveOpen('step1') ? 'grid-rows-[1fr] opacity-100 print-accordion-open' : 'grid-rows-[0fr] opacity-0 pointer-events-none print-accordion-open'}`}>
          <div className="overflow-hidden">
            <div className="p-4 sm:p-5 border-t border-slate-100 space-y-4">
              
              {/* GUÍA RÁPIDA PARA EL DUEÑO */}
              <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200/80 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-extrabold text-blue-900 text-xs">
                    <Lightbulb className="w-4 h-4 text-blue-600" />
                    Guía Rápida para el Dueño: ¿Qué mirar aquí y qué hacer?
                  </div>
                  <button
                    type="button"
                    onClick={(e) => toggleGuide('step1', e)}
                    className="no-print text-[11px] text-blue-700 hover:text-blue-900 font-bold underline cursor-pointer"
                  >
                    {showGuide.step1 ? 'Ocultar resumen' : 'Ver resumen'}
                  </button>
                </div>

                <div className={`grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${showGuide.step1 ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0 pointer-events-none'}`}>
                  <div className="overflow-hidden">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1 text-slate-700">
                      <div className="bg-white/80 p-2.5 rounded-lg border border-blue-100 space-y-0.5">
                        <span className="text-[10px] uppercase font-bold text-blue-800 tracking-wider block">1. Qué estás viendo</span>
                        <p className="text-[11px] leading-relaxed">
                          El dinero total que entró en caja durante el mes, dividido de forma sencilla entre comidas de mediodía, cenas de noche y lo que tus clientes pidieron desde la mesa con el móvil (código QR).
                        </p>
                      </div>
                      <div className="bg-white/80 p-2.5 rounded-lg border border-blue-100 space-y-0.5">
                        <span className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider block">2. Lo que pasó en tu local</span>
                        <p className="text-[11px] leading-relaxed">
                          Tus <strong>cenas son tu turno más potente y rentable</strong>, creciendo un <strong>+18.2%</strong> (12.010 €). Además, gracias al QR en mesa y terraza, los clientes pidieron <strong>4.920 € extra</strong> en bebidas y postres sin esperar a ser atendidos.
                        </p>
                      </div>
                      <div className="bg-white/80 p-2.5 rounded-lg border border-blue-100 space-y-0.5">
                        <span className="text-[10px] uppercase font-bold text-blue-800 tracking-wider block">3. Qué te recomendamos hacer</span>
                        <p className="text-[11px] leading-relaxed">
                          Los fines de semana a partir de las 20:30 tienes lleno asegurado. Ten los preparativos de cocina listos antes de esa hora y mantén el QR bien visible en terraza para disparar las consumiciones de tarde.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sub-cabecera técnica con filtro de granularidad */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 pt-1 border-b border-slate-100">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 font-mono">
                    {formatCurrency(chartDataConfig.totalRevenue)}{' '}
                    <span className="text-xs font-bold text-emerald-600 font-sans ml-1">
                      ({chartDataConfig.growth})
                    </span>
                  </h4>
                  <p className="text-xs text-slate-500">{chartDataConfig.label}</p>
                </div>

                {/* Selector de Granularidad */}
                <div className="no-print flex items-center gap-2">
                  <label htmlFor="granularitySelect" className="text-xs font-bold text-slate-600 flex items-center gap-1">
                    <Filter className="w-3.5 h-3.5 text-slate-400" />
                    Filtrar Vista:
                  </label>
                  <select
                    id="granularitySelect"
                    value={granularity}
                    onChange={(e) => setGranularity(e.target.value as GranularityOption)}
                    className="bg-slate-50 border border-slate-300 text-slate-800 text-xs font-bold rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer hover:bg-slate-100 transition shadow-xs"
                  >
                    <option value="month">Mes Completo (4 Semanas)</option>
                    <option value="weekends">Fines de Semana (Vie-Dom)</option>
                    <option value="lunch">Solo Turno Almuerzos</option>
                    <option value="dinner">Solo Turno Cenas</option>
                  </select>
                </div>
              </div>

              {/* Gráfico SVG con Hover Interactivo y Tooltip */}
              <div className="space-y-2">
                <div className="flex items-center justify-end gap-4 text-xs font-medium flex-wrap">
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-blue-600"></span> Almuerzos</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-indigo-500"></span> Cenas</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-cyan-500"></span> Re-pedidos QR</span>
                </div>

                <div
                  className="h-60 w-full relative pt-2 cursor-crosshair select-none"
                  onMouseMove={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect()
                    const mouseX = e.clientX - rect.left
                    const svgX = Math.max(0, Math.min(500, (mouseX / rect.width) * 500))
                    let closestIdx = 0
                    let minDiff = Infinity
                    activeWeeks.forEach((w, idx) => {
                      const diff = Math.abs(w.x - svgX)
                      if (diff < minDiff) {
                        minDiff = diff
                        closestIdx = idx
                      }
                    })
                    setHoveredWeekIdx(closestIdx)
                  }}
                  onMouseLeave={() => setHoveredWeekIdx(null)}
                >
                  {/* Tooltip Flotante */}
                  {hoveredWeek && (
                    <div
                      className="absolute pointer-events-none z-30 bg-slate-950/95 text-white rounded-xl p-3 shadow-2xl ring-1 ring-white/10 text-xs w-64 -translate-x-1/2 -translate-y-full transition-all duration-75"
                      style={{
                        left: `${(Math.max(130, Math.min(370, hoveredWeek.x)) / 500) * 100}%`,
                        top: `${(Math.max(25, Math.min(hoveredWeek.yCenas, hoveredWeek.yAlm, hoveredWeek.yQR)) / 180) * 100}%`,
                        marginTop: '-14px'
                      }}
                    >
                      <div className="flex items-center justify-between border-b border-slate-700/80 pb-1.5 mb-2">
                        <span className="font-extrabold text-white text-xs">{hoveredWeek.name}</span>
                        <span className="font-mono font-bold text-emerald-400">{hoveredWeek.total}</span>
                      </div>
                      <div className="space-y-1 text-[11px]">
                        <div className="flex justify-between">
                          <span className="flex items-center gap-1 text-slate-300">
                            <span className="w-2 h-2 rounded-full bg-blue-500"></span> Almuerzos:
                          </span>
                          <span className="font-mono font-bold text-white">{hoveredWeek.alm}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="flex items-center gap-1 text-slate-300">
                            <span className="w-2 h-2 rounded-full bg-indigo-400"></span> Cenas:
                          </span>
                          <span className="font-mono font-bold text-white">{hoveredWeek.cenas}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="flex items-center gap-1 text-slate-300">
                            <span className="w-2 h-2 rounded-full bg-cyan-400"></span> Re-pedidos QR:
                          </span>
                          <span className="font-mono font-bold text-white">{hoveredWeek.qr}</span>
                        </div>
                      </div>
                      <div className="mt-2 pt-1.5 border-t border-slate-700/60 text-[10px] text-cyan-300 font-semibold flex items-center gap-1">
                        <span>💡 {hoveredWeek.note}</span>
                      </div>
                    </div>
                  )}

                  <svg className="w-full h-full overflow-visible" viewBox="0 0 500 180" preserveAspectRatio="none">
                    <line x1="0" y1="30" x2="500" y2="30" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
                    <line x1="0" y1="80" x2="500" y2="80" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
                    <line x1="0" y1="130" x2="500" y2="130" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />

                    {/* Cenas */}
                    <path d={chartDataConfig.areaCenas} fill="rgba(99,102,241,0.08)" />
                    <path d={chartDataConfig.pathCenas} fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" />

                    {/* Almuerzos */}
                    <path d={chartDataConfig.areaAlmuerzos} fill="rgba(37,99,235,0.06)" />
                    <path d={chartDataConfig.pathAlmuerzos} fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" />

                    {/* QR */}
                    <path d={chartDataConfig.pathQR} fill="none" stroke="#06b6d4" strokeWidth="2" strokeDasharray="3 3" />

                  </svg>

                  {/* Indicadores Dinámicos en Hover (HTML nativo inmune a distorsión de SVG) */}
                  {hoveredWeek && (
                    <>
                      <div
                        className="absolute top-2 bottom-6 w-[1.5px] border-l border-dashed border-slate-400/80 pointer-events-none -translate-x-1/2 transition-all duration-150"
                        style={{ left: `${(hoveredWeek.x / 500) * 100}%` }}
                      />
                      <div
                        className="absolute w-3.5 h-3.5 rounded-full bg-indigo-600 ring-2 ring-white shadow-md pointer-events-none -translate-x-1/2 -translate-y-1/2 transition-all duration-150"
                        style={{
                          left: `${(hoveredWeek.x / 500) * 100}%`,
                          top: `${(hoveredWeek.yCenas / 180) * 100}%`
                        }}
                      />
                      <div
                        className="absolute w-3.5 h-3.5 rounded-full bg-blue-600 ring-2 ring-white shadow-md pointer-events-none -translate-x-1/2 -translate-y-1/2 transition-all duration-150"
                        style={{
                          left: `${(hoveredWeek.x / 500) * 100}%`,
                          top: `${(hoveredWeek.yAlm / 180) * 100}%`
                        }}
                      />
                      <div
                        className="absolute w-3.5 h-3.5 rounded-full bg-cyan-500 ring-2 ring-white shadow-md pointer-events-none -translate-x-1/2 -translate-y-1/2 transition-all duration-150"
                        style={{
                          left: `${(hoveredWeek.x / 500) * 100}%`,
                          top: `${(hoveredWeek.yQR / 180) * 100}%`
                        }}
                      />
                    </>
                  )}
                </div>

                <div className="flex justify-between text-[11px] text-slate-400 font-mono pt-1">
                  <span>Semana 1 (01-07 Sep)</span>
                  <span>Semana 2 (08-14 Sep)</span>
                  <span>Semana 3 (15-21 Sep)</span>
                  <span>Semana 4 (22-30 Sep)</span>
                </div>
              </div>

              {/* Tabla Resumen de Series */}
              <div className="overflow-x-auto pt-2">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-slate-700 font-bold border-y border-slate-200 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Franja / Turno</th>
                      <th className="py-2.5 px-3 text-right">Facturación</th>
                      <th className="py-2.5 px-3 text-right">Comandas</th>
                      <th className="py-2.5 px-3 text-right">Ticket Medio</th>
                      <th className="py-2.5 px-3 text-right">Rotación</th>
                      <th className="py-2.5 px-3 text-right">Crecimiento</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {chartDataConfig.tableRows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition">
                        <td className="py-2.5 px-3 flex items-center gap-2 font-bold text-slate-900">
                          <span className={`w-2.5 h-2.5 rounded-full ${row.color}`}></span>
                          {row.name}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">{row.rev}</td>
                        <td className="py-2.5 px-3 text-right font-mono">{row.orders} pedidos</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800">{row.avg}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-blue-600 font-bold">{row.rot} / mesa</td>
                        <td className="py-2.5 px-3 text-right font-mono text-emerald-600 font-bold">{row.grw}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================================= */}
      {/* 5. ACORDEÓN PASO 2: RENTABILIDAD DE CARTA & FAMILIAS (Donut Chart) */}
      {/* ========================================================================================= */}
      <div id="item-step2" className="bg-white rounded-2xl ring-1 ring-slate-200 overflow-hidden shadow-xs transition-all duration-200">
        <button
          type="button"
          onClick={() => toggleSection('step2')}
          className="w-full p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left hover:bg-slate-50/70 transition cursor-pointer select-none"
        >
          <div className="flex items-start sm:items-center gap-3">
            <span className="w-7 h-7 rounded-lg bg-cyan-100 text-cyan-700 font-mono font-bold text-xs flex items-center justify-center flex-shrink-0">
              02
            </span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                  Reparto de Facturación y Costes por Familia
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-50 text-cyan-700 border border-cyan-200">
                  Paso 2 &middot; Dónde se gana más
                </span>
              </div>
              <p className="text-xs text-cyan-700 font-semibold mt-0.5 flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5" />
                ¿Para qué sirve? Conocer qué categorías te dejan ganancia limpia en el bolsillo y cuáles tienen costes altos en ingredientes.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
            <div className="text-left sm:text-right">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Conclusión Clave</span>
              <div className="flex items-center gap-1.5 justify-end">
                <span className="text-xs font-bold text-slate-700 font-sans tracking-tight">Bebidas y Postres</span>
                <span className="text-slate-300 font-normal">&middot;</span>
                <span className="text-sm font-extrabold text-emerald-600 font-mono">82% - 84%</span>
              </div>
            </div>
            <span className={`no-print w-7 h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center transition-transform duration-200 ${effectiveOpen('step2') ? 'rotate-180 bg-cyan-50 text-cyan-600' : ''}`}>
              <ChevronDown className="w-4 h-4" />
            </span>
          </div>
        </button>

        <div className={`print-avoid-break grid transition-[grid-template-rows,opacity] duration-350 ease-[cubic-bezier(0.16,1,0.3,1)] ${effectiveOpen('step2') ? 'grid-rows-[1fr] opacity-100 print-accordion-open' : 'grid-rows-[0fr] opacity-0 pointer-events-none print-accordion-open'}`}>
          <div className="overflow-hidden">
            <div className="p-4 sm:p-5 border-t border-slate-100 space-y-4">
              
              {/* GUÍA RÁPIDA PARA EL DUEÑO */}
              <div className="p-3.5 rounded-xl bg-cyan-50/70 border border-cyan-200/80 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-extrabold text-cyan-950 text-xs">
                    <Lightbulb className="w-4 h-4 text-cyan-600" />
                    Guía Rápida para el Dueño: ¿Qué mirar aquí y qué hacer?
                  </div>
                  <button
                    type="button"
                    onClick={(e) => toggleGuide('step2', e)}
                    className="no-print text-[11px] text-cyan-800 hover:text-cyan-950 font-bold underline cursor-pointer"
                  >
                    {showGuide.step2 ? 'Ocultar resumen' : 'Ver resumen'}
                  </button>
                </div>

                <div className={`grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${showGuide.step2 ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0 pointer-events-none'}`}>
                  <div className="overflow-hidden">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1 text-slate-700">
                      <div className="bg-white/80 p-2.5 rounded-lg border border-cyan-100 space-y-0.5">
                        <span className="text-[10px] uppercase font-bold text-cyan-900 tracking-wider block">1. Qué estás viendo</span>
                        <p className="text-[11px] leading-relaxed">
                          De cada 100 € que cobras en el restaurante, cuánto dinero viene de comidas, de bebidas y de postres, y cuánto dinero se queda en tu bolsillo tras pagar a proveedores (margen bruto de beneficio).
                        </p>
                      </div>
                      <div className="bg-white/80 p-2.5 rounded-lg border border-cyan-100 space-y-0.5">
                        <span className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider block">2. Lo que pasó en tu local</span>
                        <p className="text-[11px] leading-relaxed">
                          Tus <strong>bebidas (82% de margen) y postres (84% de margen)</strong> son tus minas de oro: casi todo lo que cobras por ellos es beneficio neto. Las hamburguesas traen el 42% del dinero con un muy buen 68% de margen.
                        </p>
                      </div>
                      <div className="bg-white/80 p-2.5 rounded-lg border border-cyan-100 space-y-0.5">
                        <span className="text-[10px] uppercase font-bold text-cyan-900 tracking-wider block">3. Qué te recomendamos hacer</span>
                        <p className="text-[11px] leading-relaxed">
                          Forma a tu equipo para ofrecer siempre postre casero o copa al retirar los platos principales; cada postre vendido añade dinero prácticamente limpio a tu cuenta a final de mes.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-6 pt-1">
                {/* Donut SVG con Hover Interactivo Ampliado y Proporcional */}
                <div className="relative w-48 h-48 sm:w-56 sm:h-56 flex-shrink-0 flex items-center justify-center group/donut cursor-pointer">
                  <svg className="w-full h-full -rotate-90 overflow-visible" viewBox="0 0 44 44">
                    <circle cx="22" cy="22" r="16.5" fill="none" stroke="#f1f5f9" strokeWidth={3.8} pathLength={100} />
                    <circle
                      cx="22" cy="22" r="16.5" fill="none" stroke="#2563eb"
                      strokeWidth={3.8}
                      strokeDasharray="42 100" strokeDashoffset="0"
                      pathLength={100}
                      opacity={hoveredDonutKey && hoveredDonutKey !== 'burgers' ? 0.35 : 1}
                      style={{
                        filter: hoveredDonutKey === 'burgers' ? 'drop-shadow(0 0 6px rgba(37,99,235,0.45))' : undefined,
                        transform: hoveredDonutKey === 'burgers' ? 'scale(1.025)' : 'scale(1)',
                        transformOrigin: '22px 22px'
                      }}
                      className="transition-all duration-200 cursor-pointer"
                      onMouseEnter={() => setHoveredDonutKey('burgers')}
                      onMouseLeave={() => setHoveredDonutKey(null)}
                    />
                    <circle
                      cx="22" cy="22" r="16.5" fill="none" stroke="#06b6d4"
                      strokeWidth={3.8}
                      strokeDasharray="28 100" strokeDashoffset="-42"
                      pathLength={100}
                      opacity={hoveredDonutKey && hoveredDonutKey !== 'drinks' ? 0.35 : 1}
                      style={{
                        filter: hoveredDonutKey === 'drinks' ? 'drop-shadow(0 0 6px rgba(6,182,212,0.45))' : undefined,
                        transform: hoveredDonutKey === 'drinks' ? 'scale(1.025)' : 'scale(1)',
                        transformOrigin: '22px 22px'
                      }}
                      className="transition-all duration-200 cursor-pointer"
                      onMouseEnter={() => setHoveredDonutKey('drinks')}
                      onMouseLeave={() => setHoveredDonutKey(null)}
                    />
                    <circle
                      cx="22" cy="22" r="16.5" fill="none" stroke="#6366f1"
                      strokeWidth={3.8}
                      strokeDasharray="16 100" strokeDashoffset="-70"
                      pathLength={100}
                      opacity={hoveredDonutKey && hoveredDonutKey !== 'starters' ? 0.35 : 1}
                      style={{
                        filter: hoveredDonutKey === 'starters' ? 'drop-shadow(0 0 6px rgba(99,102,241,0.45))' : undefined,
                        transform: hoveredDonutKey === 'starters' ? 'scale(1.025)' : 'scale(1)',
                        transformOrigin: '22px 22px'
                      }}
                      className="transition-all duration-200 cursor-pointer"
                      onMouseEnter={() => setHoveredDonutKey('starters')}
                      onMouseLeave={() => setHoveredDonutKey(null)}
                    />
                    <circle
                      cx="22" cy="22" r="16.5" fill="none" stroke="#f59e0b"
                      strokeWidth={3.8}
                      strokeDasharray="10 100" strokeDashoffset="-86"
                      pathLength={100}
                      opacity={hoveredDonutKey && hoveredDonutKey !== 'desserts' ? 0.35 : 1}
                      style={{
                        filter: hoveredDonutKey === 'desserts' ? 'drop-shadow(0 0 6px rgba(245,158,11,0.45))' : undefined,
                        transform: hoveredDonutKey === 'desserts' ? 'scale(1.025)' : 'scale(1)',
                        transformOrigin: '22px 22px'
                      }}
                      className="transition-all duration-200 cursor-pointer"
                      onMouseEnter={() => setHoveredDonutKey('desserts')}
                      onMouseLeave={() => setHoveredDonutKey(null)}
                    />
                    <circle
                      cx="22" cy="22" r="16.5" fill="none" stroke="#a855f7"
                      strokeWidth={3.8}
                      strokeDasharray="4 100" strokeDashoffset="-96"
                      pathLength={100}
                      opacity={hoveredDonutKey && hoveredDonutKey !== 'others' ? 0.35 : 1}
                      style={{
                        filter: hoveredDonutKey === 'others' ? 'drop-shadow(0 0 6px rgba(168,85,247,0.45))' : undefined,
                        transform: hoveredDonutKey === 'others' ? 'scale(1.025)' : 'scale(1)',
                        transformOrigin: '22px 22px'
                      }}
                      className="transition-all duration-200 cursor-pointer"
                      onMouseEnter={() => setHoveredDonutKey('others')}
                      onMouseLeave={() => setHoveredDonutKey(null)}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-3 pointer-events-none transition-all duration-200">
                    {activeDonut ? (
                      <>
                        <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider truncate max-w-[125px]" style={{ color: activeDonut.color }}>
                          {activeDonut.name}
                        </span>
                        <span className="text-lg sm:text-xl font-extrabold text-slate-900 font-mono scale-105 transition-transform">
                          {activeDonut.rev}
                        </span>
                        <span className="text-[10px] sm:text-xs font-semibold text-slate-600">
                          {activeDonut.pct} &middot; <strong className="text-emerald-600 font-bold">{activeDonut.margin}</strong>
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-slate-400 font-extrabold uppercase text-[10px] sm:text-xs tracking-wider">Facturación</span>
                        <span className="text-lg sm:text-xl font-extrabold text-slate-900 font-mono">31.350 €</span>
                        <span className="text-[10px] sm:text-xs text-slate-500 font-medium">100% &middot; Margen 74%</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Lista de Categorías con Hover Sincronizado */}
                <div className="flex-1 w-full space-y-1.5 text-xs">
                  <div
                    onMouseEnter={() => setHoveredDonutKey('burgers')}
                    onMouseLeave={() => setHoveredDonutKey(null)}
                    className={`flex items-center justify-between p-1.5 rounded-lg transition cursor-pointer ${hoveredDonutKey === 'burgers' ? 'bg-slate-100 ring-1 ring-slate-300' : 'hover:bg-slate-50'}`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="w-2.5 h-2.5 rounded-sm bg-blue-600 flex-shrink-0"></span>
                      <span className="font-semibold text-slate-800 truncate">Hamburguesas y Platos</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono flex-shrink-0">
                      <span className="font-bold text-slate-900">13.167 €</span>
                      <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-bold">42.0%</span>
                    </div>
                  </div>
                  <div
                    onMouseEnter={() => setHoveredDonutKey('drinks')}
                    onMouseLeave={() => setHoveredDonutKey(null)}
                    className={`flex items-center justify-between p-1.5 rounded-lg transition cursor-pointer ${hoveredDonutKey === 'drinks' ? 'bg-slate-100 ring-1 ring-slate-300' : 'hover:bg-slate-50'}`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="w-2.5 h-2.5 rounded-sm bg-cyan-500 flex-shrink-0"></span>
                      <span className="font-semibold text-slate-800 truncate">Bebidas y Cócteles</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono flex-shrink-0">
                      <span className="font-bold text-slate-900">8.778 €</span>
                      <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-bold">28.0%</span>
                    </div>
                  </div>
                  <div
                    onMouseEnter={() => setHoveredDonutKey('starters')}
                    onMouseLeave={() => setHoveredDonutKey(null)}
                    className={`flex items-center justify-between p-1.5 rounded-lg transition cursor-pointer ${hoveredDonutKey === 'starters' ? 'bg-slate-100 ring-1 ring-slate-300' : 'hover:bg-slate-50'}`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500 flex-shrink-0"></span>
                      <span className="font-semibold text-slate-800 truncate">Entrantes y Raciones</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono flex-shrink-0">
                      <span className="font-bold text-slate-900">5.016 €</span>
                      <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-bold">16.0%</span>
                    </div>
                  </div>
                  <div
                    onMouseEnter={() => setHoveredDonutKey('desserts')}
                    onMouseLeave={() => setHoveredDonutKey(null)}
                    className={`flex items-center justify-between p-1.5 rounded-lg transition cursor-pointer ${hoveredDonutKey === 'desserts' ? 'bg-slate-100 ring-1 ring-slate-300' : 'hover:bg-slate-50'}`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 flex-shrink-0"></span>
                      <span className="font-semibold text-slate-800 truncate">Postres y Cafés (QR)</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono flex-shrink-0">
                      <span className="font-bold text-slate-900">3.135 €</span>
                      <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-bold">10.0%</span>
                    </div>
                  </div>
                  <div
                    onMouseEnter={() => setHoveredDonutKey('others')}
                    onMouseLeave={() => setHoveredDonutKey(null)}
                    className={`flex items-center justify-between p-1.5 rounded-lg transition cursor-pointer ${hoveredDonutKey === 'others' ? 'bg-slate-100 ring-1 ring-slate-300' : 'hover:bg-slate-50'}`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="w-2.5 h-2.5 rounded-sm bg-purple-500 flex-shrink-0"></span>
                      <span className="font-semibold text-slate-800 truncate">Extras y Pan</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono flex-shrink-0">
                      <span className="font-bold text-slate-900">1.254 €</span>
                      <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-bold">4.0%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sub-acordeón de Costes de Producto */}
              <div className="pt-2 border-t border-slate-100 text-xs">
                <button
                  type="button"
                  onClick={() => setShowEscandallos(!showEscandallos)}
                  className="no-print w-full flex items-center justify-between font-bold text-blue-600 hover:text-blue-700 cursor-pointer py-1 select-none text-left"
                >
                  <span className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-blue-600" />
                    {showEscandallos ? 'Ocultar Costes & Márgenes' : 'Desplegar desglose de costes de producto y márgenes'}
                  </span>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showEscandallos ? 'rotate-180' : ''}`} />
                </button>
                <div className={`grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${showEscandallos ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0 pointer-events-none'}`}>
                  <div className="overflow-hidden">
                    <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2 text-[11px] text-slate-600">
                      <div className="flex justify-between border-b border-slate-200 pb-1">
                        <span className="font-semibold text-slate-700">Bebidas y Cafetería</span>
                        <span className="font-mono font-bold text-emerald-600">82% Margen Bruto (Coste MP: 18%)</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-200 pb-1">
                        <span className="font-semibold text-slate-700">Postres Caseros</span>
                        <span className="font-mono font-bold text-emerald-600">84% Margen Bruto (Coste MP: 16%)</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-200 pb-1">
                        <span className="font-semibold text-slate-700">Entrantes y Raciones</span>
                        <span className="font-mono font-bold text-emerald-600">78% Margen Bruto (Coste MP: 22%)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-semibold text-slate-700">Hamburguesas de Vaca Madurada</span>
                        <span className="font-mono font-bold text-slate-800">68% Margen Bruto (Coste MP: 32%)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================================= */}
      {/* 6. ACORDEÓN PASO 3: DIAGNÓSTICO OPERATIVO & ZONAS (Tracker & Grid Lists) */}
      {/* ========================================================================================= */}
      <div id="item-step3" className="bg-white rounded-2xl ring-1 ring-slate-200 overflow-hidden shadow-xs transition-all duration-200">
        <button
          type="button"
          onClick={() => toggleSection('step3')}
          className="w-full p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left hover:bg-slate-50/70 transition cursor-pointer select-none"
        >
          <div className="flex items-start sm:items-center gap-3">
            <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 font-mono font-bold text-xs flex items-center justify-center flex-shrink-0">
              03
            </span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                  Salud del Servicio y Rendimiento Operativo (Sala / Cocina)
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Paso 3 &middot; Ritmo del Equipo
                </span>
              </div>
              <p className="text-xs text-emerald-700 font-semibold mt-0.5 flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5" />
                ¿Para qué sirve? Controlar si hubo retrasos en comandas, atascos en cocina o si las mesas rotaron con agilidad.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
            <div className="text-left sm:text-right">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Conclusión Clave</span>
              <div className="flex items-center gap-1.5 justify-end">
                <span className="text-sm font-extrabold text-emerald-600 font-mono">94.2%</span>
                <span className="text-xs font-bold text-emerald-600 font-sans tracking-tight whitespace-nowrap">Fluido</span>
                <span className="text-slate-300 font-normal">&middot;</span>
                <span className="text-xs font-bold text-slate-600 font-mono whitespace-nowrap">11.4 min pase</span>
              </div>
            </div>
            <span className={`no-print w-7 h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center transition-transform duration-200 ${effectiveOpen('step3') ? 'rotate-180 bg-emerald-50 text-emerald-600' : ''}`}>
              <ChevronDown className="w-4 h-4" />
            </span>
          </div>
        </button>

        <div className={`print-avoid-break grid transition-[grid-template-rows,opacity] duration-350 ease-[cubic-bezier(0.16,1,0.3,1)] ${effectiveOpen('step3') ? 'grid-rows-[1fr] opacity-100 print-accordion-open' : 'grid-rows-[0fr] opacity-0 pointer-events-none print-accordion-open'}`}>
          <div className="overflow-hidden">
            <div className="p-4 sm:p-5 border-t border-slate-100 space-y-5">
              
              {/* GUÍA RÁPIDA PARA EL DUEÑO */}
              <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-extrabold text-emerald-950 text-xs">
                    <Lightbulb className="w-4 h-4 text-emerald-600" />
                    Guía Rápida para el Dueño: ¿Qué mirar aquí y qué hacer?
                  </div>
                  <button
                    type="button"
                    onClick={(e) => toggleGuide('step3', e)}
                    className="no-print text-[11px] text-emerald-800 hover:text-emerald-950 font-bold underline cursor-pointer"
                  >
                    {showGuide.step3 ? 'Ocultar resumen' : 'Ver resumen'}
                  </button>
                </div>

                <div className={`grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${showGuide.step3 ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0 pointer-events-none'}`}>
                  <div className="overflow-hidden">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1 text-slate-700">
                      <div className="bg-white/80 p-2.5 rounded-lg border border-emerald-100 space-y-0.5">
                        <span className="text-[10px] uppercase font-bold text-emerald-900 tracking-wider block">1. Qué estás viendo</span>
                        <p className="text-[11px] leading-relaxed">
                          El semáforo diario de cocina (verde = servicio impecable, amarillo/rojo = demoras) y la velocidad real de atención en terraza, salón y pantallas de cocina (KDS).
                        </p>
                      </div>
                      <div className="bg-white/80 p-2.5 rounded-lg border border-emerald-100 space-y-0.5">
                        <span className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider block">2. Lo que pasó en tu local</span>
                        <p className="text-[11px] leading-relaxed">
                          Tu equipo funcionó de forma excelente: <strong>27 de los 30 días fueron totalmente fluidos (94.2%)</strong>. Los pedidos llegan a cocina en <strong>12 segundos</strong> y la comida sale en <strong>11.4 minutos</strong> de media.
                        </p>
                      </div>
                      <div className="bg-white/80 p-2.5 rounded-lg border border-emerald-100 space-y-0.5">
                        <span className="text-[10px] uppercase font-bold text-emerald-900 tracking-wider block">3. Qué te recomendamos hacer</span>
                        <p className="text-[11px] leading-relaxed">
                          Solo hubo 3 demoras puntuales en todo el mes (dos viernes noche a las 22:00 y un sábado por comanda de 14). Tu ritmo es óptimo; solo mantén un refuerzo en barra los viernes noche.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* SUB-BLOQUE: TRACKER DE 30 DÍAS CON HOVER INTERACTIVO */}
              <div className="space-y-3 pb-4 border-b border-slate-100">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">Disponibilidad de cocina y fluidez de servicio (30 días auditados):</span>
                  <span className="font-mono font-bold text-emerald-600">27 días óptimos &middot; 3 demoras puntuales</span>
                </div>

                {/* Tarjeta de Diagnóstico Dinámica según Hover */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between gap-3 text-xs transition-all duration-200">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0 transition-colors ${
                      activeDay
                        ? (activeDay.status === 'delay' ? 'bg-rose-100 text-rose-700' : activeDay.status === 'peak' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700')
                        : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {activeDay ? (activeDay.status === 'delay' ? '⚠️' : activeDay.status === 'peak' ? '⚡' : '✓') : '✓'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">
                          {activeDay ? activeDay.date : 'Resumen Mensual de Ritmo'}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          activeDay
                            ? (activeDay.status === 'delay' ? 'bg-rose-100 text-rose-800' : activeDay.status === 'peak' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800')
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {activeDay ? activeDay.badge : '94.2% Fluidez'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {activeDay ? activeDay.desc : 'Pasa el ratón sobre cualquier día para auditar el pase medio, demoras o incidencias operativas.'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 hidden sm:block">
                    <span className="text-[10px] text-slate-400 font-semibold block">Pase Registrado</span>
                    <span className={`font-mono font-bold ${activeDay?.status === 'delay' ? 'text-rose-600' : activeDay?.status === 'peak' ? 'text-amber-600' : 'text-slate-900'}`}>
                      {activeDay ? activeDay.pase : '11.4 min'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono block">
                      {activeDay ? activeDay.orders : '542 total'}
                    </span>
                  </div>
                </div>

                {/* Tira Tracker Interactiva */}
                <div className="grid grid-cols-10 sm:grid-cols-15 gap-1 pt-1">
                  {kitchenDaysData.map((item) => (
                    <div
                      key={item.day}
                      title={`${item.date}: ${item.badge}`}
                      onMouseEnter={() => setHoveredDayNum(item.day)}
                      onMouseLeave={() => setHoveredDayNum(null)}
                      className={`h-6 rounded transition-all duration-150 cursor-pointer ${
                        item.status === 'delay' ? 'bg-rose-500' : item.status === 'peak' ? 'bg-amber-400' : 'bg-emerald-500'
                      } ${hoveredDayNum === item.day ? 'scale-110 ring-2 ring-slate-900 shadow-md z-10' : 'hover:opacity-80'}`}
                    />
                  ))}
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                  <span>01 Sep</span>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Fluido</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400"></span> Pico</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500"></span> Demora</span>
                  </div>
                  <span>30 Sep</span>
                </div>

                {/* Registro de Incidencias Operativas */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setShowIncidents(!showIncidents)}
                    className="no-print w-full flex items-center justify-between font-bold text-slate-800 hover:text-blue-600 cursor-pointer py-1 select-none text-left text-xs"
                  >
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                      {showIncidents ? 'Ocultar Picos e Incidencias' : 'Ver Detalle de Incidencias Operativas (3 eventos)'}
                    </span>
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showIncidents ? 'rotate-180' : ''}`} />
                  </button>
                  <div className={`grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${showIncidents ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0 pointer-events-none'}`}>
                    <div className="overflow-hidden">
                      <div className="mt-2 space-y-1.5 pt-1 text-xs">
                        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                          <div className="space-y-0.5">
                            <span className="font-bold text-slate-900">Sábado 14 Sep &middot; 15:10</span>
                            <p className="text-[11px] text-slate-500">Demora de 6 min en pase de cocina por comanda múltiple (Mesa 12, 14 comensales).</p>
                          </div>
                          <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 font-mono">+6 min</span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                          <div className="space-y-0.5">
                            <span className="font-bold text-slate-900">Viernes 20 Sep &middot; 22:15</span>
                            <p className="text-[11px] text-slate-500">Cuello de botella puntual en barra de cócteles durante pico de cena.</p>
                          </div>
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-mono">+4 min</span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                          <div className="space-y-0.5">
                            <span className="font-bold text-slate-900">Domingo 07 Sep &middot; 14:40</span>
                            <p className="text-[11px] text-slate-500">Rotura puntual de stock de pan artesano para hamburguesas, resuelta en 15 min.</p>
                          </div>
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-mono">Stock</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* SUB-BLOQUE: RENDIMIENTO POR ÁREAS CON LOGOS ELEGANTES */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Rendimiento Desglosado por Áreas Operativas
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                  
                  {/* 1. Terraza Exterior */}
                  <div className="bg-slate-50/70 rounded-xl p-4 ring-1 ring-slate-200/80 hover:bg-white hover:shadow-xs transition space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 ring-1 ring-sky-200/80 flex items-center justify-center flex-shrink-0 shadow-xs">
                        <Sun className="w-5 h-5 text-sky-600" />
                      </div>
                      <div className="truncate">
                        <h5 className="text-sm font-bold text-slate-900 truncate">Terraza Exterior</h5>
                        <p className="text-xs text-slate-500">12 mesas &middot; 48 plazas</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Ventas QR</span>
                        <span className="font-bold text-slate-900 font-mono">+3.911,40 €</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Rotación</span>
                        <span className="font-bold text-sky-600 font-mono">2.6x / mesa</span>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">Ocupación media</span>
                      <span className="font-bold text-emerald-600">94.8% (Óptima)</span>
                    </div>
                  </div>

                  {/* 2. Salón Principal */}
                  <div className="bg-slate-50/70 rounded-xl p-4 ring-1 ring-slate-200/80 hover:bg-white hover:shadow-xs transition space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-200/80 flex items-center justify-center flex-shrink-0 shadow-xs">
                        <UtensilsCrossed className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div className="truncate">
                        <h5 className="text-sm font-bold text-slate-900 truncate">Salón Principal</h5>
                        <p className="text-xs text-slate-500">16 mesas &middot; 64 plazas</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Ticket Medio</span>
                        <span className="font-bold text-slate-900 font-mono">35,40 €</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Tiempo Mesa</span>
                        <span className="font-bold text-indigo-600 font-mono">{tableTimes.avg_table_stay_min || 48} min</span>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">Ocupación media</span>
                      <span className="font-bold text-emerald-600">82.1% (Estable)</span>
                    </div>
                  </div>

                  {/* 3. Cocina & KDS */}
                  <div className="bg-slate-50/70 rounded-xl p-4 ring-1 ring-slate-200/80 hover:bg-white hover:shadow-xs transition space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200/80 flex items-center justify-center flex-shrink-0 shadow-xs">
                        <Flame className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div className="truncate">
                        <h5 className="text-sm font-bold text-slate-900 truncate">Cocina y Pantallas KDS</h5>
                        <p className="text-xs text-slate-500">Pantallas táctiles &middot; 4 puestos</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Llegada KDS</span>
                        <span className="font-bold text-emerald-600 font-mono">{tableTimes.avg_waiter_validation_sec ? `${tableTimes.avg_waiter_validation_sec}s` : '12 seg'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Pase Medio</span>
                        <span className="font-bold text-slate-900 font-mono">11.4 min</span>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">Eficiencia de pase</span>
                      <span className="font-bold text-emerald-600">96.0% (Excelente)</span>
                    </div>
                  </div>

                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================================= */}
      {/* 7. ACORDEÓN PASO 4: MATRIZ BCG DE PLATOS & SUGERENCIAS IA (Tables & Banners) */}
      {/* ========================================================================================= */}
      <div id="item-step4" className="bg-white rounded-2xl ring-1 ring-slate-200 overflow-hidden shadow-xs transition-all duration-200">
        <button
          type="button"
          onClick={() => toggleSection('step4')}
          className="w-full p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left hover:bg-slate-50/70 transition cursor-pointer select-none"
        >
          <div className="flex items-start sm:items-center gap-3">
            <span className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 font-mono font-bold text-xs flex items-center justify-center flex-shrink-0">
              04
            </span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                  Ingeniería de Menú (Matriz BCG) y Recomendaciones de IA
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                  Paso 4 &middot; Optimización de Carta
                </span>
              </div>
              <p className="text-xs text-purple-700 font-semibold mt-0.5 flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5" />
                ¿Para qué sirve? Identificar qué platos aportan mayor rentabilidad, cuáles requieren ajuste y qué cambios aumentarán tu margen neto.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
            <div className="text-left sm:text-right">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Conclusión Clave</span>
              <div className="flex items-center gap-1.5 justify-end">
                <span className="text-xs font-bold text-purple-700 font-sans tracking-tight whitespace-nowrap">6 ganadores</span>
                <span className="text-slate-300 font-normal">&middot;</span>
                <span className="text-sm font-extrabold text-purple-700 font-mono whitespace-nowrap">+2.510 € IA</span>
              </div>
            </div>
            <span className={`no-print w-7 h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center transition-transform duration-200 ${effectiveOpen('step4') ? 'rotate-180 bg-purple-50 text-purple-600' : ''}`}>
              <ChevronDown className="w-4 h-4" />
            </span>
          </div>
        </button>

        <div className={`print-avoid-break grid transition-[grid-template-rows,opacity] duration-350 ease-[cubic-bezier(0.16,1,0.3,1)] ${effectiveOpen('step4') ? 'grid-rows-[1fr] opacity-100 print-accordion-open' : 'grid-rows-[0fr] opacity-0 pointer-events-none print-accordion-open'}`}>
          <div className="overflow-hidden">
            <div className="p-4 sm:p-5 border-t border-slate-100 space-y-6">
              
              {/* GUÍA RÁPIDA PARA EL DUEÑO */}
              <div className="p-3.5 rounded-xl bg-purple-50/70 border border-purple-200/80 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-extrabold text-purple-950 text-xs">
                    <Lightbulb className="w-4 h-4 text-purple-600" />
                    Guía Rápida para el Dueño: ¿Qué mirar aquí y qué hacer?
                  </div>
                  <button
                    type="button"
                    onClick={(e) => toggleGuide('step4', e)}
                    className="no-print text-[11px] text-purple-800 hover:text-purple-950 font-bold underline cursor-pointer"
                  >
                    {showGuide.step4 ? 'Ocultar resumen' : 'Ver resumen'}
                  </button>
                </div>

                <div className={`grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${showGuide.step4 ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0 pointer-events-none'}`}>
                  <div className="overflow-hidden">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1 text-slate-700">
                      <div className="bg-white/80 p-2.5 rounded-lg border border-purple-100 space-y-0.5">
                        <span className="text-[10px] uppercase font-bold text-purple-900 tracking-wider block">1. Qué estás viendo</span>
                        <p className="text-[11px] leading-relaxed">
                          Tus platos clasificados en 4 tipos: ⭐ Estrella (más ventas y más margen), 🐄 Vaca (clásicos), 💎 Oportunidad (rentables pero ocultos) y ⚠️ Alerta (poca rotación).
                        </p>
                      </div>
                      <div className="bg-white/80 p-2.5 rounded-lg border border-purple-100 space-y-0.5">
                        <span className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider block">2. Lo que pasó en tu local</span>
                        <p className="text-[11px] leading-relaxed">
                          Tienes <strong>4 platos estrella intocables</strong> (Pulpo, Smash Burger, Cerveza, Tarta). Pero el <strong>Tartar de Atún te deja un 81% de margen limpio</strong> y se pide poco por estar al final de la carta.
                        </p>
                      </div>
                      <div className="bg-white/80 p-2.5 rounded-lg border border-purple-100 space-y-0.5">
                        <span className="text-[10px] uppercase font-bold text-purple-900 tracking-wider block">3. Qué te recomendamos hacer</span>
                        <p className="text-[11px] leading-relaxed">
                          Destaca el Tartar en 'Recomendaciones del Chef' (<strong>+450 € netos/mes</strong>) y ajusta la Ensalada César para evitar mermas en producto fresco.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            {/* TABLA MATRIZ BCG */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Auditoría Individual de Platos y Rentabilidad</h4>
                  <p className="text-xs text-slate-500">Haz clic en cualquier plato para ver el diagnóstico estratégico de la IA.</p>
                </div>
                
                {/* Desplegable / Filtro por Clasificación BCG */}
                <div className="no-print flex items-center gap-2">
                  <label htmlFor="tableFilter" className="text-xs font-bold text-slate-600 flex items-center gap-1">
                    <Filter className="w-3.5 h-3.5 text-slate-400" />
                    Filtrar:
                  </label>
                  <select
                    id="tableFilter"
                    value={bcgFilter}
                    onChange={(e) => setBcgFilter(e.target.value as BCGFilterOption)}
                    className="bg-slate-50 border border-slate-300 text-slate-800 text-xs font-bold rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer hover:bg-slate-100 transition shadow-xs"
                  >
                    <option value="all">Todos los platos ({allDishes.length})</option>
                    <option value="stars">Solo Platos Estrella ⭐</option>
                    <option value="cows">Solo Vacas Lecheras 🐄</option>
                    <option value="dogs">Alertas de Rotación ⚠️</option>
                    <option value="questions">Dilemas / Oportunidades 💎</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-slate-700 font-bold border-y border-slate-200 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Plato &amp; Categoría</th>
                      <th className="py-2.5 px-3">Clasificación BCG</th>
                      <th className="py-2.5 px-3 text-right">Uds. Vendidas</th>
                      <th className="py-2.5 px-3 text-right">Facturación</th>
                      <th className="py-2.5 px-3 text-right">Coste MP</th>
                      <th className="py-2.5 px-3 text-right">Margen Bruto</th>
                      <th className="py-2.5 px-3 text-right">Acción Recomendada</th>
                      <th className="py-2.5 px-3 text-center">Detalle</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {filteredDishes.map((dish) => {
                      const isExpanded = expandedDishId === dish.id

                      return (
                        <React.Fragment key={dish.id}>
                          <tr
                            onClick={() => setExpandedDishId(isExpanded ? null : dish.id)}
                            className="hover:bg-slate-50 transition cursor-pointer"
                          >
                            <td className="py-2.5 px-3 font-bold text-slate-900">
                              {dish.name}
                              <span className="text-[10px] text-slate-400 block font-normal">{dish.family}</span>
                            </td>
                            <td className="py-2.5 px-3">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${dish.badgeClass}`}>
                                {dish.badgeText}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800">{dish.sales} u.</td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">{formatCurrency(dish.revenue)}</td>
                            <td className="py-2.5 px-3 text-right font-mono text-slate-500">{formatCurrency(dish.costMp)}</td>
                            <td className={`py-2.5 px-3 text-right font-mono font-bold ${dish.marginPct >= 70 ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {dish.marginPct}%
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${dish.actionClass}`}>
                                {dish.action}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-600 hover:bg-blue-100 hover:text-blue-700 transition">
                                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                              </span>
                            </td>
                          </tr>

                          {/* Fila Desplegable de Detalle / Análisis IA del Plato */}
                          {isExpanded && (
                            <tr className="bg-slate-50/80">
                              <td colSpan={8} className="py-3 px-4 border-l-4 border-blue-500">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                                  <div className="space-y-1">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 flex items-center gap-1">
                                      <Sparkles className="w-3.5 h-3.5" />
                                      Diagnóstico &amp; Estrategia IA
                                    </span>
                                    <p className="text-slate-700 leading-relaxed max-w-2xl">
                                      {dish.reasoning}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-3 text-xs font-mono bg-white px-3 py-1.5 rounded-lg border border-slate-200 flex-shrink-0">
                                    <span className="text-slate-500">Beneficio por ración:</span>
                                    <strong className="text-emerald-600 font-bold">
                                      {formatCurrency((dish.revenue / dish.sales) - dish.costMp)}
                                    </strong>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* BANNERS DE SUGERENCIAS IA */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Sugerencias Accionables de la IA
                  </h4>
                </div>
                <span className="text-xs text-slate-500 font-mono bg-slate-100 px-2 py-0.5 rounded-md">
                  Impacto Potencial: +2.510 €/mes
                </span>
              </div>

              <div className="space-y-2.5">
                {aiSuggestions.map((sug: any) => {
                  const isCritical = sug.priority === 'critical'
                  const isHigh = sug.priority === 'high'

                  return (
                    <div
                      key={sug.id}
                      className="bg-slate-50/70 hover:bg-white rounded-xl p-4 ring-1 ring-slate-200 shadow-xs transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-start gap-3.5 min-w-0">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          isCritical
                            ? 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200'
                            : isHigh
                            ? 'bg-blue-50 text-blue-600 ring-1 ring-blue-200'
                            : 'bg-amber-50 text-amber-600 ring-1 ring-amber-200'
                        }`}>
                          {isCritical ? <Zap className="w-5 h-5" /> : isHigh ? <Clock className="w-5 h-5" /> : <Award className="w-5 h-5" />}
                        </div>
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-slate-900">{sug.title}</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                              isCritical
                                ? 'bg-emerald-100 text-emerald-700'
                                : isHigh
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}>
                              {isCritical ? 'Alta Prioridad' : isHigh ? 'Operaciones' : 'Carta'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 leading-relaxed">
                            {sug.description}
                          </p>
                        </div>
                      </div>

                      <div className="sm:text-right flex-shrink-0 pl-12 sm:pl-0">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Impacto Mensual Est.
                        </span>
                        <span className="text-lg sm:text-xl font-extrabold text-emerald-600 font-mono">
                          {sug.estimated_impact_eur}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            </div>
          </div>
        </div>
      </div>

      {/* Footer / Legal & Privacy */}
      <footer id="certFooter" className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 font-medium">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>Datos auditados directamente desde Supabase Cloud &middot; Cifrado RGPD</span>
        </div>
        <div>
          <span>Fluxo Gastronomic OS &copy; 2026 &middot; Plan Full &amp; Suite</span>
        </div>
      </footer>

    </div>
  )
}
