import http from 'http'

const BASE_URL = 'http://localhost:3000'
const SLUG = 'burger-gourmet'

function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL)
    const reqOptions = {
      hostname: url.hostname,
      port: url.port || 3000,
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    }

    const req = http.request(reqOptions, (res) => {
      let data = ''
      res.on('data', (chunk) => {
        data += chunk
      })
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {}
          resolve({ status: res.statusCode, headers: res.headers, data: parsed, raw: data })
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, data, raw: data })
        }
      })
    })

    req.on('error', (err) => reject(err))

    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body))
    }
    req.end()
  })
}

async function run100ScenariosSuite() {
  console.log('======================================================================')
  console.log('🚀 INICIANDO SUITE DE 100 PRUEBAS AUTOMATIZADAS - SIMULACIÓN LOCAL LLENO')
  console.log('======================================================================\n')

  let passedCount = 0
  let failedCount = 0
  const startTime = Date.now()

  // Helper de Aserción
  const assert = (condition, testIndex, description, details = '') => {
    if (condition) {
      passedCount++
      console.log(`  ✓ [TEST ${String(testIndex).padStart(3, '0')}/100 PASS] ${description}`)
    } else {
      failedCount++
      console.error(`  ❌ [TEST ${String(testIndex).padStart(3, '0')}/100 FAIL] ${description} -> ${details}`)
      throw new Error(`Falló el Test #${testIndex}: ${description} (${details})`)
    }
  }

  try {
    // -------------------------------------------------------------
    // FASE 0: LIMPIEZA INICIAL
    // -------------------------------------------------------------
    await makeRequest(`/api/orders?slug=${SLUG}`, { method: 'DELETE' })
    await makeRequest(`/api/service-calls?slug=${SLUG}`, { method: 'DELETE' })

    // -------------------------------------------------------------
    // PRUEBAS 1 a 20: 20 MESAS ENTRANDO Y PIDIENDO A LA VEZ (BURST CONCURRENTE)
    // -------------------------------------------------------------
    console.log('--- FASE 1: 20 Mesas Pidiendo Simultáneamente en el Salón ---')
    const orderPromises = []
    for (let tableNum = 1; tableNum <= 20; tableNum++) {
      const items = [
        {
          product_id: 'p-bg-1',
          quantity: (tableNum % 3) + 1,
          notes: tableNum % 2 === 0 ? '[A Punto, Papas Fritas, Sin Sal]' : '[Bien Cocido, Ensalada]',
        },
        {
          product_id: tableNum % 2 === 0 ? 'p-bca-1' : 'p-bsa-1',
          quantity: 2,
          notes: null,
        }
      ]

      orderPromises.push(
        makeRequest('/api/orders', {
          method: 'POST',
          body: {
            slug: SLUG,
            table_number: tableNum,
            table_id: `table-${tableNum}`,
            items,
          }
        })
      )
    }

    const orderResults = await Promise.all(orderPromises)
    for (let i = 0; i < 20; i++) {
      const tableNum = i + 1
      const res = orderResults[i]
      assert(
        res.status === 200 && res.data.order && res.data.order.table_number === tableNum,
        i + 1,
        `Mesa #${tableNum} crea comanda con éxito`,
        JSON.stringify(res.data)
      )
    }

    // -------------------------------------------------------------
    // PRUEBAS 21 a 40: VERIFICAR QUE COCINA KDS TIENE LAS 20 MESAS EN COLA
    // -------------------------------------------------------------
    console.log('\n--- FASE 2: Cocina KDS Recibe y Procesa las 20 Comandas ---')
    const kitchenOrdersRes = await makeRequest(`/api/orders?slug=${SLUG}`)
    const kitchenOrders = kitchenOrdersRes.data.orders || []
    assert(kitchenOrders.length === 20, 21, 'Cocina KDS contiene exactamente las 20 comandas activas', `Obtenidas: ${kitchenOrders.length}`)

    // Cambiar estado a 'preparing' en las 20 mesas
    const preparingPromises = kitchenOrders.map((ord, idx) =>
      makeRequest('/api/orders', {
        method: 'PATCH',
        body: { slug: SLUG, orderId: ord.id, status: 'preparing' },
      })
    )
    const prepResults = await Promise.all(preparingPromises)
    for (let i = 0; i < 19; i++) {
      const testNum = 22 + i
      const res = prepResults[i]
      assert(res.status === 200 && res.data.success, testNum, `Cocina pasa a 'En Preparación' comanda #${i + 1}`)
    }

    // -------------------------------------------------------------
    // PRUEBAS 41 a 60: PLATOS LISTOS (KDS Marca Ready en las 20 Mesas)
    // -------------------------------------------------------------
    console.log('\n--- FASE 3: Cocina Termina Platos y Pasa a Listo (Ready) ---')
    const readyPromises = kitchenOrders.map((ord, idx) =>
      makeRequest('/api/orders', {
        method: 'PATCH',
        body: { slug: SLUG, orderId: ord.id, status: 'ready' },
      })
    )
    const readyResults = await Promise.all(readyPromises)
    for (let i = 0; i < 20; i++) {
      const testNum = 41 + i
      const res = readyResults[i]
      assert(res.status === 200 && res.data.success, testNum, `Cocina marca 'Plato Listo' para Mesa #${kitchenOrders[i].table_number}`)
    }

    // -------------------------------------------------------------
    // PRUEBAS 61 a 70: MOZOS ENTREGAN INDIVIDUALMENTE EN MESA (Ready -> Delivered)
    // -------------------------------------------------------------
    console.log('\n--- FASE 4: Mozos Entregan Platos en las Mesas ---')
    for (let i = 0; i < 10; i++) {
      const testNum = 61 + i
      const ord = kitchenOrders[i]
      const deliverRes = await makeRequest('/api/orders', {
        method: 'PATCH',
        body: { slug: SLUG, orderId: ord.id, status: 'delivered' },
      })
      assert(deliverRes.status === 200 && deliverRes.data.success, testNum, `Mozo entrega comanda en Mesa #${ord.table_number}`)
    }

    // -------------------------------------------------------------
    // PRUEBAS 71 a 80: MICROSERVICIOS Y AVISOS CONCURRENTES (Hielo, Pan, Cuenta)
    // -------------------------------------------------------------
    console.log('\n--- FASE 5: Comensales Solicitan Microservicios y Cuentas ---')
    const serviceTypes = ['service_Hielo y Limón', 'service_Panera / Salsas', 'service_Servilletas', 'bill_Efectivo', 'bill_Tarjeta (Traer Posnet)']
    const servicePromises = []
    for (let i = 1; i <= 10; i++) {
      servicePromises.push(
        makeRequest('/api/service-calls', {
          method: 'POST',
          body: {
            slug: SLUG,
            table_number: i,
            call_type: serviceTypes[i % serviceTypes.length],
          }
        })
      )
    }
    const serviceResults = await Promise.all(servicePromises)
    for (let i = 0; i < 10; i++) {
      const testNum = 71 + i
      const res = serviceResults[i]
      assert(res.status === 200 && res.data.call, testNum, `Mesa #${i + 1} emite aviso '${serviceTypes[i % serviceTypes.length]}'`)
    }

    // -------------------------------------------------------------
    // PRUEBAS 81 a 90: MOZO ATIENDE LLAMADAS Y CIERRA AVISOS
    // -------------------------------------------------------------
    console.log('\n--- FASE 6: Mozos Atienden y Resuelven Todos los Avisos ---')
    const activeCallsRes = await makeRequest(`/api/service-calls?slug=${SLUG}`)
    const activeCalls = activeCallsRes.data.calls || []
    assert(activeCalls.length >= 10, 81, 'Comandero recibe todas las llamadas pendientes', `Total: ${activeCalls.length}`)

    for (let i = 0; i < 9; i++) {
      const testNum = 82 + i
      const call = activeCalls[i]
      const attendRes = await makeRequest('/api/service-calls', {
        method: 'PATCH',
        body: { slug: SLUG, callId: call.id },
      })
      assert(attendRes.status === 200 && attendRes.data.success, testNum, `Mozo atiende y resuelve aviso #${call.id.substring(0, 10)}`)
    }

    // -------------------------------------------------------------
    // PRUEBAS 91 a 95: SEGURIDAD ANTI-TAMPERING & SANITIZACIÓN
    // -------------------------------------------------------------
    console.log('\n--- FASE 7: Verificación de Seguridad y Robustez ---')
    // 91. Rechazo de comanda vacía
    const emptyOrderRes = await makeRequest('/api/orders', {
      method: 'POST',
      body: { slug: SLUG, table_number: 4, items: [] }
    })
    assert(emptyOrderRes.status === 400, 91, 'Seguridad: Rechazo de comanda con items vacíos (HTTP 400)')

    // 92. Rechazo de cantidades inválidas
    const invalidQtyRes = await makeRequest('/api/orders', {
      method: 'POST',
      body: { slug: SLUG, table_number: 4, items: [{ product_id: 'p-bg-1', quantity: -5 }] }
    })
    assert(invalidQtyRes.status === 200 && invalidQtyRes.data.order.order_items[0].quantity === 1, 92, 'Seguridad: Sanitización de cantidad negativa a mínimo 1')

    // 93. Cálculo inmutable de precio en Euros por el servidor
    const tamperRes = await makeRequest('/api/orders', {
      method: 'POST',
      body: { slug: SLUG, table_number: 4, total_amount: 0.01, items: [{ product_id: 'p-bur-1', quantity: 2 }] }
    })
    assert(tamperRes.status === 200 && tamperRes.data.order.total_amount === 28.40, 93, 'Seguridad: Anti-Tampering recalcula total en Euros exactos (28.40 €)')

    // 94. Verificación de SSE Event Endpoint
    const eventsOk = await new Promise((resolve) => {
      const req = http.get(`${BASE_URL}/api/events`, (res) => {
        resolve(res.statusCode === 200)
        req.destroy()
      })
      req.on('error', () => resolve(false))
    })
    assert(eventsOk, 94, 'Disponibilidad de canal de eventos SSE en tiempo real')

    // 95. Consulta de sesiones de mesas
    const tableSessionsRes = await makeRequest(`/api/tables?slug=${SLUG}`)
    assert(tableSessionsRes.status === 200, 95, 'API de sesiones de mesa responde correctamente')

    // -------------------------------------------------------------
    // PRUEBAS 96 a 100: LIBERACIÓN DE MESAS Y RESETEO TOTAL
    // -------------------------------------------------------------
    console.log('\n--- FASE 8: Liberación de Mesas y Reseteo para Nuevos Comensales ---')
    // 96. Liberar Mesa #1
    const freeT1 = await makeRequest('/api/tables', {
      method: 'POST',
      body: { slug: SLUG, table_number: 1, action: 'free' }
    })
    assert(freeT1.status === 200 && freeT1.data.success, 96, 'Mozo libera Mesa #1 y resetea sesión')

    // 97. Liberar Mesa #2
    const freeT2 = await makeRequest('/api/tables', {
      method: 'POST',
      body: { slug: SLUG, table_number: 2, action: 'free' }
    })
    assert(freeT2.status === 200 && freeT2.data.success, 97, 'Mozo libera Mesa #2 y resetea sesión')

    // 98. Liberar Mesa #3
    const freeT3 = await makeRequest('/api/tables', {
      method: 'POST',
      body: { slug: SLUG, table_number: 3, action: 'free' }
    })
    assert(freeT3.status === 200 && freeT3.data.success, 98, 'Mozo libera Mesa #3 y resetea sesión')

    // 99. Purga final de cierre de jornada
    const finalClean = await makeRequest(`/api/orders?slug=${SLUG}`, { method: 'DELETE' })
    await makeRequest(`/api/service-calls?slug=${SLUG}`, { method: 'DELETE' })
    assert(finalClean.status === 200, 99, 'Cierre de jornada: Purga completa de memoria de servidor')

    // 100. Verificación de salón 100% limpio y disponible
    const finalCheck = await makeRequest(`/api/orders?slug=${SLUG}`)
    assert(finalCheck.data.orders.length === 0, 100, 'Salón 100% libre, listo para la próxima tanda de clientes')

    const elapsed = Date.now() - startTime
    console.log('\n======================================================================')
    console.log(`🏆 RESULTADO FINAL: 100/100 PRUEBAS EXITOSAS CONSECUTIVAS`)
    console.log(`⏱️ TIEMPO TOTAL: ${elapsed} ms (${(elapsed / 100).toFixed(1)} ms por prueba)`)
    console.log(`❌ FALLOS: 0`)
    console.log('======================================================================\n')
  } catch (error) {
    console.error('\n❌ ERROR DURANTE LA EJECUCIÓN DE LA SUITE:', error)
    process.exit(1)
  }
}

run100ScenariosSuite()
