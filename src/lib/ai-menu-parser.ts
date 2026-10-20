import crypto from 'crypto'
import { Category, Product, CourseType } from '@/types/database.types'
import { AiParsedDish, AiParsedCategory, AiParsedMenuResult, StagingDiff, StagingDailyMenu } from '@/types/admin.types'
import { MANDATORY_EU_ALLERGENS } from '@/lib/allergens'
import {
  getProductGroup,
  inferCourseType,
  suggestCategoryForProduct,
  deduplicateProducts,
} from '@/lib/category-matcher'
import { sanitizeText } from '@/lib/server-state'

export const VALID_EU_ALLERGEN_KEYS = new Set(MANDATORY_EU_ALLERGENS.map(a => a.id))

// Mapeo exhaustivo multilingüe (Español, Gallego, Inglés) a los 14 alérgenos canónicos de la UE
const ALLERGEN_KEYWORDS: Record<string, string[]> = {
  gluten: [
    'gluten', 'trigo', 'fariña', 'harina', 'pan', 'cebada', 'cevada', 'centeno', 'centeo',
    'avena', 'avea', 'pasta', 'masa', 'cerveza', 'cervexa', 'croqueta', 'croquetas',
    'bocata', 'bocadillo', 'empanada', 'filloa', 'filloas', 'tarta', 'bizcocho', 'cereales'
  ],
  crustaceans: [
    'crustaceos', 'crustáceos', 'crustaceo', 'crustáceo', 'gamba', 'gambas', 'langostino',
    'langostinos', 'camaron', 'camarón', 'camarones', 'cigala', 'cigalas', 'bogavante',
    'lumbrigante', 'centollo', 'centolo', 'percebe', 'percebes', 'necora', 'nécora', 'carabinero'
  ],
  eggs: [
    'huevo', 'huevos', 'ovo', 'ovos', 'tortilla', 'mayonesa', 'maionesa', 'revuelto',
    'revirado', 'clara', 'yema', 'xema', 'alioli'
  ],
  fish: [
    'pescado', 'peixe', 'atun', 'atún', 'bonito', 'merluza', 'pescada', 'salmon', 'salmón',
    'bacalao', 'bacallau', 'sardina', 'xouba', 'xoubas', 'anchoa', 'anchoas', 'boqueron',
    'rape', 'pexe sapo', 'lubina', 'robaliza', 'dorada', 'rodaballo', 'trucha', 'troita'
  ],
  peanuts: [
    'cacahuete', 'cacahuetes', 'mani', 'maní', 'cacahuetes fritos', 'mantequilla de cacahuete'
  ],
  soy: [
    'soja', 'soia', 'tofu', 'edamame', 'salsa de soja', 'tamari', 'miso'
  ],
  dairy: [
    'leche', 'leite', 'lactosa', 'queso', 'queixo', 'tetilla', 'arzua', 'arzúa', 'san simon',
    'mozzarella', 'cheddar', 'parmesano', 'curado', 'brie', 'gorgonzola', 'nata', 'mantequilla',
    'manteiga', 'yogur', 'iogur', 'lacteo', 'lácteo', 'crema', 'requeixo', 'requeison'
  ],
  nuts: [
    'nueces', 'nuez', 'noces', 'amendoa', 'améndoa', 'almendra', 'almendras', 'pistacho',
    'pistachos', 'avellana', 'avellanas', 'abela', 'abelá', 'piñones', 'piñons', 'anacardo',
    'anacardos', 'castaña', 'castañas', 'praline', 'frutos secos', 'frutos de casca'
  ],
  celery: [
    'apio', 'aipo'
  ],
  mustard: [
    'mostaza', 'mostarda', 'dijon'
  ],
  sesame: [
    'sesamo', 'sésamo', 'xonxoli', 'xonxolí', 'tahini', 'ajonjoli', 'ajonjolí', 'semillas de sesamo'
  ],
  sulfites: [
    'sulfito', 'sulfitos', 'vino', 'viño', 'sidra', 'vinagre', 'cava', 'champagne', 'dioxido de azufre'
  ],
  lupin: [
    'altramuz', 'altramuces', 'chicho', 'chichos', 'tremoco', 'tremoço', 'lupino'
  ],
  molluscs: [
    'molusco', 'moluscos', 'pulpo', 'polbo', 'zamburiña', 'zamburiñas', 'mejillon', 'mejillones',
    'mexillon', 'mexillóns', 'almeja', 'almejas', 'ameixa', 'ameixas', 'navaja', 'navajas',
    'navalla', 'navallas', 'calamar', 'calamares', 'chipiron', 'chipirones', 'lura', 'luras',
    'choco', 'chocos', 'sepia', 'chocos na sua tinta', 'vieira', 'vieiras', 'berberecho', 'berberechos'
  ],
}

