-- Room 105 is not the admissions office.
DO $remove_admissions_description$
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
        WHERE e->>'id' = '10') <> 1 THEN
        RAISE EXCEPTION 'Expected single room with id 10';
    END IF;

    SELECT e INTO room FROM jsonb_array_elements(scheme->'entities') AS e
    WHERE e->>'id' = '10';
    IF room->>'type' IS DISTINCT FROM 'room'
        OR room->>'floorId' IS DISTINCT FROM '0'
        OR room->>'name' IS DISTINCT FROM '105'
        OR COALESCE(room->>'description', '') NOT IN ('', 'Приёмная комиссия', 'Приемная комиссия') THEN
        RAISE EXCEPTION 'Unexpected room 105 identity or description';
    END IF;

    SELECT jsonb_set(scheme, '{entities}', jsonb_agg(
        CASE WHEN e->>'id' = '10' THEN e - 'description' ELSE e END ORDER BY ord
    )) INTO scheme
    FROM jsonb_array_elements(scheme->'entities') WITH ORDINALITY AS entities(e, ord);

    UPDATE "config" SET "json" = scheme WHERE "id" = 'buildingScheme';
END
$remove_admissions_description$;
