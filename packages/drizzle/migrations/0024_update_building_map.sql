-- All reviewed map updates from September 4, 2026.
-- Patch the published scheme only; keep unrelated objects and editor backups.
-- Safe to run again after the equivalent changes were applied locally.
DO $map_update$
DECLARE
    scheme jsonb;
    patch jsonb;
    existing jsonb;
    new_road constant jsonb := '{"start":{"x":1613,"y":1950},"end":{"x":2460,"y":1950}}';
    cutout constant jsonb := '[[{"x":1184,"y":737},{"x":1960,"y":737},{"x":1960,"y":1609},{"x":1184,"y":1609}]]';
    fourth_floor constant jsonb := $floor${
  "wallsPosition": [
    {
      "x": 213,
      "y": 0
    },
    {
      "x": 470,
      "y": 0
    },
    {
      "x": 470,
      "y": 157
    },
    {
      "x": 1028,
      "y": 157
    },
    {
      "x": 1028,
      "y": 745
    },
    {
      "x": 470,
      "y": 745
    },
    {
      "x": 470,
      "y": 765
    },
    {
      "x": 330,
      "y": 765
    },
    {
      "x": 330,
      "y": 745
    },
    {
      "x": 213,
      "y": 745
    },
    {
      "x": 213,
      "y": 643
    },
    {
      "x": 0,
      "y": 643
    },
    {
      "x": 0,
      "y": 435
    },
    {
      "x": 213,
      "y": 435
    },
    {
      "x": 213,
      "y": 291
    },
    {
      "x": 0,
      "y": 291
    },
    {
      "x": 0,
      "y": 157
    },
    {
      "x": 213,
      "y": 157
    }
  ],
  "roads": [
    {
      "start": {
        "x": 400,
        "y": 755
      },
      "end": {
        "x": 400,
        "y": 694
      }
    },
    {
      "start": {
        "x": 342,
        "y": 694
      },
      "end": {
        "x": 592,
        "y": 694
      }
    },
    {
      "start": {
        "x": 342,
        "y": 694
      },
      "end": {
        "x": 342,
        "y": 341
      }
    },
    {
      "start": {
        "x": 342,
        "y": 341
      },
      "end": {
        "x": 289,
        "y": 341
      }
    },
    {
      "start": {
        "x": 289,
        "y": 341
      },
      "end": {
        "x": 289,
        "y": 301
      }
    },
    {
      "start": {
        "x": 289,
        "y": 301
      },
      "end": {
        "x": 342,
        "y": 301
      }
    },
    {
      "start": {
        "x": 342,
        "y": 301
      },
      "end": {
        "x": 342,
        "y": 191
      }
    },
    {
      "start": {
        "x": 342,
        "y": 191
      },
      "end": {
        "x": 355,
        "y": 191
      }
    },
    {
      "start": {
        "x": 342,
        "y": 230
      },
      "end": {
        "x": 252,
        "y": 230
      }
    },
    {
      "start": {
        "x": 342,
        "y": 286
      },
      "end": {
        "x": 517,
        "y": 286
      }
    },
    {
      "start": {
        "x": 517,
        "y": 286
      },
      "end": {
        "x": 517,
        "y": 203
      }
    },
    {
      "start": {
        "x": 342,
        "y": 406
      },
      "end": {
        "x": 432,
        "y": 406
      }
    },
    {
      "start": {
        "x": 342,
        "y": 508
      },
      "end": {
        "x": 252,
        "y": 508
      }
    },
    {
      "start": {
        "x": 342,
        "y": 560
      },
      "end": {
        "x": 432,
        "y": 560
      }
    }
  ],
  "stairs": [
    {
      "id": 0,
      "floors": [
        0,
        1,
        3,
        7
      ],
      "position": {
        "x": 400,
        "y": 755
      }
    }
  ]
}$floor$;
    room_changes constant jsonb := $changes$[
  {
    "id": 104,
    "floorId": 2,
    "name": "Какой-то кабинет 1",
    "changes": {
      "name": "Нет имени"
    }
  },
  {
    "id": 108,
    "floorId": 2,
    "name": "Какой-то кабинет 3",
    "changes": {
      "name": "Нет имени"
    }
  },
  {
    "id": 133,
    "floorId": 2,
    "name": "Пустота??",
    "changes": {
      "name": "Нет имени"
    }
  },
  {
    "id": 139,
    "floorId": 2,
    "name": "319",
    "changes": {
      "position": {
        "x": 2409,
        "y": 926
      },
      "doorsPosition": [
        {
          "x": 0,
          "y": 412
        },
        {
          "x": 0,
          "y": 180
        }
      ],
      "wallsPosition": [
        {
          "x": 0,
          "y": 0
        },
        {
          "x": 370,
          "y": 0
        },
        {
          "x": 370,
          "y": 464
        },
        {
          "x": 0,
          "y": 464
        }
      ],
      "aliases": [
        "319а"
      ]
    }
  },
  {
    "id": 142,
    "floorId": 2,
    "name": "315",
    "changes": {
      "position": {
        "x": 2409,
        "y": 1621
      },
      "doorsPosition": [
        {
          "x": 0,
          "y": 411
        },
        {
          "x": 0,
          "y": 50
        }
      ],
      "wallsPosition": [
        {
          "x": 0,
          "y": 0
        },
        {
          "x": 370,
          "y": 0
        },
        {
          "x": 370,
          "y": 463
        },
        {
          "x": 0,
          "y": 463
        }
      ],
      "aliases": [
        "315а"
      ]
    }
  },
  {
    "id": 152,
    "floorId": 4,
    "name": "Неподписанный кабинет",
    "changes": {
      "name": "Нет имени"
    }
  },
  {
    "id": 168,
    "floorId": 0,
    "name": "Кулер",
    "changes": {
      "hiddenOnMap": true
    }
  },
  {
    "id": 170,
    "floorId": 0,
    "name": "Терминал на первом этаже",
    "changes": {
      "hiddenOnMap": true
    }
  },
  {
    "id": 171,
    "floorId": 1,
    "name": "Терминал на втором этаже",
    "changes": {
      "hiddenOnMap": true
    }
  },
  {
    "id": 164,
    "floorId": 7,
    "name": "401",
    "changes": {
      "position": {
        "x": 0,
        "y": 435
      },
      "doorsPosition": [
        {
          "x": 213,
          "y": 73
        }
      ],
      "wallsPosition": [
        {
          "x": 0,
          "y": 0
        },
        {
          "x": 213,
          "y": 0
        },
        {
          "x": 213,
          "y": 129
        },
        {
          "x": 0,
          "y": 129
        }
      ]
    }
  },
  {
    "id": 163,
    "floorId": 7,
    "name": "402",
    "changes": {
      "position": {
        "x": 0,
        "y": 157
      },
      "doorsPosition": [
        {
          "x": 213,
          "y": 73
        }
      ],
      "wallsPosition": [
        {
          "x": 0,
          "y": 0
        },
        {
          "x": 213,
          "y": 0
        },
        {
          "x": 213,
          "y": 134
        },
        {
          "x": 0,
          "y": 134
        }
      ]
    }
  },
  {
    "id": 162,
    "floorId": 7,
    "name": "403",
    "changes": {
      "position": {
        "x": 213,
        "y": 0
      },
      "doorsPosition": [
        {
          "x": 142,
          "y": 157
        }
      ],
      "wallsPosition": [
        {
          "x": 0,
          "y": 0
        },
        {
          "x": 257,
          "y": 0
        },
        {
          "x": 257,
          "y": 157
        },
        {
          "x": 0,
          "y": 157
        }
      ]
    }
  }
]$changes$;
    new_rooms constant jsonb := $rooms$[
  {
    "id": 173,
    "name": "404",
    "type": "room",
    "floorId": 7,
    "position": {
      "x": 569,
      "y": 157
    },
    "wallsPosition": [
      {
        "x": 0,
        "y": 0
      },
      {
        "x": 459,
        "y": 0
      },
      {
        "x": 459,
        "y": 82
      },
      {
        "x": 0,
        "y": 82
      }
    ],
    "doorsPosition": [
      {
        "x": 0,
        "y": 46
      }
    ]
  },
  {
    "id": 174,
    "name": "405",
    "type": "room",
    "floorId": 7,
    "position": {
      "x": 569,
      "y": 239
    },
    "wallsPosition": [
      {
        "x": 0,
        "y": 0
      },
      {
        "x": 459,
        "y": 0
      },
      {
        "x": 459,
        "y": 82
      },
      {
        "x": 0,
        "y": 82
      }
    ],
    "doorsPosition": [
      {
        "x": 0,
        "y": 47
      }
    ]
  },
  {
    "id": 175,
    "name": "406",
    "type": "room",
    "floorId": 7,
    "position": {
      "x": 470,
      "y": 321
    },
    "wallsPosition": [
      {
        "x": 0,
        "y": 0
      },
      {
        "x": 558,
        "y": 0
      },
      {
        "x": 558,
        "y": 161
      },
      {
        "x": 0,
        "y": 161
      }
    ],
    "doorsPosition": [
      {
        "x": 0,
        "y": 85
      }
    ]
  },
  {
    "id": 176,
    "name": "407",
    "type": "room",
    "floorId": 7,
    "position": {
      "x": 470,
      "y": 482
    },
    "wallsPosition": [
      {
        "x": 0,
        "y": 0
      },
      {
        "x": 558,
        "y": 0
      },
      {
        "x": 558,
        "y": 161
      },
      {
        "x": 0,
        "y": 161
      }
    ],
    "doorsPosition": [
      {
        "x": 0,
        "y": 78
      }
    ]
  },
  {
    "id": 177,
    "name": "408",
    "type": "room",
    "floorId": 7,
    "position": {
      "x": 620,
      "y": 643
    },
    "wallsPosition": [
      {
        "x": 0,
        "y": 0
      },
      {
        "x": 408,
        "y": 0
      },
      {
        "x": 408,
        "y": 102
      },
      {
        "x": 0,
        "y": 102
      }
    ],
    "doorsPosition": [
      {
        "x": 0,
        "y": 51
      }
    ]
  }
]$rooms$;
    removed_rooms constant jsonb := $removed$[
  {
    "id": 138,
    "floorId": 2,
    "name": "319а"
  },
  {
    "id": 141,
    "floorId": 2,
    "name": "315а"
  },
  {
    "id": 165,
    "floorId": 7,
    "name": "Не подписано"
  }
]$removed$;
BEGIN
    SELECT "json"::jsonb INTO scheme
    FROM "config" WHERE "id" = 'buildingScheme' FOR UPDATE;

    IF scheme IS NULL
        OR jsonb_typeof(scheme->'floors') IS DISTINCT FROM 'array'
        OR jsonb_typeof(scheme->'entities') IS DISTINCT FROM 'array' THEN
        RAISE EXCEPTION 'Published building scheme is missing or invalid';
    END IF;

    IF (SELECT count(*) FROM jsonb_array_elements(scheme->'floors') AS f
        WHERE f->>'id' IN ('0', '1', '2', '7')) <> 4 THEN
        RAISE EXCEPTION 'Expected university floors 1 through 4';
    END IF;

    -- Cutouts follow the inner classroom walls and stop at the stair approach.
    -- Append exactly one first-floor road; intersections connect x=1613/2221/2335.
    -- Replace only the renovated fourth floor geometry and its corridor network.
    SELECT jsonb_set(scheme, '{floors}', jsonb_agg(
        CASE f->>'id'
            WHEN '0' THEN jsonb_set(f, '{roads}',
                CASE WHEN EXISTS (
                    SELECT 1 FROM jsonb_array_elements(COALESCE(f->'roads', '[]'::jsonb)) AS road
                    WHERE (road->'start' = new_road->'start' AND road->'end' = new_road->'end')
                       OR (road->'start' = new_road->'end' AND road->'end' = new_road->'start')
                ) THEN COALESCE(f->'roads', '[]'::jsonb)
                ELSE COALESCE(f->'roads', '[]'::jsonb) || jsonb_build_array(new_road) END)
            WHEN '1' THEN CASE WHEN f ? 'holes' THEN f ELSE f || jsonb_build_object('holes', cutout) END
            WHEN '2' THEN CASE WHEN f ? 'holes' THEN f ELSE f || jsonb_build_object('holes', cutout) END
            WHEN '7' THEN f || fourth_floor
            ELSE f
        END ORDER BY ord
    )) INTO scheme
    FROM jsonb_array_elements(scheme->'floors') WITH ORDINALITY AS floors(f, ord);

    -- Retain IDs for 401-403, 315 and 319. Both entrances to merged rooms remain.
    -- Placeholder names and marker visibility are changed without deleting POIs.
    FOR patch IN SELECT value FROM jsonb_array_elements(room_changes) LOOP
        SELECT value INTO existing FROM jsonb_array_elements(scheme->'entities')
        WHERE value->>'id' = patch->>'id';
        IF existing IS NULL
            OR existing->>'floorId' IS DISTINCT FROM patch->>'floorId'
            OR (existing->>'name' IS DISTINCT FROM patch->>'name'
                AND existing->>'name' IS DISTINCT FROM patch->'changes'->>'name') THEN
            RAISE EXCEPTION 'Unexpected map object identity for id %', patch->>'id';
        END IF;

        -- Keep any additional search aliases already present on the target map.
        IF patch->'changes' ? 'aliases' THEN
            patch := jsonb_set(patch, '{changes,aliases}', (
                SELECT jsonb_agg(alias ORDER BY first_seen)
                FROM (
                    SELECT alias, min(ord) AS first_seen
                    FROM jsonb_array_elements(COALESCE(existing->'aliases', '[]'::jsonb)
                        || (patch->'changes'->'aliases')) WITH ORDINALITY AS aliases(alias, ord)
                    GROUP BY alias
                ) AS unique_aliases
            ));
        END IF;

        SELECT jsonb_set(scheme, '{entities}', jsonb_agg(
            CASE WHEN e->>'id' = patch->>'id' THEN e || (patch->'changes') ELSE e END
            ORDER BY ord
        )) INTO scheme
        FROM jsonb_array_elements(scheme->'entities') WITH ORDINALITY AS entities(e, ord);
    END LOOP;

    -- Remove only the merged annexes and the obsolete unnamed fourth-floor room.
    FOR patch IN SELECT value FROM jsonb_array_elements(removed_rooms) LOOP
        SELECT value INTO existing FROM jsonb_array_elements(scheme->'entities')
        WHERE value->>'id' = patch->>'id';
        IF existing IS NOT NULL THEN
            IF existing->>'floorId' IS DISTINCT FROM patch->>'floorId'
                OR existing->>'name' IS DISTINCT FROM patch->>'name'
                OR existing->>'type' IS DISTINCT FROM 'room' THEN
                RAISE EXCEPTION 'Unexpected room identity for removal: %', patch->>'id';
            END IF;
            SELECT jsonb_set(scheme, '{entities}', jsonb_agg(e ORDER BY ord)) INTO scheme
            FROM jsonb_array_elements(scheme->'entities') WITH ORDINALITY AS entities(e, ord)
            WHERE e->>'id' <> patch->>'id';
        END IF;
    END LOOP;

    -- Add 404-408 once. Fail instead of overwriting an unrelated object with its ID.
    FOR patch IN SELECT value FROM jsonb_array_elements(new_rooms) LOOP
        SELECT value INTO existing FROM jsonb_array_elements(scheme->'entities')
        WHERE value->>'id' = patch->>'id';
        IF existing IS NULL THEN
            IF EXISTS (SELECT 1 FROM jsonb_array_elements(scheme->'entities') AS e
                WHERE e->>'floorId' = patch->>'floorId' AND e->>'name' = patch->>'name') THEN
                RAISE EXCEPTION 'Room % already exists with another id', patch->>'name';
            END IF;
            scheme := jsonb_set(scheme, '{entities}', scheme->'entities' || jsonb_build_array(patch));
        ELSIF existing->>'floorId' IS DISTINCT FROM patch->>'floorId'
            OR existing->>'name' IS DISTINCT FROM patch->>'name'
            OR existing->>'type' IS DISTINCT FROM 'room' THEN
            RAISE EXCEPTION 'Map object id % is already in use', patch->>'id';
        END IF;
    END LOOP;

    UPDATE "config" SET "json" = scheme WHERE "id" = 'buildingScheme';
END
$map_update$;
