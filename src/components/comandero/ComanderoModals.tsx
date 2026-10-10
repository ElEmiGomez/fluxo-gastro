'use client'

import React from 'react'
import { RefreshCw } from 'lucide-react'
import { Product, Table, CartItem, Restaurant, Order, CourseType } from '@/types/database.types'
import { ProductModifierModal } from '@/components/comandero/ProductModifierModal'
import { OrderSummaryBar } from '@/components/comandero/OrderSummaryBar'
import { CartDrawer } from '@/components/menu/CartDrawer'
import { ConfirmModal } from '@/components/common/ConfirmModal'
import { PreBillModal } from '@/components/comandero/PreBillModal'
import { CloseTableModal } from '@/components/comandero/CloseTableModal'
import { QuickStockModal } from '@/components/comandero/QuickStockModal'
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
  showQuickStockModal: boolean
  setShowQuickStockModal: (open: boolean) => void
  tablePax: number
  tableDiscount: number
  serverOrders: Order[]
  pendingCalls?: PendingServiceCall[]
  recentTogglesRef: React.MutableRefObject<Map<string, { status: boolean; until: number }>>
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
    paymentMethod?: 'card' | 'cash',
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
  showQuickStockModal,
  setShowQuickStockModal,
  tablePax,
  tableDiscount,
  serverOrders,
  pendingCalls = [],
  recentTogglesRef,
  onAddItemToComanda,
  onSendOrderToKitchen,
  onUpdateCartQuantity,
  onRemoveCartItem,
  onClearCurrentCart,
  onExecuteCloseAndFreeTable,
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
          onExecuteCloseAndFreeTable(tblNum, paymentMethod, finalAmount, ordersCount)
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

      {/* 6. Modal de Transferir Mesa */}
      {showTransferModal && selectedTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in select-none">
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-2 text-amber-600">
              <RefreshCw className="w-6 h-6 animate-spin" />
              <h3 className="text-base font-black text-slate-900">
                Transferir Mesa #{selectedTable.table_number}
              </h3>
            </div>
            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              Selecciona la nueva mesa a la que se mudan los comensales. Sus pedidos, carrito y cuenta se transferirán automáticamente.
            </p>
            
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Mesa de Destino:</label>
              <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1">
                {tables
                  .filter(t => t.table_number.toString() !== selectedTable.table_number.toString())
                  .map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTransferTargetTable(t.table_number.toString())}
                      className={`p-2.5 rounded-xl text-xs font-black transition-all border cursor-pointer ${
                        transferTargetTable === t.table_number.toString()
                          ? 'bg-amber-500 text-slate-950 border-amber-600 ring-2 ring-amber-400'
                          : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                      }`}
                    >
                      #{t.table_number}
                    </button>
                  ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setShowTransferModal(false)
                  setTransferTargetTable('')
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!transferTargetTable}
                onClick={() => {
                  if (transferTargetTable) {
                    onTransferTable(transferTargetTable)
                    setTransferTargetTable('')
                    setShowTransferModal(false)
                  }
                }}
                className="px-5 py-2 rounded-xl text-xs font-black bg-amber-500 hover:bg-amber-400 text-slate-950 disabled:opacity-40 disabled:cursor-not-allowed shadow-md cursor-pointer"
              >
                Confirmar Mudanza
              </button>
            </div>
          </div>
        </div>
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
    </>
  )
}
