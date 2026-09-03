// ==============================================================================
// ADVERSARIAL TEST HARNESS — ORDER LIFECYCLE STATE MACHINE & TABLE ISOLATION
// ==============================================================================
// Targets:
// 1. Illegal status regressions (delivered->preparing, paid->preparing, pending->paid, ready->pending, etc.)
// 2. Multi-round ordering on same table (round 1 delivered -> round 2 pending_validation->preparing)
// 3. Multi-table cross-contamination prevention (Free Table A must never alter Table B)
// 4. Closed table reuse (free table -> orders marked paid -> new session pristine state)
// 5. Concurrency race attacks on status transitions
// 6. Non-existent UUID rejection without table-number fallback
// ==============================================================================

import { spawn } from 'node:child_process'
import http from 'node:http'

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

function assert(condition, testName, extra = '') {
  totalTests++
  if (condition) {
    passedTests++
    console.log(`  ${COLORS.green}✔ [PASS]${COLORS.reset} ${testName}`)
  } else {
    failedTests++
    console.error(`  ${COLORS.red}✖ [FAIL]${COLORS.reset} ${testName} ${extra}`)
  }
}

async function api(path, options = {}) {
  const url = `${BASE_URL}${path}`
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })
  let data
  try {
    data = await res.json()
  } catch (e) {
    data = null
  }
  return { status: res.status, data }
}

async function isServerReady() {
  try {
    const res = await fetch(`${BASE_URL}/api/tables`, { signal: AbortSignal.timeout(1500) })
    return res.status === 200
  } catch (e) {
    return false
  }
}

async function ensureServerRunning() {
  if (await isServerReady()) {
    console.log(`[Harness] Server already running at ${BASE_URL}\n`)
    return null
  }

  console.log(`[Harness] Spawning Next.js dev server at ${BASE_URL}...`)
  const child = spawn(
    process.execPath,
    ['./node_modules/next/dist/bin/next', 'dev', '-H', '127.0.0.1', '-p', '3000'],
    { stdio: 'pipe', env: process.env }
  )

  child.on('error', (err) => {
    console.error('[Harness] Failed to spawn server:', err)
  })

  const start = Date.now()
  while (Date.now() - start < 30000) {
    await new Promise(r => setTimeout(r, 800))
    if (await isServerReady()) {
      console.log(`[Harness] Dev server is ready and responding at ${BASE_URL}!\n`)
      return child
    }
  }
  throw new Error('Timeout waiting for Next.js dev server to start')
}

