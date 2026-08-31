/**
 * Integración con el Playbook de Ventas (Sales Playbook Integration).
 * Enriquece docs/departamentos/2_marketing/manual_prospeccion_y_objeciones.md con Battle Cards dinámicas.
 */

import fs from 'node:fs';
import path from 'node:path';

/**
 * Formatea una lista de battle cards en formato Markdown normalizado.
 * @param {Array<import('./crawler.mjs').CommercialTacticInsight>} insights 
 * @returns {string}
 */
export function formatBattleCardsSection(insights) {
  const cardsMd = insights.map((c, idx) => {
    return `### 🥊 Battle Card ${idx + 1}: ${c.headline}

* **Disparador de Campo (Lo que dice el hostelero):**
  > "${c.marketTrigger}"
* **Por qué lo dice (Raíz psicológica):** ${c.objectionTarget}
* **Respuesta Táctica Quirúrgica (30 segundos a pie de calle):**
  > "${c.pitchHookForGalicia}"
* **La Cuenta de la Servilleta (ROI Demostrable):**
  - Coste mensual Plan Full: 99 €/mes (~3,30 €/día).
  - Mesa de terraza media: 4 comensales x 20 € = 80 € ticket.
  - Con solo rotar **1 sola mesa extra a la semana** gracias a la velocidad del Llamador con Intención, ingresas **+320 €/mes limpios**. El sistema se paga solo y deja más de 220 € de beneficio neto.
* **Cierre al Piloto ("Desafío Terraza de 14 días"):**
  > "Probémoslo este viernes en solo 5 mesas de tu terraza. Si no te gusta o tus camareros no trabajan más descansados, me llevo los QR y te ha costado cero euros."
* **Plan Recomendado:** \`${c.targetFluxoPlan}\` | **Foco Táctico:** ${c.actionableRecommendation}
`;
  }).join('\n---\n\n');

  return `## 5. Battle Cards de Inteligencia de Mercado (Actualización Dinámica)

> **Última Actualización:** ${new Date().toISOString().split('T')[0]}  
> **Objetivo:** Proporcionar munición comercial inmediata ante movimientos de competidores (Qamarero, Pikotea, Sunday) y cambios normativos (Veri*Factu, 37,5h).

${cardsMd}
`;
}

/**
 * Inyecta o actualiza la sección de Battle Cards en el manual de prospección y objeciones de forma idempotente.
 * @param {any} payload 
 * @param {string} [manualPath] 
 * @returns {{ modified: boolean, path: string }}
 */
export function injectBattleCards(payload, manualPath) {
  const targetFile = manualPath || path.resolve('docs/departamentos/2_marketing/manual_prospeccion_y_objeciones.md');

  if (!fs.existsSync(targetFile)) {
    throw new Error(`Manual de prospección no encontrado en: ${targetFile}`);
  }

  const existingContent = fs.readFileSync(targetFile, 'utf-8');
  const sectionHeaderRegex = /## 5\. Battle Cards de Inteligencia de Mercado[\s\S]*$/;
  const newSectionContent = formatBattleCardsSection(payload.commercialInsights);

  let updatedContent;
  if (sectionHeaderRegex.test(existingContent)) {
    // Reemplazar sección existente
    updatedContent = existingContent.replace(sectionHeaderRegex, newSectionContent.trim() + '\n');
  } else {
    // Añadir al final con separador
    updatedContent = existingContent.trim() + '\n\n---\n\n' + newSectionContent.trim() + '\n';
  }

  fs.writeFileSync(targetFile, updatedContent, 'utf-8');
  return { modified: true, path: targetFile };
}
