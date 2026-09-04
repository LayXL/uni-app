-- Merge the first-floor inner east wing into 110, 108 and an unnamed room.
-- Approximate the supplied plan, retaining the upper recess and two corridor
-- entrances per room. Preserve IDs 16/15/14 and all unrelated map data.
DO $first_floor$
DECLARE
    scheme jsonb;
    patch jsonb;
    existing jsonb;
    room_changes constant jsonb := $changes$[
  {
    "id": 16,
    "name": "110",
    "changes": {
      "position": {
        "x": 2025,
        "y": 616
      },
      "wallsPosition": [
        {
          "x": 30,
          "y": 0
        },
        {
          "x": 239,
          "y": 0
        },
        {
          "x": 239,
          "y": 320
        },
        {
          "x": 0,
          "y": 320
        },
        {
          "x": 0,
          "y": 125
        },
        {
          "x": 30,
          "y": 125
        }
      ],
      "doorsPosition": [
        {
          "x": 239,
          "y": 160
        },
        {
          "x": 239,
          "y": 270
        }
      ]
    }
  },
  {
    "id": 15,
    "name": "108",
    "changes": {
      "position": {
        "x": 2025,
        "y": 936
      },
      "wallsPosition": [
        {
          "x": 0,
          "y": 0
        },
        {
          "x": 239,
          "y": 0
        },
        {
          "x": 239,
          "y": 330
        },
        {
          "x": 0,
          "y": 330
        }
      ],
      "doorsPosition": [
        {
          "x": 239,
          "y": 50
        },
        {
          "x": 239,
          "y": 280
        }
      ]
    }
  },
  {
    "id": 14,
    "name": "106",
    "changes": {
      "name": "Нет имени",
      "nameHidden": true,
      "position": {
        "x": 2025,
        "y": 1266
      },
      "wallsPosition": [
        {
          "x": 0,
          "y": 0
        },
        {
          "x": 239,
          "y": 0
        },
        {
          "x": 239,
          "y": 310
        },
        {
          "x": 0,
          "y": 310
        }
      ],
      "doorsPosition": [
        {
          "x": 239,
          "y": 50
        },
        {
          "x": 239,
          "y": 260
        }
      ]
    }
  }
]$changes$;
BEGIN
    SELECT "json"::jsonb INTO scheme
    FROM "config" WHERE "id" = 'buildingScheme' FOR UPDATE;

    IF scheme IS NULL OR jsonb_typeof(scheme->'entities') IS DISTINCT FROM 'array' THEN
        RAISE EXCEPTION 'Published building scheme is missing or invalid';
    END IF;

    FOR patch IN SELECT value FROM jsonb_array_elements(room_changes) LOOP
        SELECT value INTO existing FROM jsonb_array_elements(scheme->'entities')
        WHERE value->>'id' = patch->>'id';
        IF existing IS NULL
            OR existing->>'floorId' IS DISTINCT FROM '0'
            OR existing->>'type' IS DISTINCT FROM 'room'
            OR (existing->>'name' IS DISTINCT FROM patch->>'name'
                AND existing->>'name' IS DISTINCT FROM patch->'changes'->>'name') THEN
            RAISE EXCEPTION 'Unexpected first-floor room identity: %', patch->>'id';
        END IF;

        SELECT jsonb_set(scheme, '{entities}', jsonb_agg(
            CASE WHEN e->>'id' = patch->>'id' THEN
                (CASE WHEN e->>'id' = '14' THEN e - 'description' ELSE e END)
                || (patch->'changes')
            ELSE e END ORDER BY ord
        )) INTO scheme
        FROM jsonb_array_elements(scheme->'entities') WITH ORDINALITY AS entities(e, ord);
    END LOOP;

    FOR patch IN SELECT value FROM jsonb_array_elements(
        '[{"id":17,"name":"112"},{"id":33,"name":"116"}]'::jsonb
    ) LOOP
        SELECT value INTO existing FROM jsonb_array_elements(scheme->'entities')
        WHERE value->>'id' = patch->>'id';
        IF existing IS NOT NULL THEN
            IF existing->>'floorId' IS DISTINCT FROM '0'
                OR existing->>'type' IS DISTINCT FROM 'room'
                OR existing->>'name' IS DISTINCT FROM patch->>'name' THEN
                RAISE EXCEPTION 'Unexpected first-floor room for removal: %', patch->>'id';
            END IF;
            SELECT jsonb_set(scheme, '{entities}', jsonb_agg(e ORDER BY ord)) INTO scheme
            FROM jsonb_array_elements(scheme->'entities') WITH ORDINALITY AS entities(e, ord)
            WHERE e->>'id' <> patch->>'id';
        END IF;
    END LOOP;

    UPDATE "config" SET "json" = scheme WHERE "id" = 'buildingScheme';
END
$first_floor$;
