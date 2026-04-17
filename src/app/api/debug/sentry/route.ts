import * as Sentry from '@sentry/nextjs';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const url = new URL(req.url);
  if (url.searchParams.get('token') !== process.env.SENTRY_DEBUG_TOKEN) {
    return new NextResponse('not found', { status: 404 });
  }
  const dsn = process.env.SENTRY_DSN;
  const err = new Error('sentry-debug: synthetic error from /api/debug/sentry');
  Sentry.captureException(err);
  const flushed = await Sentry.flush(2000);
  return NextResponse.json({ captured: true, flushed, dsnPresent: !!dsn, message: err.message }, { status: 500 });
}
