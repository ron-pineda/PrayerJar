import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const url = new URL(req.url);
  if (url.searchParams.get('token') !== process.env.SENTRY_DEBUG_TOKEN) {
    return new NextResponse('not found', { status: 404 });
  }
  throw new Error('sentry-debug: synthetic error from /api/debug/sentry');
}
