'use client'

import React from 'react'
import { ChevronDown, Check, Bell, Award, Gift, Globe, LogOut } from 'lucide-react'
import { FluxoLogo } from '@/components/common/FluxoLogo'
import { CallWaiterButton } from '@/components/menu/CallWaiterButton'
import { TOP_LANGUAGES, getTranslation } from '@/lib/i18n'
import { Restaurant } from '@/types/database.types'
import { LoyaltyProfile } from '@/types/loyalty.types'

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
  loyaltyPoints?: number
  loyaltyMode?: 'stamps' | 'points' | 'disabled'
  stampsCount?: number
  stampsTarget?: number
  unlockedRewardsCount?: number
  loyaltyProfile?: LoyaltyProfile | null
  onLogout?: () => void
  onOpenLoyaltyModal?: () => void
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
  loyaltyProfile,
  onLogout,
  loyaltyPoints,
  loyaltyMode = 'stamps',
  stampsCount = 0,
  stampsTarget = 5,
  unlockedRewardsCount = 0,
  onOpenLoyaltyModal,
}: MenuHeaderProps) {
  const t = (key: string) => getTranslation(currentLang, key)

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-3xl mx-auto px-3 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between gap-2">
        {/* Logo y Datos de Mesa */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0 flex-1">
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
            <FluxoLogo size={28} />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xs sm:text-sm font-extrabold text-slate-900 leading-tight truncate">
              {restaurantDisplayName || restaurant.name || 'Nombre del Local'}
            </h1>
            <div className="flex items-center gap-1 mt-0.5">
              {isFixedMenu ? (
                <span className="inline-flex items-center gap-1 text-[9px] sm:text-[11px] font-black text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded-md border border-blue-200/80 uppercase whitespace-nowrap">
                  <span>Carta Digital</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 flex-shrink-0" />
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[9px] sm:text-[11px] font-black text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded-md border border-blue-200/80 uppercase whitespace-nowrap">
                  <span>Mesa #{tableNumber}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Acciones de Cabecera */}
        <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
          {/* Selector de Idiomas */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowLangDropdown(prev => !prev)}
              className="px-1.5 py-1 sm:px-2.5 sm:py-1.5 rounded-xl font-black text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 flex items-center gap-1 shadow-xs transition-all active:scale-95 cursor-pointer"
              title="Cambiar idioma / Change language"
            >
              <Globe className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
              <span className="uppercase text-[10px] sm:text-[11px] font-black tracking-tight">{currentLang}</span>
              <ChevronDown className={`w-3 h-3 text-slate-500 transition-transform duration-200 ${showLangDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showLangDropdown && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowLangDropdown(false)} 
                />
                <div className="absolute right-0 mt-1.5 w-48 max-w-[calc(100vw-24px)] max-h-80 overflow-y-auto bg-white rounded-2xl shadow-2xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 scrollbar-thin divide-y divide-slate-100">
                  <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-50/80">
                    Idiomas / Languages
                  </div>
                  <div className="py-1">
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
                          <span className="flex items-center gap-2.5">
                            <span
                              className={`w-5 h-4.5 rounded text-[10px] font-black flex items-center justify-center shrink-0 tracking-wider uppercase transition-colors ${
                                isSelected
                                  ? 'bg-blue-600 text-white shadow-2xs'
                                  : 'bg-slate-100 text-slate-600 border border-slate-200/90'
                              }`}
                            >
                              {langOpt.code}
                            </span>
                            <span className="truncate">{langOpt.nativeName}</span>
                          </span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-blue-900 stroke-[3] flex-shrink-0" />}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </>
            )}
          </div>

          {!isFixedMenu && (
            <>
              {/* Botón de Fidelización / Premios */}
              {onOpenLoyaltyModal && loyaltyMode !== 'disabled' && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onOpenLoyaltyModal()
                  }}
                  className={`px-2 py-1.5 sm:px-2.5 sm:py-1.5 rounded-xl font-black text-xs flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer ${
                    unlockedRewardsCount > 0 || stampsCount > 0 || Boolean(loyaltyProfile)
                      ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 ring-2 ring-amber-400/40 shadow-[0_0_12px_rgba(245,158,11,0.25)] animate-[pulse_2.5s_cubic-bezier(0.4,0,0.6,1)_infinite]'
                      : 'bg-amber-50/90 hover:bg-amber-100 text-amber-900 border border-amber-200/90'
                  }`}
                  title={
                    loyaltyMode === 'points'
                      ? 'Consultar saldo y canjear puntos de fidelización'
                      : 'Ver mi cartilla de sellos y premios'
                  }
                >
                  {unlockedRewardsCount > 0 ? (
                    <>
                      <Gift className="w-3.5 h-3.5 text-amber-700 flex-shrink-0" />
                      <span className="text-[11px] font-black truncate max-w-[120px] sm:max-w-none">
                        {loyaltyProfile?.name
                          ? `${loyaltyProfile.name.trim().split(/\s+/)[0]} · ¡Premio!`
                          : '¡1 Premio!'}
                      </span>
                    </>
                  ) : loyaltyMode === 'points' ? (
                    <>
                      <Award className="w-3.5 h-3.5 text-amber-700 flex-shrink-0" />
                      <span className="text-[11px] font-black truncate max-w-[120px] sm:max-w-none">
                        {loyaltyProfile?.name
                          ? `${loyaltyProfile.name.trim().split(/\s+/)[0]} · ${loyaltyPoints ?? loyaltyProfile.available_points ?? 0} pts`
                          : loyaltyPoints !== undefined && loyaltyPoints !== null
                          ? `${loyaltyPoints} pts`
                          : 'Puntos'}
                      </span>
                    </>
                  ) : (
                    <>
                      <Gift className="w-3.5 h-3.5 text-amber-700 flex-shrink-0" />
                      <span className="text-[11px] font-black truncate max-w-[130px] sm:max-w-none">
                        {loyaltyProfile?.name
                          ? `${loyaltyProfile.name.trim().split(/\s+/)[0]} · ${stampsCount}/${stampsTarget}`
                          : stampsCount > 0
                          ? `Sellos · ${stampsCount}/${stampsTarget}`
                          : 'Premios'}
                      </span>
                    </>
                  )}
                </button>
              )}

              {/* Botón Cerrar Sesión del comensal en esta mesa */}
              {loyaltyProfile && onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  className="p-1.5 sm:px-2 sm:py-1.5 rounded-xl font-bold text-xs bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-600 border border-slate-200/90 hover:border-red-200 flex items-center gap-1 shadow-2xs transition-all active:scale-95 cursor-pointer"
                  title={`Cerrar sesión de ${loyaltyProfile.name || 'comensal'} en esta mesa`}
                >
                  <LogOut className="w-3.5 h-3.5 text-slate-500 hover:text-red-500 flex-shrink-0" />
                  <span className="text-[10px] sm:text-[11px] font-bold hidden min-[440px]:inline">
                    Salir
                  </span>
                </button>
              )}

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
