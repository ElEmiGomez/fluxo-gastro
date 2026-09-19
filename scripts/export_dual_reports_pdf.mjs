import { chromium } from '@playwright/test'
import path from 'path'
import fs from 'fs'

async function exportDualReports() {
  const browser = await chromium.launch({ headless: true })

  // 1. Exportar Resumen Ejecutivo (Vía 1 - 1 Sola Página)
  const resumenHtml = path.resolve(process.cwd(), 'reporte_resumen_ejecutivo.html')
  const resumenPdfPath = path.resolve('C:/Users/mima7/Downloads/Fluxo — Resumen Ejecutivo (Vision Dueno 1 Pag).pdf')
  
  console.log(`Cargando Vía 1: ${resumenHtml}`)
  const page1 = await browser.newPage()
  await page1.goto(`file:///${resumenHtml.replace(/\\/g, '/')}`, { waitUntil: 'networkidle' })
  await page1.waitForTimeout(600)
  await page1.emulateMedia({ media: 'print' })
  const pdf1 = await page1.pdf({
    path: resumenPdfPath,
    format: 'A4',
    printBackground: true,
    margin: {
      top: '8mm',
      right: '10mm',
      bottom: '8mm',
      left: '10mm'
    }
  })
  console.log(`[OK] Vía 1 exportada a: ${resumenPdfPath} (${pdf1.length} bytes)`)
  await page1.close()

  // 2. Exportar Reporte Operativo (Vía 2 - Detalle y Auditoría) si existe
  const operativoHtml = path.resolve(process.cwd(), 'reporte_operativo_datos.html')
  const operativoPdfPath = path.resolve('C:/Users/mima7/Downloads/Fluxo — Reporte Operativo de Datos (Vision Encargado).pdf')
  if (fs.existsSync(operativoHtml)) {
    console.log(`Cargando Vía 2: ${operativoHtml}`)
    const page2 = await browser.newPage()
    await page2.goto(`file:///${operativoHtml.replace(/\\/g, '/')}`, { waitUntil: 'networkidle' })
    await page2.waitForTimeout(600)
    await page2.emulateMedia({ media: 'print' })
    const pdf2 = await page2.pdf({
      path: operativoPdfPath,
      format: 'A4',
      printBackground: true,
      margin: {
        top: '10mm',
        right: '12mm',
        bottom: '10mm',
        left: '12mm'
      }
    })
    console.log(`[OK] Vía 2 exportada a: ${operativoPdfPath} (${pdf2.length} bytes)`)
    await page2.close()
  }

  await browser.close()
}

exportDualReports().catch((err) => {
  console.error('Error al exportar reportes:', err)
  process.exit(1)
})
