'use client'

import React, { useEffect, useRef, useState } from 'react'
import {
  Smartphone,
  ChefHat,
  QrCode,
  CheckCircle2,
  RotateCcw,
  ExternalLink,
  Clock,
  ShieldCheck,
  Bell,
  ArrowRight,
  Check,
  Gift,
  Flame,
  UtensilsCrossed,
  Sparkles,
  Layers,
  Wine
} from 'lucide-react'

/**
 * HeroSandbox
 * Demostración interactiva en 3 pantallas sincronizadas:
 * 1. Comensal pide (Carta QR) ->
 * 2. Mozo valida (Comandero · Roberto) ->
 * 3. Cocina prepara (Monitor Cocina KDS) ->
 * 4. Mozo sirve (Comandero · Roberto) ->
 * 5. Comensal recibe (Celebración Verde Esmeralda)
 */

interface Dish {
  id: string
  name: string
  price: number
  station: 'cocina' | 'barra'
  course: '1° Entradas' | '2° Principales' | 'Bebidas' | 'Postres'
}

const DISHES: Dish[] = [
  { id: 'bravas', name: 'Patatas Bravas Crujientes', price: 6.0, station: 'cocina', course: '1° Entradas' },
  { id: 'smash', name: 'Smash Burger Doble Trufada', price: 13.5, station: 'cocina', course: '2° Principales' },
  { id: 'ipa', name: 'Cerveza Artesana IPA', price: 3.8, station: 'barra', course: 'Bebidas' },
  { id: 'tarta', name: 'Tarta de Queso Fluida', price: 5.5, station: 'cocina', course: 'Postres' },
]

type Stage = 'carrito' | 'pendiente' | 'cocina' | 'listo' | 'servido'

interface CartLine {
  id: string
  name: string
  qty: number
  price: number
  station: 'cocina' | 'barra'
  course: '1° Entradas' | '2° Principales' | 'Bebidas' | 'Postres'
}

const STEPS: { key: Stage; label: string }[] = [
  { key: 'carrito', label: '1. Comensal pide' },
  { key: 'pendiente', label: '2. Mozo valida' },
  { key: 'cocina', label: '3. Cocina prepara' },
  { key: 'listo', label: '4. Mozo sirve' },
  { key: 'servido', label: '5. Comensal recibe' },
]

const formatEuro = (n: number) => `${n.toFixed(2).replace('.', ',')} €`

interface HeroSandboxProps {
  onOpenAllDashboards: () => void
}

