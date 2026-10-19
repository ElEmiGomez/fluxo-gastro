'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { CheckCircle2 } from 'lucide-react'
import { areOrderDrinksPending, areOrderDessertsPendingWaiter, orderHasPendingChoiceDesserts, isOrderReadyToPick, isDrinkItem, TAG_DRINK_SERVED } from '@/lib/course-utils'
import { TenantProvider } from '@/components/tenant/TenantProvider'
import { TenantHeader } from '@/components/tenant/TenantHeader'
import { TableSelector } from '@/components/comandero/TableSelector'
import { StaffPinAuth } from '@/components/auth/StaffPinAuth'
import { Product, CartItem, CourseType, DailyMenu } from '@/types/database.types'
import { DailyMenuSelectionItem } from '@/components/menu/DailyMenuModal'
import { PromoConfiguredPayload } from '@/components/menu/PromoConfiguratorModal'
import { useComanderoData } from '@/hooks/comandero/useComanderoData'
import { useComanderoActions } from '@/hooks/comandero/useComanderoActions'
import { ComanderoTaskQueue } from '@/components/comandero/ComanderoTaskQueue'
import { ComanderoTableDetailPanel } from '@/components/comandero/ComanderoTableDetailPanel'
import { ComanderoCatalogGrid } from '@/components/comandero/ComanderoCatalogGrid'
import { ComanderoModals } from '@/components/comandero/ComanderoModals'

