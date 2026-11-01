// ==============================================================================
// FLUXO — RENDERIZADOR DE IMPRESIÓN A 300 DPI (Canvas 2D nativo)
// Kit de Calle físico (láminas A5/A6 y caballete A4 plegable con línea de
// pliegue) EXCLUSIVO para el QR Maestro de demostración `/demo`, y tarjeta
// digital vertical 9:16 (1080x1920) por local para WhatsApp.
// La matriz del QR se obtiene con la librería `qrcode` (síncrona y
// determinista vía QRCode.create) y se píxel a píxel en el canvas.
//
// SISTEMA DE DISEÑO: todo el arte de las láminas se define en un espacio
// de diseño vertical 1748x2480 y se escala para encajar (letterboxed) en
// cada formato, con títulos ajustados por medición para que jamás
// desborden y jerarquía vertical que respeta el pie de marca.
// ==============================================================================

import QRCode from 'qrcode'

// ---------- Dimensiones de imprenta (300 DPI) ----------
export const STREET_KIT_SIZES = {
  A5: { w: 1748, h: 2480 },
  A6: { w: 1240, h: 1748 },
  A4_TENT: { w: 2480, h: 3508 },
} as const

export type StreetKitFormat = keyof typeof STREET_KIT_SIZES

export const DIGITAL_CARD_W = 1080
export const DIGITAL_CARD_H = 1920

/** Espacio de diseño maestro del frente (retrato). */
const DESIGN_W = 1748
const DESIGN_H = 2480

export interface QrMatrix {
  size: number
  data: Uint8Array
}

/** Matriz determinista y síncrona del QR para pintarla en canvas. */
export function getQrMatrix(text: string): QrMatrix {
  const qr = QRCode.create(text, { errorCorrectionLevel: 'M' })
  return { size: qr.modules.size, data: qr.modules.data }
}

/**
 * Pinta la matriz QR escalada y centrada dentro del rect dado
 * (módulos nítidos en enteros, sin interpolación difusa).
 */
export function drawQrMatrix(
  ctx: CanvasRenderingContext2D,
  matrix: QrMatrix,
  x: number,
  y: number,
  size: number
): void {
  const modules = matrix.size
  const moduleSize = Math.max(1, Math.floor(size / modules))
  const usedSize = moduleSize * modules
  const offsetX = Math.round(x + (size - usedSize) / 2)
  const offsetY = Math.round(y + (size - usedSize) / 2)

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(x, y, size, size)

  ctx.fillStyle = '#0b1120'
  for (let row = 0; row < modules; row++) {
    for (let col = 0; col < modules; col++) {
      if (matrix.data[row * modules + col]) {
        ctx.fillRect(
          offsetX + col * moduleSize,
          offsetY + row * moduleSize,
          moduleSize,
          moduleSize
        )
      }
    }
  }
}

export function resolveAbsoluteUrl(path: string): string {
  if (typeof window === 'undefined') return path
  return new URL(path, window.location.origin).toString()
}

/** Descarga el canvas actual como PNG. */
export function downloadCanvasPng(canvas: HTMLCanvasElement, filename: string): void {
  const link = document.createElement('a')
  link.download = filename
  link.href = canvas.toDataURL('image/png')
  link.click()
}

// ---------- Utilidades de dibujo ----------

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

const FONT = (weight: number, size: number): string =>
  `${weight} ${size}px -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif`

/**
 * Reduce progresivamente el tamaño tipográfico hasta que el texto cabe en el
 * ancho máximo. Garantiza que ningún titular desborde la lámina.
 */
function fitFontSize(
  ctx: CanvasRenderingContext2D,
  text: string,
  weight: number,
  startPx: number,
  maxWidth: number
): number {
  let size = startPx
  for (let i = 0; i < 40 && size > 10; i++) {
    ctx.font = FONT(weight, size)
    if (ctx.measureText(text).width <= maxWidth) break
    size *= 0.94
  }
  ctx.font = FONT(weight, size)
  return size
}

