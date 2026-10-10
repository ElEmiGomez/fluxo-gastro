'use client'

import React from 'react'
import Link from 'next/link'
import { Utensils, Eye, Sparkles } from 'lucide-react'
import { AdminTab } from '@/types/admin.types'

interface AdminHeaderProps {
  slug: string
  restaurantName: string
  productsCount: number
  categoriesCount: number
  activeTab: AdminTab
  onTabChange: (tab: AdminTab) => void
}

export function AdminHeader({
  slug,
  restaurantName,
  productsCount,
  categoriesCount,
  activeTab,
  onTabChange,
}: AdminHeaderProps) {
  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 px-4 py-3">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center font-black">
              <Utensils className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[9px] font-black uppercase text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-md border border-purple-500/20">
                Gestión de Carta
              </span>
              <h1 className="text-sm sm:text-base font-black text-white leading-tight mt-0.5">
                {restaurantName} &middot; Administración
              </h1>
            </div>
          </div>

          <Link
            href={`/menu/${slug}?table=1`}
            target="_blank"
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-cyan-400 text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Ver carta como comensal"
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Ver Carta QR</span>
          </Link>
        </div>

        {/* Pestañas de Navegación */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-2xl border border-slate-800 w-full sm:w-auto justify-center">
          <button
            onClick={() => onTabChange('products')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeTab === 'products'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Platos ({productsCount})
          </button>
          <button
            onClick={() => onTabChange('categories')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeTab === 'categories'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Categorías ({categoriesCount})
          </button>
          <button
            onClick={() => onTabChange('daily_menu')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'daily_menu'
                ? 'bg-amber-400 text-slate-950 shadow-md'
                : 'text-amber-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Menú del Día</span>
          </button>
          <button
            onClick={() => onTabChange('ai_import')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1 ${
              activeTab === 'ai_import'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md'
                : 'text-cyan-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Importar con IA</span>
          </button>
        </div>
      </div>
    </header>
  )
}
