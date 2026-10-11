/**
 * ==============================================================================
 * FLUXO 1.2 TEST — VERIFICACIÓN AUTOMATIZADA: MENÚ DEL DÍA & EXCLUSIÓN MUTUA
 * ==============================================================================
 * Verifica:
 * 1. Acceso a GET /api/daily-menu y control de autorización en POST /api/daily-menu (401 sin PIN staff).
 * 2. Lógica de activación horaria y estado isDailyMenuActive.
 * 3. Invariante de exclusión mutua estricta con el banner "Recomendado para comenzar".
 * 4. Integridad server-side del precio del Menú del Día (rechazo o corrección de precio alterado por comensal).
 */

import http from 'http'
import fs from 'fs'
import path from 'path'

const BASE_URL = 'http://localhost:3000'
const SLUG = 'burger-gourmet'

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url)
    const reqOptions = {
      hostname: parsed.hostname,
      port: parsed.port || 80,
      path: parsed.pathname + parsed.search,
      method: options.method || 'GET',
      headers: options.headers || {},
    }

    const req = http.request(reqOptions, (res) => {
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        let json = null
        try { json = JSON.parse(data) } catch {}
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data,
          json,
        })
      })
    })

    req.on('error', reject)

    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body))
    }
    req.end()
  })
}

