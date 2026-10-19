import assert from 'assert'
import { inferCourseType } from '../src/lib/category-matcher.js'
import {
  isDrinkItem,
  isDrinkOnlyOrder,
  areOrderStartersServed,
  areOrderMainsServed,
  orderHasPendingDesserts,
  TAG_DRINK_SERVED,
  isDrinkServed,
  getPendingDrinks,
} from '../src/lib/course-utils.js'
import {
  isValidOrderTransition,
  VALID_ORDER_TRANSITIONS,
} from '../src/lib/server-state.js'
import {
  updateOrderCourseTags,
  transitionOrderStatus,
} from '../src/lib/supabase/repositories/orders.repository.js'

console.log('--- TEST: ENTREGA DE CAFÉ / BEBIDAS DE SOBREMESA Y TRANSICIÓN A DELIVERED ---')

// 1. Inferencia de Café como Bebida
console.log('1. Verificando inferencia de tipos de café y bebidas...')
assert.strictEqual(inferCourseType({ name: 'Café con leche', category_id: 'cat-cafes' }), 'drink')
assert.strictEqual(inferCourseType({ name: 'Café solo', category_id: 'cat-postres' }), 'drink')
assert.strictEqual(inferCourseType({ name: 'Cortado', category_id: 'cat-postres' }), 'drink')
assert.strictEqual(inferCourseType({ name: 'Infusión manzanilla', category_id: 'cat-bebidas' }), 'drink')
console.log('✓ Cafés e infusiones inferidos correctamente como "drink".')

// 2. Comanda de solo café / bebidas
console.log('2. Verificando comanda de café / sobremesa como drink-only...')
const coffeeOrder = {
  id: '00000000-0000-4000-8000-000000000001',
  table_number: 7,
  status: 'ready',
  order_items: [
    {
      id: 'oi-synthetic-0',
      product_id: '00000000-0000-4000-8000-000000000099',
      course: 'drink',
      notes: 'Sobremesa (1 Toque)',
      product: { name: 'Café solo', price: 1.5, category_id: 'cat-cafes' },
      quantity: 1,
    },
  ],
}
assert.strictEqual(isDrinkOnlyOrder(coffeeOrder), true, 'La comanda de café debe ser reconocida como drink-only')
assert.strictEqual(areOrderStartersServed(coffeeOrder), true, 'No tiene entradas, por lo que startersDone debe ser true')
assert.strictEqual(areOrderMainsServed(coffeeOrder), true, 'No tiene principales, por lo que mainsDone debe ser true')
assert.strictEqual(orderHasPendingDesserts(coffeeOrder), false, 'No tiene postres, por lo que dessertsDone debe ser true')
console.log('✓ Detección de drink-only y condiciones de comida servida validadas.')

// 3. Máquina de estados: Transición de ready / pending_validation a delivered
console.log('3. Verificando transiciones legales en máquina de estados...')
assert.strictEqual(isValidOrderTransition('ready', 'delivered'), true, 'ready -> delivered debe ser legal')
assert.strictEqual(isValidOrderTransition('pending', 'delivered'), true, 'pending -> delivered debe ser legal')
assert.strictEqual(isValidOrderTransition('pending_validation', 'delivered'), true, 'pending_validation -> delivered debe ser legal')
console.log('✓ Transiciones válidas en VALID_ORDER_TRANSITIONS.')

// 4. Test de updateOrderCourseTags con ID sintético no-UUID
console.log('4. Probando updateOrderCourseTags con ID de ítem sintético ("oi-synthetic-0")...')
const mockOrderToTag = {
  id: '00000000-0000-4000-8000-000000000002',
  table_number: 7,
  status: 'ready',
  version: 1,
  order_items: [
    {
      id: 'oi-synthetic-0',
      product_id: '00000000-0000-4000-8000-000000000099',
      course: 'drink',
      notes: 'Café de sobremesa',
      product: { name: 'Café Cortado', price: 1.6 },
      quantity: 1,
    },
  ],
}

// Simulamos la inserción en memoria a través del repository
import { addServerOrder } from '../src/lib/server-state.js'
addServerOrder('test-restaurant', mockOrderToTag)

const tagResult = await updateOrderCourseTags(
  'test-restaurant',
  mockOrderToTag.id,
  TAG_DRINK_SERVED,
  isDrinkItem
)
assert.strictEqual(tagResult.success, true, 'updateOrderCourseTags debe ser exitoso incluso con IDs sintéticos')
const updatedItem = tagResult.order?.order_items?.[0]
assert.ok(updatedItem?.notes?.includes(TAG_DRINK_SERVED), 'El ítem debe tener el tag [BARRA_SERVIDA]')
assert.strictEqual(isDrinkServed(updatedItem), true, 'isDrinkServed debe ser true')
assert.strictEqual(getPendingDrinks(tagResult.order).length, 0, 'No debe quedar ninguna bebida pendiente')
console.log('✓ updateOrderCourseTags completado sin fallos con IDs no-UUID.')

// 5. Transición a delivered
console.log('5. Probando transición formal a "delivered"...')
const transResult = await transitionOrderStatus({
  slug: 'test-restaurant',
  orderId: mockOrderToTag.id,
  nextStatus: 'delivered',
  actorType: 'waiter',
})
assert.strictEqual(transResult.success, true, 'La orden de café debe pasar a "delivered" con éxito')
assert.strictEqual(transResult.order?.status, 'delivered', 'El estado de la orden debe ser "delivered"')
console.log('✓ Orden de café transicionada a "delivered" correctamente.')

console.log('--- TODOS LOS TESTS DE CAFÉ Y BEBIDAS PASARON EXITOSAMENTE (100% PASS) ---')
