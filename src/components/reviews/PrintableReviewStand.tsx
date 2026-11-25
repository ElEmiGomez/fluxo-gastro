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
} from 'lucide-react'

interface PrintableReviewStandProps {
  slug: string
  restaurantName: string
  city: string
  logoUrl?: string
  googleReviewUrl: string
  enableGatekeeper: boolean
  isDefaultTemplate?: boolean
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

export function PrintableReviewStand({
  slug,
  restaurantName,
  city,
  logoUrl,
  googleReviewUrl,
  enableGatekeeper,
  isDefaultTemplate = false,
}: PrintableReviewStandProps) {
  const [format, setFormat] = useState<'stand_10x15' | 'card_pvc'>('stand_10x15')
  const [language, setLanguage] = useState<'es' | 'gl' | 'bilingual'>('es')
  const [hideLogo, setHideLogo] = useState<boolean>(isDefaultTemplate || !logoUrl)
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
    },
    gl: {
      thanks: 'GRAZAS',
      subtitle: 'por axudarnos a mellorar',
      importance: 'A túa opinión é moi importante para nós',
      nfcPrompt: 'Achega o teu móbil ou escanea o QR',
    },
    bilingual: {
      thanks: 'GRACIAS',
      subtitle: 'por ayudarnos a mejorar · por axudarnos a mellorar',
      importance: 'Tu opinión es muy importante para nosotros',
      nfcPrompt: 'Acerca tu móvil o escanea el QR',
    },
  }[language]

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 print:bg-white print:p-0">
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
      <div className="max-w-3xl mx-auto mb-8 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-5 print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-black text-slate-900">
              Expositor Minimalista NFC + QR — {isDefaultTemplate ? 'Versión Predeterminada' : restaurantName}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {city ? `${city} · ` : ''}Modo activo:{' '}
              <strong className="text-blue-700">
                {enableGatekeeper ? 'Filtro Inteligente (Opción 1)' : 'Enlace Directo a Google Maps (Por defecto)'}
              </strong>
            </p>
          </div>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-sm transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir / Guardar PDF</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Formato físico</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormat('stand_10x15')}
                className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors ${
                  format === 'stand_10x15'
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Peana 10×15
              </button>
              <button
                type="button"
                onClick={() => setFormat('card_pvc')}
                className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors ${
                  format === 'card_pvc'
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Tarjeta PVC
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Logo del local</label>
            <button
              type="button"
              onClick={() => setHideLogo((prev) => !prev)}
              disabled={!logoUrl}
              className={`w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-colors ${
                !logoUrl || hideLogo
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              } disabled:opacity-60`}
            >
              {!logoUrl || hideLogo ? (
                <>
                  <ImageOff className="w-3.5 h-3.5" />
                  <span>Versión predeterminada (sin logo)</span>
                </>
              ) : (
                <>
                  <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Logo circular activo (clic para ocultar)</span>
                </>
              )}
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Idioma del soporte</label>
            <div className="grid grid-cols-3 gap-2">
              {(['es', 'gl', 'bilingual'] as const).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setLanguage(lang)}
                  className={`px-2 py-2 rounded-xl text-xs font-bold border transition-colors ${
                    language === lang
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {lang === 'es' ? 'Español' : lang === 'gl' ? 'Galego' : 'ES / GL'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Enlace exacto para grabar en el chip NFC con NFC Tools */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-blue-600" />
              URL exacta para grabar en el chip NFC (app NFC Tools)
            </span>
            {!isDefaultTemplate && (
              <a
                href={`/r/${slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-blue-600 hover:underline inline-flex items-center gap-1"
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
              className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://tudominio.com"
            />
            <button
              type="button"
              onClick={handleCopyUrl}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors"
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
      <div className="flex justify-center">
        {format === 'stand_10x15' ? (
          <article
            data-testid="review-stand-10x15"
            style={{
              width: '100mm',
              height: '150mm',
              backgroundColor: '#ffffff',
              fontSize: '16px',
              boxSizing: 'border-box',
              paddingTop: showCircularLogo ? '7mm' : '12mm',
              paddingBottom: '20mm',
              paddingLeft: '8mm',
              paddingRight: '8mm',
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
                    width: '15mm',
                    height: '15mm',
                    borderRadius: '9999px',
                    overflow: 'hidden',
                    border: '1px solid #e2e8f0',
                    marginBottom: '3.5mm',
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
                  fontSize: '21px',
                  fontWeight: 700,
                  letterSpacing: '0.07em',
                  lineHeight: 1.15,
                  color: '#111827',
                  textTransform: 'uppercase',
                }}
              >
                {copyText.thanks}
              </h2>
              <p
                style={{
                  margin: '1.2mm 0 0 0',
                  fontSize: language === 'bilingual' ? '12.5px' : '15px',
                  fontWeight: 400,
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
                marginTop: '2mm',
                marginBottom: '2mm',
              }}
            >
              <GoogleFourColorRing diameterMm={60} strokePx={7.5}>
                <QrVectorSvg value={targetUrl} sizeMm={32} />
              </GoogleFourColorRing>
            </div>

            {/* Bloque inferior (con 20mm libres abajo para la peana de madera natural) */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                width: '100%',
              }}
            >
              <FilledGoldStars sizePx={16} gapPx={3} />
              <p
                style={{
                  margin: '2mm 0 0 0',
                  fontSize: '11.5px',
                  fontWeight: 500,
                  lineHeight: 1.3,
                  color: '#1f2937',
                }}
              >
                {copyText.importance}
              </p>

              <div
                style={{
                  marginTop: '2.5mm',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '5px',
                }}
              >
                <DiscreetNfcIcon sizePx={13} color="#64748b" />
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 500,
                    lineHeight: 1.2,
                    color: '#475569',
                    letterSpacing: '0.01em',
                  }}
                >
                  {copyText.nfcPrompt}
                </span>
              </div>
            </div>
          </article>
        ) : (
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
                  fontSize: '15px',
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  lineHeight: 1.1,
                  color: '#111827',
                  textTransform: 'uppercase',
                }}
              >
                {copyText.thanks}
              </h2>
              <p
                style={{
                  margin: '0.7mm 0 0 0',
                  fontSize: '9.5px',
                  fontWeight: 400,
                  lineHeight: 1.2,
                  color: '#1f2937',
                }}
              >
                {language === 'bilingual' ? 'por ayudarnos a mejorar' : copyText.subtitle}
              </p>

              <div style={{ marginTop: '2.2mm' }}>
                <FilledGoldStars sizePx={11} gapPx={2} />
              </div>

              <p
                style={{
                  margin: '1.4mm 0 0 0',
                  fontSize: '8px',
                  fontWeight: 500,
                  lineHeight: 1.25,
                  color: '#334155',
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
                <DiscreetNfcIcon sizePx={10} color="#64748b" />
                <span
                  style={{
                    fontSize: '7.5px',
                    fontWeight: 500,
                    lineHeight: 1.2,
                    color: '#475569',
                  }}
                >
                  {copyText.nfcPrompt}
                </span>
              </div>
            </div>

            {/* Columna derecha: QR vectorial dentro de aro circular 4 colores Google */}
            <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <GoogleFourColorRing diameterMm={37} strokePx={8.5}>
                <QrVectorSvg value={targetUrl} sizeMm={19} />
              </GoogleFourColorRing>
            </div>
          </article>
        )}
      </div>
    </div>
  )
}
