'use client'

import React, { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Calendar, Utensils, Star, MapPin, Navigation, Menu, X, ArrowRight } from 'lucide-react'
import type {
  GastronomicLayoutPreset,
  RestaurantArchetype,
  WebLanguage,
} from '@/types/gastronomic-web.types'
import { LoopVideoBlock } from '@/components/web/LoopVideoBlock'

export interface HeroCinematicProps {
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
  layoutPreset?: GastronomicLayoutPreset
  heroLoopFrames?: string[]
  onLangChange?: (lang: WebLanguage) => void
  onNavigateSection?: (id: string) => void
  onOpenReservation: () => void
  onOpenMenu: () => void
}

const HERO_LABELS = {
  es: {
    opinions: 'opiniones Google',
    bookTable: 'Reservar Mesa',
    requestTable: 'Solicitar Mesa',
    terraceGroups: 'Terraza / Grupos',
    viewMenu: 'Ver Carta y Precios',
    directions: 'Cómo llegar',
    cellarBadge: 'Cerveza de Bodega · Tapa de Cortesía',
  },
  gl: {
    opinions: 'opinións Google',
    bookTable: 'Reservar Mesa',
    requestTable: 'Solicitar Mesa',
    terraceGroups: 'Terraza / Grupos',
    viewMenu: 'Ver Carta e Prezos',
    directions: 'Como chegar',
    cellarBadge: 'Cervexa de Adega · Tapa de Cortesía',
  },
  en: {
    opinions: 'Google reviews',
    bookTable: 'Book a Table',
    requestTable: 'Request Table',
    terraceGroups: 'Terrace / Groups',
    viewMenu: 'View Menu & Prices',
    directions: 'Get Directions',
    cellarBadge: 'Cellar Draft Beer · Free House Tapa',
  },
}

