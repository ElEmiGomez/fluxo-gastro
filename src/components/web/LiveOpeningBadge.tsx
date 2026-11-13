'use client'

import React, { useState, useEffect } from 'react'
import { getOpeningStatus, OpeningStatusResult } from '@/lib/opening-hours-calculator'
import type { OpeningSchedule } from '@/types/gastronomic-web.types'

interface LiveOpeningBadgeProps {
  schedules: OpeningSchedule[]
}

export function LiveOpeningBadge({ schedules }: LiveOpeningBadgeProps) {
  const [status, setStatus] = useState<OpeningStatusResult>(() =>
    getOpeningStatus(schedules, new Date())
  )

  useEffect(() => {
    // Actualizar el estado de apertura cada minuto
    const interval = setInterval(() => {
      setStatus(getOpeningStatus(schedules, new Date()))
    }, 60000)

    return () => clearInterval(interval)
  }, [schedules])

  return (
    <div
      aria-label={`Estado actual: ${status.label}. ${status.subLabel}`}
      className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium backdrop-blur-sm"
    >
      <span
        className={`w-2 h-2 rounded-full ${
          status.isOpen
            ? 'bg-[#22C55E] animate-pulse shadow-[0_0_8px_#22C55E]'
            : 'bg-[#EF4444]'
        }`}
      />
      <span className="text-white/90">{status.label}</span>
      {status.subLabel && (
        <span className="text-white/50 hidden sm:inline">• {status.subLabel}</span>
      )}
    </div>
  )
}
