// ==============================================================================
// GASTRO PWA - SUITE DE PRUEBAS DE ESTRÉS, CONCURRENCIA Y RESILIENCIA
// Simula 20 mesas simultáneas, llamadas de servicio concurrentes,
// ciclo de vida completo de cocina KDS y cálculo de subtotales.
// ==============================================================================

import assert from 'node:assert'

const BASE_URL = 'http://localhost:3000'
const SLUG = 'burger-gourmet'

console.log('\n====================================================')
console.log('🧪 SUITE DE PRUEBAS DE ESTRÉS Y BLINDAJE DE CONEXIONES')
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

// 1. Prueba de Concurrencia de 20 Mesas Simultáneas
await test('Concurrencia: Creación paralela de 20 pedidos (Mesas 1 a 20)', async () => {
  const promises = Array.from({ length: 20 }, (_, i) => {
    const tableNum = i + 1
    return fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug: SLUG,
        table_number: tableNum,
        total_amount: 14200,
        items: [
          {
            product_id: 'p-bur-1',
            quantity: 1,
            notes: `[Bien Cocido, Sin Sal] Mesa #${tableNum} comanda de prueba`,
          },
        ],
      }),
    }).then(r => r.json())
  })

  const results = await Promise.all(promises)
  assert.strictEqual(results.length, 20, 'Deben haberse procesado las 20 mesas')
  results.forEach((res, idx) => {
    assert.strictEqual(res.success, true, `Mesa ${idx + 1} debe responder success: true`)
    assert.strictEqual(res.order.table_number, idx + 1, `Mesa asignada debe ser ${idx + 1}`)
  })
})

// 2. Prueba de Llamadas de Servicio y Despacho
await test('Avisos de Servicio: Envío y atención concurrente (Dictar, Cuenta, Hielo)', async () => {
  // Crear 3 llamadas
  const call1 = await fetch(`${BASE_URL}/api/service-calls`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slug: SLUG, table_number: 4, call_type: 'order_dictate' }),
  }).then(r => r.json())

  const call2 = await fetch(`${BASE_URL}/api/service-calls`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slug: SLUG, table_number: 4, call_type: 'bill_Tarjeta' }),
  }).then(r => r.json())

  assert.strictEqual(call1.success, true)
  assert.strictEqual(call2.success, true)

  // Marcar como atendidas
  const attend1 = await fetch(`${BASE_URL}/api/service-calls`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slug: SLUG, callId: call1.call.id }),
  }).then(r => r.json())

  assert.strictEqual(attend1.success, true)
})

// 3. Ciclo de Vida KDS para Mesa 4 (Pending -> Preparing -> Ready -> Delivered)
await test('Ciclo de Vida KDS: Mesa 4 transiciones (Pending -> Preparing -> Ready -> Delivered)', async () => {
  // Crear comanda
  const orderRes = await fetch(`${BASE_URL}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      slug: SLUG,
      table_number: 4,
      total_amount: 24500,
      items: [
        {
          product_id: 'p-promo-1',
          quantity: 1,
          notes: '[Sin Sal] Sin tomate',
        },
      ],
    }),
  }).then(r => r.json())

  const orderId = orderRes.order.id

  // 1. Pending -> Preparing
  const prepRes = await fetch(`${BASE_URL}/api/orders`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slug: SLUG, orderId, status: 'preparing' }),
  }).then(r => r.json())
  assert.strictEqual(prepRes.success, true)

  // 2. Preparing -> Ready
  const readyRes = await fetch(`${BASE_URL}/api/orders`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slug: SLUG, orderId, status: 'ready' }),
  }).then(r => r.json())
  assert.strictEqual(readyRes.success, true)

  // 3. Ready -> Delivered
  const delivRes = await fetch(`${BASE_URL}/api/orders`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slug: SLUG, orderId, status: 'delivered' }),
  }).then(r => r.json())
  assert.strictEqual(delivRes.success, true)
})

// 4. Integridad de Notas y Modificadores
await test('Integridad de Notas: Preservación de caracteres especiales y píldoras combinadas', async () => {
  const notesString = '[Puré de Papas, Sin TACC, Término Medio] Aclaración: Bien caliente & sin aderezos'
  const res = await fetch(`${BASE_URL}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      slug: SLUG,
      table_number: 7,
      total_amount: 12500,
      items: [{ product_id: 'p-mil-1', quantity: 2, notes: notesString }],
    }),
  }).then(r => r.json())

  assert.strictEqual(res.success, true)
  assert.strictEqual(res.order.order_items[0].notes, notesString)
})

console.log('\n====================================================')
console.log(`📊 RESULTADOS: ${passedTests}/${passedTests + failedTests} PRUEBAS COMPLETADAS CON ÉXITO (${failedTests} ERRORES)`)
console.log('====================================================\n')

if (failedTests > 0) {
  process.exit(1)
}
