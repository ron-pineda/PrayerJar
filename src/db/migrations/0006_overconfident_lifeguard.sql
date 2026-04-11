CREATE TYPE "public"."check_in_mood" AS ENUM('struggling', 'okay', 'better', 'breakthrough');--> statement-breakpoint
CREATE TABLE "check_ins" (
	"id" uuid PRIMARY KEY NOT NULL,
	"prayer_id" uuid NOT NULL,
	"mood" "check_in_mood" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "grief_dates" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"prayer_id" uuid,
	"label" text NOT NULL,
	"anniversary_date" date NOT NULL,
	"last_sent_year" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "check_ins" ADD CONSTRAINT "check_ins_prayer_id_prayers_id_fk" FOREIGN KEY ("prayer_id") REFERENCES "public"."prayers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grief_dates" ADD CONSTRAINT "grief_dates_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grief_dates" ADD CONSTRAINT "grief_dates_prayer_id_prayers_id_fk" FOREIGN KEY ("prayer_id") REFERENCES "public"."prayers"("id") ON DELETE set null ON UPDATE no action;