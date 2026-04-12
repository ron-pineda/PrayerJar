CREATE TYPE "public"."church_member_role" AS ENUM('admin', 'pastor', 'member');--> statement-breakpoint
CREATE TABLE "church_members" (
	"id" uuid PRIMARY KEY NOT NULL,
	"church_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "church_member_role" DEFAULT 'member' NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "churches" (
	"id" uuid PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"logo_url" text,
	"welcome_message" text,
	"primary_color" text DEFAULT '#d4a843' NOT NULL,
	"created_by" uuid NOT NULL,
	"subscription_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "churches_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "groups" ADD COLUMN "church_id" uuid;--> statement-breakpoint
ALTER TABLE "prayers" ADD COLUMN "church_id" uuid;--> statement-breakpoint
ALTER TABLE "church_members" ADD CONSTRAINT "church_members_church_id_churches_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."churches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "church_members" ADD CONSTRAINT "church_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "churches" ADD CONSTRAINT "churches_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "churches" ADD CONSTRAINT "churches_subscription_id_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "church_members_church_user_idx" ON "church_members" USING btree ("church_id","user_id");--> statement-breakpoint
CREATE INDEX "church_members_user_idx" ON "church_members" USING btree ("user_id");--> statement-breakpoint
ALTER TABLE "groups" ADD CONSTRAINT "groups_church_id_churches_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."churches"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prayers" ADD CONSTRAINT "prayers_church_id_churches_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."churches"("id") ON DELETE set null ON UPDATE no action;