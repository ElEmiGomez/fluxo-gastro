'use client'

import React, { useEffect, useState } from 'react'
import { XCircle, CheckCircle2, AlertOctagon, Sparkles } from 'lucide-react'

interface ComparisonRow {
  aspect: string
  before: string
  afterTitle: string
  after: string
}

const COMPARISON_ROWS: ComparisonRow[] = [
  {
    aspect: 'Pase de platos',
    before: 'Gritos a cocina, tickets térmicos extraviados o traspapelados.',
    afterTitle: 'Pantalla KDS',
    after: 'Tiempos sincronizados y pases con acordeones inteligentes auto-colapsables.',
  },
  {
    aspect: 'Marcha de principales',
    before: 'El camarero tiene que ir caminando hasta la cocina a dar el aviso.',
    afterTitle: 'Un toque en comandero',
    after: 'El cocinero recibe la alerta en pantalla sin desplazamientos.',
  },
  {
    aspect: 'Reseñas en Google',
    before: 'Rogar al cliente que valore o esperar que alguien deje una crítica.',
    afterTitle: 'Automatizado',
    after: 'La carta ofrece +1 sello al registrarse y valorar en Google Maps tras pagar.',
  },
  {
    aspect: 'Inversión en equipamiento',
    before: 'TPVs propietarios de 1.500 € a 3.000 € más costes de instalación.',
    afterTitle: '0 € en hardware nuevo',
    after: 'Funciona directamente sobre los móviles y tablets existentes.',
  },
  {
    aspect: 'Liquidación de mesa',
    before: 'Desfases de importes y dudas sobre qué platos se sirvieron.',
    afterTitle: 'Trazabilidad absoluta',
    after: 'Cuenta sincronizada y mesa liberada al instante para el siguiente turno.',
  },
]

export function BeforeAfterCard() {
  // Transformación «Antes → Después con Fluxo»: al pasar el ratón (desktop) o tocar (móvil)
  const [revealed, setRevealed] = useState<Set<number>>(new Set())
  const [canHover, setCanHover] = useState(false)

  // Solo los dispositivos con puntero real controlan la tarjeta por hover;
  // en táctil la transformación se fija con un toque (toggle)
  useEffect(() => {
    setCanHover(window.matchMedia('(hover: hover) and (pointer: fine)').matches)
  }, [])

  const revealCard = (idx: number) => {
    if (!canHover) return
    setRevealed((prev) => new Set(prev).add(idx))
  }

  const hideCard = (idx: number) => {
    if (!canHover) return
    setRevealed((prev) => {
      const next = new Set(prev)
      next.delete(idx)
      return next
    })
  }

  const toggleCard = (idx: number) => {
    setRevealed((prev) => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-xl relative overflow-hidden">

        {/* Halo decorativo de fondo */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 text-center max-w-3xl mx-auto mb-8 space-y-2">
          <span className="text-xs font-black uppercase tracking-wider text-blue-600">
            Comparativa Operativa
          </span>
          <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Antes vs. Después de Fluxo en tu Sala
          </h3>
          <p className="text-sm text-slate-600">
            El impacto directo de cambiar el desorden analógico por sincronización digital en tiempo real.
          </p>
          <div className="hidden md:flex items-center justify-center gap-2 pt-2 text-[11px] font-bold text-slate-400">
            <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
            <span>Pasa el ratón por cada bloque para ver cómo Fluxo lo transforma</span>
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="md:hidden flex items-center justify-center gap-2 pt-2 text-[11px] font-bold text-slate-400">
            <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
            <span>Toca cada bloque para ver cómo Fluxo lo transforma</span>
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          </div>
        </div>

        {/* Una fila de bloques: El Caos por defecto → Fluxo al hover / toque */}
        <div id="antes-despues" className="relative z-10 max-w-3xl mx-auto space-y-4">
          {COMPARISON_ROWS.map((row, idx) => {
            // Sticky Scroll Stack móvil: cada bloque se superpone sobre el anterior al hacer scroll
            // (clases literales completas: Tailwind no genera clases dinámicas)
            const stickyCls = [
              'max-md:sticky max-md:top-20 max-md:z-10',
              'max-md:sticky max-md:top-24 max-md:z-20',
              'max-md:sticky max-md:top-28 max-md:z-30',
              'max-md:sticky max-md:top-32 max-md:z-40',
              'max-md:sticky max-md:top-36 max-md:z-50',
            ][idx]
            const isRevealed = revealed.has(idx)
            return (
              <div
                key={row.aspect}
                role="button"
                tabIndex={0}
                aria-pressed={isRevealed}
                onMouseEnter={() => revealCard(idx)}
                onMouseLeave={() => hideCard(idx)}
                onClick={() => toggleCard(idx)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    toggleCard(idx)
                  }
                }}
                className={`${stickyCls} max-md:shadow-[0_-8px_20px_rgba(0,0,0,0.08)] rounded-2xl p-4 sm:p-5 flex items-start gap-3 transition-all duration-300 shadow-xs cursor-pointer ${
                  isRevealed
                    ? 'bg-blue-50 border-2 border-blue-500 hover:shadow-md'
                    : 'bg-rose-50 border border-rose-200 hover:border-rose-300'
                }`}
              >
                {isRevealed ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-xs sm:text-sm">
                      <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 block mb-0.5">
                        {row.aspect} &middot; Con Fluxo
                      </span>
                      <strong className="text-blue-700 font-bold block sm:inline mr-1">
                        {row.afterTitle}:
                      </strong>
                      <span className="text-slate-800 leading-relaxed">{row.after}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                    <div className="text-xs sm:text-sm">
                      <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 block mb-0.5">
                        {row.aspect} &middot; El Caos
                      </span>
                      <span className="text-slate-700 leading-relaxed">{row.before}</span>
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>

      </div>
    </div>
  )
}
