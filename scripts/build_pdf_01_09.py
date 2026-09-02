import os
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

pdf_path = 'Lecciones_Fluxo_02_09_2026.pdf'
doc = SimpleDocTemplate(pdf_path, pagesize=A4, rightMargin=32, leftMargin=32, topMargin=26, bottomMargin=26)
styles = getSampleStyleSheet()

title_style = ParagraphStyle('TitleStyle', parent=styles['Heading1'], fontName='Helvetica-Bold', fontSize=13, leading=16, textColor=colors.HexColor('#0f172a'))
h2_style = ParagraphStyle('H2Style', parent=styles['Heading2'], fontName='Helvetica-Bold', fontSize=9.5, leading=12, textColor=colors.HexColor('#1e40af'))
body_style = ParagraphStyle('BodyStyle', parent=styles['Normal'], fontName='Helvetica', fontSize=7.5, leading=10, textColor=colors.HexColor('#334155'))
callout_style = ParagraphStyle('Callout', parent=styles['Normal'], fontName='Helvetica-Oblique', fontSize=7.8, leading=10, textColor=colors.HexColor('#0f172a'))

story = []

story.append(Paragraph('FLUXO - Lección del Día: Causa Raíz, Bloqueo Optimista e Integridad de Comandas', title_style))
story.append(Paragraph('02 de Septiembre de 2026 | Mentor de Programación & Program Data Fluxo', body_style))
story.append(Spacer(1, 5))

story.append(Paragraph('1. La Analogía del Restaurante: La Comanda Física vs La Sincronización Digital', h2_style))
story.append(Paragraph('En un restaurante tradicional, cuando el jefe de cocina agarra la comanda de la Mesa #7 y grita <i>"¡Marchando dos hamburguesas!"</i>, esa orden queda fija en el riel de cocina. '
                       'En el mundo digital ocurría un error crítico por falta de un cerrojo de estado:<br/>'
                       '• <b>El Problema del Rebote:</b> Al tocar <i>"Iniciar Preparación"</i>, la pantalla cambiaba a <i>"Marcar Listo"</i>, pero un segundo después la comprobación automática de fondo (polling) devolvía el estado antiguo y la comanda volvía a <i>"Iniciar Preparación"</i>.<br/>'
                       '• <b>La Solución (Bloqueo Optimista):</b> Hemos implementado un cerrojo que respeta la acción táctil del cocinero de inmediato y bloquea cualquier sobreescritura de fondo durante 10 segundos.<br/>'
                       '• <b>Protección de Mesa & Platos:</b> Se eliminó la creación de pedidos sintéticos que forzaban la mesa a #1 o limpiaban los platos. Mesa #7 mantiene sus 3 productos intactos de principio a fin.', body_style))
story.append(Spacer(1, 5))

table_data = [
  [Paragraph('<b>Módulo / Pantalla</b>', body_style), Paragraph('<b>Comportamiento Anterior vs Corregido</b>', body_style), Paragraph('<b>Impacto Operativo en el Restaurante</b>', body_style)],
  [Paragraph('👨‍🍳 <b>Cocina KDS</b><br/><i>(Tachar Platos)</i>', body_style), Paragraph('Bloqueado tachar antes de Iniciar Preparación. Solo al marchar se activa el tachado individual y "Tachar Todo".', body_style), Paragraph('Evita que el cocinero marque platos como listos antes de haberlos puesto al fuego.', body_style)],
  [Paragraph('🔒 <b>Blindaje de Estado</b><br/><i>(Anti-Rebote)</i>', body_style), Paragraph('Al pulsar "Iniciar Preparación" queda firme en "Listo para Servir" sin retroceder jamás.', body_style), Paragraph('Tranquilidad absoluta para el personal: los botones responden al primer toque.', body_style)],
  [Paragraph('📱 <b>Carta del Comensal</b><br/><i>(Barra de Fases)</i>', body_style), Paragraph('La barra superior muestra siempre las 5 fases (Validación, Cola, Fogones, Listo, Servido) sin parpadear.', body_style), Paragraph('El cliente sabe en todo momento el avance real de su comida desde su móvil.', body_style)],
  [Paragraph('🏷️ <b>Integridad de Mesa #7</b><br/><i>(Backend & Memoria)</i>', body_style), Paragraph('Sincronización unificada de IDs entre servidor y cliente. Cero reseteos a Mesa #1 o ítems vacíos.', body_style), Paragraph('Cero confusiones entre mesas: cada plato llega a quien lo pidió.', body_style)]
]

t = Table(table_data, colWidths=[115, 220, 195])
t.setStyle(TableStyle([
  ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#f1f5f9')),
  ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
  ('TOPPADDING', (0,0), (-1,-1), 2.5),
  ('BOTTOMPADDING', (0,0), (-1,-1), 2.5),
]))
story.append(t)
story.append(Spacer(1, 5))

story.append(Paragraph('2. ¿Cuál era el Factor Común de los errores que aparecían y desaparecían?', h2_style))
story.append(Paragraph('El factor común era una <b>carrera de sincronización (Race Condition)</b> entre tres capas:<br/>'
                       '1. El estado local en pantalla (que respondía al toque inmediato).<br/>'
                       '2. El almacenamiento en memoria del servidor (que si no encontraba el ID creaba un pedido vacío para Mesa 1).<br/>'
                       '3. La consulta de fondo cada 1.5s (que sobreescribía la pantalla con los datos antiguos antes de que el servidor guardara el cambio).<br/>'
                       'Al unificar los IDs y aplicar el <b>Bloqueo Optimista</b>, el sistema queda 100% blindado y estable.', body_style))
story.append(Spacer(1, 5))

story.append(Paragraph('3. Pregunta Didáctica para el Alumno', h2_style))
story.append(Paragraph('¿Por qué en un sistema en tiempo real como Fluxo es necesario un "Bloqueo Optimista" de 10 segundos al tocar un botón?<br/>'
                       '<i>Respuesta: Porque la red puede tardar unos milisegundos en responder. El bloqueo optimista asegura que la pantalla del usuario no tiemble ni rebote hacia atrás mientras la base de datos procesa la orden.</i>', body_style))
story.append(Spacer(1, 4))

story.append(Paragraph('💡 Conclusión: Un software gastronómico de élite debe ser tan sólido como una roca: lo que se toca en pantalla es ley y la información de sala y cocina permanece sincronizada a la perfección.', callout_style))

doc.build(story)
print('PDF generado exitosamente: ' + pdf_path)



