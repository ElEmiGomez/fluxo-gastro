'use client'

import React from 'react'
import { RefreshCw } from 'lucide-react'
import { Product, Table, CartItem, Restaurant, Order, CourseType, DailyMenu } from '@/types/database.types'
import { ProductModifierModal } from '@/components/comandero/ProductModifierModal'
import { OrderSummaryBar } from '@/components/comandero/OrderSummaryBar'
import { CartDrawer } from '@/components/menu/CartDrawer'
import { ConfirmModal } from '@/components/common/ConfirmModal'
import { PreBillModal } from '@/components/comandero/PreBillModal'
import { CloseTableModal } from '@/components/comandero/CloseTableModal'
import { QuickStockModal } from '@/components/comandero/QuickStockModal'
import { TableMoveMergeSheet } from '@/components/waiter/TableMoveMergeSheet'
import { SplitBillModal } from '@/components/waiter/SplitBillModal'
import { TableStatusType } from '@/components/comandero/TableSelector'
import { DailyMenuModal, DailyMenuSelectionItem } from '@/components/menu/DailyMenuModal'
import { PromoConfiguratorModal, PromoConfiguredPayload } from '@/components/menu/PromoConfiguratorModal'
import { QuickDessertSelectorModal } from '@/components/comandero/QuickDessertSelectorModal'
import { resolveCanonicalProductId } from '@/lib/category-matcher'
import { PendingServiceCall } from '@/types/comandero.types'

interface ComanderoModalsProps {
  slug: string
  restaurant: Restaurant
  selectedTable: Table | null
  tables: Table[]
  products: Product[]
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>
  cart: CartItem[]
  isSubmitting: boolean
  customizingProduct: Product | null
  setCustomizingProduct: (p: Product | null) => void
  isCartDetailsOpen: boolean
  setIsCartDetailsOpen: (open: boolean) => void
  showPreBill: boolean
  setShowPreBill: (open: boolean) => void
  showFreeConfirmTable: number | string | null
  setShowFreeConfirmTable: (tbl: number | string | null) => void
  showTransferModal: boolean
  setShowTransferModal: (open: boolean) => void
  transferTargetTable: string
  setTransferTargetTable: (target: string) => void
  showSplitBillModal?: boolean
  setShowSplitBillModal?: (open: boolean) => void
  tableStatuses?: Record<string | number, TableStatusType>
  onExecutePartialOrFullPayment?: (params: {
    tableNumber: string | number
    paidAmountCents: number
    paymentMethod: 'card' | 'cash' | 'mixed'
    isFullyPaid: boolean
    remainingCents: number
  }) => Promise<void>
  onExecuteMoveOrMerge?: (
    sourceTableNum: string | number,
    targetTableNum: string | number,
    isMerge: boolean
  ) => Promise<void>
  showQuickStockModal: boolean
  setShowQuickStockModal: (open: boolean) => void
  tablePax: number
  tableDiscount: number
  serverOrders: Order[]
  pendingCalls?: PendingServiceCall[]
  recentTogglesRef: React.MutableRefObject<Map<string, { status: boolean; until: number }>>
  dailyMenu?: DailyMenu | null
  isDailyMenuModalOpen?: boolean
  setIsDailyMenuModalOpen?: (open: boolean) => void
  onAddDailyMenuToCart?: (payload: { title: string; price: number; selections: DailyMenuSelectionItem[] }) => void
  customizingPromoProduct?: Product | null
  setCustomizingPromoProduct?: (p: Product | null) => void
  onAddPromoToCart?: (payload: PromoConfiguredPayload) => void
  isQuickDessertModalOpen?: boolean
  setIsQuickDessertModalOpen?: (open: boolean) => void
  activeOrderWithPendingDessert?: Order | null
  onResolvePendingDessert?: (dessert: Product, note?: string) => Promise<void> | void
  onAddItemToComanda: (
    product: Product,
    quantity: number,
    selectedPills: string[],
    notes: string,
    course?: CourseType,
    isComplimentary?: boolean,
    weightGrams?: number
  ) => void
  onSendOrderToKitchen: () => void
  onUpdateCartQuantity: (idx: number, q: number) => void
  onRemoveCartItem: (idx: number) => void
  onClearCurrentCart: () => void
  onExecuteCloseAndFreeTable: (
    tblNum: number | string,
    paymentMethod?: 'card' | 'cash' | 'mixed',
    finalAmount?: number,
    ordersCount?: number
  ) => void
  onExecuteChargeTable?: (
    tblNum: number | string,
    paymentMethod?: 'card' | 'cash' | 'mixed',
    finalAmount?: number,
    ordersCount?: number
  ) => void
  onTransferTable: (toTableNum: string | number) => void
}

