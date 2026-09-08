// ==============================================================================
// CHALLENGER 2 — ADVERSARIAL LIFECYCLE, OCC CONCURRENCY & MULTI-ROUND ISOLATION
// ==============================================================================
// Rigorous empirical verification of:
// 1. Order Lifecycle State Machine (Legal progression + Illegal jumps & regressions)
// 2. Optimistic Concurrency Control (OCC), version increment, HTTP 409 on stale version
// 3. High-concurrency race condition stress (parallel PATCH with same expected_version)
// 4. Multi-Round Isolation by UUID on the same table (zero table-level cross-talk)
// ==============================================================================

import assert from 'node:assert/strict'

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:3000'
const SLUG = 'burger-gourmet'

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  bold: '\x1b[1m',
}

let totalTests = 0
let passedTests = 0
let failedTests = 0

function runCheck(name, fn) {
  totalTests++
  try {
    fn()
    passedTests++
    console.log(`  ${COLORS.green}✔ [PASS]${COLORS.reset} ${name}`)
  } catch (err) {
    failedTests++
    console.error(`  ${COLORS.red}✖ [FAIL]${COLORS.reset} ${name}`)
    console.error(`     Reason: ${err.message}`)
    throw err
  }
}

async function api(path, options = {}) {
  const url = `${BASE_URL}${path}`
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })
  let data = null
  try {
    data = await res.json()
  } catch (e) {
    data = null
  }
  return { status: res.status, data, headers: res.headers }
}

