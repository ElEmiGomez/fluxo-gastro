/**
 * REGLAMENTO (UE) Nº 1169/2011 — INFORMACIÓN ALIMENTARIA FACILITADA AL CONSUMIDOR
 * Catálogo canónico de los 14 alérgenos de declaración obligatoria en la Unión Europea.
 * Soporta traducción trilingüe oficial: Galego (gl), Español (es) e Inglés (en).
 */

export interface AllergenDefinition {
  id: string
  icon: string
  name: {
    gl: string
    es: string
    en: string
  }
}

export const MANDATORY_EU_ALLERGENS: AllergenDefinition[] = [
  {
    id: 'gluten',
    icon: '🌾',
    name: {
      gl: 'Glute (Cereais con glute)',
      es: 'Gluten (Cereales con gluten)',
      en: 'Gluten (Cereals with gluten)',
    },
  },
  {
    id: 'crustaceans',
    icon: '🦐',
    name: {
      gl: 'Crustáceos',
      es: 'Crustáceos',
      en: 'Crustaceans',
    },
  },
  {
    id: 'eggs',
    icon: '🥚',
    name: {
      gl: 'Ovos e derivados',
      es: 'Huevos y derivados',
      en: 'Eggs and derivatives',
    },
  },
  {
    id: 'fish',
    icon: '🐟',
    name: {
      gl: 'Peixe e derivados',
      es: 'Pescado y derivados',
      en: 'Fish and derivatives',
    },
  },
  {
    id: 'peanuts',
    icon: '🥜',
    name: {
      gl: 'Cacahuetes',
      es: 'Cacahuetes',
      en: 'Peanuts',
    },
  },
  {
    id: 'soy',
    icon: '🌱',
    name: {
      gl: 'Soia e derivados',
      es: 'Soja y derivados',
      en: 'Soy and derivatives',
    },
  },
  {
    id: 'dairy',
    icon: '🥛',
    name: {
      gl: 'Lácteos e derivados (Lactosa)',
      es: 'Lácteos y derivados (Lactosa)',
      en: 'Dairy and derivatives (Lactose)',
    },
  },
  {
    id: 'nuts',
    icon: '🌰',
    name: {
      gl: 'Froitos de casca (Noces, améndoas)',
      es: 'Frutos de cáscara (Nueces, almendras)',
      en: 'Tree Nuts (Walnuts, almonds)',
    },
  },
  {
    id: 'celery',
    icon: '🥬',
    name: {
      gl: 'Apio e derivados',
      es: 'Apio y derivados',
      en: 'Celery and derivatives',
    },
  },
  {
    id: 'mustard',
    icon: '🟡',
    name: {
      gl: 'Mostaza e derivados',
      es: 'Mostaza y derivados',
      en: 'Mustard and derivatives',
    },
  },
  {
    id: 'sesame',
    icon: '⚪',
    name: {
      gl: 'Sésamo (Xonxolí)',
      es: 'Granos de sésamo',
      en: 'Sesame seeds',
    },
  },
  {
    id: 'sulfites',
    icon: '🍷',
    name: {
      gl: 'Sulfitos e dióxido de xofre',
      es: 'Sulfitos y dióxido de azufre',
      en: 'Sulphites and sulphur dioxide',
    },
  },
  {
    id: 'lupin',
    icon: '🌿',
    name: {
      gl: 'Altramuces (Chichos)',
      es: 'Altramuces',
      en: 'Lupin',
    },
  },
  {
    id: 'molluscs',
    icon: '🦪',
    name: {
      gl: 'Moluscos (Mexillóns, luras)',
      es: 'Moluscos (Mejillones, calamares)',
      en: 'Molluscs (Mussels, squid)',
    },
  },
]

export const ALLERGENS_MAP = new Map<string, AllergenDefinition>(
  MANDATORY_EU_ALLERGENS.map(a => [a.id, a])
)

export function getAllergen(id: string): AllergenDefinition | undefined {
  return ALLERGENS_MAP.get(id.toLowerCase().trim())
}

export function getAllergenName(id: string, lang: 'gl' | 'es' | 'en' = 'gl'): string {
  const allergen = getAllergen(id)
  if (!allergen) return id
  return allergen.name[lang] || allergen.name.gl
}
