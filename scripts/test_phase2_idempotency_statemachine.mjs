// ==============================================================================
// GASTRO PWA - TEST SUITE DE IDEMPOTENCIA Y MÁQUINA DE ESTADOS FORMAL
// ==============================================================================

const BASE_URL = 'http://localhost:3000'

async function runPhase2Tests() {
  console.log('🚀 INICIANDO CERTIFICACIÓN: IDEMPOTENCIA Y MÁQUINA DE ESTADOS...\n')
  let passed = 0
  let failed = 0

  function assert(condition, name, details = '') {
    if (condition) {
      console.log(`  ✅ [PASS] ${name}`)
      passed++
    } else {
      console.error(`  ❌ [FAIL] ${name} ${details}`)
      failed++
    }
  }

  try {
    // 1. Obtener sesión de mesa
    const startRes = await fetch(`${BASE_URL}/api/tables`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: 'burger-gourmet', table_number: 16, action: 'start_session' }),
    })
    const startData = await startRes.json()
    const sessionToken = startData.session_token

    // -------------------------------------------------------------------------
    // TEST 1 & 2: IDEMPOTENCIA
    // -------------------------------------------------------------------------
    console.log('1️⃣  Enviando pedido con Idempotency Key única...')
    const idempotencyKey = `test-idemp-${Date.now()}`
    
    const orderRes1 = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug: 'burger-gourmet',
        table_number: 16,
        session_token: sessionToken,
        idempotency_key: idempotencyKey,
        items: [{ product_id: 'p-1', quantity: 1 }],
      }),
    })
    const orderData1 = await orderRes1.json()

    assert(orderRes1.status === 200 && orderData1.success, 'Primer envío de comanda aceptado exitosamente')
    const orderId = orderData1.order.id

    console.log('\n2️⃣  Simulando doble clic o reintento de red con la MISMA Idempotency Key...')
    const orderRes2 = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug: 'burger-gourmet',
        table_number: 16,
        session_token: sessionToken,
        idempotency_key: idempotencyKey,
        items: [{ product_id: 'p-1', quantity: 1 }],
      }),
    })
    const orderData2 = await orderRes2.json()

    assert(orderRes2.status === 200, 'Reintento responde HTTP 200')
    assert(orderData2.idempotent === true, 'Respuesta identificada como idempotente (anti-duplicación)')
    assert(orderData2.order.id === orderId, `Devuelve exactamente la comanda existente (#${orderId}) sin duplicar en cocina`)

    // -------------------------------------------------------------------------
    // TEST 3, 4, 5, 6: MÁQUINA DE ESTADOS FORMAL
    // -------------------------------------------------------------------------
    console.log('\n3️⃣  Transición válida: PENDING -> PREPARING...')
    const patch1 = await fetch(`${BASE_URL}/api/orders`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: 'burger-gourmet', orderId, status: 'preparing' }),
    })
    const patchData1 = await patch1.json()
    assert(patch1.status === 200 && patchData1.success, 'Transición PENDING -> PREPARING exitosa')

    console.log('\n4️⃣  Transición válida: PREPARING -> READY...')
    const patch2 = await fetch(`${BASE_URL}/api/orders`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: 'burger-gourmet', orderId, status: 'ready' }),
    })
    const patchData2 = await patch2.json()
    assert(patch2.status === 200 && patchData2.success, 'Transición PREPARING -> READY exitosa')

    console.log('\n5️⃣  Transición válida: READY -> DELIVERED...')
    const patch3 = await fetch(`${BASE_URL}/api/orders`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: 'burger-gourmet', orderId, status: 'delivered' }),
    })
    const patchData3 = await patch3.json()
    assert(patch3.status === 200 && patchData3.success, 'Transición READY -> DELIVERED exitosa')

    console.log('\n6️⃣  Transición INVÁLIDA: DELIVERED -> PREPARING (Debe ser rechazada)...')
    const invalidPatch1 = await fetch(`${BASE_URL}/api/orders`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: 'burger-gourmet', orderId, status: 'preparing' }),
    })
    const invalidData1 = await invalidPatch1.json()

    assert(invalidPatch1.status === 400, 'Rechazo HTTP 400 en transición inválida DELIVERED -> PREPARING')
    assert(invalidData1.error && invalidData1.error.includes('Transición inválida'), `Mensaje descriptivo retornado: "${invalidData1.error}"`)

    console.log('\n7️⃣  Transición INVÁLIDA: DELIVERED -> PENDING (Debe ser rechazada)...')
    const invalidPatch2 = await fetch(`${BASE_URL}/api/orders`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: 'burger-gourmet', orderId, status: 'pending' }),
    })
    const invalidData2 = await invalidPatch2.json()

    assert(invalidPatch2.status === 400, 'Rechazo HTTP 400 en transición inválida DELIVERED -> PENDING')

    console.log(`\n=========================================`)
    console.log(`RESULTADO DE LA CERTIFICACIÓN:`)
    console.log(`Total pruebas: ${passed + failed}`)
    console.log(`Pasadas:       ${passed}`)
    console.log(`Falladas:      ${failed}`)
    console.log(`=========================================`)

    if (failed === 0) {
      console.log('\n🎉 ¡IDEMPOTENCIA Y MÁQUINA DE ESTADOS CERTIFICADAS AL 100%!')
      process.exit(0)
    } else {
      process.exit(1)
    }
  } catch (err) {
    console.error('Error durante la prueba:', err)
    process.exit(1)
  }
}

runPhase2Tests()