const CAUCE_HERO_COPY = {
  es: {
    nav: [
      { id: 'tragos-carta', label: 'Tragos y Carta' },
      { id: 'horarios-ubicacion', label: 'Horarios y Ubicación' },
      { id: 'resenas-maps', label: 'Reseñas' },
    ],
    navCta: 'Cómo llegar',
    headline: 'Tu bar de siempre bajo los soportales de Noia',
    heroCta: 'Ver Carta',
    openMenuLabel: 'Abrir menú de navegación',
    closeMenuLabel: 'Cerrar menú de navegación',
    langGroupLabel: 'Selector de idioma',
  },
  gl: {
    nav: [
      { id: 'tragos-carta', label: 'Tragos e Carta' },
      { id: 'horarios-ubicacion', label: 'Horarios e Ubicación' },
      { id: 'resenas-maps', label: 'Reseñas' },
    ],
    navCta: 'Como chegar',
    headline: 'O teu bar de sempre baixo os soportais de Noia',
    heroCta: 'Ver Carta',
    openMenuLabel: 'Abrir menú de navegación',
    closeMenuLabel: 'Pechar menú de navegación',
    langGroupLabel: 'Selector de idioma',
  },
  en: {
    nav: [
      { id: 'tragos-carta', label: 'Drinks & Menu' },
      { id: 'horarios-ubicacion', label: 'Hours & Location' },
      { id: 'resenas-maps', label: 'Reviews' },
    ],
    navCta: 'Directions',
    headline: 'Your neighborhood tavern beneath Noia’s stone arcades',
    heroCta: 'View Menu',
    openMenuLabel: 'Open navigation menu',
    closeMenuLabel: 'Close navigation menu',
    langGroupLabel: 'Language selector',
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
  layoutPreset,
  heroLoopFrames,
  onLangChange,
  onNavigateSection,
  onOpenReservation,
  onOpenMenu,
}: HeroCinematicProps) {
  const [canAutoplayVideo, setCanAutoplayVideo] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const parallaxBgRef = useRef<HTMLDivElement | null>(null)
  const parallaxFlankRef = useRef<HTMLDivElement | null>(null)

  const isCauce = layoutPreset === 'cauce_editorial'
  const isUrbanBrewery = archetype === 'urban_street' || archetype === 'tavern'
  const labels = HERO_LABELS[lang] || HERO_LABELS.es
  const cauceCopy = CAUCE_HERO_COPY[lang] || CAUCE_HERO_COPY.es
  const activeAccent = accentColor || (isUrbanBrewery ? '#F59E0B' : '#C85A32')
  const showFlankVignette = Boolean(
    !isCauce && isUrbanBrewery && flankRightUrl && flankRightUrl !== posterUrl
  )

  const nameParts = restaurantName.trim().split(/\s+/)
  const firstWord = nameParts[0] || restaurantName
  const remainingWords = nameParts.slice(1).join(' ')

  useEffect(() => {
    if (!isCauce) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMobileMenuOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isCauce])

  useEffect(() => {
    if (isCauce) return

    // 1. Respetar prefers-reduced-motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (mediaQuery.matches) return

    // 2. Respetar cabecera de ahorro de datos (Save-Data)
    const conn = (navigator as Navigator & {
      connection?: { saveData?: boolean; effectiveType?: string }
    }).connection
    if (
      conn &&
      (conn.saveData || conn.effectiveType === '2g' || conn.effectiveType === 'slow-2g')
    ) {
      return
    }

    // 3. Hidratar vídeo tras la pintura crítica inicial (LCP preservado en poster)
    const timer = setTimeout(() => {
      setCanAutoplayVideo(true)
    }, 150)

    // 4. Paralaje GPU directo a 60fps gobernado por requestAnimationFrame (0 re-renders)
    let rafId = 0
    const applyParallax = () => {
      const offset = Math.min(window.scrollY * 0.16, 96)
      if (parallaxBgRef.current) {
        parallaxBgRef.current.style.transform = `translate3d(0, ${offset.toFixed(2)}px, 0) scale(1.06)`
      }
      if (parallaxFlankRef.current) {
        parallaxFlankRef.current.style.transform = `translate3d(0, ${(-offset * 0.4).toFixed(2)}px, 0)`
      }
      rafId = 0
    }

    const onScroll = () => {
      if (rafId) return
      rafId = window.requestAnimationFrame(applyParallax)
    }

    applyParallax()
    window.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      clearTimeout(timer)
      window.removeEventListener('scroll', onScroll)
      if (rafId) window.cancelAnimationFrame(rafId)
    }
  }, [isCauce])

  const scrollToTarget = (sectionId: string) => {
    setIsMobileMenuOpen(false)
    onNavigateSection?.(sectionId)
    if (typeof window === 'undefined') return
    const target = document.getElementById(sectionId)
    if (target) {
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' })
    }
  }

  const handleCauceCtaClick = () => {
    setIsMobileMenuOpen(false)
    if (googleMapsUrl && typeof window !== 'undefined') {
      window.open(googleMapsUrl, '_blank', 'noopener,noreferrer')
      return
    }
    scrollToTarget('horarios-ubicacion')
  }

  // RAMA CAUCE EDITORIAL (Stone / White / Jara-Tusas Royal Blue #1D4ED8 — 0% naranja/ámbar)
  if (isCauce) {
    return (
      <>
        {/* Floating White Pill Navbar */}
        <header className="fixed top-3 sm:top-4 inset-x-3 sm:inset-x-6 z-40">
          <div className="max-w-6xl mx-auto rounded-full bg-white/95 backdrop-blur-xl border border-slate-200/90 px-3.5 sm:px-5 py-2 sm:py-2.5 shadow-[0_8px_30px_rgba(15,23,42,0.08)] flex items-center justify-between gap-3">
            <a
              href="#top"
              onClick={(e) => {
                e.preventDefault()
                setIsMobileMenuOpen(false)
                if (typeof window !== 'undefined') {
                  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
                  window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' })
                }
              }}
              className="flex items-center gap-2.5 min-w-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8] focus-visible:ring-offset-2"
            >
              {logoUrl && (
                <span className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#EBE8E1] border border-slate-200/80 overflow-hidden flex items-center justify-center flex-shrink-0 shadow-xs">
                  <Image
                    src={logoUrl}
                    alt={restaurantName}
                    width={36}
                    height={36}
                    priority
                    className="w-full h-full object-contain"
                  />
                </span>
              )}
              <span className="text-sm sm:text-[15px] font-semibold tracking-tight text-[#0F172A] truncate">
                {restaurantName}
              </span>
            </a>

            {/* Enlaces de navegación en escritorio */}
            <nav aria-label="Navegación principal" className="hidden md:flex items-center gap-1">
              {cauceCopy.nav.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  onClick={(e) => {
                    e.preventDefault()
                    scrollToTarget(item.id)
                  }}
                  className="px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-medium text-slate-600 hover:text-[#0F172A] hover:bg-slate-100/80 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8] focus-visible:ring-offset-2"
                >
                  {item.label}
                </a>
              ))}
            </nav>

            {/* Controles derecha: Selector ES | GAL | EN + CTA azul + Menú móvil */}
            <div className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0">
              {onLangChange && (
                <div
                  role="group"
                  aria-label={cauceCopy.langGroupLabel}
                  className="inline-flex items-center p-0.5 rounded-full bg-slate-100/90 border border-slate-200/80 text-[11px] font-semibold"
                >
                  {(['es', 'gl', 'en'] as WebLanguage[]).map((code) => {
                    const active = lang === code
                    return (
                      <button
                        key={code}
                        type="button"
                        onClick={() => onLangChange(code)}
                        className={`px-2 sm:px-2.5 py-1 rounded-full uppercase transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8] ${
                          active
                            ? 'bg-[#1D4ED8] text-white shadow-xs font-bold'
                            : 'text-slate-600 hover:text-[#0F172A]'
                        }`}
                      >
                        {code === 'gl' ? 'GAL' : code.toUpperCase()}
                      </button>
                    )
                  })}
                </div>
              )}

              <button
                type="button"
                onClick={handleCauceCtaClick}
                className="hidden sm:inline-flex items-center justify-center bg-[#1D4ED8] hover:bg-[#1E3A8A] active:scale-95 text-white text-xs sm:text-sm font-semibold rounded-full px-4 sm:px-5 py-2 shadow-xs transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8] focus-visible:ring-offset-2"
              >
                {cauceCopy.navCta}
              </button>

              <button
                type="button"
                aria-expanded={isMobileMenuOpen}
                aria-controls="cauce-mobile-nav"
                aria-label={isMobileMenuOpen ? cauceCopy.closeMenuLabel : cauceCopy.openMenuLabel}
                onClick={() => setIsMobileMenuOpen((prev) => !prev)}
                className="md:hidden w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200/80 text-[#0F172A] flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]"
              >
                {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Panel desplegable móvil (< 768px) */}
          {isMobileMenuOpen && (
            <div
              id="cauce-mobile-nav"
              className="md:hidden max-w-6xl mx-auto mt-2 rounded-[22px] bg-white/95 backdrop-blur-md border border-slate-200/80 p-4 shadow-lg space-y-2"
            >
              <nav aria-label="Navegación móvil" className="flex flex-col gap-1">
                {cauceCopy.nav.map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    onClick={(e) => {
                      e.preventDefault()
                      scrollToTarget(item.id)
                    }}
                    className="min-h-[44px] px-4 rounded-xl flex items-center text-sm font-medium text-[#0F172A] hover:bg-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]"
                  >
                    {item.label}
                  </a>
                ))}
              </nav>
              <button
                type="button"
                onClick={handleCauceCtaClick}
                className="w-full min-h-[44px] rounded-full bg-[#1D4ED8] hover:bg-[#1E3A8A] text-white text-sm font-semibold px-5 py-2.5 shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]"
              >
                {cauceCopy.navCta}
              </button>
            </div>
          )}
        </header>

        {/* Fullscreen Unframed Hero (100vw x 100dvh, 0 floating pills/badges/banners) */}
        <section
          id="top"
          className="relative w-full min-h-screen h-[100dvh] overflow-hidden flex items-end bg-slate-950 select-none"
        >
          <div className="absolute inset-0 z-0">
            <LoopVideoBlock
              posterSrc={posterUrl}
              frames={heroLoopFrames}
              videoMp4Url={videoMp4Url}
              videoWebmUrl={videoWebmUrl}
              alt={restaurantName}
              aspectClass="w-full h-full"
              priorityPoster
            />
          </div>

          {/* Scrim calibrado para lectura nítida sobre la fachada y el bucle de fondo */}
          <div
            aria-hidden="true"
            className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-b from-slate-950/35 via-slate-950/25 to-slate-950/55"
          />

          <div
            className="relative z-20 w-full max-w-6xl mx-auto px-6 md:px-12 pb-28 sm:pb-20 md:pb-24 pt-28"
            style={{ fontFamily: "'DM Sans', 'Inter', sans-serif" }}
          >
            <div className="max-w-3xl space-y-5">
              <h1
                className="text-4xl sm:text-6xl md:text-7xl text-white font-normal tracking-[-0.02em] leading-[1.03] drop-shadow-sm"
                style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
              >
                {cauceCopy.headline}
              </h1>

              <p className="text-base sm:text-xl text-white/90 font-normal max-w-2xl leading-relaxed">
                {tagline}
              </p>

              <div className="pt-2">
                <Link
                  href="/p/bar-jaratusas?mesa=0"
                  onClick={(e) => {
                    if (onOpenMenu) {
                      e.preventDefault()
                      onOpenMenu()
                    }
                  }}
                  className="inline-flex items-center justify-center gap-2 bg-[#1D4ED8] hover:bg-[#1E3A8A] active:scale-[0.98] text-white text-sm sm:text-base font-semibold rounded-full px-8 py-4 shadow-xl transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                >
                  <span>{cauceCopy.heroCta}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </>
    )
  }

  return (
    <section
      className={`relative w-full min-h-[620px] sm:min-h-[680px] h-[90svh] max-h-[940px] overflow-hidden select-none flex items-end ${
        isUrbanBrewery ? 'bg-[#0A0B0E]' : 'bg-[#0B0D10]'
      }`}
    >
      {/* 1. Imagen Póster de Alta Prioridad (Candidato LCP < 2.0s) con paralaje GPU a 60fps */}
      <div
        ref={parallaxBgRef}
        className="absolute inset-0 z-0 will-change-transform"
        style={{ transform: 'translate3d(0, 0px, 0) scale(1.06)' }}
      >
        <Image
          src={posterUrl}
          alt={`Fachada y ambiente de ${restaurantName}`}
          fill
          priority
          fetchPriority="high"
          sizes="100vw"
          className={`object-cover object-[center_42%] transition-opacity duration-1000 ${
            isUrbanBrewery ? 'brightness-[0.62] contrast-[1.06]' : 'brightness-[0.78]'
          }`}
        />
      </div>

      {/* Flanco arquitectónico secundario solo si se pasa explícitamente y no duplica el póster */}
      {showFlankVignette && flankRightUrl && (
        <div
          ref={parallaxFlankRef}
          aria-hidden="true"
          className="hidden xl:block absolute right-10 top-28 w-72 h-96 rounded-full overflow-hidden opacity-35 blur-[0.5px] pointer-events-none z-0 will-change-transform"
          style={{
            transform: 'translate3d(0, 0px, 0)',
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

      {/* 3. Degradado Editorial de Fusión Atmosférica (legibilidad garantizada sobre piedra iluminada) */}
      <div
        className={`absolute inset-0 z-10 pointer-events-none ${
          isUrbanBrewery
            ? 'bg-gradient-to-t from-[#0A0B0E] via-[#0A0B0E]/72 to-[#0A0B0E]/30'
            : 'bg-gradient-to-t from-[#0B0D10] via-[#0B0D10]/40 to-black/30'
        }`}
      />
      {isUrbanBrewery && (
        <>
          <div
            aria-hidden="true"
            className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-r from-[#0A0B0E]/82 via-[#0A0B0E]/30 to-transparent"
          />
          <div
            aria-hidden="true"
            className="absolute -bottom-24 left-1/4 w-[520px] h-[260px] rounded-full bg-[#F59E0B]/14 blur-[110px] pointer-events-none z-10"
          />
        </>
      )}

      {/* 4. Contenido Editorial Superpuesto (0 precios en portada) */}
      <div
        className="relative z-20 w-full max-w-6xl mx-auto px-6 md:px-12 pb-12 sm:pb-16 md:pb-24 pt-24 sm:pt-28"
        style={{ fontFamily: "'DM Sans', 'Inter', sans-serif" }}
      >
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="max-w-3xl">
            {/* Logotipo Oficial Íntegro sobre fondo piedra cálida #EBE8E1 sin borde blanco */}
            {logoUrl && (
              <div className="mb-5 flex flex-wrap items-center gap-3.5">
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden bg-[#EBE8E1] p-1 ring-2 ring-[#F59E0B]/60 shadow-[0_14px_34px_rgba(0,0,0,0.65)] flex items-center justify-center flex-shrink-0">
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
                  <span className="px-3.5 py-1.5 rounded-full bg-[#0A0B0E]/65 backdrop-blur-md border border-[#F59E0B]/30 text-[#FBBF24] text-[11px] font-semibold uppercase tracking-[0.16em]">
                    {labels.cellarBadge}
                  </span>
                )}
              </div>
            )}

            {/* Ubicación y Valoración Social con tabular-nums */}
            <div className="flex flex-wrap items-center gap-3 text-white/90 text-xs font-medium tracking-wider uppercase mb-3">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" style={{ color: activeAccent }} />
                <span>
                  {address} · {city}
                </span>
              </span>
              <span className="text-white/30">•</span>
              <div className="flex items-center gap-1.5 text-[#FBBF24] tabular-nums">
                <Star className="w-3.5 h-3.5 fill-current" />
                <span className="text-white font-semibold tabular-nums">
                  {rating.toFixed(1)}
                </span>
                <span className="text-white/70 lowercase tabular-nums">
                  ({reviewCount} {labels.opinions})
                </span>
              </div>
            </div>

            {/* Titular según Arquetipo */}
            {isUrbanBrewery ? (
              <h1
                className="text-5xl sm:text-6xl md:text-7xl lg:text-[5.25rem] uppercase text-white tracking-tight leading-[1.0] font-black drop-shadow-[0_12px_28px_rgba(0,0,0,0.65)]"
                style={{ fontFamily: "'Anton', 'Sora', sans-serif", letterSpacing: '0.015em' }}
              >
                {firstWord}
                {remainingWords && (
                  <>
                    {' '}
                    <span className="text-[#F59E0B]">{remainingWords}</span>
                  </>
                )}
              </h1>
            ) : (
              <h1 className="text-4xl sm:text-6xl md:text-7xl font-serif text-white tracking-tight leading-[1.08] max-w-3xl drop-shadow-md">
                {firstWord}
                {remainingWords && (
                  <>
                    {' '}
                    <span className="italic font-normal text-white/95">{remainingWords}</span>
                  </>
                )}
              </h1>
            )}

            {/* Subtítulo de promesa gastronómica */}
            <p className="mt-4 text-base sm:text-lg text-white/88 font-normal max-w-2xl leading-relaxed">
              {tagline}
            </p>

            {/* Botones de Acción Primarios con Micro-interacciones Táctiles */}
            <div className="mt-7 sm:mt-8 flex flex-wrap items-center gap-3">
              {isUrbanBrewery ? (
                <>
                  <button
                    type="button"
                    onClick={onOpenMenu}
                    className="px-6 sm:px-7 py-3.5 rounded-full bg-[#F59E0B] hover:bg-[#D97706] hover:-translate-y-0.5 active:scale-[0.97] text-[#0A0B0E] font-extrabold text-sm shadow-xl shadow-[#F59E0B]/25 hover:shadow-[#F59E0B]/40 flex items-center gap-2 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
                  >
                    <Utensils className="w-4 h-4" />
                    <span>{labels.viewMenu}</span>
                  </button>

                  <a
                    href={googleMapsUrl || '#horarios'}
                    target={googleMapsUrl ? '_blank' : '_self'}
                    rel="noopener noreferrer"
                    className="px-5 sm:px-6 py-3.5 rounded-full bg-white/12 hover:bg-white/20 hover:-translate-y-0.5 active:scale-[0.97] border border-white/15 text-white font-semibold text-sm backdrop-blur-md flex items-center gap-2 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
                  >
                    <Navigation className="w-4 h-4 text-[#F59E0B]" />
                    <span>{labels.directions}</span>
                  </a>

                  <button
                    type="button"
                    onClick={onOpenReservation}
                    className="px-5 py-3.5 rounded-full bg-[#0A0B0E]/45 hover:bg-white/10 hover:-translate-y-0.5 active:scale-[0.97] border border-white/15 text-white/90 hover:text-white font-semibold text-xs uppercase tracking-wider backdrop-blur-md flex items-center gap-2 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
                  >
                    <Calendar className="w-3.5 h-3.5 text-[#F59E0B]" />
                    <span>{labels.terraceGroups}</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={onOpenReservation}
                    className="px-7 py-3.5 rounded-xl bg-[#C85A32] hover:bg-[#b04d28] hover:-translate-y-0.5 active:scale-[0.97] text-white font-semibold text-sm shadow-xl shadow-[#C85A32]/30 flex items-center gap-2 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>{archetype === 'restaurant' ? labels.bookTable : labels.requestTable}</span>
                  </button>

                  <button
                    type="button"
                    onClick={onOpenMenu}
                    className="px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/15 hover:-translate-y-0.5 active:scale-[0.97] border border-white/20 text-white font-medium text-sm backdrop-blur-sm flex items-center gap-2 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
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
