import { NextRequest, NextResponse } from 'next/server'
import { verifyFounderRequest } from '@/lib/auth/crm-auth'
import {
  getCRMLeads,
  createCRMLead,
  updateCRMLead,
  deleteCRMLead,
  calculateCRMMetrics
} from '@/lib/supabase/repositories/crm.repository'
import { CRMLead, normalizeLeadCity } from '@/types/crm.types'

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * Genera un archivo CSV compatible con Excel (UTF-8 con BOM)
 */
function generateLeadsCSV(leads: CRMLead[]): string {
  const headers = [
    'ID',
    'Ciudad',
    'Zona',
    'Nombre',
    'Direccion',
    'Tipo',
    'Segmento_ICP',
    'Contacto_Nombre',
    'Telefono',
    'WhatsApp',
    'Instagram',
    'Facebook',
    'Google_Rating',
    'Google_Reviews',
    'Score_10',
    'Lead_Score_100',
    'Propuesta_Recomendada',
    'Estado_Menu_Online',
    'URL_Menu_Online',
    'URL_Perfil_Google',
    'URL_Directa_Resenas',
    'Horario_Sabado',
    'Bloque_Ruta',
    'Orden_Ruta',
    'Estado',
    'Plan_Objetivo',
    'MRR_Proyectado_EUR',
    'Inicio_Piloto',
    'Fin_Piloto',
    'Ultima_Visita',
    'Proximo_Contacto',
    'Notas_Visita',
    'Motivo_Perdido',
    'Fecha_Creacion'
  ]

  const esc = (v: string | null | undefined) => `"${(v || '').replace(/"/g, '""')}"`

  const rows = leads.map((l) => [
    esc(l.id),
    esc(normalizeLeadCity(l)),
    esc(l.zone),
    esc(l.name),
    esc(l.address),
    esc(l.primary_type),
    esc(l.icp_segment),
    esc(l.contact_name),
    esc(l.contact_phone),
    esc(l.contact_whatsapp),
    esc(l.instagram_url || l.instagram),
    esc(l.facebook_url),
    l.google_rating ?? '',
    l.google_reviews_count ?? '',
    l.score,
    l.lead_score ?? '',
    esc(l.recommended_pitch),
    esc(l.online_menu_status || 'unknown'),
    esc(l.online_menu_url),
    esc(l.google_profile_url),
    esc(l.google_review_url),
    esc(l.saturday_hours),
    esc(l.route_block),
    l.route_order ?? '',
    esc(l.status),
    esc(l.target_plan),
    l.mrr_projected,
    esc(l.pilot_start_date),
    esc(l.pilot_end_date),
    esc(l.last_visit_date),
    esc(l.next_contact_date),
    esc(l.notes),
    esc(l.lost_reason),
    esc(l.created_at)
  ].join(','))

  // \uFEFF es el BOM de UTF-8 para que Excel en Windows reconozca tildes y caracteres especiales
  return '\uFEFF' + [headers.join(','), ...rows].join('\r\n')
}

export async function GET(req: NextRequest) {
  if (!verifyFounderRequest(req)) {
    return NextResponse.json({ error: 'Acceso no autorizado. Se requiere PIN de Fundador.' }, { status: 401 })
  }

  try {
    const leads = await getCRMLeads()
    const metrics = calculateCRMMetrics(leads)

    const url = new URL(req.url)
    const format = url.searchParams.get('format')

    if (format === 'csv') {
      const csvData = generateLeadsCSV(leads)
      return new NextResponse(csvData, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="fluxo-crm-leads-${new Date().toISOString().split('T')[0]}.csv"`
        }
      })
    }

    return NextResponse.json(
      { leads, metrics },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        },
      }
    )
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error al obtener leads' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  if (!verifyFounderRequest(req)) {
    return NextResponse.json({ error: 'Acceso no autorizado. Se requiere PIN de Fundador.' }, { status: 401 })
  }

  try {
    const body = await req.json()
    if (!body.name || !body.address) {
      return NextResponse.json({ error: 'Nombre y dirección son requeridos' }, { status: 400 })
    }

    const newLead = await createCRMLead(body)
    const allLeads = await getCRMLeads()
    const metrics = calculateCRMMetrics(allLeads)

    return NextResponse.json({ success: true, lead: newLead, metrics })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error al crear lead' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  if (!verifyFounderRequest(req)) {
    return NextResponse.json({ error: 'Acceso no autorizado. Se requiere PIN de Fundador.' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'ID de lead requerido' }, { status: 400 })
    }

    const updated = await updateCRMLead(id, updates)
    if (!updated) {
      return NextResponse.json({ error: 'Lead no encontrado' }, { status: 404 })
    }

    const allLeads = await getCRMLeads()
    const metrics = calculateCRMMetrics(allLeads)

    return NextResponse.json({ success: true, lead: updated, metrics })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error al actualizar lead' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  if (!verifyFounderRequest(req)) {
    return NextResponse.json({ error: 'Acceso no autorizado. Se requiere PIN de Fundador.' }, { status: 401 })
  }

  try {
    const url = new URL(req.url)
    const id = url.searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID de lead requerido' }, { status: 400 })
    }

    await deleteCRMLead(id)
    const allLeads = await getCRMLeads()
    const metrics = calculateCRMMetrics(allLeads)

    return NextResponse.json({ success: true, metrics })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error al eliminar lead' }, { status: 500 })
  }
}
