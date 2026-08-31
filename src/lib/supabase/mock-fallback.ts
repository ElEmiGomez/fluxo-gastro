import { Restaurant, Category, Product, Table, Order, OrderItem } from '@/types/database.types'

export const MOCK_RESTAURANTS: Record<string, Restaurant> = {
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
    cuisine_type: ['Hamburguesería', 'Tapas', 'Gastronomía Gallega'],
    price_range: '€€',
  },
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

// 15 CATEGORÍAS BASE EXACTAS PROPORCIONADAS POR EL USUARIO
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

export const MOCK_CATEGORIES: Record<string, Category[]> = {
  'burger-gourmet': DEFAULT_BASE_CATEGORIES.map((catName, index) => ({
    id: `cat-${index + 1}`,
    restaurant_id: 'a1111111-1111-1111-1111-111111111111',
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
  'burger-gourmet': [
    // 1. NUESTRAS PROMOS (cat-1)
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
    // 2. ENTRADAS (cat-2)
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
    // 3. TABLAS (cat-3)
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
    // 4. ENSALADAS (cat-4)
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
    // 5. PLATOS PRINCIPALES (cat-5)
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
      id: 'p-gal-2',
      restaurant_id: 'a1111111-1111-1111-1111-111111111111',
      category_id: 'cat-2',
      name: 'Berberechos de Noia al Vapor con Laurel',
      description: 'Recién traídos de la Ría de Muros e Noia, abiertos al vapor de albariño con limón y laurel. (Precio por 100g)',
      price: 3.50,
      price_type: 'weight',
      price_unit: '100g',
      image_url: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=800&q=80',
      model_3d_url: null,
      is_available: true,
    },
    // 6. PIZZAS (cat-6)
    {
      id: 'p-piz-1',
      restaurant_id: 'a1111111-1111-1111-1111-111111111111',
      category_id: 'cat-6',
      name: 'Pizza Especial de Fugazzeta Rellena',
      description: 'Masa madre rellena con 500g de mozzarella, cubierta de cebolla caramelizada, orégano fresco y aceitunas negras.',
      price: 14.80,
      image_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80',
      model_3d_url: null,
      is_available: true,
    },
    // 7. BURGERS (cat-7)
    {
      id: 'p-bur-1',
      restaurant_id: 'a1111111-1111-1111-1111-111111111111',
      category_id: 'cat-7',
      name: 'Bacon Cheese Doble Monster',
      description: 'Doble medallón de 160g de blend de asado, cuádruple cheddar fundido, panceta crocante y salsa barbacoa en pan brioche.',
      price: 14.20,
      image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
      model_3d_url: 'https://modelviewer.dev/shared-assets/models/Astronaut.glb',
      is_available: true,
    },
    {
      id: 'p-bur-2',
      restaurant_id: 'a1111111-1111-1111-1111-111111111111',
      category_id: 'cat-7',
      name: 'Smash Clásica Oklahoma con Cebolla',
      description: 'Medallones smash sellados con cebolla finita, cheddar americano, pickles y aderezo especial de la casa.',
      price: 11.90,
      image_url: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=800&q=80',
      model_3d_url: null,
      is_available: true,
    },
    // 8. SANDWICHS (cat-8)
    {
      id: 'p-snd-1',
      restaurant_id: 'a1111111-1111-1111-1111-111111111111',
      category_id: 'cat-8',
      name: 'Sandwich de Bondiola Braseada BBQ',
      description: 'Bondiola de cerdo desmenuzada, cocida a baja temperatura durante 6 horas, con coleslaw y salsa ahumada en pan ciabatta.',
      price: 13.40,
      image_url: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=800&q=80',
      model_3d_url: null,
      is_available: true,
    },
    // 9. WRAPS (cat-9)
    {
      id: 'p-wrp-1',
      restaurant_id: 'a1111111-1111-1111-1111-111111111111',
      category_id: 'cat-9',
      name: 'Wrap de Pollo Crispy y Guacamole',
      description: 'Tortilla de trigo tibia con tiras de pollo crocante, palta fresca, tomate en cubos y queso crema ciboulette.',
      price: 9.80,
      image_url: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=800&q=80',
      model_3d_url: null,
      is_available: true,
    },
    // 10. POSTRES (cat-10)
    {
      id: 'p-pos-1',
      restaurant_id: 'a1111111-1111-1111-1111-111111111111',
      category_id: 'cat-10',
      name: 'Volcán de Chocolate con Helado de Crema',
      description: 'Bizcocho tibio de chocolate amargo con centro líquido fundido, acompañado de helado artesanal.',
      price: 5.80,
      image_url: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=800&q=80',
      model_3d_url: null,
      is_available: true,
    },
    // 11. SIN TACC (cat-11)
    {
      id: 'p-st-1',
      restaurant_id: 'a1111111-1111-1111-1111-111111111111',
      category_id: 'cat-11',
      name: 'Burger Gluten Free (Certificada Sin TACC)',
      description: 'Medallón 100% novillo con cheddar, lechuga, tomate y mayonesa en pan suave certificado libre de gluten.',
      price: 13.90,
      image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
      model_3d_url: null,
      is_available: true,
    },
    // 12. BEBIDAS SIN ALCOHOL (cat-12)
    {
      id: 'p-bsa-1',
      restaurant_id: 'a1111111-1111-1111-1111-111111111111',
      category_id: 'cat-12',
      name: 'Limonada Casera con Menta y Jengibre 500ml',
      description: 'Exprimido natural de limones seleccionados con hojas de menta fresca y toque de jengibre.',
      price: 3.20,
      image_url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80',
      model_3d_url: null,
      is_available: true,
    },
    // 13. BEBIDAS CON ALCOHOL (cat-13)
    {
      id: 'p-bca-1',
      restaurant_id: 'a1111111-1111-1111-1111-111111111111',
      category_id: 'cat-13',
      name: 'Cerveza Artesanal IPA Tirada 500ml',
      description: 'Aroma a lúpulo cítrico, notas florales y amargor persistente en copa helada.',
      price: 4.20,
      image_url: 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?auto=format&fit=crop&w=800&q=80',
      model_3d_url: null,
      is_available: true,
    },
    // 14. TRAGOS (cat-14)
    {
      id: 'p-trg-1',
      restaurant_id: 'a1111111-1111-1111-1111-111111111111',
      category_id: 'cat-14',
      name: 'Fernet Branca Artesanal con Cola',
      description: 'Proporción 70/30 en vaso largo con abundante hielo roca.',
      price: 4.80,
      image_url: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=800&q=80',
      model_3d_url: null,
      is_available: true,
    },
    // 15. GIN (cat-15)
    {
      id: 'p-gin-1',
      restaurant_id: 'a1111111-1111-1111-1111-111111111111',
      category_id: 'cat-15',
      name: 'Gin Tonic de Autor con Frutos Rojos y Romero',
      description: 'Gin premium nacional, agua tónica macerada con bayas de enebro, frutos del bosque y ramita de romero encendida.',
      price: 6.40,
      image_url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80',
      model_3d_url: null,
      is_available: true,
    },
  ],
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
