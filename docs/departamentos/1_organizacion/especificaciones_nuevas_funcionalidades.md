# 🐻 ESPECIFICACIONES DE NUEVAS FUNCIONALIDADES — BACKLOG DE FASE2

> **Departamento:** Organización General  
> **Origen:** Sesión de Organización General y Feedback de Pruebas Reales con Usuarios  
> **Fecha de Aprobación:** 01 de Septiembre de 2026  

---

## 1. 𛆠 DASHBOARD DE ADMINISTRACIÓN DE CARTA + ASISTENTE IA DE DIGITALIZACI�N
- **Ruta:** `/staff/admin/[slug]` (Protegido por PIN de encargado / staff `1234`).
- **Capacidades CRUD:**
  - Crear, editar, reordenar y eliminar categorías.
  - Crear y editar productos (nombre, descripción, precio, foto URL, alérgenos, disponibilidad ON/OFF).
- **Asistente de IA (Prompt to Menu):**
  - Campo de texto / carga donde el hostelero pega el texto o foto de su carta.
  - IA extrae estructura JSON { categories: [...], products: [...] } y la inserta automáticamente en Supabase en 1 clic.

---

## 2. 🍲 MÓDULO "MENÚ DEL DÁA" & RECOMENDACIÓN DINÁMICA
- **Ubicación:** Cabecera destacada en `/menu/[slug]`.
- **Modo Menú del Día (Casas de Comidas / Taperías Tradicionales):**
  - Precio cerrado (ej: 12,50 €).
  - Selección guiada: 1 Primero + 1 Segundo + 1 Postre/Café + 1 Bebida.
  - Inserción limpia en comanda agrupada para cocina.
- **Modo Promo Estrella (Hamburgueserías / Gastrobares):**
  - Banner deslizante con el combo más vendido o la sugerencia del chef.

---

## 3. �� REPORTE MENSUALDE EFICIENCIA GASTRONÓMICA (PLAN FULL 99€/139€)
- **Propósito:** Entregable mensual en PDF / Dashboard para justificar el ROI y reducir el churn a 0%.
- **Métricas Clave:**
  - Horas de mayor congestión y tiempo medio de validación de comanda.
  - Matriz BCG de platos: Platos Estrella (alto margen, alta venta) vs Platos Perro (baja venta, eliminar).
  - Cuantificación de euros extra generados por pedidos adicionales en mesa (segunda ronda de bebidas/postres).
  - Sugerencias tácticas generadas por IA para el gerente del local.

---

## 4. 🗠 GUÌA INTERACTIVA PASO A P ASO PARA EL COMENSAL (ONBOARDING DE SALA)
- **Problema Detectado:** Comensales mayores o no familiarizados con QR tienen dudas sobre cómo se envía la comanda y zómo se paga.
- **Solución Visual:** Micro-pasos ilustrados y no invasivos en la PWA del comensal:
  - **Paso 1:** *"1. Elige lo que te apetezca y añadelo a tu pedido"*
  - **Paso 2:** *"2. Toca 'Enviar Pedido' (Tu mozo lo revisará en segundos)"*
  - **Paso 3:** *"3. Come tranquilo; puedes pedir más rondas cuando quieras"*
  - **Paso 4:** *"4. Al terminar, pulsa 'Pedir la Cuenta' para que el mozo te cobre en mesa"*
