import os
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

pdf_path = 'Lecciones_Fluxo_01_09_2026.pdf'
doc = SimpleDocTemplate(pdf_path, pagesize=A4, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
styles = getSampleStyleSheet()

title_style = ParagraphStyle('TitleStyle', parent=styles['Heading1'], fontName='Helvetica-Bold', fontSize=18, leading=22, textColor=colors.HexColor('#0f172a'))
h2_style = ParagraphStyle('H2Style', parent=styles['Heading2'], fontName='Helvetica-Bold', fontSize=13, leading=16, textColor=colors.HexColor('#1e40af'))
body_style = ParagraphStyle('BodyStyle', parent=styles['Normal'], fontName='Helvetica', fontSize=10, leading=14, textColor=colors.HexColor('#334155'))
callout_style = ParagraphStyle('Callout', parent=styles['Normal'], fontName='Helvetica-Oblique', fontSize=9.5, leading=13.5, textColor=colors.HexColor('#0f172a'))

story = []

story.append(Paragraph('FLUXO - Leccion del Dia: Lanzamiento Fase 2 (Piloto Noia)', title_style))
story.append(Paragraph('01 de Septiembre de 2026 | Mentor de Programacion y COO', body_style))
story.append(Spacer(1, 12))

story.append(Paragraph('1. La Gran Analogia: El Ensayo General antes del Gran Estreno', h2_style))
story.append(Paragraph('Ayer encendimos la cocina industrial en la nube (Vercel y Supabase). Hoy entramos a la Fase 2: el Piloto en Noia. Es como invitar a los primeros 20 comensales a una cata privada: no buscamos cobrarles una suscripcion todavia, sino medir exactamente cuantos minutos les ahorramos a los camareros en la terraza y cuantas bebidas extra se piden gracias a la carta interactiva.', body_style))
story.append(Spacer(1, 10))

story.append(Paragraph('2. Las 3 Metricas de Oro del Piloto Gastronomico', h2_style))

table_data = [
  [Paragraph('<b>Metrica</b>', body_style), Paragraph('<b>Analogia de Sala</b>', body_style), Paragraph('<b>Impacto en el Hostelero</b>', body_style)],
  [Paragraph('Tiempo 1er Pedido', body_style), Paragraph('El comensal se sienta y pide la bebida en 30s sin esperar al mozo.', body_style), Paragraph('Elimina la sensacion de abandono en terrazas.', body_style)],
  [Paragraph('Rotacion de Mesa', body_style), Paragraph('Comer, pedir la cuenta y pagar sin esperas de 15 minutos.', body_style), Paragraph('Permite doblar mesas un 20% mas rapido en horas punta.', body_style)],
  [Paragraph('Ticket Medio', body_style), Paragraph('El comensal ve el postre o la bebida en foto HD y se tenta.', body_style), Paragraph('Aumento estimado del 12% al 18% en ventas secundarias.', body_style)]
]

t = Table(table_data, colWidths=[110, 200, 190])
t.setStyle(TableStyle([
  ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#f1f5f9')),
  ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
  ('TOPPADDING', (0,0), (-1,-1), 5),
  ('BOTTOMPADDING', (0,0), (-1,-1), 5),
]))
story.append(t)
story.append(Spacer(1, 14))

story.append(Paragraph('3. El Acuerdo Piloto de 14 Dias a 0 Euros', h2_style))
story.append(Paragraph('El hostelero gallego es pragmatico. Con el Desafio Terraza de 14 Dias a 0 Euros, eliminamos todo su riesgo. Nosotros instalamos las peanas y le damos soporte presencial. A cambio, obtenemos su testimonio y metricas reales para expandirnos por toda la Ria de Muros e Noia.', body_style))
story.append(Spacer(1, 12))

story.append(Paragraph('Consejo del Dia: En hosteleria, el software no debe notarse. El mozo sigue siendo el anfitrion, pero con un asistente invisible que le ahorra pasos en terraza.', callout_style))

doc.build(story)
print('PDF generado: ' + pdf_path)
