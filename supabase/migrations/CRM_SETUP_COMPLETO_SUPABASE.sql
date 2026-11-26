-- ==============================================================================
-- FLUXO CRM — SETUP COMPLETO SUPABASE CLOUD (IDEMPOTENTE)
-- Ejecutar UNA SOLA VEZ en Supabase Dashboard -> SQL Editor -> Run
-- Unifica: 20261026_crm_leads + 20261123_crm_places_enrichment + 20261125_crm_review_stands
-- ==============================================================================

CREATE TABLE IF NOT EXISTS crm_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(150) NOT NULL,
  address VARCHAR(255) NOT NULL,
  zone VARCHAR(100) NOT NULL DEFAULT 'Noia Centro',
  icp_segment VARCHAR(20) NOT NULL CHECK (icp_segment IN ('A', 'B', 'C', 'CARLOS', 'MARTIN', 'LUCIA')),
  contact_name VARCHAR(150),
  contact_phone VARCHAR(50),
  contact_whatsapp VARCHAR(50),
  instagram VARCHAR(100),
  google_rating NUMERIC(2,1),
  google_reviews_count INTEGER,
  score NUMERIC(3,1) NOT NULL DEFAULT 5.0,
  status VARCHAR(30) NOT NULL DEFAULT 'lead_por_visitar'
    CHECK (status IN ('lead_por_visitar', 'contactado', 'piloto_14_dias', 'en_negociacion', 'ganado', 'perdido')),
  target_plan VARCHAR(30) NOT NULL DEFAULT 'carta_15'
    CHECK (target_plan IN ('carta_15', 'mozo_47', 'fundador_50', 'full_97', 'carta_39', 'sala_69', 'full_99', 'suite_139')),
  mrr_projected NUMERIC(8,2) NOT NULL DEFAULT 15.00,
  pilot_start_date DATE,
  pilot_end_date DATE,
  last_visit_date TIMESTAMPTZ,
  next_contact_date DATE,
  notes TEXT,
  lost_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_crm_leads_status ON crm_leads(status);
CREATE INDEX IF NOT EXISTS idx_crm_leads_score ON crm_leads(score DESC);
CREATE INDEX IF NOT EXISTS idx_crm_leads_zone ON crm_leads(zone);
CREATE INDEX IF NOT EXISTS idx_crm_leads_target_plan ON crm_leads(target_plan);
CREATE INDEX IF NOT EXISTS idx_crm_leads_icp_segment ON crm_leads(icp_segment);

ALTER TABLE crm_leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir acceso administrativo y de servicio a crm_leads" ON crm_leads;
CREATE POLICY "Permitir acceso administrativo y de servicio a crm_leads"
  ON crm_leads
  FOR ALL
  USING (true)
  WITH CHECK (true);

ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS pilot_checklist JSONB DEFAULT '{"qr_placed":false,"menu_uploaded":false,"staff_trained":false,"review_date_set":false}'::jsonb;
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS pilot_agreement JSONB;
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS current_pos_system VARCHAR(50) DEFAULT 'carta_fisica_plastificada';
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS google_complaint_tags JSONB DEFAULT '[]'::jsonb;
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS decision_makers JSONB DEFAULT '[]'::jsonb;
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS beverage_distributor VARCHAR(50) DEFAULT 'sin_patrocinio';

ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS google_place_id VARCHAR(255);
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS google_profile_url TEXT;
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS google_review_url TEXT;
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS website_url TEXT;
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS primary_type VARCHAR(100);
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS online_menu_status VARCHAR(30) DEFAULT 'unknown';
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS online_menu_url TEXT;
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS instagram_url TEXT;
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS facebook_url TEXT;
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS city VARCHAR(100) NOT NULL DEFAULT 'Noia';
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION;
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION;
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS saturday_hours TEXT;
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS saturday_closed BOOLEAN DEFAULT FALSE;
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS route_block VARCHAR(100);
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS route_order INTEGER;
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS lead_score INTEGER DEFAULT 50;
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS recommended_pitch VARCHAR(30);
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS custom_slug VARCHAR(150);

ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS enable_review_gatekeeper BOOLEAN DEFAULT FALSE;
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS review_stand_mode VARCHAR(40);
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS review_stand_fee_eur NUMERIC(10, 2);

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

ALTER TABLE crm_leads DROP CONSTRAINT IF EXISTS crm_leads_review_stand_mode_check;
ALTER TABLE crm_leads ADD CONSTRAINT crm_leads_review_stand_mode_check
  CHECK (review_stand_mode IS NULL OR review_stand_mode IN ('none', 'included_carta', 'standalone_20'));

CREATE UNIQUE INDEX IF NOT EXISTS idx_crm_leads_google_place_id_unique
  ON crm_leads(google_place_id)
  WHERE google_place_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_crm_leads_city ON crm_leads(city);
CREATE INDEX IF NOT EXISTS idx_crm_leads_recommended_pitch ON crm_leads(recommended_pitch);
CREATE INDEX IF NOT EXISTS idx_crm_leads_online_menu_status ON crm_leads(online_menu_status);
CREATE INDEX IF NOT EXISTS idx_crm_leads_lead_score ON crm_leads(lead_score DESC);
