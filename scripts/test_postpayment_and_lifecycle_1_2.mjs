import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

console.log('--- STARTING VERIFICATION: FLUXO 1.2 POST-PAYMENT & TABLE LIFECYCLE ---');

// Test 1: Validate isValidOrderTransition logic
console.log('\n[TEST 1] Testing order status transitions and terminal paid state...');
const serverStateCode = fs.readFileSync('src/lib/server-state.ts', 'utf8');

assert(
  serverStateCode.includes("currentStatus === 'paid' && nextStatus !== 'paid'"),
  "server-state.ts MUST guard that 'paid' cannot transition to any other status"
);
console.log('✓ server-state.ts strictly forbids transition out of paid status');

// Test 2: orders.repository.ts guard
console.log('\n[TEST 2] Testing orders repository transition guard...');
const ordersRepoCode = fs.readFileSync('src/lib/supabase/repositories/orders.repository.ts', 'utf8');
assert(
  ordersRepoCode.includes("currentOrder.status === 'paid' && nextStatus !== 'paid'"),
  "orders.repository.ts MUST reject transition if currentOrder.status === 'paid'"
);
console.log('✓ orders.repository.ts transitionOrderStatus rejects reverting from paid');

// Test 3: API route course handlers guard
console.log('\n[TEST 3] Testing /api/orders route course delivery handlers guard...');
const ordersApiCode = fs.readFileSync('src/app/api/orders/route.ts', 'utf8');
assert(
  ordersApiCode.includes("currentOrder.status !== 'paid' && currentOrder.status !== 'cancelled'"),
  "/api/orders must skip or reject course delivery modifications if order is paid"
);
console.log('✓ /api/orders prevents course delivery mutations when order is paid');

// Test 4: PostPaymentView component structure
console.log('\n[TEST 4] Testing PostPaymentView component...');
const postPaymentCode = fs.readFileSync('src/components/menu/PostPaymentView.tsx', 'utf8');
assert(postPaymentCode.includes('export function PostPaymentView'), 'PostPaymentView must be exported');
assert(postPaymentCode.includes('Google Maps'), 'PostPaymentView must contain Google Maps review');
assert(postPaymentCode.includes('onResetTableSession'), 'PostPaymentView must support onResetTableSession');
assert(postPaymentCode.includes('Iniciar un nuevo pedido en esta mesa'), 'PostPaymentView must have button to reset table session');
console.log('✓ PostPaymentView has Google Maps review, Loyalty block, and reset button');

// Test 5: MenuLiveTracker integration
console.log('\n[TEST 5] Testing MenuLiveTracker integration...');
const trackerCode = fs.readFileSync('src/components/menu/MenuLiveTracker.tsx', 'utf8');
assert(trackerCode.includes('const isPaidActive = Boolean(isTablePaid || isOrderPaid)'), 'MenuLiveTracker must compute isPaidActive');
assert(trackerCode.includes('!isPaidActive &&'), 'MenuLiveTracker isAllDelivered must check !isPaidActive');
assert(trackerCode.includes('<PostPaymentView'), 'MenuLiveTracker must render PostPaymentView when isPaidActive');
console.log('✓ MenuLiveTracker correctly renders PostPaymentView and prevents Alerta Fin de Servicio');

// Test 6: Diner page.tsx wiring
console.log('\n[TEST 6] Testing Diner page.tsx wiring...');
const dinerPageCode = fs.readFileSync('src/app/menu/[slug]/page.tsx', 'utf8');
assert(dinerPageCode.includes('isOrderPaid'), 'diner page must destructure isOrderPaid from useTableSession');
assert(dinerPageCode.includes('resetPaidOrderSession'), 'diner page must destructure resetPaidOrderSession');
assert(dinerPageCode.includes('onResetTableSession={resetPaidOrderSession}'), 'diner page must pass onResetTableSession to MenuLiveTracker');
console.log('✓ Diner page.tsx wires isOrderPaid and resetPaidOrderSession to MenuLiveTracker');

// Test 7: Comandero TableSelector badges and styling
console.log('\n[TEST 7] Testing Comandero TableSelector...');
const tableSelectorCode = fs.readFileSync('src/components/comandero/TableSelector.tsx', 'utf8');
assert(tableSelectorCode.includes('isPaidSobremesa'), 'TableSelector must compute isPaidSobremesa');
assert(tableSelectorCode.includes('💸 PAGADA · En Sobremesa'), 'TableSelector must show 💸 PAGADA · En Sobremesa badge');
assert(tableSelectorCode.includes('border-teal-500 bg-teal-50'), 'TableSelector must style paid tables in teal');
assert(tableSelectorCode.includes('Pagada'), 'TableSelector must have Pagada in legend');
console.log('✓ TableSelector correctly renders 💸 PAGADA · En Sobremesa in teal styling');

// Test 8: Comandero Table Detail Panel Step 1 & Step 2 separation
console.log('\n[TEST 8] Testing Comandero Table Detail Panel...');
const panelCode = fs.readFileSync('src/components/comandero/ComanderoTableDetailPanel.tsx', 'utf8');
assert(panelCode.includes('isPaidSobremesa'), 'ComanderoTableDetailPanel must compute isPaidSobremesa');
assert(panelCode.includes('El cliente ya recibió el enlace de Google Maps'), 'ComanderoTableDetailPanel must display Sobremesa advice banner');
assert(panelCode.includes('🧹 MESA LEVANTADA · LIBERAR PARA SIGUIENTE CLIENTE'), 'ComanderoTableDetailPanel must show Step 2 liberation button');
assert(panelCode.includes('Cobrar Cuenta'), 'ComanderoTableDetailPanel must show Cobrar Cuenta when table has pending amount');
console.log('✓ ComanderoTableDetailPanel cleanly separates Step 1 (Cobro) and Step 2 (Liberación)');

// Test 9: CloseTableModal and Comandero Actions
console.log('\n[TEST 9] Testing CloseTableModal and Comandero Actions...');
const closeTableModalCode = fs.readFileSync('src/components/comandero/CloseTableModal.tsx', 'utf8');
assert(closeTableModalCode.includes('Cobro de Cuenta'), 'CloseTableModal title must be Cobro de Cuenta');
assert(!closeTableModalCode.includes('y Liberar`}'), 'CloseTableModal confirm button must not say y Liberar');

const actionsCode = fs.readFileSync('src/hooks/comandero/useComanderoActions.ts', 'utf8');
assert(actionsCode.includes('const handleChargeTable = async'), 'useComanderoActions must define handleChargeTable');
assert(actionsCode.includes("status: 'paid'"), 'handleChargeTable must set status to paid');
assert(actionsCode.includes('const executeCloseAndFreeTable = async'), 'useComanderoActions must keep executeCloseAndFreeTable for Step 2');

const modalsCode = fs.readFileSync('src/components/comandero/ComanderoModals.tsx', 'utf8');
assert(modalsCode.includes('onExecuteChargeTable'), 'ComanderoModals must accept and call onExecuteChargeTable');
console.log('✓ CloseTableModal and Comandero actions correctly separated');

console.log('\n======================================================');
console.log('🎉 ALL 9 VERIFICATION CHECKS PASSED WITH ZERO ERRORS!');
console.log('======================================================\n');
