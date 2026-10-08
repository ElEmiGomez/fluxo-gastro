-- ==============================================================================
-- FLUXO MIGRATION: Inserción de categoría 'POSTRES & CAFÉ' y productos para sobremesa
-- Fecha: 08/10/2026
-- Objetivo: Añadir categoría de Postres y Café junto con productos para comanda y sobremesa
-- ==============================================================================

-- 1. Insertar categoría 'POSTRES & CAFÉ'
INSERT INTO public.categories (id, restaurant_id, name, order_index)
VALUES ('c0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', 'POSTRES & CAFÉ', 6)
ON CONFLICT (id) DO UPDATE SET name = 'POSTRES & CAFÉ', order_index = 6;

-- 2. Insertar productos de postre y café
INSERT INTO public.products (id, restaurant_id, category_id, name, description, price, image_url, is_available)
VALUES 
(
  'b0000000-0000-0000-0000-000000000006',
  'a0000000-0000-0000-0000-000000000001',
  'c0000000-0000-0000-0000-000000000006',
  'Volcán de Chocolate con Helado de Vainilla',
  'Bizcochuelo tibio relleno de chocolate amargo fundido, acompañado de helado artesanal.',
  6.80,
  'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=800&q=80',
  true
),
(
  'b0000000-0000-0000-0000-000000000007',
  'a0000000-0000-0000-0000-000000000001',
  'c0000000-0000-0000-0000-000000000006',
  'Tarta de Queso Artesana de la Ría',
  'Cheesecake cremoso horneado estilo tradicional con coulis casero de frutos del bosque.',
  6.50,
  'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=800&q=80',
  true
),
(
  'b0000000-0000-0000-0000-000000000008',
  'a0000000-0000-0000-0000-000000000001',
  'c0000000-0000-0000-0000-000000000006',
  'Café de Especialidad (Solo / Cortado / Con Leche)',
  '100% Arábica de tueste natural en grano recién molido. Servido al gusto con leche fresca o vegetal.',
  1.80,
  'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80',
  true
)
ON CONFLICT (id) DO UPDATE 
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    image_url = EXCLUDED.image_url,
    is_available = true;
