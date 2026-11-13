import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { getGastronomicTenant } from '../../src/lib/web-tenants.ts'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const publicDir = path.resolve(__dirname, '..', '..', 'public')

test('getGastronomicTenant returns structured configuration for known slug', async () => {
  const tenant = await getGastronomicTenant('casa-mar-da-vila')
  assert.ok(tenant)
  assert.equal(tenant?.name, 'Casa Mar da Vila')
  assert.equal(tenant?.archetype, 'restaurant')
  assert.ok(tenant!.dishes.length > 0)
  assert.ok(tenant!.openingHours.length > 0)
})

test('getGastronomicTenant resolves Bar Jara-Tusas with strict UniqueAssetSet, 4 signature pillars, 4 panels, and 3 architectural spaces', async () => {
  const tenant = await getGastronomicTenant('bar-jaratusas')
  assert.ok(tenant)
  assert.equal(tenant?.slug, 'bar-jaratusas')
  assert.equal(tenant?.name, 'Bar Jara-Tusas')
  assert.equal(tenant?.archetype, 'urban_street')
  assert.equal(tenant?.priceRange, '€')
  assert.equal(tenant?.primaryColor, '#0A0B0E')
  assert.equal(tenant?.accentColor, '#F59E0B')
  assert.equal(tenant?.logoUrl, '/images/jaratusas-logo-circle.png')
  assert.equal(tenant?.flankLeftImage, undefined)
  assert.equal(tenant?.flankRightImage, undefined)

  assert.ok(tenant!.dishes.length >= 14)

  const signatureDishes = tenant!.dishes.filter((d) => d.isSignature)
  assert.equal(signatureDishes.length, 4)
  assert.deepEqual(
    signatureDishes.map((d) => d.id),
    ['cerv-grifo', 'cerv-1906', 'vino-blanco', 'tapa-raxo']
  )
  const vinoBlanco = signatureDishes.find((d) => d.id === 'vino-blanco')
  assert.ok(vinoBlanco?.name.includes('Selección de Vinos'))

  const vermu = tenant!.dishes.find((d) => d.id === 'vermu-gallego')
  assert.ok(vermu)
  assert.equal(vermu?.isSignature, false)

  const panels = tenant!.scrollytellingPanels
  assert.ok(Array.isArray(panels))
  assert.equal(panels.length, 4)
  assert.deepEqual(
    panels.map((p) => p.number),
    ['01', '02', '03', '04']
  )
  for (const panel of panels) {
    assert.ok(panel.image.startsWith('/images/'), `Invalid panel image path: ${panel.image}`)
  }

  assert.equal(tenant!.ambiences.length, 3)
  assert.deepEqual(
    tenant!.ambiences.map((a) => a.id),
    ['terraza-exterior', 'salon-interior', 'zona-barra']
  )
  for (const amb of tenant!.ambiences) {
    assert.ok(amb.imageDay.startsWith('/images/'), `Invalid ambience day path: ${amb.imageDay}`)
    assert.ok(amb.imageNight.startsWith('/images/'), `Invalid ambience night path: ${amb.imageNight}`)
    assert.equal(
      amb.imageDay.startsWith('/images/dishes/'),
      false,
      `Ambience ${amb.id} imageDay must be architectural, got ${amb.imageDay}`
    )
    assert.equal(
      amb.imageNight.startsWith('/images/dishes/'),
      false,
      `Ambience ${amb.id} imageNight must be architectural, got ${amb.imageNight}`
    )
  }

  const urls = [
    tenant!.heroImagePoster,
    ...signatureDishes.map((d) => d.image),
    ...panels.map((p) => p.image),
    ...tenant!.ambiences.flatMap((a) => [a.imageDay, a.imageNight]),
  ]

  assert.equal(
    new Set(urls).size,
    urls.length,
    `Expected zero duplicate Home Page assets, found duplicates in: ${JSON.stringify(urls)}`
  )
  assert.equal(
    urls.slice(1).includes(tenant!.heroImagePoster),
    false,
    'heroImagePoster must not equal any other Home image'
  )
  assert.equal(urls.includes(tenant!.logoUrl!), false, 'logoUrl must remain unique')

  const diskAssets = [...urls, tenant!.logoUrl!, ...tenant!.dishes.map((d) => d.image)]
  for (const assetUrl of diskAssets) {
    const filePath = path.join(publicDir, assetUrl.replace(/^\/+/, ''))
    assert.ok(fs.existsSync(filePath), `Referenced asset missing on disk: ${filePath}`)
  }
})

test('getGastronomicTenant resolves jaratusas and jara-tusas aliases exclusively to bar-jaratusas', async () => {
  for (const alias of ['jaratusas', 'jara-tusas']) {
    const tenant = await getGastronomicTenant(alias)
    assert.ok(tenant, `Expected tenant for alias "${alias}"`)
    assert.equal(tenant?.slug, 'bar-jaratusas')
    assert.equal(tenant?.name, 'Bar Jara-Tusas')
    assert.equal(tenant?.archetype, 'urban_street')
    assert.equal(tenant?.primaryColor, '#0A0B0E')
    assert.equal(tenant?.logoUrl, '/images/jaratusas-logo-circle.png')
    assert.equal(tenant?.dishes.filter((d) => d.isSignature).length, 4)
    assert.equal(tenant?.scrollytellingPanels?.length, 4)
    assert.equal(tenant?.ambiences.length, 3)
  }
})

test('getGastronomicTenant resolves alias slugs like casamar', async () => {
  const tenant = await getGastronomicTenant('casamar')
  assert.ok(tenant)
  assert.equal(tenant?.slug, 'casa-mar-da-vila')
})

test('getGastronomicTenant returns null for non-existent slug', async () => {
  const tenant = await getGastronomicTenant('restaurante-fantasma-1234')
  assert.equal(tenant, null)
})
