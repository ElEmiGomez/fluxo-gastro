#!/usr/bin/env node
/**
 * Fluxo CRM — Extractor, Enriquecedor y Optimizador de Rutas con Google Maps Platform (Places API New)
 *
 * Uso:
 *   node scripts/prospect_maps_crm.mjs --city=noia [--dry-run]
 *   node scripts/prospect_maps_crm.mjs --city=santiago [--dry-run]
 *   node scripts/prospect_maps_crm.mjs --city=all [--dry-run]
 */

import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { createClient } from '@supabase/supabase-js'
import {
  PLACES_FIELD_MASK,
  CITY_SEARCH_CONFIG,
  SANTIAGO_INTERMODAL,
  buildGoogleReviewUrl,
  isFranchiseOrExcluded,
  classifyZone,
  parseSaturdayHours,
  enrichWebsite,
  runWithConcurrency,
  computeLeadScoreAndPitch,
  buildSantiagoSaturdayRoute,
  mergeLeadsIntoCRM,
  buildProspectorCSV,
  normalizeText,
} from './lib/prospect-maps-core.mjs'

const ROOT_DIR = process.cwd()
const CRM_DATA_DIR = path.join(ROOT_DIR, '.fluxo-data')
const CRM_BACKUP_FILE = path.join(CRM_DATA_DIR, 'crm_leads.json')
const OUT_CRM_DIR = path.join(ROOT_DIR, 'out', 'crm')

function loadEnvLocal() {
  const envPaths = [path.join(ROOT_DIR, '.env.local'), path.join(ROOT_DIR, '.env')]
  for (const envPath of envPaths) {
    if (!fs.existsSync(envPath)) continue
    const raw = fs.readFileSync(envPath, 'utf8')
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eqIdx = trimmed.indexOf('=')
      if (eqIdx === -1) continue
      const key = trimmed.slice(0, eqIdx).trim()
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '')
      if (!process.env[key]) {
        process.env[key] = val
      }
    }
  }
}

function parseCliArgs(argv) {
  const args = { city: '', dryRun: false }
  for (const token of argv) {
    if (token.startsWith('--city=')) {
      args.city = token.slice('--city='.length).trim().toLowerCase()
    } else if (token === '--dry-run') {
      args.dryRun = true
    }
  }
  return args
}

async function searchNearbyPlaces(apiKey, searchDef) {
  const endpoint = 'https://places.googleapis.com/v1/places:searchNearby'
  const body = {
    includedTypes: searchDef.includedTypes,
    maxResultCount: 20,
    languageCode: 'es',
    rankPreference: searchDef.rankPreference || 'POPULARITY',
    locationRestriction: {
      circle: {
        center: {
          latitude: searchDef.center.lat,
          longitude: searchDef.center.lng,
        },
        radius: searchDef.radius,
      },
    },
  }

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': PLACES_FIELD_MASK,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Places API (New) HTTP ${res.status} en zona ${searchDef.zone}: ${errText}`)
  }

  const data = await res.json()
  return Array.isArray(data.places) ? data.places : []
}

async function searchTextSinglePlace(apiKey, textQuery, center, radius) {
  const endpoint = 'https://places.googleapis.com/v1/places:searchText'
  const body = {
    textQuery,
    maxResultCount: 1,
    languageCode: 'es',
    locationBias: {
      circle: {
        center: { latitude: center.lat, longitude: center.lng },
        radius,
      },
    },
  }

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': PLACES_FIELD_MASK,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) return null
  const data = await res.json()
  return Array.isArray(data.places) && data.places.length > 0 ? data.places[0] : null
}

function normalizePhoneForWhatsApp(phone) {
  if (!phone) return null
  const digits = String(phone).replace(/[^\d]/g, '')
  if (!digits) return null
  if (digits.startsWith('34')) return digits
  if (digits.length === 9 && (digits.startsWith('6') || digits.startsWith('7'))) {
    return `34${digits}`
  }
  return null
}

function loadExistingLocalCRM() {
  if (!fs.existsSync(CRM_BACKUP_FILE)) return []
  try {
    const parsed = JSON.parse(fs.readFileSync(CRM_BACKUP_FILE, 'utf8'))
    return Array.isArray(parsed) ? parsed : []
  } catch (err) {
    console.warn('[CRM] Error leyendo .fluxo-data/crm_leads.json:', err.message)
    return []
  }
}

