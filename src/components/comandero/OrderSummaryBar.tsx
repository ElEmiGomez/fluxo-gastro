'use client'

import React from 'react'
import { Send, Loader2 } from 'lucide-react'
import { CartItem } from '@/types/database.types'
import { formatCurrency } from '@/lib/utils'

interface OrderSummaryBarProps {
  cart: CartItem[]
  tableNumber: string | null
  isSubmitting: boolean
  onSendOrder: () => void
  onOpenCartDetails: () => void
}

export function OrderSummaryBar({
  cart,
  tableNumber,
  isSubmitting,
  onSendOrder,
  onOpenCartDetails,
}: OrderSummaryBarProps) {
  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0)
  const totalAmount = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0)

  if (cart.length === 0) {
    return (
      <div className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200 p-3 pb-safe z-30 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-slate-500 font-medium">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-900" />
            <span>Mesa: <strong className="text-slate-900 font-bold">{tableNumber ? `#${tableNumber}` : 'Sin seleccionar'}</strong></span>
          </div>
          <span>Selecciona platos para armar la comanda</span>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed bottom-0 inset-x-0 bg-white/98 backdrop-blur-lg border-t border-slate-200 shadow-2xl p-3 pb-safe z-30 animate-in slide-in-from-bottom duration-200">
      <div className="max-w-7xl mx-auto flex items-center gap-3">
        
        {/* Info & Detalle de comanda */}
        <button
          type="button"
          onClick={onOpenCartDetails}
          className="flex-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl p-2.5 flex items-center justify-between text-left transition-colors touch-press shadow-sm"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl font-black text-xs text-white bg-blue-900 flex items-center justify-center shadow-sm">
              {totalItemsCount}
            </div>
            <div>
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                Mesa #{tableNumber || '?'}
              </div>
              <div className="text-sm font-black text-slate-900">
                {formatCurrency(totalAmount)}
              </div>
            </div>
          </div>
          <span className="text-[11px] text-blue-900 font-bold mr-1">
            Ver detalle
          </span>
        </button>

        {/* Botón de Envío Instantáneo a Cocina */}
        <button
          type="button"
          disabled={isSubmitting}
          onClick={onSendOrder}
          className="flex-1 py-3.5 px-4 rounded-2xl font-black text-sm bg-blue-900 hover:bg-blue-800 text-white shadow-xl flex items-center justify-center gap-2 transition-transform active:scale-95 touch-press"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Enviando...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>ENVIAR A COCINA</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
