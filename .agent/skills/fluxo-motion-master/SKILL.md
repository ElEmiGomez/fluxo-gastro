---
name: fluxo-motion-master
description: Core architectural standards, mathematical rhythm grids, spring physics configs, 11 viral motion components (LuisPa 3D + Mirko Vigna + hans1801 + Launch-Motion), and reverse-engineering video protocols for Remotion v4 in Fluxo. MANDATORY to invoke and follow whenever creating, calibrating, or editing files in src/remotion/.
---

# Fluxo Motion Master & Remotion v4 Engineering Specification (v2.0)

Este manual y guía operativa establece los estándares arquitectónicos, matemáticos, de componentes reutilizables y de ingeniería inversa de vídeo para la producción autónoma de motion graphics de alta fidelidad en Fluxo utilizando **Remotion v4 (`4.0.542`)**, **React 18**, **TypeScript**, **Tailwind CSS**, **`@remotion/paths`**, **`@remotion/captions`**, **`@remotion/motion-blur`**, **`@remotion/transitions`** y **`@remotion/effects`** (con aceleración GPU `--gl=angle`).

---

## 0. REGLA CERO: Protocolo Obligatorio de Entrevista y Doble Gate Pre-Render (`PRE_FLIGHT_VIDEO_GATE`)

**PROHIBIDO** empezar a programar o renderizar un vídeo MP4 a ciegas. Cada vez que el usuario pida crear o modificar sustancialmente un vídeo, debes seguir obligatoriamente estos **2 Gates de aprobación** (ver detalle completo en `references/pre-flight-checklist.md`):

### PASO 0 — Recomendación Proactiva de Modelo
Indicar al usuario qué modelo conviene usar según la tarea:
- **Gemini 4 Argon:** Para crear escenas nuevas, trayectorias Bezier, físicas de resorte o auditar visualmente los fotogramas PNG (Gate 1 y Gate 2).
- **Gemini 3.8 Flash:** Para cambiar datos de locales en presets existentes y renderizar el MP4.

### GATE 1 — Cuestionario Inicial (`ask_question`) + Storyboard en Texto
Si el usuario no especificó alguno de estos 5 puntos en su mensaje inicial, **pregúntalos primero usando `ask_question`**:
1. **Modo de Vídeo:** (1) Pitch Comercial Personalizado por Local (15s WhatsApp), (2) Anuncio / Reel Viral de Marca Fluxo (6s-15s Editorial 3D o Dashboard ROI), (3) Vídeo de Lanzamiento / Explicativo Largo (30s en 5 escenas), o (4) Recreación / Clonación de un Vídeo de Referencia.
2. **Formato y Duración:** `9:16 Vertical (1080x1920)`, `16:9 Horizontal (1920x1080)`, `1:1` o `Ambos`, y duración exacta (`6s`, `10s`, `15s`, `30s`), manteniendo **60 FPS y 120 BPM** como estándar fijo.
3. **Datos Reales, Logos, Fotos y Precios (Cero Invención):** Prohibido inventar precios, nombres de platos o elegir fotos al azar. Confirmar siempre qué logo y fotos usar (archivos en `public/`, generar con IA Nano Banana / Imagen Ancla, o catálogo existente) y los precios exactos.
4. **Estilo Visual, Subtítulos y Fondo:**
   - *Subtítulos:* `Caja azul estilo Figma (figma-selection)` / `Píldora amarilla estilo Hormozi (hormozi-pill)` / `Titular Blur-Up sin subtítulos`.
   - *Fondo:* `Rejilla técnica oscura de cruces (#050811)` / `B-Roll con Imagen Ancla (Google Flow)` / `Claro`.
5. **Diseño Sonoro:** `Efectos SFX sintéticos nativos (SoundEffects.tsx)` / `Pista musical en public/` / `Mudo`.

> **Parada Obligatoria del Gate 1:** Una vez respondidas las preguntas, presenta la tabla del **Storyboard escena por escena** (segundos, frames a 60fps, textos en pantalla, cámara y suma matemática de precios) y **detente esperando el OK explícito del usuario**.

