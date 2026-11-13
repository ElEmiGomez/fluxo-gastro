'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { Calendar, Utensils, Star, MapPin, Navigation } from 'lucide-react'
import type { RestaurantArchetype, WebLanguage } from '@/types/gastronomic-web.types'

interface HeroCinematicProps {
  restaurantName: string
  archetype: RestaurantArchetype
  tagline: string
  address: string
  city: string
  posterUrl: string
  logoUrl?: string
  flankRightUrl?: string
  googleMapsUrl?: string
  accentColor?: string
  videoWebmUrl?: string
  videoMp4Url?: string
  rating?: number
  reviewCount?: number
  lang?: WebLanguage
  onOpenReservation: () => void
  onOpenMenu: () => void
}

const HERO_LABELS = {
  es: {
    opinions: 'opiniones Google',
    bookTable: 'Reservar Mesa',
    requestTable: 'Reservar / Grupos',
    viewMenu: 'Ver Carta y Precios',
    directions: 'Cómo Llegar',
    cellarBadge: 'Cerveza de Bodega · Tapa de Cortesía',
  },
  gl: {
    opinions: 'opinións Google',
    bookTable: 'Reservar Mesa',
    requestTable: 'Reservar / Grupos',
    viewMenu: 'Ver Carta e Prezos',
    directions: 'Como Chegar',
    cellarBadge: 'Cervexa de Adega · Tapa de Cortesía',
  },
  en: {
    opinions: 'Google reviews',
    bookTable: 'Book a Table',
    requestTable: 'Groups / Booking',
    viewMenu: 'View Menu & Prices',
    directions: 'Get Directions',
    cellarBadge: 'Cellar Draft Beer · Free House Tapa',
  },
}

