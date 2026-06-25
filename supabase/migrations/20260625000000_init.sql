-- Apoyo Venezuela - esquema inicial.
-- Coordinacion ciudadana de ayuda para el terremoto de Venezuela (24-jun-2026).
-- Las columnas coinciden con lib/data/supabase-store.ts.

create extension if not exists "pgcrypto";

create table if not exists public.locations (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  estado text not null,
  ciudad text not null,
  zona text,
  lat double precision,
  lng double precision,
  status text not null default 'desconocido'
    check (status in ('derrumbe', 'danado', 'estable', 'desconocido')),
  descripcion text,
  contacto_nombre text,
  contacto_telefono text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.needs (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references public.locations(id) on delete cascade,
  categoria text not null
    check (categoria in (
      'rescate', 'agua', 'alimentos', 'medicinas', 'refugio', 'ropa',
      'higiene', 'energia', 'herramientas', 'transporte', 'comunicacion', 'otro'
    )),
  descripcion text not null,
  cantidad text,
  urgencia text not null default 'media' check (urgencia in ('alta', 'media', 'baja')),
  status text not null default 'pendiente'
    check (status in ('pendiente', 'en_camino', 'cubierto')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_locations_estado on public.locations (estado);
create index if not exists idx_locations_status on public.locations (status);
create index if not exists idx_locations_updated on public.locations (updated_at desc);
create index if not exists idx_needs_location on public.needs (location_id);
create index if not exists idx_needs_status on public.needs (status);

-- Herramienta ciudadana de emergencia: lectura y creacion abiertas (sin login),
-- actualizacion abierta para marcar estado de necesidades/zonas. No se permite
-- borrado. La moderacion queda como mejora futura (ver README).
alter table public.locations enable row level security;
alter table public.needs enable row level security;

create policy "locations_select_public" on public.locations for select using (true);
create policy "locations_insert_public" on public.locations for insert with check (true);
create policy "locations_update_public" on public.locations for update using (true) with check (true);

create policy "needs_select_public" on public.needs for select using (true);
create policy "needs_insert_public" on public.needs for insert with check (true);
create policy "needs_update_public" on public.needs for update using (true) with check (true);

-- Actualizaciones en vivo (mapa y listas) via Supabase Realtime.
alter publication supabase_realtime add table public.locations;
alter publication supabase_realtime add table public.needs;
