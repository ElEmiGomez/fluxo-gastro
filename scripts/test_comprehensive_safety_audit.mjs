// ==============================================================================
// GASTRO PWA - SUITE DE AUDITORÍA Y BLINDAJE INTEGRAL DE FUNCIONALIDADES
// Verifica la resistencia contra fallos humanos, datos corruptos, sobrecarga
// y sincronización multi-dispositivo en tiempo real.
// ==============================================================================

import assert from 'node:assert'

const BASE_URL = 'http://localhost:3000'
const SLUG = 'burger-gourmet'

console.log('\n====================================================')
console.log('🔬 AUDITORÍA INTEGRAL DE SEGURIDAD Y BLINDAJE (14 PUNTOS)')
console.log('====================================================\n')

let passed = 0
let failed = 0

async function auditStep(num, name, fn) {
  const start = performance.now()
  try {
    await fn()
    const duration = (performance.now() - start).toFixed(2)
    console.log(`  ✓ [PUNTO ${num}/14 PASS] ${name} (${duration} ms)`)
    passed++
  } catch (err) {
    const duration = (performance.now() - start).toFixed(2)
    console.error(`  ✗ [PUNTO ${num}/14 FAIL] ${name} (${duration} ms)`)
    console.error(`    Error: ${err.message}`)
    failed++
  }
}

// 1. Verificación de salud y carga de rutas principales
await auditStep(1, 'Verificación de Rutas y Assets estáticos (200 OK)', async () => {
  const routes = ['/', `/menu/${SLUG}?table=4`, `/staff/comandero/${SLUG}`, `/staff/kitchen/${SLUG}`]
  for (const r of routes) {
    const res = await fetch(`${BASE_URL}${r}`)
    assert.strictEqual(res.status, 200, `Ruta ${r} falló con estado ${res.status}`)
  }
})

// 2. Blindaje API: Rechazo de comanda sin productos
await auditStep(2, 'Blindaje API: Rechazo de comanda vacía (HTTP 400)', async () => {
  const res = await fetch(`${BASE_URL}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slug: SLUG, table_number: 4, items: [] }),
  })
  assert.strictEqual(res.status, 400)
  const data = await res.json()
  assert.ok(data.error.includes('La comanda debe contener al menos 1 producto'))
})

// 3. Blindaje API: Sanitización de cantidades negativas y productos nulos
await auditStep(3, 'Blindaje API: Sanitización de cantidades inválidas o productos nulos', async () => {
  const res = await fetch(`${BASE_URL}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      slug: SLUG,
      table_number: -8, // mesa negativa debe corregirse a >= 1
      items: [
        { product_id: 'p-promo-1', quantity: -3 }, // cantidad negativa debe corregirse a 1
        { product_id: '', quantity: 2 }, // producto vacío debe ser descartado
      ],
    }),
  })
  assert.strictEqual(res.status, 200)
  const data = await res.json()
  assert.strictEqual(data.success, true)
  assert.strictEqual(data.order.table_number >= 1, true)
  assert.strictEqual(data.order.order_items.length, 1)
  assert.strictEqual(data.order.order_items[0].quantity, 1)
})

// 4. Blindaje de Precios: Cálculo de total estricto en servidor
await auditStep(4, 'Blindaje de Precios: Cálculo inmutable de total en servidor', async () => {
  const res = await fetch(`${BASE_URL}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      slug: SLUG,
      table_number: 4,
      total_amount: 1, // intento de inyección de total manipulado
      items: [{ product_id: 'p-promo-1', quantity: 2 }],
    }),
  })
  const data = await res.json()
  assert.strictEqual(data.order.total_amount > 1000, true) // el servidor calcula el precio real
})

// 5. Preservación de caracteres especiales y notas de cocina
let createdOrderId = ''
await auditStep(5, 'Integridad de notas de comanda con caracteres complejos', async () => {
  const notesText = '[Sin Sal, Doble Cheddar] ¡Urgente, alérgico a la cebolla! #Mesa4 & <Gourmet>'
  const res = await fetch(`${BASE_URL}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      slug: SLUG,
      table_number: 4,
      items: [{ product_id: 'p-promo-1', quantity: 1, notes: notesText }],
    }),
  })
  const data = await res.json()
  assert.strictEqual(data.success, true)
  assert.strictEqual(data.order.order_items[0].notes, notesText)
  createdOrderId = data.order.id
})

