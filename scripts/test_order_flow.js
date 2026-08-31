// ==============================================================================
// TEST SUITE AUTOMATIZADO DE INTEGRIDAD Y EFICIENCIA OPERATIVA (GASTRO PWA)
// ==============================================================================

const { createMockOrder, updateMockOrderStatus, getMockOrders, MOCK_PRODUCTS, MOCK_CATEGORIES } = require('../src/lib/supabase/mock-fallback.ts');

async function runSystemAuditTests() {
  console.log('====================================================');
  console.log('🧪 INICIANDO PRUEBAS AUTOMÁTICAS DE FLUJO Y RENDIMIENTO');
  console.log('====================================================\n');

  const results = {
    totalTests: 0,
    passed: 0,
    failed: 0,
    benchmarks: []
  };

  function assert(condition, testName, durationMs) {
    results.totalTests++;
    if (condition) {
      results.passed++;
      console.log(`  ✓ [PASS] ${testName} (${durationMs.toFixed(2)} ms)`);
    } else {
      results.failed++;
      console.error(`  ✗ [FAIL] ${testName} (${durationMs.toFixed(2)} ms)`);
    }
  }

  // -------------------------------------------------------------
  // TEST 1: Carga y ordenamiento estricto de Categorías
  // -------------------------------------------------------------
  const t1Start = performance.now();
  const categories = MOCK_CATEGORIES['burger-gourmet'];
  const has15Categories = categories.length === 15;
  const isSorted = categories.every((cat, idx) => cat.order_index === idx + 1);
  const t1End = performance.now();
  assert(has15Categories && isSorted, 'Categorías base: 15 categorías cargadas y ordenadas por order_index', t1End - t1Start);

  // -------------------------------------------------------------
  // TEST 2: Creación de Comanda con Modificadores Híbridos (Píldoras + Notas)
  // -------------------------------------------------------------
  const t2Start = performance.now();
  const sampleProduct = MOCK_PRODUCTS['burger-gourmet'][4]; // Milanesa Napolitana
  const orderPayload = {
    restaurant_id: 'a1111111-1111-1111-1111-111111111111',
    table_id: 't1111111-1111-1111-1111-111111111112',
    table_number: 12,
    total_amount: sampleProduct.price * 2,
    items: [
      {
        product_id: sampleProduct.id,
        quantity: 2,
        notes: '[Puré de Papas, Sin Sal] Sacar el tomate y salsa aparte'
      }
    ]
  };

  const createdOrder = createMockOrder('burger-gourmet', orderPayload);
  const t2End = performance.now();
  const orderValid = createdOrder && 
                     createdOrder.order_items.length === 1 && 
                     createdOrder.order_items[0].notes.includes('Puré de Papas') &&
                     createdOrder.order_items[0].notes.includes('Sacar el tomate');
  assert(orderValid, 'Despacho de Comanda: Empaquetado de notas híbridas en order_items.notes', t2End - t2Start);

  // -------------------------------------------------------------
  // TEST 3: Flujo de Estados KDS (pending -> preparing -> ready -> delivered)
  // -------------------------------------------------------------
  const t3Start = performance.now();
  const afterPreparing = updateMockOrderStatus('burger-gourmet', createdOrder.id, 'preparing');
  const prepStatus = afterPreparing.find(o => o.id === createdOrder.id)?.status === 'preparing';

  const afterReady = updateMockOrderStatus('burger-gourmet', createdOrder.id, 'ready');
  const readyStatus = afterReady.find(o => o.id === createdOrder.id)?.status === 'ready';

  const afterDelivered = updateMockOrderStatus('burger-gourmet', createdOrder.id, 'delivered');
  const deliveredStatus = afterDelivered.find(o => o.id === createdOrder.id)?.status === 'delivered';
  const t3End = performance.now();

  assert(prepStatus && readyStatus && deliveredStatus, 'Transición de Estados KDS: Flujo completo verificado', t3End - t3Start);

  // -------------------------------------------------------------
  // TEST 4: Medición de Latencia en Inserción de Comanda
  // -------------------------------------------------------------
  const t4Start = performance.now();
  for (let i = 0; i < 50; i++) {
    createMockOrder('burger-gourmet', {
      restaurant_id: 'a1111111-1111-1111-1111-111111111111',
      table_id: 't1111111-1111-1111-1111-111111111101',
      table_number: 1,
      total_amount: 12500,
      items: [{ product_id: sampleProduct.id, quantity: 1, notes: null }]
    });
  }
  const t4End = performance.now();
  const avgLatency = (t4End - t4Start) / 50;
  assert(avgLatency < 5.0, `Rendimiento de Comandas: Latencia promedio ${avgLatency.toFixed(3)} ms (< 5ms límite)`, t4End - t4Start);

  console.log('\n====================================================');
  console.log(`📊 RESULTADOS: ${results.passed}/${results.totalTests} PRUEBAS COMPLETADAS CON ÉXITO`);
  console.log('====================================================\n');
}

runSystemAuditTests().catch(console.error);
