-- ==============================================================================
-- FLUXO — HORARIO Y DÍAS DEL MENÚ DEL DÍA DINÁMICO
-- Permite programar franja horaria y días de activación automática del menú.
-- ==============================================================================

alter table public.daily_menus
  add column if not exists schedule_enabled boolean default false,
  add column if not exists schedule_days text[] default array['1', '2', '3', '4', '5'],
  add column if not exists schedule_start_time text default '13:00',
  add column if not exists schedule_end_time text default '16:30';
