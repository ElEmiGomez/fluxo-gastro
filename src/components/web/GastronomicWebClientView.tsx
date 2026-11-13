'use client'

import React, { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  MapPin,
  Phone,
  Clock,
  Compass,
  ChevronDown,
  Search,
  X,
  Flame,
  ShieldCheck,
  Fish,
  Sun,
  Moon,
  ArrowRight,
  Star,
  Check,
  Calendar,
  Utensils,
  AlertTriangle,
  Wifi,
  ExternalLink,
  Beer,
} from 'lucide-react'
import type {
  GastronomicTenantConfig,
  DishShowcaseItem,
  SpaceAmbienceItem,
  WebLanguage,
} from '@/types/gastronomic-web.types'
import { HeroCinematic } from '@/components/web/HeroCinematic'
import { CanvasScrollytelling } from '@/components/web/CanvasScrollytelling'
import { MobileStickyActionBar } from '@/components/web/MobileStickyActionBar'
import { WhatsAppReservationDrawer } from '@/components/web/WhatsAppReservationDrawer'
import { getOpeningStatus } from '@/lib/opening-hours-calculator'

// ==============================================================================
// DICCIONARIOS TRILINGÜES (ES | GAL | EN) CON AUTO-DETECCIÓN
// ==============================================================================
const I18N = {
  es: {
    menuAndPrices: 'Carta & Precios',
    spaces: 'Ambientes',
    scheduleAndLocation: 'Horarios & Ubicación',
    reviews: 'Opiniones',
    bookTable: 'Reservar',
    groupsAndBooking: 'Grupos / Reserva',
    requestTable: 'Solicitar Mesa',
    howToGet: 'Cómo Llegar',
    call: 'Llamar',
    signatureDishBadge: 'Imprescindibles de la Casa',
    signatureSectionTitleBrewery: 'Cerveza de Bodega, Vermú & Cocina Caliente',
    signatureSectionSubtitleBrewery:
      'Cuatro clásicos que definen nuestra barra en la Rúa do Curro. Pulsa en cualquiera para consultar formatos y precios en la carta completa.',
    openFullMenuBtn: 'Ver Carta Completa con Precios',
    openQrMenuPageBtn: 'Abrir Vista de Carta (/p/bar-jaratusas)',
    availableFormats: 'Formatos de servicio',
    seePricesInMenu: 'Ver precios y variantes →',
    sustainableFishing: 'Materia prima local y tirador de bodega',
    fairPricing: 'Precios transparentes con IVA en carta',
    ambienceTitle: 'Elige tu Ambiente y tu Hora',
    ambienceSubtitle: 'De la sesión vermú bajo los soportales de piedra a las cañas y raciones por la noche.',
    lunchTime: 'Sesión Vermú · 13:30h',
    dinnerTime: 'Cañas & Noche · 21:30h',
    selectForBooking: 'Reservar para Grupo en esta Zona',
    reviewsTitle: 'Lo que Dicen Nuestros Clientes',
    verifiedVisit: 'Reseña Verificada en Google',
    seeAllGoogleReviews: 'Ver todas las opiniones en Google Maps',
    whereToFindUs: 'Dónde Encontrarnos',
    weeklyService: 'Horario Semanal en Vivo',
    today: '(Hoy)',
    closedShift: 'Cerrado por descanso',
    wifiCourtesy: 'WiFi Clientes en Local',
    faqsTitle: 'Preguntas Frecuentes',
    digitalMenuTitle: 'Carta Fija Digital · Transparencia Total',
    searchPlaceholder: 'Buscar cerveza, vino, ración o alérgeno...',
    allCategories: 'Todos',
    marketPriceTag: '🌊 Precio según lonja',
    openNowKitchen: '🟢 Abierto ahora · Cocina hasta',
    openNow: '🟢 Abierto ahora',
    closedNow: '🔴 Cerrado ahora',
    allergensDeclared: 'Alérgenos Declarados (Reglamento UE 1169/2011):',
    closeDetail: 'Cerrar Ficha',
    vatIncludedNote: 'Precios con IVA incluido. Tapa de cortesía con cada consumición.',
    noDishesFound: 'No se encontraron productos que coincidan con tu búsqueda.',
    faqs: [
      {
        q: '1. ¿Hace falta reservar para tomar cañas, vinos o picar algo?',
        a: 'No es necesario reservar para venir de cañas, vermú o tapeo en barra y terraza; funcionamos por rotación directa. Si sois un grupo grande para raciones, podéis avisarnos por WhatsApp en 1 toque.',
      },
      {
        q: '2. ¿Todas las consumiciones incluyen tapa de cortesía?',
        a: 'Sí, fieles a la tradición de Noia, cada caña, vino o vermú sale acompañado de nuestra tapa de cocina recién hecha.',
      },
      {
        q: '3. ¿Cómo puedo consultar los 14 alérgenos y todas las variantes de precios?',
        a: 'Al pulsar en «Ver Carta Completa con Precios» tienes el desglose íntegro de precios por caña, copa, xarra, media ración o ración completa, junto con los iconos oficiales de los 14 alérgenos.',
      },
    ],
  },
  gl: {
    menuAndPrices: 'Carta e Prezos',
    spaces: 'Ambientes',
    scheduleAndLocation: 'Horarios e Localización',
    reviews: 'Opinións',
    bookTable: 'Reservar',
    groupsAndBooking: 'Grupos / Reserva',
    requestTable: 'Solicitar Mesa',
    howToGet: 'Como Chegar',
    call: 'Chamar',
    signatureDishBadge: 'Imprescindibles da Casa',
    signatureSectionTitleBrewery: 'Cervexa de Adega, Vermú e Cociña Quente',
    signatureSectionSubtitleBrewery:
      'Catro clásicos que definen a nosa barra na Rúa do Curro. Preme en calquera para consultar formatos e prezos na carta completa.',
    openFullMenuBtn: 'Ver Carta Completa con Prezos',
    openQrMenuPageBtn: 'Abrir Vista de Carta (/p/bar-jaratusas)',
    availableFormats: 'Formatos de servizo',
    seePricesInMenu: 'Ver prezos e variantes →',
    sustainableFishing: 'Materia prima local e tirador de adega',
    fairPricing: 'Prezos transparentes con IVE na carta',
    ambienceTitle: 'Escolle o teu Ambiente e a túa Hora',
    ambienceSubtitle: 'Da sesión vermú baixo os soportais de pedra ás canas e racións pola noite.',
    lunchTime: 'Sesión Vermú · 13:30h',
    dinnerTime: 'Canas e Noite · 21:30h',
    selectForBooking: 'Reservar para Grupo nesta Zona',
    reviewsTitle: 'O que Din a Nosa Xente',
    verifiedVisit: 'Opinión Verificada en Google',
    seeAllGoogleReviews: 'Ver todas as opinións en Google Maps',
    whereToFindUs: 'Onde Atoparnos',
    weeklyService: 'Horario Semanal en Vivo',
    today: '(Hoxe)',
    closedShift: 'Pechado por descanso',
    wifiCourtesy: 'WiFi Clientes no Local',
    faqsTitle: 'Preguntas Frecuentes',
    digitalMenuTitle: 'Carta Fixa Dixital · Transparencia Total',
    searchPlaceholder: 'Buscar cervexa, viño, ración ou alérxeno...',
    allCategories: 'Todos',
    marketPriceTag: '🌊 Prezo segundo lonxa',
    openNowKitchen: '🟢 Aberto agora · Cociña ata',
    openNow: '🟢 Aberto agora',
    closedNow: '🔴 Pechado agora',
    allergensDeclared: 'Alérxenos Declarados (Regulamento UE 1169/2011):',
    closeDetail: 'Pechar Ficha',
    vatIncludedNote: 'Prezos con IVE incluído. Tapa de cortesía con cada consumición.',
    noDishesFound: 'Non se atoparon produtos que coincidan coa túa busca.',
    faqs: [
      {
        q: '1. Cómpre reservar para tomar canas, viños ou picar algo?',
        a: 'Non é necesario reservar para vir de canas, vermú ou tapeo en barra e terraza; funcionamos por rotación directa. Se sodes un grupo grande para racións, podedes avisarnos por WhatsApp nun toque.',
      },
      {
        q: '2. Todas as consumicións inclúen tapa de cortesía?',
        a: 'Si, fieis á tradición de Noia, cada cana, viño ou vermú sae acompañado da nosa tapa de cociña recén feita.',
      },
      {
        q: '3. Como podo consultar os 14 alérxenos e todas as variantes de prezos?',
        a: 'Ao premer en «Ver Carta Completa con Prezos» tes a desagregación íntegra de prezos por cana, copa, xarra, media ración ou ración completa, xunto cos 14 alérxenos.',
      },
    ],
  },
  en: {
    menuAndPrices: 'Menu & Prices',
    spaces: 'Spaces',
    scheduleAndLocation: 'Hours & Location',
    reviews: 'Reviews',
    bookTable: 'Book Table',
    groupsAndBooking: 'Groups / Booking',
    requestTable: 'Request Table',
    howToGet: 'Directions',
    call: 'Call',
    signatureDishBadge: 'House Essentials',
    signatureSectionTitleBrewery: 'Cellar Draft Beer, Galician Vermouth & Hot Tapas',
    signatureSectionSubtitleBrewery:
      'Four essentials that define our bar on Rúa do Curro. Tap any item to explore serving sizes and full transparent prices.',
    openFullMenuBtn: 'View Full Menu with Prices',
    openQrMenuPageBtn: 'Open Full Menu Page (/p/bar-jaratusas)',
    availableFormats: 'Serving formats',
    seePricesInMenu: 'See prices & sizes →',
    sustainableFishing: 'Local produce & cellar draft tanks',
    fairPricing: 'Transparent pricing with tax included',
    ambienceTitle: 'Choose Your Spot & Time of Day',
    ambienceSubtitle: 'From midday vermouth beneath the stone arcades to evening draft beers and tapas.',
    lunchTime: 'Vermouth Hour · 1:30 PM',
    dinnerTime: 'Evening & Tapas · 9:30 PM',
    selectForBooking: 'Request Group Table in This Area',
    reviewsTitle: 'What Our Guests Say',
    verifiedVisit: 'Verified Google Review',
    seeAllGoogleReviews: 'See all reviews on Google Maps',
    whereToFindUs: 'Where to Find Us',
    weeklyService: 'Live Weekly Schedule',
    today: '(Today)',
    closedShift: 'Closed for rest',
    wifiCourtesy: 'Guest WiFi in Bar',
    faqsTitle: 'Frequently Asked Questions',
    digitalMenuTitle: 'Official Digital Menu · Full Price Transparency',
    searchPlaceholder: 'Search beer, wine, tapa or allergen...',
    allCategories: 'All',
    marketPriceTag: '🌊 Daily market price',
    openNowKitchen: '🟢 Open now · Kitchen until',
    openNow: '🟢 Open now',
    closedNow: '🔴 Closed now',
    allergensDeclared: 'Declared Allergens (EU Regulation 1169/2011):',
    closeDetail: 'Close Item',
    vatIncludedNote: 'Prices include tax (VAT). Complimentary house tapa with every drink.',
    noDishesFound: 'No items found matching your search.',
    faqs: [
      {
        q: '1. Do I need a reservation for beers, vermouth or tapas?',
        a: 'Walk-ins are always welcome at our bar and covered stone terrace. If you are coming with a larger group for sharing plates, you can message us via WhatsApp in one tap.',
      },
      {
        q: '2. Does every drink come with a complimentary tapa?',
        a: 'Yes! Following Noia’s hospitality tradition, every draft beer, wine or vermouth comes with a freshly prepared hot tapa from our kitchen.',
      },
      {
        q: '3. Where can I check all serving sizes, prices and the 14 allergens?',
        a: 'Tap "View Full Menu with Prices" to inspect every serving size (small draft, pint glass, frosted mug, half or full portion) and the 14 official EU allergens.',
      },
    ],
  },
}

