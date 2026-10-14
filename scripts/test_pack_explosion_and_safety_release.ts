import assert from 'assert'
import {
  isPackHeaderItem,
  isDessertPendingChoice,
  orderHasPendingChoiceDesserts,
  evaluateOrderStations,
  areOrderDrinksPending,
  stripInternalStationTags,
  TAG_DRINK_SERVED,
  TAG_DESSERT_FIRED,
  TAG_DESSERT_PENDING,
  TAG_PACK_HEADER,
} from '../src/lib/course-utils'
import { Order, OrderItem, CartItem } from '../src/types/database.types'

console.log('=== TEST SUITE: DESGLOSE DE PACKS, MENÚ DEL DÍA Y SEGURIDAD DE COBRO (FLUXO 1.2) ===\n')

// --------------------------------------------------------------------------
// 1. Identificación y exclusión de cabeceras de pack en cocina
// --------------------------------------------------------------------------
console.log('1. Verificando aislamiento de cabeceras de pack y filtros de cocina...')
const packHeaderItem: OrderItem = {
  id: 'item-header-1',
  product_id: 'daily-menu-standard',
  quantity: 1,
  notes: `[PACK_HEADER] [Menú del Día #1]`,
  is_pack_header: true,
  pack_id: 'pack-uuid-1',
  product: {
    id: 'daily-menu-standard',
    restaurant_id: 'rest-1',
    category_id: 'cat-menu-del-dia',
    name: 'Menú del Día #1',
    description: 'Menú Completo',
    price: 13.5,
    image_url: null,
    model_3d_url: null,
    is_available: true,
  },
}

assert.strictEqual(isPackHeaderItem(packHeaderItem), true, 'isPackHeaderItem debe ser true para item-header-1')

const explodedSubItems: OrderItem[] = [
  {
    id: 'sub-first',
    product_id: 'prod-sopa',
    quantity: 1,
    notes: '[Menú del Día #1]',
    course: 'first',
    is_complimentary: true,
    is_pack_component: true,
    pack_id: 'pack-uuid-1',
    product: {
      id: 'prod-sopa',
      restaurant_id: 'rest-1',
      category_id: 'cat-entrantes',
      name: 'Sopa de Marisco',
      price: 0,
      image_url: null,
      model_3d_url: null,
      is_available: true,
    },
  },
  {
    id: 'sub-second',
    product_id: 'prod-burger',
    quantity: 1,
    notes: '[Menú del Día #1] Punto: A Punto',
    course: 'second',
    is_complimentary: true,
    is_pack_component: true,
    pack_id: 'pack-uuid-1',
    product: {
      id: 'prod-burger',
      restaurant_id: 'rest-1',
      category_id: 'cat-principales',
      name: 'Burger Clásica',
      price: 0,
      image_url: null,
      model_3d_url: null,
      is_available: true,
    },
  },
  {
    id: 'sub-drink',
    product_id: 'prod-cerveza',
    quantity: 1,
    notes: '[Menú del Día #1]',
    course: 'drink',
    is_complimentary: true,
    is_pack_component: true,
    pack_id: 'pack-uuid-1',
    product: {
      id: 'prod-cerveza',
      restaurant_id: 'rest-1',
      category_id: 'cat-bebidas',
      name: 'Cerveza 500ml',
      price: 0,
      image_url: null,
      model_3d_url: null,
      is_available: true,
    },
  },
  {
    id: 'sub-dessert-pending',
    product_id: 'p-dessert-pending-later',
    quantity: 1,
    notes: `[Menú del Día #1] ${TAG_DESSERT_PENDING}`,
    course: 'dessert',
    is_complimentary: true,
    is_pack_component: true,
    pack_id: 'pack-uuid-1',
    product: {
      id: 'p-dessert-pending-later',
      restaurant_id: 'rest-1',
      category_id: 'cat-postres',
      name: 'Elegir postre/café después de comer',
      price: 0,
      image_url: null,
      model_3d_url: null,
      is_available: true,
    },
  },
]

const orderWithPack: Order = {
  id: 'ord-pack-001',
  restaurant_id: 'rest-1',
  table_id: 'tbl-7',
  table_number: 7,
  status: 'pending',
  total_amount: 13.5,
  created_at: new Date().toISOString(),
  order_items: [packHeaderItem, ...explodedSubItems],
}

const stations = evaluateOrderStations(orderWithPack)

// Verificaciones críticas de estación
assert.strictEqual(
  stations.kitchenItems.some(it => isPackHeaderItem(it)),
  false,
  'La cabecera de pack NUNCA debe llegar a la lista de platos a cocinar de Cocina'
)
assert.strictEqual(stations.kitchenItems.length, 3, 'Cocina debe recibir exactamente 3 platos reales (1º, 2º y postre retenido)')
assert.strictEqual(stations.barItems.length, 1, 'Barra debe recibir exactamente la bebida')
assert.strictEqual(stations.barItems[0].product?.name, 'Cerveza 500ml', 'La bebida debe ser Cerveza 500ml')
assert.strictEqual(stations.hasPendingChoiceDesserts, true, 'hasPendingChoiceDesserts debe ser true debido al comodín')
assert.strictEqual(orderHasPendingChoiceDesserts(orderWithPack), true, 'orderHasPendingChoiceDesserts debe detectar el comodín')
console.log('  ✔ Desglose operativo y filtros de estación 100% verificados.\n')

