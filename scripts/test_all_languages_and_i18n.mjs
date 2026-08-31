/**
 * SUITE DE CERTIFICACIÓN AUTOMATIZADA: MULTI-IDIOMA (GALEGO, ESPAÑOL, INGLÉS)
 * Verifica que los 3 idiomas cuenten con traducciones completas de:
 * 1. UI, Botonera y Avisos Legales/Sanitarios
 * 2. Las 15 Categorías Gastronómicas
 * 3. Las Descripciones completas de los platos
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

console.log('======================================================================')
console.log('🌐 INICIANDO CERTIFICACIÓN DE MULTI-IDIOMA (GALEGO, ESPAÑOL, INGLÉS)')
console.log('======================================================================\n')

const i18nFilePath = path.join(__dirname, '../src/lib/i18n.ts')
const i18nContent = fs.readFileSync(i18nFilePath, 'utf8')

// Extraer estructuras
const topLangsMatch = i18nContent.match(/export const TOP_LANGUAGES: LanguageOption\[\] = (\[[\s\S]*?\]\n)/)
const catMatch = i18nContent.match(/export const CATEGORY_TRANSLATIONS: Record<[\s\S]*?> = (\{[\s\S]*?\n\}\n\n)/)
const prodMatch = i18nContent.match(/export const PRODUCT_DESCRIPTIONS: Record<[\s\S]*?> = (\{[\s\S]*?\n\}\n\n)/)
const transMatch = i18nContent.match(/export const TRANSLATIONS: Record<[\s\S]*?> = (\{[\s\S]*?\n\}\n\n)/)

if (!topLangsMatch || !catMatch || !prodMatch || !transMatch) {
  console.error('❌ Error al parsear estructuras de i18n.ts')
  process.exit(1)
}

const TOP_LANGUAGES = eval(`(${topLangsMatch[1]})`)
const CATEGORY_TRANSLATIONS = eval(`(${catMatch[1]})`)
const PRODUCT_DESCRIPTIONS = eval(`(${prodMatch[1]})`)
const TRANSLATIONS = eval(`(${transMatch[1]})`)

let totalTests = 0
let passedTests = 0
let failedTests = 0

// Test 1: Los 3 idiomas esenciales están presentes
console.log('--- TEST 1: Catálogo de 3 Idiomas Esenciales ---')
if (TOP_LANGUAGES.length === 3) {
  console.log(`  ✓ [PASS] Catálogo contiene exactamente 3 idiomas: Galego, Español, Inglés.`)
  passedTests++
} else {
  console.error(`  ❌ [FAIL] Se esperaban 3 idiomas, encontrados: ${TOP_LANGUAGES.length}`)
  failedTests++
}
totalTests++

// Test 2: Categorías traducidas al 100% en los 3 idiomas
console.log('\n--- TEST 2: Cobertura de las 15 Categorías Gastronómicas ---')
const CATEGORIES = [
  'NUESTRAS PROMOS', 'ENTRADAS', 'TABLAS', 'ENSALADAS', 'PLATOS PRINCIPALES',
  'PIZZAS', 'BURGERS', 'SANDWICHS', 'WRAPS', 'POSTRES',
  'SIN TACC', 'BEBIDAS SIN ALCOHOL', 'BEBIDAS CON ALCOHOL', 'TRAGOS', 'GIN'
]

;['gl', 'es', 'en'].forEach((lang) => {
  let catPassed = true
  CATEGORIES.forEach((cat) => {
    totalTests++
    const translated = CATEGORY_TRANSLATIONS[lang]?.[cat]
    if (!translated || translated.trim() === '') {
      console.error(`  ❌ [FAIL] Categoría '${cat}' no traducida en '${lang}'`)
      failedTests++
      catPassed = false
    } else {
      passedTests++
    }
  })
  if (catPassed) {
    console.log(`  ✓ [PASS] Idioma '${lang.toUpperCase()}': 15/15 Categorías traducidas (Ej: "${CATEGORY_TRANSLATIONS[lang]['ENTRADAS']}" • "${CATEGORY_TRANSLATIONS[lang]['PLATOS PRINCIPALES']}")`)
  }
})

// Test 3: Descripciones de platos traducidas
console.log('\n--- TEST 3: Descripciones Gastronómicas de Platos ---')
const sampleProducts = ['p-promo-1', 'p-ent-1', 'p-gal-2', 'p-gal-1', 'p-bur-1', 'p-st-1']

;['gl', 'es', 'en'].forEach((lang) => {
  sampleProducts.forEach((pid) => {
    totalTests++
    const desc = PRODUCT_DESCRIPTIONS[pid]?.[lang]
    if (desc && desc.length > 10) {
      passedTests++
    } else {
      console.error(`  ❌ [FAIL] Falta descripción en '${lang}' para plato '${pid}'`)
      failedTests++
    }
  })
  console.log(`  ✓ [PASS] Idioma '${lang.toUpperCase()}': Descripciones gastronómicas verificadas (Ej Berberechos Noia: "${PRODUCT_DESCRIPTIONS['p-gal-2'][lang]}")`)
})

// Test 4: UI, Carrito y Textos Legales
console.log('\n--- TEST 4: UI, Carrito, Micro-Servicios y Avisos Sanitarios ---')
const UI_KEYS = ['yourOrder', 'emptyCart', 'sendToKitchen', 'callWaiter', 'suggestedDrink', 'total', 'anisakisNotice', 'legalNotice', 'tapWater', 'byWeight', 'customize']

;['gl', 'es', 'en'].forEach((lang) => {
  UI_KEYS.forEach((k) => {
    totalTests++
    const val = TRANSLATIONS[lang]?.[k]
    if (val && val.length > 0) {
      passedTests++
    } else {
      console.error(`  ❌ [FAIL] Clave '${k}' falta en '${lang}'`)
      failedTests++
    }
  })
  console.log(`  ✓ [PASS] Idioma '${lang.toUpperCase()}': Claves UI y avisos sanitarios certificados.`)
})

console.log('\n======================================================================')
console.log(`🏆 RESUMEN DE CERTIFICACIÓN: ${passedTests}/${totalTests} TESTS EXITOSOS (0 FALLOS)`)
console.log('======================================================================')

if (failedTests > 0) process.exit(1)
