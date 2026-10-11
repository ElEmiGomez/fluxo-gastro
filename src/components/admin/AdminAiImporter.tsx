'use client'

import React from 'react'
import { Sparkles, RefreshCw, CheckCircle2, Check } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { AiParsedMenuResult } from '@/types/admin.types'

interface AdminAiImporterProps {
  aiRawText: string
  onAiRawTextChange: (val: string) => void
  aiParsing: boolean
  aiParsedResult: AiParsedMenuResult | null
  onParseWithAI: () => void
  onApplyAiMenu: () => void
}

const TAPERIA_PRESET = `TAPAS Y RACIONES
Pulpo á Feira con patatas gallegas - 18,50€
Zamburiñas de la Ría a la plancha (8 unidades) - 16.00 €
Pimientos de Padrón fritos con sal Maldon: 7,50
Croquetas artesanas de jamón ibérico (6 uds) - 8,90€

PLATOS PRINCIPALES
Chuletón de Vaca Rubia Galega a la brasa (1kg) al peso - 48,00€
Bacalao al horno con costra de pan de maíz - 19.50€

POSTRES CASEROS
Tarta de Santiago con azúcar glas - 5.50€
Filloas rellenas de crema pastelera - 6.00€`

const BURGER_PRESET = `HAMBURGUESAS GOURMET
Doble Bacon Monster con queso cheddar fundido y cebolla crujiente 13.90€
Truffle Burger con carne de ternera madurada y mayonesa trufada 15,50 €
Smash Burger Clásica con salsa especial 11.00€

BEBIDAS & CERVEZAS
Pinta Cerveza Artesanal IPA 4.50€
Agua Mineral 500ml 2,00€`

export function AdminAiImporter({
  aiRawText,
  onAiRawTextChange,
  aiParsing,
  aiParsedResult,
  onParseWithAI,
  onApplyAiMenu,
}: AdminAiImporterProps) {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="p-5 rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950/40 to-cyan-950/30 border border-cyan-500/30 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center font-black">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-black text-sm sm:text-base text-white">Digitalizador Inteligente de Carta con IA</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Pega el texto de tu menú, fotos transcritas o lista de platos. La IA detectará platos, precios y alérgenos al instante.
            </p>
          </div>
        </div>

        {/* Ejemplos Rápidos */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="text-slate-400 font-bold">Cargar Ejemplo:</span>
          <button
            type="button"
            onClick={() => onAiRawTextChange(TAPERIA_PRESET)}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 text-[11px] font-bold border border-slate-700 cursor-pointer"
          >
            Ejemplo Tapería Gallega
          </button>
          <button
            type="button"
            onClick={() => onAiRawTextChange(BURGER_PRESET)}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-purple-400 text-[11px] font-bold border border-slate-700 cursor-pointer"
          >
            Ejemplo Hamburguesería
          </button>
        </div>

        {/* Textarea */}
        <textarea
          rows={8}
          placeholder="Pega aquí el texto de tu menú, fotos transcritas o lista de platos con sus precios..."
          value={aiRawText}
          onChange={e => onAiRawTextChange(e.target.value)}
          className="w-full p-4 rounded-2xl bg-slate-950 border border-slate-800 text-slate-100 text-xs sm:text-sm font-mono focus:outline-none focus:border-cyan-500 leading-relaxed"
        />

        {/* Botón Parsear */}
        <button
          type="button"
          onClick={onParseWithAI}
          disabled={aiParsing || !aiRawText.trim()}
          className="w-full py-3.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-cyan-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          {aiParsing ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Analizando y extrayendo platos con IA...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Extraer y Previsualizar Carta con IA</span>
            </>
          )}
        </button>
      </div>

      {/* Previsualización del Resultado de IA */}
      {aiParsedResult && (
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <h3 className="font-black text-sm text-white">
                Previsualización: {aiParsedResult.total_dishes} platos en {aiParsedResult.total_categories} categorías
              </h3>
            </div>
          </div>

          {/* Tabla de Platos Detectados */}
          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {aiParsedResult.categories.map((cat) => {
              const dishes = aiParsedResult.products.filter((p) => p.category_id === cat.id)
              return (
                <div key={cat.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <span className="text-xs font-black text-cyan-400 uppercase tracking-wider">{cat.name}</span>
                  <div className="space-y-1">
                    {dishes.map((d) => (
                      <div key={d.id} className="flex items-center justify-between text-xs text-slate-300">
                        <div className="truncate pr-2">
                          <span className="font-bold text-white">{d.name}</span>
                          {d.description && <span className="text-slate-500 text-[11px] block truncate">{d.description}</span>}
                        </div>
                        <span className="font-black text-cyan-400 tabular-nums whitespace-nowrap">{formatCurrency(d.price)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Botón Aplicar en 1 Clic */}
          <button
            type="button"
            onClick={onApplyAiMenu}
            className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 transition-transform active:scale-95 cursor-pointer"
          >
            <Check className="w-5 h-5 stroke-[3]" />
            <span>🚀 Cargar en Carta con 1 Clic (Publicar Inmediatamente)</span>
          </button>
        </div>
      )}
    </div>
  )
}
