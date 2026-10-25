'use client'

import React from 'react'
import { Flame, Sparkles, ChevronRight, UtensilsCrossed, Receipt, X, Award, Clock, CheckCircle2 } from 'lucide-react'
import { Order, OrderStatus, Restaurant } from '@/types/database.types'
import { LoyaltyProfile } from '@/types/loyalty.types'
import { getTranslation } from '@/lib/i18n'
import { GoogleReviewBooster } from '@/components/menu/GoogleReviewBooster'
import { PostPaymentView } from '@/components/menu/PostPaymentView'
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
  areOrderStartersReady,
  areOrderStartersServed,
  areOrderMainsFired,
  areOrderMainsReady,
  areOrderMainsServed,
  isOrderDessertsReady,
  areOrderDessertsServed,
  areAllOrderCoursesDelivered,
  TAG_MAIN_FIRED,
  TAG_DESSERT_FIRED,
} from '@/lib/course-utils'

interface MenuLiveTrackerProps {
  isFixedMenu: boolean
  isTablePaid: boolean
  isOrderPaid?: boolean
  paidTotal?: number
  onResetTableSession?: () => void
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
  onLogout?: () => void
  hasPendingDessertChoice?: boolean
  onOpenDessertSelector?: () => void
  hasPendingDesserts?: boolean
  loyaltyMode?: 'points' | 'stamps'
}

