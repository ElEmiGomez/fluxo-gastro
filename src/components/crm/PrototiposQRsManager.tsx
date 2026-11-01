'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import {
  QrCode,
  Download,
  Copy,
  Plus,
  Edit3,
  Trash2,
  Image,
  FileText,
  AlertCircle,
  RefreshCw,
  Link,
  Store,
  Sparkles,
  Link as LinkIcon,
  Image as ImageIcon,
  FileText as FileTextIcon,
  CheckCircle,
  Loader2,
} from 'lucide-react'
import { MenuPrototype, MenuPrototypeDish } from '@/types/database.types'
import { createBrowserClient } from '@/lib/supabase/client'

// ================================================================================
// PLANTILLAS RÁPIDAS (1 clic)
// ================================================================================

const PLANTILLAS_RAPIDAS: Record<string, Omit<MenuPrototype, 'id' | 'slug' | 'created_at' | 'updated_at'>> = {
  'tapería': {
    nombre_local: 'Tapería & Marisquería Gallega',
    eslogan: 'Marisco de la Ría y Tapas Tradicionales',
    color_acento: '#b91c1c',
    clave_wifi: '',
    platos: [
      { id: 'p1', nombre: 'Berberechos de la Ría al Vapor', categoria: 'Entrantes', precio: 8.50, badge: null, alergenos: ['Moluscos'] },
      { id: 'p2', nombre: 'Pulpo á Feira con Cachelos', categoria: 'Mariscos', precio: 16.50, badge: 'Estrella', alergenos: [] },
      { id: 'p3', nombre: 'Zamburiñas a la Plancha', categoria: 'Mariscos', precio: 14.00, badge: 'Sugerido', alergenos: ['Moluscos'] },
      { id: 'p4', nombre: 'Pimientos de Padrón', categoria: 'Entrantes', precio: 7.00, badge: null, alergenos: [] },
      { id: 'p5', nombre: 'Raxo con Patatas', categoria: 'Principales', precio: 12.50, badge: null, alergenos: [] },
      { id: 'p6', nombre: 'Albariño D.O. Rías Baixas', categoria: 'Bebidas', precio: 4.50, badge: null, alergenos: [] },
      { id: 'p7', nombre: 'Tarta de Santiago', categoria: 'Postres', precio: 5.50, badge: null, alergenos: ['Frutos Secos'] },
    ],
  },
  'pizzería': {
    nombre_local: 'Pizzería & Raciones',
    eslogan: 'Pizzas al horno de leña y raciones para compartir',
    color_acento: '#ea580c',
    clave_wifi: '',
    platos: [
      { id: 'p1', nombre: 'Pizza Mamma Mía', categoria: 'Pizzas', precio: 11.50, badge: 'Estrella', alergenos: ['Gluten', 'Lácteos'] },
      { id: 'p2', nombre: 'Provolone al Horno', categoria: 'Entrantes', precio: 8.00, badge: 'Sugerido', alergenos: ['Lácteos'] },
      { id: 'p3', nombre: 'Calamares a la Romana', categoria: 'Entrantes', precio: 9.50, badge: null, alergenos: ['Gluten', 'Mariscos'] },
      { id: 'p4', nombre: 'Milanesa Napolitana', categoria: 'Principales', precio: 13.00, badge: null, alergenos: ['Gluten', 'Lácteos', 'Huevos'] },
      { id: 'p5', nombre: 'Cerveza Estrella Galicia 1906', categoria: 'Bebidas', precio: 2.50, badge: null, alergenos: ['Gluten'] },
      { id: 'p6', nombre: 'Tiramisú Casero', categoria: 'Postres', precio: 5.00, badge: null, alergenos: ['Lácteos', 'Huevos'] },
    ],
  },
  'cafetería': {
    nombre_local: 'Cafetería & Brunch',
    eslogan: 'Café de especialidad y brunch todo el día',
    color_acento: '#0f766e',
    clave_wifi: '',
    platos: [
      { id: 'p1', nombre: 'Café de Especialidad', categoria: 'Bebidas', precio: 1.80, badge: null, alergenos: ['Lácteos'] },
      { id: 'p2', nombre: 'Tostada de Aguacate y Salmón', categoria: 'Brunch', precio: 7.50, badge: 'Sugerido', alergenos: ['Gluten', 'Pescado'] },
      { id: 'p3', nombre: 'Tortilla Jugosa', categoria: 'Brunch', precio: 5.50, badge: null, alergenos: ['Huevos'] },
      { id: 'p4', nombre: 'Croissant a la Plancha', categoria: 'Brunch', precio: 3.50, badge: null, alergenos: ['Gluten', 'Lácteos', 'Huevos'] },
      { id: 'p5', nombre: 'Zumo Natural de Naranja', categoria: 'Bebidas', precio: 3.00, badge: null, alergenos: [] },
      { id: 'p6', nombre: 'Brownie de Chocolate', categoria: 'Postres', precio: 4.50, badge: null, alergenos: ['Gluten', 'Lácteos', 'Huevos', 'Frutos Secos'] },
    ],
  },
}

