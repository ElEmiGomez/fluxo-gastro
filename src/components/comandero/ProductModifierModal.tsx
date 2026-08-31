'use client'

import React, { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { X, Plus, Minus, Check, Flame, Salad, Sparkles, Edit3, Utensils, Gift, Scale, Clock, Info } from 'lucide-react'
import { Product, CourseType } from '@/types/database.types'
import { formatCurrency } from '@/lib/utils'
import { getTranslation, translateProductName, translateProductDescription } from '@/lib/i18n'

interface ProductModifierModalProps {
  product: Product | null
  onClose: () => void
  lang?: string
  onConfirm: (
    product: Product,
    quantity: number,
    selectedPills: string[],
    notes: string,
    course?: CourseType,
    isComplimentary?: boolean,
    weightGrams?: number
  ) => void
}

export function ProductModifierModal({
  product,
  onClose,
  lang = 'gl',
  onConfirm,
}: ProductModifierModalProps) {
  const t = (k: string) => getTranslation(lang, k)
  const [quantity, setQuantity] = useState(1)
  const [selectedCookingPoint, setSelectedCookingPoint] = useState<string>('')
  const [selectedSide, setSelectedSide] = useState<string>('')
  const [selectedPreferences, setSelectedPreferences] = useState<string[]>([])
  const [notes, setNotes] = useState('')
  const [course, setCourse] = useState<CourseType>('first')
  const [isComplimentary, setIsComplimentary] = useState(false)
  const [weightGrams, setWeightGrams] = useState(300)
  const inputRef = useRef<HTMLInputElement>(null)

  // Resetear estados al abrir un producto nuevo
  useEffect(() => {
    if (product) {
      setQuantity(1)
      setNotes('')
      setSelectedPreferences([])
      setIsComplimentary(false)
      setWeightGrams(300)

      // Determinar pase de cocina inicial inteligente
      const cat = (product.category_id || '').toLowerCase()
      const pName = product.name.toLowerCase()
      if (cat.includes('bebida') || cat.includes('trago') || pName.includes('cerveza')) {
        setCourse('drink')
      } else if (cat.includes('postre') || pName.includes('helado') || pName.includes('tarta')) {
        setCourse('dessert')
      } else if (pName.includes('burger') || pName.includes('bife') || pName.includes('chuletón') || pName.includes('milanesa')) {
        setCourse('second')
      } else {
        setCourse('first')
      }

      // Valores por defecto inteligentes
      const name = product.name.toLowerCase()
      const isBurgerOrMeat =
        product.category_id === 'cat-7' ||
        product.category_id === 'cat-5' ||
        name.includes('burger') ||
        name.includes('bife') ||
        name.includes('ojo')

      if (isBurgerOrMeat) {
        setSelectedCookingPoint('A Punto')
        setSelectedSide('Papas Fritas')
      } else {
        setSelectedCookingPoint('')
        setSelectedSide('')
      }
    }
  }, [product])

  if (!product) return null

  const prodName = product.name.toLowerCase()
  const isMeatOrBurger =
    product.category_id === 'cat-7' ||
    product.category_id === 'cat-5' ||
    prodName.includes('burger') ||
    prodName.includes('bife') ||
    prodName.includes('ojo') ||
    prodName.includes('milanesa')

  const hasSideOptions =
    isMeatOrBurger ||
    product.category_id === 'cat-3' || // Milanesas
    prodName.includes('milanesa')

  // Opciones de Puntos de Cocción
  const cookingPoints = ['Jugoso', 'A Punto', 'Bien Cocido']

  // Opciones de Guarnición
  const sideOptions = ['Papas Fritas', 'Papas Rústicas', 'Ensalada']

  // Opciones de Preferencias Rápidas / Alergias
  const preferenceOptions = [
    'Sin Sal',
    'Sin Cebolla',
    'Sin TACC',
    'Sin Tomate',
    'Sin Mayonesa',
    'Extra Queso',
  ]

  const handleSelectCookingPoint = (pt: string) => {
    setSelectedCookingPoint(prev => (prev === pt ? '' : pt))
  }

  const handleSelectSide = (side: string) => {
    setSelectedSide(prev => (prev === side ? '' : side))
  }

  const togglePreference = (pref: string) => {
    setSelectedPreferences(prev =>
      prev.includes(pref) ? prev.filter(p => p !== pref) : [...prev, pref]
    )
  }

  const handleAdd = () => {
    const combinedPills = [
      selectedCookingPoint,
      selectedSide,
      ...selectedPreferences,
    ].filter(Boolean) as string[]

    onConfirm(
      product,
      quantity,
      combinedPills,
      notes.trim(),
      course,
      isComplimentary,
      product.price_type === 'weight' ? weightGrams : undefined
    )
    onClose()
  }

  const unitOrWeightPrice = isComplimentary
    ? 0
    : product.price_type === 'weight'
    ? product.price * (weightGrams / (product.price_unit === 'kg' ? 1000 : 100))
    : product.price

  const subtotal = unitOrWeightPrice * quantity

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/60 backdrop-blur-sm animate-in fade-in p-0 sm:p-4 select-none" style={{ touchAction: 'manipulation' }}>
      
      {/* CONTENEDOR MODAL RESPONSIVO */}
      <div className="w-full sm:max-w-lg bg-white border-t sm:border border-slate-200 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[85vh] sm:max-h-[85vh] animate-in slide-in-from-bottom duration-200 text-slate-900 overflow-hidden">
        
        {/* CABECERA VISUAL DEL PLATO */}
        <div
          style={{ position: 'relative', width: '100%', height: '160px', maxHeight: '180px', overflow: 'hidden' }}
          className="bg-slate-100 flex-shrink-0"
        >
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 500px"
              priority
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-100">
              <Utensils className="w-12 h-12 stroke-[1.2]" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />

          {/* Botón Cerrar */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 p-2 rounded-full bg-black/50 backdrop-blur-md text-white hover:bg-black/70 shadow-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Nombre y Precio */}
          <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between gap-3">
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-300 drop-shadow">
                {t('customize')}
              </span>
              <h3 className="text-base sm:text-lg font-black text-white leading-snug drop-shadow-md truncate">
                {translateProductName(lang, product.id, product.name)}
              </h3>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-white/95 text-blue-900 text-sm font-black shadow-lg tabular-nums flex-shrink-0">
              {product.price_type === 'weight'
                ? `${formatCurrency(product.price)} / ${product.price_unit || '100g'}`
                : formatCurrency(product.price)}
            </div>
          </div>
        </div>

        {/* CUERPO DEL MODAL CON SCROLL FLUIDO */}
        <div className="flex-1 overflow-y-auto min-h-0 p-4 space-y-4 bg-[#fafbfc]">
          
          {/* DESCRIPCIÓN GASTRONÓMICA DEL PLATO */}
          {product.description && (
            <div className="p-3 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                {translateProductDescription(lang, product.id, product.description)}
              </p>
            </div>
          )}

          {/* SECCIÓN 1: PUNTO DE COCCIÓN */}
          {isMeatOrBurger && (
            <div className="space-y-2 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-amber-600" />
                  <span>{t('cookingPoint')}</span>
                </label>
                <span className="text-[10px] text-slate-400 font-medium">1 opción</span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {cookingPoints.map((opt) => {
                  const isSelected = selectedCookingPoint === opt
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => handleSelectCookingPoint(opt)}
                      className={`py-2 px-2 rounded-xl text-xs font-bold transition-all text-center flex items-center justify-center gap-1 ${
                        isSelected
                          ? 'bg-amber-500 text-slate-950 shadow-sm font-black ring-2 ring-amber-400'
                          : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      <span>{opt}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* SECCIÓN 2: GUARNICIÓN */}
          {hasSideOptions && (
            <div className="space-y-2 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                  <Salad className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Guarnición Incluida</span>
                </label>
                <span className="text-[10px] text-slate-400 font-medium">1 opción</span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {sideOptions.map((opt) => {
                  const isSelected = selectedSide === opt
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => handleSelectSide(opt)}
                      className={`py-2 px-2 rounded-xl text-xs font-bold transition-all text-center flex items-center justify-center gap-1 ${
                        isSelected
                          ? 'bg-blue-900 text-white shadow-sm font-black ring-2 ring-blue-700'
                          : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      <span>{opt}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* SECCIÓN 3: PREFERENCIAS & ALERGIAS */}
          <div className="space-y-2 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-700" />
                <span>Preferencias / Alergias</span>
              </label>
              <span className="text-[10px] text-slate-400 font-medium">Opcional múltiple</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {preferenceOptions.map((pref) => {
                const isSelected = selectedPreferences.includes(pref)
                return (
                  <button
                    key={pref}
                    type="button"
                    onClick={() => togglePreference(pref)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                      isSelected
                        ? 'bg-blue-900 text-white shadow-sm font-black'
                        : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    <span>{pref}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* SECCIÓN 4: MODIFICADORES ESTRUCTURADOS (CERO TEXTO LIBRE) */}
          <div className="space-y-2.5 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                <Edit3 className="w-3.5 h-3.5 text-slate-600" />
                <span>Punto de Cocción y Preferencias</span>
              </label>
              <span className="text-[10px] text-slate-400 font-medium">Opciones estándar</span>
            </div>

            {/* Puntos de Cocción (Píldoras fijas) */}
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-extrabold text-slate-500 tracking-wider">Término de la carne / Cocción:</span>
              <div className="grid grid-cols-3 gap-1.5">
                {['Poco hecha', 'Al punto', 'Bien hecha'].map((cookingPoint) => {
                  const isSelected = notes.includes(cookingPoint)
                  return (
                    <button
                      key={cookingPoint}
                      type="button"
                      onClick={() => {
                        // Reemplazar punto de cocción anterior
                        const cleaned = notes
                          .split(',')
                          .map(s => s.trim())
                          .filter(s => !['Poco hecha', 'Al punto', 'Bien hecha'].includes(s))
                          .join(', ')
                        if (isSelected) {
                          setNotes(cleaned)
                        } else {
                          setNotes(cleaned ? `${cleaned}, ${cookingPoint}` : cookingPoint)
                        }
                      }}
                      className={`py-2 px-1 rounded-xl text-[11px] font-extrabold transition-all text-center border ${
                        isSelected
                          ? 'bg-amber-500 text-slate-950 border-amber-500 font-black shadow-xs ring-1 ring-amber-400'
                          : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                      }`}
                    >
                      {cookingPoint}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Exclusiones Rápidas (Checkboxes / Píldoras) */}
            <div className="space-y-1 pt-1">
              <span className="text-[10px] uppercase font-extrabold text-slate-500 tracking-wider">Aclaraciones de Cocina:</span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Sin mayonesa',
                  'Sin cebolla',
                  'Salsa aparte',
                  'Sin sal',
                  'Pan bien tostado',
                  'Sin hielo',
                  'Extra limón',
                  'Para compartir',
                ].map((quickNote) => {
                  const isIncluded = notes.toLowerCase().includes(quickNote.toLowerCase())
                  return (
                    <button
                      key={quickNote}
                      type="button"
                      onClick={() => {
                        if (isIncluded) {
                          setNotes(prev =>
                            prev
                              .split(',')
                              .map(s => s.trim())
                              .filter(s => s.toLowerCase() !== quickNote.toLowerCase())
                              .join(', ')
                          )
                        } else {
                          setNotes(prev => (prev ? `${prev}, ${quickNote}` : quickNote))
                        }
                      }}
                      className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1 border ${
                        isIncluded
                          ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-xs font-black ring-1 ring-amber-400'
                          : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                      }`}
                    >
                      {isIncluded && <Check className="w-3 h-3 stroke-[3]" />}
                      <span>{quickNote}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Aviso Operativo de Paridad Analógica */}
            <div className="mt-2 p-2 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 leading-tight flex items-start gap-1.5">
              <Info className="w-3.5 h-3.5 text-blue-700 flex-shrink-0 mt-0.5" />
              <span>
                ¿Aclaraciones especiales o alergias severas? Comunícaselas verbalmente al mozo al confirmar tu mesa.
              </span>
            </div>
          </div>

          {/* SECCIÓN 5: PASE DE COCINA (TIEMPOS DE MARCHA) */}
          <div className="space-y-2 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                <span>Pase de Cocina</span>
              </label>
              <span className="text-[10px] text-slate-400 font-medium">Tiempos</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setCourse('first')}
                className={`py-2 px-1.5 rounded-xl text-xs font-bold transition-all text-center flex items-center justify-center gap-1 ${
                  course === 'first'
                    ? 'bg-emerald-600 text-white shadow-xs font-black ring-2 ring-emerald-400'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <span>🔥 1º Marcha</span>
              </button>

              <button
                type="button"
                onClick={() => setCourse('second')}
                className={`py-2 px-1.5 rounded-xl text-xs font-bold transition-all text-center flex items-center justify-center gap-1 ${
                  course === 'second'
                    ? 'bg-amber-500 text-slate-950 shadow-xs font-black ring-2 ring-amber-400'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <span>⏳ 2º En Espera</span>
              </button>

              <button
                type="button"
                onClick={() => setCourse('dessert')}
                className={`py-2 px-1.5 rounded-xl text-xs font-bold transition-all text-center flex items-center justify-center gap-1 ${
                  course === 'dessert'
                    ? 'bg-purple-600 text-white shadow-xs font-black ring-2 ring-purple-400'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <span>🍰 Postre</span>
              </button>
            </div>
          </div>

          {/* SECCIÓN 6: PRODUCTO AL PESO (SI APLICA) */}
          {product.price_type === 'weight' && (
            <div className="space-y-2 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5 text-blue-700" />
                  <span>Peso Real en Báscula ({product.price_unit === 'kg' ? 'Kg' : '100g'})</span>
                </label>
                <span className="text-xs font-black text-blue-900">
                  {formatCurrency(product.price)} / {product.price_unit || '100g'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="50"
                  step="50"
                  value={weightGrams}
                  onChange={(e) => setWeightGrams(Math.max(50, Number(e.target.value) || 50))}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-extrabold text-sm focus:outline-none focus:ring-2 focus:ring-blue-700"
                />
                <span className="text-xs font-black text-slate-600">gramos</span>
              </div>
            </div>
          )}

          {/* SECCIÓN 7: INVITACIÓN DE LA CASA (CORTESÍA) Y CANTIDAD */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-200 gap-2">
            <button
              type="button"
              onClick={() => setIsComplimentary(!isComplimentary)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                isComplimentary
                  ? 'bg-purple-700 text-white font-black shadow-xs ring-2 ring-purple-400'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
              }`}
            >
              <Gift size={14} className={isComplimentary ? 'text-amber-300' : 'text-purple-600'} />
              <span>{isComplimentary ? '🎁 Invita la Casa (0,00 €)' : '🎁 Marcar Cortesía'}</span>
            </button>

            <div className="flex items-center gap-2 bg-white px-2.5 py-1.5 rounded-xl border border-slate-200 shadow-xs">
              <button
                type="button"
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                className="p-1 rounded-lg bg-slate-100 text-slate-600 hover:text-slate-900"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="font-black text-sm text-slate-900 w-5 text-center tabular-nums">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity(q => q + 1)}
                className="p-1 rounded-lg bg-slate-100 text-slate-600 hover:text-slate-900"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>

        {/* PIE DEL MODAL CON PADDING PERFECTO Y SIN RECORTE */}
        <div 
          className="p-4 sm:p-5 bg-white border-t border-slate-200 flex items-center justify-between gap-3 flex-shrink-0 shadow-lg"
          style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom, 0px))' }}
        >
          <div>
            <span className="text-[10px] text-slate-500 block font-bold uppercase tracking-wider">{t('subtotal')}</span>
            <span className="text-lg font-black text-blue-900 tabular-nums">
              {formatCurrency(subtotal)}
            </span>
          </div>

          <button
            type="button"
            onClick={handleAdd}
            className="px-6 py-3.5 rounded-2xl font-black text-xs bg-blue-900 hover:bg-blue-800 text-white shadow-xl shadow-blue-900/25 flex items-center justify-center gap-2 transition-transform active:scale-95 flex-shrink-0"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>{t('addDish')}</span>
          </button>
        </div>

      </div>
    </div>
  )
}