/**
 * Normaliza una cadena eliminando diacríticos, mayúsculas y caracteres no alfanuméricos
 */
export function normalizeKey(str?: string | null): string {
  if (!str) return ''
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

/**
 * Detecta y devuelve exclusivamente alérgenos válidos de los 14 de la Unión Europea
 */
export function detectStrictAllergens(text: string): string[] {
  const norm = normalizeKey(text)
  const detected = new Set<string>()

  for (const [allergenKey, keywords] of Object.entries(ALLERGEN_KEYWORDS)) {
    for (const kw of keywords) {
      const normKw = normalizeKey(kw)
      const escaped = normKw.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')
      const rx = new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, 'i')
      if (rx.test(norm)) {
        if (VALID_EU_ALLERGEN_KEYS.has(allergenKey)) {
          detected.add(allergenKey)
        }
        break
      }
    }
  }

  return Array.from(detected)
}

/**
 * Parsea un precio desde una cadena con tolerancia a formatos internacionales y monedas
 */
export function parsePrice(text: string): { price: number; isMarketPrice: boolean; rawDetected: string | null } {
  const trimmed = text.trim()
  if (/\b(?:s\/m|s\.m\.|seg[uú]n\s+mercado|consultar|a\s+consultar)\b/i.test(trimmed)) {
    return { price: 0, isMarketPrice: true, rawDetected: 'S/M' }
  }

  // 1. Preferir número con símbolo explícito de moneda (€, EUR, euros, $)
  const explicitCurrencyMatch = trimmed.match(/([0-9]+(?:[.,][0-9]{1,2})?)\s*(?:€|eur|euros|\$)|(?:€|\$)\s*([0-9]+(?:[.,][0-9]{1,2})?)/i)
  if (explicitCurrencyMatch) {
    const rawVal = (explicitCurrencyMatch[1] || explicitCurrencyMatch[2]).replace(',', '.')
    const parsed = parseFloat(rawVal)
    if (!isNaN(parsed) && parsed >= 0) {
      return { price: Number(parsed.toFixed(2)), isMarketPrice: false, rawDetected: explicitCurrencyMatch[0] }
    }
  }

  // 2. Si no hay símbolo de moneda, buscar número al final de línea o tras dos puntos/guion
  const endNumberMatch = trimmed.match(/[:\-–—]\s*([0-9]+(?:[.,][0-9]{1,2})?)\s*$/i) || trimmed.match(/([0-9]+(?:[.,][0-9]{1,2})?)\s*$/i)
  if (endNumberMatch) {
    const rawVal = endNumberMatch[1].replace(',', '.')
    const parsed = parseFloat(rawVal)
    if (!isNaN(parsed) && parsed >= 0) {
      return { price: Number(parsed.toFixed(2)), isMarketPrice: false, rawDetected: endNumberMatch[0] }
    }
  }

  return { price: 0, isMarketPrice: false, rawDetected: null }
}

/**
 * Interfaz para el resultado del motor local del Bot
 */
export interface AiBotProcessingResult {
  isCommand: boolean
  commandType?: 'price_update' | 'stock_toggle' | 'dish_create' | 'daily_menu' | 'unknown'
  parsed: AiParsedMenuResult
  stagingDiff: StagingDiff
}

/**
 * Clasifica si el plato debe enrutarse a Barra o Cocina
 */
