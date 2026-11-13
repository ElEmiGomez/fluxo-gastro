'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type {
  DishShowcaseItem,
  RestaurantArchetype,
  ScrollytellingPanelItem,
  WebLanguage,
} from '@/types/gastronomic-web.types'

export interface CanvasScrollytellingProps {
  framesPath?: string // Ruta base de fotogramas (ej. "/assets/frames/casamar/")
  totalFrames?: number // Cantidad de fotogramas (por defecto 120)
  dishesFallback: DishShowcaseItem[]
  restaurantName: string
  archetype?: RestaurantArchetype
  historyTitle?: string
  historyText?: string[]
  flankLeftImage?: string
  flankRightImage?: string
  panels?: ScrollytellingPanelItem[]
  lang?: WebLanguage
}

const SCROLL_I18N = {
  es: {
    tagBrewery: 'Tradición Cervecera & Soportales de Piedra',
    tagKitchen: 'El Arte en la Cocina',
    defaultTitle: 'Técnica, Producto & Memoria',
    defaultDesc:
      'Cada creación parte de la selección diaria de materia prima local y el cuidado en cada servicio.',
    captionLeft: 'Soportales históricos de la Rúa do Curro · Sesión Vermú y Terraza',
    captionRight: 'Interior de cantería tradicional · Cerveza de bodega y raciones calientes',
    scrollHint: 'Desplaza para descubrir la preparación del plato insignia',
    prevPanel: 'Capítulo anterior',
    nextPanel: 'Siguiente capítulo',
    goToPanel: 'Ir al capítulo',
    scrollCue: 'Sigue bajando para recorrer',
    galleryLabel: 'Recorrido visual en capítulos',
  },
  gl: {
    tagBrewery: 'Tradición Cervexeira e Soportais de Pedra',
    tagKitchen: 'A Arte na Cociña',
    defaultTitle: 'Técnica, Produto e Memoria',
    defaultDesc:
      'Cada creación parte da selección diaria de materia prima local e o coidado en cada servizo.',
    captionLeft: 'Soportais históricos da Rúa do Curro · Sesión Vermú e Terraza',
    captionRight: 'Interior de cantaría tradicional · Cervexa de adega e racións quentes',
    scrollHint: 'Despraza para descubrir a preparación do prato insignia',
    prevPanel: 'Capítulo anterior',
    nextPanel: 'Seguinte capítulo',
    goToPanel: 'Ir ao capítulo',
    scrollCue: 'Segue baixando para percorrer',
    galleryLabel: 'Percorrido visual en capítulos',
  },
  en: {
    tagBrewery: 'Draft Beer Tradition & Historic Stone Arcades',
    tagKitchen: 'The Culinary Craft',
    defaultTitle: 'Technique, Produce & Heritage',
    defaultDesc:
      'Every creation starts with daily selected local ingredients and care in every pour.',
    captionLeft: 'Historic stone arcades on Rúa do Curro · Vermouth & Terrace',
    captionRight: 'Traditional stone masonry interior · Cellar draft beer & hot tapas',
    scrollHint: 'Scroll to discover the preparation of our signature dish',
    prevPanel: 'Previous chapter',
    nextPanel: 'Next chapter',
    goToPanel: 'Go to chapter',
    scrollCue: 'Scroll down to explore',
    galleryLabel: 'Visual journey in chapters',
  },
}

// Curva orgánica: ~10% anticipación suave, ~60% desplazamiento fluido, ~30% asentamiento final
const BEZIER_X1 = 0.42
const BEZIER_Y1 = 0.0
const BEZIER_X2 = 0.28
const BEZIER_Y2 = 1.0

function sampleBezierCoord(t: number, p1: number, p2: number): number {
  const u = 1 - t
  return 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t
}

function shapeOrganicProgress(x: number): number {
  const clamped = Math.min(Math.max(x, 0), 1)
  if (clamped === 0 || clamped === 1) return clamped

  // Resolver t para Bx(t) = clamped con búsqueda binaria (monotónica estricta en [0, 1])
  let low = 0
  let high = 1
  for (let i = 0; i < 12; i++) {
    const mid = (low + high) * 0.5
    if (sampleBezierCoord(mid, BEZIER_X1, BEZIER_X2) < clamped) {
      low = mid
    } else {
      high = mid
    }
  }
  const t = (low + high) * 0.5
  return Math.min(Math.max(sampleBezierCoord(t, BEZIER_Y1, BEZIER_Y2), 0), 1)
}

