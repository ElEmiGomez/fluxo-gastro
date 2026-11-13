'use client'

import React, { useState, useEffect, useMemo, useRef } from 'react'
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
  AlertTriangle,
  Wifi,
  ExternalLink,
  Beer,
  MessageCircle,
  Users,
} from 'lucide-react'
import type {
  GastronomicTenantConfig,
  DishShowcaseItem,
  SpaceAmbienceItem,
  WebLanguage,
} from '@/types/gastronomic-web.types'
import { HeroCinematic } from '@/components/web/HeroCinematic'
import { CanvasScrollytelling } from '@/components/web/CanvasScrollytelling'
import { LiveOpeningBadge } from '@/components/web/LiveOpeningBadge'
import { MobileStickyActionBar } from '@/components/web/MobileStickyActionBar'
import { WhatsAppReservationDrawer } from '@/components/web/WhatsAppReservationDrawer'
import { getOpeningStatus } from '@/lib/opening-hours-calculator'

// ==============================================================================
// HELPER DE REVELADO GPU CON INTERSECTION OBSERVER (NUNCA OCULTA EL HERO)
// ==============================================================================
interface ScrollRevealProps {
  children: React.ReactNode
  delayMs?: number
  className?: string
}

function ScrollReveal({ children, delayMs = 0, className = '' }: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) {
      setIsVisible(true)
      return
    }

    if (
      typeof window === 'undefined' ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      !('IntersectionObserver' in window)
    ) {
      setIsVisible(true)
      return
    }

    const rect = el.getBoundingClientRect()
    if (rect.top < window.innerHeight * 0.96) {
      setIsVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setIsVisible(true)
            observer.disconnect()
            break
          }
        }
      },
      { threshold: 0.04, rootMargin: '80px 0px -20px 0px' }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translate3d(0, 0, 0)' : 'translate3d(0, 18px, 0)',
        transition: `opacity 560ms cubic-bezier(0.22, 1, 0.36, 1) ${delayMs}ms, transform 560ms cubic-bezier(0.22, 1, 0.36, 1) ${delayMs}ms`,
        willChange: isVisible ? 'auto' : 'opacity, transform',
      }}
    >
      {children}
    </div>
  )
}

