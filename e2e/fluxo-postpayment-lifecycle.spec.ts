import { test, expect } from '@playwright/test'

/**
 * FLUXO 1.3 — E2E Post-Payment Anti-Zombie Multi-Round, Google Maps Review CTA & Table Lifecycle
 *
 * Flow specification verification:
 * 1. Simula una mesa con 2 rondas: Ronda 1 (Combo en estado 'ready') + Ronda 2 (Postre en estado 'delivered').
 * 2. En el Comandero, marca la mesa como cobrada ("Cobrar Cuenta").
 * 3. En la vista del cliente (/menu/[slug]), verifica que aparece el banner esmeralda (MESA #X · PAGO CONFIRMADO)
 *    con AMBOS botones ("⭐ Valorar en Google Maps" y "🎁 Unirme al Club de Premios") + la tarjeta de 5 estrellas debajo.
 * 4. Espera >8 segundos, interactúa con el modal de Premios y dispara eventos visibilitychange / focus,
 *    certificando que la vista permanece 100% bloqueada en PAGO CONFIRMADO sin regresar jamás a
 *    "¡Tus platos están saliendo a la mesa!" ni a "¿Deseas sumar café o postre...".
 * 5. En el Comandero, verifica que la mesa figure en "Por Levantar" hasta que el mozo la libere,
 *    y que el comensal solo reinicia la carta al pulsar "Iniciar un nuevo pedido en esta mesa".
 */

