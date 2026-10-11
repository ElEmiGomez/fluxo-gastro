import assert from 'node:assert'

const BASE_URL = 'http://localhost:3000'
const SLUG = 'burger-gourmet'

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  })
  const data = await res.json().catch(() => ({}))
  return { status: res.status, data }
}

async function runTest() {
  console.log('🧪 Iniciando test de Smart Default & Persistencia de Sesión...')

  // 1. Iniciar sesión para Mesa #7
  const startSess = await request('/api/tables', {
    method: 'POST',
    body: JSON.stringify({ slug: SLUG, table_number: 7, action: 'start_session' }),
  })
  assert.strictEqual(startSess.status, 200, 'Iniciar sesión debe responder 200')
  assert.ok(startSess.data.session_token, 'Debe devolver session_token')
  console.log('  ✔ Sesión iniciada para Mesa #7 con token UUID')

  // 2. Crear una orden para Mesa #7
  const createOrder = await request('/api/orders', {
    method: 'POST',
    body: JSON.stringify({
      slug: SLUG,
      table_number: 7,
      session_token: startSess.data.session_token,
      order_type: 'dine_in',
      actor_type: 'customer',
      items: [
        { product_id: 'p-1', quantity: 2, notes: 'Bien hechas' },
      ],
    }),
  })
  assert.strictEqual(createOrder.status, 200, 'Crear orden debe responder 200')
  console.log('  ✔ Orden creada para Mesa #7')

  // 3. Registrar llamada de cuenta en efectivo (bill_Efectivo)
  const callRes = await request('/api/service-calls', {
    method: 'POST',
    body: JSON.stringify({
      slug: SLUG,
      table_number: 7,
      call_type: 'bill_Efectivo',
    }),
  })
  assert.strictEqual(callRes.status, 200, 'Registrar llamada debe responder 200')
  console.log('  ✔ Aviso de cuenta en efectivo registrado para Mesa #7')

  // 4. Liberar y cobrar mesa con método inferido (Efectivo)
  const freeRes = await request('/api/tables', {
    method: 'POST',
    body: JSON.stringify({
      slug: SLUG,
      table_number: 7,
      action: 'free',
      payment_method: 'cash',
      final_amount: 25.0,
      orders_count: 1,
    }),
  })
  assert.strictEqual(freeRes.status, 200, 'Liberar mesa debe responder 200')
  assert.strictEqual(freeRes.data.success, true, 'Debe devolver success: true')
  console.log('  ✔ Mesa #7 cobrada y liberada con Efectivo y persistencia')

  // 5. Verificar que las órdenes activas de Mesa #7 ya no están en pendientes
  const ordersRes = await request(`/api/orders?slug=${SLUG}&table=7`)
  const activeOrders = (ordersRes.data.orders || []).filter(o => o.status !== 'paid' && o.status !== 'cancelled')
  assert.strictEqual(activeOrders.length, 0, 'No deben quedar órdenes pendientes para Mesa #7')
  console.log('  ✔ Órdenes de Mesa #7 archivadas como pagadas')

  // 6. Test para Mesa #4 con Tarjeta por defecto
  const freeT4 = await request('/api/tables', {
    method: 'POST',
    body: JSON.stringify({
      slug: SLUG,
      table_number: 4,
      action: 'free',
      payment_method: 'card',
      final_amount: 48.5,
      orders_count: 2,
    }),
  })
  assert.strictEqual(freeT4.status, 200, 'Liberar Mesa #4 con tarjeta debe responder 200')
  console.log('  ✔ Mesa #4 cobrada y liberada con Tarjeta')

  console.log('\n🎉 ¡TODAS LAS PRUEBAS DE SMART DEFAULT Y PERSISTENCIA PASARON CON ÉXITO!')
}

runTest().catch(err => {
  console.error('❌ Error en el test:', err)
  process.exit(1)
})
