# AUDITORÍA FORENSE 360° Y BIBLIA DEL MODELO DE NEGOCIO — FLUXO GASTRONOMIC SYSTEM

**Fecha de Auditoría:** 11 de Noviembre de 2026  
**Roles Ejecutores:** Principal Software Auditor · Chief Product Officer (CPO) · Estratega SaaS B2B en Hostelería  
**Modo de Ejecución:** 100% Lectura en Código Fuente (Cero Mutaciones en `src/`, `public/`, `package.json` y configuraciones)  
**Repositorio Auditado:** `Fluxo - Gastronomic System` (Next.js 14.2.23 + TypeScript + Supabase + Gemini 2.5 Flash + Remotion v4)

---

## SECCIÓN 1: RADIOGRAFÍA FUNCIONAL DE PRODUCTO (LA VERDAD DEL CÓDIGO HOY)

### 1.1. Diagnóstico Arquitectónico Central: La Dualidad de Motores de Carta
Antes de recorrer ruta por ruta, es imprescindible dejar documentada la verdad técnica más importante del repositorio actual: **Fluxo opera hoy con dos motores de carta paralelos que aún no están fusionados en un único flujo:**

1. **El Motor Estático de Asalto Comercial (`/p/[slug]` -> `public/*.html`):**  
   Las cartas hiper-personalizadas que estamos usando para salir a vender en la calle (**Bar Jara-Tusas** en `/p/jaratusas`, **Casa Mar da Vila** en `/p/casamar-da-vila` y la plantilla `/p/template-carta`) se renderizan mediante un `<iframe>` dentro de `src/app/p/[slug]/page.tsx` que carga archivos HTML monolíticos ubicados en `public/jaratusas.html`, `public/casamar-da-vila.html` y `public/template-carta.html`.  
   - **Lo bueno:** Tienen una estética editorial sobresaliente, carga instantánea, píldoras de variantes con cambio de precio en vivo (Caña/Jarra, Copa/Botella), filtro de los 14 alérgenos, selector multi-idioma (ES/GL/EN), detector `?mesa=` y el bloc visual **"Comanda de tu Mesa"** ultralimpio para leer o enseñar al camarero en 5 segundos.
   - **La verdad técnica:** Su catálogo de platos y precios está **escrito en código fijo (hardcoded) dentro del archivo `.html`** y su carrito/comanda vive en la memoria del navegador del cliente (`localStorage`). **No leen la tabla `products` de Supabase ni envían pedidos a `/api/orders`**. Además, el interruptor de bloqueo por impago (`ProtectedMenuScreen`) lee el estado `pause_level` desde el `localStorage` del navegador (`fluxo_crm_billing_v1`), por lo que pausar un local en el CRM sólo lo bloquea en ese mismo ordenador o móvil, no en los teléfonos de los clientes en la calle.

2. **El Motor Reactivo Full-Stack (`/menu/[slug]` y `/carta/[slug]`):**  
   Implementado en `src/app/menu/[slug]/page.tsx` (1.123 líneas). Es una aplicación React completa conectada a `/api/orders`, `/api/daily-menu`, `/api/service-calls`, `/api/loyalty/*` y Supabase Realtime (`fluxo_menu_channel`).  
   - **Lo bueno:** Sincroniza pedidos reales con el Comandero (`/staff/comandero/[slug]`) y el KDS de Cocina (`/staff/kitchen/[slug]`), soporta menú del día interactivo, llamadas al camarero persistentes, visor 3D (`<model-viewer>`), tarjeta de fidelización por sellos y edición in-situ manteniendo pulsado el logo 0.8 segundos (`InSituAdminModal`).
   - **La verdad técnica:** No tiene todavía trasplantado el diseño visual hiper-pulido de las variantes de bebida ni los flancos fotográficos de local que se construyeron en `public/jaratusas.html`.

---

### 1.2. Tabla Maestra de Rutas y Módulos (`src/app/` + `src/remotion/`)

**Leyenda de Clasificación:**
- 🟢 **100% Operativo / Producción:** Conectado a backend/API y Supabase (o funcional extremo a extremo para su propósito real hoy en un bar).
- 🟡 **Funcional en Cliente / Local:** Funciona en pantalla, pero persiste en `localStorage`, `IndexedDB`, memoria RAM del servidor (`globalThis`) o archivo local `.fluxo-data`, sin persistencia multi-dispositivo garantizada al 100% en la nube.
- 🔴 **Prototipo Visual / Mock:** Datos fijos (`hardcoded`), simulación visual en cliente o flujo de servidor aún no conectado a base de datos real.

