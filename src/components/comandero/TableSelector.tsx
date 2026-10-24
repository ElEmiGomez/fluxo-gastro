'use client'

import React, { useRef, useState, useCallback, useEffect } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Sparkles,
  Hash,
  Package,
  Wine,
  Salad,
  UtensilsCrossed,
  Cake,
  Bell,
  Receipt,
  UserCheck,
} from 'lucide-react'
import { Table, Order, OrderItem } from '@/types/database.types'
import { PendingServiceCall } from '@/types/comandero.types'
import {
  isDrinkItem,
  isDrinkServed,
  isStarterItem,
  isStarterReady,
  isStarterServed,
  isMainItem,
  isMainCooking,
  isMainReady,
  isMainServed,
  isMainFired,
  isDessertItem,
  isDessertCooking,
  isDessertReady,
  isDessertServed,
  isDessertFired,
  TAG_MAIN_FIRED,
  TAG_DESSERT_FIRED,
} from '@/lib/course-utils'

export type TableStatusType = 'free' | 'busy' | 'calling' | 'ready'

interface TableSelectorProps {
  tables: Table[]
  selectedTable: number | string | null
  tableStatuses?: Record<string | number, TableStatusType>
  tableDwellMinutes?: Record<string | number, number>
  serverOrders?: Order[]
  pendingCalls?: PendingServiceCall[]
  onSelectTable: (table: Table) => void
  onOpenQuickStock?: () => void
  pausedItemsCount?: number
}

interface TableCourseBadges {
  hasDrinks: boolean
  drinksPendingValidation: boolean
  drinksPending: boolean
  drinksServed: boolean
  hasStarters: boolean
  startersPendingValidation: boolean
  startersReady: boolean
  startersCooking: boolean
  startersServed: boolean
  hasMains: boolean
  mainsPendingValidation: boolean
  mainsReady: boolean
  mainsCooking: boolean
  mainsWaiting: boolean
  mainsServed: boolean
  hasDesserts: boolean
  dessertsPendingValidation: boolean
  dessertsReady: boolean
  dessertsCooking: boolean
  dessertsWaiting: boolean
  dessertsServed: boolean
}

