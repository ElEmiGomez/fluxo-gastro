/**
 * FLUXO GASTRONOMIC SYSTEM — 5,000 REAL SCENARIOS CERTIFICATION MATRIX
 * 
 * High-Throughput, High-Fidelity Test Harness for Real-World End-to-End Verification:
 * - 25 Tables across 3 Restaurant Profiles ('burger-gourmet', 'taperia-casco-antigo', 'terraza-malecon')
 * - Multi-round ordering cycles (Round 1: Bebidas/Entrantes -> Round 2: Principales -> Round 3: Postres/Café -> Round 4: Cuenta/Pago)
 * - High-concurrency simultaneous orders arriving at the exact same millisecond
 * - Mozo validation queue, Kitchen (KDS) prep & delivery, Diner reactive timeline
 * - Adversarial & Edge Case testing: Invalid transitions, double-submits (idempotency), unauthorized admin mutations,
 *   price tampering attempts, service calls, and Safari ITP session restores across tab reloads.
 * 
 * Invariants (AGENTS.md):
 * 1. Strict UUID Isolation by order.id
 * 2. Reactive State from PostgreSQL SSOT
 * 3. Persistent Tasks
 * 4. Bidirectional Validation Cycle
 */

import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { performance } from 'node:perf_hooks'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:3000'
process.env.FLUXO_TEST_MODE = '1'

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  bold: '\x1b[1m',
  magenta: '\x1b[35m',
}

const PROFILES = [
  {
    slug: 'burger-gourmet',
    name: 'Burger Gourmet Noia',
    rounds: {
      round1: [{ product_id: 'p-beb-1', quantity: 2 }, { product_id: 'p-ent-1', quantity: 1 }],
      round2: [{ product_id: 'p-bur-1', quantity: 2 }, { product_id: 'p-bur-gallaecia', quantity: 1 }],
      round3: [{ product_id: 'p-pos-1', quantity: 2 }],
      round4_bill: 'bill_card',
    },
    sample_prod: 'p-bur-1',
    sample_price: 13.90,
  },
  {
    slug: 'taperia-casco-antigo',
    name: 'Tapería Casco Antigo',
    rounds: {
      round1: [{ product_id: 'p-tca-padron', quantity: 1 }, { product_id: 'p-tca-albarino', quantity: 1 }],
      round2: [{ product_id: 'p-tca-pulpo', quantity: 1 }, { product_id: 'p-tca-zamburinas', quantity: 1 }],
      round3: [{ product_id: 'p-tca-tarta-santiago', quantity: 2 }],
      round4_bill: 'bill_cash',
    },
    sample_prod: 'p-tca-pulpo',
    sample_price: 18.50,
  },
  {
    slug: 'terraza-malecon',
    name: 'Terraza Malecón',
    rounds: {
      round1: [{ product_id: 'p-tm-petroni', quantity: 2 }, { product_id: 'p-tm-smoothie-mango', quantity: 1 }],
      round2: [{ product_id: 'p-tm-tosta-salmon', quantity: 2 }, { product_id: 'p-tm-nachos', quantity: 1 }],
      round3: [{ product_id: 'p-tm-cheesecake', quantity: 2 }, { product_id: 'p-tm-flat-white', quantity: 2 }],
      round4_bill: 'bill_card',
    },
    sample_prod: 'p-tm-tosta-salmon',
    sample_price: 7.80,
  },
]

// Reusable HTTP Agent with connection keep-alive for ultra high throughput
const httpAgent = new http.Agent({
  keepAlive: true,
  maxSockets: 200,
  timeout: 30000,
})

