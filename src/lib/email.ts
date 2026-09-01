import nodemailer from 'nodemailer'

export interface PilotLeadEmailData {
  restaurantName: string
  contactName: string
  contactRole?: string
  phone: string
  location?: string
  selectedPlan: string
  notes?: string
}

export async function sendPilotLeadNotification(data: PilotLeadEmailData): Promise<boolean> {
  const gmailUser = process.env.GMAIL_USER || process.env.SMTP_USER
  const gmailPass = process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS
  const targetEmail = process.env.LEAD_NOTIFICATION_EMAIL || gmailUser

  if (!gmailUser || !gmailPass || !targetEmail) {
    console.log('[EMAIL SERVICE] GMAIL_USER o GMAIL_APP_PASSWORD no configurados en .env.local. El lead se registra en servidor.')
    return false
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailPass
      }
    })

    const cleanPhone = data.phone.replace(/[^0-9]/g, '')
    const whatsappUrl = 'https://wa.me/' + cleanPhone

    const htmlContent = '<div style="font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif; background-color: #0b1120; color: #e2e8f0; padding: 24px; border-radius: 16px; max-width: 600px; margin: 0 auto;">' +
      '<div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 20px; border-radius: 12px; border-bottom: 2px solid #06b6d4; text-align: center; margin-bottom: 20px;">' +
        '<div style="display: inline-block; padding: 4px 12px; border-radius: 9999px; background-color: rgba(16, 185, 129, 0.2); color: #34d399; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px;">' +
          'NUEVA SOLICITUD DE PILOTO 14 DIAS' +
        '</div>' +
        '<h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 900;">Nuevo Restaurante Interesado en Fluxo</h1>' +
      '</div>' +
      '<div style="background-color: #0f172a; border: 1px solid #334155; border-radius: 12px; padding: 20px; margin-bottom: 20px; line-height: 1.6;">' +
        '<p style="margin: 0 0 10px 0;"><strong>Restaurante / Bar:</strong> <span style="color: #22d3ee; font-size: 18px; font-weight: bold;">' + data.restaurantName + '</span></p>' +
        '<hr style="border: 0; border-top: 1px solid #1e293b; margin: 12px 0;" />' +
        '<p style="margin: 0 0 8px 0;"><strong>Persona de Contacto:</strong> <span style="color: #ffffff;">' + data.contactName + '</span></p>' +
        (data.contactRole ? '<p style="margin: 0 0 8px 0;"><strong>Cargo / Puesto:</strong> <span style="color: #e2e8f0;">' + data.contactRole + '</span></p>' : '') +
        '<p style="margin: 0 0 8px 0;"><strong>Telefono / WhatsApp:</strong> <span style="color: #34d399; font-weight: bold;">' + data.phone + '</span></p>' +
        '<p style="margin: 0 0 8px 0;"><strong>Poblacion / Zona:</strong> <span style="color: #cbd5e1;">' + (data.location || 'No especificada') + '</span></p>' +
        '<p style="margin: 0 0 8px 0;"><strong>Plan Elegido:</strong> <span style="color: #38bdf8; font-weight: bold;">' + data.selectedPlan + '</span></p>' +
        (data.notes ? '<p style="margin: 0 0 8px 0;"><strong>Notas / Carta:</strong> <span style="color: #94a3b8;">' + data.notes + '</span></p>' : '') +
      '</div>' +
      '<div style="text-align: center; margin-top: 24px;">' +
        '<a href="' + whatsappUrl + '" style="display: inline-block; padding: 14px 22px; background-color: #10b981; color: #ffffff; text-decoration: none; font-weight: bold; border-radius: 10px; font-size: 14px; margin-right: 10px;">' +
          'Abrir Chat de WhatsApp' +
        '</a>' +
        '<a href="tel:' + data.phone + '" style="display: inline-block; padding: 14px 22px; background-color: #0284c7; color: #ffffff; text-decoration: none; font-weight: bold; border-radius: 10px; font-size: 14px;">' +
          'Llamar por Telefono' +
        '</a>' +
      '</div>' +
      '<div style="margin-top: 24px; text-align: center; font-size: 11px; color: #64748b;">' +
        'Fluxo Gastronomic System - Notificacion automatica en tiempo real.' +
      '</div>' +
    '</div>';

    const roleInfo = data.contactRole ? ' (' + data.contactRole + ')' : ''

    await transporter.sendMail({
      from: '"Fluxo - Nuevo Lead" <' + gmailUser + '>',
      to: targetEmail,
      subject: 'Fluxo - Nuevo Lead: ' + data.restaurantName + ' - ' + data.contactName + roleInfo + ' (' + data.selectedPlan + ')',
      text: 'Fluxo - Nuevo Lead: Nueva solicitud de piloto 14 dias para ' + data.restaurantName + '. Contacto: ' + data.contactName + roleInfo + ', Tel: ' + data.phone + ', Plan: ' + data.selectedPlan,
      html: htmlContent
    })

    console.log('[EMAIL SERVICE] Notificacion enviada con exito a ' + targetEmail)
    return true
  } catch (error) {
    console.error('[EMAIL SERVICE] Error al enviar email:', error)
    return false
  }
}
