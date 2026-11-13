'use client'

import React, { useRef, useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { WebLanguage } from '@/types/gastronomic-web.types'

export interface DrinkMockupItem {
  id: string
  name: string
  name_gl: string
  name_en: string
  tag: string
  tag_gl: string
  tag_en: string
  desc: string
  desc_gl: string
  desc_en: string
  image: string
}

export const JARA_TUSAS_DRINK_MOCKUPS: DrinkMockupItem[] = [
  {
    id: 'estrella-bodega',
    name: 'Caña y Copa Estrella Galicia de Bodega',
    name_gl: 'Caña e Copa Estrella Galicia de Adega',
    name_en: 'Estrella Galicia Cellar Draft Beer',
    tag: 'Bodega',
    tag_gl: 'Adega',
    tag_en: 'Cellar Draft',
    desc: 'Directa de tanque refrigerado, con su crema perfecta y la temperatura justa para la primera o la tercera ronda.',
    desc_gl: 'Directa de tanque refrixerado, coa súa crema perfecta e a temperatura xusta para a primeira ou a terceira rolda.',
    desc_en: 'Direct from refrigerated cellar tanks, with silky crema and the perfect cold pour for any round.',
    image: '/images/dishes/estrella-galicia.jpg',
  },
  {
    id: '1906-red-vintage',
    name: '1906 Red Vintage «La Colorada»',
    name_gl: '1906 Red Vintage «A Colorada»',
    name_en: '1906 Red Vintage «La Colorada»',
    tag: 'Reserva',
    tag_gl: 'Reserva',
    tag_en: 'Special Reserve',
    desc: 'Tostada, intensa y de trago largo. La favorita para alargar la tarde con calma y buena charla.',
    desc_gl: 'Tostada, intensa e de trago longo. A favorita para alargar a tarde con acougo e boa conversa.',
    desc_en: 'Rich roasted malt and caramel notes. The local favorite for stretching out the evening.',
    image: '/images/dishes/cerveza-1906.jpg',
  },
  {
    id: '1906-black-coupage',
    name: '1906 Black Coupage',
    name_gl: '1906 Black Coupage',
    name_en: '1906 Black Coupage Dark Beer',
    tag: 'Especial',
    tag_gl: 'Especial',
    tag_en: 'Craft Stout',
    desc: 'Carácter tostado y notas de café y cacao para los que buscan un sabor diferente en la sobremesa.',
    desc_gl: 'Carácter tostado e notas de café e cacao para os que buscan un sabor diferente na sobremesa.',
    desc_en: 'Bold roasted character with hints of espresso and dark cocoa for an after-dinner pour.',
    image: '/images/dishes/cerveza-artesana.jpg',
  },
  {
    id: 'vermu-sifon',
    name: 'Vermú de Grifo con Sifón y Cítrico',
    name_gl: 'Vermú de Grifo con Sifón e Cítrico',
    name_en: 'Draft Vermouth with Siphon & Citrus',
    tag: 'Aperitivo',
    tag_gl: 'Aperitivo',
    tag_en: 'Aperitif',
    desc: 'El aperitivo indispensable: servido con hielo, toque de sifón, rodaja de naranja y aceituna antes de comer.',
    desc_gl: 'O aperitivo indispensable: servido con xeo, toque de sifón, rodaja de laranxa e aceituna antes de xantar.',
    desc_en: 'The classic aperitif: served over ice with a splash of siphon, fresh citrus, and olive.',
    image: '/images/dishes/vermu-preparado.jpg',
  },
  {
    id: 'vinos-gallegos',
    name: 'Albariño y Mencía por Copa',
    name_gl: 'Albariño e Mencía por Copa',
    name_en: 'Albariño & Mencía by the Glass',
    tag: 'D.O. Galicia',
    tag_gl: 'D.O. Galicia',
    tag_en: 'Galician D.O.',
    desc: 'Blancos y tintos de bodegas gallegas servidos por copa, ideales para picotear algo al paso.',
    desc_gl: 'Brancos e tintos de adegas galegas servidos por copa, ideais para picotear algo ao paso.',
    desc_en: 'Crisp whites and red wines from Galician bodegas poured by the glass, perfect with casual tapas.',
    image: '/images/dishes/copa-albarino-rustica.jpg',
  },
  {
    id: 'licores-combinados',
    name: 'Licores Tradicionales y Combinados',
    name_gl: 'Licores Tradicionais e Combinados',
    name_en: 'Traditional Liqueurs & Highballs',
    tag: 'Sobremesa',
    tag_gl: 'Sobremesa',
    tag_en: 'After-Dinner',
    desc: 'Licor café casero, hierbas tradicionales y combinados en copa balón para cerrar la noche entre amigos.',
    desc_gl: 'Licor café caseiro, herbas tradicionais e combinados en copa balón para pechar a noite entre amigos.',
    desc_en: 'Homemade coffee liqueur, traditional herbal spirits, and classic drinks to close the night.',
    image: '/images/dishes/combinados.jpg',
  },
]

interface DrinkMockupsMarqueeProps {
  lang?: WebLanguage
  onOpenMenu?: () => void
  menuUrl?: string
}

export function DrinkMockupsMarquee({
  lang = 'es',
  onOpenMenu,
  menuUrl = '/p/bar-jaratusas?mesa=0',
}: DrinkMockupsMarqueeProps) {
  const [isPaused, setIsPaused] = useState(false)
  const marqueeRef = useRef<HTMLDivElement>(null)

  // Duplicar elementos para un bucle continuo sin saltos visuales
  const items = [...JARA_TUSAS_DRINK_MOCKUPS, ...JARA_TUSAS_DRINK_MOCKUPS]

  const title = lang === 'gl'
    ? 'Canas ben tiradas, viños da terra e aperitivos de sempre'
    : lang === 'en'
    ? 'Fresh draft pours, regional wines, and classic aperitifs'
    : 'Cañas bien tiradas, vinos de la tierra y aperitivos de siempre'

  const subtitle = lang === 'gl'
    ? 'Cervexa de adega en copa fría, vermú preparado como manda a tradición e viños galegos para acompañar a conversa.'
    : lang === 'en'
    ? 'Cellar beer in chilled glassware, classic vermouth with a splash of siphon, and Galician wines to share around the bar.'
    : 'Cerveza de bodega en copa fría, vermú preparado como manda la tradición y vinos gallegos para acompañar la conversación.'

  const ctaText = lang === 'gl'
    ? 'Ver Carta'
    : lang === 'en'
    ? 'View Menu'
    : 'Ver Carta'

  return (
    <section
      id="tragos-carta"
      aria-label={title}
      className="py-16 md:py-24 bg-[#F6F6F3] border-b border-slate-200/80 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10 text-center">
        <span className="text-[11px] font-black uppercase tracking-widest text-[#1D4ED8] bg-blue-50 px-3 py-1 rounded-full border border-blue-200/80 inline-block mb-3">
          {lang === 'gl' ? 'O ritmo da barra' : lang === 'en' ? 'At the Bar' : 'El ritmo de la barra'}
        </span>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-normal text-[#0F172A] tracking-tight font-serif">
          {title}
        </h2>
        <p className="mt-3 max-w-2xl mx-auto text-sm sm:text-base text-slate-600 leading-relaxed font-sans">
          {subtitle}
        </p>
      </div>

      {/* Carrusel Deslizante Continuo a 60fps con pausa en hover / toque */}
      <div
        className="relative w-full cursor-grab active:cursor-grabbing select-none"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        {/* Degradados laterales para desvanecimiento suave */}
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 sm:w-16 md:w-24 bg-gradient-to-r from-[#F6F6F3] to-transparent z-10" />
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 sm:w-16 md:w-24 bg-gradient-to-l from-[#F6F6F3] to-transparent z-10" />

        <div
          ref={marqueeRef}
          className={`flex gap-5 w-max will-change-transform ${
            isPaused ? '[animation-play-state:paused]' : ''
          } animate-marquee-fast hover:[animation-play-state:paused]`}
          style={{
            animation: 'marqueeContinuous 38s linear infinite',
            animationPlayState: isPaused ? 'paused' : 'running',
          }}
        >
          {items.map((drink, idx) => {
            const drinkName = lang === 'gl' ? drink.name_gl : lang === 'en' ? drink.name_en : drink.name
            const drinkTag = lang === 'gl' ? drink.tag_gl : lang === 'en' ? drink.tag_en : drink.tag
            const drinkDesc = lang === 'gl' ? drink.desc_gl : lang === 'en' ? drink.desc_en : drink.desc

            return (
              <div
                key={`${drink.id}-${idx}`}
                className="w-[280px] sm:w-[320px] flex-shrink-0 bg-white rounded-[22px] border border-slate-200/80 p-4 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="relative aspect-[4/3] w-full rounded-[16px] overflow-hidden bg-slate-100 mb-3.5">
                    <Image
                      src={drink.image}
                      alt={drinkName}
                      fill
                      sizes="(max-width: 640px) 280px, 320px"
                      className="object-cover transition-transform duration-500 hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute top-2.5 right-2.5 bg-white/95 backdrop-blur-xs text-[#0F172A] text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border border-slate-200/80 shadow-2xs">
                      {drinkTag}
                    </div>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-[#0F172A] tracking-tight leading-snug">
                    {drinkName}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                    {drinkDesc}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-[#1D4ED8] font-bold">
                  <span>Barra & Terraza</span>
                  <span className="text-slate-400 font-normal">Precio en Carta →</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Botón Central Inferior a Mesa 0 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 text-center">
        <div className="inline-flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href={menuUrl}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-full bg-[#1D4ED8] hover:bg-[#1E3A8A] text-white font-bold text-sm tracking-wide shadow-md hover:shadow-lg transition-all duration-200 active:scale-95 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#1D4ED8]"
          >
            <span>{ctaText}</span>
          </Link>
          <span className="text-xs text-slate-500 font-medium">
            {lang === 'gl'
              ? 'Con prezos actualizados, formatos de ración e os 14 alérxenos oficiais'
              : lang === 'en'
              ? 'With updated prices, portion sizes, and official EU allergens'
              : 'Con precios actualizados, formatos de ración y los 14 alérgenos oficiales'}
          </span>
        </div>
      </div>

      <style jsx global>{`
        @keyframes marqueeContinuous {
          0% {
            transform: translate3d(0, 0, 0);
          }
          100% {
            transform: translate3d(-50%, 0, 0);
          }
        }
      `}</style>
    </section>
  )
}
