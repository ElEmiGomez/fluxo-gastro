'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Wifi, WifiOff, RefreshCw, AlertTriangle, ShieldCheck } from 'lucide-react'
import {
  getPendingMutations,
  processSyncQueue,
  subscribeToQueueChanges,
  QueuedMutation,
  isQueueSyncing,
} from '@/lib/offline-sync-queue'

interface OfflineStatusBannerProps {
  slug: string
  isSimulatedOffline: boolean
  onToggleSimulatedOffline: () => void
  onSyncComplete?: () => void
  customHeaders?: Record<string, string>
}

export function OfflineStatusBanner({
  slug,
  isSimulatedOffline,
  onToggleSimulatedOffline,
  onSyncComplete,
  customHeaders,
}: OfflineStatusBannerProps) {
  const [isOnline, setIsOnline] = useState<boolean>(true)
  const [pendingCount, setPendingCount] = useState<number>(0)
  const [isSyncing, setIsSyncing] = useState<boolean>(false)
  const [lastSyncResult, setLastSyncResult] = useState<string | null>(null)

  const refreshQueueStatus = useCallback(async () => {
    try {
      const pending = await getPendingMutations()
      setPendingCount(pending.length)
      setIsSyncing(isQueueSyncing())
    } catch {
      // Fallback
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return

    setIsOnline(navigator.onLine)

    const handleOnline = () => {
      setIsOnline(true)
      handleTriggerSync()
    }
    const handleOffline = () => {
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    const unsubscribe = subscribeToQueueChanges(() => {
      refreshQueueStatus()
    })

    refreshQueueStatus()

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      unsubscribe()
    }
  }, [refreshQueueStatus])

  const effectiveOffline = isSimulatedOffline || !isOnline

  const handleTriggerSync = async () => {
    if (effectiveOffline) return
    setIsSyncing(true)
    const res = await processSyncQueue(effectiveOffline, customHeaders)
    setIsSyncing(false)
    await refreshQueueStatus()
    if (res.processed > 0) {
      setLastSyncResult(`Sincronizados ${res.succeeded}/${res.processed} eventos`)
      setTimeout(() => setLastSyncResult(null), 3500)
      if (onSyncComplete) onSyncComplete()
    }
  }

  return (
    <div className="w-full bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-xs px-3 py-1.5 flex flex-wrap items-center justify-between gap-2 shadow-sm text-slate-200">
      {/* Indicador de estado */}
      <div className="flex items-center gap-2">
        {effectiveOffline ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <WifiOff className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>Modo Terraza Offline {pendingCount > 0 ? `(${pendingCount} en cola)` : ''}</span>
          </span>
        ) : isSyncing ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
            <RefreshCw className="w-3.5 h-3.5 text-blue-400 animate-spin" />
            <span>Sincronizando con sala...</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <Wifi className="w-3.5 h-3.5 text-emerald-400" />
            <span>En línea</span>
          </span>
        )}

        {lastSyncResult && (
          <span className="text-[11px] text-emerald-400 font-medium hidden sm:inline">
            ✓ {lastSyncResult}
          </span>
        )}
      </div>

      {/* Controles de Simulación y Forzar Sincronización */}
      <div className="flex items-center gap-2">
        {pendingCount > 0 && !effectiveOffline && (
          <button
            type="button"
            onClick={handleTriggerSync}
            disabled={isSyncing}
            className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] flex items-center gap-1 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            title="Procesar cola pendiente ahora"
          >
            <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>Forzar sincronización ({pendingCount})</span>
          </button>
        )}

        {/* Toggle para simular corte de red */}
        <label className="flex items-center gap-1.5 cursor-pointer select-none bg-slate-800/80 hover:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700/80 text-[11px] text-slate-300 transition-colors">
          <input
            type="checkbox"
            checked={isSimulatedOffline}
            onChange={onToggleSimulatedOffline}
            className="w-3.5 h-3.5 accent-amber-500 rounded cursor-pointer"
          />
          <span className={isSimulatedOffline ? 'text-amber-400 font-bold' : ''}>
            Simular corte terraza
          </span>
        </label>
      </div>
    </div>
  )
}
