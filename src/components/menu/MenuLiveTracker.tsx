'use client'

import React from 'react'
import { Flame, Sparkles, ChevronRight, UtensilsCrossed, Receipt, X, Award, Clock } from 'lucide-react'
import { Order, OrderStatus, Restaurant } from '@/types/database.types'
import { LoyaltyProfile } from '@/types/loyalty.types'
import { getTranslation } from '@/lib/i18n'
import { GoogleReviewBooster } from '@/components/menu/GoogleReviewBooster'
import {
  isDrinkItem,
  isDrinkServed,
  isStarterItem,
  isStarterReady,
  isStarterServed,
  isMainItem,
  isMainCooking,
  isMainReady,
  isMainServed,
  isMainFired,
  isDessertItem,
  isDessertCooking,
  isDessertFired,
  isDessertReady,
  isDessertServed,
  isDessertPendingChoice,
  areOrderMainsFired,
  TAG_MAIN_FIRED,
  TAG_DESSERT_FIRED,
} from '@/lib/course-utils'

interface MenuLiveTrackerProps {
  isFixedMenu: boolean
  isTablePaid: boolean
  hasRequestedBill: boolean
  tableOrderStatus: OrderStatus | null
  tableOrders?: Order[]
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
  loyaltyProfile?: LoyaltyProfile | null
  onClaimLoyaltyBonus?: () => void
  onOpenLoyaltyModal?: () => void
  hasPendingDessertChoice?: boolean
  onOpenDessertSelector?: () => void
  hasPendingDesserts?: boolean
  loyaltyMode?: 'points' | 'stamps'
}

