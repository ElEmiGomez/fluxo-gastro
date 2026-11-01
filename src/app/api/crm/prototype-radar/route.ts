import { NextRequest, NextResponse } from 'next/server'
import { verifyFounderRequest } from '@/lib/auth/crm-auth'

/**
 * POST /api/crm/prototype-radar
 * Registra una apertura de carta prototipo desde el QR.
 * Body: { slug, localName, userAgent, source }
 * Guarda en memoria del servidor y responde para sincronizar con localStorage.
 */
export async function POST(req: NextRequest) {
  if (!verifyFounderRequest(req)) {
    return NextResponse.json(
      { error: 'Acceso no autorizado. Se requiere PIN de Fundador.' },
      { status: 401 }
    )
  }

  try {
    const body = await req.json()
    const { slug, localName, userAgent, source } = body

    if (!slug) {
      return NextResponse.json({ error: 'slug es obligatorio' }, { status: 400 })
    }

    const dispositivo = detectarDispositivo(userAgent || '')
    const evento = {
      id: `${slug}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      slug,
      localName: localName || '',
      dispositivo,
      userAgent: userAgent || '',
      source: source || 'qr_scan',
      timestamp: new Date().toISOString(),
    }

    // Estructura persistente en servidor (memoria del edge function)
    // Nota: En serverless de Vercel esto se resetea en cold start.
    // Para persistencia real se usaría Supabase, pero aquí mantenemos en memoria
    // y el cliente sincroniza con localStorage bajo fluxo_crm_radar_v1.
    if (!(globalThis as any).__fluxo_radar__) {
      ;(globalThis as any).__fluxo_radar__ = []
    }
    ;((globalThis as any).__fluxo_radar__ as any[]).unshift(evento)

    return NextResponse.json({ success: true, evento })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error registrando apertura' }, { status: 500 })
  }
}

/**
 * GET /api/crm/prototype-radar?slug=
 * Devuelve resumen de aperturas agrupado por slug y últimos 20 eventos.
 */
export async function GET(req: NextRequest) {
  if (!verifyFounderRequest(req)) {
    return NextResponse.json(
      { error: 'Acceso no autorizado. Se requiere PIN de Fundador.' },
      { status: 401 }
    )
  }

  try {
    const { searchParams } = new URL(req.url)
    const slug = searchParams.get('slug')

    const eventos: any[] = ((globalThis as any).__fluxo_radar__ as any[]) || []

    const filtrados = slug ? eventos.filter((e) => e.slug === slug) : eventos

    // Resumen por slug
    const resumenPorSlug: Record<string, {
      totalOpens: number
      lastOpenedAt: string | null
      lastDevice: string | null
    }> = {}

    for (const e of filtrados) {
      if (!resumenPorSlug[e.slug]) {
        resumenPorSlug[e.slug] = { totalOpens: 0, lastOpenedAt: null, lastDevice: null }
      }
      resumenPorSlug[e.slug].totalOpens++
      if (!resumenPorSlug[e.slug].lastOpenedAt || (resumenPorSlug[e.slug].lastOpenedAt && e.timestamp > (resumenPorSlug[e.slug].lastOpenedAt as string))) {
        resumenPorSlug[e.slug].lastOpenedAt = e.timestamp
        resumenPorSlug[e.slug].lastDevice = e.dispositivo
      }
    }

    return NextResponse.json({
      resumen: resumenPorSlug,
      ultimosEventos: filtrados.slice(0, 20),
      total: filtrados.length,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error obteniendo radar' }, { status: 500 })
  }
}

function detectarDispositivo(ua: string): string {
  if (/iPhone|iPad|iPod/.test(ua)) return 'iPhone / iOS'
  if (/Android/.test(ua)) return 'Android'
  return 'Escritorio'
}
