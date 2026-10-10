'use client'

import React, { useState, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { CheckCircle2 } from 'lucide-react'
import { TenantProvider } from '@/components/tenant/TenantProvider'
import { TenantHeader } from '@/components/tenant/TenantHeader'
import { TableSelector } from '@/components/comandero/TableSelector'
import { StaffPinAuth } from '@/components/auth/StaffPinAuth'
import { Product, CartItem, CourseType } from '@/types/database.types'
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
  const [isCartDetailsOpen, setIsCartDetailsOpen] = useState(false)

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

  // 5. Acciones y mutaciones de comandas
  const {
    validatingOrderIds,
    deliveringOrderIds,
    isSubmitting,
    orderSentToast,
    handleAttendCall,
    handleDeliverSingleOrder,
    handleMarkDelivered,
    handleValidateOrder,
    handleCancelValidationOrder,
    handleCancelSingleOrder,
    handleFireSecondCourses,
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

  // Listas de comanda reactivas
  const readyOrdersList = useMemo(() => serverOrders.filter(o => o.status === 'ready'), [serverOrders])
  const validationOrdersList = useMemo(() => serverOrders.filter(o => o.status === 'pending_validation'), [serverOrders])

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
            deliveringOrderIds={deliveringOrderIds}
            validatingOrderIds={validatingOrderIds}
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

          {/* Selector de Mesas con Semáforo */}
          <TableSelector
            tables={tables}
            selectedTable={selectedTable?.table_number || null}
            tableStatuses={tableStatuses}
            tableDwellMinutes={tableDwellMinutes}
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
              onOpenPreBill={() => setShowPreBill(true)}
              onOpenTransferModal={() => setShowTransferModal(true)}
              onOpenFreeTableModal={(tbl) => setShowFreeConfirmTable(tbl)}
              onRepeatDrinksRound={() => {
                previousDrinksInTable.forEach(d => {
                  handleAddItemToComanda(d.product, d.quantity, [], 'Repetición de ronda')
                })
                handleFireSecondCourses(selectedTable.table_number)
              }}
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
            onCustomizeProduct={setCustomizingProduct}
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
              updateCartForCurrentTable(prev => prev.filter((_, i) => i !== idx))
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
