'use client'

import React, { useState } from 'react'
import { XCircle, CheckCircle2, AlertOctagon, Sparkles, TrendingDown } from 'lucide-react'

interface ComparisonRow {
  aspect: string
  before: string
  afterTitle: string
  after: string
  impact: string
}

const COMPARISON_ROWS: ComparisonRow[] = [
  {
    aspect: 'Pase de platos',
    before: 'Gritos a cocina, tickets térmicos extraviados o traspapelados.',
    afterTitle: 'Pantalla KDS',
    after: 'Tiempos sincronizados y pases con acordeones inteligentes auto-colapsables.',
    impact: '-15 min de espera',
  },
  {
    aspect: 'Marcha de principales',
    before: 'El camarero tiene que ir caminando hasta la cocina a dar el aviso.',
    afterTitle: 'Un toque en comandero',
    after: 'El cocinero recibe la alerta en pantalla sin desplazamientos.',
    impact: '0 desplazamientos',
  },
  {
    aspect: 'Reseñas en Google',
    before: 'Rogar al cliente que valore o esperar que alguien deje una crítica.',
    afterTitle: 'Automatizado',
    after: 'La carta ofrece +1 sello al registrarse y valorar en Google Maps tras pagar.',
    impact: '+4.9★ en Google',
  },
  {
    aspect: 'Inversión en equipamiento',
    before: 'TPVs propietarios de 1.500 € a 3.000 € más costes de instalación.',
    afterTitle: '0 € en hardware nuevo',
    after: 'Funciona directamente sobre los móviles y tablets existentes.',
    impact: '0 € en hardware',
  },
  {
    aspect: 'Liquidación de mesa',
    before: 'Desfases de importes y dudas sobre qué platos se sirvieron.',
    afterTitle: 'Trazabilidad absoluta',
    after: 'Cuenta sincronizada y mesa liberada al instante para el siguiente turno.',
    impact: '100% cuadrado',
  },
]

type RoomMode = 'chaos' | 'compare' | 'fluxo'

const MODES: { key: RoomMode; label: string }[] = [
  { key: 'chaos', label: '🔴 Sala Tradicional (El Caos)' },
  { key: 'compare', label: '⚡ Comparativa Interactiva' },
  { key: 'fluxo', label: '🟢 Sala con Fluxo (Control Total)' },
]

export function BeforeAfterCard() {
  const [mode, setMode] = useState<RoomMode>('compare')
  // Tarjetas del "Antes" transformadas al tocarlas (dolor -> solución Fluxo)
  const [revealed, setRevealed] = useState<Set<number>>(new Set())

  const toggleRevealed = (idx: number) => {
    setRevealed((prev) => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
  }

  const showBefore = mode === 'chaos' || mode === 'compare'
  const showAfter = mode === 'fluxo' || mode === 'compare'

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

          {/* ── CONMUTADOR MAESTRO DE TRANSFORMACIÓN ── */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-2">
            <div
              role="group"
              aria-label="Conmutador de transformación de la sala"
              className="inline-flex flex-wrap justify-center items-center gap-1 p-1.5 rounded-2xl bg-slate-100 border border-slate-200 shadow-inner"
            >
              {MODES.map((m) => {
                const active = mode === m.key
                return (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => setMode(m.key)}
                    aria-pressed={active}
                    className={`px-3.5 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-black transition-all duration-300 cursor-pointer active:scale-95 ${
                      active
                        ? m.key === 'chaos'
                          ? 'bg-rose-600 text-white shadow-md shadow-rose-500/25'
                          : m.key === 'fluxo'
                            ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/25'
                            : 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                    }`}
                  >
                    {m.label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Encabezados de Columna (Desktop, en modo comparativa) */}
        <div className="hidden md:grid md:grid-cols-2 gap-6 pb-4 border-b border-slate-200 text-sm font-black relative z-10">
          <div className={`flex items-center justify-between px-3 ${showBefore ? 'text-rose-600' : 'text-slate-300'}`}>
            <span className="flex items-center gap-2">
              <AlertOctagon className="w-4 h-4" /> Operación Tradicional
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200">
              El Caos
            </span>
          </div>
          <div className={`flex items-center justify-between px-3 ${showAfter ? 'text-blue-600' : 'text-slate-300'}`}>
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
          {COMPARISON_ROWS.map((row, idx) => {
            // En modo Caos el clic sobre la tarjeta roja la transforma en solución Fluxo
            const isRevealed = revealed.has(idx)
            return (
              <div
                key={idx}
                className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch"
              >
                {/* Lado Antes (El Caos) — interactivo: se transforma al tocarlo */}
                {showBefore && (
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => toggleRevealed(idx)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        toggleRevealed(idx)
                      }
                    }}
                    aria-pressed={isRevealed}
                    className={`rounded-2xl p-4 sm:p-5 flex items-start gap-3 cursor-pointer transition-all duration-300 shadow-xs hover:-translate-y-1 active:translate-y-0 hover:shadow-lg ${
                      isRevealed
                        ? 'bg-emerald-50/70 border-2 border-emerald-500 hover:border-emerald-400'
                        : 'bg-rose-50/70 border border-rose-200 hover:border-rose-400'
                    }`}
                  >
                    {isRevealed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="text-xs sm:text-sm min-w-0">
                      {!isRevealed && (
                        <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 block mb-0.5 md:hidden">
                          {row.aspect} &middot; El Caos
                        </span>
                      )}
                      {isRevealed ? (
                        /* Estado transformado: dolor tachado + solución Fluxo + insignia de impacto */
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 block">
                            {row.aspect} &middot; Transformado
                          </span>
                          <p className="text-rose-500/80 line-through leading-relaxed">{row.before}</p>
                          <p className="text-slate-800 leading-relaxed">
                            <strong className="text-emerald-700 font-bold mr-1">{row.afterTitle}:</strong>
                            {row.after}
                          </p>
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider shadow-sm">
                            <TrendingDown className="w-3 h-3" />
                            {row.impact}
                          </span>
                        </div>
                      ) : (
                        <p className="leading-relaxed">
                          <strong className="text-rose-900 font-bold hidden md:inline mr-1">
                            {row.aspect}:
                          </strong>
                          <span className="text-slate-700">{row.before}</span>
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Lado Después (Con Fluxo) — con insignia de impacto */}
                {showAfter && (
                  <div className="bg-blue-50/40 border-2 border-blue-500/50 hover:border-blue-500 rounded-2xl p-4 sm:p-5 flex items-start gap-3 shadow-xs hover:shadow-md transition-all duration-300 hover:-translate-y-1">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-xs sm:text-sm">
                      <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 block mb-0.5 md:hidden">
                        {row.aspect} &middot; Con Fluxo
                      </span>
                      <strong className="text-blue-700 font-bold block sm:inline mr-1">
                        {row.afterTitle}:
                      </strong>
                      <span className="text-slate-800 leading-relaxed">{row.after}</span>
                      <span className="mt-1.5 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-600/10 text-blue-700 border border-blue-300 text-[10px] font-black uppercase tracking-wider">
                        <Sparkles className="w-3 h-3" />
                        {row.impact}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Ayuda de interacción */}
        <p className="relative z-10 mt-6 text-center text-[11px] text-slate-400 font-semibold">
          {mode === 'chaos'
            ? 'Toca cualquier tarjeta roja del caos para ver cómo Fluxo la transforma.'
            : mode === 'fluxo'
              ? 'Tu sala operando con Fluxo: cada aspecto resuelto con su impacto real.'
              : 'Toca una tarjeta del «Antes» para transformarla, o cambia el conmutador superior.'}
        </p>

      </div>
    </div>
  )
}
