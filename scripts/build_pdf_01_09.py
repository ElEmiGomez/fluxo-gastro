import os
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

pdf_path = 'Lecciones_Fluxo_01_09_2026.pdf'
doc = SimpleDocTemplate(pdf_path, pagesize=A4, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
styles = getSampleStyleSheet()

title_style = ParagraphStyle('TitleStyle', parent=styles['Heading1'], fontName='Helvetica-Bold', fontSize=17, leading=21, textColor=colors.HexColor('#0f172a'))
h2_style = ParagraphStyle('H2Style', parent=styles['Heading2'], fontName='Helvetica-Bold', fontSize=12, leading=15, textColor=colors.HexColor('#1e40af'))
body_style = ParagraphStyle('BodyStyle', parent=styles['Normal'], fontName='Helvetica', fontSize=9.5, leading=13.5, textColor=colors.HexColor('#334155'))
callout_style = ParagraphStyle('Callout', parent=styles['Normal'], fontName='Helvetica-Oblique', fontSize=9, leading=13, textColor=colors.HexColor('#0f172a'))

story = []

story.append(Paragraph('FLUXO - Lección del Día: 3 Perfiles Demo en Producción y Cloud Triad', title_style))
story.append(Paragraph('01 de Septiembre de 2026 | Mentor de Programación & Program Data', body_style))
story.append(Spacer(1, 10))

story.append(Paragraph('1. La Gran Analogía: 3 Restaurantes Reales bajo un Mismo Techo Tecnológico', h2_style))
story.append(Paragraph('Así como un buen hostelero puede gestionar una hamburguesería moderna, una tapería tradicional gallega y una terraza de copas frente a la ría con el mismo estándar de excelencia, Fluxo cuenta hoy con 3 Perfiles Demo Certificados en Producción 24/7 en Noia:', body_style))
story.append(Spacer(1, 8))

table_data = [
  [Paragraph('<b>Perfil Demo</b>', body_style), Paragraph('<b>Concepto Gastronómico</b>', body_style), Paragraph('<b>Flujo Operativo Clave</b>', body_style)],
  [Paragraph('🍔 <b>Burger Gourmet Noia</b><br/><i>(Alameda)</i>', body_style), Paragraph('Smash Burgers de Rubia Gallega, Queso San Simón y Cervezas 1906.', body_style), Paragraph('Modificadores de punto de carne, extras de queso y combos de terraza.', body_style)],
  [Paragraph('🐙 <b>Tapería Casco Antigo</b><br/><i>(Casco Histórico)</i>', body_style), Paragraph('Pulpo á Feira, Zamburiñas da Ría, Pementos de Padrón y Vinos D.O.', body_style), Paragraph('Raciones para compartir, maridajes de Albariño/Mencía y postres típicos.', body_style)],
  [Paragraph('🍸 <b>Terraza Malecón</b><br/><i>(Paseo Marítimo)</i>', body_style), Paragraph('Cafés de especialidad, tostas, vermús Petroni, cócteles y gin tonics.', body_style), Paragraph('Alta rotación de tardeo, avisos rápidos de cuenta y vistas a la ría.', body_style)]
]

t = Table(table_data, colWidths=[130, 200, 180])
t.setStyle(TableStyle([
  ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#f1f5f9')),
  ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
  ('TOPPADDING', (0,0), (-1,-1), 4),
  ('BOTTOMPADDING', (0,0), (-1,-1), 4),
]))
story.append(t)
story.append(Spacer(1, 10))

story.append(Paragraph('2. El Triángulo Cloud: GitHub + Vercel + Supabase', h2_style))
story.append(Paragraph('• <b>GitHub:</b> El libro de recetas maestro donde queda registrado cada cambio de código sin riesgo de pérdida.<br/>• <b>Vercel Edge:</b> El ejército de mozos ultra-rápidos que entregan la carta a los móviles en milisegundos.<br/>• <b>Supabase Cloud:</b> La caja fuerte y el pase de cocina blindado con seguridad RLS para que ninguna mesa ni restaurante se mezclen.', body_style))
story.append(Spacer(1, 10))

story.append(Paragraph('3. Certificación de Calidad: Build 0 Errores', h2_style))
story.append(Paragraph('El código ha sido empaquetado y certificado al 100% con Next.js 14 en producción. Todas las rutas (/menu, /staff/comandero, /staff/kitchen, /staff/qr) y APIs térmicas ESC/POS están activas y listas para pruebas en vivo en Noia.', body_style))
story.append(Spacer(1, 10))

story.append(Paragraph('💡 Consejo del Día: La mejor tecnología para un restaurante es la que no se nota: el camarero sigue siendo el alma del local, y Fluxo es su herramienta invisible para no perder ni un solo paso.', callout_style))

doc.build(story)
print('PDF generado exitosamente: ' + pdf_path)
