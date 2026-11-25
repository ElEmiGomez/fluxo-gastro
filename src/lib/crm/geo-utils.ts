import { CRMLead } from '@/types/crm.types'

export const NOIA_CENTER_COORDINATES = {
  lat: 42.7840,
  lng: -8.8885,
  zoom: 17,
}

export const SANTIAGO_CENTER_COORDINATES = {
  lat: 42.8782,
  lng: -8.5448,
  zoom: 15,
}

export const SANTIAGO_INTERMODAL_COORDINATES = {
  lat: 42.8705,
  lng: -8.5453,
}

export const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  'Santiago de Compostela': { lat: 42.8782, lng: -8.5448 },
  'Noia': { lat: 42.7840, lng: -8.8885 },
  'A Coruña': { lat: 43.3623, lng: -8.4115 },
  'Vigo': { lat: 42.2406, lng: -8.7207 },
  'Pontevedra': { lat: 42.4336, lng: -8.6479 },
  'Ourense': { lat: 42.3358, lng: -7.8639 },
  'Lugo': { lat: 43.0125, lng: -7.5558 },
  'Vilagarcía de Arousa': { lat: 42.5964, lng: -8.7645 },
  'Ribeira': { lat: 42.5544, lng: -8.9922 },
  'Boiro': { lat: 42.6483, lng: -8.8828 },
}

// Coordenadas geográficas auditadas para los establecimientos de Noia (calibradas sin colisiones)
export const NOIA_ESTABLISHMENT_COORDINATES: Record<string, { lat: number; lng: number }> = {
  'Tapería Adega do Pazo': { lat: 42.78455, lng: -8.88935 },
  'Pizzería Mamma Mía': { lat: 42.78310, lng: -8.88725 },
  'Restaurante El Txoko': { lat: 42.78360, lng: -8.88940 },
  'Arrocería Baobab': { lat: 42.78435, lng: -8.88615 },
  'Forno do Rato': { lat: 42.78350, lng: -8.88560 },
  'Cervexería Equs': { lat: 42.78480, lng: -8.88685 },
  'Cafetería / Cervexería Equs': { lat: 42.78480, lng: -8.88685 },
  'Cafetería Equs': { lat: 42.78480, lng: -8.88685 },
  'A Taberna de Lelo': { lat: 42.78400, lng: -8.89005 },
  'La Parra Tapería': { lat: 42.78485, lng: -8.88895 },
  'Pizzería Venecia': { lat: 42.78335, lng: -8.88635 },
  'Casa Mar da Vila': { lat: 42.78490, lng: -8.88860 },
  'Don Juan Gastrofusión': { lat: 42.78480, lng: -8.88600 },
  'Cafetería Jaque': { lat: 42.78500, lng: -8.88570 },
  'Cafetería Baobab (Alameda)': { lat: 42.78455, lng: -8.88655 },
  'Casa Toxeira': { lat: 42.78380, lng: -8.88760 },
  'Babilonia Brunch': { lat: 42.78435, lng: -8.88955 },
  'Tasca Típica Noia': { lat: 42.78470, lng: -8.88915 },
  'Mesón O Forno (O Forno da Ría)': { lat: 42.78530, lng: -8.89050 },
  'Restaurante Ferrador': { lat: 42.78400, lng: -8.89030 },
  'Restaurante 3 Pés': { lat: 42.78020, lng: -8.88250 },
  'A Boca do Lobo Cotton': { lat: 42.78280, lng: -8.88640 },
  'Restaurante Mesturas': { lat: 42.78550, lng: -8.89180 },
  'Bar Tamara': { lat: 42.78310, lng: -8.88865 },
  'Casa Xiada Bar': { lat: 42.78370, lng: -8.88790 },
  'Café Bar Montreal': { lat: 42.78390, lng: -8.88710 },
  'Áncora': { lat: 42.78600, lng: -8.89110 },
  'Restaurante Hostal Valadares': { lat: 42.78350, lng: -8.88715 },
  'Mesón Senra': { lat: 42.78280, lng: -8.88745 },
  'O Churrasco do Floro': { lat: 42.77940, lng: -8.88380 },
  'Hotel Restaurante Elisardo': { lat: 42.78300, lng: -8.88800 },
  'Restaurante Marico': { lat: 42.78360, lng: -8.88820 },
  'Café Bar Chelino': { lat: 42.78260, lng: -8.88690 },
  'Costiña': { lat: 42.78345, lng: -8.88895 },
  'A Tafona do Cantón': { lat: 42.78120, lng: -8.88420 },
  'Cociña A de Pepe': { lat: 42.78415, lng: -8.88975 },
  "Ril's": { lat: 42.78325, lng: -8.88670 },
}

// Centros aproximados por zona para nuevos locales sin geocodificación explícita
export const ZONE_CENTERS: Record<string, { lat: number; lng: number }> = {
  'Casco Histórico': { lat: 42.7842, lng: -8.8895 },
  'Centro': { lat: 42.7833, lng: -8.8873 },
  'Centro Noia': { lat: 42.7840, lng: -8.8878 },
  'Noia Centro': { lat: 42.7835, lng: -8.8878 },
  'Alameda': { lat: 42.7846, lng: -8.8864 },
  'Cantón': { lat: 42.7845, lng: -8.8894 },
  'Curro': { lat: 42.7833, lng: -8.8888 },
  'Malecón de San Lázaro': { lat: 42.7860, lng: -8.8912 },
  'Malecón': { lat: 42.7860, lng: -8.8912 },
  'Portus Apostoli': { lat: 42.7868, lng: -8.8932 },
  'Barro / Periferia': { lat: 42.7798, lng: -8.8835 },
  'Periferia': { lat: 42.7800, lng: -8.8830 },
  // Santiago de Compostela
  'Ensanche': { lat: 42.8748, lng: -8.5468 },
  'San Pedro': { lat: 42.8825, lng: -8.5382 },
  'Zona Vella': { lat: 42.8794, lng: -8.5446 },
}

