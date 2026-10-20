'use client'

import React, { useRef, useEffect } from 'react'
import { Sparkles, Utensils } from 'lucide-react'
import { Category } from '@/types/database.types'
import { getTranslation, translateCategoryName } from '@/lib/i18n'

interface MenuBottomCategoryBarProps {
  categories: Category[]
  selectedCategory: string
  onSelectCategory: (id: string) => void
  currentLang: string
  hasCartItems: boolean
  isVisible: boolean
  onClearSearch?: () => void
}

export function MenuBottomCategoryBar({
  categories,
  selectedCategory,
  onSelectCategory,
  currentLang,
  hasCartItems,
  isVisible,
  onClearSearch,
}: MenuBottomCategoryBarProps) {
  const t = (key: string) => getTranslation(currentLang, key)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Desplazar automáticamente la categoría activa al centro cuando cambia
  useEffect(() => {
    if (!scrollRef.current) return
    const activeEl = scrollRef.current.querySelector<HTMLButtonElement>('[data-active="true"]')
    if (activeEl) {
      activeEl.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      })
    }
  }, [selectedCategory])

  return (
    <div
      className={`fixed inset-x-3 sm:inset-x-4 max-w-xl mx-auto z-30 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        hasCartItems
          ? 'bottom-[74px] sm:bottom-[82px]'
          : 'bottom-3 sm:bottom-4'
      } ${
        isVisible
          ? 'translate-y-0 opacity-100 pointer-events-auto'
          : 'translate-y-16 opacity-0 pointer-events-none'
      }`}
    >
      <div className="bg-slate-900/95 backdrop-blur-md border border-slate-800/90 text-white rounded-2xl sm:rounded-full p-1.5 shadow-[0_12px_36px_rgba(15,23,42,0.35)] flex items-center gap-1.5">
        {/* Contenedor con scroll horizontal táctil suave */}
        <div
          ref={scrollRef}
          className="flex-1 flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 px-1 touch-pan-x scroll-smooth overscroll-x-contain"
        >
          {/* Opción: Todas */}
          <button
            type="button"
            data-active={selectedCategory === 'all' ? 'true' : 'false'}
            onClick={() => {
              onSelectCategory('all')
              onClearSearch?.()
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 flex-shrink-0 cursor-pointer active:scale-95 ${
              selectedCategory === 'all'
                ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-400'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
            }`}
          >
            <Utensils className="w-3 h-3 flex-shrink-0" />
            <span>{t('allCategories')}</span>
          </button>

          {/* Categorías de la carta */}
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id
            const isPromo = cat.name.toUpperCase().includes('PROMO') || cat.name.toUpperCase().includes('COMBO')

            return (
              <button
                key={cat.id}
                type="button"
                data-active={isSelected ? 'true' : 'false'}
                onClick={() => {
                  onSelectCategory(cat.id)
                  onClearSearch?.()
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 flex-shrink-0 cursor-pointer active:scale-95 ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-400'
                    : isPromo
                    ? 'text-amber-300 hover:text-amber-200 hover:bg-slate-800/70 font-black'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                }`}
              >
                {isPromo && <Sparkles className="w-3 h-3 text-amber-300 flex-shrink-0" />}
                <span>{translateCategoryName(currentLang, cat.name)}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
