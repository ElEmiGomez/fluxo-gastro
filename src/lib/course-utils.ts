import { Order, OrderItem, CourseType, Product } from '@/types/database.types'
import { inferCourseType, resolveCanonicalProductId } from './category-matcher'
import { MOCK_PRODUCTS } from './supabase/mock-fallback'
import { PRODUCT_NAMES } from './i18n'

export const TAG_DRINK_SERVED = '[BARRA_SERVIDA]'
export const TAG_FOOD_READY = '[COCINA_LISTA]'
export const TAG_STARTER_READY = '[ENTRADA_LISTA]'
export const TAG_STARTER_SERVED = '[ENTRADA_SERVIDA]'
export const TAG_MAIN_FIRED = '[MARCHAR_PRINCIPAL]'
export const TAG_MAIN_COOKING = '[PRINCIPAL_EN_MARCHA]'
export const TAG_MAIN_READY = '[PRINCIPAL_LISTO]'
export const TAG_MAIN_SERVED = '[PRINCIPAL_SERVIDO]'
export const TAG_DESSERT_READY = '[POSTRE_LISTO]'
export const TAG_DESSERT_SERVED = '[POSTRE_SERVIDO]'
export const TAG_DESSERT_FIRED = '[MARCHAR_POSTRE]'
export const TAG_DESSERT_COOKING = '[POSTRE_EN_MARCHA]'
export const TAG_DESSERT_PENDING = '[POSTRE_PENDIENTE_ELECCION]'
export const TAG_PACK_HEADER = '[PACK_HEADER]'

export const STATION_PROGRESSION_TAGS = [
  TAG_DRINK_SERVED,
  '[BARRA: SERVIDA]',
  '[BARRA:SERVIDA]',
  TAG_FOOD_READY,
  '[COCINA: LISTA]',
  '[COCINA:LISTA]',
  TAG_STARTER_READY,
  TAG_STARTER_SERVED,
  '[ENTRADA_COCINANDO]',
  TAG_MAIN_FIRED,
  TAG_MAIN_COOKING,
  '[PRINCIPAL_COCINANDO]',
  TAG_MAIN_READY,
  TAG_MAIN_SERVED,
  TAG_DESSERT_READY,
  '[POSTRE: LISTO]',
  '[POSTRE:LISTO]',
  TAG_DESSERT_SERVED,
  '[POSTRE: SERVIDO]',
  '[POSTRE:SERVIDO]',
  TAG_DESSERT_FIRED,
  TAG_DESSERT_COOKING,
  '[POSTRE_COCINANDO]',
  TAG_DESSERT_PENDING,
  '[POSTRE_EN_ESPERA]',
  '[POSTRE: EN ESPERA]',
  TAG_PACK_HEADER,
  '[PACK_SUBITEM]',
  '[PACK_COMPONENT]',
  '[COURSE:first]',
  '[COURSE:second]',
  '[COURSE:dessert]',
  '[COURSE:drink]',
]

const GENERIC_PLACEHOLDER_NAMES = new Set([
  'bebida',
  'entrada',
  'principal',
  'postre',
  'plato',
  'producto',
  'item',
])

export function isGenericProductName(name?: string | null): boolean {
  if (!name) return true
  return GENERIC_PLACEHOLDER_NAMES.has(name.trim().toLowerCase())
}

/**
 * Resuelve y garantiza el objeto Product completo (con nombre real) para un OrderItem,
 * cruzando su product_id con el catálogo en memoria/Supabase, MOCK_PRODUCTS y PRODUCT_NAMES.
 */
