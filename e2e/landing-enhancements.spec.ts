import { test, expect } from '@playwright/test'

const BASE_URL = process.env.BASE_URL || 'http://localhost:3005'

test.describe('Landing Page Enhancements (6 Bloques)', () => {
  test('Bloque 1: Simulador interactivo de 5 pasos con celebración esmeralda', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' })

    // Paso 1: Enviar pedido
    const sendOrderBtn = page.locator('button:has-text("Enviar pedido")')
    await expect(sendOrderBtn).toBeVisible()
    await sendOrderBtn.click()

    // Paso 2: Mozo valida
    const mozoApproveBtn = page.locator('button:has-text("✓ Aprobar y Enviar a Cocina")')
    await expect(mozoApproveBtn).toBeVisible()
    await mozoApproveBtn.click()

    // Paso 3: Cocina prepara
    const kitchenReadyBtn = page.locator('button:has-text("🔥 ¡LISTO PARA SERVIR!")')
    await expect(kitchenReadyBtn).toBeVisible()
    await kitchenReadyBtn.click()

    // Paso 4: Mozo sirve
    const deliverBtn = page.locator('button:has-text("Entregar y Cobrar Mesa")')
    await expect(deliverBtn).toBeVisible()
    await deliverBtn.click()

    // Paso 5: Pantalla Verde Esmeralda Animada
    await expect(page.locator('text=¡Gracias por tu visita!')).toBeVisible()
    await expect(page.locator('text=+1 Sello sumado a tu Cartilla')).toBeVisible()
    await expect(page.locator('text=⭐ Valorar en Google Maps (+1 sello extra)')).toBeVisible()
    const restartBtn = page.locator('button:has-text("Probar otro pedido en el simulador")')
    await expect(restartBtn).toBeVisible()
  })

  test('Bloque 2: Antes vs. Después con conmutador de 3 modos e insignias', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' })

    const caosBtn = page.locator('button:has-text("Operación Tradicional")')
    const compBtn = page.locator('button:has-text("Comparativa Interactiva")')
    const fluxoBtn = page.locator('button:has-text("Operación con Fluxo")')

    await expect(caosBtn).toBeVisible()
    await expect(compBtn).toBeVisible()
    await expect(fluxoBtn).toBeVisible()

    // Conmutar a modo Fluxo
    await fluxoBtn.click()
    const container = page.locator('#antes-despues')
    await expect(container.getByText('-15 min de espera')).toBeVisible()
    await expect(container.getByText('0 € en hardware', { exact: true })).toBeVisible()
    await expect(container.getByText('+4.9★ en Google')).toBeVisible()
    await expect(container.getByText('100% cuadrado')).toBeVisible()
  })

  test('Bloque 3: Engranajes sticky stack en móvil (< 768px)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' })

    const stickyCards = page.locator('#modulos li.max-md\\:sticky')
    await expect(stickyCards).toHaveCount(5)
  })

  test('Bloque 4: Saltito hover en los 3 Pilares y los 3 Planes', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' })

    const pillarCards = page.locator('#funcionalidades .hover\\:-translate-y-1\\.5')
    const pricingCards = page.locator('#precios .hover\\:-translate-y-1\\.5')

    const pCount = await pillarCards.count()
    const prCount = await pricingCards.count()

    expect(pCount).toBeGreaterThanOrEqual(3)
    expect(prCount).toBeGreaterThanOrEqual(3)
  })

  test('Bloque 5: FAQ cerrado al 100% por defecto', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' })

    const faqButtons = page.locator('#faq button[aria-expanded]')
    const count = await faqButtons.count()
    expect(count).toBe(5)

    for (let i = 0; i < count; i++) {
      await expect(faqButtons.nth(i)).toHaveAttribute('aria-expanded', 'false')
    }
  })

  test('Bloque 6: WhatsApp erradicado y modal de correo unificado', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' })

    // No wa.me links
    const waLinks = await page.locator('a[href*="wa.me"]').count()
    expect(waLinks).toBe(0)

    // FAQ button opens email modal in question mode
    const faqBtn = page.locator('button:has-text("Consultar por Correo ✉️")')
    await expect(faqBtn).toBeVisible()
    await faqBtn.click()

    const modalTitle = page.locator('h3:has-text("Envíanos tu consulta por correo")')
    await expect(modalTitle).toBeVisible()
    await expect(page.locator('button:has-text("ENVIAR CONSULTA POR CORREO")')).toBeVisible()

    // Close modal
    await page.locator('button:has(svg.lucide-x)').click()
    await expect(modalTitle).toBeHidden()

    // Footer button opens email modal
    const footerBtn = page.locator('footer button:has-text("Contacto Comercial")')
    await expect(footerBtn).toBeVisible()
    await footerBtn.click()

    await expect(modalTitle).toBeVisible()
  })
})
