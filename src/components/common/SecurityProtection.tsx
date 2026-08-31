'use client'

import { useEffect } from 'react'

export function SecurityProtection() {
  useEffect(() => {
    // 1. Advertencia disuasoria en consola contra ataques Self-XSS e ingeniería inversa (Similar a Facebook/Discord)
    const printSecurityWarning = () => {
      const bannerStyle = 'color: #38bdf8; font-size: 26px; font-weight: 900; text-shadow: 0 2px 4px rgba(0,0,0,0.5);'
      const titleStyle = 'color: #ef4444; font-size: 32px; font-weight: 900;'
      const textStyle = 'color: #94a3b8; font-size: 14px; font-weight: 500; line-height: 1.5;'
      const alertStyle = 'color: #f59e0b; font-size: 13px; font-weight: 700;'

      try {
        console.clear()
        console.log('%cFLUXO GASTRO OS 🛡️', bannerStyle)
        console.log('%c¡ALTO! / STOP!', titleStyle)
        console.log(
          '%cEsta es una función del navegador destinada exclusivamente a desarrolladores autorizados de Fluxo. Si alguien te ha indicado copiar y pegar código aquí para "desbloquear funciones" o "acceder gratis", se trata de un intento de vulneración y robo de credenciales.',
          textStyle
        )
        console.log(
          '%cEl código fuente de este sistema, su arquitectura en tiempo real y sus algoritmos están protegidos por derechos de propiedad intelectual y normativas de ciberseguridad. Cualquier intento de extracción o inyección no autorizada queda registrado.',
          alertStyle
        )
      } catch {
        // En caso de entornos restringidos
      }
    }

    printSecurityWarning()

    // 2. Prevención de menú contextual (clic derecho) para evitar inspección rápida en modo demostración
    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return
      }
      e.preventDefault()
    }

    // 3. Bloqueo de atajos de teclado de inspección rápida (F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F12') {
        e.preventDefault()
        printSecurityWarning()
        return false
      }
      if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c')) {
        e.preventDefault()
        printSecurityWarning()
        return false
      }
      if (e.ctrlKey && (e.key === 'U' || e.key === 'u')) {
        e.preventDefault()
        printSecurityWarning()
        return false
      }
    }

    window.addEventListener('contextmenu', handleContextMenu)
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('contextmenu', handleContextMenu)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  return null
}
