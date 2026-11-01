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
}

const ICONOS_CATEGORIA: Record<string, React.ReactNode> = {
  Entrantes: <Menu className="w-5 h-5" />,
  Mariscos: <Plate className="w-5 h-5" />,
  Pizzas: <Plate className="w-5 h-5" />,
  Principales: <Plate className="w-5 h-5" />,
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
  const [searchParams] = useSearchParams()
  const router = useRouter()
  const slug = (params?.slug as string) || 'taperia-adega-do-pazo'
  const preview = searchParams.get('preview') === '1'

  const [prototipo, setPrototipo] = useState<MenuPrototype | null>(null)
  const [cargando, setCargando] = useState(true)
  const [idioma, setIdioma] = useState<'ES' | 'GAL' | 'EN'>('ES')
  const [alergenoFiltrado, setAlergenoFiltrado] = useState<string>('todos')
  const [busqueda, setBusqueda] = useState('')
  const [platoDetalle, setPlatoDetalle] = useState<MenuPrototypeDish | null>(null)
  const [radarEnviado, setRadarEnviado] = useState(false)

  // ================================================================================
  // HIDRATACIÓN HÍBRIDA: ?d= -> localStorage -> plantilla -> fallback genérico
  // ================================================================================
  useEffect(() => {
    async function cargar() {
      try {
        const dParam = searchParams.get('d')
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
  // PLATOS FILTRADOS
  // ================================================================================
  const platosFiltrados = useMemo(() => {
    if (!prototipo) return []
    return prototipo.platos.filter((p) => {
      const matchSearch = busqueda === '' || p.nombre.toLowerCase().includes(busqueda.toLowerCase()) || p.categoria.toLowerCase().includes(busqueda.toLowerCase())
      if (alergenoFiltrado !== 'todos') {
        if (!p.alergenos.includes(alergenoFiltrado)) return false
      }
      return matchSearch
    })
  }, [prototipo, alergenoFiltrado, busqueda])

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

  return (
    <div className="min-h-screen font-sans text-slate-900" style={{ '--brand-primary': prototipo.color_acento }}>
      {/* Cabecera */}
      <header className="relative px-4 py-6 md:px-8 md:py-10 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold border uppercase tracking-wider border-${prototipo.color_acento}/30 text-${prototipo.color_acento} bg-${prototipo.color_acento}/10`}>
                {prototipo.eslogan}
              </span>
              <h1 className="text-3xl font-black tracking-tight text-slate-900">{prototipo.nombre_local}</h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex gap-1">
                {['ES', 'GAL', 'EN'].map((idi) => (
                  <button
                    key={idi}
                    onClick={() => setIdioma(idi as any)}
                    className={`px-2 py-1 rounded text-[10px] font-bold transition ${idioma === idi ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  >
                    {idi}
                  </button>
                ))}
              </div>
              {prototipo.clave_wifi && (
                <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2 text-sm">
                  <Wifi className="w-4 h-4 text-slate-500" />
                  <span className="font-semibold">{t.interfaz.wifi}: {prototipo.clave_wifi}</span>
                </div>
              )}
              {!preview && (
                <button
                  onClick={() => router.push(`/p/${slug}?preview=1`)}
                  className="text-xs font-bold text-slate-400 hover:text-slate-600 underline underline-offset-4"
                >
                  Vista Previa (CRM)
                </button>
              )}
            </div>
          </div>

          <div className="mt-6 flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text" value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
                placeholder={t.interfaz.buscar}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
              />
            </div>
            <div className="flex gap-1 overflow-x-auto">
              {categorias.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setAlergenoFiltrado('todos')}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${categoriaSeleccionada === cat ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  {ICONOS_CATEGORIA[cat]}
                  <span className="ml-1">{t.categorias[cat] || cat}</span>
                </button>
              ))}
              <button
                onClick={() => setAlergenoFiltrado('todos')}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${alergenoFiltrado === 'todos' ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}
              >
                <ShieldCheck className="w-3 h-3 mr-1" /> {t.interfaz.filtroAlergenos}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Cuerpo: grid de platos */}
      <main className="max-w-4xl mx-auto px-4 py-8 md:px-6">
        {platosFiltrados.length === 0 ? (
          <div className="text-center py-20">
            <Info className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-900">Sin resultados</h3>
            <p className="text-slate-500 mt-1">{busqueda ? 'Ajusta tu búsqueda o filtro de alérgenos' : 'Esta carta aún no tiene platos.'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {platosFiltrados.map((plato) => (
              <article
                key={plato.id}
                className="bg-white border border-slate-200 rounded-3xl p-5 hover:shadow-xl hover:border-blue-300/50 transition-all hover:-translate-y-1 cursor-pointer"
                onClick={() => abrirDetalle(plato)}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-900">{plato.nombre}</h3>
                    <p className="text-xs text-slate-500 mt-0.5 uppercase tracking-wider">{t.categorias[plato.categoria] || plato.categoria}</p>
                  </div>
                  {plato.badge && (
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                      plato.badge === 'Estrella' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                      plato.badge === 'Sugerido' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                      'bg-blue-100 text-blue-700 border-blue-200'
                    }`}
                    >
                      {plato.badge === 'Estrella' && '⭐ Plato Estrella'}
                      {plato.badge === 'Sugerido' && '🔥 Recomendado'}
                      {plato.badge === 'Segun Lonja' && '🌊 Precio según lonja'}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mb-3">{plato.descripcion}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xl font-black font-mono text-slate-900">{plato.precio.toFixed(2)} €</span>
                  <div className="flex gap-1">
                    {plato.alergenos.map((a) => (
                      <span key={a} className="px-2 py-1 rounded text-[10px] font-bold border bg-white/50 border-slate-200 text-slate-600 flex items-center gap-1">
                        {ICONOS_ALERGENO[a]} {ALERGENO_LABEL[a]}
                      </span>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      {/* Footer discreto */}
      <footer className="border-t border-slate-200 bg-white px-4 py-4 md:px-8 md:py-6 text-center">
        <div className="max-w-4xl mx-auto flex flex-col items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
            <Wifi className="w-3 h-3" />
            <span>{prototipo.clave_wifi || 'WiFi disponible en el local'}</span>
          </div>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black">{t.interfaz.sello}</p>
        </div>
      </footer>

      {/* Modal Detalle del Plato */}
      {platoDetalle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={cerrarDetalle}>
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-lg text-slate-900">{platoDetalle.nombre}</h3>
              <button onClick={cerrarDetalle} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100">×</button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-500 uppercase tracking-wider font-bold">{t.categorias[platoDetalle.categoria] || platoDetalle.categoria}</p>
              <p className="text-slate-600">{platoDetalle.descripcion}</p>
              <div className="flex items-center justify-between bg-slate-50 rounded-xl p-4 border border-slate-100">
                <span className="text-lg font-black font-mono text-slate-900">{platoDetalle.precio.toFixed(2)} €</span>
                <div className="flex gap-1">
                  {platoDetalle.alergenos.map((a) => (
                    <span key={a} className="px-2 py-1 rounded text-[10px] font-bold border bg-white border-slate-200 text-slate-600 flex items-center gap-1">
                      {ICONOS_ALERGENO[a]} {ALERGENO_LABEL[a]}
                    </span>
                  ))}
                </div>
              </div>
              {platoDetalle.badge && (
                <div className="flex items-center gap-2 bg-amber-50 rounded-xl p-3 border border-amber-100">
                  <Flame className="w-4 h-4 text-amber-600" />
                  <span className="text-sm font-bold text-amber-700">
                    {platoDetalle.badge === 'Estrella' && 'Plato Estrella de la casa'}
                    {platoDetalle.badge === 'Sugerido' && 'Recomendado por el equipo'}
                    {platoDetalle.badge === 'Segun Lonja' && 'Precio según mercado del día'}
                  </span>
                </div>
              )}
              {/* Venta sugerida pasiva */}
              {maridajeSugerido && (
                <div className="flex items-start gap-3 bg-blue-50 rounded-xl p-4 border border-blue-100">
                  <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">Maridaje recomendado por la casa</p>
                    <p className="text-sm text-slate-700">
                      Acompaña este plato con <span className="font-bold">{maridajeSugerido.nombre}</span> ({maridajeSugerido.precio.toFixed(2)} €).
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
