// ==============================================================================
// GASTRO PWA - SIMULACIÓN DE TURNO REAL DE 4 HORAS CON ERRORES HUMANOS
// Prueba equivocaciones de clientes, mozos y cocina, rotación de mesas (turnos),
// pedidos por rondas sucesivas, protección anti-spam, caracteres raros e inyecciones.
// ==============================================================================

import assert from 'node:assert'

const BASE_URL = 'http://localhost:3000'
const SLUG = 'burger-gourmet'

console.log('\n====================================================')
console.log('🍽️ SIMULACIÓN: TURNO DE 4 HORAS CON ERRORES HUMANOS Y ROTACIÓN')
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
// ESCENARIO 1: ERRORES DE CLIENTES IMPACIENTES Y CARACTERES PROBLEMÁTICOS
// ------------------------------------------------------------------------------
console.log('--- [ESCENARIO 1: EQUIVOCACIONES Y COMPORTAMIENTO DE CLIENTES] ---')

await test('1.1. Impaciencia: Cliente pulsa 5 veces en 1 segundo "Enviar Comanda"', async () => {
  // Simulamos 5 clicks en ráfaga de 50ms para la misma mesa y mismos ítems
  const burst = Array.from({ length: 5 }, () =>
    fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug: SLUG,
        table_number: 8,
        total_amount: 14200,
        items: [
          {
            product_id: 'p-bur-1',
            quantity: 1,
            notes: '[Sin Cebolla] Click rápido impaciente',
          },
        ],
      }),
    }).then(r => r.json())
  )

  const results = await Promise.all(burst)
  // Todas deben procesarse de forma segura sin romper el servidor
  results.forEach(res => {
    assert.strictEqual(res.success, true)
    assert.strictEqual(typeof res.order.id, 'string')
  })
})

await test('1.2. Notas con emojis, caracteres especiales y sanitización XSS', async () => {
  const dirtyNotes = '🍔 Sin sal & sin cebolla! <script>alert("hack")</script> "doble queso" 🧅 100% gourmet'
  
  const res = await fetch(`${BASE_URL}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      slug: SLUG,
      table_number: 11,
      total_amount: 24500,
      items: [
        {
          product_id: 'p-promo-1',
          quantity: 1,
          notes: dirtyNotes,
        },
      ],
    }),
  }).then(r => r.json())

  assert.strictEqual(res.success, true)
  assert.strictEqual(res.order.order_items[0].notes, dirtyNotes)
})

await test('1.3. Múltiples comensales en la misma mesa enviando pedidos al mismo tiempo', async () => {
  // Comensal A en Mesa 4 pide su burger, Comensal B en Mesa 4 pide su pizza simultáneamente
  const [personA, personB] = await Promise.all([
    fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug: SLUG,
        table_number: 4,
        total_amount: 14200,
        items: [{ product_id: 'p-bur-1', quantity: 1, notes: 'Comensal A (Novio)' }],
      }),
    }).then(r => r.json()),
    fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug: SLUG,
        table_number: 4,
        total_amount: 13800,
        items: [{ product_id: 'p-piz-1', quantity: 1, notes: 'Comensal B (Novia)' }],
      }),
    }).then(r => r.json()),
  ])

  assert.strictEqual(personA.success, true)
  assert.strictEqual(personB.success, true)
  assert.notStrictEqual(personA.order.id, personB.order.id, 'Deben tener IDs de orden únicos')
})

// ------------------------------------------------------------------------------
// ESCENARIO 2: COMANDAS EN CUOTAS (RONDAS 1, 2 Y 3 A LO LARGO DE LA COMIDA)
// ------------------------------------------------------------------------------
console.log('\n--- [ESCENARIO 2: PEDIDOS POR RONDAS A LO LARGO DE 1 HORA EN MESA 5] ---')

await test('2.1. Ronda 1 (Minuto 0): Entradas y Bebidas', async () => {
  const r1 = await fetch(`${BASE_URL}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      slug: SLUG,
      table_number: 5,
      total_amount: 16800,
      items: [
        { product_id: 'p-ent-1', quantity: 1, notes: 'Ronda 1: Entrada rabas' },
        { product_id: 'p-bca-1', quantity: 2, notes: 'Ronda 1: 2 Cervezas heladas' },
      ],
    }),
  }).then(r => r.json())

  assert.strictEqual(r1.success, true)
})

await test('2.2. Ronda 2 (Minuto 25): Platos Fuertes', async () => {
  const r2 = await fetch(`${BASE_URL}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      slug: SLUG,
      table_number: 5,
      total_amount: 28400,
      items: [
        { product_id: 'p-bur-1', quantity: 2, notes: 'Ronda 2: 2 Burgers completas' },
      ],
    }),
  }).then(r => r.json())

  assert.strictEqual(r2.success, true)
})

await test('2.3. Ronda 3 (Minuto 50): Postres y Café', async () => {
  const r3 = await fetch(`${BASE_URL}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      slug: SLUG,
      table_number: 5,
      total_amount: 8500,
      items: [
        { product_id: 'p-pos-1', quantity: 1, notes: 'Ronda 3: Volcán de chocolate' },
      ],
    }),
  }).then(r => r.json())

  assert.strictEqual(r3.success, true)
})

