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
      <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/70 shadow-xl flex items-center gap-3 backdrop-blur-md">
        <input
          type="text"
          placeholder="Nombre de la nueva categoría (ej: RACIONES, CÓCTELES...)"
          value={newCatName}
          onChange={e => onNewCatNameChange(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && onCreateCategory()}
          className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs sm:text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 transition-all uppercase placeholder:normal-case placeholder:text-slate-500"
        />
        <button
          onClick={onCreateCategory}
          className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-1.5 shadow-md shadow-cyan-500/25 transition-all active:scale-95 cursor-pointer"
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
              className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/70 hover:border-cyan-500/40 flex items-center justify-between gap-3 shadow-md hover:bg-slate-800/90 transition-all group"
            >
              {/* Posición y Nombre */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="w-6 h-6 rounded-lg bg-cyan-500/10 text-cyan-400 text-xs font-black flex items-center justify-center flex-shrink-0 border border-cyan-500/20">
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
                      className="px-3 py-1.5 rounded-lg bg-slate-900 border border-cyan-500 text-white text-xs sm:text-sm uppercase flex-1 focus:outline-none"
                    />
                    <button
                      onClick={() => onRenameCategory(cat.id)}
                      className="p-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition-colors cursor-pointer"
                      title="Guardar"
                    >
                      <Check size={14} />
                    </button>
                    <button
                      onClick={onCancelEditingCategory}
                      className="p-1.5 rounded-lg bg-slate-750 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                      title="Cancelar"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div>
                    <h3 className="font-extrabold text-xs sm:text-sm text-white group-hover:text-cyan-400 transition-colors">{cat.name}</h3>
                    <span className="text-[10px] text-slate-400 font-semibold">{dishCount} platos en esta sección</span>
                  </div>
                )}
              </div>

              {/* Botones de Reordenación y Acciones */}
              {!isEditing && (
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => onMoveCategory(idx, 'up')}
                    disabled={idx === 0}
                    className="p-1.5 rounded-lg bg-slate-750 hover:bg-slate-700 disabled:opacity-20 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
                    title="Subir orden"
                  >
                    <ChevronUp size={14} />
                  </button>
                  <button
                    onClick={() => onMoveCategory(idx, 'down')}
                    disabled={idx === categories.length - 1}
                    className="p-1.5 rounded-lg bg-slate-750 hover:bg-slate-700 disabled:opacity-20 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
                    title="Bajar orden"
                  >
                    <ChevronDown size={14} />
                  </button>
                  <button
                    onClick={() => onStartEditingCategory(cat)}
                    className="p-1.5 rounded-lg bg-slate-750 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
                    title="Renombrar"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => onDeleteCategory(cat.id)}
                    className="p-1.5 rounded-lg bg-slate-750 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-500/30 transition-colors cursor-pointer"
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
