import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { getGastronomicTenant } from '../../src/lib/web-tenants.ts'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const publicDir = path.resolve(__dirname, '..', '..', 'public')

const ORANGE_HEXES = ['#F59E0B', '#EA580C', '#FBBF24', '#D97706', '#C85A32']

test('getGastronomicTenant returns structured configuration for known slug', async () => {
  const tenant = await getGastronomicTenant('casa-mar-da-vila')
  assert.ok(tenant)
  assert.equal(tenant?.name, 'Casa Mar da Vila')
  assert.equal(tenant?.archetype, 'restaurant')
  assert.ok(tenant!.dishes.length > 0)
  assert.ok(tenant!.openingHours.length > 0)
})

test('getGastronomicTenant resolves Bar Jara-Tusas with Cauce Editorial tokens, loop frames on disk, 3 unique spaces, and 14+ dishes', async () => {
  const tenant = await getGastronomicTenant('bar-jaratusas')
  assert.ok(tenant)
  assert.equal(tenant?.slug, 'bar-jaratusas')
  assert.equal(tenant?.name, 'Bar Jara-Tusas')
  assert.equal(tenant?.archetype, 'urban_street')
  assert.equal(tenant?.layoutPreset, 'cauce_editorial')
  assert.equal(tenant?.priceRange, '€')
  assert.equal(tenant?.primaryColor, '#F6F6F3')
  assert.equal(tenant?.accentColor, '#1D4ED8')
  assert.equal(tenant?.logoUrl, '/images/jaratusas-logo-circle.png')
  assert.equal(tenant?.heroImagePoster, '/assets/jaratusas/hero-barra-cerveza-poster.jpg')

  for (const orange of ORANGE_HEXES) {
    assert.notEqual(tenant?.primaryColor?.toUpperCase(), orange)
    assert.notEqual(tenant?.accentColor?.toUpperCase(), orange)
  }

  assert.ok(Array.isArray(tenant!.heroLoopFrames) && tenant!.heroLoopFrames!.length >= 2)
  assert.ok(Array.isArray(tenant!.featureVideoFrames) && tenant!.featureVideoFrames!.length >= 3)
  assert.ok(Array.isArray(tenant!.experienceVideoFrames) && tenant!.experienceVideoFrames!.length >= 4)

  const loopFrameUrls = [
    tenant!.heroImagePoster,
    ...tenant!.heroLoopFrames!,
    ...tenant!.featureVideoFrames!,
    ...tenant!.experienceVideoFrames!,
  ]
  for (const frameUrl of loopFrameUrls) {
    assert.ok(
      frameUrl.startsWith('/images/') || frameUrl.startsWith('/assets/'),
      `Expected local /images/ or /assets/ path, got ${frameUrl}`
    )
    const diskPath = path.join(publicDir, frameUrl.replace(/^\/+/, ''))
    assert.ok(fs.existsSync(diskPath), `Missing Cauce loop asset on disk: ${diskPath}`)
  }

  assert.ok(tenant!.dishes.length >= 14)
  const signatureDishes = tenant!.dishes.filter((d) => d.isSignature)
  assert.equal(signatureDishes.length, 4)
  assert.deepEqual(
    signatureDishes.map((d) => d.id),
    ['cerv-grifo', 'cerv-1906', 'vino-blanco', 'tapa-raxo']
  )

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
      `Ambience ${amb.id} imageDay must not use /images/dishes/, got ${amb.imageDay}`
    )
    assert.equal(
      amb.imageNight.startsWith('/images/dishes/'),
      false,
      `Ambience ${amb.id} imageNight must not use /images/dishes/, got ${amb.imageNight}`
    )
    assert.ok(
      fs.existsSync(path.join(publicDir, amb.imageDay.replace(/^\/+/, ''))),
      `Missing ambience day asset on disk: ${amb.imageDay}`
    )
    assert.ok(
      fs.existsSync(path.join(publicDir, amb.imageNight.replace(/^\/+/, ''))),
      `Missing ambience night asset on disk: ${amb.imageNight}`
    )
  }

  // Verificar que no hay imágenes repetidas entre espacios
  const dayImages = tenant!.ambiences.map((a) => a.imageDay)
  assert.equal(new Set(dayImages).size, 3, 'Las imágenes de día entre espacios deben ser 100% únicas')

  const allDiskAssets = [
    ...loopFrameUrls,
    tenant!.logoUrl!,
    ...tenant!.dishes.map((d) => d.image),
  ]
  for (const assetUrl of allDiskAssets) {
    assert.ok(
      assetUrl.startsWith('/images/') || assetUrl.startsWith('/assets/'),
      `Expected local /images/ or /assets/ path, got ${assetUrl}`
    )
    const filePath = path.join(publicDir, assetUrl.replace(/^\/+/, ''))
    assert.ok(fs.existsSync(filePath), `Referenced asset missing on disk: ${filePath}`)
  }
})

test('getGastronomicTenant resolves jaratusas and jara-tusas aliases exclusively to bar-jaratusas Cauce config', async () => {
  for (const alias of ['jaratusas', 'jara-tusas']) {
    const tenant = await getGastronomicTenant(alias)
    assert.ok(tenant, `Expected tenant for alias "${alias}"`)
    assert.equal(tenant?.slug, 'bar-jaratusas')
    assert.equal(tenant?.name, 'Bar Jara-Tusas')
    assert.equal(tenant?.layoutPreset, 'cauce_editorial')
    assert.equal(tenant?.primaryColor, '#F6F6F3')
    assert.equal(tenant?.accentColor, '#1D4ED8')
    assert.equal(tenant?.ambiences.length, 3)
    assert.ok(tenant!.dishes.length >= 14)
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