/** Marcas de corte finas en las 4 esquinas (para plastificado). */
function drawCutMarks(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  margin: number
): void {
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.55)'
  ctx.lineWidth = Math.max(2, Math.min(W, H) * 0.0022)
  const len = margin * 0.55

  const corners: Array<[number, number, number, number]> = [
    [margin, margin, 1, 1],
    [W - margin, margin, -1, 1],
    [margin, H - margin, 1, -1],
    [W - margin, H - margin, -1, -1],
  ]
  for (const [cx, cy, dx, dy] of corners) {
    ctx.beginPath()
    ctx.moveTo(cx, cy + dy * len)
    ctx.lineTo(cx, cy)
    ctx.lineTo(cx + dx * len, cy)
    ctx.stroke()
  }
}

/** Fondo editorial oscuro de una cara completa (en coordenadas absolutas). */
function paintFaceBackground(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number
): void {
  const bg = ctx.createLinearGradient(0, 0, W, H)
  bg.addColorStop(0, '#070d1a')
  bg.addColorStop(0.55, '#0b1426')
  bg.addColorStop(1, '#101a30')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)

  const glow = ctx.createRadialGradient(W / 2, -H * 0.15, 0, W / 2, -H * 0.15, H * 0.9)
  glow.addColorStop(0, 'rgba(34, 211, 238, 0.10)')
  glow.addColorStop(1, 'rgba(34, 211, 238, 0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, W, H)
}

const INDICATORS: Array<[string, string]> = [
  ['⚡', 'Sin descargar PDFs pesados'],
  ['🌍', 'Multi-idioma automático ES · GAL · EN'],
  ['🛡️', 'Filtro interactivo de alérgenos y lonja'],
]

/**
 * Frente comercial de la lámina, dibujado en el espacio de diseño
 * 1748x2480 (el caller aplica translate + scale).
 */
function drawFrontDesign(
  ctx: CanvasRenderingContext2D,
  includeQrCode: boolean,
  targetUrl: string
): void {
  const W = DESIGN_W
  const H = DESIGN_H
  ctx.textBaseline = 'alphabetic'

  // Badge superior
  const badgeText = 'DEMOSTRACIÓN EN VIVO · HOSTELERÍA'
  const badgeFont = fitFontSize(ctx, badgeText, 800, W * 0.034, W * 0.52)
  const badgeW = ctx.measureText(badgeText).width + W * 0.06
  const badgeH = H * 0.03
  const badgeX = (W - badgeW) / 2
  const badgeY = H * 0.07
  roundRect(ctx, badgeX, badgeY, badgeW, badgeH, badgeH / 2)
  ctx.fillStyle = 'rgba(16, 185, 129, 0.16)'
  ctx.fill()
  ctx.strokeStyle = 'rgba(52, 211, 153, 0.45)'
  ctx.lineWidth = W * 0.0028
  ctx.stroke()
  ctx.fillStyle = '#34d399'
  ctx.textAlign = 'center'
  ctx.fillText(badgeText, W / 2, badgeY + badgeH * 0.68)

  // Titular de alto impacto (ajustado por medición, jamás desborda)
  const line1 = 'Escanea con tu cámara'
  const line2 = 'Tu carta en 0,2 segundos'
  const hSize =
    Math.min(
      fitFontSize(ctx, line1, 900, W * 0.088, W * 0.84),
      fitFontSize(ctx, line2, 900, W * 0.088, W * 0.92)
    )
  const line1Y = H * 0.135
  const line2Y = line1Y + hSize * 1.22
  ctx.fillStyle = '#ffffff'
  ctx.fillText(line1, W / 2, line1Y)
  ctx.fillStyle = '#22d3ee'
  ctx.fillText(line2, W / 2, line2Y)

  // Contenedor central del QR
  const qrBox = W * 0.72
  const qrX = (W - qrBox) / 2
  const qrY = H * 0.27

  roundRect(ctx, qrX, qrY, qrBox, qrBox, qrBox * 0.06)
  ctx.fillStyle = '#ffffff'
  ctx.fill()
  ctx.strokeStyle = 'rgba(94, 234, 212, 0.65)'
  ctx.lineWidth = W * 0.006
  ctx.stroke()

  if (includeQrCode) {
    const pad = qrBox * 0.07
    const matrix = getQrMatrix(targetUrl)
    drawQrMatrix(ctx, matrix, qrX + pad, qrY + pad, qrBox - pad * 2)
  } else {
    // Marco vacío calibrado con marcas de encuadre en las 4 esquinas
    ctx.strokeStyle = '#94a3b8'
    ctx.lineWidth = W * 0.004
    const inset = qrBox * 0.1
    const tick = qrBox * 0.07
    const cx1 = qrX + inset
    const cx2 = qrX + qrBox - inset
    const cy1 = qrY + inset
    const cy2 = qrY + qrBox - inset
    const ticks: Array<[number, number, number]> = [
      [cx1, cy1, 1],
      [cx2, cy1, -1],
      [cx1, cy2, 1],
      [cx2, cy2, -1],
    ]
    for (const [tx, ty, dirX] of ticks) {
      const dirY = ty === cy1 ? 1 : -1
      ctx.beginPath()
      ctx.moveTo(tx, ty + dirY * tick)
      ctx.lineTo(tx, ty)
      ctx.lineTo(tx + dirX * tick, ty)
      ctx.stroke()
    }
  }

  // Indicadores bajo el QR (orden vertical garantizado, sin pisar el pie)
  ctx.textAlign = 'left'
  const textMaxW = W * 0.68
  const indFontBase = W * 0.036
  const iconFont = W * 0.034
  const indYs = [H * 0.805, H * 0.855, H * 0.905]
  INDICATORS.forEach(([icon, text], i) => {
    const y = indYs[i]
    const fontSize = fitFontSize(ctx, text, 600, indFontBase, textMaxW)
    ctx.fillStyle = '#ffffff'
    ctx.font = FONT(400, iconFont)
    ctx.fillText(icon, W * 0.13, y)
    ctx.fillStyle = '#cbd5e1'
    ctx.fillText(text, W * 0.13 + W * 0.055, y)
  })
  ctx.textAlign = 'center'

  // Pie de marca Fluxo
  ctx.fillStyle = '#ffffff'
  ctx.font = FONT(900, W * 0.048)
  ctx.fillText('FLUXO', W / 2, H * 0.958)
  ctx.fillStyle = 'rgba(148, 163, 184, 0.85)'
  ctx.font = FONT(500, W * 0.026)
  ctx.fillText('GASTRONOMIC SYSTEM', W / 2, H * 0.985)
}

