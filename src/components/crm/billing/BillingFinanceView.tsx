'use client'

import React, { useEffect, useState } from 'react'
import { Landmark, Wifi, Loader2, QrCode, Star } from 'lucide-react'
import {
  LocalBilling,
  PaymentMethod,
  MANUAL_PAYMENT_METHODS,
  PLAN_CONFIG,
  CARTA_QR_PRICE_EUR,
  REVIEW_STAND_PRICE_EUR,
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
    patch: Partial<
      Pick<
        LocalBilling,
        'plan_type' | 'payment_status' | 'pause_level' | 'payment_method' | 'review_stand_mode' | 'review_stand_fee_eur' | 'monthly_price_eur'
      >
    >
  ) => {
    const resolvedPatch = { ...patch }
    if (resolvedPatch.plan_type && resolvedPatch.monthly_price_eur === undefined) {
      resolvedPatch.monthly_price_eur = PLAN_CONFIG[resolvedPatch.plan_type].basePriceEur
    }
    if (resolvedPatch.review_stand_mode && resolvedPatch.review_stand_fee_eur === undefined) {
      resolvedPatch.review_stand_fee_eur =
        resolvedPatch.review_stand_mode === 'standalone_20' ? REVIEW_STAND_PRICE_EUR : 0
    }
    setLocales((prev) => {
      const base = prev ?? loadBillingLocales()
      return updateBillingLocal(base, id, resolvedPatch)
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
    <div className="px-6 py-6 max-w-6xl w-full mx-auto space-y-5 rounded-3xl bg-slate-950/90 border border-slate-800/80 shadow-2xl text-white">
      {/* Cabecera de sección */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
          <Landmark className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-black text-white leading-tight">Finanzas, Semáforo &amp; Recibos</h2>
          <p className="text-[11px] text-slate-400">
            Control financiero del CRM Fundador · planes mensuales + IVA y expositores NFC + QR
          </p>
        </div>
      </div>

      {/* Tarifas Oficiales Fluxo (25€ Expositor Reseñas + 15€/mes Carta QR) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="p-4 rounded-2xl bg-white/[0.05] border border-cyan-500/25 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center shrink-0">
              <QrCode className="w-4.5 h-4.5 text-cyan-400" />
            </div>
            <div>
              <p className="text-xs font-black text-white">Carta QR Digital</p>
              <p className="text-[11px] text-slate-400">
                Suscripción mensual · incluye expositor de reseñas gratis (0 €)
              </p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-lg font-black text-cyan-300 font-mono">{CARTA_QR_PRICE_EUR} €/mes</p>
            <p className="text-[10px] text-slate-400">+ IVA</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white/[0.05] border border-amber-500/25 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
              <Star className="w-4.5 h-4.5 text-amber-400 fill-amber-400" />
            </div>
            <div>
              <p className="text-xs font-black text-white">Tarjeta / Expositor de Reseñas NFC + QR</p>
              <p className="text-[11px] text-slate-400">
                Modalidad independiente sin mensualidad (o 0 € con Carta QR {CARTA_QR_PRICE_EUR} €/mes)
              </p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-lg font-black text-amber-300 font-mono">{REVIEW_STAND_PRICE_EUR} €</p>
            <p className="text-[10px] text-slate-400">pago único</p>
          </div>
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
