CREATE TABLE "user_feedback" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"rating" integer NOT NULL,
	"reasons" text[] DEFAULT '{}' NOT NULL,
	"group" integer,
	"platform" varchar(32) NOT NULL,
	"visitNumber" integer NOT NULL,
	"sessionId" varchar(64) NOT NULL,
	"source" varchar(64) DEFAULT 'schedule' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_feedback_userId_unique" UNIQUE("userId"),
	CONSTRAINT "user_feedback_rating_between_1_and_5" CHECK ("user_feedback"."rating" between 1 and 5)
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "appOpenCount" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "lastAppOpenSessionId" varchar(64);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "lastAppOpenedAt" timestamp;--> statement-breakpoint
ALTER TABLE "user_feedback" ADD CONSTRAINT "user_feedback_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_feedback" ADD CONSTRAINT "user_feedback_group_groups_id_fk" FOREIGN KEY ("group") REFERENCES "public"."groups"("id") ON DELETE set null ON UPDATE no action;