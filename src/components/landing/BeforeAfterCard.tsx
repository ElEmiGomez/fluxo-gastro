'use client'

import React from 'react'
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

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
        
        {/* Halo decorativo de fondo */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-red-600/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 text-center max-w-3xl mx-auto mb-8 space-y-2">
          <span className="text-xs font-black uppercase tracking-wider text-cyan-400">
            Comparativa Operativa
          </span>
          <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Antes vs. Después de Fluxo en tu Sala
          </h3>
          <p className="text-sm text-slate-400">
            El impacto directo de cambiar el desorden analógico por sincronización digital en tiempo real.
          </p>

          {/* Selector de vista para móviles */}
          <div className="md:hidden pt-3 flex items-center justify-center gap-1.5">
            <button
              type="button"
              onClick={() => setMobileView('both')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                mobileView === 'both' ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-400'
              }`}
            >
              Frente a Frente
            </button>
            <button
              type="button"
              onClick={() => setMobileView('before')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                mobileView === 'before' ? 'bg-red-500 text-white' : 'bg-slate-800 text-slate-400'
              }`}
            >
              El Caos
            </button>
            <button
              type="button"
              onClick={() => setMobileView('after')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                mobileView === 'after' ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-400'
              }`}
            >
              Con Fluxo
            </button>
          </div>
        </div>

        {/* Encabezados de Columna (Desktop) */}
        <div className="hidden md:grid md:grid-cols-2 gap-6 pb-4 border-b border-slate-800 text-sm font-black relative z-10">
          <div className="flex items-center justify-between px-3 text-red-400">
            <span className="flex items-center gap-2">
              <AlertOctagon className="w-4 h-4" /> Operación Tradicional
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] uppercase tracking-wider bg-red-500/15 border border-red-500/30">
              El Caos
            </span>
          </div>
          <div className="flex items-center justify-between px-3 text-cyan-400">
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> Con Fluxo
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
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
              {/* Lado Antes (El Caos) */}
              {(mobileView === 'both' || mobileView === 'before') && (
                <div className="bg-red-950/20 border border-red-500/25 rounded-2xl p-4 sm:p-5 flex items-start gap-3 transition-colors hover:border-red-500/40">
                  <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="text-xs sm:text-sm">
                    <span className="text-[10px] font-black uppercase tracking-wider text-red-400 block mb-0.5 md:hidden">
                      {row.aspect} &middot; El Caos
                    </span>
                    <strong className="text-red-300 font-bold hidden md:inline mr-1">
                      {row.aspect}:
                    </strong>
                    <span className="text-slate-300 leading-relaxed">{row.before}</span>
                  </div>
                </div>
              )}

              {/* Lado Después (Con Fluxo) */}
              {(mobileView === 'both' || mobileView === 'after') && (
                <div className="bg-cyan-950/25 border-2 border-cyan-500/40 hover:border-cyan-400 rounded-2xl p-4 sm:p-5 flex items-start gap-3 shadow-sm transition-all">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <div className="text-xs sm:text-sm">
                    <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400 block mb-0.5 md:hidden">
                      {row.aspect} &middot; Con Fluxo
                    </span>
                    <strong className="text-cyan-300 font-bold block sm:inline mr-1">
                      {row.afterTitle}:
                    </strong>
                    <span className="text-slate-200 leading-relaxed">{row.after}</span>
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
