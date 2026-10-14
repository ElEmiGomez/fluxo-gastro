'use client'

import React from 'react'
import { Bell, Check, Sparkles, Loader2, UserCheck, CheckCircle2, Trash2, Users, Flame, Receipt, RefreshCw, CreditCard } from 'lucide-react'
import { Table, Order, Product } from '@/types/database.types'
import { formatCurrency } from '@/lib/utils'
import { PendingServiceCall, PreviousDrinkItem } from '@/types/comandero.types'
import { isDessertItem, isDessertFired, isDessertReady, orderHasHeldDesserts, orderHasPendingChoiceDesserts, stripInternalStationTags } from '@/lib/course-utils'

interface ComanderoTableDetailPanelProps {
  selectedTable: Table
  pendingCalls: PendingServiceCall[]
  serverOrders: Order[]
  deliveringOrderIds: Set<string>
  validatingOrderIds: Set<string>
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
  onFireDesserts?: (tblNum: string | number) => void
  onOpenDessertSelector?: () => void
  onOpenPreBill: () => void
  onOpenTransferModal: () => void
  onOpenFreeTableModal: (tblNum: string | number) => void
  onExecuteFreeTableDirect?: (tblNum: string | number) => void
  onRepeatDrinksRound: () => void
}

export function ComanderoTableDetailPanel({
  selectedTable,
  pendingCalls,
  serverOrders,
  deliveringOrderIds,
  validatingOrderIds,
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
  onFireDesserts,
  onOpenDessertSelector,
  onOpenPreBill,
  onOpenTransferModal,
  onOpenFreeTableModal,
  onExecuteFreeTableDirect,
  onRepeatDrinksRound,
}: ComanderoTableDetailPanelProps) {
  const tableCalls = pendingCalls.filter(c => c.table_number.toString() === selectedTable.table_number.toString())
  const readyOrders = serverOrders.filter(
    o => (o.table_number?.toString() === selectedTable.table_number.toString() || o.table?.table_number?.toString() === selectedTable.table_number.toString()) && o.status === 'ready'
  )
  const validationOrders = serverOrders.filter(
    o => (o.table_number?.toString() === selectedTable.table_number.toString() || o.table?.table_number?.toString() === selectedTable.table_number.toString()) && o.status === 'pending_validation'
  )
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
        <div className="bg-amber-950/90 border-2 border-amber-400 rounded-2xl p-3.5 space-y-2.5 shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-amber-400 animate-pulse" />
              <h4 className="font-black text-xs sm:text-sm text-amber-200 uppercase tracking-wider">
                Validar Mesa #{selectedTable.table_number} ({validationOrders.length})
              </h4>
            </div>
            <span className="text-[11px] font-bold text-amber-300">
              {validationOrders.length} comanda(s)
            </span>
          </div>

          <div className="space-y-2">
            {validationOrders.map((valOrder, idx) => (
              <div
                key={valOrder.id}
                className="bg-slate-900 p-3 rounded-xl border border-amber-500/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shadow-xs"
              >
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase text-amber-400 block">
                      Comanda #{idx + 1}
                    </span>
                    <span className="text-xs font-black text-white tabular-nums">
                      {formatCurrency(valOrder.total_amount)}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-slate-200">
                    {valOrder.order_items?.map(it => `${it.quantity}x ${it.product?.name || 'Plato'}`).join(' + ')}
                  </div>
                  {valOrder.order_items?.some(it => it.notes) && (
                    <p className="text-[11px] text-amber-300 font-semibold">
                      Nota: {valOrder.order_items.map(it => it.notes ? stripInternalStationTags(it.notes) : '').filter(Boolean).join(' | ')}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    disabled={validatingOrderIds.has(valOrder.id)}
                    onClick={() => onValidateOrder(valOrder.id, selectedTable.table_number)}
                    className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:bg-amber-700 disabled:opacity-70 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all uppercase tracking-wide cursor-pointer disabled:cursor-not-allowed"
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
                    className="p-2 rounded-xl bg-red-950/60 hover:bg-red-900 text-red-300 font-black text-xs border border-red-800/80 transition-colors cursor-pointer"
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
        
        {/* Banner destacado: Marchar Postres si hay postres pendientes en la mesa */}
        {hasPendingDesserts && (
          <div className="p-2.5 rounded-2xl bg-purple-50 border-2 border-purple-300 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <span className="text-base">🍰</span>
              <div>
                <span className="text-xs font-black text-purple-950 uppercase tracking-wide block">
                  {hasPendingDessertChoiceInTable ? 'Postre Incluido por Definir' : 'Postres en Espera'}
                </span>
                <span className="text-[11px] font-semibold text-purple-700">
                  {hasPendingDessertChoiceInTable ? 'El comensal o mozo debe elegir el postre' : 'Mesa lista para pase dulce'}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                if (hasPendingDessertChoiceInTable && onOpenDessertSelector) {
                  onOpenDessertSelector()
                } else if (onFireDesserts) {
                  onFireDesserts(selectedTable.table_number)
                }
              }}
              className="h-9 px-3.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs transition-all shadow-xs flex items-center gap-1.5 active:scale-95 cursor-pointer"
              title={hasPendingDessertChoiceInTable ? 'Elegir qué postre desea el comensal' : 'Avisar a cocina que prepare los postres de esta mesa'}
            >
              <Sparkles size={13} />
              <span>{hasPendingDessertChoiceInTable ? 'Elegir Postre y Marchar' : 'Marchar Postres'}</span>
            </button>
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
