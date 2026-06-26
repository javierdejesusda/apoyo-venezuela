-- Idempotency + reversibility for bulk-imported locations. Each imported row is
-- tagged with its external source URL; organic (user-submitted) rows stay null.
alter table public.locations add column if not exists source_ref text;

-- At most one location per source report. Partial index so the many organic
-- rows (source_ref is null) are exempt and re-running an import cannot duplicate.
create unique index if not exists locations_source_ref_key
  on public.locations (source_ref)
  where source_ref is not null;
