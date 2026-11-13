import React from 'react'
import Link from 'next/link'
import { UtensilsCrossed, ArrowLeft, Compass } from 'lucide-react'

export default function WebNotFound() {
  return (
    <main className="min-h-screen bg-[#0B0D10] text-[#F6F3EC] flex items-center justify-center p-6 selection:bg-[#C85A32] selection:text-white">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-[#C85A32]">
          <UtensilsCrossed className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-[11px] uppercase tracking-[0.28em] text-[#C85A32] font-semibold">
            Error 404 · Local No Encontrado
          </span>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-white tracking-tight">
            Mesa Fuera de Servicio
          </h1>
          <p className="text-white/60 text-sm leading-relaxed">
            La web del establecimiento que buscas no está disponible o el identificador del local no existe en el sistema Fluxo.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/web/casa-mar-da-vila"
            className="px-6 py-3 rounded-xl bg-[#C85A32] hover:bg-[#b04d28] text-white text-xs font-semibold tracking-wider uppercase transition shadow-lg shadow-[#C85A32]/20 flex items-center justify-center gap-2"
          >
            <Compass className="w-4 h-4" />
            <span>Ver Casa Mar da Vila</span>
          </Link>
          <Link
            href="/web/bar-jaratusas"
            className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-xs font-medium tracking-wider uppercase transition flex items-center justify-center gap-2"
          >
            <span>Ver Bar Jara-Tusas</span>
          </Link>
        </div>

        <div className="pt-8 border-t border-white/10 text-xs text-white/40">
          <span>Ecosistema Tecnológico Gastronómico · </span>
          <span className="font-bold text-white/70">FLUXO</span>
        </div>
      </div>
    </main>
  )
}
