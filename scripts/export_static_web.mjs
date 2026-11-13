#!/usr/bin/env node
/**
 * FLUXO GASTRONOMIC SYSTEM — EXPORTADOR ESTÁTICO 2-EN-1 PARA HOSTINGS TRADICIONALES (cPanel / Hostinger / Apache)
 *
 * Genera un paquete web estático completamente autónomo y autocontenido para un local gastronómico:
 * 1. index.html  -> Home editorial / cinemática a 60fps, canvas loops o scrollytelling, espacios y WhatsApp directo.
 * 2. carta.html  -> Catálogo digital interactivo (Plan Carta Fluxo), búsqueda en vivo, variantes y alérgenos.
 * 3. styles.css  -> Sistema de diseño multi-preset (Cauce Editorial Stone/Blue o Editorial Cálido/Oscuro).
 * 4. script.js   -> Interactividad vanilla a 60fps (canvas loops Ken Burns, configurador "Mensaje preparado" en vivo).
 * 5. assets/     -> Imágenes y recursos multimedia locales optimizados.
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

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

console.log('='.repeat(80))
console.log(' 🍽️  FLUXO — EXPORTADOR ESTÁTICO 2-EN-1')
console.log(` Target Slug: ${targetSlug}`)
console.log('='.repeat(80))

function buildCauceBundle({ tenant, jsonLd, resolveImg, todayStatus, cleanPhoneHref, cleanWaNumber }) {
  const heroFrames = (tenant.heroLoopFrames && tenant.heroLoopFrames.length > 0
    ? tenant.heroLoopFrames
    : [tenant.heroImagePoster]
  ).map(resolveImg)

  const featurePoster = resolveImg(
    (tenant.featureVideoFrames && tenant.featureVideoFrames[0]) || tenant.heroImagePoster
  )
  const featureFrames = (tenant.featureVideoFrames && tenant.featureVideoFrames.length > 0
    ? tenant.featureVideoFrames
    : [featurePoster]
  ).map(resolveImg)

  const experiencePoster = resolveImg(
    (tenant.experienceVideoFrames && tenant.experienceVideoFrames[0]) ||
      (tenant.ambiences[0] && tenant.ambiences[0].imageDay) ||
      tenant.heroImagePoster
  )
  const experienceFrames = (tenant.experienceVideoFrames && tenant.experienceVideoFrames.length > 0
    ? tenant.experienceVideoFrames
    : [experiencePoster]
  ).map(resolveImg)

  const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
  const fontsHref =
    'https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400..700;1,9..40,400..700&family=Instrument+Serif:ital@0;1&family=Inter:wght@400..700&display=swap'

  const css = `/* FLUXO CAUCE EDITORIAL STYLESHEET (STONE + INK + JARA-TUSAS ROYAL BLUE) */
:root {
  --bg-stone: #F6F6F3;
  --bg-surface: #FFFFFF;
  --bg-subtle: #EEEDE8;
  --text-ink: #0F172A;
  --text-muted: #475569;
  --border-slate: rgba(15, 23, 42, 0.11);
  --brand-blue: #1D4ED8;
  --brand-blue-hover: #1E3A8A;
  --brand-blue-soft: #EFF6FF;
  --brand-blue-border: #BFDBFE;
  --font-serif: 'Instrument Serif', Georgia, serif;
  --font-sans: 'Inter', 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  scroll-behavior: smooth;
  font-family: var(--font-sans);
  background-color: var(--bg-stone);
  color: var(--text-ink);
  overflow-x: hidden;
  -webkit-font-smoothing: antialiased;
}

body {
  background-color: var(--bg-stone);
  color: var(--text-ink);
  overflow-x: hidden;
  padding-bottom: 76px;
}

@media (min-width: 768px) {
  body {
    padding-bottom: 0;
  }
}

.font-serif { font-family: var(--font-serif); }
.font-sans { font-family: var(--font-sans); }
.tabular-nums { font-variant-numeric: tabular-nums; }

a:focus-visible,
button:focus-visible,
input:focus-visible,
textarea:focus-visible,
select:focus-visible {
  outline: 2px solid var(--brand-blue);
  outline-offset: 2px;
}

/* Floating White Pill Navbar */
.pill-nav-wrap {
  position: fixed;
  top: 12px;
  left: 12px;
  right: 12px;
  z-index: 40;
  pointer-events: none;
}

@media (min-width: 640px) {
  .pill-nav-wrap {
    top: 16px;
    left: 24px;
    right: 24px;
  }
}

.pill-nav {
  pointer-events: auto;
  max-width: 1120px;
  margin: 0 auto;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(226, 232, 240, 0.9);
  box-shadow: 0 4px 20px rgba(15, 23, 42, 0.06);
  padding: 8px 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

@media (min-width: 640px) {
  .pill-nav {
    padding: 10px 22px;
  }
}

.pill-brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  color: var(--text-ink);
  font-weight: 600;
  font-size: 0.95rem;
  white-space: nowrap;
}

.logo-circle {
  width: 34px;
  height: 34px;
  border-radius: 9999px;
  background: #EBE8E1;
  border: 1px solid #E2E8F0;
  overflow: hidden;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.logo-circle img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.pill-links {
  display: none;
  align-items: center;
  gap: 24px;
}

@media (min-width: 768px) {
  .pill-links {
    display: flex;
  }
}

.pill-link {
  color: var(--text-muted);
  text-decoration: none;
  font-size: 0.88rem;
  font-weight: 500;
  transition: color 0.18s ease;
}

.pill-link:hover {
  color: var(--brand-blue);
}

.pill-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-blue {
  background: var(--brand-blue);
  color: #FFFFFF;
  border: none;
  border-radius: 9999px;
  padding: 9px 18px;
  font-size: 0.85rem;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: background-color 0.2s ease, transform 0.2s ease;
  white-space: nowrap;
}

.btn-blue:hover {
  background: var(--brand-blue-hover);
}

.btn-blue-lg {
  padding: 15px 30px;
  font-size: 0.95rem;
  box-shadow: 0 14px 30px rgba(15, 23, 42, 0.25);
}

.btn-outline {
  background: #FFFFFF;
  color: var(--text-ink);
  border: 1px solid #CBD5E1;
  border-radius: 9999px;
  padding: 10px 18px;
  font-size: 0.85rem;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: background-color 0.2s ease;
  white-space: nowrap;
}

.btn-outline:hover {
  background: #F8FAFC;
}

.mobile-menu-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 9999px;
  border: 1px solid #E2E8F0;
  background: #FFFFFF;
  color: var(--text-ink);
  cursor: pointer;
  font-size: 1rem;
}

@media (min-width: 768px) {
  .mobile-menu-btn {
    display: none;
  }
}

.mobile-dropdown {
  display: none;
  pointer-events: auto;
  max-width: 1120px;
  margin: 8px auto 0;
  border-radius: 22px;
  background: #FFFFFF;
  border: 1px solid rgba(226, 232, 240, 0.95);
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.14);
  padding: 14px;
  flex-direction: column;
  gap: 6px;
}

.mobile-dropdown.open {
  display: flex;
}

.mobile-dropdown a {
  text-decoration: none;
  color: var(--text-ink);
  font-weight: 500;
  font-size: 0.95rem;
  padding: 10px 12px;
  border-radius: 12px;
}

.mobile-dropdown a:hover {
  background: var(--bg-stone);
}

/* LoopVideoBlock (Poster + 60fps Canvas) */
.loop-box {
  position: relative;
  overflow: hidden;
  background: #0F172A;
}

.loop-poster,
.loop-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.loop-canvas {
  pointer-events: none;
}

/* Section 1: Fullscreen Unframed Hero (100vw x 100vh) */
.cauce-hero {
  position: relative;
  width: 100%;
  min-height: 100vh;
  height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  overflow: hidden;
}

.cauce-hero-scrim {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    rgba(2, 6, 23, 0.36) 0%,
    rgba(2, 6, 23, 0.26) 50%,
    rgba(2, 6, 23, 0.58) 100%
  );
  pointer-events: none;
  z-index: 2;
}

