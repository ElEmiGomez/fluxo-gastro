'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { X, Sparkles, Coffee, CakeSlice, Loader2, CheckCircle2, ChevronRight } from 'lucide-react'
import { Product } from '@/types/database.types'
import { formatCurrency } from '@/lib/utils'
import { triggerHaptic, HAPTIC_PATTERNS } from '@/lib/haptic'

interface QuickSobremesaModalProps {
  isOpen: boolean
  onClose: () => void
  tableNumber: string | number
  availableItems: Product[]
  onOrderSingleItem: (product: Product) => Promise<void>
}

export function QuickSobremesaModal({
  isOpen,
  onClose,
  tableNumber,
  availableItems = [],
  onOrderSingleItem,
}: QuickSobremesaModalProps) {
  const [submittingId, setSubmittingId] = useState<string | null>(null)
  const [orderedSuccessName, setOrderedSuccessName] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSelect = async (product: Product) => {
    if (submittingId) return
    setSubmittingId(product.id)
    triggerHaptic(HAPTIC_PATTERNS.SUCCESS)

    try {
      await onOrderSingleItem(product)
      setOrderedSuccessName(product.name)
      setTimeout(() => {
        setOrderedSuccessName(null)
        setSubmittingId(null)
        onClose()
      }, 1500)
    } catch (err) {
      console.error('Error al pedir café o postre en 1 toque:', err)
      setSubmittingId(null)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 bg-slate-950/70 backdrop-blur-sm animate-in fade-in select-none">
      <div className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-200 text-slate-900 flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
        
        {/* Cabecera */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-xs">
              <span className="text-sm">☕🍰</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-black uppercase tracking-wider">Café & Postres</h3>
                <span className="px-1.5 py-0.2 rounded bg-amber-400 text-slate-950 text-[9px] font-black uppercase">
                  1 Toque
                </span>
              </div>
              <span className="text-[10px] text-slate-400">Mesa #{tableNumber} &middot; Sobremesa</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar selección de sobremesa"
            className="w-8 h-8 rounded-full bg-white/10 text-white hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Notificación de Éxito al Pedir */}
        {orderedSuccessName && (
          <div className="p-3 bg-emerald-50 border-b border-emerald-200 text-emerald-900 text-xs font-bold flex items-center justify-center gap-2 animate-in fade-in">
            <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
            <span>¡{orderedSuccessName} marchando al mozo!</span>
          </div>
        )}

        {/* Subtítulo explicativo */}
        <div className="px-4 py-2 bg-amber-50/70 border-b border-amber-200/60 flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
          <p className="text-[11px] text-amber-950 font-bold leading-tight">
            Toca cualquier opción para enviarla directamente a aprobación del mozo.
          </p>
        </div>

        {/* Catálogo de Opciones en 1 Toque */}
        <div className="p-3.5 overflow-y-auto space-y-2.5 flex-1 divide-y divide-slate-100">
          {availableItems.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500 font-medium">
              No hay cafés ni postres disponibles en este momento.
            </div>
          ) : (
            availableItems.map((prod) => {
              const isSubmittingThis = submittingId === prod.id
              const isCoffee = (prod.name || '').toLowerCase().includes('café') || (prod.name || '').toLowerCase().includes('cafe')

              return (
                <div
                  key={prod.id}
                  onClick={() => !submittingId && handleSelect(prod)}
                  className={`pt-2.5 first:pt-0 flex items-center gap-3 p-2.5 rounded-2xl border transition-all cursor-pointer ${
                    isSubmittingThis
                      ? 'bg-amber-50 border-amber-400 scale-[0.98]'
                      : 'bg-white border-slate-200 hover:border-amber-300 hover:bg-amber-50/30 active:scale-95 shadow-xs'
                  }`}
                >
                  {/* Imagen */}
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0">
                    {prod.image_url ? (
                      <Image
                        src={prod.image_url}
                        alt={prod.name}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                        {isCoffee ? <Coffee size={24} /> : <CakeSlice size={24} />}
                      </div>
                    )}
                  </div>

                  {/* Información */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-black uppercase ${
                        isCoffee ? 'bg-amber-100 text-amber-900' : 'bg-purple-100 text-purple-900'
                      }`}>
                        {isCoffee ? '☕ Bebida' : '🍰 Postre'}
                      </span>
                      <h4 className="font-extrabold text-xs text-slate-900 truncate">
                        {prod.name}
                      </h4>
                    </div>
                    {prod.description && (
                      <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5 leading-snug">
                        {prod.description}
                      </p>
                    )}
                    <span className="font-black text-xs text-slate-900 mt-1 block">
                      {formatCurrency(prod.price)}
                    </span>
                  </div>

                  {/* Botón de 1 toque */}
                  <button
                    type="button"
                    disabled={Boolean(submittingId)}
                    className={`px-3 py-2 rounded-xl text-xs font-black flex items-center gap-1 shadow-xs transition-all flex-shrink-0 ${
                      isSubmittingThis
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-slate-900 hover:bg-slate-800 text-white active:scale-95'
                    }`}
                  >
                    {isSubmittingThis ? (
                      <>
                        <Loader2 size={12} className="animate-spin" />
                        <span>Enviando...</span>
                      </>
                    ) : (
                      <>
                        <span>Pedir</span>
                        <ChevronRight size={12} />
                      </>
                    )}
                  </button>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
