'use client'

import React, { useState, useEffect } from 'react'
import { getOpeningStatus, OpeningStatusResult } from '@/lib/opening-hours-calculator'
import type { OpeningSchedule, WebLanguage } from '@/types/gastronomic-web.types'

interface LiveOpeningBadgeProps {
  schedules: OpeningSchedule[]
  lang?: WebLanguage
}

const BADGE_COPY: Record<
  WebLanguage,
  {
    open: string
    closed: string
    unavailable: string
    closes: string
    closedSub: string
    ariaPrefix: string
  }
> = {
  es: {
    open: 'Abierto ahora',
    closed: 'Cerrado ahora',
    unavailable: 'Consultar horario',
    closes: 'Cierra',
    closedSub: 'Ver horarios',
    ariaPrefix: 'Estado actual',
  },
  gl: {
    open: 'Aberto agora',
    closed: 'Pechado agora',
    unavailable: 'Consultar horario',
    closes: 'Pecha',
    closedSub: 'Ver horarios',
    ariaPrefix: 'Estado actual',
  },
  en: {
    open: 'Open now',
    closed: 'Closed now',
    unavailable: 'See hours',
    closes: 'Until',
    closedSub: 'See hours',
    ariaPrefix: 'Opening status',
  },
}

export function LiveOpeningBadge({ schedules, lang = 'es' }: LiveOpeningBadgeProps) {
  const [status, setStatus] = useState<OpeningStatusResult>(() =>
    getOpeningStatus(schedules, new Date())
  )

  useEffect(() => {
    setStatus(getOpeningStatus(schedules, new Date()))
    const interval = setInterval(() => {
      setStatus(getOpeningStatus(schedules, new Date()))
    }, 60000)

    return () => clearInterval(interval)
  }, [schedules])

  const copy = BADGE_COPY[lang] || BADGE_COPY.es
  const closeMatch = status.subLabel?.match(/(\d{1,2}:\d{2})/)
  const closeTime = closeMatch ? `${closeMatch[1]}h` : ''

  const primaryLabel =
    schedules.length === 0
      ? copy.unavailable
      : status.isOpen
      ? copy.open
      : copy.closed

  const secondaryLabel = status.isOpen && closeTime ? closeTime : !status.isOpen ? copy.closedSub : ''

  return (
    <div
      aria-label={`${copy.ariaPrefix}: ${primaryLabel}${secondaryLabel ? ` (${secondaryLabel})` : ''}`}
      className="inline-flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 rounded-full bg-white/[0.06] border border-white/10 text-[10px] sm:text-xs font-medium backdrop-blur-sm whitespace-nowrap flex-shrink-0"
      style={{ fontFamily: "'DM Sans', 'Inter', sans-serif" }}
    >
      <span
        aria-hidden="true"
        suppressHydrationWarning
        className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full flex-shrink-0 ${
          status.isOpen
            ? 'bg-[#22C55E] animate-pulse shadow-[0_0_8px_#22C55E]'
            : 'bg-[#EF4444]'
        }`}
      />
      <span suppressHydrationWarning className="text-white/95 font-semibold tracking-tight">
        {primaryLabel}
      </span>
      {status.isOpen && closeTime && (
        <span
          suppressHydrationWarning
          className="text-white/60 tabular-nums font-medium"
        >
          <span className="hidden sm:inline">· {copy.closes} </span>
          <span className="sm:hidden">· </span>
          {closeTime}
        </span>
      )}
      {!status.isOpen && (
        <span suppressHydrationWarning className="text-white/50 hidden sm:inline">
          · {copy.closedSub}
        </span>
      )}
    </div>
  )
}