.cauce-hero-inner {
  position: relative;
  z-index: 3;
  max-width: 780px;
  padding: 88px 24px 32px;
  color: #FFFFFF;
}

.cauce-hero-title {
  font-family: var(--font-serif);
  font-size: clamp(2.65rem, 6.4vw, 5.1rem);
  font-weight: 400;
  line-height: 1.03;
  letter-spacing: -0.01em;
}

.cauce-hero-sub {
  margin: 18px auto 0;
  max-width: 580px;
  font-size: clamp(1rem, 2vw, 1.18rem);
  line-height: 1.55;
  color: rgba(255, 255, 255, 0.92);
}

.cauce-hero-cta {
  margin-top: 28px;
}

/* Shared Section Container */
.cauce-section {
  max-width: 1120px;
  margin: 0 auto;
  padding: 72px 20px;
}

@media (min-width: 768px) {
  .cauce-section {
    padding: 96px 24px;
  }
}

.cauce-h2 {
  font-family: var(--font-serif);
  font-size: clamp(2.1rem, 4.4vw, 3.25rem);
  font-weight: 400;
  line-height: 1.08;
  color: var(--text-ink);
}

.cauce-card {
  background: var(--bg-surface);
  border: 1px solid var(--border-slate);
  border-radius: 22px;
  padding: 26px;
}

/* Section 2: Lo que nos define */
.define-grid-3 {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
  margin-top: 32px;
}

@media (min-width: 768px) {
  .define-grid-3 {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

.define-bullets {
  list-style: none;
  margin-top: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  font-size: 0.92rem;
  line-height: 1.5;
  color: var(--text-muted);
}

.define-bullets li {
  display: flex;
  gap: 10px;
  align-items: flex-start;
}

.bullet-dot {
  width: 6px;
  height: 6px;
  border-radius: 9999px;
  background: var(--brand-blue);
  margin-top: 8px;
  flex-shrink: 0;
}

.define-feature-card {
  margin-top: 24px;
  background: var(--bg-surface);
  border: 1px solid var(--border-slate);
  border-radius: 22px;
  padding: 20px;
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
  align-items: center;
}

@media (min-width: 960px) {
  .define-feature-card {
    padding: 28px;
    grid-template-columns: 7fr 5fr;
    gap: 32px;
  }
}

.aspect-16-9 {
  aspect-ratio: 16 / 9;
  width: 100%;
  border-radius: 16px;
}

.sub-boxes {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 18px;
}

.sub-box {
  background: var(--bg-stone);
  border: 1px solid var(--border-slate);
  border-radius: 14px;
  padding: 12px 14px;
}

/* Pantalla 2: Menú Deslizante de Mockups de Tragos */
.marquee-wrap {
  width: 100%;
  overflow-x: auto;
  padding: 12px 0 20px;
  -webkit-overflow-scrolling: touch;
}

.marquee-track {
  display: flex;
  gap: 16px;
  width: max-content;
  margin: 0 auto;
  padding: 0 16px;
}

.drink-card {
  width: 260px;
  background: #FFFFFF;
  border: 1px solid var(--border-slate);
  border-radius: 20px;
  padding: 14px;
  text-align: left;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04);
  position: relative;
  flex-shrink: 0;
}

.drink-thumb {
  width: 100%;
  aspect-ratio: 4 / 3;
  object-fit: cover;
  border-radius: 14px;
  display: block;
  margin-bottom: 12px;
}

.drink-tag {
  position: absolute;
  top: 22px;
  right: 22px;
  background: rgba(255, 255, 255, 0.95);
  font-size: 0.68rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 2px 8px;
  border-radius: 9999px;
  border: 1px solid #E2E8F0;
}

.drink-title {
  font-size: 0.98rem;
  font-weight: 700;
  color: var(--text-ink);
  line-height: 1.3;
}

.drink-desc {
  font-size: 0.8rem;
  color: var(--text-muted);
  margin-top: 6px;
  line-height: 1.5;
}

/* Section 3: La experiencia (Asymmetric 3:4 ordering) */
.exp-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 28px;
}

.exp-title { order: 1; }
.exp-video-col { order: 2; }
.exp-steps { order: 3; }

@media (min-width: 768px) {
  .exp-grid {
    grid-template-columns: 6fr 5fr;
    column-gap: 48px;
    row-gap: 24px;
    align-items: start;
  }
  .exp-title {
    order: 0;
    grid-column: 1;
    grid-row: 1;
  }
  .exp-video-col {
    order: 0;
    grid-column: 2;
    grid-row: 1 / span 2;
  }
  .exp-steps {
    order: 0;
    grid-column: 1;
    grid-row: 2;
  }
}

.aspect-3-4 {
  aspect-ratio: 3 / 4;
  width: 100%;
  border-radius: 22px;
}

.exp-step {
  padding: 20px 0;
  border-bottom: 1px solid #E2E8F0;
  display: flex;
  gap: 18px;
  align-items: flex-start;
}

.exp-step:first-child {
  padding-top: 4px;
}

.exp-step-num {
  font-family: var(--font-serif);
  font-size: 2rem;
  line-height: 1;
  color: var(--brand-blue);
  flex-shrink: 0;
}

/* Section 4: Espacios y horarios */
.spaces-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
  align-items: stretch;
}

@media (min-width: 960px) {
  .spaces-grid {
    grid-template-columns: 7fr 5fr;
    gap: 32px;
  }
}

.live-badge-light {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #FFFFFF;
  color: var(--text-ink);
  border: 1px solid #E2E8F0;
  border-radius: 9999px;
  padding: 7px 14px;
  font-size: 0.8rem;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
}

.live-dot {
  width: 8px;
  height: 8px;
  border-radius: 9999px;
  flex-shrink: 0;
}

.live-dot.open {
  background: #22C55E;
}

.live-dot.closed {
  background: #DC2626;
}

/* Section 4: Reseñas Verificadas de Google Maps */
.reviews-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
}