export function resolveCatalogProductForItem(
  item: OrderItem | any,
  catalogProducts?: Product[]
): Product | undefined {
  if (!item) return undefined

  const existingProd = item.product || item.products
  if (existingProd && existingProd.name && !isGenericProductName(existingProd.name)) {
    return existingProd
  }

  const rawPid = String(
    item.product_id ||
    existingProd?.id ||
    item.id ||
    ''
  ).trim()
  const canonPid = resolveCanonicalProductId(rawPid) || rawPid
  const rawName = String(existingProd?.name || item.name || '').trim()

  const allMockProducts = Object.values(MOCK_PRODUCTS || {}).flat()
  const pool: Product[] = [...(catalogProducts || []), ...allMockProducts]

  // 1. Búsqueda por ID exacto o canónico
  if (rawPid || canonPid) {
    const byId = pool.find(p => {
      if (!p?.id) return false
      const pCanon = resolveCanonicalProductId(p.id) || p.id
      return (
        p.id === rawPid ||
        p.id === canonPid ||
        p.id.toLowerCase() === rawPid.toLowerCase() ||
        p.id.toLowerCase() === canonPid.toLowerCase() ||
        (canonPid && pCanon === canonPid)
      )
    })
    if (byId && byId.name && !isGenericProductName(byId.name)) {
      return {
        ...byId,
        ...(existingProd || {}),
        id: existingProd?.id || byId.id,
        name: byId.name,
        price: existingProd?.price ?? byId.price,
      }
    }
  }

  // 2. Búsqueda en diccionario multilingüe PRODUCT_NAMES
  const i18nEntry = (rawPid && PRODUCT_NAMES[rawPid]) || (canonPid && PRODUCT_NAMES[canonPid])
  if (i18nEntry && i18nEntry.es) {
    const matchedInPool = pool.find(p => p.id === canonPid || p.id === rawPid || p.name === i18nEntry.es)
    if (matchedInPool) return matchedInPool
    return {
      id: canonPid || rawPid || 'prod-hydrated',
      restaurant_id: existingProd?.restaurant_id || 'a0000000-0000-0000-0000-000000000001',
      category_id: existingProd?.category_id || 'cat-1',
      name: i18nEntry.es,
      description: existingProd?.description || '',
      price: Number(existingProd?.price ?? item.price ?? 0),
      image_url: existingProd?.image_url || null,
      model_3d_url: null,
      is_available: true,
    }
  }

  // 3. Si es cabecera de pack/menú, extraer nombre de las notas (ej. [Combo Pareja: ... #1])
  const notes = String(item.notes || '')
  if (item.is_pack_header || notes.includes(TAG_PACK_HEADER)) {
    const packMatch = notes.match(/\[((?:Combo|Menú|Menu|Promo|Pack)[^\]#]*?)(?:\s*#\d+)?\]/i)
    const packName = packMatch?.[1]?.trim() || (!isGenericProductName(rawName) ? rawName : 'Combo / Menú Especial')
    return {
      id: canonPid || rawPid || 'pack-header',
      restaurant_id: existingProd?.restaurant_id || 'a0000000-0000-0000-0000-000000000001',
      category_id: existingProd?.category_id || 'cat-promos',
      name: packName,
      description: existingProd?.description || '',
      price: Number(existingProd?.price ?? item.price ?? 0),
      image_url: existingProd?.image_url || null,
      model_3d_url: null,
      is_available: true,
    }
  }

  if (existingProd && existingProd.name) {
    return existingProd
  }

  return undefined
}

/**
 * Impone monotonía estricta en las notas de un ítem:
 * Si un ítem ya tiene etiqueta terminal de Entregado/Servido, garantiza que conserve
 * también sus etiquetas previas de Listo/Marchado y que jamás pueda revertirse.
 */
export function enforceMonotonicItemNotes(notes: string | null | undefined): string {
  let res = notes || ''
  if (!res) return ''

  if (res.includes(TAG_STARTER_SERVED) && !res.includes(TAG_STARTER_READY)) {
    res = `${res} ${TAG_STARTER_READY}`.trim()
  }
  if (res.includes(TAG_MAIN_SERVED)) {
    if (!res.includes(TAG_MAIN_FIRED)) res = `${res} ${TAG_MAIN_FIRED}`.trim()
    if (!res.includes(TAG_MAIN_READY)) res = `${res} ${TAG_MAIN_READY}`.trim()
  }
  if (res.includes(TAG_DESSERT_SERVED)) {
    if (!res.includes(TAG_DESSERT_FIRED)) res = `${res} ${TAG_DESSERT_FIRED}`.trim()
    if (!res.includes(TAG_DESSERT_READY)) res = `${res} ${TAG_DESSERT_READY}`.trim()
  }
  return res
}

/**
 * Fusiona las notas de un ítem con las notas de referencia ya confirmadas,
 * evitando que un ciclo de polling o respuesta de red revierta etiquetas irreversibles.
 */
export function mergeItemNotes(
  incomingNotes: string | null | undefined,
  referenceNotes: string | null | undefined
): string {
  const inStr = incomingNotes || ''
  const refStr = referenceNotes || ''
  if (!refStr) return enforceMonotonicItemNotes(inStr)

  let merged = inStr
  for (const tag of STATION_PROGRESSION_TAGS) {
    if (refStr.includes(tag) && !merged.includes(tag)) {
      merged = merged ? `${merged} ${tag}` : tag
    }
  }
  return enforceMonotonicItemNotes(merged)
}

/**
 * Propaga las etiquetas de progresión de fase almacenadas a nivel de orden (`order.notes`)
 * hacia cada uno de los `order_items` correspondientes a esa estación.
 */
export function propagateOrderLevelTagsToItems(
  items: OrderItem[] | any[],
  orderNotes?: string | null
): OrderItem[] {
  if (!items || items.length === 0) return []
  const ordNotes = orderNotes || ''

  return items.map(rawItem => {
    if (!rawItem) return rawItem
    let itemNotes = enforceMonotonicItemNotes(rawItem.notes)

    if (ordNotes && !isPackHeaderItem(rawItem)) {
      const course = getItemCourse(rawItem)
      const appendTagIfMissing = (tag: string) => {
        if (!itemNotes.includes(tag)) {
          itemNotes = itemNotes ? `${itemNotes} ${tag}` : tag
        }
      }

      if (course === 'drink') {
        if (ordNotes.includes(TAG_DRINK_SERVED)) appendTagIfMissing(TAG_DRINK_SERVED)
      } else if (course === 'first') {
        if (ordNotes.includes(TAG_STARTER_READY) || ordNotes.includes(TAG_FOOD_READY)) {
          appendTagIfMissing(TAG_STARTER_READY)
        }
        if (ordNotes.includes(TAG_STARTER_SERVED)) {
          appendTagIfMissing(TAG_STARTER_READY)
          appendTagIfMissing(TAG_STARTER_SERVED)
        }
      } else if (course === 'second') {
        if (ordNotes.includes(TAG_MAIN_FIRED)) appendTagIfMissing(TAG_MAIN_FIRED)
        if (ordNotes.includes(TAG_MAIN_COOKING)) appendTagIfMissing(TAG_MAIN_COOKING)
        if (ordNotes.includes(TAG_MAIN_READY) || ordNotes.includes(TAG_FOOD_READY)) {
          appendTagIfMissing(TAG_MAIN_READY)
        }
        if (ordNotes.includes(TAG_MAIN_SERVED)) {
          appendTagIfMissing(TAG_MAIN_FIRED)
          appendTagIfMissing(TAG_MAIN_READY)
          appendTagIfMissing(TAG_MAIN_SERVED)
        }
      } else if (course === 'dessert') {
        if (ordNotes.includes(TAG_DESSERT_FIRED)) appendTagIfMissing(TAG_DESSERT_FIRED)
        if (ordNotes.includes(TAG_DESSERT_COOKING)) appendTagIfMissing(TAG_DESSERT_COOKING)
        if (ordNotes.includes(TAG_DESSERT_READY)) appendTagIfMissing(TAG_DESSERT_READY)
        if (ordNotes.includes(TAG_DESSERT_SERVED)) {
          appendTagIfMissing(TAG_DESSERT_FIRED)
          appendTagIfMissing(TAG_DESSERT_READY)
          appendTagIfMissing(TAG_DESSERT_SERVED)
        }
      }
    }

    itemNotes = enforceMonotonicItemNotes(itemNotes)
    if (itemNotes !== (rawItem.notes || '')) {
      return { ...rawItem, notes: itemNotes }
    }
    return rawItem
  })
}

/**
 * Reconcilia un array de ítems de comanda preservando todas las etiquetas de progresión
 * ya adquiridas en el ciclo de vida (bebida servida, entrada servida, principal marchado, etc.)
 * así como los metadatos hidratados del producto (`item.product`).
 */
export function mergeOrderItemsCourseTags(
  currentItems: OrderItem[] | any[],
  referenceItems?: OrderItem[] | any[],
  orderNotes?: string | null
): OrderItem[] {
  if (!referenceItems || referenceItems.length === 0) {
    return propagateOrderLevelTagsToItems(currentItems || [], orderNotes)
  }
  if (!currentItems || currentItems.length === 0) {
    return propagateOrderLevelTagsToItems(referenceItems, orderNotes)
  }

  const usedRefIndices = new Set<number>()

  // Preservar cabeceras de pack/menú que existan en referenceItems pero no en currentItems (por filtrado DB)
  const missingPackHeaders: OrderItem[] = []
  referenceItems.forEach((refItem, rIdx) => {
    if (isPackHeaderItem(refItem)) {
      const existsInCurrent = currentItems.some(c => isPackHeaderItem(c))
      if (!existsInCurrent) {
        usedRefIndices.add(rIdx)
        missingPackHeaders.push({
          ...refItem,
          product: resolveCatalogProductForItem(refItem) || refItem.product || refItem.products,
        })
      }
    }
  })

  const mergedCurrent = currentItems.map((currItem, idx) => {
    // 1. Coincidencia por id único
    let matchIdx = currItem.id
      ? referenceItems.findIndex((r, rIdx) => !usedRefIndices.has(rIdx) && r.id === currItem.id)
      : -1

    // 2. Coincidencia por product_id o id canónico
    if (matchIdx === -1) {
      const cProdId = currItem.product_id || currItem.product?.id || currItem.products?.id
      const cCanon = resolveCanonicalProductId(cProdId) || cProdId
      matchIdx = referenceItems.findIndex((r, rIdx) => {
        if (usedRefIndices.has(rIdx) || isPackHeaderItem(r) !== isPackHeaderItem(currItem)) return false
        const rProdId = r.product_id || r.product?.id || r.products?.id
        const rCanon = resolveCanonicalProductId(rProdId) || rProdId
        return Boolean(
          (rProdId && cProdId && rProdId === cProdId) ||
          (rCanon && cCanon && rCanon === cCanon)
        )
      })
    }

    // 3. Coincidencia por mismo course entre ítems no emparejados
    if (matchIdx === -1) {
      const cCourse = getItemCourse(currItem)
      matchIdx = referenceItems.findIndex((r, rIdx) => {
        if (usedRefIndices.has(rIdx) || isPackHeaderItem(r) !== isPackHeaderItem(currItem)) return false
        return getItemCourse(r) === cCourse
      })
    }

    // 4. Coincidencia posicional 1:1 si las listas tienen el mismo tamaño
    if (matchIdx === -1 && currentItems.length === referenceItems.length && !usedRefIndices.has(idx)) {
      matchIdx = idx
    }

    if (matchIdx !== -1) {
      usedRefIndices.add(matchIdx)
      const matchedRef = referenceItems[matchIdx]
      const mergedNotes = mergeItemNotes(currItem.notes, matchedRef.notes)
      const bestProduct =
        (!isGenericProductName(currItem.product?.name) ? currItem.product : null) ||
        (!isGenericProductName(currItem.products?.name) ? currItem.products : null) ||
        (!isGenericProductName(matchedRef.product?.name) ? matchedRef.product : null) ||
        (!isGenericProductName((matchedRef as any).products?.name) ? (matchedRef as any).products : null) ||
        resolveCatalogProductForItem(currItem) ||
        resolveCatalogProductForItem(matchedRef) ||
        currItem.product ||
        matchedRef.product

      const mergedItem = {
        ...matchedRef,
        ...currItem,
        id: currItem.id || matchedRef.id,
        product_id: currItem.product_id || matchedRef.product_id || bestProduct?.id,
        product: bestProduct,
        notes: mergedNotes,
        course: currItem.course || matchedRef.course || getItemCourse({ ...currItem, product: bestProduct, notes: mergedNotes }),
        is_complimentary: currItem.is_complimentary ?? matchedRef.is_complimentary,
        is_pack_header: currItem.is_pack_header ?? matchedRef.is_pack_header,
        is_pack_component: currItem.is_pack_component ?? matchedRef.is_pack_component,
        pack_id: currItem.pack_id ?? matchedRef.pack_id,
      } as OrderItem
      return mergedItem
    }

    const hydratedProd = resolveCatalogProductForItem(currItem) || currItem.product || currItem.products
    return {
      ...currItem,
      product: hydratedProd,
      notes: enforceMonotonicItemNotes(currItem.notes),
      course: currItem.course || getItemCourse({ ...currItem, product: hydratedProd }),
    } as OrderItem
  })

  return propagateOrderLevelTagsToItems([...missingPackHeaders, ...mergedCurrent], orderNotes)
}

/**
 * Hidrata obligatoriamente todos los ítems de una comanda cruzando su product_id
 * con el catálogo (`catalogProducts`, `MOCK_PRODUCTS`, `PRODUCT_NAMES`), reconciliando
 * etiquetas con `referenceItems` y propagando las etiquetas de `orderNotes`.
 */
export function hydrateOrderItemsWithCatalog(
  items: OrderItem[] | any[],
  catalogProducts?: Product[],
  referenceItems?: OrderItem[] | any[] | null,
  orderNotes?: string | null
): OrderItem[] {
  const baseItems =
    items && items.length > 0
      ? items
      : referenceItems && referenceItems.length > 0
        ? referenceItems
        : []

  if (baseItems.length === 0) return []

  const reconciled =
    referenceItems && referenceItems.length > 0
      ? mergeOrderItemsCourseTags(baseItems, referenceItems, orderNotes)
      : propagateOrderLevelTagsToItems(baseItems, orderNotes)

  return reconciled.map(it => {
    const resolvedProd = resolveCatalogProductForItem(it, catalogProducts) || it.product || (it as any).products
    const effectiveNotes = enforceMonotonicItemNotes(it.notes)
    const effectiveCourse =
      it.course && ['first', 'second', 'dessert', 'drink'].includes(it.course)
        ? it.course
        : getItemCourse({ ...it, product: resolvedProd, notes: effectiveNotes })

    return {
      ...it,
      product_id: it.product_id || resolvedProd?.id,
      product: resolvedProd,
      notes: effectiveNotes,
      course: effectiveCourse,
    } as OrderItem
  })
}

/**
 * Elimina cualquier etiqueta técnica interna entre corchetes de estaciones de cocina/barra
 */
export function stripInternalStationTags(rawNotes?: string | null): string {
  if (!rawNotes) return ''
  return rawNotes
    .replace(/\[(?:BARRA_SERVIDA|BARRA:\s*SERVIDA|COCINA_LISTA|COCINA:\s*LISTA|ENTRADA_LISTA|ENTRADA_SERVIDA|MARCHAR_PRINCIPAL|PRINCIPAL_EN_MARCHA|PRINCIPAL_LISTO|PRINCIPAL_SERVIDO|POSTRE_LISTO|POSTRE:\s*LISTO|POSTRE_SERVIDO|POSTRE:\s*SERVIDO|POSTRE_EN_ESPERA|POSTRE:\s*EN\s*ESPERA|POSTRE_EN_MARCHA|PASE_1|PASE_2|MARCHAR_POSTRE|POSTRE_PENDIENTE_ELECCION|PACK_HEADER|PACK_SUBITEM|PACK_COMPONENT|COURSE:\s*[a-z]+|Combo[^\]]*|Menú[^\]]*|Menu[^\]]*|Promo[^\]]*|Pack[^\]]*).*?\]/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

