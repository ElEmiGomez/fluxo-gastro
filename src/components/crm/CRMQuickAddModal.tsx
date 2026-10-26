'use client'

import React, { useState } from 'react'
import { X, Plus, Store, MapPin, User, Phone, MessageSquare, DollarSign, Sparkles } from 'lucide-react'
import { CRMICP, CRMLead, CRMPlan, CRMStatus, PLAN_PRICING } from '@/types/crm.types'

interface CRMQuickAddModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (newLead: Omit<CRMLead, 'id' | 'created_at' | 'updated_at'>) => Promise<void>
}

export function CRMQuickAddModal({ isOpen, onClose, onSave }: CRMQuickAddModalProps) {
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [zone, setZone] = useState('Noia Centro')
  const [icpSegment, setIcpSegment] = useState<CRMICP>('CARLOS')
  const [targetPlan, setTargetPlan] = useState<CRMPlan>('carta_39')
  const [status, setStatus] = useState<CRMStatus>('lead_por_visitar')
  const [contactName, setContactName] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [score, setScore] = useState(7.5)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('El nombre del establecimiento es obligatorio')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      await onSave({
        name: name.trim(),
        address: address.trim() || 'Noia',
        zone: zone.trim() || 'Centro',
        icp_segment: icpSegment,
        contact_name: contactName.trim() || null,
        contact_phone: contactPhone.trim() || null,
        contact_whatsapp: contactPhone.trim() || null,
        instagram: null,
        google_rating: null,
        google_reviews_count: null,
        score: score,
        status: status,
        target_plan: targetPlan,
        mrr_projected: PLAN_PRICING[targetPlan] || 39,
        pilot_start_date: status === 'piloto_14_dias' ? new Date().toISOString().split('T')[0] : null,
        pilot_end_date: status === 'piloto_14_dias' ? new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0] : null,
        last_visit_date: status !== 'lead_por_visitar' ? new Date().toISOString() : null,
        next_contact_date: null,
        notes: notes.trim() || null,
        lost_reason: null,
      })

      // Reset
      setName('')
      setAddress('')
      setContactName('')
      setContactPhone('')
      setNotes('')
      onClose()
    } catch (err: any) {
      setError(err.message || 'Error al guardar el nuevo local')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 text-white shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Cabecera */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Nuevo Local en Prospección</h3>
              <p className="text-xs text-slate-400">Captura rápida a pie de calle (30 segundos)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3 text-xs bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Nombre del Local *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Mesón O Galo"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Dirección / Calle
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Rúa do Cantón, 4"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Zona de Noia
              </label>
              <select
                value={zone}
                onChange={(e) => setZone(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-blue-500"
              >
                <option value="Noia Centro">Noia Centro</option>
                <option value="Casco Histórico">Casco Histórico</option>
                <option value="Malecón de San Lázaro">Malecón de San Lázaro</option>
                <option value="Alameda">Alameda</option>
                <option value="Barro / Periferia">Barro / Periferia</option>
                <option value="Portus Apostoli">Portus Apostoli</option>
              </select>
            </div>
          </div>

          {/* Segmento ICP y Plan Objetivo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Perfil de Cliente (ICP)
              </label>
              <select
                value={icpSegment}
                onChange={(e) => setIcpSegment(e.target.value as CRMICP)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-blue-500"
              >
                <option value="CARLOS">Carlos (Alta rotación / Terrazas)</option>
                <option value="MARTIN">Martín (Tradicional / Escéptico)</option>
                <option value="LUCIA">Lucía (Gastrobar / Experiencia)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Plan Sugerido (MRR)
              </label>
              <select
                value={targetPlan}
                onChange={(e) => setTargetPlan(e.target.value as CRMPlan)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-blue-500 font-medium"
              >
                <option value="carta_39">Carta Digital — 39 €/mes</option>
                <option value="sala_69">Sala & Comandero — 69 €/mes</option>
                <option value="full_99">Full Operativo (KDS) — 99 €/mes</option>
                <option value="suite_139">Suite Integral — 139 €/mes</option>
              </select>
            </div>
          </div>

          {/* Contacto directo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Nombre de Contacto / Dueño
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Manuel / Dueño"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Teléfono / WhatsApp
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="654 321 000"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Estado inicial */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Estado Inicial en Pipeline
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'lead_por_visitar', label: 'Por Visitar' },
                { id: 'contactado', label: 'Contactado' },
                { id: 'piloto_14_dias', label: 'Piloto (14 Días)' },
              ].map((st) => (
                <button
                  type="button"
                  key={st.id}
                  onClick={() => setStatus(st.id as CRMStatus)}
                  className={`py-2 px-2.5 rounded-xl text-xs font-semibold border transition text-center ${
                    status === st.id
                      ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/30'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notas de la visita */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Notas Rápidas de Calle / Puntos de Dolor
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: Mucha cola en terraza los domingos. Carta plastificada vieja. Dueño receptivo a prueba de 14 días..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm transition shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Añadir Lead al CRM</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
