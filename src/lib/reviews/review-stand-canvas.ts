/**
 * Renderizador a 300 DPI (Canvas 2D nativo) para descargar los expositores
 * de reseñas Google (Peana 10x15 cm y Tarjeta PVC 85.6x54 mm) listos para imprenta/librería.
 */

import { getQrMatrix, drawQrMatrix, downloadCanvasPng } from '@/lib/billing/print-canvas-renderer'

export type ReviewStandFormat = 'stand_10x15' | 'card_pvc'
export type ReviewStandLanguage = 'es' | 'gl' | 'bilingual'

export interface ReviewStandCanvasOptions {
  slug: string
  restaurantName: string
  targetUrl: string
  logoUrl?: string
  showLogo: boolean
  language: ReviewStandLanguage
  isDefaultTemplate?: boolean
}

// 300 DPI: 1 mm = 11.811 px
const PX_PER_MM = 300 / 25.4
const mm = (val: number) => Math.round(val * PX_PER_MM)

// Dimensiones exactas a 300 DPI
const STAND_W = mm(100) // 1181 px
const STAND_H = mm(150) // 1772 px
const PVC_W = mm(85.6)  // 1011 px
const PVC_H = mm(54)    // 638 px
const A4_LANDSCAPE_W = mm(297) // 3508 px
const A4_LANDSCAPE_H = mm(210) // 2480 px

const FONT_SANS = '"Inter", "Segoe UI", system-ui, -apple-system, sans-serif'

function getCopy(language: ReviewStandLanguage) {
  return {
    es: {
      thanks: 'GRACIAS',
      subtitle: 'por ayudarnos a mejorar',
      importance: 'Tu opinión es muy importante para nosotros',
      nfcPrompt: 'Acerca tu móvil o escanea el QR',
      backTitle: '¿CÓMO USARLO?',
      backSubtitle: 'Deja tu reseña en 5 segundos',
      stepNfcTitle: '1. Con NFC (sin abrir cámara)',
      stepNfcDesc: 'Acerca la parte trasera de tu móvil al centro de la cara delantera y pulsa la notificación.',
      stepNfcHint: 'iPhone: parte superior (cámara) · Android: centro trasero',
      stepQrTitle: '2. Con Código QR (cámara)',
      stepQrDesc: 'Abre la cámara de tu móvil, apunta al código QR de la cara delantera y toca el enlace.',
      stepDone: 'Elige tus estrellas en Google y pulsa Publicar',
    },
    gl: {
      thanks: 'GRAZAS',
      subtitle: 'por axudarnos a mellorar',
      importance: 'A túa opinión é moi importante para nós',
      nfcPrompt: 'Achega o teu móbil ou escanea o QR',
      backTitle: 'COMO USALO?',
      backSubtitle: 'Deixa a túa reseña en 5 segundos',
      stepNfcTitle: '1. Con NFC (sen abrir cámara)',
      stepNfcDesc: 'Achega a parte traseira do teu móbil ao centro da cara dianteira e preme a notificación.',
      stepNfcHint: 'iPhone: parte superior (cámara) · Android: centro traseiro',
      stepQrTitle: '2. Con Código QR (cámara)',
      stepQrDesc: 'Abre a cámara do teu móbil, apunta ao código QR da cara dianteira e toca a ligazón.',
      stepDone: 'Elixe as túas estrelas en Google e preme Publicar',
    },
    bilingual: {
      thanks: 'GRACIAS',
      subtitle: 'por ayudarnos a mejorar · por axudarnos a mellorar',
      importance: 'Tu opinión es muy importante para nosotros',
      nfcPrompt: 'Acerca tu móvil o escanea el QR',
      backTitle: '¿CÓMO USARLO? · COMO USALO?',
      backSubtitle: '5 segundos · NFC o QR',
      stepNfcTitle: '1. Acerca tu móvil (NFC)',
      stepNfcDesc: 'Toca el centro delantero con tu teléfono desbloqueado (iPhone arriba · Android centro) y abre el aviso.',
      stepNfcHint: 'Sin abrir apps · Sen abrir apps',
      stepQrTitle: '2. Escanea el QR (Cámara)',
      stepQrDesc: 'Abre la cámara, apunta al QR delantero y pulsa el enlace de Google Maps.',
      stepDone: 'Valora tu visita y pulsa Publicar · Grazas!',
    },
  }[language]
}

