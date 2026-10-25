'use client'

import React, { useState, useMemo } from 'react'
import { Bell, Check, X } from 'lucide-react'
import { Table } from '@/types/database.types'
import { PendingServiceCall } from '@/types/comandero.types'

interface ComanderoTaskQueueProps {
  pendingCalls: PendingServiceCall[]
  tables: Table[]
  onAttendCall: (callId: string) => void
  onAttendAllCalls: () => void
  onSelectTable: (table: Table) => void
  onOpenFreeTableModal?: (tblNum: string | number) => void
  // Props de compatibilidad (los avisos operativos ahora se visualizan en los cubitos de mesa)
  readyOrdersList?: any[]
  validationOrdersList?: any[]
  pendingDrinksList?: any[]
  pendingDessertsList?: any[]
  deliveringOrderIds?: Set<string>
  validatingOrderIds?: Set<string>
  servingDrinkOrderIds?: Set<string>
  dismissedReadyBannerOrderIds?: Set<string>
  onDeliverSingleOrder?: (orderId: string, tblNum?: any) => void
  onDeliverAllReady?: () => void
  onValidateOrder?: (orderId: string, tblNum?: any) => void
  onCancelValidationOrder?: (orderId: string, tblNum?: any) => void
  onDismissReadyBanner?: (orderId: string) => void
  onServeDrinks?: (orderId: string) => void
  onServeAllDrinks?: () => void
  onFireOrderDesserts?: (orderId: string) => void
  onDeliverOrderDessertsDirect?: (orderId: string) => void
  onOpenDessertSelectorForTable?: (tableNum: string | number) => void
  onDeliverStarters?: (orderId: string) => void
  onDeliverMains?: (orderId: string) => void
}

export function ComanderoTaskQueue({
  pendingCalls,
  tables,
  onAttendCall,
  onAttendAllCalls,
  onSelectTable,
  onOpenFreeTableModal,
}: ComanderoTaskQueueProps) {
  // Estado local para descartar temporalmente llamadas mediante la 'X'
  const [dismissedCallIds, setDismissedCallIds] = useState<Set<string>>(new Set())

  const handleDismiss = (callId: string) => {
    setDismissedCallIds(prev => new Set(prev).add(callId))
  }

  // Filtrado de llamadas no descartadas
  const activePendingCalls = useMemo(
    () => (pendingCalls || []).filter(c => !dismissedCallIds.has(c.id)),
    [pendingCalls, dismissedCallIds]
  )

  // Si no hay avisos de salón, la barra no ocupa espacio en pantalla
  if (activePendingCalls.length === 0) {
    return null
  }

  return (
    <div className="bg-slate-900 text-slate-100 border-b border-slate-700/80 p-3 sm:p-3.5 shadow-xl select-none">
      <div className="max-w-7xl mx-auto space-y-2.5">
        
        {/* Encabezado de Avisos de Salón */}
        <div className="flex items-center justify-between flex-wrap gap-2 pb-1.5 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-400 animate-ping flex-shrink-0" />
            <h3 className="text-xs sm:text-sm font-black text-amber-300 uppercase tracking-wide flex items-center gap-1.5">
              <Bell className="w-4 h-4 text-amber-400 stroke-[2.5]" />
              <span>Avisos y Cobros de Salón ({activePendingCalls.length})</span>
            </h3>
          </div>
          
          {activePendingCalls.length > 1 && (
            <button
              type="button"
              onClick={onAttendAllCalls}
              className="px-2.5 py-1 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition-all shadow-xs flex items-center gap-1 active:scale-95 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Atender Todos ({activePendingCalls.length})</span>
            </button>
          )}
        </div>

        {/* Grilla de Avisos y Solicitudes de Cuenta */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {activePendingCalls.map(call => {
            const isBill = Boolean(
              call.call_type?.startsWith('bill') ||
              call.call_type?.includes('bill') ||
              call.text?.toLowerCase().includes('cuenta')
            )
            return (
              <div
                key={call.id}
                className={`p-3 rounded-2xl border-2 shadow-md flex items-center justify-between gap-3 transition-all ${
                  isBill
                    ? 'bg-emerald-950/90 border-emerald-400 text-white'
                    : 'bg-slate-800/90 border-amber-400 text-white'
                }`}
              >
                {/* Botón para saltar a la mesa */}
                <button
                  type="button"
                  onClick={() => {
                    const tbl = tables.find(t => t.table_number.toString() === call.table_number.toString())
                    if (tbl) onSelectTable(tbl)
                  }}
                  className="flex items-center gap-2.5 min-w-0 flex-1 text-left cursor-pointer"
                  title="Abrir mesa en el comandero"
                >
                  <span
                    className={`px-2.5 py-1 rounded-xl text-xs font-black flex-shrink-0 shadow-xs ${
                      isBill ? 'bg-emerald-400 text-slate-950' : 'bg-amber-400 text-slate-950'
                    }`}
                  >
                    Mesa #{call.table_number}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-black truncate">{call.text}</p>
                    <span className="text-[10px] text-slate-400 block mt-0.5 font-semibold">Toca para abrir mesa</span>
                  </div>
                </button>

                {/* Acciones: Atender / Cobrar y Cerrar con 'X' */}
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
                    className={`px-3 py-1.5 rounded-xl text-xs font-black shadow-md transition-all active:scale-95 flex items-center gap-1 cursor-pointer ${
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
                    onClick={() => {
                      handleDismiss(call.id)
                      onAttendCall(call.id)
                    }}
                    aria-label="Cerrar aviso"
                    className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
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
    </div>
  )
}
