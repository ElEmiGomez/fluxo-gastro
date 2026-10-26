'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  TrendingUp,
  DollarSign,
  Users,
  Award,
  Plus,
  Download,
  Search,
  Filter,
  Kanban,
  Table as TableIcon,
  MapPin,
  Star,
  Clock,
  Phone,
  MessageCircle,
  ExternalLink,
  ChevronRight,
  RefreshCw,
  Lock,
  LogOut,
  Building2,
  Sparkles,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { CRMICP, CRMLead, CRMMetrics, CRMPlan, CRMStatus } from '@/types/crm.types'
import dynamic from 'next/dynamic'
import { CRMAuthModal } from '@/components/crm/CRMAuthModal'
import { CRMQuickAddModal } from '@/components/crm/CRMQuickAddModal'
import { CRMLeadDetailModal } from '@/components/crm/CRMLeadDetailModal'

const STATUS_COLUMNS: { id: CRMStatus; title: string; color: string; badgeBg: string }[] = [
  { id: 'lead_por_visitar', title: 'Por Visitar', color: 'border-slate-700', badgeBg: 'bg-slate-800 text-slate-300' },
  { id: 'contactado', title: 'Contactados', color: 'border-blue-800/60', badgeBg: 'bg-blue-950/80 text-blue-300' },
  { id: 'piloto_14_dias', title: 'Piloto (14 Días)', color: 'border-amber-800/60', badgeBg: 'bg-amber-950/80 text-amber-300' },
  { id: 'en_negociacion', title: 'En Negociación', color: 'border-purple-800/60', badgeBg: 'bg-purple-950/80 text-purple-300' },
  { id: 'ganado', title: 'Ganados (Clientes)', color: 'border-emerald-800/60', badgeBg: 'bg-emerald-950/80 text-emerald-300' },
  { id: 'perdido', title: 'Perdidos', color: 'border-rose-800/60', badgeBg: 'bg-rose-950/80 text-rose-300' },
]

// Helper para autorizar peticiones de forma resiliente en móvil (Cookie + Bearer Token)
const getAuthHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (typeof window !== 'undefined') {
    try {
      const token =
        localStorage.getItem('fluxo_founder_token') ||
        sessionStorage.getItem('fluxo_founder_token')
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
    } catch {
      // ignore
    }
  }
  return headers
}

const CRMMap = dynamic(() => import('@/components/crm/CRMMap').then((m) => m.CRMMap), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[72vh] min-h-[500px] rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
      <div className="flex flex-col items-center gap-2">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-mono">Cargando mapa interactivo de Noia...</span>
      </div>
    </div>
  ),
})

