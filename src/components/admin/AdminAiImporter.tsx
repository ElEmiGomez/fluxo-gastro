'use client'

import React, { useState } from 'react'
import {
  Sparkles,
  RefreshCw,
  CheckCircle2,
  Plus,
  AlertTriangle,
  X,
  ShieldAlert,
  Trash2,
  Camera,
  Upload,
  FileText,
  Check,
  TrendingUp,
  PauseCircle,
  PlayCircle,
  UtensilsCrossed,
  Wine,
  ChefHat,
  CalendarDays,
} from 'lucide-react'
import { Category } from '@/types/database.types'
import { formatCurrency } from '@/lib/utils'
import { AiParsedMenuResult, AiParsedDish } from '@/types/admin.types'

interface AdminAiImporterProps {
  slug?: string
  categories?: Category[]
  aiRawText: string
  onAiRawTextChange: (val: string) => void
  aiImageBase64?: string | null
  onAiImageChange?: (val: string | null) => void
  aiParsing: boolean
  aiParsedResult: AiParsedMenuResult | null
  onParseWithAI: (imageParam?: string | null) => void
  onApplyAiMenu: (mode: 'append' | 'overwrite', customParsed?: AiParsedMenuResult | null) => void
}

const TAPERIA_PRESET = `TAPAS Y RACIONES
Pulpo á Feira con patatas gallegas - 18,50€
Zamburiñas de la Ría a la plancha (8 unidades) - 16.00 €
Pimientos de Padrón fritos con sal Maldon: 7,50
Croquetas artesanas de jamón ibérico (6 uds) - 8,90€

PLATOS PRINCIPALES
Chuletón de Vaca Rubia Galega a la brasa (1kg) al peso - 48,00€
Bacalao al horno con costra de pan de maíz - 19.50€

POSTRES CASEROS
Tarta de Santiago con azúcar glas - 5.50€
Filloas rellenas de crema pastelera - 6.00€`

const BURGER_PRESET = `HAMBURGUESAS GOURMET
Doble Bacon Monster con queso cheddar fundido y cebolla crujiente 13.90€
Truffle Burger con carne de ternera madurada y mayonesa trufada 15,50 €
Smash Burger Clásica con salsa especial 11.00€

BEBIDAS & CERVEZAS
Pinta Cerveza Artesanal IPA 4.50€
Agua Mineral 500ml 2,00€`

