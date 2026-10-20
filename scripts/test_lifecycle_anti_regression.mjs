console.log('================================================================================')
console.log(' 🛡️ FLUXO — CERTIFICACIÓN DE NO-REGRESIÓN DEL CICLO DE VIDA (3 PUNTOS CLAVE) ')
console.log('================================================================================\n')

let passed = 0
let failed = 0

function assert(condition, testNum, desc) {
  if (condition) {
    console.log(`  ✔ [PASS] #${testNum}: ${desc}`)
    passed++
  } else {
    console.error(`  ❌ [FAIL] #${testNum}: ${desc}`)
    failed++
  }
}

async function runTests() {
  const BASE_URL = 'http://localhost:3000'
  const SLUG = 'burger-gourmet'

  // ============================================================================
  // PUNTO 1: COCINA (KDS) & ZERO-FLICKER
  // ============================================================================
  console.log('▶ PUNTO 1: Cocina (KDS) - Zero-Flicker y Preservación de Items en ready_mains')

  let testOrderId = null
  try {
    const createRes = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        restaurant_slug: SLUG,
        table_number: 14,
        items: [
          {
            product_id: 'b0000000-0000-0000-0000-000000000001',
            quantity: 1,
            unit_price: 13.5,
            notes: 'Sin cebolla',
            course: 'second',
          },
          {
            product_id: 'b0000000-0000-0000-0000-000000000003',
            quantity: 1,
            unit_price: 2.5,
            notes: '',
            course: 'drink',
          },
        ],
      }),
    })
    const createData = await createRes.json()
    testOrderId = createData.order?.id
    assert(Boolean(testOrderId), '1.1', 'Comanda creada con éxito para Mesa #14')

    // 1.2 Validar por el mozo (pending_validation -> pending)
    const valRes = await fetch(`${BASE_URL}/api/orders`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-staff-pin': '1234',
        'x-staff-role': 'comandero',
      },
      body: JSON.stringify({
        slug: SLUG,
        orderId: testOrderId,
        status: 'pending',
      }),
    })
    const valData = await valRes.json()
    assert(valData.success === true, '1.2', 'Mozo valida comanda a pending sin errores')

    // 1.3 Cocina inicia preparación (pending -> preparing)
    const prepRes = await fetch(`${BASE_URL}/api/orders`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-staff-pin': '1234',
        'x-staff-role': 'kitchen',
      },
      body: JSON.stringify({
        slug: SLUG,
        orderId: testOrderId,
        action: 'start_cooking',
        status: 'preparing',
      }),
    })
    const prepData = await prepRes.json()
    assert(prepData.success === true, '1.3', 'Cocina inicia preparación exitosamente')

    // 1.4 Cocina marca principales listos (action: ready_mains)
    const readyMainsRes = await fetch(`${BASE_URL}/api/orders`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-staff-pin': '1234',
        'x-staff-role': 'kitchen',
      },
      body: JSON.stringify({
        slug: SLUG,
        orderId: testOrderId,
        action: 'ready_mains',
      }),
    })
    const readyMainsData = await readyMainsRes.json()
    assert(readyMainsData.success === true, '1.4', 'ready_mains responde éxito')
    assert(
      readyMainsData.order?.order_items && readyMainsData.order.order_items.length > 0,
      '1.5',
      'ready_mains preserva todos los items y notas sin vaciarlos'
    )

    // 1.6 Verificar en endpoint de comandas que no se vaciaron los items
    const ordersRes = await fetch(`${BASE_URL}/api/orders?slug=${SLUG}&table_number=14`)
    const ordersData = await ordersRes.json()
    const found = (ordersData.orders || []).find(o => o.id === testOrderId)
    assert(Boolean(found), '1.6', 'Comanda recuperada correctamente de /api/orders')
    assert(found.order_items && found.order_items.length >= 2, '1.7', 'order_items hidratados y conservados en servidor')
  } catch (err) {
    console.error('Error en pruebas de cocina:', err)
    failed++
  }

  // ============================================================================
  // PUNTO 2: COMANDERO (MOZO) & INVARIANTE MONOTÓNICO
  // ============================================================================
  console.log('\n▶ PUNTO 2: Comandero (Mozo) - Jerarquía Monotónica y Prevención de Regresión a Validar')

  try {
    // 2.1 Mozo entrega platos principales (action: deliver_mains)
    const delivRes = await fetch(`${BASE_URL}/api/orders`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-staff-pin': '1234',
        'x-staff-role': 'comandero',
      },
      body: JSON.stringify({
        slug: SLUG,
        orderId: testOrderId,
        action: 'deliver_mains',
      }),
    })
    const delivData = await delivRes.json()
    assert(delivData.success === true, '2.1', 'deliver_mains marca orden entregada correctamente')

    // 2.2 Invariante anti-regresión: comprobar que tras entrega, el estado es delivered
    const checkDelivRes = await fetch(`${BASE_URL}/api/orders?slug=${SLUG}&table_number=14`)
    const checkDelivData = await checkDelivRes.json()
    const checkFound = (checkDelivData.orders || []).find(o => o.id === testOrderId)
    assert(checkFound?.status === 'delivered', '2.2', 'Estado permanece estrictamente en delivered')

    // 2.3 Formato limpio de aviso al mozo (waiter_attention)
    const callRes = await fetch(`${BASE_URL}/api/service-calls`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug: SLUG,
        table_number: 14,
        call_type: 'waiter_attention',
      }),
    })
    const callData = await callRes.json()
    assert(callData.success === true, '2.3', 'Registra llamada al mozo waiter_attention')
    assert(callData.call?.call_type === 'waiter_attention', '2.4', 'call_type es exactamente waiter_attention')

    // 2.5 Atender aviso
    if (callData.call?.id) {
      const attendRes = await fetch(`${BASE_URL}/api/service-calls`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-staff-pin': '1234',
          'x-staff-role': 'comandero',
        },
        body: JSON.stringify({
          slug: SLUG,
          callId: callData.call.id,
        }),
      })
      const attendData = await attendRes.json()
      assert(attendData.success === true, '2.5', 'Llamada al mozo atendida correctamente')
    }
  } catch (err) {
    console.error('Error en pruebas de comandero:', err)
    failed++
  }

  // ============================================================================
  // PUNTO 3: MENÚ DEL CLIENTE & LIMPIEZA DE MESA LIBERADA
  // ============================================================================
  console.log('\n▶ PUNTO 3: Menú del Cliente - Liberación Limpia de Mesa y Estado de Cobro')

  try {
    // 3.1 Pagar orden de la mesa 14
    const payRes = await fetch(`${BASE_URL}/api/orders`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-staff-pin': '1234',
        'x-staff-role': 'comandero',
      },
      body: JSON.stringify({
        slug: SLUG,
        orderId: testOrderId,
        status: 'paid',
      }),
    })
    const payData = await payRes.json()
    assert(payData.success === true, '3.1', 'Orden de la mesa marcada como paid')

    // 3.2 Liberar mesa 14
    const freeTableRes = await fetch(`${BASE_URL}/api/tables`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-staff-pin': '1234',
        'x-staff-role': 'comandero',
      },
      body: JSON.stringify({
        slug: SLUG,
        action: 'free',
        table_number: 14,
      }),
    })
    const freeTableData = await freeTableRes.json()
    assert(freeTableData.success === true, '3.2', 'Mesa #14 liberada con éxito vía /api/tables action: free')

    // 3.3 Consultar estado de sesiones: verificar que la mesa 14 está libre
    const sessionsRes = await fetch(`${BASE_URL}/api/tables?slug=${SLUG}`)
    const sessionsData = await sessionsRes.json()
    const table14Session = sessionsData.sessions?.['14'] || sessionsData.sessions?.[14]
    assert(
      !table14Session || table14Session.status === 'free' || table14Session.status === 'closed',
      '3.3',
      'Sesión de Mesa #14 confirmada como free o inexistente'
    )
  } catch (err) {
    console.error('Error en pruebas de menú de cliente:', err)
    failed++
  }

  console.log('\n================================================================================')
  console.log(` RESULTADOS: ${passed}/${passed + failed} PRUEBAS SUPERADAS (${failed === 0 ? '100% PASS' : 'CON FALLOS'})`)
  console.log('================================================================================\n')

  if (failed > 0) {
    process.exit(1)
  }
}

runTests().catch(e => {
  console.error('Fallo no capturado:', e)
  process.exit(1)
})
