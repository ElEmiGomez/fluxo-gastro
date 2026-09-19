# ⚙️ DELEGACIÓN OFICIAL — PROGRAM DATA / INGENIERÍA Y PRODUCTO (DEPTO 4)
> **Asunto:** Arquitectura, Lógica de Analítica y Motor de Reporte Mensual  
> **Fecha de Asignación:** 19 de Septiembre de 2026  
> **Origen:** Dirección General / COO (Organización)  
> **Estado:** Asignado / En Proceso  

---

## 🎯 Objetivo del Departamento
Diseñar, estructurar y mantener la infraestructura técnica, de datos y de generación del **Reporte Mensual Ejecutivo** incluido en el Plan Full de Fluxo:
1. **Pipeline de Analítica de Datos:**
   - Endpoint `/api/analytics/monthly-report` con extracción directa de tablas `orders`, `order_items` y `service_calls` de Supabase.
   - Procesamiento de métricas: facturación total, variación vs periodo previo, rotación de mesas (`turnoverRate`), tiempos muertos en cocina y reducción de tiempo de atención del camarero.
2. **Algoritmo de Matriz BCG de Rentabilidad:**
   - Clasificación automatizada de productos:
     - *Estrellas:* Alto volumen + alto margen.
     - *Vacas Lecheras:* Alto volumen + margen medio/bajo.
     - *Interrogantes/Oportunidades:* Bajo volumen + alto margen.
     - *Perros:* Bajo volumen + bajo margen (candidatos a optimización o retiro).
3. **Motor de Renderizado PDF (Playwright / Chromium):**
   - Garantizar diseño estricto de 2 páginas exactas sin desbordamientos (`@page { size: A4 portrait }`).
   - Cero caracteres huérfanos, coherencia numérica y diseño gráfico de alto contraste para hosteleros.
4. **Verificación Automatizada:**
   - Script de prueba unitaria/E2E para auditar integridad de páginas, pesos y metadatos (`scripts/verify_report_pdf.py`).

---

## 📦 Entregables Requeridos de Program Data
- [ ] Mantenimiento y optimización de `/api/analytics/monthly-report`.
- [ ] Generador headless de PDF con Playwright (`scripts/generate_executive_report_noia.mjs`).
- [ ] Suite de verificación ejecutiva con reporte de aprobación 100% PASS.
