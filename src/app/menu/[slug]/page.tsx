'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useParams, useSearchParams, usePathname } from 'next/navigation'
import { Check, Loader2 } from 'lucide-react'
import { CartItem, Product, DailyMenu, Order, CourseType } from '@/types/database.types'
import { TenantProvider } from '@/components/tenant/TenantProvider'
import { MicroOnboardingBanner } from '@/components/menu/MicroOnboardingBanner'
import { MenuHeader } from '@/components/menu/MenuHeader'
import { MenuLiveTracker } from '@/components/menu/MenuLiveTracker'
import { MenuCategoryBar } from '@/components/menu/MenuCategoryBar'
import { DailyMenuModal, DailyMenuSelectionItem } from '@/components/menu/DailyMenuModal'
import { DailyMenuCard } from '@/components/menu/DailyMenuCard'
import { PromoConfiguratorModal, PromoConfiguredPayload } from '@/components/menu/PromoConfiguratorModal'
import { QuickDessertSelectorModal } from '@/components/comandero/QuickDessertSelectorModal'
import { QuickSobremesaModal } from '@/components/menu/QuickSobremesaModal'
import { orderHasPendingChoiceDesserts, ordersHavePendingDesserts, hydrateOrderItemsWithCatalog } from '@/lib/course-utils'
import { isDailyMenuActive } from '@/lib/daily-menu-utils'
import { MenuGridCatalog } from '@/components/menu/MenuGridCatalog'
import { MenuFloatingCartBar } from '@/components/menu/MenuFloatingCartBar'
import { MenuBottomCategoryBar } from '@/components/menu/MenuBottomCategoryBar'
import { useScrollDirection } from '@/hooks/menu/useScrollDirection'
import { MenuFooterLegal } from '@/components/menu/MenuFooterLegal'
import { MenuModals } from '@/components/menu/MenuModals'
import { useMenuCatalog } from '@/hooks/menu/useMenuCatalog'
import { useTableSession } from '@/hooks/menu/useTableSession'
import { useMenuOrderSync } from '@/hooks/menu/useMenuOrderSync'
import { useInSituAdmin } from '@/hooks/menu/useInSituAdmin'
import { triggerHaptic, HAPTIC_PATTERNS } from '@/lib/haptic'
import { getTranslation, translateProductName } from '@/lib/i18n'
import { useLoyalty } from '@/hooks/menu/useLoyalty'
import { LoyaltyModal } from '@/components/menu/LoyaltyModal'
import { StampCardModal } from '@/components/menu/StampCardModal'
import { LoyaltyReward } from '@/types/loyalty.types'

const STORAGE_CART_PREFIX = 'gastro_cart_'

