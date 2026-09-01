'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  ShieldCheck,
  CheckCircle2,
  Tv2,
  Sparkles,
  ArrowRight,
  Play,
  Check,
  ChevronRight,
  Layers,
  ExternalLink,
  X,
  TrendingUp,
  Clock,
  Smartphone,
  ChefHat,
  Utensils,
  Wine,
  Coffee,
  Flame,
  MapPin,
  Printer
} from 'lucide-react'
import { FluxoLogo } from '@/components/common/FluxoLogo'
import { PilotRequestModal } from '@/components/landing/PilotRequestModal'

const WHATSAPP_PHONE = process.env.NEXT_PUBLIC_WHATSAPP_PHONE || '5493585187430'
const DEFAULT_WHATSAPP_MSG = '¡Hola! Me comunico desde la web de Fluxo. Me gustaría solicitar el Piloto Gratuito de 14 Días (a 0€) para mi restaurante.'

const getWhatsAppUrl = (planName?: string) => {
  const msg = planName
    ? `¡Hola! Me comunico desde la web de Fluxo. Me gustaría solicitar el Piloto Gratuito de 14 Días (a 0€) para el ${planName}.`
    : DEFAULT_WHATSAPP_MSG
  const encoded = encodeURIComponent(msg)
  return `https://wa.me/${WHATSAPP_PHONE}?text=${encoded}`
}

