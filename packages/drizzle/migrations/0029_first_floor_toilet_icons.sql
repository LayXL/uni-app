-- The two western first-floor toilets are women on the left, men on the right.
DO $toilet_icons$
DECLARE
    scheme jsonb;
BEGIN
    SELECT "json"::jsonb INTO scheme
    FROM "config" WHERE "id" = 'buildingScheme' FOR UPDATE;

    IF scheme IS NULL OR jsonb_typeof(scheme->'entities') IS DISTINCT FROM 'array' THEN
        RAISE EXCEPTION 'Published building scheme is missing or invalid';
    END IF;

    IF (SELECT count(*) FROM jsonb_array_elements(scheme->'entities') AS e
        WHERE e->>'id' IN ('2', '3') AND e->>'floorId' = '0'
            AND e->>'type' = 'room' AND e->>'name' = 'Туалет') <> 2 THEN
        RAISE EXCEPTION 'Expected first-floor toilets with ids 2 and 3';
    END IF;

    SELECT jsonb_set(scheme, '{entities}', jsonb_agg(
        CASE e->>'id'
            WHEN '2' THEN e || '{"icon":"toilet-women"}'::jsonb
            WHEN '3' THEN e || '{"icon":"toilet-men"}'::jsonb
            ELSE e
        END ORDER BY ord
    )) INTO scheme
    FROM jsonb_array_elements(scheme->'entities') WITH ORDINALITY AS entities(e, ord);

    UPDATE "config" SET "json" = scheme WHERE "id" = 'buildingScheme';
END
$toilet_icons$;
