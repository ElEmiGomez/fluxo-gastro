import test from 'node:test'
import assert from 'node:assert/strict'
import {
  PLACES_FIELD_MASK,
  SANTIAGO_INTERMODAL,
  buildGoogleReviewUrl,
  isFranchiseOrExcluded,
  classifyZone,
  parseSaturdayHours,
  preclassifyWebsiteUri,
  extractMenuAndSocialsFromHtml,
  computeLeadScoreAndPitch,
  haversineDistanceMeters,
  buildSantiagoSaturdayRoute,
  mergeLeadsIntoCRM,
  buildProspectorCSV,
} from '../../scripts/lib/prospect-maps-core.mjs'

test('PLACES_FIELD_MASK requests strictly the 12 cost-optimized fields without spaces or wildcard', () => {
  assert.ok(!PLACES_FIELD_MASK.includes('*'))
  assert.ok(!PLACES_FIELD_MASK.includes(' '))
  const fields = PLACES_FIELD_MASK.split(',')
  assert.equal(fields.length, 12)
  for (const required of [
    'places.id',
    'places.displayName',
    'places.formattedAddress',
    'places.location',
    'places.rating',
    'places.userRatingCount',
    'places.websiteUri',
    'places.googleMapsUri',
    'places.nationalPhoneNumber',
    'places.regularOpeningHours',
    'places.primaryType',
    'places.businessStatus',
  ]) {
    assert.ok(fields.includes(required), `Missing field ${required}`)
  }
})

test('buildGoogleReviewUrl constructs exact official Google review URL and never invents empty IDs', () => {
  assert.equal(
    buildGoogleReviewUrl('ChIJN1t_tDeuEmsRUsoyG83frY4'),
    'https://search.google.com/local/writereview?placeid=ChIJN1t_tDeuEmsRUsoyG83frY4'
  )
  assert.equal(buildGoogleReviewUrl(''), '')
  assert.equal(buildGoogleReviewUrl(null), '')
})

test('isFranchiseOrExcluded filters known chains and non-target types while keeping independent venues', () => {
  assert.equal(isFranchiseOrExcluded({ displayName: { text: "McDonald's Santiago" }, primaryType: 'restaurant' }), true)
  assert.equal(isFranchiseOrExcluded({ displayName: { text: '100 Montaditos Praza Roxa' }, primaryType: 'bar' }), true)
  assert.equal(isFranchiseOrExcluded({ displayName: { text: 'Starbucks Coffee' }, primaryType: 'cafe' }), true)
  assert.equal(isFranchiseOrExcluded({ displayName: { text: 'Telepizza Noia' }, primaryType: 'restaurant' }), true)
  assert.equal(isFranchiseOrExcluded({ displayName: { text: 'Rodilla Ensanche' }, primaryType: 'cafe' }), true)
  assert.equal(isFranchiseOrExcluded({ displayName: { text: 'Hotel Compostela' }, primaryType: 'hotel' }), true)
  assert.equal(isFranchiseOrExcluded({ displayName: { text: 'Praza Roxa (Santiago de Compostela)' }, primaryType: 'plaza' }), true)
  assert.equal(isFranchiseOrExcluded({ displayName: { text: 'Mercado de Abastos' }, primaryType: 'market' }), true)

  assert.equal(isFranchiseOrExcluded({ displayName: { text: 'Tapería Adega do Pazo' }, primaryType: 'tapas_restaurant' }), false)
  assert.equal(isFranchiseOrExcluded({ displayName: { text: 'Taberna O Gato Negro' }, primaryType: 'bar' }), false)
})

test('parseSaturdayHours parses weekdayDescriptions, periods, past-midnight and Saturday closures', () => {
  const openPlace = parseSaturdayHours({
    weekdayDescriptions: [
      'lunes: Cerrado',
      'sábado: 10:00–16:00, 19:00–00:30',
      'domingo: 11:00–17:00',
    ],
    periods: [
      { open: { day: 6, hour: 10, minute: 0 }, close: { day: 6, hour: 16, minute: 0 } },
      { open: { day: 6, hour: 19, minute: 0 }, close: { day: 0, hour: 0, minute: 30 } },
    ],
  })
  assert.equal(openPlace.saturdayClosed, false)
  assert.equal(openPlace.saturdayHours, '10:00–16:00, 19:00–00:30')
  assert.equal(openPlace.intervals.length, 2)
  assert.deepEqual(openPlace.intervals[0], { startMin: 600, endMin: 960 })
  assert.deepEqual(openPlace.intervals[1], { startMin: 1140, endMin: 1470 })

  const closedPlace = parseSaturdayHours({
    weekdayDescriptions: ['sábado: Cerrado'],
    periods: [{ open: { day: 1, hour: 9, minute: 0 }, close: { day: 1, hour: 17, minute: 0 } }],
  })
  assert.equal(closedPlace.saturdayClosed, true)
  assert.equal(closedPlace.saturdayHours, 'Cerrado')
})

