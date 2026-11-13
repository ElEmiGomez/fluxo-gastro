'use client'

import React from 'react'
import { Calendar, Utensils, MapPin, Phone } from 'lucide-react'
import type { RestaurantArchetype, WebLanguage } from '@/types/gastronomic-web.types'

interface MobileStickyActionBarProps {
  archetype: RestaurantArchetype
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
    groups: 'Grupos',
    call: 'Llamar',
  },
  gl: {
    menu: 'Ver Carta',
    directions: 'Como Chegar',
    bookTable: 'Reservar Mesa',
    groups: 'Grupos',
    call: 'Chamar',
  },
  en: {
    menu: 'View Menu',
    directions: 'Directions',
    bookTable: 'Book Table',
    groups: 'Groups',
    call: 'Call',
  },
}

/**
 * Barra fija en la zona del pulgar (Thumb Zone) para visualización móvil (390px).
 * Adapta los botones protagonistas según el arquetipo del local (Olivares & Fluxo UX Standard).
 */
export function MobileStickyActionBar({
  archetype,
  phone,
  googleMapsUrl,
  isOpenNow,
  lang = 'es',
  onOpenReservation,
  onOpenMenu,
}: MobileStickyActionBarProps) {
  const isRestaurant = archetype === 'restaurant' || archetype === 'alta_mesa' || archetype === 'gastro_bistro'
  const isUrbanBrewery = archetype === 'urban_street' || archetype === 'tavern'
  const cleanPhone = phone.replace(/\s+/g, '')
  const t = BAR_LABELS[lang] || BAR_LABELS.es

  return (
    <aside
      aria-label="Acciones rápidas del local"
      data-open={isOpenNow ? 'true' : 'false'}
      className={`fixed bottom-0 inset-x-0 z-40 md:hidden backdrop-blur-md border-t border-white/10 px-2.5 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] transition-transform duration-300 shadow-2xl ${
        isUrbanBrewery ? 'bg-[#0A0B0E]/95' : 'bg-[#0B0D10]/95'
      }`}
      style={{ fontFamily: "'DM Sans', 'Inter', sans-serif" }}
    >
      <div className="flex items-center justify-between gap-1.5 max-w-md mx-auto">
        {isUrbanBrewery ? (
          <>
            {/* 1. Protagonista A: Ver Carta (Con precios y variantes) */}
            <button
              type="button"
              onClick={onOpenMenu}
              className="flex-[1.3] min-w-0 flex items-center justify-center gap-1.5 min-h-[48px] py-2 px-2.5 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] active:scale-95 text-[#0A0B0E] font-extrabold text-[12px] whitespace-nowrap shadow-lg shadow-[#F59E0B]/25 transition-all ease-[cubic-bezier(0.22,1,0.36,1)]"
            >
              <Utensils className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{t.menu}</span>
            </button>

            {/* 2. Protagonista B: Cómo Llegar (Rotación directa a barra/terraza) */}
            <a
              href={googleMapsUrl || '#horarios'}
              target={googleMapsUrl ? '_blank' : undefined}
              rel={googleMapsUrl ? 'noopener noreferrer' : undefined}
              className="flex-[1.5] min-w-0 flex items-center justify-center gap-1.5 min-h-[48px] py-2 px-2.5 rounded-xl bg-white/[0.12] hover:bg-white/20 active:scale-95 text-white font-bold text-[12px] whitespace-nowrap transition-all ease-[cubic-bezier(0.22,1,0.36,1)]"
            >
              <MapPin className="w-3.5 h-3.5 text-[#F59E0B] flex-shrink-0" />
              <span>{t.directions}</span>
            </a>

            {/* 3. Llamar */}
            <a
              href={`tel:${cleanPhone}`}
              className="flex-[0.85] min-w-0 flex flex-col items-center justify-center min-h-[48px] py-1.5 px-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/5 active:scale-95 transition-all ease-[cubic-bezier(0.22,1,0.36,1)] text-[11px] font-medium whitespace-nowrap"
            >
              <Phone className="w-4 h-4 mb-0.5 text-white/90 flex-shrink-0" />
              <span>{t.call}</span>
            </a>

            {/* 4. Grupos / Reserva */}
            <button
              type="button"
              onClick={onOpenReservation}
              className="flex-[0.85] min-w-0 flex flex-col items-center justify-center min-h-[48px] py-1.5 px-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/5 active:scale-95 transition-all ease-[cubic-bezier(0.22,1,0.36,1)] text-[11px] font-medium whitespace-nowrap"
            >
              <Calendar className="w-4 h-4 mb-0.5 text-[#F59E0B] flex-shrink-0" />
              <span>{t.groups}</span>
            </button>
          </>
        ) : (
          <>
            {/* 1. Botón Carta */}
            <button
              onClick={onOpenMenu}
              className="flex-1 flex flex-col items-center justify-center min-h-[48px] py-1.5 px-2 rounded-xl text-white/70 hover:text-white hover:bg-white/5 active:scale-95 transition-all text-xs font-medium"
            >
              <Utensils className="w-4 h-4 mb-1 text-white/90" />
              <span>{t.menu}</span>
            </button>

            {/* 2. Botón Primario Central Adaptativo */}
            {isRestaurant ? (
              <button
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

            {/* 3. Acción Secundaria: Reservar o Llegar */}
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
                onClick={onOpenReservation}
                className="flex-1 flex flex-col items-center justify-center min-h-[48px] py-1.5 px-2 rounded-xl text-white/70 hover:text-white hover:bg-white/5 active:scale-95 transition-all text-xs font-medium"
              >
                <Calendar className="w-4 h-4 mb-1 text-white/90" />
                <span>{t.groups}</span>
              </button>
            )}

            {/* 4. Botón Llamar */}
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
