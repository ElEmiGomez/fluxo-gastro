'use client'

import React, { useState } from 'react'
import {
  Banknote,
  Receipt as ReceiptIcon,
  ShieldAlert,
  ShieldCheck,
  RotateCcw,
  Crown,
} from 'lucide-react'
import {
  LocalBilling,
  MANUAL_PAYMENT_METHODS,
  PAUSE_LEVEL_LABEL,
  PAYMENT_METHOD_LABEL,
  PLAN_CONFIG,
  PlanType,
  STATUS_LABEL,
  PaymentStatus,
  PauseLevel,
  calculateTrafficLight,
  getMonthlyBase,
} from '@/lib/billing/billing-calculations'
import { resetDemoLocales } from '@/lib/billing/crm-demo-seed'
import { ManualPaymentProofModal } from './ManualPaymentProofModal'
import { ReceiptCanvasGenerator } from './ReceiptCanvasGenerator'

interface BillingTrafficLightTableProps {
  locales: LocalBilling[]
  now: Date
  onPatchLocal: (
    id: string,
    patch: Partial<Pick<LocalBilling, 'plan_type' | 'payment_status' | 'pause_level' | 'payment_method'>>
  ) => void
  /** Confirma el cobro del mes tras validar comprobante en el modal. */
  onApplyPayment: (id: string, method: import('@/lib/billing/billing-calculations').PaymentMethod) => void
  onReset: () => void
}

const TRAFFIC_LIGHT_STYLE: Record<'green' | 'yellow' | 'red', string> = {
  green: 'bg-emerald-500/15 border-emerald-500/35 text-emerald-300',
  yellow: 'bg-amber-500/15 border-amber-500/35 text-amber-300',
  red: 'bg-red-500/15 border-red-500/35 text-red-300',
}

const TRAFFIC_LIGHT_DOT: Record<'green' | 'yellow' | 'red', string> = {
  green: 'bg-emerald-400',
  yellow: 'bg-amber-400',
  red: 'bg-red-400',
}

function planLabel(p: PlanType): string {
  return PLAN_CONFIG[p].label
}

