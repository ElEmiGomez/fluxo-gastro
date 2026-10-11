'use client'

import React from 'react'
import Image from 'next/image'
import { Search, Utensils, Ban, Plus } from 'lucide-react'
import { Product, Category } from '@/types/database.types'
import { formatCurrency } from '@/lib/utils'
import { isProductInCategory, resolveCanonicalProductId } from '@/lib/category-matcher'
import { createBrowserClient, isSupabaseConfigured } from '@/lib/supabase/client'

interface ComanderoCatalogGridProps {
  slug: string
  categories: Category[]
  products: Product[]
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>
  selectedCategory: string
  onSelectCategory: (catId: string) => void
  searchQuery: string
  onSearchChange: (query: string) => void
  recentTogglesRef: React.MutableRefObject<Map<string, { status: boolean; until: number }>>
  onCustomizeProduct: (product: Product) => void
}

export function ComanderoCatalogGrid({
  slug,
  categories,
  products,
  setProducts,
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  recentTogglesRef,
  onCustomizeProduct,
}: ComanderoCatalogGridProps) {
  const filteredProducts = products.filter(prod => {
    const matchesCat = isProductInCategory(prod, selectedCategory, categories)
    const matchesSearch = searchQuery === '' || prod.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCat && matchesSearch
  })

  const handleToggleProductAvailability = async (prod: Product, e: React.MouseEvent) => {
    e.stopPropagation()
    const isUnavailable = prod.is_available === false
    const nextStatus = isUnavailable ? true : false
    const canonicalId = resolveCanonicalProductId(prod.id) || prod.id

    recentTogglesRef.current.set(prod.id, { status: nextStatus, until: Date.now() + 3500 })
    if (canonicalId) recentTogglesRef.current.set(canonicalId, { status: nextStatus, until: Date.now() + 3500 })

    // 1. Actualización optimista inmediata
    setProducts(prev =>
      prev.map(p =>
        (p.id === prod.id || p.id === canonicalId || resolveCanonicalProductId(p.id) === canonicalId)
          ? { ...p, is_available: nextStatus }
          : p
      )
    )

    // 2. Mutación directa a Supabase (si es UUID)
    try {
      const isProdUuid = Boolean(canonicalId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(canonicalId))
      const supabase = createBrowserClient()
      if (supabase && isSupabaseConfigured() && isProdUuid) {
        await supabase
          .from('products')
          .update({ is_available: nextStatus })
          .eq('id', canonicalId)
      }
    } catch (supaErr) {
      console.warn('Direct Supabase update skipped:', supaErr)
    }

    // 3. Mutación en la API del servidor (Fuente única de verdad)
    try {
      const res = await fetch('/api/admin/menu', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'x-staff-pin': '1234' },
        body: JSON.stringify({ slug, product_id: canonicalId, name: prod.name, is_available: nextStatus }),
      })
      const json = await res.json().catch(() => ({}))
      if (json.success) {
        try {
          if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
            const bc = new BroadcastChannel('fluxo_menu_channel')
            bc.postMessage({ type: 'menu_updated', slug, productId: canonicalId, isAvailable: nextStatus })
            bc.close()
          }
        } catch {}
        window.dispatchEvent(
          new CustomEvent('fluxo_menu_updated', {
            detail: { slug, productId: canonicalId, isAvailable: nextStatus },
          })
        )
      }
    } catch (err) {
      console.error('Error al cambiar disponibilidad del plato en API:', err)
    }
  }

  return (
    <>
      {/* Buscador & Selector de Categorías en Píldoras */}
      <div className="p-3 bg-white border-b border-slate-200 space-y-2.5 shadow-sm">
        <div className="max-w-7xl mx-auto relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar plato rápido..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-800/20 focus:border-blue-800 shadow-inner"
            autoComplete="off"
          />
        </div>

        {/* Carrusel de Píldoras */}
        <div className="max-w-7xl mx-auto flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  onSelectCategory(cat.id)
                  onSearchChange('')
                }}
                className={`flex-shrink-0 px-3.5 py-1.5 rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-blue-900 text-white shadow-md'
                    : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 shadow-sm'
                }`}
              >
                {cat.name}
              </button>
            )
          })}
        </div>
      </div>

      {/* Parrilla de Platos */}
      <main className="p-3 max-w-7xl mx-auto w-full flex-1">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16 text-slate-400 space-y-2 bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
            <Utensils className="w-12 h-12 mx-auto stroke-[1.2] text-slate-300" />
            <p className="text-sm font-semibold text-slate-600">No hay platos registrados en esta categoría</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {filteredProducts.map((prod) => {
              const isUnavailable = prod.is_available === false
              return (
                <button
                  key={prod.id}
                  type="button"
                  onClick={() => {
                    if (isUnavailable) return
                    onCustomizeProduct(prod)
                  }}
                  className={`group bg-white border active:scale-97 rounded-2xl overflow-hidden text-left flex flex-col justify-between shadow-sm hover:shadow-md transition-all touch-press h-48 relative cursor-pointer ${
                    isUnavailable
                      ? 'border-rose-400 bg-rose-50/30'
                      : 'border-slate-200 hover:border-blue-700/50'
                  }`}
                >
                  <div
                    style={{ position: 'relative', width: '100%', height: '112px', maxHeight: '120px', overflow: 'hidden' }}
                    className="bg-slate-100 flex-shrink-0"
                  >
                    {prod.image_url ? (
                      <Image
                        src={prod.image_url}
                        alt={prod.name}
                        fill
                        className={`object-cover group-hover:scale-105 transition-transform duration-300 ${isUnavailable ? 'grayscale opacity-60' : ''}`}
                        sizes="(max-width: 768px) 50vw, 250px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-100">
                        <Utensils className="w-6 h-6 stroke-[1.2]" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                    {/* Banner superpuesto de Agotado en la imagen */}
                    {isUnavailable && (
                      <div className="absolute inset-0 bg-slate-950/35 backdrop-blur-[0.5px] flex items-center justify-center pointer-events-none">
                        <span className="px-2.5 py-1 rounded-xl bg-rose-600 text-white text-[10px] font-black uppercase tracking-wider shadow-md flex items-center gap-1 border border-white/20">
                          <Ban className="w-3 h-3 stroke-[2.5]" />
                          <span>Agotado</span>
                        </span>
                      </div>
                    )}
                    
                    {/* Toggle de Agotado / Disponibilidad en 1 toque directo */}
                    <button
                      type="button"
                      onClick={(e) => handleToggleProductAvailability(prod, e)}
                      className={`absolute top-2 right-2 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase shadow-md z-20 flex items-center gap-1 transition-all active:scale-95 cursor-pointer ${
                        isUnavailable
                          ? 'bg-rose-600 hover:bg-rose-700 text-white ring-2 ring-white/30'
                          : 'bg-slate-900/70 hover:bg-slate-900 text-white/90 hover:text-white'
                      }`}
                      aria-label={
                        isUnavailable
                          ? `Plato ${prod.name} agotado. Clic para reactivar en carta`
                          : `Marcar ${prod.name} como agotado`
                      }
                      title={isUnavailable ? 'Plato Agotado · Clic para reactivar en carta' : 'Marcar como Agotado'}
                    >
                      {isUnavailable ? (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                          <span>Agotado</span>
                        </>
                      ) : (
                        <span>Disponible</span>
                      )}
                    </button>

                    <div className="absolute bottom-1.5 left-2 flex items-center gap-1.5 flex-wrap z-10">
                      <span className="px-2 py-0.5 rounded-lg bg-white/95 text-[11px] font-black text-blue-900 shadow-sm flex items-center gap-1">
                        {prod.original_price != null && prod.original_price > prod.price && (
                          <span className="line-through text-slate-400 text-[10px] font-bold">
                            {formatCurrency(prod.original_price)}
                          </span>
                        )}
                        <span>{formatCurrency(prod.price)}</span>
                      </span>
                      {prod.original_price != null && prod.original_price > prod.price && (
                        <span className="px-1.5 py-0.5 rounded-lg bg-emerald-600 text-white text-[9px] font-black uppercase shadow-sm">
                          -{Math.round(((prod.original_price - prod.price) / prod.original_price) * 100)}%
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-2.5 flex items-center justify-between gap-1.5 flex-1">
                    <h4 className="font-bold text-slate-900 text-xs leading-snug line-clamp-2">
                      {prod.name}
                    </h4>
                    <span className={`w-7 h-7 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0 transition-colors ${
                      isUnavailable
                        ? 'bg-rose-600 text-white'
                        : 'bg-blue-900 text-white group-hover:bg-blue-800'
                    }`}>
                      {isUnavailable ? (
                        <Ban className="w-3.5 h-3.5 stroke-[2.5]" />
                      ) : (
                        <Plus className="w-4 h-4 stroke-[3]" />
                      )}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </main>
    </>
  )
}
