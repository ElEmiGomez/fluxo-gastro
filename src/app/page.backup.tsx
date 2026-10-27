'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Check,
  ChevronRight,
  Layers,
  ExternalLink,
  X,
  TrendingUp,
  Smartphone,
  ChefHat,
  Eye,
  Star,
  Gift
} from 'lucide-react'
import { FluxoLogo } from '@/components/common/FluxoLogo'
import { PilotRequestModal } from '@/components/landing/PilotRequestModal'
import { MonthlyReportModal } from '@/components/analytics/MonthlyReportModal'
import { ScrollReveal } from '@/components/landing/ScrollReveal'
import { HeroAuroraBackground } from '@/components/landing/HeroAuroraBackground'

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
  const [isPilotModalOpen, setIsPilotModalOpen] = useState(false)
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const [selectedPlanForModal, setSelectedPlanForModal] = useState('Plan Full (Recomendado)')

  React.useEffect(() => {
    document.title = 'Fluxo - Gastronomic System'
  }, [])

  const handleOpenPilotModal = (plan = 'Plan Full (Recomendado)') => {
    setSelectedPlanForModal(plan)
    setIsPilotModalOpen(true)
  }

  const handleOpenAllDashboards = () => {
    const w1 = window.open('/menu/burger-gourmet?table=7', '_blank')
    const w2 = window.open('/staff/comandero/burger-gourmet?reset_auth=1', '_blank')
    const w3 = window.open('/staff/kitchen/burger-gourmet?reset_auth=1', '_blank')

    if (!w2 || !w3) {
      setPopupsBlocked(true)
    }
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
        
        {/* ── 2. HERO SECTION CENTRADO & LIMPIO (SIN BLOQUE ARTIFICIAL) ── */}
        <section className="relative overflow-hidden pt-16 pb-20 sm:pt-24 sm:pb-28 border-b border-slate-800/80">
          
          {/* Fondo Dinámico Aurora B2B */}
          <HeroAuroraBackground />

          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            <div className="max-w-3xl mx-auto space-y-6">
              
              {/* Badge Superior */}
              <ScrollReveal delay={80} distance={18}>
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-black uppercase tracking-widest">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  <span>SISTEMA OPERATIVO PARA BARES Y RESTAURANTES</span>
                </div>
              </ScrollReveal>

              {/* Titular Principal */}
              <ScrollReveal delay={180} distance={24}>
                <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.1]">
                  Tecnología invisible.{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                    Gastronomía sin pausas.
                  </span>
                </h1>
              </ScrollReveal>

              {/* Subtítulo de Control & Velocidad */}
              <ScrollReveal delay={280} distance={24}>
                <p className="text-base sm:text-lg lg:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed font-normal">
                  La agilidad del papel y boli de siempre, pero con la velocidad de la sincronización digital instantánea. Conecta a tus camareros en terraza con la barra y la cocina en tiempo real sin comprar TPVs caros.
                </p>
              </ScrollReveal>

              {/* Acciones del Hero */}
              <ScrollReveal delay={380} distance={24}>
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
                  <button
                    type="button"
                    onClick={() => handleOpenPilotModal('Plan Full (Recomendado)')}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl text-base font-black bg-cyan-500 text-slate-950 hover:bg-cyan-400 shadow-xl shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all active:scale-95 cursor-pointer"
                  >
                    <span>SOLICITAR PILOTO 14 DÍAS (0 €)</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenAllDashboards}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl text-sm sm:text-base font-bold text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-800 border border-slate-700/80 hover:border-cyan-500/40 transition-all active:scale-95 cursor-pointer group"
                  >
                    <span>Ver Demo Interactiva en Vivo</span>
                    <ArrowRight className="w-4 h-4 text-cyan-400 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </ScrollReveal>

              {/* Micro-puntos de confianza */}
              <ScrollReveal delay={480} distance={18}>
                <div className="pt-2 flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs sm:text-sm text-slate-400">
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
              </ScrollReveal>

            </div>
          </div>
        </section>

        {/* ── 3. IMPACTO REAL & MÉTRICAS DE NEGOCIO (3 PILARES) ── */}
        <section id="funcionalidades" className="py-20 bg-slate-900/60 border-t border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            <ScrollReveal distance={24}>
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
            </ScrollReveal>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              
              {/* Tarjeta 1: Carta QR Visual y Ventas Sugeridas */}
              <ScrollReveal delay={0} distance={32} className="flex flex-col h-full">
                <div className="bg-slate-800/60 hover:bg-slate-800/90 border border-slate-700/70 hover:border-cyan-500/40 rounded-2xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 shadow-xl group h-full">
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
                        Carta QR Visual y Ventas Sugeridas
                      </h3>
                      <p className="text-xs text-cyan-400 font-bold uppercase tracking-wider mt-1">
                        Aumenta el ticket medio sin presionar al comensal
                      </p>
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed">
                      Tus comensales piden segundas rondas de bebida y postres directamente desde el móvil. Bloquea platos agotados en 1 toque y cumple con la normativa europea de alérgenos al instante.
                    </p>
                  </div>

                  <ul className="pt-6 space-y-2.5 border-t border-slate-700/50 mt-6 text-xs text-slate-300">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      <span><strong>+22% en consumo:</strong> fotos de alta resolución que disparan el consumo por impulso.</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      <span><strong>Pausado en 5 segundos:</strong> agota platos en sala al instante sin reimprimir cartas.</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      <span><strong>Alérgenos 100% legales:</strong> cumplimiento europeo automático sin multas.</span>
                    </li>
                  </ul>
                </div>
              </ScrollReveal>

              {/* Tarjeta 2: Comandero Ágil en Cualquier Móvil */}
              <ScrollReveal delay={150} distance={32} className="flex flex-col h-full">
                <div className="bg-slate-800/60 hover:bg-slate-800/90 border border-slate-700/70 hover:border-cyan-500/40 rounded-2xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 shadow-xl group h-full">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="w-14 h-14 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
                        <Smartphone className="w-7 h-7" />
                      </div>
                      <span className="px-3 py-1 rounded-full text-[11px] font-black tracking-wider uppercase bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                        +14 MIN / MESA EN HORA PUNTA
                      </span>
                    </div>
                    <div>
                      <h3 className="text-xl font-extrabold text-white group-hover:text-cyan-400 transition-colors">
                        Comandero Ágil en Cualquier Móvil
                      </h3>
                      <p className="text-xs text-cyan-400 font-bold uppercase tracking-wider mt-1">
                        Elimina la lentitud de servicio y colas en barra
                      </p>
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed">
                      Olvídate de comprar terminales propietarios de 2.000 €. Los camareros usan su propio smartphone o tablet para validar comandas y cobrar sin viajes innecesarios.
                    </p>
                  </div>

                  <ul className="pt-6 space-y-2.5 border-t border-slate-700/50 mt-6 text-xs text-slate-300">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                      <span><strong>Cero inversión en TPVs:</strong> funciona en los móviles Android o iPhone de tu equipo.</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                      <span><strong>Cobro y comanda en mesa:</strong> menos viajes a barra y rotación un 35% más rápida.</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                      <span><strong>Filtro antifraude de sala:</strong> el camarero valida antes de que la orden entre a cocina.</span>
                    </li>
                  </ul>
                </div>
              </ScrollReveal>

              {/* Tarjeta 3: Monitor KDS por Estaciones */}
              <ScrollReveal delay={300} distance={32} className="flex flex-col h-full">
                <div className="bg-slate-800/60 hover:bg-slate-800/90 border border-slate-700/70 hover:border-cyan-500/40 rounded-2xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 shadow-xl group h-full">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="w-14 h-14 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                        <ChefHat className="w-7 h-7" />
                      </div>
                      <span className="px-3 py-1 rounded-full text-[11px] font-black tracking-wider uppercase bg-amber-500/15 text-amber-400 border border-amber-500/30">
                        PASE DE COCINA SIN ERRORES
                      </span>
                    </div>
                    <div>
                      <h3 className="text-xl font-extrabold text-white group-hover:text-cyan-400 transition-colors">
                        Monitor KDS por Estaciones
                      </h3>
                      <p className="text-xs text-cyan-400 font-bold uppercase tracking-wider mt-1">
                        Cero comandas perdidas, letra ilegible o platos fríos
                      </p>
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed">
                      Las bebidas van directas a la barra, la comida caliente entra al monitor de cocina y los postres quedan retenidos hasta que el camarero los marcha.
                    </p>
                  </div>

                  <ul className="pt-6 space-y-2.5 border-t border-slate-700/50 mt-6 text-xs text-slate-300">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0" />
                      <span><strong>Enrutamiento automático:</strong> bebidas a barra y comida a fuegos sin errores de voz.</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0" />
                      <span><strong>Tiempos bajo control:</strong> tickets cromáticos por tiempo de espera y alerta acústica.</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0" />
                      <span><strong>Impresoras térmicas ESC/POS:</strong> conecta tus impresoras de tickets actuales sin cables raros.</span>
                    </li>
                  </ul>
                </div>
              </ScrollReveal>

            </div>

          </div>
        </section>

        {/* ── 4. BLOQUE DE PLANES Y PRECIOS (ESPACIADO Y COHERENCIA CORREGIDOS) ── */}
        <section id="precios" className="py-20 border-t border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            <ScrollReveal distance={24}>
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
            </ScrollReveal>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch pt-4">
              
              {/* Tarjeta 1: Plan Carta (39 €) */}
              <ScrollReveal delay={0} distance={32} className="flex flex-col h-full">
                <div 
                  onClick={() => handleOpenPilotModal('Plan Carta (39€)')}
                  className="bg-slate-800/60 border border-slate-700 hover:border-emerald-400 rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-xl hover:shadow-2xl hover:shadow-emerald-500/20 transition-all duration-300 group relative cursor-pointer h-full"
                >
                  {/* Badge Flotante Promocional */}
                  <div className="absolute -top-3.5 right-6 px-3.5 py-1 rounded-full bg-slate-900 border border-blue-500/40 group-hover:border-emerald-400 text-blue-300 group-hover:text-emerald-300 text-[11px] font-black tracking-wide shadow-md flex items-center gap-1.5 z-20 transition-colors duration-300">
                    <span>PLAN CARTA DIGITAL</span>
                  </div>

                  <div className="space-y-5">
                    <div>
                      <h3 className="text-xl font-black text-white group-hover:text-emerald-300 transition-colors duration-300">Plan Carta</h3>
                      <p className="text-xs text-slate-400 mt-1">
                        Para locales que buscan carta interactiva y agilidad de servicio en mesa.
                      </p>
                    </div>

                    {/* BLOQUE DE PRECIO CLARO */}
                    <div className="py-2 space-y-1.5">
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-extrabold text-white tracking-tight tabular-nums">39 €</span>
                        <span className="text-slate-400 text-sm font-semibold">/ mes (+ IVA)</span>
                      </div>
                      <div className="text-xs text-slate-400 font-medium">
                        Sin comisiones por comanda &middot; Cancela en cualquier momento
                      </div>
                      <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 rounded-md mt-1 shadow-xs">
                        <Gift className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                        <span>Prueba 14 días a 0 € &middot; Sin compromiso</span>
                      </div>
                    </div>

                    <ul className="space-y-3 text-xs sm:text-sm text-slate-300">
                      <li className="flex items-start gap-2.5">
                        <Check className="w-5 h-5 text-blue-400 group-hover:text-emerald-400 flex-shrink-0 mt-0.5 transition-colors duration-300" />
                        <span>Carta digital interactiva QR autogestionable</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <Check className="w-5 h-5 text-blue-400 group-hover:text-emerald-400 flex-shrink-0 mt-0.5 transition-colors duration-300" />
                        <span>Modificadores estructurados (sin texto libre)</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <Check className="w-5 h-5 text-blue-400 group-hover:text-emerald-400 flex-shrink-0 mt-0.5 transition-colors duration-300" />
                        <span>Llamador con intención (Agua, Pan, Cuenta)</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <Check className="w-5 h-5 text-blue-400 group-hover:text-emerald-400 flex-shrink-0 mt-0.5 transition-colors duration-300" />
                        <span>Generador de cartelería QR para mesas</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <Check className="w-5 h-5 text-blue-400 group-hover:text-emerald-400 flex-shrink-0 mt-0.5 transition-colors duration-300" />
                        <span>Cumplimiento normativo europeo de alérgenos</span>
                      </li>
                    </ul>
                  </div>

                  <div className="pt-6 sm:pt-8 w-full flex items-center justify-center">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleOpenPilotModal('Plan Carta (39€)')
                      }}
                      className="w-full h-14 rounded-2xl text-center text-xs sm:text-sm font-black transition-all duration-300 flex items-center justify-center gap-2 active:scale-95 cursor-pointer leading-none bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 border border-blue-400/30 group-hover:bg-emerald-400 group-hover:text-slate-950 group-hover:shadow-emerald-500/30 group-hover:border-emerald-300"
                    >
                      <span>Elegir Plan Carta</span>
                      <ArrowRight className="w-4 h-4 flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </div>
              </ScrollReveal>

              {/* Tarjeta 2: Plan Sala (69 €) */}
              <ScrollReveal delay={150} distance={32} className="flex flex-col h-full">
                <div 
                  onClick={() => handleOpenPilotModal('Plan Sala (69€)')}
                  className="bg-slate-800/60 border border-slate-700 hover:border-emerald-400 rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-xl hover:shadow-2xl hover:shadow-emerald-500/20 transition-all duration-300 group relative cursor-pointer h-full"
                >
                  {/* Badge Flotante Promocional */}
                  <div className="absolute -top-3.5 right-6 px-3.5 py-1 rounded-full bg-slate-900 border border-blue-500/40 group-hover:border-emerald-400 text-blue-300 group-hover:text-emerald-300 text-[11px] font-black tracking-wide shadow-md flex items-center gap-1.5 z-20 transition-colors duration-300">
                    <span>COMANDERO &amp; SALA</span>
                  </div>

                  <div className="space-y-5">
                    <div>
                      <h3 className="text-xl font-black text-white group-hover:text-emerald-300 transition-colors duration-300">Plan Sala</h3>
                      <p className="text-xs text-slate-400 mt-1">
                        Para restaurantes con camareros en sala y terraza que requieren control antifraude.
                      </p>
                    </div>

                    {/* BLOQUE DE PRECIO CLARO */}
                    <div className="py-2 space-y-1.5">
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-extrabold text-white tracking-tight tabular-nums">69 €</span>
                        <span className="text-slate-400 text-sm font-semibold">/ mes (+ IVA)</span>
                      </div>
                      <div className="text-xs text-slate-400 font-medium">
                        Sin comisiones por comanda &middot; Cancela en cualquier momento
                      </div>
                      <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 rounded-md mt-1 shadow-xs">
                        <Gift className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                        <span>Prueba 14 días a 0 € &middot; Sin compromiso</span>
                      </div>
                    </div>

                    <ul className="space-y-3 text-xs sm:text-sm text-slate-300">
                      <li className="flex items-start gap-2.5">
                        <Check className="w-5 h-5 text-blue-400 group-hover:text-emerald-400 flex-shrink-0 mt-0.5 transition-colors duration-300" />
                        <span><strong>Todo lo incluido en el Plan Carta</strong></span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <Check className="w-5 h-5 text-blue-400 group-hover:text-emerald-400 flex-shrink-0 mt-0.5 transition-colors duration-300" />
                        <span>Comandero móvil de mozos con validación obligatoria</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <Check className="w-5 h-5 text-blue-400 group-hover:text-emerald-400 flex-shrink-0 mt-0.5 transition-colors duration-300" />
                        <span>Filtro anti-fraude en mesa (Gatekeeper)</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <Check className="w-5 h-5 text-blue-400 group-hover:text-emerald-400 flex-shrink-0 mt-0.5 transition-colors duration-300" />
                        <span>Mapa de mesas y selector visual de salón</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <Check className="w-5 h-5 text-blue-400 group-hover:text-emerald-400 flex-shrink-0 mt-0.5 transition-colors duration-300" />
                        <span>Avisos de cobro por método (Datáfono o Efectivo)</span>
                      </li>
                    </ul>
                  </div>

                  <div className="pt-6 sm:pt-8 w-full flex items-center justify-center">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleOpenPilotModal('Plan Sala (69€)')
                      }}
                      className="w-full h-14 rounded-2xl text-center text-xs sm:text-sm font-black transition-all duration-300 flex items-center justify-center gap-2 active:scale-95 cursor-pointer leading-none bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 border border-blue-400/30 group-hover:bg-emerald-400 group-hover:text-slate-950 group-hover:shadow-emerald-500/30 group-hover:border-emerald-300"
                    >
                      <span>Elegir Plan Sala</span>
                      <ArrowRight className="w-4 h-4 flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </div>
              </ScrollReveal>

              {/* Tarjeta 3: Plan Full (DESTACADA CON BORDE CIAN & BADGE RECOMENDADO LIMPIO) */}
              <ScrollReveal delay={300} distance={32} className="flex flex-col h-full">
                <div 
                  onClick={() => handleOpenPilotModal('Plan Full (Recomendado)')}
                  className="bg-slate-800/90 border-2 border-cyan-500 hover:border-emerald-400 rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-2xl shadow-cyan-500/20 hover:shadow-emerald-500/30 transition-all duration-300 group relative lg:-translate-y-2 cursor-pointer h-full"
                >
                  {/* Badge Recomendado Limpio y sin duplicidades */}
                  <div className="absolute -top-3.5 right-6 px-3.5 py-1 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-md z-20 flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5 fill-slate-950 text-slate-950 flex-shrink-0" />
                    <span>RECOMENDADO</span>
                  </div>

                  <div className="space-y-5">
                    <div>
                      <div className="inline-flex items-center gap-1.5 text-cyan-400 group-hover:text-emerald-300 font-extrabold text-xs uppercase tracking-wider mb-1 transition-colors duration-300">
                        <Layers className="w-4 h-4" /> Circuito Completo
                      </div>
                      <h3 className="text-2xl font-black text-white group-hover:text-emerald-300 transition-colors duration-300">Plan Full</h3>
                      <p className="text-xs text-slate-300 mt-1">
                        Solución integral: Comensal + Sala + Pantalla KDS o Tiqueteras térmicas.
                      </p>
                    </div>

                    {/* BLOQUE DE PRECIO CLARO Y ARMONIZADO */}
                    <div className="py-2 space-y-1.5">
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-extrabold text-white tracking-tight tabular-nums">99 €</span>
                        <span className="text-slate-400 text-sm font-semibold">/ mes (+ IVA)</span>
                      </div>
                      <div className="text-xs text-slate-400 font-medium">
                        Sin comisiones por comanda &middot; Cancela en cualquier momento
                      </div>
                      <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 rounded-md mt-1 shadow-xs">
                        <Gift className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                        <span>Prueba 14 días a 0 € &middot; Setup de 149 € bonificado</span>
                      </div>
                    </div>

                    {/* LISTA DE BENEFICIOS COHERENTE Y SIN CAJAS DISJUNTAS */}
                    <ul className="space-y-3 text-xs sm:text-sm text-slate-200">
                      {/* DESTACADO DE ALTA GAMA: Multiplicador de Reseñas Google Maps */}
                      <li className="flex items-start gap-2.5">
                        <Star className="w-5 h-5 text-amber-400 fill-amber-400 flex-shrink-0 mt-0.5" />
                        <span className="text-white font-bold leading-snug">
                          Multiplicador de Reseñas 5★ en Google Maps automático tras el pago de la mesa.
                        </span>
                      </li>

                      <li className="flex items-start gap-2.5">
                        <Check className="w-5 h-5 text-cyan-400 group-hover:text-emerald-400 flex-shrink-0 mt-0.5 transition-colors duration-300" />
                        <span><strong>Todo lo del Plan Carta y Plan Sala</strong></span>
                      </li>

                      <li className="flex items-start gap-2.5">
                        <Check className="w-5 h-5 text-cyan-400 group-hover:text-emerald-400 flex-shrink-0 mt-0.5 transition-colors duration-300" />
                        <div className="space-y-0.5">
                          <span><strong>Reporte Mensual de Eficiencia &amp; Rentabilidad con IA</strong> (Horas punta, matriz BCG de platos y optimización de terraza)</span>
                          <div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                setIsReportModalOpen(true)
                              }}
                              className="inline-flex items-center gap-1.5 text-[11px] font-black text-cyan-400 group-hover:text-emerald-300 underline hover:text-white transition-colors cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5 flex-shrink-0" />
                              <span>Ver muestra del reporte ejecutivo</span>
                              <ExternalLink size={11} className="flex-shrink-0" />
                            </button>
                          </div>
                        </div>
                      </li>

                      <li className="flex items-start gap-2.5">
                        <Check className="w-5 h-5 text-cyan-400 group-hover:text-emerald-400 flex-shrink-0 mt-0.5 transition-colors duration-300" />
                        <span>Monitor KDS industrial con botones gigantes (&gt;70px)</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <Check className="w-5 h-5 text-cyan-400 group-hover:text-emerald-400 flex-shrink-0 mt-0.5 transition-colors duration-300" />
                        <span>Alerta sonora de timbre al marchar comandas</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <Check className="w-5 h-5 text-cyan-400 group-hover:text-emerald-400 flex-shrink-0 mt-0.5 transition-colors duration-300" />
                        <span>API compatible con Impresoras Térmicas ESC/POS</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <Check className="w-5 h-5 text-cyan-400 group-hover:text-emerald-400 flex-shrink-0 mt-0.5 transition-colors duration-300" />
                        <span>Soporte prioritario y puesta en marcha garantizada</span>
                      </li>
                    </ul>
                  </div>

                  <div className="pt-6 sm:pt-8 w-full flex items-center justify-center">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleOpenPilotModal('Plan Full (Recomendado)')
                      }}
                      className="w-full h-14 rounded-2xl text-center text-xs sm:text-sm font-black transition-all duration-300 flex items-center justify-center gap-2 active:scale-95 cursor-pointer leading-none bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-950 hover:from-cyan-300 hover:to-emerald-300 shadow-xl shadow-cyan-500/25 border border-cyan-300/40"
                    >
                      <span>Probar 14 Días a 0 €</span>
                      <ArrowRight className="w-4 h-4 flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </div>
              </ScrollReveal>

            </div>

          </div>
        </section>

        {/* ── 5. CALL TO ACTION (CTA) FINAL ── */}
        <section id="contacto" className="py-20 bg-slate-900 border-t border-slate-800">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <ScrollReveal distance={28} scale={0.98}>
              <div className="bg-gradient-to-b from-slate-800 to-slate-850 border border-slate-700 rounded-3xl p-8 sm:p-14 text-center space-y-6 relative overflow-hidden shadow-2xl">
                
                {/* Halo sutil de fondo */}
                <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 max-w-2xl mx-auto space-y-4">
                  <span className="inline-block text-xs font-black uppercase tracking-widest text-cyan-400">
                    Desafío Piloto Sin Riesgo
                  </span>
                  
                  <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                    Inicia hoy tu prueba piloto de 14 días a 0 €
                  </h2>

                  <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                    Nosotros cargamos tu carta, fotos y alérgenos en 24 horas. Te entregamos el sistema configurado y listo para probar en tu próximo turno sin riesgo.
                  </p>

                  <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
                    <button
                      type="button"
                      onClick={() => handleOpenPilotModal('Plan Full (Recomendado)')}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-sm sm:text-base font-black bg-cyan-500 text-slate-950 hover:bg-cyan-400 shadow-xl shadow-cyan-500/30 transition-all active:scale-95 cursor-pointer"
                    >
                      <span>Solicitar Piloto 14 Días (0 €)</span>
                      <ChevronRight className="w-5 h-5" />
                    </button>

                    <button
                      type="button"
                      onClick={handleOpenAllDashboards}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-6 py-4 rounded-xl text-sm sm:text-base font-bold text-slate-300 bg-slate-900/90 hover:bg-slate-900 border border-slate-700 hover:text-white transition-colors cursor-pointer"
                    >
                      <span>Ver Demo Interactiva en Vivo</span>
                      <ExternalLink className="w-4 h-4 text-cyan-400" />
                    </button>
                  </div>

                  <p className="text-xs text-slate-400 pt-2">
                    0 € durante el piloto &middot; Sin tarjeta ni permanencia &middot; Puesta en marcha incluida
                  </p>
                </div>

              </div>
            </ScrollReveal>
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

      {/* ── 7. FOOTER LIMPIO ── */}
      <footer className="border-t border-slate-800/80 py-8 px-4 bg-slate-950 text-xs text-slate-400">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start">
            <Link 
              href="/admin/crm" 
              className="inline-flex items-center gap-3 p-2.5 -m-2.5 rounded-2xl transition-all hover:bg-slate-900 active:scale-95 cursor-pointer group touch-manipulation" 
              title="Acceso CRM Fundador"
            >
              <div className="pointer-events-none flex-shrink-0 transition-transform group-hover:scale-110 group-active:scale-90">
                <FluxoLogo size={36} />
              </div>
              <span className="font-bold text-slate-400 group-hover:text-slate-200 transition-colors pointer-events-none select-none text-xs sm:text-sm">
                &middot; Sistema Gastronómico en Tiempo Real.
              </span>
            </Link>
          </div>

          <div className="flex items-center justify-center sm:justify-end gap-3 text-slate-400 flex-wrap">
            <Link 
              href="/legal" 
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-cyan-500/50 text-slate-300 hover:text-cyan-400 font-bold transition-all shadow-sm group"
            >
              <ShieldCheck className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
              <span>Aviso Legal &amp; RGPD</span>
            </Link>

            <a 
              href={getWhatsAppUrl('Contacto Comercial')}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-cyan-500/50 text-slate-300 hover:text-cyan-400 font-bold transition-all shadow-sm group"
            >
              <span>Contacto Comercial</span>
              <ExternalLink className="w-3.5 h-3.5 text-cyan-400 group-hover:translate-x-0.5 transition-transform" />
            </a>
          </div>
        </div>

        {/* ── ACCESO DISCRETO AL CRM (SOLO FUNDADOR) ── */}
        <div className="max-w-6xl mx-auto mt-8 pt-6 border-t border-slate-900 flex items-center justify-between gap-3 text-[11px] text-slate-600">
          <p>&copy; {new Date().getFullYear()} Fluxo Gastronomic System.</p>

          <a
            href="/admin/crm"
            onClick={(e) => {
              if (typeof window !== 'undefined') {
                window.location.assign('/admin/crm')
              }
            }}
            className="inline-flex items-center gap-1.5 text-slate-600 hover:text-slate-300 active:text-white transition-colors p-2 -m-2 rounded-lg touch-manipulation cursor-pointer group"
            title="Portal de gestión"
            aria-label="Portal de gestión"
          >
            <span className="font-mono text-[10px] tracking-wider uppercase opacity-70 group-hover:opacity-100">
              Portal
            </span>
            <ArrowRight className="w-3.5 h-3.5 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
          </a>
        </div>
      </footer>

      {/* ── MODAL DE SOLICITUD DE PILOTO 14 DÍAS A 0€ ── */}
      <PilotRequestModal
        isOpen={isPilotModalOpen}
        onClose={() => setIsPilotModalOpen(false)}
        initialPlan={selectedPlanForModal}
        whatsAppPhone={WHATSAPP_PHONE}
      />

      {/* ── MODAL DE MUESTRA DEL REPORTE MENSUAL EJECUTIVO IA ── */}
      <MonthlyReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        slug="burger-gourmet"
      />

    </div>
  )
}