export function matchesScopeTarget(scope: string, product: Product, categories: Category[]): boolean {
  const normScope = normalizeKey(scope)
  if (!normScope) return false
  if (normScope === 'carta' || normScope === 'todo' || normScope === 'todos los platos' || normScope === 'catalogo') {
    return true
  }

  const pNorm = normalizeKey(product.name)
  const cat = categories.find(c => c.id === product.category_id)
  const catNorm = normalizeKey(cat?.name)
  const pGroup = getProductGroup(product, categories)

  if (pNorm.includes(normScope) || normScope.includes(pNorm)) return true
  if (catNorm && (catNorm.includes(normScope) || normScope.includes(catNorm))) return true
  if (pGroup && (pGroup.includes(normScope) || normScope.includes(pGroup))) return true

  // Análisis de lexemas con desinencia de plural eliminada ('s' o 'es')
  const tokens = normScope
    .split(/\s+/)
    .map(t => t.replace(/(?:es|s)$/, ''))
    .filter(t => t.length >= 3)

  for (const token of tokens) {
    if (pNorm.includes(token)) return true
    if (catNorm && catNorm.includes(token)) return true
    if (pGroup && pGroup.includes(token)) return true

    if ((token === 'hamburguesa' || token === 'burger') && (pGroup === 'burgers' || pNorm.includes('burger') || pNorm.includes('hamburguesa'))) return true
    if ((token === 'cerveza' || token === 'pinta' || token === 'birra') && (pNorm.includes('cerveza') || pNorm.includes('pinta') || pNorm.includes('estrella') || pNorm.includes('1906') || pNorm.includes('caña'))) return true
    if ((token === 'bebida' || token === 'refresco' || token === 'trago') && (pGroup === 'bebidas')) return true
    if ((token === 'postre' || token === 'dulce' || token === 'tarta') && (pGroup === 'postres' || pNorm.includes('tarta') || pNorm.includes('volcan') || pNorm.includes('helado'))) return true
    if ((token === 'entrante' || token === 'tapa' || token === 'racion' || token === 'picoteo') && (pGroup === 'entradas' || pNorm.includes('croqueta') || pNorm.includes('papas') || pNorm.includes('baston'))) return true
    if ((token === 'carne' || token === 'principal' || token === 'chuleton') && (pGroup === 'principales' || pNorm.includes('chuleton') || pNorm.includes('milanesa') || pNorm.includes('cachopo'))) return true
  }

  return false
}

export function resolveStation(courseType: CourseType): 'bar' | 'kitchen' {
  return courseType === 'drink' ? 'bar' : 'kitchen'
}

/**
 * Analiza comandos en lenguaje natural dados por el hostelero sobre el catálogo existente
 */
