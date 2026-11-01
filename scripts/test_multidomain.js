const playwright = require('playwright');

(async () => {
  const browser = await playwright.chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });
  const page = await context.newPage();

  console.log('1. Probando Web Home Multi-dominio: http://localhost:3000/?domain=casamardavila.es ...');
  const resHome = await page.goto('http://localhost:3000/?domain=casamardavila.es', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(2000);

  const homeTitle = await page.title();
  const homeText = await page.textContent('body');
  const homeHeaders = resHome ? resHome.headers() : {};
  const tenantHeader = homeHeaders['x-fluxo-tenant'];

  console.log('Resultado Web Home:');
  console.log('- URL visible en barra:', page.url());
  console.log('- Header x-fluxo-tenant:', tenantHeader);
  console.log('- Contenido Casa Mar Da Vila:', homeText.includes('Mar da Vila') || homeText.includes('Casa Mar') ? 'DETECTADO (OK)' : 'FALLO');

  await page.screenshot({ path: 'multidomain_home_verified.png' });

  console.log('\n2. Probando Carta QR Multi-dominio: http://localhost:3000/carta?domain=casamardavila.es ...');
  const resCarta = await page.goto('http://localhost:3000/carta?domain=casamardavila.es', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(2000);

  const cartaText = await page.textContent('body');
  const cartaHeaders = resCarta ? resCarta.headers() : {};

  console.log('Resultado Carta QR:');
  console.log('- URL visible en barra:', page.url());
  console.log('- Header x-fluxo-tenant:', cartaHeaders['x-fluxo-tenant']);
  console.log('- Carta Interactiva / Categorías:', cartaText.includes('Carta') || cartaText.includes('Categoría') || cartaText.includes('Entrantes') || cartaText.includes('Mar') ? 'DETECTADO (OK)' : 'FALLO');

  await page.screenshot({ path: 'multidomain_carta_verified.png' });

  await browser.close();
  console.log('\nVerificación Multi-dominio completada.');
})();
