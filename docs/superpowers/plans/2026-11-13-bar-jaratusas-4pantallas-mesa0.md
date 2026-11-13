# Plan de Implementación: Simplificación a 4 Pantallas, Vídeo en Barra IA, Carrusel de Tragos y Mesa 0 (Bar Jara-Tusas)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reestructurar `/web/bar-jaratusas` en 4 pantallas exactas de alto impacto (Hero con vídeo interior de persona tomando cerveza en barra, carrusel continuo a 60fps de mockups de tragos con enlace a Mesa 0, espacios reales sin fotos repetidas con horario en vivo, y 3 preguntas clave + configurador WhatsApp), habilitando el soporte explícito de `📍 MESA 0` en `/p/bar-jaratusas?mesa=0`.

**Architecture:**
- **Hero:** Vídeo continuo `<video autoPlay muted loop playsInline>` con poster `public/assets/jaratusas/hero-barra-cerveza-poster.jpg` + fallback cinemático canvas a 60fps.
- **Tragos:** Componente nuevo `src/components/web/DrinkMockupsMarquee.tsx` con 6 mockups visuales y botón protagonista `#1D4ED8` hacia `/p/bar-jaratusas?mesa=0`.
- **Mesa 0:** Lectura estricta no-falsy (`mesaParam !== null && mesaParam !== undefined && mesaParam !== ''`) en `src/app/p/[slug]/page.tsx` y `public/jaratusas.html`, formateando explícitamente `📍 MESA 0`.
- **Poda:** Eliminación de las secciones redundantes en `GastronomicWebClientView.tsx` dejando exactamente 4 bloques sin fotos repetidas.

**Tech Stack:** Next.js 14 (App Router), React 18, TypeScript 5 estricto, Tailwind CSS, Playwright.

---

## Tareas

- [ ] **Tarea 1: Generación e Integración de Activos Multimedia para Hero y Tragos**
  - Generar imagen de persona en barra interior de Jara-Tusas en `public/assets/jaratusas/hero-barra-cerveza-poster.jpg`.
  - Generar/configurar clip de vídeo en bucle `public/assets/jaratusas/hero-barra-cerveza-loop.mp4` o secuencia fluida a 60fps.
  - Asegurar activos visuales únicos para los 6 tragos de la colección `jaraTusasDrinkMockups`.
  - Verificar existencia de archivos en disco.

- [ ] **Tarea 2: Soporte para Mesa 0 en `/p/bar-jaratusas?mesa=0` y `public/jaratusas.html`**
  - Actualizar `public/jaratusas.html` para aceptar `rawMesa === '0'` o `/^mesa\s*0$/i` y asignar badge literal `📍 MESA 0`.
  - Asegurar que `src/app/p/[slug]/page.tsx` preserve y pase el query param `?mesa=0` al iframe o componente de carta.
  - Verificar que todas las funciones de comanda, variantes y filtros sigan 100% operativas.

- [ ] **Tarea 3: Componente `DrinkMockupsMarquee.tsx` (Pantalla 2)**
  - Crear `src/components/web/DrinkMockupsMarquee.tsx` con los 6 mockups (Estrella Galicia Bodega, 1906 Red Vintage, 1906 Black Coupage, Vermú con Sifón, Vinos Gallegos, Licores Tradicionales).
  - Implementar marquesina horizontal continua a 60fps con soporte de pausa al pasar el cursor / touch drag.
  - Añadir botón central inferior en azul `#1D4ED8`: `📖 Ver Carta Completa y Precios ->` apuntando a `/p/bar-jaratusas?mesa=0`.

- [ ] **Tarea 4: Actualizar `HeroCinematic.tsx` y Podar `GastronomicWebClientView.tsx` a 4 Pantallas**
  - Modificar `HeroCinematic.tsx` para cargar el nuevo vídeo/poster interior de la barra de Jara-Tusas y apuntar enlaces de carta a `/p/bar-jaratusas?mesa=0`.
  - En `GastronomicWebClientView.tsx`:
    - Eliminar "Lo que nos define" (3 tarjetas).
    - Eliminar "El cuidado empieza en la bodega".
    - Eliminar "Cómo se vive un rato bajo los soportales" (4 pasos).
    - Insertar `DrinkMockupsMarquee` como Pantalla 2.
    - Compactar Pantalla 3 a un solo bloque: horario en vivo, Google Maps y 3 tarjetas de espacios con 3 fotos distintas (Terraza bajo soportales, Salón de piedra, Zona de barra).
    - Dejar Pantalla 4 con las 3 FAQs horizontales y el configurador de WhatsApp.
  - Actualizar `src/lib/web-tenants.ts` para reflejar los 3 espacios únicos.

- [ ] **Tarea 5: Actualizar Exportador Estático, Tests y Validación E2E**
  - Actualizar `scripts/export_static_web.mjs` y `tests/unit/web-tenants.test.ts`.
  - Ejecutar `npx.cmd tsc --noEmit` y `node --test tests/unit/web-tenants.test.ts tests/unit/gastronomic-jsonld.test.ts tests/unit/opening-hours.test.ts`.
  - Ejecutar `node scripts/export_static_web.mjs bar-jaratusas`.
  - Ejecutar auditoría Playwright en local (desktop y mobile), comprobando badge `📍 MESA 0`, vídeo hero, carrusel y 0 fotos repetidas.
  - Tomar capturas de pantalla de evidencia.