/**
 * Dorso ejecutivo para el hostelero, dibujado en el espacio de diseño
 * 1748x2480 (el caller aplica translate + scale).
 */
function drawBackDesign(
  ctx: CanvasRenderingContext2D,
  includeQrCode: boolean,
  targetUrl: string
): void {
  const W = DESIGN_W
  const H = DESIGN_H
  ctx.textBaseline = 'alphabetic'
  ctx.textAlign = 'center'

  const title = 'FLUXO · PARA TU RESTAURANTE'
  const titleSize = fitFontSize(ctx, title, 900, W * 0.052, W * 0.8)
  ctx.fillStyle = '#ffffff'
  ctx.fillText(title, W / 2, H * 0.12)

  const subtitle = 'Resumen Ejecutivo'
  const subSize = fitFontSize(ctx, subtitle, 800, W * 0.042, W * 0.6)
  ctx.fillStyle = '#22d3ee'
  ctx.fillText(subtitle, W / 2, H * 0.12 + titleSize * 0.4 + subSize)

  // Bloque de bullets ejecutivos
  const bullets: string[] = [
    'Carta QR digital en < 0,2 segundos',
    'Sala · comandas y KDS de cocina',
    'Multi-idioma ES · GAL · EN automático',
    'Filtro de alérgenos y precios según lonja',
    'Portal del Dueño con recibos digitales',
  ]
  ctx.textAlign = 'left'
  let by = H * 0.26
  for (const bullet of bullets) {
    const bSize = fitFontSize(ctx, bullet, 600, W * 0.036, W * 0.66)
    ctx.fillStyle = '#34d399'
    ctx.font = FONT(800, bSize * 0.95)
    ctx.fillText('✓', W * 0.14, by)
    ctx.fillStyle = '#e2e8f0'
    ctx.fillText(bullet, W * 0.14 + W * 0.05, by)
    by += H * 0.055
  }

  // Mini QR de la demo (si el interruptor está activo)
  if (includeQrCode) {
    const mini = W * 0.24
    const mx = (W - mini) / 2
    const my = H * 0.62
    roundRect(ctx, mx, my, mini, mini, mini * 0.09)
    ctx.fillStyle = '#ffffff'
    ctx.fill()
    const pad = mini * 0.08
    const matrix = getQrMatrix(targetUrl)
    drawQrMatrix(ctx, matrix, mx + pad, my + pad, mini - pad * 2)
    ctx.textAlign = 'center'
    ctx.fillStyle = '#94a3b8'
    ctx.font = FONT(600, W * 0.024)
    ctx.fillText('Escanea y prueba la demo ahora mismo', W / 2, my + mini + W * 0.05)
  }

  // CTA inferior
  ctx.textAlign = 'center'
  ctx.fillStyle = '#cbd5e1'
  ctx.font = FONT(700, W * 0.028)
  ctx.fillText('FLUXO — Gastronomic System', W / 2, H * 0.93)
  ctx.fillStyle = '#94a3b8'
  ctx.font = FONT(500, W * 0.024)
  ctx.fillText('contactofluxosystem@gmail.com', W / 2, H * 0.965)
}

