-- SCHEMA SQL EXACTO SUPABASE: FLUXO GASTRONOMIC SYSTEM (PWA)

-- 1. Restaurantes (Multi-tenant core)
create table if not exists restaurants (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  slug text unique not null,
  logo_url text,
  primary_color text default '#000000',
  secondary_color text default '#ffffff',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  google_place_id text,
  google_review_url text,
  phone text,
  address text,
  city text,
  postal_code text,
  cuisine_type text[],
  price_range text default 'EUR'
);

-- 2. Categorias del Menu
create table if not exists categories (
  id uuid default gen_random_uuid() primary key,
  restaurant_id uuid references restaurants(id) on delete cascade not null,
  name text not null,
  order_index int default 0
);

-- 3. Productos
create table if not exists products (
  id uuid default gen_random_uuid() primary key,
  restaurant_id uuid references restaurants(id) on delete cascade not null,
  category_id uuid references categories(id) on delete cascade not null,
  name text not null,
  description text,
  price decimal(10,2) not null,
  image_url text,
  model_3d_url text,
  is_available boolean default true,
  price_type text default 'unit',
  price_unit text
);

-- 4. Mesas del Local
create table if not exists tables (
  id uuid default gen_random_uuid() primary key,
  restaurant_id uuid references restaurants(id) on delete cascade not null,
  table_number int not null,
  qr_code_url text,
  unique(restaurant_id, table_number)
);

-- 5. Sesiones de Mesa (Table Sessions)
create table if not exists table_sessions (
  id uuid default gen_random_uuid() primary key,
  restaurant_id uuid references restaurants(id) on delete cascade not null,
  table_number int not null,
  session_token uuid default gen_random_uuid() not null,
  status text check (status in ('active', 'closed', 'expired')) default 'active',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  closed_at timestamp with time zone
);

-- 6. Llamadas de Servicio (Service Calls)
create table if not exists service_calls (
  id uuid default gen_random_uuid() primary key,
  restaurant_id uuid references restaurants(id) on delete cascade not null,
  table_number int not null,
  call_type text default 'call_waiter',
  status text check (status in ('pending', 'attended', 'cancelled')) default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  attended_at timestamp with time zone
);

-- 7. Ordenes / Comandas (Gatekeeper + KDS)
create table if not exists orders (
  id uuid default gen_random_uuid() primary key,
  restaurant_id uuid references restaurants(id) on delete cascade not null,
  table_id uuid references tables(id) on delete set null,
  table_number int not null,
  table_session_id uuid references table_sessions(id) on delete set null,
  session_token text,
  idempotency_key text unique,
  status text check (status in ('pending_validation', 'pending', 'confirmed', 'preparing', 'ready', 'delivered', 'paid', 'cancelled')) default 'pending_validation',
  total_amount decimal(10,2) not null,
  discount_percentage decimal(5,2) default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8. Items de la Orden
create table if not exists order_items (
  id uuid default gen_random_uuid() primary key,
  order_id uuid references orders(id) on delete cascade not null,
  product_id uuid references products(id) on delete cascade not null,
  quantity int not null check (quantity > 0),
  notes text
);

-- REALTIME SUBSCRIPTIONS
alter publication supabase_realtime add table orders;
alter publication supabase_realtime add table order_items;
alter publication supabase_realtime add table service_calls;
alter publication supabase_realtime add table table_sessions;
alter publication supabase_realtime add table tables;

-- ROW LEVEL SECURITY (RLS)
alter table restaurants enable row level security;
alter table categories enable row level security;
alter table products enable row level security;
alter table tables enable row level security;
alter table table_sessions enable row level security;
alter table service_calls enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;

create policy "Permitir lectura publica de restaurantes" on restaurants for select using (true);
create policy "Permitir lectura publica de categorias" on categories for select using (true);
create policy "Permitir lectura publica de productos" on products for select using (true);
create policy "Permitir lectura publica de mesas" on tables for select using (true);
create policy "Permitir gestion completa de table_sessions" on table_sessions for all using (true);
create policy "Permitir gestion completa de service_calls" on service_calls for all using (true);
create policy "Permitir gestion completa de ordenes" on orders for all using (true);
create policy "Permitir gestion completa de order_items" on order_items for all using (true);

-- STORED PROCEDURE: CREATE_ORDER_ATOMIC
create or replace function create_order_atomic(
  p_restaurant_id uuid,
  p_table_session_id uuid,
  p_table_number int,
  p_total_amount decimal,
  p_idempotency_key text,
  p_items jsonb
) returns jsonb language plpgsql as $$
declare
  v_existing_order orders%ROWTYPE;
  v_new_order orders%ROWTYPE;
  v_item jsonb;
begin
  if p_idempotency_key is not null then
    select * into v_existing_order from orders where idempotency_key = p_idempotency_key;
    if found then
      return jsonb_build_object('order', row_to_json(v_existing_order), 'idempotent', true);
    end if;
  end if;

  insert into orders (restaurant_id, table_session_id, table_number, total_amount, idempotency_key, status)
  values (p_restaurant_id, p_table_session_id, p_table_number, p_total_amount, p_idempotency_key, 'pending_validation')
  returning * into v_new_order;

  for v_item in select * from jsonb_array_elements(p_items) loop
    insert into order_items (order_id, product_id, quantity, notes)
    values (
      v_new_order.id,
      (v_item->>'product_id')::uuid,
      (v_item->>'quantity')::int,
      v_item->>'notes'
    );
  end loop;

  return jsonb_build_object('order', row_to_json(v_new_order), 'idempotent', false);
end;
$$;

-- SEED DATA: BURGER GOURMET
insert into restaurants (id, name, slug, logo_url, primary_color, secondary_color)
values (
  'a0000000-0000-0000-0000-000000000001',
  'Burger House Gourmet',
  'burger-gourmet',
  'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=200&h=200&q=80',
  '#f97316',
  '#0f172a'
) on conflict (slug) do nothing;

insert into categories (id, restaurant_id, name, order_index) values
('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'NUESTRAS PROMOS', 1),
('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'ENTRADAS', 2),
('c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'PLATOS PRINCIPALES', 3),
('c0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'BURGERS', 4),
('c0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'GIN & BEBIDAS', 5)
on conflict (id) do nothing;

insert into products (id, restaurant_id, category_id, name, description, price, image_url, is_available) values
(
  'b0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'c0000000-0000-0000-0000-000000000001',
  'Combo Pareja: 2 Burgers Dobles + Papas + 2 Pintas',
  '2 Burgers Doble Monster con panceta y cheddar, papas rusticas y 2 cervezas.',
  24.50,
  'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80',
  true
),
(
  'b0000000-0000-0000-0000-000000000002',
  'a0000000-0000-0000-0000-000000000001',
  'c0000000-0000-0000-0000-000000000004',
  'Bacon Cheese Doble Monster',
  'Doble medallon de 160g de blend de asado, cheddar, panceta crocante y salsa barbacoa.',
  14.20,
  'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
  true
),
(
  'b0000000-0000-0000-0000-000000000003',
  'a0000000-0000-0000-0000-000000000001',
  'c0000000-0000-0000-0000-000000000005',
  'Gin Tonic de Autor con Frutos Rojos',
  'Gin premium nacional, agua tonica macerada con bayas de enebro.',
  6.40,
  'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80',
  true
)
on conflict (id) do nothing;

insert into tables (id, restaurant_id, table_number) values
('d0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 1),
('d0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 2),
('d0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 3),
('d0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 4),
('d0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 5)
on conflict (restaurant_id, table_number) do nothing;
