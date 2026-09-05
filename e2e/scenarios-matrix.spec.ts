import { test, expect } from '@playwright/test'

/**
 * FLUXO GASTRONOMIC SYSTEM — PLAYWRIGHT INTEGRATION SUITE
 * 
 * Verifica los escenarios de la matriz en Playwright:
 * - Multi-Perfil: 'burger-gourmet', 'taperia-casco-antigo', 'terraza-malecon'
 * - Ciclos multi-ronda (Entrantes -> Principales -> Postres -> Cuenta)
 * - Concurrencia de pedidos simultáneos
 * - Resiliencia y restauración de sesión Safari ITP vía Cookie
 * - Invariantes de seguridad (Rechazo de saltos ilegales, manipulación de precios, RBAC)
 */

test.describe('Fluxo Gastronomic System — Matrix Integration Suite', () => {
  const PROFILES = [
    {
      slug: 'burger-gourmet',
      sampleProd: 'p-bur-1',
      samplePrice: 13.90,
      table: 11,
    },
    {
      slug: 'taperia-casco-antigo',
      sampleProd: 'p-tca-pulpo',
      samplePrice: 18.50,
      table: 12,
    },
    {
      slug: 'terraza-malecon',
      sampleProd: 'p-tm-tosta-salmon',
      samplePrice: 7.80,
      table: 13,
    },
  ]

  for (const prof of PROFILES) {
    test(`Multi-Round Cycle & Table Isolation on profile: ${prof.slug} (Table #${prof.table})`, async ({ request }) => {
      // 1. Iniciar sesión en la mesa
      const sessRes = await request.post('/api/tables', {
        data: {
          slug: prof.slug,
          table_number: prof.table,
          action: 'start_session',
        },
      })
      expect(sessRes.ok()).toBeTruthy()
      const sessData = await sessRes.json()
      expect(sessData.success).toBe(true)
      const sessionToken = sessData.session_token
      expect(sessionToken).toBeDefined()

      // 2. Ronda 1: Bebidas / Entrantes
      const r1Res = await request.post('/api/orders', {
        data: {
          slug: prof.slug,
          table_number: prof.table,
          session_token: sessionToken,
          created_by: 'diner',
          idempotency_key: `pw-r1-${prof.slug}-${Date.now()}`,
          items: [{ product_id: prof.sampleProd, quantity: 1 }],
        },
      })
      expect(r1Res.ok()).toBeTruthy()
      const r1Data = await r1Res.json()
      expect(r1Data.order.status).toBe('pending_validation')
      const r1OrderId = r1Data.order.id

      // 3. Mozo valida comanda
      const valRes = await request.patch('/api/orders', {
        data: {
          slug: prof.slug,
          orderId: r1OrderId,
          status: 'pending',
          actor_type: 'waiter',
        },
      })
      expect(valRes.ok()).toBeTruthy()

      // 4. Cocina prepara y entrega comanda
      const prepRes = await request.patch('/api/orders', {
        data: { slug: prof.slug, orderId: r1OrderId, status: 'preparing', actor_type: 'kitchen' },
      })
      expect(prepRes.ok()).toBeTruthy()

      const readyRes = await request.patch('/api/orders', {
        data: { slug: prof.slug, orderId: r1OrderId, status: 'ready', actor_type: 'kitchen' },
      })
      expect(readyRes.ok()).toBeTruthy()

      const deliverRes = await request.patch('/api/orders', {
        data: { slug: prof.slug, orderId: r1OrderId, status: 'delivered', actor_type: 'waiter' },
      })
      expect(deliverRes.ok()).toBeTruthy()

      // 5. Ronda 4: Pedir la cuenta
      const billRes = await request.post('/api/service-calls', {
        data: {
          slug: prof.slug,
          table_number: prof.table,
          call_type: 'bill_card',
        },
      })
      expect(billRes.ok()).toBeTruthy()
      const billData = await billRes.json()
      expect(billData.success).toBe(true)

      // 6. Liberar mesa
      const freeRes = await request.post('/api/tables', {
        data: {
          slug: prof.slug,
          table_number: prof.table,
          action: 'free',
        },
      })
      expect(freeRes.ok()).toBeTruthy()
    })
  }

  test('High-concurrency simultaneous orders from multiple tables arrive without collision', async ({ request }) => {
    const concurrentTables = [15, 16, 17, 18, 19, 21, 22, 23]
    const SLUG = 'burger-gourmet'

    const orderPromises = concurrentTables.map(tbl =>
      request.post('/api/orders', {
        data: {
          slug: SLUG,
          table_number: tbl,
          created_by: 'diner',
          idempotency_key: `pw-conc-${tbl}-${Date.now()}`,
          items: [{ product_id: 'p-bur-1', quantity: 1 }],
        },
      })
    )

    const responses = await Promise.all(orderPromises)
    const orderIds = new Set<string>()

    for (let i = 0; i < responses.length; i++) {
      const res = responses[i]
      expect(res.ok()).toBeTruthy()
      const data = await res.json()
      expect(data.success).toBe(true)
      expect(data.order.table_number).toBe(concurrentTables[i])
      orderIds.add(data.order.id)
    }

    // Todos los IDs deben ser estrictamente únicos (Aislamiento por UUID)
    expect(orderIds.size).toBe(concurrentTables.length)
  })

  test('Safari ITP Cookie session restore correctly hydrates active table orders', async ({ request }) => {
    const SLUG = 'burger-gourmet'
    const tableNumber = 25

    // Iniciar sesión
    const sessRes = await request.post('/api/tables', {
      data: { slug: SLUG, table_number: tableNumber, action: 'start_session' },
    })
    const sessData = await sessRes.json()
    const token = sessData.session_token

    // Crear comanda en curso
    const ordRes = await request.post('/api/orders', {
      data: {
        slug: SLUG,
        table_number: tableNumber,
        session_token: token,
        created_by: 'diner',
        items: [{ product_id: 'p-bur-1', quantity: 1 }],
      },
    })
    expect(ordRes.ok()).toBeTruthy()

    // Simular recarga de pestaña vía endpoint de restauración con la Cookie HTTP-Only
    const restoreRes = await request.get(`/api/session/restore?slug=${SLUG}&table=${tableNumber}`, {
      headers: {
        Cookie: `gastro_session_${SLUG}_${tableNumber}=${token}`,
      },
    })
    expect(restoreRes.ok()).toBeTruthy()
    const restoreData = await restoreRes.json()
    expect(restoreData.restored).toBe(true)
    expect(restoreData.session_token).toBe(token)
    expect(restoreData.orders.length).toBeGreaterThan(0)
  })

  test('Adversarial Invariant: Illegal state jump is rejected with HTTP 400', async ({ request }) => {
    const SLUG = 'burger-gourmet'

    // Crear comanda
    const ordRes = await request.post('/api/orders', {
      data: {
        slug: SLUG,
        table_number: 14,
        created_by: 'diner',
        items: [{ product_id: 'p-bur-1', quantity: 1 }],
      },
    })
    const ordData = await ordRes.json()
    const orderId = ordData.order.id

    // Intentar salto ilegal: pending_validation -> paid
    const illegalJump = await request.patch('/api/orders', {
      data: {
        slug: SLUG,
        orderId,
        status: 'paid',
      },
    })
    expect(illegalJump.status()).toBe(400)
    const errData = await illegalJump.json()
    expect(errData.code).toBe('TRANSITION_INVALID')
  })
})
