'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import {
  X,
  Sparkles,
  Utensils,
  Wine,
  Check,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Plus,
  Flame,
} from 'lucide-react'
import { Product, CourseType } from '@/types/database.types'
import { formatCurrency } from '@/lib/utils'

export interface PromoSelectionItem {
  product: Product
  course: CourseType
  notes?: string
}

export interface PromoConfiguredPayload {
  promoProduct: Product
  title: string
  price: number
  selections: PromoSelectionItem[]
}

interface PromoConfiguratorModalProps {
  isOpen: boolean
  onClose: () => void
  product: Product | null
  catalogProducts: Product[]
  onAddPromoToCart: (payload: PromoConfiguredPayload) => void
}

interface PromoStep {
  id: string
  title: string
  subtitle: string
  course: CourseType
  type: 'burger' | 'drink' | 'side'
  options: { id: string; name: string; description?: string | null; image_url?: string | null }[]
}

const COOKING_POINTS = ['Jugoso', 'A Punto', 'Bien Cocido']
const SIDE_OPTIONS = ['Papas Rústicas', 'Papas Fritas', 'Ensalada Mixta']

export function PromoConfiguratorModal({
  isOpen,
  onClose,
  product,
  catalogProducts = [],
  onAddPromoToCart,
}: PromoConfiguratorModalProps) {
  // Construir pasos dinámicos basados en la promo (ej. Combo Pareja)
  const steps: PromoStep[] = React.useMemo(() => {
    if (!product) return []

    // Obtener bebidas disponibles del catálogo
    const drinksInCatalog = catalogProducts.filter(p => {
      const cat = (p.category_id || '').toLowerCase()
      const n = (p.name || '').toLowerCase()
      return cat.includes('bebida') || cat.includes('trago') || n.includes('cerveza') || n.includes('pinta') || n.includes('refresco') || n.includes('agua')
    }).slice(0, 8)

    const defaultDrinkOptions = drinksInCatalog.length > 0
      ? drinksInCatalog.map(d => ({ id: d.id, name: d.name, description: d.description, image_url: d.image_url }))
      : [
          { id: 'drk-pinta-1', name: 'Pinta Cerveza Artesanal Rubia', description: 'Cerveza de barril 500ml bien fría' },
          { id: 'drk-pinta-2', name: 'Pinta Cerveza Artesanal Tostada', description: 'Cerveza tostada de malta 500ml' },
          { id: 'drk-refresco', name: 'Refresco / Gaseosa', description: 'Coca-Cola, Fanta o Sprite' },
          { id: 'drk-agua', name: 'Agua Mineral', description: 'Con o sin gas 500ml' },
        ]

    const burgerOptions = [
      {
        id: 'bur-opt-1',
        name: 'Burger Doble Monster (Clásica)',
        description: 'Doble carne madurada, queso cheddar fundido y bacon ahumado crujiente',
        image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80',
      },
      {
        id: 'bur-opt-2',
        name: 'Burger Doble Monster (Barbacoa & Crispy)',
        description: 'Doble carne, cebolla crujiente, cheddar y salsa barbacoa especial',
        image_url: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=400&q=80',
      },
      {
        id: 'bur-opt-3',
        name: 'Burger Doble Monster (Trufa & Queso de Cabra)',
        description: 'Doble carne, medallón de queso de cabra y mayonesa trufada suave',
        image_url: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=400&q=80',
      },
    ]

    const sideOpts = SIDE_OPTIONS.map((s, idx) => ({
      id: `side-opt-${idx}`,
      name: `Porción de ${s}`,
      description: 'Guarnición gigante incluida en el combo',
    }))

    return [
      {
        id: 'step-burger-1',
        title: 'Paso 1: Primera Hamburguesa',
        subtitle: 'Elige tu primera burger y punto de carne',
        course: 'second',
        type: 'burger',
        options: burgerOptions,
      },
      {
        id: 'step-burger-2',
        title: 'Paso 2: Segunda Hamburguesa',
        subtitle: 'Elige tu segunda burger y punto de carne',
        course: 'second',
        type: 'burger',
        options: burgerOptions,
      },
      {
        id: 'step-side',
        title: 'Paso 3: Guarnición para Compartir',
        subtitle: 'Elige el tipo de papas o ensalada',
        course: 'first',
        type: 'side',
        options: sideOpts,
      },
      {
        id: 'step-drink-1',
        title: 'Paso 4: Primera Bebida',
        subtitle: 'Pinta o bebida para la primera persona',
        course: 'drink',
        type: 'drink',
        options: defaultDrinkOptions,
      },
      {
        id: 'step-drink-2',
        title: 'Paso 5: Segunda Bebida',
        subtitle: 'Pinta o bebida para la segunda persona',
        course: 'drink',
        type: 'drink',
        options: defaultDrinkOptions,
      },
    ]
  }, [product, catalogProducts])

  const [activeStepIndex, setActiveStepIndex] = useState(0)
  const [selectedOptions, setSelectedOptions] = useState<Record<number, any>>({})
  const [cookingPoints, setCookingPoints] = useState<Record<number, string>>({
    0: 'A Punto',
    1: 'A Punto',
  })
  const [stepNotes, setStepNotes] = useState<Record<number, string>>({})

  useEffect(() => {
    if (isOpen) {
      setActiveStepIndex(0)
      setSelectedOptions({})
      setCookingPoints({ 0: 'A Punto', 1: 'A Punto' })
      setStepNotes({})
    }
  }, [isOpen])

  if (!isOpen || !product) return null

  const currentStep = steps[activeStepIndex]
  const allComplete = steps.length > 0 && steps.every((_, idx) => Boolean(selectedOptions[idx]))

  const handleSelectOption = (opt: any) => {
    setSelectedOptions(prev => ({ ...prev, [activeStepIndex]: opt }))
    if (activeStepIndex < steps.length - 1) {
      setTimeout(() => {
        setActiveStepIndex(prev => prev + 1)
      }, 250)
    }
  }

  const handleFinishAndConfirm = () => {
    if (!allComplete || !product) return

    const selections: PromoSelectionItem[] = steps.map((st, idx) => {
      const opt = selectedOptions[idx]
      const course = st.course
      const point = st.type === 'burger' ? cookingPoints[idx] : undefined
      const note = stepNotes[idx]?.trim()

      const parts = [
        point ? `Punto: ${point}` : '',
        note ? note : '',
      ].filter(Boolean).join(' · ')

      // Construir o asociar producto real
      const catalogMatch = catalogProducts.find(p => p.id === opt.id || p.name.toLowerCase() === opt.name.toLowerCase())
      const finalProduct: Product = catalogMatch
        ? { ...catalogMatch, price: 0 }
        : {
            id: `p-promo-sub-${idx}-${Date.now()}`,
            restaurant_id: product.restaurant_id,
            category_id: st.course === 'drink' ? 'cat-bebidas' : 'cat-principales',
            name: opt.name,
            description: opt.description || '',
            price: 0,
            image_url: opt.image_url || null,
            model_3d_url: null,
            is_available: true,
          }

      return {
        product: finalProduct,
        course,
        notes: parts || undefined,
      }
    })

    onAddPromoToCart({
      promoProduct: product,
      title: product.name,
      price: Number(product.price) || 0,
      selections,
    })

    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-3 sm:p-4 animate-in fade-in select-none"
      style={{ touchAction: 'manipulation' }}
    >
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
        {/* Cabecera */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-500 via-orange-600 to-red-600 text-white flex-shrink-0 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white text-orange-600 flex items-center justify-center font-black shadow-md flex-shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-black tracking-widest text-white bg-white/20 px-2 py-0.5 rounded-full border border-white/30">
                  Promo / Combo
                </span>
                <span className="text-xs font-black text-amber-200 tabular-nums">
                  {formatCurrency(product.price)}
                </span>
              </div>
              <h3 className="text-base font-black text-white leading-tight mt-0.5 truncate max-w-[260px] sm:max-w-xs">
                {product.name}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar configurador de promo"
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Indicador de Pasos Horizontal */}
        <div className="bg-slate-50 p-2 sm:p-2.5 flex items-center justify-between gap-1.5 border-b border-slate-200 overflow-x-auto flex-shrink-0">
          {steps.map((st, idx) => {
            const isSelected = Boolean(selectedOptions[idx])
            const isCurrent = activeStepIndex === idx
            return (
              <button
                key={st.id}
                type="button"
                onClick={() => setActiveStepIndex(idx)}
                className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 min-w-[70px] cursor-pointer ${
                  isCurrent
                    ? 'bg-orange-600 text-white shadow-sm ring-2 ring-orange-300'
                    : isSelected
                    ? 'bg-orange-50 text-orange-950 border border-orange-200'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {isSelected ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-orange-600 flex-shrink-0" />
                ) : (
                  <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-700 text-[10px] flex items-center justify-center font-bold">
                    {idx + 1}
                  </span>
                )}
                <span className="truncate">
                  {st.type === 'burger' ? `Burger ${idx + 1}` : st.type === 'drink' ? `Bebida ${idx - 2}` : 'Papas'}
                </span>
              </button>
            )
          })}
        </div>

        {/* Contenido del Paso Actual */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
          {currentStep && (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-black text-slate-900">
                    {currentStep.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {currentStep.subtitle}
                  </p>
                </div>
                {selectedOptions[activeStepIndex] && (
                  <span className="text-[11px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                    <Check size={12} /> Seleccionado
                  </span>
                )}
              </div>

              {/* Lista de Opciones */}
              <div className="space-y-2.5">
                {currentStep.options.map(opt => {
                  const isPicked = selectedOptions[activeStepIndex]?.id === opt.id

                  return (
                    <div
                      key={opt.id}
                      onClick={() => handleSelectOption(opt)}
                      className={`p-3 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-3 ${
                        isPicked
                          ? 'bg-orange-50/70 border-orange-600 shadow-sm ring-2 ring-orange-300'
                          : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {/* Icono / Imagen */}
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 relative flex-shrink-0 border border-slate-200 flex items-center justify-center">
                        {opt.image_url ? (
                          <Image src={opt.image_url} alt={opt.name} fill sizes="56px" className="object-cover" />
                        ) : currentStep.type === 'drink' ? (
                          <Wine className="w-6 h-6 text-purple-500" />
                        ) : currentStep.type === 'burger' ? (
                          <Flame className="w-6 h-6 text-orange-500" />
                        ) : (
                          <Utensils className="w-6 h-6 text-amber-500" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <h5 className="text-xs font-black text-slate-900 leading-snug">
                          {opt.name}
                        </h5>
                        {opt.description && (
                          <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5 font-medium">
                            {opt.description}
                          </p>
                        )}
                      </div>

                      {/* Radio */}
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-all ${
                          isPicked ? 'bg-orange-600 border-orange-600 text-white' : 'border-slate-300 bg-white'
                        }`}
                      >
                        {isPicked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Punto de Carne si es Hamburguesa */}
              {currentStep.type === 'burger' && selectedOptions[activeStepIndex] && (
                <div className="pt-2 space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                    <Flame size={13} className="text-orange-500" />
                    Punto de la carne:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {COOKING_POINTS.map(pt => (
                      <button
                        key={pt}
                        type="button"
                        onClick={() => setCookingPoints(prev => ({ ...prev, [activeStepIndex]: pt }))}
                        className={`py-2 px-2.5 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                          cookingPoints[activeStepIndex] === pt
                            ? 'bg-orange-600 text-white border-orange-600 shadow-xs'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {pt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Aclaración para cocina */}
              {selectedOptions[activeStepIndex] && (
                <div className="pt-2">
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    Aclaración para cocina (opcional):
                  </label>
                  <input
                    type="text"
                    value={stepNotes[activeStepIndex] || ''}
                    onChange={(e) =>
                      setStepNotes(prev => ({
                        ...prev,
                        [activeStepIndex]: e.target.value,
                      }))
                    }
                    placeholder="Ej. Sin cebolla, con hielo, salsa aparte..."
                    maxLength={100}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* Barra de Acciones Inferior */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex-shrink-0 flex items-center justify-between gap-3">
          {activeStepIndex > 0 ? (
            <button
              type="button"
              onClick={() => setActiveStepIndex(prev => prev - 1)}
              className="px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft size={16} />
              <span>Anterior</span>
            </button>
          ) : (
            <div />
          )}

          {allComplete ? (
            <button
              type="button"
              onClick={handleFinishAndConfirm}
              className="flex-1 max-w-xs py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
            >
              <Plus size={16} className="stroke-[3]" />
              <span>Añadir Combo ({formatCurrency(product.price)})</span>
            </button>
          ) : activeStepIndex < steps.length - 1 ? (
            <button
              type="button"
              disabled={!selectedOptions[activeStepIndex]}
              onClick={() => setActiveStepIndex(prev => prev + 1)}
              className="py-2.5 px-4 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-xs flex items-center gap-1 shadow-sm transition-all cursor-pointer"
            >
              <span>Siguiente</span>
              <ChevronRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              disabled
              className="py-2.5 px-4 rounded-xl bg-slate-200 text-slate-400 font-bold text-xs cursor-not-allowed"
            >
              Completa los 5 pasos
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
