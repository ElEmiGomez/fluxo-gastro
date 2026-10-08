-- ==============================================================================
-- FLUXO — DESCUENTOS EN CARTA (PRECIO INICIAL TACHADO)
-- Permite configurar ofertas con precio habitual tachado y precio con descuento.
-- ==============================================================================

alter table public.products
  add column if not exists original_price decimal(10,2);
