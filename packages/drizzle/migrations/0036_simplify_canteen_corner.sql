-- Simplify the first-floor canteen's upper-right corner to a single recess.
-- Remove the small 75 x 30 step without expanding into the corridor.
-- Preserve the room's position, entrance, metadata and all other map data.
DO $canteen_corner$
DECLARE
    scheme jsonb;
    canteen jsonb;
    old_walls constant jsonb := '[
        {"x":0,"y":0}, {"x":240,"y":0},
        {"x":240,"y":108}, {"x":315,"y":108},
        {"x":315,"y":138}, {"x":434,"y":138},
        {"x":434,"y":541}, {"x":541,"y":541},
        {"x":541,"y":780}, {"x":0,"y":780}
    ]'::jsonb;
    new_walls constant jsonb := '[
        {"x":0,"y":0}, {"x":240,"y":0},
        {"x":240,"y":138}, {"x":434,"y":138},
        {"x":434,"y":541}, {"x":541,"y":541},
        {"x":541,"y":780}, {"x":0,"y":780}
    ]'::jsonb;
BEGIN
    SELECT "json"::jsonb INTO scheme
    FROM "config" WHERE "id" = 'buildingScheme' FOR UPDATE;

    IF scheme IS NULL OR jsonb_typeof(scheme->'entities') IS DISTINCT FROM 'array' THEN
        RAISE EXCEPTION 'Published building scheme is missing or invalid';
    END IF;

    IF (SELECT count(*) FROM jsonb_array_elements(scheme->'entities') AS e
        WHERE e->>'id' = '1') <> 1 THEN
        RAISE EXCEPTION 'Expected a single canteen with id 1';
    END IF;

    SELECT e INTO canteen FROM jsonb_array_elements(scheme->'entities') AS e
    WHERE e->>'id' = '1';

    IF canteen->>'floorId' IS DISTINCT FROM '0'
        OR canteen->>'type' IS DISTINCT FROM 'room'
        OR canteen->>'name' IS DISTINCT FROM 'Столовая' THEN
        RAISE EXCEPTION 'Unexpected first-floor canteen identity';
    END IF;

    IF canteen->'wallsPosition' = new_walls THEN
        RETURN;
    END IF;
    IF canteen->'wallsPosition' IS DISTINCT FROM old_walls THEN
        RAISE EXCEPTION 'Unexpected canteen outline; refusing to overwrite edited geometry';
    END IF;

    SELECT jsonb_set(scheme, '{entities}', jsonb_agg(
        CASE WHEN e->>'id' = '1'
            THEN jsonb_set(e, '{wallsPosition}', new_walls)
            ELSE e
        END ORDER BY ord
    )) INTO scheme
    FROM jsonb_array_elements(scheme->'entities') WITH ORDINALITY AS entities(e, ord);

    UPDATE "config" SET "json" = scheme WHERE "id" = 'buildingScheme';
END
$canteen_corner$;
