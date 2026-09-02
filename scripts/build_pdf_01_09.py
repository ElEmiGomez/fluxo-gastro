import os
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

pdf_path = 'Lecciones_Fluxo_02_09_2026.pdf'
doc = SimpleDocTemplate(pdf_path, pagesize=A4, rightMargin=32, leftMargin=32, topMargin=26, bottomMargin=26)
styles = getSampleStyleSheet()

title_style = ParagraphStyle('TitleStyle', parent=styles['Heading1'], fontName='Helvetica-Bold', fontSize=13.5, leading=16.5, textColor=colors.HexColor('#0f172a'))
h2_style = ParagraphStyle('H2Style', parent=styles['Heading2'], fontName='Helvetica-Bold', fontSize=9.5, leading=12, textColor=colors.HexColor('#1e40af'))
body_style = ParagraphStyle('BodyStyle', parent=styles['Normal'], fontName='Helvetica', fontSize=7.6, leading=10.2, textColor=colors.HexColor('#334155'))
callout_style = ParagraphStyle('Callout', parent=styles['Normal'], fontName='Helvetica-Oblique', fontSize=7.8, leading=10.2, textColor=colors.HexColor('#0f172a'))

story = []

story.append(Paragraph('FLUXO - Lección del Día: El Mozo como Guardián de Sala y la Cocina en Tiempo Real', title_style))
story.append(Paragraph('02 de Septiembre de 2026 | Mentor de Programación & Program Data Fluxo', body_style))
story.append(Spacer(1, 5))

story.append(Paragraph('1. La Analogía del Restaurante: La Jerarquía y el Orden de la Comanda', h2_style))
story.append(Paragraph('En un restaurante de alto rendimiento, nunca un cliente entra a los fogones a gritarle al cocinero lo que quiere comer. '
                       'El flujo natural y seguro funciona como una sinfonía perfectamente coordinada:<br/>'
                       '• <b>1. El Comensal (La Mesa):</b> Elige sus platos con tranquilidad en su móvil, ve fotos y suma sugerencias. Al terminar, toca <b>"Enviar Comanda al Mozo"</b> (nace en espera de validación). Cero riesgo de error o pedidos fantasma.<br/>'
                       '• <b>2. El Mozo (El Guardián):</b> Se acerca a la mesa, corrobora que hay clientes reales y que no hay dudas. Toca <b>"Confirmar a Cocina"</b> y el pedido marcha directamente a los fogones.<br/>'
                       '• <b>3. El Mozo en Barra/Salón (Comanda Directa):</b> Cuando el camarero toma comanda a mano, dispone del botón directo <b>"Enviar a Cocina"</b> sin intermediarios.<br/>'
                       '• <b>4. La Cocina (KDS Pantalla Táctil):</b> Solo recibe comandas aprobadas por el personal de sala, evitando marchar comida innecesaria.', body_style))
story.append(Spacer(1, 5))

table_data = [
  [Paragraph('<b>Punto de la Operación</b>', body_style), Paragraph('<b>Experiencia Visual & Flujo</b>', body_style), Paragraph('<b>Impacto Operativo Fluxo</b>', body_style)],
  [Paragraph('🛒 <b>Carrito del Cliente</b><br/><i>(Menú Digital QR)</i>', body_style), Paragraph('1º Platos elegidos &rarr; 2º Sugerencias compactas con acordeón &rarr; 3º Tranquilidad Total.', body_style), Paragraph('Diseño limpio y sin sobrecarga visual para personas mayores o terrazas.', body_style)],
  [Paragraph('💡 <b>Guía de 3 Pasos</b><br/><i>(Micro-Onboarding)</i>', body_style), Paragraph('Paso 1: Scroll a platos. Paso 2: Abrir comanda. Paso 3: Llamar al mozo / rondas.', body_style), Paragraph('Inicia cerrado por defecto para no tapar la carta; accionable con 1 toque.', body_style)],
  [Paragraph('👨‍🍳 <b>Sincronización Mozo &rarr; Cocina</b><br/><i>(Comandero y KDS)</i>', body_style), Paragraph('Validación en mesa y comandas de mozo marchan a cocina al instante vía SSE.', body_style), Paragraph('Cero pedidos perdidos o desincronizados entre dispositivos móviles y PC.', body_style)],
  [Paragraph('🇪🇸 <b>Idioma de Sala y Cocina</b><br/><i>(Paneles de Personal)</i>', body_style), Paragraph('Comandero y Cocina siempre en Español. Traducción sólo en la carta del cliente.', body_style), Paragraph('Claridad operativa inmediata para todo el equipo de trabajo del local.', body_style)]
]

t = Table(table_data, colWidths=[120, 215, 195])
t.setStyle(TableStyle([
  ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#f1f5f9')),
  ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
  ('TOPPADDING', (0,0), (-1,-1), 2.5),
  ('BOTTOMPADDING', (0,0), (-1,-1), 2.5),
]))
story.append(t)
story.append(Spacer(1, 5))

story.append(Paragraph('2. ¿Por qué es vital que el cliente NUNCA envíe directo a cocina?', h2_style))
story.append(Paragraph('Si un cliente pudiera enviar directo a cocina sin pasar por el mozo:<br/>'
                       '1. Se generarían comandas por error de niños jugando con el móvil.<br/>'
                       '2. Cocina empezaría a preparar platos en mesas vacías si alguien escaneó el QR por curiosidad.<br/>'
                       '3. Con el filtro de validación de Fluxo, <b>el mozo tiene el control total de los tiempos y de la sala</b>.', body_style))
story.append(Spacer(1, 5))

story.append(Paragraph('3. Pregunta Didáctica para el Alumno', h2_style))
story.append(Paragraph('¿Por qué el banner de guía inicia cerrado por defecto y tiene sólo 3 pasos interactivos?<br/>'
                       '<i>Respuesta: Para que la carta del comensal respire limpia desde el primer segundo en cualquier móvil, y si el cliente tiene dudas, con 1 toque la guía lo lleva directo a ver los platos, abrir la comanda o llamar al mozo.</i>', body_style))
story.append(Spacer(1, 4))

story.append(Paragraph('💡 Conclusión: La experiencia de usuario en hostelería debe ser tan fluida y natural como la atención humana: clara, sin botones confusos y con el personal siempre al mando.', callout_style))

doc.build(story)
print('PDF generado exitosamente: ' + pdf_path)