/**
 * Limpia notas de sistema para visualización de cara al personal y al cliente.
 */
export function cleanItemNotes(notes?: string | null): string {
  return stripInternalStationTags(notes)
}

/**
 * Determina si un ítem es la cabecera contable/financiera de un pack o menú
 */
export function isPackHeaderItem(item: OrderItem): boolean {
  if (!item) return false
  if (item.is_pack_header) return true
  const notes = item.notes || ''
  if (notes.includes(TAG_PACK_HEADER)) return true
  const rawId = String(item.product_id || item.product?.id || '')
  if (rawId.startsWith('daily-menu-') && !item.is_pack_component) {
    return true
  }
  return false
}

/**
 * Determina si un postre es un comodín pendiente de elección por parte del comensal
 */
export function isDessertPendingChoice(item: OrderItem): boolean {
  return Boolean(item?.notes && item.notes.includes(TAG_DESSERT_PENDING))
}

// Jerarquía formal y monotónica de estados de comanda
export const ORDER_STATUS_HIERARCHY: Record<string, number> = {
  pending_validation: 0,
  pending: 1,
  confirmed: 2,
  preparing: 3,
  ready: 4,
  delivered: 5,
  paid: 6,
  cancelled: -1,
}

export function isStatusAtLeast(status: string | null | undefined, targetStatus: string): boolean {
  if (!status) return false
  const sRank = ORDER_STATUS_HIERARCHY[status] ?? 0
  const tRank = ORDER_STATUS_HIERARCHY[targetStatus] ?? 0
  if (sRank === -1 || tRank === -1) return false
  return sRank >= tRank
}

