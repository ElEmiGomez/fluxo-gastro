'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import {
  Search,
  Menu,
  Utensils,
  Wine,
  Coffee,
  Cake,
  
  Flame,
  Star,
  Wifi,
  ShieldCheck,
  Info,
  ArrowLeft,
} from 'lucide-react'
import { MenuPrototype, MenuPrototypeDish } from '@/types/database.types'
import { ProtectedMenuScreen } from '@/components/owner-portal/ProtectedMenuScreen'
import { getPauseLevelBySlug } from '@/lib/billing/crm-demo-seed'

const TEMPLATES: Record<string, MenuPrototype> = {
  'taperia-adega-do-pazo': {
    id: 'tpl-taperia-adega',
    slug: 'taperia-adega-do-pazo',
    nombre_local: 'Tapería Adega do Pazo',
    eslogan: 'Marisco de la Ría y Tapas Gallegas',
    color_acento: '#b91c1c',
    clave_wifi: '',
    platos: [
      { id: '1', nombre: 'Pulpo á Feira con Cachelos', categoria: 'Mariscos', precio: 16.50, badge: 'Estrella', alergenos: [], descripcion: 'Pulpo de la ría con pimentón de la Vera, cachelos y aceite de oliva virgen.' },
      { id: '2', nombre: 'Zamburiñas a la Plancha', categoria: 'Mariscos', precio: 14.00, badge: 'Sugerido', alergenos: ['Moluscos'], descripcion: 'Zamburiñas de la ría a la plancha con ajo y perejil.' },
      { id: '3', nombre: 'Pimientos de Padrón', categoria: 'Entrantes', precio: 7.00, badge: null, alergenos: [], descripcion: 'Pimientos de Padrón fritos con escamas de sal marina.' },
      { id: '4', nombre: 'Raxo con Patatas', categoria: 'Principales', precio: 12.50, badge: null, alergenos: [], descripcion: 'Carne de cerdo adobada con patatas panadera.' },
      { id: '5', nombre: 'Albariño D.O. Rías Baixas', categoria: 'Bebidas', precio: 4.50, badge: null, alergenos: [], descripcion: 'Vino blanco gallego de la zona.' },
      { id: '6', nombre: 'Tarta de Santiago', categoria: 'Postres', precio: 5.50, badge: null, alergenos: ['Frutos Secos'], descripcion: 'Tarta tradicional de almendra con azúcar glass.' },
    ],
    url_destino: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  'pizzeria-mamma-mia': {
    id: 'tpl-pizzeria',
    slug: 'pizzeria-mamma-mia',
    nombre_local: 'Pizzería Mamma Mía',
    eslogan: 'Pizzas al horno de leña y raciones',
    color_acento: '#ea580c',
    clave_wifi: '',
    platos: [
      { id: '1', nombre: 'Pizza Mamma Mía', categoria: 'Pizzas', precio: 11.50, badge: 'Estrella', alergenos: ['Gluten', 'Lácteos'], descripcion: 'Pizza artesanal con mozzarella, tomate y albahaca.' },
      { id: '2', nombre: 'Provolone al Horno', categoria: 'Entrantes', precio: 8.00, badge: 'Sugerido', alergenos: ['Lácteos'], descripcion: 'Queso provolone fundido al horno con orégano.' },
      { id: '3', nombre: 'Calamares a la Romana', categoria: 'Entrantes', precio: 9.50, badge: null, alergenos: ['Gluten', 'Mariscos'], descripcion: 'Calamares rebozados y fritos con limón.' },
      { id: '4', nombre: 'Milanesa Napolitana', categoria: 'Principales', precio: 13.00, badge: null, alergenos: ['Gluten', 'Lácteos', 'Huevos'], descripcion: 'Milanesa de ternera con jamón, queso y salsa.' },
      { id: '5', nombre: 'Cerveza Estrella Galicia 1906', categoria: 'Bebidas', precio: 2.50, badge: null, alergenos: ['Gluten'], descripcion: 'Cerveza gallega bien fría.' },
      { id: '6', nombre: 'Tiramisú Casero', categoria: 'Postres', precio: 5.00, badge: null, alergenos: ['Lácteos', 'Huevos'], descripcion: 'Tiramisú italiano con café y cacao.' },
    ],
    url_destino: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  'bar-jaratusas': {
    id: 'tpl-jaratusas',
    slug: 'bar-jaratusas',
    nombre_local: 'Bar Jara-Tusas',
    eslogan: 'Café, Cervezas, Vermús y Tapas en Noia',
    color_acento: '#f59e0b',
    clave_wifi: '',
    platos: [],
    url_destino: '/carta-jaratusas',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  'jara-tusas': {
    id: 'tpl-jaratusas-alt',
    slug: 'jara-tusas',
    nombre_local: 'Bar Jara-Tusas',
    eslogan: 'Café, Cervezas, Vermús y Tapas en Noia',
    color_acento: '#f59e0b',
    clave_wifi: '',
    platos: [],
    url_destino: '/carta-jaratusas',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
}

const ICONOS_CATEGORIA: Record<string, React.ReactNode> = {
  Entrantes: <Menu className="w-5 h-5" />,
  Mariscos: <Utensils className="w-5 h-5" />,
  Pizzas: <Utensils className="w-5 h-5" />,
  Principales: <Utensils className="w-5 h-5" />,
  Bebidas: <Wine className="w-5 h-5" />,
  Postres: <Cake className="w-5 h-5" />,
  Brunch: <Coffee className="w-5 h-5" />,
}

const ICONOS_ALERGENO: Record<string, React.ReactNode> = {
  Gluten: <Flame className="w-3 h-3" />,
  Moluscos: <Shellfish className="w-3 h-3" />,
  Crustáceos: <Shellfish className="w-3 h-3" />,
  Pescado: <Wine className="w-3 h-3" />,
  Lácteos: <Wine className="w-3 h-3" />,
  Huevos: <Flame className="w-3 h-3" />,
  'Frutos Secos': <Star className="w-3 h-3" />,
}

function Shellfish() { return <Utensils className="w-3 h-3" /> }

const ALERGENO_LABEL: Record<string, string> = {
  Gluten: 'Gluten',
  Moluscos: 'Mariscos/Moluscos',
  Crustáceos: 'Mariscos/Crustáceos',
  Pescado: 'Pescado',
  Lácteos: 'Lácteos',
  Huevos: 'Huevos',
  'Frutos Secos': 'Frutos Secos',
}

const IDIOMAS: Record<string, Record<string, string>> = {
  ES: { categorias: { Entrantes: 'Entrantes', Mariscos: 'Mariscos', Pizzas: 'Pizzas', Principales: 'Principales', Bebidas: 'Bebidas', Postres: 'Postres', Brunch: 'Brunch', Carta: 'Carta' }, interfaz: { buscar: 'Buscar platos', filtroAlergenos: 'Filtrar alérgenos', wifi: 'WiFi', sello: 'Carta Digital Interactiva · Fluxo' } },
  GAL: { categorias: { Entrantes: 'Entrantes', Mariscos: 'Mariscos', Pizzas: 'Pizzas', Principales: 'Principais', Bebidas: 'Bebidas', Postres: 'Postres', Brunch: 'Brunch', Carta: 'Carta' }, interfaz: { buscar: 'Buscar pratos', filtroAlergenos: 'Filtrar alerxenos', wifi: 'WiFi', sello: 'Carta Dixital Interactiva · Fluxo' } },
  EN: { categorias: { Entrantes: 'Starters', Mariscos: 'Seafood', Pizzas: 'Pizzas', Principales: 'Main', Bebidas: 'Drinks', Postres: 'Desserts', Brunch: 'Brunch', Carta: 'Menu' }, interfaz: { buscar: 'Search dishes', filtroAlergenos: 'Filter allergens', wifi: 'WiFi', sello: 'Digital Interactive Menu · Fluxo' } },
}

export default function CartaPrototipoPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const slug = (params?.slug as string) || 'taperia-adega-do-pazo'
  const preview = searchParams?.get('preview') === '1'

  const [prototipo, setPrototipo] = useState<MenuPrototype | null>(null)
  const [cargando, setCargando] = useState(true)
  const [idioma, setIdioma] = useState<'ES' | 'GAL' | 'EN'>('ES')
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string>('todas')
  const [alergenoFiltrado, setAlergenoFiltrado] = useState<string>('todos')
  const [busqueda, setBusqueda] = useState('')
  const [platoDetalle, setPlatoDetalle] = useState<MenuPrototypeDish | null>(null)
  const [radarEnviado, setRadarEnviado] = useState(false)
  // Mantenimiento Protegido (pause_level === 2): estado post-carga para evitar
  // hydration mismatch en la hidratación híbrida de la carta.
  const [enMantenimiento, setEnMantenimiento] = useState(false)

  // ================================================================================
  // HIDRATACIÓN HÍBRIDA: ?d= -> localStorage -> plantilla -> fallback genérico
  // ================================================================================
  useEffect(() => {
    async function cargar() {
      try {
        const dParam = searchParams?.get('d')
        if (dParam) {
          try {
            const decoded = JSON.parse(decodeURIComponent(dParam))
            if (decoded.nombre_local) {
              setPrototipo(decoded as MenuPrototype)
              setCargando(false)
              return
            }
          } catch {}
        }
        if (typeof window !== 'undefined') {
          const stored = localStorage.getItem('fluxo_crm_prototypes_v1')
          if (stored) {
            const prototipos: MenuPrototype[] = JSON.parse(stored)
            const encontrado = prototipos.find((p) => p.slug === slug)
            if (encontrado) { setPrototipo(encontrado); setCargando(false); return }
          }
        }
        const plantilla = TEMPLATES[slug]
        if (plantilla) { setPrototipo(plantilla); setCargando(false); return }
        setPrototipo({
          id: 'generic', slug, nombre_local: 'Carta Digital', eslogan: 'Menú disponible pronto',
          color_acento: '#2563eb', clave_wifi: '', platos: [], url_destino: null,
          created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
        })
        setCargando(false)
      } catch { setCargando(false) }
    }
    cargar()
  }, [slug, searchParams])

  // ================================================================================
  // RADAR SILENCIOSO: solo si NO es preview=1 (es escaneo real del QR)
  // ================================================================================
  useEffect(() => {
    if (preview) return
    const sessionKey = `fluxo_radar_${slug}`
    if (typeof window !== 'undefined' && !sessionStorage.getItem(sessionKey)) {
      sessionStorage.setItem(sessionKey, '1')
      const ua = navigator.userAgent
      let dispositivo = 'Escritorio'
      if (/iPhone|iPad|iPod/.test(ua)) dispositivo = 'iPhone / iOS'
      else if (/Android/.test(ua)) dispositivo = 'Android'
      fetch('/api/crm/prototype-radar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, localName: prototipo?.nombre_local || '', userAgent: ua, source: 'qr_scan' }),
      }).catch(() => {})
      setRadarEnviado(true)
    }
  }, [slug, preview, prototipo?.nombre_local])

  // ================================================================================
  // PAUSA EN 2 NIVELES: si pause_level === 2, la carta pública se oculta
  // (Mantenimiento Protegido, jamás se mencionan impagos).
  // ================================================================================
  useEffect(() => {
    if (cargando) return
    setEnMantenimiento(getPauseLevelBySlug(slug) === 2)
  }, [slug, cargando])

  // ================================================================================
  // PLATOS FILTRADOS
  // ================================================================================
  const platosFiltrados = useMemo(() => {
    if (!prototipo) return []
    return prototipo.platos.filter((p) => {
      const matchSearch = busqueda === '' || p.nombre.toLowerCase().includes(busqueda.toLowerCase()) || p.categoria.toLowerCase().includes(busqueda.toLowerCase())
      const matchCategory = categoriaSeleccionada === 'todas' || p.categoria === categoriaSeleccionada
      if (!matchCategory) return false
      if (alergenoFiltrado !== 'todos') {
        if (!p.alergenos.includes(alergenoFiltrado)) return false
      }
      return matchSearch
    })
  }, [prototipo, categoriaSeleccionada, alergenoFiltrado, busqueda])

  const categorias = useMemo(() => {
    if (!prototipo) return ['todas']
    return ['todas', ...new Set(prototipo.platos.map((p) => p.categoria))]
  }, [prototipo])

  const t = IDIOMAS[idioma]

  const abrirDetalle = (plato: MenuPrototypeDish) => { setPlatoDetalle(plato) }
  const cerrarDetalle = () => setPlatoDetalle(null)

  // Maridaje sugerido: buscar bebida o postre de la misma carta
  const maridajeSugerido = useMemo(() => {
    if (!platoDetalle || !prototipo) return null
    const otros = prototipo.platos.filter((p) => p.id !== platoDetalle.id && (p.categoria === 'Bebidas' || p.categoria === 'Postres'))
    if (otros.length === 0) return null
    return otros[Math.floor(Math.random() * otros.length)]
  }, [platoDetalle, prototipo])

  if (cargando) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-mono text-slate-500">Cargando carta...</p>
        </div>
      </div>
    )
  }

  if (!prototipo) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900">Carta no disponible</h1>
          <button onClick={() => router.push('/admin/crm')} className="mt-4 px-4 py-2 rounded-xl bg-slate-900 text-white text-sm">Volver al CRM</button>
        </div>
      </div>
    )
  }

  // Mantenimiento Protegido (pause_level === 2): pantalla Apple Glass, sin
  // mención pública de impagos ni datos internos.
  if (enMantenimiento) {
    return (
      <ProtectedMenuScreen
        localName={prototipo.nombre_local}
        accentColor={prototipo.color_acento}
      />
    )
  }

  // Vista interactiva con paridad total de diseño (plantilla oficial de Fluxo / Casa Mar / Jaratusas)
  // Embebe la experiencia autónoma optimizada con carrito, personalizador de platos y carrusel de categorías
  const isCasaMar = slug.includes('casamar') || slug.includes('casa-mar')
  const isJaratusas = slug.includes('jaratusa') || slug.includes('jara-tusa')
  const queryString = searchParams?.toString() ? `?${searchParams.toString()}` : ''
  const menuSource = isJaratusas
    ? `/carta-jaratusas${queryString}`
    : isCasaMar
    ? `/carta-casamar${queryString}`
    : `/carta-prototipo?slug=${slug}${queryString ? `&${searchParams.toString()}` : ''}`

  return (
    <div className="fixed inset-0 w-full h-full bg-slate-50 overflow-hidden">
      <iframe
        src={menuSource}
        title={`Carta Digital Interactiva - ${prototipo.nombre_local}`}
        className="w-full h-full border-none"
      />
    </div>
  )
}
