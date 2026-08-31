import { NextRequest, NextResponse } from 'next/server'
import { recordAnalyticsEvent, getAnalyticsSummary, sanitizeText, checkRateLimit } from '@/lib/server-state'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const slug = searchParams.get('slug') || 'burger-gourmet'
    const summary = getAnalyticsSummary(slug)
    return NextResponse.json({ success: true, summary })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { slug = 'burger-gourmet', type, table_number, product_id } = body

    if (!type) {
      return NextResponse.json({ error: 'Tipo de evento requerido' }, { status: 400 })
    }

    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local-client'
    if (!checkRateLimit(`analytics_${clientIp}`, 60, 60000)) {
      return NextResponse.json({ error: 'Rate limit excedido' }, { status: 429 })
    }

    const validTypes = ['page_view', 'product_view', 'service_call', 'order_placed']
    const sanitizedType = validTypes.includes(type) ? type : 'page_view'

    const event = recordAnalyticsEvent(slug, {
      slug,
      type: sanitizedType as any,
      table_number: table_number ? sanitizeText(String(table_number), 10) : undefined,
      product_id: product_id ? sanitizeText(String(product_id), 50) : undefined,
    })

    return NextResponse.json({ success: true, event })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