export function HeroCinematic({
  restaurantName,
  archetype,
  tagline,
  address,
  city,
  posterUrl,
  logoUrl,
  flankRightUrl,
  googleMapsUrl,
  accentColor,
  videoWebmUrl,
  videoMp4Url,
  rating = 4.8,
  reviewCount = 280,
  lang = 'es',
  onOpenReservation,
  onOpenMenu,
}: HeroCinematicProps) {
  const [canAutoplayVideo, setCanAutoplayVideo] = useState(false)
  const [scrollOffsetY, setScrollOffsetY] = useState(0)

  const isUrbanBrewery = archetype === 'urban_street' || archetype === 'tavern'
  const labels = HERO_LABELS[lang] || HERO_LABELS.es
  const activeAccent = accentColor || (isUrbanBrewery ? '#F59E0B' : '#C85A32')

  useEffect(() => {
    // 1. Respetar prefers-reduced-motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (mediaQuery.matches) return

    // 2. Respetar cabecera de ahorro de datos (Save-Data)
    const conn = (navigator as any).connection
    if (conn && (conn.saveData || conn.effectiveType === '2g' || conn.effectiveType === 'slow-2g')) {
      return
    }

    // 3. Hidratar vídeo tras la pintura crítica inicial (LCP preservado en poster)
    const timer = setTimeout(() => {
      setCanAutoplayVideo(true)
    }, 150)

    // 4. Paralaje suave a 60fps gobernado por requestAnimationFrame
    let rafId = 0
    const onScroll = () => {
      if (rafId) return
      rafId = window.requestAnimationFrame(() => {
        setScrollOffsetY(Math.min(window.scrollY * 0.18, 120))
        rafId = 0
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      clearTimeout(timer)
      window.removeEventListener('scroll', onScroll)
      if (rafId) window.cancelAnimationFrame(rafId)
    }
  }, [])

  return (
    <section
      className={`relative w-full h-[88vh] min-h-[640px] max-h-[960px] overflow-hidden select-none flex items-end ${
        isUrbanBrewery ? 'bg-[#0A0B0E]' : 'bg-[#0B0D10]'
      }`}
    >
      {/* 1. Imagen Póster de Alta Prioridad (Candidato LCP < 2.0s) con paralaje GPU a 60fps */}
      <div
        className="absolute inset-0 z-0 will-change-transform"
        style={{ transform: `translate3d(0, ${scrollOffsetY}px, 0) scale(1.05)` }}
      >
        <Image
          src={posterUrl}
          alt={`Ambiente y gastronomía de ${restaurantName}`}
          fill
          priority
          fetchPriority="high"
          sizes="100vw"
          className={`object-cover object-center transition-opacity duration-1000 ${
            isUrbanBrewery ? 'brightness-[0.58] contrast-[1.08]' : 'brightness-[0.78]'
          }`}
        />
      </div>

      {/* Flanco arquitectónico secundario sutil en escritorio para cervecerías con activos reales */}
      {isUrbanBrewery && flankRightUrl && (
        <div
          aria-hidden="true"
          className="hidden xl:block absolute right-10 top-28 w-72 h-96 rounded-full overflow-hidden opacity-35 blur-[0.5px] pointer-events-none z-0"
          style={{
            transform: `translate3d(0, ${-scrollOffsetY * 0.4}px, 0)`,
            maskImage: 'radial-gradient(circle, black 45%, transparent 78%)',
            WebkitMaskImage: 'radial-gradient(circle, black 45%, transparent 78%)',
          }}
        >
          <Image
            src={flankRightUrl}
            alt=""
            fill
            sizes="300px"
            className="object-cover object-center"
          />
        </div>
      )}

      {/* 2. Vídeo de fondo cinemático diferido en trípode (Seamless Loop) */}
      {canAutoplayVideo && (videoWebmUrl || videoMp4Url) && (
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover z-0 brightness-[0.72] animate-in fade-in duration-1000"
        >
          {videoWebmUrl && <source src={videoWebmUrl} type="video/webm" />}
          {videoMp4Url && <source src={videoMp4Url} type="video/mp4" />}
        </video>
      )}

      {/* 3. Degradado Editorial de Fusión (Filtro Anti-Slop: transición atmosférica sin cortes duros) */}
      <div
        className={`absolute inset-0 z-10 pointer-events-none ${
          isUrbanBrewery
            ? 'bg-gradient-to-t from-[#0A0B0E] via-[#0A0B0E]/65 to-[#0A0B0E]/30'
            : 'bg-gradient-to-t from-[#0B0D10] via-[#0B0D10]/40 to-black/30'
        }`}
      />
      {isUrbanBrewery && (
        <div
          aria-hidden="true"
          className="absolute -bottom-24 left-1/4 w-[520px] h-[260px] rounded-full bg-[#F59E0B]/15 blur-[110px] pointer-events-none z-10"
        />
      )}

      {/* 4. Contenido Editorial Superpuesto */}
      <div className="relative z-20 w-full max-w-6xl mx-auto px-6 md:px-12 pb-16 md:pb-24 pt-24">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="max-w-3xl">
            {/* Logotipo Oficial Íntegro sin recortes forzados (object-contain) */}
            {logoUrl && (
              <div className="mb-5 flex flex-wrap items-center gap-3.5">
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden bg-white p-1 ring-2 ring-[#F59E0B]/60 shadow-[0_14px_34px_rgba(0,0,0,0.65)] flex items-center justify-center flex-shrink-0">
                  <Image
                    src={logoUrl}
                    alt={`Logotipo oficial de ${restaurantName}`}
                    width={92}
                    height={92}
                    priority
                    className="w-full h-full object-contain"
                  />
                </div>
                {isUrbanBrewery && (
                  <span className="px-3.5 py-1.5 rounded-full bg-[#F59E0B]/15 text-[#FBBF24] text-[11px] font-semibold uppercase tracking-[0.16em]">
                    {labels.cellarBadge}
                  </span>
                )}
              </div>
            )}

            {/* Ubicación y Valoración Social Discreta */}
            <div className="flex flex-wrap items-center gap-3 text-white/85 text-xs font-medium tracking-wider uppercase mb-3">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" style={{ color: activeAccent }} />
                <span>
                  {address} · {city}
                </span>
              </span>
              <span className="text-white/30">•</span>
              <div className="flex items-center gap-1 text-[#FBBF24]">
                <Star className="w-3.5 h-3.5 fill-current" />
                <span className="text-white font-semibold">{rating.toFixed(1)}</span>
                <span className="text-white/60 lowercase">
                  ({reviewCount} {labels.opinions})
                </span>
              </div>
            </div>

            {/* Titular según Arquetipo: Arquetipo 1 (Urban & Street / Cervecería) vs Editorial Serif */}
            {isUrbanBrewery ? (
              <h1
                className="text-4xl sm:text-6xl md:text-7xl uppercase text-white tracking-tight leading-[1.02] font-black drop-shadow-lg"
                style={{ fontFamily: "'Anton', 'Sora', sans-serif", letterSpacing: '0.01em' }}
              >
                {restaurantName.split(' ')[0]}{' '}
                <span className="text-[#F59E0B]">
                  {restaurantName.split(' ').slice(1).join(' ')}
                </span>
              </h1>
            ) : (
              <h1 className="text-4xl sm:text-6xl md:text-7xl font-serif text-white tracking-tight leading-[1.08] max-w-3xl drop-shadow-md">
                {restaurantName.split(' ')[0]}{' '}
                <span className="italic font-normal text-white/95">
                  {restaurantName.split(' ').slice(1).join(' ')}
                </span>
              </h1>
            )}

            {/* Subtítulo de promesa gastronómica */}
            <p className="mt-4 text-base sm:text-lg text-white/85 font-normal max-w-2xl leading-relaxed">
              {tagline}
            </p>

            {/* Botones de Acción Primarios (Enfocados a Rotación Directa en Cervecería) */}
            <div className="mt-8 flex flex-wrap items-center gap-3.5">
              {isUrbanBrewery ? (
                <>
                  <button
                    onClick={onOpenMenu}
                    className="px-7 py-3.5 rounded-full bg-[#F59E0B] hover:bg-[#D97706] active:scale-[0.98] text-[#0A0B0E] font-extrabold text-sm shadow-xl shadow-[#F59E0B]/25 flex items-center gap-2 transition-all"
                  >
                    <Utensils className="w-4 h-4" />
                    <span>{labels.viewMenu}</span>
                  </button>

                  <a
                    href={googleMapsUrl || '#horarios'}
                    target={googleMapsUrl ? '_blank' : '_self'}
                    rel="noopener noreferrer"
                    className="px-6 py-3.5 rounded-full bg-white/10 hover:bg-white/15 active:scale-[0.98] text-white font-semibold text-sm backdrop-blur-md flex items-center gap-2 transition-all"
                  >
                    <Navigation className="w-4 h-4 text-[#F59E0B]" />
                    <span>{labels.directions}</span>
                  </a>

                  <button
                    onClick={onOpenReservation}
                    className="px-5 py-3.5 rounded-full bg-transparent hover:bg-white/5 text-white/80 hover:text-white font-medium text-xs uppercase tracking-wider flex items-center gap-2 transition-all"
                  >
                    <Calendar className="w-3.5 h-3.5 text-[#F59E0B]" />
                    <span>{labels.requestTable}</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={onOpenReservation}
                    className="px-7 py-3.5 rounded-xl bg-[#C85A32] hover:bg-[#b04d28] active:scale-[0.98] text-white font-semibold text-sm shadow-xl shadow-[#C85A32]/30 flex items-center gap-2 transition-all"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>{archetype === 'restaurant' ? labels.bookTable : labels.requestTable}</span>
                  </button>

                  <button
                    onClick={onOpenMenu}
                    className="px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/15 active:scale-[0.98] border border-white/20 text-white font-medium text-sm backdrop-blur-sm flex items-center gap-2 transition-all"
                  >
                    <Utensils className="w-4 h-4 text-white/80" />
                    <span>{labels.viewMenu}</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