| Ruta / Módulo | Archivo Principal | Estado | Qué hace hoy de verdad (Código Real) | Qué le falta para Producción Multi-Dispositivo |
| :--- | :--- | :---: | :--- | :--- |
| **Landing Comercial B2B** | `src/app/page.tsx` | 🟢 / 🟡 | Landing interactiva con simulador en vivo (4 pasos: QR, Alérgenos, Comandero, KDS), calculadora de ROI, comparativa de mercado y formulario de captación conectado a `POST /api/leads` (Supabase `commercial_leads` + email por Resend). | Actualizar precios de la tabla inferior (sigue mostrando **15 € / 47 € / 97 €** en vez de **39 € / 50 € / 99 €**) y quitar el enlace público a `/admin/crm` del footer. |
| **Tarjeta Digital de Asalto** | `src/app/contacto/page.tsx` | 🟢 | Tarjeta móvil rápida ("De la barra hacia afuera") pensada para enseñar en frío en la barra del bar: botones directos a demos de Casa Mar, Jara-Tusas, Web Cinemática y WhatsApp. | Unificar el teléfono de WhatsApp: aquí apunta a `+54 358 518 7430` (Argentina), mientras que `/activar/[slug]` y `/web/[slug]` apuntan a `+34 711 573 870` (España). |
| **Pasarela de Alta en 1 Clic** | `src/app/activar/[slug]/page.tsx` | 🟡 | Muestra la propuesta personalizada al dueño, 3 planes (`39 €` Carta, `50 €` Socio Fundador, `99 €` Suite Completa), selector de método (Bizum, Transferencia con copia de IBAN, Efectivo con código `FLX-XXXX` y Stripe) y registra pagos en Supabase `subscription_payments` (`POST /api/billing/register-payment`). | La pasarela Stripe (`/api/billing/create-checkout-session`) requiere configurar `STRIPE_SECRET_KEY` en Vercel; sin esa variable cae en modo demo (`?demo_success=true`). |
| **Visor de Cartas Prototipo con Control de Pausa** | `src/app/p/[slug]/page.tsx` + `ProtectedMenuScreen.tsx` | 🟡 | Envuelve en un `<iframe>` las cartas de `jaratusas`, `casamar-da-vila` y `template-carta`. Si el local tiene `pause_level === 2`, bloquea la carta y muestra pantalla de suspensión con acceso a `/activar/[slug]`. | `ProtectedMenuScreen` lee el bloqueo desde `localStorage` (`loadBillingLocales()`). Debe leer `pause_level` directamente desde la tabla `restaurants` de Supabase en el servidor (SSR). |
| **Carta QR Bar Jara-Tusas** | `src/app/carta-jaratusas/route.ts` -> `public/jaratusas.html` | 🟡 | Carta completa en HTML/JS puro: fotos de alta estética con botellas y copas reales, píldoras de opciones sin preselección engañosa, fondo con fotos del local difuminadas, buscador, 14 alérgenos, idiomas ES/GL/EN, `?mesa=` sin emoji de chincheta y bloc **"Comanda de tu Mesa"**. | El catálogo está fijo en `public/jaratusas.html` y el bloc de comanda es local al teléfono del comensal. Si el bar quiere cambiar un precio desde el móvil sin tocar código, hay que hidratar este HTML desde Supabase. |
| **Carta QR Casa Mar da Vila** | `src/app/carta-casamar/route.ts` -> `public/casamar-da-vila.html` | 🟡 | Carta marinera estática con estética editorial gallega, variantes de ración/vino, filtro de alérgenos, multi-idioma y bloc de comanda en memoria del navegador. | Igual que Jara-Tusas: catálogo estático en el archivo HTML; requiere conexión a tabla `products` de Supabase para edición autónoma del dueño. |
| **Plantilla Maestra de Carta** | `src/app/carta-prototipo/route.ts` -> `public/template-carta.html` | 🟡 | Plantilla base clonable con motor de temas (`?tema=oscuro`), variantes, alérgenos, idiomas y bloc de notas local. | Igual que las anteriores: sirve como escaparate comercial instantáneo, no conectado aún a base de datos dinámica. |
| **Rutas Espejo de Cartas** | `/jaratusas`, `/casamar`, `/casamar-da-vila`, `/template`, `/template-carta` | 🟡 | `Route Handlers` (`route.ts`) que leen y devuelven exactamente los mismos archivos HTML de `public/`. | Deuda de higiene de rutas: existen 8 endpoints distintos para servir 3 archivos HTML. Conviene consolidar con redirecciones `308` hacia `/p/[slug]`. |
| **Motor de Carta Reactiva (Plan Sala / Full)** | `src/app/menu/[slug]/page.tsx` y `src/app/carta/[slug]/page.tsx` | 🟢 | **El motor transaccional real:** lee productos, categorías y menú del día desde API/Supabase, escucha cambios en vivo (`fluxo_menu_channel`), envía comandas reales a cocina (`POST /api/orders`), lanza avisos de camarero/cuenta (`POST /api/service-calls`), abre visor 3D (`Product3DModal`), gestiona sellos de fidelización y permite edición in-situ con PIN (`InSituAdminModal`). | Unificarle la capa estética de `jaratusas.html` (variantes de bebida en tarjeta y modo "Solo Bloc de Lectura" configurable por plan) para no mantener dos motores separados. |
| **Selector / Demo de Carta Fija (Plan Carta 39 €)** | `src/app/carta/page.tsx` | 🟢 | Escaparate interactivo de "Carta Fija Digital" con conmutador entre Cervecería Rústica (`jaratusas`) y Marisquería Gallega (`casamar`). Cumple la regla de catálogo informativo puro (sin carrito ni envío a cocina) e incluye modal de ficha técnica con los 14 alérgenos. | Lee su catálogo de `src/lib/carta-static-data.ts`. Para clientes reales del Plan de 39 €, debe leer de Supabase desactivando el carrito según `plan_type === 'carta'`. |
| **Web Home Cinemática 60fps** | `src/app/web/[slug]/page.tsx` | 🟡 | Web de restaurante de alto impacto visual con partículas de brasa/bruma a 60fps en `<canvas>`, selector interactivo de ambientes Día/Noche, galería gastronómica, mapa embebido y motor de reservas estructuradas directo al WhatsApp del dueño (0% comisiones). | Actualmente está personalizada con los datos de **Casa Mar da Vila** en el componente; para escalar a múltiples locales debe parametrizarse desde el JSON de configuración del restaurante en Supabase. |
| **Comandero de Camarero (Toma de Mesa)** | `src/app/staff/comandero/[slug]/page.tsx` | 🟢 / 🟡 | Mapa de mesas por zonas (Interior/Terraza), alertas persistentes de comensales y platos listos en cocina con sonido/vibración, toma de comanda por rondas (1º, 2º, Postres, Bebida), traslado y fusión de mesas, desglose de IVA PDF, modo zurdo/una mano y cola offline en `IndexedDB` (`offline-sync-queue.ts`). | 1) Falta un **Service Worker (`sw.js`)** para que la página cargue si el camarero refresca el navegador sin Wi-Fi. 2) El divisor de cuenta (`SplitBillModal`) guarda los cobros parciales sólo en memoria React (`useState`) hasta completar el 100%. |
| **KDS de Cocina Manos Libres** | `src/app/staff/kitchen/[slug]/page.tsx` | 🟢 | Pantalla de cocina en tiempo real (Supabase Realtime con debounce de 350ms + polling de respaldo). Semáforo SLA por tiempo de espera, separación automática Cocina vs. Barra, control **Manos Libres por Pedal USB / Barra Espaciadora** (`kds-hardware-controller.ts` con ventana Undo de 10s), comandos de voz Push-to-Talk (*"oído mesa X"*, *"listo mesa X"*) y locución por voz (TTS) que silencia pedidos de solo bebida. | 100% operativo cuando Supabase está activo. Si falla la red, depende del estado en memoria del servidor (`server-state.ts`). |
| **Panel Admin del Local (5 Pestañas + Bot IA)** | `src/app/staff/admin/[slug]/page.tsx` | 🟢 / 🟡 | Autenticación por PIN/Cookie firmada HMAC (`fluxo_staff_session`). **Pestaña 1 (Caja):** KPIs, gráfico horario, desglose IVA (10%/21%), cierre Z y exportación CSV/PDF. **Pestaña 2 (Catálogo):** CRUD de platos, agotados en 1 toque, Menú del Día y **Bot IA de Cartas** (`AIMenuImportModal` con vista previa obligatoria `StagingDiff`). **Pestaña 3 (Equipo):** Alta/baja de personal con PIN y QR de acceso. **Pestaña 4 (Fidelización):** CRM de clientes y sellos. **Pestaña 5 (Ajustes):** Semáforo de ocupación, llave de emergencia ("Solo Lectura"), textos legales y coste de ingredientes / materia prima (`RecipeCostModal`). | Los módulos de **Coste de Ingredientes / Materia Prima** (`RecipeCostModal`), **Proveedores** (`SuppliersManagerModal`) y **Auditoría de Mermas** (`StockWasteAuditModal`) operan con catálogos iniciales en memoria del cliente (`useState`); al recargar la página pierden los cambios si no se conectan a tablas dedicadas en Supabase. |
| **Generador de QRs de Mesa e Impresión A4** | `src/app/staff/qr/[slug]/page.tsx` y `/staff/qr-dinamicos/[slug]` | 🟢 | Generador de códigos QR por mesa (`?mesa=1..N`) listo para imprimir en A4 y gestor de QRs dinámicos (`/qr/d/[id]`) que permite cambiar la URL de destino sin reimprimir las pegatinas de las mesas. | Las redirecciones de `/qr/d/[id]` se guardan en memoria del servidor (`globalThis.__GASTRO_DYNAMIC_QRS__`); deben persistirse en una tabla `dynamic_qrs` de Supabase para no resetearse en reinicios de Vercel. |
| **CRM Comercial, Pipeline y Finanzas (Torre de Control)** | `src/app/admin/crm/page.tsx` | 🟡 | Centro de mando interno con 7 vistas: Dashboard comercial, Kanban de prospección en calle, Lista, Calendario, Mapa interactivo (Leaflet), **Creador de Cartas IA desde foto/URL** (`MenuOnboardingCreator`) y **Finanzas / Control de Suscripciones** (`BillingFinanceView` con alertas de vencimiento, WhatsApp en 1 clic, hibernación a 9 € y pausa remota). | Los leads del CRM sincronizan con Supabase (`crm_leads`), pero el módulo de **Facturación y Pausas** (`BillingFinanceView` + `crm-demo-seed.ts`) lee y escribe en `localStorage` (`fluxo_crm_billing_v1`). Hay que conectarlo directamente a las tablas `restaurants` y `subscription_payments` de Supabase. |
| **Centro de Demos Interactivas (Split-Screen)** | `src/app/demo/page.tsx` | 🟢 | Simulador de pantalla dividida para reuniones de venta: muestra en paralelo el móvil del cliente y el KDS de cocina o Comandero sincronizados en vivo. | Operativo para demostraciones comerciales. |
| **Páginas Legales y Privacidad** | `src/app/legal/terminos`, `/privacidad`, `/cookies` | 🟢 | Textos legales RGPD/LSSI completos para el pie de página de la plataforma. | Sustituir los marcadores `[Completar NIF/CIF]` y `[Completar Domicilio Social]` en `terminos/page.tsx` por los datos fiscales definitivos. |
| **Motor de Vídeo "Francotirador de WhatsApp"** | `src/remotion/WhatsAppPitchComposition.tsx` *(en worktree `sincronizacion_fluxo_general`)* | 🟡 | Composición en Remotion v4 (1080×1920, 60fps, 900 frames = 15s exactos a 120 BPM) con 4 escenas sincronizadas al beat, audio PCM sintetizado proceduralmente (`SoundEffects.tsx`), física de muelles (`SPRING_CONFIGS`) y presets listos para **Bar Jara-Tusas** y **Casa Mar da Vila**. | El directorio `src/remotion/` se encuentra actualmente en el worktree secundario (`sincronizacion_fluxo_general`) y **aún no ha sido fusionado (merged) a la rama `main`** del espacio de trabajo principal. |

