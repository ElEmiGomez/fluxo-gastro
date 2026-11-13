'use client'

import React, { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import type { DishShowcaseItem, RestaurantArchetype, WebLanguage } from '@/types/gastronomic-web.types'

interface CanvasScrollytellingProps {
  framesPath?: string // Ruta base de fotogramas (ej. "/assets/frames/casamar/")
  totalFrames?: number // Cantidad de fotogramas (por defecto 120)
  dishesFallback: DishShowcaseItem[]
  restaurantName: string
  archetype?: RestaurantArchetype
  historyTitle?: string
  historyText?: string[]
  flankLeftImage?: string
  flankRightImage?: string
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
  },
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
  lang = 'es',
}: CanvasScrollytellingProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [hasFrames] = useState<boolean>(Boolean(framesPath))
  const [scrollProgress, setScrollProgress] = useState<number>(0)

  const isUrbanBrewery = archetype === 'urban_street' || archetype === 'tavern'
  const copy = SCROLL_I18N[lang] || SCROLL_I18N.es

  // 1. Manejo del Scroll e Interpolación a 60 fps
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
      // Interpolación suave (lerp) a 60fps
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

  // Si no hay frames configurados, se despliega el Recorrido Sensorial con Profundidad (Patrón 4.2 de Rodrigo Olivares)
  // Cumpliendo DEC-39: 0 precios en portada y Filtro Anti-Slop (sin bordes artificiales pesados)
  if (!hasFrames || !framesPath) {
    const leftShowcaseImg = flankLeftImage || dishesFallback[0]?.image || '/images/dishes/estrella-galicia.jpg'
    const rightShowcaseImg = flankRightImage || dishesFallback[1]?.image || '/images/dishes/cerveza-1906.jpg'

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
