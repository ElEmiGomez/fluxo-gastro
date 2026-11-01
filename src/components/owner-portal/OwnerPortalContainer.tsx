'use client'

import React, { useEffect, useState } from 'react'
import {
  UtensilsCrossed,
  CreditCard,
  Users,
  Download,
  PauseCircle,
  LogOut,
  Lock,
  MessagesSquare,
  Sparkles,
  Store,
} from 'lucide-react'
import {
  LocalBilling,
  PLAN_CONFIG,
  getMonthlyBase,
} from '@/lib/billing/billing-calculations'
import {
  MenuPrototype,
  MenuPrototypeDish,
} from '@/types/database.types'
import {
  buildReceiptData,
  drawReceipt,
  downloadCanvasPng,
} from '@/lib/billing/receipt-canvas-renderer'

const PROTOTYPES_STORE_KEY = 'fluxo_crm_prototypes_v1'

// WhatsApp comercial Fluxo (única vía de contacto, sin llamadas)
const FLUXO_WA = '5493585187430'

type PortalTab = 'carta' | 'suscripcion' | 'fidelizacion'

interface OwnerPortalContainerProps {
  local: LocalBilling
  onPatchLocal: (patch: Partial<LocalBilling>) => void
}

function loadPrototipoForSlug(slug: string): MenuPrototype | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(PROTOTYPES_STORE_KEY)
    if (!raw) return null
    const protos = (JSON.parse(raw) as MenuPrototype[]).filter(
      (p) => p && typeof p.slug === 'string'
    )
    return protos.find((p) => p.slug === slug) ?? null
  } catch {
    return null
  }
}

function savePrototipo(proto: MenuPrototype): void {
  if (typeof window === 'undefined') return
  try {
    const raw = localStorage.getItem(PROTOTYPES_STORE_KEY)
    const protos: MenuPrototype[] = raw
      ? (JSON.parse(raw) as MenuPrototype[])
      : []
    const next = protos.some((p) => p.slug === proto.slug)
      ? protos.map((p) => (p.slug === proto.slug ? proto : p))
      : [...protos, proto]
    localStorage.setItem(PROTOTYPES_STORE_KEY, JSON.stringify(next))
  } catch {
    // cuota llena → solo estado en memoria en esta sesión
  }
}

/**
 * PORTAL DEL DUEÑO — módulo desacoplado (copia directa a /panel/[slug] o login
 * de la landing en la fase 2). Pestañas: Mi Carta & Lonja · Suscripción &
 * Recibos · CRM & Fidelización (con bloqueo por plan).
 */
