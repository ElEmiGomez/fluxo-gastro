// ==============================================================================
// GASTRO PWA - SIMULACIÓN MASIVA DE SOBRECARGA, CAOS Y CONCURRENCIA
// Auditorías 4, 5 y 6: Ráfaga de pedidos masivos, tormenta de micro-servicios,
// despacho mixto cocina/barra y transiciones en tiempo real.
// ==============================================================================

import assert from 'node:assert'

const BASE_URL = 'http://localhost:3000'
const SLUG = 'burger-gourmet'

console.log('\n====================================================')
console.log('🚀 INICIANDO AUDITORÍAS 4, 5 Y 6: SIMULACIÓN DE CAOS Y SOBRECARGA')
console.log('====================================================\n')

let passedTests = 0
let failedTests = 0

async function test(name, fn) {
  const start = performance.now()
  try {
    await fn()
    const duration = (performance.now() - start).toFixed(2)
    console.log(`  ✓ [PASS] ${name} (${duration} ms)`)
    passedTests++
  } catch (err) {
    const duration = (performance.now() - start).toFixed(2)
    console.error(`  ✗ [FAIL] ${name} (${duration} ms)`)
    console.error(`    Error: ${err.message}\n`)
    failedTests++
  }
}

// ------------------------------------------------------------------------------
// AUDITORÍA 4: RÁFAGA DE PEDIDOS MASIVOS MULTI-ÍTEM (BURST LOAD)
// ------------------------------------------------------------------------------
console.log('--- [AUDITORÍA 4: SOBRECARGA MASIVA Y CONCURRENCIA] ---')

await test('Auditoría 4.1: Ráfaga de 50 pedidos multi-ítem en paralelo en 20 mesas', async () => {
  const products = [
    { id: 'p-promo-1', name: 'Combo Pareja', price: 24500 },
    { id: 'p-bur-1', name: 'Bacon Cheese Doble Monster', price: 14200 },
    { id: 'p-mil-1', name: 'Milanesa Napolitana', price: 12500 },
    { id: 'p-piz-1', name: 'Pizza Napolitana Especial', price: 13800 },
    { id: 'p-bca-1', name: 'Cerveza IPA 500ml', price: 4200 },
    { id: 'p-trg-1', name: 'Fernet Branca Artesanal', price: 4800 },
    { id: 'p-gin-1', name: 'Gin Tonic de Autor', price: 6400 },
  ]

  const burstPromises = Array.from({ length: 50 }, (_, idx) => {
    const tableNum = (idx % 20) + 1
    const item1 = products[idx % products.length]
    const item2 = products[(idx + 3) % products.length]
    const totalAmount = item1.price * 2 + item2.price

    return fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug: SLUG,
        table_number: tableNum,
        total_amount: totalAmount,
        items: [
          {
            product_id: item1.id,
            quantity: 2,
            notes: `[Sin Sal, Bien Cocido] Ráfaga #${idx + 1} - Mesa #${tableNum}`,
            product: {
              id: item1.id,
              name: item1.name,
              price: item1.price,
              category_id: item1.id.includes('bca') || item1.id.includes('trg') || item1.id.includes('gin') ? 'cat-13' : 'cat-1',
              image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
            },
          },
          {
            product_id: item2.id,
            quantity: 1,
            notes: '[Papas Fritas] Bebida helada',
            product: {
              id: item2.id,
              name: item2.name,
              price: item2.price,
              category_id: item2.id.includes('bca') || item2.id.includes('trg') || item2.id.includes('gin') ? 'cat-14' : 'cat-5',
              image_url: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80',
            },
          },
        ],
      }),
    }).then(r => r.json())
  })

  const results = await Promise.all(burstPromises)
  assert.strictEqual(results.length, 50, 'Los 50 pedidos concurrentes deben procesarse')
  results.forEach(res => {
    assert.strictEqual(res.success, true)
    assert.strictEqual(res.order.order_items.length, 2)
  })
})

await test('Auditoría 4.2: Verificación de integridad de órdenes en servidor tras ráfaga', async () => {
  const res = await fetch(`${BASE_URL}/api/orders?slug=${SLUG}`).then(r => r.json())
  assert.strictEqual(res.orders.length >= 50, true, 'El servidor debe almacenar todas las comandas de la ráfaga')
  
  // Validar que cada orden tenga su mesa y productos correctos
  res.orders.slice(0, 10).forEach(ord => {
    assert.strictEqual(typeof ord.table_number, 'number')
    assert.strictEqual(ord.order_items.length > 0, true)
    assert.strictEqual(typeof ord.total_amount, 'number')
  })
})

// ------------------------------------------------------------------------------
// AUDITORÍA 5: TORMENTA DE MICRO-SERVICIOS Y CUENTAS (CHAOS STORM)
// ------------------------------------------------------------------------------
console.log('\n--- [AUDITORÍA 5: TORMENTA DE MICRO-SERVICIOS Y CUENTAS] ---')

