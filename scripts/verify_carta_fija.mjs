import { chromium } from '@playwright/test'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

async function auditCartaFija() {
  const browser = await chromium.launch({ headless: true })
  const outDir = 'C:/Users/mima7/.gemini/antigravity/brain/51b9e82c-8266-4700-b6e1-f3bc7670e8d7/carta_fija_audit'
  fs.mkdirSync(outDir, { recursive: true })

  const htmlPath = path.resolve(process.cwd(), 'carta_fija_digital.html')
  const fileUrl = 'file:///' + htmlPath.replace(/\\/g, '/')

  // ── MÓVIL (iPhone 12 Pro, 390×844) ───────────────────────────────────────
  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const mPage = await mobile.newPage()
  await mPage.goto(fileUrl, { waitUntil: 'networkidle' })
  await mPage.waitForTimeout(900)

  await mPage.screenshot({ path: outDir + '/mobile_home.png', fullPage: false })
  console.log('[OK] mobile_home.png')

  // Verificar que NO hay botones transaccionales
  const cartBtnCount = await mPage.locator('button:has-text("Añadir")').count()
  const pedirBtnCount = await mPage.locator('button:has-text("Pedir")').count()
  const mozeroBtnCount = await mPage.locator('button:has-text("mozo"), button:has-text("camarero")').count()
  console.log('[CHECK] Botones "Añadir":', cartBtnCount, '| Botones "Pedir":', pedirBtnCount, '| Botones mozo/camarero:', mozeroBtnCount)

  // Abrir modal de un plato
  const firstCard = mPage.locator('[data-dish-id]').first()
  const hasCards = await firstCard.count() > 0
  if (hasCards) {
    await firstCard.click()
    await mPage.waitForTimeout(500)
    await mPage.screenshot({ path: outDir + '/mobile_modal_open.png', fullPage: false })
    console.log('[OK] mobile_modal_open.png')

    // Cerrar modal con X
    await mPage.locator('[data-testid="modal-close"]').click()
    await mPage.waitForTimeout(400)
    const modalHidden = await mPage.locator('[data-testid="dish-modal"]').isHidden()
    console.log('[CHECK] Modal cerrado tras click X:', modalHidden)
  } else {
    console.log('[WARN] No se encontraron tarjetas de plato con data-dish-id')
  }

  // Buscador: filtrar por texto
  await mPage.fill('#search-input', 'pulpo')
  await mPage.waitForTimeout(500)
  await mPage.screenshot({ path: outDir + '/mobile_search_pulpo.png', fullPage: false })
  console.log('[OK] mobile_search_pulpo.png')

  // Barra informativa inferior
  const bottomBarVisible = await mPage.locator('[data-testid="bottom-info-bar"]').isVisible()
  console.log('[CHECK] Barra informativa inferior visible:', bottomBarVisible)

  await mobile.close()

  // ── ESCRITORIO (1280×900) ────────────────────────────────────────────────
  const desktop = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  const dPage = await desktop.newPage()
  await dPage.goto(fileUrl, { waitUntil: 'networkidle' })
  await dPage.waitForTimeout(900)

  await dPage.screenshot({ path: outDir + '/desktop_home.png', fullPage: true })
  console.log('[OK] desktop_home.png')

  // Cambio idioma Español
  await dPage.click('button[data-lang="es"]')
  await dPage.waitForTimeout(350)
  await dPage.screenshot({ path: outDir + '/desktop_es.png', fullPage: false })
  console.log('[OK] desktop_es.png')

  // Cambio idioma English
  await dPage.click('button[data-lang="en"]')
  await dPage.waitForTimeout(350)
  await dPage.screenshot({ path: outDir + '/desktop_en.png', fullPage: false })
  console.log('[OK] desktop_en.png')

  // Filtro Sin Gluten
  await dPage.click('button[data-dietary="sin-gluten"]')
  await dPage.waitForTimeout(450)
  await dPage.screenshot({ path: outDir + '/desktop_filter_singluten.png', fullPage: false })
  console.log('[OK] desktop_filter_singluten.png')

  // Vista cuadricula
  await dPage.click('button[data-view="grid"]')
  await dPage.waitForTimeout(350)
  await dPage.screenshot({ path: outDir + '/desktop_grid_view.png', fullPage: false })
  console.log('[OK] desktop_grid_view.png')

  await desktop.close()
  await browser.close()
  console.log('\n[AUDIT COMPLETE] Capturas en:', outDir)
}

auditCartaFija().catch(e => { console.error(e); process.exit(1) })
