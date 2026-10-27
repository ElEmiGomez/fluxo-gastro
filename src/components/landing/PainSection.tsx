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
    color: 'from-rose-50 to-red-50 text-rose-600 border-rose-200',
    title: 'Cocina desbordada en hora punta',
    description:
      'Platos principales marchados antes de tiempo mientras las entradas aún están en la freidora.',
    badge: 'Pase desfasado',
  },
  {
    icon: Clock,
    color: 'from-amber-50 to-orange-50 text-amber-600 border-amber-200',
    title: 'Mesas esperando para pagar',
    description:
      'Comensales haciendo señas durante 10 minutos porque los camareros están saturados tomando notas a mano.',
    badge: 'Rotación lenta',
  },
  {
    icon: Trash2,
    color: 'from-red-50 to-rose-50 text-red-600 border-red-200',
    title: 'Platos que se olvidan',
    description:
      'Suplementos o peticiones de alérgenos que no se anotaron y obligan a tirar platos a la basura.',
    badge: 'Mermas y quejas',
  },
  {
    icon: Lock,
    color: 'from-indigo-50 to-purple-50 text-indigo-600 border-indigo-200',
    title: 'Hardware atado a contratos',
    description:
      'TPVs lentos que cobran mensualidades obligatorias y requieren técnicos para cualquier cambio de carta.',
    badge: 'Costes fijos',
  },
  {
    icon: UserX,
    color: 'from-amber-50 to-yellow-50 text-amber-600 border-amber-200',
    title: 'Cero fidelización',
    description:
      'Decenas de clientes comen cada día en el local pero se van sin dejar su contacto ni una reseña en Google.',
    badge: 'Oportunidad perdida',
  },
  {
    icon: HelpCircle,
    color: 'from-slate-100 to-slate-200 text-slate-600 border-slate-200',
    title: 'Falta de métricas en tiempo real',
    description:
      'No saber qué plato es el más rentable o qué mesa lleva más de 20 minutos esperando hasta el final del servicio.',
    badge: 'Gestión a ciegas',
  },
]

export function PainSection() {
  return (
    <section className="py-12 sm:py-20 bg-slate-50 border-t border-slate-200 relative overflow-hidden">
      
      {/* Luz ambiente de fondo */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-rose-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        <ScrollReveal distance={24}>
          <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-16 space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-black uppercase tracking-wider">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>La Realidad de un Turno Difícil</span>
            </div>
            
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
              Tu servicio no debería ser caótico
            </h2>
            
            <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto">
              El estrés de un viernes por la noche no lo causa la cocina ni tus camareros: lo causa trabajar con comandas desconectadas, papelitos que se traspapelan y TPVs rígidos.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {PAIN_CARDS.map((card, idx) => {
            const Icon = card.icon
            return (
              <ScrollReveal key={idx} delay={idx * 60} distance={20} className="h-full">
                <div className="h-full bg-white hover:bg-slate-50/60 border border-slate-200 hover:border-slate-300 rounded-2xl p-5 sm:p-7 flex flex-col justify-between transition-all duration-300 shadow-sm hover:shadow-lg hover:-translate-y-1 group">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div
                        className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} border flex items-center justify-center transition-transform group-hover:scale-110 shadow-xs`}
                      >
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        {card.badge}
                      </span>
                    </div>

                    <h3 className="text-lg font-black text-slate-900 group-hover:text-blue-600 transition-colors">
                      {card.title}
                    </h3>

                    <p className="text-sm text-slate-600 leading-relaxed font-normal">
                      {card.description}
                    </p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="text-slate-600 font-medium">Resuelto automáticamente con Fluxo</span>
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
