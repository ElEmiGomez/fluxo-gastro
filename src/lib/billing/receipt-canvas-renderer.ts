// ==============================================================================
// FLUXO — GENERADOR DE RECIBO DIGITAL PNG (HTML5 Canvas 2D nativo, 1200x1600)
// Estética oscura/corporativa. REGLA DE SEGURIDAD: jamás se dibujan
// contraseñas, PINs ni credenciales de acceso en el recibo.
// ==============================================================================

import {
  LocalBilling,
  PLAN_CONFIG,
  getMonthlyBase,
} from './billing-calculations'

export interface ReceiptData {
  receiptNumber: string
  dateStr: string
  restaurantName: string
  planLabel: string
  period: string
  base: number
  iva: number
  total: number
  methodLabel: string
  stampText: string
}

export const RECEIPT_WIDTH = 1200
export const RECEIPT_HEIGHT = 1600

const IVA_RATE = 0.21

/** Construye los datos del recibo del ciclo actual para un local. */
export function buildReceiptData(local: LocalBilling, now: Date = new Date()): ReceiptData {
  const base = getMonthlyBase(local, now)
  const iva = Math.round(base * IVA_RATE * 100) / 100
  const monthLabel = now.toLocaleDateString('es-ES', { month: 'long' })
  const year = now.getFullYear()

  const idCode = local.id.replace(/[^a-z0-9]/gi, '').slice(-4).toUpperCase()

  return {
    receiptNumber: `RX-${year}${String(now.getMonth() + 1).padStart(2, '0')}-${idCode}`,
    dateStr: now.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }),
    restaurantName: local.nombre,
    planLabel: `${PLAN_CONFIG[local.plan_type].label} · ${base} €/mes + IVA`,
    period: `Ciclo de servicio: ${monthLabel.charAt(0).toUpperCase()}${monthLabel.slice(1)} ${year}`,
    base,
    iva,
    total: Math.round((base + iva) * 100) / 100,
    methodLabel:
      local.payment_method === 'bizum'
        ? 'Bizum'
        : local.payment_method === 'transfer'
          ? 'Transferencia bancaria'
          : local.payment_method === 'cash'
            ? 'Efectivo'
            : 'Stripe',
    stampText: 'PAGADO / ACTIVADO',
  }
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

