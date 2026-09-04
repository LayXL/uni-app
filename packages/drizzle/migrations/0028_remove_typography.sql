-- The second-floor typography no longer exists. Remove it from the map data
-- used by rendering, search and route destinations, including previously hidden copies.
DO $remove_typography$
DECLARE
    scheme jsonb;
    typography jsonb;
BEGIN
    SELECT "json"::jsonb INTO scheme
    FROM "config" WHERE "id" = 'buildingScheme' FOR UPDATE;

    IF scheme IS NULL OR jsonb_typeof(scheme->'entities') IS DISTINCT FROM 'array' THEN
        RAISE EXCEPTION 'Published building scheme is missing or invalid';
    END IF;

    SELECT value INTO typography FROM jsonb_array_elements(scheme->'entities')
    WHERE value->>'id' = '172';

    IF typography IS NULL THEN
        RETURN;
    END IF;

    IF typography->>'floorId' IS DISTINCT FROM '1'
        OR typography->>'type' IS DISTINCT FROM 'place'
        OR typography->>'name' IS DISTINCT FROM 'Типография' THEN
        RAISE EXCEPTION 'Unexpected map object for typography removal: 172';
    END IF;

    SELECT jsonb_set(scheme, '{entities}', COALESCE(jsonb_agg(e ORDER BY ord), '[]'::jsonb))
    INTO scheme
    FROM jsonb_array_elements(scheme->'entities') WITH ORDINALITY AS entities(e, ord)
    WHERE e->>'id' <> '172';

    UPDATE "config" SET "json" = scheme WHERE "id" = 'buildingScheme';
END
$remove_typography$;