interface GastronomicWebClientViewProps {
  tenant: GastronomicTenantConfig
}

export default function GastronomicWebClientView({ tenant }: GastronomicWebClientViewProps) {
  const isUrbanBrewery = tenant.archetype === 'urban_street' || tenant.archetype === 'tavern'

  // 1. Detección y Selección de Idioma (ES | GAL | EN)
  const [lang, setLang] = useState<WebLanguage>('es')

  useEffect(() => {
    try {
      const savedLang = localStorage.getItem('fluxo_web_lang') as WebLanguage | null
      if (savedLang && ['es', 'gl', 'en'].includes(savedLang)) {
        setLang(savedLang)
        return
      }
      const navLang = navigator.language?.toLowerCase() || ''
      if (navLang.startsWith('gl') || navLang.startsWith('ga')) {
        setLang('gl')
      } else if (navLang.startsWith('en')) {
        setLang('en')
      } else {
        setLang('es')
      }
    } catch {
      setLang('es')
    }
  }, [])

  const handleLangChange = (newLang: WebLanguage) => {
    setLang(newLang)
    try {
      localStorage.setItem('fluxo_web_lang', newLang)
    } catch {
      // Ignorar si storage bloqueado
    }
  }

  const t = I18N[lang]

  // Helpers de traducción de datos del local
  const getDishName = (d: DishShowcaseItem) =>
    lang === 'gl' ? d.name_gl || d.name : lang === 'en' ? d.name_en || d.name : d.name

  const getDishDesc = (d: DishShowcaseItem) =>
    lang === 'gl'
      ? d.description_gl || d.description
      : lang === 'en'
      ? d.description_en || d.description
      : d.description

  const getDishCat = (d: DishShowcaseItem) =>
    lang === 'gl' ? d.category_gl || d.category : lang === 'en' ? d.category_en || d.category : d.category

  const getAmbName = (a: SpaceAmbienceItem) =>
    lang === 'gl' ? a.name_gl || a.name : lang === 'en' ? a.name_en || a.name : a.name

  const getAmbSubtitle = (a: SpaceAmbienceItem) =>
    lang === 'gl'
      ? a.subtitle_gl || a.subtitle
      : lang === 'en'
      ? a.subtitle_en || a.subtitle
      : a.subtitle

  const getAmbDesc = (a: SpaceAmbienceItem) =>
    lang === 'gl' ? a.desc_gl || a.desc : lang === 'en' ? a.desc_en || a.desc : a.desc

  const getAmbBadge = (a: SpaceAmbienceItem) =>
    lang === 'gl' ? a.badge_gl || a.badge : lang === 'en' ? a.badge_en || a.badge : a.badge

  const getAmbLighting = (a: SpaceAmbienceItem, mode: 'day' | 'night') => {
    if (mode === 'day') {
      return lang === 'gl'
        ? a.lightingNoteDay_gl || a.lightingNoteDay
        : lang === 'en'
        ? a.lightingNoteDay_en || a.lightingNoteDay
        : a.lightingNoteDay
    }
    return lang === 'gl'
      ? a.lightingNoteNight_gl || a.lightingNoteNight
      : lang === 'en'
      ? a.lightingNoteNight_en || a.lightingNoteNight
      : a.lightingNoteNight
  }

  const localizedTagline =
    lang === 'gl'
      ? tenant.tagline_gl || tenant.tagline
      : lang === 'en'
      ? tenant.tagline_en || tenant.tagline
      : tenant.tagline

  const localizedHistoryTitle =
    lang === 'gl'
      ? tenant.historyTitle_gl || tenant.historyTitle
      : lang === 'en'
      ? tenant.historyTitle_en || tenant.historyTitle
      : tenant.historyTitle

  const localizedHistoryText =
    lang === 'gl'
      ? tenant.historyText_gl || tenant.historyText
      : lang === 'en'
      ? tenant.historyText_en || tenant.historyText
      : tenant.historyText

  // 2. Radar de Visitas y Conversión
  const trackConversion = (
    eventName: 'pageview' | 'open_menu' | 'click_reservation' | 'click_maps' | 'click_call'
  ) => {
    try {
      if (typeof window !== 'undefined' && (window as any).plausible) {
        ;(window as any).plausible(eventName, { props: { local: tenant.slug } })
      }
    } catch {
      // Silenciar telemetría si hay ad-blocker
    }
  }

  useEffect(() => {
    trackConversion('pageview')
  }, [tenant.slug])

  // 3. Estados de Modales y Drawers
  const [isReservationOpen, setIsReservationOpen] = useState(false)
  const [selectedZone, setSelectedZone] = useState<string>(
    tenant.ambiences[0]?.name || 'Terraza & Soportales'
  )
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false)
  const [selectedDishDetail, setSelectedDishDetail] = useState<DishShowcaseItem | null>(null)

  // 4. Estados del Bloque de Ambientes y Luz (13:30h vs 21:30h)
  const [lightMode, setLightMode] = useState<'day' | 'night'>('day')
  const [activeAmbienceId, setActiveAmbienceId] = useState<string>(
    tenant.ambiences[0]?.id || ''
  )

  // 5. Estados del Buscador de la Carta Fija
  const [menuSearch, setMenuSearch] = useState('')
  const [menuFilterCategory, setMenuFilterCategory] = useState<string>('ALL')

  // 6. Estado de FAQs
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  // Productos insignia para la Portada Aspiracional (0 Precios en Home - DEC-39)
  const signatureDishes = useMemo(() => {
    const sigs = tenant.dishes.filter((d) => d.isSignature)
    return sigs.length > 0 ? sigs.slice(0, 4) : tenant.dishes.slice(0, 4)
  }, [tenant.dishes])

  // Categorías de la Carta
  const categories = useMemo(() => {
    const cats = Array.from(new Set(tenant.dishes.map((d) => getDishCat(d))))
    return [{ key: 'ALL', label: t.allCategories }, ...cats.map((c) => ({ key: c, label: c }))]
  }, [tenant.dishes, lang, t.allCategories])

  // Platos filtrados en el modal de carta
  const filteredDishes = useMemo(() => {
    return tenant.dishes.filter((dish) => {
      const catName = getDishCat(dish)
      const matchCat = menuFilterCategory === 'ALL' || catName === menuFilterCategory
      const q = menuSearch.trim().toLowerCase()
      const matchSearch =
        q === '' ||
        getDishName(dish).toLowerCase().includes(q) ||
        getDishDesc(dish).toLowerCase().includes(q) ||
        (dish.allergens || []).some((a) => a.toLowerCase().includes(q)) ||
        (dish.variants || []).some((v) => v.name.toLowerCase().includes(q))
      return matchCat && matchSearch
    })
  }, [tenant.dishes, menuFilterCategory, menuSearch, lang])

  // Semáforo de Horario Inteligente en Vivo
  const openingStatus = useMemo(() => {
    return getOpeningStatus(tenant.openingHours, new Date())
  }, [tenant.openingHours])

  const currentSchedule = useMemo(() => {
    const todayDay = new Date().getDay()
    return tenant.openingHours.find((s) => s.dayOfWeek === todayDay)
  }, [tenant.openingHours])

  const trafficLightText = useMemo(() => {
    if (!openingStatus.isOpen) {
      return t.closedNow
    }
    if (currentSchedule?.kitchenClose) {
      return `${t.openNowKitchen} ${currentSchedule.kitchenClose}h`
    }
    return t.openNow
  }, [openingStatus.isOpen, currentSchedule, t])

  const handleOpenReservationWithZone = (zoneName: string) => {
    setSelectedZone(zoneName)
    setIsReservationOpen(true)
    trackConversion('click_reservation')
  }

  const DAY_NAMES =
    lang === 'gl'
      ? ['Domingo', 'Luns', 'Martes', 'Mércores', 'Xoves', 'Venres', 'Sábado']
      : lang === 'en'
      ? ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      : ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

  const todayDayOfWeek = new Date().getDay()

  return (
    <div
      className={`min-h-screen antialiased pb-24 md:pb-0 ${
        isUrbanBrewery
          ? 'bg-[#0A0B0E] text-[#F6F3EC] selection:bg-[#F59E0B] selection:text-[#0A0B0E]'
          : 'bg-[#F6F3EC] text-[#141311] selection:bg-[#C85A32] selection:text-[#F6F3EC]'
      }`}
      style={{ fontFamily: "'Sora', 'Instrument Sans', sans-serif" }}
    >
      {/* Carga de Fuentes del Arquetipo 1 (Anton + Sora) y Editorial */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Anton&family=Instrument+Sans:wght@400;500;600;700&family=Instrument+Serif:ital@0;1&family=Sora:wght@400;500;600;700;800&display=swap');
      `}</style>

      {/* ==============================================================================
         CABECERA NAVEGACIÓN FLOTANTE (LOGO CIRCULAR OBJECT-CONTAIN + SELECTOR IDIOMA)
         ============================================================================== */}
      <header className="fixed top-0 inset-x-0 z-40 bg-[#0A0B0E]/90 backdrop-blur-md border-b border-white/10 transition-all">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-18 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <Link href={`/web/${tenant.slug}`} className="flex items-center gap-2.5 group min-w-0">
              {tenant.logoUrl && (
                <div className="relative w-10 h-10 rounded-full bg-[#0A0B0E] p-0.5 ring-1 ring-[#F59E0B]/40 flex-shrink-0 flex items-center justify-center">
                  <Image
                    src={tenant.logoUrl}
                    alt={tenant.name}
                    width={38}
                    height={38}
                    className="w-full h-full object-contain rounded-full"
                  />
                </div>
              )}
              <span
                className={`text-lg sm:text-2xl tracking-tight font-bold text-[#F6F3EC] truncate transition ${
                  isUrbanBrewery
                    ? 'uppercase group-hover:text-[#F59E0B]'
                    : 'font-serif group-hover:text-[#C85A32]'
                }`}
                style={isUrbanBrewery ? { fontFamily: "'Anton', 'Sora', sans-serif", letterSpacing: '0.02em' } : undefined}
              >
                {tenant.name}
              </span>
              <span
                className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                  isUrbanBrewery ? 'bg-[#F59E0B]' : 'bg-[#C85A32]'
                }`}
              />
            </Link>

            {/* Semáforo de Horario Inteligente en Vivo */}
            <div className="hidden lg:inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 text-xs font-medium">
              <span
                className={`w-2 h-2 rounded-full ${
                  openingStatus.isOpen
                    ? 'bg-[#22C55E] animate-pulse shadow-[0_0_8px_#22C55E]'
                    : 'bg-[#EF4444]'
                }`}
              />
              <span className="text-white/90">{trafficLightText}</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-5">
            {/* Selector Manual de Idioma (ES | GAL | EN) */}
            <div
              role="group"
              aria-label="Selector de idioma"
              className="inline-flex p-1 rounded-full bg-white/5 text-[11px] font-bold text-white/70"
            >
              {(['es', 'gl', 'en'] as WebLanguage[]).map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => handleLangChange(code)}
                  className={`px-2.5 py-1 rounded-full transition-all uppercase ${
                    lang === code
                      ? isUrbanBrewery
                        ? 'bg-[#F59E0B] text-[#0A0B0E] shadow-sm'
                        : 'bg-[#C85A32] text-white shadow-sm'
                      : 'hover:text-white'
                  }`}
                >
                  {code === 'gl' ? 'GAL' : code.toUpperCase()}
                </button>
              ))}
            </div>

            <nav className="flex items-center gap-3 sm:gap-5">
              <button
                onClick={() => {
                  setIsMenuModalOpen(true)
                  trackConversion('open_menu')
                }}
                className={`text-xs uppercase tracking-[0.16em] font-semibold text-[#F6F3EC]/85 transition py-2 hidden sm:inline-block ${
                  isUrbanBrewery ? 'hover:text-[#F59E0B]' : 'hover:text-[#C85A32]'
                }`}
              >
                {t.menuAndPrices}
              </button>
              {tenant.ambiences.length > 0 && (
                <a
                  href="#ambientes"
                  className={`hidden md:inline-block text-xs uppercase tracking-[0.16em] font-semibold text-[#F6F3EC]/80 transition py-2 ${
                    isUrbanBrewery ? 'hover:text-[#F59E0B]' : 'hover:text-[#C85A32]'
                  }`}
                >
                  {t.spaces}
                </a>
              )}
              <button
                onClick={() => {
                  if (isUrbanBrewery) {
                    setIsMenuModalOpen(true)
                    trackConversion('open_menu')
                  } else {
                    setIsReservationOpen(true)
                    trackConversion('click_reservation')
                  }
                }}
                className={`hidden sm:inline-flex px-4 sm:px-5 py-2.5 rounded-full text-xs font-extrabold tracking-wider uppercase transition shadow-md ${
                  isUrbanBrewery
                    ? 'bg-[#F59E0B] text-[#0A0B0E] hover:bg-[#D97706] shadow-[#F59E0B]/20'
                    : 'bg-[#C85A32] text-white hover:bg-[#b04d28] shadow-[#C85A32]/25'
                }`}
              >
                {isUrbanBrewery ? t.menuAndPrices : t.bookTable}
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Aviso de Vacaciones o Festivo si está configurado */}
      {tenant.vacationNotice && (
        <div className="pt-20 bg-amber-500/15 text-amber-200 px-6 py-2.5 text-xs text-center font-medium flex items-center justify-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span>{tenant.vacationNotice}</span>
        </div>
      )}

      {/* ==============================================================================
         BLOQUE 1: HERO CINEMÁTICO 60FPS CON PROTECCIÓN LCP Y LOGO CIRCULAR ÍNTEGRO
         ============================================================================== */}
      <HeroCinematic
        restaurantName={tenant.name}
        archetype={tenant.archetype}
        tagline={localizedTagline}
        address={tenant.address}
        city={tenant.city}
        posterUrl={tenant.heroImagePoster}
        logoUrl={tenant.logoUrl}
        flankRightUrl={tenant.flankRightImage}
        googleMapsUrl={tenant.googleMapsUrl}
        accentColor={tenant.accentColor}
        videoWebmUrl={tenant.heroVideoWebm}
        videoMp4Url={tenant.heroVideoMp4}
        rating={tenant.googleMapsRating || 4.8}
        reviewCount={tenant.googleMapsReviewCount || 280}
        lang={lang}
        onOpenReservation={() => {
          setIsReservationOpen(true)
          trackConversion('click_reservation')
        }}
        onOpenMenu={() => {
          setIsMenuModalOpen(true)
          trackConversion('open_menu')
        }}
      />

      {/* ==============================================================================
         BLOQUE 2: PORTADA ASPIRACIONAL — LOS 4 PRODUCTOS INSIGNIA (0 PRECIOS EN HOME)
         Aplicación estricta de DEC-39 y Filtro Anti-Slop (Sin cajas pesadas ni bordes gruesos)
         ============================================================================== */}
      {isUrbanBrewery ? (
        <section className="relative bg-[#0A0B0E] text-[#F6F3EC] py-24 sm:py-32 px-6 md:px-12 overflow-hidden">
          {/* Halo cálido ámbar de fondo */}
          <div
            aria-hidden="true"
            className="absolute top-24 left-1/2 -translate-x-1/2 w-[720px] h-[360px] rounded-full bg-[#F59E0B]/8 blur-[140px] pointer-events-none"
          />

          <div className="relative z-10 max-w-6xl mx-auto">
            {/* Encabezado Editorial Cervecería */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-20">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 mb-3">
                  <Beer className="w-4 h-4 text-[#F59E0B]" />
                  <span className="text-xs uppercase tracking-[0.24em] text-[#F59E0B] font-bold">
                    {t.signatureDishBadge}
                  </span>
                </div>
                <h2
                  className="text-3xl sm:text-5xl md:text-6xl uppercase text-white leading-[1.04] tracking-tight"
                  style={{ fontFamily: "'Anton', 'Sora', sans-serif" }}
                >
                  {t.signatureSectionTitleBrewery}
                </h2>
                <p className="mt-4 text-white/70 text-sm sm:text-base leading-relaxed">
                  {t.signatureSectionSubtitleBrewery}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 self-start md:self-auto">
                <button
                  onClick={() => {
                    setIsMenuModalOpen(true)
                    trackConversion('open_menu')
                  }}
                  className="px-7 py-4 rounded-full bg-[#F59E0B] hover:bg-[#D97706] text-[#0A0B0E] text-xs sm:text-sm font-extrabold uppercase tracking-wider transition-all shadow-xl shadow-[#F59E0B]/20 flex items-center gap-2"
                >
                  <span>{t.openFullMenuBtn}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Composición Orgánica de los 4 Productos Insignia (Filtro Anti-Slop: 0 bordes duros, 0 precios en Home) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-14 lg:gap-16">
              {signatureDishes.map((dish, idx) => (
                <article
                  key={dish.id}
                  onClick={() => {
                    setIsMenuModalOpen(true)
                    trackConversion('open_menu')
                  }}
                  className={`group cursor-pointer flex flex-col sm:flex-row items-center gap-7 sm:gap-8 ${
                    idx % 2 === 1 ? 'md:mt-12' : ''
                  }`}
                >
                  {/* Fotografía Circular Orgánica con Sombra de Contacto Realista */}
                  <div className="relative w-52 h-52 sm:w-56 sm:h-56 flex-shrink-0">
                    <div
                      aria-hidden="true"
                      className="absolute inset-4 rounded-full bg-[#F59E0B]/20 blur-2xl transform translate-y-6 scale-90 group-hover:bg-[#F59E0B]/35 transition-all duration-500 pointer-events-none"
                    />
                    <div className="relative w-full h-full rounded-full overflow-hidden shadow-[0_28px_50px_rgba(0,0,0,0.85)] transition-transform duration-700 group-hover:scale-[1.04]">
                      <Image
                        src={dish.image}
                        alt={getDishName(dish)}
                        fill
                        sizes="(max-width: 640px) 220px, 240px"
                        className="object-cover"
                      />
                    </div>
                  </div>

                  {/* Información Sensorial Sin Precio en Portada */}
                  <div className="flex-1 text-center sm:text-left space-y-3">
                    <span className="text-[11px] uppercase tracking-[0.2em] text-[#F59E0B] font-bold block">
                      {getDishCat(dish)}
                    </span>
                    <h3
                      className="text-2xl sm:text-3xl text-white uppercase tracking-tight group-hover:text-[#F59E0B] transition-colors"
                      style={{ fontFamily: "'Anton', 'Sora', sans-serif" }}
                    >
                      {getDishName(dish)}
                    </h3>
                    <p className="text-sm text-white/70 leading-relaxed">
                      {getDishDesc(dish)}
                    </p>

                    {/* Formatos de servicio disponibles (Sin mostrar importe en portada) */}
                    {dish.variants && dish.variants.length > 0 && (
                      <div className="pt-1 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                        {dish.variants.map((v, vIdx) => (
                          <span
                            key={vIdx}
                            className="text-[11px] text-white/80 bg-white/[0.06] px-3 py-1 rounded-full font-medium"
                          >
                            {lang === 'gl'
                              ? v.name_gl || v.name
                              : lang === 'en'
                              ? v.name_en || v.name
                              : v.name}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="pt-1">
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#F59E0B] group-hover:translate-x-1 transition-transform">
                        {t.seePricesInMenu}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* Barra de Confianza y Enlace Directo a la Carta Viva (/p/bar-jaratusas) */}
            <div className="mt-20 pt-10 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-white/65">
              <div className="flex flex-wrap items-center justify-center gap-6">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-[#F59E0B]" />
                  <span>{t.sustainableFishing}</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>{t.fairPricing}</span>
                </div>
              </div>

              {tenant.qrMenuUrl && (
                <Link
                  href={tenant.qrMenuUrl}
                  className="inline-flex items-center gap-2 text-xs font-bold text-[#F59E0B] hover:underline"
                >
                  <span>{t.openQrMenuPageBtn}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          </div>
        </section>
      ) : (
        <section className="relative bg-[#F6F3EC] text-[#141311] py-24 sm:py-32 px-6 md:px-12 overflow-hidden">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            <div className="lg:col-span-7 flex justify-center">
              <div className="relative w-[280px] h-[280px] sm:w-[380px] sm:h-[380px] md:w-[440px] md:h-[440px]">
                <div className="absolute inset-4 rounded-full bg-[#141311]/25 blur-3xl transform translate-y-12 scale-90 pointer-events-none" />
                <div
                  onClick={() => {
                    setIsMenuModalOpen(true)
                    trackConversion('open_menu')
                  }}
                  className="relative w-full h-full rounded-full overflow-hidden p-2 shadow-[0_38px_42px_rgba(20,19,17,0.22)] transition-transform duration-700 hover:scale-[1.02] cursor-pointer"
                >
                  <Image
                    src={signatureDishes[0].image}
                    alt={getDishName(signatureDishes[0])}
                    fill
                    className="object-cover rounded-full"
                  />
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 space-y-6">
              <div className="inline-flex items-center gap-2">
                <Flame className="w-4 h-4 text-[#C85A32]" />
                <span className="text-xs uppercase tracking-[0.24em] text-[#C85A32] font-bold">
                  {t.signatureDishBadge}
                </span>
              </div>

              <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl leading-[1.12] text-[#141311] font-bold">
                {getDishName(signatureDishes[0])}
              </h2>

              <p className="text-[#141311]/75 text-base sm:text-lg leading-relaxed">
                {getDishDesc(signatureDishes[0])}
              </p>

              <div className="pt-2 flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => {
                    setIsMenuModalOpen(true)
                    trackConversion('open_menu')
                  }}
                  className="px-8 py-4 rounded-full bg-[#141311] text-[#F6F3EC] text-sm font-semibold tracking-wide hover:bg-[#C85A32] transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  <span>{t.openFullMenuBtn}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              <div className="pt-4 border-t border-[#141311]/10 flex items-center gap-6 text-xs text-[#141311]/60">
                <div className="flex items-center gap-1.5">
                  <Fish className="w-4 h-4 text-[#C85A32]" />
                  <span>{t.sustainableFishing}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>{t.fairPricing}</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ==============================================================================
         BLOQUE 3: LA ESENCIA / EL LOCAL (SOPORTALES HISTÓRICOS & CANTERÍA DE PIEDRA)
         ============================================================================== */}
      <CanvasScrollytelling
        dishesFallback={tenant.dishes}
        restaurantName={tenant.name}
        archetype={tenant.archetype}
        historyTitle={localizedHistoryTitle}
        historyText={localizedHistoryText}
        flankLeftImage={tenant.flankLeftImage}
        flankRightImage={tenant.flankRightImage}
        lang={lang}
      />

      {/* ==============================================================================
         BLOQUE 4: SELECTOR DE ESPACIO Y LUZ AMBIENTAL (13:30h VERMÚ vs 21:30h NOCHE)
         ============================================================================== */}
      {tenant.ambiences.length > 0 && (
        <section
          id="ambientes"
          className={`py-24 px-6 md:px-12 ${
            isUrbanBrewery
              ? 'bg-[#0E1015] text-[#F6F3EC]'
              : 'bg-[#F6F3EC] text-[#141311] border-t border-[#141311]/5'
          }`}
        >
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
              <div>
                <div className="inline-flex items-center gap-2 mb-2">
                  <Compass
                    className={`w-4 h-4 ${isUrbanBrewery ? 'text-[#F59E0B]' : 'text-[#C85A32]'}`}
                  />
                  <span
                    className={`text-xs uppercase tracking-[0.26em] font-bold ${
                      isUrbanBrewery ? 'text-[#F59E0B]' : 'text-[#C85A32]'
                    }`}
                  >
                    {t.spaces}
                  </span>
                </div>
                <h2
                  className={`text-3xl sm:text-5xl tracking-tight ${
                    isUrbanBrewery ? 'uppercase font-black text-white' : 'font-serif font-bold'
                  }`}
                  style={isUrbanBrewery ? { fontFamily: "'Anton', 'Sora', sans-serif" } : undefined}
                >
                  {t.ambienceTitle}
                </h2>
                <p
                  className={`text-sm sm:text-base mt-2 max-w-xl ${
                    isUrbanBrewery ? 'text-white/70' : 'text-[#141311]/70'
                  }`}
                >
                  {t.ambienceSubtitle}
                </p>
              </div>

              {/* Switch Interactivo 13:30h vs 21:30h */}
              <div
                className={`inline-flex p-1.5 rounded-full self-start md:self-auto ${
                  isUrbanBrewery ? 'bg-white/5' : 'bg-[#141311]/5 border border-[#141311]/10'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setLightMode('day')}
                  className={`px-5 py-2.5 rounded-full text-xs font-bold flex items-center gap-2 transition-all ${
                    lightMode === 'day'
                      ? isUrbanBrewery
                        ? 'bg-[#F59E0B] text-[#0A0B0E] shadow-md'
                        : 'bg-[#141311] text-[#F6F3EC] shadow-md'
                      : isUrbanBrewery
                      ? 'text-white/70 hover:text-white'
                      : 'text-[#141311]/70 hover:text-[#141311]'
                  }`}
                >
                  <Sun className="w-4 h-4" />
                  <span>{t.lunchTime}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setLightMode('night')}
                  className={`px-5 py-2.5 rounded-full text-xs font-bold flex items-center gap-2 transition-all ${
                    lightMode === 'night'
                      ? isUrbanBrewery
                        ? 'bg-[#F59E0B] text-[#0A0B0E] shadow-md'
                        : 'bg-[#141311] text-[#F6F3EC] shadow-md'
                      : isUrbanBrewery
                      ? 'text-white/70 hover:text-white'
                      : 'text-[#141311]/70 hover:text-[#141311]'
                  }`}
                >
                  <Moon className="w-4 h-4" />
                  <span>{t.dinnerTime}</span>
                </button>
              </div>
            </div>

            {/* Grid de Espacios (Filtro Anti-Slop: sin bordes pesados) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {tenant.ambiences.map((amb) => {
                const isSelected = activeAmbienceId === amb.id
                const currentImage = lightMode === 'day' ? amb.imageDay : amb.imageNight
                const lightingNote = getAmbLighting(amb, lightMode)

                return (
                  <div
                    key={amb.id}
                    onClick={() => setActiveAmbienceId(amb.id)}
                    className={`group cursor-pointer rounded-3xl overflow-hidden transition-all duration-300 flex flex-col justify-between ${
                      isUrbanBrewery
                        ? isSelected
                          ? 'bg-[#151821] shadow-[0_28px_60px_rgba(0,0,0,0.65)] ring-1 ring-[#F59E0B]/50'
                          : 'bg-[#12151C] hover:bg-[#161A22] shadow-xl'
                        : isSelected
                        ? 'bg-white border border-[#C85A32] shadow-2xl ring-2 ring-[#C85A32]/30'
                        : 'bg-[#EDE8DE]/60 border border-[#141311]/10 hover:bg-white'
                    }`}
                  >
                    <div>
                      <div className="relative h-72 w-full overflow-hidden">
                        <Image
                          src={currentImage}
                          alt={getAmbName(amb)}
                          fill
                          sizes="(max-width: 768px) 100vw, 50vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                        <div className="absolute top-4 left-4 bg-black/75 backdrop-blur-md text-[#F6F3EC] text-[10px] uppercase font-bold tracking-wider px-3.5 py-1.5 rounded-full">
                          {getAmbBadge(amb)}
                        </div>
                      </div>

                      <div className="p-7 space-y-3">
                        <div>
                          <h3
                            className={`text-2xl font-bold transition ${
                              isUrbanBrewery
                                ? 'text-white group-hover:text-[#F59E0B]'
                                : 'font-serif text-[#141311] group-hover:text-[#C85A32]'
                            }`}
                          >
                            {getAmbName(amb)}
                          </h3>
                          <span
                            className={`text-xs font-medium ${
                              isUrbanBrewery ? 'text-white/55' : 'text-[#141311]/60'
                            }`}
                          >
                            {getAmbSubtitle(amb)}
                          </span>
                        </div>

                        <p
                          className={`text-sm leading-relaxed ${
                            isUrbanBrewery ? 'text-white/75' : 'text-[#141311]/75'
                          }`}
                        >
                          {getAmbDesc(amb)}
                        </p>

                        <div
                          className={`p-3.5 rounded-2xl text-xs flex items-center gap-2.5 ${
                            isUrbanBrewery
                              ? 'bg-black/35 text-[#FBBF24]'
                              : 'bg-[#F6F3EC] text-[#141311]/75'
                          }`}
                        >
                          {lightMode === 'day' ? (
                            <Sun className="w-4 h-4 text-amber-400 flex-shrink-0" />
                          ) : (
                            <Moon className="w-4 h-4 text-amber-400 flex-shrink-0" />
                          )}
                          <span>{lightingNote}</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-7 pt-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleOpenReservationWithZone(getAmbName(amb))
                        }}
                        className={`w-full py-3.5 rounded-2xl text-xs font-bold tracking-wider uppercase flex items-center justify-center gap-2 transition-all ${
                          isUrbanBrewery
                            ? 'bg-white/10 hover:bg-[#F59E0B] text-white hover:text-[#0A0B0E]'
                            : isSelected
                            ? 'bg-[#C85A32] text-white shadow-md'
                            : 'bg-[#141311]/5 text-[#141311] hover:bg-[#141311] hover:text-white'
                        }`}
                      >
                        <span>{t.selectForBooking}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* ==============================================================================
         BLOQUE 5: PRUEBA SOCIAL REAL (GOOGLE MAPS ⭐ + 3 RESEÑAS VERIFICADAS)
         ============================================================================== */}
      {tenant.reviews && tenant.reviews.length > 0 && (
        <section
          className={`py-24 px-6 md:px-12 ${
            isUrbanBrewery ? 'bg-[#0A0B0E] text-[#F6F3EC]' : 'bg-[#EDE8DE]/50 text-[#141311]'
          }`}
        >
          <div className="max-w-6xl mx-auto">
            <div className="text-center max-w-xl mx-auto mb-14">
              <div className="inline-flex items-center gap-1.5 text-amber-400 mb-2">
                <Star className="w-5 h-5 fill-current" />
                <span className="font-bold text-sm">
                  {tenant.googleMapsRating || 4.8} / 5.0
                </span>
                <span className="text-xs opacity-65">
                  ({tenant.googleMapsReviewCount || 342} Google Maps)
                </span>
              </div>
              <h2
                className={`text-3xl sm:text-5xl tracking-tight ${
                  isUrbanBrewery ? 'uppercase font-black text-white' : 'font-serif font-bold'
                }`}
                style={isUrbanBrewery ? { fontFamily: "'Anton', 'Sora', sans-serif" } : undefined}
              >
                {t.reviewsTitle}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {tenant.reviews.slice(0, 3).map((rev, idx) => {
                const reviewText =
                  lang === 'gl'
                    ? rev.text_gl || rev.text
                    : lang === 'en'
                    ? rev.text_en || rev.text
                    : rev.text

                return (
                  <div
                    key={idx}
                    className={`p-8 rounded-3xl flex flex-col justify-between space-y-5 ${
                      isUrbanBrewery
                        ? 'bg-[#12151C] shadow-[0_20px_40px_rgba(0,0,0,0.45)]'
                        : 'bg-white border border-[#141311]/10 shadow-sm'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-[#FBBF24]">
                          {Array.from({ length: rev.rating }).map((_, i) => (
                            <Star key={i} className="w-4 h-4 fill-current" />
                          ))}
                        </div>
                        <span className="text-[11px] opacity-50 uppercase tracking-wider font-semibold">
                          Google · {rev.date}
                        </span>
                      </div>
                      <p className="text-sm sm:text-base opacity-90 leading-relaxed">
                        “{reviewText}”
                      </p>
                    </div>

                    <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs">
                      <span className="font-bold">{rev.author}</span>
                      <span className="text-emerald-400 font-medium flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> {t.verifiedVisit}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>

            {tenant.googleMapsUrl && (
              <div className="text-center mt-10">
                <a
                  href={tenant.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackConversion('click_maps')}
                  className={`inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider hover:underline ${
                    isUrbanBrewery ? 'text-[#F59E0B]' : 'text-[#C85A32]'
                  }`}
                >
                  <span>{t.seeAllGoogleReviews}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ==============================================================================
         BLOQUE 6: HORARIOS EN VIVO, WIFI Y UBICACIÓN EN EL CASCO HISTÓRICO
         ============================================================================== */}
      <section
        id="horarios"
        className={`py-24 px-6 md:px-12 ${
          isUrbanBrewery
            ? 'bg-[#0E1015] text-[#F6F3EC]'
            : 'bg-[#F6F3EC] text-[#141311] border-t border-[#141311]/10'
        }`}
      >
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-6 space-y-6">
            <span
              className={`text-xs uppercase tracking-[0.26em] font-bold block ${
                isUrbanBrewery ? 'text-[#F59E0B]' : 'text-[#C85A32]'
              }`}
            >
              {t.whereToFindUs}
            </span>
            <h2
              className={`text-3xl sm:text-5xl tracking-tight ${
                isUrbanBrewery ? 'uppercase font-black text-white' : 'font-serif font-bold'
              }`}
              style={isUrbanBrewery ? { fontFamily: "'Anton', 'Sora', sans-serif" } : undefined}
            >
              {t.scheduleAndLocation}
            </h2>

            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-3.5 text-sm">
                <MapPin
                  className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                    isUrbanBrewery ? 'text-[#F59E0B]' : 'text-[#C85A32]'
                  }`}
                />
                <div>
                  <p className="font-bold text-base">{tenant.address}</p>
                  <p className="text-xs opacity-65">
                    {tenant.postalCode} {tenant.city} (Casco Histórico)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3.5 text-sm">
                <Phone
                  className={`w-5 h-5 flex-shrink-0 ${
                    isUrbanBrewery ? 'text-[#F59E0B]' : 'text-[#C85A32]'
                  }`}
                />
                <a
                  href={`tel:${tenant.phone.replace(/\s+/g, '')}`}
                  onClick={() => trackConversion('click_call')}
                  className="font-bold text-base hover:underline"
                >
                  {tenant.phone}
                </a>
              </div>

              {tenant.wifiSsid && (
                <div className="flex items-center gap-3.5 text-sm">
                  <Wifi className="w-5 h-5 text-[#F59E0B] flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-xs uppercase tracking-wider text-[#F59E0B]">
                      {t.wifiCourtesy}
                    </p>
                    <p className="text-xs opacity-80">
                      Red: <strong>{tenant.wifiSsid}</strong> · Clave:{' '}
                      <code className="px-1.5 py-0.5 rounded bg-white/10">{tenant.wifiPassword}</code>
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 flex flex-wrap gap-3.5">
              {tenant.googleMapsUrl && (
                <a
                  href={tenant.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackConversion('click_maps')}
                  className={`px-6 py-3.5 rounded-full text-xs font-extrabold tracking-wider uppercase transition flex items-center gap-2 ${
                    isUrbanBrewery
                      ? 'bg-[#F59E0B] text-[#0A0B0E] hover:bg-[#D97706]'
                      : 'bg-[#141311] text-[#F6F3EC] hover:bg-[#C85A32]'
                  }`}
                >
                  <MapPin className="w-4 h-4" />
                  <span>{t.howToGet}</span>
                </a>
              )}
              <button
                onClick={() => {
                  setIsReservationOpen(true)
                  trackConversion('click_reservation')
                }}
                className={`px-6 py-3.5 rounded-full text-xs font-bold tracking-wider uppercase transition flex items-center gap-2 ${
                  isUrbanBrewery
                    ? 'bg-white/10 text-white hover:bg-white/20'
                    : 'bg-[#C85A32] text-white hover:bg-[#b04d28]'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>{t.groupsAndBooking}</span>
              </button>
            </div>
          </div>

          {/* Tabla de Horarios Semanales */}
          <div
            className={`lg:col-span-6 p-6 sm:p-8 rounded-3xl space-y-4 ${
              isUrbanBrewery
                ? 'bg-[#12151C] shadow-[0_24px_48px_rgba(0,0,0,0.5)]'
                : 'bg-white border border-[#141311]/10 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <span className="text-xs uppercase tracking-wider font-bold opacity-80 flex items-center gap-2">
                <Clock className={`w-4 h-4 ${isUrbanBrewery ? 'text-[#F59E0B]' : 'text-[#C85A32]'}`} />
                <span>{t.weeklyService}</span>
              </span>
              <span
                className={`text-xs px-3 py-1 rounded-full font-bold ${
                  openingStatus.isOpen
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-rose-500/20 text-rose-300'
                }`}
              >
                {trafficLightText}
              </span>
            </div>

            <div className="divide-y divide-white/5 text-xs sm:text-sm">
              {[1, 2, 3, 4, 5, 6, 0].map((dayIdx) => {
                const daySchedules = tenant.openingHours.filter((s) => s.dayOfWeek === dayIdx)
                const isToday = dayIdx === todayDayOfWeek

                return (
                  <div
                    key={dayIdx}
                    className={`py-3 flex items-center justify-between ${
                      isToday
                        ? isUrbanBrewery
                          ? 'font-bold text-[#F59E0B]'
                          : 'font-bold text-[#C85A32]'
                        : 'opacity-80'
                    }`}
                  >
                    <span>
                      {DAY_NAMES[dayIdx]} {isToday && t.today}
                    </span>
                    <span className="tabular-nums font-medium">
                      {daySchedules.length > 0
                        ? daySchedules.map((s) => `${s.open} – ${s.close}h`).join(' · ')
                        : t.closedShift}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ==============================================================================
         BLOQUE 7: PREGUNTAS FRECUENTES (FAQS TRILINGÜES)
         ============================================================================== */}
      <section
        className={`py-20 px-6 md:px-12 ${
          isUrbanBrewery ? 'bg-[#0A0B0E] text-[#F6F3EC]' : 'bg-[#EDE8DE]/40 text-[#141311]'
        }`}
      >
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="text-center mb-10">
            <h3
              className={`text-2xl sm:text-4xl ${
                isUrbanBrewery ? 'uppercase font-black text-white' : 'font-serif font-bold'
              }`}
              style={isUrbanBrewery ? { fontFamily: "'Anton', 'Sora', sans-serif" } : undefined}
            >
              {t.faqsTitle}
            </h3>
          </div>

          {t.faqs.map((faq, idx) => (
            <div
              key={idx}
              className={`rounded-2xl overflow-hidden ${
                isUrbanBrewery ? 'bg-[#12151C]' : 'bg-white border border-[#141311]/10 shadow-sm'
              }`}
            >
              <button
                type="button"
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full p-5 text-left font-bold text-sm sm:text-base flex items-center justify-between gap-4"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  className={`w-5 h-5 flex-shrink-0 transition-transform ${
                    isUrbanBrewery ? 'text-[#F59E0B]' : 'text-[#C85A32]'
                  } ${openFaq === idx ? 'rotate-180' : ''}`}
                />
              </button>
              {openFaq === idx && (
                <div className="p-5 pt-0 text-xs sm:text-sm opacity-75 leading-relaxed">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ==============================================================================
         FOOTER INSTITUCIONAL
         ============================================================================== */}
      <footer className="bg-[#07080A] text-[#E6DFD3] py-16 px-6 md:px-12 border-t border-white/10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
          <div className="flex items-center gap-3.5">
            {tenant.logoUrl && (
              <div className="w-12 h-12 rounded-full bg-[#0A0B0E] p-1 ring-1 ring-[#F59E0B]/40 flex items-center justify-center">
                <Image
                  src={tenant.logoUrl}
                  alt={tenant.name}
                  width={44}
                  height={44}
                  className="w-full h-full object-contain rounded-full"
                />
              </div>
            )}
            <div>
              <span className="text-xl font-bold tracking-tight text-[#F6F3EC] block">
                {tenant.name}
              </span>
              <p className="text-xs text-[#E6DFD3]/60 max-w-sm">
                {localizedTagline}
              </p>
            </div>
          </div>

          <div className="text-xs text-[#E6DFD3]/50 space-y-1">
            <p>
              {tenant.address}, {tenant.postalCode} {tenant.city}
            </p>
            <p>
              © {new Date().getFullYear()} {tenant.name}.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-[#E6DFD3]/60">
            <span>Powered by</span>
            <span className="font-extrabold tracking-widest text-[#F59E0B]">FLUXO</span>
          </div>
        </div>
      </footer>

      {/* ==============================================================================
         BARRA FIJA EN LA ZONA DEL PULGAR (MOBILE STICKY ACTION BAR)
         ============================================================================== */}
      <MobileStickyActionBar
        archetype={tenant.archetype}
        phone={tenant.phone}
        googleMapsUrl={tenant.googleMapsUrl}
        isOpenNow={openingStatus.isOpen}
        lang={lang}
        onOpenReservation={() => {
          setIsReservationOpen(true)
          trackConversion('click_reservation')
        }}
        onOpenMenu={() => {
          setIsMenuModalOpen(true)
          trackConversion('open_menu')
        }}
      />

      {/* ==============================================================================
         DRAWER DE RESERVA DIRECTA A WHATSAPP
         ============================================================================== */}
      <WhatsAppReservationDrawer
        restaurantName={tenant.name}
        whatsappNumber={tenant.whatsappNumber}
        ambiences={tenant.ambiences}
        isOpen={isReservationOpen}
        onClose={() => setIsReservationOpen(false)}
        initialZone={selectedZone}
      />

      {/* ==============================================================================
         MODAL DE CARTA FIJA DIGITAL (TRANSPARENCIA TOTAL A 1 CLIC: PRECIOS + VARIANTES + 14 ALÉRGENOS)
         ============================================================================== */}
      {isMenuModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
        >
          <div
            className={`w-full max-w-5xl max-h-[92vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden ${
              isUrbanBrewery
                ? 'bg-[#0E1015] text-[#F6F3EC] ring-1 ring-white/15'
                : 'bg-[#F6F3EC] text-[#141311] border border-[#141311]/10'
            }`}
          >
            {/* Cabecera del Modal */}
            <div
              className={`p-5 sm:p-6 border-b flex items-center justify-between ${
                isUrbanBrewery
                  ? 'bg-[#0A0B0E] border-white/10'
                  : 'bg-white border-[#141311]/10'
              }`}
            >
              <div className="flex items-center gap-3">
                {tenant.logoUrl && (
                  <Image
                    src={tenant.logoUrl}
                    alt={tenant.name}
                    width={42}
                    height={42}
                    className="w-10 h-10 object-contain rounded-full"
                  />
                )}
                <div>
                  <span
                    className={`text-[10px] uppercase tracking-[0.22em] font-bold block ${
                      isUrbanBrewery ? 'text-[#F59E0B]' : 'text-[#C85A32]'
                    }`}
                  >
                    {t.digitalMenuTitle}
                  </span>
                  <h3 className="text-xl sm:text-2xl font-bold">
                    {tenant.name} · {t.menuAndPrices}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                aria-label="Cerrar carta"
                onClick={() => setIsMenuModalOpen(false)}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-[#F59E0B] hover:text-[#0A0B0E] transition flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Buscador y Categorías */}
            <div
              className={`p-4 sm:p-6 border-b space-y-4 ${
                isUrbanBrewery
                  ? 'bg-[#12151C] border-white/10'
                  : 'bg-[#EDE8DE]/40 border-[#141311]/5'
              }`}
            >
              <div className="relative">
                <Search className="w-4 h-4 opacity-50 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={t.searchPlaceholder}
                  value={menuSearch}
                  onChange={(e) => setMenuSearch(e.target.value)}
                  className={`w-full pl-11 pr-4 py-3 rounded-2xl text-sm outline-none transition ${
                    isUrbanBrewery
                      ? 'bg-[#0A0B0E] text-white placeholder-white/40 focus:ring-1 focus:ring-[#F59E0B]'
                      : 'bg-white border border-[#141311]/10 focus:border-[#C85A32]'
                  }`}
                />
              </div>

              {/* Píldoras de Categorías */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {categories.map((cat) => (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => setMenuFilterCategory(cat.key)}
                    className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition ${
                      menuFilterCategory === cat.key
                        ? isUrbanBrewery
                          ? 'bg-[#F59E0B] text-[#0A0B0E]'
                          : 'bg-[#141311] text-[#F6F3EC]'
                        : isUrbanBrewery
                        ? 'bg-white/5 text-white/75 hover:bg-white/10'
                        : 'bg-white text-[#141311]/70 hover:bg-[#141311]/10'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Lista de Productos con Precios Reales, Variantes (Caña/Copa/Xarra/Ración) y 14 Alérgenos */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredDishes.map((dish) => (
                  <div
                    key={dish.id}
                    onClick={() => setSelectedDishDetail(dish)}
                    className={`p-4 rounded-2xl transition cursor-pointer flex gap-4 items-start ${
                      isUrbanBrewery
                        ? 'bg-[#151922] hover:bg-[#1B202C]'
                        : 'bg-white border border-[#141311]/8 hover:border-[#C85A32]/40 shadow-sm'
                    }`}
                  >
                    <div className="relative w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0 bg-black/20">
                      <Image
                        src={dish.image}
                        alt={getDishName(dish)}
                        fill
                        sizes="96px"
                        className="object-cover"
                      />
                    </div>

                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="font-bold text-sm sm:text-base leading-snug">
                          {getDishName(dish)}
                        </h4>
                        <span
                          className={`font-extrabold text-sm flex-shrink-0 tabular-nums ${
                            isUrbanBrewery ? 'text-[#F59E0B]' : 'text-[#C85A32]'
                          }`}
                        >
                          {dish.isMarketPrice || (dish.isDailyMarket && dish.price <= 0)
                            ? t.marketPriceTag
                            : `${dish.price.toFixed(2)} €`}
                        </span>
                      </div>

                      <p className="text-xs opacity-70 line-clamp-2 leading-relaxed">
                        {getDishDesc(dish)}
                      </p>

                      {/* Desglose de Variantes con Precio Exacto */}
                      {dish.variants && dish.variants.length > 0 && (
                        <div className="pt-1 flex flex-wrap gap-1.5">
                          {dish.variants.map((v, i) => (
                            <span
                              key={i}
                              className={`text-[11px] px-2.5 py-1 rounded-lg font-medium flex items-center gap-1.5 ${
                                isUrbanBrewery
                                  ? 'bg-[#0A0B0E] text-white/90'
                                  : 'bg-[#F6F3EC] text-[#141311]'
                              }`}
                            >
                              <span className="opacity-75">
                                {lang === 'gl'
                                  ? v.name_gl || v.name
                                  : lang === 'en'
                                  ? v.name_en || v.name
                                  : v.name}
                              </span>
                              <strong className="text-[#F59E0B] tabular-nums">
                                {v.price.toFixed(2)}€
                              </strong>
                            </span>
                          ))}
                        </div>
                      )}

                      {/* 14 Alérgenos */}
                      {dish.allergens && dish.allergens.length > 0 && (
                        <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                          {dish.allergens.map((alg) => (
                            <span
                              key={alg}
                              className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 font-semibold"
                            >
                              ⚠️ {alg}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {filteredDishes.length === 0 && (
                <div className="text-center py-12 opacity-60 text-sm">
                  {t.noDishesFound}
                </div>
              )}
            </div>

            {/* Pie del modal */}
            <div
              className={`p-4 border-t flex flex-col sm:flex-row items-center justify-between text-xs gap-3 ${
                isUrbanBrewery
                  ? 'bg-[#0A0B0E] border-white/10 text-white/70'
                  : 'bg-white border-[#141311]/10 text-[#141311]/60'
              }`}
            >
              <span>{t.vatIncludedNote}</span>
              <div className="flex items-center gap-4">
                {tenant.qrMenuUrl && (
                  <Link
                    href={tenant.qrMenuUrl}
                    className="text-[#F59E0B] font-bold hover:underline flex items-center gap-1"
                  >
                    <span>{t.openQrMenuPageBtn}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ficha Técnica de Plato Individual */}
      {selectedDishDetail && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
        >
          <div
            className={`w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden ${
              isUrbanBrewery
                ? 'bg-[#12151C] text-white ring-1 ring-white/15'
                : 'bg-[#F6F3EC] text-[#141311]'
            }`}
          >
            <div className="relative h-64 w-full">
              <Image
                src={selectedDishDetail.image}
                alt={getDishName(selectedDishDetail)}
                fill
                className="object-cover"
              />
              <button
                type="button"
                onClick={() => setSelectedDishDetail(null)}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-start gap-4">
                <h3 className="text-2xl font-bold">{getDishName(selectedDishDetail)}</h3>
                <span className="text-2xl font-black text-[#F59E0B] flex-shrink-0 tabular-nums">
                  {selectedDishDetail.isMarketPrice
                    ? t.marketPriceTag
                    : `${selectedDishDetail.price.toFixed(2)} €`}
                </span>
              </div>
              <p className="text-sm opacity-80 leading-relaxed">
                {getDishDesc(selectedDishDetail)}
              </p>

              {selectedDishDetail.variants && selectedDishDetail.variants.length > 0 && (
                <div className="space-y-2 pt-2">
                  <span className="text-xs uppercase tracking-wider opacity-60 font-bold block">
                    {t.availableFormats}:
                  </span>
                  <div className="grid grid-cols-1 gap-2">
                    {selectedDishDetail.variants.map((v, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-black/30 text-sm"
                      >
                        <span>
                          {lang === 'gl'
                            ? v.name_gl || v.name
                            : lang === 'en'
                            ? v.name_en || v.name
                            : v.name}
                        </span>
                        <strong className="text-[#F59E0B] tabular-nums">
                          {v.price.toFixed(2)} €
                        </strong>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedDishDetail.allergens && selectedDishDetail.allergens.length > 0 && (
                <div>
                  <span className="text-xs uppercase tracking-wider opacity-60 font-bold block mb-1.5">
                    {t.allergensDeclared}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {selectedDishDetail.allergens.map((alg) => (
                      <span
                        key={alg}
                        className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300"
                      >
                        ⚠️ {alg}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <button
                type="button"
                onClick={() => setSelectedDishDetail(null)}
                className="w-full py-3.5 rounded-2xl bg-[#F59E0B] text-[#0A0B0E] font-extrabold text-xs uppercase tracking-wider hover:bg-[#D97706] transition"
              >
                {t.closeDetail}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
