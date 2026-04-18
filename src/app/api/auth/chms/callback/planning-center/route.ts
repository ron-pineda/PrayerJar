import { auth } from '@/lib/auth';
import { db } from '@/db';
import { churchMembers } from '@/db/schema';
import { and, eq, inArray } from 'drizzle-orm';
import { PlanningCenterAdapter } from '@/lib/chms/adapters/PlanningCenterAdapter';
import { trackChmsConnectionCompleted } from '@/lib/analytics.server';

// GET /api/auth/chms/callback/planning-center?code=...&state=...
export async function GET(request: Request) {
  // 1. Auth guard — must be signed in
  const session = await auth();
  if (!session?.user?.id) {
    return Response.redirect(new URL('/sign-in', request.url));
  }

  // 2. Parse code + state from URL
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  if (!code || !state) {
    return new Response('Missing code or state', { status: 400 });
  }

  // 3. Verify CSRF state cookie matches — cookie name: 'pco_oauth_state'
  const cookies = request.headers.get('cookie') ?? '';
  const stateCookie = cookies
    .split(';')
    .find(c => c.trim().startsWith('pco_oauth_state='))
    ?.split('=')[1]
    ?.trim();

  if (!stateCookie || state !== stateCookie) {
    return new Response('Invalid OAuth state', { status: 400 });
  }

  // 4. Validate churchId from the state (state = `<churchId>:<nonce>`)
  const churchId = state.split(':')[0];
  if (!churchId) {
    return new Response('Invalid state format', { status: 400 });
  }

  // 5. Check user is admin/pastor of that church
  const [membership] = await db
    .select()
    .from(churchMembers)
    .where(
      and(
        eq(churchMembers.churchId, churchId),
        eq(churchMembers.userId, session.user.id),
        inArray(churchMembers.role, ['admin', 'pastor'])
      )
    )
    .limit(1);

  if (!membership) {
    return new Response('Forbidden', { status: 403 });
  }

  // 6. Exchange code for tokens
  try {
    const adapter = new PlanningCenterAdapter();
    await adapter.exchangeCodeForTokens(code, churchId);

    // Fire analytics: connection succeeded, tokens stored, full_sync job queued
    await trackChmsConnectionCompleted({
      church_id: churchId,
      provider: 'planning-center',
      user_id: session.user.id,
      sync_job_queued: true,
    });
  } catch (err) {
    console.error('[PCO callback] token exchange failed:', err);
    const failUrl = new URL('/church/settings/integrations', request.url);
    failUrl.searchParams.set('error', 'pco_connect_failed');
    // Clear the state cookie
    const response = Response.redirect(failUrl.toString());
    return new Response(null, {
      status: 302,
      headers: {
        Location: failUrl.toString(),
        'Set-Cookie':
          'pco_oauth_state=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0',
      },
    });
  }

  // 7. Clear the state cookie + redirect to integrations page with success param
  const successUrl = new URL('/church/settings/integrations', request.url);
  successUrl.searchParams.set('connected', 'planning-center');

  return new Response(null, {
    status: 302,
    headers: {
      Location: successUrl.toString(),
      'Set-Cookie':
        'pco_oauth_state=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0',
    },
  });
}