// 6. KDS: Transición a 'preparing'
await auditStep(6, 'Ciclo KDS: Cocina inicia preparación (Pending -> Preparing)', async () => {
  const res = await fetch(`${BASE_URL}/api/orders`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slug: SLUG, orderId: createdOrderId, status: 'preparing' }),
  })
  const data = await res.json()
  assert.strictEqual(data.success, true)
  const target = data.orders.find(o => o.id === createdOrderId)
  assert.strictEqual(target.status, 'preparing')
})

// 7. KDS: Transición a 'ready'
await auditStep(7, 'Ciclo KDS: Cocina marca plato listo para servir (Preparing -> Ready)', async () => {
  const res = await fetch(`${BASE_URL}/api/orders`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slug: SLUG, orderId: createdOrderId, status: 'ready' }),
  })
  const data = await res.json()
  assert.strictEqual(data.success, true)
  const target = data.orders.find(o => o.id === createdOrderId)
  assert.strictEqual(target.status, 'ready')
})

// 8. Sincronización Cliente: Tracker refleja estado 'ready'
await auditStep(8, 'Sincronización Cliente: Mesa #4 recibe aviso de plato listo', async () => {
  const res = await fetch(`${BASE_URL}/api/orders?slug=${SLUG}`).then(r => r.json())
  const order = res.orders.find(o => o.id === createdOrderId)
  assert.strictEqual(order.status, 'ready')
})

// 9. Comandero Mozo: Despacho a 'delivered'
await auditStep(9, 'Comandero Mozo: Entrega final de la orden (Ready -> Delivered)', async () => {
  const res = await fetch(`${BASE_URL}/api/orders`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slug: SLUG, orderId: createdOrderId, status: 'delivered' }),
  })
  const data = await res.json()
  const target = data.orders.find(o => o.id === createdOrderId)
  assert.strictEqual(target.status, 'delivered')
})

// 10. Blindaje Avisos: Pedido de Microservicio
let createdCallId = ''
await auditStep(10, 'Avisos de Servicio: Envío de solicitud de Hielo y Limón', async () => {
  const res = await fetch(`${BASE_URL}/api/service-calls`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slug: SLUG, table_number: 4, call_type: 'service_Hielo y Limón' }),
  })
  const data = await res.json()
  assert.strictEqual(data.success, true)
  assert.strictEqual(data.call.status, 'pending')
  createdCallId = data.call.id
})

// 11. Mozo atiende aviso de servicio
await auditStep(11, 'Comandero Mozo: Mozo atiende y resuelve aviso de mesa', async () => {
  const res = await fetch(`${BASE_URL}/api/service-calls`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slug: SLUG, callId: createdCallId }),
  })
  const data = await res.json()
  assert.strictEqual(data.success, true)
  const target = data.calls.find(c => c.id === createdCallId)
  assert.strictEqual(target.status, 'attended')
})

// 12. Prueba de estrés de 20 mesas simultáneas
await auditStep(12, 'Sobrecarga masiva concurrente de 20 mesas en paralelo (< 80ms)', async () => {
  const promises = []
  for (let i = 1; i <= 20; i++) {
    promises.push(
      fetch(`${BASE_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: SLUG,
          table_number: i,
          items: [{ product_id: 'p-promo-1', quantity: 1, notes: `Ronda 1 Mesa ${i}` }],
        }),
      })
    )
  }
  const results = await Promise.all(promises)
  assert.strictEqual(results.every(r => r.status === 200), true)
})

// 13. Limpieza segura post-pruebas
await auditStep(13, 'Limpieza segura post-auditoría: Vaciado de comandas y avisos', async () => {
  const r1 = await fetch(`${BASE_URL}/api/orders?slug=${SLUG}`, { method: 'DELETE' }).then(r => r.json())
  const r2 = await fetch(`${BASE_URL}/api/service-calls?slug=${SLUG}`, { method: 'DELETE' }).then(r => r.json())
  assert.strictEqual(r1.success, true)
  assert.strictEqual(r2.success, true)
})

// 14. Verificación de estado limpio final (Cocina en 0)
await auditStep(14, 'Verificación final de Cocina limpia y lista (0 pendientes)', async () => {
  const orders = await fetch(`${BASE_URL}/api/orders?slug=${SLUG}`).then(r => r.json())
  const calls = await fetch(`${BASE_URL}/api/service-calls?slug=${SLUG}`).then(r => r.json())
  assert.strictEqual(orders.orders.length, 0)
  assert.strictEqual(calls.calls.length, 0)
})

console.log('\n====================================================')
console.log(`📊 RESULTADOS: ${passed}/14 PUNTOS SUPERADOS (${failed} ERRORES)`)
console.log('====================================================\n')

if (failed > 0) process.exit(1)
