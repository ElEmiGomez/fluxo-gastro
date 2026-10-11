-- ==============================================================================
-- FLUXO — COSTE DE INGREDIENTES / MATERIA PRIMA (RENTABILIDAD Y MATRIZ BCG)
-- Permite registrar el coste de materia prima por plato para calcular márgenes reales.
-- ==============================================================================

alter table public.products
  add column if not exists cost_price decimal(10,2) check (cost_price >= 0);
