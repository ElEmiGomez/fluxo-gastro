'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { X, Sparkles, Coffee, CakeSlice, Check, Loader2 } from 'lucide-react'
import { Product } from '@/types/database.types'

interface QuickDessertSelectorModalProps {
  isOpen: boolean
  onClose: () => void
  tableNumber: number | string
  availableDesserts: Product[]
  onConfirmDessert: (dessert: Product, note?: string) => Promise<void> | void
}

export function QuickDessertSelectorModal({
  isOpen,
  onClose,
  tableNumber,
  availableDesserts = [],
  onConfirmDessert,
}: QuickDessertSelectorModalProps) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [note, setNote] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Filtrar o proporcionar postres y cafés por defecto si la lista viene vacía
  const dessertsList = React.useMemo(() => {
    if (availableDesserts.length > 0) return availableDesserts
    return [
      {
        id: 'p-des-1',
        name: 'Tarta de Santiago Artesana',
        description: 'Tradicional tarta gallega de almendra con azúcar glas',
        price: 0,
        image_url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=400&q=80',
        category_id: 'cat-postres',
        restaurant_id: '',
        model_3d_url: null,
        is_available: true,
      },
      {
        id: 'p-des-2',
        name: 'Tarta de Queso Horneada',
        description: 'Cremosa tarta de queso con base de galleta y coulis',
        price: 0,
        image_url: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=400&q=80',
        category_id: 'cat-postres',
        restaurant_id: '',
        model_3d_url: null,
        is_available: true,
      },
      {
        id: 'p-des-3',
        name: 'Helado Artesanal (2 Bolas)',
        description: 'Vainilla Bourbon, Chocolate Belga o Frutos del Bosque',
        price: 0,
        image_url: 'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?auto=format&fit=crop&w=400&q=80',
        category_id: 'cat-postres',
        restaurant_id: '',
        model_3d_url: null,
        is_available: true,
      },
      {
        id: 'p-des-4',
        name: 'Café Solo / Espresso',
        description: 'Café de tueste natural 100% arábica',
        price: 0,
        image_url: null,
        category_id: 'cat-postres',
        restaurant_id: '',
        model_3d_url: null,
        is_available: true,
      },
      {
        id: 'p-des-5',
        name: 'Café con Leche / Cortado',
        description: 'Con leche entera, desnatada o avena',
        price: 0,
        image_url: null,
        category_id: 'cat-postres',
        restaurant_id: '',
        model_3d_url: null,
        is_available: true,
      },
      {
        id: 'p-des-6',
        name: 'Infusión o Té',
        description: 'Manzanilla, menta poleo, té verde o negro',
        price: 0,
        image_url: null,
        category_id: 'cat-postres',
        restaurant_id: '',
        model_3d_url: null,
        is_available: true,
      },
    ] as Product[]
  }, [availableDesserts])

  React.useEffect(() => {
    if (isOpen) {
      setSelectedProduct(null)
      setNote('')
      setIsSubmitting(false)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleConfirm = async () => {
    if (!selectedProduct || isSubmitting) return
    setIsSubmitting(true)
    try {
      await onConfirmDessert(selectedProduct, note.trim() || undefined)
      onClose()
    } catch (err) {
      console.error('Error al confirmar postre elegido:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-3 sm:p-4 animate-in fade-in select-none"
      style={{ touchAction: 'manipulation' }}
    >
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Cabecera */}
        <div className="p-4 bg-gradient-to-r from-purple-700 to-indigo-800 text-white flex-shrink-0 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white text-purple-800 flex items-center justify-center font-black shadow-md flex-shrink-0">
              <CakeSlice className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-black tracking-widest text-purple-200 block">
                Comodín de Menú / Promo
              </span>
              <h3 className="text-base font-black text-white leading-tight">
                Elegir Postre o Café (Mesa #{tableNumber})
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Cerrar selector de postres"
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Instrucción */}
        <div className="p-3 bg-purple-50 border-b border-purple-100 flex items-center gap-2 text-xs text-purple-950 font-semibold">
          <Sparkles className="w-4 h-4 text-purple-600 flex-shrink-0" />
          <span>El comensal dejó el postre incluido para el final. Elige la opción deseada para marcharlo a cocina.</span>
        </div>

        {/* Lista de Postres y Cafés */}
        <div className="p-4 overflow-y-auto flex-1 space-y-2.5">
          {dessertsList.map(prod => {
            const isPicked = selectedProduct?.id === prod.id
            const isCoffee = prod.name.toLowerCase().includes('café') || prod.name.toLowerCase().includes('infusión') || prod.name.toLowerCase().includes('té')

            return (
              <div
                key={prod.id}
                onClick={() => setSelectedProduct(prod)}
                className={`p-3 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-3 ${
                  isPicked
                    ? 'bg-purple-50/70 border-purple-600 shadow-sm ring-2 ring-purple-300'
                    : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Imagen o icono */}
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 relative flex-shrink-0 border border-slate-200 flex items-center justify-center">
                  {prod.image_url ? (
                    <Image src={prod.image_url} alt={prod.name} fill sizes="48px" className="object-cover" />
                  ) : isCoffee ? (
                    <Coffee className="w-6 h-6 text-amber-700" />
                  ) : (
                    <CakeSlice className="w-6 h-6 text-purple-600" />
                  )}
                </div>

                {/* Texto */}
                <div className="min-w-0 flex-1">
                  <h5 className="text-xs font-black text-slate-900 leading-snug">
                    {prod.name}
                  </h5>
                  {prod.description && (
                    <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5 font-medium">
                      {prod.description}
                    </p>
                  )}
                  <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded-md inline-block mt-1 border border-emerald-200">
                    Incluido en Menú
                  </span>
                </div>

                {/* Radio */}
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-all ${
                    isPicked ? 'bg-purple-600 border-purple-600 text-white' : 'border-slate-300 bg-white'
                  }`}
                >
                  {isPicked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
              </div>
            )
          })}

          {/* Nota opcional */}
          {selectedProduct && (
            <div className="pt-2">
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Aclaración (opcional):
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ej. Con leche de avena, sacarina, poco frío..."
                maxLength={80}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          )}
        </div>

        {/* Acciones */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex-shrink-0 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="button"
            disabled={!selectedProduct || isSubmitting}
            onClick={handleConfirm}
            className="flex-1 py-3 px-4 rounded-2xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-xs shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles size={16} />
            )}
            <span>Confirmar y Marchar a Cocina</span>
          </button>
        </div>
      </div>
    </div>
  )
}
