import { Restaurant, Category, Product, Table, Order, OrderItem } from '@/types/database.types'

export const MOCK_RESTAURANTS: Record<string, Restaurant> = {
  // ── 1. PERFIL DEMO 1: BURGER GOURMET NOIA ──
  'burger-gourmet': {
    id: 'a1111111-1111-1111-1111-111111111111',
    name: 'Burger Gourmet Noia',
    slug: 'burger-gourmet',
    logo_url: '/icon.svg',
    primary_color: '#1e3a8a',
    secondary_color: '#0f172a',
    created_at: new Date().toISOString(),
    google_place_id: 'ChIJgZb091NoiaBarbanzaGal',
    google_review_url: 'https://search.google.com/local/writereview?placeid=ChIJgZb091NoiaBarbanzaGal',
    phone: '+34 981 82 00 00',
    address: 'Rúa do Cantón, 12',
    city: 'Noia',
    postal_code: '15200',
    cuisine_type: ['Hamburguesería Gourmet', 'Smash Burgers', 'Street Food Gallego'],
    price_range: '€€',
  },

  // ── 2. PERFIL DEMO 2: TAPERÍA CASCO ANTIGO ──
  'taperia-casco-antigo': {
    id: 'c3333333-3333-3333-3333-333333333333',
    name: 'Tapería Casco Antigo',
    slug: 'taperia-casco-antigo',
    logo_url: '/icon.svg',
    primary_color: '#b91c1c',
    secondary_color: '#450a0a',
    created_at: new Date().toISOString(),
    google_place_id: 'ChIJTaperiaCascoAntigoNoia',
    google_review_url: 'https://search.google.com/local/writereview?placeid=ChIJTaperiaCascoAntigoNoia',
    phone: '+34 981 82 15 30',
    address: 'Rúa da Forca, 4 (Praza do Tapal)',
    city: 'Noia',
    postal_code: '15200',
    cuisine_type: ['Tapas Tradicionales', 'Gastronomía Gallega', 'Raciones & Vinos'],
    price_range: '€€',
  },

  // ── 3. PERFIL DEMO 3: TERRAZA MALECÓN ──
  'terraza-malecon': {
    id: 'd4444444-4444-4444-4444-444444444444',
    name: 'Terraza Malecón',
    slug: 'terraza-malecon',
    logo_url: '/icon.svg',
    primary_color: '#0f766e',
    secondary_color: '#134e4a',
    created_at: new Date().toISOString(),
    google_place_id: 'ChIJterrazaMaleconNoiaBarbanza',
    google_review_url: 'https://search.google.com/local/writereview?placeid=ChIJterrazaMaleconNoiaBarbanza',
    phone: '+34 981 82 44 88',
    address: 'Paseo do Malecón, 28 (Frente á Ría)',
    city: 'Noia',
    postal_code: '15200',
    cuisine_type: ['Cafetería & Tardeo', 'Cócteles de Autor', 'Picoteo frente a la Ría'],
    price_range: '€€',
  },

  // ── Fallback adicional ──
  'bella-napoli': {
    id: 'b2222222-2222-2222-2222-222222222222',
    name: 'Trattoria Bella Napoli',
    slug: 'bella-napoli',
    logo_url: '/icon.svg',
    primary_color: '#059669',
    secondary_color: '#1c1917',
    created_at: new Date().toISOString(),
    google_place_id: 'ChIJbNapoliSantiagoDeCompostela',
    google_review_url: 'https://search.google.com/local/writereview?placeid=ChIJbNapoliSantiagoDeCompostela',
    phone: '+34 981 58 12 34',
    address: 'Rúa do Franco, 45',
    city: 'Santiago de Compostela',
    postal_code: '15702',
    cuisine_type: ['Pizzería', 'Italiana', 'Pasta Artesanal'],
    price_range: '€€',
  },
}

// 15 CATEGORÍAS BASE GENERALES
export const DEFAULT_BASE_CATEGORIES = [
  'NUESTRAS PROMOS',
  'ENTRADAS',
  'TABLAS',
  'ENSALADAS',
  'PLATOS PRINCIPALES',
  'PIZZAS',
  'BURGERS',
  'SANDWICHS',
  'WRAPS',
  'POSTRES',
  'SIN TACC',
  'BEBIDAS SIN ALCOHOL',
  'BEBIDAS CON ALCOHOL',
  'TRAGOS',
  'GIN',
]

