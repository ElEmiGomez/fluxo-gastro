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
} from 'lucide-react'

/**
 * HeroSandbox
 * Demostración rápida del circuito completo en 3 pantallas sincronizadas:
 * Carta QR (comensal) -> Comandero (mozo valida) -> KDS (cocina prepara) -> vuelta al mozo y al comensal.
 * Todo el estado vive en memoria del navegador: no toca Supabase.
 */

interface Dish {
  id: string
  name: string
  price: number
  station: 'cocina' | 'barra'
}

const DISHES: Dish[] = [
  { id: 'smash', name: 'Smash Burger Doble', price: 13.5, station: 'cocina' },
  { id: 'bravas', name: 'Patatas Bravas', price: 6.0, station: 'cocina' },
  { id: 'ipa', name: 'Cerveza Artesana IPA', price: 3.8, station: 'barra' },
  { id: 'tarta', name: 'Tarta de Queso', price: 5.5, station: 'cocina' },
]

type Stage = 'carrito' | 'pendiente' | 'cocina' | 'listo' | 'servido'

interface CartLine {
  id: string
  name: string
  qty: number
  price: number
  station: 'cocina' | 'barra'
}

const STEPS: { key: Stage; label: string }[] = [
  { key: 'carrito', label: 'Comensal pide' },
  { key: 'pendiente', label: 'Mozo valida' },
  { key: 'cocina', label: 'Cocina prepara' },
  { key: 'listo', label: 'Mozo sirve' },
  { key: 'servido', label: 'Comensal recibe' },
]

const formatEuro = (n: number) => `${n.toFixed(2).replace('.', ',')} €`

interface HeroSandboxProps {
  onOpenAllDashboards: () => void
}

