CREATE TYPE "public"."partnership_status" AS ENUM('active', 'ended', 'expired');--> statement-breakpoint
CREATE TABLE "partner_messages" (
	"id" uuid PRIMARY KEY NOT NULL,
	"partnership_id" uuid NOT NULL,
	"sender_id" uuid NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prayer_partnerships" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"status" "partnership_status" DEFAULT 'active' NOT NULL,
	"matched_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"ended_at" timestamp with time zone,
	"ended_by" uuid
);
--> statement-breakpoint
ALTER TABLE "partner_messages" ADD CONSTRAINT "partner_messages_partnership_id_prayer_partnerships_id_fk" FOREIGN KEY ("partnership_id") REFERENCES "public"."prayer_partnerships"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_messages" ADD CONSTRAINT "partner_messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prayer_partnerships" ADD CONSTRAINT "prayer_partnerships_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prayer_partnerships" ADD CONSTRAINT "prayer_partnerships_partner_id_users_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prayer_partnerships" ADD CONSTRAINT "prayer_partnerships_ended_by_users_id_fk" FOREIGN KEY ("ended_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "partner_messages_partnership_created_idx" ON "partner_messages" USING btree ("partnership_id","created_at");--> statement-breakpoint
CREATE INDEX "prayer_partnerships_user_status_idx" ON "prayer_partnerships" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "prayer_partnerships_partner_status_idx" ON "prayer_partnerships" USING btree ("partner_id","status");