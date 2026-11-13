# 🍽️ INVESTIGACIÓN: LA HOME PAGE GASTRONÓMICA PERFECTA (Webs Oficiales Fluxo `/web/[slug]`)

> **Departamento:** 3 — Diseño de Marca & Presencia Web (con Depto 4 Ingeniería y Depto 2 Marketing)
> **Fecha:** 12/11/2026 · **Decisión asociada:** DEC-38
> **Plan de implementación:** [`docs/superpowers/plans/2026-11-12-web-home-gastronomica.md`](../../superpowers/plans/2026-11-12-web-home-gastronomica.md)

---

## 0. Método y límites (léelo antes de usar los datos)

| Fuente de evidencia | Estado |
| :--- | :--- |
| Estudios de consumidor (Popmenu 2026, Owner, MGH, BrightLocal 2026, Uberall 2026, IAB Spain 2026) | ✅ Leídos en la fuente o en la nota de prensa original |
| Documentación oficial (web.dev, Google Search Central, Schema.org, BOE/AESAN) | ✅ Leída en la fuente |
| Inspección visual en vivo de BentoBox / Popmenu / Owner / SpotHopper / Awwwards con navegador | ❌ **BLOQUEADA**: Chrome no tenía depuración remota activa. Se sustituyó por lectura de páginas (texto) y de sus blogs/casos |
| Webs de referentes españoles (Sagardi, Grupo La Rumba, Goiko) | ⚠️ **Parcial**: las páginas son JS pesado; el lector solo extrajo texto mínimo. No se afirma nada de su estructura que no se haya podido ver |
| Comparativa de conversión WhatsApp vs TheFork/OpenTable/CoverManager | ⚠️ **No existe estudio público** que compare tasas de conversión. Se dan costes verificables y una hipótesis a medir |

**Sesgos a tener en cuenta:** casi todos los estudios con cifras son de EE. UU. y los publican proveedores que venden webs (Popmenu, Owner, SpotHopper). Las cifras propias de proveedores ("+270 % de pedidos") son marketing, no evidencia independiente; se marcan como tales.

---

## 1. Estadísticas clave de comportamiento del comensal

### 1.1 Qué busca en los primeros segundos

