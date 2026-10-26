import React from 'react'
import { renderToString } from 'react-dom/server'
import { KitchenTicket } from '../src/components/kitchen/KitchenTicket'
import { Order } from '../src/types/database.types'
import {
  TAG_STARTER_READY,
  TAG_STARTER_SERVED,
  TAG_MAIN_FIRED,
  TAG_MAIN_COOKING,
  TAG_MAIN_READY,
  TAG_MAIN_SERVED,
  TAG_DESSERT_FIRED,
  TAG_DESSERT_READY,
  TAG_DESSERT_SERVED,
} from '../src/lib/course-utils'

let passed = 0
let failed = 0

function assert(condition: boolean, message: string) {
  if (condition) {
    passed++
    console.log(`  ✓ [PASS] ${message}`)
  } else {
    failed++
    console.error(`  ❌ [FAIL] ${message}`)
  }
}

// Mock de comanda básica
function createMockOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: 'ord-test-uuid-1',
    restaurant_id: 'rest-uuid-1',
    table_id: 'tbl-1',
    table_number: 5,
    status: 'preparing',
    total_amount: 50.0,
    created_at: new Date(Date.now() - 5 * 60000).toISOString(),
    order_items: [],
    ...overrides,
  }
}

console.log('\n======================================================================')
console.log('🧪 VERIFICACIÓN COMPONENT-LEVEL: ACORDEONES INTELIGENTES KDS')
console.log('======================================================================\n')

// SCENARIO 1: Comanda completa recién marcha a cocina (Entradas activas, Principales y Postres bloqueados)
{
  console.log('--- Escenario 1: Entradas activas, Principales y Postres bloqueados ---')
  const order = createMockOrder({
    order_items: [
      {
        id: 'item-starter-1',
        order_id: 'ord-test-uuid-1',
        product_id: 'p-salad',
        name: 'Ensalada César Crujiente',
        quantity: 1,
        price: 12.0,
        notes: '',
        course: 'first',
        product: { name: 'Ensalada César Crujiente' } as any,
      },
      {
        id: 'item-main-1',
        order_id: 'ord-test-uuid-1',
        product_id: 'p-steak',
        name: 'Chuletón de Vaca Madurada',
        quantity: 1,
        price: 28.0,
        notes: '',
        course: 'second',
        product: { name: 'Chuletón de Vaca Madurada' } as any,
      },
      {
        id: 'item-dessert-1',
        order_id: 'ord-test-uuid-1',
        product_id: 'p-coulant',
        name: 'Coulant de Chocolate Belga',
        quantity: 1,
        price: 7.5,
        notes: '',
        course: 'dessert',
        product: { name: 'Coulant de Chocolate Belga' } as any,
      },
    ],
  })

  const html = renderToString(
    <KitchenTicket
      order={order}
      onUpdateStatus={() => {}}
      onKitchenAction={() => {}}
    />
  )

  // 1. Entradas debe estar desplegado con su plato visible
  assert(html.includes('1° Entradas (1 plato)'), 'Cabecera de 1° Entradas muestra (1 plato)')
  assert(html.includes('Ensalada César Crujiente'), 'Plato de 1° Entradas está visible en pantalla (desplegado)')

  // 2. Principales debe estar minimizado con candado y platos ocultos
  assert(html.includes('2° Principales (1 plato)'), 'Cabecera de 2° Principales muestra (1 plato)')
  assert(html.includes('EN ESPERA DEL MOZO'), 'Insignia de 2° Principales indica "EN ESPERA DEL MOZO"')
  assert(!html.includes('Chuletón de Vaca Madurada'), 'Plato de 2° Principales está oculto (minimizado)')

  // 3. Postres debe estar minimizado con candado y platos ocultos
  assert(html.includes('3° Postres (1 plato)'), 'Cabecera de 3° Postres muestra (1 plato)')
  assert(!html.includes('Coulant de Chocolate Belga'), 'Plato de 3° Postres está oculto (minimizado)')
}

