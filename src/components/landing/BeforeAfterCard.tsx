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
  const [mobileView, setMobileView] = React.useState<'both' | 'before' | 'after'>('both')
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

          {/* Selector de vista para móviles */}
          <div className="md:hidden pt-3 flex items-center justify-center gap-1.5">
            <button
              type="button"
              onClick={() => setMobileView('both')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                mobileView === 'both' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              Frente a Frente
            </button>
            <button
              type="button"
              onClick={() => setMobileView('before')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                mobileView === 'before' ? 'bg-rose-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              El Caos
            </button>
            <button
              type="button"
              onClick={() => setMobileView('after')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                mobileView === 'after' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              Con Fluxo
            </button>
          </div>
        </div>

        {/* Encabezados de Columna (Desktop) */}
        <div className="hidden md:grid md:grid-cols-2 gap-6 pb-4 border-b border-slate-200 text-sm font-black relative z-10">
          <div className="flex items-center justify-between px-3 text-rose-600">
            <span className="flex items-center gap-2">
              <AlertOctagon className="w-4 h-4" /> Operación Tradicional
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200">
              El Caos
            </span>
          </div>
          <div className="flex items-center justify-between px-3 text-blue-600">
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> Con Fluxo
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
              Control Total
            </span>
          </div>
        </div>

        {/* Filas alineadas aspecto por aspecto */}
        <div className="space-y-4 pt-4 relative z-10">
          {COMPARISON_ROWS.map((row, idx) => (
            <div
              key={idx}
              className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch"
            >
              {/* Lado Antes (El Caos) — se transforma a «Después con Fluxo» al hover o toque */}
              {(mobileView === 'both' || mobileView === 'before') && (
                <div
                  role="button"
                  tabIndex={0}
                  aria-pressed={revealed.has(idx)}
                  onMouseEnter={() => revealCard(idx)}
                  onMouseLeave={() => hideCard(idx)}
                  onClick={() => toggleCard(idx)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      toggleCard(idx)
                    }
                  }}
                  className={`rounded-2xl p-4 sm:p-5 flex items-start gap-3 transition-all duration-300 shadow-xs cursor-pointer ${
                    revealed.has(idx)
                      ? 'bg-blue-50/70 border-2 border-blue-500 hover:shadow-md'
                      : 'bg-rose-50/70 border border-rose-200 hover:border-rose-300'
                  }`}
                >
                  {revealed.has(idx) ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="text-xs sm:text-sm">
                        <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 block mb-0.5 md:hidden">
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
                        <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 block mb-0.5 md:hidden">
                          {row.aspect} &middot; El Caos
                        </span>
                        <strong className="text-rose-900 font-bold hidden md:inline mr-1">
                          {row.aspect}:
                        </strong>
                        <span className="text-slate-700 leading-relaxed">{row.before}</span>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Lado Después (Con Fluxo) */}
              {(mobileView === 'both' || mobileView === 'after') && (
                <div className="bg-blue-50/40 border-2 border-blue-500/50 hover:border-blue-500 rounded-2xl p-4 sm:p-5 flex items-start gap-3 shadow-xs hover:shadow-md transition-all">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-xs sm:text-sm">
                    <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 block mb-0.5 md:hidden">
                      {row.aspect} &middot; Con Fluxo
                    </span>
                    <strong className="text-blue-700 font-bold block sm:inline mr-1">
                      {row.afterTitle}:
                    </strong>
                    <span className="text-slate-800 leading-relaxed">{row.after}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