// ================================================================================
// UTIL: Compresión de imagen en cliente (canvas 1600px, JPEG 82%)
// ================================================================================

function comprimirImagen(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new (window as any).Image()
    img.src = URL.createObjectURL(file)
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const maxDim = 1600
      let { width, height } = img
      if (width > height && width > maxDim) {
        height = (height * maxDim) / width
        width = maxDim
      } else if (height > maxDim) {
        width = (width * maxDim) / height
        height = maxDim
      }
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) { reject(new Error('Sin contexto canvas')); return }
      ctx.drawImage(img, 0, 0, width, height)
      resolve(canvas.toDataURL('image/jpeg', 0.82))
      URL.revokeObjectURL(img.src)
    }
    img.onerror = () => reject(new Error('Error cargando imagen'))
  })
}

// ================================================================================
// COMPONENTE PRINCIPAL
// ================================================================================

export default function PrototiposQRsManager() {
  const [prototipos, setPrototipos] = useState<MenuPrototype[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [exito, setExito] = useState<string | null>(null)

  // QR Maestro
  const [qrMaestroUrl, setQrMaestroUrl] = useState('https://fluxo-gastro.vercel.app/carta-prototipo')

  // Modal crear prototipo
  const [modalCrearAbierto, setModalCrearAbierto] = useState(false)
  const [nuevoSlug, setNuevoSlug] = useState('')
  const [nuevoNombre, setNuevoNombre] = useState('')
  const [nuevoEslogan, setNuevoEslogan] = useState('')
  const [nuevoColor, setNuevoColor] = useState('#2563eb')
  const [nuevoClaveWifi, setNuevoClaveWifi] = useState('')
  const [plantillaSeleccionada, setPlantillaSeleccionada] = useState<string | null>(null)

  // Modal editar prototipo
  const [protEditar, setProtEditar] = useState<MenuPrototype | null>(null)

  // === Importador omnicanal ===
  const [importTab, setImportTab] = useState<'url' | 'fotos' | 'texto'>('url')
  const [importUrl, setImportUrl] = useState('')
  const [importTexto, setImportTexto] = useState('')
  const [importImagenes, setImportImagenes] = useState<File[]>([])
  const [importPreviewImgs, setImportPreviewImgs] = useState<string[]>([])
  const [importando, setImportando] = useState(false)
  const [importResultado, setImportResultado] = useState<{ localName?: string; tagline?: string; platos: MenuPrototypeDish[]; categorias: string[]; resumen: string } | null>(null)

  // Cargar prototipos desde localStorage + Supabase
  useEffect(() => {
    async function cargar() {
      setCargando(true)
      try {
        if (typeof window !== 'undefined') {
          const stored = localStorage.getItem('fluxo_crm_prototypes_v1')
          const casaMarDefault: MenuPrototype = {
            id: 'proto-casamar',
            slug: 'casamar-da-vila',
            nombre_local: 'Casa Mar da Vila',
            eslogan: 'Pescados, Mariscos y Arroces de la Ría',
            color_acento: '#06b6d4',
            clave_wifi: '',
            platos: [
              { id: 'p1', nombre: 'Arroz con Bogavante', categoria: 'Arroces', precio: 24.00, badge: 'Estrella', alergenos: ['Mariscos'] },
              { id: 'p2', nombre: 'Zamburiñas a la Plancha', categoria: 'Mariscos', precio: 16.00, badge: 'Sugerido', alergenos: ['Moluscos'] },
              { id: 'p3', nombre: 'Pulpo á Feira con Cachelos', categoria: 'Mariscos', precio: 18.00, badge: 'Estrella', alergenos: [] },
              { id: 'p4', nombre: 'Rodaballo Salvaje a la Brasa', categoria: 'Pescados', precio: 26.00, badge: null, alergenos: ['Pescado'] },
              { id: 'p5', nombre: 'Albariño Casa Mar Selección', categoria: 'Bebidas', precio: 19.50, badge: null, alergenos: [] },
            ],
            url_destino: '/casamar-da-vila',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
          if (stored) {
            const data: MenuPrototype[] = JSON.parse(stored)
            if (!data.some((p) => p.slug === 'casamar-da-vila' || p.id === 'proto-casamar')) {
              data.unshift(casaMarDefault)
              try { localStorage.setItem('fluxo_crm_prototypes_v1', JSON.stringify(data)) } catch {}
            }
            setPrototipos(data)
          } else {
            const defaults: MenuPrototype[] = [
              casaMarDefault,
              {
                id: 'proto-taperia',
                slug: 'taperia-adega-do-pazo',
                nombre_local: 'Tapería Adega do Pazo',
                eslogan: 'Marisco de la Ría y Tapas Gallegas',
                color_acento: '#b91c1c',
                clave_wifi: '',
                platos: [
                  { id: 'p1', nombre: 'Pulpo á Feira con Cachelos', categoria: 'Mariscos', precio: 16.50, badge: 'Estrella', alergenos: [] },
                  { id: 'p2', nombre: 'Zamburiñas a la Plancha', categoria: 'Mariscos', precio: 14.00, badge: 'Sugerido', alergenos: [] },
                  { id: 'p3', nombre: 'Pimientos de Padrón', categoria: 'Entrantes', precio: 7.00, badge: null, alergenos: [] },
                  { id: 'p4', nombre: 'Raxo con Patatas', categoria: 'Principales', precio: 12.50, badge: null, alergenos: [] },
                  { id: 'p5', nombre: 'Albariño D.O. Rías Baixas', categoria: 'Bebidas', precio: 4.50, badge: null, alergenos: [] },
                  { id: 'p6', nombre: 'Tarta de Santiago', categoria: 'Postres', precio: 5.50, badge: null, alergenos: ['Frutos Secos'] },
                ],
                url_destino: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
              {
                id: 'proto-pizzeria',
                slug: 'pizzeria-mamma-mia',
                nombre_local: 'Pizzería Mamma Mía',
                eslogan: 'Pizzas al horno de leña y raciones',
                color_acento: '#ea580c',
                clave_wifi: '',
                platos: [
                  { id: 'p1', nombre: 'Pizza Mamma Mía', categoria: 'Pizzas', precio: 11.50, badge: 'Estrella', alergenos: ['Gluten', 'Lácteos'] },
                  { id: 'p2', nombre: 'Provolone al Horno', categoria: 'Entrantes', precio: 8.00, badge: 'Sugerido', alergenos: ['Lácteos'] },
                  { id: 'p3', nombre: 'Calamares a la Romana', categoria: 'Entrantes', precio: 9.50, badge: null, alergenos: ['Gluten', 'Mariscos'] },
                  { id: 'p4', nombre: 'Milanesa Napolitana', categoria: 'Principales', precio: 13.00, badge: null, alergenos: ['Gluten', 'Lácteos', 'Huevos'] },
                  { id: 'p5', nombre: 'Cerveza Estrella Galicia 1906', categoria: 'Bebidas', precio: 2.50, badge: null, alergenos: ['Gluten'] },
                  { id: 'p6', nombre: 'Tiramisú Casero', categoria: 'Postres', precio: 5.00, badge: null, alergenos: ['Lácteos', 'Huevos'] },
                ],
                url_destino: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
            ]
            setPrototipos(defaults)
            try { localStorage.setItem('fluxo_crm_prototypes_v1', JSON.stringify(defaults)) } catch {}
          }
        }

        const supabase = createBrowserClient()
        if (supabase) {
          try {
            const { data, error: supErr } = await supabase
              .from('menu_prototypes')
              .select('*')
              .order('created_at', { ascending: false })
            if (!supErr && data && data.length > 0) {
              const fromDb: MenuPrototype[] = data.map((d: any) => ({
                id: d.id,
                slug: d.slug,
                nombre_local: d.nombre_local,
                eslogan: d.eslogan || '',
                color_acento: d.color_acento || '#2563eb',
                clave_wifi: d.clave_wifi || '',
                platos: d.platos || [],
                url_destino: d.url_destino || null,
                created_at: d.created_at,
                updated_at: d.updated_at,
              }))
              setPrototipos((prev) => {
                const idsDb = new Set(fromDb.map((p) => p.id))
                const nuevos = fromDb.filter((p) => !prev.some((pp) => pp.id === p.id))
                return [...prev, ...nuevos]
              })
            }
          } catch { /* Supabase no configurado */ }
        }
      } catch (err: any) {
        setError(err.message || 'Error cargando prototipos')
      } finally {
        setCargando(false)
      }
    }
    cargar()
  }, [])

  const guardarLocalStorage = useCallback((datos: MenuPrototype[]) => {
    try { localStorage.setItem('fluxo_crm_prototypes_v1', JSON.stringify(datos)) } catch {}
  }, [])

  const generarSlug = useCallback((nombre: string): string => {
    return nombre
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 60)
  }, [])

  const aplicarPlantilla = useCallback((key: keyof typeof PLANTILLAS_RAPIDAS) => {
    const t = PLANTILLAS_RAPIDAS[key]
    setNuevoNombre(t.nombre_local)
    setNuevoEslogan(t.eslogan)
    setNuevoColor(t.color_acento)
    setPlantillaSeleccionada(key)
    setNuevoSlug(generarSlug(t.nombre_local))
  }, [generarSlug])

  const manejarCrearPrototipo = () => {
    if (!nuevoSlug || !nuevoNombre) { setError('Slug y nombre son obligatorios'); return }
    if (prototipos.some((p) => p.slug === nuevoSlug)) { setError('Ya existe un prototipo con ese slug'); return }

    const platosIniciales = plantillaSeleccionada ? PLANTILLAS_RAPIDAS[plantillaSeleccionada as keyof typeof PLANTILLAS_RAPIDAS].platos : []

    const nuevo: MenuPrototype = {
      id: 'proto-' + Date.now(),
      slug: nuevoSlug,
      nombre_local: nuevoNombre,
      eslogan: nuevoEslogan,
      color_acento: nuevoColor,
      clave_wifi: nuevoClaveWifi,
      platos: platosIniciales,
      url_destino: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const actualizados = [nuevo, ...prototipos]
    setPrototipos(actualizados)
    guardarLocalStorage(actualizados)
    setModalCrearAbierto(false)
    setNuevoSlug(''); setNuevoNombre(''); setNuevoEslogan(''); setNuevoColor('#2563eb'); setNuevoClaveWifi(''); setPlantillaSeleccionada(null)
    setExito(`Carta prototipo "${nuevoNombre}" creada. Ruta: /p/${nuevoSlug}`)
    setTimeout(() => setExito(null), 4000)
  }

  const eliminarPrototipo = (id: string) => {
    if (!confirm('¿Eliminar este prototipo de carta?')) return
    const actualizados = prototipos.filter((p) => p.id !== id)
    setPrototipos(actualizados)
    guardarLocalStorage(actualizados)
    setExito('Prototipo eliminado')
    setTimeout(() => setExito(null), 3000)
  }

  const descargarQR = (texto: string, nombreArchivo: string) => {
    const canvas = document.createElement('canvas')
    canvas.width = 1000; canvas.height = 1000
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, 1000, 1000)
    ctx.fillStyle = '#000000'
    const size = 40; const margen = 60
    const datos = texto.split('')
    for (let i = 0; i < datos.length; i++) {
      const x = margen + (i % 20) * size
      const y = margen + Math.floor(i / 20) * size
      if (datos[i].charCodeAt(0) % 2 === 0) ctx.fillRect(x, y, size, size)
    }
    ctx.fillStyle = '#2563eb'; ctx.font = 'bold 200px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.fillText('F.', 500, 500)
    const url = canvas.toDataURL('image/png')
    const a = document.createElement('a')
    a.href = url; a.download = nombreArchivo
    document.body.appendChild(a); a.click(); document.body.removeChild(a)
  }

  const descargarTentCard = (prototipo: MenuPrototype) => {
    const canvas = document.createElement('canvas')
    canvas.width = 1200; canvas.height = 1800
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, 1200, 1800)
    ctx.fillStyle = prototipo.color_acento; ctx.fillRect(0, 0, 1200, 200)
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 48px sans-serif'; ctx.textAlign = 'center'
    ctx.fillText(prototipo.nombre_local, 600, 130)
    ctx.font = '24px sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.fillText(prototipo.eslogan, 600, 170)
    ctx.fillStyle = '#000000'; ctx.font = 'bold 28px sans-serif'; ctx.fillText('Escanea y pide desde tu mesa', 600, 450)
    ctx.font = '20px sans-serif'; ctx.fillStyle = '#666666'; ctx.fillText('sin esperas ni aplicaciones', 600, 490)
    const qrSize = 400; const qrX = 600 - qrSize / 2; const qrY = 550
    ctx.fillStyle = '#000000'
    const shortUrl = prototipo.url_destino
      ? (prototipo.url_destino.startsWith('http') ? prototipo.url_destino : `${window.location.origin}${prototipo.url_destino}`)
      : `${window.location.origin}/p/${prototipo.slug}`
    const datos = shortUrl.split('')
    const cellSize = 20
    for (let i = 0; i < datos.length; i++) {
      const x = qrX + (i % 20) * cellSize
      const y = qrY + Math.floor(i / 20) * cellSize
      if (datos[i].charCodeAt(0) % 2 === 0) ctx.fillRect(x, y, cellSize, cellSize)
    }
    ctx.fillStyle = '#333333'; ctx.font = 'bold 20px monospace'; ctx.textAlign = 'center'
    ctx.fillText(shortUrl, 600, 1420)
    if (prototipo.clave_wifi) {
      ctx.fillStyle = '#2563eb'; ctx.font = 'bold 24px sans-serif'; ctx.fillText('WiFi:', 600, 1560)
      ctx.fillStyle = '#000000'; ctx.font = '20px sans-serif'; ctx.fillText(prototipo.clave_wifi, 600, 1600)
    }
    ctx.fillStyle = '#999999'; ctx.font = '16px sans-serif'; ctx.fillText('Powered by Fluxo — Sistema Gastronómico', 600, 1720)
    const url = canvas.toDataURL('image/png')
    const a = document.createElement('a')
    a.href = url; a.download = `tent-card-${prototipo.slug}.png`
    document.body.appendChild(a); a.click(); document.body.removeChild(a)
  }

  // ================================================================================
  // IMPORTADOR OMNICANAL
  // ================================================================================

  const manejarImportarUrl = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!importUrl) { setError('Pega una URL válida'); return }
    setImportando(true); setError(null)
    try {
      const res = await fetch('/api/crm/parse-prototype-menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: importUrl }),
      })
      if (!res.ok) throw new Error('Error extrayendo carta de la URL')
      const data = await res.json()
      setImportResultado({
        localName: data.localName,
        tagline: data.tagline,
        platos: data.platos || [],
        categorias: data.categorias || [],
        resumen: data.resumen || 'Carta importada',
      })
      setExito(data.resumen || '✅ Carta importada desde URL')
      setTimeout(() => setExito(null), 4000)
    } catch (err: any) {
      setError(err.message || 'Error importando desde URL')
    } finally { setImportando(false) }
  }

  const manejarImportarFotos = async (e: React.FormEvent) => {
    e.preventDefault()
    if (importImagenes.length === 0) { setError('Selecciona al menos 1 foto'); return }
    setImportando(true); setError(null)
    try {
      const imagenesBase64: string[] = []
      for (const file of importImagenes) {
        const b64 = await comprimirImagen(file)
        imagenesBase64.push(b64)
      }
      const res = await fetch('/api/crm/parse-prototype-menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images: imagenesBase64 }),
      })
      if (!res.ok) throw new Error('Error procesando imágenes')
      const data = await res.json()
      setImportResultado({
        localName: data.localName,
        tagline: data.tagline,
        platos: data.platos || [],
        categorias: data.categorias || [],
        resumen: data.resumen || 'Imágenes procesadas',
      })
      setExito(data.mensaje || data.resumen || '✅ Fotos procesadas')
      setTimeout(() => setExito(null), 4000)
    } catch (err: any) {
      setError(err.message || 'Error procesando fotos')
    } finally { setImportando(false) }
  }

  const manejarImportarTexto = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!importTexto.trim()) { setError('Pega texto o JSON'); return }
    setImportando(true); setError(null)
    try {
      const res = await fetch('/api/crm/parse-prototype-menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText: importTexto }),
      })
      if (!res.ok) throw new Error('Error adaptando texto')
      const data = await res.json()
      setImportResultado({
        localName: data.localName,
        tagline: data.tagline,
        platos: data.platos || [],
        categorias: data.categorias || [],
        resumen: data.resumen || 'Texto adaptado',
      })
      setExito(data.resumen || '✅ Texto adaptado al menú Fluxo')
      setTimeout(() => setExito(null), 4000)
    } catch (err: any) {
      setError(err.message || 'Error adaptando texto')
    } finally { setImportando(false) }
  }

  const aplicarResultadoImportacion = () => {
    if (!importResultado) return
    const slugBase = generarSlug(importResultado.localName || 'carta-prototipo')
    const slugExistente = prototipos.some((p) => p.slug === slugBase)
    const slugFinal = slugExistente ? `${slugBase}-${Date.now()}` : slugBase

    const nuevo: MenuPrototype = {
      id: 'proto-import-' + Date.now(),
      slug: slugFinal,
      nombre_local: importResultado.localName || 'Nueva Carta',
      eslogan: importResultado.tagline || '',
      color_acento: '#2563eb',
      clave_wifi: '',
      platos: importResultado.platos,
      url_destino: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const actualizados = [nuevo, ...prototipos]
    setPrototipos(actualizados)
    guardarLocalStorage(actualizados)
    setImportResultado(null)
    setImportTab('url')
    setImportUrl(''); setImportTexto(''); setImportImagenes([]); setImportPreviewImgs([])
    setExito(`Carta "${nuevo.nombre_local}" creada con ${nuevo.platos.length} platos. Ruta: /p/${slugFinal}`)
    setTimeout(() => setExito(null), 5000)
  }

  const onDropImagenes = (files: FileList) => {
    const arr = Array.from(files).filter((f) => f.type.startsWith('image/'))
    if (arr.length > 5) { setError('Máximo 5 fotos'); return }
    setImportImagenes(arr)
    const previews: string[] = []
    arr.forEach((f) => { previews.push(URL.createObjectURL(f)) })
    setImportPreviewImgs(previews)
  }

  // ================================================================================
  // RENDER
  // ================================================================================

  return (
    <div className="space-y-8">
      {/* Cabecera sección */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
            <QrCode className="w-6 h-6 text-purple-600" />
            Prototipos & QRs
          </h2>
          <p className="text-slate-600 text-sm">
            Cartas prototipo para ventas en terreno y QR maestro para imprimir.
          </p>
        </div>
        {exito && (
          <div className="px-4 py-2 rounded-xl bg-green-50 border border-green-200 text-green-800 text-sm font-medium flex items-center gap-2">
            <CheckCircle className="w-4 h-4" /> {exito}
          </div>
        )}
        {error && (
          <div className="px-4 py-2 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}
      </div>

      {/* QR Maestro */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
          <div>
            <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
              <Store className="w-5 h-5 text-purple-600" />
              QR Maestro Predeterminado
            </h3>
            <p className="text-slate-500 text-sm mt-1">
              Carta demo estándar de Fluxo para enseñar en frío a cualquier local.
            </p>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <button
              onClick={() => { navigator.clipboard.writeText(qrMaestroUrl); setExito('Enlace demo copiado'); setTimeout(() => setExito(null), 3000) }}
              className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold text-sm hover:bg-slate-200 flex items-center gap-2"
            >
              <Copy className="w-4 h-4" /> Copiar Enlace
            </button>
            <button
              onClick={() => descargarQR(qrMaestroUrl, 'qr-maestro-fluxo.png')}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 flex items-center gap-2"
            >
              <Download className="w-4 h-4" /> Descargar QR PNG
            </button>
          </div>
        </div>
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-slate-50 rounded-2xl p-6 border border-slate-100">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">URL de destino del QR Maestro</label>
            <input
              type="url" value={qrMaestroUrl} onChange={(e) => setQrMaestroUrl(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-sm font-mono"
            />
          </div>
          <div className="flex-1 max-w-md flex items-center justify-center">
            <div className="w-48 h-48 bg-white border-4 border-slate-200 rounded-2xl flex items-center justify-center p-2 shadow-inner relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20" />
              <div className="relative z-10 w-full h-full flex items-center justify-center">
                <QrCode className="w-32 h-32 text-black" />
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-white p-1 rounded-full text-2xl font-black text-blue-600 shadow-lg">F.</div>
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-500 text-center font-mono">{qrMaestroUrl}</p>
          </div>
        </div>
      </div>

      {/* Importador omnicanal */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              Importar Carta (Modo Café)
            </h3>
            <p className="text-slate-500 text-sm mt-1">
              Pega un link, sube fotos o pega texto. El sistema adapta la carta al formato Fluxo.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setImportTab('url')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${importTab === 'url' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              <LinkIcon className="w-4 h-4" /> Desde Link
            </button>
            <button
              onClick={() => setImportTab('fotos')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${importTab === 'fotos' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              <ImageIcon className="w-4 h-4" /> Desde Fotos
            </button>
            <button
              onClick={() => setImportTab('texto')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${importTab === 'texto' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              <FileTextIcon className="w-4 h-4" /> Pegar Texto
            </button>
          </div>
        </div>

        {/* Pestaña URL */}
        {importTab === 'url' && (
          <form onSubmit={manejarImportarUrl} className="mt-6 space-y-3">
            <div className="flex gap-2">
              <input
                type="url" value={importUrl} onChange={(e) => setImportUrl(e.target.value)}
                placeholder="https://restaurante.com/carta o https://glovoapp.com/..."
                className="flex-1 px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-sm"
              />
              <button type="submit" disabled={importando} className="px-5 py-3 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-700 disabled:opacity-60 flex items-center gap-2">
                {importando ? <Loader2 className="w-4 h-4 animate-spin" /> : <LinkIcon className="w-4 h-4" />}
                {importando ? ' Extrayendo...' : ' Extraer y Adaptar Carta'}
              </button>
            </div>
          </form>
        )}

        {/* Pestaña Fotos */}
        {importTab === 'fotos' && (
          <div className="mt-6 space-y-4">
            <form onSubmit={manejarImportarFotos} className="space-y-3">
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-purple-400 transition-colors cursor-pointer relative group">
                <input type="file" multiple accept="image/*" onChange={(e) => { if (e.target.files) onDropImagenes(e.target.files) }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                <ImageIcon className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm text-slate-600">Haz clic para subir 1-5 fotos de la carta física</p>
                <p className="text-xs text-slate-400 mt-1">Compresión automática: 1600px · JPEG 82%</p>
              </div>
              {importImagenes.length > 0 && (
                <div className="flex gap-2 overflow-x-auto">
                  {importImagenes.map((f, i) => (
                    <div key={i} className="relative w-48 h-48 flex-shrink-0 rounded-xl overflow-hidden border border-slate-200">
                      <img src={importPreviewImgs[i]} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={(ev) => { ev.stopPropagation(); const nw = importImagenes.filter((_, idx) => idx !== i); setImportImagenes(nw); const np = importPreviewImgs.filter((_, idx) => idx !== i); setImportPreviewImgs(np) }}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-[10px]"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <p className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur px-2 py-0.5 rounded text-[10px] font-bold text-slate-700">
                    {importImagenes.length} / 5 fotos
                  </p>
                </div>
              )}
              <button type="submit" disabled={importando || importImagenes.length === 0} className="w-full px-5 py-3 rounded-xl bg-green-600 text-white font-bold hover:bg-green-700 disabled:opacity-60 flex items-center justify-center gap-2">
                {importando ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                {importando ? ' Procesando Fotos...' : ' Adaptar desde Fotos'}
              </button>
            </form>
            {importImagenes.length > 0 && importResultado && (
              <div className="pt-4 border-t border-slate-100">
                <p className="text-sm text-slate-600">{importResultado.resumen}</p>
                <button onClick={aplicarResultadoImportacion} className="mt-3 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700">
                  Crear Prototipo con estos Platos
                </button>
              </div>
            )}
          </div>
        )}

        {/* Pestaña Texto */}
        {importTab === 'texto' && (
          <form onSubmit={manejarImportarTexto} className="mt-6 space-y-3">
            <textarea
              value={importTexto} onChange={(e) => setImportTexto(e.target.value)}
              placeholder="Pega aquí el listado de platos en texto libre o un bloque JSON extraído de Gemini..."
              rows={6}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-sm font-mono"
            />
            <button type="submit" disabled={importando} className="w-full px-5 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 disabled:opacity-60 flex items-center justify-center gap-2">
              {importando ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileTextIcon className="w-4 h-4" />}
              {importando ? ' Adaptando...' : ' Adaptar al Menú Fluxo'}
            </button>
          </form>
        )}

        {importResultado && importTab !== 'fotos' && (
          <div className="mt-6 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-sm text-slate-900">Vista previa de importación</h4>
              <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded">{importResultado.categorias.length} categorías</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              {importResultado.platos.slice(0, 8).map((p) => (
                <div key={p.id} className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-sm text-slate-700 truncate">{p.nombre}</span>
                  <span className="text-xs font-mono font-bold text-slate-900">{p.precio.toFixed(2)} €</span>
                </div>
              ))}
              {importResultado.platos.length > 8 && (
                <div className="col-span-2 text-xs text-slate-400 text-center py-2">+ {importResultado.platos.length - 8} platos más…</div>
              )}
            </div>
            <p className="text-sm text-slate-600 mb-3">{importResultado.resumen}</p>
            <button onClick={aplicarResultadoImportacion} className="w-full px-5 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700">
              Crear Prototipo con estos Platos
            </button>
          </div>
        )}
      </div>

      {/* Consola de cartas prototipo */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
              <Store className="w-5 h-5 text-purple-600" />
              Cartas Prototipo por Local
            </h3>
            <p className="text-slate-500 text-sm mt-1">
              Crea cartas personalizadas en menos de 2 minutos desde tu café.
            </p>
          </div>
          <button
            onClick={() => setModalCrearAbierto(true)}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-sm flex items-center gap-2 hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg shadow-purple-500/30"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Crear Carta Prototipo (Modo Café)</span>
            <span className="hidden sm:hidden">+ Crear</span>
          </button>
        </div>

        {cargando ? (
          <div className="text-center py-12 text-slate-500">
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p>Cargando prototipos...</p>
          </div>
        ) : prototipos.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-500 text-sm">No hay prototipos creados todavía.</p>
            <p className="text-slate-400 text-xs mt-1">Usa el importador de arriba o crea uno manualmente.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {prototipos.map((p) => {
              const targetUrl = p.url_destino
                ? (p.url_destino.startsWith('http') ? p.url_destino : `${window.location.origin}${p.url_destino}`)
                : `${window.location.origin}/p/${p.slug}`
              const displayPath = p.url_destino || `/p/${p.slug}`
              return (
              <article key={p.id} className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-xl hover:border-purple-200/50 transition-all group hover:-translate-y-1">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border border-${p.color_acento}/30 text-${p.color_acento} bg-${p.color_acento}/10`}>
                      {p.slug}
                    </span>
                    <h4 className="font-bold text-slate-900 mt-1 text-sm">{p.nombre_local}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">{p.eslogan}</p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => { navigator.clipboard.writeText(targetUrl); setExito(`Enlace ${displayPath} copiado`); setTimeout(() => setExito(null), 3000) }}
                      className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors" title="Copiar enlace"
                    >
                      <Link className="w-4 h-4" />
                    </button>
                    <button onClick={() => descargarTentCard(p)} className="p-2 rounded-xl bg-green-50 text-green-700 hover:bg-green-100 transition-colors" title="Descargar Tent Card">
                      <Download className="w-4 h-4" />
                    </button>
                    <button onClick={() => descargarQR(targetUrl, `qr-${p.slug}.png`)} className="p-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors" title="Descargar QR">
                      <QrCode className="w-4 h-4" />
                    </button>
                    <button onClick={() => setProtEditar(p)} className="p-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors" title="Editar">
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button onClick={() => eliminarPrototipo(p.id)} className="p-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors" title="Eliminar">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="space-y-2 mb-4">
                  {p.platos.slice(0, 4).map((plato) => (
                    <div key={plato.id} className="flex items-center justify-between px-2 py-1 text-xs border-b border-slate-50 last:border-0">
                      <span className="text-slate-600 truncate w-2/3">{plato.nombre}</span>
                      <span className="font-mono font-bold text-slate-900 w-1/3 text-right">{plato.precio.toFixed(2)} €</span>
                    </div>
                  ))}
                  {p.platos.length > 4 && (
                    <div className="px-2 py-1 text-[10px] text-slate-400 text-center">+ {p.platos.length - 4} platos más…</div>
                  )}
                </div>
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="font-mono text-slate-500">{displayPath}</span>
                  <button onClick={() => window.open(targetUrl, '_blank')} className="px-2 py-1 rounded-lg bg-purple-50 text-purple-700 font-bold hover:bg-purple-100">Ver Carta</button>
                </div>
              </article>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal crear prototipo */}
      {modalCrearAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-purple-600" /> Nueva Carta Prototipo
              </h3>
              <button onClick={() => setModalCrearAbierto(false)} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                <span className="w-5 h-5">×</span>
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nombre del local</label>
                  <input value={nuevoNombre} onChange={(e) => setNuevoNombre(e.target.value)} placeholder="Ej: Tapería Adega do Pazo" className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Slug (ruta /p/[slug])</label>
                  <input value={nuevoSlug} onChange={(e) => setNuevoSlug(e.target.value)} placeholder="taperia-adega-do-pazo" className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-sm font-mono" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Eslogan corto</label>
                <input value={nuevoEslogan} onChange={(e) => setNuevoEslogan(e.target.value)} placeholder="Marisco de la Ría y Tapas Gallegas" className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-sm" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Color de acento</label>
                  <div className="flex gap-2">
                    {['#2563eb', '#b91c1c', '#ea580c', '#0f766e', '#7e22ce'].map((color) => (
                      <button key={color} onClick={() => setNuevoColor(color)} className={`w-10 h-10 rounded-full border-2 transition-all ${nuevoColor === color ? 'ring-2 ring-purple-500 scale-110' : 'hover:scale-105'}`} style={{ backgroundColor: color }} />
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Clave WiFi (opcional)</label>
                  <input value={nuevoClaveWifi} onChange={(e) => setNuevoClaveWifi(e.target.value)} placeholder="Fluxo-Invitado" className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-500" /> Plantilla rápida (1 clic)
                </label>
                <div className="flex gap-2">
                  <button onClick={() => aplicarPlantilla('tapería')} className="flex-1 px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm text-left hover:bg-slate-50 hover:border-purple-300 transition-colors">
                    <div className="flex items-center gap-2 mb-2"><span className="text-lg">🦪</span><span className="font-bold text-slate-900 text-xs">Tapería & Marisquería</span></div>
                    <p className="text-[10px] text-slate-500">8 platos base</p>
                  </button>
                  <button onClick={() => aplicarPlantilla('pizzería')} className="flex-1 px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm text-left hover:bg-slate-50 hover:border-purple-300 transition-colors">
                    <div className="flex items-center gap-2 mb-2"><span className="text-lg">🍕</span><span className="font-bold text-slate-900 text-xs">Pizzería & Raciones</span></div>
                    <p className="text-[10px] text-slate-500">8 platos base</p>
                  </button>
                  <button onClick={() => aplicarPlantilla('cafetería')} className="flex-1 px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm text-left hover:bg-slate-50 hover:border-purple-300 transition-colors">
                    <div className="flex items-center gap-2 mb-2"><span className="text-lg">☕</span><span className="font-bold text-slate-900 text-xs">Cafetería & Brunch</span></div>
                    <p className="text-[10px] text-slate-500">8 platos base</p>
                  </button>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button onClick={() => setModalCrearAbierto(false)} className="flex-1 px-5 py-3 rounded-xl bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200 transition-colors">Cancelar</button>
                <button onClick={manejarCrearPrototipo} className="flex-1 px-5 py-3 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-700 transition-colors shadow-lg shadow-purple-500/30">Crear Carta Prototipo</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
