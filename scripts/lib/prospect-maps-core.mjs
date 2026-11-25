// Pure core logic for Google Maps Platform (Places API New) prospecting,
// franchise filtering, scoring, HTML menu/social enrichment, Saturday walking
// route optimization for Santiago de Compostela, duplicate-free CRM upsert,
// and UTF-8 BOM CSV generation.

export const PLACES_FIELD_MASK = [
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
].join(',')

export const NOIA_CENTER = { lat: 42.7850, lng: -8.8878 }
export const SANTIAGO_INTERMODAL = { lat: 42.8705, lng: -8.5453 }

export const CITY_SEARCH_CONFIG = {
  noia: {
    cityName: 'Noia',
    searches: [
      {
        zone: 'Centro Noia',
        center: { lat: 42.7850, lng: -8.8878 },
        radius: 2500,
        includedTypes: ['restaurant', 'seafood_restaurant', 'tapas_restaurant', 'spanish_restaurant'],
      },
      {
        zone: 'Centro Noia',
        center: { lat: 42.7850, lng: -8.8878 },
        radius: 2500,
        includedTypes: ['bar', 'pub'],
      },
      {
        zone: 'Centro Noia',
        center: { lat: 42.7850, lng: -8.8878 },
        radius: 2500,
        includedTypes: ['cafe', 'coffee_shop'],
      },
    ],
  },
  santiago: {
    cityName: 'Santiago de Compostela',
    searches: [
      {
        zone: 'Ensanche',
        center: { lat: 42.8732, lng: -8.5485 },
        radius: 450,
        rankPreference: 'DISTANCE',
        includedTypes: ['restaurant', 'tapas_restaurant', 'spanish_restaurant', 'seafood_restaurant'],
      },
      {
        zone: 'Ensanche',
        center: { lat: 42.8732, lng: -8.5485 },
        radius: 450,
        rankPreference: 'DISTANCE',
        includedTypes: ['bar', 'pub', 'wine_bar'],
      },
      {
        zone: 'San Pedro',
        center: { lat: 42.8824, lng: -8.5368 },
        radius: 420,
        rankPreference: 'DISTANCE',
        includedTypes: ['restaurant', 'tapas_restaurant', 'spanish_restaurant', 'seafood_restaurant'],
      },
      {
        zone: 'San Pedro',
        center: { lat: 42.8824, lng: -8.5368 },
        radius: 420,
        rankPreference: 'DISTANCE',
        includedTypes: ['bar', 'pub', 'cafe'],
      },
      {
        zone: 'Zona Vella',
        center: { lat: 42.8794, lng: -8.5446 },
        radius: 380,
        rankPreference: 'DISTANCE',
        includedTypes: ['restaurant', 'tapas_restaurant', 'spanish_restaurant', 'seafood_restaurant'],
      },
      {
        zone: 'Zona Vella',
        center: { lat: 42.8794, lng: -8.5446 },
        radius: 380,
        rankPreference: 'DISTANCE',
        includedTypes: ['bar', 'pub', 'cafe'],
      },
    ],
  },
}

export const FRANCHISE_PATTERNS = [
  /\bmcdonald'?s\b/i,
  /\bburger\s*king\b/i,
  /\bstarbucks\b/i,
  /\b(100|cien)\s*montaditos\b/i,
  /\btelepizza\b/i,
  /\bdomino'?s\b/i,
  /\btaco\s*bell\b/i,
  /\bkfc\b/i,
  /\bvips\b/i,
  /\bginos\b/i,
  /\brodilla\b/i,
  /\bfoster'?s\s*hollywood\b/i,
  /\b(la\s+)?tagliatella\b/i,
  /\bpans\s*(&|and)\s*company\b/i,
  /\bpopeyes\b/i,
  /\bsubway\b/i,
  /\bdunkin\b/i,
  /\btim\s*hortons\b/i,
  /\bgoiko(\s*grill)?\b/i,
  /\bfive\s*guys\b/i,
  /\bcarl'?s\s*jr\b/i,
  /\b(tgb|the\s*good\s*burger)\b/i,
  /\blizarran\b/i,
  /\bla\s*surena\b/i,
  /\bsantagloria\b/i,
  /\bgranier\b/i,
  /\bmanolo\s*bakes\b/i,
  /\bpizza\s*hut\b/i,
  /\bpapa\s*john'?s\b/i,
  /\bmuerde\s*la\s*pasta\b/i,
  /\bhard\s*rock\s*cafe\b/i,
  /\bcosta\s*coffee\b/i,
  /\bmccafe\b/i,
  /\bllaollao\b/i,
  /\bsmooy\b/i,
  /\bla\s*mafia\s*se\s*sienta\b/i,
  /\bvolapie\b/i,
  /\bbrasaylena\b/i,
  /\bpomodoro\b/i,
  /\budon\b/i,
  /\bkrispy\s*kreme\b/i,
  /\bhaagen[\s-]*dazs\b/i,
]

const EXCLUDED_PRIMARY_TYPES = new Set([
  'hotel',
  'lodging',
  'resort_hotel',
  'motel',
  'hostel',
  'bed_and_breakfast',
  'guest_house',
  'gas_station',
  'supermarket',
  'grocery_store',
  'convenience_store',
  'shopping_mall',
  'department_store',
  'market',
  'plaza',
  'park',
  'tourist_attraction',
  'historical_landmark',
  'cultural_landmark',
  'museum',
  'church',
  'event_venue',
  'banquet_hall',
  'night_club',
  'hospital',
  'pharmacy',
  'school',
  'university',
  'gym',
  'movie_theater',
  'parking',
])

