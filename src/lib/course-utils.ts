import { Order, OrderItem, CourseType } from '@/types/database.types'
import { inferCourseType } from './category-matcher'

export const TAG_DRINK_SERVED = '[BARRA_SERVIDA]'
export const TAG_FOOD_READY = '[COCINA_LISTA]'
export const TAG_DESSERT_READY = '[POSTRE_LISTO]'
export const TAG_DESSERT_FIRED = '[MARCHAR_POSTRE]'

/**
 * Elimina cualquier etiqueta técnica interna entre corchetes de estaciones de cocina/barra
 */
export function stripInternalStationTags(rawNotes?: string | null): string {
  if (!rawNotes) return ''
  return rawNotes
    .replace(/\[(?:BARRA_SERVIDA|BARRA:\s*SERVIDA|COCINA_LISTA|COCINA:\s*LISTA|POSTRE_LISTO|POSTRE:\s*LISTO|POSTRE_EN_ESPERA|POSTRE:\s*EN\s*ESPERA|PASE_1|PASE_2|MARCHAR_POSTRE).*?\]/gi, '')
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
 * Obtiene el tiempo gastronómico efectivo (course) de un ítem.
 */
export function getItemCourse(item: OrderItem): CourseType {
  if (item.course && ['first', 'second', 'dessert', 'drink'].includes(item.course)) {
    return item.course
  }
  return inferCourseType(item.product)
}

export function isDrinkItem(item: OrderItem): boolean {
  return getItemCourse(item) === 'drink'
}

export function isFoodItem(item: OrderItem): boolean {
  const c = getItemCourse(item)
  return c === 'first' || c === 'second'
}

export function isDessertItem(item: OrderItem): boolean {
  return getItemCourse(item) === 'dessert'
}

export function isDrinkServed(item: OrderItem): boolean {
  return Boolean(item.notes && item.notes.includes(TAG_DRINK_SERVED))
}

export function isFoodReady(item: OrderItem): boolean {
  return Boolean(item.notes && item.notes.includes(TAG_FOOD_READY))
}

export function isDessertReady(item: OrderItem): boolean {
  return Boolean(item.notes && item.notes.includes(TAG_DESSERT_READY))
}

export function isDessertFired(item: OrderItem): boolean {
  return Boolean(item.notes && item.notes.includes(TAG_DESSERT_FIRED))
}

export function orderHasDrinks(order: Order): boolean {
  return (order.order_items || []).some(isDrinkItem)
}

export function orderHasFood(order: Order): boolean {
  return (order.order_items || []).some(isFoodItem)
}

export function orderHasDesserts(order: Order): boolean {
  return (order.order_items || []).some(isDessertItem)
}

export function isDrinkOnlyOrder(input?: Order | OrderItem[] | null): boolean {
  if (!input) return false
  const items = Array.isArray(input) ? input : (input as Order).order_items
  if (!items || items.length === 0) return false
  return items.every(isDrinkItem)
}

/**
 * Retorna true si la orden tiene postres retenidos que aún no han sido marchados a cocina.
 * REGLA INTELIGENTE DE POSTRES:
 * - Si el pedido trae comida principal (hamburguesas, etc.) + postres: los postres se RETIENEN (Pase 2).
 * - Si el pedido es SOLO de postres/café (ej: ronda de postres pedida a posteriori): NO se retienen,
 *   van DIRECTO a cocina como comanda activa.
 */
export function orderHasHeldDesserts(order: Order): boolean {
  if (!orderHasFood(order)) {
    // Es una orden exclusiva de postres/café -> va directo a preparación, no se retiene
    return false
  }
  const desserts = (order.order_items || []).filter(isDessertItem)
  if (desserts.length === 0) return false
  return desserts.some(d => !isDessertFired(d) && !isDessertReady(d))
}

/**
 * Retorna true si la orden tiene postres que ya están activos para preparación en cocina:
 * 1. O bien fueron marchados explícitamente por el mozo (isDessertFired)
 * 2. O bien la orden es de postres únicamente (no tiene platos principales que esperar)
 */
export function orderHasActiveDesserts(order: Order): boolean {
  const desserts = (order.order_items || []).filter(isDessertItem)
  if (desserts.length === 0) return false
  const isSoloDessertOrder = !orderHasFood(order)
  return desserts.some(d => (isSoloDessertOrder || isDessertFired(d)) && !isDessertReady(d))
}

export interface OrderStationEvaluation {
  hasKitchenMains: boolean
  hasHeldDesserts: boolean
  hasReleasedDesserts: boolean
  hasReadyDesserts: boolean
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

  const mains = safeItems.filter(isFoodItem)
  const desserts = safeItems.filter(isDessertItem)
  const drinks = safeItems.filter(isDrinkItem)
  const kitchenItems = safeItems.filter(i => isFoodItem(i) || isDessertItem(i))

  const isSoloDesserts = safeItems.length > 0 && safeItems.every(isDessertItem)
  const hasKitchenMains = mains.length > 0
  const hasHeldDesserts = !isSoloDesserts && desserts.some(d => !isDessertFired(d) && !isDessertReady(d))
  const hasReleasedDesserts = desserts.some(d => (isSoloDesserts || isDessertFired(d)) && !isDessertReady(d))
  const hasReadyDesserts = desserts.some(isDessertReady)
  const hasBarDrinks = drinks.length > 0

  const isDrinkOnly = safeItems.length > 0 && safeItems.every(isDrinkItem)
  const isDessertOnly = isSoloDesserts

  // Cocina solo puede dar por finalizada la orden si no quedan postres retenidos sin despachar
  const canKitchenCompleteOrder = !hasHeldDesserts

  const kitchenItemsPending = mains.filter(m => !isFoodReady(m)).length + desserts.filter(d => !isDessertReady(d)).length
  const drinksPending = drinks.filter(d => !isDrinkServed(d)).length

  return {
    hasKitchenMains,
    hasHeldDesserts,
    hasReleasedDesserts,
    hasReadyDesserts,
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
 * REGLA DEL EMBUDO:
 * Mientras la orden esté en 'pending_validation' (aún no aprobada por el mozo),
 * NO debe mostrarse la tarjeta de servir bebidas en barra. Primero se aprueba la comanda global.
 */
export function areOrderDrinksPending(order: Order): boolean {
  if (order.status === 'pending_validation' || order.status === 'paid' || order.status === 'cancelled') {
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
