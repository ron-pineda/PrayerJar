ALTER TABLE "churches" ADD COLUMN "acquisition_source" text;--> statement-breakpoint
ALTER TABLE "churches" ADD COLUMN "utm_source" text;--> statement-breakpoint
ALTER TABLE "churches" ADD COLUMN "utm_medium" text;--> statement-breakpoint
ALTER TABLE "churches" ADD COLUMN "utm_campaign" text;--> statement-breakpoint
ALTER TABLE "churches" ADD COLUMN "first_paid_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "churches" ADD COLUMN "current_plan" "plan_tier" DEFAULT 'free' NOT NULL;--> statement-breakpoint
ALTER TABLE "churches" ADD COLUMN "previous_plan" "plan_tier";