export function MenuLiveTracker({
  isFixedMenu,
  isTablePaid,
  hasRequestedBill,
  tableOrderStatus,
  tableOrders = [],
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
  loyaltyProfile,
  onClaimLoyaltyBonus,
  onOpenLoyaltyModal,
  hasPendingDessertChoice = false,
  onOpenDessertSelector,
  hasPendingDesserts = false,
  loyaltyMode = 'points',
}: MenuLiveTrackerProps) {
  const t = (key: string) => getTranslation(currentLang, key)

  if (isFixedMenu) return null

  // Análisis detallado en vivo de los platos y fases por categoría
  const allItems = (tableOrders || []).flatMap(o => o.order_items || [])
  const drinks = allItems.filter(isDrinkItem)
  const starters = allItems.filter(isStarterItem)
  const mains = allItems.filter(isMainItem)
  const desserts = allItems.filter(isDessertItem)

  const hasDrinks = drinks.length > 0
  const hasStarters = starters.length > 0
  const hasMains = mains.length > 0
  const hasDesserts = desserts.length > 0

  const areDrinksServed = hasDrinks && drinks.every(isDrinkServed)
  const areStartersServed = hasStarters && starters.every(isStarterServed)
  const areStartersReady = hasStarters && starters.every(isStarterReady)
  const areStartersCooking = hasStarters && !areStartersReady && !areStartersServed && (tableOrderStatus === 'preparing' || (tableOrders || []).some(o => o.status === 'preparing'))

  const areMainsServed = hasMains && mains.every(isMainServed)
  const areMainsReady = hasMains && mains.every(isMainReady)
  const areMainsFired =
    (tableOrders || []).some(areOrderMainsFired) ||
    mains.some(isMainFired) ||
    (tableOrders || []).some(
      o => (o as any).notes?.includes(TAG_MAIN_FIRED) || (o as any).kitchen_notes?.includes(TAG_MAIN_FIRED)
    )
  const areMainsCooking =
    mains.some(isMainCooking) ||
    (hasMains && areMainsFired && (tableOrderStatus === 'preparing' || (tableOrders || []).some(o => o.status === 'preparing'))) ||
    (hasMains && !hasStarters && (tableOrderStatus === 'preparing' || (tableOrders || []).some(o => o.status === 'preparing'))) ||
    (hasMains && areStartersServed && areMainsFired && (tableOrderStatus === 'preparing' || (tableOrders || []).some(o => o.status === 'preparing')))

  const areDessertsServed = hasDesserts && desserts.every(isDessertServed)
  const areDessertsReady = hasDesserts && desserts.every(isDessertReady)
  const areDessertsCooking =
    desserts.some(d => isDessertCooking(d) || isDessertFired(d)) ||
    (tableOrders || []).some(
      o => (o as any).notes?.includes(TAG_DESSERT_FIRED) || (o as any).kitchen_notes?.includes(TAG_DESSERT_FIRED)
    )
  const hasChoicePending = hasPendingDessertChoice || desserts.some(isDessertPendingChoice)

  // Título y subtítulo contextual según qué plato está en marcha en este instante
  let dynamicTitle = t('orderInKitchenTitle')
  let dynamicSubtitle = t('orderPreparingSubtitle')

  if (tableOrderStatus === 'preparing') {
    if (areStartersCooking) {
      dynamicTitle = '🥗 1º Entrantes en preparación en cocina'
      dynamicSubtitle = 'Cocina está elaborando tus entrantes. Los platos principales se marcharán después.'
    } else if (hasMains && areStartersServed && !areMainsFired) {
      dynamicTitle = '🥗 ¡A disfrutar de las entradas! · Principales en espera'
      dynamicSubtitle = 'Tus entrantes ya están en la mesa. Cuando terminéis, el mozo marchará los platos principales a cocina.'
    } else if (areMainsCooking) {
      dynamicTitle = '🍔 2º Platos principales en los fuegos'
      dynamicSubtitle = 'Cocina está elaborando tus platos principales al momento.'
    } else if (areDessertsCooking) {
      dynamicTitle = '🍰 Postres y cafés en preparación'
      dynamicSubtitle = 'Elaborando tus postres y cafés para cerrar tu experiencia.'
    } else if (hasMains && !areStartersServed && hasStarters) {
      dynamicTitle = '🥗 Entrantes en cocina · Principales en espera'
      dynamicSubtitle = 'Los platos principales se cocinarán en cuanto disfrutes de tus entrantes.'
    }
  } else if (tableOrderStatus === 'ready') {
    if (areStartersReady && !areStartersServed) {
      dynamicTitle = '🥗 ¡Entrantes listos para servir!'
      dynamicSubtitle = `El personal ya traslada tus entrantes a la Mesa #${tableNumber}.`
    } else if (areMainsReady && !areMainsServed) {
      dynamicTitle = '🍔 ¡Platos principales listos!'
      dynamicSubtitle = `Tus platos principales marchan hacia la Mesa #${tableNumber}.`
    } else if (areDessertsReady && !areDessertsServed) {
      dynamicTitle = '🍰 ¡Postres listos para servir!'
      dynamicSubtitle = `Tus postres y cafés marchan hacia la Mesa #${tableNumber}.`
    } else {
      dynamicTitle = '✨ ¡Comanda lista para servir!'
      dynamicSubtitle = `El personal traslada tus platos a la Mesa #${tableNumber}.`
    }
  }

  // Componente de pastillas / chips de estado en vivo para cada pase gastronómico
  const renderCourseProgressPills = () => {
    if (!hasDrinks && !hasStarters && !hasMains && !hasDesserts) return null

    return (
      <div className="flex items-center gap-1.5 flex-wrap pt-2 mt-1.5 border-t border-slate-200/50 text-[10px]">
        {/* 1. Bebidas */}
        {hasDrinks && (
          <span className={`px-2 py-0.5 rounded-lg border font-bold flex items-center gap-1 ${
            areDrinksServed
              ? 'bg-emerald-100 text-emerald-950 border-emerald-300'
              : tableOrderStatus === 'pending_validation'
              ? 'bg-slate-100 text-slate-700 border-slate-200'
              : 'bg-amber-100 text-amber-950 border-amber-300 animate-pulse'
          }`}>
            <span>🥤 Bebidas:</span>
            <span className="font-black">
              {areDrinksServed ? 'Servidas ✓' : tableOrderStatus === 'pending_validation' ? 'En comanda' : 'Marchando ⏳'}
            </span>
          </span>
        )}

        {/* 2. Entrantes */}
        {hasStarters && (
          <span className={`px-2 py-0.5 rounded-lg border font-bold flex items-center gap-1 ${
            areStartersServed
              ? 'bg-emerald-100 text-emerald-950 border-emerald-300'
              : areStartersReady
              ? 'bg-emerald-200 text-emerald-950 border-emerald-400 animate-pulse ring-1 ring-emerald-400'
              : areStartersCooking
              ? 'bg-amber-100 text-amber-950 border-amber-300 animate-pulse'
              : tableOrderStatus === 'pending'
              ? 'bg-blue-100 text-blue-950 border-blue-200'
              : 'bg-slate-100 text-slate-700 border-slate-200'
          }`}>
            <span>🥗 Entrantes:</span>
            <span className="font-black">
              {areStartersServed
                ? 'Servidos ✓'
                : areStartersReady
                ? '¡Listos! 🍽️'
                : areStartersCooking
                ? 'En fuegos 🔥'
                : tableOrderStatus === 'pending'
                ? 'En cola ⏳'
                : 'En comanda'}
            </span>
          </span>
        )}

        {/* 3. Principales */}
        {hasMains && (
          <span className={`px-2 py-0.5 rounded-lg border font-bold flex items-center gap-1 ${
            areMainsServed
              ? 'bg-emerald-100 text-emerald-950 border-emerald-300'
              : areMainsReady
              ? 'bg-emerald-200 text-emerald-950 border-emerald-400 animate-pulse ring-1 ring-emerald-400'
              : areMainsCooking
              ? 'bg-amber-100 text-amber-950 border-amber-300 animate-pulse'
              : (hasStarters && !areMainsFired) || (hasStarters && !areStartersServed && !areStartersReady)
              ? 'bg-slate-100 text-slate-600 border-slate-200'
              : tableOrderStatus === 'pending'
              ? 'bg-blue-100 text-blue-950 border-blue-200'
              : 'bg-slate-100 text-slate-700 border-slate-200'
          }`}>
            <span>🍔 Principales:</span>
            <span className="font-black">
              {areMainsServed
                ? 'Servidos ✓'
                : areMainsReady
                ? '¡Listos! 🍽️'
                : areMainsCooking
                ? 'En fuegos 🔥'
                : (hasStarters && !areMainsFired) || (hasStarters && !areStartersServed && !areStartersReady)
                ? 'Tras entradas ⏳'
                : tableOrderStatus === 'pending'
                ? 'En cola ⏳'
                : 'En comanda'}
            </span>
          </span>
        )}

        {/* 4. Postres */}
        {hasDesserts && (
          <span className={`px-2 py-0.5 rounded-lg border font-bold flex items-center gap-1 ${
            areDessertsServed
              ? 'bg-emerald-100 text-emerald-950 border-emerald-300'
              : areDessertsReady
              ? 'bg-emerald-200 text-emerald-950 border-emerald-400 animate-pulse ring-1 ring-emerald-400'
              : areDessertsCooking
              ? 'bg-purple-100 text-purple-950 border-purple-300 animate-pulse'
              : hasChoicePending
              ? 'bg-purple-200 text-purple-950 border-purple-400 font-black animate-pulse'
              : 'bg-slate-100 text-slate-600 border-slate-200'
          }`}>
            <span>🍰 Postres:</span>
            <span className="font-black">
              {areDessertsServed
                ? 'Servidos ✓'
                : areDessertsReady
                ? '¡Listos! 🍽️'
                : areDessertsCooking
                ? 'En preparación 🔥'
                : hasChoicePending
                ? '1 por elegir 🎁'
                : (hasStarters || hasMains)
                ? 'Para el final ⏸️'
                : 'En cola ⏳'}
            </span>
          </span>
        )}
      </div>
    )
  }

  return (
    <>
      {/* 1. Tracker de Fases de Cocina Activo (Pastilla Compacta de 1 Línea) */}
      {!isTablePaid && !hasRequestedBill && tableOrderStatus && (
        <div className="max-w-2xl mx-auto px-3.5 pt-2 w-full animate-in fade-in duration-200">
          {tableOrderStatus !== 'delivered' ? (
            <button
              type="button"
              onClick={onOpenTimelineModal}
              className={`w-full py-2.5 px-3.5 rounded-xl border text-xs font-black shadow-xs flex items-center justify-between gap-2 transition-all cursor-pointer active:scale-[0.99] ${
                tableOrderStatus === 'ready'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950 ring-1 ring-emerald-300'
                  : tableOrderStatus === 'preparing'
                  ? 'bg-amber-50 border-amber-300 text-amber-950 hover:bg-amber-100/70'
                  : tableOrderStatus === 'pending_validation'
                  ? 'bg-orange-50 border-orange-300 text-orange-950 hover:bg-orange-100/70'
                  : 'bg-blue-50 border-blue-300 text-blue-950 hover:bg-blue-100/70'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="flex-shrink-0 text-sm">
                  {tableOrderStatus === 'ready'
                    ? '✨'
                    : tableOrderStatus === 'preparing'
                    ? '🔥'
                    : tableOrderStatus === 'pending_validation'
                    ? '⏳'
                    : '👨‍🍳'}
                </span>
                <span className="truncate">
                  {tableOrderStatus === 'ready'
                    ? '¡Comanda lista para servir!'
                    : tableOrderStatus === 'preparing'
                    ? 'Comanda en preparación en cocina'
                    : tableOrderStatus === 'pending_validation'
                    ? 'Comanda enviada · Pendiente de validación'
                    : 'Comanda validada · En cola de cocina'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0 text-[11px] font-bold text-slate-700 bg-white/80 px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                <span>{t('viewPhases') || 'Ver fases'}</span>
                <ChevronRight size={12} />
              </div>
            </button>
          ) : (
            
            <div className="space-y-3 animate-in fade-in duration-300">
              <div className="p-3.5 bg-amber-50/70 text-slate-900 rounded-2xl border border-amber-200/90 shadow-xs space-y-2.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center flex-shrink-0 font-black shadow-2xs">
                      <UtensilsCrossed className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-black uppercase tracking-wider text-amber-800">
                          {t('tableNumberLabel')} #{tableNumber}
                        </span>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      </div>
                      <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 leading-tight truncate">
                        {t('orderDeliveredTitle')} · ¡Buen provecho!
                      </h4>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={onOpenTimelineModal}
                    className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-[10px] font-bold border border-slate-200 shadow-2xs transition-colors flex items-center gap-1 flex-shrink-0 cursor-pointer"
                  >
                    <span>{t('viewPhases') || 'Ver fases'}</span>
                    <ChevronRight size={11} />
                  </button>
                </div>
                {renderCourseProgressPills()}
              </div>

              {/* Banner destacado: Elegir postre comodín incluido */}
              {hasPendingDessertChoice && onOpenDessertSelector ? (
                <div className="p-3 rounded-2xl bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 border-2 border-purple-300 flex items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-xl flex-shrink-0">🍰</span>
                    <div className="min-w-0">
                      <span className="text-xs font-black text-purple-950 block leading-tight">
                        Tienes 1 postre o café incluido
                      </span>
                      <span className="text-[11px] text-purple-700 font-medium truncate block">
                        Elige tu opción ahora para marcharla a cocina
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={onOpenDessertSelector}
                    className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs shadow-md transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer flex-shrink-0"
                  >
                    <Sparkles size={13} />
                    <span>Elegir Postre</span>
                  </button>
                </div>
              ) : hasPendingDesserts ? (
                <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 flex items-center justify-between gap-3 shadow-2xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-xl flex-shrink-0">🍨</span>
                    <div className="min-w-0">
                      <span className="text-xs font-black text-amber-950 block leading-tight">
                        Postres en marcha
                      </span>
                      <span className="text-[11px] text-amber-800 font-medium truncate block">
                        Disfruta de tus postres antes de solicitar la cuenta
                      </span>
                    </div>
                  </div>
                  {/* Sin botón duplicado 'Ver fases' según requerimiento */}
                </div>
              ) : (
                <>
                  <p className="text-[11px] text-slate-600 font-medium leading-snug">
                    ¿Deseas sumar café o postre para la sobremesa, o pedir la cuenta?
                  </p>

                  <div className="grid grid-cols-2 gap-2 pt-0.5">
                    <button
                      type="button"
                      onClick={onGoToDesserts}
                      className="p-2.5 rounded-xl bg-white hover:bg-amber-100/60 text-amber-950 border border-amber-300 text-xs font-black flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-xs cursor-pointer"
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
                </>
              )}
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
              <button
                type="button"
                onClick={onOpenDirectBillModal}
                className="mt-2.5 px-3 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-black flex items-center gap-1.5 border border-emerald-600/60 shadow-xs cursor-pointer active:scale-95 transition-all"
              >
                <Receipt size={13} className="text-emerald-400" />
                <span>Ver detalle de consumos</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Vista cuando la mesa ya ha sido cobrada */}
      {isTablePaid && (
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
                    {loyaltyProfile
                      ? `Has acumulado puntos en tu tarjeta digital con esta consumición.`
                      : `Puedes consultar y acumular tus puntos de fidelización con esta compra.`}
                  </p>
                  {onOpenLoyaltyModal && (
                    <button
                      type="button"
                      onClick={onOpenLoyaltyModal}
                      className="mt-2 px-3.5 py-1.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-emerald-950 border border-emerald-300/80 text-xs font-black flex items-center gap-1.5 transition-all active:scale-95 shadow-sm shadow-emerald-900/40 cursor-pointer"
                    >
                      <Award className="w-3.5 h-3.5 text-emerald-900" />
                      <span>{loyaltyProfile ? `🎁 Premios y Puntos (${loyaltyProfile.available_points} pts)` : 'Unirme al Club de Puntos'}</span>
                    </button>
                  )}
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
          {!isReviewBoosterDismissed && Boolean(loyaltyProfile && !loyaltyProfile.google_review_bonus_awarded) && (
            <GoogleReviewBooster
              restaurantName={restaurant.name}
              restaurantSlug={restaurant.slug}
              googleReviewUrl={restaurant.google_review_url}
              googlePlaceId={restaurant.google_place_id}
              variant="card"
              loyaltyMode={loyaltyMode}
              onDismiss={onDismissReviewBooster}
              loyaltyProfile={loyaltyProfile}
              onClaimLoyaltyBonus={onClaimLoyaltyBonus}
            />
          )}
        </div>
      )}
    </>
  )
}