test('extractMenuAndSocialsFromHtml detects PDF menu, interactive web menu, and cleans social links', () => {
  const pdfHtml = `
    <html><body>
      <nav>
        <a href="/docs/carta-verano-2026.pdf">Ver Nuestra Carta</a>
        <a href="https://www.instagram.com/adegadopazo/?hl=es">Instagram</a>
        <a href="https://www.facebook.com/sharer/sharer.php?u=https://example.com">Share FB</a>
        <a href="https://www.facebook.com/adegadopazonoia/">Facebook</a>
      </nav>
    </body></html>
  `
  const pdfRes = extractMenuAndSocialsFromHtml(pdfHtml, 'https://adegadopazo.es')
  assert.equal(pdfRes.online_menu_status, 'pdf')
  assert.equal(pdfRes.online_menu_url, 'https://adegadopazo.es/docs/carta-verano-2026.pdf')
  assert.equal(pdfRes.instagram_url, 'https://www.instagram.com/adegadopazo')
  assert.equal(pdfRes.facebook_url, 'https://www.facebook.com/adegadopazonoia')

  const webHtml = `
    <html><body>
      <a href="/menu-digital">Carta Digital</a>
      <a href="https://www.instagram.com/p/C12345678/">Post no perfil</a>
    </body></html>
  `
  const webRes = extractMenuAndSocialsFromHtml(webHtml, 'https://taberna.es')
  assert.equal(webRes.online_menu_status, 'web_interactive')
  assert.equal(webRes.online_menu_url, 'https://taberna.es/menu-digital')
  assert.equal(webRes.instagram_url, '')

  const noWeb = preclassifyWebsiteUri('')
  assert.equal(noWeb.shouldFetch, false)
  assert.equal(noWeb.online_menu_status, 'none')

  const igAsWebsite = preclassifyWebsiteUri('https://www.instagram.com/barjaratusas/')
  assert.equal(igAsWebsite.shouldFetch, false)
  assert.equal(igAsWebsite.online_menu_status, 'none')
  assert.equal(igAsWebsite.instagram_url, 'https://www.instagram.com/barjaratusas/')
})

test('computeLeadScoreAndPitch accurately classifies carta_qr, cartel_resenas, ambos and Saturday-closed penalty', () => {
  const ambosLead = computeLeadScoreAndPitch({
    rating: 4.2,
    userRatingCount: 85,
    websiteUri: '',
    onlineMenuStatus: 'none',
    primaryType: 'tapas_restaurant',
    zone: 'San Pedro',
    city: 'Santiago de Compostela',
    saturdayClosed: false,
  })
  assert.equal(ambosLead.recommended_pitch, 'ambos')
  assert.ok(ambosLead.lead_score >= 90, `Expected >=90, got ${ambosLead.lead_score}`)

  const resenasOnly = computeLeadScoreAndPitch({
    rating: 4.1,
    userRatingCount: 90,
    websiteUri: 'https://cafe.es',
    onlineMenuStatus: 'web_interactive',
    primaryType: 'cafe',
    zone: 'Ensanche',
    city: 'Santiago de Compostela',
    saturdayClosed: false,
  })
  assert.equal(resenasOnly.recommended_pitch, 'cartel_resenas')

  const cartaOnly = computeLeadScoreAndPitch({
    rating: 4.8,
    userRatingCount: 750,
    websiteUri: 'https://marisqueria.es/carta.pdf',
    onlineMenuStatus: 'pdf',
    primaryType: 'seafood_restaurant',
    zone: 'Centro Noia',
    city: 'Noia',
    saturdayClosed: false,
  })
  assert.equal(cartaOnly.recommended_pitch, 'carta_qr')

  const closedSantiago = computeLeadScoreAndPitch({
    rating: 4.2,
    userRatingCount: 85,
    websiteUri: '',
    onlineMenuStatus: 'none',
    primaryType: 'tapas_restaurant',
    zone: 'San Pedro',
    city: 'Santiago de Compostela',
    saturdayClosed: true,
  })
  assert.equal(closedSantiago.lead_score, ambosLead.lead_score - 35)
})

