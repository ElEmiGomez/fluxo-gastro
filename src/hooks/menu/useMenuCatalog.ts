'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { Product, Category, Restaurant, Table } from '@/types/database.types'
import { MOCK_RESTAURANTS, MOCK_CATEGORIES, MOCK_PRODUCTS, MOCK_TABLES } from '@/lib/supabase/mock-fallback'
import { createBrowserClient } from '@/lib/supabase/client'
import { deduplicateProducts, resolveCanonicalProductId, isProductInCategory } from '@/lib/category-matcher'
import { triggerHaptic, HAPTIC_PATTERNS } from '@/lib/haptic'
import { DietaryFilter, ViewMode } from '@/types/menu.types'

interface UseMenuCatalogParams {
  slug: string
  isInSituAdmin: boolean
}

export function useMenuCatalog({ slug, isInSituAdmin }: UseMenuCatalogParams) {
  const [restaurant, setRestaurant] = useState<Restaurant>(() => MOCK_RESTAURANTS[slug] || MOCK_RESTAURANTS['burger-gourmet'])
  const [categories, setCategories] = useState<Category[]>(() => MOCK_CATEGORIES[slug] || [])
  const [products, setProducts] = useState<Product[]>(() => deduplicateProducts(MOCK_PRODUCTS[slug] || []))
  const [tables, setTables] = useState<Table[]>(() => MOCK_TABLES[slug] || [])

  const [currentLang, setCurrentLang] = useState<string>('gl')
  const [showLangDropdown, setShowLangDropdown] = useState(false)

  const [selectedCategory, setSelectedCategory] = useState<string>(() => MOCK_CATEGORIES[slug]?.[0]?.id || 'cat-1')
  const [searchQuery, setSearchQuery] = useState('')
  const [dietaryFilter, setDietaryFilter] = useState<DietaryFilter>('all')
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [expandedProductIds, setExpandedProductIds] = useState<Record<string, boolean>>({})

  // Navegación horizontal de categorías
  const categoryTabsRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const updateScrollButtons = useCallback(() => {
    const el = categoryTabsRef.current
    if (!el) return
    const { scrollLeft, scrollWidth, clientWidth } = el
    setCanScrollLeft(scrollLeft > 6)
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 6)
  }, [])

  const handleScrollCategories = useCallback((direction: 'left' | 'right') => {
    const el = categoryTabsRef.current
    if (!el) return
    const scrollAmount = 220
    const maxScroll = el.scrollWidth - el.clientWidth

    if (direction === 'left') {
      const target = el.scrollLeft - scrollAmount
      if (target <= 40) {
        el.scrollTo({ left: 0, behavior: 'smooth' })
      } else {
        el.scrollBy({ left: -scrollAmount, behavior: 'smooth' })
      }
    } else {
      const target = el.scrollLeft + scrollAmount
      if (target >= maxScroll - 40) {
        el.scrollTo({ left: maxScroll, behavior: 'smooth' })
      } else {
        el.scrollBy({ left: scrollAmount, behavior: 'smooth' })
      }
    }
    triggerHaptic(HAPTIC_PATTERNS.TAP)
    setTimeout(updateScrollButtons, 350)
  }, [updateScrollButtons])

  useEffect(() => {
    updateScrollButtons()
    const timer = setTimeout(updateScrollButtons, 400)
    window.addEventListener('resize', updateScrollButtons)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', updateScrollButtons)
    }
  }, [categories, updateScrollButtons])

  // Carga de datos de carta
  const loadData = useCallback(async () => {
    try {
      const menuRes = await fetch(`/api/admin/menu?slug=${slug}&_t=${Date.now()}`, { cache: 'no-store' }).then(r => r.json())
      if (menuRes.success) {
        if (menuRes.restaurant) setRestaurant(menuRes.restaurant)
        if (menuRes.categories && menuRes.categories.length > 0) {
          setCategories(menuRes.categories)
          setSelectedCategory(prev => {
            if (prev === 'all') return 'all'
            const exists = menuRes.categories.some((c: Category) => c.id === prev)
            return exists ? prev : menuRes.categories[0].id
          })
        }
        if (Array.isArray(menuRes.products)) {
          setProducts(deduplicateProducts(menuRes.products))
        }
        const tablesFallback = MOCK_TABLES[slug] || []
        setTables(tablesFallback)
        return
      }
    } catch (e) {
      console.log('Error fetching dynamic menu, checking Supabase/mock:', e)
    }

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
            const normalizedCats = catData.map(c => ({
              ...c,
              name: c.name?.toUpperCase().trim() === 'GIN & BEBIDAS' ? 'Bebidas' : c.name,
            }))
            const hasDesserts = normalizedCats.some((c: any) => {
              const u = (c.name || '').toUpperCase()
              return u.includes('POSTRE') || u.includes('CAFÉ') || c.id === 'c0000000-0000-0000-0000-000000000006'
            })
            if (!hasDesserts) {
              normalizedCats.push({
                id: 'c0000000-0000-0000-0000-000000000006',
                restaurant_id: restData.id,
                name: 'POSTRES & CAFÉ',
                order_index: normalizedCats.length + 1,
              })
            }
            setCategories(normalizedCats)
            setSelectedCategory(normalizedCats[0].id)
          }

          const { data: prodData } = await supabase
            .from('products')
            .select('*')
            .eq('restaurant_id', restData.id)

          if (prodData && prodData.length > 0) {
            setProducts(prev => {
              const deduped = deduplicateProducts(prodData)
              const prevPausedMap = new Map(prev.map(p => [resolveCanonicalProductId(p.id) || p.id, p.is_available]))
              return deduped.map(p => {
                const canon = resolveCanonicalProductId(p.id) || p.id
                if (prevPausedMap.get(canon) === false || prevPausedMap.get(p.id) === false) {
                  return { ...p, is_available: false }
                }
                return p
              })
            })
          }

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
  }, [slug])

  // Sincronización cross-tab y eventos de carta
  useEffect(() => {
    loadData()

    let menuBc: BroadcastChannel | null = null
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        menuBc = new BroadcastChannel('fluxo_menu_channel')
        menuBc.onmessage = (event) => {
          const { type, slug: evtSlug, productId, isAvailable } = event.data || {}
          if (type === 'menu_updated' && (!evtSlug || evtSlug === slug)) {
            if (productId && isAvailable !== undefined) {
              const canonical = resolveCanonicalProductId(productId) || productId
              setProducts(prev => prev.map(p => {
                const pCanon = resolveCanonicalProductId(p.id) || p.id
                if (p.id === productId || p.id === canonical || pCanon === canonical) {
                  return { ...p, is_available: isAvailable }
                }
                return p
              }))
              return
            }
            loadData()
          }
        }
      }
    } catch {}

    const handleMenuUpdated = (e: any) => {
      const { slug: updatedSlug, productId, isAvailable } = e?.detail || {}
      if (!updatedSlug || updatedSlug === slug) {
        if (productId && isAvailable !== undefined) {
          const canonical = resolveCanonicalProductId(productId) || productId
          setProducts(prev => prev.map(p => {
            const pCanon = resolveCanonicalProductId(p.id) || p.id
            if (p.id === productId || p.id === canonical || pCanon === canonical) {
              return { ...p, is_available: isAvailable }
            }
            return p
          }))
          return
        }
        loadData()
      }
    }

    window.addEventListener('fluxo_menu_updated', handleMenuUpdated)
    return () => {
      if (menuBc) {
        try { menuBc.close() } catch {}
      }
      window.removeEventListener('fluxo_menu_updated', handleMenuUpdated)
    }
  }, [loadData, slug])

  // Detección automática de idioma
  useEffect(() => {
    if (typeof window !== 'undefined') {
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
      } catch {}
    }
  }, [])

  const toggleExpand = (productId: string) => {
    setExpandedProductIds(prev => ({
      ...prev,
      [productId]: !prev[productId]
    }))
  }

  // Filtrado reactivo de platos
  const filteredProducts = useMemo(() => {
    return products.filter(prod => {
      if (!isInSituAdmin && prod.is_available === false) {
        return false
      }

      const matchesCategory = isProductInCategory(prod, selectedCategory, categories)
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
  }, [products, isInSituAdmin, selectedCategory, categories, searchQuery, dietaryFilter])

  return {
    restaurant,
    categories,
    products,
    setProducts,
    tables,
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
  }
}