async function loadImageSafe(src?: string): Promise<HTMLImageElement | null> {
  if (!src) return null
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.lineTo(x + w - radius, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius)
  ctx.lineTo(x + w, y + h - radius)
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h)
  ctx.lineTo(x + radius, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius)
  ctx.lineTo(x, y + radius)
  ctx.quadraticCurveTo(x, y, x + radius, y)
  ctx.closePath()
}

function drawGoogleRing(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  lineWidth: number
) {
  const quadrants: Array<{ start: number; end: number; color: string }> = [
    { start: Math.PI, end: Math.PI * 1.5, color: '#4285F4' },       // Top-Left: Blue
    { start: Math.PI * 1.5, end: Math.PI * 2, color: '#EA4335' },   // Top-Right: Red
    { start: 0, end: Math.PI * 0.5, color: '#FBBC05' },             // Bottom-Right: Yellow
    { start: Math.PI * 0.5, end: Math.PI, color: '#34A853' },       // Bottom-Left: Green
  ]
  ctx.save()
  ctx.lineWidth = lineWidth
  ctx.lineCap = 'butt'
  for (const q of quadrants) {
    ctx.beginPath()
    ctx.arc(cx, cy, radius, q.start, q.end)
    ctx.strokeStyle = q.color
    ctx.stroke()
  }
  ctx.restore()
}

function drawStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  outerR: number,
  color = '#FBBC05'
) {
  const innerR = outerR * 0.42
  ctx.save()
  ctx.beginPath()
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outerR : innerR
    const angle = (Math.PI / 5) * i - Math.PI / 2
    const x = cx + Math.cos(angle) * r
    const y = cy + Math.sin(angle) * r
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.closePath()
  ctx.fillStyle = color
  ctx.fill()
  ctx.restore()
}

function drawStarsRow(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  starRadius: number,
  gap: number
) {
  const step = starRadius * 2 + gap
  const startX = centerX - step * 2
  for (let i = 0; i < 5; i++) {
    drawStar(ctx, startX + i * step, centerY, starRadius)
  }
}

function drawNfcIcon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string
) {
  ctx.save()
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = Math.max(2, size * 0.1)
  ctx.lineCap = 'round'

  const cy = y + size / 2
  ctx.beginPath()
  ctx.arc(x + size * 0.18, cy, size * 0.08, 0, Math.PI * 2)
  ctx.fill()

  const arcs = [0.28, 0.48, 0.68]
  for (const rFrac of arcs) {
    ctx.beginPath()
    ctx.arc(x + size * 0.12, cy, size * rFrac, -Math.PI / 3.2, Math.PI / 3.2)
    ctx.stroke()
  }
  ctx.restore()
}

function drawWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
): number {
  const words = text.split(/\s+/)
  let line = ''
  let currentY = y

  for (let i = 0; i < words.length; i++) {
    const testLine = line ? `${line} ${words[i]}` : words[i]
    if (ctx.measureText(testLine).width > maxWidth && line) {
      ctx.fillText(line, x, currentY)
      line = words[i]
      currentY += lineHeight
    } else {
      line = testLine
    }
  }
  if (line) {
    ctx.fillText(line, x, currentY)
    currentY += lineHeight
  }
  return currentY
}

function drawFluxoFooterMark(ctx: CanvasRenderingContext2D, rightX: number, centerY: number) {
  ctx.save()
  ctx.font = `800 30px ${FONT_SANS}`
  ctx.fillStyle = '#64748b'
  ctx.textAlign = 'right'
  ctx.textBaseline = 'middle'
  ctx.fillText('FLUXO', rightX, centerY)
  const textW = ctx.measureText('FLUXO').width

  const boxSize = 50
  const boxX = rightX - textW - 14 - boxSize
  const boxY = centerY - boxSize / 2
  drawRoundedRect(ctx, boxX, boxY, boxSize, boxSize, 12)
  ctx.fillStyle = '#ffffff'
  ctx.fill()
  ctx.lineWidth = 2.5
  ctx.strokeStyle = '#cbd5e1'
  ctx.stroke()

  ctx.font = `900 32px ${FONT_SANS}`
  ctx.fillStyle = '#1D4ED8'
  ctx.textAlign = 'center'
  ctx.fillText('F', boxX + boxSize / 2, centerY + 2)
  ctx.restore()
}

