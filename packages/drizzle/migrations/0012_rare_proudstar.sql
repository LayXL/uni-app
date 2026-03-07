CREATE TABLE "homework_completions" (
	"userId" integer NOT NULL,
	"homeworkId" text NOT NULL,
	"completedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "homework_completions_userId_homeworkId_pk" PRIMARY KEY("userId","homeworkId")
);
--> statement-breakpoint
ALTER TABLE "homework_completions" ADD CONSTRAINT "homework_completions_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "homework_completions" ADD CONSTRAINT "homework_completions_homeworkId_homeworks_id_fk" FOREIGN KEY ("homeworkId") REFERENCES "public"."homeworks"("id") ON DELETE no action ON UPDATE no action;