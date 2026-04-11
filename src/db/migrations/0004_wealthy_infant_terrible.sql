CREATE TYPE "public"."activity_level" AS ENUM('new', 'active', 'power');--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "onboardingCompleted" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "preferredCategories" text[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "activityLevel" "activity_level" DEFAULT 'new' NOT NULL;