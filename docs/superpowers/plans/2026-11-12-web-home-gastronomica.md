# Pulido y Parametrización de Páginas Web Gastronómicas (`/web/[slug]`) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transformar la plantilla monolítica y estática de `/web/[slug]` en un motor dinámico multi-arquetipo (Bar/Cervecería, Restaurante/Marisquería, Cafetería/Brunch) de alto rendimiento (60fps, LCP < 2.0s, CLS = 0), con JSON-LD estructurado, barra de acción en la zona del pulgar y reservas directas a WhatsApp por zona sin comisiones.

**Architecture:** Arquitectura híbrida en Next.js 14 App Router: Server Components para el shell de página, metadatos SEO y JSON-LD indexable, junto con islas de cliente aisladas (`'use client'`) para la interactividad (barra de pulgar, reserva por WhatsApp, badge de apertura en vivo y visualizador 60fps). Los datos del local se resuelven de forma desacoplada vía `web-tenants.ts` permitiendo slugs independientes y mapeo con `domain-resolver.ts`.

**Tech Stack:** Next.js 14.2 (App Router), TypeScript, Tailwind CSS, Lucide React, Node.js Native Test Runner (`node:test` y `node:assert/strict`).

**Spec:** [`docs/departamentos/3_diseno_marca/investigacion_home_page_gastronomica.md`](../../departamentos/3_diseno_marca/investigacion_home_page_gastronomica.md)

## Global Constraints

- **Invariante de Accesibilidad en Terminología:** Prohibido el empleo de jerga técnica culinaria no universal en interfaces de cliente.
- **Invariante de Aislamiento de Estado:** Los estados de reserva, comanda o selección de local deben resolverse exclusivamente por slug y tenant, sin mezclar variables globales en memoria.
- **Rendimiento Móvil Estricto:** LCP < 2.0s en 4G, CLS = 0, respeto estricto a `prefers-reduced-motion` y prevención de reproducción de vídeo con audio o sin interacción.
- **SEO Semántico Limpio:** Prohibido inyectar `AggregateRating` o `Review` autogenerado sobre la propia entidad `LocalBusiness` en JSON-LD (política anti-penalización de Google).
- **Entorno de Ejecución:** Windows PowerShell con `npm.cmd` y separación secuencial con `;`.

## Review Focus

1. **Local no encontrado o slug inexistente:** Debe renderizar una vista 404 gastronómica limpia con botón para volver a la plataforma o a la demo oficial, sin lanzar error 500.
2. **Dispositivo con ahorro de datos (`Save-Data`) o `prefers-reduced-motion`:** El hero debe inhibir de inmediato la descarga del vídeo y partículas canvas, sirviendo exclusivamente la imagen póster optimizada en AVIF/WebP.
3. **Local sin teléfono o WhatsApp no configurado:** El botón de reserva debe derivar limpiamente a llamada telefónica convencional o a visualización de la Carta QR sin generar URLs rotas `wa.me/undefined`.
4. **Cálculo de horario en cambio de medianoche / madrugada:** Un local que abre de 20:00 a 02:30 debe marcar "Abierto ahora" a la 01:15 sin declarar falsamente que está cerrado.
5. **Cero saltos de diseño (CLS):** Todas las imágenes, contenedores de carrusel y botones flotantes deben tener dimensiones reservadas fijas para mantener CLS en 0 absoluto.

---

### Task 1: Dominio de Datos y Tipos Multi-Arquetipo

**Files:**
- Create: `src/types/gastronomic-web.types.ts`
- Create: `src/lib/web-tenants.ts`
- Test: `tests/unit/web-tenants.test.ts`

**Interfaces:**
- Produces: `GastronomicTenantConfig`, `RestaurantArchetype` ('tavern' | 'restaurant' | 'cafe'), `getGastronomicTenant(slug: string): Promise<GastronomicTenantConfig | null>`

- [x] **Step 1: Write the failing test**
```typescript
// tests/unit/web-tenants.test.ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { getGastronomicTenant } from '../../src/lib/web-tenants'

test('getGastronomicTenant returns structured configuration for known slug', async () => {
  const tenant = await getGastronomicTenant('casa-mar-da-vila')
  assert.ok(tenant)
  assert.equal(tenant?.name, 'Casa Mar da Vila')
  assert.equal(tenant?.archetype, 'restaurant')
  assert.ok(tenant?.dishes.length > 0)
})

test('getGastronomicTenant returns null for unknown slug', async () => {
  const tenant = await getGastronomicTenant('local-inexistente-xyz')
  assert.equal(tenant, null)
})
```

- [x] **Step 2: Run test to verify it fails**
Run: `node --test tests/unit/web-tenants.test.ts`
Expected: FAIL with module not found

- [x] **Step 3: Implement `src/types/gastronomic-web.types.ts` and `src/lib/web-tenants.ts`**
Definir los contratos de datos y la función de resolución con fallback a configuración de base de datos o catálogo semilla (Casa Mar da Vila, Bar Jara-Tusas, Tapería Adega do Pazo).

- [x] **Step 4: Run test to verify it passes**
Run: `node --test tests/unit/web-tenants.test.ts`
Expected: PASS

- [x] **Step 5: Typecheck verification**
Run: `npx.cmd tsc --noEmit`
Expected: 0 errors

---

### Task 2: Generador de Metadatos SEO y JSON-LD Estructurado

**Files:**
- Create: `src/lib/seo/gastronomic-jsonld.ts`
- Test: `tests/unit/gastronomic-jsonld.test.ts`

**Interfaces:**
- Consumes: `GastronomicTenantConfig` from `src/types/gastronomic-web.types.ts`
- Produces: `buildRestaurantJsonLd(tenant: GastronomicTenantConfig): Record<string, any>`

