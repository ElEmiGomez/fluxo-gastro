import { NextRequest, NextResponse } from 'next/server'
import QRCode from 'qrcode'
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
 * GET /api/qr-dinamicos/:id/qr?slug=...
 * Devuelve el código QR (PNG) que apunta al short URL dinámico.
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
    const shortUrl = `${baseUrl}/qr/d/${id}`

    const qrBuffer: Buffer = await QRCode.toBuffer(shortUrl, {
      type: 'png',
      width: 400,
      margin: 4,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    })

    return new NextResponse(qrBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `inline; filename="qr-${id}.png"`,
        'Cache-Control': 'no-cache',
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
