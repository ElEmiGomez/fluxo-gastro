# Bar Jara-Tusas "Cauce" Editorial Multi-Video Rebuild Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `swarm` / parallel execution with strictly disjoint file ownership and verify via `qa-verifier` before completion.

**Goal:** Rebuild `/web/bar-jaratusas` (and `/web/jaratusas`) using the light editorial 6-section "Cauce" (Dínamo Sites) architecture in stone/white (`#F6F6F3` / `#FFFFFF`), charcoal ink (`#0F172A`), and Bar Jara-Tusas Royal Blue (`#1D4ED8` / `#1E3A8A`) with 0% orange/amber, `Instrument Serif` + `Inter` / `DM Sans`, three seamless loop containers (`100vw x 100vh` Hero, `16:9` horizontal block, `3:4` vertical block), mobile reordering, and a live 2-column WhatsApp *"Mensaje preparado"* configurator, while leaving `/web/casa-mar-da-vila` intact.

**Architecture:** Extract a dedicated `LoopVideoBlock` HTML5 `<video autoPlay muted loop playsInline>` + 60fps Canvas Ken Burns/crossfade fallback component, scope the 6-section light editorial layout & Jara-Tusas blue tokens to `bar-jaratusas` (`web-tenants.ts` + components), share one `WhatsAppLiveConfigurator` across inline Section 6 and the optional drawer, sync `scripts/export_static_web.mjs`, and verify on desktop `1440x900` + iPhone `390x844`.

**Tech Stack:** Next.js 14 (App Router), React 18, TypeScript 5, Tailwind CSS, Canvas 2D 60fps procedural loop, Node built-in test runner, Playwright Chromium.

## Global Constraints
- **Zero Orange / Amber / Gold:** No `#F59E0B`, `#EA580C`, `#FBBF24`, `#D97706`, `#C85A32`, `amber-*`, or `orange-*` classes anywhere on `/web/bar-jaratusas`. Use `#F6F6F3`, `#FFFFFF`, `#0F172A`, `#475569`, and `#1D4ED8` / `#1E3A8A`.
- **Zero Floating Badges on Media:** No overlaid text pills, ratings, or tags on top of Hero `100vh`, `16:9`, or `3:4` media blocks.
- **No Broken Sibling Tenants:** `casa-mar-da-vila` keeps its existing marisquería behavior and passing tests.
- **Windows PowerShell Rules (`AGENTS.md`):** Use `npm.cmd`, `npx.cmd`, `;` separator (never `&&`).
- **Accessibility & Mobile Fit:** Visible `focus-visible:ring-2 focus-visible:ring-[#1D4ED8]`, zero horizontal scroll at `390x844` (`overflow-x-hidden` on root since pinned scrollytelling is replaced by seamless Cauce sections), and `3:4` video reordered below section title / above Step `01` on screens `< 768px`.

## File Ownership & Tasks

### Task 1 (`assets-ssot`): SSOT Tenant Data, Types & JSON-LD
**Files:**
- Modify `src/types/gastronomic-web.types.ts`: Add optional `layoutPreset?: 'cauce_editorial' | 'cinematic_scroll'`, `heroLoopFrames?: string[]`, `featureVideoFrames?: string[]`, `experienceVideoFrames?: string[]`.
- Modify `src/lib/web-tenants.ts`: Update `'bar-jaratusas'` with `layoutPreset: 'cauce_editorial'`, `primaryColor: '#F6F6F3'`, `accentColor: '#1D4ED8'`, trilingual `"Cauce"` copy, loop frame arrays backed by `public/images/jaratusas/*` + `public/images/bg/*`, and 4 architectural spaces (`Terraza Exterior`, `Salón Interior`, `Zona de Barra`, `Mesas para Grupos`) without repeated food images. Keep all 14+ `dishes` intact.
- Modify `src/lib/seo/gastronomic-jsonld.ts`: Ensure `BarOrPub` metadata remains valid and consistent with Jara-Tusas SSOT.
**Verify:** `npx.cmd tsc --noEmit` exits 0; `node --test tests/unit/gastronomic-jsonld.test.ts` passes.

### Task 2 (`media-hero`): Reusable Multi-Video Loop Component & Fullscreen Cauce Hero + Floating Pill Navbar
**Files:**
- Create `src/components/web/LoopVideoBlock.tsx`: `<video autoPlay muted loop playsInline poster={posterSrc}>` when `.mp4`/`.webm` is provided + 60fps HTML5 `<canvas>` procedural Ken Burns/crossfade loop over `frames` with instant `<img>` poster fallback and `prefers-reduced-motion: reduce` support. Zero overlaid badges.
- Modify `src/components/web/HeroCinematic.tsx`: When `layoutPreset === 'cauce_editorial'` (`bar-jaratusas`), render the floating white pill navbar (`rounded-full bg-white/95 backdrop-blur-md border border-slate-200/80` with logo + links + `[ES | GAL | EN]` + blue CTA + accessible mobile `< 768px` dropdown) AND full-bleed `100vw x 100vh` `LoopVideoBlock` behind clean `Instrument Serif` H1, 2-line subtitle, and ONE Jara-Tusas Blue (`#1D4ED8`) CTA button (0 floating pills/eyebrows/bottom strips). Preserve existing branch for `casa-mar-da-vila`.
**Verify:** `npx.cmd tsc --noEmit` exits 0.

