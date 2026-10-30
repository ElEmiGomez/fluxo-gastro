import { NextRequest, NextResponse } from 'next/server'
import { customAlphabet } from 'nanoid'
import { verifyStaffRequest } from '@/lib/auth/pin-security'
import { verifyFounderRequest } from '@/lib/auth/crm-auth'
import { createServerClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import { QrDinamico } from '@/types/database.types'

const nanoid = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 7)

function getBaseUrl(req: NextRequest): string {
  return `${req.nextUrl.protocol}//${req.nextUrl.host}`
}

function isAuthorized(req: NextRequest, slug: string): boolean {
  // Auth de Fundador (CRM Admin) o Staff (pin 1234/9999)
  if (verifyFounderRequest(req)) return true
  if (verifyStaffRequest(req, slug, ['admin', 'comandero'])) return true
  return false
}

/**
 * GET /api/qr-dinamicos?slug=...&lead_id=...
 * Lista los QRs dinámicos. Filtra por slug o lead_id.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const slug = searchParams.get('slug') || 'burger-gourmet'
    const leadId = searchParams.get('lead_id') || undefined

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

    let query = supabase.from('qr_dinamicos').select('*').order('created_at', { ascending: false })

    if (leadId) {
      query = query.eq('lead_id', leadId)
    } else {
      query = query.eq('slug', slug)
    }

    const { data, error } = await query

    if (error) throw error

    const baseUrl = getBaseUrl(req)
    const qrs = (data || []).map((q: any) => ({
      id: q.id,
      short_url: `${baseUrl}/qr/d/${q.id}`,
      target_url: q.target_url,
      click_count: q.click_count,
      qr_url: `${baseUrl}/api/qr-dinamicos/${q.id}/qr?slug=${q.slug}`,
      lead_id: q.lead_id,
      slug: q.slug,
      created_at: q.created_at,
      updated_at: q.updated_at,
    }))

    return NextResponse.json(qrs)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

/**
 * POST /api/qr-dinamicos
 * Crea un nuevo QR dinámico. Body: { slug, target_url, lead_id? }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { slug, target_url, lead_id } = body

    if (!target_url) {
      return NextResponse.json({ error: 'Falta target_url' }, { status: 400 })
    }

    // Validar URL
    try {
      new URL(target_url)
    } catch {
      return NextResponse.json({ error: 'target_url no es una URL válida' }, { status: 400 })
    }

    const effectiveSlug = slug || lead_id || 'burger-gourmet'

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

    const id = nanoid()
    const now = new Date().toISOString()

    const { data, error } = await supabase
      .from('qr_dinamicos')
      .insert({
        id,
        slug: effectiveSlug,
        lead_id: lead_id || null,
        target_url,
        click_count: 0,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single()

    if (error) throw error

    const baseUrl = getBaseUrl(req)
    return NextResponse.json(
      {
        id: data.id,
        short_url: `${baseUrl}/qr/d/${data.id}`,
        target_url: data.target_url,
        qr_url: `${baseUrl}/api/qr-dinamicos/${data.id}/qr?slug=${data.slug}`,
        lead_id: data.lead_id,
        slug: data.slug,
        created_at: data.created_at,
      },
      { status: 201 }
    )
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
