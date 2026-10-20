'use client'

import React from 'react'
import { ChevronLeft, ChevronRight, Utensils, Plus } from 'lucide-react'
import { Category } from '@/types/database.types'
import { getTranslation, translateCategoryName } from '@/lib/i18n'
import { DietaryFilter, ViewMode } from '@/types/menu.types'

interface MenuCategoryBarProps {
  searchQuery: string
  onSearchChange: (val: string) => void
  onClearSearch: () => void
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  categories: Category[]
  selectedCategory: string
  onSelectCategory: (id: string) => void
  dietaryFilter: DietaryFilter
  onDietaryFilterChange: (filter: DietaryFilter) => void
  currentLang: string
  categoryTabsRef?: React.RefObject<HTMLDivElement>
  canScrollLeft?: boolean
  canScrollRight?: boolean
  onScrollCategories?: (direction: 'left' | 'right') => void
  updateScrollButtons?: () => void
  isInSituAdmin: boolean
  onOpenAddProductModal: (catId?: string) => void
  hasActiveDailyMenu?: boolean
  hideCategoryTabs?: boolean
}

export function MenuCategoryBar({
  searchQuery,
  onSearchChange,
  onClearSearch,
  viewMode,
  onViewModeChange,
  categories,
  selectedCategory,
  onSelectCategory,
  dietaryFilter,
  onDietaryFilterChange,
  currentLang,
  categoryTabsRef,
  canScrollLeft = false,
  canScrollRight = false,
  onScrollCategories,
  updateScrollButtons,
  isInSituAdmin,
  onOpenAddProductModal,
  hasActiveDailyMenu = false,
  hideCategoryTabs = true,
}: MenuCategoryBarProps) {
  const t = (key: string) => getTranslation(currentLang, key)

  return (
    <div className="space-y-2">
      {/* Píldoras Dietéticas y Opciones Rápidas */}
      <div className="flex items-center justify-between gap-2 px-0.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Filtros:</span>
          <button
            type="button"
            onClick={() => onDietaryFilterChange(dietaryFilter === 'sintacc' ? 'all' : 'sintacc')}
            aria-label={dietaryFilter === 'sintacc' ? 'Quitar filtro Sin TACC' : 'Filtrar platos aptos Sin TACC'}
            className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold transition-all flex items-center gap-1 cursor-pointer active:scale-95 ${
              dietaryFilter === 'sintacc'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200/90 hover:text-slate-900 shadow-2xs'
            }`}
            title="Filtrar platos aptos Sin TACC"
          >
            <span>🌾 {t('sinTacc')}</span>
            {dietaryFilter === 'sintacc' && <span className="font-black">&times;</span>}
          </button>
          <button
            type="button"
            onClick={() => onDietaryFilterChange(dietaryFilter === 'veggie' ? 'all' : 'veggie')}
            aria-label={dietaryFilter === 'veggie' ? 'Quitar filtro Vegetariano' : 'Filtrar platos vegetarianos'}
            className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold transition-all flex items-center gap-1 cursor-pointer active:scale-95 ${
              dietaryFilter === 'veggie'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200/90 hover:text-slate-900 shadow-2xs'
            }`}
            title="Filtrar platos vegetarianos"
          >
            <span>🌱 {t('veggie')}</span>
            {dietaryFilter === 'veggie' && <span className="font-black">&times;</span>}
          </button>
        </div>
      </div>

      {/* Botón Discreto Añadir Plato en la Categoría (Modo In-Situ) */}
      {isInSituAdmin && (
        <div className="flex items-center justify-between gap-2 bg-purple-50 border border-purple-200/80 rounded-2xl p-2.5 px-3.5 shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2 min-w-0">
            <Utensils className="w-4 h-4 text-purple-700 flex-shrink-0" />
            <span className="text-xs font-black text-purple-900 truncate">
              {selectedCategory === 'all'
                ? 'Todas las categorías'
                : translateCategoryName(currentLang, categories.find(c => c.id === selectedCategory)?.name || 'Categoría actual')}
            </span>
          </div>
          <button
            type="button"
            onClick={() => onOpenAddProductModal(selectedCategory !== 'all' ? selectedCategory : undefined)}
            className="px-3 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-black flex items-center gap-1 shadow-xs transition-all active:scale-95 cursor-pointer flex-shrink-0"
          >
            <Plus size={14} className="stroke-[3]" />
            <span>Añadir plato</span>
          </button>
        </div>
      )}

      {/* Carrusel superior solo si hideCategoryTabs es false */}
      {!hideCategoryTabs && (
        <div id="menu-category-tabs" className="space-y-1.5 scroll-mt-16 pt-1">
          <div className="flex items-center gap-1.5 w-full">
            {canScrollLeft && onScrollCategories && (
              <button
                type="button"
                onClick={() => onScrollCategories('left')}
                aria-label="Ver categorías anteriores"
                className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all border bg-white text-slate-700 hover:text-blue-600 hover:bg-blue-50 hover:border-blue-200 border-slate-200 shadow-xs cursor-pointer active:scale-95"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}

            <div
              ref={categoryTabsRef}
              onScroll={updateScrollButtons}
              className="flex-1 flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 px-0.5 touch-pan-x scroll-smooth overscroll-x-contain"
            >
              <button
                onClick={() => {
                  onSelectCategory('all')
                  onClearSearch()
                }}
                className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all flex-shrink-0 cursor-pointer ${
                  selectedCategory === 'all'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-200 hover:border-blue-200 shadow-xs'
                }`}
              >
                {t('allCategories')}
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => {
                    onSelectCategory(category.id)
                    onClearSearch()
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all flex-shrink-0 cursor-pointer ${
                    selectedCategory === category.id
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-200 hover:border-blue-200 shadow-xs'
                  }`}
                >
                  {translateCategoryName(currentLang, category.name)}
                </button>
              ))}
            </div>

            {canScrollRight && onScrollCategories && (
              <button
                type="button"
                onClick={() => onScrollCategories('right')}
                aria-label="Ver más categorías"
                className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all border bg-white text-slate-700 hover:text-blue-600 hover:bg-blue-50 hover:border-blue-200 border-slate-200 shadow-xs cursor-pointer active:scale-95"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
