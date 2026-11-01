const playwright = require('playwright');

(async () => {
  const browser = await playwright.chromium.launch({ headless: true });
  const page = await browser.newPage();
  const url = 'https://fluxo-gastro.vercel.app/staff/comandero/burger-gourmet';
  console.log('Navegando a Comandero en producción:', url);
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(1000);

  // Pin comandero 1234
  for (const digit of ['1', '2', '3', '4']) {
    const btn = await page.locator(`button:has-text("${digit}")`).first();
    if (btn) await btn.click();
    await page.waitForTimeout(150);
  }
  await page.waitForTimeout(3000);

  const text = await page.textContent('body');
  console.log('Comandero Producción contiene En línea:', text.includes('En línea'));
  console.log('Comandero Producción contiene Simular corte terraza:', text.includes('Simular corte terraza'));

  await page.screenshot({ path: 'comandero_production_verified.png' });
  await browser.close();
})();
