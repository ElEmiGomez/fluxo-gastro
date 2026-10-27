'use client'

import React from 'react'
import { Smartphone, ChefHat, QrCode, Star, Calculator, CheckCircle2, ArrowRight } from 'lucide-react'
import { ScrollReveal } from './ScrollReveal'

/**
 * FeatureTabs
 * Sección explicativa de los 5 módulos de Fluxo (sin simuladores interactivos).
 * La demostración práctica vive en HeroSandbox (Carta · Mozo · Cocina).
 */

interface FeatureTabsProps {
  onOpenPilotModal: (plan?: string) => void
}

interface ModuleInfo {
  number: number
  icon: React.ElementType
  iconCls: string
  title: string
  summary: string
  points: { strong: string; text: string }[]
}

const MODULES: ModuleInfo[] = [
  {
    number: 1,
    icon: Smartphone,
    iconCls: 'bg-blue-50 text-blue-600 border-blue-200',
    title: 'Comandero Móvil',
    summary: 'Tus camareros controlan la sala desde su propio móvil y saben al instante qué mesa necesita atención.',
    points: [
      { strong: 'Mapa de mesas por colores:', text: 'Libre, Ocupada y Pagada en Sobremesa.' },
      { strong: 'Marcha de platos en un toque:', text: 'cocina recibe el aviso sin desplazamientos.' },
      { strong: 'Validación antes de cocina:', text: 'ningún pedido entra sin que el camarero lo revise.' },
    ],
  },
  {
    number: 2,
    icon: ChefHat,
    iconCls: 'bg-orange-50 text-orange-600 border-orange-200',
    title: 'Monitor de Cocina',
    summary: 'Pantalla dividida por tiempos para que cada plato salga en su momento, sin papeles ni gritos.',
    points: [
      { strong: 'Bloqueo de segundos platos:', text: 'postres y segundos no se emplatan antes de tiempo.' },
      { strong: 'Semáforo de tiempos:', text: 'verde, ámbar y alerta roja según la espera.' },
      { strong: 'Botones grandes:', text: 'pensados para manos mojadas o con guantes.' },
    ],
  },
  {
    number: 3,
    icon: QrCode,
    iconCls: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    title: 'Carta QR y Auto-Pedido',
    summary: 'Catálogo visual con fotos y alérgenos desde el que el comensal pide sin esperar.',
    points: [
      { strong: 'Alérgenos según normativa europea:', text: 'filtros sin gluten, sin lactosa o veganos.' },
      { strong: 'Venta sugerida:', text: 'propone bebidas y postres de forma automática.' },
      { strong: 'Platos agotados en 1 toque:', text: 'se ocultan al instante de la carta.' },
    ],
  },
  {
    number: 4,
    icon: Star,
    iconCls: 'bg-amber-50 text-amber-600 border-amber-200',
    title: 'Fidelización y Google Maps',
    summary: 'Convierte a cada comensal en cliente recurrente y en una reseña positiva.',
    points: [
      { strong: 'Cartilla digital de 5 visitas:', text: 'sello automático al pagar.' },
      { strong: 'Bonificación por reseña:', text: '+1 sello al valorar tu local en Google Maps.' },
      { strong: 'Base de clientes propia:', text: 'para tus promociones de temporada.' },
    ],
  },
  {
    number: 5,
    icon: Calculator,
    iconCls: 'bg-violet-50 text-violet-600 border-violet-200',
    title: 'Cierre de Caja y Métricas',
    summary: 'Cierra el turno en minutos con cada cobro y propina separados y cuadrados.',
    points: [
      { strong: 'Desglose exacto:', text: 'efectivo, tarjeta y propinas por turno.' },
      { strong: 'Recaudación por camarero:', text: 'sin discusiones ni descuadres.' },
      { strong: 'Informe listo para tu gestoría:', text: 'descarga en PDF o Excel.' },
    ],
  },
]

export function FeatureTabs({ onOpenPilotModal }: FeatureTabsProps) {
  return (
    <section id="modulos" className="py-20 bg-slate-50 border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal distance={24}>
          <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
            <span className="text-xs font-black uppercase tracking-wider text-blue-600">
              Arquitectura modular en tiempo real
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Los 5 engranajes sincronizados de Fluxo
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              Cada módulo funciona de manera autónoma pero habla con los demás en menos de 100 ms.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
          {MODULES.map((m, idx) => {
            const Icon = m.icon
            // 3 tarjetas arriba y 2 centradas abajo en escritorio
            const span = idx < 3 ? 'lg:col-span-2' : idx === 3 ? 'lg:col-span-2 lg:col-start-2' : 'lg:col-span-2'
            return (
              <ScrollReveal key={m.number} delay={idx * 70} distance={20} className={`h-full ${span}`}>
                <article className="h-full bg-white border border-slate-200 hover:border-blue-300 rounded-2xl p-6 sm:p-7 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-xl border flex items-center justify-center flex-shrink-0 ${m.iconCls}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                        Módulo {m.number}
                      </span>
                      <h3 className="text-lg font-black text-slate-900 leading-tight">{m.title}</h3>
                    </div>
                  </div>

                  <p className="text-sm text-slate-600 leading-relaxed">{m.summary}</p>

                  <ul className="space-y-2 text-sm text-slate-600 pt-3 border-t border-slate-100">
                    {m.points.map((p) => (
                      <li key={p.strong} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span>
                          <strong className="text-slate-900">{p.strong}</strong> {p.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </article>
              </ScrollReveal>
            )
          })}
        </div>

        <div className="mt-10 text-center">
          <button
            type="button"
            onClick={() => onOpenPilotModal('Plan Full (Recomendado)')}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-blue-700 bg-white hover:bg-blue-50 border border-blue-200 shadow-sm transition-colors cursor-pointer group"
          >
            Probar los 5 módulos en un piloto de 14 días
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </section>
  )
}
