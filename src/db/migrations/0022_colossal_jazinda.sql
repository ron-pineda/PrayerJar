ALTER TABLE "prayers" ADD COLUMN "audio_url" text;--> statement-breakpoint
ALTER TABLE "prayers" ADD COLUMN "transcription" text;--> statement-breakpoint
ALTER TABLE "prayers" ADD COLUMN "video_duration_seconds" integer;