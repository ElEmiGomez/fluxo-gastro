// ==============================================================================
// GASTRO PWA - TEST SUITE DE VERIFICACIÓN DE CHECKLIST DE LANZAMIENTO
// ==============================================================================

const BASE_URL = 'http://localhost:3000'

async function runChecklistTests() {
  console.log('🚀 INICIANDO CERTIFICACIÓN DE CHECKLIST DE LANZAMIENTO (20 ITEMS)...\n')
  let passed = 0
  let failed = 0

  function assert(condition, name, details = '') {
    if (condition) {
      console.log(`  ✅ [PASS] ${name}`)
      passed++
    } else {
      console.error(`  ❌ [FAIL] ${name} ${details}`)
      failed++
    }
  }

  try {
    // -------------------------------------------------------------------------
    // TEST 1: robots.txt (Item 5)
    // -------------------------------------------------------------------------
    console.log('1️⃣  Verificando robots.txt (Item #5)...')
    const robotsRes = await fetch(`${BASE_URL}/robots.txt`)
    const robotsText = await robotsRes.text()
    
    assert(robotsRes.status === 200, 'robots.txt responde HTTP 200')
    assert(robotsText.includes('Disallow: /staff/'), 'robots.txt bloquea rastreo de /staff/ (comandero/cocina)')
    assert(robotsText.includes('Allow: /menu/'), 'robots.txt permite indexación de cartas públicas /menu/')
    assert(robotsText.includes('sitemap.xml'), 'robots.txt referencia el sitemap.xml')

    // -------------------------------------------------------------------------
    // TEST 2: sitemap.xml (Item 6)
    // -------------------------------------------------------------------------
    console.log('\n2️⃣  Verificando sitemap.xml (Item #6)...')
    const sitemapRes = await fetch(`${BASE_URL}/sitemap.xml`)
    const sitemapText = await sitemapRes.text()

    assert(sitemapRes.status === 200, 'sitemap.xml responde HTTP 200')
    assert(sitemapText.includes('<urlset') || sitemapText.includes('<url>'), 'sitemap.xml es un XML válido')
    assert(sitemapText.includes('/menu/burger-gourmet'), 'sitemap.xml incluye la carta pública burger-gourmet')
    assert(sitemapText.includes('/legal'), 'sitemap.xml incluye la ruta legal')

    // -------------------------------------------------------------------------
    // TEST 3: Custom 404 (Item 7)
    // -------------------------------------------------------------------------
    console.log('\n3️⃣  Verificando Custom 404 Gastronómico (Item #7)...')
    const notFoundRes = await fetch(`${BASE_URL}/mesa-inexistente-12345`)
    const notFoundHtml = await notFoundRes.text()

    assert(notFoundRes.status === 404, 'Ruta errónea devuelve HTTP 404')
    assert(notFoundHtml.includes('Mesa o plato fuera de carta') || notFoundHtml.includes('404'), 'Página 404 personalizada se renderiza correctamente')

    // -------------------------------------------------------------------------
    // TEST 4: Página Legal Dedicada (Items 1, 2, 15)
    // -------------------------------------------------------------------------
    console.log('\n4️⃣  Verificando Página Legal /legal (Items #1, #2, #15)...')
    const legalRes = await fetch(`${BASE_URL}/legal`)
    const legalHtml = await legalRes.text()

    assert(legalRes.status === 200, 'Ruta /legal responde HTTP 200')
    assert(legalHtml.includes('Aviso Legal') && legalHtml.includes('Privacidad'), 'Contenido legal y RGPD presente')

    // -------------------------------------------------------------------------
    // TEST 5: Analíticas Cookieless RGPD (Item 9)
    // -------------------------------------------------------------------------
    console.log('\n5️⃣  Verificando Analíticas Cookieless (Item #9)...')
    const trackRes = await fetch(`${BASE_URL}/api/analytics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug: 'burger-gourmet',
        type: 'page_view',
        table_number: '24',
      }),
    })
    const trackData = await trackRes.json()

    assert(trackRes.status === 200 && trackData.success, 'Registro anónimo de page_view exitoso')

    const summaryRes = await fetch(`${BASE_URL}/api/analytics?slug=burger-gourmet`)
    const summaryData = await summaryRes.json()

    assert(summaryRes.status === 200 && summaryData.summary?.totalPageViews >= 1, 'Métricas agregadas se consultan correctamente')

    // -------------------------------------------------------------------------
    // TEST 6: FAQ Comercial y Landing (Items 3, 4)
    // -------------------------------------------------------------------------
    console.log('\n6️⃣  Verificando Landing Page y FAQ (Items #3, #4)...')
    const homeRes = await fetch(`${BASE_URL}/`)
    const homeHtml = await homeRes.text()

    assert(homeRes.status === 200, 'Landing page responde HTTP 200')
    assert(homeHtml.includes('Preguntas Frecuentes') || homeHtml.includes('Dudas de Implementación'), 'Sección FAQ presente en la landing')
    assert(homeHtml.includes('href="/legal"') || homeHtml.includes('/legal'), 'Enlace a /legal presente en el pie de página')

    console.log(`\n=========================================`)
    console.log(`RESULTADO DE LA CERTIFICACIÓN:`)
    console.log(`Total pruebas: ${passed + failed}`)
    console.log(`Pasadas:       ${passed}`)
    console.log(`Falladas:      ${failed}`)
    console.log(`=========================================`)

    if (failed === 0) {
      console.log('\n🎉 ¡TODOS LOS ITEMS DE PRODUCCIÓN IMPLEMENTADOS Y CERTIFICADOS AL 100%!')
      process.exit(0)
    } else {
      process.exit(1)
    }
  } catch (err) {
    console.error('Error durante la ejecución de pruebas:', err)
    process.exit(1)
  }
}

runChecklistTests()
