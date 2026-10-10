'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  Package,
  Search,
  X,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Loader2,
  Ban,
  Check,
  UtensilsCrossed,
} from 'lucide-react'
import { Product, Category } from '@/types/database.types'
import { formatCurrency } from '@/lib/utils'
import { isProductInCategory, resolveCanonicalProductId } from '@/lib/category-matcher'
import { createBrowserClient, isSupabaseConfigured } from '@/lib/supabase/client'


interface QuickStockModalProps {
  isOpen: boolean
  onClose: () => void
  slug: string
  onStockChanged?: (productId?: string, isAvailable?: boolean) => void
}

export function QuickStockModal({
  isOpen,
  onClose,
  slug,
  onStockChanged,
}: QuickStockModalProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all')
  const [filterPausedOnly, setFilterPausedOnly] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  // Cargar catálogo de productos y categorías al abrir el modal
  useEffect(() => {
    if (!isOpen) return

    let isMounted = true
    const loadMenu = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/admin/menu?slug=${slug}&_t=${Date.now()}`, { cache: 'no-store' })
        if (!res.ok) throw new Error('Error al cargar la carta')
        const data = await res.json()
        if (isMounted) {
          setProducts(data.products || [])
          setCategories(data.categories || [])
        }
      } catch (err) {
        console.error('Error cargando platos para control de stock:', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadMenu()
    return () => {
      isMounted = false
    }
  }, [isOpen, slug])

  // Limpiar toast tras 3.5 segundos
  useEffect(() => {
    if (!toastMessage) return
    const timer = setTimeout(() => setToastMessage(null), 3500)
    return () => clearTimeout(timer)
  }, [toastMessage])

  // Pausar / Reactivar disponibilidad en 1 toque
  const handleToggleAvailability = async (product: Product) => {
    const isCurrentlyAvailable = product.is_available !== false
    const newStatus = !isCurrentlyAvailable
    const canonicalId = resolveCanonicalProductId(product.id) || product.id
    setUpdatingId(product.id)

    // 1. Actualización optimista inmediata para respuesta instantánea en sala
    setProducts(prev =>
      prev.map(p =>
        (p.id === product.id || p.id === canonicalId || resolveCanonicalProductId(p.id) === canonicalId)
          ? { ...p, is_available: newStatus }
          : p
      )
    )

    try {
      // 2. Mutación directa a Supabase si el cliente está configurado y el ID es UUID
      const isProdUuid = Boolean(canonicalId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(canonicalId))
      const supabase = createBrowserClient()
      if (supabase && isSupabaseConfigured() && isProdUuid) {
        try {
          const { error: supaErr } = await supabase
            .from('products')
            .update({ is_available: newStatus })
            .eq('id', canonicalId)
          if (supaErr) {
            console.warn('[QuickStockModal] Mutación directa en Supabase notificada:', supaErr)
          }
        } catch (dbErr) {
          console.warn('[QuickStockModal] Excepción en mutación directa a Supabase:', dbErr)
        }
      }

      // 3. Mutación en API de Administración de Carta (persiste en servidor y base de datos)
      const res = await fetch('/api/admin/menu', {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'x-staff-pin': '1234',
        },
        body: JSON.stringify({
          slug,
          product_id: canonicalId,
          name: product.name,
          is_available: newStatus,
        }),
      })

      const json = await res.json().catch(() => ({}))
      if (!res.ok || json.success === false) {
        throw new Error(json.error || 'Error al actualizar disponibilidad')
      }

      setToastMessage({
        type: 'success',
        text: newStatus
          ? `✅ "${product.name}" reactivado en carta`
          : `⚠️ "${product.name}" marcado como AGOTADO`,
      })

      // 4. Notificar a todas las vistas de la aplicación (Comandero, Carta, KDS)
      try {
        if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
          const bc = new BroadcastChannel('fluxo_menu_channel')
          bc.postMessage({ type: 'menu_updated', slug, productId: canonicalId, isAvailable: newStatus })
          bc.close()
        }
      } catch {}

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('fluxo_menu_updated', {
            detail: { slug, productId: canonicalId, isAvailable: newStatus },
          })
        )
      }
      if (onStockChanged) onStockChanged(canonicalId, newStatus)
    } catch (err: any) {
      // Revertir estado optimista si falla
      setProducts(prev =>
        prev.map(p =>
          (p.id === product.id || p.id === canonicalId || resolveCanonicalProductId(p.id) === canonicalId)
            ? { ...p, is_available: !newStatus }
            : p
        )
      )
      setToastMessage({
        type: 'error',
        text: `Error al actualizar: ${err?.message || 'Inténtalo de nuevo'}`,
      })
    } finally {
      setUpdatingId(null)
    }
  }


  // Filtrado reactivo de platos
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      // Búsqueda por texto
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim()
        const matchName = (p.name || '').toLowerCase().includes(query)
        const matchDesc = (p.description || '').toLowerCase().includes(query)
        if (!matchName && !matchDesc) return false
      }

      // Filtro por categoría
      if (selectedCategoryId !== 'all' && !isProductInCategory(p, selectedCategoryId, categories)) {
        return false
      }

      // Filtro solo pausados/agotados
      if (filterPausedOnly && p.is_available !== false) {
        return false
      }

      return true
    })
  }, [products, searchQuery, selectedCategoryId, filterPausedOnly])

  // Contadores de inventario
  const totalPausedCount = useMemo(() => {
    return products.filter(p => p.is_available === false).length
  }, [products])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-3 sm:p-4 select-none animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* ENCABEZADO */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between gap-3 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
              <Package className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-wide">
                  Control Rápido de Stock
                </h3>
                {totalPausedCount > 0 ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500 text-white animate-pulse">
                    {totalPausedCount} {totalPausedCount === 1 ? 'agotado' : 'agotados'}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Todo disponible
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 mt-0.5 truncate">
                Pausa platos al instante cuando se acabe un ingrediente.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal de control de stock"
            className="w-10 h-10 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors flex-shrink-0 cursor-pointer"
            title="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* NOTIFICACIÓN TOAST LOCAL */}
        {toastMessage && (
          <div
            className={`px-4 py-2.5 text-xs font-black flex items-center justify-between gap-2 transition-all ${
              toastMessage.type === 'success'
                ? 'bg-emerald-600 text-white'
                : 'bg-rose-600 text-white'
            }`}
          >
            <span>{toastMessage.text}</span>
            <button
              onClick={() => setToastMessage(null)}
              className="text-white/80 hover:text-white text-xs font-bold"
            >
              &times;
            </button>
          </div>
        )}

        {/* BARRA DE HERRAMIENTAS: BÚSQUEDA Y FILTROS */}
        <div className="p-3 sm:p-4 bg-slate-50 border-b border-slate-200 space-y-2.5 flex-shrink-0">
          <div className="flex items-center gap-2">
            {/* Buscador de texto */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Buscar plato, guarnición o bebida..."
                className="w-full pl-9 pr-8 py-2 rounded-xl bg-white border border-slate-300 text-xs sm:text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-sm font-bold"
                >
                  &times;
                </button>
              )}
            </div>

            {/* Toggle de ver solo agotados */}
            <button
              type="button"
              onClick={() => setFilterPausedOnly(prev => !prev)}
              className={`px-3 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 whitespace-nowrap border flex-shrink-0 active:scale-95 ${
                filterPausedOnly
                  ? 'bg-rose-600 text-white border-rose-700 ring-2 ring-rose-400'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-300'
              }`}
              title="Filtrar platos agotados"
            >
              <Ban className="w-3.5 h-3.5" />
              <span>Solo Agotados ({totalPausedCount})</span>
            </button>
          </div>

          {/* Categorías deslizables */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
            <button
              type="button"
              onClick={() => setSelectedCategoryId('all')}
              className={`px-3 py-1 rounded-lg font-black transition-all whitespace-nowrap flex-shrink-0 ${
                selectedCategoryId === 'all'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-200/70 border border-slate-200'
              }`}
            >
              Todas las categorías
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategoryId(cat.id)}
                className={`px-3 py-1 rounded-lg font-black transition-all whitespace-nowrap flex-shrink-0 ${
                  selectedCategoryId === cat.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-200/70 border border-slate-200'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* LISTADO DE PLATOS */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5 bg-slate-100/60">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Cargando carta del restaurante...
              </p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-12 bg-white rounded-2xl border border-dashed border-slate-300 flex flex-col items-center justify-center text-center p-6 space-y-2">
              <UtensilsCrossed className="w-8 h-8 text-slate-300" />
              <p className="text-sm font-black text-slate-700">No se encontraron platos</p>
              <p className="text-xs text-slate-400 max-w-xs">
                {filterPausedOnly
                  ? 'No hay ningún plato marcado como agotado en este momento. ¡Todo disponible en sala!'
                  : 'Prueba a buscar con otro término o selecciona otra categoría.'}
              </p>
              {(searchQuery || filterPausedOnly || selectedCategoryId !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('')
                    setFilterPausedOnly(false)
                    setSelectedCategoryId('all')
                  }}
                  className="mt-2 px-3 py-1 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-bold"
                >
                  Limpiar filtros
                </button>
              )}
            </div>
          ) : (
            filteredProducts.map(prod => {
              const isAvailable = prod.is_available !== false
              const isUpdating = updatingId === prod.id
              const cat = categories.find(c => c.id === prod.category_id)

              return (
                <div
                  key={prod.id}
                  className={`p-3.5 sm:p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 shadow-xs ${
                    isAvailable
                      ? 'bg-white border-slate-200 hover:border-slate-300'
                      : 'bg-rose-50/80 border-rose-200'
                  }`}
                >
                  {/* Info del plato */}
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-black text-slate-900 leading-tight">
                        {prod.name}
                      </span>
                      {cat && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                          {cat.name}
                        </span>
                      )}
                      <span className="text-xs font-black text-slate-700 tabular-nums">
                        {formatCurrency(prod.price)}
                      </span>
                    </div>

                    {prod.description && (
                      <p className="text-[11px] text-slate-500 line-clamp-1">
                        {prod.description}
                      </p>
                    )}

                    <div className="flex items-center gap-2 pt-0.5">
                      {isAvailable ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-700 bg-emerald-100/90 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Visible en carta</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full border border-rose-200">
                          <AlertTriangle className="w-3 h-3 text-rose-600" />
                          <span>Pausado · Oculto para comensales</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Botón de acción rápida en 1 tap */}
                  <div className="flex-shrink-0">
                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => handleToggleAvailability(prod)}
                      aria-label={
                        isAvailable
                          ? `Marcar ${prod.name} como agotado`
                          : `Reactivar ${prod.name} en la carta`
                      }
                      className={`px-3.5 py-2.5 rounded-xl text-xs font-black transition-all shadow-xs flex items-center gap-1.5 active:scale-95 disabled:opacity-50 cursor-pointer ${
                        isAvailable
                          ? 'bg-rose-500 hover:bg-rose-600 text-white'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      }`}
                      title={
                        isAvailable
                          ? 'Pausar temporalmente este plato ("Se agotó")'
                          : 'Reactivar plato en la carta'
                      }
                    >
                      {isUpdating ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : isAvailable ? (
                        <Ban className="w-3.5 h-3.5 stroke-[2.5]" />
                      ) : (
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      )}
                      <span>
                        {isAvailable ? 'Marcar Agotado' : 'Reactivar Plato'}
                      </span>
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* PIE DEL MODAL */}
        <div className="p-3.5 sm:p-4 bg-white border-t border-slate-200 flex items-center justify-between gap-3 flex-shrink-0">
          <div className="text-[11px] text-slate-500 font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-600" />
            <span>Los cambios impactan en tiempo real en la carta del comensal.</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black transition-colors"
          >
            Listo / Cerrar
          </button>
        </div>

      </div>
    </div>
  )
}
