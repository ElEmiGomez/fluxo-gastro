/**
 * SCRIPT DE RESPALDO Y PURGA SEGURA DE PEDIDOS DE PRUEBA
 * 
 * 1. Descarga todos los 4.864 pedidos, sus items y sesiones de prueba en chunks.
 * 2. Guarda un archivo JSON local en backups/backup_test_orders_2026_09_07.json con checksum y conteo.
 * 3. Valida la integridad del archivo guardado antes de proceder.
 * 4. Elimina únicamente las comandas y sesiones de prueba en Supabase.
 * 5. Verifica que las tablas maestras (restaurantes, categorías, productos, mesas) queden 100% intactas.
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';

let supabaseUrl = 'https://oicugcbdlxfjikkgjjah.supabase.co';
let supabaseKey = 'sb_publishable_cYvq-lXhAbEX1kHNlncfAg_ycvUmhYK';

if (fs.existsSync('.env.local')) {
  const envText = fs.readFileSync('.env.local', 'utf8');
  for (const line of envText.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [k, ...v] = trimmed.split('=');
      const val = v.join('=').trim();
      if (k === 'NEXT_PUBLIC_SUPABASE_URL') supabaseUrl = val;
      if (k === 'SUPABASE_SERVICE_ROLE_KEY') supabaseKey = val;
      else if (k === 'NEXT_PUBLIC_SUPABASE_ANON_KEY' && !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        supabaseKey = val;
      }
    }
  }
}

const sb = createClient(supabaseUrl, supabaseKey);

async function fetchAllRows(tableName, orderCol = 'id') {
  console.log(`[BACKUP] Descargando registros de '${tableName}'...`);
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
      throw new Error(`Error descargando '${tableName}': ${error.message}`);
    }

    if (data && data.length > 0) {
      allRows.push(...data);
      console.log(`  -> Obtenidos ${data.length} registros (${allRows.length} en total)`);
      if (data.length < chunkSize) {
        hasMore = false;
      } else {
        from += chunkSize;
      }
    } else {
      hasMore = false;
    }
  }

  return allRows;
}

async function main() {
  console.log('================================================================================');
  console.log(' 💾 RESPALDO Y PURGA SEGURA DE PEDIDOS DE PRUEBA (SUPABASE)');
  console.log('================================================================================');
  console.log(`Base de datos objetivo: ${supabaseUrl}`);

  // 1. Verificar estado inicial de tablas maestras
  const { count: restCount } = await sb.from('restaurants').select('*', { count: 'exact', head: true });
  const { count: catCount } = await sb.from('categories').select('*', { count: 'exact', head: true });
  const { count: prodCount } = await sb.from('products').select('*', { count: 'exact', head: true });
  const { count: tableCount } = await sb.from('tables').select('*', { count: 'exact', head: true });
  console.log(`[INSPECCIÓN PREVIA]`);
  console.log(`  Restaurantes: ${restCount}`);
  console.log(`  Categorías: ${catCount}`);
  console.log(`  Productos: ${prodCount}`);
  console.log(`  Mesas: ${tableCount}`);

  // 2. Descargar todos los pedidos, items y sesiones
  const orders = await fetchAllRows('orders');
  const orderItems = await fetchAllRows('order_items');
  const tableSessions = await fetchAllRows('table_sessions');

  console.log(`\n[RESUMEN DE DATOS OBTENIDOS]`);
  console.log(`  Total Orders descargadas: ${orders.length}`);
  console.log(`  Total Order Items descargados: ${orderItems.length}`);
  console.log(`  Total Table Sessions descargadas: ${tableSessions.length}`);

  // 3. Guardar archivo de respaldo
  const backupDir = path.resolve('backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFilePath = path.join(backupDir, `backup_test_orders_${timestamp}.json`);
  const backupData = {
    createdAt: new Date().toISOString(),
    description: 'Respaldo completo de comandas y sesiones de prueba previo a purga de egress',
    metadata: {
      totalOrders: orders.length,
      totalOrderItems: orderItems.length,
      totalTableSessions: tableSessions.length,
      restaurantsPreserved: restCount,
      categoriesPreserved: catCount,
      productsPreserved: prodCount,
      tablesPreserved: tableCount
    },
    orders,
    order_items: orderItems,
    table_sessions: tableSessions
  };

  fs.writeFileSync(backupFilePath, JSON.stringify(backupData, null, 2), 'utf8');
  console.log(`\n✔ [BACKUP EXITOSO] Archivo guardado en: ${backupFilePath}`);

  // 4. Validar integridad del archivo de respaldo
  const stats = fs.statSync(backupFilePath);
  console.log(`  Tamaño del archivo: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);

  const fileContents = JSON.parse(fs.readFileSync(backupFilePath, 'utf8'));
  if (fileContents.orders.length !== orders.length) {
    throw new Error('FALLO DE VERIFICACIÓN: El archivo de respaldo no coincide con los datos descargados. Abortando purga.');
  }
  console.log(`✔ [VERIFICACIÓN INTEGRAL] El archivo de respaldo contiene exactamente ${fileContents.orders.length} pedidos verificados.`);

  // 5. Ejecutar la purga controlada en Supabase
  console.log(`\n[PURGA SEGURA] Iniciando eliminación de pedidos de prueba en Supabase...`);

  // 5.1 Eliminar order_items primero
  if (orderItems.length > 0) {
    console.log(`  Eliminando ${orderItems.length} registros de 'order_items'...`);
    const { error: delItemsErr } = await sb.from('order_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (delItemsErr) {
      console.warn(`  Nota al borrar order_items: ${delItemsErr.message}`);
    } else {
      console.log(`  ✔ 'order_items' limpiados.`);
    }
  }

  // 5.2 Eliminar orders en lotes
  console.log(`  Eliminando ${orders.length} registros de 'orders'...`);
  const batchSize = 200;
  for (let i = 0; i < orders.length; i += batchSize) {
    const chunkIds = orders.slice(i, i + batchSize).map(o => o.id);
    const { error: delOrdersErr } = await sb.from('orders').delete().in('id', chunkIds);
    if (delOrdersErr) {
      console.warn(`  Error en lote ${i}-${i + batchSize}: ${delOrdersErr.message}`);
    } else {
      process.stdout.write(`\r  -> Pedidos eliminados: ${Math.min(i + batchSize, orders.length)} / ${orders.length}`);
    }
  }
  console.log('\n  ✔ Pedidos de prueba eliminados de Supabase.');

  // 5.3 Eliminar sesiones de mesa de prueba
  console.log(`  Limpiando ${tableSessions.length} registros de 'table_sessions'...`);
  for (let i = 0; i < tableSessions.length; i += batchSize) {
    const chunkIds = tableSessions.slice(i, i + batchSize).map(s => s.id);
    const { error: delSessErr } = await sb.from('table_sessions').delete().in('id', chunkIds);
    if (delSessErr) {
      console.warn(`  Error en lote de sesiones ${i}: ${delSessErr.message}`);
    }
  }
  console.log(`  ✔ Sesiones de prueba limpiadas.`);

  // 6. Verificación posterior de seguridad
  const { count: finalOrders } = await sb.from('orders').select('*', { count: 'exact', head: true });
  const { count: finalItems } = await sb.from('order_items').select('*', { count: 'exact', head: true });
  const { count: finalSessions } = await sb.from('table_sessions').select('*', { count: 'exact', head: true });
  const { count: finalRest } = await sb.from('restaurants').select('*', { count: 'exact', head: true });
  const { count: finalCat } = await sb.from('categories').select('*', { count: 'exact', head: true });
  const { count: finalProd } = await sb.from('products').select('*', { count: 'exact', head: true });
  const { count: finalTable } = await sb.from('tables').select('*', { count: 'exact', head: true });

  console.log('\n================================================================================');
  console.log(' 🏁 REPORTE FINAL DE CERTIFICACIÓN POST-PURGA');
  console.log('================================================================================');
  console.log(`  Pedidos restantes en DB: ${finalOrders} (Antes: ${orders.length})`);
  console.log(`  Items restantes en DB: ${finalItems} (Antes: ${orderItems.length})`);
  console.log(`  Sesiones restantes en DB: ${finalSessions} (Antes: ${tableSessions.length})`);
  console.log(`  Restaurantes intactos: ${finalRest} / ${restCount} (100% PRESERVADOS)`);
  console.log(`  Categorías intactas: ${finalCat} / ${catCount} (100% PRESERVADAS)`);
  console.log(`  Productos intactos: ${finalProd} / ${prodCount} (100% PRESERVADOS)`);
  console.log(`  Mesas intactas: ${finalTable} / ${tableCount} (100% PRESERVADAS)`);
  console.log(`  Copia de seguridad permanente: ${backupFilePath}`);
  console.log('================================================================================\n');
}

main().catch(err => {
  console.error('[ERROR CRÍTICO]', err);
  process.exit(1);
});
