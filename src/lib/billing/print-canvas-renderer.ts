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
  const safeText = (text && typeof text === 'string' && text.trim().length > 0)
    ? text.trim()
    : 'https://fluxo-gastro.vercel.app/demo'
  const qr = QRCode.create(safeText, { errorCorrectionLevel: 'M' })
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

/**
 * Dibuja el isotipo oficial "F." invertido en color azul `#2563EB`
 * para fondos blancos (`#FFFFFF`) respetando las proporciones exactas del viewBox 0 0 64 64 de Fluxo:
 * Trazo "F" de grosor 8.5 con terminaciones redondeadas (M23 48V16H45 M23 31H38)
 * y punto circular r=4.2 en (39, 46).
 */
export function drawFluxoIsotypeInverted(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  boxSize: number
): void {
  ctx.save()
  const scale = boxSize / 64
  ctx.translate(cx - 32 * scale, cy - 32 * scale)
  ctx.scale(scale, scale)

  ctx.strokeStyle = '#2563eb'
  ctx.fillStyle = '#2563eb'
  ctx.lineWidth = 8.5
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  // Trazo principal de la "F"
  ctx.beginPath()
  ctx.moveTo(23, 48)
  ctx.lineTo(23, 16)
  ctx.lineTo(45, 16)
  ctx.moveTo(23, 31)
  ctx.lineTo(38, 31)
  ctx.stroke()

  // Punto circular
  ctx.beginPath()
  ctx.arc(39, 46, 4.2, 0, Math.PI * 2)
  ctx.fill()

  ctx.restore()
}

/**
 * Fondo blanco editorial de la Cara B invertida (en coordenadas absolutas).
 */
function paintWhiteFaceBackground(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  offsetY: number = 0
): void {
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, offsetY, W, H)

  // Borde sutil perimetral de corte para guillotina
  ctx.strokeStyle = '#cbd5e1'
  ctx.lineWidth = Math.max(2, Math.min(W, H) * 0.002)
  ctx.strokeRect(0, offsetY, W, H)
}

/**
 * Reverso (Cara B - Formato White) por clonación estructural exacta de drawFrontDesign
 * e inversión cromática estricta (fondo blanco #FFFFFF, textos oscuros #0B131E).
 * Apunta a la página web principal de Fluxo (${baseUrl}/).
 */
