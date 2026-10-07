'use client'

import React, { useState, useEffect } from 'react'
import { X, Check, Loader2, Sparkles, Trash2, Copy } from 'lucide-react'
import { Product, Category } from '@/types/database.types'

interface InSituEditProductModalProps {
  isOpen: boolean
  onClose: () => void
  product: Product | null
  categories: Category[]
  defaultCategoryId?: string
  slug: string
  adminToken?: string | null
  onSave: (savedProduct: Product) => void
  onDelete?: (deletedProductId: string) => void
}

export function InSituEditProductModal({
  isOpen,
  onClose,
  product,
  categories,
  defaultCategoryId,
  slug,
  adminToken,
  onSave,
  onDelete,
}: InSituEditProductModalProps) {
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [description, setDescription] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [isAvailable, setIsAvailable] = useState(true)
  const [isWeight, setIsWeight] = useState(false)
  const [priceUnit, setPriceUnit] = useState<'100g' | 'kg' | 'piece'>('100g')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDuplicating, setIsDuplicating] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      if (product) {
        setName(product.name || '')
        setPrice(product.price != null ? product.price.toString() : '')
        setCategoryId(product.category_id || categories[0]?.id || '')
        setDescription(product.description || '')
        setImageUrl(product.image_url || '')
        setIsAvailable(product.is_available !== false)
        setIsWeight(product.price_type === 'weight')
        setPriceUnit(product.price_unit === 'kg' ? 'kg' : product.price_unit === 'piece' ? 'piece' : '100g')
      } else {
        setName('')
        setPrice('')
        setCategoryId(defaultCategoryId || categories[0]?.id || '')
        setDescription('')
        setImageUrl('')
        setIsAvailable(true)
        setIsWeight(false)
        setPriceUnit('100g')
      }
      setErrorMsg(null)
      setIsSubmitting(false)
      setConfirmDelete(false)
    }
  }, [isOpen, product, defaultCategoryId, categories])

  if (!isOpen) return null

  const handleDelete = async () => {
    if (!product?.id) return
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }

    setIsSubmitting(true)
    setErrorMsg(null)

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      if (adminToken) {
        headers['Authorization'] = `Bearer ${adminToken}`
      }

      const res = await fetch(`/api/admin/menu?slug=${slug}&type=product&id=${product.id}`, {
        method: 'DELETE',
        headers,
        credentials: 'include',
      })

      const data = await res.json()
      if (res.ok && data.success) {
        if (onDelete) onDelete(product.id)
        onClose()
      } else if (res.status === 401) {
        setErrorMsg('Tu sesión ha expirado o no tienes permisos de administración.')
      } else {
        setErrorMsg(data.error || 'No se pudo eliminar el plato.')
      }
    } catch {
      setErrorMsg('Error de conexión al eliminar el plato.')
    } finally {
      setIsSubmitting(false)
      setConfirmDelete(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setErrorMsg('El nombre del plato es obligatorio.')
      return
    }
    const sanitizedPriceStr = price.trim().replace(',', '.')
    const numPrice = parseFloat(sanitizedPriceStr)
    if (isNaN(numPrice) || numPrice < 0) {
      setErrorMsg('Ingresa un precio válido (mayor o igual a 0).')
      return
    }

    setIsSubmitting(true)
    setErrorMsg(null)

    try {
      const payload = {
        slug,
        type: 'product',
        data: {
          id: product?.id,
          name: name.trim(),
          price: numPrice,
          category_id: categoryId || categories[0]?.id,
          description: description.trim(),
          image_url: imageUrl.trim(),
          is_available: isAvailable,
          price_type: isWeight ? 'weight' : 'unit',
          price_unit: isWeight ? priceUnit : undefined,
        },
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      if (adminToken) {
        headers['Authorization'] = `Bearer ${adminToken}`
      }

      const res = await fetch('/api/admin/menu', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (res.ok && data.success && data.product) {
        onSave(data.product)
        onClose()
      } else if (res.status === 401) {
        console.error('[InSituEditProductModal] Sesión rechazada o expirada:', res.status)
        setErrorMsg('Tu sesión ha expirado o no tienes permisos de administración.')
      } else {
        console.error('[InSituEditProductModal] Error del servidor al guardar plato:', data)
        setErrorMsg(data.error || 'No se pudo guardar el plato. Verifica tus permisos de administración.')
      }
    } catch (err) {
      console.error('[InSituEditProductModal] Excepción de conexión al guardar plato:', err)
      setErrorMsg('Error de conexión al guardar el plato.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDuplicateToPromos = async () => {
    if (!product) return
    setIsDuplicating(true)
    setErrorMsg(null)

    try {
      const promoCat =
        categories.find(
          c =>
            c.name.toLowerCase().includes('promo') ||
            c.name.toLowerCase().includes('oferta')
        ) || categories[0]

      const sanitizedPriceStr = price.trim().replace(',', '.')
      const numPrice = parseFloat(sanitizedPriceStr) || Number(product.price) || 0

      const payload = {
        slug,
        type: 'product',
        data: {
          name: `${product.name} (Promo)`,
          price: numPrice,
          category_id: promoCat?.id || 'cat-1',
          description: description.trim() || product.description || '',
          image_url: imageUrl.trim() || product.image_url || '',
          is_available: true,
          is_highlighted_promo: true,
          price_type: isWeight ? 'weight' : 'unit',
          price_unit: isWeight ? priceUnit : undefined,
        },
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      if (adminToken) {
        headers['Authorization'] = `Bearer ${adminToken}`
      }

      const res = await fetch('/api/admin/menu', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (res.ok && data.success && data.product) {
        onSave(data.product)
        onClose()
      } else {
        console.error('[InSituEditProductModal] Error al duplicar plato en promos:', data)
        setErrorMsg(data.error || 'No se pudo duplicar el plato en promociones.')
      }
    } catch (err) {
      console.error('[InSituEditProductModal] Excepción al duplicar plato en promos:', err)
      setErrorMsg('Error de conexión al duplicar el plato.')
    } finally {
      setIsDuplicating(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 select-none animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg p-5 sm:p-6 space-y-4 shadow-2xl text-white animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <h3 className="font-black text-sm sm:text-base text-white">
              {product ? 'Editar Plato en Vivo' : 'Añadir Plato a la Carta'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 text-slate-400 hover:text-white rounded-full bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {errorMsg && (
          <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold animate-in shake">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs sm:text-sm">
          {/* Nombre */}
          <div className="space-y-1">
            <label className="text-slate-300 font-bold block text-xs">
              Nombre del Plato *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ej: Hamburguesa de Ternera Gallega"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 text-xs sm:text-sm"
            />
          </div>

          {/* Precio y Categoría */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-slate-300 font-bold block text-xs">
                Precio (€) *
              </label>
              <input
                type="text"
                inputMode="decimal"
                required
                value={price}
                onChange={e => setPrice(e.target.value)}
                placeholder="Ej: 12.50"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 tabular-nums text-xs sm:text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 font-bold block text-xs">
                Categoría *
              </label>
              <select
                value={categoryId}
                onChange={e => setCategoryId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-purple-500 text-xs sm:text-sm cursor-pointer"
              >
                {categories.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Descripción */}
          <div className="space-y-1">
            <label className="text-slate-300 font-bold block text-xs">
              Descripción o Ingredientes
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Ej: Carne de pasto 180g, queso curado del país, rúcula fresca y pan brioche artesano."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 text-xs sm:text-sm leading-relaxed"
            />
          </div>

          {/* URL de Imagen */}
          <div className="space-y-1">
            <label className="text-slate-300 font-bold block text-xs">
              URL de Foto (Opcional)
            </label>
            <input
              type="text"
              value={imageUrl}
              onChange={e => setImageUrl(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 text-xs sm:text-sm font-mono text-[11px]"
            />
          </div>

          {/* Opciones Rápidas: Disponibilidad y Precio al peso */}
          <div className="pt-1 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between border-t border-slate-800/80">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isAvailable}
                onChange={e => setIsAvailable(e.target.checked)}
                className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 bg-slate-950 border-slate-700"
              />
              <span className="text-slate-300 font-bold text-xs">
                Disponible en carta
              </span>
            </label>

            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isWeight}
                  onChange={e => setIsWeight(e.target.checked)}
                  className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 bg-slate-950 border-slate-700"
                />
                <span className="text-slate-300 font-medium text-xs">
                  Precio al peso:
                </span>
              </label>
              {isWeight && (
                <select
                  value={priceUnit}
                  onChange={e => setPriceUnit(e.target.value as any)}
                  className="px-2 py-1 rounded-lg bg-slate-950 border border-slate-700 text-purple-300 text-xs font-bold focus:outline-none focus:border-purple-500 cursor-pointer"
                >
                  <option value="100g">por 100g</option>
                  <option value="kg">por Kg</option>
                  <option value="piece">por Pieza</option>
                </select>
              )}
            </div>
          </div>

          {/* Footer de Acciones */}
          <div className="pt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800">
            <div className="flex items-center gap-2">
              {product && onDelete && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isSubmitting || isDuplicating}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer active:scale-95 disabled:opacity-50 ${
                    confirmDelete
                      ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/30'
                      : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  }`}
                  title="Eliminar plato de la carta"
                >
                  <Trash2 size={13} />
                  <span>{confirmDelete ? '¿Confirmar eliminación?' : 'Eliminar'}</span>
                </button>
              )}

              {product && (
                <button
                  type="button"
                  onClick={handleDuplicateToPromos}
                  disabled={isSubmitting || isDuplicating}
                  className="px-3 py-2 rounded-xl text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50"
                  title="Crear una copia de este plato en la categoría Promociones"
                >
                  {isDuplicating ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{isDuplicating ? 'Duplicando...' : 'Duplicar en Promos'}</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting || isDuplicating}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-colors cursor-pointer text-xs"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting || isDuplicating}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-black transition-all flex items-center gap-1.5 shadow-md shadow-purple-600/20 cursor-pointer active:scale-95 text-xs"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>{product ? 'Guardar Cambios' : 'Crear Plato'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
