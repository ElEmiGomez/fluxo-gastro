import assert from 'assert'
import {
  registerOrGetLoyaltyProfile,
  getLoyaltyProfile,
  holdLoyaltyPoints,
  releaseLoyaltyPoints,
  claimGoogleReviewBonus,
  settleLoyaltySession,
} from '../src/lib/supabase/repositories/loyalty.repository'
import {
  isDrinkOnlyOrder,
  orderHasHeldDesserts,
  orderHasActiveDesserts,
  areOrderDrinksPending,
  evaluateOrderStations,
  stripInternalStationTags,
} from '../src/lib/course-utils'
import { VALID_ORDER_TRANSITIONS } from '../src/lib/server-state'

async function runTests() {
  console.log('=== TEST SUITE: ESCROW ATÓMICO & MÁQUINA DE ESTADOS POR ESTACIÓN (FLUXO 1.2) ===\n')

  const SLUG = 'burger-gourmet'

  // =========================================================================
  // 1. MÁQUINA DE ESTADOS DE ESTACIÓN (DRINK-ONLY & 2-PHASE DESSERTS)
  // =========================================================================
  console.log('1. Verificando Invariantes de Máquina de Estados por Estación...')

  // Transición directa de orden solo bebidas a 'ready'
  assert.ok(
    VALID_ORDER_TRANSITIONS['pending_validation'].includes('ready'),
    'VALID_ORDER_TRANSITIONS debe permitir pending_validation -> ready para órdenes 100% bebidas'
  )
  assert.ok(
    VALID_ORDER_TRANSITIONS['ready'].includes('preparing'),
    'VALID_ORDER_TRANSITIONS debe permitir ready -> preparing para marchar postres retenidos'
  )
  assert.ok(
    VALID_ORDER_TRANSITIONS['delivered'].includes('preparing'),
    'VALID_ORDER_TRANSITIONS debe permitir delivered -> preparing cuando se marchan postres'
  )

  // Inferencia Drink-Only
  const drinkOnlyOrder: any = {
    id: 'ord-drinks-1',
    status: 'pending_validation',
    order_items: [
      { id: 'i1', course: 'drink', product: { name: 'Cerveza' } },
      { id: 'i2', course: 'drink', product: { name: 'Agua' } },
    ],
  }
  assert.strictEqual(isDrinkOnlyOrder(drinkOnlyOrder), true, 'Debe reconocer comanda 100% bebidas')

  // Inferencia Mixta
  const mixedOrder: any = {
    id: 'ord-mixed-1',
    status: 'preparing',
    order_items: [
      { id: 'i1', course: 'drink', product: { name: 'Refresco' } },
      { id: 'i2', course: 'second', product: { name: 'Burger' } },
      { id: 'i3', course: 'dessert', product: { name: 'Tarta' } },
    ],
  }
  assert.strictEqual(isDrinkOnlyOrder(mixedOrder), false, 'No debe clasificar orden mixta como drink-only')
  assert.strictEqual(orderHasHeldDesserts(mixedOrder), true, 'Postres deben nacer retenidos en pase 1')
  assert.strictEqual(orderHasActiveDesserts(mixedOrder), false, 'Postres no están activos antes de marchar')

  // Evaluación de estaciones
  const stations = evaluateOrderStations(mixedOrder)
  assert.strictEqual(stations.kitchenItems.length, 2, 'Cocina recibe principales y postres')
  assert.strictEqual(stations.barItems.length, 1, 'Bar/Mozo recibe bebidas')

  // Cuando la comida pasa a delivered, las bebidas pendientes NO deben desaparecer del Comandero
  mixedOrder.status = 'delivered'
  assert.strictEqual(areOrderDrinksPending(mixedOrder), true, 'Bebidas no servidas siguen pendientes tras servir la comida')

  console.log('  ✔ Máquina de estados gastronómica: Drink-only directo a ready y postres retenidos en 2 fases verificado.\n')

  // =========================================================================
  // 2. ESCROW ATÓMICO Y DEFENSA ANTI-TOCTOU (DOUBLE-SPEND PREVENTION)
  // =========================================================================
  console.log('2. Verificando Escrow Atómico y Mutex contra Doble Gasto de Puntos...')

  const testEmail = `test-diner-${Date.now()}@fluxo-test.com`

  // Registrar comensal con saldo base
  const profile = await registerOrGetLoyaltyProfile(SLUG, {
    name: 'Comensal Concurrente',
    email: testEmail,
    tableNumber: 15,
  })
  assert.ok(profile, 'Perfil registrado correctamente')

  // Simular saldo de 60 puntos
  profile.total_points = 60
  profile.available_points = 60

  // Lanzar dos retenciones simultáneas de 40 puntos (Total solicitado: 80 puntos > 60 disponibles)
  // En un sistema sin bloqueo atómico (TOCTOU), ambas leerían 60 disponibles y se concederían ambas!
  const sessionToken = `sess-${Date.now()}`
  const results = await Promise.allSettled([
    holdLoyaltyPoints(SLUG, {
      email: testEmail,
      points: 40,
      tableNumber: 15,
      sessionToken,
      productId: 'prod-reward-1',
    }),
    holdLoyaltyPoints(SLUG, {
      email: testEmail,
      points: 40,
      tableNumber: 15,
      sessionToken,
      productId: 'prod-reward-2',
    }),
  ])

  const fulfilled = results.filter(r => r.status === 'fulfilled')
  const rejected = results.filter(r => r.status === 'rejected')

  assert.strictEqual(fulfilled.length, 1, 'Exactamente 1 intento debe triunfar')
  assert.strictEqual(rejected.length, 1, 'El segundo intento concurrente debe ser rechazado por saldo insuficiente')
  
  const errMessage = (rejected[0] as PromiseRejectedResult).reason.message
  assert.ok(errMessage.includes('Puntos insuficientes'), 'El error debe indicar puntos insuficientes')

  const finalProfile = await getLoyaltyProfile(SLUG, testEmail)
  assert.strictEqual(finalProfile?.held_points, 40, 'Puntos retenidos deben ser exactamente 40')
  assert.strictEqual(finalProfile?.available_points, 20, 'Puntos disponibles deben ser exactamente 20 (60 - 40)')

  console.log('  ✔ TOCTOU Neutralizado: Bloqueo atómico previene double-spending bajo concurrencia.\n')

  // =========================================================================
  // 3. IDEMPOTENCIA EN BONIFICACIÓN GOOGLE MAPS (+50 PUNTOS)
  // =========================================================================
  console.log('3. Verificando Idempotencia en Bonificación de Google Maps...')

  const reviewEmail = `review-${Date.now()}@fluxo-test.com`
  await registerOrGetLoyaltyProfile(SLUG, {
    name: 'Reviewer Test',
    email: reviewEmail,
    tableNumber: 8,
  })

  // Lanzar 3 reclamos concurrentes del bono de Google Maps
  const reviewBonusResults = await Promise.all([
    claimGoogleReviewBonus(SLUG, reviewEmail, 50),
    claimGoogleReviewBonus(SLUG, reviewEmail, 50),
    claimGoogleReviewBonus(SLUG, reviewEmail, 50),
  ])

  const awardedCount = reviewBonusResults.filter(r => r.bonus_points === 50).length
  const ignoredCount = reviewBonusResults.filter(r => r.already_awarded || r.bonus_points === 0).length

  assert.strictEqual(awardedCount, 1, 'El bono de Google Maps debe otorgarse exactamente 1 vez')
  assert.strictEqual(ignoredCount, 2, 'Los reclamos repetidos deben ignorarse de forma idempotente')

  const reviewProfile = await getLoyaltyProfile(SLUG, reviewEmail)
  assert.strictEqual(reviewProfile?.total_points, 50, 'El saldo total debe ser exactamente 50 puntos')
  assert.strictEqual(reviewProfile?.google_review_bonus_awarded, true, 'Flag google_review_bonus_awarded debe estar activo')

  console.log('  ✔ Idempotencia de Bono Google Maps 100% certificada.\n')

  // =========================================================================
  // 4. LIQUIDACIÓN DE SESIÓN (SETTLEMENT) & LIBERACIÓN DE ESCROW
  // =========================================================================
  console.log('4. Verificando Liquidación de Sesión y Cierre de Mesa...')

  const settlement = await settleLoyaltySession(SLUG, {
    tableNumber: 15,
    sessionToken,
    finalAmount: 100, // 100€ consumidos -> 100 puntos ganados
    email: testEmail,
  })

  assert.ok(settlement, 'Liquidación exitosa')
  assert.strictEqual(settlement.redeemed_points, 40, 'Puntos canjeados liquidados: 40')
  assert.strictEqual(settlement.earned_points, 100, 'Puntos ganados por la cuenta: 100')
  assert.strictEqual(settlement.new_total_points, 120, 'Saldo final: 60 - 40 canjeados + 100 ganados = 120')

  console.log('  ✔ Liquidación de sesión y consolidación de puntos 100% validada.\n')

  // =========================================================================
  // 5. ACREDITACIÓN RETROACTIVA POST-PAGO Y SANITIZACIÓN DE ETIQUETAS
  // =========================================================================
  console.log('5. Verificando Acreditación Retroactiva Post-Pago y Sanitización de Etiquetas...')

  // 5.1 Sanitización de etiquetas técnicas
  assert.strictEqual(stripInternalStationTags('[BARRA: SERVIDA]'), '')
  assert.strictEqual(stripInternalStationTags('[BARRA_SERVIDA]'), '')
  assert.strictEqual(stripInternalStationTags('[COCINA: LISTA] Sin cebolla'), 'Sin cebolla')
  assert.strictEqual(stripInternalStationTags('Bien hecha [POSTRE: EN ESPERA]'), 'Bien hecha')
  assert.strictEqual(stripInternalStationTags('[POSTRE_LISTO]'), '')
  assert.strictEqual(stripInternalStationTags('↳ ⚠️ [BARRA: SERVIDA]'.replace('↳ ⚠️', '')), '')

  // 5.2 Caso Real del Video: Pago de 53.20€ + Bono Google Maps de 50 pts
  const globalStore = globalThis as any
  if (!globalStore.__GASTRO_ORDERS__) {
    globalStore.__GASTRO_ORDERS__ = {}
  }
  const paidOrderId = `ord-paid-video-${Date.now()}`
  globalStore.__GASTRO_ORDERS__[SLUG] = [
    {
      id: paidOrderId,
      table_number: 7,
      total_amount: 53.20,
      status: 'paid', // La mesa ya fue cobrada y liberada por el mozo a las 03:06
      created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      loyalty_credited: false,
    },
  ]

  const rocioEmail = `rocio-torres-${Date.now()}@fluxo-test.com`
  const rocioProfile = await registerOrGetLoyaltyProfile(SLUG, {
    name: 'Rocío Torres',
    email: rocioEmail,
    tableNumber: 7,
    claimGoogleReviewBonus: true,
  })

  // Debe sumar 53 pts (de los 53.20€ cobrados) + 50 pts (Google Maps) = 103 pts directos a disponibles
  assert.ok(rocioProfile, 'Perfil de Rocío registrado')
  assert.strictEqual(rocioProfile.total_points, 103, 'Total debe ser 103 puntos (53 comanda cobrada + 50 Maps)')
  assert.strictEqual(rocioProfile.available_points, 103, 'Disponibles deben ser 103 puntos')
  assert.strictEqual(rocioProfile.held_points, 0, 'Confirmados en mesa debe ser 0 porque la orden ya fue cobrada')

  const memOrd = globalStore.__GASTRO_ORDERS__[SLUG].find((o: any) => o.id === paidOrderId)
  assert.strictEqual(memOrd.loyalty_credited, true, 'La orden debe quedar marcada como loyalty_credited = true')

  console.log('  ✔ Acreditación retroactiva post-pago (103 pts disponibles) y sanitización 100% verificada.\n')

  console.log('=================================================================')
  console.log('TODAS LAS PRUEBAS DE AUDITORÍA ARGON 4 SUPERADAS CON ÉXITO: 100% PASS')
  console.log('=================================================================')
}

runTests().catch(err => {
  console.error('FAILED TEST:', err)
  process.exit(1)
})
