'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  Utensils,
  Plus,
  Trash2,
  Edit2,
  Sparkles,
  CheckCircle2,
  Search,
  Check,
  X,
  RefreshCw,
  Power,
  ChevronUp,
  ChevronDown,
  Eye
} from 'lucide-react'
import { TenantProvider } from '@/components/tenant/TenantProvider'
import { StaffPinAuth } from '@/components/auth/StaffPinAuth'
import { Product, Category, Restaurant } from '@/types/database.types'
import { formatCurrency } from '@/lib/utils'
import { MOCK_RESTAURANTS, MOCK_CATEGORIES, MOCK_PRODUCTS } from '@/lib/supabase/mock-fallback'

export default function AdminMenuPage() {
  const params = useParams()
  const slug = (params?.slug as string) || 'burger-gourmet'

  const [restaurant, setRestaurant] = useState<Restaurant>(() => MOCK_RESTAURANTS[slug] || MOCK_RESTAURANTS['burger-gourmet'])
  const [categories, setCategories] = useState<Category[]>(() => MOCK_CATEGORIES[slug] || MOCK_CATEGORIES['burger-gourmet'] || [])
  const [products, setProducts] = useState<Product[]>(() => MOCK_PRODUCTS[slug] || MOCK_PRODUCTS['burger-gourmet'] || [])
  
  const [activeTab, setActiveTab] = useState<'products' | 'categories' | 'ai_import'>('products')
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  // Modales de Edición
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [isNewProductModalOpen, setIsNewProductModalOpen] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [editingCatId, setEditingCatId] = useState<string | null>(null)
  const [editingCatName, setEditingCatName] = useState('')

  // Asistente IA
  const [aiRawText, setAiRawText] = useState('')
  const [aiParsing, setAiParsing] = useState(false)
  const [aiParsedResult, setAiParsedResult] = useState<any>(null)

  const showToast = (msg: string) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), 3000)
  }

  // Cargar datos del servidor
  const fetchMenuData = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/admin/menu?slug=${slug}`)
      const data = await res.json()
      if (data.success) {
        if (data.categories) setCategories(data.categories)
        if (data.products) setProducts(data.products)
        if (data.restaurant) setRestaurant(data.restaurant)
      }
    } catch (e) {
      console.error('Error fetching admin menu:', e)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchMenuData()
  }, [slug])

  // Toggle Inmediato de Disponibilidad ("Se Agotó")
  const handleToggleAvailability = async (productId: string, currentAvailable: boolean) => {
    setProducts(prev =>
      prev.map(p => (p.id === productId ? { ...p, is_available: !currentAvailable } : p))
    )

    try {
      const res = await fetch('/api/admin/menu', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          product_id: productId,
          is_available: !currentAvailable,
        }),
      })
      const data = await res.json()
      if (data.success) {
        showToast(data.is_available ? '✅ Plato marcado como DISPONIBLE' : '⚠️ Plato marcado como AGOTADO')
      }
    } catch {
      showToast('Error al actualizar disponibilidad')
      fetchMenuData()
    }
  }

  // Guardar o Editar Producto
  const handleSaveProduct = async (productData: Partial<Product>) => {
    try {
      const res = await fetch('/api/admin/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          type: 'product',
          data: productData,
        }),
      })
      const data = await res.json()
      if (data.success && data.product) {
        setProducts(prev => {
          const idx = prev.findIndex(p => p.id === data.product.id)
          if (idx >= 0) return prev.map(p => (p.id === data.product.id ? data.product : p))
          return [data.product, ...prev]
        })
        setEditingProduct(null)
        setIsNewProductModalOpen(false)
        showToast('✅ Plato guardado correctamente')
      }
    } catch {
      showToast('Error al guardar el plato')
    }
  }

  // Eliminar Producto
  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('¿Estás seguro de eliminar este plato?')) return
    setProducts(prev => prev.filter(p => p.id !== productId))
    try {
      await fetch(`/api/admin/menu?slug=${slug}&type=product&id=${productId}`, {
        method: 'DELETE',
      })
      showToast('🗑️ Plato eliminado')
    } catch {
      fetchMenuData()
    }
  }

  // Crear Categoría
  const handleCreateCategory = async () => {
    if (!newCatName.trim()) return
    try {
      const res = await fetch('/api/admin/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          type: 'category',
          data: {
            name: newCatName.trim().toUpperCase(),
            order_index: categories.length + 1,
          },
        }),
      })
      const data = await res.json()
      if (data.success && data.category) {
        setCategories(prev => [...prev, data.category])
        setNewCatName('')
        showToast('✅ Categoría creada')
      }
    } catch {
      showToast('Error al crear categoría')
    }
  }

  // Eliminar Categoría
  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('¿Eliminar esta categoría? Los platos quedarán sin agrupar.')) return
    setCategories(prev => prev.filter(c => c.id !== categoryId))
    try {
      await fetch(`/api/admin/menu?slug=${slug}&type=category&id=${categoryId}`, {
        method: 'DELETE',
      })
      showToast('🗑️ Categoría eliminada')
    } catch {
      fetchMenuData()
    }
  }

  // Guardar Renombrado de Categoría
  const handleRenameCategory = async (catId: string) => {
    if (!editingCatName.trim()) {
      setEditingCatId(null)
      return
    }
    const cat = categories.find(c => c.id === catId)
    if (!cat) return
    const updated = { ...cat, name: editingCatName.trim().toUpperCase() }
    setCategories(prev => prev.map(c => (c.id === catId ? updated : c)))
    setEditingCatId(null)

    await fetch('/api/admin/menu', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug,
        type: 'category',
        data: updated,
      }),
    })
    showToast('✅ Categoría renombrada')
  }

  // Reordenar Categorías
  const handleMoveCategory = async (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1
    if (targetIdx < 0 || targetIdx >= categories.length) return
    const nextList = [...categories]
    const temp = nextList[index]
    nextList[index] = nextList[targetIdx]
    nextList[targetIdx] = temp
    setCategories(nextList)

    await fetch('/api/admin/menu', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug,
        type: 'categories_reorder',
        data: nextList,
      }),
    })
  }

  // Procesar con IA
  const handleParseWithAI = async () => {
    if (!aiRawText.trim()) return
    setAiParsing(true)
    try {
      const res = await fetch('/api/admin/ai-menu-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          raw_text: aiRawText,
          save_to_menu: false,
        }),
      })
      const data = await res.json()
      if (data.success && data.parsed) {
        setAiParsedResult(data.parsed)
        showToast(`✨ IA extrajo ${data.parsed.total_dishes} platos en ${data.parsed.total_categories} categorías`)
      }
    } catch {
      showToast('Error al parsear con IA')
    } finally {
      setAiParsing(false)
    }
  }

  // Cargar en Carta con 1 Clic desde IA
  const handleApplyAiMenu = async () => {
    if (!aiParsedResult) return
    setIsLoading(true)
    try {
      const res = await fetch('/api/admin/ai-menu-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          raw_text: aiRawText,
          save_to_menu: true,
        }),
      })
      const data = await res.json()
      if (data.success) {
        showToast('🚀 ¡Carta digitalizada y publicada con éxito!')
        setAiParsedResult(null)
        setAiRawText('')
        setActiveTab('products')
        fetchMenuData()
      }
    } catch {
      showToast('Error al aplicar menú de IA')
    } finally {
      setIsLoading(false)
    }
  }

  // Filtrado de productos
  const filteredProducts = products.filter(p => {
    const matchesCat = selectedCategoryFilter === 'all' || p.category_id === selectedCategoryFilter
    const matchesQuery =
      searchQuery === '' ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesCat && matchesQuery
  })

  return (
    <StaffPinAuth role="admin" restaurantSlug={slug}>
      <TenantProvider restaurant={restaurant}>
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
          
          {/* Toast Notification */}
          {toastMsg && (
            <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl bg-slate-900 border border-cyan-500/50 text-white font-bold text-xs sm:text-sm shadow-2xl flex items-center gap-2 animate-in slide-in-from-bottom-5">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>{toastMsg}</span>
            </div>
          )}

          {/* CABECERA PRINCIPAL ADMIN */}
          <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 px-4 py-3">
            <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center font-black">
                    <Utensils className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[9px] font-black uppercase text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-md border border-purple-500/20">
                      Gestión de Carta
                    </span>
                    <h1 className="text-sm sm:text-base font-black text-white leading-tight mt-0.5">
                      {restaurant.name} &middot; Administración
                    </h1>
                  </div>
                </div>

                <Link
                  href={`/menu/${slug}?table=1`}
                  target="_blank"
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-cyan-400 text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Ver carta como comensal"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Ver Carta QR</span>
                </Link>
              </div>

              {/* Pestañas de Navegación */}
              <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-2xl border border-slate-800 w-full sm:w-auto justify-center">
                <button
                  onClick={() => setActiveTab('products')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    activeTab === 'products'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Platos ({products.length})
                </button>
                <button
                  onClick={() => setActiveTab('categories')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    activeTab === 'categories'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Categorías ({categories.length})
                </button>
                <button
                  onClick={() => setActiveTab('ai_import')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1 ${
                    activeTab === 'ai_import'
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md'
                      : 'text-cyan-400 hover:text-white'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Importar con IA</span>
                </button>
              </div>
            </div>
          </header>

          {/* CONTENIDO PRINCIPAL */}
          <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 space-y-6">
            
            {/* ── PESTAÑA 1: PLATOS Y CARTA ── */}
            {activeTab === 'products' && (
              <div className="space-y-4">
                
                {/* Barra de Filtros & Acción Nuevo */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Buscar plato por nombre o ingrediente..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-white text-xs sm:text-sm focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <button
                    onClick={() => {
                      setEditingProduct(null)
                      setIsNewProductModalOpen(true)
                    }}
                    className="px-4 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs sm:text-sm shadow-lg shadow-purple-600/20 flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>Añadir Nuevo Plato</span>
                  </button>
                </div>

                {/* Filtro de Categorías con Pastillas */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                  <button
                    onClick={() => setSelectedCategoryFilter('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                      selectedCategoryFilter === 'all'
                        ? 'bg-slate-200 text-slate-950 font-black'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    Todos ({products.length})
                  </button>
                  {categories.map(cat => {
                    const count = products.filter(p => p.category_id === cat.id).length
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategoryFilter(cat.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                          selectedCategoryFilter === cat.id
                            ? 'bg-purple-600 text-white font-black'
                            : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                        }`}
                      >
                        {cat.name} ({count})
                      </button>
                    )
                  })}
                </div>

                {/* Lista de Platos Táctil */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredProducts.map(product => {
                    const isAvailable = product.is_available !== false
                    const catName = categories.find(c => c.id === product.category_id)?.name || 'General'

                    return (
                      <div
                        key={product.id}
                        className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                          isAvailable
                            ? 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                            : 'bg-slate-950 border-rose-900/40 opacity-75'
                        }`}
                      >
                        {/* Miniatura Foto */}
                        {product.image_url ? (
                          <div
                            style={{ position: 'relative', width: '56px', height: '56px', minWidth: '56px', minHeight: '56px', overflow: 'hidden', borderRadius: '12px' }}
                            className="bg-slate-800 flex-shrink-0 border border-slate-700"
                          >
                            <Image
                              src={product.image_url}
                              alt={product.name}
                              fill
                              className="object-cover"
                              sizes="56px"
                            />
                          </div>
                        ) : (
                          <div className="w-14 h-14 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-600 flex-shrink-0">
                            <Utensils size={20} />
                          </div>
                        )}

                        {/* Datos del Plato */}
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[9px] font-black uppercase text-purple-400 bg-purple-500/10 px-1.5 py-0.2 rounded border border-purple-500/20">
                              {catName}
                            </span>
                            {!isAvailable && (
                              <span className="text-[9px] font-black uppercase text-rose-300 bg-rose-500/20 px-1.5 py-0.2 rounded border border-rose-500/30">
                                AGOTADO
                              </span>
                            )}
                          </div>
                          <h3 className="font-extrabold text-xs sm:text-sm text-white truncate">
                            {product.name}
                          </h3>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-xs text-cyan-400 tabular-nums">
                              {product.price_type === 'weight'
                                ? `${formatCurrency(product.price)} / ${product.price_unit || '100g'}`
                                : formatCurrency(product.price)}
                            </span>
                          </div>
                        </div>

                        {/* Botones de Control Rápido */}
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {/* Toggle ON/OFF Disponibilidad Inmediata */}
                          <button
                            type="button"
                            onClick={() => handleToggleAvailability(product.id, isAvailable)}
                            title={isAvailable ? 'Marcar como agotado' : 'Marcar como disponible'}
                            className={`p-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer flex items-center gap-1 ${
                              isAvailable
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                                : 'bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20'
                            }`}
                          >
                            <Power size={14} />
                          </button>

                          {/* Editar */}
                          <button
                            type="button"
                            onClick={() => {
                              setEditingProduct(product)
                              setIsNewProductModalOpen(true)
                            }}
                            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
                            title="Editar plato"
                          >
                            <Edit2 size={14} />
                          </button>

                          {/* Eliminar */}
                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(product.id)}
                            className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 border border-slate-700 transition-colors cursor-pointer"
                            title="Eliminar plato"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ── PESTAÑA 2: GESTIÓN DE CATEGORÍAS ── */}
            {activeTab === 'categories' && (
              <div className="max-w-2xl mx-auto space-y-4">
                
                {/* Crear Categoría */}
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-3">
                  <input
                    type="text"
                    placeholder="Nombre de la nueva categoría (ej: RACIONES, CÓCTELES...)"
                    value={newCatName}
                    onChange={e => setNewCatName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleCreateCategory()}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs sm:text-sm focus:outline-none focus:border-purple-500 uppercase"
                  />
                  <button
                    onClick={handleCreateCategory}
                    className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Plus size={16} />
                    <span>Crear</span>
                  </button>
                </div>

                {/* Lista Reordenable de Categorías */}
                <div className="space-y-2">
                  {categories.map((cat, idx) => {
                    const dishCount = products.filter(p => p.category_id === cat.id).length
                    const isEditing = editingCatId === cat.id

                    return (
                      <div
                        key={cat.id}
                        className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3 shadow-xs"
                      >
                        {/* Posición y Nombre */}
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <span className="w-6 h-6 rounded-lg bg-slate-800 text-slate-400 text-xs font-black flex items-center justify-center flex-shrink-0">
                            {idx + 1}
                          </span>

                          {isEditing ? (
                            <div className="flex items-center gap-2 flex-1">
                              <input
                                type="text"
                                value={editingCatName}
                                onChange={e => setEditingCatName(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleRenameCategory(cat.id)}
                                autoFocus
                                className="px-3 py-1 rounded-lg bg-slate-950 border border-purple-500 text-white text-xs sm:text-sm uppercase flex-1"
                              />
                              <button
                                onClick={() => handleRenameCategory(cat.id)}
                                className="p-1.5 rounded-lg bg-emerald-600 text-white"
                              >
                                <Check size={14} />
                              </button>
                              <button
                                onClick={() => setEditingCatId(null)}
                                className="p-1.5 rounded-lg bg-slate-800 text-slate-400"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ) : (
                            <div>
                              <h3 className="font-extrabold text-xs sm:text-sm text-white">{cat.name}</h3>
                              <span className="text-[10px] text-slate-400 font-bold">{dishCount} platos en esta sección</span>
                            </div>
                          )}
                        </div>

                        {/* Botones de Reordenación y Acciones */}
                        {!isEditing && (
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              onClick={() => handleMoveCategory(idx, 'up')}
                              disabled={idx === 0}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 transition-colors"
                              title="Subir orden"
                            >
                              <ChevronUp size={14} />
                            </button>
                            <button
                              onClick={() => handleMoveCategory(idx, 'down')}
                              disabled={idx === categories.length - 1}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 transition-colors"
                              title="Bajar orden"
                            >
                              <ChevronDown size={14} />
                            </button>
                            <button
                              onClick={() => {
                                setEditingCatId(cat.id)
                                setEditingCatName(cat.name)
                              }}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                              title="Renombrar"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(cat.id)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-rose-400 transition-colors"
                              title="Eliminar categoría"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ── PESTAÑA 3: ASISTENTE DE IA (IMPORTADOR) ── */}
            {activeTab === 'ai_import' && (
              <div className="max-w-3xl mx-auto space-y-6">
                <div className="p-5 rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950/40 to-cyan-950/30 border border-cyan-500/30 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center font-black">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="font-black text-sm sm:text-base text-white">Digitalizador Inteligente de Carta con IA</h2>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Pega el texto desordenado de tu carta física o carta en papel. La IA detectará platos, precios y alérgenos al instante.
                      </p>
                    </div>
                  </div>

                  {/* Ejemplos Rápidos */}
                  <div className="flex items-center gap-2 flex-wrap text-xs">
                    <span className="text-slate-400 font-bold">Cargar Ejemplo:</span>
                    <button
                      type="button"
                      onClick={() => setAiRawText(`TAPAS Y RACIONES
Pulpo á Feira con patatas gallegas - 18,50€
Zamburiñas de la Ría a la plancha (8 unidades) - 16.00 €
Pimientos de Padrón fritos con sal Maldon: 7,50
Croquetas artesanas de jamón ibérico (6 uds) - 8,90€

PLATOS PRINCIPALES
Chuletón de Vaca Rubia Galega a la brasa (1kg) al peso - 48,00€
Bacalao al horno con costra de pan de maíz - 19.50€

POSTRES CASEROS
Tarta de Santiago con azúcar glas - 5.50€
Filloas rellenas de crema pastelera - 6.00€`)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 text-[11px] font-bold border border-slate-700"
                    >
                      Ejemplo Tapería Gallega
                    </button>
                    <button
                      type="button"
                      onClick={() => setAiRawText(`HAMBURGUESAS GOURMET
Doble Bacon Monster con queso cheddar fundido y cebolla crujiente 13.90€
Truffle Burger con carne de ternera madurada y mayonesa trufada 15,50 €
Smash Burger Clásica con salsa especial 11.00€

BEBIDAS & CERVEZAS
Pinta Cerveza Artesanal IPA 4.50€
Agua Mineral 500ml 2,00€`)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-purple-400 text-[11px] font-bold border border-slate-700"
                    >
                      Ejemplo Hamburguesería
                    </button>
                  </div>

                  {/* Textarea */}
                  <textarea
                    rows={8}
                    placeholder="Pega aquí el texto de tu menú, fotos transcritas o lista de platos con sus precios..."
                    value={aiRawText}
                    onChange={e => setAiRawText(e.target.value)}
                    className="w-full p-4 rounded-2xl bg-slate-950 border border-slate-800 text-slate-100 text-xs sm:text-sm font-mono focus:outline-none focus:border-cyan-500 leading-relaxed"
                  />

                  {/* Botón Parsear */}
                  <button
                    type="button"
                    onClick={handleParseWithAI}
                    disabled={aiParsing || !aiRawText.trim()}
                    className="w-full py-3.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-cyan-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    {aiParsing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Analizando y extrayendo platos con IA...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Extraer y Previsualizar Carta con IA</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Previsualización del Resultado de IA */}
                {aiParsedResult && (
                  <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        <h3 className="font-black text-sm text-white">
                          Previsualización: {aiParsedResult.total_dishes} platos en {aiParsedResult.total_categories} categorías
                        </h3>
                      </div>
                    </div>

                    {/* Tabla de Platos Detectados */}
                    <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                      {aiParsedResult.categories.map((cat: any) => {
                        const dishes = aiParsedResult.products.filter((p: any) => p.category_id === cat.id)
                        return (
                          <div key={cat.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                            <span className="text-xs font-black text-cyan-400 uppercase tracking-wider">{cat.name}</span>
                            <div className="space-y-1">
                              {dishes.map((d: any) => (
                                <div key={d.id} className="flex items-center justify-between text-xs text-slate-300">
                                  <div className="truncate pr-2">
                                    <span className="font-bold text-white">{d.name}</span>
                                    {d.description && <span className="text-slate-500 text-[11px] block truncate">{d.description}</span>}
                                  </div>
                                  <span className="font-black text-cyan-400 tabular-nums whitespace-nowrap">{formatCurrency(d.price)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* Botón Aplicar en 1 Clic */}
                    <button
                      type="button"
                      onClick={handleApplyAiMenu}
                      className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 transition-transform active:scale-95 cursor-pointer"
                    >
                      <Check className="w-5 h-5 stroke-[3]" />
                      <span>🚀 Cargar en Carta con 1 Clic (Publicar Inmediatamente)</span>
                    </button>
                  </div>
                )}
              </div>
            )}

          </main>

          {/* ── MODAL DE CREAR / EDITAR PLATO ── */}
          {isNewProductModalOpen && (
            <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 select-none">
              <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg p-6 space-y-4 shadow-2xl text-white animate-in zoom-in-95">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="font-black text-sm sm:text-base">
                    {editingProduct ? 'Editar Plato' : 'Añadir Nuevo Plato'}
                  </h3>
                  <button
                    onClick={() => {
                      setEditingProduct(null)
                      setIsNewProductModalOpen(false)
                    }}
                    className="p-1.5 text-slate-400 hover:text-white rounded-full bg-slate-800"
                  >
                    <X size={16} />
                  </button>
                </div>

                <form
                  onSubmit={e => {
                    e.preventDefault()
                    const fd = new FormData(e.currentTarget)
                    handleSaveProduct({
                      id: editingProduct?.id,
                      name: String(fd.get('name') || ''),
                      price: parseFloat(String(fd.get('price') || '0')),
                      category_id: String(fd.get('category_id') || categories[0]?.id || 'cat-1'),
                      description: String(fd.get('description') || ''),
                      image_url: String(fd.get('image_url') || ''),
                      price_type: fd.get('is_weight') ? 'weight' : 'unit',
                      price_unit: fd.get('is_weight') ? '100g' : undefined,
                    })
                  }}
                  className="space-y-3 text-xs sm:text-sm"
                >
                  <div className="space-y-1">
                    <label className="text-slate-400 font-bold block">Nombre del Plato *</label>
                    <input
                      name="name"
                      required
                      defaultValue={editingProduct?.name || ''}
                      placeholder="Ej: Hamburguesa Gallega Doble"
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-slate-400 font-bold block">Precio (€) *</label>
                      <input
                        name="price"
                        type="number"
                        step="0.01"
                        required
                        defaultValue={editingProduct?.price || ''}
                        placeholder="Ej: 14.50"
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-purple-500 tabular-nums"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-400 font-bold block">Categoría *</label>
                      <select
                        name="category_id"
                        defaultValue={editingProduct?.category_id || categories[0]?.id}
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-purple-500"
                      >
                        {categories.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-400 font-bold block">Descripción o Ingredientes</label>
                    <textarea
                      name="description"
                      rows={2}
                      defaultValue={editingProduct?.description || ''}
                      placeholder="Ej: 200g de carne madurada, queso de Arzúa y cebolla caramelizada."
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-400 font-bold block">URL de Foto (Opcional)</label>
                    <input
                      name="image_url"
                      defaultValue={editingProduct?.image_url || ''}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="is_weight"
                      name="is_weight"
                      defaultChecked={editingProduct?.price_type === 'weight'}
                      className="rounded text-purple-600 focus:ring-purple-500"
                    />
                    <label htmlFor="is_weight" className="text-slate-300 font-bold cursor-pointer">
                      Precio al peso (ej: Chuletón o Marisco por 100g)
                    </label>
                  </div>

                  <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingProduct(null)
                        setIsNewProductModalOpen(false)
                      }}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black shadow-md cursor-pointer"
                    >
                      Guardar Plato
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

        </div>
      </TenantProvider>
    </StaffPinAuth>
  )
}
