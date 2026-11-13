#!/usr/bin/env node
/**
 * FLUXO GASTRONOMIC SYSTEM — EXPORTADOR ESTÁTICO 2-EN-1 PARA HOSTINGS TRADICIONALES (cPanel / Hostinger / Apache)
 *
 * Genera un paquete web estático completamente autónomo y autocontenido para un local gastronómico:
 * 1. index.html  -> Home cinemática a 60fps, scrollytelling horizontal, selector de espacios y luz, reserva WhatsApp directa.
 * 2. carta.html  -> Catálogo digital interactivo (Plan Carta Fluxo), búsqueda en vivo, variantes y alérgenos.
 * 3. styles.css  -> Sistema de diseño multi-arquetipo (#0A0B0E craft oscuro / #F6F3EC editorial cálido).
 * 4. script.js   -> Interactividad vanilla a 60fps (partículas, scrollytelling horizontal lerp, selector de luz, WhatsApp).
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
console.log(' 🍽️  FLUXO — EXPORTADOR ESTÁTICO CINEMÁTICO 2-EN-1')
console.log(` Target Slug: ${targetSlug}`)
console.log('='.repeat(80))

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

  // Limpiar directorio previo para evitar recursos huérfanos de exportaciones anteriores
  if (fs.existsSync(siteDir)) {
    fs.rmSync(siteDir, { recursive: true, force: true })
  }
  fs.mkdirSync(dishesAssetsDir, { recursive: true })

  // Función auxiliar para copiar cualquier imagen local de public/ a assets/dishes/
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

  // 1. Copiar imágenes de platos, paneles scrollytelling, hero, logo, flancos y ambientes
  for (const dish of tenant.dishes) {
    copyAssetIfLocal(dish.image)
  }
  for (const panel of tenant.scrollytellingPanels || []) {
    copyAssetIfLocal(panel.image)
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
  const scrollyPanels = tenant.scrollytellingPanels || []
  const spaceGridClass =
    tenant.ambiences.length === 3
      ? 'ambience-grid ambience-grid-3 md:grid-cols-3'
      : 'ambience-grid ambience-grid-2 md:grid-cols-2'

  const cleanPhoneHref = tenant.phone.replace(/\s+/g, '')
  const cleanWaNumber = tenant.whatsappNumber.replace(/\D/g, '')
  const todayStatus = getOpeningStatus(tenant.openingHours, new Date())
  const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

  // 2. Generar JSON-LD
  const jsonLd = buildRestaurantJsonLd(tenant)

  // 3. Generar styles.css
  const cssContent = `/* FLUXO EDITORIAL GASTRONOMIC STYLESHEET */
:root {
  --bg-warm: ${isUrbanBrewery ? '#0A0B0E' : '#F6F3EC'};
  --bg-card: ${isUrbanBrewery ? '#12151C' : '#FFFFFF'};
  --bg-card-subtle: ${isUrbanBrewery ? '#161A24' : '#EDE8DE'};
  --border-subtle: ${isUrbanBrewery ? 'rgba(255, 255, 255, 0.1)' : 'rgba(20, 19, 17, 0.1)'};
  --border-strong: ${isUrbanBrewery ? 'rgba(245, 158, 11, 0.35)' : 'rgba(20, 19, 17, 0.25)'};
  --text-ink: ${isUrbanBrewery ? '#F6F3EC' : '#141311'};
  --text-muted: ${isUrbanBrewery ? 'rgba(246, 243, 236, 0.72)' : 'rgba(20, 19, 17, 0.7)'};
  --accent-fire: ${tenant.accentColor || (isUrbanBrewery ? '#F59E0B' : '#C85A32')};
  --accent-fire-hover: ${isUrbanBrewery ? '#D97706' : '#b04d28'};
  --accent-copper: #EA580C;
  --btn-primary-text: ${isUrbanBrewery ? '#0A0B0E' : '#FFFFFF'};
  --bg-dark: ${isUrbanBrewery ? '#0A0B0E' : '#0B0D10'};
  --bg-dark-card: #12151C;
  --text-light: #F6F3EC;
  --font-display: ${isUrbanBrewery ? "'Anton', 'Sora', sans-serif" : "'Instrument Serif', Georgia, serif"};
  --font-serif: var(--font-display);
  --font-sans: ${isUrbanBrewery ? "'DM Sans', 'Inter', 'Sora', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" : "'Instrument Sans', 'Sora', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"};
  --font-mono: 'DM Sans', 'Sora', monospace;
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
  overflow-x: clip;
  -webkit-font-smoothing: antialiased;
}

body {
  overflow-x: clip;
  background-color: var(--bg-warm);
  color: var(--text-ink);
  padding-bottom: 76px;
}

@media (min-width: 768px) {
  body {
    padding-bottom: 0;
  }
}

.font-serif { font-family: var(--font-serif); }
.font-display { font-family: var(--font-display); }
.font-sans { font-family: var(--font-sans); }
.font-mono { font-family: var(--font-mono); }
.tabular-nums { font-variant-numeric: tabular-nums; }

/* Header */
.site-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 50;
  background: rgba(10, 11, 14, 0.9);
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
  padding: 0 16px;
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

@media (min-width: 768px) {
  .header-inner {
    padding: 0 24px;
  }
}

.brand-group {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.brand-link {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  color: var(--text-light);
  font-size: 1.25rem;
  font-weight: 700;
  font-family: var(--font-display);
  letter-spacing: 0.02em;
  white-space: nowrap;
}

.brand-logo-wrap {
  width: 38px;
  height: 38px;
  border-radius: 9999px;
  background: #EBE8E1;
  border: 1.5px solid rgba(245, 158, 11, 0.6);
  overflow: hidden;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.brand-logo-wrap img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.brand-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent-fire);
  flex-shrink: 0;
}

.live-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.14);
  font-size: 0.7rem;
  font-weight: 600;
  color: #F6F3EC;
  white-space: nowrap;
}

.live-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}

.live-dot.open {
  background: #22C55E;
  box-shadow: 0 0 8px rgba(34, 197, 94, 0.8);
}

.live-dot.closed {
  background: #F59E0B;
}

.nav-links {
  display: none;
  align-items: center;
  gap: 20px;
}

@media (min-width: 900px) {
  .nav-links {
    display: flex;
  }
}

.nav-link {
  color: rgba(246, 243, 236, 0.82);
  text-decoration: none;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  font-weight: 600;
  transition: color 0.2s cubic-bezier(0.22, 1, 0.36, 1);
  white-space: nowrap;
}

.nav-link:hover {
  color: var(--accent-fire);
}

