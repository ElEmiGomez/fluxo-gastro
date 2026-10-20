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
  RotateCcw,
  Trash2,
  X,
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
  // Modal de confirmación para resetear puntos/sellos o eliminar perfil
  const [actionModal, setActionModal] = useState<{
    isOpen: boolean
    type: 'reset_points' | 'delete_profile'
    profile: LoyaltyProfile | null
    isProcessing: boolean
  }>({
    isOpen: false,
    type: 'reset_points',
    profile: null,
    isProcessing: false,
  })

  const handleConfirmAction = async () => {
    if (!actionModal.profile) return
    setActionModal(prev => ({ ...prev, isProcessing: true }))
    try {
      const res = await fetch(`/api/loyalty/profiles?slug=${encodeURIComponent(slug)}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          slug,
          action: actionModal.type,
          email: actionModal.profile.email,
          id: actionModal.profile.id,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'No se pudo completar la operación')
      }
      onToast(
        actionModal.type === 'delete_profile'
          ? `Perfil de ${actionModal.profile.name} eliminado permanentemente`
          : `Puntos y sellos de ${actionModal.profile.name} restablecidos a 0`
      )
      setActionModal({ isOpen: false, type: 'reset_points', profile: null, isProcessing: false })
      await fetchProfiles()
    } catch (err: any) {
      console.error('[AdminLoyaltyManager] Error executing action:', err)
      onToast(err.message || 'Error al procesar la acción')
      setActionModal(prev => ({ ...prev, isProcessing: false }))
    }
  }


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
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Modo de Fidelización
            </label>
            <select
              value={settings.mode}
              onChange={(e) => setSettings({ ...settings, mode: e.target.value as any })}
              className="w-full px-3 py-2 rounded-xl border border-slate-700 text-xs font-bold bg-slate-900 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30"
            >
              <option value="stamps">⭐ Cartilla de Sellos (Recomendado)</option>
              <option value="points">💰 Puntos por Consumo (1€ = 1pt)</option>
              <option value="disabled">❌ Desactivado</option>
            </select>
          </div>

          {/* Meta de Sellos */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Sellos para el Premio
            </label>
            <input
              type="number"
              min={1}
              max={20}
              value={settings.target_stamps}
              onChange={(e) => setSettings({ ...settings, target_stamps: Number(e.target.value) || 5 })}
              className="w-full px-3 py-2 rounded-xl border border-slate-700 text-xs font-bold bg-slate-900 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30"
            />
          </div>

          {/* Consumo Mínimo por Sello */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Consumo Mínimo por Sello (€)
            </label>
            <input
              type="number"
              min={1}
              value={settings.min_spend_per_stamp}
              onChange={(e) => setSettings({ ...settings, min_spend_per_stamp: Number(e.target.value) || 50 })}
              className="w-full px-3 py-2 rounded-xl border border-slate-700 text-xs font-bold bg-slate-900 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30"
            />
          </div>

          {/* Etiqueta del Premio */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Premio Otorgado
            </label>
            <input
              type="text"
              value={settings.reward_label}
              onChange={(e) => setSettings({ ...settings, reward_label: e.target.value })}
              placeholder="Ej. Postre o Café gratis"
              className="w-full px-3 py-2 rounded-xl border border-slate-700 text-xs font-bold bg-slate-900 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30"
            />
          </div>
        </div>
      </div>

      {/* 1. TARJETAS DE MÉTRICAS EJECUTIVAS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Clientes */}
        <div className="bg-slate-800/60 border border-slate-700/70 rounded-2xl p-4 flex flex-col justify-between shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Clientes Registrados</span>
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-white">{stats.total_customers}</span>
            <span className="text-[11px] text-slate-500 block mt-0.5">comensales fidelizados</span>
          </div>
        </div>

        {/* Puntos Emitidos */}
        <div className="bg-slate-800/60 border border-slate-700/70 rounded-2xl p-4 flex flex-col justify-between shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Puntos en Circulación</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-white">{stats.total_points_issued}</span>
            <span className="text-[11px] text-slate-500 block mt-0.5">puntos acumulados</span>
          </div>
        </div>

        {/* Clientes con Saldo Canjeable */}
        <div className="bg-slate-800/60 border border-slate-700/70 rounded-2xl p-4 flex flex-col justify-between shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Listos para Canjear</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <Gift className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-white">
              {stats.active_members_with_rewards}
            </span>
            <span className="text-[11px] text-slate-500 block mt-0.5">saldo &gt;= 15 pts</span>
          </div>
        </div>

        {/* Reseñas Google Maps Activadas */}
        <div className="bg-slate-800/60 border border-slate-700/70 rounded-2xl p-4 flex flex-col justify-between shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Booster Google Maps</span>
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
              <Star className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-white">
              {stats.google_reviews_awarded}
            </span>
            <span className="text-[11px] text-slate-500 block mt-0.5">bonificaciones (+50 pts)</span>
          </div>
        </div>
      </div>

      {/* 2. BARRA DE HERRAMIENTAS: BÚSQUEDA, FILTROS Y EXPORTAR CSV */}
      <div className="bg-slate-800/60 border border-slate-700/70 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xl backdrop-blur-md">
        {/* Buscador */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre o correo..."
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 transition-all"
          />
        </div>

        {/* Filtros de Google Maps y Botones de Acción */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center bg-slate-850 p-1 rounded-xl border border-slate-700 text-xs">
            <button
              onClick={() => setFilterGoogle('all')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                filterGoogle === 'all' ? 'bg-white text-blue-700 shadow-2xs font-black' : 'text-slate-300 hover:text-slate-900'
              }`}
            >
              Todos ({profiles.length})
            </button>
            <button
              onClick={() => setFilterGoogle('awarded')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                filterGoogle === 'awarded' ? 'bg-white text-blue-700 shadow-2xs font-black' : 'text-slate-300 hover:text-slate-900'
              }`}
            >
              Con Reseña
            </button>
            <button
              onClick={() => setFilterGoogle('pending')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                filterGoogle === 'pending' ? 'bg-white text-blue-700 shadow-2xs font-black' : 'text-slate-300 hover:text-slate-900'
              }`}
            >
              Sin Reseña
            </button>
          </div>

          <button
            onClick={fetchProfiles}
            disabled={isLoading}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-300 hover:text-slate-900 border border-slate-200 transition-colors cursor-pointer"
            title="Refrescar lista"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs flex items-center gap-1.5 transition-all shadow-md shadow-cyan-500/20 active:scale-95 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* 3. TABLA DE CLIENTES FIDELIZADOS */}
      <div className="bg-slate-800/60 border border-slate-700/70 rounded-2xl overflow-hidden shadow-xl backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-900/80 text-[11px] font-black uppercase tracking-wider text-slate-400">
                <th className="py-3 px-4">Comensal</th>
                <th className="py-3 px-4">Contacto</th>
                <th className="py-3 px-4 text-center">Sellos / Visitas</th>
                <th className="py-3 px-4 text-center">Premios Listos</th>
                <th className="py-3 px-4 text-center">Puntos Totales</th>
                <th className="py-3 px-4 text-center">Google Maps (+50)</th>
                <th className="py-3 px-4 text-right">Fecha de Alta</th>
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-xs text-slate-300">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-cyan-400" />
                    <span>Cargando directorio de comensales...</span>
                  </td>
                </tr>
              ) : filteredProfiles.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
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
                    <tr key={p.id} className="hover:bg-slate-700/40 transition-colors">
                      {/* Nombre y Avatar */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-400 font-black flex items-center justify-center text-xs border border-cyan-500/20">
                            {initials}
                          </div>
                          <div>
                            <span className="font-bold text-white text-sm block leading-tight">{p.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono">ID: {p.id.slice(0, 14)}...</span>
                          </div>
                        </div>
                      </td>

                      {/* Contacto */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 text-slate-200">
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
                        <span className="inline-block px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/20 font-black text-amber-300 text-xs">
                          {p.stamps_count || 0}/{settings.target_stamps || 5}
                        </span>
                      </td>

                      {/* Premios Listos */}
                      <td className="py-3.5 px-4 text-center">
                        {(p.unlocked_rewards_count || 0) > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-300 font-black text-xs border border-emerald-500/30">
                            🎁 {p.unlocked_rewards_count} listo(s)
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs font-medium">0</span>
                        )}
                      </td>

                      {/* Puntos Totales */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-block px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-700 font-black text-cyan-400 text-xs">
                          {p.total_points} pts
                        </span>
                      </td>

                      {/* Google Maps Booster */}
                      <td className="py-3.5 px-4 text-center">
                        {p.google_review_bonus_awarded ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[11px] font-bold">
                            <CheckCircle2 className="w-3 h-3 text-cyan-400" />
                            <span>Otorgado</span>
                          </span>
                        ) : (
                          <span className="inline-block px-2.5 py-0.5 rounded-full bg-slate-900 text-slate-400 text-[11px] border border-slate-800">
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

                      {/* Acciones */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setActionModal({ isOpen: true, type: 'reset_points', profile: p, isProcessing: false })}
                            className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 hover:text-amber-300 border border-amber-500/20 transition-all cursor-pointer shadow-xs active:scale-95"
                            title="Resetear puntos y sellos a 0"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setActionModal({ isOpen: true, type: 'delete_profile', profile: p, isProcessing: false })}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/20 transition-all cursor-pointer shadow-xs active:scale-95"
                            title="Eliminar perfil registrado permanentemente"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    
      {/* 4. MODAL DE CONFIRMACIÓN: RESETEAR O ELIMINAR */}
      {actionModal.isOpen && actionModal.profile && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95">
            <div className="flex items-start gap-4">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 border ${
                  actionModal.type === 'delete_profile'
                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                }`}
              >
                {actionModal.type === 'delete_profile' ? (
                  <Trash2 className="w-6 h-6" />
                ) : (
                  <RotateCcw className="w-6 h-6" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-black text-white">
                  {actionModal.type === 'delete_profile'
                    ? '¿Eliminar perfil de comensal?'
                    : '¿Resetear puntos y sellos?'}
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  {actionModal.type === 'delete_profile'
                    ? `Se eliminará permanentemente la cuenta de ${actionModal.profile.name} (${actionModal.profile.email}) del sistema. Esta acción no se puede deshacer.`
                    : `Se restablecerán a 0 todos los puntos acumulados (${actionModal.profile.total_points} pts) y sellos (${actionModal.profile.stamps_count || 0}) de ${actionModal.profile.name}.`}
                </p>
              </div>
            </div>

            {/* Ficha resumida del comensal */}
            <div className="mt-4 p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between text-xs">
              <div className="min-w-0">
                <span className="font-bold text-slate-200 block truncate">{actionModal.profile.name}</span>
                <span className="text-slate-400 text-[11px] truncate">{actionModal.profile.email}</span>
              </div>
              <div className="text-right flex-shrink-0 pl-3">
                <span className="font-black text-cyan-400 block">{actionModal.profile.total_points} pts</span>
                <span className="text-amber-400 text-[11px] font-bold">
                  {actionModal.profile.stamps_count || 0}/{settings.target_stamps || 5} sellos
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                type="button"
                disabled={actionModal.isProcessing}
                onClick={() => setActionModal({ isOpen: false, type: 'reset_points', profile: null, isProcessing: false })}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={actionModal.isProcessing}
                onClick={handleConfirmAction}
                className={`px-4 py-2 rounded-xl font-black text-xs transition-all flex items-center gap-2 cursor-pointer shadow-md ${
                  actionModal.type === 'delete_profile'
                    ? 'bg-rose-500 hover:bg-rose-400 text-white shadow-rose-500/20'
                    : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                }`}
              >
                {actionModal.isProcessing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Procesando...</span>
                  </>
                ) : actionModal.type === 'delete_profile' ? (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Eliminar Definitivamente</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Resetear a 0</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
