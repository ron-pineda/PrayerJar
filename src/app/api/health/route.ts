import { NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';

// Public health check for uptime monitoring (Better Stack pings this).
// Returns 200 only when every critical dependency is healthy, 503 otherwise.
// Checks are the failure modes that have actually bitten us in prod:
//  - db: Neon reachable (schema drift / connection issues)
//  - email: Resend domain verification (the Apr-Jul 2026 outage — DNS records
//    dropped in a nameserver migration silently killed all sign-in emails)
// Component values are booleans only — no internals leak on a public route.

export const dynamic = 'force-dynamic';

const RESEND_DOMAIN_ID = '241d4bcd-7bc1-4282-ab88-2e37183719d6'; // prayerjar.org

async function checkDb(): Promise<boolean> {
  try {
    await db.execute(sql`SELECT 1`);
    return true;
  } catch {
    return false;
  }
}

async function checkEmail(): Promise<boolean> {
  const key = process.env.AUTH_RESEND_KEY;
  if (!key) return false;
  try {
    const res = await fetch(`https://api.resend.com/domains/${RESEND_DOMAIN_ID}`, {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return false;
    const domain = (await res.json()) as { status?: string };
    return domain.status === 'verified';
  } catch {
    return false;
  }
}

export async function GET() {
  const [dbOk, emailOk] = await Promise.all([checkDb(), checkEmail()]);
  const healthy = dbOk && emailOk;
  return NextResponse.json(
    { status: healthy ? 'ok' : 'degraded', db: dbOk, email: emailOk },
    { status: healthy ? 200 : 503 },
  );
}