export function AdminAiImporter({
  slug,
  categories: existingCategories = [],
  aiRawText,
  onAiRawTextChange,
  aiImageBase64,
  onAiImageChange,
  aiParsing,
  aiParsedResult,
  onParseWithAI,
  onApplyAiMenu,
}: AdminAiImporterProps) {
  const [confirmModalMode, setConfirmModalMode] = useState<'append' | 'overwrite' | null>(null)
  const [editableResult, setEditableResult] = useState<AiParsedMenuResult | null>(aiParsedResult)

  const [entryMode, setEntryMode] = useState<'photo' | 'text'>('photo')
  const [isDragging, setIsDragging] = useState(false)
  const [imageMeta, setImageMeta] = useState<{ name: string; sizeKb: number; preview: string } | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // Función para comprimir imagen en el navegador antes de enviarla
  const processAndCompressFile = (file: File) => {
    if (!file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const maxWidth = 1600
        let width = img.width
        let height = img.height
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width)
          width = maxWidth
        }
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height)
          const compressed = canvas.toDataURL('image/jpeg', 0.85)
          const sizeKb = Math.round((compressed.length * 0.75) / 1024)
          setImageMeta({
            name: file.name,
            sizeKb,
            preview: compressed,
          })
          if (onAiImageChange) {
            onAiImageChange(compressed)
          }
        }
      }
      img.src = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      processAndCompressFile(file)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) {
      processAndCompressFile(file)
    }
  }

  const handleRemoveImage = () => {
    setImageMeta(null)
    if (onAiImageChange) {
      onAiImageChange(null)
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  React.useEffect(() => {
    setEditableResult(aiParsedResult)
  }, [aiParsedResult])

  const handleConfirm = () => {
    if (confirmModalMode) {
      onApplyAiMenu(confirmModalMode, editableResult || undefined)
      setConfirmModalMode(null)
    }
  }

  // Comprobar si hay platos con alerta de precio sin resolver
  const hasPendingPriceReviews = React.useMemo(() => {
    if (!editableResult) return false
    return editableResult.products.some(p => p.requires_price_review && (!p.price || p.price <= 0))
  }, [editableResult])

  // Modificación reactiva del precio en el staging preview
  const handleDishPriceChange = (dishId: string, newPriceStr: string) => {
    if (!editableResult) return
    const val = parseFloat(newPriceStr.replace(',', '.'))
    const isInvalid = isNaN(val) || val <= 0
    const finalPrice = isNaN(val) ? 0 : Math.max(0, Number(val.toFixed(2)))

    setEditableResult({
      ...editableResult,
      products: editableResult.products.map(p =>
        p.id === dishId
          ? {
              ...p,
              price: finalPrice,
              requires_price_review: isInvalid,
            }
          : p
      ),
    })
  }

  // Lista unificada de categorías disponibles para el selector
  const availableCategories = React.useMemo(() => {
    const list: { id: string; name: string }[] = []
    const seenNames = new Set<string>()

    if (editableResult?.categories) {
      for (const cat of editableResult.categories) {
        const norm = cat.name.trim().toLowerCase()
        if (!seenNames.has(norm)) {
          seenNames.add(norm)
          list.push({ id: cat.id, name: cat.name })
        }
      }
    }

    for (const cat of existingCategories) {
      const norm = cat.name.trim().toLowerCase()
      if (!seenNames.has(norm)) {
        seenNames.add(norm)
        list.push({ id: cat.id, name: cat.name })
      }
    }

    return list
  }, [editableResult, existingCategories])

  const handleDishCategoryChange = (dishId: string, newCategoryId: string) => {
    if (!editableResult) return
    setEditableResult({
      ...editableResult,
      products: editableResult.products.map(p =>
        p.id === dishId ? { ...p, category_id: newCategoryId } : p
      ),
    })
  }

  const handleRemoveDish = (dishId: string) => {
    if (!editableResult) return
    const updatedProducts = editableResult.products.filter(p => p.id !== dishId)
    const usedCatIds = new Set(updatedProducts.map(p => p.category_id))
    const updatedCategories = editableResult.categories.filter(c => usedCatIds.has(c.id))
    setEditableResult({
      ...editableResult,
      total_dishes: updatedProducts.length,
      total_categories: updatedCategories.length,
      categories: updatedCategories,
      products: updatedProducts,
    })
  }

  const isCommandAction = editableResult?.staging_diff?.action === 'command'

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Tarjeta de Entrada de Menú con Soporte de Foto, Texto y Comandos */}
      <div className="p-6 rounded-2xl bg-slate-800/60 border border-slate-700/70 shadow-xl space-y-5 backdrop-blur-md">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center font-black shadow-xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-black text-base text-white">Bot Inteligente de Cartas & Escáner con IA</h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Sube una fotografía de tu carta o da órdenes en lenguaje natural (&quot;Sube 0,50€ las cervezas&quot;, &quot;Pausa el cachopo&quot;, &quot;Pon de menú del día hoy lentejas y merluza a 14,50€&quot;).
            </p>
          </div>
        </div>

        {/* Selector de Modo: Foto de Carta vs Texto / Comandos */}
        <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800 w-fit">
          <button
            type="button"
            onClick={() => setEntryMode('photo')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              entryMode === 'photo'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20 font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>📷 Subir Foto de la Carta</span>
          </button>
          <button
            type="button"
            onClick={() => setEntryMode('text')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              entryMode === 'text'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20 font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>📝 Texto / Comandos de Voz</span>
          </button>
        </div>

        {/* MODO 1: SUBIR FOTOGRAFÍA */}
        {entryMode === 'photo' && (
          <div className="space-y-4">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />

            {!imageMeta ? (
              <div
                onDragOver={(e) => {
                  e.preventDefault()
                  setIsDragging(true)
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
                  isDragging
                    ? 'border-cyan-400 bg-cyan-500/10'
                    : 'border-slate-700 hover:border-cyan-500/50 bg-slate-900/60 hover:bg-slate-900/80'
                }`}
              >
                <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-md">
                  <Camera className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">Haz clic o arrastra una foto de la carta aquí</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    Admite fotos de móvil tomadas al menú físico, pizarras o cartas impresas (.jpg, .png, .webp).
                  </p>
                </div>
                <span className="px-3.5 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 mt-1 hover:text-white flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Seleccionar Archivo o Tomar Foto</span>
                </span>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-slate-900 border border-cyan-500/30 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 min-w-0">
                  <img
                    src={imageMeta.preview}
                    alt="Previsualización de carta"
                    className="w-16 h-16 rounded-xl object-cover border border-slate-700 flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <span className="inline-flex items-center gap-1 text-[11px] font-black text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-full mb-1">
                      <Check className="w-3 h-3 text-cyan-400" />
                      <span>Fotografía lista para análisis IA</span>
                    </span>
                    <h4 className="font-bold text-xs text-white truncate">{imageMeta.name}</h4>
                    <span className="text-[11px] text-slate-400">{imageMeta.sizeKb} KB optimizada</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold border border-slate-700 transition-colors cursor-pointer"
                  >
                    Cambiar
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors cursor-pointer"
                    title="Eliminar foto"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* MODO 2: PEGAR TEXTO O COMANDOS EN LENGUAJE NATURAL */}
        {entryMode === 'text' && (
          <div className="space-y-3">
            {/* Comandos Rápidos Sugeridos */}
            <div className="space-y-1.5">
              <span className="text-slate-400 font-semibold text-xs block">Órdenes rápidas en lenguaje natural:</span>
              <div className="flex items-center gap-2 flex-wrap text-xs">
                <button
                  type="button"
                  onClick={() => onAiRawTextChange('Sube 0,50 € todas las cervezas')}
                  className="px-2.5 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 text-xs font-bold transition-colors cursor-pointer"
                >
                  ⚡ &quot;Sube 0,50 € las cervezas&quot;
                </button>
                <button
                  type="button"
                  onClick={() => onAiRawTextChange('Pausa el cachopo que se agotó')}
                  className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 text-xs font-bold transition-colors cursor-pointer"
                >
                  ⏸️ &quot;Pausa el cachopo que se agotó&quot;
                </button>
                <button
                  type="button"
                  onClick={() => onAiRawTextChange('Pon de menú del día hoy lentejas y merluza a 14,50 €')}
                  className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-xs font-bold transition-colors cursor-pointer"
                >
                  🍽️ &quot;Menú del día a 14,50 €&quot;
                </button>
              </div>
            </div>

            {/* Plantillas de Carta Completa */}
            <div className="flex items-center gap-2 flex-wrap text-xs pt-1">
              <span className="text-slate-400 font-semibold text-xs">Plantillas completas:</span>
              <button
                type="button"
                onClick={() => onAiRawTextChange(TAPERIA_PRESET)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white text-xs font-bold border border-slate-700 transition-colors cursor-pointer"
              >
                Tapería Gallega
              </button>
              <button
                type="button"
                onClick={() => onAiRawTextChange(BURGER_PRESET)}
                className="px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 text-xs font-bold border border-cyan-500/20 transition-colors cursor-pointer"
              >
                Hamburguesería
              </button>
            </div>

            {/* Textarea */}
            <textarea
              rows={6}
              placeholder="Escribe una orden (&quot;Sube 1€ los postres&quot;, &quot;Pausa la Doble Bacon&quot;) o pega la lista de platos con sus precios..."
              value={aiRawText}
              onChange={e => onAiRawTextChange(e.target.value)}
              className="w-full p-4 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder:text-slate-500 text-xs sm:text-sm font-mono focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 transition-all leading-relaxed shadow-inner"
            />
          </div>
        )}

        {/* Botón Analizar / Ejecutar Orden */}
        <button
          type="button"
          onClick={() => onParseWithAI(imageMeta?.preview || null)}
          disabled={aiParsing || (!imageMeta && !aiRawText.trim())}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
        >
          {aiParsing ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>
                {imageMeta ? 'Analizando fotografía de la carta con IA...' : 'Procesando orden o carta con IA...'}
              </span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>
                {imageMeta ? 'Analizar Foto de la Carta con IA' : 'Procesar Orden o Extraer Carta con IA'}
              </span>
            </>
          )}
        </button>
      </div>

      {/* ========================================================================= */}
      {/* PREVISUALIZACIÓN OBLIGATORIA (STAGING PREVIEW & DIFF)                     */}
      {/* ========================================================================= */}
      {aiParsedResult && (
        <div className="p-6 rounded-2xl bg-slate-800/70 border border-slate-700/70 shadow-2xl space-y-5 animate-in fade-in">
          {/* Encabezado del Staging Diff */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-700">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <div>
                <h3 className="font-black text-sm sm:text-base text-white">
                  Staging Preview: Vista Previa de Cambios Propuestos
                </h3>
                <p className="text-xs text-slate-400 font-medium">
                  {aiParsedResult.staging_diff?.summary || `${aiParsedResult.total_dishes} platos en ${aiParsedResult.total_categories} categorías`}
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1 rounded-full whitespace-nowrap">
              Borrador (Sin Guardar)
            </span>
          </div>

          {/* Alerta de Revisión de Precios Obligatoria (Anti-Alucinación) */}
          {hasPendingPriceReviews && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-amber-300 animate-pulse">
              <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
              <div className="text-xs space-y-1">
                <p className="font-black text-white">
                  ⚠️ Atención: Hay platos sin precio asignado o marcados como &quot;Según Mercado (S/M)&quot;.
                </p>
                <p className="text-amber-200/90 leading-relaxed">
                  Fluxo no inventa precios por seguridad. Debes escribir el precio exacto en los campos marcados en amarillo antes de poder confirmar y guardar en el catálogo.
                </p>
              </div>
            </div>
          )}

          {/* Si el comando configuró Menú del Día, mostrar tarjeta especial */}
          {editableResult?.staging_diff?.daily_menu && (
            <div className="p-4 rounded-xl bg-slate-900 border border-emerald-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-400">
                  <CalendarDays className="w-4 h-4" />
                  <span className="font-black text-xs uppercase tracking-wider">Menú del Día Configurado</span>
                </div>
                <span className="font-black text-sm text-emerald-400 tabular-nums">
                  {formatCurrency(editableResult.staging_diff.daily_menu.fixed_price)}
                </span>
              </div>
              <div className="space-y-1.5 text-xs">
                {editableResult.staging_diff.daily_menu.sections?.map((sec, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-slate-300">
                    <span className="font-bold text-slate-400 min-w-28">{sec.name}:</span>
                    <span className="text-white font-medium">{sec.dish_names.join(', ')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Lista de Platos con Badges de Staging Diff */}
          {(editableResult?.products || []).length > 0 && (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {(editableResult || aiParsedResult).products.map((d: AiParsedDish) => {
                const isPriceReviewRequired = d.requires_price_review && (!d.price || d.price <= 0)

                return (
                  <div
                    key={d.id}
                    className={`p-3.5 rounded-xl border transition-all ${
                      isPriceReviewRequired
                        ? 'bg-amber-950/20 border-amber-500/50'
                        : 'bg-slate-900 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 text-xs flex-wrap sm:flex-nowrap">
                      {/* Información del Plato */}
                      <div className="truncate flex-1 min-w-44">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-black text-white text-sm">{d.name}</span>

                          {/* Badge de Acción Staging */}
                          {d.action_type === 'create' && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              [NUEVO]
                            </span>
                          )}
                          {d.action_type === 'update_price' && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1">
                              <TrendingUp className="w-3 h-3" />
                              <span>[PRECIO: {d.old_price !== undefined ? formatCurrency(d.old_price) : ''} → {formatCurrency(d.price)}]</span>
                            </span>
                          )}
                          {d.action_type === 'update_stock' && !d.is_available && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1">
                              <PauseCircle className="w-3 h-3" />
                              <span>[STOCK PAUSADO]</span>
                            </span>
                          )}
                          {d.action_type === 'update_stock' && d.is_available && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                              <PlayCircle className="w-3 h-3" />
                              <span>[STOCK ACTIVADO]</span>
                            </span>
                          )}

                          {/* Badge de Estación Operativa */}
                          {d.station === 'bar' ? (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20 flex items-center gap-1">
                              <Wine className="w-2.5 h-2.5" />
                              <span>Barra</span>
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 flex items-center gap-1">
                              <ChefHat className="w-2.5 h-2.5" />
                              <span>Cocina</span>
                            </span>
                          )}
                        </div>

                        {d.description && (
                          <span className="text-slate-400 text-[11px] block truncate mt-0.5">
                            {d.description}
                          </span>
                        )}

                        {d.allergens && d.allergens.length > 0 && (
                          <div className="flex items-center gap-1 mt-1 flex-wrap">
                            {d.allergens.map((a: string) => (
                              <span
                                key={a}
                                className="text-[10px] font-semibold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-1 py-0.2 rounded"
                              >
                                {a}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Controles de Precio, Categoría y Borrado */}
                      <div className="flex items-center gap-2 shrink-0">
                        {/* Selector de Categoría */}
                        <select
                          value={d.category_id}
                          onChange={(e) => handleDishCategoryChange(d.id, e.target.value)}
                          className="text-[11px] font-semibold py-1 px-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
                          title="Cambiar categoría de este plato"
                        >
                          {availableCategories.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>

                        {/* Input de Precio Editable con Resaltado si requiere revisión */}
                        {isPriceReviewRequired ? (
                          <div className="flex items-center gap-1 bg-amber-500/20 border border-amber-500 rounded-lg p-1">
                            <input
                              type="number"
                              step="0.5"
                              placeholder="Fijar €"
                              value={d.price > 0 ? d.price : ''}
                              onChange={(e) => handleDishPriceChange(d.id, e.target.value)}
                              className="w-16 px-1.5 py-0.5 text-xs font-black text-amber-300 bg-slate-900 rounded border border-amber-500/40 text-right focus:outline-none focus:ring-1 focus:ring-amber-400"
                            />
                            <span className="text-xs font-bold text-amber-400">€</span>
                          </div>
                        ) : (
                          <span className="font-black text-cyan-400 tabular-nums whitespace-nowrap bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
                            {formatCurrency(d.price)}
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => handleRemoveDish(d.id)}
                          className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-rose-500/20 transition-colors cursor-pointer"
                          title="Eliminar plato del borrador"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* ========================================================================= */}
          {/* BOTONES DE CONFIRMACIÓN SEGÚN TIPO DE ACCIÓN                              */}
          {/* ========================================================================= */}
          <div className="pt-3 border-t border-slate-700 space-y-3">
            {isCommandAction ? (
              // Si fue una orden NL rápida -> Confirmación en 1 Clic
              <div className="space-y-2">
                <p className="text-xs text-slate-300 font-medium text-center">
                  ¿Confirmar y aplicar estos cambios directamente en el catálogo activo?
                </p>
                <button
                  type="button"
                  disabled={hasPendingPriceReviews}
                  onClick={() => onApplyAiMenu('append', editableResult || undefined)}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>
                    {hasPendingPriceReviews
                      ? 'Fija los precios pendientes antes de guardar'
                      : 'Confirmar y Aplicar Cambios al Catálogo (1 Clic)'}
                  </span>
                </button>
              </div>
            ) : (
              // Si fue importación de carta -> Modal de Confirmación Append vs Overwrite
              <div className="space-y-3">
                <p className="text-xs text-slate-300 font-medium text-center">
                  ¿Qué deseas hacer con estos platos detectados?
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    disabled={hasPendingPriceReviews}
                    onClick={() => setConfirmModalMode('append')}
                    className="py-3.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-black text-xs sm:text-sm shadow-md shadow-cyan-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>Añadir a Platos Existentes</span>
                  </button>

                  <button
                    type="button"
                    disabled={hasPendingPriceReviews}
                    onClick={() => setConfirmModalMode('overwrite')}
                    className="py-3.5 px-4 rounded-xl bg-slate-800 hover:bg-rose-500/20 disabled:opacity-40 disabled:cursor-not-allowed text-rose-400 hover:text-rose-300 font-black text-xs sm:text-sm border border-rose-500/40 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>Sobrescribir Toda la Carta</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Sobrescritura o Adición */}
      {confirmModalMode && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl animate-in zoom-in-95 text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                {confirmModalMode === 'append' ? (
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center">
                    <Plus className="w-5 h-5 stroke-[2.5]" />
                  </div>
                ) : (
                  <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                )}
                <h3 className="font-black text-base text-white">
                  {confirmModalMode === 'append'
                    ? '¿Añadir a platos existentes?'
                    : '¿Sobrescribir toda la carta?'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setConfirmModalMode(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-300 leading-relaxed space-y-2">
              {confirmModalMode === 'append' ? (
                <p>
                  Se añadirán los <strong>{editableResult?.total_dishes || aiParsedResult?.total_dishes} platos</strong> y sus categorías a la carta actual.
                  Los platos ya existentes conservarán su identificador canónico.
                </p>
              ) : (
                <div className="space-y-2">
                  <p className="text-rose-400 font-bold bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl">
                    ⚠️ Advertencia: Esta acción reemplazará toda tu carta actual. Todos los platos y categorías actuales serán eliminados y sustituidos por los nuevos platos.
                  </p>
                  <p>
                    ¿Estás seguro de que deseas proceder con la sobrescritura total?
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModalMode(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 font-bold text-xs transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className={`px-5 py-2.5 rounded-xl font-black text-xs text-white shadow-md transition-all cursor-pointer ${
                  confirmModalMode === 'append'
                    ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/25'
                    : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/25'
                }`}
              >
                {confirmModalMode === 'append' ? 'Confirmar y Añadir' : 'Sí, Sobrescribir Carta'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
