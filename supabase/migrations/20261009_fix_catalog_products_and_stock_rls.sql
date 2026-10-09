-- ==============================================================================
-- FLUXO MIGRATION: RLS DE ACTUALIZACIÓN DE STOCK Y CATÁLOGO CANÓNICO DE PRODUCTOS
-- Fecha: 09/10/2026
-- Objetivo:
-- 1. Políticas RLS en 'products' para permitir a personal de sala (Mozo/Admin)
--    actualizar disponibilidad (is_available) e insertar platos sin bloqueo 42501.
-- 2. Registro canónico de todos los productos de 'burger-gourmet' con UUIDs
--    deterministas para evitar rechazos por clave foránea en order_items.
-- ==============================================================================

-- 1. POLÍTICAS ROW LEVEL SECURITY (RLS) EN TABLA PRODUCTS
DO $$
BEGIN
  -- Política de UPDATE para cambio de stock y disponibilidad
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'products' 
    AND policyname = 'Permitir actualizacion de disponibilidad de productos'
  ) THEN
    CREATE POLICY "Permitir actualizacion de disponibilidad de productos"
      ON public.products FOR UPDATE
      USING (true)
      WITH CHECK (true);
  END IF;

  -- Política de INSERT para administración de platos
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'products' 
    AND policyname = 'Permitir insercion de productos para administracion'
  ) THEN
    CREATE POLICY "Permitir insercion de productos para administracion"
      ON public.products FOR INSERT
      WITH CHECK (true);
  END IF;

  -- Política integral para gestión administrativa
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'products' 
    AND policyname = 'Permitir gestion de productos para administracion'
  ) THEN
    CREATE POLICY "Permitir gestion de productos para administracion"
      ON public.products FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- 2. ASEGURAR CATEGORÍA DE POSTRES & CAFÉ
INSERT INTO public.categories (id, restaurant_id, name, order_index)
VALUES ('c0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', 'POSTRES & CAFÉ', 6)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, order_index = EXCLUDED.order_index;

-- 3. INSERTAR / SINCRONIZAR CATÁLOGO COMPLETO DE PRODUCTOS CON UUIDs
INSERT INTO public.products (id, restaurant_id, category_id, name, description, price, price_type, price_unit, image_url, is_available)
VALUES
  -- 1. Promos
  (
    'b0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000001',
    'Combo Pareja: 2 Burgers Dobles + Papas + 2 Pintas',
    '2 Burgers Doble Monster con panceta y cheddar, porción gigante de papas rústicas y 2 cervezas artesanales.',
    24.50,
    'unit',
    NULL,
    'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80',
    true
  ),
  -- 2. Entradas
  (
    'b0000000-0000-0000-0000-000000000011',
    'a0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000002',
    'Bastones de Mozzarella Crocantes',
    '6 bastones empanados en panko con dip de salsa marinara casera.',
    7.20,
    'unit',
    NULL,
    'https://images.unsplash.com/photo-1531749668029-2db88e4276c7?auto=format&fit=crop&w=800&q=80',
    true
  ),
  (
    'b0000000-0000-0000-0000-000000000012',
    'a0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000002',
    'Tabla Gourmet Picada Caliente (Para 3)',
    'Nuggets crocantes, tequeños de queso, papas cheddar con bacon, aros de cebolla y variedad de dips.',
    19.80,
    'unit',
    NULL,
    'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
    true
  ),
  -- 3. Platos Principales
  (
    'b0000000-0000-0000-0000-000000000013',
    'a0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000003',
    'Ensalada Caesar con Pollo Grillado',
    'Mix de lechugas crocantes, pechuga grillada, croutons dorados, lascas de parmesano y aderezo caesar tradicional.',
    9.40,
    'unit',
    NULL,
    'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80',
    true
  ),
  (
    'b0000000-0000-0000-0000-000000000014',
    'a0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000003',
    'Milanesa Napolitana con Guarnición',
    'Suprema o ternera tiernizada con salsa de tomate casera, jamón cocido y queso mozzarella gratinado.',
    12.50,
    'unit',
    NULL,
    'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=800&q=80',
    true
  ),
  (
    'b0000000-0000-0000-0000-000000000015',
    'a0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000003',
    'Chuletón de Vaca Rubia Gallega',
    'Madurado 45 días, asado a la brasa con escamas de sal de Arousa. (Precio por Kg)',
    48.00,
    'weight',
    'kg',
    'https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=800&q=80',
    true
  ),
  -- 4. Burgers
  (
    'b0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000004',
    'Bacon Cheese Doble Monster',
    'Doble medallón de 160g de blend de asado, cuádruple cheddar fundido, panceta crocante y salsa barbacoa en pan brioche.',
    14.20,
    'unit',
    NULL,
    'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
    true
  ),
  (
    'b0000000-0000-0000-0000-000000000016',
    'a0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000004',
    'Burger Gallaecia: Rubia Gallega & San Simón',
    '180g de carne de Rubia Gallega madurada, queso San Simón da Costa ahumado fundido, cebolla caramelizada al Mencía y rúcula en pan brioche artesano.',
    15.50,
    'unit',
    NULL,
    'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=800&q=80',
    true
  ),
  -- 5. Postres & Café
  (
    'b0000000-0000-0000-0000-000000000006',
    'a0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000006',
    'Volcán de Chocolate con Helado de Vainilla',
    'Bizcochuelo tibio relleno de chocolate amargo fundido, acompañado de helado artesanal.',
    6.80,
    'unit',
    NULL,
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
    'unit',
    NULL,
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
    'unit',
    NULL,
    'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80',
    true
  ),
  -- 6. Bebidas
  (
    'b0000000-0000-0000-0000-000000000009',
    'a0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000005',
    'Cerveza Estrella Galicia 1906 Reserva Especial',
    'Tostada de alta graduación, intensa con notas a malta caramelizada y lúpulo aromático.',
    3.50,
    'unit',
    NULL,
    'https://images.unsplash.com/photo-1535958636474-b021ee887b13?auto=format&fit=crop&w=800&q=80',
    true
  ),
  (
    'b0000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000005',
    'Gin Tonic de Autor con Frutos Rojos',
    'Gin premium con tónica botánica, bayas de enebro, frutos rojos frescos y un toque cítrico de lima.',
    6.40,
    'unit',
    NULL,
    'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80',
    true
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  price_type = EXCLUDED.price_type,
  price_unit = EXCLUDED.price_unit,
  category_id = EXCLUDED.category_id,
  image_url = EXCLUDED.image_url,
  is_available = EXCLUDED.is_available;
