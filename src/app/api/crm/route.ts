import { NextRequest, NextResponse } from 'next/server'
import { verifyFounderRequest } from '@/lib/auth/crm-auth'
import {
  getCRMLeads,
  createCRMLead,
  updateCRMLead,
  deleteCRMLead,
  calculateCRMMetrics
} from '@/lib/supabase/repositories/crm.repository'
import { CRMLead } from '@/types/crm.types'

/**
 * Genera un archivo CSV compatible con Excel (UTF-8 con BOM)
 */
function generateLeadsCSV(leads: CRMLead[]): string {
  const headers = [
    'ID',
    'Nombre',
    'Direccion',
    'Zona',
    'Segmento_ICP',
    'Contacto_Nombre',
    'Telefono',
    'WhatsApp',
    'Instagram',
    'Google_Rating',
    'Google_Reviews',
    'Score',
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

  const rows = leads.map((l) => [
    `"${l.id}"`,
    `"${(l.name || '').replace(/"/g, '""')}"`,
    `"${(l.address || '').replace(/"/g, '""')}"`,
    `"${(l.zone || '').replace(/"/g, '""')}"`,
    `"${l.icp_segment}"`,
    `"${(l.contact_name || '').replace(/"/g, '""')}"`,
    `"${(l.contact_phone || '').replace(/"/g, '""')}"`,
    `"${(l.contact_whatsapp || '').replace(/"/g, '""')}"`,
    `"${(l.instagram || '').replace(/"/g, '""')}"`,
    l.google_rating ?? '',
    l.google_reviews_count ?? '',
    l.score,
    `"${l.status}"`,
    `"${l.target_plan}"`,
    l.mrr_projected,
    `"${l.pilot_start_date || ''}"`,
    `"${l.pilot_end_date || ''}"`,
    `"${l.last_visit_date || ''}"`,
    `"${l.next_contact_date || ''}"`,
    `"${(l.notes || '').replace(/"/g, '""')}"`,
    `"${(l.lost_reason || '').replace(/"/g, '""')}"`,
    `"${l.created_at || ''}"`
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

    return NextResponse.json({ leads, metrics })
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
