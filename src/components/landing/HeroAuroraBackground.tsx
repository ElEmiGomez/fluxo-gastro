import React from 'react'

/**
 * HeroAuroraBackground
 * Fondo dinámico de alta gama estilo Aurora B2B para la cabecera (Hero).
 * Luz ambiental perfectamente centrada detrás del titular y las acciones principales.
 * Implementado con orbes fluidos acelerados por GPU mediante CSS puro.
 * Diseñado para 60 FPS estables, cero consumo de JavaScript y respeto a prefers-reduced-motion.
 */
export function HeroAuroraBackground() {
  return (
    <div 
      className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0" 
      aria-hidden="true"
    >
      {/* ── 1. SPOTLIGHT PRINCIPAL CENTRADO (Corona de luz directa detrás del titular) ── */}
      <div 
        className="absolute top-[4%] sm:top-[2%] left-1/2 -translate-x-1/2 
                   w-[650px] sm:w-[950px] lg:w-[1150px] h-[380px] sm:h-[480px] rounded-full 
                   bg-gradient-to-b from-cyan-500/22 via-blue-600/15 to-transparent 
                   blur-[100px] sm:blur-[140px] pointer-events-none" 
      />

      {/* ── 2. ORBE FLUIDO OESTE (Cian vibrante centrado en el eje izquierdo del titular) ── */}
      <div className="absolute top-[8%] sm:top-[6%] left-1/2 -translate-x-1/2 -ml-24 sm:-ml-40 w-[420px] sm:w-[560px] h-[300px] sm:h-[380px]">
        <div 
          className="w-full h-full rounded-full 
                     bg-gradient-to-tr from-cyan-400/25 via-blue-500/15 to-transparent 
                     blur-[85px] sm:blur-[120px] animate-aurora-drift-1 gpu-layer" 
        />
      </div>

      {/* ── 3. ORBE FLUIDO ESTE (Azul Cobalto & Índigo centrado en el eje derecho del titular) ── */}
      <div className="absolute top-[10%] sm:top-[8%] left-1/2 -translate-x-1/2 ml-24 sm:ml-40 w-[440px] sm:w-[580px] h-[320px] sm:h-[400px]">
        <div 
          className="w-full h-full rounded-full 
                     bg-gradient-to-bl from-blue-600/25 via-indigo-600/15 to-transparent 
                     blur-[95px] sm:blur-[130px] animate-aurora-drift-2 gpu-layer" 
        />
      </div>

      {/* ── 4. ORBE FLUIDO BASE (Acento Esmeralda / Cian detrás de los botones de acción) ── */}
      <div className="absolute top-[48%] sm:top-[46%] left-1/2 -translate-x-1/2 w-[480px] sm:w-[680px] h-[240px] sm:h-[320px]">
        <div 
          className="w-full h-full rounded-full 
                     bg-gradient-to-r from-cyan-500/15 via-emerald-500/12 to-transparent 
                     blur-[90px] sm:blur-[125px] animate-aurora-drift-3 gpu-layer" 
        />
      </div>

      {/* ── 5. MÁSCARAS DE TRANSICIÓN SUAVES (Integración con el fondo Slate-900) ── */}
      {/* Máscara inferior suave hacia la siguiente sección */}
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent" />
      
      {/* Máscara superior muy sutil bajo el header */}
      <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-slate-900/50 to-transparent" />
    </div>
  )
}
