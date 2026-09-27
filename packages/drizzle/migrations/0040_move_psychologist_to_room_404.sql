-- Move the psychologist description from room 225 to room 404.
DO $move_psychologist$
DECLARE
    scheme jsonb;
    room jsonb;
BEGIN
    SELECT "json"::jsonb INTO scheme
    FROM "config" WHERE "id" = 'buildingScheme' FOR UPDATE;

    IF scheme IS NULL OR jsonb_typeof(scheme->'entities') IS DISTINCT FROM 'array' THEN
        RAISE EXCEPTION 'Published building scheme is missing or invalid';
    END IF;
    IF (SELECT count(*) FROM jsonb_array_elements(scheme->'entities') AS e
        WHERE e->>'id' = '40') <> 1
        OR (SELECT count(*) FROM jsonb_array_elements(scheme->'entities') AS e
        WHERE e->>'id' = '173') <> 1 THEN
        RAISE EXCEPTION 'Expected single rooms with ids 40 and 173';
    END IF;

    SELECT e INTO room FROM jsonb_array_elements(scheme->'entities') AS e
    WHERE e->>'id' = '40';
    IF room->>'type' IS DISTINCT FROM 'room'
        OR room->>'floorId' IS DISTINCT FROM '1'
        OR room->>'name' IS DISTINCT FROM '225'
        OR COALESCE(room->>'description', '') NOT IN ('', 'Психолог') THEN
        RAISE EXCEPTION 'Unexpected room 225 identity or description';
    END IF;

    SELECT e INTO room FROM jsonb_array_elements(scheme->'entities') AS e
    WHERE e->>'id' = '173';
    IF room->>'type' IS DISTINCT FROM 'room'
        OR room->>'floorId' IS DISTINCT FROM '7'
        OR room->>'name' IS DISTINCT FROM '404'
        OR COALESCE(room->>'description', '') NOT IN ('', 'Психолог') THEN
        RAISE EXCEPTION 'Unexpected room 404 identity or description';
    END IF;

    SELECT jsonb_set(scheme, '{entities}', jsonb_agg(
        CASE
            WHEN e->>'id' = '40' THEN e - 'description'
            WHEN e->>'id' = '173' THEN jsonb_set(e, '{description}', '"Психолог"'::jsonb)
            ELSE e
        END ORDER BY ord
    )) INTO scheme
    FROM jsonb_array_elements(scheme->'entities') WITH ORDINALITY AS entities(e, ord);

    UPDATE "config" SET "json" = scheme WHERE "id" = 'buildingScheme';
END
$move_psychologist$;
