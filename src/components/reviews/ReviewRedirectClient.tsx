'use client'

import React, { useEffect, useState } from 'react'
import { Star, ExternalLink, Send, CheckCircle2, MessageSquareHeart, ShieldCheck, Loader2 } from 'lucide-react'

interface ReviewRedirectClientProps {
  slug: string
  restaurantName: string
  city: string
  logoUrl?: string
  whatsappNumber?: string
  googleReviewUrl: string
  enableGatekeeper: boolean
}

function GoogleLogoSvg({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.79-.07-1.54-.19-2.27h-11.3v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
      />
      <path
        fill="#34A853"
        d="M12.255 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96h-3.98v3.09C3.515 21.3 7.565 24 12.255 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.525 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62h-3.98a11.86 11.86 0 000 10.76l3.98-3.09z"
      />
      <path
        fill="#EA4335"
        d="M12.255 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C18.205 1.19 15.495 0 12.255 0c-4.69 0-8.74 2.7-10.71 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"
      />
    </svg>
  )
}

export function ReviewRedirectClient({
  slug,
  restaurantName,
  city,
  logoUrl,
  whatsappNumber,
  googleReviewUrl,
  enableGatekeeper,
}: ReviewRedirectClientProps) {
  const [selectedStars, setSelectedStars] = useState<number>(0)
  const [hoveredStars, setHoveredStars] = useState<number>(0)
  const [feedbackText, setFeedbackText] = useState('')
  const [feedbackContact, setFeedbackContact] = useState('')
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false)
  const [redirectingToGoogle, setRedirectingToGoogle] = useState(!enableGatekeeper)

  // Registra el toque/escaneo en analítica local sin bloquear la redirección
  useEffect(() => {
    try {
      const storageKey = `fluxo_review_taps_${slug}`
      const current = Number(localStorage.getItem(storageKey) || '0')
      localStorage.setItem(storageKey, String(current + 1))
      localStorage.setItem(`${storageKey}_last`, new Date().toISOString())
    } catch {
      // ignore storage errors in private mode
    }
  }, [slug])

  // Modo Directo (Opción 2 activa por defecto): redirige rápido a Google Reviews
  useEffect(() => {
    if (enableGatekeeper) return
    const timer = setTimeout(() => {
      window.location.href = googleReviewUrl
    }, 650)
    return () => clearTimeout(timer)
  }, [enableGatekeeper, googleReviewUrl])

  const handleStarClick = (stars: number) => {
    setSelectedStars(stars)
    if (stars >= 4) {
      setRedirectingToGoogle(true)
      setTimeout(() => {
        window.location.href = googleReviewUrl
      }, 800)
    }
  }

  const handleSubmitPrivateFeedback = (e: React.FormEvent) => {
    e.preventDefault()
    if (!feedbackText.trim()) return

    try {
      const key = `fluxo_private_feedback_${slug}`
      const existing = JSON.parse(localStorage.getItem(key) || '[]')
      existing.unshift({
        id: `${Date.now()}`,
        stars: selectedStars,
        comment: feedbackText.trim(),
        contact: feedbackContact.trim() || null,
        createdAt: new Date().toISOString(),
      })
      localStorage.setItem(key, JSON.stringify(existing.slice(0, 50)))
    } catch {
      // ignore
    }

    setFeedbackSubmitted(true)
  }

  const handleOpenWhatsAppFeedback = () => {
    if (!whatsappNumber) return
    const text = encodeURIComponent(
      `Hola equipo de ${restaurantName}, os dejo una sugerencia privada (${selectedStars}/5 estrellas): ${feedbackText.trim()}`
    )
    window.open(`https://wa.me/${whatsappNumber}?text=${text}`, '_blank', 'noopener,noreferrer')
  }

  // Pantalla de redirección directa (Opción 2 por defecto, o tras elegir 4-5 estrellas en Opción 1)
  if (redirectingToGoogle) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-5">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-200 p-7 text-center space-y-5">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={restaurantName}
              className="w-20 h-20 rounded-2xl object-cover mx-auto shadow-sm border border-slate-100"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white font-black text-2xl flex items-center justify-center mx-auto shadow-sm">
              {restaurantName.charAt(0).toUpperCase()}
            </div>
          )}

          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold">
              <GoogleLogoSvg className="w-4 h-4" />
              <span>Google Reviews</span>
            </div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">{restaurantName}</h1>
            <p className="text-sm text-slate-600">
              {selectedStars >= 4
                ? '¡Muchas gracias! Te llevamos directo a Google para publicar tu reseña.'
                : 'Abriendo la ficha oficial de Google para dejar tu reseña...'}
            </p>
          </div>

          <div className="flex items-center justify-center gap-1.5 py-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <Star key={n} className="w-7 h-7 text-amber-400 fill-amber-400" />
            ))}
          </div>

          <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-500">
            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
            <span>Redirigiendo automáticamente...</span>
          </div>

          <a
            href={googleReviewUrl}
            className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm py-3.5 px-5 transition-colors shadow-sm"
          >
            <span>Abrir Google Reviews ahora</span>
            <ExternalLink className="w-4 h-4" />
          </a>

          <p className="text-[11px] text-slate-400">
            {city} · Tarjeta inteligente de reseñas
          </p>
        </div>
      </main>
    )
  }

  // Modo Filtro Inteligente (Opción 1 - Lista para activar cuando se desee)
  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-5">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-200 p-7 space-y-6">
        <div className="text-center space-y-3">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={restaurantName}
              className="w-20 h-20 rounded-2xl object-cover mx-auto shadow-sm border border-slate-100"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white font-black text-2xl flex items-center justify-center mx-auto shadow-sm">
              {restaurantName.charAt(0).toUpperCase()}
            </div>
          )}

          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">{restaurantName}</h1>
            <p className="text-sm text-slate-600 mt-1">
              ¿Qué tal ha sido tu experiencia hoy con nosotros?
            </p>
          </div>
        </div>

        {!feedbackSubmitted ? (
          <>
            <div className="flex items-center justify-center gap-2 py-2">
              {[1, 2, 3, 4, 5].map((star) => {
                const active = (hoveredStars || selectedStars) >= star
                return (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHoveredStars(star)}
                    onMouseLeave={() => setHoveredStars(0)}
                    onClick={() => handleStarClick(star)}
                    aria-label={`Valorar con ${star} estrellas`}
                    className="p-1.5 rounded-xl transition-transform hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  >
                    <Star
                      className={`w-10 h-10 transition-colors ${
                        active ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-100'
                      }`}
                    />
                  </button>
                )
              })}
            </div>

            {selectedStars === 0 && (
              <p className="text-center text-xs text-slate-500">
                Pulsa las estrellas para valorar tu visita en 10 segundos.
              </p>
            )}

            {selectedStars > 0 && selectedStars <= 3 && (
              <form onSubmit={handleSubmitPrivateFeedback} className="space-y-4 pt-2 border-t border-slate-100">
                <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950">
                  <MessageSquareHeart className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs leading-relaxed">
                    Sentimos que tu visita no haya sido de 5 estrellas. Cuéntanos directamente qué podemos mejorar para solucionarlo hoy mismo.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Tu comentario para la dirección del local
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="Ej. Tiempo de espera, temperatura de un plato, atención en mesa..."
                    className="w-full rounded-2xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Teléfono o email (opcional, por si deseas respuesta)
                  </label>
                  <input
                    type="text"
                    value={feedbackContact}
                    onChange={(e) => setFeedbackContact(e.target.value)}
                    placeholder="Opcional"
                    className="w-full rounded-2xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <button
                    type="submit"
                    className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm py-3 px-4 transition-colors"
                  >
                    <Send className="w-4 h-4" />
                    <span>Enviar mensaje privado al dueño</span>
                  </button>

                  {whatsappNumber && (
                    <button
                      type="button"
                      onClick={handleOpenWhatsAppFeedback}
                      disabled={!feedbackText.trim()}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-50 hover:bg-emerald-100 disabled:opacity-50 text-emerald-800 border border-emerald-200 font-bold text-xs py-2.5 px-4 transition-colors"
                    >
                      <span>O enviarlo por WhatsApp directo</span>
                    </button>
                  )}
                </div>
              </form>
            )}
          </>
        ) : (
          <div className="text-center space-y-3 py-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
            <h2 className="text-lg font-black text-slate-900">¡Gracias por avisarnos!</h2>
            <p className="text-sm text-slate-600">
              Hemos enviado tu comentario de forma privada al equipo de dirección de <strong>{restaurantName}</strong> para mejorar el servicio.
            </p>
          </div>
        )}

        <div className="pt-2 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
          <span>Impulsado por Fluxo · {city}</span>
        </div>
      </div>
    </main>
  )
}
