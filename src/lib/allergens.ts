/**
 * REGLAMENTO (UE) Nº 1169/2011 — INFORMACIÓN ALIMENTARIA FACILITADA AL CONSUMIDOR
 * Catálogo canónico de los 14 alérgenos de declaración obligatoria en la Unión Europea.
 * Soporta traducción oficial en el Top 10 de idiomas de Europa y la Península Ibérica.
 */

export type AllergenLang = 'gl' | 'es' | 'en' | 'fr' | 'de' | 'pt' | 'it' | 'nl' | 'ca' | 'eu'

export interface AllergenDefinition {
  id: string
  icon: string
  name: Record<AllergenLang | string, string>
}

export const MANDATORY_EU_ALLERGENS: AllergenDefinition[] = [
  {
    id: 'gluten',
    icon: '🌾',
    name: {
      gl: 'Glute (Cereais con glute)',
      es: 'Gluten (Cereales con gluten)',
      en: 'Gluten (Cereals containing gluten)',
      fr: 'Gluten (Céréales contenant du gluten)',
      de: 'Gluten (Glutenhaltiges Getreide)',
      pt: 'Glúten (Cereais com glúten)',
      it: 'Glutine (Cereali contenenti glutine)',
      nl: 'Gluten (Glutenbevattende granen)',
      ca: 'Gluten (Cereals que contenen gluten)',
      eu: 'Glutena (Glutendun zerealak)',
    },
  },
  {
    id: 'crustaceans',
    icon: '🦐',
    name: {
      gl: 'Crustáceos',
      es: 'Crustáceos',
      en: 'Crustaceans',
      fr: 'Crustacés',
      de: 'Krebstiere',
      pt: 'Crustáceos',
      it: 'Crostacei',
      nl: 'Schaaldieren',
      ca: 'Crustacis',
      eu: 'Krustazeoak',
    },
  },
  {
    id: 'eggs',
    icon: '🥚',
    name: {
      gl: 'Ovos e derivados',
      es: 'Huevos y derivados',
      en: 'Eggs and derivatives',
      fr: 'Œufs et dérivés',
      de: 'Eier und Eierzeugnisse',
      pt: 'Ovos e derivados',
      it: 'Uova e derivati',
      nl: 'Eieren en eiproducten',
      ca: 'Ous i derivats',
      eu: 'Arrautzak eta eratorriak',
    },
  },
  {
    id: 'fish',
    icon: '🐟',
    name: {
      gl: 'Peixe e derivados',
      es: 'Pescado y derivados',
      en: 'Fish and derivatives',
      fr: 'Poissons et dérivés',
      de: 'Fisch und Fischerzeugnisse',
      pt: 'Peixe e derivados',
      it: 'Pesce e derivati',
      nl: 'Vis en visproducten',
      ca: 'Peix i derivats',
      eu: 'Arraina eta eratorriak',
    },
  },
  {
    id: 'peanuts',
    icon: '🥜',
    name: {
      gl: 'Cacahuetes',
      es: 'Cacahuetes',
      en: 'Peanuts',
      fr: 'Arachides',
      de: 'Erdnüsse',
      pt: 'Amendoins',
      it: 'Arachidi',
      nl: 'Pinda\'s',
      ca: 'Cacauets',
      eu: 'Kakahueteak',
    },
  },
  {
    id: 'soy',
    icon: '🌱',
    name: {
      gl: 'Soia e derivados',
      es: 'Soja y derivados',
      en: 'Soy and derivatives',
      fr: 'Soja et dérivés',
      de: 'Soja und Sojaerzeugnisse',
      pt: 'Soja e derivados',
      it: 'Soia e derivati',
      nl: 'Soja en sojaproducten',
      ca: 'Soia i derivats',
      eu: 'Soja eta eratorriak',
    },
  },
  {
    id: 'dairy',
    icon: '🥛',
    name: {
      gl: 'Lácteos e derivados (Lactosa)',
      es: 'Lácteos y derivados (Lactosa)',
      en: 'Dairy and milk (Lactose)',
      fr: 'Lait et produits laitiers (Lactose)',
      de: 'Milch und Laktose',
      pt: 'Laticínios e derivados (Lactose)',
      it: 'Latte e derivati (Lattosio)',
      nl: 'Melk en zuivelproducten (Lactose)',
      ca: 'Llet i derivats (Lactosa)',
      eu: 'Esnekiak eta eratorriak (Laktosa)',
    },
  },
  {
    id: 'nuts',
    icon: '🌰',
    name: {
      gl: 'Froitos de casca (Noces, améndoas)',
      es: 'Frutos de cáscara (Nueces, almendras)',
      en: 'Tree nuts (Walnuts, almonds)',
      fr: 'Fruits à coque (Noix, amandes)',
      de: 'Schalenfrüchte (Nüsse, Mandeln)',
      pt: 'Frutos de casca rija (Nozes, amêndoas)',
      it: 'Frutta a guscio (Noci, mandorle)',
      nl: 'Noten (Walnoten, amandelen)',
      ca: 'Fruits de closca (Nous, ametlles)',
      eu: 'Oskoldun fruituak (Intxaurrak, almendrak)',
    },
  },
  {
    id: 'celery',
    icon: '🥬',
    name: {
      gl: 'Apio e derivados',
      es: 'Apio y derivados',
      en: 'Celery and derivatives',
      fr: 'Céleri et dérivés',
      de: 'Sellerie und Sellerieerzeugnisse',
      pt: 'Aipo e derivados',
      it: 'Sedano e derivati',
      nl: 'Selderij en selderijproducten',
      ca: 'Api i derivats',
      eu: 'Apioa eta eratorriak',
    },
  },
  {
    id: 'mustard',
    icon: '🟡',
    name: {
      gl: 'Mostaza e derivados',
      es: 'Mostaza y derivados',
      en: 'Mustard and derivatives',
      fr: 'Moutarde et dérivés',
      de: 'Senf und Senferzeugnisse',
      pt: 'Mostarda e derivados',
      it: 'Senape e derivati',
      nl: 'Mosterd en mosterdproducten',
      ca: 'Mostassa i derivats',
      eu: 'Mostaza eta eratorriak',
    },
  },
  {
    id: 'sesame',
    icon: '⚪',
    name: {
      gl: 'Sésamo (Xonxolí)',
      es: 'Granos de sésamo',
      en: 'Sesame seeds',
      fr: 'Graines de sésame',
      de: 'Sesamsamen',
      pt: 'Sementes de sésamo',
      it: 'Semi di sesamo',
      nl: 'Sesamzaad',
      ca: 'Grans de sèsam',
      eu: 'Sesamo haziak',
    },
  },
  {
    id: 'sulfites',
    icon: '🍷',
    name: {
      gl: 'Sulfitos e dióxido de xofre',
      es: 'Sulfitos y dióxido de azufre',
      en: 'Sulphites and sulphur dioxide',
      fr: 'Sulfites et anhydride sulfureux',
      de: 'Schwefeldioxid und Sulfite',
      pt: 'Sulfitos e dióxido de enxofre',
      it: 'Solfiti e anidride solforosa',
      nl: 'Zwaveldioxide en sulfieten',
      ca: 'Sulfits i diòxid de sofre',
      eu: 'Sulfitoak eta sufre dioxidoa',
    },
  },
  {
    id: 'lupin',
    icon: '🌿',
    name: {
      gl: 'Altramuces (Chichos)',
      es: 'Altramuces',
      en: 'Lupin',
      fr: 'Lupin',
      de: 'Lupinen',
      pt: 'Tremoços',
      it: 'Lupini',
      nl: 'Lupine',
      ca: 'Altressos / Tramussos',
      eu: 'Lupinuak',
    },
  },
  {
    id: 'molluscs',
    icon: '🦪',
    name: {
      gl: 'Moluscos (Mexillóns, luras)',
      es: 'Moluscos (Mejillones, calamares)',
      en: 'Molluscs (Mussels, squid)',
      fr: 'Mollusques (Moules, calamars)',
      de: 'Weichtiere (Muscheln, Tintenfische)',
      pt: 'Moluscos (Mexilhões, lulas)',
      it: 'Molluschi (Cozze, calamari)',
      nl: 'Weekdieren (Mosselen, inktvis)',
      ca: 'Mol·luscs (Musclos, calamars)',
      eu: 'Moluskuak (Muskuiluak, txipiroiak)',
    },
  },
]

export const ALLERGENS_MAP = new Map<string, AllergenDefinition>(
  MANDATORY_EU_ALLERGENS.map(a => [a.id, a])
)

export function getAllergen(id: string): AllergenDefinition | undefined {
  return ALLERGENS_MAP.get(id.toLowerCase().trim())
}

export function getAllergenName(id: string, lang: AllergenLang | string = 'gl'): string {
  const allergen = getAllergen(id)
  if (!allergen) return id
  return allergen.name[lang] || allergen.name.gl || allergen.name.es || id
}
