// ==============================================================================
// RUNNER DE MIGRACIÓN: SYSTEM_ERROR_LOGS (FLUXO CLOUD PERSISTENCE)
// ==============================================================================
// Aplica o verifica la migración 20260917_system_error_logs.sql en Supabase.
// ==============================================================================

import fs from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

const MIGRATION_PATH = path.resolve('supabase/migrations/20260917_system_error_logs.sql')
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

  console.log('[Migration Probe] Verificando presencia de tabla "system_error_logs"...')
  const { data, error } = await client
    .from('system_error_logs')
    .select('id, timestamp, restaurant_slug, table_number, service_type, error_code, message, stacktrace, metadata')
    .limit(1)

  const hasTable = !error || error.code !== 'PGRST205'

  return {
    hasTable,
    error: error ? `${error.code}: ${error.message}` : null,
  }
}

async function run() {
  console.log('================================================================================')
  console.log('🚀 FLUXO — RUNNER DE MIGRACIÓN SYSTEM_ERROR_LOGS')
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
  const accessToken = env.SUPABASE_ACCESS_TOKEN

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Variables de Supabase no encontradas en .env.local')
    process.exit(1)
  }

  console.log(`✔ Conexión configurada: ${supabaseUrl}`)

  const projectRefMatch = supabaseUrl.match(/https:\/\/([a-z0-9-]+)\.supabase\.co/)
  const projectRef = projectRefMatch ? projectRefMatch[1] : null

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

  const status = await verifyMigrationStatus(supabaseUrl, supabaseAnonKey)
  console.log('\n--- DIAGNÓSTICO DE ESQUEMA EN REMOTO ---')
  console.log(`  - tabla system_error_logs: ${status.hasTable ? '✔ EXISTE' : '✖ NO EXISTE (' + status.error + ')'}`)

  if (status.hasTable) {
    console.log('\n🎉 ¡La base de datos PostgreSQL en Supabase ya tiene la tabla system_error_logs disponible!')
  } else {
    console.log('\n⚠ AVISO OPERATIVO: La migración está lista en el repositorio y puede ejecutarse en el SQL Editor de Supabase.')
    console.log('Para aplicarla en producción:')
    console.log('1. Abre el Dashboard de Supabase: https://supabase.com/dashboard/project/' + (projectRef || ''))
    console.log('2. Ve a "SQL Editor" -> "+ New Query"')
    console.log(`3. Pega y ejecuta el contenido del archivo: supabase/migrations/20260917_system_error_logs.sql`)
  }

  console.log('\n================================================================================')
}

run().catch(err => {
  console.error('Error durante la ejecución del runner:', err)
  process.exit(1)
})
