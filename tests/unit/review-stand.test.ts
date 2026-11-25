import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { registerHooks } from 'node:module'
import { test } from 'node:test'
import assert from 'node:assert/strict'
import ts from 'typescript'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..', '..')

function resolveTsFile(basePath: string): string | null {
  const candidates = [
    basePath,
    `${basePath}.ts`,
    `${basePath}.tsx`,
    path.join(basePath, 'index.ts'),
    path.join(basePath, 'index.tsx'),
  ]
  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return candidate
    }
  }
  return null
}

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === 'next/headers') {
      return {
        shortCircuit: true,
        url: 'data:text/javascript,export function cookies(){throw new Error("outside request");}',
      }
    }

    if (specifier.startsWith('@/')) {
      const target = resolveTsFile(path.join(repoRoot, 'src', specifier.slice(2)))
      if (target) {
        return { shortCircuit: true, url: pathToFileURL(target).href }
      }
    }

    if (
      (specifier.startsWith('./') || specifier.startsWith('../')) &&
      context.parentURL?.startsWith('file://') &&
      !path.extname(specifier)
    ) {
      const parentDir = path.dirname(fileURLToPath(context.parentURL))
      const target = resolveTsFile(path.resolve(parentDir, specifier))
      if (target) {
        return { shortCircuit: true, url: pathToFileURL(target).href }
      }
    }

    return nextResolve(specifier, context)
  },
  load(url, context, nextLoad) {
    if (url.startsWith('file://') && (url.endsWith('.ts') || url.endsWith('.tsx'))) {
      const filePath = fileURLToPath(url)
      const source = fs.readFileSync(filePath, 'utf8')
      const transpiled = ts.transpileModule(source, {
        fileName: filePath,
        compilerOptions: {
          module: ts.ModuleKind.ESNext,
          target: ts.ScriptTarget.ES2022,
          jsx: ts.JsxEmit.ReactJSX,
          esModuleInterop: true,
        },
      })
      return {
        shortCircuit: true,
        format: 'module',
        source: transpiled.outputText,
      }
    }
    return nextLoad(url, context)
  },
})

const { normalizeSlug } = await import('../../src/lib/slugify.ts')
const { resolveLeadGoogleReviewUrl, resolveReviewStandTarget } = await import(
  '../../src/lib/reviews/review-stand-resolver.ts'
)
const { CARTA_QR_PRICE_EUR, REVIEW_STAND_PRICE_EUR, PLAN_PRICING } = await import(
  '../../src/types/crm.types.ts'
)
const {
  PLAN_CONFIG,
  REVIEW_STAND_PRICE_EUR: BILLING_REVIEW_STAND_PRICE_EUR,
  CARTA_QR_PRICE_EUR: BILLING_CARTA_QR_PRICE_EUR,
  calculateReviewStandsTotal,
} = await import('../../src/lib/billing/billing-calculations.ts')
const { DEMO_LOCALES } = await import('../../src/lib/billing/crm-demo-seed.ts')

test('normalizeSlug normalizes accents, symbols, spaces, and edge hyphens consistently', () => {
  assert.equal(normalizeSlug('Bar Jara-Tusas'), 'bar-jara-tusas')
  assert.equal(normalizeSlug('Café & Tapería Ó Pazo'), 'cafe-taperia-o-pazo')
  assert.equal(normalizeSlug('  ---Árboles & Ñoquis---  '), 'arboles-noquis')
  assert.equal(normalizeSlug('Cafetería / Cervexería Equs'), 'cafeteria-cervexeria-equs')
})

test('resolveLeadGoogleReviewUrl follows explicit URL -> placeid -> profile -> maps search priority', () => {
  assert.equal(
    resolveLeadGoogleReviewUrl({
      name: 'Mesón Test',
      address: 'Rúa Nova 1',
      city: 'Santiago de Compostela',
      google_review_url: 'https://g.page/r/custom-direct/review',
      google_place_id: 'ChIJ123',
      google_profile_url: 'https://maps.google.com/?cid=1',
    }),
    'https://g.page/r/custom-direct/review'
  )

  assert.equal(
    resolveLeadGoogleReviewUrl({
      name: 'Mesón Test',
      address: 'Rúa Nova 1',
      city: 'Santiago de Compostela',
      google_review_url: null,
      google_place_id: 'ChIJ_ABC_123',
      google_profile_url: 'https://maps.google.com/?cid=1',
    }),
    'https://search.google.com/local/writereview?placeid=ChIJ_ABC_123'
  )

  assert.equal(
    resolveLeadGoogleReviewUrl({
      name: 'Mesón Test',
      address: 'Rúa Nova 1',
      city: 'Santiago de Compostela',
      google_review_url: null,
      google_place_id: null,
      google_profile_url: 'https://maps.google.com/?cid=999',
    }),
    'https://maps.google.com/?cid=999'
  )

  const fallback = resolveLeadGoogleReviewUrl({
    name: 'Mesón Test',
    address: 'Rúa Nova 1',
    city: 'Santiago de Compostela',
    google_review_url: null,
    google_place_id: null,
    google_profile_url: null,
  })
  assert.ok(fallback.startsWith('https://www.google.com/maps/search/?api=1&query='))
  assert.ok(fallback.includes('Santiago'))
})

