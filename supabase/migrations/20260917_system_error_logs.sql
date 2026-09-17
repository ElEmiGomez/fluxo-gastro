-- ==============================================================================
-- 🚀 FLUXO: MIGRACIÓN SYSTEM ERROR LOGS (PERSISTENCIA CLOUD SUPABASE)
-- Almacenamiento persistente, inmutable y estructurado de errores en PostgreSQL
-- ==============================================================================

-- 1. Crear tabla de logs de errores del sistema de forma idempotente
CREATE TABLE IF NOT EXISTS system_error_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  timestamp timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  restaurant_id uuid REFERENCES restaurants(id) ON DELETE SET NULL,
  restaurant_slug text,
  slug text,
  table_number integer,
  service_type text DEFAULT 'service_call',
  call_type text,
  error_code text,
  message text,
  error_message text,
  stacktrace text,
  stack_trace text,
  metadata jsonb DEFAULT '{}'::jsonb
);

-- 2. Índices para acelerar búsquedas y analítica operacional
CREATE INDEX IF NOT EXISTS idx_system_error_logs_created_at ON system_error_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_error_logs_timestamp ON system_error_logs (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_system_error_logs_restaurant_slug ON system_error_logs (restaurant_slug);
CREATE INDEX IF NOT EXISTS idx_system_error_logs_slug ON system_error_logs (slug);
CREATE INDEX IF NOT EXISTS idx_system_error_logs_error_code ON system_error_logs (error_code);
CREATE INDEX IF NOT EXISTS idx_system_error_logs_restaurant_id ON system_error_logs (restaurant_id);

-- 3. Habilitar Row Level Security (RLS)
ALTER TABLE system_error_logs ENABLE ROW LEVEL SECURITY;

-- 4. Políticas de seguridad RLS
DROP POLICY IF EXISTS "Permitir insercion de system_error_logs" ON system_error_logs;
CREATE POLICY "Permitir insercion de system_error_logs" ON system_error_logs
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir lectura de system_error_logs" ON system_error_logs;
CREATE POLICY "Permitir lectura de system_error_logs" ON system_error_logs
  FOR SELECT USING (true);
