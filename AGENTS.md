# REGLAS DE DESARROLLO Y COMUNICACIÓN — FLUXO

## 1. Comunicación
- Responde siempre de forma directa, simple y concreta, sin rodeos, sin introducciones vacías, sin analogías extensas y sin diagramas innecesarios.
- Explica qué estaba fallando, qué archivo se tocó y cómo funciona la solución.

## 2. Invariantes de Arquitectura (Cero Regresiones)
- **Aislamiento por Order ID:** Todos los estados y mutaciones de comandas deben gestionarse exclusivamente por su `order.id` único (UUID). Queda prohibido usar overrides globales por número de mesa que puedan alterar pedidos futuros o nuevas rondas.
- **Estado Reactivo:** Las notificaciones y tareas de cocina/mozo deben derivarse directamente del array de órdenes activas (`orders.filter(...)`). No usar variables temporales de un solo uso que se limpien al cambiar de pantalla o por polling.
- **Persistencia de Tareas:** Los avisos de cocina, llamadas de comensales y peticiones de cuenta deben permanecer visibles en pantalla hasta que el personal los atienda o descarte explícitamente.
- **Validación Bidireccional:** Cada cambio en el flujo de pedidos debe verificar el ciclo completo: Creación -> Validación -> Cocina (KDS) -> Mozo (Comandero) -> Cliente (Seguimiento).
- **Validación de Precios Server-Side:** Nunca confiar en precios enviados por el cliente en `POST /api/orders`. El servidor siempre debe verificar y forzar los precios oficiales del catálogo (`getServerProducts` / catálogo maestro). Cualquier item con ID desconocido o precio alterado debe ser validado o rechazado.
- **Auth Obligatoria en Mutaciones Admin:** Todo endpoint `POST`, `PATCH` o `DELETE` administrativo o de personal (menú, llamadas de servicio, configuración) debe verificar autenticación estricta con `verifyStaffRequest()`.

## 3. Convenciones de Ejecución y Testing
- **Entorno Windows / PowerShell:** Usar siempre `npm.cmd` y `npx.cmd`, no `npm` o `npx` solos. Separar comandos secuenciales con `;` y nunca con `&&`.
- **Suite de Certificación Pre-Deploy:** Antes de desplegar o dar por finalizada una tarea crítica, ejecutar:
  1. `npx.cmd tsc --noEmit`
  2. `npm.cmd run build`
  3. `node scripts/security_rls_audit.mjs`
  4. `python scripts/run_strix_scan.py`
  5. `npx.cmd playwright test`