export function ComanderoModals({
  slug,
  restaurant,
  selectedTable,
  tables,
  products,
  setProducts,
  cart,
  isSubmitting,
  customizingProduct,
  setCustomizingProduct,
  isCartDetailsOpen,
  setIsCartDetailsOpen,
  showPreBill,
  setShowPreBill,
  showFreeConfirmTable,
  setShowFreeConfirmTable,
  showTransferModal,
  setShowTransferModal,
  transferTargetTable,
  setTransferTargetTable,
  showSplitBillModal = false,
  setShowSplitBillModal,
  tableStatuses = {},
  onExecutePartialOrFullPayment,
  onExecuteMoveOrMerge,
  showQuickStockModal,
  setShowQuickStockModal,
  tablePax,
  tableDiscount,
  serverOrders,
  pendingCalls = [],
  recentTogglesRef,
  dailyMenu,
  isDailyMenuModalOpen = false,
  setIsDailyMenuModalOpen,
  onAddDailyMenuToCart,
  customizingPromoProduct,
  setCustomizingPromoProduct,
  onAddPromoToCart,
  isQuickDessertModalOpen = false,
  setIsQuickDessertModalOpen,
  activeOrderWithPendingDessert,
  onResolvePendingDessert,
  onAddItemToComanda,
  onSendOrderToKitchen,
  onUpdateCartQuantity,
  onRemoveCartItem,
  onClearCurrentCart,
  onExecuteCloseAndFreeTable,
  onExecuteChargeTable,
  onTransferTable,
}: ComanderoModalsProps) {
  return (
    <>
      {/* 1. Modal Modificador de Plato */}
      <ProductModifierModal
        product={customizingProduct}
        onClose={() => setCustomizingProduct(null)}
        onConfirm={onAddItemToComanda}
        isStaff={true}
      />

      {/* 2. Barra Flotante de Resumen de Comanda */}
      <OrderSummaryBar
        cart={cart}
        tableNumber={selectedTable?.table_number.toString() || null}
        isSubmitting={isSubmitting}
        onSendOrder={onSendOrderToKitchen}
        onOpenCartDetails={() => setIsCartDetailsOpen(true)}
      />

      {/* 3. Cajón de Detalle de Carrito */}
      <CartDrawer
        isOpen={isCartDetailsOpen}
        onClose={() => setIsCartDetailsOpen(false)}
        cart={cart}
        isWaiter={true}
        lang="es"
        onSendWaiterOrder={onSendOrderToKitchen}
        onUpdateQuantity={onUpdateCartQuantity}
        onRemoveItem={onRemoveCartItem}
        onClearCart={onClearCurrentCart}
        tableNumber={selectedTable?.table_number.toString() || null}
        onAddSuggestedDrink={(drinkId) => {
          const drink = products.find(p => p.id === drinkId)
          if (drink) {
            onAddItemToComanda(drink, 1, [], '')
          }
        }}
        onAddSuggestedDessert={(dessertId) => {
          const dessert = products.find(p => p.id === dessertId)
          if (dessert) {
            onAddItemToComanda(dessert, 1, [], '')
          }
        }}
      />

      {/* 4. Modal de Cobro y Cierre Inteligente de Mesa (Smart Default & 1-Tap) */}
      <CloseTableModal
        isOpen={Boolean(showFreeConfirmTable)}
        onClose={() => setShowFreeConfirmTable(null)}
        tableNumber={showFreeConfirmTable}
        pendingCalls={pendingCalls}
        serverOrders={serverOrders}
        discountPercentage={tableDiscount}
        onConfirm={(tblNum, paymentMethod, finalAmount, ordersCount) => {
          if (finalAmount === 0) {
            onExecuteCloseAndFreeTable(tblNum, paymentMethod, finalAmount, ordersCount)
          } else if (onExecuteChargeTable) {
            onExecuteChargeTable(tblNum, paymentMethod, finalAmount, ordersCount)
          } else {
            onExecuteCloseAndFreeTable(tblNum, paymentMethod, finalAmount, ordersCount)
          }
          setShowFreeConfirmTable(null)
        }}
      />

      {/* 5. Modal de Pre-Cuenta Digital */}
      {selectedTable && (
        <PreBillModal
          isOpen={showPreBill}
          onClose={() => setShowPreBill(false)}
          restaurant={restaurant}
          tableNumber={selectedTable.table_number}
          paxCount={tablePax}
          discountPercentage={tableDiscount}
          orders={serverOrders.filter(
            o => (o.table_number?.toString() === selectedTable.table_number.toString() || o.table?.table_number?.toString() === selectedTable.table_number.toString()) &&
                 ['pending', 'confirmed', 'preparing', 'ready', 'delivered'].includes(o.status)
          )}
          onProceedToCharge={() => {
            setShowFreeConfirmTable(selectedTable.table_number)
          }}
        />
      )}

      {/* 6. Mover o Unir Mesa en 2 Toques */}
      <TableMoveMergeSheet
        isOpen={showTransferModal}
        onClose={() => {
          setShowTransferModal(false)
          setTransferTargetTable('')
        }}
        sourceTable={selectedTable}
        tables={tables}
        tableStatuses={tableStatuses}
        serverOrders={serverOrders}
        onExecuteMoveOrMerge={async (fromTbl, toTbl, isMerge) => {
          if (onExecuteMoveOrMerge) {
            await onExecuteMoveOrMerge(fromTbl, toTbl, isMerge)
          } else {
            onTransferTable(toTbl)
          }
        }}
      />

      {/* 6.1 Modal Dividir Cuenta y Auto-Liberación */}
      {selectedTable && showSplitBillModal && setShowSplitBillModal && onExecutePartialOrFullPayment && (
        <SplitBillModal
          isOpen={showSplitBillModal}
          onClose={() => setShowSplitBillModal(false)}
          tableNumber={selectedTable.table_number}
          serverOrders={serverOrders}
          discountPercentage={tableDiscount}
          onExecutePartialOrFullPayment={onExecutePartialOrFullPayment}
        />
      )}

      {/* 7. Modal Control Rápido de Stock ("Se Agotó") */}
      <QuickStockModal
        isOpen={showQuickStockModal}
        onClose={() => setShowQuickStockModal(false)}
        slug={slug}
        onStockChanged={(changedId, changedAvail) => {
          if (changedId && changedAvail !== undefined) {
            const canonical = resolveCanonicalProductId(changedId) || changedId
            recentTogglesRef.current.set(changedId, { status: changedAvail, until: Date.now() + 3500 })
            if (canonical) recentTogglesRef.current.set(canonical, { status: changedAvail, until: Date.now() + 3500 })
            setProducts(prev => prev.map(p => {
              const pCanon = resolveCanonicalProductId(p.id) || p.id
              if (p.id === changedId || p.id === canonical || pCanon === canonical) {
                return { ...p, is_available: changedAvail }
              }
              return p
            }))
          }
        }}
      />

      {/* 8. Modal de Configuración Guiada de Menú del Día */}
      {dailyMenu && isDailyMenuModalOpen && setIsDailyMenuModalOpen && onAddDailyMenuToCart && (
        <DailyMenuModal
          isOpen={isDailyMenuModalOpen}
          onClose={() => setIsDailyMenuModalOpen(false)}
          dailyMenu={dailyMenu}
          onAddMenuToCart={onAddDailyMenuToCart}
        />
      )}

      {/* 9. Modal de Configuración Guiada de Promos/Combos (Explosión de Platos) */}
      {customizingPromoProduct && setCustomizingPromoProduct && onAddPromoToCart && (
        <PromoConfiguratorModal
          isOpen={Boolean(customizingPromoProduct)}
          onClose={() => setCustomizingPromoProduct(null)}
          product={customizingPromoProduct}
          catalogProducts={products}
          onAddPromoToCart={onAddPromoToCart}
        />
      )}

      {/* 10. Modal Rápido de Elección de Postre Comodín */}
      {selectedTable && isQuickDessertModalOpen && setIsQuickDessertModalOpen && onResolvePendingDessert && (
        <QuickDessertSelectorModal
          isOpen={isQuickDessertModalOpen}
          onClose={() => setIsQuickDessertModalOpen(false)}
          tableNumber={selectedTable.table_number}
          availableDesserts={products.filter(p => {
            const cat = (p.category_id || '').toLowerCase()
            const n = (p.name || '').toLowerCase()
            return cat.includes('postre') || cat.includes('cafe') || n.includes('postre') || n.includes('tarta') || n.includes('helado') || n.includes('café') || n.includes('cafe')
          })}
          onConfirmDessert={onResolvePendingDessert}
        />
      )}
    </>
  )
}
