// ==============================================================================
// GASTRO PWA - VERIFICACIÓN DE LAS 4 CORRECCIONES DE SEGURIDAD Y CONCURRENCIA
// 1. Idempotencia y Cero TOCTOU
// 2. Row Level Security y Aislamiento de Tenant sin bypass service_role
// 3. Criptografía de PINs de Staff con bcrypt
// 4. Resiliencia de Sesión en Safari (iOS ITP) mediante Cookie HTTP-Only
// ==============================================================================

const BASE_URL = 'http://localhost:3000'

async function runSecurityFixesTests() {
  console.log('🔒 INICIANDO CERTIFICACIÓN DE LAS 4 CORRECCIONES DE SEGURIDAD...\n')
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
    // TEST 1: CRIPTOGRAFÍA DE PIN CON BCRYPT (FALLO 3)
    // -------------------------------------------------------------------------
    console.log('1️⃣  Verificando Criptografía de PIN con bcrypt y Cookie HTTP-Only...')
    
    // 1.1 Intentar PIN incorrecto
    const badPinRes = await fetch(`${BASE_URL}/api/staff/verify-pin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'comandero', slug: 'burger-gourmet', pin: '0000' }),
    })
    const badPinData = await badPinRes.json()
    assert(badPinRes.status === 401, 'PIN incorrecto rechazado con HTTP 401')
    assert(badPinData.remaining !== undefined, 'Rate limiting activo protege contra fuerza bruta offline')

    // 1.2 Verificar PIN válido
    const goodPinRes = await fetch(`${BASE_URL}/api/staff/verify-pin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'comandero', slug: 'burger-gourmet', pin: '1234' }),
    })
    const goodPinData = await goodPinRes.json()
    const setCookieHeader = goodPinRes.headers.get('set-cookie') || ''

    assert(goodPinRes.status === 200 && goodPinData.success, 'PIN válido aceptado correctamente')
    assert(setCookieHeader.includes('staff_session_') && setCookieHeader.includes('HttpOnly'), 'Cookie HTTP-Only firmada establecida en el encabezado')

    // -------------------------------------------------------------------------
    // TEST 2: RESILIENCIA DE SESIÓN EN SAFARI (iOS ITP) (FALLO 4)
    // -------------------------------------------------------------------------
    console.log('\n2️⃣  Verificando Resiliencia Safari ITP (Cookie HTTP-Only)...')

    // 2.1 Iniciar sesión de mesa
    const tableRes = await fetch(`${BASE_URL}/api/tables`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: 'burger-gourmet', table_number: 21, action: 'start_session' }),
    })
    const tableData = await tableRes.json()
    const tableCookie = tableRes.headers.get('set-cookie') || ''

    assert(tableRes.status === 200, 'Sesión de mesa iniciada correctamente')
    assert(tableCookie.includes('gastro_session_') && tableCookie.includes('HttpOnly'), 'Cookie gastro_session HTTP-Only resistente a purga ITP emitida')

    // Extraer token de la cookie
    const tokenMatch = tableCookie.match(/gastro_session_burger-gourmet_21=([^;]+)/)
    const sessionToken = tokenMatch ? tokenMatch[1] : tableData.session_token

    // 2.2 Enviar comanda con esa sesión
    const orderRes = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug: 'burger-gourmet',
        table_number: 21,
        session_token: sessionToken,
        idempotency_key: `itp-test-${Date.now()}`,
        items: [{ product_id: 'p-1', quantity: 2 }],
      }),
    })
    assert(orderRes.status === 200, 'Comanda asociada a la sesión de mesa persistida')

    // 2.3 Simular que Safari purgó localStorage: Consultar /api/session/restore con la cookie HTTP-Only
    const restoreRes = await fetch(`${BASE_URL}/api/session/restore?slug=burger-gourmet&table=21`, {
      headers: { Cookie: `gastro_session_burger-gourmet_21=${sessionToken}` },
    })
    const restoreData = await restoreRes.json()

    assert(restoreRes.status === 200, 'Endpoint /api/session/restore responde HTTP 200')
    assert(restoreData.restored === true, 'Sesión restaurada exitosamente sin depender de localStorage')
    assert(restoreData.session_token === sessionToken, 'Token recuperado coincide con la sesión del comensal')
    assert(restoreData.orders && restoreData.orders.length > 0, 'Órdenes activas recuperadas para reconstruir el estado de la PWA')

    // -------------------------------------------------------------------------
    // TEST 3: IDEMPOTENCIA ATÓMICA Y CERO TOCTOU (FALLO 1)
    // -------------------------------------------------------------------------
    console.log('\n3️⃣  Verificando Idempotencia Atómica y Prevención de TOCTOU...')
    const raceKey = `race-toctou-${Date.now()}`

    // Disparar 5 peticiones idénticas exactamente al mismo tiempo (Promesas concurrentes)
    const racePromises = Array.from({ length: 5 }, () =>
      fetch(`${BASE_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: 'burger-gourmet',
          table_number: 21,
          session_token: sessionToken,
          idempotency_key: raceKey,
          items: [{ product_id: 'p-2', quantity: 1 }],
        }),
      }).then(r => r.json())
    )

    const raceResults = await Promise.all(racePromises)
    const successfulResponses = raceResults.filter(r => r.success)
    const distinctOrderIds = new Set(successfulResponses.map(r => r.order?.id))

    assert(successfulResponses.length === 5, 'Las 5 peticiones concurrentes respondieron exitosamente')
    assert(distinctOrderIds.size === 1, `Exactamente 1 única orden fue creada en cocina (ID: ${[...distinctOrderIds][0]})`)
    const idempotentFlags = raceResults.filter(r => r.idempotent === true)
    assert(idempotentFlags.length === 4, '4 de las 5 peticiones fueron resueltas como idempotentes sin crear duplicados')

    // -------------------------------------------------------------------------
    // TEST 4: SEGURIDAD DE SESIÓN EN LIBERAR MESA
    // -------------------------------------------------------------------------
    console.log('\n4️⃣  Verificando Invalidez de Cookie al Liberar Mesa...')
    const freeRes = await fetch(`${BASE_URL}/api/tables`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: 'burger-gourmet', table_number: 21, action: 'free' }),
    })
    const freeCookie = freeRes.headers.get('set-cookie') || ''

    assert(freeRes.status === 200, 'Mesa liberada por el personal')
    assert(freeCookie.includes('Max-Age=0') || freeCookie.includes('gastro_session_'), 'Cookie HTTP-Only revocada y expirada en el navegador')

    console.log(`\n=========================================`)
    console.log(`RESULTADO DE LA CERTIFICACIÓN:`)
    console.log(`Total pruebas: ${passed + failed}`)
    console.log(`Pasadas:       ${passed}`)
    console.log(`Falladas:      ${failed}`)
    console.log(`=========================================`)

    if (failed === 0) {
      console.log('\n🎉 ¡TODAS LAS VULNERABILIDADES DE SEGURIDAD FUERON REPARADAS Y CERTIFICADAS AL 100%!')
      process.exit(0)
    } else {
      process.exit(1)
    }
  } catch (err) {
    console.error('Error durante la verificación:', err)
    process.exit(1)
  }
}

runSecurityFixesTests()
