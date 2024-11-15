ALTER TABLE "groups" RENAME COLUMN "name" TO "bitrixId";--> statement-breakpoint
ALTER TABLE "groups" ADD COLUMN "displayName" text NOT NULL;