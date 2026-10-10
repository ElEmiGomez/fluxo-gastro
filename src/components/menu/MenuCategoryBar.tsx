'use client'

import React from 'react'
import { Search, X, LayoutList, LayoutGrid, ChevronLeft, ChevronRight, Utensils, Plus, Sparkles, Flame } from 'lucide-react'
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
}: MenuCategoryBarProps) {
  const t = (key: string) => getTranslation(currentLang, key)

  const isInitialSection =
    selectedCategory === 'all' ||
    !selectedCategory ||
    selectedCategory === 'cat-1' ||
    selectedCategory === 'c0000000-0000-0000-0000-000000000001' ||
    (categories.length > 0 && selectedCategory === categories[0]?.id) ||
    Boolean(categories.find(c => c.id === selectedCategory)?.name.toUpperCase().includes('PROMO'))

  const isBurgerCategory = Boolean(
    selectedCategory === 'cat-7' ||
    selectedCategory === 'c0000000-0000-0000-0000-000000000003' ||
    categories.find(c => c.id === selectedCategory)?.name.toUpperCase().includes('BURGER') ||
    categories.find(c => c.id === selectedCategory)?.name.toUpperCase().includes('HAMBURGUESA')
  )

  return (
    <div className="space-y-3.5">
      {/* Buscador & Controles de Vista */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="w-full pl-9 pr-9 py-2 rounded-2xl bg-white border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 shadow-xs transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={onClearSearch}
              aria-label="Borrar búsqueda"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 flex-shrink-0">
          <button
            type="button"
            onClick={() => onViewModeChange('list')}
            aria-label="Vista Carta Detallada"
            className={`p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xl transition-all cursor-pointer ${
              viewMode === 'list' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
            title="Vista Carta Detallada"
          >
            <LayoutList className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange('grid')}
            aria-label="Vista Galería de Fotos"
            className={`p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xl transition-all cursor-pointer ${
              viewMode === 'grid' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
            title="Vista Galería de Fotos"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>
      </div>

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

      {/* Sugerencia Inteligente del Chef */}
      {isInitialSection && (
        <div className="p-3 bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-2xl shadow-xs flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center flex-shrink-0 font-black shadow-xs">
            <Sparkles size={16} />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 block">
              Recomendado para Comenzar
            </span>
            <p className="text-xs text-slate-100 font-semibold leading-tight mt-0.5">
              Prueba nuestro Combo Pareja con 2 Dobles Monster y 2 Pintas bien frías.
            </p>
          </div>
        </div>
      )}

      {isBurgerCategory && !isInitialSection && (
        <div className="p-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-2xl shadow-xs flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-white text-slate-950 flex items-center justify-center flex-shrink-0 font-black shadow-xs">
            <Flame size={16} className="text-orange-600" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-950 block">
              Tip del Chef para Burgers
            </span>
            <p className="text-xs text-white font-bold leading-tight mt-0.5">
              Pídela a Punto y acompáñala con Bastones de Mozzarella o una IPA Tirada.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
