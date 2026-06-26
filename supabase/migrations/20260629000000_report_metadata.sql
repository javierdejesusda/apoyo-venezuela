-- Report metadata: fuente del reporte and tipo de construccion.
-- Adds two optional columns to capture the report source channel
-- and the construction type of the affected structure.
--
-- DEPLOY NOTE: run `supabase db push --linked` at deploy time to apply this
-- migration to the production database.

ALTER TABLE public.locations
  ADD COLUMN IF NOT EXISTS fuente_reporte text
  CHECK (fuente_reporte IN ('vecino', 'video', 'noticia', 'organismo', 'otro'));

ALTER TABLE public.locations
  ADD COLUMN IF NOT EXISTS tipo_construccion text
  CHECK (char_length(tipo_construccion) <= 200);
