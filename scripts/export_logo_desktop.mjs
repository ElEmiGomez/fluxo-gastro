import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

async function main() {
  const desktopDir = 'C:\\Users\\mima7\\OneDrive\\Escritorio';
  
  if (!fs.existsSync(desktopDir)) {
    console.error('Desktop directory not found at', desktopDir);
    process.exit(1);
  }

  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1000, height: 1000 },
    deviceScaleFactor: 1
  });

  const svgRaw = fs.readFileSync('public/icon.svg', 'utf-8');

  // 1. Logo Isotipo Oficial (1000x1000 transparente)
  const htmlIsotipo = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          html, body {
            width: 1000px;
            height: 1000px;
            background: transparent;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .logo-wrapper {
            width: 1000px;
            height: 1000px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          svg {
            width: 1000px;
            height: 1000px;
            display: block;
          }
        </style>
      </head>
      <body>
        <div class="logo-wrapper">
          ${svgRaw}
        </div>
      </body>
    </html>
  `;

  await page.setContent(htmlIsotipo);
  const outPath1 = path.join(desktopDir, 'fluxo_logo_1000x1000.png');
  await page.screenshot({ path: outPath1, omitBackground: true });
  console.log('✅ Generado con éxito:', outPath1);

  // 2. Logo Completo con Tipografía Oficial (1000x1000 transparente)
  const htmlCompleto = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@800;900&family=Inter:wght@600;700&display=swap" rel="stylesheet">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          html, body {
            width: 1000px;
            height: 1000px;
            background: transparent;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: 'Outfit', sans-serif;
          }
          .container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            gap: 36px;
          }
          .icon-box {
            width: 440px;
            height: 440px;
            filter: drop-shadow(0 20px 30px rgba(15, 23, 42, 0.25));
          }
          .icon-box svg {
            width: 100%;
            height: 100%;
            display: block;
          }
          .brand-text {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 12px;
          }
          .brand-title {
            font-size: 110px;
            font-weight: 900;
            letter-spacing: -2px;
            line-height: 0.95;
            color: #0F172A;
          }
          .brand-sub {
            font-family: 'Inter', sans-serif;
            font-size: 26px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 6px;
            color: #0284C7;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon-box">
            ${svgRaw}
          </div>
          <div class="brand-text">
            <h1 class="brand-title">FLUXO</h1>
            <span class="brand-sub">Sistema Gastronómico</span>
          </div>
        </div>
      </body>
    </html>
  `;

  await page.setContent(htmlCompleto);
  // Esperar a que cargue la fuente Google Font
  await page.evaluate(() => document.fonts.ready);
  const outPath2 = path.join(desktopDir, 'fluxo_logo_completo_1000x1000.png');
  await page.screenshot({ path: outPath2, omitBackground: true });
  console.log('✅ Generado con éxito:', outPath2);

  // 3. Logo en Fondo Azul Salón Premium (#0F172A)
  const htmlDark = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          html, body {
            width: 1000px;
            height: 1000px;
            background: #0F172A;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .logo-wrapper {
            width: 650px;
            height: 650px;
            display: flex;
            align-items: center;
            justify-content: center;
            filter: drop-shadow(0 25px 40px rgba(0, 0, 0, 0.45));
          }
          svg {
            width: 100%;
            height: 100%;
            display: block;
          }
        </style>
      </head>
      <body>
        <div class="logo-wrapper">
          ${svgRaw}
        </div>
      </body>
    </html>
  `;

  await page.setContent(htmlDark);
  const outPath3 = path.join(desktopDir, 'fluxo_logo_fondo_salon_1000x1000.png');
  await page.screenshot({ path: outPath3 });
  console.log('✅ Generado con éxito:', outPath3);

  await browser.close();
}

main().catch(err => {
  console.error('Error generando logos:', err);
  process.exit(1);
});
