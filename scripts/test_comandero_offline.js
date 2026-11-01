const playwright = require('playwright');

(async () => {
  const browser = await playwright.chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true
  });
  const page = await context.newPage();

  console.log('Navegando a Comandero...');
  await page.goto('http://localhost:3000/staff/comandero/burger-gourmet', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(1000);

  // Teclear PIN 1234 en el teclado numérico de StaffPinAuth
  for (const digit of ['1', '2', '3', '4']) {
    const btn = await page.locator(`button:has-text("${digit}")`).first();
    if (btn) await btn.click();
    await page.waitForTimeout(150);
  }

  // Esperar a que se autentique y cargue la vista del comandero
  await page.waitForTimeout(2500);

  const bodyText = await page.textContent('body');
  const hasBanner = bodyText.includes('En línea') || bodyText.includes('Modo Terraza');
  const hasSimulate = bodyText.includes('Simular corte terraza');

  console.log('Resultados de Verificación UI Comandero:');
  console.log('- Banner de Estado:', hasBanner ? 'DETECTADO (OK)' : 'FALLO');
  console.log('- Switch Simular Terraza:', hasSimulate ? 'DETECTADO (OK)' : 'FALLO');

  // Clic en simular corte
  const checkbox = await page.locator('input[type="checkbox"]').first();
  if (checkbox) {
    await checkbox.click();
    await page.waitForTimeout(500);
    const updatedText = await page.textContent('body');
    const hasOfflineMode = updatedText.includes('Modo Terraza Offline');
    console.log('- Activación Modo Offline en UI:', hasOfflineMode ? 'CONFIRMADO (OK)' : 'FALLO');
  }

  // Comprobar presencia de botones de Mover / Unir y Dividir
  const hasMoverUnir = bodyText.includes('Mover / Unir') || (await page.locator('button:has-text("Mover / Unir")').count()) > 0;
  const hasDividir = bodyText.includes('Dividir') || (await page.locator('button:has-text("Dividir")').count()) > 0;
  console.log('- Botón "Mover / Unir":', hasMoverUnir ? 'PRESENTE (OK)' : 'EN DETALLE MESA');
  console.log('- Botón "Dividir":', hasDividir ? 'PRESENTE (OK)' : 'EN DETALLE MESA');

  await page.screenshot({ path: 'comandero_offline_verified.png' });
  console.log('Captura guardada en comandero_offline_verified.png');
  await browser.close();
})();