export function HeroSandbox({ onOpenAllDashboards }: HeroSandboxProps) {
  // Inicializamos con 1 smash y 1 ipa por defecto para que el usuario pueda probar con 1 solo clic en "Enviar pedido"
  const [cart, setCart] = useState<CartLine[]>([
    { id: 'smash', name: 'Smash Burger Doble Trufada', qty: 1, price: 13.5, station: 'cocina', course: '2° Principales' },
    { id: 'ipa', name: 'Cerveza Artesana IPA', qty: 1, price: 3.8, station: 'barra', course: 'Bebidas' }
  ])
  const [stage, setStage] = useState<Stage>('carrito')
  const [elapsed, setElapsed] = useState(64) // Empezar con cronómetro natural ~1 min
  const [pulse, setPulse] = useState<'carta' | 'mozo' | 'cocina' | null>(null)
  const pulseTimer = useRef<NodeJS.Timeout | null>(null)

  // Cronómetro del ticket mientras está en cocina
  useEffect(() => {
    if (stage !== 'cocina') return
    const t = setInterval(() => setElapsed((s) => s + 1), 1000)
    return () => clearInterval(t)
  }, [stage])

  useEffect(() => {
    return () => {
      if (pulseTimer.current) clearTimeout(pulseTimer.current)
    }
  }, [])

  const flash = (target: 'carta' | 'mozo' | 'cocina') => {
    setPulse(target)
    if (pulseTimer.current) clearTimeout(pulseTimer.current)
    pulseTimer.current = setTimeout(() => setPulse(null), 800)
  }

  const total = cart.reduce((acc, l) => acc + l.price * l.qty, 0)
  const itemsCount = cart.reduce((acc, l) => acc + l.qty, 0)
  const kitchenLines = cart.filter((l) => l.station === 'cocina')
  const barLines = cart.filter((l) => l.station === 'barra')
  const stageIndex = STEPS.findIndex((s) => s.key === stage)
  const canEditCart = stage === 'carrito'

  const addDish = (dish: Dish) => {
    if (!canEditCart) return
    setCart((prev) => {
      const found = prev.find((l) => l.id === dish.id)
      if (found) return prev.map((l) => (l.id === dish.id ? { ...l, qty: l.qty + 1 } : l))
      return [...prev, { id: dish.id, name: dish.name, qty: 1, price: dish.price, station: dish.station, course: dish.course }]
    })
  }

  // Paso 1: Comensal envía comanda -> avanza a Paso 2 (Mozo valida)
  const sendOrder = () => {
    if (cart.length === 0) return
    setStage('pendiente')
    flash('mozo')
  }

  // Paso 2: Mozo aprueba y envía a cocina -> avanza a Paso 3 (Cocina prepara)
  const approveAndSendToKitchen = () => {
    setElapsed(62)
    setStage('cocina')
    flash('cocina')
  }

  // Paso 3: Cocina marca ¡LISTO PARA SERVIR! -> avanza a Paso 4 (Mozo sirve)
  const markReadyInKitchen = () => {
    setStage('listo')
    flash('mozo')
  }

  // Paso 4: Mozo entrega y cobra mesa -> avanza a Paso 5 (Comensal recibe celebración)
  const deliverAndCharge = () => {
    setStage('servido')
    flash('carta')
  }

  // Reiniciar simulador
  const reset = () => {
    setCart([
      { id: 'smash', name: 'Smash Burger Doble Trufada', qty: 1, price: 13.5, station: 'cocina', course: '2° Principales' },
      { id: 'ipa', name: 'Cerveza Artesana IPA', qty: 1, price: 3.8, station: 'barra', course: 'Bebidas' }
    ])
    setStage('carrito')
    setElapsed(64)
    setPulse(null)
  }

  const clientStatus: Record<Stage, { text: string; cls: string }> = {
    carrito: { text: 'Selecciona tus platos', cls: 'bg-slate-100 text-slate-700 border-slate-200' },
    pendiente: { text: 'Enviado · Mozo validando comanda...', cls: 'bg-amber-50 text-amber-800 border-amber-300 animate-pulse' },
    cocina: { text: 'En cocina · Preparando a fuegos', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
    listo: { text: '¡Listo en cocina! · Mozo de camino', cls: 'bg-emerald-50 text-emerald-700 border-emerald-300 font-bold' },
    servido: { text: 'Cuenta pagada · ¡Buen provecho!', cls: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  }

  const ring = (target: 'carta' | 'mozo' | 'cocina') =>
    pulse === target ? 'ring-4 ring-blue-500/60 scale-[1.01]' : 'ring-0'

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* ── BARRA SUPERIOR CON ESTADO EN VIVO Y LATENCIA ── */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-5 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="relative flex w-3.5 h-3.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
            <span className="relative inline-flex w-3.5 h-3.5 rounded-full bg-emerald-500" />
          </span>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <p className="text-xs sm:text-sm font-black text-emerald-600 tracking-wide">
                ● EN VIVO: SINCRONIZACIÓN SALA-COCINA (&lt; 100 ms)
              </p>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-600 border border-slate-200">
                Latencia: 38 ms
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Circuito completo en 4 toques interactivos reales sin saltos automáticos.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reiniciar
          </button>
          <button
            type="button"
            onClick={onOpenAllDashboards}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors cursor-pointer"
          >
            Ver pantallas reales
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* ── BARRA SUPERIOR DE 5 PASOS CLAROS ── */}
      <ol className="mb-6 grid grid-cols-5 gap-1.5 sm:gap-3">
        {STEPS.map((s, i) => {
          const done = i < stageIndex || stage === 'servido'
          const active = i === stageIndex && stage !== 'servido'
          return (
            <li key={s.key} className="flex flex-col items-center gap-1.5 text-center">
              <div
                className={`h-2 w-full rounded-full transition-colors duration-500 ${
                  done ? 'bg-emerald-500' : active ? 'bg-blue-600 animate-pulse' : 'bg-slate-200'
                }`}
              />
              <span
                className={`text-[9px] sm:text-xs font-black leading-tight transition-colors ${
                  done ? 'text-emerald-700' : active ? 'text-blue-700 font-extrabold scale-105' : 'text-slate-400'
                }`}
              >
                {s.label}
              </span>
            </li>
          )
        })}
      </ol>

      {/* ── 3 PANTALLAS SIN ESPACIOS MUERTOS ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 items-start text-left">
        
        {/* 1. CARTA QR (COMENSAL) */}
        <div className="flex flex-col items-center">
          <div
            className={`w-full max-w-[320px] rounded-[2.2rem] bg-slate-900 p-2.5 border-4 border-slate-800 shadow-2xl transition-all duration-300 ${ring('carta')}`}
          >
            <div className="w-20 h-3.5 bg-slate-950 rounded-full mx-auto mb-2" />
            <div className="relative bg-slate-50 rounded-[1.6rem] p-3 min-h-[420px] flex flex-col gap-2 overflow-hidden border border-slate-200/50">
              
              {/* Top Bar Móvil */}
              <div className="flex items-center justify-between border-b border-slate-200/70 pb-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[12px] font-extrabold text-slate-900">Fluxo Bistro</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200 text-[10px] font-black">
                  Mesa 4 · Terraza
                </span>
              </div>

              {/* Lista de Platos */}
              <div className="flex flex-col gap-1.5 flex-1 overflow-y-auto pr-0.5">
                {DISHES.map((d) => {
                  const qty = cart.find((l) => l.id === d.id)?.qty ?? 0
                  return (
                    <div
                      key={d.id}
                      className="flex items-center justify-between gap-2 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 shadow-xs"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          <p className="text-xs font-bold text-slate-900 truncate">{d.name}</p>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[11px] font-semibold text-slate-500 tabular-nums">{formatEuro(d.price)}</span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 font-bold uppercase">
                            {d.course}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => addDish(d)}
                        disabled={!canEditCart}
                        className="flex-shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors cursor-pointer active:scale-95"
                      >
                        + Pedir
                        {qty > 0 && (
                          <span className="ml-0.5 min-w-[16px] h-4 px-1 rounded-full bg-white text-blue-700 text-[10px] flex items-center justify-center font-black tabular-nums">
                            {qty}
                          </span>
                        )}
                      </button>
                    </div>
                  )
                })}
              </div>

              {/* Pie de la Carta */}
              <div className="mt-auto pt-2 space-y-2 border-t border-slate-200/80">
                <div className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-bold text-center ${clientStatus[stage].cls}`}>
                  {clientStatus[stage].text}
                </div>
                {canEditCart && (
                  <button
                    type="button"
                    onClick={sendOrder}
                    disabled={cart.length === 0}
                    className="w-full py-2.5 rounded-xl text-xs font-black text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all shadow-md shadow-blue-500/25 cursor-pointer active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    <span>Enviar pedido ({itemsCount}) &middot; {formatEuro(total)}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* ── PASO 5: OVERLAY VERDE ESMERALDA DE CELEBRACIÓN ── */}
              {stage === 'servido' && (
                <div className="absolute inset-0 z-30 flex flex-col items-center justify-between p-4 text-center bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 text-white rounded-[1.6rem] shadow-[0_10px_30px_-5px_rgba(16,185,129,0.5)] animate-in fade-in zoom-in-95 duration-500">
                  
                  {/* Top Pill */}
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-black uppercase tracking-wider text-emerald-100 border border-white/30">
                    <Sparkles className="w-3 h-3 text-amber-300" />
                    <span>Experiencia sin esperas</span>
                  </div>

                  {/* Icono circular de Check brillante con animación de pulso */}
                  <div className="relative flex items-center justify-center my-1">
                    <span className="absolute w-16 h-16 rounded-full bg-emerald-300/40 animate-ping" />
                    <div
                      className="w-14 h-14 rounded-full bg-white/25 border-2 border-white/80 flex items-center justify-center shadow-lg"
                      style={{ animation: 'fluxoGlowPulse 2s ease-in-out infinite' }}
                    >
                      <Check className="w-8 h-8 text-white drop-shadow-md" strokeWidth={3.5} />
                    </div>
                  </div>

                  {/* Título y Subtítulo */}
                  <div className="space-y-1">
                    <h4 className="text-lg font-black leading-tight drop-shadow-sm">¡Gracias por tu visita!</h4>
                    <p className="text-xs font-semibold text-emerald-100">Cuenta pagada &middot; Mesa #4</p>
                  </div>

                  {/* Insignia dorada/blanca del Sello */}
                  <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-300 text-amber-950 text-[11px] font-black shadow-md">
                    <Gift className="w-3.5 h-3.5 text-amber-900" />
                    <span>🎁 +1 Sello sumado a tu Cartilla</span>
                  </div>

                  {/* Estrellas doradas y Reseña de Google Maps */}
                  <div className="bg-white/15 backdrop-blur-xs border border-white/25 rounded-xl p-2.5 w-full flex flex-col items-center gap-1">
                    <div className="flex items-center gap-1 text-amber-300 text-sm tracking-widest drop-shadow">
                      ★★★★★
                    </div>
                    <span className="text-[11px] font-bold text-white drop-shadow-xs">
                      ⭐ Valorar en Google Maps (+1 sello extra)
                    </span>
                  </div>

                  {/* Botón inferior para reiniciar */}
                  <button
                    type="button"
                    onClick={reset}
                    className="w-full py-2.5 rounded-xl text-xs font-black text-emerald-900 bg-white hover:bg-emerald-50 transition-all shadow-md active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-emerald-700" />
                    <span>↻ Probar otro pedido en el simulador</span>
                  </button>
                </div>
              )}

            </div>
          </div>
          <p className="mt-3 flex items-center gap-1.5 text-xs font-bold text-slate-600">
            <QrCode className="w-3.5 h-3.5 text-blue-600" /> 1 · Carta QR del comensal
          </p>
        </div>

        {/* 2. COMANDERO MOZO (ROBERTO) */}
        <div className="flex flex-col items-center">
          <div
            className={`w-full max-w-[320px] rounded-[2.2rem] bg-slate-900 p-2.5 border-4 border-slate-800 shadow-2xl transition-all duration-300 ${ring('mozo')}`}
          >
            <div className="w-20 h-3.5 bg-slate-950 rounded-full mx-auto mb-2" />
            <div className="bg-slate-50 rounded-[1.6rem] p-3 min-h-[420px] flex flex-col gap-2 border border-slate-200/50">
              
              {/* Top Bar Mozo con Salón Activo (Sin espacios muertos) */}
              <div className="flex items-center justify-between border-b border-slate-200/70 pb-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-[12px] font-extrabold text-slate-900">Comandero &middot; Roberto</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-[10px] font-bold text-slate-500">6 Mesas</span>
                  <Bell className={`w-3.5 h-3.5 ml-1 ${stage === 'pendiente' || stage === 'listo' ? 'text-amber-500 animate-bounce' : 'text-slate-400'}`} />
                </div>
              </div>

              {/* Indicador de Mesas en Sala (Elimina espacios muertos) */}
              <div className="grid grid-cols-3 gap-1 py-1">
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-1 text-center">
                  <span className="text-[9px] font-black text-emerald-800 block">M1: Libre</span>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-1 text-center">
                  <span className="text-[9px] font-black text-blue-800 block">M2: 24,50€</span>
                </div>
                <div className={`rounded-lg p-1 text-center border transition-all ${
                  stage === 'pendiente' 
                    ? 'bg-amber-100 border-amber-400 animate-pulse' 
                    : stage === 'cocina' 
                      ? 'bg-blue-100 border-blue-300' 
                      : stage === 'listo'
                        ? 'bg-emerald-100 border-emerald-400'
                        : stage === 'servido'
                          ? 'bg-slate-100 border-slate-300'
                          : 'bg-white border-slate-200'
                }`}>
                  <span className="text-[9px] font-black text-slate-900 block">
                    {stage === 'pendiente' ? 'M4: 🔔 Validar' : stage === 'listo' ? 'M4: 🔥 Servir' : 'M4: Terraza'}
                  </span>
                </div>
              </div>

              {/* Contenido Dinámico según Estado */}
              {stage === 'carrito' && (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-3 gap-2 bg-white rounded-xl border border-dashed border-slate-300">
                  <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-bold text-slate-800">Sala en Espera de Pedido</p>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Toca en el móvil izquierdo «Enviar pedido» para ver cómo entra la comanda a Roberto.
                  </p>
                  <div className="mt-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-[10px] font-black">
                    <span>Filtro antifraude activado</span>
                  </div>
                </div>
              )}

              {/* PASO 2: MOZO VALIDA COMANDA NUEVA (DETALLADA) */}
              {stage === 'pendiente' && (
                <div className="flex-1 bg-white border-2 border-amber-400 rounded-xl p-2.5 space-y-2 shadow-sm animate-in fade-in duration-300">
                  {/* Insignia ámbar pulsante */}
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-black w-full justify-center animate-pulse">
                    <Bell className="w-3.5 h-3.5 text-amber-600" />
                    <span>🔔 Validar Comanda Nueva</span>
                  </div>

                  <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                    <div>
                      <span className="text-xs font-black text-slate-900 block">Mesa 4 &middot; Terraza</span>
                      <span className="text-[10px] text-slate-500">2 comensales &middot; Auto-pedido QR</span>
                    </div>
                    <span className="text-xs font-black text-blue-700 tabular-nums">{formatEuro(total)}</span>
                  </div>

                  {/* Desglose de platos por estación */}
                  <div className="space-y-1.5 text-[11px]">
                    <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                      Estaciones de Pase:
                    </span>
                    {cart.map((l) => (
                      <div key={l.id} className="flex items-center justify-between bg-slate-50 rounded-lg px-2 py-1 border border-slate-100">
                        <span className="font-bold text-slate-800">
                          {l.qty}x {l.name}
                        </span>
                        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                          l.station === 'barra' ? 'bg-violet-100 text-violet-800' : 'bg-orange-100 text-orange-800'
                        }`}>
                          {l.course} &middot; {l.station === 'barra' ? 'Barra' : 'Cocina'}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Botón destacado Paso 2 */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={approveAndSendToKitchen}
                      className="w-full py-2.5 rounded-xl text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 transition-all shadow-md shadow-emerald-500/25 cursor-pointer active:scale-95 flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>✓ Aprobar y Enviar a Cocina</span>
                    </button>
                  </div>
                </div>
              )}

              {/* PASO 3: EN COCINA (COMANDERO EN SEGUIMIENTO) */}
              {stage === 'cocina' && (
                <div className="flex-1 bg-white border border-blue-200 rounded-xl p-2.5 space-y-2 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                      <span className="text-xs font-black text-slate-900">Mesa 4 &middot; En Cocina</span>
                      <span className="text-xs font-black text-slate-900 tabular-nums">{formatEuro(total)}</span>
                    </div>
                    <p className="text-[11px] text-blue-700 font-bold mt-2 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> Comanda enviada a fuegos
                    </p>
                    <p className="text-[11px] text-slate-600 mt-1">
                      El cocinero está preparando los platos. Roberto recibirá una alerta sonora en su móvil en cuanto esté listo.
                    </p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-[11px] font-bold text-center">
                    Esperando aviso de cocina...
                  </div>
                </div>
              )}

              {/* PASO 4: MOZO SIRVE (✓ LISTO EN COCINA) */}
              {stage === 'listo' && (
                <div className="flex-1 bg-white border-2 border-emerald-500 rounded-xl p-2.5 space-y-2 flex flex-col justify-between shadow-sm animate-in fade-in duration-300">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-black w-full justify-center">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>✓ Listo en Cocina</span>
                    </div>
                    <div className="mt-2 border-b border-slate-100 pb-1.5 flex items-center justify-between">
                      <span className="text-xs font-black text-slate-900">Mesa 4 &middot; Terraza</span>
                      <span className="text-xs font-black text-emerald-700">Listo para entrega</span>
                    </div>
                    <ul className="mt-2 space-y-1 text-[11px]">
                      {cart.map((l) => (
                        <li key={l.id} className="flex items-center gap-1.5 text-slate-700 font-bold">
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>{l.qty}x {l.name}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Botón destacado Paso 4 */}
                  <button
                    type="button"
                    onClick={deliverAndCharge}
                    className="w-full py-2.5 rounded-xl text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 transition-all shadow-md shadow-emerald-500/25 cursor-pointer active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Entregar y Cobrar Mesa</span>
                  </button>
                </div>
              )}

              {/* PASO 5: SERVIDO Y COBRADO */}
              {stage === 'servido' && (
                <div className="flex-1 bg-white border border-emerald-200 rounded-xl p-2.5 flex flex-col justify-between text-center">
                  <div className="space-y-2 pt-2">
                    <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-black text-slate-900">Mesa 4 Cobrada &amp; Cerrada</p>
                    <p className="text-[11px] text-slate-600">
                      Total liquidado: <strong className="text-slate-900">{formatEuro(total)}</strong>. Mesa liberada al instante para el siguiente turno.
                    </p>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 text-[10px] font-bold">
                    Cierre de turno cuadrado
                  </div>
                </div>
              )}

            </div>
          </div>
          <p className="mt-3 flex items-center gap-1.5 text-xs font-bold text-slate-600">
            <Smartphone className="w-3.5 h-3.5 text-blue-600" /> 2 · Comandero &middot; Roberto
          </p>
        </div>

        {/* 3. MONITOR COCINA KDS */}
        <div className="flex flex-col items-center">
          <div
            className={`w-full max-w-[320px] rounded-[1.6rem] bg-slate-900 p-2.5 border-4 border-slate-800 shadow-2xl transition-all duration-300 ${ring('cocina')}`}
          >
            <div className="bg-slate-950 rounded-[1.1rem] p-3 min-h-[420px] flex flex-col gap-2 border border-slate-800 text-left">
              
              {/* Header KDS Profesional */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-1.5">
                  <ChefHat className="w-4 h-4 text-orange-400" />
                  <span className="text-[12px] font-extrabold text-white">Monitor Cocina KDS</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-slate-800 text-amber-300 border border-slate-700 text-[10px] font-bold">
                  Estación Fuegos
                </span>
              </div>

              {/* Resumen Superior de Pases (Elimina espacios muertos) */}
              <div className="flex items-center justify-between text-[10px] font-bold px-1 text-slate-400">
                <span>Pases activos: {stage === 'cocina' ? '1' : '0'}</span>
                <span className="text-emerald-400">● KDS Industrial Online</span>
              </div>

              {/* Estado cuando aún no ha entrado la comanda */}
              {(stage === 'carrito' || stage === 'pendiente') && (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-3 gap-2 bg-slate-900/60 rounded-xl border border-dashed border-slate-800">
                  <ChefHat className="w-8 h-8 text-slate-600" />
                  <p className="text-xs font-bold text-slate-300">Pase Despejado</p>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    {stage === 'carrito'
                      ? 'Las comandas entrarán aquí en cuanto el mozo las valide.'
                      : 'Mesa 4 pendiente de aprobación en el móvil de Roberto.'}
                  </p>
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] font-mono">
                    Tiempos sincronizados
                  </div>
                </div>
              )}

              {/* PASO 3: COCINA PREPARA TICKET CON CRONÓMETRO Y FASES */}
              {stage === 'cocina' && (
                <div className="flex-1 flex flex-col justify-between bg-slate-900 border-2 border-amber-500/80 rounded-xl p-2.5 space-y-2 shadow-lg animate-in fade-in duration-300">
                  <div>
                    {/* Cabecera del Ticket con Cronómetro */}
                    <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                      <span className="text-xs font-black text-amber-400">TICKET #42 &middot; Mesa 4 (Terraza)</span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-amber-300 tabular-nums bg-amber-950/80 px-2 py-0.5 rounded border border-amber-500/40">
                        <Clock className="w-3 h-3 text-amber-400" />
                        ⏱ Hace 1 min · En Tiempo
                      </span>
                    </div>

                    {/* FASE 1: PASE ACTIVO DESPLEGADO */}
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center gap-1 text-[10px] font-black text-emerald-400 uppercase tracking-wider">
                        <Flame className="w-3 h-3" />
                        <span>Fase 1: Preparación Inmediata</span>
                      </div>
                      <ul className="space-y-1 pt-1">
                        {kitchenLines.map((l) => (
                          <li key={l.id} className="text-xs font-black text-white flex items-center justify-between bg-slate-800/80 px-2 py-1.5 rounded-lg border border-slate-700/60">
                            <span>{l.qty}x {l.name}</span>
                            <span className="text-[9px] font-bold text-emerald-400 uppercase bg-emerald-950/60 px-1 rounded">Fuegos</span>
                          </li>
                        ))}
                      </ul>
                      {barLines.length > 0 && (
                        <p className="text-[10px] text-violet-300 pt-1 flex items-center gap-1">
                          <Wine className="w-3 h-3" /> {barLines.map((l) => `${l.qty}x ${l.name}`).join(', ')} (Asignada a Barra)
                        </p>
                      )}
                    </div>

                    {/* FASE 2: BARRA COMPACTA DE PASES COLAPSADOS */}
                    <div className="mt-2.5 p-2 rounded-lg bg-slate-950/80 border border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Layers className="w-3 h-3 text-amber-500" />
                        <span className="font-bold text-slate-300">Fase 2: Postres &amp; Segundos</span>
                      </div>
                      <span className="px-1.5 py-0.2 rounded bg-amber-950 text-amber-400 font-bold border border-amber-800/50">
                        Bloqueado
                      </span>
                    </div>
                  </div>

                  {/* Botón destacado Paso 3 */}
                  <button
                    type="button"
                    onClick={markReadyInKitchen}
                    className="w-full py-3 rounded-xl text-xs font-black text-slate-950 bg-emerald-400 hover:bg-emerald-300 transition-all shadow-lg shadow-emerald-500/30 cursor-pointer active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    <span>🔥 ¡LISTO PARA SERVIR!</span>
                  </button>
                </div>
              )}

              {/* Estado cuando la cocina ya completó el pase */}
              {(stage === 'listo' || stage === 'servido') && (
                <div className="flex-1 flex flex-col justify-between bg-slate-900/60 border border-emerald-500/40 rounded-xl p-3">
                  <div className="space-y-2 pt-2 text-center">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
                      <Check className="w-5 h-5 stroke-[3]" />
                    </div>
                    <p className="text-xs font-black text-white">Ticket #42 Despachado</p>
                    <p className="text-[11px] text-slate-400">
                      Mozo avisado automáticamente en sala. Cero tickets de papel perdidos.
                    </p>
                  </div>
                  <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[10px] font-bold text-center">
                    Pase completado en tiempo récord
                  </div>
                </div>
              )}

            </div>
          </div>
          <p className="mt-3 flex items-center gap-1.5 text-xs font-bold text-slate-600">
            <ChefHat className="w-3.5 h-3.5 text-blue-600" /> 3 · Monitor Cocina KDS
          </p>
        </div>

      </div>

      {/* Ayuda contextual interactiva */}
      <div className="mt-6 text-center text-xs sm:text-sm font-semibold text-slate-600 flex items-center justify-center gap-2 bg-slate-100/70 border border-slate-200/80 rounded-xl py-2 px-4 max-w-xl mx-auto shadow-xs">
        <ArrowRight className="w-4 h-4 text-blue-600 flex-shrink-0 animate-pulse" />
        {stage === 'carrito' && (
          <span><strong>Paso 1:</strong> Pulsa <em>«Enviar pedido»</em> en la Carta QR para enviar la comanda.</span>
        )}
        {stage === 'pendiente' && (
          <span><strong>Paso 2:</strong> Pulsa <em>«✓ Aprobar y Enviar a Cocina»</em> en el móvil de Roberto.</span>
        )}
        {stage === 'cocina' && (
          <span><strong>Paso 3:</strong> La cocina prepara y pulsa <em>«🔥 ¡LISTO PARA SERVIR!»</em> en el monitor KDS.</span>
        )}
        {stage === 'listo' && (
          <span><strong>Paso 4:</strong> El mozo pulsa <em>«Entregar y Cobrar Mesa»</em> para cerrar el servicio.</span>
        )}
        {stage === 'servido' && (
          <span><strong>Paso 5:</strong> Comensal recibe su celebración con +1 sello y reseña de Google. Pulsa <em>«Reiniciar»</em> para repetir.</span>
        )}
      </div>

      {/* Keyframes del resplandor del check esmeralda */}
      <style jsx global>{`
        @keyframes fluxoGlowPulse {
          0%, 100% { box-shadow: 0 0 16px rgba(255, 255, 255, 0.45); }
          50% { box-shadow: 0 0 30px rgba(255, 255, 255, 0.85); }
        }
      `}</style>
    </div>
  )
}
