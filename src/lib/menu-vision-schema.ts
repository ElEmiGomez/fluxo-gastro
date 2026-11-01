// ============================================================================
// Fluxo - Catálogo de los 14 Alérgenos UE (Reglamento UE 1169/2011) y Esquema IA
// ============================================================================

export type EUAllergenKey =
  | 'gluten'
  | 'crustaceans'
  | 'eggs'
  | 'fish'
  | 'peanuts'
  | 'soy'
  | 'milk'
  | 'nuts'
  | 'celery'
  | 'mustard'
  | 'sesame'
  | 'sulphites'
  | 'lupin'
  | 'molluscs'

export interface EUAllergenDefinition {
  key: EUAllergenKey
  label_es: string
  label_gl: string
  icon: string
}

export const EU_ALLERGENS: Record<EUAllergenKey, EUAllergenDefinition> = {
  gluten: { key: 'gluten', label_es: 'Gluten / Cereales', label_gl: 'Glute / Cereais', icon: '🌾' },
  crustaceans: { key: 'crustaceans', label_es: 'Crustáceos', label_gl: 'Crustáceos', icon: '🦐' },
  eggs: { key: 'eggs', label_es: 'Huevos', label_gl: 'Ovos', icon: '🥚' },
  fish: { key: 'fish', label_es: 'Pescado', label_gl: 'Peixe', icon: '🐟' },
  peanuts: { key: 'peanuts', label_es: 'Cacahuetes', label_gl: 'Cacahuetes', icon: '🥜' },
  soy: { key: 'soy', label_es: 'Soja', label_gl: 'Soia', icon: '🌱' },
  milk: { key: 'milk', label_es: 'Lácteos / Leche', label_gl: 'Lácteos / Leite', icon: '🥛' },
  nuts: { key: 'nuts', label_es: 'Frutos de cáscara', label_gl: 'Froitos de casca', icon: '🌰' },
  celery: { key: 'celery', label_es: 'Apio', label_gl: 'Apio', icon: '🥬' },
  mustard: { key: 'mustard', label_es: 'Mostaza', label_gl: 'Mostaza', icon: '🟡' },
  sesame: { key: 'sesame', label_es: 'Sésamo', label_gl: 'Sésamo', icon: '⚪' },
  sulphites: { key: 'sulphites', label_es: 'Sulfitos / SO2', label_gl: 'Sulfitos', icon: '🍷' },
  lupin: { key: 'lupin', label_es: 'Altramuces', label_gl: 'Chouchos', icon: '🫘' },
  molluscs: { key: 'molluscs', label_es: 'Moluscos', label_gl: 'Moluscos', icon: '🦪' },
}

export const VALID_EU_ALLERGEN_KEYS: EUAllergenKey[] = Object.keys(EU_ALLERGENS) as EUAllergenKey[]

export type CourseRole = 'starter' | 'main' | 'drink' | 'dessert' | 'coffee'
export type StationType = 'kitchen' | 'bar'
export type DietaryTag = 'vegan' | 'vegetarian' | 'gluten_free' | 'spicy'

export interface ParsedMenuItem {
  id: string
  name: string
  description?: string
  price: number | null
  is_market_price: boolean // "S/M", "Según lonja", "Según mercado"
  allergens: EUAllergenKey[]
  dietary_tags?: DietaryTag[]
  station: StationType
  category_name?: string
}

export interface ParsedMenuCategory {
  id: string
  name: string
  role: CourseRole
  station: StationType
  items: ParsedMenuItem[]
}

export interface ParsedMenuResponse {
  restaurant_name: string
  suggested_slug: string
  slogan?: string
  categories: ParsedMenuCategory[]
}

/**
 * Normaliza cualquier slug para garantizar compatibilidad URL limpia (kebab-case)
 */
export function sanitizeSlug(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'local-nuevo'
}

/**
 * Validador estricto sin dependencias externas
 */
export function validateParsedMenuResponse(data: any): ParsedMenuResponse {
  if (!data || typeof data !== 'object') {
    throw new Error('Estructura de respuesta no válida')
  }

  const restaurant_name = typeof data.restaurant_name === 'string' && data.restaurant_name.trim()
    ? data.restaurant_name.trim()
    : 'Local Hostelería'

  const suggested_slug = sanitizeSlug(data.suggested_slug || restaurant_name)
  const slogan = typeof data.slogan === 'string' ? data.slogan : 'Carta Digital & Servicio de Mesa'

  const categories: ParsedMenuCategory[] = []

  const rawCats = Array.isArray(data.categories) ? data.categories : []
  rawCats.forEach((c: any, cIdx: number) => {
    const catName = typeof c.name === 'string' && c.name.trim() ? c.name.trim() : `Categoría ${cIdx + 1}`
    
    let role: CourseRole = 'main'
    const roleLower = String(c.role || '').toLowerCase()
    if (['starter', 'main', 'drink', 'dessert', 'coffee'].includes(roleLower)) {
      role = roleLower as CourseRole
    } else {
      const n = catName.toLowerCase()
      if (n.includes('entran') || n.includes('tapa') || n.includes('racion') || n.includes('marisc') || n.includes('ensalada')) role = 'starter'
      else if (n.includes('bebid') || n.includes('vino') || n.includes('cervez') || n.includes('cocktail')) role = 'drink'
      else if (n.includes('postr') || n.includes('dulce') || n.includes('tarta')) role = 'dessert'
      else if (n.includes('cafe') || n.includes('infus')) role = 'coffee'
    }

    const station: StationType = role === 'drink' || role === 'coffee' ? 'bar' : 'kitchen'

    const items: ParsedMenuItem[] = []
    const rawItems = Array.isArray(c.items) ? c.items : []
    rawItems.forEach((it: any, itIdx: number) => {
      const itName = typeof it.name === 'string' && it.name.trim() ? it.name.trim() : `Plato ${itIdx + 1}`
      
      const is_market_price = Boolean(it.is_market_price || it.price === null || String(it.price).toLowerCase().includes('s/m') || String(it.price).toLowerCase().includes('lonja'))
      let price: number | null = null
      if (!is_market_price && typeof it.price === 'number' && !isNaN(it.price)) {
        price = Math.max(0, Number(it.price.toFixed(2)))
      }

      // Validar y filtrar alérgenos a los 14 estrictos de la UE
      const allergens: EUAllergenKey[] = []
      if (Array.isArray(it.allergens)) {
        it.allergens.forEach((a: string) => {
          const norm = String(a).toLowerCase().trim()
          const matched = VALID_EU_ALLERGEN_KEYS.find(k => k === norm || norm.includes(k))
          if (matched && !allergens.includes(matched)) {
            allergens.push(matched)
          }
        })
      }

      const itemStation: StationType = it.station === 'bar' || role === 'drink' || role === 'coffee' ? 'bar' : 'kitchen'

      items.push({
        id: it.id || `item_${cIdx + 1}_${itIdx + 1}`,
        name: itName,
        description: typeof it.description === 'string' ? it.description : undefined,
        price,
        is_market_price,
        allergens,
        dietary_tags: Array.isArray(it.dietary_tags) ? it.dietary_tags : [],
        station: itemStation,
        category_name: catName,
      })
    })

    if (items.length > 0) {
      categories.push({
        id: c.id || `cat_${cIdx + 1}`,
        name: catName,
        role,
        station,
        items,
      })
    }
  })

  return {
    restaurant_name,
    suggested_slug,
    slogan,
    categories,
  }
}
