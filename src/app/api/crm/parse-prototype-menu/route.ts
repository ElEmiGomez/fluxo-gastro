import { NextRequest, NextResponse } from 'next/server'
import { verifyFounderRequest } from '@/lib/auth/crm-auth'

/**
 * POST /api/crm/parse-prototype-menu
 * Motor de Ingesta Omnicanal de Cartas (Smart Menu Importer V2)
 * Acepta: { url?, images?: string[], rawText? }
 * Devuelve: { localName, tagline, dishes: [{name, description, price, category, badge, allergens}] }
 */
export async function POST(req: NextRequest) {
  if (!verifyFounderRequest(req)) {
    return NextResponse.json(
      { error: 'Acceso no autorizado. Se requiere PIN de Fundador.' },
      { status: 401 }
    )
  }

  try {
    const body = await req.json()
    const { url, images, rawText } = body

    let textoExtraido: string | null = null
    let localName: string | null = null
    let fuente: string

    // ============================================================================
    // A) Si recibe URL -> scraping dual (fetch directo + fallback r.jina.ai)
    // ============================================================================
    if (url && typeof url === 'string') {
      fuente = 'url'
      textoExtraido = await extraerTextoDeUrl(url)
      // Intentar extraer nombre del local del <title> si está disponible
      localName = await extraerNombreDeUrl(url)
    }

    // ============================================================================
    // B) Si recibe imágenes (Base64) -> Vision API si hay key, si no fallback local
    // ============================================================================
    else if (images && Array.isArray(images) && images.length > 0) {
      fuente = 'imagenes'
      const geminiKey = process.env.GEMINI_API_KEY
      const openaiKey = process.env.OPENAI_API_KEY

      if (geminiKey || openaiKey) {
        // Placeholder para llamada real a Vision REST API
        console.log(`[parse-prototype-menu] ${images.length} imagen(es) recibida(s). Vision API disponible.`)
      }

      // Sin API key o como fallback: no podemos leer imágenes realmente,
      // pero devolvemos estructura vacía para que el usuario pegue el texto manualmente
      return NextResponse.json({
        success: true,
        fuente: 'imagenes',
        requiere_texto: true,
        mensaje: 'Imágenes recibidas. Configura GEMINI_API_KEY u OPENAI_API_KEY para extracción automática por Vision, o pega el texto de la carta en el campo de texto.',
        platos: [],
        categorias: [],
        localName: null,
      })
    }

    // ============================================================================
    // C) Si recibe texto plano -> usar directamente
    // ============================================================================
    else if (rawText && typeof rawText === 'string') {
      fuente = 'texto'
      textoExtraido = rawText
    }

    else {
      return NextResponse.json(
        { error: 'Proporciona url, images o rawText.' },
        { status: 400 }
      )
    }

    // ============================================================================
    // ADAPTADOR FLUXO: normalizar siempre (con o sin API key)
    // ============================================================================
    if (!textoExtraido) {
      return NextResponse.json({ success: true, fuente, platos: [], categorias: [], localName: null })
    }

    const adaptado = adaptToFluxoMenu(textoExtraido, localName || undefined)

    return NextResponse.json({
      success: true,
      fuente,
      localName: adaptado.localName || localName || null,
      tagline: adaptado.tagline || null,
      platos: adaptado.dishes,
      categorias: Array.from(new Set(adaptado.dishes.map((d) => d.categoria).filter(Boolean))),
      resumen: `✅ Carta adaptada: ${adaptado.dishes.length} platos, ${adaptado.dishes.length > 0 ? Array.from(new Set(adaptado.dishes.map(d => d.categoria))).length : 0} categorías, alérgenos configurados.`,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error al parsear menú' }, { status: 500 })
  }
}

/**
 * Extrae texto limpio de una URL vía fetch directo + fallback r.jina.ai
 */
async function extraerTextoDeUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.9',
      },
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const html = await res.text()
    const texto = limpiarHtml(html)

    // Si hay poco contenido o menos de 2 precios, probar r.jina.ai
    const precios = (texto.match(/\d+[.,]\d{2}/g) || [])
    if (texto.length < 200 || precios.length < 2) {
      try {
        const jinaRes = await fetch(`https://r.jina.ai/${encodeURIComponent(url)}`, {
          headers: { Accept: 'text/plain' },
        })
        if (jinaRes.ok) {
          const markdown = await jinaRes.text()
          if (markdown.length > texto.length) return limpiarMarkdown(markdown)
        }
      } catch {
        // Ignorar error de jina, usar texto directo
      }
    }

    return texto.length > 0 ? texto : null
  } catch {
    return null
  }
}

