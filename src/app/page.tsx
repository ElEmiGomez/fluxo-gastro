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
  Gift,
  Sparkles
} from 'lucide-react'
import { FluxoLogo } from '@/components/common/FluxoLogo'
import { PilotRequestModal } from '@/components/landing/PilotRequestModal'
import { MonthlyReportModal } from '@/components/analytics/MonthlyReportModal'
import { ScrollReveal } from '@/components/landing/ScrollReveal'
import { HeroAuroraBackground } from '@/components/landing/HeroAuroraBackground'
import { GlowButton } from '@/components/landing/GlowButton'
import { HeroSandbox } from '@/components/landing/HeroSandbox'
import { BeforeAfterCard } from '@/components/landing/BeforeAfterCard'
import { PainSection } from '@/components/landing/PainSection'
import { FeatureTabs } from '@/components/landing/FeatureTabs'
import { FaqSection } from '@/components/landing/FaqSection'

interface ContactModalState {
  isOpen: boolean
  mode: 'pilot' | 'question'
  selectedPlan?: string
}

export default function LandingPage() {
  const [popupsBlocked, setPopupsBlocked] = useState(false)
  // Modal unificado de contacto (100% correo electrónico): piloto 14 días o consulta libre
  const [contactModal, setContactModal] = useState<ContactModalState>({
    isOpen: false,
    mode: 'pilot',
    selectedPlan: 'Plan Full (Recomendado)'
  })
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)

  React.useEffect(() => {
    document.title = 'Fluxo - Gastronomic System'
  }, [])

  const handleOpenPilotModal = (plan = 'Plan Full (Recomendado)') => {
    setContactModal({ isOpen: true, mode: 'pilot', selectedPlan: plan })
  }

  const handleOpenContactModal = () => {
    setContactModal((prev) => ({ isOpen: true, mode: 'question', selectedPlan: prev.selectedPlan }))
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
    <div className="min-h-screen bg-white text-slate-900 selection:bg-blue-600 selection:text-white font-sans antialiased flex flex-col">
      
      {/* ── 1. HEADER / NAVBAR DE MARCA ── */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/90 border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          
          {/* Isotipo & Marca Fluxo */}
          <Link href="/" className="flex items-center gap-3 group">
            <FluxoLogo size={42} showText={true} inverted={true} />
          </Link>

          {/* Navegación Rápida */}
          <nav className="hidden lg:flex items-center gap-7 text-sm font-semibold text-slate-600">
            <a href="#demo" className="hover:text-blue-600 transition-colors">
              Demo en Vivo
            </a>
            <a href="#modulos" className="hover:text-blue-600 transition-colors">
              Módulos
            </a>
            <a href="#funcionalidades" className="hover:text-blue-600 transition-colors">
              Beneficios
            </a>
            <a href="#precios" className="hover:text-blue-600 transition-colors">
              Planes &amp; Precios
            </a>
            <a href="#faq" className="hover:text-blue-600 transition-colors">
              FAQ
            </a>
          </nav>

          {/* CTA Superior: Botón con brillo Glow */}
          <div className="flex items-center gap-3">
            <GlowButton
              onClick={handleOpenAllDashboards}
              className="px-4 py-2 sm:px-5 sm:py-2.5 text-xs sm:text-sm"
              icon={<ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />}
            >
              <span>Probar demo en vivo</span>
            </GlowButton>
          </div>
        </div>
      </header>

      <main className="flex-1">
        
        {/* ── 2. HERO SECTION CENTRADO & LIMPIO (CON GLOW BUTTON Y SANDBOX) ── */}
        <section className="relative overflow-hidden pt-14 pb-16 sm:pt-20 sm:pb-24 border-b border-slate-200/80 bg-gradient-to-b from-slate-100/90 via-slate-50/40 to-white">
          
          {/* Fondo Dinámico Aurora B2B */}
          <HeroAuroraBackground />

          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            <div className="max-w-3xl mx-auto space-y-6">
              
              {/* Badge Superior */}
              <ScrollReveal delay={80} distance={18}>
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-black uppercase tracking-widest shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                  <span>SISTEMA OPERATIVO PARA BARES Y RESTAURANTES</span>
                </div>
              </ScrollReveal>

              {/* Titular Principal */}
              <ScrollReveal delay={180} distance={24}>
                <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-slate-900 tracking-tight leading-[1.1]">
                  Tecnología invisible.{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-sky-600 to-indigo-600">
                    Gastronomía sin pausas.
                  </span>
                </h1>
              </ScrollReveal>

              {/* Subtítulo de Control & Velocidad */}
              <ScrollReveal delay={280} distance={24}>
                <p className="text-base sm:text-lg lg:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed font-normal">
                  La agilidad del papel y boli de siempre, pero con la velocidad de la sincronización digital instantánea. Conecta a tus camareros en terraza con la barra y la cocina en tiempo real sin comprar TPVs caros.
                </p>
              </ScrollReveal>

              {/* Acciones del Hero: Botón Azul Glow / Shimmer + Botón Secundario */}
              <ScrollReveal delay={380} distance={24}>
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
                  <GlowButton
                    onClick={() => handleOpenPilotModal('Plan Full (Recomendado)')}
                    className="w-full sm:w-auto px-8 py-4 text-base font-black"
                    icon={<ArrowRight className="w-5 h-5 flex-shrink-0" />}
                  >
                    <span>Solicitar piloto 14 días</span>
                  </GlowButton>

                  <button
                    type="button"
                    onClick={handleOpenAllDashboards}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl text-sm sm:text-base font-bold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-300 hover:border-blue-400 shadow-sm transition-all active:scale-95 cursor-pointer group"
                  >
                    <span>Probar demo interactiva</span>
                    <ArrowRight className="w-4 h-4 text-blue-600 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </ScrollReveal>

              {/* Micro-puntos de confianza */}
              <ScrollReveal delay={480} distance={18}>
                <div className="pt-2 flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs sm:text-sm text-slate-500 font-medium">
                  <span className="flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-emerald-600 font-bold" /> Sin permanencia
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-emerald-600 font-bold" /> Setup inicial incluido
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-emerald-600 font-bold" /> 100% Mobile Web
                  </span>
                </div>
              </ScrollReveal>

            </div>
          </div>

          {/* ── 2.1 EL SANDBOX INTERACTIVO EN EL HERO (DOBLE PANTALLA MÓVIL + TABLET) ── */}
          <div id="demo" className="mt-14 sm:mt-16 relative z-10">
            <ScrollReveal delay={200} distance={30}>
              <HeroSandbox onOpenAllDashboards={handleOpenAllDashboards} />
            </ScrollReveal>

            {/* ── 2.2 TARJETA COMPARATIVA «ANTES VS. DESPUÉS» ── */}
            <ScrollReveal delay={250} distance={30}>
              <BeforeAfterCard />
            </ScrollReveal>
          </div>

        </section>

        {/* ── 3. SECCIÓN DEL DOLOR: «TU SERVICIO NO DEBERÍA SER CAÓTICO» (6 TARJETAS OSCURAS) ── */}
        <div id="dolor">
          <PainSection />
        </div>

        {/* ── 4. NAVEGACIÓN POR MÓDULOS FUNCIONALES (5 PESTAÑAS INTERACTIVAS) ── */}
        <FeatureTabs onOpenPilotModal={handleOpenPilotModal} />

        {/* ── 5. IMPACTO REAL & MÉTRICAS DE NEGOCIO (3 PILARES) ── */}
        <section id="funcionalidades" className="py-12 sm:py-20 bg-white border-t border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            <ScrollReveal distance={24}>
              <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-16 space-y-3">
                <span className="text-xs font-black uppercase tracking-wider text-blue-600">
                  Diseñado para el Dueño Gastronómico
                </span>
                <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                  Tres pilares que transforman la rentabilidad de tu local
                </h2>
                <p className="text-sm sm:text-base text-slate-600">
                  Menos costes en hardware, rotación de mesas más ágil y un control milimétrico desde la sala hasta el pase de cocina.
                </p>
              </div>
            </ScrollReveal>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-8">
              
              {/* Tarjeta 1: Carta QR Visual y Ventas Sugeridas */}
              <ScrollReveal delay={0} distance={32} className="flex flex-col h-full">
                <div className="bg-white hover:bg-slate-50/50 border border-slate-200 hover:border-emerald-500/50 rounded-2xl p-5 sm:p-8 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 active:-translate-y-1 hover:shadow-xl group h-full">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="w-14 h-14 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
                        <TrendingUp className="w-7 h-7" />
                      </div>
                      <span className="px-3 py-1 rounded-full text-[11px] font-black tracking-wider uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                        +22% Ticket Medio
                      </span>
                    </div>
                    <div>
                      <h3 className="text-xl font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors">
                        Carta QR Visual y Ventas Sugeridas
                      </h3>
                      <p className="text-xs text-blue-600 font-bold uppercase tracking-wider mt-1">
                        Aumenta el ticket medio sin presionar al comensal
                      </p>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      Tus comensales piden segundas rondas de bebida y postres directamente desde el móvil. Bloquea platos agotados en 1 toque y cumple con la normativa europea de alérgenos al instante.
                    </p>
                  </div>

                  <ul className="pt-6 space-y-2.5 border-t border-slate-100 mt-6 text-xs text-slate-700">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span><strong>+22% en consumo:</strong> fotos de alta resolución que disparan el consumo por impulso.</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span><strong>Pausado en 5 segundos:</strong> agota platos en sala al instante sin reimprimir cartas.</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span><strong>Alérgenos 100% legales:</strong> cumplimiento europeo automático sin multas.</span>
                    </li>
                  </ul>
                </div>
              </ScrollReveal>

              {/* Tarjeta 2: Comandero Ágil en Cualquier Móvil */}
              <ScrollReveal delay={150} distance={32} className="flex flex-col h-full">
                <div className="bg-white hover:bg-slate-50/50 border border-slate-200 hover:border-blue-400 rounded-2xl p-5 sm:p-8 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 active:-translate-y-1 hover:shadow-xl group h-full">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="w-14 h-14 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center">
                        <Smartphone className="w-7 h-7" />
                      </div>
                      <span className="px-3 py-1 rounded-full text-[11px] font-black tracking-wider uppercase bg-blue-50 text-blue-700 border border-blue-200">
                        +14 MIN / MESA EN HORA PUNTA
                      </span>
                    </div>
                    <div>
                      <h3 className="text-xl font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors">
                        Comandero Ágil en Cualquier Móvil
                      </h3>
                      <p className="text-xs text-blue-600 font-bold uppercase tracking-wider mt-1">
                        Elimina la lentitud de servicio y colas en barra
                      </p>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      Olvídate de comprar terminales propietarios de 2.000 €. Los camareros usan su propio smartphone o tablet para validar comandas y cobrar sin viajes innecesarios.
                    </p>
                  </div>

                  <ul className="pt-6 space-y-2.5 border-t border-slate-100 mt-6 text-xs text-slate-700">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
                      <span><strong>Cero inversión en TPVs:</strong> funciona en los móviles Android o iPhone de tu equipo.</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
                      <span><strong>Cobro y comanda en mesa:</strong> menos viajes a barra y rotación un 35% más rápida.</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
                      <span><strong>Filtro antifraude de sala:</strong> el camarero valida antes de que la orden entre a cocina.</span>
                    </li>
                  </ul>
                </div>
              </ScrollReveal>

              {/* Tarjeta 3: Monitor KDS por Estaciones */}
              <ScrollReveal delay={300} distance={32} className="flex flex-col h-full">
                <div className="bg-white hover:bg-slate-50/50 border border-slate-200 hover:border-amber-400 rounded-2xl p-5 sm:p-8 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 active:-translate-y-1 hover:shadow-xl group h-full">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="w-14 h-14 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center">
                        <ChefHat className="w-7 h-7" />
                      </div>
                      <span className="px-3 py-1 rounded-full text-[11px] font-black tracking-wider uppercase bg-amber-50 text-amber-700 border border-amber-200">
                        PASE DE COCINA SIN ERRORES
                      </span>
                    </div>
                    <div>
                      <h3 className="text-xl font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors">
                        Monitor KDS por Estaciones
                      </h3>
                      <p className="text-xs text-blue-600 font-bold uppercase tracking-wider mt-1">
                        Cero comandas perdidas, letra ilegible o platos fríos
                      </p>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      Las bebidas van directas a la barra, la comida caliente entra al monitor de cocina y los postres quedan retenidos hasta que el camarero los marcha.
                    </p>
                  </div>

                  <ul className="pt-6 space-y-2.5 border-t border-slate-100 mt-6 text-xs text-slate-700">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-amber-600 flex-shrink-0" />
                      <span><strong>Enrutamiento automático:</strong> bebidas a barra y comida a fuegos sin errores de voz.</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-amber-600 flex-shrink-0" />
                      <span><strong>Tiempos bajo control:</strong> tickets cromáticos por tiempo de espera y alerta acústica.</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-amber-600 flex-shrink-0" />
                      <span><strong>Impresoras térmicas ESC/POS:</strong> conecta tus impresoras de tickets actuales sin cables raros.</span>
                    </li>
                  </ul>
                </div>
              </ScrollReveal>

            </div>

          </div>
        </section>

        {/* ── 6. BLOQUE DE PLANES Y PRECIOS ── */}
        <section id="precios" className="py-12 sm:py-20 bg-slate-50/70 border-t border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            <ScrollReveal distance={24}>
              <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-16 space-y-3">
                <span className="text-xs font-black uppercase tracking-wider text-blue-600">
                  Inversión Clara y Transparente
                </span>
                <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                  Planes adaptados al tamaño de tu sala
                </h2>
                <p className="text-sm sm:text-base text-slate-600">
                  Sin comisiones por comanda, sin hardware propietario obligatorio y con cancelación libre en cualquier momento.
                </p>
              </div>
            </ScrollReveal>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-8 items-stretch pt-4">
              
              {/* Tarjeta 1: Plan Carta (39 €) */}
              <ScrollReveal delay={0} distance={32} className="flex flex-col h-full">
                <div 
                  onClick={() => handleOpenPilotModal('Plan Carta (39€)')}
                  className="bg-white border border-slate-200 hover:border-emerald-500 rounded-3xl p-5 sm:p-8 flex flex-col justify-between shadow-sm hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300 hover:-translate-y-1.5 active:-translate-y-1 group relative cursor-pointer h-full"
                >
                  {/* Badge Flotante Promocional */}
                  <div className="absolute -top-3.5 right-6 px-3.5 py-1 rounded-full bg-slate-100 border border-slate-300 text-slate-800 group-hover:bg-emerald-50 group-hover:border-emerald-300 group-hover:text-emerald-700 text-[11px] font-black tracking-wide shadow-xs flex items-center gap-1.5 z-20 transition-colors duration-300">
                    <span>PLAN CARTA DIGITAL</span>
                  </div>

                  <div className="space-y-5">
                    <div>
                      <h3 className="text-xl font-black text-slate-900 group-hover:text-emerald-600 transition-colors duration-300">Plan Carta</h3>
                      <p className="text-xs text-slate-500 mt-1">
                        Para locales que buscan carta interactiva y agilidad de servicio en mesa.
                      </p>
                    </div>

                    {/* BLOQUE DE PRECIO CLARO */}
                    <div className="py-2 space-y-1.5">
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-extrabold text-slate-900 tracking-tight tabular-nums">39 €</span>
                        <span className="text-slate-500 text-sm font-semibold">/ mes (+ IVA)</span>
                      </div>
                      <div className="text-xs text-slate-500 font-medium">
                        Sin comisiones por comanda &middot; Cancela en cualquier momento
                      </div>
                      <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md mt-1 shadow-xs">
                        <Gift className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                        <span>Prueba 14 días a 0 € &middot; Sin compromiso</span>
                      </div>
                    </div>

                    <ul className="space-y-3 text-xs sm:text-sm text-slate-600">
                      <li className="flex items-start gap-2.5">
                        <Check className="w-5 h-5 text-blue-600 group-hover:text-emerald-600 flex-shrink-0 mt-0.5 transition-colors duration-300" />
                        <span>Carta digital interactiva QR autogestionable</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <Check className="w-5 h-5 text-blue-600 group-hover:text-emerald-600 flex-shrink-0 mt-0.5 transition-colors duration-300" />
                        <span>Modificadores estructurados (sin texto libre)</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <Check className="w-5 h-5 text-blue-600 group-hover:text-emerald-600 flex-shrink-0 mt-0.5 transition-colors duration-300" />
                        <span>Llamador con intención (Agua, Pan, Cuenta)</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <Check className="w-5 h-5 text-blue-600 group-hover:text-emerald-600 flex-shrink-0 mt-0.5 transition-colors duration-300" />
                        <span>Generador de cartelería QR para mesas</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <Check className="w-5 h-5 text-blue-600 group-hover:text-emerald-600 flex-shrink-0 mt-0.5 transition-colors duration-300" />
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
                      className="w-full h-14 rounded-2xl text-center text-xs sm:text-sm font-black transition-all duration-300 flex items-center justify-center gap-2 active:scale-95 cursor-pointer leading-none bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 group-hover:bg-emerald-600 group-hover:shadow-emerald-500/20"
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
                  className="bg-white border border-slate-200 hover:border-emerald-500 rounded-3xl p-5 sm:p-8 flex flex-col justify-between shadow-sm hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300 hover:-translate-y-1.5 active:-translate-y-1 group relative cursor-pointer h-full"
                >
                  {/* Badge Flotante Promocional */}
                  <div className="absolute -top-3.5 right-6 px-3.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 group-hover:bg-emerald-50 group-hover:border-emerald-300 group-hover:text-emerald-700 text-[11px] font-black tracking-wide shadow-xs flex items-center gap-1.5 z-20 transition-colors duration-300">
                    <span>COMANDERO &amp; SALA</span>
                  </div>

                  <div className="space-y-5">
                    <div>
                      <h3 className="text-xl font-black text-slate-900 group-hover:text-emerald-600 transition-colors duration-300">Plan Sala</h3>
                      <p className="text-xs text-slate-500 mt-1">
                        Para restaurantes con camareros en sala y terraza que requieren control antifraude.
                      </p>
                    </div>

                    {/* BLOQUE DE PRECIO CLARO */}
                    <div className="py-2 space-y-1.5">
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-extrabold text-slate-900 tracking-tight tabular-nums">69 €</span>
                        <span className="text-slate-500 text-sm font-semibold">/ mes (+ IVA)</span>
                      </div>
                      <div className="text-xs text-slate-500 font-medium">
                        Sin comisiones por comanda &middot; Cancela en cualquier momento
                      </div>
                      <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md mt-1 shadow-xs">
                        <Gift className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                        <span>Prueba 14 días a 0 € &middot; Sin compromiso</span>
                      </div>
                    </div>

                    <ul className="space-y-3 text-xs sm:text-sm text-slate-600">
                      <li className="flex items-start gap-2.5">
                        <Check className="w-5 h-5 text-blue-600 group-hover:text-emerald-600 flex-shrink-0 mt-0.5 transition-colors duration-300" />
                        <span><strong>Todo lo incluido en el Plan Carta</strong></span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <Check className="w-5 h-5 text-blue-600 group-hover:text-emerald-600 flex-shrink-0 mt-0.5 transition-colors duration-300" />
                        <span>Comandero móvil de mozos con validación obligatoria</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <Check className="w-5 h-5 text-blue-600 group-hover:text-emerald-600 flex-shrink-0 mt-0.5 transition-colors duration-300" />
                        <span>Filtro anti-fraude en mesa (Gatekeeper)</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <Check className="w-5 h-5 text-blue-600 group-hover:text-emerald-600 flex-shrink-0 mt-0.5 transition-colors duration-300" />
                        <span>Mapa de mesas y selector visual de salón</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <Check className="w-5 h-5 text-blue-600 group-hover:text-emerald-600 flex-shrink-0 mt-0.5 transition-colors duration-300" />
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
                      className="w-full h-14 rounded-2xl text-center text-xs sm:text-sm font-black transition-all duration-300 flex items-center justify-center gap-2 active:scale-95 cursor-pointer leading-none bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 group-hover:bg-emerald-600 group-hover:shadow-emerald-500/20"
                    >
                      <span>Elegir Plan Sala</span>
                      <ArrowRight className="w-4 h-4 flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </div>
              </ScrollReveal>

              {/* Tarjeta 3: Plan Full (DESTACADA) */}
              <ScrollReveal delay={300} distance={32} className="flex flex-col h-full">
                <div 
                  onClick={() => handleOpenPilotModal('Plan Full (Recomendado)')}
                  className="bg-white border-2 border-blue-600 hover:border-emerald-500 rounded-3xl p-5 sm:p-8 flex flex-col justify-between shadow-xl ring-4 ring-blue-500/10 hover:shadow-2xl hover:shadow-emerald-500/20 transition-all duration-300 hover:-translate-y-1.5 lg:hover:-translate-y-2.5 active:-translate-y-1 group relative lg:-translate-y-2 cursor-pointer h-full"
                >
                  {/* Badge Recomendado */}
                  <div className="absolute -top-3.5 right-6 px-3.5 py-1 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-md z-20 flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5 fill-slate-950 text-slate-950 flex-shrink-0" />
                    <span>RECOMENDADO</span>
                  </div>

                  <div className="space-y-5">
                    <div>
                      <div className="inline-flex items-center gap-1.5 text-blue-600 group-hover:text-emerald-600 font-extrabold text-xs uppercase tracking-wider mb-1 transition-colors duration-300">
                        <Layers className="w-4 h-4" /> Circuito Completo
                      </div>
                      <h3 className="text-2xl font-black text-slate-900 group-hover:text-emerald-600 transition-colors duration-300">Plan Full</h3>
                      <p className="text-xs text-slate-500 mt-1">
                        Solución integral: Comensal + Sala + Pantalla KDS o Tiqueteras térmicas.
                      </p>
                    </div>

                    {/* BLOQUE DE PRECIO CLARO Y ARMONIZADO */}
                    <div className="py-2 space-y-1.5">
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-extrabold text-slate-900 tracking-tight tabular-nums">99 €</span>
                        <span className="text-slate-500 text-sm font-semibold">/ mes (+ IVA)</span>
                      </div>
                      <div className="text-xs text-slate-500 font-medium">
                        Sin comisiones por comanda &middot; Cancela en cualquier momento
                      </div>
                      <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md mt-1 shadow-xs">
                        <Gift className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                        <span>Prueba 14 días a 0 € &middot; Setup de 149 € bonificado</span>
                      </div>
                    </div>

                    {/* LISTA DE BENEFICIOS */}
                    <ul className="space-y-3 text-xs sm:text-sm text-slate-700">
                      <li className="flex items-start gap-2.5">
                        <Star className="w-5 h-5 text-amber-500 fill-amber-400 flex-shrink-0 mt-0.5" />
                        <span className="text-slate-900 font-bold leading-snug">
                          Multiplicador de Reseñas 5★ en Google Maps automático tras el pago de la mesa.
                        </span>
                      </li>

                      <li className="flex items-start gap-2.5">
                        <Check className="w-5 h-5 text-blue-600 group-hover:text-emerald-600 flex-shrink-0 mt-0.5 transition-colors duration-300" />
                        <span><strong>Todo lo del Plan Carta y Plan Sala</strong></span>
                      </li>

                      <li className="flex items-start gap-2.5">
                        <Check className="w-5 h-5 text-blue-600 group-hover:text-emerald-600 flex-shrink-0 mt-0.5 transition-colors duration-300" />
                        <div className="space-y-0.5">
                          <span><strong>Reporte Mensual de Eficiencia &amp; Rentabilidad con IA</strong> (Horas punta, matriz de platos y optimización de terraza)</span>
                          <div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                setIsReportModalOpen(true)
                              }}
                              className="inline-flex items-center gap-1.5 text-[11px] font-black text-blue-600 group-hover:text-emerald-600 underline hover:text-blue-700 transition-colors cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5 flex-shrink-0" />
                              <span>Ver muestra del reporte ejecutivo</span>
                              <ExternalLink size={11} className="flex-shrink-0" />
                            </button>
                          </div>
                        </div>
                      </li>

                      <li className="flex items-start gap-2.5">
                        <Check className="w-5 h-5 text-blue-600 group-hover:text-emerald-600 flex-shrink-0 mt-0.5 transition-colors duration-300" />
                        <span>Monitor KDS industrial con botones gigantes (&gt;70px)</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <Check className="w-5 h-5 text-blue-600 group-hover:text-emerald-600 flex-shrink-0 mt-0.5 transition-colors duration-300" />
                        <span>Alerta sonora de timbre al marchar comandas</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <Check className="w-5 h-5 text-blue-600 group-hover:text-emerald-600 flex-shrink-0 mt-0.5 transition-colors duration-300" />
                        <span>API compatible con Impresoras Térmicas ESC/POS</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <Check className="w-5 h-5 text-blue-600 group-hover:text-emerald-600 flex-shrink-0 mt-0.5 transition-colors duration-300" />
                        <span>Soporte prioritario y puesta en marcha garantizada</span>
                      </li>
                    </ul>
                  </div>

                  <div className="pt-6 sm:pt-8 w-full flex items-center justify-center">
                    <GlowButton
                      onClick={(e) => {
                        e.stopPropagation()
                        handleOpenPilotModal('Plan Full (Recomendado)')
                      }}
                      className="w-full h-14 rounded-2xl text-xs sm:text-sm font-black"
                      icon={<ArrowRight className="w-4 h-4 flex-shrink-0" />}
                    >
                      <span>Probar 14 Días a 0 €</span>
                    </GlowButton>
                  </div>
                </div>
              </ScrollReveal>

            </div>

          </div>
        </section>

        {/* ── 7. SECCIÓN DE PREGUNTAS FRECUENTES (FAQ - DESARME DE OBJECIONES) ── */}
        <FaqSection onOpenContact={handleOpenContactModal} />

        {/* ── 8. CALL TO ACTION (CTA) FINAL CON EFECTO GLOW / SHIMMER ── */}
        <section id="contacto" className="py-12 sm:py-20 bg-white border-t border-slate-200">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <ScrollReveal distance={28} scale={0.98}>
              <div className="bg-gradient-to-b from-blue-100/70 via-sky-50/30 to-slate-100/60 border border-blue-200/80 rounded-3xl p-6 sm:p-14 text-center space-y-6 relative overflow-hidden shadow-xl">
                
                {/* Halo sutil de fondo */}
                <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 max-w-2xl mx-auto space-y-4">
                  <span className="inline-block text-xs font-black uppercase tracking-widest text-blue-600">
                    Desafío Piloto Sin Riesgo
                  </span>
                  
                  <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                    Inicia hoy tu prueba piloto de 14 días a 0 €
                  </h2>

                  <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                    Nosotros cargamos tu carta, fotos y alérgenos en 24 horas. Te entregamos el sistema configurado y listo para probar en tu próximo turno sin riesgo.
                  </p>

                  <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
                    <GlowButton
                      onClick={() => handleOpenPilotModal('Plan Full (Recomendado)')}
                      className="w-full sm:w-auto px-8 py-4 text-base font-black"
                      icon={<ChevronRight className="w-5 h-5 flex-shrink-0" />}
                    >
                      <span>Solicitar Piloto 14 Días (0 €)</span>
                    </GlowButton>

                    <button
                      type="button"
                      onClick={handleOpenAllDashboards}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-6 py-4 rounded-xl text-sm sm:text-base font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 hover:text-slate-900 shadow-sm transition-colors cursor-pointer"
                    >
                      <span>Ver Demo Interactiva en Vivo</span>
                      <ExternalLink className="w-4 h-4 text-blue-600" />
                    </button>
                  </div>

                  <p className="text-xs text-slate-500 pt-2 font-medium">
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
          className="fixed bottom-6 right-6 z-50 max-w-sm bg-white/95 border-2 border-amber-500/80 rounded-2xl p-4 shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom-5"
        >
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center flex-shrink-0 mt-0.5">
              <ExternalLink className="w-4 h-4" />
            </div>
            <div className="space-y-1.5 flex-1">
              <h5 className="text-xs font-black text-slate-900">¿Tu navegador bloqueó pestañas?</h5>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                El navegador abrió la carta del comensal, pero bloqueó las pantallas de mozo y cocina. Puedes abrirlas manualmente:
              </p>
              <div className="flex items-center gap-2 pt-1">
                <a
                  href="/staff/comandero/burger-gourmet"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 border border-slate-200 text-[10px] font-bold text-blue-600"
                >
                  Abrir Mozo
                </a>
                <a
                  href="/staff/kitchen/burger-gourmet"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 border border-slate-200 text-[10px] font-bold text-blue-600"
                >
                  Abrir Cocina
                </a>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setPopupsBlocked(false)}
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </aside>
      )}

      {/* ── 9. FOOTER LIMPIO ── */}
      <footer className="border-t border-slate-200 py-8 px-4 bg-slate-50 text-xs text-slate-600">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start">
            <Link 
              href="/admin/crm" 
              className="inline-flex items-center gap-3 p-2.5 -m-2.5 rounded-2xl transition-all hover:bg-slate-100 active:scale-95 cursor-pointer group touch-manipulation" 
              title="Acceso CRM Fundador"
            >
              <div className="pointer-events-none flex-shrink-0 transition-transform group-hover:scale-110 group-active:scale-90">
                <FluxoLogo size={36} inverted={true} />
              </div>
              <span className="font-bold text-slate-600 group-hover:text-slate-900 transition-colors pointer-events-none select-none text-xs sm:text-sm">
                &middot; Sistema Gastronómico en Tiempo Real.
              </span>
            </Link>
          </div>

          <div className="flex items-center justify-center sm:justify-end gap-3 text-slate-600 flex-wrap">
            <Link 
              href="/legal" 
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 hover:border-blue-400 text-slate-700 hover:text-blue-600 font-bold transition-all shadow-xs group"
            >
              <ShieldCheck className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
              <span>Aviso Legal &amp; RGPD</span>
            </Link>

            <button
              type="button"
              onClick={handleOpenContactModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 hover:border-blue-400 text-slate-700 hover:text-blue-600 font-bold transition-all shadow-xs group cursor-pointer active:scale-95"
            >
              <span>Contacto Comercial</span>
              <ExternalLink className="w-3.5 h-3.5 text-blue-600 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>

        {/* ── ACCESO DISCRETO AL CRM (SOLO FUNDADOR) ── */}
        <div className="max-w-6xl mx-auto mt-8 pt-6 border-t border-slate-200 flex items-center justify-between gap-3 text-[11px] text-slate-400">
          <p>&copy; {new Date().getFullYear()} Fluxo Gastronomic System.</p>

          <a
            href="/admin/crm"
            onClick={(e) => {
              if (typeof window !== 'undefined') {
                window.location.assign('/admin/crm')
              }
            }}
            className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-700 active:text-slate-900 transition-colors p-2 -m-2 rounded-lg touch-manipulation cursor-pointer group"
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

      {/* ── MODAL UNIFICADO DE CONTACTO (PILOTO 14 DÍAS / CONSULTA POR CORREO) ── */}
      <PilotRequestModal
        isOpen={contactModal.isOpen}
        onClose={() => setContactModal((prev) => ({ ...prev, isOpen: false }))}
        initialPlan={contactModal.selectedPlan}
        mode={contactModal.mode}
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
