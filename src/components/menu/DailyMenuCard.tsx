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
      className="relative overflow-hidden rounded-2xl p-3 sm:p-3.5 bg-gradient-to-r from-blue-50/95 via-sky-50/80 to-blue-50/95 text-slate-900 shadow-xs border border-blue-200/90 hover:border-blue-400 hover:shadow-md cursor-pointer transition-all active:scale-[0.99] group select-none"
    >
      <div className="relative z-10 space-y-2">
        {/* Fila superior: Badges y Precio */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-600 text-white shadow-xs">
              <Sparkles size={11} className="stroke-[2.5]" />
              Menú del Día
            </span>

            {dailyMenu.schedule_enabled && dailyMenu.schedule_start_time && dailyMenu.schedule_end_time && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-800 bg-white/90 px-2 py-0.5 rounded-full border border-blue-200">
                <Clock size={10} className="text-blue-600" />
                {dailyMenu.schedule_start_time} - {dailyMenu.schedule_end_time}
              </span>
            )}
          </div>

          <div className="text-right">
            <span className="text-base sm:text-lg font-black text-blue-700 tabular-nums tracking-tight">
              {formatCurrency(dailyMenu.fixed_price)}
            </span>
          </div>
        </div>

        {/* Fila intermedia: Título compacto y descripción */}
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="text-xs sm:text-sm font-black text-slate-900 leading-tight group-hover:text-blue-600 transition-colors truncate">
              {dailyMenu.title}
            </h3>
            <p className="text-[11px] text-slate-500 font-medium leading-tight mt-0.5 truncate">
              1º + 2º + Postre/Café + Bebida incluida
            </p>
          </div>

          <button
            type="button"
            className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black flex items-center gap-1 transition-all shadow-xs group-hover:translate-x-0.5 cursor-pointer flex-shrink-0"
          >
            <span>Elegir</span>
            <ChevronRight size={13} className="stroke-[3]" />
          </button>
        </div>
      </div>
    </div>
  )
}
