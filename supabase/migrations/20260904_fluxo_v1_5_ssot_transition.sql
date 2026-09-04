-- ==============================================================================
-- 🚀 FLUXO 1.5: MIGRACIÓN SSOT POSTGRESQL (SUPABASE)
-- Concurrencia optimista, versionado de comandas, auditoría y transiciones atómicas
-- ==============================================================================

-- 1. Añadir columna 'version' a la tabla orders si no existe
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1;

-- 2. Añadir columna 'updated_at' a orders si no existe
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT timezone('utc'::text, now());

-- 3. Crear tabla de auditoría de eventos de comanda
CREATE TABLE IF NOT EXISTS order_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  restaurant_id uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  from_status text,
  to_status text NOT NULL,
  version integer NOT NULL,
  actor_type text DEFAULT 'waiter',
  actor_id uuid,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS en order_events
ALTER TABLE order_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir gestion completa de order_events" ON order_events;
CREATE POLICY "Permitir gestion completa de order_events" ON order_events FOR ALL USING (true);

-- Añadir a la publicación realtime de manera idempotente
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'order_events'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE order_events;
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- 4. FUNCIÓN ATÓMICA RPC: transition_order
CREATE OR REPLACE FUNCTION transition_order(
  p_order_id uuid,
  p_restaurant_id uuid,
  p_next_status text,
  p_expected_version integer DEFAULT NULL,
  p_actor_type text DEFAULT 'waiter',
  p_actor_id uuid DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE
  v_current_order orders%ROWTYPE;
  v_updated_order orders%ROWTYPE;
  v_allowed boolean := false;
BEGIN
  -- 1. Obtener la orden actual con bloqueo exclusivo de fila para serialización estricta (OCC)
  SELECT * INTO v_current_order
  FROM orders
  WHERE id = p_order_id AND restaurant_id = p_restaurant_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'ORDER_NOT_FOUND',
      'message', 'La comanda solicitada no existe para este restaurante'
    );
  END IF;

  -- 2. Validar versión optimista si se especificó
  IF p_expected_version IS NOT NULL AND v_current_order.version != p_expected_version THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'VERSION_CONFLICT',
      'message', 'Conflicto de concurrencia: la orden ya fue modificada por otro usuario',
      'current_version', v_current_order.version,
      'current_status', v_current_order.status
    );
  END IF;

  -- 3. Si el estado ya es el solicitado (idempotencia)
  IF v_current_order.status = p_next_status THEN
    RETURN jsonb_build_object(
      'success', true,
      'code', 'ALREADY_IN_STATE',
      'order', row_to_json(v_current_order),
      'version', v_current_order.version
    );
  END IF;

  -- 4. Validar matriz estricta de transiciones legales
  CASE v_current_order.status
    WHEN 'pending_validation' THEN
      v_allowed := p_next_status IN ('pending', 'confirmed', 'preparing', 'cancelled');
    WHEN 'pending' THEN
      v_allowed := p_next_status IN ('confirmed', 'preparing', 'ready', 'delivered', 'cancelled');
    WHEN 'confirmed' THEN
      v_allowed := p_next_status IN ('preparing', 'ready', 'delivered', 'cancelled');
    WHEN 'preparing' THEN
      v_allowed := p_next_status IN ('ready', 'delivered', 'cancelled');
    WHEN 'ready' THEN
      v_allowed := p_next_status IN ('delivered', 'cancelled');
    WHEN 'delivered' THEN
      v_allowed := p_next_status IN ('paid', 'cancelled');
    WHEN 'paid' THEN
      v_allowed := false;
    WHEN 'cancelled' THEN
      v_allowed := false;
    ELSE
      v_allowed := false;
  END CASE;

  IF NOT v_allowed THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'TRANSITION_INVALID',
      'message', format('Transición ilegal de %s hacia %s', v_current_order.status, p_next_status),
      'current_status', v_current_order.status,
      'attempted_status', p_next_status
    );
  END IF;

  -- 5. Ejecutar la actualización atómica
  UPDATE orders
  SET 
    status = p_next_status,
    version = version + 1,
    updated_at = timezone('utc'::text, now())
  WHERE id = p_order_id AND restaurant_id = p_restaurant_id
  RETURNING * INTO v_updated_order;

  -- 6. Registrar en auditoría
  INSERT INTO order_events (
    order_id,
    restaurant_id,
    from_status,
    to_status,
    version,
    actor_type,
    actor_id
  ) VALUES (
    p_order_id,
    p_restaurant_id,
    v_current_order.status,
    p_next_status,
    v_updated_order.version,
    p_actor_type,
    p_actor_id
  );

  RETURN jsonb_build_object(
    'success', true,
    'code', 'TRANSITION_APPLIED',
    'order', row_to_json(v_updated_order),
    'version', v_updated_order.version,
    'previous_status', v_current_order.status,
    'new_status', p_next_status
  );
END;
$$;
