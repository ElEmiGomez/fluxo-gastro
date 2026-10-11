'use client'

import React from 'react'
import Image from 'next/image'
import { Search, Plus, Utensils, Power, Edit2, Trash2 } from 'lucide-react'
import { Product, Category } from '@/types/database.types'
import { formatCurrency } from '@/lib/utils'

interface AdminProductCatalogProps {
  products: Product[]
  filteredProducts: Product[]
  categories: Category[]
  searchQuery: string
  onSearchChange: (q: string) => void
  selectedCategoryFilter: string
  onCategoryFilterChange: (catId: string) => void
  onOpenNewProductModal: () => void
  onOpenEditProductModal: (prod: Product) => void
  onToggleAvailability: (productId: string, currentAvailable: boolean) => void
  onDeleteProduct: (productId: string) => void
}

export function AdminProductCatalog({
  products,
  filteredProducts,
  categories,
  searchQuery,
  onSearchChange,
  selectedCategoryFilter,
  onCategoryFilterChange,
  onOpenNewProductModal,
  onOpenEditProductModal,
  onToggleAvailability,
  onDeleteProduct,
}: AdminProductCatalogProps) {
  return (
    <div className="space-y-4">
      {/* Barra de Filtros & Acción Nuevo */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar plato por nombre o ingrediente..."
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-white text-xs sm:text-sm focus:outline-none focus:border-purple-500"
          />
        </div>

        <button
          onClick={onOpenNewProductModal}
          className="px-4 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs sm:text-sm shadow-lg shadow-purple-600/20 flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Añadir Nuevo Plato</span>
        </button>
      </div>

      {/* Filtro de Categorías con Pastillas */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        <button
          onClick={() => onCategoryFilterChange('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            selectedCategoryFilter === 'all'
              ? 'bg-slate-200 text-slate-950 font-black'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          Todos ({products.length})
        </button>
        {categories.map(cat => {
          const count = products.filter(p => p.category_id === cat.id).length
          return (
            <button
              key={cat.id}
              onClick={() => onCategoryFilterChange(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategoryFilter === cat.id
                  ? 'bg-purple-600 text-white font-black'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {cat.name} ({count})
            </button>
          )
        })}
      </div>

      {/* Lista de Platos Táctil */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filteredProducts.map(product => {
          const isAvailable = product.is_available !== false
          const catName = categories.find(c => c.id === product.category_id)?.name || 'General'

          return (
            <div
              key={product.id}
              className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                isAvailable
                  ? 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                  : 'bg-slate-950 border-rose-900/40 opacity-75'
              }`}
            >
              {/* Miniatura Foto */}
              {product.image_url ? (
                <div className="relative w-14 h-14 min-w-[3.5rem] aspect-square overflow-hidden rounded-xl bg-slate-800 flex-shrink-0 border border-slate-700">
                  <Image
                    src={product.image_url}
                    alt={product.name}
                    fill
                    className="w-full h-full object-cover"
                    sizes="56px"
                  />
                </div>
              ) : (
                <div className="w-14 h-14 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-600 flex-shrink-0">
                  <Utensils size={20} />
                </div>
              )}

              {/* Datos del Plato */}
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[9px] font-black uppercase text-purple-400 bg-purple-500/10 px-1.5 py-0.2 rounded border border-purple-500/20">
                    {catName}
                  </span>
                  {!isAvailable && (
                    <span className="text-[9px] font-black uppercase text-rose-300 bg-rose-500/20 px-1.5 py-0.2 rounded border border-rose-500/30">
                      AGOTADO
                    </span>
                  )}
                </div>
                <h3 className="font-extrabold text-xs sm:text-sm text-white truncate">
                  {product.name}
                </h3>
                <div className="flex items-center gap-2 flex-wrap">
                  {product.original_price != null && product.original_price > product.price && (
                    <span className="line-through text-slate-500 text-xs font-bold tabular-nums">
                      {formatCurrency(product.original_price)}
                    </span>
                  )}
                  <span className="font-black text-xs text-cyan-400 tabular-nums">
                    {product.price_type === 'weight'
                      ? `${formatCurrency(product.price)} / ${product.price_unit || '100g'}`
                      : formatCurrency(product.price)}
                  </span>
                  {product.original_price != null && product.original_price > product.price && (
                    <span className="text-[9px] font-black uppercase text-emerald-400 bg-emerald-500/10 px-1 py-0.5 rounded border border-emerald-500/20">
                      -{Math.round(((product.original_price - product.price) / product.original_price) * 100)}%
                    </span>
                  )}
                </div>
              </div>

              {/* Botones de Control Rápido */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {/* Toggle ON/OFF Disponibilidad Inmediata */}
                <button
                  type="button"
                  onClick={() => onToggleAvailability(product.id, isAvailable)}
                  title={isAvailable ? 'Marcar como agotado' : 'Marcar como disponible'}
                  className={`p-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer flex items-center gap-1 ${
                    isAvailable
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                      : 'bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20'
                  }`}
                >
                  <Power size={14} />
                </button>

                {/* Editar */}
                <button
                  type="button"
                  onClick={() => onOpenEditProductModal(product)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
                  title="Editar plato"
                >
                  <Edit2 size={14} />
                </button>

                {/* Eliminar */}
                <button
                  type="button"
                  onClick={() => onDeleteProduct(product.id)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 border border-slate-700 transition-colors cursor-pointer"
                  title="Eliminar plato"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
