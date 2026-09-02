'use client'

import React, { useState, useEffect } from 'react'
import {
  Sparkles,
  ChevronDown,
  ChevronUp,
  BookmarkCheck,
  Send,
  UtensilsCrossed,
  CheckCircle2,
  ChevronRight
} from 'lucide-react'
import { getTranslation } from '@/lib/i18n'
import { triggerHaptic, HAPTIC_PATTERNS } from '@/lib/haptic'

interface MicroOnboardingBannerProps {
  lang?: string
  tableNumber?: string
  onScrollToMenu?: () => void
  onOpenCart?: () => void
  onOpenCallWaiter?: () => void
}

const STORAGE_KEY = 'gastro_onboarding_collapsed_v2'

export function MicroOnboardingBanner({
  lang = 'es',
  tableNumber = '4',
  onScrollToMenu,
  onOpenCart,
  onOpenCallWaiter
}: MicroOnboardingBannerProps) {
  const t = (k: string) => getTranslation(lang, k)
  // Por default: cerrado/colapsado para no saturar la pantalla del comensal
  const [isCollapsed, setIsCollapsed] = useState<boolean>(true)
  const [isMounted, setIsMounted] = useState<boolean>(false)

  // Cargar preferencia persistente si el usuario la abrió expresamente
  useEffect(() => {
    setIsMounted(true)
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved !== null) {
        setIsCollapsed(saved === 'true')
      }
    } catch {
      // ignore
    }
  }, [])

  const toggleCollapsed = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    triggerHaptic(HAPTIC_PATTERNS.TAP)
    setIsCollapsed(prev => {
      const next = !prev
      try {
        localStorage.setItem(STORAGE_KEY, String(next))
      } catch {
        // ignore
      }
      return next
    })
  }

  const handleStepClick = (stepNum: string) => {
    triggerHaptic(HAPTIC_PATTERNS.TAP)
    if (stepNum === '1') {
      if (onScrollToMenu) {
        onScrollToMenu()
      } else {
        const target = document.getElementById('menu-category-tabs') || document.getElementById('menu-catalog')
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }
    } else if (stepNum === '2') {
      if (onOpenCart) onOpenCart()
    } else if (stepNum === '3') {
      if (onOpenCallWaiter) onOpenCallWaiter()
    }
  }

  if (!isMounted) return null

  // Si está minimizado: mostrar la píldora compacta y accesible para abrirlo cuando el usuario desee
  if (isCollapsed) {
    return (
      <div className="max-w-2xl mx-auto px-3.5 pt-2 pb-1 animate-in fade-in duration-200">
        <button
          type="button"
          onClick={toggleCollapsed}
          className="w-full py-2 px-3.5 bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 border border-blue-200/90 rounded-2xl text-xs font-black text-blue-950 shadow-xs hover:shadow-sm hover:border-blue-300 flex items-center justify-between transition-all active:scale-98 cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <span className="text-base leading-none">💡</span>
            <span className="font-extrabold text-blue-900">{t('onboardingShow') || '¿Cómo pedir desde tu mesa?'}</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-white px-2.5 py-0.5 rounded-full border border-blue-200 shadow-2xs">
            <span>Ver 3 pasos</span>
            <ChevronDown size={13} className="stroke-[2.5]" />
          </div>
        </button>
      </div>
    )
  }

  const steps = [
    {
      num: '1',
      emoji: '📌',
      icon: BookmarkCheck,
      title: t('onboardingStep1Title') || '1. Elige',
      desc: t('onboardingStep1Desc') || 'Toca cualquier plato para ver foto y personalizarlo.',
      actionLabel: 'Ver platos 👇',
      border: 'border-blue-200/80 hover:border-blue-400',
      badgeBg: 'bg-blue-900 text-white',
    },
    {
      num: '2',
      emoji: '🚀',
      icon: Send,
      title: t('onboardingStep2Title') || '2. Pide',
      desc: t('onboardingStep2Desc') || 'Revisa tu selección y envíala al mozo.',
      actionLabel: 'Ver comanda 🛒',
      border: 'border-indigo-200/80 hover:border-indigo-400',
      badgeBg: 'bg-indigo-700 text-white',
    },
    {
      num: '3',
      emoji: '🍽️',
      icon: UtensilsCrossed,
      title: t('onboardingStep3Title') || '3. Disfruta',
      desc: t('onboardingStep3Desc') || 'Pide más rondas de bebidas o llama al mozo.',
      actionLabel: 'Servicios 🛎️',
      border: 'border-amber-200/80 hover:border-amber-400',
      badgeBg: 'bg-amber-600 text-white',
    }
  ]

  return (
    <div className="max-w-2xl mx-auto px-3.5 pt-3 pb-1 animate-in slide-in-from-top-2 duration-300">
      <div className="bg-gradient-to-br from-white via-slate-50 to-blue-50/40 border-2 border-blue-200/90 rounded-3xl p-3.5 sm:p-4 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
        
        {/* Cabecera de la Guía */}
        <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-blue-100">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-xl bg-blue-900 text-white flex items-center justify-center font-black shadow-xs flex-shrink-0">
              <Sparkles className="w-4 h-4 text-amber-300" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-black text-slate-900 leading-tight">
                {t('onboardingTitle') || 'Guía Rápida de Pedido'}
              </h3>
              <p className="text-[10px] sm:text-[11px] text-blue-900 font-semibold mt-0.5">
                3 pasos sencillos para pedir cómodo desde tu mesa #{tableNumber}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={toggleCollapsed}
            className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 text-[11px] font-bold flex items-center gap-1 transition-colors flex-shrink-0 cursor-pointer"
            title="Minimizar guía"
          >
            <span className="hidden sm:inline">{t('onboardingMinimize') || 'Minimizar'}</span>
            <ChevronUp size={13} className="stroke-[2.5]" />
          </button>
        </div>

        {/* Cuadrícula de 3 Pasos Clickeables */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-2.5">
          {steps.map((step) => {
            return (
              <div
                key={step.num}
                onClick={() => handleStepClick(step.num)}
                className={`p-3 rounded-2xl bg-white border ${step.border} shadow-2xs flex flex-col justify-between space-y-2 hover:bg-slate-50 hover:shadow-xs transition-all cursor-pointer group active:scale-98`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1.5 pb-1 border-b border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <span className="text-base leading-none">{step.emoji}</span>
                      <span className="text-xs font-black text-slate-900">{step.title}</span>
                    </div>
                    <span className={`w-4 h-4 rounded-full ${step.badgeBg} text-[10px] font-black flex items-center justify-center flex-shrink-0 shadow-2xs`}>
                      {step.num}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 leading-snug font-medium mt-1.5">
                    {step.desc}
                  </p>
                </div>

                <div className="pt-1 flex items-center justify-between text-[10px] font-extrabold text-blue-900 group-hover:text-blue-700">
                  <span>{step.actionLabel}</span>
                  <ChevronRight size={12} className="transform group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            )
          })}
        </div>

        {/* Micro-aviso de tranquilidad inferior */}
        <div className="mt-2.5 pt-2 border-t border-blue-100/80 flex items-center justify-between gap-2 text-[10px] sm:text-[11px] text-slate-600">
          <div className="flex items-center gap-1.5 text-blue-900 font-bold min-w-0">
            <CheckCircle2 size={13} className="text-emerald-600 flex-shrink-0 stroke-[2.5]" />
            <span className="truncate">El mozo siempre revisará tu pedido antes de marcharlo a cocina.</span>
          </div>

          {onOpenCallWaiter && (
            <button
              type="button"
              onClick={onOpenCallWaiter}
              className="text-[10px] font-black text-blue-900 hover:text-blue-700 underline flex-shrink-0 whitespace-nowrap cursor-pointer"
            >
              ¿Dudas? Llamar Mozo
            </button>
          )}
        </div>

      </div>
    </div>
  )
}
