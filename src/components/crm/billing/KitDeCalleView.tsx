'use client'

import React, { useEffect, useState } from 'react'
import { Printer, Smartphone, Loader2 } from 'lucide-react'
import { LocalBilling } from '@/lib/billing/billing-calculations'
import { loadBillingLocales } from '@/lib/billing/crm-demo-seed'
import { StreetKitPhysicalGenerator } from '@/components/crm/billing/StreetKitPhysicalGenerator'
import { DigitalLocalQrStudio } from '@/components/crm/billing/DigitalLocalQrStudio'

type KitMode = 'fisico' | 'digital'

/**
 * Pestaña 3 del CRM Fundador: Kit de Calle (`/demo` Físico) & QRs Digitales.
 * Dos modos: soporte físico plastificable (solo QR maestro de demostración)
 * y QRs 100% digitales por local.
 */
export function KitDeCalleView() {
  const [mode, setMode] = useState<KitMode>('fisico')
  const [locales, setLocales] = useState<LocalBilling[] | null>(null)

  useEffect(() => {
    setLocales(loadBillingLocales())
  }, [])

  return (
    <div className="px-5 py-6 max-w-5xl w-full mx-auto space-y-5">
      {/* Cabecera */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
          <Printer className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-black text-white leading-tight">Kit de Calle &amp; QRs Digitales</h2>
          <p className="text-[11px] text-slate-400">
            Soporte físico `/demo` para imprimir y plastificar · QRs digitales por local
          </p>
        </div>
      </div>

      {/* Selector de modo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <button
          onClick={() => setMode('fisico')}
          className={`p-4 rounded-2xl border text-left apple-smooth flex items-center gap-3 ${
            mode === 'fisico'
              ? 'bg-purple-500/15 border-purple-500/40'
              : 'bg-white/[0.04] border-white/[0.08] hover:bg-white/[0.07]'
          }`}
        >
          <Printer className={`w-5 h-5 ${mode === 'fisico' ? 'text-purple-300' : 'text-slate-400'}`} />
          <div>
            <p className={`text-xs font-black ${mode === 'fisico' ? 'text-white' : 'text-slate-300'}`}>
              Kit de Calle Físico
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Láminas A5/A6 + caballete A4 · exclusivo QR maestro /demo
            </p>
          </div>
        </button>
        <button
          onClick={() => setMode('digital')}
          className={`p-4 rounded-2xl border text-left apple-smooth flex items-center gap-3 ${
            mode === 'digital'
              ? 'bg-cyan-500/15 border-cyan-500/40'
              : 'bg-white/[0.04] border-white/[0.08] hover:bg-white/[0.07]'
          }`}
        >
          <Smartphone className={`w-5 h-5 ${mode === 'digital' ? 'text-cyan-300' : 'text-slate-400'}`} />
          <div>
            <p className={`text-xs font-black ${mode === 'digital' ? 'text-white' : 'text-slate-300'}`}>
              QRs 100% Digitales por Local
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Pitch en barra + tarjeta 9:16 para WhatsApp
            </p>
          </div>
        </button>
      </div>

      {/* Contenido del modo activo */}
      {locales === null ? (
        <div className="flex items-center justify-center py-16 text-slate-400 text-sm">
          <Loader2 className="w-4 h-4 animate-spin mr-2" /> Preparando locales del kit…
        </div>
      ) : mode === 'fisico' ? (
        <StreetKitPhysicalGenerator />
      ) : (
        <DigitalLocalQrStudio locales={locales} />
      )}
    </div>
  )
}
