'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Lock, ShieldCheck, AlertCircle, ArrowRight, Delete, KeyRound, Eye, EyeOff } from 'lucide-react'

interface CRMAuthModalProps {
  onSuccess: () => void
}

export function CRMAuthModal({ onSuccess }: CRMAuthModalProps) {
  const [pin, setPin] = useState('')
  const [showPin, setShowPin] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const executeUnlock = async (pinToTest: string) => {
    if (!pinToTest || loading) return
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/crm/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pinToTest }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('fluxo_founder_authed', 'true')
            sessionStorage.setItem('fluxo_founder_authed', 'true')
            if (data.token) {
              localStorage.setItem('fluxo_founder_token', data.token)
              sessionStorage.setItem('fluxo_founder_token', data.token)
            }
          } catch {
            // ignore
          }
        }
        onSuccess()
      } else {
        setError(data.error || 'PIN incorrecto. Acceso restringido.')
        setPin('')
      }
    } catch {
      setError('Error de comunicación con el servidor seguro.')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (num: string) => {
    if (loading) return
    const nextPin = pin + num
    if (nextPin.length > 8) return
    setPin(nextPin)
    setError(null)

    // Cuando se ingresan 7 dígitos, validar en el servidor automáticamente
    if (nextPin.length === 7) {
      executeUnlock(nextPin)
    }
  }

  const handleDelete = () => {
    if (loading) return
    setPin((prev) => prev.slice(0, -1))
    setError(null)
  }

  const handleClear = () => {
    if (loading) return
    setPin('')
    setError(null)
  }

  const handleNativeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/\D/g, '')
    setPin(rawVal)
    setError(null)

    if (rawVal.length === 7) {
      executeUnlock(rawVal)
    }
  }

  // Soporte para teclado físico
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement === inputRef.current) {
        if (e.key === 'Enter') {
          e.preventDefault()
          executeUnlock(pin)
        }
        return
      }

      if (e.key >= '0' && e.key <= '9') {
        handleKeyPress(e.key)
      } else if (e.key === 'Backspace') {
        handleDelete()
      } else if (e.key === 'Enter') {
        executeUnlock(pin)
      } else if (e.key === 'Escape') {
        handleClear()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [pin, loading])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 backdrop-blur-md p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-5 sm:p-7 text-center text-white relative overflow-hidden">
        {/* Glow de fondo */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Encabezado e Isotipo */}
        <div className="relative mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/20">
          <Lock className="h-7 w-7 text-white" />
        </div>

        <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20 mb-1.5">
          <ShieldCheck className="w-3.5 h-3.5" /> Acceso Restringido
        </span>

        <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white mb-0.5">
          Portal de Dirección
        </h2>
        <p className="text-xs text-slate-400 mb-4">
          Identificación de seguridad requerida
        </p>

        {/* Campo de Entrada Táctil & Nativo */}
        <div className="relative mb-4">
          <input
            ref={inputRef}
            type={showPin ? 'text' : 'password'}
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={8}
            value={pin}
            onChange={handleNativeInputChange}
            placeholder="•••••••"
            disabled={loading}
            className="w-full text-center text-2xl font-mono tracking-[0.4em] py-2.5 px-10 rounded-2xl bg-slate-800/90 border border-slate-700 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 shadow-inner select-none touch-manipulation"
            autoComplete="off"
          />
          <button
            type="button"
            onClick={() => setShowPin(!showPin)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 transition touch-manipulation"
            title={showPin ? 'Ocultar PIN' : 'Mostrar PIN'}
          >
            {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        {/* Indicador visual de los 7 dígitos */}
        <div className="flex justify-center items-center gap-2 mb-4 h-4">
          {[0, 1, 2, 3, 4, 5, 6].map((idx) => (
            <div
              key={idx}
              className={`w-3 h-3 rounded-full transition-all duration-200 ${
                pin.length > idx
                  ? 'bg-blue-500 scale-110 shadow-md shadow-blue-500/50'
                  : 'bg-slate-800 border border-slate-700'
              }`}
            />
          ))}
        </div>

        {/* Mensaje de Error / Bloqueo */}
        {error && (
          <div className="mb-4 flex items-center justify-center gap-2 text-xs font-medium text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-xl animate-in shake">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Teclado Numérico Táctil */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
            <button
              key={digit}
              type="button"
              disabled={loading}
              onClick={() => handleKeyPress(digit.toString())}
              className="h-12 sm:h-13 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 active:bg-blue-600/40 border border-slate-700/50 text-xl font-semibold text-slate-100 transition-all flex items-center justify-center select-none shadow-sm touch-manipulation active:scale-95"
            >
              {digit}
            </button>
          ))}
          <button
            type="button"
            disabled={loading}
            onClick={handleClear}
            className="h-12 sm:h-13 rounded-2xl bg-slate-800/40 hover:bg-slate-800 active:bg-slate-700 border border-slate-800 text-[11px] font-semibold text-slate-400 transition-all flex items-center justify-center select-none touch-manipulation active:scale-95"
          >
            BORRAR
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => handleKeyPress('0')}
            className="h-12 sm:h-13 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 active:bg-blue-600/40 border border-slate-700/50 text-xl font-semibold text-slate-100 transition-all flex items-center justify-center select-none shadow-sm touch-manipulation active:scale-95"
          >
            0
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={handleDelete}
            className="h-12 sm:h-13 rounded-2xl bg-slate-800/40 hover:bg-slate-800 active:bg-slate-700 border border-slate-800 text-slate-300 transition-all flex items-center justify-center select-none touch-manipulation active:scale-95"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        {/* Botón de Enviar */}
        <button
          type="button"
          disabled={loading || pin.length === 0}
          onClick={() => executeUnlock(pin)}
          className="w-full h-12 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-95 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <span>Desbloquear Portal</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        <div className="mt-3.5 flex items-center justify-center gap-1.5 text-[11px] text-slate-500 font-mono">
          <KeyRound className="w-3 h-3 text-blue-400" />
          <span>Protegido con Cifrado HMAC &bull; Anti-Fuerza Bruta</span>
        </div>
      </div>
    </div>
  )
}
