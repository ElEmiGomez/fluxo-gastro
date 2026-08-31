'use client'

import React, { useState, useEffect } from 'react'
import { Cookie, ShieldCheck, ChevronRight } from 'lucide-react'
import { LegalModal } from './LegalModal'

const COOKIE_CONSENT_KEY = 'gastro_cookie_consent_v1'

export function CookieConsentBanner() {
  const [showBanner, setShowBanner] = useState(false)
  const [showLegalModal, setShowLegalModal] = useState(false)

  useEffect(() => {
    try {
      const consent = localStorage.getItem(COOKIE_CONSENT_KEY)
      if (!consent) {
        // Retardo sutil de 1s para no interrumpir la carga inicial
        const timer = setTimeout(() => setShowBanner(true), 1200)
        return () => clearTimeout(timer)
      }
    } catch {
      // ignore
    }
  }, [])

  const handleAccept = () => {
    try {
      localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted_essential')
    } catch {
      // ignore
    }
    setShowBanner(false)
  }

  if (!showBanner && !showLegalModal) return null

  return (
    <>
      {showBanner && (
        <aside
          aria-label="Consentimiento de cookies y privacidad"
          className="fixed bottom-3 inset-x-3 sm:left-auto sm:right-4 sm:max-w-md z-40 bg-slate-900/95 text-slate-100 p-4 rounded-2xl shadow-2xl border border-slate-700/80 backdrop-blur-md animate-in slide-in-from-bottom duration-300 select-none"
        >
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-600/30 border border-blue-500/40 text-blue-400 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Cookie className="w-4 h-4" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="font-extrabold text-xs text-white">Privacidad y Cookies</span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  RGPD
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-snug">
                Utilizamos almacenamiento local técnico esencial para gestionar tu comanda en mesa y tu idioma. Sin rastreo publicitario.
              </p>

              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={handleAccept}
                  className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-sm transition-colors active:scale-95"
                >
                  Aceptar esenciales
                </button>

                <button
                  onClick={() => setShowLegalModal(true)}
                  className="px-2.5 py-1.5 rounded-xl text-slate-400 hover:text-white text-xs font-semibold hover:underline flex items-center gap-0.5 transition-colors"
                >
                  <span>Aviso legal</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </aside>
      )}

      <LegalModal
        isOpen={showLegalModal}
        onClose={() => setShowLegalModal(false)}
      />
    </>
  )
}
