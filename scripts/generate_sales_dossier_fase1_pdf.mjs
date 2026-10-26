import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Target destinations for the generated PDF
const WORKSPACE_DEST = path.resolve(__dirname, '../docs/Dossier_Estrategico_Ventas_Fase_1_Fluxo.pdf');
const DESKTOP_DEST = 'C:/Users/mima7/OneDrive/Escritorio/Dossier_Estrategico_Ventas_Fase_1_Fluxo.pdf';
const DOWNLOADS_DEST = 'C:/Users/mima7/Downloads/Dossier_Estrategico_Ventas_Fase_1_Fluxo.pdf';

const htmlContent = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Fluxo — Dossier Estratégico & Manual Ejecutivo de Ventas (Fase 1)</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=Outfit:wght@600;700;800;900&family=Inter:wght@400;500;600;700&display=swap');

    @page {
      size: A4 portrait;
      margin: 0;
    }

    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      background-color: #f1f5f9;
      color: #0f172a;
      font-family: 'Plus Jakarta Sans', sans-serif;
      -webkit-font-smoothing: antialiased;
      line-height: 1.35;
    }

    @media print {
      body {
        background: transparent !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      .page {
        page-break-after: always !important;
        break-after: page !important;
      }
      .page:last-child {
        page-break-after: avoid !important;
        break-after: avoid !important;
      }
    }

    /* A4 EXACT CONTAINER (210mm x 297mm) */
    .page {
      width: 210mm;
      height: 297mm;
      max-height: 297mm;
      min-height: 297mm;
      padding: 10mm 13mm 9mm 13mm;
      margin: 0 auto;
      background: #ffffff;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
      overflow: hidden;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    /* Top Brand Bar */
    .header-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 6px;
      margin-bottom: 7px;
    }

    .brand-group {
      display: flex;
      align-items: center;
      gap: 9px;
    }

    .logo-container {
      display: flex;
      align-items: center;
      gap: 7px;
    }

    .brand-title {
      font-family: 'Outfit', sans-serif;
      font-size: 14px;
      font-weight: 900;
      letter-spacing: 0.5px;
      color: #0f172a;
      line-height: 1;
    }

    .brand-sub {
      font-size: 8px;
      font-weight: 700;
      color: #2563eb;
      text-transform: uppercase;
      letter-spacing: 0.8px;
    }

    .header-badges {
      display: flex;
      gap: 6px;
      align-items: center;
    }

    .badge-pill {
      font-size: 7.5px;
      font-weight: 800;
      padding: 2.5px 8px;
      border-radius: 999px;
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }

    .badge-blue {
      background: #eff6ff;
      color: #1d4ed8;
      border: 1px solid #bfdbfe;
    }

    .badge-slate {
      background: #f8fafc;
      color: #334155;
      border: 1px solid #cbd5e1;
    }

    /* Page Footer */
    .footer-bar {
      border-top: 1px solid #cbd5e1;
      padding-top: 5px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 7.5px;
      color: #64748b;
      margin-top: 5px;
    }

    .footer-left {
      font-weight: 600;
    }

    .footer-right {
      font-weight: 800;
      color: #0f172a;
    }

    /* Page 1: Hero / Header Block */
    .hero-box {
      background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%);
      color: #ffffff;
      border-radius: 9px;
      padding: 13px 16px;
      margin-bottom: 9px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: relative;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }

    .hero-title-group h1 {
      font-family: 'Outfit', sans-serif;
      font-size: 15.5px;
      font-weight: 900;
      letter-spacing: -0.3px;
      line-height: 1.2;
      margin-bottom: 3px;
    }

    .hero-title-group p {
      font-size: 8.8px;
      color: #93c5fd;
      font-weight: 500;
      line-height: 1.35;
    }

    .hero-tag {
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(4px);
      border: 1px solid rgba(255, 255, 255, 0.25);
      color: #ffffff;
      font-size: 8px;
      font-weight: 800;
      padding: 5px 10px;
      border-radius: 8px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      text-align: center;
      white-space: nowrap;
    }

    /* Metrics Strip */
    .metrics-strip {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      margin-bottom: 9px;
    }

    .metric-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 7px;
      padding: 8px 10px;
      text-align: center;
    }

    .metric-value {
      font-family: 'Outfit', sans-serif;
      font-size: 16px;
      font-weight: 900;
      color: #1e3a8a;
      line-height: 1;
      margin-bottom: 2px;
    }

    .metric-label {
      font-size: 7.2px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }

    /* Section Component */
    .section-title {
      font-family: 'Outfit', sans-serif;
      font-size: 10.5px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      color: #0f172a;
      margin-bottom: 6px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .section-title .dot {
      width: 6px;
      height: 6px;
      background: #2563eb;
      border-radius: 50%;
    }

    /* Card Box */
    .card-box {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 7px;
      padding: 9px 12px;
      margin-bottom: 8px;
    }

    .card-box-accent {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
    }

    .card-box-emerald {
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
    }

    .card-box-amber {
      background: #fffbeb;
      border: 1px solid #fde68a;
    }

    /* 2-Column Grid */
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 9px;
      margin-bottom: 8px;
    }

    .grid-3 {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      margin-bottom: 8px;
    }

    /* Stepper / Timeline */
    .stepper {
      display: flex;
      flex-direction: column;
      gap: 7px;
    }

    .step-item {
      display: flex;
      gap: 9px;
      align-items: flex-start;
    }

    .step-num {
      width: 18px;
      height: 18px;
      background: #2563eb;
      color: #ffffff;
      font-size: 8.5px;
      font-weight: 900;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      margin-top: 1px;
    }

    .step-content h4 {
      font-size: 8.8px;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 1px;
    }

    .step-content p {
      font-size: 7.8px;
      color: #475569;
      line-height: 1.35;
    }

    /* Comparison Table */
    .table-compact {
      width: 100%;
      border-collapse: collapse;
      font-size: 7.8px;
      margin-bottom: 7px;
    }

    .table-compact th {
      background: #0f172a;
      color: #ffffff;
      text-align: left;
      padding: 5px 7px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }

    .table-compact td {
      padding: 4.5px 7px;
      border-bottom: 1px solid #e2e8f0;
      vertical-align: middle;
    }

    .table-compact tr:nth-child(even) td {
      background: #f8fafc;
    }

    .badge-check {
      color: #059669;
      font-weight: 800;
    }

    .badge-cross {
      color: #dc2626;
      font-weight: 800;
    }

    /* Script Block */
    .script-quote {
      background: #f8fafc;
      border-left: 3px solid #2563eb;
      padding: 6px 10px;
      font-size: 8.2px;
      color: #1e293b;
      font-style: italic;
      line-height: 1.4;
      border-radius: 0 5px 5px 0;
      margin-top: 4px;
    }

    .script-quote strong {
      color: #0f172a;
      font-style: normal;
    }

    /* Objection Card */
    .obj-card {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 6.5px 9px;
      margin-bottom: 5px;
    }

    .obj-header {
      display: flex;
      justify-content: space-between;
      font-size: 8px;
      font-weight: 800;
      color: #dc2626;
      margin-bottom: 2px;
    }

    .obj-resp {
      font-size: 7.8px;
      color: #334155;
      line-height: 1.35;
    }

    .obj-resp strong {
      color: #059669;
    }

    /* Priority Target Table */
    .target-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 7.5px;
    }

    .target-table th {
      background: #1e3a8a;
      color: #ffffff;
      padding: 4.5px 6px;
      text-align: left;
      font-weight: 800;
      text-transform: uppercase;
    }

    .target-table td {
      padding: 4.5px 6px;
      border-bottom: 1px solid #cbd5e1;
      vertical-align: middle;
    }

    .target-table tr:hover td {
      background: #eff6ff;
    }

    .score-badge {
      background: #dbeafe;
      color: #1e40af;
      font-weight: 900;
      padding: 1.5px 5px;
      border-radius: 4px;
      font-size: 7.5px;
    }
  </style>
