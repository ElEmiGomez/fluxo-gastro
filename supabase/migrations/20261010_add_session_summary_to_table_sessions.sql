-- ==============================================================================
-- FLUXO — RESUMEN DE SESIÓN Y PERSISTENCIA DE COBRO (TABLE SESSIONS)
-- Registra método de pago, importe final cobrado y total de comandas al cerrar mesa.
-- ==============================================================================

alter table public.table_sessions
  add column if not exists payment_method text check (payment_method in ('card', 'cash', 'mixed')),
  add column if not exists final_amount decimal(10,2) check (final_amount >= 0),
  add column if not exists orders_count integer default 1;