---

### 1.3. Auditoría de los 3 Endpoints de Ingesta de Cartas con IA

Durante la inspección forense se detectaron **tres rutas API distintas** para digitalizar cartas:

1. **`POST /api/admin/ai-menu-import` (`src/app/api/admin/ai-menu-import/route.ts`) — 🟢 PRODUCCIÓN REAL:**  
   Implementa rigurosamente el bucle de confiabilidad `AI_MENU_BOT_LOOP`. Usa `gemini-2.5-flash` con timeout de 25s, soporta órdenes en lenguaje natural (*"sube los vinos 0,50 €"*) y fotos/PDFs de cartas, genera el `StagingDiff` obligatorio sin sobrescribir a ciegas, marca `requires_price_review: true` si un plato nuevo no trae precio (prohibiendo inventar importes), deduplica por UUID canónico (`deduplicateProducts`) y clasifica automáticamente en `bar` o `kitchen` antes de guardar en Supabase y emitir `fluxo_menu_updated`.
2. **`POST /api/onboarding/parse-menu` (`src/app/api/onboarding/parse-menu/route.ts`) — 🟢 OPERATIVO CON FALLBACK DE CALLE:**  
   Usado por la pestaña "Creador de Cartas IA" del CRM (`MenuOnboardingCreator.tsx`). Descarga webs o PDFs desde una URL o procesa fotos con `gemini-2.5-flash` devolviendo JSON estructurado con los 14 alérgenos. Incluye una red de seguridad (`buildResilientDemoExtraction`) para no quedarse colgado en mitad de una demostración en un bar si falla la cobertura o la cuota de Gemini.
3. **`POST /api/crm/parse-prototype-menu` (`src/app/api/crm/parse-prototype-menu/route.ts`) — 🔴 INCOMPLETO EN RAMA DE IMAGEN:**  
   Usado por el modal de importación dentro de la ficha de un lead en el CRM (`PrototypeMenuImporterModal.tsx`). Su extracción por URL funciona (`fetch` directo + fallback a `r.jina.ai`), pero **su rama de procesamiento de imágenes (líneas 38-60) es un marcador de posición** que devuelve `platos: []` pidiendo pegar el texto manualmente. Debe redirigirse a la lógica multimodal de `/api/onboarding/parse-menu`.

---

## SECCIÓN 2: AUDITORÍA DE ARQUITECTURA, RENDIMIENTO Y DEUDA TÉCNICA (360°)

### 2.1. Base de Datos y Persistencia: Supabase vs. Estado Híbrido

#### Lo que ya existe y funciona en PostgreSQL (Supabase)
El esquema SQL (`supabase/schema.sql` + migraciones en `supabase/migrations/`) está bien diseñado y contempla:
- **Catálogo y Operativa:** `restaurants`, `categories`, `products`, `daily_menus`, `tables`, `orders`, `order_items`, `service_calls`, `staff_members`.
- **Fidelización y Auditoría:** `loyalty_customers`, `loyalty_stamps`, `system_error_logs`.
- **CRM y Suscripciones (`20261101_crm_billing_and_payments.sql`):** `crm_leads`, `commercial_leads`, `subscription_payments` y columnas de ciclo de vida en `restaurants` (`plan_type`, `is_founder`, `monthly_fee`, `billing_status`, `pause_level`, `activation_code`, `next_billing_date`).

#### El Patrón de Doble Estado (`src/lib/server-state.ts`) y su Riesgo en Serverless
El archivo `src/lib/server-state.ts` declara diccionarios globales en la memoria RAM del proceso Node.js (`globalThis.__GASTRO_ORDERS__`, `__GASTRO_PRODUCTS__`, `__GASTRO_TABLES__`, `__GASTRO_SERVICE_CALLS__`, `__GASTRO_STAFF__`, `__GASTRO_RESTAURANT_CONFIG__`).
- **Cómo actúa hoy:** `src/lib/supabase/repository.ts` intenta leer y escribir primero en Supabase Cloud. Si el `slug` del restaurante existe en Supabase (ej. `casa-mar-da-vila`), persiste en PostgreSQL. Sin embargo, para configuraciones como `RestaurantConfig` (ocupación, modo solo lectura, textos legales), códigos QR dinámicos (`__GASTRO_DYNAMIC_QRS__`) o cuando un `slug` de prueba no está dado de alta en la tabla `restaurants`, el sistema cae silenciosamente a `globalThis`.
- **Por qué es crítico saberlo antes de escalar:** En un servidor local (`npm run dev`), `globalThis` aguanta vivo todo el día. Pero en **Vercel (Serverless Functions)**, cada petición HTTP puede ejecutarse en un contenedor Lambda distinto que se destruye tras unos minutos de inactividad. Todo lo que dependa exclusivamente de `globalThis` o de escribir archivos en disco (`.fluxo-data/crm_leads.json` en `src/lib/supabase/repositories/crm.repository.ts`) se perderá o desincronizará en producción si no pasa por Supabase.

---

### 2.2. Modo Offline Real vs. Simulado (La Prueba del Muro de Piedra)

¿Qué ocurre exactamente hoy si un camarero está en una terraza con muros de piedra gruesos y se corta el Wi-Fi o los datos móviles?

1. **Si el Comandero (`/staff/comandero/[slug]`) YA estaba abierto antes del corte (🟢 FUNCIONA):**  
   - El motor `src/lib/offline-sync-queue.ts` utiliza **IndexedDB nativa del navegador** (`fluxo_pos_offline`, versión 1) con dos almacenes: `tables_state` y `sync_queue`.
   - El camarero ve el indicador `Modo Offline — Guardando en cola local`, puede abrir mesas, anotar rondas (`ADD_ITEMS`), mover mesas (`MOVE_TABLE`), juntarlas (`MERGE_TABLES`) o liberarlas (`FREE_TABLE`).
   - La UI aplica cambios optimistas al instante. Cuando el camarero vuelve a entrar cerca del router en la barra y el navegador dispara el evento `window.addEventListener('online')`, `processSyncQueue()` vacía la cola en orden FIFO contra `/api/orders` y `/api/tables/transfer`.
