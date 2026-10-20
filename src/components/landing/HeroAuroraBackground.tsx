import React from 'react'

/**
 * HeroAuroraBackground
 * Fondo dinámico de alta gama estilo Aurora B2B para la cabecera (Hero).
 * Implementado con 3 orbes fluidos acelerados por GPU mediante CSS puro.
 * Diseñado para 60 FPS estables, cero consumo de JavaScript y respeto a prefers-reduced-motion.
 */
export function HeroAuroraBackground() {
  return (
    <div 
      className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0" 
      aria-hidden="true"
    >
      {/* Orbe 1: Cian Primario (Arriba / Centro-Izquierda) */}
      <div 
        className="absolute -top-[10%] left-[15%] w-[480px] sm:w-[620px] h-[360px] sm:h-[440px] rounded-full 
                   bg-gradient-to-tr from-cyan-500/25 via-blue-500/15 to-transparent 
                   blur-[90px] sm:blur-[130px] animate-aurora-drift-1 gpu-layer" 
      />

      {/* Orbe 2: Azul Cobalto & Índigo (Centro / Derecha) */}
      <div 
        className="absolute top-[18%] -right-[8%] w-[520px] sm:w-[680px] h-[400px] sm:h-[500px] rounded-full 
                   bg-gradient-to-bl from-blue-600/25 via-indigo-600/15 to-transparent 
                   blur-[100px] sm:blur-[140px] animate-aurora-drift-2 gpu-layer" 
      />

      {/* Orbe 3: Esmeralda Ténue de Profundidad (Inferior / Centro) */}
      <div 
        className="absolute bottom-[5%] left-[25%] sm:left-[35%] w-[420px] sm:w-[540px] h-[320px] sm:h-[400px] rounded-full 
                   bg-gradient-to-r from-emerald-500/15 via-cyan-400/10 to-transparent 
                   blur-[90px] sm:blur-[120px] animate-aurora-drift-3 gpu-layer" 
      />

      {/* Difusor ambiental central: unifica los tres orbes en un degradado líquido suave */}
      <div 
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] sm:w-[900px] h-[280px] sm:h-[350px] 
                   bg-gradient-to-b from-cyan-500/10 via-blue-600/5 to-transparent 
                   blur-[120px] sm:blur-[150px] pointer-events-none" 
      />

      {/* Máscara de transición vertical hacia el fondo oscuro Slate-900 */}
      <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-slate-900 via-slate-900/70 to-transparent" />
      
      {/* Máscara superior muy suave bajo el header */}
      <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-slate-900/60 to-transparent" />
    </div>
  )
}