test.describe('Fluxo 1.3 — Post-Payment Multi-Round Anti-Zombie & Google Maps CTA Suite', () => {
  const SLUG = 'burger-gourmet'
  const TABLE_NUM = 15

  test('Multi-Round Table (Round 1 Ready + Round 2 Delivered): Comandero charges table -> Dual CTA Banner + 5-Star Card -> 8s + Focus/Visibility + Premios Modal -> Zero Zombie Regression', async ({ browser, request }) => {
    // --------------------------------------------------------------------------
    // PASO 0: Crear 2 rondas en la Mesa 15 (Ronda 1: Combo en 'ready', Ronda 2: Postre en 'delivered')
    // --------------------------------------------------------------------------
    const idempotencyKeyR1 = `e2e-pay-r1-${Date.now()}`
    const createR1Res = await request.post('/api/orders', {
      data: {
        slug: SLUG,
        table_number: TABLE_NUM,
        idempotency_key: idempotencyKeyR1,
        items: [
          {
            product_id: 'p-ent-1',
            quantity: 1,
            notes: '[Combo Pareja #1] [COURSE:starter] [ENTRADA_LISTA]',
          },
          {
            product_id: 'p-bur-1',
            quantity: 1,
            notes: '[Combo Pareja #1] [COURSE:main]',
          },
        ],
        created_by: 'waiter',
      },
    })
    expect(createR1Res.ok()).toBeTruthy()
    const createR1Data = await createR1Res.json()
    const orderIdR1 = createR1Data.order.id

    // Transicionar Ronda 1 a 'preparing' y luego a 'ready' (simulando 1º Entradas listo para servir)
    await request.patch('/api/orders', {
      headers: { 'x-staff-pin': '1234' },
      data: { slug: SLUG, orderId: orderIdR1, status: 'preparing', actor_type: 'kitchen' },
    })
    const readyR1Res = await request.patch('/api/orders', {
      headers: { 'x-staff-pin': '1234' },
      data: { slug: SLUG, orderId: orderIdR1, status: 'ready', actor_type: 'kitchen' },
    })
    expect(readyR1Res.ok()).toBeTruthy()

    // Crear Ronda 2: Postre (Volcán de Chocolate) y transicionarla a 'delivered'
    const idempotencyKeyR2 = `e2e-pay-r2-${Date.now()}`
    const createR2Res = await request.post('/api/orders', {
      data: {
        slug: SLUG,
        table_number: TABLE_NUM,
        idempotency_key: idempotencyKeyR2,
        items: [
          {
            product_id: 'p-pos-1',
            quantity: 1,
            notes: '[COURSE:dessert] [POSTRE_SERVIDO]',
          },
        ],
        created_by: 'waiter',
      },
    })
    expect(createR2Res.ok()).toBeTruthy()
    const createR2Data = await createR2Res.json()
    const orderIdR2 = createR2Data.order.id

    const deliverR2Res = await request.patch('/api/orders', {
      headers: { 'x-staff-pin': '1234' },
      data: { slug: SLUG, orderId: orderIdR2, status: 'delivered', actor_type: 'waiter' },
    })
    expect(deliverR2Res.ok()).toBeTruthy()

    // --------------------------------------------------------------------------
    // PASO 1: Abrir vista de Comensal en Móvil y vista de Comandero en Tablet
    // --------------------------------------------------------------------------
    const dinerContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      locale: 'es-ES',
    })
    await dinerContext.addInitScript(({ slug, table }) => {
      localStorage.setItem('gastro_cookie_consent_v1', 'accepted_essential')
      localStorage.setItem('fluxo_selected_lang', 'es')
      sessionStorage.removeItem(`fluxo_paid_lock_${slug}_${table}`)
      sessionStorage.removeItem(`fluxo_table_paid_lock_${slug}_${table}`)
      sessionStorage.removeItem(`fluxo_paid_order_${slug}_${table}`)
      sessionStorage.removeItem(`fluxo_table_paid_${slug}_${table}`)
      sessionStorage.removeItem(`fluxo_bill_requested_${slug}_${table}`)
    }, { slug: SLUG, table: TABLE_NUM })

    const dinerPage = await dinerContext.newPage()
    await dinerPage.goto(`/menu/${SLUG}?table=${TABLE_NUM}`, { waitUntil: 'domcontentloaded' })
    await dinerPage.waitForTimeout(1000)

    const waiterContext = await browser.newContext({
      viewport: { width: 1024, height: 768 },
      locale: 'es-ES',
    })
    await waiterContext.addInitScript(({ slug }) => {
      localStorage.setItem('gastro_cookie_consent_v1', 'accepted_essential')
      sessionStorage.setItem(`fluxo_staff_auth_comandero_${slug}`, JSON.stringify({ auth: true, timestamp: Date.now() }))
      sessionStorage.setItem('fluxo_staff_session', '1234')
      localStorage.setItem('fluxo_staff_session', '1234')
    }, { slug: SLUG })

    const waiterPage = await waiterContext.newPage()
    await waiterPage.goto(`/staff/comandero/${SLUG}`, { waitUntil: 'domcontentloaded' })
    await waiterPage.waitForTimeout(1000)

    // Si aparece modal de PIN, marcar 1234
    const pinModal = waiterPage.locator('text=Acceso Comandero Mozo')
    if (await pinModal.isVisible().catch(() => false)) {
      for (const digit of ['1', '2', '3', '4']) {
        await waiterPage.getByRole('button', { name: digit, exact: true }).click()
      }
    }

    // --------------------------------------------------------------------------
    // PASO 2: En Comandero, seleccionar Mesa 15 y pulsar "Cobrar Cuenta"
    // --------------------------------------------------------------------------
    const tableButton = waiterPage.locator('button', { hasText: `#${TABLE_NUM}` }).first()
    await expect(tableButton).toBeVisible({ timeout: 10000 })
    await tableButton.click()
    await waiterPage.waitForTimeout(500)

    const chargeButton = waiterPage.locator('button:has-text("Cobrar Cuenta")').first()
    await expect(chargeButton).toBeVisible({ timeout: 10000 })
    await chargeButton.click()

    const modalConfirmBtn = waiterPage.locator('button[data-testid="confirm-charge-button"], button:has-text("Tarjeta"), button:has-text("Efectivo")').filter({ hasText: /Cobrar/ }).first()
    await expect(modalConfirmBtn).toBeVisible({ timeout: 5000 })
    await modalConfirmBtn.click()
    await waiterPage.waitForTimeout(1000)

    // Verificar en API que AMBAS órdenes (Ronda 1 y Ronda 2) fueron barridas a 'paid' y sus order_items marcados como servidos
    const checkOrdersAfterPayRes = await request.get(`/api/orders?slug=${SLUG}&table=${TABLE_NUM}`)
    expect(checkOrdersAfterPayRes.ok()).toBeTruthy()
    const checkOrdersAfterPayData = await checkOrdersAfterPayRes.json()
    const afterPayR1 = checkOrdersAfterPayData.orders.find((o: any) => o.id === orderIdR1)
    const afterPayR2 = checkOrdersAfterPayData.orders.find((o: any) => o.id === orderIdR2)
    expect(afterPayR1?.status).toBe('paid')
    expect(afterPayR2?.status).toBe('paid')
    for (const item of afterPayR1?.order_items || []) {
      expect(item.notes).toContain('[ENTRADA_SERVIDA]')
      expect(item.notes).toContain('[PRINCIPAL_SERVIDO]')
    }

    // --------------------------------------------------------------------------
    // PASO 3: Verificar en el cliente el Banner Esmeralda con AMBOS botones + Tarjeta 5 Estrellas
    // --------------------------------------------------------------------------
    await dinerPage.bringToFront()
    await dinerPage.waitForTimeout(1000)

    // Banner Esmeralda PAGO CONFIRMADO
    const paidBadge = dinerPage.locator(`text=/MESA #${TABLE_NUM}.*PAGO CONFIRMADO/i`).first()
    await expect(paidBadge).toBeVisible({ timeout: 10000 })

    const paidHeader = dinerPage.locator('text=¡Cuenta pagada! Muchas gracias por tu visita').first()
    await expect(paidHeader).toBeVisible({ timeout: 10000 })

    // Ambos botones en el banner esmeralda
    const bannerGoogleMapsBtn = dinerPage.locator('button:has-text("⭐ Valorar en Google Maps")').first()
    await expect(bannerGoogleMapsBtn).toBeVisible({ timeout: 10000 })

    const bannerClubPremiosBtn = dinerPage.locator('button:has-text("🎁 Unirme al Club de Premios")').first()
    await expect(bannerClubPremiosBtn).toBeVisible({ timeout: 10000 })

    // Tarjeta de 5 estrellas debajo del banner
    const fiveStarCardTitle = dinerPage.locator('text=¿Qué tal estuvo tu experiencia hoy?').first()
    await expect(fiveStarCardTitle).toBeVisible({ timeout: 10000 })
    const fiveStarBtn = dinerPage.locator('button[aria-label="5 estrellas"]').first()
    await expect(fiveStarBtn).toBeVisible({ timeout: 5000 })

    // Bloque Club de Premios / Fidelización debajo
    const loyaltyBlock = dinerPage.locator('text=/Club de Premios|puntos con tu comanda/i').first()
    await expect(loyaltyBlock).toBeVisible({ timeout: 10000 })

    // --------------------------------------------------------------------------
    // PASO 4: Esperar >8 segundos, interactuar con Premios y disparar visibilitychange / focus
    // --------------------------------------------------------------------------
    await bannerClubPremiosBtn.click()
    await dinerPage.waitForTimeout(500)

    // Cerrar modal de fidelización
    const closeLoyaltyBtn = dinerPage.locator('button[title="Cerrar ventana"], button:has(svg.lucide-x)').first()
    if (await closeLoyaltyBtn.isVisible()) {
      await closeLoyaltyBtn.click()
    }

    // Esperar 8 segundos (cubre múltiples ciclos de polling de 4.5s)
    await dinerPage.waitForTimeout(8200)

    // Simular eventos visibilitychange y focus
    await dinerPage.evaluate(() => {
      document.dispatchEvent(new Event('visibilitychange'))
      window.dispatchEvent(new Event('focus'))
    })
    await dinerPage.waitForTimeout(1000)

    // Certificar CERO REGRESIÓN a "¡Tus platos están saliendo a la mesa!" o "Pedir la cuenta"
    const zombieReadyBanner = dinerPage.locator('text=/¡Tus platos están saliendo a la mesa!/i')
    await expect(zombieReadyBanner).toHaveCount(0)

    const zombiePreparingBanner = dinerPage.locator('text=/Comanda en curso · Cocina preparando tu pedido/i')
    await expect(zombiePreparingBanner).toHaveCount(0)

    const requestBillBlock = dinerPage.locator('text=/¿Deseas sumar café o postre para la sobremesa, o pedir la cuenta/i')
    await expect(requestBillBlock).toHaveCount(0)

    // El banner esmeralda con ambos botones y la tarjeta de 5 estrellas siguen 100% bloqueados en pantalla
    await expect(paidBadge).toBeVisible()
    await expect(paidHeader).toBeVisible()
    await expect(bannerGoogleMapsBtn).toBeVisible()
    await expect(bannerClubPremiosBtn).toBeVisible()
    await expect(fiveStarCardTitle).toBeVisible()

    // --------------------------------------------------------------------------
    // PASO 5: En Comandero, verificar que la mesa figura en "Por Levantar" / "En Sobremesa"
    // --------------------------------------------------------------------------
    await waiterPage.bringToFront()
    await waiterPage.waitForTimeout(1000)

    const sobremesaBadge = waiterPage.locator('text=/PAGADA · En Sobremesa|Por Levantar/i').first()
    await expect(sobremesaBadge).toBeVisible({ timeout: 10000 })

    const adviceBanner = waiterPage.locator('text=/El cliente ya recibió el enlace de Google Maps y sus puntos/i').first()
    await expect(adviceBanner).toBeVisible({ timeout: 10000 })

    const liberateButton = waiterPage.locator('button:has-text("MESA LEVANTADA · LIBERAR PARA SIGUIENTE CLIENTE")').first()
    await expect(liberateButton).toBeVisible({ timeout: 10000 })

    // --------------------------------------------------------------------------
    // PASO 6: Pulsar "MESA LEVANTADA · LIBERAR PARA SIGUIENTE CLIENTE"
    // --------------------------------------------------------------------------
    await liberateButton.click()
    await waiterPage.waitForTimeout(1200)

    await dinerPage.bringToFront()
    await expect(zombieReadyBanner).toHaveCount(0)
    await expect(requestBillBlock).toHaveCount(0)
    await expect(bannerGoogleMapsBtn).toBeVisible()
    await expect(bannerClubPremiosBtn).toBeVisible()

    // --------------------------------------------------------------------------
    // PASO 7: Comensal pulsa "Iniciar un nuevo pedido en esta mesa" y reinicia la sesión limpia
    // --------------------------------------------------------------------------
    const resetSessionBtn = dinerPage.locator('button:has-text("Iniciar un nuevo pedido en esta mesa")').first()
    await expect(resetSessionBtn).toBeVisible({ timeout: 5000 })
    await resetSessionBtn.click()
    await dinerPage.waitForTimeout(600)
    await expect(paidHeader).toHaveCount(0)

    // Cleanup
    await dinerContext.close()
    await waiterContext.close()
  })
})

