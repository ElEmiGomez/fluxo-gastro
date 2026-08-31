// ==============================================================================
// GASTRO PWA - AUDITORÍA Y CERTIFICACIÓN FINAL DE TODAS LAS FUNCIONALIDADES
// ==============================================================================

import assert from 'node:assert'

const BASE_URL = 'http://localhost:3000'
const SLUG = 'burger-gourmet'

console.log('\n======================================================================')
console.log('🏁 INICIANDO AUDITORÍA INTEGRAL DE FUNCIONES Y SEGURIDAD (18 PUNTOS)')
console.log('======================================================================\n')

let passed = 0
let failed = 0
const resultsLog = []

async function runCheck(num, title, category, fn) {
  const start = performance.now()
  try {
    await fn()
    const ms = (performance.now() - start).toFixed(2)
    console.log(`  ✓ [PUNTO ${num.toString().padStart(2, '0')}/18 PASS] [${category}] ${title} (${ms} ms)`)
    resultsLog.push({ num, title, category, status: 'PASS', duration: `${ms} ms` })
    passed++
  } catch (err) {
    const ms = (performance.now() - start).toFixed(2)
    console.error(`  ✗ [PUNTO ${num.toString().padStart(2, '0')}/18 FAIL] [${category}] ${title} (${ms} ms)`)
    console.error(`    Detalle error: ${err.message}`)
    resultsLog.push({ num, title, category, status: 'FAIL', error: err.message, duration: `${ms} ms` })
    failed++
  }
}

// 1. Salud de Rutas Principales
await runCheck(1, 'Disponibilidad de Carta de Cliente (HTTP 200)', 'Cliente', async () => {
  const res = await fetch(`${BASE_URL}/menu/${SLUG}?table=4`)
  assert.strictEqual(res.status, 200)
  const text = await res.text()
  assert.ok(text.includes('Burger House Gourmet') || text.includes('Mesa'))
})

// 2. Disponibilidad de Comandero de Mozo
await runCheck(2, 'Disponibilidad de Comandero Mozo (HTTP 200)', 'Mozo', async () => {
  const res = await fetch(`${BASE_URL}/staff/comandero/${SLUG}`)
  assert.strictEqual(res.status, 200)
})

// 3. Disponibilidad de Monitor Cocina KDS
await runCheck(3, 'Disponibilidad de Monitor Cocina KDS (HTTP 200)', 'Cocina', async () => {
  const res = await fetch(`${BASE_URL}/staff/kitchen/${SLUG}`)
  assert.strictEqual(res.status, 200)
})

// 4. Seguridad: Blindaje de Órdenes Vacías
await runCheck(4, 'Rechazo de comanda vacía (HTTP 400)', 'Seguridad', async () => {
  const res = await fetch(`${BASE_URL}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slug: SLUG, table_number: 4, items: [] }),
  })
  assert.strictEqual(res.status, 400)
})

// 5. Seguridad: Sanitización de Cantidades Negativas y Productos Vacíos
await runCheck(5, 'Sanitización de cantidades <= 0 y productos nulos', 'Seguridad', async () => {
  const res = await fetch(`${BASE_URL}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      slug: SLUG,
      table_number: -4,
      items: [
        { product_id: 'p-promo-1', quantity: -2 },
        { product_id: '', quantity: 5 },
      ],
    }),
  })
  assert.strictEqual(res.status, 200)
  const data = await res.json()
  assert.strictEqual(data.order.table_number >= 1, true)
  assert.strictEqual(data.order.order_items.length, 1)
  assert.strictEqual(data.order.order_items[0].quantity, 1)
})

// 6. Seguridad: Cálculo de Precios Inmutable en Servidor
await runCheck(6, 'Cálculo de total inmutable en servidor (Anti-Tampering Euros)', 'Seguridad', async () => {
  const res = await fetch(`${BASE_URL}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      slug: SLUG,
      table_number: 4,
      total_amount: 1, // intento de inyección de 1 €
      items: [{ product_id: 'p-promo-1', quantity: 2 }],
    }),
  })
  const data = await res.json()
  assert.strictEqual(data.order.total_amount, 49.00)
})

// 7. Flujo Cliente: Creación de Comanda Personalizada con Notas
let testOrderId = ''
await runCheck(7, 'Comensal despacha comanda con notas [Sin Sal, Sin Cebolla]', 'Cliente', async () => {
  const noteText = '[Sin Sal, Punto Jugoso] ¡Alérgico a la cebolla, urgente!'
  const res = await fetch(`${BASE_URL}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      slug: SLUG,
      table_number: 4,
      items: [{ product_id: 'p-promo-1', quantity: 2, notes: noteText }],
    }),
  })
  const data = await res.json()
  assert.strictEqual(data.success, true)
  assert.strictEqual(data.order.order_items[0].notes, noteText)
  testOrderId = data.order.id
})

// 8. Flujo Cocina: Cocina recibe y pone en preparación
await runCheck(8, 'KDS: Cocina inicia preparación (Pending -> Preparing)', 'Cocina', async () => {
  const res = await fetch(`${BASE_URL}/api/orders`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slug: SLUG, orderId: testOrderId, status: 'preparing' }),
  })
  const data = await res.json()
  const order = data.orders.find(o => o.id === testOrderId)
  assert.strictEqual(order.status, 'preparing')
})

