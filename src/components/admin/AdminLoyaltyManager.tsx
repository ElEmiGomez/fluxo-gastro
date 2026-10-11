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
} from 'lucide-react'
import { LoyaltyProfile } from '@/types/loyalty.types'

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

  useEffect(() => {
    fetchProfiles()
  }, [fetchProfiles])

  // Filtrado adicional en memoria por estado Google Maps
  const filteredProfiles = useMemo(() => {
    return profiles.filter((p) => {
      if (filterGoogle === 'awarded') return p.google_review_bonus_awarded === true
      if (filterGoogle === 'pending') return !p.google_review_bonus_awarded
      return true
    })
  }, [profiles, filterGoogle])

  // Exportación directa a CSV para campañas de email marketing
  const handleExportCSV = () => {
    if (filteredProfiles.length === 0) {
      onToast('No hay clientes en la lista para exportar')
      return
    }

    const headers = [
      'Nombre',
      'Email',
      'Telefono',
      'Puntos_Totales',
      'Puntos_Disponibles',
      'Puntos_Retenidos',
      'Resena_Google_Maps',
      'Fecha_Alta',
    ]

    const rows = filteredProfiles.map((p) => [
      `"${(p.name || '').replace(/"/g, '""')}"`,
      `"${(p.email || '').replace(/"/g, '""')}"`,
      `"${(p.phone || '').replace(/"/g, '""')}"`,
      p.total_points,
      p.available_points,
      p.held_points,
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
      {/* 1. TARJETAS DE MÉTRICAS EJECUTIVAS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Clientes */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Clientes Registrados</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-white">{stats.total_customers}</span>
            <span className="text-[11px] text-slate-400 block mt-0.5">comensales fidelizados</span>
          </div>
        </div>

        {/* Puntos Emitidos */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Puntos en Circulación</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-amber-400">{stats.total_points_issued}</span>
            <span className="text-[11px] text-slate-400 block mt-0.5">puntos acumulados</span>
          </div>
        </div>

        {/* Clientes con Saldo Canjeable */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Listos para Canjear</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <Gift className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-emerald-400">
              {stats.active_members_with_rewards}
            </span>
            <span className="text-[11px] text-slate-400 block mt-0.5">saldo &gt;= 15 pts</span>
          </div>
        </div>

        {/* Reseñas Google Maps Activadas */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Booster Google Maps</span>
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
              <Star className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-cyan-400">
              {stats.google_reviews_awarded}
            </span>
            <span className="text-[11px] text-slate-400 block mt-0.5">bonificaciones (+50 pts)</span>
          </div>
        </div>
      </div>

      {/* 2. BARRA DE HERRAMIENTAS: BÚSQUEDA, FILTROS Y EXPORTAR CSV */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Buscador */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre o correo..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
          />
        </div>

        {/* Filtros de Google Maps y Botones de Acción */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setFilterGoogle('all')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                filterGoogle === 'all' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Todos ({profiles.length})
            </button>
            <button
              onClick={() => setFilterGoogle('awarded')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                filterGoogle === 'awarded' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-white'
              }`}
            >
              Con Reseña
            </button>
            <button
              onClick={() => setFilterGoogle('pending')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                filterGoogle === 'pending' ? 'bg-slate-800 text-slate-300' : 'text-slate-400 hover:text-white'
              }`}
            >
              Sin Reseña
            </button>
          </div>

          <button
            onClick={fetchProfiles}
            disabled={isLoading}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
            title="Refrescar lista"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 transition-all shadow-md hover:shadow-amber-500/20 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* 3. TABLA DE CLIENTES FIDELIZADOS */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-black uppercase tracking-wider text-slate-400">
                <th className="py-3 px-4">Comensal</th>
                <th className="py-3 px-4">Contacto</th>
                <th className="py-3 px-4 text-center">Puntos Totales</th>
                <th className="py-3 px-4 text-center">Saldo Disponible</th>
                <th className="py-3 px-4 text-center">Google Maps (+50)</th>
                <th className="py-3 px-4 text-right">Fecha de Alta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs text-slate-200">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-500" />
                    <span>Cargando directorio de comensales...</span>
                  </td>
                </tr>
              ) : filteredProfiles.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <AlertCircle className="w-6 h-6 mx-auto mb-2 text-slate-500" />
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
                    <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                      {/* Nombre y Avatar */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 text-slate-950 font-black flex items-center justify-center text-xs shadow-inner">
                            {initials}
                          </div>
                          <div>
                            <span className="font-black text-white text-sm block leading-tight">{p.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono">ID: {p.id.slice(0, 14)}...</span>
                          </div>
                        </div>
                      </td>

                      {/* Contacto */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 text-slate-300">
                            <Mail className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                            <span className="font-medium">{p.email}</span>
                          </div>
                          {p.phone && (
                            <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                              <Phone className="w-3 h-3 text-slate-500 flex-shrink-0" />
                              <span>{p.phone}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Puntos Totales */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-block px-2.5 py-1 rounded-xl bg-slate-950 border border-slate-700 font-black text-white text-xs">
                          {p.total_points} pts
                        </span>
                      </td>

                      {/* Saldo Disponible */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span
                            className={`px-2.5 py-1 rounded-xl font-black text-xs ${
                              p.available_points >= 15
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                : 'bg-slate-800 text-slate-300 border border-slate-700'
                            }`}
                          >
                            {p.available_points} pts
                          </span>
                          {p.held_points > 0 && (
                            <span className="text-[10px] text-blue-400 flex items-center gap-0.5 mt-0.5">
                              <Clock className="w-2.5 h-2.5" />
                              <span>{p.held_points} en mesa</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Google Maps Booster */}
                      <td className="py-3.5 px-4 text-center">
                        {p.google_review_bonus_awarded ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[11px] font-bold">
                            <CheckCircle2 className="w-3 h-3 text-cyan-400" />
                            <span>Otorgado</span>
                          </span>
                        ) : (
                          <span className="inline-block px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[11px]">
                            Pendiente
                          </span>
                        )}
                      </td>

                      {/* Fecha de Registro */}
                      <td className="py-3.5 px-4 text-right text-slate-400 text-[11px]">
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
