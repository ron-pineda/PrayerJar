CREATE TYPE "public"."event_prayer_status" AS ENUM('pending', 'approved', 'spotlighted', 'hidden');--> statement-breakpoint
CREATE TYPE "public"."event_status" AS ENUM('draft', 'active', 'paused', 'ended');--> statement-breakpoint
CREATE TABLE "event_prayers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"church_id" uuid NOT NULL,
	"content" text NOT NULL,
	"submitter_name" text,
	"is_anonymous" boolean DEFAULT false NOT NULL,
	"category" "category" DEFAULT 'other' NOT NULL,
	"status" "event_prayer_status" DEFAULT 'pending' NOT NULL,
	"moderated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"church_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"event_license_id" uuid,
	"status" "event_status" DEFAULT 'draft' NOT NULL,
	"display_mode" text DEFAULT 'stream' NOT NULL,
	"starts_at" timestamp with time zone,
	"ends_at" timestamp with time zone,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "event_prayers" ADD CONSTRAINT "event_prayers_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_prayers" ADD CONSTRAINT "event_prayers_church_id_churches_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."churches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_prayers" ADD CONSTRAINT "event_prayers_moderated_by_users_id_fk" FOREIGN KEY ("moderated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_church_id_churches_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."churches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_event_license_id_event_licenses_id_fk" FOREIGN KEY ("event_license_id") REFERENCES "public"."event_licenses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;