CREATE TYPE "public"."group_type" AS ENUM('teacher', 'studentsGroup');--> statement-breakpoint
CREATE TABLE "classes" (
	"date" date NOT NULL,
	"order" integer NOT NULL,
	"subject" integer NOT NULL,
	"classroom" varchar(255) NOT NULL,
	"isCancelled" boolean DEFAULT false NOT NULL,
	"isDistance" boolean DEFAULT false NOT NULL,
	"isChanged" boolean DEFAULT false NOT NULL,
	"original" json,
	"groups" integer[] DEFAULT '{}' NOT NULL,
	CONSTRAINT "classes_date_order_subject_classroom_pk" PRIMARY KEY("date","order","subject","classroom")
);
--> statement-breakpoint
CREATE TABLE "groups" (
	"id" serial PRIMARY KEY NOT NULL,
	"bitrixId" varchar(255) NOT NULL,
	"displayName" varchar(255) NOT NULL,
	"type" "group_type" DEFAULT 'studentsGroup' NOT NULL,
	"isDeleted" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subjects" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"telegramId" bigint,
	"vkId" integer,
	"group" integer
);
--> statement-breakpoint
ALTER TABLE "classes" ADD CONSTRAINT "classes_subject_subjects_id_fk" FOREIGN KEY ("subject") REFERENCES "public"."subjects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_group_groups_id_fk" FOREIGN KEY ("group") REFERENCES "public"."groups"("id") ON DELETE no action ON UPDATE no action;