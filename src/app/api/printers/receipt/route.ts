import { NextRequest, NextResponse } from 'next/server'
import { getRestaurantBySlug, getRestaurantOrders } from '@/lib/supabase/repository'
import { formatCurrency } from '@/lib/utils'

export const dynamic = 'force-dynamic'

/**
 * ==============================================================================
 * FLUXO - API & SIMULADOR DE IMPRESIÓN TÉRMICA ESC/POS
 * ==============================================================================
 * Compatible con impresoras térmicas de tickets (Epson, Bixolon, Star, Munbyn 58/80mm)
 * y con visualizador interactivo para navegadores y demostraciones a clientes.
 */

const ESC = '\x1b'
const GS = '\x1d'

const ESCPOS = {
  INIT: `${ESC}@`,
  ALIGN_LEFT: `${ESC}a\x00`,
  ALIGN_CENTER: `${ESC}a\x01`,
  ALIGN_RIGHT: `${ESC}a\x02`,
  BOLD_ON: `${ESC}E\x01`,
  BOLD_OFF: `${ESC}E\x00`,
  DOUBLE_HEIGHT_ON: `${ESC}!\x10`,
  DOUBLE_WIDTH_ON: `${ESC}!\x20`,
  DOUBLE_SIZE_ON: `${ESC}!\x30`,
  NORMAL_SIZE: `${ESC}!\x00`,
  FEED_LINES: (n: number) => `${ESC}d${String.fromCharCode(n)}`,
  CUT_PAPER: `${GS}V\x00`,
  CUT_PARTIAL: `${GS}V\x01`,
  BEEP: `${ESC}B\x02\x02`,
}

