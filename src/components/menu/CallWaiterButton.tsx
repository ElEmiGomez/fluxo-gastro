'use client'

import React, { useState, useEffect } from 'react'
import { Bell, CheckCircle2, Loader2 } from 'lucide-react'
import { useTenant } from '@/components/tenant/TenantProvider'
import { createBrowserClient } from '@/lib/supabase/client'
import { getTranslation } from '@/lib/i18n'

interface CallWaiterButtonProps {
  tableNumber: string | null
  lang?: string
  isPending?: boolean
}

export function CallWaiterButton({ tableNumber, lang = 'gl', isPending }: CallWaiterButtonProps) {
  const t = (k: string) => getTranslation(lang, k)
  const { restaurant } = useTenant()
  const [isCalling, setIsCalling] = useState(false)
  const [called, setCalled] = useState(Boolean(isPending))

  useEffect(() => {
    if (isPending !== undefined) {
      setCalled(isPending)
    }
  }, [isPending])

  useEffect(() => {
    if (!tableNumber || !restaurant?.slug) return

    let isMounted = true

    const checkActiveCalls = async () => {
      try {
        const res = await fetch(`/api/service-calls?slug=${restaurant.slug}`)
        if (!res.ok) return
        const data = await res.json()
        const calls = data.calls || []
        const hasPendingCall = calls.some(
          (c: any) =>
            c.table_number?.toString() === tableNumber?.toString() &&
            c.status === 'pending'
        )
        if (isMounted) {
          setCalled(hasPendingCall)
        }
      } catch {
        // ignore network error
      }
    }

    checkActiveCalls()
    const interval = setInterval(checkActiveCalls, 3000)

    let sse: EventSource | null = null
    try {
      sse = new EventSource('/api/events')
      sse.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (
            (data.type === 'service_call_attended' || data.type === 'table_freed' || data.type === 'service_calls_cleared') &&
            (!data.table_number && !data.tableNumber ||
             data.table_number?.toString() === tableNumber?.toString() ||
             data.tableNumber?.toString() === tableNumber?.toString() ||
             data.call?.table_number?.toString() === tableNumber?.toString())
          ) {
            checkActiveCalls()
          } else if (
            data.type === 'service_call_created' &&
            (data.table_number?.toString() === tableNumber?.toString() ||
             data.call?.table_number?.toString() === tableNumber?.toString())
          ) {
            if (isMounted) setCalled(true)
          }
        } catch {
          // ignore
        }
      }
    } catch {
      // fallback
    }

    return () => {
      isMounted = false
      clearInterval(interval)
      if (sse) sse.close()
    }
  }, [tableNumber, restaurant?.slug])

  const handleCallWaiter = async () => {
    if (!tableNumber) {
      alert('Por favor selecciona el número de mesa escaneando el código QR.')
      return
    }

    setIsCalling(true)

    try {
      // 1. Notificar vía API local del servidor (Multi-dispositivo inmediato)
      await fetch('/api/service-calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: restaurant.slug,
          table_number: tableNumber,
          call_type: 'waiter_attention',
        }),
      }).catch(console.error)

      // 2. Notificar vía Supabase si está conectado
      const supabase = createBrowserClient()
      if (supabase) {
        await supabase.from('service_calls').insert({
          restaurant_id: restaurant.id,
          table_number: tableNumber,
          call_type: 'waiter',
          status: 'pending',
        })
      }
      
      setCalled(true)
    } catch (err) {
      console.error('Error al llamar al mozo:', err)
      setCalled(true)
    } finally {
      setIsCalling(false)
    }
  }

  return (
    <button
      onClick={handleCallWaiter}
      disabled={isCalling || called}
      className={`px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-xl sm:rounded-full font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all active:scale-95 whitespace-nowrap ${
        called
          ? 'bg-emerald-600 text-white animate-bounce'
          : 'bg-white hover:bg-slate-50 text-slate-800 border border-slate-300'
      }`}
      title="Llamar al mozo a la mesa"
    >
      {isCalling ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-600 flex-shrink-0" />
      ) : called ? (
        <>
          <CheckCircle2 className="w-3.5 h-3.5 text-white flex-shrink-0" />
          <span className="hidden min-[420px]:inline">{t('waiterNotified')}</span>
          <span className="min-[420px]:hidden text-[11px] font-bold">Avisado</span>
        </>
      ) : (
        <>
          <Bell className="w-3.5 h-3.5 text-blue-900 animate-pulse flex-shrink-0" />
          <span className="text-slate-800 hidden min-[420px]:inline">{t('callWaiter')}</span>
          <span className="text-slate-800 min-[420px]:hidden text-[11px] font-extrabold">Mozo</span>
        </>
      )}
    </button>
  )
}
