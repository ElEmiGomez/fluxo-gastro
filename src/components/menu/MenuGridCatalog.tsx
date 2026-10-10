'use client'

import React from 'react'
import Image from 'next/image'
import { Plus, Minus, Power, Edit2 } from 'lucide-react'
import { Product } from '@/types/database.types'
import { formatCurrency } from '@/lib/utils'
import { getTranslation, translateProductName, translateProductDescription } from '@/lib/i18n'
import { getAllergen, getAllergenName } from '@/lib/allergens'

interface MenuGridCatalogProps {
  filteredProducts: Product[]
  currentLang: string
  isFixedMenu: boolean
  isInSituAdmin: boolean
  getProductQuantity: (id: string) => number
  onUpdateQuantity: (product: Product, delta: number, e?: React.MouseEvent) => void
  onToggleAvailability: (id: string, current: boolean) => void
  onOpenEditModal: (product: Product) => void
  onCustomizeProduct: (product: Product) => void
}

export function MenuGridCatalog({
  filteredProducts,
  currentLang,
  isFixedMenu,
  isInSituAdmin,
  getProductQuantity,
  onUpdateQuantity,
  onToggleAvailability,
  onOpenEditModal,
  onCustomizeProduct,
}: MenuGridCatalogProps) {
  const t = (key: string) => getTranslation(currentLang, key)

  return (
    <div className="grid grid-cols-2 gap-3">
      {filteredProducts.map((product, idx) => {
        const qty = getProductQuantity(product.id)

        return (
          <div
            key={product.id}
            className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
          >
            <div>
              {product.image_url && (
                <div className="relative w-full aspect-[4/3] overflow-hidden bg-slate-100 shimmer-loading">
                  <Image
                    src={product.image_url}
                    alt={product.name}
                    fill
                    className="w-full h-full object-cover"
                    sizes="(max-width: 768px) 50vw, 300px"
                    priority={idx < 2}
                    loading={idx < 2 ? undefined : 'lazy'}
                  />
                </div>
              )}
              <div className="p-3.5 space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-slate-900 text-xs sm:text-sm leading-snug">
                      {translateProductName(currentLang, product.id, product.name)}
                    </h3>
                    {isInSituAdmin && product.is_available === false && (
                      <span className="inline-block mt-0.5 text-[9px] font-black text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded-md">
                        AGOTADO
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0 flex-wrap justify-end">
                    {product.original_price != null && product.original_price > product.price && (
                      <span className="line-through text-slate-400 text-xs font-bold tabular-nums">
                        {formatCurrency(product.original_price)}
                      </span>
                    )}
                    <span className="font-black text-xs sm:text-sm text-blue-700 tabular-nums">
                      {product.price_type === 'weight'
                        ? `${formatCurrency(product.price)} / ${product.price_unit || '100g'}`
                        : formatCurrency(product.price)}
                    </span>
                  </div>
                </div>

                {product.description && (
                  <p className="text-[11px] text-slate-500 font-normal line-clamp-2 leading-relaxed">
                    {translateProductDescription(currentLang, product.id, product.description)}
                  </p>
                )}

                {product.allergens && product.allergens.length > 0 && (
                  <div className="flex items-center gap-1 flex-wrap pt-1">
                    {product.allergens.map((aId) => {
                      const al = getAllergen(aId)
                      if (!al) return null
                      return (
                        <span
                          key={aId}
                          title={getAllergenName(aId, currentLang as any)}
                          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200/80 text-[10px] font-bold"
                        >
                          <span>{al.icon}</span>
                          <span className="hidden min-[420px]:inline">{getAllergenName(aId, currentLang as any).split(' ')[0]}</span>
                        </span>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Controles de Administración In-Situ en Grid */}
            {isInSituAdmin && (
              <div className="p-3.5 pt-0 pb-2 flex items-center justify-between gap-1 border-b border-slate-100 mb-2" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => onToggleAvailability(product.id, product.is_available !== false)}
                  title={product.is_available !== false ? 'Marcar como agotado' : 'Marcar como disponible'}
                  className={`px-2 py-1 rounded-xl text-[10px] font-black border transition-all flex items-center gap-1 cursor-pointer active:scale-95 ${
                    product.is_available !== false
                      ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30 hover:bg-emerald-500/20'
                      : 'bg-rose-500/15 text-rose-700 border-rose-500/40 hover:bg-rose-500/25'
                  }`}
                >
                  <Power size={10} className={product.is_available !== false ? 'text-emerald-600' : 'text-rose-600'} />
                  <span>{product.is_available !== false ? 'Disponible' : 'Agotado'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => onOpenEditModal(product)}
                  title="Editar plato"
                  className="p-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 transition-colors cursor-pointer active:scale-95"
                >
                  <Edit2 size={12} />
                </button>
              </div>
            )}

            {!isFixedMenu ? (
              <div className="p-3.5 pt-0 flex items-center justify-between gap-2">
                <button
                  onClick={() => {
                    if (!isInSituAdmin) onCustomizeProduct(product)
                  }}
                  disabled={isInSituAdmin}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                    isInSituAdmin
                      ? 'bg-slate-100 text-slate-400 opacity-50 cursor-not-allowed pointer-events-none'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer'
                  }`}
                >
                  {t('customize')}
                </button>

                <div className="flex items-center">
                  {isInSituAdmin ? (
                    <div
                      className="w-8 h-8 rounded-xl bg-slate-100 text-slate-400 border border-slate-200 flex items-center justify-center opacity-50 cursor-not-allowed pointer-events-none select-none"
                      title="Añadir a comanda bloqueado en Modo Vista Previa"
                    >
                      <Plus size={16} />
                    </div>
                  ) : qty === 0 ? (
                    <button
                      type="button"
                      onClick={(e) => onUpdateQuantity(product, 1, e)}
                      aria-label={`Añadir ${product.name} a la comanda`}
                      className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-700 hover:text-white flex items-center justify-center transition-colors border border-blue-100/80 shadow-xs cursor-pointer"
                    >
                      <Plus size={16} />
                    </button>
                  ) : (
                    <div className="flex items-center space-x-1 bg-blue-50/90 p-0.5 rounded-xl border border-blue-100">
                      <button
                        type="button"
                        onClick={(e) => onUpdateQuantity(product, -1, e)}
                        aria-label={`Disminuir ${product.name}`}
                        className="w-7 h-7 rounded-lg bg-white text-blue-700 flex items-center justify-center shadow-xs hover:bg-blue-100 transition-colors cursor-pointer"
                      >
                        <Minus size={13} />
                      </button>
                      <span className="text-xs font-black text-blue-900 px-1 tabular-nums">{qty}</span>
                      <button
                        type="button"
                        onClick={(e) => onUpdateQuantity(product, 1, e)}
                        aria-label={`Aumentar ${product.name}`}
                        className="w-7 h-7 rounded-lg bg-blue-700 text-white flex items-center justify-center shadow-xs hover:bg-blue-800 transition-colors cursor-pointer"
                      >
                        <Plus size={13} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-3.5 pt-0">
                <div className="py-2 px-3 bg-blue-50/70 rounded-xl border border-blue-100 text-center text-xs font-black text-blue-700">
                  {formatCurrency(product.price)}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
