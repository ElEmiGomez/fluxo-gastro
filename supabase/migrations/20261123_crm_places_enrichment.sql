-- ==============================================================================
-- FLUXO CRM: EXTENSIÓN DE PROSPECCIÓN GOOGLE MAPS (PLACES API NEW) & RUTAS
-- Migración aditiva y 100% retrocompatible (cero pérdida de registros de Noia)
-- ==============================================================================

-- 1. Identificadores y enlaces oficiales de Google Maps Platform
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS google_place_id VARCHAR(255);
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS google_profile_url TEXT;
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS google_review_url TEXT;
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS website_url TEXT;
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS primary_type VARCHAR(100);

-- 2. Enriquecimiento de menú online y redes sociales verificadas
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS online_menu_status VARCHAR(30) DEFAULT 'unknown';
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS online_menu_url TEXT;
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS instagram_url TEXT;
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS facebook_url TEXT;

-- 3. Geografía multi-ciudad y logística de visitas en sábado
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS city VARCHAR(100) NOT NULL DEFAULT 'Noia';
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION;
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION;
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS saturday_hours TEXT;
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS saturday_closed BOOLEAN DEFAULT FALSE;
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS route_block VARCHAR(100);
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS route_order INTEGER;

-- 4. Scoring automático (0-100) y propuesta recomendada
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS lead_score INTEGER DEFAULT 50;
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS recommended_pitch VARCHAR(30);

-- 5. Campos auxiliares ya usados por la aplicación
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS custom_slug VARCHAR(150);

-- 6. Restricciones de integridad (idempotentes)
ALTER TABLE crm_leads DROP CONSTRAINT IF EXISTS crm_leads_online_menu_status_check;
ALTER TABLE crm_leads ADD CONSTRAINT crm_leads_online_menu_status_check
  CHECK (online_menu_status IS NULL OR online_menu_status IN ('none', 'pdf', 'web_interactive', 'unknown'));

ALTER TABLE crm_leads DROP CONSTRAINT IF EXISTS crm_leads_recommended_pitch_check;
ALTER TABLE crm_leads ADD CONSTRAINT crm_leads_recommended_pitch_check
  CHECK (recommended_pitch IS NULL OR recommended_pitch IN ('carta_qr', 'cartel_resenas', 'ambos'));

ALTER TABLE crm_leads DROP CONSTRAINT IF EXISTS crm_leads_lead_score_check;
ALTER TABLE crm_leads ADD CONSTRAINT crm_leads_lead_score_check
  CHECK (lead_score IS NULL OR (lead_score >= 0 AND lead_score <= 100));

ALTER TABLE crm_leads DROP CONSTRAINT IF EXISTS crm_leads_target_plan_check;
ALTER TABLE crm_leads ADD CONSTRAINT crm_leads_target_plan_check
  CHECK (target_plan IN ('carta_15', 'mozo_47', 'fundador_50', 'full_97', 'carta_39', 'sala_69', 'full_99', 'suite_139'));

-- 7. Backfill seguro para locales existentes de Noia
UPDATE crm_leads SET city = 'Noia' WHERE city IS NULL OR TRIM(city) = '';

-- 8. Índices para upsert sin duplicados y filtros rápidos multi-ciudad
CREATE UNIQUE INDEX IF NOT EXISTS idx_crm_leads_google_place_id_unique
  ON crm_leads(google_place_id)
  WHERE google_place_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_crm_leads_city ON crm_leads(city);
CREATE INDEX IF NOT EXISTS idx_crm_leads_recommended_pitch ON crm_leads(recommended_pitch);
CREATE INDEX IF NOT EXISTS idx_crm_leads_online_menu_status ON crm_leads(online_menu_status);
CREATE INDEX IF NOT EXISTS idx_crm_leads_lead_score ON crm_leads(lead_score DESC);
