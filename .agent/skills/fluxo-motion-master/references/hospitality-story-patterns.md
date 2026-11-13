# Patrones de Conversión B2B para Hostelería Adaptados a la Identidad de Fluxo (`HospitalityStoryPatterns.tsx`)

Esta guía codifica los patrones narrativos y visuales de alta conversión para Reels/Shorts de hostelería, **estrictamente adaptados a la identidad visual, paleta de colores, funcionalidades reales y terminología obligatoria de Fluxo (`AGENTS.md`)**.

---

## 1. Diferencias Críticas de Marca y Terminología (Regla Cero de Adaptación)

Queda terminantemente prohibido copiar colores, monedas o regionalismos de referencias externas. Todo vídeo de Fluxo debe aplicar esta tabla de traducción visual y léxica:

| Dimensión | Prohibido (Referencias Externas) | Estándar Oficial de Fluxo (`AGENTS.md`) |
| :--- | :--- | :--- |
| **Paleta Primaria** | Verde pino / Dorado / Beige crema plano | **Azul Real Fluxo (`#2563EB` $\rightarrow$ `#1D4ED8`)**, **Azul Cielo (`#38BDF8`)** y **Esmeralda Operativo (`#10B981`)**. |
| **Fondo Modo Oscuro** | Marrón oscuro (`#0F0C08`) o verde petróleo | **Dark Tech Fluxo (`#050811` $\rightarrow$ `#0F172A`)** con rejilla técnica de cruces SVG (`<DarkTechBackground />`). |
| **Fondo Modo Claro / Diurno** | Crema/amarillo con bajo contraste (`<5%`) | **Daylight Slate-Blue (`<FluxoDaylightBackground />`)** con salto de luminancia `>15%` (`#F8FAFC` Slate-50 $\rightarrow$ `#E2E8F0` Slate-200 $\rightarrow$ `#CBD5E1` Slate-300) + orbes azul/esmeralda + **Isotipo Invertido de Fluxo** (`<FluxoInvertedIsotype />`). |
| **Terminología Culinaria** | *"Mesero"*, *"Celular"*, *"Escandallos"*, *"Food Cost"*, *"ITBIS"* | **"Camarero"**, **"Móvil"**, **"Coste de ingredientes / materia prima"**, **"Margen limpio"**, **"IVA incluido"**. |
| **Moneda** | Pesos (`RD$`) o dólares (`$`) sin formato | **Euros con coma decimal (`14,50 €`)**. |
| **Funcionalidades** | Juegos de mesa (Conecta 4), placas NFC doradas | **Funciones Reales de Fluxo:** Carta Digital QR (filtros Sin Gluten/Veggie, multi-idioma ES/EN/FR/DE, clave WiFi en 1 toque, llamar al camarero, comanda compartida), Comandero de Sala, KDS de Cocina (`barra` vs `cocina`) y Control de Costes/Bot IA de Cartas. |

---

## 2. Los 6 Componentes de Conversión en `src/remotion/components/HospitalityStoryPatterns.tsx`

### 2.1 `<FluxoDaylightBackground />` + `<FluxoInvertedIsotype />`
- **Cuándo usarlo:** Vídeos diurnos de terraza, casos de uso del comensal en mesa (turista en inglés, clave WiFi, llamar al camarero) o cartas luminosas.
- **Cumplimiento de `AGENTS.md`:** Aplica el salto de luminancia obligatorio (`#F8FAFC` $\rightarrow$ `#E2E8F0` $\rightarrow$ `#CBD5E1`) e incluye el **Isotipo Invertido oficial de Fluxo** (contenedor blanco con la `'F'` en degradado `#2563EB` a `#1D4ED8`).

### 2.2 `<SplitSyncConnector />` (Pantalla Dividida Cliente QR $\leftrightarrow$ Comandero / Cocina KDS)
- **Cuándo usarlo:** Para demostrar el **Plan Sala Viva** en tiempo real sin cortes de cámara.
- **Cómo funciona:**
  - **Mitad Superior (`y = 260px - 860px`):** Móvil del comensal en la Carta QR de Fluxo pidiendo un plato o pulsando *"Llamar camarero"*.
  - **Centro (`y = 920px`):** Píldora divisoria de tiempo real (`🕒 SÁB 21:30 · SINCRONIZACIÓN EN VIVO`).
  - **Mitad Inferior (`y = 980px - 1580px`):** Vista del **Comandero de Sala** o **KDS de Cocina** de Fluxo.
  - **Hilo Conector (`evolvePath`):** Una curva Bezier azul/esmeralda con nodo luminoso viaja desde el botón pulsado arriba hasta el ticket o mesa que se ilumina abajo.

