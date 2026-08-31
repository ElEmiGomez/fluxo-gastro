import { NextRequest, NextResponse } from 'next/server'
import { getRestaurantBySlug, getRestaurantOrders } from '@/lib/supabase/repository'
import { formatCurrency } from '@/lib/utils'

export const dynamic = 'force-dynamic'

/**
 * ==============================================================================
 * FLUXO - API DE IMPRESIÓN TÉRMICA EN COCINA (ESC/POS)
 * ==============================================================================
 * Formatea una comanda validada a comandos estándar ESC/POS para impresoras
 * térmicas de tickets (Epson, Bixolon, Star, Hoin, Munbyn de 58mm y 80mm).
 * Permite a cocinas analógicas tradicionales trabajar en papel sin alterar sus
 * protocolos de higiene de guantes o pantallas.
 */

// Comandos de control ESC/POS en formato ASCII/Bytes
const ESC = '\x1b'
const GS = '\x1d'

const ESCPOS = {
  INIT: `${ESC}@`,                      // Inicializar impresora
  ALIGN_LEFT: `${ESC}a\x00`,            // Alinear izquierda
  ALIGN_CENTER: `${ESC}a\x01`,          // Alinear centro
  ALIGN_RIGHT: `${ESC}a\x02`,           // Alinear derecha
  BOLD_ON: `${ESC}E\x01`,               // Negrita activada
  BOLD_OFF: `${ESC}E\x00`,              // Negrita desactivada
  DOUBLE_HEIGHT_ON: `${ESC}!\x10`,      // Doble altura
  DOUBLE_WIDTH_ON: `${ESC}!\x20`,       // Doble ancho
  DOUBLE_SIZE_ON: `${ESC}!\x30`,        // Doble tamaño (Alto + Ancho)
  NORMAL_SIZE: `${ESC}!\x00`,           // Tamaño estándar normal
  FEED_LINES: (n: number) => `${ESC}d${String.fromCharCode(n)}`,
  CUT_PAPER: `${GS}V\x00`,              // Corte de papel total con guillotina
  CUT_PARTIAL: `${GS}V\x01`,            // Corte parcial de papel
  BEEP: `${ESC}B\x02\x02`,              // 2 Beeps sonoros de campana
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const slug = searchParams.get('slug') || 'burger-gourmet'
    const orderId = searchParams.get('order_id')
    const format = searchParams.get('format') || 'both' // 'text', 'escpos', o 'both'
    const width = parseInt(searchParams.get('width') || '42', 10) // 32 para 58mm, 42 o 48 para 80mm

    const restaurant = await getRestaurantBySlug(slug)
    const restaurantId = restaurant?.id || 'a1111111-1111-1111-1111-111111111111'
    const orders = await getRestaurantOrders(restaurantId, slug)

    let targetOrder = orderId ? orders.find(o => o.id === orderId) : orders[0]
    if (!targetOrder) {
      return NextResponse.json({ error: 'No se encontró la comanda especificada' }, { status: 404 })
    }

    const restName = (restaurant?.name || 'FLUXO RESTAURANTE').toUpperCase()
    const tableNum = targetOrder.table_number || targetOrder.table?.table_number || '?'
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

    ;(targetOrder.order_items || []).forEach(it => {
      const qtyStr = `${it.quantity}x`.padEnd(5)
      const nameStr = (it.product?.name || `Plato #${it.product_id}`).toUpperCase()
      textLines.push(`${qtyStr} ${nameStr}`)

      // Aclaraciones estructuradas resaltadas para cocina
      if (it.notes && it.notes.trim()) {
        const notesUpper = it.notes.toUpperCase()
        textLines.push(`      *** ${notesUpper} ***`)
      }
    })

    textLines.push(subSeparator)
    textLines.push(`TOTAL COMANDA: ${formatCurrency(targetOrder.total_amount).padStart(width - 15)}`)
    textLines.push(separator)
    textLines.push(`[VALIDADO POR PERSONAL DE SALON]`.padStart(Math.floor((width + 31) / 2)))

    const plainText = textLines.join('\n')

    // 2. Generación de Bytes ESC/POS para la Impresora Térmica
    let escposBuffer = ''
    escposBuffer += ESCPOS.INIT
    escposBuffer += ESCPOS.BEEP

    // Encabezado
    escposBuffer += ESCPOS.ALIGN_CENTER
    escposBuffer += ESCPOS.BOLD_ON
    escposBuffer += `${restName}\n`
    escposBuffer += ESCPOS.DOUBLE_SIZE_ON
    escposBuffer += `MESA #${tableNum}\n`
    escposBuffer += ESCPOS.NORMAL_SIZE
    escposBuffer += `${dateStr}\n`
    escposBuffer += `ID: ${targetOrder.id.substring(0, 14)}\n`
    escposBuffer += `${separator}\n`

    // Cuerpo de platos
    escposBuffer += ESCPOS.ALIGN_LEFT
    escposBuffer += ESCPOS.BOLD_ON
    escposBuffer += `CANT  DESCRIPCION\n`
    escposBuffer += `${subSeparator}\n`

    ;(targetOrder.order_items || []).forEach(it => {
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
    escposBuffer += `TOTAL: ${formatCurrency(targetOrder.total_amount)}\n`
    escposBuffer += ESCPOS.ALIGN_CENTER
    escposBuffer += `${separator}\n`
    escposBuffer += `[VALIDADO POR MOZO]\n`
    escposBuffer += ESCPOS.FEED_LINES(4)
    escposBuffer += ESCPOS.CUT_PAPER

    const base64Escpos = Buffer.from(escposBuffer, 'binary').toString('base64')

    return NextResponse.json({
      success: true,
      order_id: targetOrder.id,
      table_number: tableNum,
      ticket_plain_text: plainText,
      escpos_raw_base64: base64Escpos,
      printer_support: {
        widths: ['58mm (32 chars)', '80mm (42-48 chars)'],
        compatibility: ['Epson TM-T20/TM-T88', 'Bixolon SRP-350', 'Star Micronics TSP100', 'Generic ESC/POS'],
      },
    })
  } catch (err: any) {
    console.error('Error generando ticket ESC/POS:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
