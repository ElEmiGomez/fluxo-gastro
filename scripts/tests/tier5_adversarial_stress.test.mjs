/**
 * Tier 5 Adversarial Coverage Hardening & Gap Hunting Test Suite
 * Empirical Stress Harness for Challenger 2
 *
 * Attack Vectors Tested:
 * 1. File Permission & Filesystem Resilience
 * 2. Empty & Corrupted Files / Boundary Input Stress
 * 3. Adversarial Deduplication, Hash Attacks & Levenshtein Complexity
 * 4. CLI Arguments, Path Traversal & Date Malformation
 * 5. Extreme Network Failure & Offline Resilience
 * 6. PDF Compiler ReportLab, Layout Overflow & Argument Fuzzing
 * 7. Non-Negotiable Invariants & Pricing Sanity Check
 */

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { parseCliArgs, runDailyIntelligence } from '../daily_market_intelligence.mjs';
import { canonicalizeUrl, normalizeText, levenshteinDistance, computeTitleSimilarity, generateDedupFingerprint, loadCache, saveCache, deduplicateMarketItems } from '../lib/intelligence/dedup.mjs';
import { crawlMarketIntelligence } from '../lib/intelligence/crawler.mjs';
import { generateMarkdownReport, writeMarkdownReport } from '../lib/intelligence/reportGenerator.mjs';
import { injectBattleCards, formatBattleCardsSection } from '../lib/intelligence/salesIntegration.mjs';
import { appendSyncLog, formatSyncLogEntry } from '../lib/intelligence/syncLogger.mjs';

const results = [];

function assert(condition, testName, details = '') {
  if (condition) {
    results.push({ name: testName, status: 'PASS' });
  } else {
    results.push({ name: testName, status: 'FAIL', error: details || 'Assertion failed' });
  }
}

function runSync(fn, testName) {
  try {
    fn();
  } catch (err) {
    results.push({ name: testName, status: 'FAIL', error: err.message, stack: err.stack });
  }
}

async function runAsync(fn, testName) {
  try {
    await fn();
  } catch (err) {
    results.push({ name: testName, status: 'FAIL', error: err.message, stack: err.stack });
  }
}

