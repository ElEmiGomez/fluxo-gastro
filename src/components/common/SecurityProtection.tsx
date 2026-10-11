'use client'

import { useEffect } from 'react'

export function SecurityProtection() {
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.title = 'Fluxo 1.2 Test'
    }

    // 1. Advertencia disuasoria en consola contra ataques Self-XSS e ingeniería inversa (Similar a Facebook/Discord)
    const printSecurityWarning = () => {
      const bannerStyle = 'color: #38bdf8; font-size: 26px; font-weight: 900; text-shadow: 0 2px 4px rgba(0,0,0,0.5);'
      const titleStyle = 'color: #ef4444; font-size: 32px; font-weight: 900;'
      const textStyle = 'color: #94a3b8; font-size: 14px; font-weight: 500; line-height: 1.5;'
      const alertStyle = 'color: #f59e0b; font-size: 13px; font-weight: 700;'

      try {
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
  }, [])

  return null
}
