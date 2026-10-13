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
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar plato por nombre o ingrediente..."
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs sm:text-sm focus:outline-none focus:border-blue-500 shadow-2xs transition-colors"
          />
        </div>

        <button
          onClick={onOpenNewProductModal}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs sm:text-sm shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Añadir Nuevo Plato</span>
        </button>
      </div>

      {/* Filtro de Categorías con Pastillas */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        <button
          onClick={() => onCategoryFilterChange('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            selectedCategoryFilter === 'all'
              ? 'bg-blue-600 text-white font-black shadow-xs'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
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
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategoryFilter === cat.id
                  ? 'bg-blue-600 text-white font-black shadow-xs'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
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
              className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 shadow-xs ${
                isAvailable
                  ? 'bg-white border-slate-200 hover:border-slate-300'
                  : 'bg-slate-50 border-slate-200 opacity-70'
              }`}
            >
              {/* Miniatura Foto */}
              {product.image_url ? (
                <div className="relative w-14 h-14 min-w-[3.5rem] aspect-square overflow-hidden rounded-xl bg-slate-100 flex-shrink-0 border border-slate-200">
                  <Image
                    src={product.image_url}
                    alt={product.name}
                    fill
                    className="w-full h-full object-cover"
                    sizes="56px"
                  />
                </div>
              ) : (
                <div className="w-14 h-14 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 flex-shrink-0">
                  <Utensils size={20} />
                </div>
              )}

              {/* Datos del Plato */}
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[9px] font-black uppercase text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                    {catName}
                  </span>
                  {!isAvailable && (
                    <span className="text-[9px] font-black uppercase text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                      AGOTADO
                    </span>
                  )}
                </div>
                <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 truncate">
                  {product.name}
                </h3>
                <div className="flex items-center gap-2 flex-wrap">
                  {product.original_price != null && product.original_price > product.price && (
                    <span className="line-through text-slate-400 text-xs font-bold tabular-nums">
                      {formatCurrency(product.original_price)}
                    </span>
                  )}
                  <span className="font-black text-xs text-slate-900 tabular-nums">
                    {product.price_type === 'weight'
                      ? `${formatCurrency(product.price)} / ${product.price_unit || '100g'}`
                      : formatCurrency(product.price)}
                  </span>
                  {product.original_price != null && product.original_price > product.price && (
                    <span className="text-[9px] font-black uppercase text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded border border-emerald-200">
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
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                      : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                  }`}
                >
                  <Power size={14} />
                </button>

                {/* Editar */}
                <button
                  type="button"
                  onClick={() => onOpenEditProductModal(product)}
                  className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 transition-colors cursor-pointer"
                  title="Editar plato"
                >
                  <Edit2 size={14} />
                </button>

                {/* Eliminar */}
                <button
                  type="button"
                  onClick={() => onDeleteProduct(product.id)}
                  className="p-2 rounded-xl bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 transition-colors cursor-pointer"
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