export function drawWhiteBackDesign(
  ctx: CanvasRenderingContext2D,
  includeQrCode: boolean,
  targetUrl: string
): void {
  const W = DESIGN_W
  const H = DESIGN_H
  ctx.textBaseline = 'alphabetic'
  ctx.textAlign = 'center'

  // 1. CABECERA SIMÉTRICA A 2 LÍNEAS EN TONO OSCURO PROFUNDO (#0B131E)
  const line1 = 'Escanea para'
  const line2 = 'conocer Fluxo'
  const hSize = Math.min(
    fitFontSize(ctx, line1, 800, W * 0.076, W * 0.84),
    fitFontSize(ctx, line2, 800, W * 0.076, W * 0.86)
  )
  ctx.font = FONT(800, hSize)
  ctx.fillStyle = '#0b131e'

  const line1Y = H * 0.145
  const line2Y = line1Y + hSize * 1.25
  ctx.fillText(line1, W / 2, line1Y)
  ctx.fillText(line2, W / 2, line2Y)

  // 2. CONTENEDOR CENTRAL DEL QR (Idéntica posición, proporción y radio de esquina)
  const qrBox = W * 0.76
  const qrX = (W - qrBox) / 2
  const qrY = H * 0.285

  ctx.save()
  ctx.shadowColor = 'rgba(15, 23, 42, 0.08)'
  ctx.shadowBlur = W * 0.03
  ctx.shadowOffsetY = W * 0.015
  roundRect(ctx, qrX, qrY, qrBox, qrBox, qrBox * 0.065)
  ctx.fillStyle = '#ffffff'
  ctx.fill()
  ctx.restore()

  // Borde de referencia para guillotina y delimitación limpia
  ctx.strokeStyle = '#cbd5e1'
  ctx.lineWidth = W * 0.003
  ctx.stroke()

  if (includeQrCode) {
    const pad = qrBox * 0.075
    const matrix = getQrMatrix(targetUrl)
    drawQrMatrix(ctx, matrix, qrX + pad, qrY + pad, qrBox - pad * 2)
  } else {
    // Marco vacío de encuadre en tonos neutros
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

  // Subtítulo indicador en escala Slate-600 bajo el QR
  const legendY = qrY + qrBox + W * 0.065
  ctx.font = FONT(700, W * 0.032)
  ctx.fillStyle = '#475569'
  ctx.fillText('Web Oficial · Sistema Gastronómico', W / 2, legendY)

  // 3. LOGO EN EL PIE: Isotipo Invertido de Fluxo (F azul sobre fondo claro)
  const logoBoxSize = W * 0.095
  const logoCenterY = H * 0.915
  drawFluxoIsotypeInverted(ctx, W / 2, logoCenterY, logoBoxSize)
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
  bg.addColorStop(0, '#070d1a')
  bg.addColorStop(0.55, '#0b131e')
  bg.addColorStop(1, '#0b131e')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)

  const glow = ctx.createRadialGradient(W / 2, H * 0.48, 0, W / 2, H * 0.48, W * 0.85)
  glow.addColorStop(0, 'rgba(34, 211, 238, 0.08)')
  glow.addColorStop(1, 'rgba(34, 211, 238, 0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, W, H)
}

/**
 * Dibuja el isotipo oficial "F." en color blanco puro (`#FFFFFF`)
 * mediante Canvas 2D nativo vectorial, respetando las proporciones
 * exactas del viewBox 0 0 64 64 de Fluxo:
 * Trazo "F" de grosor 8.5 con terminaciones redondeadas (M23 48V16H45 M23 31H38)
 * y punto circular r=4.2 en (39, 46).
 */
export function drawFluxoIsotypeWhite(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  boxSize: number
): void {
  ctx.save()
  const scale = boxSize / 64
  // Desplazar para que (cx, cy) sea el centro del icono (32, 32 en viewBox)
  ctx.translate(cx - 32 * scale, cy - 32 * scale)
  ctx.scale(scale, scale)

  ctx.strokeStyle = '#ffffff'
  ctx.fillStyle = '#ffffff'
  ctx.lineWidth = 8.5
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  // Trazo principal de la "F"
  ctx.beginPath()
  ctx.moveTo(23, 48)
  ctx.lineTo(23, 16)
  ctx.lineTo(45, 16)
  ctx.moveTo(23, 31)
  ctx.lineTo(38, 31)
  ctx.stroke()

  // Punto circular característico en el hueco inferior derecho
  ctx.beginPath()
  ctx.arc(39, 46, 4.2, 0, Math.PI * 2)
  ctx.fill()

  ctx.restore()
}

/**
 * Dibuja un logo circular de local en el pie (p. ej. Casa Mar da Vila)
 * en lugar del isotipo de Fluxo.
 */
export function drawLocalLogoCircle(
  ctx: CanvasRenderingContext2D,
  image: CanvasImageSource,
  cx: number,
  cy: number,
  boxSize: number
): void {
  ctx.save()
  const r = boxSize / 2
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.closePath()
  ctx.clip()
  ctx.drawImage(image, cx - r, cy - r, boxSize, boxSize)
  ctx.restore()

  // Anillo blanco sutil perimetral
  ctx.save()
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)'
  ctx.lineWidth = Math.max(2, boxSize * 0.03)
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.stroke()
  ctx.restore()
}

/**
 * Frente comercial de la lámina, dibujado en el espacio de diseño
 * 1748x2480 (el caller aplica translate + scale).
 * Composición ultra-limpia y minimalista:
 * 1. Cabecera a una sola frase: "Escanea para acceder a la carta" en blanco puro
 * 2. Tarjeta blanca QR centrada verticalmente con mayor aire perimetral
 * 3. Isotipo en el pie: Isotipo "F." blanco puro de Fluxo o logo circular del local
 */
