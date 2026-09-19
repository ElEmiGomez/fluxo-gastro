import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import { chromium } from '@playwright/test';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Core target destinations
const WORKSPACE_DEST = path.resolve(__dirname, '../docs/Informe_Ejecutivo_RestoBar_Noia.pdf');
const PRIMARY_DESKTOP_DEST = 'C:/Users/mima7/OneDrive/Escritorio/Informe_Ejecutivo_RestoBar_Noia.pdf';

/**
 * Dynamically resolves all candidate Desktop destinations on Windows.
 * Queries Windows registry (User Shell Folders) to discover redirected folders,
 * while strictly guaranteeing the user-specified Desktop destination is included.
 */
function resolveDesktopDestinations() {
  const targets = new Set();
  // Always include the exact required destination
  targets.add(path.normalize(PRIMARY_DESKTOP_DEST));

  // 1. Query Windows Registry for User Shell Folders Desktop
  try {
    const regOutput = execSync(
      'reg query "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\User Shell Folders" /v Desktop',
      { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }
    );
    const match = regOutput.match(/Desktop\s+REG_\S+\s+(.+)/);
    if (match && match[1]) {
      let regDesktop = match[1].trim();
      if (regDesktop.includes('%USERPROFILE%') && process.env.USERPROFILE) {
        regDesktop = regDesktop.replace(/%USERPROFILE%/gi, process.env.USERPROFILE);
      }
      if (fs.existsSync(regDesktop)) {
        targets.add(path.normalize(path.join(regDesktop, 'Informe_Ejecutivo_RestoBar_Noia.pdf')));
      }
    }
  } catch {
    // Registry query is best-effort fallback
  }

  // 2. Query Windows Registry for standard Shell Folders Desktop
  try {
    const regOutput2 = execSync(
      'reg query "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Shell Folders" /v Desktop',
      { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }
    );
    const match2 = regOutput2.match(/Desktop\s+REG_\S+\s+(.+)/);
    if (match2 && match2[1]) {
      const shellDesktop = match2[1].trim();
      if (fs.existsSync(shellDesktop)) {
        targets.add(path.normalize(path.join(shellDesktop, 'Informe_Ejecutivo_RestoBar_Noia.pdf')));
      }
    }
  } catch {
    // Shell Folders query is best-effort fallback
  }

  // 3. Fallback standard paths
  const candidateDirs = [
    'C:/Users/mima7/OneDrive/Escritorio',
    'C:/Users/mima7/Desktop',
    process.env.USERPROFILE ? path.join(process.env.USERPROFILE, 'OneDrive/Escritorio') : null,
    process.env.USERPROFILE ? path.join(process.env.USERPROFILE, 'Desktop') : null,
  ];

  for (const dir of candidateDirs) {
    if (dir && fs.existsSync(dir)) {
      targets.add(path.normalize(path.join(dir, 'Informe_Ejecutivo_RestoBar_Noia.pdf')));
    }
  }

  return Array.from(targets);
}

/**
 * Report Configuration Model.
 * Modular, decoupled data structure supporting future multi-tenant dynamic generation.
 */
export const DEFAULT_REPORT_DATA = {
  client: {
    name: 'RestoBar Noia',
    address: 'Rúa do Curro, Noia (A Coruña)',
    auditMonth: 'Septiembre 2026',
    optimizationMonth: 'Octubre 2026',
    planName: 'Plan Full · Fluxo Intelligence',
    planCost: 99,
    statusP1: 'Auditoría Superada · 30 Días',
    statusP2: 'Estrategia Octubre 2026',
  },
  kpis: {
    totalRevenue: '22.840 €',
    revenueDelta: '+12,8% vs previo manual',
    ordersProcessed: '714',
    ordersPerDay: '23,8 pedidos / día',
    avgTicket: '31,98 €',
    avgTicketDelta: '+3,85 € por comanda',
    totalGuests: '1.856',
    guestsPerDay: '61,8 comensales / día',
    turnoverRate: '1,8x',
    turnoverDelta: 'turn / servicio (+0,4x)',
  },
  speed: {
    waiterTime: '48 sec',
    waiterTimeBefore: '4.2 min',
    waiterReduction: '-81% de tiempo',
    kitchenTime: '11.5 min',
    kitchenReduction: '-22% tiempos muertos',
    stayTimeCurrent: '64 min / mesa',
    stayTimeBefore: '78 min',
    stayReduction: '-14 min / mesa',
  },
  congestion: {
    lunchPct: '46%',
    lunchWindow: '13:30 - 15:30',
    lunchPeak: '14:15',
    lunchOrders: '328 comandas',
    dinnerPct: '38%',
    dinnerWindow: '21:00 - 23:30',
    dinnerPeak: '22:00',
    dinnerOrders: '271 comandas',
    otherPct: '16%',
    otherOrders: '115 comandas',
  },
  roi: {
    qrIncremental: '+1.480 €/mes',
    turnoverGains: '+1.120 €/mes',
    totalGross: '+2.600 €/mes',
    subscriptionCost: '99 €/mes',
    netProfit: '+2.501 €/mes',
    multiplier: 'ROI > 26x',
    annualAiRecommendations: '+1.490 €/mes',
    projectedMonthlyTotal: '+3.991 €/mes',
    projectedAnnualTotal: '+47.892 €/año',
    annualSubscriptionCost: '1.188 €',
  },
  signoff: {
    signatory: 'D. Guillermo Gómez',
    role: 'Chief Operating Officer & Lead Architect · Fluxo',
    contactEmail: 'contacto@fluxo-gastro.com',
    website: 'www.fluxo-gastro.com',
    licenseCode: 'PLAN FULL NOIA-2026-09',
  }
};

/**
 * Recursively merges user overrides with default report configuration.
 * Guarantees crash immunity against partial data objects.
 */
export function mergeWithDefaults(defaults, overrides) {
  if (!overrides || typeof overrides !== 'object') return { ...defaults };
  const result = { ...defaults };
  for (const key of Object.keys(defaults)) {
    if (overrides[key] !== undefined) {
      if (typeof defaults[key] === 'object' && defaults[key] !== null && !Array.isArray(defaults[key])) {
        result[key] = { ...defaults[key], ...overrides[key] };
      } else {
        result[key] = overrides[key];
      }
    }
  }
  return result;
}

/**
 * Builds high-resolution print-ready HTML document for the 2-page report.
 */
