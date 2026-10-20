'use client'

import React, { useRef, useEffect, useState } from 'react'
import { Sparkles, Utensils, ChevronLeft, ChevronRight } from 'lucide-react'
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

  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  // Soporte para arrastre con ratón (Mouse Drag to scroll) en desktop
  const isDraggingRef = useRef(false)
  const startXRef = useRef(0)
  const scrollLeftRef = useRef(0)
  const hasMovedRef = useRef(false)

  const checkScroll = () => {
    if (!scrollRef.current) return
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
    setCanScrollLeft(scrollLeft > 6)
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 6)
  }

  const handleScroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return
    const delta = direction === 'left' ? -220 : 220
    scrollRef.current.scrollBy({ left: delta, behavior: 'smooth' })
    setTimeout(checkScroll, 350)
  }

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
    setTimeout(checkScroll, 350)
  }, [selectedCategory])

  useEffect(() => {
    checkScroll()
    const onResize = () => checkScroll()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [categories])

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return
    isDraggingRef.current = true
    hasMovedRef.current = false
    startXRef.current = e.pageX - scrollRef.current.offsetLeft
    scrollLeftRef.current = scrollRef.current.scrollLeft
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current || !scrollRef.current) return
    e.preventDefault()
    const x = e.pageX - scrollRef.current.offsetLeft
    const walk = (x - startXRef.current) * 1.4
    if (Math.abs(walk) > 4) {
      hasMovedRef.current = true
    }
    scrollRef.current.scrollLeft = scrollLeftRef.current - walk
    checkScroll()
  }

  const handleMouseUpOrLeave = () => {
    isDraggingRef.current = false
  }

  return (
    <div
      className={`fixed inset-x-3 sm:inset-x-4 max-w-xl mx-auto z-30 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        hasCartItems
          ? 'bottom-[84px] sm:bottom-[94px]'
          : 'bottom-3 sm:bottom-4'
      } ${
        isVisible
          ? 'translate-y-0 opacity-100 pointer-events-auto'
          : 'translate-y-20 opacity-0 pointer-events-none'
      }`}
    >
      <div className="bg-white/95 backdrop-blur-xl border border-slate-200/90 text-slate-800 rounded-2xl p-1.5 shadow-[0_8px_24px_rgba(15,23,42,0.1)] ring-1 ring-black/[0.04] flex items-center gap-1">
        {/* Flecha Izquierda */}
        <button
          type="button"
          onClick={() => handleScroll('left')}
          disabled={!canScrollLeft}
          aria-label="Ver categorías anteriores"
          className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
            canScrollLeft
              ? 'bg-slate-100/90 hover:bg-slate-200 text-slate-700 shadow-2xs cursor-pointer active:scale-90 border border-slate-200/80'
              : 'opacity-25 text-slate-400 cursor-not-allowed'
          }`}
          title="Categorías anteriores"
        >
          <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
        </button>

        {/* Contenedor con scroll horizontal táctil suave y arrastre de ratón */}
        <div
          ref={scrollRef}
          onScroll={checkScroll}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onMouseLeave={handleMouseUpOrLeave}
          onWheel={(e) => {
            if (e.deltaY !== 0 && scrollRef.current && scrollRef.current.scrollWidth > scrollRef.current.clientWidth) {
              scrollRef.current.scrollLeft += e.deltaY
              checkScroll()
            }
          }}
          className="flex-1 flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 px-0.5 touch-pan-x scroll-smooth overscroll-x-contain select-none cursor-grab active:cursor-grabbing"
        >
          {/* Opción: Todas */}
          <button
            type="button"
            data-active={selectedCategory === 'all' ? 'true' : 'false'}
            onClick={() => {
              if (hasMovedRef.current) return
              onSelectCategory('all')
              onClearSearch?.()
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all flex items-center gap-1.5 flex-shrink-0 cursor-pointer active:scale-95 ${
              selectedCategory === 'all'
                ? 'bg-blue-600 text-white shadow-xs ring-1 ring-blue-500'
                : 'bg-slate-100/80 text-slate-600 hover:text-slate-900 hover:bg-slate-200/80 border border-slate-200/60 font-bold'
            }`}
          >
            <Utensils className="w-3.5 h-3.5 flex-shrink-0" />
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
                  if (hasMovedRef.current) return
                  onSelectCategory(cat.id)
                  onClearSearch?.()
                }}
                className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap transition-all flex items-center gap-1.5 flex-shrink-0 cursor-pointer active:scale-95 ${
                  isSelected
                    ? 'bg-blue-600 text-white font-black shadow-xs ring-1 ring-blue-500'
                    : isPromo
                    ? 'bg-amber-50 text-amber-800 hover:text-amber-900 hover:bg-amber-100/80 border border-amber-300/80 font-black'
                    : 'bg-slate-100/80 text-slate-700 hover:text-slate-950 hover:bg-slate-200/80 border border-slate-200/60 font-bold'
                }`}
              >
                {isPromo && <Sparkles className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />}
                <span>{translateCategoryName(currentLang, cat.name)}</span>
              </button>
            )
          })}
        </div>

        {/* Flecha Derecha */}
        <button
          type="button"
          onClick={() => handleScroll('right')}
          disabled={!canScrollRight}
          aria-label="Ver más categorías"
          className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
            canScrollRight
              ? 'bg-slate-100/90 hover:bg-slate-200 text-slate-700 shadow-2xs cursor-pointer active:scale-90 border border-slate-200/80'
              : 'opacity-25 text-slate-400 cursor-not-allowed'
          }`}
          title="Más categorías"
        >
          <ChevronRight className="w-4 h-4 stroke-[2.5]" />
        </button>
      </div>
    </div>
  )
}
