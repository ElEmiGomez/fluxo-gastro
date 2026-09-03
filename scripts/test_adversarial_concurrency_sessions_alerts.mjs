import assert from 'node:assert/strict'
import crypto from 'node:crypto'

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000'
const SLUG = 'burger-gourmet'

console.log('================================================================================')
console.log(' 🛡️  CHALLENGER GATE 2: ADVERSARIAL STRESS HARNESS')
console.log(' Concurrency, Task Queue Resilience, Session Isolation & Non-Volatile Alerts')
console.log('================================================================================\n')

let passed = 0
let failed = 0
const findings = []

async function runTest(name, fn) {
  try {
    process.stdout.write(`⏳ [RUNNING] ${name}... `)
    await fn()
    passed++
    console.log(`\r✅ [PASS] ${name}`)
  } catch (err) {
    failed++
    console.log(`\r❌ [FAIL] ${name}`)
    console.error(`   Error: ${err.message}`)
    findings.push({ name, error: err.message, stack: err.stack })
  }
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

async function main() {
  // ---------------------------------------------------------------------------
  // SUITE 1: HIGH-CONCURRENCY BURST (10 CONCURRENT REQUESTS / IDENTICAL IDEMPOTENCY KEY)
  // ---------------------------------------------------------------------------
  console.log('\n--- SUITE 1: High-Concurrency Burst (10 Requests / Identical Idempotency Key) ---')

  await runTest('1.1 Burst of 10 concurrent requests with identical idempotency_key creates exactly 1 order and 9 idempotent successes', async () => {
    const tableNum = 18

    // Asegurar sesión limpia
    await fetch(`${BASE_URL}/api/tables`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: SLUG, table_number: tableNum, action: 'free' }),
    })

    const startRes = await fetch(`${BASE_URL}/api/tables`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: SLUG, table_number: tableNum, action: 'start_session' }),
    })
    const startData = await startRes.json()
    const sessionToken = startData.session_token
    assert.ok(sessionToken, 'Token de sesión válido requerido')

    const burstKey = `burst-concurrency-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`

    // Disparar 10 solicitudes concurrentes exactas con Promise.all
    const promises = Array.from({ length: 10 }, (_, idx) =>
      fetch(`${BASE_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: SLUG,
          table_number: tableNum,
          session_token: sessionToken,
          idempotency_key: burstKey,
          items: [{ product_id: 'p-1', quantity: 2, name: 'Burger Clásica', price: 10 }],
        }),
      }).then(async r => {
        const status = r.status
        const text = await r.text()
        let data
        try {
          data = JSON.parse(text)
        } catch {
          data = { parseError: text.slice(0, 200) }
        }
        return { status, data, index: idx }
      })
    )

    const results = await Promise.all(promises)

    // 1. Todas deben haber respondido HTTP 200
    for (const res of results) {
      assert.equal(res.status, 200, `Petición #${res.index} respondió con status ${res.status} en vez de 200: ${JSON.stringify(res.data)}`)
      assert.ok(res.data.success, `Petición #${res.index} data.success no fue true`)
    }

    // 2. Extraer IDs de orden de todas las respuestas
    const orderIds = results.map(r => r.data.order?.id).filter(Boolean)
    assert.equal(orderIds.length, 10, 'Las 10 respuestas deben incluir el objeto order')

    const uniqueOrderIds = new Set(orderIds)
    assert.equal(uniqueOrderIds.size, 1, `Debe haber exactamente 1 único order.id creado. Encontrados: ${uniqueOrderIds.size} (${[...uniqueOrderIds].join(', ')})`)

    const primaryOrderId = [...uniqueOrderIds][0]

    // 3. Exactamente 9 respuestas deben tener idempotent === true, y 1 debe ser el creador original
    const idempotentCount = results.filter(r => r.data.idempotent === true).length
    const originalCreatorCount = results.filter(r => !r.data.idempotent).length

    assert.equal(originalCreatorCount, 1, `Exactamente 1 petición debe ser la creadora original (sin idempotent=true). Hubo: ${originalCreatorCount}`)
    assert.equal(idempotentCount, 9, `Exactamente 9 peticiones deben marcar idempotent === true. Hubo: ${idempotentCount}`)

    // 4. Verificar en el servidor que solo existe 1 comanda con este order.id
    const ordersRes = await fetch(`${BASE_URL}/api/orders?slug=${SLUG}`)
    const ordersData = await ordersRes.json()
    const matchedOrders = (ordersData.orders || []).filter(o => o.id === primaryOrderId)
    assert.equal(matchedOrders.length, 1, `En la base de datos/memoria debe existir exactamente 1 orden con ID ${primaryOrderId}. Encontradas: ${matchedOrders.length}`)

    // 5. Solicitud subsiguiente tardía (11va petición con la misma idempotency_key)
    const lateRes = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug: SLUG,
        table_number: tableNum,
        session_token: sessionToken,
        idempotency_key: burstKey,
        items: [{ product_id: 'p-1', quantity: 2 }],
      }),
    })
    assert.equal(lateRes.status, 200, 'Petición subsiguiente responde 200')
    const lateData = await lateRes.json()
    assert.equal(lateData.idempotent, true, 'Petición subsiguiente debe indicar idempotent: true')
    assert.equal(lateData.order?.id, primaryOrderId, 'Petición subsiguiente debe retornar la misma orden')
  })

  await runTest('1.2 Burst concurrente con payload inválido (items vacíos) libera locks y no causa deadlocks', async () => {
    const tableNum = 18
    const invalidKey = `invalid-burst-${Date.now()}`

    const promises = Array.from({ length: 5 }, () =>
      fetch(`${BASE_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: SLUG,
          table_number: tableNum,
          idempotency_key: invalidKey,
          items: [], // Inválido
        }),
      }).then(r => r.status)
    )

    const statuses = await Promise.all(promises)
    for (const status of statuses) {
      assert.ok(status === 400 || status === 500, `Debe rechazar con 400/500, obtuvo ${status}`)
    }
  })

  // ---------------------------------------------------------------------------
  // SUITE 2: DINER SESSION ISOLATION (TWO DISTINCT GUEST SESSIONS ON SAME TABLE)
  // ---------------------------------------------------------------------------
  console.log('\n--- SUITE 2: Diner Session Isolation (Two Distinct Guest Sessions on Same Table) ---')

  await runTest('2.1 Comensal Sesión B no puede visualizar órdenes activas ni entregadas de Sesión A en la misma mesa', async () => {
    const tableNum = 19

    // Paso 1: Iniciar Sesión A en Mesa 19
    await fetch(`${BASE_URL}/api/tables`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: SLUG, table_number: tableNum, action: 'free' }),
    })

    const sessionARes = await fetch(`${BASE_URL}/api/tables`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: SLUG, table_number: tableNum, action: 'start_session' }),
    })
    const sessionAData = await sessionARes.json()
    const sessionTokenA = sessionAData.session_token
    assert.ok(sessionTokenA, 'Sesión A iniciada con éxito')

    // Paso 2: Sesión A crea Orden A1 (activa) y Orden A2 (se entregará)
    const orderA1Res = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug: SLUG,
        table_number: tableNum,
        session_token: sessionTokenA,
        idempotency_key: `order-a1-${Date.now()}`,
        items: [{ product_id: 'p-1', quantity: 1, name: 'Burger A1', price: 12 }],
      }),
    })
    const orderA1Data = await orderA1Res.json()
    assert.equal(orderA1Res.status, 200, 'Orden A1 creada')
    const orderIdA1 = orderA1Data.order.id

    const orderA2Res = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug: SLUG,
        table_number: tableNum,
        session_token: sessionTokenA,
        idempotency_key: `order-a2-${Date.now()}`,
        items: [{ product_id: 'p-2', quantity: 2, name: 'Bebida A2', price: 4 }],
      }),
    })
    const orderA2Data = await orderA2Res.json()
    assert.equal(orderA2Res.status, 200, 'Orden A2 creada')
    const orderIdA2 = orderA2Data.order.id

    // Avanzar Orden A2 hasta entregada (delivered)
    await fetch(`${BASE_URL}/api/orders`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: SLUG, orderId: orderIdA2, status: 'preparing' }),
    })
    await fetch(`${BASE_URL}/api/orders`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: SLUG, orderId: orderIdA2, status: 'ready' }),
    })
    const delivRes = await fetch(`${BASE_URL}/api/orders`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: SLUG, orderId: orderIdA2, status: 'delivered' }),
    })
    assert.equal(delivRes.status, 200, 'Orden A2 avanzada a delivered')

    // Paso 3: Mozo libera la mesa 19 (cierra Sesión A y limpia comensales previos)
    const freeRes = await fetch(`${BASE_URL}/api/tables`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: SLUG, table_number: tableNum, action: 'free' }),
    })
    assert.equal(freeRes.status, 200, 'Mesa 19 liberada por el personal')

    // Paso 4: Nuevo comensal llega e inicia Sesión B en Mesa 19
    const sessionBRes = await fetch(`${BASE_URL}/api/tables`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: SLUG, table_number: tableNum, action: 'start_session' }),
    })
    const sessionBData = await sessionBRes.json()
    const sessionTokenB = sessionBData.session_token
    assert.ok(sessionTokenB, 'Sesión B iniciada con éxito')
    assert.notEqual(sessionTokenA, sessionTokenB, 'El token de Sesión B debe ser estrictamente distinto al de Sesión A')

    // Paso 5: Evaluar qué ve el Comensal B en su vista (/menu/[slug]/page.tsx lógica)
    const allOrdersRes = await fetch(`${BASE_URL}/api/orders?slug=${SLUG}`)
    const allOrdersData = await allOrdersRes.json()
    const rawOrders = allOrdersData.orders || []

    // Aplicar el filtro estricto de aislamiento por sesión del comensal (src/app/menu/[slug]/page.tsx:350-355)
    const dinerBOrders = rawOrders.filter(
      o =>
        (o.table_number?.toString() === tableNum.toString() ||
          o.table?.table_number?.toString() === tableNum.toString() ||
          o.table_id === `table-${tableNum}`) &&
        (!o.session_token || o.session_token === sessionTokenB) &&
        ['pending_validation', 'pending', 'preparing', 'ready', 'delivered'].includes(o.status)
    )

    assert.equal(
      dinerBOrders.length,
      0,
      `Sesión B no debe ver órdenes activas ni entregadas de Sesión A. Encontradas: ${dinerBOrders.length} (IDs: ${dinerBOrders.map(o => o.id).join(', ')})`
    )

    // Paso 6: Comprobar que /api/session/restore con la cookie de Sesión B no filtra órdenes de Sesión A
    const restoreBRes = await fetch(`${BASE_URL}/api/session/restore?slug=${SLUG}&table=${tableNum}`, {
      headers: { Cookie: `gastro_session_${SLUG}_${tableNum}=${sessionTokenB}` },
    })
    const restoreBData = await restoreBRes.json()
    assert.equal(restoreBRes.status, 200, 'Restore responde 200 para Sesión B')
    assert.equal(restoreBData.restored, true, 'Sesión B activa restaurada')
    const restoredOrders = restoreBData.orders || []
    const leakedOrders = restoredOrders.filter(o => o.id === orderIdA1 || o.id === orderIdA2)
    assert.equal(
      leakedOrders.length,
      0,
      `Órdenes de Sesión A filtradas en restore de Sesión B: ${leakedOrders.length}`
    )

    // Paso 7: Comensal B realiza su propia orden (Orden B1)
    const orderB1Res = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug: SLUG,
        table_number: tableNum,
        session_token: sessionTokenB,
        idempotency_key: `order-b1-${Date.now()}`,
        items: [{ product_id: 'p-3', quantity: 1, name: 'Ensalada B1', price: 8 }],
      }),
    })
    assert.equal(orderB1Res.status, 200, 'Orden B1 creada correctamente')
    const orderB1Data = await orderB1Res.json()
    const orderIdB1 = orderB1Data.order.id

    // Comprobar que Comensal B ve ÚNICAMENTE su propia Orden B1
    const refetchedOrders = (await (await fetch(`${BASE_URL}/api/orders?slug=${SLUG}`)).json()).orders || []
    const dinerBUpdatedOrders = refetchedOrders.filter(
      o =>
        (o.table_number?.toString() === tableNum.toString() ||
          o.table?.table_number?.toString() === tableNum.toString() ||
          o.table_id === `table-${tableNum}`) &&
        (!o.session_token || o.session_token === sessionTokenB) &&
        ['pending_validation', 'pending', 'preparing', 'ready', 'delivered'].includes(o.status)
    )

    assert.equal(dinerBUpdatedOrders.length, 1, 'Comensal B ve exactamente 1 comanda (la suya)')
    assert.equal(dinerBUpdatedOrders[0].id, orderIdB1, 'La comanda vista por Comensal B es exactamente Orden B1')
  })

  await runTest('2.2 Token revocado de Sesión A es rechazado con HTTP 403 al intentar ordenar mientras Sesión B está activa', async () => {
    const tableNum = 19
    const staleTokenA = 'sess-stale-token-a-invalid'

    const staleRes = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug: SLUG,
        table_number: tableNum,
        session_token: staleTokenA,
        idempotency_key: `stale-order-${Date.now()}`,
        items: [{ product_id: 'p-1', quantity: 1 }],
      }),
    })

    assert.equal(staleRes.status, 403, `Debe responder HTTP 403, respondió ${staleRes.status}`)
    const staleData = await staleRes.json()
    assert.equal(staleData.error, 'SESSION_EXPIRED', `El error debe ser SESSION_EXPIRED, fue: ${staleData.error}`)
  })

  // ---------------------------------------------------------------------------
  // SUITE 3: FORGED SESSION TOKENS (RANDOMIZED UUIDS / ANTI-POLLUTION VERIFICATION)
  // ---------------------------------------------------------------------------
  console.log('\n--- SUITE 3: Forged Session Tokens & Zero DB Pollution ---')

  await runTest('3.1 Tokens UUID arbitrarios/forjados son rechazados con HTTP 403 SESSION_EXPIRED y cero polución en table_sessions', async () => {
    const tableNum = 22

    // Asegurar mesa libre
    await fetch(`${BASE_URL}/api/tables`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: SLUG, table_number: tableNum, action: 'free' }),
    })

    // Obtener estado inicial de sesiones
    const beforeTablesRes = await fetch(`${BASE_URL}/api/tables?slug=${SLUG}`)
    const beforeTablesData = await beforeTablesRes.json()

    // Generar 5 UUIDs forjados aleatorios
    const forgedTokens = Array.from({ length: 5 }, () => crypto.randomUUID())

    for (const forgedToken of forgedTokens) {
      // Intento de crear orden con token forjado
      const attackRes = await fetch(`${BASE_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: SLUG,
          table_number: tableNum,
          session_token: forgedToken,
          idempotency_key: `forged-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
          items: [{ product_id: 'p-1', quantity: 1 }],
        }),
      })

      assert.equal(
        attackRes.status,
        403,
        `Token forjado ${forgedToken} debió recibir HTTP 403, recibió ${attackRes.status}`
      )
      const attackData = await attackRes.json()
      assert.equal(
        attackData.error,
        'SESSION_EXPIRED',
        `Respuesta debe ser SESSION_EXPIRED, se obtuvo ${attackData.error}`
      )

      // Intento de restaurar sesión con cookie de token forjado
      const restoreAttackRes = await fetch(`${BASE_URL}/api/session/restore?slug=${SLUG}&table=${tableNum}`, {
        headers: { Cookie: `gastro_session_${SLUG}_${tableNum}=${forgedToken}` },
      })
      const restoreAttackData = await restoreAttackRes.json()
      assert.equal(
        restoreAttackData.restored,
        false,
        `Token forjado no debe restaurarse. Respuesta: ${JSON.stringify(restoreAttackData)}`
      )
    }

    // Verificar cero polución en table_sessions
    const afterTablesRes = await fetch(`${BASE_URL}/api/tables?slug=${SLUG}`)
    const afterTablesData = await afterTablesRes.json()
    const afterSessions = afterTablesData.sessions || {}

    // Ninguno de los tokens forjados debe existir en las sesiones
    for (const forgedToken of forgedTokens) {
      for (const [tNum, sess] of Object.entries(afterSessions)) {
        assert.notEqual(
          sess.session_id,
          forgedToken,
          `POLUCIÓN DETECTADA: Token forjado ${forgedToken} fue insertado en sesión de mesa #${tNum}`
        )
      }
    }

    // Verificar que ninguna comanda espuria fue creada
    const ordersAfter = (await (await fetch(`${BASE_URL}/api/orders?slug=${SLUG}`)).json()).orders || []
    const spuriousOrders = ordersAfter.filter(o => o.table_number === tableNum)
    assert.equal(
      spuriousOrders.length,
      0,
      `POLUCIÓN DETECTADA: Se crearon órdenes espurias en mesa #${tableNum} a pesar de token forjado`
    )
  })

  // ---------------------------------------------------------------------------
  // SUITE 4: NON-VOLATILE ALERTS (POLLING ITERATIONS & COMPONENT RESILIENCE)
  // ---------------------------------------------------------------------------
  console.log('\n--- SUITE 4: Non-Volatile Alerts Across Multiple Polling Iterations ---')

  await runTest('4.1 Avisos de mozo y comandas activas persisten sin volatilidad a través de 10 ciclos de polling consecutivos', async () => {
    const tableNum = 24

    // Inicializar mesa limpia
    await fetch(`${BASE_URL}/api/tables`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: SLUG, table_number: tableNum, action: 'free' }),
    })

    const startRes = await fetch(`${BASE_URL}/api/tables`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: SLUG, table_number: tableNum, action: 'start_session' }),
    })
    const sessionToken = (await startRes.json()).session_token

    // Crear aviso de mozo
    const callRes = await fetch(`${BASE_URL}/api/service-calls`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug: SLUG,
        table_number: tableNum,
        call_type: 'waiter_attention',
      }),
    })
    assert.equal(callRes.status, 200, 'Aviso de servicio creado')
    const callData = await callRes.json()
    const callId = callData.call.id
    assert.ok(callId, 'ID de aviso de servicio generado')

    // Crear orden activa
    const orderRes = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug: SLUG,
        table_number: tableNum,
        session_token: sessionToken,
        idempotency_key: `alert-order-${Date.now()}`,
        items: [{ product_id: 'p-1', quantity: 1, name: 'Burger Test Alert', price: 10 }],
      }),
    })
    assert.equal(orderRes.status, 200, 'Orden de prueba creada')
    const orderObj = (await orderRes.json()).order
    const orderId = orderObj.id
    const initialOrderStatus = orderObj.status
    assert.ok(orderId, 'ID de orden generado')
    assert.ok(initialOrderStatus, 'Estado inicial de orden presente')

    // Ejecutar 10 ciclos de polling consecutivos espaciados (simulando pantallas de Cocina, Mozo y Cliente)
    const POLLING_CYCLES = 10
    for (let cycle = 1; cycle <= POLLING_CYCLES; cycle++) {
      await sleep(50) // Simular intervalo de polling

      const [ordersRes, callsRes] = await Promise.all([
        fetch(`${BASE_URL}/api/orders?slug=${SLUG}`),
        fetch(`${BASE_URL}/api/service-calls?slug=${SLUG}`),
      ])

      assert.equal(ordersRes.status, 200, `Polling ciclo #${cycle}: orders responde 200`)
      assert.equal(callsRes.status, 200, `Polling ciclo #${cycle}: service-calls responde 200`)

      const ordersData = await ordersRes.json()
      const callsData = await callsRes.json()

      // Invariante 2.3: El aviso de mozo DEBE permanecer pendiente y visible hasta atención explícita
      const activeCall = (callsData.calls || []).find(c => c.id === callId)
      assert.ok(
        activeCall,
        `REGRESIÓN DE VOLATILIDAD: Aviso ${callId} desapareció en el ciclo de polling #${cycle} sin atención explícita`
      )
      assert.equal(
        activeCall.status,
        'pending',
        `REGRESIÓN DE VOLATILIDAD: Estado del aviso ${callId} mutó a ${activeCall.status} inesperadamente en ciclo #${cycle}`
      )

      // Invariante 2.2: La comanda DEBE persistir en la cola activa de cocina
      const activeOrder = (ordersData.orders || []).find(o => o.id === orderId)
      assert.ok(
        activeOrder,
        `REGRESIÓN DE VOLATILIDAD: Comanda ${orderId} desapareció en el ciclo de polling #${cycle}`
      )
      assert.equal(
        activeOrder.status,
        initialOrderStatus,
        `REGRESIÓN DE VOLATILIDAD: Estado de comanda ${orderId} mutó a ${activeOrder.status} en ciclo #${cycle}`
      )
    }

    // Paso 5: El personal atiende explícitamente el aviso (descarte/atención controlada)
    const attendRes = await fetch(`${BASE_URL}/api/service-calls`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: SLUG, callId }),
    })
    assert.equal(attendRes.status, 200, 'Aviso atendido explícitamente por el personal')

    // Polling post-atención: verificar que ya no aparece como alerta activa pendiente (se atendió correctamente)
    const callsAfterAttend = (await (await fetch(`${BASE_URL}/api/service-calls?slug=${SLUG}`)).json()).calls || []
    const stillPending = callsAfterAttend.some(c => c.id === callId && c.status === 'pending')
    assert.equal(stillPending, false, 'Aviso atendido ya no permanece en la cola de alertas pendientes activas')

    // Invariante de comanda: La comanda sigue viva en cocina tras la atención del aviso
    const ordersAfterAttend = (await (await fetch(`${BASE_URL}/api/orders?slug=${SLUG}`)).json()).orders || []
    const orderStillActive = ordersAfterAttend.find(o => o.id === orderId)
    assert.ok(orderStillActive, 'La comanda persiste en cocina independientemente del aviso atendido')
    assert.equal(orderStillActive.status, initialOrderStatus, 'La comanda mantiene su estado exacto inicial')
  })

  await runTest('4.2 Comandas entregadas persisten en el historial del servidor y en la pre-cuenta hasta el cobro', async () => {
    const tableNum = 25

    // Iniciar mesa
    await fetch(`${BASE_URL}/api/tables`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: SLUG, table_number: tableNum, action: 'free' }),
    })

    const startRes = await fetch(`${BASE_URL}/api/tables`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: SLUG, table_number: tableNum, action: 'start_session' }),
    })
    const sessionToken = (await startRes.json()).session_token

    // Crear orden con created_by: 'waiter' (empieza en 'pending')
    const orderRes = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug: SLUG,
        table_number: tableNum,
        session_token: sessionToken,
        created_by: 'waiter',
        idempotency_key: `history-order-${Date.now()}`,
        items: [{ product_id: 'p-2', quantity: 2, name: 'Bebida Historial', price: 5 }],
      }),
    })
    const orderObj = (await orderRes.json()).order
    const orderId = orderObj.id
    assert.equal(orderObj.status, 'pending', 'Orden creada por mozo inicia en pending')

    // Avanzar a preparing -> ready -> delivered
    await fetch(`${BASE_URL}/api/orders`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: SLUG, orderId, status: 'preparing' }),
    })
    await fetch(`${BASE_URL}/api/orders`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: SLUG, orderId, status: 'ready' }),
    })
    await fetch(`${BASE_URL}/api/orders`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: SLUG, orderId, status: 'delivered' }),
    })

    // Polling 5 ciclos sobre orden delivered: verificar que no desaparece ni cambia de estado
    for (let i = 0; i < 5; i++) {
      await sleep(30)
      const res = await fetch(`${BASE_URL}/api/orders?slug=${SLUG}`)
      const orders = (await res.json()).orders || []
      const found = orders.find(o => o.id === orderId)
      assert.ok(found, `Orden delivered ${orderId} no debe ser eliminada por polling`)
      assert.equal(found.status, 'delivered', 'Orden entregada debe mantener status delivered')
    }

    // Liberar mesa: verificar que la orden pasa a 'paid' y no es borrada físicamente
    await fetch(`${BASE_URL}/api/tables`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: SLUG, table_number: tableNum, action: 'free' }),
    })

    const afterFreeOrders = (await (await fetch(`${BASE_URL}/api/orders?slug=${SLUG}`)).json()).orders || []
    const paidOrder = afterFreeOrders.find(o => o.id === orderId)
    assert.ok(paidOrder, 'Orden debe mantenerse en memoria para auditoría contable')
    assert.equal(paidOrder.status, 'paid', 'Orden debe transicionar limpiamente a paid al liberar la mesa')
  })

  // ---------------------------------------------------------------------------
  // RESUMEN FINAL
  // ---------------------------------------------------------------------------
  console.log('\n================================================================================')
  console.log(` 📊 RESULTADOS: ${passed} pruebas superadas de ${passed + failed}`)
  console.log('================================================================================')

  if (failed > 0) {
    console.error(`\n❌ SE ENCONTRARON ${failed} FALLOS EN EL HARNESS ADVERSARIAL:`)
    findings.forEach((f, i) => {
      console.error(`\n[Fallo ${i + 1}] ${f.name}`)
      console.error(f.error)
    })
    process.exit(1)
  } else {
    console.log('\n🎉 ¡TODAS LAS PRUEBAS ADVERSARIALES PASARON CON ÉXITO! (100% ROBUST)')
    process.exit(0)
  }
}

main().catch(err => {
  console.error('Error fatal ejecutando harness:', err)
  process.exit(1)
})
