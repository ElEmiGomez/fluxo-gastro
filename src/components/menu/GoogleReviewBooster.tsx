'use client'

import React, { useState, useEffect } from 'react'
import { Star, Sparkles, X, ExternalLink, HeartHandshake } from 'lucide-react'
import { triggerHaptic, HAPTIC_PATTERNS } from '@/lib/haptic'

interface GoogleReviewBoosterProps {
  restaurantName: string
  restaurantSlug: string
  googleReviewUrl?: string | null
  googlePlaceId?: string | null
  variant?: 'inline' | 'card' | 'compact'
  onReviewOpened?: () => void
}

export function GoogleReviewBooster({
  restaurantName,
  restaurantSlug,
  googleReviewUrl,
  googlePlaceId,
  variant = 'card',
  onReviewOpened,
}: GoogleReviewBoosterProps) {
  const [isDismissed, setIsDismissed] = useState(true)
  const [selectedRating, setSelectedRating] = useState<number | null>(null)
  const [feedbackSent, setFeedbackSent] = useState(false)

  const directReviewLink =
    googleReviewUrl ||
    (googlePlaceId
      ? `https://search.google.com/local/writereview?placeid=${googlePlaceId}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurantName)}`)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const dismissed = localStorage.getItem(`fluxo_review_dismissed_${restaurantSlug}`)
      if (!dismissed) {
        setIsDismissed(false)
      }
    }
  }, [restaurantSlug])

  const handleDismiss = () => {
    setIsDismissed(true)
    if (typeof window !== 'undefined') {
      localStorage.setItem(`fluxo_review_dismissed_${restaurantSlug}`, 'true')
    }
  }

  const handleSelectStar = (stars: number) => {
    setSelectedRating(stars)
    triggerHaptic(HAPTIC_PATTERNS.success)

    if (stars >= 4) {
      setTimeout(() => {
        onReviewOpened?.()
        window.open(directReviewLink, '_blank', 'noopener,noreferrer')
        handleDismiss()
      }, 400)
    } else {
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
          onClick={() => handleDismiss()}
          className="text-amber-700 font-bold hover:underline flex items-center gap-1"
        >
          <span>Abrir Google Maps</span>
          <ExternalLink size={10} />
        </a>
      </div>
    </div>
  )
}