.btn-primary {
  background: var(--accent-fire);
  color: var(--btn-primary-text);
  padding: 11px 22px;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  text-decoration: none;
  border: none;
  cursor: pointer;
  transition: transform 0.22s cubic-bezier(0.22, 1, 0.36, 1), background-color 0.22s ease;
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
  padding: 11px 22px;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  text-decoration: none;
  border: 1px solid rgba(255, 255, 255, 0.22);
  cursor: pointer;
  transition: transform 0.22s cubic-bezier(0.22, 1, 0.36, 1), background-color 0.22s ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.18);
  transform: translateY(-1px);
}

/* Hero */
.hero-section {
  position: relative;
  width: 100%;
  min-height: 640px;
  height: 88vh;
  background: var(--bg-dark);
  display: flex;
  align-items: flex-end;
  overflow: hidden;
  padding-top: 84px;
}

.hero-poster {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: brightness(0.72);
}

.hero-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, var(--bg-dark) 0%, rgba(10, 11, 14, 0.45) 55%, rgba(0, 0, 0, 0.35) 100%);
  pointer-events: none;
}

.hero-content {
  position: relative;
  z-index: 10;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px 56px 24px;
  width: 100%;
  color: #fff;
}

.hero-logo-wrap {
  width: 84px;
  height: 84px;
  border-radius: 9999px;
  background: #EBE8E1;
  border: 2px solid rgba(245, 158, 11, 0.65);
  overflow: hidden;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 18px;
  box-shadow: 0 16px 36px rgba(0, 0, 0, 0.45);
}

.hero-logo-wrap img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.hero-badge {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.18em;
  color: rgba(255, 255, 255, 0.85);
  margin-bottom: 14px;
}

.hero-title {
  font-family: var(--font-display);
  font-size: clamp(2.6rem, 6.2vw, 4.75rem);
  line-height: 1.04;
  font-weight: 400;
  letter-spacing: ${isUrbanBrewery ? '0.02em' : '-0.01em'};
  max-width: 840px;
}

.hero-desc {
  margin-top: 16px;
  font-size: 1.05rem;
  color: rgba(255, 255, 255, 0.86);
  max-width: 640px;
  line-height: 1.6;
}

