import type { Metadata } from "next";

export const metadata: Metadata = { title: "Trust & Safety | The Prayer Jar" };

export default function TrustPage() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-16">
      <div className="mb-12 text-center">
        <h1 className="text-3xl font-bold tracking-tight mb-4">Trust &amp; Safety</h1>
        <p className="text-muted-foreground leading-relaxed">
          You&apos;re sharing something real and vulnerable here. Here&apos;s exactly how we handle that.
        </p>
      </div>

      <div className="space-y-10 leading-relaxed">

        <section>
          <h2 className="text-base font-semibold text-foreground mb-3">Your privacy</h2>
          <div className="space-y-4 text-sm text-muted-foreground">
            <p>
              Every prayer request can be submitted anonymously. If you choose anonymous, your
              name never appears — not on the request, not in the feed, not anywhere. No one can
              link what you&apos;ve written back to you.
            </p>
            <p>
              We do not run ads. We do not sell data. We do not partner with third parties for
              marketing purposes. The only reason your information exists in our system is to
              make the service work.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-3">How moderation works</h2>
          <div className="space-y-4 text-sm text-muted-foreground">
            <p>
              Every prayer request is reviewed by AI before it goes live. This is not about
              filtering out uncomfortable topics — grief, addiction, fear, and crisis belong here.
              Moderation exists to catch content that could cause harm to others, and to make sure
              no one falls through a crack alone.
            </p>
            <p>
              If your submission includes language that suggests self-harm or crisis, you will
              immediately see links to crisis resources — the 988 Suicide and Crisis Lifeline,
              the Crisis Text Line, and others. Your request is still processed with care. You
              are not turned away.
            </p>
            <p>
              Content that is abusive, off-topic, or intended to harm is removed before it ever
              reaches anyone else. No human moderator has to read it first.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-3">What we store</h2>
          <div className="space-y-4 text-sm text-muted-foreground">
            <p>
              When you submit a prayer request, we store the prayer content, the timestamp, and
              the category you selected. If you provided a name, that is stored too. That is the
              complete list.
            </p>
            <p>
              If you are signed in with an account, we also store your email address — used only
              to send sign-in links and optional prayer activity notifications, based on your
              settings. We do not store passwords.
            </p>
            <p>
              We do not build profiles. We do not track browsing behavior. We do not use analytics
              platforms that fingerprint users across the web.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-3">Your control</h2>
          <div className="space-y-4 text-sm text-muted-foreground">
            <p>
              If your prayer is answered, you can mark it as answered. It moves off the active
              feed and onto the Praise Wall — a quiet record of something good that happened. You
              are in control of that transition.
            </p>
            <p>
              If you do nothing, prayer requests automatically expire after 30 days and are
              removed from the public feed. You do not need to remember to take it down.
            </p>
            <p>
              To delete your account and all associated data, email us and we will handle it
              promptly. There is no retention period after a deletion request.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-3">Who built this</h2>
          <div className="space-y-4 text-sm text-muted-foreground">
            <p>
              The Prayer Jar is built and maintained by a small independent team. Not a
              corporation, not a VC-backed startup with a growth mandate. This project exists
              because someone believed a tool like this should exist — and built it.
            </p>
            <p>
              There is no board requiring engagement metrics. There is no pressure to monetize
              your attention. The incentives here are simple: keep the thing working, keep it
              safe, keep it honest.
            </p>
          </div>
        </section>

        <section className="border-t pt-10">
          <h2 className="text-base font-semibold text-foreground mb-3">Questions?</h2>
          <div className="space-y-4 text-sm text-muted-foreground">
            <p>
              If something here is unclear, or if you have a concern about your data or a prayer
              request, reach out directly. A real person reads these.
            </p>
            <p>
              <a
                href="mailto:hello@prayerjar.org"
                className="text-primary underline underline-offset-4"
              >
                hello@prayerjar.org
              </a>
            </p>
          </div>
        </section>

      </div>
    </main>
  );
}
