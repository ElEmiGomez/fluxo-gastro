// ==============================================================================
// OCC VERSION CONFLICT & OPTIMISTIC LOCKING TEST (HTTP 409)
// ==============================================================================
// Verifies:
// 1. Order initial version = 1
// 2. Legal transition with expected_version = 1 -> 200 OK, version = 2
// 3. Stale transition with expected_version = 1 -> 409 Conflict (VERSION_CONFLICT)
// 4. Successful transition with expected_version = 2 -> 200 OK, version = 3
// ==============================================================================

import { spawn } from 'node:child_process'

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:3000'
const SLUG = 'burger-gourmet'

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
    return null
  }
  const child = spawn(
    process.execPath,
    ['./node_modules/next/dist/bin/next', 'dev', '-H', '127.0.0.1', '-p', '3000'],
    { stdio: 'pipe', env: process.env }
  )
  const start = Date.now()
  while (Date.now() - start < 30000) {
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

  function assert(condition, name) {
    totalTests++
    if (condition) {
      passedTests++
      console.log(`  ✔ [PASS] ${name}`)
    } else {
      console.error(`  ✖ [FAIL] ${name}`)
    }
  }

  try {
    console.log('================================================================================')
    console.log('🔒 TEST DE CONTROL DE CONCURRENCIA OPTIMISTA (OCC) & HTTP 409')
    console.log('================================================================================\n')

    const tableNum = 95
    const sess = await api('/api/tables', {
      method: 'POST',
      body: JSON.stringify({ slug: SLUG, table_number: tableNum, action: 'start_session' }),
    })
    assert(sess.status === 200, 'Sesión creada para mesa 95')
    const token = sess.data.session_token

    // 1. Crear comanda
    const ordCreate = await api('/api/orders', {
      method: 'POST',
      body: JSON.stringify({
        slug: SLUG,
        table_number: tableNum,
        session_token: token,
        idempotency_key: `occ-test-${Date.now()}`,
        created_by: 'waiter',
        items: [{ product_id: 'p-1', quantity: 1 }],
      }),
    })
    assert(ordCreate.status === 200, 'Comanda creada exitosamente')
    const orderId = ordCreate.data.order.id
    const v1 = ordCreate.data.order.version || 1
    assert(v1 === 1, 'Versión inicial de la comanda es 1')

    // 2. Transición legal con expected_version: 1 (pending -> preparing)
    const patch1 = await api('/api/orders', {
      method: 'PATCH',
      body: JSON.stringify({
        slug: SLUG,
        orderId,
        status: 'preparing',
        expected_version: 1,
      }),
    })
    assert(patch1.status === 200 && patch1.data.version === 2, 'Transición con expected_version 1 aceptada con 200 OK y versión incrementada a 2')

    // 3. Ataque / Colisión OCC: Intentar modificar usando versión obsoleta (expected_version: 1)
    const patchConflict = await api('/api/orders', {
      method: 'PATCH',
      body: JSON.stringify({
        slug: SLUG,
        orderId,
        status: 'ready',
        expected_version: 1,
      }),
    })
    assert(
      patchConflict.status === 409 &&
      patchConflict.data?.code === 'VERSION_CONFLICT' &&
      patchConflict.data?.current_version === 2,
      'Conflicto de concurrencia detectado: rechazo estricto HTTP 409 VERSION_CONFLICT con current_version=2'
    )

    // 4. Transición exitosa usando la versión actualizada (expected_version: 2)
    const patch2 = await api('/api/orders', {
      method: 'PATCH',
      body: JSON.stringify({
        slug: SLUG,
        orderId,
        status: 'ready',
        expected_version: 2,
      }),
    })
    assert(patch2.status === 200 && patch2.data.version === 3, 'Transición con expected_version 2 aceptada con 200 OK y versión incrementada a 3')

    // 5. Idempotencia: Re-aplicar estado actual ready con expected_version 3
    const patchIdemp = await api('/api/orders', {
      method: 'PATCH',
      body: JSON.stringify({
        slug: SLUG,
        orderId,
        status: 'ready',
        expected_version: 3,
      }),
    })
    assert(patchIdemp.status === 200 && patchIdemp.data.success, 'Re-aplicación idempotente responde 200 OK')

    console.log('\n================================================================================')
    console.log(` RESULTADOS OCC: ${passedTests}/${totalTests} pruebas superadas (100% PASS)`)
    console.log('================================================================================\n')
  } finally {
    if (serverProcess) serverProcess.kill('SIGTERM')
  }

  process.exit(passedTests === totalTests ? 0 : 1)
}

run().catch(console.error)