// ==============================================================================
// DICCIONARIOS TRILINGÜES (ES | GAL | EN)
// ==============================================================================
const I18N = {
  es: {
    menuAndPrices: 'Ver Carta y Precios',
    navMenuShort: 'Carta y Precios',
    spaces: 'Espacios del Local',
    navSpacesShort: 'Espacios',
    selectedZoneLabel: 'Zona Seleccionada',
    scheduleAndLocation: 'Horarios & Ubicación',
    reviews: 'Opiniones',
    bookTable: 'Reservar',
    groupsAndBooking: 'Terraza / Grupos',
    requestTable: 'Solicitar Mesa',
    howToGet: 'Cómo Llegar',
    call: 'Llamar',
    signatureDishBadge: 'Imprescindibles de la Casa',
    signatureSectionTitleBrewery: 'Cerveza de Bodega, Vinos & Cocina Caliente',
    signatureSectionSubtitleBrewery:
      'Cuatro pilares que definen nuestra barra en la Rúa do Curro. Pulsa en cualquiera para consultar formatos y precios transparentes en la carta completa.',
    openFullMenuBtn: 'Ver Carta y Precios',
    openQrMenuPageBtn: 'Abrir Vista de Carta (/p/bar-jaratusas)',
    availableFormats: 'Formatos disponibles',
    seePricesInMenu: 'Ver precios y variantes →',
    sustainableFishing: 'Materia prima local y tirador de bodega',
    fairPricing: 'Precios transparentes con IVA en carta',
    ambienceTitle: 'Elige tu Espacio y tu Luz',
    ambienceSubtitle:
      'De la luz natural bajo los soportales de piedra al ambiente cálido de noche en salón y barra.',
    lunchTime: 'Mediodía · 13:30h',
    dinnerTime: 'Noche · 21:30h',
    selectForBooking: 'Solicitar Mesa en esta Zona',
    waBlockEyebrow: 'WhatsApp Directo · Sin Comisiones',
    waBlockTitle: 'Reserva tu mesa en Terraza o Salón / Consulta para grupos por WhatsApp',
    waBlockSubtitle:
      'Elige zona, número de personas y turno horario. Envía tu solicitud en un toque directamente por WhatsApp.',
    waZoneLabel: 'Zona preferida',
    waGroupsChip: 'Grupos',
    waGuestsLabel: 'Personas',
    waShiftLabel: 'Turno / Hora',
    waNameLabel: 'Tu nombre',
    waNamePlaceholder: 'Ej. Laura Pérez',
    waSendDirectBtn: 'Enviar Solicitud por WhatsApp',
    waOpenCalendarBtn: 'Elegir fecha y notas',
    waMsgIntro: 'Hola',
    waMsgBody: 'quisiera reservar / consultar disponibilidad:',
    waMsgZone: 'Zona',
    waMsgGuests: 'Personas',
    waMsgShift: 'Turno',
    waMsgName: 'Nombre',
    waMsgPending: 'A confirmar',
    reviewsTitle: 'Lo que Dicen Nuestros Clientes',
    verifiedVisit: 'Reseña Verificada en Google',
    seeAllGoogleReviews: 'Ver todas las opiniones en Google Maps',
    whereToFindUs: 'Dónde Encontrarnos',
    weeklyService: 'Horario Semanal en Vivo',
    today: '(Hoy)',
    closedShift: 'Cerrado por descanso',
    wifiCourtesy: 'WiFi Clientes en Local',
    wifiNetwork: 'Red',
    wifiPass: 'Clave',
    faqsTitle: 'Preguntas Frecuentes',
    digitalMenuTitle: 'Carta Fija Digital · Transparencia Total',
    searchPlaceholder: 'Buscar cerveza, vino, ración o alérgeno...',
    allCategories: 'Todos',
    marketPriceTag: '🌊 Precio según lonja',
    openNowKitchen: 'Abierto ahora · Cocina hasta',
    openNow: 'Abierto ahora',
    closedNow: 'Cerrado ahora',
    allergensDeclared: 'Alérgenos Declarados (Reglamento UE 1169/2011):',
    closeDetail: 'Cerrar Ficha',
    vatIncludedNote: 'Precios con IVA incluido. Tapa de cortesía con cada consumición.',
    noDishesFound: 'No se encontraron productos que coincidan con tu búsqueda.',
    faqs: [
      {
        q: '1. ¿Hace falta reservar para tomar cañas, vinos o picar algo?',
        a: 'No es necesario reservar para venir de cañas, vermú o tapeo en barra y terraza; funcionamos por rotación directa. Si sois un grupo grande para raciones en salón o terraza, podéis avisarnos por WhatsApp en 1 toque.',
      },
      {
        q: '2. ¿Todas las consumiciones incluyen tapa de cortesía?',
        a: 'Sí, fieles a la tradición de Noia, cada caña, vino o vermú sale acompañado de nuestra tapa de cocina recién hecha.',
      },
      {
        q: '3. ¿Cómo puedo consultar los 14 alérgenos y todas las variantes de precios?',
        a: 'Al pulsar en «Ver Carta y Precios» tienes el desglose íntegro de precios por caña, copa, xarra, media ración o ración completa, junto con los iconos oficiales de los 14 alérgenos.',
      },
    ],
  },
  gl: {
    menuAndPrices: 'Ver Carta e Prezos',
    navMenuShort: 'Carta e Prezos',
    spaces: 'Espazos do Local',
    navSpacesShort: 'Espazos',
    selectedZoneLabel: 'Zona Seleccionada',
    scheduleAndLocation: 'Horarios e Localización',
    reviews: 'Opinións',
    bookTable: 'Reservar',
    groupsAndBooking: 'Terraza / Grupos',
    requestTable: 'Solicitar Mesa',
    howToGet: 'Como Chegar',
    call: 'Chamar',
    signatureDishBadge: 'Imprescindibles da Casa',
    signatureSectionTitleBrewery: 'Cervexa de Adega, Viños e Cociña Quente',
    signatureSectionSubtitleBrewery:
      'Catro piares que definen a nosa barra na Rúa do Curro. Preme en calquera para consultar formatos e prezos transparentes na carta completa.',
    openFullMenuBtn: 'Ver Carta e Prezos',
    openQrMenuPageBtn: 'Abrir Vista de Carta (/p/bar-jaratusas)',
    availableFormats: 'Formatos dispoñibles',
    seePricesInMenu: 'Ver prezos e variantes →',
    sustainableFishing: 'Materia prima local e tirador de adega',
    fairPricing: 'Prezos transparentes con IVE na carta',
    ambienceTitle: 'Escolle o teu Espazo e a túa Luz',
    ambienceSubtitle:
      'Da luz natural baixo os soportais de pedra ao ambiente cálido de noite no salón e na barra.',
    lunchTime: 'Mediodía · 13:30h',
    dinnerTime: 'Noite · 21:30h',
    selectForBooking: 'Solicitar Mesa nesta Zona',
    waBlockEyebrow: 'WhatsApp Directo · Sen Comisións',
    waBlockTitle: 'Reserva a túa mesa en Terraza ou Salón / Consulta para grupos por WhatsApp',
    waBlockSubtitle:
      'Escolle zona, número de persoas e quenda horaria. Envía a túa solicitude nun toque directamente por WhatsApp.',
    waZoneLabel: 'Zona preferida',
    waGroupsChip: 'Grupos',
    waGuestsLabel: 'Persoas',
    waShiftLabel: 'Quenda / Hora',
    waNameLabel: 'O teu nome',
    waNamePlaceholder: 'Ex. Laura Pérez',
    waSendDirectBtn: 'Enviar Solicitude por WhatsApp',
    waOpenCalendarBtn: 'Escoller data e notas',
    waMsgIntro: 'Ola',
    waMsgBody: 'gustaríame reservar / consultar dispoñibilidade:',
    waMsgZone: 'Zona',
    waMsgGuests: 'Persoas',
    waMsgShift: 'Quenda',
    waMsgName: 'Nome',
    waMsgPending: 'Por confirmar',
    reviewsTitle: 'O que Di a Nosa Xente',
    verifiedVisit: 'Opinión Verificada en Google',
    seeAllGoogleReviews: 'Ver todas as opinións en Google Maps',
    whereToFindUs: 'Onde Atoparnos',
    weeklyService: 'Horario Semanal en Vivo',
    today: '(Hoxe)',
    closedShift: 'Pechado por descanso',
    wifiCourtesy: 'WiFi Clientes no Local',
    wifiNetwork: 'Rede',
    wifiPass: 'Contrasinal',
    faqsTitle: 'Preguntas Frecuentes',
    digitalMenuTitle: 'Carta Fixa Dixital · Transparencia Total',
    searchPlaceholder: 'Buscar cervexa, viño, ración ou alérxeno...',
    allCategories: 'Todos',
    marketPriceTag: '🌊 Prezo segundo lonxa',
    openNowKitchen: 'Aberto agora · Cociña ata',
    openNow: 'Aberto agora',
    closedNow: 'Pechado agora',
    allergensDeclared: 'Alérxenos Declarados (Regulamento UE 1169/2011):',
    closeDetail: 'Pechar Ficha',
    vatIncludedNote: 'Prezos con IVE incluído. Tapa de cortesía con cada consumición.',
    noDishesFound: 'Non se atoparon produtos que coincidan coa túa busca.',
    faqs: [
      {
        q: '1. Cómpre reservar para tomar canas, viños ou picar algo?',
        a: 'Non é necesario reservar para vir de canas, vermú ou tapeo en barra e terraza; funcionamos por rotación directa. Se sodes un grupo grande para racións no salón ou terraza, podedes avisarnos por WhatsApp nun toque.',
      },
      {
        q: '2. Todas as consumicións inclúen tapa de cortesía?',
        a: 'Si, fieis á tradición de Noia, cada cana, viño ou vermú sae acompañado da nosa tapa de cociña recén feita.',
      },
      {
        q: '3. Como podo consultar os 14 alérxenos e todas as variantes de prezos?',
        a: 'Ao premer en «Ver Carta e Prezos» tes a desagregación íntegra de prezos por cana, copa, xarra, media ración ou ración completa, xunto cos 14 alérxenos.',
      },
    ],
  },
  en: {
    menuAndPrices: 'View Menu & Prices',
    navMenuShort: 'Menu & Prices',
    spaces: 'Venue Spaces',
    navSpacesShort: 'Spaces',
    selectedZoneLabel: 'Selected Area',
    scheduleAndLocation: 'Hours & Location',
    reviews: 'Reviews',
    bookTable: 'Book Table',
    groupsAndBooking: 'Terrace / Groups',
    requestTable: 'Request Table',
    howToGet: 'Get Directions',
    call: 'Call',
    signatureDishBadge: 'House Essentials',
    signatureSectionTitleBrewery: 'Cellar Draft Beer, Wines & Hot Tapas',
    signatureSectionSubtitleBrewery:
      'Four pillars that define our bar on Rúa do Curro. Tap any item to browse serving formats and transparent pricing in the full menu.',
    openFullMenuBtn: 'View Menu & Prices',
    openQrMenuPageBtn: 'Open Full Menu Page (/p/bar-jaratusas)',
    availableFormats: 'Serving formats',
    seePricesInMenu: 'See prices & sizes →',
    sustainableFishing: 'Local produce & cellar draft tanks',
    fairPricing: 'Transparent pricing with VAT included',
    ambienceTitle: 'Choose Your Space & Lighting',
    ambienceSubtitle:
      'From natural daylight under the stone arcades to warm evening atmosphere in our dining room and bar.',
    lunchTime: 'Midday · 13:30h',
    dinnerTime: 'Night · 21:30h',
    selectForBooking: 'Request Table in This Area',
    waBlockEyebrow: 'Direct WhatsApp · Zero Fees',
    waBlockTitle: 'Book your table on the Terrace or Dining Room / Group inquiries via WhatsApp',
    waBlockSubtitle:
      'Pick your preferred area, party size and shift. Send your inquiry directly via WhatsApp in one tap.',
    waZoneLabel: 'Preferred area',
    waGroupsChip: 'Groups',
    waGuestsLabel: 'Guests',
    waShiftLabel: 'Shift / Time',
    waNameLabel: 'Your name',
    waNamePlaceholder: 'E.g. Laura Pérez',
    waSendDirectBtn: 'Send Request via WhatsApp',
    waOpenCalendarBtn: 'Pick date & notes',
    waMsgIntro: 'Hi',
    waMsgBody: 'I would like to book / check availability:',
    waMsgZone: 'Area',
    waMsgGuests: 'Guests',
    waMsgShift: 'Time',
    waMsgName: 'Name',
    waMsgPending: 'To be confirmed',
    reviewsTitle: 'What Our Guests Say',
    verifiedVisit: 'Verified Google Review',
    seeAllGoogleReviews: 'See all reviews on Google Maps',
    whereToFindUs: 'Where to Find Us',
    weeklyService: 'Live Weekly Schedule',
    today: '(Today)',
    closedShift: 'Closed for rest',
    wifiCourtesy: 'Guest WiFi in Bar',
    wifiNetwork: 'Network',
    wifiPass: 'Password',
    faqsTitle: 'Frequently Asked Questions',
    digitalMenuTitle: 'Official Digital Menu · Full Price Transparency',
    searchPlaceholder: 'Search beer, wine, tapa or allergen...',
    allCategories: 'All',
    marketPriceTag: '🌊 Daily market price',
    openNowKitchen: 'Open now · Kitchen until',
    openNow: 'Open now',
    closedNow: 'Closed now',
    allergensDeclared: 'Declared Allergens (EU Regulation 1169/2011):',
    closeDetail: 'Close Item',
    vatIncludedNote: 'Prices include VAT. Complimentary house tapa with every drink.',
    noDishesFound: 'No items found matching your search.',
    faqs: [
      {
        q: '1. Do I need a reservation for beers, wine or tapas?',
        a: 'Walk-ins are always welcome at our bar and covered stone terrace. If you are coming with a larger group for sharing plates in the dining room or terrace, message us via WhatsApp in one tap.',
      },
      {
        q: '2. Does every drink come with a complimentary tapa?',
        a: 'Yes! Following Noia’s hospitality tradition, every draft beer, wine or vermouth comes with a freshly prepared hot tapa from our kitchen.',
      },
      {
        q: '3. Where can I check all serving sizes, prices and the 14 allergens?',
        a: 'Tap "View Menu & Prices" to inspect every serving size (small draft, pint glass, frosted mug, half or full portion) and the 14 official EU allergens.',
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

  // 2. Telemetría de Conversión
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

  // 3. Estados de Modales, Drawers y Conversión WhatsApp Inline
  const [isReservationOpen, setIsReservationOpen] = useState(false)
  const [selectedZone, setSelectedZone] = useState<string>(
    tenant.ambiences[0]?.name || 'Terraza Exterior'
  )
  const [inlineGuests, setInlineGuests] = useState<number>(4)
  const [inlineShift, setInlineShift] = useState<'13:30h' | '20:30h' | '22:00h'>('20:30h')
  const [inlineName, setInlineName] = useState<string>('')
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false)
  const [selectedDishDetail, setSelectedDishDetail] = useState<DishShowcaseItem | null>(null)

  // Mantener selectedZone alineado con el idioma activo cuando corresponde a un espacio
  useEffect(() => {
    const matched = tenant.ambiences.find(
      (a) => a.name === selectedZone || a.name_gl === selectedZone || a.name_en === selectedZone
    )
    if (matched) {
      setSelectedZone(getAmbName(matched))
    } else if (selectedZone === 'Grupos' || selectedZone === 'Groups') {
      setSelectedZone(t.waGroupsChip)
    }
  }, [lang, tenant.ambiences])

  // Cierre de modales de carta con Escape
  useEffect(() => {
    if (!isMenuModalOpen && !selectedDishDetail) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedDishDetail) {
          setSelectedDishDetail(null)
        } else {
          setIsMenuModalOpen(false)
        }
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isMenuModalOpen, selectedDishDetail])

  // 4. Estados del Selector de Espacios y Luz (13:30h vs 21:30h)
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

  const inlineZoneChoices = useMemo(() => {
    return [
      ...tenant.ambiences.map((amb) => ({
        id: amb.id,
        label: getAmbName(amb),
      })),
      { id: 'grupos', label: t.waGroupsChip },
    ]
  }, [tenant.ambiences, lang, t.waGroupsChip])

  const cleanWhatsappNumber = tenant.whatsappNumber.replace(/\D/g, '')

  const inlineWhatsAppHref = useMemo(() => {
    const guestLabel = inlineGuests === 10 ? '+10' : `${inlineGuests}`
    const lines = [
      `${t.waMsgIntro} ${tenant.name}, ${t.waMsgBody}`,
      `• ${t.waMsgZone}: ${selectedZone}`,
      `• ${t.waMsgGuests}: ${guestLabel}`,
      `• ${t.waMsgShift}: ${inlineShift}`,
      `• ${t.waMsgName}: ${inlineName.trim() || t.waMsgPending}`,
    ].join('\n')
    return `https://wa.me/${cleanWhatsappNumber}?text=${encodeURIComponent(lines)}`
  }, [cleanWhatsappNumber, tenant.name, selectedZone, inlineGuests, inlineShift, inlineName, t])

  const DAY_NAMES =
    lang === 'gl'
      ? ['Domingo', 'Luns', 'Martes', 'Mércores', 'Xoves', 'Venres', 'Sábado']
      : lang === 'en'
      ? ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      : ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

  const todayDayOfWeek = new Date().getDay()

  const spacesGridCols =
    tenant.ambiences.length === 3
      ? 'md:grid-cols-3 gap-7 lg:gap-8'
      : 'md:grid-cols-2 gap-10'

  return (
    <div
      className={`min-h-screen overflow-x-clip antialiased pb-24 md:pb-0 ${
        isUrbanBrewery
          ? 'bg-[#0A0B0E] text-[#F6F3EC] selection:bg-[#F59E0B] selection:text-[#0A0B0E]'
          : 'bg-[#F6F3EC] text-[#141311] selection:bg-[#C85A32] selection:text-[#F6F3EC]'
      }`}
      style={{ fontFamily: "'DM Sans', 'Inter', 'Sora', sans-serif" }}
    >
      {/* Carga de Fuentes de Agencia (Anton + Sora + DM Sans + Inter) y Editorial */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Anton&family=DM+Sans:ital,opsz,wght@0,9..40,400..800;1,9..40,400..800&family=Instrument+Sans:wght@400;500;600;700&family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600;700;800&family=Sora:wght@400;500;600;700;800&display=swap');
      `}</style>

      {/* ==============================================================================
         CABECERA NAVEGACIÓN FLOTANTE (LOGO CIRCULAR #EBE8E1 + LIVE BADGE + ES|GAL|EN)
         ============================================================================== */}
      <header className="fixed top-0 inset-x-0 z-40 bg-[#0A0B0E]/90 backdrop-blur-md border-b border-white/10 transition-all">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 h-16 sm:h-[72px] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Link
              href={`/web/${tenant.slug}`}
              className="flex items-center gap-2 sm:gap-2.5 group min-w-0"
            >
              {tenant.logoUrl && (
                <div className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#EBE8E1] overflow-hidden p-0.5 ring-1 ring-[#F59E0B]/50 flex-shrink-0 flex items-center justify-center shadow-sm">
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
                className={`text-[13px] sm:text-xl lg:text-2xl tracking-tight font-bold text-[#F6F3EC] truncate transition ${
                  isUrbanBrewery
                    ? 'uppercase group-hover:text-[#F59E0B]'
                    : 'font-serif group-hover:text-[#C85A32]'
                }`}
                style={
                  isUrbanBrewery
                    ? { fontFamily: "'Anton', 'Sora', sans-serif", letterSpacing: '0.02em' }
                    : undefined
                }
              >
                {tenant.name}
              </span>
            </Link>

            {/* Semáforo de Horario Inteligente en Vivo (Visible en móvil y escritorio) */}
            <LiveOpeningBadge schedules={tenant.openingHours} lang={lang} />
          </div>

          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
            {/* Selector Manual de Idioma (ES | GAL | EN) */}
            <div
              role="group"
              aria-label="Selector de idioma"
              className="inline-flex p-0.5 sm:p-1 rounded-full bg-white/[0.06] border border-white/10 text-[10px] sm:text-[11px] font-bold text-white/75 flex-shrink-0"
              style={{ fontFamily: "'DM Sans', 'Inter', sans-serif" }}
            >
              {(['es', 'gl', 'en'] as WebLanguage[]).map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => handleLangChange(code)}
                  className={`px-1.5 sm:px-2.5 py-1 rounded-full transition-all uppercase ${
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

            <nav className="hidden md:flex items-center gap-4 lg:gap-5">
              {tenant.ambiences.length > 0 && (
                <a
                  href="#ambientes"
                  className={`hidden lg:inline-block text-xs uppercase tracking-[0.14em] font-semibold text-[#F6F3EC]/80 transition py-2 ${
                    isUrbanBrewery ? 'hover:text-[#F59E0B]' : 'hover:text-[#C85A32]'
                  }`}
                >
                  {t.navSpacesShort}
                </a>
              )}
              <a
                href="#reserva-whatsapp"
                className={`hidden lg:inline-block text-xs uppercase tracking-[0.14em] font-semibold text-[#F6F3EC]/80 transition py-2 ${
                  isUrbanBrewery ? 'hover:text-[#F59E0B]' : 'hover:text-[#C85A32]'
                }`}
              >
                {t.groupsAndBooking}
              </a>
              <button
                type="button"
                onClick={() => {
                  if (isUrbanBrewery) {
                    setIsMenuModalOpen(true)
                    trackConversion('open_menu')
                  } else {
                    setIsReservationOpen(true)
                    trackConversion('click_reservation')
                  }
                }}
                className={`px-4 lg:px-5 py-2.5 rounded-full text-xs font-extrabold tracking-wider uppercase transition-all ease-[cubic-bezier(0.22,1,0.36,1)] shadow-md whitespace-nowrap ${
                  isUrbanBrewery
                    ? 'bg-[#F59E0B] text-[#0A0B0E] hover:bg-[#D97706] shadow-[#F59E0B]/20'
                    : 'bg-[#C85A32] text-white hover:bg-[#b04d28] shadow-[#C85A32]/25'
                }`}
              >
                {isUrbanBrewery ? t.navMenuShort : t.bookTable}
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
         HERO CINEMÁTICO (CONTENIDO ABOVE-THE-FOLD SIEMPRE INMEDIATO)
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
        reviewCount={tenant.googleMapsReviewCount || 342}
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
         PORTADA ASPIRACIONAL — LOS 4 PILARES DE LA CASA (0 PRECIOS EN HOME · DEC-39)
         ============================================================================== */}
      {isUrbanBrewery ? (
        <section className="relative bg-[#0A0B0E] text-[#F6F3EC] py-24 sm:py-32 px-6 md:px-12 overflow-x-clip">
          {/* Halo cálido ámbar de fondo */}
          <div
            aria-hidden="true"
            className="absolute top-24 left-1/2 -translate-x-1/2 w-[720px] h-[360px] rounded-full bg-[#F59E0B]/[0.08] blur-[140px] pointer-events-none"
          />

          <div className="relative z-10 max-w-6xl mx-auto">
            {/* Encabezado Editorial Cervecería */}
            <ScrollReveal>
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16 sm:mb-20">
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
                  <p className="mt-4 text-white/75 text-sm sm:text-base leading-relaxed">
                    {t.signatureSectionSubtitleBrewery}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 self-start md:self-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuModalOpen(true)
                      trackConversion('open_menu')
                    }}
                    className="px-7 py-4 rounded-full bg-[#F59E0B] hover:bg-[#D97706] active:scale-[0.98] text-[#0A0B0E] text-xs sm:text-sm font-extrabold uppercase tracking-wider transition-all ease-[cubic-bezier(0.22,1,0.36,1)] shadow-xl shadow-[#F59E0B]/20 flex items-center gap-2"
                  >
                    <span>{t.openFullMenuBtn}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </ScrollReveal>

            {/* Composición de los 4 Pilares de Portada (0 precios en Home) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16">
              {signatureDishes.map((dish, idx) => (
                <ScrollReveal key={dish.id} delayMs={idx * 70}>
                  <article
                    onClick={() => {
                      setIsMenuModalOpen(true)
                      trackConversion('open_menu')
                    }}
                    className={`group cursor-pointer flex flex-col sm:flex-row items-center gap-6 sm:gap-8 p-2 rounded-3xl transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.985] ${
                      idx % 2 === 1 ? 'md:mt-10' : ''
                    }`}
                  >
                    {/* Fotografía Circular Dark-Luxury con Halo Ámbar */}
                    <div className="relative w-48 h-48 sm:w-52 sm:h-52 flex-shrink-0">
                      <div
                        aria-hidden="true"
                        className="absolute inset-4 rounded-full bg-[#F59E0B]/20 blur-2xl transform translate-y-5 scale-90 group-hover:bg-[#F59E0B]/40 group-hover:scale-100 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] pointer-events-none"
                      />
                      <div className="relative w-full h-full rounded-full overflow-hidden ring-1 ring-white/15 group-hover:ring-[#F59E0B]/60 shadow-[0_24px_48px_rgba(0,0,0,0.85)] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]">
                        <Image
                          src={dish.image}
                          alt={getDishName(dish)}
                          fill
                          sizes="(max-width: 640px) 200px, 220px"
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
                      <p className="text-sm text-white/75 leading-relaxed">
                        {getDishDesc(dish)}
                      </p>

                      {/* Formatos disponibles (exclusivamente etiquetas sin €) */}
                      {dish.variants && dish.variants.length > 0 && (
                        <div className="pt-1 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                          {dish.variants.map((v, vIdx) => {
                            const rawName =
                              lang === 'gl'
                                ? v.name_gl || v.name
                                : lang === 'en'
                                ? v.name_en || v.name
                                : v.name
                            const safeFormatLabel = rawName.replace(/\d+[.,]?\d*\s*€/g, '').trim()
                            return (
                              <span
                                key={vIdx}
                                className="text-[11px] text-white/85 bg-white/[0.06] border border-white/10 px-3 py-1 rounded-full font-medium"
                              >
                                {safeFormatLabel}
                              </span>
                            )
                          })}
                        </div>
                      )}

                      <div className="pt-1">
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#F59E0B] group-hover:translate-x-1 transition-transform ease-[cubic-bezier(0.22,1,0.36,1)]">
                          {t.seePricesInMenu}
                        </span>
                      </div>
                    </div>
                  </article>
                </ScrollReveal>
              ))}
            </div>

            {/* Barra de Confianza y Enlace Directo a la Carta Viva (/p/bar-jaratusas) */}
            <ScrollReveal delayMs={120}>
              <div className="mt-20 pt-10 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-white/70">
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
            </ScrollReveal>
          </div>
        </section>
      ) : (
        <section className="relative bg-[#F6F3EC] text-[#141311] py-24 sm:py-32 px-6 md:px-12 overflow-x-clip">
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
                  type="button"
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
         RECORRIDO HORIZONTAL SCROLLYTELLING (60FPS STICKY VIEWPORT)
         ============================================================================== */}
      <CanvasScrollytelling
        panels={tenant.scrollytellingPanels}
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
         SELECTOR DE ESPACIO Y LUZ (13:30h MEDIODÍA vs 21:30h NOCHE)
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
            <ScrollReveal>
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
                    style={
                      isUrbanBrewery ? { fontFamily: "'Anton', 'Sora', sans-serif" } : undefined
                    }
                  >
                    {t.ambienceTitle}
                  </h2>
                  <p
                    className={`text-sm sm:text-base mt-2 max-w-xl ${
                      isUrbanBrewery ? 'text-white/75' : 'text-[#141311]/70'
                    }`}
                  >
                    {t.ambienceSubtitle}
                  </p>
                </div>

                {/* Switch Interactivo 13:30h vs 21:30h */}
                <div
                  className={`inline-flex p-1.5 rounded-full self-start md:self-auto border ${
                    isUrbanBrewery
                      ? 'bg-white/5 border-white/10'
                      : 'bg-[#141311]/5 border-[#141311]/10'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setLightMode('day')}
                    className={`px-4 sm:px-5 py-2.5 rounded-full text-xs font-bold tabular-nums flex items-center gap-2 transition-all ease-[cubic-bezier(0.22,1,0.36,1)] ${
                      lightMode === 'day'
                        ? isUrbanBrewery
                          ? 'bg-[#F59E0B] text-[#0A0B0E] shadow-md'
                          : 'bg-[#141311] text-[#F6F3EC] shadow-md'
                        : isUrbanBrewery
                        ? 'text-white/75 hover:text-white'
                        : 'text-[#141311]/70 hover:text-[#141311]'
                    }`}
                  >
                    <Sun className="w-4 h-4 flex-shrink-0" />
                    <span>{t.lunchTime}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setLightMode('night')}
                    className={`px-4 sm:px-5 py-2.5 rounded-full text-xs font-bold tabular-nums flex items-center gap-2 transition-all ease-[cubic-bezier(0.22,1,0.36,1)] ${
                      lightMode === 'night'
                        ? isUrbanBrewery
                          ? 'bg-[#F59E0B] text-[#0A0B0E] shadow-md'
                          : 'bg-[#141311] text-[#F6F3EC] shadow-md'
                        : isUrbanBrewery
                        ? 'text-white/75 hover:text-white'
                        : 'text-[#141311]/70 hover:text-[#141311]'
                    }`}
                  >
                    <Moon className="w-4 h-4 flex-shrink-0" />
                    <span>{t.dinnerTime}</span>
                  </button>
                </div>
              </div>
            </ScrollReveal>

            {/* Grid Adaptativo (3 columnas cuando hay 3 espacios, 2 cuando hay 2) */}
            <div className={`grid grid-cols-1 ${spacesGridCols}`}>
              {tenant.ambiences.map((amb, idx) => {
                const isSelected = activeAmbienceId === amb.id
                const lightingNote = getAmbLighting(amb, lightMode)
                const localizedAmbName = getAmbName(amb)

                return (
                  <ScrollReveal key={amb.id} delayMs={idx * 80} className="flex">
                    <div
                      onClick={() => {
                        setActiveAmbienceId(amb.id)
                        setSelectedZone(localizedAmbName)
                      }}
                      className={`group cursor-pointer rounded-3xl overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] flex flex-col justify-between w-full ${
                        isUrbanBrewery
                          ? isSelected
                            ? 'bg-[#151821] shadow-[0_28px_60px_rgba(0,0,0,0.65)] ring-1 ring-[#F59E0B]/60'
                            : 'bg-[#12151C] hover:bg-[#161A22] shadow-xl ring-1 ring-white/[0.06]'
                          : isSelected
                          ? 'bg-white border border-[#C85A32] shadow-2xl ring-2 ring-[#C85A32]/30'
                          : 'bg-[#EDE8DE]/60 border border-[#141311]/10 hover:bg-white'
                      }`}
                    >
                      <div>
                        <div className="relative h-64 sm:h-72 w-full overflow-hidden bg-black/40">
                          {/* Capa Día (13:30h) */}
                          <Image
                            src={amb.imageDay}
                            alt={`${localizedAmbName} · ${t.lunchTime}`}
                            fill
                            sizes={
                              tenant.ambiences.length === 3
                                ? '(max-width: 768px) 100vw, 33vw'
                                : '(max-width: 768px) 100vw, 50vw'
                            }
                            aria-hidden={lightMode !== 'day'}
                            className={`object-cover group-hover:scale-105 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                              lightMode === 'day' ? 'opacity-100 z-[1]' : 'opacity-0 z-0'
                            }`}
                          />
                          {/* Capa Noche (21:30h) */}
                          <Image
                            src={amb.imageNight}
                            alt={`${localizedAmbName} · ${t.dinnerTime}`}
                            fill
                            sizes={
                              tenant.ambiences.length === 3
                                ? '(max-width: 768px) 100vw, 33vw'
                                : '(max-width: 768px) 100vw, 50vw'
                            }
                            aria-hidden={lightMode !== 'night'}
                            className={`object-cover group-hover:scale-105 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                              lightMode === 'night' ? 'opacity-100 z-[1]' : 'opacity-0 z-0'
                            }`}
                          />
                          <div className="absolute inset-0 z-[2] bg-gradient-to-t from-black/75 via-transparent to-transparent pointer-events-none" />
                          <div className="absolute top-4 left-4 z-[3] flex items-center gap-2">
                            <span className="bg-black/75 backdrop-blur-md text-[#F6F3EC] text-[10px] uppercase font-bold tracking-wider px-3.5 py-1.5 rounded-full">
                              {getAmbBadge(amb)}
                            </span>
                          </div>
                          {isSelected && (
                            <div className="absolute top-4 right-4 z-[3]">
                              <span
                                className={`text-[10px] uppercase font-extrabold tracking-wider px-3 py-1.5 rounded-full flex items-center gap-1 shadow-md ${
                                  isUrbanBrewery
                                    ? 'bg-[#F59E0B] text-[#0A0B0E]'
                                    : 'bg-[#C85A32] text-white'
                                }`}
                              >
                                <Check className="w-3 h-3" />
                                <span>{t.selectedZoneLabel}</span>
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="p-6 sm:p-7 space-y-3">
                          <div>
                            <h3
                              className={`text-2xl font-bold transition ${
                                isUrbanBrewery
                                  ? 'text-white group-hover:text-[#F59E0B] uppercase tracking-tight'
                                  : 'font-serif text-[#141311] group-hover:text-[#C85A32]'
                              }`}
                              style={
                                isUrbanBrewery
                                  ? { fontFamily: "'Anton', 'Sora', sans-serif" }
                                  : undefined
                              }
                            >
                              {localizedAmbName}
                            </h3>
                            <span
                              className={`text-xs font-medium ${
                                isUrbanBrewery ? 'text-white/60' : 'text-[#141311]/60'
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
                            className={`p-3.5 rounded-2xl text-xs flex items-center gap-2.5 tabular-nums ${
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

                      <div className="p-6 sm:p-7 pt-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setActiveAmbienceId(amb.id)
                            handleOpenReservationWithZone(localizedAmbName)
                          }}
                          className={`w-full py-3.5 rounded-2xl text-xs font-bold tracking-wider uppercase flex items-center justify-center gap-2 transition-all ease-[cubic-bezier(0.22,1,0.36,1)] ${
                            isUrbanBrewery
                              ? isSelected
                                ? 'bg-[#F59E0B] text-[#0A0B0E] hover:bg-[#D97706]'
                                : 'bg-white/10 hover:bg-[#F59E0B] text-white hover:text-[#0A0B0E]'
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
                  </ScrollReveal>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* ==============================================================================
         CONVERSIÓN INLINE WHATSAPP: TERRAZA, SALÓN Y GRUPOS
         ============================================================================== */}
      <section
        id="reserva-whatsapp"
        className={`py-20 px-6 md:px-12 ${
          isUrbanBrewery
            ? 'bg-[#0A0B0E] text-[#F6F3EC]'
            : 'bg-[#EDE8DE]/40 text-[#141311]'
        }`}
      >
        <div className="max-w-5xl mx-auto">
          <ScrollReveal>
            <div
              className={`rounded-3xl p-6 sm:p-10 relative overflow-hidden ${
                isUrbanBrewery
                  ? 'bg-[#12151C] ring-1 ring-[#F59E0B]/30 shadow-[0_28px_64px_rgba(0,0,0,0.65)]'
                  : 'bg-white border border-[#141311]/10 shadow-xl'
              }`}
            >
              {isUrbanBrewery && (
                <div
                  aria-hidden="true"
                  className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-[#F59E0B]/10 blur-[90px] pointer-events-none"
                />
              )}

              <div className="relative z-10 space-y-7">
                <div className="max-w-3xl space-y-2">
                  <div className="inline-flex items-center gap-2">
                    <MessageCircle
                      className={`w-4 h-4 ${isUrbanBrewery ? 'text-[#F59E0B]' : 'text-[#C85A32]'}`}
                    />
                    <span
                      className={`text-xs uppercase tracking-[0.22em] font-bold ${
                        isUrbanBrewery ? 'text-[#F59E0B]' : 'text-[#C85A32]'
                      }`}
                    >
                      {t.waBlockEyebrow}
                    </span>
                  </div>
                  <h2
                    className={`text-2xl sm:text-4xl leading-[1.08] tracking-tight ${
                      isUrbanBrewery ? 'uppercase text-white' : 'font-serif font-bold text-[#141311]'
                    }`}
                    style={
                      isUrbanBrewery ? { fontFamily: "'Anton', 'Sora', sans-serif" } : undefined
                    }
                  >
                    {t.waBlockTitle}
                  </h2>
                  <p
                    className={`text-sm sm:text-base ${
                      isUrbanBrewery ? 'text-white/75' : 'text-[#141311]/70'
                    }`}
                  >
                    {t.waBlockSubtitle}
                  </p>
                </div>

                {/* Controles rápidos de Zona, Personas, Turno y Nombre */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                  {/* Selector de Zona */}
                  <div className="md:col-span-6 space-y-2">
                    <span
                      className={`text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 ${
                        isUrbanBrewery ? 'text-white/75' : 'text-[#141311]/70'
                      }`}
                    >
                      <MapPin className="w-3.5 h-3.5 text-[#F59E0B]" />
                      <span>{t.waZoneLabel}</span>
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {inlineZoneChoices.map((choice) => {
                        const active = selectedZone === choice.label
                        return (
                          <button
                            key={choice.id}
                            type="button"
                            onClick={() => {
                              setSelectedZone(choice.label)
                              if (choice.id !== 'grupos') {
                                setActiveAmbienceId(choice.id)
                              }
                            }}
                            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ease-[cubic-bezier(0.22,1,0.36,1)] ${
                              active
                                ? isUrbanBrewery
                                  ? 'bg-[#F59E0B] text-[#0A0B0E] shadow-md shadow-[#F59E0B]/20'
                                  : 'bg-[#C85A32] text-white shadow-md'
                                : isUrbanBrewery
                                ? 'bg-white/[0.06] text-white/80 hover:bg-white/10 border border-white/10'
                                : 'bg-[#F6F3EC] text-[#141311]/75 hover:bg-[#141311]/10'
                            }`}
                          >
                            {choice.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Personas */}
                  <div className="md:col-span-3 space-y-2">
                    <span
                      className={`text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 ${
                        isUrbanBrewery ? 'text-white/75' : 'text-[#141311]/70'
                      }`}
                    >
                      <Users className="w-3.5 h-3.5 text-[#F59E0B]" />
                      <span>{t.waGuestsLabel}</span>
                    </span>
                    <div className="grid grid-cols-5 gap-1.5">
                      {[2, 4, 6, 8, 10].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setInlineGuests(num)}
                          className={`py-2 rounded-xl text-xs font-bold tabular-nums transition-all ${
                            inlineGuests === num
                              ? isUrbanBrewery
                                ? 'bg-[#F59E0B] text-[#0A0B0E]'
                                : 'bg-[#C85A32] text-white'
                              : isUrbanBrewery
                              ? 'bg-white/[0.06] text-white/75 hover:bg-white/10 border border-white/10'
                              : 'bg-[#F6F3EC] text-[#141311]/75'
                          }`}
                        >
                          {num === 10 ? '+10' : num}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Turno / Hora */}
                  <div className="md:col-span-3 space-y-2">
                    <span
                      className={`text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 ${
                        isUrbanBrewery ? 'text-white/75' : 'text-[#141311]/70'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5 text-[#F59E0B]" />
                      <span>{t.waShiftLabel}</span>
                    </span>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(['13:30h', '20:30h', '22:00h'] as const).map((slot) => (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setInlineShift(slot)}
                          className={`py-2 rounded-xl text-xs font-bold tabular-nums transition-all ${
                            inlineShift === slot
                              ? isUrbanBrewery
                                ? 'bg-[#F59E0B] text-[#0A0B0E]'
                                : 'bg-[#C85A32] text-white'
                              : isUrbanBrewery
                              ? 'bg-white/[0.06] text-white/75 hover:bg-white/10 border border-white/10'
                              : 'bg-[#F6F3EC] text-[#141311]/75'
                          }`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Nombre + Botones de Envío Directo */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end pt-2 border-t border-white/10">
                  <div className="md:col-span-5 space-y-1.5">
                    <label
                      htmlFor="inline-wa-name"
                      className={`text-xs font-medium block ${
                        isUrbanBrewery ? 'text-white/75' : 'text-[#141311]/70'
                      }`}
                    >
                      {t.waNameLabel}
                    </label>
                    <input
                      id="inline-wa-name"
                      type="text"
                      value={inlineName}
                      onChange={(e) => setInlineName(e.target.value)}
                      placeholder={t.waNamePlaceholder}
                      className={`w-full px-4 py-3 rounded-xl text-sm outline-none transition ${
                        isUrbanBrewery
                          ? 'bg-[#0A0B0E] text-white placeholder-white/35 border border-white/10 focus:border-[#F59E0B]'
                          : 'bg-[#F6F3EC] text-[#141311] border border-[#141311]/10 focus:border-[#C85A32]'
                      }`}
                    />
                  </div>

                  <div className="md:col-span-7 flex flex-col sm:flex-row gap-3">
                    <a
                      href={inlineWhatsAppHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => trackConversion('click_reservation')}
                      className={`flex-1 py-3.5 px-6 rounded-xl font-extrabold text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all ease-[cubic-bezier(0.22,1,0.36,1)] shadow-lg ${
                        isUrbanBrewery
                          ? 'bg-[#F59E0B] hover:bg-[#D97706] text-[#0A0B0E] shadow-[#F59E0B]/20'
                          : 'bg-[#25D366] hover:bg-[#20ba59] text-[#0A2612]'
                      }`}
                    >
                      <MessageCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{t.waSendDirectBtn}</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => {
                        setIsReservationOpen(true)
                        trackConversion('click_reservation')
                      }}
                      className={`py-3.5 px-5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                        isUrbanBrewery
                          ? 'bg-white/[0.08] hover:bg-white/15 text-white border border-white/10'
                          : 'bg-[#141311]/10 hover:bg-[#141311]/15 text-[#141311]'
                      }`}
                    >
                      <Calendar className="w-4 h-4 text-[#F59E0B] flex-shrink-0" />
                      <span>{t.waOpenCalendarBtn}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ==============================================================================
         PRUEBA SOCIAL REAL (GOOGLE MAPS + RESEÑAS VERIFICADAS)
         ============================================================================== */}
      {tenant.reviews && tenant.reviews.length > 0 && (
        <section
          className={`py-24 px-6 md:px-12 ${
            isUrbanBrewery ? 'bg-[#0E1015] text-[#F6F3EC]' : 'bg-[#EDE8DE]/50 text-[#141311]'
          }`}
        >
          <div className="max-w-6xl mx-auto">
            <ScrollReveal>
              <div className="text-center max-w-xl mx-auto mb-14">
                <div className="inline-flex items-center gap-1.5 text-amber-400 mb-2 tabular-nums">
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
                  style={
                    isUrbanBrewery ? { fontFamily: "'Anton', 'Sora', sans-serif" } : undefined
                  }
                >
                  {t.reviewsTitle}
                </h2>
              </div>
            </ScrollReveal>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {tenant.reviews.slice(0, 3).map((rev, idx) => {
                const reviewText =
                  lang === 'gl'
                    ? rev.text_gl || rev.text
                    : lang === 'en'
                    ? rev.text_en || rev.text
                    : rev.text

                return (
                  <ScrollReveal key={idx} delayMs={idx * 80} className="flex">
                    <div
                      className={`p-8 rounded-3xl flex flex-col justify-between space-y-5 w-full ${
                        isUrbanBrewery
                          ? 'bg-[#12151C] shadow-[0_20px_40px_rgba(0,0,0,0.45)] ring-1 ring-white/[0.06]'
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
                          <span className="text-[11px] opacity-55 uppercase tracking-wider font-semibold">
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
                  </ScrollReveal>
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
         HORARIOS EN VIVO, WIFI Y UBICACIÓN EN EL CASCO HISTÓRICO
         ============================================================================== */}
      <section
        id="horarios"
        className={`py-24 px-6 md:px-12 ${
          isUrbanBrewery
            ? 'bg-[#0A0B0E] text-[#F6F3EC]'
            : 'bg-[#F6F3EC] text-[#141311] border-t border-[#141311]/10'
        }`}
      >
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          <ScrollReveal className="lg:col-span-6 space-y-6">
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
                  <p className="text-xs opacity-70 tabular-nums">
                    {tenant.postalCode} {tenant.city}
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
                  className="font-bold text-base tabular-nums hover:underline"
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
                      {t.wifiNetwork}: <strong>{tenant.wifiSsid}</strong> · {t.wifiPass}:{' '}
                      <code className="px-1.5 py-0.5 rounded bg-white/10 tabular-nums">
                        {tenant.wifiPassword}
                      </code>
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
                type="button"
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
          </ScrollReveal>

          {/* Tabla de Horarios Semanales */}
          <ScrollReveal delayMs={90} className="lg:col-span-6">
            <div
              className={`p-6 sm:p-8 rounded-3xl space-y-4 ${
                isUrbanBrewery
                  ? 'bg-[#12151C] shadow-[0_24px_48px_rgba(0,0,0,0.5)] ring-1 ring-white/[0.06]'
                  : 'bg-white border border-[#141311]/10 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between gap-2 pb-4 border-b border-white/10">
                <span className="text-xs uppercase tracking-wider font-bold opacity-85 flex items-center gap-2">
                  <Clock className={`w-4 h-4 ${isUrbanBrewery ? 'text-[#F59E0B]' : 'text-[#C85A32]'}`} />
                  <span>{t.weeklyService}</span>
                </span>
                <span
                  suppressHydrationWarning
                  className={`text-xs px-3 py-1 rounded-full font-bold tabular-nums inline-flex items-center gap-1.5 ${
                    openingStatus.isOpen
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-rose-500/20 text-rose-300'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      openingStatus.isOpen ? 'bg-emerald-400' : 'bg-rose-400'
                    }`}
                  />
                  <span>{trafficLightText}</span>
                </span>
              </div>

              <div className="divide-y divide-white/5 text-xs sm:text-sm">
                {[1, 2, 3, 4, 5, 6, 0].map((dayIdx) => {
                  const daySchedules = tenant.openingHours.filter((s) => s.dayOfWeek === dayIdx)
                  const isToday = dayIdx === todayDayOfWeek

                  return (
                    <div
                      key={dayIdx}
                      suppressHydrationWarning
                      className={`py-3 flex items-center justify-between gap-3 ${
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
          </ScrollReveal>
        </div>
      </section>

      {/* ==============================================================================
         PREGUNTAS FRECUENTES (FAQS TRILINGÜES)
         ============================================================================== */}
      <section
        className={`py-20 px-6 md:px-12 ${
          isUrbanBrewery ? 'bg-[#0E1015] text-[#F6F3EC]' : 'bg-[#EDE8DE]/40 text-[#141311]'
        }`}
      >
        <div className="max-w-3xl mx-auto space-y-4">
          <ScrollReveal>
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
          </ScrollReveal>

          {t.faqs.map((faq, idx) => (
            <ScrollReveal key={idx} delayMs={idx * 60}>
              <div
                className={`rounded-2xl overflow-hidden ${
                  isUrbanBrewery
                    ? 'bg-[#12151C] ring-1 ring-white/[0.06]'
                    : 'bg-white border border-[#141311]/10 shadow-sm'
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
                  <div className="p-5 pt-0 text-xs sm:text-sm opacity-80 leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* ==============================================================================
         FOOTER INSTITUCIONAL (LOGO CIRCULAR #EBE8E1 OBJECT-CONTAIN)
         ============================================================================== */}
      <footer className="bg-[#07080A] text-[#E6DFD3] py-16 px-6 md:px-12 border-t border-white/10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
          <div className="flex items-center gap-3.5">
            {tenant.logoUrl && (
              <div className="w-12 h-12 rounded-full bg-[#EBE8E1] overflow-hidden p-0.5 ring-1 ring-[#F59E0B]/50 flex items-center justify-center flex-shrink-0">
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
              <p className="text-xs text-[#E6DFD3]/65 max-w-sm">
                {localizedTagline}
              </p>
            </div>
          </div>

          <div className="text-xs text-[#E6DFD3]/55 space-y-1 tabular-nums">
            <p>
              {tenant.address}, {tenant.postalCode} {tenant.city}
            </p>
            <p suppressHydrationWarning>
              © {new Date().getFullYear()} {tenant.name}.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-[#E6DFD3]/65">
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
        archetype={tenant.archetype}
        lang={lang}
      />

      {/* ==============================================================================
         MODAL DE CARTA FIJA DIGITAL (PRECIOS REALES + VARIANTES + 14 ALÉRGENOS)
         ============================================================================== */}
      {isMenuModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsMenuModalOpen(false)
          }}
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
              className={`p-5 sm:p-6 border-b flex items-center justify-between gap-3 ${
                isUrbanBrewery
                  ? 'bg-[#0A0B0E] border-white/10'
                  : 'bg-white border-[#141311]/10'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                {tenant.logoUrl && (
                  <div className="w-10 h-10 rounded-full bg-[#EBE8E1] overflow-hidden p-0.5 ring-1 ring-[#F59E0B]/50 flex items-center justify-center flex-shrink-0">
                    <Image
                      src={tenant.logoUrl}
                      alt={tenant.name}
                      width={40}
                      height={40}
                      className="w-full h-full object-contain rounded-full"
                    />
                  </div>
                )}
                <div className="min-w-0">
                  <span
                    className={`text-[10px] uppercase tracking-[0.22em] font-bold block ${
                      isUrbanBrewery ? 'text-[#F59E0B]' : 'text-[#C85A32]'
                    }`}
                  >
                    {t.digitalMenuTitle}
                  </span>
                  <h3 className="text-lg sm:text-2xl font-bold truncate">
                    {tenant.name} · {t.menuAndPrices}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                aria-label="Cerrar carta"
                onClick={() => setIsMenuModalOpen(false)}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-[#F59E0B] hover:text-[#0A0B0E] transition flex items-center justify-center flex-shrink-0"
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
              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
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

            {/* Lista de Productos con Precios Reales, Variantes y 14 Alérgenos */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredDishes.map((dish) => (
                  <div
                    key={dish.id}
                    onClick={() => setSelectedDishDetail(dish)}
                    className={`p-4 rounded-2xl transition cursor-pointer flex gap-4 items-start ${
                      isUrbanBrewery
                        ? 'bg-[#151922] hover:bg-[#1B202C] ring-1 ring-white/[0.05]'
                        : 'bg-white border border-[#141311]/10 hover:border-[#C85A32]/40 shadow-sm'
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

                      <p className="text-xs opacity-75 line-clamp-2 leading-relaxed">
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
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedDishDetail(null)
          }}
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
                aria-label={t.closeDetail}
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