### GATE 2 — Muestra Visual de 3-4 Fotogramas Clave (`renderStill` PNG)
Tras el OK al Storyboard:
1. Programa la composición en `src/remotion/` y verifica `npx.cmd tsc --noEmit` (`0 errores`).
2. Renderiza **3 a 4 fotogramas estáticos PNG** (`out/audit-*.png`) de las escenas clave, inspecciónalos con `read_file` y muéstraselos al usuario.
3. **Parada Obligatoria del Gate 2:** Espera el OK visual del usuario sobre los PNGs. **Solo tras su confirmación final se ejecuta el renderizado del archivo `.mp4`.**

---

## 1. La Arquitectura Tri-Motor (The 3 Motion Engines)

El sistema opera bajo tres motores complementarios según la naturaleza de la animación requerida (adaptado 100% a recursos nativos y gratuitos del stack de Fluxo):

```
                                  ┌──────────────────────────────────────────────┐
                                  │       GOOGLE ANTIGRAVITY MOTION CORE         │
                                  └──────────────────────┬───────────────────────┘
                                                         │
             ┌───────────────────────────────────┼───────────────────────────────────┐
             ▼                                   ▼                                   ▼
┌─────────────────────────┐         ┌─────────────────────────┐         ┌─────────────────────────┐
│   MOTOR 1: PROGRAMÁTICO │         │   MOTOR 2: DATA & 3D UI │         │   MOTOR 3: GENERATIVO   │
│   (React + Remotion v4) │         │ (@remotion/paths + SVG) │         │ (Image-Gen + Omni Flash)│
├─────────────────────────┤         ├─────────────────────────┤         ├─────────────────────────┤
│ • 100% determinista     │         │ • Gráficas evolvePath   │         │ • Prompts de Ingeniería │
│ • Spring physics exacto │         │ • Subtítulos Figma/Hor. │         │   Inversa (Omni Flash)  │
│ • Sincronización 120BPM │         │ • Cámaras 2.5D y 3D     │         │ • Activos PNG y platos  │
│ • Audio PCM sintético   │         │ • Cortes con MotionBlur │         │ • Auditoría Gemini Ojos │
└─────────────────────────┘         └─────────────────────────┘         └─────────────────────────┘
```

### Equivalencia de Recursos Gratuitos / Nativos en Fluxo (Zero Paid Subscriptions)
| Recurso de Pago en Guías Externas | Equivalente Nativo y Gratuito en Fluxo (`src/remotion/`) |
| :--- | :--- |
| After Effects / Premiere Cut Blur | `<CutTransitionWrapper cutFrames={[...]}>` (`scale: 1 + 0.032*k` + `filter: blur(8*k²px)`) |
| Submagic / CapCut Pro Captions | `<ViralSubtitles variant="figma-selection" \| "hormozi-pill" />` |
| Envato / Epidemic Sound SFX | `SoundEffects.tsx` (Síntesis PCM WAV Base64 embebida en memoria: sub-drop, tap, pop, chime) |
| Plugins de Gráficas / Lottie Pro | `<ProgressiveLineChart />` (`@remotion/paths` `evolvePath`), `<CountUpTicker />`, `<RankingBarsRace />` |
| Fondos de Stock 4K de Pago | `<DarkTechBackground />` (Rejilla técnica de cruces SVG + polvo flotante determinista `seededRandom` + orbes) |
| Plantillas Editoriales 3D | `<FanCardsDeck />`, `<BlurWordReveal />`, `Scene_EditorialShowcase.tsx` y `PhoneFrame916.tsx` |

---

## 2. Rejilla de Ritmo Matemático (Musical Grid 60fps @ 120 BPM)

Para lograr una sincronización perfecta entre la vista del usuario, los efectos de sonido y la cadencia musical comercial, todos los inicios de `<Sequence>`, toques del cursor, cambios de estado y transiciones deben alinearse a múltiplos exactos de medio beat (**15 frames**) o un beat completo (**30 frames**), importando siempre las constantes desde `src/remotion/constants.ts`.

### Tabla de Equivalencias de Tiempo

