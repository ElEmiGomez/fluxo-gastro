# PROTOCOLO DE SINCRONIZACIÓN INTERDEPARTAMENTAL — FLUXO
> **Proyecto:** Fluxo Gastronomic System  
> **Estructura de Trabajo:** Departamentos Autónomos Interconectados

---

## 🏛️ Estructura de Departamentos

Cada chat de Antigravity opera como un departamento especializado, pero todos leen y escriben sobre esta misma base de conocimiento compartida:

```
docs/
├── LOG_DE_SINCRONIZACION_INTERDEPARTAMENTAL.md  <-- Libro de registro de cambios
└── departamentos/
    ├── 1_organizacion/                          <-- Chat: Organización General
    │   ├── roadmap_y_organigrama.md
    │   └── registro_ideas_y_decisiones.md
    ├── 2_marketing/                             <-- Chat: Marketing & Ventas
    │   ├── estrategia_comercial_y_pricing.md
    │   └── pitch_ventas_locales_galicia.md
    ├── 3_diseno_marca/                          <-- Chat: Diseño & Branding
    │   └── manual_marca_y_ui.md
    ├── 4_ingenieria_producto/                   <-- Chat: Backend, Frontend & QA
    │   └── reglas_operativas_y_arquitectura.md
    └── 5_learning/                              <-- Chat: Aprendizaje, Inteligencia & Buenas Prácticas
        └── manual_aprendizaje_y_buenas_practicas.md
```

---

## 🔄 Reglas de Sincronización Automática

1. **Memoria Compartida en Tiempo Real:**  
   Cuando en cualquier chat se defina una nueva idea, cambio de precio, regla de negocio o ajuste de diseño, el agente correspondiente debe:
   - Actualizar el archivo del departamento correspondiente en `docs/departamentos/`.
   - Registrar la entrada en `docs/LOG_DE_SINCRONIZACION_INTERDEPARTAMENTAL.md` con fecha, origen y resumen del impacto.

2. **Cero Fricción al Cambiar de Chat:**  
   En cualquier chat que estés trabajando (Marketing, Branding, Organización o Desarrollo), el agente lee esta carpeta al inicio y sabe exactamente qué se decidió en los demás departamentos.

3. **Mapeo de Chats del Sistema:**
   * **Organización General:** [`1dcc3fea-fde9-44f8-bb24-e0e2afd26f22`](conversation://1dcc3fea-fde9-44f8-bb24-e0e2afd26f22)
   * **Diseño de Marca & UI:** [`dde643cc-47dd-47d3-9adc-fcae77e49214`](conversation://dde643cc-47dd-47d3-9adc-fcae77e49214)
   * **Ingeniería, Backend & QA:** [`64445573-62cb-4897-b2f1-f89015d7ea45`](conversation://64445573-62cb-4897-b2f1-f89015d7ea45)
