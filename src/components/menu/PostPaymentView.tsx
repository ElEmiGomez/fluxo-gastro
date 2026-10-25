'use client'

import React, { useState, useEffect } from 'react'
import {
  Star,
  Sparkles,
  ExternalLink,
  Award,
  CheckCircle2,
  RotateCcw,
  HeartHandshake,
  LogOut,
} from 'lucide-react'
import { triggerHaptic, HAPTIC_PATTERNS } from '@/lib/haptic'
import { LoyaltyProfile } from '@/types/loyalty.types'
import { Restaurant } from '@/types/database.types'

interface PostPaymentViewProps {
  restaurant: Restaurant
  tableNumber: string | number
  paidTotal?: number
  loyaltyProfile?: LoyaltyProfile | null
  loyaltyMode?: 'points' | 'stamps'
  onOpenLoyaltyModal?: () => void
  onClaimLoyaltyBonus?: () => void
  onResetTableSession?: () => void
  onLogout?: () => void
}

export function PostPaymentView({
  restaurant,
  tableNumber,
  paidTotal = 0,
  loyaltyProfile,
  loyaltyMode = 'points',
  onOpenLoyaltyModal,
  onClaimLoyaltyBonus,
  onResetTableSession,
  onLogout,
}: PostPaymentViewProps) {
  const [selectedRating, setSelectedRating] = useState<number | null>(5)
  const [feedbackSent, setFeedbackSent] = useState<boolean>(false)
  const [hasClickedGoogleMapsReview, setHasClickedGoogleMapsReview] = useState<boolean>(false)
  const [storedPoints, setStoredPoints] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = sessionStorage.getItem(`fluxo_paid_order_${restaurant.slug}_${tableNumber}`)
        if (stored) {
          const parsed = JSON.parse(stored)
          if (parsed.points) return Number(parsed.points)
        }
      } catch {}
    }
    return paidTotal > 0 ? Math.round(paidTotal * 10) : 50
  })

  useEffect(() => {
    if (paidTotal > 0) {
      setStoredPoints(Math.round(paidTotal * 10))
    }
  }, [paidTotal])

  const directReviewLink =
    restaurant.google_review_url ||
    (restaurant.google_place_id
      ? `https://search.google.com/local/writereview?placeid=${restaurant.google_place_id}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((restaurant.name || 'Burger Gourmet') + ' Noia')}`)

  const handleSelectStar = (star: number) => {
    setSelectedRating(star)
    triggerHaptic(HAPTIC_PATTERNS.TAP)

    if (star >= 4) {
      setFeedbackSent(false)
    } else {
      setFeedbackSent(true)
    }
  }

  const handleOpenGoogleMaps = async () => {
    triggerHaptic(HAPTIC_PATTERNS.SUCCESS)
    if ((selectedRating ?? 5) < 4) {
      setSelectedRating(5)
    }
    setFeedbackSent(false)
    setHasClickedGoogleMapsReview(true)

    if (typeof window !== 'undefined') {
      sessionStorage.setItem('fluxo_pending_google_review_bonus', 'true')
    }

    if (onClaimLoyaltyBonus && !loyaltyProfile?.google_review_bonus_awarded) {
      try {
        await onClaimLoyaltyBonus()
      } catch {}
    }
    window.open(directReviewLink, '_blank', 'noopener,noreferrer')
  }

  const isPointsSaved = Boolean(loyaltyProfile?.email || loyaltyProfile?.phone || loyaltyProfile?.id)
  const effectiveLoyaltyMode = loyaltyMode === 'stamps' || loyaltyProfile?.stamps_target || (loyaltyProfile?.stamps_count !== undefined && loyaltyProfile.stamps_count > 0)
    ? 'stamps'
    : loyaltyMode
  const orderStamp = paidTotal > 0 ? 1 : 0
  const reviewStamp = hasClickedGoogleMapsReview && loyaltyProfile?.google_review_bonus_awarded ? 1 : 0
  const stampsCount = Math.max(loyaltyProfile?.stamps_count ?? 0, orderStamp + reviewStamp)

  return (
    <div className="w-full animate-in fade-in duration-300 space-y-3 pb-6 select-none">
      {/* BLOQUE 1: Agradecimiento por la visita y Club de Premios / Cartilla (Estética de tarjeta blanca y esmeralda) */}
      <div className="overflow-hidden rounded-3xl bg-white border border-emerald-200 shadow-md p-4 sm:p-5 space-y-3">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 font-black shadow-sm">
            <Award className="w-6 h-6 text-white stroke-[2.2]" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700">
                MESA #{tableNumber} &middot; PAGO CONFIRMADO
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            </div>
            <h3 className="text-sm sm:text-base font-black text-slate-900 leading-tight mt-0.5">
              ✅ ¡Cuenta pagada! Muchas gracias por tu visita
            </h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              {effectiveLoyaltyMode === 'stamps'
                ? '¡Sumaste +1 sello con tu comanda! Completa tu cartilla digital para canjear invitaciones y recompensas.'
                : `¡Sumaste +${storedPoints} puntos con tu comanda! Acumula puntos en cada visita y canjéalos por premios exclusivos.`}
            </p>
          </div>
        </div>

        {isPointsSaved ? (
          <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center justify-between gap-2 mt-1">
            <div className="flex items-center gap-2 min-w-0">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <div className="min-w-0">
                <span className="truncate block">
                  {effectiveLoyaltyMode === 'stamps'
                    ? `✓ Sellos guardados en tu cartilla (${stampsCount} ${stampsCount === 1 ? 'sello acumulado' : 'sellos acumulados'})`
                    : `✓ Puntos guardados en tu cuenta (${loyaltyProfile?.available_points ?? storedPoints} pts acumulados)`}
                </span>
                <span className="text-[10px] text-emerald-700/80 font-semibold truncate block">
                  {loyaltyProfile?.name ? `${loyaltyProfile.name} · ${loyaltyProfile.email || loyaltyProfile.phone}` : (loyaltyProfile?.email || loyaltyProfile?.phone)}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {onOpenLoyaltyModal && (
                <button
                  type="button"
                  onClick={onOpenLoyaltyModal}
                  className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black cursor-pointer transition-colors shadow-xs"
                >
                  {effectiveLoyaltyMode === 'stamps' ? 'Ver Cartilla' : 'Ver Premios'}
                </button>
              )}
              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  title="Cerrar sesión en esta mesa"
                  className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-red-50 text-red-600 border border-red-200 hover:border-red-300 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                >
                  <LogOut className="w-3 h-3 text-red-500" />
                  <span>Cerrar sesión</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={onOpenLoyaltyModal}
            className="w-full py-3 px-4 rounded-2xl bg-emerald-700 hover:bg-emerald-600 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md shadow-emerald-700/20 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-emerald-300" />
            <span>
              {effectiveLoyaltyMode === 'stamps'
                ? '🎁 Unirme a la Cartilla de Sellos / Guardar mis sellos'
                : '🎁 Unirme al Club de Premios / Guardar mis puntos'}
            </span>
          </button>
        )}
      </div>

      {/* BLOQUE 2: Valoración en Google Maps con 5 Estrellas (Independiente y separado) */}
      <div className="overflow-hidden rounded-3xl bg-white border border-amber-200 shadow-md p-4 sm:p-5 space-y-3.5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0 font-black shadow-sm">
            <Star className="w-5 h-5 fill-white text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-700">
                Google Maps
              </span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-amber-100 text-amber-800">
                {hasClickedGoogleMapsReview || loyaltyProfile?.google_review_bonus_awarded
                  ? 'Reseña 5★'
                  : effectiveLoyaltyMode === 'stamps'
                  ? '+1 Sello Extra'
                  : '+50 Puntos'}
              </span>
            </div>
            <h4 className="text-sm font-extrabold text-slate-900 leading-tight">
              ¿Qué tal estuvo tu experiencia hoy?
            </h4>
          </div>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          {hasClickedGoogleMapsReview || loyaltyProfile?.google_review_bonus_awarded
            ? 'Tu valoración de 5 estrellas en Google Maps nos ayuda muchísimo y apoya directamente a nuestro equipo de sala y cocina.'
            : `Tu valoración de 5 estrellas en Google Maps nos ayuda muchísimo y te regala ${
                effectiveLoyaltyMode === 'stamps'
                  ? '+1 sello extra en tu cartilla digital'
                  : '+50 puntos extra para canjear platos gratis'
              }.`}
        </p>

        {/* Estrellas Interactivas */}
        <div className="flex items-center justify-center gap-2 py-2 bg-amber-50/70 rounded-2xl border border-amber-100">
          {[1, 2, 3, 4, 5].map(star => (
            <button
              key={star}
              type="button"
              onClick={() => handleSelectStar(star)}
              className="p-1.5 transition-transform active:scale-90 hover:scale-125 focus:outline-none cursor-pointer"
              aria-label={`${star} estrellas`}
            >
              <Star
                size={28}
                className={`transition-colors ${
                  (selectedRating ?? 0) >= star
                    ? 'text-amber-400 fill-amber-400 drop-shadow-xs'
                    : 'text-amber-200 hover:text-amber-400 hover:fill-amber-400'
                }`}
              />
            </button>
          ))}
        </div>

        {hasClickedGoogleMapsReview ? (
          <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-extrabold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>
              {effectiveLoyaltyMode === 'stamps'
                ? '¡Gracias por tus 5 estrellas! Sumaste +1 sello extra a tu cartilla.'
                : '¡Gracias por tus 5 estrellas! Sumaste +50 puntos extra.'}
            </span>
          </div>
        ) : feedbackSent ? (
          <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <HeartHandshake className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>¡Gracias por tus comentarios! Nos esforzamos en darte siempre el mejor servicio.</span>
          </div>
        ) : null}

        {/* Botón de Google Maps */}
        <button
          type="button"
          onClick={handleOpenGoogleMaps}
          className="w-full py-3 px-4 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md shadow-amber-400/20 cursor-pointer"
        >
          <Star className="w-4 h-4 fill-slate-950 text-slate-950" />
          <span>
            {hasClickedGoogleMapsReview || loyaltyProfile?.google_review_bonus_awarded
              ? '⭐ Valorar con 5 estrellas en Google Maps'
              : effectiveLoyaltyMode === 'stamps'
              ? '⭐ Valóranos y gana +1 sello extra'
              : '⭐ Valóranos en Google (+50 pts)'}
          </span>
          <ExternalLink className="w-3.5 h-3.5 text-slate-800" />
        </button>
      </div>

      {/* Pie de Pantalla Discreto: Desconectar cuenta y/o Iniciar un nuevo pedido */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
        {onLogout && isPointsSaved && (
          <button
            type="button"
            onClick={onLogout}
            className="text-[11px] font-bold text-slate-400 hover:text-red-600 hover:underline transition-colors cursor-pointer inline-flex items-center gap-1.5"
          >
            <LogOut className="w-3 h-3" />
            <span>Desconectar cuenta de {loyaltyProfile?.name || 'cliente'} de esta mesa</span>
          </button>
        )}
        {onResetTableSession && (
          <button
            type="button"
            onClick={onResetTableSession}
            className="text-[11px] font-bold text-slate-400 hover:text-slate-600 hover:underline transition-colors cursor-pointer inline-flex items-center gap-1.5"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Iniciar un nuevo pedido en esta mesa</span>
          </button>
        )}
      </div>
    </div>
  )
}
