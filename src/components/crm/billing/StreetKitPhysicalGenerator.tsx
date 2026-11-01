'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Download, QrCode, ImageIcon, Eye, Store, Sparkles } from 'lucide-react'
import {
  StreetKitFormat,
  STREET_KIT_SIZES,
  drawStreetKit,
  downloadCanvasPng,
  resolveAbsoluteUrl,
} from '@/lib/billing/print-canvas-renderer'
import { CASAMAR_LOGO_DATA_URI } from '@/lib/billing/casamar-logo-data'

export type KitModelPreset = 'fluxo' | 'casamar'

const PRESETS: Array<{ id: KitModelPreset; label: string; sub: string; path: string }> = [
  { id: 'fluxo', label: 'Prototipo General Fluxo', sub: 'Isotipo F. blanco oficial', path: '/carta-prototipo' },
  { id: 'casamar', label: 'Casa Mar da Vila', sub: 'Logotipo oficial de Casa Mar', path: '/casamar-da-vila' },
]

const FORMATS: Array<{ id: StreetKitFormat; label: string; hint: string; badge: string }> = [
  { id: 'A5', label: 'Lámina A5', hint: '1748 × 2480 px · plastificable', badge: 'Formato A' },
  { id: 'A6', label: 'Lámina A6', hint: '1240 × 1748 px · plastificable', badge: 'Formato A' },
  { id: 'A4_TENT', label: 'Caballete A4', hint: '2480 × 3508 px · doble cara', badge: 'Formato B' },
]

/**
 * Generador del Soporte Físico Plastificable para el QR Maestro y QRs de locales.
 * Todo el arte se dibuja en Canvas 2D nativo a 300 DPI con interruptor
 * includeQrCode (QR real o marco vacío) y selector de modelo (Fluxo vs Casa Mar da Vila).
 */
