import { auth } from '@/lib/auth';
import { notFound } from 'next/navigation';

/**
 * requireAdmin() — for server components and server actions.
 * Returns { email } if the current session is an admin.
 * Calls notFound() (404) otherwise — never redirects, to minimize disclosure.
 */
export async function requireAdmin(): Promise<{ email: string }> {
  const session = await auth();
  const email = session?.user?.email;
  const allowed = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean);

  if (!email || !allowed.includes(email)) {
    notFound();
  }

  return { email: email as string };
}

/**
 * withAdmin() — for API route handlers.
 * Returns a 404 Response if the caller is not an admin.
 * Calls handler with { email } if the caller is an admin.
 */
export function withAdmin<T>(
  handler: (req: Request, ctx: { email: string }) => Promise<Response>
): (req: Request) => Promise<Response> {
  return async (req: Request): Promise<Response> => {
    const session = await auth();
    const email = session?.user?.email;
    const allowed = (process.env.ADMIN_EMAILS ?? '')
      .split(',')
      .map((e) => e.trim())
      .filter(Boolean);

    if (!email || !allowed.includes(email)) {
      return new Response('Not Found', { status: 404 });
    }

    return handler(req, { email: email as string });
  };
}
