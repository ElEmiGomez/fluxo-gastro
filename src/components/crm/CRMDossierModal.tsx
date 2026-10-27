'use client'

import React from 'react'
import {
  X,
  Printer,
  Download,
  ShieldCheck,
  CheckCircle2,
  FileText,
  DollarSign,
  Building,
  HelpCircle,
  QrCode
} from 'lucide-react'
import { CRMLead, PLAN_PRICING } from '@/types/crm.types'

interface CRMDossierModalProps {
  lead: CRMLead | null
  isOpen: boolean
  onClose: () => void
}

export function CRMDossierModal({ lead, isOpen, onClose }: CRMDossierModalProps) {
  if (!isOpen || !lead) return null

  const targetPlan = lead.target_plan || 'carta_39'
  const monthlyPrice = PLAN_PRICING[targetPlan] || 39
  const dailyCost = (monthlyPrice / 30).toFixed(2)
  const ivaAmount = (monthlyPrice * 0.21).toFixed(2)
  const totalWithIva = (monthlyPrice * 1.21).toFixed(2)

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print()
    }
  }

  const demoUrl = `https://fluxo-gastro.vercel.app/carta/demo?ref=${encodeURIComponent(lead.name)}`
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&data=${encodeURIComponent(demoUrl)}`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-2 sm:p-4 animate-in fade-in select-none">
      <div className="w-full max-w-3xl rounded-3xl bg-slate-900 border border-slate-700 text-white shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* Barra superior de control (Se oculta en la impresión) */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Dossier Ejecutivo para Gestoría (A4)</h3>
              <p className="text-[11px] text-slate-400">
                Documento de 1 página con justificación fiscal y condiciones del piloto
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-lg shadow-blue-600/25 active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Hoja A4 Imprimible */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 bg-white text-slate-900 font-sans print:p-0 print:m-0 print:overflow-visible print:bg-white print:text-black">
          <style dangerouslySetInnerHTML={{ __html: `
            @media print {
              body {
                background: white !important;
                color: black !important;
              }
              .print\\:hidden {
                display: none !important;
              }
              @page {
                size: A4 portrait;
                margin: 14mm 14mm 14mm 14mm;
              }
              * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .page-container {
                box-shadow: none !important;
                border: none !important;
                padding: 0 !important;
                width: 100% !important;
                max-width: 100% !important;
                break-inside: avoid !important;
                page-break-inside: avoid !important;
              }
            }
          `}} />

          <div className="page-container space-y-6 max-w-2xl mx-auto">
            {/* Cabecera del Dossier */}
            <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
              <div className="flex items-center gap-3">
                {/* Isotipo Oficial Invertido para fondo blanco per AGENTS.md */}
                <div className="w-12 h-12 rounded-xl bg-white border-2 border-blue-600 flex items-center justify-center shadow-sm">
                  <span className="text-2xl font-black bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                    F
                  </span>
                </div>
                <div>
                  <h1 className="text-xl font-black tracking-tight text-slate-900">
                    FLUXO — GASTRONOMIC SYSTEM
                  </h1>
                  <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider">
                    Dossier Ejecutivo & Justificación de Gasto Fiscal
                  </p>
                </div>
              </div>

              <div className="text-right text-[11px] text-slate-600">
                <p className="font-semibold text-slate-900">Fecha: {new Date().toLocaleDateString('es-ES')}</p>
                <p>Ref: FLUXO-NOIA-{lead.id.slice(0, 8).toUpperCase()}</p>
                <p className="text-slate-500">contacto@fluxosystem.es</p>
              </div>
            </div>

            {/* Datos del Establecimiento */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Establecimiento Titular
                </span>
                <h2 className="text-base font-bold text-slate-900">{lead.name}</h2>
                <p className="text-slate-600">{lead.address} • {lead.zone}</p>
              </div>

              <div className="sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Modalidad Asignada
                </span>
                <p className="text-sm font-bold text-blue-700">
                  Plan {targetPlan.replace('_', ' ').toUpperCase()}
                </p>
                <p className="text-slate-500 font-mono">{monthlyPrice} €/mes + IVA</p>
              </div>
            </div>

            {/* 1. Justificación de Deducibilidad Fiscal para el Asesor */}
            <div className="space-y-2">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200 pb-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                1. Tratamiento Contable y Deducibilidad Tributaria
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-1">
                  <h4 className="font-bold text-emerald-900 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Gasto Corriente Operativo (100% Deducible)
                  </h4>
                  <p className="text-[11px] text-slate-700 leading-relaxed">
                    Suscripción de software en la nube (SaaS) directamente afecta a la actividad hostelera. Deducible íntegramente en IRPF (Régimen de Estimación Directa) o en el Impuesto sobre Sociedades como gasto de explotación.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200 space-y-1">
                  <h4 className="font-bold text-blue-900 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" /> IVA Soportado Desgravable (21%)
                  </h4>
                  <p className="text-[11px] text-slate-700 leading-relaxed">
                    Emisión de factura mensual oficial reglamentaria con NIF español y desglose de IVA (21%). Compensable en su totalidad en las liquidaciones periódicas de IVA (Modelo 303).
                  </p>
                </div>
              </div>
            </div>

            {/* 2. Retorno de Inversión (ROI) y Coste Diario */}
            <div className="space-y-2">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200 pb-1">
                <DollarSign className="w-4 h-4 text-blue-600" />
                2. Impacto en Tesorería y Amortización Inmediata
              </h3>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
                <div className="space-y-1 text-center sm:text-left">
                  <p className="font-semibold text-slate-800">
                    Coste unitario: <span className="font-mono font-bold text-blue-700">{dailyCost} € al día</span>
                  </p>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Se amortiza con la venta de una sola consumición adicional al día o mediante el ahorro en reimpresión anual de cartas físicas plastificadas.
                  </p>
                </div>

                <div className="shrink-0 p-2.5 rounded-lg bg-white border border-slate-300 text-center font-mono min-w-[170px]">
                  <div className="text-[10px] text-slate-500 uppercase">Base imponible</div>
                  <div className="text-sm font-bold text-slate-900">{monthlyPrice},00 €</div>
                  <div className="text-[10px] text-slate-500 mt-1">IVA (21%): {ivaAmount} €</div>
                  <div className="text-xs font-black text-blue-700 border-t border-slate-200 pt-1 mt-1">
                    Total: {totalWithIva} €/mes
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Condiciones de la Prueba Piloto de 14 Días (Garantía sin Riesgo) */}
            <div className="space-y-2">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200 pb-1">
                <Building className="w-4 h-4 text-amber-600" />
                3. Condiciones del Periodo de Prueba (14 Días)
              </h3>

              <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-slate-800 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-amber-900">✓ Sin permanencia:</span>
                  <span>El establecimiento no adquiere ningún compromiso contractual de renovación obligatoria.</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-amber-900">✓ Sin cobro anticipado:</span>
                  <span>No se requiere tarjeta de crédito, número de cuenta bancaria ni fianza durante los 14 días.</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-amber-900">✓ Balance asistido:</span>
                  <span>Al finalizar el día 14, el titular decide libremente formalizar la suscripción mensual o finalizar la prueba.</span>
                </div>
              </div>
            </div>

            {/* 4. Verificación y QR de Demo en Vivo */}
            <div className="pt-2 border-t-2 border-slate-900 flex items-center justify-between gap-4">
              <div className="space-y-1 text-[11px] text-slate-600">
                <p className="font-bold text-slate-900">Demostración en vivo y acceso al sistema:</p>
                <p>
                  Escanee el código QR adyacente con la cámara del móvil para consultar el catálogo interactivo adaptado para {lead.name}.
                </p>
                <p className="text-[10px] text-slate-400 font-mono">
                  Soporte técnico directo: (+34) 711 573 870 • Noia, Galicia
                </p>
              </div>

              <div className="shrink-0 flex flex-col items-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrImageUrl}
                  alt="QR Demo"
                  className="w-20 h-20 rounded-lg border border-slate-300 p-1 bg-white shadow-sm"
                />
                <span className="text-[9px] font-mono text-slate-500 mt-1">Escanear Demo</span>
              </div>
            </div>
          </div>
        </div>

        {/* Pie de modal */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between print:hidden">
          <span className="text-xs text-slate-400">
            Apto para adjuntar por WhatsApp o imprimir en mano para el gestor del local.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition"
          >
            Cerrar Dossier
          </button>
        </div>
      </div>
    </div>
  )
}
