import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy Policy | The Prayer Jar" };

export default function PrivacyPage() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold tracking-tight mb-2">Privacy Policy</h1>
      <p className="text-sm text-muted-foreground mb-10">Last updated: April 2026</p>

      <div className="space-y-8 text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">What we collect</h2>
          <p>
            When you sign in, we collect your email address to create your account and send
            sign-in links. We do not collect passwords. If you submit a prayer request with your
            name, that name is stored and may be visible to other users. Anonymous requests do not
            display your name or email.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">How we use your data</h2>
          <p>
            Your email is used to send sign-in links and optional prayer notification emails
            (based on your settings). We do not sell your data. We do not share your data with
            third parties except as required to operate the service (email delivery via Resend).
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">Cookies and sessions</h2>
          <p>
            We use a session cookie to keep you signed in. No advertising or tracking cookies
            are used.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">Data retention</h2>
          <p>
            Prayer requests expire after 30 days and are removed from the public feed. Your
            account data is retained until you request deletion. To delete your account and all
            associated data, contact us at the email below.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">Contact</h2>
          <p>
            For privacy questions or data deletion requests, email us at{" "}
            <a href="mailto:hello@prayerjar.org" className="text-primary underline underline-offset-4">
              hello@prayerjar.org
            </a>.
          </p>
        </section>
      </div>
    </main>
  );
}
