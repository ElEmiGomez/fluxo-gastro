import React from 'react'

interface FluxoLogoProps {
  size?: number | string
  className?: string
  showText?: boolean
  textColor?: string
}

export function FluxoLogo({
  size = 36,
  className = '',
  showText = false,
  textColor = 'text-white'
}: FluxoLogoProps) {
  const numericSize = typeof size === 'number' ? size : parseInt(size, 10) || 36

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

          {/* Sombra suave para el glifo F */}
          <filter id="fluxoGlyphShadowLive" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="1.5" floodColor="#000000" floodOpacity="0.25" />
          </filter>
        </defs>

        {/* Squircle base */}
        <rect
          width="64"
          height="64"
          rx="18"
          fill="url(#fluxoBgGradLive)"
        />

        {/* Letra F redondeada y punto celeste */}
        <g filter="url(#fluxoGlyphShadowLive)">
          <path
            d="M23 48V16H45 M23 31H38"
            stroke="#FFFFFF"
            strokeWidth="8.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Punto característico F. */}
          <circle cx="39" cy="46" r="4.2" fill="#38BDF8" />
        </g>
      </svg>

      {/* Logotipo Tipográfico opcional */}
      {showText && (
        <div className="flex flex-col">
          <span className={`font-black text-lg sm:text-xl tracking-tight leading-none ${textColor}`}>
            FLUXO
          </span>
          <span className="text-[10px] tracking-wider text-cyan-400 font-medium uppercase mt-0.5">
            Sistema Gastronómico
          </span>
        </div>
      )}
    </div>
  )
}
