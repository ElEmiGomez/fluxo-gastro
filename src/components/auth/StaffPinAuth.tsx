'use client'

import React, { useState, useEffect } from 'react'
import { Lock, KeyRound, ShieldAlert, Check, ArrowRight, Sparkles } from 'lucide-react'

interface StaffPinAuthProps {
  role: 'comandero' | 'kitchen' | 'admin'
  restaurantSlug: string
  children: React.ReactNode
}

const PIN_CONFIG = {
  comandero: {
    title: 'Acceso Comandero Mozo',
    subtitle: 'Ingresa tu PIN de Mozo / Salón',
    sessionKey: 'gastro_auth_comandero_',
    badge: 'PERSONAL DE SALÓN',
    badgeColor: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    targetLength: 7,
  },
  kitchen: {
    title: 'Acceso Monitor Cocina (KDS)',
    subtitle: 'Ingresa el PIN de Cocina / Estación',
    sessionKey: 'gastro_auth_kitchen_',
    badge: 'EQUIPO DE COCINA',
    badgeColor: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    targetLength: 7,
  },
  admin: {
    title: 'Panel de Administración de Carta',
    subtitle: 'Ingresa tu PIN de Administrador (ej: 1234)',
    sessionKey: 'gastro_auth_admin_',
    badge: 'ADMINISTRACIÓN & GESTIÓN',
    badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    targetLength: 4,
  },
}

export function StaffPinAuth({ role, restaurantSlug, children }: StaffPinAuthProps) {
  const config = PIN_CONFIG[role]

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  const [pinInput, setPinInput] = useState<string>('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isValidating, setIsValidating] = useState<boolean>(false)

  // Restaurar sesión de turno si está dentro de los 15 minutos (solicitado por el usuario)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(`fluxo_staff_auth_${role}_${restaurantSlug}`)
        if (stored) {
          const parsed = JSON.parse(stored)
          if (parsed?.auth && Date.now() - parsed.timestamp < 15 * 60 * 1000) {
            setIsAuthenticated(true)
          } else {
            setIsAuthenticated(false)
          }
        }
      } catch {}
    }
  }, [role, restaurantSlug])

  const validatePin = async (pinToTest: string) => {
    const cleanPin = pinToTest.trim()
    setIsValidating(true)
    setErrorMsg(null)

    try {
      const res = await fetch('/api/staff/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role,
          slug: restaurantSlug,
          pin: cleanPin,
        }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setIsAuthenticated(true)
        try {
          localStorage.setItem(
            `fluxo_staff_auth_${role}_${restaurantSlug}`,
            JSON.stringify({ auth: true, timestamp: Date.now() })
          )
        } catch {}
      } else {
        setErrorMsg(data.error || 'PIN incorrecto. Intenta nuevamente.')
        setPinInput('')
      }
    } catch {
      setErrorMsg('Error de conexión con el servidor.')
      setPinInput('')
    } finally {
      setIsValidating(false)
    }
  }

  const targetLength = config.targetLength || 7

  const handleKeyPress = (num: string) => {
    if (isValidating) return
    if (pinInput.length < targetLength) {
      const next = pinInput + num
      setPinInput(next)
      setErrorMsg(null)
      if (next.length === targetLength) {
        validatePin(next)
      }
    }
  }

  const handleBackspace = () => {
    if (isValidating) return
    setPinInput(prev => prev.slice(0, -1))
    setErrorMsg(null)
  }

  const handleClear = () => {
    if (isValidating) return
    setPinInput('')
    setErrorMsg(null)
  }

  // Soporte para teclado físico (0-9, Backspace, Escape, Enter)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isAuthenticated || isValidating) return
      if (e.key >= '0' && e.key <= '9') {
        handleKeyPress(e.key)
      } else if (e.key === 'Backspace') {
        handleBackspace()
      } else if (e.key === 'Escape') {
        handleClear()
      } else if (e.key === 'Enter' && pinInput.length >= 4) {
        validatePin(pinInput)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [pinInput, isAuthenticated, isValidating, targetLength])

  if (isAuthenticated) {
    return (
      <div className="relative">
        <button
          type="button"
          onClick={() => {
            setIsAuthenticated(false)
            setPinInput('')
          }}
          title="Bloquear pantalla"
          className="fixed top-2.5 right-20 sm:right-28 z-50 px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-[10px] font-bold flex items-center gap-1 backdrop-blur-md transition-all shadow-md active:scale-95 cursor-pointer"
        >
          <Lock className="w-3 h-3 text-red-400" />
          <span className="hidden sm:inline">Bloquear</span>
        </button>
        {children}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 selection:bg-blue-600 font-sans">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-center animate-in zoom-in-95 duration-200">
        
        {/* Badge de Seguridad */}
        <div className="flex flex-col items-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 text-blue-400 flex items-center justify-center shadow-lg">
            <Lock className="w-7 h-7" />
          </div>
          <span className={`text-[10px] font-black tracking-widest uppercase px-3 py-1 rounded-full border ${config.badgeColor}`}>
            {config.badge}
          </span>
          <h2 className="text-xl font-black text-white leading-tight">
            {config.title}
          </h2>
          <p className="text-xs text-slate-400 font-medium">
            {config.subtitle}
          </p>
        </div>

        {/* Indicadores de PIN dinámicos */}
        <div className="flex justify-center items-center gap-2 py-2">
          {Array.from({ length: targetLength }, (_, idx) => (
            <div
              key={idx}
              className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full transition-all duration-200 ${
                pinInput.length > idx
                  ? 'bg-cyan-400 scale-110 shadow-sm shadow-cyan-400/50 ring-2 ring-cyan-400/20'
                  : 'bg-slate-800 border border-slate-700'
              }`}
            />
          ))}
        </div>

        {errorMsg && (
          <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold flex items-center justify-center gap-2 animate-in shake">
            <ShieldAlert className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Teclado Numérico Táctil */}
        <div className="grid grid-cols-3 gap-2.5 pt-1">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
            <button
              key={num}
              onClick={() => handleKeyPress(num)}
              className="h-14 rounded-2xl bg-slate-800 hover:bg-slate-750 active:bg-blue-600 active:scale-95 text-white font-extrabold text-lg border border-slate-700/80 shadow-xs transition-all flex items-center justify-center"
            >
              {num}
            </button>
          ))}
          <button
            onClick={handleClear}
            className="h-14 rounded-2xl bg-slate-800/60 hover:bg-slate-800 text-slate-400 font-bold text-xs border border-slate-800 transition-all flex items-center justify-center active:scale-95"
          >
            Borrar
          </button>
          <button
            onClick={() => handleKeyPress('0')}
            className="h-14 rounded-2xl bg-slate-800 hover:bg-slate-750 active:bg-blue-600 active:scale-95 text-white font-extrabold text-lg border border-slate-700/80 shadow-xs transition-all flex items-center justify-center"
          >
            0
          </button>
          <button
            onClick={handleBackspace}
            className="h-14 rounded-2xl bg-slate-800/60 hover:bg-slate-800 text-slate-400 font-bold text-xs border border-slate-800 transition-all flex items-center justify-center active:scale-95"
          >
            ⌫
          </button>
        </div>

      </div>
    </div>
  )
}