export function HeroSandbox({ onOpenAllDashboards }: HeroSandboxProps) {
  const [cart, setCart] = useState<CartLine[]>([])
  const [stage, setStage] = useState<Stage>('carrito')
  const [elapsed, setElapsed] = useState(0)
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
      return [...prev, { id: dish.id, name: dish.name, qty: 1, price: dish.price, station: dish.station }]
    })
  }

  const sendOrder = () => {
    if (cart.length === 0) return
    setStage('pendiente')
    flash('mozo')
  }

  const validateOrder = () => {
    setElapsed(0)
    setStage('cocina')
    flash('cocina')
  }

  const markReady = () => {
    setStage('listo')
    flash('mozo')
  }

  const serveOrder = () => {
    setStage('servido')
    flash('carta')
  }

  const reset = () => {
    setCart([])
    setStage('carrito')
    setElapsed(0)
    setPulse(null)
  }

  const clientStatus: Record<Stage, { text: string; cls: string }> = {
    carrito: { text: 'Elige tus platos', cls: 'bg-slate-100 text-slate-600 border-slate-200' },
    pendiente: { text: 'Enviado · esperando al camarero', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
    cocina: { text: 'En cocina', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
    listo: { text: 'Listo · de camino a tu mesa', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    servido: { text: '¡Buen provecho!', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  }

  const ring = (target: 'carta' | 'mozo' | 'cocina') =>
    pulse === target ? 'ring-4 ring-blue-400/40 scale-[1.01]' : 'ring-0'

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* ── BARRA SUPERIOR ── */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-5 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="relative flex w-3 h-3">
            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
            <span className="relative inline-flex w-3 h-3 rounded-full bg-emerald-500" />
          </span>
          <div className="text-left">
            <p className="text-xs sm:text-sm font-black text-emerald-600 tracking-wide">
              EN VIVO: CARTA · MOZO · COCINA SINCRONIZADOS
            </p>
            <p className="text-[11px] text-slate-500">
              Haz el recorrido completo de una comanda en 4 toques.
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

      {/* ── PROGRESO DEL CIRCUITO ── */}
      <ol className="mb-6 grid grid-cols-5 gap-1.5 sm:gap-3">
        {STEPS.map((s, i) => {
          const done = i < stageIndex || stage === 'servido'
          const active = i === stageIndex && stage !== 'servido'
          return (
            <li key={s.key} className="flex flex-col items-center gap-1.5 text-center">
              <div
                className={`h-1.5 w-full rounded-full transition-colors duration-500 ${
                  done ? 'bg-emerald-500' : active ? 'bg-blue-500 animate-pulse' : 'bg-slate-200'
                }`}
              />
              <span
                className={`text-[10px] sm:text-xs font-bold leading-tight ${
                  done ? 'text-emerald-600' : active ? 'text-blue-700' : 'text-slate-400'
                }`}
              >
                {s.label}
              </span>
            </li>
          )
        })}
      </ol>

      {/* ── 3 PANTALLAS ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start text-left">
        {/* 1. CARTA QR */}
        <div className="flex flex-col items-center">
          <div
            className={`w-full max-w-[300px] rounded-[2.2rem] bg-slate-900 p-2.5 border-4 border-slate-800 shadow-2xl transition-all duration-300 ${ring('carta')}`}
          >
            <div className="w-20 h-3.5 bg-slate-950 rounded-full mx-auto mb-2" />
            <div className="relative bg-slate-50 rounded-[1.6rem] p-3 min-h-[380px] flex flex-col gap-2.5 overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-extrabold text-slate-900">Fluxo Bistro</span>
                <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold">
                  Mesa 4
                </span>
              </div>

              <div className="flex flex-col gap-1.5">
                {DISHES.map((d) => {
                  const qty = cart.find((l) => l.id === d.id)?.qty ?? 0
                  return (
                    <div
                      key={d.id}
                      className="flex items-center justify-between gap-2 bg-white border border-slate-200 rounded-xl px-2.5 py-2"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">{d.name}</p>
                        <p className="text-[11px] text-slate-500 tabular-nums">{formatEuro(d.price)}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => addDish(d)}
                        disabled={!canEditCart}
                        className="flex-shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors cursor-pointer"
                      >
                        + Pedir
                        {qty > 0 && (
                          <span className="ml-0.5 min-w-[16px] h-4 px-1 rounded-full bg-white text-blue-700 text-[10px] flex items-center justify-center tabular-nums">
                            {qty}
                          </span>
                        )}
                      </button>
                    </div>
                  )
                })}
              </div>

              <div className="mt-auto space-y-2">
                <div className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-bold text-center ${clientStatus[stage].cls}`}>
                  {clientStatus[stage].text}
                </div>
                {canEditCart && (
                  <button
                    type="button"
                    onClick={sendOrder}
                    disabled={cart.length === 0}
                    className="w-full py-2.5 rounded-xl text-xs font-black text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    {cart.length === 0 ? 'Añade un plato' : `Enviar pedido · ${formatEuro(total)}`}
                  </button>
                )}
              </div>

              {/* CIERRE: TARJETA DE CELEBRACIÓN VERDE ESMERALDA (paso final del circuito) */}
              {stage === 'servido' && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 p-4 text-center bg-gradient-to-br from-emerald-500 to-teal-600 text-white animate-in fade-in zoom-in-95 duration-500">
                  {/* Check brillante con pulso */}
                  <div className="relative flex items-center justify-center">
                    <span className="absolute w-16 h-16 rounded-full bg-emerald-300/40 animate-ping" />
                    <div
                      className="w-14 h-14 rounded-full bg-white/20 border-2 border-white/70 flex items-center justify-center animate-in zoom-in-50 duration-700"
                      style={{ animation: 'fluxoGlowPulse 2s ease-in-out infinite' }}
                    >
                      <Check className="w-8 h-8 text-white drop-shadow" strokeWidth={3.5} />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-base font-black leading-tight">¡Gracias por tu visita!</p>
                    <p className="text-[11px] font-semibold text-white/90">Cuenta pagada · Mesa #4</p>
                  </div>

                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-300/95 text-amber-950 text-[11px] font-black shadow-md animate-in zoom-in-75 duration-700">
                    <Gift className="w-3.5 h-3.5" />
                    +1 Sello sumado a tu Cartilla
                  </div>

                  <div className="flex flex-col items-center gap-1 text-[11px] font-bold text-white/95">
                    <span className="text-base tracking-widest text-amber-300 drop-shadow">★★★★★</span>
                    <span>⭐ Valorar en Google Maps (+1 sello extra)</span>
                  </div>

                  <button
                    type="button"
                    onClick={reset}
                    className="mt-1 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[11px] font-black text-emerald-800 bg-white hover:bg-emerald-50 transition-colors shadow-md cursor-pointer active:scale-95"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    ↻ Probar otro pedido en el simulador
                  </button>
                </div>
              )}
            </div>
          </div>
          <p className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-slate-500">
            <QrCode className="w-3.5 h-3.5" /> 1 · Carta QR del comensal
          </p>
        </div>

        {/* 2. COMANDERO MOZO */}
        <div className="flex flex-col items-center">
          <div
            className={`w-full max-w-[300px] rounded-[2.2rem] bg-slate-900 p-2.5 border-4 border-slate-800 shadow-2xl transition-all duration-300 ${ring('mozo')}`}
          >
            <div className="w-20 h-3.5 bg-slate-950 rounded-full mx-auto mb-2" />
            <div className="bg-slate-50 rounded-[1.6rem] p-3 min-h-[380px] flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-extrabold text-slate-900">Comandero · Roberto</span>
                <Bell className={`w-4 h-4 ${stage === 'pendiente' || stage === 'listo' ? 'text-amber-500 animate-bounce' : 'text-slate-400'}`} />
              </div>

              {stage === 'carrito' && (
                <div className="flex-1 flex flex-col items-center justify-center text-center gap-2 text-slate-400">
                  <Smartphone className="w-8 h-8" />
                  <p className="text-xs font-semibold">Sin avisos pendientes</p>
                  <p className="text-[11px]">Cuando el comensal envíe el pedido aparecerá aquí.</p>
                </div>
              )}

              {stage !== 'carrito' && (
                <div className="bg-white border border-slate-200 rounded-xl p-2.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900">Mesa 4 · Terraza</span>
                    <span className="text-xs font-black text-slate-900 tabular-nums">{formatEuro(total)}</span>
                  </div>
                  <ul className="space-y-0.5">
                    {cart.map((l) => (
                      <li key={l.id} className="flex items-center justify-between text-[11px] text-slate-600">
                        <span>
                          {l.qty}x {l.name}
                        </span>
                        <span className={`font-bold ${l.station === 'barra' ? 'text-violet-600' : 'text-orange-600'}`}>
                          {l.station === 'barra' ? 'Barra' : 'Cocina'}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-auto space-y-2">
                {stage === 'pendiente' && (
                  <>
                    <div className="px-2.5 py-1.5 rounded-lg border bg-amber-50 border-amber-200 text-amber-700 text-[11px] font-bold flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5" /> Pedido nuevo · revisar y validar
                    </div>
                    <button
                      type="button"
                      onClick={validateOrder}
                      className="w-full py-2.5 rounded-xl text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 transition-colors cursor-pointer"
                    >
                      Validar y enviar a cocina
                    </button>
                  </>
                )}
                {stage === 'cocina' && (
                  <div className="px-2.5 py-1.5 rounded-lg border bg-blue-50 border-blue-200 text-blue-700 text-[11px] font-bold">
                    En cocina · te avisamos cuando esté listo
                  </div>
                )}
                {stage === 'listo' && (
                  <>
                    <div className="px-2.5 py-1.5 rounded-lg border bg-emerald-50 border-emerald-200 text-emerald-700 text-[11px] font-bold flex items-center gap-1.5">
                      <Bell className="w-3.5 h-3.5" /> Cocina: Mesa 4 lista para servir
                    </div>
                    <button
                      type="button"
                      onClick={serveOrder}
                      className="w-full py-2.5 rounded-xl text-xs font-black text-white bg-blue-600 hover:bg-blue-700 transition-colors cursor-pointer"
                    >
                      Marcar como servido
                    </button>
                  </>
                )}
                {stage === 'servido' && (
                  <div className="px-2.5 py-1.5 rounded-lg border bg-emerald-50 border-emerald-200 text-emerald-700 text-[11px] font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Mesa 4 servida
                  </div>
                )}
              </div>
            </div>
          </div>
          <p className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-slate-500">
            <Smartphone className="w-3.5 h-3.5" /> 2 · Comandero del camarero
          </p>
        </div>

        {/* 3. KDS COCINA */}
        <div className="flex flex-col items-center">
          <div
            className={`w-full max-w-[300px] rounded-[1.6rem] bg-slate-900 p-2.5 border-4 border-slate-800 shadow-2xl transition-all duration-300 ${ring('cocina')}`}
          >
            <div className="bg-slate-950 rounded-[1.1rem] p-3 min-h-[396px] flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-extrabold text-white">Monitor Cocina</span>
                <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-bold">
                  KDS
                </span>
              </div>

              {stage === 'carrito' || stage === 'pendiente' ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center gap-2 text-slate-500">
                  <ChefHat className="w-8 h-8" />
                  <p className="text-xs font-semibold">Sin comandas</p>
                  <p className="text-[11px]">Solo entran pedidos validados por el camarero.</p>
                </div>
              ) : (
                <div
                  className={`rounded-xl border p-2.5 space-y-2 ${
                    stage === 'cocina' ? 'bg-slate-900 border-amber-500/50' : 'bg-slate-900/60 border-emerald-500/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-white">Mesa 4 · Terraza</span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-amber-400 tabular-nums">
                      <Clock className="w-3 h-3" />
                      {String(Math.floor(elapsed / 60)).padStart(2, '0')}:{String(elapsed % 60).padStart(2, '0')}
                    </span>
                  </div>
                  {kitchenLines.length > 0 ? (
                    <ul className="space-y-1">
                      {kitchenLines.map((l) => (
                        <li key={l.id} className="text-sm font-bold text-slate-100">
                          {l.qty}x {l.name}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[11px] text-slate-400">Sin platos de cocina en esta comanda.</p>
                  )}
                  {barLines.length > 0 && (
                    <p className="text-[10px] text-violet-300 border-t border-slate-800 pt-1.5">
                      Bebidas enviadas a barra: {barLines.map((l) => `${l.qty}x ${l.name}`).join(', ')}
                    </p>
                  )}
                </div>
              )}

              <div className="mt-auto">
                {stage === 'cocina' && (
                  <button
                    type="button"
                    onClick={markReady}
                    className="w-full py-4 rounded-xl text-sm font-black text-slate-950 bg-emerald-400 hover:bg-emerald-300 transition-colors cursor-pointer"
                  >
                    ¡LISTO!
                  </button>
                )}
                {(stage === 'listo' || stage === 'servido') && (
                  <div className="px-2.5 py-2 rounded-lg border bg-emerald-500/10 border-emerald-500/30 text-emerald-300 text-[11px] font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Pase completado · camarero avisado
                  </div>
                )}
              </div>
            </div>
          </div>
          <p className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-slate-500">
            <ChefHat className="w-3.5 h-3.5" /> 3 · Pantalla de cocina
          </p>
        </div>
      </div>

      {/* Ayuda contextual del siguiente paso */}
      <p className="mt-6 text-center text-xs sm:text-sm text-slate-500 flex items-center justify-center gap-1.5">
        <ArrowRight className="w-4 h-4 text-blue-600" />
        {stage === 'carrito' && (itemsCount === 0 ? 'Empieza pidiendo un plato en la carta.' : 'Pulsa «Enviar pedido» en la carta.')}
        {stage === 'pendiente' && 'Ahora el camarero valida el pedido en su móvil.'}
        {stage === 'cocina' && 'La cocina prepara el pedido y pulsa «¡LISTO!».'}
        {stage === 'listo' && 'El camarero recibe el aviso y sirve la mesa.'}
        {stage === 'servido' && 'Circuito completo. Pulsa «Reiniciar» para repetirlo.'}
      </p>

      {/* Keyframes del resplandor del check esmeralda */}
      <style jsx global>{`
        @keyframes fluxoGlowPulse {
          0%, 100% { box-shadow: 0 0 18px rgba(255, 255, 255, 0.45); }
          50% { box-shadow: 0 0 32px rgba(255, 255, 255, 0.75); }
        }
      `}</style>
    </div>
  )
}
