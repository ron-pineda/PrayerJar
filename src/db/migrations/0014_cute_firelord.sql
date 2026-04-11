CREATE TYPE "public"."feedback_type" AS ENUM('bug', 'feature', 'general', 'praise');--> statement-breakpoint
CREATE TABLE "feature_flags" (
	"id" uuid PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"description" text,
	"is_enabled" boolean DEFAULT false NOT NULL,
	"allowed_user_ids" text[] DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "feature_flags_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "feedback" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid,
	"type" "feedback_type" DEFAULT 'general' NOT NULL,
	"message" text NOT NULL,
	"page" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;