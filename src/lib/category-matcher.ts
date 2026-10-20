import { Category, Product, CourseType } from '@/types/database.types'

export type CategoryGroup =
  | 'promos'
  | 'entradas'
  | 'principales'
  | 'burgers'
  | 'bebidas'
  | 'postres'
  | 'other'

export interface ProductKindClassification {
  kind: 'drink' | 'coffee' | 'dessert' | 'meat' | 'starter' | 'main' | 'generic'
  isDrink: boolean
  isCoffee: boolean
  isDessert: boolean
  isMeatOrBurger: boolean
  isStarter: boolean
  isMain: boolean
  hasCookingPoint: boolean
  hasSideOptions: boolean
  defaultCourse: CourseType
}

/**
 * Detector universal de categoría y tipo gastronómico para cualquier producto,
 * previniendo anomalías o desconfiguraciones cuando se añade un plato nuevo en sala o administración.
 */
export function classifyProductKind(
  product?: { name?: string; category_id?: string; description?: string | null; category?: any } | null,
  categories: Category[] = [],
  explicitCategoryName?: string
): ProductKindClassification {
  if (!product) {
    return {
      kind: 'generic',
      isDrink: false,
      isCoffee: false,
      isDessert: false,
      isMeatOrBurger: false,
      isStarter: false,
      isMain: false,
      hasCookingPoint: false,
      hasSideOptions: false,
      defaultCourse: 'second',
    }
  }

  const normalize = (str?: string | null) =>
    (str || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()

  const pName = normalize(product.name)
  const pDesc = normalize(product.description)
  const pCatId = normalize(product.category_id)

  const catObj = categories.find(c => normalize(c.id) === pCatId)
  const catNameFromObj = normalize(product.category?.name)
  const catNameFromList = normalize(catObj?.name)
  const explicitCat = normalize(explicitCategoryName)
  const combinedCat = `${pCatId} ${catNameFromObj} ${catNameFromList} ${explicitCat}`

  // 1. Cafés e Infusiones
  const coffeeKeywords = [
    'cafe', 'cortado', 'espresso', 'cappuccino', 'capuchino', 'latte', 'macchiato',
    'infusion', 'te ', 'te verde', 'te negro', 'manzanilla', 'poleo', 'menta', 'tila',
    'rooibos', 'descafeinado', 'carajillo', 'bombon', 'cafeteria'
  ]
  const isCoffee = coffeeKeywords.some(kw => pName.includes(kw) || combinedCat.includes(kw))

  // 2. Bebidas / Cócteles / Vinos / Cervezas
  const drinkKeywords = [
    'bebida', 'trago', 'cocktail', 'coctel', 'cocteleria', 'copa', 'cerveza', 'birra',
    'caña', 'pinta', 'vino', 'tinto', 'blanco', 'rosado', 'cava', 'champagne', 'sidra',
    'licor', 'gin', 'tonic', 'tonica', 'vodka', 'ron', 'whisky', 'bourbon', 'tequila',
    'mezcal', 'vermut', 'vermouth', 'aperitivo', 'refresco', 'soda', 'gaseosa', 'cola',
    'coca', 'fanta', 'sprite', 'agua', 'zumo', 'jugo', 'mojito', 'caipiri', 'fernet', 'sangria'
  ]
  const isDrink = !isCoffee && drinkKeywords.some(kw => pName.includes(kw) || combinedCat.includes(kw))

  // 3. Postres / Dulces / Helados
  const dessertKeywords = [
    'postre', 'reposteria', 'dulce', 'sobremesa', 'tarta', 'torta', 'pastel', 'helado',
    'sorbete', 'volcan', 'coulant', 'flan', 'pudding', 'panna cotta', 'tiramisu',
    'cheesecake', 'brownie', 'crepe', 'gofre', 'mousse', 'churros', 'filloas', 'santiago'
  ]
  const isDessert = !isCoffee && !isDrink && dessertKeywords.some(kw => pName.includes(kw) || combinedCat.includes(kw))

  // 4. Carnes / Hamburguesas / Parrilla (requieren punto y guarnición)
  const meatKeywords = [
    'burger', 'hamburguesa', 'carne', 'parrilla', 'brasa', 'asado', 'bife', 'entrecot',
    'solomillo', 'chuleton', 'chuleta', 'costilla', 'costillar', 'ribs', 'milanesa',
    'entraña', 'vacio', 'matambre', 'picaña', 'lomo', 't-bone', 'tomahawk', 'churrasco',
    'secreto', 'presa', 'pluma', 'cochinillo', 'cordero', 'lechal', 'ternera', 'buey',
    'vaca', 'angus', 'wagyu'
  ]
  const isMeatOrBurger = !isCoffee && !isDrink && !isDessert && meatKeywords.some(kw => pName.includes(kw) || combinedCat.includes(kw))

  // 5. Entrantes / Tapas / Picoteo / Ensaladas
  const starterKeywords = [
    'entrada', 'entrante', 'aperitivo', 'tapa', 'picoteo', 'tabla', 'ensalada', 'nachos',
    'croquetas', 'bastones', 'mozzarella', 'rabas', 'calamares', 'zamburiñas', 'pulpo',
    'mejillones', 'padron', 'bravas', 'empanada', 'provoleta'
  ]
  const isStarter = !isCoffee && !isDrink && !isDessert && !isMeatOrBurger && starterKeywords.some(kw => pName.includes(kw) || combinedCat.includes(kw))

  // 6. Platos Principales Generales (pastas, pizzas, arroces, guisos, pescados)
  const mainKeywords = [
    'principal', 'segundo', 'pasta', 'pizza', 'arroz', 'paella', 'risotto', 'pescado',
    'marisco', 'guiso', 'sandwich', 'bocadillo', 'wrap', 'lasaña', 'ravioli', 'gnocchi'
  ]
  const isMain = !isCoffee && !isDrink && !isDessert && !isMeatOrBurger && !isStarter && mainKeywords.some(kw => pName.includes(kw) || combinedCat.includes(kw))

  let kind: 'drink' | 'coffee' | 'dessert' | 'meat' | 'starter' | 'main' | 'generic' = 'generic'
  let defaultCourse: CourseType = 'second'

  if (isCoffee) {
    kind = 'coffee'
    defaultCourse = 'drink'
  } else if (isDrink) {
    kind = 'drink'
    defaultCourse = 'drink'
  } else if (isDessert) {
    kind = 'dessert'
    defaultCourse = 'dessert'
  } else if (isMeatOrBurger) {
    kind = 'meat'
    defaultCourse = 'second'
  } else if (isStarter) {
    kind = 'starter'
    defaultCourse = 'first'
  } else if (isMain) {
    kind = 'main'
    defaultCourse = 'second'
  }

  return {
    kind,
    isDrink,
    isCoffee,
    isDessert,
    isMeatOrBurger,
    isStarter,
    isMain,
    hasCookingPoint: isMeatOrBurger,
    hasSideOptions: isMeatOrBurger,
    defaultCourse,
  }
}

/**
 * Determina el grupo canónico de una categoría por su ID o su nombre.
 */
export function getCategoryGroup(idOrName?: string | null): CategoryGroup {
  if (!idOrName) return 'other'
  const s = idOrName.toLowerCase().trim()

  // 1. Promos & Menú del Día
  if (
    s === 'c0000000-0000-0000-0000-000000000001' ||
    s === 'cat-1' ||
    s === 'cat-tca-1' ||
    s.includes('promo') ||
    s.includes('combo') ||
    s.includes('menú del día') ||
    s.includes('menu del dia')
  ) {
    return 'promos'
  }

  // 2. Entradas / Aperitivos / Tapas / Tablas / Ensaladas
  if (
    s === 'c0000000-0000-0000-0000-000000000002' ||
    ['cat-2', 'cat-3', 'cat-4', 'cat-tca-2', 'cat-tca-3', 'cat-tca-4', 'cat-tm-4'].includes(s) ||
    s.includes('entrada') ||
    s.includes('aperitivo') ||
    s.includes('tapa') ||
    s.includes('tabla') ||
    s.includes('ensalada') ||
    s.includes('picoteo')
  ) {
    return 'entradas'
  }

  // 3. Platos Principales / Carnes / Guisos / Pizzas / Sandwichs / Wraps
  if (
    s === 'c0000000-0000-0000-0000-000000000003' ||
    ['cat-5', 'cat-6', 'cat-8', 'cat-9', 'cat-tca-5', 'cat-tca-6'].includes(s) ||
    s.includes('principal') ||
    s.includes('carne') ||
    s.includes('guiso') ||
    s.includes('pizza') ||
    s.includes('sandwich') ||
    s.includes('wrap')
  ) {
    return 'principales'
  }

  // 4. Burgers / Hamburguesas
  if (
    s === 'c0000000-0000-0000-0000-000000000004' ||
    ['cat-7', 'cat-11'].includes(s) ||
    s.includes('burger') ||
    s.includes('hamburguesa')
  ) {
    return 'burgers'
  }

  // 5. Bebidas / Cócteles / Vinos / Cervezas / Cafés & Infusiones
  if (
    s === 'c0000000-0000-0000-0000-000000000005' ||
    ['cat-12', 'cat-13', 'cat-14', 'cat-15', 'cat-tca-8', 'cat-tca-9', 'cat-tca-10', 'cat-tm-2', 'cat-tm-3', 'cat-tm-5', 'cat-tm-6', 'cat-tm-8'].includes(s) ||
    s.includes('bebida') ||
    s.includes('trago') ||
    s.includes('cerveza') ||
    s.includes('vino') ||
    s.includes('licor') ||
    s.includes('gin') ||
    s.includes('refresco') ||
    s.includes('cóctel') ||
    s.includes('coctel') ||
    s.includes('café') ||
    s.includes('cafe') ||
    s.includes('infusión') ||
    s.includes('infusion') ||
    s.includes('té')
  ) {
    return 'bebidas'
  }

  // 6. Postres / Dulces / Repostería
  if (
    s === 'c0000000-0000-0000-0000-000000000006' ||
    ['cat-10', 'cat-tca-7', 'cat-tm-1', 'cat-tm-7'].includes(s) ||
    s.includes('postre') ||
    s.includes('dulce') ||
    s.includes('sobremesa')
  ) {
    return 'postres'
  }

  return 'other'
}

/**
 * Determina el grupo canónico de un producto considerando su category_id,
 * la categoría referenciada y su nombre como protección anti-fuga de combos.
 */
export function getProductGroup(product: Product, categories: Category[] = []): CategoryGroup {
  const pName = (product.name || '').toLowerCase().trim()
  const pCatId = (product.category_id || '').toLowerCase().trim()

  // Protección fundamental: Combos y Promos NUNCA deben clasificarse como burger o bebida individual
  if (
    pCatId === 'c0000000-0000-0000-0000-000000000001' ||
    pCatId === 'cat-1' ||
    pCatId === 'cat-tca-1' ||
    pName.startsWith('combo') ||
    pName.startsWith('promo') ||
    pName.includes('menú del día') ||
    pName.includes('menu del dia')
  ) {
    return 'promos'
  }

  // Protección de servicio: Cafés, infusiones y tés son SIEMPRE Bebidas (operación de Mozo/Barra, nunca Cocina)
  if (
    pName.includes('café') ||
    pName.includes('cafe') ||
    pName.includes('cortado') ||
    pName.includes('espresso') ||
    pName.includes('cappuccino') ||
    pName.includes('capuchino') ||
    pName.includes('carajillo') ||
    pName.includes('descafeinado') ||
    pName.includes('bombón') ||
    pName.includes('bombon') ||
    pName.includes('infusión') ||
    pName.includes('infusion') ||
    pName.includes('té') ||
    pName.includes('te verde') ||
    pName.includes('manzanilla') ||
    pName.includes('poleo')
  ) {
    return 'bebidas'
  }

  // 1. Verificar por product.category_id directo
  const directGroup = getCategoryGroup(product.category_id)
  if (directGroup !== 'other') {
    return directGroup
  }

  // 2. Si category_id es un ID de las categorías activas, verificar por el nombre de esa categoría
  const refCat = categories.find(c => c.id === product.category_id)
  if (refCat) {
    const refGroup = getCategoryGroup(refCat.name)
    if (refGroup !== 'other') {
      return refGroup
    }
  }

  // 3. Fallback controlado por palabras clave del plato (solo si category_id no estaba identificado)
  if (
    pName.includes('bastones') ||
    pName.includes('mozzarella') ||
    pName.includes('tabla') ||
    pName.includes('ensalada') ||
    pName.includes('nachos') ||
    pName.includes('croquetas') ||
    pName.includes('pulpo') ||
    pName.includes('zamburiñas')
  ) {
    return 'entradas'
  }
  if (
    pName.includes('milanesa') ||
    pName.includes('chuleton') ||
    pName.includes('chuletón') ||
    pName.includes('pizza') ||
    pName.includes('raxo') ||
    pName.includes('zorza')
  ) {
    return 'principales'
  }
  if (
    pName.includes('burger') ||
    pName.includes('hamburguesa') ||
    pName.includes('smash')
  ) {
    return 'burgers'
  }
  if (
    pName.includes('agua') ||
    pName.includes('coca') ||
    pName.includes('cerveza') ||
    pName.includes('gin') ||
    pName.includes('vino') ||
    pName.includes('tonica') ||
    pName.includes('café') ||
    pName.includes('cafe') ||
    pName.includes('infusión') ||
    pName.includes('infusion') ||
    pName.includes('té')
  ) {
    return 'bebidas'
  }
  if (
    pName.includes('volcán') ||
    pName.includes('volcan') ||
    pName.includes('tarta') ||
    pName.includes('cheesecake')
  ) {
    return 'postres'
  }

  return 'other'
}

/**
 * Emparejamiento unificado y estricto de productos con categorías.
 * Resuelve la discrepancia entre IDs de categorías en Supabase PostgreSQL (UUIDs c0000000-...)
 * e identificadores estándar de carta (cat-1, cat-2...), previniendo fugas de combos hacia
 * secciones de platos individuales como Burgers o Bebidas.
 */
export function isProductInCategory(
  product: Product,
  selectedCategoryId: string,
  categories: Category[] = []
): boolean {
  if (!selectedCategoryId || selectedCategoryId === 'all') {
    return true
  }

  const pName = (product.name || '').toLowerCase().trim()
  const isCombo =
    (product.category_id || '').toLowerCase() === 'c0000000-0000-0000-0000-000000000001' ||
    (product.category_id || '').toLowerCase() === 'cat-1' ||
    (product.category_id || '').toLowerCase() === 'cat-tca-1' ||
    pName.startsWith('combo') ||
    pName.startsWith('promo')

  // Obtener grupo de la categoría seleccionada
  const activeCategory = categories.find(c => c.id === selectedCategoryId)
  const selectedGroup = getCategoryGroup(activeCategory ? activeCategory.name : selectedCategoryId)

  // Si la categoría seleccionada es de un grupo conocido
  if (selectedGroup !== 'other') {
    // Si el producto es un combo/promo, SOLO debe aparecer en la pestaña 'promos'
    if (isCombo) {
      return selectedGroup === 'promos'
    }

    const prodGroup = getProductGroup(product, categories)
    if (prodGroup !== 'other') {
      return prodGroup === selectedGroup
    }
  }

  // Si la categoría es personalizada o no se identificó el grupo, coincidencia exacta de ID
  if (product.category_id === selectedCategoryId) {
    // Aún en coincidencia exacta, si el producto es combo no puede entrar en categorías que no sean promos
    if (isCombo && selectedGroup !== 'promos' && selectedGroup !== 'other') {
      return false
    }
    return true
  }

  return false
}

/**
 * Deduplica un array de productos eliminando repeticiones por ID o por nombre normalizado,
 * priorizando identificadores UUID de Supabase y preservando alérgenos y precios oficiales.
 */
export function deduplicateProducts(products: Product[]): Product[] {
  if (!Array.isArray(products) || products.length === 0) return []

  const result: Product[] = []
  const seenIds = new Set<string>()
  const seenNames = new Map<string, number>() // nombre normalizado -> índice en result

  for (const prod of products) {
    if (!prod) continue
    if (
      prod.id === 'b0000000-0000-0000-0000-000000000099' ||
      prod.id === 'p-dessert-pending-later' ||
      (prod.name || '').toLowerCase().includes('decidir postre')
    ) {
      continue
    }
    const normName = (prod.name || '')
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
    const isProdUuid = Boolean(
      prod.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(prod.id)
    )

    // 1. Coincidencia directa por ID
    if (prod.id && seenIds.has(prod.id)) {
      const idx = result.findIndex(p => p.id === prod.id)
      if (idx >= 0) {
        const effectiveAvailable =
          typeof prod.is_available === 'boolean'
            ? prod.is_available
            : (typeof result[idx].is_available === 'boolean' ? result[idx].is_available : true)

        result[idx] = {
          ...result[idx],
          ...prod,
          image_url: prod.image_url || result[idx].image_url || null,
          is_available: effectiveAvailable,
          allergens:
            Array.isArray(prod.allergens) && prod.allergens.length > 0
              ? prod.allergens
              : result[idx].allergens || [],
        }
      }
      continue
    }

    // 2. Coincidencia por nombre normalizado (mismo plato con ID legado vs UUID)
    if (normName && seenNames.has(normName)) {
      const idx = seenNames.get(normName)!
      const existing = result[idx]

      // Si el nuevo producto tiene UUID y el existente no, adoptar el UUID oficial
      const chosenId = isProdUuid ? prod.id : existing.id
      const effectiveAvailable =
        typeof prod.is_available === 'boolean'
          ? prod.is_available
          : (typeof existing.is_available === 'boolean' ? existing.is_available : true)

      const merged: Product = {
        ...existing,
        ...prod,
        id: chosenId,
        image_url: prod.image_url || existing.image_url || null,
        is_available: effectiveAvailable,
        allergens:
          Array.isArray(prod.allergens) && prod.allergens.length > 0
            ? prod.allergens
            : Array.isArray(existing.allergens) && existing.allergens.length > 0
            ? existing.allergens
            : [],
      }
      result[idx] = merged
      seenIds.add(chosenId)
      continue
    }

    // 3. Plato nuevo no visto
    result.push({ ...prod })
    if (prod.id) seenIds.add(prod.id)
    if (normName) seenNames.set(normName, result.length - 1)
  }

  return result
}

// Mapeo bidireccional entre identificadores legados ('p-...') y UUIDs canónicos oficiales de Supabase
export const CANONICAL_PRODUCT_MAP: Record<string, string> = {
  'p-promo-1': 'b0000000-0000-0000-0000-000000000001',
  'p-1': 'b0000000-0000-0000-0000-000000000002',
  'p-2': 'b0000000-0000-0000-0000-000000000002',
  'p-3': 'b0000000-0000-0000-0000-000000000002',
  'p-bur-1': 'b0000000-0000-0000-0000-000000000002',
  'p-beb-3': 'b0000000-0000-0000-0000-000000000003',
  'p-pos-1': 'b0000000-0000-0000-0000-000000000006',
  'p-pos-2': 'b0000000-0000-0000-0000-000000000007',
  'p-caf-1': 'b0000000-0000-0000-0000-000000000008',
  'p-beb-1': 'b0000000-0000-0000-0000-000000000009',
  'p-ent-1': 'b0000000-0000-0000-0000-000000000011',
  'p-tab-1': 'b0000000-0000-0000-0000-000000000012',
  'p-ens-1': 'b0000000-0000-0000-0000-000000000013',
  'p-pp-1': 'b0000000-0000-0000-0000-000000000014',
  'p-gal-1': 'b0000000-0000-0000-0000-000000000015',
  'p-bur-gallaecia': 'b0000000-0000-0000-0000-000000000016',
  'p-dessert-pending-later': 'b0000000-0000-0000-0000-000000000099',
  'b0000000-0000-0000-0000-000000000099': 'b0000000-0000-0000-0000-000000000099',
  'b0000000-0000-0000-0000-000000000021': 'b0000000-0000-0000-0000-000000000021',
  'b0000000-0000-0000-0000-000000000022': 'b0000000-0000-0000-0000-000000000022',
  'side-opt-0': 'b0000000-0000-0000-0000-000000000022',
  'side-opt-1': 'b0000000-0000-0000-0000-000000000022',
  'side-opt-2': 'b0000000-0000-0000-0000-000000000013',
  'bur-opt-1': 'b0000000-0000-0000-0000-000000000002',
  'bur-opt-2': 'b0000000-0000-0000-0000-000000000002',
  'bur-opt-3': 'b0000000-0000-0000-0000-000000000016',
  'drk-pinta-1': 'b0000000-0000-0000-0000-000000000009',
  'drk-pinta-2': 'b0000000-0000-0000-0000-000000000009',
  'drk-refresco': 'b0000000-0000-0000-0000-000000000021',
  'drk-agua': 'b0000000-0000-0000-0000-000000000021',
  'b0000000-0000-0000-0000-000000000020': 'b0000000-0000-0000-0000-000000000009',
  'b0000000-0000-0000-0000-000000000018': 'b0000000-0000-0000-0000-000000000007',
  'b0000000-0000-0000-0000-000000000019': 'b0000000-0000-0000-0000-000000000008',
}

export function resolveCanonicalProductId(productId?: string | null): string {
  if (!productId) return ''
  const trimmed = productId.trim()
  return CANONICAL_PRODUCT_MAP[trimmed] || CANONICAL_PRODUCT_MAP[trimmed.toLowerCase()] || trimmed
}

/**
 * Infiere automáticamente el CourseType ('first' | 'second' | 'dessert' | 'drink')
 * para un producto, garantizando la correcta división operativa entre Mozo/Barra y Cocina.
 */
export function inferCourseType(product?: Product | null, categories: Category[] = []): CourseType {
  if (!product) return 'second'
  const group = getProductGroup(product, categories)
  switch (group) {
    case 'bebidas':
      return 'drink'
    case 'postres':
      return 'dessert'
    case 'entradas':
      return 'first'
    case 'principales':
    case 'burgers':
    case 'promos':
    default:
      return 'second'
  }
}


