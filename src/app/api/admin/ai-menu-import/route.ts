import { NextRequest, NextResponse } from 'next/server'
import {
  getServerCategories,
  getServerProducts,
  setServerCategories,
  setServerProducts,
  sanitizeText,
} from '@/lib/server-state'
import { Category, Product } from '@/types/database.types'

export const dynamic = 'force-dynamic'

const KNOWN_ALLERGEN_MAP: Record<string, string> = {
  gluten: 'gluten',
  trigo: 'gluten',
  pan: 'gluten',
  leche: 'dairy',
  lactosa: 'dairy',
  queso: 'dairy',
  nata: 'dairy',
  mantequilla: 'dairy',
  huevo: 'eggs',
  huevos: 'eggs',
  pescado: 'fish',
  atun: 'fish',
  merluza: 'fish',
  salmon: 'fish',
  marisco: 'crustaceans',
  gambas: 'crustaceans',
  langostinos: 'crustaceans',
  zamburiñas: 'molluscs',
  pulpo: 'molluscs',
  mejillones: 'molluscs',
  soja: 'soy',
  sesamo: 'sesame',
  mostaza: 'mustard',
  nueces: 'nuts',
  cacahuetes: 'peanuts',
  almendras: 'nuts',
}

function detectAllergens(text: string): string[] {
  const lower = text.toLowerCase()
  const detected = new Set<string>()
  for (const [kw, allergen] of Object.entries(KNOWN_ALLERGEN_MAP)) {
    if (lower.includes(kw)) {
      detected.add(allergen)
    }
  }
  return Array.from(detected)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { slug = 'burger-gourmet', raw_text = '', save_to_menu = false } = body

    if (!raw_text || typeof raw_text !== 'string' || raw_text.trim().length === 0) {
      return NextResponse.json({ success: false, error: 'Texto de la carta no proporcionado' }, { status: 400 })
    }

    const lines = raw_text
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean)

    const categories: Category[] = []
    const products: Product[] = []
    let currentCategory: Category = {
      id: `cat-ai-1`,
      restaurant_id: 'a1111111-1111-1111-1111-111111111111',
      name: 'PLATOS Y ESPECIALIDADES',
      order_index: 1,
    }
    categories.push(currentCategory)

    const priceRegex = /([0-9]+[.,][0-9]{1,2})\s*(?:€|eur|euros|\$)?/i
    const isCategoryHeaderRegex = /^([A-ZÁÉÍÓÚÑ0-9\s]{3,35}|#{1,3}\s*.+|[0-9]+\.\s*[A-ZÁÉÍÓÚÑ\s]+)$/

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]

      // Detectar si la línea es un encabezado de categoría
      const hasPrice = priceRegex.test(line)
      if (!hasPrice && (isCategoryHeaderRegex.test(line) || line.startsWith('---') || line.endsWith(':'))) {
        const cleanName = sanitizeText(line.replace(/^[#\-*\s]+|[:]+$/g, '').trim(), 50)
        if (cleanName.length > 2) {
          const existing = categories.find(c => c.name.toLowerCase() === cleanName.toLowerCase())
          if (!existing) {
            currentCategory = {
              id: `cat-ai-${categories.length + 1}`,
              restaurant_id: 'a1111111-1111-1111-1111-111111111111',
              name: cleanName.toUpperCase(),
              order_index: categories.length + 1,
            }
            categories.push(currentCategory)
          } else {
            currentCategory = existing
          }
          continue
        }
      }

      // Detectar línea de plato
      let price = 0.0
      const priceMatch = line.match(priceRegex)
      if (priceMatch) {
        price = parseFloat(priceMatch[1].replace(',', '.'))
      } else {
        price = 10.0
      }

      // Separar nombre y descripción
      let rawName = line.replace(priceRegex, '').replace(/[€$]/g, '').trim()
      let description = ''

      if (rawName.includes(' - ')) {
        const parts = rawName.split(' - ')
        rawName = parts[0].trim()
        description = parts.slice(1).join(' - ').trim()
      } else if (rawName.includes(': ')) {
        const parts = rawName.split(': ')
        rawName = parts[0].trim()
        description = parts.slice(1).join(': ').trim()
      } else if (rawName.includes('(') && rawName.includes(')')) {
        const descMatch = rawName.match(/\((.*?)\)/)
        if (descMatch) {
          description = descMatch[1].trim()
          rawName = rawName.replace(/\(.*?\)/, '').trim()
        }
      }

      // Si la siguiente línea no tiene precio y parece descripción, anexarla
      if (!description && i + 1 < lines.length) {
        const nextLine = lines[i + 1]
        if (!priceRegex.test(nextLine) && !isCategoryHeaderRegex.test(nextLine) && nextLine.length > 10) {
          description = sanitizeText(nextLine, 300)
          i++
        }
      }

      const cleanName = sanitizeText(rawName.replace(/^[•\-\d.\s]+/, '').trim(), 100)
      if (cleanName.length >= 2) {
        const isWeight = /al peso|100g|1kg|kg/i.test(line + ' ' + description)

        const product: Product = {
          id: `prod-ai-${products.length + 1}-${Date.now().toString(36)}`,
          category_id: currentCategory.id,
          restaurant_id: 'a1111111-1111-1111-1111-111111111111',
          name: cleanName,
          description: description || 'Elaborado artesanalmente con ingredientes frescos.',
          price: Number(price.toFixed(2)),
          price_type: isWeight ? 'weight' : 'unit',
          price_unit: isWeight ? '100g' : undefined,
          image_url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80',
          model_3d_url: null,
          is_available: true,
        }
        products.push(product)
      }
    }

    // Si save_to_menu es true, persistir en memoria y notificar en tiempo real
    if (save_to_menu && products.length > 0) {
      setServerCategories(slug, categories)
      setServerProducts(slug, products)
    }

    return NextResponse.json({
      success: true,
      slug,
      saved: save_to_menu,
      parsed: {
        total_categories: categories.length,
        total_dishes: products.length,
        categories,
        products,
      },
    })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
