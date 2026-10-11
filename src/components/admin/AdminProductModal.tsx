'use client'

import React from 'react'
import { X } from 'lucide-react'
import { Product, Category } from '@/types/database.types'
import { MANDATORY_EU_ALLERGENS } from '@/lib/allergens'

interface AdminProductModalProps {
  isOpen: boolean
  editingProduct: Product | null
  categories: Category[]
  selectedAllergens: string[]
  onAllergenToggle: (allergenId: string) => void
  onClose: () => void
  onSave: (productData: Partial<Product>) => void
}

export function AdminProductModal({
  isOpen,
  editingProduct,
  categories,
  selectedAllergens,
  onAllergenToggle,
  onClose,
  onSave,
}: AdminProductModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg p-6 space-y-4 shadow-2xl text-white animate-in zoom-in-95">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="font-black text-sm sm:text-base">
            {editingProduct ? 'Editar Plato' : 'Añadir Nuevo Plato'}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-full bg-slate-800 cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <form
          onSubmit={e => {
            e.preventDefault()
            const fd = new FormData(e.currentTarget)
            const origRaw = String(fd.get('original_price') || '').trim()
            const origParsed = origRaw ? parseFloat(origRaw.replace(',', '.')) : null
            const costRaw = String(fd.get('cost_price') || '').trim()
            const costParsed = costRaw ? parseFloat(costRaw.replace(',', '.')) : null
            onSave({
              id: editingProduct?.id,
              name: String(fd.get('name') || ''),
              price: parseFloat(String(fd.get('price') || '0').replace(',', '.')),
              cost_price: costParsed && !isNaN(costParsed) && costParsed >= 0 ? costParsed : null,
              original_price: origParsed && !isNaN(origParsed) && origParsed > 0 ? origParsed : null,
              category_id: String(fd.get('category_id') || categories[0]?.id || 'cat-1'),
              description: String(fd.get('description') || ''),
              image_url: String(fd.get('image_url') || ''),
              allergens: selectedAllergens,
              price_type: fd.get('is_weight') ? 'weight' : 'unit',
              price_unit: fd.get('is_weight') ? '100g' : undefined,
            })
          }}
          className="space-y-3 text-xs sm:text-sm"
        >
          <div className="space-y-1">
            <label className="text-slate-400 font-bold block">Nombre del Plato *</label>
            <input
              name="name"
              required
              defaultValue={editingProduct?.name || ''}
              placeholder="Ej: Hamburguesa Gallega Doble"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-slate-400 font-bold block">Precio (€) *</label>
              <input
                name="price"
                type="number"
                step="0.01"
                required
                defaultValue={editingProduct?.price || ''}
                placeholder="Ej: 14.50"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-purple-500 tabular-nums"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-400 font-bold block flex items-center justify-between">
                <span>Coste Ingredientes (€)</span>
                <span className="text-[10px] text-slate-500 font-normal">Materia prima</span>
              </label>
              <input
                name="cost_price"
                type="number"
                step="0.01"
                defaultValue={editingProduct?.cost_price != null ? editingProduct.cost_price : ''}
                placeholder="Ej: 4.20 (Opcional)"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-purple-500 tabular-nums"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-400 font-bold block flex items-center justify-between">
                <span>Precio Habitual (€)</span>
                <span className="text-[10px] text-slate-500 font-normal">Tachado</span>
              </label>
              <input
                name="original_price"
                type="number"
                step="0.01"
                defaultValue={editingProduct?.original_price || ''}
                placeholder="Ej: 18.00 (Opcional)"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-purple-500 tabular-nums"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-slate-400 font-bold block">Categoría *</label>
            <select
              name="category_id"
              defaultValue={editingProduct?.category_id || categories[0]?.id}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-purple-500"
            >
              {categories.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-slate-400 font-bold block">Descripción o Ingredientes</label>
            <textarea
              name="description"
              rows={2}
              defaultValue={editingProduct?.description || ''}
              placeholder="Ej: 200g de carne madurada, queso de Arzúa y cebolla caramelizada."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-slate-400 font-bold block">URL de Foto (Opcional)</label>
            <input
              name="image_url"
              defaultValue={editingProduct?.image_url || ''}
              placeholder="https://images.unsplash.com/..."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Selector de 14 Alérgenos Obligatorios UE 1169/2011 */}
          <div className="space-y-2 pt-1 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-slate-300 font-bold block text-xs">
                Alérgenos UE (Reg. 1169/2011)
              </label>
              <span className="text-[10px] text-slate-500 font-medium">
                {selectedAllergens.length > 0 ? `${selectedAllergens.length} seleccionados` : 'Ninguno (Apto general)'}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-36 overflow-y-auto pr-1">
              {MANDATORY_EU_ALLERGENS.map(al => {
                const isSelected = selectedAllergens.includes(al.id)
                return (
                  <button
                    key={al.id}
                    type="button"
                    onClick={() => onAllergenToggle(al.id)}
                    className={`px-2 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all text-left border cursor-pointer select-none ${
                      isSelected
                        ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                    }`}
                  >
                    <span className="text-sm flex-shrink-0">{al.icon}</span>
                    <span className="truncate">{al.name.es}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="is_weight"
              name="is_weight"
              defaultChecked={editingProduct?.price_type === 'weight'}
              className="rounded text-purple-600 focus:ring-purple-500"
            />
            <label htmlFor="is_weight" className="text-slate-300 font-bold cursor-pointer">
              Precio al peso (ej: Chuletón o Marisco por 100g)
            </label>
          </div>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black shadow-md cursor-pointer"
            >
              Guardar Plato
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
