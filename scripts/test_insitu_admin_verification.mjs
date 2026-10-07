// ==============================================================================
// FLUXO - SUITE DE VERIFICACIÓN FOCALIZADA: ADMINISTRADOR DE CARTA IN-SITU
// ==============================================================================

import assert from 'assert'
import { NextRequest } from 'next/server'
import { POST as verifyPinPOST } from '../src/app/api/staff/verify-pin/route.ts'
import { GET as menuGET, POST as menuPOST, PATCH as menuPATCH, DELETE as menuDELETE } from '../src/app/api/admin/menu/route.ts'
import { signStaffSession, verifyStaffSession } from '../src/lib/auth/pin-security.ts'

async function runInSituAdminVerification() {
  console.log('🧪 Iniciando verificación de Administrador de Carta In-Situ...\n')
  let passed = 0
  let failed = 0

  function test(name, fn) {
    try {
      fn()
      console.log(`  ✅ [PASS] ${name}`)
      passed++
    } catch (err) {
      console.error(`  ❌ [FAIL] ${name}:`, err.message)
      failed++
    }
  }

  async function asyncTest(name, fn) {
    try {
      await fn()
      console.log(`  ✅ [PASS] ${name}`)
      passed++
    } catch (err) {
      console.error(`  ❌ [FAIL] ${name}:`, err.message)
      failed++
    }
  }

  const slug = 'burger-gourmet'

  // 1. Criptografía y firmas de sesión HMAC
  test('1. Firma y validación de tokens de sesión HMAC de Administrador', () => {
    const token = signStaffSession(slug, 'admin')
    assert(typeof token === 'string' && token.includes('.'), 'El token debe ser un string firmado')
    const isValid = verifyStaffSession(token, slug, 'admin')
    assert.strictEqual(isValid, true, 'El token debe ser válido para el slug y rol admin')

    const isInvalidRole = verifyStaffSession(token, slug, 'kitchen')
    assert.strictEqual(isInvalidRole, false, 'El token no debe ser válido para otro rol')

    const isInvalidSlug = verifyStaffSession(token, 'otro-restaurante', 'admin')
    assert.strictEqual(isInvalidSlug, false, 'El token no debe ser válido para otro slug')
  })

  // 2. Verificación de endpoint /api/staff/verify-pin
  await asyncTest('2. Rechazo estricto de PIN incorrecto con HTTP 401', async () => {
    const req = new NextRequest('http://localhost:3000/api/staff/verify-pin', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-forwarded-for': '192.168.1.100',
      },
      body: JSON.stringify({
        role: 'admin',
        slug,
        pin: '0000',
      }),
    })
    const res = await verifyPinPOST(req)
    assert.strictEqual(res.status, 401, 'Debe retornar 401 Unauthorized ante PIN incorrecto')
    const data = await res.json()
    assert(data.error, 'Debe devolver mensaje de error')
  })

  await asyncTest('3. Autenticación exitosa con PIN maestro "1234"', async () => {
    const req = new NextRequest('http://localhost:3000/api/staff/verify-pin', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-forwarded-for': '192.168.1.101',
      },
      body: JSON.stringify({
        role: 'admin',
        slug,
        pin: '1234',
      }),
    })
    const res = await verifyPinPOST(req)
    assert.strictEqual(res.status, 200, 'Debe retornar 200 OK')
    const data = await res.json()
    assert.strictEqual(data.success, true, 'Debe autorizar exitosamente')
    assert(data.token, 'Debe retornar un token de sesión firmado')
    assert(verifyStaffSession(data.token, slug, 'admin'), 'El token debe ser válido')
  })

  await asyncTest('4. Autenticación exitosa con PIN maestro alternativo "9999"', async () => {
    const req = new NextRequest('http://localhost:3000/api/staff/verify-pin', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-forwarded-for': '192.168.1.102',
      },
      body: JSON.stringify({
        role: 'admin',
        slug,
        pin: '9999',
      }),
    })
    const res = await verifyPinPOST(req)
    assert.strictEqual(res.status, 200, 'Debe retornar 200 OK con PIN maestro 9999')
    const data = await res.json()
    assert.strictEqual(data.success, true)
  })

  await asyncTest('5. Bloqueo por fuerza bruta tras intentos fallidos consecutivos (Rate Limiting)', async () => {
    const testIp = '10.0.0.99'
    let lastStatus = 0
    for (let i = 0; i < 6; i++) {
      const req = new NextRequest('http://localhost:3000/api/staff/verify-pin', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-forwarded-for': testIp,
        },
        body: JSON.stringify({
          role: 'admin',
          slug,
          pin: '9991',
        }),
      })
      const res = await verifyPinPOST(req)
      lastStatus = res.status
    }
    assert.strictEqual(lastStatus, 429, 'Debe retornar 429 Too Many Requests tras 5 intentos fallidos')
  })

  // 3. Blindaje de Seguridad en /api/admin/menu
  await asyncTest('6. Rechazo de mutaciones no autorizadas en /api/admin/menu (Sin Auth)', async () => {
    const req = new NextRequest('http://localhost:3000/api/admin/menu', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        slug,
        type: 'product',
        data: { name: 'Plato Hackeado', price: 0.01 },
      }),
    })
    const res = await menuPOST(req)
    assert.strictEqual(res.status, 401, 'POST sin credenciales debe retornar 401')
  })

  await asyncTest('7. Rechazo de toggle de disponibilidad no autorizado en /api/admin/menu (Sin Auth)', async () => {
    const req = new NextRequest('http://localhost:3000/api/admin/menu', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        slug,
        product_id: 'p-1',
        is_available: false,
      }),
    })
    const res = await menuPATCH(req)
    assert.strictEqual(res.status, 401, 'PATCH sin credenciales debe retornar 401')
  })

  // 4. Mutaciones Autorizadas con Bearer Token de Administrador In-Situ
  const adminToken = signStaffSession(slug, 'admin')

  await asyncTest('8. Edición de plato in-situ con Bearer Token autorizado', async () => {
    const testProduct = {
      id: 'test-insitu-product-1',
      name: 'Hamburguesa Doble Gourmet Edición In-Situ',
      price: 15.50,
      category_id: 'cat-1',
      description: '200g carne de buey con queso San Simón',
      image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd',
      is_available: true,
    }

    const req = new NextRequest('http://localhost:3000/api/admin/menu', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'authorization': `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        slug,
        type: 'product',
        data: testProduct,
      }),
    })
    const res = await menuPOST(req)
    assert.strictEqual(res.status, 200, 'POST con token de admin debe retornar 200')
    const data = await res.json()
    assert.strictEqual(data.success, true)
    assert.strictEqual(data.product.name, 'Hamburguesa Doble Gourmet Edición In-Situ')
    assert.strictEqual(data.product.price, 15.50)
  })

  await asyncTest('9. Toggle instantáneo de disponibilidad "Agotado" / "Disponible"', async () => {
    // 9.1 Marcar como agotado (is_available = false)
    const reqAgotado = new NextRequest('http://localhost:3000/api/admin/menu', {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json',
        'authorization': `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        slug,
        product_id: 'test-insitu-product-1',
        is_available: false,
      }),
    })
    const resAgotado = await menuPATCH(reqAgotado)
    assert.strictEqual(resAgotado.status, 200)
    const dataAgotado = await resAgotado.json()
    assert.strictEqual(dataAgotado.success, true)
    assert.strictEqual(dataAgotado.is_available, false, 'El plato debe quedar marcado como no disponible (Agotado)')

    // 9.2 Marcar como disponible (is_available = true)
    const reqDisponible = new NextRequest('http://localhost:3000/api/admin/menu', {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json',
        'authorization': `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        slug,
        product_id: 'test-insitu-product-1',
        is_available: true,
      }),
    })
    const resDisponible = await menuPATCH(reqDisponible)
    assert.strictEqual(resDisponible.status, 200)
    const dataDisponible = await resDisponible.json()
    assert.strictEqual(dataDisponible.success, true)
    assert.strictEqual(dataDisponible.is_available, true, 'El plato debe quedar marcado como disponible')
  })

  await asyncTest('10. Añadir nuevo plato a una categoría in-situ (creación sin ID previo)', async () => {
    const newProduct = {
      name: 'Croquetas de Jamón Ibérico Caseras',
      price: 8.50,
      category_id: 'cat-2',
      description: '6 unidades con bechamel cremosa',
      image_url: 'https://images.unsplash.com/photo-1541544741938-0af808871cc0',
      is_available: true,
    }

    const req = new NextRequest('http://localhost:3000/api/admin/menu', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'authorization': `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        slug,
        type: 'product',
        data: newProduct,
      }),
    })
    const res = await menuPOST(req)
    assert.strictEqual(res.status, 200)
    const data = await res.json()
    assert.strictEqual(data.success, true)
    assert(data.product.id, 'Debe asignar un ID al nuevo plato')
    assert.strictEqual(data.product.name, 'Croquetas de Jamón Ibérico Caseras')
  })

  await asyncTest('11. Soporte de precio al peso y unidades gastronómicas (weight/100g)', async () => {
    const weightProduct = {
      id: 'test-insitu-weight-dish',
      name: 'Chuletón de Vaca Rubia Gallega',
      price: 6.50,
      price_type: 'weight',
      price_unit: '100g',
      category_id: 'cat-1',
      description: 'Maduración mínima 45 días',
      is_available: true,
    }

    const req = new NextRequest('http://localhost:3000/api/admin/menu', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'authorization': `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        slug,
        type: 'product',
        data: weightProduct,
      }),
    })
    const res = await menuPOST(req)
    assert.strictEqual(res.status, 200)
    const data = await res.json()
    assert.strictEqual(data.success, true)
    assert.strictEqual(data.product.price_type, 'weight')
    assert.strictEqual(data.product.price_unit, '100g')
  })

  await asyncTest('12. Sanitización de texto en entradas de producto', async () => {
    const dangerousInput = {
      id: 'test-sanitized-dish',
      name: '<script>alert("hack")</script>Tarta de Queso',
      price: 6.00,
      category_id: 'cat-3',
      description: '<b onclick="alert(1)">Artesana</b> al horno',
      is_available: true,
    }

    const req = new NextRequest('http://localhost:3000/api/admin/menu', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'authorization': `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        slug,
        type: 'product',
        data: dangerousInput,
      }),
    })
    const res = await menuPOST(req)
    assert.strictEqual(res.status, 200)
    const data = await res.json()
    assert.strictEqual(data.success, true)
    assert(!data.product.name.includes('<script>'), 'El nombre no debe contener etiquetas script')
  })

  await asyncTest('13. Consulta ordinaria del comensal (GET /api/admin/menu sin auth)', async () => {
    const req = new NextRequest(`http://localhost:3000/api/admin/menu?slug=${slug}`)
    const res = await menuGET(req)
    assert.strictEqual(res.status, 200, 'GET debe ser público para visualización del comensal')
    const data = await res.json()
    assert.strictEqual(data.success, true)
    assert(Array.isArray(data.categories), 'Debe retornar categorías')
    assert(Array.isArray(data.products), 'Debe retornar productos')
  })

  // 5. Casos de Borde Adversarios y Auditoría de Seguridad
  await asyncTest('14. Autenticación exitosa con PIN maestro de 7 dígitos "4154928"', async () => {
    const req = new NextRequest('http://localhost:3000/api/staff/verify-pin', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-forwarded-for': '192.168.1.103',
      },
      body: JSON.stringify({
        role: 'admin',
        slug,
        pin: '4154928',
      }),
    })
    const res = await verifyPinPOST(req)
    assert.strictEqual(res.status, 200, 'PIN 4154928 debe ser aceptado')
    const data = await res.json()
    assert.strictEqual(data.success, true)
    assert(verifyStaffSession(data.token, slug, 'admin'))
  })

  await asyncTest('15. Bloqueo impenetrable: Intento con PIN correcto ("1234") mientras la IP está bloqueada retorna 429', async () => {
    const testIp = '10.0.0.88'
    // 5 intentos fallidos para activar bloqueo
    for (let i = 0; i < 5; i++) {
      const reqFail = new NextRequest('http://localhost:3000/api/staff/verify-pin', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-forwarded-for': testIp,
        },
        body: JSON.stringify({
          role: 'admin',
          slug,
          pin: '0000',
        }),
      })
      await verifyPinPOST(reqFail)
    }

    // 6º intento con el PIN CORRECTO '1234'
    const reqBypass = new NextRequest('http://localhost:3000/api/staff/verify-pin', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-forwarded-for': testIp,
      },
      body: JSON.stringify({
        role: 'admin',
        slug,
        pin: '1234',
      }),
    })
    const resBypass = await verifyPinPOST(reqBypass)
    assert.strictEqual(resBypass.status, 429, 'Incluso con el PIN correcto debe ser rechazado con 429 durante el bloqueo')
  })

  await asyncTest('16. Generación de UUID canónico v4 para nuevos platos sin ID (compatibilidad PostgreSQL)', async () => {
    const req = new NextRequest('http://localhost:3000/api/admin/menu', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'authorization': `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        slug,
        type: 'product',
        data: {
          name: 'Pimientos de Padrón Fritos',
          price: 5.50,
          category_id: 'cat-2',
        },
      }),
    })
    const res = await menuPOST(req)
    assert.strictEqual(res.status, 200)
    const data = await res.json()
    assert(data.success)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    assert(uuidRegex.test(data.product.id), `El ID generado (${data.product.id}) debe ser un UUID v4 canónico`)
  })

  await asyncTest('17. Soporte para coma decimal ("14,50") y precio 0.00€ de cortesía', async () => {
    // 17.1 Coma decimal
    const reqComma = new NextRequest('http://localhost:3000/api/admin/menu', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'authorization': `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        slug,
        type: 'product',
        data: {
          id: 'test-comma-price-dish',
          name: 'Ración de Pulpo á Feira',
          price: '14,50',
          category_id: 'cat-2',
        },
      }),
    })
    const resComma = await menuPOST(reqComma)
    assert.strictEqual(resComma.status, 200)
    const dataComma = await resComma.json()
    assert.strictEqual(dataComma.product.price, 14.50, 'Debe parsear correctamente la coma a 14.50')

    // 17.2 Precio 0.00€ cortesía
    const reqZero = new NextRequest('http://localhost:3000/api/admin/menu', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'authorization': `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        slug,
        type: 'product',
        data: {
          id: 'test-zero-price-dish',
          name: 'Agua del Grifo Filtrada (Cortesía)',
          price: 0,
          category_id: 'cat-3',
        },
      }),
    })
    const resZero = await menuPOST(reqZero)
    assert.strictEqual(resZero.status, 200)
    const dataZero = await resZero.json()
    assert.strictEqual(dataZero.product.price, 0, 'Debe aceptar precio 0 para artículos de cortesía')
  })

  await asyncTest('18. Saneamiento de precio negativo (previene corrupción contable)', async () => {
    const reqNegative = new NextRequest('http://localhost:3000/api/admin/menu', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'authorization': `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        slug,
        type: 'product',
        data: {
          id: 'test-negative-dish',
          name: 'Plato Precio Negativo',
          price: -15.00,
          category_id: 'cat-1',
        },
      }),
    })
    const resNegative = await menuPOST(reqNegative)
    assert.strictEqual(resNegative.status, 200)
    const dataNegative = await resNegative.json()
    assert.strictEqual(dataNegative.product.price, 0, 'El precio no puede ser negativo')
  })

  await asyncTest('19. Rechazo de token falsificado con firma manipulada', async () => {
    const fakeToken = `${adminToken}manipulated`
    const req = new NextRequest('http://localhost:3000/api/admin/menu', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'authorization': `Bearer ${fakeToken}`,
      },
      body: JSON.stringify({
        slug,
        type: 'product',
        data: { name: 'Plato Inyectado', price: 10 },
      }),
    })
    const res = await menuPOST(req)
    assert.strictEqual(res.status, 401, 'Token con firma inválida debe ser rechazado con 401')
  })

  // 6. Nuevas Pruebas Adversarias de Invariantes y Robustez
  await asyncTest('20. Autenticación exitosa de personal de cocina con PIN "5678" para role "kitchen"', async () => {
    const req = new NextRequest('http://localhost:3000/api/staff/verify-pin', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-forwarded-for': '192.168.1.104',
      },
      body: JSON.stringify({
        role: 'kitchen',
        slug,
        pin: '5678',
      }),
    })
    const res = await verifyPinPOST(req)
    assert.strictEqual(res.status, 200, 'Debe permitir login de cocina con PIN 5678')
    const data = await res.json()
    assert.strictEqual(data.success, true)
    assert(verifyStaffSession(data.token, slug, 'kitchen'), 'Debe emitir token para rol kitchen')
  })

  await asyncTest('21. Rechazo estricto de PIN de cocina ("5678") al intentar acceder como role "admin"', async () => {
    const req = new NextRequest('http://localhost:3000/api/staff/verify-pin', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-forwarded-for': '192.168.1.105',
      },
      body: JSON.stringify({
        role: 'admin',
        slug,
        pin: '5678',
      }),
    })
    const res = await verifyPinPOST(req)
    assert.strictEqual(res.status, 401, 'PIN de cocina 5678 no debe otorgar acceso de administrador')
  })

  await asyncTest('22. Rechazo de rol inválido o arbitrario con HTTP 400', async () => {
    const req = new NextRequest('http://localhost:3000/api/staff/verify-pin', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-forwarded-for': '192.168.1.106',
      },
      body: JSON.stringify({
        role: 'hacker_role',
        slug,
        pin: '1234',
      }),
    })
    const res = await verifyPinPOST(req)
    assert.strictEqual(res.status, 400, 'Roles no reconocidos deben ser rechazados con 400')
  })

  await asyncTest('23. Header x-staff-pin respeta roles estrictos (5678 rechazado para admin, 1234 aceptado)', async () => {
    // 23.1 PIN 5678 rechazado en mutación admin
    const reqKitchenPin = new NextRequest('http://localhost:3000/api/admin/menu', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-staff-pin': '5678',
      },
      body: JSON.stringify({
        slug,
        type: 'product',
        data: { name: 'Plato Intruso Cocina', price: 10 },
      }),
    })
    const resKitchenPin = await menuPOST(reqKitchenPin)
    assert.strictEqual(resKitchenPin.status, 401, 'x-staff-pin 5678 no debe permitir mutaciones administrativas')

    // 23.2 PIN 1234 aceptado en mutación admin
    const reqAdminPin = new NextRequest('http://localhost:3000/api/admin/menu', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-staff-pin': '1234',
      },
      body: JSON.stringify({
        slug,
        type: 'product',
        data: { id: 'test-admin-pin-dish', name: 'Plato Autorizado PIN 1234', price: 9.99 },
      }),
    })
    const resAdminPin = await menuPOST(reqAdminPin)
    assert.strictEqual(resAdminPin.status, 200, 'x-staff-pin 1234 debe permitir mutación administrativa')
  })

  await asyncTest('24. Preservación íntegra de modelo 3D y metadatos existentes al editar plato in-situ', async () => {
    const dishWith3D = {
      id: 'test-dish-with-3d-model',
      name: 'Burger 3D Original',
      price: 14.00,
      category_id: 'cat-1',
      model_3d_url: 'https://storage.fluxo.menu/models/burger-3d.glb',
      is_highlighted_promo: true,
    }

    // Crear plato inicial con modelo 3D
    await menuPOST(new NextRequest('http://localhost:3000/api/admin/menu', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'authorization': `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ slug, type: 'product', data: dishWith3D }),
    }))

    // Editar solo el precio y nombre in-situ
    const editReq = new NextRequest('http://localhost:3000/api/admin/menu', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'authorization': `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        slug,
        type: 'product',
        data: {
          id: 'test-dish-with-3d-model',
          name: 'Burger 3D Actualizada',
          price: 16.50,
        },
      }),
    })
    const editRes = await menuPOST(editReq)
    assert.strictEqual(editRes.status, 200)
    const editData = await editRes.json()
    assert.strictEqual(editData.product.name, 'Burger 3D Actualizada')
    assert.strictEqual(editData.product.price, 16.50)
    assert.strictEqual(editData.product.model_3d_url, 'https://storage.fluxo.menu/models/burger-3d.glb', 'model_3d_url no debe ser sobreescrito a null')
    assert.strictEqual(editData.product.is_highlighted_promo, true, 'is_highlighted_promo debe ser preservado')
  })

  await asyncTest('25. Eliminación de plato in-situ autorizada y rechazo sin credenciales', async () => {
    // 25.1 Rechazo sin autenticación
    const unauthReq = new NextRequest(`http://localhost:3000/api/admin/menu?slug=${slug}&type=product&id=test-dish-with-3d-model`, {
      method: 'DELETE',
    })
    const unauthRes = await menuDELETE(unauthReq)
    assert.strictEqual(unauthRes.status, 401, 'DELETE sin auth debe retornar 401')

    // 25.2 Aprobación con Bearer token de admin
    const authReq = new NextRequest(`http://localhost:3000/api/admin/menu?slug=${slug}&type=product&id=test-dish-with-3d-model`, {
      method: 'DELETE',
      headers: {
        'authorization': `Bearer ${adminToken}`,
      },
    })
    const authRes = await menuDELETE(authReq)
    assert.strictEqual(authRes.status, 200, 'DELETE autorizado debe retornar 200')
    const authData = await authRes.json()
    assert.strictEqual(authData.success, true)
    assert.strictEqual(authData.deleted_product_id, 'test-dish-with-3d-model')
  })

  await asyncTest('26. Limpieza y reseteo completo tras expiración de ventana de bloqueo (Rate Limit Reset)', async () => {
    // Verificamos que tras 5 fallos la IP queda bloqueada (429) y que al pasar el tiempo de bloqueo (60s) se limpia y se otorgan intentos frescos
    const testIp = '10.0.0.77'
    for (let i = 0; i < 5; i++) {
      await verifyPinPOST(new NextRequest('http://localhost:3000/api/staff/verify-pin', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-forwarded-for': testIp },
        body: JSON.stringify({ role: 'admin', slug, pin: '0000' }),
      }))
    }
    // Confirmamos bloqueo activo (429)
    const lockedRes = await verifyPinPOST(new NextRequest('http://localhost:3000/api/staff/verify-pin', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': testIp },
      body: JSON.stringify({ role: 'admin', slug, pin: '0000' }),
    }))
    assert.strictEqual(lockedRes.status, 429, 'Debe estar en estado 429 bloqueado')

    // Simulamos paso del tiempo (65s transcurridos para superar la ventana de 60s)
    const realNow = Date.now
    try {
      Date.now = () => realNow() + 65000
      const afterExpiryRes = await verifyPinPOST(new NextRequest('http://localhost:3000/api/staff/verify-pin', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-forwarded-for': testIp },
        body: JSON.stringify({ role: 'admin', slug, pin: '0000' }),
      }))
      assert.strictEqual(afterExpiryRes.status, 401, 'Tras expirar el bloqueo, debe volver a permitir intentos con 401 y no 429')
      const afterData = await afterExpiryRes.json()
      assert.strictEqual(afterData.remaining, 4, 'Debe reiniciar el contador otorgando 4 intentos restantes tras el primer fallo')
    } finally {
      Date.now = realNow
    }
  })

  await asyncTest('27. Extracción de IP cliente real ante encabezados de proxy encadenados (x-forwarded-for)', async () => {
    const proxyIp = '198.51.100.42, 10.0.0.1, 127.0.0.1'
    // Provocar 5 fallos con IP encadenada
    for (let i = 0; i < 5; i++) {
      await verifyPinPOST(new NextRequest('http://localhost:3000/api/staff/verify-pin', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-forwarded-for': proxyIp },
        body: JSON.stringify({ role: 'admin', slug, pin: '0000' }),
      }))
    }
    // Intento subsecuente con una variación del proxy intermedio pero misma IP cliente originaria
    const alteredProxy = '198.51.100.42, 10.0.0.2'
    const res = await verifyPinPOST(new NextRequest('http://localhost:3000/api/staff/verify-pin', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': alteredProxy },
      body: JSON.stringify({ role: 'admin', slug, pin: '0000' }),
    }))
    assert.strictEqual(res.status, 429, 'Debe aislar la IP origen (198.51.100.42) impidiendo saltarse el rate limit mediante proxies alternos')
  })

  await asyncTest('28. Transición limpia de plato al peso a plato unitario y saneamiento de nombres en blanco', async () => {
    const dish = {
      id: 'test-weight-to-unit-dish',
      name: 'Entrecot al Peso',
      price: 22.00,
      price_type: 'weight',
      price_unit: 'kg',
      category_id: 'cat-1',
    }
    await menuPOST(new NextRequest('http://localhost:3000/api/admin/menu', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'authorization': `Bearer ${adminToken}` },
      body: JSON.stringify({ slug, type: 'product', data: dish }),
    }))

    // Ahora editar a plato unitario y pasar nombre con solo espacios en blanco
    const editRes = await menuPOST(new NextRequest('http://localhost:3000/api/admin/menu', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'authorization': `Bearer ${adminToken}` },
      body: JSON.stringify({
        slug,
        type: 'product',
        data: {
          id: 'test-weight-to-unit-dish',
          name: '   ',
          price: 25.00,
          price_type: 'unit',
        },
      }),
    }))
    assert.strictEqual(editRes.status, 200)
    const editData = await editRes.json()
    assert.strictEqual(editData.product.price_type, 'unit')
    assert.strictEqual(editData.product.price_unit, undefined, 'price_unit debe limpiarse al pasar a unit')
    assert(editData.product.name.trim().length > 0, 'El nombre no debe quedar como cadena vacía')
  })

  console.log(`\n📊 RESULTADOS: ${passed} pasados, ${failed} fallados.`)
  if (failed > 0) {
    process.exit(1)
  }
}

runInSituAdminVerification().catch(e => {
  console.error('Error no controlado en suite:', e)
  process.exit(1)
})