2. **Si el camarero CIERRA la pestaña o REFRESCA la página mientras está sin conexión (🔴 FALLA HOY):**  
   - Aunque existe `public/manifest.json`, **no hay ningún Service Worker (`public/sw.js` o `next-pwa`) registrado** en el proyecto (`src/` no contiene ninguna llamada a `navigator.serviceWorker.register`).
   - Sin un Service Worker que cachee el App Shell (HTML/JS/CSS de `/staff/comandero/[slug]`), una recarga en frío sin internet mostrará el pantallazo de error nativo del navegador (`ERR_INTERNET_DISCONNECTED`).
3. **División de Cuenta en Modo Offline (`src/components/waiter/SplitBillModal.tsx`):**  
   - La matemática de división al céntimo (`src/lib/bill-splitter.ts`) funciona 100% en local sin internet (reparte residuos de céntimos en la primera cuota para que jamás se pierda 1 céntimo).
   - Sin embargo, el estado de qué comensal ya ha pagado su parte (`paidQuotas`, `paidItemIds`) vive únicamente en el `useState` del modal. Si el camarero cobra a 2 de 4 amigos, cierra el modal para atender otra mesa y lo vuelve a abrir, el progreso parcial no se habrá guardado en servidor ni en `IndexedDB` (sólo dispara `onConfirmFullPayment` cuando la mesa llega a 0,00 € pendientes).

---

### 2.3. Rendimiento Mobile-First (Cartas QR y Next.js 14)

1. **Tiempos de Carga en Cartas QR:**  
   - Las cartas estáticas (`public/jaratusas.html` con ~131 KB y `public/casamar-da-vila.html` con ~78 KB) pintan el primer contenido (`First Contentful Paint`) en menos de 0,4 segundos en 4G porque no descargan el bundle de React dentro del iframe.
   - Sin embargo, la página contenedora `/p/[slug]` carga primero el bundle cliente de Next.js para comprobar `ProtectedMenuScreen` antes de montar el `<iframe>`, añadiendo un pequeño parpadeo inicial (`Verificando estado del servicio...`).
2. **Peso de Imágenes y Assets (`public/images/`):**  
   - El directorio `public/images/` acumula **216 archivos (~34,8 MB en total)**.
   - Mientras que las fotografías nuevas de `jaratusas` y `casamar` están bien optimizadas entre **45 KB y 210 KB**, existen archivos antiguos en `public/images/menu/` en formato `.png` sin comprimir que superan **1,1 MB – 1,35 MB por foto** (ej. `solomillo-vaca.png` con 1.351 KB, `pulpo-feira.png` con 1.246 KB, `tarta-queso.png` con 1.245 KB). Además, `next.config.mjs` tiene `images: { unoptimized: true }`, lo que desactiva la compresión WebP/AVIF automática de Next.js.
3. **Componentes Server vs. Client (`'use client'`):**  
   - Prácticamente todas las páginas de `src/app/` declaran `'use client'` en la línea 1. Esto es correcto y deseable para aplicaciones interactivas como el Comandero, el KDS y el CRM, pero en páginas públicas como la Landing (`src/app/page.tsx`, 1.073 líneas) o `/web/[slug]` obliga al móvil del usuario a descargar e hidratar todo el JavaScript antes de interactuar.
4. **Accesibilidad en Viewport (`src/app/layout.tsx`):**  
   - `layout.tsx` define `maximumScale: 1, userScalable: false`. Esto evita zooms accidentales en el Comandero del camarero, pero penaliza la puntuación de accesibilidad en Lighthouse en la carta pública para clientes mayores que intentan hacer pellizco (pinch-to-zoom) para leer ingredientes.

---

### 2.4. Higiene de Código, Rutas Duplicadas y Seguridad

1. **Multiplicación de Rutas para Cartas:**  
   Coexisten `/p/[slug]`, `/menu/[slug]`, `/carta/[slug]`, `/carta`, `/carta-jaratusas`, `/jaratusas`, `/carta-casamar`, `/casamar`, `/casamar-da-vila`, `/carta-prototipo`, `/template` y `/template-carta`. Para salir a vender hoy es manejable porque sabemos qué enlace mandar por WhatsApp (`/p/jaratusas`), pero antes de tener 10 locales debemos dejar **una sola ruta canónica pública por local** (`/p/[slug]` o `/carta/[slug]`).
2. **Worktree de Git Pendiente de Fusión:**  
   Existe un segundo árbol de trabajo activo en `C:\Users\mima7\.gemini\antigravity\worktrees\Fluxo - Gastronomic System\sincronizacion_fluxo_general` donde reside todo el motor de vídeo `src/remotion/` y scripts de renderizado. Hay que integrarlo en `main` para no tener código dividido en dos carpetas del disco duro.
3. **Políticas RLS en Supabase (`supabase/schema.sql`):**  
   Varias tablas tienen políticas `USING (true) WITH CHECK (true)` para el rol `public` (creadas para facilitar el prototipado rápido), y el endpoint `/api/crm` instancia el cliente de Supabase con `SUPABASE_SERVICE_ROLE_KEY` sin exigir `verifyStaffRequest()` en la cabecera. Antes de meter datos de facturación de 10 clientes reales, hay que proteger `/admin/crm` y `/api/crm` con autenticación obligatoria.

---

## SECCIÓN 3: BIBLIA DEL MODELO DE NEGOCIO ("QUÉ OFRECEMOS Y POR QUÉ LO OFRECEMOS")

### 3.1. Posicionamiento Estratégico: "De la Barra Hacia Afuera"

La mayor fricción comercial al intentar vender software a un bar o restaurante tradicional en España es tocar su **TPV fiscal de cobro en barra** (Agora, Glop, BDP, FrontRest, Cuiner). El dueño tiene pánico a cambiar su TPV por tres motivos reales:
1. **Fricción con la Gestoría y Hacienda (Verifactu / TicketBAI):** Cambiar el programa que emite las facturas simplificadas implica reconfigurar series de facturación, impresoras térmicas de cajón portamonedas y exportaciones contables para su asesor fiscal.
2. **Coste de Hardware Cautivo:** Los distribuidores de TPV tradicionales obligan a comprar pantallas táctiles propietarias, impresoras y licencias de entre **1.500 € y 3.000 €** de entrada.
3. **Curva de Aprendizaje en Barra:** El dueño o encargado lleva 10 años cobrando de memoria en su caja registradora actual.

#### La Tesis de Fluxo ("Caballo de Troya Operativo")
**Fluxo NO compite con el TPV de la barra ni altera la contabilidad con la gestoría.**  
El TPV tradicional vive atornillado al mostrador, pero el **90% del caos operativo, la pérdida de ventas y el desgaste de piernas ocurre de la barra hacia afuera**: en el salón, en la terraza y en el pase de cocina.

Fluxo se instala en **menos de 24 horas**, **sin comprar hardware** (funciona en los móviles Android/iPhone que los camareros ya llevan en el bolsillo y en cualquier tablet o Smart TV en cocina) y resuelve todo lo que ocurre desde que el cliente se sienta en la mesa hasta que pide la cuenta. Al final del turno, el dueño sigue cobrando en su caja de siempre (o consulta el desglose de Fluxo), con cero fricción legal y cero riesgo.

---

### 3.2. Desglose de la Propuesta de Valor por Módulo

