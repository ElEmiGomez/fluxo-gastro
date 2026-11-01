'use client'

import React, { useState, useEffect } from 'react'
import {
  X,
  QrCode,
  Copy,
  CheckCircle2,
  Download,
  ExternalLink,
  ShieldCheck
} from 'lucide-react'
import { FluxoLogo } from '@/components/common/FluxoLogo'

export type PrototypeKey = 'template' | 'casamar'

export interface CustomPrototypeData {
  slug: string
  name: string
  isDynamic?: boolean
}

interface CRMTemplateQRModalProps {
  isOpen: boolean
  onClose: () => void
  initialPrototype?: PrototypeKey
  customPrototype?: CustomPrototypeData
}

export function CRMTemplateQRModal({
  isOpen,
  onClose,
  initialPrototype = 'template',
  customPrototype
}: CRMTemplateQRModalProps) {
  const [activePrototype, setActivePrototype] = useState<PrototypeKey>(initialPrototype)
  const [copiedUrl, setCopiedUrl] = useState(false)
  const [downloading, setDownloading] = useState(false)

  // Sincronizar activePrototype cuando cambia la prop initialPrototype o al abrir el modal
  useEffect(() => {
    if (initialPrototype) {
      setActivePrototype(initialPrototype)
    }
  }, [initialPrototype, isOpen])

  if (!isOpen) return null

  const isCustom = !!customPrototype
  const isTemplate = !isCustom && activePrototype === 'template'
  const origin = typeof window !== 'undefined'
    ? window.location.origin
    : 'https://fluxo-gastro.vercel.app'

  const targetPath = isCustom
    ? `/p/${customPrototype.slug}`
    : (isTemplate ? '/carta-prototipo' : '/carta-casamar')
  const targetUrl = `${origin}${targetPath}`

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=360x360&margin=10&data=${encodeURIComponent(
    targetUrl
  )}`

  const downloadFilename = isCustom
    ? `${customPrototype.slug.replace(/[^a-zA-Z0-9_-]/g, '_')}_Carta_QR.png`
    : (isTemplate ? 'Fluxo_Template_Carta_QR.png' : 'Casa_Mar_da_Vila_Carta_QR.png')

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
      link.setAttribute('download', downloadFilename)
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
          boxShadow: isTemplate
            ? '0 20px 50px -10px rgba(0,0,0,0.7), 0 0 40px rgba(16, 185, 129, 0.15)'
            : '0 20px 50px -10px rgba(0,0,0,0.7), 0 0 40px rgba(6, 182, 212, 0.15)'
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

        {/* Selector de Pestañas (Segmented Control - Apple Glassmorphism) */}
        {!isCustom && (
          <div className="grid grid-cols-2 p-1 mr-12 bg-white/10 rounded-2xl border border-white/10 backdrop-blur-md mb-4">
            <button
              type="button"
              onClick={() => setActivePrototype('template')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                isTemplate
                  ? 'bg-white/20 text-white shadow-md border border-white/20 backdrop-blur-lg'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <FluxoLogo size={14} />
              <span>Template General</span>
            </button>
            <button
              type="button"
              onClick={() => setActivePrototype('casamar')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                !isTemplate
                  ? 'bg-cyan-500/20 text-cyan-300 shadow-md border border-cyan-400/30 backdrop-blur-lg'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <img
                src="/images/casamar-logo.png"
                alt="Casa Mar"
                className="w-3.5 h-3.5 rounded-full object-cover"
              />
              <span>Casa Mar da Vila</span>
            </button>
          </div>
        )}

        {/* Encabezado */}
        <div className="flex items-center gap-3 mb-4">
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg transition-colors ${
              isCustom
                ? 'bg-blue-500/20 border border-blue-400/30 text-blue-400 shadow-blue-500/20'
                : isTemplate
                ? 'bg-emerald-500/20 border border-emerald-400/30 text-emerald-400 shadow-emerald-500/20'
                : 'bg-cyan-500/20 border border-cyan-400/30 text-cyan-400 shadow-cyan-500/20'
            }`}
          >
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-white">
                {isCustom ? `${customPrototype.name} QR` : isTemplate ? 'Template Carta QR' : 'Casa Mar da Vila QR'}
              </h3>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                  isCustom
                    ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                    : isTemplate
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                }`}
              >
                {isCustom ? 'Aprovisionado' : isTemplate ? 'Estático' : 'Piloto'}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {isCustom
                ? `Tarjeta de sala lista para imprimir y escanear en ${customPrototype.name}`
                : isTemplate
                ? 'Demostración oficial para reuniones y captación'
                : 'Carta digital con identidad oficial y carta real'}
            </p>
          </div>
        </div>

        {/* Tarjeta Visual del QR */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center shadow-inner relative overflow-hidden">
          {/* Logo y Nombre en Cabecera de la Tarjeta QR */}
          <div className="flex items-center justify-between w-full mb-3 px-1 border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              {isCustom ? (
                <>
                  <FluxoLogo size={22} />
                  <span className="text-xs font-black text-slate-900">{customPrototype.name}</span>
                </>
              ) : isTemplate ? (
                <>
                  <FluxoLogo size={22} />
                  <span className="text-xs font-black text-slate-900">Fluxo Gastronomic</span>
                </>
              ) : (
                <>
                  <img
                    src="/images/casamar-logo.png"
                    alt="Casa Mar da Vila"
                    className="w-5 h-5 rounded-full object-cover border border-slate-200"
                  />
                  <span className="text-xs font-black text-slate-900">Casa Mar da Vila</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                {isCustom ? 'Mesa 1' : isTemplate ? 'Mesa X' : 'Mesa 1'}
              </span>
            </div>
          </div>

          {/* Código QR Central */}
          <div className="p-2 bg-white rounded-xl border border-slate-200/80 shadow-xs relative">
            <img
              src={qrImageUrl}
              alt={isCustom ? `QR ${customPrototype.name}` : isTemplate ? 'QR Estático Template Carta' : 'QR Casa Mar da Vila'}
              className="w-48 h-48 sm:w-56 sm:h-56 object-contain rounded-lg"
              loading="eager"
            />
          </div>

          {/* Subtítulo bajo el QR */}
          <div className="mt-3 text-center space-y-0.5">
            <p className="text-xs font-extrabold text-slate-900">
              {isCustom
                ? `Escanea para acceder a la carta de ${customPrototype.name}`
                : isTemplate
                ? 'Escanea para abrir la carta demostrativa'
                : 'Escanea para abrir la carta de Casa Mar da Vila'}
            </p>
            <p className="text-[11px] text-slate-500">
              {isCustom
                ? `Local: "${customPrototype.name}" · Carta escaneada y sincronizada en tiempo real`
                : isTemplate
                ? 'Local: "Local" · Acciones de Cocina y Mozo bloqueadas'
                : 'Local: "Casa Mar da Vila" · Carta gastronómica en alta fidelidad'}
            </p>
          </div>
        </div>

        {/* Especificación de Seguridad / Anti-Alucinación */}
        <div className="mt-4 p-3 rounded-2xl bg-white/[0.05] border border-white/10 space-y-1.5 text-xs text-slate-300">
          <div
            className={`flex items-center gap-1.5 font-bold text-[11px] ${
              isTemplate ? 'text-emerald-400' : 'text-cyan-400'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" />
            <span>
              {isTemplate
                ? '100% Blindado contra Pedidos Ficticios'
                : 'Demostración de Marca Verificada'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            {isTemplate
              ? 'Al escanear este QR en persona, el hostelero verá exactamente el diseño final de la carta. Si pulsa para pedir o llamar al mozo, verá una explicación comercial limpia sin enviar nada a cocina.'
              : 'Al escanear este QR, el cliente accede directamente al prototipo con el logotipo oficial, la selección gastronómica de la ría y el diseño exclusivo para Casa Mar da Vila.'}
          </p>
        </div>

        {/* Enlace y Acciones Rápidas */}
        <div className="mt-4 space-y-2">
          {/* Fila de URL directa */}
          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-white/10 flex items-center justify-between gap-2">
            <span
              className={`text-xs font-mono truncate flex-1 pl-1 ${
                isTemplate ? 'text-emerald-400' : 'text-cyan-400'
              }`}
            >
              {targetUrl}
            </span>
            <button
              onClick={handleCopyUrl}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                copiedUrl
                  ? isTemplate
                    ? 'bg-emerald-500 text-slate-950 font-black'
                    : 'bg-cyan-500 text-slate-950 font-black'
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
              className={`py-2.5 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 shadow-lg transition-all active:scale-95 disabled:opacity-50 text-slate-950 ${
                isTemplate
                  ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
                  : 'bg-cyan-500 hover:bg-cyan-400 shadow-cyan-500/30'
              }`}
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
