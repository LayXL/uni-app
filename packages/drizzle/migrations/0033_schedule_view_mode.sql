ALTER TABLE "user_schedule_card_settings" ADD COLUMN IF NOT EXISTS "viewMode" varchar(16) DEFAULT 'list' NOT NULL;
