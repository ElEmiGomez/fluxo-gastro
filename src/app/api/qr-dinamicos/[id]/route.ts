import { NextRequest, NextResponse } from 'next/server'
import { verifyStaffRequest } from '@/lib/auth/pin-security'
import { verifyFounderRequest } from '@/lib/auth/crm-auth'
import { createServerClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/supabase/client'

function getBaseUrl(req: NextRequest): string {
  return `${req.nextUrl.protocol}//${req.nextUrl.host}`
}

function isAuthorized(req: NextRequest, slug: string): boolean {
  if (verifyFounderRequest(req)) return true
  if (verifyStaffRequest(req, slug, ['admin', 'comandero'])) return true
  return false
}

/**
 * GET /api/qr-dinamicos/:id?slug=...
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { searchParams } = new URL(req.url)
    const slug = searchParams.get('slug') || 'burger-gourmet'

    if (!isAuthorized(req, slug)) {
      return NextResponse.json(
        { error: 'No autorizado. Se requiere sesión de Fundador (CRM) o Staff.' },
        { status: 401 }
      )
    }

    const supabase = createServerClient()
    if (!supabase || !isSupabaseConfigured()) {
      return NextResponse.json({ error: 'Supabase no configurado' }, { status: 500 })
    }

    const { data, error } = await supabase
      .from('qr_dinamicos')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'QR dinámico no encontrado' }, { status: 404 })
    }

    const baseUrl = getBaseUrl(req)
    return NextResponse.json({
      id: data.id,
      short_url: `${baseUrl}/qr/d/${data.id}`,
      target_url: data.target_url,
      click_count: data.click_count,
      qr_url: `${baseUrl}/api/qr-dinamicos/${data.id}/qr?slug=${data.slug}`,
      lead_id: data.lead_id,
      slug: data.slug,
      created_at: data.created_at,
      updated_at: data.updated_at,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

/**
 * PUT /api/qr-dinamicos/:id
 * Body: { slug, target_url, lead_id? }
 */
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const { slug, target_url, lead_id } = body

    if (!target_url) {
      return NextResponse.json({ error: 'Falta target_url' }, { status: 400 })
    }

    try {
      new URL(target_url)
    } catch {
      return NextResponse.json({ error: 'target_url no es una URL válida' }, { status: 400 })
    }

    const effectiveSlug = slug || 'burger-gourmet'

    if (!isAuthorized(req, effectiveSlug)) {
      return NextResponse.json(
        { error: 'No autorizado. Se requiere sesión de Fundador (CRM) o Staff.' },
        { status: 401 }
      )
    }

    const supabase = createServerClient()
    if (!supabase || !isSupabaseConfigured()) {
      return NextResponse.json({ error: 'Supabase no configurado' }, { status: 500 })
    }

    const { data: existing, error: fetchError } = await supabase
      .from('qr_dinamicos')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'QR dinámico no encontrado' }, { status: 404 })
    }

    const now = new Date().toISOString()
    const { data, error } = await supabase
      .from('qr_dinamicos')
      .update({
        target_url,
        slug: slug || existing.slug,
        lead_id: lead_id !== undefined ? lead_id : existing.lead_id,
        updated_at: now,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    const baseUrl = getBaseUrl(req)
    return NextResponse.json({
      id: data.id,
      short_url: `${baseUrl}/qr/d/${data.id}`,
      target_url: data.target_url,
      updated_at: data.updated_at,
      lead_id: data.lead_id,
      slug: data.slug,
      message: 'URL de destino actualizada. El QR sigue apuntando al mismo código corto.',
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

/**
 * DELETE /api/qr-dinamicos/:id?slug=...
 */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { searchParams } = new URL(req.url)
    const slug = searchParams.get('slug') || 'burger-gourmet'

    if (!isAuthorized(req, slug)) {
      return NextResponse.json(
        { error: 'No autorizado. Se requiere sesión de Fundador (CRM) o Staff.' },
        { status: 401 }
      )
    }

    const supabase = createServerClient()
    if (!supabase || !isSupabaseConfigured()) {
      return NextResponse.json({ error: 'Supabase no configurado' }, { status: 500 })
    }

    const { error } = await supabase.from('qr_dinamicos').delete().eq('id', id)

    if (error) throw error

    return NextResponse.json({ message: 'QR dinámico eliminado', id })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
