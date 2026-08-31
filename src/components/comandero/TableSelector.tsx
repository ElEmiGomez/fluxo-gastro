'use client'

import React, { useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Search, Sparkles, Hash } from 'lucide-react'
import { Table } from '@/types/database.types'

export type TableStatusType = 'free' | 'busy' | 'calling' | 'ready'

interface TableSelectorProps {
  tables: Table[]
  selectedTable: number | string | null
  tableStatuses?: Record<string | number, TableStatusType>
  tableDwellMinutes?: Record<string | number, number>
  onSelectTable: (table: Table) => void
}

export function TableSelector({
  tables,
  selectedTable,
  tableStatuses = {},
  tableDwellMinutes = {},
  onSelectTable,
}: TableSelectorProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [searchTableNum, setSearchTableNum] = useState('')
  const [showSearchInput, setShowSearchInput] = useState(false)
  const [filterAttentionOnly, setFilterAttentionOnly] = useState(false)

  // Garantizar que siempre existan las 25 mesas aunque los datos remotos estén cargando
  const effectiveTables = (tables && tables.length > 0)
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

  // Desplazamiento suave con flechas de navegación para PC y móvil
  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -280 : 280
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' })
    }
  }

  // Filtrado o búsqueda rápida de mesas
  let filteredTables = searchTableNum.trim() === ''
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

          {/* Leyenda de Semáforo */}
          <div className="hidden sm:flex items-center gap-2 text-[10px] text-slate-500 font-bold bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-300" /> Libre</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-600" /> Ocupada</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400" /> Llamando</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Listo</span>
          </div>
        </div>

        {/* Info de Mesa Seleccionada y Buscador */}
        <div className="flex items-center gap-2">
          {/* Botón Filtro Rápido: Solo Mesas Pendientes de Atención */}
          {attentionCount > 0 && (
            <button
              type="button"
              onClick={() => setFilterAttentionOnly(prev => !prev)}
              className={`px-2.5 py-1 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-xs border active:scale-95 ${
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
                onChange={(e) => setSearchTableNum(e.target.value)}
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
              className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold flex items-center gap-1 transition-colors border border-slate-200"
              title="Buscar mesa por número"
            >
              <Search className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px]">Buscar</span>
            </button>
          )}

          {selectedTable && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-600">
                Comanda: <strong className="font-black text-sm text-slate-900">Mesa #{selectedTable}</strong>
              </span>
              {currentStatus === 'ready' && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-black animate-pulse flex items-center gap-1 shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                  ¡LISTO!
                </span>
              )}
              {currentStatus === 'calling' && (
                <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black animate-bounce flex items-center gap-1 shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-950 animate-ping" />
                  AVISO
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* CARRUSEL DE MESAS CON FLECHAS INTERACTIVAS PARA PC Y MÓVIL */}
      <div className="max-w-7xl mx-auto flex items-center gap-1.5 relative">
        
        {/* Flecha Izquierda para desplazar */}
        <button
          type="button"
          onClick={() => handleScroll('left')}
          className="p-2 rounded-xl bg-slate-100 hover:bg-blue-900 hover:text-white text-slate-700 transition-all shadow-xs border border-slate-200 flex-shrink-0 flex items-center justify-center active:scale-95"
          title="Ver mesas anteriores"
        >
          <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
        </button>

        {/* Contenedor con Scroll Suave */}
        <div
          ref={scrollRef}
          className="flex-1 flex gap-2 overflow-x-auto py-1 scroll-smooth no-scrollbar"
        >
          {filteredTables.length === 0 ? (
            <div className="flex-1 flex items-center justify-center py-2 text-xs text-slate-400 font-bold">
              {filterAttentionOnly ? 'No hay mesas con avisos pendientes' : 'No se encontraron mesas'}
            </div>
          ) : (
            filteredTables.map((table) => {
            const isSelected = selectedTable?.toString() === table.table_number.toString()
            const status: TableStatusType = tableStatuses[table.table_number] || 'free'

            let statusBorder = 'border-slate-200 bg-slate-50 text-slate-700'
            let indicatorColor = 'bg-slate-300'
            let badge: React.ReactNode = null

            if (status === 'ready') {
              if (isSelected) {
                statusBorder = 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-400 border-emerald-700 animate-pulse'
                indicatorColor = 'bg-white'
                badge = (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-white text-emerald-900 uppercase font-black shadow-xs">
                    LISTO
                  </span>
                )
              } else {
                statusBorder = 'border-emerald-400 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-400/60 animate-pulse'
                indicatorColor = 'bg-emerald-500'
                badge = (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-emerald-600 text-white uppercase font-black">
                    LISTO
                  </span>
                )
              }
            } else if (status === 'calling') {
              if (isSelected) {
                statusBorder = 'bg-amber-500 text-slate-950 shadow-md ring-2 ring-amber-400 border-amber-600 animate-bounce'
                indicatorColor = 'bg-slate-950'
                badge = (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-slate-950 text-amber-300 uppercase font-black shadow-xs">
                    AVISO
                  </span>
                )
              } else {
                statusBorder = 'border-amber-400 bg-amber-50 text-amber-950 ring-2 ring-amber-400/60 animate-bounce'
                indicatorColor = 'bg-amber-500'
                badge = (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-amber-500 text-slate-950 uppercase font-black">
                    AVISO
                  </span>
                )
              }
            } else if (status === 'busy') {
              if (isSelected) {
                statusBorder = 'bg-blue-900 text-white shadow-md border-blue-950 ring-2 ring-blue-700/50'
                indicatorColor = 'bg-white'
              } else {
                statusBorder = 'border-blue-300 bg-blue-50 text-blue-950'
                indicatorColor = 'bg-blue-600'
              }
            } else {
              // Free (Libre)
              if (isSelected) {
                statusBorder = 'bg-blue-900 text-white shadow-md border-blue-950 ring-2 ring-blue-700/50'
                indicatorColor = 'bg-white'
              } else {
                statusBorder = 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                indicatorColor = 'bg-slate-300'
              }
            }

            const dwellMinutes = tableDwellMinutes[table.table_number]

            return (
              <button
                key={table.id}
                type="button"
                onClick={() => onSelectTable(table)}
                className={`flex-shrink-0 px-3.5 py-2 rounded-2xl font-black text-xs flex items-center gap-1.5 transition-all duration-150 ease-out border shadow-xs active:scale-95 ${statusBorder}`}
              >
                <span className={`w-2 h-2 rounded-full ${indicatorColor} transition-colors duration-200`} />
                <span>Mesa #{table.table_number}</span>
                {Boolean(dwellMinutes && status !== 'free') && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${
                    isSelected ? 'bg-white/25 text-white' : 'bg-blue-100 text-blue-900'
                  }`}>
                    {dwellMinutes}&apos;
                  </span>
                )}
                {badge}
              </button>
            )
          }))}
        </div>

        {/* Flecha Derecha para desplazar */}
        <button
          type="button"
          onClick={() => handleScroll('right')}
          className="p-2 rounded-xl bg-slate-100 hover:bg-blue-900 hover:text-white text-slate-700 transition-all shadow-xs border border-slate-200 flex-shrink-0 flex items-center justify-center active:scale-95"
          title="Ver siguientes mesas"
        >
          <ChevronRight className="w-4 h-4 stroke-[2.5]" />
        </button>

      </div>
    </div>
  )
}
