import { Category, Product } from '@/types/database.types'

/**
 * Emparejamiento unificado de productos con categorías.
 * Resuelve la discrepancia entre IDs de categorías en Supabase PostgreSQL (UUIDs c0000000-...)
 * e identificadores estándar de carta (cat-1, cat-2...), además de agrupar subcategorías como
 * Tablas y Ensaladas bajo ENTRADAS, o Pizzas y Milanesas bajo PLATOS PRINCIPALES.
 */
export function isProductInCategory(
  product: Product,
  selectedCategoryId: string,
  categories: Category[] = []
): boolean {
  if (!selectedCategoryId || selectedCategoryId === 'all') {
    return true
  }

  // Coincidencia exacta directa por ID
  if (product.category_id === selectedCategoryId) {
    return true
  }

  const activeCategory = categories.find(c => c.id === selectedCategoryId)
  const catName = (activeCategory?.name || '').toUpperCase().trim()
  const selCatId = (activeCategory?.id || selectedCategoryId).toLowerCase()
  const pCatId = (product.category_id || '').toLowerCase()
  const pName = (product.name || '').toLowerCase()

  // 1. Promos & Menú del Día
  if (
    catName.includes('PROMO') ||
    selCatId === 'c0000000-0000-0000-0000-000000000001' ||
    selCatId === 'cat-1' ||
    selCatId === 'cat-tca-1'
  ) {
    return (
      pCatId === 'cat-1' ||
      pCatId === 'cat-tca-1' ||
      pCatId === 'c0000000-0000-0000-0000-000000000001' ||
      pName.includes('combo') ||
      pName.includes('promo')
    )
  }

  // 2. Entradas / Aperitivos / Tapas / Tablas / Ensaladas
  if (
    catName.includes('ENTRADA') ||
    catName.includes('APERITIVO') ||
    catName.includes('TAPA') ||
    catName.includes('PICOTEO') ||
    selCatId === 'c0000000-0000-0000-0000-000000000002' ||
    selCatId === 'cat-2' ||
    selCatId === 'cat-tca-2' ||
    selCatId === 'cat-tm-4'
  ) {
    return (
      ['cat-2', 'cat-3', 'cat-4', 'c0000000-0000-0000-0000-000000000002', 'cat-tca-2', 'cat-tca-3', 'cat-tca-4'].includes(pCatId) ||
      pName.includes('bastones') ||
      pName.includes('mozzarella') ||
      pName.includes('tabla') ||
      pName.includes('ensalada') ||
      pName.includes('nachos') ||
      pName.includes('croquetas') ||
      pName.includes('padrón') ||
      pName.includes('padron') ||
      pName.includes('pulpo') ||
      pName.includes('zamburiñas') ||
      pName.includes('zamburinas')
    )
  }

  // 3. Platos Principales / Carnes / Raciones Calientes / Pizzas / Sandwichs / Wraps
  if (
    catName.includes('PRINCIPAL') ||
    catName.includes('CARNE') ||
    catName.includes('GUISO') ||
    selCatId === 'c0000000-0000-0000-0000-000000000003' ||
    selCatId === 'cat-5' ||
    selCatId === 'cat-tca-5' ||
    selCatId === 'cat-tca-6'
  ) {
    return (
      ['cat-5', 'cat-6', 'cat-8', 'cat-9', 'c0000000-0000-0000-0000-000000000003', 'cat-tca-5', 'cat-tca-6'].includes(pCatId) ||
      pName.includes('milanesa') ||
      pName.includes('chuleton') ||
      pName.includes('chuletón') ||
      pName.includes('pizza') ||
      pName.includes('lomito') ||
      pName.includes('wrap') ||
      pName.includes('raxo') ||
      pName.includes('zorza') ||
      pName.includes('empanada')
    )
  }

  // 4. Burgers / Hamburguesas
  if (
    catName.includes('BURGER') ||
    catName.includes('HAMBURGUESA') ||
    selCatId === 'c0000000-0000-0000-0000-000000000004' ||
    selCatId === 'cat-7'
  ) {
    return (
      ['cat-7', 'cat-11', 'c0000000-0000-0000-0000-000000000004'].includes(pCatId) ||
      pName.includes('burger') ||
      pName.includes('hamburguesa') ||
      pName.includes('smash')
    )
  }

  // 5. Bebidas / Gin & Bebidas / Tragos / Cervezas / Vinos
  if (
    catName.includes('BEBIDA') ||
    catName.includes('GIN') ||
    catName.includes('REFRESCO') ||
    catName.includes('CERVEZA') ||
    catName.includes('VINO') ||
    catName.includes('LICOR') ||
    catName.includes('CÓCTEL') ||
    catName.includes('COCTEL') ||
    selCatId === 'c0000000-0000-0000-0000-000000000005' ||
    selCatId === 'cat-15' ||
    selCatId === 'cat-tca-8' ||
    selCatId === 'cat-tca-9' ||
    selCatId === 'cat-tca-10' ||
    selCatId === 'cat-tm-5' ||
    selCatId === 'cat-tm-6' ||
    selCatId === 'cat-tm-8'
  ) {
    return (
      ['cat-12', 'cat-13', 'cat-14', 'cat-15', 'c0000000-0000-0000-0000-000000000005', 'cat-tca-8', 'cat-tca-9', 'cat-tca-10', 'cat-tm-5', 'cat-tm-6', 'cat-tm-8'].includes(pCatId) ||
      pName.includes('agua') ||
      pName.includes('coca') ||
      pName.includes('cerveza') ||
      pName.includes('pinta') ||
      pName.includes('gin') ||
      pName.includes('vino') ||
      pName.includes('albariño') ||
      pName.includes('mencía') ||
      pName.includes('licor') ||
      pName.includes('vermú')
    )
  }

  // 6. Postres & Café / Dulces / Sobremesa
  if (
    catName.includes('POSTRE') ||
    catName.includes('CAFÉ') ||
    catName.includes('CAFE') ||
    catName.includes('DULCE') ||
    catName.includes('SOBREMESA') ||
    selCatId === 'c0000000-0000-0000-0000-000000000006' ||
    selCatId === 'cat-10' ||
    selCatId === 'cat-tca-7' ||
    selCatId === 'cat-tm-1' ||
    selCatId === 'cat-tm-7'
  ) {
    return (
      ['cat-10', 'cat-tca-7', 'cat-tm-1', 'cat-tm-7', 'c0000000-0000-0000-0000-000000000006'].includes(pCatId) ||
      pName.includes('volcán') ||
      pName.includes('volcan') ||
      pName.includes('tarta') ||
      pName.includes('postre') ||
      pName.includes('café') ||
      pName.includes('cafe') ||
      pName.includes('cheesecake') ||
      pName.includes('filloas') ||
      pName.includes('bica')
    )
  }

  return false
}
