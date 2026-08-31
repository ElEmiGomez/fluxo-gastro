// ==============================================================================
// GASTRO PWA - TEST SUITE DE CERTIFICACIÓN B2B FASE 1
// ==============================================================================

const BASE_URL = 'http://localhost:3000'

async function runB2BPhase1Tests() {
  console.log('🚀 INICIANDO CERTIFICACIÓN B2B FASE 1: SUPABASE, SESIONES UUID Y RLS...\n')
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
    // -------------------------------------------------------------------------
    // TEST 1: Iniciar Sesión de Mesa con UUID único (Item 2)
    // -------------------------------------------------------------------------
    console.log('1️⃣  Iniciando Sesión de Mesa con UUID único (Item #2)...')
    const startRes = await fetch(`${BASE_URL}/api/tables`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug: 'burger-gourmet',
        table_number: 14,
        action: 'start_session',
      }),
    })
    const startData = await startRes.json()

    assert(startRes.status === 200 && startData.success, 'Endpoint /api/tables (start_session) responde 200')
    assert(Boolean(startData.session_token), `Token UUID generado: ${startData.session_token}`)
    const sessionToken = startData.session_token

    // -------------------------------------------------------------------------
    // TEST 2: Enviar Comanda con Token UUID Válido (Item 1 & 2)
    // -------------------------------------------------------------------------
    console.log('\n2️⃣  Enviando Comanda con Token de Sesión Válido (Item #1 & #2)...')
    const orderRes = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug: 'burger-gourmet',
        table_number: 14,
        session_token: sessionToken,
        items: [
          { product_id: 'p-1', quantity: 2, notes: 'Sin cebolla' },
        ],
      }),
    })
    const orderData = await orderRes.json()

    assert(orderRes.status === 200 && orderData.success, 'Comanda aceptada con token de sesión válido')
    assert(orderData.order?.order_items?.length === 1, 'Items de orden persistidos correctamente')

    // -------------------------------------------------------------------------
    // TEST 3: Rechazar Comanda con Token Inválido o Falso (Item 2)
    // -------------------------------------------------------------------------
    console.log('\n3️⃣  Intentando Comanda con Token Forjado/Falso (Item #2)...')
    const fakeTokenRes = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug: 'burger-gourmet',
        table_number: 14,
        session_token: 'fake-uuid-token-12345',
        items: [
          { product_id: 'p-1', quantity: 1 },
        ],
      }),
    })
    const fakeTokenData = await fakeTokenRes.json()

    assert(fakeTokenRes.status === 403, 'Rechazo HTTP 403 para token de sesión forjado')
    assert(fakeTokenData.error === 'SESSION_EXPIRED', 'Código de error SESSION_EXPIRED retornado')

    // -------------------------------------------------------------------------
    // TEST 4: Liberar Mesa e Invalidar UUID en Base de Datos (Item 2)
    // -------------------------------------------------------------------------
    console.log('\n4️⃣  Liberando Mesa e Invalidando Token UUID (Item #2)...')
    const freeRes = await fetch(`${BASE_URL}/api/tables`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug: 'burger-gourmet',
        table_number: 14,
        action: 'free',
      }),
    })
    const freeData = await freeRes.json()

    assert(freeRes.status === 200 && freeData.success, 'Mesa liberada e invalidada correctamente')

    // -------------------------------------------------------------------------
    // TEST 5: Bloquear Pedidos Residuales con el Token Expirado (Item 2)
    // -------------------------------------------------------------------------
    console.log('\n5️⃣  Verificando que el Token Anterior queda Expirado (Anti-Solapamiento)...')
    const staleOrderRes = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug: 'burger-gourmet',
        table_number: 14,
        session_token: sessionToken, // Token anterior que ya fue liberado
        items: [
          { product_id: 'p-1', quantity: 1 },
        ],
      }),
    })
    const staleOrderData = await staleOrderRes.json()

    assert(staleOrderRes.status === 403, 'Rechazo HTTP 403 bloquea pedido residual con token revocado')
    assert(staleOrderData.error === 'SESSION_EXPIRED', 'Error SESSION_EXPIRED confirmado')

    // -------------------------------------------------------------------------
    // TEST 6: Creación y Gestión de Llamadas de Servicio
    // -------------------------------------------------------------------------
    console.log('\n6️⃣  Llamadas de Servicio B2B...')
    const callRes = await fetch(`${BASE_URL}/api/service-calls`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug: 'burger-gourmet',
        table_number: 14,
        call_type: 'bill_card',
      }),
    })
    const callData = await callRes.json()

    assert(callRes.status === 200 && callData.success, 'Llamada de servicio creada exitosamente')

    // -------------------------------------------------------------------------
    // TEST 7: Máquina de Estados de Comandas
    // -------------------------------------------------------------------------
    console.log('\n7️⃣  Actualización de Estado de Comanda (pending -> preparing)...')
    // Crear comanda activa para prueba de transición
    const startRes7 = await fetch(`${BASE_URL}/api/tables`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: 'burger-gourmet', table_number: 17, action: 'start_session' }),
    })
    const startData7 = await startRes7.json()
    const orderRes7 = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug: 'burger-gourmet',
        table_number: 17,
        session_token: startData7.session_token,
        items: [{ product_id: 'p-2', quantity: 1 }],
      }),
    })
    const orderData7 = await orderRes7.json()

    const patchRes = await fetch(`${BASE_URL}/api/orders`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug: 'burger-gourmet',
        orderId: orderData7.order.id,
        status: 'preparing',
      }),
    })
    const patchData = await patchRes.json()

    assert(patchRes.status === 200 && patchData.success, 'Transición de estado de comanda exitosa')

    console.log(`\n=========================================`)
    console.log(`RESULTADO DE LA CERTIFICACIÓN B2B FASE 1:`)
    console.log(`Total pruebas: ${passed + failed}`)
    console.log(`Pasadas:       ${passed}`)
    console.log(`Falladas:      ${failed}`)
    console.log(`=========================================`)

    if (failed === 0) {
      console.log('\n🎉 ¡FASE 1 CERTIFICADA AL 100%! SESIONES UUID, REPOSITORIO Y PERSISTENCIA ACTIVOS.')
      process.exit(0)
    } else {
      process.exit(1)
    }
  } catch (err) {
    console.error('Error durante la ejecución del test suite:', err)
    process.exit(1)
  }
}

runB2BPhase1Tests()
