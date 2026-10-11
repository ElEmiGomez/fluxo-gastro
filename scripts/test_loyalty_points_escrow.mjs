// scripts/test_loyalty_points_escrow.mjs
// Test automatizado de certificación: Tarjeta de Fidelización Digital y Escrow de Puntos

const BASE_URL = 'http://localhost:3000'
const SLUG = 'burger-gourmet'

async function run() {
  console.log('========================================================================')
  console.log('🧪 TEST CERTIFICACIÓN: SISTEMA DE FIDELIZACIÓN DIGITAL Y SALDO RETENIDO')
  console.log('========================================================================\n')

  let passed = 0
  let failed = 0

  function assert(desc, condition) {
    if (condition) {
      console.log(`  ✅ [PASS] ${desc}`)
      passed++
    } else {
      console.error(`  ❌ [FAIL] ${desc}`)
      failed++
    }
  }

  // 1. Registro de comensal zero-fricción
  console.log('👉 Paso 1: Registro Zero-Fricción de comensal...')
  const testEmail = `comensal_${Date.now()}@fluxo-test.com`
  const regRes = await fetch(`${BASE_URL}/api/loyalty/profile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      slug: SLUG,
      name: 'Elena Test',
      email: testEmail,
      phone: '+34 600 999 888',
    }),
  }).then(r => r.json())

  assert('Registro exitoso de perfil', regRes.success === true && regRes.profile)
  assert('Perfil tiene 0 puntos iniciales', regRes.profile.total_points === 0 && regRes.profile.available_points === 0)
  assert('No tiene bonus de Google Maps previamente otorgado', regRes.profile.google_review_bonus_awarded === false)

  // 2. Consulta de catálogo de recompensas
  console.log('\n👉 Paso 2: Consulta del Catálogo de Recompensas...')
  const rewRes = await fetch(`${BASE_URL}/api/loyalty/rewards?slug=${SLUG}`).then(r => r.json())
  assert('Catálogo de premios obtenido con éxito', rewRes.success === true && Array.isArray(rewRes.rewards))
  assert('Existe premio de Café (20 pts)', rewRes.rewards.some(r => r.points_cost === 20))
  assert('Existe premio de Bebida (15 o 25 pts)', rewRes.rewards.some(r => r.points_cost === 15 || r.points_cost === 25))
  assert('Existe premio de Postre (35 pts)', rewRes.rewards.some(r => r.points_cost === 35))

  // 3. Consulta de perfil existente con saldo pre-cargado (ej. Carlos con 60 pts)
  console.log('\n👉 Paso 3: Consulta de perfil existente con puntos acumulados (Carlos Gómez)...')
  // Liberar cualquier hold pendiente de ejecuciones previas
  await fetch(`${BASE_URL}/api/loyalty/escrow`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slug: SLUG, action: 'release', email: 'carlos@ejemplo.com' }),
  }).catch(() => {})

  const carlosRes = await fetch(`${BASE_URL}/api/loyalty/profile?slug=${SLUG}&email=carlos@ejemplo.com`).then(r => r.json())
  assert('Perfil de Carlos recuperado', carlosRes.success === true && carlosRes.profile)
  const initialPoints = carlosRes.profile.total_points
  assert('Carlos tiene saldo positivo inicial', initialPoints >= 20)
  assert('Carlos tiene 0 puntos retenidos inicialmente', carlosRes.profile.held_points === 0)
  assert('Carlos tiene puntos disponibles iguales a totales', carlosRes.profile.available_points === initialPoints)

  // 4. Retención de saldo (Escrow): Canjear café (20 pts)
  console.log('\n👉 Paso 4: Canje de plato con saldo retenido (Escrow Hold de 20 pts)...')
  const startTableRes = await fetch(`${BASE_URL}/api/tables`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slug: SLUG, table_number: 12, action: 'start_session' }),
  }).then(r => r.json())
  const sessionToken = startTableRes.session_token || `sess_test_${Date.now()}`
  const holdRes = await fetch(`${BASE_URL}/api/loyalty/escrow`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      slug: SLUG,
      action: 'hold',
      email: 'carlos@ejemplo.com',
      points: 20,
      tableNumber: 12,
      sessionToken,
      productId: 'p-caf-1',
    }),
  }).then(r => r.json())

  assert('Operación de retención exitosa', holdRes.success === true)
  assert('Puntos retenidos en perfil son 20 pts', holdRes.profile.held_points === 20)
  assert('Puntos disponibles bajaron en 20 pts', holdRes.profile.available_points === initialPoints - 20)
  assert('Puntos totales se mantienen invariables en base de datos', holdRes.profile.total_points === initialPoints)

  // 5. Cancelación de plato: Liberar puntos retenidos
  console.log('\n👉 Paso 5: Liberación de saldo retenido (Release Escrow)...')
  const releaseRes = await fetch(`${BASE_URL}/api/loyalty/escrow`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      slug: SLUG,
      action: 'release',
      email: 'carlos@ejemplo.com',
      points: 20,
      tableNumber: 12,
      holdId: holdRes.hold?.id,
    }),
  }).then(r => r.json())

  assert('Operación de liberación exitosa', releaseRes.success === true)
  assert('Puntos retenidos vuelven a 0 pts', releaseRes.profile.held_points === 0)
  assert('Puntos disponibles se restablecen al total', releaseRes.profile.available_points === initialPoints)

  // 6. Nueva retención y Creación de Comanda con ítem de canje
  console.log('\n👉 Paso 6: Nueva retención y creación de comanda en mesa 12...')
  await fetch(`${BASE_URL}/api/loyalty/escrow`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      slug: SLUG,
      action: 'hold',
      email: 'carlos@ejemplo.com',
      points: 20,
      tableNumber: 12,
      sessionToken,
      productId: 'p-caf-1',
    }),
  })

  // Crear comanda con 1 Burger de pago (12,50 €) + 1 Café de canje (0,00 €)
  const orderRes = await fetch(`${BASE_URL}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      slug: SLUG,
      table_number: 12,
      session_token: sessionToken,
      loyalty_email: 'carlos@ejemplo.com',
      items: [
        {
          product_id: 'p-bur-1',
          name: 'Burger Clásica',
          price: 12.5,
          quantity: 1,
        },
        {
          product_id: 'p-caf-1',
          name: 'Café de Especialidad',
          price: 0,
          quantity: 1,
          is_complimentary: true,
          loyalty_points_redeemed: 20,
          notes: '[🎁 Canje Fidelización: -20 pts]',
        },
      ],
    }),
  }).then(r => r.json())

  assert('Comanda creada con éxito', orderRes.success === true && Boolean(orderRes.order))
  assert('Importe total cobra solo el ítem no bonificado oficial del catálogo (14.50 €)', orderRes.order?.total_amount === 14.5)

  // 7. Cobro y Liberación de mesa (Liquidación definitiva de puntos)
  console.log('\n👉 Paso 7: Cobro y Cierre de mesa con Liquidación de Fidelización...')
  const closeRes = await fetch(`${BASE_URL}/api/tables`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      slug: SLUG,
      table_number: 12,
      action: 'close_session',
      payment_method: 'card',
      final_amount: 14.5,
    }),
  }).then(r => r.json())

  assert('Cierre de mesa exitoso', closeRes.success === true)

  // Comprobar saldo final de Carlos tras el cobro:
  // Menos 20 pts canjeados del café
  // Más 14 pts ganados por los 14.20€ pagados
  const expectedAfterSettle = initialPoints - 20 + 14
  const carlosFinalRes = await fetch(`${BASE_URL}/api/loyalty/profile?slug=${SLUG}&email=carlos@ejemplo.com`).then(r => r.json())
  assert('Perfil de Carlos actualizado tras cobro', carlosFinalRes.success === true && carlosFinalRes.profile)
  assert('Puntos retenidos vuelven a 0 tras liquidar la sesión', carlosFinalRes.profile.held_points === 0)
  assert(`Puntos totales debitan canje (-20) y acreditan consumo (+14) -> ${expectedAfterSettle} pts`, carlosFinalRes.profile.total_points === expectedAfterSettle)
  assert('Puntos disponibles coinciden con totales', carlosFinalRes.profile.available_points === expectedAfterSettle)

  // 8. Google Maps Review Booster (+50 Puntos Extra de un solo uso en Elena Test)
  console.log('\n👉 Paso 8: Google Maps Review Booster (+50 pts bonus en Elena)...')
  const bonusRes = await fetch(`${BASE_URL}/api/loyalty/google-review-bonus`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      slug: SLUG,
      email: testEmail,
    }),
  }).then(r => r.json())

  assert('Bonus de Google Maps otorgado con éxito a Elena', bonusRes.success === true && bonusRes.bonus_points === 50)
  assert('Nuevo total de Elena con bonus: 0 + 50 = 50 pts', bonusRes.new_total_points === 50)

  // Intentar reclamar de nuevo el bonus (debe ser rechazado)
  const duplicateBonusRes = await fetch(`${BASE_URL}/api/loyalty/google-review-bonus`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      slug: SLUG,
      email: testEmail,
    }),
  }).then(r => r.json())

  assert('Segundo intento de bonus es rechazado (un solo uso por comensal)', duplicateBonusRes.success === false)

  console.log('\n========================================================================')
  console.log(`📊 RESULTADO FINAL: ${passed} PASSED | ${failed} FAILED`)
  console.log('========================================================================')

  if (failed > 0) {
    process.exit(1)
  }
}

run().catch(err => {
  console.error('Fatal error in loyalty test:', err)
  process.exit(1)
})
