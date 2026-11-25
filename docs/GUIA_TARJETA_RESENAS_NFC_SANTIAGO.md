# Guía Operativa: Soporte Físico de Reseñas NFC + QR (Estrategia Santiago)

## 1. Estrategia Comercial en Santiago de Compostela
Santiago vive del turismo (Camino de Santiago, escapadas de fin de semana) y de Google Maps. Un objeto físico en la barra genera confianza instantánea y cierra ventas mucho más rápido que vender solo software.

- **Opción A — Gancho de Cierre en Suscripción (Incluido Gratis):**
  - Al contratar la **Carta QR mensual (15 €/mes + IVA)** o **Socio Fundador (50 €/mes)**, regalas el soporte físico de barra de Google Reviews instalado en el momento.
  - *Argumento:* "La placa de reseñas suelta vale 20 €, pero si activamos tu Carta Digital a 15 €/mes hoy, la placa te sale completamente gratis."
- **Opción B — Puerta de Entrada / Downsell (20 € pago único):**
  - Si el hostelero dice que ahora no quiere Carta QR ni mensualidades, ofreces solo el soporte físico de reseñas por **20 € pago único** (grabando directamente su enlace nativo de Google Maps, cero mantenimiento futuro).
  - **Unit Economics:** Coste material ~2–3 € → margen neto ~17 € en el acto + dejas tu marca en su barra + ganas confianza para volver en 2–3 semanas a venderle la Carta QR.

---

## 2. Qué Comprar (Coste Real ~2 € a 3 € por local)
No necesitas maquinaria ni imprentas caras para arrancar:

1. **Pegatinas / Tags NFC vírgenes (Chip NTAG213 o NTAG215):**
   - Búscalas en Amazon o AliExpress como `"pegatinas NFC NTAG215"` (o `NTAG213`).
   - Un paquete de 30–50 pegatinas cuesta unos **8–12 €** (~0,25 € por local).
   - **Nota técnica:** Que sean redondas de 25 mm o 30 mm y **no** las pegues directamente sobre metal (sobre metacrilato, papel o plástico funcionan perfecto; si la barra es metálica, el soporte de metacrilato ya las aísla).
2. **Soportes de sobremesa de metacrilato 10×15 cm (forma de L o T):**
   - Búscalos como `"portafotos metacrilato 10x15 sobremesa"` o `"expositor sobremesa acrílico A6"`.
   - Comprando packs de 6 o 10 unidades salen a **1,80 € – 2,50 €** cada uno.
3. **Impresión del diseño:**
   - Entra en Fluxo a `/admin/print-review-stand/[slug]` (ejemplo: `/admin/print-review-stand/bar-jaratusas`).
   - Imprime el diseño en papel fotográfico o cartulina 200–300 g (0,30 € en cualquier copistería), recorta, pega la pegatina NFC por detrás de la cartulina (a la altura del botón azul "NFC") y mételo dentro del metacrilato.

---

## 3. Cómo Grabar el Chip NFC con tu Móvil (2 Minutos, Gratis)
No hace falta ordenador ni grabador especial. Cualquier Android con NFC o iPhone (iPhone 7 o superior) lo graba en 5 segundos:

1. Descarga la app gratuita **NFC Tools** (disponible en Google Play y App Store).
2. Abre la app y entra en la pestaña **Escribir**.
3. Pulsa **Añadir un registro** → elige **URL / URI**.
4. Pega el enlace inteligente de Fluxo para ese local:
   - Ejemplo: `https://tudominio.com/r/bar-jaratusas`
   - *(Puedes copiarlo con 1 clic desde `/admin/print-review-stand/[slug]`)*
5. Pulsa **Aceptar** y luego el botón **Escribir**.
6. Acerca la pegatina NFC a la parte trasera de tu móvil (en iPhone está arriba cerca de la cámara; en Android suele estar en el centro/arriba).
7. Sonará un *bip* con el mensaje **"Escritura completada"**. ¡Listo! Prueba a acercar tu móvil con la pantalla desbloqueada y verás saltar la notificación de Google Reviews al instante.

*(Opcional: en la pestaña "Otros" de NFC Tools puedes pulsar **Bloquear etiqueta** si no quieres que nadie la sobrescriba, pero hazlo solo cuando estés 100% seguro de que la URL funciona bien, porque el bloqueo es permanente. Como la URL apunta a `/r/[slug]` en Fluxo, siempre podrás cambiar el comportamiento desde tu código sin tocar el chip físico).*

---

## 4. Funcionamiento Técnico en Fluxo (`/r/[slug]`)
- **Estado actual por defecto (Opción 2 activa):** `enableReviewGatekeeper: false` en `src/lib/web-tenants.ts`.
  - Al tocar con NFC o escanear el QR, el cliente ve 0,6 segundos la tarjeta de confirmación y salta directamente a Google Maps Reviews.
  - Además, cuenta los toques en segundo plano.
- **Modo Filtro Inteligente preparado (Opción 1 lista para activar):**
  - Basta con cambiar `enableReviewGatekeeper: true` en el local (o abrir `/r/[slug]?mode=gatekeeper` para enseñarlo en demo).
  - 4–5 estrellas → redirige directo a Google Maps.
  - 1–3 estrellas → abre formulario privado de mejora dirigido al dueño (y botón opcional de WhatsApp) para proteger la nota pública.
