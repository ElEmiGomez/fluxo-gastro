// ==============================================================================
// ADVERSARIAL OCC RACE CONDITION & STRESS HARNESS — CHALLENGER 1
// ==============================================================================
// Empirically stress-tests Optimistic Concurrency Control (OCC) in /api/orders PATCH:
// 1. Fundamental OCC versioning & boundary checks (stale, future, negative, string versions).
// 2. High-concurrency simultaneous race: 10 parallel PATCH requests on same order.
// 3. Conflicting branching race: Waiter validate ('pending') vs Diner cancel ('cancelled') at v1.
// 4. Multi-order isolation stress: 3 concurrent orders, 12 concurrent requests, 0 cross-talk.
// 5. Lifecycle edge cases: invalid transition (400), non-existent order (404), invalid status (400).
// 6. Empirical probe of GET /api/orders version persistence across requests.
// ==============================================================================

import { spawn } from 'node:child_process'

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:3000'
const SLUG = 'burger-gourmet'

async function api(path, options = {}) {
  const url = `${BASE_URL}${path}`
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      })
      let data
      try {
        data = await res.json()
      } catch (e) {
        data = null
      }
      return { status: res.status, data }
    } catch (err) {
      if (attempt < 3 && (err.code === 'ECONNRESET' || err.cause?.code === 'ECONNRESET')) {
        await new Promise(r => setTimeout(r, 200))
        continue
      }
      throw err
    }
  }
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
    return null
  }
  const child = spawn(
    process.execPath,
    ['./node_modules/next/dist/bin/next', 'dev', '-H', '127.0.0.1', '-p', '3000'],
    { stdio: 'pipe', env: process.env }
  )
  const start = Date.now()
  while (Date.now() - start < 35000) {
    await new Promise(r => setTimeout(r, 800))
    if (await isServerReady()) return child
  }
  throw new Error('Timeout waiting for dev server')
}

