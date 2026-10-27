'use client'

import React, { useState, useEffect } from 'react'
import {
  Smartphone,
  Tablet,
  ChefHat,
  Clock,
  Sparkles,
  Lock,
  Unlock,
  CheckCircle2,
  RotateCcw,
  ExternalLink,
  Flame,
  Wine,
  UtensilsCrossed,
  Layers,
  ArrowRight
} from 'lucide-react'

interface DishItem {
  id: string
  name: string
  description: string
  price: number
  badge?: string
  station?: 'cocina' | 'barra'
  phase?: 1 | 2
  category: 'combos' | 'bebidas' | 'postres'
}

const MENU_DISHES: DishItem[] = [
  {
    id: 'combo-pareja',
    name: 'Combo Pareja',
    description: '2x Smash Burger + Patatas Rústicas + 2x Bebida + Tarta de Queso',
    price: 24.50,
    badge: 'Más Vendido',
    phase: 1,
    station: 'cocina',
    category: 'combos',
  },
  {
    id: 'smash-trufada',
    name: 'Smash Doble Trufada',
    description: 'Carne madurada 180g, cheddar madurado, mayo trufada',
    price: 13.50,
    phase: 1,
    station: 'cocina',
    category: 'combos',
  },
  {
    id: 'cerveza-ipa',
    name: 'Cerveza Artesana IPA',
    description: 'Caña fría de tirador con doble lúpulo aromático',
    price: 3.80,
    phase: 1,
    station: 'barra',
    category: 'bebidas',
  },
  {
    id: 'tarta-fluida',
    name: 'Tarta de Queso Fluida',
    description: 'Elaboración casera horneada a diario con queso curado',
    price: 5.50,
    badge: 'Postre estrella',
    phase: 2,
    station: 'cocina',
    category: 'postres',
  },
]

interface HeroSandboxProps {
  onOpenAllDashboards: () => void
}

