'use client'

import React, { useState } from 'react'
import {
  X,
  ArrowRightLeft,
  Users,
  MoveRight,
  Merge,
  AlertCircle,
  CheckCircle2,
  Sparkles,
} from 'lucide-react'
import { Table, Order } from '@/types/database.types'
import { TableStatusType } from '@/components/comandero/TableSelector'

interface TableMoveMergeSheetProps {
  isOpen: boolean
  onClose: () => void
  sourceTable: Table | null
  tables: Table[]
  tableStatuses?: Record<string | number, TableStatusType>
  serverOrders: Order[]
  onExecuteMoveOrMerge: (
    sourceTableNum: string | number,
    targetTableNum: string | number,
    isMerge: boolean
  ) => Promise<void>
}

export function TableMoveMergeSheet({
  isOpen,
  onClose,
  sourceTable,
  tables,
  tableStatuses = {},
  serverOrders,
  onExecuteMoveOrMerge,
}: TableMoveMergeSheetProps) {
  const [selectedTarget, setSelectedTarget] = useState<Table | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen || !sourceTable) return null

  // Determinar si la mesa destino está ocupada o libre
  const targetStatus = selectedTarget
    ? tableStatuses[selectedTarget.table_number] || 'free'
    : 'free'

  // Comprobar si hay órdenes activas en la mesa destino para confirmar si es fusión
  const targetHasOrders = selectedTarget
    ? serverOrders.some(
        o =>
          (o.table_number?.toString() === selectedTarget.table_number.toString() ||
            o.table?.table_number?.toString() === selectedTarget.table_number.toString()) &&
          o.status !== 'cancelled' &&
          o.status !== 'paid'
      )
    : false

  const isMerge = targetStatus === 'busy' || targetHasOrders

  const handleConfirmAction = async () => {
    if (!selectedTarget) return
    setIsSubmitting(true)
    try {
      await onExecuteMoveOrMerge(sourceTable.table_number, selectedTarget.table_number, isMerge)
      onClose()
    } finally {
      setIsSubmitting(false)
    }
  }

  // Filtrar mesas distintas a la origen
  const candidateTables = tables.filter(
    t => t.table_number.toString() !== sourceTable.table_number.toString()
  )

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-t-3xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Encabezado */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-black shadow-md">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                Mover o Unir • Mesa #{sourceTable.table_number}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Toque 2: Selecciona la mesa de destino
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Resumen explicativo según destino */}
        <div className="px-4 py-3 bg-amber-50 dark:bg-amber-950/20 border-b border-amber-200/60 dark:border-amber-900/30 text-xs text-amber-900 dark:text-amber-300">
          {!selectedTarget ? (
            <p className="flex items-center gap-1.5 font-medium">
              <span className="font-bold">Mesa Libre:</span> Traslado instantáneo. •{' '}
              <span className="font-bold">Mesa Ocupada:</span> Fusión de comandas y cuentas.
            </p>
          ) : isMerge ? (
            <p className="flex items-center gap-1.5 font-bold text-blue-700 dark:text-blue-300">
              <Merge className="w-4 h-4 text-blue-600 flex-shrink-0" />
              Fusión: Se unirán los platos y saldos en Mesa #{selectedTarget.table_number}. La Mesa #
              {sourceTable.table_number} quedará Libre.
            </p>
          ) : (
            <p className="flex items-center gap-1.5 font-bold text-emerald-700 dark:text-emerald-300">
              <MoveRight className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              Traslado: Se muda la comanda a la Mesa #{selectedTarget.table_number}. La Mesa #
              {sourceTable.table_number} quedará Libre.
            </p>
          )}
        </div>

        {/* Cuadrícula de selección táctil de mesa de destino */}
        <div className="p-4 sm:p-5 flex-1 overflow-y-auto">
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
            {candidateTables.map(t => {
              const status = tableStatuses[t.table_number] || 'free'
              const isSelected = selectedTarget?.id === t.id
              const hasOrders = serverOrders.some(
                o =>
                  (o.table_number?.toString() === t.table_number.toString() ||
                    o.table?.table_number?.toString() === t.table_number.toString()) &&
                  o.status !== 'cancelled' &&
                  o.status !== 'paid'
              )
              const isBusy = status === 'busy' || hasOrders

              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedTarget(t)}
                  className={`p-3 rounded-2xl flex flex-col items-center justify-between min-h-[82px] border transition-all active:scale-95 cursor-pointer ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/90 dark:bg-blue-950/40 ring-2 ring-blue-500 shadow-md text-blue-950 dark:text-white'
                      : isBusy
                      ? 'border-blue-200 dark:border-blue-900 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-blue-50/30'
                      : 'border-emerald-200 dark:border-emerald-900 bg-emerald-50/30 dark:bg-emerald-950/10 text-slate-800 dark:text-slate-200 hover:bg-emerald-50/60'
                  }`}
                >
                  <div className="w-full flex items-center justify-between text-[11px] font-black">
                    <span>Mesa #{t.table_number}</span>
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        isBusy ? 'bg-blue-600' : 'bg-emerald-500'
                      }`}
                    />
                  </div>

                  <div className="text-[10px] font-bold mt-1 text-slate-500 dark:text-slate-400">
                    {isBusy ? 'Ocupada (Unir)' : 'Libre (Mover)'}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Botón de Confirmación en el Toque 2 */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/90">
          <button
            type="button"
            disabled={!selectedTarget || isSubmitting}
            onClick={handleConfirmAction}
            className={`w-full py-3.5 px-4 rounded-xl font-black text-sm text-white flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-95 disabled:opacity-40 cursor-pointer ${
              isMerge ? 'bg-blue-600 hover:bg-blue-700' : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            {isMerge ? (
              <>
                <Merge className="w-5 h-5" />
                <span>
                  Confirmar Fusión: Mesa #{sourceTable.table_number} ➔ Mesa #{selectedTarget?.table_number}
                </span>
              </>
            ) : (
              <>
                <MoveRight className="w-5 h-5" />
                <span>
                  Confirmar Traslado: Mesa #{sourceTable.table_number} ➔ Mesa #{selectedTarget?.table_number}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
