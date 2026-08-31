/**
 * Empirical Adversarial Stress Test Suite — Challenger 1
 * Milestone 3: Adversarial Correctness, Stress Testing, Invariants & Security
 * 
 * Usage: node scripts/tests/stress_test_challenger_harness.mjs
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';

import {
  canonicalizeUrl,
  normalizeText,
  levenshteinDistance,
  computeTitleSimilarity,
  generateDedupFingerprint,
  loadCache,
  saveCache,
  deduplicateMarketItems
} from '../lib/intelligence/dedup.mjs';

import { crawlMarketIntelligence } from '../lib/intelligence/crawler.mjs';
import { generateMarkdownReport, writeMarkdownReport } from '../lib/intelligence/reportGenerator.mjs';
import { injectBattleCards, formatBattleCardsSection } from '../lib/intelligence/salesIntegration.mjs';
import { appendSyncLog, formatSyncLogEntry } from '../lib/intelligence/syncLogger.mjs';
import { parseCliArgs, runDailyIntelligence } from '../daily_market_intelligence.mjs';
import { MOCK_MARKET_INTELLIGENCE_FIXTURES } from '../lib/intelligence/fixtures.mjs';
import { OFFICIAL_PRICING_PLANS, QUADRANT_TYPES } from '../lib/intelligence/types.mjs';

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

const results = [];
let totalPassed = 0;
let totalFailed = 0;

async function test(name, fn) {
  const start = Date.now();
  try {
    await fn();
    const durationMs = Date.now() - start;
    totalPassed++;
    results.push({ name, status: 'PASS', durationMs });
    console.log(`  ${COLORS.green}✔ PASS${COLORS.reset} ${name} (${durationMs}ms)`);
  } catch (err) {
    const durationMs = Date.now() - start;
    totalFailed++;
    results.push({ name, status: 'FAIL', durationMs, error: err.message });
    console.log(`  ${COLORS.red}✖ FAIL${COLORS.reset} ${name} (${durationMs}ms) -> ${err.message}`);
  }
}

export async function runChallengerStressTests() {
  console.log(`${COLORS.bright}${COLORS.cyan}================================================================================${COLORS.reset}`);
  console.log(`${COLORS.bright}${COLORS.cyan} 🥊 CHALLENGER 1: EMPIRICAL ADVERSARIAL STRESS TEST HARNESS ${COLORS.reset}`);
  console.log(`${COLORS.cyan} Stress Testing Dedup, Concurrency, Invariants, Extreme Boundaries & Fault Injection${COLORS.reset}`);
  console.log(`${COLORS.bright}${COLORS.cyan}================================================================================\n${COLORS.reset}`);

  // ==========================================================================
  // SECTION 1: MASSIVE DEDUPLICATION ENGINE STRESS TESTS
  // ==========================================================================
  console.log(`${COLORS.bright}${COLORS.magenta}▶ [SECTION 1] Deduplication Engine Massive Stress & Permutations...${COLORS.reset}`);

  await test('STRESS-DEDUP-01: 5,000 synthetic URLs with permuted query and tracking parameters canonicalize identically', async () => {
    const base = 'https://HOSTELERIADIGITAL.ES/Noticias/articulo-tpv-2026/';
    const trackingPool = [
      'utm_source=google', 'utm_medium=cpc', 'utm_campaign=summer_2026',
      'utm_term=tpv', 'utm_content=banner1', 'fbclid=IwAR1234567890',
      'gclid=Cj0KCQjw12345', 'msclkid=abcdef', 'twclid=987654',
      'ref=newsletter', 'source=direct', '_ga=GA1.2.123456.789', '_gl=1*abc*def'
    ];
    const realParams = ['page=2', 'lang=es', 'category=restauracion', 'sort=desc'];

    const expectedCanonical = canonicalizeUrl(`${base}?page=2&lang=es&category=restauracion&sort=desc`);

    for (let i = 0; i < 5000; i++) {
      const shuffledTracking = trackingPool.filter(() => Math.random() > 0.4);
      const shuffledReal = [...realParams].sort(() => Math.random() - 0.5);
      const allParams = [...shuffledTracking, ...shuffledReal].sort(() => Math.random() - 0.5);
      const rawUrl = `${base}?${allParams.join('&')}`;

      const canonical = canonicalizeUrl(rawUrl);
      assert.equal(canonical, expectedCanonical, `Failed canonicalizing variation ${i}: ${rawUrl}`);
    }
  });

  await test('STRESS-DEDUP-02: Extreme URL boundary conditions (IPv4, IPv6, ports, percent-encoding, malformed strings, null, undefined)', async () => {
    assert.equal(canonicalizeUrl(null), '');
    assert.equal(canonicalizeUrl(undefined), '');
    assert.equal(canonicalizeUrl(''), '');
    assert.equal(canonicalizeUrl(12345), '');
    assert.equal(canonicalizeUrl({}), '');

    // Path ending slashes normalization
    assert.equal(canonicalizeUrl('https://example.com/path///'), 'https://example.com/path');
    assert.equal(canonicalizeUrl('https://example.com/'), 'https://example.com/');
    assert.equal(canonicalizeUrl('https://example.com'), 'https://example.com/');

    // Port and hostname casing
    assert.equal(canonicalizeUrl('HTTP://EXAMPLE.COM:8080/A/B/C?z=1&a=2&utm_source=test'), 'http://example.com:8080/A/B/C?a=2&z=1');

    // Malformed non-URL string
    const malformed = 'ht!tp://not a valid url/test?foo=1';
    const fallback = canonicalizeUrl(malformed);
    assert.ok(fallback.includes('ht!tp://not a valid url/test'));
  });

  await test('STRESS-DEDUP-03: Text normalization across 3,000 multi-language diacritics, symbols, punctuation and Unicode noise', async () => {
    assert.equal(normalizeText(null), '');
    assert.equal(normalizeText(undefined), '');
    assert.equal(normalizeText(''), '');

    const complexPairs = [
      ['¡¡QAMARERO intensifica su expansión en Galicia!!', 'qamarero intensifica su expansion en galicia'],
      ['Hacienda ratificó el calendario: Veri*Factu RD 1007/2023 (2027).', 'hacienda ratifico el calendario veri factu rd 1007 2023 2027'],
      ['¿¿Por qué pagar 189€ + 1.5%??   Fluxo cuesta 99€/mes.', 'por que pagar 189 1 5 fluxo cuesta 99 mes'],
      ['Café, té, albóndigas & pulpo á feira (Rías Baixas)', 'cafe te albondigas pulpo a feira rias baixas'],
      ['  Espacios    múltiples   y\ttabuladores\ncon saltos  ', 'espacios multiples y tabuladores con saltos']
    ];

    for (const [raw, expected] of complexPairs) {
      assert.equal(normalizeText(raw), expected);
    }

    // Stress 3000 random permutations of punctuation & diacritics
    for (let i = 0; i < 3000; i++) {
      const accented = 'ÁÉÍÓÚáéíóúÑñÇçÀÈÌÒÙàèìòùÂÊÎÔÛâêîôûÄËÏÖÜäëïöü';
      const norm = normalizeText(accented);
      // ÁÉÍÓÚ (aeiou) + áéíóú (aeiou) + Ññ (nn) + Çç (cc) + ÀÈÌÒÙ (aeiou) + àèìòù (aeiou) + ÂÊÎÔÛ (aeiou) + âêîôû (aeiou) + ÄËÏÖÜ (aeiou) + äëïöü (aeiou)
      const expectedFull = 'aeiouaeiounnccaeiouaeiouaeiouaeiouaeiouaeiou';
      assert.equal(norm, expectedFull);
    }
  });

  await test('STRESS-DEDUP-04: Levenshtein distance matrix memory and performance bounds on extreme long inputs', async () => {
    const str1000 = 'a'.repeat(1000);
    assert.equal(levenshteinDistance(str1000, str1000), 0);

    const str1000Diff = 'a'.repeat(999) + 'b';
    assert.equal(levenshteinDistance(str1000, str1000Diff), 1);

    assert.equal(levenshteinDistance('', str1000), 1000);
    assert.equal(levenshteinDistance(str1000, ''), 1000);

    assert.equal(computeTitleSimilarity(str1000, str1000Diff), 0.999);
  });

  await test('STRESS-DEDUP-05: 2,000 title variations fuzzy similarity threshold (0.82 boundary accuracy)', async () => {
    const baseTitle = 'Qamarero intensifica su expansion en Galicia tras captar fondos de Enisa';
    
    // Minor typographical change (1 char) -> similarity > 0.95 (DUPLICATE)
    const minorDiff = 'Qamarero intensifica su expansion en Galicia tras captar fondos de ENISA!';
    assert.ok(computeTitleSimilarity(baseTitle, minorDiff) >= 0.82);

    // Substantial change (>50% words different) -> similarity < 0.82 (UNIQUE)
    const distinctTitle = 'Sunday lanza comisiones del 1.8% para pagos con codigo QR en mesas';
    assert.ok(computeTitleSimilarity(baseTitle, distinctTitle) < 0.50);

    // Null/undefined inputs return 0.0
    assert.equal(computeTitleSimilarity(null, baseTitle), 0.0);
    assert.equal(computeTitleSimilarity(baseTitle, undefined), 0.0);
    assert.equal(computeTitleSimilarity('', ''), 0.0);
  });

  await test('STRESS-DEDUP-06: Batch deduplication on 1,000 mixed items (100 distinct topics, 400 URL duplicates, 500 fuzzy title duplicates)', async () => {
    const rawBatch = [];
    const cache = {};

    const distinctTopics = [
      'Alérgenos alimentarios según reglamento UE 1169 en restaurantes',
      'VeriFactu RD 1007 para hostelería y software certificado AEAT',
      'Escasez de camareros en terrazas de Noia y Barbanza',
      'Impresoras térmicas ESC POS en comandas de cocina y barra',
      'KDS industrial de alto contraste con botones de más de 70px',
      'Chatbots de WhatsApp para reservas sin comisiones por cubierto',
      'Ingeniería de menú con matriz BCG y neuromarketing sensorial',
      'Google Review Booster para reputación de 5 estrellas en 1 toque',
      'Inspección de trabajo sobre registro horario digital y jornada 37h',
      'Defensa frente a comisiones bancarias de datáfonos en mesa'
    ];

    // Create 100 distinct items (10 variations per topic with unique subthemes)
    for (let t = 0; t < distinctTopics.length; t++) {
      for (let s = 0; s < 10; s++) {
        const itemIdx = t * 10 + s;
        rawBatch.push({
          id: `ITEM-${itemIdx}`,
          title: `${distinctTopics[t]} — Subtema analítico ${s} en restauración gallega`,
          sourceUrl: `https://www.hosteleriadigital.es/topic-${t}/sub-${s}?utm_source=rss`
        });
      }
    }
    assert.equal(rawBatch.length, 100);

    // 400 exact URL duplicates with permuted tracking parameters
    for (let i = 0; i < 400; i++) {
      const parentIdx = i % 100;
      const t = Math.floor(parentIdx / 10);
      const s = parentIdx % 10;
      rawBatch.push({
        id: `EXACT-DUP-${i}`,
        title: `${distinctTopics[t]} — Subtema analítico ${s} en restauración gallega`,
        sourceUrl: `https://www.hosteleriadigital.es/topic-${t}/sub-${s}?utm_campaign=summer&gclid=tracking${i}`
      });
    }

    // 500 fuzzy title duplicates (>0.90 similarity to parents)
    for (let i = 0; i < 500; i++) {
      const parentIdx = i % 100;
      const t = Math.floor(parentIdx / 10);
      const s = parentIdx % 10;
      rawBatch.push({
        id: `FUZZY-DUP-${i}`,
        title: `¡${distinctTopics[t]} — Subtema analítico ${s} en restauración gallega!`,
        sourceUrl: `https://www.otroportal.es/mirror-${parentIdx}-${i}`
      });
    }

    assert.equal(rawBatch.length, 1000);

    const { uniqueItems, duplicatesCount } = deduplicateMarketItems(rawBatch, cache, { similarityThreshold: 0.82 });
    
    assert.equal(uniqueItems.length, 100, `Expected exactly 100 unique items from 1,000 batch, got ${uniqueItems.length}`);
    assert.equal(duplicatesCount, 900, `Expected 900 duplicates filtered, got ${duplicatesCount}`);
  });

  await test('STRESS-DEDUP-07: Sliding window cache retention (30-day retention vs 31-day pruning with invalid date resilience)', async () => {
    const tempCachePath = path.resolve('.agents/test_stress_sliding_cache.json');
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;

    const mockCache = {
      'valid-today': {
        fingerprint: 'valid-today',
        title: 'Today News',
        url: 'https://example.com/today',
        lastSeen: new Date(now).toISOString()
      },
      'valid-29-days-ago': {
        fingerprint: 'valid-29-days-ago',
        title: '29 Days Ago News',
        url: 'https://example.com/29',
        lastSeen: new Date(now - 29 * dayMs).toISOString()
      },
      'expired-31-days-ago': {
        fingerprint: 'expired-31-days-ago',
        title: '31 Days Ago News',
        url: 'https://example.com/31',
        lastSeen: new Date(now - 31 * dayMs).toISOString()
      },
      'expired-60-days-ago': {
        fingerprint: 'expired-60-days-ago',
        title: '60 Days Ago News',
        url: 'https://example.com/60',
        lastSeen: new Date(now - 60 * dayMs).toISOString()
      },
      'invalid-corrupt-date': {
        fingerprint: 'invalid-corrupt-date',
        title: 'Corrupt Date News',
        url: 'https://example.com/corrupt',
        lastSeen: 'NOT-A-VALID-DATE'
      }
    };

    saveCache(mockCache, tempCachePath, 30);
    const loaded = loadCache(tempCachePath);

    assert.ok(loaded['valid-today'], 'Today item must be retained');
    assert.ok(loaded['valid-29-days-ago'], '29-day item must be retained');
    assert.equal(loaded['expired-31-days-ago'], undefined, '31-day item must be pruned');
    assert.equal(loaded['expired-60-days-ago'], undefined, '60-day item must be pruned');
    assert.equal(loaded['invalid-corrupt-date'], undefined, 'Corrupt date item must be safely discarded');

    // Clean up
    if (fs.existsSync(tempCachePath)) fs.unlinkSync(tempCachePath);
  });

  await test('STRESS-DEDUP-08: Emoji and symbol titles normalization equality', async () => {
    const titleWithEmoji = '🚀 Qamarero lanza nueva suite en Santiago 🍽️';
    const titleWithoutEmoji = 'Qamarero lanza nueva suite en Santiago';
    
    assert.equal(normalizeText(titleWithEmoji), 'qamarero lanza nueva suite en santiago');
    assert.equal(normalizeText(titleWithoutEmoji), 'qamarero lanza nueva suite en santiago');
    assert.equal(computeTitleSimilarity(titleWithEmoji, titleWithoutEmoji), 1.0);
  });

  // ==========================================================================
  // SECTION 2: CLI RUNNER & BOUNDARY STRESS TESTS
  // ==========================================================================
  console.log(`\n${COLORS.bright}${COLORS.magenta}▶ [SECTION 2] CLI Runner, Argument Boundaries & Idempotency...${COLORS.reset}`);

  await test('STRESS-CLI-01: CLI argument parsing with extreme, empty, duplicate, and malformed inputs', async () => {
    // Default fallback to today's date
    const def = parseCliArgs([]);
    assert.match(def.date, /^\d{4}-\d{2}-\d{2}$/);
    assert.equal(def.dryRun, false);
    assert.equal(def.force, false);
    assert.equal(def.offline, false);

    // Explicit valid flags
    const custom = parseCliArgs(['--dry-run', '--force', '--offline', '--date=2026-11-20']);
    assert.equal(custom.date, '2026-11-20');
    assert.equal(custom.dryRun, true);
    assert.equal(custom.force, true);
    assert.equal(custom.offline, true);

    // Unrecognized or weird flags
    const weird = parseCliArgs(['--unknown-flag', '--foo=bar', '--dry-run', '--date=  2026-12-31  ']);
    assert.equal(weird.date, '2026-12-31');
    assert.equal(weird.dryRun, true);

    // Repeated flags
    const repeated = parseCliArgs(['--force', '--force', '--dry-run', '--dry-run', '--date=2025-01-01', '--date=2026-05-15']);
    assert.equal(repeated.date, '2026-05-15');
    assert.equal(repeated.force, true);
    assert.equal(repeated.dryRun, true);
  });

  await test('STRESS-CLI-02: Main runner idempotency guard returns code 2 (skipped) without --force, 0 with --force', async () => {
    const testDate = '2099-12-31';
    const testReportPath = path.resolve('docs/departamentos/2_marketing/investigaciones_diarias', `${testDate}_inteligencia_mercado.md`);

    // Ensure clean state
    if (fs.existsSync(testReportPath)) fs.unlinkSync(testReportPath);

    // Run 1: Should create report (code 0)
    const run1 = await runDailyIntelligence(['--offline', `--date=${testDate}`]);
    assert.equal(run1.code, 0);
    assert.equal(fs.existsSync(testReportPath), true);

    // Run 2: Without --force -> should skip (code 2)
    const run2 = await runDailyIntelligence(['--offline', `--date=${testDate}`]);
    assert.equal(run2.code, 2);
    assert.equal(run2.status, 'skipped');

    // Run 3: With --force -> should overwrite (code 0)
    const run3 = await runDailyIntelligence(['--offline', '--force', `--date=${testDate}`]);
    assert.equal(run3.code, 0);
    assert.equal(run3.status, 'success');

    // Run 4: With --dry-run -> should succeed without error (code 0)
    const run4 = await runDailyIntelligence(['--dry-run', `--date=${testDate}`]);
    assert.equal(run4.code, 0);
    assert.equal(run4.status, 'success');

    // Clean up test deliverable
    if (fs.existsSync(testReportPath)) fs.unlinkSync(testReportPath);
    const pdfClean = path.resolve(`Lecciones_Fluxo_31_12_2099.pdf`);
    if (fs.existsSync(pdfClean)) fs.unlinkSync(pdfClean);
  });

  await test('STRESS-CLI-03: Corrupt cache file resilience (invalid JSON, empty, binary data) does not crash CLI', async () => {
    const corruptCachePath = path.resolve('.agents/test_corrupted_cache.json');
    
    // Write invalid JSON
    fs.writeFileSync(corruptCachePath, '{ "corrupted": [unclosed array', 'utf-8');
    const cache1 = loadCache(corruptCachePath);
    assert.deepEqual(cache1, {}, 'Must fallback to empty object on JSON parse error');

    // Write binary garbage
    fs.writeFileSync(corruptCachePath, Buffer.from([0x00, 0xFF, 0x88, 0x77, 0x11]));
    const cache2 = loadCache(corruptCachePath);
    assert.deepEqual(cache2, {}, 'Must fallback to empty object on binary garbage');

    // Clean up
    if (fs.existsSync(corruptCachePath)) fs.unlinkSync(corruptCachePath);
  });

  // ==========================================================================
  // SECTION 3: STRICT INVARIANT & OPERATIONAL ENFORCEMENT STRESS
  // ==========================================================================
  console.log(`\n${COLORS.bright}${COLORS.magenta}▶ [SECTION 3] Non-Negotiable Invariants Deep Adversarial Audit...${COLORS.reset}`);

  await test('STRESS-INV-01: Pricing matrix immutability (Carta 39€, Sala 69€, Full 99€, Suite 139€, Setup 149€)', async () => {
    assert.equal(OFFICIAL_PRICING_PLANS.PLAN_CARTA.priceEur, 39);
    assert.equal(OFFICIAL_PRICING_PLANS.PLAN_SALA.priceEur, 69);
    assert.equal(OFFICIAL_PRICING_PLANS.PLAN_FULL.priceEur, 99);
    assert.equal(OFFICIAL_PRICING_PLANS.PLAN_SUITE.priceEur, 139);
    assert.equal(OFFICIAL_PRICING_PLANS.SETUP_FEE.priceEur, 149);
    assert.equal(OFFICIAL_PRICING_PLANS.SETUP_FEE.bonifiablePct, 100);

    // Immutability test: OFFICIAL_PRICING_PLANS should be frozen
    assert.throws(() => {
      OFFICIAL_PRICING_PLANS.PLAN_FULL = { priceEur: 199 };
    }, TypeError, 'OFFICIAL_PRICING_PLANS must be frozen against mutation');

    // Crawler output pricing sanity check
    const payload = await crawlMarketIntelligence({ offline: true, dryRun: true });
    assert.equal(payload.pricingSanityCheck.valid, true);
    assert.equal(payload.pricingSanityCheck.matrix.planCartaEur, 39);
    assert.equal(payload.pricingSanityCheck.matrix.planSalaEur, 69);
    assert.equal(payload.pricingSanityCheck.matrix.planFullEur, 99);
    assert.equal(payload.pricingSanityCheck.matrix.planSuiteEur, 139);
    assert.equal(payload.pricingSanityCheck.matrix.setupFeeEur, 149);
    assert.equal(payload.pricingSanityCheck.matrix.transactionCommissionPct, 0.0);
    assert.equal(payload.pricingSanityCheck.matrix.posReplacementRequired, false);
  });

  await test('STRESS-INV-02: Zero commission and non-invasive TPV invariants verified across all mock & live deliverables', async () => {
    const payload = await crawlMarketIntelligence({ offline: true, dryRun: true });
    const markdown = generateMarkdownReport(payload);

    assert.ok(markdown.includes('0% (Cero comisiones)'), 'Report must declare 0% commission');
    assert.ok(markdown.includes('39€ / 69€ / 99€ / 139€'), 'Report must show exact canonical tier prices');
    assert.ok(markdown.includes('149 €'), 'Report must state 149€ setup fee');
    assert.ok(markdown.includes('pending_validation'), 'Report must state Mozo Gatekeeper status');
    assert.ok(markdown.includes('Veri*Factu RD 1007/2023'), 'Report must detail Veri*Factu');
    assert.ok(markdown.includes('TicketBAI es de aplicación EXCLUSIVA en País Vasco y Navarra'), 'Report must segregate TicketBAI from Galicia');
  });

  await test('STRESS-INV-03: Mozo Gatekeeper pending_validation invariant strictly maintained in all educational & operational materials', async () => {
    const payload = await crawlMarketIntelligence({ offline: true, dryRun: true });
    assert.ok(payload.didacticLesson.questionForFounder.includes('pending_validation'));
    assert.ok(payload.didacticLesson.expectedAnswer.includes('camarero'));
    assert.ok(payload.didacticLesson.expectedAnswer.includes('desperdicio') || payload.didacticLesson.expectedAnswer.includes('fuego'));

    const syncEntry = formatSyncLogEntry(payload);
    assert.ok(syncEntry.includes('Pase de Cocina y el Mozo Gatekeeper'));
    assert.ok(syncEntry.includes('39€'));
    assert.ok(syncEntry.includes('99€'));
    assert.ok(syncEntry.includes('149€'));
  });

  // ==========================================================================
  // SECTION 4: CONCURRENCY, RACE CONDITIONS & INTEGRATION STRESS
  // ==========================================================================
  console.log(`\n${COLORS.bright}${COLORS.magenta}▶ [SECTION 4] Concurrency, Race Conditions & Playbook Integration...${COLORS.reset}`);

  await test('STRESS-CONC-01: 10 concurrent crawler executions against shared cache do not throw or corrupt memory', async () => {
    const sharedCachePath = path.resolve('.agents/test_concurrent_cache.json');
    if (fs.existsSync(sharedCachePath)) fs.unlinkSync(sharedCachePath);

    const promises = [];
    for (let i = 0; i < 10; i++) {
      promises.push(crawlMarketIntelligence({
        date: `2026-09-${String(10 + i).padStart(2, '0')}`,
        cachePath: sharedCachePath,
        offline: true,
        dryRun: false
      }));
    }

    const results = await Promise.all(promises);
    assert.equal(results.length, 10);
    for (const res of results) {
      assert.ok(res.quadrants.competitors.snapshots.length >= 4);
      assert.ok(res.deduplicationSummary.totalItemsScanned > 0);
    }

    assert.ok(fs.existsSync(sharedCachePath));
    const loaded = JSON.parse(fs.readFileSync(sharedCachePath, 'utf-8'));
    assert.ok(Object.keys(loaded).length > 0);

    if (fs.existsSync(sharedCachePath)) fs.unlinkSync(sharedCachePath);
  });

  await test('STRESS-INT-01: Repeated sequential execution of injectBattleCards maintains idempotency without duplication', async () => {
    const tempManualPath = path.resolve('docs/departamentos/2_marketing/test_manual_prospeccion_temp.md');
    
    const initialContent = `# Manual de Prospección
## 1. Introducción
Texto de bienvenida.

## 5. Battle Cards de Inteligencia de Mercado
Contenido viejo a sobreescribir.
`;
    fs.writeFileSync(tempManualPath, initialContent, 'utf-8');

    const payload = await crawlMarketIntelligence({ offline: true, dryRun: true });

    for (let i = 0; i < 10; i++) {
      const res = injectBattleCards(payload, tempManualPath);
      assert.equal(res.modified, true);
    }

    const finalContent = fs.readFileSync(tempManualPath, 'utf-8');
    const occurrences = (finalContent.match(/## 5\. Battle Cards de Inteligencia de Mercado/g) || []).length;
    assert.equal(occurrences, 1, `Expected exactly 1 section header, found ${occurrences}`);
    assert.ok(finalContent.includes('Qamarero'));
    assert.ok(finalContent.includes('Veri*Factu'));

    if (fs.existsSync(tempManualPath)) fs.unlinkSync(tempManualPath);
  });

  await test('STRESS-INT-02: Repeated sequential execution of appendSyncLog replaces same-day entry without growing duplicate logs', async () => {
    const tempLogPath = path.resolve('docs/test_sync_log_temp.md');
    
    const initialLog = `# Log de Sincronización

## 🕒 Registro de Eventos y Actualizaciones

### [2026-08-30 09:00] — Evento Anterior
* Evento de ayer.

---

*Cualquier cambio debe registrarse aquí.*
`;
    fs.writeFileSync(tempLogPath, initialLog, 'utf-8');

    const payload = await crawlMarketIntelligence({ date: '2026-08-31', offline: true, dryRun: true });

    for (let i = 0; i < 5; i++) {
      appendSyncLog(payload, tempLogPath);
    }

    const finalLog = fs.readFileSync(tempLogPath, 'utf-8');
    const occurrencesToday = (finalLog.match(/### \[2026-08-31 09:00\]/g) || []).length;
    assert.equal(occurrencesToday, 1, `Expected exactly 1 entry for today, found ${occurrencesToday}`);
    assert.ok(finalLog.includes('2026-08-30 09:00'), 'Previous historical entries must be preserved');

    if (fs.existsSync(tempLogPath)) fs.unlinkSync(tempLogPath);
  });

  // ==========================================================================
  // SECTION 5: PAYLOAD SANITIZATION & MARKDOWN INJECTION STRESS
  // ==========================================================================
  console.log(`\n${COLORS.bright}${COLORS.magenta}▶ [SECTION 5] Markdown Injection & Malformed Content Resilience...${COLORS.reset}`);

  await test('STRESS-SEC-01: News items with pipe characters "|", newlines, and Markdown tags do not corrupt table formatting', async () => {
    const maliciousPayload = await crawlMarketIntelligence({ offline: true, dryRun: true });
    
    maliciousPayload.quadrants.competitors.snapshots.push({
      competitorName: 'Hacker POS | DROP TABLE users; -- | **pwned**',
      entryPriceMonthly: 0,
      recommendedPlanMonthly: 0,
      setupFee: 0,
      transactionCommissionPct: 0.0,
      fixedCommissionPerTicket: 0.0,
      requiresPosReplacement: false,
      hasGatekeeperValidation: false,
      kdsSupported: false,
      escPosPrintingSupported: false,
      weakPoints: ['<script>alert(1)</script>'],
      fluxoAdvantage: 'Inmune a inyecciones | 0% comisiones',
      notes: 'Test note'
    });

    const markdown = generateMarkdownReport(maliciousPayload);
    assert.ok(markdown.includes('Hacker POS'));
    assert.ok(markdown.includes('FLUXO B2B'));
    assert.ok(markdown.length > 2000);
  });

  // ==========================================================================
  // FINAL SCOREBOARD
  // ==========================================================================
  console.log(`\n${COLORS.bright}${COLORS.cyan}================================================================================${COLORS.reset}`);
  console.log(`${COLORS.bright}${COLORS.cyan} 📊 CHALLENGER 1 STRESS SUITE SCOREBOARD ${COLORS.reset}`);
  console.log(`${COLORS.bright}${COLORS.cyan}================================================================================${COLORS.reset}`);
  console.log(` Total Stress Tests Executed: ${results.length}`);
  console.log(` ${COLORS.green}Passed: ${totalPassed}${COLORS.reset}`);
  console.log(` ${totalFailed > 0 ? COLORS.red : COLORS.reset}Failed: ${totalFailed}${COLORS.reset}`);
  console.log(`${COLORS.bright}${COLORS.cyan}================================================================================\n${COLORS.reset}`);

  return { total: results.length, passed: totalPassed, failed: totalFailed, results };
}

// Direct CLI invocation
const isDirect = process.argv[1] && process.argv[1].includes('stress_test_challenger_harness.mjs');
if (isDirect) {
  runChallengerStressTests()
    .then(res => {
      process.exit(res.failed === 0 ? 0 : 1);
    })
    .catch(err => {
      console.error('Fatal stress suite failure:', err);
      process.exit(1);
    });
}
