-- ==============================================================================
-- FLUXO 1.2: CRM ESTRATÉGICO DEL FUNDADOR (PROSPECCIÓN Y CONVERSIÓN EN CALLE)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS crm_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(150) NOT NULL,
  address VARCHAR(255) NOT NULL,
  zone VARCHAR(100) NOT NULL DEFAULT 'Noia Centro',
  icp_segment VARCHAR(20) NOT NULL CHECK (icp_segment IN ('CARLOS', 'MARTIN', 'LUCIA')),
  contact_name VARCHAR(150),
  contact_phone VARCHAR(50),
  contact_whatsapp VARCHAR(50),
  instagram VARCHAR(100),
  google_rating NUMERIC(2,1),
  google_reviews_count INTEGER,
  score NUMERIC(3,1) NOT NULL DEFAULT 5.0,
  status VARCHAR(30) NOT NULL DEFAULT 'lead_por_visitar' 
    CHECK (status IN ('lead_por_visitar', 'contactado', 'piloto_14_dias', 'en_negociacion', 'ganado', 'perdido')),
  target_plan VARCHAR(30) NOT NULL DEFAULT 'carta_39' 
    CHECK (target_plan IN ('carta_39', 'sala_69', 'full_99', 'suite_139')),
  mrr_projected NUMERIC(8,2) NOT NULL DEFAULT 39.00,
  pilot_start_date DATE,
  pilot_end_date DATE,
  last_visit_date TIMESTAMPTZ,
  next_contact_date DATE,
  notes TEXT,
  lost_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Índices de aceleración para filtrado analítico y pipeline
CREATE INDEX IF NOT EXISTS idx_crm_leads_status ON crm_leads(status);
CREATE INDEX IF NOT EXISTS idx_crm_leads_score ON crm_leads(score DESC);
CREATE INDEX IF NOT EXISTS idx_crm_leads_zone ON crm_leads(zone);
CREATE INDEX IF NOT EXISTS idx_crm_leads_target_plan ON crm_leads(target_plan);
CREATE INDEX IF NOT EXISTS idx_crm_leads_icp_segment ON crm_leads(icp_segment);

-- Habilitar RLS
ALTER TABLE crm_leads ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
CREATE POLICY "Permitir acceso administrativo y de servicio a crm_leads"
  ON crm_leads
  FOR ALL
  USING (true)
  WITH CHECK (true);


-- Nuevos campos para control de pilotos, checklist y firma digital táctil
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS pilot_checklist JSONB DEFAULT '{"qr_placed":false,"menu_uploaded":false,"staff_trained":false,"review_date_set":false}'::jsonb;
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS pilot_agreement JSONB;

ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS current_pos_system VARCHAR(50) DEFAULT 'carta_fisica_plastificada';
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS google_complaint_tags JSONB DEFAULT '[]'::jsonb;

ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS decision_makers JSONB DEFAULT '[]'::jsonb;
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS beverage_distributor VARCHAR(50) DEFAULT 'sin_patrocinio';

-- Migración de ICPs a A, B, C
ALTER TABLE crm_leads DROP CONSTRAINT IF EXISTS crm_leads_icp_segment_check;
ALTER TABLE crm_leads ADD CONSTRAINT crm_leads_icp_segment_check CHECK (icp_segment IN ('A', 'B', 'C', 'CARLOS', 'MARTIN', 'LUCIA'));
UPDATE crm_leads SET icp_segment = 'A' WHERE icp_segment = 'CARLOS';
UPDATE crm_leads SET icp_segment = 'B' WHERE icp_segment = 'MARTIN';
UPDATE crm_leads SET icp_segment = 'C' WHERE icp_segment = 'LUCIA';
