import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import {
  getServerCategories,
  getServerProducts,
  setServerCategories,
  setServerProducts,
  broadcastEvent,
  sanitizeText,
} from '@/lib/server-state'
import { Category, Product } from '@/types/database.types'
import { verifyStaffRequest } from '@/lib/auth/pin-security'
import { createServerClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import { getRestaurantBySlug, getTargetRestaurantId } from '@/lib/supabase/repository'

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
    const {
      slug = 'burger-gourmet',
      raw_text = '',
      save_to_menu = false,
      mode = 'append', // 'append' | 'overwrite'
    } = body

    if (save_to_menu && !verifyStaffRequest(req, slug, ['admin'])) {
      return NextResponse.json(
        { success: false, error: 'No autorizado. Se requiere sesión o PIN de administración para guardar cambios en la carta.' },
        { status: 401 }
      )
    }

    if (!raw_text || typeof raw_text !== 'string' || raw_text.trim().length === 0) {
      return NextResponse.json({ success: false, error: 'Texto de la carta no proporcionado' }, { status: 400 })
    }

    const rest = await getRestaurantBySlug(slug)
    const targetRestId = getTargetRestaurantId(rest?.id, slug)

    const lines = raw_text
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean)

    const parsedCategories: Category[] = []
    const parsedProducts: Product[] = []
    let currentCategory: Category = {
      id: crypto.randomUUID(),
      restaurant_id: targetRestId,
      name: 'PLATOS Y ESPECIALIDADES',
      order_index: 1,
    }
    parsedCategories.push(currentCategory)

    const priceRegex = /([0-9]+[.,][0-9]{1,2})\s*(?:€|eur|euros|\$)?/i
    const isCategoryHeaderRegex = /^([A-ZÁÉÍÓÚÑ0-9\s]{3,35}|#{1,3}\s*.+|[0-9]+\.\s*[A-ZÁÉÍÓÚÑ\s]+)$/

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]

      // Detectar si la línea es un encabezado de categoría
      const hasPrice = priceRegex.test(line)
      if (!hasPrice && (isCategoryHeaderRegex.test(line) || line.startsWith('---') || line.endsWith(':'))) {
        const cleanName = sanitizeText(line.replace(/^[#\-*\s]+|[:]+$/g, '').trim(), 50)
        if (cleanName.length > 2) {
          const existing = parsedCategories.find(c => c.name.toLowerCase() === cleanName.toLowerCase())
          if (!existing) {
            currentCategory = {
              id: crypto.randomUUID(),
              restaurant_id: targetRestId,
              name: cleanName.toUpperCase(),
              order_index: parsedCategories.length + 1,
            }
            parsedCategories.push(currentCategory)
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
      let rawName = line.replace(priceRegex, '').replace(/[€$£\u20AC]/gi, '').replace(/\b(?:eur|euros)\b/gi, '').trim()
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

      rawName = rawName.replace(/[\s\-_:?¿!¡]+$/, '').trim()
      if (description) {
        description = description.replace(/^[•\-\s:_]+|[\s\-_:?¿!¡]+$/g, '').trim()
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
        const isWeight = /al peso|100g|1kg|kg/i.test(line + ' ' + (description || ''))
        const fullDesc = (description && description.length > 2) ? description : 'Elaborado artesanalmente con ingredientes frescos.'
        const allergens = detectAllergens(`${cleanName} ${fullDesc}`)

        const product: Product = {
          id: crypto.randomUUID(),
          category_id: currentCategory.id,
          restaurant_id: targetRestId,
          name: cleanName,
          description: fullDesc,
          price: Number(price.toFixed(2)),
          price_type: isWeight ? 'weight' : 'unit',
          price_unit: isWeight ? '100g' : undefined,
          image_url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80',
          model_3d_url: null,
          is_available: true,
          allergens,
        }
        parsedProducts.push(product)
      }
    }

    // Si save_to_menu es true, aplicar según el modo seleccionado (append u overwrite)
    if (save_to_menu && parsedProducts.length > 0) {
      const existingCategories = getServerCategories(slug)
      const existingProducts = getServerProducts(slug)

      let finalCategories: Category[] = []
      let finalProducts: Product[] = []
      const newProductsToUpsert: Product[] = []
      const newCategoriesToUpsert: Category[] = []

      if (mode === 'append') {
        finalCategories = [...existingCategories]

        // Resolver categorías para no duplicar si ya existen por nombre
        const categoryMap = new Map<string, string>() // parsedCatId -> targetCatId

        for (const pCat of parsedCategories) {
          const match = finalCategories.find(c => c.name.trim().toLowerCase() === pCat.name.trim().toLowerCase())
          if (match) {
            categoryMap.set(pCat.id, match.id)
          } else {
            const newCat: Category = {
              ...pCat,
              order_index: finalCategories.length + 1,
            }
            finalCategories.push(newCat)
            newCategoriesToUpsert.push(newCat)
            categoryMap.set(pCat.id, newCat.id)
          }
        }

        const adaptedNewProducts = parsedProducts.map(p => {
          const resolvedCatId = categoryMap.get(p.category_id) || p.category_id
          return { ...p, category_id: resolvedCatId }
        })

        newProductsToUpsert.push(...adaptedNewProducts)
        finalProducts = [...existingProducts, ...adaptedNewProducts]
      } else {
        // Mode 'overwrite'
        finalCategories = parsedCategories
        finalProducts = parsedProducts
        newCategoriesToUpsert.push(...parsedCategories)
        newProductsToUpsert.push(...parsedProducts)
      }

      setServerCategories(slug, finalCategories)
      setServerProducts(slug, finalProducts)

      // Sincronizar en Supabase
      const supabase = createServerClient()
      if (supabase && isSupabaseConfigured()) {
        try {
          if (mode === 'overwrite') {
            await supabase.from('products').delete().eq('restaurant_id', targetRestId)
          }

          for (const cat of newCategoriesToUpsert) {
            await supabase.from('categories').upsert({
              id: cat.id,
              restaurant_id: targetRestId,
              name: cat.name,
              order_index: cat.order_index,
            })
          }

          for (const prod of newProductsToUpsert) {
            await supabase.from('products').upsert({
              id: prod.id,
              restaurant_id: targetRestId,
              category_id: prod.category_id,
              name: prod.name,
              description: prod.description,
              price: prod.price,
              price_type: prod.price_type,
              price_unit: prod.price_unit || null,
              image_url: prod.image_url,
              is_available: true,
            })
          }
        } catch (dbErr) {
          console.error('[AI Menu Import] Error syncing with Supabase:', dbErr)
        }
      }

      broadcastEvent({
        type: 'menu_updated',
        slug,
      })
    }

    return NextResponse.json({
      success: true,
      slug,
      saved: save_to_menu,
      mode,
      parsed: {
        total_categories: parsedCategories.length,
        total_dishes: parsedProducts.length,
        categories: parsedCategories,
        products: parsedProducts,
      },
    })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
