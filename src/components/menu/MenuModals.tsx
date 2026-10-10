'use client'

import React from 'react'
import { Bell, X, Check, Sparkles } from 'lucide-react'
import { Product, Category, Restaurant, CartItem, Order, OrderStatus } from '@/types/database.types'
import { ProductModifierModal } from '@/components/comandero/ProductModifierModal'
import { Product3DModal } from '@/components/menu/Product3DModal'
import { CartDrawer } from '@/components/menu/CartDrawer'
import { OrderTimelineModal } from '@/components/menu/OrderTimelineModal'
import { BillModal } from '@/components/menu/BillModal'
import { LegalModal } from '@/components/legal/LegalModal'
import { InSituAdminAuthModal } from '@/components/menu/InSituAdminAuthModal'
import { InSituEditProductModal } from '@/components/menu/InSituEditProductModal'
import { RestaurantJsonLd } from '@/components/seo/RestaurantJsonLd'
import { getTranslation } from '@/lib/i18n'

interface MenuModalsProps {
  slug: string
  tableNumber: string
  restaurant: Restaurant
  categories: Category[]
  products: Product[]
  cart: CartItem[]
  currentLang: string
  sessionId: string | null
  setSessionId: (s: string | null) => void
  tableOrderStatus: OrderStatus | null
  tableOrders: Order[]
  tableTotalAmount: number
  isTablePaid: boolean
  customizingProduct: Product | null
  setCustomizingProduct: (p: Product | null) => void
  selected3DProduct: Product | null
  setSelected3DProduct: (p: Product | null) => void
  showServiceModal: boolean
  setShowServiceModal: (open: boolean) => void
  isCartOpen: boolean
  setIsCartOpen: (open: boolean) => void
  showTimelineModal: boolean
  setShowTimelineModal: (open: boolean) => void
  showDirectBillModal: boolean
  setShowDirectBillModal: (open: boolean) => void
  showLegalModal: boolean
  setShowLegalModal: (open: boolean) => void
  showAdminAuthModal: boolean
  setShowAdminAuthModal: (open: boolean) => void
  isInSituEditModalOpen: boolean
  setIsInSituEditModalOpen: (open: boolean) => void
  editingInSituProduct: Product | null
  setEditingInSituProduct: (p: Product | null) => void
  inSituTargetCategoryId?: string
  adminSessionToken: string | null
  pendingServiceCalls: Set<string>
  serviceRequestedToast: string | null
  inSituFeedbackToast: string | null
  setInSituFeedbackToast: (t: string | null) => void
  onAddCustomized: (product: Product, quantity: number, selectedPills: string[], notes: string) => void
  onRequestMicroService: (serviceName: string) => void
  onBillRequested: () => void
  onAdminAuthSuccess: (token: string) => void
  onSaveInSituProduct: (product: Product) => void
  onDeleteInSituProduct: (id: string) => void
  onOrderSubmitted: (order: any) => void
  onUpdateCartQuantity: (index: number, newQty: number) => void
  onRemoveCartItem: (index: number) => void
  onClearCart: () => void
  onAddProductInline: (product: Product) => void
}