// Comandas de demostración en caso de que no haya comandas activas en la BD
const FALLBACK_DEMO_ORDERS: Record<string, any> = {
  'burger-gourmet': {
    id: 'ord-demo-bg-7789',
    table_number: 7,
    created_at: new Date().toISOString(),
    total_amount: 34.50,
    order_items: [
      { quantity: 2, product: { name: 'Smash Burger Doble Trufada' }, notes: 'Punto de carne: Al punto. Sin cebolla.' },
      { quantity: 1, product: { name: 'Patatas Rústicas con Cheddar & Bacon' }, notes: 'Salsa cheddar bien caliente.' },
      { quantity: 2, product: { name: 'Estrella Galicia Especial 33cl' }, notes: 'Copas heladas.' }
    ]
  },
  'taperia-casco-antigo': {
    id: 'ord-demo-tca-4412',
    table_number: 4,
    created_at: new Date().toISOString(),
    total_amount: 48.00,
    order_items: [
      { quantity: 1, product: { name: 'Pulpo á Feira con Cachelos' }, notes: 'Aceite virgen extra y pimentón picante.' },
      { quantity: 1, product: { name: 'Pimientos de Padrón D.O.' }, notes: 'Con sal gorda en escamas.' },
      { quantity: 1, product: { name: 'Zamburiñas a la Plancha (6 uds)' }, notes: 'Marcha de inmediato con entrantes.' },
      { quantity: 1, product: { name: 'Botella Albariño Rías Baixas' }, notes: 'Cubitera con hielo en mesa.' }
    ]
  },
  'terraza-malecon': {
    id: 'ord-demo-tm-1205',
    table_number: 12,
    created_at: new Date().toISOString(),
    total_amount: 29.00,
    order_items: [
      { quantity: 2, product: { name: 'Aperol Spritz Clásico' }, notes: 'Rodaja de naranja y aceituna verde.' },
      { quantity: 1, product: { name: 'Tabla de Quesos Gallegos & Frutos Secos' }, notes: 'Con tostas crujientes.' },
      { quantity: 1, product: { name: 'Mojito Cubano de Fresa' }, notes: 'Poca azúcar.' }
    ]
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const slug = searchParams.get('slug') || 'burger-gourmet'
    const orderId = searchParams.get('order_id')
    const format = searchParams.get('format') // 'json', 'escpos', 'text', o default html/view
    const width = parseInt(searchParams.get('width') || '42', 10) // 32 para 58mm, 42 o 48 para 80mm

    const restaurant = await getRestaurantBySlug(slug)
    const restaurantId = restaurant?.id || 'a1111111-1111-1111-1111-111111111111'
    const orders = await getRestaurantOrders(restaurantId, slug)

    let targetOrder = orderId ? orders.find(o => o.id === orderId) : orders[0]
    
    // Si no hay comanda en base de datos, usamos el fallback realista para garantizar que NUNCA de error
    if (!targetOrder) {
      targetOrder = FALLBACK_DEMO_ORDERS[slug] || FALLBACK_DEMO_ORDERS['burger-gourmet']
    }

    const restName = (restaurant?.name || (slug === 'taperia-casco-antigo' ? 'Tapería Casco Antigo' : slug === 'terraza-malecon' ? 'Terraza Malecón' : 'Burger Gourmet Noia')).toUpperCase()
    const tableNum = targetOrder.table_number || targetOrder.table?.table_number || '7'
    const dateStr = new Date(targetOrder.created_at || Date.now()).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })

    const separator = '='.repeat(width)
    const subSeparator = '-'.repeat(width)

    // 1. Generación de Texto Plano Legible
    const textLines: string[] = []
    textLines.push(restName.padStart(Math.floor((width + restName.length) / 2)))
    textLines.push(`COMANDA DE COCINA: MESA #${tableNum}`.padStart(Math.floor((width + 25) / 2)))
    textLines.push(dateStr.padStart(Math.floor((width + dateStr.length) / 2)))
    textLines.push(`TICKET: ${targetOrder.id.substring(0, 16)}`)
    textLines.push(separator)
    textLines.push(`CANT  DESCRIPCION`)
    textLines.push(subSeparator)

    ;(targetOrder.order_items || []).forEach((it: any) => {
      const qtyStr = `${it.quantity}x`.padEnd(5)
      const nameStr = (it.product?.name || `Plato #${it.product_id}`).toUpperCase()
      textLines.push(`${qtyStr} ${nameStr}`)

      if (it.notes && it.notes.trim()) {
        const notesUpper = it.notes.toUpperCase()
        textLines.push(`      *** ${notesUpper} ***`)
      }
    })

    textLines.push(subSeparator)
    textLines.push(`TOTAL COMANDA: ${formatCurrency(targetOrder.total_amount || 0).padStart(width - 15)}`)
    textLines.push(separator)
    textLines.push(`[VALIDADO POR PERSONAL DE SALON]`.padStart(Math.floor((width + 31) / 2)))

    const plainText = textLines.join('\n')

    // 2. Generación de Bytes ESC/POS para la Impresora Térmica
    let escposBuffer = ''
    escposBuffer += ESCPOS.INIT
    escposBuffer += ESCPOS.BEEP

    escposBuffer += ESCPOS.ALIGN_CENTER
    escposBuffer += ESCPOS.BOLD_ON
    escposBuffer += `${restName}\n`
    escposBuffer += ESCPOS.DOUBLE_SIZE_ON
    escposBuffer += `MESA #${tableNum}\n`
    escposBuffer += ESCPOS.NORMAL_SIZE
    escposBuffer += `${dateStr}\n`
    escposBuffer += `ID: ${targetOrder.id.substring(0, 14)}\n`
    escposBuffer += `${separator}\n`

    escposBuffer += ESCPOS.ALIGN_LEFT
    escposBuffer += ESCPOS.BOLD_ON
    escposBuffer += `CANT  DESCRIPCION\n`
    escposBuffer += `${subSeparator}\n`

    ;(targetOrder.order_items || []).forEach((it: any) => {
      const qty = `${it.quantity}x`.padEnd(5)
      const name = (it.product?.name || `Plato #${it.product_id}`).toUpperCase()
      escposBuffer += ESCPOS.DOUBLE_HEIGHT_ON
      escposBuffer += `${qty} ${name}\n`
      escposBuffer += ESCPOS.NORMAL_SIZE

      if (it.notes && it.notes.trim()) {
        escposBuffer += ESCPOS.BOLD_ON
        escposBuffer += `      >>> ${it.notes.toUpperCase()} <<<\n`
        escposBuffer += ESCPOS.BOLD_OFF
      }
    })

    escposBuffer += `${subSeparator}\n`
    escposBuffer += ESCPOS.ALIGN_RIGHT
    escposBuffer += `TOTAL: ${formatCurrency(targetOrder.total_amount || 0)}\n`
    escposBuffer += ESCPOS.ALIGN_CENTER
    escposBuffer += `${separator}\n`
    escposBuffer += `[VALIDADO POR MOZO]\n`
    escposBuffer += ESCPOS.FEED_LINES(4)
    escposBuffer += ESCPOS.CUT_PAPER

    const base64Escpos = Buffer.from(escposBuffer, 'binary').toString('base64')

    // Respuesta JSON si se solicita explícitamente
    if (format === 'json' || req.headers.get('accept')?.includes('application/json')) {
      return NextResponse.json({
        success: true,
        restaurant: restName,
        order_id: targetOrder.id,
        table_number: tableNum,
        ticket_plain_text: plainText,
        escpos_raw_base64: base64Escpos,
        printer_support: {
          widths: ['58mm (32 chars)', '80mm (42-48 chars)'],
          compatibility: ['Epson TM-T20/TM-T88', 'Bixolon SRP-350', 'Star Micronics TSP100', 'Munbyn', 'Generic ESC/POS'],
        },
      })
    }

    // Respuesta Texto Plano
    if (format === 'text' || format === 'txt') {
      return new NextResponse(plainText, {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      })
    }

    // Respuesta ESC/POS Binario
    if (format === 'escpos' || format === 'bin') {
      return new NextResponse(Buffer.from(escposBuffer, 'binary'), {
        headers: {
          'Content-Type': 'application/octet-stream',
          'Content-Disposition': `attachment; filename="ticket-${slug}-mesa${tableNum}.bin"`,
        },
      })
    }

    // 3. Visualizador HTML Interactivo (Para visitantes web desde la landing)
    const itemsHtml = (targetOrder.order_items || []).map((it: any) => `
      <div style="margin-bottom: 8px;">
        <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 14px;">
          <span>${it.quantity}x ${(it.product?.name || 'PLATO').toUpperCase()}</span>
        </div>
        ${it.notes ? `<div style="font-size: 11px; color: #4b5563; padding-left: 12px; margin-top: 2px; font-style: italic;">*** ${it.notes.toUpperCase()} ***</div>` : ''}
      </div>
    `).join('')

    const htmlContent = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Simulador de Ticket Térmico ESC/POS | Fluxo</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800;900&family=JetBrains+Mono:wght@400;700;800&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: #020617;
      color: #f8fafc;
      font-family: 'Plus Jakarta Sans', sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 24px 16px 48px;
    }
    .header-bar {
      width: 100%;
      max-width: 800px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 1px solid #1e293b;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 8px;
      text-decoration: none;
      color: #38bdf8;
      font-weight: 900;
      font-size: 18px;
      letter-spacing: -0.5px;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(6, 182, 212, 0.15);
      border: 1px solid rgba(6, 182, 212, 0.4);
      color: #22d3ee;
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .back-btn {
      color: #94a3b8;
      text-decoration: none;
      font-size: 12px;
      font-weight: 700;
      transition: color 0.2s;
    }
    .back-btn:hover { color: #ffffff; }

    .main-container {
      width: 100%;
      max-width: 800px;
      display: grid;
      grid-template-columns: 1fr;
      gap: 32px;
      align-items: start;
    }
    @media (min-width: 768px) {
      .main-container {
        grid-template-columns: 360px 1fr;
      }
    }

    /* Simulación de Papel Térmico */
    .receipt-container {
      position: relative;
      display: flex;
      justify-content: center;
    }
    .receipt {
      background: #fdfdfd;
      color: #111827;
      font-family: 'JetBrains Mono', monospace;
      padding: 24px 20px;
      width: 100%;
      max-width: 340px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.1);
      border-radius: 4px;
      position: relative;
    }
    .receipt-top-cut, .receipt-bottom-cut {
      position: absolute;
      left: 0;
      width: 100%;
      height: 8px;
      background-size: 16px 8px;
      background-repeat: repeat-x;
    }
    .receipt-top-cut {
      top: -8px;
      background-image: radial-gradient(circle, transparent 70%, #fdfdfd 75%);
    }
    .receipt-bottom-cut {
      bottom: -8px;
      background-image: radial-gradient(circle, #fdfdfd 70%, transparent 75%);
    }
    .receipt-header {
      text-align: center;
      margin-bottom: 12px;
      border-bottom: 1px dashed #cbd5e1;
      padding-bottom: 10px;
    }
    .receipt-title {
      font-size: 16px;
      font-weight: 800;
      letter-spacing: -0.5px;
    }
    .receipt-table-badge {
      display: inline-block;
      font-size: 18px;
      font-weight: 800;
      background: #111827;
      color: #ffffff;
      padding: 2px 10px;
      border-radius: 4px;
      margin: 6px 0;
    }
    .receipt-date {
      font-size: 10px;
      color: #64748b;
    }
    .receipt-separator {
      border: 0;
      border-top: 1px dashed #94a3b8;
      margin: 10px 0;
    }
    .receipt-body {
      margin: 12px 0;
    }
    .receipt-total {
      display: flex;
      justify-content: space-between;
      font-weight: 800;
      font-size: 15px;
      margin-top: 8px;
      border-top: 2px solid #111827;
      padding-top: 8px;
    }
    .receipt-footer {
      text-align: center;
      margin-top: 14px;
      font-size: 10px;
      color: #64748b;
      font-weight: 700;
    }

    /* Panel de Control y Opciones */
    .controls-panel {
      background: #0f172a;
      border: 1px solid #1e293b;
      border-radius: 24px;
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .panel-title {
      font-size: 16px;
      font-weight: 800;
      color: #ffffff;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .selector-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .selector-label {
      font-size: 11px;
      font-weight: 700;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .select-input {
      background: #1e293b;
      border: 1px solid #334155;
      color: #ffffff;
      padding: 10px 14px;
      border-radius: 12px;
      font-size: 13px;
      font-weight: 600;
      outline: none;
      cursor: pointer;
      transition: border-color 0.2s;
    }
    .select-input:focus { border-color: #06b6d4; }
    .action-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      width: 100%;
      padding: 12px 18px;
      border-radius: 12px;
      font-size: 13px;
      font-weight: 800;
      cursor: pointer;
      text-decoration: none;
      transition: all 0.2s;
      border: none;
    }
    .btn-primary {
      background: #06b6d4;
      color: #020617;
      box-shadow: 0 4px 14px rgba(6, 182, 212, 0.35);
    }
    .btn-primary:hover { background: #22d3ee; }
    .btn-secondary {
      background: #1e293b;
      color: #f8fafc;
      border: 1px solid #334155;
    }
    .btn-secondary:hover { background: #334155; }
    .info-box {
      background: rgba(16, 185, 129, 0.1);
      border: 1px solid rgba(16, 185, 129, 0.3);
      padding: 12px 14px;
      border-radius: 14px;
      font-size: 11px;
      color: #6ee7b7;
      line-height: 1.5;
    }
  </style>
</head>
<body>

  <header class="header-bar">
    <a href="/" class="brand">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
      <span>FLUXO</span>
    </a>
    <div class="badge">
      <span>🖨️ ESC/POS Thermal Protocol</span>
    </div>
    <a href="/" class="back-btn">← Volver al Inicio</a>
  </header>

  <div class="main-container">

    <!-- Simulación Visual del Ticket de Cocina -->
    <div class="receipt-container">
      <div class="receipt">
        <div class="receipt-top-cut"></div>
        <div class="receipt-header">
          <div class="receipt-title">${restName}</div>
          <div class="receipt-table-badge">MESA #${tableNum}</div>
          <div class="receipt-date">${dateStr}</div>
          <div class="receipt-date">TICKET: ${targetOrder.id.substring(0, 14)}</div>
        </div>

        <div style="font-size: 11px; font-weight: bold; margin-bottom: 6px;">CANT  DESCRIPCIÓN</div>
        <hr class="receipt-separator">

        <div class="receipt-body">
          ${itemsHtml}
        </div>

        <hr class="receipt-separator">
        <div class="receipt-total">
          <span>TOTAL:</span>
          <span>${formatCurrency(targetOrder.total_amount || 0)}</span>
        </div>

        <div class="receipt-footer">
          <div>[VALIDADO POR PERSONAL DE SALÓN]</div>
          <div style="margin-top: 4px; font-size: 9px; opacity: 0.7;">FLUXO GASTRONOMIC SYSTEM</div>
        </div>
        <div class="receipt-bottom-cut"></div>
      </div>
    </div>

    <!-- Panel de Opciones y Pruebas -->
    <div class="controls-panel">
      <div>
        <div class="panel-title">
          <span>⚙️ Simulador de Impresión Térmica</span>
        </div>
        <p style="font-size: 12px; color: #94a3b8; margin-top: 4px;">
          Fluxo envía automáticamente comandas a impresoras térmicas de 58mm y 80mm en cocina sin necesidad de cambiar el equipamiento actual del restaurante.
        </p>
      </div>

      <div class="selector-group">
        <label class="selector-label">Local de Demostración:</label>
        <select class="select-input" onchange="window.location.href='/api/printers/receipt?slug=' + this.value">
          <option value="burger-gourmet" ${slug === 'burger-gourmet' ? 'selected' : ''}>🍔 Burger Gourmet Noia</option>
          <option value="taperia-casco-antigo" ${slug === 'taperia-casco-antigo' ? 'selected' : ''}>🐙 Tapería Casco Antigo</option>
          <option value="terraza-malecon" ${slug === 'terraza-malecon' ? 'selected' : ''}>🍹 Terraza Malecón Bar</option>
        </select>
      </div>

      <div style="display: flex; flex-direction: column; gap: 10px;">
        <button onclick="window.print()" class="action-btn btn-primary">
          <span>🖨️ Imprimir Ticket de Prueba</span>
        </button>

        <a href="/api/printers/receipt?slug=${slug}&format=json" target="_blank" class="action-btn btn-secondary">
          <span>🔌 Ver Respuesta API (JSON)</span>
        </a>

        <a href="/api/printers/receipt?slug=${slug}&format=escpos" download="ticket-${slug}.bin" class="action-btn btn-secondary">
          <span>📦 Descargar Binario ESC/POS (.bin)</span>
        </a>
      </div>

      <div class="info-box">
        ✅ <strong>Compatibilidad Universal:</strong> Funciona con impresoras Epson TM-T20/T88, Star Micronics, Bixolon, Munbyn, Hoin y drivers USB, Ethernet o Bluetooth.
      </div>
    </div>

  </div>

</body>
</html>`

    return new NextResponse(htmlContent, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  } catch (err: any) {
    console.error('Error generando ticket ESC/POS:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
