'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { X, CreditCard, Banknote, Receipt, CheckCircle2, Sparkles, ShieldCheck } from 'lucide-react'
import { Order } from '@/types/database.types'
import { PendingServiceCall } from '@/types/comandero.types'

interface CloseTableModalProps {
  isOpen: boolean
  onClose: () => void
  tableNumber: number | string | null
  pendingCalls?: PendingServiceCall[]
  serverOrders?: Order[]
  discountPercentage?: number
  onConfirm: (
    tableNumber: number | string,
    paymentMethod: 'card' | 'cash',
    finalAmount: number,
    ordersCount: number
  ) => void
}

export function CloseTableModal({
  isOpen,
  onClose,
  tableNumber,
  pendingCalls = [],
  serverOrders = [],
  discountPercentage = 0,
  onConfirm,
}: CloseTableModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<'card' | 'cash'>('card')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 1. Inferencia Inteligente del Método de Pago (Smart Default)
  const { detectedMethod, hasDinerRequest, dinerRequestText } = useMemo(() => {
    if (!tableNumber) return { detectedMethod: 'card' as const, hasDinerRequest: false, dinerRequestText: '' }

    const tableCalls = pendingCalls.filter(
      c => c.table_number.toString() === tableNumber.toString()
    )
    const billCall = tableCalls.find(
      c => c.call_type?.startsWith('bill_') || c.text?.toLowerCase().includes('cuenta')
    )

    if (billCall) {
      const combined = `${billCall.call_type || ''} ${billCall.text || ''}`.toLowerCase()
      if (combined.includes('efectivo') || combined.includes('cash')) {
        return {
          detectedMethod: 'cash' as const,
          hasDinerRequest: true,
          dinerRequestText: billCall.text || 'Cuenta en efectivo',
        }
      }
      return {
        detectedMethod: 'card' as const,
        hasDinerRequest: true,
        dinerRequestText: billCall.text || 'Cuenta con tarjeta / datáfono',
      }
    }

    return {
      detectedMethod: 'card' as const,
      hasDinerRequest: false,
      dinerRequestText: '',
    }
  }, [pendingCalls, tableNumber])

  // Sincronizar el método seleccionado con la inferencia inteligente al abrir
  useEffect(() => {
    if (isOpen) {
      setSelectedMethod(detectedMethod)
      setIsSubmitting(false)
    }
  }, [isOpen, detectedMethod])

  // 2. Cálculo consolidado de importes y comandas activas
  const { tableOrders, rawTotal, discountAmount, finalAmount, totalItemsCount } = useMemo(() => {
    if (!tableNumber) {
      return { tableOrders: [], rawTotal: 0, discountAmount: 0, finalAmount: 0, totalItemsCount: 0 }
    }

    const filtered = serverOrders.filter(
      o =>
        (o.table_number?.toString() === tableNumber.toString() ||
          o.table?.table_number?.toString() === tableNumber.toString()) &&
        !['cancelled', 'paid'].includes(o.status)
    )

    let raw = 0
    let items = 0

    filtered.forEach(ord => {
      if (ord.order_items && ord.order_items.length > 0) {
        ord.order_items.forEach(item => {
          if (!item.is_complimentary) {
            const price = item.product?.price || 0
            raw += (item.quantity || 1) * price
            items += item.quantity || 1
          }
        })
      } else if (ord.total_amount) {
        raw += Number(ord.total_amount) || 0
        items += 1
      }
    })

    const discount = discountPercentage > 0 ? raw * (discountPercentage / 100) : 0
    const final = Math.max(0, raw - discount)

    return {
      tableOrders: filtered,
      rawTotal: raw,
      discountAmount: discount,
      finalAmount: final,
      totalItemsCount: items,
    }
  }, [serverOrders, tableNumber, discountPercentage])

  if (!isOpen || !tableNumber) return null

  const handleConfirm = () => {
    if (isSubmitting) return
    setIsSubmitting(true)
    onConfirm(tableNumber, selectedMethod, finalAmount, Math.max(1, tableOrders.length))
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4 animate-in fade-in select-none"
      style={{ touchAction: 'manipulation' }}
    >
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200 flex flex-col">
        {/* Cabecera */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/10 text-emerald-400">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-black tracking-widest text-emerald-400 block leading-none">
                Cobro y Cierre de Mesa
              </span>
              <h3 className="text-base font-black text-white leading-tight">
                Mesa #{tableNumber}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal"
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cuerpo */}
        <div className="p-5 space-y-4">
          {/* Tarjeta de Importe Total */}
          <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-inner text-center space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Total a Cobrar
            </span>
            <div className="text-3xl font-black text-emerald-400 tabular-nums tracking-tight">
              {finalAmount.toFixed(2)} €
            </div>
            <div className="text-[11px] text-slate-300 font-semibold flex items-center justify-center gap-2 pt-1">
              <span>{tableOrders.length} {tableOrders.length === 1 ? 'comanda' : 'comandas'}</span>
              <span>•</span>
              <span>{totalItemsCount} platos/bebidas</span>
              {discountPercentage > 0 && (
                <>
                  <span>•</span>
                  <span className="text-amber-400 font-bold">-{discountPercentage}% dto.</span>
                </>
              )}
            </div>
          </div>

          {/* Detección Inteligente del Método de Pago */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700">
                Método de Pago:
              </label>
              {hasDinerRequest ? (
                <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 size={11} className="text-emerald-600" />
                  Pedido por comensal
                </span>
              ) : (
                <span className="text-[10px] font-semibold text-slate-500 flex items-center gap-1">
                  <Sparkles size={11} className="text-amber-500" />
                  Sugerido automático
                </span>
              )}
            </div>

            {/* Selector Rápido de 1 Toque (Tarjeta vs Efectivo) */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setSelectedMethod('card')}
                className={`p-3 rounded-2xl border-2 font-black text-xs flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  selectedMethod === 'card'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-300'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                <CreditCard className={`w-5 h-5 ${selectedMethod === 'card' ? 'text-white' : 'text-blue-600'}`} />
                <span>💳 Tarjeta</span>
                {detectedMethod === 'card' && hasDinerRequest && (
                  <span className="text-[9px] opacity-90 font-medium">Pre-seleccionado</span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setSelectedMethod('cash')}
                className={`p-3 rounded-2xl border-2 font-black text-xs flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  selectedMethod === 'cash'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-300'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                <Banknote className={`w-5 h-5 ${selectedMethod === 'cash' ? 'text-white' : 'text-emerald-600'}`} />
                <span>💵 Efectivo</span>
                {detectedMethod === 'cash' && hasDinerRequest && (
                  <span className="text-[9px] opacity-90 font-medium">Pre-seleccionado</span>
                )}
              </button>
            </div>

            <p className="text-[11px] text-slate-500 text-center font-medium">
              {selectedMethod === 'card'
                ? 'Cobro mediante datáfono / TPV inalámbrico.'
                : 'Cobro en metálico en mesa.'}
            </p>
          </div>

          {/* Botones de Acción */}
          <div className="pt-2 space-y-2 border-t border-slate-100">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleConfirm}
              className={`w-full py-3.5 px-4 rounded-2xl text-xs font-black text-white shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer disabled:opacity-50 ${
                selectedMethod === 'cash'
                  ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
                  : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/30'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>
                {isSubmitting
                  ? 'Liberando mesa...'
                  : `Cobrar ${finalAmount.toFixed(2)} € (${selectedMethod === 'card' ? 'Tarjeta' : 'Efectivo'}) y Liberar`}
              </span>
            </button>

            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="w-full py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
