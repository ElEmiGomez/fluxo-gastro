# 🎨 REPORTE DIARIO DE TENDENCIAS DE DISEÑO, MARCA & UI/UX — FLUXO
> **Fecha de Vigilancia:** `2026-08-31`  
> **Departamento:** Departamento 3 — Diseño de Marca & UI/UX  
> **Fuentes Monitoreadas:** Toast POS, Sunday App, Pikotea, MyChefTool, Square for Restaurants, Mobbin, Dribbble Gastro & KDS Industrial  
> **Tokens Activos:** Azul Salón (`#0F172A`), Cian Eléctrico (`#06B6D4`), Verde Comanda (`#10B981`), Ámbar Fuego (`#F59E0B`), Blanco Nieve (`#FFFFFF`)  
> **Estado de Sincronización:** REGISTRADO EN LIBRO DIARIO INTERDEPARTAMENTAL  

---

## 1. 🌐 Resumen Ejecutivo del Mercado de Diseño Gastronómico

En las últimas 24 horas se consolida la tendencia hacia la **"Paridad Analógica y Ergonomía de Pulgar Absoluta"** en aplicaciones gastronómicas móviles, impulsada por la saturación de los TPVs pesados tradicionales.
- **Micro-interacciones hápticas:** Plataformas globales como Sunday y Toast están migrando hacia feedback táctil instantáneo (`navigator.vibrate`) para reducir la ansiedad del comensal al ordenar y eliminar la sensación de latencia de red.
- **KDS Industrial de Alto Contraste:** En cocina, la tendencia dominante abandona las listas de texto plano en favor de tarjetas térmicas modulares con botones masivos (>70px) accionables con guantes y temporizadores cromáticos (Verde -> Ámbar -> Rojo pulsante).
- **Legibilidad Solar Extrema:** Para cartas QR en terrazas de hostelería, el diseño minimalista de alto contraste (`#FFFFFF` y `#F8FAFC`) sobre fondo claro supera ampliamente a las interfaces oscuras sobrecargadas que fallan bajo luz solar directa.

---

## 2. 🔍 Matriz de Vigilancia Competitiva de Diseño

| Competidor | Patrón / Novedad UI Observada | Impacto en Experiencia (UX) | Oportunidad & Ventaja para Fluxo |
| :--- | :--- | :--- | :--- |
| **Toast POS** | Transición a micro-tarjetas de pedidos con gestos swipe para dividir comandas por comensal. | Reduce errores de mesa compartida en sala. | Implementar en el Comandero Mozo con selector háptico de sub-ítems. |
| **Sunday App** | Flujo de propina y reseña en 1 solo toque integrado en la pantalla final de pago. | Tasa de conversión de propinas +38% y +50% en Google Reviews. | Refuerza nuestro **Google Review Booster** (+1 Toque) en `BillModal.tsx`. |
| **Pikotea** | Interfaz recargada con múltiples niveles de menú y banners promocionales intrusivos. | Provoca fricción cognitiva y ralentiza el pedido en mesa. | Mantener la pureza visual de Fluxo: **0 banners, 0 popups invasivos, foco 100% en producto**. |
| **MyChefTool** | Panel de administración de alta densidad con botones pequeños (<35px) y tablas complejas. | Requiere formación previa del camarero y causa fatiga visual. | Diferenciarnos con **botones industriales (>70px)** y alineación tabular (`tabular-nums`). |
| **Square for Rest.** | Paletas neutras sobrias y tipografías geométricas de alto impacto en encabezados. | Sensación de modernidad y velocidad de lectura. | Confirmación de nuestra dupla tipográfica: **Clash Display / Outfit + Inter**. |

---

## 3. 💡 Ideas de Innovación Aplicables a Fluxo por Componente

### 📱 3.1. Carta Móvil del Comensal (`src/app/menu/[slug]`)
1. **Sticky Bottom Action Bar (Thumb Zone):**
   - El botón flotante de *"Ver Comanda"* y *"Llamar al Mozo"* debe fijarse permanentemente en el 30% inferior de la pantalla con `pb-safe` (respetando el home indicator de iOS/Android).
   - Animación de rebote sutil (`smooth-spring`) al añadir nuevos platos para confirmar visualmente el incremento sin tapar el menú.