function drawFrontDesign(
  ctx: CanvasRenderingContext2D,
  includeQrCode: boolean,
  targetUrl: string,
  bottomLogoImage?: CanvasImageSource | null
): void {
  const W = DESIGN_W
  const H = DESIGN_H
  ctx.textBaseline = 'alphabetic'
  ctx.textAlign = 'center'

  // 1. CABECERA SIMPLIFICADA A UNA SOLA FRASE
  // Titular centrado "Escanea para acceder a la carta" en dos líneas equilibradas
  const line1 = 'Escanea para'
  const line2 = 'acceder a la carta'
  const hSize = Math.min(
    fitFontSize(ctx, line1, 800, W * 0.076, W * 0.84),
    fitFontSize(ctx, line2, 800, W * 0.076, W * 0.86)
  )
  ctx.font = FONT(800, hSize)
  ctx.fillStyle = '#ffffff'

  // Margen superior amplio (aprox 14-16% de la altura total)
  const line1Y = H * 0.145
  const line2Y = line1Y + hSize * 1.25 // line-height equilibrado de 1.25
  ctx.fillText(line1, W / 2, line1Y)
  ctx.fillText(line2, W / 2, line2Y)

  // 2. CONTENEDOR CENTRAL DEL QR (Centrado ópticamente en el eje vertical)
  // Con la eliminación de los 3 bullets, se aprovecha el espacio para centrar el QR con aire perimetral
  const qrBox = W * 0.76
  const qrX = (W - qrBox) / 2
  const qrY = H * 0.285

  // Sombra / resplandor sutil para flotar sobre el fondo azul noche
  ctx.save()
  ctx.shadowColor = 'rgba(0, 0, 0, 0.45)'
  ctx.shadowBlur = W * 0.03
  ctx.shadowOffsetY = W * 0.015
  roundRect(ctx, qrX, qrY, qrBox, qrBox, qrBox * 0.065)
  ctx.fillStyle = '#ffffff'
  ctx.fill()
  ctx.restore()

  // Borde sutil y limpio
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'
  ctx.lineWidth = W * 0.003
  ctx.stroke()

  if (includeQrCode) {
    const pad = qrBox * 0.075
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

  // 3. LOGO EN EL PIE: Isotipo "F." en blanco puro o logo circular del local
  // Sin textos "FLUXO" ni "GASTRONOMIC SYSTEM". Margen inferior generoso (8-10% del alto).
  const logoBoxSize = W * 0.095
  const logoCenterY = H * 0.915
  if (bottomLogoImage) {
    drawLocalLogoCircle(ctx, bottomLogoImage, W / 2, logoCenterY, logoBoxSize)
  } else {
    drawFluxoIsotypeWhite(ctx, W / 2, logoCenterY, logoBoxSize)
  }
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

export type StreetKitFace = 'front' | 'back'

/**
 * Lámina del Kit de Calle a 300 DPI.
 * - A5/A6: lámina plana rígida:
 *     - face === 'front' (o por defecto): Cara A comercial Black original con marcas de corte.
 *     - face === 'back': Cara B blanca invertida (#FFFFFF / #0B131E) hacia la web principal (${baseUrl}/).
 * - A4_TENT: caballete plegable (frente + línea de pliegue + dorso).
 */
export function drawStreetKit(
  canvas: HTMLCanvasElement,
  format: StreetKitFormat,
  includeQrCode: boolean,
  targetUrl: string,
  bottomLogoImage?: CanvasImageSource | null,
  face: StreetKitFace = 'front'
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
    drawFrontDesign(ctx, includeQrCode, targetUrl, bottomLogoImage)
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

    // Mitad inferior: reverso White invertido
    ctx.save()
    ctx.beginPath()
    ctx.rect(0, foldY, W, half)
    ctx.clip()
    paintWhiteFaceBackground(ctx, W, half, foldY)
    const sBack = Math.min(W / DESIGN_W, half / DESIGN_H)
    ctx.translate((W - DESIGN_W * sBack) / 2, foldY + (half - DESIGN_H * sBack) / 2)
    ctx.scale(sBack, sBack)
    const homeUrl = resolveAbsoluteUrl('/')
    drawWhiteBackDesign(ctx, includeQrCode, homeUrl)
    ctx.restore()
  } else {
    // Formatos planos A5 / A6
    if (face === 'back') {
      paintWhiteFaceBackground(ctx, W, H)
      drawCutMarks(ctx, W, H, Math.min(W, H) * 0.04)
      const s = Math.min(W / DESIGN_W, H / DESIGN_H)
      ctx.save()
      ctx.translate((W - DESIGN_W * s) / 2, (H - DESIGN_H * s) / 2)
      ctx.scale(s, s)
      const homeUrl = resolveAbsoluteUrl('/')
      drawWhiteBackDesign(ctx, includeQrCode, homeUrl)
      ctx.restore()
    } else {
      paintFaceBackground(ctx, W, H)
      drawCutMarks(ctx, W, H, Math.min(W, H) * 0.04)
      const s = Math.min(W / DESIGN_W, H / DESIGN_H)
      ctx.save()
      ctx.translate((W - DESIGN_W * s) / 2, (H - DESIGN_H * s) / 2)
      ctx.scale(s, s)
      drawFrontDesign(ctx, includeQrCode, targetUrl, bottomLogoImage)
      ctx.restore()
    }
  }
}

/**
 * Dibuja en un solo canvas de alta resolución ambas caras (Cara A Black + Cara B White)
 * dispuestas una al lado de la otra con marcas de corte simétricas,
 * ideal para imprimir en hoja A4 y recortar/pegar dorso con dorso para plastificar.
 */
export function drawStreetKitDual(
  canvas: HTMLCanvasElement,
  format: 'A5' | 'A6',
  includeQrCode: boolean,
  targetUrl: string,
  bottomLogoImage?: CanvasImageSource | null
): void {
  const single = STREET_KIT_SIZES[format]
  const gap = Math.round(single.w * 0.04)
  const W = single.w * 2 + gap
  const H = single.h
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // Fondo del pliego general para guillotina
  ctx.fillStyle = '#0f172a'
  ctx.fillRect(0, 0, W, H)

  const s = Math.min(single.w / DESIGN_W, single.h / DESIGN_H)

  // 1. CARA A (IZQUIERDA) - FORMATO BLACK ORIGINAL
  ctx.save()
  ctx.beginPath()
  ctx.rect(0, 0, single.w, single.h)
  ctx.clip()
  paintFaceBackground(ctx, single.w, single.h)
  drawCutMarks(ctx, single.w, single.h, Math.min(single.w, single.h) * 0.04)
  ctx.translate((single.w - DESIGN_W * s) / 2, (single.h - DESIGN_H * s) / 2)
  ctx.scale(s, s)
  drawFrontDesign(ctx, includeQrCode, targetUrl, bottomLogoImage)
  ctx.restore()

  // 2. CARA B (DERECHA) - FORMATO WHITE INVERTIDO (Exactamente las mismas dimensiones)
  const rightX = single.w + gap
  ctx.save()
  ctx.translate(rightX, 0)
  ctx.beginPath()
  ctx.rect(0, 0, single.w, single.h)
  ctx.clip()
  paintWhiteFaceBackground(ctx, single.w, single.h)
  drawCutMarks(ctx, single.w, single.h, Math.min(single.w, single.h) * 0.04)
  ctx.translate((single.w - DESIGN_W * s) / 2, (single.h - DESIGN_H * s) / 2)
  ctx.scale(s, s)
  const homeUrl = resolveAbsoluteUrl('/')
  drawWhiteBackDesign(ctx, includeQrCode, homeUrl)
  ctx.restore()
}

export interface DigitalLocalCardData {
  localName: string
  slug: string
  tagline: string
  targetUrl: string
  bottomLogoImage?: CanvasImageSource | null
}

/** Tarjeta digital vertical 9:16 (1080x1920) para WhatsApp, por local.
 * Diseño minimalista idéntico a la lámina oficial:
 * 1. Fondo azul noche con marcas de encuadre en las cuatro esquinas
 * 2. Titular centrado en 2 líneas: "Escanea para" / "acceder a la carta"
 * 3. Contenedor de QR blanco, nítido y centrado
 * 4. Pie con logotipo circular del local o isotipo "F." blanco
 */
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

  // 1. Fondo azul marino / noche idéntico
  const bg = ctx.createLinearGradient(0, 0, W, H)
  bg.addColorStop(0, '#070d1a')
  bg.addColorStop(0.6, '#0d1728')
  bg.addColorStop(1, '#13203a')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)

  // Resplandor sutil
  const glow = ctx.createRadialGradient(W / 2, H * 0.45, 0, W / 2, H * 0.45, W * 0.8)
  glow.addColorStop(0, 'rgba(34, 211, 238, 0.08)')
  glow.addColorStop(1, 'rgba(34, 211, 238, 0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, W, H)

  // Marcas de corte / encuadre en esquinas
  drawCutMarks(ctx, W, H, W * 0.05)

  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'

  // 2. Titular centrado: "Escanea para acceder a la carta" (2 líneas)
  const line1 = 'Escanea para'
  const line2 = 'acceder a la carta'
  const hSize = Math.min(
    fitFontSize(ctx, line1, 800, W * 0.082, W * 0.86),
    fitFontSize(ctx, line2, 800, W * 0.082, W * 0.88)
  )
  ctx.font = FONT(800, hSize)
  ctx.fillStyle = '#ffffff'

  const line1Y = H * 0.165
  const line2Y = line1Y + hSize * 1.25
  ctx.fillText(line1, W / 2, line1Y)
  ctx.fillText(line2, W / 2, line2Y)

  // 3. Contenedor central del QR (blanco, centrado con aire perimetral amplio)
  const qrBox = W * 0.74
  const qrX = (W - qrBox) / 2
  const qrY = H * 0.28

  ctx.save()
  ctx.shadowColor = 'rgba(0, 0, 0, 0.55)'
  ctx.shadowBlur = W * 0.035
  ctx.shadowOffsetY = W * 0.018
  roundRect(ctx, qrX, qrY, qrBox, qrBox, qrBox * 0.08)
  ctx.fillStyle = '#ffffff'
  ctx.fill()
  ctx.restore()

  // Borde sutil
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)'
  ctx.lineWidth = W * 0.003
  ctx.stroke()

  const pad = qrBox * 0.075
  const matrix = getQrMatrix(data.targetUrl)
  drawQrMatrix(ctx, matrix, qrX + pad, qrY + pad, qrBox - pad * 2)

  // 4. Pie: Logotipo circular del local o Isotipo "F." en blanco puro
  const logoBoxSize = W * 0.11
  const logoCenterY = H * 0.885
  if (data.bottomLogoImage) {
    drawLocalLogoCircle(ctx, data.bottomLogoImage, W / 2, logoCenterY, logoBoxSize)
  } else {
    drawFluxoIsotypeWhite(ctx, W / 2, logoCenterY, logoBoxSize)
  }
}

