-- Mesas del Local (Mesas 1 a 20)
insert into tables (restaurant_id, table_number)
select 'a1111111-1111-1111-1111-111111111111', generate_series(1, 20)
on conflict (restaurant_id, table_number) do nothing;
