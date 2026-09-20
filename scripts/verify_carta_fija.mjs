import { chromium } from '@playwright/test'
import path from 'path'
import fs from 'fs'

async function auditCartaFija() {
  const browser = await chromium.launch({ headless: true })
  const outDir = 'C:/Users/mima7/.gemini/antigravity/brain/51b9e82c-8266-4700-b6e1-f3bc7670e8d7/carta_fija_audit'
  fs.mkdirSync(outDir, { recursive: true })

  const htmlPath = path.resolve(process.cwd(), 'carta_fija_digital.html')
  const fileUrl = 'file:///' + htmlPath.replace(/\\/g, '/')

  // ── 1. MÓVIL (iPhone 12 Pro, 390×844) ───────────────────────────────────
  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const mPage = await mobile.newPage()
  await mPage.goto(fileUrl, { waitUntil: 'networkidle' })
  await mPage.waitForTimeout(600)

  await mPage.screenshot({ path: outDir + '/mobile_home.png', fullPage: false })
  console.log('[OK] mobile_home.png')

  // Verificar cero botones transaccionales
  const cartBtnCount = await mPage.locator('button:has-text("Añadir")').count()
  const pedirBtnCount = await mPage.locator('button:has-text("Pedir")').count()
  const mozoBtnCount = await mPage.locator('button:has-text("mozo"), button:has-text("camarero")').count()
  console.log('[CHECK] Botones "Añadir":', cartBtnCount, '| Botones "Pedir":', pedirBtnCount, '| Botones mozo:', mozoBtnCount)

  // Expandir primer plato
  const firstCard = mPage.locator('[data-dish-id]').first()
  if (await firstCard.count() > 0) {
    await firstCard.locator('div[onclick]').first().click()
    await mPage.waitForTimeout(400)
    await mPage.screenshot({ path: outDir + '/mobile_expanded.png', fullPage: false })
    console.log('[OK] mobile_expanded.png')
  }

  // Buscador: filtrar por burger
  await mPage.fill('#search-input', 'burger')
  await mPage.waitForTimeout(400)
  await mPage.screenshot({ path: outDir + '/mobile_search.png', fullPage: false })
  console.log('[OK] mobile_search.png')
  await mPage.fill('#search-input', '')
  await mPage.waitForTimeout(200)

  // Filtro Veggie
  await mPage.click('#filter-veggie-btn')
  await mPage.waitForTimeout(400)
  await mPage.screenshot({ path: outDir + '/mobile_veggie.png', fullPage: false })
  console.log('[OK] mobile_veggie.png')

  await mobile.close()

  // ── 2. ESCRITORIO (1280×900) ────────────────────────────────────────────
  const desktop = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  const dPage = await desktop.newPage()
  await dPage.goto(fileUrl, { waitUntil: 'networkidle' })
  await dPage.waitForTimeout(600)

  await dPage.screenshot({ path: outDir + '/desktop_home.png', fullPage: false })
  console.log('[OK] desktop_home.png')

  // Cambio a Español
  await dPage.click('#lang-dropdown-btn')
  await dPage.waitForTimeout(200)
  await dPage.click('#lang-menu button:has-text("Español")')
  await dPage.waitForTimeout(300)
  await dPage.screenshot({ path: outDir + '/desktop_es.png', fullPage: false })
  console.log('[OK] desktop_es.png')

  // Cambio a English
  await dPage.click('#lang-dropdown-btn')
  await dPage.waitForTimeout(200)
  await dPage.click('#lang-menu button:has-text("English")')
  await dPage.waitForTimeout(300)
  await dPage.screenshot({ path: outDir + '/desktop_en.png', fullPage: false })
  console.log('[OK] desktop_en.png')

  // Vista Grid
  await dPage.click('#btn-view-grid')
  await dPage.waitForTimeout(350)
  await dPage.screenshot({ path: outDir + '/desktop_grid.png', fullPage: false })
  console.log('[OK] desktop_grid.png')

  // Filtro Sin Gluten
  await dPage.click('#filter-sintacc-btn')
  await dPage.waitForTimeout(350)
  await dPage.screenshot({ path: outDir + '/desktop_singluten.png', fullPage: false })
  console.log('[OK] desktop_singluten.png')

  await desktop.close()
  await browser.close()
  console.log('\n[AUDIT COMPLETE] Todas las capturas generadas correctamente en:', outDir)
}

auditCartaFija().catch(e => { console.error(e); process.exit(1) })