@media (min-width: 640px) {
  .reviews-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 1024px) {
  .reviews-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

/* Mobile Sticky Bar (<768px) */
.cauce-mobile-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 45;
  background: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(12px);
  border-top: 1px solid #E2E8F0;
  padding: 10px 14px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

@media (min-width: 768px) {
  .cauce-mobile-bar {
    display: none;
  }
}

/* Footer */
.cauce-footer {
  border-top: 1px solid #E2E8F0;
  background: #FFFFFF;
  padding: 40px 24px;
  text-align: center;
}
`

  const js = `/* FLUXO CAUCE EDITORIAL INTERACTIVITY (60FPS CANVAS LOOPS + MOBILE MENU) */
document.addEventListener('DOMContentLoaded', () => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 1. Mobile Pill Dropdown
  const menuBtn = document.getElementById('cauce-mobile-menu-btn');
  const mobileDropdown = document.getElementById('cauce-mobile-dropdown');
  if (menuBtn && mobileDropdown) {
    menuBtn.addEventListener('click', () => {
      const open = mobileDropdown.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    mobileDropdown.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mobileDropdown.classList.remove('open');
        menuBtn.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // 2. 60fps Seamless Ken Burns + Crossfade Canvas Loop Engine
  const canvasNodes = Array.from(document.querySelectorAll('.loop-canvas'));
  const loopEntries = canvasNodes.map(canvas => {
    let urls = [];
    try {
      urls = JSON.parse(canvas.getAttribute('data-loop-frames') || '[]');
    } catch {
      urls = [];
    }
    const imgs = urls.map(src => {
      const img = new Image();
      img.src = src;
      return img;
    });
    return { canvas, ctx: canvas.getContext('2d'), imgs };
  });

  function drawCover(ctx, img, w, h, zoom, panX, panY, alpha) {
    if (!img || !img.complete || img.naturalWidth === 0) return;
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;
    const scale = Math.max(w / iw, h / ih) * zoom;
    const dw = iw * scale;
    const dh = ih * scale;
    const dx = (w - dw) * 0.5 + panX * (dw - w) * 0.35;
    const dy = (h - dh) * 0.5 + panY * (dh - h) * 0.35;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.drawImage(img, dx, dy, dw, dh);
    ctx.restore();
  }

  function resizeCanvases() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    loopEntries.forEach(entry => {
      const rect = entry.canvas.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        entry.canvas.width = Math.round(rect.width * dpr);
        entry.canvas.height = Math.round(rect.height * dpr);
      }
    });
  }

  resizeCanvases();
  window.addEventListener('resize', resizeCanvases);

  const slideDuration = 4500;
  const fadeDuration = 1100;

  function renderLoops(ts) {
    loopEntries.forEach((entry, idx) => {
      const { ctx, canvas, imgs } = entry;
      if (!ctx || imgs.length === 0 || canvas.width === 0 || canvas.height === 0) return;

      if (reducedMotion) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawCover(ctx, imgs[0], canvas.width, canvas.height, 1.0, 0, 0, 1);
        return;
      }

      const elapsed = ts + idx * 1300;
      const totalCycle = imgs.length * slideDuration;
      const cyclePos = elapsed % totalCycle;
      const currentIdx = Math.floor(cyclePos / slideDuration);
      const nextIdx = (currentIdx + 1) % imgs.length;
      const slideTime = cyclePos % slideDuration;
      const progress = slideTime / slideDuration;

      const zoom = 1.0 + 0.07 * (0.5 - 0.5 * Math.cos(progress * Math.PI));
      const panX = Math.sin(elapsed * 0.00035 + idx) * 0.45;
      const panY = Math.cos(elapsed * 0.00028 + idx) * 0.35;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawCover(ctx, imgs[currentIdx], canvas.width, canvas.height, zoom, panX, panY, 1);

      if (imgs.length > 1 && slideTime > slideDuration - fadeDuration) {
        const fade = (slideTime - (slideDuration - fadeDuration)) / fadeDuration;
        drawCover(ctx, imgs[nextIdx], canvas.width, canvas.height, 1.01, -panX * 0.4, -panY * 0.4, fade);
      }
    });

    if (!reducedMotion) {
      requestAnimationFrame(renderLoops);
    }
  }

  requestAnimationFrame(renderLoops);
});
`

  const indexHtml = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(tenant.name)} · ${escapeHtml(tenant.tagline)}</title>
  <meta name="description" content="Web oficial de ${escapeHtml(tenant.name)} en ${escapeHtml(tenant.city)}. Cerveza de bodega, vinos y tapas en el casco histórico de Noia.">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="${fontsHref}" rel="stylesheet">
  <link rel="stylesheet" href="styles.css">
  <script type="application/ld+json">
${JSON.stringify(jsonLd, null, 2)}
  </script>
</head>
<body>

  <!-- SECCIÓN 1: NAVBAR FLOTANTE BLANCA + HERO FULLSCREEN -->
  <div class="pill-nav-wrap">
    <nav class="pill-nav" aria-label="Navegación principal">
      <a href="#top" class="pill-brand">
        ${tenant.logoUrl ? `<span class="logo-circle"><img src="${resolveImg(tenant.logoUrl)}" alt="${escapeHtml(tenant.name)}"></span>` : ''}
        <span>${escapeHtml(tenant.name)}</span>
      </a>
      <div class="pill-links">
        <a href="#tragos-carta" class="pill-link">Tragos y Carta</a>
        <a href="#horarios-ubicacion" class="pill-link">Horarios y Dónde estamos</a>
        <a href="#resenas-maps" class="pill-link">Reseñas</a>
      </div>
      <div class="pill-actions">
        <a href="${escapeHtml(tenant.googleMapsUrl || '#horarios-ubicacion')}" target="_blank" rel="noopener noreferrer" class="btn-blue">Cómo llegar</a>
        <button type="button" id="cauce-mobile-menu-btn" class="mobile-menu-btn" aria-expanded="false" aria-label="Abrir menú">☰</button>
      </div>
    </nav>
    <div id="cauce-mobile-dropdown" class="mobile-dropdown">
      <a href="#tragos-carta">Tragos y Carta</a>
      <a href="#horarios-ubicacion">Horarios y Dónde estamos</a>
      <a href="#resenas-maps">Reseñas</a>
      <a href="carta.html?mesa=0" class="btn-blue" style="margin-top: 4px;">Ver Carta</a>
    </div>
  </div>

  <header id="top" class="cauce-hero">
    <div class="loop-box" style="position: absolute; inset: 0;">
      <img src="${resolveImg(tenant.heroImagePoster)}" alt="${escapeHtml(tenant.name)}" class="loop-poster" fetchpriority="high">
      ${tenant.heroVideoMp4 ? `
      <video autoplay muted loop playsinline poster="${resolveImg(tenant.heroImagePoster)}" class="loop-video" style="position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; z-index: 1;">
        <source src="${resolveImg(tenant.heroVideoMp4)}" type="video/mp4">
      </video>` : `
      <canvas class="loop-canvas" data-loop-frames='${escapeHtml(JSON.stringify(heroFrames))}' aria-hidden="true"></canvas>`}
    </div>
    <div class="cauce-hero-scrim"></div>
    <div class="cauce-hero-inner">
      <h1 class="cauce-hero-title">Tu bar de siempre bajo los soportales de Noia</h1>
      <p class="cauce-hero-sub">${escapeHtml(tenant.tagline)}</p>
      <div class="cauce-hero-cta">
        <a href="carta.html?mesa=0" class="btn-blue btn-blue-lg">Ver Carta</a>
      </div>
    </div>
  </header>

  <!-- PANTALLA 2: MENÚ DESLIZANTE DE MOCKUPS DE TRAGOS + BOTÓN A MESA 0 -->
  <section id="tragos-carta" class="cauce-section" style="padding-top: 56px; text-align: center;">
    <span style="font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.2em; font-weight: 800; color: var(--brand-blue); background: var(--brand-blue-soft); padding: 4px 14px; border-radius: 9999px; border: 1px solid var(--brand-blue-border); display: inline-block; margin-bottom: 12px;">El ritmo de la barra</span>
    <h2 class="cauce-h2">Cañas bien tiradas, vinos de la tierra y aperitivos de siempre</h2>
    <p style="margin: 10px auto 32px; max-width: 600px; font-size: 0.96rem; color: var(--text-muted); line-height: 1.6;">
      Cerveza de bodega en copa fría, vermú preparado como manda la tradición y vinos gallegos para acompañar la conversación.
    </p>

    <!-- Carrusel deslizante de 6 mockups de tragos -->
    <div class="marquee-wrap">
      <div class="marquee-track">
        <div class="drink-card">
          <img src="${resolveImg('/images/dishes/estrella-galicia.jpg')}" alt="Caña y Copa Estrella Galicia de Bodega" class="drink-thumb" loading="lazy">
          <div class="drink-tag">Bodega</div>
          <h3 class="drink-title">Caña y Copa Estrella Galicia</h3>
          <p class="drink-desc">Directa de tanque refrigerado, con su crema perfecta y la temperatura justa para la primera o la tercera ronda.</p>
        </div>
        <div class="drink-card">
          <img src="${resolveImg('/images/dishes/cerveza-1906.jpg')}" alt="1906 Red Vintage La Colorada" class="drink-thumb" loading="lazy">
          <div class="drink-tag">Reserva</div>
          <h3 class="drink-title">1906 Red Vintage «La Colorada»</h3>
          <p class="drink-desc">Tostada, intensa y de trago largo. La favorita para alargar la tarde con calma y buena charla.</p>
        </div>
        <div class="drink-card">
          <img src="${resolveImg('/images/dishes/cerveza-artesana.jpg')}" alt="1906 Black Coupage" class="drink-thumb" loading="lazy">
          <div class="drink-tag">Especial</div>
          <h3 class="drink-title">1906 Black Coupage</h3>
          <p class="drink-desc">Carácter tostado y notas de café y cacao para los que buscan un sabor diferente en la sobremesa.</p>
        </div>
        <div class="drink-card">
          <img src="${resolveImg('/images/dishes/vermu-preparado.jpg')}" alt="Vermú de Grifo con Sifón y Cítrico" class="drink-thumb" loading="lazy">
          <div class="drink-tag">Aperitivo</div>
          <h3 class="drink-title">Vermú de Grifo con Sifón</h3>
          <p class="drink-desc">El aperitivo indispensable: servido con hielo, toque de sifón, rodaja de naranja y aceituna antes de comer.</p>
        </div>
        <div class="drink-card">
          <img src="${resolveImg('/images/dishes/copa-albarino-rustica.jpg')}" alt="Albariño y Mencía por Copa" class="drink-thumb" loading="lazy">
          <div class="drink-tag">Denominación</div>
          <h3 class="drink-title">Albariño y Mencía por Copa</h3>
          <p class="drink-desc">Blancos y tintos de bodegas gallegas servidos por copa, ideales para picotear algo al paso.</p>
        </div>
        <div class="drink-card">
          <img src="${resolveImg('/images/dishes/combinados.jpg')}" alt="Licores Tradicionales y Combinados" class="drink-thumb" loading="lazy">
          <div class="drink-tag">Sobremesa</div>
          <h3 class="drink-title">Licores y Combinados</h3>
          <p class="drink-desc">Licor café casero, hierbas tradicionales y combinados en copa balón para cerrar la noche entre amigos.</p>
        </div>
      </div>
    </div>

    <div style="margin-top: 36px;">
      <a href="carta.html?mesa=0" class="btn-blue btn-blue-lg">Ver Carta →</a>
      <p style="margin-top: 10px; font-size: 0.82rem; color: var(--text-muted);">Precios actualizados, formatos de ración y los 14 alérgenos oficiales</p>
    </div>
  </section>

  <!-- PANTALLA 3: HORARIOS Y DÓNDE ESTAMOS -->
  <section id="horarios-ubicacion" class="cauce-section" style="padding-top: 56px;">
    <div style="max-width: 680px; margin-bottom: 36px;">
      <span style="font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.2em; font-weight: 800; color: var(--brand-blue); display: block; margin-bottom: 8px;">Dónde encontrarnos</span>
      <h2 class="cauce-h2">El punto de encuentro en la Rúa do Curro</h2>
      <p style="margin-top: 10px; font-size: 0.96rem; color: var(--text-muted); line-height: 1.6;">
        Bajo los soportales de piedra de Noia. Un espacio cercano donde coincidir a cualquier hora del día.
      </p>
    </div>

    <div class="spaces-grid">
      <!-- Horario Semanal con Badge en Vivo -->
      <div class="cauce-card" style="display: flex; flex-direction: column; justify-content: space-between; gap: 20px;">
        <div>
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #E2E8F0; padding-bottom: 14px; margin-bottom: 14px;">
            <span style="font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 700; color: var(--text-ink); display: flex; align-items: center; gap: 6px;">
              ⏱️ Horario Semanal
            </span>
            <span class="live-badge-light tabular-nums">
              <span class="live-dot ${todayStatus.isOpen ? 'open' : 'closed'}"></span>
              <span>${escapeHtml(todayStatus.label)} · ${escapeHtml(todayStatus.subLabel)}</span>
            </span>
          </div>

          <div style="display: flex; flex-direction: column; gap: 6px;">
            ${[1, 2, 3, 4, 5, 6, 0].map(dayIdx => {
              const daySchedules = tenant.openingHours.filter(s => s.dayOfWeek === dayIdx)
              const isToday = dayIdx === new Date().getDay()
              return `
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 7px 10px; border-radius: 10px; font-size: 0.85rem; ${isToday ? 'background: var(--brand-blue-soft); color: var(--brand-blue); font-weight: 600;' : 'color: var(--text-muted);'}" class="tabular-nums">
                <span>${dayNames[dayIdx]}${isToday ? ' (Hoy)' : ''}</span>
                <span style="font-weight: 500;">${daySchedules.length > 0 ? daySchedules.map(s => `${s.open} – ${s.close}h`).join(' · ') : 'Cerrado'}</span>
              </div>
              `
            }).join('')}
          </div>
        </div>

        <p style="border-top: 1px solid #F1F5F9; padding-top: 10px; font-size: 0.78rem; color: var(--text-muted);">
          Servicio continuo en barra y terraza cubierta para que siempre encuentres sitio.
        </p>
      </div>

      <!-- Ubicación y Mapa -->
      <div class="cauce-card" style="display: flex; flex-direction: column; justify-content: space-between; gap: 20px;">
        <div style="display: flex; flex-direction: column; gap: 14px;">
          <div style="border-bottom: 1px solid #E2E8F0; padding-bottom: 12px;">
            <span style="font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 700; color: var(--text-ink); display: flex; align-items: center; gap: 6px;">
              📍 Ubicación & Contacto
            </span>
          </div>

          <!-- Mapa Interactivo de Google Maps -->
          <div style="width: 100%; height: 180px; border-radius: 14px; overflow: hidden; border: 1px solid #E2E8F0; position: relative; background: #F1F5F9;">
            <iframe
              title="Ubicación de Bar Jara-Tusas en Google Maps"
              src="https://maps.google.com/maps?q=Bar+Jara-Tusas,+R%C3%BAa+do+Curro+8,+Noia&t=&z=16&ie=UTF8&iwloc=&output=embed"
              style="width: 100%; height: 100%; border: 0; position: absolute; inset: 0;"
              loading="lazy"
              allowfullscreen
              referrerpolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>

          <div>
            <p style="font-size: 1.05rem; font-weight: 600; color: var(--text-ink);">${escapeHtml(tenant.address)}</p>
            <p style="font-size: 0.88rem; color: var(--text-muted); margin-top: 2px;" class="tabular-nums">${escapeHtml(tenant.postalCode)} ${escapeHtml(tenant.city)} (A Coruña)</p>
          </div>

          <p style="font-size: 0.9rem; color: var(--text-muted); line-height: 1.55;">
            En el corazón histórico de Noia, resguardado por los soportales de piedra donde siempre apetece parar a tomar algo.
          </p>

          <div style="display: flex; align-items: center; gap: 8px; font-size: 0.92rem; padding-top: 4px;">
            <span>📞</span>
            <a href="tel:${escapeHtml(cleanPhoneHref)}" style="font-weight: 600; color: var(--text-ink); text-decoration: none;" class="tabular-nums">${escapeHtml(tenant.phone)}</a>
          </div>
        </div>

        ${tenant.googleMapsUrl ? `
        <a href="${escapeHtml(tenant.googleMapsUrl)}" target="_blank" rel="noopener noreferrer" class="btn-blue" style="width: 100%; text-align: center; padding: 13px 20px;">
          Abrir en Google Maps →
        </a>
        ` : ''}
      </div>
    </div>
  </section>

  <!-- PANTALLA 4: RESEÑAS VERIFICADAS DE GOOGLE MAPS -->
  <section id="resenas-maps" class="cauce-section" style="padding-top: 48px;">
    <div style="display: flex; flex-direction: column; gap: 16px; margin-bottom: 32px;">
      <div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-end; gap: 20px;">
        <div style="max-width: 680px;">
          <span style="font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.2em; font-weight: 800; color: var(--brand-blue); display: block; margin-bottom: 8px;">Opiniones Verificadas · Google Maps</span>
          <h2 class="cauce-h2">La confianza de quienes llenan la barra cada día</h2>
          <p style="margin-top: 10px; font-size: 0.96rem; color: var(--text-muted); line-height: 1.6;">
            Una puntuación de 4.8 sobre 5 en Google Maps avalada por quienes disfrutan del trato cercano y la calidad de siempre.
          </p>
        </div>

        <div style="background: #FFFFFF; border: 1px solid #E2E8F0; padding: 12px 20px; border-radius: 18px; display: inline-flex; align-items: center; gap: 14px; box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);">
          <div style="color: #F59E0B; font-size: 1.1rem; letter-spacing: 2px;">★★★★★</div>
          <div>
            <div style="font-weight: 700; font-size: 0.95rem; color: var(--text-ink);" class="tabular-nums">4.8 / 5.0</div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">Google Maps</div>
          </div>
        </div>
      </div>
    </div>

    <div class="reviews-grid">
      ${(tenant.reviews || []).map(rev => `
      <article class="cauce-card" style="display: flex; flex-direction: column; justify-content: space-between; gap: 16px;">
        <div style="display: flex; flex-direction: column; gap: 10px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div style="color: #F59E0B; font-size: 0.9rem;">${'★'.repeat(rev.rating || 5)}</div>
            <span style="font-size: 0.75rem; color: var(--text-muted);" class="tabular-nums">${escapeHtml(rev.date || '')}</span>
          </div>
          <p style="font-size: 0.88rem; line-height: 1.6; color: var(--text-ink); font-style: italic;">
            "${escapeHtml(rev.text)}"
          </p>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #F1F5F9; padding-top: 10px; font-size: 0.78rem;">
          <span style="font-weight: 600; color: var(--text-ink);">${escapeHtml(rev.author)}</span>
          <span style="color: var(--brand-blue); font-weight: 600;">Verificada</span>
        </div>
      </article>
      `).join('')}
    </div>

    ${tenant.googleMapsUrl ? `
    <div style="text-align: center; margin-top: 36px;">
      <a href="${escapeHtml(tenant.googleMapsUrl)}" target="_blank" rel="noopener noreferrer" class="btn-outline">
        Ver todas las opiniones en Google Maps →
      </a>
    </div>
    ` : ''}
  </section>

  <!-- FOOTER -->
  <footer class="cauce-footer">
    <div style="max-width: 1120px; margin: 0 auto; display: flex; flex-direction: column; align-items: center; gap: 10px;">
      ${tenant.logoUrl ? `<span class="logo-circle" style="width: 48px; height: 48px;"><img src="${resolveImg(tenant.logoUrl)}" alt="${escapeHtml(tenant.name)}"></span>` : ''}
      <p class="font-serif" style="font-size: 1.5rem;">${escapeHtml(tenant.name)}</p>
      <p style="font-size: 0.86rem; color: var(--text-muted);">${escapeHtml(tenant.address)}, ${escapeHtml(tenant.postalCode)} ${escapeHtml(tenant.city)} · <a href="tel:${escapeHtml(cleanPhoneHref)}" style="color: var(--brand-blue); text-decoration: none;" class="tabular-nums">${escapeHtml(tenant.phone)}</a></p>
      <p style="font-size: 0.78rem; color: #64748B;">© ${new Date().getFullYear()} ${escapeHtml(tenant.name)} · Desarrollado con tecnología FLUXO.</p>
    </div>
  </footer>

  <!-- BARRA MÓVIL INFERIOR -->
  <aside class="cauce-mobile-bar">
    <a href="carta.html?mesa=0" class="btn-outline">Ver Carta</a>
    <a href="${escapeHtml(tenant.googleMapsUrl || '#horarios-ubicacion')}" target="_blank" rel="noopener noreferrer" class="btn-blue">Cómo Llegar</a>
  </aside>

  <script src="script.js"></script>
</body>
</html>`

  const cartaHtml = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Carta Oficial · ${escapeHtml(tenant.name)}</title>
  <meta name="description" content="Carta oficial, cervezas de bodega, vinos, tapas y alérgenos de ${escapeHtml(tenant.name)}.">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="${fontsHref}" rel="stylesheet">
  <link rel="stylesheet" href="styles.css">
  <style>
    .menu-header {
      padding: 112px 24px 40px;
      text-align: center;
      background: #FFFFFF;
      border-bottom: 1px solid #E2E8F0;
    }
    .menu-container {
      max-width: 980px;
      margin: 0 auto;
      padding: 36px 20px;
    }
    .menu-search {
      width: 100%;
      max-width: 440px;
      margin: 0 auto 22px;
      display: block;
      padding: 11px 16px;
      border-radius: 9999px;
      border: 1px solid #CBD5E1;
      background: #FFFFFF;
      color: var(--text-ink);
      font-family: var(--font-sans);
      font-size: 0.92rem;
    }
    .menu-filter-bar {
      margin-bottom: 28px;
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      justify-content: center;
    }
    .filter-btn {
      padding: 8px 16px;
      border-radius: 9999px;
      background: #FFFFFF;
      color: var(--text-ink);
      border: 1px solid #CBD5E1;
      cursor: pointer;
      font-size: 0.82rem;
      font-weight: 600;
    }
    .filter-btn.active {
      background: var(--brand-blue);
      color: #FFFFFF;
      border-color: var(--brand-blue);
    }
    .dish-card {
      display: flex;
      gap: 18px;
      background: #FFFFFF;
      padding: 18px;
      border-radius: 20px;
      border: 1px solid rgba(15, 23, 42, 0.1);
      margin-bottom: 14px;
      align-items: center;
    }
    .dish-thumb {
      width: 88px;
      height: 88px;
      border-radius: 14px;
      object-fit: cover;
      flex-shrink: 0;
    }
    .dish-head {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: 12px;
    }
    .dish-price {
      font-weight: 700;
      color: var(--brand-blue);
      font-size: 1.08rem;
      white-space: nowrap;
    }
    .variant-chip {
      font-size: 0.75rem;
      padding: 3px 10px;
      border-radius: 9999px;
      background: var(--brand-blue-soft);
      color: var(--brand-blue-hover);
      border: 1px solid var(--brand-blue-border);
    }
    .allergen-tag {
      display: inline-block;
      font-size: 0.68rem;
      text-transform: uppercase;
      padding: 3px 8px;
      background: var(--bg-stone);
      border: 1px solid #E2E8F0;
      color: var(--text-muted);
      border-radius: 6px;
      margin-top: 8px;
      margin-right: 4px;
    }
  </style>
