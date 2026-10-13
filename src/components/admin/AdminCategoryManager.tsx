'use client'

import React from 'react'
import { Plus, Check, X, ChevronUp, ChevronDown, Edit2, Trash2 } from 'lucide-react'
import { Category, Product } from '@/types/database.types'

interface AdminCategoryManagerProps {
  categories: Category[]
  products: Product[]
  newCatName: string
  onNewCatNameChange: (val: string) => void
  onCreateCategory: () => void
  editingCatId: string | null
  editingCatName: string
  onEditingCatNameChange: (val: string) => void
  onStartEditingCategory: (cat: Category) => void
  onCancelEditingCategory: () => void
  onRenameCategory: (catId: string) => void
  onMoveCategory: (index: number, direction: 'up' | 'down') => void
  onDeleteCategory: (categoryId: string) => void
}

export function AdminCategoryManager({
  categories,
  products,
  newCatName,
  onNewCatNameChange,
  onCreateCategory,
  editingCatId,
  editingCatName,
  onEditingCatNameChange,
  onStartEditingCategory,
  onCancelEditingCategory,
  onRenameCategory,
  onMoveCategory,
  onDeleteCategory,
}: AdminCategoryManagerProps) {
  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Crear Categoría */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-3">
        <input
          type="text"
          placeholder="Nombre de la nueva categoría (ej: RACIONES, CÓCTELES...)"
          value={newCatName}
          onChange={e => onNewCatNameChange(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && onCreateCategory()}
          className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs sm:text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-colors uppercase placeholder:normal-case"
        />
        <button
          onClick={onCreateCategory}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-md shadow-blue-600/10 transition-colors cursor-pointer"
        >
          <Plus size={16} />
          <span>Crear</span>
        </button>
      </div>

      {/* Lista Reordenable de Categorías */}
      <div className="space-y-2">
        {categories.map((cat, idx) => {
          const dishCount = products.filter(p => p.category_id === cat.id).length
          const isEditing = editingCatId === cat.id

          return (
            <div
              key={cat.id}
              className="p-3.5 rounded-2xl bg-white border border-slate-200 flex items-center justify-between gap-3 shadow-xs hover:border-slate-300 transition-colors"
            >
              {/* Posición y Nombre */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="w-6 h-6 rounded-lg bg-blue-50 text-blue-700 text-xs font-black flex items-center justify-center flex-shrink-0 border border-blue-200">
                  {idx + 1}
                </span>

                {isEditing ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="text"
                      value={editingCatName}
                      onChange={e => onEditingCatNameChange(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && onRenameCategory(cat.id)}
                      autoFocus
                      className="px-3 py-1.5 rounded-lg bg-white border border-blue-500 text-slate-900 text-xs sm:text-sm uppercase flex-1 focus:outline-none"
                    />
                    <button
                      onClick={() => onRenameCategory(cat.id)}
                      className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer"
                      title="Guardar"
                    >
                      <Check size={14} />
                    </button>
                    <button
                      onClick={onCancelEditingCategory}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors cursor-pointer"
                      title="Cancelar"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div>
                    <h3 className="font-extrabold text-xs sm:text-sm text-slate-900">{cat.name}</h3>
                    <span className="text-[10px] text-slate-500 font-semibold">{dishCount} platos en esta sección</span>
                  </div>
                )}
              </div>

              {/* Botones de Reordenación y Acciones */}
              {!isEditing && (
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => onMoveCategory(idx, 'up')}
                    disabled={idx === 0}
                    className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 disabled:opacity-30 text-slate-600 border border-slate-200 transition-colors cursor-pointer"
                    title="Subir orden"
                  >
                    <ChevronUp size={14} />
                  </button>
                  <button
                    onClick={() => onMoveCategory(idx, 'down')}
                    disabled={idx === categories.length - 1}
                    className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 disabled:opacity-30 text-slate-600 border border-slate-200 transition-colors cursor-pointer"
                    title="Bajar orden"
                  >
                    <ChevronDown size={14} />
                  </button>
                  <button
                    onClick={() => onStartEditingCategory(cat)}
                    className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition-colors cursor-pointer"
                    title="Renombrar"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => onDeleteCategory(cat.id)}
                    className="p-1.5 rounded-lg bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 transition-colors cursor-pointer"
                    title="Eliminar categoría"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
