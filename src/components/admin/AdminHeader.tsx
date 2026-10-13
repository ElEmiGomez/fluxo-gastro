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
    <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-40 px-4 py-3 shadow-2xs">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center font-black">
              <Utensils className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                Gestión de Carta
              </span>
              <h1 className="text-sm sm:text-base font-black text-slate-900 leading-tight mt-0.5">
                {restaurantName} &middot; Administración
              </h1>
            </div>
          </div>

          <Link
            href={`/menu/${slug}?table=1`}
            target="_blank"
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 text-xs font-bold border border-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Ver carta como comensal"
          >
            <Eye className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline">Ver Carta QR</span>
          </Link>
        </div>

        {/* Pestañas de Navegación */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 w-full sm:w-auto justify-center overflow-x-auto no-scrollbar">
          <button
            onClick={() => onTabChange('products')}
            className={`px-3.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
              activeTab === 'products'
                ? 'bg-white text-blue-700 shadow-xs font-black'
                : 'text-slate-600 hover:text-slate-900 font-semibold'
            }`}
          >
            Platos ({productsCount})
          </button>
          <button
            onClick={() => onTabChange('categories')}
            className={`px-3.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
              activeTab === 'categories'
                ? 'bg-white text-blue-700 shadow-xs font-black'
                : 'text-slate-600 hover:text-slate-900 font-semibold'
            }`}
          >
            Categorías ({categoriesCount})
          </button>
          <button
            onClick={() => onTabChange('daily_menu')}
            className={`px-3.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'daily_menu'
                ? 'bg-white text-blue-700 shadow-xs font-black'
                : 'text-slate-600 hover:text-slate-900 font-semibold'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            <span>Menú del Día</span>
          </button>
          <button
            onClick={() => onTabChange('ai_import')}
            className={`px-3.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer flex items-center gap-1 ${
              activeTab === 'ai_import'
                ? 'bg-white text-blue-700 shadow-xs font-black'
                : 'text-slate-600 hover:text-slate-900 font-semibold'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            <span>Importar con IA</span>
          </button>
          <button
            onClick={() => onTabChange('loyalty')}
            className={`px-3.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'loyalty'
                ? 'bg-white text-blue-700 shadow-xs font-black'
                : 'text-slate-600 hover:text-slate-900 font-semibold'
            }`}
          >
            <Award className="w-3.5 h-3.5 text-amber-500" />
            <span>Fidelización</span>
          </button>
        </div>
      </div>
    </header>
  )
}
