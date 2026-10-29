'use client'

import React, { useState } from 'react'
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
  // Interruptor global: los 5 bloques cambian de «El Caos» a «Con Fluxo» a la vez
  const [showFluxo, setShowFluxo] = useState(false)

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-10 shadow-xl relative overflow-hidden">

        {/* Halos decorativos de fondo — ocultos en móvil: el blur grande se
            rasteriza mal en iOS Safari y pinta manchas grises cerca de los
            bordes del cuadro (bordes fantasmas). En PC se mantienen. */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none max-md:hidden" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-rose-500/5 rounded-full blur-3xl pointer-events-none max-md:hidden" />

        <div className="relative z-10 text-center max-w-3xl mx-auto mb-6 space-y-2">
          <span className="text-xs font-black uppercase tracking-wider text-blue-600">
            Comparativa Operativa
          </span>
          <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Del Caos al Control: tu Sala con Fluxo
          </h3>
          <p className="text-sm text-slate-600">
            Cinco dolores diarios del servicio y cómo los resuelve la sincronización en tiempo real.
          </p>
        </div>

        {/* Interruptor global «El Caos ⟷ Con Fluxo» */}
        <div className="relative z-10 flex justify-center mb-8">
          <div
            className="inline-flex items-center p-1.5 rounded-full bg-slate-100 border border-slate-200 shadow-inner"
            role="group"
            aria-label="Alternar entre El Caos y Con Fluxo"
          >
            <button
              type="button"
              onClick={() => setShowFluxo(false)}
              aria-pressed={!showFluxo}
              className={`inline-flex items-center gap-1.5 px-4 sm:px-6 py-2.5 rounded-full text-xs sm:text-sm font-black transition-all duration-300 cursor-pointer ${
                !showFluxo
                  ? 'bg-white text-rose-700 shadow-md ring-1 ring-rose-200'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <AlertOctagon className="w-4 h-4" />
              El Caos
            </button>
            <button
              type="button"
              onClick={() => setShowFluxo(true)}
              aria-pressed={showFluxo}
              className={`inline-flex items-center gap-1.5 px-4 sm:px-6 py-2.5 rounded-full text-xs sm:text-sm font-black transition-all duration-300 cursor-pointer ${
                showFluxo
                  ? 'bg-white text-blue-700 shadow-md ring-1 ring-blue-200'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              Con Fluxo
            </button>
          </div>
        </div>

        {/* Los 5 aspectos: se transforman todos a la vez con el interruptor */}
        <div id="antes-despues" className="relative z-10 max-w-3xl mx-auto space-y-4">
          {COMPARISON_ROWS.map((row) => (
            <div
              key={row.aspect}
              className={`rounded-2xl p-4 sm:p-5 flex items-start gap-3 transition-all duration-500 shadow-xs ${
                showFluxo
                  ? 'bg-blue-50 border-2 border-blue-500/60'
                  : 'bg-rose-50 border-2 border-rose-200'
              }`}
            >
              {showFluxo ? (
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
          ))}
        </div>

      </div>
    </div>
  )
}
