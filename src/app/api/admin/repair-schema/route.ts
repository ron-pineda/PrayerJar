// ONE-TIME USE: repair production schema by adding missing columns
// DELETE THIS FILE after running once.
import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';

const REPAIR_SECRET = process.env.REPAIR_SECRET ?? 'prayerjar-repair-2026';

export async function POST(request: Request) {
  const auth = request.headers.get('x-repair-secret');
  if (auth !== REPAIR_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sql = neon(process.env.DATABASE_URL!);
  const results: { stmt: string; status: 'ok' | 'error'; message?: string }[] = [];

  const stmts = [
    // migration 0005: followUpSentAt on prayers
    `ALTER TABLE "prayers" ADD COLUMN IF NOT EXISTS "followUpSentAt" timestamp`,
    // migration 0010: group_id on prayers
    `ALTER TABLE "prayers" ADD COLUMN IF NOT EXISTS "group_id" uuid`,
    // migration 0011: testimonyStory on prayers
    `ALTER TABLE "prayers" ADD COLUMN IF NOT EXISTS "testimonyStory" text`,
    // migration 0012: geo columns on prayers
    `ALTER TABLE "prayers" ADD COLUMN IF NOT EXISTS "latitude" double precision`,
    `ALTER TABLE "prayers" ADD COLUMN IF NOT EXISTS "longitude" double precision`,
    `ALTER TABLE "prayers" ADD COLUMN IF NOT EXISTS "country" text`,
    // migration 0018: church_id on prayers (no FK constraint — safer)
    `ALTER TABLE "prayers" ADD COLUMN IF NOT EXISTS "church_id" uuid`,
    // migration 0022: audio/transcription/video columns
    `ALTER TABLE "prayers" ADD COLUMN IF NOT EXISTS "audio_url" text`,
    `ALTER TABLE "prayers" ADD COLUMN IF NOT EXISTS "transcription" text`,
    `ALTER TABLE "prayers" ADD COLUMN IF NOT EXISTS "video_duration_seconds" integer`,
    // migration 0023: video_url
    `ALTER TABLE "prayers" ADD COLUMN IF NOT EXISTS "video_url" text`,
  ];

  for (const stmt of stmts) {
    try {
      await sql.unsafe(stmt);
      results.push({ stmt: stmt.slice(0, 80), status: 'ok' });
    } catch (err) {
      results.push({
        stmt: stmt.slice(0, 80),
        status: 'error',
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }

  // Verify final column list
  const cols = await sql`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'prayers'
    ORDER BY ordinal_position
  `;

  return NextResponse.json({
    results,
    columns: cols.map((r) => r.column_name),
  });
}