/**
 * Genera un desplazamiento pseudoaleatorio determinista para que locales en la misma zona
 * no se superpongan exactamente en el mismo píxel.
 */
function getDeterministicOffset(str: string): { dLat: number; dLng: number } {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0
  }
  const factorLat = ((hash % 100) / 100) * 0.0006 - 0.0003
  const factorLng = (((hash >> 2) % 100) / 100) * 0.0006 - 0.0003
  return { dLat: factorLat, dLng: factorLng }
}

/**
 * Obtiene las coordenadas precisas de un lead (del propio lead, del mapa de Noia, o de su zona)
 */
export function getLeadCoordinates(lead: CRMLead): { lat: number; lng: number } {
  if (typeof lead.lat === 'number' && typeof lead.lng === 'number' && !isNaN(lead.lat) && !isNaN(lead.lng)) {
    return { lat: lead.lat, lng: lead.lng }
  }

  const normalizedName = lead.name.trim()
  if (NOIA_ESTABLISHMENT_COORDINATES[normalizedName]) {
    return NOIA_ESTABLISHMENT_COORDINATES[normalizedName]
  }

  // Búsqueda parcial por nombre (solo para locales de Noia)
  if (!lead.city || lead.city === 'Noia') {
    for (const [key, coords] of Object.entries(NOIA_ESTABLISHMENT_COORDINATES)) {
      if (normalizedName.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(normalizedName.toLowerCase())) {
        return coords
      }
    }
  }

  // Fallback por zona o ciudad con dispersión determinista
  const defaultCenter = (lead.city && CITY_COORDINATES[lead.city]) || (lead.city === 'Santiago de Compostela' ? SANTIAGO_CENTER_COORDINATES : NOIA_CENTER_COORDINATES)
  const zoneCenter = ZONE_CENTERS[lead.zone] || defaultCenter
  const offset = getDeterministicOffset(lead.id || lead.name)

  return {
    lat: zoneCenter.lat + offset.dLat,
    lng: zoneCenter.lng + offset.dLng,
  }
}

/**
 * Distancia Haversine entre dos coordenadas en kilómetros.
 */
export function haversineDistanceKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const R = 6371
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const sinLat = Math.sin(dLat / 2)
  const sinLng = Math.sin(dLng / 2)
  const h =
    sinLat * sinLat +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinLng * sinLng
  return 2 * R * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
}

/**
 * Optimiza el orden de una ruta de visitas empezando por la primera parada elegida
 * (heurística Nearest Neighbor por distancia real).
 */
export function optimizeVisitRoute(leads: CRMLead[]): CRMLead[] {
  if (leads.length <= 2) return leads
  const remaining = leads.slice(1)
  const ordered: CRMLead[] = [leads[0]]

  while (remaining.length > 0) {
    const currentCoords = getLeadCoordinates(ordered[ordered.length - 1])
    let bestIdx = 0
    let bestDist = Infinity

    for (let i = 0; i < remaining.length; i++) {
      const dist = haversineDistanceKm(currentCoords, getLeadCoordinates(remaining[i]))
      if (dist < bestDist) {
        bestDist = dist
        bestIdx = i
      }
    }

    ordered.push(remaining.splice(bestIdx, 1)[0])
  }

  return ordered
}

/**
 * Calcula distancia total estimada caminando (factor urbano 1.25) y minutos a pie (~4.5 km/h).
 */
export function calculateRouteStats(leads: CRMLead[]): {
  distanceKm: number
  walkingMinutes: number
} {
  if (leads.length < 2) return { distanceKm: 0, walkingMinutes: 0 }
  let rawKm = 0
  for (let i = 0; i < leads.length - 1; i++) {
    rawKm += haversineDistanceKm(getLeadCoordinates(leads[i]), getLeadCoordinates(leads[i + 1]))
  }
  const distanceKm = rawKm * 1.25
  const walkingMinutes = Math.max(1, Math.round((distanceKm / 4.5) * 60))
  return { distanceKm, walkingMinutes }
}

/**
 * Genera el enlace oficial de Google Maps con ruta a pie paso a paso.
 * Google Maps admite hasta 9 waypoints intermedios (11 paradas en total por enlace).
 */
export function buildGoogleMapsWalkingRouteUrl(leads: CRMLead[]): string | null {
  if (leads.length === 0) return null
  if (leads.length === 1) {
    const c = getLeadCoordinates(leads[0])
    return `https://www.google.com/maps/dir/?api=1&travelmode=walking&destination=${c.lat},${c.lng}`
  }

  const capped = leads.slice(0, 11)
  const first = getLeadCoordinates(capped[0])
  const last = getLeadCoordinates(capped[capped.length - 1])
  const middle = capped.slice(1, -1).map((l) => {
    const c = getLeadCoordinates(l)
    return `${c.lat},${c.lng}`
  })

  const params = new URLSearchParams({
    api: '1',
    travelmode: 'walking',
    origin: `${first.lat},${first.lng}`,
    destination: `${last.lat},${last.lng}`,
  })
  if (middle.length > 0) {
    params.set('waypoints', middle.join('|'))
  }
  return `https://www.google.com/maps/dir/?${params.toString()}`
}
