import { NextResponse } from 'next/server';
import { db } from '@/db';
import { verificationTokens } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(req: Request) {
  if (process.env.VERCEL_ENV === 'production') {
    return new NextResponse('not found', { status: 404 });
  }
  const url = new URL(req.url);
  if (url.searchParams.get('token') !== process.env.SENTRY_DEBUG_TOKEN) {
    return new NextResponse('not found', { status: 404 });
  }
  const email = url.searchParams.get('email');
  if (!email) return new NextResponse('email required', { status: 400 });

  // Schema verified: verificationTokens has identifier, token, expires columns
  const [row] = await db
    .select()
    .from(verificationTokens)
    .where(eq(verificationTokens.identifier, email))
    .orderBy(desc(verificationTokens.expires))
    .limit(1);

  if (!row) return new NextResponse('no token', { status: 404 });
  return NextResponse.json({ token: row.token, expires: row.expires });
}