function invertOrganicProgress(targetY: number): number {
  const clamped = Math.min(Math.max(targetY, 0), 1)
  if (clamped === 0 || clamped === 1) return clamped

  let low = 0
  let high = 1
  for (let i = 0; i < 14; i++) {
    const mid = (low + high) * 0.5
    if (shapeOrganicProgress(mid) < clamped) {
      low = mid
    } else {
      high = mid
    }
  }
  return (low + high) * 0.5
}

export function CanvasScrollytelling({
  framesPath,
  totalFrames = 120,
  dishesFallback,
  restaurantName,
  archetype = 'restaurant',
  historyTitle,
  historyText,
  flankLeftImage,
  flankRightImage,
  panels,
  lang = 'es',
}: CanvasScrollytellingProps) {
  const containerRef = useRef<HTMLElement | null>(null)
  const viewportRef = useRef<HTMLDivElement | null>(null)
  const trackRef = useRef<HTMLDivElement | null>(null)
  const reducedTrackRef = useRef<HTMLDivElement | null>(null)
  const progressBarRef = useRef<HTMLDivElement | null>(null)
  const imageRefs = useRef<(HTMLDivElement | null)[]>([])
  const panelRefs = useRef<(HTMLElement | null)[]>([])

  const hasPanels = Boolean(panels && panels.length > 0)
  const hasFrames = Boolean(!hasPanels && framesPath)

  const [scrollProgress, setScrollProgress] = useState<number>(0)
  const [activeIndex, setActiveIndex] = useState<number>(0)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(false)

  const lastActiveIdxRef = useRef<number>(0)
  const maxTranslateRef = useRef<number>(0)

  const isUrbanBrewery = archetype === 'urban_street' || archetype === 'tavern'
  const copy = SCROLL_I18N[lang] || SCROLL_I18N.es
  const panelCount = panels?.length ?? 0

  const getPanelTag = (p: ScrollytellingPanelItem) =>
    lang === 'gl' ? p.tag_gl || p.tag : lang === 'en' ? p.tag_en || p.tag : p.tag

  const getPanelTitle = (p: ScrollytellingPanelItem) =>
    lang === 'gl' ? p.title_gl || p.title : lang === 'en' ? p.title_en || p.title : p.title

  const getPanelDesc = (p: ScrollytellingPanelItem) =>
    lang === 'gl'
      ? p.description_gl || p.description
      : lang === 'en'
      ? p.description_en || p.description
      : p.description

  // Detectar preferencia del sistema prefers-reduced-motion
  useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mq.matches)
    const onChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  // Motor de Horizontal Scroll Pinning a 60fps con lerp (~0.09) y transformaciones GPU puras
  useEffect(() => {
    if (!hasPanels || prefersReducedMotion || panelCount === 0) return

    let animId = 0
    let targetProgress = 0
    let currentProgress = 0
    let lastTime = 0

    const applyTransforms = (progress: number) => {
      const tx = progress * maxTranslateRef.current
      if (trackRef.current) {
        trackRef.current.style.transform = `translate3d(-${tx.toFixed(2)}px, 0, 0)`
      }
      if (progressBarRef.current) {
        const baseScale = panelCount > 0 ? 1 / panelCount : 0.25
        const scale = Math.min(1, Math.max(baseScale, baseScale + progress * (1 - baseScale)))
        progressBarRef.current.style.transform = `scaleX(${scale.toFixed(4)})`
      }

      // Paralaje horizontal sutil interno en cada fotografía sin distorsión ni bordes vacíos
      for (let i = 0; i < panelCount; i++) {
        const imgWrapper = imageRefs.current[i]
        if (!imgWrapper) continue
        const center = panelCount > 1 ? i / (panelCount - 1) : 0
        const delta = Math.min(Math.max(progress - center, -0.55), 0.55)
        const imgShift = delta * -42
        imgWrapper.style.transform = `translate3d(${imgShift.toFixed(2)}px, 0, 0) scale(1.12)`
      }

      const nextActive =
        panelCount > 1
          ? Math.min(panelCount - 1, Math.max(0, Math.round(progress * (panelCount - 1))))
          : 0
      if (nextActive !== lastActiveIdxRef.current) {
        lastActiveIdxRef.current = nextActive
        setActiveIndex(nextActive)
      }
    }

    const measureTrack = () => {
      const viewport = viewportRef.current
      const track = trackRef.current
      if (!viewport || !track) return
      maxTranslateRef.current = Math.max(0, track.scrollWidth - viewport.clientWidth)
      applyTransforms(currentProgress)
    }

    const computeTargetFromScroll = () => {
      const container = containerRef.current
      if (!container) return
      const rect = container.getBoundingClientRect()
      const totalScrollable = container.offsetHeight - window.innerHeight
      if (totalScrollable <= 0) {
        targetProgress = 0
        return
      }
      const raw = Math.min(Math.max(-rect.top / totalScrollable, 0), 1)
      targetProgress = shapeOrganicProgress(raw)
    }

    const tick = (now: number) => {
      if (!lastTime) lastTime = now
      const dt = Math.min(Math.max(now - lastTime, 4), 48)
      lastTime = now

      const alpha = 1 - Math.pow(1 - 0.09, dt / 16.667)
      const diff = targetProgress - currentProgress

      if (Math.abs(diff) < 0.0004) {
        currentProgress = targetProgress
        applyTransforms(currentProgress)
        animId = 0
        lastTime = 0
        return
      }

      currentProgress += diff * alpha
      applyTransforms(currentProgress)
      animId = window.requestAnimationFrame(tick)
    }

    const startLoop = () => {
      if (!animId) {
        lastTime = 0
        animId = window.requestAnimationFrame(tick)
      }
    }

    const onScroll = () => {
      computeTargetFromScroll()
      startLoop()
    }

    measureTrack()
    computeTargetFromScroll()
    currentProgress = targetProgress
    applyTransforms(currentProgress)

    const resizeObserver =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measureTrack) : null
    if (resizeObserver) {
      if (viewportRef.current) resizeObserver.observe(viewportRef.current)
      if (trackRef.current) resizeObserver.observe(trackRef.current)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', measureTrack, { passive: true })

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', measureTrack)
      if (resizeObserver) resizeObserver.disconnect()
      if (animId) window.cancelAnimationFrame(animId)
    }
  }, [hasPanels, prefersReducedMotion, panelCount])

  // Sincronización para modo accesible (prefers-reduced-motion: reduce) con scroll horizontal nativo
  useEffect(() => {
    if (!hasPanels || !prefersReducedMotion || panelCount === 0) return
    const strip = reducedTrackRef.current
    if (!strip) return

    const onStripScroll = () => {
      const maxScroll = Math.max(1, strip.scrollWidth - strip.clientWidth)
      const norm = Math.min(Math.max(strip.scrollLeft / maxScroll, 0), 1)
      const idx =
        panelCount > 1
          ? Math.min(panelCount - 1, Math.max(0, Math.round(norm * (panelCount - 1))))
          : 0
      setActiveIndex(idx)
      if (progressBarRef.current) {
        const baseScale = 1 / panelCount
        const scale = Math.min(1, Math.max(baseScale, baseScale + norm * (1 - baseScale)))
        progressBarRef.current.style.transform = `scaleX(${scale.toFixed(4)})`
      }
    }

    onStripScroll()
    strip.addEventListener('scroll', onStripScroll, { passive: true })
    return () => strip.removeEventListener('scroll', onStripScroll)
  }, [hasPanels, prefersReducedMotion, panelCount])

  // Navegación por píldoras (01..04) y botones Anterior / Siguiente
  const navigateToPanel = useCallback(
    (index: number) => {
      if (!panels || panels.length === 0) return
      const clampedIndex = Math.min(Math.max(index, 0), panels.length - 1)

      if (prefersReducedMotion) {
        const targetEl = panelRefs.current[clampedIndex]
        if (targetEl) {
          targetEl.scrollIntoView({ behavior: 'auto', inline: 'center', block: 'nearest' })
        }
        setActiveIndex(clampedIndex)
        return
      }

      const container = containerRef.current
      if (!container) return
      const totalScrollable = container.offsetHeight - window.innerHeight
      if (totalScrollable <= 0) return

      const sectionTop = window.scrollY + container.getBoundingClientRect().top
      const targetNormalized = panels.length > 1 ? clampedIndex / (panels.length - 1) : 0
      const rawScrollFraction = invertOrganicProgress(targetNormalized)
      const targetScrollY = sectionTop + rawScrollFraction * totalScrollable

      window.scrollTo({ top: targetScrollY, behavior: 'smooth' })
    },
    [panels, prefersReducedMotion]
  )

  // 1. Manejo del Scroll e Interpolación a 60 fps para modo legacy framesPath
  useEffect(() => {
    if (!hasFrames || !framesPath) return

    let animId: number
    let targetProgress = 0
    let currentProgress = 0

    const handleScroll = () => {
      const container = containerRef.current
      if (!container) return
      const rect = container.getBoundingClientRect()
      const windowHeight = window.innerHeight
      const totalScrollable = container.offsetHeight - windowHeight
      if (totalScrollable <= 0) return

      const progress = Math.min(Math.max(-rect.top / totalScrollable, 0), 1)
      targetProgress = progress
    }

    const renderLoop = () => {
      currentProgress += (targetProgress - currentProgress) * 0.1
      setScrollProgress(currentProgress)
      animId = requestAnimationFrame(renderLoop)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    animId = requestAnimationFrame(renderLoop)

    return () => {
      window.removeEventListener('scroll', handleScroll)
      cancelAnimationFrame(animId)
    }
  }, [hasFrames, framesPath])

  // MODO PRINCIPAL: Horizontal Scroll Pinning con Paneles Editoriales (60fps GPU)
  if (hasPanels && panels) {
    const paddedActive = String(activeIndex + 1).padStart(2, '0')
    const paddedTotal = String(panels.length).padStart(2, '0')
    const accentText = isUrbanBrewery ? 'text-[#F59E0B]' : 'text-[#C85A32]'
    const accentBg = isUrbanBrewery ? 'bg-[#F59E0B]' : 'bg-[#C85A32]'
    const accentPillActive = isUrbanBrewery
      ? 'bg-[#F59E0B] text-[#0A0B0E] shadow-lg shadow-[#F59E0B]/25'
      : 'bg-[#C85A32] text-white shadow-lg shadow-[#C85A32]/25'

    const renderPanelCard = (panel: ScrollytellingPanelItem, idx: number, isSnapMode: boolean) => {
      const panelTag = getPanelTag(panel)
      const panelTitle = getPanelTitle(panel)
      const panelDesc = getPanelDesc(panel)

      return (
        <article
          key={panel.id}
          ref={(el) => {
            panelRefs.current[idx] = el
          }}
          className={`relative flex-shrink-0 w-[calc(100vw-2.5rem)] sm:w-[82vw] md:w-[min(76vw,940px)] pt-6 sm:pt-8 md:pt-10 ${
            isSnapMode ? 'snap-center' : ''
          }`}
        >
          {/* Índice gigante en marca de agua detrás de la tarjeta, sin colisión con texto */}
          <span
            aria-hidden="true"
            className="absolute top-0 right-4 sm:right-8 z-0 pointer-events-none select-none text-[84px] sm:text-[132px] md:text-[164px] leading-[0.82] font-black text-white/[0.06] tabular-nums"
            style={{ fontFamily: "'Anton', 'Sora', sans-serif" }}
          >
            {panel.number}
          </span>

          {/* Tarjeta Dark Luxury (#12151C) */}
          <div className="relative z-10 bg-[#12151C] rounded-3xl overflow-hidden shadow-[0_32px_64px_rgba(0,0,0,0.72)] ring-1 ring-white/[0.08] flex flex-col md:grid md:grid-cols-12">
            {/* Fotografía única con paralaje horizontal GPU (0 precios) */}
            <div className="relative w-full h-[min(23dvh,195px)] sm:h-[min(28dvh,240px)] md:col-span-7 md:h-[min(49dvh,450px)] overflow-hidden bg-[#0A0B0E]">
              <div
                ref={(el) => {
                  imageRefs.current[idx] = el
                }}
                className="absolute inset-0 will-change-transform"
                style={{ transform: 'translate3d(0px, 0, 0) scale(1.12)' }}
              >
                <Image
                  src={panel.image}
                  alt={`${restaurantName} — ${panelTitle}`}
                  fill
                  sizes="(max-width: 768px) 92vw, 56vw"
                  className="object-cover object-center"
                />
              </div>
              <div
                aria-hidden="true"
                className="absolute inset-0 pointer-events-none bg-gradient-to-t from-[#12151C] via-transparent to-black/20 md:bg-gradient-to-r md:from-transparent md:via-transparent md:to-[#12151C]/75"
              />
            </div>

            {/* Columna Editorial */}
            <div
              className="p-5 sm:p-7 md:p-9 lg:p-10 md:col-span-5 flex flex-col justify-center gap-2.5 sm:gap-3.5"
              style={{ fontFamily: "'DM Sans', 'Inter', sans-serif" }}
            >
              <span
                className={`inline-flex items-center gap-2 text-[10px] sm:text-[11px] uppercase tracking-[0.2em] font-bold ${accentText}`}
              >
                <span className="tabular-nums">{panel.number}</span>
                <span className="text-white/30">·</span>
                <span>{panelTag}</span>
              </span>

              <h3
                className={`text-xl sm:text-3xl lg:text-[2.1rem] text-white leading-[1.06] tracking-tight ${
                  isUrbanBrewery ? 'uppercase font-black' : 'font-serif font-bold'
                }`}
                style={
                  isUrbanBrewery
                    ? { fontFamily: "'Anton', 'Sora', sans-serif", letterSpacing: '0.01em' }
                    : undefined
                }
              >
                {panelTitle}
              </h3>

              <p className="text-xs sm:text-sm md:text-[15px] text-white/75 leading-relaxed">
                {panelDesc}
              </p>

              <div className="pt-1 flex items-center gap-2.5 text-[11px] text-white/45 font-medium tabular-nums">
                <span className={`w-6 h-[2px] rounded-full ${accentBg} opacity-75`} />
                <span>
                  {panel.number} / {paddedTotal}
                </span>
              </div>
            </div>
          </div>
        </article>
      )
    }

    const renderTopBar = () => (
      <div className="w-full max-w-6xl mx-auto px-5 sm:px-6 md:px-12 flex-shrink-0">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 md:gap-6">
          <div className="min-w-0 max-w-2xl">
            <div className="flex items-center justify-between md:justify-start gap-3">
              <span
                className={`text-[10px] sm:text-xs uppercase tracking-[0.24em] font-bold truncate ${accentText}`}
              >
                {isUrbanBrewery ? copy.tagBrewery : copy.tagKitchen}
              </span>
              <span className="md:hidden px-2.5 py-0.5 rounded-full bg-white/[0.07] border border-white/10 text-[11px] font-bold text-white/90 tabular-nums flex-shrink-0">
                {paddedActive} / {paddedTotal}
              </span>
            </div>

            <h2
              className={`text-xl sm:text-3xl lg:text-[2.5rem] text-white mt-1.5 leading-[1.06] tracking-tight ${
                isUrbanBrewery ? 'uppercase font-black' : 'font-serif font-bold'
              }`}
              style={isUrbanBrewery ? { fontFamily: "'Anton', 'Sora', sans-serif" } : undefined}
            >
              {historyTitle || copy.defaultTitle}
            </h2>
          </div>

          {/* Controles Interactivos: Paso Actual, Píldoras 01..04 y Flechas Anterior/Siguiente */}
          <div className="flex items-center justify-between md:justify-end gap-2.5 sm:gap-3 flex-shrink-0">
            <span className="hidden md:inline-flex items-center px-3 py-1.5 rounded-full bg-white/[0.06] border border-white/10 text-xs font-bold text-white/90 tabular-nums">
              {paddedActive} / {paddedTotal}
            </span>

            <div
              role="group"
              aria-label={copy.galleryLabel}
              className="inline-flex items-center gap-1 p-1 rounded-full bg-white/[0.05] border border-white/10"
            >
              {panels.map((p, idx) => {
                const isActive = idx === activeIndex
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => navigateToPanel(idx)}
                    aria-label={`${copy.goToPanel} ${p.number}: ${getPanelTitle(p)}`}
                    aria-current={isActive ? 'step' : undefined}
                    className={`px-2.5 sm:px-3 py-1 rounded-full text-[11px] font-bold tabular-nums transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                      isActive ? accentPillActive : 'text-white/65 hover:text-white'
                    }`}
                  >
                    {p.number}
                  </button>
                )
              })}
            </div>

            <div className="inline-flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => navigateToPanel(activeIndex - 1)}
                disabled={activeIndex === 0}
                aria-label={copy.prevPanel}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/[0.06] hover:bg-white/15 border border-white/10 flex items-center justify-center text-white disabled:opacity-35 disabled:cursor-not-allowed transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-95"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => navigateToPanel(activeIndex + 1)}
                disabled={activeIndex === panels.length - 1}
                aria-label={copy.nextPanel}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/[0.06] hover:bg-white/15 border border-white/10 flex items-center justify-center text-white disabled:opacity-35 disabled:cursor-not-allowed transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-95"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Barra de Progreso GPU (scaleX) */}
        <div className="mt-3 sm:mt-4 h-[3px] w-full rounded-full bg-white/10 overflow-hidden">
          <div
            ref={progressBarRef}
            className={`h-full w-full origin-left will-change-transform ${accentBg}`}
            style={{ transform: `scaleX(${(1 / panels.length).toFixed(4)})` }}
          />
        </div>
      </div>
    )

    // Modo Accesible (prefers-reduced-motion: reduce): Carrusel Horizontal Nativo con Snap
    if (prefersReducedMotion) {
      return (
        <section
          ref={containerRef}
          aria-label={copy.galleryLabel}
          className="relative bg-[#0A0B0E] text-[#F6F3EC] py-16 sm:py-24 space-y-8"
        >
          {renderTopBar()}
          <div
            ref={reducedTrackRef}
            className="flex items-stretch gap-6 sm:gap-8 overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar px-5 sm:px-6 md:px-12 xl:px-[max(3rem,calc((100vw-72rem)/2+3rem))] pb-2"
          >
            {panels.map((panel, idx) => renderPanelCard(panel, idx, true))}
          </div>
        </section>
      )
    }

    // Modo Cinemático 60fps: Track Vertical Largo (280vh) + Viewport Sticky (100dvh) + Pista Horizontal GPU
    return (
      <section
        ref={containerRef}
        aria-label={copy.galleryLabel}
        className="relative h-[280vh] min-h-[1900px] bg-[#0A0B0E] text-[#F6F3EC]"
      >
        <div
          ref={viewportRef}
          className="sticky top-0 h-[100dvh] w-full overflow-hidden flex flex-col justify-between bg-[#0A0B0E] pt-[5.25rem] pb-24 sm:pt-24 sm:pb-24 md:pt-24 md:pb-8"
        >
          {/* Halo ambiental ámbar sutil */}
          {isUrbanBrewery && (
            <div
              aria-hidden="true"
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[680px] h-[340px] rounded-full bg-[#F59E0B]/10 blur-[140px] pointer-events-none"
            />
          )}

          {/* Barra Superior Fija */}
          <div className="relative z-10">{renderTopBar()}</div>

          {/* Escenario Central de Desplazamiento Horizontal GPU */}
          <div className="relative z-10 flex-1 flex items-center w-full overflow-hidden">
            <div
              ref={trackRef}
              className="flex w-max items-end gap-6 sm:gap-8 md:gap-12 px-5 sm:px-6 md:px-12 xl:px-[max(3rem,calc((100vw-72rem)/2+3rem))] will-change-transform"
              style={{ transform: 'translate3d(0px, 0, 0)' }}
            >
              {panels.map((panel, idx) => renderPanelCard(panel, idx, false))}
            </div>
          </div>

          {/* Indicador Discreto Inferior en Escritorio */}
          <div className="hidden md:flex relative z-10 w-full max-w-6xl mx-auto px-12 items-center justify-between text-[11px] uppercase tracking-[0.2em] text-white/40 font-semibold flex-shrink-0">
            <span>{copy.scrollCue}</span>
            <span className="tabular-nums">
              {paddedActive} — {paddedTotal}
            </span>
          </div>
        </div>
      </section>
    )
  }

  // Si no hay frames configurados, se despliega el Recorrido Sensorial con Profundidad (Patrón 4.2 de Rodrigo Olivares)
  // Cumpliendo DEC-39: 0 precios en portada y Filtro Anti-Slop (sin bordes artificiales pesados)
  if (!hasFrames || !framesPath) {
    const leftShowcaseImg =
      flankLeftImage || dishesFallback[0]?.image || '/images/dishes/estrella-galicia.jpg'
    const rightShowcaseImg =
      flankRightImage || dishesFallback[1]?.image || '/images/dishes/cerveza-1906.jpg'

    return (
      <section
        className={`relative py-28 px-6 md:px-12 overflow-hidden ${
          isUrbanBrewery ? 'bg-[#0A0B0E] text-[#F6F3EC]' : 'bg-[#0E1013] text-[#F5F5F3]'
        }`}
      >
        {/* Luz ambiental ámbar de fondo (Filtro Anti-Slop) */}
        {isUrbanBrewery && (
          <div
            aria-hidden="true"
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[680px] h-[340px] rounded-full bg-[#F59E0B]/10 blur-[130px] pointer-events-none"
          />
        )}

        <div className="relative z-10 max-w-6xl mx-auto">
          <div className="max-w-3xl mb-16">
            <span
              className={`text-xs uppercase tracking-[0.24em] font-bold ${
                isUrbanBrewery ? 'text-[#F59E0B]' : 'text-[#C85A32]'
              }`}
            >
              {isUrbanBrewery ? copy.tagBrewery : copy.tagKitchen}
            </span>
            <h2
              className={`text-3xl sm:text-5xl text-white mt-3 leading-[1.08] ${
                isUrbanBrewery ? 'uppercase font-black tracking-tight' : 'font-serif'
              }`}
              style={isUrbanBrewery ? { fontFamily: "'Anton', 'Sora', sans-serif" } : undefined}
            >
              {historyTitle || copy.defaultTitle}
            </h2>
            {historyText && historyText.length > 0 ? (
              <div className="mt-5 space-y-3 text-white/75 text-base sm:text-lg leading-relaxed max-w-2xl">
                {historyText.map((paragraph, i) => (
                  <p key={i}>{paragraph}</p>
                ))}
              </div>
            ) : (
              <p className="text-white/65 text-base mt-3 font-normal max-w-xl">{copy.defaultDesc}</p>
            )}
          </div>

          {/* Composición Asimétrica Orgánica sin cajas pesadas ni precios en portada */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-12 items-center">
            <div className="md:col-span-7 group">
              <div className="relative w-full aspect-[16/11] rounded-3xl overflow-hidden shadow-[0_32px_64px_rgba(0,0,0,0.65)]">
                <Image
                  src={leftShowcaseImg}
                  alt={`${restaurantName} - Ambiente exterior`}
                  fill
                  sizes="(max-width: 768px) 100vw, 58vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0B0E]/85 via-transparent to-transparent" />
                <div className="absolute bottom-5 left-6 right-6">
                  <p className="text-xs sm:text-sm text-white/90 font-medium tracking-wide">
                    {flankLeftImage ? copy.captionLeft : dishesFallback[0]?.name}
                  </p>
                </div>
              </div>
            </div>

            <div className="md:col-span-5 group md:mt-14">
              <div className="relative w-full aspect-[4/5] rounded-3xl overflow-hidden shadow-[0_32px_64px_rgba(0,0,0,0.65)]">
                <Image
                  src={rightShowcaseImg}
                  alt={`${restaurantName} - Interior y bodega`}
                  fill
                  sizes="(max-width: 768px) 100vw, 42vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0B0E]/85 via-transparent to-transparent" />
                <div className="absolute bottom-5 left-6 right-6">
                  <p className="text-xs sm:text-sm text-white/90 font-medium tracking-wide">
                    {flankRightImage ? copy.captionRight : dishesFallback[1]?.name}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    )
  }

  // Si hay frames, renderizar el Canvas Scrollytelling
  const currentFrameIndex = Math.min(
    Math.max(Math.floor(scrollProgress * (totalFrames - 1)) + 1, 1),
    totalFrames
  )
  const paddedIndex = String(currentFrameIndex).padStart(3, '0')
  const currentFrameUrl = `${framesPath}frame_${paddedIndex}.webp`

  return (
    <section ref={containerRef} className="relative h-[300vh] bg-[#0B0D10]">
      <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center">
        {/* Degradado superior de fusión */}
        <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-[#0B0D10] to-transparent z-10 pointer-events-none" />

        {/* Imagen del fotograma actual */}
        <img
          src={currentFrameUrl}
          alt={`Recorrido culinario en ${restaurantName}`}
          className="w-full h-full object-cover select-none"
        />

        {/* Capa de texto editorial superpuesta con blur */}
        <div className="absolute inset-x-0 bottom-20 z-20 text-center px-6 pointer-events-none">
          <div className="inline-block px-5 py-2 rounded-full bg-black/60 backdrop-blur-md text-white text-xs sm:text-sm font-light">
            {copy.scrollHint} ({Math.round(scrollProgress * 100)}%)
          </div>
        </div>

        {/* Degradado inferior de fusión */}
        <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-[#0B0D10] to-transparent z-10 pointer-events-none" />
      </div>
    </section>
  )
}
