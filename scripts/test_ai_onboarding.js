const playwright = require('playwright');

(async () => {
  const browser = await playwright.chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });
  const page = await context.newPage();

  console.log('1. Navegando al CRM Fundador...');
  await page.goto('http://localhost:3000/admin/crm', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(1000);

  // Pin de Fundador: 4154928
  for (const digit of ['4', '1', '5', '4', '9', '2', '8']) {
    const btn = await page.locator(`button:has-text("${digit}")`).first();
    if (btn) await btn.click();
    await page.waitForTimeout(100);
  }

  await page.waitForTimeout(2500);

  const bodyText = await page.textContent('body');
  const hasAiBtn = bodyText.includes('Nuevo Local por Foto IA') || bodyText.includes('Foto IA');
  console.log('- Botón ✨ Nuevo Local por Foto IA (30s):', hasAiBtn ? 'DETECTADO (OK)' : 'FALLO');

  // Clic en el botón para abrir el modal
  const aiBtn = await page.locator('button:has-text("Nuevo Local por Foto IA"), button:has-text("Foto IA")').first();
  if (aiBtn) {
    await aiBtn.click();
    await page.waitForTimeout(800);

    const modalText = await page.textContent('body');
    const modalOpened = modalText.includes('Onboarding Llave en Mano • Visión IA');
    console.log('- Modal Onboarding IA Abierto:', modalOpened ? 'OK' : 'FALLO');

    // Clic en "Probar con Foto de Carta de Muestra (1 clic)"
    const sampleBtn = await page.locator('button:has-text("Probar con Foto de Carta de Muestra")').first();
    if (sampleBtn) {
      await sampleBtn.click();
      await page.waitForTimeout(500);
      console.log('- Clic en muestra de carta: OK');
    }

    // Clic en "Analizar Carta con Visión IA"
    const scanBtn = await page.locator('button:has-text("Analizar Carta con Visión IA")').first();
    if (scanBtn) {
      await scanBtn.click();
      console.log('- Iniciando análisis multimodal con IA...');
      await page.waitForTimeout(2500); // Esperar simulación/análisis

      const reviewText = await page.textContent('body');
      const hasCategories = reviewText.includes('Entrantes & Raciones') || reviewText.includes('Mariscos');
      const hasLonja = reviewText.includes('Lonja');
      console.log('- Extracción de platos y categorías:', hasCategories ? 'ÉXITO (OK)' : 'FALLO');
      console.log('- Detección de etiqueta 🌊 Lonja:', hasLonja ? 'DETECTADO (OK)' : 'FALLO');

      // Clic en "Crear Local y Generar Carta QR"
      const createBtn = await page.locator('button:has-text("Crear Local y Generar Carta QR")').first();
      if (createBtn) {
        await createBtn.click();
        await page.waitForTimeout(1000);

        const successText = await page.textContent('body');
        const isSuccess = successText.includes('Local Aprovisionado con Éxito') || successText.includes('/p/taberna-o-marinheiro');
        console.log('- Aprovisionamiento instantáneo:', isSuccess ? 'CONFIRMADO (OK)' : 'FALLO');
      }
    }

    await page.screenshot({ path: 'crm_ai_onboarding_verified.png' });
  }

  // 2. Verificar que la nueva carta pública /p/taberna-o-marinheiro carga inmediatamente
  console.log('\n2. Verificando renderizado inmediato en /p/taberna-o-marinheiro ...');
  await page.goto('http://localhost:3000/p/taberna-o-marinheiro', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(1500);

  const publicText = await page.textContent('body');
  const hasPublicDish = publicText.includes('Pimientos') || publicText.includes('Pulpo') || publicText.includes('Taberna');
  console.log('- Carta Pública /p/taberna-o-marinheiro renderizada:', hasPublicDish ? 'ÉXITO (OK)' : 'FALLO');

  await page.screenshot({ path: 'public_menu_ai_verified.png' });

  await browser.close();
  console.log('\nVerificación completa de Onboarding IA finalizada.');
})();
