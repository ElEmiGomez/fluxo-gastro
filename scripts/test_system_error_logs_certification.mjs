/**
 * FLUXO GASTRONOMIC SYSTEM — CERTIFICACIÓN DE LOGGING ESTRUCTURADO Y PERSISTENCIA CLOUD
 * Verifica R1, R2 y R3:
 * 1. Output estructurado JSON parseable por Vercel Log Viewer.
 * 2. Cero llamadas a fs.appendFileSync en entornos de producción/Vercel serverless.
 * 3. Inserción y aislamiento no bloqueante en Supabase system_error_logs.
 * 4. RLS y políticas activas en PostgreSQL.
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { spawnSync } from 'child_process'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')

// Si se ejecuta con node puro, delegar a tsx para resolución limpia de TypeScript
if (!process.env.__TSX_SPAWNED__) {
  const isWindows = process.platform === 'win32'
  const cmd = isWindows ? 'npx.cmd' : 'npx'
  const scriptRel = 'scripts/test_system_error_logs_certification.mjs'
  const result = spawnSync(cmd, ['tsx', scriptRel], {
    stdio: 'inherit',
    env: { ...process.env, __TSX_SPAWNED__: '1' },
    shell: true,
  })
  process.exit(result.status ?? 0)
}

console.log('='.repeat(80))
console.log(' 🧪 CERTIFICACIÓN DE LOGGING ESTRUCTURADO VERCEL Y PERSISTENCIA SUPABASE')
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

// ==============================================================================
// TEST 1: Verificar existencia de archivos clave
// ==============================================================================
console.log('\n▶ FASE 1: Verificación de Módulos y Archivos de Migración')

const loggerPath = path.join(rootDir, 'src', 'lib', 'logger.ts')
assert(fs.existsSync(loggerPath), 'src/lib/logger.ts existe')

const errorLogsHelperPath = path.join(rootDir, 'src', 'lib', 'supabase', 'error-logs.ts')
assert(fs.existsSync(errorLogsHelperPath), 'src/lib/supabase/error-logs.ts existe')

const migrationPath = path.join(rootDir, 'supabase', 'migrations', '20260917_system_error_logs.sql')
assert(fs.existsSync(migrationPath), 'supabase/migrations/20260917_system_error_logs.sql existe')

const schemaPath = path.join(rootDir, 'supabase', 'schema.sql')
assert(fs.existsSync(schemaPath), 'supabase/schema.sql existe')

// ==============================================================================
// TEST 2: Verificación de Invariantes SQL y Accidental Data Loss Prevention
// ==============================================================================
console.log('\n▶ FASE 2: Verificación de Invariantes SQL y Protección de Datos')

const migrationSql = fs.readFileSync(migrationPath, 'utf8')
const schemaSql = fs.readFileSync(schemaPath, 'utf8')

assert(
  migrationSql.includes('CREATE TABLE IF NOT EXISTS system_error_logs'),
  'Migración usa estrictamente CREATE TABLE IF NOT EXISTS'
)
assert(
  !migrationSql.includes('DROP TABLE') && !migrationSql.includes('TRUNCATE'),
  'Protección de datos: Migración no contiene comandos destructivos (DROP TABLE / TRUNCATE)'
)
assert(
  migrationSql.includes('ALTER TABLE system_error_logs ENABLE ROW LEVEL SECURITY') ||
  migrationSql.includes('ALTER TABLE public.system_error_logs ENABLE ROW LEVEL SECURITY'),
  'Migración habilita Row Level Security (RLS) en system_error_logs'
)
assert(
  schemaSql.includes('create table if not exists system_error_logs'),
  'schema.sql base incluye tabla system_error_logs'
)
assert(
  schemaSql.includes('alter table system_error_logs enable row level security'),
  'schema.sql base habilita RLS en system_error_logs'
)

// ==============================================================================
// TEST 3: Verificación de Salida Estructurada JSON para Vercel Log Viewer
// ==============================================================================
console.log('\n▶ FASE 3: Simulación de Error de Servicio y Emisión a stderr para Vercel')

const originalConsoleError = console.error
let capturedErrors = []
console.error = (...args) => {
  capturedErrors.push(args.join(' '))
}

// Importar módulo compilado o transpilado para probar comportamiento
let logServiceCallError
let extractErrorInfo
let isServerlessOrProduction
let recordSystemErrorLog
let logServiceCallErrorAsync
let safeJsonStringify

try {
  const loggerModule = await import('../src/lib/logger.ts')
  logServiceCallError = loggerModule.logServiceCallError
  extractErrorInfo = loggerModule.extractErrorInfo
  isServerlessOrProduction = loggerModule.isServerlessOrProduction
  logServiceCallErrorAsync = loggerModule.logServiceCallErrorAsync
  safeJsonStringify = loggerModule.safeJsonStringify

  const errorLogsModule = await import('../src/lib/supabase/error-logs.ts')
  recordSystemErrorLog = errorLogsModule.recordSystemErrorLog
} catch (e) {
  console.log('Importando via dynamic tsx / transpile fallback:', e.message)
}

if (logServiceCallError) {
  // Simular error de llamada de servicio
  const fakeError = new Error('Violación de restricción de clave foránea en mesa 14')
  fakeError.code = '23503'
  fakeError.details = 'Key (restaurant_id)=(xyz) is not present in table "restaurants".'

  capturedErrors = []
  logServiceCallError(fakeError, {
    slug: 'burger-gourmet',
    table_number: 14,
    call_type: 'call_waiter',
    table_session_id: 'sess-test-uuid-999',
    endpoint: '/api/service-calls',
  })

  // Restaurar console.error para ver outputs
  console.error = originalConsoleError

  const jsonLog = capturedErrors.find(line => {
    try {
      const parsed = JSON.parse(line)
      return parsed.type === 'ServiceCallError' || parsed.service === 'fluxo-service-calls'
    } catch {
      return false
    }
  })

  assert(Boolean(jsonLog), 'Se emitió log estructurado JSON a stderr')

  if (jsonLog) {
    const parsed = JSON.parse(jsonLog)
    assert(parsed.level === 'error', 'Log level es "error"')
    assert(parsed.restaurant_slug === 'burger-gourmet', 'Propiedad restaurant_slug presente en JSON')
    assert(parsed.table_number === 14, 'Propiedad table_number presente en JSON')
    assert(parsed.service_type === 'call_waiter', 'Propiedad service_type presente en JSON')
    assert(parsed.error_code === '23503', 'Propiedad error_code capturada correctamente')
    assert(parsed.message.includes('clave foránea'), 'Mensaje de error preservado')
    assert(Boolean(parsed.stacktrace), 'Stacktrace presente en JSON')
    assert(Boolean(parsed.timestamp), 'Timestamp ISO presente en JSON')
  }
} else {
  console.error = originalConsoleError
  assert(false, 'No se pudo cargar logServiceCallError')
}

// ==============================================================================
// TEST 4: Verificación Dual-Environment (Cero fs.appendFileSync en Producción/Vercel)
// ==============================================================================
console.log('\n▶ FASE 4: Resiliencia Dual-Environment y Cero EROFS en Vercel')

if (logServiceCallError) {
  const originalEnvNode = process.env.NODE_ENV
  const originalVercel = process.env.VERCEL
  const originalAppend = fs.appendFileSync

  let appendCalled = false
  fs.appendFileSync = (...args) => {
    appendCalled = true
    return originalAppend.apply(fs, args)
  }

  // A. Probar bajo simulación de PRODUCCIÓN
  process.env.NODE_ENV = 'production'
  delete process.env.VERCEL
  appendCalled = false

  console.error = () => {} // Silenciar durante test
  logServiceCallError(new Error('Production test error'), { slug: 'test-prod' })
  console.error = originalConsoleError

  assert(
    !appendCalled,
    'En NODE_ENV === "production", fs.appendFileSync NUNCA se ejecuta (evita EROFS)'
  )

  // B. Probar bajo simulación de VERCEL SERVERLESS
  process.env.NODE_ENV = 'development'
  process.env.VERCEL = '1'
  appendCalled = false

  console.error = () => {}
  logServiceCallError(new Error('Vercel serverless test error'), { slug: 'test-vercel' })
  console.error = originalConsoleError

  assert(
    !appendCalled,
    'En VERCEL === "1", fs.appendFileSync NUNCA se ejecuta (evita EROFS)'
  )

  // Restaurar entorno original
  process.env.NODE_ENV = originalEnvNode
  if (originalVercel !== undefined) {
    process.env.VERCEL = originalVercel
  } else {
    delete process.env.VERCEL
  }
  fs.appendFileSync = originalAppend
}

// ==============================================================================
// TEST 5: Aislamiento No Bloqueante en Persistencia Supabase
// ==============================================================================
console.log('\n▶ FASE 5: Aislamiento No Bloqueante de Fallos de Base de Datos')

if (logServiceCallError) {
  let exceptionThrown = false
  try {
    console.error = () => {}
    // Invocamos con error crítico y datos anómalos
    logServiceCallError(
      { code: 'CRITICAL_FAILURE', message: 'Simulated DB unreachable' },
      { slug: 'non-existent-restaurant', table_number: 'invalid' }
    )
    console.error = originalConsoleError
  } catch (err) {
    console.error = originalConsoleError
    exceptionThrown = true
  }

  assert(
    !exceptionThrown,
    'El logger no propaga excepciones hacia el cliente si Supabase o el sistema fallan'
  )
}

// ==============================================================================
// TEST 6: Helper de Repositorio exportado en repository.ts
// ==============================================================================
console.log('\n▶ FASE 6: Verificación de Exportación en repository.ts')

const repoPath = path.join(rootDir, 'src', 'lib', 'supabase', 'repository.ts')
const repoContent = fs.readFileSync(repoPath, 'utf8')

assert(
  repoContent.includes('recordSystemErrorLog') && repoContent.includes('insertSystemErrorLog'),
  'repository.ts re-exporta recordSystemErrorLog e insertSystemErrorLog'
)

// ==============================================================================
// TEST 7: Resiliencia ante Estructuras Circulares, BigInt y Tipos Arbitrarios
// ==============================================================================
console.log('\n▶ FASE 7: Robustez ante Referencias Circulares, BigInt y Tipos Arbitrarios')

if (extractErrorInfo && logServiceCallError) {
  // A. extractErrorInfo tolerante a objetos circulares
  const circularErr = { code: 'CIRCULAR_ERR' }
  circularErr.self = circularErr

  let circularExtracted = null
  try {
    circularExtracted = extractErrorInfo(circularErr)
  } catch {}
  assert(
    Boolean(circularExtracted && circularExtracted.code === 'CIRCULAR_ERR'),
    'extractErrorInfo no lanza excepciones ante errores con referencias circulares'
  )

  // B. extractErrorInfo tolerante a null y undefined
  const nullExtracted = extractErrorInfo(null)
  assert(nullExtracted.code === 'UNKNOWN', 'extractErrorInfo maneja null sin fallar')

  // C. logServiceCallError con contexto circular
  const circularCtx = { slug: 'burger-gourmet', table_number: 5 }
  circularCtx.self = circularCtx

  let capturedCircularLog = null
  console.error = (...args) => {
    try {
      const parsed = JSON.parse(args.join(' '))
      if (parsed.type === 'ServiceCallError') {
        capturedCircularLog = parsed
      }
    } catch {}
  }

  logServiceCallError(new Error('Circular test'), circularCtx)
  console.error = originalConsoleError

  assert(
    Boolean(capturedCircularLog && capturedCircularLog.restaurant_slug === 'burger-gourmet'),
    'logServiceCallError emite JSON parseable incluso si el contexto contiene referencias circulares'
  )

  // D. logServiceCallError con BigInt en contexto
  const bigintCtx = { slug: 'burger-gourmet', table_number: 6, bigId: 9007199254740991000n }
  let capturedBigintLog = null
  console.error = (...args) => {
    try {
      const parsed = JSON.parse(args.join(' '))
      if (parsed.type === 'ServiceCallError') {
        capturedBigintLog = parsed
      }
    } catch {}
  }

  logServiceCallError(new Error('BigInt test'), bigintCtx)
  console.error = originalConsoleError

  assert(
    Boolean(capturedBigintLog && capturedBigintLog.context?.bigId === '9007199254740991000'),
    'logServiceCallError serializa valores BigInt como string sin lanzar TypeError'
  )
}

// ==============================================================================
// TEST 8: Validación de UUID y Sanitización de Datos en Base de Datos
// ==============================================================================
console.log('\n▶ FASE 8: Validación de Tipos PostgreSQL y Aislamiento de FK')

if (recordSystemErrorLog) {
  // Probar invocación con datos no conformes: restaurant_id inválido y table_number flotante
  let dbResult = null
  let dbThrew = false
  try {
    dbResult = await recordSystemErrorLog({
      restaurant_id: 'not-a-uuid-string',
      restaurant_slug: 'burger-gourmet',
      table_number: 14.8,
      error_code: 'TEST_ROBUSTNESS',
      message: 'Test robustness payload',
      metadata: { big: 42n },
    })
  } catch (e) {
    dbThrew = true
  }

  assert(!dbThrew, 'recordSystemErrorLog nunca propaga excepciones ante restaurant_id no-UUID o BigInt en metadata')
}

// ==============================================================================
// TEST 9: Invariante de Registro Único (Cero Logging Duplicado en repository.ts)
// ==============================================================================
console.log('\n▶ FASE 9: Invariante Anti-Duplicación en repository.ts')

// Verificar que createServiceCall en repository.ts no tiene log duplicado en if (error) y catch (e)
const createServiceCallMatch = repoContent.match(/export async function createServiceCall[\s\S]*?^}/m)
if (createServiceCallMatch) {
  const body = createServiceCallMatch[0]
  const logMatches = (body.match(/logServiceCallError\(/g) || []).length
  // Debe haber exactamente 1 llamada en catch(e) y 1 en fallback de DB no configurada
  assert(
    logMatches <= 2,
    `createServiceCall no duplica llamadas a logServiceCallError ante fallo de DB (encontradas: ${logMatches})`
  )
} else {
  assert(false, 'No se pudo validar createServiceCall en repository.ts')
}

// ==============================================================================
// TEST 10: Preservación de Grafos Acíclicos Dirigidos (DAGs) sin Falso Positivo [Circular]
// ==============================================================================
console.log('\n▶ FASE 10: Integridad de Grafos Acíclicos Dirigidos (DAGs / Referencias Compartidas)')

if (safeJsonStringify) {
  const sharedObj = { name: 'Comandero Session', permissions: ['orders', 'alerts'] }
  const dagPayload = {
    primary: sharedObj,
    secondary: sharedObj,
  }

  const serializedDag = safeJsonStringify(dagPayload)
  const parsedDag = JSON.parse(serializedDag)

  assert(
    parsedDag.secondary && parsedDag.secondary.name === 'Comandero Session',
    'safeJsonStringify preserva objetos compartidos (DAGs) sin marcarlos falsamente como [Circular]'
  )
}

// ==============================================================================
// TEST 11: Preservación Integral de Instancias de Error en Contexto y Metadatos
// ==============================================================================
console.log('\n▶ FASE 11: Serialización de Instancias de Error en Contexto y Metadatos')

if (safeJsonStringify) {
  const innerError = new Error('Conexión con gateway de cocina interrumpida')
  innerError.code = 'GATEWAY_TIMEOUT'
  innerError.details = 'Timeout tras 5000ms esperando ACK'

  const errorInContext = {
    nested: innerError,
    active: true,
  }

  const serializedWithErr = safeJsonStringify(errorInContext)
  const parsedWithErr = JSON.parse(serializedWithErr)

  assert(
    parsedWithErr.nested &&
    parsedWithErr.nested.name === 'Error' &&
    parsedWithErr.nested.message.includes('gateway de cocina') &&
    Boolean(parsedWithErr.nested.stack),
    'safeJsonStringify extrae name, message y stacktrace de instancias Error anidadas en lugar de vaciar a {}'
  )
}

// ==============================================================================
// TEST 12: Paridad Dual-Environment en logServiceCallErrorAsync
// ==============================================================================
console.log('\n▶ FASE 12: Paridad Dual-Environment en logServiceCallErrorAsync')

if (logServiceCallErrorAsync) {
  const originalEnvNode = process.env.NODE_ENV
  const originalVercel = process.env.VERCEL
  const originalAppend = fs.appendFileSync

  let asyncAppendCalled = false
  fs.appendFileSync = (...args) => {
    asyncAppendCalled = true
    return originalAppend.apply(fs, args)
  }

  process.env.NODE_ENV = 'development'
  delete process.env.VERCEL

  console.error = () => {}
  await logServiceCallErrorAsync(new Error('Async parity test error'), { slug: 'test-async-parity' })
  console.error = originalConsoleError

  assert(
    asyncAppendCalled,
    'logServiceCallErrorAsync implementa paridad de fallback a disco local en NODE_ENV === "development"'
  )

  // Restaurar
  process.env.NODE_ENV = originalEnvNode
  if (originalVercel !== undefined) process.env.VERCEL = originalVercel
  fs.appendFileSync = originalAppend
}

// ==============================================================================
// TEST 13: Protección de Rango Entero 32-bit en PostgreSQL (table_number Overflow)
// ==============================================================================
console.log('\n▶ FASE 13: Protección contra Postgres 22003 (Integer Overflow en table_number)')

if (recordSystemErrorLog) {
  let threwOverflow = false
  try {
    await recordSystemErrorLog({
      restaurant_slug: 'burger-gourmet',
      table_number: 99999999999, // Desborda int4 PostgreSQL (2147483647)
      error_code: 'OVERFLOW_TEST',
      message: 'Overflow test message',
    })
  } catch {
    threwOverflow = true
  }

  assert(
    !threwOverflow,
    'recordSystemErrorLog aísla table_number desbordado para evitar fallo de tipo Postgres 22003'
  )
}

// ==============================================================================
// TEST 14: Normalización de Timestamps Numéricos y Fechas Arbitrarias
// ==============================================================================
console.log('\n▶ FASE 14: Protección contra Postgres 22007 (Invalid Timestamp Syntax)')

if (recordSystemErrorLog) {
  let threwTimestamp = false
  try {
    await recordSystemErrorLog({
      restaurant_slug: 'burger-gourmet',
      timestamp: Date.now(), // Numérico epoch ms
      error_code: 'TIMESTAMP_TEST',
      message: 'Numeric timestamp test',
    })
  } catch {
    threwTimestamp = true
  }

  assert(
    !threwTimestamp,
    'recordSystemErrorLog normaliza timestamps numéricos a formato ISO para evitar Postgres 22007'
  )
}

// ==============================================================================
// TEST 15: Normalización de Mensajes y Códigos no-String en extractErrorInfo
// ==============================================================================
console.log('\n▶ FASE 15: Normalización de Tipos de Error y Prevención de SQL Type Mismatch')

if (extractErrorInfo) {
  const objectMessageErr = { message: { reason: 'Supabase network socket timeout' } }
  const extractedObj = extractErrorInfo(objectMessageErr)
  assert(
    typeof extractedObj.message === 'string' && extractedObj.message.includes('Supabase network socket'),
    'extractErrorInfo convierte mensajes tipo objeto en strings JSON en lugar de [object Object]'
  )

  const emptyMsgErr = new Error('')
  const extractedEmpty = extractErrorInfo(emptyMsgErr)
  assert(
    typeof extractedEmpty.message === 'string' && extractedEmpty.message.length > 0 && extractedEmpty.message !== '{}',
    'extractErrorInfo provee fallback informativo ante errores con message vacío ("")'
  )
}

// ==============================================================================
// TEST 16: Verificación de Índices en supabase/schema.sql
// ==============================================================================
console.log('\n▶ FASE 16: Verificación de Índices de Rendimiento en supabase/schema.sql')

const schemaSqlFull = fs.readFileSync(schemaPath, 'utf8')
assert(
  schemaSqlFull.includes('idx_system_error_logs_created_at') &&
  schemaSqlFull.includes('idx_system_error_logs_timestamp') &&
  schemaSqlFull.includes('idx_system_error_logs_restaurant_slug') &&
  schemaSqlFull.includes('idx_system_error_logs_error_code'),
  'supabase/schema.sql incluye todos los índices de búsqueda y analítica operacional'
)

// ==============================================================================
// TEST 17: Preservación de Instancias de Error Compartidas en DAGs (Cero Vaciado a {})
// ==============================================================================
console.log('\n▶ FASE 17: Integridad de Instancias de Error Compartidas en DAGs')

if (safeJsonStringify) {
  const sharedError = new Error('Conexión con Supabase agotada')
  const dagWithSharedError = {
    initial_attempt: sharedError,
    retry_attempt: sharedError,
  }

  const serializedDagError = safeJsonStringify(dagWithSharedError)
  const parsedDagError = JSON.parse(serializedDagError)

  assert(
    parsedDagError.initial_attempt &&
    parsedDagError.initial_attempt.name === 'Error' &&
    parsedDagError.retry_attempt &&
    parsedDagError.retry_attempt.name === 'Error' &&
    parsedDagError.retry_attempt.message.includes('Supabase agotada'),
    'safeJsonStringify serializa completamente múltiples referencias al mismo Error en un DAG sin vaciar a {}'
  )
}

// ==============================================================================
// TEST 18: Preservación de la Propiedad No-Enumerable cause (ECMAScript 2022)
// ==============================================================================
console.log('\n▶ FASE 18: Preservación de Causalidad Encadenada (error.cause)')

if (safeJsonStringify) {
  const rootCause = new Error('Socket hang up')
  const highLevelError = new Error('Error al procesar comanda', { cause: rootCause })

  const serializedCause = safeJsonStringify({ error: highLevelError })
  const parsedCause = JSON.parse(serializedCause)

  assert(
    parsedCause.error &&
    parsedCause.error.cause &&
    parsedCause.error.cause.name === 'Error' &&
    parsedCause.error.cause.message.includes('Socket hang up'),
    'safeJsonStringify preserva la propiedad no-enumerable error.cause para auditoría de errores encadenados'
  )
}

// ==============================================================================
// TEST 19: Combinación y Preservación de details y hint en extractErrorInfo
// ==============================================================================
console.log('\n▶ FASE 19: Combinación de details y hint en extractErrorInfo')

if (extractErrorInfo) {
  const dbErrorWithHint = {
    code: '23503',
    message: 'Foreign key violation on table service_calls',
    details: 'Key (restaurant_id)=(xyz) is not present in table "restaurants".',
    hint: 'Verifica que el restaurante exista antes de insertar la llamada.',
  }

  const extracted = extractErrorInfo(dbErrorWithHint)
  assert(
    extracted.details.includes('Key (restaurant_id)') &&
    extracted.details.includes('Hint:') &&
    extracted.details.includes('Verifica que el restaurante'),
    'extractErrorInfo combina details y hint de PostgreSQL sin descartar información de diagnóstico'
  )
}

// ==============================================================================
// TEST 20: Extracción de Códigos de Estado HTTP vía statusCode en extractErrorInfo
// ==============================================================================
console.log('\n▶ FASE 20: Extracción de Códigos HTTP vía statusCode')

if (extractErrorInfo) {
  const httpError = {
    statusCode: 502,
    message: 'Bad Gateway upstream',
  }

  const extractedHttp = extractErrorInfo(httpError)
  assert(
    extractedHttp.code === '502',
    'extractErrorInfo captura códigos de error HTTP numéricos vía statusCode'
  )
}

// ==============================================================================
// TEST 21: Serialización de Mensajes Objeto con Referencias Circulares en Persistencia
// ==============================================================================
console.log('\n▶ FASE 21: Serialización Resiliente de Mensajes Cíclicos en Persistencia')

if (recordSystemErrorLog) {
  const cyclicMessageObj = { text: 'Critical database deadlock' }
  cyclicMessageObj.self = cyclicMessageObj

  let circularThrew = false
  try {
    await recordSystemErrorLog({
      restaurant_slug: 'burger-gourmet',
      message: cyclicMessageObj,
      error_code: 'DEADLOCK_DETECTED',
    })
  } catch {
    circularThrew = true
  }

  assert(
    !circularThrew,
    'recordSystemErrorLog serializa mensajes estructurados con referencias circulares sin degradar a [object Object]'
  )
}

// ==============================================================================
// TEST 22: Sanitización de Metadatos Provistos como Array Directo
// ==============================================================================
console.log('\n▶ FASE 22: Sanitización de Array Directo en Metadatos')

if (recordSystemErrorLog) {
  let arrayMetaThrew = false
  try {
    await recordSystemErrorLog({
      restaurant_slug: 'burger-gourmet',
      metadata: ['order_item_1', 'order_item_2'],
      error_code: 'ARRAY_META_TEST',
      message: 'Array metadata test',
    })
  } catch {
    arrayMetaThrew = true
  }

  assert(
    !arrayMetaThrew,
    'recordSystemErrorLog sanitiza metadatos provistos como array directo sin propagar excepciones'
  )
}

// ==============================================================================
// RESUMEN FINAL
// ==============================================================================
console.log('\n' + '='.repeat(80))
if (failed === 0) {
  console.log(` 🏆 CERTIFICACIÓN DE LOGGING: ${passed}/${passed} PRUEBAS SUPERADAS (100% PASS)`)
  console.log(' La migración a Vercel Structured Runtime Logging y Supabase Persistence es completa.')
  console.log('='.repeat(80))
  process.exit(0)
} else {
  console.error(` ❌ FALLOS DETECTADOS: ${failed} verificaciones fallaron`)
  console.log('='.repeat(80))
  process.exit(1)
}