test('resolveReviewStandTarget resolves default clean template only when allowDefault is true', async () => {
  const defaultPrint = await resolveReviewStandTarget('predeterminada', { allowDefault: true })
  assert.ok(defaultPrint)
  assert.equal(defaultPrint?.source, 'default')
  assert.equal(defaultPrint?.isDefaultTemplate, true)
  assert.equal(defaultPrint?.logoUrl, undefined)
  assert.equal(defaultPrint?.enableGatekeeper, false)

  const defaultPublic = await resolveReviewStandTarget('predeterminada')
  assert.equal(defaultPublic, null)
})

test('resolveReviewStandTarget resolves existing seed tenant bar-jaratusas with circular logo and direct redirect default', async () => {
  const target = await resolveReviewStandTarget('bar-jaratusas')
  assert.ok(target)
  assert.equal(target?.source, 'tenant')
  assert.equal(target?.restaurantName, 'Bar Jara-Tusas')
  assert.equal(target?.logoUrl, '/images/jaratusas-logo-circle.png')
  assert.equal(target?.enableGatekeeper, false)
  assert.ok(target?.googleReviewUrl.includes('google'))
})

test('resolveReviewStandTarget resolves dynamic CRM lead from .fluxo-data/crm_leads.json with direct redirect default', async () => {
  const crmJsonPath = path.join(repoRoot, '.fluxo-data', 'crm_leads.json')
  assert.ok(fs.existsSync(crmJsonPath), 'Expected .fluxo-data/crm_leads.json to exist')
  const leads = JSON.parse(fs.readFileSync(crmJsonPath, 'utf8'))
  assert.ok(Array.isArray(leads) && leads.length > 0)

  const sampleLead = leads.find((l: any) => l.google_review_url) || leads[0]
  const slug = sampleLead.custom_slug
    ? normalizeSlug(sampleLead.custom_slug)
    : normalizeSlug(sampleLead.name)

  const target = await resolveReviewStandTarget(slug, { allowDefault: true })
  assert.ok(target, `Expected CRM lead "${sampleLead.name}" (${slug}) to resolve`)
  assert.equal(target?.source, 'crm_lead')
  assert.equal(target?.restaurantName, sampleLead.name)
  assert.equal(target?.enableGatekeeper, false)
  assert.ok(target?.googleReviewUrl.length > 0)
})

test('resolveReviewStandTarget returns null for unknown slug (never falls back to burger-gourmet)', async () => {
  const target = await resolveReviewStandTarget('local-totalmente-inexistente-99999', {
    allowDefault: true,
  })
  assert.equal(target, null)
})

test('CRM and Billing tariff constants enforce 15€/mes Carta QR and 20€ Review Stand', () => {
  assert.equal(CARTA_QR_PRICE_EUR, 15)
  assert.equal(REVIEW_STAND_PRICE_EUR, 20)
  assert.equal(PLAN_PRICING.carta_15, 15)
  assert.equal(PLAN_PRICING.mozo_47, 47)
  assert.equal(PLAN_PRICING.fundador_50, 50)
  assert.equal(PLAN_PRICING.full_97, 97)

  assert.equal(BILLING_CARTA_QR_PRICE_EUR, 15)
  assert.equal(BILLING_REVIEW_STAND_PRICE_EUR, 20)
  assert.equal(PLAN_CONFIG.carta.basePriceEur, 15)
  assert.equal(PLAN_CONFIG.sala.basePriceEur, 47)
  assert.equal(PLAN_CONFIG.full_fundador.basePriceEur, 50)
  assert.equal(PLAN_CONFIG.full.basePriceEur, 97)

  const totalStands = calculateReviewStandsTotal(DEMO_LOCALES)
  assert.equal(totalStands, 20)
})
