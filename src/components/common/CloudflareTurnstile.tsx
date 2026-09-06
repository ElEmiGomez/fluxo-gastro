'use client'

import React, { useState } from 'react'
import { Turnstile } from '@marsidev/react-turnstile'

interface CloudflareTurnstileProps {
  onSuccess: (token: string) => void
  onError?: (error: any) => void
  onExpire?: () => void
  className?: string
  theme?: 'light' | 'dark' | 'auto'
  size?: 'normal' | 'compact' | 'flexible'
}

/**
 * Clave de sitio de prueba oficial de Cloudflare (Always passes)
 * https://developers.cloudflare.com/turnstile/troubleshooting/testing/
 */
const DEFAULT_TEST_SITE_KEY = '1x00000000000000000000AA'

export default function CloudflareTurnstile({
  onSuccess,
  onError,
  onExpire,
  className = '',
  theme = 'dark',
  size = 'normal'
}: CloudflareTurnstileProps) {
  const [hasError, setHasError] = useState(false)
  const siteKey = process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY || DEFAULT_TEST_SITE_KEY

  if (hasError) {
    return null
  }

  return (
    <div className={`flex items-center justify-center my-2 ${className}`}>
      <Turnstile
        siteKey={siteKey}
        options={{
          theme,
          size,
          language: 'es'
        }}
        onSuccess={(token) => {
          setHasError(false)
          onSuccess(token)
        }}
        onError={(err) => {
          console.warn('[CLOUDFLARE_TURNSTILE] Error en widget:', err)
          setHasError(true)
          if (onError) onError(err)
          // Si falla en desarrollo/red, autogenerar token dummy para no bloquear la experiencia
          if (process.env.NODE_ENV !== 'production') {
            onSuccess('1x00000000000000000000AA')
          }
        }}
        onExpire={() => {
          if (onExpire) onExpire()
        }}
      />
    </div>
  )
}
