'use client'

import React from 'react'
import { ChevronDown, Check, Bell } from 'lucide-react'
import { FluxoLogo } from '@/components/common/FluxoLogo'
import { CallWaiterButton } from '@/components/menu/CallWaiterButton'
import { TOP_LANGUAGES, getTranslation } from '@/lib/i18n'
import { Restaurant } from '@/types/database.types'

interface MenuHeaderProps {
  restaurant: Restaurant
  restaurantDisplayName?: string
  tableNumber: string
  isFixedMenu: boolean
  currentLang: string
  setCurrentLang: (lang: string) => void
  showLangDropdown: boolean
  setShowLangDropdown: React.Dispatch<React.SetStateAction<boolean>>
  isInSituAdmin: boolean
  onOpenServiceModal: () => void
  onLogoPointerDown: () => void
  onLogoPointerUp: () => void
  onLogoTouchStart: (e: React.TouchEvent) => void
  onLogoTouchMove: (e: React.TouchEvent) => void
}

export function MenuHeader({
  restaurant,
  restaurantDisplayName,
  tableNumber,
  isFixedMenu,
  currentLang,
  setCurrentLang,
  showLangDropdown,
  setShowLangDropdown,
  isInSituAdmin,
  onOpenServiceModal,
  onLogoPointerDown,
  onLogoPointerUp,
  onLogoTouchStart,
  onLogoTouchMove,
}: MenuHeaderProps) {
  const t = (key: string) => getTranslation(currentLang, key)

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-3xl mx-auto px-3 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between gap-2">
        {/* Logo y Datos de Mesa */}
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
          <div
            className="flex-shrink-0 cursor-pointer select-none [-webkit-touch-callout:none]"
            onMouseDown={onLogoPointerDown}
            onMouseUp={onLogoPointerUp}
            onMouseLeave={onLogoPointerUp}
            onTouchStart={onLogoTouchStart}
            onTouchMove={onLogoTouchMove}
            onTouchEnd={onLogoPointerUp}
            onTouchCancel={onLogoPointerUp}
            onContextMenu={(e) => e.preventDefault()}
            title="Fluxo Gastronomic System"
          >
            <FluxoLogo size={32} />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xs sm:text-sm font-extrabold text-slate-900 leading-tight truncate">
              {restaurantDisplayName || restaurant.name || 'Nombre del Local'}
            </h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              {isFixedMenu ? (
                <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200/80 uppercase whitespace-nowrap">
                  <span>Carta Digital Informativa</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 flex-shrink-0" />
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200/80 uppercase whitespace-nowrap">
                  <span>{t('tableNumberLabel')} #{tableNumber}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Acciones de Cabecera */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Selector de Idiomas */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowLangDropdown(prev => !prev)}
              className="px-2 py-1.5 sm:px-2.5 sm:py-1.5 rounded-xl font-black text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 flex items-center gap-1 shadow-xs transition-all active:scale-95 cursor-pointer"
              title="Cambiar idioma / Change language"
            >
              <span className="text-xs">{TOP_LANGUAGES.find(l => l.code === currentLang)?.flag || '🌐'}</span>
              <span className="uppercase text-[11px] font-black tracking-tight hidden min-[360px]:inline">{currentLang}</span>
              <ChevronDown className={`w-3 h-3 text-slate-500 transition-transform duration-200 ${showLangDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showLangDropdown && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowLangDropdown(false)} 
                />
                <div className="absolute right-0 mt-1.5 w-36 bg-white rounded-2xl shadow-xl border border-slate-200 py-1 z-50 animate-in fade-in zoom-in-95 overflow-hidden">
                  {TOP_LANGUAGES.map((langOpt) => {
                    const isSelected = currentLang === langOpt.code
                    return (
                      <button
                        key={langOpt.code}
                        type="button"
                        onClick={() => {
                          setCurrentLang(langOpt.code)
                          setShowLangDropdown(false)
                        }}
                        className={`w-full px-3 py-2 text-left text-xs font-black flex items-center justify-between transition-colors ${
                          isSelected
                            ? 'bg-blue-50 text-blue-900 font-extrabold'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span>{langOpt.flag}</span>
                          <span>{langOpt.name}</span>
                        </span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-blue-900 stroke-[3]" />}
                      </button>
                    )
                  })}
                </div>
              </>
            )}
          </div>

          {!isFixedMenu && (
            <>
              {/* Botón de Microservicios */}
              <button
                type="button"
                onClick={() => {
                  if (!isInSituAdmin) onOpenServiceModal()
                }}
                disabled={isInSituAdmin}
                className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl font-bold text-xs bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1 shadow-xs transition-all ${
                  isInSituAdmin
                    ? 'opacity-50 cursor-not-allowed pointer-events-none'
                    : 'hover:bg-slate-200 active:scale-95 cursor-pointer'
                }`}
                title={isInSituAdmin ? 'Servicios bloqueados en Modo Vista Previa' : 'Pedir servilletas, hielo, condimentos'}
              >
                <Bell className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                <span className="text-[11px] font-bold hidden min-[400px]:inline">{t('services')}</span>
              </button>

              {/* Botón de Llamar al Mozo */}
              <CallWaiterButton
                tableNumber={tableNumber}
                lang={currentLang}
                isPreviewMode={isInSituAdmin}
              />
            </>
          )}
        </div>
      </div>
    </header>
  )
}
