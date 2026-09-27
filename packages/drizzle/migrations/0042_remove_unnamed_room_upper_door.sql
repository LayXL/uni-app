-- The unnamed first-floor room below 108 has only the lower corridor entrance.
DO $remove_upper_door$
DECLARE
    scheme jsonb;
    room jsonb;
    lower_door constant jsonb := '[{"x":239,"y":260}]'::jsonb;
BEGIN
    SELECT "json"::jsonb INTO scheme
    FROM "config" WHERE "id" = 'buildingScheme' FOR UPDATE;

    IF scheme IS NULL OR jsonb_typeof(scheme->'entities') IS DISTINCT FROM 'array' THEN
        RAISE EXCEPTION 'Published building scheme is missing or invalid';
    END IF;
    IF (SELECT count(*) FROM jsonb_array_elements(scheme->'entities') AS e
        WHERE e->>'id' = '14') <> 1 THEN
        RAISE EXCEPTION 'Expected single room with id 14';
    END IF;

    SELECT e INTO room FROM jsonb_array_elements(scheme->'entities') AS e
    WHERE e->>'id' = '14';
    IF room->>'type' IS DISTINCT FROM 'room'
        OR room->>'floorId' IS DISTINCT FROM '0'
        OR room->>'name' IS DISTINCT FROM 'Нет имени'
        OR room->'position' IS DISTINCT FROM '{"x":2025,"y":1266}'::jsonb THEN
        RAISE EXCEPTION 'Unexpected unnamed room identity or position';
    END IF;
    IF room->'doorsPosition' IS DISTINCT FROM '[{"x":239,"y":50},{"x":239,"y":260}]'::jsonb
        AND room->'doorsPosition' IS DISTINCT FROM lower_door THEN
        RAISE EXCEPTION 'Unexpected unnamed room entrances';
    END IF;

    SELECT jsonb_set(scheme, '{entities}', jsonb_agg(
        CASE WHEN e->>'id' = '14' THEN jsonb_set(e, '{doorsPosition}', lower_door)
        ELSE e END ORDER BY ord
    )) INTO scheme
    FROM jsonb_array_elements(scheme->'entities') WITH ORDINALITY AS entities(e, ord);

    UPDATE "config" SET "json" = scheme WHERE "id" = 'buildingScheme';
END
$remove_upper_door$;
