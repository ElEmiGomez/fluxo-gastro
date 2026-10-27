'use client'

import React, { useState } from 'react'
import {
  Smartphone,
  ChefHat,
  QrCode,
  Star,
  Calculator,
  CheckCircle2,
  Clock,
  Sparkles,
  Lock,
  Unlock,
  Layers,
  ArrowRight,
  TrendingUp,
  Receipt,
  Gift,
  ShieldCheck,
  Check
} from 'lucide-react'
import { ScrollReveal } from './ScrollReveal'

type TabKey = 'comandero' | 'kds' | 'carta' | 'fidelizacion' | 'caja'

interface FeatureTabsProps {
  onOpenPilotModal: (plan?: string) => void
}

interface TableItem {
  id: number
  name: string
  status: 'libre' | 'ocupada' | 'sobremesa'
  diners: number
  total: number
  items: string
  marched: boolean
}

const INITIAL_TABLES: TableItem[] = [
  { id: 1, name: 'Mesa 1', status: 'libre', diners: 0, total: 0, items: 'Sin comanda activa', marched: false },
  { id: 2, name: 'Mesa 2', status: 'ocupada', diners: 2, total: 38.50, items: '2x Smash Burger, 1x Patatas Rústicas, 2x Bebidas', marched: false },
  { id: 3, name: 'Mesa 3', status: 'sobremesa', diners: 4, total: 74.00, items: '4x Hamburguesas, 2x Nachos, 4x Cervezas, 2x Tartas', marched: true },
  { id: 4, name: 'Mesa 4', status: 'ocupada', diners: 3, total: 52.80, items: '3x Smash Burger, 1x Alitas BBQ, 3x Refrescos', marched: false },
  { id: 5, name: 'Mesa 5', status: 'libre', diners: 0, total: 0, items: 'Sin comanda activa', marched: false },
  { id: 6, name: 'Mesa 6', status: 'sobremesa', diners: 2, total: 29.50, items: '2x Ensaladas César, 2x Aguas con gas, 2x Cafés', marched: true },
]

interface QrDishPreview {
  id: string
  name: string
  desc: string
  price: number
  badge?: string
  tags: string[]
  isGlutenFree: boolean
  isLactoseFree: boolean
  crossSell: { name: string; price: number }
}

const QR_DISHES_PREVIEW: QrDishPreview[] = [
  {
    id: 'picanha',
    name: 'Smash Burger de Picaña (Pan SG)',
    desc: 'Carne madurada 2x90g, queso artesano sin lactosa y pan artesano sin gluten.',
    price: 13.90,
    badge: 'Apto Celíacos & Sin Lactosa',
    tags: ['Sin Gluten', 'Sin Lactosa'],
    isGlutenFree: true,
    isLactoseFree: true,
    crossSell: { name: 'Cerveza Artesana Sin Gluten', price: 3.80 },
  },
  {
    id: 'trufada',
    name: 'Smash Doble Trufada',
    desc: 'Carne madurada 180g, cheddar curado inglés y mayonesa trufada casera.',
    price: 14.50,
    tags: ['Contiene Gluten', 'Contiene Lactosa'],
    isGlutenFree: false,
    isLactoseFree: false,
    crossSell: { name: 'Patatas Trufadas con Parmesano', price: 5.20 },
  },
  {
    id: 'pollo',
    name: 'Burger Pollo Crujiente',
    desc: 'Contramuslo marinado 24h, rebozado crujiente de maíz y mayonesa de lima.',
    price: 12.50,
    badge: 'Sin Lactosa',
    tags: ['Sin Lactosa'],
    isGlutenFree: false,
    isLactoseFree: true,
    crossSell: { name: 'Kombucha Orgánica de Frutos Rojos', price: 3.50 },
  },
]

