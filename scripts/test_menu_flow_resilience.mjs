// Native fetch in Node.js 18+

const BASE_URL = 'http://localhost:3000';
const SLUG = 'burger-gourmet';
const TABLE_NUM = 7;

async function runTests() {
  console.log('🧪 INICIANDO TEST DE FLUJO DE MESA, AVISOS Y LIBERACIÓN');
  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`  ✔ [PASS] #${total}: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] #${total}: ${message}`);
      process.exitCode = 1;
    }
  }

  try {
    // 1. Probar llamada al mozo (microservicio 'mozo' / 'waiter')
    console.log('\n▶ PRUEBA 1: Solicitud de atención al mozo y formato limpio');
    const callRes = await fetch(`${BASE_URL}/api/service-calls`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug: SLUG,
        table_number: TABLE_NUM,
        call_type: 'waiter_attention',
      }),
    });
    const callData = await callRes.json();
    assert(callRes.ok && callData.success, 'Registra service_call con tipo waiter_attention correctamente');
    assert(callData.call.call_type === 'waiter_attention', 'call_type es exactamente waiter_attention');

    // 2. Comprobar que en comandero el aviso se formatea como "Llamada al mozo"
    const callsFetch = await fetch(`${BASE_URL}/api/service-calls?slug=${SLUG}`);
    const callsList = await callsFetch.json();
    const myCall = (callsList.calls || []).find(c => c.id === callData.call.id);
    assert(Boolean(myCall), 'La llamada está presente en la lista de avisos pendientes');

    // 3. Crear una orden para la mesa 7
    console.log('\n▶ PRUEBA 2: Ciclo de comanda, entrega y cobro de mesa');
    const orderRes = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug: SLUG,
        table_number: TABLE_NUM,
        items: [
          { product_id: 'p0000000-0000-0000-0000-000000000001', quantity: 2, name: 'Burger Clásica' },
          { product_id: 'p0000000-0000-0000-0000-000000000004', quantity: 1, name: 'Tarta de Queso' },
        ],
      }),
    });
    const orderData = await orderRes.json();
    assert(orderRes.ok && (orderData.order || orderData.id), 'Crea orden de prueba para la mesa');
    const orderId = orderData.order?.id || orderData.id;

    // 4. Marchar orden a 'delivered'
    const deliverRes = await fetch(`${BASE_URL}/api/orders`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-staff-pin': '1234',
        'x-staff-role': 'comandero',
      },
      body: JSON.stringify({
        slug: SLUG,
        orderId,
        status: 'delivered',
        table_number: TABLE_NUM,
      }),
    });
    const deliverData = await deliverRes.json();
    assert(deliverRes.ok && (deliverData.success || deliverData.order?.status === 'delivered'), 'Actualiza orden a delivered');

    // 5. Atender aviso de cuenta / simular cobro de la llamada de servicio
    console.log('\n▶ PRUEBA 3: Atender aviso de cuenta marca órdenes como paid');
    const billCallRes = await fetch(`${BASE_URL}/api/service-calls`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug: SLUG,
        table_number: TABLE_NUM,
        call_type: 'bill_card',
      }),
    });
    const billCallData = await billCallRes.json();
    assert(billCallRes.ok && billCallData.success, 'Registra aviso de cuenta');

    // Atender llamada de cuenta
    const attendRes = await fetch(`${BASE_URL}/api/service-calls`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-staff-pin': '1234',
      },
      body: JSON.stringify({
        slug: SLUG,
        callId: billCallData.call.id,
      }),
    });
    assert(attendRes.ok, 'Atiende llamada de cuenta');

    // 6. Verificar que las órdenes de la mesa ahora tienen status 'paid'
    const ordersFetch = await fetch(`${BASE_URL}/api/orders?slug=${SLUG}&table_number=${TABLE_NUM}`);
    const ordersListData = await ordersFetch.json();
    const myOrder = (ordersListData.orders || []).find(o => o.id === orderId);
    assert(myOrder && myOrder.status === 'paid', 'La comanda de la mesa se marcó como paid tras atender la cuenta');

    // 7. Liberar la mesa (action: 'free')
    console.log('\n▶ PRUEBA 4: Liberación de mesa y revocación limpia de sesión');
    const freeRes = await fetch(`${BASE_URL}/api/tables`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-staff-pin': '1234',
        'x-staff-role': 'comandero',
      },
      body: JSON.stringify({
        slug: SLUG,
        table_number: TABLE_NUM,
        action: 'free',
      }),
    });
    const freeData = await freeRes.json();
    assert(freeRes.ok && freeData.success, 'Endpoint /api/tables action:free responde exitoso');

    // 8. Verificar que las sesiones de mesa reportan status 'free'
    const tablesFetch = await fetch(`${BASE_URL}/api/tables?slug=${SLUG}`);
    const tablesData = await tablesFetch.json();
    const tableSession = tablesData.sessions?.[TABLE_NUM];
    assert(tableSession && tableSession.status === 'free', 'La sesión de la mesa ahora figura como status: free');

  } catch (err) {
    console.error('Error durante la ejecución del test:', err);
    process.exitCode = 1;
  }

  console.log(`\n==================================================`);
  console.log(` RESULTADO: ${passed}/${total} PRUEBAS SUPERADAS`);
  console.log(`==================================================\n`);
}

runTests();
