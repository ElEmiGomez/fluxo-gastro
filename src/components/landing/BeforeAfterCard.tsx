'use client'

import React, { useState } from 'react'
import {
  XCircle,
  CheckCircle2,
  AlertOctagon,
  Sparkles,
  Zap,
  ArrowRight,
  TrendingDown,
  Coins,
  Star,
  ShieldCheck,
  Clock
} from 'lucide-react'

interface ComparisonRow {
  id: string
  aspect: string
  before: string
  afterTitle: string
  after: string
  impactBadge: string
  icon: React.ElementType
}

const COMPARISON_ROWS: ComparisonRow[] = [
  {
    id: 'pase',
    aspect: 'Pase de platos',
    before: 'Gritos a cocina, tickets térmicos extraviados o traspapelados.',
    afterTitle: 'Pantalla de cocina (KDS)',
    after: 'Tiempos sincronizados y pases con acordeones inteligentes auto-colapsables.',
    impactBadge: '-15 min de espera',
    icon: Clock,
  },
  {
    id: 'marcha',
    aspect: 'Marcha de principales',
    before: 'El camarero tiene que ir caminando hasta la cocina a dar el aviso.',
    afterTitle: 'Un toque en comandero',
    after: 'El cocinero recibe la alerta en pantalla sin desplazamientos.',
    impactBadge: '-40% pasos de mozo',
    icon: Zap,
  },
  {
    id: 'resenas',
    aspect: 'Reseñas en Google',
    before: 'Rogar al cliente que valore o esperar que alguien deje una crítica.',
    afterTitle: 'Automatizado',
    after: 'La carta ofrece +1 sello al registrarse y valorar en Google Maps tras pagar.',
    impactBadge: '+4.9★ en Google',
    icon: Star,
  },
  {
    id: 'hardware',
    aspect: 'Inversión en equipamiento',
    before: 'TPVs propietarios de 1.500 € a 3.000 € más costes de instalación.',
    afterTitle: '0 € en hardware nuevo',
    after: 'Funciona directamente sobre los móviles y tablets existentes.',
    impactBadge: '0 € en hardware',
    icon: Coins,
  },
  {
    id: 'liquidacion',
    aspect: 'Liquidación de mesa',
    before: 'Desfases de importes y dudas sobre qué platos se sirvieron.',
    afterTitle: 'Trazabilidad absoluta',
    after: 'Cuenta sincronizada y mesa liberada al instante para el siguiente turno.',
    impactBadge: '100% cuadrado',
    icon: ShieldCheck,
  },
]

type Mode = 'caos' | 'comparativa' | 'fluxo'

