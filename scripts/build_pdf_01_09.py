import os
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

pdf_path = 'Lecciones_Fluxo_01_09_2026.pdf'
doc = SimpleDocTemplate(pdf_path, pagesize=A4, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
styles = getSampleStyleSheet()

title_style = ParagraphStyle('TitleStyle', parent=styles['Heading1'], fontName='Helvetica-Bold', fontSize=16, leading=20, textColor=colors.HexColor('#0f172a'))
h2_style = ParagraphStyle('H2Style', parent=styles['Heading2'], fontName='Helvetica-Bold', fontSize=11, leading=14, textColor=colors.HexColor('#1e40af'))
body_style = ParagraphStyle('BodyStyle', parent=styles['Normal'], fontName='Helvetica', fontSize=8.5, leading=12, textColor=colors.HexColor('#334155'))
callout_style = ParagraphStyle('Callout', parent=styles['Normal'], fontName='Helvetica-Oblique', fontSize=8.5, leading=12, textColor=colors.HexColor('#0f172a'))

story = []

story.append(Paragraph('FLUXO - Lección del Día: Sincronización Ininterrumpida y State Lock en Salón y Cocina', title_style))
story.append(Paragraph('01 de Septiembre de 2026 | Mentor de Programación & Program Data Fluxo', body_style))
story.append(Spacer(1, 8))

story.append(Paragraph('1. La Analogía del Restaurante: ¿Por qué las alertas nunca deben borrarse solas?', h2_style))
story.append(Paragraph('En un restaurante real, cuando una comanda o llamada entra a la pizarra del pase o a la libreta del camarero, la comanda NO se borra a los 5 segundos mágicamente. Se queda clavada con un imán en la barra hasta que el camarero o cocinero la atienden con sus propias manos. Eso es exactamente el <b>State Lock (Bloqueo de Estado)</b> que hemos blindado hoy.', body_style))
story.append(Spacer(1, 6))

table_data = [
  [Paragraph('<b>Módulo del Sistema</b>', body_style), Paragraph('<b>Operación en Restaurante</b>', body_style), Paragraph('<b>Blindaje y Certificación</b>', body_style)],
  [Paragraph('🌐 <b>Web Comercial & Leads</b><br/><i>(/, /legal)</i>', body_style), Paragraph('Planes (39€, 69€, 99€) y solicitud de prueba de 14 días a 0€ sin permanencia.', body_style), Paragraph('Notificación instantánea a Gmail por SMTP y persistencia de leads.', body_style)],
  [Paragraph('📱 <b>Carta Digital QR</b><br/><i>(/menu/[slug])</i>', body_style), Paragraph('Carta trilingüe (Galego, Español, Inglés), microservicios y filtro sin gluten/veggie.', body_style), Paragraph('Envío seguro en pending_validation para validación presencial del mozo.', body_style)],
  [Paragraph('🤵 <b>Comandero de Mozo</b><br/><i>(/staff/comandero)</i>', body_style), Paragraph('Semáforo de salón, validación verbal de comandas, marchar segundos y pre-cuenta.', body_style), Paragraph('State Lock: los avisos y cobros quedan 100% fijos hasta pulsar Atendido.', body_style)],
  [Paragraph('👨‍🍳 <b>Monitor Cocina KDS</b><br/><i>(/staff/kitchen)</i>', body_style), Paragraph('Comandas en tiempo real, filtro Cocina vs Barra, campana sonora y aviso fijo.', body_style), Paragraph('Reconciliación continua: los tickets no parpadean ni desaparecen en segundo plano.', body_style)]
]

t = Table(table_data, colWidths=[120, 200, 190])
t.setStyle(TableStyle([
  ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#f1f5f9')),
  ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
  ('TOPPADDING', (0,0), (-1,-1), 3),
  ('BOTTOMPADDING', (0,0), (-1,-1), 3),
]))
story.append(t)
story.append(Spacer(1, 8))

story.append(Paragraph('2. El Gran Circuito Gastronómico: Del QR al Ticket Final', h2_style))
story.append(Paragraph('• <b>1. Pedido del Cliente:</b> Nace protegido en el carrito y viaja a la nube con UUID único.<br/>• <b>2. Puerta del Mozo (Gatekeeper):</b> El camarero confirma que el cliente es real y pasa la comanda a cocina.<br/>• <b>3. Marcha en Cocina:</b> El chef ve el pedido, toca "Marchar" y al terminar toca "Listo".<br/>• <b>4. Cobro y Sobremesa:</b> El mozo imprime o muestra la pre-cuenta, divide en partes iguales y activa el booster de 5 estrellas en Google Maps.', body_style))
story.append(Spacer(1, 8))

story.append(Paragraph('3. Pregunta Didáctica del Día para el Alumno', h2_style))
story.append(Paragraph('¿Por qué es fundamental que la comanda del cliente pase primero por el mozo antes de que la cocina comience a cocinarla?<br/><i>Respuesta: Para evitar comandas falsas, errores accidentales del cliente y asegurar un trato humano y personalizado en mesa.</i>', body_style))
story.append(Spacer(1, 6))

story.append(Paragraph('💡 Conclusión: La tecnología debe trabajar para el hostelero, no al revés. Con State Lock y el circuito E2E validado al 100%, Fluxo está listo para triunfar en cualquier restaurante.', callout_style))

doc.build(story)
print('PDF actualizado exitosamente: ' + pdf_path)

