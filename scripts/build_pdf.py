import os
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

pdf_path = 'Lecciones_Fluxo_31_08_2026.pdf'
doc = SimpleDocTemplate(pdf_path, pagesize=A4, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
styles = getSampleStyleSheet()

title_style = ParagraphStyle('TitleStyle', parent=styles['Heading1'], fontName='Helvetica-Bold', fontSize=18, leading=22, textColor=colors.HexColor('#0f172a'))
h2_style = ParagraphStyle('H2Style', parent=styles['Heading2'], fontName='Helvetica-Bold', fontSize=13, leading=16, textColor=colors.HexColor('#1e40af'))
body_style = ParagraphStyle('BodyStyle', parent=styles['Normal'], fontName='Helvetica', fontSize=10, leading=14, textColor=colors.HexColor('#334155'))
callout_style = ParagraphStyle('Callout', parent=styles['Normal'], fontName='Helvetica-Oblique', fontSize=9.5, leading=13.5, textColor=colors.HexColor('#0f172a'))

story = []

story.append(Paragraph('FLUXO - Lecciones de Programacion y Arquitectura', title_style))
story.append(Paragraph('31 de Agosto de 2026 | Mentor de Programacion y COO', body_style))
story.append(Spacer(1, 12))

story.append(Paragraph('1. La Gran Analogia: De la PC Local a la Cocina Central (Vercel + Supabase)', h2_style))
story.append(Paragraph('Cuando corres la app en tu ordenador con un tunel (Fase 1), es como si cocinaras en el quincho de tu casa: si apagas el ordenador o se corta el Wi-Fi, la terraza se queda sin carta. Al desplegar en Vercel + Supabase (Fase 2), inauguramos una cocina industrial central 24/7 que nunca cierra.', body_style))
story.append(Spacer(1, 10))

story.append(Paragraph('2. Por que separamos Program Data de la Sala?', h2_style))
story.append(Paragraph('En un restaurante, los camareros no entran a reparar los conductos de gas durante el servicio. Todo el desarrollo, base de datos, seguridad RLS y APIs se gestionan estrictamente en Program Data (Ingenieria) para garantizar que la sala (Marketing y Diseno) opere sin fricciones.', body_style))
story.append(Spacer(1, 10))

story.append(Paragraph('3. El Circuito de 5 Estados de Fluxo', h2_style))

table_data = [
  [Paragraph('<b>Estado</b>', body_style), Paragraph('<b>Rol Gastronomico</b>', body_style), Paragraph('<b>Accion en Software</b>', body_style)],
  [Paragraph('pending_validation', body_style), Paragraph('Comensal en terraza', body_style), Paragraph('Gatekeeper activo (no entra a cocina)', body_style)],
  [Paragraph('pending', body_style), Paragraph('Mozo de sala', body_style), Paragraph('Validacion y marcha a cocina', body_style)],
  [Paragraph('preparing', body_style), Paragraph('Cocinero en fogones', body_style), Paragraph('KDS Tactil en marcha (timer)', body_style)],
  [Paragraph('delivered', body_style), Paragraph('Pase y entrega', body_style), Paragraph('Plato servido en mesa', body_style)],
  [Paragraph('paid', body_style), Paragraph('Caja y Despedida', body_style), Paragraph('Google Review Booster (5 estrellas)', body_style)]
]

t = Table(table_data, colWidths=[120, 150, 230])
t.setStyle(TableStyle([
  ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#f1f5f9')),
  ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
  ('TOPPADDING', (0,0), (-1,-1), 5),
  ('BOTTOMPADDING', (0,0), (-1,-1), 5),
]))
story.append(t)
story.append(Spacer(1, 14))

story.append(Paragraph('Consejo del Dia: Nunca modifiques la base de datos directo en produccion sin pasar por el schema.sql y probar el build local. Excelencia en cada pase!', callout_style))

doc.build(story)
print('PDF didactico generado correctamente: ' + pdf_path)
