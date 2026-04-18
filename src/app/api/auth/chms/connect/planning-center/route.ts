import { randomBytes } from 'node:crypto';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { churchMembers } from '@/db/schema';
import { and, eq, inArray } from 'drizzle-orm';
import { PlanningCenterAdapter } from '@/lib/chms/adapters/PlanningCenterAdapter';
import { trackChmsConnectionStarted } from '@/lib/analytics.server';

// GET /api/auth/chms/connect/planning-center?churchId=<id>
export async function GET(request: Request) {
  // 1. Auth guard — must be signed in
  const session = await auth();
  if (!session?.user?.id) {
    return Response.redirect(new URL('/sign-in', request.url));
  }

  // 2. Parse churchId from query
  const { searchParams } = new URL(request.url);
  const churchId = searchParams.get('churchId');
  if (!churchId) {
    return new Response('Missing churchId', { status: 400 });
  }

  // 3. Check user is admin/pastor of that church
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

  // 4. Generate state: `<churchId>:<nonce>`
  const nonce = randomBytes(16).toString('hex');
  const state = `${churchId}:${nonce}`;

  // 5. Build authorization URL
  const adapter = new PlanningCenterAdapter();
  const authorizationUrl = adapter.getAuthorizationUrl(state);

  // Fire analytics: connection initiated (after auth + role check, before redirect)
  await trackChmsConnectionStarted({
    church_id: churchId,
    provider: 'planning-center',
    user_id: session.user.id,
  });

  // 6. Set state cookie and redirect to PCO
  return new Response(null, {
    status: 302,
    headers: {
      Location: authorizationUrl,
      'Set-Cookie': `pco_oauth_state=${state}; HttpOnly; SameSite=Lax; Path=/; Max-Age=600`,
    },
  });
}
