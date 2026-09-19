import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function generateCartaFijaPdf() {
  const htmlPath = path.resolve(__dirname, '../public/carta_fija_modular.html');
  const htmlContent = fs.readFileSync(htmlPath, 'utf8');

  console.log('Iniciando generador de PDF para Carta Fija Modular...');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.setContent(htmlContent, { waitUntil: 'networkidle' });

  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: {
      top: '8mm',
      bottom: '8mm',
      left: '8mm',
      right: '8mm',
    },
  });

  await browser.close();

  const destinations = [
    path.resolve(__dirname, '../docs/Carta_Fija_Fluxo.pdf'),
    path.resolve(__dirname, '../Carta_Fija_Fluxo.pdf'),
    'C:/Users/mima7/OneDrive/Escritorio/Carta_Fija_Fluxo.pdf'
  ];

  for (const dest of destinations) {
    try {
      const dir = path.dirname(dest);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(dest, pdfBuffer);
      console.log('[OK] Guardado en: ' + dest + ' (' + pdfBuffer.length + ' bytes)');
    } catch (e) {
      console.warn('[WARN] No se pudo guardar en: ' + dest, e.message);
    }
  }

  console.log('Generacion de Carta Fija completada con exito.');
}

generateCartaFijaPdf().catch(console.error);