// CATEGORÍAS TAPERÍA CASCO ANTIGO
export const TAPERIA_CATEGORIES = [
  'PROMOS & MENÚ DEL DÍA',
  'TAPAS DE LA RÍA',
  'RACIONES CALIENTES',
  'TABLAS Y QUESOS D.O.',
  'EMPANADAS Y GUISOS',
  'CARNES DE LA TIERRA',
  'POSTRES CASEROS',
  'VINOS D.O. GALLEGOS',
  'CERVEZAS Y REFRESCOS',
  'LICORES TRADICIONALES',
]

// CATEGORÍAS TERRAZA MALECÓN
export const TERRAZA_CATEGORIES = [
  'CAFÉS Y DESAYUNOS',
  'SMOOTHIES Y ZUMOS',
  'VERMÚS Y APERITIVOS',
  'TOSTAS Y PICOTEO',
  'CÓCTELES DE AUTOR',
  'GIN TONICS PREMIUM',
  'POSTRES Y DULCES',
  'BEBIDAS Y REFRESCOS',
]

export const MOCK_CATEGORIES: Record<string, Category[]> = {
  'burger-gourmet': DEFAULT_BASE_CATEGORIES.map((catName, index) => ({
    id: `cat-${index + 1}`,
    restaurant_id: 'a1111111-1111-1111-1111-111111111111',
    name: catName,
    order_index: index + 1,
  })),

  'taperia-casco-antigo': TAPERIA_CATEGORIES.map((catName, index) => ({
    id: `cat-tca-${index + 1}`,
    restaurant_id: 'c3333333-3333-3333-3333-333333333333',
    name: catName,
    order_index: index + 1,
  })),

  'terraza-malecon': TERRAZA_CATEGORIES.map((catName, index) => ({
    id: `cat-tm-${index + 1}`,
    restaurant_id: 'd4444444-4444-4444-4444-444444444444',
    name: catName,
    order_index: index + 1,
  })),

  'bella-napoli': DEFAULT_BASE_CATEGORIES.map((catName, index) => ({
    id: `cat-bn-${index + 1}`,
    restaurant_id: 'b2222222-2222-2222-2222-222222222222',
    name: catName,
    order_index: index + 1,
  })),
}

