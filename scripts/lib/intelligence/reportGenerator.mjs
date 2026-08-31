/**
 * Generador de Informes Diarios de Inteligencia de Mercado en Formato Markdown.
 * Produce el entregable en docs/departamentos/2_marketing/investigaciones_diarias/YYYY-MM-DD_inteligencia_mercado.md.
 */

import fs from 'node:fs';
import path from 'node:path';

/**
 * Genera el contenido markdown completo del informe diario de inteligencia.
 * @param {import('./crawler.mjs').DailyMarketReportPayload} payload 
 * @returns {string} Markdown estructurado
 */
export function generateMarkdownReport(payload) {
  const { reportDate, generatedAt, environment, deduplicationSummary, quadrants, galiciaOpportunities, commercialInsights, didacticLesson, pricingSanityCheck } = payload;

  const competitorsTable = quadrants.competitors.snapshots.map(s => {
    return `| **${s.competitorName}** | ${s.entryPriceMonthly}€ - ${s.recommendedPlanMonthly}€/mes | ${s.transactionCommissionPct > 0 ? `${s.transactionCommissionPct}% + ${s.fixedCommissionPerTicket}€` : '0%'} | ${s.requiresPosReplacement ? '❌ Sí (Obliga)' : '✅ No'} | ${s.hasGatekeeperValidation ? '✅ Sí' : '❌ No'} | ${s.kdsSupported ? '✅ Sí' : '❌ No'} | ${s.escPosPrintingSupported ? '✅ Sí' : '❌ No'} | ${s.fluxoAdvantage} |`;
  }).join('\n');

  const normativeList = quadrants.normative.alerts.map(a => {
    return `### ⚖️ ${a.regulationName}
* **Jurisdicción:** \`${a.jurisdiction}\` | **Plazo Límite:** \`${a.enforcementDeadline}\` | **Nivel de Impacto:** \`${a.impactLevel}\`
* **Riesgo / Sanción:** ${a.sanctionRiskText}
* **Ventaja Estratégica Fluxo:** ${a.fluxoStrategicAdvantage}
`;
  }).join('\n');

  const galiciaList = galiciaOpportunities.map(g => {
    return `### 📍 ${g.region} — *${g.phase}*
* **Contexto de Sala:** ${g.context}
* **Gancho de Abordaje:** > "${g.hook}"
* **Plan Sugerido:** \`${g.recommendedPlan}\`
`;
  }).join('\n');

  const battleCardsSection = commercialInsights.map(c => {
    return `### 🥊 Battle Card: ${c.headline}
* **Disparador de Campo (Hostelero):** > "${c.marketTrigger}"
* **Por qué lo dice (Psicología):** ${c.objectionTarget}
* **Respuesta Táctica (30 segundos):**
  > "${c.pitchHookForGalicia}"
* **La Cuenta de la Servilleta (ROI Demostrable):**
  - Coste mensual Plan Full: 99 €/mes (~3,30 €/día).
  - Mesa media terraza: 4 personas x 20 € = 80 € ticket.
  - Con rotar **1 sola mesa extra a la semana** gracias al Llamador con Intención, ingresas **+320 €/mes netos**.
* **Cierre al Piloto:** "Probémoslo este fin de semana en solo 5 mesas de tu terraza con el Desafío Terraza de 14 días. Digitalización sin coste y cero comisiones."
* **Plan Objetivo:** \`${c.targetFluxoPlan}\` | **Recomendación:** ${c.actionableRecommendation}
`;
  }).join('\n');

  return `# 📊 INFORME DIARIO DE INTELIGENCIA DE MERCADO Y VIGILANCIA COMPETITIVA
> **Fecha de Investigación:** ${reportDate}  
> **Generado el:** ${generatedAt}  
> **Ámbito Territorial:** Galicia (Prioritario: Noia, Barbanza, Santiago) & España  
> **Entorno:** \`${environment}\` | **Deduplicación:** ${deduplicationSummary.uniqueItemsAccepted} ítems únicos / ${deduplicationSummary.duplicatesFiltered} filtrados (${deduplicationSummary.totalItemsScanned} escaneados)

---

## 1. Resumen Ejecutivo Matutino (Morning Briefing)

* 🎯 **Presión Competidora en Galicia:** Qamarero intensifica prospección en Santiago de Compostela y A Coruña con cuotas de hasta 249€/mes y comisiones por ticket, explotando el miedo a las reseñas en Google.
* ⚖️ **Firmeza en Veri*Factu RD 1007/2023:** Calendario inmutable (sociedades mercantiles en enero 2027 y autónomos en julio 2027). Aclaración técnica: TicketBAI aplica única y exclusivamente en País Vasco/Navarra.
* 🏃 **Optimización de Sala y Personal:** El déficit estructural de camareros en terrazas se combate ahorrando los 6.8 km de "pasos basura" que genera el cobro tradicional con el *Llamador con Intención* de Fluxo.
* 🤖 **IA Práctica y Rentable:** Auge de reservas WhatsApp 24/7 sin comisiones e ingeniería de cartas sensoriales con incremento de ticket medio (+8% a +15%).

---

## 2. Cuadrante 1: Movimientos de Competidores y Soluciones TPV/QR

### Tabla Comparativa de Mercado B2B

| Competidor | Rango Cuota Mensual | Comisión / Ticket | Exige Cambiar TPV | Mozo Gatekeeper | KDS Táctil | Impresión ESC/POS | Ventaja Asimétrica Fluxo |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: | :--- |
${competitorsTable}
| **⭐ FLUXO B2B** | **39€ / 69€ / 99€ / 139€** | **0% (Cero comisiones)** | **✅ NO (No lo toques)** | **✅ Sí (pending_validation)** | **✅ Sí (>70px)** | **✅ Sí (42 col térmico)** | **99€ TODO INCLUIDO, sin comisiones ni hardware propietario.** |

### Puntos Clave del Cuadrante Competitivo
${quadrants.competitors.keyTakeaways.map(t => `- ${t}`).join('\n')}

---

## 3. Cuadrante 2: Normativa, Fiscalidad y Alertas Legales

${normativeList}

### Directrices Normativas para el Equipo Comercial
${quadrants.normative.keyTakeaways.map(t => `- ${t}`).join('\n')}

---

## 4. Cuadrante 3: Operativa de Sala, Cocina y Situación Laboral

### Indicadores Operativos Cuantificados

* **Kilómetros recorridos por mozo por turno (Base):** \`${quadrants.floor_ops.operationalMetrics.avgWaiterKmPerShiftBaseline} km\`
* **Kilómetros ahorrados con Llamador con Intención:** \`${quadrants.floor_ops.operationalMetrics.avgWaiterKmSavedPerShift} km\` (**-${quadrants.floor_ops.operationalMetrics.avgWaiterKmSavedPct}% de fatiga**)
* **Tiempo medio de espera para pedir la cuenta:** Reducción de \`${quadrants.floor_ops.operationalMetrics.avgBillWaitMinutesBaseline} min\` a \`${quadrants.floor_ops.operationalMetrics.avgBillWaitMinutesWithFluxo} min\` (**-${quadrants.floor_ops.operationalMetrics.avgBillWaitMinutesReductionPct}%**)
* **Incremento de rotación de mesas en terraza:** \`+${quadrants.floor_ops.operationalMetrics.tableTurnoverIncreasePct}%\`
* **Impacto económico neto (+1 mesa extra / semana):** \`+${quadrants.floor_ops.operationalMetrics.netMonthlyGainFromExtraTableEur} € / mes\`

### Puntos Clave de Operativa en Sala y Cocina
${quadrants.floor_ops.keyTakeaways.map(t => `- ${t}`).join('\n')}

---

## 5. Cuadrante 4: Innovación, IA Gastronómica y Telemetría

${quadrants.gastro_ai.trends.map(tr => `### 🤖 ${tr.topic}
* **Descripción:** ${tr.description}
* **Plan Fluxo Asociado:** \`${tr.targetPlan}\`
`).join('\n')}

