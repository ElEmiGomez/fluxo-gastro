/**
 * FLUXO GASTRONOMIC SYSTEM — VERIFICACIÓN SUPABASE CLI
 * Valida la instalación de supabase CLI en package.json y node_modules,
 * la presencia de supabase/config.toml, y la integridad de las migraciones SQL.
 */
import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')

console.log('='.repeat(80))
console.log(' ⚡ FLUXO — VERIFICACIÓN SUPABASE CLI & MIGRACIONES')
console.log('='.repeat(80))

let passed = 0
let failed = 0

function assert(condition, message) {
  if (condition) {
    console.log(`  ✔ [PASS] ${message}`)
    passed++
  } else {
    console.error(`  ✖ [FAIL] ${message}`)
    failed++
  }
}

// 1. Verificar supabase en devDependencies y node_modules
console.log('\n▶ PASO 1: Verificación de Supabase CLI Tooling')
const pkgJsonPath = path.join(rootDir, 'package.json')
const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'))
assert(
  pkg.devDependencies && pkg.devDependencies.supabase,
  'Herramienta supabase presente en devDependencies de package.json'
)

// Ejecución binaria de supabase --version y supabase --help (multiplataforma)
const npxCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx'
let cliVersion = ''
try {
  cliVersion = execSync(`${npxCmd} supabase --version`, { cwd: rootDir, encoding: 'utf8' }).trim()
  assert(cliVersion.length > 0, `Supabase CLI ejecutable (versión: ${cliVersion})`)
} catch (e) {
  assert(false, `Error ejecutando Supabase CLI: ${e.message}`)
}

try {
  const helpOut = execSync(`${npxCmd} supabase --help`, { cwd: rootDir, encoding: 'utf8' })
  assert(helpOut.includes('Supabase CLI'), 'Comando de ayuda supabase --help responde correctamente')
} catch (e) {
  assert(false, `Error ejecutando supabase --help: ${e.message}`)
}

// 2. Verificar archivo de configuración supabase/config.toml
console.log('\n▶ PASO 2: Verificación de Configuración de Proyecto')
const configPath = path.join(rootDir, 'supabase', 'config.toml')
assert(fs.existsSync(configPath), 'Archivo supabase/config.toml generado correctamente')
if (fs.existsSync(configPath)) {
  const content = fs.readFileSync(configPath, 'utf8')
  assert(content.includes('[api]') && content.includes('[db]'), 'config.toml contiene secciones [api] y [db]')
}

// 3. Verificar integridad de esquemas y migraciones
console.log('\n▶ PASO 3: Verificación de Migraciones y Esquemas SQL')
const schemaPath = path.join(rootDir, 'supabase', 'schema.sql')
assert(fs.existsSync(schemaPath), 'Esquema base supabase/schema.sql presente')

const migrationsDir = path.join(rootDir, 'supabase', 'migrations')
assert(fs.existsSync(migrationsDir), 'Directorio supabase/migrations presente')

if (fs.existsSync(migrationsDir)) {
  const migrations = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql'))
  assert(migrations.length >= 3, `Encontradas ${migrations.length} migraciones históricas`)
  migrations.forEach(mig => {
    const migContent = fs.readFileSync(path.join(migrationsDir, mig), 'utf8')
    assert(migContent.length > 100, `Migración [${mig}] válida y no vacía (${migContent.length} bytes)`)
  })
}

console.log('='.repeat(80))
if (failed === 0) {
  console.log(` 🏆 SUPABASE CLI & ESQUEMA: ${passed}/${passed} PRUEBAS SUPERADAS (100% PASS)`)
  process.exit(0)
} else {
  console.error(` ❌ FALLOS: ${failed} pruebas no superadas`)
  process.exit(1)
}
