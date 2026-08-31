'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Utensils, QrCode, ChefHat, Store } from 'lucide-react'
import { useTenant } from './TenantProvider'
import { FluxoLogo } from '@/components/common/FluxoLogo'

interface TenantHeaderProps {
  viewType: 'menu' | 'comandero' | 'kitchen'
  tableNumber?: string | null
}

export function TenantHeader({ viewType, tableNumber }: TenantHeaderProps) {
  const { restaurant } = useTenant()

  const viewTitles = {
    menu: 'Menú Digital',
    comandero: 'Comandero Mozo',
    kitchen: 'Monitor Cocina (KDS)',
  }

  const viewIcons = {
    menu: <Utensils className="w-3.5 h-3.5" />,
    comandero: <QrCode className="w-3.5 h-3.5" />,
    kitchen: <ChefHat className="w-3.5 h-3.5" />,
  }

  const isMenu = viewType === 'menu'

  return (
    <header className={`sticky top-0 z-30 backdrop-blur-md border-b shadow-sm transition-colors ${
      isMenu
        ? 'bg-white/95 text-slate-900 border-slate-200'
        : 'bg-slate-900/95 text-slate-100 border-slate-800'
    }`}>
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        
        {/* Logo & Identidad de Marca Fluxo */}
        <div className="flex items-center gap-3">
          <FluxoLogo size={40} />

          <div>
            <div className="flex items-center gap-2">
              <h1 className={`font-extrabold text-sm sm:text-base leading-tight ${
                isMenu ? 'text-slate-900' : 'text-slate-100'
              }`}>
                {restaurant.name}
              </h1>
              <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${
                isMenu
                  ? 'bg-slate-100 text-slate-700 border-slate-200'
                  : 'bg-slate-800 text-slate-300 border-slate-700'
              }`}>
                {viewIcons[viewType]}
                {viewTitles[viewType]}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5 font-medium">
              <Store className="w-3 h-3 text-slate-400" />
              <span>{viewType === 'kitchen' ? 'Monitor de Cocina KDS' : viewType === 'comandero' ? 'Comandero de Salón' : 'Carta Digital en Mesa'}</span>
            </p>
          </div>
        </div>

        {/* Mesa activa & Switcher */}
        <div className="flex items-center gap-2">
          {tableNumber && (
            <div
              className="px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase shadow-sm flex items-center gap-1.5"
              style={{
                backgroundColor: isMenu ? '#eff6ff' : 'color-mix(in srgb, var(--brand-primary) 20%, transparent)',
                color: isMenu ? '#1e3a8a' : 'var(--brand-primary)',
                border: isMenu ? '1px solid #bfdbfe' : '1px solid var(--brand-primary)',
              }}
            >
              <span className="w-2 h-2 rounded-full animate-pulse bg-blue-700" />
              Mesa #{tableNumber}
            </div>
          )}

          {/* Estado de Seguridad del Rol */}
          <div className="flex items-center gap-2">
            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-xl border ${
              viewType === 'kitchen'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
            }`}>
              {viewTitles[viewType]}
            </span>
          </div>
        </div>

      </div>
    </header>
  )
}
