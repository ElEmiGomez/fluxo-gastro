'use client'

import React from 'react'
import { Search, X, LayoutList, LayoutGrid, ChevronLeft, ChevronRight, Utensils, Plus, Sparkles } from 'lucide-react'
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
  categoryTabsRef: React.RefObject<HTMLDivElement>
  canScrollLeft: boolean
  canScrollRight: boolean
  onScrollCategories: (direction: 'left' | 'right') => void
  updateScrollButtons: () => void
  isInSituAdmin: boolean
  onOpenAddProductModal: (catId?: string) => void
  hasActiveDailyMenu?: boolean
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
  canScrollLeft,
  canScrollRight,
  onScrollCategories,
  updateScrollButtons,
  isInSituAdmin,
  onOpenAddProductModal,
  hasActiveDailyMenu = false,
}: MenuCategoryBarProps) {
  const t = (key: string) => getTranslation(currentLang, key)

  const isInitialSection =
    selectedCategory === 'all' ||
    !selectedCategory ||
    selectedCategory === 'cat-1' ||
    selectedCategory === 'c0000000-0000-0000-0000-000000000001' ||
    (categories.length > 0 && selectedCategory === categories[0]?.id) ||
    Boolean(categories.find(c => c.id === selectedCategory)?.name.toUpperCase().includes('PROMO'))



  return (
    <div className="space-y-3.5">
      {/* Carrusel de Categorías Gastronómicas con Filtros Dietéticos */}
      <div id="menu-category-tabs" className="space-y-1.5 scroll-mt-16">
        <div className="flex items-center gap-1.5 w-full">
          {/* Flecha Izquierda */}
          <button
            type="button"
            onClick={() => onScrollCategories('left')}
            disabled={!canScrollLeft}
            aria-label="Ver categorías anteriores"
            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all border ${
              canScrollLeft
                ? 'bg-white text-slate-700 hover:text-blue-600 hover:bg-blue-50 hover:border-blue-200 border-slate-200 shadow-xs cursor-pointer active:scale-95'
                : 'bg-slate-100/60 text-slate-300 border-slate-200/60 cursor-not-allowed opacity-30'
            }`}
            title="Categorías anteriores"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Contenedor deslizable de Categorías */}
          <div
            ref={categoryTabsRef}
            onScroll={updateScrollButtons}
            className="flex-1 flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 px-0.5 touch-pan-x scroll-smooth overscroll-x-contain"
            onWheel={(e) => {
              if (e.deltaY !== 0 && e.currentTarget.scrollWidth > e.currentTarget.clientWidth) {
                e.currentTarget.scrollLeft += e.deltaY
              }
            }}
          >
            <button
              onClick={() => {
                onSelectCategory('all')
                onClearSearch()
                if (categoryTabsRef.current) {
                  categoryTabsRef.current.scrollTo({ left: 0, behavior: 'smooth' })
                }
                setTimeout(updateScrollButtons, 350)
              }}
              className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all flex-shrink-0 cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:border-blue-200 shadow-xs'
              }`}
            >
              {t('allCategories')}
            </button>
            {categories.map((category) => {
              const isSelected = selectedCategory === category.id
              return (
                <button
                  key={category.id}
                  onClick={(e) => {
                    onSelectCategory(category.id)
                    onClearSearch()
                    e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' })
                    setTimeout(updateScrollButtons, 350)
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all flex-shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-200 hover:border-blue-200 shadow-xs'
                  }`}
                >
                  {translateCategoryName(currentLang, category.name)}
                </button>
              )
            })}
          </div>

          {/* Flecha Derecha */}
          <button
            type="button"
            onClick={() => onScrollCategories('right')}
            disabled={!canScrollRight}
            aria-label="Ver más categorías"
            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all border ${
              canScrollRight
                ? 'bg-white text-slate-700 hover:text-blue-600 hover:bg-blue-50 hover:border-blue-200 border-slate-200 shadow-xs cursor-pointer active:scale-95'
                : 'bg-slate-100/60 text-slate-300 border-slate-200/60 cursor-not-allowed opacity-30'
            }`}
            title="Más categorías"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Píldoras Dietéticas */}
        <div className="flex items-center gap-1.5 px-0.5">
          <span className="text-[10px] text-slate-400 font-semibold">Filtros:</span>
          <button
            type="button"
            onClick={() => onDietaryFilterChange(dietaryFilter === 'sintacc' ? 'all' : 'sintacc')}
            aria-label={dietaryFilter === 'sintacc' ? 'Quitar filtro Sin TACC' : 'Filtrar platos aptos Sin TACC'}
            className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold transition-all flex items-center gap-1 cursor-pointer ${
              dietaryFilter === 'sintacc'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white text-slate-500 border border-slate-200 hover:text-slate-800'
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
            className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold transition-all flex items-center gap-1 cursor-pointer ${
              dietaryFilter === 'veggie'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-slate-500 border border-slate-200 hover:text-slate-800'
            }`}
            title="Filtrar platos vegetarianos"
          >
            <span>🌱 {t('veggie')}</span>
            {dietaryFilter === 'veggie' && <span className="font-black">&times;</span>}
          </button>
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
      </div>

    </div>
  )
}
