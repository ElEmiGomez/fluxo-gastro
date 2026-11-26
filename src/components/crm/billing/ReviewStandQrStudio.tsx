'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Search, Star, Loader2, Sparkles } from 'lucide-react'
import { CRMLead } from '@/types/crm.types'
import { PrintableReviewStand } from '@/components/reviews/PrintableReviewStand'
import { normalizeSlug } from '@/lib/slugify'

interface StandPreset {
  key: string
  slug: string
  name: string
  city: string
  logoUrl?: string
  googleReviewUrl: string
  enableGatekeeper: boolean
  isDefaultTemplate: boolean
}

const STATIC_PRESETS: StandPreset[] = [
  {
    key: 'preset:predeterminada',
    slug: 'predeterminada',
    name: 'Versión Predeterminada (sin logo)',
    city: 'Plantilla Genérica',
    googleReviewUrl: 'https://www.google.com/maps',
    enableGatekeeper: false,
    isDefaultTemplate: true,
  },
  {
    key: 'preset:bar-jaratusas',
    slug: 'bar-jaratusas',
    name: 'Bar Jara-Tusas',
    city: 'Noia',
    logoUrl: '/images/jaratusas-logo-circle.png',
    googleReviewUrl: 'https://maps.google.com/?q=Bar+Jara+Tusas+Rua+do+Curro+8+Noia',
    enableGatekeeper: false,
    isDefaultTemplate: false,
  },
  {
    key: 'preset:casa-mar-da-vila',
    slug: 'casa-mar-da-vila',
    name: 'Casa Mar da Vila',
    city: 'Noia',
    googleReviewUrl: 'https://maps.google.com/?q=Casa+Mar+da+Vila+Noia',
    enableGatekeeper: false,
    isDefaultTemplate: false,
  },
]

export function ReviewStandQrStudio() {
  const [crmLeads, setCrmLeads] = useState<CRMLead[]>([])
  const [loadingLeads, setLoadingLeads] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedKey, setSelectedKey] = useState<string>('preset:predeterminada')
  const [customReviewUrl, setCustomReviewUrl] = useState<string>('')

  useEffect(() => {
    let active = true
    fetch('/api/crm?limit=500', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!active || !data) return
        const list: CRMLead[] = Array.isArray(data.leads)
          ? data.leads
          : Array.isArray(data)
            ? data
            : []
        setCrmLeads(list)
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoadingLeads(false)
      })
    return () => {
      active = false
    }
  }, [])

  const allOptions = useMemo<StandPreset[]>(() => {
    const leadOptions: StandPreset[] = crmLeads.map((lead) => {
      const derivedSlug = normalizeSlug(lead.custom_slug || lead.name || lead.id) || lead.id
      const reviewUrl =
        lead.google_review_url ||
        lead.google_profile_url ||
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          `${lead.name} ${lead.city || ''}`.trim()
        )}`

      return {
        key: `lead:${lead.id}`,
        slug: derivedSlug,
        name: lead.name,
        city: lead.city || 'Galicia',
        logoUrl: lead.logo_url || undefined,
        googleReviewUrl: reviewUrl,
        enableGatekeeper: Boolean(lead.enable_review_gatekeeper),
        isDefaultTemplate: false,
      }
    })
    return [...STATIC_PRESETS, ...leadOptions]
  }, [crmLeads])

  const filteredOptions = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return allOptions
    return allOptions.filter(
      (opt) =>
        opt.name.toLowerCase().includes(q) ||
        opt.city.toLowerCase().includes(q) ||
        opt.slug.toLowerCase().includes(q)
    )
  }, [allOptions, search])

  const activePreset = useMemo(
    () => allOptions.find((o) => o.key === selectedKey) || STATIC_PRESETS[0],
    [allOptions, selectedKey]
  )

  useEffect(() => {
    setCustomReviewUrl(activePreset.googleReviewUrl)
  }, [activePreset.key, activePreset.googleReviewUrl])

  return (
    <div className="space-y-5">
      {/* Selector de local / plantilla dentro del Kit de Calle */}
      <div className="rounded-3xl bg-white/[0.04] border border-white/[0.08] p-4 sm:p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-400/30 flex items-center justify-center">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">
                Estudio de Expositor NFC + QR de Reseñas Google (Frente y Reverso)
              </h3>
              <p className="text-[11px] text-slate-400">
                Elige la plantilla predeterminada (20 € pago único) o cualquier local de tu CRM ({crmLeads.length} cargados)
              </p>
            </div>
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-[11px] font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Gratis con Carta QR 15 €/mes · 20 € suelto</span>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar local por nombre o ciudad (ej. Santiago, Noia, Tita...)"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={activePreset.key}
              onChange={(e) => setSelectedKey(e.target.value)}
              aria-label="Seleccionar local para el expositor"
              className="flex-1 px-3 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              {filteredOptions.slice(0, 250).map((opt) => (
                <option key={opt.key} value={opt.key}>
                  {opt.name} — {opt.city}
                </option>
              ))}
            </select>
            {loadingLeads && <Loader2 className="w-4 h-4 animate-spin text-slate-400 shrink-0" />}
          </div>
        </div>

        {/* Ajuste rápido de URL directa de Google Reviews (útil para placas genéricas al vuelo) */}
        {activePreset.isDefaultTemplate && (
          <div className="pt-1">
            <label className="block text-[11px] font-bold text-slate-300 mb-1">
              URL directa de Google Maps Reviews para el QR de esta plantilla predeterminada (opcional):
            </label>
            <input
              type="url"
              value={customReviewUrl}
              onChange={(e) => setCustomReviewUrl(e.target.value)}
              placeholder="https://search.google.com/local/writereview?placeid=..."
              className="w-full px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-700 text-xs font-mono text-amber-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
        )}
      </div>

      {/* Vista previa e impresión directa del Expositor Frente + Reverso */}
      <PrintableReviewStand
        slug={activePreset.slug}
        restaurantName={activePreset.name}
        city={activePreset.city}
        logoUrl={activePreset.logoUrl}
        googleReviewUrl={customReviewUrl || activePreset.googleReviewUrl}
        enableGatekeeper={activePreset.enableGatekeeper}
        isDefaultTemplate={activePreset.isDefaultTemplate}
        embedded
      />
    </div>
  )
}