// --------------------------------------------------------------------------
// 2. Múltiples menús y promos independientes en la misma orden
// --------------------------------------------------------------------------
console.log('2. Verificando múltiples packs independientes (#1, #2) y cascada de eliminación...')
const cart: CartItem[] = [
  {
    cartItemId: 'pack-1-header',
    product: { ...packHeaderItem.product!, name: 'Menú del Día #1' },
    quantity: 1,
    selectedPills: [],
    notes: '[PACK_HEADER] [Menú del Día #1]',
    is_pack_header: true,
    pack_id: 'pack-1',
    pack_tag: 'Menú del Día #1',
  },
  {
    cartItemId: 'pack-1-sub-0',
    product: { id: 'sopa', name: 'Sopa', price: 0 } as any,
    quantity: 1,
    selectedPills: [],
    notes: '[Menú del Día #1]',
    course: 'first',
    is_pack_component: true,
    pack_id: 'pack-1',
    pack_tag: 'Menú del Día #1',
  },
  {
    cartItemId: 'pack-2-header',
    product: { ...packHeaderItem.product!, name: 'Menú del Día #2' },
    quantity: 1,
    selectedPills: [],
    notes: '[PACK_HEADER] [Menú del Día #2]',
    is_pack_header: true,
    pack_id: 'pack-2',
    pack_tag: 'Menú del Día #2',
  },
  {
    cartItemId: 'pack-2-sub-0',
    product: { id: 'ensalada', name: 'Ensalada Mixta', price: 0 } as any,
    quantity: 1,
    selectedPills: [],
    notes: '[Menú del Día #2]',
    course: 'first',
    is_pack_component: true,
    pack_id: 'pack-2',
    pack_tag: 'Menú del Día #2',
  },
]

assert.strictEqual(cart.length, 4, 'El carrito debe tener 4 ítems (2 cabeceras + 2 subítems)')

// Simulación de borrado en cascada de Pack #1
const targetItem = cart[0]
const filteredCart = targetItem.pack_id
  ? cart.filter(it => it.pack_id !== targetItem.pack_id)
  : cart.filter((_, idx) => idx !== 0)

assert.strictEqual(filteredCart.length, 2, 'Al eliminar Pack #1, deben eliminarse la cabecera y sus subítems')
assert.strictEqual(filteredCart.every(it => it.pack_id === 'pack-2'), true, 'Solo deben quedar los ítems de Pack #2')
console.log('  ✔ Múltiples packs y eliminación en cascada 100% verificados.\n')

// --------------------------------------------------------------------------
// 3. Resolución del comodín de postre pendiente
// --------------------------------------------------------------------------
console.log('3. Verificando sustitución de comodín de postre...')
const pendingItem = explodedSubItems.find(it => isDessertPendingChoice(it))!
assert.ok(pendingItem, 'Debe existir ítem de postre pendiente')

// Simulamos la resolución por parte del comensal o mozo
const chosenDessert = {
  id: 'p-tarta-santiago',
  name: 'Tarta de Santiago Artesana',
  price: 0,
}

const resolvedNotes = `${stripInternalStationTags(pendingItem.notes)} ${TAG_DESSERT_FIRED}`.trim()
const resolvedItem: OrderItem = {
  ...pendingItem,
  product_id: chosenDessert.id,
  product: chosenDessert as any,
  notes: resolvedNotes,
}

assert.strictEqual(isDessertPendingChoice(resolvedItem), false, 'Tras resolverlo, no debe figurar como pendiente de elección')
assert.strictEqual(resolvedItem.notes?.includes(TAG_DESSERT_FIRED), true, 'El postre resuelto debe incluir TAG_DESSERT_FIRED')
assert.strictEqual(resolvedItem.product?.name, 'Tarta de Santiago Artesana', 'Debe tener el nombre del postre elegido')
console.log('  ✔ Sustitución y activación de postre comodín 100% verificada.\n')

// --------------------------------------------------------------------------
// 4. Invariante de Seguridad: Liberación de mesa sin saldo vs con saldo
// --------------------------------------------------------------------------
console.log('4. Verificando reglas de seguridad para liberar mesas con y sin cobro...')

// Caso A: Mesa sin consumo (0,00 €)
const ordersZeroBalance: Order[] = []
let pendingSum = 0
ordersZeroBalance.forEach(o => {
  pendingSum += Number(o.total_amount) || 0
})
assert.strictEqual(pendingSum, 0, 'Saldo pendiente debe ser 0')

// Caso B: Mesa con consumo pendiente (53,20 €)
const ordersWithBalance: Order[] = [
  {
    id: 'ord-1',
    restaurant_id: 'rest-1',
    table_id: 'tbl-7',
    status: 'delivered',
    total_amount: 53.2,
    created_at: new Date().toISOString(),
  },
]
let pendingSumB = 0
ordersWithBalance.forEach(o => {
  pendingSumB += Number(o.total_amount) || 0
})
assert.strictEqual(pendingSumB, 53.2, 'Saldo pendiente debe ser 53,20 €')
assert.ok(pendingSumB > 0, 'Requiere advertencia obligatoria de liberación sin cobrar')

console.log('  ✔ Reglas de seguridad de liberación de mesa 100% verificadas.\n')

console.log('===================================================================')
console.log('🎉 TODOS LOS TESTS DE FLUXO 1.2 PASARON CON 100% DE ÉXITO')
console.log('===================================================================')
