CREATE TABLE "config" (
	"id" text PRIMARY KEY NOT NULL,
	"json" json NOT NULL,
	CONSTRAINT "config_id_unique" UNIQUE("id")
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "isAdmin" boolean DEFAULT false NOT NULL;