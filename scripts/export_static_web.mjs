#!/usr/bin/env node
/**
 * FLUXO GASTRONOMIC SYSTEM — EXPORTADOR ESTÁTICO 2-EN-1 PARA HOSTERÍAS (cPanel / Hostinger / Apache)
 * 
 * Genera un paquete web estático completamente autónomo y autocontenido para un local gastronómico:
 * 1. index.html  -> Home cinemática a 60fps, scrollytelling, selector de espacios, reserva WhatsApp directa.
 * 2. carta.html  -> Catálogo digital interactivo (Plan Carta Fluxo), búsqueda en vivo y alérgenos.
 * 3. styles.css  -> Sistema de diseño editorial, paleta cálida (#F6F3EC) y modo nocturno (#0B0D10).
 * 4. script.js   -> Interactividad vanilla a 60fps (partículas, cálculo de horarios en vivo, drawer de reserva).
 * 5. assets/     -> Imágenes y recursos multimedia optimizados.
 * 6. [slug].zip  -> Archivo comprimido listo para subir y descomprimir en cualquier hosting tradicional.
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'
import { getGastronomicTenant } from '../src/lib/web-tenants.ts'
import { buildRestaurantJsonLd } from '../src/lib/seo/gastronomic-jsonld.ts'
import { getOpeningStatus } from '../src/lib/opening-hours-calculator.ts'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')

const targetSlug = process.argv[2] || 'casa-mar-da-vila'

console.log('='.repeat(80))
console.log(` 🍽️  FLUXO — EXPORTADOR ESTÁTICO CINEMÁTICO 2-EN-1`)
console.log(` Target Slug: ${targetSlug}`)
console.log('='.repeat(80))

async function runExporter() {
  const tenant = await getGastronomicTenant(targetSlug)
  if (!tenant) {
    console.error(`❌ Error: No se encontró configuración para el slug "${targetSlug}".`)
    console.error(`  Slugs disponibles: "casa-mar-da-vila", "bar-jaratusas"`)
    process.exit(1)
  }

  const outBaseDir = path.join(rootDir, 'out', 'sites')
  const siteDir = path.join(outBaseDir, tenant.slug)
  const assetsDir = path.join(siteDir, 'assets')
  const dishesAssetsDir = path.join(assetsDir, 'dishes')

  // Crear directorios de salida
  fs.mkdirSync(dishesAssetsDir, { recursive: true })

  // Función auxiliar para copiar cualquier imagen de public/ a assets/dishes/
  const copiedImages = new Map()
  const copyAssetIfLocal = (rawPath) => {
    if (!rawPath || !rawPath.startsWith('/images/')) return
    const srcFile = path.join(rootDir, 'public', rawPath)
    const baseName = path.basename(rawPath)
    const destFile = path.join(dishesAssetsDir, baseName)
    if (fs.existsSync(srcFile)) {
      fs.copyFileSync(srcFile, destFile)
      copiedImages.set(rawPath, `./assets/dishes/${baseName}`)
    }
  }

  // 1. Copiar imágenes de platos, hero, logo, flancos y ambientes
  for (const dish of tenant.dishes) {
    copyAssetIfLocal(dish.image)
  }
  copyAssetIfLocal(tenant.heroImagePoster)
  copyAssetIfLocal(tenant.logoUrl)
  copyAssetIfLocal(tenant.flankLeftImage)
  copyAssetIfLocal(tenant.flankRightImage)

  for (const amb of tenant.ambiences) {
    copyAssetIfLocal(amb.imageDay)
    copyAssetIfLocal(amb.imageNight)
  }

  const resolveImg = (originalPath) => copiedImages.get(originalPath) || originalPath
  const isUrbanBrewery = tenant.archetype === 'urban_street' || tenant.archetype === 'tavern'
  const signatureDishes = tenant.dishes.filter((d) => d.isSignature).slice(0, 4)
  if (signatureDishes.length === 0 && tenant.dishes.length > 0) {
    signatureDishes.push(tenant.dishes[0])
  }

  // 2. Generar JSON-LD
  const jsonLd = buildRestaurantJsonLd(tenant)

  // 3. Generar styles.css
  const cssContent = `/* FLUXO EDITORIAL GASTRONOMIC STYLESHEET */
:root {
  --bg-warm: ${isUrbanBrewery ? '#0A0B0E' : '#F6F3EC'};
  --bg-card: ${isUrbanBrewery ? '#12151C' : '#FFFFFF'};
  --bg-card-subtle: ${isUrbanBrewery ? '#151922' : '#EDE8DE'};
  --text-ink: ${isUrbanBrewery ? '#F6F3EC' : '#141311'};
  --text-muted: ${isUrbanBrewery ? 'rgba(246, 243, 236, 0.72)' : 'rgba(20, 19, 17, 0.7)'};
  --accent-fire: ${tenant.accentColor || (isUrbanBrewery ? '#F59E0B' : '#C85A32')};
  --accent-fire-hover: ${isUrbanBrewery ? '#D97706' : '#b04d28'};
  --bg-dark: ${isUrbanBrewery ? '#0A0B0E' : '#0B0D10'};
  --bg-dark-card: #14161B;
  --text-light: #F6F3EC;
  --font-serif: ${isUrbanBrewery ? "'Anton', 'Sora', sans-serif" : "'Instrument Serif', Georgia, serif"};
  --font-sans: 'Sora', 'Instrument Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-mono: 'Sora', monospace;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  scroll-behavior: smooth;
  font-family: var(--font-sans);
  background-color: var(--bg-warm);
  color: var(--text-ink);
  -webkit-font-smoothing: antialiased;
}

