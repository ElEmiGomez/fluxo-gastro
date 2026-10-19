'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { Clock, CheckCircle2, ChefHat, AlertTriangle, Utensils, Sparkles, Loader2, Layers, Lock, FileText } from 'lucide-react'
import { Order, OrderStatus } from '@/types/database.types'
import { getWaitingMinutes } from '@/lib/utils'
import {
  cleanItemNotes,
  sortItemsForKitchen,
  getItemCourse,
  orderHasFood,
  orderHasDesserts,
  orderHasHeldDesserts,
  orderHasActiveDesserts,
  isOrderFoodReady,
  isOrderDessertsReady,
  isDrinkServed,
  isDessertReady,
  isDessertFired,
  isDessertCooking,
  isDessertItem,
  isPackHeaderItem,
  isDessertPendingChoice,
  isStarterItem,
  isMainItem,
  isStarterReady,
  isStarterServed,
  isMainCooking,
  isMainReady,
  isMainServed,
  orderHasStarters,
  orderHasMains,
  areOrderStartersReady,
  areOrderStartersServed,
  areOrderMainsReady,
  areOrderMainsServed,
  areOrderMainsFired,
} from '@/lib/course-utils'

interface KitchenTicketProps {
  order?: Order
  orders?: Order[]
  isNew?: boolean
  isUpdating?: boolean
  updatingOrderIds?: Set<string>
  onUpdateStatus: (orderId: string, status: OrderStatus) => void
  onKitchenAction?: (
    orderId: string,
    action: 'ready_food' | 'ready_desserts' | 'fire_desserts' | 'ready_starters' | 'start_mains' | 'ready_mains' | 'start_desserts'
  ) => void
}

// Clock compartido para todos los KitchenTicket para coordinar el cálculo de minutos sin N intervals independientes
const tickListeners = new Set<() => void>()
let sharedInterval: NodeJS.Timeout | null = null

function subscribeKitchenTick(cb: () => void) {
  tickListeners.add(cb)
  if (!sharedInterval && typeof window !== 'undefined') {
    sharedInterval = setInterval(() => {
      tickListeners.forEach(fn => fn())
    }, 30000)
  }
  return () => {
    tickListeners.delete(cb)
    if (tickListeners.size === 0 && sharedInterval) {
      clearInterval(sharedInterval)
      sharedInterval = null
    }
  }
}

