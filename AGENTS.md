# REGLAS DE DESARROLLO Y COMUNICACIÓN — FLUXO

## 1. Comunicación
- Responde siempre de forma directa, simple y concreta, sin rodeos, sin introducciones vacías, sin analogías extensas y sin diagramas innecesarios.
- Explica qué estaba fallando, qué archivo se tocó y cómo funciona la solución.
- **Accesibilidad en Redacción y Terminología Culinaria:** Queda prohibido el empleo de jerga técnica gastronómica o regionalismos no universales en interfaces y reportes de dirección. Usar siempre equivalentes directos y comprensibles: "preparación previa" (en lugar de "mise en place"), "tarde y picoteo" (en lugar de "tardeo"), y "coste de ingredientes / materia prima" (en lugar de "escandallos").

## 2. Invariantes de Arquitectura (Cero Regresiones)
- **Aislamiento por Order ID:** Todos los estados y mutaciones de comandas deben gestionarse exclusivamente por su `order.id` único (UUID). Queda prohibido usar overrides globales por número de mesa que puedan alterar pedidos futuros o nuevas rondas.
- **Estado Reactivo:** Las notificaciones y tareas de cocina/mozo deben derivarse directamente del array de órdenes activas (`orders.filter(...)`). No usar variables temporales de un solo uso que se limpien al cambiar de pantalla o por polling.
- **Persistencia de Tareas:** Los avisos de cocina, llamadas de comensales y peticiones de cuenta deben permanecer visibles en pantalla hasta que el personal los atienda o descarte explícitamente.
- **Patrón Zero-Flicker (Herencia de Servicios):** La visibilidad de comandas en comandero y cocina depende exclusivamente del `status`, NUNCA de si `order_items.length > 0`. Ante respuestas de red con items vacíos (race condition de inserción), el ticket se mantiene en pantalla y los items se hidratan asíncronamente sin desmontar la tarjeta.
- **Debounce en Realtime:** Todo canal de Supabase Realtime que escuche mutaciones de comandas debe utilizar debounce (300-400ms) para garantizar que las filas hijas (`order_items`) existan en base de datos antes de disparar el refresco del cliente.
- **Validación Bidireccional:** Cada cambio en el flujo de pedidos debe verificar el ciclo completo: Creación -> Validación -> Cocina (KDS) -> Mozo (Comandero) -> Cliente (Seguimiento).
- **Validación de Precios Server-Side:** Nunca confiar en precios enviados por el cliente en `POST /api/orders`. El servidor siempre debe verificar y forzar los precios oficiales del catálogo (`getServerProducts` / catálogo maestro). Cualquier item con ID desconocido o precio alterado debe ser validado o rechazado.
- **Auth Obligatoria en Mutaciones Admin:** Todo endpoint `POST`, `PATCH` o `DELETE` administrativo o de personal (menú, llamadas de servicio, configuración) debe verificar autenticación estricta con `verifyStaffRequest()`.
- **Geometría en Gráficos SVG (Donuts & Gauges):** El texto dentro del hueco interior de un gráfico donut o circular nunca debe superar el 60% del diámetro útil horizontal. Para nombres de categorías en el centro, emplear siempre etiquetas sintetizadas (máx. 12-14 caracteres), reservando los nombres largos para la leyenda lateral. Mantener un margen interior libre mínimo de 18-20px para prevenir cualquier solapamiento con los arcos SVG.
- **Umbral de Contraste en Degradados:** Todo degradado decorativo de fondo solicitado para enmarcar componentes debe tener un salto de luminosidad perceptible (mínimo escala Slate-200/Slate-300 en el eje). Queda prohibido usar degradados con diferencias inferiores al 5% de luminancia (como `#ffffff` a `#f1f5f9`), ya que resultan indistinguibles en monitores estándar.
- **Estándar de Exportación a PDF / Impresión Ejecutiva:** Todo reporte imprimible o exportable a PDF debe implementar `@media print` con paginación controlada: (1) `print-color-adjust: exact` obligatorio para preservar fondos contrastados y badges; (2) auto-expansión forzada de todos los acordeones (`.accordion-body { display: block !important; height: auto !important; }`) y bloques `<details>`; (3) aislamiento de tarjetas con `break-inside: avoid` y saltos temáticos limpios (`break-after: page`) para garantizar un número exacto y predecible de páginas A4 sin páginas huérfanas ni tarjetas cortadas por la mitad; (4) ocultamiento estricto de controles interactivos (botones, selectores, chevrons y tooltips).
- **Modalidad Carta Fija Digital (Plan Carta):** Toda vista de carta fija debe actuar exclusivamente como catálogo digital informativo: conservará fotos, buscador reactivo, filtros dietéticos, selector de idiomas y modal de ficha técnica de platos, pero prescindirá rigurosamente de botones de añadir al carrito, selectores de cantidad, llamadas al camarero, envío de comandas a cocina y selector de mesas.
- **Isotipo / Favicon Invertido de Fluxo:** En reportes, documentos y cartas estáticas con fondo blanco o claro, el isotipo oficial de Fluxo debe presentarse en versión invertida (fondo blanco con la 'F' en degradado azul `#2563EB` a `#1D4ED8`).

## 3. Convenciones de Ejecución y Testing
- **Entorno Windows / PowerShell:** Usar siempre `npm.cmd` y `npx.cmd`, no `npm` o `npx` solos. Separar comandos secuenciales con `;` y nunca con `&&`.
- **Economía de Tokens y Verificación Focalizada:** No ejecutar la suite de certificación pesada (Playwright, Strix, RLS Audit) en tareas de ajuste de UI o depuración interactiva salvo petición expresa del usuario. Usar `npx.cmd tsc --noEmit` para validar tipos sin desperdiciar tiempo ni tokens.
- **Suite de Certificación Pre-Deploy (Solo Releases/Pre-Despliegue):** Antes de desplegar a producción o en auditorías formales solicitadas por el usuario, ejecutar:
  1. `npx.cmd tsc --noEmit`
  2. `npm.cmd run build`
  3. `node scripts/security_rls_audit.mjs`
  4. `python scripts/run_strix_scan.py`
  5. `npx.cmd playwright test`



