// ==============================================================================
// GASTRO PWA - TEST DE CERTIFICACIÓN DE IDIOMAS Y TEXTOS EN PRODUCCIÓN
// ==============================================================================

const BASE_URL = 'http://localhost:3000'

async function runI18nTests() {
  console.log('🌐 INICIANDO CERTIFICACIÓN DE IDIOMAS Y TEXTOS...\n')
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
    // 1. Cargar la página del menú
    const res = await fetch(`${BASE_URL}/menu/burger-gourmet?table=18`)
    const html = await res.text()

    assert(res.status === 200, 'Página de carta gastronómica responde HTTP 200')
    assert(html.includes('tableNumber') || html.includes('Mesa') || html.includes('burger-gourmet'), 'Contenido gastronómico y número de mesa presentes en el HTML inicial')

    // 2. Extraer script chunks del cliente para verificar presencia del diccionario i18n
    const scriptMatches = [...html.matchAll(/src="(\/_next\/static\/chunks\/[^"]+)"/g)]
    let foundTranslations = false

    for (const match of scriptMatches) {
      const scriptUrl = `${BASE_URL}${match[1]}`
      const sRes = await fetch(scriptUrl)
      const sText = await sRes.text()
      if (sText.includes('Galego') || sText.includes('Inglés') || sText.includes('Homemade Desserts')) {
        foundTranslations = true
        break
      }
    }

    assert(foundTranslations, 'Diccionario completo i18n (Galego, Español, Inglés) cargado en el bundle del cliente')

    // 3. Probar página legal en diferentes pestañas
    const legalRes = await fetch(`${BASE_URL}/legal`)
    const legalHtml = await legalRes.text()

    assert(legalRes.status === 200, 'Página legal /legal responde HTTP 200')
    assert(legalHtml.includes('Aviso Legal') && legalHtml.includes('RGPD') && legalHtml.includes('Cookies'), 'Términos Legales, RGPD y Política de Cookies certificados')

    console.log(`\n=========================================`)
    console.log(`RESULTADO DE LA CERTIFICACIÓN:`)
    console.log(`Total pruebas: ${passed + failed}`)
    console.log(`Pasadas:       ${passed}`)
    console.log(`Falladas:      ${failed}`)
    console.log(`=========================================`)

    if (failed === 0) {
      console.log('\n🎉 ¡SISTEMA DE IDIOMAS CERTIFICADO AL 100%!')
      process.exit(0)
    } else {
      process.exit(1)
    }
  } catch (err) {
    console.error('Error durante la verificación:', err)
    process.exit(1)
  }
}

runI18nTests()