body {
  overflow-x: hidden;
  padding-bottom: 72px;
}

@media (min-width: 768px) {
  body {
    padding-bottom: 0;
  }
}

.font-serif { font-family: var(--font-serif); }
.font-sans { font-family: var(--font-sans); }
.font-mono { font-family: var(--font-mono); }

/* Header */
.site-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 50;
  background: rgba(11, 13, 16, 0.88);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  height: 72px;
  display: flex;
  align-items: center;
}

.header-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.brand-link {
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  color: var(--text-light);
  font-size: 1.5rem;
  font-weight: 700;
  font-family: var(--font-serif);
}

.brand-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent-fire);
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 24px;
}

.nav-link {
  color: rgba(246, 243, 236, 0.8);
  text-decoration: none;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  font-weight: 500;
  transition: color 0.2s;
}

.nav-link:hover {
  color: var(--accent-fire);
}

.btn-primary {
  background: var(--accent-fire);
  color: #fff;
  padding: 10px 20px;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  text-decoration: none;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.btn-primary:hover {
  background: var(--accent-fire-hover);
  transform: translateY(-1px);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  padding: 10px 20px;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  text-decoration: none;
  border: 1px solid rgba(255, 255, 255, 0.2);
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.18);
}

/* Hero */
.hero-section {
  position: relative;
  width: 100%;
  height: 85vh;
  min-height: 620px;
  background: var(--bg-dark);
  display: flex;
  align-items: flex-end;
  overflow: hidden;
}

.hero-poster {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: brightness(0.75);
}

.hero-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, var(--bg-dark) 0%, rgba(11, 13, 16, 0.4) 50%, rgba(0,0,0,0.3) 100%);
  pointer-events: none;
}

.hero-content {
  position: relative;
  z-index: 10;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px 64px 24px;
  width: 100%;
  color: #fff;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.25em;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 16px;
}

.hero-title {
  font-family: var(--font-serif);
  font-size: clamp(2.5rem, 6vw, 4.5rem);
  line-height: 1.08;
  font-weight: 400;
  max-width: 800px;
}

.hero-title em {
  font-style: italic;
  color: rgba(255, 255, 255, 0.95);
}

.hero-desc {
  margin-top: 16px;
  font-size: 1.05rem;
  color: rgba(255, 255, 255, 0.85);
  max-width: 600px;
  line-height: 1.6;
}

