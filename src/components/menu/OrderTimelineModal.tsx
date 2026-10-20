'use client'

import React from 'react'
import { X, CheckCircle2, Clock, Flame, Sparkles, UtensilsCrossed, Bell, Receipt, Layers } from 'lucide-react'
import { Order, OrderStatus } from '@/types/database.types'
import { formatCurrency, getWaitingMinutes } from '@/lib/utils'
import {
  stripInternalStationTags,
  getItemCourse,
  isDrinkServed,
  isDessertReady,
  isDessertServed,
  isDessertFired,
  isDessertPendingChoice,
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
  areOrderMainsFired,
  ordersHavePendingDesserts,
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

  // Agrupar ítems activos de todas las comandas de la mesa con respaldo de caché local
  const rawItems = orders.flatMap(o => o.order_items || [])
  let allTableItems = rawItems
  if (allTableItems.length === 0 && typeof window !== 'undefined') {
    const recovered: any[] = []
    orders.forEach(o => {
      try {
        const stored = localStorage.getItem(`fluxo_order_items_${o.id}`)
        if (stored) {
          const parsed = JSON.parse(stored)
          if (Array.isArray(parsed) && parsed.length > 0) recovered.push(...parsed)
        }
      } catch (_) {}
    })
    if (recovered.length > 0) {
      allTableItems = recovered
    }
  }

  const hasDrinks = allTableItems.some(isDrinkItem)
  const hasStarters = allTableItems.some(isStarterItem)
  const hasMains = allTableItems.some(isMainItem)
  const hasDesserts = allTableItems.some(isDessertItem)

  // 1. Estado Validación
  const isValidating = orders.some(o => o.status === 'pending_validation')
  const isAllValidated = !isValidating && orders.length > 0

  // 2. Estado Bebidas
  const drinks = allTableItems.filter(isDrinkItem)
  const areDrinksServed = drinks.length > 0 && drinks.every(isDrinkServed)

  // 3. Estado Entradas
  const starters = allTableItems.filter(isStarterItem)
  const areStartersServed = starters.length > 0 && starters.every(isStarterServed)
  const areStartersReady = starters.length > 0 && starters.every(isStarterReady)
  const areStartersPreparing = starters.length > 0 && !areStartersReady && !areStartersServed && orders.some(o => o.status === 'preparing')

  // 4. Estado Principales
  const mains = allTableItems.filter(isMainItem)
  const areMainsServed = mains.length > 0 && mains.every(isMainServed)
  const areMainsReady = mains.length > 0 && mains.every(isMainReady)
  const areMainsFired = orders.some(areOrderMainsFired)
  const areMainsCooking = mains.some(isMainCooking) || (mains.length > 0 && starters.length === 0 && orders.some(o => o.status === 'preparing')) || (mains.length > 0 && areStartersServed && areMainsFired)
  const areMainsPreparing = mains.length > 0 && !areMainsReady && !areMainsServed && areMainsCooking

  // 5. Estado Postres
  const desserts = allTableItems.filter(isDessertItem)
  const areDessertsServed = desserts.length > 0 && desserts.every(isDessertServed)
  const areDessertsReady = desserts.length > 0 && desserts.every(isDessertReady)
  const areDessertsFired = desserts.some(isDessertFired)
  const areDessertsPreparing = desserts.length > 0 && !areDessertsReady && !areDessertsServed && areDessertsFired
  const hasPendingDessertChoice = desserts.some(isDessertPendingChoice)
  const hasPendingDesserts = ordersHavePendingDesserts(orders)

  type PhaseState = 'waiting' | 'preparing' | 'ready' | 'delivered'

  interface CoursePhase {
    key: string
    title: string
    desc: string
    state: PhaseState
    badge: string
    icon: any
  }

  const dynamicPhases: CoursePhase[] = []

  // Fase 1: Validación del Mozo
  dynamicPhases.push({
    key: 'validation',
    title: 'Validación del Mozo',
    desc: isValidating
      ? 'El mozo confirmará tu comanda en tu mesa.'
      : 'Comanda validada por el personal de sala.',
    state: isValidating ? 'preparing' : 'delivered',
    badge: isValidating ? 'En revisión' : 'Validada',
    icon: isValidating ? Clock : CheckCircle2,
  })

  // Fase 2: Bebidas (si hay)
  if (hasDrinks) {
    let state: PhaseState = 'waiting'
    let desc = 'En espera de validación de comanda.'
    let badge = 'En espera'
    if (areDrinksServed || status === 'delivered') {
      state = 'delivered'
      desc = 'Bebidas servidas en tu mesa.'
      badge = 'Entregadas'
    } else if (isAllValidated) {
      state = 'preparing'
      desc = 'Preparando bebidas en barra.'
      badge = 'En barra'
    }
    dynamicPhases.push({
      key: 'drinks',
      title: 'Bebidas',
      desc,
      state,
      badge,
      icon: state === 'delivered' ? CheckCircle2 : Sparkles,
    })
  }

  // Fase 3: Entradas (si hay)
  if (hasStarters) {
    let state: PhaseState = 'waiting'
    let desc = 'En cola de preparación de cocina.'
    let badge = 'En espera'
    if (areStartersServed || status === 'delivered') {
      state = 'delivered'
      desc = 'Entradas servidas en tu mesa.'
      badge = 'Entregadas'
    } else if (areStartersReady) {
      state = 'ready'
      desc = '¡Listas en cocina! El mozo las lleva a tu mesa.'
      badge = 'Listas'
    } else if (areStartersPreparing) {
      state = 'preparing'
      desc = 'Cocineros preparando tus entradas en cocina.'
      badge = 'En preparación'
    }
    dynamicPhases.push({
      key: 'starters',
      title: '1º Entradas',
      desc,
      state,
      badge,
      icon: state === 'delivered' ? CheckCircle2 : Flame,
    })
  }

  // Fase 4: Principales (si hay)
  if (hasMains) {
    let state: PhaseState = 'waiting'
    let desc = hasStarters ? 'En espera del momento oportuno tras el 1º plato.' : 'En cola de cocina.'
    let badge = 'En espera'
    if (areMainsServed || (status === 'delivered' && !areDessertsPreparing && !areDessertsReady)) {
      state = 'delivered'
      desc = 'Platos principales servidos en tu mesa.'
      badge = 'Entregados'
    } else if (areMainsReady) {
      state = 'ready'
      desc = '¡Listos en cocina! El mozo los lleva a tu mesa.'
      badge = 'Listos'
    } else if (areMainsPreparing) {
      state = 'preparing'
      desc = 'Cocinando platos principales en cocina.'
      badge = 'En preparación'
    }
    dynamicPhases.push({
      key: 'mains',
      title: '2º Platos Principales',
      desc,
      state,
      badge,
      icon: state === 'delivered' ? CheckCircle2 : Flame,
    })
  }

  // Fase 5: Postres (si hay)
  if (hasDesserts) {
    let state: PhaseState = 'waiting'
    let desc = (hasStarters || hasMains) ? 'En espera tras terminar la comida principal.' : 'En cola de cocina.'
    let badge = 'En espera'
    if (areDessertsServed || (status === 'delivered' && !hasPendingDessertChoice)) {
      state = 'delivered'
      desc = 'Postres servidos en tu mesa.'
      badge = 'Entregados'
    } else if (areDessertsReady) {
      state = 'ready'
      desc = '¡Listos en cocina! El mozo los lleva a tu mesa.'
      badge = 'Listos'
    } else if (hasPendingDessertChoice) {
      state = 'waiting'
      desc = 'Postre incluido pendiente de tu elección.'
      badge = 'Por definir'
    } else if (areDessertsPreparing) {
      state = 'preparing'
      desc = '🍨 Postres en marcha: preparándose en cocina para el pase dulce.'
      badge = 'En preparación'
    }
    dynamicPhases.push({
      key: 'desserts',
      title: 'Postres',
      desc,
      state,
      badge,
      icon: state === 'delivered' ? CheckCircle2 : Sparkles,
    })
  }

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
        <div className="p-5 overflow-y-auto space-y-6 flex-1">
          
          {/* Fases del Servicio por Tiempos Gastronómicos */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
              Fases de tu Servicio
            </h4>
            <div className="relative space-y-4 before:absolute before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {dynamicPhases.map((phase) => {
                const isDelivered = phase.state === 'delivered'
                const isReady = phase.state === 'ready'
                const isPreparing = phase.state === 'preparing'
                const Icon = phase.icon

                return (
                  <div key={phase.key} className="relative flex items-start gap-3.5">
                    {/* Icono de Etapa */}
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 z-10 transition-all ${
                        isDelivered
                          ? 'bg-emerald-600 text-white ring-4 ring-emerald-100 shadow-xs'
                          : isReady
                          ? 'bg-[#4d7c67] text-white ring-4 ring-slate-200 shadow-xs border border-[#3b6352] animate-pulse'
                          : isPreparing
                          ? 'bg-amber-500 text-slate-950 ring-4 ring-amber-200 animate-pulse shadow-xs'
                          : 'bg-slate-100 text-slate-400 border border-slate-300'
                      }`}
                    >
                      {isDelivered ? <CheckCircle2 size={16} /> : isReady ? <Sparkles size={16} /> : <Icon size={16} />}
                    </div>

                    {/* Detalle de Etapa */}
                    <div className="flex-1 min-w-0 pt-0.5">
                      <div className="flex items-center justify-between gap-2">
                        <h5
                          className={`text-xs font-black uppercase tracking-wide ${
                            isDelivered
                              ? 'text-emerald-950'
                              : isReady
                              ? 'text-[#234839]'
                              : isPreparing
                              ? 'text-amber-950 font-black'
                              : 'text-slate-400'
                          }`}
                        >
                          {phase.title}
                        </h5>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                          isDelivered
                            ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                            : isReady
                            ? 'bg-[#e2ede7] text-[#284c3d] border-[#9dbcb0] animate-pulse'
                            : isPreparing
                            ? 'bg-amber-100 text-amber-950 border-amber-300 animate-pulse'
                            : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}>
                          {phase.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                        {phase.desc}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* HISTORIAL DETALLADO DE COMANDAS POR RONDAS */}
          {chronologicalOrders.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                  <Layers size={14} className="text-blue-600" />
                  <span>Platos Pedidos en Mesa #{tableNumber}</span>
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
                            const prod = item.product || (item as any).products
                            const name = prod?.name || `Plato #${itemIdx + 1}`
                            const itemPrice = Number((item as any).unit_price ?? (item as any).price ?? prod?.price ?? 0)
                            const cleanNote = stripInternalStationTags(item.notes)
                            const course = getItemCourse(item)
                            const isDeliveredOrPaid = ord.status === 'delivered' || ord.status === 'paid'

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

                                    {/* Badges de estado limpios por tiempo / estación (solo en curso) */}
                                    {!isDeliveredOrPaid && (
                                      <>
                                        {course === 'drink' && (
                                          isDrinkServed(item) ? (
                                            <span className="px-1.5 py-0.2 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[9px] font-bold">
                                              ✓ Servida en mesa
                                            </span>
                                          ) : (
                                            <span className="px-1.5 py-0.2 rounded-md bg-cyan-50 text-cyan-800 border border-cyan-200 text-[9px] font-bold">
                                              🥤 En barra
                                            </span>
                                          )
                                        )}
                                        {course === 'dessert' && (
                                          isDessertReady(item) ? (
                                            <span className="px-1.5 py-0.2 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[9px] font-bold">
                                              ✓ Postre listo
                                            </span>
                                          ) : isDessertFired(item) ? (
                                            <span className="px-1.5 py-0.2 rounded-md bg-purple-100 text-purple-900 border border-purple-300 text-[9px] font-bold">
                                              🔥 Marchando en cocina
                                            </span>
                                          ) : (
                                            <span className="px-1.5 py-0.2 rounded-md bg-slate-100 text-slate-600 border border-slate-200 text-[9px] font-semibold">
                                              ⏳ En espera para después
                                            </span>
                                          )
                                        )}
                                        {(course === 'first' || course === 'second') && (
                                          (isFoodReady(item) || ord.status === 'ready') ? (
                                            <span className="px-1.5 py-0.2 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[9px] font-bold">
                                              ✓ Listo para llevar a mesa
                                            </span>
                                          ) : ord.status === 'preparing' ? (
                                            <span className="px-1.5 py-0.2 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-[9px] font-semibold">
                                              👨‍🍳 En preparación
                                            </span>
                                          ) : null
                                        )}
                                      </>
                                    )}
                                  </div>

                                  {/* Aclaración del cliente sanitizada (sin códigos técnicos) */}
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

        {/* Acciones Rápidas */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center gap-2 flex-shrink-0">
          {onCallWaiter && (
            <button
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
          {onRequestBill && !hasPendingDesserts && (status === 'delivered' || areDessertsServed || (areMainsServed && desserts.length === 0)) && (
            <button
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