export function HeroSandbox({ onOpenAllDashboards }: HeroSandboxProps) {
  // Estado de comanda en el simulador
  const [orderedItems, setOrderedItems] = useState<{ id: string; name: string; qty: number; price: number; phase: number; station: string }[]>([
    { id: 'combo-pareja', name: 'Combo Pareja', qty: 1, price: 24.50, phase: 1, station: 'cocina' },
  ])
  const [phase2Unlocked, setPhase2Unlocked] = useState(false)
  const [latency, setLatency] = useState(48)
  const [isFlashing, setIsFlashing] = useState(false)
  const [lastAddedName, setLastAddedName] = useState<string | null>(null)
  const [activeMobileCategory, setActiveMobileCategory] = useState<'todos' | 'combos' | 'bebidas' | 'postres'>('todos')
  const timerRef = React.useRef<NodeJS.Timeout | null>(null)

  React.useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  // Efecto de pulso al recibir orden
  const triggerOrderSync = (dishName: string) => {
    setIsFlashing(true)
    setLastAddedName(dishName)
    // Latencia simulada ultrarrápida entre 32ms y 68ms
    setLatency(Math.floor(Math.random() * 36) + 32)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      setIsFlashing(false)
    }, 700)
  }

  const handleAddDish = (dish: DishItem) => {
    setOrderedItems((prev) => {
      const existing = prev.find((i) => i.id === dish.id)
      if (existing) {
        return prev.map((i) => (i.id === dish.id ? { ...i, qty: i.qty + 1 } : i))
      }
      return [
        ...prev,
        {
          id: dish.id,
          name: dish.name,
          qty: 1,
          price: dish.price,
          phase: dish.phase || 1,
          station: dish.station || 'cocina',
        },
      ]
    })
    triggerOrderSync(dish.name)
  }

  const handleReset = () => {
    setOrderedItems([
      { id: 'combo-pareja', name: 'Combo Pareja', qty: 1, price: 24.50, phase: 1, station: 'cocina' },
    ])
    setPhase2Unlocked(false)
    setLatency(42)
    setLastAddedName(null)
  }

  const totalAmount = orderedItems.reduce((acc, item) => acc + item.price * item.qty, 0)
  const hasCombo = orderedItems.some((i) => i.id === 'combo-pareja')
  const comboItem = orderedItems.find((i) => i.id === 'combo-pareja')
  const comboQty = comboItem ? comboItem.qty : 0

  const filteredDishes = activeMobileCategory === 'todos'
    ? MENU_DISHES
    : MENU_DISHES.filter((d) => d.category === activeMobileCategory)

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* ── BARRA SUPERIOR DE SINCRONIZACIÓN EN VIVO ── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 bg-white border border-slate-200 rounded-2xl p-4 shadow-md backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center">
            <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping absolute" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 relative" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-black text-emerald-600 tracking-wide">
                ● EN VIVO: SINCRONIZACIÓN SALA-COCINA (&lt; 100 ms)
              </span>
              <span className="hidden md:inline-flex px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                Latencia: {latency} ms
              </span>
            </div>
            <p className="text-[11px] text-slate-600 hidden sm:block">
              Toca un plato en el móvil simulado y comprueba cómo entra en sala y cocina instantáneamente.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors cursor-pointer"
            title="Reiniciar simulador a estado inicial"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reiniciar</span>
          </button>

          <button
            type="button"
            onClick={onOpenAllDashboards}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 hover:border-blue-300 transition-all shadow-xs cursor-pointer"
          >
            <span>Ver pantallas reales</span>
            <ExternalLink className="w-3 h-3 text-blue-600" />
          </button>
        </div>
      </div>

      {/* ── CONTENEDOR SPLIT: MÓVIL (IZQUIERDA) & TABLET (DERECHA) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ── COLUMNA IZQUIERDA: MÓVIL DEL CLIENTE (CARTA QR) ── */}
        <div className="lg:col-span-5 flex flex-col items-center">
          {/* Chasis exterior del Smartphone */}
          <div className="w-full max-w-sm rounded-[2.5rem] bg-slate-900 p-2.5 sm:p-3 border-4 border-slate-800 shadow-2xl relative overflow-hidden">
            
            {/* Isla Dinámica / Altavoz y cámara del móvil */}
            <div className="w-24 h-4 bg-slate-950 rounded-full mx-auto mb-2 flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-800" />
            </div>

            {/* Pantalla interior con fondo luminoso continuo */}
            <div className="bg-slate-50 rounded-[1.8rem] p-3 border border-slate-200 shadow-inner flex flex-col">
              {/* Cabecera de la Carta Móvil */}
              <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-xs mb-2.5">
                <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="font-extrabold text-slate-900 text-[13px]">Fluxo Bistro</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold text-[10px] border border-blue-200">
                    Mesa 4 · Terraza
                  </span>
                </div>

                {/* Selector de categorías simulado */}
                <div className="flex items-center gap-1.5 pt-2 overflow-x-auto no-scrollbar">
                  <button
                    type="button"
                    onClick={() => setActiveMobileCategory('todos')}
                    className={`px-2 py-1 rounded-md text-[11px] font-bold transition-colors whitespace-nowrap cursor-pointer ${
                      activeMobileCategory === 'todos'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Destacados
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveMobileCategory('combos')}
                    className={`px-2 py-1 rounded-md text-[11px] font-bold transition-colors whitespace-nowrap cursor-pointer ${
                      activeMobileCategory === 'combos'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Menús
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveMobileCategory('bebidas')}
                    className={`px-2 py-1 rounded-md text-[11px] font-bold transition-colors whitespace-nowrap cursor-pointer ${
                      activeMobileCategory === 'bebidas'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Bebidas
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveMobileCategory('postres')}
                    className={`px-2 py-1 rounded-md text-[11px] font-bold transition-colors whitespace-nowrap cursor-pointer ${
                      activeMobileCategory === 'postres'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Postres
                  </button>
                </div>
              </div>

              {/* Lista interactiva de platos en el móvil */}
              <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                {filteredDishes.map((dish) => {
                  const count = orderedItems.find((i) => i.id === dish.id)?.qty || 0
                  return (
                    <div
                      key={dish.id}
                      onClick={() => handleAddDish(dish)}
                      className="p-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 hover:border-blue-400 transition-all cursor-pointer group active:scale-[0.98] select-none shadow-xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-slate-900 text-xs group-hover:text-blue-600 transition-colors">
                              {dish.name}
                            </span>
                            {dish.badge && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200">
                                {dish.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 line-clamp-1 leading-snug">
                            {dish.description}
                          </p>
                        </div>

                        <div className="text-right flex flex-col items-end gap-1 flex-shrink-0">
                          <span className="font-black text-slate-900 text-xs tabular-nums">
                            {dish.price.toFixed(2)} €
                          </span>
                          <button
                            type="button"
                            className="px-2 py-0.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black shadow-xs group-hover:scale-105 transition-transform flex items-center gap-1 cursor-pointer"
                          >
                            <span>+ Pedir</span>
                            {count > 0 && (
                              <span className="w-4 h-4 rounded-full bg-white text-blue-900 text-[10px] font-black inline-flex items-center justify-center">
                                {count}
                              </span>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Pie de pantalla móvil simulado */}
              <div className="mt-2.5 p-3 rounded-xl bg-gradient-to-r from-blue-50 via-sky-50 to-blue-50 border border-blue-200 shadow-xs flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wide">
                    Tu Comanda Activa
                  </span>
                  <div className="text-xs font-black text-slate-900 tabular-nums">
                    {totalAmount.toFixed(2)} € &middot; {orderedItems.reduce((acc, i) => acc + i.qty, 0)} platos
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Enviada</span>
                </span>
              </div>
            </div>
          </div>

          {/* Etiqueta descriptiva del dispositivo móvil */}
          <div className="text-center pt-3">
            <span className="text-[10px] text-slate-500 font-medium">
              📱 Móvil del Cliente (Carta QR en Sala)
            </span>
          </div>
        </div>

        {/* ── COLUMNA DERECHA: TABLET DEL MOZO / MONITOR KDS COCINA ── */}
        <div className="lg:col-span-7">
          <div
            className={`rounded-3xl bg-white p-4 sm:p-6 border-2 transition-all duration-300 shadow-xl relative ${
              isFlashing
                ? 'border-blue-500 shadow-[0_0_35px_0_rgba(59,130,246,0.3)] ring-4 ring-blue-500/20'
                : 'border-slate-200'
            }`}
          >
            {/* Barra superior de la Tablet */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center flex-shrink-0">
                  <ChefHat className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm sm:text-base font-extrabold text-slate-900">
                      Tablet Mozo + Monitor KDS Cocina
                    </h4>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                      SINCRONIZADO
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Mesa 4 &middot; 2 comensales &middot; Camarero: Roberto M.
                  </p>
                </div>
              </div>

              {lastAddedName && isFlashing && (
                <div className="animate-in fade-in zoom-in-95 duration-200 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-black border border-blue-200">
                  <Sparkles className="w-3.5 h-3.5 animate-spin" />
                  <span>+{lastAddedName} recibido ({latency}ms)</span>
                </div>
              )}
            </div>

            {/* ── PANEL DE MESA DEL COMANDERO (PERSPECTIVA SALA) ── */}
            <div className="mt-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
                <span className="font-extrabold text-slate-900">
                  Panel Mozo: Mesa 4 (Terraza)
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-blue-50 text-blue-700 border border-blue-200">
                  Comanda en Sala &middot; {orderedItems.reduce((acc, i) => acc + i.qty, 0)} platos
                </span>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">
                Sincronización Sala-Cocina: <strong className="text-emerald-600">&lt; 100 ms</strong>
              </span>
            </div>

            {/* Vista del Ticket KDS con fases bloqueadas */}
            <div className="pt-3 space-y-4">
              
              {/* TICKET KDS PRINCIPAL */}
              <div className="bg-slate-50/70 rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-4">
                
                {/* Cabecera del Ticket */}
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-md bg-blue-600 text-white font-black text-xs shadow-xs">
                      TICKET #42
                    </span>
                    <span className="text-sm font-bold text-slate-900">Mesa 4 (Terraza)</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-amber-800 font-mono font-bold bg-amber-50 px-2 py-1 rounded-md border border-amber-200">
                    <Clock className="w-3.5 h-3.5" />
                    <span>02:14 min</span>
                  </div>
                </div>

                {/* ── FASE 1: EN PREPARACIÓN (COCINA & BARRA) ── */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-emerald-700">
                      <Flame className="w-4 h-4 text-emerald-600" />
                      <span>Fase 1: En preparación inmediata</span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded shadow-xs">
                      Marchado a fuegos
                    </span>
                  </div>

                  <div className="space-y-1.5 bg-white rounded-xl p-3 border border-slate-200 text-xs shadow-xs">
                    {orderedItems
                      .filter((i) => i.phase === 1)
                      .map((item) => (
                        <div key={item.id} className="flex items-center justify-between py-1 border-b border-slate-100 last:border-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-blue-600">{item.qty}x</span>
                            <span className="font-bold text-slate-900">{item.name}</span>
                            {item.station === 'barra' ? (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
                                <Wine className="w-2.5 h-2.5" /> Barra
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                                <Flame className="w-2.5 h-2.5" /> Cocina
                              </span>
                            )}
                          </div>
                          <span className="text-slate-500 font-mono">{(item.price * item.qty).toFixed(2)} €</span>
                        </div>
                      ))}

                    {/* Subitems automáticos del Combo Pareja */}
                    {hasCombo && (
                      <div className="pt-1.5 pl-5 border-t border-slate-100 space-y-1 text-[11px] text-slate-600 font-normal">
                        <div className="flex items-center justify-between text-slate-500">
                          <span>↳ {2 * comboQty}x Smash Burger con queso cheddar</span>
                          <span className="text-emerald-700 font-bold">Fuegos</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-500">
                          <span>↳ {comboQty}x Ración Patatas Rústicas</span>
                          <span className="text-emerald-700 font-bold">Freidora</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-500">
                          <span>↳ {2 * comboQty}x Bebidas asignadas a Barra</span>
                          <span className="text-purple-700 font-bold">Servidas</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* ── FASE 2: FASE BLOQUEADA (SEGUNDOS / POSTRES) ── */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-800">
                      {phase2Unlocked ? (
                        <Unlock className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Lock className="w-4 h-4 text-amber-600" />
                      )}
                      <span>
                        Fase 2: Postres &amp; Segundos{' '}
                        {phase2Unlocked ? '(Marchada)' : '(Fases Bloqueadas)'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setPhase2Unlocked(!phase2Unlocked)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        phase2Unlocked
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                          : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300'
                      }`}
                    >
                      {phase2Unlocked ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Fase Marchada</span>
                        </>
                      ) : (
                        <>
                          <Unlock className="w-3.5 h-3.5" />
                          <span>1 Toque: Marchar Fase 2</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div
                    className={`rounded-xl p-3 border transition-colors text-xs space-y-1.5 ${
                      phase2Unlocked
                        ? 'bg-emerald-50/40 border-emerald-200 text-slate-800'
                        : 'bg-white border-slate-200 text-slate-600 shadow-xs'
                    }`}
                  >
                    {/* Postre incluido en el Combo Pareja */}
                    {hasCombo && (
                      <div className="flex items-center justify-between py-1 border-b border-slate-100 last:border-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-amber-700">{comboQty}x</span>
                          <span className={phase2Unlocked ? 'font-bold text-slate-900' : 'line-through opacity-70 text-slate-400'}>
                            Tarta de Queso Fluida (Combo Pareja)
                          </span>
                          {!phase2Unlocked ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-50 text-amber-800 border border-amber-200">
                              Bloqueado en cocina
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Entró a repostería
                            </span>
                          )}
                        </div>
                        <span className="font-mono text-slate-400">Incluido</span>
                      </div>
                    )}

                    {/* Postres o segundos independientes añadidos a la comanda */}
                    {orderedItems
                      .filter((i) => i.phase === 2 && i.id !== 'combo-pareja')
                      .map((item) => (
                        <div key={item.id} className="flex items-center justify-between py-1 border-b border-slate-100 last:border-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-amber-700">{item.qty}x</span>
                            <span className={phase2Unlocked ? 'font-bold text-slate-900' : 'line-through opacity-70 text-slate-400'}>
                              {item.name}
                            </span>
                            {!phase2Unlocked ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-50 text-amber-800 border border-amber-200">
                                Bloqueado en cocina
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Entró a repostería
                              </span>
                            )}
                          </div>
                          <span className="font-mono text-slate-500">{(item.price * item.qty).toFixed(2)} €</span>
                        </div>
                      ))}

                    {!hasCombo && orderedItems.filter((i) => i.phase === 2).length === 0 && (
                      <div className="py-2 text-center text-slate-500 text-xs italic">
                        Sin postres ni segundos en la comanda. Toca «Tarta de Queso Fluida» en el móvil simulado para ver cómo entra con fases bloqueadas.
                      </div>
                    )}

                    {!phase2Unlocked && (hasCombo || orderedItems.filter((i) => i.phase === 2).length > 0) && (
                      <p className="text-[11px] text-slate-500 pt-1 italic">
                        La cocina no emplata el postre hasta que el camarero pulsa «Marchar Fase 2». Cero platos fríos o derretidos.
                      </p>
                    )}
                  </div>
                </div>

                {/* Acciones Rápidas del Mozo */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs border-t border-slate-200">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Layers className="w-4 h-4 text-blue-600" />
                    <span>Control de mesa sincronizado con TPV</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-slate-900 font-extrabold text-sm tabular-nums">
                      Total Mesa: {totalAmount.toFixed(2)} €
                    </span>
                  </div>
                </div>

              </div>

            </div>

            <div className="text-center pt-3">
              <span className="text-[10px] text-slate-400">
                🖥️ Tablet de Sala &amp; Pantalla KDS Industrial (Acceso desde navegador)
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
