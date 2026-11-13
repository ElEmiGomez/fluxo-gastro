#!/usr/bin/env node

/**
 * Script de Extracción de Fotogramas WebP para Scrollytelling en Canvas (Rodrigo Olivares Standard)
 * Uso: node scripts/extract_frames.mjs <ruta-video.mp4> <carpeta-destino> [totalFrames=120]
 * Ejemplo: node scripts/extract_frames.mjs public/videos/casamar-loop.mp4 public/assets/frames/casamar 120
 */

import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

const videoPath = process.argv[2]
const outputDir = process.argv[3] || 'public/assets/frames/default'
const totalFrames = parseInt(process.argv[4] || '120', 10)

if (!videoPath) {
  console.log('📖 Uso: node scripts/extract_frames.mjs <ruta-video.mp4> [carpeta-destino] [totalFrames]')
  console.log('💡 Ejemplo: node scripts/extract_frames.mjs public/videos/demo.mp4 public/assets/frames/demo 120')
  process.exit(0)
}

if (!fs.existsSync(videoPath)) {
  console.error(`❌ Error: El archivo de vídeo '${videoPath}' no existe.`)
  process.exit(1)
}

fs.mkdirSync(outputDir, { recursive: true })

console.log(`🎬 Procesando vídeo: ${videoPath}`)
console.log(`📁 Carpeta de salida: ${outputDir}`)
console.log(`🖼️  Extrayendo ${totalFrames} fotogramas WebP optimizados...`)

try {
  // Comprobar si ffmpeg está disponible en el PATH
  execSync('ffmpeg -version', { stdio: 'ignore' })
} catch {
  console.warn('⚠️ FFmpeg no detectado en el sistema. Asegúrate de instalar FFmpeg para la extracción automatizada.')
  console.log('📌 Comando recomendado:')
  console.log(`ffmpeg -i "${videoPath}" -vf "fps=${totalFrames}/5,scale=1280:720" -vcodec libwebp -quality 80 "${outputDir}/frame_%03d.webp"`)
  process.exit(0)
}

const ffmpegCmd = `ffmpeg -i "${videoPath}" -vf "fps=${totalFrames}/5,scale=1280:720" -vcodec libwebp -lossless 0 -compression_level 4 -q:v 80 -y "${outputDir}/frame_%03d.webp"`

try {
  execSync(ffmpegCmd, { stdio: 'inherit' })
  console.log(`✅ ¡Éxito! Fotogramas generados correctamente en ${outputDir}`)
} catch (err) {
  console.error('❌ Error al ejecutar FFmpeg:', err.message)
  process.exit(1)
}
