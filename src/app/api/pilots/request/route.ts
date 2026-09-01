import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { sendPilotLeadNotification } from '@/lib/email'

interface PilotRequestBody {
  restaurantName: string
  contactName: string
  contactRole?: string
  phone: string
  location?: string
  selectedPlan: string
  notes?: string
}

export async function POST(req: NextRequest) {
  try {
    const body: PilotRequestBody = await req.json()

    if (!body.restaurantName || !body.contactName || !body.phone) {
      return NextResponse.json(
        { error: 'Por favor completa el nombre del restaurante, tu nombre y teléfono de contacto.' },
        { status: 400 }
      )
    }

    // Registro en logs del servidor
    console.log('[LEAD PILOTO 14 DÍAS] Solicitud recibida:', {
      restaurant: body.restaurantName,
      contact: body.contactName,
      role: body.contactRole || 'No especificado',
      phone: body.phone,
      location: body.location || 'No especificada',
      plan: body.selectedPlan || 'Plan Full',
      notes: body.notes || '',
      date: new Date().toISOString()
    })

    // Enviar notificación a Gmail en segundo plano
    try {
      await sendPilotLeadNotification({
        restaurantName: body.restaurantName,
        contactName: body.contactName,
        contactRole: body.contactRole,
        phone: body.phone,
        location: body.location,
        selectedPlan: body.selectedPlan,
        notes: body.notes
      })
    } catch (emailErr) {
      console.warn('[LEAD PILOTO] Nota: no se pudo despachar el email (verificar configuración de Gmail):', emailErr)
    }

    // Intentar persistir en Supabase si está disponible
    try {
      const supabase = createServerClient()
      if (supabase) {
        await supabase.from('pilot_leads').insert([
          {
            restaurant_name: body.restaurantName,
            contact_name: body.contactRole ? `${body.contactName} (${body.contactRole})` : body.contactName,
            phone: body.phone,
            location: body.location || null,
            selected_plan: body.selectedPlan,
            notes: body.notes || null,
            created_at: new Date().toISOString(),
            status: 'pending'
          }
        ])
      }
    } catch (dbErr) {
      console.warn('[LEAD PILOTO] Nota: lead registrado en memoria/logs:', dbErr)
    }

    return NextResponse.json({
      success: true,
      message: '¡Solicitud recibida con éxito! Nos pondremos en contacto contigo a la brevedad.'
    })
  } catch (error: any) {
    console.error('Error al procesar solicitud de piloto:', error)
    return NextResponse.json(
      { error: 'Hubo un inconveniente al procesar tu solicitud. Por favor intenta nuevamente.' },
      { status: 500 }
    )
  }
}