export function processNaturalLanguageCommand(
  rawText: string,
  existingProducts: Product[],
  existingCategories: Category[],
  targetRestaurantId: string
): AiBotProcessingResult | null {
  const text = rawText.trim()
  const normText = normalizeKey(text)

  // 1. Comando: Menú del Día
  // Ej: "Pon de menú del día hoy lentejas y merluza a 14,50 €" o "Menú del día a 12€: primeros lentejas, segundos merluza"
  if (
    normText.includes('menu del dia') ||
    normText.includes('menu de hoxe') ||
    normText.startsWith('menu')
  ) {
    const priceInfo = parsePrice(text)
    const fixedPrice = priceInfo.price > 0 ? priceInfo.price : 12.5

    // Detectar primeros y segundos
    let firstCourses: string[] = []
    let secondCourses: string[] = []
    let desserts: string[] = []

    const cleanBody = text.replace(/^(?:pon\s+de\s+)?(?:men[uú]\s+del\s+d[ií]a|menu\s+de\s+hoxe)(?:\s+hoy|\s+hoxe)?/i, '').trim()

    // Intentar extraer platos por separadores o conectores (y, o, comas)
    if (/primeros?:/i.test(cleanBody) || /segundos?:/i.test(cleanBody)) {
      const firstMatch = cleanBody.match(/primeros?:?\s*([^,;.\n]+(?:(?:,|o|y)\s*[^,;.\n]+)*)/i)
      const secondMatch = cleanBody.match(/segundos?:?\s*([^,;.\n]+(?:(?:,|o|y)\s*[^,;.\n]+)*)/i)
      const dessertMatch = cleanBody.match(/postres?:?\s*([^,;.\n]+(?:(?:,|o|y)\s*[^,;.\n]+)*)/i)

      if (firstMatch) firstCourses = firstMatch[1].split(/,|o|y/).map(s => s.trim()).filter(Boolean)
      if (secondMatch) secondCourses = secondMatch[1].split(/,|o|y/).map(s => s.trim()).filter(Boolean)
      if (dessertMatch) desserts = dessertMatch[1].split(/,|o|y/).map(s => s.trim()).filter(Boolean)
    } else {
      // Formato simple: "lentejas y merluza a 14.50"
      const withoutPrice = cleanBody.replace(/a\s+[0-9]+(?:[.,][0-9]{1,2})?\s*(?:€|eur|euros?)?/i, '').trim()
      const parts = withoutPrice.split(/\s+y\s+|\s+e\s+|,\s*/i).map(s => s.trim()).filter(Boolean)
      if (parts.length >= 2) {
        firstCourses = [parts[0]]
        secondCourses = [parts[1]]
        if (parts.length > 2) desserts = parts.slice(2)
      } else if (parts.length === 1) {
        firstCourses = [parts[0]]
      }
    }

    const sections = [
      { name: 'Primeros Platos', course_type: 'first' as CourseType, dish_names: firstCourses.length > 0 ? firstCourses : ['Primer Plato del Día'] },
      { name: 'Segundos Platos', course_type: 'second' as CourseType, dish_names: secondCourses.length > 0 ? secondCourses : ['Segundo Plato del Día'] },
      { name: 'Postre o Café', course_type: 'dessert' as CourseType, dish_names: desserts.length > 0 ? desserts : ['Postre Casero o Café'] },
    ]

    const stagingDailyMenu: StagingDailyMenu = {
      title: 'Menú del Día',
      fixed_price: fixedPrice,
      sections,
      is_active: true,
    }

    const summary = `Configuración de Menú del Día a ${fixedPrice.toFixed(2)} € (${firstCourses.join(', ')} / ${secondCourses.join(', ')})`

    const stagingDiff: StagingDiff = {
      action: 'command',
      summary,
      items: [],
      daily_menu: stagingDailyMenu,
      total_created: 0,
      total_updated: 1,
      total_paused: 0,
      total_activated: 0,
      requires_price_review_count: 0,
    }

    return {
      isCommand: true,
      commandType: 'daily_menu',
      parsed: {
        total_dishes: 0,
        total_categories: 0,
        categories: [],
        products: [],
        staging_diff: stagingDiff,
        command_executed: summary,
      },
      stagingDiff,
    }
  }

  // 2. Comando: Pausar o Reactivar Stock
  // Ej: "Pausa el cachopo que se agotó", "Agotado el cachopo", "Activa el cachopo", "Disponible de nuevo el cachopo"
  const pauseMatch = text.match(/(?:pausa|pausar|agota|agotado|desactiva|desactivar|bloquea|bloquear|sin\s+stock)\s+(?:el\s+|la\s+|los\s+|las\s+|stock\s+de\s+)?(.+)/i)
  const activateMatch = !pauseMatch ? text.match(/(?:activa|activar|reactiva|reactivar|disponible|habilitar|rep[oó]n|reponer)\s+(?:de\s+nuevo\s+)?(?:el\s+|la\s+|los\s+|las\s+|stock\s+de\s+)?(.+)/i) : null
  const targetMatch = pauseMatch || activateMatch

  if (targetMatch) {
    const isPausing = Boolean(pauseMatch)
    const rawTargetName = targetMatch[1]
      .replace(/\s+(?:que\s+se\s+agot[oó]|por\s+rotura\s+de\s+stock|hoy)$/i, '')
      .trim()
    const targetNorm = normalizeKey(rawTargetName)

    // Buscar coincidencias difusas o exactas en los productos existentes
    const matchedProducts = existingProducts.filter(p => {
      const pNorm = normalizeKey(p.name)
      return pNorm === targetNorm || pNorm.includes(targetNorm) || targetNorm.includes(pNorm)
    })

    if (matchedProducts.length > 0) {
      const updatedDishes: AiParsedDish[] = matchedProducts.map(p => {
        const cType = inferCourseType(p, existingCategories)
        return {
          id: p.id,
          name: p.name,
          description: p.description || '',
          price: p.price,
          category_id: p.category_id,
          allergens: p.allergens || [],
          action_type: 'update_stock',
          old_is_available: p.is_available,
          is_available: !isPausing,
          requires_price_review: false,
          course_type: cType,
          station: resolveStation(cType),
        }
      })

      const summary = isPausing
        ? `Stock pausado para: ${matchedProducts.map(p => p.name).join(', ')}`
        : `Stock activado para: ${matchedProducts.map(p => p.name).join(', ')}`

      const stagingDiff: StagingDiff = {
        action: 'command',
        summary,
        items: updatedDishes,
        total_created: 0,
        total_updated: updatedDishes.length,
        total_paused: isPausing ? updatedDishes.length : 0,
        total_activated: !isPausing ? updatedDishes.length : 0,
        requires_price_review_count: 0,
      }

      return {
        isCommand: true,
        commandType: 'stock_toggle',
        parsed: {
          total_dishes: updatedDishes.length,
          total_categories: 0,
          categories: [],
          products: updatedDishes,
          staging_diff: stagingDiff,
          command_executed: summary,
        },
        stagingDiff,
      }
    }
  }

  // 3. Comando: Modificación de Precios (Relativo o Absoluto)
  // Ej: "Sube 0,50 € todas las cervezas", "Baja un 10% los postres", "Pon el cachopo a 18,50 €"
  const priceAdjustMatch = text.match(/(?:sube|aumenta|incrementa|subir|baja|reduce|disminuye|bajar)\s+(?:un\s+)?([0-9]+(?:[.,][0-9]{1,2})?)\s*(€|euros?|%)\s+(?:a\s+)?(?:todas?\s+las?\s+|los?\s+|el\s+cat[aá]logo\s+de\s+)?(.+)/i)
  const directPriceMatch = !priceAdjustMatch && text.match(/(?:pon|cambia|actualiza|fija|establece)\s+(?:el\s+precio\s+de\s+|la\s+)?(.+?)\s+(?:a|por|en)\s+([0-9]+(?:[.,][0-9]{1,2})?)\s*(?:€|euros?)/i)

  if (priceAdjustMatch) {
    const isIncrease = /^(?:sube|aumenta|incrementa|subir)/i.test(priceAdjustMatch[0])
    const amountVal = parseFloat(priceAdjustMatch[1].replace(',', '.'))
    const isPercentage = priceAdjustMatch[2] === '%'
    const scopeTarget = priceAdjustMatch[3].replace(/[.!?]+$/, '').trim()

    // Filtrar platos aplicables usando el detector semántico de alcance
    const matchedProducts = existingProducts.filter(p => matchesScopeTarget(scopeTarget, p, existingCategories))

    if (matchedProducts.length > 0) {
      let requiresReviewCount = 0
      const updatedDishes: AiParsedDish[] = matchedProducts.map(p => {
        let newPrice = p.price
        if (isPercentage) {
          const delta = (p.price * amountVal) / 100
          newPrice = isIncrease ? p.price + delta : p.price - delta
        } else {
          newPrice = isIncrease ? p.price + amountVal : p.price - amountVal
        }

        newPrice = Math.round(newPrice * 100) / 100
        const isInvalid = newPrice <= 0
        if (isInvalid) {
          requiresReviewCount++
          newPrice = Math.max(0, newPrice)
        }

        const cType = inferCourseType(p, existingCategories)
        return {
          id: p.id,
          name: p.name,
          description: p.description || '',
          price: newPrice,
          old_price: p.price,
          category_id: p.category_id,
          allergens: p.allergens || [],
          action_type: 'update_price',
          is_available: p.is_available,
          requires_price_review: isInvalid,
          course_type: cType,
          station: resolveStation(cType),
        }
      })

      const summary = `${isIncrease ? 'Subida' : 'Bajada'} de ${amountVal}${isPercentage ? '%' : '€'} aplicada a ${updatedDishes.length} plato(s) (${scopeTarget})`
      const stagingDiff: StagingDiff = {
        action: 'command',
        summary,
        items: updatedDishes,
        total_created: 0,
        total_updated: updatedDishes.length,
        total_paused: 0,
        total_activated: 0,
        requires_price_review_count: requiresReviewCount,
      }

      return {
        isCommand: true,
        commandType: 'price_update',
        parsed: {
          total_dishes: updatedDishes.length,
          total_categories: 0,
          categories: [],
          products: updatedDishes,
          staging_diff: stagingDiff,
          command_executed: summary,
        },
        stagingDiff,
      }
    }
  }

  if (directPriceMatch) {
    const rawTargetName = directPriceMatch[1].trim()
    const targetNorm = normalizeKey(rawTargetName)
    const newPriceVal = parseFloat(directPriceMatch[2].replace(',', '.'))
    const validPrice = Math.max(0, Number(newPriceVal.toFixed(2)))

    const matchedProducts = existingProducts.filter(p => {
      const pNorm = normalizeKey(p.name)
      return pNorm === targetNorm || pNorm.includes(targetNorm) || targetNorm.includes(pNorm)
    })

    if (matchedProducts.length > 0) {
      const updatedDishes: AiParsedDish[] = matchedProducts.map(p => {
        const cType = inferCourseType(p, existingCategories)
        return {
          id: p.id,
          name: p.name,
          description: p.description || '',
          price: validPrice,
          old_price: p.price,
          category_id: p.category_id,
          allergens: p.allergens || [],
          action_type: 'update_price',
          is_available: p.is_available,
          requires_price_review: validPrice <= 0,
          course_type: cType,
          station: resolveStation(cType),
        }
      })

      const summary = `Precio actualizado para ${matchedProducts[0].name}: ${matchedProducts[0].price}€ -> ${validPrice}€`
      const stagingDiff: StagingDiff = {
        action: 'command',
        summary,
        items: updatedDishes,
        total_created: 0,
        total_updated: updatedDishes.length,
        total_paused: 0,
        total_activated: 0,
        requires_price_review_count: validPrice <= 0 ? 1 : 0,
      }

      return {
        isCommand: true,
        commandType: 'price_update',
        parsed: {
          total_dishes: updatedDishes.length,
          total_categories: 0,
          categories: [],
          products: updatedDishes,
          staging_diff: stagingDiff,
          command_executed: summary,
        },
        stagingDiff,
      }
    }
  }

  // 4. Comando: Creación de Plato Nuevo
  // Ej: "Crea la hamburguesa Trufada a 14 € con carne madurada y trufa"
  const createDishMatch = text.match(/(?:crea|crear|añade|añadir|agrega|agregar|nuevo\s+plato)\s+(?:el\s+plato\s+|la\s+hamburguesa\s+|un\s+plato\s+|el\s+|la\s+)?(.+?)(?:\s+(?:a|por|precio)\s+([0-9]+(?:[.,][0-9]{1,2})?)\s*(?:€|eur)?)?(?:\s+con\s+(.+))?$/i)
  if (createDishMatch && !text.includes('\n')) {
    const rawDishName = sanitizeText(createDishMatch[1].trim(), 80)
    const rawPriceStr = createDishMatch[2]
    const rawDesc = createDishMatch[3] ? sanitizeText(createDishMatch[3].trim(), 200) : ''

    if (rawDishName.length >= 2) {
      const priceVal = rawPriceStr ? parseFloat(rawPriceStr.replace(',', '.')) : 0
      const isPriceReview = !rawPriceStr || isNaN(priceVal) || priceVal <= 0
      const sanitizedPrice = isPriceReview ? 0 : Number(priceVal.toFixed(2))

      // Categoría sugerida
      const suggestedCatId = suggestCategoryForProduct(rawDishName, rawDesc, existingCategories) || existingCategories[0]?.id || crypto.randomUUID()
      const allergens = detectStrictAllergens(`${rawDishName} ${rawDesc}`)

      const dummyProd: Product = {
        id: crypto.randomUUID(),
        restaurant_id: targetRestaurantId,
        category_id: suggestedCatId,
        name: rawDishName,
        description: rawDesc,
        price: sanitizedPrice,
        price_type: 'unit',
        image_url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80',
        model_3d_url: null,
        is_available: true,
        allergens,
      }

      const cType = inferCourseType(dummyProd, existingCategories)
      const station = resolveStation(cType)

      const newDish: AiParsedDish = {
        id: dummyProd.id,
        name: rawDishName,
        description: rawDesc || 'Elaborado artesanalmente.',
        price: sanitizedPrice,
        category_id: suggestedCatId,
        allergens,
        action_type: 'create',
        is_available: true,
        requires_price_review: isPriceReview,
        course_type: cType,
        station,
      }

      const summary = `Nuevo plato a crear: ${rawDishName} (${sanitizedPrice > 0 ? sanitizedPrice + '€' : 'Requiere fijar precio'})`
      const stagingDiff: StagingDiff = {
        action: 'command',
        summary,
        items: [newDish],
        total_created: 1,
        total_updated: 0,
        total_paused: 0,
        total_activated: 0,
        requires_price_review_count: isPriceReview ? 1 : 0,
      }

      return {
        isCommand: true,
        commandType: 'dish_create',
        parsed: {
          total_dishes: 1,
          total_categories: existingCategories.length,
          categories: existingCategories.map(c => ({ id: c.id, name: c.name })),
          products: [newDish],
          staging_diff: stagingDiff,
          command_executed: summary,
        },
        stagingDiff,
      }
    }
  }

  return null
}

