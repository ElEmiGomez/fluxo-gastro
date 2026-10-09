import { Category, Product } from '@/types/database.types'

export type CategoryGroup =
  | 'promos'
  | 'entradas'
  | 'principales'
  | 'burgers'
  | 'bebidas'
  | 'postres'
  | 'other'

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

  // 5. Bebidas / Cócteles / Vinos / Cervezas
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
    s.includes('coctel')
  ) {
    return 'bebidas'
  }

  // 6. Postres & Café / Dulces / Sobremesa
  if (
    s === 'c0000000-0000-0000-0000-000000000006' ||
    ['cat-10', 'cat-tca-7', 'cat-tm-1', 'cat-tm-7'].includes(s) ||
    s.includes('postre') ||
    s.includes('café') ||
    s.includes('cafe') ||
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
    pName.includes('tonica')
  ) {
    return 'bebidas'
  }
  if (
    pName.includes('volcán') ||
    pName.includes('volcan') ||
    pName.includes('tarta') ||
    pName.includes('café') ||
    pName.includes('cafe') ||
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
        result[idx] = {
          ...result[idx],
          ...prod,
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
      const merged: Product = {
        ...existing,
        ...prod,
        id: chosenId,
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
}

export function resolveCanonicalProductId(productId?: string | null): string {
  if (!productId) return ''
  const trimmed = productId.trim()
  return CANONICAL_PRODUCT_MAP[trimmed] || CANONICAL_PRODUCT_MAP[trimmed.toLowerCase()] || trimmed
}

