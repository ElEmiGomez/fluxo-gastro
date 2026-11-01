'use client'

import React, { useState } from 'react'
import {
  Mic,
  MicOff,
  RotateCcw,
  Sparkles,
  Volume2,
  CheckCircle2,
  Keyboard,
  Footprints,
  Flame,
} from 'lucide-react'
import { UndoBufferItem } from '@/lib/kds-hardware-controller'

interface KdsHandsFreeBarProps {
  fifoTargetTable: string | number | null
  isPushToTalkActive: boolean
  onStartVoiceInput: () => void
  onStopVoiceInput: () => void
  lastTranscript: string | null
  undoItem: UndoBufferItem | null
  undoProgressPct: number
  onExecuteUndo: () => void
  onCompleteOldestTable: () => void
  onSimulateMixedOrder: () => void
  onSimulateVoiceCommand: (cmd: 'oido' | 'listo', tableNum: string | number) => void
}

export function KdsHandsFreeBar({
  fifoTargetTable,
  isPushToTalkActive,
  onStartVoiceInput,
  onStopVoiceInput,
  lastTranscript,
  undoItem,
  undoProgressPct,
  onExecuteUndo,
  onCompleteOldestTable,
  onSimulateMixedOrder,
  onSimulateVoiceCommand,
}: KdsHandsFreeBarProps) {
  const [showSimModal, setShowSimModal] = useState(false)

  return (
    <div className="w-full bg-slate-950 text-white border-b border-slate-800 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs shadow-md">
      {/* 1. Indicadores de Hardware Activos */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Pedal USB / Espacio FIFO */}
        <button
          type="button"
          onClick={onCompleteOldestTable}
          disabled={!fifoTargetTable}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 border border-blue-500/40 font-bold transition-all active:scale-95 disabled:opacity-40 cursor-pointer"
          title="Pulsa Espacio o Pedal USB para completar la comanda más antigua"
        >
          <Footprints className="w-3.5 h-3.5 text-blue-400" />
          <span>
            [ESPACIO / PEDAL]:{' '}
            {fifoTargetTable ? (
              <strong className="text-white">Mesa #{fifoTargetTable}</strong>
            ) : (
              'Sin cola'
            )}
          </span>
        </button>

        {/* Push-to-Talk (Tecla V o botón táctil) */}
        <button
          type="button"
          onMouseDown={onStartVoiceInput}
          onMouseUp={onStopVoiceInput}
          onTouchStart={onStartVoiceInput}
          onTouchEnd={onStopVoiceInput}
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl font-bold transition-all select-none cursor-pointer ${
            isPushToTalkActive
              ? 'bg-rose-600 text-white animate-pulse border border-rose-400 shadow-md ring-2 ring-rose-500/40'
              : 'bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700'
          }`}
          title="Mantén presionada la tecla 'V' o este botón para hablar"
        >
          {isPushToTalkActive ? (
            <>
              <Mic className="w-3.5 h-3.5 text-white animate-bounce" />
              <span>Escuchando... (&apos;Oído mesa X&apos; / &apos;Listo mesa X&apos;)</span>
            </>
          ) : (
            <>
              <MicOff className="w-3.5 h-3.5 text-slate-400" />
              <span>Mantener &apos;V&apos;: Voz PTT</span>
            </>
          )}
        </button>

        {lastTranscript && (
          <span className="text-[11px] text-slate-400 italic hidden md:inline truncate max-w-xs">
            &ldquo;{lastTranscript}&rdquo;
          </span>
        )}
      </div>

      {/* 2. Buffer de Deshacer de 10 Segundos (Ctrl+Z o 2x Espacio) */}
      <div className="flex items-center gap-2 flex-wrap">
        {undoItem ? (
          <div className="relative overflow-hidden flex items-center gap-2 px-3 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
            {/* Barra de progreso regresiva (10s) */}
            <div
              className="absolute left-0 bottom-0 top-0 bg-amber-500/20 pointer-events-none transition-all duration-100"
              style={{ width: `${undoProgressPct}%` }}
            />
            <span className="relative z-10 text-[11px]">
              Mesa #{undoItem.tableNumber} lista
            </span>
            <button
              type="button"
              onClick={onExecuteUndo}
              className="relative z-10 px-2 py-0.5 rounded-lg bg-amber-500 text-slate-950 font-black text-[10px] hover:bg-amber-400 flex items-center gap-1 transition-all active:scale-95 shadow-xs cursor-pointer"
              title="Recuperar ticket (o pulsa Ctrl+Z / doble espacio)"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Deshacer (Ctrl+Z)</span>
            </button>
          </div>
        ) : (
          <span className="text-[11px] text-slate-500 hidden lg:inline font-medium">
            Ctrl+Z / 2x Espacio: Deshacer (10s)
          </span>
        )}

        {/* 3. Botón Simulador de Comandas Mixtas y Voz */}
        <button
          type="button"
          onClick={onSimulateMixedOrder}
          className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[11px] border border-slate-700 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-2xs"
          title="Prueba en un clic: bebidas a barra y comida locutada con TTS en cocina"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Simular Comanda Mixta</span>
        </button>

        {/* Simulador rápido de comandos de voz si no hay micrófono */}
        {fifoTargetTable && (
          <div className="hidden sm:flex items-center gap-1">
            <button
              type="button"
              onClick={() => onSimulateVoiceCommand('oido', fifoTargetTable)}
              className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-300 text-[10px] font-bold border border-slate-700 cursor-pointer"
              title="Simula decir 'Oído mesa X'"
            >
              🎤 &ldquo;Oído #{fifoTargetTable}&rdquo;
            </button>
            <button
              type="button"
              onClick={() => onSimulateVoiceCommand('listo', fifoTargetTable)}
              className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 text-[10px] font-bold border border-slate-700 cursor-pointer"
              title="Simula decir 'Listo mesa X'"
            >
              🎤 &ldquo;Listo #{fifoTargetTable}&rdquo;
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
