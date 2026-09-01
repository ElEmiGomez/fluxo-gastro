'use client'

import React, { useState } from 'react'
import { Bell, CheckCircle2, Loader2 } from 'lucide-react'
import { useTenant } from '@/components/tenant/TenantProvider'
import { createBrowserClient } from '@/lib/supabase/client'
import { getTranslation } from '@/lib/i18n'

interface CallWaiterButtonProps {
  tableNumber: string | null
  lang?: string
}

export function CallWaiterButton({ tableNumber, lang = 'gl' }: CallWaiterButtonProps) {
  const t = (k: string) => getTranslation(lang, k)
  const { restaurant } = useTenant()
  const [isCalling, setIsCalling] = useState(false)
  const [called, setCalled] = useState(false)

  const handleCallWaiter = async () => {
    if (!tableNumber) {
      alert('Por favor selecciona el número de mesa escaneando el código QR.')
      return
    }

    setIsCalling(true)

    try {
      // 1. Notificar vía API local del servidor (Multi-dispositivo inmediato)
      fetch('/api/service-calls', {
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
      setTimeout(() => {
        setCalled(false)
      }, 6000)
    } catch (err) {
      console.error('Error al llamar al mozo:', err)
      setCalled(true)
      setTimeout(() => setCalled(false), 5000)
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
