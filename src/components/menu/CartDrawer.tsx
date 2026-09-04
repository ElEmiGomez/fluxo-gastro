'use client'

import React, { useState, useRef } from 'react'
import Image from 'next/image'
import { ShoppingBag, X, Plus, Minus, Trash2, CheckCircle2, Loader2, Utensils, Send, UserCheck, Bell, Sparkles, Receipt, CakeSlice, Clock } from 'lucide-react'
import { CartItem, Product, OrderStatus } from '@/types/database.types'
import { useTenant } from '@/components/tenant/TenantProvider'
import { formatCurrency } from '@/lib/utils'
import { ConfirmModal } from '@/components/common/ConfirmModal'
import { BillModal } from '@/components/menu/BillModal'
import { getTranslation, translateProductName } from '@/lib/i18n'
import { triggerHaptic, HAPTIC_PATTERNS } from '@/lib/haptic'

interface CartDrawerProps {
  isOpen: boolean
  onClose: () => void
  cart: CartItem[]
  onUpdateQuantity: (index: number, newQty: number) => void
  onRemoveItem: (index: number) => void
  onClearCart: () => void
  tableNumber: string | null
  sessionId?: string | null
  lang?: string
  products?: Product[]
  onOpenTableSelector?: () => void
  onAddProduct?: (product: Product) => void
  onAddSuggestedDrink?: (productId: string) => void
  onAddSuggestedDessert?: (productId: string) => void
  canRequestBill?: boolean
  isWaiter?: boolean
  onSendWaiterOrder?: () => void
  onSessionUpdate?: (newSessionId: string) => void
}