export function hasItemProgressionTag(notes?: string | null): boolean {
  if (!notes) return false
  return (
    notes.includes(TAG_DRINK_SERVED) ||
    notes.includes('[BARRA: SERVIDA]') ||
    notes.includes('[BARRA:SERVIDA]') ||
    notes.includes(TAG_FOOD_READY) ||
    notes.includes('[COCINA: LISTA]') ||
    notes.includes('[COCINA:LISTA]') ||
    notes.includes(TAG_STARTER_READY) ||
    notes.includes(TAG_STARTER_SERVED) ||
    notes.includes(TAG_MAIN_FIRED) ||
    notes.includes(TAG_MAIN_COOKING) ||
    notes.includes(TAG_MAIN_READY) ||
    notes.includes(TAG_MAIN_SERVED) ||
    notes.includes(TAG_DESSERT_READY) ||
    notes.includes(TAG_DESSERT_SERVED) ||
    notes.includes(TAG_DESSERT_FIRED) ||
    notes.includes(TAG_DESSERT_COOKING)
  )
}

export function orderHasProgressionTags(order?: Order | null): boolean {
  if (!order) return false
  if (hasItemProgressionTag(order.notes)) return true
  return (order.order_items || []).some(it => hasItemProgressionTag(it.notes))
}

export function getItemCourse(item: OrderItem | any): CourseType {
  if (item?.course && ['first', 'second', 'dessert', 'drink'].includes(item.course)) {
    return item.course
  }
  const notes = item?.notes || ''
  if (notes.includes('[COURSE:first]')) return 'first'
  if (notes.includes('[COURSE:second]')) return 'second'
  if (notes.includes('[COURSE:dessert]') || notes.includes(TAG_DESSERT_PENDING)) return 'dessert'
  if (notes.includes('[COURSE:drink]')) return 'drink'
  const prod = item?.product || item?.products
  if (prod && prod.name && !isGenericProductName(prod.name)) {
    return inferCourseType(prod)
  }

  // Fallback por identificador de producto cuando la relación product no fue hidratada en Supabase
  const rawPid = String(item?.product_id || prod?.id || item?.id || '').toLowerCase()
  const canonPid = String(resolveCanonicalProductId(rawPid) || rawPid).toLowerCase()
  if (
    rawPid.startsWith('p-beb') ||
    rawPid.startsWith('drk-') ||
    rawPid.startsWith('p-caf') ||
    canonPid === 'b0000000-0000-0000-0000-000000000003' ||
    canonPid === 'b0000000-0000-0000-0000-000000000008' ||
    canonPid === 'b0000000-0000-0000-0000-000000000009' ||
    canonPid === 'b0000000-0000-0000-0000-000000000019' ||
    canonPid === 'b0000000-0000-0000-0000-000000000020' ||
    canonPid === 'b0000000-0000-0000-0000-000000000021'
  ) {
    return 'drink'
  }
  if (
    rawPid.startsWith('p-pos') ||
    rawPid.startsWith('p-dessert') ||
    canonPid === 'b0000000-0000-0000-0000-000000000006' ||
    canonPid === 'b0000000-0000-0000-0000-000000000007' ||
    canonPid === 'b0000000-0000-0000-0000-000000000018' ||
    canonPid === 'b0000000-0000-0000-0000-000000000099'
  ) {
    return 'dessert'
  }
  if (
    rawPid.startsWith('p-ent') ||
    rawPid.startsWith('side-opt') ||
    rawPid.startsWith('p-tab') ||
    rawPid.startsWith('p-ens') ||
    canonPid === 'b0000000-0000-0000-0000-000000000011' ||
    canonPid === 'b0000000-0000-0000-0000-000000000012' ||
    canonPid === 'b0000000-0000-0000-0000-000000000013' ||
    canonPid === 'b0000000-0000-0000-0000-000000000022'
  ) {
    return 'first'
  }

  return inferCourseType(prod)
}

export function isDrinkItem(item: OrderItem): boolean {
  if (isPackHeaderItem(item)) return false
  return getItemCourse(item) === 'drink'
}

export function isFoodItem(item: OrderItem): boolean {
  if (isPackHeaderItem(item)) return false
  const c = getItemCourse(item)
  return c === 'first' || c === 'second'
}

export function isDessertItem(item: OrderItem): boolean {
  if (isPackHeaderItem(item)) return false
  return getItemCourse(item) === 'dessert'
}

export function isStarterItem(item: OrderItem): boolean {
  if (isPackHeaderItem(item)) return false
  return getItemCourse(item) === 'first'
}

export function isMainItem(item: OrderItem): boolean {
  if (isPackHeaderItem(item)) return false
  return getItemCourse(item) === 'second'
}

export function isDrinkServed(item: OrderItem, order?: Order | any): boolean {
  if (order && typeof order === 'object' && Boolean((order as any).notes?.includes(TAG_DRINK_SERVED))) {
    return true
  }
  return Boolean(
    item?.notes &&
      (item.notes.includes(TAG_DRINK_SERVED) ||
        item.notes.includes('[BARRA: SERVIDA]') ||
        item.notes.includes('[BARRA:SERVIDA]'))
  )
}

