'use client'

import React from 'react'
import {
  Flame,
  Clock,
  Trash2,
  Lock,
  UserX,
  HelpCircle,
  AlertTriangle
} from 'lucide-react'
import { ScrollReveal } from './ScrollReveal'

const PAIN_CARDS = [
  {
    icon: Flame,
    color: 'from-rose-500/20 to-red-600/10 text-rose-400 border-rose-500/30',
    title: 'Cocina desbordada en hora punta',
    description:
      'Platos principales marchados antes de tiempo mientras las entradas aún están en la freidora.',
    badge: 'Pase desfasado',
  },
  {
    icon: Clock,
    color: 'from-amber-500/20 to-orange-600/10 text-amber-400 border-amber-500/30',
    title: 'Mesas esperando para pagar',
    description:
      'Comensales haciendo señas durante 10 minutos porque los camareros están saturados tomando notas a mano.',
    badge: 'Rotación lenta',
  },
  {
    icon: Trash2,
    color: 'from-red-500/20 to-rose-600/10 text-red-400 border-red-500/30',
    title: 'Platos que se olvidan',
    description:
      'Suplementos o peticiones de alérgenos que no se anotaron y obligan a tirar platos a la basura.',
    badge: 'Mermas y quejas',
  },
  {
    icon: Lock,
    color: 'from-indigo-500/20 to-purple-600/10 text-indigo-400 border-indigo-500/30',
    title: 'Hardware atado a contratos',
    description:
      'TPVs lentos que cobran mensualidades obligatorias y requieren técnicos para cualquier cambio de carta.',
    badge: 'Costes fijos',
  },
  {
    icon: UserX,
    color: 'from-yellow-500/20 to-amber-600/10 text-yellow-400 border-yellow-500/30',
    title: 'Cero fidelización',
    description:
      'Decenas de clientes comen cada día en el local pero se van sin dejar su contacto ni una reseña en Google.',
    badge: 'Oportunidad perdida',
  },
  {
    icon: HelpCircle,
    color: 'from-slate-500/20 to-slate-700/10 text-slate-400 border-slate-600/30',
    title: 'Falta de métricas en tiempo real',
    description:
      'No saber qué plato es el más rentable o qué mesa lleva más de 20 minutos esperando hasta el final del servicio.',
    badge: 'Gestión a ciegas',
  },
]

export function PainSection() {
  return (
    <section className="py-20 bg-slate-950/70 border-t border-slate-800 relative overflow-hidden">
      
      {/* Luz ambiente de fondo */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-red-950/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        <ScrollReveal distance={24}>
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-black uppercase tracking-wider">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>La Realidad de un Turno Difícil</span>
            </div>
            
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
              Tu servicio no debería ser caótico
            </h2>
            
            <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto">
              El estrés de un viernes por la noche no lo causa la cocina ni tus camareros: lo causa trabajar con comandas desconectadas, papelitos que se traspapelan y TPVs rígidos.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {PAIN_CARDS.map((card, idx) => {
            const Icon = card.icon
            return (
              <ScrollReveal key={idx} delay={idx * 60} distance={20} className="h-full">
                <div className="h-full bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-slate-700/90 rounded-2xl p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 shadow-xl hover:-translate-y-1 group">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div
                        className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} border flex items-center justify-center transition-transform group-hover:scale-110`}
                      >
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-800/80 text-slate-400 border border-slate-700/60">
                        {card.badge}
                      </span>
                    </div>

                    <h3 className="text-lg font-black text-white group-hover:text-slate-100 transition-colors">
                      {card.title}
                    </h3>

                    <p className="text-sm text-slate-300 leading-relaxed font-normal">
                      {card.description}
                    </p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-800/60 flex items-center gap-2 text-xs text-slate-500">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400/60" />
                    <span>Resuelto automáticamente con Fluxo</span>
                  </div>
                </div>
              </ScrollReveal>
            )
          })}
        </div>

      </div>
    </section>
  )
}