async function tryUpsertSupabase(leadsToSync) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
  if (!url || !key) {
    return { synced: false, reason: 'Supabase no configurado en .env.local' }
  }

  try {
    const supabase = createClient(url, key)
    const { error: probeErr } = await supabase.from('crm_leads').select('id').limit(1)
    if (probeErr) {
      return {
        synced: false,
        reason: `Tabla crm_leads no disponible aún en Supabase Cloud (${probeErr.code || probeErr.message}). Aplica supabase/migrations/20261026_crm_leads.sql y 20261123_crm_places_enrichment.sql.`,
      }
    }

    const withPlaceId = leadsToSync.filter((l) => Boolean(l.google_place_id))
    let upserted = 0
    for (const lead of withPlaceId) {
      const payload = {
        name: lead.name,
        address: lead.address,
        city: lead.city,
        zone: lead.zone,
        icp_segment: lead.icp_segment,
        contact_phone: lead.contact_phone,
        contact_whatsapp: lead.contact_whatsapp,
        instagram: lead.instagram,
        instagram_url: lead.instagram_url,
        facebook_url: lead.facebook_url,
        google_place_id: lead.google_place_id,
        google_profile_url: lead.google_profile_url,
        google_review_url: lead.google_review_url,
        website_url: lead.website_url,
        online_menu_status: lead.online_menu_status,
        online_menu_url: lead.online_menu_url,
        google_rating: lead.google_rating,
        google_reviews_count: lead.google_reviews_count,
        score: lead.score,
        lead_score: lead.lead_score,
        recommended_pitch: lead.recommended_pitch,
        primary_type: lead.primary_type,
        saturday_hours: lead.saturday_hours,
        saturday_closed: lead.saturday_closed,
        route_block: lead.route_block,
        route_order: lead.route_order,
        lat: lead.lat,
        lng: lead.lng,
        status: lead.status,
        target_plan: lead.target_plan,
        mrr_projected: lead.mrr_projected,
        notes: lead.notes,
        updated_at: lead.updated_at,
      }
      const { error } = await supabase
        .from('crm_leads')
        .upsert(payload, { onConflict: 'google_place_id' })
      if (!error) upserted += 1
    }

    return { synced: true, upserted }
  } catch (err) {
    return { synced: false, reason: err.message }
  }
}

