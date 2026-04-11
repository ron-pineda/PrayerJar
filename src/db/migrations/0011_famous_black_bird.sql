ALTER TYPE "public"."notification_type" ADD VALUE 'partnership_request';--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'partnership_ended';--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'chain_joined';--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'group_joined';--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'testimony_posted';--> statement-breakpoint
CREATE TABLE "collectionPrayers" (
	"collectionId" uuid NOT NULL,
	"prayerId" uuid NOT NULL,
	"addedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "collectionPrayers_collectionId_prayerId_pk" PRIMARY KEY("collectionId","prayerId")
);
--> statement-breakpoint
CREATE TABLE "collections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"slug" text NOT NULL,
	"coverEmoji" text,
	"isPublished" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "collections_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "prayers" ADD COLUMN "testimonyStory" text;--> statement-breakpoint
ALTER TABLE "collectionPrayers" ADD CONSTRAINT "collectionPrayers_collectionId_collections_id_fk" FOREIGN KEY ("collectionId") REFERENCES "public"."collections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collectionPrayers" ADD CONSTRAINT "collectionPrayers_prayerId_prayers_id_fk" FOREIGN KEY ("prayerId") REFERENCES "public"."prayers"("id") ON DELETE cascade ON UPDATE no action;