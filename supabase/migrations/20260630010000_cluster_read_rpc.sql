-- SECURITY DEFINER read RPC for zone cluster data.
-- The three cluster tables (zone_clusters, zone_cluster_members, zone_updates)
-- are RLS-locked with REVOKE from anon/authenticated, so the anon client cannot
-- query them directly. This function runs as the table owner (SECURITY DEFINER)
-- and returns the cluster data as jsonb. The app reads this once per zone page
-- load and derives the canonical view in TypeScript.
--
-- DEPLOY NOTE: run `supabase db push --linked` at deploy time.

CREATE OR REPLACE FUNCTION public.get_cluster_for_location(loc_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cluster_id uuid;
  v_members    jsonb;
  v_updates    jsonb;
BEGIN
  -- Look up which cluster this location belongs to.
  SELECT cluster_id
    INTO v_cluster_id
    FROM zone_cluster_members
   WHERE location_id = loc_id
   LIMIT 1;

  IF v_cluster_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Gather all member location rows (same columns the TypeScript toLocation mapper reads).
  -- ORDER BY l.created_at keeps photo-union order stable across ISR regenerations.
  SELECT jsonb_agg(
    jsonb_build_object(
      'id',                l.id,
      'nombre',            l.nombre,
      'estado',            l.estado,
      'ciudad',            l.ciudad,
      'zona',              l.zona,
      'lat',               l.lat,
      'lng',               l.lng,
      'accuracy_m',        l.accuracy_m,
      'status',            l.status,
      'personas_atrapadas', l.personas_atrapadas,
      'fotos',             l.fotos,
      'fuente_reporte',    l.fuente_reporte,
      'tipo_construccion', l.tipo_construccion,
      'descripcion',       l.descripcion,
      'contacto_nombre',   l.contacto_nombre,
      'contacto_telefono', l.contacto_telefono,
      'created_at',        l.created_at,
      'updated_at',        l.updated_at
    )
    ORDER BY l.created_at ASC
  )
  INTO v_members
  FROM zone_cluster_members m
  JOIN locations l ON l.id = m.location_id
  WHERE m.cluster_id = v_cluster_id;

  -- Gather all audit updates for this cluster, ordered chronologically.
  SELECT jsonb_agg(
    jsonb_build_object(
      'id',         u.id,
      'cluster_id', u.cluster_id,
      'kind',       u.kind,
      'note',       u.note,
      'created_at', u.created_at
    )
    ORDER BY u.created_at ASC
  )
  INTO v_updates
  FROM zone_updates u
  WHERE u.cluster_id = v_cluster_id;

  RETURN jsonb_build_object(
    'members', COALESCE(v_members, '[]'::jsonb),
    'updates', COALESCE(v_updates, '[]'::jsonb)
  );
END;
$$;

-- Restrict direct invocation to app clients only (anon + authenticated).
-- The function's SECURITY DEFINER privilege covers the cluster tables;
-- no direct table grants are needed or wanted.
REVOKE EXECUTE ON FUNCTION public.get_cluster_for_location(uuid) FROM public;
GRANT  EXECUTE ON FUNCTION public.get_cluster_for_location(uuid) TO anon;
GRANT  EXECUTE ON FUNCTION public.get_cluster_for_location(uuid) TO authenticated;
