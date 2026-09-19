import { chromium } from '@playwright/test'
import path from 'path'
import fs from 'fs'

async function exportPDF() {
  const htmlPath = path.resolve(process.cwd(), 'reporte_mensual_ejecutivo_audit.html')
  const outDownloadPath = path.resolve('C:/Users/mima7/Downloads/Fluxo — Reporte Mensual Ejecutivo (Paso a Paso Desplegable).pdf')
  const outLocalPath = path.resolve(process.cwd(), 'docs/Fluxo — Reporte Mensual Ejecutivo (Paso a Paso Desplegable).pdf')

  console.log(`Cargando HTML: ${htmlPath}`)
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()

  await page.goto(`file:///${htmlPath.replace(/\\/g, '/')}`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1000)

  // Emular media print
  await page.emulateMedia({ media: 'print' })

  // Guardar PDF
  const pdfBuffer = await page.pdf({
    path: outDownloadPath,
    format: 'A4',
    printBackground: true,
    margin: {
      top: '10mm',
      right: '12mm',
      bottom: '10mm',
      left: '12mm',
    },
  })

  // Copiar también a docs si existe la carpeta docs
  if (fs.existsSync(path.dirname(outLocalPath))) {
    fs.writeFileSync(outLocalPath, pdfBuffer)
  }

  await browser.close()
  console.log(`[OK] PDF exportado con éxito a: ${outDownloadPath}`)
  console.log(`Tamaño del archivo: ${pdfBuffer.length} bytes`)
}

exportPDF().catch((err) => {
  console.error('Error al exportar PDF:', err)
  process.exit(1)
})