export function MenuLiveTracker({
  isFixedMenu,
  isTablePaid,
  isOrderPaid = false,
  paidTotal,
  onResetTableSession,
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
  onLogout,
  hasPendingDessertChoice = false,
  onOpenDessertSelector,
  hasPendingDesserts = false,
  loyaltyMode = 'points',
}: MenuLiveTrackerProps) {
  const t = (key: string) => getTranslation(currentLang, key)

  if (isFixedMenu) return null

  const getParentOrder = (item: any) =>
    (tableOrders || []).find(o => (o.order_items || []).some(it => it === item || (it.id && it.id === item.id))) ||
    (tableOrders || [])[0]

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

  const isPreparingAny = tableOrderStatus === 'preparing' || (tableOrders || []).some(o => o.status === 'preparing')

  const areDrinksServed =
    hasDrinks &&
    (drinks.every(it => isDrinkServed(it, getParentOrder(it))) ||
      tableOrderStatus === 'delivered' ||
  
      ((tableOrders || []).length > 0 && (tableOrders || []).every(o => o.status === 'delivered' || o.status === 'paid')))

  const areStartersServed =
    hasStarters &&
    (((tableOrders || []).length > 0 && (tableOrders || []).every(areOrderStartersServed)) ||
      starters.every(it => isStarterServed(it, getParentOrder(it))))

  const areStartersReady =
    hasStarters &&
    !areStartersServed &&
    !['pending_validation', 'pending'].includes(tableOrderStatus || '') &&
    (((tableOrders || []).length > 0 && (tableOrders || []).some(o => (o.order_items || []).some(isStarterItem) && areOrderStartersReady(o))) ||
      starters.some(it => isStarterReady(it, getParentOrder(it))))

  const areStartersCooking =
    hasStarters &&
    !areStartersReady &&
    !areStartersServed &&
    isPreparingAny

  const areMainsServed =
    hasMains &&
    (((tableOrders || []).length > 0 && (tableOrders || []).every(areOrderMainsServed)) ||
      mains.every(it => isMainServed(it, getParentOrder(it))))

  const areMainsReady =
    hasMains &&
    !areMainsServed &&
    !['pending_validation', 'pending'].includes(tableOrderStatus || '') &&
    (((tableOrders || []).length > 0 && (tableOrders || []).some(o => (o.order_items || []).some(isMainItem) && areOrderMainsReady(o))) ||
      mains.some(it => isMainReady(it, getParentOrder(it))))

  const areMainsFired =
    (tableOrders || []).some(areOrderMainsFired) ||
    mains.some(it => isMainFired(it, getParentOrder(it))) ||
    (tableOrders || []).some(
      o => (o as any).notes?.includes(TAG_MAIN_FIRED) || (o as any).kitchen_notes?.includes(TAG_MAIN_FIRED)
    )

  const areMainsCooking =
    hasMains &&
    !areMainsReady &&
    !areMainsServed &&
    (mains.some(it => isMainCooking(it, getParentOrder(it))) ||
      (areMainsFired && isPreparingAny) ||
      (!hasStarters && isPreparingAny) ||
      (areStartersServed && areMainsFired && isPreparingAny))

  const areDessertsServed =
    hasDesserts &&
    (((tableOrders || []).length > 0 && (tableOrders || []).every(areOrderDessertsServed)) ||
      desserts.every(it => isDessertServed(it, getParentOrder(it))))

  const areDessertsReady =
    hasDesserts &&
    !areDessertsServed &&
    !['pending_validation', 'pending'].includes(tableOrderStatus || '') &&
    (((tableOrders || []).length > 0 && (tableOrders || []).some(o => (o.order_items || []).some(isDessertItem) && isOrderDessertsReady(o))) ||
      desserts.some(it => isDessertReady(it, getParentOrder(it))))

  const areDessertsCooking =
    hasDesserts &&
    !areDessertsReady &&
    !areDessertsServed &&
    (desserts.some(d => isDessertCooking(d, getParentOrder(d)) || isDessertFired(d, getParentOrder(d))) ||
      (tableOrders || []).some(
        o => (o as any).notes?.includes(TAG_DESSERT_FIRED) || (o as any).kitchen_notes?.includes(TAG_DESSERT_FIRED)
      ) ||
      (!hasStarters && !hasMains && isPreparingAny))

  const hasChoicePending = hasPendingDessertChoice || desserts.some(isDessertPendingChoice)

  // Determinar estados globales según Bloque 4.2:
  const isPaidActive = Boolean(isTablePaid || isOrderPaid)
  const isAllDelivered =
    !isPaidActive &&
    Boolean(tableOrders && tableOrders.length > 0) &&
    (tableOrderStatus === 'delivered' || (tableOrders.length > 0 && tableOrders.every(o => o.status !== 'pending_validation' && o.status !== 'paid') && tableOrders.every(o => o.status === 'delivered' || areAllOrderCoursesDelivered(o))))






  const hasAnyPhaseReadyToServe =
    !isAllDelivered &&
    !['pending_validation', 'pending'].includes(tableOrderStatus || '') &&
    (tableOrderStatus === 'ready' ||
      (areStartersReady && !areStartersServed) ||
      (areMainsReady && !areMainsServed) ||
      (areDessertsReady && !areDessertsServed))

  const isPendingValidation = !isAllDelivered && !hasAnyPhaseReadyToServe && tableOrderStatus === 'pending_validation'

  // Subtítulo contextual según qué fase está activa
  let dynamicSubtitle = t('orderPreparingSubtitle')
  if (hasAnyPhaseReadyToServe) {
    if (areStartersReady && !areStartersServed) {
      dynamicSubtitle = `El personal ya traslada tus entrantes a la Mesa #${tableNumber}.`
    } else if (areMainsReady && !areMainsServed) {
      dynamicSubtitle = `Tus platos principales marchan hacia la Mesa #${tableNumber}.`
    } else if (areDessertsReady && !areDessertsServed) {
      dynamicSubtitle = `Tus postres y cafés marchan hacia la Mesa #${tableNumber}.`
    } else {
      dynamicSubtitle = `El personal traslada tus platos a la Mesa #${tableNumber}.`
    }
  } else if (areStartersCooking) {
    dynamicSubtitle = 'Cocina está elaborando tus entrantes. Los platos principales se marcharán después.'
  } else if (hasMains && areStartersServed && !areMainsFired && !areMainsServed) {
    dynamicSubtitle = 'Tus entrantes ya están en la mesa. Cuando terminéis, el mozo marchará los platos principales.'
  } else if (areMainsCooking) {
    dynamicSubtitle = 'Cocina está elaborando tus platos principales al momento.'
  } else if (areDessertsCooking) {
    dynamicSubtitle = 'Elaborando tus postres y cafés para cerrar tu experiencia.'
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
              : isPendingValidation
              ? 'bg-slate-100 text-slate-700 border-slate-200'
              : 'bg-amber-100 text-amber-950 border-amber-300 animate-pulse'
          }`}>
            <span>🍺 Bebidas:</span>
            <span className="font-black">
              {areDrinksServed ? '✓ Servido en mesa' : isPendingValidation ? 'Esperando validación' : 'Preparando en barra'}
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
              : areStartersCooking || !isPendingValidation
              ? 'bg-amber-100 text-amber-950 border-amber-300 animate-pulse'
              : 'bg-slate-100 text-slate-700 border-slate-200'
          }`}>
            <span>🥗 1° Entradas:</span>
            <span className="font-black">
              {areStartersServed
                ? '✓ Entregado en mesa'
                : areStartersReady
                ? 'Listo para servir'
                : 'En preparación en cocina'}
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
              : hasStarters && !areMainsFired
              ? 'bg-slate-100 text-slate-600 border-slate-200'
              : 'bg-amber-100 text-amber-950 border-amber-300'
          }`}>
            <span>🍔 2° Principales:</span>
            <span className="font-black">
              {areMainsServed
                ? '✓ Entregado en mesa'
                : areMainsReady
                ? 'Listo para servir'
                : hasStarters && !areMainsFired
                ? 'En espera del 1° plato'
                : 'En preparación en cocina'}
            </span>
          </span>
        )}

        {/* 4. Postres */}
        {hasDesserts && (
          <span className={`px-2 py-0.5 rounded-lg border font-bold flex items-center gap-1 ${
            areDessertsServed
              ? 'bg-emerald-100 text-emerald-950 border-emerald-300'
              : areDessertsReady || areDessertsCooking
              ? 'bg-purple-100 text-purple-950 border-purple-300 animate-pulse'
              : hasChoicePending
              ? 'bg-purple-200 text-purple-950 border-purple-400 font-black animate-pulse'
              : 'bg-slate-100 text-slate-600 border-slate-200'
          }`}>
            <span>🍰 3° Postres:</span>
            <span className="font-black">
              {areDessertsServed
                ? '✓ Entregado en mesa'
                : areDessertsReady || areDessertsCooking
                ? 'Preparando postre'
                : 'Guardado para el final de la comida'}
            </span>
          </span>
        )}
      </div>
    )
  }

  return (
    <>
      {/* 1. Tracker de Fases de Cocina Activo (Bloque 4.2) */}
      {!isPaidActive && !hasRequestedBill && tableOrderStatus && tableOrders.length > 0 && (
        <div className="max-w-2xl mx-auto px-3.5 pt-3 w-full">
          {/* Estado A: Pendiente de Validación del Mozo */}
          {isPendingValidation && (
            <div
              onClick={onOpenTimelineModal}
              className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 shadow-xs cursor-pointer hover:bg-amber-100/70 transition-all animate-in fade-in space-y-2"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center flex-shrink-0 font-black shadow-xs">
                    <Clock className="w-4 h-4 animate-pulse" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 block">
                      {t('tableNumberLabel')} #{tableNumber}
                    </span>
                    <h4 className="text-xs font-extrabold text-amber-950 leading-tight">
                      ⏳ Comanda enviada · Pendiente de validación del mozo
                    </h4>
                  </div>
                </div>
                <div className="px-2.5 py-1 rounded-xl bg-white border border-amber-300 text-[11px] font-black text-amber-950 flex items-center gap-1 flex-shrink-0 shadow-xs">
                  <span>{t('viewPhases') || 'Ver fases'}</span>
                  <ChevronRight size={12} />
                </div>
              </div>
              <p className="text-[10px] text-amber-800 leading-snug">
                El mozo confirmará los platos y bebidas contigo en la Mesa #{tableNumber} antes de enviarlos a cocina.
              </p>
              {renderCourseProgressPills()}
            </div>
          )}

          {/* Estado B: Alguna fase lista en cocina saliendo hacia la mesa */}
          {hasAnyPhaseReadyToServe && (
            <div
              onClick={onOpenTimelineModal}
              className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-400/40 text-emerald-950 shadow-xs space-y-2 animate-glow-emerald ring-1 ring-emerald-400/60 cursor-pointer hover:bg-emerald-500/15 transition-all"
            >
              <div className="flex items-center justify-between gap-3">
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
                      🍽️ ¡Tus platos están saliendo a la mesa!
                    </h4>
                    <p className="text-[10px] text-emerald-800 mt-0.5 leading-snug">
                      {dynamicSubtitle}
                    </p>
                  </div>
                </div>
                <div className="px-2.5 py-1 rounded-xl bg-white border border-emerald-300 text-[11px] font-black text-emerald-950 flex items-center gap-1 flex-shrink-0 shadow-xs">
                  <span>{t('viewPhases') || 'Ver fases'}</span>
                  <ChevronRight size={12} />
                </div>
              </div>
              {renderCourseProgressPills()}
            </div>
          )}

          {/* Estado C: Validada y con fases en preparación o en espera */}
          {!isPendingValidation && !hasAnyPhaseReadyToServe && !isAllDelivered && (
            <div
              onClick={onOpenTimelineModal}
              className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-400/40 text-amber-950 hover:bg-amber-500/15 shadow-xs space-y-2 animate-in fade-in cursor-pointer transition-all"
            >
              <div className="flex items-center justify-between gap-3">
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
                      👨‍🍳 Comanda en curso · Cocina preparando tu pedido
                    </h4>
                    <p className="text-[10px] text-slate-600 mt-0.5 leading-snug">
                      {dynamicSubtitle}
                    </p>
                  </div>
                </div>
                <div className="px-2.5 py-1 rounded-xl bg-white border border-amber-300 text-amber-950 text-[11px] font-black flex items-center gap-1 flex-shrink-0 shadow-xs">
                  <span>{t('viewPhases') || 'Ver fases'}</span>
                  <ChevronRight size={12} />
                </div>
              </div>
              {renderCourseProgressPills()}
            </div>
          )}

          {/* Estado D: Todas las fases entregadas */}
          {isAllDelivered && (
            <div className="space-y-3 animate-in fade-in duration-300">
              <div
                onClick={onOpenTimelineModal}
                className="p-3.5 bg-emerald-50/90 text-slate-900 rounded-2xl border border-emerald-300 shadow-xs space-y-2.5 cursor-pointer hover:bg-emerald-50 transition-all"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 font-black shadow-2xs">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800">
                          {t('tableNumberLabel')} #{tableNumber}
                        </span>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      </div>
                      <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 leading-tight truncate">
                        ✅ ¡Pedido entregado en mesa! Que aproveche
                      </h4>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      onOpenTimelineModal()
                    }}
                    className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-[10px] font-bold border border-emerald-300 shadow-2xs transition-colors flex items-center gap-1 flex-shrink-0 cursor-pointer"
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
      {!isPaidActive && hasRequestedBill && (
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

      {/* 3. Vista cuando la mesa ya ha sido cobrada (Post-Payment / Fidelización / Google Maps) */}
      {isPaidActive && (
        <div className="max-w-2xl mx-auto px-3.5 pt-3 w-full animate-in fade-in duration-300">
          <PostPaymentView
            restaurant={restaurant}
            tableNumber={tableNumber}
            paidTotal={paidTotal}
            loyaltyProfile={loyaltyProfile}
            loyaltyMode={loyaltyMode}
            onOpenLoyaltyModal={onOpenLoyaltyModal}
            onClaimLoyaltyBonus={onClaimLoyaltyBonus}
            onResetTableSession={onResetTableSession}
            onLogout={onLogout}
          />
        </div>
      )}
    </>
  )
}