export default function LandingPage() {
  const [popupsBlocked, setPopupsBlocked] = useState(false)
  const [selectedDemoSlug, setSelectedDemoSlug] = useState('burger-gourmet')
  const [isPilotModalOpen, setIsPilotModalOpen] = useState(false)
  const [selectedPlanForModal, setSelectedPlanForModal] = useState('Plan Full (Recomendado)')

  const handleOpenPilotModal = (plan = 'Plan Full (Recomendado)') => {
    setSelectedPlanForModal(plan)
    setIsPilotModalOpen(true)
  }

  const handleOpenDashboardsForSlug = (slug: string, table = 7) => {
    const w1 = window.open(`/menu/${slug}?table=${table}`, '_blank')
    const w2 = window.open(`/staff/comandero/${slug}`, '_blank')
    const w3 = window.open(`/staff/kitchen/${slug}`, '_blank')

    if (!w2 || !w3) {
      setPopupsBlocked(true)
    }
  }

  const handleOpenAllDashboards = () => {
    handleOpenDashboardsForSlug(selectedDemoSlug, 7)
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 selection:bg-cyan-500 selection:text-slate-950 font-sans antialiased flex flex-col">
      
      {/* ── 1. HEADER / NAVBAR DE MARCA ── */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-900/80 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          
          {/* Isotipo & Marca Fluxo */}
          <Link href="/" className="flex items-center gap-3 group">
            <FluxoLogo size={42} showText={true} />
          </Link>

          {/* Navegación Rápida */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-400">
            <a href="#funcionalidades" className="hover:text-cyan-400 transition-colors">
              Funcionalidades
            </a>
            <a href="#precios" className="hover:text-cyan-400 transition-colors">
              Planes &amp; Precios
            </a>
            <a href="#contacto" className="hover:text-cyan-400 transition-colors">
              Piloto 14 Días
            </a>
          </nav>

          {/* CTA Superior: Abre los 3 Dashboards del Simulador */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleOpenAllDashboards}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 sm:px-5 sm:py-2.5 rounded-lg text-xs sm:text-sm font-extrabold bg-cyan-500 text-slate-950 hover:bg-cyan-400 shadow-md shadow-cyan-500/20 hover:shadow-cyan-500/40 transition-all active:scale-95 cursor-pointer"
            >
              <span>Probar Simulador</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        
        {/* ── 2. HERO SECTION ── */}
        <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28 border-b border-slate-800/80">
          
          {/* Luces de Fondo (Ambient Glows) */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-cyan-500/15 via-blue-600/10 to-transparent blur-[120px] pointer-events-none" />
          <div className="absolute top-1/2 right-10 w-72 h-72 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
              
              {/* Columna Izquierda: Copy Principal */}
              <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
                
                {/* Badge Superior */}
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-black uppercase tracking-widest">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>SISTEMA OPERATIVO GASTRONÓMICO B2B</span>
                </div>

                {/* Titular Principal */}
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1]">
                  Tecnología invisible.{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                    Gastronomía sin pausas.
                  </span>
                </h1>

                {/* Subtítulo de Control & Velocidad */}
                <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
                  Control total, paridad analógica y máxima velocidad gerencial. 
                  Sincroniza en tiempo real al comensal en mesa, el comandero del mozo y 
                  el pase de cocina sin alterar los tiempos ni la dinámica humana de tu restaurante.
                </p>

                {/* Acciones del Hero */}
                <div className="pt-4 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                  <button
                    type="button"
                    onClick={handleOpenAllDashboards}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl text-base font-black bg-cyan-500 text-slate-950 hover:bg-cyan-400 shadow-xl shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all active:scale-95 cursor-pointer"
                  >
                    <span>PROBAR SIMULADOR</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>

                  <button
                    type="button"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl text-base font-bold text-slate-400 bg-slate-800/40 border border-slate-700/60 cursor-default"
                  >
                    <Play className="w-4 h-4 fill-slate-500 text-slate-500" />
                    <span>Ver Video Explicativo</span>
                  </button>
                </div>

                {/* Micro-puntos de confianza */}
                <div className="pt-4 flex items-center justify-center lg:justify-start gap-6 text-xs text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-emerald-500" /> Sin permanencia
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-emerald-500" /> Setup inicial incluido
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-emerald-500" /> 100% Mobile Web
                  </span>
                </div>
              </div>

              {/* Columna Derecha: Mockup para Video Pitch */}
              <div className="lg:col-span-5 w-full">
                <div className="relative group">
                  {/* Resplandor del marco */}
                  <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 to-blue-600/20 rounded-2xl blur-xl opacity-40 transition duration-500" />
                  
                  {/* Contenedor Mockup para Video Pitch */}
                  <div 
                    className="relative aspect-video bg-gradient-to-br from-slate-800 to-slate-850 rounded-2xl border-2 border-slate-700 overflow-hidden flex flex-col items-center justify-center p-6 text-center shadow-2xl cursor-default transition-all"
                  >
                    {/* Badge de Video */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950/80 border border-slate-700 text-[10px] font-bold text-slate-400">
                      <Tv2 className="w-3.5 h-3.5" />
                      <span>Video Explicativo</span>
                    </div>

                    {/* Botón Play */}
                    <div className="w-16 h-16 rounded-full bg-slate-700/40 border-2 border-slate-600/50 flex items-center justify-center text-slate-400 mb-3 shadow-lg">
                      <Play className="w-7 h-7 ml-1 fill-current" />
                    </div>

                    <p className="text-sm sm:text-base font-extrabold text-white tracking-wide">
                      ¿Cómo se conectan los Dashboards?
                    </p>
                    <p className="text-xs text-slate-300 mt-1 max-w-xs leading-relaxed">
                      Descubre cómo viaja la orden desde la carta del móvil hasta el Comandero del Mozo y el Monitor de Cocina.
                    </p>

                    <div className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
                      <span>Próximamente disponible</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ── 2.5 PERFILES DEMO EN PRODUCCIÓN (NOIA, GALICIA) ── */}
        <section className="py-16 bg-slate-950/80 border-b border-slate-800 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-black uppercase tracking-widest">
                <Sparkles className="w-3.5 h-3.5" />
                <span>DEMOSTRACIÓN INTERACTIVA</span>
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
                Pruébalo en 3 tipos de restaurantes reales
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
                Accede a la carta digital del comensal, al comandero de sala y a la pantalla de cocina con productos y flujos de trabajo auténticos.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
              
              {/* PERFIL 1: BURGER GOURMET NOIA */}
              <div className="bg-slate-900/90 border-2 border-blue-500/40 hover:border-blue-400 rounded-2xl p-6 flex flex-col justify-between shadow-2xl transition-all duration-300 group hover:-translate-y-1">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider bg-blue-500/15 text-blue-400 border border-blue-500/30 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> Noia &middot; Alameda
                    </span>
                    <span className="text-xl">🍔</span>
                  </div>

                  <div>
                    <h3 className="text-lg font-black text-white group-hover:text-blue-400 transition-colors">
                      Burger Gourmet Noia
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5 font-medium">
                      Smash Burgers, Vaca Rubia Gallega &amp; Cervezas 1906
                    </p>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    Carta con modificadores de punto de carne, extras de queso San Simón ahumado, combos con patatas rústicas y sugerencias automáticas de postre y café.
                  </p>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-semibold border border-slate-700">Smash Burgers</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-semibold border border-slate-700">Rubia Gallega</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-semibold border border-slate-700">Estrella 1906</span>
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-800 space-y-3">
                  <div className="grid grid-cols-3 gap-2 text-[11px] font-bold">
                    <Link
                      href="/menu/burger-gourmet?table=7"
                      target="_blank"
                      className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-center text-slate-200 hover:text-white border border-slate-700 transition-colors flex flex-col items-center gap-1 shadow-xs"
                    >
                      <Smartphone className="w-4 h-4 text-blue-400" />
                      <span>Carta #7</span>
                    </Link>
                    <Link
                      href="/staff/comandero/burger-gourmet"
                      target="_blank"
                      className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-center text-slate-200 hover:text-white border border-slate-700 transition-colors flex flex-col items-center gap-1 shadow-xs"
                    >
                      <Utensils className="w-4 h-4 text-emerald-400" />
                      <span>Mozo</span>
                    </Link>
                    <Link
                      href="/staff/kitchen/burger-gourmet"
                      target="_blank"
                      className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-center text-slate-200 hover:text-white border border-slate-700 transition-colors flex flex-col items-center gap-1 shadow-xs"
                    >
                      <ChefHat className="w-4 h-4 text-amber-400" />
                      <span>Cocina</span>
                    </Link>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenDashboardsForSlug('burger-gourmet', 7)}
                    className="w-full py-3 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/20 active:scale-95 transition-all"
                  >
                    <span>Abrir Circuito Completo</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* PERFIL 2: TAPERÍA CASCO ANTIGO */}
              <div className="bg-slate-900/90 border-2 border-red-500/40 hover:border-red-400 rounded-2xl p-6 flex flex-col justify-between shadow-2xl transition-all duration-300 group hover:-translate-y-1">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider bg-red-500/15 text-red-400 border border-red-500/30 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> Noia &middot; Casco Histórico
                    </span>
                    <span className="text-xl">🐙</span>
                  </div>

                  <div>
                    <h3 className="text-lg font-black text-white group-hover:text-red-400 transition-colors">
                      Tapería Casco Antigo
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5 font-medium">
                      Pulpo á Feira, Zamburiñas da Ría, Pementos &amp; Vinos
                    </p>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    Especializada en tapas y raciones tradicionales gallegas, tablas de quesos D.O. (Arzúa, San Simón, Tetilla) y maridajes con Albariño y Mencía de la Ribeira Sacra.
                  </p>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-semibold border border-slate-700">Pulpo á Feira</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-semibold border border-slate-700">Zamburiñas Noia</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-semibold border border-slate-700">Albariño D.O.</span>
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-800 space-y-3">
                  <div className="grid grid-cols-3 gap-2 text-[11px] font-bold">
                    <Link
                      href="/menu/taperia-casco-antigo?table=4"
                      target="_blank"
                      className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-center text-slate-200 hover:text-white border border-slate-700 transition-colors flex flex-col items-center gap-1 shadow-xs"
                    >
                      <Smartphone className="w-4 h-4 text-red-400" />
                      <span>Carta #4</span>
                    </Link>
                    <Link
                      href="/staff/comandero/taperia-casco-antigo"
                      target="_blank"
                      className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-center text-slate-200 hover:text-white border border-slate-700 transition-colors flex flex-col items-center gap-1 shadow-xs"
                    >
                      <Utensils className="w-4 h-4 text-emerald-400" />
                      <span>Mozo</span>
                    </Link>
                    <Link
                      href="/staff/kitchen/taperia-casco-antigo"
                      target="_blank"
                      className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-center text-slate-200 hover:text-white border border-slate-700 transition-colors flex flex-col items-center gap-1 shadow-xs"
                    >
                      <ChefHat className="w-4 h-4 text-amber-400" />
                      <span>Cocina</span>
                    </Link>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenDashboardsForSlug('taperia-casco-antigo', 4)}
                    className="w-full py-3 px-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-red-600/20 active:scale-95 transition-all"
                  >
                    <span>Abrir Circuito Completo</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* PERFIL 3: TERRAZA MALECÓN */}
              <div className="bg-slate-900/90 border-2 border-teal-500/40 hover:border-teal-400 rounded-2xl p-6 flex flex-col justify-between shadow-2xl transition-all duration-300 group hover:-translate-y-1">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider bg-teal-500/15 text-teal-400 border border-teal-500/30 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> Noia &middot; Paseo Marítimo
                    </span>
                    <span className="text-xl">🍸</span>
                  </div>

                  <div>
                    <h3 className="text-lg font-black text-white group-hover:text-teal-400 transition-colors">
                      Terraza Malecón
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5 font-medium">
                      Café de Especialidad, Tardeo, Cócteles &amp; Vermús
                    </p>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    Concepto de alta rotación para terraza frente a la ría: tostas de masa madre, vermús St. Petroni, cócteles de autor, gin tonics Nordés y tartas de queso fluidas.
                  </p>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-semibold border border-slate-700">Flat White</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-semibold border border-slate-700">Gin Nordés</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-semibold border border-slate-700">Vermú Petroni</span>
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-800 space-y-3">
                  <div className="grid grid-cols-3 gap-2 text-[11px] font-bold">
                    <Link
                      href="/menu/terraza-malecon?table=12"
                      target="_blank"
                      className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-center text-slate-200 hover:text-white border border-slate-700 transition-colors flex flex-col items-center gap-1 shadow-xs"
                    >
                      <Smartphone className="w-4 h-4 text-teal-400" />
                      <span>Carta #12</span>
                    </Link>
                    <Link
                      href="/staff/comandero/terraza-malecon"
                      target="_blank"
                      className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-center text-slate-200 hover:text-white border border-slate-700 transition-colors flex flex-col items-center gap-1 shadow-xs"
                    >
                      <Utensils className="w-4 h-4 text-emerald-400" />
                      <span>Mozo</span>
                    </Link>
                    <Link
                      href="/staff/kitchen/terraza-malecon"
                      target="_blank"
                      className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-center text-slate-200 hover:text-white border border-slate-700 transition-colors flex flex-col items-center gap-1 shadow-xs"
                    >
                      <ChefHat className="w-4 h-4 text-amber-400" />
                      <span>Cocina</span>
                    </Link>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenDashboardsForSlug('terraza-malecon', 12)}
                    className="w-full py-3 px-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-teal-600/20 active:scale-95 transition-all"
                  >
                    <span>Abrir Circuito Completo</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

            </div>

          </div>
        </section>

        {/* ── 3. IMPACTO REAL & MÉTRICAS DE NEGOCIO (3 PILARES) ── */}
        <section id="funcionalidades" className="py-20 bg-slate-900/60 border-t border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
              <span className="text-xs font-black uppercase tracking-wider text-cyan-400">
                Diseñado para el Dueño Gastronómico
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                Tres pilares que transforman la rentabilidad de tu local
              </h2>
              <p className="text-sm sm:text-base text-slate-400">
                Menos costes en hardware, rotación de mesas más ágil y un control milimétrico desde la sala hasta el pase de cocina.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              
              {/* Tarjeta 1: Venta Visual & Carta Viva (1.1 + 3.2) */}
              <div className="bg-slate-800/60 hover:bg-slate-800/90 border border-slate-700/70 hover:border-cyan-500/40 rounded-2xl p-8 flex flex-col justify-between transition-all duration-300 shadow-xl group">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-14 h-14 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                      <TrendingUp className="w-7 h-7" />
                    </div>
                    <span className="px-3 py-1 rounded-full text-[11px] font-black tracking-wider uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      +22% Ticket Medio
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold text-white group-hover:text-cyan-400 transition-colors">
                      Venta Visual &amp; Carta Viva
                    </h3>
                    <p className="text-xs text-cyan-400 font-bold uppercase tracking-wider mt-1">
                      El dolor de vender poco margen y quedarte sin stock
                    </p>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    En una carta tradicional de papel la gente no suele pedir postres ni segundas rondas porque el mozo está ocupado. Con fotos en alta resolución y sugerencias automáticas, el consumo por impulso se dispara. Y si un plato estrella se agota a mitad de servicio, lo desactivas o cambias precios en 5 segundos desde tu móvil.
                  </p>
                </div>

                <ul className="pt-6 space-y-2.5 border-t border-slate-700/50 mt-6 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span><strong>+22% en consumo</strong> de bebidas, postres y cafés por estímulo visual</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span><strong>Pausa platos en 5 segundos</strong> sin tachar cartas ni reimprimir nada</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span>Sugerencias automáticas de maridajes y guarniciones con 1 toque</span>
                  </li>
                </ul>
              </div>

              {/* Tarjeta 2: Mozo Ágil & Cero Terminales Caras (2.3 + 3.1) */}
              <div className="bg-slate-800/60 hover:bg-slate-800/90 border border-slate-700/70 hover:border-cyan-500/40 rounded-2xl p-8 flex flex-col justify-between transition-all duration-300 shadow-xl group">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-14 h-14 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
                      <Smartphone className="w-7 h-7" />
                    </div>
                    <span className="px-3 py-1 rounded-full text-[11px] font-black tracking-wider uppercase bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                      +40% Capacidad
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold text-white group-hover:text-cyan-400 transition-colors">
                      Mozo Ágil &amp; Cero Hardware Caro
                    </h3>
                    <p className="text-xs text-cyan-400 font-bold uppercase tracking-wider mt-1">
                      El dolor de terminales de miles de euros y mozos quemados
                    </p>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    Olvídate de comprar terminales propietarias costosas que si se caen o rompen detienen tu servicio. Fluxo es 100% Mobile Web: tus mozos usan cualquier smartphone (Android o iPhone) o tablet común. Dejan de correr anotando papelitos para convertirse en anfitriones que atienden más mesas con menos fatiga.
                  </p>
                </div>

                <ul className="pt-6 space-y-2.5 border-t border-slate-700/50 mt-6 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                    <span><strong>Cero gasto en hardware:</strong> funciona en los móviles de tu equipo</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                    <span>El personal atiende hasta un <strong>+40% más de mesas</strong> sin estrés</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                    <span>Comandero móvil con mapa de mesas y filtro anti-fraude en salón</span>
                  </li>
                </ul>
              </div>

              {/* Tarjeta 3: Cocina en Silencio y Sincronizada (2.2) */}
              <div className="bg-slate-800/60 hover:bg-slate-800/90 border border-slate-700/70 hover:border-cyan-500/40 rounded-2xl p-8 flex flex-col justify-between transition-all duration-300 shadow-xl group">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-14 h-14 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                      <ChefHat className="w-7 h-7" />
                    </div>
                    <span className="px-3 py-1 rounded-full text-[11px] font-black tracking-wider uppercase bg-amber-500/15 text-amber-400 border border-amber-500/30">
                      0 Gritos en Cocina
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold text-white group-hover:text-cyan-400 transition-colors">
                      Cocina Sincronizada &amp; Cero Papelitos
                    </h3>
                    <p className="text-xs text-cyan-400 font-bold uppercase tracking-wider mt-1">
                      El dolor de comandas pisadas, letra ilegible y platos fríos
                    </p>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    La comanda viaja de la mesa o el comandero al pase de cocina en 0.2 segundos. Despliega un monitor KDS en cualquier Smart TV o tablet con botones táctiles masivos (&gt;70px) y alertas sonoras de timbre, o conecta tus impresoras térmicas de tickets existentes vía ESC/POS sin cables raros.
                  </p>
                </div>

                <ul className="pt-6 space-y-2.5 border-t border-slate-700/50 mt-6 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <span><strong>Monitor táctil KDS industrial:</strong> avanza comandas incluso con guantes</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <span><strong>Avisos sonoros de timbre:</strong> cocina enterada al instante de cada marcha</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <span>Compatibilidad estándar con impresoras térmicas de tickets (ESC/POS)</span>
                  </li>
                </ul>
              </div>

            </div>

          </div>
        </section>

        {/* ── 4. BLOQUE DE PRECIOS (3 TARJETAS) ── */}
        <section id="precios" className="py-20 border-t border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
              <span className="text-xs font-black uppercase tracking-wider text-cyan-400">
                Inversión Clara y Transparente
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                Planes adaptados al tamaño de tu sala
              </h2>
              <p className="text-sm sm:text-base text-slate-400">
                Sin comisiones por comanda, sin hardware propietario obligatorio y con cancelación libre en cualquier momento.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch pt-4">
              
              {/* Tarjeta 1: Plan Carta */}
              <div 
                onClick={() => handleOpenPilotModal('Plan Carta (39€)')}
                className="bg-slate-800/60 border border-slate-700 hover:border-emerald-500 rounded-3xl p-8 flex flex-col justify-between shadow-xl hover:shadow-2xl hover:shadow-emerald-500/15 transition-all duration-300 group relative cursor-pointer"
              >
                
                {/* Badge Flotante Promocional */}
                <div className="absolute -top-3.5 right-6 px-3.5 py-1 rounded-full bg-slate-900 border border-emerald-400 text-emerald-300 text-[11px] font-black tracking-wide shadow-md flex items-center gap-1.5 z-20">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>14 DÍAS DE PRUEBA 0€</span>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-black text-white group-hover:text-emerald-300 transition-colors">Plan Carta</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Para locales que buscan carta interactiva y agilidad de servicio en mesa.
                    </p>
                  </div>

                  {/* BLOQUE DE PRECIO */}
                  {/* 📱 VISTA MÓVIL: Directa y clara con precio oficial y badge de prueba */}
                  <div className="sm:hidden py-2 space-y-1.5">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-black text-white tracking-tight tabular-nums">39€</span>
                      <span className="text-slate-400 text-sm font-semibold">/mes + IVA</span>
                    </div>
                    <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-md">
                      <Sparkles className="w-3 h-3 flex-shrink-0" />
                      <span>14 días de prueba a 0€ &middot; Sin compromiso</span>
                    </div>
                  </div>

                  {/* 💻 VISTA PC / DESKTOP: Efecto Hover interactivo con precio tachado a 0€ */}
                  <div className="hidden sm:block py-2 min-h-[72px]">
                    {/* Estado Normal (sin hover) */}
                    <div className="group-hover:hidden transition-all duration-300">
                      <div className="flex items-baseline gap-2">
                        <span className="text-5xl font-black text-white tracking-tight tabular-nums">39€</span>
                        <span className="text-slate-400 text-sm font-semibold">/mes + IVA</span>
                      </div>
                      <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-md mt-1.5">
                        <Sparkles className="w-3 h-3 flex-shrink-0" />
                        <span>14 días de prueba a 0€ &middot; Sin compromiso</span>
                      </div>
                    </div>

                    {/* Estado Hover (al pasar el cursor en PC) */}
                    <div className="hidden group-hover:block transition-all duration-300 animate-in fade-in zoom-in-95">
                      <div className="flex items-baseline gap-2.5">
                        <span className="text-3xl font-bold text-slate-500 line-through tabular-nums">39€</span>
                        <span className="text-5xl font-black text-emerald-400 tracking-tight tabular-nums">0€</span>
                        <span className="text-emerald-300 text-sm font-extrabold uppercase tracking-wide">14 DÍAS</span>
                      </div>
                      <div className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-300 bg-emerald-500/20 border border-emerald-400/30 px-2.5 py-0.5 rounded-md mt-1.5 shadow-xs">
                        <Sparkles className="w-3 h-3 text-emerald-400 animate-pulse" />
                        <span>¡Prueba gratuita de 14 días sin permanencia!</span>
                      </div>
                    </div>
                  </div>

                  <ul className="space-y-3 text-xs sm:text-sm text-slate-300">
                    <li className="flex items-start gap-2.5">
                      <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span>Carta digital interactiva QR autogestionable</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span>Modificadores estructurados (sin texto libre)</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span>Llamador con intención (Agua, Pan, Cuenta)</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span>Generador de cartelería QR para mesas</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span>Cumplimiento normativo europeo de alérgenos</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-8 w-full flex items-center justify-center">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleOpenPilotModal('Plan Carta (39€)')
                    }}
                    className="w-full h-14 rounded-2xl text-center text-xs sm:text-sm font-black text-slate-950 bg-emerald-400 hover:bg-emerald-300 shadow-lg shadow-emerald-500/25 border border-emerald-300 transition-all duration-300 flex items-center justify-center gap-2 active:scale-95 cursor-pointer leading-none"
                  >
                    <Sparkles className="w-4 h-4 flex-shrink-0" />
                    <span>Iniciar Prueba Gratis (14 Días)</span>
                  </button>
                </div>
              </div>

              {/* Tarjeta 2: Plan Sala */}
              <div 
                onClick={() => handleOpenPilotModal('Plan Sala (69€)')}
                className="bg-slate-800/60 border border-slate-700 hover:border-emerald-500 rounded-3xl p-8 flex flex-col justify-between shadow-xl hover:shadow-2xl hover:shadow-emerald-500/15 transition-all duration-300 group relative cursor-pointer"
              >
                
                {/* Badge Flotante Promocional */}
                <div className="absolute -top-3.5 right-6 px-3.5 py-1 rounded-full bg-slate-900 border border-emerald-400 text-emerald-300 text-[11px] font-black tracking-wide shadow-md flex items-center gap-1.5 z-20">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>14 DÍAS DE PRUEBA 0€</span>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-black text-white group-hover:text-emerald-300 transition-colors">Plan Sala</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Para restaurantes con camareros en sala y terraza que requieren control antifraude.
                    </p>
                  </div>

                  {/* BLOQUE DE PRECIO */}
                  {/* 📱 VISTA MÓVIL: Directa y clara con precio oficial y badge de prueba */}
                  <div className="sm:hidden py-2 space-y-1.5">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-black text-white tracking-tight tabular-nums">69€</span>
                      <span className="text-slate-400 text-sm font-semibold">/mes + IVA</span>
                    </div>
                    <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-md">
                      <Sparkles className="w-3 h-3 flex-shrink-0" />
                      <span>14 días de prueba a 0€ &middot; Sin compromiso</span>
                    </div>
                  </div>

                  {/* 💻 VISTA PC / DESKTOP: Efecto Hover interactivo con precio tachado a 0€ */}
                  <div className="hidden sm:block py-2 min-h-[72px]">
                    {/* Estado Normal (sin hover) */}
                    <div className="group-hover:hidden transition-all duration-300">
                      <div className="flex items-baseline gap-2">
                        <span className="text-5xl font-black text-white tracking-tight tabular-nums">69€</span>
                        <span className="text-slate-400 text-sm font-semibold">/mes + IVA</span>
                      </div>
                      <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-md mt-1.5">
                        <Sparkles className="w-3 h-3 flex-shrink-0" />
                        <span>14 días de prueba a 0€ &middot; Sin compromiso</span>
                      </div>
                    </div>

                    {/* Estado Hover (al pasar el cursor en PC) */}
                    <div className="hidden group-hover:block transition-all duration-300 animate-in fade-in zoom-in-95">
                      <div className="flex items-baseline gap-2.5">
                        <span className="text-3xl font-bold text-slate-500 line-through tabular-nums">69€</span>
                        <span className="text-5xl font-black text-emerald-400 tracking-tight tabular-nums">0€</span>
                        <span className="text-emerald-300 text-sm font-extrabold uppercase tracking-wide">14 DÍAS</span>
                      </div>
                      <div className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-300 bg-emerald-500/20 border border-emerald-400/30 px-2.5 py-0.5 rounded-md mt-1.5 shadow-xs">
                        <Sparkles className="w-3 h-3 text-emerald-400 animate-pulse" />
                        <span>¡Prueba gratuita de 14 días sin permanencia!</span>
                      </div>
                    </div>
                  </div>

                  <ul className="space-y-3 text-xs sm:text-sm text-slate-300">
                    <li className="flex items-start gap-2.5">
                      <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span><strong>Todo lo incluido en el Plan Carta</strong></span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span>Comandero móvil de mozos con validación obligatoria</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span>Filtro anti-fraude en mesa (Gatekeeper)</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span>Mapa de mesas y selector visual de salón</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span>Avisos de cobro por método (Datáfono o Efectivo)</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-8 w-full flex items-center justify-center">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleOpenPilotModal('Plan Sala (69€)')
                    }}
                    className="w-full h-14 rounded-2xl text-center text-xs sm:text-sm font-black text-slate-950 bg-emerald-400 hover:bg-emerald-300 shadow-lg shadow-emerald-500/25 border border-emerald-300 transition-all duration-300 flex items-center justify-center gap-2 active:scale-95 cursor-pointer leading-none"
                  >
                    <Sparkles className="w-4 h-4 flex-shrink-0" />
                    <span>Iniciar Prueba Gratis (14 Días)</span>
                  </button>
                </div>
              </div>

              {/* Tarjeta 3: Plan Full (DESTACADA CON BORDE CIAN BRILLANTE & BADGE RECOMENDADO) */}
              <div 
                onClick={() => handleOpenPilotModal('Plan Full (Recomendado)')}
                className="bg-slate-800/90 border-2 border-cyan-500 hover:border-emerald-400 rounded-3xl p-8 flex flex-col justify-between shadow-2xl shadow-cyan-500/20 hover:shadow-emerald-500/25 transition-all duration-300 group relative lg:-translate-y-2 cursor-pointer"
              >
                
                {/* Badge Recomendado / 14 Días */}
                <div className="absolute -top-3.5 right-6 px-3.5 py-1 rounded-full bg-cyan-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-md z-20 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Recomendado &middot; 14 DÍAS 0€</span>
                </div>

                <div className="space-y-6">
                  <div>
                    <div className="inline-flex items-center gap-1.5 text-cyan-400 group-hover:text-emerald-300 font-extrabold text-xs uppercase tracking-wider mb-1 transition-colors">
                      <Layers className="w-4 h-4" /> Circuito Completo
                    </div>
                    <h3 className="text-2xl font-black text-white group-hover:text-emerald-300 transition-colors">Plan Full</h3>
                    <p className="text-xs text-slate-300 mt-1">
                      Solución integral: Comensal + Sala + Pantalla KDS o Tiqueteras térmicas.
                    </p>
                  </div>

                  {/* BLOQUE DE PRECIO */}
                  {/* 📱 VISTA MÓVIL: Directa y clara con precio oficial y badge de prueba */}
                  <div className="sm:hidden py-2 space-y-1.5">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-black text-cyan-400 tracking-tight tabular-nums">99€</span>
                      <span className="text-slate-400 text-sm font-semibold">/mes + IVA</span>
                    </div>
                    <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-md">
                      <Sparkles className="w-3 h-3 flex-shrink-0" />
                      <span>14 días de prueba a 0€ &middot; Sin compromiso</span>
                    </div>
                  </div>

                  {/* 💻 VISTA PC / DESKTOP: Efecto Hover interactivo con precio tachado a 0€ */}
                  <div className="hidden sm:block py-2 min-h-[72px]">
                    {/* Estado Normal (sin hover) */}
                    <div className="group-hover:hidden transition-all duration-300">
                      <div className="flex items-baseline gap-2">
                        <span className="text-5xl font-black text-cyan-400 tracking-tight tabular-nums">99€</span>
                        <span className="text-slate-400 text-sm font-semibold">/mes + IVA</span>
                      </div>
                      <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-md mt-1.5">
                        <Sparkles className="w-3 h-3 flex-shrink-0" />
                        <span>14 días de prueba a 0€ &middot; Sin compromiso</span>
                      </div>
                    </div>

                    {/* Estado Hover (al pasar el cursor en PC) */}
                    <div className="hidden group-hover:block transition-all duration-300 animate-in fade-in zoom-in-95">
                      <div className="flex items-baseline gap-2.5">
                        <span className="text-3xl font-bold text-slate-500 line-through tabular-nums">99€</span>
                        <span className="text-5xl font-black text-cyan-400 tracking-tight tabular-nums">0€</span>
                        <span className="text-cyan-300 text-sm font-extrabold uppercase tracking-wide">14 DÍAS</span>
                      </div>
                      <div className="inline-flex items-center gap-1.5 text-xs font-black text-cyan-300 bg-cyan-500/20 border border-cyan-400/30 px-2.5 py-0.5 rounded-md mt-1.5 shadow-xs">
                        <Sparkles className="w-3 h-3 text-cyan-400 animate-pulse" />
                        <span>¡Prueba gratuita de 14 días sin permanencia!</span>
                      </div>
                    </div>
                  </div>

                  <ul className="space-y-3 text-xs sm:text-sm text-slate-200">
                    <li className="flex items-start gap-2.5">
                      <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span><strong>Todo lo del Plan Carta y Plan Sala</strong></span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span>Monitor KDS industrial con botones gigantes (&gt;70px)</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span>Alerta sonora de timbre al marchar comandas</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span>API compatible con Impresoras Térmicas ESC/POS</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span>Soporte prioritario y puesta en marcha garantizada</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-8 w-full flex items-center justify-center">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleOpenPilotModal('Plan Full (Recomendado)')
                    }}
                    className="w-full h-14 rounded-2xl text-center text-xs sm:text-sm font-black text-slate-950 bg-emerald-400 hover:bg-emerald-300 shadow-xl shadow-emerald-500/30 border border-emerald-300 transition-all duration-300 flex items-center justify-center gap-2 active:scale-95 cursor-pointer leading-none"
                  >
                    <Sparkles className="w-4 h-4 flex-shrink-0" />
                    <span>Iniciar Prueba Gratis (14 Días)</span>
                  </button>
                </div>
              </div>

            </div>

          </div>
        </section>

        {/* ── 5. CALL TO ACTION (CTA) FINAL ── */}
        <section id="contacto" className="py-20 bg-slate-900 border-t border-slate-800">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-gradient-to-b from-slate-800 to-slate-850 border border-slate-700 rounded-3xl p-8 sm:p-14 text-center space-y-6 relative overflow-hidden shadow-2xl">
              
              {/* Halo sutil de fondo */}
              <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 max-w-2xl mx-auto space-y-4">
                <span className="inline-block text-xs font-black uppercase tracking-widest text-cyan-400">
                  Desafío Piloto Sin Riesgo
                </span>
                
                <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                  Inicia hoy tu prueba piloto de 14 días a 0€
                </h2>

                <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                  No te preocupes por cargar platos, fotos ni alérgenos. 
                  <strong className="text-white"> El setup de tu carta y la puesta en marcha la hacemos nosotros:</strong> envíanos tu menú y en 24 horas lo tendrás activo en sala y terraza para medir el aumento real de ventas y rotación durante 14 días sin coste.
                </p>

                <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
                  <button
                    type="button"
                    onClick={() => handleOpenPilotModal('Plan Full (Recomendado)')}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-sm sm:text-base font-black bg-cyan-500 text-slate-950 hover:bg-cyan-400 shadow-xl shadow-cyan-500/30 transition-all active:scale-95 cursor-pointer"
                  >
                    <span>Solicitar Piloto de 14 Días a 0€</span>
                    <ChevronRight className="w-5 h-5" />
                  </button>

                  <a
                    href="/menu/burger-gourmet?table=7"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-6 py-4 rounded-xl text-sm sm:text-base font-bold text-slate-300 bg-slate-900/90 hover:bg-slate-900 border border-slate-700 hover:text-white transition-colors"
                  >
                    <span>Ver Prueba en Vivo</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>

                <p className="text-xs text-slate-400 pt-2">
                  0€ durante el piloto &middot; Sin tarjeta ni permanencia &middot; Soporte presencial incluido
                </p>
              </div>

            </div>
          </div>
        </section>

      </main>

      {/* AVISO FLOTANTE DE BLOQUEO DE POPUPS */}
      {popupsBlocked && (
        <aside 
          aria-label="Aviso de ventanas bloqueadas"
          className="fixed bottom-6 right-6 z-50 max-w-sm bg-slate-950/95 border-2 border-amber-500/80 rounded-2xl p-4 shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom-5"
        >
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center flex-shrink-0 mt-0.5">
              <ExternalLink className="w-4 h-4" />
            </div>
            <div className="space-y-1.5 flex-1">
              <h5 className="text-xs font-black text-white">¿Tu navegador bloqueó pestañas?</h5>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                El navegador abrió la carta del comensal, pero bloqueó las pantallas de mozo y cocina. Puedes abrirlas manualmente:
              </p>
              <div className="flex items-center gap-2 pt-1">
                <a
                  href="/staff/comandero/burger-gourmet"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[10px] font-bold text-cyan-400"
                >
                  Abrir Mozo
                </a>
                <a
                  href="/staff/kitchen/burger-gourmet"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[10px] font-bold text-cyan-400"
                >
                  Abrir Cocina
                </a>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setPopupsBlocked(false)}
              className="text-slate-500 hover:text-slate-300 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </aside>
      )}

      {/* ── 7. FOOTER ── */}
      <footer className="border-t border-slate-800/80 py-8 px-4 bg-slate-950 text-xs text-slate-400">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-3">
            <FluxoLogo size="sm" />
            <span className="font-bold text-slate-400">&middot; Sistema Gastronómico en Tiempo Real.</span>
          </div>

          <div className="flex items-center justify-center sm:justify-end gap-3 text-slate-400 flex-wrap">
            <Link 
              href="/legal" 
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-cyan-500/50 text-slate-300 hover:text-cyan-400 font-bold transition-all shadow-sm group"
            >
              <ShieldCheck className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
              <span>Aviso Legal &amp; RGPD</span>
            </Link>

            <Link 
              href="/api/printers/receipt?slug=burger-gourmet" 
              target="_blank" 
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-emerald-500/50 text-slate-300 hover:text-emerald-400 font-bold transition-all shadow-sm group"
            >
              <Printer className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
              <span>Simulador Ticket ESC/POS</span>
            </Link>
          </div>
        </div>
      </footer>

      {/* ── MODAL DE SOLICITUD DE PILOTO 14 DÍAS A 0€ ── */}
      <PilotRequestModal
        isOpen={isPilotModalOpen}
        onClose={() => setIsPilotModalOpen(false)}
        initialPlan={selectedPlanForModal}
        whatsAppPhone={WHATSAPP_PHONE}
      />

    </div>
  )
}