/**
 * Parsea un texto o transcripción completa de carta (OCR / Carta en texto)
 * aplicando deduplicación canónica, detección de alérgenos UE y enrutamiento a Cocina/Barra.
 */
export function parseFullMenuText(
  rawText: string,
  existingCategories: Category[] = [],
  existingProducts: Product[] = [],
  targetRestaurantId: string
): AiParsedMenuResult {
  const lines = rawText
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean)

  const parsedCategories: AiParsedCategory[] = []
  const parsedDishes: AiParsedDish[] = []
  let hasExplicitCategoryHeader = false

  let currentCategory: AiParsedCategory = {
    id: existingCategories[0]?.id || crypto.randomUUID(),
    name: existingCategories[0]?.name || 'PLATOS PRINCIPALES',
    order_index: 1,
  }
  parsedCategories.push(currentCategory)

  const priceRegex = /([0-9]+[.,][0-9]{1,2})\s*(?:€|eur|euros|\$)?/i
  const isCategoryHeaderRegex = /^([A-ZÁÉÍÓÚÑ0-9\s]{3,40}|#{1,3}\s*.+|[0-9]+\.\s*[A-ZÁÉÍÓÚÑ\s]+)$/

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // 1. Detectar si la línea es un encabezado de categoría
    const hasPrice = priceRegex.test(line) || /\b(?:s\/m|s\.m\.)\b/i.test(line)
    if (!hasPrice && (isCategoryHeaderRegex.test(line) || line.startsWith('---') || line.endsWith(':'))) {
      const cleanName = sanitizeText(line.replace(/^[#\-*\d.\s]+|[:]+$/g, '').trim(), 50)
      if (cleanName.length > 2) {
        hasExplicitCategoryHeader = true
        // Buscar si ya existe una categoría en el restaurante con nombre similar
        const existingCat = existingCategories.find(c => normalizeKey(c.name) === normalizeKey(cleanName))
        const existingInBatch = parsedCategories.find(c => normalizeKey(c.name) === normalizeKey(cleanName))

        if (existingInBatch) {
          currentCategory = existingInBatch
        } else if (existingCat) {
          currentCategory = { id: existingCat.id, name: existingCat.name, order_index: existingCat.order_index }
          parsedCategories.push(currentCategory)
        } else {
          currentCategory = {
            id: crypto.randomUUID(),
            name: cleanName.toUpperCase(),
            order_index: parsedCategories.length + 1,
          }
          parsedCategories.push(currentCategory)
        }
        continue
      }
    }

    // 2. Extraer precio
    const { price, isMarketPrice } = parsePrice(line)

    // 3. Separar nombre y descripción
    let rawName = line
      .replace(priceRegex, '')
      .replace(/[€$£\u20AC]/gi, '')
      .replace(/\b(?:eur|euros|s\/m|s\.m\.)\b/gi, '')
      .trim()
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

    // Línea siguiente como descripción
    if (!description && i + 1 < lines.length) {
      const nextLine = lines[i + 1]
      if (!priceRegex.test(nextLine) && !isCategoryHeaderRegex.test(nextLine) && nextLine.length > 10) {
        description = sanitizeText(nextLine, 300)
        i++
      }
    }

    rawName = rawName
      .replace(/[\s\-_:?¿!¡•*]+$/, '')
      .replace(/^[•\-\d.\s*]+/, '')
      .trim()
    const cleanName = sanitizeText(rawName, 100)
      .replace(/[\s\-_:?¿!¡•*]+$/, '')
      .trim()

    if (cleanName.length >= 2) {
      const fullDesc = description || 'Elaborado artesanalmente.'
      const allergens = detectStrictAllergens(`${cleanName} ${fullDesc}`)

      // Regla Anti-Alucinación: si no tiene precio o es S/M o <= 0, marcar para revisión
      const requiresPriceReview = isMarketPrice || price <= 0

      // Deduplicación Canónica por UUID contra productos existentes
      const normDishName = normalizeKey(cleanName)
      const existingMatch = existingProducts.find(p => normalizeKey(p.name) === normDishName)

      // Sugerir categoría óptima si no hubo encabezado explícito en la carta
      const suggestedCatId = suggestCategoryForProduct(cleanName, fullDesc, existingCategories)

      const dishId = existingMatch?.id || crypto.randomUUID()
      const categoryId = existingMatch?.category_id || (hasExplicitCategoryHeader ? currentCategory.id : (suggestedCatId || currentCategory.id))
      const matchedCat = existingCategories.find(c => c.id === categoryId) || parsedCategories.find(c => c.id === categoryId)
      const categoryName = matchedCat ? matchedCat.name : currentCategory.name

      // Clasificación de estación y pase
      const dummyProd: Product = {
        id: dishId,
        restaurant_id: targetRestaurantId,
        category_id: categoryId,
        name: cleanName,
        description: fullDesc,
        price,
        price_type: isMarketPrice ? 'weight' : 'unit',
        image_url: existingMatch?.image_url || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80',
        model_3d_url: null,
        is_available: true,
        allergens,
      }

      const courseType = inferCourseType(dummyProd, existingCategories)
      const station = resolveStation(courseType)

      const actionType = existingMatch
        ? (existingMatch.price !== price ? 'update_price' : 'unchanged')
        : 'create'

      parsedDishes.push({
        id: dishId,
        name: cleanName,
        description: fullDesc,
        price,
        old_price: existingMatch?.price,
        category_id: categoryId,
        category_name: categoryName,
        allergens,
        action_type: actionType,
        is_available: existingMatch?.is_available ?? true,
        requires_price_review: requiresPriceReview,
        course_type: courseType,
        station,
      })
    }
  }

  // Filtrar categorías con platos asociados
  const usedCatIds = new Set(parsedDishes.map(d => d.category_id))
  const allAvailableCats: AiParsedCategory[] = [
    ...parsedCategories,
    ...existingCategories.map(c => ({ id: c.id, name: c.name, order_index: c.order_index })),
  ]
  const finalCategories: AiParsedCategory[] = []
  const seenCatIds = new Set<string>()

  for (const cat of allAvailableCats) {
    if (usedCatIds.has(cat.id) && !seenCatIds.has(cat.id)) {
      seenCatIds.add(cat.id)
      finalCategories.push(cat)
    }
  }

  const totalCreated = parsedDishes.filter(d => d.action_type === 'create').length
  const totalUpdated = parsedDishes.filter(d => d.action_type === 'update_price').length
  const requiresReviewCount = parsedDishes.filter(d => d.requires_price_review).length

  const stagingDiff: StagingDiff = {
    action: 'import',
    summary: `Importación de carta: ${totalCreated} platos nuevos, ${totalUpdated} platos actualizados, ${requiresReviewCount} requieren revisión de precio.`,
    items: parsedDishes,
    total_created: totalCreated,
    total_updated: totalUpdated,
    total_paused: 0,
    total_activated: 0,
    requires_price_review_count: requiresReviewCount,
  }

  return {
    total_dishes: parsedDishes.length,
    total_categories: finalCategories.length,
    categories: finalCategories,
    products: parsedDishes,
    staging_diff: stagingDiff,
  }
}