export function CartDrawer({
  isOpen,
  onClose,
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  tableNumber,
  sessionId,
  lang = 'es',
  products = [],
  onOpenTableSelector,
  onAddProduct,
  onAddSuggestedDrink,
  onAddSuggestedDessert,
  canRequestBill = false,
  isWaiter = false,
  onSendWaiterOrder,
  onSessionUpdate,
}: CartDrawerProps) {
  const activeLang = isWaiter ? 'es' : lang
  const t = (k: string) => getTranslation(activeLang, k)
  const { restaurant } = useTenant()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [showBillModal, setShowBillModal] = useState(false)
  const [isDrinkSuggestionsOpen, setIsDrinkSuggestionsOpen] = useState(false)
  const [isDessertSuggestionsOpen, setIsDessertSuggestionsOpen] = useState(false)
  const [lastSubmissionTime, setLastSubmissionTime] = useState<number>(0)
  const idempotencyKeyRef = useRef<string>('')

  if (!idempotencyKeyRef.current) {
    idempotencyKeyRef.current = `idemp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
  }

  // Listas de sugerencias calculadas con seguridad
  const suggestedDrinksList = (products || []).filter(p => {
    const name = (p.name || '').toLowerCase()
    const catId = p.category_id || ''
    return (
      catId === 'cat-12' ||
      catId === 'cat-13' ||
      catId === 'cat-14' ||
      catId === 'cat-15' ||
      name.includes('limonada') ||
      name.includes('cerveza') ||
      name.includes('gaseosa') ||
      name.includes('trago') ||
      name.includes('gin') ||
      name.includes('agua') ||
      name.includes('vino') ||
      name.includes('albariño') ||
      name.includes('mencía') ||
      name.includes('vermú')
    )
  }).slice(0, 3)

  const suggestedDessertsList = (products || []).filter(p => {
    const name = (p.name || '').toLowerCase()
    const catId = p.category_id || ''
    return (
      catId === 'cat-11' ||
      name.includes('postre') ||
      name.includes('volcán') ||
      name.includes('volcan') ||
      name.includes('cheesecake') ||
      name.includes('tarta') ||
      name.includes('helado') ||
      name.includes('flan') ||
      name.includes('tiramisú') ||
      name.includes('tiramisu') ||
      name.includes('brownie')
    )
  }).slice(0, 3)

  if (!isOpen) return null

  // Normalización ultra-segura de items del carrito
  const validCart = (Array.isArray(cart) ? cart : [])
    .filter(item => Boolean(item && typeof item === 'object'))
    .map(item => ({
      ...item,
      product: item.product || { id: 'p-unknown', name: 'Plato', price: 0, category_id: '' },
      quantity: Math.max(1, parseInt(String(item.quantity || 1), 10) || 1),
      selectedPills: Array.isArray(item.selectedPills) ? item.selectedPills : [],
      notes: typeof item.notes === 'string' ? item.notes : '',
    }))

  const totalAmount = validCart.reduce(
    (sum, item) => sum + (Number(item.product?.price) || 0) * item.quantity,
    0
  )

  const hasDrinks = validCart.some(item => {
    const catId = item.product?.category_id || ''
    const name = (item.product?.name || '').toLowerCase()
    return (
      catId === 'cat-12' ||
      catId === 'cat-13' ||
      catId === 'cat-14' ||
      catId === 'cat-15' ||
      name.includes('limonada') ||
      name.includes('cerveza') ||
      name.includes('gaseosa') ||
      name.includes('trago') ||
      name.includes('gin')
    )
  })

  const hasFood = validCart.some(item => {
    const catId = item.product?.category_id || ''
    const name = (item.product?.name || '').toLowerCase()
    return (
      catId === 'cat-1' ||
      catId === 'cat-2' ||
      catId === 'cat-3' ||
      catId === 'cat-4' ||
      catId === 'cat-5' ||
      catId === 'cat-6' ||
      catId === 'cat-7' ||
      catId === 'cat-8' ||
      catId === 'cat-9' ||
      catId === 'cat-10' ||
      name.includes('burger') ||
      name.includes('pizza') ||
      name.includes('milanesa') ||
      name.includes('pasta') ||
      name.includes('bife') ||
      name.includes('combo')
    )
  })

  const hasDessert = validCart.some(item => {
    const catId = item.product?.category_id || ''
    const name = (item.product?.name || '').toLowerCase()
    return (
      catId === 'cat-11' ||
      name.includes('postre') ||
      name.includes('volcán') ||
      name.includes('volcan') ||
      name.includes('cheesecake') ||
      name.includes('helado') ||
      name.includes('flan') ||
      name.includes('tiramisú') ||
      name.includes('tiramisu')
    )
  })

  // Envío de comanda
  const handleSendOrder = async () => {
    if (isWaiter && onSendWaiterOrder) {
      onSendWaiterOrder()
      onClose()
      return
    }

    const now = Date.now()
    if (now - lastSubmissionTime < 3000) {
      return // Bloqueo de doble clic accidental
    }
    setLastSubmissionTime(now)

    if (!tableNumber) {
      if (onOpenTableSelector) onOpenTableSelector()
      return
    }

    if (validCart.length === 0) return

    setIsSubmitting(true)

    try {
      const currentSlug = restaurant?.slug || (typeof window !== 'undefined' && window.location.pathname.startsWith('/menu/') ? window.location.pathname.split('/')[2] : null) || 'burger-gourmet'
      const parsedTableNum = parseInt(String(tableNumber), 10) || 1

      const payload = {
        slug: currentSlug,
        restaurant_id: restaurant?.id || '',
        table_id: `table-${parsedTableNum}`,
        table_number: parsedTableNum,
        session_id: sessionId || undefined,
        session_token: sessionId || undefined,
        idempotency_key: idempotencyKeyRef.current,
        total_amount: totalAmount,
        created_by: isWaiter ? 'waiter' : 'diner',
        status: (isWaiter ? 'pending' : 'pending_validation') as OrderStatus,
        items: validCart.map(item => ({
          product_id: item.product?.id || '',
          quantity: item.quantity,
          notes: item.notes || (item.selectedPills.length > 0 ? `[${item.selectedPills.join(', ')}]` : null),
        })),
      }

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        triggerHaptic(HAPTIC_PATTERNS.WARNING)
        if (res.status === 403 && data.error === 'SESSION_EXPIRED') {
          // Auto-recuperación transparente: renovar sesión y reintentar comanda automáticamente
          try {
            const startRes = await fetch('/api/tables', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ slug: currentSlug, table_number: parsedTableNum, action: 'start_session' }),
            }).then(r => r.json())
            if (startRes.session_token) {
              if (typeof window !== 'undefined') {
                localStorage.setItem(`gastro_session_${currentSlug}_${parsedTableNum}`, startRes.session_token)
              }
              onSessionUpdate?.(startRes.session_token)
              idempotencyKeyRef.current = `idemp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
              const retryPayload = {
                ...payload,
                session_id: startRes.session_token,
                session_token: startRes.session_token,
                idempotency_key: idempotencyKeyRef.current,
              }
              const retryRes = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(retryPayload),
              })
              if (retryRes.ok) {
                triggerHaptic(HAPTIC_PATTERNS.SUCCESS)
                idempotencyKeyRef.current = ''
                setOrderSuccess(true)
                setTimeout(() => {
                  setOrderSuccess(false)
                  onClearCart()
                  onClose()
                }, 2000)
                return
              }
            }
          } catch {
            // fallback
          }
          alert('⚠️ La sesión de esta mesa ha finalizado o fue liberada por el personal.\nSe ha reiniciado la comanda para el siguiente servicio.')
          onClearCart()
          onClose()
          return
        }
        if (res.status === 429) {
          alert('⏳ Demasiadas solicitudes seguidas. Por favor espera unos segundos e intenta nuevamente.')
          return
        }
        throw new Error(data.message || data.error || 'Error al enviar la comanda al servidor')
      }

      if (data.session_token) {
        if (typeof window !== 'undefined') {
          localStorage.setItem(`gastro_session_${currentSlug}_${parsedTableNum}`, data.session_token)
        }
        onSessionUpdate?.(data.session_token)
      }

      triggerHaptic(HAPTIC_PATTERNS.SUCCESS)
      idempotencyKeyRef.current = ''

      setOrderSuccess(true)
      setTimeout(() => {
        setOrderSuccess(false)
        onClearCart()
        onClose()
      }, 2000)
    } catch (err: any) {
      triggerHaptic(HAPTIC_PATTERNS.WARNING)
      console.error('Error al enviar pedido:', err)
      if (err.message && (err.message.includes('SESSION_EXPIRED') || err.message.includes('sesión'))) {
        alert('⚠️ La sesión de esta mesa ha expirado. Por favor recarga o escanea el QR nuevamente.')
        onClearCart()
        onClose()
        return
      }
      alert('Hubo un error al transmitir el pedido. Por favor avisa al mozo.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-hidden select-none" style={{ touchAction: 'manipulation' }}>
        
        {/* Backdrop suave desenfocado */}
        <div 
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
        />

        {/* CONTENEDOR TIPO BOTTOM SHEET / DRAWER LATERAL */}
        <div className="absolute inset-x-0 bottom-0 sm:inset-y-0 sm:right-0 sm:left-auto sm:w-full sm:max-w-md bg-[#fafbfc] border-t sm:border-l border-slate-200 shadow-2xl flex flex-col rounded-t-3xl sm:rounded-none max-h-[85vh] max-h-[85dvh] sm:max-h-full animate-in slide-in-from-bottom sm:slide-in-from-right duration-300 gpu-layer">
          
          {/* TIRADOR VISUAL SUPERIOR */}
          <div className="w-full pt-2.5 pb-1 flex justify-center sm:hidden flex-shrink-0">
            <div className="w-10 h-1.5 bg-slate-300 rounded-full" />
          </div>

          {/* CABECERA ELEGANTE */}
          <div className="p-4 bg-white/90 backdrop-blur-md border-b border-slate-200 flex items-center justify-between shadow-xs flex-shrink-0">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-xl bg-blue-50 text-blue-900">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-slate-900 leading-tight">
                  {isWaiter ? `Comanda Mesa #${tableNumber || '?'}` : t('yourOrder')}
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  {tableNumber ? `${t('tableNumberLabel')} #${tableNumber}` : 'Mesa'} &middot; {validCart.length} {validCart.length === 1 ? (t('itemSingle') || 'producto') : (t('items') || 'productos')}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* LISTA DE PLATOS DEL CARRITO CON SCROLL COMPLETO */}
          <div className="flex-1 overflow-y-auto min-h-0 p-4 space-y-3">
            {orderSuccess ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center animate-bounce">
                  <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
                </div>
                <h3 className="text-xl font-black text-slate-900">
                  {isWaiter ? '¡Comanda Enviada a Cocina!' : '¡Pedido Recibido!'}
                </h3>
                <p className="text-sm text-slate-600 max-w-xs leading-relaxed">
                  {isWaiter
                    ? `La comanda de la Mesa #${tableNumber} ya está en la pantalla de Cocina KDS.`
                    : `Tu mozo se acercará en unos instantes a la Mesa #${tableNumber} para confirmar verbalmente tu pedido antes de enviarlo a cocina.`}
                </p>
              </div>
            ) : validCart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-4">
                <ShoppingBag className="w-12 h-12 stroke-[1.2] text-slate-300" />
                <div>
                  <p className="text-sm font-semibold text-slate-700">{t('emptyCart')}</p>
                  <p className="text-xs text-slate-400 mt-1">{t('addMoreItems')}</p>
                </div>

                {!isWaiter && canRequestBill && (
                  <button
                    onClick={() => setShowBillModal(true)}
                    className="px-4 py-2.5 rounded-2xl bg-white border border-slate-300 text-slate-800 text-xs font-bold shadow-sm hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                  >
                    <Receipt className="w-4 h-4 text-blue-900" />
                    <span>{t('requestBill')}</span>
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* GUÍA RÁPIDA PARA EL MOZO (SI ESTÁ EN MODO STAFF) */}
                {isWaiter && (
                  <div className="p-2.5 bg-blue-50/80 border border-blue-200/80 rounded-2xl flex items-center gap-2 text-xs text-blue-950 font-bold animate-in fade-in">
                    <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse flex-shrink-0" />
                    <span>Estás registrando comanda directa para la Mesa #{tableNumber}. Al enviar marchará a Cocina KDS.</span>
                  </div>
                )}

                {/* 1. BARRA DE GESTIÓN DE COMANDA */}
                <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                  <span className="text-xs font-black text-slate-700 uppercase tracking-wide">
                    {t('yourOrder')} ({validCart.length})
                  </span>
                  <button
                    onClick={() => setShowClearConfirm(true)}
                    className="text-xs font-bold text-red-600 hover:text-red-800 flex items-center gap-1 hover:underline p-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{t('clearCart')}</span>
                  </button>
                </div>

                {/* 2. LISTA DE PLATOS SELECCIONADOS (PRIMERO) */}
                <div className="space-y-2.5">
                  {validCart.map((item, index) => (
                    <div
                      key={index}
                      className="bg-white border border-slate-200/90 rounded-2xl p-3 space-y-2.5 shadow-xs"
                    >
                      <div className="flex items-start gap-3">
                        {/* Foto del Plato */}
                        <div
                          style={{ position: 'relative', width: '52px', height: '52px', minWidth: '52px', minHeight: '52px', overflow: 'hidden', borderRadius: '12px' }}
                          className="bg-slate-100 border border-slate-200 flex-shrink-0"
                        >
                          {item.product?.image_url ? (
                            <Image
                              src={item.product.image_url}
                              alt={item.product?.name || 'Plato'}
                              fill
                              className="object-cover"
                              sizes="52px"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                              <Utensils className="w-5 h-5 stroke-[1.5]" />
                            </div>
                          )}
                        </div>

                        {/* Nombre y Precio */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 leading-tight">
                            {translateProductName(activeLang, item.product?.id, item.product?.name)}
                          </h3>
                          <span className="text-xs font-black text-blue-900 mt-0.5 block tabular-nums">
                            {formatCurrency(item.product?.price || 0)}
                          </span>

                          {/* Personalizaciones o notas */}
                          {item.selectedPills && item.selectedPills.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {item.selectedPills.map((pill, pIdx) => (
                                <span
                                  key={pIdx}
                                  className="text-[10px] bg-slate-100 text-slate-700 font-bold px-1.5 py-0.5 rounded-md border border-slate-200/80"
                                >
                                  {pill}
                                </span>
                              ))}
                            </div>
                          )}

                          {item.notes && (
                            <p className="text-[10px] text-amber-800 bg-amber-50/80 border border-amber-200/60 rounded px-1.5 py-0.5 mt-1 font-medium italic">
                              &ldquo;{item.notes}&rdquo;
                            </p>
                          )}
                        </div>

                        {/* Botón Eliminar individual */}
                        <button
                          onClick={() => onRemoveItem(index)}
                          className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-100 transition-colors flex-shrink-0 cursor-pointer"
                          title="Eliminar plato"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Control de Cantidad (+ / -) */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        <span className="text-[11px] text-slate-500 font-bold">Cantidad:</span>
                        <div className="flex items-center gap-2 bg-slate-100/90 rounded-xl p-0.5 border border-slate-200/80">
                          <button
                            type="button"
                            onClick={() => {
                              if (item.quantity <= 1) {
                                onRemoveItem(index)
                              } else {
                                onUpdateQuantity(index, item.quantity - 1)
                              }
                            }}
                            className="p-1 text-slate-500 hover:text-slate-900 cursor-pointer"
                          >
                            {item.quantity <= 1 ? <Trash2 className="w-3.5 h-3.5 text-red-500" /> : <Minus className="w-3 h-3" />}
                          </button>
                          <span className="font-black text-xs text-slate-900 px-1.5 tabular-nums">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(index, item.quantity + 1)}
                            className="p-1 text-slate-500 hover:text-slate-900 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 3. SUGERENCIAS COMPACTAS CON ACORDEÓN DESPLEGABLE */}
                {!hasDrinks && suggestedDrinksList.length > 0 && (
                  <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl overflow-hidden transition-all animate-in fade-in">
                    <button
                      type="button"
                      onClick={() => setIsDrinkSuggestionsOpen(prev => !prev)}
                      className="w-full p-2.5 flex items-center justify-between text-xs font-bold text-amber-950 hover:bg-amber-100/50 transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5 font-extrabold text-[11px]">
                        <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                        <span>¿Deseas sumar bebida a tu pedido?</span>
                      </span>
                      <div className="flex items-center gap-1 text-[10px] text-amber-800 bg-white/90 px-2 py-0.5 rounded-full border border-amber-200">
                        <span>{isDrinkSuggestionsOpen ? 'Ocultar' : 'Ver opciones'}</span>
                        <Plus size={11} className={`transform transition-transform ${isDrinkSuggestionsOpen ? 'rotate-45' : ''}`} />
                      </div>
                    </button>
                    {isDrinkSuggestionsOpen && (
                      <div className="p-2.5 pt-0 flex items-center gap-1.5 overflow-x-auto no-scrollbar animate-in slide-in-from-top-1 duration-200">
                        {suggestedDrinksList.map(drink => (
                          <button
                            key={drink.id}
                            type="button"
                            onClick={() => {
                              triggerHaptic(HAPTIC_PATTERNS.SUCCESS)
                              if (onAddProduct) {
                                onAddProduct(drink)
                              } else if (onAddSuggestedDrink) {
                                onAddSuggestedDrink(drink.id)
                              }
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-white border border-amber-300 text-[11px] font-bold text-slate-800 shadow-xs flex items-center gap-1 hover:bg-amber-100 whitespace-nowrap active:scale-95 transition-transform cursor-pointer"
                          >
                            <span>{drink.name.includes('Limonada') ? '🍋' : drink.name.includes('Vino') || drink.name.includes('Albariño') || drink.name.includes('Mencía') ? '🍷' : drink.name.includes('Vermú') ? '🍹' : '🍺'} {drink.name.split('(')[0].trim()} ({formatCurrency(drink.price)})</span>
                            <Plus size={12} className="text-amber-700" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {hasFood && !hasDessert && suggestedDessertsList.length > 0 && (
                  <div className="bg-pink-50/60 border border-pink-200/80 rounded-2xl overflow-hidden transition-all animate-in fade-in">
                    <button
                      type="button"
                      onClick={() => setIsDessertSuggestionsOpen(prev => !prev)}
                      className="w-full p-2.5 flex items-center justify-between text-xs font-bold text-rose-950 hover:bg-pink-100/50 transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5 font-extrabold text-[11px]">
                        <CakeSlice className="w-3.5 h-3.5 text-pink-600" />
                        <span>¿Deseas sumar un postre?</span>
                      </span>
                      <div className="flex items-center gap-1 text-[10px] text-pink-800 bg-white/90 px-2 py-0.5 rounded-full border border-pink-200">
                        <span>{isDessertSuggestionsOpen ? 'Ocultar' : 'Ver opciones'}</span>
                        <Plus size={11} className={`transform transition-transform ${isDessertSuggestionsOpen ? 'rotate-45' : ''}`} />
                      </div>
                    </button>
                    {isDessertSuggestionsOpen && (
                      <div className="p-2.5 pt-0 flex items-center gap-1.5 overflow-x-auto no-scrollbar animate-in slide-in-from-top-1 duration-200">
                        {suggestedDessertsList.map(dessert => (
                          <button
                            key={dessert.id}
                            type="button"
                            onClick={() => {
                              triggerHaptic(HAPTIC_PATTERNS.SUCCESS)
                              if (onAddProduct) {
                                onAddProduct(dessert)
                              } else if (onAddSuggestedDessert) {
                                onAddSuggestedDessert(dessert.id)
                              }
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-white border border-pink-300 text-[11px] font-bold text-slate-800 shadow-xs flex items-center gap-1 hover:bg-pink-100 whitespace-nowrap active:scale-95 transition-transform cursor-pointer"
                          >
                            <span>🍰 {dessert.name.split('(')[0].trim()} ({formatCurrency(dessert.price)})</span>
                            <Plus size={12} className="text-pink-700" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 4. MENSAJE TRANQUILIZADOR (AL FINAL DE LA LISTA) */}
                {!isWaiter && (
                  <div className="p-3 bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 border border-blue-200 rounded-2xl flex items-center gap-2.5 text-xs text-blue-950 font-semibold shadow-2xs animate-in fade-in">
                    <div className="w-7 h-7 rounded-xl bg-blue-900 text-white flex items-center justify-center font-bold flex-shrink-0 shadow-2xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 stroke-[2.5]" />
                    </div>
                    <div className="min-w-0 flex-1 leading-snug">
                      <span className="font-extrabold text-blue-950 block text-[11px] uppercase tracking-wide">Tranquilidad Total</span>
                      <span className="text-[11px] text-slate-700">{t('reassuranceCartNotice')}</span>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* PIE DEL MODAL CON TOTAL Y ACCIONES */}
          {validCart.length > 0 && !orderSuccess && (
            <div 
              className="p-4 bg-white border-t border-slate-200 space-y-3 flex-shrink-0 shadow-lg"
              style={{ paddingBottom: 'calc(1.75rem + env(safe-area-inset-bottom, 16px))' }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">
                    Total a pagar
                  </span>
                  <div className="text-2xl font-black text-blue-900 tabular-nums">
                    {formatCurrency(totalAmount)}
                  </div>
                </div>

                {!isWaiter && canRequestBill && (
                  <button
                    type="button"
                    onClick={() => setShowBillModal(true)}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors border border-slate-200"
                  >
                    <Receipt className="w-4 h-4 text-blue-900" />
                    <span>Pedir Cuenta</span>
                  </button>
                )}
              </div>

              {/* AVISO PREVIO AL ENVÍO */}
              <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-600 font-bold bg-slate-50 py-1.5 px-3 rounded-xl border border-slate-200/80">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5] flex-shrink-0" />
                <span className="truncate">
                  {isWaiter
                    ? `Comanda directa para Mesa #${tableNumber}`
                    : `El mozo confirmará el pedido contigo en la Mesa #${tableNumber}`}
                </span>
              </div>

              {/* BOTÓN PRINCIPAL */}
              {isWaiter ? (
                <button
                  type="button"
                  onClick={handleSendOrder}
                  disabled={isSubmitting}
                  className="w-full py-4 rounded-2xl font-black text-sm bg-emerald-700 hover:bg-emerald-600 text-white shadow-xl flex items-center justify-center space-x-2 transition-transform active:scale-95 disabled:opacity-50 uppercase cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>ENVIANDO A COCINA...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      <span>🚀 ENVIAR A COCINA</span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSendOrder}
                  disabled={isSubmitting}
                  className="w-full py-4 rounded-2xl font-black text-sm bg-blue-900 hover:bg-blue-800 text-white shadow-xl shadow-blue-900/20 flex items-center justify-center space-x-2 transition-transform active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>ENVIANDO AL MOZO...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      <span>ENVIAR COMANDA AL MOZO</span>
                    </>
                  )}
                </button>
              )}
            </div>
          )}

        </div>
      </div>

      {/* MODAL DE PEDIR LA CUENTA CONECTADO DIRECTAMENTE */}
      <BillModal
        isOpen={showBillModal}
        onClose={() => setShowBillModal(false)}
        tableNumber={tableNumber}
        slug={restaurant?.slug || 'burger-gourmet'}
      />

      {/* MODAL DE CONFIRMACIÓN PARA VACIAR COMANDA */}
      <ConfirmModal
        isOpen={showClearConfirm}
        title="¿Vaciar comanda?"
        message="Se eliminarán todos los platos agregados actualmente a tu comanda."
        confirmText="Sí, vaciar"
        cancelText="Cancelar"
        variant="danger"
        onConfirm={() => {
          onClearCart()
          setShowClearConfirm(false)
        }}
        onCancel={() => setShowClearConfirm(false)}
      />
    </>
  )
}
