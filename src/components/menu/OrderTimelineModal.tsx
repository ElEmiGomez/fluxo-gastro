'use client'

import React from 'react'
import { X, CheckCircle2, Clock, Flame, Sparkles, UtensilsCrossed, Bell, Receipt, Layers } from 'lucide-react'
import { Order, OrderStatus } from '@/types/database.types'
import { formatCurrency, getWaitingMinutes } from '@/lib/utils'
import {
  cleanItemNotes,
  stripInternalStationTags,
  getItemCourse,
  isDrinkServed,
  isDessertReady,
  isDessertServed,
  isDessertFired,
  isDessertCooking,
  isFoodReady,
  isStarterItem,
  isStarterReady,
  isStarterServed,
  isMainItem,
  isMainCooking,
  isMainReady,
  isMainServed,
  isDrinkItem,
  isDessertItem,
  orderHasStarters,
  areOrderStartersReady,
  areOrderStartersServed,
  areOrderMainsReady,
  areOrderMainsServed,
  areOrderDessertsServed,
  areOrderMainsFired,
  orderHasActiveDesserts,
  ordersHavePendingDesserts,
  resolveCatalogProductForItem,
  isGenericProductName,
} from '@/lib/course-utils'

interface OrderTimelineModalProps {
  isOpen: boolean
  onClose: () => void
  tableNumber: string | null
  status: OrderStatus | null
  orders?: Order[]
  onCallWaiter?: () => void
  onRequestService?: () => void
  onRequestBill?: () => void
}

function getItemRealName(item: any, fallback: string): string {
  const prod = item?.product || item?.products
  const rawName = prod?.name || item?.name
  if (rawName && !isGenericProductName(rawName)) {
    return rawName
  }
  const catalogProd = resolveCatalogProductForItem(item)
  if (catalogProd?.name) {
    return catalogProd.name
  }
  return rawName || fallback
}