// SCENARIO 2: Entradas servidas en mesa, Principales marchados
{
  console.log('\n--- Escenario 2: Entradas entregadas en mesa, Principales marchados ---')
  const order = createMockOrder({
    order_items: [
      {
        id: 'item-starter-1',
        order_id: 'ord-test-uuid-1',
        product_id: 'p-salad',
        name: 'Ensalada César Crujiente',
        quantity: 1,
        price: 12.0,
        notes: `${TAG_STARTER_READY} ${TAG_STARTER_SERVED}`,
        course: 'first',
        product: { name: 'Ensalada César Crujiente' } as any,
      },
      {
        id: 'item-main-1',
        order_id: 'ord-test-uuid-1',
        product_id: 'p-steak',
        name: 'Chuletón de Vaca Madurada',
        quantity: 2,
        price: 28.0,
        notes: `${TAG_MAIN_FIRED} ${TAG_MAIN_COOKING}`,
        course: 'second',
        product: { name: 'Chuletón de Vaca Madurada' } as any,
      },
      {
        id: 'item-dessert-1',
        order_id: 'ord-test-uuid-1',
        product_id: 'p-coulant',
        name: 'Coulant de Chocolate Belga',
        quantity: 1,
        price: 7.5,
        notes: '',
        course: 'dessert',
        product: { name: 'Coulant de Chocolate Belga' } as any,
      },
    ],
  })

  const html = renderToString(
    <KitchenTicket
      order={order}
      onUpdateStatus={() => {}}
      onKitchenAction={() => {}}
    />
  )

  // 1. Entradas debe auto-colapsarse en una sola línea esmeralda suave
  assert(html.includes('1° Entradas (1 plato)'), 'Cabecera de 1° Entradas presente')
  assert(html.includes('ENTREGADO EN MESA'), 'Insignia de 1° Entradas indica "ENTREGADO EN MESA"')
  assert(!html.includes('Ensalada César Crujiente'), 'Plato de 1° Entradas está auto-minimizado')

  // 2. Principales debe estar desplegado automáticamente para cocina
  assert(html.includes('2° Principales (2 platos)'), 'Cabecera de 2° Principales muestra plural (2 platos)')
  assert(html.includes('EN PREPARACIÓN'), 'Insignia de 2° Principales en preparación')
  assert(html.includes('Chuletón de Vaca Madurada'), 'Platos de 2° Principales están visibles en pantalla (desplegado)')

  // 3. Postres permanece minimizado
  assert(!html.includes('Coulant de Chocolate Belga'), 'Plato de 3° Postres sigue oculto (minimizado)')
}

// SCENARIO 3: Principales servidos en mesa, Postres marchados
{
  console.log('\n--- Escenario 3: Principales entregados en mesa, Postres marchados ---')
  const order = createMockOrder({
    order_items: [
      {
        id: 'item-starter-1',
        order_id: 'ord-test-uuid-1',
        product_id: 'p-salad',
        name: 'Ensalada César Crujiente',
        quantity: 1,
        price: 12.0,
        notes: `${TAG_STARTER_READY} ${TAG_STARTER_SERVED}`,
        course: 'first',
        product: { name: 'Ensalada César Crujiente' } as any,
      },
      {
        id: 'item-main-1',
        order_id: 'ord-test-uuid-1',
        product_id: 'p-steak',
        name: 'Chuletón de Vaca Madurada',
        quantity: 1,
        price: 28.0,
        notes: `${TAG_MAIN_FIRED} ${TAG_MAIN_READY} ${TAG_MAIN_SERVED}`,
        course: 'second',
        product: { name: 'Chuletón de Vaca Madurada' } as any,
      },
      {
        id: 'item-dessert-1',
        order_id: 'ord-test-uuid-1',
        product_id: 'p-coulant',
        name: 'Coulant de Chocolate Belga',
        quantity: 1,
        price: 7.5,
        notes: `${TAG_DESSERT_FIRED}`,
        course: 'dessert',
        product: { name: 'Coulant de Chocolate Belga' } as any,
      },
    ],
  })

  const html = renderToString(
    <KitchenTicket
      order={order}
      onUpdateStatus={() => {}}
      onKitchenAction={() => {}}
    />
  )

  // 1. Entradas y Principales auto-minimizados como entregados
  assert(!html.includes('Ensalada César Crujiente'), 'Entradas auto-minimizadas')
  assert(!html.includes('Chuletón de Vaca Madurada'), 'Principales auto-minimizados')
  assert(html.includes('2° Principales (1 plato)'), 'Cabecera de 2° Principales presente')
  assert(html.includes('ENTREGADO EN MESA'), 'Insignia de 2° Principales indica ENTREGADO EN MESA')

  // 2. Postres desplegados para preparación
  assert(html.includes('3° Postres (1 plato)'), 'Cabecera de 3° Postres muestra (1 plato)')
  assert(html.includes('Coulant de Chocolate Belga'), 'Postre visible para preparación (desplegado)')
}

