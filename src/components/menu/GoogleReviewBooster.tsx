'use client'

import React, { useState, useEffect } from 'react'
import { Star, Sparkles, X, ExternalLink, HeartHandshake, Award } from 'lucide-react'
import { triggerHaptic, HAPTIC_PATTERNS } from '@/lib/haptic'
import { LoyaltyProfile } from '@/types/loyalty.types'

interface GoogleReviewBoosterProps {
  restaurantName: string
  restaurantSlug: string
  googleReviewUrl?: string | null
  googlePlaceId?: string | null
  variant?: 'inline' | 'card' | 'compact'
  onReviewOpened?: () => void
  onDismiss?: () => void
  loyaltyProfile?: LoyaltyProfile | null
  onClaimLoyaltyBonus?: () => void
  loyaltyMode?: 'points' | 'stamps'
}

export function GoogleReviewBooster({
  restaurantName,
  restaurantSlug,
  googleReviewUrl,
  googlePlaceId,
  variant = 'card',
  onReviewOpened,
  onDismiss,
  loyaltyProfile,
  onClaimLoyaltyBonus,
  loyaltyMode = 'points',
}: GoogleReviewBoosterProps) {
  const storageKey = `fluxo_review_dismissed_${restaurantSlug}`
  const [isDismissed, setIsDismissed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem(storageKey) === 'true'
    }
    return false
  })
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const dismissed = sessionStorage.getItem(storageKey) === 'true'
      setIsDismissed(dismissed)
    }
  }, [storageKey])

  const [selectedRating, setSelectedRating] = useState<number | null>(null)
  const [feedbackSent, setFeedbackSent] = useState(false)

  const directReviewLink =
    googleReviewUrl ||
    (googlePlaceId
      ? `https://search.google.com/local/writereview?placeid=${googlePlaceId}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurantName)}`)

  const handleDismiss = () => {
    setIsDismissed(true)
    onDismiss?.()
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem(storageKey, 'true')
      } catch {
        // ignore
      }
    }
  }

  const handleSelectStar = async (stars: number) => {
    setSelectedRating(stars)
    triggerHaptic(HAPTIC_PATTERNS.TAP)

    if (stars < 4) {
      setFeedbackSent(true)
      setTimeout(() => {
        handleDismiss()
      }, 3000)
    }
  }

  if (isDismissed) return null

  if (feedbackSent) {
    return (
      <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in">
        <HeartHandshake className="w-5 h-5 text-amber-600 flex-shrink-0" />
        <span>¡Gracias por tu valoración! Ayudas a nuestro equipo de sala y cocina a mejorar día a día.</span>
      </div>
    )
  }

  if (variant === 'compact') {
    return (
      <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-300/50 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Sparkles className="w-4 h-4 text-amber-500 flex-shrink-0" />
          <span className="text-xs font-bold text-slate-800 truncate">
            ¿Qué tal la experiencia en {restaurantName}?
          </span>
        </div>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => handleSelectStar(star)}
              className="p-1 hover:scale-125 transition-transform"
              title={`${star} estrellas`}
            >
              <Star
                size={18}
                className={`transition-colors ${
                  (selectedRating ?? 0) >= star
                    ? 'text-amber-400 fill-amber-400'
                    : 'text-slate-300 hover:text-amber-400 hover:fill-amber-400'
                }`}
              />
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="relative overflow-hidden rounded-3xl bg-white border border-amber-200 shadow-md p-4 space-y-3 animate-in fade-in zoom-in-95">
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        title="Cerrar"
      >
        <X size={14} />
      </button>

      <div className="flex items-center gap-2.5 pr-6">
        <div className="w-9 h-9 rounded-2xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0 font-black shadow-xs">
          <Star className="w-5 h-5 fill-white text-white" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-700">
              Google Maps
            </span>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-100 text-amber-800">
              +1 Toque
            </span>
          </div>
          <h4 className="text-xs font-extrabold text-slate-900 leading-tight">
            ¿Disfrutaste tu comida en {restaurantName}?
          </h4>
        </div>
      </div>

      <p className="text-[11px] text-slate-600 leading-snug">
        Una reseña de <strong>5 estrellas</strong> apoya directamente a nuestros camareros y cocineros en Google Maps.
      </p>

      {!loyaltyProfile?.google_review_bonus_awarded && (
        <div className="p-2.5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-amber-500/5 border border-amber-300 text-amber-950 flex items-center gap-2 shadow-2xs">
          <Award className="w-4 h-4 text-amber-700 flex-shrink-0" />
          <span className="text-[11px] font-black leading-tight">
            {loyaltyMode === 'stamps'
              ? '⭐ ¡Gana +1 SELLO EXTRA al instante en tu cartilla al valorar el servicio!'
              : '⭐ ¡Gana +50 PUNTOS EXTRA al instante en tu tarjeta al valorar el servicio!'}
          </span>
        </div>
      )}

      {loyaltyProfile?.google_review_bonus_awarded && (
        <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
          <span>
            {loyaltyMode === 'stamps'
              ? 'Bonus de +1 sello en tu cartilla concedido con éxito.'
              : 'Bonus de +50 puntos de fidelización concedido con éxito.'}
          </span>
        </div>
      )}

      <div className="flex items-center justify-center gap-2 py-1 bg-amber-50/60 rounded-2xl border border-amber-100">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => handleSelectStar(star)}
            className="p-2 transition-transform active:scale-90 hover:scale-125 focus:outline-none"
            aria-label={`${star} estrellas`}
          >
            <Star
              size={26}
              className={`transition-colors ${
                (selectedRating ?? 0) >= star
                  ? 'text-amber-400 fill-amber-400 drop-shadow-xs'
                  : 'text-amber-300/60 hover:text-amber-500 hover:fill-amber-500'
              }`}
            />
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5 px-1">
        <span>Toca las estrellas para calificar</span>
        <a
          href={directReviewLink}
          target="_blank"
          rel="noopener noreferrer"
          onClick={async () => {
            if (typeof window !== 'undefined') {
              sessionStorage.setItem('fluxo_pending_google_review_bonus', 'true')
            }

            if (onClaimLoyaltyBonus && !loyaltyProfile?.google_review_bonus_awarded) {
              try {
                await onClaimLoyaltyBonus()
              } catch (e) {
                console.warn('[GoogleReviewBooster] Error reclamando bonus:', e)
              }
            }
            onReviewOpened?.()
            handleDismiss()
          }}
          className="text-amber-700 font-bold hover:underline flex items-center gap-1 cursor-pointer"
        >
          <span>
            {loyaltyProfile?.google_review_bonus_awarded
              ? 'Abrir Google Maps'
              : loyaltyMode === 'stamps'
              ? '⭐ Valóranos y gana +1 sello extra'
              : 'Abrir Google Maps (+50 pts)'}
          </span>
          <ExternalLink size={10} />
        </a>
      </div>
    </div>
  )
}
