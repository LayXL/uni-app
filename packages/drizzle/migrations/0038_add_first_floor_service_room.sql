-- Mark the north-west first-floor area above the canteen as a service room.
-- Follow the existing floor, canteen, 122 and room 7 boundaries.
DO $service_room$
DECLARE
    scheme jsonb;
    existing jsonb;
    new_room constant jsonb := $room${
        "type": "room",
        "id": 172,
        "floorId": 0,
        "name": "Служебное помещение",
        "position": {"x": 0, "y": 0},
        "labelPosition": {"x": 1000, "y": 450},
        "wallsPosition": [
            {"x":600,"y":0}, {"x":1377,"y":0},
            {"x":1377,"y":738}, {"x":644,"y":738},
            {"x":644,"y":1173}, {"x":523,"y":1173},
            {"x":523,"y":1500}, {"x":434,"y":1500},
            {"x":434,"y":1061}, {"x":0,"y":1061},
            {"x":0,"y":476}, {"x":705,"y":476},
            {"x":705,"y":274}, {"x":600,"y":274}
        ],
        "doorsPosition": []
    }$room$::jsonb;
BEGIN
    SELECT "json"::jsonb INTO scheme
    FROM "config" WHERE "id" = 'buildingScheme' FOR UPDATE;

    IF scheme IS NULL
        OR jsonb_typeof(scheme->'entities') IS DISTINCT FROM 'array'
        OR jsonb_typeof(scheme->'floors') IS DISTINCT FROM 'array' THEN
        RAISE EXCEPTION 'Published building scheme is missing or invalid';
    END IF;

    IF (SELECT count(*) FROM jsonb_array_elements(scheme->'entities') AS e
        WHERE e->>'id' = '172') > 1 THEN
        RAISE EXCEPTION 'Duplicate service room id 172';
    END IF;
    SELECT e INTO existing FROM jsonb_array_elements(scheme->'entities') AS e
    WHERE e->>'id' = '172';
    IF existing = new_room THEN
        RETURN;
    END IF;
    IF existing IS NOT NULL THEN
        RAISE EXCEPTION 'Entity id 172 is already occupied; refusing to overwrite it';
    END IF;

    IF (SELECT count(*) FROM jsonb_array_elements(scheme->'floors') AS f
        WHERE f->>'id' = '0' AND f->>'name' = '1 этаж') <> 1 THEN
        RAISE EXCEPTION 'Expected the university first floor';
    END IF;

    -- These shared edges must still match the area traced in the map.
    IF NOT (scheme->'entities' @> '[
        {"id":1,"floorId":0,"type":"room","name":"Столовая",
         "position":{"x":0,"y":1061},
         "wallsPosition":[{"x":0,"y":0},{"x":434,"y":0},{"x":434,"y":541}]},
        {"id":6,"floorId":0,"type":"room","name":"122",
         "position":{"x":834,"y":738},
         "wallsPosition":[{"x":-190,"y":0},{"x":-190,"y":435},{"x":363,"y":0}]},
        {"id":7,"floorId":0,"type":"room",
         "position":{"x":523,"y":1173},
         "wallsPosition":[{"x":0,"y":0},{"x":0,"y":327}]}
    ]'::jsonb) THEN
        RAISE EXCEPTION 'Unexpected neighbouring room geometry for the service area';
    END IF;

    UPDATE "config"
    SET "json" = jsonb_set(scheme, '{entities}', (scheme->'entities') || jsonb_build_array(new_room))
    WHERE "id" = 'buildingScheme';
END
$service_room$;
