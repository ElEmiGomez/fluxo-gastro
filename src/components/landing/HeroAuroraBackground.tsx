import React from 'react'

/**
 * HeroAuroraBackground
 * Fondo de iluminación 100% centrado para el Hero.
 * Diseñado simétrico respecto al eje horizontal medio (X = 50%),
 * iluminando directamente el titular y los botones principales.
 */
export function HeroAuroraBackground() {
  return (
    <div 
      className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0" 
      aria-hidden="true"
    >
      {/* ── 1. SPOTLIGHT PRINCIPAL CENTRADO (Corona elíptica en el centro exacto) ── */}
      <div 
        className="absolute top-[0%] sm:top-[2%] left-1/2 -translate-x-1/2 
                   w-[700px] sm:w-[950px] lg:w-[1100px] h-[440px] sm:h-[540px] rounded-full 
                   bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-400/25 via-blue-600/15 to-transparent 
                   blur-[100px] sm:blur-[135px] pointer-events-none" 
      />

      {/* ── 2. NÚCLEO VIBRANTE CENTRADO (Luz viva justo detrás del texto principal) ── */}
      <div 
        className="absolute top-[8%] sm:top-[6%] left-1/2 -translate-x-1/2 
                   w-[440px] sm:w-[620px] h-[300px] sm:h-[380px] rounded-full 
                   bg-gradient-to-b from-cyan-400/30 via-blue-500/15 to-transparent 
                   blur-[75px] sm:blur-[105px] pointer-events-none" 
      />

      {/* ── 3. RESPLANDOR CENTRADO INFERIOR (Equilibrio detrás de los botones de acción) ── */}
      <div 
        className="absolute top-[48%] sm:top-[45%] left-1/2 -translate-x-1/2 
                   w-[500px] sm:w-[720px] h-[220px] sm:h-[280px] rounded-full 
                   bg-gradient-to-r from-blue-600/15 via-cyan-400/20 to-blue-600/15 
                   blur-[85px] sm:blur-[115px] pointer-events-none" 
      />

      {/* ── 4. MÁSCARAS DE TRANSICIÓN VERTICAL SUAVES (Integración con el fondo Slate-900) ── */}
      {/* Máscara inferior suave hacia la siguiente sección */}
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent" />
      
      {/* Máscara superior muy sutil bajo el header */}
      <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-slate-900/50 to-transparent" />
    </div>
  )
}
