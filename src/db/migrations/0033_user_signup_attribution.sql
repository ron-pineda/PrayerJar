-- 0033_user_signup_attribution (pj-s26-03)
--
-- First-touch signup attribution on the users row. Written once by
-- events.createUser (src/lib/auth.ts) from the pj_attr cookie set in
-- src/proxy.ts; never updated afterwards.
--
-- Column names mirror churches.acquisition_source / utm_* so user-side and
-- church-side acquisition share one vocabulary.
--
-- All columns are nullable with no default: the 6 pre-existing users predate
-- instrumentation and NULL is the honest value for them. Do NOT backfill.

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "acquisition_source" text;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "utm_source" text;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "utm_medium" text;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "utm_campaign" text;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "signup_referrer" text;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "signup_landing_path" text;

-- Supports the only query this table is for: signups grouped by channel over
-- a date range. Partial — rows with no attribution are never in the result.
CREATE INDEX IF NOT EXISTS "users_acquisition_source_idx"
  ON "users" ("acquisition_source", "created_at")
  WHERE "acquisition_source" IS NOT NULL;
