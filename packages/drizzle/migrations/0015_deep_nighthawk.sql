CREATE TABLE "events" (
	"id" serial PRIMARY KEY NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"author" integer,
	"title" varchar(255) NOT NULL,
	"description" text,
	"coverImage" text,
	"groupsRegex" text,
	"date" timestamp NOT NULL,
	"buttonUrl" text,
	"buttonText" varchar(255)
);
--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_author_users_id_fk" FOREIGN KEY ("author") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;