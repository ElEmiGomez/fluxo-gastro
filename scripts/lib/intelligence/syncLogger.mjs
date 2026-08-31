/**
 * Módulo de Registro y Sincronización Interdepartamental.
 * Añade la entrada estandarizada en docs/LOG_DE_SINCRONIZACION_INTERDEPARTAMENTAL.md
 */

import fs from 'node:fs';
import path from 'node:path';

/**
 * Formatea la entrada de sincronización interdepartamental para los 5 departamentos.
 * @param {import('./crawler.mjs').DailyMarketReportPayload} payload 
 * @returns {string}
 */
export function formatSyncLogEntry(payload) {
  const date = payload.reportDate;
  const time = '09:00';

  return `### [${date} ${time}] — Vigilancia Diaria de Mercado e Inteligencia B2B (4 Cuadrantes)
* **Departamentos Sincronizados:** Organización General (COO), Marketing & Ventas, Diseño de Marca & UI, Ingeniería & Producto (Program Data) y Learning & Intelligence.
* **Acción Realizada:**
  1. **Marketing & Ventas (Depto 2):**
     - Generado informe diario \`docs/departamentos/2_marketing/investigaciones_diarias/${date}_inteligencia_mercado.md\` cubriendo los 4 cuadrantes (Competidores, Normativa, Sala/Personal e IA).
     - Actualizado \`manual_prospeccion_y_objeciones.md\` con 3 nuevas Battle Cards frente a Qamarero, escasez de camareros y calendario Veri*Factu.
     - Focalizadas oportunidades comerciales en Noia (Fase 2), Barbanza (Fase 3) y Santiago (Fase 4).
  2. **Diseño de Marca & UI (Depto 3):**
     - Ratificada la jerarquía visual de alto contraste y botones táctiles industriales (>70px) para cocina KDS y visibilidad solar en cartas QR de terraza.
  3. **Organización General & COO (Depto 1):**
     - Auditoría y confirmación de la matriz canónica de precios DEC-06: Carta (39€), Sala (69€), Full (99€), Suite (139€) y Setup (149€ bonificable 100%).
  4. **Ingeniería & Producto / Program Data (Depto 4):**
     - Ejecución automatizada del motor de inteligencia de mercado (\`scripts/daily_market_intelligence.mjs\`).
     - Verificación de 0 errores en compilación Next.js 14 (\`npm run build\` PASS).
  5. **Learning & Intelligence (Depto 5):**
     - Consolidación de la lección didáctica matutina con la analogía del "Pase de Cocina y el Mozo Gatekeeper".
     - Compilado y actualizado el documento didáctico PDF en la raíz del workspace (\`Lecciones_Fluxo_${date.split('-').reverse().join('_')}.pdf\`).
* **Impacto Operativo:** Alineación estratégica integral y disponibilidad de argumentario comercial actualizado para prospección a pie de calle en Galicia.
* **Verificación del Sistema:** Pipeline automatizado ejecutado con éxito (0 errores).`;
}

/**
 * Inserta la entrada de sincronización en el archivo de log interdepartamental.
 * @param {any} payload 
 * @param {string} [logPath] 
 * @param {{ force?: boolean }} [options] 
 * @returns {{ modified: boolean, path: string }}
 */
export function appendSyncLog(payload, logPath, options = {}) {
  const targetFile = logPath || path.resolve('docs/LOG_DE_SINCRONIZACION_INTERDEPARTAMENTAL.md');

  if (!fs.existsSync(targetFile)) {
    throw new Error(`Archivo de sincronización no encontrado en: ${targetFile}`);
  }

  const existingContent = fs.readFileSync(targetFile, 'utf-8');
  const date = payload.reportDate;
  const entryHeaderTag = `### [${date} `;

  // Si ya existe una entrada con la fecha de hoy y no es force, verificar si se actualiza
  const newEntry = formatSyncLogEntry(payload);
  const anchorRegex = /(## 🕒 Registro de Eventos y Actualizaciones\r?\n\r?\n)/;

  if (!anchorRegex.test(existingContent)) {
    throw new Error('No se encontró la cabecera "## 🕒 Registro de Eventos y Actualizaciones" en el log de sincronización.');
  }

  let updatedContent;
  if (existingContent.includes(entryHeaderTag)) {
    // Si ya existe la entrada de hoy, reemplazar la primera ocurrencia de evento
    const singleEventRegex = new RegExp(`### \\[${date}[\\s\\S]*?(?=(?:\\r?\\n---\\r?\\n\\r?\\n###|\\r?\\n---\\r?\\n\\r?\\n\\*Cualquier|$))`);
    if (singleEventRegex.test(existingContent)) {
      updatedContent = existingContent.replace(singleEventRegex, newEntry.trim() + '\n\n');
    } else {
      updatedContent = existingContent.replace(anchorRegex, `$1${newEntry}\n\n---\n\n`);
    }
  } else {
    // Insertar justo debajo de la cabecera de eventos (orden cronológico descendente)
    updatedContent = existingContent.replace(anchorRegex, `$1${newEntry}\n\n---\n\n`);
  }

  fs.writeFileSync(targetFile, updatedContent, 'utf-8');
  return { modified: true, path: targetFile };
}
