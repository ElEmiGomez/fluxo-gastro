-- ==============================================================================
-- FLUXO — CLAVE FORÁNEA service_calls.table_number -> tables(restaurant_id, table_number)
-- Garantiza integridad referencial: impide llamadas de mesas inexistentes en el local.
-- ==============================================================================

-- 1. Asegurar que las mesas 1 a 25 existen para todos los restaurantes registrados
insert into public.tables (restaurant_id, table_number)
select r.id, t.num
from public.restaurants r
cross join generate_series(1, 25) as t(num)
on conflict (restaurant_id, table_number) do nothing;

-- 2. Añadir restricción de clave foránea compuesta si no existe
do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints 
    where constraint_name = 'fk_service_calls_tables'
      and table_name = 'service_calls'
  ) then
    alter table public.service_calls
      add constraint fk_service_calls_tables
      foreign key (restaurant_id, table_number)
      references public.tables (restaurant_id, table_number)
      on delete cascade;
  end if;
end $$;
