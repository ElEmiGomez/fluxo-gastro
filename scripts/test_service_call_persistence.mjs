import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

const envPath = path.resolve(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8')
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...rest] = trimmed.split('=')
      if (key && rest.length > 0) {
        process.env[key.trim()] = rest.join('=').trim()
      }
    }
  })
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

console.log('Testing with Supabase URL:', supabaseUrl)
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function run() {
  const restaurantId = 'a0000000-0000-0000-0000-000000000001'
  const tableNumber = 7
  const callType = 'waiter_attention'

  console.log('1. Verificando restaurante en Supabase...')
  const { data: rest, error: restErr } = await supabase
    .from('restaurants')
    .select('id, name, slug')
    .eq('id', restaurantId)
    .single()
  console.log('Restaurante:', rest?.name, 'Error:', restErr)

  console.log('2. Insertando llamada de servicio con UUID canónico...')
  const { data: call, error: callErr } = await supabase
    .from('service_calls')
    .insert({
      restaurant_id: restaurantId,
      table_number: tableNumber,
      call_type: callType,
      status: 'pending',
    })
    .select('*')
    .single()

  if (call) {
    console.log('✔ LLAMADA GUARDADA CON ÉXITO EN SUPABASE. UUID:', call.id)
  } else {
    console.error('✖ ERROR GUARDANDO EN SUPABASE:', callErr)
  }
}

run()