export function FeatureTabs({ onOpenPilotModal }: FeatureTabsProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('comandero')

  // Estado interactivo para Comandero (mesas ricas y reactivas)
  const [tables, setTables] = useState<TableItem[]>(INITIAL_TABLES)
  const [selectedTableId, setSelectedTableId] = useState<number>(2)

  // Estado interactivo para KDS (completar tickets)
  const [kdsCompletedTickets, setKdsCompletedTickets] = useState<Record<number, boolean>>({})

  // Estado interactivo para Fidelización
  const [loyaltyStamps, setLoyaltyStamps] = useState<number>(4)

  // Estado interactivo para Carta QR (filtro alérgenos y venta cruzada)
  const [activeAllergenFilter, setActiveAllergenFilter] = useState<'todos' | 'sin-gluten' | 'sin-lactosa'>('todos')
  const [addedCrossSells, setAddedCrossSells] = useState<Record<string, boolean>>({})

  const selectedTable = tables.find((t) => t.id === selectedTableId) || tables[1]

  const handleToggleMarch = (tableId: number) => {
    setTables((prev) =>
      prev.map((t) => (t.id === tableId ? { ...t, marched: !t.marched } : t))
    )
  }

  const handleOpenTable = (tableId: number) => {
    setTables((prev) =>
      prev.map((t) =>
        t.id === tableId
          ? {
              ...t,
              status: 'ocupada',
              diners: 2,
              total: 24.50,
              items: '1x Combo Pareja (2x Smash + Patatas + Bebidas)',
              marched: false,
            }
          : t
      )
    )
  }

  const handleFreeTable = (tableId: number) => {
    setTables((prev) =>
      prev.map((t) =>
        t.id === tableId
          ? {
              ...t,
              status: 'libre',
              diners: 0,
              total: 0,
              items: 'Sin comanda activa',
              marched: false,
            }
          : t
      )
    )
  }

  const filteredQrDishes = QR_DISHES_PREVIEW.filter((dish) => {
    if (activeAllergenFilter === 'sin-gluten') return dish.isGlutenFree
    if (activeAllergenFilter === 'sin-lactosa') return dish.isLactoseFree
    return true
  })

  return (
    <section id="modulos" className="py-20 bg-slate-50 border-t border-slate-200 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Cabecera de la sección */}
        <ScrollReveal distance={24}>
          <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
            <span className="text-xs font-black uppercase tracking-wider text-blue-600">
              Arquitectura Modular en Tiempo Real
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
              Los 5 engranajes sincronizados de Fluxo
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              Cada módulo funciona de manera autónoma pero habla con los demás en menos de 100 ms. Elige un módulo para explorar su interfaz.
            </p>
          </div>
        </ScrollReveal>

        {/* ── BARRA DE PESTAÑAS INTERACTIVAS ── */}
        <div className="flex items-center justify-start lg:justify-center gap-2 overflow-x-auto pb-4 mb-10 no-scrollbar">
          
          <button
            type="button"
            onClick={() => setActiveTab('comandero')}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs sm:text-sm font-black whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'comandero'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 border border-blue-600'
                : 'bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50 border border-slate-200 shadow-xs'
            }`}
          >
            <Smartphone className="w-4 h-4 flex-shrink-0" />
            <span>1. Comandero Móvil</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('kds')}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs sm:text-sm font-black whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'kds'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 border border-blue-600'
                : 'bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50 border border-slate-200 shadow-xs'
            }`}
          >
            <ChefHat className="w-4 h-4 flex-shrink-0" />
            <span>2. Monitor KDS Cocina</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('carta')}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs sm:text-sm font-black whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'carta'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 border border-blue-600'
                : 'bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50 border border-slate-200 shadow-xs'
            }`}
          >
            <QrCode className="w-4 h-4 flex-shrink-0" />
            <span>3. Carta QR &amp; Auto-Pedido</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('fidelizacion')}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs sm:text-sm font-black whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'fidelizacion'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 border border-blue-600'
                : 'bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50 border border-slate-200 shadow-xs'
            }`}
          >
            <Star className="w-4 h-4 flex-shrink-0" />
            <span>4. Fidelización &amp; Google Maps</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('caja')}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs sm:text-sm font-black whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'caja'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 border border-blue-600'
                : 'bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50 border border-slate-200 shadow-xs'
            }`}
          >
            <Calculator className="w-4 h-4 flex-shrink-0" />
            <span>5. Cierre de Caja &amp; Métricas</span>
          </button>

        </div>

        {/* ── CONTENIDO DINÁMICO DE LA PESTAÑA SELECCIONADA ── */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-xl">
          
          {/* ── PESTAÑA 1: COMANDERO MÓVIL ── */}
          {activeTab === 'comandero' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center animate-in fade-in duration-300">
              
              <div className="lg:col-span-5 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-black uppercase tracking-wider">
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Control de Salón en Cualquier Móvil</span>
                </div>

                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
                  Comandero Móvil: Asignación por colores y marcha en 1 clic
                </h3>

                <p className="text-sm text-slate-600 leading-relaxed">
                  Tus camareros tienen el mapa visual del local en su propio móvil. Saben al instante qué mesas están libres, comiendo o en sobremesa esperando para pagar.
                </p>

                <ul className="space-y-3 text-xs sm:text-sm text-slate-700">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span><strong>Mapa de mesas cromático:</strong> Verde (Libre), Azul (Ocupada) y Ámbar (Pagada en Sobremesa).</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span><strong>Marcha de platos sin desplazamientos:</strong> un toque y cocina recibe el aviso al instante.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span><strong>Filtro anti-fraude:</strong> valida pedidos antes de enviarlos a cocina.</span>
                  </li>
                </ul>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => onOpenPilotModal('Plan Sala (69€)')}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs sm:text-sm shadow-md shadow-blue-500/25 transition-all cursor-pointer"
                  >
                    <span>Probar Comandero Móvil en Piloto 14 días</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Simulación Interactiva Comandero */}
              <div className="lg:col-span-7 bg-slate-50 border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="font-extrabold text-slate-900 text-xs sm:text-sm">Sala Principal &amp; Terraza</span>
                  </div>
                  <span className="text-[11px] font-mono font-bold text-slate-500">
                    6 Mesas activas
                  </span>
                </div>

                {/* Leyenda de Colores */}
                <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold">
                  <span className="inline-flex items-center gap-1.5 text-emerald-700">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" /> Libre
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-blue-700">
                    <span className="w-2 h-2 rounded-full bg-blue-500" /> Ocupada
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-amber-700">
                    <span className="w-2 h-2 rounded-full bg-amber-500" /> Pagada en Sobremesa
                  </span>
                </div>

                {/* Grid de Mesas */}
                <div className="grid grid-cols-3 gap-3 sm:gap-4">
                  {tables.map((table) => {
                    const isSelected = selectedTable.id === table.id
                    const colorClasses =
                      table.status === 'libre'
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                        : table.status === 'ocupada'
                        ? 'border-blue-300 bg-blue-50 text-blue-800'
                        : 'border-amber-300 bg-amber-50 text-amber-800'

                    return (
                      <div
                        key={table.id}
                        onClick={() => setSelectedTableId(table.id)}
                        className={`p-3.5 sm:p-4 rounded-xl border-2 transition-all cursor-pointer text-center space-y-1 shadow-xs ${colorClasses} ${
                          isSelected ? 'ring-2 ring-blue-500 scale-[1.03] shadow-md' : 'hover:scale-100 opacity-90'
                        }`}
                      >
                        <span className="block font-black text-xs sm:text-sm">{table.name}</span>
                        <span className="block text-[10px] font-bold uppercase tracking-wider opacity-85">
                          {table.status === 'libre'
                            ? 'Libre'
                            : table.status === 'ocupada'
                            ? 'Comiendo'
                            : 'Sobremesa'}
                        </span>
                      </div>
                    )
                  })}
                </div>

                {/* Detalle de Mesa Seleccionada */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900">
                      Detalle Comanda: {selectedTable.name} ({selectedTable.status === 'libre' ? 'Libre' : selectedTable.status === 'ocupada' ? 'Comiendo' : 'Sobremesa'})
                    </span>
                    <span className="text-slate-700 font-mono font-bold">
                      Total: {selectedTable.total.toFixed(2)} €
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                    <span className="text-[11px] text-slate-500">
                      {selectedTable.status === 'libre'
                        ? 'Mesa limpia y desocupada · Sin comanda activa'
                        : `Platos: ${selectedTable.items}`}
                    </span>

                    {selectedTable.status === 'libre' && (
                      <button
                        type="button"
                        onClick={() => handleOpenTable(selectedTable.id)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-black text-xs hover:bg-emerald-500 transition-colors cursor-pointer whitespace-nowrap shadow-xs"
                      >
                        + Abrir Mesa &amp; Pedir Combo
                      </button>
                    )}

                    {selectedTable.status === 'ocupada' && (
                      <button
                        type="button"
                        onClick={() => handleToggleMarch(selectedTable.id)}
                        className={`px-3 py-1.5 rounded-lg font-black text-xs transition-colors cursor-pointer whitespace-nowrap shadow-xs ${
                          selectedTable.marched
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                            : 'bg-emerald-600 text-white hover:bg-emerald-500'
                        }`}
                      >
                        {selectedTable.marched ? '✓ Principales Marchados' : 'Marchar a Cocina (1 clic)'}
                      </button>
                    )}

                    {selectedTable.status === 'sobremesa' && (
                      <button
                        type="button"
                        onClick={() => handleFreeTable(selectedTable.id)}
                        className="px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-black text-xs hover:bg-amber-400 transition-colors cursor-pointer whitespace-nowrap shadow-xs"
                      >
                        Liberar Mesa (Turno cerrado)
                      </button>
                    )}
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ── PESTAÑA 2: MONITOR KDS DE COCINA ── */}
          {activeTab === 'kds' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center animate-in fade-in duration-300">
              
              <div className="lg:col-span-5 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-black uppercase tracking-wider">
                  <ChefHat className="w-3.5 h-3.5" />
                  <span>Pantalla Industrial de Cocina</span>
                </div>

                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
                  Monitor KDS: Pantalla dividida por tiempos y bloqueo de segundos
                </h3>

                <p className="text-sm text-slate-600 leading-relaxed">
                  Despídete del papel térmico mojado y los gritos entre fuegos y sala. Las órdenes se organizan automáticamente por tiempo de espera y fases de servicio.
                </p>

                <ul className="space-y-3 text-xs sm:text-sm text-slate-700">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span><strong>Bloqueo automático de segundos platos:</strong> los postres y segundos no se emplatan antes de tiempo.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span><strong>Semáforo de tiempos cromático:</strong> Verde (&lt;5 min), Ámbar (5-10 min) y Alerta Roja (&gt;10 min).</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span><strong>Tickets limpios sin sobrecarga:</strong> botones táctiles gigantes (&gt;70px) para dedos mojados o con guantes.</span>
                  </li>
                </ul>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => onOpenPilotModal('Plan Full (Recomendado)')}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs sm:text-sm shadow-md shadow-blue-500/25 transition-all cursor-pointer"
                  >
                    <span>Probar Monitor KDS en Piloto 14 días</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Simulación Interactiva KDS */}
              <div className="lg:col-span-7 bg-slate-50 border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 text-xs">
                  <span className="font-black text-slate-900">Monitor KDS · Estación Fuegos</span>
                  <span className="text-emerald-700 font-bold">● En Directo (3 tickets)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Ticket 1 */}
                  <div
                    className={`p-3.5 rounded-xl border bg-white transition-all ${
                      kdsCompletedTickets[1]
                        ? 'border-emerald-300 opacity-50'
                        : 'border-blue-300 shadow-xs'
                    }`}
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-xs">
                      <span className="font-black text-slate-900">#T-81 · Mesa 3</span>
                      <span className="text-emerald-700 font-mono font-bold">03:10 min</span>
                    </div>
                    <div className="py-2 space-y-1 text-xs">
                      <div className="font-bold text-slate-800">1x Smash Doble Trufada</div>
                      <div className="font-bold text-slate-800">1x Patatas Rústicas</div>
                      <div className="text-[11px] text-amber-800 font-semibold flex items-center gap-1 pt-1">
                        <Lock className="w-3 h-3 text-amber-600" />
                        <span>Postre: Tarta Fluida (Bloqueado)</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setKdsCompletedTickets((prev) => ({
                          ...prev,
                          1: !prev[1],
                        }))
                      }
                      className="w-full mt-2 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-black transition-colors cursor-pointer shadow-xs"
                    >
                      {kdsCompletedTickets[1] ? 'Restaurar Ticket' : '✓ Completar Pase'}
                    </button>
                  </div>

                  {/* Ticket 2 */}
                  <div
                    className={`p-3.5 rounded-xl border bg-white text-xs space-y-2 transition-all ${
                      kdsCompletedTickets[2]
                        ? 'border-emerald-300 opacity-50'
                        : 'border-amber-300 shadow-xs'
                    }`}
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <span className="font-black text-slate-900">#T-82 · Mesa 7</span>
                      <span className="text-amber-800 font-mono font-bold">08:45 min</span>
                    </div>
                    <div className="py-1 space-y-1">
                      <div className="font-bold text-slate-800">2x Hamburguesa Clásica</div>
                      <div className="text-slate-500 text-[11px]">Punto de carne: Poco hecho</div>
                      <div className="text-emerald-700 font-semibold text-[11px] flex items-center gap-1 pt-1">
                        <Unlock className="w-3 h-3 text-emerald-600" />
                        <span>Fase 2 Marchada desde sala</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setKdsCompletedTickets((prev) => ({
                          ...prev,
                          2: !prev[2],
                        }))
                      }
                      className="w-full mt-2 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition-colors cursor-pointer shadow-xs"
                    >
                      {kdsCompletedTickets[2] ? 'Restaurar Ticket' : '✓ Completar Pase'}
                    </button>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 text-center pt-2">
                  💡 Los tickets colapsan automáticamente al completarse para no saturar la pantalla del cocinero.
                </p>
              </div>

            </div>
          )}

          {/* ── PESTAÑA 3: CARTA QR & AUTO-PEDIDO ── */}
          {activeTab === 'carta' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center animate-in fade-in duration-300">
              
              <div className="lg:col-span-5 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-black uppercase tracking-wider">
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Experiencia del Comensal</span>
                </div>

                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
                  Carta QR: Catálogo con alérgenos, fotos y venta cruzada
                </h3>

                <p className="text-sm text-slate-600 leading-relaxed">
                  Una carta moderna y fotográfica que incita a pedir segundas rondas sin presionar. Cumple automáticamente con la ley europea de alérgenos y permite ocultar platos agotados al instante.
                </p>

                <ul className="space-y-3 text-xs sm:text-sm text-slate-700">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span><strong>Venta cruzada inteligente:</strong> sugiere bebidas y postres automáticamente en el carrito.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span><strong>Filtros dietéticos estrictos:</strong> celíacos, intolerantes a lactosa o veganos piden sin miedo.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span><strong>+22% en ticket medio:</strong> la fotografía cuidada y el pedido ágil aumentan el consumo de sobremesa.</span>
                  </li>
                </ul>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => onOpenPilotModal('Plan Carta (39€)')}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs sm:text-sm shadow-md shadow-blue-500/25 transition-all cursor-pointer"
                  >
                    <span>Probar Carta QR en Piloto 14 días</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Simulación Interactiva Carta QR */}
              <div className="lg:col-span-7 bg-slate-50 border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
                {/* Selector de filtros dietéticos */}
                <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-200">
                  <span className="text-xs font-black text-slate-900">Filtro de Alérgenos:</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setActiveAllergenFilter('todos')}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors cursor-pointer ${
                        activeAllergenFilter === 'todos' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                      }`}
                    >
                      Todos
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveAllergenFilter('sin-gluten')}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors cursor-pointer ${
                        activeAllergenFilter === 'sin-gluten' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                      }`}
                    >
                      Sin Gluten
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveAllergenFilter('sin-lactosa')}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors cursor-pointer ${
                        activeAllergenFilter === 'sin-lactosa' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                      }`}
                    >
                      Sin Lactosa
                    </button>
                  </div>
                </div>

                {/* Platos con venta cruzada reactiva */}
                <div className="space-y-3">
                  {filteredQrDishes.map((dish) => {
                    const isCrossSellAdded = addedCrossSells[dish.id]
                    return (
                      <div key={dish.id} className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs space-y-2.5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-slate-900 text-xs sm:text-sm">{dish.name}</span>
                              {dish.badge && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  {dish.badge}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500">
                              {dish.desc}
                            </p>
                          </div>
                          <span className="font-black text-slate-900 text-xs sm:text-sm tabular-nums flex-shrink-0">
                            {dish.price.toFixed(2)} €
                          </span>
                        </div>

                        {/* Banner de Venta Cruzada por plato */}
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-2.5 rounded-xl flex items-center justify-between gap-3 text-xs">
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                            <span className="text-slate-800 text-[11px]">
                              ¿Acompañar con <strong>{dish.crossSell.name}</strong> por {dish.crossSell.price.toFixed(2)} €?
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setAddedCrossSells((prev) => ({
                                ...prev,
                                [dish.id]: !prev[dish.id],
                              }))
                            }
                            className={`px-2.5 py-1 rounded font-black text-[10px] transition-colors cursor-pointer shadow-xs ${
                              isCrossSellAdded ? 'bg-emerald-600 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white'
                            }`}
                          >
                            {isCrossSellAdded ? '✓ Añadido' : '+ Añadir'}
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>

              </div>

            </div>
          )}

          {/* ── PESTAÑA 4: FIDELIZACIÓN & GOOGLE MAPS ── */}
          {activeTab === 'fidelizacion' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center animate-in fade-in duration-300">
              
              <div className="lg:col-span-5 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-black uppercase tracking-wider">
                  <Star className="w-3.5 h-3.5" />
                  <span>Crecimiento y Reputación</span>
                </div>

                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
                  Fidelización: Cartilla digital de 5 sellos y bonificación en Google Maps
                </h3>

                <p className="text-sm text-slate-600 leading-relaxed">
                  Consigue que tus comensales vuelvan una y otra vez sin apps pesadas. Al pagar su cuenta reciben un sello automático y un incentivo directo para dejarte una reseña 5★ en Google Maps.
                </p>

                <ul className="space-y-3 text-xs sm:text-sm text-slate-700">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <span><strong>Cartilla 100% digital:</strong> el cliente guarda su tarjeta en el wallet o navegador en 1 clic.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <span><strong>Multiplicador de reseñas:</strong> incentivo de +1 sello al valorar tu restaurante en Google Maps.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <span><strong>Base de datos propia:</strong> construye tu lista de clientes recurrentes para promociones de temporada.</span>
                  </li>
                </ul>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => onOpenPilotModal('Plan Full (Recomendado)')}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs sm:text-sm shadow-md shadow-blue-500/25 transition-all cursor-pointer"
                  >
                    <span>Probar Fidelización en Piloto 14 días</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Simulación Interactiva Tarjeta de Sellos */}
              <div className="lg:col-span-7 bg-slate-50 border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <Gift className="w-4 h-4 text-amber-600" />
                    <span className="font-extrabold text-slate-900 text-xs sm:text-sm">Club de Comensales VIP</span>
                  </div>
                  <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    Premio: Postre Casero Gratis
                  </span>
                </div>

                {/* Sellos de la Cartilla */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <div className="text-center space-y-1">
                    <h5 className="font-black text-slate-900 text-sm">Tu Cartilla Digital (5 Visitas)</h5>
                    <p className="text-xs text-slate-500">
                      Lleva {loyaltyStamps} de 5 sellos acumulados
                    </p>
                  </div>

                  <div className="flex items-center justify-center gap-3 sm:gap-4 py-2">
                    {[1, 2, 3, 4, 5].map((stampNum) => {
                      const isStamped = stampNum <= loyaltyStamps
                      return (
                        <div
                          key={stampNum}
                          className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full border-2 flex items-center justify-center font-black text-xs transition-transform ${
                            isStamped
                              ? 'bg-amber-400 text-slate-950 border-amber-300 scale-105 shadow-md shadow-amber-400/20'
                              : 'bg-slate-100 text-slate-400 border-slate-200'
                          }`}
                        >
                          {isStamped ? '✓' : stampNum}
                        </div>
                      )
                    })}
                  </div>

                  {/* Widget Reseña Google Maps */}
                  <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-amber-500 fill-amber-400 flex-shrink-0" />
                      <span className="text-slate-700 text-[11px] text-center sm:text-left">
                        ¿Valoras tu cena en <strong>Google Maps</strong>? Te regalamos el 5º sello directo.
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setLoyaltyStamps((prev) => (prev === 5 ? 4 : 5))}
                      className="px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition-colors whitespace-nowrap cursor-pointer shadow-xs"
                    >
                      {loyaltyStamps === 5 ? '¡Premio Desbloqueado! 🎉 (Toca para reiniciar)' : 'Simular Valoración 5★ (+1 Sello)'}
                    </button>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* ── PESTAÑA 5: CIERRE DE CAJA & MÉTRICAS ── */}
          {activeTab === 'caja' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center animate-in fade-in duration-300">
              
              <div className="lg:col-span-5 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-black uppercase tracking-wider">
                  <Calculator className="w-3.5 h-3.5" />
                  <span>Control Financiero &amp; Fiscal</span>
                </div>

                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
                  Cierre de Caja: Desglose de efectivo, tarjeta y propinas por turno
                </h3>

                <p className="text-sm text-slate-600 leading-relaxed">
                  Cierra la caja en 2 minutos sin descuadres ni discusiones. Fluxo separa automáticamente los cobros por datáfono, el efectivo y las propinas de tu equipo por cada camarero y turno.
                </p>

                <ul className="space-y-3 text-xs sm:text-sm text-slate-700">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                    <span><strong>Cuadre matemático exacto:</strong> conciliación de tickets y métodos de pago al céntimo.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                    <span><strong>Reparto transparente de propinas:</strong> asignación por horas o camarero sin conflictos.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                    <span><strong>Exportación contable lista:</strong> descarga el informe fiscal en PDF o Excel para tu gestoría.</span>
                  </li>
                </ul>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => onOpenPilotModal('Plan Full (Recomendado)')}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs sm:text-sm shadow-md shadow-blue-500/25 transition-all cursor-pointer"
                  >
                    <span>Probar Cierre de Caja en Piloto 14 días</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Simulación Interactiva Cierre de Caja */}
              <div className="lg:col-span-7 bg-slate-50 border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-indigo-600" />
                    <span className="font-extrabold text-slate-900 text-xs sm:text-sm">
                      Resumen de Turno: Noche (Viernes)
                    </span>
                  </div>
                  <span className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Cuadre: 0,00 € Descuadre
                  </span>
                </div>

                {/* Tarjetas de Métricas */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
                    <span className="text-[10px] text-slate-500 block font-bold">Tarjeta (Datáfono)</span>
                    <span className="text-base font-black text-slate-900 tabular-nums">1.640,50 €</span>
                    <span className="text-[10px] text-emerald-700 block font-semibold">74% del total</span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
                    <span className="text-[10px] text-slate-500 block font-bold">Efectivo en Cajón</span>
                    <span className="text-base font-black text-slate-900 tabular-nums">480,00 €</span>
                    <span className="text-[10px] text-slate-500 block font-semibold">22% del total</span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs col-span-2 sm:col-span-1">
                    <span className="text-[10px] text-slate-500 block font-bold">Propinas Equipo</span>
                    <span className="text-base font-black text-amber-700 tabular-nums">84,00 €</span>
                    <span className="text-[10px] text-amber-700 block font-semibold">4% sobre ventas</span>
                  </div>
                </div>

                {/* Total Global */}
                <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 border border-indigo-200 p-4 rounded-xl flex items-center justify-between shadow-xs">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-indigo-800 uppercase tracking-wide">
                      Recaudación Neta del Turno
                    </span>
                    <div className="text-xl font-black text-slate-900 tabular-nums">
                      2.204,50 €
                    </div>
                  </div>
                  <div className="text-right text-xs text-slate-500">
                    <span>42 comandas cobradas</span>
                    <br />
                    <span className="text-slate-400 text-[10px]">Rotación: 38 min / mesa</span>
                  </div>
                </div>

              </div>

            </div>
          )}

        </div>

      </div>
    </section>
  )
}
