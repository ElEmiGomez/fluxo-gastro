'use client'

import { useState, useEffect, useRef } from 'react'

interface ScrollDirectionOptions {
  threshold?: number
  initialDirection?: 'up' | 'down'
}

export function useScrollDirection(options: ScrollDirectionOptions = {}) {
  const { threshold = 12, initialDirection = 'up' } = options
  const [isScrollingDown, setIsScrollingDown] = useState(initialDirection === 'down')
  const [isAtTop, setIsAtTop] = useState(true)
  const [scrollY, setScrollY] = useState(0)

  const prevScrollYRef = useRef(0)
  const tickingRef = useRef(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleScroll = () => {
      if (tickingRef.current) return

      tickingRef.current = true
      window.requestAnimationFrame(() => {
        const currentScrollY = Math.max(0, window.scrollY || window.pageYOffset || 0)
        const diff = currentScrollY - prevScrollYRef.current

        setScrollY(currentScrollY)

        // Si estamos cerca de la cabecera (tope de la carta)
        if (currentScrollY <= 40) {
          setIsAtTop(true)
          setIsScrollingDown(false)
        } else {
          setIsAtTop(false)

          // Solo cambiar dirección si se supera el umbral de histéresis
          if (Math.abs(diff) >= threshold) {
            setIsScrollingDown(diff > 0)
          }
        }

        prevScrollYRef.current = currentScrollY
        tickingRef.current = false
      })
    }

    // Inicialización del estado inicial
    prevScrollYRef.current = Math.max(0, window.scrollY || 0)
    setIsAtTop(prevScrollYRef.current <= 40)

    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [threshold])

  return { isScrollingDown, isAtTop, scrollY }
}
