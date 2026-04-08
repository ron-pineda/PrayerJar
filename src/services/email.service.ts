import { Resend } from 'resend';
import { render } from '@react-email/components';
import PrayerNotificationEmail from '@/emails/prayer-notification';
import EncouragementEmail from '@/emails/encouragement-message';
import BadgeEarnedEmail from '@/emails/badge-earned';
import { db } from '@/db';
import { prayerInteractions, prayers, users, type BadgeType } from '@/db/schema';
import { eq } from 'drizzle-orm';

const resend = new Resend(process.env.AUTH_RESEND_KEY ?? 're_placeholder');
const FROM = process.env.AUTH_EMAIL_FROM ?? 'Prayer Jar <noreply@prayerjar.app>';
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
