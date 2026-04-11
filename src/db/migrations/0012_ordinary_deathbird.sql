ALTER TABLE "prayer_interactions" ADD COLUMN "latitude" double precision;--> statement-breakpoint
ALTER TABLE "prayer_interactions" ADD COLUMN "longitude" double precision;--> statement-breakpoint
ALTER TABLE "prayer_interactions" ADD COLUMN "country" text;--> statement-breakpoint
ALTER TABLE "prayers" ADD COLUMN "latitude" double precision;--> statement-breakpoint
ALTER TABLE "prayers" ADD COLUMN "longitude" double precision;--> statement-breakpoint
ALTER TABLE "prayers" ADD COLUMN "country" text;