/** Dibuja el recibo completo sobre el canvas dado (debe medir 1200x1600). */
export function drawReceipt(canvas: HTMLCanvasElement, data: ReceiptData): void {
  canvas.width = RECEIPT_WIDTH
  canvas.height = RECEIPT_HEIGHT
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // Fondo oscuro corporativo
  const bgGradient = ctx.createLinearGradient(0, 0, 0, RECEIPT_HEIGHT)
  bgGradient.addColorStop(0, '#0b1120')
  bgGradient.addColorStop(1, '#0f172a')
  ctx.fillStyle = bgGradient
  ctx.fillRect(0, 0, RECEIPT_WIDTH, RECEIPT_HEIGHT)

  // Marca de agua "FLUXO"
  ctx.save()
  ctx.globalAlpha = 0.04
  ctx.fillStyle = '#ffffff'
  ctx.font = '900 190px -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.save()
  ctx.translate(RECEIPT_WIDTH / 2, RECEIPT_HEIGHT / 2)
  ctx.rotate(-Math.PI / 12)
  ctx.fillText('FLUXO', 0, RECEIPT_HEIGHT * 0.18)
  ctx.restore()
  ctx.restore()

  // Cabecera con barrita acento
  const headerGradient = ctx.createLinearGradient(0, 0, RECEIPT_WIDTH, 0)
  headerGradient.addColorStop(0, '#06b6d4')
  headerGradient.addColorStop(1, '#10b981')
  ctx.fillStyle = headerGradient
  ctx.fillRect(0, 0, RECEIPT_WIDTH, 12)

  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'

  // Isotipo F
  const isoX = 90
  const isoY = 96
  roundRect(ctx, isoX, isoY, 84, 84, 22)
  ctx.fillStyle = '#ffffff'
  ctx.fill()
  ctx.fillStyle = '#2563eb'
  ctx.font = '900 52px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('F', isoX + 42, isoY + 62)

  ctx.textAlign = 'left'
  ctx.fillStyle = '#ffffff'
  ctx.font = '900 44px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif'
  ctx.fillText('FLUXO', isoX + 110, isoY + 40)
  ctx.fillStyle = '#94a3b8'
  ctx.font = '400 22px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif'
  ctx.fillText('Gastronomic System · Recibo Digital', isoX + 110, isoY + 74)

  // Nº de recibo + fecha
  ctx.textAlign = 'right'
  ctx.fillStyle = '#22d3ee'
  ctx.font = '700 30px ui-monospace, SFMono-Regular, Menlo, monospace'
  ctx.fillText(data.receiptNumber, RECEIPT_WIDTH - 90, isoY + 44)
  ctx.fillStyle = '#94a3b8'
  ctx.font = '400 24px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif'
  ctx.fillText(data.dateStr, RECEIPT_WIDTH - 90, isoY + 80)

  // Tarjeta principal
  const cardX = 90
  const cardW = RECEIPT_WIDTH - 180
  const cardY = 240
  const cardH = 760
  roundRect(ctx, cardX, cardY, cardW, cardH, 28)
  ctx.fillStyle = 'rgba(30, 41, 59, 0.55)'
  ctx.fill()
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)'
  ctx.lineWidth = 2
  ctx.stroke()

  ctx.textAlign = 'left'
  ctx.fillStyle = '#64748b'
  ctx.font = '700 20px -apple-system, sans-serif'
  ctx.fillText('Nº DE RECIBO', cardX + 48, cardY + 64)
  ctx.fillText('NOMBRE DEL RESTAURANTE', cardX + 48, cardY + 176)
  ctx.fillText('PLAN CONTRATADO', cardX + 48, cardY + 288)
  ctx.fillText('PERIODO FACTURADO', cardX + 48, cardY + 400)

  ctx.fillStyle = '#e2e8f0'
  ctx.font = '600 34px -apple-system, sans-serif'
  ctx.fillText(data.receiptNumber, cardX + 48, cardY + 116)
  ctx.fillText(data.restaurantName, cardX + 48, cardY + 228)

  ctx.fillStyle = '#34d399'
  ctx.font = '600 34px -apple-system, sans-serif'
  ctx.fillText(data.planLabel, cardX + 48, cardY + 340)

  ctx.fillStyle = '#e2e8f0'
  ctx.font = '600 32px -apple-system, sans-serif'
  ctx.fillText(data.period, cardX + 48, cardY + 452)

  // Desglose económico
  const eur = (n: number) => `${n.toFixed(2).replace('.', ',')} €`
  const lines: Array<[string, string, string, string]> = [
    ['BASE IMPONIBLE', eur(data.base), '#e2e8f0', '600 34px -apple-system, sans-serif'],
    ['IVA 21%', eur(data.iva), '#e2e8f0', '600 34px -apple-system, sans-serif'],
  ]
  let ly = cardY + 560
  for (const [label, value, color, font] of lines) {
    ctx.fillStyle = '#64748b'
    ctx.font = '700 22px -apple-system, sans-serif'
    ctx.fillText(label, cardX + 48, ly)
    ctx.fillStyle = color
    ctx.font = font
    ctx.textAlign = 'right'
    ctx.fillText(value, cardX + cardW - 48, ly)
    ctx.textAlign = 'left'
    ly += 58
  }

  // Total destacado
  const totalY = ly + 26
  roundRect(ctx, cardX + 40, totalY, cardW - 80, 84, 18)
  const totalGradient = ctx.createLinearGradient(cardX, totalY, cardX + cardW, totalY)
  totalGradient.addColorStop(0, 'rgba(16, 185, 129, 0.22)')
  totalGradient.addColorStop(1, 'rgba(34, 211, 238, 0.22)')
  ctx.fillStyle = totalGradient
  ctx.fill()
  ctx.strokeStyle = 'rgba(52, 211, 153, 0.4)'
  ctx.stroke()
  ctx.fillStyle = '#94a3b8'
  ctx.font = '700 24px -apple-system, sans-serif'
  ctx.fillText('TOTAL FACTURADO', cardX + 72, totalY + 52)
  ctx.fillStyle = '#ffffff'
  ctx.font = '900 42px -apple-system, sans-serif'
  ctx.textAlign = 'right'
  ctx.fillText(eur(data.total), cardX + cardW - 72, totalY + 56)
  ctx.textAlign = 'left'

  // Método de pago
  const methodY = cardY + cardH + 56
  ctx.fillStyle = '#64748b'
  ctx.font = '700 22px -apple-system, sans-serif'
  ctx.fillText('MÉTODO DE PAGO', cardX + 48, methodY)
  ctx.fillStyle = '#7dd3fc'
  ctx.font = '600 30px -apple-system, sans-serif'
  ctx.fillText(data.methodLabel, cardX + 48, methodY + 44)

  // Sello circular "PAGADO / ACTIVADO"
  ctx.save()
  ctx.translate(RECEIPT_WIDTH - 260, methodY + 10)
  ctx.rotate(Math.PI / 24)
  ctx.strokeStyle = '#34d399'
  ctx.lineWidth = 5
  ctx.beginPath()
  ctx.arc(0, 0, 118, 0, Math.PI * 2)
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(0, 0, 100, 0, Math.PI * 2)
  ctx.globalAlpha = 0.35
  ctx.stroke()
  ctx.globalAlpha = 1
  ctx.textAlign = 'center'
  ctx.fillStyle = '#34d399'
  ctx.font = '900 26px -apple-system, sans-serif'
  const parts = data.stampText.split('/')
  if (parts.length === 2) {
    ctx.fillText(parts[0].trim(), 0, -12)
    ctx.fillText('/ ' + parts[1].trim(), 0, 24)
  } else {
    ctx.fillText(data.stampText, 0, 6)
  }
  ctx.restore()

  // Pie legal (sin credenciales por diseño)
  ctx.textAlign = 'center'
  ctx.fillStyle = '#475569'
  ctx.font = '400 20px -apple-system, sans-serif'
  ctx.fillText(
    'Fluxo — Gastronomic System · Noia, Galicia · contactofluxosystem@gmail.com',
    RECEIPT_WIDTH / 2,
    RECEIPT_HEIGHT - 120
  )
  ctx.fillText(
    'Documento digital generado automáticamente. Sin firma manuscrita.',
    RECEIPT_WIDTH / 2,
    RECEIPT_HEIGHT - 80
  )
}

/** Exporta el canvas a PNG descargable. */
export function downloadCanvasPng(canvas: HTMLCanvasElement, filename: string): void {
  const link = document.createElement('a')
  link.download = filename
  link.href = canvas.toDataURL('image/png')
  link.click()
}