export default function CRMAdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  const [checkingAuth, setCheckingAuth] = useState<boolean>(true)
  const [leads, setLeads] = useState<CRMLead[]>([])
  const [metrics, setMetrics] = useState<CRMMetrics | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [viewMode, setViewMode] = useState<'kanban' | 'table' | 'map'>('kanban')

  // Filtros
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedZone, setSelectedZone] = useState<string>('all')
  const [selectedICP, setSelectedICP] = useState<string>('all')
  const [selectedPlan, setSelectedPlan] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')

  // Modales
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false)
  const [selectedLead, setSelectedLead] = useState<CRMLead | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  // 1. Verificar autenticación al montar
  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const headers = getAuthHeaders()
        const res = await fetch('/api/crm/auth', { headers })
        const data = await res.json()
        if (data.authenticated) {
          setIsAuthenticated(true)
          fetchCRMData()
        } else {
          setIsAuthenticated(false)
        }
      } catch {
        setIsAuthenticated(false)
      } finally {
        setCheckingAuth(false)
      }
    }
    verifyAuth()
  }, [])

  // 2. Cargar datos del CRM
  const fetchCRMData = async () => {
    setLoading(true)
    try {
      const headers = getAuthHeaders()
      const res = await fetch('/api/crm', { headers })
      if (res.ok) {
        const data = await res.json()
        setLeads(data.leads || [])
        setMetrics(data.metrics || null)
      } else if (res.status === 401) {
        setIsAuthenticated(false)
      }
    } catch (e) {
      console.error('Error fetching CRM data:', e)
    } finally {
      setLoading(false)
    }
  }

  // 3. Crear nuevo Lead
  const handleCreateLead = async (leadData: Omit<CRMLead, 'id' | 'created_at' | 'updated_at'>) => {
    const res = await fetch('/api/crm', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(leadData),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Error al guardar lead')
    }
    const data = await res.json()
    if (data.lead) {
      setLeads((prev) => [data.lead, ...prev])
      if (data.metrics) setMetrics(data.metrics)
    }
  }

  // 4. Actualizar Lead
  const handleUpdateLead = async (id: string, updates: Partial<CRMLead>) => {
    const res = await fetch('/api/crm', {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ id, ...updates }),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Error al actualizar lead')
    }
    const data = await res.json()
    if (data.lead) {
      setLeads((prev) => prev.map((l) => (l.id === id ? data.lead : l)))
      if (data.metrics) setMetrics(data.metrics)
      if (selectedLead?.id === id) setSelectedLead(data.lead)
    }
  }

  // 5. Eliminar Lead
  const handleDeleteLead = async (id: string) => {
    const res = await fetch(`/api/crm?id=${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Error al eliminar lead')
    }
    const data = await res.json()
    setLeads((prev) => prev.filter((l) => l.id !== id))
    if (data.metrics) setMetrics(data.metrics)
  }

  // 6. Cerrar sesión
  const handleLogout = async () => {
    try {
      await fetch('/api/crm/auth', { method: 'DELETE', headers: getAuthHeaders() })
    } catch {}
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('fluxo_founder_authed')
        localStorage.removeItem('fluxo_founder_token')
        sessionStorage.removeItem('fluxo_founder_authed')
        sessionStorage.removeItem('fluxo_founder_token')
      } catch {}
    }
    setIsAuthenticated(false)
  }

  // 7. Descargar CSV
  const handleExportCSV = () => {
    window.open('/api/crm?format=csv', '_blank')
  }

  // 8. Filtrar leads
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const matchesSearch =
        searchQuery === '' ||
        lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (lead.contact_name && lead.contact_name.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchesZone = selectedZone === 'all' || lead.zone === selectedZone
      const matchesICP = selectedICP === 'all' || lead.icp_segment === selectedICP
      const matchesPlan = selectedPlan === 'all' || lead.target_plan === selectedPlan
      const matchesStatus = selectedStatus === 'all' || lead.status === selectedStatus

      return matchesSearch && matchesZone && matchesICP && matchesPlan && matchesStatus
    })
  }, [leads, searchQuery, selectedZone, selectedICP, selectedPlan, selectedStatus])

  // Obtener zonas únicas para selector
  const uniqueZones = useMemo(() => {
    const zones = new Set<string>()
    leads.forEach((l) => {
      if (l.zone) zones.add(l.zone)
    })
    return Array.from(zones)
  }, [leads])

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-mono">Verificando credenciales de fundador...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <CRMAuthModal
        onSuccess={() => {
          setIsAuthenticated(true)
          fetchCRMData()
        }}
      />
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* 1. Header Superior */}
      <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Logo y Título */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-500/20">
              F
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-base sm:text-lg text-white">CRM Fundador</h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  FASE 1: NOIA
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Prospección comercial en calle y control de métricas B2B
              </p>
            </div>
          </div>

          {/* Acciones del Header */}
          <div className="flex items-center gap-2">
            <button
              onClick={fetchCRMData}
              disabled={loading}
              title="Recargar datos"
              className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={handleExportCSV}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">Exportar Excel</span>
            </button>

            <button
              onClick={() => setIsQuickAddOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-lg shadow-blue-600/25"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Local</span>
            </button>

            <button
              onClick={handleLogout}
              title="Cerrar sesión"
              className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-slate-800/60 transition ml-1"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* 2. Barra de Métricas KPI Clave */}
      <section className="px-4 py-4 sm:px-6 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {/* MRR Ganado */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>MRR Ganado</span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
              {metrics?.wonMRR || 0} €<span className="text-xs text-slate-400 font-normal">/mes</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1 font-mono">
              ARR: {((metrics?.wonMRR || 0) * 12).toLocaleString()} €/año
            </div>
          </div>

          {/* Pipeline Ponderado */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Pipeline en Juego</span>
              <TrendingUp className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-white font-mono">
              {metrics?.pipelineMRR || 0} €<span className="text-xs text-slate-400 font-normal">/mes</span>
            </div>
            <div className="text-[11px] text-blue-400/80 mt-1">
              {(metrics?.pipelineCounts.contactado || 0) +
                (metrics?.pipelineCounts.piloto_14_dias || 0) +
                (metrics?.pipelineCounts.en_negociacion || 0)}{' '}
              en proceso activo
            </div>
          </div>

          {/* Pilotos Activos (14 días) */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Pilotos de 14 Días</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-amber-400 font-mono">
              {metrics?.activePilotsCount || 0}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Locales probando sin coste
            </div>
          </div>

          {/* Tasa de Conversión */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Conversión</span>
              <Award className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-purple-400 font-mono">
              {metrics?.conversionRate || 0}%
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {metrics?.wonCount || 0} de {metrics?.totalLeads || 0} locales
            </div>
          </div>

          {/* Universo de Locales */}
          <div className="col-span-2 lg:col-span-1 p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Universo Noia</span>
              <Building2 className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-white font-mono">
              {metrics?.totalLeads || 0}
            </div>
            <div className="text-[11px] text-emerald-400/80 mt-1">
              100% auditados y geolocalizados
            </div>
          </div>
        </div>
      </section>

      {/* 3. Barra de Búsqueda, Filtros y Selector de Vista */}
      <section className="px-4 pb-4 sm:px-6 max-w-7xl mx-auto w-full">
        <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
          {/* Buscador */}
          <div className="relative flex-1 min-w-[200px] sm:min-w-[280px]">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar local, calle o contacto..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Filtros */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Filtro Zona */}
            <select
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
              className="px-2.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="all">Todas las Zonas</option>
              {uniqueZones.map((z) => (
                <option key={z} value={z}>
                  {z}
                </option>
              ))}
            </select>

            {/* Filtro ICP */}
            <select
              value={selectedICP}
              onChange={(e) => setSelectedICP(e.target.value)}
              className="px-2.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="all">Todos los ICPs</option>
              <option value="CARLOS">Carlos (Alta rotación)</option>
              <option value="MARTIN">Martín (Tradicional)</option>
              <option value="LUCIA">Lucía (Gastrobar)</option>
            </select>

            {/* Filtro Plan */}
            <select
              value={selectedPlan}
              onChange={(e) => setSelectedPlan(e.target.value)}
              className="px-2.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="all">Todos los Planes</option>
              <option value="carta_39">Carta 39€</option>
              <option value="sala_69">Sala 69€</option>
              <option value="full_99">Full 99€</option>
              <option value="suite_139">Suite 139€</option>
            </select>

            {/* Toggle Modo Vista (Kanban / Tabla) */}
            <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700/80">
              <button
                onClick={() => setViewMode('kanban')}
                className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                  viewMode === 'kanban'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Kanban className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Pipeline</span>
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                  viewMode === 'table'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Tabla</span>
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                  viewMode === 'map'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">Mapa</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Cuerpo Principal: Kanban o Tabla */}
      <main className="px-4 pb-12 sm:px-6 max-w-7xl mx-auto w-full flex-1">
        {viewMode === 'kanban' ? (
          /* Vista KANBAN Horizontal */
          <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-thin scrollbar-thumb-slate-800">
            {STATUS_COLUMNS.map((col) => {
              const columnLeads = filteredLeads.filter((l) => l.status === col.id)
              const columnMRR = columnLeads.reduce(
                (acc, curr) => acc + Number(curr.mrr_projected || 39),
                0
              )

              return (
                <div
                  key={col.id}
                  className="w-80 shrink-0 flex flex-col rounded-2xl bg-slate-900/60 border border-slate-800/80 max-h-[75vh]"
                >
                  {/* Encabezado de Columna */}
                  <div className="p-3.5 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900/90 backdrop-blur-sm rounded-t-2xl z-10">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-xs text-white">{col.title}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-bold ${col.badgeBg}`}>
                        {columnLeads.length}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-emerald-400 font-semibold">
                      {columnMRR} €
                    </span>
                  </div>

                  {/* Lista de Tarjetas de Local */}
                  <div className="p-3 space-y-2.5 overflow-y-auto flex-1">
                    {columnLeads.length === 0 ? (
                      <div className="py-8 text-center text-xs text-slate-500 italic">
                        Sin locales en esta etapa
                      </div>
                    ) : (
                      columnLeads.map((lead) => (
                        <div
                          key={lead.id}
                          onClick={() => {
                            setSelectedLead(lead)
                            setIsDetailOpen(true)
                          }}
                          className="p-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 hover:border-blue-500/50 transition cursor-pointer shadow-sm group select-none relative"
                        >
                          {/* Segmento & Score */}
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                              {lead.icp_segment}
                            </span>
                            <span className="text-[11px] font-bold text-amber-400 flex items-center gap-0.5">
                              ★ {lead.score}
                            </span>
                          </div>

                          {/* Nombre del Local */}
                          <h4 className="font-bold text-sm text-white group-hover:text-blue-400 transition truncate">
                            {lead.name}
                          </h4>

                          {/* Dirección */}
                          <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-1 truncate">
                            <MapPin className="w-3 h-3 shrink-0 text-slate-500" />
                            <span className="truncate">{lead.address}</span>
                          </div>

                          {/* Notas cortas */}
                          {lead.notes && (
                            <p className="text-[11px] text-slate-400 mt-2 line-clamp-2 bg-slate-900/60 p-2 rounded-lg border border-slate-800/80">
                              {lead.notes}
                            </p>
                          )}

                          {/* Control de Piloto: Hito, Checklist y Firma (Ideas 7, 8, 9) */}
                          {lead.status === 'piloto_14_dias' && (
                            <div className="mt-2.5 pt-2 border-t border-slate-700/40 flex items-center gap-1.5 flex-wrap">
                              {/* Hito y días restantes */}
                              {lead.pilot_start_date && (() => {
                                const start = new Date(lead.pilot_start_date).getTime()
                                const diff = Math.max(1, Math.floor((Date.now() - start) / 86400000) + 1)
                                const day = Math.min(diff, 14)
                                const isUrgent = day >= 12
                                return (
                                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border flex items-center gap-1 ${
                                    isUrgent
                                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                                      : day >= 7
                                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                      : 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                                  }`}>
                                    <Clock className="w-2.5 h-2.5" />
                                    Día {day}/14 {isUrgent ? '• Cierre' : day >= 7 ? '• Balance' : ''}
                                  </span>
                                )
                              })()}

                              {/* Checklist */}
                              {(() => {
                                const cl = lead.pilot_checklist
                                const count = cl ? Object.values(cl).filter(Boolean).length : 0
                                return (
                                  <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono border ${
                                    count === 4
                                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 font-bold'
                                      : 'bg-slate-800 text-slate-400 border-slate-700'
                                  }`}>
                                    ✓ {count}/4
                                  </span>
                                )
                              })()}

                              {/* Firma digital */}
                              {lead.pilot_agreement && (
                                <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-amber-500/10 text-amber-300 border border-amber-500/20 font-bold">
                                  ✍ Firmado
                                </span>
                              )}
                            </div>
                          )}

                          {/* Pie de Tarjeta: Plan y Botón WhatsApp / Llamar */}
                          <div className="mt-3 pt-2.5 border-t border-slate-700/50 flex items-center justify-between text-xs">
                            <span className="text-[11px] font-mono text-emerald-400 font-semibold">
                              {lead.mrr_projected} €/mes
                            </span>

                            <div className="flex items-center gap-1.5">
                              {lead.contact_phone && (
                                <a
                                  href={`tel:${lead.contact_phone}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="p-1 rounded-lg bg-slate-700/60 text-slate-300 hover:text-white transition"
                                  title={`Llamar a ${lead.contact_phone}`}
                                >
                                  <Phone className="w-3.5 h-3.5" />
                                </a>
                              )}
                              <span className="text-[10px] text-slate-400 group-hover:translate-x-0.5 transition flex items-center">
                                Abrir <ChevronRight className="w-3 h-3 ml-0.5" />
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : viewMode === 'table' ? (
          /* Vista TABLA Detallada */
          <div className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Local</th>
                    <th className="px-4 py-3">Zona</th>
                    <th className="px-4 py-3">ICP</th>
                    <th className="px-4 py-3">Score</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3">Plan / MRR</th>
                    <th className="px-4 py-3">Contacto</th>
                    <th className="px-4 py-3 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredLeads.map((lead) => (
                    <tr
                      key={lead.id}
                      onClick={() => {
                        setSelectedLead(lead)
                        setIsDetailOpen(true)
                      }}
                      className="hover:bg-slate-800/50 transition cursor-pointer"
                    >
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-white text-sm">{lead.name}</div>
                        <div className="text-[11px] text-slate-400 truncate max-w-xs">{lead.address}</div>
                      </td>
                      <td className="px-4 py-3.5 text-slate-300 whitespace-nowrap">{lead.zone}</td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          {lead.icp_segment}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap font-bold text-amber-400">
                        ★ {lead.score}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-800 text-slate-200 border border-slate-700">
                          {lead.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap font-mono text-emerald-400 font-bold">
                        {lead.mrr_projected} €/mes
                      </td>
                      <td className="px-4 py-3.5 text-slate-400 whitespace-nowrap">
                        {lead.contact_phone || 'Sin registrar'}
                      </td>
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedLead(lead)
                            setIsDetailOpen(true)
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-[11px] font-semibold transition"
                        >
                          Gestionar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Vista MAPA Interactivo de Noia */
          <CRMMap
            leads={filteredLeads}
            onOpenDetail={(lead) => {
              setSelectedLead(lead)
              setIsDetailOpen(true)
            }}
          />
        )}
      </main>

      {/* Modales */}
      <CRMQuickAddModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        onSave={handleCreateLead}
      />

      <CRMLeadDetailModal
        lead={selectedLead}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false)
          setSelectedLead(null)
        }}
        onUpdate={handleUpdateLead}
        onDelete={handleDeleteLead}
      />
    </div>
  )
}
