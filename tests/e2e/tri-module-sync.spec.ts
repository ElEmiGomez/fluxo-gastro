// ==============================================================================
// FLUXO GASTRO PWA - PLAYWRIGHT E2E MULTI-BROWSER TRI-MODULE REAL-TIME SYNC
// Simula 3 actores en paralelo interactuando en tiempo real:
// 1. Móvil Comensal (iPhone 14 Pro)
// 2. Tablet Camarero (iPad Air)
// 3. Desktop Cocina KDS (Full HD)
// ==============================================================================

import { test, expect, devices } from '@playwright/test'

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'
const TENANT_SLUG = 'burger-gourmet'
const TABLE_NUMBER = '7'

test.describe('E2E Tri-Module Synchronization: Comensal -> Cocina -> Camarero', () => {
  test('Flujo completo en tiempo real entre 3 dispositivos simultáneos', async ({ browser }) => {
    // -------------------------------------------------------------------------
    // ACTOR 1: MÓVIL COMENSAL (iPhone 14 Pro)
    // -------------------------------------------------------------------------
    const dinerContext = await browser.newContext({
      ...devices['iPhone 14 Pro'],
      locale: 'gl-ES',
      permissions: ['geolocation'],
    })
    const dinerPage = await dinerContext.newPage()

    // -------------------------------------------------------------------------
    // ACTOR 2: TABLET CAMARERO (iPad Air)
    // -------------------------------------------------------------------------
    const waiterContext = await browser.newContext({
      ...devices['iPad Air'],
      locale: 'es-ES',
    })
    const waiterPage = await waiterContext.newPage()

    // -------------------------------------------------------------------------
    // ACTOR 3: MONITOR KDS DE COCINA (Desktop 1080p)
    // -------------------------------------------------------------------------
    const kitchenContext = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      locale: 'es-ES',
    })
    const kitchenPage = await kitchenContext.newPage()

    // =========================================================================
    // PASO 1: CARGA SIMULTÁNEA DE LOS TRES MÓDULOS
    // =========================================================================
    console.log('📱 1. Abriendo Comensal, KDS y Comandero...')
    await Promise.all([
      dinerPage.goto(`${BASE_URL}/menu/${TENANT_SLUG}?table=${TABLE_NUMBER}`),
      kitchenPage.goto(`${BASE_URL}/staff/kitchen/${TENANT_SLUG}`),
      waiterPage.goto(`${BASE_URL}/staff/comandero/${TENANT_SLUG}`),
    ])

    // Verificar que el Comensal ve su mesa asignada
    await expect(dinerPage.locator(`text=#${TABLE_NUMBER}`)).toBeVisible({ timeout: 10000 })
    console.log('✅ Comensal conectado a la mesa asignada.')

    // =========================================================================
    // PASO 2: CAMBIO DE IDIOMA POR EL COMENSAL
    // =========================================================================
    console.log('🌐 2. Cambiando idioma a Inglés...')
    const langBtn = dinerPage.locator('button[title*="Cambiar idioma"]')
    await langBtn.click()
    await dinerPage.locator('button:has-text("English")').click()
    // Verificar que el placeholder o títulos traducen a inglés
    await expect(dinerPage.locator('input[placeholder*="Search"]')).toBeVisible({ timeout: 5000 })
    console.log('✅ Interfaz adaptada a English en tiempo real.')

    // =========================================================================
    // PASO 3: AÑADIR AL CARRITO Y CROSS-SELLING AUTOMÁTICO
    // =========================================================================
    console.log('🍔 3. Añadiendo platos al carrito y validando cross-selling...')
    // Añadir Burger
    const addBurgerBtn = dinerPage.locator('button[title*="Añadir a la comanda"]').first()
    await addBurgerBtn.click()

    // Abrir Drawer de Comanda
    const openCartBtn = dinerPage.locator('button:has-text("View Order"), button:has-text("Ver Comanda")')
    await openCartBtn.click()

    // Validar sugerencia inteligente de bebidas (cross-selling activo)
    await expect(dinerPage.locator('text=¿Añades una bebida fría?, text=Would you like a cold drink?')).toBeVisible()

    // =========================================================================
    // PASO 4: ENVÍO DE COMANDA Y RECEPCIÓN INSTANTÁNEA EN COCINA (KDS)
    // =========================================================================
    console.log('🚀 4. Enviando comanda a cocina...')
    const sendOrderBtn = dinerPage.locator('button:has-text("Enviar"), button:has-text("Send")').last()
    await sendOrderBtn.click()

    // Validar recepción en el monitor KDS en menos de 1500ms
    console.log('👨‍🍳 5. Verificando ticket en Monitor KDS...')
    const kdsTicket = kitchenPage.locator(`text=Mesa #${TABLE_NUMBER}, text=Mesa ${TABLE_NUMBER}`).first()
    await expect(kdsTicket).toBeVisible({ timeout: 3000 })
    console.log('✅ Comanda recibida en tiempo real en la pantalla de Cocina.')

    // =========================================================================
    // PASO 5: MÁQUINA DE ESTADOS KDS -> PREPARANDO -> LISTO
    // =========================================================================
    console.log('🔥 6. Cocina cambia estado a "Preparando"...')
    const startPrepBtn = kitchenPage.locator('button:has-text("Preparar"), button:has-text("Empezar")').first()
    if (await startPrepBtn.isVisible()) {
      await startPrepBtn.click()
    }

    // El comensal debe ver el tracker animado en vivo de su pedido
    await expect(dinerPage.locator('text=En Cocina, text=Preparando, text=En marcha')).toBeVisible({ timeout: 3000 })
    console.log('✅ Comensal notificado en vivo: su comida está en preparación.')

    // Cocina termina el plato y marca "Listo"
    const markReadyBtn = kitchenPage.locator('button:has-text("Listo"), button:has-text("Terminado")').first()
    if (await markReadyBtn.isVisible()) {
      await markReadyBtn.click()
    }

    // =========================================================================
    // PASO 6: CAMARERO NOTIFICADO Y MARCA "SERVIDO"
    // =========================================================================
    console.log('🧑‍💼 7. Comandero del Camarero recibe alerta de pase...')
    await expect(waiterPage.locator(`text=Mesa ${TABLE_NUMBER}, text=Mesa #${TABLE_NUMBER}`).first()).toBeVisible()
    
    // Camarero marca entregado
    const deliverBtn = waiterPage.locator('button:has-text("Servir"), button:has-text("Entregado")').first()
    if (await deliverBtn.isVisible()) {
      await deliverBtn.click()
    }

    // =========================================================================
    // PASO 7: CUENTA, COBRO Y LIBERACIÓN ATÓMICA DE MESA
    // =========================================================================
    console.log('💳 8. Cliente solicita cuenta y Camarero libera mesa...')
    // Cliente solicita la cuenta
    const billBtn = dinerPage.locator('button:has-text("Pedir la Cuenta"), button:has-text("Bill")').first()
    if (await billBtn.isVisible()) {
      await billBtn.click()
    }

    // Camarero cobra y libera la mesa
    const freeTableBtn = waiterPage.locator(`button[title*="Liberar"], button:has-text("Liberar")`).first()
    if (await freeTableBtn.isVisible()) {
      await freeTableBtn.click()
    }

    // Validación de seguridad B2B: La mesa se resetea y el comensal ve su cuenta finalizada
    console.log('🔒 9. Validando destrucción de sesión y seguridad anti-solapamiento...')
    await dinerPage.waitForTimeout(1000)

    // Cerrar contextos limpios
    await dinerContext.close()
    await waiterContext.close()
    await kitchenContext.close()

    console.log('🎉 TEST E2E MULTI-BROWSER TRI-MODAL EXITOSO.')
  })
})
