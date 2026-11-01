'use client'

import React, { useEffect, useState } from 'react'
import { Landmark, Wifi, Loader2 } from 'lucide-react'
import {
  LocalBilling,
  PaymentMethod,
  MANUAL_PAYMENT_METHODS,
} from '@/lib/billing/billing-calculations'
import {
  loadBillingLocales,
  resetDemoLocales,
  updateBillingLocal,
} from '@/lib/billing/crm-demo-seed'
import { FinancialKpiHeader } from './FinancialKpiHeader'
import { BillingTrafficLightTable } from './BillingTrafficLightTable'

/**
 * Pestaña 1 del CRM Fundador: Finanzas, Semáforo & Recibos.
 * KPIs en vivo + tabla editable con recálculo instantáneo sobre el store local.
 */
export function BillingFinanceView() {
  const [locales, setLocales] = useState<LocalBilling[] | null>(null)
  const [now] = useState<Date>(() => new Date())

  useEffect(() => {
    setLocales(loadBillingLocales())
  }, [])

  const patchLocal = (
    id: string,
    patch: Partial<Pick<LocalBilling, 'plan_type' | 'payment_status' | 'pause_level' | 'payment_method'>>
  ) => {
    setLocales((prev) => {
      const base = prev ?? loadBillingLocales()
      return updateBillingLocal(base, id, patch)
    })
  }

  const applyPayment = (id: string, method: PaymentMethod) => {
    setLocales((prev) => {
      const base = prev ?? loadBillingLocales()
      return updateBillingLocal(base, id, {
        payment_method: method,
        payment_status: 'paid',
        has_payment_proof: MANUAL_PAYMENT_METHODS.includes(method)
          ? true
          : base.find((l) => l.id === id)?.has_payment_proof ?? false,
      })
    })
  }

  const handleReset = () => setLocales(resetDemoLocales())

  if (!locales) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        <span className="text-sm">Cargando datos financieros…</span>
      </div>
    )
  }

  return (
    <div className="px-5 py-6 max-w-6xl w-full mx-auto space-y-5">
      {/* Cabecera de sección */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
          <Landmark className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-black text-white leading-tight">Finanzas, Semáforo & Recibos</h2>
          <p className="text-[11px] text-slate-400">
            Control financiero del CRM Fundador · planes mensuales + IVA
          </p>
        </div>
      </div>

      <FinancialKpiHeader locales={locales} now={now} />

      <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.07]">
        <BillingTrafficLightTable
          locales={locales}
          now={now}
          onPatchLocal={patchLocal}
          onApplyPayment={applyPayment}
          onReset={handleReset}
        />
      </div>

      <p className="text-[10px] text-slate-500 flex items-center gap-1.5">
        <Wifi className="w-3 h-3" />
        Datos demo con fallback automático (store local <span className="font-mono">fluxo_crm_billing_v1</span>); listos para apuntar a Supabase en producción.
      </p>
    </div>
  )
}