function DinerMenuContent() {
  const params = useParams()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const slug = (params?.slug as string) || 'burger-gourmet'
  const tableParam = searchParams?.get('table') || '4'
  const urlSession = searchParams?.get('session')

  const isFixedMenu = searchParams?.get('mode') === 'fija' || 
    searchParams?.get('fija') === 'true' || 
    searchParams?.get('fixed') === 'true' || 
    searchParams?.get('plan') === 'carta' ||
    Boolean(pathname?.startsWith('/carta'))

  // 1. Carrito local
  const [cart, setCart] = useState<CartItem[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [addedToast, setAddedToast] = useState<string | null>(null)
  const [customizingProduct, setCustomizingProduct] = useState<Product | null>(null)
  const [selected3DProduct, setSelected3DProduct] = useState<Product | null>(null)
  const [showTimelineModal, setShowTimelineModal] = useState(false)
  const [showDirectBillModal, setShowDirectBillModal] = useState(false)
  const [showServiceModal, setShowServiceModal] = useState(false)
  const [showLegalModal, setShowLegalModal] = useState(false)
  const [dailyMenu, setDailyMenu] = useState<DailyMenu | null>(null)
  const [isDailyMenuModalOpen, setIsDailyMenuModalOpen] = useState(false)
  const [customizingPromoProduct, setCustomizingPromoProduct] = useState<Product | null>(null)
  const [isQuickDessertModalOpen, setIsQuickDessertModalOpen] = useState(false)
  const [isSobremesaModalOpen, setIsSobremesaModalOpen] = useState(false)

  // 1.2 Detección de Scroll para ocultar/mostrar barra de categorías inferior
  const { isScrollingDown, isAtTop } = useScrollDirection({ threshold: 10 })
  const isBottomCategoryBarVisible = !isScrollingDown || isAtTop

  // 1.1 Carga del Menú del Día Dinámico
  useEffect(() => {
    let isMounted = true
    const fetchDailyMenu = async () => {
      try {
        const res = await fetch(`/api/daily-menu?slug=${slug}&_t=${Date.now()}`, { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          if (isMounted && data.dailyMenu) {
            setDailyMenu(data.dailyMenu)
          }
        }
      } catch (err) {
        console.warn('[DinerMenuContent] Error fetching daily menu:', err)
      }
    }
    fetchDailyMenu()
    return () => {
      isMounted = false
    }
  }, [slug])

  const hasActiveDailyMenu = isDailyMenuActive(dailyMenu)

  // 2. Sesión de mesa y micro-servicios
  const {
    tableNumber,
    sessionId,
    setSessionId,
    isTablePaid,
    setIsTablePaid,
    isOrderPaid,
    setIsOrderPaid,
    resetPaidOrderSession,
    isPaidBannerDismissed,
    setIsPaidBannerDismissed,
    isReviewBoosterDismissed,
    setIsReviewBoosterDismissed,
    hasRequestedBill,
    setHasRequestedBill,
    hasRequestedBillRef,
    userRequestedBillTimeRef,
    handleBillRequested,
    handleTableMarkedPaid,
    pendingServiceCalls,
    setPendingServiceCalls,
    serviceRequestedToast,
    handleRequestMicroService,
  } = useTableSession({ slug, initialTable: tableParam, urlSession })

  // 2.1 Tarjeta de Fidelización Digital y Escrow de Puntos
  const loyalty = useLoyalty({ slug, tableNumber })

  // 3. Catálogo de productos y filtros
  const [isInSituAdminState, setIsInSituAdminState] = useState(false)
  const {
    restaurant,
    categories,
    products,
    setProducts,
    currentLang,
    setCurrentLang,
    showLangDropdown,
    setShowLangDropdown,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    dietaryFilter,
    setDietaryFilter,
    viewMode,
    setViewMode,
    filteredProducts,
    loadData,
    categoryTabsRef,
    canScrollLeft,
    canScrollRight,
    handleScrollCategories,
    updateScrollButtons,
  } = useMenuCatalog({ slug, isInSituAdmin: isInSituAdminState })

  // 4. Modo Administrador In-Situ
  const {
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
  } = useInSituAdmin({
    slug,
    products,
    setProducts,
    setCart,
    selectedCategory,
    setSelectedCategory,
    categories,
    loadData,
  })

  // Sincronizar estado booleano para el catálogo
  useEffect(() => {
    setIsInSituAdminState(isInSituAdmin)
  }, [isInSituAdmin])

  // 5. Sincronización en tiempo real de órdenes con Cocina y Mozo
  const {
    tableOrderStatus,
    setTableOrderStatus,
    tableOrders,
    setTableOrders,
    tableTotalAmount,
    setTableTotalAmount,
    prevTableOrdersMapRef,
  } = useMenuOrderSync({
    slug,
    tableNumber,
    sessionId,
    setSessionId,
    isFixedMenu,
    isTablePaid,
    setIsTablePaid,
    setIsOrderPaid,
    resetPaidOrderSession,
    setIsPaidBannerDismissed,
    setIsReviewBoosterDismissed,
    setHasRequestedBill,
    hasRequestedBillRef,
    userRequestedBillTimeRef,
    setPendingServiceCalls,
    products,
    setProducts,
    loadData,
    setCart,
    handleTableMarkedPaid,
  })

  // Refrescar saldo de fidelización automáticamente cuando se completa el pago de la cuenta o se libera la mesa
  useEffect(() => {
    if (isTablePaid) {
      loyalty.refresh()
    }
  }, [isTablePaid])

  useEffect(() => {
    const handleLoyaltyRefresh = () => {
      loyalty.refresh()
    }
    const handleTableFreed = (e: any) => {
      const freedTbl = e.detail?.tableNumber ?? e.detail?.table_number
      if (freedTbl?.toString() === tableNumber?.toString()) {
        resetPaidOrderSession()
        setIsTablePaid(false)
        setIsOrderPaid(false)
        setIsPaidBannerDismissed(false)
        setIsReviewBoosterDismissed(false)
        setHasRequestedBill(false)
        loyalty.refresh()
      }
    }
    window.addEventListener('fluxo_loyalty_refresh', handleLoyaltyRefresh)
    window.addEventListener('fluxo_table_freed', handleTableFreed)
    return () => {
      window.removeEventListener('fluxo_loyalty_refresh', handleLoyaltyRefresh)
      window.removeEventListener('fluxo_table_freed', handleTableFreed)
    }
  }, [loyalty, tableNumber, resetPaidOrderSession, setIsTablePaid, setIsOrderPaid, setIsPaidBannerDismissed, setIsReviewBoosterDismissed, setHasRequestedBill])

  // 6. Persistencia y recuperación del carrito en localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedCart = localStorage.getItem(`${STORAGE_CART_PREFIX}${slug}_${tableNumber}`)
        if (savedCart) {
          const parsed = JSON.parse(savedCart)
          if (Array.isArray(parsed) && parsed.length > 0) {
            const sanitized: CartItem[] = parsed
              .filter((item: any) => item && typeof item === 'object')
              .map((item: any) => ({
                product: {
                  ...(item.product && typeof item.product === 'object' ? item.product : {}),
                  id: (item.product && item.product.id) || item.product_id || item.id || 'unknown',
                  name: (item.product && item.product.name) || item.name || 'Plato',
                  price: Number((item.product && item.product.price) ?? item.price ?? 0),
                  category_id: (item.product && item.product.category_id) || '',
                },
                quantity: Math.max(1, parseInt(String(item.quantity || 1), 10) || 1),
                selectedPills: Array.isArray(item.selectedPills) ? item.selectedPills : [],
                notes: typeof item.notes === 'string' ? item.notes : '',
                cartItemId: typeof item.cartItemId === 'string' ? item.cartItemId : undefined,
                course: item.course,
                is_complimentary: Boolean(item.is_complimentary),
                is_pack_header: Boolean(item.is_pack_header),
                is_pack_component: Boolean(item.is_pack_component),
                pack_id: typeof item.pack_id === 'string' ? item.pack_id : undefined,
                pack_tag: typeof item.pack_tag === 'string' ? item.pack_tag : undefined,
                weight_grams: typeof item.weight_grams === 'number' ? item.weight_grams : undefined,
              }))
            setCart(sanitized)
          }
        }
      } catch (err) {
        console.error('Error recovering cart from localStorage:', err)
      }
    }
  }, [slug, tableNumber])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (cart.length > 0) {
        localStorage.setItem(`${STORAGE_CART_PREFIX}${slug}_${tableNumber}`, JSON.stringify(cart))
      } else {
        localStorage.removeItem(`${STORAGE_CART_PREFIX}${slug}_${tableNumber}`)
      }
    }
  }, [cart, slug, tableNumber])

  // Obtener cantidad de producto en el carrito (incluye personalizados y estándar)
  const getProductQuantityInCart = (productId: string): number => {
    return cart
      .filter(item => item.product?.id === productId)
      .reduce((sum, item) => sum + (item.quantity || 1), 0)
  }

  // Helper para identificar productos tipo combo o promo
  const isPromoProduct = (prod: Product) => {
    const cat = categories.find(c => c.id === prod.category_id)
    const catName = (cat?.name || '').toUpperCase()
    const prodName = (prod.name || '').toUpperCase()
    return catName.includes('PROMO') || catName.includes('COMBO') || prodName.includes('COMBO') || prodName.includes('PROMO')
  }

  // Comprobar si hay alguna orden activa con comodín de postre por elegir
  const activeOrderWithPendingDessert = tableOrders.find(o => orderHasPendingChoiceDesserts(o))
  const hasPendingDessertChoice = Boolean(activeOrderWithPendingDessert)
  const hasPendingDesserts = ordersHavePendingDesserts(tableOrders)

  // Modificar cantidad inline (+ / -) con haptic feedback
  const handleUpdateProductQuantity = (product: Product, delta: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    if (isInSituAdmin) return

    if (delta > 0 && isPromoProduct(product)) {
      setCustomizingPromoProduct(product)
      return
    }

    triggerHaptic(delta > 0 ? HAPTIC_PATTERNS.QUANTITY : HAPTIC_PATTERNS.TAP)

    setCart(prev => {
      let targetIdx = prev.findIndex(
        item => item.product?.id === product.id && (!item.selectedPills || item.selectedPills.length === 0) && (!item.notes || item.notes === '')
      )

      if (targetIdx === -1) {
        for (let i = prev.length - 1; i >= 0; i--) {
          if (prev[i].product?.id === product.id) {
            targetIdx = i
            break
          }
        }
      }

      if (targetIdx >= 0) {
        const nextQty = prev[targetIdx].quantity + delta
        if (nextQty <= 0) {
          return prev.filter((_, idx) => idx !== targetIdx)
        }
        const copy = [...prev]
        copy[targetIdx] = { ...copy[targetIdx], quantity: nextQty }
        return copy
      } else if (delta > 0) {
        return [...prev, { product, quantity: 1, selectedPills: [], notes: '' }]
      }
      return prev
    })

    if (delta > 0) {
      setAddedToast(translateProductName(currentLang, product.id, product.name))
      setTimeout(() => setAddedToast(null), 2500)
    }
  }

  // Agregar producto configurado (modal con modificadores)
  const handleAddCustomized = (
    product: Product,
    quantity: number,
    selectedPills: string[],
    notes: string,
    course?: CourseType,
    isComplimentary?: boolean,
    weightGrams?: number
  ) => {
    triggerHaptic(HAPTIC_PATTERNS.ADD_CART)
    const effectiveUnitPrice = product.price_type === 'weight' && weightGrams && product.price > 20
      ? Number(((product.price * weightGrams) / (product.price_unit === 'kg' ? 1000 : 100)).toFixed(2))
      : product.price

    const customizedProduct: Product = {
      ...product,
      price: effectiveUnitPrice,
    }

    setCart(prev => {
      const existingIdx = prev.findIndex(
        item => item.product.id === product.id && 
          (item.notes || '').trim() === (notes || '').trim() && 
          item.weight_grams === weightGrams &&
          JSON.stringify([...(item.selectedPills || [])].sort()) === JSON.stringify([...(selectedPills || [])].sort())
      )

      if (existingIdx >= 0) {
        const copy = [...prev]
        copy[existingIdx].quantity += quantity
        return copy
      }

      return [
        ...prev,
        {
          product: customizedProduct,
          quantity,
          selectedPills,
          notes,
          course,
          is_complimentary: isComplimentary,
          weight_grams: weightGrams,
        },
      ]
    })

    setAddedToast(translateProductName(currentLang, product.id, product.name))
    setTimeout(() => setAddedToast(null), 2500)
  }

  // Agregar Menú del Día configurado de 4 pasos con Desglose Operativo (Item Explosion)
  const handleAddDailyMenuToCart = (menuPayload: {
    title: string
    price: number
    selections: DailyMenuSelectionItem[]
  }) => {
    triggerHaptic(HAPTIC_PATTERNS.ADD_CART)
    const existingMenuCount = cart.filter(it => it.is_pack_header && it.pack_tag?.startsWith('Menú del Día')).length
    const packNumber = existingMenuCount + 1
    const packId = `pack-daily-menu-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
    const packTag = `Menú del Día #${packNumber}`

    const headerItem: CartItem = {
      cartItemId: `${packId}-header`,
      product: {
        id: `daily-menu-${dailyMenu?.id || 'standard'}`,
        restaurant_id: restaurant?.id || '',
        category_id: 'cat-menu-del-dia',
        name: `${menuPayload.title} #${packNumber}`,
        description: 'Menú del Día Completo (1º, 2º, Postre/Café, Bebida)',
        price: menuPayload.price,
        image_url:
          dailyMenu?.sections?.[0]?.items?.[0]?.product?.image_url ||
          'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
        model_3d_url: null,
        is_available: true,
      },
      quantity: 1,
      selectedPills: [],
      notes: `[PACK_HEADER] [${packTag}]`,
      is_pack_header: true,
      pack_id: packId,
      pack_tag: packTag,
    }

    const subItems: CartItem[] = menuPayload.selections.map((sel, idx) => ({
      cartItemId: `${packId}-sub-${idx}`,
      product: {
        ...sel.product,
        price: 0,
      },
      quantity: 1,
      selectedPills: [],
      notes: `[${packTag}] [COURSE:${sel.course}] ${sel.notes || ''}`.trim(),
      course: sel.course,
      is_complimentary: true,
      is_pack_component: true,
      pack_id: packId,
      pack_tag: packTag,
    }))

    setCart(prev => [...prev, headerItem, ...subItems])
    setAddedToast(`${menuPayload.title} #${packNumber}`)
    setTimeout(() => setAddedToast(null), 2500)
  }

  // Agregar Promo/Combo configurado con Desglose Operativo (Item Explosion)
  const handleAddPromoToCart = (payload: PromoConfiguredPayload) => {
    triggerHaptic(HAPTIC_PATTERNS.ADD_CART)
    const existingPromoCount = cart.filter(it => it.is_pack_header && it.product.id === payload.promoProduct.id).length
    const promoNumber = existingPromoCount + 1
    const packId = `pack-promo-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
    const packTag = `${payload.title} #${promoNumber}`

    const headerItem: CartItem = {
      cartItemId: `${packId}-header`,
      product: {
        ...payload.promoProduct,
        name: `${payload.title} #${promoNumber}`,
        price: payload.price,
      },
      quantity: 1,
      selectedPills: [],
      notes: `[PACK_HEADER] [${packTag}]`,
      is_pack_header: true,
      pack_id: packId,
      pack_tag: packTag,
    }

    const subItems: CartItem[] = payload.selections.map((sel, idx) => ({
      cartItemId: `${packId}-sub-${idx}`,
      product: {
        ...sel.product,
        price: 0,
      },
      quantity: 1,
      selectedPills: [],
      notes: `[${packTag}] [COURSE:${sel.course}] ${sel.notes || ''}`.trim(),
      course: sel.course,
      is_complimentary: true,
      is_pack_component: true,
      pack_id: packId,
      pack_tag: packTag,
    }))

    setCart(prev => [...prev, headerItem, ...subItems])
    setCustomizingPromoProduct(null)
    setAddedToast(`${payload.title} #${promoNumber}`)
    setTimeout(() => setAddedToast(null), 2500)
  }

  // Canjear recompensa por puntos de fidelización
  const handleRedeemLoyaltyReward = async (reward: LoyaltyReward) => {
    if (!reward.product) return

    triggerHaptic(HAPTIC_PATTERNS.ADD_CART)

    const rewardProduct: Product = {
      ...reward.product,
      price: 0,
    }

    setCart(prev => [
      ...prev,
      {
        product: rewardProduct,
        quantity: 1,
        selectedPills: [],
        notes: `[🎁 Canje Fidelización: -${reward.points_cost} pts]`,
        is_complimentary: true,
        loyalty_points_redeemed: reward.points_cost,
      },
    ])

    if (loyalty.profile?.email) {
      try {
        await fetch('/api/loyalty/escrow', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            slug,
            action: 'hold',
            email: loyalty.profile.email,
            points: reward.points_cost,
            tableNumber,
            sessionToken: sessionId || `sess_${Date.now()}`,
            productId: reward.product_id,
          }),
        })
        loyalty.refresh()
      } catch (e) {
        console.warn('Error en escrow de fidelización:', e)
      }
    }

    loyalty.setIsModalOpen(false)
    setIsCartOpen(true)
    setAddedToast(`¡${reward.product.name} canjeado gratis en tu comanda!`)
    setTimeout(() => setAddedToast(null), 3000)
  }

  const totalCartCount = cart.reduce((sum, item) => sum + (Number(item?.quantity) || 1), 0)
  const totalCartAmount = cart.reduce((sum, item) => sum + (Number(item?.product?.price) || 0) * (Number(item?.quantity) || 1), 0)
  const t = (key: string) => getTranslation(currentLang, key)

  const handleOrderSubmitted = (newOrder: any) => {
    if (newOrder) {
      const wasPaidBeforeSubmit = isTablePaid || isOrderPaid
      if (wasPaidBeforeSubmit) {
        resetPaidOrderSession()
      }
      setIsTablePaid(false)
      setIsPaidBannerDismissed(false)
      setIsReviewBoosterDismissed(false)
      setHasRequestedBill(false)
      hasRequestedBillRef.current = false
      userRequestedBillTimeRef.current = null
      if (typeof window !== 'undefined') {
        try {
          if (wasPaidBeforeSubmit) {
            const ordCreatedMs = new Date(newOrder.created_at || Date.now()).getTime() || Date.now()
            sessionStorage.setItem(`fluxo_paid_dismissed_${slug}_${tableNumber}`, String(ordCreatedMs - 1000))
          }
          sessionStorage.removeItem(`fluxo_paid_lock_${slug}_${tableNumber}`)
          sessionStorage.removeItem(`fluxo_table_paid_lock_${slug}_${tableNumber}`)
          sessionStorage.removeItem(`fluxo_paid_order_${slug}_${tableNumber}`)
          sessionStorage.removeItem(`fluxo_table_paid_${slug}_${tableNumber}`)
          sessionStorage.removeItem(`fluxo_bill_requested_${slug}_${tableNumber}`)
          sessionStorage.removeItem(`fluxo_paid_banner_dismissed_${slug}_${tableNumber}`)
          if (newOrder.id) {
            const rawIds = sessionStorage.getItem(`fluxo_active_order_ids_${slug}_${tableNumber}`)
            const existingIds: string[] = rawIds ? JSON.parse(rawIds) : []
            if (!existingIds.includes(newOrder.id)) {
              existingIds.push(newOrder.id)
              sessionStorage.setItem(`fluxo_active_order_ids_${slug}_${tableNumber}`, JSON.stringify(existingIds))
            }
          }
        } catch {}
      }
      const hydratedItems = hydrateOrderItemsWithCatalog(
        newOrder.order_items || [],
        products,
        undefined,
        newOrder.notes
      )
      const hydratedOrder: Order = {
        ...newOrder,
        order_items: hydratedItems,
      }
      prevTableOrdersMapRef.current.set(hydratedOrder.id, hydratedOrder)
      setTableOrders(prev => [hydratedOrder, ...prev.filter(o => o.id !== hydratedOrder.id)])
      setTableOrderStatus(hydratedOrder.status || 'pending_validation')
      if (hydratedOrder.total_amount) {
        setTableTotalAmount(prev => Math.max(prev, Number(hydratedOrder.total_amount) || 0))
      }
      loyalty.refresh()
    }
  }

  return (
    <TenantProvider restaurant={restaurant} initialTable={tableNumber}>
      <div className="min-h-screen bg-slate-50 text-slate-900 pb-44 font-sans antialiased selection:bg-blue-100 selection:text-blue-900" style={{ touchAction: 'manipulation' }}>
        
        {/* Cabecera Ergonómica */}
        <MenuHeader
          restaurant={restaurant}
          restaurantDisplayName={searchParams?.get('local') || undefined}
          tableNumber={tableNumber}
          isFixedMenu={isFixedMenu}
          currentLang={currentLang}
          setCurrentLang={setCurrentLang}
          showLangDropdown={showLangDropdown}
          setShowLangDropdown={setShowLangDropdown}
          isInSituAdmin={isInSituAdmin}
          onOpenServiceModal={() => setShowServiceModal(true)}
          onLogoPointerDown={handleLogoPointerDown}
          onLogoPointerUp={handleLogoPointerUp}
          onLogoTouchStart={handleLogoTouchStart}
          onLogoTouchMove={handleLogoTouchMove}
          loyaltyProfile={loyalty.profile}
          onLogout={loyalty.logout}
          loyaltyPoints={loyalty.profile?.available_points}
          loyaltyMode={loyalty.settings?.mode || 'stamps'}
          stampsCount={loyalty.stampsCount}
          stampsTarget={loyalty.stampsTarget}
          unlockedRewardsCount={loyalty.unlockedRewardsCount}
          onOpenLoyaltyModal={() => loyalty.setIsModalOpen(true)}
        />

        {/* Notificación Toast Flotante */}
        {addedToast && (
          <div className="fixed top-16 inset-x-3 z-50 max-w-md mx-auto p-3 rounded-2xl bg-blue-900 text-white font-bold shadow-2xl flex items-center justify-between gap-2 animate-in slide-in-from-top duration-300 border border-blue-800">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Check className="w-4 h-4 text-emerald-400 stroke-[3] flex-shrink-0" />
              <span className="text-xs font-extrabold truncate">¡{addedToast} {t('addedToCartToast')}!</span>
            </div>
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="text-xs underline font-black text-amber-300 hover:text-amber-200 flex-shrink-0 whitespace-nowrap cursor-pointer"
            >
              {t('viewCart')}
            </button>
          </div>
        )}

        {/* Guía Visual Interactiva (Micro-Onboarding de 4 Pasos) */}
        {!isFixedMenu && (
          <MicroOnboardingBanner
            lang={currentLang}
            tableNumber={tableNumber}
            onScrollToMenu={() => {
              const target = document.getElementById('menu-category-tabs') || document.getElementById('menu-catalog')
              if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }
            }}
            onOpenCart={() => setIsCartOpen(true)}
            onOpenCallWaiter={() => setShowServiceModal(true)}
            onRequestBill={() => setShowDirectBillModal(true)}
          />
        )}

        {/* Tracker en Vivo del Estado de Cocina y Avisos de Cobro */}
        <MenuLiveTracker
          isFixedMenu={isFixedMenu}
          isTablePaid={isTablePaid}
          isOrderPaid={isOrderPaid}
          paidTotal={tableTotalAmount}
          onResetTableSession={resetPaidOrderSession}
          hasRequestedBill={hasRequestedBill}
          tableOrderStatus={tableOrderStatus}
          tableOrders={tableOrders}
          tableNumber={tableNumber}
          currentLang={currentLang}
          isPaidBannerDismissed={isPaidBannerDismissed}
          onDismissPaidBanner={() => {
            setIsPaidBannerDismissed(true)
            if (typeof window !== 'undefined') {
              sessionStorage.setItem(`fluxo_paid_banner_dismissed_${slug}_${tableNumber}`, 'true')
            }
          }}
          isReviewBoosterDismissed={isReviewBoosterDismissed}
          onDismissReviewBooster={() => {
            setIsReviewBoosterDismissed(true)
            if (typeof window !== 'undefined') {
              sessionStorage.setItem(`fluxo_review_dismissed_${slug}`, 'true')
            }
          }}
          restaurant={restaurant}
          onOpenTimelineModal={() => setShowTimelineModal(true)}
          onOpenDirectBillModal={() => {
            setShowDirectBillModal(true)
            triggerHaptic(HAPTIC_PATTERNS.TAP)
          }}
          onGoToDesserts={() => {
            setIsSobremesaModalOpen(true)
            triggerHaptic(HAPTIC_PATTERNS.TAP)
          }}
          loyaltyProfile={loyalty.profile}
          onClaimLoyaltyBonus={loyalty.claimGoogleReviewBonus}
          onOpenLoyaltyModal={() => loyalty.setIsModalOpen(true)}
          onLogout={loyalty.logout}
          hasPendingDessertChoice={hasPendingDessertChoice}
          onOpenDessertSelector={() => setIsQuickDessertModalOpen(true)}
          hasPendingDesserts={hasPendingDesserts}
          loyaltyMode={loyalty.settings?.mode === 'points' ? 'points' : 'stamps'}
        />

        {/* Carta Gastronómica Principal */}
        <main className="max-w-2xl mx-auto px-3.5 pt-3 space-y-3.5">
          {/* Barra de Categorías, Filtros y Buscador */}
          <MenuCategoryBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onClearSearch={() => setSearchQuery('')}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            dietaryFilter={dietaryFilter}
            onDietaryFilterChange={setDietaryFilter}
            currentLang={currentLang}
            categoryTabsRef={categoryTabsRef as any}
            canScrollLeft={canScrollLeft}
            canScrollRight={canScrollRight}
            onScrollCategories={handleScrollCategories}
            updateScrollButtons={updateScrollButtons}
            isInSituAdmin={isInSituAdmin}
            onOpenAddProductModal={handleOpenAddProductModal}
            hasActiveDailyMenu={hasActiveDailyMenu}
          />

          {/* Menú del Día Dinámico */}
          {hasActiveDailyMenu && dailyMenu && !isFixedMenu && Boolean(selectedCategory !== 'all' && categories.find(c => c.id === selectedCategory)?.name.toUpperCase().includes('PROMO')) && (
            <div className="pt-0.5 animate-in fade-in duration-300">
              <DailyMenuCard
                dailyMenu={dailyMenu}
                onOpenModal={() => setIsDailyMenuModalOpen(true)}
              />
            </div>
          )}

          {/* Listado de Platos: Vista Galería Fija */}
          <MenuGridCatalog
            filteredProducts={filteredProducts}
            currentLang={currentLang}
            isFixedMenu={isFixedMenu}
            isInSituAdmin={isInSituAdmin}
            getProductQuantity={getProductQuantityInCart}
            onUpdateQuantity={handleUpdateProductQuantity}
            onToggleAvailability={handleToggleAvailability}
            onOpenEditModal={handleOpenEditProductModal}
            onCustomizeProduct={(prod) => isPromoProduct(prod) ? setCustomizingPromoProduct(prod) : setCustomizingProduct(prod)}
          />

          {/* Footer Legal Informativo */}
          <MenuFooterLegal
            currentLang={currentLang}
            isInSituAdmin={isInSituAdmin}
            onOpenLegalModal={() => setShowLegalModal(true)}
            onOpenAdminAuthModal={() => setShowAdminAuthModal(true)}
            onExitAdminMode={handleExitAdminMode}
          />
        </main>

        {/* Barra Flotante Inferior de Categorías con Scroll Inteligente */}
        <MenuBottomCategoryBar
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={(catId) => {
            setSelectedCategory(catId)
            setSearchQuery('')
          }}
          currentLang={currentLang}
          hasCartItems={(totalCartCount > 0 && !isInSituAdmin) || isFixedMenu}
          isVisible={isBottomCategoryBarVisible}
          onClearSearch={() => setSearchQuery('')}
        />

        {/* Barra Flotante Inferior de Comanda */}
        <MenuFloatingCartBar
          isFixedMenu={isFixedMenu}
          isInSituAdmin={isInSituAdmin}
          totalCartCount={totalCartCount}
          totalCartAmount={totalCartAmount}
          tableNumber={tableNumber}
          currentLang={currentLang}
          onOpenCart={() => setIsCartOpen(true)}
          onOpenAddProductModal={() => handleOpenAddProductModal(selectedCategory !== 'all' ? selectedCategory : undefined)}
          onExitAdminMode={handleExitAdminMode}
        />

        {/* Modales y Visores Secundarios */}
        <MenuModals
          slug={slug}
          tableNumber={tableNumber}
          restaurant={restaurant}
          categories={categories}
          products={products}
          cart={cart}
          currentLang={currentLang}
          sessionId={sessionId}
          setSessionId={setSessionId}
          tableOrderStatus={tableOrderStatus}
          tableOrders={tableOrders}
          hasPendingDesserts={hasPendingDesserts}
          tableTotalAmount={tableTotalAmount}
          isTablePaid={isTablePaid}
          customizingProduct={customizingProduct}
          setCustomizingProduct={setCustomizingProduct}
          selected3DProduct={selected3DProduct}
          setSelected3DProduct={setSelected3DProduct}
          showServiceModal={showServiceModal}
          setShowServiceModal={setShowServiceModal}
          isCartOpen={isCartOpen}
          setIsCartOpen={setIsCartOpen}
          showTimelineModal={showTimelineModal}
          setShowTimelineModal={setShowTimelineModal}
          showDirectBillModal={showDirectBillModal}
          setShowDirectBillModal={setShowDirectBillModal}
          showLegalModal={showLegalModal}
          setShowLegalModal={setShowLegalModal}
          showAdminAuthModal={showAdminAuthModal}
          setShowAdminAuthModal={setShowAdminAuthModal}
          isInSituEditModalOpen={isInSituEditModalOpen}
          setIsInSituEditModalOpen={setIsInSituEditModalOpen}
          editingInSituProduct={editingInSituProduct}
          setEditingInSituProduct={setEditingInSituProduct}
          inSituTargetCategoryId={inSituTargetCategoryId}
          adminSessionToken={adminSessionToken}
          pendingServiceCalls={pendingServiceCalls}
          serviceRequestedToast={serviceRequestedToast}
          inSituFeedbackToast={inSituFeedbackToast}
          setInSituFeedbackToast={setInSituFeedbackToast}
          onAddCustomized={handleAddCustomized}
          onRequestMicroService={handleRequestMicroService}
          onBillRequested={handleBillRequested}
          onOpenSobremesa={() => setIsSobremesaModalOpen(true)}
          onAdminAuthSuccess={handleAdminAuthSuccess}
          onSaveInSituProduct={handleSaveInSituProduct}
          onDeleteInSituProduct={handleDeleteInSituProduct}
          onOrderSubmitted={handleOrderSubmitted}
          onUpdateCartQuantity={(index, newQty) => {
            if (newQty <= 0) {
              setCart(prev => prev.filter((_, idx) => idx !== index))
            } else {
              setCart(prev => {
                const copy = [...prev]
                copy[index].quantity = newQty
                return copy
              })
            }
          }}
          onRemoveCartItem={(index) => {
            setCart(prev => {
              const target = prev[index]
              if (target?.pack_id) {
                return prev.filter(item => item.pack_id !== target.pack_id)
              }
              return prev.filter((_, idx) => idx !== index)
            })
          }}
          onClearCart={() => setCart([])}
          onAddProductInline={(prod) => handleUpdateProductQuantity(prod, 1)}
        />

        {/* Modal de Configuración Guiada del Menú del Día (4 Pasos) */}
        {dailyMenu && (
          <DailyMenuModal
            isOpen={isDailyMenuModalOpen}
            onClose={() => setIsDailyMenuModalOpen(false)}
            dailyMenu={dailyMenu}
            onAddMenuToCart={handleAddDailyMenuToCart}
          />
        )}

        {/* Modal de Configuración Guiada de Promos/Combos (Explosión de Platos) */}
        {customizingPromoProduct && (
          <PromoConfiguratorModal
            isOpen={Boolean(customizingPromoProduct)}
            onClose={() => setCustomizingPromoProduct(null)}
            product={customizingPromoProduct}
            catalogProducts={products}
            onAddPromoToCart={handleAddPromoToCart}
          />
        )}

        {/* Modal Rápido de Elección de Postre Comodín */}
        {activeOrderWithPendingDessert && (
          <QuickDessertSelectorModal
            isOpen={isQuickDessertModalOpen}
            onClose={() => setIsQuickDessertModalOpen(false)}
            tableNumber={tableNumber}
            availableDesserts={products.filter(p => {
              const cat = (p.category_id || '').toLowerCase()
              const n = (p.name || '').toLowerCase()
              return cat.includes('postre') || cat.includes('cafe') || n.includes('postre') || n.includes('tarta') || n.includes('helado') || n.includes('café') || n.includes('cafe')
            })}
            onConfirmDessert={async (dessert, note) => {
              try {
                const res = await fetch('/api/orders', {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    slug,
                    order_id: activeOrderWithPendingDessert.id,
                    action: 'resolve_pending_dessert',
                    dessertProduct: dessert,
                    note,
                    actor_type: 'diner',
                  }),
                })
                if (res.ok) {
                  setIsQuickDessertModalOpen(false)
                  setAddedToast(`¡${dessert.name} marchando a cocina!`)
                  setTimeout(() => setAddedToast(null), 3000)
                  loadData()
                }
              } catch (err) {
                console.error('Error al resolver postre en orden:', err)
              }
            }}
          />
        )}

        {/* Modal Rápido de Sobremesa (Cafés & Postres en 1 Toque) */}
        <QuickSobremesaModal
          isOpen={isSobremesaModalOpen}
          onClose={() => setIsSobremesaModalOpen(false)}
          tableNumber={tableNumber}
          availableItems={products.filter(p => {
            if (p.is_available === false) return false
            const cat = (p.category_id || '').toLowerCase()
            const n = (p.name || '').toLowerCase()
            return (
              cat.includes('postre') ||
              cat.includes('cafe') ||
              n.includes('café') ||
              n.includes('cafe') ||
              n.includes('postre') ||
              n.includes('tarta') ||
              n.includes('helado') ||
              n.includes('volcán') ||
              n.includes('volcan') ||
              n.includes('cheesecake')
            )
          })}
          onOrderSingleItem={async (product) => {
            const parsedTableNum = parseInt(tableNumber || '1', 10)
            const sessionToken = sessionId || (typeof window !== 'undefined' ? localStorage.getItem(`gastro_session_${slug}_${parsedTableNum}`) : null)
            const loyaltyEmail = (() => {
              try {
                const raw = typeof window !== 'undefined' ? localStorage.getItem(`fluxo_loyalty_user_${slug}`) : null
                return raw ? JSON.parse(raw).email : undefined
              } catch {
                return undefined
              }
            })()

            const res = await fetch('/api/orders', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                slug,
                table_number: parsedTableNum,
                session_token: sessionToken,
                items: [
                  {
                    product_id: product.id,
                    quantity: 1,
                    unit_price: product.price,
                    notes: 'Sobremesa (1 Toque)',
                  },
                ],
                loyalty_email: loyaltyEmail,
              }),
            })

            const data = await res.json().catch(() => ({}))
            if (res.ok && data.success) {
              if (data.order) handleOrderSubmitted(data.order)
              triggerHaptic(HAPTIC_PATTERNS.SUCCESS)
              setAddedToast(`¡${product.name} marchando al mozo!`)
              setTimeout(() => setAddedToast(null), 3500)
              loadData()
            } else {
              throw new Error(data.error || 'Error al enviar pedido de sobremesa')
            }
          }}
        />

        {/* Modal de Tarjeta de Fidelización: Cartilla de Sellos o Puntos */}
        {loyalty.settings?.mode === 'points' ? (
          <LoyaltyModal
            isOpen={loyalty.isModalOpen}
            onClose={() => loyalty.setIsModalOpen(false)}
            profile={loyalty.profile}
            rewards={loyalty.rewards}
            isLoading={loyalty.isLoading}
            onLoginOrRegister={loyalty.loginOrRegister}
            onLogout={loyalty.logout}
            onRedeemReward={handleRedeemLoyaltyReward}
            restaurantName={restaurant?.name || ''}
            restaurantSlug={restaurant?.slug || slug}
            googleReviewUrl={restaurant?.google_review_url || null}
            googlePlaceId={restaurant?.google_place_id || null}
            onClaimLoyaltyBonus={loyalty.claimGoogleReviewBonus}
            loyaltyMode={loyalty.settings?.mode === 'points' ? 'points' : 'stamps'}
          />
        ) : (
          <StampCardModal
            isOpen={loyalty.isModalOpen}
            onClose={() => loyalty.setIsModalOpen(false)}
            profile={loyalty.profile}
            settings={loyalty.settings}
            restaurantName={restaurant?.name || ''}
            restaurantSlug={restaurant?.slug || slug}
            googleReviewUrl={restaurant?.google_review_url || null}
            googlePlaceId={restaurant?.google_place_id || null}
            onClaimLoyaltyBonus={loyalty.claimGoogleReviewBonus}
            availableRewardItems={products.filter((p) => {
              const catName = categories.find((c) => c.id === p.category_id)?.name?.toLowerCase() || ''
              const prodName = p.name.toLowerCase()
              return (
                catName.includes('postre') ||
                catName.includes('bebida') ||
                catName.includes('caf') ||
                catName.includes('infus') ||
                prodName.includes('caf') ||
                prodName.includes('tarta') ||
                prodName.includes('volcán') ||
                prodName.includes('postre')
              )
            })}
            isLoading={loyalty.isLoading}
            onLoginOrRegister={loyalty.loginOrRegister}
            onLogout={loyalty.logout}
            onRedeemReward={async (product) => {
              await loyalty.redeemStampReward(product.id)
              const loyaltyEmail = loyalty.profile?.email || null
              const res = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  restaurant_slug: slug,
                  table_number: Number(tableNumber) || 1,
                  session_token: sessionId,
                  items: [
                    {
                      product_id: product.id,
                      quantity: 1,
                      unit_price: 0,
                      notes: '🎁 PREMIO CARTILLA DE SELLOS (0,00 €)',
                    },
                  ],
                  loyalty_email: loyaltyEmail,
                }),
              })

              const data = await res.json().catch(() => ({}))
              if (res.ok && data.success) {
                if (data.order) handleOrderSubmitted(data.order)
                triggerHaptic(HAPTIC_PATTERNS.SUCCESS)
                setAddedToast(`¡${product.name} gratis marchando al mozo!`)
                setTimeout(() => setAddedToast(null), 3500)
                loadData()
              } else {
                throw new Error(data.error || 'Error al enviar pedido de premio')
              }
            }}
          />
        )}

      </div>
    </TenantProvider>
  )
}

export default function DinerMenuPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    }>
      <DinerMenuContent />
    </Suspense>
  )
}
