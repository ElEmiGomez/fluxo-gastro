import React from 'react'

interface FluxoLogoProps {
  size?: number | string
  className?: string
  showText?: boolean
  textColor?: string
  inverted?: boolean
}

export function FluxoLogo({
  size = 36,
  className = '',
  showText = false,
  textColor,
  inverted = false
}: FluxoLogoProps) {
  const numericSize = typeof size === 'number' ? size : parseInt(size, 10) || 36
  const finalTextColor = textColor ?? (inverted ? 'text-slate-900' : 'text-white')

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Isotipo Oficial F. de Fluxo */}
      <svg
        width={numericSize}
        height={numericSize}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0 drop-shadow-md transition-transform hover:scale-105 duration-200"
      >
        <defs>
          {/* Fondo gradiente azul real a cian/celeste eléctrico */}
          <linearGradient id="fluxoBgGradLive" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2563EB" />
            <stop offset="55%" stopColor="#1D4ED8" />
            <stop offset="100%" stopColor="#0EA5E9" />
          </linearGradient>

          {/* Gradiente azul para la letra F en versión invertida (#2563EB a #1D4ED8) */}
          <linearGradient id="fluxoGlyphGradInverted" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2563EB" />
            <stop offset="100%" stopColor="#1D4ED8" />
          </linearGradient>

          {/* Sombra suave para el glifo F */}
          <filter id={inverted ? "fluxoGlyphShadowLiveInverted" : "fluxoGlyphShadowLive"} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="1.5" floodColor="#000000" floodOpacity={inverted ? "0.08" : "0.25"} />
          </filter>
        </defs>

        {/* Squircle base */}
        <rect
          width="64"
          height="64"
          rx="18"
          fill={inverted ? "#FFFFFF" : "url(#fluxoBgGradLive)"}
          stroke={inverted ? "#E2E8F0" : "none"}
          strokeWidth={inverted ? "2" : "0"}
        />

        {/* Letra F redondeada y punto celeste */}
        <g filter={inverted ? "url(#fluxoGlyphShadowLiveInverted)" : "url(#fluxoGlyphShadowLive)"}>
          <path
            d="M23 48V16H45 M23 31H38"
            stroke={inverted ? "url(#fluxoGlyphGradInverted)" : "#FFFFFF"}
            strokeWidth="8.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Punto característico F. */}
          <circle cx="39" cy="46" r="4.2" fill={inverted ? "#2563EB" : "#38BDF8"} />
        </g>
      </svg>

      {/* Logotipo Tipográfico opcional */}
      {showText && (
        <div className="flex flex-col">
          <span className={`font-black text-lg sm:text-xl tracking-tight leading-none ${finalTextColor}`}>
            FLUXO
          </span>
          <span className={`text-[10px] tracking-wider font-semibold uppercase mt-0.5 ${inverted ? 'text-blue-600' : 'text-cyan-400 font-medium'}`}>
            Sistema Gastronómico
          </span>
        </div>
      )}
    </div>
  )
}
