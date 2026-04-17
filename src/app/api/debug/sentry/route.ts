import * as Sentry from '@sentry/nextjs';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const url = new URL(req.url);
  if (url.searchParams.get('token') !== process.env.SENTRY_DEBUG_TOKEN) {
    return new NextResponse('not found', { status: 404 });
  }
  const err = new Error('sentry-debug: synthetic error from /api/debug/sentry');
  Sentry.captureException(err);
  await Sentry.flush(2000);
  return NextResponse.json({ captured: true, message: err.message }, { status: 500 });
}
