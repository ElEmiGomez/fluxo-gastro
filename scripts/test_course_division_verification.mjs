import assert from 'assert'
import { inferCourseType } from '../src/lib/category-matcher.js'
import {
  cleanItemNotes,
  isDrinkItem,
  isFoodItem,
  isDessertItem,
  sortItemsForKitchen,
  areOrderDrinksPending,
  isOrderFoodReady,
  isOrderDessertsReady,
  TAG_DRINK_SERVED,
  TAG_FOOD_READY,
  TAG_DESSERT_READY,
} from '../src/lib/course-utils.js'

console.log('--- TEST: DIVISIÓN DE COMANDAS POR ESTACIONES Y TIEMPOS GASTRONÓMICOS ---')

// 1. Inferencia automática de cursos
console.log('1. Probando inferencia automática de categorías y platos...')
assert.strictEqual(inferCourseType({ name: 'Coca Cola Zero', category_id: 'cat-bebidas' }), 'drink')
assert.strictEqual(inferCourseType({ name: 'Cerveza Estrella Galicia', category_id: 'cat-12' }), 'drink')
assert.strictEqual(inferCourseType({ name: 'Croquetas de Jamón', category_id: 'cat-entrantes' }), 'first')
assert.strictEqual(inferCourseType({ name: 'Burger Clásica con Queso', category_id: 'cat-principales' }), 'second')
assert.strictEqual(inferCourseType({ name: 'Tarta de Queso Horneada', category_id: 'cat-postres' }), 'dessert')
assert.strictEqual(inferCourseType({ name: 'Café solo', category_id: 'cat-postres' }), 'drink')
console.log('✓ Inferencia gastronómica 100% precisa.')

// 2. Ordenamiento para Cocina KDS (Entradas -> Principales -> Postres -> Bebidas Sala)
console.log('2. Probando ordenamiento en cocina KDS...')
const mockItems = [
  { id: '1', course: 'dessert', product: { name: 'Tarta de Queso' } },
  { id: '2', course: 'drink', product: { name: 'Cerveza' } },
  { id: '3', course: 'second', product: { name: 'Burger Doble' } },
  { id: '4', course: 'first', product: { name: 'Patatas Rústicas' } },
]
const sorted = sortItemsForKitchen(mockItems)
assert.strictEqual(sorted[0].course, 'first', 'El primer plato debe ser Entrada')
assert.strictEqual(sorted[1].course, 'second', 'El segundo plato debe ser Principal')
assert.strictEqual(sorted[2].course, 'dessert', 'El tercer plato debe ser Postre')
assert.strictEqual(sorted[3].course, 'drink', 'El cuarto plato debe ser Bebida de Sala')
console.log('✓ Ordenamiento KDS 100% verificado: 1º Entradas -> 2º Principales -> 3º Postres -> 4º Bebidas Sala.')

// 3. Tiempos de Entrega y Limpieza de Notas
console.log('3. Probando sanitización de notas y tags del sistema...')
const dirtyNote = `Sin cebolla ${TAG_FOOD_READY} ${TAG_DRINK_SERVED}`
const cleaned = cleanItemNotes(dirtyNote)
assert.strictEqual(cleaned, 'Sin cebolla')
console.log('✓ Sanitización de notas: tags internos ocultos a cliente y personal.')

// 4. Ciclo de Vida: Bebidas y Pase en 2 Tiempos
console.log('4. Probando lógica de detección de estados y pases...')
const order = {
  id: 'ord-test-123',
  status: 'preparing',
  order_items: [
    { id: 'i1', course: 'drink', notes: '' },
    { id: 'i2', course: 'second', notes: '' },
    { id: 'i3', course: 'dessert', notes: '' },
  ],
}

// Bebidas pendientes
assert.strictEqual(areOrderDrinksPending(order), true)
assert.strictEqual(isOrderFoodReady(order), false)
assert.strictEqual(isOrderDessertsReady(order), false)

// Mozo sirve bebidas
order.order_items[0].notes = TAG_DRINK_SERVED
assert.strictEqual(areOrderDrinksPending(order), false, 'Bebidas ya servidas no deben estar pendientes')

// Cocina marca Pase 1 (Comida lista)
order.order_items[1].notes = TAG_FOOD_READY
assert.strictEqual(isOrderFoodReady(order), true, 'Comida salada lista')
assert.strictEqual(isOrderDessertsReady(order), false, 'Postres todavía deben estar retenidos en cocina')

// Cocina marca Pase 2 (Postres listos)
order.order_items[2].notes = TAG_DESSERT_READY
assert.strictEqual(isOrderDessertsReady(order), true, 'Postres emplatados y listos')

console.log('✓ Todo el ciclo operativo verificado con éxito: 100% PASS!')
