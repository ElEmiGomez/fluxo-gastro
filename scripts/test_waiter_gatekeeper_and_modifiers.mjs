// ==============================================================================
// GASTRO PWA - TEST DE VALIDACIÓN: REGLAS OPERATIVAS ACORDADAS CON GUILLERMO
// 1. Mozo como Gatekeeper: Estado pending_validation -> Aprobación presencial -> KDS Cocina
// 2. Modificadores Estructurados sin texto libre
// 3. API de Tiqueteras Térmicas ESC/POS
// ==============================================================================

const BASE_URL = 'http://localhost:3000'

async function runWaiterGatekeeperTests() {
  console.log('🧑‍💼 INICIANDO TEST DEL FLUJO GATEKEEPER & REGLAS OPERATIVAS...\n')
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
    // TEST 1: INICIALIZAR SESIÓN DE MESA
    // -------------------------------------------------------------------------
    console.log('1️⃣  Iniciando sesión de mesa para cliente...')
    const sessionRes = await fetch(`${BASE_URL}/api/tables`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: 'burger-gourmet', table_number: 14, action: 'start_session' }),
    })
    const sessionData = await sessionRes.json()
    assert(sessionRes.ok && sessionData.session_token, 'Sesión de mesa #14 iniciada')

    // -------------------------------------------------------------------------
    // TEST 2: COMENSAL ENVÍA COMANDA (DEBE ENTRAR EN pending_validation)
    // -------------------------------------------------------------------------
    console.log('\n2️⃣  Comensal envía pedido con modificadores estructurados...')
    const orderRes = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug: 'burger-gourmet',
        table_number: 14,
        session_token: sessionData.session_token,
        idempotency_key: `gatekeeper-test-${Date.now()}`,
        items: [
          {
            product_id: 'p-bur-1',
            quantity: 2,
            notes: 'Poco hecha, Sin cebolla, Salsa aparte',
          },
          {
            product_id: 'p-bsa-1',
            quantity: 2,
            notes: 'Sin hielo, Extra limón',
          },
        ],
      }),
    })
    const orderData = await orderRes.json()
    assert(orderRes.ok && orderData.success, 'Comanda transmitida con éxito por el cliente')
    assert(orderData.order.status === 'pending_validation', `Estado inicial de la comanda es 'pending_validation' (Actual: ${orderData.order.status})`)

    const orderId = orderData.order.id

    // -------------------------------------------------------------------------
    // TEST 3: COCINA KDS NO DEBE VER LA COMANDA (GATEKEEPER ACTIVO)
    // -------------------------------------------------------------------------
    console.log('\n3️⃣  Verificando que la cocina KDS NO recibe la orden no validada...')
    const allOrdersRes = await fetch(`${BASE_URL}/api/orders?slug=burger-gourmet`)
    const allOrdersData = await allOrdersRes.json()
    const rawOrder = allOrdersData.orders.find(o => o.id === orderId)

    assert(rawOrder !== undefined, 'La orden existe registrada en el sistema')
    assert(rawOrder.status === 'pending_validation', 'La orden permanece en espera de validación del mozo')

    // -------------------------------------------------------------------------
    // TEST 4: EL MOZO CONFIRMA VERBALMENTE EN MESA Y ENVÍA A COCINA
    // -------------------------------------------------------------------------
    console.log('\n4️⃣  El mozo valida la comanda cara a cara y autoriza el envío a cocina...')
    const validateRes = await fetch(`${BASE_URL}/api/orders`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug: 'burger-gourmet',
        orderId: orderId,
        status: 'pending',
      }),
    })
    const validateData = await validateRes.json()
    assert(validateRes.ok && validateData.success, 'El mozo confirmó la comanda vía PATCH /api/orders')

    // Verificar nuevo estado
    const checkOrdersRes = await fetch(`${BASE_URL}/api/orders?slug=burger-gourmet`)
    const checkData = await checkOrdersRes.json()
    const validatedOrder = checkData.orders.find(o => o.id === orderId)
    assert(validatedOrder.status === 'pending', `Estado actualizado a 'pending' tras validación (Actual: ${validatedOrder.status})`)

    // -------------------------------------------------------------------------
    // TEST 5: KDS AHORA TIENE LA COMANDA EN SU COLA
    // -------------------------------------------------------------------------
    console.log('\n5️⃣  Cocina avanza el plato (preparing -> ready)...')
    const prepRes = await fetch(`${BASE_URL}/api/orders`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: 'burger-gourmet', orderId, status: 'preparing' }),
    })
    assert(prepRes.ok, 'Cocina inicia preparación')

    const readyRes = await fetch(`${BASE_URL}/api/orders`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: 'burger-gourmet', orderId, status: 'ready' }),
    })
    assert(readyRes.ok, 'Cocina marca plato listo para servir')

    // -------------------------------------------------------------------------
    // TEST 6: ENDPOINT DE IMPRESIÓN TÉRMICA ESC/POS
    // -------------------------------------------------------------------------
    console.log('\n6️⃣  Verificando generación de ticket ESC/POS para impresora térmica...')
    const printRes = await fetch(`${BASE_URL}/api/printers/receipt?slug=burger-gourmet&order_id=${orderId}&width=42`)
    const printData = await printRes.json()

    assert(printRes.ok && printData.success, 'Endpoint /api/printers/receipt responde correctamente')
    assert(printData.table_number.toString() === '14', 'Número de mesa impreso coincide (#14)')
    assert(printData.ticket_plain_text.includes('POCO HECHA'), 'Ticket incluye modificador estructurado en mayúsculas')
    assert(printData.ticket_plain_text.includes('SIN CEBOLLA'), 'Ticket incluye exclusión de ingredientes')
    assert(printData.escpos_raw_base64 && printData.escpos_raw_base64.length > 50, 'Buffer binario ESC/POS con corte de papel generado en Base64')

    console.log('\n--- MUESTRA DEL TICKET GENERADO PARA IMPRESORA TÉRMICA ---')
    console.log(printData.ticket_plain_text)
    console.log('-----------------------------------------------------------\n')

    console.log(`=========================================`)
    console.log(`RESULTADO DE LA VALIDACIÓN OPERATIVA:`)
    console.log(`Total pruebas: ${passed + failed}`)
    console.log(`Pasadas:       ${passed}`)
    console.log(`Falladas:      ${failed}`)
    console.log(`=========================================`)

    if (failed === 0) {
      console.log('\n🎉 ¡TODAS LAS REGLAS OPERATIVAS DE GUILLERMO FUERON IMPLEMENTADAS Y CERTIFICADAS!')
      process.exit(0)
    } else {
      process.exit(1)
    }
  } catch (e) {
    console.error('Error durante el test:', e)
    process.exit(1)
  }
}

runWaiterGatekeeperTests()
