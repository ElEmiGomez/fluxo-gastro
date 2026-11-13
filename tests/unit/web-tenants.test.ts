import { test } from 'node:test'
import assert from 'node:assert/strict'
import { getGastronomicTenant } from '../../src/lib/web-tenants.ts'

test('getGastronomicTenant returns structured configuration for known slug', async () => {
  const tenant = await getGastronomicTenant('casa-mar-da-vila')
  assert.ok(tenant)
  assert.equal(tenant?.name, 'Casa Mar da Vila')
  assert.equal(tenant?.archetype, 'restaurant')
  assert.ok(tenant!.dishes.length > 0)
  assert.ok(tenant!.openingHours.length > 0)
})

test('getGastronomicTenant resolves Bar Jara-Tusas with urban_street archetype and full SSOT catalog', async () => {
  const tenant = await getGastronomicTenant('bar-jaratusas')
  assert.ok(tenant)
  assert.equal(tenant?.name, 'Bar Jara-Tusas')
  assert.equal(tenant?.archetype, 'urban_street')
  assert.equal(tenant?.priceRange, '€')
  assert.equal(tenant?.primaryColor, '#0A0B0E')
  assert.equal(tenant?.logoUrl, '/images/jaratusas-logo-circle.png')
  assert.ok(tenant!.dishes.length >= 14)
  const signatureDishes = tenant!.dishes.filter((d) => d.isSignature)
  assert.equal(signatureDishes.length, 4)
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
