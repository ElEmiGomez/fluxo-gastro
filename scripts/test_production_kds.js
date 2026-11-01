const playwright = require('playwright');

(async () => {
  const browser = await playwright.chromium.launch({ headless: true });
  const page = await browser.newPage();
  const url = 'https://fluxo-gastro.vercel.app/staff/kitchen/burger-gourmet';
  console.log('Navegando a KDS en producción:', url);
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(1000);

  // Pin cocina 5678
  for (const digit of ['5', '6', '7', '8']) {
    const btn = await page.locator(`button:has-text("${digit}")`).first();
    if (btn) await btn.click();
    await page.waitForTimeout(150);
  }
  await page.waitForTimeout(3000);

  const text = await page.textContent('body');
  console.log('KDS Producción contiene ESPACIO / PEDAL:', text.includes('ESPACIO / PEDAL'));
  console.log('KDS Producción contiene Push-to-Talk:', text.includes('Voz PTT') || text.includes('Push-to-Talk'));
  console.log('KDS Producción contiene Simular Comanda Mixta:', text.includes('Simular Comanda Mixta'));

  await page.screenshot({ path: 'kds_production_verified.png' });
  await browser.close();
})();