export async function renderStand10x15FrontCanvas(
  opts: ReviewStandCanvasOptions
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas')
  canvas.width = STAND_W
  canvas.height = STAND_H
  const ctx = canvas.getContext('2d')!
  const copy = getCopy(opts.language)

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, STAND_W, STAND_H)

  const logoImg = opts.showLogo ? await loadImageSafe(opts.logoUrl) : null
  const cx = STAND_W / 2

  let topY = logoImg ? mm(8) : mm(11)
  if (logoImg) {
    const logoSize = mm(17)
    ctx.save()
    ctx.beginPath()
    ctx.arc(cx, topY + logoSize / 2, logoSize / 2, 0, Math.PI * 2)
    ctx.closePath()
    ctx.clip()
    ctx.drawImage(logoImg, cx - logoSize / 2, topY, logoSize, logoSize)
    ctx.restore()

    ctx.beginPath()
    ctx.arc(cx, topY + logoSize / 2, logoSize / 2, 0, Math.PI * 2)
    ctx.lineWidth = 3
    ctx.strokeStyle = '#e2e8f0'
    ctx.stroke()

    topY += logoSize + mm(5)
  }

  // GRACIAS
  ctx.fillStyle = '#0f172a'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  ctx.font = `800 88px ${FONT_SANS}`
  ctx.fillText(copy.thanks, cx, topY)

  // Subtítulo
  ctx.fillStyle = '#1f2937'
  ctx.font = `500 ${opts.language === 'bilingual' ? 42 : 54}px ${FONT_SANS}`
  ctx.fillText(copy.subtitle, cx, topY + 104)

  // Aro Google + QR central
  const ringCy = logoImg ? mm(79) : mm(74)
  const ringR = mm(32)
  drawGoogleRing(ctx, cx, ringCy, ringR, mm(3.2))

  const qrSize = mm(39)
  const qrMatrix = getQrMatrix(opts.targetUrl)
  drawQrMatrix(ctx, qrMatrix, cx - qrSize / 2, ringCy - qrSize / 2, qrSize)

  // Bloque inferior (respetando 17mm libres abajo para peana de madera)
  const starsY = STAND_H - mm(37)
  drawStarsRow(ctx, cx, starsY, 34, 16)

  ctx.fillStyle = '#0f172a'
  ctx.font = `600 44px ${FONT_SANS}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  ctx.fillText(copy.importance, cx, starsY + 52)

  // Aviso NFC discreto
  ctx.font = `600 38px ${FONT_SANS}`
  const nfcTextW = ctx.measureText(copy.nfcPrompt).width
  const nfcIconSize = 42
  const totalW = nfcIconSize + 14 + nfcTextW
  const startX = cx - totalW / 2
  const nfcY = starsY + 114
  drawNfcIcon(ctx, startX, nfcY, nfcIconSize, '#475569')
  ctx.fillStyle = '#334155'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillText(copy.nfcPrompt, startX + nfcIconSize + 14, nfcY + nfcIconSize / 2)

  return canvas
}

export async function renderStand10x15BackCanvas(
  opts: ReviewStandCanvasOptions
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas')
  canvas.width = STAND_W
  canvas.height = STAND_H
  const ctx = canvas.getContext('2d')!
  const copy = getCopy(opts.language)
  const cx = STAND_W / 2

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, STAND_W, STAND_H)

  // Barra superior 4 colores Google
  const barH = mm(3)
  const segW = STAND_W / 4
  const colors = ['#4285F4', '#EA4335', '#FBBC05', '#34A853']
  colors.forEach((c, idx) => {
    ctx.fillStyle = c
    ctx.fillRect(idx * segW, 0, segW + 1, barH)
  })

  // Cabecera
  ctx.fillStyle = '#0f172a'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  ctx.font = `800 ${opts.language === 'bilingual' ? 56 : 68}px ${FONT_SANS}`
  ctx.fillText(copy.backTitle, cx, mm(10))

  ctx.fillStyle = '#475569'
  ctx.font = `500 42px ${FONT_SANS}`
  ctx.fillText(copy.backSubtitle, cx, mm(19))

  // Tarjetas de pasos NFC + QR
  const padX = mm(7)
  const cardW = STAND_W - padX * 2
  const card1Y = mm(32)
  const card1H = mm(42)

  // Paso 1: NFC
  drawRoundedRect(ctx, padX, card1Y, cardW, card1H, 28)
  ctx.fillStyle = '#f8fafc'
  ctx.fill()
  ctx.lineWidth = 3
  ctx.strokeStyle = '#cbd5e1'
  ctx.stroke()

  ctx.beginPath()
  ctx.arc(padX + 68, card1Y + 68, 34, 0, Math.PI * 2)
  ctx.fillStyle = '#dbeafe'
  ctx.fill()
  drawNfcIcon(ctx, padX + 46, card1Y + 46, 44, '#1d4ed8')

  ctx.fillStyle = '#0f172a'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.font = `800 42px ${FONT_SANS}`
  ctx.fillText(copy.stepNfcTitle, padX + 122, card1Y + 68)

  ctx.fillStyle = '#1e293b'
  ctx.textBaseline = 'top'
  ctx.font = `500 36px ${FONT_SANS}`
  const afterDescY = drawWrappedText(ctx, copy.stepNfcDesc, padX + 38, card1Y + 132, cardW - 76, 48)

  ctx.fillStyle = '#475569'
  ctx.font = `600 31px ${FONT_SANS}`
  ctx.fillText(copy.stepNfcHint, padX + 38, afterDescY + 14)

  // Paso 2: QR
  const card2Y = card1Y + card1H + mm(5)
  const card2H = mm(34)
  drawRoundedRect(ctx, padX, card2Y, cardW, card2H, 28)
  ctx.fillStyle = '#f8fafc'
  ctx.fill()
  ctx.lineWidth = 3
  ctx.strokeStyle = '#cbd5e1'
  ctx.stroke()

  ctx.beginPath()
  ctx.arc(padX + 68, card2Y + 68, 34, 0, Math.PI * 2)
  ctx.fillStyle = '#fef3c7'
  ctx.fill()

  // Mini icono QR
  ctx.fillStyle = '#b45309'
  const qx = padX + 51
  const qy = card2Y + 51
  ctx.fillRect(qx, qy, 14, 14)
  ctx.fillRect(qx + 20, qy, 14, 14)
  ctx.fillRect(qx, qy + 20, 14, 14)
  ctx.fillRect(qx + 22, qy + 22, 12, 12)

  ctx.fillStyle = '#0f172a'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.font = `800 42px ${FONT_SANS}`
  ctx.fillText(copy.stepQrTitle, padX + 122, card2Y + 68)

  ctx.fillStyle = '#1e293b'
  ctx.textBaseline = 'top'
  ctx.font = `500 36px ${FONT_SANS}`
  drawWrappedText(ctx, copy.stepQrDesc, padX + 38, card2Y + 132, cardW - 76, 48)

  // Cierre + Estrellas + Pie Fluxo
  const footerBaseY = STAND_H - mm(38)
  drawStarsRow(ctx, cx, footerBaseY, 28, 14)

  ctx.fillStyle = '#0f172a'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  ctx.font = `700 38px ${FONT_SANS}`
  ctx.fillText(copy.stepDone, cx, footerBaseY + 46)

  const lineY = STAND_H - mm(25)
  ctx.strokeStyle = '#e2e8f0'
  ctx.lineWidth = 2.5
  ctx.beginPath()
  ctx.moveTo(padX, lineY)
  ctx.lineTo(STAND_W - padX, lineY)
  ctx.stroke()

  ctx.fillStyle = '#64748b'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.font = `700 32px ${FONT_SANS}`
  ctx.fillText(opts.isDefaultTemplate ? 'Google Reviews' : opts.restaurantName, padX, lineY + mm(5.5))
  drawFluxoFooterMark(ctx, STAND_W - padX, lineY + mm(5.5))

  return canvas
}

export async function renderPvcFrontCanvas(
  opts: ReviewStandCanvasOptions
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas')
  canvas.width = PVC_W
  canvas.height = PVC_H
  const ctx = canvas.getContext('2d')!
  const copy = getCopy(opts.language)

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, PVC_W, PVC_H)

  const logoImg = opts.showLogo ? await loadImageSafe(opts.logoUrl) : null
  const padX = mm(5)
  let textY = logoImg ? mm(5) : mm(9)

  if (logoImg) {
    const logoSize = mm(9)
    ctx.save()
    ctx.beginPath()
    ctx.arc(padX + logoSize / 2, textY + logoSize / 2, logoSize / 2, 0, Math.PI * 2)
    ctx.closePath()
    ctx.clip()
    ctx.drawImage(logoImg, padX, textY, logoSize, logoSize)
    ctx.restore()
    textY += logoSize + mm(2.5)
  }

  ctx.fillStyle = '#0f172a'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  ctx.font = `800 54px ${FONT_SANS}`
  ctx.fillText(copy.thanks, padX, textY)

  ctx.fillStyle = '#1f2937'
  ctx.font = `500 34px ${FONT_SANS}`
  ctx.fillText(
    opts.language === 'bilingual' ? 'por ayudarnos a mejorar' : copy.subtitle,
    padX,
    textY + 62
  )

  drawStarsRow(ctx, padX + 106, textY + 142, 20, 10)

  ctx.fillStyle = '#1e293b'
  ctx.font = `600 26px ${FONT_SANS}`
  drawWrappedText(ctx, copy.importance, padX, textY + 180, mm(42), 34)

  const nfcY = PVC_H - mm(9.5)
  drawNfcIcon(ctx, padX, nfcY, 32, '#475569')
  ctx.fillStyle = '#334155'
  ctx.font = `600 24px ${FONT_SANS}`
  ctx.textBaseline = 'middle'
  ctx.fillText(copy.nfcPrompt, padX + 40, nfcY + 16)

  // Aro Google + QR derecho
  const ringCx = PVC_W - mm(24)
  const ringCy = PVC_H / 2
  drawGoogleRing(ctx, ringCx, ringCy, mm(18.5), mm(2))
  const qrSize = mm(21.5)
  const qrMatrix = getQrMatrix(opts.targetUrl)
  drawQrMatrix(ctx, qrMatrix, ringCx - qrSize / 2, ringCy - qrSize / 2, qrSize)

  return canvas
}

export async function renderPvcBackCanvas(
  opts: ReviewStandCanvasOptions
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas')
  canvas.width = PVC_W
  canvas.height = PVC_H
  const ctx = canvas.getContext('2d')!
  const copy = getCopy(opts.language)

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, PVC_W, PVC_H)

  const barH = mm(2)
  const segW = PVC_W / 4
  ;['#4285F4', '#EA4335', '#FBBC05', '#34A853'].forEach((c, idx) => {
    ctx.fillStyle = c
    ctx.fillRect(idx * segW, 0, segW + 1, barH)
  })

  const padX = mm(5)
  ctx.fillStyle = '#0f172a'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  ctx.font = `800 36px ${FONT_SANS}`
  ctx.fillText(copy.backTitle, padX, mm(5))
  drawStarsRow(ctx, PVC_W - padX - 88, mm(7), 16, 8)

  ctx.fillStyle = '#0f172a'
  ctx.font = `700 28px ${FONT_SANS}`
  ctx.fillText(copy.stepNfcTitle, padX, mm(15))
  ctx.fillStyle = '#334155'
  ctx.font = `500 24px ${FONT_SANS}`
  drawWrappedText(ctx, copy.stepNfcDesc, padX, mm(20), PVC_W - padX * 2, 32)

  ctx.fillStyle = '#0f172a'
  ctx.font = `700 28px ${FONT_SANS}`
  ctx.fillText(copy.stepQrTitle, padX, mm(32))
  ctx.fillStyle = '#334155'
  ctx.font = `500 24px ${FONT_SANS}`
  drawWrappedText(ctx, copy.stepQrDesc, padX, mm(37), PVC_W - padX * 2, 32)

  const lineY = PVC_H - mm(9.5)
  ctx.strokeStyle = '#e2e8f0'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(padX, lineY)
  ctx.lineTo(PVC_W - padX, lineY)
  ctx.stroke()

  ctx.fillStyle = '#475569'
  ctx.font = `700 24px ${FONT_SANS}`
  ctx.textBaseline = 'middle'
  ctx.fillText(copy.stepDone, padX, lineY + mm(4.8))

  return canvas
}

/**
 * Compone una lámina A4 apaisada (297x210 mm a 300 DPI) con Frente + Reverso
 * lado a lado con marcas de corte discontinuas, lista para llevar a la librería.
 */
export async function renderA4PrintSheetCanvas(
  format: ReviewStandFormat,
  opts: ReviewStandCanvasOptions
): Promise<HTMLCanvasElement> {
  const frontCanvas =
    format === 'stand_10x15'
      ? await renderStand10x15FrontCanvas(opts)
      : await renderPvcFrontCanvas(opts)
  const backCanvas =
    format === 'stand_10x15'
      ? await renderStand10x15BackCanvas(opts)
      : await renderPvcBackCanvas(opts)

  const a4 = document.createElement('canvas')
  a4.width = A4_LANDSCAPE_W
  a4.height = A4_LANDSCAPE_H
  const ctx = a4.getContext('2d')!

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, A4_LANDSCAPE_W, A4_LANDSCAPE_H)

  const gap = mm(12)
  const totalW = frontCanvas.width * 2 + gap
  const startX = Math.round((A4_LANDSCAPE_W - totalW) / 2)
  const startY = Math.round((A4_LANDSCAPE_H - frontCanvas.height) / 2)

  // Instrucción discreta arriba fuera de la zona de corte
  ctx.fillStyle = '#64748b'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  ctx.font = `600 32px ${FONT_SANS}`
  ctx.fillText(
    `FLUXO · Imprimir en A4 apaisado al 100% (tamaño real) en cartulina 300 g · Recortar por línea discontinua`,
    A4_LANDSCAPE_W / 2,
    mm(10)
  )

  ctx.drawImage(frontCanvas, startX, startY)
  ctx.drawImage(backCanvas, startX + frontCanvas.width + gap, startY)

  // Líneas discontinuas de corte exacto
  ctx.save()
  ctx.strokeStyle = '#94a3b8'
  ctx.lineWidth = 3
  ctx.setLineDash([16, 12])
  ctx.strokeRect(startX, startY, frontCanvas.width, frontCanvas.height)
  ctx.strokeRect(startX + frontCanvas.width + gap, startY, backCanvas.width, backCanvas.height)
  ctx.restore()

  // Etiquetas discretas debajo del recorte
  ctx.fillStyle = '#94a3b8'
  ctx.font = `600 28px ${FONT_SANS}`
  ctx.textAlign = 'center'
  ctx.fillText('CARA DELANTERA (Frente)', startX + frontCanvas.width / 2, startY + frontCanvas.height + 24)
  ctx.fillText(
    'PARTE DE ATRÁS (Reverso)',
    startX + frontCanvas.width + gap + backCanvas.width / 2,
    startY + backCanvas.height + 24
  )

  return a4
}

export async function downloadReviewStandAsset(
  kind: 'a4_sheet' | 'front' | 'back',
  format: ReviewStandFormat,
  opts: ReviewStandCanvasOptions
): Promise<void> {
  const baseName = `${opts.isDefaultTemplate ? 'predeterminada' : opts.slug}_${
    format === 'stand_10x15' ? 'peana-10x15' : 'tarjeta-pvc'
  }`

  if (kind === 'a4_sheet') {
    const canvas = await renderA4PrintSheetCanvas(format, opts)
    downloadCanvasPng(canvas, `fluxo_resenas_${baseName}_A4_imprenta_300dpi.png`)
    return
  }

  if (kind === 'front') {
    const canvas =
      format === 'stand_10x15'
        ? await renderStand10x15FrontCanvas(opts)
        : await renderPvcFrontCanvas(opts)
    downloadCanvasPng(canvas, `fluxo_resenas_${baseName}_frente_300dpi.png`)
    return
  }

  const canvas =
    format === 'stand_10x15'
      ? await renderStand10x15BackCanvas(opts)
      : await renderPvcBackCanvas(opts)
  downloadCanvasPng(canvas, `fluxo_resenas_${baseName}_reverso_300dpi.png`)
}
