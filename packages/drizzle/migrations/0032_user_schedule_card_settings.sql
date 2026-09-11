CREATE TABLE IF NOT EXISTS "user_schedule_card_settings" (
	"userId" integer PRIMARY KEY NOT NULL,
	"showFullTeacherName" boolean DEFAULT false NOT NULL,
	"showParallelGroups" boolean DEFAULT true NOT NULL,
	"mergeCards" boolean DEFAULT true NOT NULL,
	CONSTRAINT "user_schedule_card_settings_userId_users_id_fk"
		FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action
);