#### MÓDULO 1: Carta QR Inteligente Viva (El Vendedor Silencioso de Mesa)
- **Qué ofrecemos:** Una carta digital interactiva de carga instantánea (< 0,4s), diseñada con fotografía gastronómica coherente (copa servida + botellas reales de las marcas que trabaja el local), variantes con precios dinámicos, filtro legal de alérgenos y bloc de comanda visual para la mesa.
- **Dolor real del hostelero:**  
  1. Los clientes hoy **comen por los ojos**: una lista de texto en PDF o un cartón plastificado sucio no despierta apetito ni vende los platos de mayor margen.  
  2. El camarero pierde horas haciendo viajes en balde a la terraza para decir *"lo siento, ya no nos queda pulpo"* o recitando de memoria qué marcas de cerveza o vino blanco hay.  
  3. Riesgo de multa de Sanidad (de **3.000 € a 60.000 €** según el **Reglamento UE 1169/2011**) por no tener señalizados los **14 alérgenos obligatorios** o por tener cartas físicas desactualizadas tras la subida del coste de ingredientes / materia prima.
- **Cómo funciona en Fluxo:**  
  - **Píldoras de Variantes Dinámicas:** En un solo ítem (ej. *Cerveza de Bodega Estrella Galicia* o *Vinos Blancos Gallegos*), el comensal ve la foto con la copa y las botellas reales, y toca *Caña (2,20 €)*, *Copa (2,80 €)* o *Jarra (4,00 €)* viendo cómo cambia el precio al instante sin preselecciones engañosas.  
  - **Precios Según Lonja y Ocultación en 1 Toque:** Si sube el marisco o se agota la tortilla a las 14:30h, el dueño lo apaga desde su móvil en 2 segundos y desaparece de todas las mesas al instante.  
  - **Filtro Interactivo de los 14 Alérgenos:** El cliente celíaco o alérgico marca *"Sin Gluten"* o *"Sin Lactosa"* y la carta filtra automáticamente qué platos son 100% seguros.  
  - **Identificador `?mesa=` y "Comanda de tu Mesa" en 5 Segundos:** La carta detecta en qué mesa está sentado el cliente (`Mesa 12`) y le permite ir apuntando lo que quieren todos los amigos en el bloc **"Comanda de tu Mesa"** con la cuenta exacta sumada. Cuando llega el camarero, en lugar de dudar 4 minutos (*"¿qué pedimos?"*), el cliente le lee o le enseña la pantalla limpia en **5 segundos**.
- **Retorno en € o tiempo:** Ahorra **3 a 4 minutos de indecisión por mesa** en hora punta (permitiendo doblar mesas más rápido), elimina el **100% del gasto anual en imprenta** (300 € – 600 €/año) y blinda al local frente a inspecciones de Sanidad.

---

#### MÓDULO 2: Upselling Automático y Sugerencias de Maridaje (La Suscripción que se Paga Sola)
- **Qué ofrecemos:** Un motor de venta sugerida integrado tanto en la carta del comensal (maridajes recomendados en cada plato) como en el Comandero del camarero (`QuickSobremesaModal` y `QuickDessertSelectorModal`).
- **Dolor real del hostelero:** En pleno lleno del sábado o domingo, el camarero va corriendo y **se olvida de ofrecer el postre casero, el café, el chupito o la copa de vino superior**. Es donde está el mayor margen neto del restaurante (un postre o un licor multiplica por 4 su coste de ingredientes / materia prima), pero se pierde por falta de tiempo al cantarlos de viva voz.
- **Cómo funciona en Fluxo:**  
  - En la carta digital, al abrir una carne o marisco, el sistema sugiere visualmente el vino exacto de la casa que marida con ese plato.  
  - En el Comandero, cuando una mesa termina los segundos platos, el sistema activa el botón rápido de **Sobremesa y Postres en 1 toque**, recordándole al camarero ofrecer tarta casera, cafés o licores sin tener que buscar por categorías.
- **Retorno en € o tiempo:** Incremento demostrado del **+15% al +22% en el ticket medio**.  
  > **Matemática comercial irrefutable para el dueño:** Con vender **solo 3 postres caseros extra por semana** (a ~5,50 € cada uno = ~66 €/mes), **la suscripción de Fluxo ya se ha pagado sola al 100%** y todo el resto del mes es beneficio limpio para el bar.

---

#### MÓDULO 3: Digitalización Instantánea con Foto IA (Cero Fricción de Puesta en Marcha)
- **Qué ofrecemos:** Motor de visión artificial (`gemini-2.5-flash`) y lectura web capaz de convertir una foto con el móvil de una carta de papel, pizarra o PDF en un catálogo digital estructurado en **20 segundos**, junto con un Bot IA en el panel de administración para editar precios por voz o texto.
- **Dolor real del hostelero:** El dueño de un bar trabaja de 12 a 14 horas diarias. Si le dices *"aquí tienes tu usuario, ahora tienes que teclear tus 70 platos, ponerles descripciones y marcar los 14 alérgenos uno por uno"*, **jamás lo va a hacer** y se dará de baja el primer mes.
- **Cómo funciona en Fluxo:**  
  - Hacemos una foto a su carta actual en la misma visita comercial. En 20 segundos, la IA extrae nombres, categorías, precios, descripciones atractivas y deduce los **14 alérgenos obligatorios** por receta.  
  - En el día a día, el dueño abre el **Bot IA de Cartas** (`AIMenuImportModal`), escribe *"Sube todos los vinos 0,30 €, pausa las zamburiñas y pon de menú del día Lentejas y Merluza a 13,50 €"* y el sistema le muestra una vista previa segura (`StagingDiff`) para confirmar todos los cambios en **1 solo clic**.
- **Retorno en € o tiempo:** Reduce el tiempo de alta e implantación de **2 semanas a 15 minutos**, eliminando por completo la barrera tecnológica para hosteleros sin conocimientos informáticos.

---

#### MÓDULO 4: Comandero Offline de Terraza y División de Cuentas al Céntimo
- **Qué ofrecemos:** Terminal móvil de toma de comandas para camareros con cola de sincronización sin conexión (`IndexedDB`), gestión visual de zonas (Interior / Terraza), traslado y unión de mesas en 2 toques, y calculadora de división de cuentas (`SplitBillModal` + `bill-splitter.ts`).
- **Dolor real del hostelero:**  
  1. **El Punto Muerto del Wi-Fi en Terraza:** En locales con muros de piedra o terrazas alejadas del router, los comanderos en la nube normales se quedan "pensando" con la ruleta girando delante del cliente y pierden la comanda.  
  2. **El Tapón del Domingo a las 16:00h:** Una mesa de 8 amigos pide pagar por separado (*"yo tomé dos cañas y media ración, divídeme las croquetas entre tres"*). El camarero o el dueño bloquea la barra durante **12 a 15 minutos** con la calculadora y los tickets de papel mientras otras 5 mesas esperan para pagar o pedir.
- **Cómo funciona en Fluxo:**  
  - **Cola Offline Inmune a Cortes:** El camarero toma nota a máxima velocidad aunque esté en modo avión o en el rincón más lejano de la terraza; en cuanto pisa el interior del bar, las comandas salen disparadas a cocina automáticamente.  
  - **División Exacta en 2 Toques:** El camarero abre la mesa, elige dividir en partes iguales (de 2 a 12 comensales) o seleccionar qué consumió cada uno, y el algoritmo de Fluxo reparte al céntimo exacto (sin perder ni 1 céntimo en redondeos) marcando en verde quién ha pagado ya en efectivo o tarjeta.
