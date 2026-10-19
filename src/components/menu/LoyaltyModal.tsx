'use client'

import React, { useState } from 'react'
import { X, Award, Gift, Sparkles, Check, ArrowRight, Lock, Clock, LogOut, AlertCircle, Star, ExternalLink } from 'lucide-react'
import { LoyaltyProfile, LoyaltyReward } from '@/types/loyalty.types'
import { triggerHaptic, HAPTIC_PATTERNS } from '@/lib/haptic'

interface LoyaltyModalProps {
  isOpen: boolean
  onClose: () => void
  profile: LoyaltyProfile | null
  rewards: LoyaltyReward[]
  isLoading: boolean
  onLoginOrRegister: (name: string, email: string, phone?: string) => Promise<any>
  onLogout: () => void
  onRedeemReward: (reward: LoyaltyReward) => void
  restaurantName?: string
  restaurantSlug?: string
  googleReviewUrl?: string | null
  googlePlaceId?: string | null
  onClaimLoyaltyBonus?: () => Promise<any> | void
}

export function LoyaltyModal({
  isOpen,
  onClose,
  profile,
  rewards,
  isLoading,
  onLoginOrRegister,
  onLogout,
  onRedeemReward,
  restaurantName,
  restaurantSlug,
  googleReviewUrl,
  googlePlaceId,
  onClaimLoyaltyBonus,
}: LoyaltyModalProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [redeemedToast, setRedeemedToast] = useState<string | null>(null)

  if (!isOpen) return null

  const directReviewLink =
    googleReviewUrl ||
    (googlePlaceId
      ? `https://search.google.com/local/writereview?placeid=${googlePlaceId}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurantName || 'Restaurante')}`)

  const handleOpenGoogleReview = async () => {
    triggerHaptic(HAPTIC_PATTERNS.SUCCESS)
    if (onClaimLoyaltyBonus && !profile?.google_review_bonus_awarded) {
      try {
        await onClaimLoyaltyBonus()
      } catch (e) {
        console.warn('[LoyaltyModal] Error reclamando bonus:', e)
      }
    } else if (!profile) {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('fluxo_pending_google_review_bonus', 'true')
        localStorage.setItem('fluxo_pending_google_review_bonus', 'true')
      }
    }
    window.open(directReviewLink, '_blank', 'noopener,noreferrer')
  }

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
      setFormError(err.message || 'Error al conectar perfil')
    } finally {
      setSubmitting(false)
    }
  }

  const handleRedeem = (reward: LoyaltyReward) => {
    onRedeemReward(reward)
    setRedeemedToast(`¡${reward.product?.name || 'Plato'} canjeado y añadido a tu comanda!`)
    setTimeout(() => {
      setRedeemedToast(null)
    }, 3000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Cabecera del Modal */}
        <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 px-5 py-4 text-white flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-inner">
              <Award className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight leading-tight">
                Tarjeta de Fidelización
              </h2>
              <p className="text-xs text-amber-100 font-medium">
                Puntos, regalos y ventajas exclusivas
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
          <div className="bg-emerald-600 text-white px-4 py-2.5 text-xs font-bold flex items-center justify-between animate-in slide-in-from-top-2">
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4" />
              {redeemedToast}
            </span>
          </div>
        )}

        {/* Contenido scrolleable */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-5 scrollbar-thin">
          {!profile ? (
            /* Vista de Registro / Identificación Zero-Fricción */
            <div className="space-y-4">
              <div className="bg-amber-50/80 rounded-2xl p-4 border border-amber-200/70 text-slate-800">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Sparkles className="w-4 h-4 text-amber-700" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-amber-950">
                      Suma 1 punto por cada euro consumido
                    </h3>
                    <p className="text-xs text-amber-900/80 mt-1 leading-relaxed">
                      Sin contraseñas. Solo introduce tu nombre y email para consultar tu saldo y canjear platos o cafés gratis.
                    </p>
                  </div>
                </div>
              </div>

              {/* Opción de Ganar +50 Puntos con Google Maps */}
              <div className="bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/5 p-4 rounded-2xl border-2 border-amber-300 shadow-xs space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black text-sm shadow-xs flex-shrink-0">
                    <Star className="w-4 h-4 fill-white" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-800">
                      Bonus de Bienvenida
                    </span>
                    <h4 className="text-xs font-black text-slate-900 leading-tight">
                      ⭐ ¡Consigue +50 PUNTOS GRATIS con Google Maps!
                    </h4>
                  </div>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Valora el restaurante en Google Maps y suma 50 puntos al instante al consultar y activar tu cuenta digital.
                </p>
                <button
                  type="button"
                  onClick={handleOpenGoogleReview}
                  className="w-full py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
                >
                  <Star className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
                  <span>Valorar en Google Maps (+50 pts)</span>
                  <ExternalLink className="w-3 h-3 ml-0.5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3.5">
                {formError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nombre o Apodo <span className="text-amber-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej. Carlos Gómez"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Correo Electrónico <span className="text-amber-600">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="carlos@ejemplo.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Teléfono Móvil (Opcional)
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
                  className="w-full py-3 px-4 rounded-xl font-black text-sm bg-amber-600 hover:bg-amber-700 active:scale-[0.98] text-white shadow-md shadow-amber-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <span>Conectando...</span>
                  ) : (
                    <>
                      <span>Consultar y Activar mis Puntos</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          ) : (
            /* Vista de Comensal Conectado: Dashboard de Saldos & Catálogo */
            <div className="space-y-5">
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

              {/* Panel de Saldo Inversión / Escrow */}
              <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 rounded-2xl p-4 text-white shadow-lg border border-slate-700 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

                <div className="grid grid-cols-3 gap-2 divide-x divide-slate-700/60 text-center">
                  {/* Puntos Disponibles */}
                  <div className="px-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block mb-0.5">
                      Disponibles
                    </span>
                    <span className="text-xl sm:text-2xl font-black text-amber-300">
                      {profile.available_points}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">pts canjeables</span>
                  </div>

                  {/* Puntos Retenidos / En Curso */}
                  <div className="px-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 flex items-center justify-center gap-0.5 mb-0.5">
                      <Clock className="w-2.5 h-2.5" />
                      <span>Retenidos</span>
                    </span>
                    <span className="text-xl sm:text-2xl font-black text-blue-300">
                      {profile.held_points}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">en mesa</span>
                  </div>

                  {/* Puntos Totales Acumulados */}
                  <div className="px-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                      Totales
                    </span>
                    <span className="text-xl sm:text-2xl font-black text-white">
                      {profile.total_points}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">acumulados</span>
                  </div>
                </div>

                {profile.held_points > 0 && (
                  <div className="mt-3.5 pt-3 border-t border-slate-800 text-[11px] text-slate-300 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                    <span>
                      Tienes {profile.held_points} pts comprometidos en platos de esta mesa. Se liquidarán definitivamente al abonar la cuenta.
                    </span>
                  </div>
                )}
              </div>

              {/* Bloque Google Maps para Comensal Conectado */}
              {!profile.google_review_bonus_awarded ? (
                <div className="bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/5 p-4 rounded-2xl border-2 border-amber-300 shadow-xs space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black text-sm shadow-xs flex-shrink-0">
                        <Star className="w-4 h-4 fill-white" />
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-amber-800">
                          Bonus Google Maps
                        </span>
                        <h4 className="text-xs font-black text-slate-900 leading-tight">
                          ⭐ ¡Suma +50 PUNTOS EXTRA dejando tu reseña!
                        </h4>
                      </div>
                    </div>
                    <span className="text-[10px] font-black uppercase text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300 shrink-0">
                      +50 PTS
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Valora a nuestro equipo en Google Maps y sumaremos 50 puntos adicionales a tu saldo inmediatamente.
                  </p>
                  <button
                    type="button"
                    onClick={handleOpenGoogleReview}
                    className="w-full py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
                  >
                    <Star className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
                    <span>Valorar en Google Maps (+50 pts)</span>
                    <ExternalLink className="w-3 h-3 ml-0.5" />
                  </button>
                </div>
              ) : (
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span>¡Bonus de +50 puntos por valoración en Google Maps canjeado con éxito!</span>
                </div>
              )}

              {/* Catálogo de Premios y Canjes */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Gift className="w-3.5 h-3.5 text-amber-600" />
                    <span>Platos y Premios Canjeables</span>
                  </h4>
                  <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    {rewards.length} opciones
                  </span>
                </div>

                <div className="space-y-2">
                  {rewards.map((reward) => {
                    const canAfford = profile.available_points >= reward.points_cost
                    const missingPoints = reward.points_cost - profile.available_points
                    const prodName = reward.product?.name || 'Plato de Recompensa'
                    const prodDesc = reward.product?.description || ''

                    return (
                      <div
                        key={reward.id}
                        className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                          canAfford
                            ? 'bg-white border-slate-200 hover:border-amber-300 shadow-xs'
                            : 'bg-slate-50 border-slate-200/70 opacity-80'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-1 rounded-lg text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-200/70 whitespace-nowrap shrink-0 inline-flex items-center gap-1 leading-none shadow-2xs">
                              <span>⭐</span>
                              <span>{reward.points_cost} pts</span>
                            </span>
                            <span className="text-xs font-extrabold text-slate-900 truncate">
                              {prodName}
                            </span>
                          </div>
                          {prodDesc && (
                            <p className="text-[11px] text-slate-500 truncate mt-0.5">
                              {prodDesc}
                            </p>
                          )}
                        </div>

                        <div className="flex-shrink-0">
                          {canAfford ? (
                            <button
                              type="button"
                              onClick={() => handleRedeem(reward)}
                              className="px-3 py-1.5 rounded-xl text-xs font-black bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition-all active:scale-95 cursor-pointer flex items-center gap-1 whitespace-nowrap"
                            >
                              <span>Canjear</span>
                              <Gift className="w-3 h-3" />
                            </button>
                          ) : (
                            <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-xl whitespace-nowrap shrink-0">
                              Faltan {missingPoints} pts
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Pie del modal */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
          <p className="text-[10px] text-slate-500 font-medium">
            Fluxo Gastronomic System · Programa de Fidelización Digital
          </p>
        </div>
      </div>
    </div>
  )
}
