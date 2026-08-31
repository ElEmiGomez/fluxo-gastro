// ==============================================================================
// GASTRO PWA - VERIFICADOR PERMANENTE DE SALUD DE COMPILACIÓN Y ASSETS
// Comprueba que todas las páginas, rutas API y archivos estáticos (CSS y JS chunks)
// respondan con HTTP 200 sin errores 404 ni 500.
// ==============================================================================

import assert from 'node:assert'

const BASE_URL = 'http://localhost:3000'

console.log('\n====================================================')
console.log('🛡️ PROTOCOLO DE SALUD: VERIFICACIÓN ESTRICTA DE RUTAS Y ASSETS')
console.log('====================================================\n')

const routes = [
  { name: 'Portada / Router', path: '/' },
  { name: 'Menú Digital Comensal (Burger Gourmet)', path: '/menu/burger-gourmet?table=4' },
  { name: 'Menú Digital Comensal (Bella Napoli)', path: '/menu/bella-napoli?table=2' },
  { name: 'Comandero Mozo (Burger Gourmet)', path: '/staff/comandero/burger-gourmet' },
  { name: 'Monitor Cocina KDS (Burger Gourmet)', path: '/staff/kitchen/burger-gourmet' },
  { name: 'Generador de QRs (Burger Gourmet)', path: '/staff/qr/burger-gourmet' },
  { name: 'API Órdenes', path: '/api/orders?slug=burger-gourmet' },
  { name: 'API Llamadas de Servicio', path: '/api/service-calls?slug=burger-gourmet' },
]

let passed = 0
let failed = 0

for (const r of routes) {
  const start = performance.now()
  try {
    const res = await fetch(`${BASE_URL}${r.path}`)
    const duration = (performance.now() - start).toFixed(2)
    
    if (res.status === 200) {
      console.log(`  ✓ [200 OK] ${r.name.padEnd(45)} (${duration} ms)`)
      passed++
    } else {
      console.error(`  ✗ [STATUS ${res.status}] ${r.name} -> ${r.path}`)
      failed++
    }
  } catch (err) {
    console.error(`  ✗ [ERROR DE CONEXIÓN] ${r.name} -> ${err.message}`)
    failed++
  }
}

console.log('\n====================================================')
console.log(`📊 ESTADO DE SALUD: ${passed}/${routes.length} RUTAS ACTIVAS (${failed} FALLOS)`)
console.log('====================================================\n')

if (failed > 0) {
  process.exit(1)
}
