'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  MonitorSmartphone,
  ImageDown,
  MessageCircle,
  X,
  ExternalLink,
  Store,
  Download,
} from 'lucide-react'
import {
  DIGITAL_CARD_H,
  DIGITAL_CARD_W,
  drawDigitalLocalCard,
  downloadCanvasPng,
  resolveAbsoluteUrl,
} from '@/lib/billing/print-canvas-renderer'
import { LocalBilling, PLAN_CONFIG } from '@/lib/billing/billing-calculations'

interface DigitalLocalQrStudioProps {
  locales: LocalBilling[]
}

/** Modo Pitch en Barra: vista a pantalla completa 100% limpia para enseñar el QR al dueño desde el móvil. */
function PitchFullscreen({
  local,
  url,
  onClose,
}: {
  local: LocalBilling
  url: string
  onClose: () => void
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    let cancelled = false
    const canvas = canvasRef.current
    if (!canvas) return
    // QR gigante pintado con la librería qrcode sobre canvas nativo
    import('qrcode').then((mod) => {
      if (cancelled) return
      mod.default.toCanvas(canvas, url, { width: 920, margin: 2, color: { dark: '#0b1120', light: '#ffffff' } })
    }).catch(() => {})
    return () => { cancelled = true }
  }, [url])

  return (
    <div className="fixed inset-0 z-[90] bg-slate-950 flex flex-col items-center justify-center p-8 overflow-y-auto">
      <div className="flex flex-col items-center max-w-2xl w-full">
        <p className="text-[11px] font-black tracking-[0.3em] text-emerald-400 uppercase mb-4">
          Prototipo Oficial · Carta Interactiva
        </p>
        <h2 className="text-4xl sm:text-5xl font-black text-white text-center leading-tight">
          {local.nombre}
        </h2>
        <canvas
          ref={canvasRef}
          className="mt-8 w-[min(78vw,420px)] h-auto rounded-3xl bg-white p-3 shadow-2xl"
          aria-label={`QR de ${local.nombre}`}
        />
        <p className="mt-6 text-lg font-bold text-cyan-300 font-mono">/p/{local.slug}</p>
        <div className="flex flex-wrap justify-center gap-3 mt-8 w-full">
          <a
            href={`/p/${local.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-sm font-bold flex items-center gap-2 apple-smooth border border-white/15"
          >
            <ExternalLink className="w-4 h-4" /> Abrir carta en vivo
          </a>
          <button
            onClick={onClose}
            className="px-5 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 text-sm font-semibold flex items-center gap-2 apple-smooth border border-white/10"
          >
            <X className="w-4 h-4" /> Salir del modo barra
          </button>
        </div>
      </div>
    </div>
  )
}

/** Estudio de QRs 100% digitales por local: Pitch en Barra + tarjeta 9:16 para WhatsApp. */
export function DigitalLocalQrStudio({ locales }: DigitalLocalQrStudioProps) {
  const [selectedId, setSelectedId] = useState<string>(locales[0]?.id ?? '')
  const [pitchOpen, setPitchOpen] = useState(false)
  const cardCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const [cardUrl, setCardUrl] = useState('')

  const selected = locales.find((l) => l.id === selectedId) ?? locales[0] ?? null

  useEffect(() => {
    setCardUrl(selected ? resolveAbsoluteUrl(`/p/${selected.slug}`) : '')
  }, [selected])

  useEffect(() => {
    const canvas = cardCanvasRef.current
    if (!canvas || !selected) return
    drawDigitalLocalCard(canvas, {
      localName: selected.nombre,
      slug: selected.slug,
      tagline: 'Prototipo Oficial · Carta Interactiva',
      targetUrl: cardUrl,
    })
  }, [selected, cardUrl])

  const handleDownloadCard = useCallback(() => {
    const canvas = cardCanvasRef.current
    if (!canvas || !selected) return
    const safe = selected.slug.replace(/[^a-z0-9-]/g, '')
    downloadCanvasPng(canvas, `tarjeta_digital_916_${safe}.png`)
  }, [selected])

  if (!selected) return null

  const whatsappText = encodeURIComponent(
    `Hola, soy Emiliano de Fluxo. Te adjunto la tarjeta con el acceso a tu carta digital (${selected.nombre}). Tu carta en vivo: /p/${selected.slug}. Escanea el QR y la tienes en 0,2 segundos. Plan actual: ${PLAN_CONFIG[selected.plan_type].label}.`
  )
  const whatsappUrl = `https://wa.me/${selected.owner_phone}?text=${whatsappText}`

  return (
    <div className="space-y-4">
      {/* Selector de local */}
      <div className="flex flex-wrap gap-2">
        {locales.map((l) => (
          <button
            key={l.id}
            onClick={() => setSelectedId(l.id)}
            className={`px-3.5 py-2 rounded-full text-[11px] font-bold border apple-smooth flex items-center gap-2 ${
              selectedId === l.id
                ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-200'
                : 'bg-white/[0.04] border-white/[0.08] text-slate-300 hover:bg-white/[0.08]'
            }`}
          >
            <Store className="w-3 h-3" />
            {l.nombre}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Pitch en barra */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-cyan-500/[0.08] to-emerald-500/[0.06] border border-white/[0.09] flex flex-col">
          <p className="text-xs font-black text-white flex items-center gap-2">
            <MonitorSmartphone className="w-4 h-4 text-cyan-400" />
            Modo Pitch en Barra (pantalla completa)
          </p>
          <p className="text-[11px] text-slate-400 mt-2 leading-snug flex-1">
            Oculta toda la interfaz del CRM y muestra el QR digital gigante del local en alto
            contraste: el dueño escanea directamente desde tu pantalla. Controles discretos para
            abrir la carta en vivo o salir.
          </p>
          <button
            onClick={() => setPitchOpen(true)}
            className="mt-4 w-full py-3 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold apple-smooth flex items-center justify-center gap-2 active:scale-[0.99] shadow-lg shadow-cyan-600/20"
          >
            <MonitorSmartphone className="w-4 h-4" />
            Entrar en modo pantalla completa
          </button>
        </div>

        {/* Tarjeta 9:16 */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-emerald-500/[0.08] to-teal-500/[0.06] border border-white/[0.09] flex flex-col">
          <p className="text-xs font-black text-white flex items-center gap-2">
            <ImageDown className="w-4 h-4 text-emerald-400" />
            Tarjeta Digital 9:16 · WhatsApp ({DIGITAL_CARD_W}×{DIGITAL_CARD_H})
          </p>
          <p className="text-[11px] text-slate-400 mt-2 leading-snug flex-1">
            Imagen vertical nivel agencia con el nombre del local, su QR centrado, la ruta{' '}
            <span className="font-mono text-emerald-300">/p/{selected.slug}</span> y los sellos de
            Fluxo. En 1 clic al chat con el mensaje comercial listo.
          </p>
          <div className="flex gap-2 mt-4">
            <button
              onClick={handleDownloadCard}
              className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold apple-smooth flex items-center justify-center gap-2 active:scale-[0.99]"
            >
              <Download className="w-4 h-4" />
              Exportar PNG
            </button>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-3 rounded-2xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.12] text-emerald-300 text-xs font-bold apple-smooth flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              Enviar por WhatsApp
            </a>
          </div>
        </div>
      </div>

      {/* Preview de la tarjeta */}
      <div className="p-4 rounded-2xl bg-slate-950/50 border border-white/[0.08] flex justify-center overflow-hidden">
        <canvas
          ref={cardCanvasRef}
          width={DIGITAL_CARD_W}
          height={DIGITAL_CARD_H}
          className="max-h-[440px] w-auto rounded-2xl shadow-2xl ring-1 ring-white/10"
          aria-label={`Tarjeta digital de ${selected.nombre}`}
        />
      </div>

      {pitchOpen && (
        <PitchFullscreen
          local={selected}
          url={cardUrl}
          onClose={() => setPitchOpen(false)}
        />
      )}
    </div>
  )
}
