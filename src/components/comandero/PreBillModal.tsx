'use client'

import React, { useState } from 'react'
import { X, Receipt, Check, Printer, Share2, Users, CreditCard } from 'lucide-react'
import { Order, Restaurant } from '@/types/database.types'
import { formatCurrency } from '@/lib/utils'

interface PreBillModalProps {
  isOpen: boolean
  onClose: () => void
  restaurant: Restaurant
  tableNumber: string | number
  orders: Order[]
  paxCount?: number
  discountPercentage?: number
  onProceedToCharge?: () => void
}

export function PreBillModal({
  isOpen,
  onClose,
  restaurant,
  tableNumber,
  orders,
  paxCount = 2,
  discountPercentage = 0,
  onProceedToCharge,
}: PreBillModalProps) {
  const [splitCount, setSplitCount] = useState<number>(paxCount || 1)

  if (!isOpen) return null

  // Consolidar todos los ítems de las órdenes de esta mesa
  const itemsMap: Record<string, { name: string; quantity: number; price: number; total: number; notes?: string }> = {}

  orders.forEach(ord => {
    (ord.order_items || []).forEach(item => {
      if (item.is_complimentary) return
      const name = item.product?.name || `Plato`
      const price = item.product?.price || 0
      const key = `${name}-${price}`

      if (itemsMap[key]) {
        itemsMap[key].quantity += item.quantity || 1
        itemsMap[key].total += (item.quantity || 1) * price
      } else {
        itemsMap[key] = {
          name,
          quantity: item.quantity || 1,
          price,
          total: (item.quantity || 1) * price,
          notes: item.notes || undefined,
        }
      }
    })
  })

  const consolidatedItems = Object.values(itemsMap)
  const rawTotal = consolidatedItems.reduce((sum, item) => sum + item.total, 0)
  const discountAmount = discountPercentage > 0 ? rawTotal * (discountPercentage / 100) : 0
  const totalAmount = rawTotal - discountAmount
  const perPersonAmount = splitCount > 1 ? totalAmount / splitCount : totalAmount

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in select-none"
      style={{ touchAction: 'manipulation' }}
    >
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        
        {/* Cabecera Tipo Ticket */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/10 text-amber-400">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-black tracking-widest text-slate-400 block leading-none">
                Pre-Cuenta Digital
              </span>
              <h3 className="text-base font-black text-white leading-tight">
                {restaurant.name} · Mesa #{tableNumber}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Desglose de Cuenta */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#fafbfc]">
          
          {/* Calculadora de División Rápida */}
          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span className="flex items-center gap-1">
                <Users size={14} className="text-blue-600" />
                <span>División de Cuenta:</span>
              </span>
              <span className="text-blue-900 font-extrabold">
                {splitCount === 1 ? 'Total Completo' : `${splitCount} personas`}
              </span>
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {[1, 2, 3, 4, 5].map((cnt) => (
                <button
                  key={cnt}
                  type="button"
                  onClick={() => setSplitCount(cnt)}
                  className={`py-1.5 rounded-xl text-xs font-black transition-all ${
                    splitCount === cnt
                      ? 'bg-blue-900 text-white shadow-sm ring-2 ring-blue-700'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {cnt === 1 ? 'Total' : `÷${cnt}`}
                </button>
              ))}
            </div>
          </div>

          {/* Lista de Ítems */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden divide-y divide-slate-100">
            <div className="p-3 bg-slate-50 flex items-center justify-between text-[11px] font-black text-slate-500 uppercase tracking-wider">
              <span>Detalle de Consumos</span>
              <span>Subtotal</span>
            </div>

            {consolidatedItems.length > 0 ? (
              consolidatedItems.map((item, idx) => (
                <div key={idx} className="p-3 flex items-start justify-between gap-3 text-xs">
                  <div className="flex items-start gap-2 min-w-0">
                    <span className="px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-950 font-black text-[11px] flex-shrink-0">
                      {item.quantity}x
                    </span>
                    <div>
                      <h5 className="font-extrabold text-slate-900 leading-snug">{item.name}</h5>
                      <span className="text-[11px] text-slate-400">
                        {formatCurrency(item.price)} c/u
                      </span>
                    </div>
                  </div>
                  <span className="font-black text-slate-900 tabular-nums">
                    {formatCurrency(item.total)}
                  </span>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-xs text-slate-400 italic">
                Sin consumos registrados en esta mesa
              </div>
            )}
          </div>

          {/* Totales y División */}
          <div className="bg-slate-900 text-white p-4 rounded-2xl space-y-2 shadow-md">
            <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
              <span>Subtotal Consumos:</span>
              <span className="tabular-nums font-bold text-white">{formatCurrency(rawTotal)}</span>
            </div>

            {discountPercentage > 0 && (
              <div className="flex items-center justify-between text-xs text-emerald-400 font-bold">
                <span>Descuento Especial (-{discountPercentage}%):</span>
                <span className="tabular-nums">-{formatCurrency(discountAmount)}</span>
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
              <span>IVA Incluido (10%):</span>
              <span className="tabular-nums font-bold text-white">{formatCurrency(totalAmount * 0.1)}</span>
            </div>
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
              <span className="text-sm font-black uppercase tracking-wider text-amber-400">
                Total Mesa:
              </span>
              <span className="text-xl font-black text-white tabular-nums">
                {formatCurrency(totalAmount)}
              </span>
            </div>

            {splitCount > 1 && (
              <div className="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between bg-white/5 p-2.5 rounded-xl">
                <span className="text-xs font-black text-blue-300">
                  👉 Por Persona (÷{splitCount}):
                </span>
                <span className="text-base font-black text-amber-300 tabular-nums">
                  {formatCurrency(perPersonAmount)}
                </span>
              </div>
            )}
          </div>

          <p className="text-[10px] text-center text-slate-400 font-medium leading-tight">
            Documento informativo de pre-cuenta · No válido como factura fiscal (RD 1619/2012). Solicite factura si lo requiere.
          </p>

        </div>

        {/* Botonera Inferior */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between gap-2 flex-shrink-0">
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: `Pre-Cuenta Mesa #${tableNumber} - ${restaurant.name}`,
                  text: `Total: ${formatCurrency(totalAmount)} (Mesa #${tableNumber})`,
                }).catch(() => {})
              } else {
                window.print()
              }
            }}
            className="p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black transition-all flex items-center gap-1.5 shadow-xs"
            title="Compartir o Imprimir"
          >
            <Printer size={16} />
            <span className="hidden sm:inline">Imprimir</span>
          </button>

          {onProceedToCharge && (
            <button
              onClick={() => {
                onProceedToCharge()
                onClose()
              }}
              className="flex-1 py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-transform active:scale-95 shadow-md flex items-center justify-center gap-2"
            >
              <CreditCard size={16} />
              <span>Proceder al Cobro</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black transition-colors"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  )
}
