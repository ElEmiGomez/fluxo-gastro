'use client'

import React, { useState } from 'react'
import {
  X,
  Sparkles,
  Sliders,
  CheckCircle2,
  XCircle,
  Eye,
  Smartphone,
  FileText,
  Clock,
  Euro,
  ShieldCheck,
  Star
} from 'lucide-react'

interface CRMBeforeAfterModalProps {
  isOpen: boolean
  onClose: () => void
  restaurantName?: string
}

export function CRMBeforeAfterModal({
  isOpen,
  onClose,
  restaurantName = 'Tu Restaurante',
}: CRMBeforeAfterModalProps) {
  if (!isOpen) return null

  const [sliderPosition, setSliderPosition] = useState<number>(50) // 0 to 100

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-3 sm:p-4 animate-in fade-in select-none">
      <div className="w-full max-w-2xl rounded-3xl bg-slate-900 border border-slate-700 text-white shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Cabecera */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-white">
                Comparador Antes vs Después
              </h3>
              <p className="text-[11px] text-slate-400">
                Demostración visual para mostrar al dueño en mesa o barra
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Selector rápido de vista */}
        <div className="px-4 py-2.5 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-400 font-medium">Modo de visualización:</span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setSliderPosition(0)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                sliderPosition === 0
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Tradicional (0%)
            </button>
            <button
              onClick={() => setSliderPosition(50)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                sliderPosition === 50
                  ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Dividido (50/50)
            </button>
            <button
              onClick={() => setSliderPosition(100)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                sliderPosition === 100
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Con Fluxo (100%)
            </button>
          </div>
        </div>

        {/* Lienzo comparador visual */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
          <div className="relative w-full rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 min-h-[340px] sm:min-h-[380px] shadow-inner flex flex-col justify-between">
            {/* Capa ANTES (Fondo completo) */}
            <div className="absolute inset-0 bg-stone-900/90 text-stone-300 p-4 sm:p-6 flex flex-col justify-between">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-stone-800 border border-stone-700 text-rose-400 font-bold text-xs">
                  <XCircle className="w-3.5 h-3.5" />
                  <span>ANTES: Carta Plastificada o PDF</span>
                </div>

                <div className="mt-4 p-3.5 rounded-xl bg-stone-800/80 border border-stone-700 font-serif space-y-2">
                  <div className="flex items-center justify-between border-b border-stone-700 pb-2">
                    <span className="font-bold text-stone-200">Berberechos de Noia al Vapor</span>
                    <span className="line-through text-stone-500 text-xs">14,00€</span>
                    <span className="text-rose-400 font-mono font-bold text-sm ml-1">16,50€ (a boli)</span>
                  </div>
                  <p className="text-xs text-stone-400 italic">
                    Sin foto. Alérgenos sin indicar. Letra pequeña difícil de leer en penumbra.
                  </p>
                </div>

                <div className="mt-3 space-y-2 text-xs text-stone-400">
                  <div className="flex items-center gap-2">
                    <span className="text-rose-400 font-bold">✕</span>
                    <span>El camarero da 2 paseos solo para entregar y retirar cartas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-rose-400 font-bold">✕</span>
                    <span>Modificar precios de marisco exige tachar a mano o reimprimir</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-rose-400 font-bold">✕</span>
                    <span>El PDF en el móvil exige zoom manual y se lee incómodo</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-stone-800 text-[11px] text-stone-500 flex items-center justify-between">
                <span>Pérdida de rotación en terraza</span>
                <span className="font-mono text-rose-400 font-semibold">-12 min por mesa</span>
              </div>
            </div>

            {/* Capa DESPUÉS (Recortada según el slider) */}
            <div
              className="absolute inset-0 bg-slate-900 text-white p-4 sm:p-6 flex flex-col justify-between border-r-2 border-blue-500 shadow-2xl transition-all duration-75"
              style={{
                clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)`,
              }}
            >
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-500/20 border border-blue-500/30 text-emerald-400 font-bold text-xs">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                  <span>DESPUÉS: Carta Interactiva Fluxo</span>
                </div>

                <div className="mt-4 p-3.5 rounded-xl bg-gradient-to-br from-slate-800 to-slate-850 border border-blue-500/30 shadow-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🦪</span>
                      <div>
                        <h4 className="font-bold text-sm text-white">Berberechos de Noia al Vapor</h4>
                        <div className="flex items-center gap-1 text-[10px] text-blue-300">
                          <ShieldCheck className="w-3 h-3 text-emerald-400" />
                          <span>Moluscos • Sin Gluten • Lonja de hoy</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-emerald-400 font-mono font-black text-base">16,50 €</span>
                      <p className="text-[10px] text-slate-400 font-mono">Actualizado</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-300 leading-snug">
                    Recién abiertos en su jugo con laurel de la huerta y un toque de limón.
                  </p>
                  <div className="flex items-center justify-between pt-1 text-[10px]">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-medium">
                      Plato Estrella
                    </span>
                    <span className="text-slate-400 flex items-center gap-1">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> 4.9 (48 reseñas)
                    </span>
                  </div>
                </div>

                <div className="mt-3 space-y-2 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>Carga en menos de 0.5 segundos desde cualquier móvil</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>Precios y platos agotados modificables en 5 segundos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>Botón directo para pedir la cuenta y avisar al camarero</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 text-[11px] text-emerald-400 flex items-center justify-between">
                <span>Agilidad de servicio demostrada</span>
                <span className="font-mono font-bold">+18% rotación de comensales</span>
              </div>
            </div>

            {/* Tirador visual de la barra de corte */}
            <div
              className="absolute top-0 bottom-0 pointer-events-none z-10 flex items-center justify-center -ml-3"
              style={{ left: `${sliderPosition}%` }}
            >
              <div className="w-6 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg border border-white/40">
                <Sliders className="w-3.5 h-3.5 rotate-90" />
              </div>
            </div>
          </div>

          {/* Control deslizante de rango táctil */}
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-xs text-slate-400 font-semibold px-1">
              <span className="text-rose-400">← Tradicional / PDF</span>
              <span className="text-slate-500">Desliza para comparar</span>
              <span className="text-emerald-400">Con Fluxo →</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={sliderPosition}
              onChange={(e) => setSliderPosition(Number(e.target.value))}
              className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500 touch-manipulation"
            />
          </div>

          {/* Argumento de remate para el fundador */}
          <div className="p-3.5 rounded-2xl bg-blue-950/40 border border-blue-800/40 flex items-start gap-2.5 text-xs text-slate-200">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-white">Frase de cierre con el hostelero: </span>
              <span className="text-slate-300 leading-relaxed">
                &quot;¿Tus clientes ven tu producto como en la izquierda o como en la derecha? Con Fluxo, {restaurantName} proyecta una imagen gourmet desde el primer minuto por menos de lo que cuesta un café al día.&quot;
              </span>
            </div>
          </div>
        </div>

        {/* Pie */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/80 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition"
          >
            Cerrar Comparador
          </button>
        </div>
      </div>
    </div>
  )
}
