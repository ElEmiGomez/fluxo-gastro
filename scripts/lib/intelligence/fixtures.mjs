/**
 * Fixtures de alta fidelidad y datos consolidados del mercado gastronómico B2B (España & Galicia 2026).
 * Utilizado por el motor de rastreo para análisis y contingencia offline.
 */

export const MOCK_MARKET_INTELLIGENCE_FIXTURES = {
  competitors: [
    {
      competitorName: 'Qamarero (QR Payments S.L.)',
      entryPriceMonthly: 119,
      recommendedPlanMonthly: 189,
      setupFee: 299,
      transactionCommissionPct: 1.5,
      fixedCommissionPerTicket: 0.15,
      requiresPosReplacement: true,
      hasGatekeeperValidation: false,
      kdsSupported: false,
      escPosPrintingSupported: false,
      whatsappBotIncluded: false,
      weakPoints: [
        'Exige sustitución completa del TPV existente del restaurante (inversión de hasta 8.000€).',
        'Comisión transaccional obligatoria sobre cada ticket cobrado vía QR.',
        'Sin filtro de validación de mozo: vulnerable a comandas fantasma y bromas desde la calle.',
        'Lead magnet agresivo en analiza.qamarero.com infundiendo miedo por pérdida de reseñas en Google.'
      ],
      fluxoAdvantage: 'Plan Full 99€/mes plano, 0% comisiones, NO toques tu TPV, Mozo Gatekeeper (pending_validation), Google Review Booster nativo en 1 toque.',
      notes: 'Respaldado por Enisa y CaixaBank DayOne. Caso de campo detectado en Galicia: Vía Trajano Burgers en Santiago de Compostela.'
    },
    {
      competitorName: 'Pikotea / MyChefTool',
      entryPriceMonthly: 59,
      recommendedPlanMonthly: 99,
      setupFee: 199,
      transactionCommissionPct: 0.0,
      fixedCommissionPerTicket: 0.0,
      requiresPosReplacement: true,
      hasGatekeeperValidation: false,
      kdsSupported: true,
      escPosPrintingSupported: true,
      whatsappBotIncluded: false,
      weakPoints: [
        'Suite TPV monolítica con gestión de stock e inventarios compleja y pesada.',
        'Curva de aprendizaje empinada; resistencia frontal de camareros veteranos.',
        'Migración contable traumática que paraliza la operativa del local varios días.'
      ],
      fluxoAdvantage: 'Despliegue express en 24h, sin migración contable ni tocar el TPV, interfaz ergonómica de 1 toque diseñada para mozos de terraza.',
      notes: 'Fuerte penetración en restaurantes gastronómicos tradicionales con carta cerrada.'
    },
    {
      competitorName: 'Sunday / Chew',
      entryPriceMonthly: 0,
      recommendedPlanMonthly: 0,
      setupFee: 0,
      transactionCommissionPct: 1.8,
      fixedCommissionPerTicket: 0.20,
      requiresPosReplacement: false,
      hasGatekeeperValidation: false,
      kdsSupported: false,
      escPosPrintingSupported: false,
      whatsappBotIncluded: false,
      weakPoints: [
        'Modelo basado 100% en capturar comisiones bancarias por cada pago en mesa.',
        'Excluye cobros en efectivo y crea fricción con los datáfonos habituales del banco.',
        'El comensal percibe un sobrecoste o propina forzada al pagar con Apple Pay / Google Pay.'
      ],
      fluxoAdvantage: '0% comisiones bancarias. Llamador con intención para cobro con datáfono del local (request_bill_card) o efectivo (request_bill_cash).',
      notes: 'Enfoque en cadenas de restauración organizada de alta rotación urbana.'
    },
    {
      competitorName: 'Last.app / Agora / Revo / Glop',
      entryPriceMonthly: 39,
      recommendedPlanMonthly: 89,
      setupFee: 250,
      transactionCommissionPct: 0.0,
      fixedCommissionPerTicket: 0.0,
      requiresPosReplacement: true,
      hasGatekeeperValidation: false,
      kdsSupported: true,
      escPosPrintingSupported: true,
      whatsappBotIncluded: false,
      weakPoints: [
        'Cobro modular abusivo: KDS, comandero de mozo y módulos extra se pagan por separado (+30€/mes cada uno).',
        'Dependencia de hardware específico o licencias por pantalla.',
        'Soporte técnico saturado en horas punta de fin de semana.'
      ],
      fluxoAdvantage: 'Plan Full 99€ TODO INCLUIDO (Carta QR + Comandero Mozo + KDS Cocina >70px + Impresoras Térmicas ESC/POS) sin costes ocultos.',
      notes: 'Presencia consolidada en Galicia mediante distribuidores locales de maquinaria hostelera.'
    },
    {
      competitorName: 'Toast / Square for Restaurants',
      entryPriceMonthly: 0,
      recommendedPlanMonthly: 69,
      setupFee: 0,
      transactionCommissionPct: 2.2,
      fixedCommissionPerTicket: 0.10,
      requiresPosReplacement: true,
      hasGatekeeperValidation: false,
      kdsSupported: true,
      escPosPrintingSupported: true,
      whatsappBotIncluded: false,
      weakPoints: [
        'Ecosistema cerrado norteamericano: obliga a utilizar sus datáfonos propietarios.',
        'Condiciones bancarias leoninas sin posibilidad de negociar comisiones con banca española.',
        'Falta de adaptación a la idiosincrasia del tapeo y terraza gallega.'
      ],
      fluxoAdvantage: 'Compatibilidad total con cualquier banco español, datáfono o TPV existente. Diseñado específicamente para terrazas de 10 a 40 mesas.',
      notes: 'Intentos de penetración en Madrid y Barcelona con ofertas de TPV a 0€ de alta vinculación.'
    }
  ],

  normativeAlerts: [
    {
      regulationName: 'Reglamento Veri*Factu (RD 1007/2023 & Ley 11/2021)',
      jurisdiction: 'Espana_General',
      enforcementDeadline: '2027-01-01 (Sociedades) / 2027-07-01 (Autónomos)',
      impactLevel: 'CRITICAL',
      affectedActor: 'restaurant_company',
      sanctionRiskText: 'Multas de hasta 50.000€ por ejercicio por software no certificado o de doble uso (cajas B).',
      fluxoStrategicAdvantage: 'Fluxo se posiciona como acelerador de sala/terraza independiente que NO reemplaza el TPV contable, blindando al hostelero contra riesgos de homologación.'
    },
    {
      regulationName: 'TicketBAI (Exclusividad Foral Euskadi y Navarra)',
      jurisdiction: 'Galicia',
      enforcementDeadline: 'No aplica en Galicia',
      impactLevel: 'INFO',
      affectedActor: 'freelance_hostelero',
      sanctionRiskText: 'Confusión de mercado: competidores venden adaptaciones de TicketBAI en Galicia donde no tiene validez legal.',
      fluxoStrategicAdvantage: 'Claridad pedagógica: en Galicia aplica exclusivamente Veri*Factu; Fluxo evita costes innecesarios a sus clientes gallegos.'
    },
    {
      regulationName: 'Ley Crea y Crece (Facturación Electrónica B2B)',
      jurisdiction: 'Espana_General',
      enforcementDeadline: '2026-2027',
      impactLevel: 'HIGH',
      affectedActor: 'restaurant_company',
      sanctionRiskText: 'Obligatoriedad de emitir facturas en formato estructurado (FacturaE, UBL) para transacciones entre empresas.',
      fluxoStrategicAdvantage: 'Integración y compatibilidad con formatos estándar de facturación B2B para suscripciones transparentes.'
    },
    {
      regulationName: 'Reforma Laboral 37,5 Horas y Registro Horario Digital',
      jurisdiction: 'Espana_General',
      enforcementDeadline: '2026-Q4',
      impactLevel: 'HIGH',
      affectedActor: 'restaurant_company',
      sanctionRiskText: 'Inspecciones de trabajo con sanciones de hasta 7.500€ por horas extra no registradas e incremento de costes laborales del 6-8%.',
      fluxoStrategicAdvantage: 'La reducción de hasta un 50% en los kilómetros caminados por camarero permite cubrir el mismo volumen de terraza con menor sobrecarga horaria.'
    },
    {
      regulationName: 'Reglamento Europeo 1169/2011 sobre Alérgenos',
      jurisdiction: 'UE',
      enforcementDeadline: 'Vigente (Inspecciones Activas)',
      impactLevel: 'HIGH',
      affectedActor: 'freelance_hostelero',
      sanctionRiskText: 'Sanciones sanitarias de 3.000€ a 600.000€ por falta de declaración de los 14 alérgenos principales.',
      fluxoStrategicAdvantage: 'El Plan Carta (39€) y superiores incluyen etiquetado normativo de alérgenos y filtros para celíacos/intolerantes de forma automática.'
    }
  ],

  floorOpsMetrics: {
    avgWaiterKmPerShiftBaseline: 14.5,
    avgWaiterKmSavedPerShift: 6.8,
    avgWaiterKmSavedPct: 47,
    avgBillWaitMinutesBaseline: 11.2,
    avgBillWaitMinutesWithFluxo: 1.5,
    avgBillWaitMinutesReductionPct: 86,
    tableTurnoverIncreasePct: 18,
    extraRevenuePerTableWeeklyEur: 80,
    netMonthlyGainFromExtraTableEur: 320,
    kdsIndustrialButtonMinPx: 72,
    escPosDefaultWidthCol: 42
  },

  gastroAiTrends: [
    {
      topic: 'Chatbots de Reservas WhatsApp 24/7 (0% Comisiones)',
      description: 'Automatización de reservas directas por WhatsApp sincronizadas con el plano de mesas, eliminando el peaje de 2€-3€ por comensal de plataformas agregadoras.',
      targetPlan: 'Plan Suite (139€/mes)'
    },
    {
      topic: 'Ingeniería de Menú Asistida por IA & Neuromarketing Sensorial',
      description: 'Optimización de cartas mediante matriz BCG (platos estrella vs dilema) y descripciones gastronómicas que aumentan el ticket medio entre un 8% y un 15%.',
      targetPlan: 'Plan Suite (139€/mes)'
    },
    {
      topic: 'Telemetría de Tiempos de Pase en Cocina',
      description: 'Detección en tiempo real de cuellos de botella entre comanda enviada (pending) y pase completado (ready), alertando de retrasos en partidas críticas.',
      targetPlan: 'Plan Suite (139€/mes)'
    },
    {
      topic: 'Google Review Booster y Marcado Schema.org Semántico',
      description: 'Captura orgánica de reseñas de 5 estrellas al solicitar la cuenta con redirección en 1 toque y marcado semántico para indexación en Google Search/Maps.',
      targetPlan: 'Plan Carta (39€/mes) y superiores'
    }
  ],

  galiciaOpportunities: [
    {
      region: 'Noia (Casco Histórico & Paseo Marítimo)',
      phase: 'Fase 2 (Piloto Noia)',
      context: 'Terrazas de 15 a 35 mesas con alta tensión de servicio durante los fines de semana y dificultad extrema para contratar refuerzos de sala.',
      hook: 'Piloto en 5 mesas de terraza para el Desafío Terraza de 14 días sin coste ni compromiso.',
      recommendedPlan: 'Plan Sala (69€) o Plan Full (99€)'
    },
    {
      region: 'Comarca de Barbanza (Ribeira, Boiro, Pobra do Caramiñal)',
      phase: 'Fase 3 (Barbanza)',
      context: 'Gran concentración de marisquerías y taperías de temporada de verano/otoño con distancias largas entre barra y terrazas exteriores.',
      hook: 'Ahorro de más de 6 km diarios por camarero y cobro directo con datáfono en una sola salida.',
      recommendedPlan: 'Plan Full (99€/mes con KDS o tiquetera térmica)'
    },
    {
      region: 'Santiago de Compostela (Zona Centro & Rúa do Franco / Rúa de Traxano)',
      phase: 'Fase 4 (Santiago)',
      context: 'Intensa prospección de competidores (caso Vía Trajano con Qamarero). Hosteleros saturados de propuestas con comisiones y TPVs caros.',
      hook: 'Mismo beneficio de reputación y velocidad sin pagar comisiones por ticket ni cambiar de TPV contable.',
      recommendedPlan: 'Plan Full (99€) o Plan Suite (139€)'
    }
  ],

  rawSampleNews: [
    {
      quadrant: 'competitors',
      title: 'Qamarero intensifica su expansión en Galicia tras captar fondos de Enisa y CaixaBank',
      sourceUrl: 'https://www.hosteleriadigital.es/noticias/qamarero-expansion-galicia-tpv-2026',
      sourceName: 'Hostelería Digital España',
      sourceType: 'press_rss',
      publicationDate: '2026-08-30',
      rawSnippet: 'La startup QR Payments S.L. acelera la venta de su TPV unificado en Santiago de Compostela y A Coruña con una cuota media de 189€/mes y comisiones por cobro.',
      extractedText: 'Qamarero promueve su plataforma analizadora de reseñas como gancho comercial para sustituir cajas registradoras tradicionales en locales del noroeste.',
      locationScope: 'Galicia',
      relevanceScore: 0.95
    },
    {
      quadrant: 'normative',
      title: 'Hacienda ratifica el calendario Veri*Factu: las empresas deberán certificar software en 2027',
      sourceUrl: 'https://www.boe.es/diario_boe/txt.php?id=BOE-A-2023-22234-verifactu',
      sourceName: 'Boletín Oficial del Estado / AEAT',
      sourceType: 'boe_dog_gazette',
      publicationDate: '2026-08-28',
      rawSnippet: 'El Real Decreto 1007/2023 exige encadenamiento hash e inalterabilidad. Las empresas de hostelería tienen como límite el 1 de enero de 2027.',
      extractedText: 'Los fabricantes no pueden comercializar sistemas no adaptados desde julio de 2025. Sanciones de 50.000 euros para TPVs con doble contabilidad.',
      locationScope: 'Espana',
      relevanceScore: 0.98
    },
    {
      quadrant: 'floor_ops',
      title: 'La escasez de camareros en las Rías Baixas y Barbanza obliga a reducir mesas en fin de semana',
      sourceUrl: 'https://www.lavozdegalicia.es/noticia/galicia/hosteleria-personal-terrazas-2026',
      sourceName: 'La Voz de Galicia - Economía y Hostelería',
      sourceType: 'press_rss',
      publicationDate: '2026-08-29',
      rawSnippet: 'Asociaciones de hostelería alertan de que la falta de personal cualificado limita la capacidad de servicio en terrazas exteriores de 20 a 40 mesas.',
      extractedText: 'Los trayectos duplicados para solicitar la cuenta y llevar el datáfono retrasan la rotación de mesas hasta 15 minutos en horas punta.',
      locationScope: 'Galicia',
      relevanceScore: 0.92
    },
    {
      quadrant: 'gastro_ai',
      title: 'El auge de los chatbots de WhatsApp para reservas gastronómicas sin pagar comisiones por comensal',
      sourceUrl: 'https://www.gastrotrends.es/tecnologia/ia-reservas-whatsapp-restaurantes-2026',
      sourceName: 'GastroTrends Magazine',
      sourceType: 'web_search',
      publicationDate: '2026-08-31',
      rawSnippet: 'Los restaurantes buscan alternativas a las plataformas tradicionales que cobran 2-3€ por reserva, apostando por agentes conversacionales integrados.',
      extractedText: 'La sincronización de WhatsApp Business API con el plano de mesas optimiza la ocupación de turnos sin penalizar el margen del hostelero.',
      locationScope: 'Internacional',
      relevanceScore: 0.88
    }
  ]
};
