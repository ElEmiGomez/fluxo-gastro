'use client'

import React, { useState, useEffect } from 'react'
import { Bell, CheckCircle2, Loader2, AlertCircle } from 'lucide-react'
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
  const [showErrorModal, setShowErrorModal] = useState(false)

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
          if (data.type === 'connected') return

          if (
            (data.type === 'service_call_attended' || data.type === 'table_freed' || data.type === 'service_calls_cleared') &&
            (!data.table_number && !data.tableNumber ||
             data.table_number?.toString() === tableNumber?.toString() ||
             data.tableNumber?.toString() === tableNumber?.toString() ||
             data.call?.table_number?.toString() === tableNumber?.toString())
          ) {
            checkActiveCalls()
          } else if (
            (data.type === 'service_call_created' || data.type === 'service_call') &&
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
      // Notificar vía API local del servidor (SSOT en /api/service-calls)
      const res = await fetch('/api/service-calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: restaurant.slug,
          table_number: tableNumber,
          call_type: 'waiter_attention',
        }),
      })

      if (res.ok) {
        setCalled(true)
      } else {
        const errData = await res.json().catch(() => ({}))
        console.warn('Service call error response:', res.status, errData)
        setCalled(false)
        setShowErrorModal(true)
      }
    } catch (err) {
      console.error('Error al llamar al mozo:', err)
      setCalled(false)
      setShowErrorModal(true)
    } finally {
      setIsCalling(false)
    }
  }

  return (
    <>
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

      {showErrorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-200 text-slate-900 animate-in zoom-in-95 duration-200">
            <div className="p-5 space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Aviso no enviado</h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Hubo un inconveniente al llamar al personal. Por favor avisa directamente al camarero o intenta nuevamente.
                  </p>
                </div>
              </div>
            </div>
            <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setShowErrorModal(false)}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors shadow-sm"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