export function MenuModals({
  slug,
  tableNumber,
  restaurant,
  categories,
  products,
  cart,
  currentLang,
  sessionId,
  setSessionId,
  tableOrderStatus,
  tableOrders,
  tableTotalAmount,
  isTablePaid,
  customizingProduct,
  setCustomizingProduct,
  selected3DProduct,
  setSelected3DProduct,
  showServiceModal,
  setShowServiceModal,
  isCartOpen,
  setIsCartOpen,
  showTimelineModal,
  setShowTimelineModal,
  showDirectBillModal,
  setShowDirectBillModal,
  showLegalModal,
  setShowLegalModal,
  showAdminAuthModal,
  setShowAdminAuthModal,
  isInSituEditModalOpen,
  setIsInSituEditModalOpen,
  editingInSituProduct,
  setEditingInSituProduct,
  inSituTargetCategoryId,
  adminSessionToken,
  pendingServiceCalls,
  serviceRequestedToast,
  inSituFeedbackToast,
  setInSituFeedbackToast,
  onAddCustomized,
  onRequestMicroService,
  onBillRequested,
  onAdminAuthSuccess,
  onSaveInSituProduct,
  onDeleteInSituProduct,
  onOrderSubmitted,
  onUpdateCartQuantity,
  onRemoveCartItem,
  onClearCart,
  onAddProductInline,
}: MenuModalsProps) {
  const t = (key: string) => getTranslation(currentLang, key)

  return (
    <>
      {/* 1. Modal de Modificadores de Producto */}
      <ProductModifierModal
        product={customizingProduct}
        onClose={() => setCustomizingProduct(null)}
        onConfirm={onAddCustomized}
        lang={currentLang}
        isStaff={false}
      />

      {/* 2. Modal Visor 3D */}
      <Product3DModal
        product={selected3DProduct}
        onClose={() => setSelected3DProduct(null)}
      />

      {/* 3. Modal de Micro-Servicios a la Mesa */}
      {showServiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in select-none">
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-blue-600" />
                <h3 className="font-extrabold text-sm text-slate-900">
                  Micro-Servicios para Mesa #{tableNumber}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowServiceModal(false)}
                className="p-1.5 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 font-medium">
              Toca lo que necesitas y el mozo lo acercará directamente a tu mesa:
            </p>

            <div className="grid grid-cols-2 gap-2.5">
              {[
                { name: t('iceLemon'), icon: '🍋' },
                { name: t('tapWater'), icon: '💧' },
                { name: t('breadSauces'), icon: '🥖' },
                { name: t('extraCutlery'), icon: '🍴' },
                { name: t('saltCondiments'), icon: '🧂' },
                { name: t('napkins'), icon: '🧻' },
              ].map((serv) => {
                const isRequested = pendingServiceCalls.has(serv.name)

                return (
                  <button
                    key={serv.name}
                    type="button"
                    disabled={isRequested}
                    onClick={() => onRequestMicroService(serv.name)}
                    className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between gap-1 shadow-xs ${
                      isRequested
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-950 cursor-not-allowed shadow-emerald-500/10'
                        : 'bg-slate-50 hover:bg-blue-50 border-slate-200/80 hover:border-blue-300 text-slate-900 active:scale-95 cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xl">{serv.icon}</span>
                      {isRequested && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-600 text-[10px] font-black text-white shadow-xs animate-in fade-in">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                          Solicitado
                        </span>
                      )}
                    </div>
                    <span className={`font-bold text-xs ${isRequested ? 'text-emerald-950' : 'text-slate-900'}`}>
                      {serv.name}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* 4. Toast de Micro-Servicio Enviado */}
      {serviceRequestedToast && (
        <div className="fixed top-16 inset-x-3 z-50 max-w-md mx-auto p-3 rounded-2xl bg-emerald-700 text-white font-bold shadow-2xl flex items-center justify-between animate-in slide-in-from-top duration-300 border border-emerald-600">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-200 stroke-[3]" />
            <span className="text-xs">¡Solicitado {serviceRequestedToast} para Mesa #{tableNumber}!</span>
          </div>
        </div>
      )}

      {/* 5. Cajón de Carrito del Comensal */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQuantity={onUpdateCartQuantity}
        onRemoveItem={onRemoveCartItem}
        onClearCart={onClearCart}
        tableNumber={tableNumber}
        sessionId={sessionId}
        onSessionUpdate={(newSession) => setSessionId(newSession)}
        onOrderSubmitted={onOrderSubmitted}
        lang={currentLang}
        products={products}
        onAddProduct={onAddProductInline}
        canRequestBill={Boolean(tableOrderStatus && !isTablePaid)}
        onAddSuggestedDrink={(drinkId) => {
          const drink = products.find(p => p.id === drinkId)
          if (drink) {
            onAddProductInline(drink)
          }
        }}
        onAddSuggestedDessert={(dessertId) => {
          const dessert = products.find(p => p.id === dessertId)
          if (dessert) {
            onAddProductInline(dessert)
          }
        }}
      />

      {/* 6. Modal de Seguimiento / Timeline del Pedido */}
      <OrderTimelineModal
        isOpen={showTimelineModal}
        onClose={() => setShowTimelineModal(false)}
        tableNumber={tableNumber}
        status={tableOrderStatus}
        orders={tableOrders}
        onRequestService={() => setShowServiceModal(true)}
        onRequestBill={() => setShowDirectBillModal(true)}
      />

      {/* 7. Modal Directo de Pedir la Cuenta */}
      <BillModal
        isOpen={showDirectBillModal}
        onClose={() => setShowDirectBillModal(false)}
        onBillRequested={onBillRequested}
        tableNumber={tableNumber}
        slug={restaurant.slug}
        restaurantName={restaurant.name}
        googleReviewUrl={restaurant.google_review_url}
        googlePlaceId={restaurant.google_place_id}
        totalAmount={tableTotalAmount}
      />

      {/* 8. Modal Legal y RGPD */}
      <LegalModal
        isOpen={showLegalModal}
        onClose={() => setShowLegalModal(false)}
        restaurantName={restaurant.name}
      />

      {/* 9. Modal de Autenticación de Administrador In-Situ */}
      <InSituAdminAuthModal
        isOpen={showAdminAuthModal}
        onClose={() => setShowAdminAuthModal(false)}
        slug={slug}
        onSuccess={onAdminAuthSuccess}
      />

      {/* 10. Modal de Crear / Editar Plato In-Situ */}
      <InSituEditProductModal
        isOpen={isInSituEditModalOpen}
        onClose={() => {
          setIsInSituEditModalOpen(false)
          setEditingInSituProduct(null)
        }}
        product={editingInSituProduct}
        categories={categories}
        defaultCategoryId={inSituTargetCategoryId}
        slug={slug}
        adminToken={adminSessionToken}
        onSave={onSaveInSituProduct}
        onDelete={onDeleteInSituProduct}
      />

      {/* 11. Toast de Feedback In-Situ */}
      {inSituFeedbackToast && (
        <div className="fixed top-16 inset-x-3 z-50 max-w-md mx-auto p-3 rounded-2xl bg-purple-900 text-white font-bold shadow-2xl flex items-center justify-between gap-2 animate-in slide-in-from-top duration-300 border border-purple-700">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Sparkles className="w-4 h-4 text-purple-300 flex-shrink-0" />
            <span className="text-xs font-extrabold truncate">{inSituFeedbackToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setInSituFeedbackToast(null)}
            className="p-1 rounded-full text-purple-300 hover:text-white cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 12. SEO Semántico Schema.org */}
      <RestaurantJsonLd
        restaurant={restaurant}
        categories={categories}
        products={products}
      />
    </>
  )
}