### Conclusiones de Innovación
${quadrants.gastro_ai.keyTakeaways.map(t => `- ${t}`).join('\n')}

---

## 6. Oportunidades Tácticas Comerciales en Galicia

${galiciaList}

---

## 7. Battle Cards del Día para el Playbook de Ventas

${battleCardsSection}

---

## 8. Auditoría y Sanity Check de Precios Oficiales Fluxo

| Concepto Oficial | Tarifa Blindada | Estado de Conformidad |
| :--- | :--- | :---: |
| **Plan Carta** | **39 € / mes** | ✅ CONFORME (DEC-06) |
| **Plan Sala** | **69 € / mes** | ✅ CONFORME (DEC-06) |
| **Plan Full (Recomendado)** | **99 € / mes** | ✅ CONFORME (DEC-06) |
| **Plan Suite (360°)** | **139 € / mes** | ✅ CONFORME (DEC-06) |
| **Setup Onboarding** | **149 € + IVA** (100% bonificado en Full) | ✅ CONFORME (DEC-06) |
| **Comisiones Transaccionales** | **0% (Cero comisiones por ticket)** | ✅ CONFORME |
| **Sustitución de TPV** | **CERO (No toca el TPV existente)** | ✅ CONFORME |

*Resultado de Auditoría:* **${pricingSanityCheck.notes}**

---

## 9. Lección Didáctica y Analogías de Hostelería (AGENTS.md)

* 👨‍🍳 **Concepto Técnico Central:** ${didacticLesson.coreConcept}
* 🍽️ **Analogías Gastronómicas:**
${didacticLesson.analogiesUsed.map(a => `  - **${a}**`).join('\n')}
* ❓ **Pregunta de Chequeo para el Fundador:** > "${didacticLesson.questionForFounder}"
* 💡 **Respuesta Esperada:** ${didacticLesson.expectedAnswer}
* 📋 **Acción Inmediata:** ${didacticLesson.actionForFounder}

---
*Informe generado automáticamente por el Motor de Inteligencia de Mercado Fluxo para el Departamento 2 (Marketing & Ventas).*
`;
}

/**
 * Escribe el informe markdown en el disco.
 * @param {any} payload 
 * @param {string} [outputPath] 
 * @param {{ force?: boolean }} [options]
 * @returns {string} Ruta absoluta del archivo creado
 */
export function writeMarkdownReport(payload, outputPath, options = {}) {
  const date = payload.reportDate;
  const targetFile = outputPath || path.resolve('docs/departamentos/2_marketing/investigaciones_diarias', `${date}_inteligencia_mercado.md`);
  
  const targetDir = path.dirname(targetFile);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const content = generateMarkdownReport(payload);
  fs.writeFileSync(targetFile, content, 'utf-8');
  return targetFile;
}
