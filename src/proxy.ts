import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_PREFIXES = ['/my-prayers', '/journal', '/notifications', '/settings', '/badges'];
const ADMIN_PREFIXES = ['/admin'];

export default auth((req: NextRequest & { auth?: { user?: { email?: string | null } } | null }) => {
  const { pathname } = req.nextUrl;

  if (ADMIN_PREFIXES.some((p) => pathname.startsWith(p))) {
    const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map((e) => e.trim());
    if (!req.auth?.user?.email || !adminEmails.includes(req.auth.user.email)) {
      return NextResponse.redirect(new URL('/sign-in', req.url));
    }
  }

  if (PROTECTED_PREFIXES.some((p) => pathname.startsWith(p)) && !req.auth) {
    return NextResponse.redirect(new URL('/sign-in', req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