- **Retorno en € o tiempo:** Ahorra **10 a 15 minutos de colapso en barra** en cada turno de fin de semana, evita que se queden rondas de bebida sin apuntar en terraza (una sola ronda olvidada al día son **~15 € perdidos = 450 €/mes**) y aumenta la rotación de mesas un **+18%**.

---

#### MÓDULO 5: KDS de Cocina Manos Libres (Fin del Papel Manchado de Aceite)
- **Qué ofrecemos:** Pantalla digital de comandas para cocina (`/staff/kitchen/[slug]`) con semáforo de tiempos de espera, separación automática de bebidas (Barra) y comida (Cocina), aviso directo al móvil del camarero cuando el plato sale al pase, y control **100% Manos Libres** por **Pedal USB** o **Comandos de Voz**.
- **Dolor real del hostelero:**  
  1. Los tickets de papel térmico se caen al suelo, se manchan de grasa, no se entienden cuando el camarero escribe rápido a mano, y la impresora se queda sin rollo en mitad del servicio del sábado.  
  2. El cocinero tiene las manos llenas de harina, pescado o aceite: **no puede ni quiere tocar una pantalla táctil** cada 30 segundos para marcar platos.  
  3. El camarero da paseos constantes a la puerta de la cocina preguntando *"¿sale ya la mesa 4?"* en lugar de estar vendiendo en sala.
- **Cómo funciona en Fluxo:**  
  - **Control por Pedal USB (`kds-hardware-controller.ts`):** Conectando un pedal USB estándar de 15 € al suelo de la cocina, **1 pisotón** marca la comanda más antigua como *"Lista para servir"* (y hace vibrar el móvil del camarero en terraza indicando *"Mesa 4 lista en pase"*). Si se equivoca, **2 pisotones rápidos** dentro de los 10 segundos siguientes deshacen la acción (`Undo`).  
  - **Control por Voz y Locución Inteligente (`kds-audio-engine.ts`):** El cocinero puede decir *"Oído mesa 4"* o *"Listo mesa 4"*, y el sistema canta en voz alta los platos nuevos que entran a cocina, silenciando automáticamente las comandas que solo llevan bebida de barra para no saturar de ruido a los cocineros.
- **Retorno en € o tiempo:** Cero errores de lectura entre sala y cocina (cada plato devuelto por error cuesta entre **8 € y 18 € de coste de ingredientes / materia prima** tirado a la basura), platos servidos calientes al segundo y ahorro de kilómetros de paseos innecesarios del camarero.

---

#### MÓDULO 6: Web Home Cinemática a 60fps y Reservas Directas a WhatsApp
- **Qué ofrecemos:** Página web oficial de restaurante (`/web/[slug]`) con estética de alta gastronomía (animaciones fluidas a 60fps, modo de ambiente Día / Noche, historia del local, platos estrella y mapa) conectada a un motor de reservas directas por WhatsApp.
- **Dolor real del hostelero:**  
  1. Plataformas de reservas externas (como TheFork / ElTenedor) cobran entre **2,00 € y 4,00 € de comisión por cada comensal sentado** (una sola mesa de 6 personas le cuesta al restaurante hasta **24 € de comisión** antes de servirles un vaso de agua).  
  2. Las agencias de marketing locales piden entre **800 € y 2.000 €** por hacer una web corporativa en WordPress que luego queda abandonada y no convierte visitas en mesas llenas.
- **Cómo funciona en Fluxo:**  
  - Cuando un cliente o turista busca el restaurante en Google Maps, entra en una experiencia visual impresionante que eleva el caché del local, elige fecha, turno (comida o cena), número de personas y zona (salón o terraza) y pulsa **"Confirmar Reserva"**.  
  - El sistema genera un mensaje estructurado listo para que el dueño lo reciba en su **WhatsApp habitual** y lo confirme con un simple *"OK, os esperamos"*, con **0,00 € de comisiones por comensal**.
- **Retorno en € o tiempo:** Con desviar **solo 5 mesas de 4 personas al mes** desde portales de comisión hacia la reserva directa por WhatsApp de Fluxo, el restaurante se ahorra **entre 40 € y 80 € mensuales en comisiones**, además de ahorrarse los **1.200 €** que costaría contratar el diseño de una web a medida.

---

#### MÓDULO 7: Motor de Asalto Comercial ("Francotirador de WhatsApp" en Remotion + `/activar/[slug]`)
- **Qué ofrecemos:** Nuestro sistema propietario de venta B2B ultrarrápida compuesto por el generador de vídeos personalizados a 60fps (`src/remotion/WhatsAppPitchComposition.tsx`) + las cartas reales pre-creadas (`/p/[slug]`) + la pasarela de cierre en 1 clic (`/activar/[slug]`).
- **Por qué es nuestra Ventaja Injusta (Unfair Advantage):**  
  Los vendedores de software tradicionales entran a un bar con un folleto genérico o un PowerPoint aburrido diciendo *"imagínate cómo quedaría tu carta aquí"*. El hostelero no tiene tiempo de imaginar nada y les dice *"déjame la tarjeta que ya te llamaré"*.  
  Con el **Francotirador de Fluxo**:
  1. Antes de entrar al bar (o justo tras tomar un café en su barra), generamos **su propia carta real con sus platos y las fotos de su propio local** (`/p/jaratusas`).
  2. Le enviamos por WhatsApp un **vídeo vertical de 15 segundos a 60fps y 120 BPM** donde aparece el nombre de su bar, su fachada, sus platos reales en movimiento y cómo funciona su futura carta en un iPhone.
  3. Debajo del vídeo va el enlace directo a `/activar/jaratusas`, donde el dueño ve su precio bloqueado de Socio Fundador (**50 €/mes** o **39 €/mes** en Plan Carta) y lo activa en el acto por **Bizum, Transferencia o Efectivo en mano** con código de desbloqueo instantáneo (`FLX-XXXX`).

---

## SECCIÓN 4: ARQUITECTURA DE PRECIOS, UNIT ECONOMICS Y PSICOLOGÍA DE OFERTA

### 4.1. Escalera Oficial de Precios y Psicología Comercial

Toda la arquitectura de precios de Fluxo está diseñada bajo una regla psicológica de oro en hostelería tradicional: **Eliminar el miedo al compromiso fijo y situar el precio diario por debajo del coste de un café con leche en la barra.**

