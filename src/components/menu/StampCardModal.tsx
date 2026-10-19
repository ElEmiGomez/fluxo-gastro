'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import {
  X,
  Gift,
  Award,
  Sparkles,
  Check,
  ArrowRight,
  LogOut,
  Coffee,
  CakeSlice,
  CheckCircle2,
  Lock,
  ChevronRight,
  Loader2,
  Calendar,
} from 'lucide-react'
import { LoyaltyProfile, LoyaltySettings } from '@/types/loyalty.types'
import { Product } from '@/types/database.types'
import { formatCurrency } from '@/lib/utils'
import { triggerHaptic, HAPTIC_PATTERNS } from '@/lib/haptic'

interface StampCardModalProps {
  isOpen: boolean
  onClose: () => void
  profile: LoyaltyProfile | null
  settings: LoyaltySettings | null
  availableRewardItems: Product[]
  isLoading: boolean
  onLoginOrRegister: (name: string, email: string, phone?: string) => Promise<any>
  onLogout: () => void
  onRedeemReward: (product: Product) => Promise<void>
}

export function StampCardModal({
  isOpen,
  onClose,
  profile,
  settings,
  availableRewardItems = [],
  isLoading,
  onLoginOrRegister,
  onLogout,
  onRedeemReward,
}: StampCardModalProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [isSelectingReward, setIsSelectingReward] = useState(false)
  const [redeemingId, setRedeemingId] = useState<string | null>(null)
  const [redeemedToast, setRedeemedToast] = useState<string | null>(null)

  if (!isOpen) return null

  const targetStamps = settings?.target_stamps || profile?.stamps_target || 5
  const currentStamps = profile?.stamps_count ?? 0
  const unlockedRewards = profile?.unlocked_rewards_count ?? 0
  const minSpend = settings?.min_spend_per_stamp || 50
  const rewardLabel = settings?.reward_label || 'Postre o Café gratis'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!name.trim()) {
      setFormError('Por favor introduce tu nombre.')
      return
    }

    if (!email.trim() || !email.includes('@')) {
      setFormError('Introduce un correo electrónico válido.')
      return
    }

    try {
      setSubmitting(true)
      await onLoginOrRegister(name.trim(), email.trim(), phone.trim() || undefined)
    } catch (err: any) {
      setFormError(err.message || 'Error al conectar cartilla')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSelectRewardItem = async (product: Product) => {
    if (redeemingId) return
    setRedeemingId(product.id)
    triggerHaptic(HAPTIC_PATTERNS.SUCCESS)

    try {
      await onRedeemReward(product)
      setRedeemedToast(`¡${product.name} marchando gratis a tu mesa!`)
      setTimeout(() => {
        setRedeemedToast(null)
        setRedeemingId(null)
        setIsSelectingReward(false)
      }, 1600)
    } catch (err: any) {
      setFormError(err.message || 'Error al canjear el premio')
      setRedeemingId(null)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/65 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Cabecera del Modal */}
        <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 px-5 py-4 text-white flex items-center justify-between shadow-xs flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-inner">
              <Gift className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight leading-tight flex items-center gap-1.5">
                <span>Cartilla de Premios</span>
                <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-[10px] font-black uppercase tracking-wider">
                  Visitas
                </span>
              </h2>
              <p className="text-xs text-amber-100 font-medium">
                Completa tus sellos y gana {rewardLabel.toLowerCase()}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Cerrar ventana"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Notificación de canje exitoso */}
        {redeemedToast && (
          <div className="bg-emerald-600 text-white px-4 py-2.5 text-xs font-bold flex items-center justify-between animate-in slide-in-from-top-2 flex-shrink-0">
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4" />
              {redeemedToast}
            </span>
          </div>
        )}

        {/* Contenido scrolleable */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 scrollbar-thin flex-1">
          {!profile ? (
            /* Vista de Registro / Identificación Zero-Fricción */
            <div className="space-y-4">
              <div className="bg-amber-50/90 rounded-2xl p-4 border border-amber-200/80 text-slate-800">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Sparkles className="w-5 h-5 text-amber-700" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-sm text-amber-950">
                      Activa tu Cartilla Digital de Sellos
                    </h3>
                    <p className="text-xs text-amber-900/90 leading-relaxed">
                      Suma 1 sello cada vez que tu mesa pague una cuenta de <strong>{minSpend} €</strong> o más.
                      Al llegar a <strong>{targetStamps} visitas</strong>, recibirás un <strong>{rewardLabel}</strong> en tu siguiente visita.
                    </p>
                  </div>
                </div>
              </div>

              {formError && (
                <div className="p-3 bg-red-50 text-red-700 text-xs font-bold rounded-xl border border-red-200">
                  {formError}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3.5 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tu Nombre Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej. Martín Gómez"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Correo Electrónico *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@email.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Se recordará en tu móvil para que nunca tengas que volver a escribirlo.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Teléfono Móvil (Opcional)</span>
                    <span className="text-[10px] text-slate-400 font-normal">Para avisos de premios</span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+34 600 000 000"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 px-4 rounded-xl font-black text-sm bg-amber-600 hover:bg-amber-700 active:scale-[0.98] text-white shadow-md shadow-amber-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 mt-2"
                >
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> Conectando...
                    </span>
                  ) : (
                    <>
                      <span>Abrir mi Cartilla de Sellos</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          ) : isSelectingReward ? (
            /* Vista de Selección de Plato Premiado (Canje 0,00 €) */
            <div className="space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSelectingReward(false)}
                  className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1 cursor-pointer"
                >
                  &larr; Volver a mi cartilla
                </button>
                <span className="text-[11px] font-black uppercase text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  {unlockedRewards} premio(s) disponible(s)
                </span>
              </div>

              <div className="bg-emerald-50/80 p-3.5 rounded-2xl border border-emerald-200 text-emerald-950 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed">
                  <p className="font-extrabold text-emerald-900">Selecciona tu regalo gratis:</p>
                  <p className="text-emerald-800 text-[11px]">
                    Toca cualquier opción y se enviará directamente a tu mesa sin coste (0,00 €).
                  </p>
                </div>
              </div>

              {availableRewardItems.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500 font-medium">
                  No hay cafés ni postres disponibles para canjear en este momento.
                </div>
              ) : (
                <div className="space-y-2 pt-1 divide-y divide-slate-100">
                  {availableRewardItems.map((prod) => (
                    <button
                      key={prod.id}
                      type="button"
                      disabled={Boolean(redeemingId)}
                      onClick={() => handleSelectRewardItem(prod)}
                      className="w-full text-left pt-2 pb-2 px-2.5 rounded-2xl hover:bg-amber-50/60 active:scale-[0.99] transition-all flex items-center gap-3 cursor-pointer group disabled:opacity-50"
                    >
                      <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-200">
                        {prod.image_url ? (
                          <Image
                            src={prod.image_url}
                            alt={prod.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform"
                            sizes="48px"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400">
                            {prod.name.toLowerCase().includes('caf') ? (
                              <Coffee className="w-5 h-5 text-amber-700" />
                            ) : (
                              <CakeSlice className="w-5 h-5 text-amber-600" />
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-black text-slate-900 truncate group-hover:text-amber-800 transition-colors">
                          {prod.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] line-through text-slate-400 font-medium">
                            {formatCurrency(prod.price)}
                          </span>
                          <span className="text-xs font-black text-emerald-600">
                            0,00 € GRATIS
                          </span>
                        </div>
                      </div>

                      <div className="flex-shrink-0">
                        {redeemingId === prod.id ? (
                          <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                        ) : (
                          <span className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-xs transition-colors">
                            Pedir
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Vista Principal de la Cartilla de Sellos */
            <div className="space-y-4">
              {/* Saludo y Botón Salir */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-500 font-medium">Comensal fidelizado</span>
                  <h3 className="text-sm font-extrabold text-slate-900">{profile.name}</h3>
                  <span className="text-[11px] text-slate-400">{profile.email}</span>
                </div>
                <button
                  type="button"
                  onClick={onLogout}
                  className="text-xs font-bold text-slate-400 hover:text-slate-600 flex items-center gap-1 transition-colors px-2.5 py-1 rounded-lg hover:bg-slate-100 cursor-pointer"
                  title="Cambiar de cuenta"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Salir</span>
                </button>
              </div>

              {/* Banner de Premio Desbloqueado para Canjear en Esta Visita */}
              {unlockedRewards > 0 && (
                <div className="bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 p-4 rounded-3xl text-white shadow-lg border border-emerald-400/40 relative overflow-hidden animate-in zoom-in-95">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-black text-lg shadow-inner flex-shrink-0">
                      🎁
                    </div>
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-black uppercase tracking-wider bg-white/25 px-2 py-0.5 rounded-full">
                          ¡Premio Desbloqueado!
                        </span>
                      </div>
                      <h4 className="text-sm font-black leading-tight">
                        Tienes {unlockedRewards} {rewardLabel.toLowerCase()} listo para pedir
                      </h4>
                      <p className="text-[11px] text-emerald-100 leading-snug">
                        ¡Completaste tu cartilla! Toca el botón para elegir tu regalo y marcharlo a la mesa a coste 0,00 €.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsSelectingReward(true)}
                    className="w-full mt-3.5 py-2.5 px-4 rounded-xl bg-white text-emerald-800 hover:bg-emerald-50 font-black text-xs shadow-md flex items-center justify-center gap-2 transition-transform active:scale-[0.98] cursor-pointer"
                  >
                    <span>🎁 Elegir mi {rewardLabel}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* TARJETA VISUAL: CARTILLA DE SELLOS FÍSICA / DIGITAL */}
              <div className="bg-gradient-to-br from-amber-50/90 via-orange-50/50 to-amber-100/60 rounded-3xl p-5 border-2 border-amber-300/80 shadow-md relative overflow-hidden">
                {/* Cabecera de la Cartilla */}
                <div className="flex items-center justify-between pb-3.5 border-b border-amber-200/80">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center font-black text-xs shadow-xs">
                      ★
                    </div>
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-amber-950">
                        Tarjeta de {targetStamps} Visitas
                      </h4>
                      <span className="text-[10px] text-amber-800/80 font-medium">
                        Consumo mín. {minSpend} € por cuenta
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-black px-2.5 py-1 rounded-full bg-amber-500 text-white shadow-xs">
                    {currentStamps} / {targetStamps}
                  </span>
                </div>

                {/* CASILLAS DE SELLOS */}
                <div className="grid grid-cols-5 gap-2.5 sm:gap-3 py-5">
                  {Array.from({ length: targetStamps }).map((_, idx) => {
                    const isStamped = idx < currentStamps
                    const isLast = idx === targetStamps - 1

                    return (
                      <div
                        key={idx}
                        className={`relative aspect-square rounded-2xl flex flex-col items-center justify-center transition-all ${
                          isStamped
                            ? 'bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-md border-2 border-amber-400 rotate-[-3deg]'
                            : isLast
                            ? 'bg-amber-100/70 border-2 border-dashed border-amber-400 text-amber-800'
                            : 'bg-white/90 border-2 border-dashed border-amber-300/80 text-amber-800/60'
                        }`}
                      >
                        {isStamped ? (
                          <div className="flex flex-col items-center justify-center animate-in zoom-in-75">
                            <span className="text-base sm:text-lg">⭐</span>
                            <span className="text-[9px] font-black uppercase tracking-tighter mt-0.5">
                              Sellado
                            </span>
                          </div>
                        ) : isLast ? (
                          <div className="flex flex-col items-center justify-center text-center p-1">
                            <span className="text-base sm:text-lg">🎁</span>
                            <span className="text-[8px] font-black uppercase tracking-tighter text-amber-900 mt-0.5">
                              Premio
                            </span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center">
                            <span className="text-xs sm:text-sm font-black text-amber-700/60">
                              #{idx + 1}
                            </span>
                            <span className="text-[8px] text-amber-600/50 font-medium">
                              Sello
                            </span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Barra de progreso */}
                <div className="space-y-1.5 pt-1 border-t border-amber-200/80">
                  <div className="flex justify-between text-[11px] font-bold text-amber-950">
                    <span>
                      {currentStamps >= targetStamps
                        ? '¡Cartilla completada!'
                        : `Te faltan ${targetStamps - currentStamps} visita(s) para tu premio`}
                    </span>
                    <span>{Math.round((currentStamps / targetStamps) * 100)}%</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-amber-200/60 overflow-hidden shadow-inner">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (currentStamps / targetStamps) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Explicación de Funcionamiento */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-700 space-y-1.5 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-slate-900">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>¿Cómo funciona tu cartilla?</span>
                </div>
                <ul className="text-[11px] text-slate-600 space-y-1 pl-4 list-disc leading-relaxed">
                  <li>Cada vez que pagues una cuenta superior a <strong>{minSpend} €</strong>, sumas 1 sello.</li>
                  <li>Al completar los <strong>{targetStamps} sellos</strong>, tu regalo se activará automáticamente a partir de tu <strong>siguiente visita</strong>.</li>
                  <li>El premio es válido para canjear en mesa por <strong>{rewardLabel}</strong>.</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
