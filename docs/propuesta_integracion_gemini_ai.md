# Propuesta Técnica: Integración de Google Gemini en Fluxo Gastronomic System

## 1. Objetivo de la Iniciativa
Integrar de forma nativa la API de Google Gemini (`@google/genai` con modelos `gemini-3.8-flash` o `gemini-3.5-flash-lite`) para potenciar la inteligencia operativa del sistema en el panel de administración y análisis gastronómico, manteniendo una arquitectura híbrida de coste cero en la capa gratuita (Free Tier).

---

## 2. Casos de Uso y Beneficios Directos

### A. Digitalización Instantánea de Cartas Físicas (OCR + JSON Semántico)
- **Problema actual:** El importador actual depende de formatos de texto estructurados o reglas heurísticas.
- **Solución con Gemini:** El hostelero sube una foto de una carta física, una pizarra de platos o un archivo PDF. Gemini extrae automáticamente:
  - Nombre del plato y descripción comercial depurada.
  - Precio unitario o al peso.
  - Categorización precisa (Entrantes, Carnes, Pescados, Postres, Bebidas).
  - Alérgenos obligatorios de la UE (1169/2011) detectados a partir de los ingredientes.

### B. Auto-categorizador Culinario y Detección de Modificadores
- **Problema actual:** Las reglas por palabras clave locales requieren mantenimiento continuo de listas de palabras.
- **Solución con Gemini:** Clasificación semántica contextual:
  - Distingue automáticamente entre bebidas simples, cócteles, carnes con punto de cocción, cafés y postres.
  - Asigna el comportamiento del producto (`product_kind`) sin que el personal tenga que configurarlo a mano.

### C. Generación y Enriquecimiento de Descripciones Gastronómicas
- Sugerencia de descripciones atractivas para la carta digital a partir de los ingredientes principales, mejorando la conversión de venta y el ticket medio del restaurante.

---

## 3. Especificaciones Técnicas y Requisitos

- **SDK Oficial:** `@google/genai` (Node.js / Next.js API Routes).
- **Modelo recomendado:** `gemini-3.5-flash-lite` (para categorización rápida y bajo consumo) o `gemini-3.8-flash` (para lectura multimodal de imágenes de cartas).
- **Variable de Entorno:** `GEMINI_API_KEY` (obtenible en Google AI Studio: [aistudio.google.com](https://aistudio.google.com)).
- **Estrategia Fallback:** El motor local por palabras clave (`category-matcher.ts`) permanece activo como respaldo automático si no hay clave API configurada o si la red falla, garantizando disponibilidad 100%.

---

*Documento registrado en el backlog técnico de Fluxo para su activación bajo demanda.*
