-- REGLAMENTO (UE) Nº 1169/2011 — INFORMACIÓN ALIMENTARIA FACILITADA AL CONSUMIDOR
-- Adición de columna allergens (array de texto) a la tabla products para almacenar los 14 alérgenos obligatorios de la UE.

ALTER TABLE products
ADD COLUMN IF NOT EXISTS allergens text[] DEFAULT '{}';

COMMENT ON COLUMN products.allergens IS 'Lista de los 14 alérgenos obligatorios de la UE conforme al Reglamento 1169/2011 (gluten, dairy, eggs, etc.)';
