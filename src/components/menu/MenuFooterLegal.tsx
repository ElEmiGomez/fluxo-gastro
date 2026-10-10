'use client'

import React from 'react'
import { Lock } from 'lucide-react'
import { getTranslation } from '@/lib/i18n'

interface MenuFooterLegalProps {
  currentLang: string
  isInSituAdmin: boolean
  onOpenLegalModal: () => void
  onOpenAdminAuthModal: () => void
  onExitAdminMode: () => void
}

export function MenuFooterLegal({
  currentLang,
  isInSituAdmin,
  onOpenLegalModal,
  onOpenAdminAuthModal,
  onExitAdminMode,
}: MenuFooterLegalProps) {
  const t = (key: string) => getTranslation(currentLang, key)

  return (
    <footer className="pt-6 pb-24 text-center space-y-2">
      <div className="p-3.5 bg-white rounded-2xl border border-slate-200/80 text-[11px] text-slate-500 shadow-xs space-y-1.5 text-left">
        <p className="font-bold text-slate-800 flex items-center gap-1.5">
          <span>ℹ️</span> <span>Información al Consumidor</span>
        </p>
        <p className="text-[10px] text-slate-500 leading-relaxed">
          {t('legalNotice')}
        </p>
        <div className="pt-1.5 border-t border-slate-100">
          <p className="text-[9px] text-slate-400 leading-relaxed">
            🐟 <span className="font-semibold">{t('anisakisNotice')}</span>
          </p>
        </div>
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
          <button
            type="button"
            onClick={onOpenLegalModal}
            className="text-[10px] font-bold text-blue-900 hover:text-blue-700 underline flex items-center gap-1 cursor-pointer"
          >
            🔒 Aviso Legal, Privacidad (RGPD) y Cookies
          </button>
          <button
            type="button"
            onClick={() => {
              if (isInSituAdmin) {
                onExitAdminMode()
              } else {
                onOpenAdminAuthModal()
              }
            }}
            className="text-[9px] text-slate-400 hover:text-slate-600 font-medium transition-colors cursor-pointer flex items-center gap-1"
            title="Acceso para el personal del restaurante"
          >
            <Lock className="w-2.5 h-2.5" />
            <span>{isInSituAdmin ? 'Salir de Edición' : 'Acceso Personal / Administrar Carta'}</span>
          </button>
          <span className="text-[9px] text-slate-400 font-medium">Fluxo &mdash; Sistema Gastronómico</span>
        </div>
      </div>
    </footer>
  )
}
