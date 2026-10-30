'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Plus, Edit3, Trash2, Download, Link, Eye, AlertCircle, RefreshCw } from 'lucide-react'
import { TenantProvider } from '@/components/tenant/TenantProvider'
import { TenantHeader } from '@/components/tenant/TenantHeader'
import { StaffPinAuth } from '@/components/auth/StaffPinAuth'
import { Restaurant } from '@/types/database.types'
import { QrDinamico } from '@/types/database.types'
import { createBrowserClient } from '@/lib/supabase/client'
import { MOCK_RESTAURANTS } from '@/lib/supabase/mock-fallback'

interface QrDinamicoView {
  id: string
  short_url: string
  target_url: string
  click_count: number
  qr_url: string
  created_at: string
  updated_at: string
}

export default function QrDinamicosPage() {
  const params = useParams()
  const router = useRouter()
  const slug = (params?.slug as string) || 'burger-gourmet'

  const [restaurant, setRestaurant] = useState<Restaurant>(() =>
    (MOCK_RESTAURANTS as any)[slug] || (MOCK_RESTAURANTS as any)['burger-gourmet']
  )
  const [qrs, setQrs] = useState<QrDinamicoView[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newTargetUrl, setNewTargetUrl] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTargetUrl, setEditTargetUrl] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    async function loadRestaurant() {
      const supabase = createBrowserClient()
      if (!supabase) return
      try {
        const { data } = await supabase.from('restaurants').select('*').eq('slug', slug).single()
        if (data) setRestaurant(data as Restaurant)
      } catch {
        // usar mock
      }
    }
    loadRestaurant()
  }, [slug])

  const loadQrs = useCallback(async () => {
    setLoading(true)
    try {
      const supabase = createBrowserClient()
      if (!supabase) throw new Error('Supabase no disponible')
      const { data, error } = await supabase
        .from('qr_dinamicos')
        .select('*')
        .eq('slug', slug)
        .order('created_at', { ascending: false })
      if (error) throw error
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
      setQrs(
        (data || []).map((q: any) => ({
          id: q.id,
          short_url: `${baseUrl}/qr/d/${q.id}`,
          target_url: q.target_url,
          click_count: q.click_count || 0,
          qr_url: `${baseUrl}/api/qr-dinamicos/${q.id}/qr?slug=${slug}`,
          created_at: q.created_at,
          updated_at: q.updated_at,
        }))
      )
    } catch (err: any) {
      setError(err.message || 'Error cargando QRs dinámicos')
    } finally {
      setLoading(false)
    }
  }, [slug])

  useEffect(() => {
    loadQrs()
  }, [loadQrs])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    setError(null)
    try {
      const supabase = createBrowserClient()
      if (!supabase) throw new Error('Supabase no disponible')
      const res = await fetch('/api/qr-dinamicos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, target_url: newTargetUrl }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error creando QR dinámico')
      }
      setNewTargetUrl('')
      setCreating(false)
      setSuccess('QR dinámico creado correctamente')
      await loadQrs()
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      setCreating(false)
      setError(err.message || 'Error creando QR dinámico')
    }
  }

  const handleUpdate = async (id: string) => {
    setError(null)
    try {
      const supabase = createBrowserClient()
      if (!supabase) throw new Error('Supabase no disponible')
      const res = await fetch(`/api/qr-dinamicos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, target_url: editTargetUrl }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error actualizando QR')
      }
      setEditingId(null)
      setEditTargetUrl('')
      setSuccess('URL de destino actualizada. El QR sigue funcionando sin cambios.')
      await loadQrs()
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      setError(err.message || 'Error actualizando QR dinámico')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este QR dinámico? El código corto dejará de funcionar.')) return
    try {
      const supabase = createBrowserClient()
      if (!supabase) throw new Error('Supabase no disponible')
      const res = await fetch(`/api/qr-dinamicos/${id}?slug=${slug}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Error eliminando QR')
      setSuccess('QR dinámico eliminado')
      await loadQrs()
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      setError(err.message || 'Error eliminando QR dinámico')
    }
  }

  const downloadQr = (id: string) => {
    const qr = qrs.find((q) => q.id === id)
    if (!qr) return
    const a = document.createElement('a')
    a.href = qr.qr_url
    a.download = `qr-${id}.png`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  return (
    <StaffPinAuth role="admin" restaurantSlug={slug}>
      <TenantProvider restaurant={restaurant}>
        <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
          <TenantHeader viewType="menu" />

          <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
            {/* Cabecera */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  QRs Dinámicos · {restaurant.name}
                </h1>
                <p className="text-slate-600 text-sm">
                  Imprime un QR y cambia la carta de destino cuando quieras sin reimprimirlo.
                </p>
              </div>
              <Link href={`/staff/qr/${slug}`} className="px-4 py-2 bg-blue-900 text-white rounded-xl text-sm font-semibold hover:bg-blue-800 transition-colors">
                <Eye className="w-4 h-4 mr-2" /> Ver QRs de Mesa
              </Link>
            </div>

            {error && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-center gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="p-4 rounded-xl bg-green-50 border border-green-200 text-green-800 text-sm flex items-center gap-3">
                <RefreshCw className="w-5 h-5 flex-shrink-0" />
                <span>{success}</span>
              </div>
            )}

            {/* Formulario crear QR */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h2 className="font-bold text-lg text-slate-900 mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-600" /> Crear QR Dinámico
              </h2>
              <form onSubmit={handleCreate} className="space-y-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    URL de destino (carta, menú o negocio)
                  </label>
                  <input
                    type="url"
                    value={newTargetUrl}
                    onChange={(e) => setNewTargetUrl(e.target.value)}
                    placeholder="https://tu-dominio.com/menu"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={creating}
                  className="w-full px-4 py-2.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
                >
                  {creating ? 'Creando...' : 'Generar QR Dinámico'}
                </button>
              </form>
            </div>

            {/* Lista de QRs */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h2 className="font-bold text-lg text-slate-900 mb-4 flex items-center gap-2">
                <Link className="w-5 h-5 text-blue-600" /> Tus QRs Dinámicos
              </h2>

              {loading ? (
                <div className="text-center py-8 text-slate-500">Cargando...</div>
              ) : qrs.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-slate-500 text-sm">No tienes QRs dinámicos todavía.</p>
                  <p className="text-slate-400 text-xs mt-1">Crea uno arriba para empezar.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase">
                          Código corto
                        </th>
                        <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase">
                          Short URL
                        </th>
                        <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase">
                          URL de destino
                        </th>
                        <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase">
                          Clics
                        </th>
                        <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase">
                          Creado
                        </th>
                        <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase text-right">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {qrs.map((qr) => (
                        <tr key={qr.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-4 text-xs font-mono text-slate-700">
                            {qr.id}
                          </td>
                          <td className="py-3 px-4 text-xs text-slate-600">
                            <a
                              href={qr.short_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline break-all"
                            >
                              {qr.short_url}
                            </a>
                          </td>
                          <td className="py-3 px-4 text-xs text-slate-600 break-all">
                            {qr.target_url}
                          </td>
                          <td className="py-3 px-4 text-xs font-mono text-slate-700">
                            {qr.click_count}
                          </td>
                          <td className="py-3 px-4 text-xs text-slate-500">
                            {new Date(qr.created_at).toLocaleDateString('es-ES')}
                          </td>
                          <td className="py-3 px-4 text-right space-y-2">
                            {editingId === qr.id ? (
                              <div className="flex flex-col sm:flex-row gap-2">
                                <input
                                  value={editTargetUrl}
                                  onChange={(e) => setEditTargetUrl(e.target.value)}
                                  className="px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none flex-1"
                                />
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => handleUpdate(qr.id)}
                                    className="px-3 py-2 rounded-xl bg-green-600 text-white text-xs font-semibold hover:bg-green-700"
                                  >
                                    Guardar
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingId(null)
                                      setEditTargetUrl('')
                                    }}
                                    className="px-3 py-2 rounded-xl bg-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-400"
                                  >
                                    Cancelar
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-wrap gap-1 justify-end">
                                <button
                                  onClick={() => downloadQr(qr.id)}
                                  className="px-3 py-2 rounded-xl bg-green-100 text-green-700 text-xs font-semibold hover:bg-green-200 flex items-center gap-1"
                                >
                                  <Download className="w-3 h-3" /> Descargar QR
                                </button>
                                <button
                                  onClick={() => {
                                    setEditTargetUrl(qr.target_url)
                                    setEditingId(qr.id)
                                  }}
                                  className="px-3 py-2 rounded-xl bg-blue-100 text-blue-700 text-xs font-semibold hover:bg-blue-200 flex items-center gap-1"
                                >
                                  <Edit3 className="w-3 h-3" /> Cambiar URL
                                </button>
                                <button
                                  onClick={() => handleDelete(qr.id)}
                                  className="px-3 py-2 rounded-xl bg-red-100 text-red-700 text-xs font-semibold hover:bg-red-200 flex items-center gap-1"
                                >
                                  <Trash2 className="w-3 h-3" /> Eliminar
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </TenantProvider>
    </StaffPinAuth>
  )
}