</head>
<body>
  <div class="pill-nav-wrap">
    <nav class="pill-nav" aria-label="Cabecera de carta">
      <a href="index.html" class="pill-brand">
        ${tenant.logoUrl ? `<span class="logo-circle"><img src="${resolveImg(tenant.logoUrl)}" alt="${escapeHtml(tenant.name)}"></span>` : ''}
        <span>${escapeHtml(tenant.name)}</span>
      </a>
      <a href="index.html" class="btn-outline">Volver al Inicio</a>
    </nav>
  </div>

  <div class="menu-header">
    <div id="mesa-zero-banner" style="display: none; margin-bottom: 14px;">
      <span style="display: inline-flex; align-items: center; gap: 6px; background: #EFF6FF; color: #1D4ED8; border: 1px solid #BFDBFE; font-size: 0.82rem; font-weight: 800; padding: 4px 14px; border-radius: 9999px; letter-spacing: 0.04em;">📍 MESA 0</span>
    </div>
    <span style="font-size: 0.74rem; text-transform: uppercase; letter-spacing: 0.2em; font-weight: 700; color: var(--brand-blue);">Catálogo Digital Oficial</span>
    <h1 class="font-serif" style="font-size: clamp(2.2rem, 5vw, 3.1rem); font-weight: 400; margin-top: 6px;">Carta Oficial &amp; Precios</h1>
    <p style="color: var(--text-muted); margin-top: 8px; font-size: 0.94rem;">Precios con IVA incluido · Información de alérgenos conforme al Reglamento UE 1169/2011</p>
  </div>

  <main class="menu-container">
    <input id="menu-search-input" type="search" placeholder="Buscar cerveza, vino, tapa o alérgeno..." class="menu-search" oninput="applyMenuFilters()">

    <div class="menu-filter-bar">
      <button type="button" class="filter-btn active" onclick="filterMenu('Todos')">Todos</button>
      ${Array.from(new Set(tenant.dishes.map(d => d.category))).map(cat => `
      <button type="button" class="filter-btn" onclick="filterMenu('${escapeHtml(cat)}')">${escapeHtml(cat)}</button>
      `).join('')}
    </div>

    <div id="dish-list">
      ${tenant.dishes.map(d => `
      <div class="dish-card" data-category="${escapeHtml(d.category)}" data-search="${escapeHtml((d.name + ' ' + d.description + ' ' + d.category + ' ' + (d.allergens || []).join(' ')).toLowerCase())}">
        <img src="${resolveImg(d.image)}" alt="${escapeHtml(d.name)}" class="dish-thumb">
        <div style="flex: 1;">
          <div class="dish-head">
            <h2 class="font-serif" style="font-size: 1.4rem; font-weight: 400;">${escapeHtml(d.name)}</h2>
            <span class="dish-price tabular-nums">${d.price.toFixed(2)} €</span>
          </div>
          <p style="font-size: 0.88rem; color: var(--text-muted); margin-top: 4px; line-height: 1.5;">${escapeHtml(d.description)}</p>
          ${d.variants && d.variants.length > 0 ? `
          <div style="margin-top: 8px; display: flex; flex-wrap: wrap; gap: 6px;">
            ${d.variants.map(v => `<span class="variant-chip tabular-nums">${escapeHtml(v.name)}: <strong>${v.price.toFixed(2)} €</strong></span>`).join('')}
          </div>
          ` : ''}
          ${d.allergens && d.allergens.length > 0 ? `
          <div>
            ${d.allergens.map(a => `<span class="allergen-tag">${escapeHtml(a)}</span>`).join('')}
          </div>
          ` : ''}
        </div>
      </div>
      `).join('')}
    </div>

    <div style="text-align: center; margin-top: 40px;">
      <a href="index.html#contacto-whatsapp" class="btn-blue">Reservar o Consultar por WhatsApp</a>
    </div>
  </main>

  <script>
    (function checkMesaZero() {
      try {
        var params = new URLSearchParams(window.location.search);
        var m = params.get('mesa');
        if (m === '0' || m === 'mesa-0' || m === 'mesa0') {
          var el = document.getElementById('mesa-zero-banner');
          if (el) el.style.display = 'block';
        }
      } catch (e) {}
    })();

    var activeCategory = 'Todos';
    function filterMenu(cat) {
      activeCategory = cat;
      document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.textContent.trim() === cat);
      });
      applyMenuFilters();
    }
    function applyMenuFilters() {
      var q = (document.getElementById('menu-search-input')?.value || '').trim().toLowerCase();
      document.querySelectorAll('.dish-card').forEach(card => {
        var catMatch = activeCategory === 'Todos' || card.getAttribute('data-category') === activeCategory;
        var qMatch = !q || (card.getAttribute('data-search') || '').includes(q);
        card.style.display = catMatch && qMatch ? 'flex' : 'none';
      });
    }
  </script>
