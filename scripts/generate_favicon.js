const fs = require('fs')
const path = require('path')
const zlib = require('zlib')

const WIDTH = 32
const HEIGHT = 32

// Creamos un buffer RGBA de 32x32
const pixels = Buffer.alloc(WIDTH * HEIGHT * 4, 0)

function setPixel(x, y, r, g, b, a = 255) {
  if (x < 0 || x >= WIDTH || y < 0 || y >= HEIGHT) return
  const idx = (y * WIDTH + x) * 4
  pixels[idx] = r
  pixels[idx + 1] = g
  pixels[idx + 2] = b
  pixels[idx + 3] = a
}

// Dibujar squircle de fondo
const radius = 8
for (let y = 0; y < HEIGHT; y++) {
  for (let x = 0; x < WIDTH; x++) {
    // Verificamos esquinas redondeadas
    let inside = true
    const dx = x < radius ? radius - x : x >= WIDTH - radius ? x - (WIDTH - 1 - radius) : 0
    const dy = y < radius ? radius - y : y >= HEIGHT - radius ? y - (HEIGHT - 1 - radius) : 0
    if (dx > 0 && dy > 0) {
      if (dx * dx + dy * dy > radius * radius) {
        inside = false
      }
    }

    if (inside) {
      // Gradiente de Azul Real (37, 99, 235) a Celeste Eléctrico (14, 165, 233)
      const t = (x + y) / (WIDTH + HEIGHT)
      const r = Math.round(37 * (1 - t) + 14 * t)
      const g = Math.round(99 * (1 - t) + 165 * t)
      const b = Math.round(235 * (1 - t) + 233 * t)
      setPixel(x, y, r, g, b, 255)
    }
  }
}

// Dibujar Letra F blanca
// Pilar vertical (x: 10 a 14, y: 7 a 25)
for (let y = 7; y <= 25; y++) {
  for (let x = 10; x <= 14; x++) {
    setPixel(x, y, 255, 255, 255, 255)
  }
}
// Brazo superior (x: 10 a 22, y: 7 a 11)
for (let y = 7; y <= 11; y++) {
  for (let x = 10; x <= 22; x++) {
    setPixel(x, y, 255, 255, 255, 255)
  }
}
// Brazo medio (x: 10 a 18, y: 14 a 18)
for (let y = 14; y <= 18; y++) {
  for (let x = 10; x <= 18; x++) {
    setPixel(x, y, 255, 255, 255, 255)
  }
}

// Puntos de redondeo para la F
// Cap superior brazo 1
setPixel(23, 8, 255, 255, 255, 220)
setPixel(23, 9, 255, 255, 255, 255)
setPixel(23, 10, 255, 255, 255, 220)

// Cap medio brazo 2
setPixel(19, 15, 255, 255, 255, 220)
setPixel(19, 16, 255, 255, 255, 255)
setPixel(19, 17, 255, 255, 255, 220)

// Cap inferior pilar
setPixel(11, 26, 255, 255, 255, 220)
setPixel(12, 26, 255, 255, 255, 255)
setPixel(13, 26, 255, 255, 255, 220)

// Punto celeste característico F. (en x: 20, y: 24 radio 2.5)
const dotX = 20
const dotY = 24
for (let y = dotY - 2; y <= dotY + 2; y++) {
  for (let x = dotX - 2; x <= dotX + 2; x++) {
    const d = (x - dotX) * (x - dotX) + (y - dotY) * (y - dotY)
    if (d <= 5) {
      setPixel(x, y, 56, 189, 248, 255) // #38BDF8
    }
  }
}

// Construir archivo PNG
function makePng(width, height, rgbaBuffer) {
  // Cada fila tiene 1 byte de filtro (0) + width*4 bytes
  const rowSize = 1 + width * 4
  const uncompressed = Buffer.alloc(height * rowSize)
  for (let y = 0; y < height; y++) {
    uncompressed[y * rowSize] = 0 // Filter type 0 (None)
    rgbaBuffer.copy(uncompressed, y * rowSize + 1, y * width * 4, (y + 1) * width * 4)
  }

  const idatData = zlib.deflateSync(uncompressed)

  function crc32(buf) {
    let crc = 0xffffffff
    for (let i = 0; i < buf.length; i++) {
      let byte = buf[i]
      crc = crc ^ byte
      for (let j = 0; j < 8; j++) {
        const mask = -(crc & 1)
        crc = (crc >>> 1) ^ (0xedb88320 & mask)
      }
    }
    return (crc ^ 0xffffffff) >>> 0
  }

  function makeChunk(type, data) {
    const len = data.length
    const typeBuf = Buffer.from(type, 'ascii')
    const chunk = Buffer.alloc(8 + len + 4)
    chunk.writeUInt32BE(len, 0)
    typeBuf.copy(chunk, 4)
    data.copy(chunk, 8)
    const crcVal = crc32(Buffer.concat([typeBuf, data]))
    chunk.writeUInt32BE(crcVal, 8 + len)
    return chunk
  }

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // color type RGBA
  ihdr[10] = 0 // compression
  ihdr[11] = 0 // filter
  ihdr[12] = 0 // interlace

  const ihdrChunk = makeChunk('IHDR', ihdr)
  const idatChunk = makeChunk('IDAT', idatData)
  const iendChunk = makeChunk('IEND', Buffer.alloc(0))

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk])
}

const pngBuffer = makePng(WIDTH, HEIGHT, pixels)

// Construir archivo ICO encapsulando el PNG
function makeIco(pngBuf) {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0) // Reserved
  header.writeUInt16LE(1, 2) // Type 1 = Icon
  header.writeUInt16LE(1, 4) // 1 image

  const dir = Buffer.alloc(16)
  dir[0] = WIDTH // Width
  dir[1] = HEIGHT // Height
  dir[2] = 0 // Color count
  dir[3] = 0 // Reserved
  dir.writeUInt16LE(1, 4) // Planes
  dir.writeUInt16LE(32, 6) // Bit count
  dir.writeUInt32LE(pngBuf.length, 8) // Size in bytes
  dir.writeUInt32LE(22, 12) // Offset (6 + 16 = 22)

  return Buffer.concat([header, dir, pngBuf])
}

const icoBuffer = makeIco(pngBuffer)

// Guardar en todas las ubicaciones canónicas
const baseDir = path.resolve(__dirname, '..')
fs.writeFileSync(path.join(baseDir, 'public', 'favicon.ico'), icoBuffer)
fs.writeFileSync(path.join(baseDir, 'src', 'app', 'favicon.ico'), icoBuffer)
fs.writeFileSync(path.join(baseDir, 'public', 'favicon.png'), pngBuffer)
fs.writeFileSync(path.join(baseDir, 'public', 'icon.png'), pngBuffer)

console.log('Favicon ICO and PNG successfully generated!')
