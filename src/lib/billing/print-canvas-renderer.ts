// ==============================================================================
// FLUXO — RENDERIZADOR DE IMPRESIÓN A 300 DPI (Canvas 2D nativo)
// Kit de Calle físico (láminas A5/A6 y caballete A4 plegable con línea de
// pliegue) EXCLUSIVO para el QR Maestro de demostración `/demo`, y tarjeta
// digital vertical 9:16 (1080x1920) por local para WhatsApp.
// La matriz del QR se obtiene con la librería `qrcode` (síncrona y
// determinista vía QRCode.create) y se píxel a píxel en el canvas.
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
 * (drawQrMatrix con módulos nítidos, sin interpolación difusa).
 */
export function drawQrMatrix(
  ctx: CanvasRenderingContext2D,
  matrix: QrMatrix,
  x: number,
  y: number,
  size: number
): void {
  const modules = matrix.size
  // El módulo se dibuja en enteros para nitidez de escaneo
  const moduleSize = Math.floor(size / modules)
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

/** Marcas de corte finas en las 4 esquinas + margen de seguridad para plastificado. */
function drawCutMarks(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  margin: number
): void {
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.55)'
  ctx.lineWidth = Math.max(2, W * 0.0022)
  const len = margin * 0.55

  const corners: Array<[number, number, number, number]> = [
    [margin, margin, 1, 1], // esquina sup-izq: hacia dentro
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

const FONT = (weight: number, size: number): string =>
  `${weight} ${size}px -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif`

const INDICATORS: Array<[string, string]> = [
  ['⚡', 'Sin descargar PDFs pesados'],
  ['🌍', 'Multi-idioma automático ES · GAL · EN'],
  ['🛡️', 'Filtro interactivo de alérgenos y lonja'],
]

/** Caras comercial del frente (A5, A6 y mitad superior del caballete A4). */
function drawFrontFace(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  base: number,
  includeQrCode: boolean,
  targetUrl: string
): void {
  // Fondo editorial oscuro
  const bg = ctx.createLinearGradient(0, 0, W, H)
  bg.addColorStop(0, '#070d1a')
  bg.addColorStop(0.55, '#0b1426')
  bg.addColorStop(1, '#101a30')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)

  // Resplandor superior sutil
  const glow = ctx.createRadialGradient(W / 2, -base * 0.4, 0, W / 2, -base * 0.4, base * 1.6)
  glow.addColorStop(0, 'rgba(34, 211, 238, 0.12)')
  glow.addColorStop(1, 'rgba(34, 211, 238, 0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, W, H)

  drawCutMarks(ctx, W, H, base * 0.075)

  // Badge superior
  const badgeY = base * 0.165
  ctx.font = FONT(800, base * 0.032)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const badgeText = 'DEMOSTRACIÓN EN VIVO · HOSTELERÍA'
  const badgeW = ctx.measureText(badgeText).width + base * 0.07
  const badgeH = base * 0.055
  const badgeX = (W - badgeW) / 2
  roundRect(ctx, badgeX, badgeY, badgeW, badgeH, badgeH / 2)
  ctx.fillStyle = 'rgba(16, 185, 129, 0.16)'
  ctx.fill()
  ctx.strokeStyle = 'rgba(52, 211, 153, 0.45)'
  ctx.lineWidth = base * 0.0028
  ctx.stroke()
  ctx.fillStyle = '#34d399'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(badgeText, W / 2, badgeY + badgeH / 2 + base * 0.001)
  ctx.textBaseline = 'alphabetic'

  // Titular de alto impacto
  ctx.fillStyle = '#ffffff'
  ctx.font = FONT(900, base * 0.085)
  ctx.fillText('Escanea con tu cámara', W / 2, base * 0.34)
  ctx.fillStyle = '#22d3ee'
  ctx.fillText('Tu carta en 0,2 segundos', W / 2, base * 0.435)

  // Contenedor central del QR
  const qrBoxSize = base * 0.95
  const qrBoxX = (W - qrBoxSize) / 2
  const qrBoxY = base * 0.52

  roundRect(ctx, qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, base * 0.06)
  ctx.fillStyle = '#ffffff'
  ctx.fill()
  ctx.strokeStyle = 'rgba(94, 234, 212, 0.65)'
  ctx.lineWidth = base * 0.006
  ctx.stroke()

  if (includeQrCode) {
    const pad = qrBoxSize * 0.07
    const matrix = getQrMatrix(targetUrl)
    drawQrMatrix(ctx, matrix, qrBoxX + pad, qrBoxY + pad, qrBoxSize - pad * 2)
  } else {
    // Marcas sutiles de encuadre en las 4 esquinas del marco vacío
    ctx.strokeStyle = '#94a3b8'
    ctx.lineWidth = base * 0.004
    const inset = qrBoxSize * 0.1
    const tick = qrBoxSize * 0.07
    const cx1 = qrBoxX + inset
    const cx2 = qrBoxX + qrBoxSize - inset
    const cy1 = qrBoxY + inset
    const cy2 = qrBoxY + qrBoxSize - inset
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

  // Indicadores debajo del QR
  const indY = qrBoxY + qrBoxSize + base * 0.115
  ctx.textAlign = 'left'
  const indStep = base * 0.088
  INDICATORS.forEach(([icon, text], i) => {
    const y = indY + i * indStep
    ctx.font = FONT(400, base * 0.042)
    ctx.textAlign = 'left'
    ctx.fillText(icon, base * 0.16, y)
    ctx.font = FONT(600, base * 0.038)
    ctx.fillStyle = '#cbd5e1'
    ctx.fillText(text, base * 0.16 + base * 0.055, y)
    ctx.fillStyle = '#ffffff'
  })

  // Pie de marca Fluxo
  ctx.textAlign = 'center'
  ctx.fillStyle = '#ffffff'
  ctx.font = FONT(900, base * 0.055)
  ctx.fillText('FLUXO', W / 2, H - base * 0.18)
  ctx.fillStyle = 'rgba(148, 163, 184, 0.8)'
  ctx.font = FONT(500, base * 0.03)
  ctx.fillText('GASTRONOMIC SYSTEM', W / 2, H - base * 0.13)
}

/** Dorso del caballete: resumen ejecutivo para el hostelero. */
function drawBackFace(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  base: number
): void {
  const bg = ctx.createLinearGradient(0, 0, W, H)
  bg.addColorStop(0, '#0b1426')
  bg.addColorStop(1, '#141f38')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)

  drawCutMarks(ctx, W, H, base * 0.032)

  ctx.textAlign = 'center'
  ctx.fillStyle = '#ffffff'
  ctx.font = FONT(900, base * 0.055)
  ctx.fillText('FLUXO · PARA TU RESTAURANTE', W / 2, base * 0.62 + base * 0.06)

  ctx.fillStyle = '#22d3ee'
  ctx.font = FONT(800, base * 0.042)
  ctx.fillText('Resumen Ejecutivo', W / 2, base * 0.62 + base * 0.135)

  const bullets: string[] = [
    'Carta QR digital en < 0,2 segundos',
    'Sala · comandas y KDS de cocina',
    'Multi-idioma ES · GAL · EN automático',
    'Filtro de alérgenos y precios según lonja',
    'Portal del Dueño con recibos digitales',
  ]
  ctx.textAlign = 'left'
  let by = base * 0.84
  for (const bullet of bullets) {
    ctx.fillStyle = '#34d399'
    ctx.font = FONT(800, base * 0.036)
    ctx.fillText('✓', base * 0.12, by)
    ctx.fillStyle = '#e2e8f0'
    ctx.font = FONT(600, base * 0.034)
    ctx.fillText(bullet, base * 0.12 + base * 0.045, by)
    by += base * 0.075
  }

  // CTA + mini QR
  ctx.textAlign = 'center'
  ctx.fillStyle = '#94a3b8'
  ctx.font = FONT(600, base * 0.03)
  ctx.fillText(
    'Escanea y pides la demo ahora mismo · contactofluxosystem@gmail.com',
    W / 2,
    H - base * 0.1
  )
}

/**
 * Lámina del Kit de Calle a 300 DPI.
 * - A5/A6: lámina plana rígida (frontal comercial con marco QR).
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
    const base = W // métrica relativa al ancho A4 en vertical

    // Mitad superior: frente comercial
    ctx.save()
    ctx.beginPath()
    ctx.rect(0, 0, W, half)
    ctx.clip()
    drawFrontFace(ctx, W, half, base * 0.86, includeQrCode, targetUrl)
    ctx.restore()

    // Línea guía punteada de pliegue en el centro
    const foldY = half
    ctx.save()
    ctx.setLineDash([base * 0.02, base * 0.016])
    ctx.strokeStyle = 'rgba(226, 232, 240, 0.9)'
    ctx.lineWidth = base * 0.0035
    ctx.beginPath()
    ctx.moveTo(base * 0.05, foldY)
    ctx.lineTo(W - base * 0.05, foldY)
    ctx.stroke()
    ctx.restore()

    ctx.fillStyle = '#cbd5e1'
    ctx.font = FONT(800, base * 0.028)
    ctx.textAlign = 'center'
    ctx.fillText('DOBLAR AQUÍ TRAS PLASTIFICAR ←', W / 2, foldY - base * 0.022)
    ctx.fillText('→ DOBLAR AQUÍ TRAS PLASTIFICAR', W / 2, foldY + base * 0.044)

    // Mitad inferior: dorso ejecutivo
    ctx.save()
    ctx.beginPath()
    ctx.rect(0, foldY, W, half)
    ctx.clip()
    ctx.translate(0, foldY)
    drawBackFace(ctx, W, half, base * 0.86)
    ctx.restore()
  } else {
    drawFrontFace(ctx, W, H, W, includeQrCode, targetUrl)
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

  // Isotipo compacto
  roundRect(ctx, W / 2 - 54, W * 0.09, 108, 108, 28)
  ctx.fillStyle = '#ffffff'
  ctx.fill()
  ctx.fillStyle = '#2563eb'
  ctx.font = FONT(900, 62)
  ctx.fillText('F', W / 2, W * 0.09 + 78)

  // Nombre del local
  ctx.fillStyle = '#ffffff'
  ctx.font = FONT(900, 88)
  ctx.fillText(data.localName, W / 2, H * 0.2)

  // Etiqueta oficial
  ctx.fillStyle = '#34d399'
  ctx.font = FONT(700, 40)
  ctx.fillText(data.tagline, W / 2, H * 0.245)

  // Marco QR
  const qrBox = W * 0.72
  const qrX = (W - qrBox) / 2
  const qrY = H * 0.3
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
  ctx.font = FONT(700, 44)
  ctx.fillText(`/p/${data.slug}`, W / 2, qrY + qrBox + W * 0.115)

  // Sellos de velocidad e idiomas
  const sealY = H * 0.87
  const seals: Array<[string, number]> = [
    ['⚡ Carta en 0,2 s', W * 0.31],
    ['🌍 ES · GAL · EN', W * 0.29],
  ]
  ctx.font = FONT(700, 34)
  let sealX = W / 2 - (seals[0][1] + W * 0.03 + seals[1][1]) / 2
  for (const [text, boxW] of seals) {
    roundRect(ctx, sealX, sealY, boxW, 78, 39)
    ctx.fillStyle = 'rgba(16, 185, 129, 0.14)'
    ctx.fill()
    ctx.strokeStyle = 'rgba(52, 211, 153, 0.4)'
    ctx.lineWidth = 3
    ctx.stroke()
    ctx.fillStyle = '#a7f3d0'
    ctx.fillText(text, sealX + boxW / 2, sealY + 51)
    sealX += boxW + W * 0.03
  }

  // Pie de marca
  ctx.fillStyle = '#ffffff'
  ctx.font = FONT(900, 52)
  ctx.fillText('FLUXO', W / 2, H * 0.955)
  ctx.fillStyle = 'rgba(148, 163, 184, 0.85)'
  ctx.font = FONT(500, 28)
  ctx.fillText('GASTRONOMIC SYSTEM', W / 2, H * 0.955 + 44)
}

/** Exporta el canvas a PNG descargable. */
export function downloadCanvasPng(canvas: HTMLCanvasElement, filename: string): void {
  const link = document.createElement('a')
  link.download = filename
  link.href = canvas.toDataURL('image/png')
  link.click()
}

