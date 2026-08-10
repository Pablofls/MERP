CREATE TABLE IF NOT EXISTS fechas_importantes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descripcion TEXT,
  fecha DATE NOT NULL,
  materia_id UUID REFERENCES materias(id) ON DELETE SET NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('examen_final', 'examen_parcial', 'quiz', 'proyecto')),
  completado BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE fechas_importantes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own fechas_importantes"
  ON fechas_importantes
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
