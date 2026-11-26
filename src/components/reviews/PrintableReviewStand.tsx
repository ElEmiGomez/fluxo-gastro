'use client'

import React, { useEffect, useMemo, useState } from 'react'
import QRCode from 'qrcode'
import {
  Printer,
  Copy,
  Check,
  Smartphone,
  ExternalLink,
  ImageOff,
  Image as ImageIcon,
  FlipHorizontal2,
  QrCode,
} from 'lucide-react'

interface PrintableReviewStandProps {
  slug: string
  restaurantName: string
  city: string
  logoUrl?: string
  googleReviewUrl: string
  enableGatekeeper: boolean
  isDefaultTemplate?: boolean
  embedded?: boolean
}

function QrVectorSvg({
  value,
  sizeMm,
}: {
  value: string
  sizeMm: number
}) {
  const qr = useMemo(() => {
    const safeValue = value && value.trim().length > 0 ? value.trim() : 'https://fluxo.es/r/predeterminada'
    return QRCode.create(safeValue, { errorCorrectionLevel: 'H' })
  }, [value])

  const modules = qr.modules.size
  const data = qr.modules.data

  const paths = useMemo(() => {
    const chunks: string[] = []
    for (let row = 0; row < modules; row++) {
      for (let col = 0; col < modules; col++) {
        if (data[row * modules + col]) {
          chunks.push(`M${col},${row}h1v1h-1z`)
        }
      }
    }
    return chunks.join('')
  }, [modules, data])

  return (
    <svg
      viewBox={`0 0 ${modules} ${modules}`}
      width={`${sizeMm}mm`}
      height={`${sizeMm}mm`}
      shapeRendering="crispEdges"
      role="img"
      aria-label={`Código QR hacia ${value}`}
      style={{
        display: 'block',
        width: `${sizeMm}mm`,
        height: `${sizeMm}mm`,
        backgroundColor: '#ffffff',
      }}
    >
      <rect x={0} y={0} width={modules} height={modules} fill="#ffffff" />
      <path d={paths} fill="#111827" />
    </svg>
  )
}

function GoogleFourColorRing({
  diameterMm,
  strokePx = 6,
  children,
}: {
  diameterMm: number
  strokePx?: number
  children: React.ReactNode
}) {
  // SVG viewBox 0..200, center (100,100), radius r = 93 so stroke stays crisp inside bounds
  const r = 93
  const c = 100
  return (
    <div
      style={{
        position: 'relative',
        width: `${diameterMm}mm`,
        height: `${diameterMm}mm`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <svg
        viewBox="0 0 200 200"
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          display: 'block',
        }}
      >
        {/* Cuadrante superior izquierdo (9h -> 12h): Azul Google */}
        <path
          d={`M ${c - r} ${c} A ${r} ${r} 0 0 1 ${c} ${c - r}`}
          fill="none"
          stroke="#4285F4"
          strokeWidth={strokePx}
          strokeLinecap="butt"
        />
        {/* Cuadrante superior derecho (12h -> 3h): Rojo Google */}
        <path
          d={`M ${c} ${c - r} A ${r} ${r} 0 0 1 ${c + r} ${c}`}
          fill="none"
          stroke="#EA4335"
          strokeWidth={strokePx}
          strokeLinecap="butt"
        />
        {/* Cuadrante inferior derecho (3h -> 6h): Amarillo Google */}
        <path
          d={`M ${c + r} ${c} A ${r} ${r} 0 0 1 ${c} ${c + r}`}
          fill="none"
          stroke="#FBBC05"
          strokeWidth={strokePx}
          strokeLinecap="butt"
        />
        {/* Cuadrante inferior izquierdo (6h -> 9h): Verde Google */}
        <path
          d={`M ${c} ${c + r} A ${r} ${r} 0 0 1 ${c - r} ${c}`}
          fill="none"
          stroke="#34A853"
          strokeWidth={strokePx}
          strokeLinecap="butt"
        />
      </svg>
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {children}
      </div>
    </div>
  )
}

