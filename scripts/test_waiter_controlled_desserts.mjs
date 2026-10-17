/**
 * Certificación de Lógica de 3 Vías controlada por el Mozo (Mesa 7: 2 Hamburguesas + 2 Bebidas + 2 Postres)
 */
import assert from 'node:assert/strict'

// Simulamos la lógica pura de course-utils y transición de órdenes
function runUnitVerification() {
  console.log('=== VERIFICACIÓN DE LÓGICA DE 3 VÍAS CONTROLADA POR EL MOZO ===')

  const makeMesa7Order = () => ({
    id: '00000000-0000-4000-8000-000000000007',
    table_number: 7,
    status: 'pending_validation',
    total_amount: 46,
    order_items: [
      { id: 'item-1', product_id: 'p-1', quantity: 2, course: 'second', notes: '', product: { id: 'p-1', name: 'Burger Gourmet' } },
      { id: 'item-2', product_id: 'p-12', quantity: 2, course: 'drink', notes: '', product: { id: 'p-12', name: 'Agua Mineral' } },
      { id: 'item-3', product_id: 'p-9', quantity: 2, course: 'dessert', notes: '', product: { id: 'p-9', name: 'Tarta de Queso' } },
    ],
  })

  const hasTag = (it, tag) => Boolean(it.notes && it.notes.includes(tag))
  const isDrink = it => it.course === 'drink'
  const isFood = it => it.course === 'first' || it.course === 'second'
  const isDessert = it => it.course === 'dessert'
  const isDrinkServed = it => hasTag(it, '[BARRA_SERVIDA]')
  const isFoodReady = it => hasTag(it, '[COCINA_LISTA]')
  const isDessertReady = it => hasTag(it, '[POSTRE_LISTO]') || hasTag(it, '[POSTRE_SERVIDO]')
  const isDessertFired = it => hasTag(it, '[MARCHAR_POSTRE]')

  const orderHasFood = o => o.order_items.some(isFood)
  const orderHasDesserts = o => o.order_items.some(isDessert)
  const orderHasHeldDesserts = o => orderHasFood(o) && o.order_items.filter(isDessert).some(d => !isDessertFired(d) && !isDessertReady(d))
  const orderHasActiveDesserts = o => {
    const desserts = o.order_items.filter(isDessert)
    if (!desserts.length) return false
    if (!orderHasFood(o)) return desserts.some(d => !isDessertReady(d))
    return desserts.some(d => isDessertFired(d) && !isDessertReady(d))
  }
  const areOrderDrinksPending = o => !['paid', 'cancelled', 'pending_validation'].includes(o.status) && o.order_items.filter(isDrink).some(d => !isDrinkServed(d))
  const isOrderDessertsReady = o => o.order_items.filter(isDessert).every(isDessertReady)
  const areOrderDessertsPendingWaiter = o => o.status === 'delivered' && !areOrderDrinksPending(o) && orderHasHeldDesserts(o)
  const isVisibleInKitchen = o =>
    ['pending', 'confirmed', 'preparing', 'ready'].includes(o.status) &&
    (orderHasFood(o) || orderHasActiveDesserts(o) || (!orderHasFood(o) && orderHasDesserts(o) && !isOrderDessertsReady(o)))

  // ESCENARIO A: El mozo manda los postres a cocina tras entregar comida y bebida
  const ordA = makeMesa7Order()
  assert.equal(ordA.status, 'pending_validation')
  assert.equal(areOrderDrinksPending(ordA), false, 'En pending_validation aún no aparecen bebidas pendientes')
  assert.equal(areOrderDessertsPendingWaiter(ordA), false, 'En pending_validation no aparecen postres listos para gestionar')

  // Paso 1: Mozo aprueba comanda -> pasa a pending
  ordA.status = 'pending'
  assert.equal(areOrderDrinksPending(ordA), true, 'Al aprobar comanda, las 2 bebidas pasan a la cola del mozo')
  assert.equal(isVisibleInKitchen(ordA), true, 'Cocina recibe la comanda para hacer las 2 hamburguesas')
  assert.equal(orderHasHeldDesserts(ordA), true, 'Los 2 postres quedan retenidos (ocultos en cocina)')

  // Paso 2: Mozo entrega las bebidas y las tacha
  ordA.order_items.filter(isDrink).forEach(d => { d.notes += ' [BARRA_SERVIDA]' })
  assert.equal(areOrderDrinksPending(ordA), false, 'Bebidas ya entregadas')
  assert.equal(areOrderDessertsPendingWaiter(ordA), false, 'Aún no se notifican los postres porque falta entregar las hamburguesas')

  // Paso 3: Cocina prepara y termina las hamburguesas -> ready
  ordA.status = 'preparing'
  ordA.order_items.filter(isFood).forEach(f => { f.notes += ' [COCINA_LISTA]' })
  ordA.status = 'ready'

  // Paso 4: Mozo recoge las hamburguesas y las entrega en la Mesa 7 -> delivered
  ordA.status = 'delivered'
  assert.equal(isVisibleInKitchen(ordA), false, 'Al entregarse las hamburguesas, el ticket sale de cocina hasta que el mozo marche postres')
  assert.equal(areOrderDessertsPendingWaiter(ordA), true, '¡Notificación automática al mozo! Comida y bebida entregadas -> Postres listos para gestionar')

  // Paso 5A: El mozo ve que terminaron de comer y pulsa "Mandar a Cocina"
  ordA.order_items.filter(isDessert).forEach(d => { d.notes += ' [MARCHAR_POSTRE]' })
  ordA.status = 'preparing'
  assert.equal(areOrderDessertsPendingWaiter(ordA), false, 'Los postres salen de espera del mozo y pasan a cocina')
  assert.equal(isVisibleInKitchen(ordA), true, 'Cocina recibe los 2 postres en preparación')

  // Paso 6A: Cocina termina los postres -> ready -> Mozo los entrega -> delivered
  ordA.order_items.filter(isDessert).forEach(d => { d.notes += ' [POSTRE_LISTO]' })
  ordA.status = 'ready'
  ordA.status = 'delivered'
  assert.equal(areOrderDessertsPendingWaiter(ordA), false, 'Ciclo completo finalizado (Opción A: Cocina)')
  assert.equal(isVisibleInKitchen(ordA), false, 'Cocina limpia tras entregar postres')
  console.log('✅ Escenario A (Mesa 7 -> Mandar Postres a Cocina) verificado 100%')

  // ESCENARIO B: El mozo entrega los postres directamente (Tachar sin pasar por cocina)
  const ordB = makeMesa7Order()
  ordB.status = 'pending'
  ordB.order_items.filter(isDrink).forEach(d => { d.notes += ' [BARRA_SERVIDA]' })
  ordB.order_items.filter(isFood).forEach(f => { f.notes += ' [COCINA_LISTA]' })
  ordB.status = 'delivered'
  assert.equal(areOrderDessertsPendingWaiter(ordB), true, 'Notificación de postres activa para Mesa 7')

  // Paso 5B: El mozo saca el postre de vitrina y pulsa "Entregar Directo (Tachar)"
  ordB.order_items.filter(isDessert).forEach(d => { d.notes += ' [POSTRE_LISTO] [POSTRE_SERVIDO]' })
  assert.equal(areOrderDessertsPendingWaiter(ordB), false, 'Tarea de postres completada directamente por el mozo')
  assert.equal(isVisibleInKitchen(ordB), false, 'Cocina nunca fue interrumpida por un postre de vitrina')
  console.log('✅ Escenario B (Mesa 7 -> Entregar Postres Directo / Tachar) verificado 100%')
}

runUnitVerification()
