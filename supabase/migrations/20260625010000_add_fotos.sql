-- Zone photos: store public image URLs on locations and add a public Storage bucket.
alter table public.locations add column if not exists fotos text[] not null default '{}';

-- The app is anonymous by design (no login, like locations and needs), so uploads
-- stay public. Abuse is bounded server-side for every upload by a 5MB size cap and an
-- image-only MIME allow-list, enforced by Storage regardless of the client.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('fotos', 'fotos', true, 5242880, array['image/*'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "fotos_select_public" on storage.objects;
create policy "fotos_select_public" on storage.objects
  for select using (bucket_id = 'fotos');

drop policy if exists "fotos_insert_public" on storage.objects;
create policy "fotos_insert_public" on storage.objects
  for insert with check (bucket_id = 'fotos');
