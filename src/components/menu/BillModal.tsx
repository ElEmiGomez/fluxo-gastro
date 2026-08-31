'use client'

import React, { useState } from 'react'
import { X, Receipt, Banknote, CreditCard, QrCode, ArrowRight, CheckCircle2, Users } from 'lucide-react'
import { GoogleReviewBooster } from '@/components/menu/GoogleReviewBooster'

interface BillModalProps {
  isOpen: boolean
  onClose: () => void
  tableNumber: string | null
  slug: string
  restaurantName?: string
  googleReviewUrl?: string | null
  googlePlaceId?: string | null
  totalAmount?: number
}

export function BillModal({
  isOpen,
  onClose,
  tableNumber,
  slug,
  restaurantName = 'Fluxo Gastro',
  googleReviewUrl,
  googlePlaceId,
  totalAmount,
}: BillModalProps) {
  const [billRequested, setBillRequested] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [splitCount, setSplitCount] = useState(1)

  if (!isOpen) return null

  const handleRequestBill = async (paymentMethod: string) => {
    setIsSubmitting(true)
    const splitNote = splitCount > 1 && totalAmount ? ` (Dividida ÷${splitCount}: ${(totalAmount / splitCount).toFixed(2)} €/pers)` : ''
    setBillRequested(`${paymentMethod}${splitNote}`)

    try {
      await fetch('/api/service-calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          table_number: parseInt(tableNumber || '1', 10),
          call_type: `bill_${paymentMethod}${splitNote}`,
        }),
      })

      setTimeout(() => {
        setBillRequested(null)
        setIsSubmitting(false)
        onClose()
      }, 2500)
    } catch (e) {
      console.error('Error requesting bill:', e)
      setTimeout(() => {
        setBillRequested(null)
        setIsSubmitting(false)
        onClose()
      }, 2500)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in select-none">
      <div className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-200 text-slate-900 animate-in zoom-in-95 duration-200">
        
        {/* Encabezado */}
        <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider">Pedir la Cuenta</h3>
              <span className="text-[10px] text-slate-400">Mesa #{tableNumber}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          
          {/* CALCULADORA SUTIL DE DIVISIÓN DE CUENTA (SPLIT BILL) */}
          {Boolean(totalAmount && totalAmount > 0) && (
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/90 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 font-bold flex items-center gap-1.5">
                  <Users size={14} className="text-blue-600" />
                  Dividir entre comensales:
                </span>
                <span className="font-black text-slate-900 tabular-nums">
                  Total: {totalAmount?.toFixed(2)} €
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setSplitCount(num)}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-black transition-all smooth-press ${
                      splitCount === num
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {num === 1 ? 'Total' : `÷${num}`}
                  </button>
                ))}
              </div>

              {splitCount > 1 && totalAmount && (
                <div className="pt-1 text-center text-xs text-blue-700 font-extrabold bg-blue-50/60 py-1.5 rounded-xl border border-blue-100">
                  👉 {(totalAmount / splitCount).toFixed(2)} € por persona
                </div>
              )}
            </div>
          )}

          {/* Opciones de Pago */}
          <p className="text-xs text-slate-600 font-medium text-center">
            Selecciona cómo prefieres abonar en la <strong>Mesa #{tableNumber}</strong>:
          </p>

          <div className="space-y-2.5">
            <button
              onClick={() => handleRequestBill('Efectivo')}
              disabled={isSubmitting}
              className="w-full p-3.5 rounded-2xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-slate-800 font-bold text-xs flex items-center justify-between transition-all active:scale-95 disabled:opacity-50"
            >
              <div className="flex items-center gap-2.5">
                <Banknote className="w-5 h-5 text-emerald-600" />
                <span>Efectivo en Mesa</span>
              </div>
              <ArrowRight size={14} className="text-slate-400" />
            </button>

            <button
              onClick={() => handleRequestBill('Tarjeta (Traer Posnet)')}
              disabled={isSubmitting}
              className="w-full p-3.5 rounded-2xl bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-slate-800 font-bold text-xs flex items-center justify-between transition-all active:scale-95 disabled:opacity-50"
            >
              <div className="flex items-center gap-2.5">
                <CreditCard className="w-5 h-5 text-blue-600" />
                <span>Tarjeta (Traer Posnet)</span>
              </div>
              <ArrowRight size={14} className="text-slate-400" />
            </button>

            <button
              onClick={() => handleRequestBill('QR / Transferencia')}
              disabled={isSubmitting}
              className="w-full p-3.5 rounded-2xl bg-slate-50 hover:bg-purple-50 border border-slate-200 hover:border-purple-300 text-slate-800 font-bold text-xs flex items-center justify-between transition-all active:scale-95 disabled:opacity-50"
            >
              <div className="flex items-center gap-2.5">
                <QrCode className="w-5 h-5 text-purple-600" />
                <span>QR Mercado Pago / App</span>
              </div>
              <ArrowRight size={14} className="text-slate-400" />
            </button>
          </div>

          {/* Módulo Google Review Booster (Captura sutil de 5 estrellas) */}
          <div className="pt-1">
            <GoogleReviewBooster
              restaurantName={restaurantName}
              restaurantSlug={slug}
              googleReviewUrl={googleReviewUrl}
              googlePlaceId={googlePlaceId}
              variant="compact"
            />
          </div>

          {billRequested && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-900 text-xs font-bold text-center animate-in fade-in flex items-center justify-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
              <span>¡Aviso enviado! El mozo se acerca con la cuenta ({billRequested}).</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