async function run() {
  let serverProcess = null
  try {
    serverProcess = await ensureServerRunning()
  } catch (e) {
    console.error('Error starting server:', e.message)
    process.exit(1)
  }

  let totalTests = 0
  let passedTests = 0
  const findings = []

  function assert(condition, name, details = '') {
    totalTests++
    if (condition) {
      passedTests++
      console.log(`  ✔ [PASS] ${name}`)
    } else {
      console.error(`  ✖ [FAIL] ${name} ${details}`)
      findings.push({ name, details })
    }
  }

  try {
    console.log('================================================================================')
    console.log('⚡ ADVERSARIAL OCC RACE CONDITION & CONCURRENCY STRESS HARNESS')
    console.log('================================================================================\n')

    // ----------------------------------------------------------------------------
    // SUITE 1: Fundamental OCC Version Guarantees & Boundary Values
    // ----------------------------------------------------------------------------
    console.log('--- SUITE 1: Fundamental OCC Version Guarantees & Boundary Values ---')
    const tbl1 = 851
    const sess1 = await api('/api/tables', {
      method: 'POST',
      body: JSON.stringify({ slug: SLUG, table_number: tbl1, action: 'start_session' }),
    })
    assert(sess1.status === 200 && sess1.data?.session_token, 'Suite 1: Table session initialized')
    const token1 = sess1.data?.session_token

    const create1 = await api('/api/orders', {
      method: 'POST',
      body: JSON.stringify({
        slug: SLUG,
        table_number: tbl1,
        session_token: token1,
        idempotency_key: `occ-suite1-${Date.now()}`,
        created_by: 'waiter',
        items: [{ product_id: 'p-1', quantity: 2 }],
      }),
    })
    assert(create1.status === 200 && create1.data?.order?.id, 'Suite 1: Order created')
    const order1Id = create1.data?.order?.id
    assert(create1.data?.order?.version === 1, 'Suite 1: Initial version is 1')

    // Stale version: expected_version 0 on version 1
    const stale0 = await api('/api/orders', {
      method: 'PATCH',
      body: JSON.stringify({ slug: SLUG, orderId: order1Id, status: 'preparing', expected_version: 0 }),
    })
    assert(stale0.status === 409 && stale0.data?.code === 'VERSION_CONFLICT' && stale0.data?.current_version === 1,
      'Suite 1: expected_version=0 yields 409 Conflict with current_version=1')

    // Negative version: expected_version -1
    const staleNeg = await api('/api/orders', {
      method: 'PATCH',
      body: JSON.stringify({ slug: SLUG, orderId: order1Id, status: 'preparing', expected_version: -1 }),
    })
    assert(staleNeg.status === 409 && staleNeg.data?.code === 'VERSION_CONFLICT',
      'Suite 1: expected_version=-1 yields 409 Conflict')

    // Future version: expected_version 999
    const futureVer = await api('/api/orders', {
      method: 'PATCH',
      body: JSON.stringify({ slug: SLUG, orderId: order1Id, status: 'preparing', expected_version: 999 }),
    })
    assert(futureVer.status === 409 && futureVer.data?.code === 'VERSION_CONFLICT',
      'Suite 1: expected_version=999 yields 409 Conflict')

    // String version parsing: expected_version "1"
    const strVer = await api('/api/orders', {
      method: 'PATCH',
      body: JSON.stringify({ slug: SLUG, orderId: order1Id, status: 'preparing', expected_version: '1' }),
    })
    assert(strVer.status === 200 && strVer.data?.version === 2,
      'Suite 1: String expected_version="1" accepted, version increments to 2')

    // Stale version after increment: expected_version 1 on version 2
    const staleV1 = await api('/api/orders', {
      method: 'PATCH',
      body: JSON.stringify({ slug: SLUG, orderId: order1Id, status: 'ready', expected_version: 1 }),
    })
    assert(staleV1.status === 409 && staleV1.data?.code === 'VERSION_CONFLICT' && staleV1.data?.current_version === 2,
      'Suite 1: Stale expected_version=1 on version 2 yields 409 Conflict with current_version=2')

    // ----------------------------------------------------------------------------
    // SUITE 2: True High-Concurrency Race (10 simultaneous PATCH on same order)
    // ----------------------------------------------------------------------------
    console.log('\n--- SUITE 2: True High-Concurrency Race (10 simultaneous PATCH on same order) ---')
    const tbl2 = 852
    const sess2 = await api('/api/tables', {
      method: 'POST',
      body: JSON.stringify({ slug: SLUG, table_number: tbl2, action: 'start_session' }),
    })
    assert(sess2.status === 200 && sess2.data?.session_token, 'Suite 2: Table 852 session initialized')
    const token2 = sess2.data?.session_token

    const create2 = await api('/api/orders', {
      method: 'POST',
      body: JSON.stringify({
        slug: SLUG,
        table_number: tbl2,
        session_token: token2,
        idempotency_key: `occ-race-${Date.now()}`,
        created_by: 'waiter',
        items: [{ product_id: 'p-1', quantity: 1 }],
      }),
    })
    assert(create2.status === 200 && create2.data?.order?.id, 'Suite 2: Race comanda created')
    const raceOrderId = create2.data?.order?.id
    assert(create2.data?.order?.version === 1, 'Suite 2: Initial race order version is 1')

    // Fire 10 simultaneous PATCH requests all expecting version 1 to transition to 'preparing'
    const CONCURRENCY = 10
    const racePromises = Array.from({ length: CONCURRENCY }, (_, i) =>
      api('/api/orders', {
        method: 'PATCH',
        body: JSON.stringify({
          slug: SLUG,
          orderId: raceOrderId,
          status: 'preparing',
          expected_version: 1,
          actor_type: `worker-${i}`,
        }),
      })
    )

    const raceResults = await Promise.all(racePromises)
    const successResponses = raceResults.filter(r => r.status === 200)
    const conflictResponses = raceResults.filter(r => r.status === 409)
    const otherResponses = raceResults.filter(r => r.status !== 200 && r.status !== 409)

    assert(successResponses.length === 1,
      `Suite 2: Exactly 1 winning request (expected 1, got ${successResponses.length})`)
    assert(conflictResponses.length === CONCURRENCY - 1,
      `Suite 2: Exactly ${CONCURRENCY - 1} 409 Conflict requests (got ${conflictResponses.length})`)
    assert(otherResponses.length === 0,
      `Suite 2: Zero unexpected HTTP error codes (got ${otherResponses.length})`)

    // Verify all 409s returned correct current_version = 2
    const allConflictsReportV2 = conflictResponses.every(r => r.data?.current_version === 2 && r.data?.code === 'VERSION_CONFLICT')
    assert(allConflictsReportV2, 'Suite 2: All 409 Conflict responses correctly report current_version=2')

    // ----------------------------------------------------------------------------
    // SUITE 3: Conflicting Branching Race (Waiter validate vs Customer cancel)
    // ----------------------------------------------------------------------------
    console.log('\n--- SUITE 3: Conflicting Branching Race (Waiter validate vs Customer cancel) ---')
    const tbl3 = 853
    const sess3 = await api('/api/tables', {
      method: 'POST',
      body: JSON.stringify({ slug: SLUG, table_number: tbl3, action: 'start_session' }),
    })
    assert(sess3.status === 200 && sess3.data?.session_token, 'Suite 3: Table 853 session initialized')
    const token3 = sess3.data?.session_token

    // Create diner order (starts at pending_validation)
    const create3 = await api('/api/orders', {
      method: 'POST',
      body: JSON.stringify({
        slug: SLUG,
        table_number: tbl3,
        session_token: token3,
        idempotency_key: `occ-branch-${Date.now()}`,
        created_by: 'diner',
        status: 'pending_validation',
        items: [{ product_id: 'p-1', quantity: 1 }],
      }),
    })
    assert(create3.status === 200 && create3.data?.order?.id, 'Suite 3: Diner order created at pending_validation')
    const branchOrderId = create3.data?.order?.id
    assert(create3.data?.order?.status === 'pending_validation', 'Suite 3: Order starts at pending_validation')
    assert(create3.data?.order?.version === 1, 'Suite 3: Initial version is 1')

    // Waiter tries to validate ('pending') while Customer tries to cancel ('cancelled') simultaneously
    const [reqWaiter, reqCustomer] = await Promise.all([
      api('/api/orders', {
        method: 'PATCH',
        body: JSON.stringify({
          slug: SLUG,
          orderId: branchOrderId,
          status: 'pending',
          expected_version: 1,
          actor_type: 'waiter',
        }),
      }),
      api('/api/orders', {
        method: 'PATCH',
        body: JSON.stringify({
          slug: SLUG,
          orderId: branchOrderId,
          status: 'cancelled',
          expected_version: 1,
          actor_type: 'customer',
        }),
      }),
    ])

    const isOneSuccessOneConflict =
      (reqWaiter.status === 200 && reqCustomer.status === 409) ||
      (reqWaiter.status === 409 && reqCustomer.status === 200)

    assert(isOneSuccessOneConflict,
      `Suite 3: Exactly one actor succeeds and one gets 409 Conflict (Waiter: ${reqWaiter.status}, Customer: ${reqCustomer.status})`)

    const winningStatus = reqWaiter.status === 200 ? 'pending' : 'cancelled'
    const losingActor = reqWaiter.status === 200 ? 'Customer' : 'Waiter'

    // Stale retry: Loser retries without updating version -> still 409
    const staleRetry = await api('/api/orders', {
      method: 'PATCH',
      body: JSON.stringify({
        slug: SLUG,
        orderId: branchOrderId,
        status: reqWaiter.status === 200 ? 'cancelled' : 'pending',
        expected_version: 1,
      }),
    })
    assert(staleRetry.status === 409 && staleRetry.data?.code === 'VERSION_CONFLICT',
      `Suite 3: ${losingActor} retrying with stale expected_version=1 rejected with 409`)

    // ----------------------------------------------------------------------------
    // SUITE 4: Multi-Order High-Throughput Concurrency & Order Isolation
    // ----------------------------------------------------------------------------
    console.log('\n--- SUITE 4: Multi-Order High-Throughput Concurrency & Order Isolation ---')
    const NUM_ORDERS = 3
    const ordersBatch = []

    for (let i = 0; i < NUM_ORDERS; i++) {
      const tNum = 860 + i
      const s = await api('/api/tables', {
        method: 'POST',
        body: JSON.stringify({ slug: SLUG, table_number: tNum, action: 'start_session' }),
      })
      assert(s.status === 200 && s.data?.session_token, `Suite 4: Table ${tNum} session initialized`)

      const ord = await api('/api/orders', {
        method: 'POST',
        body: JSON.stringify({
          slug: SLUG,
          table_number: tNum,
          session_token: s.data?.session_token,
          idempotency_key: `occ-multi-${i}-${Date.now()}`,
          created_by: 'waiter',
          items: [{ product_id: 'p-1', quantity: 1 }],
        }),
      })
      assert(ord.status === 200 && ord.data?.order?.id, `Suite 4: Order for table ${tNum} created`)
      if (ord.data?.order?.id) {
        ordersBatch.push({ tableNumber: tNum, orderId: ord.data.order.id })
      }
    }

    // For each of the orders, fire 4 concurrent requests with identical expected_version: 1
    const multiPromises = []
    for (const item of ordersBatch) {
      for (let j = 0; j < 4; j++) {
        multiPromises.push(
          api('/api/orders', {
            method: 'PATCH',
            body: JSON.stringify({
              slug: SLUG,
              orderId: item.orderId,
              status: 'preparing',
              expected_version: 1,
              actor_type: `actor-${j}`,
            }),
          }).then(res => ({ orderId: item.orderId, res }))
        )
      }
    }

    const multiResults = await Promise.all(multiPromises)
    let multiOk = true
    for (const item of ordersBatch) {
      const orderResults = multiResults.filter(r => r.orderId === item.orderId)
      const oks = orderResults.filter(r => r.res.status === 200)
      const conflicts = orderResults.filter(r => r.res.status === 409)
      if (oks.length !== 1 || conflicts.length !== 3) {
        multiOk = false
        console.error(`Order ${item.orderId}: oks=${oks.length}, conflicts=${conflicts.length}`)
      }
    }
    assert(multiOk, 'Suite 4: Across all concurrent orders, every order had strictly 1 winner and 3 conflicts')

    // ----------------------------------------------------------------------------
    // SUITE 5: Lifecycle Edge Cases & Contract Invariants
    // ----------------------------------------------------------------------------
    console.log('\n--- SUITE 5: Lifecycle Edge Cases & Contract Invariants ---')
    // 1. Non-existent order
    const nonExistent = await api('/api/orders', {
      method: 'PATCH',
      body: JSON.stringify({
        slug: SLUG,
        orderId: 'ord-non-existent-999999999',
        status: 'preparing',
      }),
    })
    assert(nonExistent.status === 404 && nonExistent.data?.code === 'ORDER_NOT_FOUND',
      'Suite 5: Non-existent order returns HTTP 404 ORDER_NOT_FOUND')

    // 2. Invalid status name
    const invalidStatus = await api('/api/orders', {
      method: 'PATCH',
      body: JSON.stringify({
        slug: SLUG,
        orderId: order1Id,
        status: 'invalid_status_xyz',
      }),
    })
    assert(invalidStatus.status === 400, 'Suite 5: Invalid status name returns HTTP 400 Bad Request')

    // 3. Illegal lifecycle transition (e.g. from delivered/preparing back to pending_validation)
    const illegalTransition = await api('/api/orders', {
      method: 'PATCH',
      body: JSON.stringify({
        slug: SLUG,
        orderId: order1Id,
        status: 'pending_validation',
        expected_version: 2,
      }),
    })
    assert(illegalTransition.status === 400 && illegalTransition.data?.code === 'TRANSITION_INVALID',
      'Suite 5: Illegal backward transition returns HTTP 400 TRANSITION_INVALID')

    // 4. Backward-compatible transition without expected_version
    const unversioned = await api('/api/orders', {
      method: 'PATCH',
      body: JSON.stringify({
        slug: SLUG,
        orderId: order1Id,
        status: 'ready',
      }),
    })
    assert(unversioned.status === 200 && unversioned.data?.version === 3,
      'Suite 5: Transition without expected_version allowed for backward-compatibility, version becomes 3')

    // ----------------------------------------------------------------------------
    // SUITE 6: Empirical Audit of GET /api/orders SSOT Version Persistence
    // ----------------------------------------------------------------------------
    console.log('\n--- SUITE 6: Empirical Audit of GET /api/orders SSOT Version Persistence ---')
    const getCheck = await api(`/api/orders?slug=${SLUG}`)
    const order1FromGet = getCheck.data?.orders?.find(o => o.id === order1Id)
    const raceOrderFromGet = getCheck.data?.orders?.find(o => o.id === raceOrderId)

    console.log(`  [Diagnostic Probe] order1 (mutated to v3 via PATCH): GET reports version = ${order1FromGet?.version}`)
    console.log(`  [Diagnostic Probe] raceOrder (mutated to v2 via PATCH): GET reports version = ${raceOrderFromGet?.version}`)

    // Check if GET returns the updated version (v3 and v2) or reverts to default 1
    const order1Preserved = order1FromGet?.version === 3
    const raceOrderPreserved = raceOrderFromGet?.version === 2

    if (!order1Preserved || !raceOrderPreserved) {
      console.warn('  ⚠️ [DISCREPANCY DETECTED]: GET /api/orders returns version=1 for previously mutated orders!')
      console.warn('  Reason: Supabase orders table currently lacks "version" column, causing getRestaurantOrders() to fallback to version: 1.')
      console.warn('  Impact: Clients polling GET /api/orders receive stale version 1 and fail subsequent PATCH with 409 Conflict loop.')
    }

    assert(order1Preserved,
      'Suite 6: GET /api/orders preserves order1 updated version (v3)',
      `Got version ${order1FromGet?.version} instead of 3`)
    assert(raceOrderPreserved,
      'Suite 6: GET /api/orders preserves raceOrder updated version (v2)',
      `Got version ${raceOrderFromGet?.version} instead of 2`)

    // Summary
    console.log('\n================================================================================')
    console.log(` STRESS TEST RESULTS: ${passedTests}/${totalTests} tests passed (${Math.round((passedTests / totalTests) * 100)}%)`)
    if (findings.length > 0) {
      console.log(` FAILURES / VULNERABILITIES FOUND (${findings.length}):`)
      findings.forEach(f => console.log(`   - ${f.name}: ${f.details}`))
    }
    console.log('================================================================================\n')
  } finally {
    if (serverProcess) serverProcess.kill('SIGTERM')
  }

  process.exit(findings.length === 0 ? 0 : 1)
}

run().catch(err => {
  console.error('Fatal stress test runner error:', err)
  process.exit(1)
})
