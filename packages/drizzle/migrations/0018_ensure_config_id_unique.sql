DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM "pg_constraint"
		WHERE "conrelid" = 'public.config'::regclass
			AND "contype" = 'p'
	) THEN
		ALTER TABLE "public"."config"
			ADD CONSTRAINT "config_pkey" PRIMARY KEY ("id");
	END IF;
END
$$;
