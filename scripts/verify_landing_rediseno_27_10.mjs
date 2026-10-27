/**
 * Verificación Landing v2.2 (27-10-2026): simulador original + cierre esmeralda,
 * Antes/Después en bloques únicos con transform hover/toque + sticky stack móvil,
 * Plan Full con botón Glow, FAQ cerradas y cero WhatsApp.
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
  const banner = page.locator('aside[aria-label*="Consentimiento"]')
  try {
    await banner.waitFor({ state: 'visible', timeout: 5000 })
    await banner.locator('button', { hasText: 'Aceptar' }).first().click({ timeout: 3000 }).catch(() => {})
    await page.waitForTimeout(400)
  } catch {
    // sin banner en 5s: seguir
  }
  // El banner puede seguir interceptando clics en el footer: se retira en el entorno de prueba
  await page.evaluate(() => {
    document.querySelectorAll('aside[aria-label*="Consentimiento"]').forEach((el) => el.remove())
  })
  await page.waitForTimeout(200)
}

// Espera a que React hidrate el bloque (los nodos hidratados llevan la clave __reactFiber$)
const waitForHydration = (page) =>
  page.waitForFunction(() => {
    const el = document.querySelector('#antes-despues > div')
    return !!el && Object.keys(el).some((k) => k.startsWith('__reactFiber$'))
  }, { timeout: 30000 })

const run = async () => {
  const browser = await chromium.launch()

  // ── DESKTOP (1280x800) ──
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
  const consoleErrors = []
  page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text().slice(0, 300)) })
  page.on('pageerror', (err) => consoleErrors.push('PAGEERROR: ' + String(err).slice(0, 300)))
  await page.goto(BASE, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(1500)
  await acceptCookies(page)

  // 1. Cero WhatsApp / wa.me
  const bodyText = await page.evaluate(() => document.body.innerText)
  check('Sin enlaces wa.me en la página', (await page.locator('a[href*="wa.me"]').count()) === 0)
  check('Sin menciones a WhatsApp en el texto', !bodyText.includes('WhatsApp'))

  // 2. FAQ cerradas + botón sin emoji
  const faqButtons = page.locator('#faq button[aria-controls^="faq-answer"]')
  const faqCount = await faqButtons.count()
  let allClosed = true
  for (let i = 0; i < faqCount; i++) {
    if ((await faqButtons.nth(i).getAttribute('aria-expanded')) !== 'false') allClosed = false
  }
  check(`FAQ cerradas al inicio (${faqCount} preguntas)`, faqCount === 5 && allClosed)
  const faqContactBtn = page.locator('#faq button', { hasText: 'Consultar por Correo' })
  check('Botón «Consultar por Correo» sin emoji ✉️', !(await faqContactBtn.first().innerText()).includes('✉️'))
  await faqContactBtn.click()
  await page.waitForTimeout(500)
  check('Modal unificado abre en modo consulta', (await page.locator('h3', { hasText: 'Envíanos tu consulta por correo' }).count()) > 0)
  check('Modal contiene campo «Tu consulta o comentario (opcional)»', (await page.locator('label', { hasText: 'Tu consulta o comentario (opcional)' }).count()) > 0)
  await page.locator('button:has(svg.lucide-x)').first().click()
  await page.waitForTimeout(400)
  const footerContact = page.locator('footer button', { hasText: 'Contacto Comercial' })
  await footerContact.click()
  await page.waitForTimeout(500)
  check('Footer abre el mismo modal de consulta', (await page.locator('h3', { hasText: 'Envíanos tu consulta por correo' }).count()) > 0)
  await page.locator('button:has(svg.lucide-x)').first().click()
  await page.waitForTimeout(400)

  // 3. Saltito en 3 Pilares y 3 Planes
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
  await checkTranslate(page.locator('#precios div.rounded-3xl.group'), '3 Planes')

  // 4. SIMULADOR original + cierre esmeralda
  const pedirBtns = page.locator('button', { hasText: '+ Pedir' })
  check('Simulador muestra los 4 platos', (await pedirBtns.count()) === 4)
  check('Cabecera «Menú Fluxo» en la carta', (await page.locator('span', { hasText: 'Menú Fluxo' }).count()) > 0)
  check('Cabecera «Mozo» (antes «Comandero · Roberto»)', (await page.locator('span', { hasText: /^Mozo$/ }).count()) >= 1 && (await page.locator('text="Comandero · Roberto"').count()) === 0)
  check('Cabecera «Cocina» (antes «Monitor Cocina»)', (await page.locator('span', { hasText: 'Cocina' }).count()) > 0 && (await page.getByText('Monitor Cocina').count()) === 0)
  check('Cabecera antigua «Fluxo Bistro» eliminada', (await page.getByText('Fluxo Bistro').count()) === 0)
  await pedirBtns.nth(0).click()
  await pedirBtns.nth(2).click()
  await page.locator('button', { hasText: 'Enviar pedido' }).first().click()
  await page.waitForTimeout(400)
  check('Paso 2: botón «Validar y enviar a cocina»', (await page.locator('button', { hasText: 'Validar y enviar a cocina' }).count()) === 1)
  await page.locator('button', { hasText: 'Validar y enviar a cocina' }).click()
  await page.waitForTimeout(400)
  check('Paso 3: botón «¡LISTO!»', (await page.locator('button', { hasText: '¡LISTO!' }).count()) === 1)
  await page.locator('button', { hasText: '¡LISTO!' }).click()
  await page.waitForTimeout(400)
  check('Paso 4: botón «Marcar como servido»', (await page.locator('button', { hasText: 'Marcar como servido' }).count()) === 1)
  await page.locator('button', { hasText: 'Marcar como servido' }).click()
  await page.waitForTimeout(900)
  check('Paso 5: tarjeta esmeralda «¡Gracias por tu visita!»', (await page.locator('p', { hasText: '¡Gracias por tu visita!' }).count()) > 0)
  check('Paso 5: insignia «+1 Sello sumado a tu Cartilla»', (await page.locator('text=+1 Sello sumado a tu Cartilla').count()) > 0)
  check('Paso 5: llamada a reseña en Google Maps', (await page.locator('text=Valorar en Google Maps').count()) > 0)
  await page.locator('button', { hasText: 'Probar otro pedido en el simulador' }).click()
  await page.waitForTimeout(300)

  // 5. ANTES/DESPUÉS: interruptor global «El Caos ⟷ Con Fluxo»
  const bloques = page.locator('#antes-despues > div')
  const isRose = (loc) => loc.evaluate((el) => el.className.includes('bg-rose-50'))
  const isBlue = (loc) => loc.evaluate((el) => el.className.includes('bg-blue-50'))
  const allStates = async (loc, fn) => {
    const vals = []
    for (let i = 0; i < 5; i++) vals.push(await fn(loc.nth(i)))
    return vals
  }
  check('Selector «Frente a Frente» ELIMINADO (bloques únicos)', (await page.locator('button', { hasText: 'Frente a Frente' }).count()) === 0)
  check('Conmutador antiguo «Comparativa Interactiva» ELIMINADO', (await page.locator('button', { hasText: 'Comparativa Interactiva' }).count()) === 0)
  check('5 bloques únicos presentes', (await bloques.count()) === 5)
  const roseInit = (await allStates(bloques, isRose)).filter(Boolean).length
  check('5 bloques del Caos visibles y 0 de Fluxo al inicio', roseInit === 5)
  await bloques.first().scrollIntoViewIfNeeded()
  await page.waitForTimeout(1300) // asentar ScrollReveal
  await waitForHydration(page)
  await page.locator('button', { hasText: 'Con Fluxo' }).click()
  await page.waitForTimeout(700)
  const bluesTrasSwitch = (await allStates(bloques, isBlue)).filter(Boolean).length
  check('Interruptor: los 5 bloques pasan a «Con Fluxo» a la vez', bluesTrasSwitch === 5)
  check('Interruptor: contenido Fluxo visible', (await page.locator('#antes-despues', { hasText: 'Tiempos sincronizados y pases' }).count()) > 0)
  await page.locator('button', { hasText: 'El Caos' }).click()
  await page.waitForTimeout(700)
  const rosesBack = (await allStates(bloques, isRose)).filter(Boolean).length
  check('Interruptor: los 5 bloques vuelven a «El Caos»', rosesBack === 5)

  // 6. PLAN FULL: botón con efecto Glow (misma luz que «Probar demo en vivo»)
  const fullBtn = page.locator('#precios button', { hasText: 'Probar 14 Días a 0 €' })
  const glowCls = (await fullBtn.getAttribute('class')) || ''
  check('Botón Plan Full usa gradiente Glow (from-blue-600 via-sky-500)', glowCls.includes('from-blue-600') && glowCls.includes('via-sky-500') && glowCls.includes('bg-[length:200%_auto]'))
  check('Botón Plan Full tiene brillo hover (shadow sky)', glowCls.includes('hover:shadow-[0_0_35px_0_rgba(14,165,233,0.6)]'))
  await fullBtn.click()
  await page.waitForTimeout(600)
  check('Botón Plan Full abre el modal de piloto', (await page.locator('h3', { hasText: 'Solicita tu prueba piloto de 14 días a 0 €' }).count()) > 0)
  await page.locator('button:has(svg.lucide-x)').first().click()
  await page.waitForTimeout(300)

  await page.close()

  // ── MÓVIL REAL (375x812, táctil): sin esto, Chromium de escritorio emula hover
  // y el mouseenter (reveal) + click (toggle) se cancelan entre sí ──
  const mobile = await browser.newPage({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true })
  await mobile.goto(BASE, { waitUntil: 'domcontentloaded' })
  await mobile.waitForTimeout(1500)
  await acceptCookies(mobile)

  const stickyCheck = async (loc, label, expected) => {
    const n = await loc.count()
    let stickyOk = 0
    for (let i = 0; i < n; i++) {
      if ((await loc.nth(i).evaluate((el) => getComputedStyle(el).position)) === 'sticky') stickyOk++
    }
    check(`Sticky Stack móvil en ${label} (${stickyOk}/${n})`, stickyOk === expected && n === expected)
  }
  await stickyCheck(mobile.locator('#modulos ol > li:has(h3)'), '5 engranajes', 5)
  const mBloques = mobile.locator('#antes-despues > div')
  await mBloques.first().scrollIntoViewIfNeeded()
  await mobile.waitForTimeout(1300) // asentar ScrollReveal
  await waitForHydration(mobile)
  await mobile.locator('button', { hasText: 'Con Fluxo' }).tap()
  await mobile.waitForTimeout(700)
  const mBlues = (await allStates(mBloques, isBlue)).filter(Boolean).length
  check('Móvil: interruptor pasa los 5 bloques a «Con Fluxo»', mBlues === 5)
  await mobile.locator('button', { hasText: 'El Caos' }).tap()
  await mobile.waitForTimeout(700)
  const mRoses = (await allStates(mBloques, isRose)).filter(Boolean).length
  check('Móvil: interruptor vuelve a «El Caos»', mRoses === 5)
  await mobile.close()

  await browser.close()

  const failed = results.filter((r) => !r.ok)
  console.log(`\n── RESULTADO: ${results.length - failed.length}/${results.length} comprobaciones OK ──`)
  if (consoleErrors.length > 0) console.log('ERRORES DE CONSOLA:', JSON.stringify(consoleErrors))
  if (failed.length > 0) process.exit(1)
}

run().catch((e) => {
  console.error('❌ ERROR FATAL:', e.message)
  process.exit(1)
})