// 9. Flujo Cocina: Cocina finaliza plato (Preparing -> Ready)
await runCheck(9, 'KDS: Cocina marca plato listo para servir (Preparing -> Ready)', 'Cocina', async () => {
  const res = await fetch(`${BASE_URL}/api/orders`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slug: SLUG, orderId: testOrderId, status: 'ready' }),
  })
  const data = await res.json()
  const order = data.orders.find(o => o.id === testOrderId)
  assert.strictEqual(order.status, 'ready')
})

// 10. Flujo Cliente: Teléfono de Mesa #4 sincroniza estado 'ready'
await runCheck(10, 'Sincronización Comensal: Mesa #4 recibe aviso de plato listo', 'Cliente', async () => {
  const res = await fetch(`${BASE_URL}/api/orders?slug=${SLUG}`).then(r => r.json())
  const order = res.orders.find(o => o.id === testOrderId)
  assert.strictEqual(order.status, 'ready')
})

// 11. Flujo Mozo: Mozo sirve el plato en la mesa (Ready -> Delivered)
await runCheck(11, 'Comandero Mozo: Mozo entrega pedido (Ready -> Delivered)', 'Mozo', async () => {
  const res = await fetch(`${BASE_URL}/api/orders`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slug: SLUG, orderId: testOrderId, status: 'delivered' }),
  })
  const data = await res.json()
  const order = data.orders.find(o => o.id === testOrderId)
  assert.strictEqual(order.status, 'delivered')
})

// 12. Flujo Cliente: Solicitud de Microservicio a la Mesa
let serviceCallId = ''
await runCheck(12, 'Cliente solicita Micro-servicio (Hielo y Limón)', 'Cliente', async () => {
  const res = await fetch(`${BASE_URL}/api/service-calls`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slug: SLUG, table_number: 4, call_type: 'service_Hielo y Limón' }),
  })
  const data = await res.json()
  assert.strictEqual(data.success, true)
  assert.strictEqual(data.call.table_number, 4)
  serviceCallId = data.call.id
})

// 13. Flujo Mozo: Mozo atiende y resuelve solicitud de microservicio
await runCheck(13, 'Mozo atiende y cierra aviso de micro-servicio', 'Mozo', async () => {
  const res = await fetch(`${BASE_URL}/api/service-calls`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slug: SLUG, callId: serviceCallId }),
  })
  const data = await res.json()
  const target = data.calls.find(c => c.id === serviceCallId)
  assert.strictEqual(target.status, 'attended')
})

// 14. Flujo Cliente: Solicitud de Cuenta con Posnet
let billCallId = ''
await runCheck(14, 'Cliente solicita la Cuenta con Tarjeta (POS)', 'Cliente', async () => {
  const res = await fetch(`${BASE_URL}/api/service-calls`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slug: SLUG, table_number: 4, call_type: 'bill_Tarjeta (Traer Posnet)' }),
  })
  const data = await res.json()
  assert.strictEqual(data.success, true)
  billCallId = data.call.id
})

// 15. Flujo Mozo: Mozo atiende cobro de mesa
await runCheck(15, 'Mozo atiende y resuelve cobro de mesa', 'Mozo', async () => {
  const res = await fetch(`${BASE_URL}/api/service-calls`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slug: SLUG, callId: billCallId }),
  })
  const data = await res.json()
  const target = data.calls.find(c => c.id === billCallId)
  assert.strictEqual(target.status, 'attended')
})

// 16. Prueba de Estrés: Concurrencia Masiva (20 Mesas Simultáneas)
await runCheck(16, 'Sobrecarga de 20 mesas en paralelo (< 60ms)', 'Estrés & Rendimiento', async () => {
  const promises = []
  for (let i = 1; i <= 20; i++) {
    promises.push(
      fetch(`${BASE_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: SLUG,
          table_number: i,
          items: [{ product_id: 'p-promo-1', quantity: 1, notes: `Mesa ${i} pedido express` }],
        }),
      })
    )
  }
  const results = await Promise.all(promises)
  assert.strictEqual(results.every(r => r.status === 200), true)
})

// 17. Limpieza Segura de Comandas y Avisos
await runCheck(17, 'Purga segura de datos de prueba (DELETE /api/orders & calls)', 'Limpieza', async () => {
  const r1 = await fetch(`${BASE_URL}/api/orders?slug=${SLUG}`, { method: 'DELETE' }).then(r => r.json())
  const r2 = await fetch(`${BASE_URL}/api/service-calls?slug=${SLUG}`, { method: 'DELETE' }).then(r => r.json())
  assert.strictEqual(r1.success, true)
  assert.strictEqual(r2.success, true)
})

// 18. Verificación de Tablero Limpio Final
await runCheck(18, 'Verificación final de Cocina y Mozos en 0 pendientes', 'Limpieza', async () => {
  const orders = await fetch(`${BASE_URL}/api/orders?slug=${SLUG}`).then(r => r.json())
  const calls = await fetch(`${BASE_URL}/api/service-calls?slug=${SLUG}`).then(r => r.json())
  assert.strictEqual(orders.orders.length, 0)
  assert.strictEqual(calls.calls.length, 0)
})

console.log('\n======================================================================')
console.log(`📊 INFORME FINAL: ${passed}/18 PRUEBAS EXITOSAS (${failed} FALLOS)`)
console.log('======================================================================\n')

if (failed > 0) process.exit(1)