| Unidad Musical | Fotogramas a 60 FPS | Fotogramas a 30 FPS | Duración en Segundos | Uso Recomendado en UI |
| :--- | :--- | :--- | :--- | :--- |
| **1/4 Beat (Semicorchea)** | **7 - 8 frames** | 3 - 4 frames | ~0.125s | Micro-rebotes de botón, ripples de click, corte óptico (`±8 frames`) |
| **1/2 Beat (Corchea)** | **15 frames** | 7 - 8 frames | **0.250s** | Toques de cursor, cambio de píldora de variante |
| **1 Beat (Negra)** | **30 frames** | 15 frames | **0.500s** | Stagger de tarjetas, entrada de modales, avisos |
| **2 Beats (Blanca)** | **60 frames** | 30 frames | **1.000s** | Transiciones de sección, `CountUpTicker` (~1s de lectura) |
| **3 Beats** | **90 frames** | 45 frames | **1.500s** | Tiempo mínimo de retención en pantalla de un dato clave o pizarra limpia |
| **1 Compás (4 Beats)** | **120 frames** | 60 frames | **2.000s** | Duración estándar de una acción compleja |
| **Composición 15s** | **900 frames** | 450 frames | **15.000s** | Vídeo comercial completo (30 beats / 7.5 compases) |

### Cronología Maestra de Escenas — Pitch WhatsApp (900 frames @ 60fps)

1. **Escena 1 (Brand & Mesa):** Frames `0` a `210` (7 beats / 3.5s) — `ContinuousMenuCanvas` con zoom suave a cabecera y grid 2 columnas.
2. **Escena 2 (Píldoras & Carrito):** Frames `210` a `480` (9 beats / 4.5s) — Selección de variantes sincronizada al beat y barra inferior reactiva.
3. **Escena 3 (Comanda Limpia):** Frames `480` a `720` (8 beats / 4.0s) — Apertura del modal sobre el mismo DOM continuo con coincidencia matemática exacta.
4. **Escena 4 (Outro Comercial):** Frames `720` a `900` (6 beats / 3.0s) — Corte óptico (`CutTransitionWrapper` en frame `720`), isotipo real `/logo-fluxo.svg` y CTA de WhatsApp.

---

## 3. Física de Resortes, Curvas Multi-Tramo y Prevención del "Bounce Bug"

### Configuración Unificada de Resorte (Master Spring)
Toda interacción visual debe emplear una distribución de movimiento orgánico:
- **10% Anticipación** $\rightarrow$ **60% Acción Rápida** $\rightarrow$ **30% Asentamiento (Damping)**.

```typescript
export const MASTER_SPRING_CONFIG = {
  damping: 16,
  mass: 0.9,
  stiffness: 115,
};
```

### Regla Anti-Inversión (Anti-Bounce Bug)
Queda terminantemente prohibido dejar que las oscilaciones de escala crucen a números negativos. Cualquier escala negativa invierte el elemento horizontal o verticalmente en pantalla provocando parpadeos:

```typescript
const scale = Math.max(0, interpolate(springVal, [0, 1], [0.85, 1], {
  extrapolateLeft: 'clamp',
  extrapolateRight: 'clamp',
}));
```

### Regla de Oro del Movimiento Continuo (The Golden Rule)
- **Nada se detiene por completo jamás (`Nothing Fully Stops`):** Mientras el usuario lee una tarjeta o gráfica, la cámara mantiene un empuje continuo lento (`scale: 1.00 -> 1.04`) o una flotación sinusoidal suave (`Math.sin(frame / 18) * 6`), y la siguiente acción arranca unos fotogramas antes de que termine la anterior (*Overlapping Action*).
- **Interpolación Multi-Tramo con Smoothstep (`interpolateSegments` / `tramos`):** Para trayectorias de cámara con paradas de lectura (zoom in $\rightarrow$ pausa de lectura $\rightarrow$ pull-back), usar `interpolateSegments(t, keyframes, true)` de `src/remotion/components/CutTransitionWrapper.tsx`, que aplica `smoothstep(t) = t * t * (3 - 2 * t)` en cada segmento para arrancar y frenar sin tirones mecánicos.

---

## 4. Safe Margins para Vídeo Vertical 9:16 (1080x1920)

Para garantizar legibilidad total en WhatsApp Status, Instagram Reels, TikTok y YouTube Shorts:
- **Margen Superior e Inferior (Eje Y):** Mínimo **120px**.
- **Margen Lateral (Eje X):** Mínimo **80px**.
- Los elementos críticos (nombre del local, badge de mesa `"📍 MESA 12"`, subtítulos virales, total de comanda y botón de WhatsApp) jamás deben situarse fuera de este marco seguro.

