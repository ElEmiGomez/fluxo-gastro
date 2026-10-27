'use client'

import { useEffect, useRef } from 'react'

/**
 * useDeckHeights
 * Iguala a tiempo de ejecución la altura de todas las tarjetas de un mazo
 * sticky en móvil (<768px).
 *
 * Por qué: las clases min-h solo fijan un mínimo. En el dispositivo real
 * (métricas de fuente de iOS, zoom de texto del sistema, ajustes de
 * accesibilidad) el contenido de alguna tarjeta puede crecer por encima del
 * mínimo y medir más que sus hermanas. Entonces, al apilarse, la tarjeta más
 * alta asoma su pie (texto) por debajo de la tarjeta que la cubre: textos de
 * dos tarjetas visibles a la vez. Midiendo en el dispositivo y fijando en
 * todas la altura máxima real, cada tarjeta cubre por completo a la anterior,
 * igual que en FeatureTabs.
 *
 * En PC (>=768px) no hace nada: el grid ya iguala alturas por fila.
 */
export function useDeckHeights() {
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const apply = () => {
      const cards = Array.from(el.children) as HTMLElement[]
      if (!cards.length) return

      // Limpiar siempre primero: en PC no debe quedar altura fijada
      cards.forEach((c) => {
        c.style.height = ''
      })

      if (!window.matchMedia('(max-width: 767px)').matches) return

      const max = Math.max(...cards.map((c) => c.offsetHeight))
      if (max > 0) {
        cards.forEach((c) => {
          c.style.height = `${max}px`
        })
      }
    }

    // Medir tras hidratar, tras cargar fuentes y al redimensionar/girar
    apply()
    const onLoad = () => apply()
    let fontReady: Promise<unknown> | undefined
    if (typeof document !== 'undefined' && 'fonts' in document) {
      fontReady = document.fonts.ready
      document.fonts.ready.then(apply).catch(() => {})
    }
    let t: ReturnType<typeof setTimeout> | undefined
    const onResize = () => {
      if (t) clearTimeout(t)
      t = setTimeout(apply, 150)
    }
    window.addEventListener('load', onLoad)
    window.addEventListener('resize', onResize)
    window.addEventListener('orientationchange', onResize)

    return () => {
      window.removeEventListener('load', onLoad)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('orientationchange', onResize)
      if (t) clearTimeout(t)
      void fontReady
    }
  }, [])

  return ref
}
