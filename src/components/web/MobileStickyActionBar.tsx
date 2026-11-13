'use client'

import React from 'react'
import { Calendar, Utensils, MapPin, Phone, MessageCircle } from 'lucide-react'
import type { RestaurantArchetype, WebLanguage } from '@/types/gastronomic-web.types'

interface MobileStickyActionBarProps {
  archetype: RestaurantArchetype
  layoutPreset?: 'cauce_editorial' | 'cinematic_scroll'
  phone: string
  googleMapsUrl?: string
  isOpenNow: boolean
  lang?: WebLanguage
  onOpenReservation: () => void
  onOpenMenu: () => void
}

const BAR_LABELS = {
  es: {
    menu: 'Ver Carta',
    directions: 'Cómo Llegar',
    bookTable: 'Reservar Mesa',
    bookOrGo: 'Reservar / Ir',
    groups: 'Grupos',
    call: 'Llamar',
  },
  gl: {
    menu: 'Ver Carta',
    directions: 'Como Chegar',
    bookTable: 'Reservar Mesa',
    bookOrGo: 'Reservar / Ir',
    groups: 'Grupos',
    call: 'Chamar',
  },
  en: {
    menu: 'View Menu',
    directions: 'Directions',
    bookTable: 'Book Table',
    bookOrGo: 'Book / Visit',
    groups: 'Groups',
    call: 'Call',
  },
}

/**
 * Barra fija en la zona del pulgar para visualización móvil (390px).
 */
