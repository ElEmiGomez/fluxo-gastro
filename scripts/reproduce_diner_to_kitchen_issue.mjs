import { spawn } from 'node:child_process'

const BASE_URL = 'http://127.0.0.1:3000'
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

async function run() {
  let server = null
  try {
    server = await ensureServerRunning()

    console.log('=== TEST: REPRODUCE DINER -> WAITER -> KITCHEN FLOW ===')

    // 1. Diner starts session on table 15
    const sessRes = await api('/api/tables', {
      method: 'POST',
      body: JSON.stringify({ slug: SLUG, table_number: 15, action: 'start_session' }),
    })
    console.log('1. Session created:', sessRes.status, sessRes.data)
    const token = sessRes.data?.session_token

    // 2. Diner sends order
    const orderPayload = {
      slug: SLUG,
      table_number: 15,
      session_token: token,
      idempotency_key: `test-idemp-${Date.now()}`,
      created_by: 'diner',
      status: 'pending_validation',
      items: [
        {
          product_id: 'b0000000-0000-0000-0000-000000000001',
          quantity: 2,
          notes: 'Sin cebolla',
        },
      ],
    }
    const createRes = await api('/api/orders', {
      method: 'POST',
      body: JSON.stringify(orderPayload),
    })
    console.log('2. Order created:', createRes.status, createRes.data?.order?.id, 'status:', createRes.data?.order?.status)
    const orderId = createRes.data?.order?.id

    if (!orderId) {
      console.error('FAILED to create order:', createRes.data)
      return
    }

    // 3. Kitchen fetches orders: should NOT show pending_validation
    const kitchen1 = await api(`/api/orders?slug=${SLUG}`)
    const kitchen1Orders = (kitchen1.data?.orders || []).filter(
      o => o.status !== 'pending_validation' && o.order_items && o.order_items.length > 0
    )
    const kitchen1HasOrder = kitchen1Orders.some(o => o.id === orderId)
    console.log('3. Kitchen sees order before validation?', kitchen1HasOrder, '(Expected: false)')

    // 4. Waiter fetches orders: should see pending_validation
    const waiter1 = await api(`/api/orders?slug=${SLUG}`)
    const waiterPending = (waiter1.data?.orders || []).filter(
      o => o.status === 'pending_validation'
    )
    const waiterSeesOrder = waiterPending.some(o => o.id === orderId)
    console.log('4. Waiter sees order in pending_validation?', waiterSeesOrder, '(Expected: true)')

    // 5. Waiter validates order to kitchen: PATCH /api/orders status: 'pending'
    const patchRes = await api('/api/orders', {
      method: 'PATCH',
      body: JSON.stringify({
        slug: SLUG,
        orderId,
        status: 'pending',
        table_number: 15,
      }),
    })
    console.log('5. Waiter PATCH result:', patchRes.status, patchRes.data)

    // 6. Kitchen fetches orders: MUST see order in pending!
    const kitchen2 = await api(`/api/orders?slug=${SLUG}`)
    console.log('6. All orders returned from /api/orders count:', kitchen2.data?.orders?.length)
    const targetOrderInKitchen = (kitchen2.data?.orders || []).find(o => o.id === orderId)
    console.log('   Target order in /api/orders:', targetOrderInKitchen ? {
      id: targetOrderInKitchen.id,
      status: targetOrderInKitchen.status,
      table_number: targetOrderInKitchen.table_number,
      itemsCount: targetOrderInKitchen.order_items?.length,
    } : 'NOT FOUND')

    const kitchen2Filtered = (kitchen2.data?.orders || []).filter(
      o => o.status !== 'pending_validation' && o.order_items && o.order_items.length > 0
    )
    const kitchen2DisplaysOrder = kitchen2Filtered.some(o => o.id === orderId)
    console.log('7. Kitchen monitor displays order?', kitchen2DisplaysOrder, '(Expected: true)')

  } finally {
    if (server) {
      server.kill()
    }
  }
}

run().catch(console.error)
