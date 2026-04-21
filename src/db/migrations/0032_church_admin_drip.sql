CREATE TABLE IF NOT EXISTS "churchAdminDripStatus" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "church_id" uuid NOT NULL REFERENCES "churches"("id") ON DELETE CASCADE,
  "admin_user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "email1_sent_at" timestamp,
  "email2_sent_at" timestamp,
  "email3_sent_at" timestamp,
  "created_at" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "churchAdminDripStatus_church_id_unique" UNIQUE("church_id")
);

CREATE INDEX IF NOT EXISTS "churchAdminDripStatus_created_at_idx"
  ON "churchAdminDripStatus" ("created_at");
