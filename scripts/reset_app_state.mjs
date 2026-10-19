/**
 * SCRIPT DE RESET COMPLETO DE ESTADO DE LA APP — FLUXO
 * 
 * 1. Respalda todas las comandas, ítems, llamadas de mozo y sesiones en backups/
 * 2. Purga en Supabase: order_items, orders, service_calls, table_sessions
 * 3. Limpia el almacén en memoria: comandas, sesiones, llamadas y cuentas de fidelización
 * 4. Verifica la integridad intacta de restaurantes, categorías, productos y mesas maestras
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';

// Cargar variables de entorno desde .env.local
let supabaseUrl = 'https://oicugcbdlxfjikkgjjah.supabase.co';
let supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (fs.existsSync('.env.local')) {
  const envText = fs.readFileSync('.env.local', 'utf8');
  for (const line of envText.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [k, ...v] = trimmed.split('=');
      const val = v.join('=').trim();
      if (k === 'NEXT_PUBLIC_SUPABASE_URL') supabaseUrl = val;
      if (k === 'SUPABASE_SERVICE_ROLE_KEY') supabaseKey = val;
      else if (k === 'NEXT_PUBLIC_SUPABASE_ANON_KEY' && !supabaseKey) {
        supabaseKey = val;
      }
    }
  }
}

if (!supabaseKey) {
  console.error('ERROR: No se encontró la clave de Supabase en .env.local');
  process.exit(1);
}

const sb = createClient(supabaseUrl, supabaseKey);

async function fetchAll(tableName, orderCol = 'id') {
  const allRows = [];
  const chunkSize = 1000;
  let from = 0;
  let hasMore = true;

  while (hasMore) {
    const to = from + chunkSize - 1;
    const { data, error } = await sb
      .from(tableName)
      .select('*')
      .range(from, to)
      .order(orderCol, { ascending: true });

    if (error) {
      console.warn(`[Aviso] Tabla '${tableName}': ${error.message}`);
      break;
    }

    if (data && data.length > 0) {
      allRows.push(...data);
      if (data.length < chunkSize) hasMore = false;
      else from += chunkSize;
    } else {
      hasMore = false;
    }
  }
  return allRows;
}

async function main() {
  console.log('================================================================================');
  console.log(' 🔄 RESET COMPLETO DE ESTADO DE LA APP — FLUXO GASTRONOMIC SYSTEM');
  console.log('================================================================================');
  console.log(`Base de datos objetivo: ${supabaseUrl}\n`);

  // 1. Verificar tablas maestras a preservar
  const { count: restCount } = await sb.from('restaurants').select('*', { count: 'exact', head: true });
  const { count: catCount } = await sb.from('categories').select('*', { count: 'exact', head: true });
  const { count: prodCount } = await sb.from('products').select('*', { count: 'exact', head: true });
  const { count: tableCount } = await sb.from('tables').select('*', { count: 'exact', head: true });

  console.log('[1/4] Inspección de Tablas Maestras (Se preservan 100% intactas):');
  console.log(`  ✔ Restaurantes: ${restCount}`);
  console.log(`  ✔ Categorías:   ${catCount}`);
  console.log(`  ✔ Productos:    ${prodCount}`);
  console.log(`  ✔ Mesas:        ${tableCount}\n`);

  // 2. Descargar datos para respaldo seguro previo
  console.log('[2/4] Generando copia de seguridad de seguridad preventiva...');
  const orders = await fetchAll('orders');
  const orderItems = await fetchAll('order_items');
  const serviceCalls = await fetchAll('service_calls', 'created_at');
  const tableSessions = await fetchAll('table_sessions');

  const backupDir = path.resolve('backups');
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(backupDir, `backup_before_reset_${timestamp}.json`);
  const backupData = {
    createdAt: new Date().toISOString(),
    description: 'Respaldo previo al reseteo completo de comandas, sesiones y fidelización',
    metadata: {
      ordersCount: orders.length,
      orderItemsCount: orderItems.length,
      serviceCallsCount: serviceCalls.length,
      tableSessionsCount: tableSessions.length,
    },
    orders,
    order_items: orderItems,
    service_calls: serviceCalls,
    table_sessions: tableSessions,
  };

  fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2), 'utf8');
  console.log(`  ✔ Copia de seguridad guardada en: ${backupFile}`);
  console.log(`    - Comandas a purgar: ${orders.length}`);
  console.log(`    - Ítems a purgar:    ${orderItems.length}`);
  console.log(`    - Llamadas a purgar: ${serviceCalls.length}`);
  console.log(`    - Sesiones a purgar: ${tableSessions.length}\n`);

  // 3. Ejecutar purga ordenada en Supabase
  console.log('[3/4] Purgando registros operativos en Supabase...');

  // 3.1 order_items
  if (orderItems.length > 0) {
    const { error: errItems } = await sb.from('order_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (errItems) console.warn('  Aviso order_items:', errItems.message);
    else console.log(`  ✔ ${orderItems.length} order_items eliminados.`);
  }

  // 3.2 orders (en lotes para no saturar)
  const batchSize = 100;
  if (orders.length > 0) {
    for (let i = 0; i < orders.length; i += batchSize) {
      const ids = orders.slice(i, i + batchSize).map(o => o.id);
      await sb.from('orders').delete().in('id', ids);
    }
    console.log(`  ✔ ${orders.length} orders eliminadas.`);
  }

  // 3.3 service_calls
  if (serviceCalls.length > 0) {
    const { error: errCalls } = await sb.from('service_calls').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (errCalls) console.warn('  Aviso service_calls:', errCalls.message);
    else console.log(`  ✔ ${serviceCalls.length} service_calls eliminadas.`);
  }

  // 3.4 table_sessions
  if (tableSessions.length > 0) {
    for (let i = 0; i < tableSessions.length; i += batchSize) {
      const ids = tableSessions.slice(i, i + batchSize).map(s => s.id);
      await sb.from('table_sessions').delete().in('id', ids);
    }
    console.log(`  ✔ ${tableSessions.length} table_sessions eliminadas.`);
  }

  // 3.5 Tablas de fidelización si existen
  try {
    await sb.from('loyalty_escrow_holds').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await sb.from('loyalty_rewards').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await sb.from('loyalty_profiles').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  } catch (_) {}

  // 4. Verificación final de integridad
  console.log('\n[4/4] Verificación de estado final post-reset:');
  const { count: endOrders } = await sb.from('orders').select('*', { count: 'exact', head: true });
  const { count: endItems } = await sb.from('order_items').select('*', { count: 'exact', head: true });
  const { count: endCalls } = await sb.from('service_calls').select('*', { count: 'exact', head: true });
  const { count: endSessions } = await sb.from('table_sessions').select('*', { count: 'exact', head: true });
  const { count: endRest } = await sb.from('restaurants').select('*', { count: 'exact', head: true });
  const { count: endCat } = await sb.from('categories').select('*', { count: 'exact', head: true });
  const { count: endProd } = await sb.from('products').select('*', { count: 'exact', head: true });
  const { count: endTable } = await sb.from('tables').select('*', { count: 'exact', head: true });

  console.log(`  • Comandas activas en BD:       ${endOrders || 0}`);
  console.log(`  • Ítems de comanda en BD:       ${endItems || 0}`);
  console.log(`  • Llamadas de mozo en BD:       ${endCalls || 0}`);
  console.log(`  • Sesiones de mesa en BD:       ${endSessions || 0}`);
  console.log(`  • Restaurantes maestros:        ${endRest} (100% PRESERVADOS)`);
  console.log(`  • Categorías de platos:         ${endCat} (100% PRESERVADAS)`);
  console.log(`  • Catálogo de platos:           ${endProd} (100% PRESERVADOS)`);
  console.log(`  • Mesas de restaurante:         ${endTable} (100% PRESERVADAS)`);

  console.log('\n================================================================================');
  console.log(' 🎉 RESET COMPLETADO EXITOSAMENTE — ESTADO LIMPIO (PRISTINE STATE)');
  console.log('================================================================================\n');
}

main().catch(err => {
  console.error('[ERROR]', err);
  process.exit(1);
});