### 2.3 `<SpotlightActionCard />` (Tarjetas UI Destiladas en Primer Plano)
- **Cuándo usarlo:** Cuando una pantalla completa de móvil tendría letra demasiado pequeña. En lugar de mostrar 20 elementos, se aísla **solo el modal protagonista a gran escala (`max-w-[880px]`)** en el centro del lienzo 9:16 con una píldora flotante superior (`contextPillText`: `✅ Sin preguntar la clave`, `🇬🇧 -> 🇪🇸 Traducción automática`, `🔔 Aviso instantáneo en comandero`).

### 2.4 `<KitchenMarginComparison />` (Comparativa de Coste de Ingredientes y Margen)
- **Cuándo usarlo:** Vídeos dirigidos al dueño de restaurante sobre rentabilidad y subida de precios de proveedores (aceite, carne, bebida).
- **Cómo funciona:** Compara el **Local 1 (Sin control de materia prima)** en alerta roja (`#EF4444`) frente al **Local 2 (Con Fluxo Control de Costes)** mostrando en grande: *Precio Venta (€)*, *Coste de Ingredientes (€ y %)* y *Margen Limpio (€)*.

### 2.5 `<SocialConversionCTA />` (Cierre Interactivo de 3.5s)
- **Modos disponibles:**
  1. `mode="comment-dm"`: Simula a un hostelero escribiendo `FLUXO` en la barra de comentarios $\rightarrow$ clic en `Publicar` $\rightarrow$ notificación emergente superior con el isotipo invertido: *"Fluxo te ha enviado un mensaje privado con la demo de tu restaurante"*.
  2. `mode="whatsapp-chat"`: Simula el chat de WhatsApp B2B de Fluxo respondiendo al instante con el botón esmeralda `✓ Ver cómo queda en mis mesas`.

---

## 3. Catálogo de 6 Guiones / Arquetipos Micro-Dolor Listos para Producir en Fluxo (20s - 30s)

Cuando el usuario quiera crear un Reel de conversión rápida para redes o WhatsApp, puede elegir cualquiera de estos **6 Arquetipos de Un Solo Dolor**:

1. **Arquetipo A — *"La Mesa 6 escaneó el QR: mira lo que pasa en tu local"* (`SplitSyncConnector`):**
   - *Paso 1:* El cliente pide desde su móvil $\rightarrow$ el hilo azul baja al Comandero y marca la Mesa 6 ocupada.
   - *Paso 2:* Cocina lo ve al instante en el KDS y lo marca `¡Listo!` $\rightarrow$ el hilo esmeralda avisa al camarero.
   - *Paso 3:* El cliente pulsa *"Llamar camarero"* o *"Pedir la cuenta"* $\rightarrow$ salta alerta persistente en sala.
2. **Arquetipo B — *"Un turista en tu mesa... y tu carta solo en español"* (`SpotlightActionCard`):**
   - Globo `🇬🇧 Sorry... English?` $\rightarrow$ toca el selector `ES -> EN` en la cabecera de la Carta Fluxo $\rightarrow$ ve los platos e ingredientes en inglés y pide solo $\rightarrow$ **a tu cocina le entra la comanda en español** con aviso `🇬🇧 Cliente en inglés`.
3. **Arquetipo C — *"¿Y después de escanear el QR qué pasa?"* (Secuencia de 4 `SpotlightActionCard`):**
   - Muestra 4 micro-utilidades de Fluxo en 20s: (1) Ver clave WiFi y copiar en 1 toque, (2) Filtrar platos *Sin Gluten / Veggie* sin preguntar a cocina, (3) Llamar al camarero sin levantar la mano, (4) Ver la comanda compartida de la mesa en vivo.
4. **Arquetipo D — *"Dos cocinas venden la misma hamburguesa a 14,50 €, pero sube el aceite"* (`KitchenMarginComparison`):**
   - Compara la cocina que vende a ciegas frente a la cocina que controla el **coste de ingredientes y materia prima** en Fluxo y recibe alertas cuando sube un proveedor.
5. **Arquetipo E — *"Cambiar precios o el menú del día en 10 segundos con el Bot IA de Cartas"* (`SpotlightActionCard` + `SplitSyncConnector`):**
   - El hostelero envía un prompt/foto al Bot IA de Fluxo $\rightarrow$ aparece la vista previa de confirmación (`StagingDiff` en 1 clic) $\rightarrow$ se actualiza al instante en todos los QR de las mesas y en el Comandero.
6. **Arquetipo F — *"Varios comensales en la misma mesa pidiendo a la vez"* (`DualPhoneParallel`):**
   - Dos móviles en paralelo (`🔵 Carlos` y `🟢 Laura`) añadiendo platos desde su propio móvil $\rightarrow$ convergen en una única comanda sincronizada por UUID en la Mesa 6 sin duplicar ni perder rondas.
