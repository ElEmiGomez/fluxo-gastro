# 📖 LIBRO DIARIO DE SINCRONIZACIÓN INTERDEPARTAMENTAL
> **Sistema Central:** Fluxo Gastronomic System  
> **Propósito:** Registro cronológico de acuerdos, cambios técnicos y estrategias compartidas entre todos los chats/departamentos del proyecto.

---

## 🕒 Registro de Eventos y Actualizaciones

### [2026-08-31 22:30] — Ejecución Autónoma de Entregables Diarios Interdepartamentales
* **Departamentos Sincronizados:** Organización General (COO), Marketing & Ventas, Diseño & UI, Ingeniería & Producto (Program Data).
* **Acciones Ejecutadas:**
  1. **Marketing & Ventas (Depto 2):**
     - Generado el documento de prospección territorial: [`docs/departamentos/2_marketing/prospeccion_locales_noia.md`](file:///c:/Users/mima7/OneDrive/Documentos/Fluxo%20-%20Gastronomic%20System/docs/departamentos/2_marketing/prospeccion_locales_noia.md) con el mapeo de 5 terrazas clave en Noia (Alameda, Cantón, Malecón, Centro, Puerto) y su argumentario de abordaje rápido en horas valle (17:00 a 19:30).
  2. **Diseño de Marca & UI (Depto 3):**
     - Generada la plantilla de peanas QR de terraza en formato A4 (2 peanas A6 por hoja) lista para imprimir y colocar en soportes de metacrilato 3M: [`public/peanas_qr_imprimibles.html`](file:///c:/Users/mima7/OneDrive/Documentos/Fluxo%20-%20Gastronomic%20System/public/peanas_qr_imprimibles.html) y [`docs/departamentos/3_diseno_marca/plantilla_peana_qr_imprimible.html`](file:///c:/Users/mima7/OneDrive/Documentos/Fluxo%20-%20Gastronomic%20System/docs/departamentos/3_diseno_marca/plantilla_peana_qr_imprimible.html).
  3. **Ingeniería & Producto / Program Data (Depto 4):**
     - Creada la guía de despliegue en producción 24/7 paso a paso: [`docs/departamentos/4_ingenieria_producto/guia_despliegue_nube_vercel_supabase.md`](file:///c:/Users/mima7/OneDrive/Documentos/Fluxo%20-%20Gastronomic%20System/docs/departamentos/4_ingenieria_producto/guia_despliegue_nube_vercel_supabase.md).
     - Creado y ejecutado el script de certificación E2E de ciclo de vida completo (`scripts/test_production_readiness_e2e.mjs`) con resultado **5/5 PASS**.
  4. **Organización General & COO (Depto 1):**
     - Consolidado el estado del Roadmap: Fase 1 (Técnica y Local) cerrada al 100%; listos los materiales para activar el despliegue en nube y la captación del Piloto Noia (Fase 2).

---

### [2026-08-31 09:00] — Vigilancia Diaria de Diseño de Marca, UI/UX & Tendencias Gastronómicas
* **Departamentos Sincronizados:** Diseño de Marca & UI/UX (Depto 3), Ingeniería & Producto (Program Data), Marketing & Ventas y Organización General.
* **Acción Realizada:**
  1. **Diseño de Marca & UI/UX (Depto 3):**
     - Generado el informe de tendencias `docs/departamentos/3_diseno_marca/tendencias_diarias/2026-08-31_novedades_diseno.md`.
     - Auditoría de patrones ergonómicos de competidores (Toast, Sunday, Pikotea, MyChefTool y Square).
     - Validación de microinteracciones hápticas (`navigator.vibrate`), botones masivos en cocina (>70px) y contraste solar para terrazas (`#FFFFFF` / `#F8FAFC`).
  2. **Ingeniería & Producto (Depto 4):**
     - Integración con el Google Review Booster (+1 Toque) en `BillModal.tsx` y tarjetas térmicas de KDS.
  3. **Marketing & Ventas (Depto 2):**
     - Sincronización de argumentos de valor: "Cero saturación visual de TPVs antiguos" y "Carta rápida en 2 toques".
* **Impacto Operativo:** Blindaje de la identidad de marca Fluxo y garantía de excelencia ergonómica en sala, terraza y cocina.

---


### [2099-12-31 09:00] — Vigilancia Diaria de Mercado e Inteligencia B2B (4 Cuadrantes)
* **Departamentos Sincronizados:** Organización General (COO), Marketing & Ventas, Diseño de Marca & UI, Ingeniería & Producto (Program Data) y Learning & Intelligence.
* **Acción Realizada:**
  1. **Marketing & Ventas (Depto 2):**
     - Generado informe diario `docs/departamentos/2_marketing/investigaciones_diarias/2099-12-31_inteligencia_mercado.md` cubriendo los 4 cuadrantes (Competidores, Normativa, Sala/Personal e IA).
     - Actualizado `manual_prospeccion_y_objeciones.md` con 3 nuevas Battle Cards frente a Qamarero, escasez de camareros y calendario Veri*Factu.
     - Focalizadas oportunidades comerciales en Noia (Fase 2), Barbanza (Fase 3) y Santiago (Fase 4).
  2. **Diseño de Marca & UI (Depto 3):**
     - Ratificada la jerarquía visual de alto contraste y botones táctiles industriales (>70px) para cocina KDS y visibilidad solar en cartas QR de terraza.
  3. **Organización General & COO (Depto 1):**
     - Auditoría y confirmación de la matriz canónica de precios DEC-06: Carta (39€), Sala (69€), Full (99€), Suite (139€) y Setup (149€ bonificable 100%).
  4. **Ingeniería & Producto / Program Data (Depto 4):**
     - Ejecución automatizada del motor de inteligencia de mercado (`scripts/daily_market_intelligence.mjs`).
     - Verificación de 0 errores en compilación Next.js 14 (`npm run build` PASS).
  5. **Learning & Intelligence (Depto 5):**
     - Consolidación de la lección didáctica matutina con la analogía del "Pase de Cocina y el Mozo Gatekeeper".
     - Compilado y actualizado el documento didáctico PDF en la raíz del workspace (`Lecciones_Fluxo_31_12_2099.pdf`).
* **Impacto Operativo:** Alineación estratégica integral y disponibilidad de argumentario comercial actualizado para prospección a pie de calle en Galicia.
* **Verificación del Sistema:** Pipeline automatizado ejecutado con éxito (0 errores).


---

### [2026-08-31 09:00] — Vigilancia Diaria de Mercado e Inteligencia B2B (4 Cuadrantes)
* **Departamentos Sincronizados:** Organización General (COO), Marketing & Ventas, Diseño de Marca & UI, Ingeniería & Producto (Program Data) y Learning & Intelligence.
* **Acción Realizada:**
  1. **Marketing & Ventas (Depto 2):**
     - Generado informe diario `docs/departamentos/2_marketing/investigaciones_diarias/2026-08-31_inteligencia_mercado.md` cubriendo los 4 cuadrantes (Competidores, Normativa, Sala/Personal e IA).
     - Actualizado `manual_prospeccion_y_objeciones.md` con 3 nuevas Battle Cards frente a Qamarero, escasez de camareros y calendario Veri*Factu.
     - Focalizadas oportunidades comerciales en Noia (Fase 2), Barbanza (Fase 3) y Santiago (Fase 4).
  2. **Diseño de Marca & UI (Depto 3):**
     - Ratificada la jerarquía visual de alto contraste y botones táctiles industriales (>70px) para cocina KDS y visibilidad solar en cartas QR de terraza.
  3. **Organización General & COO (Depto 1):**
     - Auditoría y confirmación de la matriz canónica de precios DEC-06: Carta (39€), Sala (69€), Full (99€), Suite (139€) y Setup (149€ bonificable 100%).
  4. **Ingeniería & Producto / Program Data (Depto 4):**
     - Ejecución automatizada del motor de inteligencia de mercado (`scripts/daily_market_intelligence.mjs`).
     - Verificación de 0 errores en compilación Next.js 14 (`npm run build` PASS).
  5. **Learning & Intelligence (Depto 5):**
     - Consolidación de la lección didáctica matutina con la analogía del "Pase de Cocina y el Mozo Gatekeeper".
     - Compilado y actualizado el documento didáctico PDF en la raíz del workspace (`Lecciones_Fluxo_31_08_2026.pdf`).
* **Impacto Operativo:** Alineación estratégica integral y disponibilidad de argumentario comercial actualizado para prospección a pie de calle en Galicia.
* **Verificación del Sistema:** Pipeline automatizado ejecutado con éxito (0 errores).


---

### [2026-08-31 17:15] — Protocolo de Aceleración Startup: Despacho Matutino y Concentración de Código en Program Data
* **Departamentos Sincronizados:** Organización General (COO), Ingeniería & Producto (Program Data), Marketing & Ventas, Diseño y Learning.
* **Directriz del COO:**
  - **Cadencia Matutina Diaria:** Se establece el protocolo de reporte matutino tipo "briefing de servicio gastronómico" con cuadro vertical de tareas priorizadas por departamento para avanzar en modo startup acelerada.
  - **Dominio Exclusivo de Código en Program Data:** Todo lo relativo a código fuente Next.js, API routes, Supabase Cloud, scripts y despliegue técnico pertenece estrictamente a **Ingeniería & Producto (Program Data)**.
  - **Verificación Técnica Exitosa:** Se ejecutó `npm run build` con resultado exitoso (0 errores, 8 rutas dinámicas y estáticas generadas).
  - **Prioridad Operativa del Día Aprobada:** Despliegue de producción a Vercel 24/7 + Supabase Cloud para independizar el sistema del localhost y dar el salto a la Fase 2 (Piloto Noia).
  - **Documento Didáctico Generado:** Compilado `Lecciones_Fluxo_31_08_2026.pdf` (1 página) con la analogía del pase de cocina y el rol de Program Data.

---

### [2026-08-31 17:05] — Implementación de "Google Review Booster" y SEO Semántico Gastronómico (Schema.org)
* **Departamentos Sincronizados:** Ingeniería & Backend ([`51b9e82c-8266-4700-b6e1-f3bc7670e8d7`](conversation://51b9e82c-8266-4700-b6e1-f3bc7670e8d7)), Marketing & Ventas, Organización General y Diseño.
* **Motivación & Inteligencia Competitiva:**
  - Análisis técnico del lead magnet de la competencia (*Qamarero* en `analiza.qamarero.com`), que explota la baja nota en Google (déficit de 0.2 estrellas = "pérdida de 600-900€/mes") y la ausencia de web propia para vender su TPV invasivo.
  - Creación de contramedidas técnicas nativas en Fluxo sin requerir pasarelas de pago ni tocar el TPV del restaurante.
* **Acción Técnica Realizada:**
  1. **Modelo de Datos:**
     - Añadidos a la entidad `Restaurant` los atributos de posicionamiento digital: `google_place_id`, `google_review_url`, `phone`, `address`, `city`, `postal_code`, `cuisine_type` y `price_range` en [`database.types.ts`](file:///c:/Users/mima7/OneDrive/Documentos/Fluxo%20-%20Gastronomic%20System/src/types/database.types.ts), [`schema.sql`](file:///c:/Users/mima7/OneDrive/Documentos/Fluxo%20-%20Gastronomic%20System/supabase/schema.sql) y [`mock-fallback.ts`](file:///c:/Users/mima7/OneDrive/Documentos/Fluxo%20-%20Gastronomic%20System/src/lib/supabase/mock-fallback.ts).
  2. **Google Review Booster (`GoogleReviewBooster.tsx`):**
     - Captura inteligente de 5 estrellas con redirección a Google Maps en 1 toque.
     - Integrado en [`BillModal.tsx`](file:///c:/Users/mima7/OneDrive/Documentos/Fluxo%20-%20Gastronomic%20System/src/components/menu/BillModal.tsx) (al pedir la cuenta) y en la tarjeta de sobremesa tras entrega del pedido en [`menu/[slug]/page.tsx`](file:///c:/Users/mima7/OneDrive/Documentos/Fluxo%20-%20Gastronomic%20System/src/app/menu/%5Bslug%5D/page.tsx).
     - Haptic feedback y persistencia en `localStorage` (`fluxo_review_dismissed_[slug]`).
  3. **SEO Semántico Gastronómico (`RestaurantJsonLd.tsx`):**
     - Generación dinámica de datos estructurados JSON-LD (`Schema.org/Restaurant` + `Schema.org/Menu` con `MenuSection` y `MenuItem`).
     - Cada carta digital de Fluxo ahora indexa directamente en Google Maps y Google Search como web oficial del restaurante, eliminando el dolor de "Sin web propia".
* **Impacto en Marketing & Ventas:** El equipo comercial ahora dispone de un argumento de venta demoledor frente a Qamarero: Fluxo sube las reseñas de Google Maps de forma orgánica y dota al restaurante de web indexable oficial sin comisiones ni cambios de TPV.
* **Verificación:** Compilación Next.js 14 en producción finalizada con 0 errores (`npm run build` PASS).

---

### [2026-08-31 15:45] — Activación de Coordinación General (COO) y Consolidación del Roadmap de 5 Fases
* **Departamentos Sincronizados:** Organización General (COO), Ingeniería, Marketing y Diseño.
* **Acción Realizada:**
  - **Reestructuración del Roadmap Operativo:** Alineado en 5 Fases estratégicas de despliegue cronológico:
    1. *Fase 1:* Validación Local y Túnel (Demo transatlántica / Gatekeeper).
    2. *Fase 2:* Piloto Noia (Primeros 1-3 locales, pase a producción Vercel/Supabase).
    3. *Fase 3:* Barbanza (Consolidación comarcal, regla 60-15-10, hito 1.000€ MRR).
    4. *Fase 4:* Santiago de Compostela (Escala urbana de alta rotación, partners TPV).
    5. *Fase 5:* Expansión Regional/Nacional (Suite 360°, automatización y multiciudad).
  - **Actualización de Tableros:** Actualizados `roadmap_y_organigrama.md` y `registro_ideas_y_decisiones.md` con la decisión `DEC-06` (Pricing B2B y empaquetado de planes).
  - **Organigrama Vertical en Cuadro:** Estandarizado el organigrama y mapa de temas en formato de flujo y cajas 100% verticales para optimizar la visualización en paneles laterales y documentos ejecutivos.
* **Estado Operativo:** Fase 1 técnica al 100% (seguridad RLS, Mozo Gatekeeper, KDS industrial). Pendiente consolidar feedback antes de disparar el despliegue Vercel (Fase 2).

---

### [2026-08-31 15:43] — Activación y Homogeneización del Departamento de Marketing & Ventas
* **Departamentos Sincronizados:** Marketing, Ventas y Captación ([`e8fcf7e2-1bce-4f7e-95ae-ebfb2c0ca5ac`](conversation://e8fcf7e2-1bce-4f7e-95ae-ebfb2c0ca5ac)) con Organización General e Ingeniería.
* **Acción Realizada:**
  - **Revisión y Alineación de Materiales:** Auditados `estrategia_comercial_y_pricing.md`, `one_pager_comercial.md`, `manual_prospeccion_y_objeciones.md` y `calculadora_roi_hostelero.md`.
  - **Homogeneización Tarifaria:** Se eliminaron referencias desactualizadas a cuotas heredadas (59€) en el manual de objeciones y la calculadora de ROI, consolidando la base oficial: Carta (39€), Sala (69€), Full (99€), Suite (139€) y Setup oficial 149€ (bonificable 100% en Plan Full).
  - **Foco Geográfico Establecido:** Despliegue prioritario en Noia, comarca de Barbanza y Santiago de Compostela.
  - **Eje de Posicionamiento:** Blindado en "Rotación sin estrés para el mozo de terraza", "0% comisiones bancarias/ticket" y "Cero sustitución o cambio de TPV/datáfono".

---

### [2026-08-30 02:35] — Consolidación Estratégica de Pricing & Marketing B2B
* **Departamentos Sincronizados:** Marketing & Ventas ([`83ed9cdf-dee2-454a-9533-3640cfc62506`](conversation://83ed9cdf-dee2-454a-9533-3640cfc62506)), Organización General e Ingeniería.
* **Acción Realizada:**
  - **Matriz de Precios Definitiva:** Carta (39€/mes), Sala (69€/mes), Full (99€/mes) y Suite 360° (139€/mes).
  - **Corrección de Empaquetado Operativo:** El *Llamador con Intención* pasa a Sala (69€) para alinearse con el comandero del mozo y evitar canibalización. KDS industrial y tiqueteras térmicas ESC/POS se concentran en Full (99€).
  - **Setup / Onboarding:** Fijado en 149€ + IVA (100% bonificado como palanca de cierre en pago trimestral/anual o Plan Full).
  - **Argumentario Competitivo:** Blindado el mensaje *"Cero cambio de TPV"* frente a Pikotea y MyChefTool; 0% comisiones frente a apps transaccionales.
  - **Proyecciones Financieras:** Validadas probabilidades (45% Full, 20% Suite; ARPU 93,50€). Regla del 60-15-10 a pie de calle: 10 clientes = ~900€-1.000€ MRR en 30 días.
  - **Kit de Ventas Creado:** One-Pager comercial (`docs/marketing/one_pager_comercial.md`), Manual de objeciones en horas valle (`docs/marketing/manual_prospeccion_y_objeciones.md`) y Calculadora de ROI (+1.000€/mes por rotación extra).
* **Impacto en Ingeniería/Producto:** Preparar a futuro la telemetría de tiempos de pase (cuellos de botella) y el motor de reservas por WhatsApp para el Plan Suite.

---

### [2026-08-29 17:35] — Estandarización de Marca Global: "Fluxo"
* **Departamentos Sincronizados:** Ingeniería, Diseño de Marca, Marketing y Organización General.
* **Acción Realizada:**
  - Se eliminaron todos los nombres genéricos o provisionales ("Gastro PWA", "GastroApp", "gastro-pwa-multitenant", "Carta Digital Gastronómica").
  - Se fijó la marca comercial definitiva: **Fluxo** (`package.json`, `manifest.json`, `layout.tsx`, `page.tsx`, `CartDrawer.tsx`, `legal/page.tsx`, `not-found.tsx`, `error.tsx`, `robots.ts`, `sitemap.ts`).
  - Metadatos HTML, PWA Web App manifest, OpenGraph y Twitter Cards unificados bajo *"Fluxo — Sistema Gastronómico Inteligente"*.
* **Próximo Paso de Diseño:** Armado del Logo e Icono SVG oficial de Fluxo.

---

### [2026-08-29 17:30] — Fundación de la Red Interdepartamental
* **Departamentos Conectados:**
  - 🏛️ **Organización General:** [`1dcc3fea-fde9-44f8-bb24-e0e2afd26f22`](conversation://1dcc3fea-fde9-44f8-bb24-e0e2afd26f22)
  - 🎨 **Diseño de Marca & UI:** [`dde643cc-47dd-47d3-9adc-fcae77e49214`](conversation://dde643cc-47dd-47d3-9adc-fcae77e49214)
  - ⚙️ **Ingeniería & Backend:** [`64445573-62cb-4897-b2f1-f89015d7ea45`](conversation://64445573-62cb-4897-b2f1-f89015d7ea45)
* **Sincronización:** Se indexaron las 5 reglas operativas de Guillermo F. Gómez (Gatekeeper antifraude, cero texto libre, botones industriales, ESC/POS y exclusión de pagos automáticos).
* **Impacto en Marketing:** Actualizado el pitch para responder a la objeción de pedidos falsos y resistencia de cocineros a las pantallas.
* **Impacto en Diseño:** Estandarizados los tokens de color y la altura de botones táctiles en cocina (`h-16 py-4`).

---

### [2026-08-29 16:53] — Certificación del Flujo Mozo Gatekeeper (14/14 PASS)
* **Origen:** Chat de Ingeniería.
* **Detalle:** Implementado y verificado el estado `pending_validation`. La comanda comensal queda pausada hasta que el mozo pulsa "Confirmar a Cocina" en el comandero.
* **Impacto en Organización:** Tarea 1.2 del roadmap completada con éxito. Listo para la prueba en vivo con Argentina.

---

### [2026-08-29 16:30] — 4 Parches Críticos de Seguridad Implementados
* **Origen:** Chat de Ingeniería (Auditoría QA).
* **Detalle:** Idempotencia SQL sin TOCTOU, RLS con cookies de `@supabase/ssr` (sin `service_role`), hashing de PINs con `bcrypt` y resiliencia en Safari iOS mediante cookie `HttpOnly`.

---

*Cualquier departamento que requiera consultar o añadir información debe registrar su entrada aquí para mantener la sincronización 100% transparente.*
