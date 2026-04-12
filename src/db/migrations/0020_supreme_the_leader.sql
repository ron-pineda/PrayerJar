CREATE TYPE "public"."prayer_assignment_status" AS ENUM('assigned', 'accepted', 'praying', 'completed');--> statement-breakpoint
CREATE TYPE "public"."prayer_flag_reason" AS ENUM('self_harm', 'crisis', 'abuse', 'inappropriate', 'spam', 'other');--> statement-breakpoint
CREATE TYPE "public"."prayer_flag_status" AS ENUM('pending', 'reviewed', 'dismissed', 'escalated');--> statement-breakpoint
CREATE TYPE "public"."testimony_approval_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TABLE "pastoral_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"church_id" uuid NOT NULL,
	"prayer_id" uuid,
	"member_id" uuid,
	"author_id" uuid NOT NULL,
	"content" text NOT NULL,
	"is_private" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prayer_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"church_id" uuid NOT NULL,
	"prayer_id" uuid NOT NULL,
	"assigned_to" uuid NOT NULL,
	"assigned_by" uuid NOT NULL,
	"status" "prayer_assignment_status" DEFAULT 'assigned' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prayer_flags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"prayer_id" uuid NOT NULL,
	"church_id" uuid,
	"reason" "prayer_flag_reason" NOT NULL,
	"ai_confidence" double precision,
	"notes" text,
	"status" "prayer_flag_status" DEFAULT 'pending' NOT NULL,
	"reviewed_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reviewed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "testimony_approvals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"church_id" uuid NOT NULL,
	"prayer_id" uuid NOT NULL,
	"submitted_by" uuid NOT NULL,
	"reviewed_by" uuid,
	"status" "testimony_approval_status" DEFAULT 'pending' NOT NULL,
	"testimony" text NOT NULL,
	"review_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reviewed_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "churches" ADD COLUMN "subdomain" text;--> statement-breakpoint
ALTER TABLE "pastoral_notes" ADD CONSTRAINT "pastoral_notes_church_id_churches_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."churches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pastoral_notes" ADD CONSTRAINT "pastoral_notes_prayer_id_prayers_id_fk" FOREIGN KEY ("prayer_id") REFERENCES "public"."prayers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pastoral_notes" ADD CONSTRAINT "pastoral_notes_member_id_users_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pastoral_notes" ADD CONSTRAINT "pastoral_notes_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prayer_assignments" ADD CONSTRAINT "prayer_assignments_church_id_churches_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."churches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prayer_assignments" ADD CONSTRAINT "prayer_assignments_prayer_id_prayers_id_fk" FOREIGN KEY ("prayer_id") REFERENCES "public"."prayers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prayer_assignments" ADD CONSTRAINT "prayer_assignments_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prayer_assignments" ADD CONSTRAINT "prayer_assignments_assigned_by_users_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prayer_flags" ADD CONSTRAINT "prayer_flags_prayer_id_prayers_id_fk" FOREIGN KEY ("prayer_id") REFERENCES "public"."prayers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prayer_flags" ADD CONSTRAINT "prayer_flags_church_id_churches_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."churches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prayer_flags" ADD CONSTRAINT "prayer_flags_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "testimony_approvals" ADD CONSTRAINT "testimony_approvals_church_id_churches_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."churches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "testimony_approvals" ADD CONSTRAINT "testimony_approvals_prayer_id_prayers_id_fk" FOREIGN KEY ("prayer_id") REFERENCES "public"."prayers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "testimony_approvals" ADD CONSTRAINT "testimony_approvals_submitted_by_users_id_fk" FOREIGN KEY ("submitted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "testimony_approvals" ADD CONSTRAINT "testimony_approvals_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "prayer_assignment_unique" ON "prayer_assignments" USING btree ("prayer_id","assigned_to");--> statement-breakpoint
CREATE UNIQUE INDEX "testimony_approval_unique" ON "testimony_approvals" USING btree ("church_id","prayer_id","submitted_by");--> statement-breakpoint
ALTER TABLE "churches" ADD CONSTRAINT "churches_subdomain_unique" UNIQUE("subdomain");