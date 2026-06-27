-- Idempotency + reversibility for bulk-imported needs (e.g. ayudaencamino.com).
-- Each imported need is tagged with its external source URL; organic
-- (user-submitted) needs stay null. Mirrors locations.source_ref.
alter table public.needs add column if not exists source_ref text;

-- At most one need per source record. Partial index so organic needs
-- (source_ref is null) are exempt and re-running an import cannot duplicate.
create unique index if not exists needs_source_ref_key
  on public.needs (source_ref)
  where source_ref is not null;