/**
 * Lámina del Kit de Calle a 300 DPI.
 * - A5/A6: lámina plana rígida (frente comercial con marco QR).
 * - A4_TENT: caballete plegable (frente + línea de pliegue + dorso ejecutivo).
 */
export function drawStreetKit(
  canvas: HTMLCanvasElement,
  format: StreetKitFormat,
  includeQrCode: boolean,
  targetUrl: string
): void {
  const { w: W, h: H } = STREET_KIT_SIZES[format]
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  if (format === 'A4_TENT') {
    const half = H / 2

    // Mitad superior: frente comercial escalado/centrado
    ctx.save()
    ctx.beginPath()
    ctx.rect(0, 0, W, half)
    ctx.clip()
    paintFaceBackground(ctx, W, half)
    const sFront = Math.min(W / DESIGN_W, half / DESIGN_H)
    ctx.translate((W - DESIGN_W * sFront) / 2, (half - DESIGN_H * sFront) / 2)
    ctx.scale(sFront, sFront)
    drawFrontDesign(ctx, includeQrCode, targetUrl)
    ctx.restore()

    // Marcas de corte de toda la hoja
    drawCutMarks(ctx, W, H, Math.min(W, H) * 0.03)

    // Línea guía punteada de pliegue en el centro
    const foldY = half
    ctx.save()
    ctx.setLineDash([W * 0.02, W * 0.016])
    ctx.strokeStyle = 'rgba(226, 232, 240, 0.85)'
    ctx.lineWidth = W * 0.003
    ctx.beginPath()
    ctx.moveTo(W * 0.05, foldY)
    ctx.lineTo(W - W * 0.05, foldY)
    ctx.stroke()
    ctx.restore()

    ctx.fillStyle = '#cbd5e1'
    ctx.font = FONT(800, W * 0.022)
    ctx.textAlign = 'center'
    ctx.fillText('DOBLAR AQUÍ TRAS PLASTIFICAR', W / 2, foldY - W * 0.014)
    ctx.fillText('DOBLAR AQUÍ TRAS PLASTIFICAR', W / 2, foldY + W * 0.034)

    // Mitad inferior: dorso ejecutivo escalado/centrado
    ctx.save()
    ctx.beginPath()
    ctx.rect(0, foldY, W, half)
    ctx.clip()
    const bgBack = ctx.createLinearGradient(0, foldY, 0, H)
    bgBack.addColorStop(0, '#0b1426')
    bgBack.addColorStop(1, '#141f38')
    ctx.fillStyle = bgBack
    ctx.fillRect(0, foldY, W, half)
    const sBack = Math.min(W / DESIGN_W, half / DESIGN_H)
    ctx.translate((W - DESIGN_W * sBack) / 2, foldY + (half - DESIGN_H * sBack) / 2)
    ctx.scale(sBack, sBack)
    drawBackDesign(ctx, includeQrCode, targetUrl)
    ctx.restore()
  } else {
    paintFaceBackground(ctx, W, H)
    drawCutMarks(ctx, W, H, Math.min(W, H) * 0.04)
    const s = Math.min(W / DESIGN_W, H / DESIGN_H)
    ctx.save()
    ctx.translate((W - DESIGN_W * s) / 2, (H - DESIGN_H * s) / 2)
    ctx.scale(s, s)
    drawFrontDesign(ctx, includeQrCode, targetUrl)
    ctx.restore()
  }
}

