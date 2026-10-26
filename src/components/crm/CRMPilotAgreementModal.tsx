'use client'

import React, { useRef, useState, useEffect } from 'react'
import {
  X,
  FileCheck2,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  Calendar,
  ShieldCheck,
  MessageCircle,
  ExternalLink,
  Store,
  DollarSign
} from 'lucide-react'
import { CRMLead, CRMPlan, PilotAgreement, PLAN_PRICING } from '@/types/crm.types'

interface CRMPilotAgreementModalProps {
  lead: CRMLead
  isOpen: boolean
  onClose: () => void
  onAgreementSigned: (leadId: string, agreement: PilotAgreement) => Promise<void>
}

const PLAN_NAMES: Record<CRMPlan, string> = {
  carta_39: 'Carta Digital (39 €/mes)',
  sala_69: 'Carta + Comandero Sala (69 €/mes)',
  full_99: 'Full KDS Cocina + Sala (99 €/mes)',
  suite_139: 'Suite Integral de Restauración (139 €/mes)',
}

export function CRMPilotAgreementModal({
  lead,
  isOpen,
  onClose,
  onAgreementSigned,
}: CRMPilotAgreementModalProps) {
  if (!isOpen) return null

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasSignature, setHasSignature] = useState(false)
  const [signeeName, setSigneeName] = useState(lead.contact_name || '')
  const [signeePhone, setSigneePhone] = useState(lead.contact_phone || lead.contact_whatsapp || '')
  const [agreedPlan, setAgreedPlan] = useState<CRMPlan>(lead.target_plan || 'carta_39')
  const [saving, setSaving] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [savedAgreement, setSavedAgreement] = useState<PilotAgreement | null>(null)

  const startDate = new Date()
  const endDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
  const formatDate = (d: Date) =>
    d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })

  // Inicializar Canvas táctil
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Ajustar resolución retina / alta densidad
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * 2
    canvas.height = rect.height * 2
    ctx.scale(2, 2)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = '#38bdf8' // Color trazo cian ejecutivo
    ctx.lineWidth = 2.5
  }, [isOpen])

  // Obtener coordenadas corregidas para mouse o touch
  const getCanvasCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()

    if ('touches' in e && e.touches.length > 0) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      }
    } else if ('clientX' in e) {
      return {
        x: (e as React.MouseEvent).clientX - rect.left,
        y: (e as React.MouseEvent).clientY - rect.top,
      }
    }
    return { x: 0, y: 0 }
  }

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    setIsDrawing(true)
    const { x, y } = getCanvasCoordinates(e)
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (ctx) {
      ctx.beginPath()
      ctx.moveTo(x, y)
    }
  }

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return
    e.preventDefault()
    const { x, y } = getCanvasCoordinates(e)
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (ctx) {
      ctx.lineTo(x, y)
      ctx.stroke()
      setHasSignature(true)
    }
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const clearSignature = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      setHasSignature(false)
    }
  }

  const handleConfirmAgreement = async () => {
    if (!signeeName.trim()) {
      alert('Por favor, indica el nombre del titular o responsable del local.')
      return
    }

    setSaving(true)
    try {
      const canvas = canvasRef.current
      const signatureData = canvas ? canvas.toDataURL('image/png') : undefined

      const agreement: PilotAgreement = {
        signed_at: new Date().toISOString(),
        signee_name: signeeName.trim(),
        signee_phone: signeePhone.trim() || undefined,
        signature_data: signatureData,
        agreed_plan: agreedPlan,
        trial_duration_days: 14,
      }

      await onAgreementSigned(lead.id, agreement)
      setSavedAgreement(agreement)
      setIsSuccess(true)
    } finally {
      setSaving(false)
    }
  }

  // Generar mensaje de confirmación para WhatsApp
  const getWhatsAppReceiptUrl = () => {
    const phone = (signeePhone || lead.contact_whatsapp || lead.contact_phone || '').replace(/\D/g, '')
    if (!phone) return null
    const cleanNumber = phone.startsWith('34') ? phone : `34${phone}`

    const text = encodeURIComponent(
      `Hola ${signeeName || 'amigo'}, te confirmo que hemos activado con éxito el periodo de prueba de 14 días de Fluxo para ${lead.name}.\n\n` +
      `📋 Plan a evaluar: ${PLAN_NAMES[agreedPlan]}\n` +
      `📅 Periodo gratuito: Del ${formatDate(startDate)} al ${formatDate(endDate)}\n` +
      `✨ Condiciones: Sin permanencia ni coste durante la prueba. Incluye soporte y puesta en marcha de carta QR.\n\n` +
      `¡Muchas gracias por la confianza y que tengáis un gran servicio en Noia!`
    )
    return `https://wa.me/${cleanNumber}?text=${text}`
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-3 sm:p-4 animate-in fade-in select-none">
      <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-700 text-white shadow-2xl overflow-hidden max-h-[95vh] flex flex-col">
        {/* Cabecera */}
        <div className="p-5 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center text-slate-950 font-black shadow-md shadow-amber-500/20">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Acuerdo de Prueba (14 Días)</h3>
              <p className="text-xs text-amber-400 font-mono">Sin coste ni permanencia • Noia</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {isSuccess ? (
            <div className="py-6 flex flex-col items-center text-center space-y-4 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border-2 border-emerald-500/30 text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/10">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h4 className="text-lg font-bold text-white">¡Prueba de 14 Días Activada!</h4>
                <p className="text-xs text-slate-300 mt-1 max-w-xs">
                  {lead.name} ha quedado registrado en periodo de piloto con el {PLAN_NAMES[agreedPlan]}.
                </p>
              </div>

              <div className="w-full p-4 rounded-2xl bg-slate-950/70 border border-slate-800 text-left text-xs space-y-1.5 text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400">Titular firmante:</span>
                  <span className="font-semibold text-white">{savedAgreement?.signee_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Periodo de prueba:</span>
                  <span className="font-semibold text-amber-400">14 días naturales</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Fecha de fin:</span>
                  <span className="font-mono text-emerald-400">{formatDate(endDate)}</span>
                </div>
              </div>

              <div className="w-full space-y-2 pt-2">
                {getWhatsAppReceiptUrl() && (
                  <a
                    href={getWhatsAppReceiptUrl()!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 active:scale-95 touch-manipulation"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Enviar Comprobante por WhatsApp</span>
                  </a>
                )}

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2.5 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
                >
                  Volver a la Ficha del Local
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Resumen del Local y Fechas */}
              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <div className="text-[11px] text-slate-400">Local beneficiario</div>
                  <div className="font-bold text-white text-sm">{lead.name}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{lead.address}</div>
                </div>

                <div className="text-right">
                  <div className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">Duración</div>
                  <div className="font-mono text-xs font-bold text-white">14 días</div>
                  <div className="text-[10px] text-emerald-400 font-mono">0 € sin compromiso</div>
                </div>
              </div>

              {/* Selector de Plan */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Plan acordado para la prueba
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(PLAN_NAMES) as CRMPlan[]).map((planKey) => {
                    const isSelected = agreedPlan === planKey
                    return (
                      <button
                        key={planKey}
                        type="button"
                        onClick={() => setAgreedPlan(planKey)}
                        className={`p-2.5 rounded-xl text-left border text-xs transition ${
                          isSelected
                            ? 'bg-blue-600/20 border-blue-500 text-blue-300 ring-1 ring-blue-500'
                            : 'bg-slate-800/50 border-slate-700/60 text-slate-400 hover:bg-slate-800'
                        }`}
                      >
                        <div className="font-bold text-white">{PLAN_NAMES[planKey].split('(')[0]}</div>
                        <div className="text-[10px] font-mono text-emerald-400">
                          {PLAN_PRICING[planKey]} €/mes (post-piloto)
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Datos del Titular */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Nombre del Titular / Encargado *
                  </label>
                  <input
                    type="text"
                    value={signeeName}
                    onChange={(e) => setSigneeName(e.target.value)}
                    placeholder="Ej: Manuel García"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    WhatsApp para Comprobante
                  </label>
                  <input
                    type="tel"
                    value={signeePhone}
                    onChange={(e) => setSigneePhone(e.target.value)}
                    placeholder="654 000 000"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Cláusulas Claras y Sencillas */}
              <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/80 text-[11px] text-slate-400 space-y-1 leading-relaxed">
                <div className="flex items-center gap-1.5 font-bold text-slate-300 text-[11px]">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Condiciones del Acuerdo:</span>
                </div>
                <p>• Periodo de prueba gratuito del {formatDate(startDate)} al {formatDate(endDate)}.</p>
                <p>• Puesta en marcha inicial, adhesivos QR y soporte incluidos por Fluxo.</p>
                <p>• Al día 14, el titular decide libremente si formaliza el servicio o lo da de baja sin coste.</p>
              </div>

              {/* Área de Firma Táctil */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                    <span>Firma digital del titular (en pantalla)</span>
                  </label>
                  {hasSignature && (
                    <button
                      type="button"
                      onClick={clearSignature}
                      className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-1 transition"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Limpiar</span>
                    </button>
                  )}
                </div>

                <div className="relative w-full h-36 rounded-2xl bg-slate-950 border border-slate-700/80 overflow-hidden touch-none shadow-inner">
                  {!hasSignature && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-slate-500 text-xs">
                      <span>Firma aquí con el dedo o puntero</span>
                      <div className="w-3/4 border-b border-dashed border-slate-800 mt-6" />
                    </div>
                  )}

                  <canvas
                    ref={canvasRef}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="w-full h-full cursor-crosshair"
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Pie de Acciones */}
        {!isSuccess && (
          <div className="p-4 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
            >
              Cancelar
            </button>

            <button
              type="button"
              disabled={saving || !signeeName.trim()}
              onClick={handleConfirmAgreement}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold transition shadow-lg shadow-amber-500/20 disabled:opacity-50 flex items-center gap-1.5 active:scale-95 touch-manipulation"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{saving ? 'Guardando...' : 'Formalizar Acuerdo de Prueba'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
