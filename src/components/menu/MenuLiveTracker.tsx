'use client'

import React from 'react'
import { Flame, Sparkles, ChevronRight, UtensilsCrossed, Receipt, X } from 'lucide-react'
import { OrderStatus, Restaurant } from '@/types/database.types'
import { getTranslation } from '@/lib/i18n'
import { GoogleReviewBooster } from '@/components/menu/GoogleReviewBooster'

interface MenuLiveTrackerProps {
  isFixedMenu: boolean
  isTablePaid: boolean
  hasRequestedBill: boolean
  tableOrderStatus: OrderStatus | null
  tableNumber: string
  currentLang: string
  isPaidBannerDismissed: boolean
  onDismissPaidBanner: () => void
  isReviewBoosterDismissed: boolean
  onDismissReviewBooster: () => void
  restaurant: Restaurant
  onOpenTimelineModal: () => void
  onOpenDirectBillModal: () => void
  onGoToDesserts: () => void
}

export function MenuLiveTracker({
  isFixedMenu,
  isTablePaid,
  hasRequestedBill,
  tableOrderStatus,
  tableNumber,
  currentLang,
  isPaidBannerDismissed,
  onDismissPaidBanner,
  isReviewBoosterDismissed,
  onDismissReviewBooster,
  restaurant,
  onOpenTimelineModal,
  onOpenDirectBillModal,
  onGoToDesserts,
}: MenuLiveTrackerProps) {
  const t = (key: string) => getTranslation(currentLang, key)

  if (isFixedMenu) return null

  return (
    <>
      {/* 1. Tracker de Fases de Cocina Activo */}
      {!isTablePaid && !hasRequestedBill && tableOrderStatus && (
        <div className="max-w-2xl mx-auto px-3.5 pt-3 w-full">
          {tableOrderStatus === 'preparing' && (
            <div
              onClick={onOpenTimelineModal}
              className="p-3 rounded-2xl bg-amber-500/10 border border-amber-400/40 text-amber-950 shadow-xs flex items-center justify-between gap-3 animate-in fade-in cursor-pointer hover:bg-amber-500/15 transition-all"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center flex-shrink-0 font-black shadow-xs">
                  <Flame className="w-4 h-4 animate-pulse" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-700">
                      {t('tableNumberLabel')} #{tableNumber}
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                  </div>
                  <h4 className="font-extrabold text-xs text-slate-900 leading-tight truncate">
                    {t('orderInKitchenTitle')}
                  </h4>
                  <p className="text-[10px] text-slate-600 mt-0.5 leading-snug">
                    {t('orderPreparingSubtitle')}
                  </p>
                </div>
              </div>
              <div className="px-2.5 py-1 rounded-xl bg-white border border-amber-300 text-[11px] font-black text-amber-950 flex items-center gap-1 flex-shrink-0 shadow-xs">
                <span>{t('viewPhases')}</span>
                <ChevronRight size={12} />
              </div>
            </div>
          )}

          {tableOrderStatus === 'ready' && (
            <div
              onClick={onOpenTimelineModal}
              className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-400/40 text-emerald-950 shadow-xs flex items-center justify-between gap-3 animate-bounce cursor-pointer hover:bg-emerald-500/15 transition-all"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 font-black shadow-xs">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700">
                      {t('tableNumberLabel')} #{tableNumber}
                    </span>
                  </div>
                  <h4 className="font-extrabold text-xs text-emerald-950 leading-tight truncate">
                    {t('orderReadyTitle')}
                  </h4>
                  <p className="text-[10px] text-emerald-800 mt-0.5 leading-snug">
                    {t('orderReadySubtitle')}
                  </p>
                </div>
              </div>
              <div className="px-2.5 py-1 rounded-xl bg-white border border-emerald-300 text-[11px] font-black text-emerald-950 flex items-center gap-1 flex-shrink-0 shadow-xs">
                <span>{t('viewPhases')}</span>
                <ChevronRight size={12} />
              </div>
            </div>
          )}

          {tableOrderStatus === 'pending_validation' && (
            <div
              onClick={onOpenTimelineModal}
              className="p-2.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 text-xs font-semibold flex items-center justify-between gap-2 shadow-xs cursor-pointer hover:bg-amber-100/70 transition-all animate-in fade-in"
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse flex-shrink-0" />
                <span className="text-[11px]">Comanda enviada &middot; Pendiente de validación en mesa</span>
              </div>
              <div className="flex items-center gap-0.5 text-[10px] font-bold text-amber-800">
                <span>{t('viewPhases')}</span>
                <ChevronRight size={12} />
              </div>
            </div>
          )}

          {tableOrderStatus === 'pending' && (
            <div
              onClick={onOpenTimelineModal}
              className="p-2.5 rounded-2xl bg-blue-50 border border-blue-200 text-blue-950 text-xs font-semibold flex items-center justify-between gap-2 shadow-xs cursor-pointer hover:bg-blue-100/70 transition-all"
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse flex-shrink-0" />
                <span className="text-[11px]">Comanda validada &middot; En cola de cocina</span>
              </div>
              <div className="flex items-center gap-0.5 text-[10px] font-bold text-blue-800">
                <span>{t('viewPhases')}</span>
                <ChevronRight size={12} />
              </div>
            </div>
          )}

          {tableOrderStatus === 'delivered' && (
            <div className="space-y-3 animate-in fade-in duration-300">
              <div className="p-3.5 bg-slate-900 text-white rounded-2xl border border-slate-700/80 shadow-md space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center flex-shrink-0 font-black shadow-xs">
                      <UtensilsCrossed className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                          {t('tableNumberLabel')} #{tableNumber}
                        </span>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      </div>
                      <h4 className="font-extrabold text-xs text-white leading-tight truncate">
                        {t('orderDeliveredTitle')} · ¡Buen provecho!
                      </h4>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={onOpenTimelineModal}
                    className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold border border-slate-700 transition-colors flex items-center gap-1 flex-shrink-0 cursor-pointer"
                  >
                    <span>{t('viewPhases')}</span>
                    <ChevronRight size={11} />
                  </button>
                </div>

                <p className="text-[11px] text-slate-300 leading-snug">
                  ¿Deseas sumar café o postre para la sobremesa, o pedir la cuenta?
                </p>

                <div className="grid grid-cols-2 gap-2 pt-0.5">
                  <button
                    type="button"
                    onClick={onGoToDesserts}
                    className="p-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 text-xs font-black flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-xs cursor-pointer"
                  >
                    <span className="text-sm">☕🍰</span>
                    <span>Café / Postres</span>
                  </button>

                  <button
                    type="button"
                    onClick={onOpenDirectBillModal}
                    className="p-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-xs cursor-pointer"
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    <span>{t('billButton')}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. Vista tras pedir la cuenta */}
      {!isTablePaid && hasRequestedBill && (
        <div className="max-w-2xl mx-auto px-3.5 pt-3 w-full animate-in fade-in duration-300">
          <div className="p-3.5 bg-emerald-950/95 text-white rounded-2xl border border-emerald-600/50 shadow-md flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center flex-shrink-0 font-black shadow-xs">
              <Receipt className="w-5 h-5 animate-pulse" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
                  Mesa #{tableNumber} &middot; Cuenta Solicitada
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              </div>
              <h4 className="font-extrabold text-xs text-white leading-tight mt-0.5">
                El mozo ya va hacia tu mesa para realizar el cobro
              </h4>
              <p className="text-[10px] text-emerald-300/90 mt-0.5 leading-snug">
                El personal se acerca a tu mesa con el desglose para abonar en efectivo o con tarjeta.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 3. Vista cuando la mesa ya ha sido cobrada */}
      {isTablePaid && (!isPaidBannerDismissed || !isReviewBoosterDismissed) && (
        <div className="max-w-2xl mx-auto px-3.5 pt-3 w-full space-y-3 animate-in fade-in duration-300">
          {!isPaidBannerDismissed && (
            <div className="p-3.5 bg-emerald-950 text-white rounded-2xl border border-emerald-600/50 shadow-md flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center flex-shrink-0 font-black shadow-xs">
                  <Receipt className="w-5 h-5 text-slate-950" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
                    Mesa #{tableNumber} &middot; Pago Confirmado
                  </span>
                  <h4 className="font-extrabold text-xs text-white leading-tight mt-0.5">
                    ¡Pago confirmado! Gracias por tu visita
                  </h4>
                  <p className="text-[10px] text-emerald-300/90 mt-0.5 leading-snug">
                    Tu comanda ha sido cobrada correctamente en mesa.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onDismissPaidBanner}
                className="p-1 rounded-full text-emerald-400 hover:text-white hover:bg-emerald-900/50 transition-colors flex-shrink-0 cursor-pointer"
                title="Cerrar aviso"
              >
                <X size={16} />
              </button>
            </div>
          )}
          {!isReviewBoosterDismissed && (
            <GoogleReviewBooster
              restaurantName={restaurant.name}
              restaurantSlug={restaurant.slug}
              googleReviewUrl={restaurant.google_review_url}
              googlePlaceId={restaurant.google_place_id}
              variant="card"
              onDismiss={onDismissReviewBooster}
            />
          )}
        </div>
      )}
    </>
  )
}