- [x] **Step 1: Write the failing test**
```typescript
// tests/unit/gastronomic-jsonld.test.ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildRestaurantJsonLd } from '../../src/lib/seo/gastronomic-jsonld'
import { GastronomicTenantConfig } from '../../src/types/gastronomic-web.types'

test('buildRestaurantJsonLd generates valid Schema.org without self-serving AggregateRating', () => {
  const mockTenant: GastronomicTenantConfig = {
    slug: 'bar-jaratusas',
    name: 'Bar Jara-Tusas',
    archetype: 'tavern',
    tagline: 'Cervecería & Tapas',
    phone: '+34981000000',
    whatsappNumber: '34711573870',
    address: 'Rúa do Curro 12',
    city: 'Noia',
    postalCode: '15200',
    cuisineType: ['Tapas', 'Cervecería'],
    priceRange: '€',
    dishes: [],
    ambiences: [],
    openingHours: []
  }

  const jsonLd = buildRestaurantJsonLd(mockTenant)
  assert.equal(jsonLd['@context'], 'https://schema.org')
  assert.equal(jsonLd['@type'], 'BarOrPub')
  assert.equal(jsonLd.name, 'Bar Jara-Tusas')
  assert.equal(jsonLd.aggregateRating, undefined) // Bloqueado por regla anti-penalización
})
```

- [x] **Step 2: Run test to verify it fails**
Run: `node --test tests/unit/gastronomic-jsonld.test.ts`
Expected: FAIL

- [x] **Step 3: Implement `src/lib/seo/gastronomic-jsonld.ts`**
Construir el esquema mapeando arquetipos (`BarOrPub`, `Restaurant`, `CafeOrCoffeeShop`), alérgenos, geolocalización y horarios normalizados `OpeningHoursSpecification`.

- [x] **Step 4: Run test to verify it passes**
Run: `node --test tests/unit/gastronomic-jsonld.test.ts`
Expected: PASS

---

### Task 3: Motor de Estado de Horario en Vivo ("Abierto Ahora / Cerrado")

**Files:**
- Create: `src/lib/opening-hours-calculator.ts`
- Create: `src/components/web/LiveOpeningBadge.tsx`
- Test: `tests/unit/opening-hours.test.ts`

**Interfaces:**
- Produces: `getOpeningStatus(schedules: OpeningSchedule[], referenceDate?: Date): { isOpen: boolean; label: string; subLabel: string }`

- [x] **Step 1: Write the failing test**
```typescript
// tests/unit/opening-hours.test.ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { getOpeningStatus } from '../../src/lib/opening-hours-calculator'

test('getOpeningStatus detects open state across midnight border', () => {
  const schedule = [
    { dayOfWeek: 5, open: '20:00', close: '03:00' } // Viernes noche hasta madrugada sábado
  ]
  // Simular sábado 01:30 AM
  const saturdayEarly = new Date('2026-11-14T01:30:00')
  const status = getOpeningStatus(schedule, saturdayEarly)
  assert.equal(status.isOpen, true)
})
```

- [x] **Step 2: Run test to verify it fails**
Run: `node --test tests/unit/opening-hours.test.ts`
Expected: FAIL

- [x] **Step 3: Implement `src/lib/opening-hours-calculator.ts` and component**
Manejar rangos continuos, horas valle, cierre semanal y formateo en español/gallego/inglés.

- [x] **Step 4: Run test to verify it passes**
Run: `node --test tests/unit/opening-hours.test.ts`
Expected: PASS

---

### Task 4: Barra Fija Inferior en Zona del Pulgar (Mobile Sticky Action Bar)

**Files:**
- Create: `src/components/web/MobileStickyActionBar.tsx`
- Consumes: `archetype`, `whatsappUrl`, `menuUrl`, `mapsUrl`, `isOpen`

- [x] **Step 1: Implement component with thumb-zone ergonomics**
Botón primario destacado según arquetipo (Llegar para bar/café, Reservar para restaurante) + 3 accesos rápidos táctiles (mínimo 48x48px).

- [x] **Step 2: Typecheck & Lint**
Run: `npx.cmd tsc --noEmit`
Expected: 0 errors

---

### Task 5: Hero Cinemático 60fps con Protección LCP y Ahorro de Datos

**Files:**
- Create: `src/components/web/HeroCinematic.tsx`
- Consumes: `posterUrl`, `videoWebmUrl`, `videoMp4Url`, `headline`, `subheadline`

- [x] **Step 1: Implement Hero component with Next.js Image Priority poster**
El poster carga con `fetchPriority="high"` para asegurar LCP < 2.0s. El vídeo sólo se hidrata en cliente si no hay `Save-Data` ni `prefers-reduced-motion`.

- [x] **Step 2: Typecheck & Build check**
Run: `npx.cmd tsc --noEmit`
Expected: 0 errors

---

### Task 6: Orquestador Dinámico de la Home Gastronómica (`/web/[slug]`)

**Files:**
- Modify: `src/app/web/[slug]/page.tsx`
- Create: `src/app/web/[slug]/not-found.tsx`

- [x] **Step 1: Refactor `/web/[slug]/page.tsx` to dynamic architecture**
Integrar las piezas: Server metadata, JSON-LD, Hero Cinemático, Bloque Hoy / Lonja del día, Platos Estrella con alérgenos, Selector de Ambientes, Reseñas verificadas, Drawer de WhatsApp y Barra Fija.

- [x] **Step 2: Verify TypeScript Compilation**
Run: `npx.cmd tsc --noEmit`
Expected: 0 errors

- [x] **Step 3: Verification with manual route tests**
Verificar carga con `casa-mar-da-vila`, `bar-jaratusas` y comportamiento ante slug inexistente.