export const MOCK_PRODUCTS: Record<string, Product[]> = {
  // ── 1. CATÁLOGO: BURGER GOURMET NOIA ──
  'burger-gourmet': [
    {
      id: 'p-promo-1',
      restaurant_id: 'a1111111-1111-1111-1111-111111111111',
      category_id: 'cat-1',
      name: 'Combo Pareja: 2 Burgers Dobles + Papas + 2 Pintas',
      description: '2 Burgers Doble Monster con panceta y cheddar, porción gigante de papas rústicas y 2 cervezas artesanales.',
      price: 24.50,
      image_url: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80',
      model_3d_url: 'https://modelviewer.dev/shared-assets/models/Astronaut.glb',
      is_available: true,
    },
    {
      id: 'p-ent-1',
      restaurant_id: 'a1111111-1111-1111-1111-111111111111',
      category_id: 'cat-2',
      name: 'Bastones de Mozzarella Crocantes',
      description: '6 bastones empanados en panko con dip de salsa marinara casera.',
      price: 7.20,
      image_url: 'https://images.unsplash.com/photo-1531749668029-2db88e4276c7?auto=format&fit=crop&w=800&q=80',
      model_3d_url: null,
      is_available: true,
    },
    {
      id: 'p-tab-1',
      restaurant_id: 'a1111111-1111-1111-1111-111111111111',
      category_id: 'cat-3',
      name: 'Tabla Gourmet Picada Caliente (Para 3)',
      description: 'Nuggets crocantes, tequeños de queso, papas cheddar con bacon, aros de cebolla y variedad de dips.',
      price: 19.80,
      image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
      model_3d_url: null,
      is_available: true,
    },
    {
      id: 'p-ens-1',
      restaurant_id: 'a1111111-1111-1111-1111-111111111111',
      category_id: 'cat-4',
      name: 'Ensalada Caesar con Pollo Grillado',
      description: 'Mix de lechugas crocantes, pechuga grillada, croutons dorados, lascas de parmesano y aderezo caesar tradicional.',
      price: 9.40,
      image_url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80',
      model_3d_url: null,
      is_available: true,
    },
    {
      id: 'p-pp-1',
      restaurant_id: 'a1111111-1111-1111-1111-111111111111',
      category_id: 'cat-5',
      name: 'Milanesa Napolitana con Guarnición',
      description: 'Suprema o ternera tiernizada con salsa de tomate casera, jamón cocido y queso mozzarella gratinado.',
      price: 12.50,
      image_url: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=800&q=80',
      model_3d_url: 'https://modelviewer.dev/shared-assets/models/Astronaut.glb',
      is_available: true,
    },
    {
      id: 'p-gal-1',
      restaurant_id: 'a1111111-1111-1111-1111-111111111111',
      category_id: 'cat-5',
      name: 'Chuletón de Vaca Rubia Gallega',
      description: 'Madurado 45 días, asado a la brasa con escamas de sal de Arousa. (Precio por Kg)',
      price: 48.00,
      price_type: 'weight',
      price_unit: 'kg',
      image_url: 'https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=800&q=80',
      model_3d_url: null,
      is_available: true,
    },
    {
      id: 'p-bur-1',
      restaurant_id: 'a1111111-1111-1111-1111-111111111111',
      category_id: 'cat-7',
      name: 'Bacon Cheese Doble Monster',
      description: 'Doble medallón de 160g de blend de asado, cuádruple cheddar fundido, panceta crocante y salsa barbacoa en pan brioche.',
      price: 13.90,
      image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
      model_3d_url: 'https://modelviewer.dev/shared-assets/models/Astronaut.glb',
      is_available: true,
    },
    {
      id: 'p-bur-gallaecia',
      restaurant_id: 'a1111111-1111-1111-1111-111111111111',
      category_id: 'cat-7',
      name: 'Burger Gallaecia: Rubia Gallega & San Simón',
      description: '180g de carne de Rubia Gallega madurada, queso San Simón da Costa ahumado fundido, cebolla caramelizada al Mencía y rúcula en pan brioche artesano.',
      price: 15.50,
      image_url: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=800&q=80',
      model_3d_url: null,
      is_available: true,
    },
    {
      id: 'p-pos-1',
      restaurant_id: 'a1111111-1111-1111-1111-111111111111',
      category_id: 'cat-10',
      name: 'Volcán de Chocolate con Helado de Vainilla',
      description: 'Bizcochuelo tibio relleno de chocolate amargo fundido, acompañado de helado artesanal.',
      price: 6.80,
      image_url: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=800&q=80',
      model_3d_url: null,
      is_available: true,
    },
    {
      id: 'p-beb-1',
      restaurant_id: 'a1111111-1111-1111-1111-111111111111',
      category_id: 'cat-13',
      name: 'Cerveza Estrella Galicia 1906 Reserva Especial',
      description: 'Tostada de alta graduación, intensa con notas a malta caramelizada y lúpulo aromático.',
      price: 3.50,
      image_url: 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?auto=format&fit=crop&w=800&q=80',
      model_3d_url: null,
      is_available: true,
    },
  ],

  // ── 2. CATÁLOGO: TAPERÍA CASCO ANTIGO ──
  'taperia-casco-antigo': [
    {
      id: 'p-tca-pulpo',
      restaurant_id: 'c3333333-3333-3333-3333-333333333333',
      category_id: 'cat-tca-2',
      name: 'Pulpo á Feira con Cachelos de Bergantiños',
      description: 'Pulpo de la ría cocido al punto tradicional, servido en plato de madera con patata gallega, pimentón de la Vera dulce y picante, y aceite de oliva virgen extra.',
      price: 18.50,
      image_url: 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?auto=format&fit=crop&w=800&q=80',
      model_3d_url: null,
      is_available: true,
    },
    {
      id: 'p-tca-zamburinas',
      restaurant_id: 'c3333333-3333-3333-3333-333333333333',
      category_id: 'cat-tca-2',
      name: 'Zamburiñas de la Ría a la Plancha (8 uds)',
      description: 'Zamburiñas frescas de la Ría de Muros e Noia abiertas a la plancha con vinagreta suave de ajo, perejil y gotas de limón.',
      price: 16.00,
      image_url: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=800&q=80',
      model_3d_url: null,
      is_available: true,
    },
    {
      id: 'p-tca-padron',
      restaurant_id: 'c3333333-3333-3333-3333-333333333333',
      category_id: 'cat-tca-3',
      name: 'Pementos de Padrón Fritos con Sal Maldon',
      description: 'Pimientos de Herbón fritos en AOVE caliente. "Uns pican e outros non". Ración generosa para compartir.',
      price: 7.50,
      image_url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80',
      model_3d_url: null,
      is_available: true,
    },
    {
      id: 'p-tca-raxo',
      restaurant_id: 'c3333333-3333-3333-3333-333333333333',
      category_id: 'cat-tca-6',
      name: 'Raxo ao Cabrales con Patacas da Terra',
      description: 'Tacos de lomo de cerdo adobados con ajo y perejil, bañados en salsa cremosa de queso azul fundido con patatas fritas artesanas.',
      price: 13.50,
      image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
      model_3d_url: null,
      is_available: true,
    },
    {
      id: 'p-tca-tabla-queixos',
      restaurant_id: 'c3333333-3333-3333-3333-333333333333',
      category_id: 'cat-tca-4',
      name: 'Tabla de Queixos Galegos con D.O. Protegida',
      description: 'Selección de 4 quesos gallegos: Arzúa-Ulloa cremoso, Tetilla suave, San Simón da Costa ahumado y O Cebreiro, con nueces y dulce de membrillo.',
      price: 14.00,
      image_url: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=800&q=80',
      model_3d_url: null,
      is_available: true,
    },
    {
      id: 'p-tca-empanada',
      restaurant_id: 'c3333333-3333-3333-3333-333333333333',
      category_id: 'cat-tca-5',
      name: 'Empanada Caseira de Berberechos de Noia',
      description: 'Masa tradicional de millo horneada en horno de leña rellena de berberecho fresco de Noia con sofrito meloso de cebolla y pimiento.',
      price: 8.50,
      image_url: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=800&q=80',
      model_3d_url: null,
      is_available: true,
    },
    {
      id: 'p-tca-croquetas',
      restaurant_id: 'c3333333-3333-3333-3333-333333333333',
      category_id: 'cat-tca-3',
      name: 'Croquetas Melosas de Jamón Ibérico (6 uds)',
      description: 'Bechamel suave elaborada con leche entera gallega, jamón ibérico curado y rebozado extra crujiente.',
      price: 8.00,
      image_url: 'https://images.unsplash.com/photo-1531749668029-2db88e4276c7?auto=format&fit=crop&w=800&q=80',
      model_3d_url: null,
      is_available: true,
    },
    {
      id: 'p-tca-tarta-santiago',
      restaurant_id: 'c3333333-3333-3333-3333-333333333333',
      category_id: 'cat-tca-7',
      name: 'Tarta de Santiago Artesanal con Cruz de Azúcar',
      description: 'Elaborada 100% con almendra marcona molida, huevos camperos y limón, sin harina de trigo. Servida con chupito de licor café.',
      price: 5.50,
      image_url: 'https://images.unsplash.com/photo-1535141192574-5d4897c13136?auto=format&fit=crop&w=800&q=80',
      model_3d_url: null,
      is_available: true,
    },
    {
      id: 'p-tca-albarino',
      restaurant_id: 'c3333333-3333-3333-3333-333333333333',
      category_id: 'cat-tca-8',
      name: 'Botella Albariño D.O. Rías Baixas (Val do Salnés)',
      description: 'Vino blanco joven, fresco, floral y cítrico con acidez perfecta para maridar mariscos y pescados.',
      price: 18.00,
      image_url: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&q=80',
      model_3d_url: null,
      is_available: true,
    },
    {
      id: 'p-tca-mencia',
      restaurant_id: 'c3333333-3333-3333-3333-333333333333',
      category_id: 'cat-tca-8',
      name: 'Botella Mencía D.O. Ribeira Sacra',
      description: 'Tinto gallego de bancales heroicos del río Sil, con aromas a frutos silvestres y toque mineral.',
      price: 16.50,
      image_url: 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=800&q=80',
      model_3d_url: null,
      is_available: true,
    },
  ],

  // ── 3. CATÁLOGO: TERRAZA MALECÓN ──
  'terraza-malecon': [
    {
      id: 'p-tm-flat-white',
      restaurant_id: 'd4444444-4444-4444-4444-444444444444',
      category_id: 'cat-tm-1',
      name: 'Café de Especialidad Flat White (100% Arábica)',
      description: 'Doble shot de espresso de finca tostado en Galicia con leche fresca vaporizada micro-texturizada.',
      price: 2.40,
      image_url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80',
      model_3d_url: null,
      is_available: true,
    },
    {
      id: 'p-tm-tosta-salmon',
      restaurant_id: 'd4444444-4444-4444-4444-444444444444',
      category_id: 'cat-tm-4',
      name: 'Tosta de Salmón Noruego, Queso Crema y Aguacate',
      description: 'Pan rústico de masa madre tostado a la plancha, base de queso crema de Arzúa, láminas de aguacate fresco, salmón ahumado y semillas de sésamo.',
      price: 7.80,
      image_url: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=800&q=80',
      model_3d_url: null,
      is_available: true,
    },
    {
      id: 'p-tm-smoothie-mango',
      restaurant_id: 'd4444444-4444-4444-4444-444444444444',
      category_id: 'cat-tm-2',
      name: 'Smoothie Tropical Mango & Maracuyá Prensado',
      description: 'Fruta 100% natural triturada al momento con zumo de naranja recién exprimido y hielo frappé. Sin azúcares añadidos.',
      price: 4.80,
      image_url: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&w=800&q=80',
      model_3d_url: null,
      is_available: true,
    },
    {
      id: 'p-tm-petroni',
      restaurant_id: 'd4444444-4444-4444-4444-444444444444',
      category_id: 'cat-tm-3',
      name: 'Vermú Rojo St. Petroni con Gilda Artesana',
      description: 'Vermú gallego elaborado en Padrón a base de uva albariña y botánicos autóctonos. Servido con hielo roca, rodaja de naranja y gilda de anchoa.',
      price: 4.20,
      image_url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80',
      model_3d_url: null,
      is_available: true,
    },
    {
      id: 'p-tm-aperol',
      restaurant_id: 'd4444444-4444-4444-4444-444444444444',
      category_id: 'cat-tm-5',
      name: 'Aperol Spritz de la Ría',
      description: 'Aperol, vino espumoso brut, toque de soda de sifón, rodaja de naranja fresca y aceituna verde gordal.',
      price: 7.50,
      image_url: 'https://images.unsplash.com/photo-1560512823-829485b8bf24?auto=format&fit=crop&w=800&q=80',
      model_3d_url: null,
      is_available: true,
    },
    {
      id: 'p-tm-mojito',
      restaurant_id: 'd4444444-4444-4444-4444-444444444444',
      category_id: 'cat-tm-5',
      name: 'Mojito Clásico Cubano con Hierbabuena Fresca',
      description: 'Ron añejo caribeño, lima macerada con azúcar moreno de caña, abundante hierbabuena fresca, hielo picado y golpe de soda.',
      price: 8.00,
      image_url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80',
      model_3d_url: null,
      is_available: true,
    },
    {
      id: 'p-tm-nordes',
      restaurant_id: 'd4444444-4444-4444-4444-444444444444',
      category_id: 'cat-tm-6',
      name: 'Gin Tonic Nordés con Uva Albariña y Tónica Premium',
      description: 'Ginebra gallega atlántica destilada con hierbaluisa, laurel y uva albariño. Servida en copa de balón con tónica Fever-Tree y uva blanca.',
      price: 10.00,
      image_url: 'https://images.unsplash.com/photo-1527061011665-3652c757a4d4?auto=format&fit=crop&w=800&q=80',
      model_3d_url: null,
      is_available: true,
    },
    {
      id: 'p-tm-nachos',
      restaurant_id: 'd4444444-4444-4444-4444-444444444444',
      category_id: 'cat-tm-4',
      name: 'Nachos Malecón con Guacamole y Cheddar Fundido',
      description: 'Totopos de maíz fritos al momento, queso cheddar fundido, jalapeños, pico de gallo y tarrina de guacamole casero.',
      price: 9.50,
      image_url: 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?auto=format&fit=crop&w=800&q=80',
      model_3d_url: null,
      is_available: true,
    },
    {
      id: 'p-tm-cheesecake',
      restaurant_id: 'd4444444-4444-4444-4444-444444444444',
      category_id: 'cat-tm-7',
      name: 'Tarta de Queso Horneada Estilo San Sebastián',
      description: 'Textura extra cremosa y corazón fluido, elaborada con quesos artesanos gallegos y coulis tibio de frutos del bosque.',
      price: 6.00,
      image_url: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=800&q=80',
      model_3d_url: null,
      is_available: true,
    },
  ],

  // ── Fallback ──
  'bella-napoli': [
    {
      id: 'p-bn-1',
      restaurant_id: 'b2222222-2222-2222-2222-222222222222',
      category_id: 'cat-bn-6',
      name: 'Pizza Margherita Verace D.O.P.',
      description: 'Pomodoro San Marzano, Mozzarella di Bufala Campana, albahaca fresca y aceite de oliva virgen extra.',
      price: 14.5,
      image_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80',
      model_3d_url: 'https://modelviewer.dev/shared-assets/models/Astronaut.glb',
      is_available: true,
    },
    {
      id: 'p-bn-2',
      restaurant_id: 'b2222222-2222-2222-2222-222222222222',
      category_id: 'cat-bn-5',
      name: 'Fettuccine ai Funghi Porcini e Tartufo',
      description: 'Pasta fresca al huevo con hongos porcini salteados en manteca de trufa blanca y queso parmigiano reggiano 24 meses.',
      price: 18.0,
      image_url: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=800&q=80',
      model_3d_url: null,
      is_available: true,
    },
  ],
}

