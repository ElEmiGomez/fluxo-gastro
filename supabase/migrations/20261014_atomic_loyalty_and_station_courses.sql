-- Migration: 20261014_atomic_loyalty_and_station_courses.sql
-- Invariantes de Arquitectura:
-- 1. Eliminación de condición de carrera (TOCTOU) y double-spending en puntos mediante transacciones atómicas SELECT ... FOR UPDATE.
-- 2. Soporte nativo en transition_order para órdenes 100% bebidas (pending_validation -> ready) y reactivación de postres pase 2 (delivered -> preparing).
-- 3. Acreditación retroactiva atómica y blindaje contra duplicación de órdenes en puntos.

-- A. Columna de control de fidelización en órdenes
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS loyalty_credited BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_orders_loyalty_credited ON orders(restaurant_id, table_number, loyalty_credited);

-- B. RPC ATÓMICA: hold_loyalty_points_atomic (Anti-TOCTOU Escrow)
CREATE OR REPLACE FUNCTION hold_loyalty_points_atomic(
  p_slug text,
  p_email text,
  p_points integer,
  p_table_number integer,
  p_session_token text,
  p_product_id text DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE
  v_profile loyalty_profiles%ROWTYPE;
  v_held integer := 0;
  v_available integer := 0;
  v_new_hold_id uuid;
BEGIN
  -- 1. Bloqueo exclusivo del perfil para serialización estricta (Anti-TOCTOU)
  SELECT * INTO v_profile
  FROM loyalty_profiles
  WHERE restaurant_slug = p_slug AND email = lower(trim(p_email))
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'PROFILE_NOT_FOUND',
      'message', 'Perfil de fidelización no encontrado'
    );
  END IF;

  -- 2. Calcular puntos retenidos activos bajo bloqueo
  SELECT COALESCE(SUM(points), 0) INTO v_held
  FROM loyalty_escrow_holds
  WHERE profile_id = v_profile.id AND status = 'held';

  v_available := v_profile.total_points - v_held;

  -- 3. Verificar saldo suficiente
  IF v_available < p_points THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'INSUFFICIENT_POINTS',
      'message', format('Puntos insuficientes: Disponibles %s pts, requeridos %s pts', v_available, p_points),
      'available_points', v_available,
      'held_points', v_held,
      'total_points', v_profile.total_points
    );
  END IF;

  -- 4. Insertar retención de forma atómica
  INSERT INTO loyalty_escrow_holds (
    profile_id,
    restaurant_slug,
    table_number,
    session_token,
    points,
    product_id,
    status,
    created_at
  ) VALUES (
    v_profile.id,
    p_slug,
    p_table_number,
    p_session_token,
    p_points,
    p_product_id,
    'held',
    timezone('utc'::text, now())
  ) RETURNING id INTO v_new_hold_id;

  RETURN jsonb_build_object(
    'success', true,
    'hold_id', v_new_hold_id,
    'profile_id', v_profile.id,
    'held_points', v_held + p_points,
    'available_points', v_available - p_points,
    'total_points', v_profile.total_points
  );
END;
$$;

-- C. RPC ATÓMICA: claim_google_review_bonus_atomic (Anti-Doble Cobro Bono Google)
CREATE OR REPLACE FUNCTION claim_google_review_bonus_atomic(
  p_slug text,
  p_email text,
  p_bonus_points integer DEFAULT 50
) RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE
  v_profile loyalty_profiles%ROWTYPE;
  v_updated loyalty_profiles%ROWTYPE;
  v_bonus integer := COALESCE(p_bonus_points, 50);
BEGIN
  -- 1. Bloqueo exclusivo del perfil
  SELECT * INTO v_profile
  FROM loyalty_profiles
  WHERE restaurant_slug = p_slug AND email = lower(trim(p_email))
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'PROFILE_NOT_FOUND',
      'message', 'Perfil de fidelización no encontrado'
    );
  END IF;

  -- 2. Si ya fue otorgado previamente (Idempotencia estricta)
  IF v_profile.google_review_bonus_awarded THEN
    RETURN jsonb_build_object(
      'success', true,
      'already_awarded', true,
      'bonus_points', 0,
      'new_total_points', v_profile.total_points
    );
  END IF;

  -- 3. Acreditar bonus atómicamente
  UPDATE loyalty_profiles
  SET 
    total_points = total_points + v_bonus,
    google_review_bonus_awarded = TRUE,
    updated_at = timezone('utc'::text, now())
  WHERE id = v_profile.id
  RETURNING * INTO v_updated;

  RETURN jsonb_build_object(
    'success', true,
    'already_awarded', false,
    'bonus_points', v_bonus,
    'new_total_points', v_updated.total_points
  );
