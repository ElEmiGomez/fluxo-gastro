import assert from 'node:assert/strict'

async function runStampLoyaltyTests() {
  console.log('--- TEST: SISTEMA DE FIDELIZACIÓN POR CARTILLA DE SELLOS (PREMIOS POR COMPRAS) ---')

  const {
    getLoyaltyProfile,
    registerOrGetLoyaltyProfile,
    settleLoyaltySession,
    redeemStampReward,
    getLoyaltySettings,
    updateLoyaltySettings,
    resetOrDeleteLoyaltyProfile,
  } = await import('../src/lib/supabase/repositories/loyalty.repository.ts')

  const slug = 'burger-gourmet'
  const testEmail = 'cliente.test.sellos@fluxo.app'

  // 1. Limpiar perfil de prueba para empezar de cero
  console.log('\n1. Inicializando perfil de prueba...')
  await resetOrDeleteLoyaltyProfile(slug, testEmail)
  const profile = await registerOrGetLoyaltyProfile(slug, {
    name: 'Cliente Sellos Test',
    email: testEmail,
    tableNumber: 12,
  })

  assert.equal(profile.email, testEmail)
  assert.equal(profile.stamps_count ?? 0, 0, 'La cartilla debe iniciar en 0 sellos')
  assert.equal(profile.unlocked_rewards_count ?? 0, 0, 'No debe tener premios desbloqueados inicialmente')
  console.log('✓ Perfil creado con 0 sellos y 0 premios desbloqueados.')

  // 2. Probar cuenta inferior al consumo mínimo (< 50 €)
  console.log('\n2. Liquidando cuenta de 32,50 € (< 50 € de consumo mínimo)...')
  const settleLow = await settleLoyaltySession(slug, {
    tableNumber: 12,
    finalAmount: 32.50,
    email: testEmail,
  })

  assert.equal(settleLow.stamp_awarded, false, 'No debe acreditar sello si el importe es menor a 50€')
  const profAfterLow = await getLoyaltyProfile(slug, testEmail)
  assert.equal(profAfterLow.stamps_count, 0, 'El contador de sellos debe seguir en 0')
  console.log('✓ Verificado: cuenta de 32,50 € no otorgó sello.')

  // 3. Probar cuenta válida (>= 50 €)
  console.log('\n3. Liquidando cuenta de 58,00 € (>= 50 € de consumo mínimo)...')
  const settleValid1 = await settleLoyaltySession(slug, {
    tableNumber: 12,
    finalAmount: 58.00,
    email: testEmail,
  })

  assert.equal(settleValid1.stamp_awarded, true, 'Debe acreditar sello si supera 50€')
  assert.equal(settleValid1.stamps_count, 1, 'Debe registrar sello 1 de 5')
  assert.equal(settleValid1.stamp_reward_unlocked_now, false, 'Aún no debe desbloquear premio con 1 sello')
  console.log('✓ Verificado: sello 1 otorgado con éxito.')

  // 4. Completar hasta 4 sellos
  console.log('\n4. Simulando visitas 2, 3 y 4 con consumo >= 50 €...')
  for (let visit = 2; visit <= 4; visit++) {
    const res = await settleLoyaltySession(slug, {
      tableNumber: 12,
      finalAmount: 52.00,
      email: testEmail,
    })
    assert.equal(res.stamps_count, visit, `Debe registrar sello ${visit}`)
    assert.equal(res.stamp_reward_unlocked_now, false)
  }
  const prof4 = await getLoyaltyProfile(slug, testEmail)
  assert.equal(prof4.stamps_count, 4, 'Debe tener exactamente 4 sellos')
  assert.equal(prof4.unlocked_rewards_count, 0, 'Aún no debe haber premios desbloqueados')
  console.log('✓ Verificado: 4 sellos registrados correctamente.')

  // 5. Visita 5: Alcanzar la meta y desbloquear el premio
  console.log('\n5. Visita 5: Liquidando cuenta de 65,00 € (alcanza la meta 5/5)...')
  const settleGoal = await settleLoyaltySession(slug, {
    tableNumber: 12,
    finalAmount: 65.00,
    email: testEmail,
  })

  assert.equal(settleGoal.stamp_awarded, true)
  assert.equal(settleGoal.stamp_reward_unlocked_now, true, 'Debe indicar que el premio fue desbloqueado')
  assert.equal(settleGoal.unlocked_rewards_count, 1, 'Debe tener 1 premio desbloqueado')
  assert.equal(settleGoal.stamps_count, 0, 'La cartilla debe reiniciarse a 0 para el siguiente ciclo')

  const profGoal = await getLoyaltyProfile(slug, testEmail)
  assert.equal(profGoal.unlocked_rewards_count, 1, 'Perfil debe reflejar 1 premio listo para la siguiente visita')
  assert.equal(profGoal.stamps_count, 0, 'Perfil debe tener cartilla en 0 sellos')
  console.log('✓ Verificado: 5º sello desbloqueó premio y reinició cartilla a 0/5.')

  // 6. Canjear premio en la siguiente visita
  console.log('\n6. Siguiente visita: comensal canjea su postre o café gratis...')
  const redeemResult = await redeemStampReward(slug, testEmail, 'prod-tarta-queso')
  assert.equal(redeemResult.success, true, 'Canje debe ser exitoso')
  assert.equal(redeemResult.remaining_rewards, 0, 'No deben quedar premios pendientes')

  const profAfterRedeem = await getLoyaltyProfile(slug, testEmail)
  assert.equal(profAfterRedeem.unlocked_rewards_count, 0)
  console.log('✓ Verificado: premio canjeado y saldo de premios actualizado a 0.')

  // 7. Intentar canjear sin premios desbloqueados
  console.log('\n7. Intentando canjear sin premios disponibles (debe rechazar)...')
  const secondRedeem = await redeemStampReward(slug, testEmail, 'prod-cafe')
  assert.equal(secondRedeem.success, false, 'No debe permitir canjear sin saldo')
  console.log('✓ Verificado: rechazo seguro de canje sin saldo.')

  // 8. Cuenta de esa misma visita donde se canjeó el premio (> 50 €)
  console.log('\n8. Liquidando cuenta de esa misma visita (70 €) para sumar sello 1 de la nueva cartilla...')
  const settleNewCycle = await settleLoyaltySession(slug, {
    tableNumber: 12,
    finalAmount: 70.00,
    email: testEmail,
  })
  assert.equal(settleNewCycle.stamp_awarded, true)
  assert.equal(settleNewCycle.stamps_count, 1, 'Debe iniciar la nueva cartilla con 1 sello')
  console.log('✓ Verificado: la visita de canje sumó el sello 1 de la nueva cartilla.')

  // 9. Configuración Admin: Cambiar meta a 4 sellos y mínimo a 40 €
  console.log('\n9. Probando actualización de configuración desde panel Admin...')
  const updatedSettings = await updateLoyaltySettings(slug, {
    target_stamps: 4,
    min_spend_per_stamp: 40,
    reward_label: 'Tarta de Queso Artesana Gratis',
  })
  assert.equal(updatedSettings.target_stamps, 4)
  assert.equal(updatedSettings.min_spend_per_stamp, 40)
  assert.equal(updatedSettings.reward_label, 'Tarta de Queso Artesana Gratis')

  const retrievedSettings = await getLoyaltySettings(slug)
  assert.equal(retrievedSettings.target_stamps, 4)
  assert.equal(retrievedSettings.min_spend_per_stamp, 40)
  console.log('✓ Verificado: configuración de fidelización editable y persistente.')

  // Restaurar configuración predeterminada
  await updateLoyaltySettings(slug, {
    target_stamps: 5,
    min_spend_per_stamp: 50,
    reward_label: 'Postre o Café gratis',
  })

  // Limpieza
  await resetOrDeleteLoyaltyProfile(slug, testEmail)

  console.log('\n======================================================')
  console.log('🎉 TODOS LOS TESTS DE CARTILLA DE SELLOS: 100% PASS!')
  console.log('======================================================\n')
}

runStampLoyaltyTests().catch((err) => {
  console.error('ERROR EN TEST DE SELLOS:', err)
  process.exit(1)
})
