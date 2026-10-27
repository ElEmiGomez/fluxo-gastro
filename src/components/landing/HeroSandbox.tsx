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
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center">
            <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping absolute" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 relative" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-black text-emerald-400 tracking-wide">
                ● EN VIVO: SINCRONIZACIÓN SALA-COCINA (&lt; 100 ms)
              </span>
              <span className="hidden md:inline-flex px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
                Latencia: {latency} ms
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Toca un plato en el móvil simulado y comprueba cómo entra en sala y cocina instantáneamente.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700 transition-colors"
            title="Reiniciar simulador a estado inicial"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reiniciar</span>
          </button>

          <button
            type="button"
            onClick={onOpenAllDashboards}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold text-cyan-300 bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/40 hover:border-cyan-400 transition-all shadow-sm"
          >
            <span>Ver pantallas reales</span>
            <ExternalLink className="w-3 h-3 text-cyan-400" />
          </button>
        </div>
      </div>

      {/* ── CONTENEDOR SPLIT: MÓVIL (IZQUIERDA) & TABLET (DERECHA) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ── COLUMNA IZQUIERDA: MÓVIL DEL CLIENTE (CARTA QR) ── */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="w-full max-w-sm rounded-[2.5rem] bg-slate-950 p-3 sm:p-4 border-4 border-slate-800 shadow-2xl relative overflow-hidden">
            
            {/* Altavoz y cámara del móvil */}
            <div className="w-24 h-4 bg-slate-800 rounded-full mx-auto mb-3 flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-900" />
            </div>

            {/* Cabecera de la Carta Móvil */}
            <div className="bg-slate-900 rounded-2xl p-3.5 border border-slate-800 mb-3">
              <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-extrabold text-white text-[13px]">Fluxo Bistro</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-bold text-[10px] border border-blue-500/30">
                  Mesa 4 · Terraza
                </span>
              </div>

              {/* Selector de categorías simulado */}
              <div className="flex items-center gap-1.5 pt-2 overflow-x-auto no-scrollbar">
                <button
                  type="button"
                  onClick={() => setActiveMobileCategory('todos')}
                  className={`px-2 py-1 rounded-md text-[11px] font-bold transition-colors whitespace-nowrap ${
                    activeMobileCategory === 'todos'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Destacados
                </button>
                <button
                  type="button"
                  onClick={() => setActiveMobileCategory('combos')}
                  className={`px-2 py-1 rounded-md text-[11px] font-bold transition-colors whitespace-nowrap ${
                    activeMobileCategory === 'combos'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Menús
                </button>
                <button
                  type="button"
                  onClick={() => setActiveMobileCategory('bebidas')}
                  className={`px-2 py-1 rounded-md text-[11px] font-bold transition-colors whitespace-nowrap ${
                    activeMobileCategory === 'bebidas'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Bebidas
                </button>
                <button
                  type="button"
                  onClick={() => setActiveMobileCategory('postres')}
                  className={`px-2 py-1 rounded-md text-[11px] font-bold transition-colors whitespace-nowrap ${
                    activeMobileCategory === 'postres'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
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
                    className="p-3 rounded-xl bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-blue-500/60 transition-all cursor-pointer group active:scale-[0.98] select-none"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-white text-xs group-hover:text-blue-400 transition-colors">
                            {dish.name}
                          </span>
                          {dish.badge && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                              {dish.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-1 leading-snug">
                          {dish.description}
                        </p>
                      </div>

                      <div className="text-right flex flex-col items-end gap-1 flex-shrink-0">
                        <span className="font-black text-white text-xs tabular-nums">
                          {dish.price.toFixed(2)} €
                        </span>
                        <button
                          type="button"
                          className="px-2 py-0.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black shadow-sm group-hover:scale-105 transition-transform flex items-center gap-1"
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
            <div className="mt-3 p-3 rounded-xl bg-gradient-to-r from-blue-950/80 to-slate-900 border border-blue-500/30 flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-blue-300 uppercase tracking-wide">
                  Tu Comanda Activa
                </span>
                <div className="text-xs font-black text-white tabular-nums">
                  {totalAmount.toFixed(2)} € &middot; {orderedItems.reduce((acc, i) => acc + i.qty, 0)} platos
                </div>
              </div>
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                <CheckCircle2 className="w-3 h-3" />
                <span>Enviada</span>
              </span>
            </div>

            <div className="text-center pt-2">
              <span className="text-[10px] text-slate-500">
                📱 Móvil del Cliente (Carta QR en Sala)
              </span>
            </div>
          </div>
        </div>

        {/* ── COLUMNA DERECHA: TABLET DEL MOZO / MONITOR KDS COCINA ── */}
        <div className="lg:col-span-7">
          <div
            className={`rounded-3xl bg-slate-950 p-4 sm:p-6 border-4 transition-all duration-300 shadow-2xl relative ${
              isFlashing
                ? 'border-cyan-400 shadow-[0_0_35px_0_rgba(6,182,212,0.4)]'
                : 'border-slate-800'
            }`}
          >
            {/* Barra superior de la Tablet */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center flex-shrink-0">
                  <ChefHat className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm sm:text-base font-extrabold text-white">
                      Tablet Mozo + Monitor KDS Cocina
                    </h4>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      SINCRONIZADO
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Mesa 4 &middot; 2 comensales &middot; Camarero: Roberto M.
                  </p>
                </div>
              </div>

              {lastAddedName && isFlashing && (
                <div className="animate-in fade-in zoom-in-95 duration-200 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-black border border-cyan-500/40">
                  <Sparkles className="w-3.5 h-3.5 animate-spin" />
                  <span>+{lastAddedName} recibido ({latency}ms)</span>
                </div>
              )}
            </div>

            {/* ── PANEL DE MESA DEL COMANDERO (PERSPECTIVA SALA) ── */}
            <div className="mt-3 bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse" />
                <span className="font-extrabold text-white">
                  Panel Mozo: Mesa 4 (Terraza)
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Comanda en Sala &middot; {orderedItems.reduce((acc, i) => acc + i.qty, 0)} platos
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">
                Sincronización Sala-Cocina: <strong className="text-emerald-400">&lt; 100 ms</strong>
              </span>
            </div>

            {/* Vista del Ticket KDS con fases bloqueadas */}
            <div className="pt-3 space-y-4">
              
              {/* TICKET KDS PRINCIPAL */}
              <div className="bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-800 shadow-lg space-y-4">
                
                {/* Cabecera del Ticket */}
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-md bg-cyan-500 text-slate-950 font-black text-xs">
                      TICKET #42
                    </span>
                    <span className="text-sm font-bold text-white">Mesa 4 (Terraza)</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-amber-400 font-mono font-bold bg-amber-500/10 px-2 py-1 rounded-md border border-amber-500/20">
                    <Clock className="w-3.5 h-3.5" />
                    <span>02:14 min</span>
                  </div>
                </div>

                {/* ── FASE 1: EN PREPARACIÓN (COCINA & BARRA) ── */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-emerald-400">
                      <Flame className="w-4 h-4 text-emerald-400" />
                      <span>Fase 1: En preparación inmediata</span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                      Marchado a fuegos
                    </span>
                  </div>

                  <div className="space-y-1.5 bg-slate-950/60 rounded-xl p-3 border border-slate-800/80 text-xs">
                    {orderedItems
                      .filter((i) => i.phase === 1)
                      .map((item) => (
                        <div key={item.id} className="flex items-center justify-between py-1 border-b border-slate-800/40 last:border-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-cyan-400">{item.qty}x</span>
                            <span className="font-bold text-white">{item.name}</span>
                            {item.station === 'barra' ? (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                                <Wine className="w-2.5 h-2.5" /> Barra
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                                <Flame className="w-2.5 h-2.5" /> Cocina
                              </span>
                            )}
                          </div>
                          <span className="text-slate-400 font-mono">{(item.price * item.qty).toFixed(2)} €</span>
                        </div>
                      ))}

                    {/* Subitems automáticos del Combo Pareja */}
                    {hasCombo && (
                      <div className="pt-1.5 pl-5 border-t border-slate-800/60 space-y-1 text-[11px] text-slate-300 font-normal">
                        <div className="flex items-center justify-between text-slate-400">
                          <span>↳ {2 * comboQty}x Smash Burger con queso cheddar</span>
                          <span className="text-emerald-400 font-bold">Fuegos</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-400">
                          <span>↳ {comboQty}x Ración Patatas Rústicas</span>
                          <span className="text-emerald-400 font-bold">Freidora</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-400">
                          <span>↳ {2 * comboQty}x Bebidas asignadas a Barra</span>
                          <span className="text-purple-300 font-bold">Servidas</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* ── FASE 2: FASE BLOQUEADA (SEGUNDOS / POSTRES) ── */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-300">
                      {phase2Unlocked ? (
                        <Unlock className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Lock className="w-4 h-4 text-amber-400" />
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
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40'
                      }`}
                    >
                      {phase2Unlocked ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
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
                        ? 'bg-slate-950/80 border-emerald-500/40 text-slate-200'
                        : 'bg-slate-950/40 border-slate-800 text-slate-400'
                    }`}
                  >
                    {/* Postre incluido en el Combo Pareja */}
                    {hasCombo && (
                      <div className="flex items-center justify-between py-1 border-b border-slate-800/40 last:border-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-amber-400">{comboQty}x</span>
                          <span className={phase2Unlocked ? 'font-bold text-white' : 'line-through opacity-70'}>
                            Tarta de Queso Fluida (Combo Pareja)
                          </span>
                          {!phase2Unlocked ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-slate-800 text-amber-400 border border-amber-500/30">
                              Bloqueado en cocina
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              Entró a repostería
                            </span>
                          )}
                        </div>
                        <span className="font-mono text-slate-500">Incluido</span>
                      </div>
                    )}

                    {/* Postres o segundos independientes añadidos a la comanda */}
                    {orderedItems
                      .filter((i) => i.phase === 2 && i.id !== 'combo-pareja')
                      .map((item) => (
                        <div key={item.id} className="flex items-center justify-between py-1 border-b border-slate-800/40 last:border-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-amber-400">{item.qty}x</span>
                            <span className={phase2Unlocked ? 'font-bold text-white' : 'line-through opacity-70'}>
                              {item.name}
                            </span>
                            {!phase2Unlocked ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-black bg-slate-800 text-amber-400 border border-amber-500/30">
                                Bloqueado en cocina
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                Entró a repostería
                              </span>
                            )}
                          </div>
                          <span className="font-mono text-slate-400">{(item.price * item.qty).toFixed(2)} €</span>
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
                <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs border-t border-slate-800/80">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Layers className="w-4 h-4 text-cyan-400" />
                    <span>Control de mesa sincronizado con TPV</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-white font-extrabold text-sm tabular-nums">
                      Total Mesa: {totalAmount.toFixed(2)} €
                    </span>
                  </div>
                </div>

              </div>

            </div>

            <div className="text-center pt-3">
              <span className="text-[10px] text-slate-500">
                🖥️ Tablet de Sala &amp; Pantalla KDS Industrial (Acceso desde navegador)
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