export function OrderTimelineModal({
  isOpen,
  onClose,
  tableNumber,
  status,
  orders = [],
  onCallWaiter,
  onRequestService,
  onRequestBill,
}: OrderTimelineModalProps) {
  if (!isOpen || !status) return null

  // Agrupar ítems activos de todas las comandas de la mesa con su orden padre y respaldo de caché local
  const entriesWithOrder: { order: Order; item: any }[] = []
  orders.forEach(o => {
    let items = o.order_items || []
    if (items.length === 0 && typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(`fluxo_order_items_${o.id}`)
        if (stored) {
          const parsed = JSON.parse(stored)
          if (Array.isArray(parsed) && parsed.length > 0) items = parsed
        }
      } catch (_) {}
    }
    items.forEach(it => {
      entriesWithOrder.push({ order: o, item: it })
    })
  })

  const drinkEntries = entriesWithOrder.filter(e => isDrinkItem(e.item))
  const starterEntries = entriesWithOrder.filter(e => isStarterItem(e.item))
  const mainEntries = entriesWithOrder.filter(e => isMainItem(e.item))
  const dessertEntries = entriesWithOrder.filter(e => isDessertItem(e.item))

  const hasDrinks = drinkEntries.length > 0
  const hasStarters = starterEntries.length > 0
  const hasMains = mainEntries.length > 0
  const hasDesserts = dessertEntries.length > 0

  // 1. Estado Validación del Mozo
  const isValidating = orders.some(o => o.status === 'pending_validation')

  // 2. Estado Bebidas de Barra
  const areAllDrinksServed =
    hasDrinks &&
    drinkEntries.every(e => isDrinkServed(e.item, e.order) || e.order.status === 'delivered')

  // 3. Estado 1° Entradas
  const areAllStartersServed =
    hasStarters &&
    starterEntries.every(e => isStarterServed(e.item, e.order) || areOrderStartersServed(e.order))
  const areAnyStartersReady =
    hasStarters &&
    !areAllStartersServed &&
    starterEntries.some(e => isStarterReady(e.item, e.order) || areOrderStartersReady(e.order))

  // 4. Estado 2° Platos Principales
  const areAllMainsServed =
    hasMains &&
    mainEntries.every(e => isMainServed(e.item, e.order) || areOrderMainsServed(e.order))
  const areAnyMainsReady =
    hasMains &&
    !areAllMainsServed &&
    mainEntries.some(e => isMainReady(e.item, e.order) || areOrderMainsReady(e.order))
  const areAnyMainsCookingOrFired =
    hasMains &&
    !areAllMainsServed &&
    !areAnyMainsReady &&
    mainEntries.some(
      e =>
        isMainCooking(e.item, e.order) ||
        areOrderMainsFired(e.order) ||
        (!orderHasStarters(e.order) && e.order.status !== 'pending_validation')
    )

  // 5. Estado 3° Postres y Café
  const areAllDessertsServed =
    hasDesserts &&
    dessertEntries.every(e => isDessertServed(e.item, e.order) || areOrderDessertsServed(e.order))
  const areAnyDessertsActiveOrReady =
    hasDesserts &&
    !areAllDessertsServed &&
    dessertEntries.some(
      e =>
        isDessertReady(e.item, e.order) ||
        isDessertCooking(e.item, e.order) ||
        isDessertFired(e.item, e.order) ||
        orderHasActiveDesserts(e.order) ||
        (!hasStarters && !hasMains && e.order.status === 'preparing')
    )

  const hasPendingDesserts = ordersHavePendingDesserts(orders)

  // Ordenar comandas activas cronológicamente (Ronda 1 la primera, Ronda 2 posterior)
  const chronologicalOrders = [...orders].sort(
    (a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()
  )

  const grandTotal = chronologicalOrders.reduce(
    (sum, o) => sum + (Number(o.total_amount) || 0),
    0
  )

  const getRoundStatusLabel = (roundStatus: OrderStatus) => {
    switch (roundStatus) {
      case 'pending_validation':
        return { label: 'Validando', color: 'bg-amber-100 text-amber-900 border-amber-300' }
      case 'pending':
      case 'confirmed':
        return { label: 'En Cola', color: 'bg-blue-100 text-blue-900 border-blue-300' }
      case 'preparing':
        return { label: 'Cocinando', color: 'bg-amber-100 text-amber-950 border-amber-300' }
      case 'ready':
        return { label: 'Listo', color: 'bg-emerald-100 text-emerald-900 border-emerald-300' }
      case 'delivered':
        return { label: 'Servido', color: 'bg-indigo-100 text-indigo-950 border-indigo-300' }
      default:
        return { label: roundStatus, color: 'bg-slate-100 text-slate-700 border-slate-300' }
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in select-none">
      <div className="w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-200 text-slate-900 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        
        {/* Cabecera */}
        <div className="bg-slate-900 text-white p-5 relative flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar seguimiento de comanda"
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
          <span className="text-[10px] font-black uppercase tracking-wider text-blue-400">
            Seguimiento en Vivo &middot; Mesa #{tableNumber}
          </span>
          <h3 className="text-lg font-black text-white mt-0.5">
            Estado de tu Comanda
          </h3>
        </div>

        {/* Contenido con Scroll Fluido */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          
          {/* BLOQUE 4.3: Desglose Completo de Fases en Tiempo Real por Estación */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
              Fases de tu Servicio en Tiempo Real
            </h4>

            {/* 1. VALIDACIÓN DEL MOZO */}
            <div className={`p-3.5 rounded-2xl border-2 transition-all ${
              isValidating
                ? 'bg-amber-50/90 border-amber-300'
                : 'bg-emerald-50/70 border-emerald-200'
            }`}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                    isValidating ? 'bg-amber-500 text-slate-950 animate-pulse' : 'bg-emerald-600 text-white'
                  }`}>
                    {isValidating ? <Clock size={14} /> : <CheckCircle2 size={14} />}
                  </div>
                  <div>
                    <h5 className="text-xs font-black uppercase tracking-wide text-slate-900">
                      1. Validación del Mozo
                    </h5>
                    <p className="text-[11px] text-slate-600 leading-snug">
                      {isValidating
                        ? 'El mozo confirmará tu comanda en tu mesa.'
                        : 'Comanda validada por el personal de sala.'}
                    </p>
                  </div>
                </div>
                <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border flex-shrink-0 ${
                  isValidating
                    ? 'bg-amber-100 text-amber-950 border-amber-300 animate-pulse'
                    : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                }`}>
                  {isValidating ? 'Esperando validación' : '✓ Validada'}
                </span>
              </div>
            </div>

            {/* 🍺 BEBIDAS DE BARRA */}
            {hasDrinks && (
              <div className={`p-3.5 rounded-2xl border-2 space-y-2.5 transition-all ${
                areAllDrinksServed
                  ? 'bg-emerald-50/60 border-emerald-200'
                  : isValidating
                  ? 'bg-slate-50 border-slate-200'
                  : 'bg-cyan-50/70 border-cyan-200'
              }`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-black uppercase tracking-wide text-slate-900 flex items-center gap-1.5">
                    <span>🍺 Bebidas de Barra</span>
                    <span className="text-[10px] text-slate-500 font-bold">
                      ({drinkEntries.reduce((s, e) => s + (e.item.quantity || 1), 0)})
                    </span>
                  </span>
                  <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                    areAllDrinksServed
                      ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                      : isValidating
                      ? 'bg-slate-100 text-slate-600 border-slate-300'
                      : 'bg-cyan-100 text-cyan-950 border-cyan-300 animate-pulse'
                  }`}>
                    {areAllDrinksServed
                      ? '✓ Servido en mesa'
                      : isValidating
                      ? 'Esperando validación'
                      : 'Preparando en barra'}
                  </span>
                </div>

                <div className="space-y-1.5 pt-1 border-t border-slate-200/60">
                  {drinkEntries.map((entry, idx) => {
                    const served = isDrinkServed(entry.item, entry.order) || entry.order.status === 'delivered'
                    const ordValidating = entry.order.status === 'pending_validation'
                    const itemStateLabel = served
                      ? '✓ Servido en mesa'
                      : ordValidating
                      ? 'Esperando validación'
                      : 'Preparando en barra'
                    const cleanNote = cleanItemNotes(entry.item.notes)

                    return (
                      <div key={idx} className="flex items-center justify-between gap-2 text-xs bg-white/90 px-2.5 py-1.5 rounded-xl border border-slate-200/80">
                        <div className="min-w-0">
                          <span className="font-black text-cyan-700 mr-1.5">{entry.item.quantity}x</span>
                          <span className="font-extrabold text-slate-800">{getItemRealName(entry.item, 'Bebida')}</span>
                          {cleanNote && (
                            <span className="block text-[10px] text-slate-500 italic pl-3">&bull; {cleanNote}</span>
                          )}
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex-shrink-0 ${
                          served
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : ordValidating
                            ? 'bg-slate-100 text-slate-600'
                            : 'bg-cyan-50 text-cyan-900 border border-cyan-200'
                        }`}>
                          {itemStateLabel}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* 🥗 1° ENTRADAS */}
            {hasStarters && (
              <div className={`p-3.5 rounded-2xl border-2 space-y-2.5 transition-all ${
                areAllStartersServed
                  ? 'bg-emerald-50/60 border-emerald-200'
                  : areAnyStartersReady
                  ? 'bg-emerald-50 border-emerald-400 ring-1 ring-emerald-300'
                  : 'bg-amber-50/70 border-amber-200'
              }`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-black uppercase tracking-wide text-slate-900 flex items-center gap-1.5">
                    <span>🥗 1° Entradas</span>
                    <span className="text-[10px] text-slate-500 font-bold">
                      ({starterEntries.reduce((s, e) => s + (e.item.quantity || 1), 0)})
                    </span>
                  </span>
                  <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                    areAllStartersServed
                      ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                      : areAnyStartersReady
                      ? 'bg-emerald-500 text-white border-emerald-600 animate-pulse'
                      : isValidating
                      ? 'bg-slate-100 text-slate-700 border-slate-300'
                      : 'bg-amber-100 text-amber-950 border-amber-300 animate-pulse'
                  }`}>
                    {areAllStartersServed
                      ? '✓ Entregado en mesa'
                      : areAnyStartersReady
                      ? 'Listo para servir'
                      : isValidating
                      ? 'Esperando validación'
                      : 'En preparación en cocina'}
                  </span>
                </div>

                <div className="space-y-1.5 pt-1 border-t border-slate-200/60">
                  {starterEntries.map((entry, idx) => {
                    const served = isStarterServed(entry.item, entry.order) || areOrderStartersServed(entry.order)
                    const ready = !served && (isStarterReady(entry.item, entry.order) || areOrderStartersReady(entry.order))
                    const ordValidating = entry.order.status === 'pending_validation' || isValidating
                    const itemStateLabel = served
                      ? '✓ Entregado en mesa'
                      : ready
                      ? 'Listo para servir'
                      : ordValidating
                      ? 'Esperando validación'
                      : 'En preparación en cocina'
                    const cleanNote = cleanItemNotes(entry.item.notes)

                    return (
                      <div key={idx} className="flex items-center justify-between gap-2 text-xs bg-white/90 px-2.5 py-1.5 rounded-xl border border-slate-200/80">
                        <div className="min-w-0">
                          <span className="font-black text-amber-700 mr-1.5">{entry.item.quantity}x</span>
                          <span className="font-extrabold text-slate-800">{getItemRealName(entry.item, 'Entrada')}</span>
                          {cleanNote && (
                            <span className="block text-[10px] text-slate-500 italic pl-3">&bull; {cleanNote}</span>
                          )}
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex-shrink-0 ${
                          served
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : ready
                            ? 'bg-emerald-100 text-emerald-950 border border-emerald-300 font-black'
                            : ordValidating
                            ? 'bg-slate-100 text-slate-600'
                            : 'bg-amber-50 text-amber-900 border border-amber-200'
                        }`}>
                          {itemStateLabel}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* 🍔 2° PLATOS PRINCIPALES */}
            {hasMains && (
              <div className={`p-3.5 rounded-2xl border-2 space-y-2.5 transition-all ${
                areAllMainsServed
                  ? 'bg-emerald-50/60 border-emerald-200'
                  : areAnyMainsReady
                  ? 'bg-emerald-50 border-emerald-400 ring-1 ring-emerald-300'
                  : areAnyMainsCookingOrFired
                  ? 'bg-amber-50/70 border-amber-200'
                  : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-black uppercase tracking-wide text-slate-900 flex items-center gap-1.5">
                    <span>🍔 2° Platos Principales</span>
                    <span className="text-[10px] text-slate-500 font-bold">
                      ({mainEntries.reduce((s, e) => s + (e.item.quantity || 1), 0)})
                    </span>
                  </span>
                  <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                    areAllMainsServed
                      ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                      : areAnyMainsReady
                      ? 'bg-emerald-500 text-white border-emerald-600 animate-pulse'
                      : isValidating
                      ? 'bg-slate-100 text-slate-700 border-slate-300'
                      : areAnyMainsCookingOrFired
                      ? 'bg-amber-100 text-amber-950 border-amber-300 animate-pulse'
                      : 'bg-slate-100 text-slate-600 border-slate-300'
                  }`}>
                    {areAllMainsServed
                      ? '✓ Entregado en mesa'
                      : areAnyMainsReady
                      ? 'Listo para servir'
                      : isValidating
                      ? 'Esperando validación'
                      : areAnyMainsCookingOrFired
                      ? 'En preparación en cocina'
                      : 'En espera del 1° plato'}
                  </span>
                </div>

                <div className="space-y-1.5 pt-1 border-t border-slate-200/60">
                  {mainEntries.map((entry, idx) => {
                    const served = isMainServed(entry.item, entry.order) || areOrderMainsServed(entry.order)
                    const ready = !served && (isMainReady(entry.item, entry.order) || areOrderMainsReady(entry.order))
                    const ordValidating = entry.order.status === 'pending_validation' || isValidating
                    const waitingFirstCourse =
                      !served &&
                      !ready &&
                      !ordValidating &&
                      orderHasStarters(entry.order) &&
                      !areOrderMainsFired(entry.order) &&
                      !isMainCooking(entry.item, entry.order)
                    const itemStateLabel = served
                      ? '✓ Entregado en mesa'
                      : ready
                      ? 'Listo para servir'
                      : ordValidating
                      ? 'Esperando validación'
                      : waitingFirstCourse
                      ? 'En espera del 1° plato'
                      : 'En preparación en cocina'
                    const cleanNote = cleanItemNotes(entry.item.notes)

                    return (
                      <div key={idx} className="flex items-center justify-between gap-2 text-xs bg-white/90 px-2.5 py-1.5 rounded-xl border border-slate-200/80">
                        <div className="min-w-0">
                          <span className="font-black text-blue-700 mr-1.5">{entry.item.quantity}x</span>
                          <span className="font-extrabold text-slate-800">{getItemRealName(entry.item, 'Principal')}</span>
                          {cleanNote && (
                            <span className="block text-[10px] text-slate-500 italic pl-3">&bull; {cleanNote}</span>
                          )}
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex-shrink-0 ${
                          served
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : ready
                            ? 'bg-emerald-100 text-emerald-950 border border-emerald-300 font-black'
                            : ordValidating
                            ? 'bg-slate-100 text-slate-600'
                            : waitingFirstCourse
                            ? 'bg-slate-100 text-slate-600 border border-slate-200'
                            : 'bg-amber-50 text-amber-900 border border-amber-200'
                        }`}>
                          {itemStateLabel}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* 🍰 3° POSTRES Y CAFÉ */}
            {hasDesserts && (
              <div className={`p-3.5 rounded-2xl border-2 space-y-2.5 transition-all ${
                areAllDessertsServed
                  ? 'bg-emerald-50/60 border-emerald-200'
                  : areAnyDessertsActiveOrReady
                  ? 'bg-purple-50/80 border-purple-300'
                  : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-black uppercase tracking-wide text-slate-900 flex items-center gap-1.5">
                    <span>🍰 3° Postres y Café</span>
                    <span className="text-[10px] text-slate-500 font-bold">
                      ({dessertEntries.reduce((s, e) => s + (e.item.quantity || 1), 0)})
                    </span>
                  </span>
                  <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                    areAllDessertsServed
                      ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                      : isValidating
                      ? 'bg-slate-100 text-slate-700 border-slate-300'
                      : areAnyDessertsActiveOrReady
                      ? 'bg-purple-100 text-purple-950 border-purple-300 animate-pulse'
                      : 'bg-slate-100 text-slate-600 border-slate-300'
                  }`}>
                    {areAllDessertsServed
                      ? '✓ Entregado en mesa'
                      : isValidating
                      ? 'Esperando validación'
                      : areAnyDessertsActiveOrReady
                      ? 'Preparando postre'
                      : 'Guardado para el final de la comida'}
                  </span>
                </div>

                <div className="space-y-1.5 pt-1 border-t border-slate-200/60">
                  {dessertEntries.map((entry, idx) => {
                    const served = isDessertServed(entry.item, entry.order) || areOrderDessertsServed(entry.order)
                    const ordValidating = entry.order.status === 'pending_validation' || isValidating
                    const activeOrReady =
                      !served &&
                      !ordValidating &&
                      (isDessertReady(entry.item, entry.order) ||
                        isDessertCooking(entry.item, entry.order) ||
                        isDessertFired(entry.item, entry.order) ||
                        orderHasActiveDesserts(entry.order) ||
                        (!hasStarters && !hasMains && entry.order.status === 'preparing'))
                    const itemStateLabel = served
                      ? '✓ Entregado en mesa'
                      : ordValidating
                      ? 'Esperando validación'
                      : activeOrReady
                      ? 'Preparando postre'
                      : 'Guardado para el final de la comida'
                    const cleanNote = cleanItemNotes(entry.item.notes)

                    return (
                      <div key={idx} className="flex items-center justify-between gap-2 text-xs bg-white/90 px-2.5 py-1.5 rounded-xl border border-slate-200/80">
                        <div className="min-w-0">
                          <span className="font-black text-purple-700 mr-1.5">{entry.item.quantity}x</span>
                          <span className="font-extrabold text-slate-800">{getItemRealName(entry.item, 'Postre')}</span>
                          {cleanNote && (
                            <span className="block text-[10px] text-slate-500 italic pl-3">&bull; {cleanNote}</span>
                          )}
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex-shrink-0 ${
                          served
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : ordValidating
                            ? 'bg-slate-100 text-slate-600'
                            : activeOrReady
                            ? 'bg-purple-100 text-purple-950 border border-purple-300'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}>
                          {itemStateLabel}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* HISTORIAL DETALLADO DE COMANDAS POR RONDAS */}
          {chronologicalOrders.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                  <Layers size={14} className="text-blue-600" />
                  <span>Resumen Económico en Mesa #{tableNumber}</span>
                </h4>
                <span className="text-[10px] text-slate-500 font-bold">
                  {chronologicalOrders.length} {chronologicalOrders.length === 1 ? 'ronda' : 'rondas'}
                </span>
              </div>

              <div className="space-y-3">
                {chronologicalOrders.map((ord, roundIdx) => {
                  const roundMinutes = getWaitingMinutes(ord.created_at)
                  const roundStatus = getRoundStatusLabel(ord.status)
                  const items = ord.order_items || []

                  return (
                    <div
                      key={ord.id}
                      className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/90 space-y-2.5 shadow-2xs"
                    >
                      {/* Cabecera de la Ronda */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-lg bg-blue-900 text-white font-black text-[10px] uppercase tracking-wide">
                            Ronda {roundIdx + 1}
                          </span>
                          <span className="text-[11px] text-slate-500 font-semibold">
                            ⏱ Hace {roundMinutes} min
                          </span>
                        </div>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${roundStatus.color}`}>
                          {roundStatus.label}
                        </span>
                      </div>

                      {/* Lista de Platos de la Ronda */}
                      <div className="space-y-1.5">
                        {items.length > 0 ? (
                          items.map((item, itemIdx) => {
                            const prod = item.product || (item as any).products || resolveCatalogProductForItem(item)
                            const name = getItemRealName(item, `Plato #${itemIdx + 1}`)
                            const itemPrice = Number((item as any).unit_price ?? (item as any).price ?? prod?.price ?? 0)
                            const cleanNote = stripInternalStationTags(item.notes)

                            return (
                              <div
                                key={item.id || `${item.product_id}-${itemIdx}`}
                                className="flex items-start justify-between text-xs py-1.5 border-b border-slate-200/50 last:border-b-0 gap-2"
                              >
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-black text-blue-900">
                                      {item.quantity}x
                                    </span>
                                    <span className="font-extrabold text-slate-800">
                                      {name}
                                    </span>
                                    {item.is_complimentary && (
                                      <span className="px-1.5 py-0.2 rounded-md bg-purple-100 text-purple-900 text-[9px] font-black">
                                        🎁 Cortesía
                                      </span>
                                    )}
                                  </div>

                                  {cleanNote !== '' && (
                                    <div className="text-[10px] text-slate-500 font-medium italic mt-0.5 pl-1">
                                      Nota: {cleanNote}
                                    </div>
                                  )}
                                </div>
                                <span className="font-black text-slate-900 tabular-nums flex-shrink-0">
                                  {item.is_complimentary
                                    ? '0,00 €'
                                    : formatCurrency(itemPrice * item.quantity)}
                                </span>
                              </div>
                            )
                          })
                        ) : (
                          <p className="text-[11px] text-slate-400 italic">Sin platos desglosados</p>
                        )}
                      </div>

                      {/* Subtotal Ronda */}
                      {ord.total_amount != null && (
                        <div className="pt-1.5 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-600 font-bold">
                          <span>Subtotal Ronda {roundIdx + 1}:</span>
                          <span className="text-slate-900 font-black tabular-nums">
                            {formatCurrency(ord.total_amount)}
                          </span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Total acumulado de la mesa */}
              {grandTotal > 0 && (
                <div className="p-3 bg-blue-50/70 rounded-2xl border border-blue-200 flex items-center justify-between">
                  <span className="text-xs font-black text-blue-950 uppercase tracking-wide">
                    Total Acumulado Mesa #{tableNumber}:
                  </span>
                  <span className="text-base font-black text-blue-900 tabular-nums">
                    {formatCurrency(grandTotal)}
                  </span>
                </div>
              )}

              <p className="text-[10px] text-slate-400 leading-tight text-center pt-1">
                📌 Comanda persistente: Este registro te permite verificar con el personal lo pedido y se eliminará automáticamente cuando se libere la mesa tras el cobro.
              </p>
            </div>
          )}
        </div>

        {/* Acciones Rápidas (Sin botones de automarcha por parte del comensal) */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center gap-2 flex-shrink-0">
          {onCallWaiter && (
            <button
              type="button"
              onClick={() => {
                onCallWaiter()
                onClose()
              }}
              className="flex-1 py-3 px-2 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer active:scale-95 shadow-xs"
            >
              <Bell size={14} className="stroke-[2.5]" />
              <span>Llamar al Mozo</span>
            </button>
          )}
          {onRequestService && (
            <button
              type="button"
              onClick={() => {
                onRequestService()
                onClose()
              }}
              className="flex-1 py-3 px-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer active:scale-95"
            >
              <UtensilsCrossed size={14} className="text-blue-700" />
              <span>Pedir Servicio</span>
            </button>
          )}
          {onRequestBill && !hasPendingDesserts && (status === 'delivered' || areAllDessertsServed || (areAllMainsServed && !hasDesserts)) && (
            <button
              type="button"
              onClick={() => {
                onRequestBill()
                onClose()
              }}
              className="flex-1 py-3 px-2 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer active:scale-95"
            >
              <Receipt size={14} />
              <span>Pedir Cuenta</span>
            </button>
          )}
        </div>

      </div>
    </div>
  )
}
