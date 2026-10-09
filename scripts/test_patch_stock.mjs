import { PATCH } from '../src/app/api/admin/menu/route.ts'
import { NextRequest } from 'next/server'

async function run() {
  console.log('Testing PATCH /api/admin/menu...')

  // 1. Test with existing UUID product
  const req1 = new NextRequest('http://localhost:3000/api/admin/menu', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'x-staff-pin': '1234',
    },
    body: JSON.stringify({
      slug: 'burger-gourmet',
      product_id: 'b0000000-0000-0000-0000-000000000001',
      is_available: false,
    }),
  })

  const res1 = await PATCH(req1)
  const json1 = await res1.json()
  console.log('Test 1 (UUID product) status:', res1.status, json1)

  // 2. Test with legacy ID product (e.g. p-ent-1)
  const req2 = new NextRequest('http://localhost:3000/api/admin/menu', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'x-staff-pin': '1234',
    },
    body: JSON.stringify({
      slug: 'burger-gourmet',
      product_id: 'p-ent-1',
      is_available: false,
    }),
  })

  const res2 = await PATCH(req2)
  const json2 = await res2.json()
  console.log('Test 2 (legacy p-ent-1) status:', res2.status, json2)
}

run().catch(console.error)