async function main() {
  console.log(`${COLORS.bold}${COLORS.cyan}================================================================================${COLORS.reset}`)
  console.log(`${COLORS.bold}${COLORS.cyan} ⚔️ CHALLENGER 2: ADVERSARIAL LIFECYCLE, OCC & MULTI-ROUND ISOLATION HARNESS ${COLORS.reset}`)
  console.log(`${COLORS.cyan} Base URL: ${BASE_URL} | Slug: ${SLUG}${COLORS.reset}`)
  console.log(`${COLORS.bold}${COLORS.cyan}================================================================================\n${COLORS.reset}`)

  // ---------------------------------------------------------------------------
  // 1. LIFECYCLE TRANSITIONS: LEGAL PROGRESSION & ILLEGAL REJECTIONS
  // ---------------------------------------------------------------------------
  console.log(`${COLORS.bold}${COLORS.blue}▶ PHASE 1: State Machine Lifecycle Transitions & Illegal Jump Rejections${COLORS.reset}`)

  const tableNum1 = 81
  const sess1Res = await api('/api/tables', {
    method: 'POST',
    body: JSON.stringify({ slug: SLUG, table_number: tableNum1, action: 'start_session' }),
  })
  runCheck('Mesa 81: Sesión inicial creada para comanda diner', () => {
    assert.strictEqual(sess1Res.status, 200)
    assert.ok(sess1Res.data?.session_token)
  })
  const token1 = sess1Res.data.session_token

  // 1.1 Crear comanda como comensal
  const createO1 = await api('/api/orders', {
    method: 'POST',
    body: JSON.stringify({
      slug: SLUG,
      table_number: tableNum1,
      session_token: token1,
      idempotency_key: `adv-lifecycle-${Date.now()}`,
      created_by: 'diner',
      items: [{ product_id: 'p-bur-1', quantity: 1 }],
    }),
  })
  let o1Id = ''
  runCheck('Comanda O1 creada por comensal nace en pending_validation', () => {
    assert.strictEqual(createO1.status, 200)
    assert.ok(createO1.data?.order?.id)
    assert.strictEqual(createO1.data.order.status, 'pending_validation')
    assert.strictEqual(createO1.data.order.version || 1, 1)
    o1Id = createO1.data.order.id
  })

  // 1.2 Salto ilegal: pending_validation -> ready (debe ser rechazado con 400)
  const illegalPVtoReady = await api('/api/orders', {
    method: 'PATCH',
    body: JSON.stringify({ slug: SLUG, orderId: o1Id, status: 'ready' }),
  })
  runCheck('Rechazo HTTP 400 en salto ilegal: pending_validation -> ready', () => {
    assert.strictEqual(illegalPVtoReady.status, 400)
    assert.strictEqual(illegalPVtoReady.data?.code, 'TRANSITION_INVALID')
  })

  // 1.3 Salto ilegal: pending_validation -> paid (debe ser rechazado con 400)
  const illegalPVtoPaid = await api('/api/orders', {
    method: 'PATCH',
    body: JSON.stringify({ slug: SLUG, orderId: o1Id, status: 'paid' }),
  })
  runCheck('Rechazo HTTP 400 en salto ilegal: pending_validation -> paid', () => {
    assert.strictEqual(illegalPVtoPaid.status, 400)
    assert.strictEqual(illegalPVtoPaid.data?.code, 'TRANSITION_INVALID')
  })

  // 1.4 Transición legal: pending_validation -> pending (Mozo valida)
  const legalPVtoPending = await api('/api/orders', {
    method: 'PATCH',
    body: JSON.stringify({ slug: SLUG, orderId: o1Id, status: 'pending' }),
  })
  runCheck('Transición legal: pending_validation -> pending (Mozo valida)', () => {
    assert.strictEqual(legalPVtoPending.status, 200)
    assert.strictEqual(legalPVtoPending.data?.order?.status, 'pending')
  })

  // 1.5 Salto ilegal: pending -> paid (sin pasar por cocina ni entrega)
  const illegalPendingToPaid = await api('/api/orders', {
    method: 'PATCH',
    body: JSON.stringify({ slug: SLUG, orderId: o1Id, status: 'paid' }),
  })
  runCheck('Rechazo HTTP 400 en salto ilegal: pending -> paid', () => {
    assert.strictEqual(illegalPendingToPaid.status, 400)
    assert.strictEqual(illegalPendingToPaid.data?.code, 'TRANSITION_INVALID')
  })

  // 1.6 Transición legal: pending -> preparing (Cocina marcha comanda)
  const legalPendingToPrep = await api('/api/orders', {
    method: 'PATCH',
    body: JSON.stringify({ slug: SLUG, orderId: o1Id, status: 'preparing' }),
  })
  runCheck('Transición legal: pending -> preparing (Cocina marcha)', () => {
    assert.strictEqual(legalPendingToPrep.status, 200)
    assert.strictEqual(legalPendingToPrep.data?.order?.status, 'preparing')
  })

  // 1.7 Salto ilegal: preparing -> paid
  const illegalPrepToPaid = await api('/api/orders', {
    method: 'PATCH',
    body: JSON.stringify({ slug: SLUG, orderId: o1Id, status: 'paid' }),
  })
  runCheck('Rechazo HTTP 400 en salto ilegal: preparing -> paid', () => {
    assert.strictEqual(illegalPrepToPaid.status, 400)
    assert.strictEqual(illegalPrepToPaid.data?.code, 'TRANSITION_INVALID')
  })

  // 1.8 Transición legal: preparing -> ready (Cocina emplata y avisa)
  const legalPrepToReady = await api('/api/orders', {
    method: 'PATCH',
    body: JSON.stringify({ slug: SLUG, orderId: o1Id, status: 'ready' }),
  })
  runCheck('Transición legal: preparing -> ready (Plato listo para servir)', () => {
    assert.strictEqual(legalPrepToReady.status, 200)
    assert.strictEqual(legalPrepToReady.data?.order?.status, 'ready')
  })

  // 1.9 Salto ilegal: ready -> paid
  const illegalReadyToPaid = await api('/api/orders', {
    method: 'PATCH',
    body: JSON.stringify({ slug: SLUG, orderId: o1Id, status: 'paid' }),
  })
  runCheck('Rechazo HTTP 400 en salto ilegal: ready -> paid', () => {
    assert.strictEqual(illegalReadyToPaid.status, 400)
    assert.strictEqual(illegalReadyToPaid.data?.code, 'TRANSITION_INVALID')
  })

  // 1.10 Regresión ilegal: ready -> pending
  const regReadyToPending = await api('/api/orders', {
    method: 'PATCH',
    body: JSON.stringify({ slug: SLUG, orderId: o1Id, status: 'pending' }),
  })
  runCheck('Rechazo HTTP 400 en regresión ilegal: ready -> pending', () => {
    assert.strictEqual(regReadyToPending.status, 400)
    assert.strictEqual(regReadyToPending.data?.code, 'TRANSITION_INVALID')
  })

  // 1.11 Regresión ilegal: ready -> preparing
  const regReadyToPrep = await api('/api/orders', {
    method: 'PATCH',
    body: JSON.stringify({ slug: SLUG, orderId: o1Id, status: 'preparing' }),
  })
  runCheck('Rechazo HTTP 400 en regresión ilegal: ready -> preparing', () => {
    assert.strictEqual(regReadyToPrep.status, 400)
    assert.strictEqual(regReadyToPrep.data?.code, 'TRANSITION_INVALID')
  })

  // 1.12 Transición legal: ready -> delivered (Mozo sirve en mesa)
  const legalReadyToDeliv = await api('/api/orders', {
    method: 'PATCH',
    body: JSON.stringify({ slug: SLUG, orderId: o1Id, status: 'delivered' }),
  })
  runCheck('Transición legal: ready -> delivered (Servido en mesa)', () => {
    assert.strictEqual(legalReadyToDeliv.status, 200)
    assert.strictEqual(legalReadyToDeliv.data?.order?.status, 'delivered')
  })

  // 1.13 Regresión ilegal: delivered -> preparing
  const regDelivToPrep = await api('/api/orders', {
    method: 'PATCH',
    body: JSON.stringify({ slug: SLUG, orderId: o1Id, status: 'preparing' }),
  })
  runCheck('Rechazo HTTP 400 en regresión ilegal: delivered -> preparing', () => {
    assert.strictEqual(regDelivToPrep.status, 400)
    assert.strictEqual(regDelivToPrep.data?.code, 'TRANSITION_INVALID')
  })

  // 1.14 Regresión ilegal: delivered -> ready
  const regDelivToReady = await api('/api/orders', {
    method: 'PATCH',
    body: JSON.stringify({ slug: SLUG, orderId: o1Id, status: 'ready' }),
  })
  runCheck('Rechazo HTTP 400 en regresión ilegal: delivered -> ready', () => {
    assert.strictEqual(regDelivToReady.status, 400)
    assert.strictEqual(regDelivToReady.data?.code, 'TRANSITION_INVALID')
  })

  // 1.15 Transición legal: delivered -> paid (Mesa cobra y liquida)
  const legalDelivToPaid = await api('/api/orders', {
    method: 'PATCH',
    body: JSON.stringify({ slug: SLUG, orderId: o1Id, status: 'paid' }),
  })
  runCheck('Transición legal: delivered -> paid (Comanda cobrada)', () => {
    assert.strictEqual(legalDelivToPaid.status, 200)
    assert.strictEqual(legalDelivToPaid.data?.order?.status, 'paid')
  })

  // 1.16 Regresión ilegal desde estado terminal: paid -> preparing
  const regPaidToPrep = await api('/api/orders', {
    method: 'PATCH',
    body: JSON.stringify({ slug: SLUG, orderId: o1Id, status: 'preparing' }),
  })
  runCheck('Rechazo HTTP 400 en regresión terminal: paid -> preparing', () => {
    assert.strictEqual(regPaidToPrep.status, 400)
    assert.strictEqual(regPaidToPrep.data?.code, 'TRANSITION_INVALID')
  })

  // 1.17 Regresión ilegal desde estado terminal: paid -> delivered
  const regPaidToDeliv = await api('/api/orders', {
    method: 'PATCH',
    body: JSON.stringify({ slug: SLUG, orderId: o1Id, status: 'delivered' }),
  })
  runCheck('Rechazo HTTP 400 en regresión terminal: paid -> delivered', () => {
    assert.strictEqual(regPaidToDeliv.status, 400)
    assert.strictEqual(regPaidToDeliv.data?.code, 'TRANSITION_INVALID')
  })

  // 1.18 Regresión ilegal desde estado terminal: paid -> cancelled
  const regPaidToCanc = await api('/api/orders', {
    method: 'PATCH',
    body: JSON.stringify({ slug: SLUG, orderId: o1Id, status: 'cancelled' }),
  })
  runCheck('Rechazo HTTP 400 en regresión terminal: paid -> cancelled', () => {
    assert.strictEqual(regPaidToCanc.status, 400)
    assert.strictEqual(regPaidToCanc.data?.code, 'TRANSITION_INVALID')
  })

  // 1.19 Idempotencia segura: paid -> paid
  const idempPaid = await api('/api/orders', {
    method: 'PATCH',
    body: JSON.stringify({ slug: SLUG, orderId: o1Id, status: 'paid' }),
  })
  runCheck('Idempotencia: paid -> paid responde HTTP 200 con éxito', () => {
    assert.strictEqual(idempPaid.status, 200)
    assert.strictEqual(idempPaid.data?.order?.status, 'paid')
  })

  // 1.20 Rechazo de inyección de estado malicioso
  const maliciousStatus = await api('/api/orders', {
    method: 'PATCH',
    body: JSON.stringify({ slug: SLUG, orderId: o1Id, status: 'malicious_injected_status' }),
  })
  runCheck('Rechazo HTTP 400 ante inyección de string de estado inválido', () => {
    assert.strictEqual(maliciousStatus.status, 400)
  })

  // 1.21 Rechazo de parámetros faltantes
  const missingStatus = await api('/api/orders', {
    method: 'PATCH',
    body: JSON.stringify({ slug: SLUG, orderId: o1Id }),
  })
  runCheck('Rechazo HTTP 400 ante omisión de status', () => {
    assert.strictEqual(missingStatus.status, 400)
  })

  const missingOrderId = await api('/api/orders', {
    method: 'PATCH',
    body: JSON.stringify({ slug: SLUG, status: 'preparing' }),
  })
  runCheck('Rechazo HTTP 400 ante omisión de orderId', () => {
    assert.strictEqual(missingOrderId.status, 400)
  })

  // 1.22 Rechazo de UUID inexistente con 404
  const nonExistentUuid = await api('/api/orders', {
    method: 'PATCH',
    body: JSON.stringify({ slug: SLUG, orderId: '00000000-0000-0000-0000-000000000000', status: 'preparing' }),
  })
  runCheck('Rechazo HTTP 404 ORDER_NOT_FOUND ante UUID inexistente', () => {
    assert.strictEqual(nonExistentUuid.status, 404)
    assert.strictEqual(nonExistentUuid.data?.code, 'ORDER_NOT_FOUND')
  })

  // ---------------------------------------------------------------------------
  // 2. OCC & VERSIONING: INCREMENT & CONFLICT DETECTION (HTTP 409)
  // ---------------------------------------------------------------------------
  console.log(`\n${COLORS.bold}${COLORS.blue}▶ PHASE 2: Optimistic Concurrency Control (OCC) & HTTP 409 Conflict${COLORS.reset}`)

  const tableNum2 = 82
  const sess2Res = await api('/api/tables', {
    method: 'POST',
    body: JSON.stringify({ slug: SLUG, table_number: tableNum2, action: 'start_session' }),
  })
  const token2 = sess2Res.data.session_token

  // 2.1 Crear comanda para test OCC
  const createOcc = await api('/api/orders', {
    method: 'POST',
    body: JSON.stringify({
      slug: SLUG,
      table_number: tableNum2,
      session_token: token2,
      idempotency_key: `adv-occ-${Date.now()}`,
      created_by: 'waiter',
      items: [{ product_id: 'p-bur-1', quantity: 1 }],
    }),
  })
  let occOrderId = ''
  runCheck('Comanda OCC creada: versión inicial es 1 y estado pending', () => {
    assert.strictEqual(createOcc.status, 200)
    assert.ok(createOcc.data?.order?.id)
    assert.strictEqual(createOcc.data.order.status, 'pending')
    assert.strictEqual(createOcc.data.order.version || 1, 1)
    occOrderId = createOcc.data.order.id
  })

  // 2.2 Transición legal con expected_version: 1 -> versión debe subir a 2
  const occStep1 = await api('/api/orders', {
    method: 'PATCH',
    body: JSON.stringify({
      slug: SLUG,
      orderId: occOrderId,
      status: 'preparing',
      expected_version: 1,
    }),
  })
  runCheck('Transición con expected_version=1 aceptada (HTTP 200) e incrementa versión a 2', () => {
    assert.strictEqual(occStep1.status, 200)
    assert.strictEqual(occStep1.data?.order?.status, 'preparing')
    assert.strictEqual(occStep1.data?.version, 2)
  })

  // 2.3 Intento de actualización con versión obsoleta (expected_version: 1) -> HTTP 409 VERSION_CONFLICT
  const occStaleConflict = await api('/api/orders', {
    method: 'PATCH',
    body: JSON.stringify({
      slug: SLUG,
      orderId: occOrderId,
      status: 'ready',
      expected_version: 1,
    }),
  })
  runCheck('Detección estricta de conflicto OCC: HTTP 409 VERSION_CONFLICT con current_version=2', () => {
    assert.strictEqual(occStaleConflict.status, 409)
    assert.strictEqual(occStaleConflict.data?.code, 'VERSION_CONFLICT')
    assert.strictEqual(occStaleConflict.data?.current_version, 2)
    assert.strictEqual(occStaleConflict.data?.current_status, 'preparing')
  })

  // 2.4 Transición válida con la versión real esperada (expected_version: 2) -> versión sube a 3
  const occStep2 = await api('/api/orders', {
    method: 'PATCH',
    body: JSON.stringify({
      slug: SLUG,
      orderId: occOrderId,
      status: 'ready',
      expected_version: 2,
    }),
  })
  runCheck('Transición con expected_version=2 aceptada (HTTP 200) e incrementa versión a 3', () => {
    assert.strictEqual(occStep2.status, 200)
    assert.strictEqual(occStep2.data?.order?.status, 'ready')
    assert.strictEqual(occStep2.data?.version, 3)
  })

  // 2.5 Ataque de alta concurrencia (Race Condition): 10 peticiones paralelas con expected_version=3 hacia status 'delivered'
  console.log('    ⚡ Ejecutando ataque de carrera concurrente (10 clientes compitiendo a la vez)...')
  const racePromises = Array.from({ length: 10 }, (_, i) =>
    api('/api/orders', {
      method: 'PATCH',
      body: JSON.stringify({
        slug: SLUG,
        orderId: occOrderId,
        status: 'delivered',
        expected_version: 3,
        actor_id: `worker-client-${i + 1}`,
      }),
    })
  )
  const raceResults = await Promise.all(racePromises)

  runCheck('Ataque de carrera: Exactamente 1 petición triunfa con 200 (cambio atómico) y el resto recibe 409 o 200 idempotente sin solapamiento', () => {
    const successTransitions = raceResults.filter(r => r.status === 200 && r.data?.code === 'TRANSITION_APPLIED')
    const conflicts = raceResults.filter(r => r.status === 409 && r.data?.code === 'VERSION_CONFLICT')
    const alreadyInState = raceResults.filter(r => r.status === 200 && r.data?.code === 'ALREADY_IN_STATE')

    // Al menos 1 debe aplicar la transición
    assert.strictEqual(successTransitions.length, 1, 'Exactamente 1 petición debe aplicar la transición de versión 3 a 4')
    // Los otros 9 deben ser o 409 (conflicto) o 'ALREADY_IN_STATE'
    assert.strictEqual(conflicts.length + alreadyInState.length, 9, 'Las 9 peticiones restantes deben ser rechazadas con 409 o manejadas como idempotentes')
  })

  // Verificar estado final de la comanda tras la carrera
  const ordersAfterRace = await api(`/api/orders?slug=${SLUG}`)
  const orderAfterRace = ordersAfterRace.data?.orders?.find(o => o.id === occOrderId)
  runCheck('Comanda tras la carrera tiene versión exactamente 4 y estado delivered sin corrupción', () => {
    assert.ok(orderAfterRace)
    assert.strictEqual(orderAfterRace.status, 'delivered')
    assert.strictEqual(orderAfterRace.version, 4)
  })

  // ---------------------------------------------------------------------------
  // 3. MULTI-ROUND ISOLATION BY UUID ON THE SAME TABLE
  // ---------------------------------------------------------------------------
  console.log(`\n${COLORS.bold}${COLORS.blue}▶ PHASE 3: Multi-Round Isolation & Zero Table-Level Contamination${COLORS.reset}`)

  const tableNum3 = 83
  const sess3Res = await api('/api/tables', {
    method: 'POST',
    body: JSON.stringify({ slug: SLUG, table_number: tableNum3, action: 'start_session' }),
  })
  const token3 = sess3Res.data.session_token

  // 3.1 Crear Ronda 1 (Entrantes / Bebidas)
  const r1Res = await api('/api/orders', {
    method: 'POST',
    body: JSON.stringify({
      slug: SLUG,
      table_number: tableNum3,
      session_token: token3,
      idempotency_key: `adv-ronda1-${Date.now()}`,
      created_by: 'waiter',
      items: [{ product_id: 'p-bur-1', quantity: 2, notes: 'Ronda 1: Hamburguesas' }],
    }),
  })
  let r1Id = ''
  runCheck('Mesa 83: Ronda 1 creada exitosamente con UUID único', () => {
    assert.strictEqual(r1Res.status, 200)
    assert.ok(r1Res.data?.order?.id)
    r1Id = r1Res.data.order.id
  })

  // Progresar Ronda 1 hasta entregada (delivered)
  await api('/api/orders', { method: 'PATCH', body: JSON.stringify({ slug: SLUG, orderId: r1Id, status: 'preparing' }) })
  await api('/api/orders', { method: 'PATCH', body: JSON.stringify({ slug: SLUG, orderId: r1Id, status: 'ready' }) })
  const r1DelivRes = await api('/api/orders', { method: 'PATCH', body: JSON.stringify({ slug: SLUG, orderId: r1Id, status: 'delivered' }) })
  runCheck('Mesa 83: Ronda 1 avanza hasta entregada (status: delivered)', () => {
    assert.strictEqual(r1DelivRes.status, 200)
    assert.strictEqual(r1DelivRes.data?.order?.status, 'delivered')
  })

  // 3.2 Crear Ronda 2 (Postres) en la MISMA MESA 83 mientras Ronda 1 está entregada
  const r2Res = await api('/api/orders', {
    method: 'POST',
    body: JSON.stringify({
      slug: SLUG,
      table_number: tableNum3,
      session_token: token3,
      idempotency_key: `adv-ronda2-${Date.now()}`,
      created_by: 'diner',
      items: [{ product_id: 'p-pos-1', quantity: 2, notes: 'Ronda 2: Postres' }],
    }),
  })
  let r2Id = ''
  runCheck('Mesa 83: Ronda 2 creada en la misma mesa con UUID distinto', () => {
    assert.strictEqual(r2Res.status, 200)
    assert.ok(r2Res.data?.order?.id)
    r2Id = r2Res.data.order.id
    assert.notStrictEqual(r1Id, r2Id, 'Ronda 1 y Ronda 2 deben tener UUIDs completamente distintos')
    assert.strictEqual(r2Res.data.order.status, 'pending_validation')
  })

  // 3.3 Verificar que Ronda 1 sigue delivered y no fue contaminada por la creación de Ronda 2
  const ordersCheck1 = await api(`/api/orders?slug=${SLUG}`)
  const r1Found1 = ordersCheck1.data?.orders?.find(o => o.id === r1Id)
  const r2Found1 = ordersCheck1.data?.orders?.find(o => o.id === r2Id)
  runCheck('AISLAMIENTO: Ronda 1 permanece delivered tras la creación de Ronda 2 en pending_validation', () => {
    assert.ok(r1Found1)
    assert.ok(r2Found1)
    assert.strictEqual(r1Found1.status, 'delivered')
    assert.strictEqual(r2Found1.status, 'pending_validation')
  })

  // 3.4 Progresar Ronda 2 a pending y luego a preparing
  await api('/api/orders', { method: 'PATCH', body: JSON.stringify({ slug: SLUG, orderId: r2Id, status: 'pending', table_number: tableNum3 }) })
  const r2PrepRes = await api('/api/orders', { method: 'PATCH', body: JSON.stringify({ slug: SLUG, orderId: r2Id, status: 'preparing', table_number: tableNum3 }) })
  runCheck('Ronda 2 avanza a preparing en cocina', () => {
    assert.strictEqual(r2PrepRes.status, 200)
    assert.strictEqual(r2PrepRes.data?.order?.status, 'preparing')
  })

  // 3.5 Verificar que Ronda 1 NO retrocedió a preparing
  const ordersCheck2 = await api(`/api/orders?slug=${SLUG}`)
  const r1Found2 = ordersCheck2.data?.orders?.find(o => o.id === r1Id)
  const r2Found2 = ordersCheck2.data?.orders?.find(o => o.id === r2Id)
  runCheck('AISLAMIENTO CRÍTICO: Ronda 1 NO REGRESA a preparing (permanece delivered mientras Ronda 2 se cocina)', () => {
    assert.strictEqual(r1Found2?.status, 'delivered')
    assert.strictEqual(r2Found2?.status, 'preparing')
  })

  // 3.6 Intento de ataque por suplantación de mesa: PATCH con table_number pero UUID falso
  const spoofAttempt = await api('/api/orders', {
    method: 'PATCH',
    body: JSON.stringify({
      slug: SLUG,
      orderId: 'f0000000-0000-0000-0000-000000000000',
      table_number: tableNum3,
      status: 'cancelled',
    }),
  })
  runCheck('Ataque de suplantación: PATCH con table_number y UUID falso es rechazado con HTTP 404', () => {
    assert.strictEqual(spoofAttempt.status, 404)
  })

  const ordersCheckSpoof = await api(`/api/orders?slug=${SLUG}`)
  const r1AfterSpoof = ordersCheckSpoof.data?.orders?.find(o => o.id === r1Id)
  const r2AfterSpoof = ordersCheckSpoof.data?.orders?.find(o => o.id === r2Id)
  runCheck('Ataque de suplantación no afectó el estado ni de Ronda 1 ni de Ronda 2', () => {
    assert.strictEqual(r1AfterSpoof?.status, 'delivered')
    assert.strictEqual(r2AfterSpoof?.status, 'preparing')
  })

  // 3.7 Progresar Ronda 2 a delivered
  await api('/api/orders', { method: 'PATCH', body: JSON.stringify({ slug: SLUG, orderId: r2Id, status: 'ready' }) })
  await api('/api/orders', { method: 'PATCH', body: JSON.stringify({ slug: SLUG, orderId: r2Id, status: 'delivered' }) })

  // 3.8 Cobrar Ronda 1 de forma independiente
  const payR1 = await api('/api/orders', {
    method: 'PATCH',
    body: JSON.stringify({ slug: SLUG, orderId: r1Id, status: 'paid' }),
  })
  runCheck('Ronda 1 liquidada a paid independientemente', () => {
    assert.strictEqual(payR1.status, 200)
    assert.strictEqual(payR1.data?.order?.status, 'paid')
  })

  // Verificar que Ronda 2 sigue delivered (no cobrada prematuramente)
  const ordersCheck3 = await api(`/api/orders?slug=${SLUG}`)
  const r1Found3 = ordersCheck3.data?.orders?.find(o => o.id === r1Id)
  const r2Found3 = ordersCheck3.data?.orders?.find(o => o.id === r2Id)
  runCheck('Ronda 2 continúa en delivered cuando Ronda 1 se cobra', () => {
    assert.strictEqual(r1Found3?.status, 'paid')
    assert.strictEqual(r2Found3?.status, 'delivered')
  })

  // 3.9 Cobrar Ronda 2
  const payR2 = await api('/api/orders', {
    method: 'PATCH',
    body: JSON.stringify({ slug: SLUG, orderId: r2Id, status: 'paid' }),
  })
  runCheck('Ronda 2 liquidada a paid', () => {
    assert.strictEqual(payR2.status, 200)
    assert.strictEqual(payR2.data?.order?.status, 'paid')
  })

  const ordersCheckFinal = await api(`/api/orders?slug=${SLUG}`)
  const r1Final = ordersCheckFinal.data?.orders?.find(o => o.id === r1Id)
  const r2Final = ordersCheckFinal.data?.orders?.find(o => o.id === r2Id)
  runCheck('Ambas rondas en la misma mesa cerraron su ciclo independientemente en paid', () => {
    assert.strictEqual(r1Final?.status, 'paid')
    assert.strictEqual(r2Final?.status, 'paid')
  })

  // ---------------------------------------------------------------------------
  // RESUMEN FINAL
  // ---------------------------------------------------------------------------
  console.log(`\n${COLORS.bold}${COLORS.green}================================================================================${COLORS.reset}`)
  console.log(`${COLORS.bold}${COLORS.green} 🏆 CERTIFICACIÓN ADVERSARIAL CHALLENGER 2: ${passedTests}/${totalTests} PRUEBAS SUPERADAS (100% PASS)${COLORS.reset}`)
  console.log(`${COLORS.green} Estado de la máquina de estados, OCC concurrente y aislamiento multi-ronda 100% certificado.${COLORS.reset}`)
  console.log(`${COLORS.bold}${COLORS.green}================================================================================\n${COLORS.reset}`)
}

main().catch(err => {
  console.error('\nFATAL ERROR EN HARNESS:', err)
  process.exit(1)
})
