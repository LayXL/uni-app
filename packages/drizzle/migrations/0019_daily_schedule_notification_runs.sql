CREATE TABLE "daily_schedule_notification_runs" (
	"date" date PRIMARY KEY NOT NULL,
	"startedAt" timestamp DEFAULT now() NOT NULL
);
