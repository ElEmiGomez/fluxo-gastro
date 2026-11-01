'use client'

import React from 'react'

/**
 * Pantalla de Mantenimiento Protegido (pause_level === 2) para la carta
 * pública /p/[slug]. Estética Apple Glass y redacción neutra: JAMÁS se menciona
 * impagos ni motivos comerciales.
 */
export function ProtectedMenuScreen({ localName, accentColor }: { localName: string; accentColor: string }) {
  return (
    <div
      className="min-h-[100dvh] flex items-center justify-center p-6 relative overflow-hidden"
      style={{
        background:
          'linear-gradient(135deg, #070d1a 0%, #0b1426 50%, #101a30 100%)',
      }}
    >
      {/* Resplandores ambientales */}
      <div
        className="absolute -top-32 left-1/2 -translate-x-1/2 w-[520px] h-[520px] rounded-full pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${accentColor}33 0%, transparent 65%)`,
          filter: 'blur(10px)',
        }}
      />

      <div className="apple-glass-card relative p-8 sm:p-10 rounded-[28px] max-w-md w-full text-center border border-white/[0.14] shadow-2xl appleFadeIn">
        {/* Isotipo invertido de Fluxo */}
        <div className="w-14 h-14 mx-auto rounded-2xl bg-white flex items-center justify-center shadow-lg mb-6">
          <span
            className="text-2xl font-black"
            style={{
              background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            F
          </span>
        </div>

        <p className="text-[10px] font-black tracking-[0.3em] uppercase text-white/50 mb-3">
          {localName}
        </p>

        <div className="apple-glass-reflection" />

        <h1 className="text-xl sm:text-2xl font-bold text-white leading-snug">
          Estamos actualizando nuestra carta de temporada
        </h1>
        <p className="text-sm text-white/70 mt-3 leading-relaxed">
          Por favor, consulta las sugerencias de hoy directamente con nuestro personal en sala
        </p>

        <div className="mt-7 pt-5 border-t border-white/10">
          <p className="text-[10px] text-white/40 font-semibold tracking-wide">
            FLUXO · GASTRONOMIC SYSTEM
          </p>
        </div>
      </div>
    </div>
  )
}
