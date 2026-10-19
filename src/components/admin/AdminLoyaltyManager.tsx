'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Award,
  Users,
  Search,
  Download,
  Sparkles,
  Gift,
  Clock,
  Star,
  RefreshCw,
  Mail,
  Phone,
  CheckCircle2,
  AlertCircle,
  Settings2,
  Save,
  Loader2,
} from 'lucide-react'
import { LoyaltyProfile, LoyaltySettings } from '@/types/loyalty.types'

interface AdminLoyaltyManagerProps {
  slug: string
  onToast: (msg: string) => void
}

interface LoyaltyStats {
  total_customers: number
  total_points_issued: number
  active_members_with_rewards: number
  google_reviews_awarded: number
}

export function AdminLoyaltyManager({ slug, onToast }: AdminLoyaltyManagerProps) {
  const [profiles, setProfiles] = useState<LoyaltyProfile[]>([])
  const [stats, setStats] = useState<LoyaltyStats>({
    total_customers: 0,
    total_points_issued: 0,
    active_members_with_rewards: 0,
    google_reviews_awarded: 0,
  })
  const [settings, setSettings] = useState<LoyaltySettings>({
    mode: 'stamps',
    target_stamps: 5,
    min_spend_per_stamp: 50,
    reward_label: 'Postre o Café gratis',
    reward_category_filter: ['postres', 'bebidas'],
  })
  const [isSavingSettings, setIsSavingSettings] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterGoogle, setFilterGoogle] = useState<'all' | 'awarded' | 'pending'>('all')

  // Obtener credenciales de sesión del personal administrativo
  const getAuthHeaders = useCallback((): HeadersInit => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (typeof window !== 'undefined') {
      const pinToken = localStorage.getItem(`fluxo_staff_auth_${slug}`) || localStorage.getItem('fluxo_staff_session')
      if (pinToken) {
        headers['Authorization'] = `Bearer ${pinToken}`
      }
    }
    return headers
  }, [slug])

  // Carga de perfiles y métricas
  const fetchProfiles = useCallback(async () => {
    setIsLoading(true)
    try {
      const queryParam = searchQuery.trim() ? `&search=${encodeURIComponent(searchQuery.trim())}` : ''
      const res = await fetch(`/api/loyalty/profiles?slug=${encodeURIComponent(slug)}${queryParam}`, {
        headers: getAuthHeaders(),
      })

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error('Sesión de administrador expirada o no autorizada.')
        }
        throw new Error('Error al consultar lista de clientes.')
      }

      const data = await res.json()
      if (data.success && Array.isArray(data.profiles)) {
        setProfiles(data.profiles)
        if (data.stats) {
          setStats(data.stats)
        }
      }
    } catch (err: any) {
      console.error('[AdminLoyaltyManager] Error:', err)
      onToast(err.message || 'Error al cargar fidelización')
    } finally {
      setIsLoading(false)
    }
  }, [slug, searchQuery, getAuthHeaders, onToast])

  // Carga de configuración de fidelización
  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch(`/api/loyalty/settings?slug=${encodeURIComponent(slug)}`)
      if (res.ok) {
        const data = await res.json()
        if (data.success && data.settings) {
          setSettings(data.settings)
        }
      }
    } catch (err) {
      console.error('[AdminLoyaltyManager] Error fetching settings:', err)
    }
  }, [slug])

  const handleSaveSettings = async () => {
    setIsSavingSettings(true)
    try {
      const res = await fetch('/api/loyalty/settings', {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ slug, settings }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'No se pudo guardar la configuración')
      }
      setSettings(data.settings)
      onToast('Configuración de fidelización guardada con éxito')
    } catch (err: any) {
      onToast(err.message || 'Error al guardar configuración')
    } finally {
      setIsSavingSettings(false)
    }
  }

  useEffect(() => {
    fetchProfiles()
    fetchSettings()
  }, [fetchProfiles, fetchSettings])

  // Filtrado adicional en memoria por estado Google Maps
  const filteredProfiles = useMemo(() => {
    return profiles.filter((p) => {
      if (filterGoogle === 'awarded') return p.google_review_bonus_awarded === true
      if (filterGoogle === 'pending') return !p.google_review_bonus_awarded
      return true
    })
  }, [profiles, filterGoogle])

  // Exportación directa a CSV para campañas de email marketing (UTF-8 con BOM)
  const handleExportCSV = () => {
    if (filteredProfiles.length === 0) {
      onToast('No hay clientes en la lista para exportar')
      return
    }

    const headers = [
      'Nombre',
      'Email',
      'Telefono',
      'Sellos_Activos',
      'Premios_Desbloqueados',
      'Puntos_Totales',
      'Puntos_Disponibles',
      'Resena_Google_Maps',
      'Fecha_Alta',
    ]

    const rows = filteredProfiles.map((p) => [
      `"${(p.name || '').replace(/"/g, '""')}"`,
      `"${(p.email || '').replace(/"/g, '""')}"`,
      `"${(p.phone || '').replace(/"/g, '""')}"`,
      p.stamps_count || 0,
      p.unlocked_rewards_count || 0,
      p.total_points,
      p.available_points,
      p.google_review_bonus_awarded ? 'SI (+50 pts)' : 'NO',
      `"${new Date(p.created_at).toLocaleDateString('es-ES')}"`,
    ])

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    const dateStr = new Date().toISOString().split('T')[0]

    link.setAttribute('href', url)
    link.setAttribute('download', `clientes_fidelizados_${slug}_${dateStr}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    onToast('Archivo CSV descargado correctamente')
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 0. PANEL DE CONFIGURACIÓN DEL PROGRAMA DE FIDELIZACIÓN */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-500/10 text-amber-700 flex items-center justify-center border border-amber-200/80">
              <Settings2 className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 tracking-tight">
                Configuración de Fidelización & Premios
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Define el funcionamiento de la cartilla digital o sistema de puntos en tu carta
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSaveSettings}
            disabled={isSavingSettings}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs flex items-center gap-2 shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer self-start sm:self-auto"
          >
            {isSavingSettings ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Guardar Configuración</span>
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-1">
          {/* Selector de Modo */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Modo de Fidelización
            </label>
            <select
              value={settings.mode}
              onChange={(e) => setSettings({ ...settings, mode: e.target.value as any })}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            >
              <option value="stamps">⭐ Cartilla de Sellos (Recomendado)</option>
              <option value="points">💰 Puntos por Consumo (1€ = 1pt)</option>
              <option value="disabled">❌ Desactivado</option>
            </select>
          </div>

          {/* Meta de Sellos */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Sellos para el Premio
            </label>
            <input
              type="number"
              min={1}
              max={20}
              value={settings.target_stamps}
              onChange={(e) => setSettings({ ...settings, target_stamps: Number(e.target.value) || 5 })}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
          </div>

          {/* Consumo Mínimo por Sello */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Consumo Mínimo por Sello (€)
            </label>
            <input
              type="number"
              min={1}
              value={settings.min_spend_per_stamp}
              onChange={(e) => setSettings({ ...settings, min_spend_per_stamp: Number(e.target.value) || 50 })}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
          </div>

          {/* Etiqueta del Premio */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Premio Otorgado
            </label>
            <input
              type="text"
              value={settings.reward_label}
              onChange={(e) => setSettings({ ...settings, reward_label: e.target.value })}
              placeholder="Ej. Postre o Café gratis"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
          </div>
        </div>
      </div>

      {/* 1. TARJETAS DE MÉTRICAS EJECUTIVAS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Clientes */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Clientes Registrados</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">{stats.total_customers}</span>
            <span className="text-[11px] text-slate-500 block mt-0.5">comensales fidelizados</span>
          </div>
        </div>

        {/* Puntos Emitidos */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Puntos en Circulación</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">{stats.total_points_issued}</span>
            <span className="text-[11px] text-slate-500 block mt-0.5">puntos acumulados</span>
          </div>
        </div>

        {/* Clientes con Saldo Canjeable */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Listos para Canjear</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
              <Gift className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">
              {stats.active_members_with_rewards}
            </span>
            <span className="text-[11px] text-slate-500 block mt-0.5">saldo &gt;= 15 pts</span>
          </div>
        </div>

        {/* Reseñas Google Maps Activadas */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Booster Google Maps</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200">
              <Star className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">
              {stats.google_reviews_awarded}
            </span>
            <span className="text-[11px] text-slate-500 block mt-0.5">bonificaciones (+50 pts)</span>
          </div>
        </div>
      </div>

      {/* 2. BARRA DE HERRAMIENTAS: BÚSQUEDA, FILTROS Y EXPORTAR CSV */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        {/* Buscador */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre o correo..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Filtros de Google Maps y Botones de Acción */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => setFilterGoogle('all')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                filterGoogle === 'all' ? 'bg-white text-blue-700 shadow-2xs font-black' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todos ({profiles.length})
            </button>
            <button
              onClick={() => setFilterGoogle('awarded')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                filterGoogle === 'awarded' ? 'bg-white text-blue-700 shadow-2xs font-black' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Con Reseña
            </button>
            <button
              onClick={() => setFilterGoogle('pending')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                filterGoogle === 'pending' ? 'bg-white text-blue-700 shadow-2xs font-black' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sin Reseña
            </button>
          </div>

          <button
            onClick={fetchProfiles}
            disabled={isLoading}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border border-slate-200 transition-colors cursor-pointer"
            title="Refrescar lista"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-blue-600/10 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* 3. TABLA DE CLIENTES FIDELIZADOS */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-black uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Comensal</th>
                <th className="py-3 px-4">Contacto</th>
                <th className="py-3 px-4 text-center">Sellos / Visitas</th>
                <th className="py-3 px-4 text-center">Premios Listos</th>
                <th className="py-3 px-4 text-center">Puntos Totales</th>
                <th className="py-3 px-4 text-center">Google Maps (+50)</th>
                <th className="py-3 px-4 text-right">Fecha de Alta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                    <span>Cargando directorio de comensales...</span>
                  </td>
                </tr>
              ) : filteredProfiles.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <AlertCircle className="w-6 h-6 mx-auto mb-2 text-slate-400" />
                    <span>No se encontraron comensales fidelizados con los filtros aplicados.</span>
                  </td>
                </tr>
              ) : (
                filteredProfiles.map((p) => {
                  const initials = (p.name || 'C')
                    .split(' ')
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase()

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Nombre y Avatar */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-800 font-black flex items-center justify-center text-xs border border-blue-200">
                            {initials}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 text-sm block leading-tight">{p.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono">ID: {p.id.slice(0, 14)}...</span>
                          </div>
                        </div>
                      </td>

                      {/* Contacto */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 text-slate-800">
                            <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                            <span className="font-medium">{p.email}</span>
                          </div>
                          {p.phone && (
                            <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                              <Phone className="w-3 h-3 text-slate-400 flex-shrink-0" />
                              <span>{p.phone}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Sellos / Visitas */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-block px-2.5 py-1 rounded-xl bg-amber-50 border border-amber-200 font-black text-amber-900 text-xs">
                          {p.stamps_count || 0}/{settings.target_stamps || 5}
                        </span>
                      </td>

                      {/* Premios Listos */}
                      <td className="py-3.5 px-4 text-center">
                        {(p.unlocked_rewards_count || 0) > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-100 text-emerald-800 font-black text-xs border border-emerald-300">
                            🎁 {p.unlocked_rewards_count} listo(s)
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs font-medium">0</span>
                        )}
                      </td>

                      {/* Puntos Totales */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-block px-2.5 py-1 rounded-xl bg-slate-100 border border-slate-200 font-black text-slate-900 text-xs">
                          {p.total_points} pts
                        </span>
                      </td>

                      {/* Google Maps Booster */}
                      <td className="py-3.5 px-4 text-center">
                        {p.google_review_bonus_awarded ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[11px] font-bold">
                            <CheckCircle2 className="w-3 h-3 text-blue-600" />
                            <span>Otorgado</span>
                          </span>
                        ) : (
                          <span className="inline-block px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[11px]">
                            Pendiente
                          </span>
                        )}
                      </td>

                      {/* Fecha de Registro */}
                      <td className="py-3.5 px-4 text-right text-slate-500 text-[11px]">
                        {new Date(p.created_at).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
