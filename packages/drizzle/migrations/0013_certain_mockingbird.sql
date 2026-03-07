WITH "duplicate_telegram_users" AS (
	SELECT
		"id",
		ROW_NUMBER() OVER (PARTITION BY "telegramId" ORDER BY "id") AS "rank"
	FROM "users"
	WHERE "telegramId" IS NOT NULL
)
UPDATE "users" AS "u"
SET "telegramId" = NULL
FROM "duplicate_telegram_users" AS "d"
WHERE "u"."id" = "d"."id" AND "d"."rank" > 1;--> statement-breakpoint
WITH "duplicate_vk_users" AS (
	SELECT
		"id",
		ROW_NUMBER() OVER (PARTITION BY "vkId" ORDER BY "id") AS "rank"
	FROM "users"
	WHERE "vkId" IS NOT NULL
)
UPDATE "users" AS "u"
SET "vkId" = NULL
FROM "duplicate_vk_users" AS "d"
WHERE "u"."id" = "d"."id" AND "d"."rank" > 1;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_telegramId_unique" UNIQUE("telegramId");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_vkId_unique" UNIQUE("vkId");