-- ==============================================================================
-- FLUXO — MIGRACIÓN: FACTURACIÓN, SUSCRIPCIONES Y STRIPE
-- Añade soporte para el modelo de cobro recurrente (Días 1-5), Plazas Fundador,
-- registro de pagos (Stripe y manuales) y bucket para comprobantes.
-- ==============================================================================

-- 1. Añadir columnas de facturación a restaurants
ALTER TABLE public.restaurants 
ADD COLUMN IF NOT EXISTS plan_type text DEFAULT 'carta',
ADD COLUMN IF NOT EXISTS monthly_price_eur numeric DEFAULT 39,
ADD COLUMN IF NOT EXISTS is_founder_slot boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS founder_started_at timestamptz,
ADD COLUMN IF NOT EXISTS founder_commitment_accepted boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS billing_day integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS payment_method text,
ADD COLUMN IF NOT EXISTS has_payment_proof boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS pause_level integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS owner_email text,
ADD COLUMN IF NOT EXISTS owner_phone text,
ADD COLUMN IF NOT EXISTS stripe_customer_id text,
ADD COLUMN IF NOT EXISTS stripe_subscription_id text;

-- Asegurar constraint de billing_day (1 a 5)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'restaurants_billing_day_check'
  ) THEN
    ALTER TABLE public.restaurants 
    ADD CONSTRAINT restaurants_billing_day_check CHECK (billing_day BETWEEN 1 AND 5);
  END IF;
END $$;

-- 2. Crear tabla subscription_payments si no existe
CREATE TABLE IF NOT EXISTS public.subscription_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid REFERENCES public.restaurants(id) ON DELETE SET NULL,
  restaurant_slug text NOT NULL,
  amount_base numeric NOT NULL,
  iva_amount numeric NOT NULL,
  total_amount numeric NOT NULL,
  plan_type text NOT NULL,
  billing_day integer CHECK (billing_day BETWEEN 1 AND 5),
  payment_method text NOT NULL,
  payment_status text NOT NULL DEFAULT 'pending',
  proof_storage_path text,
  proof_uploaded_at timestamptz,
  founder_commitment_accepted boolean DEFAULT false,
  stripe_session_id text,
  stripe_subscription_id text,
  stripe_invoice_id text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Habilitar RLS en subscription_payments
ALTER TABLE public.subscription_payments ENABLE ROW LEVEL SECURITY;

-- Políticas de subscription_payments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'subscription_payments' AND policyname = 'Allow public insert subscription_payments'
  ) THEN
    CREATE POLICY "Allow public insert subscription_payments" 
    ON public.subscription_payments FOR INSERT 
    TO public 
    WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'subscription_payments' AND policyname = 'Allow public read subscription_payments'
  ) THEN
    CREATE POLICY "Allow public read subscription_payments" 
    ON public.subscription_payments FOR SELECT 
    TO public 
    USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'subscription_payments' AND policyname = 'Allow public update subscription_payments'
  ) THEN
    CREATE POLICY "Allow public update subscription_payments" 
    ON public.subscription_payments FOR UPDATE 
    TO public 
    USING (true)
    WITH CHECK (true);
  END IF;
END $$;

-- 3. Crear bucket privado payment-proofs en storage
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'payment-proofs',
  'payment-proofs',
  false,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET 
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
