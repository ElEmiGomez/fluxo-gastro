'use client'

import { useState, useEffect } from 'react'
import { Product, Category, Restaurant } from '@/types/database.types'
import { MOCK_RESTAURANTS, MOCK_CATEGORIES, MOCK_PRODUCTS } from '@/lib/supabase/mock-fallback'
import { resolveCanonicalProductId } from '@/lib/category-matcher'
import { AiParsedMenuResult } from '@/types/admin.types'

interface UseAdminMenuParams {
  slug: string
  onSwitchTab?: (tab: 'products' | 'categories' | 'ai_import') => void
}

export function useAdminMenu({ slug, onSwitchTab }: UseAdminMenuParams) {
  const [restaurant, setRestaurant] = useState<Restaurant>(
    () => MOCK_RESTAURANTS[slug] || MOCK_RESTAURANTS['burger-gourmet']
  )
  const [categories, setCategories] = useState<Category[]>(
    () => MOCK_CATEGORIES[slug] || MOCK_CATEGORIES['burger-gourmet'] || []
  )
  const [products, setProducts] = useState<Product[]>(
    () => MOCK_PRODUCTS[slug] || MOCK_PRODUCTS['burger-gourmet'] || []
  )

  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  // Modales de Edición
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([])
  const [isNewProductModalOpen, setIsNewProductModalOpen] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [editingCatId, setEditingCatId] = useState<string | null>(null)
  const [editingCatName, setEditingCatName] = useState('')

  // Asistente IA
  const [aiRawText, setAiRawText] = useState('')
  const [aiParsing, setAiParsing] = useState(false)
  const [aiParsedResult, setAiParsedResult] = useState<AiParsedMenuResult | null>(null)

  const showToast = (msg: string) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), 3000)
  }

  // Cargar datos del servidor
  const fetchMenuData = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/admin/menu?slug=${slug}&_t=${Date.now()}`, { cache: 'no-store' })
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

    // 1. Sincronización SSE en vivo
    let sse: EventSource | null = null
    try {
      sse = new EventSource('/api/events')
      sse.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.type === 'menu_updated' && (!data.slug || data.slug === slug)) {
            if (data.productId && data.isAvailable !== undefined) {
              const canonical = resolveCanonicalProductId(data.productId) || data.productId
              setProducts(prev =>
                prev.map(p => {
                  const pCanon = resolveCanonicalProductId(p.id) || p.id
                  if (p.id === data.productId || p.id === canonical || pCanon === canonical) {
                    return { ...p, is_available: data.isAvailable }
                  }
                  return p
                })
              )
            } else {
              fetchMenuData()
            }
          }
        } catch {}
      }
    } catch {}

    // 2. BroadcastChannel cross-tab
    let bc: BroadcastChannel | null = null
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        bc = new BroadcastChannel('fluxo_menu_channel')
        bc.onmessage = (event) => {
          const { type, slug: evtSlug, productId, isAvailable } = event.data || {}
          if (type === 'menu_updated' && (!evtSlug || evtSlug === slug)) {
            if (productId && isAvailable !== undefined) {
              const canonical = resolveCanonicalProductId(productId) || productId
              setProducts(prev =>
                prev.map(p => {
                  const pCanon = resolveCanonicalProductId(p.id) || p.id
                  if (p.id === productId || p.id === canonical || pCanon === canonical) {
                    return { ...p, is_available: isAvailable }
                  }
                  return p
                })
              )
            } else {
              fetchMenuData()
            }
          }
        }
      }
    } catch {}

    // 3. CustomEvent en la misma ventana
    const handleMenuUpdated = (e: any) => {
      const { slug: evtSlug, productId, isAvailable } = e?.detail || {}
      if (!evtSlug || evtSlug === slug) {
        if (productId && isAvailable !== undefined) {
          const canonical = resolveCanonicalProductId(productId) || productId
          setProducts(prev =>
            prev.map(p => {
              const pCanon = resolveCanonicalProductId(p.id) || p.id
              if (p.id === productId || p.id === canonical || pCanon === canonical) {
                return { ...p, is_available: isAvailable }
              }
              return p
            })
          )
        } else {
          fetchMenuData()
        }
      }
    }
    window.addEventListener('fluxo_menu_updated', handleMenuUpdated)

    return () => {
      if (sse) sse.close()
      if (bc) try { bc.close() } catch {}
      window.removeEventListener('fluxo_menu_updated', handleMenuUpdated)
    }
  }, [slug])

  // Toggle Inmediato de Disponibilidad ("Se Agotó")
  const handleToggleAvailability = async (productId: string, currentAvailable: boolean) => {
    const nextState = !currentAvailable
    const targetProd = products.find(p => p.id === productId)
    const canonicalId = resolveCanonicalProductId(productId) || productId

    // Actualización optimista inmediata
    setProducts(prev =>
      prev.map(p => {
        const pCanon = resolveCanonicalProductId(p.id) || p.id
        if (p.id === productId || p.id === canonicalId || pCanon === canonicalId) {
          return { ...p, is_available: nextState }
        }
        return p
      })
    )

    try {
      const res = await fetch('/api/admin/menu', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-staff-pin': '1234',
        },
        credentials: 'include',
        body: JSON.stringify({
          slug,
          product_id: canonicalId,
          name: targetProd?.name,
          is_available: nextState,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (data.success) {
        showToast(nextState ? '✅ Plato marcado como DISPONIBLE' : '⚠️ Plato marcado como AGOTADO')
        try {
          if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
            const bc = new BroadcastChannel('fluxo_menu_channel')
            bc.postMessage({ type: 'menu_updated', slug, productId: canonicalId, isAvailable: nextState })
            bc.close()
          }
        } catch {}
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('fluxo_menu_updated', {
              detail: { slug, productId: canonicalId, isAvailable: nextState },
            })
          )
        }
      } else {
        console.error('[Admin Menu Panel] Error al actualizar disponibilidad:', data)
        showToast(data.error || 'Error al actualizar disponibilidad')
        // Revertir optimismo
        setProducts(prev =>
          prev.map(p => {
            const pCanon = resolveCanonicalProductId(p.id) || p.id
            if (p.id === productId || p.id === canonicalId || pCanon === canonicalId) {
              return { ...p, is_available: currentAvailable }
            }
            return p
          })
        )
      }
    } catch (err) {
      console.error('[Admin Menu Panel] Excepción al actualizar disponibilidad:', err)
      showToast('Error de conexión al actualizar disponibilidad')
      setProducts(prev =>
        prev.map(p => {
          const pCanon = resolveCanonicalProductId(p.id) || p.id
          if (p.id === productId || p.id === canonicalId || pCanon === canonicalId) {
            return { ...p, is_available: currentAvailable }
          }
          return p
        })
      )
    }
  }

  // Guardar o Editar Producto
  const handleSaveProduct = async (productData: Partial<Product>) => {
    try {
      const res = await fetch('/api/admin/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
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
      } else {
        console.error('[Admin Menu Panel] Error al guardar plato:', data)
        showToast(data.error || 'Error al guardar el plato')
      }
    } catch (err) {
      console.error('[Admin Menu Panel] Excepción al guardar plato:', err)
      showToast('Error de conexión al guardar el plato')
    }
  }

  // Eliminar Producto
  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('¿Estás seguro de eliminar este plato?')) return
    setProducts(prev => prev.filter(p => p.id !== productId))
    try {
      const res = await fetch(`/api/admin/menu?slug=${slug}&type=product&id=${productId}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      const data = await res.json()
      if (res.ok && data.success) {
        showToast('🗑️ Plato eliminado')
      } else {
        console.error('[Admin Menu Panel] Error al eliminar plato:', data)
        showToast(data.error || 'Error al eliminar plato')
        fetchMenuData()
      }
    } catch (err) {
      console.error('[Admin Menu Panel] Excepción al eliminar plato:', err)
      showToast('Error de conexión al eliminar plato')
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
        if (onSwitchTab) onSwitchTab('products')
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

  return {
    restaurant,
    categories,
    products,
    isLoading,
    toastMsg,
    showToast,
    selectedCategoryFilter,
    setSelectedCategoryFilter,
    searchQuery,
    setSearchQuery,
    filteredProducts,
    editingProduct,
    setEditingProduct,
    selectedAllergens,
    setSelectedAllergens,
    isNewProductModalOpen,
    setIsNewProductModalOpen,
    newCatName,
    setNewCatName,
    editingCatId,
    setEditingCatId,
    editingCatName,
    setEditingCatName,
    aiRawText,
    setAiRawText,
    aiParsing,
    aiParsedResult,
    setAiParsedResult,
    fetchMenuData,
    handleToggleAvailability,
    handleSaveProduct,
    handleDeleteProduct,
    handleCreateCategory,
    handleDeleteCategory,
    handleRenameCategory,
    handleMoveCategory,
    handleParseWithAI,
    handleApplyAiMenu,
  }
}
