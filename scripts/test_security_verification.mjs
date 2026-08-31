// ==============================================================================
// GASTRO PWA - TEST SUITE DE VERIFICACIÓN DE MEDIDAS DE SEGURIDAD
// ==============================================================================

const BASE_URL = 'http://localhost:3000'

async function runSecurityTests() {
  console.log('🔒 INICIANDO CERTIFICACIÓN DE SEGURIDAD Y NORMATIVAS...\n')
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
    // TEST 1: HTTP Security Headers
    // -------------------------------------------------------------------------
    console.log('1️⃣  Verificando Cabeceras HTTP de Seguridad...')
    const headRes = await fetch(`${BASE_URL}/menu/burger-gourmet?table=1`)
    const headers = headRes.headers

    assert(
      headers.get('x-frame-options') === 'SAMEORIGIN',
      'X-Frame-Options: SAMEORIGIN (Protección contra Clickjacking)',
      `Actual: ${headers.get('x-frame-options')}`
    )
    assert(
      headers.get('x-content-type-options') === 'nosniff',
      'X-Content-Type-Options: nosniff (Protección contra MIME sniffing)',
      `Actual: ${headers.get('x-content-type-options')}`
    )
    assert(
      headers.get('referrer-policy')?.includes('strict-origin'),
      'Referrer-Policy: strict-origin-when-cross-origin',
      `Actual: ${headers.get('referrer-policy')}`
    )
    assert(
      headers.get('permissions-policy')?.includes('microphone=()'),
      'Permissions-Policy: Bloqueo de micrófono no autorizado',
      `Actual: ${headers.get('permissions-policy')}`
    )

    // -------------------------------------------------------------------------
    // TEST 2: Table Session Tokens & Anti-Overlap Protection
    // -------------------------------------------------------------------------
    console.log('\n2️⃣  Verificando Protección Anti-Solapamiento de Sesiones de Mesa...')

    // 2.1 Obtener sesión inicial
    const tablesRes = await fetch(`${BASE_URL}/api/tables?slug=burger-gourmet`).then(r => r.json())
    const initialSessions = tablesRes.sessions || {}
    let table12Session = initialSessions['12']

    // Ocupar mesa 12 si no lo está
    const occRes = await fetch(`${BASE_URL}/api/tables`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: 'burger-gourmet', table_number: 12, action: 'occupy' }),
    }).then(r => r.json())

    const validSessionId = occRes.session?.session_id
    assert(Boolean(validSessionId), 'Sesión de mesa 12 inicializada con token seguro')

    // 2.2 Enviar orden con token válido
    const orderPayload = {
      slug: 'burger-gourmet',
      table_number: 12,
      session_id: validSessionId,
      items: [
        {
          product_id: 'p-promo-1',
          quantity: 1,
          notes: 'Cliente presente en la mesa',
        },
      ],
    }

    const orderRes = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderPayload),
    })
    const orderData = await orderRes.json()

    assert(orderRes.status === 200 && orderData.success, 'Comanda transmitida exitosamente con token válido')

    // 2.3 Mozo libera la mesa
    const freeRes = await fetch(`${BASE_URL}/api/tables`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: 'burger-gourmet', table_number: 12, action: 'free' }),
    }).then(r => r.json())

    assert(freeRes.success, 'El mozo libera la Mesa #12 y anula la sesión anterior')

    // 2.4 El cliente viejo desde su casa intenta mandar pedido con el token caducado
    const staleOrderRes = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderPayload), // usa validSessionId que fue revocado
    })
    const staleData = await staleOrderRes.json()

    assert(
      staleOrderRes.status === 403 && staleData.error === 'SESSION_EXPIRED',
      'Bloqueo de solapamiento: Pedido con sesión expirada fue rechazado con 403 SESSION_EXPIRED',
      `Status: ${staleOrderRes.status}`
    )

    // -------------------------------------------------------------------------
    // TEST 3: Anti-XSS Sanitization
    // -------------------------------------------------------------------------
    console.log('\n3️⃣  Verificando Sanitización Anti-XSS en comanda...')

    // Re-ocupar mesa con sesión nueva
    const reOccRes = await fetch(`${BASE_URL}/api/tables`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: 'burger-gourmet', table_number: 12, action: 'occupy' }),
    }).then(r => r.json())

    const newSessionId = reOccRes.session?.session_id

    const xssPayload = {
      slug: 'burger-gourmet',
      table_number: 12,
      session_id: newSessionId,
      items: [
        {
          product_id: 'p-promo-1',
          quantity: 1,
          notes: '<script>alert("HACK")</script>Sin cebolla <img src=x onerror=alert(1)> y bien cocido',
        },
      ],
    }

    const xssOrderRes = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(xssPayload),
    }).then(r => r.json())

    const sanitizedNotes = xssOrderRes.order?.order_items?.[0]?.notes
    assert(
      sanitizedNotes && !sanitizedNotes.includes('<script>') && !sanitizedNotes.includes('<img'),
      'Sanitización anti-XSS: Etiquetas HTML/scripts fueron eliminadas de las notas',
      `Notas resultantes: "${sanitizedNotes}"`
    )

    // -------------------------------------------------------------------------
    // TEST 4: Limpieza final del sistema
    // -------------------------------------------------------------------------
    console.log('\n4️⃣  Limpiando órdenes de prueba...')
    await fetch(`${BASE_URL}/api/orders?slug=burger-gourmet`, { method: 'DELETE' })
    await fetch(`${BASE_URL}/api/service-calls?slug=burger-gourmet`, { method: 'DELETE' })
    await fetch(`${BASE_URL}/api/tables?slug=burger-gourmet`, { method: 'DELETE' })
    console.log('  🧹 Sistema purgado y limpio a 0 órdenes de prueba.')

    console.log(`\n=========================================`)
    console.log(`RESULTADO DE LA CERTIFICACIÓN:`)
    console.log(`Total pruebas: ${passed + failed}`)
    console.log(`Pasadas:       ${passed}`)
    console.log(`Falladas:      ${failed}`)
    console.log(`=========================================`)

    if (failed === 0) {
      console.log('\n🎉 ¡TODAS LAS MEDIDAS DE SEGURIDAD ESTÁN ACTIVAS Y FUNCIONANDO AL 100%!')
      process.exit(0)
    } else {
      process.exit(1)
    }
  } catch (err) {
    console.error('Error durante la ejecución de pruebas:', err)
    process.exit(1)
  }
}

runSecurityTests()