.hero-actions {
  margin-top: 32px;
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

/* Signature Dish */
.signature-section {
  padding: 96px 24px;
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr;
  gap: 48px;
  align-items: center;
}

@media (min-width: 992px) {
  .signature-section {
    grid-template-columns: 1.2fr 1fr;
    gap: 64px;
  }
}

.dish-image-wrapper {
  position: relative;
  width: 320px;
  height: 320px;
  margin: 0 auto;
}

@media (min-width: 640px) {
  .dish-image-wrapper {
    width: 420px;
    height: 420px;
  }
}

.dish-shadow {
  position: absolute;
  inset: 16px;
  border-radius: 50%;
  background: rgba(20, 19, 17, 0.25);
  filter: blur(28px);
  transform: translateY(32px) scale(0.9);
}

.dish-circle-img {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  box-shadow: 0 32px 48px rgba(20, 19, 17, 0.22);
}

.price-pill {
  position: absolute;
  bottom: 0;
  right: 16px;
  background: var(--text-ink);
  color: var(--text-light);
  padding: 8px 18px;
  border-radius: 9999px;
  font-family: var(--font-serif);
  font-size: 1.25rem;
  font-weight: 700;
  box-shadow: 0 8px 24px rgba(0,0,0,0.3);
}

/* Section Common */
.section-wrapper {
  padding: 80px 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.section-title-wrap {
  margin-bottom: 48px;
  text-align: center;
}

.section-tag {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.24em;
  font-weight: 700;
  color: var(--accent-fire);
  display: block;
  margin-bottom: 8px;
}

.section-title {
  font-family: var(--font-serif);
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 700;
}

/* Ambience cards */
.ambience-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 32px;
}

.ambience-card {
  background: rgba(237, 232, 222, 0.6);
  border: 1px solid rgba(20, 19, 17, 0.1);
  border-radius: 24px;
  overflow: hidden;
  transition: all 0.3s;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.ambience-card:hover {
  background: #fff;
  border-color: rgba(20, 19, 17, 0.25);
  box-shadow: 0 20px 32px rgba(20, 19, 17, 0.08);
}

.ambience-img {
  width: 100%;
  height: 240px;
  object-fit: cover;
}

.ambience-body {
  padding: 24px;
}

.ambience-name {
  font-family: var(--font-serif);
  font-size: 1.5rem;
  font-weight: 700;
}

.ambience-subtitle {
  font-size: 0.8rem;
  color: rgba(20, 19, 17, 0.6);
}

.ambience-desc {
  margin-top: 12px;
  font-size: 0.85rem;
  color: rgba(20, 19, 17, 0.8);
  line-height: 1.6;
}

/* Reviews */
.reviews-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 24px;
}

.review-card {
  background: #fff;
  border: 1px solid rgba(20, 19, 17, 0.1);
  border-radius: 24px;
  padding: 32px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 16px;
}

.review-text {
  font-family: var(--font-serif);
  font-size: 1.15rem;
  font-style: italic;
  line-height: 1.6;
  color: rgba(20, 19, 17, 0.9);
}

/* Drawer & Modal */
.modal-overlay {
  display: none;
  position: fixed;
  inset: 0;
  z-index: 100;
  background: rgba(11, 13, 16, 0.8);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.modal-overlay.active {
  display: flex;
}

.modal-box {
  background: var(--bg-warm);
  width: 100%;
  max-width: 520px;
  border-radius: 24px;
  padding: 28px;
  box-shadow: 0 24px 48px rgba(0,0,0,0.3);
  max-height: 90vh;
  overflow-y: auto;
}

/* Thumb zone bar (Mobile) */
.thumb-bar {
  display: flex;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 45;
  background: rgba(11, 13, 16, 0.96);
  backdrop-filter: blur(12px);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding: 10px 16px;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

@media (min-width: 768px) {
  .thumb-bar {
    display: none;
  }
}

.thumb-btn {
  flex: 1;
  text-align: center;
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.75rem;
  text-decoration: none;
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px 4px;
  border-radius: 8px;
}

.thumb-btn-primary {
  flex: 2;
  background: var(--accent-fire);
  color: #fff;
  font-weight: 700;
  border-radius: 12px;
  padding: 12px;
}

/* Print */
@media print {
  .site-header, .thumb-bar, .modal-overlay, .btn-primary, .btn-secondary {
    display: none !important;
  }
  body {
    background: #fff !important;
    color: #000 !important;
    padding: 0 !important;
  }
}
`
  fs.writeFileSync(path.join(siteDir, 'styles.css'), cssContent, 'utf8')

  // 4. Generar script.js
  const scriptContent = `/* FLUXO GASTRONOMIC INTERACTIVITY (60FPS VANILLA JS) */
document.addEventListener('DOMContentLoaded', () => {
  // 1. Selector de Ambientes (Mediodía vs Noche)
  const lightModeBtns = document.querySelectorAll('[data-light-mode]');
  const ambienceImgs = document.querySelectorAll('[data-amb-img]');
  const ambienceNotes = document.querySelectorAll('[data-amb-note]');

  lightModeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.getAttribute('data-light-mode');
      lightModeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      ambienceImgs.forEach(img => {
        const src = mode === 'day' ? img.getAttribute('data-img-day') : img.getAttribute('data-img-night');
        if (src) img.src = src;
      });

      ambienceNotes.forEach(note => {
        const text = mode === 'day' ? note.getAttribute('data-note-day') : note.getAttribute('data-note-night');
        if (text) note.textContent = text;
      });
    });
  });

  // 2. Modal de Reserva WhatsApp
  const modal = document.getElementById('reservation-modal');
  const openBtns = document.querySelectorAll('[data-open-reservation]');
  const closeBtn = document.getElementById('close-reservation-btn');
  const zoneSelect = document.getElementById('res-zone');

  openBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetZone = btn.getAttribute('data-zone');
      if (targetZone && zoneSelect) {
        zoneSelect.value = targetZone;
      }
      if (modal) modal.classList.add('active');
    });
  });

  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => modal.classList.remove('active'));
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('active');
    });
  }

  // 3. Generador de Mensaje Estructurado WhatsApp
  const sendBtn = document.getElementById('send-whatsapp-btn');
  const copyBtn = document.getElementById('copy-whatsapp-btn');
  const restaurantName = "${tenant.name.replace(/"/g, '\\"')}";
  const whatsappNumber = "${tenant.whatsappNumber}";

  function buildReservationText() {
    const name = document.getElementById('res-name')?.value || 'Cliente';
    const diners = document.getElementById('res-diners')?.value || '2';
    const date = document.getElementById('res-date')?.value || 'Próxima';
    const shift = document.getElementById('res-shift')?.value || 'Almuerzo';
    const time = document.getElementById('res-time')?.value || '14:00';
    const zone = document.getElementById('res-zone')?.value || 'Salón Principal';
    const notes = document.getElementById('res-notes')?.value || '';

    let msg = \`Hola \${restaurantName}, me gustaría solicitar una reserva:\` + '\\n';
    msg += \`• A nombre de: \${name}\` + '\\n';
    msg += \`• Fecha y Turno: \${date} (\${shift} a las \${time} hs)\` + '\\n';
    msg += \`• Comensales: \${diners} personas\` + '\\n';
    msg += \`• Zona deseada: \${zone}\` + '\\n';
    if (notes.trim()) {
      msg += \`• Preferencias / Alérgenos: \${notes.trim()}\` + '\\n';
    }
    msg += '\\n¿Tienen disponibilidad para esta fecha? Muchas gracias.';
    return msg;
  }

  if (sendBtn) {
    sendBtn.addEventListener('click', () => {
      const text = buildReservationText();
      const cleanNumber = whatsappNumber.replace(/\\D/g, '');
      const url = \`https://wa.me/\${cleanNumber}?text=\${encodeURIComponent(text)}\`;
      window.open(url, '_blank');
    });
  }

  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      const text = buildReservationText();
      try {
        await navigator.clipboard.writeText(text);
        const originalText = copyBtn.textContent;
        copyBtn.textContent = '✔ Mensaje Copiado al Portapapeles';
        setTimeout(() => { copyBtn.textContent = originalText; }, 2500);
      } catch (err) {
        alert('Copia el siguiente texto:\\n\\n' + text);
      }
    });
  }

  // 4. Acordeón de FAQs
  const faqToggles = document.querySelectorAll('[data-faq-toggle]');
  faqToggles.forEach(toggle => {
    toggle.addEventListener('click', () => {
      const body = toggle.nextElementSibling;
      if (body) {
        const isHidden = body.style.display === 'none' || !body.style.display;
        body.style.display = isHidden ? 'block' : 'none';
        const icon = toggle.querySelector('.faq-icon');
        if (icon) icon.textContent = isHidden ? '▲' : '▼';
      }
    });
  });

  // 5. Canvas de Fondo Cinemático (Micro-loop de partículas de brasa a 60 fps)
  const canvas = document.getElementById('hero-canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = canvas.parentElement?.clientHeight || 600;

    window.addEventListener('resize', () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = canvas.parentElement?.clientHeight || 600;
    });

    const particles = Array.from({ length: 36 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2 + 0.5,
      vy: -(Math.random() * 0.5 + 0.2),
      alpha: Math.random() * 0.5 + 0.1,
    }));

    function loop() {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = 'rgba(200, 90, 50, 0.4)';
      particles.forEach(p => {
        p.y += p.vy;
        if (p.y < 0) {
          p.y = height + 5;
          p.x = Math.random() * width;
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  }
});
`
  fs.writeFileSync(path.join(siteDir, 'script.js'), scriptContent, 'utf8')

  // 5. Generar index.html
  const signatureDish = tenant.dishes.find(d => d.isSignature) || tenant.dishes[0]
  const todayStatus = getOpeningStatus(tenant.openingHours, new Date())

  const indexHtml = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${tenant.name} · ${tenant.tagline}</title>
  <meta name="description" content="Web oficial de ${tenant.name} en ${tenant.city}. Carta, horarios y reserva directa sin comisiones.">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:ital,wght@0,400..700;1,400..700&family=Instrument+Serif:ital@0;1&family=Sora:wght@400..700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="styles.css">
  <script type="application/ld+json">
${JSON.stringify(jsonLd, null, 2)}
  </script>
</head>
<body>

  <!-- CABECERA -->
  <header class="site-header">
    <div class="header-inner">
      <a href="index.html" class="brand-link">
        ${tenant.logoUrl ? `<img src="${resolveImg(tenant.logoUrl)}" alt="${tenant.name}" style="width: 38px; height: 38px; object-fit: contain; border-radius: 50%;">` : ''}
        <span>${tenant.name}</span>
        <span class="brand-dot"></span>
      </a>
      <nav class="nav-links">
        <a href="carta.html" class="nav-link">Carta & Precios</a>
        <a href="#ambientes" class="nav-link">Espacios</a>
        <a href="#horarios" class="nav-link">Horarios</a>
        <a href="carta.html" class="btn-primary" style="color: ${isUrbanBrewery ? '#0A0B0E' : '#fff'}; font-weight: 800;">Ver Carta y Precios</a>
      </nav>
    </div>
  </header>

  <!-- HERO CINEMÁTICO 60FPS -->
  <section class="hero-section">
    <canvas id="hero-canvas" style="position: absolute; inset: 0; pointer-events: none; z-index: 1;"></canvas>
    <img src="${resolveImg(tenant.heroImagePoster)}" alt="${tenant.name}" class="hero-poster" fetchpriority="high">
    <div class="hero-overlay"></div>
    <div class="hero-content">
      ${tenant.logoUrl ? `<div style="margin-bottom: 16px;"><img src="${resolveImg(tenant.logoUrl)}" alt="${tenant.name}" style="width: 84px; height: 84px; object-fit: contain; border-radius: 50%; background: rgba(10,11,14,0.8); padding: 4px; border: 1px solid rgba(245,158,11,0.4);"></div>` : ''}
      <div class="hero-badge">
        <span>${tenant.address} · ${tenant.city}</span>
        <span>•</span>
        <span style="color: #22C55E;">● ${todayStatus.label}</span>
      </div>
      <h1 class="hero-title">${tenant.name.split(' ')[0]} <em style="color: var(--accent-fire); font-style: normal;">${tenant.name.split(' ').slice(1).join(' ')}</em></h1>
      <p class="hero-desc">${tenant.tagline}</p>
      <div class="hero-actions">
        <a href="carta.html" class="btn-primary" style="color: ${isUrbanBrewery ? '#0A0B0E' : '#fff'}; font-weight: 800;">Ver Carta y Precios</a>
        <a href="${tenant.googleMapsUrl || '#horarios'}" target="_blank" class="btn-secondary">📍 Cómo Llegar</a>
        <button class="btn-secondary" data-open-reservation>Grupos / Reserva</button>
      </div>
    </div>
  </section>

  <!-- 4 PRODUCTOS INSIGNIA (PORTADA ASPIRACIONAL SIN PRECIOS EN HOME - DEC-39) -->
  <section class="section-wrapper">
    <div class="section-title-wrap">
      <span class="section-tag">Imprescindibles de la Casa · Portada Aspiracional</span>
      <h2 class="section-title">Cerveza de Bodega, Vermú & Cocina Caliente</h2>
    </div>
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 40px; align-items: center;">
      ${signatureDishes.map(sig => `
      <a href="carta.html" style="text-decoration: none; color: inherit; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 16px;">
        <div style="position: relative; width: 220px; height: 220px;">
          <img src="${resolveImg(sig.image)}" alt="${sig.name}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover; box-shadow: 0 28px 48px rgba(0,0,0,0.65);">
        </div>
        <div>
          <span style="font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.2em; color: var(--accent-fire); font-weight: 700;">${sig.category}</span>
          <h3 style="font-family: var(--font-serif); font-size: 1.5rem; margin-top: 4px;">${sig.name}</h3>
          <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 8px; line-height: 1.5;">${sig.description}</p>
          ${sig.variants && sig.variants.length > 0 ? `<div style="margin-top: 10px; display: flex; flex-wrap: wrap; gap: 6px; justify-content: center;">${sig.variants.map(v => `<span style="font-size: 0.7rem; padding: 3px 10px; border-radius: 999px; background: rgba(255,255,255,0.07);">${v.name}</span>`).join('')}</div>` : ''}
        </div>
      </a>
      `).join('')}
    </div>
    <div style="text-align: center; margin-top: 48px;">
      <a href="carta.html" class="btn-primary" style="color: ${isUrbanBrewery ? '#0A0B0E' : '#fff'}; font-weight: 800;">Ver Carta Completa con Precios</a>
    </div>
  </section>

  <!-- SELECTOR DE AMBIENTES -->
  ${tenant.ambiences.length > 0 ? `
  <section id="ambientes" class="section-wrapper" style="border-top: 1px solid rgba(20,19,17,0.08);">
    <div class="section-title-wrap">
      <span class="section-tag">Espacios & Luz</span>
      <h2 class="section-title">Elige tu Rincón en ${tenant.name}</h2>
      <div style="margin-top: 16px; display: inline-flex; gap: 8px; background: rgba(20,19,17,0.06); padding: 4px; border-radius: 9999px;">
        <button class="btn-primary active" data-light-mode="day" style="padding: 6px 16px; font-size: 0.7rem;">Mediodía (13:30h)</button>
        <button class="btn-secondary" data-light-mode="night" style="padding: 6px 16px; font-size: 0.7rem; color: #141311; border: none;">Noche (21:30h)</button>
      </div>
    </div>
    <div class="ambience-grid">
      ${tenant.ambiences.map(amb => `
      <div class="ambience-card">
        <div>
          <img src="${resolveImg(amb.imageDay)}" alt="${amb.name}" class="ambience-img" data-amb-img data-img-day="${resolveImg(amb.imageDay)}" data-img-night="${resolveImg(amb.imageNight)}">
          <div class="ambience-body">
            <h3 class="ambience-name">${amb.name}</h3>
            <span class="ambience-subtitle">${amb.subtitle}</span>
            <p class="ambience-desc">${amb.desc}</p>
            <p style="margin-top: 12px; font-size: 0.75rem; color: var(--accent-fire);" data-amb-note data-note-day="${amb.lightingNoteDay}" data-note-night="${amb.lightingNoteNight}">
              ${amb.lightingNoteDay}
            </p>
          </div>
        </div>
        <div style="padding: 0 24px 24px;">
          <button class="btn-primary" style="width: 100%; justify-content: center;" data-open-reservation data-zone="${amb.name}">
            Reservar en ${amb.name}
          </button>
        </div>
      </div>
      `).join('')}
    </div>
  </section>
  ` : ''}

  <!-- PRUEBA SOCIAL / RESEÑAS -->
  ${tenant.reviews && tenant.reviews.length > 0 ? `
  <section class="section-wrapper" style="border-top: 1px solid rgba(20,19,17,0.08);">
    <div class="section-title-wrap">
      <span class="section-tag">Opiniones Reales</span>
      <h2 class="section-title">Comensales en Google Maps</h2>
    </div>
    <div class="reviews-grid">
      ${tenant.reviews.map(rev => `
      <div class="review-card">
        <div class="review-text">"${rev.text}"</div>
        <div style="display: flex; justify-content: space-between; font-size: 0.8rem; font-weight: 600;">
          <span>${rev.author}</span>
          <span style="color: #10B981;">✔ Visita Verificada</span>
        </div>
      </div>
      `).join('')}
    </div>
  </section>
  ` : ''}

  <!-- HORARIOS & CONTACTO -->
  <section id="horarios" class="section-wrapper" style="border-top: 1px solid rgba(20,19,17,0.08);">
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 48px; align-items: start;">
      <div>
        <span class="section-tag">Ubicación & Contacto</span>
        <h2 class="section-title">Ven a Conocernos</h2>
        <p style="margin-top: 16px; font-size: 1rem; color: var(--text-muted); line-height: 1.6;">
          ${tenant.address}, ${tenant.postalCode} ${tenant.city}.
        </p>
        <p style="margin-top: 8px; font-size: 1rem; font-weight: 600;">
          Teléfono: <a href="tel:${tenant.phone.replace(/\\s+/g, '')}" style="color: var(--text-ink);">${tenant.phone}</a>
        </p>
        <div style="margin-top: 24px;">
          <a href="${tenant.googleMapsUrl || '#'}" target="_blank" class="btn-primary">Ver en Google Maps</a>
        </div>
      </div>
      <div style="background: #fff; padding: 32px; border-radius: 24px; border: 1px solid rgba(20,19,17,0.1);">
        <h3 style="font-family: var(--font-serif); font-size: 1.5rem; margin-bottom: 16px;">Horarios de Servicio</h3>
        <ul style="list-style: none; font-size: 0.85rem; line-height: 2;">
          ${tenant.openingHours.map(h => `
          <li style="display: flex; justify-content: space-between; border-bottom: 1px solid rgba(0,0,0,0.05);">
            <span>Día ${h.dayOfWeek === 0 ? 'Domingo' : h.dayOfWeek === 5 ? 'Viernes' : h.dayOfWeek === 6 ? 'Sábado' : 'Laboral'} (${h.label || 'Servicio'}):</span>
            <strong>${h.open} - ${h.close}</strong>
          </li>
          `).join('')}
        </ul>
      </div>
    </div>
  </section>

  <!-- FAQS -->
  <section class="section-wrapper" style="max-width: 800px;">
    <div class="section-title-wrap">
      <span class="section-tag">Dudas Frecuentes</span>
      <h2 class="section-title">Preguntas sobre Reservas</h2>
    </div>
    <div style="display: flex; flex-direction: column; gap: 16px;">
      <div style="background: #fff; border-radius: 16px; padding: 20px; border: 1px solid rgba(20,19,17,0.1);">
        <div data-faq-toggle style="font-weight: 700; cursor: pointer; display: flex; justify-content: space-between;">
          <span>1. ¿Cómo se confirma mi reserva?</span>
          <span class="faq-icon">▼</span>
        </div>
        <p style="display: none; margin-top: 12px; font-size: 0.85rem; color: var(--text-muted); line-height: 1.6;">
          Al enviar la solicitud se abre WhatsApp directamente con el equipo del local. Confirmamos en pocos minutos según disponibilidad.
        </p>
      </div>
      <div style="background: #fff; border-radius: 16px; padding: 20px; border: 1px solid rgba(20,19,17,0.1);">
        <div data-faq-toggle style="font-weight: 700; cursor: pointer; display: flex; justify-content: space-between;">
          <span>2. ¿Qué margen de cortesía tienen?</span>
          <span class="faq-icon">▼</span>
        </div>
        <p style="display: none; margin-top: 12px; font-size: 0.85rem; color: var(--text-muted); line-height: 1.6;">
          Mantenemos tu mesa guardada durante 15 minutos de cortesía. Si te retrasas por tráfico, avísanos por WhatsApp.
        </p>
      </div>
      <div style="background: #fff; border-radius: 16px; padding: 20px; border: 1px solid rgba(20,19,17,0.1);">
        <div data-faq-toggle style="font-weight: 700; cursor: pointer; display: flex; justify-content: space-between;">
          <span>3. ¿Tienen en cuenta alérgenos e intolerancias?</span>
          <span class="faq-icon">▼</span>
        </div>
        <p style="display: none; margin-top: 12px; font-size: 0.85rem; color: var(--text-muted); line-height: 1.6;">
          Sí, cumplimos el Reglamento UE 1169/2011. Puedes detallar cualquier intolerancia o celiaquía en las notas de tu reserva.
        </p>
      </div>
    </div>
  </section>

  <!-- FOOTER -->
  <footer style="background: var(--bg-dark); color: #E6DFD3; padding: 64px 24px; text-align: center;">
    <div style="max-w: 1200px; margin: 0 auto; display: flex; flex-direction: column; align-items: center; gap: 16px;">
      <h3 style="font-family: var(--font-serif); font-size: 1.75rem; color: #fff;">${tenant.name}</h3>
      <p style="font-size: 0.85rem; color: rgba(255,255,255,0.6);">${tenant.address}, ${tenant.postalCode} ${tenant.city}</p>
      <p style="font-size: 0.75rem; color: rgba(255,255,255,0.4);">© ${new Date().getFullYear()} ${tenant.name}. Desarrollado con tecnología FLUXO.</p>
    </div>
  </footer>

  <!-- MOBILE THUMB BAR -->
  <aside class="thumb-bar">
    <a href="carta.html" class="thumb-btn thumb-btn-primary" style="color: ${isUrbanBrewery ? '#0A0B0E' : '#fff'}; text-decoration: none;">📖 Ver Carta</a>
    <a href="${tenant.googleMapsUrl || '#horarios'}" target="_blank" class="thumb-btn" style="background: rgba(255,255,255,0.12); font-weight: 700;">📍 Cómo Llegar</a>
    <a href="tel:${tenant.phone.replace(/\\s+/g, '')}" class="thumb-btn">📞 Llamar</a>
    <button class="thumb-btn" data-open-reservation>📅 Grupos</button>
  </aside>

  <!-- MODAL RESERVA WHATSAPP -->
  <div id="reservation-modal" class="modal-overlay">
    <div class="modal-box">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h3 style="font-family: var(--font-serif); font-size: 1.5rem;">Solicitud de Reserva</h3>
        <button id="close-reservation-btn" style="background: none; border: none; font-size: 1.5rem; cursor: pointer;">✕</button>
      </div>
      <div style="display: flex; flex-direction: column; gap: 14px;">
        <div>
          <label style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase;">Nombre de Contacto</label>
          <input type="text" id="res-name" placeholder="Tu nombre" style="width: 100%; padding: 10px; border-radius: 12px; border: 1px solid rgba(0,0,0,0.15); margin-top: 4px;">
        </div>
        <div>
          <label style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase;">Comensales</label>
          <select id="res-diners" style="width: 100%; padding: 10px; border-radius: 12px; border: 1px solid rgba(0,0,0,0.15); margin-top: 4px;">
            <option value="1">1 Persona</option>
            <option value="2" selected>2 Personas</option>
            <option value="4">4 Personas</option>
            <option value="6">6 Personas</option>
            <option value="8+">8+ Personas</option>
          </select>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
          <div>
            <label style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase;">Turno</label>
            <select id="res-shift" style="width: 100%; padding: 10px; border-radius: 12px; border: 1px solid rgba(0,0,0,0.15); margin-top: 4px;">
              <option value="Almuerzo">Almuerzo</option>
              <option value="Cena" selected>Cena</option>
            </select>
          </div>
          <div>
            <label style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase;">Hora</label>
            <input type="text" id="res-time" value="21:30" style="width: 100%; padding: 10px; border-radius: 12px; border: 1px solid rgba(0,0,0,0.15); margin-top: 4px;">
          </div>
        </div>
        <div>
          <label style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase;">Zona de Sala</label>
          <select id="res-zone" style="width: 100%; padding: 10px; border-radius: 12px; border: 1px solid rgba(0,0,0,0.15); margin-top: 4px;">
            ${tenant.ambiences.map(a => `<option value="${a.name}">${a.name}</option>`).join('')}
          </select>
        </div>
        <div>
          <label style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase;">Alérgenos / Notas</label>
          <input type="text" id="res-notes" placeholder="Ej. 1 persona celíaca, trona..." style="width: 100%; padding: 10px; border-radius: 12px; border: 1px solid rgba(0,0,0,0.15); margin-top: 4px;">
        </div>
        <button id="send-whatsapp-btn" class="btn-primary" style="width: 100%; justify-content: center; padding: 14px; background: #25D366; color: #064E3B; font-weight: 800;">
          Enviar Reserva por WhatsApp
        </button>
        <button id="copy-whatsapp-btn" class="btn-secondary" style="width: 100%; justify-content: center; padding: 10px; color: var(--text-ink); border-color: rgba(0,0,0,0.2);">
          Copiar Mensaje al Portapapeles (Respaldo)
        </button>
      </div>
    </div>
  </div>

  <script src="script.js"></script>
</body>
</html>`
  fs.writeFileSync(path.join(siteDir, 'index.html'), indexHtml, 'utf8')

  // 6. Generar carta.html (Plan Carta Fluxo: Catálogo digital sin pedidos)
  const cartaHtml = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Carta Oficial · ${tenant.name}</title>
  <meta name="description" content="Carta y precios oficiales de ${tenant.name}. Desglose de alérgenos y productos de lonja.">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400..700&family=Instrument+Serif:ital@0;1&family=Sora:wght@400..700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="styles.css">
  <style>
    .menu-header {
      padding: 120px 24px 48px;
      text-align: center;
      background: #EDE8DE;
      border-bottom: 1px solid rgba(20,19,17,0.08);
    }
    .menu-container {
      max-width: 1000px;
      margin: 0 auto;
      padding: 48px 24px;
    }
    .menu-filter-bar {
      margin-bottom: 32px;
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      justify-content: center;
    }
    .filter-btn {
      padding: 8px 18px;
      border-radius: 9999px;
      background: #fff;
      border: 1px solid rgba(20,19,17,0.1);
      cursor: pointer;
      font-size: 0.8rem;
      font-weight: 600;
      transition: all 0.2s;
    }
    .filter-btn.active {
      background: var(--text-ink);
      color: var(--text-light);
    }
    .dish-card {
      display: flex;
      gap: 20px;
      background: #fff;
      padding: 20px;
      border-radius: 20px;
      border: 1px solid rgba(20,19,17,0.08);
      margin-bottom: 16px;
      align-items: center;
    }
    .dish-thumb {
      width: 90px;
      height: 90px;
      border-radius: 14px;
      object-fit: cover;
      flex-shrink: 0;
    }
    .dish-info {
      flex: 1;
    }
    .dish-head {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: 12px;
    }
    .dish-name {
      font-family: var(--font-serif);
      font-size: 1.25rem;
      font-weight: 700;
    }
    .dish-price {
      font-family: var(--font-mono);
      font-weight: 700;
      color: var(--accent-fire);
      font-size: 1.1rem;
    }
    .dish-desc {
      font-size: 0.85rem;
      color: var(--text-muted);
      margin-top: 4px;
      line-height: 1.5;
    }
    .allergen-tag {
      display: inline-block;
      font-size: 0.65rem;
      text-transform: uppercase;
      padding: 2px 8px;
      background: rgba(20,19,17,0.06);
      border-radius: 4px;
      margin-top: 8px;
      margin-right: 4px;
    }
  </style>
</head>
<body>

  <!-- CABECERA -->
  <header class="site-header">
    <div class="header-inner">
      <a href="index.html" class="brand-link">
        <span>${tenant.name}</span>
        <span class="brand-dot"></span>
      </a>
      <a href="index.html" class="btn-secondary">Volver al Inicio</a>
    </div>
  </header>

  <!-- HERO DE CARTA -->
  <div class="menu-header">
    <span class="section-tag">Catálogo Digital Oficial</span>
    <h1 style="font-family: var(--font-serif); font-size: 2.75rem;">Carta de Temporada</h1>
    <p style="color: var(--text-muted); margin-top: 8px;">Precios con IVA incluido · Pescado de lonja sujeto a disponibilidad de bajura</p>
  </div>

  <!-- CONTENEDOR DE PLATOS -->
  <main class="menu-container">
    <div class="menu-filter-bar">
      <button class="filter-btn active" onclick="filterMenu('Todos')">Todos</button>
      ${Array.from(new Set(tenant.dishes.map(d => d.category))).map(cat => `
      <button class="filter-btn" onclick="filterMenu('${cat}')">${cat}</button>
      `).join('')}
    </div>

    <div id="dish-list">
      ${tenant.dishes.map(d => `
      <div class="dish-card" data-category="${d.category}" style="background: var(--bg-card); color: var(--text-ink);">
        <img src="${resolveImg(d.image)}" alt="${d.name}" class="dish-thumb">
        <div class="dish-info">
          <div class="dish-head">
            <h3 class="dish-name">${d.name}</h3>
            <span class="dish-price">${d.price.toFixed(2)} €</span>
          </div>
          <p class="dish-desc">${d.description}</p>
          ${d.variants && d.variants.length > 0 ? `
          <div style="margin-top: 8px; display: flex; flex-wrap: wrap; gap: 6px;">
            ${d.variants.map(v => `<span style="font-size: 0.72rem; padding: 3px 10px; border-radius: 8px; background: rgba(245,158,11,0.12); color: var(--text-ink);"><span>${v.name}:</span> <strong style="color: var(--accent-fire);">${v.price.toFixed(2)} €</strong></span>`).join('')}
          </div>
          ` : ''}
          ${d.allergens && d.allergens.length > 0 ? `
          <div>
            ${d.allergens.map(a => `<span class="allergen-tag">⚠️ ${a}</span>`).join('')}
          </div>
          ` : ''}
        </div>
      </div>
      `).join('')}
    </div>

    <div style="text-align: center; margin-top: 48px;">
      <a href="index.html#horarios" class="btn-primary">Reservar Mesa para Degustar</a>
    </div>
  </main>

  <script>
    function filterMenu(cat) {
      document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.textContent.trim() === cat);
      });
      document.querySelectorAll('.dish-card').forEach(card => {
        if (cat === 'Todos' || card.getAttribute('data-category') === cat) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });
    }
  </script>
</body>
</html>`
  fs.writeFileSync(path.join(siteDir, 'carta.html'), cartaHtml, 'utf8')

  console.log(`✔ Archivos estáticos generados en: out/sites/${tenant.slug}/`)
  console.log(`  - index.html (Home Cinemática a 60fps)`)
  console.log(`  - carta.html (Catálogo Digital Plan Carta)`)
  console.log(`  - styles.css (Sistema Editorial Cálido)`)
  console.log(`  - script.js  (Interactividad Vanilla 60fps)`)
  console.log(`  - assets/dishes/ (${copiedImages.size} imágenes copiadas)`)

  // 7. Comprimir en archivo ZIP usando PowerShell Compress-Archive
  const zipPath = path.join(outBaseDir, `${tenant.slug}.zip`)
  try {
    if (fs.existsSync(zipPath)) {
      fs.unlinkSync(zipPath)
    }
    const psCmd = `powershell.exe -NoProfile -Command "Compress-Archive -Path '${siteDir}\\*' -DestinationPath '${zipPath}' -Force"`
    execSync(psCmd, { stdio: 'inherit' })
    console.log(`✔ Paquete ZIP generado exitosamente: out/sites/${tenant.slug}.zip`)
  } catch (err) {
    console.warn(`⚠ Aviso: No se pudo comprimir automáticamente con PowerShell: ${err.message}`)
    console.log(`  Los archivos estáticos están disponibles directamente en: ${siteDir}`)
  }

  console.log('='.repeat(80))
  console.log(` 🎉 EXPORTACIÓN FINALIZADA PARA "${tenant.name}"`)
  console.log('='.repeat(80))
}

runExporter().catch(err => {
  console.error('❌ Error en el proceso de exportación:', err)
  process.exit(1)
})