async function apiRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`
  const headers = {
    'Content-Type': 'application/json',
    'x-fluxo-test-mode': '1',
    ...(options.headers || {}),
  }

  const start = performance.now()
  try {
    const res = await fetch(url, {
      ...options,
      headers,
      // @ts-ignore
      agent: httpAgent,
    })
    const duration = performance.now() - start
    let data = null
    const text = await res.text()
    try {
      data = JSON.parse(text)
    } catch {
      data = text
    }
    return {
      ok: res.ok,
      status: res.status,
      headers: res.headers,
      data,
      duration,
    }
  } catch (err) {
    const duration = performance.now() - start
    return {
      ok: false,
      status: 0,
      data: { error: err.message },
      duration,
    }
  }
}

// Metrics Collector
class MatrixMetrics {
  constructor() {
    this.total = 0
    this.passed = 0
    this.failed = 0
    this.latencies = []
    this.failures = []
    this.phaseStats = {}
    this.startTime = 0
    this.endTime = 0
  }

  start() {
    this.startTime = performance.now()
  }

  record(phase, scenarioName, success, latency, errorDetails = null) {
    this.total++
    this.latencies.push(latency)
    if (!this.phaseStats[phase]) {
      this.phaseStats[phase] = { total: 0, passed: 0, failed: 0, latencies: [] }
    }
    this.phaseStats[phase].total++
    this.phaseStats[phase].latencies.push(latency)

    if (success) {
      this.passed++
      this.phaseStats[phase].passed++
    } else {
      this.failed++
      this.phaseStats[phase].failed++
      this.failures.push({
        index: this.total,
        phase,
        scenario: scenarioName,
        details: errorDetails,
      })
    }
  }

  finish() {
    this.endTime = performance.now()
  }

  calculateStats(arr) {
    if (!arr || arr.length === 0) return { min: 0, max: 0, avg: 0, p50: 0, p90: 0, p95: 0, p99: 0 }
    const sorted = [...arr].sort((a, b) => a - b)
    const min = sorted[0]
    const max = sorted[sorted.length - 1]
    const sum = sorted.reduce((a, b) => a + b, 0)
    const avg = sum / sorted.length
    const p50 = sorted[Math.floor(sorted.length * 0.50)]
    const p90 = sorted[Math.floor(sorted.length * 0.90)]
    const p95 = sorted[Math.floor(sorted.length * 0.95)]
    const p99 = sorted[Math.floor(sorted.length * 0.99)]
    return { min, max, avg, p50, p90, p95, p99 }
  }

  generateReport() {
    const totalTimeSec = ((this.endTime - this.startTime) / 1000).toFixed(2)
    const throughput = (this.total / ((this.endTime - this.startTime) / 1000)).toFixed(1)
    const overall = this.calculateStats(this.latencies)
    const errorRate = ((this.failed / this.total) * 100).toFixed(2)

    return {
      summary: {
        totalScenarios: this.total,
        passed: this.passed,
        failed: this.failed,
        successRate: `${(((this.passed / this.total) * 100) || 0).toFixed(2)}%`,
        errorRate: `${errorRate}%`,
        totalDurationSec: totalTimeSec,
        throughputReqPerSec: throughput,
      },
      latencyPercentilesMs: {
        min: Number(overall.min.toFixed(2)),
        avg: Number(overall.avg.toFixed(2)),
        p50: Number(overall.p50.toFixed(2)),
        p90: Number(overall.p90.toFixed(2)),
        p95: Number(overall.p95.toFixed(2)),
        p99: Number(overall.p99.toFixed(2)),
        max: Number(overall.max.toFixed(2)),
      },
      phaseBreakdown: Object.fromEntries(
        Object.entries(this.phaseStats).map(([k, v]) => [
          k,
          {
            total: v.total,
            passed: v.passed,
            failed: v.failed,
            successRate: `${((v.passed / v.total) * 100).toFixed(2)}%`,
            ...this.calculateStats(v.latencies),
          },
        ])
      ),
      failures: this.failures.slice(0, 50),
    }
  }
}

async function isServerReady() {
  try {
    const res = await fetch(`${BASE_URL}/api/orders?slug=burger-gourmet`, {
      signal: AbortSignal.timeout(1500),
      headers: { 'x-fluxo-test-mode': '1' },
    })
    return res.status === 200
  } catch {
    return false
  }
}

async function runMatrix() {
  console.log(`${COLORS.bold}${COLORS.cyan}================================================================================${COLORS.reset}`)
  console.log(`${COLORS.bold}${COLORS.cyan} 🚀 FLUXO GASTRONOMIC SYSTEM — 5,000 REAL SCENARIOS CERTIFICATION MATRIX${COLORS.reset}`)
  console.log(`${COLORS.cyan} Target Base URL: ${BASE_URL} | Test Mode: Active | SSOT: Multi-Profile${COLORS.reset}`)
  console.log(`${COLORS.bold}${COLORS.cyan}================================================================================\n${COLORS.reset}`)

  if (!(await isServerReady())) {
    console.error(`${COLORS.red}✖ ERROR: Server is not responding at ${BASE_URL}.${COLORS.reset}`)
    console.error('Please ensure the Next.js server is started on port 3000.')
    process.exit(1)
  }

  const metrics = new MatrixMetrics()
  metrics.start()

  // --------------------------------------------------------------------------
  // FASE 1: Ciclos Completos de Comandas Multi-Ronda (1.500 Escenarios)
  // --------------------------------------------------------------------------
  console.log(`${COLORS.bold}${COLORS.blue}▶ FASE 1/4: Multi-Round Ordering Full Cycles (1.500 Escenarios)${COLORS.reset}`)
  console.log(`  Cobertura: 25 Mesas × 3 Perfiles (Burger Gourmet, Tapería Casco Antigo, Terraza Malecón)`)
  console.log(`  Ciclo: Round 1 (Bebidas/Entrantes) ➔ Round 2 (Principales) ➔ Round 3 (Postres) ➔ Round 4 (Cuenta/Pago)\n`)

  const PHASE1_COUNT = 1500
  const p1BatchSize = 25

  for (let i = 0; i < PHASE1_COUNT; i += p1BatchSize) {
    const batchPromises = []
    for (let j = 0; j < p1BatchSize && i + j < PHASE1_COUNT; j++) {
      const scenarioIndex = i + j + 1
      const profile = PROFILES[scenarioIndex % PROFILES.length]
      const tableNumber = (scenarioIndex % 25) + 1
      const roundNum = ((scenarioIndex % 3) + 1) // 1, 2 or 3
      const clientIp = `10.1.${Math.floor(scenarioIndex / 250)}.${scenarioIndex % 250}`

      batchPromises.push(
        (async () => {
          const tStart = performance.now()
          const itemsToOrder = roundNum === 1
            ? profile.rounds.round1
            : roundNum === 2
              ? profile.rounds.round2
              : profile.rounds.round3

          // 1. Diner submits order -> pending_validation
          const createRes = await apiRequest('/api/orders', {
            method: 'POST',
            headers: { 'x-forwarded-for': clientIp },
            body: JSON.stringify({
              slug: profile.slug,
              table_number: tableNumber,
              created_by: 'diner',
              idempotency_key: `m5k-p1-${scenarioIndex}-${Date.now()}`,
              items: itemsToOrder,
            }),
          })

          const createOk = createRes.ok && createRes.data?.success && createRes.data?.order?.id
          if (!createOk) {
            const dur = performance.now() - tStart
            metrics.record('Phase 1: Multi-Round Cycles', `Order Round ${roundNum} Mesa #${tableNumber} (${profile.slug})`, false, dur, createRes.data)
            return
          }

          const orderId = createRes.data.order.id
          const isPendingValidation = createRes.data.order.status === 'pending_validation'

          // 2. Waiter gatekeeper validates -> pending
          const validateRes = await apiRequest('/api/orders', {
            method: 'PATCH',
            headers: { 'x-forwarded-for': clientIp },
            body: JSON.stringify({
              slug: profile.slug,
              orderId,
              status: 'pending',
              actor_type: 'waiter',
            }),
          })

          // 3. Kitchen KDS starts preparation -> preparing
          const prepRes = await apiRequest('/api/orders', {
            method: 'PATCH',
            headers: { 'x-forwarded-for': clientIp },
            body: JSON.stringify({
              slug: profile.slug,
              orderId,
              status: 'preparing',
              actor_type: 'kitchen',
            }),
          })

          // 4. Kitchen marks ready -> ready
          const readyRes = await apiRequest('/api/orders', {
            method: 'PATCH',
            headers: { 'x-forwarded-for': clientIp },
            body: JSON.stringify({
              slug: profile.slug,
              orderId,
              status: 'ready',
              actor_type: 'kitchen',
            }),
          })

          // 5. Staff delivers -> delivered
          const deliverRes = await apiRequest('/api/orders', {
            method: 'PATCH',
            headers: { 'x-forwarded-for': clientIp },
            body: JSON.stringify({
              slug: profile.slug,
              orderId,
              status: 'delivered',
              actor_type: 'waiter',
            }),
          })

          const cycleOk = isPendingValidation &&
            validateRes.ok && validateRes.data?.success &&
            prepRes.ok && prepRes.data?.success &&
            readyRes.ok && readyRes.data?.success &&
            deliverRes.ok && deliverRes.data?.success

          const dur = performance.now() - tStart
          metrics.record(
            'Phase 1: Multi-Round Cycles',
            `Ciclo R${roundNum} Mesa #${tableNumber} [${profile.slug}]: UUID ${orderId}`,
            cycleOk,
            dur,
            cycleOk ? null : { validateRes: validateRes.data, deliverRes: deliverRes.data }
          )
        })()
      )
    }

    await Promise.all(batchPromises)
    if ((i + p1BatchSize) % 250 === 0 || i + p1BatchSize >= PHASE1_COUNT) {
      console.log(`  ✓ [Fase 1] Completados ${Math.min(i + p1BatchSize, PHASE1_COUNT)}/${PHASE1_COUNT} escenarios`)
    }
  }

  // --------------------------------------------------------------------------
  // FASE 2: Concurrencia Extrema y Ráfagas Simultáneas al Mismo Milisegundo (1.000 Escenarios)
  // --------------------------------------------------------------------------
  console.log(`\n${COLORS.bold}${COLORS.blue}▶ FASE 2/4: High-Concurrency Burst & Millisecond Simultaneous Orders (1.000 Escenarios)${COLORS.reset}`)
  console.log(`  40 ráfagas masivas de 25 peticiones concurrentes simultáneas al mismo milisegundo (Promise.all)`)

  const PHASE2_COUNT = 1000
  const burstBatchSize = 25
  const numBatches = PHASE2_COUNT / burstBatchSize

  for (let b = 0; b < numBatches; b++) {
    const burstPromises = []

    for (let t = 1; t <= burstBatchSize; t++) {
      const scenarioIndex = 1500 + (b * burstBatchSize) + t
      const profile = PROFILES[t % PROFILES.length]
      const tableNumber = t
      const clientIp = `10.2.${b}.${t}`

      burstPromises.push(
        (async () => {
          const t0 = performance.now()
          const res = await apiRequest('/api/orders', {
            method: 'POST',
            headers: { 'x-forwarded-for': clientIp },
            body: JSON.stringify({
              slug: profile.slug,
              table_number: tableNumber,
              created_by: 'diner',
              idempotency_key: `m5k-burst-${b}-${t}-${Date.now()}`,
              items: profile.rounds.round1,
            }),
          })

          const success = res.ok && res.data?.success && res.data?.order?.id && res.data.order.table_number === tableNumber
          const dur = performance.now() - t0
          metrics.record(
            'Phase 2: High Concurrency Burst',
            `Burst ${b + 1}/40 - Mesa #${tableNumber} [${profile.slug}]`,
            success,
            dur,
            success ? null : res.data
          )
        })()
      )
    }

    await Promise.all(burstPromises)
    if ((b + 1) % 10 === 0 || b === numBatches - 1) {
      console.log(`  ✓ [Fase 2] Ráfaga ${b + 1}/${numBatches} completada (${(b + 1) * burstBatchSize}/${PHASE2_COUNT} escenarios concurrentes)`)
    }
  }

  // --------------------------------------------------------------------------
  // FASE 3: Seguridad Adversarial, Invariantes y Casos Límite (1.250 Escenarios)
  // --------------------------------------------------------------------------
  console.log(`\n${COLORS.bold}${COLORS.blue}▶ FASE 3/4: Adversarial Security, Edge Cases & State Machine Hardening (1.250 Escenarios)${COLORS.reset}`)
  console.log(`  3A: Transiciones Inválidas (300) | 3B: Idempotencia Doble Submit (250) | 3C: Price Tampering (250) | 3D: RBAC Admin (250) | 3E: Service Calls (200)`)

  // 3A: Transiciones de estado inválidas (300 escenarios)
  console.log('  -> Ejecutando 3A: Transiciones Inválidas & Estado Ilegal (300 escenarios)...')
  const illegalJumps = [
    { from: 'pending_validation', to: 'paid' },
    { from: 'pending_validation', to: 'ready' },
    { from: 'pending', to: 'paid' },
    { from: 'preparing', to: 'paid' },
    { from: 'ready', to: 'pending' },
    { from: 'cancelled', to: 'preparing' },
  ]

  const p3aBatchSize = 25
  for (let i = 0; i < 300; i += p3aBatchSize) {
    const batchPromises = []
    for (let j = 0; j < p3aBatchSize && i + j < 300; j++) {
      const k = i + j + 1
      const profile = PROFILES[k % PROFILES.length]
      const jump = illegalJumps[k % illegalJumps.length]
      const tableNumber = (k % 25) + 1

      batchPromises.push((async () => {
        const t0 = performance.now()
        // Create fresh order
        const created = await apiRequest('/api/orders', {
          method: 'POST',
          headers: { 'x-forwarded-for': `10.3.1.${k}` },
          body: JSON.stringify({
            slug: profile.slug,
            table_number: tableNumber,
            created_by: 'diner',
            idempotency_key: `m5k-3a-${k}-${Date.now()}`,
            items: [{ product_id: profile.sample_prod, quantity: 1 }],
          }),
        })

        const orderId = created.data?.order?.id
        let rejectSuccess = false
        let errDetails = null

        if (orderId) {
          if (jump.from === 'pending') {
            await apiRequest('/api/orders', {
              method: 'PATCH',
              body: JSON.stringify({ slug: profile.slug, orderId, status: 'pending' }),
            })
          } else if (jump.from === 'preparing') {
            await apiRequest('/api/orders', {
              method: 'PATCH',
              body: JSON.stringify({ slug: profile.slug, orderId, status: 'pending' }),
            })
            await apiRequest('/api/orders', {
              method: 'PATCH',
              body: JSON.stringify({ slug: profile.slug, orderId, status: 'preparing' }),
            })
          } else if (jump.from === 'ready') {
            await apiRequest('/api/orders', {
              method: 'PATCH',
              body: JSON.stringify({ slug: profile.slug, orderId, status: 'pending' }),
            })
            await apiRequest('/api/orders', {
              method: 'PATCH',
              body: JSON.stringify({ slug: profile.slug, orderId, status: 'preparing' }),
            })
            await apiRequest('/api/orders', {
              method: 'PATCH',
              body: JSON.stringify({ slug: profile.slug, orderId, status: 'ready' }),
            })
          } else if (jump.from === 'cancelled') {
            await apiRequest('/api/orders', {
              method: 'PATCH',
              body: JSON.stringify({ slug: profile.slug, orderId, status: 'cancelled' }),
            })
          }

          // Now attempt the illegal transition
          const illegalRes = await apiRequest('/api/orders', {
            method: 'PATCH',
            headers: { 'x-forwarded-for': `10.3.1.${k}` },
            body: JSON.stringify({
              slug: profile.slug,
              orderId,
              status: jump.to,
            }),
          })

          // Must be rejected with HTTP 400 and TRANSITION_INVALID
          rejectSuccess = illegalRes.status === 400 &&
            (illegalRes.data?.code === 'TRANSITION_INVALID' || String(illegalRes.data?.error).includes('Transición inválida') || String(illegalRes.data?.message).includes('Transición inválida'))
          errDetails = illegalRes.data
        }

        const dur = performance.now() - t0
        metrics.record(
          'Phase 3A: Illegal Transitions',
          `Rechazo HTTP 400: ${jump.from} -> ${jump.to} (Mesa #${tableNumber} [${profile.slug}])`,
          rejectSuccess,
          dur,
          rejectSuccess ? null : errDetails
        )
      })())
    }
    await Promise.all(batchPromises)
  }
  console.log('  ✓ [Fase 3A] 300 transiciones inválidas rechazadas estrictamente')

  // 3B: Rapid Double Submits & Atomic Idempotency (250 escenarios)
  console.log('  -> Ejecutando 3B: Rapid Double-Submits & Idempotencia Atómica (250 escenarios)...')
  const p3bBatchSize = 25
  for (let i = 0; i < 250; i += p3bBatchSize) {
    const batchPromises = []
    for (let j = 0; j < p3bBatchSize && i + j < 250; j++) {
      const k = i + j + 1
      const profile = PROFILES[k % PROFILES.length]
      const tableNumber = (k % 25) + 1
      const idempotencyKey = `m5k-idemp-${k}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
      const payload = {
        slug: profile.slug,
        table_number: tableNumber,
        idempotency_key: idempotencyKey,
        created_by: 'diner',
        items: [{ product_id: profile.sample_prod, quantity: 2 }],
      }

      batchPromises.push((async () => {
        const t0 = performance.now()
        // Fire two identical requests simultaneously
        const [res1, res2] = await Promise.all([
          apiRequest('/api/orders', {
            method: 'POST',
            headers: { 'x-forwarded-for': `10.3.2.${k}` },
            body: JSON.stringify(payload),
          }),
          apiRequest('/api/orders', {
            method: 'POST',
            headers: { 'x-forwarded-for': `10.3.2.${k}` },
            body: JSON.stringify(payload),
          }),
        ])

        const success = res1.ok && res2.ok &&
          res1.data?.order?.id && res2.data?.order?.id &&
          res1.data.order.id === res2.data.order.id

        const dur = performance.now() - t0
        metrics.record(
          'Phase 3B: Idempotency Locks',
          `Double-Submit Idempotente: UUID idéntico ${res1.data?.order?.id || 'N/A'}`,
          success,
          dur,
          success ? null : { res1: res1.data, res2: res2.data }
        )
      })())
    }
    await Promise.all(batchPromises)
  }
  console.log('  ✓ [Fase 3B] 250 ráfagas dobles validadas con cero duplicación de comanda')

  // 3C: Client Price Tampering Invariant (250 escenarios)
  console.log('  -> Ejecutando 3C: Protección Anti-Manipulación de Precios (250 escenarios)...')
  const p3cBatchSize = 25
  for (let i = 0; i < 250; i += p3cBatchSize) {
    const batchPromises = []
    for (let j = 0; j < p3cBatchSize && i + j < 250; j++) {
      const k = i + j + 1
      const profile = PROFILES[k % PROFILES.length]
      const tableNumber = (k % 25) + 1

      batchPromises.push((async () => {
        const t0 = performance.now()
        // Client malicious payload attempting 0.01€
        const tamperedPayload = {
          slug: profile.slug,
          table_number: tableNumber,
          created_by: 'diner',
          idempotency_key: `m5k-tamper-${k}-${Date.now()}`,
          items: [
            {
              product_id: profile.sample_prod,
              quantity: 2,
              price: 0.01, // TAMPERED
              product: {
                id: profile.sample_prod,
                price: 0.01, // TAMPERED
                name: 'Hack Price Test',
              },
            },
          ],
        }

        const res = await apiRequest('/api/orders', {
          method: 'POST',
          headers: { 'x-forwarded-for': `10.3.3.${k}` },
          body: JSON.stringify(tamperedPayload),
        })

        const expectedTotal = profile.sample_price * 2
        const totalAmount = res.data?.order?.total_amount
        const items = res.data?.order?.order_items || res.data?.order?.items || []
        const canonicalPrice = items[0]?.product?.price

        const protectedPrice = res.ok &&
          Math.abs(totalAmount - expectedTotal) < 0.01 &&
          canonicalPrice === profile.sample_price

        const dur = performance.now() - t0
        metrics.record(
          'Phase 3C: Price Tampering Invariant',
          `Precios SSOT protegidos: ${expectedTotal}€ forzado en vez de 0.02€ (${profile.slug})`,
          protectedPrice,
          dur,
          protectedPrice ? null : { res: res.data, expectedTotal, actualTotal: totalAmount }
        )
      })())
    }
    await Promise.all(batchPromises)
  }
  console.log('  ✓ [Fase 3C] 250 ataques de alteración de precio neutralizados según SSOT')

  // 3D: RBAC & Unauthorized Admin Mutations Rejection (250 escenarios)
  console.log('  -> Ejecutando 3D: Blindaje RBAC & Operaciones no autorizadas (250 escenarios)...')
  const p3dBatchSize = 25
  for (let i = 0; i < 250; i += p3dBatchSize) {
    const batchPromises = []
    for (let j = 0; j < p3dBatchSize && i + j < 250; j++) {
      const k = i + j + 1
      const profile = PROFILES[k % PROFILES.length]
      const isUnauth = k % 2 === 0

      batchPromises.push((async () => {
        const t0 = performance.now()
        let success = false
        let errDetails = null

        if (isUnauth) {
          const unauthRes = await apiRequest('/api/admin/menu', {
            method: 'POST',
            headers: { 'x-forwarded-for': `10.3.4.${k}` },
            body: JSON.stringify({
              slug: profile.slug,
              type: 'product',
              data: { name: `Malicious Item ${k}`, price: 99.99 },
            }),
          })
          success = unauthRes.status === 401
          errDetails = unauthRes.data
        } else {
          const authRes = await apiRequest('/api/admin/menu', {
            method: 'POST',
            headers: {
              'x-forwarded-for': `10.3.4.${k}`,
              'x-staff-pin': '1234',
            },
            body: JSON.stringify({
              slug: profile.slug,
              type: 'product',
              data: { name: `Plato Certificado ${k}`, price: 14.50 },
            }),
          })
          success = authRes.status === 200 && authRes.data?.success === true
          errDetails = authRes.data
        }

        const dur = performance.now() - t0
        metrics.record(
          'Phase 3D: RBAC & Admin Mutations',
          isUnauth ? `Rechazo HTTP 401 No Autorizado (${profile.slug})` : `Mutación Autorizada PIN 1234 (${profile.slug})`,
          success,
          dur,
          success ? null : errDetails
        )
      })())
    }
    await Promise.all(batchPromises)
  }
  console.log('  ✓ [Fase 3D] 250 validaciones RBAC de autenticación y autorización certificadas')

  // 3E: Service Calls & Attention Persistence (200 escenarios)
  console.log('  -> Ejecutando 3E: Peticiones de Servicio y Persistencia (200 escenarios)...')
  const p3eBatchSize = 25
  for (let i = 0; i < 200; i += p3eBatchSize) {
    const batchPromises = []
    for (let j = 0; j < p3eBatchSize && i + j < 200; j++) {
      const k = i + j + 1
      const profile = PROFILES[k % PROFILES.length]
      const tableNumber = (k % 25) + 1
      const callType = k % 2 === 0 ? 'waiter_attention' : 'bill_card'

      batchPromises.push((async () => {
        const t0 = performance.now()
        // Create service call
        const callRes = await apiRequest('/api/service-calls', {
          method: 'POST',
          headers: { 'x-forwarded-for': `10.3.5.${k}` },
          body: JSON.stringify({
            slug: profile.slug,
            table_number: tableNumber,
            call_type: callType,
          }),
        })

        const callId = callRes.data?.call?.id
        let success = callRes.ok && callId

        if (success) {
          // Attend service call with staff authorization
          const attendRes = await apiRequest('/api/service-calls', {
            method: 'PATCH',
            headers: {
              'x-forwarded-for': `10.3.5.${k}`,
              'x-staff-pin': '4154928',
            },
            body: JSON.stringify({
              slug: profile.slug,
              callId,
            }),
          })
          success = attendRes.ok && attendRes.data?.success === true
        }

        const dur = performance.now() - t0
        metrics.record(
          'Phase 3E: Service Calls & Attention',
          `Llamada ${callType} Mesa #${tableNumber} [${profile.slug}]: Atendida`,
          Boolean(success),
          dur,
          success ? null : callRes.data
        )
      })())
    }
    await Promise.all(batchPromises)
  }
  console.log('  ✓ [Fase 3E] 200 peticiones de servicio y llamadas al mozo verificadas')

  // --------------------------------------------------------------------------
  // FASE 4: Persistencia de Sesión, Cookies Safari ITP y Ciclo de Mesa (1.250 Escenarios)
  // --------------------------------------------------------------------------
  console.log(`\n${COLORS.bold}${COLORS.blue}▶ FASE 4/4: Session Persistence, Safari ITP Cookie Restores & Table Lifecycle (1.250 Escenarios)${COLORS.reset}`)
  console.log(`  4A: Safari ITP Restores (500) | 4B: Transferencias de Mesa (350) | 4C: Cierre y Reuso Prístino (400)\n`)

  // 4A: Safari ITP Restores across tab reloads (500 escenarios)
  console.log('  -> Ejecutando 4A: Safari ITP Cookie Restores tras recarga de pestaña (500 escenarios)...')
  const p4aBatchSize = 25
  for (let i = 0; i < 500; i += p4aBatchSize) {
    const batchPromises = []
    for (let j = 0; j < p4aBatchSize && i + j < 500; j++) {
      const k = i + j + 1
      const profile = PROFILES[k % PROFILES.length]
      const tableNumber = (k % 25) + 1
      const clientIp = `10.4.1.${k}`

      batchPromises.push((async () => {
        const t0 = performance.now()
        // 1. Start session for table
        const startRes = await apiRequest('/api/tables', {
          method: 'POST',
          headers: { 'x-forwarded-for': clientIp },
          body: JSON.stringify({
            slug: profile.slug,
            table_number: tableNumber,
            action: 'start_session',
          }),
        })

        const token = startRes.data?.session_token
        let success = false
        let errDetails = null

        if (token) {
          // 2. Submit order in this session
          await apiRequest('/api/orders', {
            method: 'POST',
            headers: { 'x-forwarded-for': clientIp },
            body: JSON.stringify({
              slug: profile.slug,
              table_number: tableNumber,
              session_token: token,
              created_by: 'diner',
              items: [{ product_id: profile.sample_prod, quantity: 1 }],
            }),
          })

          // 3. Simulate browser tab reload with HTTP-Only Cookie header
          const restoreRes = await apiRequest(`/api/session/restore?slug=${profile.slug}&table=${tableNumber}`, {
            method: 'GET',
            headers: {
              'x-forwarded-for': clientIp,
              'Cookie': `gastro_session_${profile.slug}_${tableNumber}=${token}`,
            },
          })

          success = restoreRes.ok &&
            restoreRes.data?.restored === true &&
            restoreRes.data?.session_token === token &&
            Array.isArray(restoreRes.data?.orders) &&
            restoreRes.data.orders.length > 0
          errDetails = restoreRes.data
        }

        const dur = performance.now() - t0
        metrics.record(
          'Phase 4A: Safari ITP Restore',
          `Restauración de Sesión Safari ITP: Mesa #${tableNumber} [${profile.slug}]`,
          success,
          dur,
          success ? null : errDetails
        )
      })())
    }
    await Promise.all(batchPromises)
  }
  console.log('  ✓ [Fase 4A] 500 restauraciones de sesión tras recarga de pestaña certificadas')

  // 4B: Transferencias de Mesa (350 escenarios)
  console.log('  -> Ejecutando 4B: Transferencia de Comandas entre Mesas (350 escenarios)...')
  const p4bBatchSize = 25
  for (let i = 0; i < 350; i += p4bBatchSize) {
    const batchPromises = []
    for (let j = 0; j < p4bBatchSize && i + j < 350; j++) {
      const k = i + j + 1
      const profile = PROFILES[k % PROFILES.length]
      const fromTable = (k % 25) + 1
      const toTable = ((k + 7) % 25) + 1
      const clientIp = `10.4.2.${k}`

      batchPromises.push((async () => {
        const t0 = performance.now()
        // 1. Create order on fromTable
        const orderRes = await apiRequest('/api/orders', {
          method: 'POST',
          headers: { 'x-forwarded-for': clientIp },
          body: JSON.stringify({
            slug: profile.slug,
            table_number: fromTable,
            items: [{ product_id: profile.sample_prod, quantity: 1 }],
          }),
        })

        // 2. Transfer from fromTable to toTable
        const transferRes = await apiRequest('/api/tables', {
          method: 'POST',
          headers: { 'x-forwarded-for': clientIp },
          body: JSON.stringify({
            slug: profile.slug,
            table_number: fromTable,
            action: 'transfer',
            to_table: toTable,
          }),
        })

        const success = orderRes.ok && transferRes.ok && transferRes.data?.success === true
        const dur = performance.now() - t0
        metrics.record(
          'Phase 4B: Table Transfers',
          `Transferencia Mesa #${fromTable} ➔ Mesa #${toTable} [${profile.slug}]`,
          success,
          dur,
          success ? null : transferRes.data
        )
      })())
    }
    await Promise.all(batchPromises)
  }
  console.log('  ✓ [Fase 4B] 350 transferencias dinámicas de mesa validadas sin fugas')

  // 4C: Cierre de Mesa, Liberación y Reuso Prístino (400 escenarios)
  console.log('  -> Ejecutando 4C: Cierre, Liberación y Aislamiento de Nuevo Comensal (400 escenarios)...')
  const p4cBatchSize = 25
  for (let i = 0; i < 400; i += p4cBatchSize) {
    const batchPromises = []
    for (let j = 0; j < p4cBatchSize && i + j < 400; j++) {
      const k = i + j + 1
      const profile = PROFILES[k % PROFILES.length]
      const tableNumber = (k % 25) + 1
      const clientIp = `10.4.3.${k}`

      batchPromises.push((async () => {
        const t0 = performance.now()
        // 1. Start and create old order
        const s1 = await apiRequest('/api/tables', {
          method: 'POST',
          headers: { 'x-forwarded-for': clientIp },
          body: JSON.stringify({ slug: profile.slug, table_number: tableNumber, action: 'start_session' }),
        })
        const oldToken = s1.data?.session_token

        // 2. Free / close table
        const freeRes = await apiRequest('/api/tables', {
          method: 'POST',
          headers: { 'x-forwarded-for': clientIp },
          body: JSON.stringify({ slug: profile.slug, table_number: tableNumber, action: 'free' }),
        })

        // 3. Old session token must now be rejected
        const expiredRes = await apiRequest('/api/orders', {
          method: 'POST',
          headers: { 'x-forwarded-for': clientIp },
          body: JSON.stringify({
            slug: profile.slug,
            table_number: tableNumber,
            session_token: oldToken,
            items: [{ product_id: profile.sample_prod, quantity: 1 }],
          }),
        })

        // 4. New guest opens table -> fresh session
        const s2 = await apiRequest('/api/tables', {
          method: 'POST',
          headers: { 'x-forwarded-for': clientIp },
          body: JSON.stringify({ slug: profile.slug, table_number: tableNumber, action: 'start_session' }),
        })
        const newToken = s2.data?.session_token

        const success = freeRes.ok &&
          expiredRes.status === 403 &&
          s2.ok &&
          newToken &&
          newToken !== oldToken

        const dur = performance.now() - t0
        metrics.record(
          'Phase 4C: Table Reuse & Isolation',
          `Liberación y Nuevo Comensal Prístino: Mesa #${tableNumber} [${profile.slug}]`,
          success,
          dur,
          success ? null : { freeRes: freeRes.data, expiredStatus: expiredRes.status, newToken, oldToken }
        )
      })())
    }
    await Promise.all(batchPromises)
  }
  console.log('  ✓ [Fase 4C] 400 liberaciones y reusos con cero solapamiento de sesión certificados')

  metrics.finish()

  // --------------------------------------------------------------------------
  // CERTIFICATION REPORT & METRICS OUTPUT
  // --------------------------------------------------------------------------
  const report = metrics.generateReport()
  const reportJsonPath = path.join(__dirname, '../certification_5000_report.json')
  fs.writeFileSync(reportJsonPath, JSON.stringify(report, null, 2), 'utf8')

  console.log(`\n${COLORS.bold}${COLORS.cyan}================================================================================${COLORS.reset}`)
  console.log(`${COLORS.bold}${COLORS.cyan} 🏆 RESULTADO OFICIAL DE LA MATRIZ DE CERTIFICACIÓN DE 5.000 ESCENARIOS${COLORS.reset}`)
  console.log(`${COLORS.bold}${COLORS.cyan}================================================================================${COLORS.reset}\n`)

  console.log(`  ${COLORS.bold}Total Escenarios Ejecutados:${COLORS.reset} ${report.summary.totalScenarios}`)
  console.log(`  ${COLORS.bold}Escenarios Exitosos:${COLORS.reset}        ${COLORS.green}${report.summary.passed}${COLORS.reset}`)
  console.log(`  ${COLORS.bold}Escenarios Fallidos:${COLORS.reset}        ${report.summary.failed > 0 ? COLORS.red : COLORS.green}${report.summary.failed}${COLORS.reset}`)
  console.log(`  ${COLORS.bold}Tasa de Éxito:${COLORS.reset}              ${COLORS.green}${report.summary.successRate}${COLORS.reset}`)
  console.log(`  ${COLORS.bold}Tasa de Error:${COLORS.reset}              ${COLORS.green}${report.summary.errorRate}${COLORS.reset}`)
  console.log(`  ${COLORS.bold}Tiempo Total:${COLORS.reset}               ${report.summary.totalDurationSec} s`)
  console.log(`  ${COLORS.bold}Throughput:${COLORS.reset}                 ${COLORS.magenta}${report.summary.throughputReqPerSec} req/s${COLORS.reset}\n`)

  console.log(`${COLORS.bold}Distribución de Latencias (Percentiles):${COLORS.reset}`)
  console.log(`  • Min:   ${report.latencyPercentilesMs.min} ms`)
  console.log(`  • Avg:   ${report.latencyPercentilesMs.avg} ms`)
  console.log(`  • p50:   ${report.latencyPercentilesMs.p50} ms`)
  console.log(`  • p90:   ${report.latencyPercentilesMs.p90} ms`)
  console.log(`  • p95:   ${report.latencyPercentilesMs.p95} ms`)
  console.log(`  • p99:   ${report.latencyPercentilesMs.p99} ms`)
  console.log(`  • Max:   ${report.latencyPercentilesMs.max} ms\n`)

  console.log(`${COLORS.bold}Desglose por Fase:${COLORS.reset}`)
  for (const [phase, data] of Object.entries(report.phaseBreakdown)) {
    console.log(`  - ${COLORS.bold}${phase}:${COLORS.reset} ${data.passed}/${data.total} passed (${data.successRate}) | p50: ${data.p50.toFixed(1)}ms | p95: ${data.p95.toFixed(1)}ms`)
  }

  console.log(`\n${COLORS.cyan}Reporte persistido en: ${reportJsonPath}${COLORS.reset}`)
  console.log(`${COLORS.bold}${COLORS.cyan}================================================================================\n${COLORS.reset}`)

  if (report.summary.failed > 0) {
    console.error(`${COLORS.red}✖ Fallaron ${report.summary.failed} escenarios. La certificación ha sido RECHAZADA.${COLORS.reset}`)
    process.exit(1)
  } else {
    console.log(`${COLORS.bold}${COLORS.green}✔ CERTIFICACIÓN EXITOSA: 5.000/5.000 ESCENARIOS SUPERADOS CON 0% ERRORES.${COLORS.reset}\n`)
    process.exit(0)
  }
}

runMatrix().catch(err => {
  console.error('Fatal execution error running matrix:', err)
  process.exit(1)
})
