-- Apoyo Venezuela - radio de incertidumbre de coordenadas.
-- Agrega accuracy_m (radio en metros) a locations para el circulo del mapa.
-- Nullable: null significa coordenada exacta. Coincide con lib/data/supabase-store.ts.

alter table public.locations
  add column if not exists accuracy_m double precision;