export function MobileStickyActionBar({
  archetype,
  layoutPreset,
  phone,
  googleMapsUrl,
  isOpenNow,
  lang = 'es',
  onOpenReservation,
  onOpenMenu,
}: MobileStickyActionBarProps) {
  const isCauce = layoutPreset === 'cauce_editorial'
  const isRestaurant = archetype === 'restaurant' || archetype === 'alta_mesa' || archetype === 'gastro_bistro'
  const isUrbanBrewery = archetype === 'urban_street' || archetype === 'tavern'
  const cleanPhone = phone.replace(/\s+/g, '')
  const t = BAR_LABELS[lang] || BAR_LABELS.es

  if (isCauce) {
    return (
      <aside
        aria-label="Acciones rápidas del local"
        data-open={isOpenNow ? 'true' : 'false'}
        className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-white/95 backdrop-blur-md border-t border-slate-200 text-[#0F172A] px-3 py-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgba(15,23,42,0.06)]"
        style={{ fontFamily: "'DM Sans', 'Inter', sans-serif" }}
      >
        <div className="grid grid-cols-2 gap-2.5 max-w-md mx-auto">
          <button
            type="button"
            onClick={onOpenMenu}
            className="min-h-[48px] px-3 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 active:scale-[0.98] text-[#0F172A] font-semibold text-sm flex items-center justify-center gap-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]"
          >
            <Utensils className="w-4 h-4 text-[#0F172A] flex-shrink-0" />
            <span className="truncate">{t.menu}</span>
          </button>

          <button
            type="button"
            onClick={onOpenReservation}
            className="min-h-[48px] px-3 py-2.5 rounded-xl bg-[#1D4ED8] hover:bg-[#1E3A8A] active:scale-[0.98] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8] focus-visible:ring-offset-2"
          >
            <MessageCircle className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{t.bookOrGo}</span>
          </button>
        </div>
      </aside>
    )
  }

  return (
    <aside
      aria-label="Acciones rápidas del local"
      data-open={isOpenNow ? 'true' : 'false'}
      className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-[#0B0D10]/95 backdrop-blur-md border-t border-white/10 px-2.5 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] transition-transform duration-300 shadow-2xl"
      style={{ fontFamily: "'DM Sans', 'Inter', sans-serif" }}
    >
      <div className="flex items-center justify-between gap-1.5 max-w-md mx-auto">
        {isUrbanBrewery ? (
          <>
            <button
              type="button"
              onClick={onOpenMenu}
              className="flex-[1.3] min-w-0 flex items-center justify-center gap-1.5 min-h-[48px] py-2 px-2.5 rounded-xl bg-[#1D4ED8] hover:bg-[#1E3A8A] active:scale-95 text-white font-bold text-[12px] whitespace-nowrap shadow-lg transition-all"
            >
              <Utensils className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{t.menu}</span>
            </button>

            <a
              href={googleMapsUrl || '#horarios'}
              target={googleMapsUrl ? '_blank' : undefined}
              rel={googleMapsUrl ? 'noopener noreferrer' : undefined}
              className="flex-[1.5] min-w-0 flex items-center justify-center gap-1.5 min-h-[48px] py-2 px-2.5 rounded-xl bg-white/[0.12] hover:bg-white/20 active:scale-95 text-white font-bold text-[12px] whitespace-nowrap transition-all"
            >
              <MapPin className="w-3.5 h-3.5 text-white flex-shrink-0" />
              <span>{t.directions}</span>
            </a>

            <a
              href={`tel:${cleanPhone}`}
              className="flex-[0.85] min-w-0 flex flex-col items-center justify-center min-h-[48px] py-1.5 px-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/5 active:scale-95 transition-all text-[11px] font-medium whitespace-nowrap"
            >
              <Phone className="w-4 h-4 mb-0.5 text-white/90 flex-shrink-0" />
              <span>{t.call}</span>
            </a>

            <button
              type="button"
              onClick={onOpenReservation}
              className="flex-[0.85] min-w-0 flex flex-col items-center justify-center min-h-[48px] py-1.5 px-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/5 active:scale-95 transition-all text-[11px] font-medium whitespace-nowrap"
            >
              <Calendar className="w-4 h-4 mb-0.5 text-white/90 flex-shrink-0" />
              <span>{t.groups}</span>
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={onOpenMenu}
              className="flex-1 flex flex-col items-center justify-center min-h-[48px] py-1.5 px-2 rounded-xl text-white/70 hover:text-white hover:bg-white/5 active:scale-95 transition-all text-xs font-medium"
            >
              <Utensils className="w-4 h-4 mb-1 text-white/90" />
              <span>{t.menu}</span>
            </button>

            {isRestaurant ? (
              <button
                type="button"
                onClick={onOpenReservation}
                className="flex-[2] flex items-center justify-center gap-2 min-h-[48px] py-2 px-4 rounded-xl bg-[#C85A32] hover:bg-[#b04d28] active:scale-95 text-white font-semibold text-sm shadow-lg shadow-[#C85A32]/25 transition-all"
              >
                <Calendar className="w-4 h-4" />
                <span>{t.bookTable}</span>
              </button>
            ) : (
              <a
                href={googleMapsUrl || '#horarios'}
                target={googleMapsUrl ? '_blank' : '_self'}
                rel="noopener noreferrer"
                className="flex-[2] flex items-center justify-center gap-2 min-h-[48px] py-2 px-4 rounded-xl bg-[#C85A32] hover:bg-[#b04d28] active:scale-95 text-white font-semibold text-sm shadow-lg shadow-[#C85A32]/25 transition-all"
              >
                <MapPin className="w-4 h-4" />
                <span>{t.directions}</span>
              </a>
            )}

            {isRestaurant ? (
              <a
                href={googleMapsUrl || '#horarios'}
                target={googleMapsUrl ? '_blank' : '_self'}
                rel="noopener noreferrer"
                className="flex-1 flex flex-col items-center justify-center min-h-[48px] py-1.5 px-2 rounded-xl text-white/70 hover:text-white hover:bg-white/5 active:scale-95 transition-all text-xs font-medium"
              >
                <MapPin className="w-4 h-4 mb-1 text-white/90" />
                <span>{t.directions}</span>
              </a>
            ) : (
              <button
                type="button"
                onClick={onOpenReservation}
                className="flex-1 flex flex-col items-center justify-center min-h-[48px] py-1.5 px-2 rounded-xl text-white/70 hover:text-white hover:bg-white/5 active:scale-95 transition-all text-xs font-medium"
              >
                <Calendar className="w-4 h-4 mb-1 text-white/90" />
                <span>{t.groups}</span>
              </button>
            )}

            <a
              href={`tel:${cleanPhone}`}
              className="flex-1 flex flex-col items-center justify-center min-h-[48px] py-1.5 px-2 rounded-xl text-white/70 hover:text-white hover:bg-white/5 active:scale-95 transition-all text-xs font-medium"
            >
              <Phone className="w-4 h-4 mb-1 text-white/90" />
              <span>{t.call}</span>
            </a>
          </>
        )}
      </div>
    </aside>
  )
}
