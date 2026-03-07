ALTER TABLE "events" ADD COLUMN "title" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "coverImage" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "groupsRegex" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "date" timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "buttonUrl" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "buttonText" varchar(255);