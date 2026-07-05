-- Migración: google_tokens
-- Corre esto en el SQL Editor de Supabase (https://supabase.com/dashboard → SQL Editor)
--
-- El schema antiguo guardaba access_token + expiry_date desde el cliente.
-- El nuevo exchange route solo guarda refresh_token (encriptado) desde el servidor.
-- Esta migración actualiza la tabla y sus políticas RLS.

-- 1. Eliminar la tabla anterior si existe (conserva la nueva estructura)
DROP TABLE IF EXISTS public.google_tokens;

-- 2. Crear la tabla con el schema correcto
CREATE TABLE public.google_tokens (
  user_id     UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  refresh_token TEXT      NOT NULL,
  scope       TEXT,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Habilitar Row Level Security
ALTER TABLE public.google_tokens ENABLE ROW LEVEL SECURITY;

-- 4. Política: cada usuario solo puede leer/escribir su propio token
CREATE POLICY "google_tokens_own_row"
  ON public.google_tokens
  FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
