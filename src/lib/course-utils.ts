import { Order, OrderItem, CourseType } from '@/types/database.types'
import { inferCourseType } from './category-matcher'

export const TAG_DRINK_SERVED = '[BARRA_SERVIDA]'
export const TAG_FOOD_READY = '[COCINA_LISTA]'
export const TAG_DESSERT_READY = '[POSTRE_LISTO]'
export const TAG_DESSERT_FIRED = '[MARCHAR_POSTRE]'
export const TAG_DESSERT_PENDING = '[POSTRE_PENDIENTE_ELECCION]'
export const TAG_PACK_HEADER = '[PACK_HEADER]'

/**
 * Elimina cualquier etiqueta técnica interna entre corchetes de estaciones de cocina/barra
 */
export function stripInternalStationTags(rawNotes?: string | null): string {
  if (!rawNotes) return ''
  return rawNotes
    .replace(/\[(?:BARRA_SERVIDA|BARRA:\s*SERVIDA|COCINA_LISTA|COCINA:\s*LISTA|POSTRE_LISTO|POSTRE:\s*LISTO|POSTRE_EN_ESPERA|POSTRE:\s*EN\s*ESPERA|PASE_1|PASE_2|MARCHAR_POSTRE|POSTRE_PENDIENTE_ELECCION|PACK_HEADER|PACK_SUBITEM).*?\]/gi, '')
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
 * Regla inteligente: Si la comanda es SOLO de postres (segunda ronda), NO se retienen; van directos a preparación.
 */
export function orderHasHeldDesserts(order: Order): boolean {
  if (!orderHasFood(order)) return false
  const desserts = (order.order_items || []).filter(isDessertItem)
  if (desserts.length === 0) return false
  return desserts.some(d => !isDessertFired(d) && !isDessertReady(d))
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

