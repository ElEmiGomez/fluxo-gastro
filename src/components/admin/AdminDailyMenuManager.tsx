'use client'

import React, { useState, useEffect } from 'react'
import {
  Sparkles,
  Clock,
  Euro,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Save,
  Utensils,
  Coffee,
  Wine,
  ShieldCheck,
  Power,
  Info,
} from 'lucide-react'
import { DailyMenu } from '@/types/database.types'
import { formatCurrency } from '@/lib/utils'
import { isDailyMenuActive } from '@/lib/daily-menu-utils'

interface AdminDailyMenuManagerProps {
  slug: string
  onToast: (msg: string) => void
}

const WEEKDAYS = [
  { id: '1', label: 'Lunes', short: 'L' },
  { id: '2', label: 'Martes', short: 'M' },
  { id: '3', label: 'Miércoles', short: 'X' },
  { id: '4', label: 'Jueves', short: 'J' },
  { id: '5', label: 'Viernes', short: 'V' },
  { id: '6', label: 'Sábado', short: 'S' },
  { id: '0', label: 'Domingo', short: 'D' },
]

export function AdminDailyMenuManager({ slug, onToast }: AdminDailyMenuManagerProps) {
  const [dailyMenu, setDailyMenu] = useState<DailyMenu | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Estados locales de formulario
  const [isActive, setIsActive] = useState(false)
  const [title, setTitle] = useState('Menú Ejecutivo Diario')
  const [fixedPrice, setFixedPrice] = useState('14.50')
  const [scheduleEnabled, setScheduleEnabled] = useState(true)
  const [scheduleDays, setScheduleDays] = useState<string[]>(['1', '2', '3', '4', '5'])
  const [startTime, setStartTime] = useState('13:00')
  const [endTime, setEndTime] = useState('16:30')

  // Carga inicial
  useEffect(() => {
    let isMounted = true
    const fetchDailyMenu = async () => {
      try {
        setIsLoading(true)
        const res = await fetch(`/api/daily-menu?slug=${slug}&_t=${Date.now()}`, { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          if (isMounted && data.dailyMenu) {
            const m: DailyMenu = data.dailyMenu
            setDailyMenu(m)
            setIsActive(Boolean(m.is_active))
            setTitle(m.title || 'Menú Ejecutivo Diario')
            setFixedPrice(String(m.fixed_price ?? 14.5))
            setScheduleEnabled(Boolean(m.schedule_enabled))
            setScheduleDays(m.schedule_days && m.schedule_days.length > 0 ? m.schedule_days : ['1', '2', '3', '4', '5'])
            setStartTime(m.schedule_start_time || '13:00')
            setEndTime(m.schedule_end_time || '16:30')
          }
        }
      } catch (err) {
        console.error('[AdminDailyMenuManager] Error fetching:', err)
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }
    fetchDailyMenu()
    return () => { isMounted = false }
  }, [slug])

  // Evaluación en vivo de si estaría vigente
  const simulatedMenu: DailyMenu | null = dailyMenu ? {
    ...dailyMenu,
    is_active: isActive,
    title,
    fixed_price: parseFloat(fixedPrice) || 14.5,
    schedule_enabled: scheduleEnabled,
    schedule_days: scheduleDays,
    schedule_start_time: startTime,
    schedule_end_time: endTime,
  } : null

  const isCurrentlyInSchedule = simulatedMenu ? isDailyMenuActive(simulatedMenu) : false

  const handleToggleDay = (dayId: string) => {
    setScheduleDays(prev =>
      prev.includes(dayId) ? prev.filter(d => d !== dayId) : [...prev, dayId]
    )
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const numericPrice = parseFloat(fixedPrice.replace(',', '.')) || 14.50

      const updates: Partial<DailyMenu> = {
        is_active: isActive,
        title: title.trim() || 'Menú Ejecutivo Diario',
        fixed_price: numericPrice,
        schedule_enabled: scheduleEnabled,
        schedule_days: scheduleDays,
        schedule_start_time: startTime,
        schedule_end_time: endTime,
      }

      const res = await fetch('/api/daily-menu', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-staff-pin': '1234',
        },
        credentials: 'include',
        body: JSON.stringify({
          slug,
          updates,
        }),
      })

      const data = await res.json()
      if (res.ok && data.success) {
        setDailyMenu(data.dailyMenu)
        onToast(isActive ? '✅ Menú del Día ACTIVADO y guardado' : '⏸️ Menú del Día PAUSADO y guardado')
      } else {
        onToast(data.error || 'Error al guardar la configuración')
      }
    } catch (err: any) {
      console.error('[AdminDailyMenuManager] Save error:', err)
      onToast('Error de red al guardar Menú del Día')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="p-8 text-center text-slate-400">
        <div className="w-8 h-8 mx-auto border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-bold">Cargando configuración del Menú del Día...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Banner de Estado Principal con Switch */}
      <div className={`p-5 sm:p-6 rounded-3xl border transition-all ${
        isActive
          ? 'bg-gradient-to-r from-emerald-950/40 via-slate-900 to-indigo-950/40 border-emerald-500/40'
          : 'bg-slate-900 border-slate-800'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${isActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
              <h2 className="text-lg sm:text-xl font-black text-white">
                {isActive ? 'Menú del Día: ACTIVO' : 'Menú del Día: DESACTIVADO'}
              </h2>
            </div>
            <p className="text-xs text-slate-300">
              {isActive
                ? 'El menú está habilitado para mostrarse a los comensales en la carta digital.'
                : 'El menú está en pausa. En la carta se mostrará normalmente el banner "Recomendado para comenzar".'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={`px-5 py-2.5 rounded-2xl font-black text-xs sm:text-sm flex items-center gap-2 transition-all shadow-lg cursor-pointer ${
                isActive
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
              }`}
            >
              <Power className="w-4 h-4" />
              <span>{isActive ? 'Pausar Menú' : 'Activar Menú'}</span>
            </button>
          </div>
        </div>

        {/* Notificación de Exclusión Mutua Automática */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-start gap-2.5 text-xs text-slate-300">
          <Info className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
          <span>
            <strong className="text-white">Jerarquía visual inteligente:</strong> Cuando el Menú del Día está activo y en horario, tiene prioridad absoluta y oculta automáticamente la recomendación secundaria para no saturar al comensal.
          </span>
        </div>
      </div>

      {/* Tarjeta de Configuración de Datos y Precio */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Título y Precio */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
          <h3 className="text-sm font-black text-white flex items-center gap-2">
            <Utensils className="w-4 h-4 text-amber-400" />
            <span>Datos del Menú</span>
          </h3>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">
                Título para los Comensales
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej. Menú Ejecutivo Diario"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm font-bold focus:outline-hidden focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">
                Precio Fijo Completo (€)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={fixedPrice}
                  onChange={(e) => setFixedPrice(e.target.value)}
                  placeholder="14.50"
                  className="w-full px-3.5 py-2.5 pr-8 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm font-bold focus:outline-hidden focus:border-cyan-500"
                />
                <span className="absolute right-3 top-2.5 text-slate-400 text-sm font-bold">
                  €
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Incluye 1er plato, 2º plato, postre o café y bebida.
              </p>
            </div>
          </div>
        </div>

        {/* Franja Horaria y Días */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span>Programación Horaria</span>
            </h3>

            <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-300">
              <input
                type="checkbox"
                checked={scheduleEnabled}
                onChange={(e) => setScheduleEnabled(e.target.checked)}
                className="rounded-sm bg-slate-950 border-slate-700 text-cyan-500 focus:ring-0"
              />
              <span>Limitar a horario</span>
            </label>
          </div>

          {scheduleEnabled ? (
            <div className="space-y-3">
              {/* Días Activos */}
              <div>
                <span className="block text-xs font-bold text-slate-400 mb-1.5">
                  Días de la semana vigentes
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {WEEKDAYS.map((day) => {
                    const isSelected = scheduleDays.includes(day.id)
                    return (
                      <button
                        key={day.id}
                        type="button"
                        onClick={() => handleToggleDay(day.id)}
                        className={`w-8 h-8 rounded-xl text-xs font-black transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-cyan-500 text-slate-950 shadow-xs'
                            : 'bg-slate-950 text-slate-500 hover:text-slate-300 border border-slate-800'
                        }`}
                        title={day.label}
                      >
                        {day.short}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Rango Horario */}
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">
                    Hora Inicio
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-bold focus:outline-hidden focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">
                    Hora Fin
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-bold focus:outline-hidden focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Indicador de Estado Actual en Vivo */}
              <div className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 ${
                isCurrentlyInSchedule
                  ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
                  : 'bg-amber-950/30 border-amber-500/30 text-amber-300'
              }`}>
                {isCurrentlyInSchedule ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    <span>En este momento: DENTRO DE HORARIO (Visible en carta)</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>En este momento: FUERA DE HORARIO (Oculto en carta)</span>
                  </>
                )}
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-3">
              El horario está desactivado. El Menú del Día estará disponible de forma ininterrumpida mientras permanezca en estado <strong>Activo</strong>.
            </p>
          )}
        </div>
      </div>

      {/* Resumen de Secciones Preconfiguradas */}
      <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
        <h3 className="text-sm font-black text-white flex items-center gap-2">
          <Utensils className="w-4 h-4 text-purple-400" />
          <span>Estructura de 4 Pasos del Menú</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-1">
            <span className="text-[10px] uppercase font-black tracking-wider text-emerald-400">1º Paso</span>
            <p className="text-xs font-bold text-white">Primeros Platos</p>
            <span className="text-[10px] text-slate-400 block">Cremas, ensaladas, pastas</span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-1">
            <span className="text-[10px] uppercase font-black tracking-wider text-blue-400">2º Paso</span>
            <p className="text-xs font-bold text-white">Segundos Platos</p>
            <span className="text-[10px] text-slate-400 block">Carnes, pescados, brasas</span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-1">
            <span className="text-[10px] uppercase font-black tracking-wider text-amber-400">3º Paso</span>
            <p className="text-xs font-bold text-white">Postre o Café</p>
            <span className="text-[10px] text-slate-400 block">Tartas, flan, café espresso</span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-1">
            <span className="text-[10px] uppercase font-black tracking-wider text-purple-400">4º Paso</span>
            <p className="text-xs font-bold text-white">Bebida Incluida</p>
            <span className="text-[10px] text-slate-400 block">Agua, vino, cerveza, refresco</span>
          </div>
        </div>
      </div>

      {/* Botón de Guardar en la Barra Inferior */}
      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-sm flex items-center gap-2 shadow-xl active:scale-95 transition-all cursor-pointer disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'Guardando...' : 'Guardar Configuración'}</span>
        </button>
      </div>
    </div>
  )
}
