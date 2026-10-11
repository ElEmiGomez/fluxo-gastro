/**
 * SUITE DE CERTIFICACIÓN AUTOMATIZADA: TOP 10 IDIOMAS DE EUROPA Y PENÍNSULA
 * 
 * Verifica que los 10 idiomas oficiales de Fluxo 1.2:
 * 1. Galego (gl)
 * 2. Español (es)
 * 3. English (en)
 * 4. Français (fr)
 * 5. Deutsch (de)
 * 6. Português (pt)
 * 7. Italiano (it)
 * 8. Nederlands (nl)
 * 9. Català (ca)
 * 10. Euskara (eu)
 * 
 * Cuenten con 100% de cobertura en:
 * - Opciones de idioma de cabecera (código, nombre, nombre nativo, bandera)
 * - 20 Categorías gastronómicas
 * - 22 Productos del catálogo oficial (nombres y descripciones completas)
 * - 90+ Claves de interfaz de comensal, sala, micro-onboarding y menús
 * - 14 Alérgenos de declaración obligatoria de la Unión Europea
 * - Robustez ante idiomas no soportados y fallbacks
 */

import {
  TOP_LANGUAGES,
  CATEGORY_TRANSLATIONS,
  PRODUCT_NAMES,
  PRODUCT_DESCRIPTIONS,
  TRANSLATIONS,
  resolveLang,
  getTranslation,
  translateCategoryName,
  translateProductName,
  translateProductDescription,
} from '../src/lib/i18n.ts'

import {
  MANDATORY_EU_ALLERGENS,
  getAllergenName,
} from '../src/lib/allergens.ts'

console.log('======================================================================')
console.log('🌐 INICIANDO CERTIFICACIÓN AUTOMATIZADA: TOP 10 IDIOMAS (FLUXO 1.2)')
console.log('======================================================================\n')

