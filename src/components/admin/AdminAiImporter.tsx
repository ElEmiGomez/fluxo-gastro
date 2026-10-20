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
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-5">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center font-black">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-black text-base text-slate-900">Digitalizador Inteligente de Carta con IA</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Pega el texto de tu menú, carta física transcrita o lista de platos. La IA extraerá categorías, precios y alérgenos en una previsualización interactiva.
            </p>
          </div>
        </div>

        {/* Ejemplos Rápidos */}
        <div className="flex items-center gap-2 flex-wrap text-xs pt-1">
          <span className="text-slate-500 font-semibold text-xs">Cargar plantilla de prueba:</span>
          <button
            type="button"
            onClick={() => onAiRawTextChange(TAPERIA_PRESET)}
            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 transition-colors cursor-pointer"
          >
            Ejemplo Tapería Gallega
          </button>
          <button
            type="button"
            onClick={() => onAiRawTextChange(BURGER_PRESET)}
            className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold border border-blue-200 transition-colors cursor-pointer"
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
          className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs sm:text-sm font-mono focus:outline-none focus:border-blue-500 focus:bg-white transition-colors leading-relaxed"
        />

        {/* Botón Extraer Previsualización */}
        <button
          type="button"
          onClick={onParseWithAI}
          disabled={aiParsing || !aiRawText.trim()}
          className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
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
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-md space-y-5 animate-in fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <div>
                <h3 className="font-black text-sm sm:text-base text-slate-900">
                  Previsualización de Carta
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {aiParsedResult.total_dishes} platos detectados en {aiParsedResult.total_categories} categorías
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full">
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
                <div key={cat.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                  <span className="text-xs font-black text-blue-700 uppercase tracking-wider block">
                    {cat.name} ({dishes.length})
                  </span>
                  <div className="divide-y divide-slate-200/70">
                    {dishes.map((d) => (
                      <div key={d.id} className="py-2 flex items-center justify-between text-xs gap-3">
                        <div className="truncate pr-2 flex-1">
                          <span className="font-bold text-slate-900 block truncate">{d.name}</span>
                          {d.description && <span className="text-slate-500 text-[11px] block truncate">{d.description}</span>}
                          {d.allergens && d.allergens.length > 0 && (
                            <div className="flex items-center gap-1 mt-0.5">
                              {d.allergens.map((a: string) => (
                                <span key={a} className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-1 py-0.2 rounded">
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
                            className="text-[11px] font-semibold py-1 px-2 rounded-lg bg-white border border-slate-200 text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer shadow-2xs"
                            title="Cambiar categoría de este plato"
                          >
                            {availableCategories.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                          </select>

                          <span className="font-black text-slate-900 tabular-nums whitespace-nowrap bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                            {formatCurrency(d.price)}
                          </span>

                          <button
                            type="button"
                            onClick={() => handleRemoveDish(d.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors cursor-pointer"
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
          <div className="pt-2 border-t border-slate-100 space-y-3">
            <p className="text-xs text-slate-600 font-medium text-center">
              ¿Qué deseas hacer con estos platos detectados?
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setConfirmModalMode('append')}
                className="py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs sm:text-sm shadow-md shadow-blue-600/10 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Añadir a Platos Existentes</span>
              </button>

              <button
                type="button"
                onClick={() => setConfirmModalMode('overwrite')}
                className="py-3.5 px-4 rounded-xl bg-white hover:bg-rose-50 text-rose-700 hover:text-rose-800 font-black text-xs sm:text-sm border border-rose-300 transition-all cursor-pointer flex items-center justify-center gap-2"
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
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                {confirmModalMode === 'append' ? (
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center">
                    <Plus className="w-5 h-5 stroke-[2.5]" />
                  </div>
                ) : (
                  <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                )}
                <h3 className="font-black text-base text-slate-900">
                  {confirmModalMode === 'append'
                    ? '¿Añadir a platos existentes?'
                    : '¿Sobrescribir toda la carta?'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setConfirmModalMode(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-600 leading-relaxed space-y-2">
              {confirmModalMode === 'append' ? (
                <p>
                  Se añadirán los <strong>{aiParsedResult?.total_dishes} nuevos platos</strong> y sus categorías a la carta actual.
                  Los platos y categorías que ya tienes configurados se <strong>mantendrán intactos</strong>.
                </p>
              ) : (
                <div className="space-y-2">
                  <p className="text-rose-700 font-bold bg-rose-50 border border-rose-200 p-3 rounded-xl">
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
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className={`px-5 py-2.5 rounded-xl font-black text-xs text-white shadow-md transition-all cursor-pointer ${
                  confirmModalMode === 'append'
                    ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20'
                    : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
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
