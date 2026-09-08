-- Place the school to the right of the university, aligned at the second-floor
-- passage. Preserve local geometry, entity IDs, routes and editor backups.
DO $campus_layout$
DECLARE
    scheme jsonb;
    university jsonb;
    school jsonb;
    entrance jsonb;
    passage_exit jsonb;
    school_x numeric;
    school_y numeric;
BEGIN
    SELECT "json"::jsonb INTO scheme
    FROM "config" WHERE "id" = 'buildingScheme' FOR UPDATE;

    IF scheme IS NULL OR jsonb_typeof(scheme->'floors') IS DISTINCT FROM 'array' THEN
        RAISE EXCEPTION 'Published building scheme is missing or invalid';
    END IF;

    SELECT f INTO university FROM jsonb_array_elements(scheme->'floors') AS f
    WHERE f->>'id' = '1' AND f->>'name' = '2 этаж';
    SELECT f INTO school FROM jsonb_array_elements(scheme->'floors') AS f
    WHERE f->>'id' = '5' AND f->>'name' = '2 этаж школы';

    IF university IS NULL OR school IS NULL OR
        (SELECT count(*) FROM jsonb_array_elements(scheme->'floors') AS f
         WHERE f->>'id' IN ('4', '5', '6') AND f->>'name' LIKE '%школы%') <> 3 THEN
        RAISE EXCEPTION 'Expected university and school floors for campus layout';
    END IF;

    SELECT s INTO entrance FROM jsonb_array_elements(university->'stairs') AS s
    WHERE s->'floors' @> '[5]'::jsonb;
    SELECT s INTO passage_exit FROM jsonb_array_elements(school->'stairs') AS s
    WHERE s->>'id' = entrance->>'id' AND s->'floors' @> '[1]'::jsonb;

    SELECT (university->'position'->>'x')::numeric + max((p->>'x')::numeric)
    INTO school_x FROM jsonb_array_elements(university->'wallsPosition') AS p;
    SELECT school_x - min((p->>'x')::numeric)
    INTO school_x FROM jsonb_array_elements(school->'wallsPosition') AS p;
    school_y := (university->'position'->>'y')::numeric
        + (entrance->'position'->>'y')::numeric
        - (passage_exit->'position'->>'y')::numeric;

    IF school_x IS NULL OR school_y IS NULL THEN
        RAISE EXCEPTION 'Second-floor passage geometry is missing or invalid';
    END IF;

    SELECT jsonb_set(scheme, '{floors}', jsonb_agg(
        CASE WHEN f->>'id' IN ('4', '5', '6')
            THEN jsonb_set(f, '{position}', jsonb_build_object('x', school_x, 'y', school_y))
            ELSE f
        END ORDER BY ord
    )) INTO scheme
    FROM jsonb_array_elements(scheme->'floors') WITH ORDINALITY AS floors(f, ord);

    UPDATE "config" SET "json" = scheme WHERE "id" = 'buildingScheme';
END
$campus_layout$;
