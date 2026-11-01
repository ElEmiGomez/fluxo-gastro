'use client'

import React from 'react'
import {
  TrendingUp,
  Award,
  BadgeCheck,
  Hourglass,
} from 'lucide-react'
import {
  FOUNDER_SLOTS_MAX,
  LocalBilling,
  calculateConfirmedMRR,
  calculatePendingMRR,
  calculateProjectedARR,
  countFounderSlots,
} from '@/lib/billing/billing-calculations'

interface FinancialKpiHeaderProps {
  locales: LocalBilling[]
  now?: Date
}

const eur = (n: number) => `${n.toLocaleString('es-ES', { maximumFractionDigits: 0 })} €`
const eurLong = (n: number) =>
  `${n.toLocaleString('es-ES', { maximumFractionDigits: 0 })} €`

/** Cabecera de KPIs financieros en vivo del CRM Fundador. */
export function FinancialKpiHeader({ locales, now }: FinancialKpiHeaderProps) {
  const at = now ?? new Date()
  const mrrCobrado = calculateConfirmedMRR(locales, at)
  const mrrPendiente = calculatePendingMRR(locales, at)
  const arrProyectado = calculateProjectedARR(locales, at)
  const plazasFundador = countFounderSlots(locales)

  const kpis = [
    {
      icon: BadgeCheck,
      iconColor: 'text-emerald-400',
      ring: 'bg-emerald-500/15 border-emerald-500/30',
      label: 'MRR Cobrado',
      value: eur(mrrCobrado),
      sub: 'Cuotas confirmadas este ciclo',
      valueClass: 'text-emerald-400',
    },
    {
      icon: Hourglass,
      iconColor: 'text-amber-400',
      ring: 'bg-amber-500/15 border-amber-500/30',
      label: 'MRR Pendiente',
      value: eur(mrrPendiente),
      sub: 'Pendiente · vencido · comprobante en revisión',
      valueClass: 'text-amber-400',
    },
    {
      icon: TrendingUp,
      iconColor: 'text-cyan-400',
      ring: 'bg-cyan-500/15 border-cyan-500/30',
      label: 'ARR Proyectado (12m)',
      value: eurLong(arrProyectado),
      sub: 'Con transición fundador 50 € → 99 €',
      valueClass: 'text-cyan-300',
    },
    {
      icon: Award,
      iconColor: 'text-indigo-400',
      ring: 'bg-indigo-500/15 border-indigo-500/30',
      label: 'Plazas Fundador',
      value: `${plazasFundador} / ${FOUNDER_SLOTS_MAX}`,
      sub: plazasFundador >= FOUNDER_SLOTS_MAX ? 'Programa cerrado' : 'Plazas abiertas',
      valueClass: 'text-indigo-300',
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
      {kpis.map((kpi) => (
        <div
          key={kpi.label}
          className="p-4 rounded-2xl bg-white/[0.06] border border-white/[0.1] backdrop-blur-md apple-smooth"
        >
          <div className="flex items-center gap-2.5 mb-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${kpi.ring}`}>
              <kpi.icon className={`w-4.5 h-4.5 ${kpi.iconColor}`} />
            </div>
            <p className="text-[11px] font-bold text-slate-300 tracking-wide uppercase">
              {kpi.label}
            </p>
          </div>
          <p className={`text-2xl font-black ${kpi.valueClass} tracking-tight`}>
            {kpi.value}
          </p>
          <p className="text-[10px] text-slate-400 mt-1.5 leading-snug">{kpi.sub}</p>
        </div>
      ))}
    </div>
  )
}
