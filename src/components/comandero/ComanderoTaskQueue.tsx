'use client'

import React from 'react'
import { BellRing, CheckCircle2, Sparkles, Clock, Loader2, UserCheck, Trash2, Bell, Check, X } from 'lucide-react'
import { Order, Table } from '@/types/database.types'
import { formatCurrency } from '@/lib/utils'
import { PendingServiceCall } from '@/types/comandero.types'

interface ComanderoTaskQueueProps {
  readyOrdersList: Order[]
  validationOrdersList: Order[]
  pendingCalls: PendingServiceCall[]
  deliveringOrderIds: Set<string>
  validatingOrderIds: Set<string>
  dismissedReadyBannerOrderIds: Set<string>
  tables: Table[]
  onDeliverSingleOrder: (orderId: string, tblNum?: any) => void
  onDeliverAllReady: () => void
  onAttendCall: (callId: string) => void
  onAttendAllCalls: () => void
  onValidateOrder: (orderId: string, tblNum?: any) => void
  onCancelValidationOrder: (orderId: string, tblNum?: any) => void
  onSelectTable: (table: Table) => void
  onDismissReadyBanner: (orderId: string) => void
  onOpenFreeTableModal?: (tblNum: string | number) => void
}

export function ComanderoTaskQueue({
  readyOrdersList,
  validationOrdersList,
  pendingCalls,
  deliveringOrderIds,
  validatingOrderIds,
  dismissedReadyBannerOrderIds,
  tables,
  onDeliverSingleOrder,
  onDeliverAllReady,
  onAttendCall,
  onAttendAllCalls,
  onValidateOrder,
  onCancelValidationOrder,
  onSelectTable,
  onDismissReadyBanner,
  onOpenFreeTableModal,
}: ComanderoTaskQueueProps) {
  const totalPendingTasks = readyOrdersList.length + validationOrdersList.length + pendingCalls.length

  return (
    <>
      {/* 1. CENTRO DE TAREAS Y AVISOS PENDIENTES DEL MOZO */}
      {totalPendingTasks > 0 && (
        <div className="bg-gradient-to-b from-slate-900 to-slate-950 text-white border-b-4 border-amber-400 p-3.5 sm:p-4 shadow-xl space-y-3.5">
          <div className="max-w-7xl mx-auto space-y-3">
            {/* Encabezado General */}
            <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="w-3.5 h-3.5 rounded-full bg-amber-400 animate-ping flex-shrink-0" />
                <h3 className="text-sm sm:text-base font-black text-amber-300 uppercase tracking-wide flex items-center gap-2">
                  <BellRing className="w-5 h-5 text-amber-400 stroke-[2.5]" />
                  <span>Centro de Tareas y Avisos Pendientes ({totalPendingTasks})</span>
                </h3>
              </div>
              <div className="flex items-center gap-2">
                {readyOrdersList.length > 0 && (
                  <button
                    type="button"
                    onClick={onDeliverAllReady}
                    className="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition-all shadow-xs flex items-center gap-1 active:scale-95 cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Servir Todos ({readyOrdersList.length})</span>
                  </button>
                )}
                {pendingCalls.length > 0 && (
                  <button
                    type="button"
                    onClick={onAttendAllCalls}
                    className="px-2.5 py-1 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition-all shadow-xs flex items-center gap-1 active:scale-95 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Atender Avisos ({pendingCalls.length})</span>
                  </button>
                )}
              </div>
            </div>

            {/* SECCIÓN A: COMANDAS LISTAS PARA SERVIR EN SALA */}
            {readyOrdersList.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <h4 className="text-xs sm:text-sm font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span>Platos Listos en Cocina para Servir ({readyOrdersList.length})</span>
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {readyOrdersList.map(ord => {
                    const tblNum = ord.table_number || ord.table?.table_number || '?'
                    const waitingMins = ord.created_at ? Math.max(1, Math.floor((Date.now() - new Date(ord.created_at).getTime()) / 60000)) : 1

                    return (
                      <div
                        key={ord.id}
                        className="bg-slate-900/90 border-2 border-emerald-400 rounded-2xl p-3.5 shadow-lg flex flex-col justify-between space-y-3 relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500" />
                        <div>
                          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                            <span className="px-3 py-1 rounded-xl bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-xs">
                              <span>Mesa #{tblNum}</span>
                            </span>
                            <span className="text-[11px] font-extrabold text-emerald-300 flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              <span>Listo (hace {waitingMins} min)</span>
                            </span>
                          </div>

                          <div className="mt-2.5 space-y-1.5 max-h-36 overflow-y-auto pr-1">
                            {(ord.order_items || []).map((it, itemIdx) => (
                              <div key={itemIdx} className="text-xs text-slate-200 leading-tight">
                                <span className="font-black text-emerald-400">{it.quantity}x </span>
                                <span className="font-bold text-white">{it.product?.name || `Plato #${itemIdx + 1}`}</span>
                                {it.notes && (
                                  <span className="block text-[10px] text-amber-300 font-extrabold pl-3 mt-0.5">
                                    &bull; {it.notes}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-800 flex items-center gap-2">
                          <button
                            type="button"
                            disabled={deliveringOrderIds.has(ord.id)}
                            onClick={() => onDeliverSingleOrder(ord.id, tblNum)}
                            className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-700 disabled:opacity-70 text-slate-950 disabled:text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all uppercase tracking-wide cursor-pointer disabled:cursor-not-allowed"
                            title="Marcar como servido en mesa"
                          >
                            {deliveringOrderIds.has(ord.id) ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Entregando...</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                                <span>Marcar Servido</span>
                              </>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const target = tables.find(t => t.table_number.toString() === tblNum.toString())
                              if (target) onSelectTable(target)
                            }}
                            className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 font-black text-xs border border-slate-700 transition-colors cursor-pointer"
                            title="Ver mesa en comandero"
                          >
                            Ver Mesa
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* SECCIÓN B: COMANDAS PENDIENTES DE VALIDACIÓN EN MESA */}
            {validationOrdersList.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
                  <h4 className="text-xs sm:text-sm font-black text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-blue-400 stroke-[2.5]" />
                    <span>Validación Requerida en Mesa ({validationOrdersList.length})</span>
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {validationOrdersList.map(valOrder => {
                    const tblNum = valOrder.table_number || valOrder.table?.table_number

                    return (
                      <div
                        key={valOrder.id}
                        className="bg-slate-900/90 rounded-2xl p-3.5 border-2 border-blue-400/80 shadow-md flex flex-col justify-between space-y-3"
                      >
                        <div>
                          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                            <span className="px-2.5 py-0.5 rounded-lg bg-blue-500/30 text-blue-200 border border-blue-400 font-black text-xs">
                              Mesa #{tblNum}
                            </span>
                            <span className="font-black text-xs text-white tabular-nums">
                              {formatCurrency(valOrder.total_amount)}
                            </span>
                          </div>

                          <div className="mt-2 space-y-1.5 max-h-36 overflow-y-auto pr-1">
                            {(valOrder.order_items || []).map((it, idx) => (
                              <div key={idx} className="text-xs text-slate-300 leading-tight">
                                <span className="font-black text-blue-400">{it.quantity}x </span>
                                <span className="font-semibold text-white">{it.product?.name || `Plato #${idx + 1}`}</span>
                                {it.notes && (
                                  <span className="block text-[10px] text-amber-300 font-bold pl-3">
                                    &bull; {it.notes}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-800 flex items-center gap-2">
                          <button
                            type="button"
                            disabled={validatingOrderIds.has(valOrder.id)}
                            onClick={() => onValidateOrder(valOrder.id, tblNum)}
                            className="flex-1 py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:opacity-70 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all uppercase tracking-wide cursor-pointer disabled:cursor-not-allowed"
                            title="Enviar a cocina tras verificar verbalmente en mesa"
                          >
                            {validatingOrderIds.has(valOrder.id) ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin text-white" />
                                <span>Confirmando...</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                                <span>Confirmar a Cocina</span>
                              </>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`¿Descartar comanda de Mesa #${tblNum}?`)) {
                                onCancelValidationOrder(valOrder.id, tblNum)
                              }
                            }}
                            className="p-2.5 rounded-xl bg-red-950/60 hover:bg-red-900 text-red-300 font-black text-xs border border-red-800/80 transition-colors cursor-pointer"
                            title="Descartar comanda"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* SECCIÓN C: AVISOS DE SALÓN Y COBRO */}
            {pendingCalls.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                  <h4 className="text-xs sm:text-sm font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Bell className="w-4 h-4 text-amber-400 stroke-[2.5]" />
                    <span>Avisos y Cobros de Salón ({pendingCalls.length})</span>
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {pendingCalls.map(call => {
                    const isBill = call.text.toLowerCase().includes('cuenta')
                    return (
                      <div
                        key={call.id}
                        className={`p-3.5 rounded-2xl border-2 shadow-md flex items-center justify-between gap-3 transition-all ${
                          isBill
                            ? 'bg-emerald-950/90 border-emerald-400 text-white'
                            : 'bg-slate-900/90 border-amber-400 text-white'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            const tbl = tables.find(t => t.table_number.toString() === call.table_number.toString())
                            if (tbl) onSelectTable(tbl)
                          }}
                          className="flex items-center gap-2.5 min-w-0 flex-1 text-left cursor-pointer"
                        >
                          <span className={`px-2.5 py-1 rounded-xl text-xs font-black flex-shrink-0 ${
                            isBill ? 'bg-emerald-400 text-slate-950' : 'bg-amber-400 text-slate-950'
                          }`}>
                            Mesa #{call.table_number}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-black truncate">{call.text}</p>
                            <span className="text-[10px] text-slate-400 block mt-0.5 font-semibold">Toca para abrir mesa</span>
                          </div>
                        </button>

                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              if (isBill && onOpenFreeTableModal) {
                                onOpenFreeTableModal(call.table_number)
                              } else {
                                onAttendCall(call.id)
                              }
                            }}
                            aria-label={isBill ? `Confirmar cobro de Mesa #${call.table_number}` : `Marcar aviso atendido de Mesa #${call.table_number}`}
                            className={`px-3 py-2 rounded-xl text-xs font-black shadow-md transition-all active:scale-95 flex items-center gap-1 cursor-pointer ${
                              isBill
                                ? 'bg-emerald-400 hover:bg-emerald-300 text-slate-950'
                                : 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                            }`}
                            title={isBill ? 'Confirmar cobro' : 'Marcar como atendido'}
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            <span>{isBill ? 'Cobrado' : 'Atendido'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onAttendCall(call.id)}
                            aria-label="Cerrar aviso"
                            className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Cerrar aviso"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* Alertas Flotantes Permanentes de Comandas Listas para Servir */}
      {readyOrdersList.filter(ord => !dismissedReadyBannerOrderIds.has(ord.id)).map(ord => {
        const tblNum = ord.table_number || ord.table?.table_number || '?'
        const itemsCount = (ord.order_items || []).reduce((acc, it) => acc + (it.quantity || 1), 0)
        const itemsSummary = (ord.order_items || []).map(it => `${it.quantity}x ${it.product?.name || 'Plato'}`).join(', ')

        return (
          <div
            key={`float-ready-${ord.id}`}
            className="fixed top-16 inset-x-3 z-50 max-w-lg mx-auto p-3.5 sm:p-4 rounded-2xl bg-emerald-600 text-white font-black shadow-2xl flex items-center justify-between gap-3 border-2 border-emerald-400 animate-in slide-in-from-top duration-300"
          >
            <div
              onClick={() => {
                const target = tables.find(t => t.table_number.toString() === tblNum.toString())
                if (target) onSelectTable(target)
              }}
              className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
              title="Toca para ir a la mesa"
            >
              <div className="w-10 h-10 rounded-xl bg-white text-emerald-900 flex items-center justify-center flex-shrink-0 font-black shadow-xs animate-bounce">
                <Sparkles className="w-6 h-6 text-emerald-600" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] uppercase font-black tracking-wider bg-emerald-700/90 text-white px-2 py-0.5 rounded-md">
                    Mesa #{tblNum}
                  </span>
                  <span className="text-[10px] text-emerald-100 font-extrabold">
                    {itemsCount} {itemsCount === 1 ? 'plato listo' : 'platos listos'}
                  </span>
                </div>
                <div className="text-xs sm:text-sm font-black uppercase text-white truncate mt-0.5">
                  ¡Comanda Lista en Cocina!
                </div>
                <div className="text-[10px] text-emerald-100 truncate font-semibold">
                  {itemsSummary}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                type="button"
                disabled={deliveringOrderIds.has(ord.id)}
                onClick={() => onDeliverSingleOrder(ord.id, tblNum)}
                className="px-3 py-2 rounded-xl bg-white hover:bg-emerald-50 disabled:opacity-70 text-emerald-950 font-black text-xs shadow-md active:scale-95 transition-all flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
                title="Marcar como servido"
              >
                {deliveringOrderIds.has(ord.id) ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-700" />
                    <span>Entregando...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 text-emerald-700 stroke-[3]" />
                    <span>Servir</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => onDismissReadyBanner(ord.id)}
                className="p-2 rounded-xl bg-emerald-700/80 hover:bg-emerald-800 text-white transition-colors cursor-pointer"
                title="Ocultar aviso flotante"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )
      })}
    </>
  )
}
