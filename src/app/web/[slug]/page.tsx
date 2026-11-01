'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import {
  Sparkles,
  Calendar,
  Clock,
  Users,
  Compass,
  ChevronDown,
  ChevronRight,
  X,
  Search,
  Check,
  MessageCircle,
  Flame,
  Wine,
  Fish,
  UtensilsCrossed,
  ShieldCheck,
  MapPin,
  Sun,
  Moon,
  ArrowRight,
  Info,
} from 'lucide-react'

// ==============================================================================
// PALETA EDITORIAL CINEMÁTICA V4
// Superficie cálida: #F6F3EC
// Tinta / Tipografía: #141311
// Acento Brasa / Lonja: #C85A32
// Hero Profundo: #0B0D10
// ==============================================================================

interface DishItem {
  id: string
  name: string
  category: string
  price: number
  description: string
  image: string
  allergens?: string[]
  isHero?: boolean
}

const DISHES_CASA_MAR: DishItem[] = [
  {
    id: 'd-lubina',
    name: 'Lubina Salvaje de Bajura a la Brasa de Encina',
    category: 'Pescados & Lonja',
    price: 19.0,
    description: 'Seleccionada cada mañana en la lonja local, abierta a la espalda sobre brasa viva con refrito suave de ajos dorados, guindilla y vinagre de sidra.',
    image: '/images/dishes/lubina-espalda.jpg',
    allergens: ['Pescado'],
    isHero: true,
  },
  {
    id: 'd-pulpo',
    name: 'Pulpo de la Ría á Feira con Patacas de Coristanco',
    category: 'Entradas',
    price: 21.0,
    description: 'Cocción tradicional en caldera de cobre, aderezado con pimentón de la Vera ahumado, flor de sal y aceite de oliva virgen extra de arbequina.',
    image: '/images/dishes/pulpo.jpg',
    allergens: ['Moluscos'],
  },
  {
    id: 'd-zamburinas',
    name: 'Zamburiñas de Noia a la Plancha',
    category: 'Entradas',
    price: 19.0,
    description: 'Plancha viva con emulsionado sutil de limón, vino albariño y aceite de perejil fresco de la huerta.',
    image: '/images/dishes/zamburinas.jpg',
    allergens: ['Moluscos'],
  },
  {
    id: 'd-calamares',
    name: 'Calamares de Ría Fritos con Patatas',
    category: 'Entradas',
    price: 17.0,
    description: 'Rebozado fino y crujiente en harina de garbanzo y trigo, tiernos por dentro, con alioli suave artesanal.',
    image: '/images/dishes/calamares.jpg',
    allergens: ['Moluscos', 'Gluten', 'Huevo'],
  },
  {
    id: 'd-entrecot',
    name: 'Entrecot de Vaca Vieja Gallega Madurada',
    category: 'Carnes',
    price: 19.2,
    description: 'Corte noble con 45 días de maduración en cámara, marcado a fuego directo con costra caramelizada y corazón tierno.',
    image: '/images/dishes/secreto-duroc.jpg',
    allergens: [],
  },
  {
    id: 'd-lenguado',
    name: 'Lenguado de Lonja a la Plancha con Guarnición',
    category: 'Pescados & Lonja',
    price: 17.0,
    description: 'Pescado blanco de carne prieta y fina, preparado al punto justo con patatas panadera confitadas.',
    image: '/images/dishes/lenguado-prancha.jpg',
    allergens: ['Pescado'],
  },
  {
    id: 'd-merluza',
    name: 'Merluza del Pincho a la Gallega',
    category: 'Pescados & Lonja',
    price: 18.7,
    description: 'Lomos limpios con ajada tradicional gallega sobre cama de patatas cocidas y guisantes de temporada.',
    image: '/images/dishes/merluza-galega.jpg',
    allergens: ['Pescado'],
  },
  {
    id: 'd-tarta-queso',
    name: 'Tarta de Queso del Cebreiro Horneada',
    category: 'Postres',
    price: 6.5,
    description: 'Corazón cremoso fluido, elaborada con queso artesanal con D.O.P. O Cebreiro y base fina crujiente.',
    image: '/images/dishes/tarta-queso-horno.jpg',
    allergens: ['Lácteos', 'Huevo', 'Gluten'],
  },
  {
    id: 'd-albarino',
    name: 'Copa de Albariño Rías Baixas D.O.',
    category: 'Vinos & Bodega',
    price: 3.5,
    description: 'Fresco, mineral y cítrico, con recuerdos a manzana verde y notas salinas de la ría.',
    image: '/images/dishes/copa-albarino.jpg',
    allergens: ['Sulfitos'],
  },
]

// Ambientes del Bloque 4
interface SpaceAmbience {
  id: string
  name: string
  subtitle: string
  desc: string
  badge: string
  imageDay: string
  imageNight: string
  lightingNoteDay: string
  lightingNoteNight: string
}

const AMBIENTES: SpaceAmbience[] = [
  {
    id: 'terraza',
    name: 'Terraza Ría',
    subtitle: 'Vistas abiertas al estuario de Noia',
    desc: 'Mesas al aire libre con brisa atlántica suave, protegidas del viento norte. Ideal para largas sobremesas de pescado y vino blanco.',
    badge: 'Espacio al Aire Libre',
    imageDay: '/images/dishes/zamburinas.jpg',
    imageNight: '/images/dishes/pulpo.jpg',
    lightingNoteDay: 'Luz natural atlántica y reflejos dorados en el agua.',
    lightingNoteNight: 'Iluminación cálida indirecta y calor de brasas.',
  },
  {
    id: 'salon',
    name: 'Salón de Piedra',
    subtitle: 'Muros de cantería del siglo XIX',
    desc: 'Arquitectura tradicional de piedra vista y madera noble. Climatización cuidada, acústica silenciosa y mesas amplias para compartir.',
    badge: 'Ambiente Íntimo & Clásico',
    imageDay: '/images/dishes/lenguado-prancha.jpg',
    imageNight: '/images/dishes/secreto-duroc.jpg',
    lightingNoteDay: 'Luz tamizada a través de ventanales de castaño.',
    lightingNoteNight: 'Puntos de luz focal tenue y velas en cada mesa.',
  },
  {
    id: 'barra',
    name: 'Barra & Lonja',
    subtitle: 'Frente a los cortes diarios y el fuego',
    desc: 'El corazón palpitante del local: taburetes altos de cuero, vitrina de marisco fresco y vista directa a las brasas de encina.',
    badge: 'Experiencia Dinámica',
    imageDay: '/images/dishes/calamares.jpg',
    imageNight: '/images/dishes/lubina-espalda.jpg',
    lightingNoteDay: 'Luz viva sobre la vitrina con hielo de bajura.',
    lightingNoteNight: 'Resplandor ámbar directo del fuego de encina.',
  },
]

