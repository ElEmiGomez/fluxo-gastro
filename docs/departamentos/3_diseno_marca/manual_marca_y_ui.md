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
