CREATE TYPE "public"."legal_document_type" AS ENUM('dpa', 'subprocessor_list', 'terms', 'privacy');--> statement-breakpoint
CREATE TYPE "public"."nonprofit_status" AS ENUM('unverified', 'pending', 'verified', 'rejected');--> statement-breakpoint
CREATE TABLE "church_legal_acceptances" (
	"id" uuid PRIMARY KEY NOT NULL,
	"church_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"document_type" "legal_document_type" NOT NULL,
	"document_version" text NOT NULL,
	"accepted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ip_address" text
);
--> statement-breakpoint
CREATE TABLE "nonprofit_verifications" (
	"id" uuid PRIMARY KEY NOT NULL,
	"church_id" uuid NOT NULL,
	"submitted_by_user_id" uuid,
	"ein" text,
	"legal_name" text,
	"determination_letter_url" text NOT NULL,
	"status" "nonprofit_status" DEFAULT 'pending' NOT NULL,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reviewed_at" timestamp with time zone,
	"reviewed_by" text,
	"review_notes" text
);
--> statement-breakpoint
ALTER TABLE "church_legal_acceptances" ADD CONSTRAINT "church_legal_acceptances_church_id_churches_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."churches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "church_legal_acceptances" ADD CONSTRAINT "church_legal_acceptances_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nonprofit_verifications" ADD CONSTRAINT "nonprofit_verifications_church_id_churches_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."churches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nonprofit_verifications" ADD CONSTRAINT "nonprofit_verifications_submitted_by_user_id_users_id_fk" FOREIGN KEY ("submitted_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "church_legal_acceptances_church_idx" ON "church_legal_acceptances" USING btree ("church_id");--> statement-breakpoint
CREATE INDEX "church_legal_acceptances_church_doc_idx" ON "church_legal_acceptances" USING btree ("church_id","document_type");--> statement-breakpoint
CREATE INDEX "nonprofit_verifications_church_idx" ON "nonprofit_verifications" USING btree ("church_id");--> statement-breakpoint
CREATE INDEX "nonprofit_verifications_status_idx" ON "nonprofit_verifications" USING btree ("status");