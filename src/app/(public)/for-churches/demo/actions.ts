'use server';

import { Resend } from 'resend';
import { z } from 'zod';
import { db } from '@/db';
import { churchEnterpriseLeads } from '@/db/schema';
import { trackDemoRequested } from '@/lib/analytics.server';

const resend = new Resend(process.env.AUTH_RESEND_KEY ?? 're_placeholder');
const FROM = process.env.AUTH_EMAIL_FROM ?? 'Prayer Jar <noreply@prayerjar.org>';

// ── Validation schema ──────────────────────────────────────────────────────

const demoSchema = z.object({
  churchName: z.string().min(1, 'Church name is required').max(200),
  denomination: z.string().max(200).optional(),
  cityState: z.string().min(1, 'Location is required').max(200),
  website: z.string().min(1, 'Website is required').url('Please enter a valid website URL'),
  memberBucket: z.enum(['<50', '50–150', '150–500', '500–2,000', '2,000+'], {
    error: 'Please select a member range',
  }),
  campusCount: z.enum(['1 (single site)', '2–4', '5–10', '11+'], {
    error: 'Please select number of campuses',
  }),
  chms: z.enum(['Planning Center', 'Breeze', 'ChurchTrac', 'Elvanto', 'Other', 'None'], {
    error: 'Please select your current ChMS',
  }),
  useCase: z.enum(['Prayer ministry', 'Small groups', 'Pastoral care', 'All of the above'], {
    error: 'Please select a primary use case',
  }),
  timeline: z.enum(['Ready now', '1–3 months', '3–6 months', 'Just exploring'], {
    error: 'Please select a timeline',
  }),
  contactName: z.string().min(1, 'Contact name is required').max(200),
  contactEmail: z.string().min(1, 'Contact email is required').email('Please enter a valid email address'),
  contactPhone: z.string().max(50).optional(),
});

export type DemoFormResult = { success: true } | { error: string };

// ── Analytics bucket mapping ───────────────────────────────────────────────
// Maps demo form member-bucket enum to spec §3.8 church_size_bucket values.
function toAnalyticsBucket(memberBucket: string): string {
  switch (memberBucket) {
    case '<50': return '1-25'; // closest spec bucket
    case '50–150': return '26-100';
    case '150–500': return '101-500';
    case '500–2,000':
    case '2,000+': return '500+';
    default: return '1-25';
  }
}

// ── Qualification flags (derived from form data for the admin notification) ──

function qualificationFlags(data: z.infer<typeof demoSchema>) {
  const members500plus = data.memberBucket === '500–2,000' || data.memberBucket === '2,000+';
  const multiSite = data.campusCount !== '1 (single site)';
  const hasDenomination = !!(data.denomination && data.denomination.trim().length > 0);

  return {
    members500plus,
    multiSite,
    hasDenomination,
  };
}

// ── Admin notification email ───────────────────────────────────────────────

async function sendAdminNotification(data: z.infer<typeof demoSchema>): Promise<void> {
  const raw = process.env.ADMIN_EMAILS ?? '';
  const recipients = raw
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean);

  if (recipients.length === 0) {
    console.warn('[requestDemo] ADMIN_EMAILS is not set — skipping admin notification.');
    return;
  }

  const flags = qualificationFlags(data);
  const timestamp = new Date().toISOString();

  const body = `New Network demo request — ${timestamp}

Church: ${data.churchName}
Denomination: ${data.denomination ?? 'Independent'}
Location: ${data.cityState}
Website: ${data.website}
Members: ${data.memberBucket}
Campuses: ${data.campusCount}
Current ChMS: ${data.chms}
Use case: ${data.useCase}
Timeline: ${data.timeline}

Contact: ${data.contactName}
Email: ${data.contactEmail}
Phone: ${data.contactPhone ?? 'Not provided'}

Qualification flags:
  Members 500+: ${flags.members500plus ? 'YES' : 'NO'}
  Multi-site: ${flags.multiSite ? 'YES' : 'NO'}
  Denomination: ${flags.hasDenomination ? 'YES' : 'NO'}

Recommended action: Book a discovery call within 24h.`;

  const subject = `New Network lead: ${data.churchName} — ${data.memberBucket} members, ${data.timeline}`;

  await resend.emails.send({
    from: FROM,
    to: recipients,
    subject,
    text: body,
  });
}

// ── Server action ──────────────────────────────────────────────────────────

export async function requestDemo(formData: FormData): Promise<DemoFormResult> {
  const parsed = demoSchema.safeParse({
    churchName: formData.get('churchName'),
    denomination: formData.get('denomination') || undefined,
    cityState: formData.get('cityState'),
    website: formData.get('website'),
    memberBucket: formData.get('memberBucket'),
    campusCount: formData.get('campusCount'),
    chms: formData.get('chms'),
    useCase: formData.get('useCase'),
    timeline: formData.get('timeline'),
    contactName: formData.get('contactName'),
    contactEmail: formData.get('contactEmail'),
    contactPhone: formData.get('contactPhone') || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const data = parsed.data;

  // Persist to DB first — a Resend outage must not lose the lead.
  try {
    await db.insert(churchEnterpriseLeads).values({
      churchName: data.churchName,
      denomination: data.denomination ?? null,
      cityState: data.cityState,
      website: data.website,
      memberBucket: data.memberBucket,
      campusCount: data.campusCount,
      chms: data.chms,
      useCase: data.useCase,
      timeline: data.timeline,
      contactName: data.contactName,
      contactEmail: data.contactEmail,
      contactPhone: data.contactPhone ?? null,
    });
  } catch (err) {
    console.error('[requestDemo] DB insert failed:', err);
    return { error: 'Something went wrong. Please try again.' };
  }

  // Funnel event — fires server-side after successful lead persist.
  // has_calendly_booked is false at submit time; updated via Calendly webhook
  // or redirect param in Sprint 18. Spec §3.8.
  void trackDemoRequested({
    church_size_bucket: toAnalyticsBucket(data.memberBucket),
    has_calendly_booked: false,
    referrer_plan: null, // no referrer_plan passed through the current form
    source_utm: null,    // UTM not captured in the current form; future sprint
  });

  // Fire admin notification — failure must not block the user-facing response.
  sendAdminNotification(data).catch((err) => {
    console.error('[requestDemo] Admin notification failed:', err);
  });

  return { success: true };
}
