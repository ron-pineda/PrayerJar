import { Resend } from 'resend';
import { render } from '@react-email/components';
import PrayerNotificationEmail from '@/emails/prayer-notification';
import EncouragementEmail from '@/emails/encouragement-message';
import BadgeEarnedEmail from '@/emails/badge-earned';
import { ChurchClaimVerifyEmail } from '@/emails/church-claim-verify';
import Welcome1Email from '@/emails/welcome-1';
import Welcome2Email from '@/emails/welcome-2';
import Welcome3Email from '@/emails/welcome-3';
import IntercessorThanksEmail from '@/emails/intercessor-thanks';
import { db } from '@/db';
import { prayerInteractions, prayers, users, welcomeDripStatus, type BadgeType } from '@/db/schema';
import { eq } from 'drizzle-orm';

const resend = new Resend(process.env.AUTH_RESEND_KEY ?? 're_placeholder');
const FROM = process.env.AUTH_EMAIL_FROM ?? 'Prayer Jar <noreply@prayerjar.org>';
const BASE_URL = process.env.NEXTAUTH_URL ?? 'http://localhost:3000';

const BADGE_LABELS: Record<BadgeType, { name: string; description: string }> = {
  first_light: { name: 'First Light', description: 'You submitted your first prayer request.' },
  first_prayer: { name: 'First Prayer', description: 'You prayed for someone for the first time.' },
  intercessor_bronze: { name: 'Intercessor (Bronze)', description: 'Prayed for 10 requests.' },
  intercessor_silver: { name: 'Intercessor (Silver)', description: 'Prayed for 50 requests.' },
  intercessor_gold: { name: 'Intercessor (Gold)', description: 'Prayed for 100 requests.' },
  encourager_bronze: { name: 'Encourager (Bronze)', description: 'Left 10 encouragement messages.' },
  encourager_silver: { name: 'Encourager (Silver)', description: 'Left 50 encouragement messages.' },
  encourager_gold: { name: 'Encourager (Gold)', description: 'Left 100 encouragement messages.' },
  faithful: { name: 'Faithful', description: '7-day prayer streak.' },
  devoted: { name: 'Devoted', description: '30-day prayer streak.' },
  witness: { name: 'Witness', description: 'Your prayer was answered!' },
  testimony: { name: 'Testimony', description: 'You shared your testimony on the Praise Wall.' },
  community_builder: { name: 'Community Builder', description: 'First prayer in a group room.' },
};

export async function sendPrayerNotificationEmail(email: string, prayerId: string) {
  const [prayer] = await db.select().from(prayers).where(eq(prayers.id, prayerId)).limit(1);
  if (!prayer) return;

  const snippet = prayer.content.slice(0, 80) + (prayer.content.length > 80 ? '...' : '');
  const html = await render(PrayerNotificationEmail({
    prayerCount: prayer.prayerCount,
    prayerSnippet: snippet,
    prayerUrl: `${BASE_URL}/my-prayers`,
  }));

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: `${prayer.prayerCount === 1 ? 'Someone prayed' : `${prayer.prayerCount} people prayed`} for your request`,
    html,
  });
}

export async function sendEncouragementEmail(email: string, interactionId: string) {
  const [interaction] = await db
    .select()
    .from(prayerInteractions)
    .where(eq(prayerInteractions.id, interactionId))
    .limit(1);
  if (!interaction?.message) return;

  let senderName = 'Someone';
  if (!interaction.isAnonymous && interaction.userId) {
    const [sender] = await db.select().from(users).where(eq(users.id, interaction.userId)).limit(1);
    if (sender?.name) senderName = sender.name;
  }

  const html = await render(EncouragementEmail({
    message: interaction.message,
    senderName,
    prayerUrl: `${BASE_URL}/my-prayers`,
  }));

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: `${senderName} left you an encouragement message`,
    html,
  });
}

export async function sendBadgeEmail(email: string, badgeType: BadgeType) {
  const badge = BADGE_LABELS[badgeType];
  const html = await render(BadgeEarnedEmail({
    badgeName: badge.name,
    badgeDescription: badge.description,
    profileUrl: `${BASE_URL}/badges`,
  }));

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: `You earned the ${badge.name} badge!`,
    html,
  });
}

export async function sendClaimVerificationEmail(
  email: string,
  { claimerName, role, verifyUrl }: { claimerName: string; role: string; verifyUrl: string }
) {
  const html = await render(ChurchClaimVerifyEmail({ claimerName, role, verifyUrl }));

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: "Verify your church listing on The Prayer Jar",
    html,
  });
}

export async function sendWelcome1Email(userId: string, email: string) {
  const html = await render(Welcome1Email());

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: 'Welcome to PrayerJar',
    html,
  });

  await db
    .insert(welcomeDripStatus)
    .values({ userId, email1SentAt: new Date() })
    .onConflictDoUpdate({
      target: welcomeDripStatus.userId,
      set: { email1SentAt: new Date() },
    });
}

export async function sendWelcome2Email(userId: string, email: string) {
  const html = await render(Welcome2Email());

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: 'Someone may need your prayer today',
    html,
  });

  await db
    .update(welcomeDripStatus)
    .set({ email2SentAt: new Date() })
    .where(eq(welcomeDripStatus.userId, userId));
}

export async function sendWelcome3Email(userId: string, email: string) {
  const html = await render(Welcome3Email());

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: "How's your prayer going?",
    html,
  });

  await db
    .update(welcomeDripStatus)
    .set({ email3SentAt: new Date() })
    .where(eq(welcomeDripStatus.userId, userId));
}

export async function sendIntercessorCareEmail(
  email: string,
  { userName, prayerCount }: { userName?: string; prayerCount: number }
) {
  const html = await render(IntercessorThanksEmail({ userName, prayerCount }));

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: 'Thank you for interceding 🙏',
    html,
  });
}
