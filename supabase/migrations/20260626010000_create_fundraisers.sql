-- Recaudaciones (campanas de GoFundMe) aportadas por la comunidad.
-- Las columnas coinciden con lib/data/supabase-store.ts. La url se guarda ya
-- normalizada (https, sin www, sin query ni hash) y es unica para evitar
-- duplicados. El CHECK exige un enlace de GoFundMe incluso para inserts directos
-- (la RLS de insert es abierta), espejando la validacion de lib/data/fundraiser-url.ts.

create table if not exists public.fundraisers (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descripcion text not null,
  url text not null unique,
  organizador text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint fundraisers_url_gofundme check (
    url ~* '^https://([a-z0-9-]+\.)*gofundme\.com/'
    or url ~* '^https://gofund\.me/'
  )
);

create index if not exists idx_fundraisers_created on public.fundraisers (created_at desc);

-- Herramienta ciudadana: lectura y creacion abiertas (sin login). No se permite
-- actualizar ni borrar; la moderacion queda como mejora futura (ver README).
alter table public.fundraisers enable row level security;

create policy "fundraisers_select_public" on public.fundraisers for select using (true);
create policy "fundraisers_insert_public" on public.fundraisers for insert with check (true);

-- Actualizaciones en vivo (lista) via Supabase Realtime, igual que el resto.
alter publication supabase_realtime add table public.fundraisers;

-- Campana inicial para que produccion muestre la lista desde el primer momento.
insert into public.fundraisers (titulo, descripcion, url)
values (
  'Ayuda de emergencia para víctimas del terremoto en Venezuela',
  'Campaña en GoFundMe para apoyar a las familias afectadas por el terremoto en Venezuela. Los aportes ayudan a cubrir alimentos, refugio temporal y atención médica.',
  'https://gofundme.com/f/emergency-relief-for-venezuela-earthquake-victims'
)
on conflict (url) do nothing;