export interface DigitalLocalCardData {
  localName: string
  slug: string
  tagline: string
  targetUrl: string
}

/** Tarjeta digital vertical 9:16 (1080x1920) para WhatsApp, por local. */
export function drawDigitalLocalCard(
  canvas: HTMLCanvasElement,
  data: DigitalLocalCardData
): void {
  const W = DIGITAL_CARD_W
  const H = DIGITAL_CARD_H
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const bg = ctx.createLinearGradient(0, 0, W, H)
  bg.addColorStop(0, '#070d1a')
  bg.addColorStop(0.6, '#0d1728')
  bg.addColorStop(1, '#13203a')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)

  const glow = ctx.createRadialGradient(W / 2, H * 0.32, 0, W / 2, H * 0.32, W * 0.9)
  glow.addColorStop(0, 'rgba(34, 211, 238, 0.14)')
  glow.addColorStop(1, 'rgba(34, 211, 238, 0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, W, H)

  drawCutMarks(ctx, W, H, W * 0.045)

  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'

  // Isotipo compacto
  roundRect(ctx, W / 2 - 54, W * 0.09, 108, 108, 28)
  ctx.fillStyle = '#ffffff'
  ctx.fill()
  ctx.fillStyle = '#2563eb'
  ctx.font = FONT(900, 62)
  ctx.fillText('F', W / 2, W * 0.09 + 78)

  // Nombre del local (ajustado por medición para no desbordar)
  ctx.fillStyle = '#ffffff'
  const nameSize = fitFontSize(ctx, data.localName, 900, 84, W * 0.88)
  ctx.fillText(data.localName, W / 2, W * 0.09 + 108 + nameSize * 1.15)

  // Etiqueta oficial
  ctx.fillStyle = '#34d399'
  const tagSize = fitFontSize(ctx, data.tagline, 700, 38, W * 0.82)
  ctx.fillText(data.tagline, W / 2, W * 0.09 + 108 + nameSize * 1.15 + tagSize * 1.5)

  // Marco QR
  const qrBox = W * 0.72
  const qrX = (W - qrBox) / 2
  const qrY = H * 0.31
  roundRect(ctx, qrX, qrY, qrBox, qrBox, 56)
  ctx.fillStyle = '#ffffff'
  ctx.fill()
  ctx.strokeStyle = 'rgba(94, 234, 212, 0.7)'
  ctx.lineWidth = 8
  ctx.stroke()

  const pad = qrBox * 0.07
  const matrix = getQrMatrix(data.targetUrl)
  drawQrMatrix(ctx, matrix, qrX + pad, qrY + pad, qrBox - pad * 2)

  // Ruta de la carta
  ctx.fillStyle = '#7dd3fc'
  ctx.font = FONT(700, 42)
  ctx.fillText(`/p/${data.slug}`, W / 2, qrY + qrBox + W * 0.115)

  // Sellos de velocidad e idiomas
  const sealY = H * 0.855
  const sealFont = fitFontSize(ctx, '⚡ Carta en 0,2 s', 700, 34, W * 0.27)
  ctx.font = FONT(700, sealFont)
  const seals: Array<[string, number]> = [
    ['⚡ Carta en 0,2 s', W * 0.31],
    ['🌍 ES · GAL · EN', W * 0.27],
  ]
  let sealX = W / 2 - (seals[0][1] + W * 0.03 + seals[1][1]) / 2
  for (const [text, boxW] of seals) {
    roundRect(ctx, sealX, sealY, boxW, 76, 38)
    ctx.fillStyle = 'rgba(16, 185, 129, 0.14)'
    ctx.fill()
    ctx.strokeStyle = 'rgba(52, 211, 153, 0.4)'
    ctx.lineWidth = 3
    ctx.stroke()
    ctx.fillStyle = '#a7f3d0'
    ctx.fillText(text, sealX + boxW / 2, sealY + 50)
    sealX += boxW + W * 0.03
  }

  // Pie de marca
  ctx.fillStyle = '#ffffff'
  ctx.font = FONT(900, 50)
  ctx.fillText('FLUXO', W / 2, H * 0.952)
  ctx.fillStyle = 'rgba(148, 163, 184, 0.85)'
  ctx.font = FONT(500, 27)
  ctx.fillText('GASTRONOMIC SYSTEM', W / 2, H * 0.952 + 42)
}
