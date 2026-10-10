'use client'

import React, { useState, useMemo } from 'react'
import Image from 'next/image'
import {
  X,
  Sparkles,
  Utensils,
  Coffee,
  Wine,
  Check,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
  Plus,
} from 'lucide-react'
import { DailyMenu, DailyMenuSection, Product, CourseType } from '@/types/database.types'
import { formatCurrency } from '@/lib/utils'
import { MANDATORY_EU_ALLERGENS } from '@/lib/allergens'

const ALLERGEN_MAP: Record<string, { icon: string; label: string }> = MANDATORY_EU_ALLERGENS.reduce(
  (acc, curr) => {
    acc[curr.id] = { icon: curr.icon, label: curr.name.es }
    return acc
  },
  {} as Record<string, { icon: string; label: string }>
)

export interface DailyMenuSelectionItem {
  product: Product
  course: CourseType
  notes?: string
}

interface DailyMenuModalProps {
  isOpen: boolean
  onClose: () => void
  dailyMenu: DailyMenu
  onAddMenuToCart: (menuPayload: {
    title: string
    price: number
    selections: DailyMenuSelectionItem[]
  }) => void
}

const SECTION_COURSE_MAP: Record<number, CourseType> = {
  0: 'first',
  1: 'second',
  2: 'dessert',
  3: 'drink',
}

const SECTION_ICONS: Record<number, React.ReactNode> = {
  0: <Utensils className="w-4 h-4 text-emerald-400" />,
  1: <Utensils className="w-4 h-4 text-blue-400" />,
  2: <Coffee className="w-4 h-4 text-amber-400" />,
  3: <Wine className="w-4 h-4 text-purple-400" />,
}