function FilledGoldStars({ sizePx = 15, gapPx = 3 }: { sizePx?: number; gapPx?: number }) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: `${gapPx}px`,
      }}
      aria-label="5 estrellas"
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <svg
          key={n}
          viewBox="0 0 24 24"
          width={sizePx}
          height={sizePx}
          aria-hidden="true"
          style={{ display: 'block' }}
        >
          <path
            fill="#FBBC05"
            stroke="#FBBC05"
            strokeWidth="1.2"
            strokeLinejoin="round"
            d="M12 2.5l2.92 5.92 6.53.95-4.72 4.6 1.12 6.5L12 17.4l-5.85 3.07 1.12-6.5-4.72-4.6 6.53-.95L12 2.5z"
          />
        </svg>
      ))}
    </div>
  )
}

function DiscreetNfcIcon({ sizePx = 13, color = '#64748b' }: { sizePx?: number; color?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={sizePx}
      height={sizePx}
      fill="none"
      stroke={color}
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ display: 'block', flexShrink: 0 }}
    >
      <path d="M6 8.5a6.5 6.5 0 0 1 0 7" />
      <path d="M9.5 6a10 10 0 0 1 0 12" />
      <path d="M13 3.5a13.5 13.5 0 0 1 0 17" />
      <circle cx="4" cy="12" r="1.2" fill={color} stroke="none" />
    </svg>
  )
}

