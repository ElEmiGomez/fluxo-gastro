/**
 * Verificación Landing v2.1 (27-10-2026): simulador original + cierre esmeralda,
 * Antes/Después original con transform al hover/toque, FAQ cerradas, cero WhatsApp.
 * Uso: node scripts/verify_landing_rediseno_27_10.mjs
 */
import { chromium } from '@playwright/test'

const BASE = process.env.BASE_URL || 'http://localhost:3000'
const results = []
const check = (name, ok, detail = '') => {
  results.push({ name, ok, detail })
  console.log(`${ok ? '✅' : '❌'} ${name}${detail ? ' — ' + detail : ''}`)
}

const acceptCookies = async (page) => {
  const cookieBtn = page.locator('aside[aria-label*="Consentimiento"] button', { hasText: 'Aceptar' })
  if ((await cookieBtn.count()) > 0) {
    await cookieBtn.first().click()
    await page.waitForTimeout(400)
  }
}

const run = async () => {
  const browser = await chromium.launch()

  // ── DESKTOP (1280x800) ──
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
  await page.goto(BASE, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(1500)
  await acceptCookies(page)

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
    if ((await faqButtons.nth(i).getAttribute('aria-expanded')) !== 'false') allClosed = false
  }
  check(`FAQ cerradas al inicio (${faqCount} preguntas)`, faqCount === 5 && allClosed)
  await faqButtons.nth(0).click()
  await page.waitForTimeout(300)
  check('FAQ se abre al hacer clic', (await faqButtons.nth(0).getAttribute('aria-expanded')) === 'true')
  await faqButtons.nth(0).click()

  // 3. Botón FAQ «Consultar por Correo» (sin emoji ✉️) abre el modal en modo consulta
  const faqContactBtn = page.locator('#faq button', { hasText: 'Consultar por Correo' })
  check('Botón «Consultar por Correo» existe en FAQ', (await faqContactBtn.count()) === 1)
  const btnText = (await faqContactBtn.first().innerText()).trim()
  check('Botón sin emoji ✉️', !btnText.includes('✉️'), btnText)
  await faqContactBtn.click()
  await page.waitForTimeout(600)
  check('Modal unificado abre en modo consulta', (await page.locator('h3', { hasText: 'Envíanos tu consulta por correo' }).count()) > 0)
  check('Modal contiene campo «Tu consulta o comentario (opcional)»', (await page.locator('label', { hasText: 'Tu consulta o comentario (opcional)' }).count()) > 0)
  await page.locator('button:has(svg.lucide-x)').first().click()
  await page.waitForTimeout(400)

  // 4. Footer «Contacto Comercial» abre el mismo modal
  const footerContact = page.locator('footer button', { hasText: 'Contacto Comercial' })
  check('Footer «Contacto Comercial» es botón (no wa.me)', (await footerContact.count()) === 1)
  await footerContact.click()
  await page.waitForTimeout(600)
  check('Footer abre el mismo modal de consulta', (await page.locator('h3', { hasText: 'Envíanos tu consulta por correo' }).count()) > 0)
  await page.locator('button:has(svg.lucide-x)').first().click()
  await page.waitForTimeout(400)

  // 5. Saltito en los 3 Pilares y 3 Planes
  const checkTranslate = async (loc, label) => {
    const n = await loc.count()
    let withHop = 0
    for (let i = 0; i < n; i++) {
      const cls = (await loc.nth(i).getAttribute('class')) || ''
      if (cls.includes('hover:-translate-y-1.5') && cls.includes('transition-all') && (cls.includes('hover:shadow-xl') || cls.includes('hover:shadow-2xl'))) withHop++
    }
    check(`Efecto saltito en ${label} (${withHop}/${n})`, withHop === n)
  }
  await checkTranslate(page.locator('#funcionalidades .group'), '3 Pilares')
  await checkTranslate(page.locator('#precios .group'), '3 Planes')

  // 6. SIMULADOR ORIGINAL: circuito con botones clásicos + cierre esmeralda
  const pedirBtns = page.locator('button', { hasText: '+ Pedir' })
  check('Simulador muestra los 4 platos', (await pedirBtns.count()) === 4)
  check('Barra de progreso con 5 pasos sin numerar', (await page.locator('span', { hasText: 'Comensal pide' }).count()) > 0 && (await page.locator('span', { hasText: '1. Comensal pide' }).count()) === 0)
  await pedirBtns.nth(0).click() // Smash Burger (cocina)
  await pedirBtns.nth(2).click() // Cerveza IPA (barra)
  await page.locator('button', { hasText: 'Enviar pedido' }).first().click()
  await page.waitForTimeout(500)

  const validarBtn = page.locator('button', { hasText: 'Validar y enviar a cocina' })
  check('Paso 2: botón original «Validar y enviar a cocina»', (await validarBtn.count()) === 1)
  await validarBtn.click()
  await page.waitForTimeout(500)

  const listoBtn = page.locator('button', { hasText: '¡LISTO!' })
  check('Paso 3: botón original «¡LISTO!»', (await listoBtn.count()) === 1)
  await listoBtn.click()
  await page.waitForTimeout(500)

  const servidoBtn = page.locator('button', { hasText: 'Marcar como servido' })
  check('Paso 4: botón original «Marcar como servido»', (await servidoBtn.count()) === 1)
  await servidoBtn.click()
  await page.waitForTimeout(900)

  // Paso 5: tarjeta esmeralda animada (se conserva)
  check('Paso 5: tarjeta esmeralda «¡Gracias por tu visita!»', (await page.locator('p', { hasText: '¡Gracias por tu visita!' }).count()) > 0)
  check('Paso 5: insignia «+1 Sello sumado a tu Cartilla»', (await page.locator('text=+1 Sello sumado a tu Cartilla').count()) > 0)
  check('Paso 5: llamada a reseña en Google Maps', (await page.locator('text=Valorar en Google Maps').count()) > 0)
  check('Paso 5: overlay con gradiente esmeralda', (await page.locator('div.bg-gradient-to-br.from-emerald-500').count()) > 0)
  check('Paso 5: botón «↻ Probar otro pedido»', (await page.locator('button', { hasText: 'Probar otro pedido en el simulador' }).count()) === 1)
  await page.locator('button', { hasText: 'Probar otro pedido en el simulador' }).click()
  await page.waitForTimeout(400)

  // 7. ANTES/DESPUÉS original + transform al hover (desktop)
  check('Selector móvil original visible (Frente a Frente / El Caos / Con Fluxo)', (await page.locator('button', { hasText: 'Frente a Frente' }).count()) === 1)
  check('Conmutador de 3 modos ELIMINADO', (await page.locator('button', { hasText: 'Comparativa Interactiva' }).count()) === 0)
  const beforeCard = page.locator('div.bg-rose-50\\/70').first()
  check('Tarjetas rojas del «Antes» presentes', (await page.locator('div.bg-rose-50\\/70').count()) === 5)
  const aspectText = await page.locator('#demo p', { hasText: 'Gritos a cocina' }).count() > 0 || (await page.locator('text=Gritos a cocina').count()) > 0
  check('Contenido del «Antes» visible antes del hover', aspectText)
  await beforeCard.hover()
  await page.waitForTimeout(500)
  check('Hover: tarjeta del Antes se transforma a Fluxo', (await page.locator('text=Tiempos sincronizados y pases').count()) > 0)
  await page.mouse.move(10, 10)
  await page.waitForTimeout(500)
  check('Mouse out: la tarjeta vuelve al estado «Antes»', (await page.locator('text=Gritos a cocina').count()) > 0)

  await page.close()

  // ── MÓVIL (375x812): sticky stack engranajes + toggle táctil en Antes/Después ──
  const mobile = await browser.newPage({ viewport: { width: 375, height: 812 } })
  await mobile.goto(BASE, { waitUntil: 'domcontentloaded' })
  await mobile.waitForTimeout(1500)
  await acceptCookies(mobile)

  const gears = mobile.locator('#modulos ol > li:has(h3)')
  const gearCount = await gears.count()
  let stickyOk = 0
  for (let i = 0; i < gearCount; i++) {
    if ((await gears.nth(i).evaluate((el) => getComputedStyle(el).position)) === 'sticky') stickyOk++
  }
  check(`Sticky Stack móvil en los 5 engranajes (${stickyOk}/${gearCount})`, stickyOk === 5 && gearCount === 5)

  // Toque en tarjeta del Antes → transforma y permanece (toggle)
  const mBeforeCard = mobile.locator('div.bg-rose-50\\/70').first()
  await mBeforeCard.scrollIntoViewIfNeeded()
  await mBeforeCard.click()
  await mobile.waitForTimeout(500)
  check('Móvil: toque transforma la tarjeta a Fluxo (permanece)', (await mobile.locator('text=Tiempos sincronizados y pases').count()) > 0)
  await mBeforeCard.click()
  await mobile.waitForTimeout(500)
  check('Móvil: segundo toque vuelve al estado «Antes»', (await mobile.locator('text=Gritos a cocina').count()) > 0)
  await mobile.close()

  await browser.close()

  const failed = results.filter((r) => !r.ok)
  console.log(`\n── RESULTADO: ${results.length - failed.length}/${results.length} comprobaciones OK ──`)
  if (failed.length > 0) process.exit(1)
}

run().catch((e) => {
  console.error('❌ ERROR FATAL:', e.message)
  process.exit(1)
})