const ALLOWED_HOSPITALITY_TYPES = new Set([
  'restaurant',
  'bar',
  'pub',
  'cafe',
  'coffee_shop',
  'bakery',
  'bistro',
  'brasserie',
  'cafeteria',
  'diner',
  'wine_bar',
  'cocktail_bar',
  'gastropub',
  'grill',
  'bar_and_grill',
  'steak_house',
  'sandwich_shop',
  'tea_house',
  'dessert_shop',
  'ice_cream_shop',
  'pastry_shop',
  'meal_takeaway',
  'food_court',
  'chophouse',
])

const NON_VENUE_NAME_PATTERNS = [
  /^(praza|plaza)\s+/i,
  /^mercado\s+de\s+abastos\b/i,
  /^parque\s+/i,
  /^alameda\s+de\s+/i,
]

const FOOD_PRIMARY_TYPES = new Set([
  'restaurant',
  'tapas_restaurant',
  'spanish_restaurant',
  'seafood_restaurant',
  'mediterranean_restaurant',
  'steak_house',
  'pizza_restaurant',
  'hamburger_restaurant',
  'italian_restaurant',
  'grill',
  'bar_and_grill',
  'bar',
  'pub',
  'wine_bar',
  'gastropub',
  'bistro',
  'brasserie',
])

const CAFE_PRIMARY_TYPES = new Set([
  'cafe',
  'coffee_shop',
  'bakery',
  'tea_house',
  'dessert_shop',
  'ice_cream_shop',
  'pastry_shop',
  'breakfast_restaurant',
  'brunch_restaurant',
])

const MENU_PROVIDERS = [
  'carta.menu',
  'qamarero',
  'lacartaa',
  'last.app',
  'menudigital',
  'tucarta',
  'carta-digital',
  'cartadigital',
  'flipdish',
  'gloriafood',
  'deliverect',
  'covermanager',
  'thefork',
  'eltenedor',
  'just-eat',
  'glovoapp',
  'ubereats',
  'fluxo',
  'qr-code-generator',
  'linktr.ee',
  'beacons.ai',
]

