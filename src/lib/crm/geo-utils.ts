import { CRMLead } from '@/types/crm.types'

export const NOIA_CENTER_COORDINATES = {
  lat: 42.7842,
  lng: -8.8885,
  zoom: 16,
}

// Coordenadas geográficas auditadas para los establecimientos de Noia
export const NOIA_ESTABLISHMENT_COORDINATES: Record<string, { lat: number; lng: number }> = {
  'Tapería Adega do Pazo': { lat: 42.7846, lng: -8.8893 },
  'Pizzería Mamma Mía': { lat: 42.7831, lng: -8.8872 },
  'Restaurante El Txoko': { lat: 42.7836, lng: -8.8894 },
  'Arrocería Baobab': { lat: 42.7844, lng: -8.8863 },
  'Forno do Rato': { lat: 42.7835, lng: -8.8856 },
  'Cervexería Equs': { lat: 42.7847, lng: -8.8867 },
  'A Taberna de Lelo': { lat: 42.7841, lng: -8.8899 },
  'La Parra Tapería': { lat: 42.7848, lng: -8.8891 },
  'Pizzería Venecia': { lat: 42.7833, lng: -8.8865 },
  'Casa Mar da Vila': { lat: 42.7849, lng: -8.8886 },
  'Don Juan Gastrofusión': { lat: 42.7848, lng: -8.8860 },
  'Cafetería Jaque': { lat: 42.7850, lng: -8.8857 },
  'Cafetería Baobab (Alameda)': { lat: 42.7845, lng: -8.8865 },
  'Casa Toxeira': { lat: 42.7838, lng: -8.8876 },
  'Babilonia Brunch': { lat: 42.7844, lng: -8.8895 },
  'Tasca Típica Noia': { lat: 42.7847, lng: -8.8892 },
  'Mesón O Forno (O Forno da Ría)': { lat: 42.7853, lng: -8.8905 },
  'Restaurante Ferrador': { lat: 42.7840, lng: -8.8902 },
  'Restaurante 3 Pés': { lat: 42.7802, lng: -8.8825 },
  'A Boca do Lobo Cotton': { lat: 42.7828, lng: -8.8864 },
  'Restaurante Mesturas': { lat: 42.7855, lng: -8.8918 },
  'Bar Tamara': { lat: 42.7832, lng: -8.8887 },
  'Casa Xiada Bar': { lat: 42.7837, lng: -8.8879 },
  'Café Bar Montreal': { lat: 42.7839, lng: -8.8871 },
  'Áncora': { lat: 42.7860, lng: -8.8911 },
  'Restaurante Hostal Valadares': { lat: 42.7834, lng: -8.8870 },
  'Mesón Senra': { lat: 42.7829, lng: -8.8874 },
  'O Churrasco do Floro': { lat: 42.7794, lng: -8.8838 },
  'Hotel Restaurante Elisardo': { lat: 42.7830, lng: -8.8880 },
  'Restaurante Marico': { lat: 42.7836, lng: -8.8882 },
  'Café Bar Chelino': { lat: 42.7826, lng: -8.8869 },
  'Costiña': { lat: 42.7834, lng: -8.8889 },
  'A Tafona do Cantón': { lat: 42.7812, lng: -8.8842 },
  'Cociña A de Pepe': { lat: 42.7843, lng: -8.8896 },
}

// Centros aproximados por zona para nuevos locales sin geocodificación explícita
export const ZONE_CENTERS: Record<string, { lat: number; lng: number }> = {
  'Casco Histórico': { lat: 42.7842, lng: -8.8895 },
  'Centro': { lat: 42.7833, lng: -8.8873 },
  'Noia Centro': { lat: 42.7835, lng: -8.8878 },
  'Alameda': { lat: 42.7846, lng: -8.8864 },
  'Cantón': { lat: 42.7845, lng: -8.8894 },
  'Curro': { lat: 42.7833, lng: -8.8888 },
  'Malecón de San Lázaro': { lat: 42.7860, lng: -8.8912 },
  'Malecón': { lat: 42.7860, lng: -8.8912 },
  'Portus Apostoli': { lat: 42.7868, lng: -8.8932 },
  'Barro / Periferia': { lat: 42.7798, lng: -8.8835 },
  'Periferia': { lat: 42.7800, lng: -8.8830 },
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

  // Búsqueda parcial por nombre
  for (const [key, coords] of Object.entries(NOIA_ESTABLISHMENT_COORDINATES)) {
    if (normalizedName.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(normalizedName.toLowerCase())) {
      return coords
    }
  }

  // Fallback por zona con dispersión determinista
  const zoneCenter = ZONE_CENTERS[lead.zone] || NOIA_CENTER_COORDINATES
  const offset = getDeterministicOffset(lead.id || lead.name)

  return {
    lat: zoneCenter.lat + offset.dLat,
    lng: zoneCenter.lng + offset.dLng,
  }
}
