// ==============================================================================
// RUNNER DE MIGRACIÓN: SSOT POSTGRESQL & TRANSITION_ORDER RPC (FLUXO 1.5)
// ==============================================================================
// Aplica o verifica la migración 20260904_fluxo_v1_5_ssot_transition.sql en Supabase.
// Soporta:
// 1. Supabase Management API (si SUPABASE_ACCESS_TOKEN está presente)
// 2. Verificación y validación de esquema en vivo (orders.version, order_events, transition_order)
// ==============================================================================

import fs from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

const MIGRATION_PATH = path.resolve('supabase/migrations/20260904_fluxo_v1_5_ssot_transition.sql')
const ENV_PATH = path.resolve('.env.local')

function loadEnv() {
  const env = { ...process.env }
  if (fs.existsSync(ENV_PATH)) {
    const raw = fs.readFileSync(ENV_PATH, 'utf-8')
    for (const line of raw.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const idx = trimmed.indexOf('=')
      if (idx > 0) {
        const key = trimmed.slice(0, idx).trim()
        const val = trimmed.slice(idx + 1).trim()
        if (!env[key]) env[key] = val
      }
    }
  }
  return env
}

async function verifyMigrationStatus(supabaseUrl, supabaseKey) {
  const client = createClient(supabaseUrl, supabaseKey)

  console.log('[Migration Probe] Verificando presencia de columna "orders.version"...')
  const { data: colData, error: colError } = await client
    .from('orders')
    .select('id, version, updated_at')
    .limit(1)

  const hasVersionCol = !colError || colError.code !== '42703'

  console.log('[Migration Probe] Verificando presencia de tabla "order_events"...')
  const { error: eventsError } = await client
    .from('order_events')
    .select('id')
    .limit(1)

  const hasOrderEvents = !eventsError || eventsError.code !== 'PGRST205'

  console.log('[Migration Probe] Verificando función RPC "transition_order"...')
  const { error: rpcError } = await client.rpc('transition_order', {
    p_order_id: '00000000-0000-0000-0000-000000000000',
    p_restaurant_id: '00000000-0000-0000-0000-000000000000',
    p_next_status: 'pending',
  })

  const hasRpc = !rpcError || (rpcError.code !== 'PGRST202' && !rpcError.message?.includes('schema cache'))

  return {
    hasVersionCol,
    hasOrderEvents,
    hasRpc,
    colError: colError ? `${colError.code}: ${colError.message}` : null,
    eventsError: eventsError ? `${eventsError.code}: ${eventsError.message}` : null,
    rpcError: rpcError ? `${rpcError.code}: ${rpcError.message}` : null,
  }
}

async function run() {
  console.log('================================================================================')
  console.log('🚀 FLUXO 1.5 — RUNNER DE MIGRACIÓN POSTGRESQL SSOT & TRANSITION_ORDER')
  console.log('================================================================================\n')

  if (!fs.existsSync(MIGRATION_PATH)) {
    console.error(`❌ Archivo de migración no encontrado: ${MIGRATION_PATH}`)
    process.exit(1)
  }

  const sql = fs.readFileSync(MIGRATION_PATH, 'utf-8')
  console.log(`✔ Archivo de migración leído (${sql.length} bytes): ${MIGRATION_PATH}`)

  const env = loadEnv()
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY
  const accessToken = env.SUPABASE_ACCESS_TOKEN

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Variables de Supabase no encontradas en .env.local')
    process.exit(1)
  }

  console.log(`✔ Conexión configurada: ${supabaseUrl}`)

  // Extraer project reference id de la URL
  const projectRefMatch = supabaseUrl.match(/https:\/\/([a-z0-9-]+)\.supabase\.co/)
  const projectRef = projectRefMatch ? projectRefMatch[1] : null

  // Intento de aplicación si se cuenta con SUPABASE_ACCESS_TOKEN
  if (accessToken && projectRef) {
    console.log(`[Migration Runner] Intentando aplicar DDL vía Supabase Management API para el proyecto ${projectRef}...`)
    try {
      const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: sql }),
      })
      if (res.ok) {
        console.log('✔ Migración aplicada exitosamente vía Supabase Management API.')
      } else {
        const text = await res.text()
        console.warn(`⚠ Management API respondió con estado ${res.status}: ${text}`)
      }
    } catch (e) {
      console.warn('⚠ Error comunicando con Supabase Management API:', e.message)
    }
  }

  // Verificar estado del esquema
  const status = await verifyMigrationStatus(supabaseUrl, serviceRoleKey || supabaseAnonKey)
  console.log('\n--- DIAGNÓSTICO DE ESQUEMA EN REMOTO ---')
  console.log(`  - orders.version:       ${status.hasVersionCol ? '✔ EXISTE' : '✖ NO EXISTE (' + status.colError + ')'}`)
  console.log(`  - tabla order_events:   ${status.hasOrderEvents ? '✔ EXISTE' : '✖ NO EXISTE (' + status.eventsError + ')'}`)
  console.log(`  - RPC transition_order: ${status.hasRpc ? '✔ EXISTE' : '✖ NO EXISTE (' + status.rpcError + ')'}`)

  if (status.hasVersionCol && status.hasOrderEvents && status.hasRpc) {
    console.log('\n🎉 ¡La base de datos PostgreSQL en Supabase ya tiene la migración SSOT 1.5 completamente aplicada!')
  } else {
    console.log('\n⚠ AVISO OPERATIVO: La migración aún requiere ser ejecutada en el editor SQL de Supabase.')
    console.log('Para aplicarla en producción:')
    console.log('1. Abre el Dashboard de Supabase: https://supabase.com/dashboard/project/' + (projectRef || ''))
    console.log('2. Ve a "SQL Editor" -> "+ New Query"')
    console.log(`3. Pega y ejecuta el contenido del archivo: supabase/migrations/20260904_fluxo_v1_5_ssot_transition.sql`)
  }

  console.log('\n================================================================================')
}

run().catch(err => {
  console.error('Error durante la ejecución del runner:', err)
  process.exit(1)
})
