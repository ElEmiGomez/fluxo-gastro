'use client'

import React from 'react'
import Image from 'next/image'
import { Plus, Minus, ChevronDown, Utensils, Power, Edit2, Sparkles } from 'lucide-react'
import { Product } from '@/types/database.types'
import { formatCurrency } from '@/lib/utils'
import { getTranslation, translateProductName, translateProductDescription } from '@/lib/i18n'
import { getAllergen, getAllergenName } from '@/lib/allergens'

interface MenuListCatalogProps {
  products: Product[]
  filteredProducts: Product[]
  currentLang: string
  isFixedMenu: boolean
  isInSituAdmin: boolean
  totalCartCount: number
  expandedProductIds: Record<string, boolean>
  onToggleExpand: (id: string) => void
  getProductQuantity: (id: string) => number
  onUpdateQuantity: (product: Product, delta: number, e?: React.MouseEvent) => void
  onToggleAvailability: (id: string, current: boolean) => void
  onOpenEditModal: (product: Product) => void
  onOpenAddProductModal: () => void
  onCustomizeProduct: (product: Product) => void
  searchQuery: string
}

export function MenuListCatalog({
  products,
  filteredProducts,
  currentLang,
  isFixedMenu,
  isInSituAdmin,
  totalCartCount,
  expandedProductIds,
  onToggleExpand,
  getProductQuantity,
  onUpdateQuantity,
  onToggleAvailability,
  onOpenEditModal,
  onOpenAddProductModal,
  onCustomizeProduct,
  searchQuery,
}: MenuListCatalogProps) {
  const t = (key: string) => getTranslation(currentLang, key)

  if (products.length === 0) {
    return (
      <div className="space-y-3 animate-pulse">
        {[1, 2, 3, 4].map(idx => (
          <div key={idx} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs flex items-center justify-between gap-3">
            <div className="w-14 h-14 bg-slate-200 rounded-xl flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 bg-slate-200 rounded w-3/4" />
              <div className="h-3 bg-slate-100 rounded w-1/3" />
            </div>
            <div className="w-8 h-8 bg-slate-100 rounded-xl flex-shrink-0" />
          </div>
        ))}
      </div>
    )
  }

  if (filteredProducts.length === 0) {
    return (
      <div className="text-center py-16 text-slate-400 space-y-3 bg-white rounded-3xl border border-slate-200 p-8 shadow-xs">
        <Utensils className="w-12 h-12 mx-auto stroke-[1.2] text-slate-300" />
        <p className="text-sm font-semibold text-slate-600">
          {searchQuery ? 'No encontramos platos con esa búsqueda' : 'No hay platos en esta categoría'}
        </p>
        {isInSituAdmin && !searchQuery && (
          <div className="pt-1">
            <button
              type="button"
              onClick={onOpenAddProductModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-black shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <Plus size={14} className="stroke-[3]" />
              <span>Añadir primer plato a esta categoría</span>
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-2.5">
      {filteredProducts.map((product, idx) => {
        const qty = getProductQuantity(product.id)
        const isExpanded = Boolean(expandedProductIds[product.id])

        return (
          <div
            key={product.id}
            className="bg-white rounded-2xl ambient-card gpu-layer smooth-spring overflow-hidden"
          >
            {/* Fila Principal */}
            <div
              onClick={() => onToggleExpand(product.id)}
              className="p-3.5 flex items-center justify-between gap-3 cursor-pointer select-none"
            >
              {product.image_url && !isExpanded && (
                <div className="relative w-14 h-14 min-w-[3.5rem] min-h-[3.5rem] aspect-square overflow-hidden rounded-xl bg-slate-100 shimmer-loading flex-shrink-0 border border-slate-100 transition-opacity duration-300">
                  <Image
                    src={product.image_url}
                    alt={product.name}
                    fill
                    className="w-full h-full object-cover"
                    sizes="56px"
                    priority={idx < 2}
                    loading={idx < 2 ? undefined : 'lazy'}
                  />
                </div>
              )}

              <div className="flex-1 min-w-0 pr-1 space-y-0.5">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h3 className="font-extrabold text-slate-900 text-xs sm:text-sm leading-snug line-clamp-2">
                    {translateProductName(currentLang, product.id, product.name)}
                  </h3>
                  {isInSituAdmin && product.is_available === false && (
                    <span className="text-[9px] font-black text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded-md">
                      AGOTADO
                    </span>
                  )}
                  {!isFixedMenu && idx === 0 && totalCartCount === 0 && (
                    <span className="text-[9px] font-extrabold text-blue-700 bg-blue-100/90 px-1.5 py-0.5 rounded-md animate-pulse">
                      ✨ Toca + para pedir
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
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
                  {product.original_price != null && product.original_price > product.price && (
                    <span className="text-[9px] font-black uppercase text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-md">
                      OFERTA -{Math.round(((product.original_price - product.price) / product.original_price) * 100)}%
                    </span>
                  )}
                  {product.price_type === 'weight' && (
                    <span className="px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-900 text-[10px] font-extrabold border border-blue-200">
                      ⚖️ {t('byWeight')}
                    </span>
                  )}
                </div>

                {product.description && (
                  <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
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

              <div className="flex items-center gap-1.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                {isInSituAdmin && (
                  <div className="flex items-center gap-1 mr-1">
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
                      <Power size={11} className={product.is_available !== false ? 'text-emerald-600' : 'text-rose-600'} />
                      <span>{product.is_available !== false ? 'Disponible' : 'Agotado'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenEditModal(product)}
                      title="Editar plato"
                      className="p-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 transition-colors cursor-pointer active:scale-95"
                    >
                      <Edit2 size={13} />
                    </button>
                  </div>
                )}

                {!isFixedMenu ? (
                  <>
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
                        className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-700 hover:text-white flex items-center justify-center transition-colors border border-blue-100/80 smooth-press shadow-xs cursor-pointer ${
                          idx === 0 && totalCartCount === 0 ? 'ring-2 ring-blue-500/60 ring-offset-1 animate-pulse' : ''
                        }`}
                        title="Añadir a la comanda"
                      >
                        <Plus size={16} />
                      </button>
                    ) : (
                      <div className="flex items-center space-x-1 bg-blue-50/90 p-0.5 rounded-xl border border-blue-100 animate-in zoom-in-95 duration-150">
                        <button
                          type="button"
                          onClick={(e) => onUpdateQuantity(product, -1, e)}
                          aria-label={`Disminuir ${product.name}`}
                          className="w-7 h-7 rounded-lg bg-white text-blue-700 flex items-center justify-center shadow-xs hover:bg-blue-100 transition-colors smooth-press cursor-pointer"
                        >
                          <Minus size={13} />
                        </button>
                        <span className="text-xs font-black text-blue-900 px-1 animate-pop tabular-nums">{qty}</span>
                        <button
                          type="button"
                          onClick={(e) => onUpdateQuantity(product, 1, e)}
                          aria-label={`Aumentar ${product.name}`}
                          className="w-7 h-7 rounded-lg bg-blue-700 text-white flex items-center justify-center shadow-xs hover:bg-blue-800 transition-colors smooth-press cursor-pointer"
                        >
                          <Plus size={13} />
                        </button>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => onToggleExpand(product.id)}
                      aria-label={isExpanded ? `Ocultar foto y detalles de ${product.name}` : `Ver foto y detalles de ${product.name}`}
                      className={`p-1.5 min-w-[36px] min-h-[36px] flex items-center justify-center text-slate-400 hover:text-slate-700 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] cursor-pointer ${
                        isExpanded ? 'rotate-180 text-blue-700' : ''
                      }`}
                      title="Ver foto y detalles"
                    >
                      <ChevronDown size={18} />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => onToggleExpand(product.id)}
                    className={`p-2 rounded-xl bg-slate-50 hover:bg-blue-50 text-slate-500 hover:text-blue-700 border border-slate-200/80 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                      isExpanded ? 'rotate-180 text-blue-700 bg-blue-50 border-blue-200' : ''
                    }`}
                    title="Ver foto y detalles"
                  >
                    <ChevronDown size={16} />
                  </button>
                )}
              </div>
            </div>

            {/* Sección Desplegable */}
            <div
              className={`grid transition-all duration-350 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
              }`}
            >
              <div className="overflow-hidden">
                <div className="px-3.5 pb-3.5 pt-1 border-t border-slate-100 space-y-3 bg-slate-50/50">
                  {product.image_url && (
                    <div className="relative w-full aspect-[4/3] overflow-hidden rounded-2xl bg-slate-100 border border-slate-200 shadow-inner shimmer-loading">
                      <Image
                        src={product.image_url}
                        alt={product.name}
                        fill
                        className="w-full h-full object-cover"
                        sizes="(max-width: 768px) 100vw, 600px"
                      />
                    </div>
                  )}

                  {!isFixedMenu ? (
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                      <button
                        onClick={() => {
                          if (!isInSituAdmin) onCustomizeProduct(product)
                        }}
                        disabled={isInSituAdmin}
                        className={`w-full sm:w-auto px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold transition-all shadow-xs text-center ${
                          isInSituAdmin
                            ? 'bg-slate-100 text-slate-400 opacity-50 cursor-not-allowed pointer-events-none'
                            : 'bg-white text-slate-700 hover:bg-slate-50 cursor-pointer'
                        }`}
                      >
                        {t('customize')}
                      </button>

                      <button
                        onClick={() => onUpdateQuantity(product, 1)}
                        disabled={isInSituAdmin}
                        className={`w-full sm:w-auto px-4 py-2.5 rounded-xl text-white text-xs font-black shadow-md flex items-center justify-center gap-1.5 transition-transform ${
                          isInSituAdmin
                            ? 'bg-slate-400 opacity-50 cursor-not-allowed pointer-events-none'
                            : 'bg-blue-700 hover:bg-blue-800 active:scale-95 cursor-pointer'
                        }`}
                      >
                        <Plus size={14} className="stroke-[3]" />
                        <span>{t('addToCart')}</span>
                      </button>
                    </div>
                  ) : (
                    <div className="p-3 bg-white rounded-xl border border-slate-200/80 flex items-center justify-between text-xs text-slate-600">
                      <span className="font-semibold flex items-center gap-1.5 text-slate-700">
                        <Sparkles size={14} className="text-amber-500 flex-shrink-0" />
                        Plato elaborado al momento con ingredientes frescos
                      </span>
                      <span className="font-black text-blue-700 text-sm">
                        {formatCurrency(product.price)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
