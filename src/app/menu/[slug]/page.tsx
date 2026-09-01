'use client'

import React, { useState, useEffect, Suspense } from 'react'
import Image from 'next/image'
import { useParams, useSearchParams } from 'next/navigation'
import {
  ShoppingBag,
  Plus,
  Minus,
  Check,
  ChevronRight,
  ChevronDown,
  UtensilsCrossed,
  Sparkles,
  Utensils,
  Search,
  Loader2,
  Bell,
  X,
  Flame,
  LayoutList,
  LayoutGrid,
  Receipt
} from 'lucide-react'
import { TenantProvider } from '@/components/tenant/TenantProvider'
import { TenantHeader } from '@/components/tenant/TenantHeader'
import { CallWaiterButton } from '@/components/menu/CallWaiterButton'
import { CartDrawer } from '@/components/menu/CartDrawer'
import { Product3DModal } from '@/components/menu/Product3DModal'
import { ProductModifierModal } from '@/components/comandero/ProductModifierModal'
import { OrderTimelineModal } from '@/components/menu/OrderTimelineModal'
import { BillModal } from '@/components/menu/BillModal'
import { GoogleReviewBooster } from '@/components/menu/GoogleReviewBooster'
import { RestaurantJsonLd } from '@/components/seo/RestaurantJsonLd'
import { LegalModal } from '@/components/legal/LegalModal'
import { triggerHaptic, HAPTIC_PATTERNS } from '@/lib/haptic'
import { Product, Category, CartItem, Restaurant, Table, OrderStatus } from '@/types/database.types'
import { formatCurrency } from '@/lib/utils'
import { createBrowserClient } from '@/lib/supabase/client'
import { MOCK_RESTAURANTS, MOCK_CATEGORIES, MOCK_PRODUCTS, MOCK_TABLES } from '@/lib/supabase/mock-fallback'
import { TOP_LANGUAGES, getTranslation, translateCategoryName, translateProductName, translateProductDescription } from '@/lib/i18n'
import { FluxoLogo } from '@/components/common/FluxoLogo'

const STORAGE_CART_PREFIX = 'gastro_cart_'