// SCENARIO 4: Comanda directa de solo plato principal (sin entradas)
{
  console.log('\n--- Escenario 4: Comanda directa de solo plato principal ---')
  const order = createMockOrder({
    order_items: [
      {
        id: 'item-main-1',
        order_id: 'ord-test-uuid-1',
        product_id: 'p-burger',
        name: 'Hamburguesa Smash Doble',
        quantity: 1,
        price: 15.0,
        notes: '',
        course: 'second',
        product: { name: 'Hamburguesa Smash Doble' } as any,
      },
    ],
  })

  const html = renderToString(
    <KitchenTicket
      order={order}
      onUpdateStatus={() => {}}
      onKitchenAction={() => {}}
    />
  )

  // Principales no tiene bloqueo al no haber entradas, debe estar desplegado de inicio
  assert(html.includes('2° Principales (1 plato)'), 'Cabecera de 2° Principales presente')
  assert(html.includes('Hamburguesa Smash Doble'), 'Plato principal visible inmediatamente (no bloqueado)')
  assert(!html.includes('1° Entradas'), 'No se renderiza 1° Entradas al no haber items')
  assert(!html.includes('3° Postres'), 'No se renderiza 3° Postres al no haber items')
}

// SCENARIO 5: Pase completado listo para recoger (esperando al mozo)
{
  console.log('\n--- Escenario 5: Pase completado listo para recoger (esperando al mozo) ---')
  const order = createMockOrder({
    order_items: [
      {
        id: 'item-starter-1',
        order_id: 'ord-test-uuid-1',
        product_id: 'p-soup',
        name: 'Crema de Calabaza Asada',
        quantity: 1,
        price: 9.0,
        notes: `${TAG_STARTER_READY}`, // Listo pero aún no servido
        course: 'first',
        product: { name: 'Crema de Calabaza Asada' } as any,
      },
      {
        id: 'item-main-1',
        order_id: 'ord-test-uuid-1',
        product_id: 'p-fish',
        name: 'Lubina a la Sal',
        quantity: 1,
        price: 24.0,
        notes: '',
        course: 'second',
        product: { name: 'Lubina a la Sal' } as any,
      },
    ],
  })

  const html = renderToString(
    <KitchenTicket
      order={order}
      onUpdateStatus={() => {}}
      onKitchenAction={() => {}}
    />
  )

  // 1. Pase 1 debe mostrarse completado pero ABIERTO para que cocina sepa qué está esperando al mozo
  assert(html.includes('PASE 1 COMPLETADO'), 'Insignia indica "PASE 1 COMPLETADO"')
  assert(html.includes('Crema de Calabaza Asada'), 'Plato de Pase 1 completado visible en ticket')
  // 2. Principales aún bloqueado
  assert(!html.includes('Lubina a la Sal'), 'Principales sigue bloqueado esperando orden del mozo')
}

// SCENARIO 6: Multi-Ronda en Mesa (Ronda 1 con principales en marcha + Ronda 2 con entradas activas)
{
  console.log('\n--- Escenario 6: Mesa Multi-Ronda (Aislamiento estricto por Order ID) ---')
  const round1 = createMockOrder({
    id: 'round-1-uuid',
    order_items: [
      {
        id: 'item-r1-m1',
        order_id: 'round-1-uuid',
        product_id: 'p-m1',
        name: 'Entrecot a la Brasa',
        quantity: 1,
        price: 22.0,
        notes: `${TAG_MAIN_FIRED} ${TAG_MAIN_COOKING}`,
        course: 'second',
        product: { name: 'Entrecot a la Brasa' } as any,
      },
    ],
  })

  const round2 = createMockOrder({
    id: 'round-2-uuid',
    order_items: [
      {
        id: 'item-r2-s1',
        order_id: 'round-2-uuid',
        product_id: 'p-s1',
        name: 'Croquetas de Jamón Ibérico',
        quantity: 1,
        price: 10.0,
        notes: '',
        course: 'first',
        product: { name: 'Croquetas de Jamón Ibérico' } as any,
      },
    ],
  })

  const html = renderToString(
    <KitchenTicket
      orders={[round1, round2]}
      onUpdateStatus={() => {}}
      onKitchenAction={() => {}}
    />
  )

  assert(html.includes('Rondas'), 'Indica badge de múltiples Rondas')
  assert(html.includes('Entrecot a la Brasa'), 'Plato de Ronda 1 visible en su sección')
  assert(html.includes('Croquetas de Jamón Ibérico'), 'Plato de Ronda 2 visible en su sección')
}

console.log('\n======================================================================')
console.log(`RESUMEN: ${passed} pruebas superadas, ${failed} fallos.`)
console.log('======================================================================\n')

if (failed > 0) {
  process.exit(1)
}