export function isFoodReady(item: OrderItem, parentOrder?: any): boolean {
  if (isStarterItem(item)) return isStarterReady(item)
  if (isMainItem(item)) return isMainReady(item)
  return Boolean(
    item?.notes &&
      (item.notes.includes(TAG_FOOD_READY) ||
        item.notes.includes('[COCINA: LISTA]') ||
        item.notes.includes('[COCINA:LISTA]'))
  )
}

export function isFoodServed(item: OrderItem, parentOrder?: any): boolean {
  if (isStarterItem(item)) return isStarterServed(item)
  if (isMainItem(item)) return isMainServed(item)
  return false
}

export function isStarterReady(item: OrderItem, parentOrder?: any): boolean {
  const pNotes = typeof parentOrder === 'string' ? parentOrder : parentOrder?.notes || ''
  if (pNotes && (pNotes.includes(TAG_STARTER_READY) || pNotes.includes(TAG_STARTER_SERVED) || pNotes.includes(TAG_FOOD_READY))) return true
  return Boolean(
    item?.notes &&
      (item.notes.includes(TAG_STARTER_READY) ||
        item.notes.includes(TAG_STARTER_SERVED) ||
        item.notes.includes(TAG_FOOD_READY) ||
        item.notes.includes('[COCINA: LISTA]') ||
        item.notes.includes('[COCINA:LISTA]'))
  )
}

export function isStarterServed(item: OrderItem, parentOrder?: any): boolean {
  if (item?.notes && item.notes.includes(TAG_STARTER_SERVED)) return true
  if (parentOrder && typeof parentOrder === 'object') {
    if (parentOrder.notes?.includes(TAG_STARTER_SERVED)) return true
    if (parentOrder.status === 'delivered' || parentOrder.status === 'paid') return true
    if (
      parentOrder.notes?.includes(TAG_MAIN_SERVED) ||
      parentOrder.notes?.includes(TAG_DESSERT_FIRED) ||
      parentOrder.notes?.includes(TAG_DESSERT_SERVED) ||
      orderHasActiveDesserts(parentOrder) ||
      (orderHasDesserts(parentOrder) && (isOrderDessertsReady(parentOrder) || areOrderDessertsServed(parentOrder) || areOrderDessertsCooking(parentOrder)))
    ) {
      return true
    }
  }
  return false
}

export function isMainCooking(item: OrderItem, parentOrder?: any): boolean {
  const pNotes = typeof parentOrder === 'string' ? parentOrder : parentOrder?.notes || ''
  if (pNotes && pNotes.includes(TAG_MAIN_COOKING)) return true
  return Boolean(item?.notes && item.notes.includes(TAG_MAIN_COOKING))
}

export function isMainReady(item: OrderItem, parentOrder?: any): boolean {
  if (parentOrder && typeof parentOrder === 'object') {
    if (parentOrder.notes?.includes(TAG_MAIN_READY) || parentOrder.notes?.includes(TAG_MAIN_SERVED)) return true
    if (parentOrder.status === 'delivered' || parentOrder.status === 'paid') return true
  }
  return Boolean(
    item?.notes &&
      (item.notes.includes(TAG_MAIN_READY) ||
        item.notes.includes(TAG_MAIN_SERVED) ||
        item.notes.includes(TAG_FOOD_READY) ||
        item.notes.includes('[COCINA: LISTA]') ||
        item.notes.includes('[COCINA:LISTA]'))
  )
}

export function isMainServed(item: OrderItem, parentOrder?: any): boolean {
  if (item?.notes && item.notes.includes(TAG_MAIN_SERVED)) return true
  if (typeof parentOrder === 'string' && (parentOrder.includes(TAG_MAIN_SERVED) || parentOrder.includes(TAG_DESSERT_FIRED) || parentOrder.includes(TAG_DESSERT_SERVED))) return true
  if (parentOrder && typeof parentOrder === 'object') {
    if (parentOrder.notes?.includes(TAG_MAIN_SERVED)) return true
    if (parentOrder.status === 'delivered' || parentOrder.status === 'paid') return true
    if (
      parentOrder.notes?.includes(TAG_DESSERT_FIRED) ||
      parentOrder.notes?.includes(TAG_DESSERT_SERVED) ||
      orderHasActiveDesserts(parentOrder) ||
      (orderHasDesserts(parentOrder) && (isOrderDessertsReady(parentOrder) || areOrderDessertsServed(parentOrder) || areOrderDessertsCooking(parentOrder)))
    ) {
      return true
    }
  }
  return false
}

export function isDessertServed(item: OrderItem, parentOrder?: any): boolean {
  if (typeof parentOrder === 'string' && (parentOrder.includes(TAG_DESSERT_SERVED) || parentOrder.includes('[POSTRE: SERVIDO]') || parentOrder.includes('[POSTRE:SERVIDO]'))) return true
  if (
    item?.notes &&
    (item.notes.includes(TAG_DESSERT_SERVED) ||
      item.notes.includes('[POSTRE: SERVIDO]') ||
      item.notes.includes('[POSTRE:SERVIDO]'))
  ) {
    return true
  }
  if (parentOrder && typeof parentOrder === 'object') {
    if (parentOrder.notes?.includes(TAG_DESSERT_SERVED)) return true
    if (parentOrder.status === 'paid') return true
    if (
      parentOrder.status === 'delivered' &&
      !item?.notes?.includes(TAG_DESSERT_FIRED) &&
      !item?.notes?.includes(TAG_DESSERT_COOKING) &&
      !item?.notes?.includes(TAG_DESSERT_READY) &&
      !item?.notes?.includes(TAG_DESSERT_PENDING) &&
      !orderHasHeldDesserts(parentOrder)
    ) {
      return true
    }
  }
  return false
}

export function isDessertReady(item: OrderItem, parentOrder?: any): boolean {
  if (parentOrder && typeof parentOrder === 'object') {
    if (parentOrder.notes?.includes(TAG_DESSERT_READY) || parentOrder.notes?.includes(TAG_DESSERT_SERVED)) return true
    if (parentOrder.status === 'paid') return true
  }
  return Boolean(
    item?.notes &&
      (item.notes.includes(TAG_DESSERT_READY) ||
        item.notes.includes('[POSTRE: LISTO]') ||
        item.notes.includes('[POSTRE:LISTO]') ||
        item.notes.includes(TAG_DESSERT_SERVED) ||
        item.notes.includes('[POSTRE: SERVIDO]') ||
        item.notes.includes('[POSTRE:SERVIDO]'))
  )
}