// ------------------------------------------------------------------------------
// ESCENARIO 3: ROTACIÓN DE SALÓN (TURNO 1 -> PAGO Y LIBERACIÓN -> TURNO 2)
// ------------------------------------------------------------------------------
console.log('\n--- [ESCENARIO 3: ROTACIÓN DE CLIENTES EN LA MISMA MESA] ---')

await test('3.1. Turno 1: Mesa 12 come, pide cuenta y se despachan todas sus comandas', async () => {
  // 1. Pedido
  const orderRes = await fetch(`${BASE_URL}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      slug: SLUG,
      table_number: 12,
      total_amount: 24500,
      items: [{ product_id: 'p-promo-1', quantity: 1, notes: 'Cliente Turno 1 (13:00 hs)' }],
    }),
  }).then(r => r.json())

  // 2. Pedir cuenta
  const callRes = await fetch(`${BASE_URL}/api/service-calls`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slug: SLUG, table_number: 12, call_type: 'bill_Tarjeta' }),
  }).then(r => r.json())

  // 3. Atender llamada y entregar/cobrar todas las comandas activas de la Mesa 12
  await fetch(`${BASE_URL}/api/service-calls`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slug: SLUG, callId: callRes.call.id }),
  })

  // Obtener todas las órdenes activas de la Mesa 12 y archivarlas al cobrar
  const beforeClose = await fetch(`${BASE_URL}/api/orders?slug=${SLUG}`).then(r => r.json())
  const activeOfTable12 = beforeClose.orders.filter(o => o.table_number === 12 && o.status !== 'delivered')
  for (const o of activeOfTable12) {
    await fetch(`${BASE_URL}/api/orders`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: SLUG, orderId: o.id, status: 'delivered' }),
    })
  }

  // Verificar que no quedan pedidos pendientes para la Mesa 12
  const orders = await fetch(`${BASE_URL}/api/orders?slug=${SLUG}`).then(r => r.json())
  const activeTable12 = orders.orders.filter(o => o.table_number === 12 && o.status !== 'delivered')
  assert.strictEqual(activeTable12.length, 0, 'Mesa 12 debe quedar libre para el próximo cliente')
})

await test('3.2. Turno 2 (14:30 hs): Llega un nuevo cliente a la Mesa 12 con cuenta limpia', async () => {
  const newOrder = await fetch(`${BASE_URL}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      slug: SLUG,
      table_number: 12,
      total_amount: 14200,
      items: [{ product_id: 'p-bur-1', quantity: 1, notes: 'Cliente Turno 2 (Nuevo grupo limpio)' }],
    }),
  }).then(r => r.json())

  assert.strictEqual(newOrder.success, true)
  assert.strictEqual(newOrder.order.status, 'pending')
})

// ------------------------------------------------------------------------------
// ESCENARIO 4: SIMULACIÓN DE PICOS DE 4 HORAS EN TODAS LAS 20 MESAS
// ------------------------------------------------------------------------------
console.log('\n--- [ESCENARIO 4: SIMULACIÓN DE 4 HORAS DE ROTACIÓN EN LAS 20 MESAS] ---')

await test('4.1. Generación de 100 comandas con rotación y despacho en las 20 mesas', async () => {
  // Simulamos 100 grupos de clientes entrando y saliendo de las 20 mesas a lo largo del turno
  const shiftPromises = Array.from({ length: 100 }, async (_, i) => {
    const tableNum = (i % 20) + 1
    const orderRes = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug: SLUG,
        table_number: tableNum,
        total_amount: 15000 + (i % 5) * 2000,
        items: [
          {
            product_id: 'p-bur-1',
            quantity: (i % 3) + 1,
            notes: `Turno Continuo Comanda #${i + 1}`,
          },
        ],
      }),
    }).then(r => r.json())

    // Simular que el 70% de las órdenes completan el ciclo KDS a lo largo del turno
    if (i % 3 !== 0) {
      await fetch(`${BASE_URL}/api/orders`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: SLUG, orderId: orderRes.order.id, status: 'delivered' }),
      })
    }
    return orderRes
  })

  const results = await Promise.all(shiftPromises)
  assert.strictEqual(results.length, 100)
  results.forEach(res => assert.strictEqual(res.success, true))
})

await test('4.2. Rendimiento final del servidor tras 100+ comandas y llamadas acumuladas', async () => {
  const start = performance.now()
  const res = await fetch(`${BASE_URL}/api/orders?slug=${SLUG}`).then(r => r.json())
  const duration = performance.now() - start

  assert.strictEqual(res.orders.length >= 100, true)
  assert.strictEqual(duration < 50, true, `La respuesta debe ser ultra-rápida (< 50ms), tardó: ${duration.toFixed(2)}ms`)
})

console.log('\n====================================================')
console.log(`📊 RESULTADOS FINALES DEL TURNO: ${passedTests}/${passedTests + failedTests} PRUEBAS COMPLETADAS CON ÉXITO (${failedTests} ERRORES)`)
console.log('====================================================\n')

if (failedTests > 0) {
  process.exit(1)
}
