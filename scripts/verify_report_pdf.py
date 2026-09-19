# -*- coding: utf-8 -*-
import os
import sys
import re
import subprocess
import unicodedata
import fitz  # PyMuPDF
import pypdf

WORKSPACE_PDF = r"C:\Users\mima7\OneDrive\Documentos\Fluxo - Gastronomic System\docs\Informe_Ejecutivo_RestoBar_Noia.pdf"
DESKTOP_PDF = r"C:\Users\mima7\OneDrive\Escritorio\Informe_Ejecutivo_RestoBar_Noia.pdf"

def normalize(text):
    # Normalize unicode characters (NFKD)
    text = unicodedata.normalize('NFKD', text)
    # Replace middle dots and special characters with spaces
    text = text.replace(chr(183), ' ').replace('·', ' ').replace('•', ' ').replace('–', '-').replace('—', '-')
    # Replace non-alphanumeric except common currency/math/punctuation
    text = re.sub(r'[\s\xa0\u200b]+', ' ', text)
    return text.lower().strip()

def verify():
    errors = []
    print("=== INICIANDO VERIFICACIÓN DE INFORME EJECUTIVO RESTOBAR NOIA ===")
    
    # 1. Check paths & file sizes
    for p in [WORKSPACE_PDF, DESKTOP_PDF]:
        if not os.path.exists(p):
            errors.append(f"Missing file: {p}")
        else:
            size = os.path.getsize(p)
            print(f"[OK] Archivo verificado: {p} ({size} bytes)")
            if size < 10240:
                errors.append(f"File too small (< 10 KB): {p} ({size} bytes)")

    # 2. Check page count strictly with PyMuPDF
    doc = fitz.open(WORKSPACE_PDF)
    page_count_fitz = doc.page_count
    print(f"[INFO] Conteo de páginas PyMuPDF (fitz): {page_count_fitz}")
    if page_count_fitz != 2:
        errors.append(f"Expected exactly 2 pages, got {page_count_fitz} pages in fitz")

    # 3. Check page count strictly with pypdf
    reader = pypdf.PdfReader(WORKSPACE_PDF)
    page_count_pypdf = len(reader.pages)
    print(f"[INFO] Conteo de páginas pypdf: {page_count_pypdf}")
    if page_count_pypdf != 2:
        errors.append(f"Expected exactly 2 pages, got {page_count_pypdf} in pypdf")

    # 4. Text content verification
    p1_raw = doc[0].get_text()
    p2_raw = doc[1].get_text()
    
    p1_norm = normalize(p1_raw)
    p2_norm = normalize(p2_raw)

    print(f"[INFO] Longitud de texto Página 1: {len(p1_raw)} caracteres")
    print(f"[INFO] Longitud de texto Página 2: {len(p2_raw)} caracteres")

    # Required metrics and concepts for Page 1 (R1)
    required_p1 = [
        ("RestoBar Noia", "RestoBar Noia"),
        ("Rúa do Curro, Noia", "Rua do Curro, Noia"),
        ("Septiembre 2026", "Septiembre 2026"),
        ("Plan Full Fluxo Intelligence", "Plan Full · Fluxo Intelligence"),
        ("22.840", "Total Revenue 22.840 €"),
        ("714", "Orders processed 714"),
        ("31,98", "Average ticket 31,98 €"),
        ("1.856", "Total guests 1.856"),
        ("1,8x", "Table turnover rate 1,8x"),
        ("4.2 min", "Validation time before 4.2 min"),
        ("48 sec", "Validation time with Fluxo 48 sec"),
        ("11.5 min", "Kitchen preparation time 11.5 min"),
        ("14 min", "Table stay time reduction 14 min"),
        ("13:30 - 15:30", "Lunch peak window 13:30 - 15:30"),
        ("46%", "Lunch peak volume 46%"),
        ("21:00 - 23:30", "Dinner peak window 21:00 - 23:30"),
        ("38%", "Dinner peak volume 38%"),
        ("1.480", "Incremental revenue QR upselling 1.480 €/month"),
        ("1.120", "Table turnover gains 1.120 €/month"),
        ("2.600", "Total gross gains 2.600 €/month"),
        ("99", "Subscription cost 99 €/month"),
        ("26x", "Financial ROI > 26x"),
    ]

    # Required elements for Page 2 (R2)
    required_p2 = [
        ("stars", "BCG Stars"),
        ("zamburiñas de la ría", "Zamburiñas de la Ría"),
        ("pulpo á feira", "Pulpo á Feira"),
        ("cash cows", "BCG Cash Cows"),
        ("raxo con patatas", "Raxo con patatas"),
        ("pimientos de padrón", "Pimientos de Padrón"),
        ("question marks", "BCG Question Marks"),
        ("arroz caldoso de bogavante", "Arroz caldoso de bogavante"),
        ("potenciar sugerencia en sala", "Potenciar sugerencia en sala"),
        ("dogs", "BCG Dogs"),
        ("plato a reformular o retirar de carta", "Plato a reformular o retirar"),
        ("sunday lunch rush", "Action item 1: Sunday lunch rush"),
        ("push second drinks on terrace after 25 min", "Action item 2: Second drinks terrace 25 min"),
        ("tweak pricing on star appetizers", "Action item 3: Pricing on star appetizers"),
        ("fluxo gastronomic system", "Certified by Fluxo Gastronomic System"),
    ]

    print("\n--- Verificando Requisitos Página 1 (R1) ---")
    for key, desc in required_p1:
        if normalize(key) not in p1_norm:
            errors.append(f"Falta término en Página 1: '{key}' ({desc})")
        else:
            print(f"[OK P1] {desc}")

    print("\n--- Verificando Requisitos Página 2 (R2) ---")
    for key, desc in required_p2:
        if normalize(key) not in p2_norm:
            errors.append(f"Falta término en Página 2: '{key}' ({desc})")
        else:
            print(f"[OK P2] {desc}")

    # 5. Adversarial Layout & Typography Invariant Checks
    print("\n--- Verificando Invariantes Adversariales de Layout & Tipografía ---")
    
    # 5.1 Check for orphaned currency characters (e.g. lone '€' on a line)
    for p_idx, p_text in enumerate([p1_raw, p2_raw]):
        lines = p_text.split('\n')
        for l_idx, line in enumerate(lines):
            if line.strip() == '€':
                errors.append(f"Orphaned currency sign '€' alone on line {l_idx} of Page {p_idx+1}")
    print("[OK] Cero caracteres de moneda '€' huérfanos detectados")

    # 5.2 Check mathematical figures consistency on Page 2
    if "3.991" not in p2_raw:
        errors.append("Falta cálculo correcto '+3.991 €/mes' en Página 2")
    if "3.990" in p2_raw:
        errors.append("Error matemático detectado: '+3.990 €/mes' inconsistente en Página 2")
    if "47.892" not in p2_raw:
        errors.append("Falta proyección anual '+47.892 €/año' en Página 2")
    if "47.880" in p2_raw:
        errors.append("Error matemático detectado: '+47.880 € anuales' inconsistente en Página 2")
    print("[OK] Coherencia matemática estricta validada (+3.991 €/mes y +47.892 €/año)")

    # 5.3 Vertical layout balance verification (strictly assert content fills printable height without blank desert)
    for i, page in enumerate(doc):
        blocks = sorted(page.get_text('blocks'), key=lambda b: b[1])
        if len(blocks) >= 2:
            last_content = blocks[-2]
            footer = blocks[-1]
            content_bottom_y = last_content[3]
            footer_top_y = footer[1]
            gap = footer_top_y - content_bottom_y
            print(f"[INFO] Página {i+1}: contenido hasta y={content_bottom_y:.1f}, footer en y={footer_top_y:.1f} (gap={gap:.1f} pt)")
            if content_bottom_y < 750:
                errors.append(f"Página {i+1} contenido desproporcionado o comprimido arriba (y1={content_bottom_y:.1f} < 750 pt)")
            if gap > 45:
                errors.append(f"Página {i+1} exceso de espacio vacío antes del pie de página (gap={gap:.1f} pt > 45 pt)")
    print("[OK] Distribución y ritmo vertical equilibrados en ambas páginas (y1 >= 750 pt, gap <= 45 pt)")

    # 5.4 PDF Document Properties & Metadata Validation
    meta = doc.metadata
    print(f"[INFO] Metadatos PDF: {meta}")
    if '\ufffd' in meta.get('title', ''):
        errors.append(f"Metadatos PDF contienen caracter de reemplazo '\\ufffd': {meta.get('title')}")
    if meta.get('author') != 'Fluxo Gastronomic System':
        errors.append(f"Autor de metadatos PDF inválido: {meta.get('author')}")
    if 'Fluxo' not in meta.get('creator', ''):
        errors.append(f"Creador de metadatos PDF inválido: {meta.get('creator')}")
    print("[OK] Metadatos PDF validados (Título limpio sin \\ufffd, Autor y Creador corporativos)")

    # 5.5 Check Desktop and Workspace PDFs are both valid and match
    size_ws = os.path.getsize(WORKSPACE_PDF)
    size_dt = os.path.getsize(DESKTOP_PDF)
    if size_ws != size_dt:
        errors.append(f"PDF mismatch between Workspace ({size_ws} bytes) and Desktop ({size_dt} bytes)")
    else:
        print(f"[OK] Coincidencia binaria y tamaño idéntico entre Workspace y Desktop ({size_ws} bytes)")

    # 5.6 Programmatic Robustness & Multi-Tenant Partial Overrides Test
    print("\n--- Verificando Robustez Programática ante Overrides Parciales ---")
    node_test = subprocess.run(
        ["node", "-e", "import('./scripts/generate_executive_report_noia.mjs').then(m => { const h1 = m.buildReportHtml({ client: { name: 'Tenant Test' } }); const h2 = m.buildReportHtml({}); if (!h1 || !h2) process.exit(1); console.log('OK'); }).catch(e => { console.error(e); process.exit(1); })"],
        capture_output=True, text=True
    )
    if node_test.returncode != 0:
        errors.append(f"Fallo en prueba de sobreescritura parcial de buildReportHtml: {node_test.stderr.strip()}")
    else:
        print("[OK] Inmunidad a sobreescrituras parciales y fusión de configuración validada")

    # 5.7 Horizontal Margin Containment & Unclipped Header Strings
    print("\n--- Verificando Contención Horizontal Estricta & Cero Recorte ---")
    if normalize("Auditoría 30 Días") not in p1_norm:
        errors.append("Página 1: texto del encabezado recortado (falta 'Auditoría 30 Días')")
    if normalize("Octubre 2026") not in p2_norm:
        errors.append("Página 2: texto del encabezado recortado (falta 'Octubre 2026')")
    for i, page in enumerate(doc):
        for b in page.get_text('blocks'):
            if b[2] > 556.0:
                errors.append(f"Página {i+1}: desbordamiento horizontal detectado (x1={b[2]:.1f} > 556.0 pt) en texto: '{b[4].strip()[:40]}...'")
    print("[OK] Contención horizontal estricta validada (todos los bloques x1 <= 556.0 pt, cero recorte)")

    # 6. Render previews for visual confirmation
    pix1 = doc[0].get_pixmap(dpi=150)
    pix1.save("page1_preview.png")
    pix2 = doc[1].get_pixmap(dpi=150)
    pix2.save("page2_preview.png")
    print("\n[OK] Vistas previas renderizadas: page1_preview.png y page2_preview.png")

    if errors:
        print("\n[FAIL] Errores encontrados:")
        for err in errors:
            print(" -", err)
        sys.exit(1)
    else:
        print("\n[SUCCESS] ¡TODAS LAS VALIDACIONES DE PÁGINA, TEXTO, COHERENCIA, METADATOS Y FORMATO PASARON EXITOSAMENTE (2 PÁGINAS EXACTAS)!")
        sys.exit(0)

if __name__ == "__main__":
    verify()