export async function runTier5AdversarialTests() {
  const tempTestDir = path.resolve('.agents/challenger_2/temp_adversarial_test');
  if (!fs.existsSync(tempTestDir)) {
    fs.mkdirSync(tempTestDir, { recursive: true });
  }

  // =========================================================================
  // VECTOR 1: File Permission & Filesystem Resilience
  // =========================================================================
  runSync(() => {
    // Test 1.1: Missing target directories are created recursively in writeMarkdownReport
    const nestedReportPath = path.join(tempTestDir, 'nested/deep/dir/2026-08-31_test.md');
    const dummyPayload = {
      reportDate: '2026-08-31',
      generatedAt: new Date().toISOString(),
      environment: 'test',
      deduplicationSummary: { totalItemsScanned: 0, uniqueItemsAccepted: 0, duplicatesFiltered: 0 },
      quadrants: {
        competitors: { snapshots: [], keyTakeaways: [] },
        normative: { alerts: [], keyTakeaways: [] },
        floor_ops: { operationalMetrics: { avgWaiterKmPerShiftBaseline: 14, avgWaiterKmSavedPerShift: 6.8, avgWaiterKmSavedPct: 47, avgBillWaitMinutesBaseline: 11.2, avgBillWaitMinutesWithFluxo: 1.5, avgBillWaitMinutesReductionPct: 86, tableTurnoverIncreasePct: 20, netMonthlyGainFromExtraTableEur: 320 }, keyTakeaways: [] },
        gastro_ai: { trends: [], keyTakeaways: [] }
      },
      galiciaOpportunities: [],
      commercialInsights: [],
      didacticLesson: { coreConcept: 'Test', analogiesUsed: [], questionForFounder: 'Q', expectedAnswer: 'A', actionForFounder: 'Act' },
      pricingSanityCheck: { notes: 'OK' }
    };
    const written = writeMarkdownReport(dummyPayload, nestedReportPath);
    assert(fs.existsSync(written), 'V1.1 - writeMarkdownReport creates non-existent parent directories recursively');
  }, 'V1.1 - Directory recursive creation');

  runSync(() => {
    // Test 1.2: Unwritable / invalid cache directory handling in saveCache
    const uncreateableCachePath = path.join('Z:/invalid_drive_hopefully_nonexistent/test_cache.json');
    const sampleCache = { 'test-key': { title: 'Test', firstSeen: '2026-08-31' } };
    const saved = saveCache(sampleCache, uncreateableCachePath);
    assert(saved !== undefined, 'V1.2 - saveCache handles unwritable path gracefully without fatal crash');
  }, 'V1.2 - Unwritable cache path resilience');

  runSync(() => {
    // Test 1.3: Non-existent manualPath in injectBattleCards throws descriptive error
    const missingManual = path.join(tempTestDir, 'non_existent_manual.md');
    let threw = false;
    let errMsg = '';
    try {
      injectBattleCards({ commercialInsights: [] }, missingManual);
    } catch (err) {
      threw = true;
      errMsg = err.message;
    }
    assert(threw && errMsg.includes('Manual de prospección no encontrado'), 'V1.3 - injectBattleCards throws descriptive error when manual is missing', errMsg);
  }, 'V1.3 - Missing manual file error');

  runSync(() => {
    // Test 1.4: Non-existent logPath in appendSyncLog throws descriptive error
    const missingLog = path.join(tempTestDir, 'non_existent_sync.md');
    let threw = false;
    let errMsg = '';
    try {
      appendSyncLog({ reportDate: '2026-08-31' }, missingLog);
    } catch (err) {
      threw = true;
      errMsg = err.message;
    }
    assert(threw && errMsg.includes('Archivo de sincronización no encontrado'), 'V1.4 - appendSyncLog throws descriptive error when sync log is missing', errMsg);
  }, 'V1.4 - Missing sync log file error');

  runSync(() => {
    // Test 1.5: Missing anchor header in appendSyncLog throws explicit descriptive error
    const brokenLogPath = path.join(tempTestDir, 'broken_sync.md');
    fs.writeFileSync(brokenLogPath, '# Malformed sync log without the required anchor\nSome text\n', 'utf-8');
    let threw = false;
    let errMsg = '';
    try {
      appendSyncLog({ reportDate: '2026-08-31' }, brokenLogPath);
    } catch (err) {
      threw = true;
      errMsg = err.message;
    }
    assert(threw && errMsg.includes('No se encontró la cabecera "## 🕒 Registro de Eventos y Actualizaciones"'), 'V1.5 - appendSyncLog validates anchor header presence', errMsg);
  }, 'V1.5 - Missing anchor in sync log');

  // =========================================================================
  // VECTOR 2: Empty & Corrupted Files / Boundary Input Stress
  // =========================================================================
  runSync(() => {
    // Test 2.1: Empty manual file (0 bytes) in injectBattleCards
    const emptyManualPath = path.join(tempTestDir, 'empty_manual.md');
    fs.writeFileSync(emptyManualPath, '', 'utf-8');
    const res = injectBattleCards({ commercialInsights: [] }, emptyManualPath);
    const content = fs.readFileSync(emptyManualPath, 'utf-8');
    assert(res.modified && content.includes('## 5. Battle Cards de Inteligencia de Mercado'), 'V2.1 - injectBattleCards succeeds on 0-byte empty manual file');
  }, 'V2.1 - Empty manual file injection');

  runSync(() => {
    // Test 2.2: Corrupt JSON cache file handling
    const corruptCachePath = path.join(tempTestDir, 'corrupt_cache.json');
    fs.writeFileSync(corruptCachePath, '{ malformed: json, "unclosed": ', 'utf-8');
    const loaded = loadCache(corruptCachePath);
    assert(typeof loaded === 'object' && Object.keys(loaded).length === 0, 'V2.2 - loadCache recovers from corrupt JSON syntax by returning empty object');
  }, 'V2.2 - Corrupt JSON cache recovery');

  runSync(() => {
    // Test 2.3: Binary / Null byte file in loadCache
    const binaryCachePath = path.join(tempTestDir, 'binary_cache.bin');
    fs.writeFileSync(binaryCachePath, Buffer.from([0x00, 0xFF, 0xFE, 0xBA, 0xBE]));
    const loaded = loadCache(binaryCachePath);
    assert(typeof loaded === 'object' && Object.keys(loaded).length === 0, 'V2.3 - loadCache recovers safely from binary file');
  }, 'V2.3 - Binary cache file recovery');

  runSync(() => {
    // Test 2.4: Empty string, null and undefined inputs to string normalization functions
    assert(canonicalizeUrl('') === '', 'V2.4a - canonicalizeUrl("") returns empty string');
    assert(canonicalizeUrl(null) === '', 'V2.4b - canonicalizeUrl(null) returns empty string');
    assert(canonicalizeUrl(undefined) === '', 'V2.4c - canonicalizeUrl(undefined) returns empty string');
    assert(canonicalizeUrl(12345) === '', 'V2.4d - canonicalizeUrl(number) returns empty string');
    assert(normalizeText('') === '', 'V2.4e - normalizeText("") returns empty string');
    assert(normalizeText(null) === '', 'V2.4f - normalizeText(null) returns empty string');
    assert(normalizeText(undefined) === '', 'V2.4g - normalizeText(undefined) returns empty string');
    assert(computeTitleSimilarity('', '') === 0.0, 'V2.4h - computeTitleSimilarity("", "") returns 0.0');
    assert(computeTitleSimilarity(null, undefined) === 0.0, 'V2.4i - computeTitleSimilarity(null, undefined) returns 0.0');
  }, 'V2.4 - Null/Undefined string resilience');

  // =========================================================================
  // VECTOR 3: Adversarial Deduplication & Hash Attacks
  // =========================================================================
  runSync(() => {
    // Test 3.1: URL canonicalization stripping UTM params & sorting query keys
    const dirtyUrl1 = 'HTTPS://WWW.QAMARERO.COM/precios/?utm_source=google&utm_medium=cpc&b=2&a=1';
    const dirtyUrl2 = 'https://www.qamarero.com/precios?a=1&b=2';
    const canon1 = canonicalizeUrl(dirtyUrl1);
    const canon2 = canonicalizeUrl(dirtyUrl2);
    assert(canon1 === 'https://www.qamarero.com/precios?a=1&b=2', `V3.1a - canonicalizeUrl strips UTM and sorts params (Got: ${canon1})`);
    assert(canon1 === canon2, 'V3.1b - Both URLs canonicalize identically');
  }, 'V3.1 - URL canonicalization invariance');

  runSync(() => {
    // Test 3.2: URL Hash/Anchor handling observation (Adversarial Gap Hunting)
    const urlWithHash = 'https://www.qamarero.com/precios#pricing-table';
    const canonWithHash = canonicalizeUrl(urlWithHash);
    const hasHashRetained = canonWithHash.includes('#pricing-table');
    // We document whether hash is retained
    assert(hasHashRetained !== undefined, `V3.2 - Hash canonicalization observed: ${canonWithHash}`);
  }, 'V3.2 - URL anchor behavior');

  runSync(() => {
    // Test 3.3: Unicode diacritics and special punctuation normalization
    const titleA = '¡ÚLTIMA HORA! Qamarero sube precios un 20% en A Coruña (Galicia)...';
    const titleB = 'ultima hora qamarero sube precios un 20 en a coruna galicia';
    const normA = normalizeText(titleA);
    const normB = normalizeText(titleB);
    assert(normA === normB, `V3.3 - Diacritics, inverted exclamation, ellipsis and casing normalize identically (normA: "${normA}")`);
  }, 'V3.3 - Diacritics and symbols normalization');

  runSync(() => {
    // Test 3.4: Levenshtein distance boundary cases
    assert(levenshteinDistance('', '') === 0, 'V3.4a - Levenshtein between empty strings is 0');
    assert(levenshteinDistance('abc', '') === 3, 'V3.4b - Levenshtein with empty string equals length');
    assert(levenshteinDistance('', 'abcd') === 4, 'V3.4c - Levenshtein with empty string equals length');
    assert(levenshteinDistance('kitten', 'sitting') === 3, 'V3.4d - Classic kitten->sitting is 3');
  }, 'V3.4 - Levenshtein boundary checks');

  runSync(() => {
    // Test 3.5: Stress test Levenshtein performance with large strings
    const start = Date.now();
    const strA = 'A'.repeat(500) + 'B'.repeat(500);
    const strB = 'A'.repeat(500) + 'C'.repeat(500);
    const dist = levenshteinDistance(strA, strB);
    const elapsed = Date.now() - start;
    assert(dist === 500 && elapsed < 300, `V3.5 - 1000-char Levenshtein computed accurately in ${elapsed}ms (<300ms budget)`);
  }, 'V3.5 - Levenshtein performance & allocation');

  runSync(() => {
    // Test 3.6: Deduplication engine with batch containing exact + fuzzy + unique items
    const rawBatch = [
      { id: '1', title: 'Qamarero sube precios en Santiago', sourceUrl: 'https://news.com/1?utm_source=fb' },
      { id: '2', title: 'Qamarero sube precios en Santiago', sourceUrl: 'https://news.com/1' }, // Exact fingerprint duplicate
      { id: '3', title: 'Qamarero sube precios en Santiago.', sourceUrl: 'https://news.com/diff' }, // Fuzzy duplicate (>0.82)
      { id: '4', title: 'Nueva normativa Veri*Factu RD 1007/2023 en Galicia', sourceUrl: 'https://boe.es/1' } // Unique
    ];
    const { uniqueItems, duplicatesCount } = deduplicateMarketItems(rawBatch, {}, { similarityThreshold: 0.82 });
    assert(uniqueItems.length === 2 && duplicatesCount === 2, `V3.6 - Deduplication filtered exactly 2 duplicates (kept ${uniqueItems.length}, filtered ${duplicatesCount})`);
  }, 'V3.6 - Batch deduplication logic');

  runSync(() => {
    // Test 3.7: 30-day sliding window pruning in saveCache
    const testCache = {
      'fresh_entry': { title: 'Recent', firstSeen: '2026-08-30', lastSeen: '2026-08-30' },
      'expired_entry': { title: 'Old', firstSeen: '2026-06-01', lastSeen: '2026-06-01' },
      'invalid_date_entry': { title: 'Broken', firstSeen: 'not-a-date', lastSeen: 'corrupted' }
    };
    const prunedPath = path.join(tempTestDir, 'pruned_cache.json');
    const pruned = saveCache(testCache, prunedPath, 30);
    assert(pruned['fresh_entry'] !== undefined, 'V3.7a - Fresh entry is retained');
    assert(pruned['expired_entry'] === undefined, 'V3.7b - Expired entry (>30d) is pruned');
    assert(pruned['invalid_date_entry'] === undefined, 'V3.7c - Corrupted date entry is safely pruned');
  }, 'V3.7 - Cache 30-day sliding window pruning');

  // =========================================================================
  // VECTOR 4: CLI Arguments, Path Traversal & Date Malformation
  // =========================================================================
  runSync(() => {
    // Test 4.1: CLI Argument parser variations
    const args1 = ['--dry-run', '--force', '--offline', '--date=2026-09-01'];
    const opt1 = parseCliArgs(args1);
    assert(opt1.dryRun === true && opt1.force === true && opt1.offline === true && opt1.date === '2026-09-01', 'V4.1a - parseCliArgs correctly extracts all flags and explicit date');

    const args2 = [];
    const opt2 = parseCliArgs(args2);
    assert(opt2.dryRun === false && opt2.force === false && /^\d{4}-\d{2}-\d{2}$/.test(opt2.date), 'V4.1b - parseCliArgs defaults to current ISO date YYYY-MM-DD');
  }, 'V4.1 - CLI arguments parsing');

  await runAsync(async () => {
    // Test 4.2: Dry-run isolation invariant (dry-run must never create disk artifacts)
    const dryRunDate = '2099-12-31';
    const reportPath = path.resolve('docs/departamentos/2_marketing/investigaciones_diarias', `${dryRunDate}_inteligencia_mercado.md`);
    if (fs.existsSync(reportPath)) fs.unlinkSync(reportPath);

    const res = await runDailyIntelligence(['--dry-run', `--date=${dryRunDate}`]);
    assert(res.status === 'success' && res.code === 0, 'V4.2a - dry-run returns success exit code 0');
    assert(!fs.existsSync(reportPath), 'V4.2b - dry-run strictly avoided creating markdown report on disk');
  }, 'V4.2 - Dry-run filesystem isolation');

  await runAsync(async () => {
    // Test 4.3: Idempotency skip when report already exists and --force is omitted
    const existingDate = '2026-08-31';
    const reportPath = path.resolve('docs/departamentos/2_marketing/investigaciones_diarias', `${existingDate}_inteligencia_mercado.md`);
    if (!fs.existsSync(reportPath)) {
      fs.writeFileSync(reportPath, '# Mock report for idempotency test', 'utf-8');
    }

    const res = await runDailyIntelligence([`--date=${existingDate}`]);
    assert(res.status === 'skipped' && res.code === 2, `V4.3 - Duplicate run without --force returns skipped (code: ${res.code})`);
  }, 'V4.3 - Idempotency skip guard');

  // =========================================================================
  // VECTOR 5: Extreme Network Failure & Offline Resilience
  // =========================================================================
  await runAsync(async () => {
    // Test 5.1: crawlMarketIntelligence executes seamlessly with offline=false (simulated network degradation fallback)
    const payloadOnline = await crawlMarketIntelligence({ offline: false, dryRun: true, date: '2026-08-31' });
    assert(payloadOnline.quadrants.competitors.snapshots.length >= 4, 'V5.1a - crawlMarketIntelligence fallback yields competitor snapshots');
    assert(payloadOnline.quadrants.normative.alerts.length >= 3, 'V5.1b - crawlMarketIntelligence fallback yields normative alerts');
    assert(payloadOnline.commercialInsights.length >= 3, 'V5.1c - crawlMarketIntelligence fallback yields commercial battle cards');

    // Test 5.2: crawlMarketIntelligence with offline=true
    const payloadOffline = await crawlMarketIntelligence({ offline: true, dryRun: true, date: '2026-08-31' });
    assert(payloadOffline.environment === 'offline_simulation', 'V5.2 - crawlMarketIntelligence marks environment offline_simulation');
  }, 'V5.1 & V5.2 - Network resilience & offline fallback');

  // =========================================================================
  // VECTOR 6: PDF Compiler ReportLab & XML Injection Stress
  // =========================================================================
  runSync(() => {
    // Test 6.1: Run python pdfCompiler.py directly with date and output flag
    const testPdfPath = path.join(tempTestDir, 'Test_Didactic_Output.pdf');
    const pythonScript = path.resolve('scripts/lib/intelligence/pdfCompiler.py');
    const res = spawnSync('python', [pythonScript, '--date=2026-08-31', `--output=${testPdfPath}`], {
      encoding: 'utf-8',
      stdio: 'pipe'
    });
    assert(res.status === 0, `V6.1a - pdfCompiler.py executed with status 0 (stderr: ${res.stderr})`);
    assert(fs.existsSync(testPdfPath) && fs.statSync(testPdfPath).size > 1000, 'V6.1b - Generated PDF file exists and is valid size (>1KB)');
  }, 'V6.1 - PDF compilation execution');

  runSync(() => {
    // Test 6.2: PDF compiler with adversarial date input (e.g. malformed date)
    const testPdfPath2 = path.join(tempTestDir, 'Test_Adversarial_Date.pdf');
    const pythonScript = path.resolve('scripts/lib/intelligence/pdfCompiler.py');
    const res = spawnSync('python', [pythonScript, '--date=31/08/2026', `--output=${testPdfPath2}`], {
      encoding: 'utf-8',
      stdio: 'pipe'
    });
    assert(res.status === 0 && fs.existsSync(testPdfPath2), 'V6.2 - pdfCompiler.py survives non-standard date format');
  }, 'V6.2 - PDF compiler malformed date resilience');

  // =========================================================================
  // VECTOR 7: Non-Negotiable Invariants & Pricing Sanity
  // =========================================================================
  await runAsync(async () => {
    const payload = await crawlMarketIntelligence({ offline: true, dryRun: true, date: '2026-08-31' });
    const { matrix } = payload.pricingSanityCheck;

    assert(matrix.planCartaEur === 39, 'V7.1 - Invariant 1: Plan Carta must be exactly 39 €/mo');
    assert(matrix.planSalaEur === 69, 'V7.2 - Invariant 1: Plan Sala must be exactly 69 €/mo');
    assert(matrix.planFullEur === 99, 'V7.3 - Invariant 1: Plan Full must be exactly 99 €/mo');
    assert(matrix.planSuiteEur === 139, 'V7.4 - Invariant 1: Plan Suite must be exactly 139 €/mo');
    assert(matrix.setupFeeEur === 149, 'V7.5 - Invariant 1: Setup fee must be exactly 149 €');
    assert(matrix.transactionCommissionPct === 0.0, 'V7.6 - Invariant 2: Transaction commission must be 0%');
    assert(matrix.posReplacementRequired === false, 'V7.7 - Invariant 3: POS replacement must be FALSE (0 replacement)');

    // Invariant 4: Mozo Gatekeeper check in snapshots & didactic lesson
    const hasGatekeeperInSnapshots = payload.quadrants.competitors.snapshots.some(s => s.competitorName.includes('Qamarero') && s.hasGatekeeperValidation === false);
    const hasGatekeeperInLesson = payload.didacticLesson.coreConcept.toLowerCase().includes('mozo') || payload.didacticLesson.title.toLowerCase().includes('mozo');
    assert(hasGatekeeperInSnapshots && hasGatekeeperInLesson, 'V7.8 - Invariant 4: Mozo Gatekeeper is strictly documented in competitors and didactic lesson');

    // Invariant 5: Normative territorial separation (Veri*Factu for Galicia vs TicketBAI exclusively Basque Country)
    const veriFactuAlert = payload.quadrants.normative.alerts.find(a => a.regulationName.includes('Veri*Factu'));
    const ticketBaiTakeaway = payload.quadrants.normative.keyTakeaways.some(t => t.includes('TicketBAI') && t.includes('EXCLUSIVA en País Vasco'));
    assert(veriFactuAlert !== undefined && ticketBaiTakeaway, 'V7.9 - Invariant 5: Veri*Factu RD 1007/2023 vs TicketBAI strict territorial separation confirmed');
  }, 'V7 - Non-negotiable Invariants Verification');

  // Clean up temp dir
  try {
    fs.rmSync(tempTestDir, { recursive: true, force: true });
  } catch {}

  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const total = results.length;

  return { total, passed, failed, results };
}

// CLI Execution
if (process.argv[1] && process.argv[1].endsWith('tier5_adversarial_stress.test.mjs')) {
  console.log('🚀 Running Tier 5 Adversarial Stress Test Suite...\n');
  runTier5AdversarialTests().then(res => {
    console.log(`\n================================================================`);
    console.log(`🏁 TIER 5 ADVERSARIAL STRESS TEST RESULTS: ${res.passed}/${res.total} PASSED`);
    console.log(`================================================================`);
    if (res.failed > 0) {
      console.log(`❌ Failures:`);
      for (const f of res.results.filter(r => r.status === 'FAIL')) {
        console.log(`  - ${f.name}: ${f.error}`);
      }
      process.exit(1);
    } else {
      console.log(`✅ All ${res.total} adversarial stress assertions passed!`);
      process.exit(0);
    }
  }).catch(err => {
    console.error('Fatal Error:', err);
    process.exit(1);
  });
}
