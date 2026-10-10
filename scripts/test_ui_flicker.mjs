import { chromium } from 'playwright'

async function run() {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext()

  await context.addInitScript(() => {
    sessionStorage.setItem('fluxo_staff_auth_comandero_burger-gourmet', JSON.stringify({ auth: true, timestamp: Date.now() }))
    sessionStorage.setItem('fluxo_staff_auth_admin_burger-gourmet', JSON.stringify({ auth: true, timestamp: Date.now() }))
  })

  // Set auth cookie
  const authRes = await fetch('http://localhost:3000/api/staff/verify-pin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role: 'admin', slug: 'burger-gourmet', pin: '1234' }),
  })
  const setCookie = authRes.headers.get('set-cookie')
  if (setCookie) {
    const [cookiePart] = setCookie.split(';')
    const [name, val] = cookiePart.split('=')
    await context.addCookies([{ name, value: val, domain: 'localhost', path: '/' }])
  }

  const pComandero = await context.newPage()
  const pAdmin = await context.newPage()

  console.log('=== TEST 1: COMANDERO TOGGLE AGOTADO & DISPONIBLE ===')
  await pComandero.goto('http://localhost:3000/staff/comandero/burger-gourmet')
  await pComandero.waitForTimeout(1500)
  const mesaBtn = pComandero.locator('text=Mesa 1').first()
  if (await mesaBtn.count() > 0) {
    await mesaBtn.click()
    await pComandero.waitForTimeout(1000)
  }

  const toggleBtn = pComandero.locator('button[aria-label*="agotado"], button[title*="Agotado"]').first()
  
  // Paso 1: Cambiar a Agotado
  console.log('Action: Toggling to AGOTADO...')
  await toggleBtn.click()
  let flickerCount = 0
  let lastState = null
  for (let i = 0; i < 15; i++) {
    await pComandero.waitForTimeout(200)
    const label = await toggleBtn.getAttribute('aria-label')
    const isAgotado = label?.includes('reactivar') // "Plato ... agotado. Clic para reactivar en carta"
    if (lastState !== null && lastState !== isAgotado) {
      flickerCount++
      console.log(`[FLICKER DETECTED at ${(i+1)*200}ms]: changed from ${lastState} to ${isAgotado}`)
    }
    lastState = isAgotado
  }
  console.log(`Phase 1 Result (Agotado): finalIsAgotado=${lastState}, flickers=${flickerCount}`)
  if (flickerCount > 0 || !lastState) throw new Error('Failed: flicker or wrong state in Agotado phase')

  // Paso 2: Cambiar a Disponible
  console.log('\nAction: Toggling back to DISPONIBLE...')
  await toggleBtn.click()
  flickerCount = 0
  lastState = null
  for (let i = 0; i < 15; i++) {
    await pComandero.waitForTimeout(200)
    const label = await toggleBtn.getAttribute('aria-label')
    const isDisponible = label?.includes('Marcar') // "Marcar ... como agotado"
    if (lastState !== null && lastState !== isDisponible) {
      flickerCount++
      console.log(`[FLICKER DETECTED at ${(i+1)*200}ms]: changed from ${lastState} to ${isDisponible}`)
    }
    lastState = isDisponible
  }
  console.log(`Phase 2 Result (Disponible): finalIsDisponible=${lastState}, flickers=${flickerCount}`)
  if (flickerCount > 0 || !lastState) throw new Error('Failed: flicker or wrong state in Disponible phase')

  console.log('\n=== TEST 2: ADMIN TOGGLE AGOTADO & DISPONIBLE ===')
  await pAdmin.goto('http://localhost:3000/staff/admin/burger-gourmet')
  await pAdmin.waitForTimeout(1500)

  const adminPowerBtn = pAdmin.locator('button[title*="agotado"], button[title*="disponible"]').first()
  
  // Paso 1: Admin marcar como agotado
  console.log('Action: Admin toggling to AGOTADO...')
  await adminPowerBtn.click()
  flickerCount = 0
  lastState = null
  for (let i = 0; i < 15; i++) {
    await pAdmin.waitForTimeout(200)
    const title = await adminPowerBtn.getAttribute('title')
    const isAgotado = title?.includes('disponible') // title="Marcar como disponible"
    if (lastState !== null && lastState !== isAgotado) {
      flickerCount++
      console.log(`[ADMIN FLICKER at ${(i+1)*200}ms]: changed from ${lastState} to ${isAgotado}`)
    }
    lastState = isAgotado
  }
  console.log(`Admin Phase 1 Result: finalIsAgotado=${lastState}, flickers=${flickerCount}`)
  if (flickerCount > 0 || !lastState) throw new Error('Failed: Admin flicker or wrong state in Agotado phase')

  // Paso 2: Admin marcar como disponible
  console.log('\nAction: Admin toggling back to DISPONIBLE...')
  await adminPowerBtn.click()
  flickerCount = 0
  lastState = null
  for (let i = 0; i < 15; i++) {
    await pAdmin.waitForTimeout(200)
    const title = await adminPowerBtn.getAttribute('title')
    const isDisponible = title?.includes('agotado') // title="Marcar como agotado"
    if (lastState !== null && lastState !== isDisponible) {
      flickerCount++
      console.log(`[ADMIN FLICKER at ${(i+1)*200}ms]: changed from ${lastState} to ${isDisponible}`)
    }
    lastState = isDisponible
  }
  console.log(`Admin Phase 2 Result: finalIsDisponible=${lastState}, flickers=${flickerCount}`)
  if (flickerCount > 0 || !lastState) throw new Error('Failed: Admin flicker or wrong state in Disponible phase')

  console.log('\n=== ALL FLICKER AND STABILITY TESTS PASSED WITH 0 FLICKERS! ===')
  await browser.close()
}

run().catch(err => {
  console.error('TEST ERROR:', err)
  process.exit(1)
})
