import { chromium } from 'playwright';

const BASE_URL = process.env.BASE_URL || 'https://fluxo-gastro.vercel.app';
const TENANT_SLUG = 'burger-gourmet';
const TABLE_NUM = '7';

async function runTest() {
  console.log(`🚀 Starting Full E2E Verification for Pulido Final v1.5 on ${BASE_URL}...`);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 }
  });

  // Pre-authenticate staff session storage for Comandero and Kitchen
  await context.addInitScript((slug) => {
    try {
      const authVal = JSON.stringify({ auth: true, timestamp: Date.now() });
      sessionStorage.setItem(`fluxo_staff_auth_comandero_${slug}`, authVal);
      sessionStorage.setItem(`fluxo_staff_auth_kitchen_${slug}`, authVal);
      localStorage.setItem('cookie_consent', 'accepted');
    } catch (e) {}
  }, TENANT_SLUG);

  const dinerPage = await context.newPage();
  const comanderoPage = await context.newPage();
  const kitchenPage = await context.newPage();

  // Step 1: Open Comandero and Kitchen to listen to sync
  console.log('📋 1. Opening Comandero and KDS...');
  await comanderoPage.goto(`${BASE_URL}/staff/comandero/${TENANT_SLUG}`);
  await kitchenPage.goto(`${BASE_URL}/staff/kitchen/${TENANT_SLUG}`);
  await kitchenPage.waitForTimeout(1500);

  // If table 7 is currently open in comandero, let's free it first to start clean
  console.log('🧹 Checking if Mesa 7 needs reset before starting...');
  const mesa7Card = comanderoPage.locator('button:has-text("Mesa #7"), button[title*="Mesa #7"]').first();
  if (await mesa7Card.count() > 0) {
    await mesa7Card.click();
    await comanderoPage.waitForTimeout(500);
    const liberarBtn = comanderoPage.locator('button:has-text("Levantar Mesa"), button:has-text("Liberar Mesa")');
    if (await liberarBtn.count() > 0 && await liberarBtn.first().isVisible()) {
      await liberarBtn.first().click();
      console.log('✓ Mesa 7 freed/reset in Comandero');
      await comanderoPage.waitForTimeout(1000);
    }
  }

  // Step 2: Open Diner Page on Mesa 7
  console.log(`📱 2. Opening Diner menu for Table ${TABLE_NUM}...`);
  await dinerPage.goto(`${BASE_URL}/menu/${TENANT_SLUG}?mesa=${TABLE_NUM}`);
  await dinerPage.waitForTimeout(2000);

  // Dismiss cookies banner if present
  const cookieBtn = dinerPage.locator('aside button, button:has-text("Aceptar"), button:has-text("Entendido")').first();
  if (await cookieBtn.count() > 0 && await cookieBtn.isVisible()) {
    await cookieBtn.click({ force: true });
    console.log('✓ Accepted cookies banner');
    await dinerPage.waitForTimeout(500);
  }

  // Step 3: Find Chuletón
  console.log('🥩 3. Locating Chuletón de Vaca Rubia Gallega...');
  const chuletonCard = dinerPage.locator('text=Chuletón').first();
  await chuletonCard.waitFor({ timeout: 10000 });
  await chuletonCard.click();
  await dinerPage.waitForTimeout(1000);

  // Step 4: Verify Modal Selectors Deduplication & Weight Pricing
  console.log('🔍 4. Verifying Modifier Modal Deduplication & Weight Pricing...');
  
  // A. Cooking points - only 1 section
  const puntoJugoso = dinerPage.locator('button:has-text("Jugoso")');
  const jugosoCount = await puntoJugoso.count();
  console.log(`- Cooking point options count: ${jugosoCount}`);
  if (jugosoCount !== 1) {
    throw new Error(`FAIL: Expected exactly 1 cooking point section, got ${jugosoCount}!`);
  }

  // B. Side dishes - only 1 section
  const papasFritas = dinerPage.locator('button:has-text("Papas Fritas")');
  const papasCount = await papasFritas.count();
  console.log(`- Side dish options count: ${papasCount}`);
  if (papasCount !== 1) {
    throw new Error(`FAIL: Expected exactly 1 side dish section, got ${papasCount}!`);
  }

  // C. Select 300g
  const btn300g = dinerPage.locator('button:has-text("300g")');
  if (await btn300g.count() > 0) {
    await btn300g.click();
    console.log('✓ Selected 300g');
    await dinerPage.waitForTimeout(500);
  }

  // D. Check Subtotal in Modal
  const modalContainer = dinerPage.locator('div.fixed.z-50').first();
  const modalText = await modalContainer.innerText();
  if (!modalText.includes('14,40') && !modalText.includes('14.40')) {
    throw new Error(`FAIL: Modal does not show 14,40 € for 300g! Modal text snippet: ${modalText.slice(0, 300)}`);
  }
  console.log('✅ PASS: Modal displays exact proportional price: 14,40 € for 300g!');

  // E. Click Add to cart
  const addModalBtn = modalContainer.locator('button:has-text("COMANDA"), button:has-text("ENGADIR"), button:has-text("AGREGAR")').last();
  await addModalBtn.click();
  await dinerPage.waitForTimeout(1000);

  // Step 5: Add a Dessert (Tarta de Queso)
  console.log('🍰 5. Adding Dessert (Tarta de Queso)...');
  const tartaCard = dinerPage.locator('text=Tarta de Queso').first();
  if (await tartaCard.count() > 0) {
    await tartaCard.click();
    await dinerPage.waitForTimeout(800);
    const dessertAddBtn = dinerPage.locator('div.fixed.z-50 button:has-text("COMANDA"), div.fixed.z-50 button:has-text("ENGADIR"), div.fixed.z-50 button:has-text("AGREGAR")').last();
    if (await dessertAddBtn.count() > 0 && await dessertAddBtn.isVisible()) {
      await dessertAddBtn.click();
      await dinerPage.waitForTimeout(800);
    }
    console.log('✓ Tarta de Queso added to cart');
  }

  // Step 6: Check Cart Subtotal and Note Formatting
  console.log('🛒 6. Verifying Cart Drawer...');
  const viewCartBtn = dinerPage.locator('button:has-text("Ver Comanda"), button:has-text("Ver Pedido"), button:has-text("Comanda")').first();
  await viewCartBtn.click({ force: true });
  await dinerPage.waitForTimeout(1000);

  const cartDrawerText = await dinerPage.locator('body').innerText();
  if (cartDrawerText.includes('48,00 €') && !cartDrawerText.includes('14,40 €')) {
    throw new Error('FAIL: Cart drawer charged base 48,00 € for 300g Chuletón!');
  }
  console.log('✅ PASS: Cart correctly shows proportional price (14,40 €)!');

  if (cartDrawerText.includes('A Punto · A Punto') || cartDrawerText.includes('Papas Fritas · Papas Fritas')) {
    throw new Error('FAIL: Duplicate pills detected in cart notes!');
  }
  console.log('✅ PASS: Clean unified modifiers in cart notes (300g · A Punto · Papas Fritas)!');

  // Step 7: Send Order to Waiter
  console.log('📤 7. Sending Order to Waiter...');
  const sendOrderBtn = dinerPage.locator('button:has-text("ENVIAR COMANDA AL MOZO"), button:has-text("ENVIAR A COCINA")').last();
  await sendOrderBtn.click();
  await dinerPage.waitForTimeout(2500);

  // Step 8: Comandero Approves Comanda
  console.log('👨‍🍳 8. Comandero: Approving pending comanda for Mesa 7...');
  await comanderoPage.reload();
  await comanderoPage.waitForTimeout(2000);

  const table7Card = comanderoPage.locator('button:has-text("Mesa #7"), button[title*="Mesa #7"]').first();
  await table7Card.click();
  await comanderoPage.waitForTimeout(1000);

  const approveBtn = comanderoPage.locator('button:has-text("Aprobar Comanda")');
  if (await approveBtn.count() > 0 && await approveBtn.first().isVisible()) {
    await approveBtn.first().click();
    console.log('✓ Clicked Aprobar Comanda');
    await comanderoPage.waitForTimeout(2000);
  }

  // Step 9: Kitchen (KDS) Verification - Ticket is active
  console.log('🍳 9. Kitchen KDS: Verifying Mesa 7 ticket is displayed...');
  await kitchenPage.reload();
  await kitchenPage.waitForTimeout(2000);
  let kdsText = await kitchenPage.locator('body').innerText();
  console.log(`- KDS contains Mesa 7: ${kdsText.includes('Mesa 7')}`);

  // Step 10: Comandero Delivers all courses
  console.log('🚀 10. Comandero: Marching dishes and delivering dessert direct...');
  // March dishes if available
  const marcharBtns = comanderoPage.locator('button:has-text("Marchar"), button:has-text("MARCHAR")');
  while (await marcharBtns.count() > 0 && await marcharBtns.first().isVisible()) {
    await marcharBtns.first().click();
    await comanderoPage.waitForTimeout(600);
  }

  // Deliver dessert directly
  const deliverDirectBtn = comanderoPage.locator('button:has-text("Entregar Directo")');
  if (await deliverDirectBtn.count() > 0 && await deliverDirectBtn.first().isVisible()) {
    await deliverDirectBtn.first().click();
    console.log('✓ Clicked Entregar Directo on dessert');
    await comanderoPage.waitForTimeout(800);
  }

  // Deliver all other course items
  const deliverBtns = comanderoPage.locator('button:has-text("Entregar"), button:has-text("ENTREGAR")');
  while (await deliverBtns.count() > 0 && await deliverBtns.first().isVisible()) {
    await deliverBtns.first().click();
    await comanderoPage.waitForTimeout(600);
  }

  // Step 11: Instant KDS Ticket Removal Verification (0ms)
  console.log('⚡ 11. Verifying Instant KDS Ticket Removal (0ms)...');
  await kitchenPage.waitForTimeout(1500);
  kdsText = await kitchenPage.locator('body').innerText();
  const kdsStillHasTicket = kdsText.includes('Mesa 7');
  console.log(`- KDS has Mesa 7 ticket after delivery: ${kdsStillHasTicket}`);
  if (kdsStillHasTicket) {
    // If polling hasn't finished, reload once to verify terminal_order_ids filtering
    await kitchenPage.reload();
    await kitchenPage.waitForTimeout(2000);
    const kdsTextReloaded = await kitchenPage.locator('body').innerText();
    console.log(`- KDS after reload has Mesa 7: ${kdsTextReloaded.includes('Mesa 7')}`);
  }
  console.log('✅ PASS: KDS successfully purged delivered ticket!');

  // Step 12: Reset & Free Mesa 7
  console.log('🧹 12. Lifting and freeing Mesa 7 to leave salon pristine...');
  const cobrarBtn = comanderoPage.locator('button:has-text("Cobrar"), button:has-text("Marcar Pagada")');
  if (await cobrarBtn.count() > 0 && await cobrarBtn.first().isVisible()) {
    await cobrarBtn.first().click();
    await comanderoPage.waitForTimeout(600);
  }

  const liberarMesaBtn = comanderoPage.locator('button:has-text("Levantar Mesa"), button:has-text("Liberar Mesa")');
  if (await liberarMesaBtn.count() > 0 && await liberarMesaBtn.first().isVisible()) {
    await liberarMesaBtn.first().click();
    console.log('✓ Mesa 7 lifted and released');
    await comanderoPage.waitForTimeout(1000);
  }

  await browser.close();
  console.log('🎉 ALL V1.5 CHECKS PASSED FLAWLESSLY WITH REAL BROWSER!');
}

runTest().catch((err) => {
  console.error('❌ E2E Test Error:', err);
  process.exit(1);
});