async function processCity(cityKey, apiKey, dryRun) {
  const cfg = CITY_SEARCH_CONFIG[cityKey]
  if (!cfg) {
    throw new Error(`Ciudad no soportada: "${cityKey}". Usa --city=noia o --city=santiago`)
  }

  console.log(`\n======================================================================`)
  console.log(`  FLUXO PROSPECTOR · ${cfg.cityName.toUpperCase()} ${dryRun ? '[DRY-RUN]' : '[MODO REAL]'}`)
  console.log(`======================================================================`)
  console.log(`FieldMask (${PLACES_FIELD_MASK.split(',').length} campos): ${PLACES_FIELD_MASK}`)

  const rawById = new Map()
  let totalApiCalls = 0

  for (const searchDef of cfg.searches) {
    totalApiCalls += 1
    console.log(
      `[Places API #${totalApiCalls}] ${searchDef.zone} (${searchDef.center.lat}, ${searchDef.center.lng}, r=${searchDef.radius}m) tipos=[${searchDef.includedTypes.join(', ')}]`
    )
    const places = await searchNearbyPlaces(apiKey, searchDef)
    console.log(`   -> ${places.length} resultados recibidos`)

    for (const p of places) {
      if (!p.id) continue
      if (!rawById.has(p.id)) {
        rawById.set(p.id, { place: p, fallbackZone: searchDef.zone })
      }
    }
  }

  console.log(`\nTotal únicos crudos extraídos: ${rawById.size} (en ${totalApiCalls} llamadas API)`)

  // En Noia: enriquecer con searchText (1 resultado) cualquier local ya existente en el CRM que aún no tenga google_place_id
  if (cityKey === 'noia') {
    const existingNoia = loadExistingLocalCRM().filter(
      (l) => normalizeText(l.city || 'noia') === 'noia' && !l.google_place_id
    )
    if (existingNoia.length > 0) {
      const { merged: previewMerged } = mergeLeadsIntoCRM(
        existingNoia,
        Array.from(rawById.values()).map(({ place }) => ({
          name: place.displayName?.text || '',
          city: 'Noia',
          google_place_id: place.id,
        }))
      )
      const stillMissing = previewMerged.filter((l) => !l.google_place_id)
      if (stillMissing.length > 0) {
        console.log(
          `[Places API searchText] Buscando ficha oficial de ${stillMissing.length} locales existentes de Noia sin place_id...`
        )
        const foundList = await runWithConcurrency(stillMissing, 3, async (lead) => {
          const p = await searchTextSinglePlace(
            apiKey,
            `${lead.name} Noia`,
            cfg.searches[0].center,
            cfg.searches[0].radius
          )
          return p ? { place: p, existingZone: lead.zone, existingName: lead.name } : null
        })
        let addedFromText = 0
        for (const item of foundList) {
          if (!item || !item.place?.id) continue
          // Verificar que realmente está cerca de Noia (< 4 km) para evitar falsos positivos lejanos
          const lat = item.place.location?.latitude
          const lng = item.place.location?.longitude
          if (typeof lat === 'number' && typeof lng === 'number') {
            const dLat = Math.abs(lat - cfg.searches[0].center.lat)
            const dLng = Math.abs(lng - cfg.searches[0].center.lng)
            if (dLat > 0.04 || dLng > 0.05) continue
          }
          if (!rawById.has(item.place.id)) {
            rawById.set(item.place.id, {
              place: item.place,
              fallbackZone: item.existingZone || 'Centro Noia',
              existingName: item.existingName,
            })
            addedFromText += 1
          }
        }
        console.log(`   -> ${addedFromText} fichas existentes de Noia localizadas en Google Maps`)
      }
    }
  }

  // Filtrar OPERATIONAL y descartar franquicias / tipos excluidos
  const operationalCandidates = []
  let skippedNotOperational = 0
  let skippedFranchise = 0

  for (const { place, fallbackZone, existingName } of rawById.values()) {
    if (place.businessStatus && place.businessStatus !== 'OPERATIONAL') {
      skippedNotOperational += 1
      continue
    }
    if (isFranchiseOrExcluded(place)) {
      skippedFranchise += 1
      continue
    }
    operationalCandidates.push({ place, fallbackZone, existingName })
  }

  console.log(
    `Filtrado: ${operationalCandidates.length} locales independientes OPERATIONAL (descartados: ${skippedNotOperational} no operativos, ${skippedFranchise} franquicias/excluidos)`
  )

  // Enriquecimiento HTTP (máx. 3 peticiones concurrentes, timeout 5s)
  const withWebsiteCount = operationalCandidates.filter((c) => Boolean(c.place.websiteUri)).length
  console.log(
    `Enriqueciendo menú online y redes sociales (${withWebsiteCount} con web, ${operationalCandidates.length - withWebsiteCount} sin web -> 'none', concurrencia=3)...`
  )

  const enrichedLeads = await runWithConcurrency(operationalCandidates, 3, async ({ place, fallbackZone, existingName }) => {
    const name = place.displayName?.text?.trim() || ''
    const address = place.formattedAddress?.trim() || ''
    const lat = place.location?.latitude ?? null
    const lng = place.location?.longitude ?? null
    const zone = classifyZone(cfg.cityName, address, lat, lng, fallbackZone)
    const websiteUri = place.websiteUri?.trim() || ''
    const googleProfileUrl = place.googleMapsUri?.trim() || ''
    const googleReviewUrl = buildGoogleReviewUrl(place.id)
    const phone = place.nationalPhoneNumber?.trim() || ''
    const rating = typeof place.rating === 'number' ? place.rating : null
    const reviewCount = typeof place.userRatingCount === 'number' ? place.userRatingCount : 0
    const primaryType = place.primaryType || ''

    const { saturdayHours, saturdayClosed, intervals } = parseSaturdayHours(place.regularOpeningHours)
    const webData = websiteUri
      ? await enrichWebsite(websiteUri)
      : { online_menu_status: 'none', online_menu_url: '', instagram_url: '', facebook_url: '' }

    const scoring = computeLeadScoreAndPitch({
      rating,
      userRatingCount: reviewCount,
      websiteUri,
      onlineMenuStatus: webData.online_menu_status,
      primaryType,
      zone,
      city: cfg.cityName,
      saturdayClosed,
    })

    return {
      id: crypto.randomUUID(),
      name,
      address,
      city: cfg.cityName,
      zone,
      primary_type: primaryType,
      lat,
      lng,
      google_place_id: place.id,
      google_profile_url: googleProfileUrl,
      google_review_url: googleReviewUrl,
      website_url: websiteUri,
      online_menu_status: webData.online_menu_status,
      online_menu_url: webData.online_menu_url,
      instagram_url: webData.instagram_url,
      facebook_url: webData.facebook_url,
      contact_phone: phone || null,
      contact_whatsapp: normalizePhoneForWhatsApp(phone),
      google_rating: rating,
      google_reviews_count: reviewCount,
      saturday_hours: saturdayHours || null,
      saturday_closed: saturdayClosed,
      _saturday_intervals: intervals,
      lead_score: scoring.lead_score,
      recommended_pitch: scoring.recommended_pitch,
      score: scoring.score,
      icp_segment: scoring.icp_segment,
      route_block: saturdayClosed && cfg.cityName === 'Santiago de Compostela' ? 'cerrado_sabado' : '',
      route_order: null,
      _match_existing_name: existingName || null,
    }
  })

  // Estadísticas de enriquecimiento
  const menuStats = { none: 0, pdf: 0, web_interactive: 0, unknown: 0 }
  const pitchStats = { carta_qr: 0, cartel_resenas: 0, ambos: 0 }
  let igCount = 0
  let fbCount = 0
  let satClosedCount = 0

  for (const l of enrichedLeads) {
    menuStats[l.online_menu_status || 'unknown'] = (menuStats[l.online_menu_status || 'unknown'] || 0) + 1
    pitchStats[l.recommended_pitch] = (pitchStats[l.recommended_pitch] || 0) + 1
    if (l.instagram_url) igCount += 1
    if (l.facebook_url) fbCount += 1
    if (l.saturday_closed) satClosedCount += 1
  }

  console.log(`Resumen Enriquecimiento (${cfg.cityName}):`)
  console.log(`  - Menú online: sin menú=${menuStats.none}, PDF=${menuStats.pdf}, web=${menuStats.web_interactive}, desconocido=${menuStats.unknown}`)
  console.log(`  - Propuesta: ambos=${pitchStats.ambos}, carta_qr=${pitchStats.carta_qr}, cartel_resenas=${pitchStats.cartel_resenas}`)
  console.log(`  - Redes verificadas: Instagram=${igCount}, Facebook=${fbCount} | Cerrados sábado=${satClosedCount}`)

  let csvRows = []
  let finalLeadsForUpsert = enrichedLeads

  if (cityKey === 'santiago') {
    const { route, totalWalkingMeters, returnToIntermodalMeters } = buildSantiagoSaturdayRoute(enrichedLeads, 34)
    const routeByPlaceId = new Map(route.map((r) => [r.google_place_id, r]))

    finalLeadsForUpsert = enrichedLeads.map((l) => {
      const stop = routeByPlaceId.get(l.google_place_id)
      if (stop) {
        return { ...l, route_block: stop.route_block, route_order: stop.route_order }
      }
      return l
    })

    csvRows = route
    console.log(
      `\nRuta Caminable Sábado Santiago (desde/hasta Intermodal ${SANTIAGO_INTERMODAL.lat}, ${SANTIAGO_INTERMODAL.lng}):`
    )
    console.log(
      `  - Paradas seleccionadas: ${route.length} | Distancia circuito Haversine aprox.: ${(totalWalkingMeters / 1000).toFixed(2)} km (vuelta final a Intermodal: ${returnToIntermodalMeters} m)`
    )
    const blockCounts = {}
    for (const s of route) {
      blockCounts[s.route_block] = (blockCounts[s.route_block] || 0) + 1
    }
    for (const [blk, cnt] of Object.entries(blockCounts)) {
      console.log(`    · ${blk}: ${cnt} paradas`)
    }
  } else {
    csvRows = [...enrichedLeads].sort((a, b) => (b.lead_score || 0) - (a.lead_score || 0))
  }

  // Mostrar muestra Top 8 en consola
  console.log(`\nMuestra de resultados (${cityKey === 'santiago' ? 'Primeras 8 paradas' : 'Top 8 por Lead Score'}):`)
  for (const item of csvRows.slice(0, 8)) {
    const prefix = item.route_order ? `#${String(item.route_order).padStart(2, '0')} ` : ''
    console.log(
      `  ${prefix}[${item.lead_score}/100 | ${item.recommended_pitch}] ${item.name} (${item.zone}) · ${item.google_rating ?? '-'}★ (${item.google_reviews_count}) · menú:${item.online_menu_status} · sáb:${item.saturday_hours || 'n/d'}`
    )
  }

  if (dryRun) {
    console.log(`\n[DRY-RUN] Sin escrituras en .fluxo-data/crm_leads.json, Supabase ni out/crm/.`)
    return { cityKey, total: enrichedLeads.length, routeCount: csvRows.length, dryRun: true }
  }

  // Upsert sin duplicados en CRM local preservando notas previas de Noia
  const existingCRM = loadExistingLocalCRM().map((lead) => {
    if (cityKey === 'santiago' && normalizeText(lead.city || '') === 'santiago de compostela') {
      return { ...lead, route_block: lead.saturday_closed ? 'cerrado_sabado' : null, route_order: null }
    }
    return lead
  })
  const { merged, updatedCount, insertedCount } = mergeLeadsIntoCRM(existingCRM, finalLeadsForUpsert)

  if (!fs.existsSync(CRM_DATA_DIR)) {
    fs.mkdirSync(CRM_DATA_DIR, { recursive: true })
  }
  fs.writeFileSync(CRM_BACKUP_FILE, JSON.stringify(merged, null, 2), 'utf8')
  console.log(
    `\n[CRM Local] Upsert completado en .fluxo-data/crm_leads.json: ${updatedCount} actualizados (notas preservadas), ${insertedCount} nuevos, ${merged.length} totales.`
  )

  // Intento de sincronización a Supabase Cloud
  const supaRes = await tryUpsertSupabase(
    merged.filter((l) => normalizeText(l.city || '') === normalizeText(cfg.cityName))
  )
  if (supaRes.synced) {
    console.log(`[Supabase] Sincronizados ${supaRes.upserted} registros en crm_leads.`)
  } else {
    console.log(`[Supabase] Nota: ${supaRes.reason}`)
  }

  // Exportar CSV con BOM UTF-8 en out/crm/
  if (!fs.existsSync(OUT_CRM_DIR)) {
    fs.mkdirSync(OUT_CRM_DIR, { recursive: true })
  }

  if (cityKey === 'noia') {
    const allNoiaFromCRM = merged
      .filter((l) => normalizeText(l.city || 'noia') === 'noia')
      .sort((a, b) => (b.lead_score || (b.score || 0) * 10) - (a.lead_score || (a.score || 0) * 10))
    const csvContent = buildProspectorCSV(allNoiaFromCRM, false)
    const outPath = path.join(OUT_CRM_DIR, 'noia_locales_enriquecido.csv')
    fs.writeFileSync(outPath, csvContent, 'utf8')
    console.log(`[CSV] Generado: ${outPath} (${allNoiaFromCRM.length} filas, UTF-8 BOM)`)
  } else if (cityKey === 'santiago') {
    const csvContent = buildProspectorCSV(csvRows, true)
    const outPath = path.join(OUT_CRM_DIR, 'santiago_ruta_sabado.csv')
    fs.writeFileSync(outPath, csvContent, 'utf8')
    console.log(`[CSV] Generado: ${outPath} (${csvRows.length} paradas ordenadas, UTF-8 BOM)`)
  }

  return { cityKey, total: enrichedLeads.length, updatedCount, insertedCount, routeCount: csvRows.length }
}

async function main() {
  loadEnvLocal()
  const { city, dryRun } = parseCliArgs(process.argv.slice(2))

  if (!city || !['noia', 'santiago', 'all'].includes(city)) {
    console.error('Uso: node scripts/prospect_maps_crm.mjs --city=noia|santiago|all [--dry-run]')
    process.exit(1)
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY
  if (!apiKey) {
    console.error('ERROR: Falta GOOGLE_MAPS_API_KEY en .env.local o variables de entorno.')
    process.exit(1)
  }

  const cities = city === 'all' ? ['noia', 'santiago'] : [city]
  for (const c of cities) {
    await processCity(c, apiKey, dryRun)
  }
}

main().catch((err) => {
  console.error('\n[ERROR FATAL]', err.message || err)
  process.exit(1)
})
