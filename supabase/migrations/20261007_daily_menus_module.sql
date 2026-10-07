-- ==============================================================================
-- FLUXO OS - MIGRACIÓN: MÓDULO MENÚ DEL DÍA DINÁMICO & PROMO FALLBACK
-- ==============================================================================
-- Arquitectura preparada para activación futura. No altera flujos en producción.

-- 1. Alteración a la tabla de productos para Promo Fallback
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS is_highlighted_promo boolean DEFAULT false NOT NULL;

-- 2. Índice parcial único: Solo 1 plato destacado por restaurante al mismo tiempo
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_highlighted_promo_per_restaurant
ON public.products (restaurant_id)
WHERE is_highlighted_promo = true;

-- 3. Tabla: daily_menus (Cabecera del menú del día)
CREATE TABLE IF NOT EXISTS public.daily_menus (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id uuid REFERENCES public.restaurants(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  fixed_price numeric(10, 2) NOT NULL CHECK (fixed_price >= 0),
  is_active boolean DEFAULT false NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Tabla: daily_menu_sections (Pasos o secciones flexibles: Primeros, Segundos, etc.)
CREATE TABLE IF NOT EXISTS public.daily_menu_sections (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  daily_menu_id uuid REFERENCES public.daily_menus(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  sort_order integer DEFAULT 0 NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Tabla: daily_menu_items (Platos asociados a cada paso con disponibilidad)
CREATE TABLE IF NOT EXISTS public.daily_menu_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  section_id uuid REFERENCES public.daily_menu_sections(id) ON DELETE CASCADE NOT NULL,
  dish_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  is_available boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(section_id, dish_id)
);

-- 6. Índices para optimización de consultas
CREATE INDEX IF NOT EXISTS idx_daily_menus_restaurant_active ON public.daily_menus(restaurant_id, is_active);
CREATE INDEX IF NOT EXISTS idx_daily_menu_sections_menu ON public.daily_menu_sections(daily_menu_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_daily_menu_items_section ON public.daily_menu_items(section_id);

-- 7. Row Level Security (RLS)
ALTER TABLE public.daily_menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_menu_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_menu_items ENABLE ROW LEVEL SECURITY;

-- Políticas de Lectura Pública (Comensales y Staff)
CREATE POLICY "Permitir lectura publica de daily_menus"
  ON public.daily_menus FOR SELECT
  USING (true);

CREATE POLICY "Permitir lectura publica de daily_menu_sections"
  ON public.daily_menu_sections FOR SELECT
  USING (true);

CREATE POLICY "Permitir lectura publica de daily_menu_items"
  ON public.daily_menu_items FOR SELECT
  USING (true);

-- Políticas de Escritura para Personal Autenticado
CREATE POLICY "Permitir escritura staff autenticado daily_menus"
  ON public.daily_menus FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Permitir escritura staff autenticado daily_menu_sections"
  ON public.daily_menu_sections FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Permitir escritura staff autenticado daily_menu_items"
  ON public.daily_menu_items FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
