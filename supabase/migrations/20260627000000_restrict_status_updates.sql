-- Apoyo Venezuela - restrict anonymous updates.
-- The initial schema let any anon client UPDATE any column of any row through
-- the open update policies. For a public emergency map that allowed anyone to
-- rewrite every zone's status or overwrite contact data directly via PostgREST.
-- We drop the open update policies and expose only a validated status change
-- through SECURITY DEFINER functions, so the single legitimate update path
-- (marking a zone or need status) keeps working while arbitrary writes stop.
-- INSERT and SELECT stay open by design (citizen tool, no login).

drop policy if exists "locations_update_public" on public.locations;
drop policy if exists "needs_update_public" on public.needs;

create or replace function public.set_location_status(loc_id uuid, new_status text)
returns public.locations
language plpgsql
security definer
set search_path = public
as $$
declare
  updated public.locations;
begin
  if new_status not in ('derrumbe', 'danado', 'estable', 'desconocido') then
    raise exception 'estado de zona invalido: %', new_status;
  end if;
  update public.locations
    set status = new_status, updated_at = now()
    where id = loc_id
    returning * into updated;
  if not found then
    return null;
  end if;
  return updated;
end;
$$;

create or replace function public.set_need_status(need_id uuid, new_status text)
returns public.needs
language plpgsql
security definer
set search_path = public
as $$
declare
  updated public.needs;
begin
  if new_status not in ('pendiente', 'en_camino', 'cubierto') then
    raise exception 'estado de necesidad invalido: %', new_status;
  end if;
  update public.needs
    set status = new_status, updated_at = now()
    where id = need_id
    returning * into updated;
  if not found then
    return null;
  end if;
  return updated;
end;
$$;

revoke execute on function public.set_location_status(uuid, text) from public;
revoke execute on function public.set_need_status(uuid, text) from public;
grant execute on function public.set_location_status(uuid, text) to anon, authenticated;
grant execute on function public.set_need_status(uuid, text) to anon, authenticated;

-- Keep a location's updated_at fresh when a need is added, without granting
-- anon any UPDATE on locations. Runs as definer so it bypasses the now-closed
-- update policies.
create or replace function public.bump_location_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.locations set updated_at = now() where id = new.location_id;
  return new;
end;
$$;

drop trigger if exists needs_bump_location on public.needs;
create trigger needs_bump_location
  after insert on public.needs
  for each row execute function public.bump_location_updated_at();