export function BeforeAfterCard() {
  // 3 Modos: 'caos' | 'comparativa' | 'fluxo'
  const [mode, setMode] = useState<Mode>('comparativa')
  
  // Sobrescrituras individuales por tarjeta al hacer clic
  const [cardOverrides, setCardOverrides] = useState<Record<string, boolean>>({})

  // Determinar si una fila está activa en modo Fluxo
  const isCardFluxo = (rowId: string) => {
    if (cardOverrides[rowId] !== undefined) {
      return cardOverrides[rowId]
    }
    if (mode === 'fluxo') return true
    if (mode === 'caos') return false
    // En modo comparativa: por defecto mostramos la solución o permitimos alternar
    return true
  }

  const toggleCard = (rowId: string) => {
    setCardOverrides((prev) => ({
      ...prev,
      [rowId]: !isCardFluxo(rowId),
    }))
  }

  const handleModeChange = (newMode: Mode) => {
    setMode(newMode)
    // Limpiar overrides individuales para que el modo global mande
    setCardOverrides({})
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-10 shadow-xl relative overflow-hidden">
        
        {/* Halos decorativos suaves */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none max-md:hidden" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none max-md:hidden" />

        <div className="relative z-10 text-center max-w-3xl mx-auto mb-6 space-y-2">
          <span className="text-xs font-black uppercase tracking-wider text-blue-600">
            Comparativa Operativa
          </span>
          <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Antes vs. Después de Fluxo en tu Sala
          </h3>
          <p className="text-sm text-slate-600">
            Cinco dolores críticos del servicio diario y cómo se transforman con sincronización instantánea.
          </p>
        </div>

        {/* ── CONMUTADOR (SWITCH) INTERACTIVO DE 3 MODOS ── */}
        <div className="relative z-10 flex flex-col items-center gap-2 mb-8">
          <div
            className="inline-flex flex-wrap items-center justify-center p-1.5 rounded-2xl bg-slate-100 border border-slate-200 shadow-inner gap-1"
            role="group"
            aria-label="Conmutador de comparativa"
          >
            {/* Modo 1: El Caos */}
            <button
              type="button"
              onClick={() => handleModeChange('caos')}
              aria-pressed={mode === 'caos'}
              className={`inline-flex items-center gap-1.5 px-3.5 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-black transition-all duration-300 cursor-pointer ${
                mode === 'caos'
                  ? 'bg-rose-600 text-white shadow-md ring-1 ring-rose-400 scale-[1.02]'
                  : 'text-slate-600 hover:text-rose-700 hover:bg-slate-200/60'
              }`}
            >
              <AlertOctagon className="w-4 h-4 text-white" />
              <span>🔴 Operación Tradicional (El Caos)</span>
            </button>

            {/* Modo 2: Comparativa Interactiva */}
            <button
              type="button"
              onClick={() => handleModeChange('comparativa')}
              aria-pressed={mode === 'comparativa'}
              className={`inline-flex items-center gap-1.5 px-3.5 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-black transition-all duration-300 cursor-pointer ${
                mode === 'comparativa'
                  ? 'bg-blue-600 text-white shadow-md ring-1 ring-blue-400 scale-[1.02]'
                  : 'text-slate-600 hover:text-blue-700 hover:bg-slate-200/60'
              }`}
            >
              <Zap className="w-4 h-4 text-amber-300" />
              <span>⚡ Comparativa Interactiva</span>
            </button>

            {/* Modo 3: Con Fluxo */}
            <button
              type="button"
              onClick={() => handleModeChange('fluxo')}
              aria-pressed={mode === 'fluxo'}
              className={`inline-flex items-center gap-1.5 px-3.5 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-black transition-all duration-300 cursor-pointer ${
                mode === 'fluxo'
                  ? 'bg-emerald-600 text-white shadow-md ring-1 ring-emerald-400 scale-[1.02]'
                  : 'text-slate-600 hover:text-emerald-700 hover:bg-slate-200/60'
              }`}
            >
              <Sparkles className="w-4 h-4 text-white" />
              <span>🟢 Operación con Fluxo (Control Total)</span>
            </button>
          </div>

          <p className="text-[11px] text-slate-500 font-medium">
            💡 Toca o haz clic sobre cualquier tarjeta para transformar su dolor individual en solución.
          </p>
        </div>

        {/* ── LAS 5 TARJETAS TRANSFORMABLES INTERACTIVAS ── */}
        <div id="antes-despues" className="relative z-10 max-w-3xl mx-auto space-y-3.5">
          {COMPARISON_ROWS.map((row) => {
            const isFluxo = isCardFluxo(row.id)
            const RowIcon = row.icon

            return (
              <div
                key={row.id}
                onClick={() => toggleCard(row.id)}
                className={`group rounded-2xl p-4 sm:p-5 transition-all duration-300 cursor-pointer select-none border-2 ${
                  isFluxo
                    ? 'bg-gradient-to-r from-blue-50/90 via-sky-50/50 to-emerald-50/80 border-emerald-500/80 shadow-md hover:shadow-lg hover:-translate-y-0.5'
                    : 'bg-rose-50/80 border-rose-200 shadow-xs hover:border-rose-400 hover:bg-rose-50'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  
                  {/* Contenido Principal */}
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                        isFluxo
                          ? 'bg-emerald-500 text-white shadow-sm'
                          : 'bg-rose-200 text-rose-700'
                      }`}
                    >
                      {isFluxo ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <XCircle className="w-5 h-5" />
                      )}
                    </div>

                    <div className="space-y-1 flex-1">
                      {/* Cabecera de la fila con categoría */}
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                            isFluxo
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {row.aspect}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">
                          {isFluxo ? '● Con Fluxo' : '● Operación Tradicional'}
                        </span>
                      </div>

                      {/* Transición Suave: Dolor vs Solución */}
                      {isFluxo ? (
                        <div className="space-y-1 animate-in fade-in duration-300">
                          {/* Dolor tachado sutil */}
                          <p className="text-[11px] text-slate-400 line-through truncate max-w-xl">
                            Antes: {row.before}
                          </p>
                          {/* Solución destacada */}
                          <p className="text-xs sm:text-sm text-slate-800 leading-relaxed">
                            <strong className="text-emerald-700 font-extrabold mr-1">
                              {row.afterTitle}:
                            </strong>
                            <span>{row.after}</span>
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-1 animate-in fade-in duration-300">
                          <p className="text-xs sm:text-sm text-rose-950 font-medium leading-relaxed">
                            <strong className="text-rose-700 font-black mr-1">El Caos:</strong>
                            {row.before}
                          </p>
                          <span className="text-[11px] text-blue-600 font-bold hover:underline inline-flex items-center gap-1">
                            Toca para ver cómo lo soluciona Fluxo <ArrowRight className="w-3 h-3" />
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Insignia de Impacto Numérico */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1.5 flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/60">
                    <span
                      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-black shadow-xs transition-all ${
                        isFluxo
                          ? 'bg-emerald-600 text-white shadow-emerald-500/25 ring-2 ring-emerald-300/50 scale-105'
                          : 'bg-slate-200 text-slate-600 opacity-60'
                      }`}
                    >
                      <RowIcon className="w-3.5 h-3.5" />
                      <span>{row.impactBadge}</span>
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400 hidden sm:inline">
                      {isFluxo ? 'Impacto medido' : 'Dolor evitable'}
                    </span>
                  </div>

                </div>
              </div>
            )
          })}
        </div>

      </div>
    </div>
  )
}
