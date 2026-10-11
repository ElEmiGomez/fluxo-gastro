-- ==============================================================================
-- FLUXO 1.2: MÓDULO DE FIDELIZACIÓN DIGITAL & SISTEMA DE PUNTOS CON SALDO RETENIDO (ESCROW)
-- ==============================================================================

-- 1. Tabla de Perfiles de Fidelización
CREATE TABLE IF NOT EXISTS loyalty_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_slug VARCHAR(100) NOT NULL,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  total_points INTEGER NOT NULL DEFAULT 0 CHECK (total_points >= 0),
  google_review_bonus_awarded BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT uq_loyalty_profiles_slug_email UNIQUE (restaurant_slug, email)
);

-- 2. Tabla de Recompensas por Puntos (Catálogo de Canje)
CREATE TABLE IF NOT EXISTS loyalty_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_slug VARCHAR(100) NOT NULL,
  product_id VARCHAR(100) NOT NULL,
  points_cost INTEGER NOT NULL CHECK (points_cost > 0),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 3. Tabla de Retenciones de Puntos (Escrow)
CREATE TABLE IF NOT EXISTS loyalty_escrow_holds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES loyalty_profiles(id) ON DELETE CASCADE,
  restaurant_slug VARCHAR(100) NOT NULL,
  table_number INTEGER NOT NULL,
  session_token VARCHAR(100) NOT NULL,
  points INTEGER NOT NULL CHECK (points > 0),
  product_id VARCHAR(100),
  status VARCHAR(20) NOT NULL DEFAULT 'held' CHECK (status IN ('held', 'settled', 'released')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 4. Índices para Alto Rendimiento
CREATE INDEX IF NOT EXISTS idx_loyalty_profiles_email ON loyalty_profiles(restaurant_slug, email);
CREATE INDEX IF NOT EXISTS idx_loyalty_rewards_slug ON loyalty_rewards(restaurant_slug, is_active);
CREATE INDEX IF NOT EXISTS idx_loyalty_escrow_profile_status ON loyalty_escrow_holds(profile_id, status);
CREATE INDEX IF NOT EXISTS idx_loyalty_escrow_session ON loyalty_escrow_holds(restaurant_slug, table_number, status);

-- 5. Habilitar RLS en todas las tablas
ALTER TABLE loyalty_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_escrow_holds ENABLE ROW LEVEL SECURITY;

-- 6. Políticas RLS
CREATE POLICY "Permitir lectura publica de recompensas de fidelizacion"
  ON loyalty_rewards FOR SELECT
  USING (true);

CREATE POLICY "Permitir lectura de perfiles de fidelizacion"
  ON loyalty_profiles FOR SELECT
  USING (true);

CREATE POLICY "Permitir creacion/actualizacion de perfiles de fidelizacion"
  ON loyalty_profiles FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Permitir actualizacion controlada de perfiles de fidelizacion"
  ON loyalty_profiles FOR UPDATE
  USING (true);

CREATE POLICY "Permitir gestion de retenciones de fidelizacion"
  ON loyalty_escrow_holds FOR ALL
  USING (true);