async function runAdversarialSuite() {
  let serverProcess = null
  try {
    serverProcess = await ensureServerRunning()
  } catch (e) {
    console.error('[Harness] Error starting server:', e.message)
    process.exit(1)
  }

  console.log(`${COLORS.bold}${COLORS.cyan}================================================================================${COLORS.reset}`)
  console.log(`${COLORS.bold}${COLORS.cyan} 🛡️ ADVERSARIAL STRESS TEST: ORDER LIFECYCLE & MULTI-ROUND ISOLATION${COLORS.reset}`)
  console.log(`${COLORS.cyan} Target Base URL: ${BASE_URL} | Slug: ${SLUG}${COLORS.reset}`)
  console.log(`${COLORS.bold}${COLORS.cyan}================================================================================\n${COLORS.reset}`)

  const tableNum = 88

  try {
    // ---------------------------------------------------------------------------
    // SECTION 1: ILLEGAL STATUS REGRESSIONS & STATE MACHINE HARDENING
    // ---------------------------------------------------------------------------
    console.log(`${COLORS.bold}${COLORS.blue}▶ CATEGORY 1: Illegal Status Regressions & Transition Enforcement${COLORS.reset}`)

    // 1.1 Start session for table
    const sess1 = await api('/api/tables', {
      method: 'POST',
      body: JSON.stringify({ slug: SLUG, table_number: tableNum, action: 'start_session' }),
    })
    assert(sess1.status === 200 && sess1.data?.session_token, 'Sesión inicial creada para Mesa 88')
    const token1 = sess1.data.session_token

    // 1.2 Create order O1 as diner -> initial status pending_validation
    const ord1Create = await api('/api/orders', {
      method: 'POST',
      body: JSON.stringify({
        slug: SLUG,
        table_number: tableNum,
        session_token: token1,
        idempotency_key: `adv-o1-${Date.now()}`,
        created_by: 'diner',
        items: [{ product_id: 'p-1', quantity: 1 }],
      }),
    })
    assert(ord1Create.status === 200 && ord1Create.data?.order?.id, 'Comanda O1 creada exitosamente')
    const o1Id = ord1Create.data.order.id
    assert(ord1Create.data.order.status === 'pending_validation', 'Comanda O1 nace en pending_validation')

    // 1.3 Attempt illegal jump: pending_validation -> paid
    const regPVtoPaid = await api('/api/orders', {
      method: 'PATCH',
      body: JSON.stringify({ slug: SLUG, orderId: o1Id, status: 'paid' }),
    })
    assert(regPVtoPaid.status === 400 && regPVtoPaid.data?.code === 'TRANSITION_INVALID',
      'Rechazo estricto HTTP 400 en salto ilegal: pending_validation -> paid')

    // 1.4 Attempt illegal jump: pending_validation -> ready
    const regPVtoReady = await api('/api/orders', {
      method: 'PATCH',
      body: JSON.stringify({ slug: SLUG, orderId: o1Id, status: 'ready' }),
    })
    assert(regPVtoReady.status === 400 && regPVtoReady.data?.code === 'TRANSITION_INVALID',
      'Rechazo estricto HTTP 400 en salto ilegal: pending_validation -> ready')

    // 1.5 Valid transition: pending_validation -> pending (Mozo valida)
    const stepPending = await api('/api/orders', {
      method: 'PATCH',
      body: JSON.stringify({ slug: SLUG, orderId: o1Id, status: 'pending' }),
    })
    assert(stepPending.status === 200 && stepPending.data?.success, 'Transición válida: pending_validation -> pending')

    // 1.6 Attempt illegal jump: pending -> paid (skipping kitchen and delivery)
    const regPendingToPaid = await api('/api/orders', {
      method: 'PATCH',
      body: JSON.stringify({ slug: SLUG, orderId: o1Id, status: 'paid' }),
    })
    assert(regPendingToPaid.status === 400 && regPendingToPaid.data?.code === 'TRANSITION_INVALID',
      'Rechazo estricto HTTP 400 en salto ilegal: pending -> paid')

    // 1.7 Valid progression: pending -> preparing
    const stepPreparing = await api('/api/orders', {
      method: 'PATCH',
      body: JSON.stringify({ slug: SLUG, orderId: o1Id, status: 'preparing' }),
    })
    assert(stepPreparing.status === 200 && stepPreparing.data?.success, 'Transición válida: pending -> preparing')

    // 1.7b Attempt illegal jump: preparing -> paid (must be delivered first)
    const regPrepToPaid = await api('/api/orders', {
      method: 'PATCH',
      body: JSON.stringify({ slug: SLUG, orderId: o1Id, status: 'paid' }),
    })
    assert(regPrepToPaid.status === 400 && regPrepToPaid.data?.code === 'TRANSITION_INVALID',
      'Rechazo estricto HTTP 400 en salto ilegal: preparing -> paid')

    // 1.8 Valid progression: preparing -> ready
    const stepReady = await api('/api/orders', {
      method: 'PATCH',
      body: JSON.stringify({ slug: SLUG, orderId: o1Id, status: 'ready' }),
    })
    assert(stepReady.status === 200 && stepReady.data?.success, 'Transición válida: preparing -> ready')

    // 1.8b Attempt illegal jump: ready -> paid (must be delivered first)
    const regReadyToPaid = await api('/api/orders', {
      method: 'PATCH',
      body: JSON.stringify({ slug: SLUG, orderId: o1Id, status: 'paid' }),
    })
    assert(regReadyToPaid.status === 400 && regReadyToPaid.data?.code === 'TRANSITION_INVALID',
      'Rechazo estricto HTTP 400 en salto ilegal: ready -> paid')

    // 1.9 Attempt illegal regression: ready -> pending
    const regReadyToPending = await api('/api/orders', {
      method: 'PATCH',
      body: JSON.stringify({ slug: SLUG, orderId: o1Id, status: 'pending' }),
    })
    assert(regReadyToPending.status === 400 && regReadyToPending.data?.code === 'TRANSITION_INVALID',
      'Rechazo estricto HTTP 400 en regresión ilegal: ready -> pending')

    // 1.10 Attempt illegal regression: ready -> preparing
    const regReadyToPrep = await api('/api/orders', {
      method: 'PATCH',
      body: JSON.stringify({ slug: SLUG, orderId: o1Id, status: 'preparing' }),
    })
    assert(regReadyToPrep.status === 400 && regReadyToPrep.data?.code === 'TRANSITION_INVALID',
      'Rechazo estricto HTTP 400 en regresión ilegal: ready -> preparing')

    // 1.11 Valid progression: ready -> delivered
    const stepDelivered = await api('/api/orders', {
      method: 'PATCH',
      body: JSON.stringify({ slug: SLUG, orderId: o1Id, status: 'delivered' }),
    })
    assert(stepDelivered.status === 200 && stepDelivered.data?.success, 'Transición válida: ready -> delivered')

    // 1.12 Attempt illegal regression: delivered -> preparing
    const regDelivToPrep = await api('/api/orders', {
      method: 'PATCH',
      body: JSON.stringify({ slug: SLUG, orderId: o1Id, status: 'preparing' }),
    })
    assert(regDelivToPrep.status === 400 && regDelivToPrep.data?.code === 'TRANSITION_INVALID',
      'Rechazo estricto HTTP 400 en regresión ilegal: delivered -> preparing')

    // 1.13 Attempt illegal regression: delivered -> pending
    const regDelivToPend = await api('/api/orders', {
      method: 'PATCH',
      body: JSON.stringify({ slug: SLUG, orderId: o1Id, status: 'pending' }),
    })
    assert(regDelivToPend.status === 400 && regDelivToPend.data?.code === 'TRANSITION_INVALID',
      'Rechazo estricto HTTP 400 en regresión ilegal: delivered -> pending')

    // 1.14 Attempt illegal regression: delivered -> ready
    const regDelivToReady = await api('/api/orders', {
      method: 'PATCH',
      body: JSON.stringify({ slug: SLUG, orderId: o1Id, status: 'ready' }),
    })
    assert(regDelivToReady.status === 400 && regDelivToReady.data?.code === 'TRANSITION_INVALID',
      'Rechazo estricto HTTP 400 en regresión ilegal: delivered -> ready')

    // 1.15 Valid progression: delivered -> paid
    const stepPaid = await api('/api/orders', {
      method: 'PATCH',
      body: JSON.stringify({ slug: SLUG, orderId: o1Id, status: 'paid' }),
    })
    assert(stepPaid.status === 200 && stepPaid.data?.success, 'Transición válida: delivered -> paid')

    // 1.16 Attempt illegal regression: paid -> preparing
    const regPaidToPrep = await api('/api/orders', {
      method: 'PATCH',
      body: JSON.stringify({ slug: SLUG, orderId: o1Id, status: 'preparing' }),
    })
    assert(regPaidToPrep.status === 400 && regPaidToPrep.data?.code === 'TRANSITION_INVALID',
      'Rechazo estricto HTTP 400 en regresión terminal: paid -> preparing')

    // 1.17 Attempt illegal regression: paid -> delivered
    const regPaidToDeliv = await api('/api/orders', {
      method: 'PATCH',
      body: JSON.stringify({ slug: SLUG, orderId: o1Id, status: 'delivered' }),
    })
    assert(regPaidToDeliv.status === 400 && regPaidToDeliv.data?.code === 'TRANSITION_INVALID',
      'Rechazo estricto HTTP 400 en regresión terminal: paid -> delivered')

    // 1.18 Attempt illegal transition: paid -> cancelled
    const regPaidToCanc = await api('/api/orders', {
      method: 'PATCH',
      body: JSON.stringify({ slug: SLUG, orderId: o1Id, status: 'cancelled' }),
    })
    assert(regPaidToCanc.status === 400 && regPaidToCanc.data?.code === 'TRANSITION_INVALID',
      'Rechazo estricto HTTP 400 en alteración terminal: paid -> cancelled')

    // 1.19 Test idempotency: paid -> paid
    const idempPaid = await api('/api/orders', {
      method: 'PATCH',
      body: JSON.stringify({ slug: SLUG, orderId: o1Id, status: 'paid' }),
    })
    assert(idempPaid.status === 200 && idempPaid.data?.success,
      'Idempotencia: re-aplicar paid -> paid responde HTTP 200 de forma segura')

    // 1.20 Test cancelled terminal state
    const ordCancCreate = await api('/api/orders', {
      method: 'POST',
      body: JSON.stringify({
        slug: SLUG,
        table_number: tableNum,
        session_token: token1,
        idempotency_key: `adv-canc-${Date.now()}`,
        created_by: 'waiter',
        items: [{ product_id: 'p-1', quantity: 1 }],
      }),
    })
    const oCancId = ordCancCreate.data.order.id
    const stepCanc = await api('/api/orders', {
      method: 'PATCH',
      body: JSON.stringify({ slug: SLUG, orderId: oCancId, status: 'cancelled' }),
    })
    assert(stepCanc.status === 200 && stepCanc.data?.success, 'Comanda cancelada exitosamente')

    const regCancToPrep = await api('/api/orders', {
      method: 'PATCH',
      body: JSON.stringify({ slug: SLUG, orderId: oCancId, status: 'preparing' }),
    })
    assert(regCancToPrep.status === 400 && regCancToPrep.data?.code === 'TRANSITION_INVALID',
      'Rechazo estricto HTTP 400 en alteración terminal: cancelled -> preparing')

    // 1.21 Malformed / injection status
    const badStatus = await api('/api/orders', {
      method: 'PATCH',
      body: JSON.stringify({ slug: SLUG, orderId: o1Id, status: 'arbitrary_injection_status' }),
    })
    assert(badStatus.status === 400, 'Rechazo estricto HTTP 400 ante string de estado inexistente')

    // 1.21b Missing parameters
    const missingStatus = await api('/api/orders', {
      method: 'PATCH',
      body: JSON.stringify({ slug: SLUG, orderId: o1Id }),
    })
    assert(missingStatus.status === 400, 'Rechazo estricto HTTP 400 ante falta de status')

    const missingOrderId = await api('/api/orders', {
      method: 'PATCH',
      body: JSON.stringify({ slug: SLUG, status: 'preparing' }),
    })
    assert(missingOrderId.status === 400, 'Rechazo estricto HTTP 400 ante falta de orderId')

    // 1.22 Non-existent order UUID
    const fakeUuid = await api('/api/orders', {
      method: 'PATCH',
      body: JSON.stringify({ slug: SLUG, orderId: '00000000-0000-0000-0000-000000000000', status: 'preparing' }),
    })
    assert(fakeUuid.status === 404 && fakeUuid.data?.error === 'ORDER_NOT_FOUND',
      'Rechazo estricto HTTP 404 ORDER_NOT_FOUND ante UUID inexistente')

    console.log('')

    // ---------------------------------------------------------------------------
    // SECTION 2: MULTI-ROUND ORDERING ON SAME TABLE & STRICT UUID ISOLATION
    // ---------------------------------------------------------------------------
    console.log(`${COLORS.bold}${COLORS.blue}▶ CATEGORY 2: Multi-Round Ordering on Same Table & UUID Isolation${COLORS.reset}`)

    const tableRound = 89
    // 2.1 Start session for table 89
    const sessRound = await api('/api/tables', {
      method: 'POST',
      body: JSON.stringify({ slug: SLUG, table_number: tableRound, action: 'start_session' }),
    })
    const tokenRound = sessRound.data.session_token

    // 2.2 Create Round 1
    const r1Create = await api('/api/orders', {
      method: 'POST',
      body: JSON.stringify({
        slug: SLUG,
        table_number: tableRound,
        session_token: tokenRound,
        idempotency_key: `adv-r1-${Date.now()}`,
        created_by: 'waiter',
        items: [{ product_id: 'p-1', quantity: 2, notes: 'Ronda 1 - Bebidas y Entrantes' }],
      }),
    })
    const r1Id = r1Create.data.order.id
    assert(r1Create.status === 200 && r1Id, 'Ronda 1 creada exitosamente en Mesa 89')

    // Progress Round 1 all the way to delivered: pending -> preparing -> ready -> delivered
    await api('/api/orders', { method: 'PATCH', body: JSON.stringify({ slug: SLUG, orderId: r1Id, status: 'preparing' }) })
    await api('/api/orders', { method: 'PATCH', body: JSON.stringify({ slug: SLUG, orderId: r1Id, status: 'ready' }) })
    const r1Deliv = await api('/api/orders', { method: 'PATCH', body: JSON.stringify({ slug: SLUG, orderId: r1Id, status: 'delivered' }) })
    assert(r1Deliv.status === 200, 'Ronda 1 entregada en mesa (status: delivered)')

    // 2.3 Create Round 2 on the SAME table while Round 1 is in delivered
    const r2Create = await api('/api/orders', {
      method: 'POST',
      body: JSON.stringify({
        slug: SLUG,
        table_number: tableRound,
        session_token: tokenRound,
        idempotency_key: `adv-r2-${Date.now()}`,
        created_by: 'diner',
        items: [{ product_id: 'p-2', quantity: 2, notes: 'Ronda 2 - Platos Principales' }],
      }),
    })
    assert(r2Create.status === 200 && r2Create.data?.order?.id, 'Ronda 2 creada exitosamente en la MISMA mesa 89')
    const r2Id = r2Create.data.order.id
    assert(r2Create.data.order.status === 'pending_validation', 'Ronda 2 nace correctamente en pending_validation')

    // 2.4 Verify Round 1 state immediately after Round 2 creation
    const ordersAfterR2 = await api(`/api/orders?slug=${SLUG}`)
    const r1Check1 = ordersAfterR2.data.orders.find(o => o.id === r1Id)
    assert(r1Check1?.status === 'delivered', 'AISLAMIENTO: Ronda 1 permanece delivered tras la creación de Ronda 2')

    // 2.5 Progress Round 2: pending_validation -> pending
    const r2Pending = await api('/api/orders', {
      method: 'PATCH',
      body: JSON.stringify({ slug: SLUG, orderId: r2Id, status: 'pending', table_number: tableRound }),
    })
    assert(r2Pending.status === 200, 'Ronda 2 validada a pending')

    const ordersAfterR2Pending = await api(`/api/orders?slug=${SLUG}`)
    const r1Check2 = ordersAfterR2Pending.data.orders.find(o => o.id === r1Id)
    assert(r1Check2?.status === 'delivered', 'AISLAMIENTO: Ronda 1 sigue delivered tras validar Ronda 2 a pending')

    // 2.6 Progress Round 2: pending -> preparing
    const r2Preparing = await api('/api/orders', {
      method: 'PATCH',
      body: JSON.stringify({ slug: SLUG, orderId: r2Id, status: 'preparing', table_number: tableRound }),
    })
    assert(r2Preparing.status === 200, 'Ronda 2 marchada a cocina (status: preparing)')

    const ordersAfterR2Prep = await api(`/api/orders?slug=${SLUG}`)
    const r1Check3 = ordersAfterR2Prep.data.orders.find(o => o.id === r1Id)
    const r2Check3 = ordersAfterR2Prep.data.orders.find(o => o.id === r2Id)
    assert(r1Check3?.status === 'delivered', 'AISLAMIENTO INVARIANTE: Ronda 1 NO REGRESA a preparing (permanece delivered)')
    assert(r2Check3?.status === 'preparing', 'Ronda 2 se encuentra en preparing con total independencia')

    // 2.7 Adversarial attack: attempt to alter Round 1 via table-number fallback with non-existent UUID
    const spoofPatch = await api('/api/orders', {
      method: 'PATCH',
      body: JSON.stringify({
        slug: SLUG,
        orderId: 'f0000000-0000-0000-0000-000000000000',
        table_number: tableRound,
        status: 'preparing',
      }),
    })
    assert(spoofPatch.status === 404, 'Ataque spoofing con UUID inexistente + table_number es rechazado HTTP 404')

    const ordersAfterSpoof = await api(`/api/orders?slug=${SLUG}`)
    const r1AfterSpoof = ordersAfterSpoof.data.orders.find(o => o.id === r1Id)
    const r2AfterSpoof = ordersAfterSpoof.data.orders.find(o => o.id === r2Id)
    assert(r1AfterSpoof?.status === 'delivered', 'Ataque spoofing no contaminó Ronda 1')
    assert(r2AfterSpoof?.status === 'preparing', 'Ataque spoofing no contaminó Ronda 2')

    // 2.8 Progress Round 2 to delivered
    await api('/api/orders', { method: 'PATCH', body: JSON.stringify({ slug: SLUG, orderId: r2Id, status: 'ready' }) })
    const r2Deliv = await api('/api/orders', { method: 'PATCH', body: JSON.stringify({ slug: SLUG, orderId: r2Id, status: 'delivered' }) })
    assert(r2Deliv.status === 200, 'Ronda 2 entregada en mesa (status: delivered)')

    console.log('')

    // ---------------------------------------------------------------------------
    // SECTION 3: MULTI-TABLE CROSS-CONTAMINATION PREVENTION
    // ---------------------------------------------------------------------------
    console.log(`${COLORS.bold}${COLORS.blue}▶ CATEGORY 3: Multi-Table Cross-Contamination Prevention${COLORS.reset}`)

    const tableA = 71
    const tableB = 72

    // Start sessions for Table A and Table B
    const sessA = await api('/api/tables', { method: 'POST', body: JSON.stringify({ slug: SLUG, table_number: tableA, action: 'start_session' }) })
    const sessB = await api('/api/tables', { method: 'POST', body: JSON.stringify({ slug: SLUG, table_number: tableB, action: 'start_session' }) })

    // Order for Table A (preparing -> ready -> delivered)
    const ordA = await api('/api/orders', {
      method: 'POST',
      body: JSON.stringify({
        slug: SLUG,
        table_number: tableA,
        session_token: sessA.data.session_token,
        idempotency_key: `adv-tableA-${Date.now()}`,
        created_by: 'waiter',
        items: [{ product_id: 'p-1', quantity: 1 }],
      }),
    })
    const idA = ordA.data.order.id
    await api('/api/orders', { method: 'PATCH', body: JSON.stringify({ slug: SLUG, orderId: idA, status: 'preparing' }) })
    await api('/api/orders', { method: 'PATCH', body: JSON.stringify({ slug: SLUG, orderId: idA, status: 'ready' }) })
    await api('/api/orders', { method: 'PATCH', body: JSON.stringify({ slug: SLUG, orderId: idA, status: 'delivered' }) })

    // Order for Table B (preparing)
    const ordB = await api('/api/orders', {
      method: 'POST',
      body: JSON.stringify({
        slug: SLUG,
        table_number: tableB,
        session_token: sessB.data.session_token,
        idempotency_key: `adv-tableB-${Date.now()}`,
        created_by: 'waiter',
        items: [{ product_id: 'p-2', quantity: 1 }],
      }),
    })
    const idB = ordB.data.order.id
    await api('/api/orders', { method: 'PATCH', body: JSON.stringify({ slug: SLUG, orderId: idB, status: 'preparing' }) })

    // Free Table A (close table session)
    const freeA = await api('/api/tables', { method: 'POST', body: JSON.stringify({ slug: SLUG, table_number: tableA, action: 'free' }) })
    assert(freeA.status === 200, 'Mesa A liberada exitosamente')

    // Check Table A and Table B orders
    const ordersCross = await api(`/api/orders?slug=${SLUG}`)
    const checkA = ordersCross.data.orders.find(o => o.id === idA)
    const checkB = ordersCross.data.orders.find(o => o.id === idB)

    assert(checkA?.status === 'paid', 'Mesa A: Comanda pasa a paid al liberar Mesa A')
    assert(checkB?.status === 'preparing', 'Mesa B: Comanda PERMANECE en preparing y NO sufre contaminación cruzada')

    console.log('')

    // ---------------------------------------------------------------------------
    // SECTION 4: CLOSED TABLE REUSE & PRISTINE STATE VERIFICATION
    // ---------------------------------------------------------------------------
    console.log(`${COLORS.bold}${COLORS.blue}▶ CATEGORY 4: Closed Table Reuse & State Cleansing${COLORS.reset}`)

    // 4.1 Free table 89 (Mesa 89 pide la cuenta y se marcha)
    const freeTable = await api('/api/tables', {
      method: 'POST',
      body: JSON.stringify({ slug: SLUG, table_number: tableRound, action: 'free' }),
    })
    assert(freeTable.status === 200 && freeTable.data?.success, 'Mesa 89 liberada (acción free ejecutada)')

    // 4.2 Verify order history is preserved as 'paid'
    const ordersAfterFree = await api(`/api/orders?slug=${SLUG}`)
    const r1AfterFree = ordersAfterFree.data.orders.find(o => o.id === r1Id)
    const r2AfterFree = ordersAfterFree.data.orders.find(o => o.id === r2Id)
    assert(r1AfterFree?.status === 'paid', 'Historial preservado: Ronda 1 pasa a status paid')
    assert(r2AfterFree?.status === 'paid', 'Historial preservado: Ronda 2 pasa a status paid')

    // 4.3 Verify expired token cannot order anymore
    const staleTokenOrder = await api('/api/orders', {
      method: 'POST',
      body: JSON.stringify({
        slug: SLUG,
        table_number: tableRound,
        session_token: tokenRound,
        idempotency_key: `adv-stale-${Date.now()}`,
        created_by: 'diner',
        items: [{ product_id: 'p-1', quantity: 1 }],
      }),
    })
    assert(staleTokenOrder.status === 403, 'Seguridad: Pedido con token revocado/expirado de sesión cerrada rechazado HTTP 403')

    // 4.4 New customer arrives at table 89: open brand new session
    const sessNew = await api('/api/tables', {
      method: 'POST',
      body: JSON.stringify({ slug: SLUG, table_number: tableRound, action: 'start_session' }),
    })
    assert(sessNew.status === 200 && sessNew.data?.session_token, 'Nueva sesión iniciada para nuevos comensales en Mesa 89')
    const tokenNew = sessNew.data.session_token
    assert(tokenNew !== tokenRound, 'El nuevo session_token es único y distinto al de la sesión anterior')

    // 4.5 New customer creates Round 1 of new session
    const rNewCreate = await api('/api/orders', {
      method: 'POST',
      body: JSON.stringify({
        slug: SLUG,
        table_number: tableRound,
        session_token: tokenNew,
        idempotency_key: `adv-new-party-${Date.now()}`,
        created_by: 'diner',
        items: [{ product_id: 'p-3', quantity: 1, notes: 'Nuevo cliente - Mesa limpia' }],
      }),
    })
    assert(rNewCreate.status === 200 && rNewCreate.data?.order?.id, 'Nueva comanda creada para nuevos clientes')
    const rNewId = rNewCreate.data.order.id
    assert(rNewCreate.data.order.status === 'pending_validation',
      'PRISTINE STATE: La nueva comanda nace en pending_validation sin heredar paid ni delivered')

    // 4.6 Verify old paid orders remain paid and uncorrupted
    const ordersWithNew = await api(`/api/orders?slug=${SLUG}`)
    const r1Final = ordersWithNew.data.orders.find(o => o.id === r1Id)
    const r2Final = ordersWithNew.data.orders.find(o => o.id === r2Id)
    const rNewFinal = ordersWithNew.data.orders.find(o => o.id === rNewId)
    assert(r1Final?.status === 'paid', 'Comanda histórica R1 permanece intacta en status paid')
    assert(r2Final?.status === 'paid', 'Comanda histórica R2 permanece intacta en status paid')
    assert(rNewFinal?.status === 'pending_validation', 'Comanda de nueva sesión permanece aislada en pending_validation')

    console.log('')

    // ---------------------------------------------------------------------------
    // SECTION 5: CONCURRENT ATTACK / RACE CONDITION RESILIENCE
    // ---------------------------------------------------------------------------
    console.log(`${COLORS.bold}${COLORS.blue}▶ CATEGORY 5: Concurrency Race Attack on Transitions${COLORS.reset}`)

    const tableRace = 90
    const sessRace = await api('/api/tables', {
      method: 'POST',
      body: JSON.stringify({ slug: SLUG, table_number: tableRace, action: 'start_session' }),
    })
    const tokenRace = sessRace.data.session_token

    // Create an order and move to delivered
    const ordRace = await api('/api/orders', {
      method: 'POST',
      body: JSON.stringify({
        slug: SLUG,
        table_number: tableRace,
        session_token: tokenRace,
        idempotency_key: `adv-race-${Date.now()}`,
        created_by: 'waiter',
        items: [{ product_id: 'p-1', quantity: 1 }],
      }),
    })
    const raceId = ordRace.data.order.id
    await api('/api/orders', { method: 'PATCH', body: JSON.stringify({ slug: SLUG, orderId: raceId, status: 'preparing' }) })
    await api('/api/orders', { method: 'PATCH', body: JSON.stringify({ slug: SLUG, orderId: raceId, status: 'ready' }) })
    await api('/api/orders', { method: 'PATCH', body: JSON.stringify({ slug: SLUG, orderId: raceId, status: 'delivered' }) })

    // Send 6 concurrent requests:
    // - 3 illegal regressions: preparing, pending, ready
    // - 3 legal requests: paid
    const promises = [
      api('/api/orders', { method: 'PATCH', body: JSON.stringify({ slug: SLUG, orderId: raceId, status: 'preparing' }) }),
      api('/api/orders', { method: 'PATCH', body: JSON.stringify({ slug: SLUG, orderId: raceId, status: 'pending' }) }),
      api('/api/orders', { method: 'PATCH', body: JSON.stringify({ slug: SLUG, orderId: raceId, status: 'ready' }) }),
      api('/api/orders', { method: 'PATCH', body: JSON.stringify({ slug: SLUG, orderId: raceId, status: 'paid' }) }),
      api('/api/orders', { method: 'PATCH', body: JSON.stringify({ slug: SLUG, orderId: raceId, status: 'paid' }) }),
      api('/api/orders', { method: 'PATCH', body: JSON.stringify({ slug: SLUG, orderId: raceId, status: 'paid' }) }),
    ]

    const raceResults = await Promise.all(promises)
    const illegalRejections = raceResults.filter(r => r.status === 400)
    const legalSuccesses = raceResults.filter(r => r.status === 200)

    assert(illegalRejections.length >= 3, `Ataque concurrente: Al menos 3 intentos ilegales rechazados con 400 (actual: ${illegalRejections.length})`)
    assert(legalSuccesses.length >= 1, `Ataque concurrente: Al menos 1 intento legal aceptado con 200 (actual: ${legalSuccesses.length})`)

    const raceOrderFinal = await api(`/api/orders?slug=${SLUG}`)
    const finalState = raceOrderFinal.data.orders.find(o => o.id === raceId)
    assert(finalState?.status === 'paid', 'Estado final tras concurrencia es consistentemente paid (nunca preparing o pending)')

    console.log('')

    // ---------------------------------------------------------------------------
    // SUMMARY
    // ---------------------------------------------------------------------------
    console.log(`${COLORS.bold}${COLORS.cyan}================================================================================${COLORS.reset}`)
    console.log(`${COLORS.bold} RESULTADOS DE LA CERTIFICACIÓN ADVERSARIAL:${COLORS.reset}`)
    console.log(`  Total pruebas ejecutadas: ${totalTests}`)
    console.log(`  ${COLORS.green}Pruebas superadas:        ${passedTests}${COLORS.reset}`)
    console.log(`  ${failedTests > 0 ? COLORS.red : COLORS.green}Pruebas fallidas:         ${failedTests}${COLORS.reset}`)
    console.log(`${COLORS.bold}${COLORS.cyan}================================================================================${COLORS.reset}`)

    if (failedTests === 0) {
      console.log(`\n${COLORS.bold}${COLORS.green}🎉 VEREDICTO: APPROVE — La máquina de estados y el aislamiento por UUID son 100% impenetrables.${COLORS.reset}\n`)
    } else {
      console.log(`\n${COLORS.bold}${COLORS.red}❌ VEREDICTO: REQUEST_CHANGES — Se detectaron vulnerabilidades o regresiones de estado.${COLORS.reset}\n`)
    }
  } finally {
    if (serverProcess) {
      console.log('[Harness] Stopping spawned server process...')
      serverProcess.kill('SIGTERM')
    }
  }

  process.exit(failedTests === 0 ? 0 : 1)
}

runAdversarialSuite().catch(err => {
  console.error('Error fatal durante la ejecución adversarial:', err)
  process.exit(1)
})