export const MOCK_TABLES: Record<string, Table[]> = {
  'burger-gourmet': Array.from({ length: 25 }, (_, i) => ({
    id: `t1111111-1111-1111-1111-${String(i + 1).padStart(12, '0')}`,
    restaurant_id: 'a1111111-1111-1111-1111-111111111111',
    table_number: i + 1,
  })),
  'taperia-casco-antigo': Array.from({ length: 25 }, (_, i) => ({
    id: `t3333333-3333-3333-3333-${String(i + 1).padStart(12, '0')}`,
    restaurant_id: 'c3333333-3333-3333-3333-333333333333',
    table_number: i + 1,
  })),
  'terraza-malecon': Array.from({ length: 25 }, (_, i) => ({
    id: `t4444444-4444-4444-4444-${String(i + 1).padStart(12, '0')}`,
    restaurant_id: 'd4444444-4444-4444-4444-444444444444',
    table_number: i + 1,
  })),
  'bella-napoli': Array.from({ length: 25 }, (_, i) => ({
    id: `t2222222-2222-2222-2222-${String(i + 1).padStart(12, '0')}`,
    restaurant_id: 'b2222222-2222-2222-2222-222222222222',
    table_number: i + 1,
  })),
}

const LOCAL_STORAGE_ORDERS_KEY = 'gastro_pwa_mock_orders'

