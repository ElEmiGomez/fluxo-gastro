import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/supabase/client'

/**
 * GET /qr/d/:id
 * Redirección pública del QR dinámico.
 * Cuando un cliente escanea el QR, llega aquí y se redirige a la URL de destino actual.
 * Incrementa el contador de clics.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const supabase = createServerClient()
    if (!supabase || !isSupabaseConfigured()) {
      // Fallback: redirigir a la landing si no hay DB
      return NextResponse.redirect(new URL('/', req.url))
    }

    const { data, error } = await supabase
      .from('qr_dinamicos')
      .select('target_url, click_count')
      .eq('id', id)
      .single()

    if (error || !data) {
      return NextResponse.redirect(new URL('/', req.url))
    }

    // Incrementar contador de clics (no bloqueante)
    await supabase
      .from('qr_dinamicos')
      .update({ click_count: (data.click_count || 0) + 1 })
      .eq('id', id)

    return NextResponse.redirect(new URL(data.target_url, req.url))
  } catch {
    return NextResponse.redirect(new URL('/', req.url))
  }
}
