'use client'

import React, { useEffect, useRef } from 'react'
import { X, Download, Receipt } from 'lucide-react'
import {
  LocalBilling,
  PLAN_CONFIG,
  PAYMENT_METHOD_LABEL,
} from '@/lib/billing/billing-calculations'
import {
  RECEIPT_HEIGHT,
  RECEIPT_WIDTH,
  buildReceiptData,
  drawReceipt,
  downloadCanvasPng,
} from '@/lib/billing/receipt-canvas-renderer'

interface ReceiptCanvasGeneratorProps {
  local: LocalBilling | null
  isOpen: boolean
  onClose: () => void
}

/** Generador/visor de Recibo Digital PNG (1200x1600) en Canvas 2D nativo. */
export function ReceiptCanvasGenerator({
  local,
  isOpen,
  onClose,
}: ReceiptCanvasGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    if (!isOpen || !local || !canvasRef.current) return
    const data = buildReceiptData(local)
    drawReceipt(canvasRef.current, data)
  }, [isOpen, local])

  if (!isOpen || !local) return null

  const data = buildReceiptData(local)

  const handleDownload = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const safeName = local.slug.replace(/[^a-z0-9-]/g, '')
    downloadCanvasPng(canvas, `recibo_${data.receiptNumber}_${safeName}.png`)
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="max-w-sm w-full max-h-[92vh] flex flex-col rounded-3xl bg-slate-900 border border-white/10 shadow-2xl overflow-hidden appleFadeIn">
        {/* Cabecera */}
        <div className="px-5 pt-4 pb-3 border-b border-white/[0.08] flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Receipt className="w-3 h-3" /> Recibo Digital · PNG Canvas 2D
            </p>
            <h3 className="text-sm font-bold text-white mt-0.5">{local.nombre}</h3>
            <p className="text-[11px] text-slate-400 font-mono">{data.receiptNumber}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-slate-300 apple-smooth"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Preview escalada */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-950/60">
          <canvas
            ref={canvasRef}
            width={RECEIPT_WIDTH}
            height={RECEIPT_HEIGHT}
            className="w-full h-auto rounded-xl shadow-lg"
            aria-label={`Recibo de ${local.nombre}`}
          />
        </div>

        {/* Resumen */}
        <div className="px-5 py-3 border-t border-white/[0.08] text-[11px] text-slate-400 grid grid-cols-2 gap-x-3 gap-y-1">
          <span>Plan</span>
          <span className="text-slate-200 text-right">
            {PLAN_CONFIG[local.plan_type].label} · + IVA
          </span>
          <span>Importe total</span>
          <span className="text-emerald-300 text-right font-bold">
            {data.total.toFixed(2).replace('.', ',')} €
          </span>
          <span>Método</span>
          <span className="text-slate-200 text-right">
            {PAYMENT_METHOD_LABEL[local.payment_method]}
          </span>
        </div>

        {/* Pie */}
        <div className="px-5 py-4 border-t border-white/[0.08]">
          <button
            onClick={handleDownload}
            className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold apple-smooth flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            <Download className="w-4 h-4" />
            Descargar recibo PNG (máxima resolución)
          </button>
        </div>
      </div>
    </div>
  )
}