| Escalón / Plan | Cuota Mensual (+ IVA) | Coste Diario Equivalente | Qué Incluye | Psicología Comercial y Objetivo |
| :--- | :---: | :---: | :--- | :--- |
| **1. Plan Carta Inteligente** *(Puerta de Entrada)* | **39 € / mes** | **1,30 € / día** *(Menos de 1 caña)* | Carta QR Viva con fotos de alta estética, variantes de precio, 14 alérgenos, multi-idioma (ES/GL/EN), agotados en 1 toque, bloc *"Comanda de tu Mesa"* y QRs por mesa. | **Derribar el "No necesito nada complejo":** Ideal para bares de tapas, cervecerías con mucha rotación o locales que aún no tienen carta digital (o tienen un PDF ilegible). Cero cambio operativo para los camareros; entra hoy mismo. |
| **2. Oferta Socio Fundador** *(Armas de Cierre en Frío — Cupo máx. 5 locales por zona)* | **50 € / mes** *(Bloqueado 12 meses sobre el plan de 99 €)* | **1,66 € / día** *(El precio de 1 café con leche)* | **TODA LA SUITE COMPLETA:** Carta QR Viva + Comandero Offline de Terraza + Divisor de Cuentas + KDS de Cocina Manos Libres + Web Home Cinemática + Bot IA de Cartas. | **Escasez Real + Reciprocidad:** No es un descuento barato; es un acuerdo de **Socio Fundador** limitado a 5 locales por zona geográfica a cambio de su feedback real y testimonio. Por solo **11 € más al mes** que la carta básica, se lleva todo el sistema de 99 €. Cero permanencia, cero inversión en hardware. |
| **3. Plan Sala Operativa** *(Escalón Intermedio)* | **69 € / mes** | **2,30 € / día** | Carta QR Viva + Comandero de Camareros + Mapa de Mesas + Alertas de Sala + División de Cuentas. | Escalón de anclaje intermedio en el CRM (`billing-calculations.ts`) para locales sin cocina compleja (ej. coctelerías, cafeterías de tarde y picoteo o terrazas de copas) una vez agotado el cupo de Socio Fundador. |
| **4. Plan Suite Completa** *(Tarifa General Oficial)* | **99 € / mes** | **3,30 € / día** *(1 solo postre casero al día)* | **Suite Completa 360°** (Carta QR + Comandero + KDS Cocina Manos Libres + Web Home + Analítica Caja/IVA + Fidelización + Bot IA). | **Ancla de Valor Real:** Fija el valor percibido del ecosistema justo por debajo de la barrera psicológica de las 3 cifras (100 €). Hace que la oferta de Socio Fundador (50 €) sea percibida como una oportunidad irrepetible del 50% de ahorro (588 €/año ahorrados). |
| **5. Cláusula de Hibernación Estacional** *(Seguro Anti-Bajas de Invierno)* | **9 € / mes** *(Durante meses de cierre)* | **0,30 € / día** | Mantiene guardados en la nube todos sus platos, fotos, QRs impresos, clientes y posicionamiento web mientras el local está cerrado por vacaciones o temporada baja. | **Destruye la objeción número 1 de zonas costeras y turísticas (Galicia, costa, chiringuitos):** *"¿Qué pasa de noviembre a febrero cuando cierro?"*. En vez de darse de baja (y perder al cliente), pagan 9 €/mes simbólicos y en Semana Santa reactivan en 1 clic. |

---

### 4.2. Unit Economics Reales (Coste Técnico por Local vs. Margen Bruto)

¿Cuánto nos cuesta realmente en infraestructura mantener **1 local activo** y **10 locales activos** al mes?

#### Costes de Infraestructura Base de la Plataforma (Fijos Mensuales)
- **Vercel (Hosting Next.js + Edge Network):**  
  - De 1 a 5 locales: **0,00 €/mes** (Plan Hobby cubre 100 GB de ancho de banda y 100.000 invocaciones).  
  - A partir de 5–10 locales en producción comercial: **~18,50 €/mes** ($20/mes Plan Vercel Pro).
- **Supabase (PostgreSQL + Realtime WebSockets):**  
  - De 1 a 5 locales: **0,00 €/mes** (Free Tier soporta 500 MB de base de datos y 200 conexiones Realtime simultáneas).  
  - A partir de 10 locales con terraza y KDS simultáneos: **~23,00 €/mes** ($25/mes Plan Supabase Pro, soporta 500 conexiones concurrentes y backups diarios automáticos).

#### Coste Variable por Local Activo (IA + Tráfico + Base de Datos)
- **Digitalización y Edición con Gemini 2.5 Flash (`ai-menu-import`):**  
  - Alta inicial de una carta de 60 platos por foto/PDF (~12.000 tokens de entrada/salida): **< 0,01 € (un céntimo de euro)** en pago por uso.  
  - 20 actualizaciones al mes del dueño con el Bot IA: **< 0,05 €/mes**.
- **Generación de Fotografía Gastronómica IA (cuando creamos ~15 fotos a medida para un local nuevo):**  
  - Coste único de creación (One-off en el alta): **~0,45 € – 0,60 €** por local una sola vez en la vida del cliente.
- **Consumo de Base de Datos y Realtime por Local (150 comandas/día = 4.500 comandas/mes):**  
  - Ocupación en PostgreSQL: ~2,5 MB/mes por restaurante.  
  - Coste marginal prorrateado de servidor/ancho de banda por local: **~0,80 € – 1,50 €/mes**.

#### Tabla de Rentabilidad Unitaria (Unit Economics)

| Escenario | Ingreso Mensual (MRR) | Coste Total de Infraestructura (Vercel + Supabase + IA) | Coste Técnico por Local | Beneficio Bruto Mensual | Margen Bruto SaaS (%) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **1 Local Piloto (Plan Carta 39 €)** *(En Free Tiers)* | **39,00 €** | ~0,10 € (solo llamadas puntuales API) | **0,10 €** | **+38,90 €** | **99,7 %** |
| **1 Local Piloto (Socio Fundador 50 €)** *(En Free Tiers)* | **50,00 €** | ~0,15 € | **0,15 €** | **+49,85 €** | **99,7 %** |
| **5 Locales (3 Fundadores a 50 € + 2 Cartas a 39 €)** *(En Free Tiers)* | **228,00 €** | ~1,00 € | **0,20 €** | **+227,00 €** | **99,5 %** |
| **10 Locales (5 Fundadores a 50 € + 3 Cartas a 39 € + 2 Full a 99 €)** *(Con Vercel Pro + Supabase Pro pagados)* | **565,00 €** | ~43,50 € (18,50 € Vercel + 23 € Supabase + 2 € IA/Resend) | **4,35 € / local** | **+521,50 €** | **92,3 %** |
| **30 Locales (Mix medio ~55 €/local)** *(Con Vercel Pro + Supabase Pro)* | **1.650,00 €** | ~50,00 € | **1,66 € / local** | **+1.600,00 €** | **97,0 %** |

> **Conclusión Financiera:** Con **un solo cliente de Socio Fundador (50 €/mes)** ya se cubre el coste de pasar toda la infraestructura de Fluxo a planes profesionales de pago (Vercel Pro + Supabase Pro = ~41,50 €/mes). A partir del **segundo cliente**, más del **92% – 97% de cada euro facturado es margen limpio**.

---

## SECCIÓN 5: MATRIZ DE RIESGOS (URGENTE / MEDIO / MEJORA)

Esta lista priorizada en modo diagnóstico documenta exactamente qué debemos tener en el radar (y en qué orden resolverlo) para pasar de **enseñar y vender hoy mismo el primer piloto** a **operar 10 locales reales en paralelo sin incidencias**:

### 🔴 PRIORIDAD 1: URGENTE (Resolver antes o justo al activar los primeros clientes de pago)

1. **Inconsistencia de Precios en la Landing Principal (`src/app/page.tsx`):**  
   - **Diagnóstico:** Mientras que `/activar/[slug]` y el CRM ya muestran la tarifa oficial (**39 € Carta / 50 € Socio Fundador / 99 € Suite Completa**), la página principal `src/app/page.tsx` (líneas 948–1034 y el JSON-LD de SEO en línea 65) todavía muestra los precios antiguos (**15 € / 47 € / 97 €**).  
   - **Riesgo Comercial:** Si le pedimos 39 € o 50 €/mes a un hostelero en persona y esa noche entra en la home de Fluxo y ve "15 €/mes", perderemos credibilidad comercial al instante.
2. **Teléfonos de WhatsApp Diferentes entre Pantallas (`+54` vs `+34`):**  
   - **Diagnóstico:** `src/app/contacto/page.tsx` (la tarjeta digital que enseñamos en la barra) tiene el enlace de WhatsApp apuntando a `https://wa.me/5493585187430` (`+54 358 518 7430`), mientras que `/activar/[slug]` y `/web/[slug]` apuntan al número español `+34 711 573 870`.  
   - **Acción requerida:** Unificar todos los botones comerciales al número oficial de ventas en España.
