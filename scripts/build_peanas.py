import os

html = '''<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Peanas QR Imprimibles (Mesas 1-10) - Fluxo</title>
  <style>
    @page { size: A4 portrait; margin: 10mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: system-ui, sans-serif; }
    body { background: #f8fafc; color: #0f172a; padding: 20px; display: flex; flex-direction: column; align-items: center; }
    .print-bar { background: #0f172a; color: #fff; padding: 16px 24px; border-radius: 8px; max-width: 800px; width: 100%; text-align: center; margin-bottom: 20px; }
    .print-bar button { margin-top: 10px; padding: 10px 20px; background: #2563eb; color: #fff; border: 0; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 14px; }
    .sheet { width: 210mm; min-height: 297mm; background: #fff; padding: 10mm; display: grid; grid-template-columns: 1fr 1fr; gap: 15mm; margin-bottom: 25px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); page-break-after: always; }
    .card { border: 2px dashed #94a3b8; border-radius: 14px; padding: 22px 16px; display: flex; flex-direction: column; align-items: center; text-align: center; background: #fff; position: relative; }
    .cut-label { position: absolute; top: -10px; left: 12px; font-size: 10px; color: #64748b; background: #fff; padding: 0 6px; font-weight: bold; }
    .brand { font-size: 13px; font-weight: 900; letter-spacing: 1.5px; text-transform: uppercase; color: #0f172a; margin-bottom: 12px; }
    .badge { background: #0f172a; color: #fff; font-size: 18px; font-weight: 900; padding: 6px 22px; border-radius: 9999px; margin-bottom: 12px; }
    .title { font-size: 15px; font-weight: 800; margin-bottom: 4px; color: #0f172a; }
    .subtitle { font-size: 11.5px; color: #64748b; margin-bottom: 14px; }
    .qr-box { width: 140px; height: 140px; padding: 6px; border: 2px solid #e2e8f0; border-radius: 12px; margin-bottom: 14px; display: flex; align-items: center; justify-content: center; background: #fff; }
    .qr-box img { width: 100%; height: 100%; }
    .features { list-style: none; font-size: 11px; color: #334155; font-weight: 600; line-height: 1.6; margin-bottom: 14px; text-align: left; }
    .features li::before { content: '\2713 '; color: #10b981; font-weight: 900; }
    .footer { font-size: 8.5px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 6px; width: 100%; }
    @media print {
      body { background: transparent; padding: 0; }
      .print-bar { display: none; }
      .sheet { box-shadow: none; margin: 0; padding: 0; width: 100%; }
    }
  </style>
</head>
<body>
  <div class="print-bar">
    <h2>Peanas QR de Terraza - Fluxo (Mesas 1 a 10)</h2>
    <p>5 hojas A4 (2 peanas A6 por hoja). Listas para imprimir y colocar en soportes de metacrilato 3M.</p>
    <button onclick="window.print()">Imprimir Juego Completo (Mesas 1-10)</button>
  </div>
'''

for page in range(0, 5):
    html += '  <div class="sheet">\n'
    for i in range(1, 3):
        m = page * 2 + i
        url = 'https://fluxo-gastro.vercel.app/menu/burger-gourmet?table=' + str(m)
        qr = 'https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=' + url
        html += '    <div class="card">\n'
        html += '      <span class="cut-label">Recortar para metacrilato A6</span>\n'
        html += '      <div class="brand">FLUXO GASTRO</div>\n'
        html += '      <div class="badge">MESA ' + str(m) + '</div>\n'
        html += '      <div class="title">Pide desde tu movil</div>\n'
        html += '      <div class="subtitle">Enfoca con tu camara para ver la carta y pedir al mozo</div>\n'
        html += '      <div class="qr-box"><img src="' + qr + '" alt="QR Mesa ' + str(m) + '" /></div>\n'
        html += '      <ul class="features">\n'
        html += '        <li>Carta interactiva con fotos y alergenos</li>\n'
        html += '        <li>Llama al camarero o pide la cuenta</li>\n'
        html += '        <li>Sin esperas ni errores en cocina</li>\n'
        html += '      </ul>\n'
        html += '      <div class="footer">Fluxo - Sistema Gastronomico Inteligente | 0% Comisiones</div>\n'
        html += '    </div>\n'
    html += '  </div>\n'

html += '</body></html>'

open('docs/departamentos/3_diseno_marca/plantilla_peana_qr_imprimible.html', 'w', encoding='utf-8').write(html)
open('public/peanas_qr_imprimibles.html', 'w', encoding='utf-8').write(html)
print('Peanas 1-10 creadas exitosamente')
