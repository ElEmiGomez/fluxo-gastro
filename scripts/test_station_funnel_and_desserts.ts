import assert from 'assert'
import {
  isDrinkOnlyOrder,
  orderHasHeldDesserts,
  orderHasActiveDesserts,
  areOrderDrinksPending,
  evaluateOrderStations,
  stripInternalStationTags,
  cleanItemNotes,
  TAG_DRINK_SERVED,
  TAG_FOOD_READY,
  TAG_DESSERT_READY,
  TAG_DESSERT_FIRED,
} from '../src/lib/course-utils'
import { VALID_ORDER_TRANSITIONS } from '../src/lib/server-state'

console.log('=== TEST SUITE: REGLA DEL EMBUDO, BEBIDAS Y POSTRES (FLUXO 1.2 & 1.0) ===\n')

// 1. Invariantes de la Máquina de Estados
console.log('1. Verificando transiciones legales en VALID_ORDER_TRANSITIONS...')
assert.ok(
  VALID_ORDER_TRANSITIONS['pending_validation'].includes('ready'),
  'pending_validation -> ready debe permitirse para comandas 100% bebidas'
)
assert.ok(
  VALID_ORDER_TRANSITIONS['ready'].includes('preparing'),
  'ready -> preparing debe permitirse para reactivar comanda al marchar postres'
)
assert.ok(
  VALID_ORDER_TRANSITIONS['delivered'].includes('preparing'),
  'delivered -> preparing debe permitirse para reactivar comanda al marchar postres'
)
console.log('  ✔ Transiciones de máquina de estados validadas con éxito.\n')

// 2. Regla del Embudo para Bebidas
console.log('2. Verificando Regla del Embudo para Bebidas en Comandero...')
const comandaClienteQR: any = {
  id: 'ord-qr-001',
  status: 'pending_validation',
  order_items: [
    { id: 'item-1', course: 'drink', product: { name: 'Cerveza Estrella Galicia' }, notes: '' },
    { id: 'item-2', course: 'second', product: { name: 'Burger Clásica' }, notes: '' },
    { id: 'item-3', course: 'dessert', product: { name: 'Tarta de Queso' }, notes: '' },
  ],
}

// En pending_validation:
// - El mozo NO debe ver las bebidas en la barra todavía (primero valida la comanda en sala)
assert.strictEqual(
  areOrderDrinksPending(comandaClienteQR),
  false,
  'En pending_validation, areOrderDrinksPending debe ser false (Regla del Embudo: paso 1)'
)

// Mozo aprueba la comanda -> pasa a pending/preparing
comandaClienteQR.status = 'preparing'
assert.strictEqual(
  areOrderDrinksPending(comandaClienteQR),
  true,
  'Tras aprobar la comanda, las bebidas deben pasar a pendientes en barra'
)

// Mozo entrega las bebidas
comandaClienteQR.order_items[0].notes = TAG_DRINK_SERVED
assert.strictEqual(
  areOrderDrinksPending(comandaClienteQR),
  false,
  'Una vez servidas las bebidas, ya no deben figurar como pendientes'
)

// Cocina entrega la comida salada, pero las bebidas no se borran si quedara alguna sin servir
const comandaConBebidaSinServir: any = {
  id: 'ord-qr-002',
  status: 'delivered', // comida entregada en mesa
  order_items: [
    { id: 'b1', course: 'drink', notes: '' }, // bebida pendiente
    { id: 'f1', course: 'second', notes: TAG_FOOD_READY },
  ],
}
assert.strictEqual(
  areOrderDrinksPending(comandaConBebidaSinServir),
  true,
  'Anti-cierre prematuro: entrega de comida no descarta bebidas pendientes'
)
console.log('  ✔ Regla del embudo y ciclo de bebidas 100% verificado.\n')

// 3. Regla Inteligente de Postres (1ª Ronda vs 2ª Ronda)
console.log('3. Verificando Regla Inteligente de Postres en 2 Tiempos...')

// Caso A: Ronda 1 (Comida + Postres juntos) -> Postres retenidos en cocina (candado gris)
const comandaCompletaRonda1: any = {
  id: 'ord-ronda-1',
  status: 'preparing',
  order_items: [
    { id: 'p1', course: 'second', product: { name: 'Hamburguesa Gallega' }, notes: '' },
    { id: 'd1', course: 'dessert', product: { name: 'Tarta de la Abuela' }, notes: '' },
  ],
}
assert.strictEqual(
  orderHasHeldDesserts(comandaCompletaRonda1),
  true,
  'Comanda mixta (comida + postres): postres deben estar retenidos (esperando mozo)'
)
assert.strictEqual(
  orderHasActiveDesserts(comandaCompletaRonda1),
  false,
  'Comanda mixta: postres no están activos antes de marchar'
)