export function normalizeText(str) {
  return String(str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

export function normalizeBusinessNameKey(name) {
  let clean = normalizeText(name)
  clean = clean.replace(/\([^)]*\)/g, ' ')
  clean = clean.replace(/['"`´’]/g, '')
  clean = clean.replace(/[^a-z0-9\s]/g, ' ')
  clean = clean.replace(
    /\b(restaurante|bar|cafeteria|cafe|meson|taperia|pizzeria|cervexeria|cerveceria|taberna|pulperia|pulpeira|marisqueria|arroceria|vinoteca|asador|parrillada|bocateria|hamburgueseria|tasca|eventos|noia|santiago|compostela|en|casa|o|a|os|as|el|la|los|las|de|do|da|del)\b/g,
    ' '
  )
  return clean.replace(/\s+/g, ' ').trim()
}

export function buildGoogleReviewUrl(placeId) {
  if (!placeId || typeof placeId !== 'string' || !placeId.trim()) return ''
  return `https://search.google.com/local/writereview?placeid=${encodeURIComponent(placeId.trim())}`
}

export function isFranchiseOrExcluded(place) {
  const name = place?.displayName?.text || place?.name || ''
  const normName = normalizeText(name)
  if (!normName) return true

  for (const rx of FRANCHISE_PATTERNS) {
    if (rx.test(normName)) return true
  }

  for (const rx of NON_VENUE_NAME_PATTERNS) {
    if (rx.test(normName)) return true
  }

  const primaryType = place?.primaryType || ''
  if (primaryType) {
    if (EXCLUDED_PRIMARY_TYPES.has(primaryType)) return true
    if (!ALLOWED_HOSPITALITY_TYPES.has(primaryType) && !primaryType.endsWith('_restaurant') && !primaryType.endsWith('_bar')) {
      return true
    }
  }

  return false
}

export function classifyZone(cityName, address, lat, lng, fallbackZone) {
  const normAddr = normalizeText(address)

  if (cityName === 'Santiago de Compostela') {
    if (
      normAddr.includes('san pedro') ||
      normAddr.includes('porta do camino') ||
      normAddr.includes('concheiros') ||
      normAddr.includes('home santo') ||
      normAddr.includes('belvis') ||
      normAddr.includes('calzada de san pedro') ||
      normAddr.includes('15703')
    ) {
      return 'San Pedro'
    }
    if (
      normAddr.includes('horreo') ||
      normAddr.includes('praza roxa') ||
      normAddr.includes('montero rios') ||
      normAddr.includes('republica do salvador') ||
      normAddr.includes('republica arxentina') ||
      normAddr.includes('santiago de chile') ||
      normAddr.includes('xeneral pardinas') ||
      normAddr.includes('alfredo branas') ||
      normAddr.includes('doutor teixeiro') ||
      normAddr.includes('frei rosendo') ||
      normAddr.includes('rua nova de abaixo') ||
      normAddr.includes('rosalia de castro') ||
      normAddr.includes('fernando iii') ||
      normAddr.includes('mestre mateo') ||
      normAddr.includes('galicia') ||
      normAddr.includes('rosa') ||
      normAddr.includes('carreira do conde') ||
      normAddr.includes('15701')
    ) {
      return 'Ensanche'
    }
    if (
      normAddr.includes('preguntoiro') ||
      normAddr.includes('vilar') ||
      normAddr.includes('raina') ||
      normAddr.includes('franco') ||
      normAddr.includes('san paio') ||
      normAddr.includes('quintana') ||
      normAddr.includes('praterias') ||
      normAddr.includes('obradoiro') ||
      normAddr.includes('abastos') ||
      normAddr.includes('acibecheria') ||
      normAddr.includes('caldeireria') ||
      normAddr.includes('rua nova') ||
      normAddr.includes('orfas') ||
      normAddr.includes('mazarelos') ||
      normAddr.includes('cervantes') ||
      normAddr.includes('san miguel') ||
      normAddr.includes('altamira') ||
      normAddr.includes('tras san fiz') ||
      normAddr.includes('algalia') ||
      normAddr.includes('troia')
    ) {
      return 'Zona Vella'
    }

    // Fallback by closest zone anchor coordinate
    if (typeof lat === 'number' && typeof lng === 'number') {
      const anchors = [
        { zone: 'Ensanche', lat: 42.8748, lng: -8.5468 },
        { zone: 'San Pedro', lat: 42.8825, lng: -8.5382 },
        { zone: 'Zona Vella', lat: 42.8794, lng: -8.5446 },
      ]
      anchors.sort(
        (a, b) =>
          haversineDistanceMeters(lat, lng, a.lat, a.lng) -
          haversineDistanceMeters(lat, lng, b.lat, b.lng)
      )
      return anchors[0].zone
    }

    return fallbackZone || 'Ensanche'
  }

  // Noia zone refinement
  if (normAddr.includes('canton') || normAddr.includes('curro') || normAddr.includes('peregrina') || normAddr.includes('corredoira')) {
    return 'Casco Histórico'
  }
  if (normAddr.includes('alameda')) {
    return 'Alameda'
  }
  if (normAddr.includes('malecon') || normAddr.includes('san lazaro')) {
    return 'Malecón de San Lázaro'
  }
  return fallbackZone || 'Centro Noia'
}

/**
 * Extracts Saturday opening hours string and structured minute intervals [startMin, endMin]
 * from Google Places API (New) regularOpeningHours object.
 * Note: In Places API New, day 0 = Sunday, ..., day 6 = Saturday.
 */
export function parseSaturdayHours(regularOpeningHours) {
  if (!regularOpeningHours || typeof regularOpeningHours !== 'object') {
    return { saturdayHours: '', saturdayClosed: false, intervals: [] }
  }

  let saturdayHours = ''
  const descriptions = Array.isArray(regularOpeningHours.weekdayDescriptions)
    ? regularOpeningHours.weekdayDescriptions
    : []

  for (const desc of descriptions) {
    const norm = normalizeText(desc)
    if (norm.startsWith('sabado:') || norm.startsWith('saturday:')) {
      const idx = desc.indexOf(':')
      saturdayHours = idx >= 0 ? desc.slice(idx + 1).trim() : desc.trim()
      break
    }
  }

  const periods = Array.isArray(regularOpeningHours.periods) ? regularOpeningHours.periods : []
  const intervals = []

  for (const p of periods) {
    if (!p || !p.open) continue
    // 24h all week special case: single period with day 0, hour 0, minute 0 and no close
    if (!p.close && p.open.day === 0 && p.open.hour === 0 && (p.open.minute || 0) === 0 && periods.length === 1) {
      intervals.push({ startMin: 0, endMin: 1440 })
      continue
    }
    if (p.open.day === 6) {
      const startMin = (p.open.hour || 0) * 60 + (p.open.minute || 0)
      let endMin = 1440
      if (p.close) {
        const closeBase = (p.close.hour || 0) * 60 + (p.close.minute || 0)
        endMin = p.close.day === 6 ? closeBase : 1440 + closeBase
      }
      intervals.push({ startMin, endMin })
    }
  }

  // Fallback formatting from periods if weekdayDescriptions wasn't returned
  if (!saturdayHours && intervals.length > 0) {
    const fmt = (mins) => {
      const m = mins % 1440
      const hh = String(Math.floor(m / 60)).padStart(2, '0')
      const mm = String(m % 60).padStart(2, '0')
      return `${hh}:${mm}`
    }
    saturdayHours = intervals.map((i) => `${fmt(i.startMin)}–${fmt(i.endMin)}`).join(', ')
  }

  const normHours = normalizeText(saturdayHours)
  const explicitlyClosed = normHours.includes('cerrado') || normHours.includes('closed')
  const closedByPeriods = periods.length > 0 && intervals.length === 0 && !normHours.includes('24')
  const saturdayClosed = explicitlyClosed || closedByPeriods

  if (saturdayClosed && !saturdayHours) {
    saturdayHours = 'Cerrado'
  }

  return { saturdayHours, saturdayClosed, intervals }
}

/**
 * Checks whether a venue is open during a given Saturday time window [winStartMin, winEndMin].
 * If no periods data is available and not explicitly closed, returns { open: true, confirmed: false }.
 */
export function isOpenInWindow(intervals, saturdayClosed, winStartMin, winEndMin, minOverlapMin = 15) {
  if (saturdayClosed) return { open: false, confirmed: true }
  if (!Array.isArray(intervals) || intervals.length === 0) {
    return { open: true, confirmed: false }
  }

  for (const iv of intervals) {
    const overlapStart = Math.max(iv.startMin, winStartMin)
    const overlapEnd = Math.min(iv.endMin, winEndMin)
    if (overlapEnd - overlapStart >= minOverlapMin) {
      return { open: true, confirmed: true }
    }
  }

  return { open: false, confirmed: true }
}

/**
 * Classifies direct social URLs or PDF URLs before hitting HTTP.
 */
export function preclassifyWebsiteUri(websiteUri) {
  if (!websiteUri || typeof websiteUri !== 'string' || !websiteUri.trim()) {
    return {
      shouldFetch: false,
      online_menu_status: 'none',
      online_menu_url: '',
      instagram_url: '',
      facebook_url: '',
    }
  }

  const clean = websiteUri.trim()
  const lower = clean.toLowerCase()

  if (isValidInstagramProfileUrl(clean)) {
    return {
      shouldFetch: false,
      online_menu_status: 'none',
      online_menu_url: '',
      instagram_url: clean,
      facebook_url: '',
    }
  }

  if (isValidFacebookProfileUrl(clean)) {
    return {
      shouldFetch: false,
      online_menu_status: 'none',
      online_menu_url: '',
      instagram_url: '',
      facebook_url: clean,
    }
  }

  if (lower.endsWith('.pdf') || lower.includes('.pdf?') || lower.includes('drive.google.com/file/')) {
    return {
      shouldFetch: false,
      online_menu_status: 'pdf',
      online_menu_url: clean,
      instagram_url: '',
      facebook_url: '',
    }
  }

  if (MENU_PROVIDERS.some((p) => lower.includes(p))) {
    return {
      shouldFetch: false,
      online_menu_status: 'web_interactive',
      online_menu_url: clean,
      instagram_url: '',
      facebook_url: '',
    }
  }

  return {
    shouldFetch: true,
    online_menu_status: 'unknown',
    online_menu_url: '',
    instagram_url: '',
    facebook_url: '',
  }
}

export function isValidInstagramProfileUrl(urlStr) {
  try {
    const u = new URL(urlStr)
    const host = u.hostname.toLowerCase().replace(/^www\./, '')
    if (host !== 'instagram.com' && host !== 'instagr.am') return false
    const segments = u.pathname.split('/').filter(Boolean)
    if (segments.length === 0) return false
    const first = segments[0].toLowerCase()
    const blocked = new Set([
      'p', 'reel', 'reels', 'stories', 'explore', 'sharer', 'share',
      'accounts', 'developer', 'about', 'legal', 'direct', 'tv', 'tags', 'oauth',
    ])
    if (blocked.has(first)) return false
    return /^[a-z0-9._-]+$/i.test(segments[0])
  } catch {
    return false
  }
}

export function isValidFacebookProfileUrl(urlStr) {
  try {
    const u = new URL(urlStr)
    const host = u.hostname.toLowerCase().replace(/^www\./, '').replace(/^m\./, '')
    if (host !== 'facebook.com' && host !== 'fb.com') return false
    const lowerPath = u.pathname.toLowerCase()
    if (!lowerPath || lowerPath === '/') return false
    const blockedParts = [
      'sharer', 'share.php', '/plugins/', '/dialog/', '/tr', '/login',
      '/privacy', '/policy', '/terms', '/help', '/watch', 'photo.php',
      '/events/', '/hashtag/', '/ads/', '/business/', '/cookie',
    ]
    if (blockedParts.some((b) => lowerPath.includes(b))) return false
    return true
  } catch {
    return false
  }
}

function cleanSocialUrl(urlStr) {
  try {
    const u = new URL(urlStr)
    u.hash = ''
    // Keep profile.php?id=... for Facebook, drop tracking params otherwise
    if (u.pathname.toLowerCase().includes('profile.php') && u.searchParams.get('id')) {
      return `${u.origin}${u.pathname}?id=${u.searchParams.get('id')}`
    }
    return `${u.origin}${u.pathname.replace(/\/+$/, '')}`
  } catch {
    return urlStr
  }
}

/**
 * Pure HTML parser that detects menu links (.pdf vs web interactive vs none)
 * and official Instagram / Facebook URLs without executing JS.
 */
export function extractMenuAndSocialsFromHtml(html, baseUrl) {
  if (!html || typeof html !== 'string') {
    return {
      online_menu_status: 'unknown',
      online_menu_url: '',
      instagram_url: '',
      facebook_url: '',
    }
  }

  const anchors = []
  const anchorRegex = /<a\b[^>]*href\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))[^>]*>([\s\S]*?)<\/a>/gi
  let match
  while ((match = anchorRegex.exec(html)) !== null) {
    const rawHref = (match[1] || match[2] || match[3] || '').trim()
    const rawText = (match[4] || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    if (!rawHref || rawHref.startsWith('#') || rawHref.startsWith('javascript:') || rawHref.startsWith('mailto:') || rawHref.startsWith('tel:')) {
      continue
    }
    try {
      const resolved = new URL(rawHref, baseUrl).toString()
      anchors.push({ href: resolved, text: rawText })
    } catch {
      // ignore malformed URLs
    }
  }

  let instagram_url = ''
  let facebook_url = ''
  let bestPdfMenu = ''
  let bestWebMenu = ''
  let fallbackPdf = ''

  const menuKeywordRx = /\b(carta|menu|raciones|tapas|platos|bebidas|vinos|desayunos|comidas|take\s*away|pedir|order)\b/i
  const strictMenuPathRx = /(carta|menu|men[uú]|raciones|tapas|platos|carta-digital)/i

  for (const { href, text } of anchors) {
    const lowerHref = href.toLowerCase()
    const normText = normalizeText(text)
    const normHref = normalizeText(href)

    if (!instagram_url && isValidInstagramProfileUrl(href)) {
      instagram_url = cleanSocialUrl(href)
      continue
    }
    if (!facebook_url && isValidFacebookProfileUrl(href)) {
      facebook_url = cleanSocialUrl(href)
      continue
    }

    const isPdfLink =
      lowerHref.endsWith('.pdf') ||
      lowerHref.includes('.pdf?') ||
      lowerHref.includes('drive.google.com/file/') ||
      lowerHref.includes('dropbox.com/')

    if (isPdfLink) {
      if (menuKeywordRx.test(normText) || strictMenuPathRx.test(normHref)) {
        if (!bestPdfMenu) bestPdfMenu = href
      } else if (!fallbackPdf && !lowerHref.includes('privacidad') && !lowerHref.includes('legal') && !lowerHref.includes('cookies')) {
        fallbackPdf = href
      }
      continue
    }

    const isProvider = MENU_PROVIDERS.some((p) => lowerHref.includes(p))
    if (isProvider) {
      if (!bestWebMenu) bestWebMenu = href
      continue
    }

    // Internal or external interactive menu route
    if (
      (menuKeywordRx.test(normText) || strictMenuPathRx.test(normHref)) &&
      !lowerHref.includes('privacy') &&
      !lowerHref.includes('privacidad') &&
      !lowerHref.includes('cookies') &&
      !lowerHref.includes('aviso-legal')
    ) {
      if (!bestWebMenu) bestWebMenu = href
    }
  }

  // Also check raw PDF hrefs in iframes/embeds or JSON-LD hasMenu
  if (!bestPdfMenu) {
    const pdfInHtml = html.match(/https?:\/\/[^\s"'<>]+?\.pdf(?:\?[^\s"'<>]*)?/i)
    if (pdfInHtml && !/privacidad|legal|cookie/i.test(pdfInHtml[0])) {
      fallbackPdf = fallbackPdf || pdfInHtml[0]
    }
  }

  let online_menu_status = 'none'
  let online_menu_url = ''

  if (bestPdfMenu) {
    online_menu_status = 'pdf'
    online_menu_url = bestPdfMenu
  } else if (bestWebMenu) {
    online_menu_status = 'web_interactive'
    online_menu_url = bestWebMenu
  } else if (fallbackPdf) {
    online_menu_status = 'pdf'
    online_menu_url = fallbackPdf
  }

  return {
    online_menu_status,
    online_menu_url,
    instagram_url,
    facebook_url,
  }
}

/**
 * Fetches website HTML with 5s AbortController timeout to verify online menu & socials.
 */
export async function enrichWebsite(websiteUri, fetchImpl = fetch) {
  const pre = preclassifyWebsiteUri(websiteUri)
  if (!pre.shouldFetch) {
    return {
      online_menu_status: pre.online_menu_status,
      online_menu_url: pre.online_menu_url,
      instagram_url: pre.instagram_url,
      facebook_url: pre.facebook_url,
    }
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 5000)

  try {
    const res = await fetchImpl(websiteUri, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.9,gl;q=0.8,en;q=0.7',
      },
    })

    if (!res.ok) {
      return {
        online_menu_status: 'unknown',
        online_menu_url: '',
        instagram_url: '',
        facebook_url: '',
      }
    }

    const contentType = (res.headers.get('content-type') || '').toLowerCase()
    if (contentType.includes('application/pdf')) {
      return {
        online_menu_status: 'pdf',
        online_menu_url: res.url || websiteUri,
        instagram_url: '',
        facebook_url: '',
      }
    }

    const html = await res.text()
    return extractMenuAndSocialsFromHtml(html.slice(0, 350000), res.url || websiteUri)
  } catch {
    return {
      online_menu_status: 'unknown',
      online_menu_url: '',
      instagram_url: '',
      facebook_url: '',
    }
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Runs async tasks with strict concurrency cap (default 3).
 */
export async function runWithConcurrency(items, concurrency, workerFn) {
  const results = new Array(items.length)
  let nextIndex = 0

  async function worker() {
    while (nextIndex < items.length) {
      const idx = nextIndex++
      results[idx] = await workerFn(items[idx], idx)
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => worker())
  await Promise.all(workers)
  return results
}

/**
 * Calculates lead_score (0-100), recommended_pitch ('carta_qr' | 'cartel_resenas' | 'ambos'),
 * and compatible 0-10 score + ICP segment (A/B/C).
 */
export function computeLeadScoreAndPitch({
  rating,
  userRatingCount,
  websiteUri,
  onlineMenuStatus,
  primaryType,
  zone,
  city,
  saturdayClosed,
}) {
  const numRating = typeof rating === 'number' ? rating : null
  const numReviews = typeof userRatingCount === 'number' ? userRatingCount : 0
  const normZone = normalizeText(zone)
  const isTouristZone =
    normZone.includes('san pedro') ||
    normZone.includes('zona vella') ||
    normZone.includes('casco historico')
  const isFoodCore = FOOD_PRIMARY_TYPES.has(primaryType || '') || !CAFE_PRIMARY_TYPES.has(primaryType || '')

  // 1. Carta QR opportunity (0-55 pts)
  let qrScore = 0
  if (onlineMenuStatus === 'none' || !websiteUri) {
    qrScore += 35
  } else if (onlineMenuStatus === 'pdf') {
    qrScore += 28
  } else if (onlineMenuStatus === 'unknown') {
    qrScore += 15
  } else {
    qrScore += 5
  }

  qrScore += isFoodCore ? 10 : 5
  if (isTouristZone) {
    qrScore += 10
  } else {
    qrScore += 6
  }

  // 2. Cartel Reseñas / NFC opportunity (0-45 pts)
  let reviewScore = 0
  const ratingInSweetSpot = numRating !== null && numRating >= 3.7 && numRating <= 4.6
  const lowReviewVolume = numReviews > 0 && numReviews < 250

  if (ratingInSweetSpot) {
    reviewScore += 22
  } else if (numRating !== null && numRating >= 3.0 && numRating < 3.7) {
    reviewScore += 12
  } else if (numRating !== null && numRating > 4.6) {
    reviewScore += 8
  } else {
    reviewScore += 10
  }

  if (numReviews > 0 && numReviews < 100) {
    reviewScore += 23
  } else if (lowReviewVolume) {
    reviewScore += 19
  } else if (numReviews >= 250 && numReviews < 500) {
    reviewScore += 10
  } else if (numReviews >= 500) {
    reviewScore += 4
  } else {
    reviewScore += 15
  }

  let penalty = 0
  if (city === 'Santiago de Compostela' && saturdayClosed) {
    penalty += 35
  }

  const lead_score = Math.max(0, Math.min(100, Math.round(qrScore + reviewScore - penalty)))

  const highQrOpp =
    onlineMenuStatus === 'none' ||
    onlineMenuStatus === 'pdf' ||
    !websiteUri ||
    (isFoodCore && isTouristZone)

  const highReviewOpp = ratingInSweetSpot || lowReviewVolume

  let recommended_pitch = 'carta_qr'
  if (highQrOpp && highReviewOpp) {
    recommended_pitch = 'ambos'
  } else if (highQrOpp) {
    recommended_pitch = 'carta_qr'
  } else if (highReviewOpp) {
    recommended_pitch = 'cartel_resenas'
  }

  const score10 = Number((lead_score / 10).toFixed(1))
  const icp_segment = lead_score >= 72 ? 'A' : lead_score >= 52 ? 'B' : 'C'

  return {
    lead_score,
    recommended_pitch,
    score: score10,
    icp_segment,
  }
}

export function haversineDistanceMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000
  const toRad = (deg) => (deg * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return Math.round(R * c)
}

/**
 * Nearest-neighbor ordering with optional destination pull (so Block 5 finishes close to Intermodal).
 */
function orderStopsNearestNeighbor(stops, startCoord, endCoord = null) {
  if (stops.length <= 1) return [...stops]
  const remaining = [...stops]
  const ordered = []
  let current = { lat: startCoord.lat, lng: startCoord.lng }

  while (remaining.length > 0) {
    let bestIdx = 0
    let bestCost = Infinity

    for (let i = 0; i < remaining.length; i++) {
      const s = remaining[i]
      const distFromCurrent = haversineDistanceMeters(current.lat, current.lng, s.lat, s.lng)
      let cost = distFromCurrent
      if (endCoord && remaining.length > 1) {
        // Gently prefer visiting stops further from the final return point earlier,
        // so the last stop naturally ends closest to the Intermodal station.
        const distToEnd = haversineDistanceMeters(s.lat, s.lng, endCoord.lat, endCoord.lng)
        cost = distFromCurrent - distToEnd * 0.25
      }
      if (cost < bestCost) {
        bestCost = cost
        bestIdx = i
      }
    }

    const chosen = remaining.splice(bestIdx, 1)[0]
    ordered.push(chosen)
    current = { lat: chosen.lat, lng: chosen.lng }
  }

  return ordered
}

export const SANTIAGO_BLOCKS = [
  {
    id: 'bloque_1',
    label: 'Bloque 1 (10:00 – 11:30) · Ensanche',
    zones: ['Ensanche'],
    winStartMin: 10 * 60,
    winEndMin: 11 * 60 + 30,
    minOverlapMin: 20,
    avoidCafes: true,
    maxStops: 7,
  },
  {
    id: 'bloque_2',
    label: 'Bloque 2 (11:30 – 12:45) · Barrio de San Pedro',
    zones: ['San Pedro'],
    winStartMin: 11 * 60 + 30,
    winEndMin: 12 * 60 + 45,
    minOverlapMin: 25,
    avoidCafes: false,
    maxStops: 7,
  },
  {
    id: 'bloque_3',
    label: 'Bloque 3 (12:45 – 16:15) · Pausa / Scouting Zona Vella [solo_observar_mediodia]',
    zones: ['Zona Vella'],
    winStartMin: 12 * 60 + 45,
    winEndMin: 16 * 60 + 15,
    minOverlapMin: 60,
    avoidCafes: false,
    maxStops: 5,
    scoutingOnly: true,
  },
  {
    id: 'bloque_4',
    label: 'Bloque 4 (16:30 – 18:30) · Zona Vella y San Pedro tarde',
    zones: ['Zona Vella', 'San Pedro'],
    winStartMin: 16 * 60 + 30,
    winEndMin: 18 * 60 + 30,
    minOverlapMin: 45,
    avoidCafes: false,
    maxStops: 8,
  },
  {
    id: 'bloque_5',
    label: 'Bloque 5 (18:30 – 20:00) · Ensanche de regreso a Intermodal',
    zones: ['Ensanche'],
    winStartMin: 18 * 60 + 30,
    winEndMin: 20 * 60,
    minOverlapMin: 30,
    avoidCafes: false,
    maxStops: 7,
    returnToIntermodal: true,
  },
]

/**
 * Selects the top 25-35 Santiago leads (open on Saturday) and arranges them into
 * a continuous walking loop starting and ending at Estación Intermodal de Santiago.
 */
export function buildSantiagoSaturdayRoute(santiagoLeads, targetMaxStops = 34) {
  const candidates = santiagoLeads
    .filter((l) => !l.saturday_closed && typeof l.lat === 'number' && typeof l.lng === 'number')
    .sort((a, b) => (b.lead_score || 0) - (a.lead_score || 0))

  const usedIds = new Set()
  const orderedRoute = []
  let currentAnchor = { ...SANTIAGO_INTERMODAL }

  for (const block of SANTIAGO_BLOCKS) {
    if (orderedRoute.length >= targetMaxStops) break

    const eligible = candidates.filter((lead) => {
      if (usedIds.has(lead.google_place_id || lead.name)) return false
      if (!block.zones.includes(lead.zone)) return false
      if (block.avoidCafes && CAFE_PRIMARY_TYPES.has(lead.primary_type || '')) {
        return false
      }
      const openCheck = isOpenInWindow(
        lead._saturday_intervals || [],
        Boolean(lead.saturday_closed),
        block.winStartMin,
        block.winEndMin,
        block.minOverlapMin || 15
      )
      return openCheck.open
    })

    // Prioritize by lead_score with a small bonus (+8) when Saturday opening hours are confirmed
    eligible.sort((a, b) => {
      const aConf = isOpenInWindow(a._saturday_intervals || [], false, block.winStartMin, block.winEndMin, block.minOverlapMin || 15).confirmed ? 8 : 0
      const bConf = isOpenInWindow(b._saturday_intervals || [], false, block.winStartMin, block.winEndMin, block.minOverlapMin || 15).confirmed ? 8 : 0
      return ((b.lead_score || 0) + bConf) - ((a.lead_score || 0) + aConf)
    })

    const quota = Math.min(block.maxStops, targetMaxStops - orderedRoute.length)
    const picked = eligible.slice(0, quota)

    const orderedBlock = orderStopsNearestNeighbor(
      picked,
      currentAnchor,
      block.returnToIntermodal ? SANTIAGO_INTERMODAL : null
    )

    for (const stop of orderedBlock) {
      usedIds.add(stop.google_place_id || stop.name)
      const distFromPrev = haversineDistanceMeters(currentAnchor.lat, currentAnchor.lng, stop.lat, stop.lng)
      orderedRoute.push({
        ...stop,
        route_block: block.label,
        route_order: orderedRoute.length + 1,
        distance_from_prev_m: distFromPrev,
      })
      currentAnchor = { lat: stop.lat, lng: stop.lng }
    }
  }

  const returnToIntermodalMeters =
    orderedRoute.length > 0
      ? haversineDistanceMeters(currentAnchor.lat, currentAnchor.lng, SANTIAGO_INTERMODAL.lat, SANTIAGO_INTERMODAL.lng)
      : 0

  const totalWalkingMeters =
    orderedRoute.reduce((acc, s) => acc + (s.distance_from_prev_m || 0), 0) + returnToIntermodalMeters

  return {
    route: orderedRoute,
    totalWalkingMeters,
    returnToIntermodalMeters,
  }
}

/**
 * Duplicate-free merge of newly enriched leads into existing CRM leads array.
 * Preserves all existing commercial notes, status, pilot data, and contact info.
 */
export function mergeLeadsIntoCRM(existingLeads, incomingLeads) {
  const merged = existingLeads.map((l) => ({ ...l }))
  const byPlaceId = new Map()
  const byNameCity = new Map()

  const cityOf = (l) => {
    const raw = normalizeText(l.city || '')
    if (raw.includes('santiago')) return 'santiago'
    const z = normalizeText(l.zone || '')
    if (z.includes('ensanche') || z.includes('san pedro') || z.includes('zona vella')) return 'santiago'
    return 'noia'
  }

  merged.forEach((lead, idx) => {
    if (lead.google_place_id) {
      byPlaceId.set(lead.google_place_id, idx)
    }
    const key = `${cityOf(lead)}::${normalizeBusinessNameKey(lead.name)}`
    if (key && !byNameCity.has(key)) {
      byNameCity.set(key, idx)
    }
  })

  let updatedCount = 0
  let insertedCount = 0
  const nowIso = new Date().toISOString()

  for (const inc of incomingLeads) {
    const cleanInc = { ...inc }
    const matchExistingName = cleanInc._match_existing_name
    delete cleanInc._saturday_intervals
    delete cleanInc.distance_from_prev_m
    delete cleanInc._match_existing_name

    const incCityKey = cityOf(cleanInc)
    const nameKey = `${incCityKey}::${normalizeBusinessNameKey(cleanInc.name)}`
    const explicitKey = matchExistingName ? `${incCityKey}::${normalizeBusinessNameKey(matchExistingName)}` : ''

    let matchIdx = -1
    if (cleanInc.google_place_id && byPlaceId.has(cleanInc.google_place_id)) {
      matchIdx = byPlaceId.get(cleanInc.google_place_id)
    } else if (explicitKey && byNameCity.has(explicitKey)) {
      matchIdx = byNameCity.get(explicitKey)
    } else if (byNameCity.has(nameKey)) {
      matchIdx = byNameCity.get(nameKey)
    }

    if (matchIdx >= 0) {
      const prev = merged[matchIdx]
      merged[matchIdx] = {
        ...prev,
        // Preserve commercial fields (notes, status, contact_name, pilot_*, plan, existing zone)
        city: prev.city || cleanInc.city || 'Noia',
        zone: prev.zone || cleanInc.zone,
        address: prev.address || cleanInc.address,
        contact_phone: prev.contact_phone || cleanInc.contact_phone || null,
        contact_whatsapp: prev.contact_whatsapp || cleanInc.contact_whatsapp || null,
        instagram: prev.instagram || cleanInc.instagram_url || null,
        lat: cleanInc.lat ?? prev.lat ?? null,
        lng: cleanInc.lng ?? prev.lng ?? null,
        // Fresh Google Maps & online enrichment fields
        google_place_id: cleanInc.google_place_id || prev.google_place_id || null,
        google_profile_url: cleanInc.google_profile_url || prev.google_profile_url || null,
        google_review_url: cleanInc.google_review_url || prev.google_review_url || null,
        website_url: cleanInc.website_url || prev.website_url || null,
        online_menu_status: cleanInc.online_menu_status || prev.online_menu_status || 'unknown',
        online_menu_url: cleanInc.online_menu_url || prev.online_menu_url || null,
        instagram_url: cleanInc.instagram_url || prev.instagram_url || null,
        facebook_url: cleanInc.facebook_url || prev.facebook_url || null,
        google_rating: cleanInc.google_rating ?? prev.google_rating ?? null,
        google_reviews_count: cleanInc.google_reviews_count ?? prev.google_reviews_count ?? null,
        saturday_hours: cleanInc.saturday_hours || prev.saturday_hours || null,
        saturday_closed: cleanInc.saturday_closed ?? prev.saturday_closed ?? false,
        lead_score: cleanInc.lead_score ?? prev.lead_score ?? null,
        recommended_pitch: cleanInc.recommended_pitch || prev.recommended_pitch || null,
        primary_type: cleanInc.primary_type || prev.primary_type || null,
        route_block: cleanInc.route_block !== undefined ? cleanInc.route_block : (prev.route_block ?? null),
        route_order: cleanInc.route_order !== undefined ? cleanInc.route_order : (prev.route_order ?? null),
        updated_at: nowIso,
      }
      if (cleanInc.google_place_id) {
        byPlaceId.set(cleanInc.google_place_id, matchIdx)
      }
      updatedCount += 1
    } else {
      const newRecord = {
        id: cleanInc.id,
        name: cleanInc.name,
        address: cleanInc.address,
        city: cleanInc.city,
        zone: cleanInc.zone,
        icp_segment: cleanInc.icp_segment || 'B',
        contact_name: null,
        contact_phone: cleanInc.contact_phone || null,
        contact_whatsapp: cleanInc.contact_whatsapp || null,
        instagram: cleanInc.instagram_url || null,
        google_rating: cleanInc.google_rating ?? null,
        google_reviews_count: cleanInc.google_reviews_count ?? null,
        score: cleanInc.score ?? 5.0,
        status: 'lead_por_visitar',
        target_plan: cleanInc.recommended_pitch === 'ambos' ? 'fundador_50' : 'carta_15',
        mrr_projected: cleanInc.recommended_pitch === 'ambos' ? 50 : 15,
        pilot_start_date: null,
        pilot_end_date: null,
        last_visit_date: null,
        next_contact_date: null,
        notes: null,
        lost_reason: null,
        lat: cleanInc.lat ?? null,
        lng: cleanInc.lng ?? null,
        google_place_id: cleanInc.google_place_id || null,
        google_profile_url: cleanInc.google_profile_url || null,
        google_review_url: cleanInc.google_review_url || null,
        website_url: cleanInc.website_url || null,
        online_menu_status: cleanInc.online_menu_status || 'unknown',
        online_menu_url: cleanInc.online_menu_url || null,
        instagram_url: cleanInc.instagram_url || null,
        facebook_url: cleanInc.facebook_url || null,
        saturday_hours: cleanInc.saturday_hours || null,
        saturday_closed: cleanInc.saturday_closed ?? false,
        lead_score: cleanInc.lead_score ?? 50,
        recommended_pitch: cleanInc.recommended_pitch || 'carta_qr',
        primary_type: cleanInc.primary_type || null,
        route_block: cleanInc.route_block ?? null,
        route_order: cleanInc.route_order ?? null,
        attachments: [],
        created_at: nowIso,
        updated_at: nowIso,
      }
      const newIdx = merged.length
      merged.push(newRecord)
      if (newRecord.google_place_id) byPlaceId.set(newRecord.google_place_id, newIdx)
      byNameCity.set(nameKey, newIdx)
      insertedCount += 1
    }
  }

  return { merged, updatedCount, insertedCount }
}

/**
 * Builds UTF-8 BOM CSV with exact mandatory columns.
 */
export function buildProspectorCSV(rows, includeOrderColumn = true) {
  const headers = includeOrderColumn
    ? [
        'orden_parada',
        'bloque_horario',
        'zona',
        'nombre',
        'tipo',
        'rating',
        'total_resenas',
        'horario_sabado',
        'propuesta_recomendada',
        'score',
        'estado_menu_online',
        'url_menu_online',
        'url_perfil_google',
        'url_directa_resenas',
        'instagram',
        'facebook',
        'telefono',
        'direccion',
      ]
    : [
        'bloque_horario',
        'zona',
        'nombre',
        'tipo',
        'rating',
        'total_resenas',
        'horario_sabado',
        'propuesta_recomendada',
        'score',
        'estado_menu_online',
        'url_menu_online',
        'url_perfil_google',
        'url_directa_resenas',
        'instagram',
        'facebook',
        'telefono',
        'direccion',
      ]

  const esc = (val) => {
    if (val === null || val === undefined) return '""'
    return `"${String(val).replace(/"/g, '""')}"`
  }

  const csvLines = rows.map((r) => {
    const baseCols = [
      esc(r.route_block || ''),
      esc(r.zone || ''),
      esc(r.name || ''),
      esc(r.primary_type || ''),
      r.google_rating ?? '',
      r.google_reviews_count ?? '',
      esc(r.saturday_hours || ''),
      esc(r.recommended_pitch || ''),
      r.lead_score ?? '',
      esc(r.online_menu_status || 'unknown'),
      esc(r.online_menu_url || ''),
      esc(r.google_profile_url || ''),
      esc(r.google_review_url || ''),
      esc(r.instagram_url || r.instagram || ''),
      esc(r.facebook_url || ''),
      esc(r.contact_phone || ''),
      esc(r.address || ''),
    ]
    if (includeOrderColumn) {
      return [r.route_order ?? '', ...baseCols].join(',')
    }
    return baseCols.join(',')
  })

  return '\uFEFF' + [headers.join(','), ...csvLines].join('\r\n')
}
