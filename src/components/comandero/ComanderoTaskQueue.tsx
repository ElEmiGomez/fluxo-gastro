'use client'

import React from 'react'
import { BellRing, CheckCircle2, Sparkles, Clock, Loader2, UserCheck, Trash2, Bell, Check, X, Wine } from 'lucide-react'
import { Order, Table } from '@/types/database.types'
import { formatCurrency } from '@/lib/utils'
import { PendingServiceCall } from '@/types/comandero.types'
import { cleanItemNotes, getPendingDrinks, getItemCourse } from '@/lib/course-utils'

interface ComanderoTaskQueueProps {
  readyOrdersList: Order[]
  validationOrdersList: Order[]
  pendingCalls: PendingServiceCall[]
  pendingDrinksList?: Order[]
  deliveringOrderIds: Set<string>
  validatingOrderIds: Set<string>
  servingDrinkOrderIds?: Set<string>
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
  onServeDrinks?: (orderId: string) => void
  onServeAllDrinks?: () => void
}

export function ComanderoTaskQueue({
  readyOrdersList,
  validationOrdersList,
  pendingCalls,
  pendingDrinksList = [],
  deliveringOrderIds,
  validatingOrderIds,
  servingDrinkOrderIds,
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
  onServeDrinks,
  onServeAllDrinks,
}: ComanderoTaskQueueProps) {
  const totalPendingTasks =
    readyOrdersList.length +
    validationOrdersList.length +
    pendingCalls.length +
    (pendingDrinksList?.length || 0)

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
                {pendingDrinksList.length > 0 && onServeAllDrinks && (
                  <button
                    type="button"
                    onClick={onServeAllDrinks}
                    className="px-2.5 py-1 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black transition-all shadow-xs flex items-center gap-1 active:scale-95 cursor-pointer"
                  >
                    <Wine className="w-3.5 h-3.5" />
                    <span>Servir Bebidas ({pendingDrinksList.length})</span>
                  </button>
                )}
              </div>
            </div>

            {/* SECCIÓN 1: COMANDAS PENDIENTES DE VALIDACIÓN (REGLA DEL EMBUDO: PASO 1) */}
            {validationOrdersList.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                  <h4 className="text-xs sm:text-sm font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-amber-400 stroke-[2.5]" />
                    <span>Validar Comanda en Mesa ({validationOrdersList.length})</span>
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {validationOrdersList.map(valOrder => {
                    const tblNum = valOrder.table_number || valOrder.table?.table_number

                    return (
                      <div
                        key={valOrder.id}
                        className="bg-slate-900/90 rounded-2xl p-3.5 border-2 border-amber-400 shadow-md flex flex-col justify-between space-y-3 relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-amber-500 via-orange-400 to-amber-500" />
                        <div>
                          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                            <span className="px-2.5 py-0.5 rounded-lg bg-amber-500/30 text-amber-200 border border-amber-400 font-black text-xs">
                              Mesa #{tblNum}
                            </span>
                            <span className="font-black text-xs text-white tabular-nums">
                              {formatCurrency(valOrder.total_amount)}
                            </span>
                          </div>

                          <div className="mt-2 space-y-1.5 max-h-36 overflow-y-auto pr-1">
                            {(() => {
                              const all = valOrder.order_items || []
                              const hasPacks = all.some(it => it.is_pack_header || (it.notes && it.notes.includes('[PACK_HEADER]')) || String(it.product_id || '').startsWith('daily-menu-'))

                              if (!hasPacks) {
                                return all.map((it, idx) => {
                                  const cleanedNotes = cleanItemNotes(it.notes)
                                  return (
                                    <div key={idx} className="text-xs text-slate-300 leading-tight">
                                      <span className="font-black text-amber-400">{it.quantity}x </span>
                                      <span className="font-semibold text-white">{it.product?.name || `Plato #${idx + 1}`}</span>
                                      {cleanedNotes && (
                                        <span className="block text-[10px] text-amber-300 font-bold pl-3">
                                          &bull; {cleanedNotes}
                                        </span>
                                      )}
                                    </div>
                                  )
                                })
                              }

                              const headers = all.filter(it => it.is_pack_header || (it.notes && it.notes.includes('[PACK_HEADER]')) || String(it.product_id || '').startsWith('daily-menu-'))
                              const singles = all.filter(it => !it.is_pack_header && !it.is_pack_component && !(it.notes && (it.notes.includes('[PACK_HEADER]') || it.notes.includes('[COURSE:'))))

                              return (
                                <div className="space-y-1.5">
                                  {headers.map((h, hIdx) => {
                                    const subs = all.filter(s => s !== h && (s.pack_id === h.pack_id || (h.notes && s.notes && s.notes.includes(h.product?.name || '')) || (h.pack_id && s.notes?.includes(h.pack_id))))
                                    return (
                                      <div key={`h-${hIdx}`} className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-400/30">
                                        <div className="text-xs text-amber-300 font-extrabold flex items-center justify-between">
                                          <span>🍽️ {h.quantity}x {h.product?.name || 'Menú'}</span>
                                        </div>
                                        {subs.length > 0 && (
                                          <div className="pl-2 mt-1 space-y-0.5 border-l-2 border-amber-400/40 text-[11px] text-slate-300">
                                            {subs.map((sub, sIdx) => (
                                              <div key={sIdx} className="truncate">
                                                &bull; {sub.product?.name || 'Plato'}
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    )
                                  })}
                                  {singles.map((it, idx) => {
                                    const cleanedNotes = cleanItemNotes(it.notes)
                                    return (
                                      <div key={`s-${idx}`} className="text-xs text-slate-300 leading-tight">
                                        <span className="font-black text-amber-400">{it.quantity}x </span>
                                        <span className="font-semibold text-white">{it.product?.name || `Plato #${idx + 1}`}</span>
                                        {cleanedNotes && (
                                          <span className="block text-[10px] text-amber-300 font-bold pl-3">
                                            &bull; {cleanedNotes}
                                          </span>
                                        )}
                                      </div>
                                    )
                                  })}
                                </div>
                              )
                            })()}
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-800 flex items-center gap-2">
                          <button
                            type="button"
                            disabled={validatingOrderIds.has(valOrder.id)}
                            onClick={() => onValidateOrder(valOrder.id, tblNum)}
                            className="flex-1 py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:bg-amber-700 disabled:opacity-70 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all uppercase tracking-wide cursor-pointer disabled:cursor-not-allowed"
                            title="Aprobar comanda y marchar a cocina/barra"
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

            {/* SECCIÓN 2: BEBIDAS PENDIENTES DE SERVIR EN SALA / BARRA (PASO 2 TRAS APROBAR) */}
            {pendingDrinksList.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                  <h4 className="text-xs sm:text-sm font-black text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Wine className="w-4 h-4 text-cyan-400 stroke-[2.5]" />
                    <span>Barra: Servir Bebidas ({pendingDrinksList.length})</span>
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {pendingDrinksList.map(ord => {
                    const tblNum = ord.table_number || ord.table?.table_number || '?'
                    const pendingDrinks = getPendingDrinks(ord)
                    const isServing = servingDrinkOrderIds?.has(ord.id)

                    return (
                      <div
                        key={`drinks-${ord.id}`}
                        className="bg-slate-900/90 border-2 border-cyan-400/80 rounded-2xl p-3.5 shadow-lg flex flex-col justify-between space-y-3 relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-cyan-500 via-sky-400 to-cyan-500" />
                        <div>
                          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                            <span className="px-3 py-1 rounded-xl bg-cyan-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-xs">
                              <span>Mesa #{tblNum}</span>
                            </span>
                            <span className="text-[11px] font-extrabold text-cyan-300 flex items-center gap-1">
                              <Wine className="w-3.5 h-3.5" />
                              <span>{pendingDrinks.reduce((acc, d) => acc + (d.quantity || 1), 0)} pendiente(s)</span>
                            </span>
                          </div>

                          <div className="mt-2.5 space-y-1.5 max-h-36 overflow-y-auto pr-1">
                            {pendingDrinks.map((it, itemIdx) => {
                              const cleanedNotes = cleanItemNotes(it.notes)
                              return (
                                <div key={itemIdx} className="text-xs text-slate-200 leading-tight">
                                  <span className="font-black text-cyan-400">{it.quantity}x </span>
                                  <span className="font-bold text-white">{it.product?.name || `Bebida #${itemIdx + 1}`}</span>
                                  {cleanedNotes && (
                                    <span className="block text-[10px] text-cyan-200/80 font-bold pl-3 mt-0.5">
                                      &bull; {cleanedNotes}
                                    </span>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-800 flex items-center gap-2">
                          <button
                            type="button"
                            disabled={isServing}
                            onClick={() => onServeDrinks && onServeDrinks(ord.id)}
                            className="flex-1 py-2.5 px-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:bg-cyan-700 disabled:opacity-70 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all uppercase tracking-wide cursor-pointer disabled:cursor-not-allowed"
                            title="Marcar bebidas como servidas"
                          >
                            {isServing ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Registrando...</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                                <span>Bebidas Entregadas</span>
                              </>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const target = tables.find(t => t.table_number.toString() === tblNum.toString())
                              if (target) onSelectTable(target)
                            }}
                            className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-black text-xs border border-slate-700 transition-colors cursor-pointer"
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

            {/* SECCIÓN 3: RECOGER EN COCINA — PLATOS Y POSTRES LISTOS (PASO 4) */}
            {readyOrdersList.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <h4 className="text-xs sm:text-sm font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span>Recoger en Cocina ({readyOrdersList.length})</span>
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {readyOrdersList.map(ord => {
                    const tblNum = ord.table_number || ord.table?.table_number || '?'
                    const waitingMins = ord.created_at ? Math.max(1, Math.floor((Date.now() - new Date(ord.created_at).getTime()) / 60000)) : 1
                    const readyKitchenItems = (ord.order_items || []).filter(it => getItemCourse(it) !== 'drink')
                    const displayItems = readyKitchenItems.length > 0 ? readyKitchenItems : (ord.order_items || [])

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
                            {displayItems.map((it, itemIdx) => {
                              const cleanedNotes = cleanItemNotes(it.notes)
                              return (
                                <div key={itemIdx} className="text-xs text-slate-200 leading-tight">
                                  <span className="font-black text-emerald-400">{it.quantity}x </span>
                                  <span className="font-bold text-white">{it.product?.name || `Plato #${itemIdx + 1}`}</span>
                                  {cleanedNotes && (
                                    <span className="block text-[10px] text-amber-300 font-extrabold pl-3 mt-0.5">
                                      &bull; {cleanedNotes}
                                    </span>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-800 flex items-center gap-2">
                          <button
                            type="button"
                            disabled={deliveringOrderIds.has(ord.id)}
                            onClick={() => onDeliverSingleOrder(ord.id, tblNum)}
                            className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-700 disabled:opacity-70 text-slate-950 disabled:text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all uppercase tracking-wide cursor-pointer disabled:cursor-not-allowed"
                            title="Marcar platos como entregados en mesa"
                          >
                            {deliveringOrderIds.has(ord.id) ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Entregando...</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                                <span>Marcar Entregado en Mesa</span>
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
    </>
  )
}
