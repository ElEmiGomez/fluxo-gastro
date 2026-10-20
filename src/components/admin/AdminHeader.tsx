'use client'

import React from 'react'
import Link from 'next/link'
import { Utensils, Eye, Sparkles, Award } from 'lucide-react'
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
    <header className="bg-slate-900/85 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40 px-4 py-3 shadow-lg">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center font-black shadow-xs">
              <Utensils className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-md border border-cyan-500/20 tracking-wider">
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
            className="px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-750 text-slate-200 hover:text-white text-xs font-bold border border-slate-700 hover:border-cyan-500/40 flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            title="Ver carta como comensal"
          >
            <Eye className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Ver Carta QR</span>
          </Link>
        </div>

        {/* Pestañas de Navegación */}
        <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/80 w-full sm:w-auto justify-center overflow-x-auto no-scrollbar shadow-inner">
          <button
            onClick={() => onTabChange('products')}
            className={`px-3.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
              activeTab === 'products' ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20 font-black' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-700/50 font-bold'
            }`}
          >
            Platos ({productsCount})
          </button>
          <button
            onClick={() => onTabChange('categories')}
            className={`px-3.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
              activeTab === 'categories' ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20 font-black' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-700/50 font-bold'
            }`}
          >
            Categorías ({categoriesCount})
          </button>
          <button
            onClick={() => onTabChange('daily_menu')}
            className={`px-3.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'daily_menu' ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20 font-black' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-700/50 font-bold'
            }`}
          >
            <Sparkles className={`w-3.5 h-3.5 ${activeTab === 'daily_menu' ? 'text-slate-950' : 'text-cyan-400'}`} />
            <span>Menú del Día</span>
          </button>
          <button
            onClick={() => onTabChange('ai_import')}
            className={`px-3.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer flex items-center gap-1 ${
              activeTab === 'ai_import' ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20 font-black' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-700/50 font-bold'
            }`}
          >
            <Sparkles className={`w-3.5 h-3.5 ${activeTab === 'ai_import' ? 'text-slate-950' : 'text-cyan-400'}`} />
            <span>Importar con IA</span>
          </button>
          <button
            onClick={() => onTabChange('loyalty')}
            className={`px-3.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'loyalty' ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20 font-black' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-700/50 font-bold'
            }`}
          >
            <Award className={`w-3.5 h-3.5 ${activeTab === 'loyalty' ? 'text-slate-950' : 'text-amber-400'}`} />
            <span>Fidelización</span>
          </button>
        </div>
      </div>
    </header>
  )
}