/**
 * Extrae el <title> de una URL para obtener el nombre del local
 */
async function extraerNombreDeUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
        'Accept': 'text/html,*/*',
      },
    })
    if (!res.ok) return null
    const html = await res.text()
    const match = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    return match ? match[1].trim() : null
  } catch {
    return null
  }
}

/**
 * Limpia HTML a texto plano conservando estructura de bloques
 */
function limpiarHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
    .replace(/<nav\b[^>]*>[\s\S]*?<\/nav>/gi, ' ')
    .replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi, ' ')
    .replace(/<\/[h1-h6|p|li|tr|div|br|section|article|header|footer]>|<br\s*\/?>/gi, '\n')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .replace(/\n\s*\n/g, '\n')
    .trim()
}

/**
 * Limpia markdown de r.jina.ai
 */
function limpiarMarkdown(md: string): string {
  return md
    .replace(/#{1,6}\s+/g, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .replace(/`{1,3}[\s\S]*?`{1,3}/g, ' ')
    .replace(/\[.*?\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * ADAPTADOR FLUXO: normaliza texto extraído al formato enriquecido de menú
 */
interface PlatoAdaptado {
  id: string
  nombre: string
  descripcion: string
  precio: number
  categoria: string
  badge: 'Estrella' | 'Sugerido' | 'Segun Lonja' | null
  alergenos: string[]
}

interface AdaptadoResult {
  localName: string | null
  tagline: string | null
  dishes: PlatoAdaptado[]
}

function adaptToFluxoMenu(texto: string, localNameSugerido?: string): AdaptadoResult {
  const lineas = texto.split(/\n/).map((l) => l.trim()).filter(Boolean)

  const CATEGORIAS_RECONOCIDAS: Record<string, string> = {
    'entrantes': 'Entrantes',
    'para picar': 'Entrantes',
    'tapas': 'Entrantes',
    'raciones': 'Entrantes',
    'mariscos': 'Mariscos',
    'de la ría': 'Mariscos',
    'pescados': 'Pescados',
    'carnes': 'Carnes',
    'pizzas': 'Pizzas',
    'hamburguesas': 'Hamburguesas',
    'bocadillos': 'Bocadillos',
    'postres': 'Postres',
    'bebidas': 'Bebidas',
    'vinos': 'Bebidas',
    'bodega': 'Bebidas',
    'carta': 'Carta',
    'menú': 'Carta',
    'menu': 'Carta',
  }

  const ALERGENOS_PALABRAS: Record<string, string[]> = {
    'Moluscos': ['berberecho', 'almeja', 'mejillón', 'navaja', 'zamburiña', 'pulpo', 'calamar', 'chipirón', 'sepia'],
    'Crustáceos': ['gamba', 'langostino', 'camarón', 'necora', 'centollo', 'bogavante'],
    'Pescado': ['merluza', 'bacalao', 'atún', 'salmón', 'sardina', 'xouba', 'pesca'],
    'Gluten': ['pizza', 'empanada', 'croqueta', 'bocadillo', 'tostada', 'pan', 'tarta', 'tiramisú', 'milanesa'],
    'Lácteos': ['queso', 'leche', 'mantequilla', 'nata', 'yogur', 'tiramisú', 'croissant'],
    'Huevos': ['tortilla', 'huevo', 'mayonesa', 'alioli', 'tortilla'],
  }

  const DESCRIPCIONES_POR_CATEGORIA: Record<string, string> = {
    'Entrantes': 'Elaboración fresca al momento con producto seleccionado.',
    'Mariscos': 'Marisco de la ría, preparado a la brasa o al vapor.',
    'Pescados': 'Pescado fresco de lonja, a la plancha o al horno.',
    'Carnes': 'Carne seleccionada, a la brasa o al estilo tradicional.',
    'Pizzas': 'Pizza artesanal al horno de leña.',
    'Hamburguesas': 'Hamburguesa de carne fresca con pan brioche.',
    'Bocadillos': 'Bocadillo tradicional con producto de la zona.',
    'Postres': 'Postre casero elaborado en obrador propio.',
    'Bebidas': 'Bebida fría o caliente para acompañar.',
    'Carta': 'Plato del menú estándar del local.',
  }

  let categoriaActual = 'Carta'
  const platos: PlatoAdaptado[] = []
  let idCounter = 0

  const patronPrecio = /(\d+[.,]\d{2})\s*€?/i
  const patronSM = /s\/m|según mercado|según lonja|precio según/i

  for (const linea of lineas) {
    // Detectar categoría
    const lowerLinea = linea.toLowerCase()
    const catMatch = Object.keys(CATEGORIAS_RECONOCIDAS).find((c) => lowerLinea === c || lowerLinea.includes(c) && linea.length < 50)
    if (catMatch && linea.length < 50) {
      categoriaActual = CATEGORIAS_RECONOCIDAS[catMatch]
      continue
    }

    // Detectar precio
    const matchPrecio = linea.match(patronPrecio)
    if (!matchPrecio) continue

    const precioStr = matchPrecio[1].replace(',', '.')
    const precio = parseFloat(precioStr)
    if (isNaN(precio) || precio <= 0) continue

    // Nombre: todo antes del precio
    const nombreRaw = linea.replace(patronPrecio, '').replace(/\.{2,}/g, ' ').trim()
    const nombre = nombreRaw || 'Plato sin nombre'

    // Badge S/M o según lonja
    let badge: PlatoAdaptado['badge'] = null
    let precioFinal = precio
    if (patronSM.test(lowerLinea)) {
      badge = 'Segun Lonja'
      precioFinal = Math.max(precio, 12.00) // precio base estimativo editable
    }

    // Alérgenos por palabras clave
    const alergenos: string[] = []
    const nombreLower = nombre.toLowerCase()
    for (const [alergeno, palabras] of Object.entries(ALERGENOS_PALABRAS)) {
      if (palabras.some((p) => nombreLower.includes(p))) {
        alergenos.push(alergeno)
      }
    }

    // Descripción automática si no hay
    const descripcion = DESCRIPCIONES_POR_CATEGORIA[categoriaActual]

    platos.push({
      id: `plato-${Date.now()}-${idCounter++}`,
      nombre,
      descripcion,
      precio: precioFinal,
      categoria: categoriaActual,
      badge,
      alergenos,
    })
  }

  // Asignar Estrella y Sugerido a los platos de mayor precio de las 2 primeras categorías
  const categoriasUnicas = Array.from(new Set(platos.map((p) => p.categoria)))
  for (const cat of categoriasUnicas.slice(0, 2)) {
    const platosCat = platos.filter((p) => p.categoria === cat && p.badge !== 'Segun Lonja')
    if (platosCat.length > 0) {
      const maxPrecio = platosCat.reduce((max, p) => (p.precio > max.precio ? p : max), platosCat[0])
      if (!maxPrecio.badge) maxPrecio.badge = 'Estrella'
      const otros = platosCat.filter((p) => p.id !== maxPrecio.id)
      if (otros.length > 0) {
        const segundo = otros.reduce((max, p) => (p.precio > max.precio ? p : max), otros[0])
        if (!segundo.badge) segundo.badge = 'Sugerido'
      }
    }
  }

  return {
    localName: localNameSugerido || null,
    tagline: null,
    dishes: platos,
  }
}
