'use client'

import React, { useEffect, useRef, useState } from 'react'
import {
  Smartphone,
  ChefHat,
  QrCode,
  Star,
  Calculator,
  CheckCircle2,
  ArrowRight,
  ArrowDown,
  Check,
} from 'lucide-react'
import { ScrollReveal } from './ScrollReveal'
import { useDeckHeights } from './useDeckHeights'

/**
 * FeatureTabs
 * Sección explicativa de los 5 módulos de Fluxo ordenados según el recorrido real de un servicio.
 * Muestra el orden con flechas y una animación paso a paso (sin simuladores interactivos).
 * La demostración práctica vive en HeroSandbox (Carta · Mozo · Cocina).
 */

interface FeatureTabsProps {
  onOpenPilotModal: (plan?: string) => void
}

interface ModuleInfo {
  icon: React.ElementType
  moment: string
  title: string
  summary: string
  points: { strong: string; text: string }[]
}

// Orden del recorrido real: el comensal pide -> el mozo valida -> cocina prepara -> se cobra -> se fideliza
const MODULES: ModuleInfo[] = [
  {
    icon: QrCode,
    moment: 'El comensal pide',
    title: 'Carta QR y Auto-Pedido',
    summary: 'Catálogo visual con fotos y alérgenos desde el que el comensal pide sin esperar.',
    points: [
      { strong: 'Alérgenos según normativa europea:', text: 'filtros sin gluten, sin lactosa o veganos.' },
      { strong: 'Venta sugerida:', text: 'propone bebidas y postres automáticamente.' },
      { strong: 'Agotados en 1 toque:', text: 'se ocultan al instante de la carta.' },
    ],
  },
  {
    icon: Smartphone,
    moment: 'El camarero valida',
    title: 'Comandero Móvil',
    summary: 'Tus camareros controlan la sala desde su propio móvil y revisan cada pedido.',
    points: [
      { strong: 'Mapa de mesas por colores:', text: 'Libre, Ocupada y Pagada en Sobremesa.' },
      { strong: 'Validación antes de cocina:', text: 'ningún pedido entra sin revisión.' },
      { strong: 'Marcha en un toque:', text: 'cocina recibe el aviso sin desplazamientos.' },
    ],
  },
  {
    icon: ChefHat,
    moment: 'La cocina prepara',
    title: 'Monitor de Cocina',
    summary: 'Pantalla dividida por tiempos para que cada plato salga en su momento.',
    points: [
      { strong: 'Bloqueo de segundos platos:', text: 'postres y segundos no salen antes de tiempo.' },
      { strong: 'Semáforo de tiempos:', text: 'verde, ámbar y alerta roja según la espera.' },
      { strong: 'Botones grandes:', text: 'para manos mojadas o con guantes.' },
    ],
  },
  {
    icon: Calculator,
    moment: 'La mesa paga',
    title: 'Cierre de Caja y Métricas',
    summary: 'Cada cobro y propina queda separado y cuadrado al cerrar el turno.',
    points: [
      { strong: 'Desglose exacto:', text: 'efectivo, tarjeta y propinas por turno.' },
      { strong: 'Recaudación por camarero:', text: 'sin discusiones ni descuadres.' },
      { strong: 'Informe para tu gestoría:', text: 'descarga en PDF o Excel.' },
    ],
  },
  {
    icon: Star,
    moment: 'El cliente vuelve',
    title: 'Fidelización y Google Maps',
    summary: 'Tras pagar, cada comensal suma un sello y puede dejar su reseña.',
    points: [
      { strong: 'Cartilla digital de 5 visitas:', text: 'sello automático al pagar.' },
      { strong: 'Bonificación por reseña:', text: '+1 sello al valorar en Google Maps.' },
      { strong: 'Base de clientes propia:', text: 'para tus promociones de temporada.' },
    ],
  },
]

const STEP_MS = 2000

