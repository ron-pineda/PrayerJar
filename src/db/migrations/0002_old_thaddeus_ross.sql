ALTER TABLE "users" ADD COLUMN "notifyOnPrayed" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "notifyOnMessage" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "notifyOnBadge" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "notifyOnDigest" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "quietHoursStart" integer;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "quietHoursEnd" integer;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "quietHoursTimezone" text;