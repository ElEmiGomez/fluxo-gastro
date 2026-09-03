import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"

console.log("================================================================================")
console.log(" 🧪 VERIFICACIÓN AUTOMATIZADA: MILESTONE 2 (UI TASK QUEUE RESILIENCE)")
console.log("================================================================================\n")

let passed = 0
let failed = 0

function test(name, fn) {
  try {
    fn()
    passed++
    console.log(`  ✔ [PASS] ${name}`)
  } catch (err) {
    failed++
    console.error(`  ✖ [FAIL] ${name}: ${err.message}`)
  }
}

async function asyncTest(name, fn) {
  try {
    await fn()
    passed++
    console.log(`  ✔ [PASS] ${name}`)
  } catch (err) {
    failed++
    console.error(`  ✖ [FAIL] ${name}: ${err.message}`)
  }
}

// 1. Verificación de Comandero (src/app/staff/comandero/[slug]/page.tsx)
const comanderoPath = path.resolve("src/app/staff/comandero/[slug]/page.tsx")
const comanderoContent = fs.readFileSync(comanderoPath, "utf-8")

test("Comandero: statusMap ignora órdenes con status === 'cancelled'", () => {
  assert.ok(
    comanderoContent.includes("ord.status === 'cancelled'"),
    "statusMap debe contemplar ord.status === 'cancelled'"
  )
  // Verificar que hay un return para órdenes cancelled
  assert.ok(
    /if\s*\(\s*ord\.status\s*===\s*'cancelled'/.test(comanderoContent),
    "statusMap debe retornar de inmediato si la orden está cancelada"
  )
})

test("Comandero: handleFireSecondCourses solo marcha órdenes pending o ready", () => {
  assert.ok(
    comanderoContent.includes("o.status === 'pending' || o.status === 'ready'"),
    "handleFireSecondCourses debe filtrar explícitamente por status pending o ready"
  )
})

test("Comandero: PreBillModal incluye órdenes preparing, ready y delivered", () => {
  assert.ok(
    comanderoContent.includes("['preparing', 'ready', 'delivered'].includes(o.status)"),
    "PreBillModal debe incluir platos preparing, ready y delivered en la pre-cuenta"
  )
})

// 2. Verificación de Menú Comensal (src/app/menu/[slug]/page.tsx)
const menuPath = path.resolve("src/app/menu/[slug]/page.tsx")
const menuContent = fs.readFileSync(menuPath, "utf-8")

test("Menú Comensal: Aislamiento de órdenes por token de sesión", () => {
  assert.ok(
    menuContent.includes("(!o.session_token || (currentSessionId ? o.session_token === currentSessionId : true))"),
    "tableOrders debe filtrar por token de sesión activo"
  )
})

test("Menú Comensal: Detección de cuenta pagada ante orden 'paid' o evento SSE table_bill_paid", () => {
  assert.ok(
    menuContent.includes("allTableOrders.some(o => o.status === 'paid')"),
    "Debe detectar si las órdenes de la mesa han sido cobradas (status === 'paid')"
  )
  assert.ok(
    menuContent.includes("data.type === 'table_bill_paid'"),
    "Debe escuchar evento en vivo table_bill_paid vía SSE"
  )
  assert.ok(
    menuContent.includes("window.addEventListener('fluxo_table_bill_paid'"),
    "Debe escuchar evento local fluxo_table_bill_paid"
  )
})

// 3. Verificación de Botón Llamar Mozo (src/components/menu/CallWaiterButton.tsx)
const buttonPath = path.resolve("src/components/menu/CallWaiterButton.tsx")
const buttonContent = fs.readFileSync(buttonPath, "utf-8")

test("CallWaiterButton: Eliminado temporizador efímero de 6 segundos", () => {
  assert.ok(
    !buttonContent.includes("setTimeout(() => {\n        setCalled(false)\n      }, 6000)"),
    "No debe existir el temporizador efímero de 6000ms que borraba el aviso"
  )
  assert.ok(
    !buttonContent.includes("setTimeout(() => setCalled(false), 5000)"),
    "No debe existir temporizador efímero de 5000ms"
  )
})

test("CallWaiterButton: Estado reactivo sincronizado con llamadas del servidor", () => {
  assert.ok(
    buttonContent.includes("/api/service-calls?slug="),
    "Debe consultar las llamadas pendientes del servidor"
  )
  assert.ok(
    buttonContent.includes("service_call_attended"),
    "Debe reaccionar cuando el personal atiende el aviso"
  )
})

// 4. Verificación de endpoints en vivo
const BASE_URL = "http://localhost:3000"

await asyncTest("Live API: Creación y atención de aviso de servicio actualiza estado", async () => {
  // Crear llamada
  const createRes = await fetch(`${BASE_URL}/api/service-calls`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      slug: "burger-gourmet",
      table_number: 14,
      call_type: "waiter_attention",
    }),
  })
  assert.strictEqual(createRes.status, 200)
  const createData = await createRes.json()
  assert.ok(createData.call?.id)
  const callId = createData.call.id

  // Consultar llamadas
  const getRes = await fetch(`${BASE_URL}/api/service-calls?slug=burger-gourmet`)
  const getData = await getRes.json()
  const found = getData.calls.find(c => c.id === callId)
  assert.ok(found, "La llamada debe estar activa en el servidor")
  assert.strictEqual(found.status, "pending")

  // Atender llamada
  const attendRes = await fetch(`${BASE_URL}/api/service-calls`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      slug: "burger-gourmet",
      callId: callId,
      status: "attended",
    }),
  })
  assert.strictEqual(attendRes.status, 200)

  // Verificar que ya no está en llamadas activas pendientes
  const getResAfter = await fetch(`${BASE_URL}/api/service-calls?slug=burger-gourmet`)
  const getDataAfter = await getResAfter.json()
  const foundAfter = getDataAfter.calls.find(c => c.id === callId)
  assert.strictEqual(foundAfter, undefined, "La llamada atendida ya no debe estar en la lista de llamadas pendientes")
})

console.log("\n================================================================================")
console.log(`RESULTADOS: ${passed} pasadas, ${failed} falladas`)
console.log("================================================================================\n")

if (failed > 0) {
  process.exit(1)
} else {
  console.log("🎉 ¡TODOS LOS REQUISITOS DE MILESTONE 2 VALIDADOS CON ÉXITO!")
  process.exit(0)
}