function computeTableCourseBadges(tableOrders: Order[]): TableCourseBadges {
  const activeOrders = tableOrders.filter(o => o.status !== 'cancelled' && o.status !== 'paid')
  const approvedOrders = activeOrders.filter(o => o.status !== 'pending_validation')
  const unapprovedOrders = activeOrders.filter(o => o.status === 'pending_validation')

  const allItems = activeOrders.flatMap(o => o.order_items || [])
  const approvedItems = approvedOrders.flatMap(o => o.order_items || [])
  const unapprovedItems = unapprovedOrders.flatMap(o => o.order_items || [])

  // Helper para resolver la comanda padre de un ítem
  const getParentOrder = (item: OrderItem) =>
    approvedOrders.find(o => (o.order_items || []).some(it => it === item || it.id === item.id)) ||
    activeOrders.find(o => (o.order_items || []).some(it => it === item || it.id === item.id))

  // 1. Bebidas (Barra)
  const drinks = allItems.filter(isDrinkItem)
  const hasDrinks = drinks.length > 0
  const approvedDrinks = approvedItems.filter(isDrinkItem)
  const unapprovedDrinks = unapprovedItems.filter(isDrinkItem)
  const drinksPending = approvedDrinks.some(d => !isDrinkServed(d))
  const drinksPendingValidation = unapprovedDrinks.length > 0 && !drinksPending
  const drinksServed = approvedDrinks.length > 0 && approvedDrinks.every(isDrinkServed)

  // 2. Entradas (Papitas / 1º Pase)
  const starters = allItems.filter(isStarterItem)
  const hasStarters = starters.length > 0
  const approvedStarters = approvedItems.filter(isStarterItem)
  const unapprovedStarters = unapprovedItems.filter(isStarterItem)
  const startersReady = approvedStarters.some(s => isStarterReady(s) && !isStarterServed(s, getParentOrder(s)))
  const startersServed = approvedStarters.length > 0 && approvedStarters.every(s => isStarterServed(s, getParentOrder(s)))
  const startersCooking = approvedStarters.length > 0 && !startersReady && !startersServed
  const startersPendingValidation = unapprovedStarters.length > 0 && !startersReady && !startersCooking

  // 3. Platos Principales (Comida / 2º Pase)
  const mains = allItems.filter(isMainItem)
  const hasMains = mains.length > 0
  const approvedMains = approvedItems.filter(isMainItem)
  const unapprovedMains = unapprovedItems.filter(isMainItem)
  const mainsReady = approvedMains.some(m => isMainReady(m) && !isMainServed(m, getParentOrder(m)))
  const mainsServed = approvedMains.length > 0 && approvedMains.every(m => isMainServed(m, getParentOrder(m)))
  const orderLevelMainsFired = approvedOrders.some(
    o => (o as any).notes?.includes(TAG_MAIN_FIRED) || (o as any).kitchen_notes?.includes(TAG_MAIN_FIRED)
  )
  const mainsCooking =
    approvedMains.length > 0 &&
    !mainsReady &&
    !mainsServed &&
    (orderLevelMainsFired || approvedMains.some(m => isMainCooking(m) || isMainFired(m)))
  const mainsPendingValidation = unapprovedMains.length > 0 && !mainsReady && !mainsCooking && !mainsServed
  const mainsWaiting = hasMains && !mainsPendingValidation && !mainsReady && !mainsServed && !mainsCooking

  // 4. Postres
  const desserts = allItems.filter(isDessertItem)
  const hasDesserts = desserts.length > 0
  const approvedDesserts = approvedItems.filter(isDessertItem)
  const unapprovedDesserts = unapprovedItems.filter(isDessertItem)
  const dessertsReady = approvedDesserts.some(d => isDessertReady(d) && !isDessertServed(d, getParentOrder(d)))
  const dessertsServed = approvedDesserts.length > 0 && approvedDesserts.every(d => isDessertServed(d, getParentOrder(d)))
  const orderLevelDessertsFired = approvedOrders.some(
    o => (o as any).notes?.includes(TAG_DESSERT_FIRED) || (o as any).kitchen_notes?.includes(TAG_DESSERT_FIRED)
  )
  const dessertsCooking =
    approvedDesserts.length > 0 &&
    !dessertsReady &&
    !dessertsServed &&
    (orderLevelDessertsFired || approvedDesserts.some(d => isDessertCooking(d) || isDessertFired(d)))
  const dessertsPendingValidation = unapprovedDesserts.length > 0 && !dessertsReady && !dessertsCooking && !dessertsServed
  const dessertsWaiting = hasDesserts && !dessertsPendingValidation && !dessertsReady && !dessertsServed && !dessertsCooking

  return {
    hasDrinks,
    drinksPendingValidation,
    drinksPending,
    drinksServed,
    hasStarters,
    startersPendingValidation,
    startersReady,
    startersCooking,
    startersServed,
    hasMains,
    mainsPendingValidation,
    mainsReady,
    mainsCooking,
    mainsWaiting,
    mainsServed,
    hasDesserts,
    dessertsPendingValidation,
    dessertsReady,
    dessertsCooking,
    dessertsWaiting,
    dessertsServed,
  }
}

