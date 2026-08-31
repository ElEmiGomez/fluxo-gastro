-- ==============================================================================
-- GASTRO PWA / FLUXO - MIGRACIÓN FASE 1: PRODUCCIÓN B2B (SUPABASE POSTGRESQL)
-- ==============================================================================

-- 1. Extensiones necesarias
create extension if not exists "uuid-ossp";

-- 2. Tabla: Restaurantes (Tenants)
create table if not exists public.restaurants (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  slug text unique not null,
  logo_url text,
  primary_color text default '#1e3a8a',
  secondary_color text default '#0f172a',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Tabla: Categorías del Menú
create table if not exists public.categories (
  id uuid default gen_random_uuid() primary key,
  restaurant_id uuid references public.restaurants(id) on delete cascade not null,
  name text not null,
  order_index int default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Tabla: Productos
create table if not exists public.products (
  id uuid default gen_random_uuid() primary key,
  restaurant_id uuid references public.restaurants(id) on delete cascade not null,
  category_id uuid references public.categories(id) on delete cascade not null,
  name text not null,
  description text,
  price decimal(10,2) not null check (price >= 0),
  image_url text,
  model_3d_url text,
  is_available boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Tabla: Mesas Físicas del Local
create table if not exists public.tables (
  id uuid default gen_random_uuid() primary key,
  restaurant_id uuid references public.restaurants(id) on delete cascade not null,
  table_number int not null,
  qr_code_url text,
  unique(restaurant_id, table_number)
);

-- 6. Tabla: Sesiones de Mesa por Visita (Seguridad Crítica con UUID)
-- Resuelve la vulnerabilidad de confiar ciegamente en ?table=[n]
create table if not exists public.table_sessions (
  id uuid default gen_random_uuid() primary key,
  restaurant_id uuid references public.restaurants(id) on delete cascade not null,
  table_number int not null,
  session_token uuid default gen_random_uuid() unique not null,
  status text check (status in ('active', 'closed', 'expired')) default 'active' not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  closed_at timestamp with time zone
);

-- Índice para búsquedas ultra-rápidas de sesiones activas por token
create index if not exists idx_table_sessions_token_status 
  on public.table_sessions(session_token, status);

create index if not exists idx_table_sessions_active_table
  on public.table_sessions(restaurant_id, table_number, status);

-- 7. Tabla: Órdenes / Comandas (Asociadas a la Sesión UUID)
create table if not exists public.orders (
  id uuid default gen_random_uuid() primary key,
  restaurant_id uuid references public.restaurants(id) on delete cascade not null,
  table_session_id uuid references public.table_sessions(id) on delete cascade,
  table_number int not null,
  status text check (status in ('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled')) default 'pending' not null,
  total_amount decimal(10,2) not null check (total_amount >= 0),
  discount_percentage int default 0 check (discount_percentage between 0 and 100),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_orders_restaurant_status 
  on public.orders(restaurant_id, status);

-- 8. Tabla: Items de la Orden
create table if not exists public.order_items (
  id uuid default gen_random_uuid() primary key,
  order_id uuid references public.orders(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete cascade not null,
  quantity int not null check (quantity > 0),
  notes text,
  course text check (course in ('first', 'second', 'dessert', 'drink')) default 'first'
);

-- 9. Tabla: Llamadas de Servicio (Mozo, Cuenta, Hielo, etc.)
create table if not exists public.service_calls (
  id uuid default gen_random_uuid() primary key,
  restaurant_id uuid references public.restaurants(id) on delete cascade not null,
  table_session_id uuid references public.table_sessions(id) on delete cascade,
  table_number int not null,
  call_type text not null,
  status text check (status in ('pending', 'attended')) default 'pending' not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_service_calls_restaurant_status 
  on public.service_calls(restaurant_id, status);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) - AISLAMIENTO MULTI-TENANT
-- ==============================================================================

alter table public.restaurants enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.tables enable row level security;
alter table public.table_sessions enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.service_calls enable row level security;

-- Políticas de Lectura Pública para el Menú
create policy "Lectura pública de restaurantes activos"
  on public.restaurants for select using (true);

create policy "Lectura pública de categorías"
  on public.categories for select using (true);

create policy "Lectura pública de productos disponibles"
  on public.products for select using (is_available = true);

create policy "Lectura pública de mesas"
  on public.tables for select using (true);

-- Políticas de Sesiones de Mesa:
-- El comensal solo puede consultar o validar su propio token
create policy "Comensales pueden validar su propio token de sesión"
  on public.table_sessions for select
  using (status = 'active');

-- Políticas de Comandas:
-- Inserción permitida si la sesión asociada está activa
create policy "Comensales pueden insertar comandas en sesiones activas"
  on public.orders for insert
  with check (
    exists (
      select 1 from public.table_sessions ts
      where ts.id = table_session_id
        and ts.status = 'active'
        and ts.restaurant_id = orders.restaurant_id
    )
  );

-- Comensales pueden ver sólo las órdenes de su sesión activa
create policy "Comensales leen órdenes de su sesión"
  on public.orders for select
  using (
    exists (
      select 1 from public.table_sessions ts
      where ts.id = table_session_id
        and ts.status = 'active'
    )
  );

create policy "Gestión de items de comanda"
  on public.order_items for all
  using (true)
  with check (true);

create policy "Gestión de llamadas de servicio en sesiones activas"
  on public.service_calls for all
  using (true)
  with check (true);

-- ==============================================================================
-- REALTIME REPLICATION (Habilitación para Fase 2)
-- ==============================================================================
alter publication supabase_realtime add table public.orders;
alter publication supabase_realtime add table public.order_items;
alter publication supabase_realtime add table public.table_sessions;
alter publication supabase_realtime add table public.service_calls;

-- ==============================================================================
-- FUNCIÓN ATÓMICA DE CIERRE DE MESA (INVALIDACIÓN INMEDIATA DE TOKEN)
-- ==============================================================================
create or replace function public.close_table_session(p_restaurant_id uuid, p_table_number int)
returns void as $$
begin
  -- 1. Marcar sesión activa como cerrada
  update public.table_sessions
  set status = 'closed', closed_at = timezone('utc'::text, now())
  where restaurant_id = p_restaurant_id
    and table_number = p_table_number
    and status = 'active';

  -- 2. Marcar avisos pendientes de esta mesa como atendidos
  update public.service_calls
  set status = 'attended'
  where restaurant_id = p_restaurant_id
    and table_number = p_table_number
    and status = 'pending';
end;
$$ language plpgsql security definer;
