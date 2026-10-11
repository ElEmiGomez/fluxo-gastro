'use client'

import React from 'react'
import { Sparkles, Utensils, Clock, ChevronRight, CheckCircle2 } from 'lucide-react'
import { DailyMenu } from '@/types/database.types'
import { formatCurrency } from '@/lib/utils'

interface DailyMenuCardProps {
  dailyMenu: DailyMenu
  onOpenModal: () => void
}

export function DailyMenuCard({ dailyMenu, onOpenModal }: DailyMenuCardProps) {
  return (
    <div
      onClick={onOpenModal}
      className="relative overflow-hidden rounded-3xl p-4 sm:p-5 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl border border-indigo-800/60 cursor-pointer transition-all hover:border-indigo-500 active:scale-[0.99] group select-none"
    >
      {/* Resplandor decorativo de fondo */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 space-y-3">
        {/* Fila superior: Badges */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 shadow-xs">
              <Sparkles size={12} className="stroke-[2.5]" />
              Menú del Día
            </span>

            {dailyMenu.schedule_enabled && dailyMenu.schedule_start_time && dailyMenu.schedule_end_time && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-300 bg-white/10 px-2 py-0.5 rounded-full border border-white/10">
                <Clock size={11} className="text-amber-300" />
                {dailyMenu.schedule_start_time} - {dailyMenu.schedule_end_time}
              </span>
            )}
          </div>

          <div className="text-right">
            <span className="text-xl sm:text-2xl font-black text-emerald-400 tabular-nums tracking-tight">
              {formatCurrency(dailyMenu.fixed_price)}
            </span>
          </div>
        </div>

        {/* Fila intermedia: Título y descripción de pasos */}
        <div>
          <h3 className="text-base sm:text-lg font-black text-white leading-tight group-hover:text-amber-300 transition-colors">
            {dailyMenu.title}
          </h3>
          <p className="text-xs text-slate-300 font-medium mt-1 leading-snug">
            Incluye 1er Plato + 2º Plato + Postre o Café + Bebida a tu elección.
          </p>
        </div>

        {/* Fila inferior: Botón de llamada a la acción */}
        <div className="pt-1 flex items-center justify-between border-t border-white/10">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-300">
            <CheckCircle2 size={13} className="text-emerald-400" />
            <span>Precio cerrado · Preparado al momento</span>
          </div>

          <button
            type="button"
            className="px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black flex items-center gap-1 transition-all shadow-md group-hover:translate-x-0.5 cursor-pointer"
          >
            <span>Elegir platos</span>
            <ChevronRight size={14} className="stroke-[3]" />
          </button>
        </div>
      </div>
    </div>
  )
}
