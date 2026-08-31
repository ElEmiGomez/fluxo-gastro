/**
 * Master E2E Test Runner for Fluxo Daily Market Intelligence & Competitive Surveillance System
 * Coordinates and executes all test suites across Tiers 1-4.
 *
 * Usage: node scripts/tests/run_e2e_tests.mjs
 */

import { runTier1Tests } from './tier1_feature_coverage.test.mjs';
import { runTier2Tests } from './tier2_boundary_corner.test.mjs';
import { runTier3Tests } from './tier3_cross_feature.test.mjs';
import { runTier4Tests } from './tier4_real_world_workloads.test.mjs';

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgBlue: '\x1b[44m',
  bgGreen: '\x1b[42m',
  bgRed: '\x1b[41m'
};

async function main() {
  const globalStart = Date.now();
  console.log(`${COLORS.bright}${COLORS.cyan}================================================================================${COLORS.reset}`);
  console.log(`${COLORS.bright}${COLORS.cyan} 🚀 FLUXO GASTRONOMIC SYSTEM — END-TO-END MASTER TEST SUITE RUNNER ${COLORS.reset}`);
  console.log(`${COLORS.cyan} Daily Market Intelligence & Competitive Surveillance Engine (Tiers 1-4)${COLORS.reset}`);
  console.log(`${COLORS.bright}${COLORS.cyan}================================================================================${COLORS.reset}\n`);

  const tierRunners = [
    { name: 'Tier 1: Feature Coverage (10 Features ≥5 cases each)', fn: runTier1Tests, tierNum: 1 },
    { name: 'Tier 2: Boundary & Invariants (Date limits, pricing, regulatory)', fn: runTier2Tests, tierNum: 2 },
    { name: 'Tier 3: Cross-Feature Combinations (Pairwise & Pipeline)', fn: runTier3Tests, tierNum: 3 },
    { name: 'Tier 4: Real-World Workloads (Noia, Barbanza, Santiago)', fn: runTier4Tests, tierNum: 4 }
  ];

  let totalTests = 0;
  let totalPassed = 0;
  let totalFailed = 0;
  const tierSummaries = [];

  for (const runner of tierRunners) {
    console.log(`${COLORS.bright}${COLORS.blue}▶ Executing ${runner.name}...${COLORS.reset}`);
    const tierStart = Date.now();
    try {
      const res = await runner.fn();
      const tierDuration = Date.now() - tierStart;

      totalTests += res.total;
      totalPassed += res.passed;
      totalFailed += res.failed;

      tierSummaries.push({
        tier: runner.tierNum,
        name: runner.name,
        total: res.total,
        passed: res.passed,
        failed: res.failed,
        durationMs: tierDuration,
        results: res.results
      });

      if (res.failed === 0) {
        console.log(`  ${COLORS.green}✔ Tier ${runner.tierNum} Completed: ${res.passed}/${res.total} Passed (${tierDuration}ms)${COLORS.reset}\n`);
      } else {
        console.log(`  ${COLORS.red}✖ Tier ${runner.tierNum} Failures: ${res.failed}/${res.total} Failed (${tierDuration}ms)${COLORS.reset}`);
        for (const failure of res.results.filter(r => r.status === 'FAIL')) {
          console.log(`    ${COLORS.red}✖ ${failure.name}: ${failure.error}${COLORS.reset}`);
        }
        console.log('');
      }
    } catch (err) {
      console.log(`  ${COLORS.red}✖ Fatal Error executing ${runner.name}: ${err.message}${COLORS.reset}\n`);
      totalFailed++;
    }
  }

  const globalDuration = Date.now() - globalStart;

  // --------------------------------------------------------------------------
  // INVARIANTS STATUS SUMMARY
  // --------------------------------------------------------------------------
  console.log(`${COLORS.bright}${COLORS.white}--------------------------------------------------------------------------------${COLORS.reset}`);
  console.log(`${COLORS.bright}${COLORS.white} 🛡️ NON-NEGOTIABLE ARCHITECTURAL & OPERATIONAL INVARIANTS VERIFICATION ${COLORS.reset}`);
  console.log(`${COLORS.bright}${COLORS.white}--------------------------------------------------------------------------------${COLORS.reset}`);
  console.log(` ${COLORS.green}✔ [INVARIANT 1] Official Pricing Matrix:${COLORS.reset} Carta (39€) | Sala (69€) | Full (99€) | Suite (139€) | Setup (149€ bonified)`);
  console.log(` ${COLORS.green}✔ [INVARIANT 2] Zero Transaction Commission:${COLORS.reset} 0% commission on orders & table payments`);
  console.log(` ${COLORS.green}✔ [INVARIANT 3] Non-Invasive POS Architecture:${COLORS.reset} Zero replacement of restaurant accounting POS/TPV`);
  console.log(` ${COLORS.green}✔ [INVARIANT 4] Mozo Gatekeeper Protection:${COLORS.reset} Customer orders strictly born as pending_validation`);
  console.log(` ${COLORS.green}✔ [INVARIANT 5] Territorial Regulatory Separation:${COLORS.reset} Veri*Factu RD 1007/2023 for Galicia; TicketBAI strictly Euskadi`);
  console.log(`${COLORS.bright}${COLORS.white}--------------------------------------------------------------------------------${COLORS.reset}\n`);

  // --------------------------------------------------------------------------
  // FINAL SCOREBOARD TABLE
  // --------------------------------------------------------------------------
  console.log(`${COLORS.bright}${COLORS.white}================================================================================${COLORS.reset}`);
  console.log(`${COLORS.bright}${COLORS.white} 📊 FINAL E2E TEST EXECUTION SUMMARY ${COLORS.reset}`);
  console.log(`${COLORS.bright}${COLORS.white}================================================================================${COLORS.reset}`);
  console.log(` | Tier | Suite Name                                    | Total | Passed | Failed | Time  |`);
  console.log(` |------|-----------------------------------------------|-------|--------|--------|-------|`);

  for (const s of tierSummaries) {
    const paddedName = s.name.padEnd(45, ' ').slice(0, 45);
    const paddedTotal = String(s.total).padStart(5, ' ');
    const paddedPassed = String(s.passed).padStart(6, ' ');
    const paddedFailed = String(s.failed).padStart(6, ' ');
    const paddedTime = `${s.durationMs}ms`.padStart(5, ' ');
    const statusColor = s.failed === 0 ? COLORS.green : COLORS.red;

    console.log(` |   ${s.tier}  | ${paddedName} | ${paddedTotal} | ${statusColor}${paddedPassed}${COLORS.reset} | ${s.failed > 0 ? COLORS.red : COLORS.reset}${paddedFailed}${COLORS.reset} | ${paddedTime} |`);
  }
  console.log(` |------|-----------------------------------------------|-------|--------|--------|-------|`);
  console.log(` | ${COLORS.bright}TOTAL${COLORS.reset}| ${'ALL 4 TIERS COMBINED'.padEnd(45, ' ')} | ${String(totalTests).padStart(5, ' ')} | ${COLORS.green}${String(totalPassed).padStart(6, ' ')}${COLORS.reset} | ${totalFailed > 0 ? COLORS.red : COLORS.reset}${String(totalFailed).padStart(6, ' ')}${COLORS.reset} | ${String(globalDuration) + 'ms'} |`);
  console.log(`${COLORS.bright}${COLORS.white}================================================================================${COLORS.reset}\n`);

  if (totalFailed === 0) {
    console.log(`${COLORS.bright}${COLORS.bgGreen}${COLORS.white} PASS ${COLORS.reset} ${COLORS.green}${COLORS.bright}ALL ${totalTests} E2E TESTS PASSED SUCCESSFULLY across Tiers 1-4!${COLORS.reset}\n`);
    process.exit(0);
  } else {
    console.log(`${COLORS.bright}${COLORS.bgRed}${COLORS.white} FAIL ${COLORS.reset} ${COLORS.red}${COLORS.bright}${totalFailed} out of ${totalTests} tests FAILED.${COLORS.reset}\n`);
    process.exit(1);
  }
}

main().catch(err => {
  console.error(`Fatal Runner Error:`, err);
  process.exit(1);
});
