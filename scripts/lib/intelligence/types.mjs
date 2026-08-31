/**
 * Definición de tipos y contratos para el Motor de Inteligencia de Mercado Fluxo.
 * @typedef {'competitors' | 'normative' | 'floor_ops' | 'gastro_ai'} QuadrantType
 * @typedef {'web_search' | 'press_rss' | 'boe_dog_gazette' | 'competitor_scrape' | 'mock_simulation'} MarketSourceType
 * 
 * @typedef {Object} RawMarketItem
 * @property {string} id
 * @property {QuadrantType} quadrant
 * @property {string} title
 * @property {string} sourceUrl
 * @property {string} sourceName
 * @property {MarketSourceType} sourceType
 * @property {string} publicationDate
 * @property {string} rawSnippet
 * @property {string} extractedText
 * @property {'Galicia' | 'Espana' | 'Internacional'} locationScope
 * @property {number} relevanceScore
 * @property {string} dedupFingerprint
 * 
 * @typedef {Object} CompetitorPricingSnapshot
 * @property {string} competitorName
 * @property {number} entryPriceMonthly
 * @property {number} recommendedPlanMonthly
 * @property {number} setupFee
 * @property {number} transactionCommissionPct
 * @property {number} fixedCommissionPerTicket
 * @property {boolean} requiresPosReplacement
 * @property {boolean} hasGatekeeperValidation
 * @property {boolean} kdsSupported
 * @property {boolean} escPosPrintingSupported
 * @property {boolean} whatsappBotIncluded
 * @property {string[]} weakPoints
 * @property {string} fluxoAdvantage
 * @property {string} notes
 * 
 * @typedef {Object} NormativeAlert
 * @property {string} regulationName
 * @property {'Galicia' | 'Espana_General' | 'UE'} jurisdiction
 * @property {string} enforcementDeadline
 * @property {'CRITICAL' | 'HIGH' | 'MEDIUM' | 'INFO'} impactLevel
 * @property {'software_vendor' | 'restaurant_company' | 'freelance_hostelero'} affectedActor
 * @property {string} sanctionRiskText
 * @property {string} fluxoStrategicAdvantage
 * 
 * @typedef {Object} CommercialTacticInsight
 * @property {string} id
 * @property {QuadrantType} quadrant
 * @property {string} headline
 * @property {string} marketTrigger
 * @property {string} objectionTarget
 * @property {string} pitchHookForGalicia
 * @property {'Carta_39' | 'Sala_69' | 'Full_99' | 'Suite_139'} targetFluxoPlan
 * @property {string} actionableRecommendation
 * 
 * @typedef {Object} DailyMarketReportPayload
 * @property {string} reportDate
 * @property {string} generatedAt
 * @property {number} executionDurationMs
 * @property {'development' | 'production' | 'offline_simulation'} environment
 * @property {Object} deduplicationSummary
 * @property {Object} quadrants
 * @property {Array<any>} galiciaOpportunities
 * @property {CommercialTacticInsight[]} commercialInsights
 * @property {Object} didacticLesson
 * @property {Object} pricingSanityCheck
 * @property {Object} syncLogEntry
 */

export const QUADRANT_TYPES = Object.freeze({
  COMPETITORS: 'competitors',
  NORMATIVE: 'normative',
  FLOOR_OPS: 'floor_ops',
  GASTRO_AI: 'gastro_ai'
});

export const OFFICIAL_PRICING_PLANS = Object.freeze({
  PLAN_CARTA: { id: 'Carta_39', name: 'Plan Carta', priceEur: 39 },
  PLAN_SALA: { id: 'Sala_69', name: 'Plan Sala', priceEur: 69 },
  PLAN_FULL: { id: 'Full_99', name: 'Plan Full', priceEur: 99, recommended: true },
  PLAN_SUITE: { id: 'Suite_139', name: 'Plan Suite', priceEur: 139 },
  SETUP_FEE: { id: 'Setup_149', name: 'Setup Onboarding', priceEur: 149, bonifiablePct: 100 }
});
