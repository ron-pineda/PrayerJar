import type { Metadata } from 'next';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { churchMembers, churches } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { DpaAcceptButton } from './DpaAcceptButton';
import { DPA_VERSION } from './constants';

export const metadata: Metadata = {
  title: 'Data Processing Addendum | The Prayer Jar',
  description:
    'PrayerJar Data Processing Addendum — GDPR / UK GDPR compatible. Church admins can click-through accept on behalf of their church.',
};

interface Props {
  searchParams: Promise<{ churchId?: string }>;
}

export default async function DpaPage({ searchParams }: Props) {
  const { churchId } = await searchParams;

  const session = await auth();

  // Resolve church context for the accept button
  let church: { id: string; name: string } | null = null;
  let canAccept = false;

  if (session?.user?.id && churchId) {
    // Verify the church exists and the user is admin/pastor
    const [row] = await db
      .select({ id: churches.id, name: churches.name, role: churchMembers.role })
      .from(churches)
      .innerJoin(churchMembers, eq(churchMembers.churchId, churches.id))
      .where(
        and(
          eq(churches.id, churchId),
          eq(churchMembers.userId, session.user.id),
        ),
      )
      .limit(1);

    if (row) {
      church = { id: row.id, name: row.name };
      canAccept = row.role === 'admin' || row.role === 'pastor';
    }
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-16">
      {/* Draft disclaimer — required by acceptance criteria */}
      <div className="rounded-md border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40 px-4 py-3 text-sm text-amber-900 dark:text-amber-200 mb-8">
        <strong>Draft notice.</strong> This is an AI-drafted Data Processing Addendum.
        PrayerJar is not a law firm. Consult qualified legal counsel before relying on
        this document.
      </div>

      <h1 className="text-3xl font-bold tracking-tight mb-1">Data Processing Addendum</h1>
      <p className="text-sm text-muted-foreground mb-8">
        Document version: {DPA_VERSION} &middot;{' '}
        <Link href="/legal/subprocessors" className="text-primary underline underline-offset-4">
          Sub-processor list
        </Link>
      </p>

      {/* ── DPA content ─────────────────────────────────────────────────── */}
      <div className="prose prose-sm dark:prose-invert max-w-none mb-12 text-foreground leading-relaxed space-y-6">

        <section>
          <h2 className="text-xl font-semibold mb-2">1. Parties</h2>
          <p>
            This Data Processing Addendum (&quot;<strong>DPA</strong>&quot;) is entered into between:
          </p>
          <ul className="list-disc ml-6 space-y-1">
            <li>
              <strong>Customer / Controller:</strong> the church, ministry, or nonprofit organization
              (&quot;<strong>Church</strong>&quot;) that has an active subscription or contract with PrayerJar.
            </li>
            <li>
              <strong>Processor:</strong> The Prayer Jar (&quot;<strong>PrayerJar</strong>&quot;), operated by
              its owner/operator of record.
            </li>
          </ul>
          <p>This DPA supplements and forms part of the PrayerJar Terms of Service.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">2. Purpose</h2>
          <p>
            PrayerJar processes personal data on behalf of the Church to provide the PrayerJar
            platform — a web and mobile prayer-community service including prayer request
            collection, pastoral-care workflows, member care notes, church prayer walls, and
            related notification features.
          </p>
          <p>
            PrayerJar acts as a <strong>data processor</strong> with respect to Church personal
            data. The Church remains the <strong>data controller</strong> and determines the
            purposes and means of processing.
          </p>
          <p>This DPA is intended to be compatible with:</p>
          <ul className="list-disc ml-6 space-y-1">
            <li>EU General Data Protection Regulation (GDPR)</li>
            <li>UK GDPR and Data Protection Act 2018</li>
            <li>California Consumer Privacy Act / CPRA (to the extent applicable)</li>
            <li>Other comparable data-protection regimes</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">3. Data categories processed</h2>
          <p>Personal data processed under this DPA may include:</p>
          <ul className="list-disc ml-6 space-y-1">
            <li>Identifying data: name, email address, church role/membership</li>
            <li>Authentication data: magic-link tokens, session cookies</li>
            <li>User-generated content: prayer requests, testimonies, comments, pastoral notes, attached images or audio</li>
            <li>Contact metadata: prayer interactions (&quot;I prayed&quot;), partnership requests</li>
            <li>Device and usage data: IP address (limited retention), approximate country, browser/device type</li>
          </ul>
          <p>
            <strong>Special-category / sensitive data.</strong> Prayer content frequently contains
            health, religious, familial, or other sensitive information. PrayerJar treats all
            prayer and pastoral-care content as sensitive pastoral data and does not use it for
            model training, advertising, or any secondary purpose.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">4. Processing terms</h2>
          <p>PrayerJar will:</p>
          <ol className="list-decimal ml-6 space-y-2">
            <li>Process personal data <strong>only on documented instructions</strong> from the Church, unless required by law.</li>
            <li>Ensure personnel authorized to process personal data are bound by confidentiality.</li>
            <li>Implement appropriate <strong>technical and organizational security measures</strong> including TLS, encryption at rest, access controls, and audit logs.</li>
            <li>Assist the Church in responding to <strong>data-subject requests</strong> (access, rectification, erasure, portability, restriction, objection).</li>
            <li>Notify the Church of any <strong>personal-data breach</strong> within <strong>72 hours</strong> of becoming aware, where feasible.</li>
            <li>Make available information necessary to demonstrate compliance with this DPA.</li>
            <li>On termination, delete or return Church personal data as described in Section 9.</li>
          </ol>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">5. Sub-processors</h2>
          <p>
            The Church hereby authorizes PrayerJar to engage the sub-processors listed at{' '}
            <Link href="/legal/subprocessors" className="text-primary underline underline-offset-4">
              /legal/subprocessors
            </Link>{' '}
            (&quot;<strong>Sub-processor List</strong>&quot;).
          </p>
          <p>PrayerJar will:</p>
          <ul className="list-disc ml-6 space-y-1">
            <li>Maintain an up-to-date, public Sub-processor List.</li>
            <li>Impose data-protection obligations on each sub-processor no less protective than those in this DPA.</li>
            <li>Remain liable for its sub-processors&apos; acts and omissions.</li>
            <li>Provide the Church with at least <strong>30 days&apos; notice</strong> before adding a new sub-processor that processes Church personal data.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">6. Data subject rights (DSAR)</h2>
          <p>
            PrayerJar will reasonably assist the Church in fulfilling its obligations to respond to
            data-subject requests, including access, deletion, and rectification. Standard response
            target: <strong>within 30 days</strong> of a verified request.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">7. Breach notification</h2>
          <p>
            On becoming aware of a personal-data breach affecting Church data, PrayerJar will
            notify the Church&apos;s designated contact(s) within <strong>72 hours</strong>,
            providing the nature of the breach, likely consequences, and measures taken or proposed.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">8. Data location</h2>
          <p>
            PrayerJar currently hosts production workloads with <strong>Vercel</strong> (primary
            regions: United States) and stores primary data with <strong>Neon</strong> (United
            States). International transfers from the EEA, UK, or Switzerland are governed by the
            applicable Standard Contractual Clauses (SCCs).
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">9. Term and termination</h2>
          <p>
            This DPA takes effect upon Church acceptance and remains in effect for the duration of
            the Church&apos;s use of PrayerJar. On termination, PrayerJar will, within{' '}
            <strong>30 days</strong>, return or delete all Church personal data, except where
            retention is required by applicable law.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">10. Audit rights</h2>
          <p>
            No more than once per 12 months, and on at least 30 days&apos; prior written notice,
            the Church may request reasonable information demonstrating compliance with this DPA.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">11. Liability</h2>
          <p>
            Liability under this DPA is subject to the limitations of liability set out in the
            PrayerJar Terms of Service, except where applicable data-protection law prohibits such
            limitation.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">12. Governing law</h2>
          <p>
            This DPA is governed by the governing-law and venue provisions of the PrayerJar Terms
            of Service, except to the extent applicable data-protection law of the Church&apos;s
            home jurisdiction requires otherwise.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">13. Nonprofit compatibility</h2>
          <p>
            This DPA is drafted to be compatible with the operational realities of 501(c)(3)
            nonprofit organizations and other ministries. PrayerJar does not use Church data for
            advertising, resale, or AI-model training.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">14. Order of precedence</h2>
          <p>
            If there is a conflict between this DPA and the PrayerJar Terms of Service or Privacy
            Policy, this DPA controls with respect to the processing of personal data.
          </p>
        </section>
      </div>

      {/* ── Acceptance section ──────────────────────────────────────────── */}
      <div className="rounded-lg border bg-card p-6 space-y-4">
        <h2 className="text-base font-semibold">Accept this DPA</h2>

        {!session && (
          <p className="text-sm text-muted-foreground">
            <Link href="/sign-in" className="text-primary underline underline-offset-4">
              Sign in
            </Link>{' '}
            to accept this DPA on behalf of your church.
          </p>
        )}

        {session && !churchId && (
          <p className="text-sm text-muted-foreground">
            To accept this DPA, go to your church dashboard and use the DPA acceptance link there,
            or add{' '}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">?churchId=&lt;your-church-id&gt;</code>{' '}
            to this URL.
          </p>
        )}

        {session && churchId && !church && (
          <p className="text-sm text-destructive">
            Church not found or you are not a member of the specified church.
          </p>
        )}

        {session && church && !canAccept && (
          <p className="text-sm text-muted-foreground">
            Only church administrators and pastors may accept this agreement.
          </p>
        )}

        {session && church && canAccept && (
          <DpaAcceptButton churchId={church.id} churchName={church.name} />
        )}
      </div>

      <p className="mt-8 text-xs text-muted-foreground">
        Questions? Email{' '}
        <a href="mailto:legal@prayerjar.org" className="underline underline-offset-4">
          legal@prayerjar.org
        </a>
        . See also:{' '}
        <Link href="/legal/subprocessors" className="underline underline-offset-4">Sub-processors</Link>
        {' · '}
        <Link href="/privacy" className="underline underline-offset-4">Privacy Policy</Link>
        {' · '}
        <Link href="/terms" className="underline underline-offset-4">Terms of Service</Link>
      </p>
    </main>
  );
}
