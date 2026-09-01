# 🎨 DISEÑO DE MARCA & MANUAL DE INTERFAZ — FLUXO
> **Departamento:** Diseño de Marca & UI/UX  
> **Chat Asociado:** [`dde643cc-47dd-47d3-9adc-fcae77e49214`](conversation://dde643cc-47dd-47d3-9adc-fcae77e49214)

---

## 🎨 Identidad Cromática & Tokens de Interfaz

| Color | Hexadecimal | Rol en la Aplicación |
| :--- | :---: | :--- |
| **Azul Salón** | `#0F172A` / `#1E3A8A` | Fondos de cabecera, barras inferiores y sobriedad nocturna. |
| **Cian Eléctrico** | `#06B6D4` / `#2563EB` | Botones de acción principales (CTA), badges de mesa activa. |
| **Verde Comanda** | `#10B981` / `#047857` | Platos listos en cocina, pedidos cobrados con éxito. |
| **Ámbar Fuego** | `#F59E0B` / `#D97706` | Comandas pendientes de confirmación del mozo y platos en cocción. |
| **Blanco Nieve** | `#FFFFFF` | Tarjetas de menú con contraste solar para terrazas al aire libre. |

---

## ✍️ Tipografías

* **Titulares & Nombres de Platos:**  
  *Fuentes:* **Clash Display** o **Outfit** (Alternativa: *Plus Jakarta Sans Bold*).  
  *Uso:* Títulos destacados, cabeceras de categorías, nombres de hamburguesas y raciones.
* **Cuerpo & Precios:**  
  *Fuentes:* **Inter** / **Plus Jakarta Sans** con números tabulares obligatorios (`tabular-nums`) para que los precios alineen siempre verticalmente.
* **Comandas y Avisos de Cocina:**  
  Mayúsculas fijas y negrita extrema (`font-black uppercase tracking-wider`).

---

## 📱 Principios de Ergonomía Móvil (UX)

1. **La Regla del Pulgar:** Las acciones vitales para el comensal (abrir comanda, sumar ítems, pedir la cuenta) se concentran en el 35% inferior de la pantalla del smartphone.
2. **Botones de Cocina Masivos (>70px):** Accionamiento fiable con guantes o nudillos.
3. **Micro-Interacciones con Vibración (Haptics):**
   - Añadir plato al carrito: `navigator.vibrate(15)` (toque sutil de confirmación).
   - Llamar al mozo / cuenta: `navigator.vibrate([50, 80, 50])` (aviso perceptible).
   - Toque de 5 Estrellas Google Review: `navigator.vibrate([30, 40, 30])` (feedback celebratorio de éxito).

---

## ⭐ 4. Componente Visual "Google Review Booster"
* **Objetivo UX:** Cero fricción psicológica. Convertir la satisfacción de la comida en una reseña pública de 5 estrellas en menos de 2 segundos.
* **Geometría de Toque:**
  - Estrellas de tamaño `size={26}` con padding expandido (`p-2`) apto para cualquier grosor de pulgar.
  - Hover / Active scaling: `scale-125` animado para sensación táctil gratificante.
* **Tratamiento Cromático:**
  - Fondo: Gradiente suave `amber-50/60` con borde sutil `amber-100` (evita parecer publicidad invasiva o spam).
  - Estrellas: `#F59E0B` (Amber 500) con drop-shadow dorado.
* **Filtrado Visual Constructivo:** Si el cliente toca 1, 2 o 3 estrellas, la interfaz no lo expone a Google Maps; muestra un agradecimiento cálido con icono `HeartHandshake` y guarda la sugerencia de forma privada.

---

## 🆚 5. Filosofía Visual: Fluxo vs. La Saturación de TPVs Tradicionales
* **El Problema de la Competencia (Qamarero / Food & Service):**
  - Interfaces atestadas de tablas contables, menús colapsables profundos, opciones fiscales y módulos de stock en pantallas de 10 pulgadas.
  - Provocan fatiga visual en los camareros tras 8 horas de turno y rechazo inmediato en personal de hostelería tradicional.
* **La Respuesta Visual de Fluxo:**
  - **Minimalismo Operativo:** Fondo blanco y gris asfalto (`#F8FAFC`) de altísimo contraste legible bajo el sol de una terraza de Noia o el interior tenue de un mesón.
  - **Semáforo Intuitivo de Mesas:** Libre (gris/borde suave), Ocupada (azul salón), Llamando (ámbar fuego parpadeante) y Comanda Lista (verde esmeralda).
  - **Tipografía Tabular:** Alineación geométrica de importes para que el camarero identifique subtotales de un solo vistazo.

---

## 🖨️ 6. Materiales Físicos Imprimibles & Onboarding en Restaurante

Para garantizar una adopción del 100% el primer día de servicio en terrazas y salas de Galicia (Noia, Barbanza, Santiago), se han estandarizado tres piezas físicas en formato HTML listo para imprimir:

### 📄 6.1. Cartel de Bienvenida de Terraza A5 (`/public/cartel_bienvenida_terraza_a5.html`)
* **Dimensiones:** A5 Vertical (`148mm × 210mm`).
* **Ubicación:** Pizarra de entrada, pie de terraza o marco acrílico en barra.
* **Propósito:** Explicar al comensal en 3 pasos visuales cómo pedir con el móvil sin instalar aplicaciones ni esperar al mozo.
* **Características de Diseño:**
  - Isotipo oficial de Fluxo en SVG vectorial.
  - Código QR de alta resolución con selector de mesa/terraza.
  - Acentos cromáticos en Cian Eléctrico (`#06B6D4`) y Azul Salón (`#0F172A`).
  - Barra superior en pantalla con alternancia de Modo Claro/Oscuro y botón de impresión directa (`@media print`).

### 📋 6.2. Guía Rápida / Chuleta de Barra para Camareros con PIN (`/public/chuleta_camarero_barra.html`)
* **Dimensiones:** A5 Horizontal (`210mm × 148mm`).
* **Ubicación:** Pegada o plastificada junto a la tiquetera ESC/POS, datáfono o caja de cobros.
* **Propósito:** Capacitar a cualquier camarero nuevo en menos de 60 segundos sobre el protocolo del Mozo Gatekeeper (`pending_validation`), llamadas de mesa y seguridad de PIN.
* **Características de Diseño:**
  - Espacio interactivo en pantalla para personalizar el PIN del restaurante (`PIN STAFF: 1234`).
  - Semáforo de estados de mesas en sala (Gris: Libre, Azul: Ocupada/Llamando, Ámbar: Validar comanda, Verde: Pase listo).
  - Regla de oro visual: *"Toca $\rightarrow$ Valida $\rightarrow$ Marcha"*.

### 🪟 6.3. Lote de Peanas QR de Metacrilato A6 (Mesas 1 a 10) (`/public/peanas_qr_imprimibles.html`)
* **Dimensiones:** Hojas A4 (`210mm × 297mm`) conteniendo 2 peanas A6 (`105mm × 148mm`) por hoja con líneas de corte punteadas.
* **Ubicación:** Soportes verticales de metacrilato transparente tipo "T" o "L" en cada mesa.
* **Propósito:** Enlace directo de cada comensal a su mesa específica (`?table=1` a `?table=10`).
* **Características de Diseño:**
  - Selector de slug dinámico en pantalla para personalizar el nombre del local en tiempo real.
  - Distintivo masivo `MESA X` de altísimo contraste solar.
  - Iconografía clara de alérgenos y 0% comisiones.

