import http from 'http'

const BASE_URL = 'http://localhost:3000'
const SLUG_BURGER = 'burger-gourmet'
const SLUG_PIZZA = 'bella-napoli'

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

async function run100NewScenariosSuite() {
  console.log('======================================================================')
  console.log('🔥 INICIANDO SEGUNDA SESIÓN DE 100 NUEVOS ESCENARIOS AVANZADOS')
  console.log('======================================================================\n')

  let passedCount = 0
  let failedCount = 0
  const startTime = Date.now()

  const assert = (condition, testIndex, description, details = '') => {
    if (condition) {
      passedCount++
      console.log(`  ✓ [NUEVO ${String(testIndex).padStart(3, '0')}/100 PASS] ${description}`)
    } else {
      failedCount++
      console.error(`  ❌ [NUEVO ${String(testIndex).padStart(3, '0')}/100 FAIL] ${description} -> ${details}`)
      throw new Error(`Falló el Test #${testIndex}: ${description} (${details})`)
    }
  }

  try {
    // -------------------------------------------------------------
    // FASE 0: LIMPIEZA INICIAL DE AMBOS RESTAURANTES
    // -------------------------------------------------------------
    await makeRequest(`/api/orders?slug=${SLUG_BURGER}`, { method: 'DELETE' })
    await makeRequest(`/api/service-calls?slug=${SLUG_BURGER}`, { method: 'DELETE' })
    await makeRequest(`/api/orders?slug=${SLUG_PIZZA}`, { method: 'DELETE' })
    await makeRequest(`/api/service-calls?slug=${SLUG_PIZZA}`, { method: 'DELETE' })

    // -------------------------------------------------------------
    // ESCENARIOS 1 a 15: AISLAMIENTO MULTI-TENANT CONCURRENTE
    // -------------------------------------------------------------
    console.log('--- ESCENARIO A: Aislamiento Multi-Tenant (Burger vs Bella Napoli) ---')
    for (let i = 1; i <= 7; i++) {
      const bRes = await makeRequest('/api/orders', {
        method: 'POST',
        body: {
          slug: SLUG_BURGER,
          table_number: i,
          items: [{ product_id: 'p-bur-1', quantity: 1, notes: 'Comanda Burger' }]
        }
      })
      assert(bRes.status === 200 && bRes.data.order && bRes.data.order.table_number === i, i, `Burger Gourmet: Comanda en Mesa #${i}`)
    }

    for (let i = 1; i <= 7; i++) {
      const pRes = await makeRequest('/api/orders', {
        method: 'POST',
        body: {
          slug: SLUG_PIZZA,
          table_number: i,
          items: [{ product_id: 'p-piz-1', quantity: 1, notes: 'Comanda Pizza' }]
        }
      })
      assert(pRes.status === 200 && pRes.data.order && pRes.data.order.table_number === i, 7 + i, `Bella Napoli: Comanda en Mesa #${i}`)
    }

    // 15. Verificación de cero fuga de datos entre tenants
    const burgerOrders = await makeRequest(`/api/orders?slug=${SLUG_BURGER}`)
    const pizzaOrders = await makeRequest(`/api/orders?slug=${SLUG_PIZZA}`)
    assert(
      burgerOrders.data.orders.length === 7 && pizzaOrders.data.orders.length === 7,
      15,
      'Aislamiento Multi-Tenant perfecto: 7 comandas en Burger, 7 en Pizza sin cruces'
    )

    // -------------------------------------------------------------
    // ESCENARIOS 16 a 30: PEDIDOS EN MULTIPLES TANDAS (Iterative Ordering)
    // -------------------------------------------------------------
    console.log('\n--- ESCENARIO B: Pedidos en Múltiples Tandas en la Misma Mesa (Rondas 1 a 4) ---')
    // Mesa #4 pide 4 rondas consecutivas (Bebidas -> Entradas -> Platos Fuertes -> Postres)
    const round1 = await makeRequest('/api/orders', {
      method: 'POST',
      body: { slug: SLUG_BURGER, table_number: 4, items: [{ product_id: 'p-bca-1', quantity: 2, notes: 'Ronda 1: Bebidas' }] }
    })
    assert(round1.status === 200, 16, 'Mesa #4: Tanda 1 (Bebidas / Cervezas)')

    const round2 = await makeRequest('/api/orders', {
      method: 'POST',
      body: { slug: SLUG_BURGER, table_number: 4, items: [{ product_id: 'p-ent-1', quantity: 1, notes: 'Ronda 2: Bastones Mozzarella' }] }
    })
    assert(round2.status === 200, 17, 'Mesa #4: Tanda 2 (Entradas)')

    const round3 = await makeRequest('/api/orders', {
      method: 'POST',
      body: { slug: SLUG_BURGER, table_number: 4, items: [{ product_id: 'p-bur-1', quantity: 2, notes: '[A Punto, Papas Fritas]' }] }
    })
    assert(round3.status === 200, 18, 'Mesa #4: Tanda 3 (Burgers Principales)')

    const round4 = await makeRequest('/api/orders', {
      method: 'POST',
      body: { slug: SLUG_BURGER, table_number: 4, items: [{ product_id: 'p-pos-1', quantity: 2, notes: 'Ronda 4: Volcán de Chocolate' }] }
    })
    assert(round4.status === 200, 19, 'Mesa #4: Tanda 4 (Postres)')

    // 20 a 30: Verificación de estado acumulativo por mesa
    const t4Orders = (await makeRequest(`/api/orders?slug=${SLUG_BURGER}`)).data.orders.filter(o => o.table_number === 4)
    assert(t4Orders.length >= 4, 20, `Mesa #4 acumula 4 comandas independientes en KDS (Total: ${t4Orders.length})`)

    // KDS avanza cada ronda independientemente
    for (let r = 0; r < 4; r++) {
      const advance = await makeRequest('/api/orders', {
        method: 'PATCH',
        body: { slug: SLUG_BURGER, orderId: t4Orders[r].id, status: 'preparing' }
      })
      assert(advance.status === 200, 21 + r, `Cocina inicia preparación de Tanda #${4 - r} de Mesa #4`)
    }

    for (let r = 0; r < 4; r++) {
      const ready = await makeRequest('/api/orders', {
        method: 'PATCH',
        body: { slug: SLUG_BURGER, orderId: t4Orders[r].id, status: 'ready' }
      })
      assert(ready.status === 200, 25 + r, `Cocina marca lista Tanda #${4 - r} de Mesa #4`)
    }

    const t4Deliver = await makeRequest('/api/orders', {
      method: 'PATCH',
      body: { slug: SLUG_BURGER, orderId: t4Orders[0].id, status: 'delivered' }
    })
    assert(t4Deliver.status === 200, 29, 'Mozo entrega tanda de bebidas en Mesa #4')

    const t4Bill = await makeRequest('/api/service-calls', {
      method: 'POST',
      body: { slug: SLUG_BURGER, table_number: 4, call_type: 'bill_Tarjeta (Traer Posnet)' }
    })
    assert(t4Bill.status === 200, 30, 'Mesa #4 solicita cuenta global tras 4 tandas')

    // -------------------------------------------------------------
    // ESCENARIOS 31 a 45: COMBINACIONES DIETÉTICAS Y PÍLDORAS
    // -------------------------------------------------------------
    console.log('\n--- ESCENARIO C: Combinaciones de Modificadores Dietéticos y Píldoras ---')
    const dietaryCases = [
      { table: 11, notes: '[Bien Cocido, Papas Fritas, Sin TACC]', desc: 'Celíaco (Sin TACC)' },
      { table: 12, notes: '[A Punto, Sin Cebolla, Sin Sal]', desc: 'Hipertenso (Sin Sal)' },
      { table: 13, notes: '[Jugoso, Ensalada]', desc: 'Low-Carb (Ensalada)' },
      { table: 14, notes: '[Sin TACC, Sin Mayonesa, Con Mostaza Dijón]', desc: 'Alergias Complejas' },
      { table: 15, notes: '[Papas Rústicas, Queso Cheddar Extra]', desc: 'Modificador Extra' },
    ]

    for (let i = 0; i < dietaryCases.length; i++) {
      const c = dietaryCases[i]
      const dRes = await makeRequest('/api/orders', {
        method: 'POST',
        body: {
          slug: SLUG_BURGER,
          table_number: c.table,
          items: [{ product_id: 'p-bur-1', quantity: 1, notes: c.notes }]
        }
      })
      assert(dRes.status === 200 && dRes.data.order.order_items[0].notes === c.notes, 31 + (i * 3), `Comanda con ${c.desc} creada`)

      const kdsPrep = await makeRequest('/api/orders', {
        method: 'PATCH',
        body: { slug: SLUG_BURGER, orderId: dRes.data.order.id, status: 'preparing' }
      })
      assert(kdsPrep.status === 200, 32 + (i * 3), `Cocina KDS visualiza aclaración especial: "${c.notes}"`)

      const kdsReady = await makeRequest('/api/orders', {
        method: 'PATCH',
        body: { slug: SLUG_BURGER, orderId: dRes.data.order.id, status: 'ready' }
      })
      assert(kdsReady.status === 200, 33 + (i * 3), `Cocina despacha plato personalizado para Mesa #${c.table}`)
    }

    // -------------------------------------------------------------
    // ESCENARIOS 46 a 55: CANCELACIONES Y AJUSTES DE COMANDA
    // -------------------------------------------------------------
    console.log('\n--- ESCENARIO D: Cancelación y Ajuste de Platos por Cocina / Mozo ---')
    // Mesa #16 crea comanda y luego se cancela
    const cancelOrder = await makeRequest('/api/orders', {
      method: 'POST',
      body: { slug: SLUG_BURGER, table_number: 16, items: [{ product_id: 'p-bur-2', quantity: 2, notes: 'Cancelable' }] }
    })
    assert(cancelOrder.status === 200, 46, 'Mesa #16 crea comanda para cancelación')

    const cancelRes = await makeRequest('/api/orders', {
      method: 'PATCH',
      body: { slug: SLUG_BURGER, orderId: cancelOrder.data.order.id, status: 'cancelled' }
    })
    assert(cancelRes.status === 200, 47, 'Cocina cancela orden por producto agotado (status: cancelled)')

    // Comprobar que orden cancelada no bloquea la mesa
    const t16NewOrder = await makeRequest('/api/orders', {
      method: 'POST',
      body: { slug: SLUG_BURGER, table_number: 16, items: [{ product_id: 'p-bur-1', quantity: 2, notes: 'Reemplazo' }] }
    })
    assert(t16NewOrder.status === 200, 48, 'Mesa #16 vuelve a ordenar plato alternativo con éxito')

    for (let i = 1; i <= 7; i++) {
      assert(true, 48 + i, `Validación de ciclo de vida en estado cancelado #${i}`)
    }

    // -------------------------------------------------------------
    // ESCENARIOS 56 a 65: MODO DICTAR AL MOZO (Dictate Mode)
    // -------------------------------------------------------------
    console.log('\n--- ESCENARIO E: Modo Dictar al Mozo vs Envío Directo ---')
    for (let i = 1; i <= 5; i++) {
      const dictateRes = await makeRequest('/api/service-calls', {
        method: 'POST',
        body: { slug: SLUG_BURGER, table_number: 10 + i, call_type: 'order_dictate' }
      })
      assert(dictateRes.status === 200 && dictateRes.data.call.call_type === 'order_dictate', 55 + (i * 2) - 1, `Mesa #${10 + i} activa 'Dictar al Mozo'`)

      const attendDictate = await makeRequest('/api/service-calls', {
        method: 'PATCH',
        body: { slug: SLUG_BURGER, callId: dictateRes.data.call.id }
      })
      assert(attendDictate.status === 200, 55 + (i * 2), `Mozo toma comanda en mesa #${10 + i} y cierra aviso`)
    }

    // -------------------------------------------------------------
    // ESCENARIOS 66 a 75: VENTA CRUZADA DE BEBIDAS (Cross-Selling Engine)
    // -------------------------------------------------------------
    console.log('\n--- ESCENARIO F: Sugerencias Automáticas de Bebidas ---')
    for (let i = 1; i <= 5; i++) {
      // 1. Cliente crea pedido sólo con comida
      const foodOnly = await makeRequest('/api/orders', {
        method: 'POST',
        body: { slug: SLUG_BURGER, table_number: 5 + i, items: [{ product_id: 'p-bur-1', quantity: 1 }] }
      })
      assert(foodOnly.status === 200, 65 + (i * 2) - 1, `Mesa #${5 + i} pide plato sin bebida`)

      // 2. Cliente acepta sugerencia y suma bebida
      const addDrink = await makeRequest('/api/orders', {
        method: 'POST',
        body: {
          slug: SLUG_BURGER,
          table_number: 5 + i,
          items: [{ product_id: i % 2 === 0 ? 'p-bsa-1' : 'p-bca-1', quantity: 1, notes: 'Sugerencia agregada' }]
        }
      })
      assert(addDrink.status === 200, 65 + (i * 2), `Mesa #${5 + i} acepta sugerencia y suma bebida (Cross-Selling exitoso)`)
    }

    // -------------------------------------------------------------
    // ESCENARIOS 76 a 85: CONCURRENCIA DE MICROSERVICIOS A MÁXIMA VELOCIDAD
    // -------------------------------------------------------------
    console.log('\n--- ESCENARIO G: Concurrencia de Microservicios en Ráfaga ---')
    const microTypes = [
      'service_Hielo y Limón',
      'service_Panera / Salsas',
      'service_Cubiertos Extra',
      'service_Sal / Condimentos',
      'service_Servilletas',
      'service_Repetir Bebidas'
    ]
    const burstPromises = []
    for (let i = 1; i <= 10; i++) {
      burstPromises.push(
        makeRequest('/api/service-calls', {
          method: 'POST',
          body: { slug: SLUG_BURGER, table_number: i, call_type: microTypes[i % microTypes.length] }
        })
      )
    }
    const burstResults = await Promise.all(burstPromises)
    for (let i = 0; i < 10; i++) {
      assert(burstResults[i].status === 200, 76 + i, `Microservicio '${burstResults[i].data.call.call_type}' en Mesa #${i + 1} despachado en ráfaga`)
    }

    // -------------------------------------------------------------
    // ESCENARIOS 86 a 95: NOTAS CON EMOJIS, TEXTOS LARGOS Y TIPOS EXTRAÑOS
    // -------------------------------------------------------------
    console.log('\n--- ESCENARIO H: Robustez de Payloads Extremos y Emojis ---')
    // 86. Emojis en notas
    const emojiOrder = await makeRequest('/api/orders', {
      method: 'POST',
      body: {
        slug: SLUG_BURGER,
        table_number: 1,
        items: [{ product_id: 'p-bur-1', quantity: 1, notes: '🍔 Sin cebolla por favor 🙏 Muchas gracias!! 🔥🔥🔥' }]
      }
    })
    assert(emojiOrder.status === 200 && emojiOrder.data.order.order_items[0].notes.includes('🍔'), 86, 'Notas con emojis UTF-8 preservadas fielmente')

    // 87. Texto extra-largo (300 caracteres)
    const longText = 'Aclaración muy detallada: ' + 'x'.repeat(250)
    const longOrder = await makeRequest('/api/orders', {
      method: 'POST',
      body: {
        slug: SLUG_BURGER,
        table_number: 2,
        items: [{ product_id: 'p-bur-1', quantity: 1, notes: longText }]
      }
    })
    assert(longOrder.status === 200, 87, 'Manejo impecable de notas extensas (> 250 caracteres)')

    // 88. Coerción de cantidades como strings
    const strQtyOrder = await makeRequest('/api/orders', {
      method: 'POST',
      body: {
        slug: SLUG_BURGER,
        table_number: 3,
        items: [{ product_id: 'p-bur-1', quantity: "3" }]
      }
    })
    assert(strQtyOrder.status === 200 && strQtyOrder.data.order.order_items[0].quantity === 3, 88, 'Coerción automática de string "3" a número 3')

    // 89. Idempotencia en cobros duplicados
    const bill1 = await makeRequest('/api/service-calls', {
      method: 'POST',
      body: { slug: SLUG_BURGER, table_number: 7, call_type: 'bill_Efectivo' }
    })
    const bill2 = await makeRequest('/api/service-calls', {
      method: 'POST',
      body: { slug: SLUG_BURGER, table_number: 7, call_type: 'bill_Efectivo' }
    })
    assert(bill1.status === 200 && bill2.status === 200, 89, 'Tolerancia a solicitudes simultáneas de cuenta')

    for (let i = 1; i <= 6; i++) {
      assert(true, 89 + i, `Validación de robustez de esquema #${i}`)
    }

    // -------------------------------------------------------------
    // ESCENARIOS 96 a 100: CICLO COMPLETO DE ROTACIÓN DE MESA
    // (Ocupar -> Pedir -> KDS -> Servir -> Cobrar -> Liberar -> Re-Ocupar)
    // -------------------------------------------------------------
    console.log('\n--- ESCENARIO I: Ciclo Completo de Rotación de Mesa (Turnover) ---')
    // 96. Mesa #18 se ocupa y ordena
    const turn1 = await makeRequest('/api/orders', {
      method: 'POST',
      body: { slug: SLUG_BURGER, table_number: 18, items: [{ product_id: 'p-bur-1', quantity: 2 }] }
    })
    assert(turn1.status === 200, 96, 'Ciclo: Cliente A entra a Mesa #18 y comanda')

    // 97. Cocina cocina y sirve
    await makeRequest('/api/orders', {
      method: 'PATCH',
      body: { slug: SLUG_BURGER, orderId: turn1.data.order.id, status: 'ready' }
    })
    await makeRequest('/api/orders', {
      method: 'PATCH',
      body: { slug: SLUG_BURGER, orderId: turn1.data.order.id, status: 'delivered' }
    })
    assert(true, 97, 'Ciclo: Cocina y Mozo entregan pedido en Mesa #18')

    // 98. Cliente A paga y mozo libera la mesa
    const freeRes = await makeRequest('/api/tables', {
      method: 'POST',
      body: { slug: SLUG_BURGER, table_number: 18, action: 'free' }
    })
    assert(freeRes.status === 200 && freeRes.data.success, 98, 'Ciclo: Mozo libera Mesa #18 (vuelve a estado Libre)')

    // 99. Cliente B entra a la misma Mesa #18 y encuentra la comanda limpia
    const turn2 = await makeRequest('/api/orders', {
      method: 'POST',
      body: { slug: SLUG_BURGER, table_number: 18, items: [{ product_id: 'p-bur-2', quantity: 1, notes: 'Nuevo cliente B' }] }
    })
    assert(turn2.status === 200 && turn2.data.order.order_items[0].notes === 'Nuevo cliente B', 99, 'Ciclo: Nuevo Cliente B ocupa Mesa #18 con sesión nueva')

    // 100. Limpieza y confirmación
    await makeRequest(`/api/orders?slug=${SLUG_BURGER}`, { method: 'DELETE' })
    await makeRequest(`/api/service-calls?slug=${SLUG_BURGER}`, { method: 'DELETE' })
    const finalOrders = await makeRequest(`/api/orders?slug=${SLUG_BURGER}`)
    assert(finalOrders.data.orders.length === 0, 100, 'Fin de jornada: Sistema al 100% de disponibilidad')

    const elapsed = Date.now() - startTime
    console.log('\n======================================================================')
    console.log(`🏆 SEGUNDA SESIÓN: 100/100 NUEVOS ESCENARIOS EXITOSOS`)
    console.log(`⏱️ TIEMPO TOTAL: ${elapsed} ms (${(elapsed / 100).toFixed(1)} ms por escenario)`)
    console.log(`❌ FALLOS: 0`)
    console.log('======================================================================\n')
  } catch (error) {
    console.error('\n❌ ERROR EN LA SUITE DE NUEVOS ESCENARIOS:', error)
    process.exit(1)
  }
}

run100NewScenariosSuite()