| # | Dato | Fuente (muestra) | Implicación para la Home |
| :-: | :--- | :--- | :--- |
| 1 | **80 %** de los clientes entra a la web principalmente para ver la carta; **84 %** mira las fotos de los platos antes de pedir; **61 %** dice que las fotos de platos son de lo más importante de la web | Owner, encuesta a 1.300 comensales EE. UU. — [owner.com/blog/restaurant-website-design](https://www.owner.com/blog/restaurant-website-design) | La carta (con fotos) es el contenido principal, no un enlace escondido |
| 2 | **72 %** visita la web antes de ir a comer en persona; **91 %** antes de pedir para llevar | Owner (ídem) | La web decide la visita física, no solo el pedido online |
| 3 | **45 %** dedica **45 s o menos** a mirar una carta online; **36 %** menos de 30 s | Popmenu Consumer Trends 2026, 3.000 consumidores EE. UU. — [get.popmenu.com/toolkit/consumer-trends-study-2026](https://get.popmenu.com/toolkit/consumer-trends-study-2026) | Hay que enseñar platos estrella y precio sin obligar a navegar |
| 4 | **74 %** busca reseñas u ofertas en la web | Owner (ídem) | Prueba social visible en la Home |
| 5 | **45 %** es más propenso a elegir un local tras conocer cómo empezó | Popmenu 2026 | Bloque "Historia" corto, con cara del dueño/cocinero |
| 6 | **58 %** busca por un plato o tipo de cocina concreto; **60 %** con términos genéricos | Popmenu 2026 | Los platos deben existir como texto HTML indexable ("pulpo", "zamburiñas") |

### 1.2 Qué provoca el rebote

| # | Dato | Fuente | Implicación |
| :-: | :--- | :--- | :--- |
| 7 | **68 %** se ha echado atrás de visitar un restaurante por su web; 1 de cada 3 por navegación difícil; **36 %** por la fotografía de comida | MGH, 1.101 adultos EE. UU., 2019 — [prnewswire](https://prnewswire.com/news-releases/survey-nearly-70-of-us-diners-say-a-restaurants-website-has-discouraged-them-from-visiting-300909229.html), [nrn.com](https://nrn.com/supplier-news/websites-drive-or-deter-dining-behavior) | Foto mala = peor que no tener foto |
| 8 | **42 %** se salta webs "aburridas" (sin fotos, vídeos ni reseñas); **80 %+** prefiere una carta con fotos y reseñas frente a una carta solo texto | Popmenu 2026 | La carta en texto plano o PDF pierde frente a la competencia |
| 9 | **69 %** dice que una web confusa o mal diseñada le hace menos propenso a pedir | Owner | — |
| 10 | Al pasar la carga en móvil de **1 s a 3 s**, la probabilidad de rebote sube un **32 %**; de 1 s a 5 s, un **90 %** | Google / Think with Google (estudio de páginas móviles) | Rendimiento = conversión |
| 11 | **38 %** pasa directamente a otro local si no le cogen el teléfono; 46 % lo intenta una vez más | Popmenu 2026 | Si la reserva va a WhatsApp, el local **tiene que responder rápido** (ver §1.4) |
| 12 | Carta en PDF: no hay estudio independiente que mida su rebote exacto. Google recomienda tener el contenido importante en texto, y un PDF/foto de carta no se lee bien en móvil ni lo usan bien buscadores/IA | Guía de Google para funciones de IA (citada en [venuesmith.com](https://venuesmith.com/blog/get-your-restaurant-recommended-by-ai-assistants)); la cifra de "1 de cada 3 abandona por PDF" que circula **no tiene fuente primaria verificable** | Prohibido el PDF como única carta |

### 1.3 Qué multiplica la confianza y la visita

| # | Dato | Fuente | Implicación |
| :-: | :--- | :--- | :--- |
| 13 | **97 %** lee reseñas; **68 %** solo usa negocios con **4★ o más** (55 % en 2025); **31 %** exige **4,5★+** (17 % en 2025); **54 %** visita la web tras leer reseñas positivas | BrightLocal LCRS 2026, 1.002 adultos EE. UU. — [brightlocal.com](https://brightlocal.com/research/local-consumer-review-survey) | Mostrar nota y nº de reseñas de Google arriba |
| 14 | **47 %** no usa un negocio con menos de 20 reseñas en Google | BrightLocal (ídem) | El sistema de "Reseñas 1 toque" (DEC-07/DEC-21) alimenta la web |
| 15 | Platos con foto reciben **casi el doble** de pedidos online | Popmenu (dato propio de plataforma) | Foto en todos los platos estrella |
| 16 | Añadir titular claro arriba y destacar platos populares sube la conversión de **2–3 % a más de 15 %** | Owner (dato propio, sin metodología pública) | Se trata como hipótesis a validar con nuestros datos |
| 17 | España: **WhatsApp 94 %** de penetración mensual y **97 %** de uso diario entre usuarios de redes | IAB Spain, Estudio de Redes Sociales 2026 — [iabspain.es](https://iabspain.es/iab-spain-presenta-estudio-rrss-2026) | WhatsApp es el canal natural para reservar en España |

### 1.4 Reserva por WhatsApp estructurado vs. motores con comisión

| Criterio | WhatsApp estructurado (Fluxo) | TheFork (marketplace) | OpenTable / CoverManager |
| :--- | :--- | :--- | :--- |
| Coste por comensal | **0 €** | Comisión por comensal sentado, % no publicado; estimaciones del sector **1,50–4 €/cubierto** (fuentes secundarias españolas, no oficiales). Reservas por el *widget* propio en la web del local: sin comisión por cubierto | Cuota mensual; precios no públicos (CoverManager sin tarifas públicas desde sept. 2026 según [zuitechnology.com](https://zuitechnology.com/en/blog/reservas-whatsapp-restaurante)) |
| Pasos para el comensal | Elegir personas, fecha, hora, zona → abrir WhatsApp con mensaje relleno → enviar (≈ 5 toques) | Formulario + cuenta/registro + confirmación | Widget + datos de contacto |
| Confirmación automática | ❌ Manual (el local responde) | ✅ | ✅ |
| Control de aforo / no-shows | ❌ | ✅ (recordatorios) | ✅ |
| Captación de clientes nuevos | Solo los que ya llegan a la web/Maps | ✅ Escaparate del marketplace | Parcial |
| Tasa de conversión comparada | **No hay estudio público.** No se puede afirmar que convierta más | — | — |

**Ejemplo de coste (supuesto, no dato):** 300 comensales/mes por marketplace × 2,5 € = **750 €/mes**. Con WhatsApp directo ese coste es 0 €, pero se pierde la automatización.

**Conclusión operativa:** WhatsApp estructurado como canal por defecto (encaja con el mercado español y con el modelo "0 % comisiones"), con dos condiciones:
1. **Tiempo de respuesta comprometido** (mensaje de bienvenida automático de WhatsApp Business + compromiso de respuesta). Si el local no contesta, perdemos al cliente igual que con el teléfono (dato 11).
2. Campo opcional `external_booking_url` para locales que ya usan TheFork/CoverManager (que enlacen a su *widget* propio, sin comisión).
3. **Medir** en Fluxo: clics en "Reservar" → mensajes enviados (evento `wa_click`) para tener nuestro propio dato.

---

## 2. Benchmark de referentes

> ⚠️ Inspección visual en vivo bloqueada. Lo siguiente sale del texto de sus webs, blogs y casos publicados.

| Referente | Qué hace / qué afirma | Patrón que adoptamos | Evidencia |
| :--- | :--- | :--- | :--- |
| **Owner.com** | Webs mobile-first orientadas a pedido directo y SEO. Recomienda "botones grandes y fáciles de tocar para *Order Online* y *Reserve*", fotos comprimidas, texto legible sin zoom. Casos: Saffron (PA) "13 posiciones Top 3 en Google", ">630 clientes nuevos/mes desde Google" posicionando nombres de platos | Platos como páginas/texto indexable; CTA principal fijo; titular claro arriba | [owner.com/blog/common-restaurant-website-mistakes](https://owner.com/blog/common-restaurant-website-mistakes), [caso Saffron](https://owner.com/case-studies/saffron) — cifras propias del proveedor |
| **Popmenu** | Carta dinámica como "mejor vendedor": fotos, reseñas por plato y, desde oct. 2026, **vídeo por plato** orientado a AEO (búsqueda por IA). 82 % elige cartas con fotos y reseñas | Fotos obligatorias en platos estrella; micro-vídeo opcional en 1–3 platos | [prnewswire oct. 2026](https://prnewswire.com/news-releases/popmenu-unveils-the-next-big-thing-in-restaurant-menu-technology-302909352.html) |
| **BentoBox** | Sus "mejores webs" destacan: vídeo de cabecera que recorre sala, cocina y platos (Boucherie NYC); avisos emergentes de eventos (Bresca); cabecera simple que lleva a info crítica (Lilia); carta con imagen por plato y CTA desde la Home (Chez Zee); fotos mínimas y dejar hablar a la comida (Rich Table, Lost Larson) | Vídeo corto de ambiente; navegación mínima; carta con foto por plato | [getbento.com/blog](https://getbento.com/blog/restaurant-website-redesigns-2022) (selección editorial del propio proveedor) |
| **SpotHopper** | Enfocado a bares: promociones de horas valle, eventos, reseñas. Afirma "+70 % de apariciones en búsquedas locales", "2–3× más reseñas", "+20–30 % en horas valle" | Para Arquetipo A: bloque "Hoy en barra" (promo/horas valle/eventos) | [spothopperapp.com](https://www.spothopperapp.com) — cifras de marketing sin metodología |
| **Awwwards (Food & Drink)** | La categoría está dominada por **marcas de producto envasado**, no restaurantes. Restaurantes premiados recientes: Crav Burgers (SOTD jun. 2026, "pedido rápido con movimiento"), Tripletta Pizza (SOTD abr. 2025), Sunbeam Bagels & Coffee (SOTD jul. 2026), Gourou Indian Food (HM), Bon Bouquet Café | Usar el movimiento para dar personalidad, **no** para tapar la información. Awwwards premia diseño, no mide conversión ni Core Web Vitals | [awwwards.com/websites/food-drink](https://www.awwwards.com/websites/food-drink/) |

**Patrones comunes (convergen todos los referentes):**
1. Carta en HTML con foto y precio, nunca solo PDF.
2. Un CTA principal (Pedir/Reservar) siempre accesible en móvil.
3. Cabecera visual fuerte (vídeo corto o foto) pero navegación mínima.
4. Prueba social (reseñas, prensa) y promociones visibles.
5. SEO local: nombre de platos + localidad como texto.

---

## 3. Blueprint maestro de la Home gastronómica (móvil, de arriba abajo)

```text
┌──────────────────────────────────────┐  0. MINI-CABECERA FIJA (56px)
│ [Logo]  ● Abierto · cierra 23:30  ES▾│     Logo + estado en vivo + idioma
├──────────────────────────────────────┤
│                                      │  1. HERO (≈ 80svh, NO 100vh: que asome
│   Foto póster AVIF (LCP) →           │     el siguiente bloque)
│   vídeo 6–8 s mudo en bucle          │   · H1 = tipo de cocina + lugar
│                                      │     "Marisquería en Noia · Lonja del día"
│  Marisquería en Noia                 │   · ★ 4,7 (312 reseñas en Google) → enlace
│  ★ 4,7 · 312 reseñas Google          │   · 1 frase de promesa
│  [ Reservar mesa ]  [ Ver carta ]    │   · 2 botones (primario + secundario)
├──────────────────────────────────────┤
│  2. HOY / FUERA DE CARTA (en vivo)   │  Desde la Carta Viva: platos del día,
│  [foto][foto][foto]  →  desliza      │  lonja, agotados ocultos al instante
├──────────────────────────────────────┤
│  3. PLATOS ESTRELLA (3–6)            │  Foto 4:3, nombre, precio, iconos de
│  foto · nombre · 18,50 € · 🐟 🥛      │  alérgenos, "Ver carta completa" (HTML)
├──────────────────────────────────────┤
│  4. AMBIENTES: [Salón] [Terraza]     │  Foto día/noche; la zona elegida se
│  [Barra]                             │  pasa al formulario de reserva
├──────────────────────────────────────┤
│  5. RESEÑAS DE GOOGLE                │  3 extractos reales + nota + enlace
│  "El mejor pulpo de la ría…" — Ana   │  a todas las reseñas
├──────────────────────────────────────┤
│  6. RESERVA DIRECTA (WhatsApp)       │  Personas · Fecha · Hora · Zona · Nombre
│  [ Enviar por WhatsApp ]             │  → wa.me con mensaje relleno. Texto:
│  "Te respondemos en < 15 min"        │  "Sin comisiones. Respuesta en X min"
├──────────────────────────────────────┤
│  7. HISTORIA (3–4 líneas + foto)     │  Quién cocina, desde cuándo, producto
├──────────────────────────────────────┤
│  8. HORARIO + CÓMO LLEGAR            │  Tabla de horario, dirección, mapa
│  [imagen de mapa estática]           │  ESTÁTICO (no iframe) → abre Maps
├──────────────────────────────────────┤
│  9. PREGUNTAS FRECUENTES             │  Alérgenos, grupos, perros, terraza
│                                      │  cubierta, accesibilidad (texto → IA)
├──────────────────────────────────────┤
│ 10. PIE: NAP, Instagram, legal       │  Nombre, dirección, teléfono idénticos
│                                      │  a Google Business Profile
╞══════════════════════════════════════╡
│ [📅 Reservar] [📖 Carta] [📍 Llegar] [📞]│  BARRA FIJA INFERIOR (zona del pulgar)
└──────────────────────────────────────┘  64px + safe-area-inset-bottom
```

**Reglas de la zona del pulgar:**
- Barra fija inferior con **máximo 4 acciones**, botón primario a la izquierda-centro, área táctil ≥ 48×48 px, `padding-bottom: env(safe-area-inset-bottom)`.
- Aparece tras pasar el Hero (los CTAs del Hero ya cubren la primera pantalla) y se oculta cuando el formulario de reserva está en pantalla (no duplicar).
- El botón primario cambia según arquetipo (§4) y según estado: si el local está **cerrado**, el primario pasa a "Reservar para mañana" o "Ver horario".
- Etiquetas con verbo y en el idioma del usuario: "Reservar", "Ver carta", "Cómo llegar", "Llamar".

---

## 4. Matriz de Adaptación por los 5 Arquetipos Base

| Elemento | **1. Urban & Street (Informal)** | **2. Alta Mesa & Tradición (Formal)** | **3. Gastro-Bistró (Híbrido)** | **4. Daylight & Café** | **5. Taberna Rústica Gallega** |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Locales tipo** | Hamburgueserías smash, pizzerías, cervecerías craft, tacos | Marisquerías, asadores de carne madurada, mantel blanco | Taperías modernas de mercado, vinotecas, gastrobares, arrocerías | Cafeterías de especialidad, brunch, panaderías, heladerías | Pulperías tradicionales, furanchos, casas de comidas caseras |
| **Objetivo nº 1** | Que venga **ahora** (rotación) | Que **reserve** mesa con antelación | Experiencia compartida y sobremesa | Que venga **ahora** o desayune | Que venga a comer/tapear |
| **CTA primario (pulgar)** | 📍 Cómo llegar | 📅 Reservar mesa | 📅 Reservar / 📖 Carta | 📍 Cómo llegar | 📍 Cómo llegar / 📞 Llamar |
| **Estrategia de Precios** | Portada seductora sin precio; carta completa con precios a 1 toque | Portada aspiracional sin precio; carta fija con lonja "🌊 Precio según lonja" | Sin precio en portada; desglose por raciones y vinos en carta | Sin precio en portada; etiquetas dietéticas visibles | Sin precio en portada; raciones y tapas en carta |
| **Hero & Fotografía** | Fotografía con plano cerrado, contraste alto, humo/fuego | Plato estrella recortado sobre fondo limpio, luz tenue o brasa | Copas con reflejos de luz, raciones para compartir | Luz cenital natural, vapor de café, pan crujiente | Caldera de cobre, pulpo con pimentón, madera y cantería |
| **Paleta Visual** | Modo oscuro alto contraste (`#0A0B0E`), acentos mostaza/neón (`#EAB308`) | Tinta profunda (`#141311`), marfil cálido (`#F6F3EC`), acento brasa (`#C85A32`) | Estética *Apple Glass* templada (`#121316` + blur), acento vino/oliva | Muy luminoso (`#FAFAF8`, crema, arena `#F5EBE1`, café tostado `#6F4E37`) | Granito (`#2B2A27`), roble (`#4A3728`), piedra (`#EFECE6`), pimentón (`#B91C1C`) |
| **Tipografía** | Titulares bold / display (*Anton* / *Sora*) | Serif editorial clásica (*Instrument Serif* / *Newsreader*) | Serif moderna + sans geométrica (*Playfair* / *DM Sans*) | Serif suave o sans redondeada (*Newsreader* / *Inter*) | Serif con peso tradicional (*Instrument Serif* / *Cinzel*) |
| **Semáforo en Vivo** | "🟢 Abierto · Cocina hasta..." | "🟢 Abierto · Reserva cena" | "🟢 Abierto ahora" | "🟢 Abierto para desayunos" | "🟢 Abierto · Servicio mediodía" |
| **Schema `@type`** | `BarOrPub` | `Restaurant` | `Restaurant` | `CafeOrCoffeeShop` | `BarOrPub` |

---

## 4.1 Estrategia de Precios: Portada Aspiracional + Transparencia a 1 Clic

1. **En la Portada (Web Home):**
   - Se destacan los 3 o 4 platos estrella de forma visual y seductora **sin mostrar precios**.
   - Esto evita que la portada parezca un folleto de tarifas de comida rápida y protege el posicionamiento de marca frente a comparativas superficiales de la competencia.
   - En su lugar, cada plato exhibe su nombre poético, descripción de origen (ej. "Pescado salvaje de bajura") y distintivos de lonja o especialidad.
2. **En la Carta Fija Interactiva (Modal/Drawer):**
   - Al pulsar «Ver Carta Completa con Precios», se despliega el catálogo oficial con el 100% de los precios reales actualizados, alérgenos y etiquetas de *🌊 Precio según lonja*.
   - El comensal obtiene transparencia absoluta antes de asistir o reservar.

---

## 4.2 Sincronización SSOT con la Base de Datos de `/p/[slug]` y Radar de Conversión

1. **Cero Doble Trabajo para el Hostelero:**
   - La carta fija de `/web/[slug]` lee directamente de la tabla maestro de productos en Supabase compartida con la Carta QR interactiva (`/p/[slug]`).
   - Si el hostelero actualiza un precio de lonja, cambia un plato o pausa un agotado desde `/panel/[slug]`, la web oficial se sincroniza en tiempo real sin requerir edición manual de código.
2. **Auto-Detección de Idioma (ES | GAL | EN):**
   - La web detecta el idioma del navegador o sistema del comensal mediante `navigator.language` al cargar (`gl` / `en` / `es`), conmutando los textos de interfaz al instante.
   - Dispone además de un selector manual discreto en la cabecera con persistencia en `localStorage`.
3. **Radar de Visitas y Conversión Web:**
   - La web registra eventos de telemetría limpios (sin cookies de rastreo):
     - `pageview`: Impresiones de marca.
     - `open_menu`: Clics en «Ver Carta y Precios».
     - `click_reservation`: Solicitudes enviadas a WhatsApp.
     - `click_maps` / `click_call`: Conversiones a visita presencial y contacto directo.
   - Estas métricas alimentan el panel del hostelero (`/panel/[slug]`) para demostrar el retorno de inversión (ROI) directo del escaparate digital.

---

## 5. Diseño visual, tipografía y color

- **Fotografía antes que paleta:** el 36 % rechaza un local por sus fotos (MGH). Reglas: foto real del local (nunca banco de imágenes genérico), luz natural o cálida, encuadre 4:3 en platos y 3:4 / 9:16 en ambientes para móvil, mismo tratamiento de color en toda la carta.
- **Color:** no hay evidencia sólida de que un color concreto "abra el apetito" más que otro; lo demostrable es **contraste y coherencia con el tipo de local**. Recomendación: tema oscuro solo para locales de noche/ticket alto (asador, coctelería); tema claro cálido para día (cafetería, brunch, taberna de mediodía). Contraste de texto mínimo WCAG AA 4,5:1. Aplica la regla interna de degradados (salto ≥ Slate-200/300).
- **Tipografía:** máximo 2 familias; titular con personalidad (serif editorial para B, sans condensada para A, sans redondeada para C) + sans muy legible para texto y precios. Precios con cifras tabulares (`font-variant-numeric: tabular-nums`). Tamaño mínimo de cuerpo 16 px en móvil.
- **Movimiento:** solo `transform` y `opacity`; respetar `prefers-reduced-motion` (sin bucles ni partículas); ninguna animación debe retrasar la aparición del H1, el precio o los botones.

---

## 6. Checklist técnico para Ingeniería (Next.js 14)

### 6.1 Rendimiento — objetivos

| Métrica | Umbral oficial "bueno" (p75, web.dev) | **Objetivo interno Fluxo** |
| :--- | :--- | :--- |
| LCP | ≤ 2,5 s | **≤ 2,0 s** en móvil 4G |
| INP | ≤ 200 ms | ≤ 150 ms |
| CLS | ≤ 0,1 | **0** (o < 0,01) |
| JS de la ruta `/web/[slug]` | — | ≤ 150 KB gzip en primera carga |
| Peso total primera pantalla | — | ≤ 600 KB (sin contar vídeo diferido) |

### 6.2 Checklist

- [ ] **Página como Server Component** (`src/app/web/[slug]/page.tsx` sin `'use client'`), con `generateMetadata` y ISR (`revalidate`), y solo las islas interactivas como Client Components. *Hoy toda la página es `'use client'` (1.221 líneas) → sin metadatos por local y con todo el contenido renderizado en cliente.*
- [ ] **Hero:** `next/image` con `priority` + `fetchPriority="high"` como póster (es el candidato LCP). El `<video muted playsinline loop autoplay>` se monta **después** de la primera pintura y solo si: no hay `prefers-reduced-motion`, no hay `Save-Data` y `navigator.connection.effectiveType` es `4g`. Vídeo 6–8 s, sin pista de audio, 720p, WebM (VP9/AV1) + MP4 (H.264), ≤ 1,5 MB.
- [ ] **Imágenes:** `images.formats: ['image/avif', 'image/webp']` en `next.config`; `sizes` correcto en cada `next/image`; carga diferida por defecto bajo el pliegue.
- [ ] **CLS 0:** `aspect-ratio`/`width`+`height` en toda imagen, vídeo y mapa; fuentes con `next/font` (`display: 'swap'`, `adjustFontFallback`); la barra fija inferior se reserva con `padding-bottom` en `<body>`; nada de banners que empujen contenido.
- [ ] **Canvas a 60 fps (partículas del Hero y recorrido por scroll):** pausar con `IntersectionObserver` fuera de pantalla y con `visibilitychange`; limitar `devicePixelRatio` a 2; desactivar con `prefers-reduced-motion`. El recorrido de **320vh** en canvas debe ser opcional por local (coste alto en INP y batería en móviles de gama baja).
- [ ] **Mapa:** imagen estática (o ilustración) + enlace `https://www.google.com/maps/dir/?api=1&destination=...`; nunca `<iframe>` de Google Maps en la carga inicial.
- [ ] **Terceros:** sin widgets externos en el Hero; analítica con `next/script strategy="lazyOnload"`.
- [ ] **Medición real:** `web-vitals` (`onLCP`, `onINP`, `onCLS`) enviado a nuestro endpoint de analítica; Lighthouse móvil en cada release de plantilla.

### 6.3 SEO local, Google Business Profile e IA

- [ ] **`<title>`:** `{Nombre} · {Tipo de cocina} en {Localidad} | Carta y reservas`; `meta description` con 2 platos estrella + zona.
- [ ] **Carta en HTML real** (Server-rendered) enlazada desde la Home; cada plato con nombre, descripción, precio y alérgenos como texto. El PDF, si existe, solo como descarga secundaria.
- [ ] **JSON-LD `Restaurant`** (o subtipo del arquetipo) en la Home con: `@id`, `name`, `image`, `url`, `telephone`, `address` (`PostalAddress` completa), `geo`, `servesCuisine`, `priceRange`, `openingHoursSpecification`, `hasMenu` (URL de la carta HTML), `acceptsReservations` (URL de reserva o `false`), `sameAs` (ficha de Google Maps, Instagram).
- [ ] **JSON-LD `Menu` → `MenuSection` → `MenuItem`** en la página de carta, con `offers.price` + `priceCurrency: "EUR"` y `suitableForDiet` (`GlutenFreeDiet`, `VeganDiet`, `VegetarianDiet`) cuando aplique. Schema.org no tiene propiedad estándar para los 14 alérgenos: van como texto visible.
- [ ] **NO marcar `AggregateRating`/`Review` del propio local**: Google no muestra estrellas para reseñas "self-serving" en `LocalBusiness` desde 2019 ([Google Search Central](https://developers.google.com/search/blog/2019/09/making-review-rich-results-more-helpful)). Mostrar las reseñas como **texto visible** con enlace a Google sí aporta (confianza y lenguaje que leen las IA).
- [ ] **Coherencia NAP** (nombre, dirección, teléfono) idéntica entre web, Google Business Profile e Instagram.
- [ ] **Google Business Profile:** enlace "Sitio web" → Home (con `?utm_source=gbp`), enlace "Menú" → carta HTML, enlace "Reservas" → sección de reserva; categoría principal exacta ("Marisquería", no solo "Restaurante"); horarios festivos al día. Google clasifica el ranking local por **relevancia, distancia y popularidad**, y "más reseñas y valoraciones positivas pueden ayudar" ([support.google.com](https://support.google.com/business/answer/7091?hl=en)).
- [ ] **IA (ChatGPT, AI Overviews, Gemini, Perplexity):** solo el **17 %** de los restaurantes aparece en respuestas de IA; recomiendan 3–5 locales por pregunta; ChatGPT suele recomendar negocios de **4,3★+** (Uberall 2026). 27 % de consumidores ya usa IA para buscar restaurantes (Popmenu 2026). Qué ayuda (según guías de Google y estudios, sin fórmula garantizada): contenido en texto, preguntas frecuentes con respuestas concretas ("¿Tenéis terraza cubierta?", "¿Opciones sin gluten?"), reseñas con lenguaje descriptivo, y datos coherentes en todas las fuentes.
- [ ] **Multidioma (es/gl/en):** `hreflang` si se publican versiones por idioma en URL propia.
- [ ] **Alérgenos:** obligatorios para comida sin envasar por Reglamento (UE) 1169/2011 art. 44 y RD 126/2015; en la web, mostrarlos por plato con icono + texto.

---

## 7. Diagnóstico de la plantilla actual `src/app/web/[slug]/page.tsx`

| Requisito del Blueprint | Estado hoy (verificado en código) |
| :--- | :--- |
| Datos por local | ❌ Platos y ambientes de Casa Mar da Vila escritos en el archivo; nombre por `slug.includes('casa-mar')` |
| Server Component + metadatos por local | ❌ Página entera `'use client'` |
| JSON-LD | ❌ No existe |
| Estado "Abierto ahora" | ❌ No existe |
| Barra fija inferior (pulgar) | ❌ Solo cabecera fija superior |
| Reseñas de Google | ❌ No existe |
| Mapa / Cómo llegar | ❌ No encontrado en la plantilla |
| `prefers-reduced-motion` | ❌ No se respeta |
| Hero con `priority` | ✅ Sí (`next/image priority`) |
| Selector de ambiente → reserva WhatsApp | ✅ Sí (bloques 4 y 5); número fijo `34711573870` para todos los locales |
| Carta fija en modal sin carrito | ✅ Cumple la norma de Carta Fija Digital, pero no es HTML indexable por plato fuera del modal |

---

## 8. Fuentes principales

- Popmenu, *Consumer Trends Study 2026* (3.000 consumidores EE. UU.): https://get.popmenu.com/toolkit/consumer-trends-study-2026
- Popmenu, nota de prensa oct. 2026 (1.000 consumidores): https://prnewswire.com/news-releases/popmenu-unveils-the-next-big-thing-in-restaurant-menu-technology-302909352.html
- Owner, *Restaurant Website Design: 6 Things Your Customers Want* (1.300 comensales EE. UU.): https://www.owner.com/blog/restaurant-website-design
- MGH, encuesta 1.101 adultos EE. UU. (2019): https://prnewswire.com/news-releases/survey-nearly-70-of-us-diners-say-a-restaurants-website-has-discouraged-them-from-visiting-300909229.html
- BrightLocal, *Local Consumer Review Survey 2026*: https://brightlocal.com/research/local-consumer-review-survey
- Uberall, informe GEO 2026 (nota de prensa): https://www.businesswire.com/news/home/20260507962493/en/
- IAB Spain, *Estudio de Redes Sociales 2026*: https://iabspain.es/iab-spain-presenta-estudio-rrss-2026
- web.dev, *Web Vitals* y *Defining Core Web Vitals thresholds*: https://web.dev/articles/vitals · https://web.dev/articles/defining-core-web-vitals-thresholds
- Google Search Central, *Local Business structured data* y blog de reseñas 2019: https://developers.google.com/search/docs/appearance/structured-data/local-business
- Schema.org `Restaurant`: https://schema.org/Restaurant
- Google Business Profile, factores de ranking local: https://support.google.com/business/answer/7091
- BOE, Real Decreto 126/2015: https://boe.es/diario_boe/txt.php?id=BOE-A-2015-2293
- BentoBox blog (selecciones de webs): https://getbento.com/blog/restaurant-website-redesigns-2022
- Awwwards Food & Drink: https://www.awwwards.com/websites/food-drink/