</head>
<body>

  <!-- ==================== PÁGINA 1: PORTADA & MODELO SERVICE-AS-A-SOFTWARE ==================== -->
  <div class="page">
    <div>
      <!-- Brand Header -->
      <header class="header-bar">
        <div class="brand-group">
          <!-- Inverted Official Logo -->
          <svg width="24" height="24" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="fluxoFGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#2563EB" />
                <stop offset="55%" stop-color="#1D4ED8" />
                <stop offset="100%" stop-color="#0284C7" />
              </linearGradient>
            </defs>
            <rect width="64" height="64" rx="16" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="2.5"/>
            <path d="M23 48V16H45 M23 31H38" stroke="url(#fluxoFGrad1)" stroke-width="8.5" stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="39" cy="46" r="4.2" fill="#0284C7" />
          </svg>
          <div class="logo-container">
            <span class="brand-title">FLUXO</span>
            <span class="brand-sub">Sistema Gastronómico</span>
          </div>
        </div>
        <div class="header-badges">
          <span class="badge-pill badge-blue">Dossier Estratégico · Fase 1</span>
          <span class="badge-pill badge-slate">Piloto Noia & Barbanza</span>
        </div>
      </header>

      <!-- Hero Header -->
      <div class="hero-box">
        <div class="hero-title-group">
          <h1>Manual Ejecutivo de Promoción y Venta en Hostelería</h1>
          <p>Estrategia del "Caballo de Troya" (Carta Digital 39€) · Service-as-a-Software · Cierre de los Primeros Clientes</p>
        </div>
        <div class="hero-tag">
          Desafío Terraza<br>14 Días a 0€
        </div>
      </div>

      <!-- Key Metrics Strip -->
      <div class="metrics-strip">
        <div class="metric-card">
          <div class="metric-value">39 €/mes</div>
          <div class="metric-label">Cuota Entrada Plan Carta</div>
        </div>
        <div class="metric-card">
          <div class="metric-value">24 Horas</div>
          <div class="metric-label">Digitalización Completa</div>
        </div>
        <div class="metric-card">
          <div class="metric-value">0,4 Seg</div>
          <div class="metric-label">Carga Carta Móvil</div>
        </div>
        <div class="metric-card">
          <div class="metric-value">90 Seg</div>
          <div class="metric-label">Abordaje en Frío</div>
        </div>
      </div>

      <!-- Tesis Central: Service-as-a-Software -->
      <div class="section-title">
        <span class="dot"></span> 1. La Tesis Central: Service-as-a-Software (Sequoia Capital / DEC-34)
      </div>
      <div class="card-box card-box-accent">
        <p style="font-size: 8.5px; color: #1e3a8a; line-height: 1.45;">
          <strong>El código dejó de ser una barrera de entrada:</strong> La inteligencia artificial permite generar software a una velocidad sin precedentes, pero el hostelero de a pie <strong>rechaza de plano sentarse frente a un panel de control vacío</strong> a recortar fotos, escribir descripciones o configurar alérgenos. Trabaja 14 horas diarias y no quiere tareas para casa. El mercado de servicios es <strong>6 veces mayor</strong> que el de software puro: el hostelero no compra una herramienta; <strong>compra el problema 100% resuelto</strong>.
        </p>
      </div>

      <!-- Los 4 Pilares del Modelo -->
      <div class="grid-2">
        <div class="card-box">
          <h4 style="font-size: 9px; font-weight: 800; color: #0f172a; margin-bottom: 3px;">A. La Carta como Ariete (Cero Fricción)</h4>
          <p style="font-size: 7.8px; color: #475569; line-height: 1.35;">
            No cambiamos la rutina del camarero ni tocamos la cocina de entrada. Reemplazamos la carta de papel desgastada y el PDF borroso por una web que carga en 0,4 segundos con fotos en alta definición y reseñas 5★ en Google Maps.
          </p>
        </div>
        <div class="card-box">
          <h4 style="font-size: 9px; font-weight: 800; color: #0f172a; margin-bottom: 3px;">B. Servicio Hecho para Ti (Cero Trabajo)</h4>
          <p style="font-size: 7.8px; color: #475569; line-height: 1.35;">
            El hostelero solo envía una foto de su carta física por WhatsApp. Nosotros usamos nuestro importador con IA para entregársela maquetada, con alérgenos oficiales y fotos profesionales en menos de 24 horas.
          </p>
        </div>
        <div class="card-box">
          <h4 style="font-size: 9px; font-weight: 800; color: #0f172a; margin-bottom: 3px;">C. El Setup de 149€ como Consultoría</h4>
          <p style="font-size: 7.8px; color: #475569; line-height: 1.35;">
            La cuota de alta no se cobra por "activar una cuenta", sino por digitalización profesional y entrega del kit físico. Al bonificarlo al 100% en el piloto de 14 días, el hostelero percibe que le regalamos un servicio de 150€.
          </p>
        </div>
        <div class="card-box">
          <h4 style="font-size: 9px; font-weight: 800; color: #0f172a; margin-bottom: 3px;">D. El Foso Operativo Inexpugnable</h4>
          <p style="font-size: 7.8px; color: #475569; line-height: 1.35;">
            Una agencia de marketing o un bot se cancelan en un clic. Pero cuando el restaurante escala al Comandero de sala y la Cocina KDS de Fluxo, el sistema se vuelve indispensable: quitarlo un viernes significaría volver al caos de tickets perdidos.
          </p>
        </div>
      </div>

      <!-- Resumen de Objetivos de Fase 1 -->
      <div class="card-box card-box-emerald">
        <h4 style="font-size: 8.8px; font-weight: 800; color: #065f46; margin-bottom: 2px;">🎯 Meta de la Fase 1 en Noia (Próximos 15-30 Días)</h4>
        <p style="font-size: 7.8px; color: #047857; line-height: 1.35;">
          Conseguir entre <strong>2 y 3 locales piloto activos</strong> en Noia mediante el Desafío de 14 Días a 0€, certificar el incremento de reseñas de 5★ en Google Maps y convertir los primeros <strong>120€ a 300€ de MRR recurrente</strong> antes de expandir a la comarca del Barbanza.
        </p>
      </div>
    </div>

    <!-- Footer -->
    <footer class="footer-bar">
      <span class="footer-left">Fluxo Gastronomic System · Dossier Estratégico de Promoción y Venta</span>
      <span class="footer-right">Página 1 de 4</span>
    </footer>
  </div>

  <!-- ==================== PÁGINA 2: ESCALERA MODULAR & COMPARATIVA ==================== -->
  <div class="page">
    <div>
      <!-- Brand Header -->
      <header class="header-bar">
        <div class="brand-group">
          <svg width="24" height="24" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="fluxoFGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#2563EB" />
                <stop offset="55%" stop-color="#1D4ED8" />
                <stop offset="100%" stop-color="#0284C7" />
              </linearGradient>
            </defs>
            <rect width="64" height="64" rx="16" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="2.5"/>
            <path d="M23 48V16H45 M23 31H38" stroke="url(#fluxoFGrad2)" stroke-width="8.5" stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="39" cy="46" r="4.2" fill="#0284C7" />
          </svg>
          <div class="logo-container">
            <span class="brand-title">FLUXO</span>
            <span class="brand-sub">Escalera Modular de Producto</span>
          </div>
        </div>
        <div class="header-badges">
          <span class="badge-pill badge-blue">Estrategia Comercial</span>
          <span class="badge-pill badge-slate">DEC-06 / DEC-28</span>
        </div>
      </header>

      <!-- Section Title -->
      <div class="section-title">
        <span class="dot"></span> 2. La Escalera de Valor Modular: De la Carta al Salón Completo
      </div>

      <!-- 4 Tiers of Product -->
      <div class="grid-2" style="margin-bottom: 8px;">
        <div class="card-box card-box-accent">
          <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 2px;">
            <span style="font-size: 8px; font-weight: 800; color: #1d4ed8; text-transform: uppercase;">Nivel 1 · Caballo de Troya</span>
            <span style="font-size: 13px; font-weight: 900; color: #1e3a8a;">39 €<span style="font-size: 8px; font-weight: 600;">/mes</span></span>
          </div>
          <h4 style="font-size: 9.5px; font-weight: 800; color: #0f172a; margin-bottom: 3px;">Plan Carta (Entrada Fría)</h4>
          <p style="font-size: 7.6px; color: #334155; line-height: 1.35;">
            Carta QR ultraligera (&lt;1s), fotos HD, selector de 10 idiomas oficiales, declaración obligatoria de 14 alérgenos UE y Google Review Booster de 5★ al pedir la cuenta. Incluye digitalización en 24h y hasta 4 cambios al mes.
          </p>
        </div>

        <div class="card-box">
          <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 2px;">
            <span style="font-size: 8px; font-weight: 800; color: #0284c7; text-transform: uppercase;">Nivel 2 · Optimización Sala</span>
            <span style="font-size: 13px; font-weight: 900; color: #0284c7;">69 €<span style="font-size: 8px; font-weight: 600;">/mes</span></span>
          </div>
          <h4 style="font-size: 9.5px; font-weight: 800; color: #0f172a; margin-bottom: 3px;">Plan Sala (Ahorro de Pasos)</h4>
          <p style="font-size: 7.6px; color: #334155; line-height: 1.35;">
            Todo lo anterior + <strong>Llamador en 1 Toque</strong> (pedir cuenta con datáfono o efectivo) + <strong>Comandero Móvil del Camarero</strong>. El camarero ahorra el 50% de los paseos en vacío (4 km/turno) y rota mesas 10 min antes.
          </p>
        </div>

        <div class="card-box">
          <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 2px;">
            <span style="font-size: 8px; font-weight: 800; color: #059669; text-transform: uppercase;">Nivel 3 · Sincronización Total</span>
            <span style="font-size: 13px; font-weight: 900; color: #059669;">99 €<span style="font-size: 8px; font-weight: 600;">/mes</span></span>
          </div>
          <h4 style="font-size: 9.5px; font-weight: 800; color: #0f172a; margin-bottom: 3px;">Plan Full (Cocina KDS)</h4>
          <p style="font-size: 7.6px; color: #334155; line-height: 1.35;">
            Todo lo anterior + <strong>Monitor de Cocina KDS por turnos</strong> (Pase 1 Entradas, Pase 2 Principales bloqueados y Postres retenidos) + gestión de platos agotados en 1 toque y soporte para tiqueteras térmicas ESC/POS.
          </p>
        </div>

        <div class="card-box">
          <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 2px;">
            <span style="font-size: 8px; font-weight: 800; color: #7c3aed; text-transform: uppercase;">Nivel 4 · Fidelización & CRM</span>
            <span style="font-size: 13px; font-weight: 900; color: #7c3aed;">139 €<span style="font-size: 8px; font-weight: 600;">/mes</span></span>
          </div>
          <h4 style="font-size: 9.5px; font-weight: 800; color: #0f172a; margin-bottom: 3px;">Plan Suite (Retención Máxima)</h4>
          <p style="font-size: 7.6px; color: #334155; line-height: 1.35;">
            Todo lo anterior + módulo "El Habitual" (repetir lo de siempre en 1 toque), tarjeta de 8 sellos digitales sin descargar apps, alertas de clientes habituales inactivos (&gt;30 días) y reporte mensual de rentabilidad.
          </p>
        </div>
      </div>

      <!-- Comparativa: Software Puro vs Service-as-a-Software -->
      <div class="section-title">
        <span class="dot"></span> 3. Tabla Comparativa: Software Tradicional vs. Enfoque Fluxo
      </div>
      <table class="table-compact">
        <thead>
          <tr>
            <th>Dimensión Operativa</th>
            <th>Software TPV / Carta Típico (LaCarta, Pikotea)</th>
            <th>Modelo Fluxo (Service-as-a-Software)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Configuración de la Carta</strong></td>
            <td><span class="badge-cross">❌ El hostelero tiene que subir sus 60 platos</span></td>
            <td><span class="badge-check">✅ Nosotros la maquetamos en 24h desde una foto</span></td>
          </tr>
          <tr>
            <td><strong>Tiempo de Carga en Terraza</strong></td>
            <td><span class="badge-cross">❌ PDFs pesados de 20-40 MB o webs lentas</span></td>
            <td><span class="badge-check">✅ Carga instantánea en 0,4 segundos sin descargas</span></td>
          </tr>
          <tr>
            <td><strong>Barrera de Hardware</strong></td>
            <td><span class="badge-cross">❌ Obligan a comprar pantallas de 1.500€</span></td>
            <td><span class="badge-check">✅ Funciona en cualquier móvil o tablet existente</span></td>
          </tr>
          <tr>
            <td><strong>Captación de Reseñas</strong></td>
            <td><span class="badge-cross">❌ Nula o mediante códigos QR secundarios</span></td>
            <td><span class="badge-check">✅ Google Review Booster integrado al pedir la cuenta</span></td>
          </tr>
          <tr>
            <td><strong>Cumplimiento Fiscal</strong></td>
            <td><span class="badge-cross">❌ Riesgos de certificación Veri*Factu en su TPV</span></td>
            <td><span class="badge-check">✅ Capa de sala independiente (cero riesgo fiscal)</span></td>
          </tr>
        </tbody>
      </table>

      <!-- Jordan Belfort Triad -->
      <div class="section-title" style="margin-top: 6px;">
        <span class="dot"></span> 4. La Tríada de Valor en Hostelería (Jordan Belfort / Wolf of Wall Street)
      </div>
      <div class="grid-3">
        <div class="card-box" style="text-align: center;">
          <div style="font-size: 14px; margin-bottom: 2px;">⚡</div>
          <strong style="font-size: 8.5px; color: #0f172a; display: block;">1. Solución a un Dolor</strong>
          <span style="font-size: 7.2px; color: #64748b; line-height: 1.3;">Elimina el estrés de mesas esperando la cuenta y platos agotados no avisados.</span>
        </div>
        <div class="card-box" style="text-align: center;">
          <div style="font-size: 14px; margin-bottom: 2px;">⏱️</div>
          <strong style="font-size: 8.5px; color: #0f172a; display: block;">2. Conveniencia Total</strong>
          <span style="font-size: 7.2px; color: #64748b; line-height: 1.3;">Ahorra 4 km de caminatas vacías por turno al camarero sin cambiar su caja.</span>
        </div>
        <div class="card-box" style="text-align: center;">
          <div style="font-size: 14px; margin-bottom: 2px;">⭐</div>
          <strong style="font-size: 8.5px; color: #0f172a; display: block;">3. Experiencia de Marca</strong>
          <span style="font-size: 7.2px; color: #64748b; line-height: 1.3;">Fotos HD tentadoras que aumentan el ticket medio y disparan reseñas de 5★.</span>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <footer class="footer-bar">
      <span class="footer-left">Fluxo Gastronomic System · Dossier Estratégico de Promoción y Venta</span>
      <span class="footer-right">Página 2 de 4</span>
    </footer>
  </div>

  <!-- ==================== PÁGINA 3: SCRIPT DE 90s & DERRIBO DE OBJECIONES ==================== -->
  <div class="page">
    <div>
      <!-- Brand Header -->
      <header class="header-bar">
        <div class="brand-group">
          <svg width="24" height="24" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="fluxoFGrad3" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#2563EB" />
                <stop offset="55%" stop-color="#1D4ED8" />
                <stop offset="100%" stop-color="#0284C7" />
              </linearGradient>
            </defs>
            <rect width="64" height="64" rx="16" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="2.5"/>
            <path d="M23 48V16H45 M23 31H38" stroke="url(#fluxoFGrad3)" stroke-width="8.5" stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="39" cy="46" r="4.2" fill="#0284C7" />
          </svg>
          <div class="logo-container">
            <span class="brand-title">FLUXO</span>
            <span class="brand-sub">Manual de Prospección de Calle</span>
          </div>
        </div>
        <div class="header-badges">
          <span class="badge-pill badge-blue">Script de 90 Segundos</span>
          <span class="badge-pill badge-slate">Horas Valle</span>
        </div>
      </header>

      <!-- Section Title -->
      <div class="section-title">
        <span class="dot"></span> 5. Protocolo de Abordaje a Pie de Calle: El Guión de 90 Segundos
      </div>

      <!-- Script Steps -->
      <div class="card-box" style="margin-bottom: 7px;">
        <div class="stepper">
          <div class="step-item">
            <div class="step-num">1</div>
            <div class="step-content">
              <h4>Identificación y Desarme (15 segundos)</h4>
              <p>Entrar en hora valle (11:15-12:15 o 17:15-18:15). Hablar con quien gestione la sala con máxima empatía:</p>
              <div class="script-quote">
                "Hola [Nombre], sé que estáis preparando el servicio y no te voy a robar más de dos minutos. Soy Emiliano, desarrollador de aquí de la zona. <strong>No vengo a venderte ningún programa complicado que tus camareros odien</strong> ni a cambiar tu forma de trabajar."
              </div>
            </div>
          </div>

          <div class="step-item">
            <div class="step-num">2</div>
            <div class="step-content">
              <h4>La Pregunta del Dolor Visible (20 segundos)</h4>
              <p>Conectar directamente con la fricción cotidiana de los clientes con la carta:</p>
              <div class="script-quote">
                "Te hago solo una pregunta: ¿cuántos clientes se sientan en tu terraza y les cuesta leer la carta en papel desgastada, o tienen que abrir un PDF borroso que tarda en descargar y tienen que ampliar con los dedos?"
              </div>
            </div>
          </div>

          <div class="step-item">
            <div class="step-num">3</div>
            <div class="step-content">
              <h4>Demostración Pantalla a Pantalla en Vivo (30 segundos)</h4>
              <p>Sacar el teléfono móvil con la carta de Fluxo cargada al instante (Efecto Dotación):</p>
              <div class="script-quote">
                "Mira esto 10 segundos en mi pantalla: <strong>abre en medio segundo, las fotos se ven en pantalla completa</strong>, está en 10 idiomas para turistas y tiene los alérgenos al día. Y lo mejor: al pedir la cuenta, les invita a <strong>dejarte 5 estrellas en Google Maps</strong>."
              </div>
            </div>
          </div>

          <div class="step-item">
            <div class="step-num">4</div>
            <div class="step-content">
              <h4>El Cierre al Desafío de 14 Días a 0€ (25 segundos)</h4>
              <p>Eliminar todo el riesgo financiero y operativo en una sola frase:</p>
              <div class="script-quote">
                "No te pido que compres nada. Me mandas ahora una foto de tu carta por WhatsApp, nosotros te la digitalizamos en 24 horas y te traigo 5 soportes para tu terraza. <strong>Lo pruebas dos fines de semana gratis</strong>. Si el lunes no ves que tus clientes están encantados y suben tus reseñas, me llevo los códigos a coste cero."
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Section Title -->
      <div class="section-title">
        <span class="dot"></span> 6. Derribo Quirúrgico de las 4 Objeciones Críticas de Noia
      </div>

      <!-- 4 Objections Cards -->
      <div class="obj-card">
        <div class="obj-header">
          <span>❌ Objeción 1: "Ya nos dio el código QR gratis el Ayuntamiento o la cervecera"</span>
          <span style="color: #64748b;">PDF Mudo vs Carta Interactiva</span>
        </div>
        <div class="obj-resp">
          <strong>Respuesta:</strong> "Claro, para un PDF estático vale el del Concello. Pero un PDF tarda en descargar, no se lee bien y no te sube las reseñas en Google. Esto es una carta con fotos reales que abre al segundo y te llena la ficha de Google de 5 estrellas."
        </div>
      </div>

      <div class="obj-card">
        <div class="obj-header">
          <span>❌ Objeción 2: "Aquí vienen los vecinos de siempre, ya saben lo que toman"</span>
          <span style="color: #64748b;">Finde Lleno vs Martes Tranquilo</span>
        </div>
        <div class="obj-resp">
          <strong>Respuesta:</strong> "A los clientes de toda la vida se les atiende de viva voz como siempre. Esto es para las familias, parejas y gente de fuera que viene el fin de semana y quiere ver fotos antes de pedir, para que decidan antes y roten más rápido."
        </div>
      </div>

      <div class="obj-card">
        <div class="obj-header">
          <span>❌ Objeción 3: "No tengo tiempo para cargar fotos ni configurar un programa"</span>
          <span style="color: #64748b;">Service-as-a-Software</span>
        </div>
        <div class="obj-resp">
          <strong>Respuesta:</strong> "Es que tú no vas a tocar una sola tecla. Me pasas una foto de la carta física por WhatsApp y nosotros te la dejamos montada y lista mañana por la mañana en tu local. Tú solo atiendes clientes; la carga la hacemos nosotros."
        </div>
      </div>

      <div class="obj-card">
        <div class="obj-header">
          <span>❌ Objeción 4: "Mis camareros llevan años con papel y no se van a aclarar"</span>
          <span style="color: #64748b;">Cero Resistencia de Sala</span>
        </div>
        <div class="obj-resp">
          <strong>Respuesta:</strong> "Precisamente por eso empezamos solo con la carta digital: tus camareros siguen tomando la nota exactamente igual que hoy. Lo único que cambia es que el cliente ya sabe lo que quiere cuando llega el camarero porque vio la foto."
        </div>
      </div>

      <!-- WhatsApp Post-Visit Template -->
      <div class="card-box card-box-accent" style="margin-top: 5px;">
        <h4 style="font-size: 8.5px; font-weight: 800; color: #1e3a8a; margin-bottom: 2px;">📲 Plantilla WhatsApp para Enviar a las 2 Horas de la Visita</h4>
        <p style="font-size: 7.6px; color: #334155; font-family: monospace; background: #ffffff; padding: 4px 7px; border-radius: 4px; border: 1px solid #bfdbfe;">
          "Hola [Nombre], un placer saludarte antes en [Nombre Local]. Ya tenemos tu local en cola para dejarte la carta lista para el Desafío de 14 días a 0€. Pásame por aquí una foto de tu carta física o de la pizarra y mañana te traigo la muestra para las 5 mesas. ¡A lucir esos platos este finde! 🚀"
        </p>
      </div>
    </div>

    <!-- Footer -->
    <footer class="footer-bar">
      <span class="footer-left">Fluxo Gastronomic System · Dossier Estratégico de Promoción y Venta</span>
      <span class="footer-right">Página 3 de 4</span>
    </footer>
  </div>

  <!-- ==================== PÁGINA 4: CRM NOIA & HOJA DE RUTA CONVERSIÓN ==================== -->
  <div class="page">
    <div>
      <!-- Brand Header -->
      <header class="header-bar">
        <div class="brand-group">
          <svg width="24" height="24" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="fluxoFGrad4" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#2563EB" />
                <stop offset="55%" stop-color="#1D4ED8" />
                <stop offset="100%" stop-color="#0284C7" />
              </linearGradient>
            </defs>
            <rect width="64" height="64" rx="16" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="2.5"/>
            <path d="M23 48V16H45 M23 31H38" stroke="url(#fluxoFGrad4)" stroke-width="8.5" stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="39" cy="46" r="4.2" fill="#0284C7" />
          </svg>
          <div class="logo-container">
            <span class="brand-title">FLUXO</span>
            <span class="brand-sub">Ruta de Campo & Conversión</span>
          </div>
        </div>
        <div class="header-badges">
          <span class="badge-pill badge-blue">CRM Táctico Noia</span>
          <span class="badge-pill badge-slate">Top 6 Peatonal</span>
        </div>
      </header>

      <!-- Section Title -->
      <div class="section-title">
        <span class="dot"></span> 7. CRM de Ataque Inmediato: Los 6 Primeros Locales en Noia (&lt;4 min a pie)
      </div>

      <!-- Target Table -->
      <table class="target-table" style="margin-bottom: 8px;">
        <thead>
          <tr>
            <th>#</th>
            <th>Local Prioritario</th>
            <th>Ubicación</th>
            <th>Google</th>
            <th>Dolor Real Detectado</th>
            <th>Ángulo Exacto de Entrada</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><span class="score-badge">9.6</span></td>
            <td><strong>Tapería Adega do Pazo</strong></td>
            <td>Cantón, 17</td>
            <td>4.3★ (1.2k)</td>
            <td>3 terrazas en distintas plantas (mesas ciegas).</td>
            <td>Carta rápida para turistas + evitar viajes a ciegas.</td>
          </tr>
          <tr>
            <td><span class="score-badge">9.4</span></td>
            <td><strong>Pizzería Mamma Mía</strong></td>
            <td>Fray Lois, 8</td>
            <td>4.3★ (100)</td>
            <td>20 mesas en terraza exterior y web actual rota.</td>
            <td>Reemplazar su web WordPress caída por carta en 0,4s.</td>
          </tr>
          <tr>
            <td><span class="score-badge">8.8</span></td>
            <td><strong>Cervexería Equs</strong></td>
            <td>Alameda, 12</td>
            <td>4.0★ (589)</td>
            <td>Terraza amplia de 18 mesas en la Alameda.</td>
            <td>Fotos reales para que decidan antes de pedir rondas.</td>
          </tr>
          <tr>
            <td><span class="score-badge">8.6</span></td>
            <td><strong>La Parra Tapería</strong></td>
            <td>Cantón, 26</td>
            <td>4.5★ (200)</td>
            <td>Mesas ciegas tras las columnas de soportales.</td>
            <td>Carta interactiva para mesas ocultas bajo arcos de piedra.</td>
          </tr>
          <tr>
            <td><span class="score-badge">8.5</span></td>
            <td><strong>Casa Mar da Vila</strong></td>
            <td>Porta da Vila, 6</td>
            <td>4.1★ (150)</td>
            <td>3 zonas separadas (calle, acristalada y jardín).</td>
            <td>Sustituir el visor pasivo de Ágora por carta con fotos HD.</td>
          </tr>
          <tr>
            <td><span class="score-badge">8.0</span></td>
            <td><strong>Babilonia Brunch</strong></td>
            <td>Cantón, 8</td>
            <td>4.4★ (2.5k IG)</td>
            <td>Sin reservas, colas en calle y carta muy visual.</td>
            <td>Rotar mesas 10 min antes y lucir repostería artesanal.</td>
          </tr>
        </tbody>
      </table>

      <!-- The Napkin Math (ROI) -->
      <div class="card-box card-box-emerald" style="margin-bottom: 8px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px;">
          <h4 style="font-size: 9px; font-weight: 800; color: #065f46;">🧮 La Cuenta de la Servilleta (El Argumento Financiero Irrefutable)</h4>
          <span style="font-size: 8px; font-weight: 800; background: #a7f3d0; color: #064e3b; padding: 2px 6px; border-radius: 4px;">ROI Demostrable</span>
        </div>
        <p style="font-size: 7.8px; color: #047857; line-height: 1.4;">
          • Cuota mensual de entrada (Plan Carta): <strong>39 €/mes</strong> (~1,30 €/día, menos de un café solo).<br>
          • Mesa media en terraza (4 comensales x 20 €): <strong>80 € de ticket medio</strong>.<br>
          • Con que la carta con fotos y la rapidez de servicio haga rotar <strong>1 sola mesa extra al mes</strong>, el local ingresa <strong>+80 €</strong> brutos y ya pagó el mes entero con beneficio limpio. Con 1 mesa extra a la semana, ingresa <strong>+320 €/mes limpios</strong>.
        </p>
      </div>

      <!-- Roadmap 14 Days -->
      <div class="section-title">
        <span class="dot"></span> 8. Cronograma del Desafío de 14 Días: Del Piloto al Contrato
      </div>

      <div class="grid-3" style="margin-bottom: 4px;">
        <div class="card-box" style="padding: 7px 9px;">
          <strong style="font-size: 8px; color: #1e3a8a; display: block; margin-bottom: 2px;">Día 1: Instalación Rápida</strong>
          <p style="font-size: 7.2px; color: #475569; line-height: 1.3;">
            Entrega de 5 soportes para las mesas seleccionadas. Explicación de 3 minutos al personal de sala.
          </p>
        </div>
        <div class="card-box" style="padding: 7px 9px;">
          <strong style="font-size: 8px; color: #0284c7; display: block; margin-bottom: 2px;">Día 7: Primer Chequeo</strong>
          <p style="font-size: 7.2px; color: #475569; line-height: 1.3;">
            Mensaje de WhatsApp para verificar fluidez del primer fin de semana y ajustar platos si fuera necesario.
          </p>
        </div>
        <div class="card-box" style="padding: 7px 9px;">
          <strong style="font-size: 8px; color: #059669; display: block; margin-bottom: 2px;">Día 14: Cierre & Formalización</strong>
          <p style="font-size: 7.2px; color: #475569; line-height: 1.3;">
            Presentación de aperturas y nuevas reseñas de 5★ captadas en Google Maps. Activación de la cuota de 39€/mes.
          </p>
        </div>
      </div>

      <!-- Next Step Call to Action -->
      <div class="card-box card-box-accent" style="text-align: center; padding: 7px 10px;">
        <span style="font-size: 8.5px; font-weight: 800; color: #1e3a8a;">
          🚀 Siguiente Paso Operativo: Salir a pie de calle en Noia en el próximo horario valle (11:15-12:15 o 17:15-18:15)
        </span>
      </div>
    </div>

    <!-- Footer -->
    <footer class="footer-bar">
      <span class="footer-left">Fluxo Gastronomic System · Dossier Estratégico de Promoción y Venta</span>
      <span class="footer-right">Página 4 de 4</span>
    </footer>
  </div>

</body>
</html>
`;

async function main() {
  console.log('🚀 Iniciando compilador de PDF para el Dossier Estratégico de Ventas (Fase 1)...');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.setContent(htmlContent, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);

  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: {
      top: '0mm',
      bottom: '0mm',
      left: '0mm',
      right: '0mm',
    },
    preferCSSPageSize: true,
  });

  await browser.close();

  const destinations = [
    WORKSPACE_DEST,
    DESKTOP_DEST,
    DOWNLOADS_DEST
  ];

  console.log('📦 Guardando PDF en destinos autorizados...');
  for (const dest of destinations) {
    try {
      const dir = path.dirname(dest);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(dest, pdfBuffer);
      console.log('   ✅ Guardado exitosamente en:', dest);
    } catch (e) {
      console.warn('   ⚠️ No se pudo guardar en:', dest, '(' + e.message + ')');
    }
  }

  console.log('🎉 Dossier PDF generado con éxito. Tamaño total:', pdfBuffer.length, 'bytes');
}

main().catch((err) => {
  console.error('❌ Error fatal al generar el dossier PDF:', err);
  process.exit(1);
});