export function FeatureTabs({ onOpenPilotModal }: FeatureTabsProps) {
  const [active, setActive] = useState(0)
  const [inView, setInView] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  const sectionRef = useRef<HTMLElement | null>(null)
  // Mazo sticky de engranajes: iguala alturas de las li en el dispositivo (móvil)
  const deckRef = useDeckHeights()

  // Respeta prefers-reduced-motion
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mq.matches)
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  // Solo anima cuando la sección está en pantalla
  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const obs = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.3 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  // Avance automático en bucle infinito cada 2 segundos (nunca se detiene al
  // pasar el ratón: prohibido lingering con onMouseEnter/onMouseLeave).
  // `active` en dependencias reinicia el temporizador tras cualquier clic
  // manual (indicadores/tarjetas): el paso no salta medio segundo después
  // de la acción del usuario. Cleanup: clearInterval siempre al desmontar.
  useEffect(() => {
    if (!inView || reducedMotion) return
    const timer = setInterval(() => setActive((prev) => (prev + 1) % MODULES.length), STEP_MS)
    return () => clearInterval(timer)
  }, [active, inView, reducedMotion])

  const animate = inView && !reducedMotion

  return (
    <section
      ref={sectionRef}
      id="modulos"
      className="py-12 sm:py-20 bg-slate-50 border-t border-slate-200"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal distance={24}>
          <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-12 space-y-3">
            <span className="text-xs font-black uppercase tracking-wider text-blue-600">
              Así fluye un servicio con Fluxo
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Los 5 engranajes sincronizados de Fluxo
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              Desde que el comensal pide hasta que vuelve: cada paso activa el siguiente en menos de 100 ms.
            </p>
          </div>
        </ScrollReveal>

        {/* Barra de progreso global */}
        <div className="hidden lg:flex items-center justify-center gap-2 mb-8" aria-hidden="true">
          {MODULES.map((m, i) => (
            <button
              key={m.title}
              type="button"
              tabIndex={-1}
              onClick={() => setActive(i)}
              className="relative h-1.5 w-16 rounded-full bg-slate-200 overflow-hidden cursor-pointer"
            >
              <span
                className={`absolute inset-y-0 left-0 rounded-full bg-blue-600 ${i <= active ? 'w-full' : 'w-0'}`}
                style={
                  i === active && animate
                    ? { animation: `fluxoStepFill ${STEP_MS}ms linear forwards` }
                    : undefined
                }
                key={`${i}-${active}`}
              />
            </button>
          ))}
        </div>

        {/* Recorrido: horizontal en escritorio, baraja sticky en móvil (< 768px) */}
        <ol
          ref={deckRef}
          className="flex flex-col lg:flex-row lg:items-stretch gap-3 lg:gap-0 max-md:pb-12"
        >
          {MODULES.map((m, i) => {
            const Icon = m.icon
            const isActive = i === active
            const isDone = i < active
            // Mazo de cartas en móvil: escalón superior progresivo de 12px +
            // z creciente. El marginBottom de cierre (4-i)*12 alinea todos los
            // bordes inferiores al terminar el bloque (sin escalera invertida).
            // (clases literales completas: Tailwind no genera clases dinámicas;
            //  top/zIndex/marginBottom en style dinámico: en PC el li es static,
            //  el top/zIndex no aplican y md:!mb-0 anula el margen inline)
            const stickyCls = [
              'max-md:sticky max-md:min-h-[360px]',
              'max-md:sticky max-md:min-h-[360px]',
              'max-md:sticky max-md:min-h-[360px]',
              'max-md:sticky max-md:min-h-[360px]',
              'max-md:sticky max-md:min-h-[360px]',
            ][i]
            const stickyStyle = {
              top: `calc(76px + ${i * 12}px)`,
              marginBottom: `calc(${(5 - 1 - i) * 12}px)`,
              zIndex: 20 + i,
            }
            return (
              <React.Fragment key={m.title}>
                <li
                  className={`${stickyCls} md:!mb-0 max-md:shadow-[0_-6px_16px_-4px_rgba(15,23,42,0.08),0_12px_24px_-6px_rgba(15,23,42,0.12)] rounded-2xl lg:flex-1 lg:min-w-0`}
                  style={stickyStyle}
                >
                  <button
                    type="button"
                    onClick={() => setActive(i)}
                    aria-current={isActive ? 'step' : undefined}
                    className={`relative w-full h-full text-left bg-white overflow-hidden rounded-2xl p-5 border transition-all duration-500 cursor-pointer flex flex-col gap-3 max-md:justify-between ${
                      isActive
                        ? 'border-blue-500 shadow-xl shadow-blue-500/15 ring-4 ring-blue-500/10 lg:-translate-y-2'
                        : isDone
                          ? 'border-emerald-200 shadow-sm'
                          : 'border-slate-200 shadow-sm lg:opacity-80 lg:hover:opacity-100'
                    }`}
                  >
                    {/* Cabecera del paso */}
                    <div className="flex items-center justify-between">
                      <span
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black transition-colors duration-500 ${
                          isActive
                            ? 'bg-blue-600 text-white'
                            : isDone
                              ? 'bg-emerald-500 text-white'
                              : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {isDone ? <Check className="w-4 h-4" /> : i + 1}
                      </span>
                      <Icon
                        className={`w-5 h-5 transition-colors duration-500 ${
                          isActive ? 'text-blue-600' : isDone ? 'text-emerald-500' : 'text-slate-400'
                        }`}
                      />
                    </div>

                    <div>
                      <span
                        className={`text-[11px] font-black uppercase tracking-wider ${
                          isActive ? 'text-blue-600' : 'text-slate-400'
                        }`}
                      >
                        Paso {i + 1} · {m.moment}
                      </span>
                      <h3 className="text-base font-black text-slate-900 leading-tight mt-0.5">{m.title}</h3>
                    </div>

                    <p className="text-[13px] text-slate-600 leading-relaxed">{m.summary}</p>

                    <ul className="space-y-1.5 text-xs text-slate-600 pt-3 border-t border-slate-100">
                      {m.points.map((p) => (
                        <li key={p.strong} className="flex items-start gap-1.5">
                          <CheckCircle2
                            className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${
                              isActive || isDone ? 'text-emerald-500' : 'text-slate-300'
                            }`}
                          />
                          <span>
                            <strong className="text-slate-900">{p.strong}</strong> {p.text}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </button>
                </li>

                {/* Flecha conectora */}
                {i < MODULES.length - 1 && (
                  <li aria-hidden="true" className="flex items-center justify-center lg:w-8 flex-shrink-0 max-md:hidden">
                    <ArrowDown
                      className={`lg:hidden w-5 h-5 transition-colors duration-500 ${
                        i < active ? 'text-emerald-500' : i === active ? 'text-blue-600 animate-bounce' : 'text-slate-300'
                      }`}
                    />
                    <ArrowRight
                      className={`hidden lg:block w-5 h-5 transition-all duration-500 ${
                        i < active
                          ? 'text-emerald-500'
                          : i === active
                            ? 'text-blue-600 translate-x-0.5'
                            : 'text-slate-300'
                      }`}
                      style={i === active && animate ? { animation: 'fluxoArrowNudge 1s ease-in-out infinite' } : undefined}
                    />
                  </li>
                )}
              </React.Fragment>
            )
          })}
        </ol>

        <div className="mt-10 text-center">
          <button
            type="button"
            onClick={() => onOpenPilotModal('Plan Full (Recomendado)')}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-blue-700 bg-white hover:bg-blue-50 border border-blue-200 shadow-sm transition-colors cursor-pointer group"
          >
            Probar los 5 módulos en un piloto de 14 días
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* Keyframes locales de la animación paso a paso */}
      <style jsx global>{`
        @keyframes fluxoStepFill {
          from { width: 0%; }
          to { width: 100%; }
        }
        @keyframes fluxoArrowNudge {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(4px); }
        }
      `}</style>
    </section>
  )
}
