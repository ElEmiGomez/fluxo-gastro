# SISTEMA DE DISEÑO & EXPERIENCIA DE USUARIO — FLUXO GASTRO PWA
> **Versión:** 1.0.0  
> **Enfoque:** B2B Mobile-First Gastronómico & "Paridad Analógica"

---

## 1. Paleta de Colores Corporativa (B2B Gastronómico)

* **Azul Océano / Salón (`#0F172A` - Slate 900 / `#1E3A8A` - Blue 900):**  
  Color base de autoridad, sobriedad y legibilidad en entornos de comedor con luz artificial o penumbra.
* **Cian Eléctrico / Acento Digital (`#06B6D4` - Cyan 500 / `#2563EB` - Blue 600):**  
  Utilizado para CTAs primarios, botones de acción inmediata (*"Ver Comanda"*, *"Confirmar"*) y selecciones de mesa.
* **Verde Comanda / Despacho (`#10B981` - Emerald 500 / `#047857` - Emerald 700):**  
  Feedback visual de éxito, platos listos para servir en cocina y cobros efectuados.
* **Ámbar Fuego / Alerta de Cocina (`#F59E0B` - Amber 500 / `#D97706` - Amber 600):**  
  Platos en preparación activa en plancha/horno y comandas pendientes de validación en mesa.
* **Blanco Puro y Gris Asfalto (`#FFFFFF` y `#F8FAFC` - Slate 50):**  
  Fondos limpios de alto contraste para lectura óptima bajo el sol directo en terrazas exteriores.

---

## 2. Tipografía & Jerarquía Visual

* **Titulares y Nombres de Platos:**  
  *Fuentes:* **Clash Display** o **Outfit** (alternativa web: *Plus Jakarta Sans Bold* / *Inter Extrabold*).  
  *Objetivo:* Legibilidad inmediata a media distancia, carácter moderno y premium.
* **Cuerpo, Descripciones y Precios:**  
  *Fuentes:* **Inter** / **Plus Jakarta Sans** con soporte de números tabulares (`tabular-nums`) para alineación perfecta de importes monetarios.
* **Textos Operativos de Cocina:**  
  Mayúsculas fijas (`uppercase tracking-wider font-black`) para modificadores críticos (`*** SIN CEBOLLA ***`, `*** POCO HECHA ***`).

---

## 3. Filosofía UX: "Paridad Analógica"

1. **Replicar el Flujo Físico sin Añadir Pasos:**  
   El sistema no obliga al camarero a aprender una lógica contable compleja; sustituye el papel y el boli por toques grandes sobre pantalla.
2. **Ergonomía de 1 Mano (Zona del Pulgar):**  
   En la carta del móvil, las acciones principales (abrir comanda, sumar ítems, pedir cuenta) se ubican en el tercio inferior de la pantalla accesible con el pulgar.
3. **Botones Industriales en Cocina (>70px - 80px):**  
   Elementos de toque sobredimensionados para permitir al cocinero avanzar estados con el nudillo o el dorso de la mano limpia sin ensuciar la pantalla.
4. **Haptic Feedback (Vibración Táctil):**  
   Uso de `navigator.vibrate` en dispositivos móviles para confirmar acciones clave (añadir plato = vibración corta de 15ms; llamada al mozo = doble pulso de 50ms).

---

## 4. Rendimiento & Optimistic UI

* **Optimistic UI:** Las actualizaciones de cantidad y estados de tickets se reflejan de inmediato en la pantalla antes de esperar la confirmación HTTP del servidor, evitando cualquier sensación de retardo (lag).
* **Idempotencia Transparente:** La PWA genera un `idempotency_key` (UUID v4) por intento de comanda para que el usuario pueda hacer doble clic por nerviosismo sin riesgo de duplicar su pedido.
* **Caché Híbrida Offline / Safari ITP Resilience:** Las órdenes y sesiones se anclan en cookies de primer origen `HttpOnly; SameSite=Lax` para que Apple Safari ITP no vacíe el carrito del turista tras cerrar la pestaña.
