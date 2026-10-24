'use client'

import React, { useState } from 'react'
import { CheckCircle2, Wifi, Zap, Clock, Bell, Check, Sparkles } from 'lucide-react'

export function HeroLiveSyncMockup() {
  const [isCompleted, setIsCompleted] = useState(false)

  const handleToggleReady = () => {
    setIsCompleted(true)
    setTimeout(() => {
      setIsCompleted(false)
    }, 3200)
  }

  return (
    <div className="relative w-full max-w-lg mx-auto lg:max-w-none">
      {/* Resplandor ambiental de fondo */}
      <div className="absolute -inset-2 bg-gradient-to-r from-cyan-500/20 via-blue-600/20 to-emerald-500/20 rounded-3xl blur-2xl opacity-60 pointer-events-none" />

      {/* Contenedor principal con grid split-screen */}
      <div className="relative bg-slate-950/85 border-2 border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-2xl backdrop-blur-xl overflow-hidden">
        
        {/* Cabecera del mockup con status bar de red en tiempo real */}
        <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-slate-800/80 text-[11px] text-slate-400 font-medium">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="font-bold text-slate-200">Red Local Sincronizada</span>
            <span className="text-[10px] text-slate-500 hidden sm:inline">&middot; Supabase Realtime</span>
          </div>
          <div className="flex items-center gap-2 text-slate-400 font-mono text-[10px]">
            <Wifi className="w-3 h-3 text-cyan-400" />
            <span>0.2s latencia</span>
          </div>
        </div>

        {/* Grid de Split-Screen: Camarero (Izq) + Cocina KDS (Der) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 relative">
          
          {/* LADO IZQUIERDO: Tarjeta Móvil Camarero / Sala */}
          <div className="bg-slate-900/90 border border-slate-700/70 rounded-xl p-3.5 flex flex-col justify-between shadow-md relative group hover:border-cyan-500/50 transition-all">
            <div>
              {/* Badge y Mesa */}
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  <span className="text-xs font-black text-white tracking-tight">Mesa #7</span>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-[10px] font-black uppercase tracking-wider">
                  Comandero
                </span>
              </div>

              {/* Estado de la orden */}
              <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 mb-2.5">
                <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Comanda Validada</span>
              </div>

              {/* Items del pedido */}
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-800/60 border border-slate-700/50">
                  <div className="flex items-center gap-1.5 font-bold text-slate-200">
                    <span className="text-sm">🍺</span>
                    <span>2× Caña Estrella</span>
                  </div>
                  <span className="text-[10px] font-mono text-cyan-400 font-bold">Barra</span>
                </div>

                <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-800/60 border border-slate-700/50">
                  <div className="flex items-center gap-1.5 font-bold text-slate-200">
                    <span className="text-sm">🍔</span>
                    <span>1× Smash Doble</span>
                  </div>
                  <span className="text-[10px] font-mono text-amber-400 font-bold">Cocina</span>
                </div>
              </div>
            </div>

            {/* Footer móvil */}
            <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
              <span className="text-slate-400 font-medium">Total comanda:</span>
              <span className="font-mono font-extrabold text-white text-xs">17,50 €</span>
            </div>
          </div>

          {/* LADO DERECHO: Tarjeta Monitor KDS Cocina */}
          <div className="bg-slate-900/90 border border-slate-700/70 rounded-xl p-3.5 flex flex-col justify-between shadow-md relative hover:border-emerald-500/50 transition-all">
            <div>
              {/* Header de Cocina */}
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span className="text-xs font-black text-white tracking-tight">KDS Cocina</span>
                </div>
                {isCompleted ? (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-black uppercase tracking-wider animate-in fade-in">
                    ✓ Despachado
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-black uppercase tracking-wider animate-pulse flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    ¡Nuevo!
                  </span>
                )}
              </div>

              {/* Título de comanda y tiempo */}
              <div className="flex items-center justify-between text-[11px] text-slate-300 font-bold mb-2">
                <span>Pase #104 &middot; Mesa 7</span>
                <span className="flex items-center gap-1 text-[10px] text-amber-400 font-mono">
                  <Clock className="w-3 h-3" />
                  {isCompleted ? '00:00' : '01:42 min'}
                </span>
              </div>

              {/* Item de Cocina marchando */}
              <div className="p-2 rounded-lg bg-slate-800/90 border border-slate-700/60 mb-2">
                <div className="flex items-center justify-between text-xs font-black text-white">
                  <span>1× Smash Burger Doble</span>
                  <span className="text-[10px] text-emerald-400 font-mono">Fuegos</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Punto: Al punto &middot; Sin cebolla
                </div>
              </div>
            </div>

            {/* Botón de acción industrial KDS */}
            <button
              type="button"
              onClick={handleToggleReady}
              className={`w-full py-2 px-3 rounded-lg text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer ${
                isCompleted
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/30'
              }`}
            >
              {isCompleted ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-300" />
                  <span>¡Listo en Pase!</span>
                </>
              ) : (
                <>
                  <span>¡LISTO!</span>
                  <span className="text-[10px] opacity-75">(Tocar)</span>
                </>
              )}
            </button>
          </div>

          {/* BADGE CENTRAL FLOTANTE DE CONEXIÓN */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-950/95 border-2 border-cyan-400 text-cyan-300 text-[11px] font-black tracking-wide shadow-xl shadow-cyan-500/30 backdrop-blur-md whitespace-nowrap">
              <Zap className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400 animate-pulse" />
              <span>Sincronización en 0.2s sin cables</span>
            </div>
          </div>

        </div>

        {/* Subtítulo de cierre del mockup */}
        <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-center text-center text-[11px] text-slate-400">
          <span>La orden viaja instantáneamente de la terraza al pase sin papelitos ni gritos.</span>
        </div>

      </div>
    </div>
  )
}
