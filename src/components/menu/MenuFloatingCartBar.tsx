'use client'

import React from 'react'
import { Utensils, Sparkles, ShoppingBag, ChevronRight, Plus, Lock } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { getTranslation } from '@/lib/i18n'

interface MenuFloatingCartBarProps {
  isFixedMenu: boolean
  isInSituAdmin: boolean
  totalCartCount: number
  totalCartAmount: number
  tableNumber: string
  currentLang: string
  onOpenCart: () => void
  onOpenAddProductModal: () => void
  onExitAdminMode: () => void
}

export function MenuFloatingCartBar({
  isFixedMenu,
  isInSituAdmin,
  totalCartCount,
  totalCartAmount,
  tableNumber,
  currentLang,
  onOpenCart,
  onOpenAddProductModal,
  onExitAdminMode,
}: MenuFloatingCartBarProps) {
  const t = (key: string) => getTranslation(currentLang, key)

  if (isFixedMenu) {
    if (isInSituAdmin) return null
    return (
      <div className="fixed bottom-3 inset-x-3 sm:bottom-4 sm:inset-x-4 max-w-xl mx-auto z-40 pointer-events-auto">
        <div className="bg-slate-900/95 backdrop-blur-md text-white p-3 sm:p-3.5 rounded-2xl shadow-xl flex items-center justify-between gap-3 border border-slate-800">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-blue-600/30 text-blue-400 flex items-center justify-center flex-shrink-0 border border-blue-500/20">
              <Utensils className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-400 block leading-tight">
                Carta Digital Informativa
              </span>
              <p className="text-xs text-slate-200 font-medium leading-tight truncate sm:whitespace-normal">
                Para realizar tu pedido o consultar dudas sobre alérgenos, avisa a tu camarero.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Barra de Carrito para Comensal */}
      {totalCartCount > 0 && !isInSituAdmin && (
        <div className="fixed bottom-3 inset-x-3 sm:bottom-4 sm:inset-x-4 max-w-xl mx-auto z-40 gpu-layer">
          <div className="flex justify-end pr-2 pb-1.5 animate-in fade-in">
            <div className="bg-slate-900/95 text-white border border-blue-400/40 text-[10px] sm:text-[11px] font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1.5 animate-bounce backdrop-blur-md">
              <Sparkles size={11} className="text-amber-300 flex-shrink-0" />
              <span>{t('tooltipAddToCartNotice')}</span>
            </div>
          </div>

          <div className="bg-slate-900/95 backdrop-blur-md text-white p-3 sm:p-3.5 rounded-2xl shadow-[0_12px_36px_rgba(15,23,42,0.35)] flex items-center justify-between border border-slate-800 animate-in slide-in-from-bottom duration-350 ease-[cubic-bezier(0.16,1,0.3,1)]">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-600/30 flex-shrink-0 animate-pop">
                <ShoppingBag size={16} />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] text-slate-400 font-medium truncate">
                  {totalCartCount} {totalCartCount === 1 ? (t('itemSingle') || 'ítem') : (t('items') || 'ítems')} &middot; {t('tableNumberLabel')} #{tableNumber}
                </div>
                <div className="text-sm sm:text-base font-black text-amber-300 tabular-nums">
                  {formatCurrency(totalCartAmount)}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onOpenCart}
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl text-xs font-extrabold flex items-center space-x-1 transition-all shadow-md shadow-blue-600/30 smooth-press flex-shrink-0 cursor-pointer"
            >
              <span>{t('viewCart')}</span>
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* Barra Flotante de Administrador In-Situ */}
      {isInSituAdmin && (
        <div className="fixed bottom-3 inset-x-3 sm:bottom-4 sm:inset-x-4 max-w-xl mx-auto z-40 gpu-layer animate-in slide-in-from-bottom duration-300">
          <div className="bg-slate-900/95 backdrop-blur-md text-white p-3 sm:p-3.5 rounded-2xl shadow-2xl border border-purple-500/40 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-purple-600/30 text-purple-300 flex items-center justify-center flex-shrink-0 border border-purple-500/30">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-white leading-tight">Modo Edición Activo</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <p className="text-[10px] text-slate-300 truncate">
                  Edición de carta en vivo &middot; Modificaciones en tiempo real
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={onOpenAddProductModal}
                className="px-2.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-extrabold flex items-center gap-1 transition-all shadow-xs cursor-pointer active:scale-95"
              >
                <Plus size={13} className="stroke-[3]" />
                <span className="hidden sm:inline">Añadir plato</span>
              </button>
              <button
                type="button"
                onClick={onExitAdminMode}
                className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                title="Salir del modo de edición"
              >
                <Lock className="w-3.5 h-3.5 text-rose-400" />
                <span>Salir de Edición</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
