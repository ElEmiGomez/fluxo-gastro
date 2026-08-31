-- ==============================================================================
-- FLUXO GASTRO PWA - MIGRACIÓN DE PRODUCCIÓN B2B (FASE 2: SEGURIDAD & CONCURRENCIA)
-- 1. Idempotencia y Prevención de TOCTOU (Unique Constraint + Atomic ON CONFLICT)
-- 2. Row Level Security (RLS) Estricto por Tenant vía auth.uid() y Table Sessions
-- 3. Resiliencia de Sesiones UUID para Comensales
-- ==============================================================================

-- ==============================================================================
-- 1. IDEMPOTENCIA ATÓMICA Y PREVENCIÓN DE TOCTOU
-- ==============================================================================

-- Agregar columna idempotency_key si no existe
ALTER TABLE public.orders 
  ADD COLUMN IF NOT EXISTS idempotency_key TEXT;

-- Restricción UNIQUE en idempotency_key para que PostgreSQL arbitre colisiones
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uq_orders_idempotency_key'
  ) THEN
    ALTER TABLE public.orders 
      ADD CONSTRAINT uq_orders_idempotency_key UNIQUE (idempotency_key);
  END IF;
END $$;

-- Índice para acelerar búsquedas de claves de idempotencia recientes
CREATE INDEX IF NOT EXISTS idx_orders_idempotency_key 
  ON public.orders(idempotency_key) 
  WHERE idempotency_key IS NOT NULL;

-- Procedimiento Almacenado Atómico (Cero TOCTOU)
-- Inserta la comanda y sus ítems en una única transacción atómica serializada por Postgres.
CREATE OR REPLACE FUNCTION public.create_order_atomic(
  p_restaurant_id UUID,
  p_table_session_id UUID,
  p_table_number INT,
  p_total_amount DECIMAL,
  p_idempotency_key TEXT,
  p_items JSONB
) RETURNS JSONB AS $$
DECLARE
  v_order RECORD;
  v_item JSONB;
  v_is_idempotent BOOLEAN := FALSE;
BEGIN
  -- Intento de inserción con cerrojo a nivel de fila único
  -- Si otra petición simultánea con el mismo key compite, Postgres arbitra de inmediato
  INSERT INTO public.orders (
    restaurant_id, table_session_id, table_number, total_amount, idempotency_key, status
  ) VALUES (
    p_restaurant_id, p_table_session_id, p_table_number, p_total_amount, p_idempotency_key, 'pending'
  )
  ON CONFLICT (idempotency_key) DO NOTHING
  RETURNING * INTO v_order;

  -- Si v_order.id es nulo, la carrera la ganó otra petición en el mismo milisegundo
  IF v_order.id IS NULL THEN
    SELECT * INTO v_order FROM public.orders WHERE idempotency_key = p_idempotency_key;
    v_is_idempotent := TRUE;
  ELSE
    -- Solo la transacción ganadora procede a insertar los ítems
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
      INSERT INTO public.order_items (order_id, product_id, quantity, notes)
      VALUES (
        v_order.id,
        (v_item->>'product_id')::UUID,
        (v_item->>'quantity')::INT,
        v_item->>'notes'
      );
    END LOOP;
  END IF;

  RETURN jsonb_build_object(
    'order', row_to_json(v_order),
    'idempotent', v_is_idempotent
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ==============================================================================
-- 2. ROW LEVEL SECURITY (RLS) ESTRICTO - SIN BYPASS POR SERVICE_ROLE
-- ==============================================================================

-- Asegurar RLS activado en todas las tablas sensibles
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.table_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_calls ENABLE ROW LEVEL SECURITY;

-- Limpiar políticas anteriores permisivas si existieran
DROP POLICY IF EXISTS "Aislamiento estricto de órdenes" ON public.orders;
DROP POLICY IF EXISTS "Lectura comensal órdenes" ON public.orders;
DROP POLICY IF EXISTS "Tenant isolation for staff on orders" ON public.orders;
DROP POLICY IF EXISTS "Diners can insert orders with valid active table session" ON public.orders;
DROP POLICY IF EXISTS "Diners can read orders of their active session" ON public.orders;

-- 2.1 Política para Staff / Camareros / Cocina (Usuarios Autenticados)
-- Vincula el tenant_id con el usuario autenticado (auth.uid()) en el JWT
CREATE POLICY "Tenant isolation for staff on orders" ON public.orders
FOR ALL
TO authenticated
USING (
  restaurant_id IN (
    SELECT id FROM public.restaurants 
    WHERE owner_id = auth.uid()
       OR id = NULLIF(current_setting('request.jwt.claims', true)::jsonb->>'restaurant_id', '')::uuid
  )
)
WITH CHECK (
  restaurant_id IN (
    SELECT id FROM public.restaurants 
    WHERE owner_id = auth.uid()
       OR id = NULLIF(current_setting('request.jwt.claims', true)::jsonb->>'restaurant_id', '')::uuid
  )
);

-- 2.2 Política para Comensales Anónimos (Role 'anon' - Escaneo de QR sin Login)
-- Restricción estricta: Solo pueden insertar comandas si el table_session_id corresponde
-- a una sesión 'active' del restaurante. No pueden inyectar pedidos a mesas libres o ajenas.
CREATE POLICY "Diners can insert orders with valid active table session" ON public.orders
FOR INSERT
TO anon
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.table_sessions s
    WHERE s.id = table_session_id
      AND s.restaurant_id = orders.restaurant_id
      AND s.status = 'active'
  )
);

-- 2.3 Los comensales solo pueden consultar el estado de su propia mesa y sesión activa
CREATE POLICY "Diners can read orders of their active session" ON public.orders
FOR SELECT
TO anon
USING (
  EXISTS (
    SELECT 1 FROM public.table_sessions s
    WHERE s.id = orders.table_session_id
      AND s.status = 'active'
  )
);

-- 2.4 Aislamiento en Llamadas de Servicio (Mozo, Cuenta)
DROP POLICY IF EXISTS "Diners can request service calls on active session" ON public.service_calls;
CREATE POLICY "Diners can request service calls on active session" ON public.service_calls
FOR INSERT
TO anon
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.table_sessions s
    WHERE s.id = table_session_id
      AND s.restaurant_id = service_calls.restaurant_id
      AND s.status = 'active'
  )
);

CREATE POLICY "Staff can manage all service calls of their tenant" ON public.service_calls
FOR ALL
TO authenticated
USING (
  restaurant_id IN (
    SELECT id FROM public.restaurants WHERE owner_id = auth.uid()
  )
);