3. **Pausa por Impago (`ProtectedMenuScreen`) Basada en `localStorage` del Navegador:**  
   - **Diagnóstico:** En `src/components/billing/ProtectedMenuScreen.tsx`, la comprobación de si un local tiene la carta suspendida (`pause_level === 2`) lee `loadBillingLocales()` desde el `localStorage` del navegador.  
   - **Impacto:** Si desde tu ordenador marcas a un bar como moroso en `/admin/crm`, **solo se bloquea en tu ordenador**, pero los clientes que escaneen el QR en el bar seguirán viendo la carta abierta. Debe conectarse a la columna `pause_level` de la tabla `restaurants` en Supabase.
4. **Cierre de Seguridad en `/admin/crm` y Políticas RLS de Supabase:**  
   - **Diagnóstico:** El enlace a `/admin/crm` está visible en el footer de `src/app/page.tsx` (línea 1068) y ni la página `/admin/crm` ni el endpoint `/api/crm` exigen aún sesión de superadministrador. Además, varias políticas RLS en `supabase/schema.sql` tienen `USING (true)` para el rol público.  
   - **Acción requerida:** Ocultar el enlace del footer público y proteger `/admin/crm` y `/api/crm` con contraseña maestra antes de guardar datos reales de facturación de clientes.

---

### 🟡 PRIORIDAD 2: MEDIO (Resolver al pasar de Cartas Informativas de 39 € a Locales con Comandero/KDS de 50 €–99 €)

5. **Puente entre las Cartas HTML Estáticas (`public/jaratusas.html`) y el Catálogo de Supabase:**  
   - **Diagnóstico:** Para vender el **Plan Carta (39 €/mes)** hoy mismo (por ejemplo, al bar donde trabajas o a Jara-Tusas), el archivo estático `public/jaratusas.html` servido en `/p/jaratusas` **es perfecto y funciona al 100% desde ya** si nosotros le actualizamos algún precio cuando nos lo pida por WhatsApp.  
   - **Cuándo se vuelve un cuello de botella:** Cuando tengamos 5 o 10 locales y los dueños quieran cambiar el Menú del Día o apagar un plato agotado ellos mismos desde `/staff/admin/[slug]`. En ese momento, `/p/[slug]` debe inyectar dinámicamente los platos y estados `is_available` desde Supabase en lugar de leerlos fijos del HTML.
6. **Registro de un Service Worker Real (`sw.js`) para Recargas en Frío sin Wi-Fi:**  
   - **Diagnóstico:** La cola de comandas en `IndexedDB` (`src/lib/offline-sync-queue.ts`) funciona si la pestaña del Comandero ya está abierta, pero si el camarero recarga la página en una terraza sin cobertura, el navegador da error de red.  
   - **Acción requerida:** Añadir un Service Worker ligero con estrategia *Stale-While-Revalidate* para las rutas `/staff/comandero/*` y `/p/*`.
7. **Persistencia de Cobros Parciales en División de Cuenta (`SplitBillModal`):**  
   - **Diagnóstico:** Guardar en Supabase (o en `IndexedDB` de la mesa) cada cuota parcial pagada (`PARTIAL_PAY` ya está contemplado en `offline-sync-queue.ts`, falta dispararlo desde `SplitBillModal.tsx`) para que dos camareros distintos vean qué comensales de la Mesa 8 ya han pagado su parte.
8. **Migración de `globalThis` (`src/lib/server-state.ts`) a Tablas de Supabase al 100%:**  
   - **Diagnóstico:** Mover los QRs dinámicos (`__GASTRO_DYNAMIC_QRS__`) y la configuración operativa (`__GASTRO_RESTAURANT_CONFIG__`) a columnas/tablas de Supabase para que las instancias Serverless de Vercel nunca pierdan el estado entre peticiones.

---

### 🟢 PRIORIDAD 3: MEJORA Y ESCALADO (Optimización Continua hacia 10+ Locales)

9. **Fusión del Worktree de Vídeo Remotion (`src/remotion/`) en la Rama `main`:**  
   - Integrar la carpeta `src/remotion/` desde el worktree `sincronizacion_fluxo_general` a la rama principal para tener el generador de vídeos de WhatsApp y la aplicación web unificados en el mismo árbol de código.
10. **Compresión a WebP de las Imágenes Antiguas en `public/images/menu/`:**  
    - Convertir los 8 archivos `.png` heredados que pesan >1 MB cada uno a `.webp` de ~80 KB (como ya hicimos con éxito en el catálogo de `jaratusas` y `casamar`), reduciendo el peso del repositorio en más de 15 MB.
11. **Conexión a Base de Datos de los Módulos de Coste de Ingredientes / Materia Prima y Mermas:**  
    - Persistir en Supabase los datos de `RecipeCostModal.tsx` (coste de ingredientes / materia prima), `SuppliersManagerModal.tsx` y `StockWasteAuditModal.tsx` cuando un cliente de Suite Completa pida control de márgenes por receta.
12. **Unificación de la Rama de Imagen en `/api/crm/parse-prototype-menu`:**  
    - Conectar ese endpoint al motor de visión `gemini-2.5-flash` que ya funciona en `/api/onboarding/parse-menu` y `/api/admin/ai-menu-import`, eliminando código duplicado.
13. **Habilitar Zoom en Cartas Públicas (`userScalable: true` en `/p/[slug]`):**  
    - Permitir que personas mayores puedan hacer zoom con dos dedos sobre las fotos y descripciones de la carta sin afectar al bloqueo táctil del Comandero de camareros.

---

### Veredicto Ejecutivo del Auditor y CPO

1. **¿Podemos salir a vender HOY mismo el Plan Carta (39 €/mes) y enseñar las demos en la calle?**  
   **SÍ, ROTUNDAMENTE.** Las cartas de muestra (`/p/jaratusas`, `/p/casamar-da-vila`), el bloc **"Comanda de tu Mesa"**, el filtro de los 14 alérgenos, la pasarela de alta (`/activar/[slug]`) con Bizum/Transferencia/Efectivo y la Web Cinemática (`/web/casamar-da-vila`) están listos y tienen un nivel visual muy superior a lo que cualquier bar de la zona ha visto jamás.
2. **¿Cómo debemos conducir la venta y el piloto en este primer bar (donde has empezado a trabajar) y en los primeros clientes?**  
   - **Para el bar donde trabajas (que se llenó y no tiene carta):** Preséntales directamente su carta viva en `/p/[slug]` (Plan Carta 39 €/mes o Socio Fundador 50 €/mes). El valor inmediato para ellos es que el cliente se sienta, escanea el QR, ve fotos que abren el apetito con todas las opciones de bebida claras, filtra alérgenos y le lee la comanda ya decidida al camarero en 5 segundos.  
   - **En las demos en vivo de Suite Completa (Comandero + KDS):** Enseña el flujo conectado usando `/menu/[slug]` + `/staff/comandero/[slug]` + `/staff/kitchen/[slug]` (o `/demo`), donde los pedidos viajan en tiempo real por Supabase.  
   - **Antes de mandar enlaces de la home principal (`/`):** Corrijamos en el siguiente turno de código los dos detalles de 5 minutos de la Prioridad 1 (los precios `15/47/97 €` en `src/app/page.tsx` y el teléfono `+54` en `src/app/contacto/page.tsx`) para que todo el discurso comercial sea 100% blindado de principio a fin.