export function StreetKitPhysicalGenerator() {
  const [modelPreset, setModelPreset] = useState<KitModelPreset>('fluxo')
  const [format, setFormat] = useState<StreetKitFormat>('A5')
  const [includeQrCode, setIncludeQrCode] = useState(true)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [casamarImg, setCasamarImg] = useState<HTMLImageElement | null>(null)

  const activePreset = PRESETS.find((p) => p.id === modelPreset) || PRESETS[0]
  const targetUrl = resolveAbsoluteUrl(activePreset.path)

  // Cargar imagen del logo de Casa Mar da Vila de forma segura en navegador
  useEffect(() => {
    if (typeof window === 'undefined') return
    const img = new window.Image()
    img.crossOrigin = 'anonymous'
    img.src = CASAMAR_LOGO_DATA_URI
    img.onload = () => setCasamarImg(img)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const bottomLogo = modelPreset === 'casamar' ? casamarImg : null
    drawStreetKit(canvas, format, includeQrCode, targetUrl, bottomLogo)
  }, [format, includeQrCode, targetUrl, modelPreset, casamarImg])

  const handleDownload = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const suffix = format === 'A4_TENT' ? 'caballete_a4' : format.toLowerCase().replace('tent', '')
    const prefix = modelPreset === 'casamar' ? 'casamar_da_vila' : 'fluxo'
    downloadCanvasPng(
      canvas,
      `${prefix}_kit_calle_${suffix}_${includeQrCode ? 'con_qr' : 'marco_vacio'}.png`
    )
  }, [format, includeQrCode, modelPreset])

  const dims = STREET_KIT_SIZES[format]

  return (
    <div className="space-y-4">
      {/* Selector de Modelo: Fluxo vs Casa Mar da Vila */}
      <div className="p-1.5 rounded-2xl bg-white/[0.05] border border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-2">
        {PRESETS.map((p) => {
          const isSelected = modelPreset === p.id
          return (
            <button
              key={p.id}
              onClick={() => setModelPreset(p.id)}
              className={`p-3 rounded-xl border text-left transition-all flex items-center gap-3 ${
                isSelected
                  ? p.id === 'casamar'
                    ? 'bg-cyan-500/20 border-cyan-400/50 shadow-lg shadow-cyan-500/10'
                    : 'bg-blue-600/20 border-blue-400/50 shadow-lg shadow-blue-500/10'
                  : 'bg-transparent border-transparent hover:bg-white/[0.05]'
              }`}
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  isSelected
                    ? p.id === 'casamar'
                      ? 'bg-cyan-500 text-slate-950 font-black'
                      : 'bg-blue-600 text-white font-black'
                    : 'bg-white/10 text-slate-400'
                }`}
              >
                {p.id === 'casamar' ? (
                  <Store className="w-4 h-4" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className={`text-xs font-extrabold ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                    {p.label}
                  </p>
                  <span
                    className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded-md ${
                      isSelected
                        ? p.id === 'casamar'
                          ? 'bg-cyan-400/20 text-cyan-300'
                          : 'bg-blue-400/20 text-blue-300'
                        : 'bg-white/5 text-slate-400'
                    }`}
                  >
                    {p.id === 'casamar' ? 'Logo Local' : 'Isotipo F.'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5 truncate">{p.sub}</p>
              </div>
            </button>
          )
        })}
      </div>

      {/* Selectores de Formato */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {FORMATS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFormat(f.id)}
            className={`p-3 rounded-2xl border text-left apple-smooth ${
              format === f.id
                ? 'bg-cyan-500/15 border-cyan-500/40'
                : 'bg-white/[0.04] border-white/[0.08] hover:bg-white/[0.07]'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <p className={`text-xs font-bold min-w-0 leading-snug ${format === f.id ? 'text-cyan-200' : 'text-white'}`}>
                {f.label}
              </p>
              <span className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-white/10 text-slate-300 flex-shrink-0">
                {f.badge}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1 font-mono leading-snug">{f.hint}</p>
          </button>
        ))}
      </div>

      {/* Interruptor QR + info de destino */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white/[0.04] border border-white/[0.08]">
        <div className="flex items-start gap-3">
          <button
            role="switch"
            aria-checked={includeQrCode}
            onClick={() => setIncludeQrCode((v) => !v)}
            className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60 ${
              includeQrCode ? 'bg-emerald-500' : 'bg-slate-600'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                includeQrCode ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
          <div>
            <p className="text-xs font-bold text-white flex items-center gap-2">
              <QrCode className="w-3.5 h-3.5 text-emerald-400" />
              Incluir QR funcional de demostración
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">
              {includeQrCode
                ? 'QR real escaneable apuntando a la carta: '
                : 'Marco blanco vacío calibrado para colocar cualquier QR (Canva o pegatina): '}
              <span className="font-mono text-cyan-300">{targetUrl}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[9px] text-slate-500 flex items-center gap-1 px-2 py-1 rounded-full bg-white/[0.04] border border-white/[0.08]">
            <ImageIcon className="w-3 h-3" /> 300 DPI · Canvas nativo
          </span>
          <span className="text-[9px] text-slate-500 flex items-center gap-1 px-2 py-1 rounded-full bg-white/[0.04] border border-white/[0.08]">
            <Eye className="w-3 h-3" /> {dims.w}×{dims.h} px
          </span>
        </div>
      </div>

      {/* Preview escalada */}
      <div className="p-4 rounded-2xl bg-slate-950/50 border border-white/[0.08] flex justify-center">
        <canvas
          ref={canvasRef}
          className={`rounded-xl shadow-2xl ring-1 ring-white/10 w-auto max-w-full ${
            format === 'A4_TENT'
              ? 'max-h-[680px]'
              : 'max-h-[560px]'
          }`}
          aria-label={`Vista previa Kit de Calle ${format}`}
        />
      </div>

      {/* Descarga */}
      <button
        onClick={handleDownload}
        className="w-full py-3 rounded-2xl bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white text-xs font-bold apple-smooth flex items-center justify-center gap-2 active:scale-[0.99] shadow-lg shadow-cyan-600/20"
      >
        <Download className="w-4 h-4" />
        Descargar PNG a máxima resolución ({dims.w}×{dims.h}) · {modelPreset === 'casamar' ? 'Casa Mar da Vila' : 'Fluxo'}
      </button>
    </div>
  )
}
