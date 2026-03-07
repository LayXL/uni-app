CREATE TABLE "homeworks" (
	"id" text PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"subject" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"author" integer,
	"group" integer,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"files" json DEFAULT '[]'::json NOT NULL,
	"isSharedWithWholeGroup" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
ALTER TABLE "config" DROP CONSTRAINT "config_id_unique";--> statement-breakpoint
ALTER TABLE "homeworks" ADD CONSTRAINT "homeworks_subject_subjects_id_fk" FOREIGN KEY ("subject") REFERENCES "public"."subjects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "homeworks" ADD CONSTRAINT "homeworks_author_users_id_fk" FOREIGN KEY ("author") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "homeworks" ADD CONSTRAINT "homeworks_group_groups_id_fk" FOREIGN KEY ("group") REFERENCES "public"."groups"("id") ON DELETE no action ON UPDATE no action;