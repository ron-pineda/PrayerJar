CREATE TYPE "public"."admin_action_type" AS ENUM('hide_prayer', 'unhide_prayer', 'delete_prayer', 'resolve_report', 'dismiss_report', 'mark_feedback_read', 'acknowledge_moderation_log', 'purge_user');--> statement-breakpoint
CREATE TYPE "public"."contact_subject" AS ENUM('General', 'Church Partnership', 'Feedback', 'Bug Report', 'Other');--> statement-breakpoint
CREATE TYPE "public"."moderation_category" AS ENUM('selfHarm', 'spam', 'harassment', 'hate', 'sexual', 'other');--> statement-breakpoint
CREATE TYPE "public"."moderation_content_type" AS ENUM('prayer', 'testimony', 'partner_message', 'group_post', 'group_meta', 'interaction_message', 'church_note');--> statement-breakpoint
CREATE TABLE "admin_actions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"admin_email" text NOT NULL,
	"action" "admin_action_type" NOT NULL,
	"target_type" text NOT NULL,
	"target_id" uuid NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contact_submissions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"subject" "contact_subject" NOT NULL,
	"message" text NOT NULL,
	"read_at" timestamp with time zone,
	"read_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "moderation_logs" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid,
	"content_type" "moderation_content_type" NOT NULL,
	"content_snippet" text,
	"category" "moderation_category" NOT NULL,
	"ai_confidence" numeric,
	"source_route" text NOT NULL,
	"resolved_at" timestamp with time zone,
	"resolved_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "moderation_logs" ADD CONSTRAINT "moderation_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "admin_actions_created_idx" ON "admin_actions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "contact_submissions_read_at_null_idx" ON "contact_submissions" USING btree ("read_at") WHERE "contact_submissions"."read_at" IS NULL;--> statement-breakpoint
CREATE INDEX "contact_submissions_created_idx" ON "contact_submissions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "moderation_logs_category_created_idx" ON "moderation_logs" USING btree ("category","created_at");--> statement-breakpoint
CREATE INDEX "moderation_logs_resolved_at_null_idx" ON "moderation_logs" USING btree ("resolved_at") WHERE "moderation_logs"."resolved_at" IS NULL;