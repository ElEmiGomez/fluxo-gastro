# REGLAS DE DESARROLLO Y COMUNICACIÓN — FLUXO

## 1. Comunicación
- Responde siempre de forma directa, simple y concreta, sin rodeos, sin introducciones vacías, sin analogías extensas y sin diagramas innecesarios.
- Explica qué estaba fallando, qué archivo se tocó y cómo funciona la solución.

## 2. Invariantes de Arquitectura (Cero Regresiones)
- **Aislamiento por Order ID:** Todos los estados y mutaciones de comandas deben gestionarse exclusivamente por su `order.id` único (UUID). Queda prohibido usar overrides globales por número de mesa que puedan alterar pedidos futuros o nuevas rondas.
- **Estado Reactivo:** Las notificaciones y tareas de cocina/mozo deben derivarse directamente del array de órdenes activas (`orders.filter(...)`). No usar variables temporales de un solo uso que se limpien al cambiar de pantalla o por polling.
- **Persistencia de Tareas:** Los avisos de cocina, llamadas de comensales y peticiones de cuenta deben permanecer visibles en pantalla hasta que el personal los atienda o descarte explícitamente.
- **Validación Bidireccional:** Cada cambio en el flujo de pedidos debe verificar el ciclo completo: Creación -> Validación -> Cocina (KDS) -> Mozo (Comandero) -> Cliente (Seguimiento).