</body>
</html>`

  return { css, js, indexHtml, cartaHtml }
}

function buildEditorialBundle({ tenant, jsonLd, resolveImg, todayStatus, cleanPhoneHref, cleanWaNumber }) {
  const isUrbanBrewery = tenant.archetype === 'urban_street' || tenant.archetype === 'tavern'
  const signatureDishes = tenant.dishes.filter((d) => d.isSignature).slice(0, 4)
  if (signatureDishes.length === 0 && tenant.dishes.length > 0) {
    signatureDishes.push(tenant.dishes[0])
  }
  const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
  const googleFontsHref =
    'https://fonts.googleapis.com/css2?family=Instrument+Sans:ital,wght@0,400..700;1,400..700&family=Instrument+Serif:ital@0;1&family=Sora:wght@400..800&display=swap'

  const css = `/* FLUXO EDITORIAL GASTRONOMIC STYLESHEET */
:root {
  --bg-warm: #F6F3EC;
  --bg-card: #FFFFFF;
  --bg-card-subtle: #EDE8DE;
  --border-subtle: rgba(20, 19, 17, 0.1);
  --text-ink: #141311;
  --text-muted: rgba(20, 19, 17, 0.7);
  --accent-fire: ${tenant.accentColor || '#C85A32'};
  --accent-fire-hover: #b04d28;
  --bg-dark: #0B0D10;
  --text-light: #F6F3EC;
  --font-serif: 'Instrument Serif', Georgia, serif;
  --font-sans: 'Instrument Sans', 'Sora', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

* { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; font-family: var(--font-sans); background: var(--bg-warm); color: var(--text-ink); overflow-x: clip; }
body { overflow-x: clip; padding-bottom: 72px; }
@media (min-width: 768px) { body { padding-bottom: 0; } }
.tabular-nums { font-variant-numeric: tabular-nums; }
.site-header { position: fixed; top: 0; left: 0; right: 0; z-index: 50; background: rgba(11,13,16,0.9); backdrop-filter: blur(12px); border-bottom: 1px solid rgba(255,255,255,0.1); height: 72px; display: flex; align-items: center; }
.header-inner { max-width: 1200px; margin: 0 auto; padding: 0 24px; width: 100%; display: flex; justify-content: space-between; align-items: center; }
.brand-link { display: flex; align-items: center; gap: 8px; text-decoration: none; color: var(--text-light); font-size: 1.5rem; font-weight: 700; font-family: var(--font-serif); }
.brand-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--accent-fire); }
.nav-links { display: flex; align-items: center; gap: 20px; }
.nav-link { color: rgba(246,243,236,0.8); text-decoration: none; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.2em; font-weight: 500; }
.btn-primary { background: var(--accent-fire); color: #fff; padding: 10px 20px; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; text-decoration: none; border: none; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; }
.btn-secondary { background: rgba(255,255,255,0.1); color: #fff; padding: 10px 20px; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; text-transform: uppercase; letter-spacing: 0.1em; text-decoration: none; border: 1px solid rgba(255,255,255,0.2); cursor: pointer; display: inline-flex; align-items: center; gap: 8px; }
.hero-section { position: relative; width: 100%; height: 85vh; min-height: 620px; background: var(--bg-dark); display: flex; align-items: flex-end; overflow: hidden; }
.hero-poster { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; filter: brightness(0.75); }
.hero-overlay { position: absolute; inset: 0; background: linear-gradient(to top, var(--bg-dark) 0%, rgba(11,13,16,0.4) 50%, rgba(0,0,0,0.3) 100%); pointer-events: none; }
.hero-content { position: relative; z-index: 10; max-width: 1200px; margin: 0 auto; padding: 0 24px 64px; width: 100%; color: #fff; }
.hero-badge { display: inline-flex; align-items: center; gap: 8px; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.2em; color: rgba(255,255,255,0.82); margin-bottom: 16px; }
.hero-title { font-family: var(--font-serif); font-size: clamp(2.5rem, 6vw, 4.5rem); line-height: 1.08; font-weight: 400; max-width: 800px; }
.hero-desc { margin-top: 16px; font-size: 1.05rem; color: rgba(255,255,255,0.85); max-width: 600px; line-height: 1.6; }
.hero-actions { margin-top: 32px; display: flex; gap: 16px; flex-wrap: wrap; }
.section-wrapper { padding: 80px 24px; max-width: 1200px; margin: 0 auto; }
.section-title-wrap { margin-bottom: 48px; text-align: center; }
.section-tag { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.24em; font-weight: 700; color: var(--accent-fire); display: block; margin-bottom: 8px; }
.section-title { font-family: var(--font-serif); font-size: clamp(2rem, 4vw, 3rem); font-weight: 700; }
.ambience-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 32px; }
.ambience-card { background: rgba(237,232,222,0.6); border: 1px solid rgba(20,19,17,0.1); border-radius: 24px; overflow: hidden; display: flex; flex-direction: column; justify-content: space-between; }
.ambience-img { width: 100%; height: 240px; object-fit: cover; }
.ambience-body { padding: 24px; }
.ambience-name { font-family: var(--font-serif); font-size: 1.5rem; font-weight: 700; }
.ambience-subtitle { font-size: 0.8rem; color: var(--text-muted); }
.ambience-desc { margin-top: 12px; font-size: 0.85rem; color: var(--text-muted); line-height: 1.6; }
.reviews-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 24px; }
.review-card { background: #fff; border: 1px solid rgba(20,19,17,0.1); border-radius: 24px; padding: 32px; display: flex; flex-direction: column; justify-content: space-between; gap: 16px; }
.review-text { font-family: var(--font-serif); font-size: 1.15rem; font-style: italic; line-height: 1.6; }
.modal-overlay { display: none; position: fixed; inset: 0; z-index: 100; background: rgba(11,13,16,0.8); backdrop-filter: blur(8px); align-items: center; justify-content: center; padding: 16px; }
.modal-overlay.active { display: flex; }
.modal-box { background: var(--bg-warm); width: 100%; max-width: 520px; border-radius: 24px; padding: 28px; box-shadow: 0 24px 48px rgba(0,0,0,0.3); max-height: 90vh; overflow-y: auto; }
.thumb-bar { display: flex; position: fixed; bottom: 0; left: 0; right: 0; z-index: 45; background: rgba(11,13,16,0.96); padding: 10px 16px; justify-content: space-between; align-items: center; gap: 8px; }
@media (min-width: 768px) { .thumb-bar { display: none; } }
.thumb-btn { flex: 1; text-align: center; color: rgba(255,255,255,0.85); font-size: 0.75rem; text-decoration: none; background: none; border: none; cursor: pointer; padding: 8px 4px; border-radius: 8px; }
.thumb-btn-primary { flex: 2; background: var(--accent-fire); color: #fff; font-weight: 700; border-radius: 12px; padding: 12px; }
`

  const js = `document.addEventListener('DOMContentLoaded', () => {
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

  const modal = document.getElementById('reservation-modal');
  const openBtns = document.querySelectorAll('[data-open-reservation]');
  const closeBtn = document.getElementById('close-reservation-btn');
  const zoneSelect = document.getElementById('res-zone');
  openBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetZone = btn.getAttribute('data-zone');
      if (targetZone && zoneSelect) zoneSelect.value = targetZone;
      if (modal) modal.classList.add('active');
    });
  });
  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => modal.classList.remove('active'));
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('active'); });
  }
  const sendBtn = document.getElementById('send-whatsapp-btn');
  const restaurantName = "${tenant.name.replace(/"/g, '\\"')}";
  const whatsappNumber = "${cleanWaNumber}";
  if (sendBtn) {
    sendBtn.addEventListener('click', () => {
      const name = document.getElementById('res-name')?.value || 'Cliente';
      const diners = document.getElementById('res-diners')?.value || '2';
      const shift = document.getElementById('res-shift')?.value || 'Cena';
      const time = document.getElementById('res-time')?.value || '21:30';
      const zone = document.getElementById('res-zone')?.value || 'Salón Principal';
      const msg = \`Hola \${restaurantName}, solicitud para \${diners} personas (\${zone}) a las \${time} (\${shift}) a nombre de \${name}.\`;
      window.open(\`https://wa.me/\${whatsappNumber}?text=\${encodeURIComponent(msg)}\`, '_blank');
    });
  }
});`

  const indexHtml = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(tenant.name)} · ${escapeHtml(tenant.tagline)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="${googleFontsHref}" rel="stylesheet">
  <link rel="stylesheet" href="styles.css">
  <script type="application/ld+json">${JSON.stringify(jsonLd, null, 2)}</script>
</head>
<body>
  <header class="site-header">
    <div class="header-inner">
      <a href="index.html" class="brand-link"><span>${escapeHtml(tenant.name)}</span><span class="brand-dot"></span></a>
      <nav class="nav-links">
        <a href="carta.html" class="nav-link">Carta &amp; Precios</a>
        <a href="#ambientes" class="nav-link">Espacios</a>
        <a href="#horarios" class="nav-link">Horarios</a>
        <button class="btn-primary" data-open-reservation>Reservar Mesa</button>
      </nav>
    </div>
  </header>
  <section class="hero-section">
    <img src="${resolveImg(tenant.heroImagePoster)}" alt="${escapeHtml(tenant.name)}" class="hero-poster" fetchpriority="high">
    <div class="hero-overlay"></div>
    <div class="hero-content">
      <div class="hero-badge"><span>${escapeHtml(tenant.address)} · ${escapeHtml(tenant.city)}</span><span>•</span><span>● ${escapeHtml(todayStatus.label)}</span></div>
      <h1 class="hero-title">${escapeHtml(tenant.name)}</h1>
      <p class="hero-desc">${escapeHtml(tenant.tagline)}</p>
      <div class="hero-actions">
        <a href="carta.html" class="btn-primary">Ver Carta y Precios</a>
        <button class="btn-secondary" data-open-reservation>${isUrbanBrewery ? 'Terraza / Grupos' : 'Reservar Mesa'}</button>
      </div>
    </div>
  </section>
  <section class="section-wrapper">
    <div class="section-title-wrap"><span class="section-tag">Selección de la Casa</span><h2 class="section-title">Imprescindibles</h2></div>
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 32px;">
      ${signatureDishes.map(sig => `
      <a href="carta.html" style="text-decoration: none; color: inherit; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 14px;">
        <img src="${resolveImg(sig.image)}" alt="${escapeHtml(sig.name)}" style="width: 220px; height: 220px; border-radius: 50%; object-fit: cover;">
        <h3 style="font-family: var(--font-serif); font-size: 1.5rem;">${escapeHtml(sig.name)}</h3>
        <p style="font-size: 0.85rem; color: var(--text-muted);">${escapeHtml(sig.description)}</p>
      </a>`).join('')}
    </div>
  </section>
  <section id="ambientes" class="section-wrapper" style="border-top: 1px solid var(--border-subtle);">
    <div class="section-title-wrap">
      <span class="section-tag">Espacios &amp; Luz</span>
      <h2 class="section-title">Elige tu Espacio en ${escapeHtml(tenant.name)}</h2>
      <div style="margin-top: 16px; display: inline-flex; gap: 8px;">
        <button class="btn-primary active" data-light-mode="day">Mediodía (13:30h)</button>
        <button class="btn-secondary" data-light-mode="night" style="color: #141311;">Noche (21:30h)</button>
      </div>
    </div>
    <div class="ambience-grid">
      ${tenant.ambiences.map(amb => `
      <div class="ambience-card">
        <img src="${resolveImg(amb.imageDay)}" alt="${escapeHtml(amb.name)}" class="ambience-img" data-amb-img data-img-day="${resolveImg(amb.imageDay)}" data-img-night="${resolveImg(amb.imageNight)}">
        <div class="ambience-body">
          <h3 class="ambience-name">${escapeHtml(amb.name)}</h3>
          <span class="ambience-subtitle">${escapeHtml(amb.subtitle)}</span>
          <p class="ambience-desc">${escapeHtml(amb.desc)}</p>
          <p style="margin-top: 10px; font-size: 0.78rem; color: var(--accent-fire);" data-amb-note data-note-day="${escapeHtml(amb.lightingNoteDay)}" data-note-night="${escapeHtml(amb.lightingNoteNight)}">${escapeHtml(amb.lightingNoteDay)}</p>
        </div>
        <div style="padding: 0 24px 24px;"><button class="btn-primary" style="width: 100%; justify-content: center;" data-open-reservation data-zone="${escapeHtml(amb.name)}">Reservar en ${escapeHtml(amb.name)}</button></div>
      </div>`).join('')}
    </div>
  </section>
  <section id="horarios" class="section-wrapper" style="border-top: 1px solid var(--border-subtle);">
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 40px;">
      <div>
        <span class="section-tag">Ubicación &amp; Contacto</span>
        <h2 class="section-title">Ven a Conocernos</h2>
        <p style="margin-top: 12px; color: var(--text-muted);">${escapeHtml(tenant.address)}, ${escapeHtml(tenant.postalCode)} ${escapeHtml(tenant.city)}.</p>
        <p style="margin-top: 8px; font-weight: 600;">Teléfono: <a href="tel:${escapeHtml(cleanPhoneHref)}">${escapeHtml(tenant.phone)}</a></p>
      </div>
      <div style="background: #fff; padding: 28px; border-radius: 24px; border: 1px solid var(--border-subtle);">
        <h3 style="font-family: var(--font-serif); font-size: 1.5rem; margin-bottom: 12px;">Horarios de Servicio</h3>
        <ul style="list-style: none; font-size: 0.85rem; line-height: 2;" class="tabular-nums">
          ${tenant.openingHours.map(h => `<li style="display: flex; justify-content: space-between;"><span>${dayNames[h.dayOfWeek] || 'Día'} (${escapeHtml(h.label || 'Servicio')}):</span><strong>${escapeHtml(h.open)} - ${escapeHtml(h.close)}</strong></li>`).join('')}
        </ul>
      </div>
    </div>
  </section>
  <aside class="thumb-bar">
    <a href="carta.html" class="thumb-btn">📖 Carta</a>
    <a href="tel:${escapeHtml(cleanPhoneHref)}" class="thumb-btn">📞 Llamar</a>
    <button class="thumb-btn thumb-btn-primary" data-open-reservation>📅 Reservar</button>
  </aside>
  <div id="reservation-modal" class="modal-overlay">
    <div class="modal-box">
      <div style="display: flex; justify-content: space-between; margin-bottom: 16px;"><h3>Solicitud de Reserva</h3><button id="close-reservation-btn" style="background: none; border: none; font-size: 1.25rem; cursor: pointer;">✕</button></div>
      <div style="display: flex; flex-direction: column; gap: 12px;">
        <input type="text" id="res-name" placeholder="Tu nombre" style="padding: 10px; border-radius: 10px; border: 1px solid #ccc;">
        <select id="res-diners" style="padding: 10px; border-radius: 10px; border: 1px solid #ccc;"><option value="2">2 Personas</option><option value="4">4 Personas</option></select>
        <select id="res-shift" style="padding: 10px; border-radius: 10px; border: 1px solid #ccc;"><option value="Almuerzo">Almuerzo</option><option value="Cena">Cena</option></select>
        <input type="text" id="res-time" value="21:30" style="padding: 10px; border-radius: 10px; border: 1px solid #ccc;">
        <select id="res-zone" style="padding: 10px; border-radius: 10px; border: 1px solid #ccc;">${tenant.ambiences.map(a => `<option value="${escapeHtml(a.name)}">${escapeHtml(a.name)}</option>`).join('')}</select>
        <button id="send-whatsapp-btn" class="btn-primary" style="justify-content: center;">Enviar por WhatsApp</button>
      </div>
    </div>
  </div>
  <script src="script.js"></script>
</body>
</html>`

  const cartaHtml = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Carta Oficial · ${escapeHtml(tenant.name)}</title>
  <link href="${googleFontsHref}" rel="stylesheet">
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <header class="site-header"><div class="header-inner"><a href="index.html" class="brand-link">${escapeHtml(tenant.name)}</a><a href="index.html" class="btn-secondary">Volver al Inicio</a></div></header>
  <main class="section-wrapper" style="padding-top: 112px;">
    <h1 class="section-title" style="margin-bottom: 24px;">Carta de Temporada</h1>
    ${tenant.dishes.map(d => `
    <div style="display: flex; gap: 16px; background: #fff; padding: 18px; border-radius: 18px; margin-bottom: 14px; align-items: center;">
      <img src="${resolveImg(d.image)}" alt="${escapeHtml(d.name)}" style="width: 84px; height: 84px; border-radius: 12px; object-fit: cover;">
      <div style="flex: 1;">
        <div style="display: flex; justify-content: space-between;"><strong>${escapeHtml(d.name)}</strong><strong style="color: var(--accent-fire);">${d.price.toFixed(2)} €</strong></div>
        <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 4px;">${escapeHtml(d.description)}</p>
      </div>
    </div>`).join('')}
  </main>
</body>
</html>`

  return { css, js, indexHtml, cartaHtml }
}

async function runExporter() {
  const tenant = await getGastronomicTenant(targetSlug)
  if (!tenant) {
    console.error(`❌ Error: No se encontró configuración para el slug "${targetSlug}".`)
    console.error('  Slugs disponibles: "casa-mar-da-vila", "bar-jaratusas"')
    process.exit(1)
  }

  const outBaseDir = path.join(rootDir, 'out', 'sites')
  const siteDir = path.join(outBaseDir, tenant.slug)
  const assetsDir = path.join(siteDir, 'assets')
  const dishesAssetsDir = path.join(assetsDir, 'dishes')

  if (fs.existsSync(siteDir)) {
    fs.rmSync(siteDir, { recursive: true, force: true })
  }
  fs.mkdirSync(dishesAssetsDir, { recursive: true })

  const copiedImages = new Map()
  const copyAssetIfLocal = (rawPath) => {
    if (!rawPath || !rawPath.startsWith('/images/')) return
    const srcFile = path.join(rootDir, 'public', rawPath.replace(/^\/+/, ''))
    const baseName = path.basename(rawPath)
    const destFile = path.join(dishesAssetsDir, baseName)
    if (fs.existsSync(srcFile)) {
      fs.copyFileSync(srcFile, destFile)
      copiedImages.set(rawPath, `./assets/dishes/${baseName}`)
    }
  }

  // Copiar todos los recursos gráficos (platos, hero, logo, loop frames, paneles y espacios)
  for (const dish of tenant.dishes) copyAssetIfLocal(dish.image)
  for (const panel of tenant.scrollytellingPanels || []) copyAssetIfLocal(panel.image)
  for (const frame of tenant.heroLoopFrames || []) copyAssetIfLocal(frame)
  for (const frame of tenant.featureVideoFrames || []) copyAssetIfLocal(frame)
  for (const frame of tenant.experienceVideoFrames || []) copyAssetIfLocal(frame)
  copyAssetIfLocal(tenant.heroImagePoster)
  if (tenant.heroVideoMp4) copyAssetIfLocal(tenant.heroVideoMp4)
  copyAssetIfLocal(tenant.logoUrl)
  copyAssetIfLocal(tenant.flankLeftImage)
  copyAssetIfLocal(tenant.flankRightImage)
  for (const amb of tenant.ambiences) {
    copyAssetIfLocal(amb.imageDay)
    copyAssetIfLocal(amb.imageNight)
  }

  const resolveImg = (originalPath) => copiedImages.get(originalPath) || originalPath
  const jsonLd = buildRestaurantJsonLd(tenant)
  const todayStatus = getOpeningStatus(tenant.openingHours, new Date())
  const cleanPhoneHref = tenant.phone.replace(/\s+/g, '')
  const cleanWaNumber = tenant.whatsappNumber.replace(/\D/g, '')

  const isCauce = tenant.layoutPreset === 'cauce_editorial'
  const bundle = isCauce
    ? buildCauceBundle({ tenant, jsonLd, resolveImg, todayStatus, cleanPhoneHref, cleanWaNumber })
    : buildEditorialBundle({ tenant, jsonLd, resolveImg, todayStatus, cleanPhoneHref, cleanWaNumber })

  fs.writeFileSync(path.join(siteDir, 'styles.css'), bundle.css, 'utf8')
  fs.writeFileSync(path.join(siteDir, 'script.js'), bundle.js, 'utf8')
  fs.writeFileSync(path.join(siteDir, 'index.html'), bundle.indexHtml, 'utf8')
  fs.writeFileSync(path.join(siteDir, 'carta.html'), bundle.cartaHtml, 'utf8')

  console.log(`✔ Archivos estáticos generados en: out/sites/${tenant.slug}/ (${isCauce ? 'Cauce Editorial' : 'Editorial'})`)
  console.log(`  - assets/dishes/ (${copiedImages.size} imágenes copiadas)`)

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
  }

  console.log('='.repeat(80))
  console.log(` 🎉 EXPORTACIÓN FINALIZADA PARA "${tenant.name}"`)
  console.log('='.repeat(80))
}

runExporter().catch((err) => {
  console.error('❌ Error en el proceso de exportación:', err)
  process.exit(1)
})