export function OwnerPortalContainer({ local, onPatchLocal }: OwnerPortalContainerProps) {
  const [tab, setTab] = useState<PortalTab>('carta')
  const [prototipo, setPrototipo] = useState<MenuPrototype | null>(null)
  const [abiertoPuntual, setAbiertoPuntual] = useState(true)

  useEffect(() => {
    setPrototipo(loadPrototipoForSlug(local.slug))
  }, [local.slug])

  const esFull = local.plan_type === 'full' || local.plan_type === 'full_fundador'
  const cuota = getMonthlyBase(local)

  const editablePlatos = prototipo?.platos ?? []

  const patchPlato = (dishId: string, patch: Partial<MenuPrototypeDish>) => {
    if (!prototipo) return
    const updated: MenuPrototype = {
      ...prototipo,
      updated_at: new Date().toISOString(),
      platos: prototipo.platos.map((p) => (p.id === dishId ? { ...p, ...patch } : p)),
    }
    setPrototipo(updated)
    savePrototipo(updated)
  }

  const handleDownloadReceipt = () => {
    const canvas = document.createElement('canvas')
    drawReceipt(canvas, buildReceiptData(local))
    downloadCanvasPng(canvas, `recibo_${local.slug}.png`)
  }

  const tabs = [
    { id: 'carta' as const, label: 'Mi Carta & Lonja', icon: UtensilsCrossed },
    { id: 'suscripcion' as const, label: 'Suscripción & Recibos', icon: CreditCard },
    { id: 'fidelizacion' as const, label: 'CRM & Fidelización', icon: Users },
  ]

  const upgradeUrl = `https://wa.me/${FLUXO_WA}?text=${encodeURIComponent(
    `Hola Emiliano, visto el bloqueo de CRM & Fidelización en mi Portal de ${local.nombre}, quiero información para mejorar mi plan a Fluxo Full.`
  )}`

  return (
    <div className="space-y-4">
      {/* Banner ámbar Aviso Suave (pause_level === 1) — solo visible al dueño aquí */}
      {local.pause_level === 1 && (
        <div className="p-4 rounded-2xl bg-amber-500/[0.12] border border-amber-500/35 flex flex-col sm:flex-row sm:items-center gap-3">
          <AmberBannerIcon />
          <div className="flex-1">
            <p className="text-[12px] font-bold text-amber-200">Aviso suave de cuota pendiente</p>
            <p className="text-[11px] text-amber-100/75 mt-0.5 leading-snug">
              Tu carta pública sigue funcionando al 100%. Regulariza tu mes actual para mantener
              todos los servicios de Fluxo activos.
            </p>
          </div>
          <a
            href={`https://wa.me/${FLUXO_WA}?text=${encodeURIComponent(
              `Hola Emiliano, quiero regularizar la cuota pendiente de ${local.nombre}.`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-black apple-smooth flex items-center justify-center gap-1.5 flex-shrink-0"
          >
            <MessagesSquare className="w-3.5 h-3.5" />
            Regularizar por WhatsApp
          </a>
        </div>
      )}

      {/* Selector de pestañas */}
      <div className="grid grid-cols-3 gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`p-3 rounded-2xl border text-[10px] font-bold apple-smooth flex flex-col items-center gap-1.5 ${
              tab === t.id
                ? 'bg-white/[0.14] border-white/25 text-white'
                : 'bg-white/[0.04] border-white/[0.08] text-slate-400 hover:bg-white/[0.08]'
            }`}
          >
            <t.icon className="w-4 h-4" />
            <span className="leading-tight text-center">{t.label}</span>
          </button>
        ))}
      </div>

      {/* ---------------------------------------------------------- Pestaña Carta */}
      {tab === 'carta' && (
        <div className="space-y-3">
          {/* Estado horario */}
          <div className="p-4 rounded-2xl bg-white/[0.05] border border-white/[0.09] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Store className="w-4 h-4 text-cyan-400" />
              <div>
                <p className="text-xs font-bold text-white">Estado de horario</p>
                <p className="text-[10px] text-slate-400">Aviso visible en la carta digital</p>
              </div>
            </div>
            <button
              onClick={() => setAbiertoPuntual((v) => !v)}
              className={`px-3.5 py-2 rounded-xl text-[11px] font-bold apple-smooth flex items-center gap-2 border ${
                abiertoPuntual
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                  : 'bg-slate-700/30 border-slate-500/30 text-slate-300'
              }`}
            >
              {abiertoPuntual ? 'Abierto ahora mismo' : 'Cerrado puntual'}
            </button>
          </div>

          {editablePlatos.length === 0 ? (
            <div className="p-6 rounded-2xl bg-white/[0.04] border border-white/[0.08] text-center">
              <Sparkles className="w-6 h-6 text-indigo-400 mx-auto mb-2" />
              <p className="text-xs font-bold text-white">Aún no tienes carta prototipo conectada</p>
              <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                Queda lista aquí automáticamente al conectar tu carta en los QRs digitales.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {editablePlatos.map((plato) => (
                <div
                  key={plato.id}
                  className="p-3 rounded-2xl bg-white/[0.05] border border-white/[0.08] grid grid-cols-[1fr_auto] gap-x-3 gap-y-2 items-center"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{plato.nombre}</p>
                    <p className="text-[10px] text-slate-400">
                      {plato.categoria} · {plato.descripcion?.slice(0, 60) ?? 'Sin descripción'}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <label className="flex items-center gap-1 text-[9px] text-slate-400">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={plato.precio}
                        onChange={(e) => patchPlato(plato.id, { precio: Number(e.target.value) })}
                        className="w-16 bg-slate-800/80 border border-white/[0.1] rounded-lg px-2 py-1 text-[11px] text-white font-mono outline-none focus:border-cyan-500/50"
                        aria-label={`Precio de ${plato.nombre}`}
                      />
                      €
                    </label>
                  </div>

                  <div className="col-span-2 flex items-center justify-between gap-2 pt-1.5 border-t border-white/[0.05]">
                    <button
                      onClick={() =>
                        patchPlato(plato.id, {
                          badge: plato.badge === 'Segun Lonja' ? null : 'Segun Lonja',
                        })
                      }
                      className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wide border apple-smooth ${
                        plato.badge === 'Segun Lonja'
                          ? 'bg-sky-500/20 border-sky-500/40 text-sky-300'
                          : 'bg-white/[0.04] border-white/[0.1] text-slate-400'
                      }`}
                    >
                      Precio según lonja
                    </button>
                    <button
                      onClick={() => patchPlato(plato.id, { disponible: plato.disponible === false })}
                      className={`px-2.5 py-1 rounded-lg text-[9px] font-bold border apple-smooth ${
                        plato.disponible === false
                          ? 'bg-red-500/15 border-red-500/35 text-red-300'
                          : 'bg-emerald-500/15 border-emerald-500/35 text-emerald-300'
                      }`}
                    >
                      {plato.disponible === false ? 'Agotado' : 'Disponible'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ----------------------------------------------------- Pestaña Suscripción */}
      {tab === 'suscripcion' && (
        <div className="space-y-3">
          <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-500/[0.1] to-cyan-500/[0.06] border border-white/[0.1]">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Tu plan actual · {PLAN_CONFIG[local.plan_type].note}
            </p>
            <p className="text-lg font-black text-white mt-1">{PLAN_CONFIG[local.plan_type].label}</p>
            <p className="text-2xl font-black text-cyan-300 mt-1">
              {cuota} €<span className="text-sm text-slate-400 font-bold">/mes + IVA</span>
            </p>
            <div className="mt-3 pt-3 border-t border-white/[0.08] flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Día de cobro elegido</span>
              <span className="font-bold text-white font-mono">{local.billing_day} de cada mes</span>
            </div>
          </div>

          <button
            onClick={handleDownloadReceipt}
            className="w-full py-3 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold apple-smooth flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            <Download className="w-4 h-4" />
            Descargar mi recibo digital (.png)
          </button>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              onClick={() => onPatchLocal({ plan_type: 'hibernacion' })}
              className="py-3 px-4 rounded-2xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.1] text-slate-200 text-[11px] font-bold apple-smooth flex items-center justify-center gap-2"
            >
              <PauseCircle className="w-4 h-4 text-amber-400" />
              Modo Hibernación (9 €/mes + IVA)
            </button>
            <a
              href={`https://wa.me/${FLUXO_WA}?text=${encodeURIComponent(
                `Hola Emiliano, quiero comunicar la BAJA en 1 clic de ${local.nombre} (Fluxo).`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="py-3 px-4 rounded-2xl bg-red-500/[0.1] hover:bg-red-500/[0.18] border border-red-500/30 text-red-300 text-[11px] font-bold apple-smooth flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Baja en 1 clic
            </a>
          </div>

          <p className="text-[9px] text-slate-500 leading-snug">
            Los recibos digitales son generados en Canvas 2D nativo y jamás incluyen credenciales
            de acceso ni PINs.
          </p>
        </div>
      )}

      {/* ---------------------------------------------------- Pestaña Fidelización */}
      {tab === 'fidelizacion' && (
        <div className="relative p-5 rounded-2xl bg-white/[0.05] border border-white/[0.09] overflow-hidden min-h-[220px]">
          <div className="space-y-3 pointer-events-none select-none opacity-60">
            {[
              { nombre: 'Marta R. · Mesa 4', sellos: 7 },
              { nombre: 'Cliente iPhone · Lunes 21:40', sellos: 3 },
              { nombre: 'Grupo lonja · 5 comensales', sellos: 9 },
            ].map((c) => (
              <div key={c.nombre} className="p-3 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-between">
                <p className="text-[11px] font-semibold text-white">{c.nombre}</p>
                <span className="text-[10px] text-amber-300 font-bold">{c.sellos} sellos</span>
              </div>
            ))}
          </div>

          {!esFull && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center"
              style={{
                background:
                  'linear-gradient(135deg, rgba(11, 17, 32, 0.82) 0%, rgba(15, 23, 42, 0.9) 100%)',
                backdropFilter: 'blur(14px)',
                WebkitBackdropFilter: 'blur(14px)',
              }}
            >
              <div className="w-14 h-14 rounded-2xl bg-white/[0.08] border border-white/[0.15] flex items-center justify-center mb-4 apple-glass-reflection">
                <Lock className="w-6 h-6 text-white/80" />
              </div>
              <p className="text-sm font-black text-white">CRM & Fidelización exclusivo del Plan Full</p>
              <p className="text-[11px] text-slate-400 mt-1.5 max-w-xs leading-snug">
                Clientes fidelizados, sellos automáticos y análisis de recurrencia. Solicita tu
                mejora y lo desbloqueamos en el día.
              </p>
              <a
                href={upgradeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white text-[11px] font-bold apple-smooth flex items-center gap-2 shadow-lg shadow-indigo-600/25"
              >
                <MessagesSquare className="w-4 h-4" />
                Solicitar mejora de plan por WhatsApp
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function AmberBannerIcon() {
  return (
    <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/35 flex items-center justify-center flex-shrink-0">
      <CreditCard className="w-4 h-4 text-amber-300" />
    </div>
  )
}
