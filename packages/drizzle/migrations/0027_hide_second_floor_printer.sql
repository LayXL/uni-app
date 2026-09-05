-- Hide the second-floor printer marker while keeping the typography searchable.
DO $printer_marker$
DECLARE
    scheme jsonb;
    printer jsonb;
BEGIN
    SELECT "json"::jsonb INTO scheme
    FROM "config" WHERE "id" = 'buildingScheme' FOR UPDATE;

    IF scheme IS NULL OR jsonb_typeof(scheme->'entities') IS DISTINCT FROM 'array' THEN
        RAISE EXCEPTION 'Published building scheme is missing or invalid';
    END IF;

    SELECT value INTO printer FROM jsonb_array_elements(scheme->'entities')
    WHERE value->>'id' = '172';

    -- A map where the marker was already deleted needs no change.
    IF printer IS NULL THEN
        RETURN;
    END IF;

    IF printer->>'floorId' IS DISTINCT FROM '1'
        OR printer->>'type' IS DISTINCT FROM 'place'
        OR printer->>'name' IS DISTINCT FROM 'Типография' THEN
        RAISE EXCEPTION 'Unexpected second-floor printer identity: 172';
    END IF;

    SELECT jsonb_set(scheme, '{entities}', jsonb_agg(
        CASE WHEN e->>'id' = '172' THEN e || '{"hiddenOnMap":true}'::jsonb
        ELSE e END ORDER BY ord
    )) INTO scheme
    FROM jsonb_array_elements(scheme->'entities') WITH ORDINALITY AS entities(e, ord);

    UPDATE "config" SET "json" = scheme WHERE "id" = 'buildingScheme';
END
$printer_marker$;