export function buildReportHtml(inputData = DEFAULT_REPORT_DATA) {
  const data = mergeWithDefaults(DEFAULT_REPORT_DATA, inputData);
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Informe Ejecutivo - ${data.client.name} - Fluxo Gastronomic System</title>
  <meta name="author" content="Fluxo Gastronomic System" />
  <meta name="description" content="Informe Ejecutivo y Comercial de Rendimiento Operativo y Retorno de Inversión (ROI) para RestoBar Noia" />
  <meta name="keywords" content="Fluxo, RestoBar Noia, ROI, Rendimiento Operativo, Matriz BCG, Hostelería, Plan Full" />
  <style>
    @page {
      size: A4 portrait;
      margin: 0;
    }
    *, *::before, *::after {
      box-sizing: border-box;
    }
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background-color: #f8fafc;
      color: #0f172a;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    @media print {
      body {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        background-color: #ffffff !important;
      }
      .page {
        page-break-inside: avoid !important;
        page-break-after: always !important;
        break-inside: avoid !important;
        break-after: page !important;
      }
      .page:last-child {
        page-break-after: avoid !important;
        break-after: avoid !important;
      }
    }
    .page {
      width: 210mm;
      height: 297mm;
      max-height: 297mm;
      min-height: 297mm;
      padding: 12mm 14mm 10mm 14mm;
      position: relative;
      page-break-after: always;
      page-break-inside: avoid;
      break-after: page;
      break-inside: avoid;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      background: #ffffff;
    }
    .page:last-child {
      page-break-after: avoid;
      break-after: avoid;
    }

    /* Content wrap distributes top-level children evenly across printable height */
    .content-wrap {
      display: flex;
      flex-direction: column;
      flex: 1;
      justify-content: space-between;
      min-height: 0;
      margin-bottom: 6px;
    }

    /* Top Brand Bar */
    .header-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 6px;
      margin: 0;
    }
    .brand-group {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
    }
    .logo-badge {
      background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%);
      color: #ffffff;
      font-weight: 900;
      font-size: 11.5px;
      letter-spacing: 1.2px;
      padding: 3.5px 8px;
      border-radius: 5px;
      display: inline-flex;
      align-items: center;
      gap: 5px;
    }
    .brand-text-block {
      display: flex;
      flex-direction: column;
    }
    .brand-sub {
      font-size: 9.0px;
      font-weight: 800;
      letter-spacing: 0.4px;
      color: #0f172a;
      text-transform: uppercase;
    }
    .brand-sub2 {
      font-size: 7.5px;
      color: #64748b;
      font-weight: 600;
    }
    .meta-badges {
      display: flex;
      gap: 5px;
      align-items: center;
      flex-shrink: 0;
    }
    .badge-tier {
      background: #eff6ff;
      color: #1d4ed8;
      border: 1px solid #bfdbfe;
      font-size: 8.0px;
      font-weight: 800;
      padding: 3px 8px;
      border-radius: 12px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      white-space: nowrap;
    }
    .badge-period {
      background: #f8fafc;
      color: #334155;
      border: 1px solid #cbd5e1;
      font-size: 8.0px;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 12px;
      white-space: nowrap;
    }

    /* Document Title Block */
    .title-block {
      background: linear-gradient(to right, #f8fafc, #ffffff);
      border: 1px solid #cbd5e1;
      border-left: 5px solid #1e3a8a;
      border-radius: 7px;
      padding: 8px 12px;
      margin: 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .title-left {
      flex: 1;
      min-width: 0;
      padding-right: 12px;
    }
    .title-left h1 {
      margin: 0 0 2px 0;
      font-size: 13px;
      font-weight: 900;
      color: #0f172a;
      letter-spacing: -0.2px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .title-left p {
      margin: 0;
      font-size: 8px;
      color: #475569;
      line-height: 1.35;
      white-space: normal;
    }
    .client-chip {
      text-align: right;
      padding-left: 12px;
      border-left: 1px solid #e2e8f0;
      min-width: 155px;
      max-width: 195px;
      flex-shrink: 0;
    }
    .client-logo {
      max-width: 140px;
      max-height: 28px;
      object-fit: contain;
      margin-bottom: 2px;
    }
    .client-name {
      font-size: 14px;
      font-weight: 900;
      color: #0f172a;
    }
    .client-loc {
      font-size: 8.5px;
      color: #64748b;
      font-weight: 600;
      margin-top: 1px;
    }
    .client-status {
      font-size: 8px;
      color: #059669;
      font-weight: 800;
      text-transform: uppercase;
      margin-top: 2px;
      letter-spacing: 0.3px;
    }

    /* Executive Highlight Callout */
    .exec-summary-box {
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 8.5px 13px;
      margin: 0;
      font-size: 8.8px;
      color: #334155;
      line-height: 1.42;
    }
    .exec-summary-box strong {
      color: #0f172a;
    }

    /* Report Sections */
    .report-section {
      margin: 0;
      display: flex;
      flex-direction: column;
    }
    .section-title {
      font-size: 10.5px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #1e3a8a;
      margin: 0 0 6px 0;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .section-title span.dot {
      display: inline-block;
      width: 6px;
      height: 6px;
      background: #2563eb;
      border-radius: 50%;
    }

    /* KPI Grid */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 9px;
    }
    .kpi-card {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 7px;
      padding: 9.5px 10px;
      box-shadow: 0 1px 2px rgba(0,0,0,0.03);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      min-height: 64px;
    }
    .kpi-label {
      font-size: 7.8px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      margin-bottom: 3px;
      letter-spacing: 0.3px;
    }
    .kpi-value {
      font-size: 18px;
      font-weight: 900;
      color: #0f172a;
      letter-spacing: -0.4px;
      line-height: 1.1;
      margin-bottom: 4px;
    }
    .kpi-badge {
      display: inline-flex;
      align-items: center;
      gap: 3px;
      font-size: 7.4px;
      font-weight: 700;
      padding: 2px 5.5px;
      border-radius: 4px;
      width: fit-content;
    }
    .kpi-badge.positive {
      background: #dcfce7;
      color: #15803d;
    }
    .kpi-badge.neutral {
      background: #f1f5f9;
      color: #334155;
    }

    /* Service Speed Breakdown */
    .speed-container {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 7px;
      padding: 10px 13px;
    }
    .speed-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 11px;
    }
    .speed-item {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 8.5px 11px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .speed-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 4px;
    }
    .speed-title {
      font-size: 8.5px;
      font-weight: 800;
      color: #334155;
      text-transform: uppercase;
      letter-spacing: 0.2px;
    }
    .speed-delta {
      font-size: 7.6px;
      font-weight: 800;
      color: #15803d;
      background: #dcfce7;
      padding: 2px 5.5px;
      border-radius: 3px;
      white-space: nowrap;
    }
    .speed-main {
      font-size: 13.5px;
      font-weight: 900;
      color: #0f172a;
      margin-bottom: 3px;
      white-space: nowrap;
    }
    .speed-main-sub {
      font-size: 8px;
      font-weight: 600;
      color: #64748b;
    }
    .speed-progress-wrap {
      height: 5px;
      background: #e2e8f0;
      border-radius: 3px;
      overflow: hidden;
      margin-bottom: 5px;
    }
    .speed-bar {
      height: 100%;
      background: #2563eb;
      border-radius: 3px;
    }
    .speed-desc {
      font-size: 7.8px;
      color: #475569;
      line-height: 1.35;
    }

    /* Congestion Analysis */
    .congestion-container {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 7px;
      padding: 10px 13px;
    }
    .congestion-bars {
      display: flex;
      height: 14px;
      border-radius: 4px;
      overflow: hidden;
      margin-bottom: 7px;
      border: 1px solid #cbd5e1;
    }
    .bar-lunch {
      width: 46%;
      background: #1e3a8a;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #ffffff;
      font-size: 8px;
      font-weight: 800;
      letter-spacing: 0.2px;
    }
    .bar-dinner {
      width: 38%;
      background: #2563eb;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #ffffff;
      font-size: 8px;
      font-weight: 800;
      letter-spacing: 0.2px;
    }
    .bar-other {
      width: 16%;
      background: #94a3b8;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #ffffff;
      font-size: 8px;
      font-weight: 800;
      letter-spacing: 0.2px;
    }
    .congestion-grid {
      display: grid;
      grid-template-columns: 1.15fr 1.15fr 0.7fr;
      gap: 9px;
    }
    .congestion-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 5px;
      padding: 7px 9px;
    }
    .congestion-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 3px;
    }
    .congestion-name {
      font-size: 8.5px;
      font-weight: 800;
      color: #0f172a;
    }
    .congestion-pct {
      font-size: 9.2px;
      font-weight: 900;
      color: #1e3a8a;
    }
    .congestion-time {
      font-size: 7.8px;
      font-weight: 700;
      color: #2563eb;
      margin-bottom: 3px;
    }
    .congestion-notes {
      font-size: 7.6px;
      color: #475569;
      line-height: 1.32;
    }

    /* Financial ROI Balance Section */
    .roi-hero {
      background: linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%);
      color: #ffffff;
      border-radius: 8px;
      padding: 11px 15px;
      margin-bottom: 8px;
      box-shadow: 0 3px 6px rgba(6, 78, 59, 0.16);
    }
    .roi-hero-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid rgba(255,255,255,0.25);
      padding-bottom: 6px;
      margin-bottom: 8px;
    }
    .roi-hero-title {
      font-size: 11.5px;
      font-weight: 800;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      display: flex;
      align-items: center;
      gap: 7px;
    }
    .roi-multiplier {
      background: #34d399;
      color: #064e3b;
      font-weight: 900;
      font-size: 10.5px;
      padding: 3.5px 10px;
      border-radius: 12px;
      letter-spacing: 0.3px;
    }
    .roi-hero-grid {
      display: grid;
      grid-template-columns: 1.2fr 1.2fr 0.95fr 1.15fr;
      gap: 9px;
      align-items: center;
    }
    .roi-box {
      background: rgba(255,255,255,0.1);
      border: 1px solid rgba(255,255,255,0.2);
      border-radius: 6px;
      padding: 8px 10px;
    }
    .roi-box-label {
      font-size: 7.5px;
      text-transform: uppercase;
      font-weight: 700;
      color: #a7f3d0;
      margin-bottom: 3px;
      letter-spacing: 0.3px;
    }
    .roi-box-val {
      font-size: 16px;
      font-weight: 900;
      color: #ffffff;
      line-height: 1.1;
      margin-bottom: 3px;
    }
    .roi-box-sub {
      font-size: 7.2px;
      color: #e2e8f0;
      line-height: 1.3;
    }
    .roi-net-box {
      background: #ffffff;
      color: #064e3b;
      border-radius: 6px;
      padding: 8px 10px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.12);
    }
    .roi-net-box .roi-box-label {
      color: #047857;
      font-weight: 800;
    }
    .roi-net-box .roi-box-val {
      color: #064e3b;
      font-size: 18px;
    }
    .roi-net-box .roi-box-sub {
      color: #065f46;
      font-weight: 700;
    }

    /* Summary Financial Row */
    .roi-explanation {
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      border-radius: 6px;
      padding: 8.5px 12px;
      font-size: 8.2px;
      color: #065f46;
      line-height: 1.42;
      margin: 0;
    }
    .roi-explanation strong {
      color: #064e3b;
    }

    /* Page Footer */
    .page-footer {
      border-top: 1px solid #cbd5e1;
      padding-top: 6px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 8px;
      color: #64748b;
    }
    .footer-left {
      font-weight: 600;
    }
    .footer-right {
      font-weight: 800;
      color: #0f172a;
    }

    /* PAGE 2 STYLES */
    .matrix-container {
      display: grid;
      grid-template-columns: 1fr 1fr;
      grid-template-rows: 1fr 1fr;
      gap: 10px;
    }
    .quadrant {
      border: 1px solid #cbd5e1;
      border-radius: 7px;
      padding: 10px 12px;
      background: #ffffff;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      box-shadow: 0 1px 2px rgba(0,0,0,0.03);
      min-height: 146px;
    }
    .quadrant-stars {
      border-top: 4px solid #2563eb;
      background: #f8faff;
    }
    .quadrant-cows {
      border-top: 4px solid #059669;
      background: #f6fdf9;
    }
    .quadrant-questions {
      border-top: 4px solid #d97706;
      background: #fffdf5;
    }
    .quadrant-dogs {
      border-top: 4px solid #dc2626;
      background: #fef8f8;
    }

    .quadrant-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 7px;
      padding-bottom: 5px;
      border-bottom: 1px solid rgba(0,0,0,0.06);
    }
    .quadrant-title-group {
      display: flex;
      flex-direction: column;
      gap: 1.5px;
    }
    .quadrant-title {
      font-size: 9.6px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      display: flex;
      align-items: center;
      gap: 5px;
      line-height: 1.2;
    }
    .quadrant-subtitle {
      font-size: 7.8px;
      font-weight: 700;
      opacity: 0.82;
      line-height: 1.2;
    }
    .quadrant-stars .quadrant-title { color: #1e40af; }
    .quadrant-stars .quadrant-subtitle { color: #2563eb; }
    .quadrant-cows .quadrant-title { color: #047857; }
    .quadrant-cows .quadrant-subtitle { color: #059669; }
    .quadrant-questions .quadrant-title { color: #b45309; }
    .quadrant-questions .quadrant-subtitle { color: #d97706; }
    .quadrant-dogs .quadrant-title { color: #b91c1c; }
    .quadrant-dogs .quadrant-subtitle { color: #dc2626; }

    .quadrant-tag {
      font-size: 7.5px;
      font-weight: 700;
      padding: 2.5px 7px;
      border-radius: 8px;
      white-space: nowrap;
      flex-shrink: 0;
    }
    .quadrant-stars .quadrant-tag { background: #dbeafe; color: #1e40af; }
    .quadrant-cows .quadrant-tag { background: #d1fae5; color: #047857; }
    .quadrant-questions .quadrant-tag { background: #fef3c7; color: #92400e; }
    .quadrant-dogs .quadrant-tag { background: #fee2e2; color: #991b1b; }

    .dish-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .dish-item {
      background: #ffffff;
      border: 1px solid rgba(0,0,0,0.08);
      border-radius: 5px;
      padding: 6px 9px;
    }
    .dish-top {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: 8px;
      margin-bottom: 2px;
    }
    .dish-name {
      font-size: 8.8px;
      font-weight: 800;
      color: #0f172a;
      flex: 1;
    }
    .dish-metrics {
      font-size: 7.8px;
      font-weight: 700;
      color: #334155;
      white-space: nowrap;
      flex-shrink: 0;
    }
    .dish-action {
      font-size: 7.4px;
      color: #475569;
      line-height: 1.35;
    }
    .dish-note-extra {
      background: #f8fafc;
      border: 1px dashed #cbd5e1;
      border-radius: 4px;
      padding: 5px 8px;
      font-size: 7.4px;
      color: #475569;
      line-height: 1.32;
    }

    /* AI Recommendations Section */
    .ai-container {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 7px;
      padding: 9.5px 13px;
    }
    .ai-grid {
      display: flex;
      flex-direction: column;
      gap: 6.5px;
    }
    .ai-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-left: 4px solid #2563eb;
      border-radius: 5px;
      padding: 6.5px 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
    }
    .ai-card.priority-1 { border-left-color: #2563eb; }
    .ai-card.priority-2 { border-left-color: #059669; }
    .ai-card.priority-3 { border-left-color: #d97706; }

    .ai-card-content {
      flex: 1;
    }
    .ai-card-header {
      display: flex;
      align-items: center;
      gap: 7px;
      margin-bottom: 2px;
    }
    .ai-prio-badge {
      font-size: 7.4px;
      font-weight: 800;
      padding: 2px 6px;
      border-radius: 3px;
      text-transform: uppercase;
      white-space: nowrap;
    }
    .prio-high { background: #dbeafe; color: #1e40af; }
    .prio-medium { background: #fef3c7; color: #92400e; }

    .ai-card-title {
      font-size: 8.8px;
      font-weight: 800;
      color: #0f172a;
    }
    .ai-card-desc {
      font-size: 7.8px;
      color: #475569;
      line-height: 1.35;
    }
    .ai-card-impact {
      min-width: 108px;
      text-align: right;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      padding: 5.5px 9px;
      flex-shrink: 0;
    }
    .ai-impact-val {
      font-size: 13px;
      font-weight: 900;
      color: #059669;
      line-height: 1.1;
    }
    .ai-impact-lbl {
      font-size: 7.2px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
    }

    /* Annual Projections Card */
    .scaling-card {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 6px;
      padding: 9px 13px;
      margin: 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .scaling-left {
      font-size: 8.1px;
      color: #1e40af;
      line-height: 1.4;
    }
    .scaling-left strong {
      color: #0f172a;
    }
    .scaling-badge {
      background: #1e40af;
      color: #ffffff;
      font-weight: 900;
      font-size: 9.5px;
      padding: 4px 11px;
      border-radius: 10px;
      white-space: nowrap;
    }

    /* Executive Commitment & Sign-off Block */
    .signoff-box {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 7px;
      padding: 10.5px 14px;
      margin: 0;
      display: grid;
      grid-template-columns: 1.55fr 1fr;
      gap: 14px;
      align-items: center;
    }
    .signoff-left p {
      margin: 0 0 5px 0;
      font-size: 8px;
      color: #334155;
      line-height: 1.42;
    }
    .signoff-left strong {
      color: #0f172a;
    }
    .cert-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      color: #1e40af;
      padding: 3.5px 9px;
      border-radius: 4px;
      font-size: 7.5px;
      font-weight: 800;
      letter-spacing: 0.3px;
    }
    .signoff-right {
      border-left: 1px solid #cbd5e1;
      padding-left: 14px;
      display: flex;
      flex-direction: column;
      gap: 2.5px;
    }
    .sig-name {
      font-size: 10px;
      font-weight: 900;
      color: #0f172a;
    }
    .sig-role {
      font-size: 8px;
      color: #334155;
      font-weight: 700;
      margin-bottom: 2px;
    }
    .sig-contact {
      font-size: 7.4px;
      color: #64748b;
      line-height: 1.32;
    }
  </style>
</head>
<body>

  <!-- ==================== PAGE 1 ==================== -->
  <div class="page">
    <div class="content-wrap">
      <!-- Top Brand Header -->
      <header class="header-bar">
        <div class="brand-group">
          <div class="logo-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
            </svg>
            FLUXO
          </div>
          <div class="brand-text-block">
            <div class="brand-sub">Gastronomic Intelligence & Operating System</div>
            <div class="brand-sub2">Auditoría Operativa & Consultoría Estratégica de Ingresos</div>
          </div>
        </div>
        <div class="meta-badges">
          <span class="badge-tier">${data.client.planName}</span>
          <span class="badge-period">${data.client.auditMonth} · Auditoría 30 Días</span>
        </div>
      </header>

      <!-- Title & Client Card -->
      <div class="title-block">
        <div class="title-left">
          <h1>Informe Ejecutivo de Rendimiento Operativo & Retorno de Inversión (ROI)</h1>
          <p>Auditoría mensual de 30 días de servicio demostrando eficiencia en sala, KDS en cocina, QR dinámico y rentabilidad neta contrastada.</p>
        </div>
        <div class="client-chip">
          ${data.client.logoUrl ? `<img src="${data.client.logoUrl}" alt="${data.client.name}" class="client-logo" />` : `<div class="client-name">${data.client.name}</div>`}
          <div class="client-loc">${data.client.address}</div>
          <div class="client-status">${data.client.statusP1}</div>
        </div>
      </div>

      <!-- Executive Highlight Callout -->
      <div class="exec-summary-box">
        <strong>Resumen de Impacto Global:</strong> Tras 30 días de implantación del <strong>Plan Full (${data.client.planCost} €/mes)</strong>, ${data.client.name} ha transformado su operativa de sala y cocina, reduciendo tiempos muertos en un 81%, acelerando la rotación de mesas a 1,8x y generando <strong>+2.600 €/mes de ingresos adicionales brutos (+2.501 €/mes netos)</strong>, logrando un <strong>ROI superior a 26x</strong>.
      </div>

      <!-- Key Monthly KPIs -->
      <section class="report-section">
        <div class="section-title"><span class="dot"></span> 1. KPIs Clave de Rendimiento Mensual</div>
        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-label">Facturación Total</div>
            <div class="kpi-value">${data.kpis.totalRevenue}</div>
            <div class="kpi-badge positive">${data.kpis.revenueDelta}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Comandas Procesadas</div>
            <div class="kpi-value">${data.kpis.ordersProcessed}</div>
            <div class="kpi-badge neutral">${data.kpis.ordersPerDay}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Ticket Medio</div>
            <div class="kpi-value">${data.kpis.avgTicket}</div>
            <div class="kpi-badge positive">${data.kpis.avgTicketDelta}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Comensales Totales</div>
            <div class="kpi-value">${data.kpis.totalGuests}</div>
            <div class="kpi-badge neutral">${data.kpis.guestsPerDay}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Rotación de Mesas</div>
            <div class="kpi-value">${data.kpis.turnoverRate}</div>
            <div class="kpi-badge positive">${data.kpis.turnoverDelta}</div>
          </div>
        </div>
      </section>

      <!-- Service Speed Breakdown -->
      <section class="report-section">
        <div class="section-title"><span class="dot"></span> 2. Tiempos de Servicio & Eficiencia en Sala vs Métodos Manuales</div>
        <div class="speed-container">
          <div class="speed-grid">
            <div class="speed-item">
              <div class="speed-header">
                <span class="speed-title">Validación del Mozo</span>
                <span class="speed-delta">${data.speed.waiterReduction}</span>
              </div>
              <div class="speed-main">${data.speed.waiterTime} <span class="speed-main-sub">(reducido de ${data.speed.waiterTimeBefore})</span></div>
              <div class="speed-progress-wrap"><div class="speed-bar" style="width: 19%;"></div></div>
              <div class="speed-desc">El personal aprueba en 1 clic los pedidos QR o comanda al vuelo desde terminal móvil, eliminando desplazamientos repetitivos al TPV central.</div>
            </div>
            <div class="speed-item">
              <div class="speed-header">
                <span class="speed-title">Preparación en Cocina</span>
                <span class="speed-delta">${data.speed.kitchenReduction}</span>
              </div>
              <div class="speed-main">${data.speed.kitchenTime} <span class="speed-main-sub">(media de pase)</span></div>
              <div class="speed-progress-wrap"><div class="speed-bar" style="width: 55%; background: #059669;"></div></div>
              <div class="speed-desc">La pantalla KDS táctil clasifica automáticamente platos por partidas (fogones, plancha, frío), sincronizando tiempos de pase y erradicando extravíos.</div>
            </div>
            <div class="speed-item">
              <div class="speed-header">
                <span class="speed-title">Permanencia por Mesa</span>
                <span class="speed-delta">${data.speed.stayReduction}</span>
              </div>
              <div class="speed-main">${data.speed.stayTimeCurrent} <span class="speed-main-sub">(reducido de ${data.speed.stayTimeBefore})</span></div>
              <div class="speed-progress-wrap"><div class="speed-bar" style="width: 82%; background: #d97706;"></div></div>
              <div class="speed-desc">Tiempo de permanencia reducido en 14 min por mesa: llamada de cuenta digital y datáfono multiplican la capacidad en turnos punta sin presionar.</div>
            </div>
          </div>
        </div>
      </section>

      <!-- Congestion Analysis -->
      <section class="report-section">
        <div class="section-title"><span class="dot"></span> 3. Análisis de Franjas Horarias & Congestión de Sala</div>
        <div class="congestion-container">
          <div class="congestion-bars">
            <div class="bar-lunch" title="Almuerzo ${data.congestion.lunchPct}">Almuerzo ${data.congestion.lunchPct}</div>
            <div class="bar-dinner" title="Cenas ${data.congestion.dinnerPct}">Cenas ${data.congestion.dinnerPct}</div>
            <div class="bar-other" title="Fuera de pico ${data.congestion.otherPct}">${data.congestion.otherPct}</div>
          </div>
          <div class="congestion-grid">
            <div class="congestion-card">
              <div class="congestion-card-header">
                <span class="congestion-name">Servicio Almuerzo</span>
                <span class="congestion-pct">${data.congestion.lunchPct} del volumen</span>
              </div>
              <div class="congestion-time">Franja pico: ${data.congestion.lunchWindow} (Pico: ${data.congestion.lunchPeak}) · ${data.congestion.lunchOrders}</div>
              <div class="congestion-notes">Concentración máxima en salón interior. El sistema Gatekeeper absorbió hasta 12 comandas simultáneas sin saturar fogones ni retrasar el ritmo de pase.</div>
            </div>
            <div class="congestion-card">
              <div class="congestion-card-header">
                <span class="congestion-name">Servicio Cenas</span>
                <span class="congestion-pct">${data.congestion.dinnerPct} del volumen</span>
              </div>
              <div class="congestion-time">Franja pico: ${data.congestion.dinnerWindow} (Pico: ${data.congestion.dinnerPeak}) · ${data.congestion.dinnerOrders}</div>
              <div class="congestion-notes">Fuerte peso en terraza exterior. El auto-pedido QR capturó un 34% de comandas directas, liberando al mozo para hospitalidad y reposición rápida.</div>
            </div>
            <div class="congestion-card">
              <div class="congestion-card-header">
                <span class="congestion-name">Tardeo & Cafetería</span>
                <span class="congestion-pct">${data.congestion.otherPct} del volumen</span>
              </div>
              <div class="congestion-time">Fuera de hora pico · ${data.congestion.otherOrders}</div>
              <div class="congestion-notes">Rotación fluida y ágil de tapas, cafés y bebidas de sobremesa con tiempos medios de respuesta inferiores a 3 minutos.</div>
            </div>
          </div>
        </div>
      </section>

      <!-- Financial ROI Balance Section -->
      <section class="report-section">
        <div class="section-title"><span class="dot"></span> 4. Balance Financiero Directo & Retorno de Inversión (ROI)</div>
        <div class="roi-hero">
          <div class="roi-hero-top">
            <div class="roi-hero-title">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
              </svg>
              Retorno Neto de Inversión · Cuota Plan Full ${data.client.planCost} €/mes
            </div>
            <div class="roi-multiplier">${data.roi.multiplier} · Retorno Comprobado</div>
          </div>
          <div class="roi-hero-grid">
            <div class="roi-box">
              <div class="roi-box-label">Ventas QR Incrementales</div>
              <div class="roi-box-val">${data.roi.qrIncremental}</div>
              <div class="roi-box-sub">Segundas rondas bebidas (second rounds) + dessert upselling en carta digital</div>
            </div>
            <div class="roi-box">
              <div class="roi-box-label">Ganancia por Rotación</div>
              <div class="roi-box-val">${data.roi.turnoverGains}</div>
              <div class="roi-box-sub">+14 min/mesa = capacidad extra para atender más clientes en horas punta</div>
            </div>
            <div class="roi-box">
              <div class="roi-box-label">Suscripción Plan Full</div>
              <div class="roi-box-val">${data.roi.subscriptionCost}</div>
              <div class="roi-box-sub">Tarifa fija todo incluido sin comisiones variables por comanda</div>
            </div>
            <div class="roi-net-box">
              <div class="roi-box-label">Beneficio Neto Mensual</div>
              <div class="roi-box-val">${data.roi.netProfit}</div>
              <div class="roi-box-sub">Total ganancias: ${data.roi.totalGross} contra ${data.roi.subscriptionCost} coste</div>
            </div>
          </div>
        </div>

        <div class="roi-explanation">
          <strong>Direct Financial ROI Balance:</strong> Los ingresos incrementales por auto-servicio QR (second rounds + dessert upselling = <strong>1.480 €/mes</strong>) sumados a las ganancias por rotación de mesas (<strong>1.120 €/mes</strong>) alcanzan un impacto bruto total de <strong>+2.600 €/mes</strong>. Frente al coste de <strong>99 €/mes</strong> del Plan Full, la rentabilidad neta es superior a <strong>26x (ROI > 26x)</strong>, amortizándose la cuota en los primeros 36 minutos de cada mes.
        </div>
      </section>
    </div>

    <!-- Page 1 Footer -->
    <footer class="page-footer">
      <div class="footer-left">RestoBar Noia · Rúa do Curro, Noia · Auditoría Certificada Fluxo Gastronomic System</div>
      <div class="footer-right">Página 1 de 2</div>
    </footer>
  </div>

  <!-- ==================== PAGE 2 ==================== -->
  <div class="page">
    <div class="content-wrap">
      <!-- Top Brand Header -->
      <header class="header-bar">
        <div class="brand-group">
          <div class="logo-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
            </svg>
            FLUXO
          </div>
          <div class="brand-text-block">
            <div class="brand-sub">Menu Engineering Matrix & AI Actionable Insights</div>
            <div class="brand-sub2">Diagnóstico de Carta, Escandallos & Revenue Hospitality</div>
          </div>
        </div>
        <div class="meta-badges">
          <span class="badge-tier">${data.client.planName}</span>
          <span class="badge-period">Optimización · ${data.client.optimizationMonth}</span>
        </div>
      </header>

      <!-- Title Block -->
      <div class="title-block">
        <div class="title-left">
          <h1>Ingeniería de Menú (Matriz BCG) & Motor de Recomendaciones IA</h1>
          <p>Diagnóstico de rentabilidad unitaria vs volumen de ventas para maximizar el margen de cocina y agilizar la mise en place.</p>
        </div>
        <div class="client-chip">
          ${data.client.logoUrl ? `<img src="${data.client.logoUrl}" alt="${data.client.name}" class="client-logo" />` : `<div class="client-name">${data.client.name}</div>`}
          <div class="client-loc">Auditoría de Carta · 30 Días</div>
          <div class="client-status">${data.client.statusP2}</div>
        </div>
      </div>

      <!-- BCG Matrix Section -->
      <section class="report-section">
        <div class="section-title"><span class="dot"></span> 1. BCG Menu Matrix · Rentabilidad vs Popularidad de Platos</div>
        <div class="matrix-container">
          
          <!-- Stars -->
          <div class="quadrant quadrant-stars">
            <div>
              <div class="quadrant-header">
                <div class="quadrant-title-group">
                  <span class="quadrant-title">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                    </svg>
                    Stars
                  </span>
                  <span class="quadrant-subtitle">(Alta venta, alto margen)</span>
                </div>
                <span class="quadrant-tag">Proteger & Destacar</span>
              </div>
              <div class="dish-list">
                <div class="dish-item">
                  <div class="dish-top">
                    <span class="dish-name">Zamburiñas de la Ría</span>
                    <span class="dish-metrics">284 raciones · Margen 74% · 16,50 €</span>
                  </div>
                  <div class="dish-action">Plato insignia de alta demanda. Mantener estándar de frescura máxima y preservar lugar preferente en la cabecera de la carta digital QR.</div>
                </div>
                <div class="dish-item">
                  <div class="dish-top">
                    <span class="dish-name">Pulpo á Feira</span>
                    <span class="dish-metrics">242 raciones · Margen 68% · 19,00 €</span>
                  </div>
                  <div class="dish-action">Pilar indiscutible del ticket medio. Altísima repetición y excelente índice de recomendación entre comensales locales y visitantes.</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Cash Cows -->
          <div class="quadrant quadrant-cows">
            <div>
              <div class="quadrant-header">
                <div class="quadrant-title-group">
                  <span class="quadrant-title">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                      <circle cx="12" cy="12" r="10"></circle>
                      <path d="M12 6v6l4 2"></path>
                    </svg>
                    Cash Cows
                  </span>
                  <span class="quadrant-subtitle">(Alto volumen, margen estable)</span>
                </div>
                <span class="quadrant-tag">Base Operativa</span>
              </div>
              <div class="dish-list">
                <div class="dish-item">
                  <div class="dish-top">
                    <span class="dish-name">Raxo con patatas</span>
                    <span class="dish-metrics">310 raciones · Margen 52% · 12,00 €</span>
                  </div>
                  <div class="dish-action">Líder en volumen diario. Preparación ultrarrápida (&lt; 6 min en partida fogones/plancha) y gran aporte a la rotación ágil del mediodía.</div>
                </div>
                <div class="dish-item">
                  <div class="dish-top">
                    <span class="dish-name">Pimientos de Padrón</span>
                    <span class="dish-metrics">265 raciones · Margen 58% · 7,50 €</span>
                  </div>
                  <div class="dish-action">Acompañamiento estrella de gran margen predecible con coste de producción bajo y mínima carga de manipulación en cocina.</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Question Marks -->
          <div class="quadrant quadrant-questions">
            <div>
              <div class="quadrant-header">
                <div class="quadrant-title-group">
                  <span class="quadrant-title">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                      <circle cx="12" cy="12" r="10"></circle>
                      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                      <line x1="12" y1="17" x2="12.01" y2="17"></line>
                    </svg>
                    Question Marks / Opportunities
                  </span>
                  <span class="quadrant-subtitle">(Alto margen, baja rotación)</span>
                </div>
                <span class="quadrant-tag">Potencial a Activar</span>
              </div>
              <div class="dish-list">
                <div class="dish-item">
                  <div class="dish-top">
                    <span class="dish-name">Arroz caldoso de bogavante</span>
                    <span class="dish-metrics">48 raciones · Margen 72% · 26,00 €/pax</span>
                  </div>
                  <div class="dish-action"><strong>Plan de acción:</strong> Potenciar sugerencia en sala por parte de los camareros al sentar mesas y fijar badge <em>"Recomendación del Chef"</em> en el menú digital para elevar ventas a 85 raciones/mes (+960 € de margen neto).</div>
                </div>
                <div class="dish-note-extra">
                  <strong>Estrategia operativa:</strong> Pre-elaboración de fondo de marisco concentrado para acortar cocción de 24 a 16 min y sincronizar pase con platos rápidos.
                </div>
              </div>
            </div>
          </div>

          <!-- Dogs -->
          <div class="quadrant quadrant-dogs">
            <div>
              <div class="quadrant-header">
                <div class="quadrant-title-group">
                  <span class="quadrant-title">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="15" y1="9" x2="9" y2="15"></line>
                      <line x1="9" y1="9" x2="15" y2="15"></line>
                    </svg>
                    Dogs
                  </span>
                  <span class="quadrant-subtitle">(Baja rotación, alto coste de mise en place)</span>
                </div>
                <span class="quadrant-tag">Reformular o Retirar</span>
              </div>
              <div class="dish-list">
                <div class="dish-item">
                  <div class="dish-top">
                    <span class="dish-name">Plato a reformular o retirar de carta: Cazuela de rape</span>
                    <span class="dish-metrics">14 raciones · Margen 38% · 21,50 €</span>
                  </div>
                  <div class="dish-action"><strong>Dictamen técnico:</strong> Baja rotación y alto coste de mise en place por pescado perecedero. Recomendación: retirar de carta diaria y ofrecer únicamente como sugerencia de fin de semana bajo encargo.</div>
                </div>
                <div class="dish-note-extra">
                  <strong>Impacto en mermas:</strong> La desprogramación de este ítem del mise en place diario erradica 220 €/mes en merma directa de producto fresco.
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      <!-- AI Actionable Insights Section -->
      <section class="report-section">
        <div class="section-title"><span class="dot"></span> 2. AI Recommendations Engine · 3 Concrete, Prioritized Action Items</div>
        <div class="ai-container">
          <div class="ai-grid">
            
            <!-- Recommendation 1 -->
            <div class="ai-card priority-1">
              <div class="ai-card-content">
                <div class="ai-card-header">
                  <span class="ai-prio-badge prio-high">Acción 1 · Operativa</span>
                  <span class="ai-card-title">Staff adjustment during Sunday lunch rush (14:30 - 15:45)</span>
                </div>
                <div class="ai-card-desc">Reasignar 1 mozo de apoyo de barra exclusivamente al pase y cobro en terraza durante el pico dominical de 75 minutos, mitigando el 46% de demoras y acelerando la rotación de mesas.</div>
              </div>
              <div class="ai-card-impact">
                <div class="ai-impact-val">+420 €/mes</div>
                <div class="ai-impact-lbl">+0,3x rotación extra</div>
              </div>
            </div>

            <!-- Recommendation 2 -->
            <div class="ai-card priority-2">
              <div class="ai-card-content">
                <div class="ai-card-header">
                  <span class="ai-prio-badge prio-high">Acción 2 · Comercial</span>
                  <span class="ai-card-title">Push second drinks on terrace after 25 min</span>
                </div>
                <div class="ai-card-desc">Activar notificación contextual sutil en la carta QR a los 25 min de estancia: <em>"¿Desea otra consumición o aperitivo para acompañar?"</em>, impulsando el consumo voluntario en mesas exteriores.</div>
              </div>
              <div class="ai-card-impact">
                <div class="ai-impact-val">+680 €/mes</div>
                <div class="ai-impact-lbl">+190 consumiciones</div>
              </div>
            </div>

            <!-- Recommendation 3 -->
            <div class="ai-card priority-3">
              <div class="ai-card-content">
                <div class="ai-card-header">
                  <span class="ai-prio-badge prio-medium">Acción 3 · Pricing</span>
                  <span class="ai-card-title">Tweak pricing on star appetizers (+0,70 € a +0,80 €)</span>
                </div>
                <div class="ai-card-desc">Actualizar PVP en Zamburiñas (16,50 € -> 17,20 €) y Pulpo á Feira (19,00 € -> 19,80 €). La elasticidad de la demanda es menor al 0,12 debido a su condición de reclamos gastronómicos consolidados.</div>
              </div>
              <div class="ai-card-impact">
                <div class="ai-impact-val">+390 €/mes</div>
                <div class="ai-impact-lbl">100% margen neto</div>
              </div>
            </div>

          </div>
        </div>
      </section>

      <!-- Annual Scaling Callout -->
      <div class="scaling-card">
        <div class="scaling-left">
          <strong>Escalabilidad Anualizada con IA:</strong> Sumando las 3 recomendaciones de IA (${data.roi.annualAiRecommendations}) al beneficio actual (${data.roi.netProfit}), ${data.client.name} proyecta <strong>${data.roi.projectedMonthlyTotal} netos (${data.roi.projectedAnnualTotal})</strong> con una cuota anual de ${data.roi.annualSubscriptionCost}.
        </div>
        <div class="scaling-badge">ROI Anual > 40x</div>
      </div>

      <!-- Executive Commitment & Sign-off Block -->
      <div class="signoff-box">
        <div class="signoff-left">
          <p><strong>Certificación de Retorno Comercial:</strong> La implantación de Fluxo Plan Full (${data.client.planCost} €/mes) en ${data.client.name} generó <strong>${data.roi.totalGross}</strong> de rendimiento bruto y <strong>${data.roi.netProfit} netos</strong>. Con las 3 recomendaciones de IA implementadas, el beneficio mensual ascenderá a <strong>${data.roi.projectedMonthlyTotal}</strong> (${data.roi.projectedAnnualTotal} proyectados).</p>
          <div class="cert-badge">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            </svg>
            AUDITORÍA CERTIFICADA POR FLUXO GASTRONOMIC SYSTEM · LICENCIA ${data.signoff.licenseCode}
          </div>
        </div>
        <div class="signoff-right">
          <div class="sig-name">${data.signoff.signatory}</div>
          <div class="sig-role">${data.signoff.role}</div>
          <div class="sig-contact">${data.signoff.contactEmail} · ${data.signoff.website}<br/>Soporte 24/7 Red Gallega Hostelería Digital</div>
        </div>
      </div>
    </div>

    <!-- Page 2 Footer -->
    <footer class="page-footer">
      <div class="footer-left">${data.client.name} · ${(data.client.address || '').split(' (')[0]} · Executive Sign-off & Contact Block · Certified by Fluxo Gastronomic System</div>
      <div class="footer-right">Página 2 de 2</div>
    </footer>
  </div>

</body>
</html>`;
}

/**
 * Applies clean PDF document metadata via Python PyMuPDF.
 * This guarantees enterprise-grade PDF properties without encoding glitches.
 */
function enrichPdfMetadata(pdfPath, data = DEFAULT_REPORT_DATA) {
  try {
    const clientName = (data?.client?.name || 'RestoBar Noia').replace(/'/g, "\\'");
    const normalized = pdfPath.replace(/\\/g, '/');
    const title = `Informe Ejecutivo - ${clientName} - Fluxo Gastronomic System`;
    const pythonOneLiner = `import fitz, os; p = '${normalized}'; p_tmp = p + '.tmp'; doc = fitz.open(p); doc.set_metadata({'title': '${title}', 'author': 'Fluxo Gastronomic System', 'subject': 'Informe Ejecutivo y Comercial de Rendimiento Operativo y Retorno de Inversión (ROI)', 'keywords': 'Fluxo, ${clientName}, ROI, Rendimiento Operativo, Matriz BCG, Hostelería, Plan Full', 'creator': 'Fluxo Intelligence & Operating System', 'producer': 'Fluxo Certified PDF Engine'}); doc.save(p_tmp, deflate=True); doc.close(); os.replace(p_tmp, p)`;
    execSync(`python -c "${pythonOneLiner}"`, { stdio: 'ignore' });
  } catch (err) {
    console.warn(`[WARN] Metadata enrichment failed for ${pdfPath}:`, err.message);
  }
}

/**
 * Main PDF Generation Entry Point.
 */
export async function generateExecutiveReport(inputData = DEFAULT_REPORT_DATA) {
  const data = mergeWithDefaults(DEFAULT_REPORT_DATA, inputData);
  console.log(`Iniciando generación de PDF ejecutivo para ${data.client.name}...`);

  // Ensure workspace destination directory exists
  const docsDir = path.dirname(WORKSPACE_DEST);
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }

  // Resolve all desktop destinations dynamically
  const desktopDestinations = resolveDesktopDestinations();
  for (const dest of desktopDestinations) {
    const dir = path.dirname(dest);
    if (!fs.existsSync(dir)) {
      try {
        fs.mkdirSync(dir, { recursive: true });
      } catch {
        // Best effort for unprivileged / detached paths
      }
    }
  }

  const htmlContent = buildReportHtml(data);

  // Render via headless Chromium with strict print parameters
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.setContent(htmlContent, { waitUntil: 'networkidle' });

  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: {
      top: 0,
      bottom: 0,
      left: 0,
      right: 0
    }
  });

  await browser.close();

  // 1. Write to Workspace
  fs.writeFileSync(WORKSPACE_DEST, pdfBuffer);
  enrichPdfMetadata(WORKSPACE_DEST, data);
  const finalWsSize = fs.statSync(WORKSPACE_DEST).size;
  console.log(`[OK] Guardado en Workspace: ${WORKSPACE_DEST} (${finalWsSize} bytes)`);

  // 2. Read enriched buffer to ensure byte-exact synchronization
  const enrichedBuffer = fs.readFileSync(WORKSPACE_DEST);

  // 3. Write to all resolved Desktop destinations
  let primaryWritten = false;
  for (const dest of desktopDestinations) {
    try {
      fs.writeFileSync(dest, enrichedBuffer);
      console.log(`[OK] Guardado en Destino Escritorio: ${dest} (${enrichedBuffer.length} bytes)`);
      if (path.normalize(dest).toLowerCase() === path.normalize(PRIMARY_DESKTOP_DEST).toLowerCase()) {
        primaryWritten = true;
      }
    } catch (err) {
      console.warn(`[WARN] No se pudo escribir en ${dest}:`, err.message);
    }
  }

  if (!primaryWritten && fs.existsSync(PRIMARY_DESKTOP_DEST)) {
    primaryWritten = true;
  }
  if (!primaryWritten) {
    throw new Error(`Failed to write to primary Desktop destination: ${PRIMARY_DESKTOP_DEST}`);
  }

  console.log('Generación completada con éxito.');
  return {
    workspacePath: WORKSPACE_DEST,
    desktopPaths: desktopDestinations,
    byteSize: enrichedBuffer.length,
  };
}

// Execute if run directly from CLI
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename)) {
  generateExecutiveReport().catch((err) => {
    console.error('Error generando el PDF:', err);
    process.exit(1);
  });
}