export default function GastronomicWebHome() {
  const params = useParams()
  const rawSlug = (params?.slug as string) || 'casa-mar-da-vila'
  const isCasaMar = rawSlug.toLowerCase().includes('casa-mar')
  const restaurantTitle = isCasaMar ? 'Casa Mar da Vila' : 'O Pazo da Ría'
  const whatsappNumber = '34711573870'

  // Estados del Bloque 4 (Espacio y Luz)
  const [selectedSpace, setSelectedSpace] = useState<string>('terraza')
  const [lightMode, setLightMode] = useState<'day' | 'night'>('day')

  // Estados del Bloque 5 (Formulario Reserva Directa a WhatsApp)
  const [comensales, setComensales] = useState<number>(2)
  const [fechaReserva, setFechaReserva] = useState<string>('')
  const [horaReserva, setHoraReserva] = useState<string>('14:00')
  const [nombreCliente, setNombreCliente] = useState<string>('')
  const [preferenciaMesa, setPreferenciaMesa] = useState<string>('')

  // Estados del Modal Carta Fija Digital (Sin carrito ni pedidos)
  const [isCartaModalOpen, setIsCartaModalOpen] = useState(false)
  const [categoriaCarta, setCategoriaCarta] = useState<string>('Todos')
  const [busquedaCarta, setBusquedaCarta] = useState<string>('')
  const [platoDetalle, setPlatoDetalle] = useState<DishItem | null>(null)

  // Estados de FAQs desplegables
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  // Canvas Refs
  const heroCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const scrollCanvasRef = useRef<HTMLCanvasElement | null>(null)

  // Progreso de Scroll para Bloque 3
  const [scrollProgress, setScrollProgress] = useState(0)

  // Fecha por defecto: hoy o mañana
  useEffect(() => {
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const formatted = tomorrow.toISOString().split('T')[0]
    setFechaReserva(formatted)
  }, [])

  // ==============================================================================
  // 1. BLOQUE 1: Hero Canvas Micro-Loop (Partículas de Brasa y Bruma a 60 fps)
  // ==============================================================================
  useEffect(() => {
    const canvas = heroCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId: number
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth)
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight)

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return
      width = canvas.width = canvas.parentElement.clientWidth
      height = canvas.height = canvas.parentElement.clientHeight
    }
    window.addEventListener('resize', handleResize)

    // Partículas de brasa / chispas sutiles que flotan lentamente
    const particles = Array.from({ length: 42 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2.2 + 0.6,
      vx: (Math.random() - 0.5) * 0.35,
      vy: -(Math.random() * 0.6 + 0.25),
      alpha: Math.random() * 0.6 + 0.15,
      hue: Math.random() * 25 + 20, // 20-45 (ámbar, fuego de encina)
    }))

    const render = () => {
      ctx.clearRect(0, 0, width, height)

      // Fondo cinemático con degradado atmosférico
      const bgGrad = ctx.createRadialGradient(
        width * 0.5,
        height * 0.75,
        50,
        width * 0.5,
        height * 0.5,
        Math.max(width, height) * 0.85
      )
      bgGrad.addColorStop(0, 'rgba(200, 90, 50, 0.14)') // Resplandor de brasa
      bgGrad.addColorStop(0.5, 'rgba(11, 13, 16, 0.7)')
      bgGrad.addColorStop(1, 'rgba(11, 13, 16, 0.98)')
      ctx.fillStyle = bgGrad
      ctx.fillRect(0, 0, width, height)

      // Dibujar partículas de fuego de encina flotantes
      for (const p of particles) {
        p.x += p.vx
        p.y += p.vy
        if (p.y < 0) {
          p.y = height + 10
          p.x = Math.random() * width
        }
        if (p.x < 0) p.x = width
        if (p.x > width) p.x = 0

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = `hsla(${p.hue}, 95%, 60%, ${p.alpha})`
        ctx.shadowBlur = 8
        ctx.shadowColor = `hsla(${p.hue}, 100%, 65%, ${p.alpha * 0.8})`
        ctx.fill()
      }
      ctx.shadowBlur = 0

      animId = requestAnimationFrame(render)
    }

    render()

    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(animId)
    }
  }, [])

  // ==============================================================================
  // 3. BLOQUE 3: Recorrido por Scroll en Canvas (Interpolación de Escenas a 60 fps)
  // ==============================================================================
  useEffect(() => {
    const handleScroll = () => {
      const section = document.getElementById('scroll-journey')
      if (!section) return
      const rect = section.getBoundingClientRect()
      const totalDist = section.offsetHeight - window.innerHeight
      if (totalDist <= 0) return

      const progress = Math.min(Math.max(-rect.top / totalDist, 0), 1)
      setScrollProgress(progress)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Renderizador de canvas de Bloque 3 basado en scrollProgress
  useEffect(() => {
    const canvas = scrollCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth)
    const height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight)

    ctx.clearRect(0, 0, width, height)

    // Base cromática del local (#141311 con tintes de brasa y lonja)
    ctx.fillStyle = '#0f1013'
    ctx.fillRect(0, 0, width, height)

    // Fases narrativas según scrollProgress:
    // 0.0 - 0.33: Escena 1 (La Lonja y el Fuego)
    // 0.33 - 0.66: Escena 2 (El Salón de Piedra)
    // 0.66 - 1.00: Escena 3 (El Plato Servido)
    const p = scrollProgress

    // Halo ambiental cinemático móvil
    const haloX = width * (0.3 + p * 0.4)
    const haloY = height * (0.4 + Math.sin(p * Math.PI) * 0.2)
    const haloRadius = Math.max(width, height) * 0.6

    const radial = ctx.createRadialGradient(haloX, haloY, 20, haloX, haloY, haloRadius)
    if (p < 0.4) {
      radial.addColorStop(0, 'rgba(200, 90, 50, 0.35)') // Fuego vivo
      radial.addColorStop(1, 'rgba(15, 16, 19, 0.95)')
    } else if (p < 0.75) {
      radial.addColorStop(0, 'rgba(215, 175, 120, 0.25)') // Calidez de piedra
      radial.addColorStop(1, 'rgba(15, 16, 19, 0.95)')
    } else {
      radial.addColorStop(0, 'rgba(70, 130, 180, 0.25)') // Salitre y noche
      radial.addColorStop(1, 'rgba(15, 16, 19, 0.95)')
    }
    ctx.fillStyle = radial
    ctx.fillRect(0, 0, width, height)

    // Líneas cinemáticas de profundidad arquitectónica
    ctx.strokeStyle = 'rgba(246, 243, 236, 0.05)'
    ctx.lineWidth = 1
    const linesCount = 8
    for (let i = 0; i < linesCount; i++) {
      const y = (height / linesCount) * i + (p * 50) % (height / linesCount)
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
      ctx.stroke()
    }
  }, [scrollProgress])

  // Filtrado de platos para la Carta Fija Digital
  const platosFiltrados = useMemo(() => {
    return DISHES_CASA_MAR.filter((dish) => {
      const matchCat = categoriaCarta === 'Todos' || dish.category === categoriaCarta
      const matchSearch =
        busquedaCarta === '' ||
        dish.name.toLowerCase().includes(busquedaCarta.toLowerCase()) ||
        dish.description.toLowerCase().includes(busquedaCarta.toLowerCase())
      return matchCat && matchSearch
    })
  }, [categoriaCarta, busquedaCarta])

  const categoriasDisponibles = useMemo(() => {
    return ['Todos', ...Array.from(new Set(DISHES_CASA_MAR.map((d) => d.category)))]
  }, [])

  // Construcción del enlace de WhatsApp estructurado para Bloque 5
  const whatsappUrl = useMemo(() => {
    const espacioObj = AMBIENTES.find((a) => a.id === selectedSpace)
    const turnoLabel = lightMode === 'day' ? 'Almuerzo (Mediodía 13:30h - 16:00h)' : 'Cena (Noche 21:00h - 23:30h)'
    const texto = `Hola ${restaurantTitle}, me gustaría solicitar una reserva:
• Espacio deseado: ${espacioObj?.name || 'Terraza Ría'}
• Turno: ${turnoLabel}
• Comensales: ${comensales} personas
• Fecha: ${fechaReserva || 'Próxima'}
• Hora: ${horaReserva}
• A nombre de: ${nombreCliente || 'Cliente'}
${preferenciaMesa ? `• Preferencia / Observaciones: ${preferenciaMesa}` : ''}

¿Tienen disponibilidad para esta fecha? Muchas gracias.`

    return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(texto)}`
  }, [restaurantTitle, selectedSpace, lightMode, comensales, fechaReserva, horaReserva, nombreCliente, preferenciaMesa])

  return (
    <div className="min-h-screen bg-[#F6F3EC] text-[#141311] font-sans antialiased selection:bg-[#C85A32] selection:text-[#F6F3EC]">
      {/* ==============================================================================
         CABECERA NAVEGACIÓN FLOTANTE (ESTILO EDITORIAL MINIMALISTA)
         ============================================================================== */}
      <header className="fixed top-0 inset-x-0 z-40 bg-[#F6F3EC]/85 backdrop-blur-md border-b border-[#141311]/5 transition-all">
        <div className="max-w-6xl mx-auto px-6 h-18 flex items-center justify-between">
          <Link href={`/web/${rawSlug}`} className="flex items-center gap-2 group">
            <span className="font-serif text-2xl tracking-tight font-bold text-[#141311] group-hover:text-[#C85A32] transition">
              {restaurantTitle}
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#C85A32]" />
          </Link>

          <nav className="flex items-center gap-3 sm:gap-6">
            <button
              onClick={() => setIsCartaModalOpen(true)}
              className="text-xs uppercase tracking-[0.2em] font-medium text-[#141311]/80 hover:text-[#C85A32] transition py-2"
            >
              Carta & Precios
            </button>
            <a
              href="#ambientes"
              className="hidden md:inline-block text-xs uppercase tracking-[0.2em] font-medium text-[#141311]/80 hover:text-[#C85A32] transition py-2"
            >
              Espacios
            </a>
            <a
              href="#reserva-directa"
              className="px-5 py-2.5 rounded-full bg-[#141311] text-[#F6F3EC] text-xs font-medium tracking-wider uppercase hover:bg-[#C85A32] transition shadow-sm"
            >
              Reservar
            </a>
          </nav>
        </div>
      </header>

      {/* ==============================================================================
         BLOQUE 1: Hero Full-Bleed en Trípode 16:9 + Neblina Inferior Fundida
         ============================================================================== */}
      <section className="relative w-full h-screen min-h-[700px] overflow-hidden bg-[#0B0D10] select-none pt-18">
        {/* Micro-loop de canvas ambiental en trípode a 60 fps */}
        <canvas ref={heroCanvasRef} className="absolute inset-0 w-full h-full object-cover" />

        {/* Imagen gastronómica ambiental de fondo con opacidad sutil */}
        <div className="absolute inset-0 pointer-events-none opacity-25 mix-blend-luminosity">
          <Image
            src="/images/dishes/lubina-espalda.jpg"
            alt="Fondo Brasa y Lonja"
            fill
            priority
            className="object-cover object-center scale-105 transition-transform duration-1000"
          />
        </div>

        {/* Gradiente viñeta oscuro superior para legibilidad */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-44 bg-gradient-to-b from-[#0B0D10]/80 to-transparent" />

        {/* Contenido Editorial del Hero: Aire intencional en el tercio superior */}
        <div className="relative z-10 max-w-6xl mx-auto h-full flex flex-col justify-end pb-36 px-6 md:px-12">
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="w-2 h-2 rounded-full bg-[#C85A32] animate-pulse" />
            <span className="text-xs uppercase tracking-[0.28em] text-[#E6DFD3]/80 font-medium">
              Ría de Muros e Noia · Producto de Lonja & Brasa
            </span>
          </div>

          <h1 className="font-serif text-4xl sm:text-6xl md:text-7xl text-[#F6F3EC] tracking-tight leading-[1.05] max-w-3xl font-normal">
            El mar entra a las seis.<br />
            El fuego decide el resto.
          </h1>

          <p className="mt-4 text-[#E6DFD3]/85 text-sm sm:text-base max-w-xl leading-relaxed">
            Pescados de bajura seleccionados al amanecer, mariscos vivos de la ría y cortes madurados sobre carbón de
            encina en el corazón histórico de Noia.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <a
              href="#reserva-directa"
              className="px-7 py-4 rounded-full bg-[#F6F3EC] text-[#141311] text-sm font-semibold tracking-wide hover:bg-white transition-all shadow-xl hover:scale-[1.02] active:scale-[0.98]"
            >
              Reservar Mesa
            </a>
            <button
              onClick={() => setIsCartaModalOpen(true)}
              className="px-7 py-4 rounded-full border border-[#F6F3EC]/35 text-[#F6F3EC] backdrop-blur-md text-sm font-medium hover:bg-white/10 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2"
            >
              <span>Ver Carta y Precios de Hoy</span>
              <ArrowRight className="w-4 h-4 text-[#C85A32]" />
            </button>
          </div>
        </div>

        {/* Transición obligatoria en neblina de 190px hacia el fondo cálido #F6F3EC (PROHIBIDO corte duro) */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[190px] bg-gradient-to-b from-transparent via-[#F6F3EC]/65 to-[#F6F3EC]" />
      </section>

      {/* ==============================================================================
         BLOQUE 2: Desaparición del Rectángulo (Plato Estrella Recortado + Carta Fija a 1 Clic)
         ============================================================================== */}
      <section className="relative bg-[#F6F3EC] text-[#141311] py-28 px-6 md:px-12">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-14 items-center">
          {/* Plato recortado sin contenedor rectangular con sombra de contacto realista */}
          <div className="lg:col-span-7 relative flex flex-col items-center justify-center">
            <div className="relative w-[300px] h-[300px] sm:w-[400px] sm:h-[400px] md:w-[460px] md:h-[460px] flex items-center justify-center">
              {/* Sombra de contacto suave proyectada en la superficie cálida */}
              <div className="absolute inset-4 rounded-full bg-[#141311]/25 blur-3xl transform translate-y-12 scale-90 pointer-events-none" />

              <div className="relative w-full h-full rounded-full overflow-hidden p-2 ring-1 ring-[#141311]/5 shadow-[0_38px_42px_rgba(20,19,17,0.26)] transition-transform duration-700 hover:scale-[1.02] cursor-pointer"
                   onClick={() => setIsCartaModalOpen(true)}>
                <Image
                  src="/images/dishes/lubina-espalda.jpg"
                  alt="Lubina Salvaje de Bajura a la Brasa de Encina"
                  fill
                  className="object-cover rounded-full"
                />
              </div>

              {/* Badge flotante de precio oficial */}
              <div className="absolute -bottom-2 right-4 bg-[#141311] text-[#F6F3EC] px-4 py-2 rounded-full font-serif text-lg font-bold shadow-xl border border-white/10 flex items-center gap-1.5">
                <span>19,00 €</span>
                <span className="text-[10px] font-sans font-normal uppercase tracking-wider text-[#E6DFD3]/70">
                  Lonja de Hoy
                </span>
              </div>
            </div>
          </div>

          {/* Copywriting editorial limpio + disparador de Carta Fija con precios reales */}
          <div className="lg:col-span-5 space-y-6">
            <div className="inline-flex items-center gap-2">
              <Flame className="w-4 h-4 text-[#C85A32]" />
              <span className="text-xs uppercase tracking-[0.24em] text-[#C85A32] font-bold">
                Plato Insignia de la Casa
              </span>
            </div>

            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl leading-[1.15] text-[#141311] font-bold">
              Lubina Salvaje de Bajura a la Brasa de Encina
            </h2>

            <p className="text-[#141311]/75 text-base sm:text-lg leading-relaxed">
              Seleccionada cada mañana en la lonja local, abierta a la espalda y marcada sobre brasa viva con refrito
              suave de ajos dorados, guindilla y vinagre de sidra. Crujiente en piel, jugosa en espina.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => setIsCartaModalOpen(true)}
                className="px-8 py-4 rounded-full bg-[#141311] text-[#F6F3EC] text-sm font-semibold tracking-wide hover:bg-[#C85A32] transition-all shadow-lg hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <span>Abrir Carta Completa con Precios</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="pt-4 border-t border-[#141311]/10 flex items-center gap-6 text-xs text-[#141311]/60">
              <div className="flex items-center gap-1.5">
                <Fish className="w-4 h-4 text-[#C85A32]" />
                <span>Pesca artesanal sostenible</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Sin intermediarios</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==============================================================================
         BLOQUE 3: Recorrido Inmersivo del Local por Scroll en <canvas> (320vh)
         ============================================================================== */}
      <section id="scroll-journey" className="relative h-[320vh] bg-[#F6F3EC]">
        <div className="sticky top-0 h-screen w-full overflow-hidden">
          {/* Neblina superior para fundir desde #F6F3EC */}
          <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-[140px] bg-gradient-to-b from-[#F6F3EC] to-transparent" />

          <canvas ref={scrollCanvasRef} className="w-full h-full object-cover" />

          {/* Tarjetas narrativas limpias que aparecen según el progreso del scroll (0.0 a 1.0) */}
          {/* En móvil se posicionan en el tercio inferior para dejar libre el tercio superior */}
          <div className="absolute inset-x-0 bottom-16 sm:bottom-20 z-20 max-w-xl mx-auto px-6 pointer-events-none">
            {scrollProgress < 0.38 ? (
              <div className="p-6 rounded-3xl bg-[#141311]/80 backdrop-blur-xl border border-white/10 text-[#F6F3EC] shadow-2xl transition-all duration-500 animate-in fade-in slide-in-from-bottom-4">
                <span className="text-[11px] uppercase tracking-[0.24em] text-[#C85A32] font-bold block mb-1.5">
                  Fase I · 06:30h
                </span>
                <h3 className="font-serif text-2xl sm:text-3xl font-bold mb-2">La Lonja Despierta</h3>
                <p className="text-xs sm:text-sm text-[#E6DFD3]/80 leading-relaxed">
                  El pescado entra vivo por la ría. Seleccionamos pieza por pieza antes de encender el carbón vegetal en
                  cocina.
                </p>
              </div>
            ) : scrollProgress < 0.72 ? (
              <div className="p-6 rounded-3xl bg-[#141311]/80 backdrop-blur-xl border border-white/10 text-[#F6F3EC] shadow-2xl transition-all duration-500 animate-in fade-in slide-in-from-bottom-4">
                <span className="text-[11px] uppercase tracking-[0.24em] text-[#C85A32] font-bold block mb-1.5">
                  Fase II · 13:30h
                </span>
                <h3 className="font-serif text-2xl sm:text-3xl font-bold mb-2">La Brasa y la Piedra</h3>
                <p className="text-xs sm:text-sm text-[#E6DFD3]/80 leading-relaxed">
                  Las brasas de encina alcanzan los 380 °C. La cantería del salón templa el ambiente para una sobremesa sin
                  prisas.
                </p>
              </div>
            ) : (
              <div className="p-6 rounded-3xl bg-[#141311]/80 backdrop-blur-xl border border-white/10 text-[#F6F3EC] shadow-2xl transition-all duration-500 animate-in fade-in slide-in-from-bottom-4">
                <span className="text-[11px] uppercase tracking-[0.24em] text-[#C85A32] font-bold block mb-1.5">
                  Fase III · La Mesa
                </span>
                <h3 className="font-serif text-2xl sm:text-3xl font-bold mb-2">El Mar en la Mesa</h3>
                <p className="text-xs sm:text-sm text-[#E6DFD3]/80 leading-relaxed">
                  La piel cruje, el albariño frío acompaña y el tiempo se detiene en Noia.
                </p>
              </div>
            )}
          </div>

          {/* Neblina inferior para fundir de vuelta hacia #F6F3EC */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-[160px] bg-gradient-to-t from-[#F6F3EC] to-transparent" />
        </div>
      </section>

      {/* ==============================================================================
         BLOQUE 4: Selector de Espacio & Luz Ambiental Conectado a la Reserva
         ============================================================================== */}
      <section id="ambientes" className="bg-[#F6F3EC] text-[#141311] py-24 px-6 md:px-12 border-t border-[#141311]/5">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <div className="inline-flex items-center gap-2 mb-2">
                <Compass className="w-4 h-4 text-[#C85A32]" />
                <span className="text-xs uppercase tracking-[0.26em] text-[#C85A32] font-bold">
                  Atmósfera & Ubicación
                </span>
              </div>
              <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
                Elige tu Espacio y tu Luz
              </h2>
              <p className="text-[#141311]/70 text-sm sm:text-base mt-2 max-w-xl">
                Cada rincón de {restaurantTitle} tiene una personalidad distinta según la hora del día.
              </p>
            </div>

            {/* Switch Mediodía (13:30h) vs Noche (21:30h) */}
            <div className="inline-flex p-1.5 rounded-full bg-[#141311]/5 border border-[#141311]/10 self-start md:self-auto">
              <button
                type="button"
                onClick={() => setLightMode('day')}
                className={`px-5 py-2.5 rounded-full text-xs font-bold flex items-center gap-2 transition-all ${
                  lightMode === 'day'
                    ? 'bg-[#141311] text-[#F6F3EC] shadow-md'
                    : 'text-[#141311]/70 hover:text-[#141311]'
                }`}
              >
                <Sun className="w-4 h-4 text-amber-500" />
                <span>Mediodía · 13:30h</span>
              </button>

              <button
                type="button"
                onClick={() => setLightMode('night')}
                className={`px-5 py-2.5 rounded-full text-xs font-bold flex items-center gap-2 transition-all ${
                  lightMode === 'night'
                    ? 'bg-[#141311] text-[#F6F3EC] shadow-md'
                    : 'text-[#141311]/70 hover:text-[#141311]'
                }`}
              >
                <Moon className="w-4 h-4 text-indigo-400" />
                <span>Noche · 21:30h</span>
              </button>
            </div>
          </div>

          {/* Selector de los 3 Ambientes */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {AMBIENTES.map((amb) => {
              const isSelected = selectedSpace === amb.id
              const currentImage = lightMode === 'day' ? amb.imageDay : amb.imageNight
              const lightingNote = lightMode === 'day' ? amb.lightingNoteDay : amb.lightingNoteNight

              return (
                <div
                  key={amb.id}
                  onClick={() => setSelectedSpace(amb.id)}
                  className={`group cursor-pointer rounded-3xl overflow-hidden transition-all duration-300 border flex flex-col justify-between ${
                    isSelected
                      ? 'bg-white border-[#C85A32] shadow-2xl ring-2 ring-[#C85A32]/40 scale-[1.02]'
                      : 'bg-[#EDE8DE]/60 border-[#141311]/10 hover:border-[#141311]/25 hover:bg-white'
                  }`}
                >
                  <div>
                    {/* Imagen del Espacio */}
                    <div className="relative h-60 w-full overflow-hidden">
                      <Image
                        src={currentImage}
                        alt={amb.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                      <div className="absolute top-4 left-4 bg-[#141311]/80 backdrop-blur-md text-[#F6F3EC] text-[10px] uppercase font-bold tracking-wider px-3 py-1 rounded-full">
                        {amb.badge}
                      </div>

                      {isSelected && (
                        <div className="absolute top-4 right-4 w-7 h-7 rounded-full bg-[#C85A32] text-[#F6F3EC] flex items-center justify-center font-bold text-sm shadow-lg">
                          ✓
                        </div>
                      )}
                    </div>

                    <div className="p-6 space-y-3">
                      <div>
                        <h3 className="font-serif text-2xl font-bold text-[#141311] group-hover:text-[#C85A32] transition">
                          {amb.name}
                        </h3>
                        <span className="text-xs text-[#141311]/60 font-medium">{amb.subtitle}</span>
                      </div>

                      <p className="text-xs text-[#141311]/75 leading-relaxed">{amb.desc}</p>

                      <div className="p-3 rounded-2xl bg-[#F6F3EC] text-[11px] text-[#141311]/70 border border-[#141311]/5 flex items-center gap-2">
                        {lightMode === 'day' ? (
                          <Sun className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                        ) : (
                          <Moon className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                        )}
                        <span>{lightingNote}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 pt-0">
                    <a
                      href="#reserva-directa"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedSpace(amb.id)
                      }}
                      className={`w-full py-3 rounded-2xl text-xs font-bold tracking-wider uppercase flex items-center justify-center gap-2 transition-all ${
                        isSelected
                          ? 'bg-[#C85A32] text-white shadow-md'
                          : 'bg-[#141311]/5 text-[#141311] hover:bg-[#141311] hover:text-white'
                      }`}
                    >
                      <span>{isSelected ? 'Espacio Seleccionado' : 'Elegir para mi Reserva'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ==============================================================================
         BLOQUE 5: Cierre Directo a WhatsApp con Espacio Pre-cargado + 3 FAQs Desplegables
         ============================================================================== */}
      <section id="reserva-directa" className="bg-[#F6F3EC] text-[#141311] pt-12 pb-28 px-6 md:px-12 border-t border-[#141311]/10">
        <div className="max-w-4xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-12">
            <span className="text-xs uppercase tracking-[0.26em] text-[#C85A32] font-bold block mb-2">
              Reserva Oficial Sin Intermediarios
            </span>
            <h2 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight">
              Asegura tu Mesa en {restaurantTitle}
            </h2>
            <p className="text-[#141311]/70 text-sm mt-3 leading-relaxed">
              Reserva directa confirmada al instante por nuestro equipo de sala vía WhatsApp. Sin comisiones abusivas ni
              plataformas externas.
            </p>
          </div>

          {/* Formulario de Reserva con Espacio Pre-cargado */}
          <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-2xl border border-[#141311]/10 space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Espacio Pre-cargado */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#141311]/70 block mb-2">
                  Espacio Seleccionado (Bloque 4)
                </label>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedSpace}
                    onChange={(e) => setSelectedSpace(e.target.value)}
                    className="w-full px-4 py-3.5 rounded-2xl bg-[#F6F3EC] border border-[#141311]/15 text-sm font-bold text-[#141311] outline-none focus:border-[#C85A32]"
                  >
                    {AMBIENTES.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.badge})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Turno (Mediodía / Noche) */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#141311]/70 block mb-2">
                  Turno
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setLightMode('day')}
                    className={`py-3 px-3 rounded-2xl text-xs font-bold border transition ${
                      lightMode === 'day'
                        ? 'bg-[#141311] text-[#F6F3EC] border-[#141311]'
                        : 'bg-[#F6F3EC] text-[#141311]/70 border-[#141311]/10 hover:border-[#141311]/30'
                    }`}
                  >
                    Almuerzo (Mediodía)
                  </button>
                  <button
                    type="button"
                    onClick={() => setLightMode('night')}
                    className={`py-3 px-3 rounded-2xl text-xs font-bold border transition ${
                      lightMode === 'night'
                        ? 'bg-[#141311] text-[#F6F3EC] border-[#141311]'
                        : 'bg-[#F6F3EC] text-[#141311]/70 border-[#141311]/10 hover:border-[#141311]/30'
                    }`}
                  >
                    Cena (Noche)
                  </button>
                </div>
              </div>

              {/* Selector de Comensales */}
              <div className="sm:col-span-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[#141311]/70 block mb-2">
                  Número de Comensales
                </label>
                <div className="grid grid-cols-7 gap-2">
                  {[1, 2, 3, 4, 5, 6, 8].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setComensales(num)}
                      className={`py-3 rounded-2xl font-bold text-sm border transition-all ${
                        comensales === num
                          ? 'bg-[#C85A32] text-white border-[#C85A32] shadow-md scale-105'
                          : 'bg-[#F6F3EC] text-[#141311] border-[#141311]/10 hover:border-[#141311]/30'
                      }`}
                    >
                      {num === 8 ? '8+' : num}
                    </button>
                  ))}
                </div>
              </div>

              {/* Fecha y Hora */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#141311]/70 block mb-2">
                  Fecha Deseada
                </label>
                <input
                  type="date"
                  value={fechaReserva}
                  onChange={(e) => setFechaReserva(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-2xl bg-[#F6F3EC] border border-[#141311]/15 text-sm font-semibold text-[#141311] outline-none focus:border-[#C85A32]"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#141311]/70 block mb-2">
                  Hora de Llegada
                </label>
                <select
                  value={horaReserva}
                  onChange={(e) => setHoraReserva(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-2xl bg-[#F6F3EC] border border-[#141311]/15 text-sm font-semibold text-[#141311] outline-none focus:border-[#C85A32]"
                >
                  {lightMode === 'day' ? (
                    <>
                      <option value="13:30">13:30 h</option>
                      <option value="14:00">14:00 h</option>
                      <option value="14:30">14:30 h</option>
                      <option value="15:00">15:00 h</option>
                    </>
                  ) : (
                    <>
                      <option value="21:00">21:00 h</option>
                      <option value="21:30">21:30 h</option>
                      <option value="22:00">22:00 h</option>
                      <option value="22:30">22:30 h</option>
                    </>
                  )}
                </select>
              </div>

              {/* Nombre de Contacto y Observaciones */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#141311]/70 block mb-2">
                  Tu Nombre
                </label>
                <input
                  type="text"
                  placeholder="Ej. Manuel Vázquez"
                  value={nombreCliente}
                  onChange={(e) => setNombreCliente(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-2xl bg-[#F6F3EC] border border-[#141311]/15 text-sm font-semibold text-[#141311] outline-none focus:border-[#C85A32]"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#141311]/70 block mb-2">
                  Observaciones / Alergias (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ej. Celíaco, trona para bebé, aniversario..."
                  value={preferenciaMesa}
                  onChange={(e) => setPreferenciaMesa(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-2xl bg-[#F6F3EC] border border-[#141311]/15 text-sm text-[#141311] outline-none focus:border-[#C85A32]"
                />
              </div>
            </div>

            {/* Botón WhatsApp de Acción Directa */}
            <div className="pt-2">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-4.5 px-8 rounded-2xl bg-[#25D366] hover:bg-[#20ba5a] text-[#141311] font-bold text-base flex items-center justify-center gap-3 transition-all shadow-xl hover:scale-[1.01] active:scale-[0.99]"
              >
                <MessageCircle className="w-6 h-6 text-[#141311]" />
                <span>Confirmar Reserva por WhatsApp con {restaurantTitle}</span>
              </a>
              <p className="text-center text-[11px] text-[#141311]/50 mt-2.5">
                Al pulsar se abrirá tu WhatsApp oficial con los datos de tu reserva ya estructurados para confirmación en
                menos de 2 minutos.
              </p>
            </div>
          </div>

          {/* 3 FAQs Desplegables Esenciales */}
          <div className="mt-16 space-y-4">
            <h3 className="font-serif text-2xl font-bold text-[#141311] text-center mb-6">
              Preguntas Frecuentes sobre tu Reserva
            </h3>

            {/* FAQ 1 */}
            <div className="rounded-2xl bg-white border border-[#141311]/10 overflow-hidden shadow-sm">
              <button
                type="button"
                onClick={() => setOpenFaq(openFaq === 1 ? null : 1)}
                className="w-full p-5 text-left font-bold text-sm sm:text-base flex items-center justify-between gap-4"
              >
                <span>1. ¿Cómo funciona la confirmación de la reserva?</span>
                <ChevronDown
                  className={`w-5 h-5 text-[#C85A32] transition-transform ${openFaq === 1 ? 'rotate-180' : ''}`}
                />
              </button>
              {openFaq === 1 && (
                <div className="p-5 pt-0 text-xs sm:text-sm text-[#141311]/70 leading-relaxed border-t border-[#141311]/5">
                  La reserva se realiza de forma directa entre el comensal y el personal de sala a través de WhatsApp. Te
                  responderemos inmediatamente con la confirmación de mesa y detalles del servicio, sin comisiones de
                  intermediarios.
                </div>
              )}
            </div>

            {/* FAQ 2 */}
            <div className="rounded-2xl bg-white border border-[#141311]/10 overflow-hidden shadow-sm">
              <button
                type="button"
                onClick={() => setOpenFaq(openFaq === 2 ? null : 2)}
                className="w-full p-5 text-left font-bold text-sm sm:text-base flex items-center justify-between gap-4"
              >
                <span>2. ¿Qué ocurre si cambia el número de comensales o llego tarde?</span>
                <ChevronDown
                  className={`w-5 h-5 text-[#C85A32] transition-transform ${openFaq === 2 ? 'rotate-180' : ''}`}
                />
              </button>
              {openFaq === 2 && (
                <div className="p-5 pt-0 text-xs sm:text-sm text-[#141311]/70 leading-relaxed border-t border-[#141311]/5">
                  Mantenemos un margen de cortesía de 15 minutos en tu mesa. Si surge cualquier imprevisto o se suma
                  alguien más, solo tienes que avisarnos por el mismo chat de WhatsApp para adaptar la sala.
                </div>
              )}
            </div>

            {/* FAQ 3 */}
            <div className="rounded-2xl bg-white border border-[#141311]/10 overflow-hidden shadow-sm">
              <button
                type="button"
                onClick={() => setOpenFaq(openFaq === 3 ? null : 3)}
                className="w-full p-5 text-left font-bold text-sm sm:text-base flex items-center justify-between gap-4"
              >
                <span>3. ¿Cómo gestionan los alérgenos y el pescado del día?</span>
                <ChevronDown
                  className={`w-5 h-5 text-[#C85A32] transition-transform ${openFaq === 3 ? 'rotate-180' : ''}`}
                />
              </button>
              {openFaq === 3 && (
                <div className="p-5 pt-0 text-xs sm:text-sm text-[#141311]/70 leading-relaxed border-t border-[#141311]/5">
                  Cumplimos rigurosamente el Reglamento UE 1169/2011. Toda nuestra carta cuenta con desglose de alérgenos y
                  nuestro equipo adapta los puntos de cocción y guarniciones en cocina para personas con celiaquía o
                  intolerancias alimentarias.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ==============================================================================
         MODAL DE CARTA FIJA DIGITAL (PLAN CARTA FLUXO)
         Exclusivamente catálogo digital informativo: conservará fotos, buscador reactivo,
         filtros dietéticos y ficha técnica de platos; prescinde rigurosamente de botones
         de añadir al carrito, selectores de cantidad, llamadas a mozo o selector de mesas.
         ============================================================================== */}
      {isCartaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#0B0D10]/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#F6F3EC] text-[#141311] w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-[#141311]/10">
            {/* Cabecera del Modal */}
            <div className="p-6 border-b border-[#141311]/10 flex items-center justify-between bg-white">
              <div>
                <span className="text-[11px] uppercase tracking-[0.24em] text-[#C85A32] font-bold block">
                  Catálogo Digital Oficial
                </span>
                <h3 className="font-serif text-2xl font-bold">{restaurantTitle} · Carta de Temporada</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCartaModalOpen(false)}
                className="w-10 h-10 rounded-full bg-[#141311]/5 hover:bg-[#141311] hover:text-white transition flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Buscador y Categorías */}
            <div className="p-4 sm:p-6 bg-[#EDE8DE]/40 border-b border-[#141311]/5 space-y-4">
              <div className="relative">
                <Search className="w-4 h-4 text-[#141311]/40 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar plato, ingrediente o alérgeno..."
                  value={busquedaCarta}
                  onChange={(e) => setBusquedaCarta(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white border border-[#141311]/10 text-sm outline-none focus:border-[#C85A32]"
                />
              </div>

              {/* Píldoras de Categorías */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {categoriasDisponibles.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategoriaCarta(cat)}
                    className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition ${
                      categoriaCarta === cat
                        ? 'bg-[#141311] text-[#F6F3EC]'
                        : 'bg-white text-[#141311]/70 hover:bg-[#141311]/10'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Lista de Platos de la Carta Fija */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {platosFiltrados.map((dish) => (
                  <div
                    key={dish.id}
                    onClick={() => setPlatoDetalle(dish)}
                    className="p-4 rounded-2xl bg-white border border-[#141311]/8 hover:border-[#C85A32]/40 transition shadow-sm hover:shadow-md cursor-pointer flex gap-4 items-center"
                  >
                    <div className="relative w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 bg-[#141311]/5">
                      <Image src={dish.image} alt={dish.name} fill className="object-cover" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2 mb-1">
                        <h4 className="font-serif font-bold text-sm sm:text-base truncate">{dish.name}</h4>
                        <span className="font-bold text-sm text-[#C85A32] flex-shrink-0 font-mono">
                          {dish.price.toFixed(2)} €
                        </span>
                      </div>
                      <p className="text-xs text-[#141311]/65 line-clamp-2 leading-relaxed">{dish.description}</p>
                      {dish.allergens && dish.allergens.length > 0 && (
                        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                          {dish.allergens.map((alg) => (
                            <span
                              key={alg}
                              className="text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#141311]/5 text-[#141311]/60 font-medium"
                            >
                              {alg}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {platosFiltrados.length === 0 && (
                <div className="text-center py-12 text-[#141311]/50 text-sm">
                  No se encontraron platos que coincidan con la búsqueda.
                </div>
              )}
            </div>

            {/* Pie Informativo de la Carta */}
            <div className="p-4 bg-white border-t border-[#141311]/10 flex flex-col sm:flex-row items-center justify-between text-xs text-[#141311]/60 gap-2">
              <span>Precios con IVA incluido · Pescado de lonja sujeto a disponibilidad de bajura.</span>
              <a
                href="#reserva-directa"
                onClick={() => setIsCartaModalOpen(false)}
                className="text-[#C85A32] font-bold hover:underline flex items-center gap-1"
              >
                <span>Reservar mesa para probar estos platos</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ficha Técnica de Plato */}
      {platoDetalle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B0D10]/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#F6F3EC] text-[#141311] w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-[#141311]/15">
            <div className="relative h-64 w-full">
              <Image src={platoDetalle.image} alt={platoDetalle.name} fill className="object-cover" />
              <button
                type="button"
                onClick={() => setPlatoDetalle(null)}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-[#141311]/70 hover:bg-[#141311] text-white flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-start gap-4">
                <h3 className="font-serif text-2xl font-bold">{platoDetalle.name}</h3>
                <span className="font-serif text-2xl font-black text-[#C85A32] flex-shrink-0">
                  {platoDetalle.price.toFixed(2)} €
                </span>
              </div>
              <p className="text-sm text-[#141311]/75 leading-relaxed">{platoDetalle.description}</p>
              {platoDetalle.allergens && (
                <div>
                  <span className="text-xs uppercase tracking-wider text-[#141311]/60 font-bold block mb-1.5">
                    Alérgenos Declarados (Reglamento UE 1169/2011):
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {platoDetalle.allergens.map((alg) => (
                      <span
                        key={alg}
                        className="px-3 py-1 rounded-full text-xs font-medium bg-[#141311]/10 text-[#141311]"
                      >
                        {alg}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <button
                type="button"
                onClick={() => setPlatoDetalle(null)}
                className="w-full py-3 rounded-2xl bg-[#141311] text-[#F6F3EC] font-bold text-xs uppercase tracking-wider hover:bg-[#C85A32] transition"
              >
                Cerrar Ficha
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==============================================================================
         FOOTER INSTITUCIONAL FLUXO
         ============================================================================== */}
      <footer className="bg-[#0B0D10] text-[#E6DFD3] py-16 px-6 md:px-12 border-t border-white/10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
          <div className="space-y-2">
            <span className="font-serif text-2xl font-bold tracking-tight text-[#F6F3EC]">
              {restaurantTitle}
            </span>
            <p className="text-xs text-[#E6DFD3]/60 max-w-sm">
              Gastronomía de lonja y fuego vivo en Noia, Galicia.
            </p>
          </div>

          <div className="text-xs text-[#E6DFD3]/50 space-y-1">
            <p>Rúa Cantón 12, 15200 Noia (A Coruña) · Tel: +34 711 573 870</p>
            <p>© {new Date().getFullYear()} {restaurantTitle}. Todos los derechos reservados.</p>
          </div>

          <div className="flex items-center gap-2 text-xs text-[#E6DFD3]/60">
            <span>Powered by</span>
            <span className="font-extrabold tracking-widest text-[#F6F3EC]">FLUXO</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