export function isDessertFired(item: OrderItem, parentOrder?: any): boolean {
  const pNotes = typeof parentOrder === 'string' ? parentOrder : `${parentOrder?.notes || ''} ${parentOrder?.kitchen_notes || ''}`
  if (pNotes && (pNotes.includes(TAG_DESSERT_FIRED) || pNotes.includes(TAG_DESSERT_COOKING) || pNotes.includes(TAG_DESSERT_READY) || pNotes.includes(TAG_DESSERT_SERVED))) return true
  return Boolean(
    item?.notes &&
      (item.notes.includes(TAG_DESSERT_FIRED) ||
        item.notes.includes(TAG_DESSERT_COOKING) ||
        item.notes.includes(TAG_DESSERT_READY) ||
        item.notes.includes(TAG_DESSERT_SERVED))
  )
}

export function isDessertCooking(item: OrderItem, parentOrder?: any): boolean {
  const pNotes = typeof parentOrder === 'string' ? parentOrder : parentOrder?.notes || ''
  if (pNotes && pNotes.includes(TAG_DESSERT_COOKING)) return true
  return Boolean(item?.notes && item.notes.includes(TAG_DESSERT_COOKING))
}

export function areOrderDessertsCooking(order: Order): boolean {
  const desserts = (order.order_items || []).filter(isDessertItem)
  if (desserts.length === 0) return true
  if ((order as any).notes?.includes(TAG_DESSERT_COOKING)) return true
  return desserts.some(isDessertCooking)
}

export function orderHasDrinks(order: Order): boolean {
  return (order.order_items || []).some(isDrinkItem)
}

export function orderHasFood(order: Order): boolean {
  return (order.order_items || []).some(isFoodItem)
}

export function orderHasStarters(order: Order): boolean {
  return (order.order_items || []).some(isStarterItem)
}

export function orderHasMains(order: Order): boolean {
  return (order.order_items || []).some(isMainItem)
}

export function areOrderStartersReady(order: Order): boolean {
  const starters = (order.order_items || []).filter(isStarterItem)
  if (starters.length === 0) return true
  if ((order as any).notes?.includes(TAG_STARTER_READY) || (order as any).notes?.includes(TAG_STARTER_SERVED)) {
    return true
  }
  return starters.every(it => isStarterReady(it) || isStarterServed(it, order))
}

export function areOrderStartersServed(order: Order): boolean {
  if (order.status === 'delivered' || order.status === 'paid') return true
  if ((order as any).notes?.includes(TAG_STARTER_SERVED)) return true
  const starters = (order.order_items || []).filter(isStarterItem)
  if (starters.length === 0) return true
  return starters.every(it => isStarterServed(it, order))
}

export function isMainFired(item: OrderItem, parentOrder?: any): boolean {
  const pNotes = typeof parentOrder === 'string' ? parentOrder : `${parentOrder?.notes || ''} ${parentOrder?.kitchen_notes || ''}`
  if (pNotes && (pNotes.includes(TAG_MAIN_FIRED) || pNotes.includes(TAG_MAIN_COOKING) || pNotes.includes(TAG_MAIN_READY) || pNotes.includes(TAG_MAIN_SERVED))) return true
  return Boolean(
    item?.notes &&
      (item.notes.includes(TAG_MAIN_FIRED) ||
        item.notes.includes(TAG_MAIN_COOKING) ||
        item.notes.includes('[PRINCIPAL_COCINANDO]') ||
        item.notes.includes(TAG_MAIN_READY) ||
        item.notes.includes(TAG_MAIN_SERVED))
  )
}

export function areOrderMainsFired(order: Order): boolean {
  if (order.status === 'paid') return true
  const mains = (order.order_items || []).filter(isMainItem)
  if (mains.length === 0) return true
  // Si la comanda no tiene entrantes, los principales se consideran marchados de inicio
  if (!orderHasStarters(order)) return true
  if (
    (order as any).notes?.includes(TAG_MAIN_FIRED) ||
    (order as any).kitchen_notes?.includes(TAG_MAIN_FIRED) ||
    (order as any).notes?.includes(TAG_MAIN_COOKING) ||
    (order as any).notes?.includes(TAG_MAIN_READY) ||
    (order as any).notes?.includes(TAG_MAIN_SERVED)
  ) {
    return true
  }
  return mains.some(isMainFired)
}

export function areOrderMainsReady(order: Order): boolean {
  const mains = (order.order_items || []).filter(isMainItem)
  if (mains.length === 0) return true
  if ((order as any).notes?.includes(TAG_MAIN_READY) || (order as any).notes?.includes(TAG_MAIN_SERVED)) {
    return true
  }
  return mains.every(it => isMainReady(it) || isMainServed(it, order))
}

export function areOrderMainsServed(order: Order): boolean {
  if (order.status === 'delivered' || order.status === 'paid') return true
  if ((order as any).notes?.includes(TAG_MAIN_SERVED)) return true
  const mains = (order.order_items || []).filter(isMainItem)
  if (mains.length === 0) return true
  return mains.every(it => isMainServed(it, order))
}

export function areOrderDessertsServed(order: Order): boolean {
  if (order.status === 'paid') return true
  if ((order as any).notes?.includes(TAG_DESSERT_SERVED)) return true
  const desserts = (order.order_items || []).filter(isDessertItem)
  if (desserts.length === 0) return true
  return desserts.every(it => isDessertServed(it, order))
}

export function orderHasDesserts(order: Order): boolean {
  return (order.order_items || []).some(isDessertItem)
}

/**
 * Retorna true si la orden tiene postres que aún no han sido servidos en mesa.
 * Esto incluye postres comodín pendientes de elección, postres retenidos en espera del mozo,
 * postres en preparación en cocina, o postres listos esperando ser llevados a la mesa.
 */
export function orderHasPendingDesserts(order: Order): boolean {
  if (['cancelled', 'paid'].includes(order.status)) return false
  if ((order as any).notes?.includes(TAG_DESSERT_SERVED)) return false
  const desserts = (order.order_items || []).filter(isDessertItem)
  if (desserts.length === 0) return false
  return desserts.some(d => !isDessertServed(d, order))
}

export function ordersHavePendingDesserts(orders: Order[]): boolean {
  return orders.some(orderHasPendingDesserts)
}

/**
 * Retorna true si la comanda tiene platos listos en cocina pendientes de ser retirados por el mozo.
 * Previene mostrar pedidos en 'Recoger en cocina' si sus entradas ya se sirvieron y los principales siguen esperando marcha.
 */
