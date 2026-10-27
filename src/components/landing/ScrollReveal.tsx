'use client'

import React, { useEffect, useRef, useState } from 'react'

interface ScrollRevealProps {
  children: React.ReactNode
  className?: string
  delay?: number // en milisegundos (ms)
  duration?: number // en milisegundos (ms)
  distance?: number // desplazamiento en px
  blur?: number // desenfoque inicial en px (0 = sin difuminado)
  direction?: 'up' | 'down' | 'left' | 'right' | 'none'
  scale?: number // escala inicial (ej: 0.95 para zoom-in sutil)
  threshold?: number // porcentaje de visibilidad para disparar (0 a 1)
  once?: boolean // si es true, la animación ocurre solo una vez
  as?: React.ElementType
}

export function ScrollReveal({
  children,
  className = '',
  delay = 0,
  duration = 750,
  distance = 32,
  blur = 8,
  direction = 'up',
  scale = 1,
  threshold = 0.1,
  once = true,
  as: Component = 'div',
}: ScrollRevealProps) {
  const [isVisible, setIsVisible] = useState(false)
  const elementRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    // Si el usuario prefiere movimiento reducido, mostrar inmediatamente
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setIsVisible(true)
      return
    }

    const currentElem = elementRef.current
    if (!currentElem) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          if (once) {
            observer.unobserve(currentElem)
          }
        } else if (!once) {
          setIsVisible(false)
        }
      },
      {
        threshold,
        rootMargin: '0px 0px -40px 0px', // se activa un poco antes de llegar al centro
      }
    )

    observer.observe(currentElem)

    return () => {
      observer.disconnect()
    }
  }, [threshold, once])

  // Calcular la transformación inicial según la dirección
  const getInitialTransform = () => {
    if (isVisible) return 'translate3d(0, 0, 0) scale(1)'

    let transform = ''
    switch (direction) {
      case 'up':
        transform = `translate3d(0, ${distance}px, 0)`
        break
      case 'down':
        transform = `translate3d(0, -${distance}px, 0)`
        break
      case 'left':
        transform = `translate3d(${distance}px, 0, 0)`
        break
      case 'right':
        transform = `translate3d(-${distance}px, 0, 0)`
        break
      case 'none':
      default:
        transform = 'translate3d(0, 0, 0)'
        break
    }

    if (scale !== 1) {
      transform += ` scale(${scale})`
    }

    return transform
  }

  return (
    <Component
      ref={elementRef}
      className={`will-change-[transform,opacity,filter] ${className}`}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: getInitialTransform(),
        filter: isVisible ? 'blur(0px)' : `blur(${blur}px)`,
        transitionProperty: 'opacity, transform, filter',
        transitionDuration: `${duration}ms`,
        transitionDelay: `${delay}ms`,
        transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)', // Curva suave orgánica (Apple / BioMenu style)
      }}
    >
      {children}
    </Component>
  )
}