export function getMockOrders(slug: string): Order[] {
  if (typeof window === 'undefined') {
    return getInitialMockOrders(slug)
  }

  const stored = localStorage.getItem(`${LOCAL_STORAGE_ORDERS_KEY}_${slug}`)
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      return getInitialMockOrders(slug)
    }
  }

  const initial = getInitialMockOrders(slug)
  saveMockOrders(slug, initial)
  return initial
}

export function saveMockOrders(slug: string, orders: Order[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(`${LOCAL_STORAGE_ORDERS_KEY}_${slug}`, JSON.stringify(orders))
    window.dispatchEvent(new CustomEvent('gastro_mock_orders_update', { detail: { slug, orders } }))
  }
}

export function createMockOrder(slug: string, newOrder: { restaurant_id: string; table_id: string; table_number?: number; total_amount: number; items: { product_id: string; quantity: number; notes: string | null }[] }): Order {
  const orderId = `ord-${Date.now()}`
  const now = new Date().toISOString()
  
  const tables = MOCK_TABLES[slug] || []
  const matchedTable = tables.find(t => t.id === newOrder.table_id || t.table_number === Number(newOrder.table_number))
  const tableNumber = matchedTable ? matchedTable.table_number : Number(newOrder.table_number || 1)

  const createdItems: OrderItem[] = newOrder.items.map((item, idx) => {
    const products = MOCK_PRODUCTS[slug] || []
    const product = products.find(p => p.id === item.product_id)
    return {
      id: `item-${Date.now()}-${idx}`,
      order_id: orderId,
      product_id: item.product_id,
      quantity: item.quantity,
      notes: item.notes || null,
      product: product,
    }
  })

  const fullOrder: Order = {
    id: orderId,
    restaurant_id: newOrder.restaurant_id,
    table_id: matchedTable?.id || newOrder.table_id,
    status: 'pending',
    total_amount: newOrder.total_amount,
    created_at: now,
    table_number: tableNumber,
    order_items: createdItems,
  }

  const currentOrders = getMockOrders(slug)
  const updatedOrders = [fullOrder, ...currentOrders]
  saveMockOrders(slug, updatedOrders)
  return fullOrder
}

export function updateMockOrderStatus(slug: string, orderId: string, newStatus: Order['status']): Order[] {
  const currentOrders = getMockOrders(slug)
  const updated = currentOrders.map(o => o.id === orderId ? { ...o, status: newStatus } : o)
  saveMockOrders(slug, updated)
  return updated
}

function getInitialMockOrders(slug: string): Order[] {
  return []
}
