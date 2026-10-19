'use client'

import React from 'react'
import {
  Bell,
  Check,
  Sparkles,
  Loader2,
  UserCheck,
  CheckCircle2,
  Trash2,
  Users,
  Flame,
  Receipt,
  RefreshCw,
  CreditCard,
  Wine,
  Utensils,
  Clock,
  ChefHat,
} from 'lucide-react'
import { Table, Order, Product } from '@/types/database.types'
import { formatCurrency } from '@/lib/utils'
import { PendingServiceCall, PreviousDrinkItem } from '@/types/comandero.types'
import {
  isDrinkItem,
  isDrinkServed,
  isDessertItem,
  isDessertFired,
  isDessertReady,
  isDessertServed,
  isDessertPendingChoice,
  orderHasHeldDesserts,
  orderHasPendingChoiceDesserts,
  stripInternalStationTags,
  cleanItemNotes,
  getPendingDrinks,
  isStarterItem,
  isMainItem,
  isStarterReady,
  isStarterServed,
  isMainFired,
  isMainCooking,
  isMainReady,
  isMainServed,
  areOrderStartersReady,
  areOrderStartersServed,
  areOrderMainsReady,
  areOrderMainsServed,
  areOrderMainsFired,
} from '@/lib/course-utils'

interface ComanderoTableDetailPanelProps {
  selectedTable: Table
  pendingCalls: PendingServiceCall[]
  serverOrders: Order[]
  deliveringOrderIds: Set<string>
  validatingOrderIds: Set<string>
  servingDrinkOrderIds?: Set<string>
  tablePax: number
  onSetTablePax: (pax: number) => void
  tableDiscount: number
  onSetTableDiscount: (discount: number) => void
  previousDrinks: PreviousDrinkItem[]
  onAttendCall: (callId: string) => void
  onDeliverSingleOrder: (orderId: string) => void
  onMarkDelivered: (tblNum: string | number) => void
  onCancelSingleOrder: (orderId: string, reason: string) => void
  onValidateOrder: (orderId: string, tblNum: string | number) => void
  onCancelValidationOrder: (orderId: string, tblNum: string | number) => void
  onFireSecondCourses: (tblNum: string | number) => void
  onFireMains?: (orderId: string) => void
  onFireDesserts?: (tblNum: string | number) => void
  onDeliverDesserts?: (orderId: string) => void
  onDeliverDessertsDirect?: (tblNum: string | number) => void
  onOpenDessertSelector?: () => void
  onOpenPreBill: () => void
  onOpenTransferModal: () => void
  onOpenFreeTableModal: (tblNum: string | number) => void
  onExecuteFreeTableDirect?: (tblNum: string | number) => void
  onRepeatDrinksRound: () => void
  onServeDrinks?: (orderId: string) => void
  onDeliverStarters?: (orderId: string) => void
  onDeliverMains?: (orderId: string) => void
}

