'use client'

import React, { useState, useRef } from 'react'
import {
  X,
  Camera,
  Upload,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  QrCode,
  ArrowRight,
  ExternalLink,
  MessageCircle,
  FileText,
  UtensilsCrossed,
  Layers,
  Check,
  RefreshCw,
  Wine,
  Flame,
  Download,
  Info,
  Link2,
  Globe,
} from 'lucide-react'
import {
  ParsedMenuResponse,
  ParsedMenuItem,
  ParsedMenuCategory,
  EU_ALLERGENS,
  EUAllergenKey,
  sanitizeSlug,
} from '@/lib/menu-vision-schema'
import { CRMTemplateQRModal } from '@/components/crm/CRMTemplateQRModal'

interface AiMenuOnboardingModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccessProvisioning?: (result: { slug: string; name: string }) => void
}

export function AiMenuOnboardingModal({
  isOpen,
  onClose,
  onSuccessProvisioning,
}: AiMenuOnboardingModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [inputMode, setInputMode] = useState<'file' | 'url'>('file')
  const [menuUrl, setMenuUrl] = useState('')
  const [restaurantName, setRestaurantName] = useState('Taberna O Marinheiro')
  const [showQrCardModal, setShowQrCardModal] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<'fundador' | 'carta' | 'pro'>('fundador')
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageBase64, setImageBase64] = useState<string>('')
  const [mimeType, setMimeType] = useState<string>('image/jpeg')
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingStage, setProcessingStage] = useState<string>('')
  const [parsedData, setParsedData] = useState<ParsedMenuResponse | null>(null)
  const [provisionedSlug, setProvisionedSlug] = useState<string>('')

  const fileInputRef = useRef<HTMLInputElement | null>(null)

  if (!isOpen) return null

  // Manejo de archivo (imagen o PDF)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setMimeType(file.type || 'image/jpeg')
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      setImagePreview(result)
      setImageBase64(result)
    }
    reader.readAsDataURL(file)
  }

  // Carga rápida con muestra para testeo de 1 clic
  const handleUseSample = () => {
    setImagePreview('/images/carta-ejemplo.jpg')
    setImageBase64('data:image/jpeg;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7') // Placeholder mínimo
    setMimeType('image/jpeg')
  }

  // Disparar extracción IA
  const handleStartScan = async () => {
    setIsProcessing(true)
    setStep(2)
    setProcessingStage(
      inputMode === 'url'
        ? 'Accediendo al enlace web y extrayendo carta digital...'
        : 'Leyendo platos y precios con Visión IA...'
    )

    try {
      setTimeout(() => {
        setProcessingStage('Detectando los 14 alérgenos UE y productos de lonja...')
      }, 700)

      setTimeout(() => {
        setProcessingStage('Configurando clasificación de estaciones (Cocina vs Barra)...')
      }, 1400)

      const payload: Record<string, any> = {
        customRestaurantName: restaurantName,
      }

      if (inputMode === 'url') {
        payload.menuUrl = menuUrl.trim()
      } else {
        payload.imageBase64 = imageBase64 || 'sample'
        payload.mimeType = mimeType
      }

      const res = await fetch('/api/onboarding/parse-menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const json = await res.json()
      if (json.success && json.data) {
        setParsedData(json.data)
      }
    } catch (err) {
      console.warn('Scan error, proceeding with fallback:', err)
    } finally {
      setIsProcessing(false)
    }
  }

  // Modificar precio de un ítem en Paso 2
  const handleUpdatePrice = (catId: string, itemId: string, newPrice: string) => {
    if (!parsedData) return
    const num = parseFloat(newPrice.replace(',', '.'))
    setParsedData(prev => {
      if (!prev) return null
      return {
        ...prev,
        categories: prev.categories.map(c => {
          if (c.id !== catId) return c
          return {
            ...c,
            items: c.items.map(it => {
              if (it.id !== itemId) return it
              return {
                ...it,
                price: isNaN(num) ? null : num,
                is_market_price: isNaN(num),
              }
            }),
          }
        }),
      }
    })
  }

  // Toggle Lonja / S/M
  const handleToggleMarketPrice = (catId: string, itemId: string) => {
    if (!parsedData) return
    setParsedData(prev => {
      if (!prev) return null
      return {
        ...prev,
        categories: prev.categories.map(c => {
          if (c.id !== catId) return c
          return {
            ...c,
            items: c.items.map(it => {
              if (it.id !== itemId) return it
              const nextState = !it.is_market_price
              return {
                ...it,
                is_market_price: nextState,
                price: nextState ? null : (it.price || 12.0),
              }
            }),
          }
        }),
      }
    })
  }

  // Aprovisionar en 1 clic
  const handleProvisionStore = () => {
    if (!parsedData) return
    const slug = sanitizeSlug(restaurantName || parsedData.suggested_slug)
    setProvisionedSlug(slug)

    // Aplanar platos para el formato del motor de cartas /p/[slug]
    const dishesFlattened: any[] = []
    parsedData.categories.forEach(cat => {
      cat.items.forEach(it => {
        dishesFlattened.push({
          id: it.id,
          nombre: it.name,
          categoria: cat.name,
          precio: it.price || 0,
          is_market_price: it.is_market_price,
          badge: it.is_market_price ? 'Lonja' : null,
          alergenos: it.allergens.map(a => EU_ALLERGENS[a]?.label_es || a),
          descripcion: it.description || '',
        })
      })
    })

    const prototypeRecord = {
      id: `proto_${slug}`,
      slug,
      nombre_local: restaurantName,
      eslogan: parsedData.slogan || 'Carta Digital & Servicio de Mesa',
      color_acento: '#2563eb',
      clave_wifi: '',
      platos: dishesFlattened,
      url_destino: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    // Persistir en localStorage (SSOT compartido de prototipos de demo)
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('fluxo_crm_prototypes_v1')
        const currentList = stored ? JSON.parse(stored) : []
        const filtered = currentList.filter((p: any) => p.slug !== slug)
        filtered.unshift(prototypeRecord)
        localStorage.setItem('fluxo_crm_prototypes_v1', JSON.stringify(filtered))
      } catch (e) {
        console.warn('Error saving prototype to localStorage:', e)
      }
    }

    if (onSuccessProvisioning) {
      onSuccessProvisioning({ slug, name: restaurantName })
    }

    setStep(3)
  }

  const publicUrl = `https://fluxo-gastro.vercel.app/p/${provisionedSlug}`
  const qrImageSrc = `/images/street_kit_clean_preview.png` // QR minimalista blanco

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Encabezado */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black shadow-md shadow-blue-500/20">
              <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                Onboarding Llave en Mano • Visión IA
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Paso {step} de 3: {step === 1 ? 'Captura de Carta' : step === 2 ? 'Revisión Express de Platos' : 'Local Aprovisionado'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cuerpo Dinámico según Paso */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {step === 1 && (
            <div className="space-y-4">
              {/* Nombre del local */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Nombre comercial del bar o restaurante:
                </label>
                <input
                  type="text"
                  value={restaurantName}
                  onChange={e => setRestaurantName(e.target.value)}
                  placeholder="ej. Taberna O Marinheiro"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* Selector de Plan */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Plan Comercial Recomendado:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedPlan('fundador')}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedPlan === 'fundador'
                        ? 'border-blue-600 bg-blue-50/80 dark:bg-blue-950/30 text-blue-950 dark:text-blue-200 ring-2 ring-blue-500/20'
                        : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="text-[11px] font-black">Full Fundador</div>
                    <div className="text-xs font-extrabold text-blue-600 dark:text-blue-400">50 €/mes</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedPlan('carta')}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedPlan === 'carta'
                        ? 'border-blue-600 bg-blue-50/80 dark:bg-blue-950/30 text-blue-950 dark:text-blue-200 ring-2 ring-blue-500/20'
                        : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="text-[11px] font-black">Carta Fija</div>
                    <div className="text-xs font-extrabold text-slate-600 dark:text-slate-400">20 €/mes</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedPlan('pro')}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedPlan === 'pro'
                        ? 'border-blue-600 bg-blue-50/80 dark:bg-blue-950/30 text-blue-950 dark:text-blue-200 ring-2 ring-blue-500/20'
                        : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="text-[11px] font-black">Multi-Sala Pro</div>
                    <div className="text-xs font-extrabold text-slate-600 dark:text-slate-400">75 €/mes</div>
                  </button>
                </div>
              </div>

              {/* Selector de Modo: Foto/PDF vs Enlace Web */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Fuente de la Carta:
                </label>
                <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => setInputMode('file')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      inputMode === 'file'
                        ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    <Camera className="w-4 h-4" />
                    <span>Foto o PDF</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setInputMode('url')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      inputMode === 'url'
                        ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    <Globe className="w-4 h-4" />
                    <span>Pegar Link / Web</span>
                  </button>
                </div>
              </div>

              {inputMode === 'file' ? (
                <>
                  {/* Zona de Captura / Subida */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Foto de la Carta Física o PDF:
                    </label>
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-slate-50/50 dark:bg-slate-800/20"
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,application/pdf"
                        className="hidden"
                        onChange={handleFileChange}
                      />

                      {imagePreview ? (
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-16 h-20 rounded-xl bg-slate-200 dark:bg-slate-700 overflow-hidden shadow-md flex items-center justify-center">
                            <FileText className="w-8 h-8 text-blue-600" />
                          </div>
                          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Archivo listo para escaneo
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-xs">
                            <Camera className="w-6 h-6" />
                          </div>
                          <div className="text-xs font-bold text-slate-700 dark:text-slate-200">
                            Haz una foto a la carta o sube un PDF
                          </div>
                          <p className="text-[11px] text-slate-400 max-w-xs">
                            La IA extraerá todos los platos, precios, lonja y alérgenos en segundos.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Botón rápido de carta de muestra */}
                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={handleUseSample}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 underline flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Probar con Foto de Carta de Muestra (1 clic)
                    </button>
                  </div>
                </>
              ) : (
                /* Modo Pegar Link / Web */
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      <Link2 className="w-3.5 h-3.5 text-blue-600" />
                      Enlace de la carta (Página Web, Menú Digital o PDF online):
                    </label>
                    <div className="relative">
                      <input
                        type="url"
                        value={menuUrl}
                        onChange={e => setMenuUrl(e.target.value)}
                        placeholder="https://restaurante.com/carta o link a PDF..."
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                      <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Fluxo extraerá los platos, precios y alérgenos rastreando directamente la web o PDF online.
                    </p>
                  </div>

                  {/* Enlaces de muestra rápidos para testeo de 1 clic */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="text-[11px] font-bold text-slate-500">Ejemplos:</span>
                    <button
                      type="button"
                      onClick={() => setMenuUrl('https://casamardavila.es/carta')}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 hover:bg-slate-200 cursor-pointer"
                    >
                      Casa Mar Da Vila
                    </button>
                    <button
                      type="button"
                      onClick={() => setMenuUrl('https://taperiaopazo.es/menu')}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 hover:bg-slate-200 cursor-pointer"
                    >
                      Tapería O Pazo
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              {isProcessing ? (
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                  <RefreshCw className="w-10 h-10 text-blue-600 animate-spin" />
                  <h4 className="text-sm font-black text-slate-900 dark:text-white">
                    Digitalizando carta con Visión Artificial
                  </h4>
                  <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 animate-pulse">
                    {processingStage}
                  </p>
                </div>
              ) : parsedData ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 p-3 rounded-2xl text-xs text-emerald-800 dark:text-emerald-300 font-bold">
                    <span>✓ Extraídos {parsedData.categories.reduce((s, c) => s + c.items.length, 0)} platos en {parsedData.categories.length} categorías</span>
                    <span className="text-[11px] opacity-80">Revisión express editable</span>
                  </div>

                  {/* Acordeón / Lista de platos extraídos */}
                  <div className="space-y-3 max-h-[48vh] overflow-y-auto pr-1">
                    {parsedData.categories.map(cat => (
                      <div key={cat.id} className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                        <div className="bg-slate-100 dark:bg-slate-800/60 px-3.5 py-2 flex items-center justify-between text-xs font-black text-slate-800 dark:text-slate-200">
                          <span className="flex items-center gap-1.5">
                            {cat.role === 'drink' ? <Wine className="w-3.5 h-3.5 text-purple-600" /> : <UtensilsCrossed className="w-3.5 h-3.5 text-blue-600" />}
                            {cat.name} ({cat.items.length})
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 uppercase">
                            {cat.station === 'bar' ? 'Barra' : 'Cocina'}
                          </span>
                        </div>

                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                          {cat.items.map(it => (
                            <div key={it.id} className="p-3 flex items-center justify-between gap-3 text-xs">
                              <div className="flex-1 min-w-0">
                                <div className="font-bold text-slate-900 dark:text-white truncate">
                                  {it.name}
                                </div>
                                {it.description && (
                                  <div className="text-[11px] text-slate-400 truncate">
                                    {it.description}
                                  </div>
                                )}
                                {/* Badges de alérgenos UE */}
                                <div className="flex items-center gap-1 mt-1 flex-wrap">
                                  {it.allergens.map(a => (
                                    <span key={a} className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-0.2 rounded font-medium">
                                      {EU_ALLERGENS[a]?.icon} {EU_ALLERGENS[a]?.label_es.split(' ')[0]}
                                    </span>
                                  ))}
                                  {it.allergens.length === 0 && (
                                    <span className="text-[10px] text-emerald-600 font-bold">
                                      Sin alérgenos
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Control de Precio y Lonja */}
                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleToggleMarketPrice(cat.id, it.id)}
                                  className={`px-2 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                                    it.is_market_price
                                      ? 'bg-blue-600 text-white shadow-xs'
                                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 hover:bg-slate-200'
                                  }`}
                                  title="Marcar como precio según lonja o mercado"
                                >
                                  🌊 Lonja
                                </button>

                                {!it.is_market_price && (
                                  <div className="flex items-center">
                                    <input
                                      type="text"
                                      value={it.price !== null ? it.price.toFixed(2) : ''}
                                      onChange={e => handleUpdatePrice(cat.id, it.id, e.target.value)}
                                      className="w-16 px-1.5 py-1 text-right text-xs font-black border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                    />
                                    <span className="ml-1 text-slate-500 font-bold">€</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 rounded-2xl">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-black text-emerald-900 dark:text-emerald-200">
                    ¡Local Aprovisionado con Éxito!
                  </h4>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300">
                    {restaurantName} ya tiene su Carta QR y su Tarjeta de Calle listas para operar.
                  </p>
                </div>
              </div>

              {/* Botones de Acción de Éxito */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <a
                  href={`/p/${provisionedSlug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Abrir Carta QR (/p/{provisionedSlug})</span>
                </a>

                <a
                  href={`https://wa.me/?text=${encodeURIComponent(
                    `Hola! Ya tienes digitalizada tu carta de ${restaurantName} con Fluxo. Puedes verla aquí: https://fluxo-gastro.vercel.app/p/${provisionedSlug}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Enviar por WhatsApp al Dueño</span>
                </a>
              </div>

              {/* Previsualización del QR Minimalista de Calle */}
              <div className="p-4 bg-slate-900 text-white rounded-2xl flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                    Tarjeta QR de Calle (A5 300 DPI)
                  </div>
                  <div className="text-xs text-slate-300 font-medium">
                    Diseño minimalista: &ldquo;Escanea para acceder a la carta&rdquo; + Isotipo &ldquo;F.&rdquo; en blanco.
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowQrCardModal(true)}
                  className="px-3 py-2 rounded-xl bg-white text-slate-900 font-black text-xs flex items-center gap-1.5 hover:bg-slate-100 transition-all shadow-xs flex-shrink-0 cursor-pointer active:scale-95"
                >
                  <QrCode className="w-4 h-4" />
                  <span>Ver Tarjeta QR</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Pie con Botones de Navegación */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/90 flex items-center justify-between">
          {step > 1 && step < 3 ? (
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
            >
              Atrás
            </button>
          ) : (
            <div />
          )}

          {step === 1 && (
            <button
              type="button"
              disabled={!restaurantName.trim() || (inputMode === 'url' && !menuUrl.trim())}
              onClick={handleStartScan}
              className="px-5 py-2.5 rounded-xl font-black text-xs bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 shadow-md transition-all active:scale-95 disabled:opacity-40 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>{inputMode === 'url' ? 'Escanear Web con IA' : 'Analizar Carta con Visión IA'}</span>
            </button>
          )}

          {step === 2 && !isProcessing && (
            <button
              type="button"
              onClick={handleProvisionStore}
              className="px-5 py-2.5 rounded-xl font-black text-xs bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Crear Local y Generar Carta QR</span>
            </button>
          )}

          {step === 3 && (
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl font-black text-xs bg-slate-800 hover:bg-slate-700 text-white cursor-pointer"
            >
              Finalizar
            </button>
          )}
        </div>
      </div>

      {/* Modal de la Tarjeta QR Acompañadora del Local Aprovisionado */}
      <CRMTemplateQRModal
        isOpen={showQrCardModal}
        onClose={() => setShowQrCardModal(false)}
        customPrototype={{
          slug: provisionedSlug,
          name: restaurantName,
          isDynamic: true,
        }}
      />
    </div>
  )
}