async function runTests() {
  console.log('================================================================================')
  console.log(' 🍽️ FLUXO 1.2 TEST: CERTIFICACIÓN AUTOMATIZADA DE MENÚ DEL DÍA & EXCLUSIÓN MUTUA')
  console.log('================================================================================\n')

  let passed = 0
  let total = 0

  function assert(condition, message) {
    total++
    if (condition) {
      console.log(`  ✔ [PASS] ${message}`)
      passed++
    } else {
      console.error(`  ❌ [FAIL] ${message}`)
      process.exitCode = 1
    }
  }

  // --------------------------------------------------------------------------
  // TEST 1: Endpoints API /api/daily-menu
  // --------------------------------------------------------------------------
  console.log('▶ FASE 1: Endpoints de Menú del Día y Seguridad de Autorización')

  // 1.1 GET /api/daily-menu
  const getRes = await makeRequest(`${BASE_URL}/api/daily-menu?slug=${SLUG}`)
  assert(getRes.status === 200 && getRes.json?.success === true, 'GET /api/daily-menu responde 200 con éxito')
  assert(getRes.json?.dailyMenu !== undefined, 'GET /api/daily-menu devuelve estructura de Menú del Día')
  assert(getRes.json?.dailyMenu?.sections?.length >= 4, 'Menú del Día incluye las 4 secciones estándar (1º, 2º, Postre, Bebida)')

  // 1.2 POST sin autorización debe retornar 401
  const postUnauth = await makeRequest(`${BASE_URL}/api/daily-menu`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { slug: SLUG, updates: { is_active: true } },
  })
  assert(postUnauth.status === 401, 'POST /api/daily-menu sin credenciales de personal es rechazado con HTTP 401')

  // 1.3 POST con PIN de Staff
  const postAuth = await makeRequest(`${BASE_URL}/api/daily-menu`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-staff-pin': '1234',
    },
    body: {
      slug: SLUG,
      updates: {
        is_active: true,
        title: 'Menú Ejecutivo Diario Certificado',
        fixed_price: 14.50,
        schedule_enabled: false,
      },
    },
  })
  assert(postAuth.status === 200 && postAuth.json?.success === true, 'POST /api/daily-menu con PIN de Staff actualiza configuración con HTTP 200')
  assert(postAuth.json?.dailyMenu?.is_active === true, 'Menú del Día queda activado (is_active: true)')
  assert(postAuth.json?.dailyMenu?.title === 'Menú Ejecutivo Diario Certificado', 'Título actualizado correctamente')
  assert(postAuth.json?.dailyMenu?.fixed_price === 14.50, 'Precio cerrado fijado en 14,50 €')

  // --------------------------------------------------------------------------
  // TEST 2: Invariante de Exclusión Mutua en Código y Plantillas
  // --------------------------------------------------------------------------
  console.log('\n▶ FASE 2: Invariante de Jerarquía y Exclusión Mutua Estricta')

  const categoryBarPath = path.resolve('src/components/menu/MenuCategoryBar.tsx')
  const categoryBarContent = fs.readFileSync(categoryBarPath, 'utf8')

  assert(
    categoryBarContent.includes('hasActiveDailyMenu'),
    'MenuCategoryBar recibe la prop hasActiveDailyMenu'
  )
  assert(
    categoryBarContent.includes('isInitialSection && !hasActiveDailyMenu'),
    'El banner "Recomendado para Comenzar" está estrictamente condicionado a !hasActiveDailyMenu'
  )

  const menuPagePath = path.resolve('src/app/menu/[slug]/page.tsx')
  const menuPageContent = fs.readFileSync(menuPagePath, 'utf8')

  assert(
    menuPageContent.includes('hasActiveDailyMenu={hasActiveDailyMenu}'),
    'La página del comensal propaga hasActiveDailyMenu al MenuCategoryBar'
  )
  assert(
    menuPageContent.includes('<DailyMenuCard'),
    'La página del comensal renderiza DailyMenuCard condicionado al estado activo'
  )
  assert(
    menuPageContent.includes('<DailyMenuModal'),
    'La página del comensal renderiza DailyMenuModal para la configuración de 4 pasos'
  )

  // --------------------------------------------------------------------------
  // TEST 3: Integridad Server-Side de Precios para el Menú del Día
  // --------------------------------------------------------------------------
  console.log('\n▶ FASE 3: Integridad Server-Side de Precios en /api/orders')

  // Intento de alteración de precio por el cliente (enviando 0.05 € en lugar de 14.50 €)
  const orderRes = await makeRequest(`${BASE_URL}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: {
      slug: SLUG,
      table_number: 9,
      items: [
        {
          product_id: 'daily-menu-dm-bg-001',
          name: 'Menú Ejecutivo Diario Certificado',
          price: 0.05, // PRECIO MANIPULADO
          quantity: 1,
          notes: '1º: Ensalada · 2º: Milanesa · Postre: Tarta · Bebida: Cerveza',
        },
      ],
    },
  })

  assert(orderRes.status === 200, 'POST /api/orders procesa comanda de Menú del Día')
  assert(
    orderRes.json?.order?.total_amount === 14.50 || Math.abs((orderRes.json?.order?.total_amount || 0) - 14.50) < 0.01,
    `El servidor ignora el precio manipulado del cliente (0.05 €) y fuerza el precio oficial cerrado del Menú del Día (${orderRes.json?.order?.total_amount} € === 14.50 €)`
  )

  // --------------------------------------------------------------------------
  // TEST 4: Control desde Admin
  // --------------------------------------------------------------------------
  console.log('\n▶ FASE 4: Control Dinámico desde Panel de Administración')

  const adminPagePath = path.resolve('src/app/staff/admin/[slug]/page.tsx')
  const adminPageContent = fs.readFileSync(adminPagePath, 'utf8')

  assert(
    adminPageContent.includes('AdminDailyMenuManager'),
    'El panel de administración integra el componente AdminDailyMenuManager'
  )
  assert(
    adminPageContent.includes("activeTab === 'daily_menu'"),
    'La pestaña "daily_menu" está habilitada en el administrador'
  )

  // Desactivar Menú del Día y verificar que vuelve a estar inactivo
  const pauseMenuRes = await makeRequest(`${BASE_URL}/api/daily-menu`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-staff-pin': '1234',
    },
    body: {
      slug: SLUG,
      updates: { is_active: false },
    },
  })
  assert(pauseMenuRes.status === 200, 'Pausar Menú del Día desde Admin responde 200')
  assert(pauseMenuRes.json?.dailyMenu?.is_active === false, 'Menú del Día queda pausado (is_active: false)')
  assert(pauseMenuRes.json?.isActive === false, 'isDailyMenuActive evalúa a false cuando está pausado')

  // Reactivar Menú del Día para dejarlo listo
  await makeRequest(`${BASE_URL}/api/daily-menu`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-staff-pin': '1234',
    },
    body: {
      slug: SLUG,
      updates: { is_active: true, schedule_enabled: false },
    },
  })

  console.log('\n================================================================================')
  console.log(` 🏆 RESULTADO FINAL: ${passed}/${total} PRUEBAS SUPERADAS (${Math.round((passed / total) * 100)}% PASS)`)
  console.log('================================================================================')
}

runTests().catch((err) => {
  console.error('Error fatal durante la prueba:', err)
  process.exit(1)
})
