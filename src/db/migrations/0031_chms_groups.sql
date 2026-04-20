-- Migration: 0031_chms_groups
-- Sprint 22 pj-s22-08: Persist ChMS groups + group-member junction table
-- Note: the existing `groups` table has unused externalChmsId/chmsProvider columns from
-- migration 0030 (Sprint 18). This migration creates dedicated chms_groups + chms_group_members
-- tables that are separate from the app-native groups surface.

-- ============================================================
-- A. chms_groups — one row per group imported from any CHMS
-- ============================================================

CREATE TABLE "chms_groups" (
  "id"          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  "church_id"   uuid        NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  "provider"    text        NOT NULL,   -- 'planning-center' | 'breeze'
  "external_id" text        NOT NULL,
  "name"        text        NOT NULL,
  "description" text,
  "is_active"   boolean     NOT NULL DEFAULT true,
  "raw"         jsonb,
  "synced_at"   timestamptz NOT NULL DEFAULT now(),
  "created_at"  timestamptz NOT NULL DEFAULT now(),
  UNIQUE("church_id", "provider", "external_id")
);

CREATE INDEX ON "chms_groups" ("church_id");

-- ============================================================
-- B. chms_group_members — junction: group ↔ church_member
-- ============================================================

CREATE TABLE "chms_group_members" (
  "id"                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "group_id"           uuid NOT NULL REFERENCES chms_groups(id) ON DELETE CASCADE,
  "church_member_id"   uuid REFERENCES church_members(id) ON DELETE SET NULL,
  "external_member_id" text NOT NULL,   -- CHMS-side person ID
  "created_at"         timestamptz NOT NULL DEFAULT now(),
  UNIQUE("group_id", "external_member_id")
);

CREATE INDEX ON "chms_group_members" ("group_id");

-- ============================================================
-- ROLLBACK
-- ============================================================
-- DROP TABLE IF EXISTS chms_group_members;
-- DROP TABLE IF EXISTS chms_groups;
-- ============================================================
