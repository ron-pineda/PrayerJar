import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms of Service | The Prayer Jar" };

export default function TermsPage() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold tracking-tight mb-2">Terms of Service</h1>
      <p className="text-sm text-muted-foreground mb-10">Last updated: April 2026</p>

      <div className="space-y-8 text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">Use of the service</h2>
          <p>
            The Prayer Jar is a community platform for sharing and praying over prayer requests.
            By using this service, you agree to use it respectfully and in good faith. You must
            be at least 13 years old to create an account.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">Content guidelines</h2>
          <p>
            You are responsible for the content you submit. Do not post content that is harmful,
            abusive, hateful, or unrelated to prayer. We reserve the right to remove any content
            that violates these guidelines and to suspend accounts that repeatedly do so.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">No guarantees</h2>
          <p>
            The Prayer Jar is provided as-is. We do not guarantee uptime, data retention beyond
            our stated policies, or any specific outcome from using the service. Prayer requests
            expire after 30 days.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">Changes to these terms</h2>
          <p>
            We may update these terms from time to time. Continued use of the service after
            changes constitutes acceptance of the new terms. We'll note the date of the last
            update at the top of this page.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">Contact</h2>
          <p>
            Questions about these terms?{" "}
            <a href="mailto:hello@prayerjar.app" className="text-primary underline underline-offset-4">
              hello@prayerjar.app
            </a>
          </p>
        </section>
      </div>
    </main>
  );
}
