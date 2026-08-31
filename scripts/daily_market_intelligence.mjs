#!/usr/bin/env node
/**
 * Daily Market Intelligence & Competitive Surveillance Engine.
 * CLI matutino para rastreo de 4 cuadrantes, deduplicación, generación de reportes y sincronización interdepartamental.
 * 
 * Uso:
 *   node scripts/daily_market_intelligence.mjs [--dry-run] [--force] [--offline] [--date=YYYY-MM-DD]
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { crawlMarketIntelligence } from './lib/intelligence/crawler.mjs';
import { writeMarkdownReport } from './lib/intelligence/reportGenerator.mjs';
import { injectBattleCards } from './lib/intelligence/salesIntegration.mjs';
import { appendSyncLog } from './lib/intelligence/syncLogger.mjs';

/**
 * Parsea los argumentos de la línea de comandos.
 * @param {string[]} args 
 */
export function parseCliArgs(args) {
  const options = {
    dryRun: false,
    force: false,
    offline: false,
    date: null
  };

  for (const arg of args) {
    if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '--force') {
      options.force = true;
    } else if (arg === '--offline') {
      options.offline = true;
    } else if (arg.startsWith('--date=')) {
      options.date = arg.split('=')[1].trim();
    }
  }

  // Si no se especificó fecha, detectar fecha ISO local YYYY-MM-DD
  if (!options.date) {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    options.date = `${year}-${month}-${day}`;
  }

  return options;
}

/**
 * Compila el documento didáctico PDF utilizando el script Python ReportLab.
 * @param {string} date 
 * @param {string} pdfOutputName 
 */
function compileDidacticPdf(date, pdfOutputName) {
  const pythonScript = path.resolve('scripts/lib/intelligence/pdfCompiler.py');
  
  const result = spawnSync('python', [pythonScript, `--date=${date}`, `--output=${pdfOutputName}`], {
    encoding: 'utf-8',
    stdio: 'pipe'
  });

  if (result.error || result.status !== 0) {
    console.warn(`[daily-intelligence] Advertencia: La compilación del PDF devolvió código ${result.status}: ${result.stderr || result.stdout || result.error?.message}`);
  } else {
    console.log(`[daily-intelligence] 📄 PDF Didáctico generado: ${pdfOutputName}`);
  }
}

/**
 * Ejecutor principal del motor de inteligencia.
 */
export async function runDailyIntelligence(customArgs = process.argv.slice(2)) {
  const options = parseCliArgs(customArgs);
  const { date, dryRun, force, offline } = options;

  console.log(`\n================================================================`);
  console.log(`🛰️  FLUXO GASTRONOMIC SYSTEM — MOTOR DE INTELIGENCIA DE MERCADO`);
  console.log(`================================================================`);
  console.log(`📅 Fecha objetivo: ${date}`);
  console.log(`⚙️  Modos activos: [dryRun: ${dryRun}, force: ${force}, offline: ${offline}]\n`);

  const reportFileName = `${date}_inteligencia_mercado.md`;
  const reportFilePath = path.resolve('docs/departamentos/2_marketing/investigaciones_diarias', reportFileName);

  // 1. Guardia de Idempotencia
  if (fs.existsSync(reportFilePath) && !force && !dryRun) {
    console.log(`⏩ [daily-intelligence] El informe para la fecha ${date} ya existe en:`);
    console.log(`   ${reportFilePath}`);
    console.log(`   (Ejecución omitida para evitar sobreescritura accidental. Use --force para regenerar).\n`);
    return { status: 'skipped', code: 0, path: reportFilePath };
  }

  // 2. Ejecutar rastreo y síntesis de 4 cuadrantes
  console.log(`🔍 Iniciando rastreo y síntesis de los 4 cuadrantes...`);
  const payload = await crawlMarketIntelligence({
    date,
    force,
    offline,
    dryRun
  });

  console.log(`✅ Rastreo completado (${payload.executionDurationMs} ms).`);
  console.log(`   - Ítems únicos procesados: ${payload.deduplicationSummary.uniqueItemsAccepted}`);
  console.log(`   - Ítems duplicados filtrados: ${payload.deduplicationSummary.duplicatesFiltered}`);

  // 3. Manejo de modo --dry-run
  if (dryRun) {
    console.log(`\n🔬 MODO DRY-RUN: Simulación completada sin escribir en disco.`);
    console.log(`----------------------------------------------------------------`);
    console.log(`📌 Resumen de Cuadrantes:`);
    console.log(`   1. Competidores: ${payload.quadrants.competitors.snapshots.length} competidores auditados.`);
    console.log(`   2. Normativa: ${payload.quadrants.normative.alerts.length} alertas legales activas.`);
    console.log(`   3. Sala & Operativa: ${payload.quadrants.floor_ops.operationalMetrics.avgWaiterKmSavedPerShift} km/turno ahorrados.`);
    console.log(`   4. Gastro IA: ${payload.quadrants.gastro_ai.trends.length} tendencias identificadas.`);
    console.log(`📌 Oportunidades Galicia: ${payload.galiciaOpportunities.length} plazas analizadas (Noia, Barbanza, Santiago).`);
    console.log(`📌 Battle Cards: ${payload.commercialInsights.length} tarjetas de venta preparadas.`);
    console.log(`📌 Precios Oficiales: Carta 39€ | Sala 69€ | Full 99€ | Suite 139€ | Setup 149€ | 0% Comisiones.`);
    console.log(`----------------------------------------------------------------\n`);
    return { status: 'success', code: 0, payload };
  }

  // 4. Generación de Entregable Markdown
  console.log(`📝 Escribiendo informe en docs/departamentos/2_marketing/investigaciones_diarias/...`);
  const writtenReportPath = writeMarkdownReport(payload, reportFilePath, { force });
  console.log(`✅ Informe creado: ${writtenReportPath}`);

  // 5. Integración con el Sales Playbook
  console.log(`🥊 Actualizando manual de prospección y objeciones con nuevas Battle Cards...`);
  const salesResult = injectBattleCards(payload);
  console.log(`✅ Playbook actualizado: ${salesResult.path}`);

  // 6. Registro de Sincronización Interdepartamental
  console.log(`📖 Añadiendo entrada a docs/LOG_DE_SINCRONIZACION_INTERDEPARTAMENTAL.md...`);
  const syncResult = appendSyncLog(payload, null, { force });
  console.log(`✅ Log interdepartamental sincronizado: ${syncResult.path}`);

  // 7. Compilación del PDF Didáctico Matutino
  console.log(`🎨 Compilando documento didáctico matutino en PDF...`);
  const dateParts = date.split('-');
  const dateReversed = `${dateParts[2]}_${dateParts[1]}_${dateParts[0]}`;
  const pdfOutputName = `Lecciones_Fluxo_${dateReversed}.pdf`;
  compileDidacticPdf(date, pdfOutputName);

  console.log(`\n🎉 Pipeline diario de inteligencia completado con éxito.\n`);
  return { status: 'success', code: 0, reportPath: writtenReportPath, pdfPath: pdfOutputName };
}

// Ejecución directa por CLI
const isDirectCli = process.argv[1] && (
  path.resolve(process.argv[1]).toLowerCase() === fileURLToPath(import.meta.url).toLowerCase() ||
  fileURLToPath(import.meta.url).toLowerCase().endsWith(path.basename(process.argv[1]).toLowerCase())
);

if (isDirectCli) {
  runDailyIntelligence()
    .then(result => {
      process.exit(result.code);
    })
    .catch(err => {
      console.error(`\n❌ Error fatal en el motor de inteligencia: ${err.message}\n`, err);
      process.exit(1);
    });
}
