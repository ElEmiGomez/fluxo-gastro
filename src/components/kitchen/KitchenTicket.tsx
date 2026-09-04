'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { Clock, CheckCircle2, ChefHat, AlertTriangle, UserCheck, Utensils, Sparkles } from 'lucide-react'
import { Order, OrderStatus } from '@/types/database.types'
import { getWaitingMinutes } from '@/lib/utils'

interface KitchenTicketProps {
  order: Order
  isNew?: boolean
  onUpdateStatus: (orderId: string, status: OrderStatus) => void
}

export function KitchenTicket({
  order,
  isNew = false,
  onUpdateStatus,
}: KitchenTicketProps) {
  const [waitingMinutes, setWaitingMinutes] = useState(() => getWaitingMinutes(order.created_at))
  const [completedItemIds, setCompletedItemIds] = useState<Record<string, boolean>>({})

  const toggleItemCompleted = (itemId: string) => {
    setCompletedItemIds(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }))
  }

  useEffect(() => {
    setWaitingMinutes(getWaitingMinutes(order.created_at))
    const interval = setInterval(() => {
      setWaitingMinutes(getWaitingMinutes(order.created_at))
    }, 30000)
    return () => clearInterval(interval)
  }, [order.created_at])

  if (!order || !order.order_items || order.order_items.length === 0) {
    return null
  }

  const tableNumberDisplay = order.table?.table_number ?? order.table_number ?? '?'

  const getUrgencyStyles = () => {
    if (order.status === 'ready') {
      return {
        cardBorder: 'border-emerald-400 shadow-emerald-100',
        headerBg: 'bg-emerald-50 text-emerald-950 border-b border-emerald-200',
        badge: 'bg-emerald-100 text-emerald-900 border-emerald-300',
        statusLabel: 'Listo para Servir',
        statusColor: 'text-emerald-700 font-bold',
        dotColor: 'bg-emerald-500',
        timerLabel: `Listo (hace ${waitingMinutes} min)`,
      }
    }
    if (waitingMinutes >= 20) {
      return {
        cardBorder: 'border-red-400 shadow-red-100 ring-2 ring-red-400/50',
        headerBg: 'bg-red-50 text-red-950 border-b border-red-200',
        badge: 'bg-red-100 text-red-900 border-red-300 animate-pulse',
        statusLabel: 'Demorado en Cocina',
        statusColor: 'text-red-700 font-bold',
        dotColor: 'bg-red-600 animate-ping',
        timerLabel: `⏱ Hace ${waitingMinutes} min (Urgente)`,
      }
    }
    if (waitingMinutes >= 10) {
      return {
        cardBorder: 'border-amber-300 shadow-amber-100',
        headerBg: 'bg-amber-50 text-amber-950 border-b border-amber-200',
        badge: 'bg-amber-100 text-amber-900 border-amber-300',
        statusLabel: 'En Marcha',
        statusColor: 'text-amber-700 font-bold',
        dotColor: 'bg-amber-500',
        timerLabel: `⏱ Hace ${waitingMinutes} min`,
      }
    }
    return {
      cardBorder: 'border-slate-200 shadow-slate-100',
      headerBg: 'bg-slate-50 text-slate-900 border-b border-slate-200',
      badge: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      statusLabel: 'A Tiempo',
      statusColor: 'text-slate-600 font-bold',
      dotColor: 'bg-emerald-500',
      timerLabel: waitingMinutes > 0 ? `⏱ Hace ${waitingMinutes} min` : '⏱ Hace < 1 min',
    }
  }

  const urgency = getUrgencyStyles()
  const orderTimeFormatted = order.created_at
    ? new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '--:--'

  return (
    <div
      className={`rounded-3xl border-2 overflow-hidden shadow-md bg-white flex flex-col smooth-spring hover:translate-y-[-2px] transition-all duration-300 ${urgency.cardBorder} ${
        isNew ? 'ring-4 ring-blue-400/50 scale-[1.02]' : ''
      }`}
    >
      {/* Header del Ticket */}
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
              {isNew && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-900 text-white uppercase tracking-wider shadow-sm animate-bounce">
                  NUEVO
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`w-2 h-2 rounded-full ${urgency.dotColor} flex-shrink-0`} />
              <span className={`text-xs block ${urgency.statusColor}`}>
                {urgency.statusLabel} &middot; <span className="text-[11px] font-medium text-slate-500">{orderTimeFormatted}</span>
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

      {/* Ítems de la Comanda con Soporte de Tachado Individual & Tachar Todo */}
      <div className="p-3 sm:p-4 flex-1 space-y-2.5 bg-[#fafbfc]">
        {order.order_items && order.order_items.length > 0 && (
          <div className="flex items-center justify-between pb-1 text-xs text-slate-500 font-bold border-b border-slate-200/60">
            <span>Platos a Despachar ({order.order_items.length})</span>
            {order.status !== 'pending' && order.order_items.length > 1 && (
              <button
                type="button"
                onClick={() => {
                  const allDone = order.order_items?.every((item, idx) =>
                    completedItemIds[item.id || `${item.product_id}-${idx}`]
                  )
                  const nextMap: Record<string, boolean> = {}
                  if (!allDone) {
                    order.order_items?.forEach((item, idx) => {
                      nextMap[item.id || `${item.product_id}-${idx}`] = true
                    })
                  }
                  setCompletedItemIds(nextMap)
                }}
                className="text-[11px] px-2.5 py-1 rounded-xl bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-900 border border-slate-200 hover:border-emerald-300 font-black flex items-center gap-1 transition-all shadow-xs active:scale-95 cursor-pointer"
                title="Marcar todos los platos de este ticket como listos con 1 toque"
              >
                <CheckCircle2 size={12} className="text-emerald-600" />
                <span>
                  {order.order_items?.every((item, idx) => completedItemIds[item.id || `${item.product_id}-${idx}`])
                    ? 'Desmarcar Todo'
                    : 'Tachar Todo'}
                </span>
              </button>
            )}
            {order.status === 'pending' && (
              <span className="text-[10px] text-amber-800 font-bold bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                Pulsa Iniciar para tachar
              </span>
            )}
          </div>
        )}

        {order.order_items && order.order_items.length > 0 ? (
          order.order_items.map((item, idx) => {
            const productName = item.product?.name || `Plato #${item.product_id.substring(0, 6)}`
            const imageUrl = item.product?.image_url
            const itemKey = item.id || `${item.product_id}-${idx}`
            const isDone = Boolean(completedItemIds[itemKey])
            const canClick = order.status !== 'pending'

            return (
              <div
                key={itemKey}
                onClick={canClick ? () => toggleItemCompleted(itemKey) : undefined}
                className={`p-2.5 rounded-2xl border transition-all duration-200 select-none flex gap-3 items-start ${
                  !canClick
                    ? 'bg-white border-slate-200/90 cursor-default'
                    : isDone
                    ? 'bg-emerald-50/70 border-emerald-300 opacity-60 cursor-pointer'
                    : 'bg-white border-slate-200/90 hover:border-slate-300 shadow-xs cursor-pointer'
                }`}
                title={canClick ? "Toca para marcar este plato como listo" : "Inicia preparación para tachar este plato"}
              >
                {/* Miniatura visual del plato */}
                <div
                  style={{ position: 'relative', width: '60px', height: '60px', minWidth: '60px', minHeight: '60px', overflow: 'hidden', borderRadius: '12px' }}
                  className="bg-white border border-slate-200 shadow-xs flex-shrink-0"
                >
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt={productName}
                      fill
                      className="object-cover"
                      sizes="70px"
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
                  </div>

                  {/* Badges de Pase de Cocina, Cortesía y Peso */}
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    {item.course === 'first' && (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-950 font-black text-[10px] border border-emerald-300 flex items-center gap-1">
                        <span>🔥 1º MARCHA</span>
                      </span>
                    )}
                    {item.course === 'second' && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-950 font-black text-[10px] border border-amber-300 flex items-center gap-1 animate-pulse">
                        <span>⏳ 2º EN ESPERA</span>
                      </span>
                    )}
                    {item.course === 'dessert' && (
                      <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-950 font-black text-[10px] border border-purple-300 flex items-center gap-1">
                        <span>🍰 POSTRE</span>
                      </span>
                    )}
                    {item.is_complimentary && (
                      <span className="px-2 py-0.5 rounded-md bg-purple-600 text-white font-black text-[10px] shadow-xs">
                        🎁 CORTESÍA / INVITA CASA
                      </span>
                    )}
                    {item.weight_grams && (
                      <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-950 font-black text-[10px] border border-blue-200">
                        ⚖️ {item.weight_grams}g
                      </span>
                    )}
                  </div>

                  {/* Aclaración especial resaltada (solo si contiene texto real) */}
                  {item.notes && item.notes.trim() !== '' && (
                    <div className={`mt-1.5 p-2 rounded-xl border text-xs shadow-xs flex items-start gap-1.5 ${
                      isDone ? 'bg-emerald-100/50 border-emerald-200 text-emerald-900' : 'bg-red-50 border-red-200 text-red-900'
                    }`}>
                      <AlertTriangle className="w-3.5 h-3.5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <span className="font-bold uppercase tracking-wider text-[9px] text-red-600 block leading-none">
                          Aclaración de Cocina:
                        </span>
                        <p className="font-extrabold text-xs leading-tight mt-0.5">
                          {item.notes}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })
        ) : (
          <p className="text-xs text-slate-400 italic py-2">Sin ítems detallados</p>
        )}
      </div>

      {/* Botones de Transición Táctil Industrial (Mínimo 64px - 72px de altura, utilizable con guantes) */}
      <div className="p-3.5 bg-white border-t border-slate-200 flex items-center gap-2">
        {(order.status === 'pending' || order.status === 'confirmed') && (
          <button
            onClick={() => onUpdateStatus(order.id, 'preparing')}
            className="w-full h-16 py-4 px-4 rounded-2xl font-black text-sm bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center gap-3 shadow-lg hover:shadow-amber-500/20 active:scale-95 transition-all uppercase tracking-wide border-2 border-amber-600/30"
          >
            <ChefHat className="w-6 h-6 stroke-[2.5]" />
            <span>INICIAR PREPARACIÓN</span>
          </button>
        )}

        {order.status === 'preparing' && (
          <button
            onClick={() => onUpdateStatus(order.id, 'ready')}
            className="w-full h-16 py-4 px-4 rounded-2xl font-black text-sm bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-3 shadow-lg hover:shadow-emerald-600/20 active:scale-95 transition-all uppercase tracking-wide border-2 border-emerald-700/30"
          >
            <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
            <span>MARCAR LISTO PARA SERVIR</span>
          </button>
        )}

        {order.status === 'ready' && (
          <button
            onClick={() => onUpdateStatus(order.id, 'delivered')}
            className="w-full h-16 py-4 px-4 rounded-2xl font-black text-sm bg-blue-900 hover:bg-blue-800 text-white flex items-center justify-center gap-3 shadow-lg hover:shadow-blue-900/20 active:scale-95 transition-all uppercase tracking-wide border-2 border-blue-950/30"
          >
            <Sparkles className="w-6 h-6" />
            <span>MARCAR SERVIDO Y ENTREGADO</span>
          </button>
        )}
      </div>
    </div>
  )
}
