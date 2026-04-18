CREATE TYPE "public"."church_enterprise_campus_count" AS ENUM('1 (single site)', '2–4', '5–10', '11+');--> statement-breakpoint
CREATE TYPE "public"."church_enterprise_chms" AS ENUM('Planning Center', 'Breeze', 'ChurchTrac', 'Elvanto', 'Other', 'None');--> statement-breakpoint
CREATE TYPE "public"."church_enterprise_member_bucket" AS ENUM('<50', '50–150', '150–500', '500–2,000', '2,000+');--> statement-breakpoint
CREATE TYPE "public"."church_enterprise_timeline" AS ENUM('Ready now', '1–3 months', '3–6 months', 'Just exploring');--> statement-breakpoint
CREATE TYPE "public"."church_enterprise_use_case" AS ENUM('Prayer ministry', 'Small groups', 'Pastoral care', 'All of the above');--> statement-breakpoint
CREATE TABLE "church_enterprise_leads" (
	"id" uuid PRIMARY KEY NOT NULL,
	"church_name" text NOT NULL,
	"denomination" text,
	"city_state" text NOT NULL,
	"website" text NOT NULL,
	"member_bucket" "church_enterprise_member_bucket" NOT NULL,
	"campus_count" "church_enterprise_campus_count" NOT NULL,
	"chms" "church_enterprise_chms" NOT NULL,
	"use_case" "church_enterprise_use_case" NOT NULL,
	"timeline" "church_enterprise_timeline" NOT NULL,
	"contact_name" text NOT NULL,
	"contact_email" text NOT NULL,
	"contact_phone" text,
	"calendly_booked" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "enterprise_leads_created_idx" ON "church_enterprise_leads" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "enterprise_leads_email_idx" ON "church_enterprise_leads" USING btree ("contact_email");