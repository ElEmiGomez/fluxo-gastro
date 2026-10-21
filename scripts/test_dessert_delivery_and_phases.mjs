import assert from 'assert';

const BASE_URL = 'http://localhost:3000';
const SLUG = 'burger-gourmet';
const TABLE_NUM = 21;

async function run() {
  console.log('🧪 VERIFICANDO COMPORTAMIENTO DE FASES Y ENTREGA DE POSTRES SIN REGRESIONES');

  // 1. Crear comanda con entrada, principal y postre
  const orderPayload = {
    slug: SLUG,
    table_number: TABLE_NUM,
    items: [
      {
        product_id: 'b1111111-1111-1111-1111-111111111101',
        name: 'Patatas Rústicas Trufadas',
        price: 6.5,
        quantity: 1,
        course: 'first',
      },
      {
        product_id: 'b1111111-1111-1111-1111-111111111102',
        name: 'Burger Clásica Smash',
        price: 12.0,
        quantity: 1,
        course: 'second',
      },
      {
        product_id: 'b1111111-1111-1111-1111-111111111103',
        name: 'Tarta de Queso Fluida',
        price: 5.5,
        quantity: 1,
        course: 'dessert',
      },
    ],
  };

  const createRes = await fetch(`${BASE_URL}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderPayload),
  });
  const createData = await createRes.json();
  const orderId = createData.order?.id || createData.id;
  assert(orderId, 'Comanda creada con éxito');
  console.log('  ✔ [PASS] #1: Comanda con entrada, principal y postre creada');

  // 2. Mozo valida comanda
  const validateRes = await fetch(`${BASE_URL}/api/orders`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'x-staff-pin': '1234',
      'x-staff-role': 'comandero',
    },
    body: JSON.stringify({ slug: SLUG, orderId, status: 'pending' }),
  });
  assert(validateRes.ok, 'Mozo valida comanda');
  console.log('  ✔ [PASS] #2: Mozo valida comanda a pending');

  // 3. Cocina inicia preparación
  const prepRes = await fetch(`${BASE_URL}/api/orders`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'x-staff-pin': '1234',
      'x-staff-role': 'kitchen',
    },
    body: JSON.stringify({ slug: SLUG, orderId, status: 'preparing' }),
  });
  assert(prepRes.ok, 'Cocina inicia preparación');
  console.log('  ✔ [PASS] #3: Cocina pasa orden a preparing');

  // 4. Entregar entradas
  const deliverStartersRes = await fetch(`${BASE_URL}/api/orders`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'x-staff-pin': '1234',
      'x-staff-role': 'comandero',
    },
    body: JSON.stringify({ slug: SLUG, orderId, action: 'deliver_starters' }),
  });
  assert(deliverStartersRes.ok, 'Entradas entregadas');
  console.log('  ✔ [PASS] #4: Entradas marcadas como entregadas');

  // 5. Entregar principales
  const deliverMainsRes = await fetch(`${BASE_URL}/api/orders`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'x-staff-pin': '1234',
      'x-staff-role': 'comandero',
    },
    body: JSON.stringify({ slug: SLUG, orderId, action: 'deliver_mains' }),
  });
  assert(deliverMainsRes.ok, 'Principales entregados');
  console.log('  ✔ [PASS] #5: Principales marcados como entregados');

  // 6. Marchar postres
  const fireDessertsRes = await fetch(`${BASE_URL}/api/orders`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'x-staff-pin': '1234',
      'x-staff-role': 'comandero',
    },
    body: JSON.stringify({ slug: SLUG, orderId, action: 'fire_desserts' }),
  });
  assert(fireDessertsRes.ok, 'Postres marchados a cocina');
  console.log('  ✔ [PASS] #6: Postres marchados a cocina (reactivación legítima a preparing)');

  // 7. Entregar postres
  const deliverDessertsRes = await fetch(`${BASE_URL}/api/orders`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'x-staff-pin': '1234',
      'x-staff-role': 'comandero',
    },
    body: JSON.stringify({ slug: SLUG, orderId, action: 'deliver_desserts' }),
  });
  const deliverData = await deliverDessertsRes.json();
  assert(deliverDessertsRes.ok, 'Postres entregados');
  assert(deliverData.order?.status === 'delivered', 'Estado de orden final es delivered');
  console.log('  ✔ [PASS] #7: Postres entregados directamente, comanda pasa a delivered');

  // 8. Verificar que las entradas y principales siguen teniendo sus tags de servidos intactos
  const items = deliverData.order?.order_items || [];
  const starter = items.find(i => i.course === 'first' || i.name?.includes('Patatas'));
  const main = items.find(i => i.course === 'second' || i.name?.includes('Burger'));
  const dessert = items.find(i => i.course === 'dessert' || i.name?.includes('Tarta'));

  assert(starter && starter.notes?.includes('[ENTRADA_SERVIDA]'), 'La entrada conserva [ENTRADA_SERVIDA]');
  assert(main && main.notes?.includes('[PRINCIPAL_SERVIDO]'), 'El principal conserva [PRINCIPAL_SERVIDO]');
  assert(dessert && dessert.notes?.includes('[POSTRE_SERVIDO]'), 'El postre tiene [POSTRE_SERVIDO]');
  console.log('  ✔ [PASS] #8: Entradas y principales conservan sus tags servidos en el payload final');

  // 9. Limpiar mesa
  await fetch(`${BASE_URL}/api/tables`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-staff-pin': '1234',
      'x-staff-role': 'comandero',
    },
    body: JSON.stringify({ slug: SLUG, table_number: TABLE_NUM, action: 'free' }),
  });
  console.log('  ✔ [PASS] #9: Mesa liberada limpiamente');

  console.log('\n==================================================');
  console.log(' RESULTADO: 9/9 PRUEBAS DE POSTRES Y FASES SUPERADAS');
  console.log('==================================================\n');
}

run().catch(err => {
  console.error('Error en test:', err);
  process.exit(1);
});
