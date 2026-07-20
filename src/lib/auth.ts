import '@/lib/env'; // production startup assertions (ADMIN_EMAILS guard)
import NextAuth from 'next-auth';
import Resend from 'next-auth/providers/resend';
import Google from 'next-auth/providers/google';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { render } from '@react-email/components';
import { db } from '@/db';
import * as schema from '@/db/schema';
import SignInEmail from '@/emails/sign-in';
import { sendWelcome1Email } from '@/services/email.service';

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  adapter: DrizzleAdapter(db, {
    usersTable: schema.users,
    accountsTable: schema.accounts,
    sessionsTable: schema.sessions,
    verificationTokensTable: schema.verificationTokens,
  }),
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      allowDangerousEmailAccountLinking: true,
      checks: [],
    }),
    Resend({
      apiKey: process.env.AUTH_RESEND_KEY,
      from: process.env.AUTH_EMAIL_FROM ?? 'Prayer Jar <noreply@prayerjar.org>',
      async sendVerificationRequest({ identifier: to, url, provider }) {
        let magicLinkUrl = url;
        // NextAuth constructs url with its base URL (prayerjar.org) even when
        // sign-in originated from a subdomain. The sign-in page embeds the
        // subdomain as an absolute callbackUrl — use that to rewrite the magic
        // link so the callback is processed on the correct subdomain host.
        try {
          const parsed = new URL(url);
          const cb = parsed.searchParams.get('callbackUrl');
          if (cb) {
            const cbParsed = new URL(cb);
            if (/^[a-z0-9-]{1,32}\.prayerjar\.org$/i.test(cbParsed.hostname)) {
              parsed.hostname = cbParsed.hostname;
              magicLinkUrl = parsed.toString();
            }
          }
        } catch { /* malformed url — send as-is */ }
        const html = await render(SignInEmail({ url: magicLinkUrl }));
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${provider.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: provider.from,
            to,
            subject: 'Sign in to The Prayer Jar',
            html,
          }),
        });
        if (!res.ok) throw new Error('Resend error: ' + JSON.stringify(await res.json()));
      },
    }),
  ],
  events: {
    async createUser({ user }) {
      // NEVER let a welcome-email failure break signup. Resend can reject for
      // unverified domains, rate limits, or recipient issues — when that
      // throws inside a NextAuth event, the user sees a Configuration error
      // and can't sign in at all. The drip job can recover missing sends.
      if (user.id && user.email) {
        try {
          await sendWelcome1Email(user.id, user.email);
        } catch (err) {
          console.error('[auth.createUser] welcome email failed:', err);
        }
      }
    },
  },
  callbacks: {
    session({ session, user }) {
      session.user.id = user.id;
      return session;
    },
  },
  pages: {
    signIn: '/sign-in',
    // Must be a clean path: NextAuth appends ?provider=...&type=... with a bare
    // `?`, which would corrupt a value that already has a query string.
    verifyRequest: '/sign-in/verify',
  },
});
