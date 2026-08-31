'use client'

import React, { useEffect } from 'react'
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react'

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Captured client exception in Fluxo:', error)
  }, [error])

  const handleClearCacheAndReset = () => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.clear()
        sessionStorage.clear()
      }
    } catch {
      // ignore
    }
    reset()
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 text-slate-900 select-none">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 text-center space-y-4 animate-in zoom-in-95 duration-200">
        <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-7 h-7 stroke-[2.2]" />
        </div>
        
        <div>
          <h2 className="text-lg font-black text-slate-900">
            Actualización del Menú
          </h2>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Hemos actualizado la carta y los precios en vivo. Haz clic abajo para sincronizar tu pantalla:
          </p>
        </div>

        {error?.message && (
          <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200 text-[11px] text-slate-600 font-mono break-all text-left">
            Detalle: {error.message}
          </div>
        )}

        <div className="space-y-2 pt-2">
          <button
            onClick={handleClearCacheAndReset}
            className="w-full py-3.5 px-4 rounded-2xl bg-blue-900 hover:bg-blue-800 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20 transition-transform active:scale-95"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Sincronizar y Recargar Carta</span>
          </button>
        </div>
      </div>
    </div>
  )
}