function FluxoInvertedMark() {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
      <span
        style={{
          width: '18px',
          height: '18px',
          borderRadius: '5px',
          backgroundColor: '#ffffff',
          border: '1px solid #cbd5e1',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 900,
          fontSize: '11px',
          backgroundImage: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        F
      </span>
      <span
        style={{
          fontSize: '9.5px',
          fontWeight: 800,
          letterSpacing: '0.09em',
          color: '#64748b',
          textTransform: 'uppercase',
        }}
      >
        Fluxo
      </span>
    </span>
  )
}

export function PrintableReviewStand({
  slug,
  restaurantName,
  city,
  logoUrl,
  googleReviewUrl,
  enableGatekeeper,
  isDefaultTemplate = false,
  embedded = false,
}: PrintableReviewStandProps) {
  const [format, setFormat] = useState<'stand_10x15' | 'card_pvc'>('stand_10x15')
  const [language, setLanguage] = useState<'es' | 'gl' | 'bilingual'>('es')
  const [hideLogo, setHideLogo] = useState<boolean>(isDefaultTemplate || !logoUrl)
  const [showBackSide, setShowBackSide] = useState<boolean>(true)
  const [logoError, setLogoError] = useState<boolean>(false)
  const [origin, setOrigin] = useState('https://fluxo.es')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.origin) {
      setOrigin(window.location.origin)
    }
  }, [])

  useEffect(() => {
    setLogoError(false)
    setHideLogo(isDefaultTemplate || !logoUrl)
  }, [logoUrl, isDefaultTemplate])

  const cleanOrigin = origin.replace(/\/+$/, '')
  const targetUrl = isDefaultTemplate && googleReviewUrl
    ? googleReviewUrl
    : `${cleanOrigin}/r/${slug}`

  const showCircularLogo = Boolean(logoUrl && !hideLogo && !logoError)

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(targetUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // ignore clipboard errors
    }
  }

  const copyText = {
    es: {
      thanks: 'GRACIAS',
      subtitle: 'por ayudarnos a mejorar',
      importance: 'Tu opinión es muy importante para nosotros',
      nfcPrompt: 'Acerca tu móvil o escanea el QR',
      backTitle: '¿CÓMO USARLO?',
      backSubtitle: 'Deja tu reseña en 5 segundos',
      stepNfcTitle: '1. Con NFC (sin abrir cámara)',
      stepNfcDesc: 'Acerca la parte trasera de tu móvil al centro de la cara delantera y pulsa la notificación.',
      stepNfcHint: 'iPhone: parte superior (cámara) · Android: centro trasero',
      stepQrTitle: '2. Con Código QR (cámara)',
      stepQrDesc: 'Abre la cámara de tu móvil, apunta al código QR de la cara delantera y toca el enlace.',
      stepDone: 'Elige tus estrellas en Google y pulsa Publicar',
    },
    gl: {
      thanks: 'GRAZAS',
      subtitle: 'por axudarnos a mellorar',
      importance: 'A túa opinión é moi importante para nós',
      nfcPrompt: 'Achega o teu móbil ou escanea o QR',
      backTitle: 'COMO USALO?',
      backSubtitle: 'Deixa a túa reseña en 5 segundos',
      stepNfcTitle: '1. Con NFC (sen abrir cámara)',
      stepNfcDesc: 'Achega a parte traseira do teu móbil ao centro da cara dianteira e preme a notificación.',
      stepNfcHint: 'iPhone: parte superior (cámara) · Android: centro traseiro',
      stepQrTitle: '2. Con Código QR (cámara)',
      stepQrDesc: 'Abre a cámara do teu móbil, apunta ao código QR da cara dianteira e toca a ligazón.',
      stepDone: 'Elixe as túas estrelas en Google e preme Publicar',
    },
    bilingual: {
      thanks: 'GRACIAS',
      subtitle: 'por ayudarnos a mejorar · por axudarnos a mellorar',
      importance: 'Tu opinión es muy importante para nosotros',
      nfcPrompt: 'Acerca tu móvil o escanea el QR',
      backTitle: '¿CÓMO USARLO? · COMO USALO?',
      backSubtitle: '5 segundos · NFC o QR',
      stepNfcTitle: '1. Acerca tu móvil (NFC)',
      stepNfcDesc: 'Toca el centro delantero con tu teléfono desbloqueado (iPhone arriba · Android centro) y abre el aviso.',
      stepNfcHint: 'Sin abrir apps · Sen abrir apps',
      stepQrTitle: '2. Escanea el QR (Cámara)',
      stepQrDesc: 'Abre la cámara, apunta al QR delantero y pulsa el enlace de Google Maps.',
      stepDone: 'Valora tu visita y pulsa Publicar · Grazas!',
    },
  }[language]

  return (
    <div
      className={
        embedded
          ? 'space-y-6 print:bg-white print:p-0'
          : 'min-h-screen bg-slate-100 py-8 px-4 print:bg-white print:p-0'
      }
    >
      <style>{`
        @media print {
          @page {
            margin: 10mm;
          }
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            background: #ffffff !important;
          }
        }
      `}</style>

      {/* Panel de control (oculto al imprimir) */}
      <div
        className={`${
          embedded ? 'w-full' : 'max-w-4xl mx-auto mb-8'
        } bg-white rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-5 print:hidden`}
      >
        {/* Cabecera */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
              Expositor Minimalista NFC + QR — {isDefaultTemplate ? 'Versión Predeterminada' : restaurantName}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              {city ? `${city} · ` : ''}Modo activo:{' '}
              <strong className="text-blue-700">
                {enableGatekeeper ? 'Filtro Inteligente (Opción 1)' : 'Enlace Directo a Google Maps (Por defecto)'}
              </strong>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {embedded && (
              <a
                href={`/admin/print-review-stand/${isDefaultTemplate ? 'predeterminada' : slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition-colors whitespace-nowrap"
              >
                <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                <span>Vista limpia para imprimir</span>
              </a>
            )}
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-sm transition-colors whitespace-nowrap"
            >
              <Printer className="w-4 h-4 shrink-0" />
              <span>Imprimir / Guardar PDF</span>
            </button>
          </div>
        </div>

        {/* Controles en rejilla simétrica 2x2 con botones de altura uniforme en 1 línea */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 1. Formato físico */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Formato físico
            </label>
            <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-slate-100 border border-slate-200">
              <button
                type="button"
                onClick={() => setFormat('stand_10x15')}
                className={`h-9 px-3 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  format === 'stand_10x15'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                Peana 10×15 cm
              </button>
              <button
                type="button"
                onClick={() => setFormat('card_pvc')}
                className={`h-9 px-3 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  format === 'card_pvc'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                Tarjeta PVC
              </button>
            </div>
          </div>

          {/* 2. Idioma del soporte */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Idioma del soporte
            </label>
            <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-slate-100 border border-slate-200">
              {(['es', 'gl', 'bilingual'] as const).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setLanguage(lang)}
                  className={`h-9 px-3 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                    language === lang
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  {lang === 'es' ? 'Español' : lang === 'gl' ? 'Galego' : 'ES / GL'}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Parte de atrás (Reverso) */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Parte de atrás (Reverso)
            </label>
            <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-slate-100 border border-slate-200">
              <button
                type="button"
                onClick={() => setShowBackSide(true)}
                className={`h-9 px-3 rounded-lg text-xs font-bold transition-all inline-flex items-center justify-center gap-1.5 whitespace-nowrap ${
                  showBackSide
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <FlipHorizontal2 className="w-3.5 h-3.5 shrink-0" />
                <span>Con instrucciones</span>
              </button>
              <button
                type="button"
                onClick={() => setShowBackSide(false)}
                className={`h-9 px-3 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  !showBackSide
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                Solo cara delantera
              </button>
            </div>
          </div>

          {/* 4. Logo del local */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Logo superior
            </label>
            <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-slate-100 border border-slate-200">
              <button
                type="button"
                onClick={() => setHideLogo(true)}
                className={`h-9 px-3 rounded-lg text-xs font-bold transition-all inline-flex items-center justify-center gap-1.5 whitespace-nowrap ${
                  !logoUrl || hideLogo
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <ImageOff className="w-3.5 h-3.5 shrink-0" />
                <span>Sin logo</span>
              </button>
              <button
                type="button"
                onClick={() => setHideLogo(false)}
                disabled={!logoUrl}
                className={`h-9 px-3 rounded-lg text-xs font-bold transition-all inline-flex items-center justify-center gap-1.5 whitespace-nowrap disabled:opacity-45 disabled:cursor-not-allowed ${
                  logoUrl && !hideLogo
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5 shrink-0" />
                <span>{logoUrl ? 'Con logo circular' : 'Sin logo cargado'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Enlace exacto para grabar en el chip NFC con NFC Tools */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-blue-600 shrink-0" />
              <span>URL exacta para grabar en el chip NFC (app NFC Tools)</span>
            </span>
            {!isDefaultTemplate && (
              <a
                href={`/r/${slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-blue-600 hover:underline inline-flex items-center gap-1 whitespace-nowrap"
              >
                <span>Probar /r/{slug}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="url"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              aria-label="Dominio público de producción"
              className="flex-1 h-10 rounded-xl border border-slate-300 bg-white px-3 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://tudominio.com"
            />
            <button
              type="button"
              onClick={handleCopyUrl}
              className="inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors whitespace-nowrap shrink-0"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copiado' : isDefaultTemplate ? 'Copiar URL' : `Copiar /r/${slug}`}</span>
            </button>
          </div>
          <p className="text-[11px] text-slate-500">
            Enlace grabado en el QR: <code className="font-mono text-slate-800 break-all">{targetUrl}</code>{' '}
            → destino Google: <code className="font-mono text-slate-600 break-all">{googleReviewUrl}</code>
          </p>
        </div>
      </div>

      {/* Arte imprimible (dimensiones físicas exactas en mm/px, inmunes a rem global) */}
      <div className="flex flex-wrap justify-center items-start gap-6 print:gap-4">
        {format === 'stand_10x15' ? (
          <>
          <article
            data-testid="review-stand-10x15"
            style={{
              width: '100mm',
              height: '150mm',
              backgroundColor: '#ffffff',
              fontSize: '16px',
              boxSizing: 'border-box',
              paddingTop: showCircularLogo ? '5.5mm' : '9mm',
              paddingBottom: '17mm',
              paddingLeft: '6mm',
              paddingRight: '6mm',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'space-between',
              textAlign: 'center',
              breakInside: 'avoid',
              pageBreakInside: 'avoid',
            }}
            className="shadow-2xl border border-slate-200 print:shadow-none print:border print:border-dashed print:border-slate-300 overflow-hidden"
          >
            {/* Bloque superior: Logo circular opcional + Titular limpio */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                width: '100%',
              }}
            >
              {showCircularLogo && (
                <div
                  style={{
                    width: '17mm',
                    height: '17mm',
                    borderRadius: '9999px',
                    overflow: 'hidden',
                    border: '1px solid #e2e8f0',
                    marginBottom: '3mm',
                    backgroundColor: '#ffffff',
                    flexShrink: 0,
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={logoUrl}
                    alt={restaurantName}
                    onError={() => setLogoError(true)}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                    }}
                  />
                </div>
              )}

              <h2
                style={{
                  margin: 0,
                  fontSize: '28px',
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  lineHeight: 1.1,
                  color: '#0f172a',
                  textTransform: 'uppercase',
                }}
              >
                {copyText.thanks}
              </h2>
              <p
                style={{
                  margin: '1.6mm 0 0 0',
                  fontSize: language === 'bilingual' ? '14px' : '18px',
                  fontWeight: 500,
                  lineHeight: 1.25,
                  color: '#1f2937',
                  letterSpacing: '0.01em',
                }}
              >
                {copyText.subtitle}
              </p>
            </div>

            {/* Centro: Aro circular 4 colores Google + QR vectorial nítido */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: '1mm',
                marginBottom: '1mm',
              }}
            >
              <GoogleFourColorRing diameterMm={68} strokePx={8}>
                <QrVectorSvg value={targetUrl} sizeMm={39} />
              </GoogleFourColorRing>
            </div>

            {/* Bloque inferior (con 17mm libres abajo para la peana de madera natural) */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                width: '100%',
              }}
            >
              <FilledGoldStars sizePx={22} gapPx={4} />
              <p
                style={{
                  margin: '2.4mm 0 0 0',
                  fontSize: '14px',
                  fontWeight: 600,
                  lineHeight: 1.3,
                  color: '#0f172a',
                }}
              >
                {copyText.importance}
              </p>

              <div
                style={{
                  marginTop: '2.6mm',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <DiscreetNfcIcon sizePx={16} color="#475569" />
                <span
                  style={{
                    fontSize: '12.5px',
                    fontWeight: 600,
                    lineHeight: 1.2,
                    color: '#334155',
                    letterSpacing: '0.01em',
                  }}
                >
                  {copyText.nfcPrompt}
                </span>
              </div>
            </div>
          </article>

          {/* REVERSO 10x15 (Parte de atrás con instrucciones claras de uso NFC + QR) */}
          {showBackSide && (
            <article
              data-testid="review-stand-10x15-back"
              style={{
                width: '100mm',
                height: '150mm',
                backgroundColor: '#ffffff',
                fontSize: '15px',
                boxSizing: 'border-box',
                paddingTop: '8mm',
                paddingBottom: '17mm',
                paddingLeft: '6mm',
                paddingRight: '6mm',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'space-between',
                textAlign: 'center',
                breakInside: 'avoid',
                pageBreakInside: 'avoid',
                position: 'relative',
              }}
              className="shadow-2xl border border-slate-200 print:shadow-none print:border print:border-dashed print:border-slate-300 overflow-hidden"
            >
              {/* Barra superior minimalista con los 4 colores de Google */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '2.8mm',
                  display: 'flex',
                }}
              >
                <span style={{ flex: 1, backgroundColor: '#4285F4' }} />
                <span style={{ flex: 1, backgroundColor: '#EA4335' }} />
                <span style={{ flex: 1, backgroundColor: '#FBBC05' }} />
                <span style={{ flex: 1, backgroundColor: '#34A853' }} />
              </div>

              {/* Cabecera del reverso */}
              <div style={{ width: '100%', paddingTop: '1.5mm' }}>
                <h2
                  style={{
                    margin: 0,
                    fontSize: language === 'bilingual' ? '18px' : '22px',
                    fontWeight: 800,
                    letterSpacing: '0.07em',
                    color: '#0f172a',
                    textTransform: 'uppercase',
                  }}
                >
                  {copyText.backTitle}
                </h2>
                <p
                  style={{
                    margin: '1.4mm 0 0 0',
                    fontSize: '14px',
                    color: '#475569',
                    fontWeight: 500,
                  }}
                >
                  {copyText.backSubtitle}
                </p>
              </div>

              {/* Dos bloques de instrucciones claras: NFC + QR */}
              <div
                style={{
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4.5mm',
                  textAlign: 'left',
                  marginTop: '2mm',
                  marginBottom: '2mm',
                }}
              >
                {/* Método 1: NFC */}
                <div
                  style={{
                    borderRadius: '12px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#f8fafc',
                    padding: '4.5mm',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2mm' }}>
                    <span
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '9999px',
                        backgroundColor: '#dbeafe',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <DiscreetNfcIcon sizePx={16} color="#1d4ed8" />
                    </span>
                    <strong style={{ fontSize: '14px', color: '#0f172a', fontWeight: 800 }}>
                      {copyText.stepNfcTitle}
                    </strong>
                  </div>
                  <p style={{ margin: 0, fontSize: '12.2px', lineHeight: 1.4, color: '#1e293b' }}>
                    {copyText.stepNfcDesc}
                  </p>
                  <p style={{ margin: '2mm 0 0 0', fontSize: '10.5px', lineHeight: 1.35, color: '#475569', fontWeight: 600 }}>
                    {copyText.stepNfcHint}
                  </p>
                </div>

                {/* Método 2: QR */}
                <div
                  style={{
                    borderRadius: '12px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#f8fafc',
                    padding: '4.5mm',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2mm' }}>
                    <span
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '9999px',
                        backgroundColor: '#fef3c7',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <QrCode style={{ width: '16px', height: '16px', color: '#b45309' }} />
                    </span>
                    <strong style={{ fontSize: '14px', color: '#0f172a', fontWeight: 800 }}>
                      {copyText.stepQrTitle}
                    </strong>
                  </div>
                  <p style={{ margin: 0, fontSize: '12.2px', lineHeight: 1.4, color: '#1e293b' }}>
                    {copyText.stepQrDesc}
                  </p>
                </div>
              </div>

              {/* Cierre + Estrellas + Isotipo invertido Fluxo */}
              <div
                style={{
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '2.2mm',
                }}
              >
                <FilledGoldStars sizePx={19} gapPx={4} />
                <p style={{ margin: 0, fontSize: '12.5px', fontWeight: 700, color: '#0f172a' }}>
                  {copyText.stepDone}
                </p>
                <div
                  style={{
                    width: '100%',
                    paddingTop: '2.5mm',
                    marginTop: '1mm',
                    borderTop: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#64748b' }}>
                    {isDefaultTemplate ? 'Google Reviews' : restaurantName}
                  </span>
                  <FluxoInvertedMark />
                </div>
              </div>
            </article>
          )}
          </>
        ) : (
          <>
          <article
            data-testid="review-stand-pvc"
            style={{
              width: '85.6mm',
              height: '54mm',
              backgroundColor: '#ffffff',
              fontSize: '14px',
              boxSizing: 'border-box',
              padding: '4.5mm 5mm',
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '3.5mm',
              breakInside: 'avoid',
              pageBreakInside: 'avoid',
            }}
            className="rounded-xl shadow-xl border border-slate-200 print:shadow-none print:border print:border-dashed print:border-slate-300 overflow-hidden"
          >
            {/* Columna izquierda: Logo circular opcional, GRACIAS, estrellas doradas y NFC discreto */}
            <div
              style={{
                flex: 1,
                minWidth: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                justifyContent: 'center',
                textAlign: 'left',
              }}
            >
              {showCircularLogo && (
                <div
                  style={{
                    width: '8.5mm',
                    height: '8.5mm',
                    borderRadius: '9999px',
                    overflow: 'hidden',
                    border: '1px solid #e2e8f0',
                    marginBottom: '1.6mm',
                    backgroundColor: '#ffffff',
                    flexShrink: 0,
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={logoUrl}
                    alt={restaurantName}
                    onError={() => setLogoError(true)}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                    }}
                  />
                </div>
              )}

              <h2
                style={{
                  margin: 0,
                  fontSize: '17px',
                  fontWeight: 800,
                  letterSpacing: '0.06em',
                  lineHeight: 1.1,
                  color: '#0f172a',
                  textTransform: 'uppercase',
                }}
              >
                {copyText.thanks}
              </h2>
              <p
                style={{
                  margin: '0.8mm 0 0 0',
                  fontSize: '11px',
                  fontWeight: 500,
                  lineHeight: 1.2,
                  color: '#1f2937',
                }}
              >
                {language === 'bilingual' ? 'por ayudarnos a mejorar' : copyText.subtitle}
              </p>

              <div style={{ marginTop: '2.2mm' }}>
                <FilledGoldStars sizePx={13} gapPx={2.5} />
              </div>

              <p
                style={{
                  margin: '1.5mm 0 0 0',
                  fontSize: '9px',
                  fontWeight: 600,
                  lineHeight: 1.25,
                  color: '#1e293b',
                }}
              >
                {copyText.importance}
              </p>

              <div
                style={{
                  marginTop: '1.8mm',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <DiscreetNfcIcon sizePx={11} color="#475569" />
                <span
                  style={{
                    fontSize: '8.5px',
                    fontWeight: 600,
                    lineHeight: 1.2,
                    color: '#334155',
                  }}
                >
                  {copyText.nfcPrompt}
                </span>
              </div>
            </div>

            {/* Columna derecha: QR vectorial dentro de aro circular 4 colores Google */}
            <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <GoogleFourColorRing diameterMm={39} strokePx={8.5}>
                <QrVectorSvg value={targetUrl} sizeMm={21} />
              </GoogleFourColorRing>
            </div>
          </article>

          {/* REVERSO TARJETA PVC 85.6x54mm */}
          {showBackSide && (
            <article
              data-testid="review-stand-pvc-back"
              style={{
                width: '85.6mm',
                height: '54mm',
                backgroundColor: '#ffffff',
                fontSize: '12px',
                boxSizing: 'border-box',
                padding: '3.5mm 4.5mm',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                textAlign: 'left',
                breakInside: 'avoid',
                pageBreakInside: 'avoid',
                position: 'relative',
              }}
              className="rounded-xl shadow-xl border border-slate-200 print:shadow-none print:border print:border-dashed print:border-slate-300 overflow-hidden"
            >
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '1.8mm',
                  display: 'flex',
                }}
              >
                <span style={{ flex: 1, backgroundColor: '#4285F4' }} />
                <span style={{ flex: 1, backgroundColor: '#EA4335' }} />
                <span style={{ flex: 1, backgroundColor: '#FBBC05' }} />
                <span style={{ flex: 1, backgroundColor: '#34A853' }} />
              </div>

              <div style={{ paddingTop: '1mm', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <strong style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', letterSpacing: '0.05em' }}>
                  {copyText.backTitle}
                </strong>
                <FilledGoldStars sizePx={11} gapPx={2} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '2mm' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '5px' }}>
                  <DiscreetNfcIcon sizePx={12} color="#1d4ed8" />
                  <p style={{ margin: 0, fontSize: '8.8px', lineHeight: 1.32, color: '#1e293b' }}>
                    <strong style={{ color: '#0f172a' }}>{copyText.stepNfcTitle}:</strong> {copyText.stepNfcDesc}
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '5px' }}>
                  <QrCode style={{ width: '12px', height: '12px', color: '#b45309', flexShrink: 0, marginTop: '1px' }} />
                  <p style={{ margin: 0, fontSize: '8.8px', lineHeight: 1.32, color: '#1e293b' }}>
                    <strong style={{ color: '#0f172a' }}>{copyText.stepQrTitle}:</strong> {copyText.stepQrDesc}
                  </p>
                </div>
              </div>

              <div
                style={{
                  borderTop: '1px solid #e2e8f0',
                  paddingTop: '1.5mm',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span style={{ fontSize: '8.5px', fontWeight: 700, color: '#475569' }}>
                  {copyText.stepDone}
                </span>
                <FluxoInvertedMark />
              </div>
            </article>
          )}
          </>
        )}
      </div>
    </div>
  )
}
