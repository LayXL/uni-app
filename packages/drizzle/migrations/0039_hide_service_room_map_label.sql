-- Hide the service-room label while retaining its name and clickable geometry.
DO $service_room_label$
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
        WHERE e->>'id' = '172') <> 1 THEN
        RAISE EXCEPTION 'Expected a single service room with id 172';
    END IF;
    SELECT e INTO room FROM jsonb_array_elements(scheme->'entities') AS e
    WHERE e->>'id' = '172';
    IF room->>'type' IS DISTINCT FROM 'room'
        OR room->>'floorId' IS DISTINCT FROM '0'
        OR room->>'name' IS DISTINCT FROM 'Служебное помещение' THEN
        RAISE EXCEPTION 'Unexpected service room identity';
    END IF;

    SELECT jsonb_set(scheme, '{entities}', jsonb_agg(
        CASE WHEN e->>'id' = '172'
            THEN jsonb_set(e, '{nameHidden}', 'true'::jsonb)
            ELSE e
        END ORDER BY ord
    )) INTO scheme
    FROM jsonb_array_elements(scheme->'entities') WITH ORDINALITY AS entities(e, ord);

    UPDATE "config" SET "json" = scheme WHERE "id" = 'buildingScheme';
END
$service_room_label$;
