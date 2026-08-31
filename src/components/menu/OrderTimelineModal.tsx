'use client'

import React from 'react'
import { X, CheckCircle2, Clock, Flame, Sparkles, UtensilsCrossed, Bell, Receipt } from 'lucide-react'
import { OrderStatus } from '@/types/database.types'

interface OrderTimelineModalProps {
  isOpen: boolean
  onClose: () => void
  tableNumber: string | null
  status: OrderStatus | null
  onRequestService?: () => void
  onRequestBill?: () => void
}

export function OrderTimelineModal({
  isOpen,
  onClose,
  tableNumber,
  status,
  onRequestService,
  onRequestBill,
}: OrderTimelineModalProps) {
  if (!isOpen || !status) return null

  // Mapeo de etapas
  // 1: Pending (Recibido)
  // 2: Preparing (En Cocina)
  // 3: Ready (Listo para servir)
  // 4: Delivered (Servido en Mesa)
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
      desc: 'El mozo confirmará verbalmente tu pedido en mesa.',
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
      desc: 'Nuestros chefs están cocinando tus platos.',
      icon: Flame,
      activeColor: 'bg-amber-500 text-slate-950 ring-amber-300',
    },
    {
      step: 3,
      title: 'Listo para Servir',
      desc: 'Retirando del pasaplatos hacia tu mesa.',
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-200 text-slate-900 animate-in zoom-in-95 duration-200">
        
        {/* Cabecera */}
        <div className="bg-slate-900 text-white p-5 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
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

        {/* Timeline interactivo */}
        <div className="p-6 space-y-6">
          <div className="relative space-y-6 before:absolute before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {steps.map((s) => {
              const isPast = currentStep > s.step
              const isCurrent = currentStep === s.step
              const Icon = s.icon

              return (
                <div key={s.step} className="relative flex items-start gap-4">
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
                      <h4
                        className={`text-xs font-black uppercase tracking-wide ${
                          isCurrent
                            ? 'text-blue-900'
                            : isPast
                            ? 'text-slate-800'
                            : 'text-slate-400'
                        }`}
                      >
                        {s.title}
                      </h4>
                      {isCurrent && (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 animate-pulse">
                          Fase Actual
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                      {s.desc}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Acciones Rápidas */}
          <div className="pt-3 border-t border-slate-200 flex items-center gap-2">
            {onRequestService && (
              <button
                onClick={() => {
                  onRequestService()
                  onClose()
                }}
                className="flex-1 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
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
                className="flex-1 py-2.5 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
              >
                <Receipt size={14} />
                <span>Pedir Cuenta</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
