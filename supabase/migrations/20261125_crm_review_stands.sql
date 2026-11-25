-- ==============================================================================
-- FLUXO CRM: EXPOSITORES NFC + QR DE RESEÑAS GOOGLE Y LOGO OPCIONAL
-- Migración aditiva e idempotente (100% retrocompatible)
-- ==============================================================================

ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS enable_review_gatekeeper BOOLEAN DEFAULT FALSE;
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS review_stand_mode VARCHAR(40);
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS review_stand_fee_eur NUMERIC(10, 2);

ALTER TABLE crm_leads DROP CONSTRAINT IF EXISTS crm_leads_review_stand_mode_check;
ALTER TABLE crm_leads ADD CONSTRAINT crm_leads_review_stand_mode_check
  CHECK (
    review_stand_mode IS NULL
    OR review_stand_mode IN ('none', 'included_carta', 'standalone_20')
  );