END;
$$;

-- D. RPC ATÓMICA: claim_retroactive_orders_atomic (Acreditación retroactiva atómica)
CREATE OR REPLACE FUNCTION claim_retroactive_orders_atomic(
  p_slug text,
  p_email text,
  p_order_ids uuid[]
) RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE
  v_profile loyalty_profiles%ROWTYPE;
  v_uncredited_ids uuid[];
  v_points integer := 0;
  v_updated loyalty_profiles%ROWTYPE;
BEGIN
  IF p_order_ids IS NULL OR array_length(p_order_ids, 1) IS NULL THEN
    RETURN jsonb_build_object('success', true, 'credited_points', 0, 'credited_order_ids', ARRAY[]::uuid[]);
  END IF;

  -- 1. Bloquear y seleccionar únicamente órdenes no acreditadas
  SELECT 
    COALESCE(array_agg(id), ARRAY[]::uuid[]),
    COALESCE(floor(sum(total_amount))::integer, 0)
  INTO v_uncredited_ids, v_points
  FROM orders
  WHERE id = ANY(p_order_ids) AND (loyalty_credited IS FALSE OR loyalty_credited IS NULL)
  FOR UPDATE;

  IF v_points > 0 AND array_length(v_uncredited_ids, 1) > 0 THEN
    -- 2. Marcar órdenes como acreditadas
    UPDATE orders
    SET loyalty_credited = TRUE
    WHERE id = ANY(v_uncredited_ids);

    -- 3. Bloquear y actualizar saldo del perfil
    SELECT * INTO v_profile
    FROM loyalty_profiles
    WHERE restaurant_slug = p_slug AND email = lower(trim(p_email))
    FOR UPDATE;

    IF FOUND THEN
      UPDATE loyalty_profiles
      SET 
        total_points = total_points + v_points,
        updated_at = timezone('utc'::text, now())
      WHERE id = v_profile.id
      RETURNING * INTO v_updated;

      RETURN jsonb_build_object(
        'success', true,
        'credited_points', v_points,
        'credited_order_ids', v_uncredited_ids,
        'new_total_points', v_updated.total_points
      );
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'credited_points', 0,
    'credited_order_ids', ARRAY[]::uuid[]
  );
END;
$$;

-- E. ACTUALIZACIÓN DE MÁQUINA DE ESTADOS: transition_order
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

  -- 4. Validar matriz de transiciones legales (con soporte para bebidas directas a ready y reactivación de postres pase 2)
  CASE v_current_order.status
    WHEN 'pending_validation' THEN
      v_allowed := p_next_status IN ('pending', 'confirmed', 'preparing', 'ready', 'cancelled');
    WHEN 'pending' THEN
      v_allowed := p_next_status IN ('confirmed', 'preparing', 'ready', 'delivered', 'cancelled');
    WHEN 'confirmed' THEN
      v_allowed := p_next_status IN ('preparing', 'ready', 'delivered', 'cancelled');
    WHEN 'preparing' THEN
      v_allowed := p_next_status IN ('ready', 'delivered', 'cancelled');
    WHEN 'ready' THEN
      v_allowed := p_next_status IN ('preparing', 'delivered', 'cancelled');
    WHEN 'delivered' THEN
      v_allowed := p_next_status IN ('preparing', 'ready', 'paid', 'cancelled');
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

  -- 6. Registrar en auditoría de eventos
  INSERT INTO order_events (
    order_id,
    restaurant_id,
    from_status,
    to_status,
    actor_type,
    actor_id,
    version
  ) VALUES (
    v_updated_order.id,
    v_updated_order.restaurant_id,
    v_current_order.status,
    v_updated_order.status,
    COALESCE(p_actor_type, 'waiter'),
    p_actor_id,
    v_updated_order.version
  );

  RETURN jsonb_build_object(
    'success', true,
    'code', 'TRANSITION_APPLIED',
    'message', format('Orden %s transicionada de %s a %s exitosamente', p_order_id, v_current_order.status, p_next_status),
    'order', row_to_json(v_updated_order),
    'version', v_updated_order.version,
    'previous_status', v_current_order.status,
    'new_status', v_updated_order.status
  );
END;
$$;