export default function WaiterComanderoPage() {
  const params = useParams()
  const slug = (params?.slug as string) || 'burger-gourmet'

  // 1. Estado y sincronización en tiempo real (SSOT)
  const {
    restaurant,
    categories,
    products,
    setProducts,
    tables,
    selectedTable,
    setSelectedTable,
    serverOrders,
    setServerOrders,
    tableStatuses,
    setTableStatuses,
    tableDwellMinutes,
    pendingCalls,
    setPendingCalls,
    readyOrderAlert,
    setReadyOrderAlert,
    dismissedReadyBannerOrderIds,
    setDismissedReadyBannerOrderIds,
    syncServerData,
    attendedCallIdsRef,
    seenCallIdsRef,
    attendedValidationOrderIdsRef,
    recentTogglesRef,
  } = useComanderoData(slug)

  // 2. Carritos y configuración aislada por mesa
  const [tableCarts, setTableCarts] = useState<Record<string | number, CartItem[]>>({})
  const [tablePax, setTablePax] = useState<Record<string | number, number>>({})
  const [tableDiscounts, setTableDiscounts] = useState<Record<string | number, number>>({})
  
  // 3. Modales y vistas secundarias
  const [showPreBill, setShowPreBill] = useState(false)
  const [showFreeConfirmTable, setShowFreeConfirmTable] = useState<number | string | null>(null)
  const [showTransferModal, setShowTransferModal] = useState(false)
  const [transferTargetTable, setTransferTargetTable] = useState('')
  const [showQuickStockModal, setShowQuickStockModal] = useState(false)
  const [customizingProduct, setCustomizingProduct] = useState<Product | null>(null)
  const [customizingPromoProduct, setCustomizingPromoProduct] = useState<Product | null>(null)
  const [isDailyMenuModalOpen, setIsDailyMenuModalOpen] = useState(false)
  const [isQuickDessertModalOpen, setIsQuickDessertModalOpen] = useState(false)
  const [isCartDetailsOpen, setIsCartDetailsOpen] = useState(false)
  const [dailyMenu, setDailyMenu] = useState<DailyMenu | null>(null)

  // Carga del Menú del Día Dinámico
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
        console.warn('[ComanderoPage] Error fetching daily menu:', err)
      }
    }
    fetchDailyMenu()
    return () => { isMounted = false }
  }, [slug])

  // 4. Filtros de catálogo
  const [selectedCategory, setSelectedCategory] = useState<string>(() => categories[0]?.id || 'cat-1')
  const [searchQuery, setSearchQuery] = useState('')

  const currentTableNum = selectedTable?.table_number || 1
  const cart = tableCarts[currentTableNum] || []

  // Helper para mutar el carrito de la mesa activa
  const updateCartForCurrentTable = (updater: (prev: CartItem[]) => CartItem[]) => {
    setTableCarts(prev => ({
      ...prev,
      [currentTableNum]: updater(prev[currentTableNum] || []),
    }))
  }

  // Identificar si la mesa seleccionada tiene una orden con comodín de postre pendiente
  const activeOrderWithPendingDessert = useMemo(() => {
    if (!selectedTable) return null
    return serverOrders.find(
      o => (o.table_number?.toString() === selectedTable.table_number.toString() || o.table?.table_number?.toString() === selectedTable.table_number.toString()) &&
           orderHasPendingChoiceDesserts(o)
    ) || null
  }, [selectedTable, serverOrders])

  // Desglose de Menú del Día para el Comandero
  const handleAddDailyMenuToCart = (menuPayload: {
    title: string
    price: number
    selections: DailyMenuSelectionItem[]
  }) => {
    const tableCart = tableCarts[currentTableNum] || []
    const existingMenuCount = tableCart.filter(it => it.is_pack_header && it.pack_tag?.startsWith('Menú del Día')).length
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
        image_url: null,
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

    updateCartForCurrentTable(prev => [...prev, headerItem, ...subItems])
    setIsDailyMenuModalOpen(false)
  }

  // Desglose de Promo/Combo para el Comandero
  const handleAddPromoToCart = (payload: PromoConfiguredPayload) => {
    const tableCart = tableCarts[currentTableNum] || []
    const existingPromoCount = tableCart.filter(it => it.is_pack_header && it.product.id === payload.promoProduct.id).length
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

    updateCartForCurrentTable(prev => [...prev, headerItem, ...subItems])
    setCustomizingPromoProduct(null)
  }

  // Resolver postre comodín en la orden de la mesa
  const handleResolvePendingDessert = async (dessert: Product, note?: string) => {
    if (!activeOrderWithPendingDessert) return
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
          actor_type: 'waiter',
        }),
      })
      if (res.ok) {
        setIsQuickDessertModalOpen(false)
        await syncServerData()
      }
    } catch (err) {
      console.error('Error resolving pending dessert:', err)
    }
  }

  // 5. Acciones y mutaciones de comandas
  const {
    validatingOrderIds,
    deliveringOrderIds,
    isSubmitting,
    orderSentToast,
    handleAttendCall,
    handleDeliverSingleOrder,
    handleDeliverStarters,
    handleFireMains,
    handleDeliverMains,
    handleDeliverDesserts,
    handleMarkDelivered,
    handleValidateOrder,
    handleCancelValidationOrder,
    handleCancelSingleOrder,
    handleFireSecondCourses,
    handleFireOrderDesserts,
    handleDeliverOrderDessertsDirect,
    handleFireDesserts,
    handleDeliverTableDessertsDirect,
    executeCloseAndFreeTable,
    handleTransferTable,
    handleSendOrderToKitchen,
  } = useComanderoActions({
    slug,
    restaurant,
    serverOrders,
    setServerOrders,
    pendingCalls,
    setPendingCalls,
    setTableCarts,
    setTablePax,
    setTableStatuses,
    setSelectedTable,
    tables,
    syncServerData,
    attendedCallIdsRef,
    seenCallIdsRef,
    attendedValidationOrderIdsRef,
    readyOrderAlert,
    setReadyOrderAlert,
  })

  // Añadir ítem configurado al carrito de la mesa
  const handleAddItemToComanda = (
    product: Product,
    quantity: number,
    selectedPills: string[],
    notes: string,
    course?: CourseType,
    isComplimentary?: boolean,
    weightGrams?: number
  ) => {
    updateCartForCurrentTable(prev => [
      ...prev,
      { product, quantity, selectedPills, notes, course, isComplimentary, weightGrams },
    ])
  }

  // Bebidas previamente pedidas en la mesa para repetición rápida
  const previousDrinksInTable = useMemo(() => {
    if (!selectedTable) return []
    const currentTableStatus = tableStatuses[selectedTable.table_number] || 'free'
    if (currentTableStatus === 'free') return []

    const tableOrders = serverOrders.filter(
      o => (o.table_number?.toString() === selectedTable.table_number.toString() || o.table?.table_number?.toString() === selectedTable.table_number.toString()) &&
           o.status !== 'paid' && o.status !== 'cancelled'
    )
    if (tableOrders.length === 0) return []

    const drinksMap: Record<string, { product: Product; quantity: number }> = {}
    tableOrders.forEach(ord => {
      (ord.order_items || []).forEach(item => {
        const p = item.product || products.find(prod => prod.id === item.product_id)
        if (p) {
          const catId = (p.category_id || '').toLowerCase()
          const name = (p.name || '').toLowerCase()
          const isDrink = catId.includes('bebida') || catId.includes('trago') || catId === 'cat-12' || catId === 'cat-13' || catId === 'cat-14' || catId === 'cat-15' || name.includes('cerveza') || name.includes('vino') || name.includes('gaseosa') || name.includes('agua') || name.includes('limonada') || name.includes('ipa') || name.includes('pinta')
          if (isDrink) {
            if (drinksMap[p.id]) {
              drinksMap[p.id].quantity += item.quantity || 1
            } else {
              drinksMap[p.id] = { product: p, quantity: item.quantity || 1 }
            }
          }
        }
      })
    })
    return Object.values(drinksMap)
  }, [selectedTable, serverOrders, products, tableStatuses])

  const [servingDrinkOrderIds, setServingDrinkOrderIds] = useState<Set<string>>(new Set())

  // Listas de comanda reactivas
  const readyOrdersList = useMemo(() => serverOrders.filter(isOrderReadyToPick), [serverOrders])
  const validationOrdersList = useMemo(() => serverOrders.filter(o => o.status === 'pending_validation'), [serverOrders])
  const pendingDrinksList = useMemo(() => serverOrders.filter(areOrderDrinksPending), [serverOrders])
  const pendingDessertsList = useMemo(() => serverOrders.filter(areOrderDessertsPendingWaiter), [serverOrders])

  const handleServeDrinks = useCallback(async (orderId: string) => {
    setServingDrinkOrderIds(prev => new Set(prev).add(orderId))

    // Actualización inmediata en estado local para feedback visual instantáneo
    setServerOrders(prev =>
      prev.map(o => {
        if (o.id !== orderId) return o
        const updatedItems = (o.order_items || []).map(it => {
          if (isDrinkItem(it)) {
            const currentNotes = it.notes || ''
            if (!currentNotes.includes(TAG_DRINK_SERVED)) {
              return {
                ...it,
                notes: currentNotes ? `${currentNotes} ${TAG_DRINK_SERVED}` : TAG_DRINK_SERVED,
              }
            }
          }
          return it
        })
        return { ...o, order_items: updatedItems }
      })
    )

    try {
      const res = await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          orderId,
          action: 'serve_drinks',
        }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.order) {
          setServerOrders(prev => prev.map(o => o.id === orderId ? data.order : o))
        }
        await syncServerData()
      } else {
        await syncServerData()
      }
    } catch (err) {
      console.error('Error serving drinks:', err)
      await syncServerData()
    } finally {
      setServingDrinkOrderIds(prev => {
        const next = new Set(prev)
        next.delete(orderId)
        return next
      })
    }
  }, [slug, setServerOrders, syncServerData])

  const handleServeAllDrinks = useCallback(async () => {
    if (pendingDrinksList.length === 0) return
    await Promise.all(pendingDrinksList.map(ord => handleServeDrinks(ord.id)))
  }, [pendingDrinksList, handleServeDrinks])

  return (
    <StaffPinAuth role="comandero" restaurantSlug={slug}>
      <TenantProvider restaurant={restaurant} initialTable={selectedTable?.table_number.toString() || null}>
        <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col pb-28 select-none" style={{ touchAction: 'manipulation' }}>
          
          <TenantHeader viewType="comandero" tableNumber={selectedTable?.table_number.toString()} />

          {/* 1. Centro de Tareas y Avisos Pendientes */}
          <ComanderoTaskQueue
            readyOrdersList={readyOrdersList}
            validationOrdersList={validationOrdersList}
            pendingCalls={pendingCalls}
            pendingDrinksList={pendingDrinksList}
            pendingDessertsList={pendingDessertsList}
            deliveringOrderIds={deliveringOrderIds}
            validatingOrderIds={validatingOrderIds}
            servingDrinkOrderIds={servingDrinkOrderIds}
            dismissedReadyBannerOrderIds={dismissedReadyBannerOrderIds}
            tables={tables}
            onDeliverSingleOrder={handleDeliverSingleOrder}
            onDeliverAllReady={() => {
              readyOrdersList.forEach(ord => {
                const tblNum = ord.table_number || ord.table?.table_number
                handleDeliverSingleOrder(ord.id, tblNum)
              })
            }}
            onAttendCall={handleAttendCall}
            onAttendAllCalls={() => pendingCalls.forEach(c => handleAttendCall(c.id))}
            onValidateOrder={handleValidateOrder}
            onCancelValidationOrder={handleCancelValidationOrder}
            onSelectTable={setSelectedTable}
            onDismissReadyBanner={(ordId) => setDismissedReadyBannerOrderIds(prev => new Set(prev).add(ordId))}
            onOpenFreeTableModal={(tbl) => setShowFreeConfirmTable(tbl)}
            onServeDrinks={handleServeDrinks}
            onServeAllDrinks={handleServeAllDrinks}
            onFireOrderDesserts={handleFireOrderDesserts}
            onDeliverOrderDessertsDirect={handleDeliverOrderDessertsDirect}
            onOpenDessertSelectorForTable={(tblNum) => {
              const target = tables.find(t => t.table_number.toString() === tblNum.toString())
              if (target) setSelectedTable(target)
              setIsQuickDessertModalOpen(true)
            }}
            onDeliverStarters={handleDeliverStarters}
            onDeliverMains={handleDeliverMains}
          />

          {/* Toast de confirmación de envío */}
          {orderSentToast && (
            <div className="fixed top-16 inset-x-4 z-50 max-w-md mx-auto p-4 rounded-2xl bg-blue-900 text-white font-black shadow-2xl flex items-center justify-between animate-in slide-in-from-top duration-300 border border-blue-800">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-7 h-7 text-blue-300 stroke-[2.5]" />
                <div>
                  <div className="text-sm font-black uppercase">¡Comanda Enviada a Cocina!</div>
                  <div className="text-xs text-blue-200">Mesa #{selectedTable?.table_number} en preparación</div>
                </div>
              </div>
            </div>
          )}

          {/* Selector de Mesas con Semáforo y Cubitos Gastronómicos */}
          <TableSelector
            tables={tables}
            selectedTable={selectedTable?.table_number || null}
            tableStatuses={tableStatuses}
            tableDwellMinutes={tableDwellMinutes}
            serverOrders={serverOrders}
            pendingCalls={pendingCalls}
            onSelectTable={setSelectedTable}
            onOpenQuickStock={() => setShowQuickStockModal(true)}
            pausedItemsCount={products.filter(p => p.is_available === false).length}
          />

          {/* Panel Detallado de la Mesa Seleccionada */}
          {selectedTable && (
            <ComanderoTableDetailPanel
              selectedTable={selectedTable}
              pendingCalls={pendingCalls}
              serverOrders={serverOrders}
              deliveringOrderIds={deliveringOrderIds}
              validatingOrderIds={validatingOrderIds}
              tablePax={tablePax[selectedTable.table_number] || 2}
              onSetTablePax={(pax) => setTablePax(prev => ({ ...prev, [selectedTable.table_number]: pax }))}
              tableDiscount={tableDiscounts[selectedTable.table_number] || 0}
              onSetTableDiscount={(pct) => setTableDiscounts(prev => ({ ...prev, [selectedTable.table_number]: pct }))}
              previousDrinks={previousDrinksInTable}
              onAttendCall={handleAttendCall}
              onDeliverSingleOrder={handleDeliverSingleOrder}
              onMarkDelivered={handleMarkDelivered}
              onCancelSingleOrder={handleCancelSingleOrder}
              onValidateOrder={handleValidateOrder}
              onCancelValidationOrder={handleCancelValidationOrder}
              onFireSecondCourses={handleFireSecondCourses}
              onFireDesserts={handleFireDesserts}
              onDeliverDessertsDirect={handleDeliverTableDessertsDirect}
              onOpenDessertSelector={() => setIsQuickDessertModalOpen(true)}
              onOpenPreBill={() => setShowPreBill(true)}
              onOpenTransferModal={() => setShowTransferModal(true)}
              onOpenFreeTableModal={(tbl) => setShowFreeConfirmTable(tbl)}
              onExecuteFreeTableDirect={(tblNum) => executeCloseAndFreeTable(tblNum, 'cash', 0, 0)}
              onRepeatDrinksRound={() => {
                previousDrinksInTable.forEach(d => {
                  handleAddItemToComanda(d.product, d.quantity, [], 'Repetición de ronda')
                })
                handleFireSecondCourses(selectedTable.table_number)
              }}
              servingDrinkOrderIds={servingDrinkOrderIds}
              onServeDrinks={handleServeDrinks}
              onDeliverStarters={handleDeliverStarters}
              onFireMains={handleFireMains}
              onDeliverMains={handleDeliverMains}
              onDeliverDesserts={handleDeliverDesserts}
            />
          )}

          {/* Catálogo de Productos y Selector de Categorías */}
          <ComanderoCatalogGrid
            slug={slug}
            categories={categories}
            products={products}
            setProducts={setProducts}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            recentTogglesRef={recentTogglesRef}
            onCustomizeProduct={(prod) => {
              const cat = categories.find(c => c.id === prod.category_id)
              const catName = (cat?.name || '').toUpperCase()
              const prodName = (prod.name || '').toUpperCase()
              const isPromo = catName.includes('PROMO') || catName.includes('COMBO') || prodName.includes('COMBO') || prodName.includes('PROMO')
              if (isPromo) {
                setCustomizingPromoProduct(prod)
              } else {
                setCustomizingProduct(prod)
              }
            }}
            dailyMenu={dailyMenu}
            onOpenDailyMenu={() => setIsDailyMenuModalOpen(true)}
          />

          {/* Modales y Paneles Desplegables */}
          <ComanderoModals
            slug={slug}
            restaurant={restaurant}
            selectedTable={selectedTable}
            tables={tables}
            products={products}
            setProducts={setProducts}
            cart={cart}
            isSubmitting={isSubmitting}
            customizingProduct={customizingProduct}
            setCustomizingProduct={setCustomizingProduct}
            isCartDetailsOpen={isCartDetailsOpen}
            setIsCartDetailsOpen={setIsCartDetailsOpen}
            showPreBill={showPreBill}
            setShowPreBill={setShowPreBill}
            showFreeConfirmTable={showFreeConfirmTable}
            setShowFreeConfirmTable={setShowFreeConfirmTable}
            showTransferModal={showTransferModal}
            setShowTransferModal={setShowTransferModal}
            transferTargetTable={transferTargetTable}
            setTransferTargetTable={setTransferTargetTable}
            showQuickStockModal={showQuickStockModal}
            setShowQuickStockModal={setShowQuickStockModal}
            tablePax={tablePax[currentTableNum] || 2}
            tableDiscount={tableDiscounts[currentTableNum] || 0}
            serverOrders={serverOrders}
            pendingCalls={pendingCalls}
            recentTogglesRef={recentTogglesRef}
            dailyMenu={dailyMenu}
            isDailyMenuModalOpen={isDailyMenuModalOpen}
            setIsDailyMenuModalOpen={setIsDailyMenuModalOpen}
            onAddDailyMenuToCart={handleAddDailyMenuToCart}
            customizingPromoProduct={customizingPromoProduct}
            setCustomizingPromoProduct={setCustomizingPromoProduct}
            onAddPromoToCart={handleAddPromoToCart}
            isQuickDessertModalOpen={isQuickDessertModalOpen}
            setIsQuickDessertModalOpen={setIsQuickDessertModalOpen}
            activeOrderWithPendingDessert={activeOrderWithPendingDessert}
            onResolvePendingDessert={handleResolvePendingDessert}
            onAddItemToComanda={handleAddItemToComanda}
            onSendOrderToKitchen={() => handleSendOrderToKitchen(selectedTable, cart, tableDiscounts[currentTableNum] || 0)}
            onUpdateCartQuantity={(idx, q) => {
              updateCartForCurrentTable(prev => {
                if (q <= 0) return prev.filter((_, i) => i !== idx)
                const copy = [...prev]
                copy[idx].quantity = q
                return copy
              })
            }}
            onRemoveCartItem={(idx) => {
              updateCartForCurrentTable(prev => {
                const target = prev[idx]
                if (target?.pack_id) {
                  return prev.filter(item => item.pack_id !== target.pack_id)
                }
                return prev.filter((_, i) => i !== idx)
              })
            }}
            onClearCurrentCart={() => {
              setTableCarts(prev => ({ ...prev, [currentTableNum]: [] }))
            }}
            onExecuteCloseAndFreeTable={executeCloseAndFreeTable}
            onTransferTable={(target) => {
              if (selectedTable) {
                handleTransferTable(selectedTable.table_number, target)
              }
            }}
          />

        </div>
      </TenantProvider>
    </StaffPinAuth>
  )
}