### Task 3 (`cauce-orchestrator`): 6-Section Editorial Page, Responsive `3:4` Order, Live "Mensaje preparado" Configurator & Blue Sticky Bar
**Files:**
- Modify `src/components/web/WhatsAppReservationDrawer.tsx`: Export `WhatsAppLiveConfigurator` (2-column left 4 inputs: Espacio, Motivo, Personas + Turno, Detalles opcionales -> right `Mensaje preparado` + `LISTO PARA COPIAR` badge, live updating preview text, `Copiar mensaje` with copied confirmation + fallback selection, blue `Compartir por WhatsApp`) and `WhatsAppReservationDrawer` modal reusing it. Zero orange anywhere in `cauce_editorial` mode.
- Modify `src/components/web/LiveOpeningBadge.tsx`: Support light editorial surface theme (`variant?: 'dark' | 'light'`) with `#1D4ED8` / `#0F172A` / emerald open dot (0% orange) and trilingual labels.
- Modify `src/components/web/MobileStickyActionBar.tsx`: Support `layoutPreset === 'cauce_editorial'` crisp blue mobile thumb bar (`Ver Carta` + `Reservar / Ir`).
- Modify `src/components/web/GastronomicWebClientView.tsx`: Load `Instrument Serif`, `Inter`, and `DM Sans` (`tabular-nums`); when `tenant.layoutPreset === 'cauce_editorial'`, render exact 6-section Cauce architecture (`1. Floating Pill + Fullscreen Hero`, `2. Lo Que Nos Define 3 Cards + 16:9 LoopVideoBlock + 2 sub-boxes + Carta CTA`, `3. La Experiencia 01-04 + 3:4 LoopVideoBlock with mobile order above Step 01`, `4. Espacios y Horarios + 4 stacked zone cards`, `5. 3 FAQ cards`, `6. 2-column WhatsAppLiveConfigurator`) plus blue-themed Full Carta Modal with search, category pills, prices & 14 EU allergens. Keep `casa-mar-da-vila` branch intact.
**Verify:** `npx.cmd tsc --noEmit` exits 0.

### Task 4 (`exporter-tests`): Static ZIP Exporter & Unit Tests Sync
**Files:**
- Modify `scripts/export_static_web.mjs`: Sync `bar-jaratusas` (`cauce_editorial`) stone/blue tokens, 6-section HTML/CSS/JS output including 60fps canvas loop & live `"Mensaje preparado"` configurator, copying all referenced assets into `assets/` and generating `out/sites/bar-jaratusas.zip`.
- Modify `tests/unit/web-tenants.test.ts`: Assert `bar-jaratusas` uses `cauce_editorial`, `#F6F6F3`, `#1D4ED8` (0 orange hexes), loop frame paths on disk, 4 spaces, and 14+ dishes.
**Verify:** `node --test tests/unit/web-tenants.test.ts tests/unit/gastronomic-jsonld.test.ts tests/unit/opening-hours.test.ts` passes and `node scripts/export_static_web.mjs bar-jaratusas` builds `out/sites/bar-jaratusas.zip`.

### Task 5 (`qa-verifier`): End-to-End Verification (TypeScript, Unit Tests, ZIP, Playwright Desktop + iPhone, Visual Inspection)
- Run `npx.cmd tsc --noEmit`.
- Run all unit tests cleanly (`tests/unit/*.test.ts`).
- Run `node scripts/export_static_web.mjs bar-jaratusas`.
- Audit `http://localhost:3000/web/bar-jaratusas` on Desktop (`1440x900`) and iPhone (`390x844`):
  - Confirm 0 orange computed styles on key buttons/links/badges/pills, 0 console/page errors, 0 `404` assets, 0 horizontal overflow on desktop/iPhone, Canvas `LoopVideoBlock` animating cleanly at `100vh`, `16:9`, and `3:4`, `3:4` video placed above Step `01` on `390x844`, Carta modal opens with prices & 14 allergens, and live WhatsApp `"Mensaje preparado"` updates + copies cleanly.
  - Capture and visually inspect full desktop & mobile screenshots (including Section 3 mobile order and Section 6 live preview).
