'use client'

import React, { useState, useEffect } from 'react'
import {
  X,
  TrendingUp,
  Clock,
  Sparkles,
  BarChart3,
  Award,
  Zap,
  Printer,
  ChevronRight,
  ShieldCheck,
  Flame,
  ArrowUpRight,
  PieChart
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface MonthlyReportModalProps {
  isOpen: boolean
  onClose: () => void
  slug?: string
}

export function MonthlyReportModal({ isOpen, onClose, slug = 'burger-gourmet' }: MonthlyReportModalProps) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isOpen) {
      setLoading(true)
      fetch(`/api/analytics/monthly-report?slug=${slug}`)
        .then(r => r.json())
        .then(res => {
          if (res.success && res.report) {
            setData(res.report)
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false))
    }
  }, [isOpen, slug])

  if (!isOpen) return null

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print()
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in select-none">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-white animate-in zoom-in-95 duration-200">
        
        {/* Cabecera del Reporte Ejecutivo */}
        <div className="p-5 sm:p-6 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between gap-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center font-black">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black tracking-wider uppercase text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
                  Plan Full &middot; IA Analytics
                </span>
                <span className="text-[11px] text-slate-400">Mes Septiembre 2026</span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-white leading-tight mt-0.5">
                Reporte Mensual Ejecutivo de Eficiencia Gastronómica
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              type="button"
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Imprimir o Guardar en PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Exportar PDF</span>
            </button>
            <button
              onClick={onClose}
              type="button"
              className="p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/80 hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Cuerpo con Scroll */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-slate-300 text-xs sm:text-sm">
          {loading || !data ? (
            <div className="py-20 text-center space-y-3">
              <div className="w-8 h-8 border-3 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-slate-400 font-bold">Generando auditoría y métricas de eficiencia con IA...</p>
            </div>
          ) : (
            <>
              {/* 1. KPIs Principales en 4 Tarjetas */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-800/70 border border-slate-700 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Facturación Mes</span>
                  <div className="text-lg sm:text-xl font-black text-white tabular-nums">
                    {formatCurrency(data.kpis.total_revenue_eur)}
                  </div>
                  <div className="text-[10px] font-bold text-emerald-400 flex items-center gap-0.5">
                    <TrendingUp size={11} />
                    <span>+{data.kpis.monthly_growth_rate_pct}% vs mes anterior</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-800/70 border border-slate-700 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Comandas & Mesas</span>
                  <div className="text-lg sm:text-xl font-black text-white tabular-nums">
                    {data.kpis.total_orders_count} pedidos
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {data.kpis.total_guests_served} comensales servidos
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-800/70 border border-slate-700 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Rotación y Ahorro</span>
                  <div className="text-lg sm:text-xl font-black text-cyan-400 tabular-nums">
                    {data.kpis.table_turnover_rate} rot/mesa
                  </div>
                  <div className="text-[10px] text-slate-400">
                    ⚡ {data.table_times.time_saved_per_table_min} min ahorrados/mesa
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-800/70 border border-slate-700 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Extra Terraza QR</span>
                  <div className="text-lg sm:text-xl font-black text-emerald-400 tabular-nums">
                    +{formatCurrency(data.terrace_extra_revenue.total_extra_revenue_eur)}
                  </div>
                  <div className="text-[10px] text-emerald-400 font-bold">
                    +{data.terrace_extra_revenue.incremental_ticket_pct}% en ticket medio
                  </div>
                </div>
              </div>

              {/* 2. Horas de Mayor Congestión */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-cyan-400" />
                    <h3 className="font-black text-sm text-white">1. Distribución Horaria & Picos de Congestión</h3>
                  </div>
                  <span className="text-[10px] font-bold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                    Pico: {data.congestion_hours.peak_window}
                  </span>
                </div>

                <div className="space-y-2 pt-1">
                  {data.congestion_hours.distribution.map((slot: any) => (
                    <div key={slot.time_slot} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-300">{slot.time_slot} ({slot.label})</span>
                        <span className="font-black text-white tabular-nums">{formatCurrency(slot.revenue_eur)} &middot; {slot.order_count} comandas ({slot.percentage}%)</span>
                      </div>
                      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            slot.congestion_level === 'peak'
                              ? 'bg-amber-400'
                              : slot.congestion_level === 'high'
                              ? 'bg-cyan-400'
                              : 'bg-blue-600'
                          }`}
                          style={{ width: `${slot.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. Matriz BCG del Menú (Platos Estrella vs Baja Rotación) */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-400" />
                    <h3 className="font-black text-sm text-white">2. Matriz BCG de Rentabilidad Gastronómica</h3>
                  </div>
                  <span className="text-[10px] text-slate-400 font-semibold">Análisis de margen y rotación</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* Estrellas */}
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-emerald-400 font-extrabold text-xs">
                      <span>⭐ Platos Estrella (Top Facturación)</span>
                    </div>
                    {data.bcg_matrix.stars.map((p: any) => (
                      <div key={p.id} className="flex justify-between text-xs text-slate-300">
                        <span className="truncate pr-2">{p.name}</span>
                        <span className="font-black text-white tabular-nums whitespace-nowrap">{formatCurrency(p.revenue_eur)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Vacas Lecheras */}
                  <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-blue-400 font-extrabold text-xs">
                      <span>🐄 Vacas Lecheras (Alta Rotación)</span>
                    </div>
                    {data.bcg_matrix.cash_cows.map((p: any) => (
                      <div key={p.id} className="flex justify-between text-xs text-slate-300">
                        <span className="truncate pr-2">{p.name}</span>
                        <span className="font-black text-white tabular-nums whitespace-nowrap">{p.sales_count} u.</span>
                      </div>
                    ))}
                  </div>

                  {/* Dilemas / Oportunidades */}
                  <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-purple-400 font-extrabold text-xs">
                      <span>💎 Alto Margen para Potenciar</span>
                    </div>
                    {data.bcg_matrix.question_marks.map((p: any) => (
                      <div key={p.id} className="flex justify-between text-xs text-slate-300">
                        <span className="truncate pr-2">{p.name}</span>
                        <span className="font-black text-white tabular-nums whitespace-nowrap">{p.sales_count} u.</span>
                      </div>
                    ))}
                  </div>

                  {/* Baja Rotación */}
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-rose-400 font-extrabold text-xs">
                      <span>⚠️ Baja Rotación (Revisar en Carta)</span>
                    </div>
                    {data.bcg_matrix.dogs.map((p: any) => (
                      <div key={p.id} className="flex justify-between text-xs text-slate-300">
                        <span className="truncate pr-2">{p.name}</span>
                        <span className="font-bold text-rose-300 tabular-nums whitespace-nowrap">{p.sales_count} u.</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 4. Sugerencias Inteligentes de IA para el Hostelero */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-slate-900 to-cyan-950/30 border border-cyan-500/30 space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
                  <h3 className="font-black text-sm text-white">3. Recomendaciones Estratégicas Accionables por IA</h3>
                </div>

                <div className="space-y-2.5">
                  {data.ai_suggestions.map((sug: any) => (
                    <div key={sug.id} className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-start justify-between gap-3 shadow-xs">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-cyan-300">{sug.title}</span>
                          <span className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded-md ${
                            sug.priority === 'critical' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          }`}>
                            {sug.priority}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">{sug.description}</p>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <span className="text-[10px] text-slate-500 font-bold block">Impacto Est.</span>
                        <span className="text-xs font-black text-emerald-400 tabular-nums">{sug.estimated_impact_eur}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Pie de modal */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-emerald-400" />
            <span>Métricas 100% anónimas &middot; Cumplimiento normativo RGPD</span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs transition-colors cursor-pointer"
          >
            Entendido
          </button>
        </div>

      </div>
    </div>
  )
}
