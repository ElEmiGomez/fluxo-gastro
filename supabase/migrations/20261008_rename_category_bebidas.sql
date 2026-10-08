-- ==============================================================================
-- FLUXO MIGRATION: Renombrar categoría 'GIN & BEBIDAS' a 'Bebidas'
-- Fecha: 08/10/2026
-- Objetivo: Actualizar el nombre de la categoría tanto por ID único como por coincidencia textual
-- ==============================================================================

UPDATE public.categories
SET name = 'Bebidas'
WHERE name ILIKE '%GIN & BEBIDAS%'
   OR id = 'c0000000-0000-0000-0000-000000000005';