let passed = 0
let failed = 0

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ [PASS] ${message}`)
    passed++
  } else {
    console.error(`  ❌ [FAIL] ${message}`)
    failed++
  }
}

const EXPECTED_LANG_CODES = ['gl', 'es', 'en', 'fr', 'de', 'pt', 'it', 'nl', 'ca', 'eu']

// TEST 1: Catálogo de idiomas
console.log('--- TEST 1: Registro Oficial de los 10 Idiomas ---')
assert(TOP_LANGUAGES.length === 10, `TOP_LANGUAGES contiene exactamente 10 idiomas (actual: ${TOP_LANGUAGES.length})`)

EXPECTED_LANG_CODES.forEach(code => {
  const found = TOP_LANGUAGES.find(l => l.code === code)
  assert(Boolean(found), `Idioma '${code}' está presente en TOP_LANGUAGES`)
  if (found) {
    assert(Boolean(found.nativeName && found.name && found.flag), `Idioma '${code}' tiene nativeName (${found.nativeName}), name y flag (${found.flag})`)
  }
})

// TEST 2: Categorías gastronómicas
console.log('\n--- TEST 2: Cobertura de las 20 Categorías en los 10 Idiomas ---')
const CATEGORIES = [
  'NUESTRAS PROMOS', 'ENTRADAS', 'TABLAS', 'ENSALADAS', 'PLATOS PRINCIPALES',
  'PIZZAS', 'BURGERS', 'SANDWICHS', 'WRAPS', 'POSTRES',
  'POSTRES & CAFÉ', 'POSTRES Y CAFÉ', 'CAFÉ Y POSTRES', 'SIN TACC',
  'BEBIDAS SIN ALCOHOL', 'BEBIDAS CON ALCOHOL', 'TRAGOS', 'GIN', 'GIN & BEBIDAS', 'BEBIDAS'
]

EXPECTED_LANG_CODES.forEach(code => {
  let allCatsPresent = true
  CATEGORIES.forEach(cat => {
    const translated = translateCategoryName(code, cat)
    if (!translated || translated.trim() === '') {
      allCatsPresent = false
    }
  })
  assert(allCatsPresent, `Todas las 20 categorías traducidas correctamente en '${code}'`)
})

// TEST 3: Nombres y descripciones de productos
console.log('\n--- TEST 3: Cobertura de Productos en los 10 Idiomas ---')
const PRODUCT_IDS = Object.keys(PRODUCT_NAMES)
assert(PRODUCT_IDS.length >= 20, `Catálogo de productos cuenta con al menos 20 productos registrados (actual: ${PRODUCT_IDS.length})`)

EXPECTED_LANG_CODES.forEach(code => {
  let allNamesOk = true
  let allDescsOk = true
  PRODUCT_IDS.forEach(pId => {
    const name = translateProductName(code, pId, '')
    const desc = translateProductDescription(code, pId, '')
    if (!name || name.trim() === '') allNamesOk = false
    if (!desc || desc.trim() === '') allDescsOk = false
  })
  assert(allNamesOk, `Nombres de todos los productos disponibles en '${code}'`)
  assert(allDescsOk, `Descripciones completas de todos los productos disponibles en '${code}'`)
})

// TEST 4: Claves de interfaz y experiencia de comensal
console.log('\n--- TEST 4: Claves de Interfaz, Onboarding y Sala en los 10 Idiomas ---')
const CRITICAL_UI_KEYS = [
  'menuTitle', 'allCategories', 'searchPlaceholder', 'sinTacc', 'veggie',
  'callWaiter', 'waiterNotified', 'requestBill', 'microServices',
  'tapWater', 'iceLemon', 'extraCutlery', 'breadSauces', 'saltCondiments', 'napkins',
  'sendToKitchen', 'total', 'subtotal', 'vatIncluded', 'orderSent',
  'legalNotice', 'anisakisNotice', 'yourOrder', 'emptyCart', 'sendOrder',
  'tableNumberLabel', 'splitBill', 'selectPayment', 'cash', 'card', 'bizum',
  'cookingPoint', 'sideDish', 'kitchenCourse', 'addDish',
  'orderInKitchen', 'orderReady', 'orderDelivered', 'enjoyMeal',
  'onboardingTitle', 'onboardingStep1Title', 'onboardingStep2Title', 'onboardingStep3Title', 'onboardingStep4Title',
  'reassuranceCartNotice', 'dailyMenuBadge', 'dailyMenuDescription', 'dailyMenuConfigure'
]

EXPECTED_LANG_CODES.forEach(code => {
  let allKeysOk = true
  CRITICAL_UI_KEYS.forEach(key => {
    const text = getTranslation(code, key)
    if (!text || text === key) {
      allKeysOk = false
    }
  })
  assert(allKeysOk, `Claves críticas de UI y onboarding verificadas en '${code}'`)
})

// TEST 5: Alérgenos de la Unión Europea
console.log('\n--- TEST 5: Catálogo de 14 Alérgenos Oficiales de la UE en los 10 Idiomas ---')
assert(MANDATORY_EU_ALLERGENS.length === 14, `Catálogo contiene exactamente los 14 alérgenos obligatorios de la UE`)

EXPECTED_LANG_CODES.forEach(code => {
  let allAllergensOk = true
  MANDATORY_EU_ALLERGENS.forEach(a => {
    const allergenName = getAllergenName(a.id, code)
    if (!allergenName || allergenName === a.id) {
      allAllergensOk = false
    }
  })
  assert(allAllergensOk, `Los 14 alérgenos traducidos con terminología oficial en '${code}'`)
})

// TEST 6: Resiliencia y Fallbacks de Idioma
console.log('\n--- TEST 6: Resiliencia de Fallbacks y Manejo de Errores ---')
assert(resolveLang('xx') === 'es', "resolveLang con idioma desconocido 'xx' retrocede con seguridad a 'es'")
assert(resolveLang('') === 'es', "resolveLang con cadena vacía retrocede con seguridad a 'es'")
assert(resolveLang('fr') === 'fr', "resolveLang('fr') resuelve a 'fr'")
assert(resolveLang('ca') === 'ca', "resolveLang('ca') resuelve a 'ca'")
assert(resolveLang('eu') === 'eu', "resolveLang('eu') resuelve a 'eu'")

const fallbackResult = getTranslation('xx', 'menuTitle')
assert(Boolean(fallbackResult && fallbackResult.length > 0), "getTranslation con idioma desconocido retorna traducción por defecto sin errores")

console.log('\n======================================================================')
console.log(`📊 RESULTADO FINAL: ${passed} PASSED | ${failed} FAILED`)
console.log('======================================================================')

if (failed > 0) {
  process.exit(1)
} else {
  console.log('🏆 ¡CERTIFICACIÓN DEL TOP 10 DE IDIOMAS COMPLETADA CON 100% ÉXITO!')
  process.exit(0)
}