/** Tabla de locales con Semáforo de Vencimientos en vivo + controles de edición. */
export function BillingTrafficLightTable({
  locales,
  now,
  onPatchLocal,
  onApplyPayment,
  onReset,
}: BillingTrafficLightTableProps) {
  const [cobroLocal, setCobroLocal] = useState<LocalBilling | null>(null)
  const [reciboLocal, setReciboLocal] = useState<LocalBilling | null>(null)

  return (
    <div className="space-y-4">
      {/* Controles rápidos */}
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] text-slate-400">
          Semáforo en vivo · día {now.getDate()} del mes · clic en cualquier selector para recalcular
        </p>
        <button
          onClick={onReset}
          className="px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] text-slate-300 text-[10px] font-semibold flex items-center gap-1.5 apple-smooth"
        >
          <RotateCcw className="w-3 h-3" />
          Restablecer demo
        </button>
      </div>

      {/* Tabla (desktop) */}
      <div className="hidden lg:block rounded-2xl bg-white/[0.04] border border-white/[0.08] overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[10px] uppercase tracking-wider text-slate-400 border-b border-white/[0.08]">
              <th className="px-4 py-3">Local</th>
              <th className="px-4 py-3">Plan &amp; cuota (+IVA)</th>
              <th className="px-4 py-3">Día cobro</th>
              <th className="px-4 py-3">Método</th>
              <th className="px-4 py-3">Semáforo</th>
              <th className="px-4 py-3">Estado pago</th>
              <th className="px-4 py-3">Pausa carta</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.05]">
            {locales.map((local) => {
              const light = calculateTrafficLight(local.billing_day, local.payment_status, now)
              const cuota = getMonthlyBase(local, now)
              const isFounder = local.is_founder_slot && local.plan_type === 'full_fundador'
              return (
                <tr key={local.id} className="hover:bg-white/[0.02] transition">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{local.nombre}</span>
                      {isFounder && (
                        <span title="Plaza Fundador">
                          <Crown className="w-3.5 h-3.5 text-amber-400" />
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 font-mono">/p/{local.slug}</p>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={local.plan_type}
                      onChange={(e) => onPatchLocal(local.id, { plan_type: e.target.value as PlanType })}
                      className="bg-slate-800/80 border border-white/[0.1] rounded-lg text-[11px] text-slate-200 px-2 py-1.5 outline-none focus:border-cyan-500/50"
                    >
                      {(Object.keys(PLAN_CONFIG) as PlanType[]).map((p) => (
                        <option key={p} value={p}>
                          {PLAN_CONFIG[p].label}
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-cyan-300 font-bold mt-1">{cuota} €/mes + IVA</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-bold text-white font-mono">{local.billing_day}</span>
                    <span className="text-[10px] text-slate-500"> /5</span>
                  </td>
                  <td className="px-4 py-3 text-[11px] text-slate-300">
                    {PAYMENT_METHOD_LABEL[local.payment_method]}
                    {manualNeedsProof(local) && (
                      <span className="block text-[9px] text-amber-400/80">
                        {local.has_payment_proof ? 'Comprobante adjunto ✓' : 'Sin comprobante'}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold ${TRAFFIC_LIGHT_STYLE[light.state]}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${TRAFFIC_LIGHT_DOT[light.state]}`} />
                      {light.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={local.payment_status}
                      onChange={(e) =>
                        onPatchLocal(local.id, { payment_status: e.target.value as PaymentStatus })
                      }
                      className="bg-slate-800/80 border border-white/[0.1] rounded-lg text-[11px] text-slate-200 px-2 py-1.5 outline-none focus:border-emerald-500/50"
                    >
                      {(Object.keys(STATUS_LABEL) as PaymentStatus[]).map((s) => (
                        <option key={s} value={s}>
                          {STATUS_LABEL[s]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={local.pause_level}
                      onChange={(e) => onPatchLocal(local.id, { pause_level: Number(e.target.value) as PauseLevel })}
                      className="bg-slate-800/80 border border-white/[0.1] rounded-lg text-[11px] text-slate-200 px-2 py-1.5 outline-none focus:border-amber-500/50"
                    >
                      {([0, 1, 2] as PauseLevel[]).map((lvl) => (
                        <option key={lvl} value={lvl}>
                          Nivel {lvl} · {PAUSE_LEVEL_LABEL[lvl]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => setCobroLocal(local)}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold flex items-center gap-1 apple-smooth"
                      >
                        <Banknote className="w-3 h-3" /> Cobro
                      </button>
                      <button
                        onClick={() => setReciboLocal(local)}
                        className="px-2.5 py-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/30 text-cyan-300 text-[10px] font-bold flex items-center gap-1 apple-smooth"
                      >
                        <ReceiptIcon className="w-3 h-3" /> Recibo
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Tarjetas (móvil/tablet) */}
      <div className="lg:hidden space-y-3">
        {locales.map((local) => {
          const light = calculateTrafficLight(local.billing_day, local.payment_status, now)
          return (
            <div key={local.id} className="p-4 rounded-2xl bg-white/[0.04] border border-white/[0.08]">
              <div className="flex items-start justify-between gap-2 mb-2.5">
                <div>
                  <p className="text-sm font-bold text-white">{local.nombre}</p>
                  <p className="text-[10px] text-slate-500 font-mono">/p/{local.slug}</p>
                </div>
                <span
                  className={`px-2 py-1 rounded-full border text-[9px] font-bold flex items-center gap-1.5 ${TRAFFIC_LIGHT_STYLE[light.state]}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${TRAFFIC_LIGHT_DOT[light.state]}`} />
                  {light.label}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={local.plan_type}
                  onChange={(e) => onPatchLocal(local.id, { plan_type: e.target.value as PlanType })}
                  className="bg-slate-800/80 border border-white/[0.1] rounded-lg text-[11px] text-slate-200 px-2 py-1.5 outline-none"
                  aria-label="Plan"
                >
                  {(Object.keys(PLAN_CONFIG) as PlanType[]).map((p) => (
                    <option key={p} value={p}>
                      {planLabel(p)}
                    </option>
                  ))}
                </select>
                <select
                  value={local.payment_status}
                  onChange={(e) => onPatchLocal(local.id, { payment_status: e.target.value as PaymentStatus })}
                  className="bg-slate-800/80 border border-white/[0.1] rounded-lg text-[11px] text-slate-200 px-2 py-1.5 outline-none"
                  aria-label="Estado de pago"
                >
                  {(Object.keys(STATUS_LABEL) as PaymentStatus[]).map((s) => (
                    <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                  ))}
                </select>
                <select
                  value={local.pause_level}
                  onChange={(e) => onPatchLocal(local.id, { pause_level: Number(e.target.value) as PauseLevel })}
                  className="bg-slate-800/80 border border-white/[0.1] rounded-lg text-[11px] text-slate-200 px-2 py-1.5 outline-none"
                  aria-label="Nivel de pausa"
                >
                  {([0, 1, 2] as PauseLevel[]).map((lvl) => (
                    <option key={lvl} value={lvl}>Nivel {lvl} · {PAUSE_LEVEL_LABEL[lvl]}</option>
                  ))}
                </select>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setCobroLocal(local)}
                    className="flex-1 px-2 py-1.5 rounded-lg bg-emerald-600/20 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold apple-smooth"
                  >
                    Cobro
                  </button>
                  <button
                    onClick={() => setReciboLocal(local)}
                    className="flex-1 px-2 py-1.5 rounded-lg bg-cyan-600/20 border border-cyan-500/30 text-cyan-300 text-[10px] font-bold apple-smooth"
                  >
                    Recibo
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Aviso de niveles de pausa */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-slate-300 leading-snug">
            <span className="font-bold text-white">Nivel 1 · Aviso suave:</span> la carta pública
            sigue al 100% y el aviso se muestra solo en el Portal del Dueño.
          </p>
        </div>
        <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-slate-300 leading-snug">
            <span className="font-bold text-white">Nivel 2 · Mantenimiento protegido:</span> la carta
            oculta el menú en /p/[slug] sin mencionar impagos nunca.
          </p>
        </div>
      </div>

      <ManualPaymentProofModal
        local={cobroLocal}
        isOpen={cobroLocal !== null}
        onClose={() => setCobroLocal(null)}
        onConfirm={(id, method) => onApplyPayment(id, method)}
      />

      <ReceiptCanvasGenerator
        local={reciboLocal}
        isOpen={reciboLocal !== null}
        onClose={() => setReciboLocal(null)}
      />
    </div>
  )
}

function manualNeedsProof(local: LocalBilling): boolean {
  return MANUAL_PAYMENT_METHODS.includes(local.payment_method)
}