export function ComanderoTableDetailPanel({
  selectedTable,
  pendingCalls,
  serverOrders,
  deliveringOrderIds,
  validatingOrderIds,
  servingDrinkOrderIds,
  tablePax,
  onSetTablePax,
  tableDiscount,
  onSetTableDiscount,
  previousDrinks,
  onAttendCall,
  onDeliverSingleOrder,
  onMarkDelivered,
  onCancelSingleOrder,
  onValidateOrder,
  onCancelValidationOrder,
  onFireSecondCourses,
  onFireMains,
  onFireDesserts,
  onDeliverDesserts,
  onDeliverDessertsDirect,
  onOpenDessertSelector,
  onOpenPreBill,
  onOpenTransferModal,
  onOpenFreeTableModal,
  onExecuteFreeTableDirect,
  onRepeatDrinksRound,
  onServeDrinks,
  onDeliverStarters,
  onDeliverMains,
}: ComanderoTableDetailPanelProps) {
  const tableCalls = pendingCalls.filter(c => c.table_number.toString() === selectedTable.table_number.toString())
  const readyOrders = serverOrders.filter(
    o => (o.table_number?.toString() === selectedTable.table_number.toString() || o.table?.table_number?.toString() === selectedTable.table_number.toString()) && o.status === 'ready'
  )
  const validationOrders = serverOrders.filter(
    o => (o.table_number?.toString() === selectedTable.table_number.toString() || o.table?.table_number?.toString() === selectedTable.table_number.toString()) && o.status === 'pending_validation'
  )

  const tableActiveOrders = React.useMemo(() => {
    return serverOrders.filter(
      o => (o.table_number?.toString() === selectedTable.table_number.toString() || o.table?.table_number?.toString() === selectedTable.table_number.toString()) &&
           !['cancelled', 'paid', 'pending_validation'].includes(o.status)
    )
  }, [serverOrders, selectedTable])

  // 1. Todas las bebidas de esta mesa (para visibilidad completa permanente en sala)
  const tableAllDrinks = React.useMemo(() => {
    return tableActiveOrders.flatMap(ord =>
      (ord.order_items || []).filter(isDrinkItem).map(it => ({ orderId: ord.id, item: it }))
    )
  }, [tableActiveOrders])

  // Bebidas pendientes de servir en esta mesa
  const tablePendingDrinks = React.useMemo(() => {
    return tableActiveOrders.flatMap(ord =>
      getPendingDrinks(ord).map(it => ({ orderId: ord.id, item: it }))
    )
  }, [tableActiveOrders])

  // 2. Entradas y Principales de cocina en esta mesa
  const tableStarters = React.useMemo(() => {
    return tableActiveOrders.flatMap(ord =>
      (ord.order_items || []).filter(isStarterItem).map(it => ({ orderId: ord.id, item: it }))
    )
  }, [tableActiveOrders])

  const tableMains = React.useMemo(() => {
    return tableActiveOrders.flatMap(ord =>
      (ord.order_items || []).filter(isMainItem).map(it => ({ orderId: ord.id, item: it }))
    )
  }, [tableActiveOrders])

  const hasStartersReadyToPick = React.useMemo(() => {
    return tableActiveOrders.some(
      o => (o.order_items || []).some(isStarterItem) && areOrderStartersReady(o) && !areOrderStartersServed(o)
    )
  }, [tableActiveOrders])

  const hasMainsReadyToPick = React.useMemo(() => {
    return tableActiveOrders.some(
      o => (o.order_items || []).some(isMainItem) && areOrderMainsReady(o) && !areOrderMainsServed(o)
    )
  }, [tableActiveOrders])

  const hasStartersDone = React.useMemo(() => {
    if (tableStarters.length === 0) return true
    return tableActiveOrders.every(o => areOrderStartersServed(o))
  }, [tableStarters, tableActiveOrders])

  const allMainsServed = React.useMemo(() => {
    if (tableMains.length === 0) return false
    return tableMains.every(it => isMainServed(it.item)) || tableActiveOrders.every(o => areOrderMainsServed(o))
  }, [tableMains, tableActiveOrders])

  const areMainsFired = React.useMemo(() => {
    if (tableMains.length === 0) return true
    if (allMainsServed) return true
    return tableActiveOrders.every(o => areOrderMainsFired(o))
  }, [tableMains, allMainsServed, tableActiveOrders])

  const canFireMains = React.useMemo(() => {
    if (tableMains.length === 0) return false
    if (allMainsServed) return false
    if (hasMainsReadyToPick) return false
    if (areMainsFired) return false
    return true
  }, [tableMains, allMainsServed, hasMainsReadyToPick, areMainsFired])

  // 3. Postres de la mesa con sus nombres específicos
  const tableDesserts = React.useMemo(() => {
    return tableActiveOrders.flatMap(ord =>
      (ord.order_items || []).filter(isDessertItem).map(it => ({ orderId: ord.id, item: it }))
    )
  }, [tableActiveOrders])

  const areFoodCoursesServed = React.useMemo(() => {
    if (tableMains.length > 0) {
      return tableActiveOrders.every(o => areOrderMainsServed(o))
    }
    if (tableStarters.length > 0) {
      return tableActiveOrders.every(o => areOrderStartersServed(o))
    }
    return true
  }, [tableMains, tableStarters, tableActiveOrders])

  const hasDessertsReadyToPick = React.useMemo(() => {
    return tableActiveOrders.some(
      o => (o.order_items || []).filter(isDessertItem).some(d => isDessertReady(d) && !isDessertServed(d))
    )
  }, [tableActiveOrders])

  const hasPendingDesserts = serverOrders.some(
    o => (o.table_number?.toString() === selectedTable.table_number.toString() || o.table?.table_number?.toString() === selectedTable.table_number.toString()) &&
         o.status !== 'pending_validation' && o.status !== 'paid' && o.status !== 'cancelled' &&
         orderHasHeldDesserts(o)
  )

  const hasPendingDessertChoiceInTable = serverOrders.some(
    o => (o.table_number?.toString() === selectedTable.table_number.toString() || o.table?.table_number?.toString() === selectedTable.table_number.toString()) &&
         orderHasPendingChoiceDesserts(o)
  )

  const tablePendingAmount = React.useMemo(() => {
    const tableOrders = serverOrders.filter(
      o => (o.table_number?.toString() === selectedTable.table_number.toString() || o.table?.table_number?.toString() === selectedTable.table_number.toString()) &&
           !['cancelled', 'paid'].includes(o.status)
    )
    let sum = 0
    tableOrders.forEach(ord => {
      if (ord.order_items && ord.order_items.length > 0) {
        ord.order_items.forEach(it => {
          if (!it.is_complimentary) {
            sum += (it.quantity || 1) * (it.product?.price || 0)
          }
        })
      } else if (ord.total_amount) {
        sum += Number(ord.total_amount) || 0
      }
    })
    const discount = tableDiscount > 0 ? sum * (tableDiscount / 100) : 0
    return Math.max(0, sum - discount)
  }, [serverOrders, selectedTable, tableDiscount])

  const [showZeroBalanceConfirm, setShowZeroBalanceConfirm] = React.useState(false)

  return (
    <div className="max-w-7xl mx-auto w-full px-3 pt-3 space-y-2.5">
      {/* A. Avisos Pendientes Específicos de esta Mesa */}
      {tableCalls.length > 0 && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-3.5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
              <h4 className="font-black text-xs sm:text-sm text-amber-950 uppercase tracking-wider">
                Solicitudes de Mesa #{selectedTable.table_number}
              </h4>
            </div>
            <span className="text-[11px] font-bold text-amber-800">
              {tableCalls.length} pendientes
            </span>
          </div>

          <div className="space-y-1.5">
            {tableCalls.map(call => (
              <div
                key={call.id}
                className="bg-white p-2.5 rounded-xl border border-amber-200 flex items-center justify-between gap-2 shadow-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Bell className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span className="text-xs font-extrabold text-slate-900 truncate">
                    {call.text}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onAttendCall(call.id)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center gap-1 shadow-xs transition-transform active:scale-95 flex-shrink-0 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Atendido</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* B. Comandas Pendientes de Validación en esta Mesa */}
      {validationOrders.length > 0 && (
        <div className="bg-amber-50/80 border-2 border-amber-300/90 rounded-2xl p-3.5 space-y-2.5 shadow-2xs">
          <div className="flex items-center justify-between pb-1.5 border-b border-amber-200/80">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                <UserCheck className="w-3.5 h-3.5 text-amber-700 animate-pulse" />
              </div>
              <h4 className="font-black text-xs uppercase tracking-wide text-amber-950">
                Validar Mesa #{selectedTable.table_number} ({validationOrders.length})
              </h4>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-900 text-[10px] font-black">
              {validationOrders.length} comanda(s)
            </span>
          </div>

          <div className="space-y-2">
            {validationOrders.map((valOrder, idx) => (
              <div
                key={valOrder.id}
                className="bg-white p-3 rounded-xl border border-amber-200/90 border-l-4 border-l-amber-500 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shadow-2xs"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase text-amber-800 block">
                      Comanda #{idx + 1}
                    </span>
                    <span className="text-xs font-black text-slate-900 tabular-nums">
                      {formatCurrency(valOrder.total_amount)}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-slate-800">
                    {valOrder.order_items?.map(it => `${it.quantity}x ${it.product?.name || 'Plato'}`).join(' + ')}
                  </div>
                  {valOrder.order_items?.some(it => it.notes) && (
                    <p className="text-[11px] text-amber-800 font-semibold">
                      Nota: {valOrder.order_items.map(it => it.notes ? stripInternalStationTags(it.notes) : '').filter(Boolean).join(' | ')}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    disabled={validatingOrderIds.has(valOrder.id)}
                    onClick={() => onValidateOrder(valOrder.id, selectedTable.table_number)}
                    className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:bg-amber-200 disabled:text-amber-700 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-xs active:scale-95 transition-all uppercase tracking-wide cursor-pointer disabled:cursor-not-allowed"
                  >
                    {validatingOrderIds.has(valOrder.id) ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                        <span>Aprobando...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                        <span>Aprobar Comanda</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`¿Descartar comanda de Mesa #${selectedTable.table_number}?`)) {
                        onCancelValidationOrder(valOrder.id, selectedTable.table_number)
                      }
                    }}
                    className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 font-black text-xs border border-red-200 transition-colors cursor-pointer"
                    title="Descartar comanda"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* C. Panel de Control de Mesa */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        {/* Fila 1: Datos de Mesa, Comensales y Descuentos */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-100">
          <div className="flex items-center justify-between sm:justify-start gap-2.5">
            <span className="text-slate-900 font-extrabold text-sm">
              Mesa #{selectedTable.table_number}
            </span>
            
            {/* Selector de Comensales */}
            <div className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-xl border border-slate-200">
              <Users size={14} className="text-slate-600" />
              <span className="text-xs font-black text-slate-800">
                {tablePax} pax
              </span>
              <div className="flex items-center gap-0.5 ml-1">
                <button
                  type="button"
                  onClick={() => onSetTablePax(Math.max(1, tablePax - 1))}
                  className="w-5 h-5 rounded-lg bg-white hover:bg-slate-200 text-slate-800 font-black flex items-center justify-center text-xs shadow-2xs cursor-pointer active:scale-95"
                  title="Menos comensales"
                >
                  -
                </button>
                <button
                  type="button"
                  onClick={() => onSetTablePax(tablePax + 1)}
                  className="w-5 h-5 rounded-lg bg-white hover:bg-slate-200 text-slate-800 font-black flex items-center justify-center text-xs shadow-2xs cursor-pointer active:scale-95"
                  title="Más comensales"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Selector de Descuento */}
          <div className="flex items-center justify-between sm:justify-end gap-1.5">
            <span className="text-xs font-bold text-slate-500">Dto:</span>
            <div className="flex items-center gap-1 bg-slate-50 p-0.5 rounded-xl border border-slate-200">
              {[0, 5, 10, 15, 20].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => onSetTableDiscount(pct)}
                  className={`px-2 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    tableDiscount === pct
                      ? 'bg-blue-900 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {pct === 0 ? '0%' : `-${pct}%`}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        {/* 1. SECCIÓN: BEBIDAS DE LA MESA (PERMANENTE PARA VISIBILIDAD TOTAL) */}
        {tableAllDrinks.length > 0 && (
          <div className="p-3.5 rounded-2xl bg-cyan-50/80 border-2 border-cyan-200/90 space-y-2.5 shadow-2xs">
            <div className="flex items-center justify-between pb-1.5 border-b border-cyan-200/80">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-cyan-100 text-cyan-800 flex items-center justify-center font-bold">
                  <Wine className="w-3.5 h-3.5 text-cyan-700" />
                </div>
                <h4 className="font-black text-xs uppercase tracking-wide text-cyan-950">
                  🍷 Bebidas ({tableAllDrinks.reduce((acc, d) => acc + (d.item.quantity || 1), 0)})
                </h4>
              </div>
              <span className={`text-xs sm:text-sm font-black px-3 py-1 rounded-lg shadow-xs ${
                tablePendingDrinks.length === 0
                  ? 'bg-slate-100 text-emerald-700 border border-emerald-200'
                  : 'bg-cyan-100 text-cyan-900 border border-cyan-300 animate-pulse'
              }`}>
                {tablePendingDrinks.length === 0 ? '✅ Entregado' : '⏳ Pendiente en Barra'}
              </span>
            </div>

            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {tableAllDrinks.map((d, idx) => {
                const served = isDrinkServed(d.item)
                return (
                  <div key={idx} className="flex items-center justify-between text-xs bg-white px-3 py-2 rounded-xl border border-cyan-200/70 shadow-2xs">
                    <div className="min-w-0">
                      <span className="font-black text-cyan-700 mr-1.5">{d.item.quantity}x</span>
                      <span className={`font-bold ${served ? 'text-slate-500' : 'text-slate-800'}`}>
                        {d.item.product?.name || 'Bebida'}
                      </span>
                      {d.item.notes && (
                        <span className="block text-[10px] text-cyan-800/80 font-bold pl-3">
                          &bull; {cleanItemNotes(d.item.notes)}
                        </span>
                      )}
                    </div>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                      served
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-cyan-100 text-cyan-800 border border-cyan-200'
                    }`}>
                      {served ? '✅ Servida' : '⏳ Pendiente'}
                    </span>
                  </div>
                )
              })}
            </div>

            {tablePendingDrinks.length > 0 && (
              <button
                type="button"
                disabled={tablePendingDrinks.some(d => servingDrinkOrderIds?.has(d.orderId))}
                onClick={() => {
                  const uniqueOrderIds = Array.from(new Set(tablePendingDrinks.map(d => d.orderId)))
                  uniqueOrderIds.forEach(id => onServeDrinks && onServeDrinks(id))
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:bg-cyan-400 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-xs active:scale-95 transition-all uppercase tracking-wide cursor-pointer disabled:cursor-not-allowed"
              >
                {tablePendingDrinks.some(d => servingDrinkOrderIds?.has(d.orderId)) ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Entregando Bebidas / Café...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                    <span>
                      {tableAllDrinks.some(d => {
                        const n = (d.item.product?.name || '').toLowerCase()
                        return n.includes('café') || n.includes('cafe') || n.includes('té') || n.includes('infusión')
                      })
                        ? 'Entregar Café / Bebidas al Cliente'
                        : 'Marcar Bebidas como Entregadas'}
                    </span>
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {/* 2. SECCIÓN: ESTADO DE PLATOS DE COCINA POR TIEMPOS (ENTRADAS, PRINCIPALES, POSTRES) */}
        {(tableStarters.length > 0 || tableMains.length > 0 || tableDesserts.length > 0) && (
          <div className="p-3.5 rounded-2xl bg-slate-50/90 border-2 border-slate-200/90 space-y-2.5 shadow-2xs">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/80">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <Utensils className="w-3.5 h-3.5 text-emerald-700" />
                </div>
                <h4 className="font-black text-xs uppercase tracking-wide text-slate-900">
                  Cocina: Estado de Platos en Mesa #{selectedTable.table_number}
                </h4>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-[10px] font-black border border-emerald-200">
                Pase
              </span>
            </div>

            {/* 1º Entradas */}
            {tableStarters.length > 0 && (
              <div className="bg-white p-3 rounded-xl border border-slate-200/90 border-l-4 border-l-amber-500 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-800 uppercase flex items-center gap-1.5">
                    <span>🥗 1º Entradas</span>
                    <span className="text-[10px] text-slate-400 font-bold">({tableStarters.reduce((acc, it) => acc + (it.item.quantity || 1), 0)})</span>
                  </span>
                  <span className={`text-xs sm:text-sm font-black px-3 py-1 rounded-lg shadow-xs ${
                    hasStartersReadyToPick
                      ? 'bg-emerald-500 text-white animate-pulse shadow-2xs'
                      : tableStarters.every(it => isStarterServed(it.item))
                      ? 'bg-slate-100 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-amber-800 border border-amber-200'
                  }`}>
                    {hasStartersReadyToPick ? '✨ Listo en Cocina' : tableStarters.every(it => isStarterServed(it.item)) ? '✅ Entregado' : '⏳ En Cocina'}
                  </span>
                </div>
                <div className="space-y-1 text-xs text-slate-700">
                  {tableStarters.map((it, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div>
                        <span className="font-black text-amber-600">{it.item.quantity}x </span>
                        <span className="font-bold text-slate-800">{it.item.product?.name || 'Entrada'}</span>
                        {it.item.notes && (
                          <span className="block text-[10px] text-slate-500 italic pl-3">
                            &bull; {cleanItemNotes(it.item.notes)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {hasStartersReadyToPick && (
                  <button
                    type="button"
                    onClick={() => {
                      const orderIds = Array.from(new Set(tableStarters.map(it => it.orderId)))
                      orderIds.forEach(id => onDeliverStarters ? onDeliverStarters(id) : onDeliverSingleOrder(id))
                    }}
                    className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-xs active:scale-95 transition-all uppercase tracking-wide cursor-pointer mt-1"
                  >
                    <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                    <span>Entregar Entradas al Cliente</span>
                  </button>
                )}
              </div>
            )}

            {/* 2º Principales / Burgers */}
            {tableMains.length > 0 && (
              <div className="bg-white p-3 rounded-xl border border-slate-200/90 border-l-4 border-l-sky-500 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-800 uppercase flex items-center gap-1.5">
                    <span>🍔 2º Principales / Burgers</span>
                    <span className="text-[10px] text-slate-400 font-bold">({tableMains.reduce((acc, it) => acc + (it.item.quantity || 1), 0)})</span>
                  </span>
                  <span className={`text-xs sm:text-sm font-black px-3 py-1 rounded-lg shadow-xs ${
                    hasMainsReadyToPick
                      ? 'bg-emerald-500 text-white animate-pulse shadow-2xs'
                      : tableMains.every(it => isMainServed(it.item))
                      ? 'bg-slate-100 text-emerald-700 border border-emerald-200'
                      : !areMainsFired
                      ? (tableStarters.length > 0 && !hasStartersDone
                          ? 'bg-slate-100 text-slate-500 border border-slate-200'
                          : 'bg-sky-50 text-sky-800 border border-sky-200')
                      : 'bg-amber-50 text-amber-800 border border-amber-200'
                  }`}>
                    {hasMainsReadyToPick
                      ? '✨ Listo en Cocina'
                      : tableMains.every(it => isMainServed(it.item))
                      ? '✅ Entregado'
                      : !areMainsFired
                      ? (tableStarters.length > 0 && !hasStartersDone
                          ? '⏸️ Esperando 1º'
                          : '⏳ En Espera del Mozo')
                      : '🔥 En Cocina'}
                  </span>
                </div>
                <div className="space-y-1 text-xs text-slate-700">
                  {tableMains.map((it, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div>
                        <span className="font-black text-sky-600">{it.item.quantity}x </span>
                        <span className="font-bold text-slate-800">{it.item.product?.name || 'Principal'}</span>
                        {it.item.notes && (
                          <span className="block text-[10px] text-slate-500 italic pl-3">
                            &bull; {cleanItemNotes(it.item.notes)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {canFireMains && !allMainsServed && !hasMainsReadyToPick && (
                  <button
                    type="button"
                    onClick={() => {
                      const orderIds = Array.from(new Set(tableMains.map(it => it.orderId)))
                      orderIds.forEach(id => onFireMains && onFireMains(id))
                    }}
                    className="w-full py-2.5 px-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-xs active:scale-95 transition-all uppercase tracking-wide cursor-pointer mt-1"
                  >
                    <ChefHat className="w-4 h-4 stroke-[2.5]" />
                    <span>▶️ Marchar Principales a Cocina</span>
                  </button>
                )}
                {hasMainsReadyToPick && (
                  <button
                    type="button"
                    onClick={() => {
                      const orderIds = Array.from(new Set(tableMains.map(it => it.orderId)))
                      orderIds.forEach(id => onDeliverMains ? onDeliverMains(id) : onDeliverSingleOrder(id))
                    }}
                    className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-xs active:scale-95 transition-all uppercase tracking-wide cursor-pointer mt-1"
                  >
                    <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                    <span>Entregar Principales al Cliente</span>
                  </button>
                )}
              </div>
            )}

            {/* 3º Postres */}
            {tableDesserts.length > 0 && (
              <div className={`bg-white p-3 rounded-xl border border-slate-200/90 border-l-4 ${!areFoodCoursesServed ? 'border-l-slate-300' : 'border-l-purple-500'} shadow-2xs space-y-2`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-800 uppercase flex items-center gap-1.5">
                    <span>🍰 3º Postres</span>
                    <span className="text-[10px] text-slate-400 font-bold">({tableDesserts.reduce((acc, it) => acc + (it.item.quantity || 1), 0)})</span>
                  </span>
                  <span className={`text-xs sm:text-sm font-black px-3 py-1 rounded-lg shadow-xs ${
                    hasDessertsReadyToPick
                      ? 'bg-emerald-500 text-white animate-pulse shadow-2xs'
                      : tableDesserts.every(it => isDessertServed(it.item))
                      ? 'bg-slate-100 text-emerald-700 border border-emerald-200'
                      : !areFoodCoursesServed
                      ? 'bg-slate-100 text-slate-500 border border-slate-200'
                      : hasPendingDessertChoiceInTable
                      ? 'bg-purple-50 text-purple-800 border border-purple-200'
                      : tableDesserts.some(it => isDessertFired(it.item))
                      ? 'bg-amber-50 text-amber-800 border border-amber-200'
                      : 'bg-purple-50 text-purple-800 border border-purple-200'
                  }`}>
                    {hasDessertsReadyToPick
                      ? '✨ Listo en Cocina'
                      : tableDesserts.every(it => isDessertServed(it.item))
                      ? '✅ Entregado'
                      : !areFoodCoursesServed
                      ? '⏸️ Esperando 2º'
                      : hasPendingDessertChoiceInTable
                      ? '⏳ Por Definir'
                      : tableDesserts.some(it => isDessertFired(it.item))
                      ? '🔥 En Cocina'
                      : '⏳ En Espera del Mozo'}
                  </span>
                </div>

                <div className="space-y-1 text-xs text-slate-700">
                  {tableDesserts.map((d, idx) => {
                    const isPendingChoice = isDessertPendingChoice(d.item)
                    return (
                      <div key={idx} className="flex items-center justify-between">
                        <div>
                          <span className="font-black text-purple-600">{d.item.quantity}x </span>
                          <span className={isPendingChoice ? 'italic text-purple-700 font-bold' : 'font-bold text-slate-800'}>
                            {d.item.product?.name || (isPendingChoice ? 'Postre incluido por definir' : 'Postre')}
                          </span>
                          {d.item.notes && (
                            <span className="block text-[10px] text-slate-500 italic pl-3">
                              &bull; {cleanItemNotes(d.item.notes)}
                            </span>
                          )}
                        </div>

                        {isPendingChoice && onOpenDessertSelector && (
                          <button
                            type="button"
                            onClick={onOpenDessertSelector}
                            className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-black text-[10px] active:scale-95 cursor-pointer shadow-xs flex-shrink-0"
                          >
                            Elegir Postre
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Botón para entregar postres listos */}
                {hasDessertsReadyToPick && (
                  <button
                    type="button"
                    onClick={() => {
                      const orderIds = Array.from(new Set(tableDesserts.map(it => it.orderId)))
                      orderIds.forEach(id => onDeliverDesserts ? onDeliverDesserts(id) : onDeliverSingleOrder(id))
                    }}
                    className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-xs active:scale-95 transition-all uppercase tracking-wide cursor-pointer mt-1"
                  >
                    <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                    <span>Entregar Postres al Cliente</span>
                  </button>
                )}

                {/* Acciones del Mozo para marchar postres */}
                {hasPendingDesserts && (
                  !areFoodCoursesServed ? (
                    <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 text-xs font-semibold flex items-center gap-2">
                      <Clock size={14} className="text-purple-600 flex-shrink-0" />
                      <span>Se habilitará el pase a cocina tras entregar los platos principales.</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          if (hasPendingDessertChoiceInTable && onOpenDessertSelector) {
                            onOpenDessertSelector()
                          } else if (onFireDesserts) {
                            onFireDesserts(selectedTable.table_number)
                          }
                        }}
                        className="flex-1 h-9 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs transition-all shadow-xs flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                        title={hasPendingDessertChoiceInTable ? 'Elegir qué postre desea el comensal' : 'Avisar a cocina que prepare los postres de esta mesa'}
                      >
                        <Sparkles size={13} />
                        <span>{hasPendingDessertChoiceInTable ? '▶️ Elegir y Marchar a Cocina' : '▶️ Marchar Postres a Cocina'}</span>
                      </button>
                      {onDeliverDessertsDirect && (
                        <button
                          type="button"
                          onClick={() => onDeliverDessertsDirect(selectedTable.table_number)}
                          className="flex-1 sm:flex-initial h-9 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition-all shadow-xs flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                          title="Tachar y marcar postres como entregados directamente por el mozo"
                        >
                          <CheckCircle2 size={13} />
                          <span>Entregar Directo</span>
                        </button>
                      )}
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        )}

        {/* Fila 2: Grid de Acciones Operativas */}
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={onOpenPreBill}
            className="h-11 px-3 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-800 hover:text-blue-900 border border-slate-200 hover:border-blue-300 font-extrabold transition-all text-xs flex items-center justify-center gap-1.5 active:scale-95 shadow-xs cursor-pointer"
            title="Ver pre-cuenta digital desglosada"
          >
            <Receipt className="w-4 h-4 text-blue-700 flex-shrink-0" />
            <span className="truncate">Pre-Cuenta</span>
          </button>

          <button
            type="button"
            onClick={onOpenTransferModal}
            className="h-11 px-3 rounded-xl bg-slate-100 hover:bg-amber-50 text-slate-800 hover:text-amber-900 border border-slate-200 hover:border-amber-300 font-extrabold transition-all text-xs flex items-center justify-center gap-1.5 active:scale-95 shadow-xs cursor-pointer"
            title="Cambiar comanda a otra mesa"
          >
            <RefreshCw className="w-4 h-4 text-amber-700 flex-shrink-0" />
            <span className="truncate">Transferir</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (tablePendingAmount > 0) {
                onOpenFreeTableModal(selectedTable.table_number)
              } else {
                setShowZeroBalanceConfirm(true)
              }
            }}
            className="h-11 px-3 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-800 hover:text-emerald-800 border border-slate-200 hover:border-emerald-300 font-extrabold transition-all text-xs flex items-center justify-center gap-1.5 active:scale-95 shadow-xs cursor-pointer"
            title={tablePendingAmount > 0 ? `Cobrar ${tablePendingAmount.toFixed(2)} € y liberar mesa` : 'Liberar mesa sin consumo'}
          >
            <CreditCard className="w-4 h-4 text-emerald-700 flex-shrink-0" />
            <span className="truncate">{tablePendingAmount > 0 ? 'Cobrar y Liberar' : 'Liberar Mesa'}</span>
          </button>
        </div>

        {/* Modal de Confirmación en 2 Toques para Liberar Mesa Sin Cobro Pendiente (0 €) */}
        {showZeroBalanceConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in select-none">
            <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-200">
              <div className="flex items-center gap-2 text-slate-900">
                <div className="p-2.5 rounded-2xl bg-emerald-100 text-emerald-700 flex-shrink-0">
                  <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 block leading-tight">
                    Mesa al día · 0,00 € pendiente
                  </span>
                  <h3 className="text-base font-black text-slate-900 leading-tight">
                    ¿Confirmas liberar la Mesa #{selectedTable.table_number}?
                  </h3>
                </div>
              </div>

              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                La mesa pasará inmediatamente a estar <strong>Libre</strong> para recibir a los siguientes comensales.
              </p>

              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowZeroBalanceConfirm(false)
                    if (onExecuteFreeTableDirect) {
                      onExecuteFreeTableDirect(selectedTable.table_number)
                    } else {
                      onOpenFreeTableModal(selectedTable.table_number)
                    }
                  }}
                  className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md transition-all cursor-pointer"
                >
                  Sí, Confirmar y Liberar Mesa #{selectedTable.table_number}
                </button>

                <button
                  type="button"
                  onClick={() => setShowZeroBalanceConfirm(false)}
                  className="w-full py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Repetir ronda de bebidas */}
        {previousDrinks.length > 0 && (
          <button
            type="button"
            onClick={onRepeatDrinksRound}
            className="w-full h-10 px-3 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-950 font-black transition-all text-xs flex items-center justify-center gap-1.5 border border-amber-300 shadow-xs active:scale-95 cursor-pointer"
            title="Añadir a la comanda las mismas bebidas que ya pidieron"
          >
            <span>🍺 Repetir Ronda de Bebidas ({previousDrinks.reduce((s, d) => s + d.quantity, 0)} uds)</span>
          </button>
        )}
      </div>
    </div>
  )
}