---

## 5. Prevención de Cortes de Texto Dinámico y Carga de Fuentes

- Aplicar siempre tipografía reactiva: `leading-snug tracking-tight text-balance`.
- Contenedores flexibles con `min-w-0`, `truncate` o `line-clamp-1` / `line-clamp-2`.
- Nunca usar capturas de pantalla rasterizadas (PNG/JPG) para interfaces de usuario: construir siempre la UI con componentes vectoriales/DOM en React + Tailwind para que al hacer zoom al `130%-160%` los bordes y textos se mantengan perfectamente nítidos.

---

## 6. Prohibición de Animaciones CSS y Aleatoriedad No Determinista

- **PROHIBIDO** usar clases de Tailwind como `transition-*`, `duration-*`, `ease-*` o `animate-*` en Remotion.
- **PROHIBIDO** usar `Math.random()` en el renderizado de componentes (causa parpadeo entre hilos de renderizado paralelo). Usar siempre el generador determinista con semilla `seededRandom(seed)` exportado en `src/remotion/components/CutTransitionWrapper.tsx`.

---

## 7. Arsenal de 11 Componentes y Patrones Avanzados (`src/remotion/`)

Todos estos componentes están implementados, tipados y listos para importar en cualquier escena de `src/remotion/`:

| # | Componente / Utilidad | Archivo en `src/remotion/` | Inspiración / Fuente | Uso y Capacidades |
| :--- | :--- | :--- | :--- | :--- |
| **1** | `<CutTransitionWrapper />` | `components/CutTransitionWrapper.tsx` | LuisPa (`Main.tsx` `<Movimiento>`) | Aplica punch óptico (`scale: 1 + 0.032*k`) + desenfoque de corte (`blur(8*k²px)`) en una ventana de `±8 frames` alrededor de cada frame en `cutFrames`. |
| **2** | `seededRandom`, `smoothstep`, `interpolateSegments` | `components/CutTransitionWrapper.tsx` | LuisPa (`three/base.tsx` `azar`, `suave`, `tramos`) | Generador PRNG determinista con semilla para partículas y función de interpolación multi-segmento con curva *smoothstep*. |
| **3** | `<DarkTechBackground />` | `components/DarkTechBackground.tsx` | LuisPa (`Ambiente.tsx`) + `hans1801` + Mirko Vigna | Fondo híbrido: rejilla técnica de 60px con cruces SVG de 6px (`#crucesFondo`), polvo flotante determinista (`seededRandom`), orbes de luz y escuadras HUD. |
| **4** | `<ViralSubtitles variant="figma-selection" />` | `components/ViralSubtitles.tsx` | LuisPa (`Subtitulos.tsx` - 11M views) | Subtítulos superiores de 2 líneas con viñeta oscura, palabras inactivas en gris `#8f949c`, activas en blanco y caja azul estilo Figma (`#3f7df0`) con nodos blancos en las 4 esquinas e icono vectorial (`bolt`, `qr`, `clock`, `chart`, `check`, `sparkles`). |
| **5** | `<ViralSubtitles variant="hormozi-pill" />` | `components/ViralSubtitles.tsx` | `hans1801/remotion-samples` (`CaptionPage.tsx`) | Píldora inferior translúcida con `backdrop-blur` donde la palabra hablada se ilumina en amarillo `#FFE500` con `scale(1.08)` y glow. |
| **6** | `<BlurWordReveal />` | `components/MotionPrimitives.tsx` | Mirko Vigna (`mirkovigna.com`) | Aparición palabra por palabra con subida vertical (`translateY(16px -> 0)`), desenfoque progresivo (`blur(10px -> 0px)`) y degradado vertical blanco a azul cielo. |
| **7** | `<CountUpTicker />` | `components/MotionPrimitives.tsx` | `hans1801` (`CountUp.tsx`) + Launch-Motion | Contador numérico acelerado (~1s / `60 frames`) con curva `Easing.bezier(0.16, 1, 0.3, 1)`, micro-overshoot al llegar al 100% y halo luminoso semántico. |
| **8** | `<ProgressiveLineChart />` | `components/MotionPrimitives.tsx` | `hans1801` (`LineChart.tsx`) + Mirko Vigna | Curva SVG animada mediante `evolvePath(progress, d)` de `@remotion/paths`, área inferior con degradado luminoso y nodo final con pulso de neón. |
| **9** | `<FanCardsDeck />` | `components/MotionPrimitives.tsx` | Mirko Vigna (Plantilla *"Las 5 formas de..."*) | Abanico de 5 tarjetas superpuestas con rotación progresiva (`-12°`, `-6°`, `0°`, `+6°`, `+12°`), elevación parabólica y cascada con resorte. |
| **10** | `<RankingBarsRace />` | `components/MotionPrimitives.tsx` | `hans1801` (`TopScorersShort.tsx`) | Carrera de barras horizontales con avatares circulares de platos, aparición escalonada e incremento numérico en vivo. |
| **11** | `<StationCardsCascade />` | `components/MotionPrimitives.tsx` | `launch-motion` (`D5qpBbEWTxo` + `@sanjii`) | Grid de estaciones/agentes con entrada escalonada (`Fix 4`), micro-pulso al activarse (`Polish 3`) y cascada secuencial de checkmarks (`Polish 4`). |
| **12** | `interpolateCursorArc()` | `components/TouchCursor.tsx` | `launch-motion` (`SKILL.md` Rule #3) | Trayectoria de cursor táctil en arco Bezier cuadrático (punto de control desplazado un `15%` de la distancia) con aceleración/frenado `smoothstep` humano. |
| **13** | `<ShapeMorphOverlay />` | `components/CutTransitionWrapper.tsx` | `saas-animation v2.skill` (Rourke) | Transición shape-morph entre planos: el círculo/píldora hace un `~8%` de compresión (anticipación), inunda el lienzo con el color de fondo del siguiente plano y se disuelve suavemente (prohibido el fundido cruzado en 3D). |
| **14** | `SoundEffects.tsx` (48kHz Stereo Haas) | `components/SoundEffects.tsx` | `saas-animation v2.skill` (`synth_sfx.py`) | Sintetizador PCM WAV estéreo a 48.000 Hz con retardo Haas de 12 muestras en el canal derecho para amplitud espacial (`whoosh`, `tap`, `pop`, `chime`) y soporte de `playbackRate` para pitch-ratchet creciente. |
| **15** | `FluxoEditorialShowcase` & `FluxoDataROIShowcase` | `scenes/Scene_EditorialShowcase.tsx` & `scenes/Scene_DataROIShowcase.tsx` | Mirko Vigna + LuisPa + `hans1801` | 2 composiciones maestras registradas en `Root.tsx` bajo la carpeta `Viral-Motion-Templates` para anuncios editoriales y demostraciones de ROI B2B. |
| **16** | `FluxoDaylightBackground`, `SplitSyncConnector`, `SpotlightActionCard`, `KitchenMarginComparison`, `DualPhoneParallel`, `SocialConversionCTA` | `components/HospitalityStoryPatterns.tsx` | Reels B2B de Hostelería (Adaptados 100% a Paleta y Terminología Fluxo) | Fondo diurno Slate-Blue (`>15%` contraste + Isotipo Invertido), pantalla dividida Cliente QR $\leftrightarrow$ Comandero/KDS con hilo conector Bezier, tarjetas UI destiladas en primer plano, comparativa de coste de ingredientes en `€`, 2 móviles en paralelo y cierre interactivo de comentario/WhatsApp. |

### Referencias Adicionales en `.agent/skills/fluxo-motion-master/references/`
- `references/pre-flight-checklist.md`: Protocolo obligatorio de 2 Gates (`PRE_FLIGHT_VIDEO_GATE`) + recomendación de modelo (`Gemini 4 Argon` vs `Gemini 3.8 Flash`).
- `references/hospitality-story-patterns.md`: Guía de los 6 componentes de conversión para hostelería (`HospitalityStoryPatterns.tsx`) y 6 arquetipos de guion de un solo dolor adaptados a la paleta (`#2563EB` / `#10B981`), moneda (`€`) y vocabulario oficial de Fluxo (`camarero`, `móvil`, `coste de ingredientes / materia prima`).
- `references/deep-research-gpu-and-tools.md`: Guía completa del DeepResearch de Gemini (26 págs) + `saas-animation v2.skill`: paquetes GPU `@remotion/motion-blur` (regla crítica del contexto React en `useCurrentFrame()`), `@remotion/effects`, `@remotion/transitions`, renderizado `--gl=angle`, y matriz de herramientas gratuitas vs de pago (`Cavalry 2.7+`, `Theatre.js`, `SmoothCapture`, `ScreenKite`, `Matte`).
- `references/20-styles-and-storytelling.md`: Catálogo de los **20 Estilos de Motion Graphics** (Tyler Mommsen), regla del Hilo Conductor Visual ("Red Thread"), pipeline Audio-First (Hans Acha), flujo multicámara (`Seedance` + Remotion de Rourke) y las 4 leyes de retención narrativa (TUMADREANNA).
- `references/storyboard-template.md`: Plantilla obligatoria de Storyboard de 5 escenas a 60fps + los 5 Fixes y 5 Polishes de `launch-motion` (`D5qpBbEWTxo`).
- `references/google-flow-anchor-image.md`: Protocolo automatizado de **Google Flow CLI (`.agent/skills/google-flow/flow.py` v2.0.3 — `BRPLia/google-flow-skill-v1`) + Regla de la Imagen Ancla** (`Nano Banana 2.1` $\rightarrow$ `Veo 3.1 - Lite` / `Omni 1.2 Flash`) para generar y descargar lotes de imágenes y B-Roll MP4 desde la terminal local sin copiar prompts a mano, y montarlos en Remotion con `<OffthreadVideo />`.
- `references/pitch-message.md`: Plantillas de mensaje comercial de alta conversión para WhatsApp B2B (hostelería) y vídeos de lanzamiento SaaS.

---

## 8. Protocolo de Ingeniería Inversa de Vídeo y Prompt Maestro (Workflow Dual)

Cuando el usuario comparta un vídeo de referencia o solicite recrear el estilo de un anuncio viral para Fluxo, aplica este flujo en 3 pasos (combinando el **Prompt de Director de Motion Graphics** del usuario con el sistema **Ojos + Calificador Visual** de `Regalo_Video3D_CreaConLuisPa`):

### Paso 1: Radiografía Técnica del Vídeo Original (6 Dimensiones)
Analiza el vídeo completo de principio a fin (nunca solo los primeros segundos) documentando cada escena con sus timestamps exactos:
1. **Composición y Cámara:** Encuadre, relación de aspecto (`9:16` vs `16:9`), perspectiva 2.5D/3D, escala inicial/final de cámara (`zoom push-in` vs `pull-back`), posiciones y profundidad de capas (fondo $\rightarrow$ tipografía gigante $\rightarrow$ objeto central $\rightarrow$ HUD/subtítulos).
2. **Elementos Visuales:** Objetos centrales (teléfono 3D, tarjetas glassmorphism, gráficas SVG, iconos vectoriales, selectores tipo Figma).
3. **Tipografía:** Textos exactos, jerarquía de tamaños, pesos (`800/900` para titulares, `600/700` para badges), colores y animación de entrada (`BlurWordReveal`, palabra por palabra, etc.).
4. **Estética y Paleta HEX:** Colores exactos de fondo (`#050811`), acentos (`#3b82f6`, `#10b981`, `#f59e0b`), degradados, viñetas, rejillas técnicas y sombras.
5. **Animaciones y Easing:** Trayectorias, duración en fotogramas a 60fps, curvas (`MASTER_SPRING_CONFIG`, `smoothstep`, `Easing.bezier(0.16, 1, 0.3, 1)`) y transiciones de corte (`CutTransitionWrapper`).
6. **Audio y Sincronización:** Beats por minuto (120 BPM = 30 frames/beat), efectos de sonido (`sub-drop`, `tap`, `pop`, `chime`) y sincronización con los impactos visuales.

### Paso 2: Plantilla Lista para Copiar y Pegar (Google Omni Flash / Generador de Vídeo o Especificación Remotion)

Usa siempre esta estructura de salida cuando el usuario pida el prompt maestro o la adaptación a Fluxo:

```markdown
### 1. ANÁLISIS TÉCNICO DEL VÍDEO DE REFERENCIA
- **Especificaciones:** [Resolución, ej. 1080x1920 (9:16)] · [FPS: 60fps] · [Duración: Xs / N frames] · [Estilo General]
- **Desglose por Escenas (Timestamps y Fotogramas @ 60fps):**
  * **Escena 1 (00:00 - 00:0X | Frames 0 - N):**
    - *Composición y Cámara:* [...]
    - *Elementos y Capas:* [...]
    - *Tipografía y Paleta HEX:* [...]
    - *Movimiento y Easing:* [...]
    - *Audio / SFX:* [...]

### 2. PROMPT MAESTRO UNIFICADO (GOOGLE OMNI FLASH / GENERACIÓN IA)
[Dirección artística: estilo, iluminación, colores HEX, materiales y cámara] +
[Especificaciones: 1080x1920, 9:16, 60fps, duración adaptada a 10s-15s] +
[Timeline detallado segundo a segundo: 0.0s-2.5s ..., 2.5s-6.0s ..., etc.] +
[Tipografía consistente] + [Diseño sonoro sincronizado] + [Fotograma final exacto]

### 3. ADAPTACIÓN DIRECTA A FLUXO ("MIS MODIFICACIONES" -> CÓDIGO REMOTION)
- **Marca y Paleta:** Fluxo (`/logo-fluxo.svg`, Azul `#2563EB`, Esmeralda `#10B981`, Fondo `#050811`).
- **Mapeo a Componentes de `src/remotion/`:**
  * Fondo -> `<DarkTechBackground />`
  * Cortes -> `<CutTransitionWrapper cutFrames={[...]} />`
  * Subtítulos -> `<ViralSubtitles variant="figma-selection" />`
  * Métricas / Gráficas -> `<CountUpTicker />` / `<ProgressiveLineChart />` / `<FanCardsDeck />`
```

### Paso 3: Auditoría Visual de Fotogramas Clave (El "Calificador" antes de entregar)
Antes de dar por terminada cualquier escena nueva en Remotion:
1. Ejecutar `npx.cmd tsc --noEmit` (0 errores de tipos).
2. Renderizar al menos 2 a 4 fotogramas clave (`renderStill`) en archivos PNG (`out/audit-*.png`) o usar un script en `scratch/` e inspeccionarlos visualmente con `read_file`.
3. Verificar los **5 Checks de Calidad (Stage 3 Launch-Motion + LuisPa 03b)**:
   - ¿El lienzo respeta los Safe Margins de `120px` vertical y `80px` horizontal sin ningún texto cortado?
   - ¿Las fuentes e imágenes reales (`/logo-fluxo.svg`, fotos de platos) cargan desde el frame 0 sin fallbacks rotos?
   - ¿Los contadores (`CountUpTicker`) duran ~1s (`60 frames`) y las tarjetas entran escalonadas (`stagger`) antes de mostrar su check/badge?
   - ¿Existe coherencia matemática absoluta entre los precios de las tarjetas, la barra inferior y el modal de comanda?
   - ¿La cámara tiene movimiento orgánico continuo sin quedarse congelada más de 1.5s?

---

## 9. Runbook de Resolución de Errores Comunes

1. **Error `npx remotion add` con `EALLOWSCRIPTS` en Node 24 / npm 11:**
   - Todos los paquetes oficiales (`@remotion/paths`, `@remotion/captions`, `@remotion/effects`, `@remotion/media`, `@remotion/tailwind`, `@remotion/cli`) ya están instalados en `package.json` en la versión exacta `4.0.542`. Verificar con `npx.cmd remotion versions` sin ejecutar `remotion add`.
2. **Error `useTexture is not a function` en `@remotion/three`:**
   - Emplear el cargador estándar `new THREE.TextureLoader().load(staticFile('assets/imagen.png'))` dentro de `useMemo`.
3. **Cortes de audio o pitidos estridentes:**
   - Utilizar `SoundEffects.tsx` con síntesis PCM cálida (sub-drop grave a 110Hz→45Hz, tap percusivo de madera a 160Hz, pop orgánico y acorde mayor suave C5-E5-G5).
4. **Textos desbordados al cambiar de local:**
   - Asegurar anchos máximos (`max-w-[700px]`), `min-w-0` en hijos flex y clases `leading-snug tracking-tight text-balance`.