export function isOrderReadyToPick(order: Order): boolean {
  if (order.status !== 'ready') return false
  const items = order.order_items || []
  if (items.length === 0) return true

  const hasReadyStarters = items.some(it => isStarterItem(it) && isStarterReady(it) && !isStarterServed(it, order))
  const hasReadyMains = items.some(it => isMainItem(it) && isMainReady(it) && !isMainServed(it, order))
  const hasReadyDesserts = items.some(it => isDessertItem(it) && isDessertReady(it) && !isDessertServed(it, order))
  const hasGeneralFood = items.some(it => isFoodItem(it) && isFoodReady(it) && !isFoodServed(it))

  return hasReadyStarters || hasReadyMains || hasReadyDesserts || hasGeneralFood
}

export function isDrinkOnlyOrder(input?: Order | OrderItem[] | null): boolean {
  if (!input) return false
  const rawItems = Array.isArray(input) ? input : (input as Order).order_items
  const items = (rawItems || []).filter(it => !isPackHeaderItem(it))
  if (items.length === 0) return false
  return items.every(isDrinkItem)
}

/**
 * Retorna true si la orden tiene postres retenidos que aún no han sido marchados a cocina ni entregados.
 * Regla inteligente: Si la comanda es SOLO de postres (segunda ronda), NO se retienen; van directos a preparación.
 */
export function orderHasHeldDesserts(order: Order): boolean {
  if (!orderHasFood(order)) return false
  const desserts = (order.order_items || []).filter(isDessertItem)
  if (desserts.length === 0) return false
  if (
    (order as any).notes?.includes(TAG_DESSERT_FIRED) ||
    (order as any).kitchen_notes?.includes(TAG_DESSERT_FIRED) ||
    (order as any).notes?.includes(TAG_DESSERT_READY) ||
    (order as any).notes?.includes(TAG_DESSERT_SERVED)
  ) {
    return false
  }
  return desserts.some(d => !isDessertFired(d) && !isDessertReady(d) && !isDessertServed(d))
}

/**
 * Retorna la lista de postres retenidos pendientes de decisión del mozo (marchar a cocina o entregar directo).
 */
export function getHeldDesserts(order: Order): OrderItem[] {
  if (
    (order as any).notes?.includes(TAG_DESSERT_FIRED) ||
    (order as any).kitchen_notes?.includes(TAG_DESSERT_FIRED) ||
    (order as any).notes?.includes(TAG_DESSERT_READY) ||
    (order as any).notes?.includes(TAG_DESSERT_SERVED)
  ) {
    return []
  }
  return (order.order_items || []).filter(d => isDessertItem(d) && !isDessertFired(d) && !isDessertReady(d) && !isDessertServed(d))
}

/**
 * Retorna true cuando la comida principal y las bebidas de la comanda ya fueron entregadas en mesa
 * y existen postres retenidos listos para que el mozo los marche a cocina o los entregue directamente.
 */
export function areOrderDessertsPendingWaiter(order: Order): boolean {
  if (['cancelled', 'paid', 'pending_validation'].includes(order.status)) return false
  if (areOrderDrinksPending(order)) return false
  if (!areOrderStartersServed(order) || !areOrderMainsServed(order)) return false
  return orderHasHeldDesserts(order)
}

/**
 * Retorna true si la orden tiene postres que ya fueron marchados y están en preparación en cocina,
 * o si es una comanda de solo postres que ya está en marcha.
 */
export function orderHasActiveDesserts(order: Order): boolean {
  const desserts = (order.order_items || []).filter(isDessertItem)
  if (desserts.length === 0) return false
  if ((order as any).notes?.includes(TAG_DESSERT_READY) || (order as any).notes?.includes(TAG_DESSERT_SERVED)) {
    return false
  }
  const orderLevelFired = Boolean(
    (order as any).notes?.includes(TAG_DESSERT_FIRED) || (order as any).kitchen_notes?.includes(TAG_DESSERT_FIRED)
  )
  if (!orderHasFood(order)) {
    return desserts.some(d => !isDessertReady(d))
  }
  return desserts.some(d => (orderLevelFired || isDessertFired(d)) && !isDessertReady(d))
}

export function orderHasPendingChoiceDesserts(order: Order): boolean {
  return (order.order_items || []).some(d => isDessertItem(d) && isDessertPendingChoice(d) && !isDessertReady(d))
}

/**
 * Verifica si TODAS las fases que componen una comanda (Bebidas, 1° Entradas, 2° Principales, 3° Postres)
 * ya fueron entregadas en mesa al cliente.
 */
export function areAllOrderCoursesDelivered(order: Order): boolean {
  if (!order) return false
  if (order.status === 'paid') return true
  const items = (order.order_items || []).filter(it => !isPackHeaderItem(it))
  if (items.length === 0) return order.status === 'delivered'

  const hasDrinks = orderHasDrinks(order)
  const drinksDone =
    !hasDrinks ||
    Boolean((order as any).notes?.includes(TAG_DRINK_SERVED)) ||
    items.filter(isDrinkItem).every(isDrinkServed)

  const hasStarters = orderHasStarters(order)
  const startersDone =
    !hasStarters ||
    Boolean((order as any).notes?.includes(TAG_STARTER_SERVED)) ||
    items.filter(isStarterItem).every(it => Boolean(it.notes?.includes(TAG_STARTER_SERVED)))

  const hasMains = orderHasMains(order)
  const mainsDone =
    !hasMains ||
    Boolean((order as any).notes?.includes(TAG_MAIN_SERVED)) ||
    items.filter(isMainItem).every(it => Boolean(it.notes?.includes(TAG_MAIN_SERVED)))

  const hasDesserts = orderHasDesserts(order)
  const dessertsDone =
    !hasDesserts ||
    Boolean((order as any).notes?.includes(TAG_DESSERT_SERVED)) ||
    items.filter(isDessertItem).every(it =>
      Boolean(
        it.notes?.includes(TAG_DESSERT_SERVED) ||
          it.notes?.includes('[POSTRE: SERVIDO]') ||
          it.notes?.includes('[POSTRE:SERVIDO]')
      )
    )

  return drinksDone && startersDone && mainsDone && dessertsDone
}

/**
 * Verifica si TODAS las fases de cocina de una comanda (`1° Entradas`, `2° Principales`, `3° Postres`)
 * están completadas (listas o entregadas), para que el ticket se cierre automáticamente en el KDS.
 */
export function areAllKitchenCoursesCompleted(order: Order): boolean {
  if (!order) return true
  if (['cancelled', 'paid'].includes(order.status)) return true
  if (isDrinkOnlyOrder(order)) return true

  const hasStarters = orderHasStarters(order)
  const startersDone = !hasStarters || areOrderStartersReady(order) || areOrderStartersServed(order)

  const hasMains = orderHasMains(order)
  const mainsDone = !hasMains || areOrderMainsReady(order) || areOrderMainsServed(order)

  const hasDesserts = orderHasDesserts(order)
  const dessertsDone = !hasDesserts || isOrderDessertsReady(order) || areOrderDessertsServed(order)

  return startersDone && mainsDone && dessertsDone
}

