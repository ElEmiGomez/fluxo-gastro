'use client'

import React from 'react'
import { X, CheckCircle2, Clock, Flame, Sparkles, UtensilsCrossed, Bell, Receipt, Layers, AlertTriangle } from 'lucide-react'
import { Order, OrderStatus } from '@/types/database.types'
import { formatCurrency, getWaitingMinutes } from '@/lib/utils'

interface OrderTimelineModalProps {
  isOpen: boolean
  onClose: () => void
  tableNumber: string | null
  status: OrderStatus | null
  orders?: Order[]
  onRequestService?: () => void
  onRequestBill?: () => void
}

export function OrderTimelineModal({
  isOpen,
  onClose,
  tableNumber,
  status,
  orders = [],
  onRequestService,
  onRequestBill,
}: OrderTimelineModalProps) {
  if (!isOpen || !status) return null

  // Mapeo de etapas generales
  const currentStep = 
    status === 'pending_validation' ? 0 :
    status === 'pending' ? 1 :
    status === 'preparing' ? 2 :
    status === 'ready' ? 3 :
    status === 'delivered' ? 4 : 0

  const steps = [
    {
      step: 0,
      title: 'Validación del Mozo',
      desc: 'El mozo confirmará tu pedido en mesa.',
      icon: Clock,
      activeColor: 'bg-amber-500 text-slate-950 ring-amber-300',
    },
    {
      step: 1,
      title: 'Enviado a Cocina',
      desc: 'Comanda verificada e ingresada al monitor KDS.',
      icon: Clock,
      activeColor: 'bg-blue-600 text-white ring-blue-400',
    },
    {
      step: 2,
      title: 'En Preparación',
      desc: 'Nuestros chefs están preparando tus platos.',
      icon: Flame,
      activeColor: 'bg-amber-500 text-slate-950 ring-amber-300',
    },
    {
      step: 3,
      title: 'Listo para Servir',
      desc: 'Retirando de la cocina hacia tu mesa.',
      icon: Sparkles,
      activeColor: 'bg-emerald-500 text-white ring-emerald-300',
    },
    {
      step: 4,
      title: 'Servido en Mesa',
      desc: '¡Buen provecho! Que disfrutes tu comida.',
      icon: UtensilsCrossed,
      activeColor: 'bg-indigo-600 text-white ring-indigo-400',
    },
  ]

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
          
          {/* Fases del Servicio */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
              Fases del Servicio
            </h4>
            <div className="relative space-y-4 before:absolute before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {steps.map((s) => {
                const isPast = currentStep > s.step
                const isCurrent = currentStep === s.step
                const Icon = s.icon

                return (
                  <div key={s.step} className="relative flex items-start gap-3.5">
                    {/* Icono de Etapa */}
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 z-10 transition-all ${
                        isPast
                          ? 'bg-emerald-600 text-white ring-4 ring-emerald-100'
                          : isCurrent
                          ? `${s.activeColor} ring-4 animate-pulse`
                          : 'bg-slate-100 text-slate-400 border border-slate-300'
                      }`}
                    >
                      {isPast ? <CheckCircle2 size={16} /> : <Icon size={16} />}
                    </div>

                    {/* Detalle de Etapa */}
                    <div className="flex-1 min-w-0 pt-0.5">
                      <div className="flex items-center justify-between">
                        <h5
                          className={`text-xs font-black uppercase tracking-wide ${
                            isCurrent
                              ? 'text-blue-900'
                              : isPast
                              ? 'text-slate-800'
                              : 'text-slate-400'
                          }`}
                        >
                          {s.title}
                        </h5>
                        {isCurrent && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 animate-pulse">
                            Fase Actual
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                        {s.desc}
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

                            return (
                              <div
                                key={item.id || `${item.product_id}-${itemIdx}`}
                                className="flex items-start justify-between text-xs py-1 border-b border-slate-200/50 last:border-b-0 gap-2"
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
                                  {item.notes && item.notes.trim() !== '' && (
                                    <div className="flex items-center gap-1 mt-0.5 text-[10px] text-amber-900 font-semibold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/80">
                                      <AlertTriangle size={10} className="text-amber-600 flex-shrink-0" />
                                      <span className="truncate">{item.notes}</span>
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
          {onRequestService && (
            <button
              onClick={() => {
                onRequestService()
                onClose()
              }}
              className="flex-1 py-3 px-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer active:scale-95"
            >
              <Bell size={14} className="text-blue-700" />
              <span>Pedir Servicio</span>
            </button>
          )}
          {onRequestBill && currentStep === 4 && (
            <button
              onClick={() => {
                onRequestBill()
                onClose()
              }}
              className="flex-1 py-3 px-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer active:scale-95"
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
