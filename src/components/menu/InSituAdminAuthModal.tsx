'use client'

import React, { useState, useEffect } from 'react'
import { Lock, ShieldAlert, X, Loader2, KeyRound } from 'lucide-react'

interface InSituAdminAuthModalProps {
  isOpen: boolean
  onClose: () => void
  slug: string
  onSuccess: (token: string) => void
}

export function InSituAdminAuthModal({
  isOpen,
  onClose,
  slug,
  onSuccess,
}: InSituAdminAuthModalProps) {
  const [pinInput, setPinInput] = useState<string>('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isValidating, setIsValidating] = useState<boolean>(false)

  // Reset state on open/close
  useEffect(() => {
    if (isOpen) {
      setPinInput('')
      setErrorMsg(null)
      setIsValidating(false)
    }
  }, [isOpen])

  const validatePin = async (pinToTest: string) => {
    if (isValidating) return
    const cleanPin = pinToTest.trim()
    if (!cleanPin) return
    setIsValidating(true)
    setErrorMsg(null)

    try {
      const res = await fetch('/api/staff/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'admin',
          slug,
          pin: cleanPin,
        }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        onSuccess(data.token || '')
        onClose()
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

  const handleKeyPress = (num: string) => {
    if (isValidating) return
    if (pinInput.length < 7) {
      const next = pinInput + num
      setPinInput(next)
      setErrorMsg(null)
      // Si alcanza la longitud máxima permitida (7 dígitos), auto-validar inmediatamente
      if (next.length === 7) {
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
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isValidating) return
      if (e.key >= '0' && e.key <= '9') {
        handleKeyPress(e.key)
      } else if (e.key === 'Backspace') {
        handleBackspace()
      } else if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'Enter' && pinInput.length >= 4) {
        validatePin(pinInput)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, pinInput, isValidating])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 select-none animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-4 text-center text-white animate-in zoom-in-95 duration-200 relative">
        {/* Botón Cerrar */}
        <button
          type="button"
          onClick={onClose}
          disabled={isValidating}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          title="Cerrar"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Encabezado e Icono de Seguridad */}
        <div className="flex flex-col items-center space-y-2 pt-1">
          <div className="w-13 h-13 rounded-2xl bg-purple-600/20 border border-purple-500/30 text-purple-400 flex items-center justify-center shadow-lg">
            <Lock className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-black tracking-widest uppercase px-3 py-1 rounded-full border bg-purple-500/10 text-purple-300 border-purple-500/30">
            ADMINISTRACIÓN DE CARTA
          </span>
          <h2 className="text-lg font-black text-white leading-tight">
            Acceso Personal
          </h2>
          <p className="text-xs text-slate-400 font-medium">
            Ingresa tu PIN de administrador para activar la edición en vivo
          </p>
        </div>

        {/* Indicadores Visuales de PIN (Dinámicos de 4 a 7 dígitos) */}
        <div className="flex justify-center items-center gap-2.5 py-1">
          {Array.from({ length: Math.max(4, Math.min(7, pinInput.length)) }, (_, idx) => (
            <div
              key={idx}
              className={`w-3.5 h-3.5 rounded-full transition-all duration-200 ${
                pinInput.length > idx
                  ? 'bg-purple-400 scale-110 shadow-sm shadow-purple-400/50 ring-2 ring-purple-400/20'
                  : 'bg-slate-800 border border-slate-700'
              }`}
            />
          ))}
        </div>

        {/* Mensaje de Error / Rate Limit */}
        {errorMsg && (
          <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold flex items-center justify-center gap-2 animate-in shake">
            <ShieldAlert className="w-4 h-4 flex-shrink-0" />
            <span className="text-left text-[11px] leading-tight">{errorMsg}</span>
          </div>
        )}

        {/* Loader si está validando */}
        {isValidating && (
          <div className="flex items-center justify-center gap-2 text-xs font-bold text-purple-300 py-1">
            <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
            <span>Verificando credenciales...</span>
          </div>
        )}

        {/* Teclado Numérico Táctil */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
            <button
              key={num}
              type="button"
              disabled={isValidating}
              onClick={() => handleKeyPress(num)}
              className="h-12 sm:h-13 rounded-2xl bg-slate-800 hover:bg-slate-750 active:bg-purple-600 active:scale-95 text-white font-extrabold text-lg border border-slate-700/80 shadow-xs transition-all flex items-center justify-center cursor-pointer disabled:opacity-50"
            >
              {num}
            </button>
          ))}
          <button
            type="button"
            disabled={isValidating || pinInput.length === 0}
            onClick={handleBackspace}
            onDoubleClick={handleClear}
            className="h-12 sm:h-13 rounded-2xl bg-slate-800/60 hover:bg-slate-800 text-slate-300 font-bold text-base border border-slate-800 transition-all flex items-center justify-center active:scale-95 cursor-pointer disabled:opacity-40"
            title="Borrar último dígito (doble clic para limpiar todo)"
          >
            ⌫
          </button>
          <button
            type="button"
            disabled={isValidating}
            onClick={() => handleKeyPress('0')}
            className="h-12 sm:h-13 rounded-2xl bg-slate-800 hover:bg-slate-750 active:bg-purple-600 active:scale-95 text-white font-extrabold text-lg border border-slate-700/80 shadow-xs transition-all flex items-center justify-center cursor-pointer disabled:opacity-50"
          >
            0
          </button>
          <button
            type="button"
            disabled={isValidating || pinInput.length < 4}
            onClick={() => validatePin(pinInput)}
            className={`h-12 sm:h-13 rounded-2xl font-black text-xs sm:text-sm border transition-all flex items-center justify-center cursor-pointer active:scale-95 ${
              pinInput.length >= 4
                ? 'bg-purple-600 hover:bg-purple-500 text-white border-purple-500 shadow-md shadow-purple-600/30'
                : 'bg-slate-800/40 text-slate-600 border-slate-800/80 cursor-not-allowed'
            }`}
            title="Entrar"
          >
            Entrar
          </button>
        </div>

        {/* Botón de Confirmación / Acceso */}
        <button
          type="button"
          disabled={isValidating || pinInput.length < 4}
          onClick={() => validatePin(pinInput)}
          className={`w-full py-2.5 rounded-2xl font-black text-xs sm:text-sm border transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] ${
            pinInput.length >= 4
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white border-purple-500 shadow-lg shadow-purple-600/30'
              : 'bg-slate-800/40 text-slate-600 border-slate-800/80 cursor-not-allowed'
          }`}
        >
          {isValidating ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-300" />
              <span>Verificando credenciales...</span>
            </>
          ) : (
            <>
              <KeyRound className="w-3.5 h-3.5" />
              <span>Acceder al Modo Edición</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
