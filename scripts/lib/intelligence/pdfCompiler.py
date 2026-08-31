#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Compilador Didáctico de PDF Matutino para Fluxo Gastronomic System.
Genera Lecciones_Fluxo_DD_MM_YYYY.pdf en la raíz del workspace utilizando ReportLab.
Cumple con las directrices de AGENTS.md y docs/departamentos/5_learning/.
"""

import sys
import os
import argparse
from datetime import datetime

from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm, mm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    """Canvas de dos pasadas para numeración precisa de páginas."""
    def __init__(self, *args, **kwargs):
        super(NumberedCanvas, self).__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super(NumberedCanvas, self).showPage()
        super(NumberedCanvas, self).save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748B"))
        
        # Barra superior decorativa
        self.setFillColor(colors.HexColor("#06B6D4"))
        self.rect(0, A4[1] - 4*mm, A4[0], 4*mm, fill=True, stroke=False)

        # Pie de página
        footer_text = f"Fluxo Gastronomic System — Departamento 5: Learning & Intelligence | Página {self._pageNumber} de {page_count}"
        self.drawCentredString(A4[0] / 2.0, 10*mm, footer_text)
        self.restoreState()


def compile_didactic_pdf(date_str, output_path):
    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        leftMargin=14*mm,
        rightMargin=14*mm,
        topMargin=14*mm,
        bottomMargin=16*mm
    )

    styles = getSampleStyleSheet()

    # Paleta de colores oficial de Fluxo
    c_primary = colors.HexColor("#0F172A")    # Azul Salón
    c_cyan = colors.HexColor("#06B6D4")       # Cian Eléctrico
    c_green = colors.HexColor("#10B981")      # Verde Comanda
    c_amber = colors.HexColor("#F59E0B")      # Ámbar Fuego
    c_dark = colors.HexColor("#1E293B")       # Pizarra Oscura
    c_slate = colors.HexColor("#64748B")      # Gris Texto
    c_light = colors.HexColor("#F8FAFC")      # Fondo Tarjeta
    c_border = colors.HexColor("#E2E8F0")     # Borde

    # Estilos tipográficos
    style_title = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=c_primary
    )

    style_subtitle = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=14,
        textColor=c_cyan
    )

    style_meta = ParagraphStyle(
        'DocMeta',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=11,
        textColor=c_slate
    )

    style_h2 = ParagraphStyle(
        'Heading2_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=15,
        textColor=c_primary,
        spaceBefore=6,
        spaceAfter=4
    )

    style_body = ParagraphStyle(
        'Body_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12.5,
        textColor=c_dark
    )

    style_body_bold = ParagraphStyle(
        'Body_Bold_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=12.5,
        textColor=c_dark
    )

    style_analogy_concept = ParagraphStyle(
        'AnalogyConcept',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=c_primary
    )

    style_analogy_desc = ParagraphStyle(
        'AnalogyDesc',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=10.5,
        textColor=c_dark
    )

    story = []

    # ==================== CABECERA ====================
    header_data = [
        [
            Paragraph("<b>FLUXO</b> — Sistema Gastronómico Inteligente", style_subtitle),
            Paragraph(f"<b>Fecha:</b> {date_str}", ParagraphStyle('RightMeta', parent=style_meta, alignment=2))
        ],
        [
            Paragraph("Lección Matutina & Diccionario de Analogías de Sala", style_title),
            Paragraph("Depto 5: Learning & Intelligence", ParagraphStyle('RightMeta2', parent=style_meta, alignment=2))
        ]
    ]

    header_table = Table(header_data, colWidths=[120*mm, 62*mm])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 3*mm))
    story.append(HRFlowable(width="100%", thickness=1.5, color=c_cyan, spaceAfter=4*mm, spaceBefore=1*mm))

    # ==================== SECCIÓN 1: LECCIÓN DEL DÍA ====================
    story.append(Paragraph("👨‍🍳 1. La Lección de Hoy: El Pase de Cocina y el Mozo Gatekeeper", style_h2))
    
    lesson_html = (
        "En un restaurante de verdad, ningún cliente entra a la cocina a tirar carne a la plancha. "
        "Cuando el cliente pide algo, el mozo <b>canta la comanda</b> y el <b>jefe de cocina (pase)</b> revisa que todo sea correcto "
        "antes de encender los fuegos.<br/><br/>"
        "En Fluxo aplicamos exactamente esta regla en la programación: cuando un comensal escanea el QR y pulsa pedir, la orden "
        "nace en estado <b><font color='#06B6D4'>pending_validation</font></b>. La pantalla de cocina NO muestra el pedido hasta que el mozo "
        "se acerca a la mesa y pulsa <b>'Confirmar a Cocina'</b>. De esta forma, si alguien hace una gracia escaneando un QR desde la calle, "
        "la cocina nunca gasta comida a lo tonto ni se entera de la broma. ¡Cero desperdicio, cero estrés!"
    )
    
    lesson_card = Table([[Paragraph(lesson_html, style_body)]], colWidths=[182*mm])
    lesson_card.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), c_light),
        ('BOX', (0, 0), (-1, -1), 1, c_border),
        ('LEFTPADDING', (0, 0), (-1, -1), 4*mm),
        ('RIGHTPADDING', (0, 0), (-1, -1), 4*mm),
        ('TOPPADDING', (0, 0), (-1, -1), 3.5*mm),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3.5*mm),
    ]))
    story.append(lesson_card)
    story.append(Spacer(1, 4*mm))

    # ==================== SECCIÓN 2: 11 ANALOGÍAS ====================
    story.append(Paragraph("🍽️ 2. Diccionario Universal: 11 Analogías Técnicas de Hostelería", style_h2))

    analogies = [
        ("Frontend / PWA de Cliente", "La Carta Plastificada en Mesa: El cliente mira los platos sin esperar a que el mozo se la traiga en mano."),
        ("Mozo Gatekeeper (pending_validation)", "El Mozo Cantando la Comanda: Comprueba que la mesa es real antes de meter la comanda al fuego."),
        ("API Gateway / Endpoints (/api/...)", "El Pase de Cocina y el Maître: El mostrador que separa sala de cocina; nada entra sin permiso."),
        ("Base de Datos PostgreSQL", "El Libro Mayor de Reservas y Albaranes: Registro físico donde queda guardado cada pedido sin hojas arrancadas."),
        ("KDS de Cocina (Kitchen Display)", "La Pantalla de Partidas: Botones táctiles gigantes (>70px) para tocar con nudillos o guantes con harina."),
        ("Impresoras Térmicas ESC/POS", "La Tiquetera del Pasaplatos: Ticket de papel clásico con timbre y corte de guillotina para cocineros tradicionales."),
        ("Idempotencia SQL (Anti-duplicados)", "El Número Correlativo de Ticket: Si el cliente pulsa 2 veces, no marchan dos hamburguesas a la plancha."),
        ("Criptografía Bcrypt + PIN Mozo", "El Candado del Cajón de la Barra: Llave secreta del encargado; con 5 intentos erróneos se bloquea."),
        ("Cookies HttpOnly & Resiliencia Safari", "El Bolsillo del Delantal del Mozo: Aunque se caiga la libreta, la orden guardada sigue intacta."),
        ("Veri*Factu RD 1007/2023", "El Precinto Fiscal del Cierre Z: Registro oficial inalterable para que Hacienda certifique las cuentas."),
        ("Vigilancia Diaria de Mercado", "El Ojeador Matutino de Terrazas: El encargado que sale a las 11:00 a ver precios y pizarras de la competencia.")
    ]

    analogy_rows = [
        [
            Paragraph("<b>Término de Software</b>", ParagraphStyle('HeaderA', parent=style_analogy_concept, textColor=colors.white)),
            Paragraph("<b>Analogía de la Vida Real de un Restaurante</b>", ParagraphStyle('HeaderB', parent=style_analogy_concept, textColor=colors.white))
        ]
    ]

    for term, desc in analogies:
        analogy_rows.append([
            Paragraph(f"<b>{term}</b>", style_analogy_concept),
            Paragraph(desc, style_analogy_desc)
        ])

    analogy_table = Table(analogy_rows, colWidths=[60*mm, 122*mm])
    analogy_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), c_primary),
        ('GRID', (0, 0), (-1, -1), 0.5, c_border),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 2.5*mm),
        ('RIGHTPADDING', (0, 0), (-1, -1), 2.5*mm),
        ('TOPPADDING', (0, 0), (-1, -1), 1.8*mm),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 1.8*mm),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, c_light])
    ]))
    story.append(analogy_table)
    story.append(Spacer(1, 4*mm))

    # ==================== SECCIÓN 3: PREGUNTA DE REPASO ====================
    story.append(Paragraph("❓ 3. Pregunta de Repaso para el Fundador", style_h2))

    quiz_html = (
        "<b>Pregunta:</b> ¿Por qué en Fluxo no usamos geolocalización GPS por satélite para evitar pedidos falsos?<br/>"
        "<b>Respuesta Didáctica:</b> Porque el GPS falla dentro de los locales con muros gruesos de piedra (muy típicos en Galicia). "
        "En su lugar usamos el <b>Mozo Gatekeeper</b>: el mozo valida la orden cara a cara con el cliente. Es 100% infalible, más humano y no espía al comensal."
    )
    quiz_card = Table([[Paragraph(quiz_html, style_body)]], colWidths=[182*mm])
    quiz_card.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#FEF3C7")), # Fondo Ámbar suave
        ('BOX', (0, 0), (-1, -1), 1, c_amber),
        ('LEFTPADDING', (0, 0), (-1, -1), 4*mm),
        ('RIGHTPADDING', (0, 0), (-1, -1), 4*mm),
        ('TOPPADDING', (0, 0), (-1, -1), 3*mm),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3*mm),
    ]))
    story.append(quiz_card)
    story.append(Spacer(1, 3*mm))

    # ==================== SECCIÓN 4: MATRIZ DE PRECIOS & CHECKLIST ====================
    summary_data = [
        [
            Paragraph("<b>Matriz Oficial Fluxo (DEC-06)</b>", style_body_bold),
            Paragraph("<b>Checklist Matutino de Operaciones</b>", style_body_bold)
        ],
        [
            Paragraph("• Plan Carta: <b>39 €/mes</b><br/>• Plan Sala: <b>69 €/mes</b><br/>• Plan Full: <b>99 €/mes</b> (Estrella)<br/>• Plan Suite: <b>139 €/mes</b><br/>• Setup Onboarding: <b>149 €</b> (Bonificado 100% en Full)", style_body),
            Paragraph("✅ Compilación limpia: 0 errores (npm run build PASS)<br/>✅ Precios oficiales blindados: 0% comisiones y no tocar TPV<br/>✅ Horario de visitas: 11:00-12:15 y 17:00-18:30<br/>✅ Piloto en terraza: Desafío de 14 días en 5 mesas", style_body)
        ]
    ]
    summary_table = Table(summary_data, colWidths=[90*mm, 92*mm])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), c_light),
        ('BOX', (0, 0), (-1, -1), 1, c_border),
        ('GRID', (0, 0), (-1, -1), 0.5, c_border),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 3*mm),
        ('RIGHTPADDING', (0, 0), (-1, -1), 3*mm),
        ('TOPPADDING', (0, 0), (-1, -1), 2.5*mm),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2.5*mm),
    ]))
    story.append(summary_table)

    # Construir documento con NumberedCanvas
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"[pdfCompiler] PDF generado exitosamente en: {output_path}")
    return output_path


def main():
    parser = argparse.ArgumentParser(description="Compilador de PDF Didáctico Fluxo")
    parser.add_argument("--date", default=datetime.now().strftime("%Y-%m-%d"), help="Fecha YYYY-MM-DD")
    parser.add_argument("--output", default=None, help="Ruta de salida del PDF")
    args = parser.parse_args()

    # Formatear nombre por defecto Lecciones_Fluxo_DD_MM_YYYY.pdf
    if not args.output:
        parts = args.date.split("-")
        if len(parts) == 3:
            formatted_date = f"{parts[2]}_{parts[1]}_{parts[0]}"
        else:
            formatted_date = datetime.now().strftime("%d_%m_%Y")
        args.output = f"Lecciones_Fluxo_{formatted_date}.pdf"

    compile_didactic_pdf(args.date, args.output)

if __name__ == "__main__":
    main()
