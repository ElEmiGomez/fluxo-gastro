'use client'

import React, { useState, useMemo, useEffect } from 'react'
import {
  X,
  Users,
  Divide,
  CheckCircle2,
  CreditCard,
  Banknote,
  Receipt,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react'
import { Order } from '@/types/database.types'
import {
  BillSplitItem,
  toCents,
  centsToEuro,
  calculateEqualSplits,
  isBillFullySettled,
  EqualSplitQuota,
} from '@/lib/bill-splitter'

interface SplitBillModalProps {
  isOpen: boolean
  onClose: () => void
  tableNumber: string | number
  serverOrders: Order[]
  discountPercentage?: number
  onExecutePartialOrFullPayment: (params: {
    tableNumber: string | number
    paidAmountCents: number
    paymentMethod: 'card' | 'cash' | 'mixed'
    isFullyPaid: boolean
    remainingCents: number
  }) => Promise<void>
}

export function SplitBillModal({
  isOpen,
  onClose,
  tableNumber,
  serverOrders,
  discountPercentage = 0,
  onExecutePartialOrFullPayment,
}: SplitBillModalProps) {
  const [splitMode, setSplitMode] = useState<'equal' | 'by_item'>('equal')
  const [guestCount, setGuestCount] = useState<number>(2)
  const [paidQuotas, setPaidQuotas] = useState<number>(0)
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash'>('card')
  const [isProcessing, setIsProcessing] = useState(false)
  const [itemSelections, setItemSelections] = useState<Record<string, number>>({})
  const [itemPaidCounts, setItemPaidCounts] = useState<Record<string, number>>({})

  // Extraer todos los ítems válidos de las órdenes de la mesa
  const activeOrders = useMemo(() => {
    return serverOrders.filter(
      o =>
        (o.table_number?.toString() === tableNumber.toString() ||
          o.table?.table_number?.toString() === tableNumber.toString()) &&
        o.status !== 'cancelled' &&
        o.status !== 'paid'
    )
  }, [serverOrders, tableNumber])

  const billItems: BillSplitItem[] = useMemo(() => {
    const list: BillSplitItem[] = []
    activeOrders.forEach(o => {
      ;(o.order_items || []).forEach((item: any, idx: number) => {
        const id = item.id || `${o.id}_${idx}`
        const name = item.product?.name || item.name || 'Producto'
        const unitPrice = Number(item.product?.price || item.unit_price || 0)
        const unitPriceCents = toCents(
          discountPercentage > 0 ? unitPrice * (1 - discountPercentage / 100) : unitPrice
        )
        const quantity = item.quantity || 1
        list.push({
          id,
          name,
          quantity,
          unitPriceCents,
          totalPriceCents: unitPriceCents * quantity,
          paidQuantity: itemPaidCounts[id] || 0,
        })
      })
    })
    return list
  }, [activeOrders, discountPercentage, itemPaidCounts])

  // Total de la cuenta en céntimos
  const totalCents = useMemo(() => {
    return billItems.reduce((sum, item) => sum + item.totalPriceCents, 0)
  }, [billItems])

  // Cuotas de división a partes iguales
  const equalQuotas = useMemo(() => {
    return calculateEqualSplits(totalCents, guestCount, paidQuotas)
  }, [totalCents, guestCount, paidQuotas])

  const totalPaidCents = useMemo(() => {
    if (splitMode === 'equal') {
      return equalQuotas.slice(0, paidQuotas).reduce((s, q) => s + q.amountCents, 0)
    } else {
      return billItems.reduce(
        (s, item) => s + (itemPaidCounts[item.id] || 0) * item.unitPriceCents,
        0
      )
    }
  }, [splitMode, equalQuotas, paidQuotas, billItems, itemPaidCounts])

  const remainingCents = Math.max(0, totalCents - totalPaidCents)
  const isSettled = isBillFullySettled(totalCents, totalPaidCents)

  // Subtotal seleccionado en modo ítems
  const currentSelectedItemsCents = useMemo(() => {
    return billItems.reduce((sum, item) => {
      const selectedQty = itemSelections[item.id] || 0
      return sum + selectedQty * item.unitPriceCents
    }, 0)
  }, [billItems, itemSelections])

  // Cobrar siguiente cuota a partes iguales
  const handlePayNextQuota = async () => {
    const nextQuotaIndex = paidQuotas
    if (nextQuotaIndex >= equalQuotas.length) return
    const quota = equalQuotas[nextQuotaIndex]

    setIsProcessing(true)
    try {
      const newPaidCount = paidQuotas + 1
      const newPaidCents = equalQuotas
        .slice(0, newPaidCount)
        .reduce((s, q) => s + q.amountCents, 0)
      const isComplete = newPaidCount >= equalQuotas.length

      await onExecutePartialOrFullPayment({
        tableNumber,
        paidAmountCents: quota.amountCents,
        paymentMethod,
        isFullyPaid: isComplete,
        remainingCents: Math.max(0, totalCents - newPaidCents),
      })

      setPaidQuotas(newPaidCount)
      if (isComplete) {
        setTimeout(() => onClose(), 800)
      }
    } finally {
      setIsProcessing(false)
    }
  }

  // Cobrar selección de ítems
  const handlePaySelectedItems = async () => {
    if (currentSelectedItemsCents === 0) return

    setIsProcessing(true)
    try {
      const updatedPaidCounts = { ...itemPaidCounts }
      Object.entries(itemSelections).forEach(([id, qty]) => {
        updatedPaidCounts[id] = (updatedPaidCounts[id] || 0) + qty
      })

      const newTotalPaid = billItems.reduce(
        (s, item) => s + (updatedPaidCounts[item.id] || 0) * item.unitPriceCents,
        0
      )
      const isComplete = newTotalPaid >= totalCents

      await onExecutePartialOrFullPayment({
        tableNumber,
        paidAmountCents: currentSelectedItemsCents,
        paymentMethod,
        isFullyPaid: isComplete,
        remainingCents: Math.max(0, totalCents - newTotalPaid),
      })

      setItemPaidCounts(updatedPaidCounts)
      setItemSelections({})
      if (isComplete) {
        setTimeout(() => onClose(), 800)
      }
    } finally {
      setIsProcessing(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-t-3xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Encabezado */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black shadow-md">
              <Divide className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                Dividir Cuenta • Mesa #{tableNumber}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Total mesa: <span className="font-bold text-slate-800 dark:text-slate-200">{centsToEuro(totalCents)}</span>
                {discountPercentage > 0 && ` (-${discountPercentage}%)`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barra de progreso de saldo */}
        <div className="px-5 py-3 bg-slate-100/80 dark:bg-slate-800/60 border-b border-slate-200/60 dark:border-slate-750 flex items-center justify-between text-xs font-bold">
          <span className="text-slate-600 dark:text-slate-400">
            Pagado: <span className="text-emerald-600 dark:text-emerald-400">{centsToEuro(totalPaidCents)}</span>
          </span>
          <span className="text-slate-600 dark:text-slate-400">
            Pendiente:{' '}
            <span className={remainingCents === 0 ? 'text-emerald-600 font-black' : 'text-amber-600 font-black'}>
              {centsToEuro(remainingCents)}
            </span>
          </span>
        </div>

        {/* Selector de modo */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex gap-2">
          <button
            type="button"
            onClick={() => setSplitMode('equal')}
            className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              splitMode === 'equal'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Partes Iguales ({guestCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setSplitMode('by_item')}
            className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              splitMode === 'by_item'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Por Platos</span>
          </button>
        </div>

        {/* Cuerpo dinámico según modo */}
        <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-4">
          {splitMode === 'equal' ? (
            <div className="space-y-4">
              {/* Selector de número de comensales */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Dividir entre comensales:
                </span>
                <div className="flex items-center gap-1">
                  {[2, 3, 4, 5, 6, 8].map(n => (
                    <button
                      key={n}
                      type="button"
                      disabled={paidQuotas > 0}
                      onClick={() => setGuestCount(n)}
                      className={`w-8 h-8 rounded-lg font-black text-xs transition-all cursor-pointer ${
                        guestCount === n
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 disabled:opacity-40'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {/* Lista de cuotas con redondeo exacto */}
              <div className="space-y-2">
                {equalQuotas.map(q => (
                  <div
                    key={q.quotaNumber}
                    className={`p-3 rounded-xl border flex items-center justify-between text-xs font-bold transition-all ${
                      q.isPaid
                        ? 'bg-emerald-50/80 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-300'
                        : q.quotaNumber === paidQuotas + 1
                        ? 'bg-blue-50/90 dark:bg-blue-950/30 border-blue-400 dark:border-blue-700 text-blue-950 dark:text-blue-200 ring-2 ring-blue-500/20'
                        : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {q.isPaid ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      ) : (
                        <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center text-[10px] font-black">
                          {q.quotaNumber}
                        </span>
                      )}
                      <span>
                        Parte {q.quotaNumber} de {q.totalQuotas}
                      </span>
                      {q.isRemainderAdjustment && (
                        <span className="text-[10px] text-slate-400 font-normal">
                          (ajuste céntimos)
                        </span>
                      )}
                    </div>
                    <span className="font-extrabold text-sm">{centsToEuro(q.amountCents)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Modo Selección de Platos */
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-500">
                Selecciona las unidades que paga este comensal:
              </p>
              {billItems.map(item => {
                const remainingQty = item.quantity - item.paidQuantity
                const selectedQty = itemSelections[item.id] || 0
                const isItemPaid = remainingQty === 0

                return (
                  <div
                    key={item.id}
                    className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                      isItemPaid
                        ? 'bg-emerald-50/50 dark:bg-emerald-950/10 border-emerald-200 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-400 opacity-60'
                        : selectedQty > 0
                        ? 'bg-blue-50/70 dark:bg-blue-950/20 border-blue-400 dark:border-blue-700 text-slate-900 dark:text-white'
                        : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <div className="flex-1 pr-2">
                      <div className="text-xs font-bold flex items-center gap-2">
                        <span>{item.name}</span>
                        {isItemPaid && (
                          <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.5 rounded-full font-bold">
                            ✓ Pagado
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 font-medium">
                        {centsToEuro(item.unitPriceCents)} / ud • {remainingQty} pendiente(s)
                      </div>
                    </div>

                    {!isItemPaid && (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={selectedQty <= 0}
                          onClick={() =>
                            setItemSelections(prev => ({
                              ...prev,
                              [item.id]: Math.max(0, (prev[item.id] || 0) - 1),
                            }))
                          }
                          className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-black text-xs hover:bg-slate-200 disabled:opacity-30 cursor-pointer"
                        >
                          -
                        </button>
                        <span className="w-5 text-center font-black text-xs">{selectedQty}</span>
                        <button
                          type="button"
                          disabled={selectedQty >= remainingQty}
                          onClick={() =>
                            setItemSelections(prev => ({
                              ...prev,
                              [item.id]: Math.min(remainingQty, (prev[item.id] || 0) + 1),
                            }))
                          }
                          className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-black text-xs hover:bg-slate-200 disabled:opacity-30 cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Pie: Método de pago y Botón de acción */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/90 space-y-3">
          {/* Selector de método (Tarjeta o Efectivo) */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPaymentMethod('card')}
              className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                paymentMethod === 'card'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>Tarjeta</span>
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod('cash')}
              className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                paymentMethod === 'cash'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              <Banknote className="w-4 h-4" />
              <span>Efectivo</span>
            </button>
          </div>

          {/* Botón de cobro dinámico */}
          {splitMode === 'equal' ? (
            <button
              type="button"
              disabled={isProcessing || paidQuotas >= equalQuotas.length}
              onClick={handlePayNextQuota}
              className="w-full py-3 px-4 rounded-xl font-black text-sm bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>
                {paidQuotas >= equalQuotas.length
                  ? 'Cuenta 100% Cobrada (Mesa Liberada)'
                  : `Cobrar Parte ${paidQuotas + 1} de ${guestCount} (${centsToEuro(
                      equalQuotas[paidQuotas]?.amountCents || 0
                    )})`}
              </span>
            </button>
          ) : (
            <button
              type="button"
              disabled={isProcessing || currentSelectedItemsCents === 0}
              onClick={handlePaySelectedItems}
              className="w-full py-3 px-4 rounded-xl font-black text-sm bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>
                Cobrar Selección ({centsToEuro(currentSelectedItemsCents)})
              </span>
            </button>
          )}

          {isSettled && (
            <p className="text-center text-xs font-bold text-emerald-600 flex items-center justify-center gap-1">
              <ShieldCheck className="w-4 h-4" />
              Mesa liquidada a 0,00 € • Auto-liberación lista
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