/**
 * Reverso (Cara B - Formato White) de la tarjeta digital vertical 9:16 (1080x1920)
 * por clonación estructural exacta e inversión cromática:
 * - Fondo blanco #FFFFFF con borde de corte border-slate-300
 * - Titular centrado en #0B131E: "Escanea para" / "conocer Fluxo"
 * - Contenedor QR blanco con sombra neutra y borde slate-300
 * - QR apuntando a la web principal de Fluxo (${baseUrl}/)
 * - Leyenda explicativa en Slate-600
 * - Isotipo invertido "F." en azul Fluxo #2563EB
 */
export function drawDigitalLocalCardBack(
  canvas: HTMLCanvasElement,
  data: { targetUrl?: string } = {}
): void {
  const W = DIGITAL_CARD_W
  const H = DIGITAL_CARD_H
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // 1. Fondo blanco puro con marcas de corte perimetrales
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, W, H)

  drawCutMarks(ctx, W, H, W * 0.05)

  // Borde sutil de corte
  ctx.strokeStyle = '#cbd5e1'
  ctx.lineWidth = W * 0.003
  ctx.strokeRect(0, 0, W, H)

  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'

  // 2. Titular centrado en #0B131E (2 líneas)
  const line1 = 'Escanea para'
  const line2 = 'conocer Fluxo'
  const hSize = Math.min(
    fitFontSize(ctx, line1, 800, W * 0.082, W * 0.86),
    fitFontSize(ctx, line2, 800, W * 0.082, W * 0.88)
  )
  ctx.font = FONT(800, hSize)
  ctx.fillStyle = '#0b131e'

  const line1Y = H * 0.165
  const line2Y = line1Y + hSize * 1.25
  ctx.fillText(line1, W / 2, line1Y)
  ctx.fillText(line2, W / 2, line2Y)

  // 3. Contenedor central del QR (Mismas proporciones y posición)
  const qrBox = W * 0.74
  const qrX = (W - qrBox) / 2
  const qrY = H * 0.28

  ctx.save()
  ctx.shadowColor = 'rgba(15, 23, 42, 0.08)'
  ctx.shadowBlur = W * 0.035
  ctx.shadowOffsetY = W * 0.018
  roundRect(ctx, qrX, qrY, qrBox, qrBox, qrBox * 0.08)
  ctx.fillStyle = '#ffffff'
  ctx.fill()
  ctx.restore()

  // Borde de referencia
  ctx.strokeStyle = '#cbd5e1'
  ctx.lineWidth = W * 0.003
  ctx.stroke()

  const homeUrl = data.targetUrl || resolveAbsoluteUrl('/')
  const pad = qrBox * 0.075
  const matrix = getQrMatrix(homeUrl)
  drawQrMatrix(ctx, matrix, qrX + pad, qrY + pad, qrBox - pad * 2)

  // Leyenda descriptiva bajo el QR en slate-600
  const legendY = qrY + qrBox + W * 0.07
  ctx.font = FONT(700, W * 0.034)
  ctx.fillStyle = '#475569'
  ctx.fillText('Web Oficial · Sistema Gastronómico', W / 2, legendY)

  // 4. Pie: Isotipo Oficial Invertido "F." en azul sobre blanco
  const logoBoxSize = W * 0.11
  const logoCenterY = H * 0.885
  drawFluxoIsotypeInverted(ctx, W / 2, logoCenterY, logoBoxSize)
}
