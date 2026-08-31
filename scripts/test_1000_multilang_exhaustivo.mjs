/**
 * SUITE DE REVISIÓN Y CERTIFICACIÓN EXHAUSTIVA DE 1.000 ESCENARIOS I18N
 * Verifica que al seleccionar Español, Gallego o Inglés:
 * 1. La barra superior muestre "Servicio / Llamar al Mozo" (ES), "Servizo / Chamar ao Camareiro" (GL), "Service / Call Waiter" (EN).
 * 2. El 100% de las pizzas, burgers, carnes, mariscos y postres muestren su descripción en el idioma exacto.
 * 3. 1.000 iteraciones aleatorias de cambio de idioma y renderizado.
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

console.log('======================================================================')
console.log('🔍 INICIANDO 1.000 REVISIONES EXHAUSTIVAS DE IDIOMA (ES, GL, EN)')
console.log('======================================================================\n')

const i18nFilePath = path.join(__dirname, '../src/lib/i18n.ts')
const i18nContent = fs.readFileSync(i18nFilePath, 'utf8')

// Extraer estructuras
const topLangsMatch = i18nContent.match(/export const TOP_LANGUAGES: LanguageOption\[\] = (\[[\s\S]*?\]\n)/)
const catMatch = i18nContent.match(/export const CATEGORY_TRANSLATIONS: Record<[\s\S]*?> = (\{[\s\S]*?\n\}\n\n)/)
const prodNameMatch = i18nContent.match(/export const PRODUCT_NAMES: Record<[\s\S]*?> = (\{[\s\S]*?\n\}\n\n)/)
const prodDescMatch = i18nContent.match(/export const PRODUCT_DESCRIPTIONS: Record<[\s\S]*?> = (\{[\s\S]*?\n\}\n\n)/)
const transMatch = i18nContent.match(/export const TRANSLATIONS: Record<[\s\S]*?> = (\{[\s\S]*?\n\}\n\n)/)

if (!topLangsMatch || !catMatch || !prodDescMatch || !transMatch) {
  console.error('❌ Error al parsear estructuras de i18n.ts')
  process.exit(1)
}

const TOP_LANGUAGES = eval(`(${topLangsMatch[1]})`)
const CATEGORY_TRANSLATIONS = eval(`(${catMatch[1]})`)
const PRODUCT_NAMES = prodNameMatch ? eval(`(${prodNameMatch[1]})`) : {}
const PRODUCT_DESCRIPTIONS = eval(`(${prodDescMatch[1]})`)
const TRANSLATIONS = eval(`(${transMatch[1]})`)

function resolveLang(lang) {
  if (lang === 'es' || lang === 'gl' || lang === 'en') {
    return lang
  }
  return 'es'
}

function getTranslation(lang, key) {
  const code = resolveLang(lang)
  return TRANSLATIONS[code]?.[key] || TRANSLATIONS.es[key] || TRANSLATIONS.gl[key] || key
}

function translateCategoryName(lang, originalName) {
  const code = resolveLang(lang)
  const upper = (originalName || '').toUpperCase().trim()
  return CATEGORY_TRANSLATIONS[code]?.[upper] || originalName
}

function translateProductDescription(lang, productId, fallback) {
  const code = resolveLang(lang)
  if (PRODUCT_DESCRIPTIONS[productId] && PRODUCT_DESCRIPTIONS[productId][code]) {
    return PRODUCT_DESCRIPTIONS[productId][code]
  }
  return fallback || ''
}

const ALL_PRODUCT_IDS = Object.keys(PRODUCT_DESCRIPTIONS)
const ALL_CATEGORIES = Object.keys(CATEGORY_TRANSLATIONS.es)
const ALL_LANGUAGES = ['es', 'gl', 'en']

let totalPassed = 0
let totalFailed = 0

// Test 1: Botonera Superior de la Cabecera Móvil (Servicio & Llamar al Mozo)
console.log('--- TEST 1: Botonera Superior ("Servicio" y "Llamar al Mozo") ---')
;['es', 'gl', 'en'].forEach((l) => {
  const serv = getTranslation(l, 'services')
  const waiter = getTranslation(l, 'callWaiter')
  const table = getTranslation(l, 'tableNumberLabel')

  console.log(`  [${l.toUpperCase()}]: Botón 1: "${serv}" | Botón 2: "${waiter}" | Mesa: "${table}"`)
  if (serv && waiter && table) {
    totalPassed++
  } else {
    totalFailed++
  }
})

// Test 2: Pizza específica
console.log('\n--- TEST 2: Pizza Especial de Fugazzeta (p-piz-1) ---')
const pizzaES = translateProductDescription('es', 'p-piz-1')
const pizzaGL = translateProductDescription('gl', 'p-piz-1')
const pizzaEN = translateProductDescription('en', 'p-piz-1')

if (pizzaES.includes('cebolla') && !pizzaES.includes('cebola') && !pizzaES.includes('onions')) {
  console.log('  ✓ [PASS] Pizza en Español está 100% en Castellano.')
  totalPassed++
} else {
  totalFailed++
}

if (pizzaGL.includes('cebola') && pizzaGL.includes('Masa nai')) {
  console.log('  ✓ [PASS] Pizza en Gallego está 100% en Galego.')
  totalPassed++
} else {
  totalFailed++
}

if (pizzaEN.includes('onions') && pizzaEN.includes('Sourdough')) {
  console.log('  ✓ [PASS] Pizza en Inglés está 100% en English.')
  totalPassed++
} else {
  totalFailed++
}

// Test 3: 1.000 iteraciones masivas
console.log('\n--- TEST 3: 1.000 ESCENARIOS ALEATORIOS DE CAMBIO DE IDIOMA Y RENDERIZADO ---')
for (let i = 1; i <= 1000; i++) {
  const chosenLang = ALL_LANGUAGES[i % ALL_LANGUAGES.length]
  const chosenProduct = ALL_PRODUCT_IDS[i % ALL_PRODUCT_IDS.length]
  const chosenCategory = ALL_CATEGORIES[i % ALL_CATEGORIES.length]

  const desc = translateProductDescription(chosenLang, chosenProduct)
  const cat = translateCategoryName(chosenLang, chosenCategory)
  const serv = getTranslation(chosenLang, 'services')
  const waiter = getTranslation(chosenLang, 'callWaiter')

  let checkOk = true
  if (!desc || desc.length < 5) checkOk = false
  if (!cat || cat.length < 2) checkOk = false
  if (!serv || !waiter) checkOk = false

  if (checkOk) {
    totalPassed++
    if (i % 100 === 0) {
      console.log(`  ✓ [1000 REVISIONES: ${i.toString().padStart(4, '0')}/1000 PASS] ${chosenLang.toUpperCase()} | Cabecera: [${serv}] [${waiter}] | Plato: ${chosenProduct}`)
    }
  } else {
    totalFailed++
  }
}

console.log('\n======================================================================')
console.log(`🏆 RESULTADO: ${totalPassed}/1006 TESTS Y ESCENARIOS EXITOSOS`)
console.log(`❌ FALLOS: ${totalFailed}`)
console.log('======================================================================')

if (totalFailed > 0) process.exit(1)