await test('Auditoría 5.1: Disparo simultáneo de 15 solicitudes de servicio y pagos mixtos', async () => {
  const serviceCalls = [
    { table_number: 1, call_type: 'bill_Efectivo' },
    { table_number: 2, call_type: 'order_dictate' },
    { table_number: 3, call_type: 'service_Hielo y Limón' },
    { table_number: 4, call_type: 'service_Panera / Salsas' },
    { table_number: 5, call_type: 'bill_Tarjeta' },
    { table_number: 6, call_type: 'service_Cubiertos Extra' },
    { table_number: 7, call_type: 'bill_MercadoPago_QR' },
    { table_number: 8, call_type: 'service_Repetir Bebidas' },
    { table_number: 9, call_type: 'order_dictate' },
    { table_number: 10, call_type: 'service_Servilletas' },
    { table_number: 11, call_type: 'bill_Efectivo' },
    { table_number: 12, call_type: 'service_Sal / Condimentos' },
    { table_number: 13, call_type: 'order_dictate' },
    { table_number: 14, call_type: 'service_Hielo y Limón' },
    { table_number: 15, call_type: 'bill_Tarjeta' },
  ]

  const callPromises = serviceCalls.map(c =>
    fetch(`${BASE_URL}/api/service-calls`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: SLUG, table_number: c.table_number, call_type: c.call_type }),
    }).then(r => r.json())
  )

  const callResults = await Promise.all(callPromises)
  assert.strictEqual(callResults.length, 15)
  callResults.forEach((res, i) => {
    assert.strictEqual(res.success, true)
    assert.strictEqual(res.call.table_number, serviceCalls[i].table_number)
    assert.strictEqual(res.call.status, 'pending')
  })
})

await test('Auditoría 5.2: Atención y resolución concurrente de avisos', async () => {
  const getRes = await fetch(`${BASE_URL}/api/service-calls?slug=${SLUG}`).then(r => r.json())
  const pendingCalls = (getRes.calls || []).filter(c => c.status === 'pending')
  assert.strictEqual(pendingCalls.length >= 15, true)

  // Atender las primeras 10 llamadas en paralelo
  const attendPromises = pendingCalls.slice(0, 10).map(c =>
    fetch(`${BASE_URL}/api/service-calls`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: SLUG, callId: c.id }),
    }).then(r => r.json())
  )

  const attendResults = await Promise.all(attendPromises)
  attendResults.forEach(res => {
    assert.strictEqual(res.success, true)
  })

  // Comprobar que solo quedan las restantes
  const getResAfter = await fetch(`${BASE_URL}/api/service-calls?slug=${SLUG}`).then(r => r.json())
  const pendingAfter = (getResAfter.calls || []).filter(c => c.status === 'pending')
  assert.strictEqual(pendingAfter.length, pendingCalls.length - 10)
})

// ------------------------------------------------------------------------------
// AUDITORÍA 6: DESPACHO MIXTO COCINA / BARRA Y SINCRONIZACIÓN EN TIEMPO REAL
// ------------------------------------------------------------------------------
console.log('\n--- [AUDITORÍA 6: DESPACHO MIXTO COCINA/BARRA Y CICLO KDS] ---')

await test('Auditoría 6.1: Despacho y clasificación de comandas mixtas (Comida + Bebida)', async () => {
  // Crear comanda mixta para Mesa 4
  const mixedOrder = await fetch(`${BASE_URL}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      slug: SLUG,
      table_number: 4,
      total_amount: 35100,
      items: [
        {
          product_id: 'p-bur-1',
          quantity: 2,
          notes: '[Sin Cebolla] Burger Gourmet Cocina',
          product: {
            id: 'p-bur-1',
            name: 'Bacon Cheese Doble Monster',
            category_id: 'cat-7', // Burguers -> Cocina
            price: 14200,
            image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
          },
        },
        {
          product_id: 'p-gin-1',
          quantity: 1,
          notes: '[Con mucho hielo] Gin Barra',
          product: {
            id: 'p-gin-1',
            name: 'Gin Tonic de Autor',
            category_id: 'cat-15', // Gin -> Barra
            price: 6400,
            image_url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80',
          },
        },
      ],
    }),
  }).then(r => r.json())

  assert.strictEqual(mixedOrder.success, true)
  const orderId = mixedOrder.order.id

  // 1. Simular inicio de preparación
  const prepRes = await fetch(`${BASE_URL}/api/orders`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slug: SLUG, orderId, status: 'preparing' }),
  }).then(r => r.json())
  assert.strictEqual(prepRes.success, true)

  // 2. Simular que cocina marca listo
  const readyRes = await fetch(`${BASE_URL}/api/orders`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slug: SLUG, orderId, status: 'ready' }),
  }).then(r => r.json())
  assert.strictEqual(readyRes.success, true)

  // 3. Simular que mozo marca servido
  const delivRes = await fetch(`${BASE_URL}/api/orders`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slug: SLUG, orderId, status: 'delivered' }),
  }).then(r => r.json())
  assert.strictEqual(delivRes.success, true)
})

await test('Auditoría 6.2: Latencia de respuesta en carga continua (100 peticiones REST)', async () => {
  const reqs = Array.from({ length: 100 }, () =>
    fetch(`${BASE_URL}/api/orders?slug=${SLUG}`).then(r => r.json())
  )
  const results = await Promise.all(reqs)
  assert.strictEqual(results.length, 100)
})

console.log('\n====================================================')
console.log(`📊 RESULTADOS FINALES: ${passedTests}/${passedTests + failedTests} PRUEBAS COMPLETADAS CON ÉXITO (${failedTests} ERRORES)`)
console.log('====================================================\n')

if (failedTests > 0) {
  process.exit(1)
}