export function TableSelector({
  tables,
  selectedTable,
  tableStatuses = {},
  tableDwellMinutes = {},
  serverOrders = [],
  pendingCalls = [],
  onSelectTable,
  onOpenQuickStock,
  pausedItemsCount = 0,
}: TableSelectorProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [searchTableNum, setSearchTableNum] = useState('')
  const [showSearchInput, setShowSearchInput] = useState(false)
  const [filterAttentionOnly, setFilterAttentionOnly] = useState(false)

  // Garantizar que siempre existan las 25 mesas aunque los datos remotos estén cargando
  const effectiveTables =
    tables && tables.length > 0
      ? tables
      : Array.from({ length: 25 }, (_, i) => ({
          id: `tbl-fallback-${i + 1}`,
          restaurant_id: 'default',
          table_number: i + 1,
        }))

  const currentStatus = selectedTable ? tableStatuses[selectedTable] || 'free' : 'free'

  // Contar mesas con llamadas activas o platos listos para servir
  const attentionCount = effectiveTables.filter(
    t => tableStatuses[t.table_number] === 'calling' || tableStatuses[t.table_number] === 'ready'
  ).length

  // Control de desvanecimiento progresivo en bordes (fade mask)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const updateScrollFade = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const { scrollLeft, scrollWidth, clientWidth } = el
    const nextLeft = scrollLeft > 6
    const nextRight = scrollLeft < scrollWidth - clientWidth - 6
    setCanScrollLeft(prev => (prev !== nextLeft ? nextLeft : prev))
    setCanScrollRight(prev => (prev !== nextRight ? nextRight : prev))
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    updateScrollFade()
    el.addEventListener('scroll', updateScrollFade, { passive: true })
    window.addEventListener('resize', updateScrollFade)
    return () => {
      el.removeEventListener('scroll', updateScrollFade)
      window.removeEventListener('resize', updateScrollFade)
    }
  }, [updateScrollFade])

  // Desplazamiento suave con flechas de navegación para PC y móvil
  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -280 : 280
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' })
      setTimeout(updateScrollFade, 350)
    }
  }

  // Filtrado o búsqueda rápida de mesas
  let filteredTables =
    searchTableNum.trim() === ''
      ? effectiveTables
      : effectiveTables.filter(t => t.table_number.toString().includes(searchTableNum.trim()))

  if (filterAttentionOnly) {
    filteredTables = filteredTables.filter(
      t => tableStatuses[t.table_number] === 'calling' || tableStatuses[t.table_number] === 'ready'
    )
  }

  return (
    <div className="bg-white border-b border-slate-200 py-2.5 px-3 sm:px-4 shadow-sm select-none" style={{ touchAction: 'manipulation' }}>
      {/* BARRA SUPERIOR: TÍTULO, LEYENDA Y ESTADO */}
      <div className="max-w-7xl mx-auto flex items-center justify-between mb-2 gap-2 flex-wrap">
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1">
            <Hash className="w-3.5 h-3.5 text-blue-900" />
            <span>Salón de Mesas</span>
          </span>

          {/* Leyenda de Semáforo y Fases */}
          <div className="hidden md:flex items-center gap-2 text-[10px] text-slate-500 font-bold bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-slate-300" /> Libre
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-600" /> Ocupada
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-teal-600" /> Pagada (Por Levantar)
            </span>
            <span className="flex items-center gap-1 text-cyan-600">
              <Wine className="w-2.5 h-2.5" /> Bebida
            </span>
            <span className="flex items-center gap-1 text-emerald-600">
              <Salad className="w-2.5 h-2.5" /> Entrada
            </span>
            <span className="flex items-center gap-1 text-blue-600">
              <UtensilsCrossed className="w-2.5 h-2.5" /> Principal
            </span>
            <span className="flex items-center gap-1 text-purple-600">
              <Cake className="w-2.5 h-2.5" /> Postre
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-400" /> Aviso
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> Listo
            </span>
          </div>
        </div>

        {/* Info de Mesa Seleccionada y Buscador */}
        <div className="flex items-center gap-2">
          {/* Botón Filtro Rápido: Solo Mesas Pendientes de Atención */}
          {attentionCount > 0 && (
            <button
              type="button"
              onClick={() => setFilterAttentionOnly(prev => !prev)}
              className={`px-2.5 py-1 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-xs border active:scale-95 cursor-pointer ${
                filterAttentionOnly
                  ? 'bg-amber-500 text-slate-950 border-amber-600 ring-2 ring-amber-400'
                  : 'bg-amber-100 hover:bg-amber-200 text-amber-950 border-amber-300'
              }`}
              title={filterAttentionOnly ? 'Ver todas las mesas del salón' : 'Ver solo mesas con avisos o platos listos'}
            >
              <span className="w-2 h-2 rounded-full bg-amber-600 animate-ping flex-shrink-0" />
              <span>🔔 Solo Pendientes ({attentionCount})</span>
            </button>
          )}

          {/* Botón / Input de búsqueda rápida de mesa */}
          {showSearchInput ? (
            <div className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-xl border border-slate-300">
              <Search className="w-3.5 h-3.5 text-slate-500" />
              <input
                type="number"
                value={searchTableNum}
                onChange={e => setSearchTableNum(e.target.value)}
                placeholder="# mesa..."
                className="w-16 bg-transparent text-xs font-bold text-slate-900 focus:outline-none"
                autoFocus
                onBlur={() => {
                  if (!searchTableNum) setShowSearchInput(false)
                }}
              />
              {searchTableNum && (
                <button
                  onClick={() => setSearchTableNum('')}
                  className="text-slate-400 hover:text-slate-700 text-xs font-bold px-1"
                >
                  &times;
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={() => setShowSearchInput(true)}
              className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold flex items-center gap-1 transition-colors border border-slate-200 cursor-pointer"
              title="Buscar mesa por número"
            >
              <Search className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px]">Buscar</span>
            </button>
          )}

          {/* Botón Control Rápido de Stock ("Se Agotó") */}
          {onOpenQuickStock && (
            <button
              type="button"
              onClick={onOpenQuickStock}
              className="px-2.5 py-1 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-xs border bg-slate-900 hover:bg-slate-800 text-white active:scale-95 cursor-pointer"
              title="Pausar o reactivar platos de la carta cuando se acabe un ingrediente"
            >
              <Package className="w-3.5 h-3.5 text-amber-400 stroke-[2.5]" />
              <span>Stock</span>
              {pausedItemsCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-black">
                  {pausedItemsCount}
                </span>
              )}
            </button>
          )}

          {selectedTable && (() => {
              const activeForSelected = (serverOrders || []).filter(
                o =>
                  (o.table_number?.toString() === selectedTable.toString() ||
                    o.table?.table_number?.toString() === selectedTable.toString()) &&
                  o.status !== 'cancelled' &&
                  o.status !== 'paid'
              )
              const paidForSelected = (serverOrders || []).filter(
                o =>
                  (o.table_number?.toString() === selectedTable.toString() ||
                    o.table?.table_number?.toString() === selectedTable.toString()) &&
                  o.status === 'paid'
              )
              const isSelectedSobremesa = activeForSelected.length === 0 && paidForSelected.length > 0

              return (
            <div className="flex items-center gap-1.5">
              {isSelectedSobremesa && (
                <span className="px-2 py-0.5 rounded-full bg-teal-600 text-white text-[10px] font-black flex items-center gap-1 shadow-xs">
                  <Receipt className="w-3 h-3 text-white" />
                  POR LEVANTAR · EN SOBREMESA
                </span>
              )}
              <span className="text-xs font-semibold text-slate-600">
                Comanda: <strong className="font-black text-sm text-slate-900">Mesa #{selectedTable}</strong>
              </span>
              {isSelectedSobremesa ? null : currentStatus === 'ready' && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-black flex items-center gap-1 shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  ¡LISTO!
                </span>
              )}
              {currentStatus === 'calling' && (
                <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black flex items-center gap-1 shadow-xs ring-1 ring-amber-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-950" />
                  AVISO
                </span>
              )}
            </div>
            )
          })()}
        </div>
      </div>

      {/* CARRUSEL DE MESAS CON CUBITOS Y FASES GASTRONÓMICAS */}
      <div className="max-w-7xl mx-auto flex items-center gap-1.5 relative">
        {/* Flecha Izquierda para desplazar */}
        <button
          type="button"
          onClick={() => handleScroll('left')}
          className="p-2 rounded-xl bg-slate-100 hover:bg-blue-900 hover:text-white text-slate-700 transition-all shadow-xs border border-slate-200 flex-shrink-0 flex items-center justify-center active:scale-95 cursor-pointer z-20"
          title="Ver mesas anteriores"
        >
          <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
        </button>

        {/* Contenedor relativo con Difuminado Progresivo en los bordes de mesas cortadas */}
        <div className="relative flex-1 overflow-hidden">
          {/* Sombra difuminada suave a la izquierda cuando hay scroll */}
          {canScrollLeft && (
            <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white via-white/80 to-transparent z-10 transition-opacity duration-300" />
          )}

          {/* Sombra difuminada suave a la derecha cuando hay más mesas */}
          {canScrollRight && (
            <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-white via-white/90 to-transparent z-10 transition-opacity duration-300" />
          )}

          {/* Contenedor con Scroll Suave */}
          <div
            ref={scrollRef}
            className="flex gap-2.5 overflow-x-auto py-1.5 scroll-smooth no-scrollbar"
          >
          {filteredTables.length === 0 ? (
            <div className="flex-1 flex items-center justify-center py-2 text-xs text-slate-400 font-bold">
              {filterAttentionOnly ? 'No hay mesas con avisos pendientes' : 'No se encontraron mesas'}
            </div>
          ) : (
            filteredTables.map(table => {
              const isSelected = selectedTable?.toString() === table.table_number.toString()
              const status: TableStatusType = tableStatuses[table.table_number] || 'free'
              const dwellMinutes = tableDwellMinutes[table.table_number]

              // Órdenes activas de esta mesa
              const activeTableOrders = (serverOrders || []).filter(
                o =>
                  (o.table_number?.toString() === table.table_number.toString() ||
                    o.table?.table_number?.toString() === table.table_number.toString()) &&
                  o.status !== 'cancelled' &&
                  o.status !== 'paid'
              )

              // Órdenes pagadas de esta mesa
              const paidTableOrders = (serverOrders || []).filter(
                o =>
                  (o.table_number?.toString() === table.table_number.toString() ||
                    o.table?.table_number?.toString() === table.table_number.toString()) &&
                  o.status === 'paid'
              )
              const isPaidSobremesa = activeTableOrders.length === 0 && paidTableOrders.length > 0

              // Llamadas activas de esta mesa
              const tableCall = (pendingCalls || []).find(
                c => c.table_number?.toString() === table.table_number.toString()
              )
              const isBill = Boolean(tableCall && tableCall.text.toLowerCase().includes('cuenta'))
              const isCall = Boolean(tableCall && !isBill)
              const hasPendingValidation = activeTableOrders.some(o => o.status === 'pending_validation')

              // Fases y platos pedidos en esta mesa
              const badges = computeTableCourseBadges(activeTableOrders)
              const hasOrderedItems =
                badges.hasDrinks || badges.hasStarters || badges.hasMains || badges.hasDesserts

              // Estilos del cubito según estado con colores sólidos y descansados
              let cubitoStyle = 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
              let dotColor = 'bg-slate-300'

              if (isPaidSobremesa) {
                cubitoStyle = isSelected
                  ? 'border-teal-600 bg-teal-100 ring-2 ring-teal-500 shadow-md text-teal-950'
                  : 'border-teal-500 bg-teal-50 text-teal-950 shadow-xs'
                dotColor = 'bg-teal-600'
              } else if (status === 'ready' || badges.startersReady || badges.mainsReady || badges.dessertsReady) {
                cubitoStyle = isSelected
                  ? 'border-emerald-600 bg-emerald-100 ring-2 ring-emerald-500 shadow-md text-emerald-950'
                  : 'border-emerald-500 bg-emerald-50/90 hover:bg-emerald-100/80 shadow-xs text-emerald-950 ring-1 ring-emerald-400/80'
                dotColor = 'bg-emerald-500'
              } else if (isBill) {
                cubitoStyle = isSelected
                  ? 'border-emerald-600 bg-emerald-100 ring-2 ring-emerald-500 shadow-md text-emerald-950'
                  : 'border-emerald-500 bg-emerald-50 hover:bg-emerald-100 shadow-xs text-emerald-950 ring-1 ring-emerald-400/80'
                dotColor = 'bg-emerald-600'
              } else if (isCall || status === 'calling') {
                cubitoStyle = isSelected
                  ? 'border-amber-500 bg-amber-100 ring-2 ring-amber-400 shadow-md text-slate-950'
                  : 'border-amber-400 bg-amber-50 hover:bg-amber-100 shadow-xs text-slate-950 ring-1 ring-amber-400/80'
                dotColor = 'bg-amber-500'
              } else if (hasPendingValidation) {
                cubitoStyle = isSelected
                  ? 'border-amber-500 bg-amber-50 ring-2 ring-amber-400 shadow-md text-amber-950'
                  : 'border-amber-300 bg-amber-50/70 hover:bg-amber-100 text-amber-950 shadow-xs'
                dotColor = 'bg-amber-400'
              } else if (status === 'busy' || hasOrderedItems) {
                cubitoStyle = isSelected
                  ? 'border-blue-600 bg-blue-50/90 ring-2 ring-blue-500 shadow-md text-blue-950'
                  : 'border-blue-200 bg-white hover:bg-blue-50/40 text-slate-800 shadow-xs'
                dotColor = 'bg-blue-600'
              } else if (isSelected) {
                cubitoStyle = 'border-slate-400 bg-slate-100 ring-2 ring-slate-400 shadow-sm text-slate-900'
              }

              return (
                <button
                  key={table.id}
                  type="button"
                  onClick={() => onSelectTable(table)}
                  className={`flex-shrink-0 min-w-[108px] sm:min-w-[116px] min-h-[70px] p-2 rounded-2xl font-black text-xs flex flex-col justify-between transition-all duration-150 border active:scale-95 cursor-pointer ${cubitoStyle}`}
                  title={`Mesa #${table.table_number} · Toca para abrir comanda`}
                >
                  {/* Fila 1: Encabezado con número de mesa centrado y tiempo */}
                  <div className="relative flex items-center justify-center w-full min-h-[18px]">
                    <span className="font-black text-xs text-slate-900 text-center truncate px-5">
                      Mesa #{table.table_number}
                    </span>

                    {Boolean(dwellMinutes && status !== 'free') ? (
                      <span className="absolute right-0 text-[10px] font-extrabold px-1.5 py-0.2 rounded-md bg-slate-200/90 text-slate-700">
                        {dwellMinutes}&apos;
                      </span>
                    ) : (
                      <span className={`absolute right-0 w-2 h-2 rounded-full ${dotColor} transition-colors duration-200`} />
                    )}
                  </div>

                  {/* Fila 2: Badge de Aviso Urgente (Llamada, Cuenta, Listo, Validar, Sobremesa) */}
                  <div className="w-full flex items-center justify-center my-0.5">
                    {isPaidSobremesa ? (
                      <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-teal-600 text-white font-black uppercase shadow-xs flex items-center gap-0.5">
                        <Receipt className="w-2.5 h-2.5 stroke-[2.5]" />
                        <span>💸 PAGADA · En Sobremesa (Por Levantar)</span>
                      </span>
                    ) : isBill ? (
                      <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-emerald-600 text-white font-black uppercase shadow-xs flex items-center gap-0.5">
                        <Receipt className="w-2.5 h-2.5 stroke-[2.5]" />
                        <span>CUENTA</span>
                      </span>
                    ) : isCall ? (
                      <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-amber-500 text-slate-950 font-black uppercase shadow-xs flex items-center gap-0.5">
                        <Bell className="w-2.5 h-2.5 stroke-[2.5]" />
                        <span>AVISO</span>
                      </span>
                    ) : hasPendingValidation ? (
                      <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-amber-400 text-slate-950 font-black uppercase shadow-xs flex items-center gap-0.5">
                        <UserCheck className="w-2.5 h-2.5 stroke-[2.5]" />
                        <span>VALIDAR</span>
                      </span>
                    ) : badges.startersReady || badges.mainsReady || badges.dessertsReady ? (
                      <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-emerald-600 text-white font-black uppercase shadow-xs flex items-center gap-0.5">
                        <Sparkles className="w-2.5 h-2.5" />
                        <span>¡LISTO!</span>
                      </span>
                    ) : !hasOrderedItems ? (
                      <span className="text-[10px] text-slate-400 font-semibold">Libre</span>
                    ) : null}
                  </div>

                  {/* Fila 3: Iconos de Fases Gastronómicas con Códigos de Color Coherentes */}
                  {isPaidSobremesa ? (
                    <div className="flex items-center gap-1 justify-center w-full pt-0.5 border-t border-teal-200/60 text-[9px] text-teal-800 font-bold">
                      <span>Por Levantar · Sobremesa</span>
                    </div>
                  ) : hasOrderedItems ? (
                    <div className="flex items-center gap-1 justify-center w-full pt-0.5 border-t border-slate-200/60">
                      {/* 1. Bebidas (Barra) */}
                      {badges.hasDrinks && (
                        <span
                          title={
                            badges.drinksPending
                              ? 'Bebidas pendientes de servir en barra'
                              : badges.drinksPendingValidation
                              ? 'Bebidas pendientes de validación por el mozo'
                              : 'Bebidas entregadas en mesa'
                          }
                          className={`p-1 rounded-md text-[10px] flex items-center justify-center transition-all ${
                            badges.drinksPending
                              ? 'bg-cyan-500 text-slate-950 font-black shadow-xs ring-1 ring-cyan-300'
                              : badges.drinksPendingValidation
                              ? 'bg-orange-200 text-orange-900 border border-orange-400 font-bold shadow-2xs'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          <Wine className="w-3 h-3 stroke-[2.2]" />
                        </span>
                      )}

                      {/* 2. Entradas (Papitas / 1º Pase) */}
                      {badges.hasStarters && (
                        <span
                          title={
                            badges.startersReady
                              ? '¡Entradas listas en cocina para retirar!'
                              : badges.startersCooking
                              ? 'Entradas en preparación'
                              : badges.startersPendingValidation
                              ? 'Entradas pendientes de validación por el mozo'
                              : 'Entradas entregadas en mesa'
                          }
                          className={`p-1 rounded-md text-[10px] flex items-center justify-center transition-all ${
                            badges.startersReady
                              ? 'bg-emerald-500 text-white font-black shadow-xs ring-1 ring-emerald-300'
                              : badges.startersCooking
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : badges.startersPendingValidation
                              ? 'bg-orange-200 text-orange-900 border border-orange-400 font-bold shadow-2xs'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          <Salad className="w-3 h-3 stroke-[2.2]" />
                        </span>
                      )}

                      {/* 3. Platos Principales (Comida / 2º Pase) */}
                      {badges.hasMains && (
                        <span
                          title={
                            badges.mainsReady
                              ? '¡Principales listos en cocina para retirar!'
                              : badges.mainsCooking
                              ? 'Principales en fuego (cocina)'
                              : badges.mainsPendingValidation
                              ? 'Principales pendientes de validación por el mozo'
                              : badges.mainsWaiting
                              ? 'Principales esperando habilitación del mozo'
                              : 'Principales entregados en mesa'
                          }
                          className={`p-1 rounded-md text-[10px] flex items-center justify-center transition-all ${
                            badges.mainsReady
                              ? 'bg-emerald-500 text-white font-black shadow-xs ring-1 ring-emerald-300'
                              : badges.mainsCooking
                              ? 'bg-blue-100 text-blue-900 border border-blue-300 font-bold'
                              : badges.mainsPendingValidation
                              ? 'bg-orange-200 text-orange-900 border border-orange-400 font-bold shadow-2xs'
                              : badges.mainsWaiting
                              ? 'bg-slate-200 text-slate-500 opacity-60'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          <UtensilsCrossed className="w-3 h-3 stroke-[2.2]" />
                        </span>
                      )}

                      {/* 4. Postres */}
                      {badges.hasDesserts && (
                        <span
                          title={
                            badges.dessertsReady
                              ? '¡Postres listos en cocina para retirar!'
                              : badges.dessertsCooking
                              ? 'Postres en preparación en cocina'
                              : badges.dessertsPendingValidation
                              ? 'Postres pendientes de validación por el mozo'
                              : badges.dessertsWaiting
                              ? 'Postres en espera de marcha del mozo'
                              : 'Postres entregados en mesa'
                          }
                          className={`p-1 rounded-md text-[10px] flex items-center justify-center transition-all ${
                            badges.dessertsReady
                              ? 'bg-emerald-500 text-white font-black shadow-xs ring-1 ring-emerald-300'
                              : badges.dessertsCooking
                              ? 'bg-purple-100 text-purple-900 border border-purple-300 font-bold'
                              : badges.dessertsPendingValidation
                              ? 'bg-orange-200 text-orange-900 border border-orange-400 font-bold shadow-2xs'
                              : badges.dessertsWaiting
                              ? 'bg-slate-200 text-slate-500 opacity-60'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          <Cake className="w-3 h-3 stroke-[2.2]" />
                        </span>
                      )}
                    </div>
                  ) : null}
                </button>
              )
            })
          )}
        </div>
        </div>

        {/* Flecha Derecha para desplazar */}
        <button
          type="button"
          onClick={() => handleScroll('right')}
          className="p-2 rounded-xl bg-slate-100 hover:bg-blue-900 hover:text-white text-slate-700 transition-all shadow-xs border border-slate-200 flex-shrink-0 flex items-center justify-center active:scale-95 cursor-pointer"
          title="Ver siguientes mesas"
        >
          <ChevronRight className="w-4 h-4 stroke-[2.5]" />
        </button>
      </div>
    </div>
  )
}