export function KitchenTicket({
  order,
  orders,
  isNew = false,
  isUpdating = false,
  updatingOrderIds,
  onUpdateStatus,
  onKitchenAction,
}: KitchenTicketProps) {
  // Unificar soporte para comanda individual o lista de comandas agrupadas por mesa (rondas)
  const effectiveOrders: Order[] = (orders && orders.length > 0)
    ? orders
    : (order ? [order] : [])

  const [completedItemIds, setCompletedItemIds] = useState<Record<string, boolean>>({})
  const [, setTick] = useState(0)

  // Suscripción al intervalo coordinado de 30s
  useEffect(() => {
    return subscribeKitchenTick(() => {
      setTick(t => t + 1)
    })
  }, [])

  const toggleItemCompleted = (itemId: string) => {
    setCompletedItemIds(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }))
  }

  const markItemsAsDone = (items: any[], roundIdx: number) => {
    setCompletedItemIds(prev => {
      const nextMap = { ...prev }
      items.forEach((item, idx) => {
        nextMap[item.id || `${item.product_id}-${roundIdx}-${idx}`] = true
      })
      return nextMap
    })
  }

  if (effectiveOrders.length === 0) {
    return null
  }

  // Invariante Zero-Flicker: La visibilidad de comandas depende exclusivamente de su status, NUNCA de order_items.length
  const validOrders = effectiveOrders

  const primaryOrder = validOrders[0]
  const tableNumberDisplay = primaryOrder.table?.table_number ?? primaryOrder.table_number ?? '?'

  // Tiempo transcurrido de la comanda más antigua del grupo para el semáforo de urgencia
  const oldestTime = Math.min(...validOrders.map(o => new Date(o.created_at).getTime()))
  const oldestMinutes = Math.floor((Date.now() - oldestTime) / 60000)

  const isAllReady = validOrders.every(o => o.status === 'ready')
  const hasMultipleRounds = validOrders.length > 1

  const getUrgencyStyles = () => {
    if (isAllReady) {
      return {
        cardBorder: 'border-emerald-400 shadow-emerald-100',
        headerBg: 'bg-emerald-50 text-emerald-950 border-b border-emerald-200',
        badge: 'bg-emerald-100 text-emerald-900 border-emerald-300',
        statusLabel: 'Listo para Servir',
        statusColor: 'text-emerald-700 font-bold',
        dotColor: 'bg-emerald-500',
        timerLabel: `Listo (hace ${oldestMinutes} min)`,
      }
    }
    if (oldestMinutes >= 20) {
      return {
        cardBorder: 'border-red-400 shadow-red-100 ring-2 ring-red-400/50',
        headerBg: 'bg-red-50 text-red-950 border-b border-red-200',
        badge: 'bg-red-100 text-red-900 border-red-300 animate-pulse',
        statusLabel: 'Demorado en Cocina',
        statusColor: 'text-red-700 font-bold',
        dotColor: 'bg-red-600 animate-ping',
        timerLabel: `⏱ Hace ${oldestMinutes} min (Urgente)`,
      }
    }
    if (oldestMinutes >= 10) {
      return {
        cardBorder: 'border-amber-300 shadow-amber-100',
        headerBg: 'bg-amber-50 text-amber-950 border-b border-amber-200',
        badge: 'bg-amber-100 text-amber-900 border-amber-300',
        statusLabel: 'En Marcha',
        statusColor: 'text-amber-700 font-bold',
        dotColor: 'bg-amber-500',
        timerLabel: `⏱ Hace ${oldestMinutes} min`,
      }
    }
    return {
      cardBorder: 'border-slate-200 shadow-slate-100',
      headerBg: 'bg-slate-50 text-slate-900 border-b border-slate-200',
      badge: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      statusLabel: 'A Tiempo',
      statusColor: 'text-slate-600 font-bold',
      dotColor: 'bg-emerald-500',
      timerLabel: oldestMinutes > 0 ? `⏱ Hace ${oldestMinutes} min` : '⏱ Hace < 1 min',
    }
  }

  const urgency = getUrgencyStyles()

  return (
    <div
      className={`rounded-3xl border-2 overflow-hidden shadow-md bg-white flex flex-col smooth-spring hover:translate-y-[-2px] transition-all duration-300 animate-in fade-in zoom-in-95 ${urgency.cardBorder} ${
        isNew ? 'ring-4 ring-blue-400/50 scale-[1.02]' : ''
      }`}
    >
      {/* Header Unificado por Mesa */}
      <div className={`p-4 flex items-center justify-between ${urgency.headerBg}`}>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white border border-slate-300 flex flex-col items-center justify-center shadow-sm">
            <span className="text-[9px] uppercase font-bold tracking-widest text-slate-500 leading-none">Mesa</span>
            <span className="font-black text-xl text-slate-900 leading-tight">#{tableNumberDisplay}</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-slate-900 text-base tracking-tight">
                Mesa {tableNumberDisplay}
              </span>
              {hasMultipleRounds && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-900 text-white uppercase tracking-wider shadow-sm flex items-center gap-1">
                  <Layers size={11} />
                  <span>{validOrders.length} Rondas</span>
                </span>
              )}
              {isNew && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-slate-950 uppercase tracking-wider shadow-sm animate-pulse ring-2 ring-amber-300/60">
                  NUEVO
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`w-2 h-2 rounded-full ${urgency.dotColor} flex-shrink-0`} />
              <span className={`text-xs block ${urgency.statusColor}`}>
                {urgency.statusLabel} &middot; <span className="text-[11px] font-medium text-slate-500">
                  {validOrders.length === 1
                    ? new Date(primaryOrder.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : `${validOrders.length} comandas en mesa`}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Cronómetro con Semáforo */}
        <div className={`px-3 py-1.5 rounded-xl border text-xs font-black flex items-center gap-1.5 shadow-sm ${urgency.badge}`}>
          <Clock className="w-3.5 h-3.5" />
          <span>{urgency.timerLabel}</span>
        </div>
      </div>

      {/* Rondas Cronológicas de la Mesa */}
      <div className="flex-1 bg-[#fafbfc] divide-y divide-slate-200/90">
        {validOrders.map((roundOrder, roundIdx) => {
          const roundMinutes = getWaitingMinutes(roundOrder.created_at)
          const isRoundUpdating = Boolean(
            updatingOrderIds?.has(roundOrder.id) ||
            (isUpdating && roundOrder.id === primaryOrder.id)
          )

          const roundTimeFormatted = roundOrder.created_at
            ? new Date(roundOrder.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : '--:--'

          // Regla de Oro Cocina: 0% BEBIDAS (barra/mozo) y 0% CABECERAS DE PACK (se cocinan los platos reales desglosados)
          const allRoundItems = roundOrder.order_items || []
          const kitchenItems = allRoundItems.filter(item => getItemCourse(item) !== 'drink' && !isPackHeaderItem(item))
          const starters = kitchenItems.filter(item => isStarterItem(item))
          const mains = kitchenItems.filter(item => isMainItem(item))
          const desserts = kitchenItems.filter(item => isDessertItem(item))

          const hasStarters = starters.length > 0
          const hasMains = mains.length > 0
          const startersReady = areOrderStartersReady(roundOrder)
          const startersServed = areOrderStartersServed(roundOrder)
          const mainsCooking = (roundOrder.order_items || []).filter(isMainItem).some(isMainCooking)
          const mainsReady = areOrderMainsReady(roundOrder)
          const mainsServed = areOrderMainsServed(roundOrder)

          // Bloqueo de principales si hay entradas y aún no están listas O el mozo no ha marchado los principales
          const mainsFired = areOrderMainsFired(roundOrder)
          const areMainsLocked = hasStarters && (!startersReady || !mainsFired)

          const dessertsHeld = orderHasHeldDesserts(roundOrder)
          const dessertsActive = orderHasActiveDesserts(roundOrder) || !orderHasFood(roundOrder)

          const renderItemCard = (item: any, idx: number, isHeldItem: boolean, lockLabel?: string) => {
            const prod = item.product || (item as any).products
            const productName = prod?.name || `Plato #${item.product_id?.substring?.(0, 6) || idx + 1}`
            const imageUrl = prod?.image_url
            const itemKey = item.id || `${item.product_id}-${roundIdx}-${idx}`
            const isDone = Boolean(completedItemIds[itemKey])
            const courseType = getItemCourse(item)
            const isRoundPending = ['pending', 'confirmed', 'pending_validation'].includes(roundOrder.status)
            const isStarter = isStarterItem(item) || courseType === 'first'
            const isMain = isMainItem(item) || courseType === 'second'
            const isDessert = isDessertItem(item) || courseType === 'dessert'

            // Comprobar estrictamente si la preparación específica de este plato ya fue iniciada
            let isItemCookingOrReady = false
            let disabledReason = ''

            if (isRoundPending) {
              isItemCookingOrReady = false
              disabledReason = 'Inicia la preparación en cocina para poder tachar platos'
            } else if (isHeldItem) {
              isItemCookingOrReady = false
              disabledReason = lockLabel || 'Plato retenido en espera de pase'
            } else if (isStarter) {
              isItemCookingOrReady = roundOrder.status === 'preparing' || roundOrder.status === 'ready'
              disabledReason = 'Inicia la preparación de entradas para poder tacharlas'
            } else if (isMain) {
              if (hasStarters) {
                isItemCookingOrReady = mainsCooking || areOrderMainsReady(roundOrder) || areOrderMainsServed(roundOrder)
                disabledReason = 'Inicia la preparación de los platos principales para poder tacharlos'
              } else {
                isItemCookingOrReady = roundOrder.status === 'preparing' || roundOrder.status === 'ready'
                disabledReason = 'Inicia la preparación en cocina para poder tachar platos'
              }
            } else if (isDessert) {
              isItemCookingOrReady = isDessertCooking(item) || isDessertReady(item)
              disabledReason = 'Inicia la preparación del postre en cocina para poder tacharlo'
            } else {
              isItemCookingOrReady = roundOrder.status === 'preparing' || roundOrder.status === 'ready'
              disabledReason = 'Inicia la preparación para poder tachar platos'
            }

            const canClick = isItemCookingOrReady && !isHeldItem
            const cleanedNotes = cleanItemNotes(item.notes)

            return (
              <div
                key={itemKey}
                onClick={canClick ? () => toggleItemCompleted(itemKey) : undefined}
                className={`p-2.5 rounded-2xl border transition-all duration-200 select-none flex gap-3 items-start ${
                  !canClick
                    ? 'bg-slate-100/70 border-dashed border-slate-300 opacity-60 cursor-not-allowed'
                    : isDone
                    ? 'bg-emerald-50/70 border-emerald-300 opacity-60 cursor-pointer'
                    : 'bg-white border-slate-200/90 hover:border-slate-300 shadow-xs cursor-pointer'
                }`}
                title={
                  !canClick
                    ? disabledReason
                    : isDone
                    ? 'Plato tachado como listo'
                    : 'Toca para tachar este plato'
                }
              >
                {/* Miniatura visual del plato */}
                <div
                  style={{ position: 'relative', width: '56px', height: '56px', minWidth: '56px', minHeight: '56px', overflow: 'hidden', borderRadius: '12px' }}
                  className="bg-white border border-slate-200 shadow-xs flex-shrink-0"
                >
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt={productName}
                      fill
                      className="object-cover"
                      sizes="60px"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400">
                      <Utensils className="w-5 h-5 stroke-[1.2]" />
                    </div>
                  )}
                  {/* Badge de Cantidad */}
                  <div className="absolute top-0.5 left-0.5 px-1.5 py-0.2 rounded-md text-[11px] font-black text-white bg-blue-900 shadow-md">
                    {item.quantity}x
                  </div>
                </div>

                {/* Detalle */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1.5">
                    <h4 className={`font-extrabold text-xs sm:text-sm leading-snug ${
                      isDone ? 'text-emerald-900 line-through' : 'text-slate-900'
                    }`}>
                      {productName}
                    </h4>
                    {isDone && (
                      <span className="px-1.5 py-0.2 rounded-md bg-emerald-600 text-white text-[9px] font-black uppercase tracking-wider flex items-center gap-0.5 flex-shrink-0">
                        <CheckCircle2 size={10} />
                        <span>Listo</span>
                      </span>
                    )}
                    {isHeldItem && (
                      <span className="px-1.5 py-0.2 rounded-md bg-slate-200 text-slate-700 text-[9px] font-black uppercase tracking-wider flex items-center gap-1 flex-shrink-0">
                        <Lock size={10} />
                        <span>{lockLabel || 'En Espera'}</span>
                      </span>
                    )}
                  </div>

                  {/* Badges de Pase de Cocina, Cortesía y Peso */}
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    {courseType === 'first' && (
                      <span className="px-1.5 py-0.2 rounded-md bg-emerald-100 text-emerald-950 font-black text-[9px] border border-emerald-300 flex items-center gap-1">
                        <span>🥗 1º ENTRADA</span>
                      </span>
                    )}
                    {courseType === 'second' && (
                      <span className="px-1.5 py-0.2 rounded-md bg-blue-100 text-blue-950 font-black text-[9px] border border-blue-300 flex items-center gap-1">
                        <span>🍔 2º PRINCIPAL</span>
                      </span>
                    )}
                    {courseType === 'dessert' && (
                      <span className={`px-1.5 py-0.2 rounded-md font-black text-[9px] border flex items-center gap-1 ${
                        isDessertReady(item)
                          ? 'bg-emerald-100 text-emerald-950 border-emerald-300'
                          : isHeldItem
                          ? 'bg-slate-200 text-slate-800 border-slate-300'
                          : 'bg-purple-100 text-purple-950 border-purple-300'
                      }`}>
                        <span>🍰 {isDessertReady(item) ? 'POSTRE (LISTO)' : isHeldItem ? 'POSTRE (ESPERANDO PASE)' : 'POSTRE (MARCHADO)'}</span>
                      </span>
                    )}
                    {isDessertPendingChoice(item) && (
                      <span className="px-1.5 py-0.2 rounded-md bg-amber-100 text-amber-950 font-black text-[9px] border border-amber-300 flex items-center gap-1">
                        <span>⏳ ELECCIÓN PENDIENTE DE COMENSAL</span>
                      </span>
                    )}
                    {Boolean(item.loyalty_points_redeemed || (item.notes && item.notes.includes('[🎁 Canje Fidelización'))) ? (
                      <span className="px-1.5 py-0.2 rounded-md bg-amber-600 text-white font-black text-[9px] shadow-xs flex items-center gap-1">
                        <span>⭐ CANJE FIDELIZACIÓN</span>
                        {item.loyalty_points_redeemed ? <span>(-{item.loyalty_points_redeemed} pts)</span> : null}
                      </span>
                    ) : (item.is_pack_component || (item.notes && (item.notes.includes('[Incluido en Menú') || item.notes.includes('[Incluido en Promo') || item.notes.includes('[Menú del Día') || item.notes.includes('[Promo Pareja')))) ? (
                      <span className="px-1.5 py-0.2 rounded-md bg-indigo-100 text-indigo-950 font-black text-[9px] border border-indigo-300">
                        🍽️ PACK INCLUIDO
                      </span>
                    ) : item.is_complimentary ? (
                      <span className="px-1.5 py-0.2 rounded-md bg-purple-600 text-white font-black text-[9px] shadow-xs">
                        🎁 CORTESÍA / INVITA CASA
                      </span>
                    ) : null}
                    {item.weight_grams && (
                      <span className="px-1.5 py-0.2 rounded-md bg-blue-100 text-blue-950 font-black text-[9px] border border-blue-200">
                        ⚖️ {item.weight_grams}g
                      </span>
                    )}
                  </div>

                  {/* Aclaración especial (sin etiquetas técnicas del sistema) */}
                  {cleanedNotes !== '' && (
                    <div className={`mt-1.5 p-2 rounded-xl border text-xs shadow-xs flex items-start gap-1.5 ${
                      isDone
                        ? 'bg-emerald-100/50 border-emerald-200 text-emerald-900'
                        : /alerg|celiac|intoleran|sin gluten/i.test(cleanedNotes)
                        ? 'bg-red-50 border-red-200 text-red-900'
                        : 'bg-amber-50/80 border-amber-200 text-amber-950'
                    }`}>
                      {/alerg|celiac|intoleran|sin gluten/i.test(cleanedNotes) ? (
                        <AlertTriangle className="w-3.5 h-3.5 text-red-600 flex-shrink-0 mt-0.5" />
                      ) : (
                        <FileText className="w-3.5 h-3.5 text-amber-700 flex-shrink-0 mt-0.5" />
                      )}
                      <div className="min-w-0">
                        <span className={`font-bold uppercase tracking-wider text-[9px] block leading-none ${
                          /alerg|celiac|intoleran|sin gluten/i.test(cleanedNotes) ? 'text-red-600' : 'text-amber-800'
                        }`}>
                          {/alerg|celiac|intoleran|sin gluten/i.test(cleanedNotes) ? 'Alerta Alérgeno:' : 'Nota / Punto de cocción:'}
                        </span>
                        <p className="font-extrabold text-xs leading-tight mt-0.5 text-slate-900">
                          {cleanedNotes}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          }

          return (
            <div key={roundOrder.id} className="p-3.5 sm:p-4 space-y-3">
              {/* Encabezado de Ronda */}
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/60">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-lg bg-slate-900 text-white font-black text-[11px] uppercase tracking-wide">
                    {hasMultipleRounds ? `Ronda ${roundIdx + 1}` : 'Comanda'}
                  </span>
                  <span className="text-[11px] font-bold text-slate-500">
                    ⏱ Hace {roundMinutes} min ({roundTimeFormatted})
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${
                    roundOrder.status === 'ready'
                      ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                      : roundOrder.status === 'preparing'
                      ? 'bg-amber-100 text-amber-950 border-amber-300'
                      : 'bg-slate-100 text-slate-800 border-slate-300'
                  }`}>
                    {roundOrder.status === 'ready'
                      ? 'Listo para Servir'
                      : roundOrder.status === 'preparing'
                      ? 'En Preparación'
                      : 'Pendiente'}
                  </span>
                </div>
              </div>

              {/* BLOQUES ESTRUCTURADOS EN COCINA: ENTRADAS (PASE 1), PRINCIPALES (PASE 2) Y POSTRES */}
              <div className="space-y-3">
                {kitchenItems.length > 0 ? (
                  <>
                    {/* Bloque 1: Entradas */}
                    {hasStarters && (
                      startersReady ? (
                        <div className="px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <CheckCircle2 size={13} className="text-emerald-600" />
                            <span>1º Entradas listas ({starters.length} platos)</span>
                          </span>
                          <span className="text-[10px] font-black uppercase bg-emerald-100 px-2 py-0.5 rounded-md text-emerald-800">
                            Pase 1 Completado
                          </span>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-[11px] font-black uppercase text-amber-900 tracking-wider">
                            <span>🥗 1º Entradas ({starters.length})</span>
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-md">
                              Pase 1
                            </span>
                          </div>
                          {starters.map((item, idx) => renderItemCard(item, idx, false))}
                        </div>
                      )
                    )}

                    {/* Bloque 2: Platos Principales */}
                    {hasMains && (
                      areMainsLocked ? (
                        <div className="space-y-2 p-2.5 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200">
                          <div className="flex items-center justify-between text-[11px] font-black uppercase text-slate-500 tracking-wider">
                            <span className="flex items-center gap-1.5">
                              <Lock size={13} className="text-slate-400" />
                              <span>🍔 2º Principales ({mains.length})</span>
                            </span>
                            <span className="text-[9px] font-black bg-slate-200 text-slate-600 px-2 py-0.5 rounded-md">
                              {!startersReady ? 'En espera del 1º plato' : 'En espera del mozo'}
                            </span>
                          </div>
                          {mains.map((item, idx) =>
                            renderItemCard(
                              item,
                              idx + starters.length,
                              true,
                              !startersReady ? 'En espera del 1º plato' : 'En espera del mozo'
                            )
                          )}
                        </div>
                      ) : mainsReady ? (
                        <div className="px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <CheckCircle2 size={13} className="text-emerald-600" />
                            <span>2º Principales listos ({mains.length} platos)</span>
                          </span>
                          <span className="text-[10px] font-black uppercase bg-emerald-100 px-2 py-0.5 rounded-md text-emerald-800">
                            Pase 2 Completado
                          </span>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-[11px] font-black uppercase text-blue-900 tracking-wider">
                            <span>🍔 2º Principales ({mains.length})</span>
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                              mainsCooking ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-blue-100 text-blue-900'
                            }`}>
                              {mainsCooking ? '🔥 En Marcha' : 'Pase 2'}
                            </span>
                          </div>
                          {mains.map((item, idx) =>
                            renderItemCard(item, idx + starters.length, false)
                          )}
                        </div>
                      )
                    )}

                    {/* Bloque 3: Postres */}
                    {desserts.length > 0 && (
                      dessertsHeld ? (
                        <div className="p-2.5 rounded-2xl bg-purple-50/60 border border-dashed border-purple-200 text-purple-900 text-xs flex items-center justify-between">
                          <span className="flex items-center gap-1.5 font-bold">
                            <Lock size={12} className="text-purple-400" />
                            <span>🍰 Postres ({desserts.length}) en espera del mozo</span>
                          </span>
                          <span className="text-[9px] font-black uppercase bg-purple-100 text-purple-800 px-2 py-0.5 rounded-md">
                            Tras los principales
                          </span>
                        </div>
                      ) : (
                        <div className={`space-y-2 ${(hasStarters || hasMains) ? 'pt-2.5 border-t border-slate-200/80' : ''}`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-[11px] font-black uppercase text-purple-900 tracking-wider">
                              <span>🍰 Postres ({desserts.length})</span>
                            </div>
                            {dessertsActive && !isOrderDessertsReady(roundOrder) && (
                              <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-purple-100 text-purple-900 border border-purple-200 flex items-center gap-1">
                                <Sparkles size={10} />
                                <span>Marchados por el mozo · En preparación</span>
                              </span>
                            )}
                          </div>
                          {desserts.map((item, idx) => renderItemCard(item, idx + starters.length + mains.length, false))}
                        </div>
                      )
                    )}
                  </>
                ) : (
                  <div className="py-2.5 px-3 rounded-xl bg-amber-50/80 border border-amber-200/80 text-amber-900 text-xs flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600 flex-shrink-0" />
                    <span className="font-semibold">Preparando comanda · Cargando detalle de platos...</span>
                  </div>
                )}
              </div>

              {/* Botón de Transición Táctil Único / Secuencial para esta Ronda */}
              <div className="pt-2">
                {(roundOrder.status === 'pending' || roundOrder.status === 'confirmed') && (
                  <button
                    onClick={() => {
                      if (!hasStarters && !hasMains && desserts.length > 0 && onKitchenAction) {
                        onKitchenAction(roundOrder.id, 'start_desserts')
                      } else {
                        onUpdateStatus(roundOrder.id, 'preparing')
                      }
                    }}
                    disabled={isRoundUpdating}
                    className="w-full h-14 py-3 px-4 rounded-2xl font-black text-xs sm:text-sm bg-amber-500 hover:bg-amber-400 disabled:opacity-60 disabled:cursor-not-allowed text-slate-950 flex items-center justify-center gap-2.5 shadow-md hover:shadow-amber-500/20 active:scale-95 transition-all uppercase tracking-wide border-2 border-amber-600/30 cursor-pointer"
                  >
                    {isRoundUpdating ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>INICIANDO...</span>
                      </>
                    ) : (
                      <>
                        <ChefHat className="w-5 h-5 stroke-[2.5]" />
                        <span>1. INICIAR PREPARACIÓN {hasMultipleRounds ? `(RONDA ${roundIdx + 1})` : ''}</span>
                      </>
                    )}
                  </button>
                )}

                {(roundOrder.status === 'preparing' || roundOrder.status === 'ready') && (() => {
                  // Caso 1: Hay entradas y aún no están listas
                  if (hasStarters && !startersReady) {
                    return (
                      <button
                        onClick={() => {
                          markItemsAsDone(starters, roundIdx)
                          if (onKitchenAction) onKitchenAction(roundOrder.id, 'ready_starters')
                          else onUpdateStatus(roundOrder.id, 'ready')
                        }}
                        disabled={isRoundUpdating}
                        className="w-full h-14 py-3 px-4 rounded-2xl font-black text-xs sm:text-sm bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed text-white flex items-center justify-center gap-2.5 shadow-md active:scale-95 transition-all uppercase tracking-wide border-2 border-emerald-700/30 cursor-pointer"
                      >
                        {isRoundUpdating ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>AVISANDO AL MOZO...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                            <span>🥗 AVISAR AL MOZO (ENTRADAS LISTAS · PASE 1)</span>
                          </>
                        )}
                      </button>
                    )
                  }

                  // Caso 2: Entradas listas (o no había entradas) y hay principales pendientes
                  if (hasMains && !mainsReady) {
                    if (areMainsLocked) {
                      return (
                        <div className="w-full h-14 py-3 px-4 rounded-2xl bg-slate-100 border-2 border-dashed border-slate-200 text-slate-600 text-xs sm:text-sm font-black flex items-center justify-center gap-2 select-none uppercase tracking-wide">
                          <Lock size={16} className="text-slate-400 flex-shrink-0" />
                          <span>2º PRINCIPALES EN ESPERA DE MARCHA POR EL MOZO</span>
                        </div>
                      )
                    }

                    if (!mainsCooking) {
                      return (
                        <button
                          onClick={() => {
                            if (onKitchenAction) onKitchenAction(roundOrder.id, 'start_mains')
                            else onUpdateStatus(roundOrder.id, 'preparing')
                          }}
                          disabled={isRoundUpdating}
                          className="w-full h-14 py-3 px-4 rounded-2xl font-black text-xs sm:text-sm bg-amber-500 hover:bg-amber-400 disabled:opacity-60 disabled:cursor-not-allowed text-slate-950 flex items-center justify-center gap-2.5 shadow-md active:scale-95 transition-all uppercase tracking-wide border-2 border-amber-600/30 cursor-pointer"
                        >
                          {isRoundUpdating ? (
                            <>
                              <Loader2 className="w-5 h-5 animate-spin" />
                              <span>INICIANDO...</span>
                            </>
                          ) : (
                            <>
                              <ChefHat className="w-5 h-5 stroke-[2.5]" />
                              <span>🍔 INICIAR PRINCIPALES {hasStarters ? '(PASE 2)' : ''}</span>
                            </>
                          )}
                        </button>
                      )
                    }

                    return (
                      <button
                        onClick={() => {
                          markItemsAsDone(mains, roundIdx)
                          if (onKitchenAction) onKitchenAction(roundOrder.id, 'ready_mains')
                          else onUpdateStatus(roundOrder.id, 'ready')
                        }}
                        disabled={isRoundUpdating}
                        className="w-full h-14 py-3 px-4 rounded-2xl font-black text-xs sm:text-sm bg-amber-500 hover:bg-amber-400 disabled:opacity-60 disabled:cursor-not-allowed text-slate-950 flex items-center justify-center gap-2.5 shadow-md active:scale-95 transition-all uppercase tracking-wide border-2 border-amber-600/30 cursor-pointer"
                      >
                        {isRoundUpdating ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>AVISANDO AL MOZO...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                            <span>🍔 AVISAR AL MOZO (PRINCIPALES LISTOS)</span>
                          </>
                        )}
                      </button>
                    )
                  }

                  // Caso 3: Postres marchados por el mozo (o comanda de solo postres)
                  if (desserts.length > 0 && (dessertsActive || !orderHasFood(roundOrder)) && !isOrderDessertsReady(roundOrder)) {
                    const dessertsCooking = desserts.some(isDessertCooking)
                    if (!dessertsCooking) {
                      return (
                        <button
                          onClick={() => {
                            if (onKitchenAction) onKitchenAction(roundOrder.id, 'start_desserts')
                            else onUpdateStatus(roundOrder.id, 'preparing')
                          }}
                          disabled={isRoundUpdating}
                          className="w-full h-14 py-3 px-4 rounded-2xl font-black text-xs sm:text-sm bg-purple-600 hover:bg-purple-500 disabled:opacity-60 disabled:cursor-not-allowed text-white flex items-center justify-center gap-2.5 shadow-md active:scale-95 transition-all uppercase tracking-wide border-2 border-purple-700/30 cursor-pointer"
                        >
                          {isRoundUpdating ? (
                            <>
                              <Loader2 className="w-5 h-5 animate-spin" />
                              <span>INICIANDO...</span>
                            </>
                          ) : (
                            <>
                              <ChefHat className="w-5 h-5 stroke-[2.5]" />
                              <span>🍰 1. INICIAR PREPARACIÓN DE POSTRES</span>
                            </>
                          )}
                        </button>
                      )
                    }

                    return (
                      <button
                        onClick={() => {
                          markItemsAsDone(desserts, roundIdx)
                          if (onKitchenAction) onKitchenAction(roundOrder.id, 'ready_desserts')
                          else onUpdateStatus(roundOrder.id, 'ready')
                        }}
                        disabled={isRoundUpdating}
                        className="w-full h-14 py-3 px-4 rounded-2xl font-black text-xs sm:text-sm bg-purple-600 hover:bg-purple-500 disabled:opacity-60 disabled:cursor-not-allowed text-white flex items-center justify-center gap-2.5 shadow-md active:scale-95 transition-all uppercase tracking-wide border-2 border-purple-700/30 cursor-pointer"
                      >
                        {isRoundUpdating ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>AVISANDO AL MOZO...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-5 h-5" />
                            <span>🍰 2. AVISAR AL MOZO (POSTRES LISTOS)</span>
                          </>
                        )}
                      </button>
                    )
                  }

                  // Caso 4: Todo lo activo de la comanda está listo y en espera de entrega por el mozo
                  if (roundOrder.status === 'ready') {
                    return (
                      <button
                        onClick={() => onUpdateStatus(roundOrder.id, 'delivered')}
                        disabled={isRoundUpdating}
                        className="w-full h-14 py-3 px-4 rounded-2xl font-black text-xs sm:text-sm bg-blue-900 hover:bg-blue-800 disabled:opacity-60 disabled:cursor-not-allowed text-white flex items-center justify-center gap-2.5 shadow-md active:scale-95 transition-all uppercase tracking-wide border-2 border-blue-950/30 cursor-pointer"
                      >
                        {isRoundUpdating ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>DESPACHANDO...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-5 h-5" />
                            <span>MARCAR ENTREGADO EN SALA</span>
                          </>
                        )}
                      </button>
                    )
                  }

                  return null
                })()}

                {roundOrder.status === 'delivered' && (() => {
                  const hasDesserts = orderHasDesserts(roundOrder)
                  const dessertsReady = isOrderDessertsReady(roundOrder)
                  const dessertsFired = (roundOrder.order_items || []).some(it => isDessertItem(it) && isDessertFired(it))

                  if (hasDesserts && !dessertsReady) {
                    return (
                      <div className="space-y-2">
                        <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-950 text-xs font-bold flex items-center justify-between">
                          <span>Comida servida en mesa</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-extrabold ${dessertsFired ? 'bg-amber-200 text-amber-900' : 'bg-purple-200 text-purple-900'}`}>
                            {dessertsFired ? '🍰 Postres Marchados' : 'Postres en Espera'}
                          </span>
                        </div>
                        {dessertsFired ? (
                          (() => {
                            const dessertsCooking = (roundOrder.order_items || []).filter(isDessertItem).some(isDessertCooking)
                            if (!dessertsCooking) {
                              return (
                                <button
                                  onClick={() => onKitchenAction ? onKitchenAction(roundOrder.id, 'start_desserts') : onUpdateStatus(roundOrder.id, 'preparing')}
                                  disabled={isRoundUpdating}
                                  className="w-full h-14 py-3 px-4 rounded-2xl font-black text-xs sm:text-sm bg-purple-600 hover:bg-purple-500 disabled:opacity-60 disabled:cursor-not-allowed text-white flex items-center justify-center gap-2.5 shadow-md active:scale-95 transition-all uppercase tracking-wide border-2 border-purple-700/30 cursor-pointer"
                                >
                                  {isRoundUpdating ? (
                                    <>
                                      <Loader2 className="w-5 h-5 animate-spin" />
                                      <span>INICIANDO...</span>
                                    </>
                                  ) : (
                                    <>
                                      <ChefHat className="w-5 h-5 stroke-[2.5]" />
                                      <span>🍰 1. INICIAR PREPARACIÓN DE POSTRES</span>
                                    </>
                                  )}
                                </button>
                              )
                            }

                            return (
                              <button
                                onClick={() => onKitchenAction ? onKitchenAction(roundOrder.id, 'ready_desserts') : onUpdateStatus(roundOrder.id, 'ready')}
                                disabled={isRoundUpdating}
                                className="w-full h-14 py-3 px-4 rounded-2xl font-black text-xs sm:text-sm bg-purple-600 hover:bg-purple-500 disabled:opacity-60 disabled:cursor-not-allowed text-white flex items-center justify-center gap-2.5 shadow-md active:scale-95 transition-all uppercase tracking-wide border-2 border-purple-700/30 cursor-pointer"
                              >
                                {isRoundUpdating ? (
                                  <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>AVISANDO AL MOZO...</span>
                                  </>
                                ) : (
                                  <>
                                    <Sparkles className="w-5 h-5" />
                                    <span>🍰 2. AVISAR AL MOZO (POSTRES LISTOS)</span>
                                  </>
                                )}
                              </button>
                            )
                          })()
                        ) : (
                          <div className="w-full h-14 py-3 px-4 rounded-2xl bg-purple-50/60 border-2 border-dashed border-purple-200 text-purple-900 text-xs sm:text-sm font-black flex items-center justify-center gap-2 select-none uppercase tracking-wide">
                            <Lock size={16} className="text-purple-400 flex-shrink-0" />
                            <span>🍰 POSTRES EN ESPERA DE MARCHA POR EL MOZO</span>
                          </div>
                        )}
                      </div>
                    )
                  }
                  return null
                })()}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
