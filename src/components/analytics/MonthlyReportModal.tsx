'use client'

import React, { useState, useEffect } from 'react'
import {
  X,
  Sparkles,
  BarChart3,
  Printer,
  ShieldCheck,
} from 'lucide-react'
import { MonthlyReportViewer } from './MonthlyReportViewer'

interface MonthlyReportModalProps {
  isOpen: boolean
  onClose: () => void
  slug?: string
}

export function MonthlyReportModal({ isOpen, onClose, slug = 'burger-gourmet' }: MonthlyReportModalProps) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [printMode, setPrintMode] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setLoading(true)
      setError(null)
      fetch(`/api/analytics/monthly-report?slug=${slug}`)
        .then(r => r.json())
        .then(res => {
          if (res.success && res.report) {
            setData(res.report)
          } else {
            setError(res.error || 'No se pudo generar el reporte en este momento.')
          }
        })
        .catch(() => setError('No se pudo cargar el reporte. Comprueba tu conexión e inténtalo de nuevo.'))
        .finally(() => setLoading(false))
    }
  }, [isOpen, slug])

  if (!isOpen) return null

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      setPrintMode(true)
      setTimeout(() => {
        window.print()
        setTimeout(() => setPrintMode(false), 500)
      }, 150)
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-6 animate-in fade-in select-none print:static print:p-0 print:bg-white print:overflow-visible print:block">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-6xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden text-white animate-in zoom-in-95 duration-200 print:bg-white print:border-none print:shadow-none print:max-h-none print:overflow-visible print:rounded-none print:w-full print:max-w-none">
        
        {/* Cabecera del Reporte Ejecutivo */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/90 flex flex-wrap items-center justify-between gap-3 flex-shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center font-black">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black tracking-wider uppercase text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
                  Plan Full &middot; IA Analytics
                </span>
                <span className="text-[11px] text-slate-400">Mes Septiembre 2026</span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-white leading-tight mt-0.5">
                Reporte Mensual Ejecutivo de Eficiencia Gastronómica
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-black">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>Auditoría de Rendimiento &amp; ROI</span>
            </div>

            <button
              onClick={handlePrint}
              type="button"
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Imprimir o Guardar en PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Exportar PDF</span>
            </button>
            <button
              onClick={onClose}
              type="button"
              className="p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/80 hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Cuerpo con Scroll */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-slate-300 text-xs sm:text-sm print:overflow-visible print:p-0 print:space-y-0 print:text-slate-900 print:h-auto">
          {error ? (
            <div className="py-16 text-center space-y-4">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center justify-center mx-auto text-lg font-black">
                !
              </div>
              <p className="text-slate-300 font-bold max-w-md mx-auto">{error}</p>
              <button
                onClick={onClose}
                type="button"
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-black border border-slate-700 transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          ) : loading || !data ? (
            <div className="py-20 text-center space-y-3">
              <div className="w-8 h-8 border-3 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-slate-400 font-bold">Generando auditoría y métricas de eficiencia con IA...</p>
            </div>
          ) : (
            <MonthlyReportViewer data={data} forceOpen={printMode} />
          )}
        </div>

        {/* Pie de modal */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-emerald-400" />
            <span>Métricas 100% anónimas &middot; Cumplimiento normativo RGPD</span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs transition-colors cursor-pointer"
          >
            Entendido
          </button>
        </div>

      </div>
    </div>
  )
}
