# [PRODUCT / LOCAL] — Storyboard Maestro de Lanzamiento (5 Escenas @ 60 FPS)

Fuente: Metodología `launch-motion` de Sanji Nai-Chien (`D5qpBbEWTxo` + `higgsfield.ai/@sanjii`) adaptada a Fluxo.

**Regla estricta:** Jamás animar sin un storyboard previo. El storyboard es la Fuente Única de Verdad para el orden de escenas, qué hay en pantalla, cómo se mueve, hacia dónde va la cámara y el rango exacto de fotogramas a 60fps.

## Plantilla de Escena

**Scene N · [Nombre] ([hook / problem / fix / payoff / logo])** — [inicio]–[fin] s, frames [a]–[b]
- **On screen:** Qué elementos vectoriales/UI aparecen en pantalla.
- **Motion:** Duración de entradas (~0.5s / 30f con ligero overshoot), salidas (~60% de la entrada), arcos de cursor (`interpolateCursorArc`) y contadores (~1s / 60f).
- **Camera:** Push-in lento (`100% -> 106%`), pan con `smoothstep` o `camera pull-back` final.

---

## Ejemplo Relleno 1: Pitch Comercial Corto 15s (900 frames @ 60fps — WhatsApp B2B)

- **Escena 1 · Hook & Identidad del Local** — `0:00–0:03.5` (`frames 0–210`)
  - *On screen:* Lienzo continuo `ContinuousMenuCanvas` con cabecera oficial del local, badge `📍 MESA 12 · TERRAZA`, aviso ámbar y grid 2x2 de platos reales.
  - *Motion:* Entrada con resorte `MASTER_SPRING_CONFIG` y aparición escalonada de tarjetas.
  - *Camera:* Push-in suave `112% → 122%` enfocado en la cabecera y primera fila.
- **Escena 2 · Selección en 1 Toque (Product in Action)** — `0:03.5–0:08.0` (`frames 210–480`)
  - *On screen:* El cursor táctil (`TouchCursor`) viaja en arco Bezier (`interpolateCursorArc`) hacia la píldora de variante (`Xarra 500ml` / `Media Ración`), pulsa `+`, cruza a la tarjeta 2 y emerge la barra inferior oscura con el importe exacto.
  - *Motion:* Micro-compresión en cada toque (`scale: 1 -> 0.82 -> 1` en 8 frames), pulso en tarjeta y subida de la barra inferior.
  - *Camera:* Paneo suave acompañando al cursor y descenso hacia la barra inferior en `frames 420–465`.
- **Escena 3 · Comanda Limpia Sin Errores (Fix)** — `0:08.0–0:12.0` (`frames 480–720`)
  - *On screen:* Se despliega el cajón de comanda sobre el mismo DOM continuo con paridad matemática 1:1 respecto a los platos seleccionados.
  - *Motion:* Entrada vertical del modal + cascada de líneas de pedido.
  - *Camera:* Dolly-in continuo (`120% → 128%`) para evitar fotogramas congelados.
- **Escena 4 · Payoff + Logo + CTA** — `0:12.0–0:15.0` (`frames 720–900`)
  - *On screen:* Corte óptico (`CutTransitionWrapper`), isotipo `/logo-fluxo.svg`, propuesta de valor y botón verde de WhatsApp.
  - *Motion:* Pulso en CTA en `frame 810` con acorde cálido `chime`.

---

## Ejemplo Relleno 2: Vídeo de Lanzamiento SaaS 30s (1800 frames @ 60fps)

1. **Scene 1 · Pile-up (Hook)** — `0:00–0:04` (`frames 0–240`): Tarjetas de tareas/comandas apilándose con overshoot escalonado. Contador superior derecho sube `0 → 200` en 1s (`60 frames`) con resplandor rojo (`Polish 1 — Counter Glow`). Cámara: `100% → 106%`.
2. **Scene 2 · The Grind (Problem)** — `0:04–0:11` (`frames 240–660`): Cursor moviéndose en arcos Bezier (`interpolateCursorArc`) entre ventanas con pausa humana (`Polish 2 — Cursor Hesitation`).
3. **Scene 3 · Product Kicks In (Fix)** — `0:11–0:19` (`frames 660–1140`): UI vectorial real (nunca capturas PNG). Las 4 tarjetas de estación (`StationCardsCascade`) entran escalonadas (`Fix 4`) y dan un micro-pulso (`Polish 3 — Card Pulse`) al activarse.
4. **Scene 4 · Payoff (Clear Board)** — `0:19–0:25` (`frames 1140–1500`): Cascada de checkmarks (`Polish 4 — Checkmark Cascade`), contador baja `200 → 0` en 1s y la cámara retrocede (`Polish 5 — Camera Pull-Back`) manteniendo la vista despejada durante `≥1.5s` (`90 frames`).
5. **Scene 5 · Logo + CTA** — `0:25–0:30` (`frames 1500–1800`): Construcción del logo `/logo-fluxo.svg`, tagline con offset y deriva suave hasta el final.
