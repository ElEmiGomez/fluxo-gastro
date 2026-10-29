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
  AlertCircle,
  QrCode,
  Calendar,
  Sun,
  Moon,
  FileSpreadsheet,
  FileCode,
  FileText,
  Check,
  LayoutDashboard,
  MoveRight
} from 'lucide-react'
import {
  CRMICP,
  CRMLead,
  CRMMetrics,
  CRMPlan,
  CRMStatus,
  POS_SYSTEM_CONFIG,
  NOIA_COMMERCIAL_EVENTS,
  normalizeICP,
  ICP_CONFIG
} from '@/types/crm.types'
import {
  saveLeadsToOfflineCache,
  getLeadsFromOfflineCache,
  enqueueOfflineMutation,
  syncPendingOfflineMutations,
} from '@/lib/crm/offline-sync'
import dynamic from 'next/dynamic'
import { CRMAuthModal } from '@/components/crm/CRMAuthModal'
import { CRMQuickAddModal } from '@/components/crm/CRMQuickAddModal'
import { CRMLeadDetailModal } from '@/components/crm/CRMLeadDetailModal'
import { CRMContactCardModal } from '@/components/crm/CRMContactCardModal'
import { FluxoLogo } from '@/components/common/FluxoLogo'

const STATUS_COLUMNS: { id: CRMStatus; title: string; color: string; badgeBg: string; badgeBgLight: string }[] = [
  { id: 'lead_por_visitar', title: 'Por Visitar', color: 'border-slate-700', badgeBg: 'bg-slate-800 text-slate-300', badgeBgLight: 'bg-slate-200 text-slate-700' },
  { id: 'contactado', title: 'Contactados', color: 'border-blue-800/60', badgeBg: 'bg-blue-950/80 text-blue-300', badgeBgLight: 'bg-blue-100 text-blue-800' },
  { id: 'piloto_14_dias', title: 'Piloto (14 Días)', color: 'border-amber-800/60', badgeBg: 'bg-amber-950/80 text-amber-300', badgeBgLight: 'bg-amber-100 text-amber-800' },
  { id: 'en_negociacion', title: 'En Negociación', color: 'border-purple-800/60', badgeBg: 'bg-purple-950/80 text-purple-300', badgeBgLight: 'bg-purple-100 text-purple-800' },
  { id: 'ganado', title: 'Ganados (Clientes)', color: 'border-emerald-800/60', badgeBg: 'bg-emerald-950/80 text-emerald-300', badgeBgLight: 'bg-emerald-100 text-emerald-800' },
  { id: 'perdido', title: 'Perdidos', color: 'border-rose-800/60', badgeBg: 'bg-rose-950/80 text-rose-300', badgeBgLight: 'bg-rose-100 text-rose-800' },
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

  // Modo Claro / Oscuro (Tema estilo imagen de referencia por defecto)
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  // Filtros
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedZone, setSelectedZone] = useState<string>('all')
  const [selectedICP, setSelectedICP] = useState<string>('all')
  const [selectedPlan, setSelectedPlan] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')

  // Modales y menús
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false)
  const [selectedLead, setSelectedLead] = useState<CRMLead | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isContactCardOpen, setIsContactCardOpen] = useState(false)
  const [showAllEvents, setShowAllEvents] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [isOnline, setIsOnline] = useState<boolean>(true)
  const [syncMessage, setSyncMessage] = useState<string | null>(null)

  // Drag & Drop Trello Style
  const [draggingLeadId, setDraggingLeadId] = useState<string | null>(null)
  const [dragOverColId, setDragOverColId] = useState<CRMStatus | null>(null)

  // Inicializar tema desde localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('fluxo_crm_theme') as 'light' | 'dark' | null
      if (savedTheme) {
        setTheme(savedTheme)
      }
    }
  }, [])

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(nextTheme)
    if (typeof window !== 'undefined') {
      localStorage.setItem('fluxo_crm_theme', nextTheme)
    }
  }

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
    // Si no hay conexión, aplicar inmediatamente en local y encolar
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      enqueueOfflineMutation({ leadId: id, type: 'update', payload: updates })
      setLeads((prev) => {
        const updated = prev.map((l) => (l.id === id ? { ...l, ...updates, updated_at: new Date().toISOString() } : l))
        saveLeadsToOfflineCache(updated)
        return updated
      })
      if (selectedLead?.id === id) {
        setSelectedLead((prev) => (prev ? { ...prev, ...updates } : null))
      }
      setSyncMessage('✓ Cambio guardado localmente (sin cobertura). Se subirá al recuperar señal.')
      return
    }

    // Actualización optimista local
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, ...updates, updated_at: new Date().toISOString() } : l)))
    if (selectedLead?.id === id) {
      setSelectedLead((prev) => (prev ? { ...prev, ...updates } : null))
    }

    try {
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
    } catch (e: any) {
      console.error('Error al actualizar lead:', e)
      fetchCRMData()
    }
  }

  // Drag and Drop Handlers (Trello Style)
  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData('text/plain', leadId)
    e.dataTransfer.effectAllowed = 'move'
    setDraggingLeadId(leadId)
  }

  const handleDragOver = (e: React.DragEvent, colId: CRMStatus) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (dragOverColId !== colId) {
      setDragOverColId(colId)
    }
  }

  const handleDragLeave = (colId: CRMStatus) => {
    if (dragOverColId === colId) {
      setDragOverColId(null)
    }
  }

  const handleDrop = (e: React.DragEvent, targetStatus: CRMStatus) => {
    e.preventDefault()
    const leadId = e.dataTransfer.getData('text/plain') || draggingLeadId
    setDraggingLeadId(null)
    setDragOverColId(null)

    if (!leadId) return
    const targetLead = leads.find((l) => l.id === leadId)
    if (targetLead && targetLead.status !== targetStatus) {
      handleUpdateLead(leadId, { status: targetStatus })
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

  // 7. Opciones de Exportación
  const handleExportCSV = () => {
    window.open('/api/crm?format=csv', '_blank')
  }

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(leads, null, 2))
    const downloadAnchor = document.createElement('a')
    downloadAnchor.setAttribute('href', dataStr)
    downloadAnchor.setAttribute('download', `fluxo-crm-leads-${new Date().toISOString().split('T')[0]}.json`)
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()
  }

  const handleCopyMarkdownSummary = () => {
    const lines = [
      `# Resumen Comercial Fluxo CRM — ${new Date().toLocaleDateString('es-ES')}`,
      `Total Locales: ${leads.length} | Ganados: ${metrics?.wonCount || 0} (${metrics?.wonMRR || 0} €/mes) | Pilotos: ${metrics?.activePilotsCount || 0}`,
      '',
      '## Estado de Locales en Noia:',
      ...leads.map((l) => `- [${l.status.toUpperCase()}] **${l.name}** (${l.zone}) — ICP: ${normalizeICP(l.icp_segment)} | Plan: ${l.target_plan} | Tel: ${l.contact_phone || 'Sin tel'} | Notas: ${l.notes || 'Sin notas'}`)
    ].join('\n')

    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(lines)
      setSyncMessage('✓ Resumen copiado al portapapeles con éxito')
      setTimeout(() => setSyncMessage(null), 3000)
    }
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
      const matchesICP = selectedICP === 'all' || normalizeICP(lead.icp_segment) === selectedICP
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

  const isLight = theme === 'light'

  return (
    <div
      data-theme={theme}
      className={`min-h-screen font-sans p-3 md:p-5 ${
        isLight
          ? 'crm-mesh-bg text-slate-800 selection:bg-blue-600 selection:text-white'
          : 'crm-mesh-bg-dark text-slate-100 selection:bg-blue-600 selection:text-white'
      }`}
    >
      {/* Ventana flotante unificada estilo macOS: marco de cristal redondeado
          que flota sobre el lienzo mesh. La geometría interna (flex aside/main)
          se conserva intacta. */}
      <div
        className={`flex flex-col md:flex-row overflow-hidden rounded-[28px] shadow-[0_25px_80px_rgba(15,23,42,0.22)] min-h-[calc(100vh-1.5rem)] md:min-h-[calc(100vh-2.5rem)] ${
          isLight
            ? 'border border-white/50 bg-white/30 backdrop-blur-3xl'
            : 'border border-white/10 bg-slate-950/55 backdrop-blur-3xl'
        }`}
      >
      {/* ==============================================================================
          BARRA LATERAL IZQUIERDA (Estilo CRM.io de la imagen de referencia)
      ============================================================================== */}
      <aside className="w-full md:w-64 apple-glass-sidebar text-slate-300 flex flex-col shrink-0 z-20 relative overflow-hidden">
        {/* Reflejo diagonal tenue en la parte superior (decorativo, sin interacción) */}
        <div
          className="absolute inset-x-0 top-0 h-24 pointer-events-none"
          style={{ background: 'linear-gradient(125deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.04) 45%, rgba(255,255,255,0) 70%)' }}
          aria-hidden
        />
        {/* Logotipo de Marca */}
        <div className="relative p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <FluxoLogo size={36} />
            <div>
              <span className="text-lg font-black tracking-tight text-white">
                Fluxo
              </span>
              <p className="text-[10px] text-slate-400 font-mono tracking-wider uppercase">CRM Fundador</p>
            </div>
          </div>

          {/* Toggle Modo Claro/Oscuro en móvil */}
          <button
            onClick={toggleTheme}
            className="md:hidden p-2 rounded-xl bg-slate-800/80 text-amber-400 hover:text-white transition"
            title="Alternar Modo Claro / Oscuro"
          >
            {isLight ? <Moon className="w-4 h-4 text-slate-300" /> : <Sun className="w-4 h-4 text-amber-400" />}
          </button>
        </div>

        {/* Navegación y Vistas */}
        <div className="relative p-4 space-y-6 flex-1 overflow-y-auto">
          {/* Sección Vistas de Trabajo */}
          <div className="space-y-1.5">
            <p className="px-3 text-[10px] font-bold text-slate-400 tracking-wider uppercase">Gestión</p>

            <button
              onClick={() => setViewMode('kanban')}
              className={`w-full px-3.5 py-2.5 rounded-full text-xs font-semibold flex items-center gap-3 apple-smooth ${
                viewMode === 'kanban'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-500 text-white shadow-[0_6px_20px_rgba(59,130,246,0.4)]'
                  : 'text-slate-300/90 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Kanban className="w-4 h-4" />
              <span>Pipeline (Kanban)</span>
            </button>

            <button
              onClick={() => setViewMode('table')}
              className={`w-full px-3.5 py-2.5 rounded-full text-xs font-semibold flex items-center gap-3 apple-smooth ${
                viewMode === 'table'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-500 text-white shadow-[0_6px_20px_rgba(59,130,246,0.4)]'
                  : 'text-slate-300/90 hover:bg-white/10 hover:text-white'
              }`}
            >
              <TableIcon className="w-4 h-4" />
              <span>Tabla de Locales</span>
            </button>

            <button
              onClick={() => setViewMode('map')}
              className={`w-full px-3.5 py-2.5 rounded-full text-xs font-semibold flex items-center gap-3 apple-smooth ${
                viewMode === 'map'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-500 text-white shadow-[0_6px_20px_rgba(59,130,246,0.4)]'
                  : 'text-slate-300/90 hover:bg-white/10 hover:text-white'
              }`}
            >
              <MapPin className="w-4 h-4" />
              <span>Mapa de Noia</span>
            </button>
          </div>

          {/* Sección Acciones Rápidas */}
          <div className="space-y-1.5">
            <p className="px-3 text-[10px] font-bold text-slate-400 tracking-wider uppercase">Acciones</p>

            <button
              onClick={() => setIsQuickAddOpen(true)}
              className="w-full px-3.5 py-2.5 rounded-full bg-white/10 hover:bg-white/[0.18] text-white border border-white/[0.15] text-xs font-bold flex items-center gap-3 backdrop-blur-md apple-smooth active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Local</span>
            </button>

            <button
              onClick={() => setIsContactCardOpen(true)}
              className="w-full px-3.5 py-2.5 rounded-full bg-white/10 hover:bg-white/[0.18] text-slate-200 border border-white/[0.15] text-xs font-semibold flex items-center gap-3 backdrop-blur-md apple-smooth"
            >
              <QrCode className="w-4 h-4 text-blue-400" />
              <span>Mi Tarjeta QR</span>
            </button>
          </div>

          {/* Datos del Fundador */}
          <div className="pt-2">
            <div className="p-3 rounded-2xl bg-white/[0.08] border border-white/[0.12] backdrop-blur-md flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white font-black text-xs shadow-md">
                EG
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white truncate">Emiliano Gomez</p>
                <div className="text-[10px] space-y-0.5 mt-0.5">
                  <p className="text-slate-400 font-mono truncate">📞 +34 711 573 870 (Llamadas)</p>
                  <p className="text-emerald-400 font-mono truncate">💬 +54 358 518 7430 (WA)</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pie de Barra Lateral */}
        <div className="relative p-4 border-t border-white/10 flex items-center justify-between text-xs">
          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 text-slate-400 hover:text-white p-1.5 rounded-full hover:bg-white/10 apple-smooth"
            title="Cambiar Modo Claro / Oscuro"
          >
            {isLight ? (
              <>
                <Moon className="w-4 h-4 text-blue-400" />
                <span className="hidden md:inline text-xs">Modo Oscuro</span>
              </>
            ) : (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span className="hidden md:inline text-xs">Modo Claro</span>
              </>
            )}
          </button>

          <button
            onClick={handleLogout}
            title="Cerrar sesión de fundador"
            className="p-1.5 rounded-full text-slate-400 hover:text-rose-400 hover:bg-white/10 apple-smooth"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* ==============================================================================
          ESPACIO DE TRABAJO PRINCIPAL (Overview & Dashboard)
      ============================================================================== */}
      <div className={`flex-1 flex flex-col min-w-0 overflow-y-auto max-md:rounded-b-[28px] ${
        isLight
          ? 'bg-gradient-to-br from-[#e8f0fe] via-[#eef6ff] to-[#e0f2fe]'
          : 'bg-gradient-to-br from-[#0b1120] via-[#0f172a] to-[#0c192c]'
      }`}>
        {/* 1. Header Superior del Workspace */}
        <header
          className={`px-5 py-4 border-b sticky top-0 z-10 backdrop-blur-md transition-colors ${
            isLight
              ? 'bg-white/85 border-slate-200/80 text-slate-900 shadow-sm'
              : 'bg-slate-950/80 border-slate-800/80 text-white'
          }`}
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className={`text-xl font-black tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Overview
              </h2>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'} hidden sm:block`}>
                Control ejecutivo de prospección comercial en calle • Noia, Galicia
              </p>
            </div>

            {/* Acciones del Header */}
            <div className="flex items-center gap-2.5">
              {syncMessage && (
                <span className="text-[11px] px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 font-medium animate-pulse hidden md:inline">
                  {syncMessage}
                </span>
              )}

              {/* Botón Alternar Tema (Sol/Luna) */}
              <button
                onClick={toggleTheme}
                title={isLight ? 'Cambiar a Modo Oscuro' : 'Cambiar a Modo Claro'}
                className={`p-2 rounded-full border shadow-sm backdrop-blur-md apple-smooth ${
                  isLight
                    ? 'bg-white/65 hover:bg-white/85 border-white/80 text-slate-700'
                    : 'bg-slate-800/70 hover:bg-slate-700/70 border-white/10 text-amber-400'
                }`}
              >
                {isLight ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </button>

              {/* Recargar datos */}
              <button
                onClick={fetchCRMData}
                disabled={loading}
                title="Recargar datos"
                className={`p-2 rounded-full border shadow-sm backdrop-blur-md apple-smooth ${
                  isLight
                    ? 'bg-white/65 hover:bg-white/85 border-white/80 text-slate-700'
                    : 'bg-slate-800/70 hover:bg-slate-700/70 border-white/10 text-slate-300'
                }`}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-500' : ''}`} />
              </button>

              {/* BOTÓN DE DESCARGA: SOLO ICONO (Con menú desplegable de opciones) */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  title="Opciones de Exportación (Excel, JSON, Resumen)"
                  className={`p-2 rounded-full border shadow-sm backdrop-blur-md apple-smooth active:scale-95 ${
                    isLight
                      ? 'bg-white/65 hover:bg-white/85 text-slate-700 border-white/80'
                      : 'bg-slate-800/70 hover:bg-slate-700/70 text-slate-200 border-white/10'
                  }`}
                >
                  <Download className="w-4 h-4 text-blue-500" />
                </button>

                {showExportMenu && (
                  <div
                    className={`absolute right-0 mt-2 w-64 rounded-2xl border shadow-2xl p-2 z-50 text-xs animate-in fade-in ${
                      isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-white'
                    }`}
                  >
                    <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Exportar Datos
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        handleExportCSV()
                        setShowExportMenu(false)
                      }}
                      className={`w-full px-3 py-2 rounded-xl flex items-center gap-2.5 transition text-left ${
                        isLight ? 'hover:bg-slate-100 text-slate-800' : 'hover:bg-slate-800 text-slate-200'
                      }`}
                    >
                      <FileSpreadsheet className="w-4 h-4 text-emerald-500 shrink-0" />
                      <div>
                        <p className="font-bold">Excel (.csv)</p>
                        <p className="text-[10px] text-slate-400">Compatible directo con Microsoft Excel</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        handleExportJSON()
                        setShowExportMenu(false)
                      }}
                      className={`w-full px-3 py-2 rounded-xl flex items-center gap-2.5 transition text-left ${
                        isLight ? 'hover:bg-slate-100 text-slate-800' : 'hover:bg-slate-800 text-slate-200'
                      }`}
                    >
                      <FileCode className="w-4 h-4 text-blue-500 shrink-0" />
                      <div>
                        <p className="font-bold">JSON Estructurado</p>
                        <p className="text-[10px] text-slate-400">Respaldo completo para base de datos</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        handleCopyMarkdownSummary()
                        setShowExportMenu(false)
                      }}
                      className={`w-full px-3 py-2 rounded-xl flex items-center gap-2.5 transition text-left ${
                        isLight ? 'hover:bg-slate-100 text-slate-800' : 'hover:bg-slate-800 text-slate-200'
                      }`}
                    >
                      <FileText className="w-4 h-4 text-purple-500 shrink-0" />
                      <div>
                        <p className="font-bold">Copiar Resumen de Visitas</p>
                        <p className="text-[10px] text-slate-400">Texto formateado para informe rápido</p>
                      </div>
                    </button>
                  </div>
                )}
              </div>

              {/* Botón Nuevo Local */}
              <button
                onClick={() => setIsQuickAddOpen(true)}
                className="px-3.5 py-2 rounded-full bg-gradient-to-r from-blue-600 to-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 apple-smooth shadow-md shadow-blue-500/25 hover:scale-[1.02] active:scale-[0.98]"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Nuevo Local</span>
              </button>
            </div>
          </div>
        </header>

        {/* 2. Tarjetas KPI Clave (Estilo visual exacto a la imagen CRM.io) */}
        <section className="px-5 pt-5 max-w-7xl w-full mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Tarjeta 1: MRR Ganado */}
            <div
              className={`p-4 rounded-2xl apple-glass-card apple-glass-reflection apple-smooth hover:-translate-y-1 hover:shadow-[0_14px_36px_rgba(15,23,42,0.08)]`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-semibold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  MRR Ganado
                </span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className={`text-2xl font-black font-mono ${isLight ? 'text-slate-900' : 'text-emerald-400'}`}>
                {metrics?.wonMRR || 0} €
              </div>
              <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 mt-1">
                <span>↗</span>
                <span>ARR: {((metrics?.wonMRR || 0) * 12).toLocaleString()} €/año</span>
              </div>
            </div>

            {/* Tarjeta 2: Pipeline en Juego */}
            <div
              className={`p-4 rounded-2xl apple-glass-card apple-glass-reflection apple-smooth hover:-translate-y-1 hover:shadow-[0_14px_36px_rgba(15,23,42,0.08)]`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-semibold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Pipeline en Juego
                </span>
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className={`text-2xl font-black font-mono ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {metrics?.pipelineMRR || 0} €
              </div>
              <div className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 mt-1">
                <span>↗</span>
                <span>
                  {(metrics?.pipelineCounts.contactado || 0) +
                    (metrics?.pipelineCounts.piloto_14_dias || 0) +
                    (metrics?.pipelineCounts.en_negociacion || 0)}{' '}
                  en negociación activa
                </span>
              </div>
            </div>

            {/* Tarjeta 3: Pilotos de 14 Días */}
            <div
              className={`p-4 rounded-2xl apple-glass-card apple-glass-reflection apple-smooth hover:-translate-y-1 hover:shadow-[0_14px_36px_rgba(15,23,42,0.08)]`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-semibold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Pilotos de 14 Días
                </span>
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className={`text-2xl font-black font-mono ${isLight ? 'text-slate-900' : 'text-amber-400'}`}>
                {metrics?.activePilotsCount || 0}
              </div>
              <div className="flex items-center gap-1 text-[11px] font-semibold text-amber-600 mt-1">
                <span>⚡</span>
                <span>Locales probando sin coste</span>
              </div>
            </div>

            {/* Tarjeta 4: Conversión & Universo Noia */}
            <div
              className={`p-4 rounded-2xl apple-glass-card apple-glass-reflection apple-smooth hover:-translate-y-1 hover:shadow-[0_14px_36px_rgba(15,23,42,0.08)]`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-semibold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Conversión / Noia
                </span>
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Award className="w-4 h-4" />
                </div>
              </div>
              <div className={`text-2xl font-black font-mono ${isLight ? 'text-slate-900' : 'text-purple-400'}`}>
                {metrics?.conversionRate || 0}%
              </div>
              <div className="flex items-center gap-1 text-[11px] font-semibold text-purple-600 mt-1">
                <span>★</span>
                <span>{metrics?.wonCount || 0} de {metrics?.totalLeads || 0} locales auditados</span>
              </div>
            </div>
          </div>
        </section>

        {/* 2.5. Calendario y Campaña Activa de Noia [Idea 7] */}
        <section className="px-5 pt-3.5 max-w-7xl w-full mx-auto">
          <div
            className={`p-4 rounded-3xl relative apple-glass-card apple-glass-reflection apple-smooth hover:shadow-[0_14px_36px_rgba(15,23,42,0.08)] ${
              isLight ? 'text-slate-800' : 'text-white'
            }`}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-700 border border-amber-300">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    Campaña Municipal Activa
                  </span>
                  <span className={`text-xs font-semibold ${isLight ? 'text-blue-700' : 'text-blue-300'}`}>
                    {NOIA_COMMERCIAL_EVENTS[0].period}
                  </span>
                </div>

                <h3 className={`text-base font-bold ${isLight ? 'text-slate-900' : 'text-white'} flex items-center gap-2`}>
                  <span>🦪 {NOIA_COMMERCIAL_EVENTS[0].name}</span>
                </h3>

                <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-300'} max-w-2xl`}>
                  {NOIA_COMMERCIAL_EVENTS[0].description}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setShowAllEvents(!showAllEvents)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 border ${
                    isLight
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5 text-blue-500" />
                  <span>{showAllEvents ? 'Ocultar Calendario' : 'Ver 4 Campañas de Noia'}</span>
                </button>
              </div>
            </div>

            {/* Consejo Táctico para la Prospección en Calle */}
            <div
              className={`mt-3 p-3 rounded-xl flex items-start gap-2.5 text-xs ${
                isLight
                  ? 'bg-white/55 border border-white/75 backdrop-blur-md text-slate-700'
                  : 'bg-slate-900/90 border border-blue-500/20 text-slate-200'
              }`}
            >
              <span className="text-amber-500 font-bold shrink-0 mt-0.5">💡 Consejo Comercial Hoy:</span>
              <span className="leading-relaxed">
                {NOIA_COMMERCIAL_EVENTS[0].commercialAdvice}
              </span>
            </div>

            {/* Acordeón con las 4 campañas de Noia */}
            {showAllEvents && (
              <div className="mt-3 pt-3 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 animate-in fade-in">
                {NOIA_COMMERCIAL_EVENTS.map((ev, i) => (
                  <div
                    key={ev.id}
                    className={`p-3 rounded-2xl border text-xs space-y-1.5 ${
                      i === 0
                        ? 'bg-blue-500/10 border-blue-400 text-blue-900'
                        : isLight
                        ? 'bg-slate-50 border-slate-200 text-slate-700'
                        : 'bg-slate-900/60 border-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold truncate">{ev.name}</span>
                      {i === 0 && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-700 shrink-0">
                          ACTIVA
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-blue-600 font-mono font-medium">{ev.period}</div>
                    <p className="text-[11px] text-slate-500 leading-snug">{ev.commercialAdvice}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* 3. Barra de Búsqueda y Filtros */}
        <section className="px-5 pt-3.5 max-w-7xl w-full mx-auto">
          <div
            className={`p-2.5 rounded-2xl flex flex-wrap items-center justify-between gap-3 apple-glass-card`}
          >
            {/* Buscador */}
            <div className="relative flex-1 min-w-[200px] sm:min-w-[280px]">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar local, calle o contacto en Noia..."
                className={`w-full pl-9 pr-3 py-2 rounded-full text-xs placeholder-slate-400 focus:outline-none focus:border-blue-500 border shadow-inner apple-smooth ${
                  isLight
                    ? 'bg-white/80 hover:bg-white/95 focus:bg-white border-white/80 text-slate-800'
                    : 'bg-slate-800/80 hover:bg-slate-800 border-white/10 text-white'
                }`}
              />
            </div>

            {/* Filtros */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Filtro Zona */}
              <select
                value={selectedZone}
                onChange={(e) => setSelectedZone(e.target.value)}
                className={`px-3 py-2 rounded-full text-xs focus:outline-none focus:border-blue-500 border shadow-inner apple-smooth ${
                  isLight
                    ? 'bg-white/80 hover:bg-white/95 focus:bg-white border-white/80 text-slate-700'
                    : 'bg-slate-800/80 hover:bg-slate-800 border-white/10 text-slate-200'
                }`}
              >
                <option value="all">Todas las Zonas</option>
                {uniqueZones.map((z) => (
                  <option key={z} value={z}>
                    {z}
                  </option>
                ))}
              </select>

              {/* Filtro ICP: A, B, C */}
              <select
                value={selectedICP}
                onChange={(e) => setSelectedICP(e.target.value)}
                className={`px-3 py-2 rounded-full text-xs focus:outline-none focus:border-blue-500 border font-medium shadow-inner apple-smooth ${
                  isLight
                    ? 'bg-white/80 hover:bg-white/95 focus:bg-white border-white/80 text-slate-700'
                    : 'bg-slate-800/80 hover:bg-slate-800 border-white/10 text-slate-200'
                }`}
              >
                <option value="all">Todos los ICPs</option>
                <option value="A">ICP A (Alta Aptitud - Raciones/Terraza)</option>
                <option value="B">ICP B (Media - Restaurante Menú)</option>
                <option value="C">ICP C (Básica - Cafetería/Carta QR)</option>
              </select>

              {/* Filtro Plan */}
              <select
                value={selectedPlan}
                onChange={(e) => setSelectedPlan(e.target.value)}
                className={`px-3 py-2 rounded-full text-xs focus:outline-none focus:border-blue-500 border shadow-inner apple-smooth ${
                  isLight
                    ? 'bg-white/80 hover:bg-white/95 focus:bg-white border-white/80 text-slate-700'
                    : 'bg-slate-800/80 hover:bg-slate-800 border-white/10 text-slate-200'
                }`}
              >
                <option value="all">Todos los Planes</option>
                <option value="carta_39">Carta 39€</option>
                <option value="sala_69">Sala 69€</option>
                <option value="full_99">Full 99€</option>
                <option value="suite_139">Suite 139€</option>
              </select>
            </div>
          </div>
        </section>

        {/* 4. Cuerpo Principal: KANBAN DRAG & DROP o TABLA */}
        <main className="px-5 py-4 max-w-7xl w-full mx-auto flex-1">
          {/* Al cambiar de vista, el remount por `key` dispara la entrada suave */}
          <div key={viewMode} className="animate-apple-fade-in">
          {viewMode === 'kanban' ? (
            /* Vista KANBAN Horizontal con Drag & Drop Estilo Trello */
            <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-thin">
              {STATUS_COLUMNS.map((col) => {
                const columnLeads = filteredLeads.filter((l) => l.status === col.id)
                const columnMRR = columnLeads.reduce(
                  (acc, curr) => acc + Number(curr.mrr_projected || 39),
                  0
                )
                const isDragOver = dragOverColId === col.id

                return (
                  <div
                    key={col.id}
                    onDragOver={(e) => handleDragOver(e, col.id)}
                    onDragLeave={() => handleDragLeave(col.id)}
                    onDrop={(e) => handleDrop(e, col.id)}
                    className={`w-80 shrink-0 flex flex-col rounded-2xl apple-glass-card apple-glass-reflection transition-all max-h-[75vh] ${
                      isDragOver ? 'ring-2 ring-blue-500 border-blue-500' : ''
                    }`}
                  >
                    {/* Encabezado de Columna */}
                    <div
                      className={`p-3.5 border-b flex items-center justify-between sticky top-0 backdrop-blur-md rounded-t-2xl z-10 ${
                        isLight ? 'bg-white/70 border-white/60' : 'bg-slate-950/70 border-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <h3 className={`font-bold text-xs ${isLight ? 'text-slate-900' : 'text-white'}`}>
                          {col.title}
                        </h3>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-bold ${
                            isLight ? col.badgeBgLight : col.badgeBg
                          }`}
                        >
                          {columnLeads.length}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-emerald-600 font-bold">
                        {columnMRR} €
                      </span>
                    </div>

                    {/* Lista de Tarjetas Arrastrables (Trello Style) */}
                    <div className="p-3 space-y-2.5 overflow-y-auto flex-1">
                      {columnLeads.length === 0 ? (
                        <div
                          className={`py-8 text-center text-xs italic rounded-xl border border-dashed apple-smooth ${
                            isDragOver
                              ? 'border-blue-400 bg-blue-50/50 text-blue-600'
                              : isLight
                              ? 'border-slate-400/35 bg-white/25 text-slate-400 backdrop-blur-sm'
                              : 'border-slate-800 bg-white/[0.04] text-slate-600 backdrop-blur-sm'
                          }`}
                        >
                          Arrastra un local aquí
                        </div>
                      ) : (
                        columnLeads.map((lead) => {
                          const icpKey = normalizeICP(lead.icp_segment)
                          const icpData = ICP_CONFIG[icpKey]
                          const isBeingDragged = draggingLeadId === lead.id

                          return (
                            <div
                              key={lead.id}
                              draggable={true}
                              onDragStart={(e) => handleDragStart(e, lead.id)}
                              onClick={() => {
                                setSelectedLead(lead)
                                setIsDetailOpen(true)
                              }}
                              className={`p-3.5 border rounded-xl apple-smooth cursor-grab active:cursor-grabbing select-none relative group ${
                                isBeingDragged ? 'opacity-40 scale-95' : 'opacity-100'
                              } ${
                                isLight
                                  ? 'bg-white/80 hover:bg-white/95 border-white/85 backdrop-blur-md hover:border-blue-400 shadow-sm hover:shadow-md hover:-translate-y-0.5'
                                  : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700/60 hover:border-blue-500/50 shadow-sm'
                              }`}
                            >
                              {/* Segmento & Score */}
                              <div className="flex items-center justify-between gap-2 mb-1.5">
                                <span
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                                    isLight ? icpData.badgeLight : icpData.badge
                                  }`}
                                  title={icpData.description}
                                >
                                  {icpData.shortLabel}
                                </span>
                                <span className="text-[11px] font-bold text-amber-500 flex items-center gap-0.5">
                                  ★ {lead.score}
                                </span>
                              </div>

                              {/* Nombre del Local */}
                              <h4
                                className={`font-bold text-sm truncate transition ${
                                  isLight
                                    ? 'text-slate-900 group-hover:text-blue-600'
                                    : 'text-white group-hover:text-blue-400'
                                }`}
                              >
                                {lead.name}
                              </h4>

                              {/* Dirección */}
                              <div
                                className={`flex items-center gap-1 text-[11px] mt-1 truncate ${
                                  isLight ? 'text-slate-500' : 'text-slate-400'
                                }`}
                              >
                                <MapPin className="w-3 h-3 shrink-0 text-slate-400" />
                                <span className="truncate">{lead.address}</span>
                              </div>

                              {/* Badges de TPV y Quejas */}
                              <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                                {lead.current_pos_system && (
                                  <span
                                    className={`px-1.5 py-0.5 rounded-md text-[10px] border flex items-center gap-1 ${
                                      isLight
                                        ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                        : 'bg-indigo-950/60 text-indigo-300 border-indigo-800/50'
                                    }`}
                                  >
                                    <span>{POS_SYSTEM_CONFIG[lead.current_pos_system]?.icon}</span>
                                    <span className="truncate max-w-[110px]">
                                      {POS_SYSTEM_CONFIG[lead.current_pos_system]?.label}
                                    </span>
                                  </span>
                                )}
                                {lead.google_complaint_tags && lead.google_complaint_tags.length > 0 && (
                                  <span
                                    className={`px-1.5 py-0.5 rounded-md text-[10px] truncate max-w-[120px] border ${
                                      isLight
                                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                                        : 'bg-rose-500/10 text-rose-300 border-rose-500/20'
                                    }`}
                                    title={lead.google_complaint_tags[0]}
                                  >
                                    {lead.google_complaint_tags[0]}
                                  </span>
                                )}
                              </div>

                              {/* Piloto de 14 Días y Checklist */}
                              {lead.status === 'piloto_14_dias' && (
                                <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center gap-1.5 flex-wrap">
                                  {lead.pilot_start_date && (() => {
                                    const start = new Date(lead.pilot_start_date).getTime()
                                    const diff = Math.max(1, Math.floor((Date.now() - start) / 86400000) + 1)
                                    const day = Math.min(diff, 14)
                                    const isUrgent = day >= 12
                                    return (
                                      <span
                                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold border flex items-center gap-1 ${
                                          isUrgent
                                            ? 'bg-rose-500/20 text-rose-600 border-rose-300 animate-pulse'
                                            : day >= 7
                                            ? 'bg-amber-500/20 text-amber-700 border-amber-300'
                                            : 'bg-blue-500/20 text-blue-700 border-blue-300'
                                        }`}
                                      >
                                        <Clock className="w-2.5 h-2.5" />
                                        Día {day}/14
                                      </span>
                                    )
                                  })()}

                                  {lead.pilot_agreement && (
                                    <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-amber-500/15 text-amber-700 border border-amber-300 font-bold">
                                      ✍ Firmado
                                    </span>
                                  )}
                                </div>
                              )}

                              {/* Pie de Tarjeta: MRR y Selector Rápido Móvil */}
                              <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                                <span className="text-[11px] font-mono text-emerald-600 font-bold">
                                  {lead.mrr_projected} €/mes
                                </span>

                                <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                                  {/* Selector rápido para mover de etapa en móvil con 1 toque */}
                                  <select
                                    value={lead.status}
                                    onChange={(e) => handleUpdateLead(lead.id, { status: e.target.value as CRMStatus })}
                                    className={`text-[10px] py-0.5 px-1 rounded-md border focus:outline-none ${
                                      isLight
                                        ? 'bg-slate-100 border-slate-300 text-slate-700'
                                        : 'bg-slate-900 border-slate-700 text-slate-300'
                                    }`}
                                    title="Mover de etapa en 1 clic"
                                  >
                                    <option value="lead_por_visitar">Por Visitar</option>
                                    <option value="contactado">Contactado</option>
                                    <option value="piloto_14_dias">Piloto 14D</option>
                                    <option value="en_negociacion">Negociación</option>
                                    <option value="ganado">Ganado</option>
                                    <option value="perdido">Perdido</option>
                                  </select>

                                  {lead.contact_phone && (
                                    <a
                                      href={`tel:${lead.contact_phone}`}
                                      className={`p-1 rounded-lg transition ${
                                        isLight
                                          ? 'bg-slate-100 text-slate-600 hover:text-blue-600'
                                          : 'bg-slate-700/60 text-slate-300 hover:text-white'
                                      }`}
                                      title={`Llamar a ${lead.contact_phone}`}
                                    >
                                      <Phone className="w-3.5 h-3.5" />
                                    </a>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        })
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : viewMode === 'table' ? (
            /* Vista TABLA Analítica */
            <div
              className={`rounded-3xl overflow-hidden shadow-sm apple-glass-card`}
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead
                    className={`border-b uppercase font-mono text-[10px] tracking-wider ${
                      isLight
                        ? 'bg-slate-50 border-slate-200 text-slate-500'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <tr>
                      <th className="px-4 py-3">Establecimiento</th>
                      <th className="px-4 py-3">Zona</th>
                      <th className="px-4 py-3">ICP</th>
                      <th className="px-4 py-3">Score</th>
                      <th className="px-4 py-3">Estado</th>
                      <th className="px-4 py-3">Plan / MRR</th>
                      <th className="px-4 py-3">Teléfono</th>
                      <th className="px-4 py-3 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/60">
                    {filteredLeads.map((lead) => {
                      const icpKey = normalizeICP(lead.icp_segment)
                      const icpData = ICP_CONFIG[icpKey]
                      return (
                        <tr
                          key={lead.id}
                          onClick={() => {
                            setSelectedLead(lead)
                            setIsDetailOpen(true)
                          }}
                          className={`cursor-pointer transition ${
                            isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-800/50'
                          }`}
                        >
                          <td className="px-4 py-3.5 font-bold whitespace-nowrap">
                            <span className={isLight ? 'text-slate-900' : 'text-white'}>{lead.name}</span>
                            <span className="block text-[11px] font-normal text-slate-400">{lead.address}</span>
                          </td>
                          <td className="px-4 py-3.5 text-slate-500 whitespace-nowrap">{lead.zone}</td>
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                                isLight ? icpData.badgeLight : icpData.badge
                              }`}
                            >
                              {icpData.shortLabel}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 font-bold text-amber-500 whitespace-nowrap">
                            ★ {lead.score}
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                STATUS_COLUMNS.find((c) => c.id === lead.status)?.badgeBgLight || 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {STATUS_COLUMNS.find((c) => c.id === lead.status)?.title}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 font-mono text-emerald-600 font-bold whitespace-nowrap">
                            {lead.mrr_projected} €/mes
                          </td>
                          <td className="px-4 py-3.5 text-slate-500 whitespace-nowrap">
                            {lead.contact_phone || 'Sin registrar'}
                          </td>
                          <td className="px-4 py-3.5 text-right whitespace-nowrap">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedLead(lead)
                                setIsDetailOpen(true)
                              }}
                              className="px-2.5 py-1.5 rounded-xl bg-blue-600/10 hover:bg-blue-600/20 text-blue-600 border border-blue-200 text-[11px] font-bold transition"
                            >
                              Gestionar
                            </button>
                          </td>
                        </tr>
                      )
                    })}
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
          </div>
        </main>
      </div>
      </div>

      {/* ==============================================================================
          MODALES DE APOYO
      ============================================================================== */}
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

      <CRMContactCardModal
        isOpen={isContactCardOpen}
        onClose={() => setIsContactCardOpen(false)}
      />
    </div>
  )
}