test('buildSantiagoSaturdayRoute builds 5-block walkable circuit excluding closed venues and breakfast-peak cafes', () => {
  const simulatedSantiagoLeads = [
    // Closed on Saturday -> MUST be excluded from walking route
    {
      google_place_id: 'place_closed',
      name: 'Mesón Cerrado Sábado',
      zone: 'Ensanche',
      primary_type: 'restaurant',
      lat: 42.8740,
      lng: -8.5465,
      lead_score: 98,
      saturday_closed: true,
      _saturday_intervals: [],
    },
    // Cafe in Ensanche -> MUST NOT be placed in Block 1 (10:00-11:30), can go in Block 5 (18:30-20:00)
    {
      google_place_id: 'place_cafe_ensanche',
      name: 'Café Mañanero Ensanche',
      zone: 'Ensanche',
      primary_type: 'cafe',
      lat: 42.8732,
      lng: -8.5460,
      lead_score: 92,
      saturday_closed: false,
      _saturday_intervals: [{ startMin: 480, endMin: 1260 }],
    },
    // Tapas bar in Ensanche -> Block 1 (10:00-11:30)
    {
      google_place_id: 'place_tapas_ensanche',
      name: 'Tapería Hórreo',
      zone: 'Ensanche',
      primary_type: 'tapas_restaurant',
      lat: 42.8738,
      lng: -8.5462,
      lead_score: 90,
      saturday_closed: false,
      _saturday_intervals: [{ startMin: 600, endMin: 1380 }],
    },
    // San Pedro venue -> Block 2 (11:30-12:45)
    {
      google_place_id: 'place_san_pedro_1',
      name: 'Taberna San Pedro',
      zone: 'San Pedro',
      primary_type: 'restaurant',
      lat: 42.8822,
      lng: -8.5385,
      lead_score: 88,
      saturday_closed: false,
      _saturday_intervals: [{ startMin: 690, endMin: 1380 }],
    },
    // Zona Vella midday -> Block 3 scouting only
    {
      google_place_id: 'place_zv_1',
      name: 'Pulpería O Franco',
      zone: 'Zona Vella',
      primary_type: 'seafood_restaurant',
      lat: 42.8792,
      lng: -8.5448,
      lead_score: 91,
      saturday_closed: false,
      _saturday_intervals: [{ startMin: 750, endMin: 1410 }],
    },
    // Zona Vella afternoon -> Block 4 (after Block 3 fills or separate afternoon venue)
    {
      google_place_id: 'place_zv_afternoon',
      name: 'Vinoteca Preguntoiro',
      zone: 'Zona Vella',
      primary_type: 'bar',
      lat: 42.8801,
      lng: -8.5425,
      lead_score: 85,
      saturday_closed: false,
      _saturday_intervals: [{ startMin: 990, endMin: 1410 }], // opens 16:30
    },
  ]

  const { route, totalWalkingMeters } = buildSantiagoSaturdayRoute(simulatedSantiagoLeads, 30)

  assert.equal(route.some((r) => r.google_place_id === 'place_closed'), false)

  const tapasStop = route.find((r) => r.google_place_id === 'place_tapas_ensanche')
  assert.ok(tapasStop?.route_block.startsWith('Bloque 1'))

  const cafeStop = route.find((r) => r.google_place_id === 'place_cafe_ensanche')
  assert.ok(cafeStop?.route_block.startsWith('Bloque 5'), `Cafe should skip Block 1 and land in Block 5, got ${cafeStop?.route_block}`)

  const sanPedroStop = route.find((r) => r.google_place_id === 'place_san_pedro_1')
  assert.ok(sanPedroStop?.route_block.startsWith('Bloque 2'))

  const zvMidday = route.find((r) => r.google_place_id === 'place_zv_1')
  assert.ok(zvMidday?.route_block.includes('solo_observar_mediodia'))

  const zvAfternoon = route.find((r) => r.google_place_id === 'place_zv_afternoon')
  assert.ok(zvAfternoon?.route_block.startsWith('Bloque 4'))

  // Consecutive stop ordering 1..N
  route.forEach((s, i) => assert.equal(s.route_order, i + 1))
  assert.ok(totalWalkingMeters > 500 && totalWalkingMeters < 15000)
  assert.ok(haversineDistanceMeters(SANTIAGO_INTERMODAL.lat, SANTIAGO_INTERMODAL.lng, 42.8748, -8.5468) < 700)
})

