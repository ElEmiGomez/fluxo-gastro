'use client'

import React, { useState } from 'react'
import {
  X,
  QrCode,
  Copy,
  CheckCircle2,
  Download,
  ExternalLink,
  Sparkles,
  ShieldCheck,
  Utensils
} from 'lucide-react'
import { FluxoLogo } from '@/components/common/FluxoLogo'

interface CRMTemplateQRModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CRMTemplateQRModal({ isOpen, onClose }: CRMTemplateQRModalProps) {
  if (!isOpen) return null

  const [copiedUrl, setCopiedUrl] = useState(false)
  const [downloading, setDownloading] = useState(false)

  // URL del template de Carta QR oficial (Local / Mesa X / Botones bloqueados)
  const targetUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/template-carta`
    : 'https://fluxo-gastro.vercel.app/template-carta'

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=360x360&margin=10&data=${encodeURIComponent(
    targetUrl
  )}`

  const handleCopyUrl = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(targetUrl)
      setCopiedUrl(true)
      setTimeout(() => setCopiedUrl(false), 2000)
    }
  }

  const handleDownloadQr = async () => {
    try {
      setDownloading(true)
      const res = await fetch(qrImageUrl)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'Fluxo_Template_Carta_QR.png')
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error('Error al descargar el QR:', e)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md bg-gradient-to-b from-slate-900/95 via-slate-900/95 to-slate-950/95 rounded-3xl p-5 sm:p-6 border border-white/10 shadow-2xl text-white backdrop-blur-2xl"
        style={{
          boxShadow: '0 20px 50px -10px rgba(0,0,0,0.7), 0 0 40px rgba(16, 185, 129, 0.15)'
        }}
      >
        {/* Botón Cerrar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
          title="Cerrar"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Encabezado */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/20">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-white">Template Carta QR</h3>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-black uppercase tracking-wider">
                Estático
              </span>
            </div>
            <p className="text-xs text-slate-400">Demostración oficial para reuniones y captación</p>
          </div>
        </div>

        {/* Tarjeta Visual del QR */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center shadow-inner relative overflow-hidden">
          {/* Logo Fluxo en Cabecera de la Tarjeta QR */}
          <div className="flex items-center justify-between w-full mb-3 px-1 border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <FluxoLogo size={22} />
              <span className="text-xs font-black text-slate-900">Fluxo Gastronomic</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                Mesa X
              </span>
            </div>
          </div>

          {/* Código QR Central */}
          <div className="p-2 bg-white rounded-xl border border-slate-200/80 shadow-xs relative">
            <img
              src={qrImageUrl}
              alt="QR Estático Template Carta"
              className="w-48 h-48 sm:w-56 sm:h-56 object-contain rounded-lg"
              loading="eager"
            />
          </div>

          {/* Subtítulo bajo el QR */}
          <div className="mt-3 text-center space-y-0.5">
            <p className="text-xs font-extrabold text-slate-900">
              Escanea para abrir la carta demostrativa
            </p>
            <p className="text-[11px] text-slate-500">
              Local: &quot;Local&quot; &middot; Acciones de Cocina y Mozo bloqueadas
            </p>
          </div>
        </div>

        {/* Especificación de Seguridad / Anti-Alucinación */}
        <div className="mt-4 p-3 rounded-2xl bg-white/[0.05] border border-white/10 space-y-1.5 text-xs text-slate-300">
          <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" />
            <span>100% Blindado contra Pedidos Ficticios</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Al escanear este QR en persona, el hostelero verá exactamente el diseño final de la carta. Si pulsa para pedir o llamar al mozo, verá una explicación comercial limpia sin enviar nada a cocina.
          </p>
        </div>

        {/* Enlace y Acciones Rápidas */}
        <div className="mt-4 space-y-2">
          {/* Fila de URL directa */}
          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-white/10 flex items-center justify-between gap-2">
            <span className="text-xs font-mono text-emerald-400 truncate flex-1 pl-1">
              {targetUrl}
            </span>
            <button
              onClick={handleCopyUrl}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                copiedUrl
                  ? 'bg-emerald-500 text-slate-950 font-black'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
            >
              {copiedUrl ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>¡Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar</span>
                </>
              )}
            </button>
          </div>

          {/* Botones de Acción: Abrir Demo + Descargar Imagen */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <a
              href={targetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center justify-center gap-1.5 border border-white/10 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Abrir Demo</span>
            </a>

            <button
              onClick={handleDownloadQr}
              disabled={downloading}
              className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/30 transition-all active:scale-95 disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{downloading ? 'Descargando...' : 'Descargar QR'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
