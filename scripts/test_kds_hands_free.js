const playwright = require('playwright');

(async () => {
  const browser = await playwright.chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });
  const page = await context.newPage();

  console.log('Navegando al Monitor KDS Cocina...');
  await page.goto('http://localhost:3000/staff/kitchen/burger-gourmet', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(1000);

  // Teclear PIN de cocina '5678'
  for (const digit of ['5', '6', '7', '8']) {
    const btn = await page.locator(`button:has-text("${digit}")`).first();
    if (btn) await btn.click();
    await page.waitForTimeout(150);
  }

  await page.waitForTimeout(2500);

  const bodyText = await page.textContent('body');
  const hasHandsFreeBar = bodyText.includes('ESPACIO / PEDAL');
  const hasPTT = bodyText.includes('Voz PTT') || bodyText.includes('Push-to-Talk');
  const hasSimulateMixed = bodyText.includes('Simular Comanda Mixta');

  console.log('Resultados de Verificación KDS Manos Libres:');
  console.log('- Barra Manos Libres:', hasHandsFreeBar ? 'DETECTADA (OK)' : 'FALLO');
  console.log('- Push-to-Talk:', hasPTT ? 'DETECTADO (OK)' : 'FALLO');
  console.log('- Simulador Comanda Mixta:', hasSimulateMixed ? 'DETECTADO (OK)' : 'FALLO');

  // Pulsar botón de Simular Comanda Mixta
  const simBtn = await page.locator('button:has-text("Simular Comanda Mixta")').first();
  if (simBtn) {
    await simBtn.click();
    await page.waitForTimeout(1000);
    const updatedText = await page.textContent('body');
    const alertTriggered = updatedText.includes('NUEVA COMANDA') || updatedText.includes('Entendido');
    console.log('- Disparo de Comanda con Filtro Acústico TTS:', alertTriggered ? 'ÉXITO (OK)' : 'FALLO');
  }

  // Pulsar Barra Espaciadora en la pantalla
  await page.keyboard.press('Space');
  await page.waitForTimeout(500);

  // Probar comando de deshacer Ctrl + Z
  await page.keyboard.press('Control+z');
  await page.waitForTimeout(500);
  console.log('- Test Atajos Teclado (Espacio + Ctrl+Z): EJECUTADO');

  await page.screenshot({ path: 'kds_hands_free_verified.png' });
  console.log('Captura guardada en kds_hands_free_verified.png');
  await browser.close();
})();