export function DailyMenuModal({
  isOpen,
  onClose,
  dailyMenu,
  onAddMenuToCart,
}: DailyMenuModalProps) {
  const sections = useMemo(() => {
    return (dailyMenu.sections || []).slice(0, 4)
  }, [dailyMenu])

  const [activeStepIndex, setActiveStepIndex] = useState(0)
  const [selectedItems, setSelectedItems] = useState<Record<number, Product>>({})
  const [itemNotes, setItemNotes] = useState<Record<number, string>>({})

  if (!isOpen) return null

  const currentSection = sections[activeStepIndex]
  const isLastStep = activeStepIndex === sections.length - 1
  const allStepsComplete = sections.length > 0 && sections.every((_, idx) => Boolean(selectedItems[idx]))

  const handleSelectItem = (itemProduct: Product) => {
    setSelectedItems(prev => ({
      ...prev,
      [activeStepIndex]: itemProduct,
    }))
    // Avanzar automáticamente al siguiente paso si no es el último
    if (activeStepIndex < sections.length - 1) {
      setTimeout(() => {
        setActiveStepIndex(prev => prev + 1)
      }, 250)
    }
  }

  const handleFinishAndAdd = () => {
    if (!allStepsComplete) return

    const selections: DailyMenuSelectionItem[] = sections.map((_, idx) => {
      const prod = selectedItems[idx]
      const course = SECTION_COURSE_MAP[idx] || 'first'
      const note = itemNotes[idx]?.trim()
      return {
        product: prod,
        course,
        notes: note || undefined,
      }
    })

    onAddMenuToCart({
      title: dailyMenu.title,
      price: dailyMenu.fixed_price,
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
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex-shrink-0 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-md flex-shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-black tracking-widest text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                  Menú del Día
                </span>
                <span className="text-xs font-black text-emerald-400 tabular-nums">
                  {formatCurrency(dailyMenu.fixed_price)}
                </span>
              </div>
              <h3 className="text-base font-black text-white leading-tight mt-0.5">
                {dailyMenu.title}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar menú del día"
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Indicador de 4 Pasos (Navegación horizontal) */}
        <div className="bg-slate-100 p-2 sm:p-2.5 flex items-center justify-between gap-1.5 border-b border-slate-200 overflow-x-auto flex-shrink-0">
          {sections.map((sec, idx) => {
            const isSelected = Boolean(selectedItems[idx])
            const isCurrent = activeStepIndex === idx
            return (
              <button
                key={sec.id || idx}
                type="button"
                onClick={() => setActiveStepIndex(idx)}
                className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 min-w-[70px] cursor-pointer ${
                  isCurrent
                    ? 'bg-slate-900 text-white shadow-sm ring-2 ring-blue-500'
                    : isSelected
                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                    : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                }`}
              >
                {isSelected ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                ) : (
                  <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-700 text-[10px] flex items-center justify-center font-bold">
                    {idx + 1}
                  </span>
                )}
                <span className="truncate">{sec.name.split(' ')[0]}</span>
              </button>
            )
          })}
        </div>

        {/* Contenido del Paso Actual */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
          {currentSection ? (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-xl bg-slate-100 border border-slate-200">
                    {SECTION_ICONS[activeStepIndex]}
                  </span>
                  <div>
                    <h4 className="text-sm font-black text-slate-900">
                      Paso {activeStepIndex + 1}: {currentSection.name}
                    </h4>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Elige 1 opción para este plato
                    </p>
                  </div>
                </div>
                {selectedItems[activeStepIndex] && (
                  <span className="text-[11px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                    <Check size={12} /> Seleccionado
                  </span>
                )}
              </div>

              {/* Lista de Platos para esta Sección */}
              <div className="space-y-2.5">
                {(currentSection.items || [])
                  .filter(it => it.is_available && it.product)
                  .map(it => {
                    const prod = it.product!
                    const isPicked = selectedItems[activeStepIndex]?.id === prod.id

                    return (
                      <div
                        key={prod.id}
                        onClick={() => handleSelectItem(prod)}
                        className={`p-3 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-3 ${
                          isPicked
                            ? 'bg-blue-50/70 border-blue-600 shadow-sm ring-2 ring-blue-300'
                            : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {/* Foto del plato */}
                        <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 relative flex-shrink-0 border border-slate-200">
                          {prod.image_url ? (
                            <Image
                              src={prod.image_url}
                              alt={prod.name}
                              fill
                              sizes="64px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                              <Utensils className="w-6 h-6" />
                            </div>
                          )}
                        </div>

                        {/* Información del plato */}
                        <div className="min-w-0 flex-1">
                          <h5 className="text-xs font-black text-slate-900 leading-snug">
                            {prod.name}
                          </h5>
                          {prod.description && (
                            <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5 font-medium">
                              {prod.description}
                            </p>
                          )}

                          {/* Alérgenos */}
                          {prod.allergens && prod.allergens.length > 0 && (
                            <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                              {prod.allergens.slice(0, 3).map((alg: string) => {
                                const def = ALLERGEN_MAP[alg]
                                return (
                                  <span
                                    key={alg}
                                    className="text-[9px] px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 font-bold border border-slate-200"
                                  >
                                    {def ? `${def.icon} ${def.label}` : `⚠️ ${alg}`}
                                  </span>
                                )
                              })}
                            </div>
                          )}
                        </div>

                        {/* Radio indicador */}
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-all ${
                            isPicked
                              ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                              : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isPicked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                      </div>
                    )
                  })}
              </div>

              {/* Aclaración / Nota del plato seleccionado */}
              {selectedItems[activeStepIndex] && (
                <div className="pt-2">
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    Aclaración para cocina (opcional):
                  </label>
                  <input
                    type="text"
                    value={itemNotes[activeStepIndex] || ''}
                    onChange={(e) =>
                      setItemNotes(prev => ({
                        ...prev,
                        [activeStepIndex]: e.target.value,
                      }))
                    }
                    placeholder="Ej. Sin cebolla, al punto, con hielo..."
                    maxLength={100}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
            </>
          ) : (
            <p className="text-xs text-slate-500 text-center py-6">
              No hay platos configurados para esta sección.
            </p>
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

          {allStepsComplete ? (
            <button
              type="button"
              onClick={handleFinishAndAdd}
              className="flex-1 max-w-xs py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
            >
              <Plus size={16} className="stroke-[3]" />
              <span>Añadir Menú ({formatCurrency(dailyMenu.fixed_price)})</span>
            </button>
          ) : activeStepIndex < sections.length - 1 ? (
            <button
              type="button"
              disabled={!selectedItems[activeStepIndex]}
              onClick={() => setActiveStepIndex(prev => prev + 1)}
              className="py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-xs flex items-center gap-1 shadow-sm transition-all cursor-pointer"
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
              Selecciona todos los pasos
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
