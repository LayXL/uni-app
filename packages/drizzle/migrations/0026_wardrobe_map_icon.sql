-- Show a hanger instead of the cloakroom label; keep its searchable name.
DO $wardrobe_icon$
DECLARE
    scheme jsonb;
BEGIN
    SELECT "json"::jsonb INTO scheme
    FROM "config" WHERE "id" = 'buildingScheme' FOR UPDATE;

    IF scheme IS NULL OR jsonb_typeof(scheme->'entities') IS DISTINCT FROM 'array' THEN
        RAISE EXCEPTION 'Published building scheme is missing or invalid';
    END IF;

    IF (SELECT count(*) FROM jsonb_array_elements(scheme->'entities') AS e
        WHERE e->>'id' = '13' AND e->>'floorId' = '0'
            AND e->>'type' = 'room' AND e->>'name' = 'Гардероб') <> 1 THEN
        RAISE EXCEPTION 'Expected the first-floor cloakroom with id 13';
    END IF;

    SELECT jsonb_set(scheme, '{entities}', jsonb_agg(
        CASE WHEN e->>'id' = '13' THEN e || '{"icon":"wardrobe"}'::jsonb
        ELSE e END ORDER BY ord
    )) INTO scheme
    FROM jsonb_array_elements(scheme->'entities') WITH ORDINALITY AS entities(e, ord);

    UPDATE "config" SET "json" = scheme WHERE "id" = 'buildingScheme';
END
$wardrobe_icon$;
