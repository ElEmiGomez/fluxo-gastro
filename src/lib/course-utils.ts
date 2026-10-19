import { Order, OrderItem, CourseType } from '@/types/database.types'
import { inferCourseType } from './category-matcher'

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
]

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
  if (!refStr) return inStr

  let merged = inStr
  for (const tag of STATION_PROGRESSION_TAGS) {
    if (refStr.includes(tag) && !merged.includes(tag)) {
      merged = merged ? `${merged} ${tag}` : tag
    }
  }
  return merged
}

/**
 * Reconcilia un array de ítems de comanda preservando todas las etiquetas de progresión
 * ya adquiridas en el ciclo de vida (bebida servida, entrada servida, principal marchado, etc.).
 */
export function mergeOrderItemsCourseTags(
  currentItems: OrderItem[] | any[],
  referenceItems?: OrderItem[] | any[]
): OrderItem[] {
  if (!referenceItems || referenceItems.length === 0) return currentItems as OrderItem[]
  if (!currentItems || currentItems.length === 0) return referenceItems as OrderItem[]

  const usedRefIndices = new Set<number>()

  return currentItems.map((currItem, idx) => {
    // 1. Coincidencia por id único
    let matchIdx = currItem.id
      ? referenceItems.findIndex((r, rIdx) => !usedRefIndices.has(rIdx) && r.id === currItem.id)
      : -1

    // 2. Coincidencia por product_id
    if (matchIdx === -1) {
      matchIdx = referenceItems.findIndex((r, rIdx) => {
        if (usedRefIndices.has(rIdx)) return false
        const rProdId = r.product_id || r.product?.id
        const cProdId = currItem.product_id || currItem.product?.id
        return Boolean(rProdId && cProdId && rProdId === cProdId)
      })
    }

    // 3. Coincidencia posicional 1:1 si las listas tienen el mismo tamaño
    if (matchIdx === -1 && currentItems.length === referenceItems.length && !usedRefIndices.has(idx)) {
      matchIdx = idx
    }

    if (matchIdx !== -1) {
      usedRefIndices.add(matchIdx)
      const matchedRef = referenceItems[matchIdx]
      const mergedNotes = mergeItemNotes(currItem.notes, matchedRef.notes)
      return {
        ...currItem,
        notes: mergedNotes,
        course: currItem.course || matchedRef.course,
      } as OrderItem
    }

    return currItem as OrderItem
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
  return Boolean(item.notes && item.notes.includes(TAG_DESSERT_PENDING))
}

/**
 * Obtiene el tiempo gastronómico efectivo (course) de un ítem.
 */
export function getItemCourse(item: OrderItem | any): CourseType {
  if (item?.course && ['first', 'second', 'dessert', 'drink'].includes(item.course)) {
    return item.course
  }
  const notes = item?.notes || ''
  if (notes.includes('[COURSE:first]')) return 'first'
  if (notes.includes('[COURSE:second]')) return 'second'
  if (notes.includes('[COURSE:dessert]') || notes.includes(TAG_DESSERT_PENDING)) return 'dessert'
  if (notes.includes('[COURSE:drink]')) return 'drink'
  return inferCourseType(item?.product || item?.products)
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

export function isDrinkServed(item: OrderItem): boolean {
  return Boolean(
    item.notes &&
      (item.notes.includes(TAG_DRINK_SERVED) ||
        item.notes.includes('[BARRA: SERVIDA]') ||
        item.notes.includes('[BARRA:SERVIDA]'))
  )
}

export function isFoodReady(item: OrderItem): boolean {
  if (isStarterItem(item)) return isStarterReady(item)
  if (isMainItem(item)) return isMainReady(item)
  return Boolean(
    item.notes &&
      (item.notes.includes(TAG_FOOD_READY) ||
        item.notes.includes('[COCINA: LISTA]') ||
        item.notes.includes('[COCINA:LISTA]'))
  )
}

export function isFoodServed(item: OrderItem): boolean {
  if (isStarterItem(item)) return isStarterServed(item)
  if (isMainItem(item)) return isMainServed(item)
  return false
}

export function isStarterReady(item: OrderItem): boolean {
  return Boolean(
    item.notes &&
      (item.notes.includes(TAG_STARTER_READY) ||
        item.notes.includes(TAG_STARTER_SERVED) ||
        item.notes.includes(TAG_FOOD_READY) ||
        item.notes.includes('[COCINA: LISTA]') ||
        item.notes.includes('[COCINA:LISTA]'))
  )
}

export function isStarterServed(item: OrderItem): boolean {
  return Boolean(item.notes && item.notes.includes(TAG_STARTER_SERVED))
}

export function isMainCooking(item: OrderItem): boolean {
  return Boolean(item.notes && item.notes.includes(TAG_MAIN_COOKING))
}

export function isMainReady(item: OrderItem): boolean {
  return Boolean(
    item.notes &&
      (item.notes.includes(TAG_MAIN_READY) ||
        item.notes.includes(TAG_MAIN_SERVED) ||
        item.notes.includes(TAG_FOOD_READY) ||
        item.notes.includes('[COCINA: LISTA]') ||
        item.notes.includes('[COCINA:LISTA]'))
  )
}

export function isMainServed(item: OrderItem): boolean {
  return Boolean(item.notes && item.notes.includes(TAG_MAIN_SERVED))
}

export function isDessertServed(item: OrderItem): boolean {
  return Boolean(
    item.notes &&
      (item.notes.includes(TAG_DESSERT_SERVED) ||
        item.notes.includes('[POSTRE: SERVIDO]') ||
        item.notes.includes('[POSTRE:SERVIDO]'))
  )
}

export function isDessertReady(item: OrderItem): boolean {
  return Boolean(
    item.notes &&
      (item.notes.includes(TAG_DESSERT_READY) ||
        item.notes.includes('[POSTRE: LISTO]') ||
        item.notes.includes('[POSTRE:LISTO]') ||
        item.notes.includes(TAG_DESSERT_SERVED) ||
        item.notes.includes('[POSTRE: SERVIDO]') ||
        item.notes.includes('[POSTRE:SERVIDO]'))
  )
}

export function isDessertFired(item: OrderItem): boolean {
  return Boolean(
    item.notes &&
      (item.notes.includes(TAG_DESSERT_FIRED) ||
        item.notes.includes(TAG_DESSERT_COOKING) ||
        item.notes.includes(TAG_DESSERT_READY) ||
        item.notes.includes(TAG_DESSERT_SERVED))
  )
}

export function isDessertCooking(item: OrderItem): boolean {
  return Boolean(item.notes && item.notes.includes(TAG_DESSERT_COOKING))
}

export function areOrderDessertsCooking(order: Order): boolean {
  const desserts = (order.order_items || []).filter(isDessertItem)
  if (desserts.length === 0) return true
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
  return starters.every(isStarterReady)
}

export function areOrderStartersServed(order: Order): boolean {
  if (order.status === 'delivered' || order.status === 'paid') return true
  const starters = (order.order_items || []).filter(isStarterItem)
  if (starters.length === 0) return true
  return starters.every(isStarterServed)
}

export function isMainFired(item: OrderItem): boolean {
  return Boolean(
    item.notes &&
      (item.notes.includes(TAG_MAIN_FIRED) ||
        item.notes.includes(TAG_MAIN_COOKING) ||
        item.notes.includes(TAG_MAIN_READY) ||
        item.notes.includes(TAG_MAIN_SERVED))
  )
}

export function areOrderMainsFired(order: Order): boolean {
  if (order.status === 'delivered' || order.status === 'paid') return true
  const mains = (order.order_items || []).filter(isMainItem)
  if (mains.length === 0) return true
  // Si la comanda no tiene entrantes, los principales se consideran marchados de inicio
  if (!orderHasStarters(order)) return true
  return mains.some(isMainFired)
}

export function areOrderMainsReady(order: Order): boolean {
  const mains = (order.order_items || []).filter(isMainItem)
  if (mains.length === 0) return true
  return mains.every(isMainReady)
}

export function areOrderMainsServed(order: Order): boolean {
  if (order.status === 'delivered' || order.status === 'paid') return true
  const mains = (order.order_items || []).filter(isMainItem)
  if (mains.length === 0) return true
  return mains.every(isMainServed)
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
  const desserts = (order.order_items || []).filter(isDessertItem)
  if (desserts.length === 0) return false
  return desserts.some(d => !isDessertServed(d))
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

  const hasReadyStarters = items.some(it => isStarterItem(it) && isStarterReady(it) && !isStarterServed(it))
  const hasReadyMains = items.some(it => isMainItem(it) && isMainReady(it) && !isMainServed(it))
  const hasReadyDesserts = items.some(it => isDessertItem(it) && isDessertReady(it) && !isDessertServed(it))
  const hasGeneralFood = items.some(it => isFoodItem(it) && isFoodReady(it) && !isFoodServed(it))

  return hasReadyStarters || hasReadyMains || hasReadyDesserts || hasGeneralFood
}

export function isDrinkOnlyOrder(input?: Order | OrderItem[] | null): boolean {
  if (!input) return false
  const items = Array.isArray(input) ? input : (input as Order).order_items
  if (!items || items.length === 0) return false
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
  return desserts.some(d => !isDessertFired(d) && !isDessertReady(d))
}

/**
 * Retorna la lista de postres retenidos pendientes de decisión del mozo (marchar a cocina o entregar directo).
 */
export function getHeldDesserts(order: Order): OrderItem[] {
  return (order.order_items || []).filter(d => isDessertItem(d) && !isDessertFired(d) && !isDessertReady(d))
}

/**
 * Retorna true cuando la comida principal y las bebidas de la comanda ya fueron entregadas en mesa
 * y existen postres retenidos listos para que el mozo los marche a cocina o los entregue directamente.
 */
export function areOrderDessertsPendingWaiter(order: Order): boolean {
  if (order.status !== 'delivered') return false
  if (areOrderDrinksPending(order)) return false
  return orderHasHeldDesserts(order)
}

/**
 * Retorna true si la orden tiene postres que ya fueron marchados y están en preparación en cocina,
 * o si es una comanda de solo postres que ya está en marcha.
 */
export function orderHasActiveDesserts(order: Order): boolean {
  const desserts = (order.order_items || []).filter(isDessertItem)
  if (desserts.length === 0) return false
  if (!orderHasFood(order)) {
    return desserts.some(d => !isDessertReady(d))
  }
  return desserts.some(d => isDessertFired(d) && !isDessertReady(d))
}

export function orderHasPendingChoiceDesserts(order: Order): boolean {
  return (order.order_items || []).some(d => isDessertItem(d) && isDessertPendingChoice(d) && !isDessertReady(d))
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
  const drinks = (order.order_items || []).filter(isDrinkItem)
  if (drinks.length === 0) return false
  return drinks.some(d => !isDrinkServed(d))
}

/**
 * Retorna la lista de ítems de bebida pendientes de servir de una orden.
 */
export function getPendingDrinks(order: Order): OrderItem[] {
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

