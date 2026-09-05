import { test, expect } from '@playwright/test'

/**
 * FLUXO GASTRONOMIC SYSTEM — PLAYWRIGHT END-TO-END SUITE
 * 
 * Verifica el ciclo de vida completo de la comanda según las reglas de AGENTS.md:
 * 1. Comensal (/menu/[slug]?table=1): Selección de plato y envío -> estado 'pending_validation'
 * 2. Mozo Gatekeeper (/staff/comandero/[slug]): Validación en mesa -> estado 'pending'
 * 3. Cocina KDS (/staff/kitchen/[slug]): Recepción reactiva -> 'preparing' -> 'ready' -> 'delivered'
 * 4. Invariantes de Arquitectura: Aislamiento por UUID, máquina de estados e idempotencia.
 */

test.describe('Fluxo Gastronomic Order Lifecycle (Comensal -> Mozo -> Cocina)', () => {
  const SLUG = 'burger-gourmet'
  test('E2E Order Flow: Comensal creates order, Waiter validates, Kitchen prepares & delivers', async ({ browser, request }) => {
    // --------------------------------------------------------------------------
    // FASE 0: Sanear o consultar estado inicial vía API
    // --------------------------------------------------------------------------
    const initialOrdersRes = await request.get(`/api/orders?slug=${SLUG}`)
    expect(initialOrdersRes.ok()).toBeTruthy()
    const initialData = await initialOrdersRes.json()
    expect(Array.isArray(initialData.orders)).toBeTruthy()

    // Determinar una mesa (entre 1 y 25) que no tenga órdenes activas previas
    const activeTables = new Set(
      initialData.orders
        .filter((o: any) => o.status !== 'cancelled' && o.status !== 'paid' && o.status !== 'delivered')
        .map((o: any) => Number(o.table_number || o.table?.table_number))
    )
    let selectedTableNum = 20
    for (let t = 25; t >= 1; t--) {
      if (!activeTables.has(t)) {
        selectedTableNum = t
        break
      }
    }

    // --------------------------------------------------------------------------
    // FASE 1: Comensal en Mesa seleccionada (/menu/[slug]?table=X)
    // --------------------------------------------------------------------------
    const dinerContext = await browser.newContext({
      viewport: { width: 390, height: 844 }, // Mobile First
      locale: 'es-ES',
    })
    // Pre-configurar cookies, idioma y limpiar tokens residuales
    await dinerContext.addInitScript(({ slug, table }) => {
      localStorage.setItem('gastro_cookie_consent_v1', 'accepted_essential')
      localStorage.setItem('fluxo_selected_lang', 'es')
      localStorage.removeItem(`gastro_session_${slug}_${table}`)
      localStorage.removeItem(`gastro_cart_v1_${slug}_${table}`)
    }, { slug: SLUG, table: selectedTableNum })

    const dinerPage = await dinerContext.newPage()
    dinerPage.on('dialog', dialog => dialog.dismiss())
    await dinerPage.goto(`/menu/${SLUG}?table=${selectedTableNum}`, { waitUntil: 'domcontentloaded' })
    await dinerPage.waitForSelector('body')

    // Verificar que el catálogo cargó correctamente
    const headerTitle = dinerPage.locator('h1, header, nav')
    await expect(headerTitle.first()).toBeVisible({ timeout: 15000 })

    // Localizar y pulsar el botón para agregar un plato al carrito (+ con title="Añadir a la comanda")
    const addToCartButton = dinerPage.locator('button[title="Añadir a la comanda"]').first()
    await expect(addToCartButton).toBeVisible({ timeout: 15000 })
    await addToCartButton.click()

    // Verificar que aparece la barra flotante inferior del carrito y hacer clic para abrir el CartDrawer
    const openCartButton = dinerPage.getByRole('button', { name: /Ver Comanda/i }).first()
    await expect(openCartButton).toBeVisible({ timeout: 10000 })
    await openCartButton.click()

    // En el CartDrawer, pulsar "ENVIAR COMANDA AL MOZO"
    const submitOrderButton = dinerPage.locator('button:has-text("ENVIAR COMANDA AL MOZO")').first()
    await expect(submitOrderButton).toBeVisible({ timeout: 10000 })

    // Interceptar la petición POST /api/orders para verificar la respuesta del backend
    const orderPromise = dinerPage.waitForResponse(
      response => response.url().includes('/api/orders') && response.request().method() === 'POST'
    )
    await submitOrderButton.click()
    const orderResponse = await orderPromise
    expect(orderResponse.ok()).toBeTruthy()

    const orderData = await orderResponse.json()
    expect(orderData.success).toBe(true)
    expect(orderData.order).toBeDefined()
    expect(orderData.order.id).toBeDefined()

    const createdOrderId = orderData.order.id
    // AGENTS.md Invariante: La comanda creada por un comensal nace estrictamente en pending_validation
    expect(orderData.order.status).toBe('pending_validation')

    // --------------------------------------------------------------------------
    // FASE 2: Mozo Gatekeeper (/staff/comandero/[slug])
    // --------------------------------------------------------------------------
    const waiterContext = await browser.newContext({
      viewport: { width: 412, height: 915 },
      locale: 'es-ES',
    })
    // Pre-autenticar sesión del mozo en localStorage para omitir pantalla de PIN
    await waiterContext.addInitScript(({ slug }) => {
      localStorage.setItem('gastro_cookie_consent_v1', 'accepted_essential')
      localStorage.setItem(`fluxo_staff_auth_comandero_${slug}`, JSON.stringify({ auth: true, timestamp: Date.now() }))
    }, { slug: SLUG })

    const waiterPage = await waiterContext.newPage()
    await waiterPage.goto(`/staff/comandero/${SLUG}`, { waitUntil: 'domcontentloaded' })

    // Si aún aparece el modal de PIN, ingresar el PIN autorizado '4154928'
    const pinInput = waiterPage.locator('input[type="password"], input[inputmode="numeric"]')
    if (await pinInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await pinInput.fill('4154928')
      const enterBtn = waiterPage.locator('button:has-text("Acceder"), button:has-text("Ingresar"), button:has(svg.lucide-arrow-right)')
      if (await enterBtn.isVisible().catch(() => false)) {
        await enterBtn.first().click()
      }
    }

    // El mozo ve la comanda en pending_validation de la mesa del test
    const waiterCard = waiterPage.locator('div', { has: waiterPage.locator(`text=Mesa #${selectedTableNum}`) }).filter({ hasText: 'Confirmar a Cocina' }).first()
    const validateButton = waiterCard.locator('button:has-text("Confirmar a Cocina")')
    await expect(validateButton).toBeVisible({ timeout: 15000 })

    // El mozo pulsa "Confirmar a Cocina"
    const patchPromise = waiterPage.waitForResponse(
      response => response.url().includes('/api/orders') && (response.request().method() === 'PATCH' || response.request().method() === 'POST')
    )
    await validateButton.click()
    const patchResponse = await patchPromise
    expect(patchResponse.ok()).toBeTruthy()

    // Verificar en backend que la comanda ahora tiene estado 'pending'
    const verifyPendingRes = await request.get(`/api/orders?slug=${SLUG}`)
    const verifyPendingData = await verifyPendingRes.json()
    const updatedOrder = verifyPendingData.orders.find((o: any) => o.id === createdOrderId)
    expect(updatedOrder).toBeDefined()
    expect(updatedOrder.status).toBe('pending')

    // --------------------------------------------------------------------------
    // FASE 3: Cocina KDS (/staff/kitchen/[slug])
    // --------------------------------------------------------------------------
    const kitchenContext = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      locale: 'es-ES',
    })
    // Pre-autenticar sesión de cocina en localStorage
    await kitchenContext.addInitScript(({ slug }) => {
      localStorage.setItem('gastro_cookie_consent_v1', 'accepted_essential')
      localStorage.setItem(`fluxo_staff_auth_kitchen_${slug}`, JSON.stringify({ auth: true, timestamp: Date.now() }))
    }, { slug: SLUG })

    const kitchenPage = await kitchenContext.newPage()
    await kitchenPage.goto(`/staff/kitchen/${SLUG}`, { waitUntil: 'domcontentloaded' })

    // Si aparece PIN en cocina, ingresar PIN autorizado '4154928'
    const kitchenPinInput = kitchenPage.locator('input[type="password"], input[inputmode="numeric"]')
    if (await kitchenPinInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await kitchenPinInput.fill('4154928')
      const enterBtn = kitchenPage.locator('button:has-text("Acceder"), button:has-text("Ingresar"), button:has(svg.lucide-arrow-right)')
      if (await enterBtn.isVisible().catch(() => false)) {
        await enterBtn.first().click()
      }
    }

    // La cocina ve el ticket de la comanda con botón "INICIAR PREPARACIÓN"
    const kitchenTicket = kitchenPage.locator('div.rounded-3xl').filter({ hasText: `Mesa ${selectedTableNum}` }).first()
    const startPrepButton = kitchenTicket.locator('button:has-text("INICIAR PREPARACIÓN")')
    await expect(startPrepButton).toBeVisible({ timeout: 15000 })
    const prepPromise = kitchenPage.waitForResponse(
      response => response.url().includes('/api/orders') && (response.request().method() === 'PATCH' || response.request().method() === 'POST')
    )
    await startPrepButton.click()
    await prepPromise

    // Verificar transición a 'preparing' y botón "MARCAR LISTO PARA SERVIR"
    const prepTicket = kitchenPage.locator('div.rounded-3xl').filter({ hasText: `Mesa ${selectedTableNum}` }).first()
    const readyButton = prepTicket.locator('button:has-text("MARCAR LISTO PARA SERVIR")')
    await expect(readyButton).toBeVisible({ timeout: 15000 })
    const readyPromise = kitchenPage.waitForResponse(
      response => response.url().includes('/api/orders') && (response.request().method() === 'PATCH' || response.request().method() === 'POST')
    )
    await readyButton.click()
    await readyPromise

    // Verificar transición a 'ready' y botón "MARCAR SERVIDO Y ENTREGADO"
    const readyTicket = kitchenPage.locator('div.rounded-3xl').filter({ hasText: `Mesa ${selectedTableNum}` }).first()
    const deliverButton = readyTicket.locator('button:has-text("MARCAR SERVIDO Y ENTREGADO")')
    await expect(deliverButton).toBeVisible({ timeout: 15000 })
    const deliverPromise = kitchenPage.waitForResponse(
      response => response.url().includes('/api/orders') && (response.request().method() === 'PATCH' || response.request().method() === 'POST')
    )
    await deliverButton.click()
    await deliverPromise

    // --------------------------------------------------------------------------
    // FASE 3.5: Cliente (Seguimiento) — Validación Bidireccional (AGENTS.md)
    // El comensal ve reactivamente en pantalla el aviso de pedido entregado
    // --------------------------------------------------------------------------
    await dinerPage.bringToFront()
    await dinerPage.reload({ waitUntil: 'domcontentloaded' })
    const deliveredNotice = dinerPage.locator('text=/Buen provecho|entregado/i').first()
    await expect(deliveredNotice).toBeVisible({ timeout: 15000 })

    // Comprobar apertura interactiva del timeline de seguimiento (Ver Fases)
    const viewPhasesButton = dinerPage.getByRole('button', { name: /Ver Fases/i }).first()
    if (await viewPhasesButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await viewPhasesButton.click()
      await expect(dinerPage.locator('text=Estado de tu Comanda')).toBeVisible({ timeout: 5000 })
      const closeBtn = dinerPage.locator('button:has(svg.lucide-x)').first()
      if (await closeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await closeBtn.click()
      }
    }

    // --------------------------------------------------------------------------
    // FASE 4: Verificación de Invariantes de Arquitectura (AGENTS.md)
    // --------------------------------------------------------------------------
    await expect.poll(async () => {
      const res = await request.get(`/api/orders?slug=${SLUG}`)
      const data = await res.json()
      const o = data.orders.find((ord: any) => ord.id === createdOrderId)
      return o?.status
    }, { timeout: 10000, intervals: [500, 1000] }).toBe('delivered')

    const finalOrdersRes = await request.get(`/api/orders?slug=${SLUG}`)
    const finalData = await finalOrdersRes.json()
    const deliveredOrder = finalData.orders.find((o: any) => o.id === createdOrderId)
    expect(deliveredOrder).toBeDefined()
    expect(deliveredOrder.status).toBe('delivered')

    // Aislamiento por UUID: el ID de comanda debe existir y ser una cadena única
    expect(typeof deliveredOrder.id).toBe('string')
    expect(deliveredOrder.id.length).toBeGreaterThan(8)

    // Cleanup de contextos
    await dinerContext.close()
    await waiterContext.close()
    await kitchenContext.close()
  })

  test('Architectural Invariant: Idempotency prevents duplicate orders on rapid double submit', async ({ request }) => {
    const idempotencyKey = `idemp-test-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`
    const payload = {
      slug: SLUG,
      table_number: 1,
      idempotency_key: idempotencyKey,
      items: [
        {
          product_id: 'prod-burger-classic',
          quantity: 2,
          notes: 'Doble queso, sin cebolla',
        },
      ],
      created_by: 'diner',
    }

    // Primer envío
    const res1 = await request.post('/api/orders', { data: payload })
    expect(res1.ok()).toBeTruthy()
    const data1 = await res1.json()
    expect(data1.success).toBe(true)
    const firstOrderId = data1.order.id

    // Segundo envío idéntico inmediato con la misma idempotency key
    const res2 = await request.post('/api/orders', { data: payload })
    expect(res2.ok()).toBeTruthy()
    const data2 = await res2.json()
    expect(data2.success).toBe(true)

    // Debe retornar exactamente la misma comanda por su UUID, sin duplicar
    expect(data2.order.id).toBe(firstOrderId)
  })
})
