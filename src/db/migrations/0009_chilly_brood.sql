CREATE TABLE "chain_participants" (
	"id" uuid PRIMARY KEY NOT NULL,
	"chain_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"slot_hour" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prayer_adoptions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"prayer_id" uuid NOT NULL,
	"adopted_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prayer_chains" (
	"id" uuid PRIMARY KEY NOT NULL,
	"prayer_id" uuid NOT NULL,
	"created_by" uuid NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "chain_participants" ADD CONSTRAINT "chain_participants_chain_id_prayer_chains_id_fk" FOREIGN KEY ("chain_id") REFERENCES "public"."prayer_chains"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chain_participants" ADD CONSTRAINT "chain_participants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prayer_adoptions" ADD CONSTRAINT "prayer_adoptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prayer_adoptions" ADD CONSTRAINT "prayer_adoptions_prayer_id_prayers_id_fk" FOREIGN KEY ("prayer_id") REFERENCES "public"."prayers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prayer_chains" ADD CONSTRAINT "prayer_chains_prayer_id_prayers_id_fk" FOREIGN KEY ("prayer_id") REFERENCES "public"."prayers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prayer_chains" ADD CONSTRAINT "prayer_chains_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "chain_participants_chain_slot_idx" ON "chain_participants" USING btree ("chain_id","slot_hour");--> statement-breakpoint
CREATE INDEX "chain_participants_chain_idx" ON "chain_participants" USING btree ("chain_id");--> statement-breakpoint
CREATE UNIQUE INDEX "prayer_adoptions_user_prayer_idx" ON "prayer_adoptions" USING btree ("user_id","prayer_id");--> statement-breakpoint
CREATE INDEX "prayer_adoptions_prayer_idx" ON "prayer_adoptions" USING btree ("prayer_id");