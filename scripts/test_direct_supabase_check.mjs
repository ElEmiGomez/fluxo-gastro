import fs from 'fs'
import { createClient } from '@supabase/supabase-js'

const envContent = fs.readFileSync('.env.local', 'utf-8')
const env = {}
for (const line of envContent.split('\n')) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) continue
  const eqIdx = trimmed.indexOf('=')
  if (eqIdx !== -1) {
    const k = trimmed.slice(0, eqIdx).trim()
    let v = trimmed.slice(eqIdx + 1).trim()
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1)
    }
    env[k] = v
  }
}

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY || anonKey

console.log('Connecting to:', supabaseUrl)
const anonClient = createClient(supabaseUrl, anonKey)
const adminClient = createClient(supabaseUrl, serviceRoleKey)

async function test() {
  console.log('\n--- 1. Querying products with anon key ---')
  const { data: anonProds, error: anonErr } = await anonClient.from('products').select('*')
  console.log('Anon products count:', anonProds?.length, 'Error:', anonErr)
  if (anonProds && anonProds.length > 0) {
    console.log('Sample product:', anonProds[0])
    for (const p of anonProds) {
      console.log(`- ${p.id}: ${p.name} (available: ${p.is_available}, restaurant: ${p.restaurant_id})`)
    }
  }

  console.log('\n--- 2. Testing UPDATE is_available with anon client ---')
  if (anonProds && anonProds.length > 0) {
    const target = anonProds[0]
    const newStatus = !target.is_available
    const { data: updateRes, error: updateErr } = await anonClient
      .from('products')
      .update({ is_available: newStatus })
      .eq('id', target.id)
      .select()
    console.log('Anon update result:', updateRes, 'Error:', updateErr)
    // Revert
    await anonClient.from('products').update({ is_available: target.is_available }).eq('id', target.id)
  }

  console.log('\n--- 3. Testing UPDATE is_available with admin client ---')
  if (anonProds && anonProds.length > 0) {
    const target = anonProds[0]
    const newStatus = !target.is_available
    const { data: updateRes, error: updateErr } = await adminClient
      .from('products')
      .update({ is_available: newStatus })
      .eq('id', target.id)
      .select()
    console.log('Admin update result:', updateRes, 'Error:', updateErr)
    // Revert
    await adminClient.from('products').update({ is_available: target.is_available }).eq('id', target.id)
  }

  console.log('\n--- 4. Querying categories ---')
  const { data: cats, error: catsErr } = await anonClient.from('categories').select('*')
  console.log('Categories count:', cats?.length, 'Error:', catsErr)
  if (cats) {
    for (const c of cats) {
      console.log(`- ${c.id}: ${c.name} (order: ${c.order_index})`)
    }
  }

  console.log('\n--- 5. Querying restaurants ---')
  const { data: rests, error: restsErr } = await anonClient.from('restaurants').select('*')
  console.log('Restaurants count:', rests?.length, 'Error:', restsErr)
  if (rests) {
    for (const r of rests) {
      console.log(`- ${r.id}: ${r.slug} - ${r.name}`)
    }
  }
}

test().catch(console.error)
