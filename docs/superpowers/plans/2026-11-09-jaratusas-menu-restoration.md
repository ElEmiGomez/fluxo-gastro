# Bar Jara-Tusas Menu Restoration & Visual Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore Bar Jara-Tusas digital menu (`/p/bar-jaratusas` and `/carta-jaratusas`) to the exact visual sister-twin design of the General Prototype and Casa Mar da Vila, featuring mobile-first curated layout, 4:3 high-res food photography, interactive variant pills with dynamic pricing, persistent table/zone badge, fast-pay banner, and order summary drawer.

**Architecture:** Build `public/jaratusas.html` with full structural, aesthetic, and functional parity with `public/casamar-da-vila.html` and `public/template-carta.html`. Enhance the product card component with clickable variant pills that immediately update card price and cart additions. Ensure query parameters (`?mesa=` and `?zona=`) dynamically hydrate the header badge and fast-pay banner.

**Tech Stack:** Next.js 14, Tailwind CSS, HTML5, Vanilla ES6+ in iframe standalone view, Lucide SVG icons.

**Spec:** User instruction dated 2026-11-09 requesting strict restoration of visual parity with Prototype General and Casa Mar da Vila, culinary photography, interactive pills, and field operations features.

## Global Constraints
- Zero customer authentication or login systems.
- Exact visual sister twin of `public/casamar-da-vila.html` and `public/template-carta.html` (light mode `bg-slate-50/70`, Slate-200 borders, Blue-700 accents, 4:3 image cards, sticky category bar, bottom drawer).
- No regressions on `/carta-prototipo` or `/carta-casamar`.
- Zero errors on `npx.cmd tsc --noEmit`.

---

### Task 1: Audit and Template Parity Architecture
**Files:**
- Read: `public/template-carta.html`
- Read: `public/casamar-da-vila.html`
- Modify: `public/jaratusas.html`

- [ ] **Step 1: Inspect template-carta.html and casamar-da-vila.html styling and DOM hierarchy**
- [ ] **Step 2: Define Bar Jara-Tusas catalog with full photography mapping, categories, and variant pricing**

---

### Task 2: Build `public/jaratusas.html` with Full Visual Parity & Photography
**Files:**
- Overwrite: `public/jaratusas.html`

- [ ] **Step 1: Construct the HTML structure cloning casamar-da-vila.html (fonts, head, header, hero card with jaratusas-logo.png, search, filters, category slider)**
- [ ] **Step 2: Implement dynamic query parameter detection for `?mesa=` and `?zona=` with fallback to '12' and 'Terraza'**
- [ ] **Step 3: Insert the Fast-Pay alert banner right under the sticky header**
- [ ] **Step 4: Map all 13 Bar Jara-Tusas products with authentic 4:3 culinary photos and EU allergens**

---

### Task 3: Implement Interactive Variant Pills with Real-Time Dynamic Pricing
**Files:**
- Modify: `public/jaratusas.html`

- [ ] **Step 1: In `renderCatalog()`, render interactive pill buttons for products with variants**
- [ ] **Step 2: Add `selectVariant(productId, variantIndex, event)` to toggle active pill, update displayed price, and set active variant**
- [ ] **Step 3: Update `addToCart` to record the selected variant name and price in the order drawer**
- [ ] **Step 4: Update product modal to support selecting variants and updating price**

---

### Task 4: Integrate Drawer "Modo Enseñar al Camarero" & Sold Out Filter
**Files:**
- Modify: `public/jaratusas.html`

- [ ] **Step 1: Ensure bottom floating bar shows total items and price**
- [ ] **Step 2: Ensure order drawer displays table number in large badge with prompt: "Muestra esta pantalla al camarero para agilizar el servicio en terraza"**
- [ ] **Step 3: Include availability toggle ("Agotado hoy") and filter**

---

### Task 5: Routing, TypeScript & End-to-End Verification
**Files:**
- Verify: `src/app/p/[slug]/page.tsx`
- Verify: `src/app/carta-jaratusas/route.ts`
- Verify: `src/app/jaratusas/route.ts`

- [ ] **Step 1: Run `npx.cmd tsc --noEmit` and ensure 0 errors**
- [ ] **Step 2: Verify HTTP response of `/carta-jaratusas` and visual rendering via curl or headless browser**
- [ ] **Step 3: Commit and push changes to repository**
