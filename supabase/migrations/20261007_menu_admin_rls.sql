-- ==============================================================================
-- FLUXO - MIGRACIÓN DE ADMINISTRACIÓN DE MENÚ: RLS PARA PRODUCTOS Y CATEGORÍAS
-- ==============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'products' 
    AND policyname = 'Permitir gestion de productos para administracion'
  ) THEN
    CREATE POLICY "Permitir gestion de productos para administracion"
      ON public.products FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'categories' 
    AND policyname = 'Permitir gestion de categorias para administracion'
  ) THEN
    CREATE POLICY "Permitir gestion de categorias para administracion"
      ON public.categories FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;
