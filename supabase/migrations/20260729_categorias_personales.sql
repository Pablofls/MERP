-- Tabla de categorías personales
CREATE TABLE IF NOT EXISTS categorias_personales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE categorias_personales ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own categorias" ON categorias_personales;
CREATE POLICY "Users manage own categorias" ON categorias_personales
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Columna categoria_personal_id en pendientes
ALTER TABLE pendientes ADD COLUMN IF NOT EXISTS categoria_personal_id UUID REFERENCES categorias_personales(id) ON DELETE SET NULL;
