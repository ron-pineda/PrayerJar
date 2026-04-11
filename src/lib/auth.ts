import NextAuth from 'next-auth';
import Nodemailer from 'next-auth/providers/nodemailer';
import { createTransport } from 'nodemailer';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { db } from '@/db';
import * as schema from '@/db/schema';

const smtpServer = {
  host: 'smtp.resend.com',
  port: 465,
  secure: true,
  auth: {
    user: 'resend',
    pass: process.env.AUTH_RESEND_KEY,
  },
};

const fromAddress = process.env.AUTH_EMAIL_FROM ?? 'Prayer Jar <noreply@prayerjar.app>';

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: schema.users,
    accountsTable: schema.accounts,
    sessionsTable: schema.sessions,
    verificationTokensTable: schema.verificationTokens,
  }),
  providers: [
    Nodemailer({
      server: smtpServer,
      from: fromAddress,
      async sendVerificationRequest({ identifier, url }) {
        const transport = createTransport(smtpServer);
        await transport.sendMail({
          from: fromAddress,
          to: identifier,
          subject: 'Sign in to The Prayer Jar',
          text: `Sign in to The Prayer Jar\n\nCopy and paste this link into your browser:\n\n${url}\n\nThis link expires in 10 minutes.\n\nIf you did not request this email, you can safely ignore it.`,
        });
      },
    }),
  ],
  callbacks: {
    session({ session, user }) {
      session.user.id = user.id;
      return session;
    },
  },
  pages: {
    signIn: '/sign-in',
    verifyRequest: '/sign-in?verify=1',
  },
});
