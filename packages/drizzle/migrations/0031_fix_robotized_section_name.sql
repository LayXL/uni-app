-- Correct the room name used by map search and route destinations.
DO $fix_robotized_section_name$
DECLARE
    scheme jsonb;
BEGIN
    SELECT "json"::jsonb INTO scheme
    FROM "config" WHERE "id" = 'buildingScheme' FOR UPDATE;

    IF scheme IS NULL OR jsonb_typeof(scheme->'entities') IS DISTINCT FROM 'array' THEN
        RAISE EXCEPTION 'Published building scheme is missing or invalid';
    END IF;

    SELECT jsonb_set(scheme, '{entities}', COALESCE(jsonb_agg(
        CASE WHEN e->>'name' = 'Роботизрованный участок архитектурного производства'
            THEN jsonb_set(e, '{name}', to_jsonb('Роботизированный участок архитектурного производства'::text))
            ELSE e
        END ORDER BY ord
    ), '[]'::jsonb)) INTO scheme
    FROM jsonb_array_elements(scheme->'entities') WITH ORDINALITY AS entities(e, ord);

    UPDATE "config" SET "json" = scheme WHERE "id" = 'buildingScheme';
END
$fix_robotized_section_name$;