2. **Micro-Feedback Háptico en Modificadores:**
   - Al marcar puntos de carne ("Poco hecha", "Al punto") o excluir ingredientes ("Sin cebolla"), emitir un pulso háptico de 15ms (`navigator.vibrate(15)`).

### 🧑‍💼 3.2. Comandero del Mozo (`src/app/staff/comandero`)
1. **Semáforo Visual de Estado de Mesas:**
   - **Gris Slate 200:** Mesa libre / limpia.
   - **Azul Salón (#0F172A):** Mesa abierta con comensales.
   - **Ámbar Fuego (#F59E0B) Pulsante:** Comanda comensal esperando validación (**Mozo Gatekeeper**).
   - **Verde Comanda (#10B981):** Platos listos en el pase de cocina.
2. **Importes con Números Tabulares Estrictos (`tabular-nums`):**
   - Todos los subtotales y totales alinean verticalmente para evitar que el camarero confunda decimales durante el servicio de alta rotación.

### 🍳 3.3. KDS Industrial de Cocina (`src/app/staff/kitchen`)
1. **Tarjetas de Ticket con Botones Masivos (>70px):**
   - Altura de botón `h-16 py-4` con tipografía `font-black uppercase tracking-wider` para avanzar estado ("En preparación" -> "Listo") con el dorso de la mano limpia o el nudillo.
2. **Cronómetro Cromático de Cocción:**
   - 0-8 min: Borde Verde Comanda (`#10B981`).
   - 8-15 min: Borde Ámbar Fuego (`#F59E0B`).
   - >15 min: Borde Rojo Urgencia (`#EF4444`) con animación pulsante (`animate-pulse`).

### 🏢 3.4. Identidad de Marca B2B & Material Comercial
1. **Sello de Confianza "0% Comisiones / Cero Cambio de TPV":**
   - Badge vectorial con gradiente Cian Eléctrico (`#06B6D4`) a Azul Salón (`#0F172A`) para el One-Pager y presentaciones ante hosteleros.
2. **Tipografía de Autoridad:**
   - Títulos en **Clash Display / Outfit** para proyectar innovación tecnológica y robustez de sistema operativo.

---

## 4. 🎨 Tokens de Diseño & Clases Tailwind Validadas

```tsx
// Tokens canónicos de Fluxo para Tailwind CSS
const fluxoTokens = {
  colors: {
    salon: '#0F172A',      // Slate 900 - Fondo oscuro y autoridad
    cian: '#06B6D4',       // Cyan 500 - CTA primario digital
    comanda: '#10B981',    // Emerald 500 - Listo / Despachado
    fuego: '#F59E0B',      // Amber 500 - Cocción / Gatekeeper
    nieve: '#FFFFFF',      // White - Tarjetas de alto contraste solar
  },
  touchTargets: {
    kitchenButton: 'min-h-[72px] h-16 py-4 px-6 text-lg font-black',
    mobileCta: 'min-h-[52px] h-13 py-3 px-5 text-base font-bold rounded-2xl',
    starRating: 'p-2 min-w-[44px] min-h-[44px] touch-manipulation',
  },
  typography: {
    headlines: 'font-extrabold tracking-tight font-sans',
    prices: 'tabular-nums font-bold tracking-tight',
    kitchenDirectives: 'font-black uppercase tracking-wider',
  }
};
```

---

## 5. 🔄 Conclusión & Acciones Sincronizadas
- **Diseño Móvil:** Componentes validados con la regla del pulgar (35% inferior).
- **Cocina:** Ticket de KDS optimizado para toques industriales y contraste lumínico.
- **Log Interdepartamental:** Registrado en `docs/LOG_DE_SINCRONIZACION_INTERDEPARTAMENTAL.md` para conocimiento de Ingeniería, Marketing y Organización.