// Mozo toca «Marchar Postres» -> postres pasan a activos en cocina
comandaCompletaRonda1.order_items[1].notes = TAG_DESSERT_FIRED
assert.strictEqual(
  orderHasHeldDesserts(comandaCompletaRonda1),
  false,
  'Tras marchar postres, ya no están retenidos'
)
assert.strictEqual(
  orderHasActiveDesserts(comandaCompletaRonda1),
  true,
  'Tras marchar postres, están activos en cocina'
)

// Caso B: Ronda 2 (Comanda SOLO de postres pedida a posteriori tras comer) -> Directo a cocina sin retención!
const comandaSoloPostresRonda2: any = {
  id: 'ord-ronda-2',
  status: 'pending',
  order_items: [
    { id: 'd2', course: 'dessert', product: { name: 'Coulant de Chocolate' }, notes: '' },
    { id: 'b2', course: 'drink', product: { name: 'Café Cortado' }, notes: '' },
  ],
}
assert.strictEqual(
  orderHasHeldDesserts(comandaSoloPostresRonda2),
  false,
  'Comanda solo de postres/café NO debe retenerse (debe prepararse de inmediato)'
)
assert.strictEqual(
  orderHasActiveDesserts(comandaSoloPostresRonda2),
  true,
  'Comanda solo de postres debe estar activa para preparación inmediata en cocina'
)
console.log('  ✔ Regla inteligente de postres en 2 tiempos 100% verificada.\n')

// 4. Sanitización Total de Etiquetas Internas (Anti-Leakage)
console.log('4. Verificando Sanitización Total de Etiquetas Internas...')
assert.strictEqual(stripInternalStationTags('[BARRA: SERVIDA]'), '')
assert.strictEqual(stripInternalStationTags('[BARRA_SERVIDA]'), '')
assert.strictEqual(stripInternalStationTags('[COCINA: LISTA]'), '')
assert.strictEqual(stripInternalStationTags('[COCINA_LISTA]'), '')
assert.strictEqual(stripInternalStationTags('[POSTRE: LISTO]'), '')
assert.strictEqual(stripInternalStationTags('[POSTRE_LISTO]'), '')
assert.strictEqual(stripInternalStationTags('[POSTRE: EN ESPERA]'), '')
assert.strictEqual(stripInternalStationTags('[POSTRE_EN_ESPERA]'), '')
assert.strictEqual(stripInternalStationTags('[MARCHAR_POSTRE]'), '')
assert.strictEqual(stripInternalStationTags('Sin hielo [BARRA: SERVIDA]'), 'Sin hielo')
assert.strictEqual(stripInternalStationTags('Carne poco hecha [COCINA_LISTA]'), 'Carne poco hecha')
assert.strictEqual(cleanItemNotes('Con cuchara [POSTRE: LISTO]'), 'Con cuchara')
console.log('  ✔ Sanitización de etiquetas: cero fuga de texto técnico en interfaz comensal.\n')

// 5. Invariante 0% Bebidas en Pantalla de Cocina
console.log('5. Verificando Invariante 0% Bebidas en Pantalla de Cocina...')
const comandaSoloBebidas: any = {
  id: 'ord-solo-bebidas',
  status: 'pending',
  order_items: [
    { id: 'dr1', course: 'drink', product: { name: 'Cerveza' } },
    { id: 'dr2', course: 'drink', product: { name: 'Agua' } },
  ],
}
assert.strictEqual(isDrinkOnlyOrder(comandaSoloBebidas), true, 'Reconoce orden 100% bebidas')
const st = evaluateOrderStations(comandaSoloBebidas)
assert.strictEqual(st.kitchenItems.length, 0, 'Cocina recibe 0 platos de comanda de solo bebidas')
assert.strictEqual(st.barItems.length, 2, 'Bar/Mozo recibe todas las bebidas')
console.log('  ✔ Invariante 0% bebidas en cocina certificado.\n')

console.log('=================================================================')
console.log('TODAS LAS PRUEBAS DE OPERATORIA FLUXO 1.0 ESTABLE: 100% PASS (OK)')
console.log('=================================================================')
