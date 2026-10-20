'use client'

import React, { useState } from 'react'
import { Sparkles, RefreshCw, CheckCircle2, Plus, AlertTriangle, X, ShieldAlert, Trash2 } from 'lucide-react'
import { Category } from '@/types/database.types'
import { formatCurrency } from '@/lib/utils'
import { AiParsedMenuResult } from '@/types/admin.types'

interface AdminAiImporterProps {
  slug?: string
  categories?: Category[]
  aiRawText: string
  onAiRawTextChange: (val: string) => void
  aiParsing: boolean
  aiParsedResult: AiParsedMenuResult | null
  onParseWithAI: () => void
  onApplyAiMenu: (mode: 'append' | 'overwrite', customParsed?: AiParsedMenuResult | null) => void
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
  slug,
  categories: existingCategories = [],
  aiRawText,
  onAiRawTextChange,
  aiParsing,
  aiParsedResult,
  onParseWithAI,
  onApplyAiMenu,
}: AdminAiImporterProps) {
  const [confirmModalMode, setConfirmModalMode] = useState<'append' | 'overwrite' | null>(null)
  const [editableResult, setEditableResult] = useState<AiParsedMenuResult | null>(aiParsedResult)

  React.useEffect(() => {
    setEditableResult(aiParsedResult)
  }, [aiParsedResult])

  const handleConfirm = () => {
    if (confirmModalMode) {
      onApplyAiMenu(confirmModalMode, editableResult || undefined)
      setConfirmModalMode(null)
    }
  }

  // Lista unificada de categorías disponibles para el selector
  const availableCategories = React.useMemo(() => {
    const list: { id: string; name: string }[] = []
    const seenNames = new Set<string>()

    if (editableResult?.categories) {
      for (const cat of editableResult.categories) {
        const norm = cat.name.trim().toLowerCase()
        if (!seenNames.has(norm)) {
          seenNames.add(norm)
          list.push({ id: cat.id, name: cat.name })
        }
      }
    }

    for (const cat of existingCategories) {
      const norm = cat.name.trim().toLowerCase()
      if (!seenNames.has(norm)) {
        seenNames.add(norm)
        list.push({ id: cat.id, name: cat.name })
      }
    }

    return list
  }, [editableResult, existingCategories])

  const handleDishCategoryChange = (dishId: string, newCategoryId: string) => {
    if (!editableResult) return
    setEditableResult({
      ...editableResult,
      products: editableResult.products.map(p =>
        p.id === dishId ? { ...p, category_id: newCategoryId } : p
      ),
    })
  }

  const handleRemoveDish = (dishId: string) => {
    if (!editableResult) return
    const updatedProducts = editableResult.products.filter(p => p.id !== dishId)
    const usedCatIds = new Set(updatedProducts.map(p => p.category_id))
    const updatedCategories = editableResult.categories.filter(c => usedCatIds.has(c.id))
    setEditableResult({
      ...editableResult,
      total_dishes: updatedProducts.length,
      total_categories: updatedCategories.length,
      categories: updatedCategories,
      products: updatedProducts,
    })
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Tarjeta de Entrada de Menú */}
      <div className="p-6 rounded-2xl bg-slate-800/60 border border-slate-700/70 shadow-xl space-y-5 backdrop-blur-md">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center font-black shadow-xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-black text-base text-white">Digitalizador Inteligente de Carta con IA</h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Pega el texto de tu menú, carta física transcrita o lista de platos. La IA extraerá categorías, precios y alérgenos en una previsualización interactiva.
            </p>
          </div>
        </div>

        {/* Ejemplos Rápidos */}
        <div className="flex items-center gap-2 flex-wrap text-xs pt-1">
          <span className="text-slate-400 font-semibold text-xs">Cargar plantilla de prueba:</span>
          <button
            type="button"
            onClick={() => onAiRawTextChange(TAPERIA_PRESET)}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white text-xs font-bold border border-slate-700 transition-colors cursor-pointer"
          >
            Ejemplo Tapería Gallega
          </button>
          <button
            type="button"
            onClick={() => onAiRawTextChange(BURGER_PRESET)}
            className="px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 text-xs font-bold border border-cyan-500/20 transition-colors cursor-pointer"
          >
            Ejemplo Hamburguesería
          </button>
        </div>

        {/* Textarea */}
        <textarea
          rows={8}
          placeholder="Pega aquí el texto de tu carta, platos con precios (ej: Hamburguesa Clásica - 11,50€)..."
          value={aiRawText}
          onChange={e => onAiRawTextChange(e.target.value)}
          className="w-full p-4 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder:text-slate-500 text-xs sm:text-sm font-mono focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 transition-all leading-relaxed shadow-inner"
        />

        {/* Botón Extraer Previsualización */}
        <button
          type="button"
          onClick={onParseWithAI}
          disabled={aiParsing || !aiRawText.trim()}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
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
        <div className="p-6 rounded-2xl bg-slate-800/70 border border-slate-700/70 shadow-2xl space-y-5 animate-in fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-slate-700">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <div>
                <h3 className="font-black text-sm sm:text-base text-white">
                  Previsualización de Carta
                </h3>
                <p className="text-xs text-slate-400 font-medium">
                  {aiParsedResult.total_dishes} platos detectados en {aiParsedResult.total_categories} categorías
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1 rounded-full">
              Borrador (Sin Guardar)
            </span>
          </div>

          {/* Tabla de Platos Detectados con Selector de Categoría Editable */}
          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {(editableResult || aiParsedResult).categories.map((cat) => {
              const currentResult = editableResult || aiParsedResult
              const dishes = currentResult.products.filter((p) => p.category_id === cat.id)
              if (dishes.length === 0) return null
              return (
                <div key={cat.id} className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5">
                  <span className="text-xs font-black text-cyan-400 uppercase tracking-wider block">
                    {cat.name} ({dishes.length})
                  </span>
                  <div className="divide-y divide-slate-800">
                    {dishes.map((d) => (
                      <div key={d.id} className="py-2 flex items-center justify-between text-xs gap-3">
                        <div className="truncate pr-2 flex-1">
                          <span className="font-bold text-white block truncate">{d.name}</span>
                          {d.description && <span className="text-slate-400 text-[11px] block truncate">{d.description}</span>}
                          {d.allergens && d.allergens.length > 0 && (
                            <div className="flex items-center gap-1 mt-0.5">
                              {d.allergens.map((a: string) => (
                                <span key={a} className="text-[10px] font-semibold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-1 py-0.2 rounded">
                                  {a}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {/* Selector de Categoría para cambiar manualmente */}
                          <select
                            value={d.category_id}
                            onChange={(e) => handleDishCategoryChange(d.id, e.target.value)}
                            className="text-[11px] font-semibold py-1 px-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer shadow-2xs"
                            title="Cambiar categoría de este plato"
                          >
                            {availableCategories.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                          </select>

                          <span className="font-black text-cyan-400 tabular-nums whitespace-nowrap bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700 shadow-2xs">
                            {formatCurrency(d.price)}
                          </span>

                          <button
                            type="button"
                            onClick={() => handleRemoveDish(d.id)}
                            className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-rose-500/20 transition-colors cursor-pointer"
                            title="Eliminar plato del borrador"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Opciones de Publicación */}
          <div className="pt-2 border-t border-slate-700 space-y-3">
            <p className="text-xs text-slate-300 font-medium text-center">
              ¿Qué deseas hacer con estos platos detectados?
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setConfirmModalMode('append')}
                className="py-3.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs sm:text-sm shadow-md shadow-cyan-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Añadir a Platos Existentes</span>
              </button>

              <button
                type="button"
                onClick={() => setConfirmModalMode('overwrite')}
                className="py-3.5 px-4 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 font-black text-xs sm:text-sm border border-rose-500/40 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Sobrescribir Toda la Carta</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Seguridad */}
      {confirmModalMode && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl animate-in zoom-in-95 text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                {confirmModalMode === 'append' ? (
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center">
                    <Plus className="w-5 h-5 stroke-[2.5]" />
                  </div>
                ) : (
                  <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                )}
                <h3 className="font-black text-base text-white">
                  {confirmModalMode === 'append'
                    ? '¿Añadir a platos existentes?'
                    : '¿Sobrescribir toda la carta?'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setConfirmModalMode(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-300 leading-relaxed space-y-2">
              {confirmModalMode === 'append' ? (
                <p>
                  Se añadirán los <strong>{aiParsedResult?.total_dishes} nuevos platos</strong> y sus categorías a la carta actual.
                  Los platos y categorías que ya tienes configurados se <strong>mantendrán intactos</strong>.
                </p>
              ) : (
                <div className="space-y-2">
                  <p className="text-rose-400 font-bold bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl">
                    ⚠️ Advertencia: Esta acción reemplazará toda tu carta actual. Todos los platos y categorías actuales serán eliminados y sustituidos por los {aiParsedResult?.total_dishes} nuevos platos.
                  </p>
                  <p>
                    ¿Estás seguro de que deseas proceder con la sobrescritura total?
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModalMode(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 font-bold text-xs transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className={`px-5 py-2.5 rounded-xl font-black text-xs text-white shadow-md transition-all cursor-pointer ${
                  confirmModalMode === 'append'
                    ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/25'
                    : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/25'
                }`}
              >
                {confirmModalMode === 'append' ? 'Confirmar y Añadir' : 'Sí, Sobrescribir Carta'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
