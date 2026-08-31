'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowLeft, Home, QrCode } from 'lucide-react'
import { FluxoLogo } from '@/components/common/FluxoLogo'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 selection:bg-orange-500">
      <div className="max-w-md w-full text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
        
        {/* Icono Fluxo */}
        <div className="flex justify-center">
          <FluxoLogo size={72} />
        </div>

        {/* Textos */}
        <div className="space-y-2">
          <span className="text-xs font-black uppercase tracking-widest text-orange-400">
            Error 404 &middot; No Encontrado
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight">
            Mesa o plato fuera de carta
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed">
            El enlace o código QR al que intentas acceder no existe, ha cambiado de mesa o la sesión ha sido archivada.
          </p>
        </div>

        {/* Acciones */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/"
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
          >
            <Home className="w-4 h-4 text-slate-400" />
            <span>Volver al Inicio</span>
          </Link>

          <Link
            href="/menu/burger-gourmet?table=1"
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 transition-all active:scale-95"
          >
            <QrCode className="w-4 h-4" />
            <span>Ver Carta Demo</span>
          </Link>
        </div>

        <div className="pt-8 border-t border-slate-800/80 text-[11px] text-slate-500">
          Fluxo &middot; Si eres comensal en el local, consulta con el personal.
        </div>

      </div>
    </div>
  )
}