function DinerMenuContent() {
  const params = useParams()
  const searchParams = useSearchParams()
  const slug = (params?.slug as string) || 'burger-gourmet'
  const tableParam = searchParams.get('table') || '4'

  const [restaurant, setRestaurant] = useState<Restaurant>(() => MOCK_RESTAURANTS[slug] || MOCK_RESTAURANTS['burger-gourmet'])
  const [categories, setCategories] = useState<Category[]>(() => MOCK_CATEGORIES[slug] || [])
  const [products, setProducts] = useState<Product[]>(() => MOCK_PRODUCTS[slug] || [])
  const [tables, setTables] = useState<Table[]>(() => MOCK_TABLES[slug] || [])
  
  const [currentLang, setCurrentLang] = useState<string>('gl') // Por defecto Galego
  const [showLangDropdown, setShowLangDropdown] = useState(false)
  const t = (key: string) => getTranslation(currentLang, key)

  const [selectedCategory, setSelectedCategory] = useState<string>(() => MOCK_CATEGORIES[slug]?.[0]?.id || 'cat-1')
  const [searchQuery, setSearchQuery] = useState('')
  const [dietaryFilter, setDietaryFilter] = useState<'all' | 'sintacc' | 'veggie'>('all')
  const [tableNumber, setTableNumber] = useState<string>(tableParam)

  // Vistas: 'list' (Carta Detallada Desplegable) o 'grid' (Galería de Fotos)
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [expandedProductIds, setExpandedProductIds] = useState<Record<string, boolean>>({})

  // Carrito persistente
  const [cart, setCart] = useState<CartItem[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [selected3DProduct, setSelected3DProduct] = useState<Product | null>(null)
  const [customizingProduct, setCustomizingProduct] = useState<Product | null>(null)
  const [showTimelineModal, setShowTimelineModal] = useState(false)
  const [showDirectBillModal, setShowDirectBillModal] = useState(false)
  const [isTablePaid, setIsTablePaid] = useState(false)
  const [tableTotalAmount, setTableTotalAmount] = useState<number>(0)
  const [addedToast, setAddedToast] = useState<string | null>(null)

  // Microservicios
  const [showServiceModal, setShowServiceModal] = useState(false)
  const [serviceRequestedToast, setServiceRequestedToast] = useState<string | null>(null)

  // Tracker en vivo de estado en cocina
  const [tableOrderStatus, setTableOrderStatus] = useState<OrderStatus | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [showLegalModal, setShowLegalModal] = useState(false)

  // 1. Carga inicial y recuperación de persistencia
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
                product: item.product && typeof item.product === 'object' ? item.product : {
                  id: item.product_id || 'unknown',
                  name: item.name || 'Plato',
                  price: Number(item.price) || 0,
                  category_id: '',
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

      // Registro anónimo de visualización de carta para estadísticas del restaurante (RGPD Compliant)
      try {
        fetch('/api/analytics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slug, type: 'page_view', table_number: tableNumber }),
        }).catch(() => {})
      } catch {
        // ignore
      }

      // Inicializar o recuperar sesión temporal UUID (Resiliente a Safari iOS ITP)
      const urlSession = searchParams.get('session')
      const localStoredSession = typeof window !== 'undefined' ? localStorage.getItem(`gastro_session_${slug}_${tableNumber}`) : null

      if (urlSession) {
        setSessionId(urlSession)
        localStorage.setItem(`gastro_session_${slug}_${tableNumber}`, urlSession)
      } else if (localStoredSession) {
        setSessionId(localStoredSession)
      } else {
        // Si Safari ITP purgó localStorage, restaurar desde la cookie HTTP-Only persistente
        fetch(`/api/session/restore?slug=${slug}&table=${tableNumber}`)
          .then(r => r.json())
          .then(data => {
            if (data.restored && data.session_token) {
              setSessionId(data.session_token)
              localStorage.setItem(`gastro_session_${slug}_${tableNumber}`, data.session_token)
              if (data.orders && data.orders.length > 0) {
                const total = data.orders.reduce((sum: number, o: any) => sum + (Number(o.total_amount) || 0), 0)
                setTableTotalAmount(total)
              }
            } else {
              // Si no había cookie activa o la mesa fue liberada, iniciar sesión limpia
              fetch('/api/tables', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  slug,
                  table_number: tableNumber,
                  action: 'start_session',
                }),
              })
                .then(r => r.json())
                .then(startData => {
                  if (startData.session_token) {
                    setSessionId(startData.session_token)
                    localStorage.setItem(`gastro_session_${slug}_${tableNumber}`, startData.session_token)
                  }
                })
                .catch(() => {})
            }
          })
          .catch(() => {
            // Fallback de inicio directo
            fetch('/api/tables', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ slug, table_number: tableNumber, action: 'start_session' }),
            })
              .then(r => r.json())
              .then(startData => {
                if (startData.session_token) {
                  setSessionId(startData.session_token)
                  localStorage.setItem(`gastro_session_${slug}_${tableNumber}`, startData.session_token)
                }
              })
              .catch(() => {})
          })
      }

      // Detección automática inteligente de idioma (Fase 3 UX)
      try {
        const storedLang = localStorage.getItem('gastro_lang')
        if (storedLang && ['es', 'gl', 'en'].includes(storedLang)) {
          setCurrentLang(storedLang)
        } else if (typeof navigator !== 'undefined' && navigator.language) {
          const navLang = navigator.language.toLowerCase()
          if (navLang.startsWith('en')) {
            setCurrentLang('en')
          } else if (navLang.startsWith('gl')) {
            setCurrentLang('gl')
          } else {
            setCurrentLang('es')
          }
        }
      } catch {
        // ignore
      }
    }

    async function loadData() {
      const supabase = createBrowserClient()
      if (supabase) {
        try {
          const { data: restData } = await supabase
            .from('restaurants')
            .select('*')
            .eq('slug', slug)
            .single()

          if (restData) {
            setRestaurant(restData)

            const { data: catData } = await supabase
              .from('categories')
              .select('*')
              .eq('restaurant_id', restData.id)
              .order('order_index')

            if (catData && catData.length > 0) {
              setCategories(catData)
              setSelectedCategory(catData[0].id)
            }

            const { data: prodData } = await supabase
              .from('products')
              .select('*')
              .eq('restaurant_id', restData.id)
              .eq('is_available', true)

            if (prodData && prodData.length > 0) setProducts(prodData)

            const { data: tableData } = await supabase
              .from('tables')
              .select('*')
              .eq('restaurant_id', restData.id)
              .order('table_number')

            if (tableData) setTables(tableData)
            return
          }
        } catch (e) {
          console.log('Using local fallback data:', e)
        }
      }

      if (MOCK_RESTAURANTS[slug]) {
        setRestaurant(MOCK_RESTAURANTS[slug])
        const cats = MOCK_CATEGORIES[slug] || []
        setCategories(cats)
        if (cats.length > 0) {
          setSelectedCategory(cats[0].id)
        }
        setProducts(MOCK_PRODUCTS[slug] || [])
        setTables(MOCK_TABLES[slug] || [])
      }
    }

    loadData()
  }, [slug, tableNumber])

  // 2. Sincronización en vivo del estado del pedido en Cocina para el comensal
  useEffect(() => {
    let sseEventSource: EventSource | null = null
    let pollInterval: any = null

    const checkOrderStatus = async () => {
      try {
        const [ordersRes, callsRes, tablesRes] = await Promise.all([
          fetch(`/api/orders?slug=${slug}`).then(r => r.json()).catch(() => ({ orders: [] })),
          fetch(`/api/service-calls?slug=${slug}`).then(r => r.json()).catch(() => ({ calls: [] })),
          fetch(`/api/tables?slug=${slug}`).then(r => r.json()).catch(() => ({ sessions: {} })),
        ])

        const sessions = tablesRes.sessions || {}
        const thisTableSession = sessions[tableNumber]

        if (thisTableSession?.session_id) {
          setSessionId(thisTableSession.session_id)
        }

        // Si la mesa fue liberada por el mozo, limpiar comanda local y resetear
        if (thisTableSession && thisTableSession.status === 'free') {
          setTableOrderStatus(null)
          setIsTablePaid(false)
          return
        }

        const calls: any[] = callsRes.calls || []
        const isBillPaid = calls.some(
          (c: any) =>
            c.table_number?.toString() === tableNumber?.toString() &&
            c.status === 'attended' &&
            c.call_type?.startsWith('bill_')
        )

        if (isBillPaid) {
          setIsTablePaid(true)
          setTableOrderStatus(null)
          return
        } else {
          setIsTablePaid(false)
        }

        const orders: any[] = ordersRes.orders || []
        const tableOrders = orders.filter(
          o => o.table_number?.toString() === tableNumber?.toString()
        )

        if (tableOrders.length === 0) {
          setTableOrderStatus(null)
          setTableTotalAmount(0)
        } else {
          const total = tableOrders.reduce((sum, ord) => sum + (Number(ord.total_amount) || 0), 0)
          setTableTotalAmount(total)

          const isReady = tableOrders.some(o => o.status === 'ready')
          const isPreparing = tableOrders.some(o => o.status === 'preparing')
          const isPending = tableOrders.some(o => o.status === 'pending')
          const isDelivered = tableOrders.every(o => o.status === 'delivered')

          if (isReady) {
            setTableOrderStatus('ready')
          } else if (isPreparing) {
            setTableOrderStatus('preparing')
          } else if (isPending) {
            setTableOrderStatus('pending')
          } else if (isDelivered) {
            setTableOrderStatus('delivered')
          }
        }
      } catch (e) {
        console.log('Error checking order status for diner:', e)
      }
    }

    checkOrderStatus()

    try {
      sseEventSource = new EventSource('/api/events')
      sseEventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)

          // Si el mozo liberó esta mesa específica, limpiar estado y carrito residual
          if (data.type === 'table_freed' && data.tableNumber?.toString() === tableNumber?.toString()) {
            setCart([])
            setTableOrderStatus(null)
            setIsTablePaid(false)
            if (typeof window !== 'undefined') {
              localStorage.removeItem(`${STORAGE_CART_PREFIX}${slug}_${tableNumber}`)
            }
            if (data.new_session_id) {
              setSessionId(data.new_session_id)
            }
            return
          }

          if (
            data.slug === slug ||
            data.type?.startsWith('order_') ||
            data.type?.startsWith('service_') ||
            data.type?.startsWith('table_')
          ) {
            checkOrderStatus()
          }
        } catch {
          // ignore
        }
      }
    } catch {
      // fallback
    }

    pollInterval = setInterval(checkOrderStatus, 2000)

    return () => {
      if (sseEventSource) sseEventSource.close()
      if (pollInterval) clearInterval(pollInterval)
    }
  }, [slug, tableNumber])

  // Guardar carrito automáticamente
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (cart.length > 0) {
        localStorage.setItem(`${STORAGE_CART_PREFIX}${slug}_${tableNumber}`, JSON.stringify(cart))
      } else {
        localStorage.removeItem(`${STORAGE_CART_PREFIX}${slug}_${tableNumber}`)
      }
    }
  }, [cart, slug, tableNumber])

  // Toggle expandir plato con animación suave
  const toggleExpand = (productId: string) => {
    setExpandedProductIds(prev => ({
      ...prev,
      [productId]: !prev[productId]
    }))
  }

  // Filtrado de productos
  const filteredProducts = products.filter(prod => {
    const matchesCategory = selectedCategory === 'all' || prod.category_id === selectedCategory
    const matchesSearch = searchQuery === '' || 
      prod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (prod.description && prod.description.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesDietary = dietaryFilter === 'all'
      ? true
      : dietaryFilter === 'sintacc'
      ? (
          prod.name.toLowerCase().includes('sin tacc') ||
          prod.name.toLowerCase().includes('celíac') ||
          prod.name.toLowerCase().includes('celiac') ||
          (prod.description && (prod.description.toLowerCase().includes('sin tacc') || prod.description.toLowerCase().includes('sin gluten'))) ||
          prod.category_id === 'cat-11' || prod.category_id === 'cat-12' || prod.category_id === 'cat-13' || prod.category_id === 'cat-14' || prod.category_id === 'cat-15'
        )
      : (
          prod.name.toLowerCase().includes('veggie') ||
          prod.name.toLowerCase().includes('vegano') ||
          prod.name.toLowerCase().includes('vegetar') ||
          (prod.description && (prod.description.toLowerCase().includes('veggie') || prod.description.toLowerCase().includes('vegetal') || prod.description.toLowerCase().includes('vegano') || prod.description.toLowerCase().includes('vegetariano')))
        )

    return matchesCategory && matchesSearch && matchesDietary
  })

  // Obtener cantidad de un producto básico en el carrito
  const getProductQuantityInCart = (productId: string): number => {
    const match = cart.find(
      item => item.product?.id === productId && (!item.selectedPills || item.selectedPills.length === 0) && (!item.notes || item.notes === '')
    )
    return match ? match.quantity : 0
  }

  // Actualizar cantidad inline (+ / -) con Haptic Feedback
  const handleUpdateProductQuantity = (product: Product, delta: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
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

  // Agregar configurado (modal con píldoras)
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

  // Solicitar microservicio con Haptic Feedback
  const handleRequestMicroService = async (serviceName: string) => {
    triggerHaptic(HAPTIC_PATTERNS.SERVICE_CALL)
    try {
      fetch('/api/service-calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: restaurant.slug,
          table_number: tableNumber,
          call_type: `service_${serviceName}`,
        }),
      }).catch(console.error)

      setServiceRequestedToast(serviceName)
      setTimeout(() => {
        setServiceRequestedToast(null)
        setShowServiceModal(false)
      }, 3000)
    } catch {
      setServiceRequestedToast(serviceName)
      setTimeout(() => {
        setServiceRequestedToast(null)
        setShowServiceModal(false)
      }, 3000)
    }
  }

  const totalCartCount = cart.reduce((sum, item) => sum + (Number(item?.quantity) || 1), 0)
  const totalCartAmount = cart.reduce((sum, item) => sum + (Number(item?.product?.price) || 0) * (Number(item?.quantity) || 1), 0)

  return (
    <TenantProvider restaurant={restaurant} initialTable={tableNumber}>
      <div className="min-h-screen bg-slate-50 text-slate-900 pb-36 font-sans antialiased selection:bg-blue-100 selection:text-blue-900" style={{ touchAction: 'manipulation' }}>
        
        {/* 1. Header Móvil Ergonómico y Compacto */}
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
          <div className="max-w-2xl mx-auto px-3.5 py-2.5 flex items-center justify-between gap-2.5">
            
            {/* Logo y Datos de Mesa */}
            <div className="flex items-center space-x-2.5 min-w-0 flex-1">
              <FluxoLogo size={36} />
              <div className="min-w-0 flex-1">
                <h1 className="text-xs sm:text-sm font-extrabold text-slate-900 leading-tight truncate">
                  {searchParams.get('local') || restaurant.name || 'Nombre del Local'}
                </h1>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[11px] font-black text-blue-600 bg-blue-50 px-2 py-0.2 rounded-md border border-blue-100 uppercase">
                    {t('tableNumberLabel')} #{tableNumber}
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                </div>
              </div>
            </div>

            {/* Botones de Acción Rápida (Idioma, Servicio & Mozo) */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              
              {/* Selector de Idiomas Desplegable Compacto y Elegante */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowLangDropdown(prev => !prev)}
                  className="px-2.5 py-1.5 rounded-xl font-black text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 flex items-center gap-1 shadow-xs transition-all active:scale-95"
                  title="Cambiar idioma / Change language"
                >
                  <span className="text-xs">{TOP_LANGUAGES.find(l => l.code === currentLang)?.flag || '🌐'}</span>
                  <span className="uppercase text-[11px] font-black tracking-tight">{currentLang}</span>
                  <ChevronDown className={`w-3 h-3 text-slate-500 transition-transform duration-200 ${showLangDropdown ? 'rotate-180' : ''}`} />
                </button>

                {showLangDropdown && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setShowLangDropdown(false)} 
                    />
                    <div className="absolute right-0 mt-1.5 w-36 bg-white rounded-2xl shadow-xl border border-slate-200 py-1 z-50 animate-in fade-in zoom-in-95 overflow-hidden">
                      {TOP_LANGUAGES.map((langOpt) => {
                        const isSelected = currentLang === langOpt.code
                        return (
                          <button
                            key={langOpt.code}
                            type="button"
                            onClick={() => {
                              setCurrentLang(langOpt.code)
                              setShowLangDropdown(false)
                            }}
                            className={`w-full px-3 py-2 text-left text-xs font-black flex items-center justify-between transition-colors ${
                              isSelected
                                ? 'bg-blue-50 text-blue-900 font-extrabold'
                                : 'text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <span className="flex items-center gap-2">
                              <span>{langOpt.flag}</span>
                              <span>{langOpt.name}</span>
                            </span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-blue-900 stroke-[3]" />}
                          </button>
                        )
                      })}
                    </div>
                  </>
                )}
              </div>

              <button
                onClick={() => setShowServiceModal(true)}
                className="px-2.5 py-1.5 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 flex items-center gap-1 shadow-xs transition-all active:scale-95"
                title="Pedir servilletas, hielo, condimentos"
              >
                <Bell className="w-3.5 h-3.5 text-blue-600" />
                <span className="text-[11px] font-bold">{t('services')}</span>
              </button>
              <CallWaiterButton tableNumber={tableNumber} lang={currentLang} />
            </div>
          </div>
        </header>

        {/* Notificación Toast Flotante */}
        {addedToast && (
          <div className="fixed top-16 inset-x-3 z-50 max-w-md mx-auto p-3 rounded-2xl bg-blue-900 text-white font-bold shadow-2xl flex items-center justify-between animate-in slide-in-from-top duration-300 border border-blue-800">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-blue-300 stroke-[3]" />
              <span className="text-xs">¡{addedToast} {t('addedToCartToast') || 'añadido'}!</span>
            </div>
            <button
              onClick={() => setIsCartOpen(true)}
              className="text-xs underline font-black ml-2 text-amber-300"
            >
              {t('viewCart')}
            </button>
          </div>
        )}

        {/* TRACKER EN VIVO DE ESTADO EN COCINA (Clickeable para ver el camino del pedido) */}
        {tableOrderStatus && (
          <div className="max-w-2xl mx-auto px-3.5 pt-3 w-full">
            {tableOrderStatus === 'preparing' && (
              <div
                onClick={() => setShowTimelineModal(true)}
                className="p-3 rounded-2xl bg-amber-500/10 border border-amber-400/40 text-amber-950 shadow-xs flex items-center justify-between gap-3 animate-in fade-in cursor-pointer hover:bg-amber-500/15 transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center flex-shrink-0 font-black shadow-xs">
                    <Flame className="w-4 h-4 animate-pulse" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-700">
                        {t('tableNumberLabel')} #{tableNumber}
                      </span>
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                    </div>
                    <h4 className="font-extrabold text-xs text-slate-900 leading-tight truncate">
                      {t('orderInKitchenTitle')}
                    </h4>
                    <p className="text-[10px] text-slate-600 mt-0.5 leading-snug">
                      {t('orderPreparingSubtitle')}
                    </p>
                  </div>
                </div>
                <div className="px-2.5 py-1 rounded-xl bg-white border border-amber-300 text-[11px] font-black text-amber-950 flex items-center gap-1 flex-shrink-0 shadow-xs">
                  <span>{t('viewPhases')}</span>
                  <ChevronRight size={12} />
                </div>
              </div>
            )}

            {tableOrderStatus === 'ready' && (
              <div
                onClick={() => setShowTimelineModal(true)}
                className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-400/40 text-emerald-950 shadow-xs flex items-center justify-between gap-3 animate-bounce cursor-pointer hover:bg-emerald-500/15 transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 font-black shadow-xs">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700">
                        {t('tableNumberLabel')} #{tableNumber}
                      </span>
                    </div>
                    <h4 className="font-extrabold text-xs text-emerald-950 leading-tight truncate">
                      {t('orderReadyTitle')}
                    </h4>
                    <p className="text-[10px] text-emerald-800 mt-0.5 leading-snug">
                      {t('orderReadySubtitle')}
                    </p>
                  </div>
                </div>
                <div className="px-2.5 py-1 rounded-xl bg-white border border-emerald-300 text-[11px] font-black text-emerald-950 flex items-center gap-1 flex-shrink-0 shadow-xs">
                  <span>{t('viewPhases')}</span>
                  <ChevronRight size={12} />
                </div>
              </div>
            )}

            {tableOrderStatus === 'pending_validation' && (
              <div
                onClick={() => setShowTimelineModal(true)}
                className="p-3 rounded-2xl bg-amber-500/10 border border-amber-400/50 text-amber-950 shadow-xs flex items-center justify-between gap-3 animate-in fade-in cursor-pointer hover:bg-amber-500/15 transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center flex-shrink-0 font-black shadow-xs animate-pulse">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-800">
                        {t('tableNumberLabel')} #{tableNumber}
                      </span>
                    </div>
                    <h4 className="font-extrabold text-xs text-amber-950 leading-tight truncate">
                      Comanda en espera de validación
                    </h4>
                    <p className="text-[10px] text-amber-800 mt-0.5 leading-snug">
                      El mozo se acercará a tu mesa para confirmar tu comanda antes de marcharla a cocina.
                    </p>
                  </div>
                </div>
                <div className="px-2.5 py-1 rounded-xl bg-white border border-amber-300 text-[11px] font-black text-amber-950 flex items-center gap-1 flex-shrink-0 shadow-xs">
                  <span>En Espera</span>
                  <ChevronRight size={12} />
                </div>
              </div>
            )}

            {tableOrderStatus === 'pending' && (
              <div
                onClick={() => setShowTimelineModal(true)}
                className="p-2.5 rounded-2xl bg-blue-50 border border-blue-200 text-blue-950 text-xs font-semibold flex items-center justify-between gap-2 shadow-xs cursor-pointer hover:bg-blue-100/70 transition-all"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse flex-shrink-0" />
                  <span className="text-[11px]">Comanda validada &middot; En cola de cocina</span>
                </div>
                <div className="flex items-center gap-0.5 text-[10px] font-bold text-blue-800">
                  <span>{t('viewPhases')}</span>
                  <ChevronRight size={12} />
                </div>
              </div>
            )}

            {tableOrderStatus === 'delivered' && (
              <div className="space-y-2">
                <div className="p-3.5 rounded-2xl bg-slate-900 text-white border border-slate-700 shadow-md flex items-center justify-between gap-3 animate-in fade-in">
                  <div 
                    onClick={() => setShowTimelineModal(true)}
                    className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                  >
                    <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center flex-shrink-0 font-black shadow-xs">
                      <UtensilsCrossed className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-extrabold text-xs text-amber-300 leading-tight truncate">
                        {t('orderDeliveredTitle')} #{tableNumber}!
                      </h4>
                      <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">
                        {t('enjoyMeal')}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowDirectBillModal(true)}
                    className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black shadow-sm flex items-center gap-1 whitespace-nowrap flex-shrink-0 transition-transform active:scale-95"
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    <span>{t('billButton')}</span>
                  </button>
                </div>

                {/* SUGERENCIA SUTIL DE SOBREMESA / CAFÉ & POSTRE TRAS SERVIR */}
                <div className="p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-200/80 shadow-xs flex items-center justify-between gap-2 animate-in fade-in duration-300">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-base flex-shrink-0">☕</span>
                    <div className="min-w-0">
                      <span className="text-[11px] font-extrabold text-amber-950 block leading-tight">
                        {t('coffeeDessertPrompt')}
                      </span>
                      <span className="text-[10px] text-amber-800 leading-none">
                        {t('addOneTouchPrompt')}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => {
                        const coffee = products.find(p => p.name.toLowerCase().includes('café') || p.name.toLowerCase().includes('cafe') || p.category_id === 'cat-12') || products[0]
                        if (coffee) handleUpdateProductQuantity(coffee, 1)
                      }}
                      className="px-2.5 py-1 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold shadow-xs transition-all flex items-center gap-1 active:scale-95"
                    >
                      <span>{t('addCoffee')}</span>
                    </button>
                    <button
                      onClick={() => {
                        const dessertCat = categories.find(c => c.name.toUpperCase().includes('POSTRE')) || categories.find(c => c.id === 'cat-10')
                        if (dessertCat) {
                          setSelectedCategory(dessertCat.id)
                        }
                        const catEl = document.getElementById('menu-category-tabs')
                        if (catEl) {
                          catEl.scrollIntoView({ behavior: 'smooth', block: 'start' })
                        }
                      }}
                      className="px-2.5 py-1 rounded-xl bg-white border border-amber-300 hover:bg-amber-100 text-amber-950 text-[11px] font-bold shadow-xs transition-all active:scale-95"
                    >
                      <span>{t('desserts')}</span>
                    </button>
                  </div>
                </div>

                {/* Tarjeta Google Review Booster en Sobremesa */}
                <GoogleReviewBooster
                  restaurantName={restaurant.name}
                  restaurantSlug={restaurant.slug}
                  googleReviewUrl={restaurant.google_review_url}
                  googlePlaceId={restaurant.google_place_id}
                  variant="card"
                />
              </div>
            )}
          </div>
        )}

        {/* 2. CARTA GASTRONÓMICA */}
        <main className="max-w-2xl mx-auto px-3.5 pt-3 space-y-3.5">

          {/* Buscador & Controles de Vista */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('searchPlaceholder')}
                className="w-full pl-9 pr-3 py-2 rounded-2xl bg-white border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 shadow-xs transition-all"
              />
            </div>

            <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 flex-shrink-0">
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-xl transition-all ${
                  viewMode === 'list' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
                title="Vista Carta Detallada"
              >
                <LayoutList className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-xl transition-all ${
                  viewMode === 'grid' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
                title="Vista Galería de Fotos"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Carrusel de Categorías Gastronómicas con Filtros Dietéticos Sutiles */}
          <div id="menu-category-tabs" className="space-y-1.5 scroll-mt-16">
            <div className="flex space-x-1.5 overflow-x-auto no-scrollbar py-0.5 touch-pan-x">
              <button
                onClick={() => {
                  setSelectedCategory('all')
                  setSearchQuery('')
                }}
                className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all flex-shrink-0 ${
                  selectedCategory === 'all'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-200 hover:border-blue-200 shadow-xs'
                }`}
              >
                {t('allCategories')}
              </button>
              {categories.map((category) => {
                const isSelected = selectedCategory === category.id
                return (
                  <button
                    key={category.id}
                    onClick={() => {
                      setSelectedCategory(category.id)
                      setSearchQuery('')
                    }}
                    className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all flex-shrink-0 ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white text-slate-700 border border-slate-200 hover:border-blue-200 shadow-xs'
                    }`}
                  >
                    {translateCategoryName(currentLang, category.name)}
                  </button>
                )
              })}
            </div>

            {/* Píldoras Dietéticas Ultra-Discretas (Sin sobrecargar pantalla) */}
            <div className="flex items-center gap-1.5 px-0.5">
              <span className="text-[10px] text-slate-400 font-semibold">Filtros:</span>
              <button
                onClick={() => setDietaryFilter(prev => prev === 'sintacc' ? 'all' : 'sintacc')}
                className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold transition-all flex items-center gap-1 ${
                  dietaryFilter === 'sintacc'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-white text-slate-500 border border-slate-200 hover:text-slate-800'
                }`}
                title="Filtrar platos aptos Sin TACC"
              >
                <span>🌾 {t('sinTacc')}</span>
                {dietaryFilter === 'sintacc' && <span className="font-black">&times;</span>}
              </button>
              <button
                onClick={() => setDietaryFilter(prev => prev === 'veggie' ? 'all' : 'veggie')}
                className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold transition-all flex items-center gap-1 ${
                  dietaryFilter === 'veggie'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white text-slate-500 border border-slate-200 hover:text-slate-800'
                }`}
                title="Filtrar platos vegetarianos"
              >
                <span>🌱 {t('veggie')}</span>
                {dietaryFilter === 'veggie' && <span className="font-black">&times;</span>}
              </button>
            </div>
          </div>

          {/* SUGERENCIA INTELIGENTE DEL CHEF SEGÚN CATEGORÍA */}
          {selectedCategory === 'cat-1' || selectedCategory === 'all' ? (
            <div className="p-3 bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-2xl shadow-xs flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center flex-shrink-0 font-black shadow-xs">
                <Sparkles size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 block">
                  Recomendado para Comenzar
                </span>
                <p className="text-xs text-slate-100 font-semibold leading-tight mt-0.5">
                  Prueba nuestro Combo Pareja con 2 Dobles Monster y 2 Pintas bien frías.
                </p>
              </div>
            </div>
          ) : selectedCategory === 'cat-7' ? (
            <div className="p-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-2xl shadow-xs flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-white text-slate-950 flex items-center justify-center flex-shrink-0 font-black shadow-xs">
                <Flame size={16} className="text-orange-600" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-950 block">
                  Tip del Chef para Burgers
                </span>
                <p className="text-xs text-white font-bold leading-tight mt-0.5">
                  Pídela a Punto y acompáñala con Bastones de Mozzarella o una IPA Tirada.
                </p>
              </div>
            </div>
          ) : null}

          {/* Listado de Platos con Skeleton Screens de Carga */}
          {products.length === 0 ? (
            <div className="space-y-3 animate-pulse">
              {[1, 2, 3, 4].map(idx => (
                <div key={idx} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs flex items-center justify-between gap-3">
                  <div className="w-14 h-14 bg-slate-200 rounded-xl flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 bg-slate-200 rounded w-3/4" />
                    <div className="h-3 bg-slate-100 rounded w-1/3" />
                  </div>
                  <div className="w-8 h-8 bg-slate-100 rounded-xl flex-shrink-0" />
                </div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-16 text-slate-400 space-y-2 bg-white rounded-3xl border border-slate-200 p-8 shadow-xs">
              <Utensils className="w-12 h-12 mx-auto stroke-[1.2] text-slate-300" />
              <p className="text-sm font-semibold text-slate-600">
                {searchQuery ? 'No encontramos platos con esa búsqueda' : 'No hay platos en esta categoría'}
              </p>
            </div>
          ) : viewMode === 'list' ? (
            /* VISTA 1: LISTADO MODERNO CON JERARQUÍA ELEGANTE Y ESPACIO HOLGADO */
            <div className="space-y-2.5">
              {filteredProducts.map((product) => {
                const qty = getProductQuantityInCart(product.id)
                const isExpanded = Boolean(expandedProductIds[product.id])

                return (
                  <div
                    key={product.id}
                    className="bg-white rounded-2xl ambient-card gpu-layer smooth-spring overflow-hidden"
                  >
                    {/* FILA PRINCIPAL */}
                    <div
                      onClick={() => toggleExpand(product.id)}
                      className="p-3.5 flex items-center justify-between gap-3 cursor-pointer select-none"
                    >
                      {/* Miniatura si no está expandido */}
                      {product.image_url && !isExpanded && (
                        <div
                          style={{ position: 'relative', width: '58px', height: '58px', minWidth: '58px', minHeight: '58px', overflow: 'hidden', borderRadius: '14px' }}
                          className="bg-slate-100 shimmer-loading flex-shrink-0 border border-slate-100 transition-opacity duration-300"
                        >
                          <Image
                            src={product.image_url}
                            alt={product.name}
                            fill
                            className="object-cover"
                            sizes="58px"
                            loading="lazy"
                          />
                        </div>
                      )}

                      {/* TÍTULO Y PRECIO EN LÍNEAS SEPARADAS (ESPACIO HOLGADO) */}
                      <div className="flex-1 min-w-0 pr-1 space-y-0.5">
                        <h3 className="font-extrabold text-slate-900 text-xs sm:text-sm leading-snug line-clamp-2">
                          {translateProductName(currentLang, product.id, product.name)}
                        </h3>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-black text-xs sm:text-sm text-blue-700 tabular-nums">
                            {product.price_type === 'weight'
                              ? `${formatCurrency(product.price)} / ${product.price_unit || '100g'}`
                              : formatCurrency(product.price)}
                          </span>
                          {product.price_type === 'weight' && (
                            <span className="px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-900 text-[10px] font-extrabold border border-blue-200">
                              ⚖️ {t('byWeight')}
                            </span>
                          )}
                        </div>
                        {product.description && (
                          <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                            {translateProductDescription(currentLang, product.id, product.description)}
                          </p>
                        )}
                      </div>

                      {/* Control de Cantidad Inline */}
                      <div className="flex items-center gap-1.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                        {qty === 0 ? (
                          <button
                            onClick={(e) => handleUpdateProductQuantity(product, 1, e)}
                            className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-700 hover:text-white flex items-center justify-center transition-colors border border-blue-100/80 smooth-press shadow-xs"
                            title="Añadir a la comanda"
                          >
                            <Plus size={16} />
                          </button>
                        ) : (
                          <div className="flex items-center space-x-1 bg-blue-50/90 p-0.5 rounded-xl border border-blue-100 animate-in zoom-in-95 duration-150">
                            <button
                              onClick={(e) => handleUpdateProductQuantity(product, -1, e)}
                              className="w-6 h-6 rounded-lg bg-white text-blue-700 flex items-center justify-center shadow-xs hover:bg-blue-100 transition-colors smooth-press"
                            >
                              <Minus size={11} />
                            </button>
                            <span className="text-xs font-black text-blue-900 px-1 animate-pop tabular-nums">{qty}</span>
                            <button
                              onClick={(e) => handleUpdateProductQuantity(product, 1, e)}
                              className="w-6 h-6 rounded-lg bg-blue-700 text-white flex items-center justify-center shadow-xs hover:bg-blue-800 transition-colors smooth-press"
                            >
                              <Plus size={11} />
                            </button>
                          </div>
                        )}

                        <button
                          onClick={() => toggleExpand(product.id)}
                          className={`p-1 text-slate-400 hover:text-slate-700 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                            isExpanded ? 'rotate-180 text-blue-700' : ''
                          }`}
                          title="Ver foto y detalles"
                        >
                          <ChevronDown size={16} />
                        </button>
                      </div>
                    </div>

                    {/* SECCIÓN DESPLEGABLE CON ANIMACIÓN SUAVE Y FLUIDA */}
                    <div
                      className={`grid transition-all duration-350 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                        isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                      }`}
                    >
                      <div className="overflow-hidden">
                        <div className="px-3.5 pb-3.5 pt-1 border-t border-slate-100 space-y-3 bg-slate-50/50">
                          {product.image_url && (
                            <div
                              style={{ position: 'relative', width: '100%', height: '200px', maxHeight: '240px', overflow: 'hidden', borderRadius: '14px' }}
                              className="bg-slate-100 shimmer-loading border border-slate-200 shadow-inner"
                            >
                              <Image
                                src={product.image_url}
                                alt={product.name}
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 100vw, 600px"
                              />
                            </div>
                          )}

                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                            <button
                              onClick={() => setCustomizingProduct(product)}
                              className="w-full sm:auto px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-bold transition-all shadow-xs text-center"
                            >
                              {t('customize')}
                            </button>

                            <button
                              onClick={() => handleUpdateProductQuantity(product, 1)}
                              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-black shadow-md flex items-center justify-center gap-1.5 transition-transform active:scale-95"
                            >
                              <Plus size={14} className="stroke-[3]" />
                              <span>{t('addToCart')}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            /* VISTA 2: GALERÍA DE FOTOS */
            <div className="grid grid-cols-2 gap-3">
              {filteredProducts.map((product) => {
                const qty = getProductQuantityInCart(product.id)
                return (
                  <div
                    key={product.id}
                    className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
                  >
                    <div>
                      {product.image_url && (
                        <div
                          style={{ position: 'relative', width: '100%', height: '120px', overflow: 'hidden' }}
                          className="bg-slate-100 shimmer-loading"
                        >
                          <Image
                            src={product.image_url}
                            alt={product.name}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 50vw, 300px"
                          />
                        </div>
                      )}
                      <div className="p-3.5 space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-bold text-slate-900 text-xs sm:text-sm leading-snug">
                            {translateProductName(currentLang, product.id, product.name)}
                          </h3>
                          <span className="font-black text-xs sm:text-sm text-blue-700 flex-shrink-0 tabular-nums">
                            {product.price_type === 'weight'
                              ? `${formatCurrency(product.price)} / ${product.price_unit || '100g'}`
                              : formatCurrency(product.price)}
                          </span>
                        </div>
                        {product.description && (
                          <p className="text-[11px] text-slate-500 font-normal line-clamp-2 leading-relaxed">
                            {translateProductDescription(currentLang, product.id, product.description)}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="p-3.5 pt-0 flex items-center justify-between gap-2">
                      <button
                        onClick={() => setCustomizingProduct(product)}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                      >
                        {t('customize')}
                      </button>

                      <div className="flex items-center">
                        {qty === 0 ? (
                          <button
                            onClick={(e) => handleUpdateProductQuantity(product, 1, e)}
                            className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white flex items-center justify-center transition-colors border border-blue-100/80 shadow-xs"
                          >
                            <Plus size={16} />
                          </button>
                        ) : (
                          <div className="flex items-center space-x-1 bg-blue-50/90 p-0.5 rounded-xl border border-blue-100">
                            <button
                              onClick={(e) => handleUpdateProductQuantity(product, -1, e)}
                              className="w-6 h-6 rounded-lg bg-white text-blue-700 flex items-center justify-center shadow-xs"
                            >
                              <Minus size={11} />
                            </button>
                            <span className="text-xs font-black text-blue-900 px-1">{qty}</span>
                            <button
                              onClick={(e) => handleUpdateProductQuantity(product, 1, e)}
                              className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs"
                            >
                              <Plus size={11} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Footer Legal Informativo: Alérgenos, Precios con IVA y Aviso Sanitario Anisakis */}
          <footer className="pt-6 pb-24 text-center space-y-2">
            <div className="p-3.5 bg-white rounded-2xl border border-slate-200/80 text-[11px] text-slate-500 shadow-xs space-y-1.5 text-left">
              <p className="font-bold text-slate-800 flex items-center gap-1.5">
                <span>ℹ️</span> <span>Información al Consumidor</span>
              </p>
              <p className="text-[10px] text-slate-500 leading-relaxed">
                {t('legalNotice')}
              </p>
              <div className="pt-1.5 border-t border-slate-100">
                <p className="text-[9px] text-slate-400 leading-relaxed">
                  🐟 <span className="font-semibold">{t('anisakisNotice')}</span>
                </p>
              </div>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowLegalModal(true)}
                  className="text-[10px] font-bold text-blue-900 hover:text-blue-700 underline flex items-center gap-1"
                >
                  🔒 Aviso Legal, Privacidad (RGPD) y Cookies
                </button>
                <span className="text-[9px] text-slate-400 font-medium">Fluxo &mdash; Sistema Gastronómico</span>
              </div>
            </div>
          </footer>
        </main>

        {/* 3. Barra Flotante Inferior de Comanda (Mobile-First) */}
        {totalCartCount > 0 && (
          <div className="fixed bottom-3 inset-x-3 sm:bottom-4 sm:inset-x-4 max-w-xl mx-auto z-40 gpu-layer">
            <div className="bg-slate-900/95 backdrop-blur-md text-white p-3 sm:p-3.5 rounded-2xl shadow-[0_12px_36px_rgba(15,23,42,0.35)] flex items-center justify-between border border-slate-800 animate-in slide-in-from-bottom duration-350 ease-[cubic-bezier(0.16,1,0.3,1)]">
              <div className="flex items-center space-x-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-600/30 flex-shrink-0 animate-pop">
                  <ShoppingBag size={16} />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] text-slate-400 font-medium truncate">
                    {totalCartCount} {totalCartCount === 1 ? (t('itemSingle') || 'ítem') : (t('items') || 'ítems')} &middot; {t('tableNumberLabel')} #{tableNumber}
                  </div>
                  <div className="text-sm sm:text-base font-black text-amber-300 tabular-nums">
                    {formatCurrency(totalCartAmount)}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setIsCartOpen(true)}
                className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl text-xs font-extrabold flex items-center space-x-1 transition-all shadow-md shadow-blue-600/30 smooth-press flex-shrink-0"
              >
                <span>{t('viewCart')}</span>
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}

        {/* Modal de Personalización (Píldoras + Notas libres) */}
        <ProductModifierModal
          product={customizingProduct}
          onClose={() => setCustomizingProduct(null)}
          onConfirm={handleAddCustomized}
          lang={currentLang}
        />

        {/* Visor 3D */}
        <Product3DModal
          product={selected3DProduct}
          onClose={() => setSelected3DProduct(null)}
        />

        {/* Modal de Micro-Servicios a la Mesa */}
        {showServiceModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
            <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-blue-600" />
                  <h3 className="font-extrabold text-sm text-slate-900">
                    Micro-Servicios para Mesa #{tableNumber}
                  </h3>
                </div>
                <button
                  onClick={() => setShowServiceModal(false)}
                  className="p-1.5 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
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
                ].map((serv) => (
                  <button
                    key={serv.name}
                    onClick={() => handleRequestMicroService(serv.name)}
                    className="p-3 rounded-2xl bg-slate-50 hover:bg-blue-50 border border-slate-200/80 hover:border-blue-300 text-left transition-all flex flex-col justify-between gap-1 shadow-xs active:scale-95"
                  >
                    <span className="text-xl">{serv.icon}</span>
                    <span className="font-bold text-xs text-slate-900">{serv.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Toast de Micro-Servicio Enviado */}
        {serviceRequestedToast && (
          <div className="fixed top-16 inset-x-3 z-50 max-w-md mx-auto p-3 rounded-2xl bg-emerald-700 text-white font-bold shadow-2xl flex items-center justify-between animate-in slide-in-from-top duration-300 border border-emerald-600">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-200 stroke-[3]" />
              <span className="text-xs">¡Solicitado {serviceRequestedToast} para Mesa #{tableNumber}!</span>
            </div>
          </div>
        )}

        {/* Drawer del Carrito */}
        <CartDrawer
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          cart={cart}
          onUpdateQuantity={(index, newQty) => {
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
          onRemoveItem={(index) => setCart(prev => prev.filter((_, idx) => idx !== index))}
          onClearCart={() => setCart([])}
          tableNumber={tableNumber}
          sessionId={sessionId}
          lang={currentLang}
          products={products}
          onAddProduct={(product) => {
            handleUpdateProductQuantity(product, 1)
          }}
          canRequestBill={Boolean(tableOrderStatus && !isTablePaid)}
          onAddSuggestedDrink={(drinkId) => {
            const drink = products.find(p => p.id === drinkId)
            if (drink) {
              handleUpdateProductQuantity(drink, 1)
            }
          }}
          onAddSuggestedDessert={(dessertId) => {
            const dessert = products.find(p => p.id === dessertId)
            if (dessert) {
              handleUpdateProductQuantity(dessert, 1)
            }
          }}
        />

        {/* Modal de Seguimiento / Timeline del Pedido */}
        <OrderTimelineModal
          isOpen={showTimelineModal}
          onClose={() => setShowTimelineModal(false)}
          tableNumber={tableNumber}
          status={tableOrderStatus}
          onRequestService={() => setShowServiceModal(true)}
          onRequestBill={() => setShowDirectBillModal(true)}
        />

        {/* Modal Directo de Pedir la Cuenta con Google Review Booster */}
        <BillModal
          isOpen={showDirectBillModal}
          onClose={() => setShowDirectBillModal(false)}
          tableNumber={tableNumber}
          slug={restaurant.slug}
          restaurantName={restaurant.name}
          googleReviewUrl={restaurant.google_review_url}
          googlePlaceId={restaurant.google_place_id}
          totalAmount={tableTotalAmount}
        />

        {/* Modal Legal y RGPD */}
        <LegalModal
          isOpen={showLegalModal}
          onClose={() => setShowLegalModal(false)}
          restaurantName={restaurant.name}
        />

        {/* SEO Semántico Gastronómico Schema.org/Restaurant + Menu */}
        <RestaurantJsonLd
          restaurant={restaurant}
          categories={categories}
          products={products}
        />

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