export interface OrderStationEvaluation {
  hasKitchenMains: boolean
  hasHeldDesserts: boolean
  hasReleasedDesserts: boolean
  hasReadyDesserts: boolean
  hasPendingChoiceDesserts: boolean
  hasBarDrinks: boolean
  isDrinkOnlyOrder: boolean
  isDessertOnlyOrder: boolean
  canKitchenCompleteOrder: boolean
  kitchenItemsPending: number
  drinksPending: number
  kitchenItems: OrderItem[]
  barItems: OrderItem[]
}

/**
 * Evalúa las estaciones de preparación (Cocina vs. Barra/Sala) y tiempos gastronómicos de una comanda.
 */
export function evaluateOrderStations(input?: Order | OrderItem[] | null): OrderStationEvaluation {
  if (!input) {
    return {
      hasKitchenMains: false,
      hasHeldDesserts: false,
      hasReleasedDesserts: false,
      hasReadyDesserts: false,
      hasPendingChoiceDesserts: false,
      hasBarDrinks: false,
      isDrinkOnlyOrder: false,
      isDessertOnlyOrder: false,
      canKitchenCompleteOrder: true,
      kitchenItemsPending: 0,
      drinksPending: 0,
      kitchenItems: [],
      barItems: [],
    }
  }

  const safeItems = Array.isArray(input) ? input : (input as Order).order_items || []
  if (safeItems.length === 0) {
    return {
      hasKitchenMains: false,
      hasHeldDesserts: false,
      hasReleasedDesserts: false,
      hasReadyDesserts: false,
      hasPendingChoiceDesserts: false,
      hasBarDrinks: false,
      isDrinkOnlyOrder: false,
      isDessertOnlyOrder: false,
      canKitchenCompleteOrder: true,
      kitchenItemsPending: 0,
      drinksPending: 0,
      kitchenItems: [],
      barItems: [],
    }
  }

  const mains = safeItems.filter(i => isFoodItem(i) && !isPackHeaderItem(i))
  const desserts = safeItems.filter(i => isDessertItem(i) && !isPackHeaderItem(i))
  const drinks = safeItems.filter(isDrinkItem)
  const kitchenItems = safeItems.filter(i => (isFoodItem(i) || isDessertItem(i)) && !isPackHeaderItem(i))

  const hasKitchenMains = mains.length > 0
  const hasHeldDesserts = hasKitchenMains && desserts.some(d => !isDessertFired(d) && !isDessertReady(d))
  const hasReleasedDesserts = desserts.some(d => (!hasKitchenMains || isDessertFired(d)) && !isDessertReady(d))
  const hasReadyDesserts = desserts.some(isDessertReady)
  const hasPendingChoiceDesserts = desserts.some(isDessertPendingChoice)
  const hasBarDrinks = drinks.length > 0

  const isDrinkOnly = safeItems.length > 0 && safeItems.every(isDrinkItem)
  const isDessertOnly = safeItems.length > 0 && safeItems.every(isDessertItem)

  // Cocina solo puede dar por finalizada la orden si no quedan postres retenidos sin despachar
  const canKitchenCompleteOrder = !hasHeldDesserts

  const kitchenItemsPending = mains.filter(m => !isFoodReady(m)).length + desserts.filter(d => !isDessertReady(d)).length
  const drinksPending = drinks.filter(d => !isDrinkServed(d)).length

  return {
    hasKitchenMains,
    hasHeldDesserts,
    hasReleasedDesserts,
    hasReadyDesserts,
    hasPendingChoiceDesserts,
    hasBarDrinks,
    isDrinkOnlyOrder: isDrinkOnly,
    isDessertOnlyOrder: isDessertOnly,
    canKitchenCompleteOrder,
    kitchenItemsPending,
    drinksPending,
    kitchenItems,
    barItems: drinks,
  }
}

/**
 * Retorna true si la orden tiene bebidas activas y al menos una no ha sido servida por sala/mozo.
 * Invariante "Regla del Embudo": En estado 'pending_validation' NUNCA se muestran bebidas pendientes.
 * Invariante anti-cierre prematuro: la entrega de comida salada en mesa NO borra las bebidas pendientes.
 */
export function areOrderDrinksPending(order: Order): boolean {
  if (order.status === 'paid' || order.status === 'cancelled' || order.status === 'pending_validation') {
    return false
  }
  if ((order as any).notes?.includes(TAG_DRINK_SERVED)) return false
  const drinks = (order.order_items || []).filter(isDrinkItem)
  if (drinks.length === 0) return false
  return drinks.some(d => !isDrinkServed(d))
}

/**
 * Retorna la lista de ítems de bebida pendientes de servir de una orden.
 */
export function getPendingDrinks(order: Order): OrderItem[] {
  if ((order as any).notes?.includes(TAG_DRINK_SERVED)) return []
  return (order.order_items || []).filter(it => isDrinkItem(it) && !isDrinkServed(it))
}

/**
 * Retorna true si toda la comida salada de la orden fue marcada lista por cocina.
 */
export function isOrderFoodReady(order: Order): boolean {
  const food = (order.order_items || []).filter(isFoodItem)
  if (food.length === 0) return true
  return food.every(isFoodReady)
}

/**
 * Retorna true si todos los postres de la orden fueron marcados listos por cocina.
 */
export function isOrderDessertsReady(order: Order): boolean {
  if ((order as any).notes?.includes(TAG_DESSERT_READY) || (order as any).notes?.includes(TAG_DESSERT_SERVED)) {
    return true
  }
  const desserts = (order.order_items || []).filter(isDessertItem)
  if (desserts.length === 0) return true
  return desserts.every(isDessertReady)
}

/**
 * Orden de prioridad para visualización ordenada en pantalla de cocina KDS.
 * 1. Entrantes (Verde) -> 2. Principales (Azul) -> 3. Postres (Morado) -> 4. Bebidas (Gris Sala)
 */
export const COURSE_KITCHEN_PRIORITY: Record<CourseType, number> = {
  first: 1,
  second: 2,
  dessert: 3,
  drink: 4,
}

export function sortItemsForKitchen(items: OrderItem[]): OrderItem[] {
  return [...items].sort((a, b) => {
    const pA = COURSE_KITCHEN_PRIORITY[getItemCourse(a)] || 2
    const pB = COURSE_KITCHEN_PRIORITY[getItemCourse(b)] || 2
    return pA - pB
  })
}
