/**
 * EMPIRICAL CHALLENGER TEST SUITE — FLUXO GASTRONOMIC SYSTEM
 * Challenger 1: Adversarial Security & Ordering Verifier
 * 
 * Invariants Tested:
 * 1. Price Tampering Neutralization (Negative prices, altered prices, tampered total, fake product IDs)
 * 2. Idempotency & TOCTOU Defense (Sequential replays, high-concurrency race conditions)
 * 3. RLS & Admin Auth Enforcement (Unauthenticated requests, cookie tampering, role escalation, valid PIN)
 */

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:3000'
const SLUG = 'burger-gourmet'

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  bold: '\x1b[1m',
}

let passed = 0
let failed = 0
const results = []

function assert(condition, testName, detail = '') {
  if (condition) {
    console.log(`  ${COLORS.green}✔ [PASS]${COLORS.reset} ${testName}`)
    passed++
    results.push({ name: testName, status: 'PASS', detail })
  } else {
    console.error(`  ${COLORS.red}✖ [FAIL]${COLORS.reset} ${testName}: ${detail}`)
    failed++
    results.push({ name: testName, status: 'FAIL', detail })
  }
}

async function runChallenges() {
  console.log(`${COLORS.bold}${COLORS.cyan}================================================================================${COLORS.reset}`)
  console.log(`${COLORS.bold}${COLORS.cyan} 🛡️ CHALLENGER 1: ADVERSARIAL INTEGRITY & SECURITY SUITE ${COLORS.reset}`)
  console.log(`${COLORS.cyan} Target: ${BASE_URL} | Slug: ${SLUG} ${COLORS.reset}`)
  console.log(`${COLORS.bold}${COLORS.cyan}================================================================================\n${COLORS.reset}`)

  // Obtener sesión de mesa para las pruebas de pedidos
  const sessionRes = await fetch(`${BASE_URL}/api/tables`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slug: SLUG, table_number: 42, action: 'start_session' }),
  })
  const sessionData = await sessionRes.json()
  const sessionToken = sessionData.session_token
  console.log(`[Setup] Mesa 42 iniciada con sesión: ${sessionToken ? 'OK' : 'FAIL'}\n`)

  // ============================================================================
  // CHALLENGE 1: PRICE TAMPERING CHALLENGE
  // ============================================================================
  console.log(`${COLORS.bold}▶ RETO 1: Desafío de Manipulación y Falsificación de Precios (Price Tampering)${COLORS.reset}`)

  // 1.1 Obtener catálogo oficial de burger-gourmet
  const menuRes = await fetch(`${BASE_URL}/api/admin/menu?slug=${SLUG}`)
  const menuData = await menuRes.json()
  const legitProduct1 = menuData.products.find(p => p.id === 'p-1') || menuData.products[0]
  const officialPrice1 = Number(legitProduct1.price)
  console.log(`  [Info] Producto legítimo: '${legitProduct1.name}' (ID: ${legitProduct1.id}) | Precio Catálogo: ${officialPrice1}€`)

  // 1.2 Intento de precio negativo en item
  const attack1Payload = {
    slug: SLUG,
    table_number: 42,
    session_token: sessionToken,
    idempotency_key: `tamper-neg-${Date.now()}`,
    total_amount: -999.99, // Intentando forzar total negativo
    items: [
      {
        product_id: legitProduct1.id,
        quantity: 2,
        price: -50.00, // Intentando forzar precio negativo por item
      }
    ]
  }

  const res1 = await fetch(`${BASE_URL}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(attack1Payload),
  })
  const data1 = await res1.json()

  assert(
    res1.status === 200 && data1.success === true,
    'Pedido con precio negativo enviado es aceptado por el endpoint',
    `Status: ${res1.status}`
  )

  const expectedTotal1 = Number((officialPrice1 * 2).toFixed(2))
  assert(
    data1.order.total_amount === expectedTotal1,
    `El servidor neutralizó el precio negativo: total_amount (${data1.order.total_amount}€) coincide estrictamente con catálogo (${expectedTotal1}€)`,
    `Esperado: ${expectedTotal1}€, Obtenido: ${data1.order.total_amount}€`
  )

  const orderItems = data1.order.order_items || data1.order.items || []
  assert(
    orderItems.length > 0 && orderItems[0].product && orderItems[0].product.price === officialPrice1,
    `El item conserva el precio oficial del catálogo (${officialPrice1}€) en el objeto almacenado`,
    `Precio en item: ${orderItems[0]?.product?.price}€`
  )

  // 1.3 Intento de precio cero (0.00€) y total manipulado a 0.01€
  const attack2Payload = {
    slug: SLUG,
    table_number: 42,
    session_token: sessionToken,
    idempotency_key: `tamper-zero-${Date.now()}`,
    total_amount: 0.01,
    items: [
      {
        product_id: legitProduct1.id,
        quantity: 3,
        price: 0.00,
      }
    ]
  }

  const res2 = await fetch(`${BASE_URL}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(attack2Payload),
  })
  const data2 = await res2.json()

  const expectedTotal2 = Number((officialPrice1 * 3).toFixed(2))
  assert(
    res2.status === 200 && data2.order.total_amount === expectedTotal2,
    `El servidor neutralizó intento de precio 0€: recalcula exactamente ${expectedTotal2}€`,
    `Esperado: ${expectedTotal2}€, Obtenido: ${data2.order?.total_amount}€`
  )

  // 1.4 Intento de inyección de producto ficticio / inexistente (ID no existe en catálogo)
  const attack3Payload = {
    slug: SLUG,
    table_number: 42,
    session_token: sessionToken,
    idempotency_key: `tamper-fake-prod-${Date.now()}`,
    items: [
      {
        product_id: 'fake-luxury-caviar-999',
        quantity: 1,
        price: 0.00,
      }
    ]
  }

  const res3 = await fetch(`${BASE_URL}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(attack3Payload),
  })
  const data3 = await res3.json()

  assert(
    res3.status === 400 && data3.error && data3.error.includes('No se encontraron productos válidos'),
    'El servidor rechaza con HTTP 400 pedidos con productos que no existen en el catálogo',
    `Status: ${res3.status}, Error: ${data3.error}`
  )

  // ============================================================================
  // CHALLENGE 2: IDEMPOTENCY & TOCTOU CONCURRENCY CHALLENGE
  // ============================================================================
  console.log(`\n${COLORS.bold}▶ RETO 2: Desafío de Idempotencia Atómica y Prevención de Carreras TOCTOU${COLORS.reset}`)

  // 2.1 Reenvío secuencial idéntico con la misma idempotency_key
  const seqKey = `idem-seq-${Date.now()}`
  const baseOrderPayload = {
    slug: SLUG,
    table_number: 42,
    session_token: sessionToken,
    idempotency_key: seqKey,
    items: [{ product_id: legitProduct1.id, quantity: 1 }],
  }

  const seqRes1 = await fetch(`${BASE_URL}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(baseOrderPayload),
  })
  const seqData1 = await seqRes1.json()
  const originalOrderId = seqData1.order.id

  const seqRes2 = await fetch(`${BASE_URL}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(baseOrderPayload),
  })
  const seqData2 = await seqRes2.json()

  assert(
    seqRes2.status === 200,
    'Reintento secuencial con la misma idempotency_key devuelve HTTP 200',
    `Status: ${seqRes2.status}`
  )
  assert(
    seqData2.idempotent === true,
    'Reintento secuencial devuelve bandera idempotent: true',
    `idempotent: ${seqData2.idempotent}`
  )
  assert(
    seqData2.order.id === originalOrderId,
    `Reintento devuelve exactamente la misma orden previa (#${originalOrderId}) sin duplicar`,
    `ID 1: ${originalOrderId}, ID 2: ${seqData2.order?.id}`
  )

  // 2.2 Ataque de Concurrencia Extrema: 10 peticiones simultáneas con la MISMA idempotency_key
  const raceKey = `idem-race-${Date.now()}`
  const racePayload = {
    slug: SLUG,
    table_number: 42,
    session_token: sessionToken,
    idempotency_key: raceKey,
    items: [{ product_id: legitProduct1.id, quantity: 1 }],
  }

  const racePromises = Array.from({ length: 10 }, () =>
    fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(racePayload),
    }).then(async r => ({ status: r.status, data: await r.json() }))
  )

  const raceResults = await Promise.all(racePromises)
  const allStatus200 = raceResults.every(r => r.status === 200 && r.data.success === true)
  const uniqueOrderIds = new Set(raceResults.map(r => r.data.order?.id))
  const idempotentCount = raceResults.filter(r => r.data.idempotent === true).length

  assert(
    allStatus200,
    'Las 10 peticiones concurrentes simultáneas respondieron con HTTP 200 OK',
    `Éxitos: ${raceResults.filter(r => r.status === 200).length}/10`
  )
  assert(
    uniqueOrderIds.size === 1,
    `Bloqueo atómico perfecto: Se generó exactamente 1 único pedido (#${[...uniqueOrderIds][0]}) para las 10 llamadas concurrentes`,
    `IDs únicos detectados: ${uniqueOrderIds.size}`
  )
  assert(
    idempotentCount === 9,
    `Exactamente 9 de las 10 peticiones fueron resueltas como reintentos concurrentes idempotentes`,
    `Idempotentes: ${idempotentCount}/10`
  )

  // ============================================================================
  // CHALLENGE 3: RLS & ADMIN AUTH CHALLENGE
  // ============================================================================
  console.log(`\n${COLORS.bold}▶ RETO 3: Desafío de Autenticación Admin, Manipulación de Cookies y RBAC${COLORS.reset}`)

  // 3.1 Solicitud POST no autenticada a /api/admin/menu
  const unauthPostRes = await fetch(`${BASE_URL}/api/admin/menu`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slug: SLUG, type: 'category', data: { name: 'Hacked Category' } }),
  })
  const unauthPostData = await unauthPostRes.json()

  assert(
    unauthPostRes.status === 401 && unauthPostData.success === false,
    'POST /api/admin/menu sin autenticación es rechazado con HTTP 401 Unauthorized',
    `Status: ${unauthPostRes.status}, Error: ${unauthPostData.error}`
  )

  // 3.2 Solicitud PATCH no autenticada a /api/admin/menu
  const unauthPatchRes = await fetch(`${BASE_URL}/api/admin/menu`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slug: SLUG, product_id: legitProduct1.id, is_available: false }),
  })
  const unauthPatchData = await unauthPatchRes.json()

  assert(
    unauthPatchRes.status === 401 && unauthPatchData.success === false,
    'PATCH /api/admin/menu sin autenticación es rechazado con HTTP 401 Unauthorized',
    `Status: ${unauthPatchRes.status}, Error: ${unauthPatchData.error}`
  )

  // 3.3 Solicitud DELETE no autenticada a /api/admin/menu
  const unauthDeleteRes = await fetch(`${BASE_URL}/api/admin/menu?slug=${SLUG}&type=product&id=${legitProduct1.id}`, {
    method: 'DELETE',
  })
  const unauthDeleteData = await unauthDeleteRes.json()

  assert(
    unauthDeleteRes.status === 401 && unauthDeleteData.success === false,
    'DELETE /api/admin/menu sin autenticación es rechazado con HTTP 401 Unauthorized',
    `Status: ${unauthDeleteRes.status}, Error: ${unauthDeleteData.error}`
  )

  // 3.4 Ataque de Manipulación de Cookie de Staff (Tampered Signature / Fake HMAC)
  const fakeToken = Buffer.from(`${SLUG}:admin:${Date.now()}`).toString('base64url') + '.deadbeefcafebabefake1234567890abcdef'
  const tamperedCookieRes = await fetch(`${BASE_URL}/api/admin/menu`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: `staff_session_${SLUG}_admin=${fakeToken}`,
    },
    body: JSON.stringify({ slug: SLUG, type: 'category', data: { name: 'Forged Cookie Category' } }),
  })
  const tamperedData = await tamperedCookieRes.json()

  assert(
    tamperedCookieRes.status === 401,
    'Cookie con firma HMAC manipulada/falsificada es detectada y rechazada con HTTP 401',
    `Status: ${tamperedCookieRes.status}`
  )

  // 3.5 Intento de Escalada de Privilegios: Usar sesión de mozo (comandero) para mutación exclusiva de admin (POST / DELETE)
  // Primero loguear legítimamente como mozo para obtener cookie válida de comandero
  const waiterLoginRes = await fetch(`${BASE_URL}/api/staff/verify-pin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slug: SLUG, role: 'comandero', pin: '1234' }),
  })
  const waiterSetCookie = waiterLoginRes.headers.get('set-cookie') || ''
  const waiterTokenMatch = waiterSetCookie.match(/staff_session_burger-gourmet_comandero=([^;]+)/)
  const waiterToken = waiterTokenMatch ? waiterTokenMatch[1] : null

  assert(
    waiterLoginRes.status === 200 && waiterToken !== null,
    'Login legítimo de Mozo (PIN 1234) obtiene token firmado de rol comandero',
    `Token obtenido: ${Boolean(waiterToken)}`
  )

  // Intentar crear categoría en /api/admin/menu con token de comandero (requiere admin)
  const escalationRes = await fetch(`${BASE_URL}/api/admin/menu`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: `staff_session_${SLUG}_comandero=${waiterToken}`,
    },
    body: JSON.stringify({ slug: SLUG, type: 'category', data: { name: 'Escalation Attempt' } }),
  })
  const escalationData = await escalationRes.json()

  assert(
    escalationRes.status === 401,
    'Escalada de privilegios bloqueada: Rol comandero es rechazado con HTTP 401 en endpoints de admin',
    `Status: ${escalationRes.status}`
  )

  // 3.6 Autenticación Legítima de Administrador (PIN '9999' o header x-staff-pin: '9999')
  const validAdminRes = await fetch(`${BASE_URL}/api/admin/menu`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'x-staff-pin': '9999',
    },
    body: JSON.stringify({
      slug: SLUG,
      product_id: legitProduct1.id,
      is_available: legitProduct1.is_available,
    }),
  })
  const validAdminData = await validAdminRes.json()

  assert(
    validAdminRes.status === 200 && validAdminData.success === true,
    'Petición administrativa con autenticación legítima de admin es autorizada con HTTP 200 OK',
    `Status: ${validAdminRes.status}, Success: ${validAdminData.success}`
  )

  // ============================================================================
  // SUMMARY
  // ============================================================================
  console.log(`\n${COLORS.bold}${COLORS.cyan}================================================================================${COLORS.reset}`)
  console.log(`${COLORS.bold}${COLORS.cyan} RESUMEN DE EJECUCIÓN ADVERSARIAL CHALLENGER 1 ${COLORS.reset}`)
  console.log(`${COLORS.bold}${COLORS.cyan}================================================================================${COLORS.reset}`)
  console.log(`  Total Desafíos: ${passed + failed}`)
  console.log(`  ${COLORS.green}Superados:      ${passed}${COLORS.reset}`)
  console.log(`  ${COLORS.red}Fallidos:       ${failed}${COLORS.reset}`)

  if (failed === 0) {
    console.log(`\n${COLORS.green}${COLORS.bold}🏆 VEREDICTO: TODOS LOS INVARIANTES EMPÍRICOS SUPERADOS AL 100% (PASS)${COLORS.reset}\n`)
    process.exit(0)
  } else {
    console.error(`\n${COLORS.red}${COLORS.bold}❌ VEREDICTO: SE ENCONTRARON VULNERABILIDADES / FALLOS EN LOS DESAFÍOS${COLORS.reset}\n`)
    process.exit(1)
  }
}

runChallenges().catch(err => {
  console.error('Error no capturado durante el reto adversarial:', err)
  process.exit(1)
})
