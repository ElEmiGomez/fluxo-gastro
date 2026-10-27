import React from 'react'

interface HeroAuroraBackgroundProps {
  theme?: 'light' | 'dark'
}

/**
 * HeroAuroraBackground
 * Fondo ambiental adaptativo para el Hero:
 * - Theme White: Malla técnica sutil de micro-puntos y resplandor cenital limpio sin manchar el texto.
 * - Theme Black: Orbes fluidos de alta gama estilo Aurora B2B acelerados por GPU.
 */
export function HeroAuroraBackground({ theme = 'light' }: HeroAuroraBackgroundProps) {
  if (theme === 'dark') {
    return (
      <div 
        className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0" 
        aria-hidden="true"
      >
        {/* Spotlight principal centrado (Modo Oscuro) */}
        <div 
          className="absolute top-[0%] sm:top-[2%] left-1/2 -translate-x-1/2 
                     w-[700px] sm:w-[950px] lg:w-[1100px] h-[440px] sm:h-[540px] rounded-full 
                     bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-400/25 via-blue-600/15 to-transparent 
                     blur-[100px] sm:blur-[135px] pointer-events-none" 
        />

        {/* Núcleo vibrante centrado */}
        <div 
          className="absolute top-[8%] sm:top-[6%] left-1/2 -translate-x-1/2 
                     w-[440px] sm:w-[620px] h-[300px] sm:h-[380px] rounded-full 
                     bg-gradient-to-b from-cyan-400/30 via-blue-500/15 to-transparent 
                     blur-[75px] sm:blur-[105px] pointer-events-none" 
        />

        {/* Resplandor centrado inferior */}
        <div 
          className="absolute top-[48%] sm:top-[45%] left-1/2 -translate-x-1/2 
                     w-[500px] sm:w-[720px] h-[220px] sm:h-[280px] rounded-full 
                     bg-gradient-to-r from-blue-600/15 via-cyan-400/20 to-blue-600/15 
                     blur-[85px] sm:blur-[115px] pointer-events-none" 
        />

        {/* Máscaras de integración */}
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent" />
        <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-slate-900/50 to-transparent" />
      </div>
    )
  }

  // ── THEME WHITE (Limpio, elegante, sin ruido ni mancha azulada) ──
  return (
    <div 
      className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0" 
      aria-hidden="true"
    >
      {/* 1. Malla técnica de micro-puntos con desvanecimiento radial (Estilo BalneariOS / Linear) */}
      <div 
        className="absolute inset-0 opacity-[0.35] [mask-image:radial-gradient(ellipse_75%_55%_at_50%_35%,black_20%,transparent_80%)]"
        style={{
          backgroundImage: 'radial-gradient(circle, #64748b 0.75px, transparent 0.75px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* 2. Luz cenital superior suave que baña la cabecera desde arriba sin ensuciar las letras */}
      <div 
        className="absolute -top-24 left-1/2 -translate-x-1/2 
                   w-[800px] sm:w-[1050px] lg:w-[1250px] h-[360px] sm:h-[440px] rounded-full 
                   bg-[radial-gradient(ellipse_at_top,_rgba(37,99,235,0.08)_0%,_rgba(14,165,233,0.04)_40%,_transparent_75%)] 
                   blur-[70px] pointer-events-none" 
      />

      {/* 3. Resplandor perimetral extremadamente sutil y limpio */}
      <div 
        className="absolute top-[20%] left-1/2 -translate-x-1/2 
                   w-[600px] sm:w-[850px] h-[220px] rounded-full 
                   bg-gradient-to-b from-sky-400/6 via-blue-500/3 to-transparent 
                   blur-[85px] pointer-events-none" 
      />

      {/* 4. Máscaras de integración suaves hacia los bordes blancos */}
      <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-white to-transparent" />
      <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-white/90 to-transparent" />
    </div>
  )
}