test('mergeLeadsIntoCRM upserts without duplicates and preserves existing Noia notes and commercial fields', () => {
  const existingNoia = [
    {
      id: 'existing-noia-1',
      name: 'Tapería Adega do Pazo',
      address: 'Rúa do Cantón, 17',
      zone: 'Casco Histórico',
      city: 'Noia',
      icp_segment: 'A',
      contact_name: 'Carlos Dueño',
      contact_phone: null,
      contact_whatsapp: null,
      instagram: null,
      google_rating: 4.3,
      google_reviews_count: 1220,
      score: 9.6,
      status: 'en_negociacion',
      target_plan: 'fundador_50',
      mrr_projected: 50,
      notes: 'NOTA IMPORTANTE DE GUILLERMO: Volver el jueves a las 12h.',
      created_at: '2026-10-26T10:00:00.000Z',
      updated_at: '2026-10-26T10:00:00.000Z',
    },
  ]

  const incoming = [
    {
      id: 'new-uuid-1',
      name: 'Adega do Pazo', // Name variant in same city -> MUST match existing record!
      address: 'Rúa do Cantón, 17, 15200 Noia',
      city: 'Noia',
      zone: 'Centro Noia',
      google_place_id: 'ChIJ_ADEGA_NOIA',
      google_profile_url: 'https://maps.google.com/?cid=123',
      google_review_url: 'https://search.google.com/local/writereview?placeid=ChIJ_ADEGA_NOIA',
      online_menu_status: 'none',
      online_menu_url: '',
      instagram_url: 'https://instagram.com/adegadopazo',
      facebook_url: '',
      contact_phone: '981 82 00 00',
      google_rating: 4.4,
      google_reviews_count: 1255,
      lead_score: 88,
      recommended_pitch: 'ambos',
      score: 8.8,
    },
    {
      id: 'new-uuid-2',
      name: 'O Gato Negro',
      address: 'Rúa da Raíña, Santiago de Compostela',
      city: 'Santiago de Compostela',
      zone: 'Zona Vella',
      google_place_id: 'ChIJ_GATO_SANTIAGO',
      google_profile_url: 'https://maps.google.com/?cid=456',
      google_review_url: 'https://search.google.com/local/writereview?placeid=ChIJ_GATO_SANTIAGO',
      online_menu_status: 'none',
      lead_score: 84,
      recommended_pitch: 'carta_qr',
      score: 8.4,
    },
  ]

  const { merged, updatedCount, insertedCount } = mergeLeadsIntoCRM(existingNoia, incoming)
  assert.equal(merged.length, 2)
  assert.equal(updatedCount, 1)
  assert.equal(insertedCount, 1)

  const adega = merged.find((l) => l.id === 'existing-noia-1')
  assert.equal(adega.notes, 'NOTA IMPORTANTE DE GUILLERMO: Volver el jueves a las 12h.')
  assert.equal(adega.status, 'en_negociacion')
  assert.equal(adega.contact_name, 'Carlos Dueño')
  assert.equal(adega.zone, 'Casco Histórico')
  assert.equal(adega.google_place_id, 'ChIJ_ADEGA_NOIA')
  assert.equal(adega.google_review_url, 'https://search.google.com/local/writereview?placeid=ChIJ_ADEGA_NOIA')
  assert.equal(adega.contact_phone, '981 82 00 00')
})

test('buildProspectorCSV generates UTF-8 BOM CSV with all mandatory columns', () => {
  const csv = buildProspectorCSV(
    [
      {
        route_order: 1,
        route_block: 'Bloque 1 (10:00 – 11:30) · Ensanche',
        zone: 'Ensanche',
        name: 'Tapería "O Hórreo"',
        primary_type: 'tapas_restaurant',
        google_rating: 4.3,
        google_reviews_count: 142,
        saturday_hours: '10:00–23:30',
        recommended_pitch: 'ambos',
        lead_score: 91,
        online_menu_status: 'none',
        online_menu_url: '',
        google_profile_url: 'https://maps.google.com/?cid=1',
        google_review_url: 'https://search.google.com/local/writereview?placeid=ChIJ1',
        instagram_url: 'https://instagram.com/ohorreo',
        facebook_url: '',
        contact_phone: '981 55 44 33',
        address: 'Rúa do Hórreo, 22',
      },
    ],
    true
  )

  assert.equal(csv.charCodeAt(0), 0xfeff, 'CSV must begin with UTF-8 BOM')
  const [headerLine, dataLine] = csv.slice(1).split('\r\n')
  assert.equal(
    headerLine,
    'orden_parada,bloque_horario,zona,nombre,tipo,rating,total_resenas,horario_sabado,propuesta_recomendada,score,estado_menu_online,url_menu_online,url_perfil_google,url_directa_resenas,instagram,facebook,telefono,direccion'
  )
  assert.ok(dataLine.includes('"Tapería ""O Hórreo"""'))
  assert.ok(dataLine.includes('https://search.google.com/local/writereview?placeid=ChIJ1'))
})

test('classifyZone accurately maps Santiago and Noia streets to zones', () => {
  assert.equal(classifyZone('Santiago de Compostela', 'Rúa de San Pedro, 44, Santiago', 42.8825, -8.5382, 'Ensanche'), 'San Pedro')
  assert.equal(classifyZone('Santiago de Compostela', 'Rúa do Franco, 18, Santiago', 42.8794, -8.5446, 'Ensanche'), 'Zona Vella')
  assert.equal(classifyZone('Santiago de Compostela', 'Rúa do Hórreo, 12, Santiago', 42.8748, -8.5468, 'Zona Vella'), 'Ensanche')
  assert.equal(classifyZone('Noia', 'Rúa do Cantón, 17, Noia', 42.7845, -8.8893, 'Centro Noia'), 'Casco Histórico')
})
