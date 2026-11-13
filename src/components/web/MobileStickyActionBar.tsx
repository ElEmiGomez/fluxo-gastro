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
      className={`fixed bottom-0 inset-x-0 z-40 md:hidden backdrop-blur-md border-t border-white/10 px-3 py-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] transition-transform duration-300 shadow-2xl ${
        isUrbanBrewery ? 'bg-[#0A0B0E]/95' : 'bg-[#0B0D10]/95'
      }`}
    >
      <div className="flex items-center justify-between gap-2 max-w-md mx-auto">
        {isUrbanBrewery ? (
          <>
            {/* 1. Protagonista A: Ver Carta (Con precios y variantes) */}
            <button
              onClick={onOpenMenu}
              className="flex-[1.5] flex items-center justify-center gap-1.5 min-h-[48px] py-2 px-3 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] active:scale-95 text-[#0A0B0E] font-extrabold text-xs shadow-lg shadow-[#F59E0B]/25 transition-all"
            >
              <Utensils className="w-4 h-4 flex-shrink-0" />
              <span>{t.menu}</span>
            </button>

            {/* 2. Protagonista B: Cómo Llegar (Rotación directa a barra/terraza) */}
            <a
              href={googleMapsUrl || '#horarios'}
              target={googleMapsUrl ? '_blank' : '_self'}
              rel="noopener noreferrer"
              className="flex-[1.5] flex items-center justify-center gap-1.5 min-h-[48px] py-2 px-3 rounded-xl bg-white/12 hover:bg-white/20 active:scale-95 text-white font-bold text-xs transition-all"
            >
              <MapPin className="w-4 h-4 text-[#F59E0B] flex-shrink-0" />
              <span>{t.directions}</span>
            </a>

            {/* 3. Llamar */}
            <a
              href={`tel:${cleanPhone}`}
              className="flex-1 flex flex-col items-center justify-center min-h-[48px] py-1.5 px-1.5 rounded-xl text-white/75 hover:text-white hover:bg-white/5 active:scale-95 transition-all text-[11px] font-medium"
            >
              <Phone className="w-4 h-4 mb-0.5 text-white/90" />
              <span>{t.call}</span>
            </a>

            {/* 4. Grupos / Reserva */}
            <button
              onClick={onOpenReservation}
              className="flex-1 flex flex-col items-center justify-center min-h-[48px] py-1.5 px-1.5 rounded-xl text-white/75 hover:text-white hover:bg-white/5 active:scale-95 transition-all text-[11px] font-medium"
            >
              <Calendar className="w-4 h-4 mb-0.5 text-[#F59E0B]" />
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
