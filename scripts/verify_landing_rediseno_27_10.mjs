/**
 * Verificación del rediseño de la Landing Page (27-10-2026 · v2.0)
 * Ejecuta el checklist completo del spec sobre http://localhost:3000
 * Uso: node scripts/verify_landing_rediseno_27_10.mjs
 */
import { chromium } from '@playwright/test'

const BASE = process.env.BASE_URL || 'http://localhost:3000'
const results = []
const check = (name, ok, detail = '') => {
  results.push({ name, ok, detail })
  console.log(`${ok ? '✅' : '❌'} ${name}${detail ? ' — ' + detail : ''}`)
}

const run = async () => {
  const browser = await chromium.launch()

  // ── DESKTOP (1280x800) ──
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
  await page.goto(BASE, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(1500)

  // Aceptar el banner de cookies para liberar los clics del footer
  const cookieBtn = page.locator('aside[aria-label*="Consentimiento"] button', { hasText: 'Aceptar' })
  if ((await cookieBtn.count()) > 0) {
    await cookieBtn.first().click()
    await page.waitForTimeout(500)
  }

  // 1. Cero WhatsApp / wa.me en la página
  const bodyText = await page.evaluate(() => document.body.innerText)
  const waLinks = await page.locator('a[href*="wa.me"]').count()
  check('Sin enlaces wa.me en la página', waLinks === 0, `${waLinks} enlaces encontrados`)
  check('Sin menciones a WhatsApp en el texto', !bodyText.includes('WhatsApp'))

  // 2. FAQ 100% cerradas al inicio
  const faqButtons = page.locator('#faq button[aria-controls^="faq-answer"]')
  const faqCount = await faqButtons.count()
  let allClosed = true
  for (let i = 0; i < faqCount; i++) {
    const expanded = await faqButtons.nth(i).getAttribute('aria-expanded')
    if (expanded !== 'false') allClosed = false
  }
  check(`FAQ cerradas al inicio (${faqCount} preguntas)`, faqCount === 5 && allClosed)

  // FAQ clic abre y cierra
  await faqButtons.nth(0).click()
  const openedAfterClick = (await faqButtons.nth(0).getAttribute('aria-expanded')) === 'false'
  check('FAQ se abre al hacer clic', openedAfterClick === false)

  // 3. Botón FAQ "Consultar por Correo" abre el modal unificado en modo consulta
  const faqContactBtn = page.locator('#faq button', { hasText: 'Consultar por Correo' })
  check('Botón «Consultar por Correo ✉️» existe en FAQ', (await faqContactBtn.count()) === 1)
  await faqContactBtn.click()
  await page.waitForTimeout(600)
  const modalTitleQuestion = await page.locator('h3', { hasText: 'Envíanos tu consulta por correo' }).count()
  check('Modal unificado abre en modo consulta', modalTitleQuestion > 0)
  await page.locator('h3, div').first().press('Escape').catch(() => {})
  const closeBtns = page.locator('button:has(svg.lucide-x)')
  if ((await closeBtns.count()) > 0) await closeBtns.first().click()
  await page.waitForTimeout(400)

  // 4. Footer "Contacto Comercial" abre el mismo modal (modo consulta)
  const footerContact = page.locator('footer button', { hasText: 'Contacto Comercial' })
  check('Footer «Contacto Comercial» es botón (no wa.me)', (await footerContact.count()) === 1)
  await footerContact.click()
  await page.waitForTimeout(600)
  check('Footer abre el mismo modal de consulta', (await page.locator('h3', { hasText: 'Envíanos tu consulta por correo' }).count()) > 0)
  const modalNotes = await page.locator('label', { hasText: 'Tu consulta o comentario (opcional)' }).count()
  check('Modal contiene campo «Tu consulta o comentario (opcional)»', modalNotes > 0)
  await page.locator('button:has(svg.lucide-x)').first().click()
  await page.waitForTimeout(400)

  // 5. Saltito en los 3 Pilares y 3 Planes
  const pillarCards = page.locator('#funcionalidades .group')
  const planCards = page.locator('#precios .group')
  const checkTranslate = async (loc, label) => {
    const n = await loc.count()
    let withHop = 0
    for (let i = 0; i < n; i++) {
      const cls = (await loc.nth(i).getAttribute('class')) || ''
      const hasShadow = cls.includes('hover:shadow-xl') || cls.includes('hover:shadow-2xl')
      if (cls.includes('hover:-translate-y-1.5') && cls.includes('transition-all') && hasShadow) withHop++
    }
    check(`Efecto saltito en ${label} (${withHop}/${n})`, withHop === n)
  }
  await checkTranslate(pillarCards, '3 Pilares')
  await checkTranslate(planCards, '3 Planes')

  // 6. SIMULADOR: circuito completo de 4 toques + cierre esmeralda
  const pedirBtns = page.locator('button', { hasText: '+ Pedir' })
  const totalPedir = await pedirBtns.count()
  check('Simulador muestra los 4 platos', totalPedir === 4, `${totalPedir} platos`)
  await pedirBtns.nth(0).click() // Smash Burger (cocina)
  await pedirBtns.nth(2).click() // Cerveza IPA (barra)
  await page.locator('button', { hasText: 'Enviar pedido' }).first().click()
  await page.waitForTimeout(500)

  // Paso 2: el mozo NO se salta; badge ámbar + botón de validación
  const validarBtn = page.locator('button', { hasText: '✓ Aprobar y Enviar a Cocina' })
  check('Paso 2: Comandero pide validación del mozo', (await validarBtn.count()) === 1)
  check('Paso 2: badge ámbar «Validar Comanda Nueva»', (await page.locator('div', { hasText: 'Validar Comanda Nueva' }).count()) > 0)
  check('Paso 2: estaciones visibles (Bebidas/1° Entradas/2° Principales)', (await page.locator('li', { hasText: '1° Entradas' }).count()) > 0 && (await page.locator('li', { hasText: '2° Principales' }).count()) > 0)
  await validarBtn.click()
  await page.waitForTimeout(500)

  // Paso 3: KDS con pase activo y botón LISTO PARA SERVIR
  const listoBtn = page.locator('button', { hasText: '¡LISTO PARA SERVIR!' })
  check('Paso 3: KDS muestra «🔥 ¡LISTO PARA SERVIR!»', (await listoBtn.count()) === 1)
  check('Paso 3: KDS cabecera con cronómetro «En Tiempo»', (await page.locator('span', { hasText: 'En Tiempo' }).count()) > 0)
  check('Paso 3: KDS pases colapsados visibles', (await page.locator('span', { hasText: 'Pases cerrados' }).count()) > 0)
  await listoBtn.click()
  await page.waitForTimeout(500)

  // Paso 4: mozo sirve y cobra
  const cobrarBtn = page.locator('button', { hasText: 'Entregar y Cobrar Mesa' })
  check('Paso 4: Comandero muestra «Entregar y Cobrar Mesa»', (await cobrarBtn.count()) === 1)
  check('Paso 4: «✓ Listo en Cocina» visible', (await page.locator('text=Listo en Cocina').count()) > 0)
  await cobrarBtn.click()
  await page.waitForTimeout(900)

  // Paso 5: tarjeta esmeralda animada en el móvil del comensal
  const gracias = await page.locator('p', { hasText: '¡Gracias por tu visita!' }).count()
  check('Paso 5: tarjeta esmeralda «¡Gracias por tu visita!»', gracias > 0)
  check('Paso 5: insignia «+1 Sello sumado a tu Cartilla»', (await page.locator('text=+1 Sello sumado a tu Cartilla').count()) > 0)
  check('Paso 5: llamada a reseña en Google Maps', (await page.locator('text=Valorar en Google Maps').count()) > 0)
  const emeraldCard = await page.locator('div.bg-gradient-to-br.from-emerald-500').count()
  check('Paso 5: overlay con gradiente esmeralda', emeraldCard > 0)

  // Indicadores de sala (sin pantallas vacías)
  check('Comandero: indicador de mesas activas', (await page.locator('text=3 mesas activas').count()) > 0)
  check('Comandero: chips de mesas (Mesa 1/2/4/7)', (await page.locator('text=Mesa 7').count()) > 0)
  check('KDS: estaciones Cocina/Barra', (await page.locator('text=Cocina').count()) > 0 && (await page.locator('text=Barra').count()) > 0)

  // Botón de reinicio desde la tarjeta esmeralda
  const retryBtn = page.locator('button', { hasText: 'Probar otro pedido en el simulador' })
  check('Paso 5: botón «↻ Probar otro pedido»', (await retryBtn.count()) === 1)

  // ── MÓVIL (375x812): sticky stack de los 5 engranajes ──
  const mobile = await browser.newPage({ viewport: { width: 375, height: 812 } })
  await mobile.goto(BASE, { waitUntil: 'domcontentloaded' })
  await mobile.waitForTimeout(1500)
  const mobileCookie = mobile.locator('aside[aria-label*="Consentimiento"] button', { hasText: 'Aceptar' })
  if ((await mobileCookie.count()) > 0) {
    await mobileCookie.first().click()
    await mobile.waitForTimeout(500)
  }
  const gears = mobile.locator('#modulos ol > li:has(h3)')
  const gearCount = await gears.count()
  let stickyOk = 0
  for (let i = 0; i < gearCount; i++) {
    const pos = await gears.nth(i).evaluate((el) => getComputedStyle(el).position)
    if (pos === 'sticky') stickyOk++
  }
  check(`Sticky Stack móvil en los 5 engranajes (${stickyOk}/${gearCount})`, stickyOk === 5 && gearCount === 5)
  // Switch de transformación visible en móvil
  check('Switch de Antes/Después visible en móvil', (await mobile.locator('button', { hasText: 'Sala Tradicional' }).count()) > 0)
  await mobile.close()

  // ── Conmutador interactivo en desktop: clic en tarjeta roja la transforma ──
  await page.locator('button', { hasText: 'Sala Tradicional' }).first().click()
  await page.waitForTimeout(400)
  const chaosBefore = page.locator('div.bg-rose-50\\/70')
  const chaosCount = (await chaosBefore.count()) > 0
  check('Modo «El Caos» muestra las tarjetas rojas', chaosCount)
  if (chaosCount) {
    await chaosBefore.first().click()
    await page.waitForTimeout(500)
    const transformed = await page.locator('span', { hasText: 'Transformado' }).count()
    check('Clic en tarjeta del Caos la transforma (insignia de impacto)', transformed > 0)
  }
  await page.locator('button', { hasText: 'Sala con Fluxo' }).first().click()
  await page.waitForTimeout(400)
  check('Modo «Con Fluxo» muestra insignias de impacto', (await page.locator('span', { hasText: '0 € en hardware' }).count()) > 0)

  await page.close()
  await browser.close()

  const failed = results.filter((r) => !r.ok)
  console.log(`\n── RESULTADO: ${results.length - failed.length}/${results.length} comprobaciones OK ──`)
  if (failed.length > 0) process.exit(1)
}

run().catch((e) => {
  console.error('❌ ERROR FATAL:', e.message)
  process.exit(1)
})
