# Optimización GPU en Remotion v4, Reglas de `saas-animation v2` y Ecosistema de Herramientas (DeepResearch 2026)

Este documento consolida la ingeniería avanzada del informe **DeepResearch de Gemini (26 páginas)** y del paquete **`saas-animation v2.skill`** (Rourke) para Fluxo.

---

## 1. Paquetes Oficiales Acelerados por GPU en Remotion v4 (`4.0.542`)

Todos los paquetes `@remotion/*` en `package.json` están fijados exactamente a la versión `4.0.542` (sin `^`) y los renders en consola utilizan `--gl=angle` para habilitar WebGL2/WebGPU en Chromium headless:

### A. `@remotion/motion-blur` (`<CameraMotionBlur>` y `<HtmlInCanvasMotionBlur>`)
- **Propósito:** Simula un obturador rotatorio de cine (`shutterAngle={180}`, `samples={8}` a `12`) promediando sub-fotogramas temporales para eliminar la rigidez de las animaciones DOM.
- **REGLA CRÍTICA DE CONTEXTO REACT (Pitfall #1 de Remotion):**
  - Tanto `<HtmlInCanvasMotionBlur>` como `<CameraMotionBlur>` manipulan el contexto interno de React que almacena el frame actual.
  - **PROHIBIDO** llamar a `useCurrentFrame()` en el componente padre y pasarlo como prop al hijo. **`useCurrentFrame()` DEBE invocarse siempre dentro de un componente hijo envuelto por `<CameraMotionBlur>` o `<HtmlInCanvasMotionBlur>`**, de lo contrario el desenfoque de movimiento no tendrá ningún efecto.

### B. `@remotion/transitions` (`<TransitionSeries>` y `<TransitionSeries.Overlay>`)
- **`<TransitionSeries>`:** Encadena escenas con solapamiento matemático ($D_{\text{total}} = D_1 + D_2 - D_t$) usando `springTiming()` o `linearTiming()` y presentaciones como `fade()`, `slide()`, `wipe()`, `flip()` o transiciones GPU (`blurSlide()`, `crossZoom()`).
- **`<TransitionSeries.Overlay>`:** Permite superponer un destello, fuga de luz o **Shape-Morph** exactamente sobre el corte entre dos escenas **sin acortar** la duración de las secuencias adyacentes.

### C. `@remotion/effects` (`<HtmlInCanvas effects={[...]}>`)
- Permite aplicar shaders WebGL2/WebGPU sobre el DOM transferido a GPU: `blur()`, `lensBlur()`, `linearProgressiveBlur()` / `radialProgressiveBlur()` (efecto *tilt-shift* sobre cartas o dashboards), `zoomBlur()`, `glow()`, `chromaticAberration()` y `pageTurn()`.

---

## 2. Reglas de Estudio de `saas-animation v2.skill` (Rourke)

1. **Shape-Morph Transitions (Cada plano se transforma en el siguiente):**
   - Evitar fundidos cruzados (*cross-dissolves*). El objeto clave del plano saliente (círculo de logo, tarjeta, píldora de variante o botón) sufre una **anticipación del `~8%` (`scale: 0.92`)**, crece hasta inundar el encuadre con el color de fondo del siguiente plano, y el nuevo plano emerge suavemente (`93% → 100%`).
2. **Una Sola Cámara Continua sin Inversión de Dirección (`≤90°`):**
   - Prohibido hacer zoom-in e inmediatamente zoom-out sobre el mismo sujeto, o girar a la derecha y frenar para volver a la izquierda.
   - Ritmo de cámara: **rápido al principio y lento durante mucho tiempo** (*exponential ease-out* en la apertura, seguido de deriva continua suave).
3. **Iluminación de Una Sola Fuente y Profundidad de Campo (Shallow DoF):**
   - Mantener el sujeto en el centro exacto (*invisible crosshair*) completamente nítido y desenfocar suavemente el fondo lejano.
4. **Centrado por Caja Visible (Bounding Box) en la Escena Final:**
   - En la tarjeta final (End Card), la cámara no debe tener deriva (*zero drift*) y el logotipo debe centrarse por su caja geométrica visible.
5. **Integración hacia Vídeo Real (`into-footage.md`):**
   - Cuando una animación en código termina fundiéndose con un vídeo grabado en un bar real: extraer el primer fotograma del clip real (`ffmpeg`), alinear la posición/escala final del teléfono renderizado con el objeto real y desvanecer el fondo negro en los últimos `0.5s`.

---

## 3. Diseño Sonoro 48 kHz con Imagen Estéreo Haas (`sound-and-music.md` + `synth_sfx.py`)

- **Regla de Oro de los Whooshes:** Usar *whooshes* (barridos de aire filtrado entre `-26 dB` y `-33 dB`) **únicamente cuando hay desplazamiento espacial o movimiento de cámara**. Un corte o cambio de forma (*shape-morph*) lleva un `pop`, `tick` o `soft hit`, nunca un *whoosh*.
- **Variación de Tono (Pitch Ratchet):** Nunca repetir el mismo sample de clic con idéntico tono; en secuencias escalonadas (como 4 platos o 4 checkmarks), subir ligeramente el pitch en cada paso (`0.95 -> 1.05 -> 1.15 -> 1.25`).
- **Locución (Voiceover):** Máximo `~2.2 palabras por segundo` (`10s ≈ 18–22 palabras`, `15s ≈ 28–32 palabras`), dejando los últimos `2 segundos` libres para el cierre de marca.

---

## 4. Matriz de Herramientas Complementarias (Gratis vs Pago — Windows & Mac)

| Categoría | Mejor Opción Gratuita (`0 €`) | Mejor Opción de Pago Único / Suscripción | Cuándo Usarla con Fluxo |
| :--- | :--- | :--- | :--- |
| **Motor de Vídeo en Código** | **Remotion v4** (Gratis hasta 3 personas) / **Revideo** (MIT 100% libre en servidor) | Licencia Corporativa Remotion | Generación masiva de Pitches de WhatsApp y Reels B2B desde componentes React. |
| **Motion Design 2D & Infografías de Datos** | **Cavalry 2.7+** (`0 €` gratis desde abril 2026 con cuenta Canva; incluye físicas 2D *Forge Dynamics*, CSV binding y exportación nativa a Lottie JSON) | **Jitter Pro** (`$10–$19/mes`) / **Rive Cadet** (`$9/mes`) | Crear infografías vectoriales o iconos animados (🍺/🍰) e importarlos en Remotion con `@remotion/lottie` o `@remotion/rive`. |
| **Editor Visual de Curvas y Cámaras 3D** | **Theatre.js Studio** (`@theatre/core` + `@theatre/studio`, Apache-2.0) | **Spline** (Free con 20 llamadas MCP/día; Hobby `$12/mes`) | Esculpir curvas Bézier de cámara 3D con el ratón en el navegador y exportar `state.json` determinista para Remotion. |
| **Modelado y Producto 3D** | **Blender** (`0 €` + `Blender MCP` / scripts Python headless `kit.py`) | — | Planos fotorrealistas de hardware (comandero, TPV, soporte QR de madera en mesa). |
| **Grabador de Pantalla Cinemático (Demos KDS / Mapa de Mesas)** | **OBS + Remotion** | **ScreenKite** (`$79.99–$99.99` pago único, Mac + Windows Beta, 83 herramientas MCP para Antigravity) / **Recorded** (`$5/mes` en Windows/Mac) / **SmoothCapture** (`$49` único) | Grabar en 5 minutos flujos largos en vivo del KDS de cocina o Comandero con auto-zoom al clic. |
| **Efectos de Sonido UI (WAV 48 kHz)** | **Síntesis Nativa 48kHz (`SoundEffects.tsx`)** + **Itch.io Essential UI SFX** (CC0 gratis) + **Morphic AI SFX** (Freemium) | **Sonniss Interfaces** (Pago único) / **Epidemic Sound** (Conector MCP) | Sonorizar toques táctiles, aperturas de cajón, contadores y cierres de marca. |
