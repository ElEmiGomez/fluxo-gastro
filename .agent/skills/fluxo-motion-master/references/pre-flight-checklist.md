# Protocolo Obligatorio Pre-Vídeo (Doble Gate + Plantilla Rápida de Pedido)

Este protocolo es **obligatorio** antes de crear o renderizar cualquier vídeo nuevo en `src/remotion/`. Garantiza 0% de resultados no deseados, 0% de precios/fotos inventadas y 100% de alineación visual antes de gastar tiempo en el renderizado MP4.

---

## 1. El Flujo de Doble Gate (Cómo Interactúan Usuario y Agente)

### PASO 0: Recomendación Proactiva del Modelo
Al recibir la petición, el agente indicará qué modelo conviene tener activo:
- **Gemini 4 Argon:** Para diseño de nuevas escenas, interpolaciones matemáticas (curvas Bezier, cámaras 2.5D, spring physics) e inspección visual de fotogramas PNG en el Gate 2.
- **Gemini 3.8 Flash:** Para sustitución de datos en presets existentes (platos, fotos, precios) y lanzamiento del comando de renderizado MP4.

### GATE 1: Cuestionario Inicial (`ask_question`) + Aprobación de Storyboard en Texto
Si el usuario pide un vídeo sin detallar los 5 bloques de abajo, el agente **NO escribe código todavía**. Primero utiliza la herramienta `ask_question` para resolver las dudas pendientes:

1. **Modo de Vídeo:**
   - `[1]` **Pitch Comercial Personalizado por Local (15s):** Vídeo para enviar por WhatsApp al dueño de un bar con su logo, sus 4 platos reales, selección de variantes en 1 toque y comanda limpia.
   - `[2]` **Anuncio / Reel Viral de Marca Fluxo (6s–15s):** Póster 3D Editorial (`FluxoEditorialShowcase`) o Dashboard de ROI/Métricas (`FluxoDataROIShowcase`) para Instagram, TikTok o Ads.
   - `[3]` **Vídeo de Lanzamiento / Explicativo Largo (30s en 5 escenas):** Estructura `Hook (Pile-up)` $\rightarrow$ `Problema (Grind)` $\rightarrow$ `Solución Fluxo (UI Vectorial)` $\rightarrow$ `Payoff (Cascada de Checkmarks + Pull-Back)` $\rightarrow$ `Logo + CTA`.
   - `[4]` **Recreación / Clonación de un Vídeo de Referencia:** Ingeniería inversa de un vídeo o enlace externo adaptada a la marca y componentes de Fluxo.
2. **Formato y Duración (Estándar fijo: 60 FPS @ 120 BPM):**
   - **Formato:** `9:16 Vertical (1080x1920)`, `16:9 Horizontal (1920x1080)`, `1:1 Cuadrado (1080x1080)` o `Ambos (16:9 + recorte 9:16)`.
   - **Duración:** `6s (360 frames)`, `10s (600 frames)`, `15s (900 frames)` o `30s (1800 frames)`.
3. **Datos Reales, Logos, Fotos y Precios (Prohibido Inventar):**
   - Nombre del local o título principal, badge de zona/mesa (ej. `📍 MESA 12 · TERRAZA`).
   - Platos/métricas exactas, variantes (ej. `Caña 2,00 €` / `Xarra 3,80 €`) y suma matemática verificada.
   - Origen de imágenes y logos: rutas existentes en `public/`, generación con IA (`image-generator` / Imagen Ancla), o catálogo actual.
4. **Estilo Visual, Subtítulos y Fondo:**
   - **Subtítulos:** `Caja de selección azul estilo Figma (figma-selection)` / `Píldora amarilla estilo Hormozi (hormozi-pill)` / `Titulares cinéticos Blur-Up sin subtítulos`.
   - **Fondo:** `Rejilla técnica oscura de cruces (#050811 + DarkTechBackground)` / `B-Roll cinemático con Imagen Ancla (Google Flow)` / `Fondo claro corporativo`.
5. **Diseño Sonoro:**
   - `Efectos SFX sintéticos nativos (SoundEffects.tsx: sub-drop, tap, pop, chime)` / `Pista musical en public/` / `Mudo`.

> **Acción de cierre del Gate 1:** Con estos 5 puntos claros, el agente presenta la tabla del **Storyboard escena por escena** (con segundos, rango de frames a 60fps, textos exactos en pantalla, movimientos de cámara y suma de precios) y **se detiene esperando el OK del usuario**.

---

### GATE 2: Muestra de 3 a 4 Fotogramas Estáticos (`renderStill` PNG)
Una vez que el usuario da el OK al Storyboard del Gate 1:
1. El agente implementa o parametriza la composición en `src/remotion/`.
2. Ejecuta `npx.cmd tsc --noEmit` (debe dar `0 errores`).
3. Renderiza **3 a 4 fotogramas clave en PNG** (`out/audit-*.png`) que muestren cada escena y transición importante.
4. Inspecciona los PNG con `read_file` para verificar márgenes seguros (`120px` Y, `80px` X), ausencia de textos cortados y paridad de precios, y **se los muestra al usuario esperando su aprobación visual**.

---

### FASE FINAL: Renderizado del Vídeo `.mp4`
Únicamente cuando el usuario confirma que los fotogramas PNG del Gate 2 están perfectos, el agente ejecuta el renderizado del archivo `.mp4` final (`npx.cmd remotion render ...`).

---

## 2. Plantilla Rápida de Pedido para el Usuario (Copia y Pega)

Si quieres saltarte las preguntas iniciales y darme todas las indicaciones de golpe cuando me pidas un vídeo, puedes copiar y rellenar esta ficha rápida:

```markdown
Quiero hacer un vídeo nuevo en Remotion con estas especificaciones:
1. MODO DE VÍDEO: [1: Pitch Local WhatsApp / 2: Reel Viral Marca / 3: Lanzamiento 30s / 4: Recrear vídeo de referencia (link)]
2. FORMATO Y DURACIÓN: [9:16 Vertical / 16:9 Horizontal] · [6s / 10s / 15s / 30s] (a 60fps / 120 BPM)
3. DATOS, FOTOS Y PRECIOS:
   - Local / Titular: [...]
   - Mesa / Subtítulo: [...]
   - Platos y Variantes (o Métricas):
     * Item 1: [Nombre] -> Variantes: [Opción A: X,XX € | Opción B: Y,YY €] -> Foto: [ruta en public/ o "generar con IA"]
     * Item 2: [Nombre] -> Variantes: [Opción A: X,XX € | Opción B: Y,YY €] -> Foto: [ruta en public/ o "generar con IA"]
4. ESTILO VISUAL:
   - Subtítulos: [Caja azul Figma / Píldora amarilla Hormozi / Sin subtítulos]
   - Fondo: [Rejilla técnica oscura #050811 / B-Roll con Imagen Ancla / Claro]
5. AUDIO: [SFX sintéticos nativos / Música en public/ / Mudo]
6. NOTAS EXTRA / CTA FINAL: [...]
```
