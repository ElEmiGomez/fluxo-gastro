'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useParams, useSearchParams, usePathname } from 'next/navigation'
import { Check, Loader2 } from 'lucide-react'
import { CartItem, Product, DailyMenu } from '@/types/database.types'
import { TenantProvider } from '@/components/tenant/TenantProvider'
import { MicroOnboardingBanner } from '@/components/menu/MicroOnboardingBanner'
import { MenuHeader } from '@/components/menu/MenuHeader'
import { MenuLiveTracker } from '@/components/menu/MenuLiveTracker'
import { MenuCategoryBar } from '@/components/menu/MenuCategoryBar'
import { DailyMenuCard } from '@/components/menu/DailyMenuCard'
import { DailyMenuModal, DailyMenuSelectionItem } from '@/components/menu/DailyMenuModal'
import { isDailyMenuActive } from '@/lib/daily-menu-utils'
import { MenuListCatalog } from '@/components/menu/MenuListCatalog'
import { MenuGridCatalog } from '@/components/menu/MenuGridCatalog'
import { MenuFloatingCartBar } from '@/components/menu/MenuFloatingCartBar'
import { MenuFooterLegal } from '@/components/menu/MenuFooterLegal'
import { MenuModals } from '@/components/menu/MenuModals'
import { useMenuCatalog } from '@/hooks/menu/useMenuCatalog'
import { useTableSession } from '@/hooks/menu/useTableSession'
import { useMenuOrderSync } from '@/hooks/menu/useMenuOrderSync'
import { useInSituAdmin } from '@/hooks/menu/useInSituAdmin'
import { triggerHaptic, HAPTIC_PATTERNS } from '@/lib/haptic'
import { getTranslation, translateProductName } from '@/lib/i18n'

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

  // 3. Catálogo de productos y filtros
  // Inicializamos temporalmente el hook in-situ placeholder
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
    expandedProductIds,
    toggleExpand,
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
    setIsPaidBannerDismissed,
    setIsReviewBoosterDismissed,
    setHasRequestedBill,
    hasRequestedBillRef,
    userRequestedBillTimeRef,
    setPendingServiceCalls,
    setProducts,
    loadData,
    setCart,
    handleTableMarkedPaid,
  })

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

  // Obtener cantidad de producto básico en el carrito
  const getProductQuantityInCart = (productId: string): number => {
    const match = cart.find(
      item => item.product?.id === productId && (!item.selectedPills || item.selectedPills.length === 0) && (!item.notes || item.notes === '')
    )
    return match ? match.quantity : 0
  }

  // Modificar cantidad inline (+ / -) con haptic feedback
  const handleUpdateProductQuantity = (product: Product, delta: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    if (isInSituAdmin) return

    triggerHaptic(delta > 0 ? HAPTIC_PATTERNS.QUANTITY : HAPTIC_PATTERNS.TAP)

    setCart(prev => {
      const existingIdx = prev.findIndex(
        item => item.product?.id === product.id && (!item.selectedPills || item.selectedPills.length === 0) && (!item.notes || item.notes === '')
      )

      if (existingIdx >= 0) {
        const nextQty = prev[existingIdx].quantity + delta
        if (nextQty <= 0) {
          return prev.filter((_, idx) => idx !== existingIdx)
        }
        const copy = [...prev]
        copy[existingIdx].quantity = nextQty
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
  const handleAddCustomized = (product: Product, quantity: number, selectedPills: string[], notes: string) => {
    triggerHaptic(HAPTIC_PATTERNS.ADD_CART)
    setCart(prev => {
      const existingIdx = prev.findIndex(
        item => item.product.id === product.id && 
          (item.notes || '').trim() === (notes || '').trim() && 
          JSON.stringify([...(item.selectedPills || [])].sort()) === JSON.stringify([...(selectedPills || [])].sort())
      )

      if (existingIdx >= 0) {
        const copy = [...prev]
        copy[existingIdx].quantity += quantity
        return copy
      }

      return [...prev, { product, quantity, selectedPills, notes }]
    })

    setAddedToast(translateProductName(currentLang, product.id, product.name))
    setTimeout(() => setAddedToast(null), 2500)
  }

  // Agregar Menú del Día configurado de 4 pasos
  const handleAddDailyMenuToCart = (menuPayload: {
    title: string
    price: number
    selections: DailyMenuSelectionItem[]
  }) => {
    triggerHaptic(HAPTIC_PATTERNS.ADD_CART)
    const notesParts = menuPayload.selections.map(s => {
      const coursePrefix = s.course === 'first' ? '1º' : s.course === 'second' ? '2º' : s.course === 'dessert' ? 'Postre' : 'Bebida'
      return `${coursePrefix}: ${s.product.name}${s.notes ? ` (${s.notes})` : ''}`
    })
    const compiledNotes = notesParts.join(' · ')

    const menuCartItem: CartItem = {
      product: {
        id: `daily-menu-${dailyMenu?.id || 'standard'}`,
        restaurant_id: restaurant?.id || '',
        category_id: 'cat-menu-del-dia',
        name: menuPayload.title,
        description: 'Menú del Día (1º, 2º, Postre/Café, Bebida)',
        price: menuPayload.price,
        image_url: null,
        model_3d_url: null,
        is_available: true,
      },
      quantity: 1,
      selectedPills: [],
      notes: compiledNotes,
    }

    setCart(prev => [...prev, menuCartItem])
    setAddedToast(menuPayload.title)
    setTimeout(() => setAddedToast(null), 2500)
  }

  const totalCartCount = cart.reduce((sum, item) => sum + (Number(item?.quantity) || 1), 0)
  const totalCartAmount = cart.reduce((sum, item) => sum + (Number(item?.product?.price) || 0) * (Number(item?.quantity) || 1), 0)
  const t = (key: string) => getTranslation(currentLang, key)

  return (
    <TenantProvider restaurant={restaurant} initialTable={tableNumber}>
      <div className="min-h-screen bg-slate-50 text-slate-900 pb-36 font-sans antialiased selection:bg-blue-100 selection:text-blue-900" style={{ touchAction: 'manipulation' }}>
        
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
          hasRequestedBill={hasRequestedBill}
          tableOrderStatus={tableOrderStatus}
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
            const dessertCat = categories.find(c => {
              const n = (c.name || '').toUpperCase()
              return n.includes('POSTRE') || n.includes('CAFÉ') || n.includes('CAFE') || n.includes('DULCE') || n.includes('SOBREMESA')
            }) || categories[0]
            if (dessertCat) setSelectedCategory(dessertCat.id)
            const catEl = document.getElementById('menu-category-tabs') || document.getElementById('menu-catalog')
            if (catEl) catEl.scrollIntoView({ behavior: 'smooth', block: 'start' })
            triggerHaptic(HAPTIC_PATTERNS.TAP)
          }}
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

          {/* Menú del Día Dinámico (Visible sólo si está activo y en horario, con prioridad absoluta) */}
          {hasActiveDailyMenu && dailyMenu && !isFixedMenu && (
            <div className="pt-0.5 animate-in fade-in duration-300">
              <DailyMenuCard
                dailyMenu={dailyMenu}
                onOpenModal={() => setIsDailyMenuModalOpen(true)}
              />
            </div>
          )}

          {/* Listado de Platos: Vista Lista vs Vista Galería */}
          {viewMode === 'list' ? (
            <MenuListCatalog
              products={products}
              filteredProducts={filteredProducts}
              currentLang={currentLang}
              isFixedMenu={isFixedMenu}
              isInSituAdmin={isInSituAdmin}
              totalCartCount={totalCartCount}
              expandedProductIds={expandedProductIds}
              onToggleExpand={toggleExpand}
              getProductQuantity={getProductQuantityInCart}
              onUpdateQuantity={handleUpdateProductQuantity}
              onToggleAvailability={handleToggleAvailability}
              onOpenEditModal={handleOpenEditProductModal}
              onOpenAddProductModal={() => handleOpenAddProductModal(selectedCategory !== 'all' ? selectedCategory : undefined)}
              onCustomizeProduct={(prod) => setCustomizingProduct(prod)}
              searchQuery={searchQuery}
            />
          ) : (
            <MenuGridCatalog
              filteredProducts={filteredProducts}
              currentLang={currentLang}
              isFixedMenu={isFixedMenu}
              isInSituAdmin={isInSituAdmin}
              getProductQuantity={getProductQuantityInCart}
              onUpdateQuantity={handleUpdateProductQuantity}
              onToggleAvailability={handleToggleAvailability}
              onOpenEditModal={handleOpenEditProductModal}
              onCustomizeProduct={(prod) => setCustomizingProduct(prod)}
            />
          )}

          {/* Footer Legal Informativo */}
          <MenuFooterLegal
            currentLang={currentLang}
            isInSituAdmin={isInSituAdmin}
            onOpenLegalModal={() => setShowLegalModal(true)}
            onOpenAdminAuthModal={() => setShowAdminAuthModal(true)}
            onExitAdminMode={handleExitAdminMode}
          />
        </main>

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
          onAdminAuthSuccess={handleAdminAuthSuccess}
          onSaveInSituProduct={handleSaveInSituProduct}
          onDeleteInSituProduct={handleDeleteInSituProduct}
          onOrderSubmitted={(newOrder) => {
            if (newOrder) {
              setIsTablePaid(false)
              setIsPaidBannerDismissed(false)
              setIsReviewBoosterDismissed(false)
              setHasRequestedBill(false)
              hasRequestedBillRef.current = false
              userRequestedBillTimeRef.current = null
              if (typeof window !== 'undefined') {
                try {
                  sessionStorage.removeItem(`fluxo_table_paid_${slug}_${tableNumber}`)
                  sessionStorage.removeItem(`fluxo_bill_requested_${slug}_${tableNumber}`)
                  sessionStorage.removeItem(`fluxo_paid_banner_dismissed_${slug}_${tableNumber}`)
                } catch {}
              }
              prevTableOrdersMapRef.current.set(newOrder.id, newOrder)
              setTableOrderStatus(newOrder.status || 'pending_validation')
              if (newOrder.total_amount) {
                setTableTotalAmount(prev => Math.max(prev, Number(newOrder.total_amount) || 0))
              }
            }
          }}
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
          onRemoveCartItem={(index) => setCart(prev => prev.filter((_, idx) => idx !== index))}
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
