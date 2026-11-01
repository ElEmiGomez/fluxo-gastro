'use client'

import React, { useState } from 'react'
import {
  X,
  FileWarning,
  Upload,
  CheckCircle2,
  AlertCircle,
  MessageCircle,
} from 'lucide-react'
import {
  LocalBilling,
  MANUAL_PAYMENT_METHODS,
  PaymentMethod,
  PAYMENT_METHOD_LABEL,
} from '@/lib/billing/billing-calculations'
import { createBrowserClient } from '@/lib/supabase/client'

// Métodos Stripe: confirmación directa. Métodos manuales: comprobante obligatorio
// en el bucket privado de Supabase Storage `payment-proofs` antes de activar el mes.
const STRIPE_METHODS: PaymentMethod[] = ['stripe_card', 'stripe_sepa', 'apple_pay']

interface ManualPaymentProofModalProps {
  local: LocalBilling | null
  isOpen: boolean
  onClose: () => void
  /** Llamado tras validar método (y comprobante si es manual) para aplicar el pago 'paid'. */
  onConfirm: (localId: string, method: PaymentMethod) => void
}

export function ManualPaymentProofModal({
  local,
  isOpen,
  onClose,
  onConfirm,
}: ManualPaymentProofModalProps) {
  const [method, setMethod] = useState<PaymentMethod | null>(null)
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploaded, setUploaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [proofPath, setProofPath] = useState<string | null>(null)

  if (!isOpen || !local) return null

  const manualMethods = MANUAL_PAYMENT_METHODS

  const reset = () => {
    setMethod(null)
    setProofFile(null)
    setUploading(false)
    setUploaded(false)
    setError(null)
    setProofPath(null)
  }

  const close = () => {
    reset()
    onClose()
  }

  /** Sube el comprobante al bucket privado payment-proofs (o marca modo local si no hay Supabase). */
  const uploadProof = async (file: File): Promise<string | null> => {
    const supabase = createBrowserClient()
    if (!supabase) {
      // Entorno local sin Supabase: registrar el comprobante como simulado en el store
      return `local://${local.id}/${Date.now()}_${file.name}`
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const path = `${local.id}/${Date.now()}_${safeName}`
    const { error: uploadError } = await supabase.storage
      .from('payment-proofs')
      .upload(path, file, { upsert: true })

    if (uploadError) {
      throw uploadError
    }
    return path
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null
    setProofFile(file)
    setUploaded(false)
    setError(null)
    if (!file) return
    const okType =
      file.type.startsWith('image/') || file.type === 'application/pdf'
    if (!okType) {
      setError('Solo se aceptan imágenes (PNG/JPG) o PDF del comprobante.')
      setProofFile(null)
    }
  }

  const handleConfirm = async () => {
    if (!method) {
      setError('Selecciona el método de pago con el que se cobró el mes.')
      return
    }

    if (manualMethods.includes(method)) {
      if (!proofFile) {
        setError(
          'Comprobante obligatorio: adjunta la imagen o PDF del Bizum, transferencia o efectivo antes de confirmar.'
        )
        return
      }
      setUploading(true)
      setError(null)
      try {
        const path = await uploadProof(proofFile)
        setProofPath(path)
        setUploaded(true)
        setUploading(false)
      } catch {
        setUploading(false)
        setError('No se pudo subir el comprobante a payment-proofs. Inténtalo de nuevo.')
        return
      }
    }

    // Activar el mes: el padre aplica el estado 'paid' + comprobante registrado
    onConfirm(local.id, method)
    close()
  }

  const needsProof = manualMethods.includes(method as PaymentMethod)

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm apple-smooth">
      <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-white/10 shadow-2xl overflow-hidden appleFadeIn">
        {/* Cabecera */}
        <div className="px-5 pt-5 pb-4 border-b border-white/[0.08] flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Registrar cobro manual
            </p>
            <h3 className="text-base font-bold text-white mt-0.5">{local.nombre}</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Día de cobro {local.billing_day} · {local.monthly_price_eur} €/mes + IVA
            </p>
          </div>
          <button
            onClick={close}
            className="p-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-slate-300 apple-smooth"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Método de pago */}
        <div className="px-5 py-4 space-y-3 max-h-[60vh] overflow-y-auto">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Método con el que se cobró
          </p>

          <div>
            <p className="text-[10px] text-slate-500 font-semibold mb-1.5 uppercase">Stripe (automático)</p>
            <div className="grid grid-cols-3 gap-2">
              {STRIPE_METHODS.map((m) => (
                <button
                  key={m}
                  onClick={() => { setMethod(m); setError(null); setUploaded(false) }}
                  className={`px-2 py-2 rounded-xl text-[11px] font-semibold border apple-smooth ${
                    method === m
                      ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-200'
                      : 'bg-white/[0.04] border-white/[0.08] text-slate-300 hover:bg-white/[0.08]'
                  }`}
                >
                  {PAYMENT_METHOD_LABEL[m].replace('Stripe · ', '')}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[10px] text-slate-500 font-semibold mb-1.5 uppercase">
              Manual (comprobante obligatorio)
            </p>
            <div className="grid grid-cols-3 gap-2">
              {manualMethods.map((m) => (
                <button
                  key={m}
                  onClick={() => { setMethod(m); setError(null); setUploaded(false) }}
                  className={`px-2 py-2 rounded-xl text-[11px] font-semibold border apple-smooth ${
                    method === m
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-200'
                      : 'bg-white/[0.04] border-white/[0.08] text-slate-300 hover:bg-white/[0.08]'
                  }`}
                >
                  {PAYMENT_METHOD_LABEL[m]}
                </button>
              ))}
            </div>
            {method === 'bizum' && (
              <p className="text-[10px] text-slate-400 mt-1.5 font-mono">
                Bizum destino: +34 711 573 870
              </p>
            )}
          </div>

          {/* Comprobante */}
          {needsProof && (
            <div className="p-3 rounded-2xl bg-amber-500/[0.06] border border-amber-500/25">
              <div className="flex items-start gap-2">
                <FileWarning className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-200 leading-snug font-medium">
                  REGLA ESTRICTA: para Bizum, transferencia o efectivo es obligatorio subir el
                  comprobante (imagen o PDF) al bucket privado <span className="font-mono">payment-proofs</span>{' '}
                  antes de confirmar el cobro y activar el mes.
                </p>
              </div>

              <label className="mt-3 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-200 text-xs font-bold cursor-pointer apple-smooth">
                <Upload className="w-4 h-4" />
                <span>{uploaded ? 'Comprobante adjuntado ✓' : 'Adjuntar comprobante'}</span>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>

              {proofFile && !uploaded && (
                <p className="text-[10px] text-slate-300 mt-2 truncate font-mono">
                  {proofFile.name}
                </p>
              )}
              {proofPath && (
                <p className="text-[10px] text-emerald-300 mt-2 truncate font-mono">
                  storage/payment-proofs/{proofPath}
                </p>
              )}
            </div>
          )}

          {error && (
            <div className="p-3 rounded-2xl bg-red-500/[0.08] border border-red-500/30 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-[11px] text-red-200 leading-snug">{error}</p>
            </div>
          )}
        </div>

        {/* Pie */}
        <div className="px-5 py-4 border-t border-white/[0.08] flex items-center gap-2.5">
          <button
            onClick={close}
            className="flex-1 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-slate-300 text-xs font-semibold apple-smooth"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={uploading}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold apple-smooth flex items-center justify-center gap-2 ${
              uploading
                ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            {uploading ? 'Subiendo comprobante…' : 'Confirmar cobro y activar mes'}
          </button>
        </div>

        <p className="px-5 pb-4 text-[9px] text-slate-500 flex items-center gap-1.5">
          <MessageCircle className="w-3 h-3" />
          El recibo PNG se genera tras confirmar desde la pestaña de recibos.
        </p>
      </div>
    </div>
  )
}
