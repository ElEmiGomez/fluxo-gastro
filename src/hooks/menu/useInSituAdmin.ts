'use client'

import { useState, useRef, useEffect } from 'react'
import { Product, Category, CartItem } from '@/types/database.types'
import { triggerHaptic, HAPTIC_PATTERNS } from '@/lib/haptic'

interface UseInSituAdminParams {
  slug: string
  products: Product[]
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>
  selectedCategory: string
  setSelectedCategory: (cat: string) => void
  categories: Category[]
  loadData: () => Promise<void>
}

export function useInSituAdmin({
  slug,
  products,
  setProducts,
  setCart,
  selectedCategory,
  setSelectedCategory,
  categories,
  loadData,
}: UseInSituAdminParams) {
  const [isInSituAdmin, setIsInSituAdmin] = useState(false)
  const [adminSessionToken, setAdminSessionToken] = useState<string | null>(null)
  const [showAdminAuthModal, setShowAdminAuthModal] = useState(false)
  const [editingInSituProduct, setEditingInSituProduct] = useState<Product | null>(null)
  const [isInSituEditModalOpen, setIsInSituEditModalOpen] = useState(false)
  const [inSituTargetCategoryId, setInSituTargetCategoryId] = useState<string | undefined>(undefined)
  const [inSituFeedbackToast, setInSituFeedbackToast] = useState<string | null>(null)

  const logoPressTimerRef = useRef<NodeJS.Timeout | null>(null)
  const touchStartPosRef = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedAdmin = sessionStorage.getItem(`fluxo_insitu_admin_${slug}`)
        if (savedAdmin) {
          const parsedAdmin = JSON.parse(savedAdmin)
          if (parsedAdmin?.token && Date.now() - parsedAdmin.timestamp < 12 * 60 * 60 * 1000) {
            setIsInSituAdmin(true)
            setAdminSessionToken(parsedAdmin.token)
          }
        }
      } catch {}
    }
  }, [slug])

  const handleAdminAuthSuccess = (token: string) => {
    setIsInSituAdmin(true)
    setAdminSessionToken(token)
    try {
      sessionStorage.setItem(
        `fluxo_insitu_admin_${slug}`,
        JSON.stringify({ token, timestamp: Date.now() })
      )
    } catch {}
    setInSituFeedbackToast('✨ Modo Edición In-Situ activado')
    setTimeout(() => setInSituFeedbackToast(null), 3000)
    loadData()
  }

  const handleExitAdminMode = () => {
    setIsInSituAdmin(false)
    setAdminSessionToken(null)
    setIsInSituEditModalOpen(false)
    setEditingInSituProduct(null)
    setShowAdminAuthModal(false)
    try {
      sessionStorage.removeItem(`fluxo_insitu_admin_${slug}`)
    } catch {}
    setInSituFeedbackToast('🔒 Modo Edición finalizado')
    setTimeout(() => setInSituFeedbackToast(null), 3000)
  }

  const handleToggleAvailability = async (productId: string, currentAvailable: boolean) => {
    triggerHaptic(HAPTIC_PATTERNS.TAP)
    const nextState = !currentAvailable
    setProducts(prev =>
      prev.map(p => (p.id === productId ? { ...p, is_available: nextState } : p))
    )

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      if (adminSessionToken) {
        headers['Authorization'] = `Bearer ${adminSessionToken}`
      }

      const res = await fetch('/api/admin/menu', {
        method: 'PATCH',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          slug,
          product_id: productId,
          name: products.find(p => p.id === productId)?.name,
          is_available: nextState,
        }),
      })

      const data = await res.json()
      if (data.success) {
        setInSituFeedbackToast(
          data.is_available ? '✅ Plato marcado como DISPONIBLE' : '⚠️ Plato marcado como AGOTADO'
        )
        setTimeout(() => setInSituFeedbackToast(null), 3000)
        try {
          if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
            const bc = new BroadcastChannel('fluxo_menu_channel')
            bc.postMessage({ type: 'menu_updated', slug, productId, isAvailable: nextState })
            bc.close()
          }
        } catch {}
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('fluxo_menu_updated', {
              detail: { slug, productId, isAvailable: nextState },
            })
          )
        }
      } else {
        setProducts(prev =>
          prev.map(p => (p.id === productId ? { ...p, is_available: currentAvailable } : p))
        )
        if (res.status === 401) {
          handleExitAdminMode()
          setInSituFeedbackToast('⚠️ Sesión expirada. Por favor identifícate de nuevo.')
          setShowAdminAuthModal(true)
        } else {
          setInSituFeedbackToast(data.error || 'Error al actualizar disponibilidad')
          setTimeout(() => setInSituFeedbackToast(null), 3000)
        }
      }
    } catch {
      setProducts(prev =>
        prev.map(p => (p.id === productId ? { ...p, is_available: currentAvailable } : p))
      )
      setInSituFeedbackToast('Error de conexión al actualizar la disponibilidad.')
      setTimeout(() => setInSituFeedbackToast(null), 3000)
    }
  }

  const handleOpenEditProductModal = (product: Product) => {
    setEditingInSituProduct(product)
    setIsInSituEditModalOpen(true)
  }

  const handleOpenAddProductModal = (catId?: string) => {
    setEditingInSituProduct(null)
    setInSituTargetCategoryId(catId || (selectedCategory !== 'all' ? selectedCategory : categories[0]?.id))
    setIsInSituEditModalOpen(true)
  }

  const handleSaveInSituProduct = (savedProduct: Product) => {
    setProducts(prev => {
      const idx = prev.findIndex(p => p.id === savedProduct.id)
      if (idx >= 0) {
        return prev.map(p => (p.id === savedProduct.id ? savedProduct : p))
      }
      return [savedProduct, ...prev]
    })
    setCart(prev =>
      prev.map(item =>
        item.product?.id === savedProduct.id
          ? { ...item, product: { ...item.product, ...savedProduct } }
          : item
      )
    )
    if (savedProduct.category_id && selectedCategory !== 'all' && selectedCategory !== savedProduct.category_id) {
      setSelectedCategory(savedProduct.category_id)
    }
    setInSituFeedbackToast('✅ Plato guardado en la carta')
    setTimeout(() => setInSituFeedbackToast(null), 3000)
  }

  const handleDeleteInSituProduct = (productId: string) => {
    setProducts(prev => prev.filter(p => p.id !== productId))
    setCart(prev => prev.filter(item => item.product?.id !== productId))
    setInSituFeedbackToast('🗑️ Plato eliminado de la carta')
    setTimeout(() => setInSituFeedbackToast(null), 3000)
  }

  const handleLogoPointerDown = () => {
    if (logoPressTimerRef.current) clearTimeout(logoPressTimerRef.current)
    logoPressTimerRef.current = setTimeout(() => {
      triggerHaptic(HAPTIC_PATTERNS.SUCCESS)
      if (!isInSituAdmin) {
        setShowAdminAuthModal(true)
      }
    }, 800)
  }

  const handleLogoPointerUp = () => {
    if (logoPressTimerRef.current) {
      clearTimeout(logoPressTimerRef.current)
      logoPressTimerRef.current = null
    }
    touchStartPosRef.current = null
  }

  const handleLogoTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      touchStartPosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    }
    handleLogoPointerDown()
  }

  const handleLogoTouchMove = (e: React.TouchEvent) => {
    if (touchStartPosRef.current && e.touches.length > 0) {
      const dx = Math.abs(e.touches[0].clientX - touchStartPosRef.current.x)
      const dy = Math.abs(e.touches[0].clientY - touchStartPosRef.current.y)
      if (dx > 10 || dy > 10) {
        handleLogoPointerUp()
      }
    }
  }

  return {
    isInSituAdmin,
    adminSessionToken,
    showAdminAuthModal,
    setShowAdminAuthModal,
    editingInSituProduct,
    setEditingInSituProduct,
    isInSituEditModalOpen,
    setIsInSituEditModalOpen,
    inSituTargetCategoryId,
    inSituFeedbackToast,
    setInSituFeedbackToast,
    handleAdminAuthSuccess,
    handleExitAdminMode,
    handleToggleAvailability,
    handleOpenEditProductModal,
    handleOpenAddProductModal,
    handleSaveInSituProduct,
    handleDeleteInSituProduct,
    handleLogoPointerDown,
    handleLogoPointerUp,
    handleLogoTouchStart,
    handleLogoTouchMove,
  }
}
