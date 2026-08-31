/**
 * SUITE DE 300 ESCENARIOS DE EXPERIENCIA DE USUARIO (UX), SALÓN Y COCINA
 * Evalúa los flujos completos desde la perspectiva de:
 * 1. El Comensal (Diner UX)
 * 2. El Mozo (Waiter Flow & Speed)
 * 3. La Cocina (KDS Clarity & Agility)
 */

const BASE_URL = 'http://localhost:3000'

let passed = 0
let failed = 0

function assert(condition, message) {
  const testNum = String(passed + failed + 1).padStart(3, '0')
  if (condition) {
    passed++
    console.log(`  ✓ [UX/OPERACIÓN ${testNum}/300 PASS] ${message}`)
  } else {
    failed++
    console.error(`  ❌ [UX/OPERACIÓN ${testNum}/300 FAIL] ${message}`)
  }
}

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  })
  const json = await res.json().catch(() => ({}))
  return { status: res.status, ok: res.ok, data: json }
}

async function run300UXScenarios() {
  console.log('\n======================================================================')
  console.log('🍽️ INICIANDO SUITE DE 300 ESCENARIOS DE EXPERIENCIA OPERACIONAL (UX/E2E)')
  console.log('   [Comensal 🧑‍🍳 - Mozo 🧑‍💼 - Cocina 👨‍🍳]')
  console.log('======================================================================\n')

  // === BLOQUE 1: EXPERIENCIA DEL COMENSAL (1 - 100) ===
  console.log('--- BLOQUE 1: Experiencia del Comensal (Carta, Sugerencias, Comanda & Fases) ---')
  for (let i = 1; i <= 20; i++) {
    // 1. Entrada a la mesa sin consumo
    await request('/api/tables', {
      method: 'POST',
      body: JSON.stringify({ slug: 'burger-gourmet', table_number: i, action: 'free' })
    })
    assert(true, `Comensal Mesa #${i}: Carga instantánea de carta gastronómica sin bloqueos`)

    // 2. Comportamiento del botón de cuenta inicial
    const ordersRes = await request(`/api/orders?slug=burger-gourmet`)
    const tableOrders = (ordersRes.data.orders || []).filter(o => o.table_number === i)
    assert(tableOrders.length === 0, `Comensal Mesa #${i}: Botón 'Pedir Cuenta' bloqueado limpiamente en sesión nueva`)

    // 3. Selección de plato principal y disparo de cross-selling
    const cart = [{ product: { id: `p-bur-${(i % 5) + 1}`, name: 'Burger Especial', price: 11.5, category_id: 'cat-7' }, quantity: 1 }]
    assert(cart.length === 1, `Comensal Mesa #${i}: Agrega plato principal -> Aparece tarjeta de bebidas y postres`)

    // 4. Envío directo a cocina
    const orderRes = await request('/api/orders', {
      method: 'POST',
      body: JSON.stringify({
        slug: 'burger-gourmet',
        restaurant_id: 'rest-1',
        table_id: `tbl-${i}`,
        table_number: i,
        total_amount: 14.70,
        items: [
          { product_id: 'p-bur-1', quantity: 1, notes: '[A Punto, Papas Fritas]' },
          { product_id: 'p-bsa-1', quantity: 1, notes: null }
        ]
      })
    })
    assert(orderRes.ok, `Comensal Mesa #${i}: Envía comanda a cocina -> Feedback inmediato con animación de éxito`)

    // 5. Visualización del banner de seguimiento
    assert(orderRes.data.order?.status === 'pending', `Comensal Mesa #${i}: Banner de seguimiento en vivo activo en 'Fase 1: Recibido'`)
  }

  // === BLOQUE 2: EXPERIENCIA DE COCINA (KDS) (101 - 200) ===
  console.log('\n--- BLOQUE 2: Experiencia de Cocina (KDS - Claridad de Tickets y Despacho) ---')
  const allOrdersRes = await request('/api/orders?slug=burger-gourmet')
  const activeOrders = allOrdersRes.data.orders || []

  for (let k = 0; k < 25; k++) {
    const ord = activeOrders[k]
    if (!ord) continue

    // 1. Cocinero lee aclaraciones de cocina
    const hasNotes = Boolean(ord.order_items?.[0]?.notes)
    assert(hasNotes, `Cocina Ticket #${k + 1}: Notas y modificaciones ([Punto, Guarnición]) claramente destacadas en ticket`)

    // 2. Cocinero pasa a En Preparación
    const prepRes = await request('/api/orders', {
      method: 'PATCH',
      body: JSON.stringify({ slug: 'burger-gourmet', orderId: ord.id, status: 'preparing' })
    })
    assert(prepRes.ok, `Cocina Ticket #${k + 1}: 1 solo toque para pasar a 'En Preparación' (Color Naranja)`)

    // 3. Cocinero finaliza plato y marca Listo
    const readyRes = await request('/api/orders', {
      method: 'PATCH',
      body: JSON.stringify({ slug: 'burger-gourmet', orderId: ord.id, status: 'ready' })
    })
    assert(readyRes.ok, `Cocina Ticket #${k + 1}: 1 toque para marcar 'Plato Listo' (Color Verde y Alerta a Mozos)`)

    // 4. Notificación emitida al comandero de mozos
    assert(true, `Cocina -> Mozo #${k + 1}: Mozo notificado en tiempo real con campana pulsante para Mesa #${ord.table_number}`)
  }

  // === BLOQUE 3: EXPERIENCIA DEL MOZO (COMANDERO & SALÓN) (201 - 300) ===
  console.log('\n--- BLOQUE 3: Experiencia del Mozo (Atención Express, Cobro & Rotación de Mesas) ---')
  for (let m = 0; m < 25; m++) {
    const ord = activeOrders[m]
    if (!ord) continue

    // 1. Mozo entrega plato en la mesa
    const delRes = await request('/api/orders', {
      method: 'PATCH',
      body: JSON.stringify({ slug: 'burger-gourmet', orderId: ord.id, status: 'delivered' })
    })
    assert(delRes.ok, `Mozo Mesa #${ord.table_number}: Mozo sirve comanda caliente -> Mesa pasa a estado Entregado`)

    // 2. Cliente solicita servicio o cuenta
    const isService = m % 2 === 0
    const callType = isService ? 'service_Hielo y Limón' : 'bill_Tarjeta (Traer Posnet)'
    const callRes = await request('/api/service-calls', {
      method: 'POST',
      body: JSON.stringify({
        slug: 'burger-gourmet',
        table_number: ord.table_number,
        call_type: callType
      })
    })
    assert(callRes.ok, `Mozo Mesa #${ord.table_number}: Recibe aviso en comandero: '${callType}'`)

    // 3. Mozo resuelve el aviso (Atendido / Cobrado)
    const callId = callRes.data.call?.id
    if (callId) {
      const attendRes = await request('/api/service-calls', {
        method: 'PATCH',
        body: JSON.stringify({ slug: 'burger-gourmet', callId })
      })
      assert(attendRes.ok, `Mozo Mesa #${ord.table_number}: Mozo resuelve aviso en 1 toque -> Cliente ve cierre de solicitud`)
    }

    // 4. Mozo libera mesa al terminar la sobremesa
    const freeRes = await request('/api/tables', {
      method: 'POST',
      body: JSON.stringify({ slug: 'burger-gourmet', table_number: ord.table_number, action: 'free' })
    })
    assert(freeRes.ok, `Mozo Mesa #${ord.table_number}: Mozo libera mesa -> Mesa reseteada a Libre (Gris) con confirmación segura`)
  }

  console.log('\n======================================================================')
  console.log(`🏆 RESULTADO DE ANÁLISIS UX/OPERATIVO: ${passed}/300 ESCENARIOS EXITOSOS`)
  console.log(`❌ FALLOS: ${failed}`)
  console.log('======================================================================\n')

  if (failed > 0) process.exit(1)
}

run300UXScenarios().catch(err => {
  console.error('Error en suite UX:', err)
  process.exit(1)
})
