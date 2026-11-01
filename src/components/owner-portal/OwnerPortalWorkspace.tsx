'use client'

import React, { useEffect, useState } from 'react'
import { DoorOpen, Loader2, Crown, RefreshCcw } from 'lucide-react'
import { LocalBilling } from '@/lib/billing/billing-calculations'
import {
  loadBillingLocales,
  resetDemoLocales,
  saveBillingLocales,
} from '@/lib/billing/crm-demo-seed'
import { OwnerPortalContainer } from './OwnerPortalContainer'

/**
 * Pestaña 2 del CRM Fundador: Portal del Dueño (Vista Previa & Gestión por
 * Local). Selector de local + contenedor desacoplado reutilizable después
 * en /panel/[slug] o en el login de la landing.
 */
export function OwnerPortalWorkspace() {
  const [locales, setLocales] = useState<LocalBilling[] | null>(null)
  const [selectedId, setSelectedId] = useState<string>('')

  useEffect(() => {
    const loaded = loadBillingLocales()
    setLocales(loaded)
    setSelectedId(loaded[0]?.id ?? '')
  }, [])

  if (!locales) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        <span className="text-sm">Inicializando Portal del Dueño…</span>
      </div>
    )
  }

  const selected = locales.find((l) => l.id === selectedId) ?? locales[0] ?? null
  if (!selected) return null

  const patchLocal = (patch: Partial<LocalBilling>) => {
    const next = locales.map((l) => (l.id === selected.id ? { ...l, ...patch } : l))
    saveBillingLocales(next)
    setLocales(next)
  }

  return (
    <div className="px-5 py-6 max-w-4xl w-full mx-auto space-y-4">
      {/* Cabecera */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <DoorOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white leading-tight">Portal del Dueño</h2>
            <p className="text-[11px] text-slate-400">
              Vista previa y gestión por local · desacoplado para fase 2 de la landing
            </p>
          </div>
        </div>
        <button
          onClick={() => setLocales(resetDemoLocales())}
          className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-slate-400 apple-smooth"
          title="Restablecer datos demo"
        >
          <RefreshCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Selector de local */}
      <div className="flex flex-wrap gap-2">
        {locales.map((l) => (
          <button
            key={l.id}
            onClick={() => setSelectedId(l.id)}
            className={`px-3.5 py-2 rounded-full text-[11px] font-bold border apple-smooth flex items-center gap-1.5 ${
              selected.id === l.id
                ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-200'
                : 'bg-white/[0.04] border-white/[0.08] text-slate-300 hover:bg-white/[0.08]'
            }`}
          >
            {l.is_founder_slot && l.plan_type === 'full_fundador' && (
              <Crown className="w-3 h-3 text-amber-400" />
            )}
            {l.nombre}
            {l.pause_level === 1 && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" title="Aviso suave activo" />
            )}
            {l.pause_level === 2 && (
              <span className="w-1.5 h-1.5 rounded-full bg-red-400" title="Mantenimiento protegido" />
            )}
          </button>
        ))}
      </div>

      {/* Contenedor del dueño por local */}
      <OwnerPortalContainer local={selected} onPatchLocal={patchLocal} />
    </div>
  )
}
