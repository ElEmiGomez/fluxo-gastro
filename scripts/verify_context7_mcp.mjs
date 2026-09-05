/**
 * FLUXO GASTRONOMIC SYSTEM — VERIFICACIÓN CONTEXT 7 & MCP TOOLING
 * Valida la instalación de @upstash/context7-mcp, configuración de servidores MCP
 * y disponibilidad para Cursor, VS Code y Claude.
 */
import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')

console.log('='.repeat(80))
console.log(' 🧠 FLUXO — VERIFICACIÓN CONTEXT 7 & MCP TOOLING')
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

// 1. Verificar paquete npm @upstash/context7-mcp
console.log('\n▶ PASO 1: Verificación de Dependencias MCP')
const pkgJsonPath = path.join(rootDir, 'package.json')
const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'))
assert(
  pkg.devDependencies && pkg.devDependencies['@upstash/context7-mcp'],
  'Dependencia @upstash/context7-mcp presente en devDependencies de package.json'
)

const context7ModulePath = path.join(rootDir, 'node_modules', '@upstash', 'context7-mcp')
assert(
  fs.existsSync(context7ModulePath),
  'Módulo @upstash/context7-mcp instalado en node_modules/@upstash/context7-mcp'
)

// Ejecución binaria de @upstash/context7-mcp
try {
  const c7Help = execSync('node node_modules/@upstash/context7-mcp/dist/index.js --help', { cwd: rootDir, encoding: 'utf8' })
  assert(c7Help.includes('Usage: index') || c7Help.includes('--transport'), '@upstash/context7-mcp ejecutable y responde a --help')
} catch (e) {
  assert(false, `Error ejecutando @upstash/context7-mcp: ${e.message}`)
}

// 2. Verificar configuraciones MCP
console.log('\n▶ PASO 2: Verificación de Configuraciones MCP')
const mcpJsonPath = path.join(rootDir, 'mcp.json')
assert(fs.existsSync(mcpJsonPath), 'Archivo mcp.json raíz existe')
if (fs.existsSync(mcpJsonPath)) {
  const mcp = JSON.parse(fs.readFileSync(mcpJsonPath, 'utf8'))
  assert(mcp.mcpServers && mcp.mcpServers.context7, 'mcp.json define servidor context7')
  assert(mcp.mcpServers && mcp.mcpServers.supabase, 'mcp.json define servidor supabase')
}

const cursorMcpPath = path.join(rootDir, '.cursor', 'mcp.json')
assert(fs.existsSync(cursorMcpPath), 'Archivo .cursor/mcp.json existe para IDE Cursor')

const vscodeMcpPath = path.join(rootDir, '.vscode', 'mcp.json')
assert(fs.existsSync(vscodeMcpPath), 'Archivo .vscode/mcp.json existe para VS Code')

// 3. Verificar context7.config.json
console.log('\n▶ PASO 3: Verificación de Context 7 Documentation Config')
const c7ConfigPath = path.join(rootDir, 'context7.config.json')
assert(fs.existsSync(c7ConfigPath), 'Archivo context7.config.json existe')
if (fs.existsSync(c7ConfigPath)) {
  const c7 = JSON.parse(fs.readFileSync(c7ConfigPath, 'utf8'))
  assert(c7.project === 'fluxo-gastro', 'context7.config.json apunta al proyecto fluxo-gastro')
  assert(Array.isArray(c7.documentation?.frameworks), 'Frameworks documentados en context7 config')
}

console.log('='.repeat(80))
if (failed === 0) {
  console.log(` 🏆 CONTEXT 7 & MCP TOOLING: ${passed}/${passed} PRUEBAS SUPERADAS (100% PASS)`)
  process.exit(0)
} else {
  console.error(` ❌ FALLOS: ${failed} pruebas no superadas`)
  process.exit(1)
}