.hero-actions {
  margin-top: 28px;
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

/* Section Common */
.section-wrapper {
  padding: 80px 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.section-divider {
  border-top: 1px solid var(--border-subtle);
}

.section-title-wrap {
  margin-bottom: 48px;
  text-align: center;
}

.section-tag {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.24em;
  font-weight: 700;
  color: var(--accent-fire);
  display: block;
  margin-bottom: 8px;
}

.section-title {
  font-family: var(--font-display);
  font-size: clamp(2rem, 4vw, 3.1rem);
  font-weight: ${isUrbanBrewery ? '400' : '700'};
  letter-spacing: ${isUrbanBrewery ? '0.02em' : '-0.01em'};
  line-height: 1.1;
}

/* Signature 4-Pillar Portada (ZERO prices on portada) */
.signature-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 28px;
  align-items: stretch;
}

@media (min-width: 640px) {
  .signature-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 1024px) {
  .signature-grid.signature-grid-4 {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

.signature-card {
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: 24px;
  padding: 28px 20px;
  text-decoration: none;
  color: var(--text-ink);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 18px;
  transition: transform 0.28s cubic-bezier(0.22, 1, 0.36, 1), border-color 0.28s ease, box-shadow 0.28s ease;
}

.signature-card:hover {
  transform: translateY(-4px);
  border-color: var(--border-strong);
  box-shadow: 0 22px 42px rgba(0, 0, 0, 0.28);
}

.signature-thumb-wrap {
  position: relative;
  width: 190px;
  height: 190px;
  border-radius: 9999px;
  overflow: hidden;
  border: 2px solid var(--border-strong);
  box-shadow: 0 20px 36px rgba(0, 0, 0, 0.4);
  flex-shrink: 0;
}

.signature-thumb-wrap img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.variant-pill {
  font-size: 0.7rem;
  padding: 4px 10px;
  border-radius: 9999px;
  background: var(--bg-card-subtle);
  border: 1px solid var(--border-subtle);
  color: var(--text-muted);
}

/* Horizontal Scrollytelling Showcase */
.scrolly-section {
  position: relative;
  height: 260vh;
  min-height: 1850px;
  background: var(--bg-dark);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.scrolly-sticky {
  position: sticky;
  top: 0;
  height: 100vh;
  height: 100dvh;
  width: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 84px 0 88px;
  background: var(--bg-dark);
  color: #F6F3EC;
}

@media (min-width: 768px) {
  .scrolly-sticky {
    padding: 88px 0 36px;
  }
}

.scrolly-header {
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  padding: 0 24px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.scrolly-header-top {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: flex-end;
  gap: 16px;
}

.scrolly-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.scrolly-step-badge {
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  color: var(--accent-fire);
  margin-right: 6px;
}

.scrolly-pill {
  background: rgba(255, 255, 255, 0.08);
  color: rgba(246, 243, 236, 0.78);
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 9999px;
  padding: 5px 11px;
  font-size: 0.72rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.scrolly-pill.active {
  background: var(--accent-fire);
  color: #0A0B0E;
  border-color: var(--accent-fire);
}

.scrolly-nav-btn {
  width: 30px;
  height: 30px;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.08);
  color: #F6F3EC;
  border: 1px solid rgba(255, 255, 255, 0.16);
  cursor: pointer;
  font-weight: 700;
}

.scrolly-progress-track {
  width: 100%;
  height: 3px;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.12);
  overflow: hidden;
}

.scrolly-progress-fill {
  height: 100%;
  width: 100%;
  background: linear-gradient(90deg, #F59E0B, #EA580C);
  transform-origin: left center;
  transform: scaleX(0.25);
  will-change: transform;
}

.scrolly-viewport {
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: center;
  width: 100%;
  overflow: hidden;
  padding: 12px 0;
}

.scrolly-track {
  display: flex;
  gap: 24px;
  padding: 0 24px;
  will-change: transform;
}

.scrolly-panel-card {
  position: relative;
  flex: 0 0 min(86vw, 860px);
  background: #12151C;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 26px;
  overflow: hidden;
  display: grid;
  grid-template-columns: 1fr;
  min-height: 390px;
  max-height: 540px;
}

@media (min-width: 768px) {
  .scrolly-panel-card {
    grid-template-columns: 1.1fr 0.9fr;
    min-height: 430px;
  }
}

.scrolly-watermark {
  position: absolute;
  right: 22px;
  bottom: 8px;
  font-family: var(--font-display);
  font-size: clamp(4.5rem, 9vw, 8rem);
  line-height: 0.9;
  color: rgba(255, 255, 255, 0.06);
  pointer-events: none;
  z-index: 1;
}

.scrolly-media {
  position: relative;
  min-height: 210px;
  overflow: hidden;
}

.scrolly-media img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.scrolly-body {
  position: relative;
  z-index: 2;
  padding: 24px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 12px;
}

@media (min-width: 768px) {
  .scrolly-body {
    padding: 36px;
  }
}

.scrolly-tag {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--accent-fire);
}

.scrolly-title {
  font-family: var(--font-display);
  font-size: clamp(1.6rem, 3vw, 2.35rem);
  line-height: 1.08;
  color: #F6F3EC;
}

.scrolly-desc {
  font-size: 0.92rem;
  line-height: 1.6;
  color: rgba(246, 243, 236, 0.78);
}

@media (prefers-reduced-motion: reduce) {
  .scrolly-section {
    height: auto;
    min-height: 0;
  }
  .scrolly-sticky {
    position: relative;
    height: auto;
    padding: 64px 0;
  }
  .scrolly-viewport {
    overflow-x: auto;
    scroll-snap-type: x mandatory;
  }
  .scrolly-panel-card {
    scroll-snap-align: center;
  }
}

/* Ambience cards (md:grid-cols-3 when 3 spaces, md:grid-cols-2 when 2) */
.light-toggle-group {
  margin-top: 18px;
  display: inline-flex;
  gap: 6px;
  background: var(--bg-card-subtle);
  border: 1px solid var(--border-subtle);
  padding: 5px;
  border-radius: 9999px;
}

.light-toggle-btn {
  padding: 8px 18px;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 700;
  border: none;
  cursor: pointer;
  background: transparent;
  color: var(--text-muted);
  transition: all 0.2s ease;
}

.light-toggle-btn.active {
  background: var(--accent-fire);
  color: var(--btn-primary-text);
}

.ambience-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 28px;
}

@media (min-width: 768px) {
  .ambience-grid.ambience-grid-2 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .ambience-grid.ambience-grid-3 {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

.ambience-card {
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: 24px;
  overflow: hidden;
  transition: transform 0.28s cubic-bezier(0.22, 1, 0.36, 1), border-color 0.28s ease, box-shadow 0.28s ease;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.ambience-card:hover {
  transform: translateY(-3px);
  border-color: var(--border-strong);
  box-shadow: 0 20px 36px rgba(0, 0, 0, 0.22);
}

.ambience-img {
  width: 100%;
  height: 240px;
  object-fit: cover;
  display: block;
}

.ambience-body {
  padding: 24px;
}

.ambience-name {
  font-family: var(--font-display);
  font-size: 1.5rem;
  font-weight: ${isUrbanBrewery ? '400' : '700'};
}

.ambience-subtitle {
  display: block;
  margin-top: 4px;
  font-size: 0.82rem;
  color: var(--text-muted);
}

.ambience-desc {
  margin-top: 12px;
  font-size: 0.86rem;
  color: var(--text-muted);
  line-height: 1.6;
}

/* Inline Conversion Card */
.inline-wa-card {
  background: var(--bg-card);
  border: 1px solid var(--border-strong);
  border-radius: 28px;
  padding: 32px;
  display: grid;
  grid-template-columns: 1fr;
  gap: 28px;
  align-items: center;
}

@media (min-width: 900px) {
  .inline-wa-card {
    grid-template-columns: 1fr 1.15fr;
  }
}

.wa-input {
  width: 100%;
  padding: 11px 14px;
  border-radius: 12px;
  border: 1px solid var(--border-subtle);
  background: var(--bg-card-subtle);
  color: var(--text-ink);
  font-family: var(--font-sans);
  font-size: 0.9rem;
}

/* Reviews & Info Cards */
.reviews-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(290px, 1fr));
  gap: 24px;
}

.review-card,
.info-card {
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: 24px;
  padding: 28px;
}

.review-card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 16px;
}

.review-text {
  font-size: 1.05rem;
  font-style: italic;
  line-height: 1.6;
  color: var(--text-ink);
}

/* Drawer & Modal */
.modal-overlay {
  display: none;
  position: fixed;
  inset: 0;
  z-index: 100;
  background: rgba(10, 11, 14, 0.84);
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
  background: var(--bg-card);
  color: var(--text-ink);
  border: 1px solid var(--border-strong);
  width: 100%;
  max-width: 520px;
  border-radius: 24px;
  padding: 28px;
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.45);
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
  background: rgba(10, 11, 14, 0.96);
  backdrop-filter: blur(12px);
  border-top: 1px solid rgba(255, 255, 255, 0.12);
  padding: 8px 10px;
  justify-content: space-between;
  align-items: center;
  gap: 6px;
}

@media (min-width: 768px) {
  .thumb-bar {
    display: none;
  }
}

.thumb-btn {
  flex: 1;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: rgba(255, 255, 255, 0.86);
  font-size: 0.72rem;
  font-weight: 600;
  text-decoration: none;
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px 6px;
  border-radius: 10px;
  white-space: nowrap;
}

.thumb-btn-primary {
  flex: 1.4;
  background: var(--accent-fire);
  color: var(--btn-primary-text);
  font-weight: 800;
  border-radius: 12px;
  padding: 10px 12px;
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

  // 2. Motor Horizontal Scrollytelling 60fps (lerp + GPU translate3d)
  const scrollySection = document.getElementById('recorrido');
  const scrollyViewport = document.getElementById('scrolly-viewport');
  const scrollyTrack = document.getElementById('scrolly-track');
  const scrollyProgress = document.getElementById('scrolly-progress-bar');
  const scrollyStepBadge = document.getElementById('scrolly-step');
  const scrollyPills = document.querySelectorAll('[data-scrolly-pill]');
  const scrollyPrevBtn = document.getElementById('scrolly-prev');
  const scrollyNextBtn = document.getElementById('scrolly-next');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (scrollySection && scrollyViewport && scrollyTrack && scrollyPills.length > 0) {
    const totalPanels = scrollyPills.length;
    let maxTranslate = 0;
    let currentProgress = 0;
    let targetProgress = 0;
    let activeIdx = 0;

    const measure = () => {
      maxTranslate = Math.max(0, scrollyTrack.scrollWidth - scrollyViewport.clientWidth);
    };

    const setActiveUi = (idx, progress) => {
      activeIdx = idx;
      if (scrollyStepBadge) {
        const label = String(idx + 1).padStart(2, '0');
        const total = String(totalPanels).padStart(2, '0');
        scrollyStepBadge.textContent = label + ' / ' + total;
      }
      scrollyPills.forEach((pill, i) => {
        pill.classList.toggle('active', i === idx);
      });
      if (scrollyProgress) {
        const base = 1 / totalPanels;
        const scale = Math.min(1, Math.max(base, base + progress * (1 - base)));
        scrollyProgress.style.transform = 'scaleX(' + scale.toFixed(4) + ')';
      }
    };

    const scrollToPanel = (index) => {
      const clamped = Math.max(0, Math.min(totalPanels - 1, index));
      if (reducedMotion) {
        const cards = scrollyTrack.querySelectorAll('.scrolly-panel-card');
        if (cards[clamped]) cards[clamped].scrollIntoView({ behavior: 'smooth', inline: 'center' });
        setActiveUi(clamped, totalPanels > 1 ? clamped / (totalPanels - 1) : 0);
        return;
      }
      const totalScrollable = scrollySection.offsetHeight - window.innerHeight;
      const ratio = totalPanels > 1 ? clamped / (totalPanels - 1) : 0;
      const sectionTop = scrollySection.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({
        top: sectionTop + ratio * Math.max(0, totalScrollable),
        behavior: 'smooth',
      });
    };

    scrollyPills.forEach((pill, idx) => {
      pill.addEventListener('click', () => scrollToPanel(idx));
    });
    if (scrollyPrevBtn) {
      scrollyPrevBtn.addEventListener('click', () => scrollToPanel(activeIdx - 1));
    }
    if (scrollyNextBtn) {
      scrollyNextBtn.addEventListener('click', () => scrollToPanel(activeIdx + 1));
    }

    if (!reducedMotion) {
      const updateTarget = () => {
        const rect = scrollySection.getBoundingClientRect();
        const totalScrollable = scrollySection.offsetHeight - window.innerHeight;
        if (totalScrollable <= 0) {
          targetProgress = 0;
          return;
        }
        targetProgress = Math.min(Math.max(-rect.top / totalScrollable, 0), 1);
      };

      const tickScrolly = () => {
        currentProgress += (targetProgress - currentProgress) * 0.1;
        if (Math.abs(targetProgress - currentProgress) < 0.0005) {
          currentProgress = targetProgress;
        }
        const tx = currentProgress * maxTranslate;
        scrollyTrack.style.transform = 'translate3d(-' + tx.toFixed(2) + 'px, 0, 0)';
        const nextIdx = totalPanels > 1
          ? Math.min(totalPanels - 1, Math.max(0, Math.round(currentProgress * (totalPanels - 1))))
          : 0;
        setActiveUi(nextIdx, currentProgress);
        requestAnimationFrame(tickScrolly);
      };

      measure();
      updateTarget();
      window.addEventListener('resize', () => { measure(); updateTarget(); });
      window.addEventListener('scroll', updateTarget, { passive: true });
      requestAnimationFrame(tickScrolly);
    }
  }

  // 3. Modal de Reserva WhatsApp & Bloque Inline
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

  const restaurantName = "${tenant.name.replace(/"/g, '\\"')}";
  const whatsappNumber = "${cleanWaNumber}";

  function openWhatsAppWithFields({ name, diners, shift, time, zone, notes }) {
    let msg = \`Hola \${restaurantName}, me gustaría solicitar mesa / consulta:\` + '\\n';
    msg += \`• A nombre de: \${name || 'Cliente'}\` + '\\n';
    msg += \`• Turno y Hora: \${shift || 'Tarde / Noche'} a las \${time || '20:30'} hs\` + '\\n';
    msg += \`• Personas: \${diners || '2'}\` + '\\n';
    msg += \`• Espacio deseado: \${zone || 'Terraza Exterior'}\` + '\\n';
    if (notes && notes.trim()) {
      msg += \`• Notas / Alérgenos: \${notes.trim()}\` + '\\n';
    }
    msg += '\\n¿Tienen disponibilidad? Muchas gracias.';
    const url = \`https://wa.me/\${whatsappNumber}?text=\${encodeURIComponent(msg)}\`;
    window.open(url, '_blank');
    return msg;
  }

  const sendBtn = document.getElementById('send-whatsapp-btn');
  const copyBtn = document.getElementById('copy-whatsapp-btn');
  if (sendBtn) {
    sendBtn.addEventListener('click', () => {
      openWhatsAppWithFields({
        name: document.getElementById('res-name')?.value,
        diners: document.getElementById('res-diners')?.value,
        shift: document.getElementById('res-shift')?.value,
        time: document.getElementById('res-time')?.value,
        zone: document.getElementById('res-zone')?.value,
        notes: document.getElementById('res-notes')?.value,
      });
    });
  }

  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      const name = document.getElementById('res-name')?.value || 'Cliente';
      const diners = document.getElementById('res-diners')?.value || '2';
      const shift = document.getElementById('res-shift')?.value || 'Cena';
      const time = document.getElementById('res-time')?.value || '21:30';
      const zone = document.getElementById('res-zone')?.value || 'Terraza Exterior';
      const notes = document.getElementById('res-notes')?.value || '';
      const text = \`Hola \${restaurantName}, solicitud para \${diners} personas (\${zone}) a las \${time} (\${shift}) a nombre de \${name}. \${notes}\`;
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

  const inlineWaBtn = document.getElementById('inline-wa-send-btn');
  if (inlineWaBtn) {
    inlineWaBtn.addEventListener('click', () => {
      openWhatsAppWithFields({
        name: document.getElementById('inline-wa-name')?.value,
        diners: document.getElementById('inline-wa-diners')?.value,
        shift: 'Reserva directa',
        time: document.getElementById('inline-wa-time')?.value,
        zone: document.getElementById('inline-wa-zone')?.value,
        notes: '',
      });
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

  // 5. Canvas de Fondo Cinemático (Micro-loop de partículas a 60 fps)
  const canvas = document.getElementById('hero-canvas');
  if (canvas && !reducedMotion) {
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
    }));

    function loop() {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = '${isUrbanBrewery ? 'rgba(245, 158, 11, 0.35)' : 'rgba(200, 90, 50, 0.4)'}';
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
  const googleFontsHref =
    'https://fonts.googleapis.com/css2?family=Anton&family=DM+Sans:ital,opsz,wght@0,9..40,400..700;1,9..40,400..700&family=Instrument+Sans:ital,wght@0,400..700;1,400..700&family=Instrument+Serif:ital@0;1&family=Inter:wght@400..700&family=Sora:wght@400..800&display=swap'

  const indexHtml = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(tenant.name)} · ${escapeHtml(tenant.tagline)}</title>
  <meta name="description" content="Web oficial de ${escapeHtml(tenant.name)} en ${escapeHtml(tenant.city)}. Carta, horarios y reserva directa sin comisiones.">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="${googleFontsHref}" rel="stylesheet">
  <link rel="stylesheet" href="styles.css">
  <script type="application/ld+json">
${JSON.stringify(jsonLd, null, 2)}
  </script>
</head>
<body>

  <!-- CABECERA -->
  <header class="site-header">
    <div class="header-inner">
      <div class="brand-group">
        <a href="index.html" class="brand-link">
          ${tenant.logoUrl ? `<span class="brand-logo-wrap"><img src="${resolveImg(tenant.logoUrl)}" alt="${escapeHtml(tenant.name)}"></span>` : ''}
          <span>${escapeHtml(tenant.name)}</span>
          <span class="brand-dot"></span>
        </a>
        <span class="live-badge tabular-nums">
          <span class="live-dot ${todayStatus.isOpen ? 'open' : 'closed'}"></span>
          <span>${escapeHtml(todayStatus.label)}</span>
        </span>
      </div>
      <nav class="nav-links">
        <a href="carta.html" class="nav-link">Carta &amp; Precios</a>
        ${scrollyPanels.length > 0 ? '<a href="#recorrido" class="nav-link">Recorrido</a>' : ''}
        <a href="#ambientes" class="nav-link">Espacios</a>
        <a href="#horarios" class="nav-link">Horarios</a>
        <a href="carta.html" class="btn-primary">Ver Carta y Precios</a>
      </nav>
    </div>
  </header>

  <!-- HERO CINEMÁTICO 60FPS -->
  <section class="hero-section">
    <canvas id="hero-canvas" style="position: absolute; inset: 0; pointer-events: none; z-index: 1;"></canvas>
    <img src="${resolveImg(tenant.heroImagePoster)}" alt="${escapeHtml(tenant.name)}" class="hero-poster" fetchpriority="high">
    <div class="hero-overlay"></div>
    <div class="hero-content">
      ${tenant.logoUrl ? `<div class="hero-logo-wrap"><img src="${resolveImg(tenant.logoUrl)}" alt="${escapeHtml(tenant.name)}"></div>` : ''}
      <div class="hero-badge">
        <span>${escapeHtml(tenant.address)} · ${escapeHtml(tenant.city)}</span>
        <span>•</span>
        <span class="tabular-nums" style="color: ${todayStatus.isOpen ? '#22C55E' : '#F59E0B'};">● ${escapeHtml(todayStatus.label)} · ${escapeHtml(todayStatus.subLabel)}</span>
        ${tenant.googleMapsRating ? `<span>•</span><span class="tabular-nums">★ ${tenant.googleMapsRating.toFixed(1)} (${tenant.googleMapsReviewCount || 0})</span>` : ''}
      </div>
      <h1 class="hero-title">${escapeHtml(tenant.name.split(' ')[0])} <em style="color: var(--accent-fire); font-style: normal;">${escapeHtml(tenant.name.split(' ').slice(1).join(' '))}</em></h1>
      <p class="hero-desc">${escapeHtml(tenant.tagline)}</p>
      <div class="hero-actions">
        <a href="carta.html" class="btn-primary">Ver Carta y Precios</a>
        <a href="${escapeHtml(tenant.googleMapsUrl || '#horarios')}" target="_blank" rel="noopener noreferrer" class="btn-secondary">📍 Cómo Llegar</a>
        <button class="btn-secondary" data-open-reservation>${isUrbanBrewery ? 'Terraza / Grupos' : 'Reservar Mesa'}</button>
      </div>
    </div>
  </section>

  <!-- 4 PRODUCTOS INSIGNIA (PORTADA ASPIRACIONAL SIN PRECIOS EN HOME - DEC-39) -->
  <section class="section-wrapper">
    <div class="section-title-wrap">
      <span class="section-tag">Imprescindibles de la Casa · Portada</span>
      <h2 class="section-title">${isUrbanBrewery ? 'Cerveza de Bodega, Vinos &amp; Raciones' : 'Selección de la Casa'}</h2>
    </div>
    <div class="signature-grid ${signatureDishes.length === 4 ? 'signature-grid-4' : ''}">
      ${signatureDishes.map(sig => `
      <a href="carta.html" class="signature-card">
        <div class="signature-thumb-wrap">
          <img src="${resolveImg(sig.image)}" alt="${escapeHtml(sig.name)}" loading="lazy">
        </div>
        <div>
          <span style="font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.2em; color: var(--accent-fire); font-weight: 700;">${escapeHtml(sig.category)}</span>
          <h3 style="font-family: var(--font-display); font-size: 1.4rem; margin-top: 6px; line-height: 1.15;">${escapeHtml(sig.name)}</h3>
          <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 8px; line-height: 1.5;">${escapeHtml(sig.description)}</p>
          ${sig.variants && sig.variants.length > 0 ? `<div style="margin-top: 12px; display: flex; flex-wrap: wrap; gap: 6px; justify-content: center;">${sig.variants.map(v => `<span class="variant-pill">${escapeHtml(v.name)}</span>`).join('')}</div>` : ''}
        </div>
      </a>
      `).join('')}
    </div>
    <div style="text-align: center; margin-top: 44px;">
      <a href="carta.html" class="btn-primary">Ver Carta Completa con Precios</a>
    </div>
  </section>

  ${scrollyPanels.length > 0 ? `
  <!-- RECORRIDO VISUAL HORIZONTAL (SCROLLYTELLING) -->
  <section id="recorrido" class="scrolly-section" aria-label="Recorrido visual por capítulos">
    <div class="scrolly-sticky">
      <div class="scrolly-header">
        <div class="scrolly-header-top">
          <div>
            <span class="section-tag" style="margin-bottom: 4px;">${isUrbanBrewery ? 'Tradición Cervecera &amp; Soportales de Piedra' : 'Técnica &amp; Oficio'}</span>
            <h2 class="section-title" style="font-size: clamp(1.5rem, 3.2vw, 2.35rem);">${escapeHtml(tenant.historyTitle || 'Técnica, Producto & Memoria')}</h2>
          </div>
          <div class="scrolly-controls">
            <span id="scrolly-step" class="scrolly-step-badge tabular-nums">01 / ${String(scrollyPanels.length).padStart(2, '0')}</span>
            ${scrollyPanels.map((panel, idx) => `<button type="button" class="scrolly-pill tabular-nums ${idx === 0 ? 'active' : ''}" data-scrolly-pill="${idx}">${escapeHtml(panel.number)}</button>`).join('')}
            <button type="button" id="scrolly-prev" class="scrolly-nav-btn" aria-label="Capítulo anterior">‹</button>
            <button type="button" id="scrolly-next" class="scrolly-nav-btn" aria-label="Siguiente capítulo">›</button>
          </div>
        </div>
        <div class="scrolly-progress-track">
          <div id="scrolly-progress-bar" class="scrolly-progress-fill"></div>
        </div>
      </div>

      <div id="scrolly-viewport" class="scrolly-viewport">
        <div id="scrolly-track" class="scrolly-track">
          ${scrollyPanels.map(panel => `
          <article class="scrolly-panel-card">
            <span class="scrolly-watermark tabular-nums">${escapeHtml(panel.number)}</span>
            <div class="scrolly-media">
              <img src="${resolveImg(panel.image)}" alt="${escapeHtml(panel.title)}" loading="lazy">
            </div>
            <div class="scrolly-body">
              <span class="scrolly-tag">${escapeHtml(panel.tag)}</span>
              <h3 class="scrolly-title">${escapeHtml(panel.title)}</h3>
              <p class="scrolly-desc">${escapeHtml(panel.description)}</p>
            </div>
          </article>
          `).join('')}
        </div>
      </div>
    </div>
  </section>
  ` : ''}

  <!-- ESPACIOS DEL LOCAL & LUZ -->
  ${tenant.ambiences.length > 0 ? `
  <section id="ambientes" class="section-wrapper section-divider">
    <div class="section-title-wrap">
      <span class="section-tag">Espacios &amp; Luz</span>
      <h2 class="section-title">Elige tu Espacio en ${escapeHtml(tenant.name)}</h2>
      <div class="light-toggle-group">
        <button type="button" class="light-toggle-btn active" data-light-mode="day">Mediodía (13:30h)</button>
        <button type="button" class="light-toggle-btn" data-light-mode="night">Noche (21:30h)</button>
      </div>
    </div>
    <div class="${spaceGridClass}">
      ${tenant.ambiences.map(amb => `
      <div class="ambience-card">
        <div>
          <img src="${resolveImg(amb.imageDay)}" alt="${escapeHtml(amb.name)}" class="ambience-img" data-amb-img data-img-day="${resolveImg(amb.imageDay)}" data-img-night="${resolveImg(amb.imageNight)}">
          <div class="ambience-body">
            <h3 class="ambience-name">${escapeHtml(amb.name)}</h3>
            <span class="ambience-subtitle">${escapeHtml(amb.subtitle)}</span>
            <p class="ambience-desc">${escapeHtml(amb.desc)}</p>
            <p style="margin-top: 12px; font-size: 0.78rem; color: var(--accent-fire); font-weight: 600;" data-amb-note data-note-day="${escapeHtml(amb.lightingNoteDay)}" data-note-night="${escapeHtml(amb.lightingNoteNight)}">
              ${escapeHtml(amb.lightingNoteDay)}
            </p>
          </div>
        </div>
        <div style="padding: 0 24px 24px;">
          <button type="button" class="btn-primary" style="width: 100%; justify-content: center;" data-open-reservation data-zone="${escapeHtml(amb.name)}">
            Reservar en ${escapeHtml(amb.name)}
          </button>
        </div>
      </div>
      `).join('')}
    </div>
  </section>
  ` : ''}

  <!-- CONVERSIÓN DIRECTA TERRAZA / SALÓN / GRUPOS POR WHATSAPP -->
  <section class="section-wrapper section-divider" style="padding-top: 56px; padding-bottom: 56px;">
    <div class="inline-wa-card">
      <div>
        <span class="section-tag">Reserva Directa sin Comisiones</span>
        <h2 class="section-title" style="font-size: clamp(1.75rem, 3.2vw, 2.4rem);">Reserva tu mesa en Terraza o Salón / Consulta para grupos por WhatsApp</h2>
        <p style="margin-top: 12px; font-size: 0.92rem; color: var(--text-muted); line-height: 1.6;">
          Selecciona tu zona preferida, número de personas y horario estimado para abrir conversación directa con nuestro equipo de sala.
        </p>
      </div>
      <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px;">
        <div>
          <label for="inline-wa-zone" style="display: block; font-size: 0.72rem; font-weight: 700; text-transform: uppercase; margin-bottom: 4px; color: var(--text-muted);">Zona</label>
          <select id="inline-wa-zone" class="wa-input">
            ${tenant.ambiences.map(a => `<option value="${escapeHtml(a.name)}">${escapeHtml(a.name)}</option>`).join('')}
            <option value="Grupos">Grupos</option>
          </select>
        </div>
        <div>
          <label for="inline-wa-diners" style="display: block; font-size: 0.72rem; font-weight: 700; text-transform: uppercase; margin-bottom: 4px; color: var(--text-muted);">Personas</label>
          <select id="inline-wa-diners" class="wa-input tabular-nums">
            <option value="2">2 personas</option>
            <option value="4">4 personas</option>
            <option value="6">6 personas</option>
            <option value="8+">8+ personas (Grupos)</option>
          </select>
        </div>
        <div>
          <label for="inline-wa-time" style="display: block; font-size: 0.72rem; font-weight: 700; text-transform: uppercase; margin-bottom: 4px; color: var(--text-muted);">Hora</label>
          <select id="inline-wa-time" class="wa-input tabular-nums">
            <option value="13:30">13:30h (Mediodía)</option>
            <option value="20:30" selected>20:30h (Tarde / Noche)</option>
            <option value="22:00">22:00h (Noche)</option>
          </select>
        </div>
        <div>
          <label for="inline-wa-name" style="display: block; font-size: 0.72rem; font-weight: 700; text-transform: uppercase; margin-bottom: 4px; color: var(--text-muted);">Nombre</label>
          <input id="inline-wa-name" type="text" placeholder="Tu nombre" class="wa-input">
        </div>
        <div style="grid-column: span 2; margin-top: 4px;">
          <button type="button" id="inline-wa-send-btn" class="btn-primary" style="width: 100%; justify-content: center; padding: 13px 20px; background: #25D366; color: #052E16; font-weight: 800;">
            Enviar Consulta Directa por WhatsApp
          </button>
        </div>
      </div>
    </div>
  </section>

  <!-- PRUEBA SOCIAL / RESEÑAS -->
  ${tenant.reviews && tenant.reviews.length > 0 ? `
  <section class="section-wrapper section-divider">
    <div class="section-title-wrap">
      <span class="section-tag">Opiniones Reales</span>
      <h2 class="section-title">Clientes en Google Maps</h2>
    </div>
    <div class="reviews-grid">
      ${tenant.reviews.map(rev => `
      <div class="review-card">
        <div class="review-text">"${escapeHtml(rev.text)}"</div>
        <div style="display: flex; justify-content: space-between; font-size: 0.8rem; font-weight: 600;">
          <span>${escapeHtml(rev.author)}</span>
          <span style="color: #10B981;">✔ Visita Verificada</span>
        </div>
      </div>
      `).join('')}
    </div>
  </section>
  ` : ''}

  <!-- HORARIOS & CONTACTO -->
  <section id="horarios" class="section-wrapper section-divider">
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(290px, 1fr)); gap: 40px; align-items: start;">
      <div>
        <span class="section-tag">Ubicación &amp; Contacto</span>
        <h2 class="section-title">Ven a Conocernos</h2>
        <p style="margin-top: 16px; font-size: 1rem; color: var(--text-muted); line-height: 1.6;">
          ${escapeHtml(tenant.address)}, ${escapeHtml(tenant.postalCode)} ${escapeHtml(tenant.city)}.
        </p>
        <p style="margin-top: 8px; font-size: 1rem; font-weight: 600;" class="tabular-nums">
          Teléfono: <a href="tel:${escapeHtml(cleanPhoneHref)}" style="color: var(--text-ink);">${escapeHtml(tenant.phone)}</a>
        </p>
        <div style="margin-top: 24px; display: flex; gap: 12px; flex-wrap: wrap;">
          <a href="${escapeHtml(tenant.googleMapsUrl || '#')}" target="_blank" rel="noopener noreferrer" class="btn-primary">Ver en Google Maps</a>
          <a href="carta.html" class="btn-secondary" style="color: var(--text-ink); border-color: var(--border-subtle);">Ver Carta Completa</a>
        </div>
      </div>
      <div class="info-card">
        <h3 style="font-family: var(--font-display); font-size: 1.5rem; margin-bottom: 16px;">Horarios de Servicio</h3>
        <ul style="list-style: none; font-size: 0.85rem; line-height: 2.1;" class="tabular-nums">
          ${tenant.openingHours.map(h => `
          <li style="display: flex; justify-content: space-between; border-bottom: 1px solid var(--border-subtle); gap: 12px;">
            <span>${dayNames[h.dayOfWeek] || 'Día'} (${escapeHtml(h.label || 'Servicio')}):</span>
            <strong>${escapeHtml(h.open)} - ${escapeHtml(h.close)}</strong>
          </li>
          `).join('')}
        </ul>
      </div>
    </div>
  </section>

  <!-- FAQS -->
  <section class="section-wrapper section-divider" style="max-width: 820px;">
    <div class="section-title-wrap">
      <span class="section-tag">Dudas Frecuentes</span>
      <h2 class="section-title">Preguntas sobre Reservas</h2>
    </div>
    <div style="display: flex; flex-direction: column; gap: 16px;">
      <div class="info-card" style="padding: 20px; border-radius: 16px;">
        <div data-faq-toggle style="font-weight: 700; cursor: pointer; display: flex; justify-content: space-between;">
          <span>1. ¿Cómo se confirma mi reserva?</span>
          <span class="faq-icon">▼</span>
        </div>
        <p style="display: none; margin-top: 12px; font-size: 0.85rem; color: var(--text-muted); line-height: 1.6;">
          Al enviar la solicitud se abre WhatsApp directamente con el equipo del local. Confirmamos en pocos minutos según disponibilidad.
        </p>
      </div>
      <div class="info-card" style="padding: 20px; border-radius: 16px;">
        <div data-faq-toggle style="font-weight: 700; cursor: pointer; display: flex; justify-content: space-between;">
          <span>2. ¿Qué margen de cortesía tienen?</span>
          <span class="faq-icon">▼</span>
        </div>
        <p style="display: none; margin-top: 12px; font-size: 0.85rem; color: var(--text-muted); line-height: 1.6;">
          Mantenemos tu mesa guardada durante 15 minutos de cortesía. Si te retrasas por tráfico, avísanos por WhatsApp.
        </p>
      </div>
      <div class="info-card" style="padding: 20px; border-radius: 16px;">
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
  <footer style="background: var(--bg-dark); color: #E6DFD3; padding: 56px 24px; text-align: center; border-top: 1px solid var(--border-subtle);">
    <div style="max-width: 1200px; margin: 0 auto; display: flex; flex-direction: column; align-items: center; gap: 14px;">
      ${tenant.logoUrl ? `<div class="brand-logo-wrap" style="width: 54px; height: 54px;"><img src="${resolveImg(tenant.logoUrl)}" alt="${escapeHtml(tenant.name)}"></div>` : ''}
      <h3 style="font-family: var(--font-display); font-size: 1.75rem; color: #fff;">${escapeHtml(tenant.name)}</h3>
      <p style="font-size: 0.85rem; color: rgba(255,255,255,0.65);">${escapeHtml(tenant.address)}, ${escapeHtml(tenant.postalCode)} ${escapeHtml(tenant.city)}</p>
      <p style="font-size: 0.75rem; color: rgba(255,255,255,0.45);">© ${new Date().getFullYear()} ${escapeHtml(tenant.name)}. Desarrollado con tecnología FLUXO.</p>
    </div>
  </footer>

  <!-- MOBILE THUMB BAR -->
  <aside class="thumb-bar">
    <a href="carta.html" class="thumb-btn thumb-btn-primary">📖 Ver Carta</a>
    <a href="${escapeHtml(tenant.googleMapsUrl || '#horarios')}" target="_blank" rel="noopener noreferrer" class="thumb-btn" style="background: rgba(255,255,255,0.12);">📍 Llegar</a>
    <a href="tel:${escapeHtml(cleanPhoneHref)}" class="thumb-btn">📞 Llamar</a>
    <button type="button" class="thumb-btn" data-open-reservation>📅 Grupos</button>
  </aside>

  <!-- MODAL RESERVA WHATSAPP -->
  <div id="reservation-modal" class="modal-overlay">
    <div class="modal-box">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h3 style="font-family: var(--font-display); font-size: 1.5rem;">${isUrbanBrewery ? 'Reserva en Terraza o Salón / Grupos' : 'Solicitud de Reserva'}</h3>
        <button type="button" id="close-reservation-btn" style="background: none; border: none; color: var(--text-ink); font-size: 1.5rem; cursor: pointer;">✕</button>
      </div>
      <div style="display: flex; flex-direction: column; gap: 14px;">
        <div>
          <label for="res-name" style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase;">Nombre de Contacto</label>
          <input type="text" id="res-name" placeholder="Tu nombre" class="wa-input" style="margin-top: 4px;">
        </div>
        <div>
          <label for="res-diners" style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase;">Personas</label>
          <select id="res-diners" class="wa-input tabular-nums" style="margin-top: 4px;">
            <option value="1">1 Persona</option>
            <option value="2" selected>2 Personas</option>
            <option value="4">4 Personas</option>
            <option value="6">6 Personas</option>
            <option value="8+">8+ Personas (Grupos)</option>
          </select>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
          <div>
            <label for="res-shift" style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase;">Turno</label>
            <select id="res-shift" class="wa-input" style="margin-top: 4px;">
              <option value="Mediodía">Mediodía</option>
              <option value="Tarde y Picoteo">Tarde y Picoteo</option>
              <option value="Cena" selected>Cena / Noche</option>
            </select>
          </div>
          <div>
            <label for="res-time" style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase;">Hora</label>
            <input type="text" id="res-time" value="21:30" class="wa-input tabular-nums" style="margin-top: 4px;">
          </div>
        </div>
        <div>
          <label for="res-zone" style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase;">Zona del Local</label>
          <select id="res-zone" class="wa-input" style="margin-top: 4px;">
            ${tenant.ambiences.map(a => `<option value="${escapeHtml(a.name)}">${escapeHtml(a.name)}</option>`).join('')}
            <option value="Grupos">Grupos</option>
          </select>
        </div>
        <div>
          <label for="res-notes" style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase;">Alérgenos / Notas</label>
          <input type="text" id="res-notes" placeholder="Ej. 1 persona celíaca, mesa bajo soportales..." class="wa-input" style="margin-top: 4px;">
        </div>
        <button type="button" id="send-whatsapp-btn" class="btn-primary" style="width: 100%; justify-content: center; padding: 14px; background: #25D366; color: #052E16; font-weight: 800;">
          Enviar Solicitud por WhatsApp
        </button>
        <button type="button" id="copy-whatsapp-btn" class="btn-secondary" style="width: 100%; justify-content: center; padding: 10px; color: var(--text-ink); border-color: var(--border-subtle);">
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
  <title>Carta Oficial · ${escapeHtml(tenant.name)}</title>
  <meta name="description" content="${isUrbanBrewery ? `Carta oficial, cervezas de bodega, tapas y alérgenos de ${escapeHtml(tenant.name)}.` : `Carta y precios oficiales de ${escapeHtml(tenant.name)}. Desglose de alérgenos y productos de lonja.`}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="${googleFontsHref}" rel="stylesheet">
  <link rel="stylesheet" href="styles.css">
  <style>
    .menu-header {
      padding: 120px 24px 48px;
      text-align: center;
      background: var(--bg-card-subtle);
      border-bottom: 1px solid var(--border-subtle);
    }
    .menu-container {
      max-width: 1000px;
      margin: 0 auto;
      padding: 40px 24px;
    }
    .menu-search-wrap {
      max-width: 440px;
      margin: 0 auto 24px;
    }
    .menu-filter-bar {
      margin-bottom: 32px;
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      justify-content: center;
    }
    .filter-btn {
      padding: 8px 18px;
      border-radius: 9999px;
      background: var(--bg-card);
      color: var(--text-ink);
      border: 1px solid var(--border-subtle);
      cursor: pointer;
      font-size: 0.8rem;
      font-weight: 600;
      transition: all 0.2s ease;
    }
    .filter-btn.active {
      background: var(--accent-fire);
      color: var(--btn-primary-text);
      border-color: var(--accent-fire);
    }
    .dish-card {
      display: flex;
      gap: 20px;
      background: var(--bg-card);
      color: var(--text-ink);
      padding: 20px;
      border-radius: 20px;
      border: 1px solid var(--border-subtle);
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
      font-family: var(--font-display);
      font-size: 1.25rem;
      font-weight: ${isUrbanBrewery ? '400' : '700'};
    }
    .dish-price {
      font-family: var(--font-mono);
      font-variant-numeric: tabular-nums;
      font-weight: 700;
      color: var(--accent-fire);
      font-size: 1.1rem;
      white-space: nowrap;
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
      padding: 3px 8px;
      background: var(--bg-card-subtle);
      border: 1px solid var(--border-subtle);
      color: var(--text-muted);
      border-radius: 6px;
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
        ${tenant.logoUrl ? `<span class="brand-logo-wrap"><img src="${resolveImg(tenant.logoUrl)}" alt="${escapeHtml(tenant.name)}"></span>` : ''}
        <span>${escapeHtml(tenant.name)}</span>
        <span class="brand-dot"></span>
      </a>
      <a href="index.html" class="btn-secondary">Volver al Inicio</a>
    </div>
  </header>

  <!-- HERO DE CARTA -->
  <div class="menu-header">
    <span class="section-tag">Catálogo Digital Oficial</span>
    <h1 style="font-family: var(--font-display); font-size: clamp(2.2rem, 5vw, 3rem);">Carta Oficial &amp; Precios</h1>
    <p style="color: var(--text-muted); margin-top: 8px;">
      ${isUrbanBrewery
        ? 'Precios con IVA incluido · Información de alérgenos conforme al Reglamento UE 1169/2011'
        : 'Precios con IVA incluido · Pescado de lonja sujeto a disponibilidad de bajura'}
    </p>
  </div>

  <!-- CONTENEDOR DE PLATOS -->
  <main class="menu-container">
    <div class="menu-search-wrap">
      <input id="menu-search-input" type="search" placeholder="Buscar cerveza, vino, tapa o alérgeno..." class="wa-input" oninput="applyMenuFilters()">
    </div>

    <div class="menu-filter-bar">
      <button type="button" class="filter-btn active" onclick="filterMenu('Todos')">Todos</button>
      ${Array.from(new Set(tenant.dishes.map(d => d.category))).map(cat => `
      <button type="button" class="filter-btn" onclick="filterMenu('${escapeHtml(cat)}')">${escapeHtml(cat)}</button>
      `).join('')}
    </div>

    <div id="dish-list">
      ${tenant.dishes.map(d => `
      <div class="dish-card" data-category="${escapeHtml(d.category)}" data-search="${escapeHtml((d.name + ' ' + d.description + ' ' + d.category).toLowerCase())}">
        <img src="${resolveImg(d.image)}" alt="${escapeHtml(d.name)}" class="dish-thumb">
        <div class="dish-info">
          <div class="dish-head">
            <h3 class="dish-name">${escapeHtml(d.name)}</h3>
            <span class="dish-price tabular-nums">${d.price.toFixed(2)} €</span>
          </div>
          <p class="dish-desc">${escapeHtml(d.description)}</p>
          ${d.variants && d.variants.length > 0 ? `
          <div style="margin-top: 8px; display: flex; flex-wrap: wrap; gap: 6px;">
            ${d.variants.map(v => `<span class="tabular-nums" style="font-size: 0.72rem; padding: 3px 10px; border-radius: 8px; background: rgba(245,158,11,0.14); color: var(--text-ink);"><span>${escapeHtml(v.name)}:</span> <strong style="color: var(--accent-fire);">${v.price.toFixed(2)} €</strong></span>`).join('')}
          </div>
          ` : ''}
          ${d.allergens && d.allergens.length > 0 ? `
          <div>
            ${d.allergens.map(a => `<span class="allergen-tag">⚠️ ${escapeHtml(a)}</span>`).join('')}
          </div>
          ` : ''}
        </div>
      </div>
      `).join('')}
    </div>

    <div style="text-align: center; margin-top: 48px;">
      <a href="index.html#horarios" class="btn-primary">Reservar Mesa o Ver Horarios</a>
    </div>
  </main>

  <script>
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
  fs.writeFileSync(path.join(siteDir, 'carta.html'), cartaHtml, 'utf8')

  console.log(`✔ Archivos estáticos generados en: out/sites/${tenant.slug}/`)
  console.log('  - index.html (Home Cinemática a 60fps)')
  console.log('  - carta.html (Catálogo Digital Plan Carta)')
  console.log('  - styles.css (Sistema Editorial Multi-Arquetipo)')
  console.log('  - script.js  (Interactividad Vanilla 60fps)')
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
